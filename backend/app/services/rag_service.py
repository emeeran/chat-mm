import os
import requests
import concurrent.futures
from functools import lru_cache
from bs4 import BeautifulSoup
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.chains import RetrievalQA
from langchain_community.utilities import DuckDuckGoSearchAPIWrapper
from langchain.agents import initialize_agent, Tool
from langchain.agents import AgentType
from flask import current_app, has_app_context
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class RAGService:
    """Service for Retrieval Augmented Generation"""
    
    def __init__(self):
        self.embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        self._init_vector_store()
        self.search = DuckDuckGoSearchAPIWrapper()
        self._document_cache = {}  # Cache for document retrieval
        self._web_search_cache = {}  # Cache for web search results
        self.max_workers = 4  # Number of parallel workers for web search
    
    def _init_vector_store(self):
        """Initialize the vector store"""
        try:
            # Get vector store path, safely handling if we're outside app context
            if has_app_context():
                vector_store_path = current_app.config.get('VECTOR_STORE_PATH', 'faiss_index')
            else:
                vector_store_path = 'faiss_index'
                
            self.vector_store = FAISS.load_local(vector_store_path, self.embeddings, allow_dangerous_deserialization=True)
            self.retriever = self.vector_store.as_retriever(search_kwargs={"k": 5})
        except Exception as e:
            # If index doesn't exist yet, create an empty one
            logger.warning(f"Failed to load vector store: {str(e)}. Creating empty store.")
            self.vector_store = FAISS.from_texts(["Initialize empty vector store"], self.embeddings)
            self.retriever = self.vector_store.as_retriever(search_kwargs={"k": 5})
    
    def _fetch_url_content(self, url: str, max_chars: int = 800) -> str:
        """Fetch content from a URL with error handling and timeout"""
        try:
            response = requests.get(url, timeout=3)
            if response.status_code != 200:
                return f"Failed to fetch content from {url} (Status: {response.status_code})"
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract text and clean it up
            text = soup.get_text(separator=' ', strip=True)
            # Limit to max_chars to prevent overwhelming the LLM
            return f"Source: {url}\n{text[:max_chars]}..."
        except Exception as e:
            logger.warning(f"Error fetching {url}: {str(e)}")
            return f"Error fetching {url}: {str(e)}"
    
    @lru_cache(maxsize=100)
    def web_search(self, query: str, max_results: int = 3) -> str:
        """Perform a web search and retrieve content using parallel processing"""
        # Check cache first
        cache_key = f"{query}_{max_results}"
        if cache_key in self._web_search_cache:
            return self._web_search_cache[cache_key]
        
        try:
            results = self.search.results(query, max_results=max_results)
            
            if not results:
                return "No relevant web results found."
            
            # Use thread pool to fetch URL contents in parallel
            with concurrent.futures.ThreadPoolExecutor(max_workers=self.max_workers) as executor:
                # Submit all URL fetch tasks
                future_to_url = {
                    executor.submit(self._fetch_url_content, result['link']): result['link']
                    for result in results
                }
                
                # Collect results as they complete
                contents = []
                for future in concurrent.futures.as_completed(future_to_url):
                    if future.result() and "Error fetching" not in future.result():
                        contents.append(future.result())
            
            result_text = "\n\n".join(contents) if contents else "No relevant web results found."
            
            # Cache the result
            self._web_search_cache[cache_key] = result_text
            
            return result_text
        except Exception as e:
            logger.error(f"Error in web search: {str(e)}")
            return f"Error performing web search: {str(e)}"
    
    @lru_cache(maxsize=50)
    def document_search(self, query: str) -> str:
        """Search documents and return relevant content with caching"""
        # Check cache first
        if query in self._document_cache:
            return self._document_cache[query]
        
        try:
            docs = self.retriever.get_relevant_documents(query)
            
            if not docs:
                return "No relevant documents found in the knowledge base."
            
            # Join document contents with source information when available
            result = []
            for doc in docs:
                content = doc.page_content
                metadata = getattr(doc, 'metadata', {})
                source = metadata.get('source', 'Unknown source')
                result.append(f"Source: {source}\n{content}")
            
            result_text = "\n\n".join(result)
            
            # Cache the result
            self._document_cache[query] = result_text
            
            return result_text
        except Exception as e:
            logger.error(f"Error in document search: {str(e)}")
            return f"Error searching documents: {str(e)}"
    
    def get_rag_chain(self, llm, use_web: bool = False, use_rag: bool = True):
        """Get a RAG chain with optional web search and/or document search capabilities
        
        Args:
            llm: The language model to use
            use_web: Whether to include web search tool
            use_rag: Whether to include document search (RAG) tool
        """
        tools = []
        
        if use_web:
            tools.append(
                Tool(
                    name="Web Search",
                    func=self.web_search,
                    description="Useful for finding current information from the web."
                )
            )
        
        # Create a retrieval tool for local documents if RAG is enabled
        if use_rag:
            retrieval_tool = Tool(
                name="Document Search",
                func=self.document_search,
                description="Useful for searching information from the knowledge base."
            )
            tools.append(retrieval_tool)
        
        # If no tools are provided, use the LLM directly instead of creating an agent
        if not tools:
            from langchain.chains import LLMChain
            from langchain.prompts import PromptTemplate
            
            template = """You are a helpful AI assistant. Answer the user's question based on your knowledge.
            
            Question: {query}
            
            Answer:"""
            
            prompt = PromptTemplate(template=template, input_variables=["query"])
            return LLMChain(llm=llm, prompt=prompt)
        
        # Create a custom output parser to format the final response
        from langchain.agents import AgentOutputParser
        from langchain.schema import AgentAction, AgentFinish
        from typing import Union
        
        class CleanOutputParser(AgentOutputParser):
            def parse(self, text: str) -> Union[AgentAction, AgentFinish]:
                # Extract just the "Final Answer" part if it exists
                if "Final Answer:" in text:
                    answer = text.split("Final Answer:")[-1].strip()
                    return AgentFinish(
                        return_values={"output": answer},
                        log=text,
                    )
                # Otherwise return the standard parse result
                from langchain.agents.agent import AgentOutputParser
                return AgentOutputParser().parse(text)
        
        # Create and return the agent with verbose=False to hide intermediate steps
        return initialize_agent(
            tools=tools,
            llm=llm,
            agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
            verbose=False,  # Set to False to hide intermediate steps
            handle_parsing_errors=True,
            return_intermediate_steps=False  # Don't include intermediate steps in output
        ) 
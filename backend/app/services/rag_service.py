import os
import requests
from bs4 import BeautifulSoup
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.chains import RetrievalQA
from langchain_community.utilities import DuckDuckGoSearchAPIWrapper
from langchain.agents import initialize_agent, Tool
from langchain.agents import AgentType
from flask import current_app, has_app_context

class RAGService:
    """Service for Retrieval Augmented Generation"""
    
    def __init__(self):
        self.embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        self._init_vector_store()
        self.search = DuckDuckGoSearchAPIWrapper()
    
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
            import logging
            logging.warning(f"Failed to load vector store: {str(e)}. Creating empty store.")
            self.vector_store = FAISS.from_texts(["Initialize empty vector store"], self.embeddings)
            self.retriever = self.vector_store.as_retriever(search_kwargs={"k": 5})
    
    def web_search(self, query: str):
        """Perform a web search and retrieve content"""
        results = self.search.results(query, max_results=3)
        contents = []
        
        for result in results:
            try:
                response = requests.get(result['link'], timeout=5)
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Extract text and clean it up
                text = soup.get_text(separator=' ', strip=True)
                # Limit to ~500 chars to prevent overwhelming the LLM
                contents.append(f"Source: {result['link']}\n{text[:500]}...")
            except Exception as e:
                continue
                
        return "\n\n".join(contents) if contents else "No relevant web results found."
    
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
                func=lambda q: "\n".join([doc.page_content for doc in self.retriever.get_relevant_documents(q)]),
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
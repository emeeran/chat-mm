import os
import sys
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader, TextLoader
import glob

def create_vector_store(documents_path='./documents', index_path='faiss_index'):
    """Create a FAISS vector store from documents in the specified path"""
    print(f"Creating vector store from documents in {documents_path}")
    
    # Create documents directory if it doesn't exist
    if not os.path.exists(documents_path):
        os.makedirs(documents_path)
        print(f"Created documents directory at {documents_path}")
        
    # Create a sample document if none exists
    sample_path = os.path.join(documents_path, 'sample.txt')
    if not os.path.exists(sample_path):
        with open(sample_path, 'w') as f:
            f.write("""
# Sample Knowledge Base Document

This is a sample document for the RAG Chat Application. 

The RAG Chat App allows users to:
1. Ask questions about documents in the knowledge base
2. Search the web for up-to-date information
3. Choose between different LLM providers

To add more documents to the knowledge base, place them in the 'documents' folder
and run this script again to update the index.
            """)
        print("Created sample document")
    
    try:
        # Find all text and PDF files
        text_files = glob.glob(os.path.join(documents_path, "**/*.txt"), recursive=True)
        pdf_files = glob.glob(os.path.join(documents_path, "**/*.pdf"), recursive=True)
        
        if not text_files and not pdf_files:
            print("No text or PDF files found. Using only the sample document.")
        
        # Read the content of each file
        documents = []
        
        # Process text files
        for file_path in text_files:
            try:
                print(f"Loading text file: {file_path}")
                loader = TextLoader(file_path, encoding="utf-8", autodetect_encoding=True)
                loaded_docs = loader.load()
                documents.extend(loaded_docs)
                print(f"Loaded: {file_path}")
            except Exception as e:
                print(f"Error reading {file_path}: {str(e)}")
        
        # Process PDF files
        for file_path in pdf_files:
            try:
                print(f"Loading PDF file: {file_path}")
                loader = PyPDFLoader(file_path)
                loaded_docs = loader.load()
                documents.extend(loaded_docs)
                print(f"Loaded: {file_path} ({len(loaded_docs)} pages)")
            except Exception as e:
                print(f"Error reading {file_path}: {str(e)}")
                import traceback
                traceback.print_exc()
        
        if not documents:
            print("No documents were successfully loaded. Creating an empty index.")
            empty_text = "This is an empty vector store. Please add documents and reindex."
            documents = [{"page_content": empty_text, "metadata": {"source": "empty"}}]
        
        print(f"Total documents loaded: {len(documents)}")
        
        # Split documents into chunks
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        chunks = text_splitter.split_documents(documents)
        
        print(f"Split into {len(chunks)} chunks")
        
        # Create embeddings and vector store
        print("Initializing embeddings model...")
        embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        
        print("Creating vector store...")
        vector_store = FAISS.from_documents(chunks, embeddings)
        
        # Save vector store with allow_dangerous_serialization set to True
        print(f"Saving vector store to {index_path}")
        vector_store.save_local(index_path)
        
        return True
    except Exception as e:
        print(f"Error creating vector store: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    # Use command line arguments or default paths
    docs_path = sys.argv[1] if len(sys.argv) > 1 else './documents'
    idx_path = sys.argv[2] if len(sys.argv) > 2 else 'faiss_index'
    
    if create_vector_store(docs_path, idx_path):
        print("Index created successfully!")
    else:
        print("Failed to create index.") 
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Application configuration class"""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-key-change-in-production')
    CORS_HEADERS = 'Content-Type'
    DEBUG = os.environ.get('DEBUG', 'False') == 'True'
    
    # LLM API keys
    OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '')
    COHERE_API_KEY = os.environ.get('COHERE_API_KEY', '')
    HF_API_KEY = os.environ.get('HF_API_KEY', '')
    HUGGINGFACE_API_KEY = os.environ.get('HUGGINGFACE_API_KEY', '')
    
    # Vector store settings
    VECTOR_STORE_PATH = os.environ.get('VECTOR_STORE_PATH', 'faiss_index') 
import os
from flask import Flask
from flask_cors import CORS
from langchain.globals import set_debug
from . import socketio
from .routes.chat_routes import chat_bp
from .services.rag_service import RAGService
from .services.llm_service import LLMFactory
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def create_app(test_config=None):
    """Create and configure the Flask application."""
    app = Flask(__name__, instance_relative_config=True)
    
    # Configure CORS to allow requests from the frontend
    CORS(app)
    
    # Enable Socket.IO for real-time communication
    socketio.init_app(app, cors_allowed_origins="*")
    
    # Application Configuration
    app.config.from_mapping(
        SECRET_KEY=os.environ.get('SECRET_KEY', 'dev'),
        OPENAI_API_KEY=os.environ.get('OPENAI_API_KEY', ''),
        COHERE_API_KEY=os.environ.get('COHERE_API_KEY', ''),
        HF_API_KEY=os.environ.get('HF_API_KEY', ''),
        HUGGINGFACE_API_KEY=os.environ.get('HUGGINGFACE_API_KEY', ''),
        GROQ_API_KEY=os.environ.get('GROQ_API_KEY', ''),
        MISTRAL_API_KEY=os.environ.get('MISTRAL_API_KEY', ''),
        ANTHROPIC_API_KEY=os.environ.get('ANTHROPIC_API_KEY', ''),
        XAI_API_KEY=os.environ.get('XAI_API_KEY', ''),
        DEEPSEEK_API_KEY=os.environ.get('DEEPSEEK_API_KEY', ''),
        DASHSCOPE_API_KEY=os.environ.get('DASHSCOPE_API_KEY', ''),
    )
    
    # Check if OpenAI API key is set
    if not app.config['OPENAI_API_KEY']:
        logger.warning("OPENAI_API_KEY is not set! The application may not function correctly.")
    
    # Log which providers have API keys configured
    providers = {
        'OpenAI': bool(app.config['OPENAI_API_KEY']),
        'Cohere': bool(app.config['COHERE_API_KEY']),
        'HuggingFace': bool(app.config['HF_API_KEY'] or app.config['HUGGINGFACE_API_KEY']),
        'Groq': bool(app.config['GROQ_API_KEY']),
        'Mistral': bool(app.config['MISTRAL_API_KEY']),
        'Anthropic': bool(app.config['ANTHROPIC_API_KEY']),
        'X AI': bool(app.config['XAI_API_KEY']),
        'DeepSeek': bool(app.config['DEEPSEEK_API_KEY']),
        'Alibaba': bool(app.config['DASHSCOPE_API_KEY']),
    }
    
    logger.info("API Keys configured for: %s", 
                ", ".join([p for p, has_key in providers.items() if has_key]) or "None")
    
    # Override configuration if test_config is provided
    if test_config is not None:
        app.config.from_mapping(test_config)
    
    # Initialize services
    rag_service = RAGService()
    llm_factory = LLMFactory()
    
    # Make services available to the application
    app.config['rag_service'] = rag_service
    app.config['llm_factory'] = llm_factory
    
    # Enable debug mode for LangChain if needed
    if os.environ.get('LANGCHAIN_DEBUG', 'false').lower() == 'true':
        set_debug(True)
    
    # Register blueprints
    app.register_blueprint(chat_bp)
    
    return app 
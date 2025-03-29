from flask import Flask
from flask_socketio import SocketIO
from flask_cors import CORS
from .config import Config

socketio = SocketIO(cors_allowed_origins="*")

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Enable CORS
    CORS(app)
    
    # Register blueprints
    from .routes.chat_routes import chat_bp
    app.register_blueprint(chat_bp)
    
    # Initialize extensions
    socketio.init_app(app)
    
    # Preload services
    from .services.rag_service import RAGService
    from .services.llm_service import LLMFactory
    
    app.config['rag_service'] = RAGService()
    app.config['llm_factory'] = LLMFactory()

    return app 
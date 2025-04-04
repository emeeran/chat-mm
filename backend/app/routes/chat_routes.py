from flask import Blueprint, request, jsonify, current_app
from .. import socketio
from langchain.callbacks.base import BaseCallbackHandler
import logging
import datetime
import uuid

logger = logging.getLogger(__name__)

chat_bp = Blueprint('chat', __name__, url_prefix='/api/chat')

class SocketIOCallbackHandler(BaseCallbackHandler):
    """Callback handler for streaming LLM responses to SocketIO"""
    
    def __init__(self, socket_id):
        super().__init__()
        self.socket_id = socket_id
    
    def on_llm_new_token(self, token, **kwargs):
        """Stream tokens as they're generated"""
        socketio.emit('chat_response', {
            'content': token,
            'status': 'streaming'
        }, room=self.socket_id)

class StreamingCallbackHandler(BaseCallbackHandler):
    """Callback handler for streaming LLM responses to SocketIO using the 'message' event"""
    
    def __init__(self, socket_id):
        super().__init__()
        self.socket_id = socket_id
    
    def on_llm_new_token(self, token, **kwargs):
        """Stream tokens as they're generated"""
        socketio.emit('message', {
            'type': 'stream',
            'content': token
        }, room=self.socket_id)

@chat_bp.route('/health', methods=['GET'])
def health_check():
    """Simple health check endpoint"""
    return jsonify({'status': 'ok'})

@chat_bp.route('/models', methods=['GET'])
def get_models():
    """Return available models for all providers"""
    llm_factory = current_app.config['llm_factory']
    return jsonify(llm_factory.get_available_models())

@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    socketio.emit('system_message', {
        'content': 'Connected to server',
        'status': 'info'
    })

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    logger.info("Client disconnected")

@socketio.on('message')
def handle_message(data):
    """Handle generic message event from client"""
    socket_id = request.sid
    logger.info(f"Received message: {data}")
    
    # Extract data from the message
    message_type = data.get('type', 'message')
    content = data.get('content')
    provider = data.get('provider', 'openai')
    model_id = data.get('model')
    mode = data.get('mode', 'llm')
    
    if not content:
        socketio.emit('message', {
            'type': 'error',
            'content': 'Content is required'
        }, room=socket_id)
        return
    
    try:
        # Get services
        llm_factory = current_app.config['llm_factory']
        rag_service = current_app.config['rag_service']
        
        # Configure LLM with custom callback handler
        callback_handler = StreamingCallbackHandler(socket_id)
        
        try:
            # Try to get the requested model
            llm = llm_factory.get_llm(provider, model_id=model_id)
            actual_provider = provider
        except Exception as e:
            if provider != 'openai':
                # If not OpenAI and there was an error, fall back to OpenAI
                logger.warning(f"Error using provider {provider}: {str(e)}. Falling back to OpenAI.")
                llm = llm_factory.get_llm('openai')
                actual_provider = 'openai'
                
                # Notify client about fallback
                socketio.emit('message', {
                    'type': 'error',
                    'content': f"API key missing or invalid for {provider}. Falling back to OpenAI."
                }, room=socket_id)
            else:
                # If OpenAI failed, return error
                raise
        
        # Patch the LLM callbacks to include our handler
        if not hasattr(llm, 'callbacks') or llm.callbacks is None:
            llm.callbacks = [callback_handler]
        else:
            llm.callbacks.append(callback_handler)
        
        # Use RAG if mode is 'rag', otherwise just use LLM
        use_rag = mode == 'rag'
        use_web = mode == 'web'
        
        # Create chain and run query
        if mode == 'llm':
            chain = llm
        else:
            chain = rag_service.get_rag_chain(llm, use_web, use_rag)
        
        # Run in a background thread to not block the main thread
        def run_chain():
            try:
                # Start a new stream for the assistant's response
                socketio.emit('message', {
                    'type': 'stream',
                    'content': ''  # Initial empty content
                }, room=socket_id)
                
                if mode == 'llm':
                    result = llm.invoke(content)
                else:
                    result = chain.run(content)
                
                # Signal completion
                socketio.emit('message', {
                    'type': 'done',
                    'content': ''
                }, room=socket_id)
                
                # Send metadata about the response
                socketio.emit('message', {
                    'type': 'metadata',
                    'content': {
                        'provider': actual_provider,
                        'model': model_id,
                        'mode': mode,
                        'timestamp': str(datetime.datetime.now())
                    }
                }, room=socket_id)
                
            except Exception as e:
                error_msg = str(e)
                logger.error(f"Error in chain: {error_msg}")
                socketio.emit('message', {
                    'type': 'error',
                    'content': f"Error processing your query: {error_msg}"
                }, room=socket_id)
        
        socketio.start_background_task(run_chain)
        
        # Send acknowledgment
        socketio.emit('ack', {
            'status': 'processing',
            'message_id': str(uuid.uuid4())
        }, room=socket_id)
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Unhandled error in message: {error_msg}")
        socketio.emit('message', {
            'type': 'error',
            'content': f"Server error: {error_msg}"
        }, room=socket_id)

@socketio.on('chat_query')
def handle_chat_query(data):
    """Handle chat query from client"""
    socket_id = request.sid
    query = data.get('query')
    provider = data.get('provider', 'openai')
    model_id = data.get('model_id', None)  # Get model_id from request data
    use_web = data.get('use_web', False)
    use_rag = data.get('use_rag', True)  # New parameter to toggle RAG functionality, default is True
    
    if not query:
        socketio.emit('chat_response', {
            'error': 'Query is required',
            'status': 'error'
        }, room=socket_id)
        return
    
    try:
        # Get services
        llm_factory = current_app.config['llm_factory']
        rag_service = current_app.config['rag_service']
        
        # Configure LLM with custom callback handler
        callback_handler = SocketIOCallbackHandler(socket_id)
        
        try:
            # Try to get the requested model
            llm = llm_factory.get_llm(provider, model_id=model_id)
            actual_provider = provider
        except Exception as e:
            if provider != 'openai':
                # If not OpenAI and there was an error, fall back to OpenAI
                logger.warning(f"Error using provider {provider}: {str(e)}. Falling back to OpenAI.")
                llm = llm_factory.get_llm('openai')
                actual_provider = 'openai'
                
                # Notify client about fallback
                socketio.emit('system_message', {
                    'content': f"API key missing or invalid for {provider}. Falling back to OpenAI.",
                    'status': 'warning'
                }, room=socket_id)
            else:
                # If OpenAI failed, return error
                raise
        
        # Patch the LLM callbacks to include our handler
        if not hasattr(llm, 'callbacks') or llm.callbacks is None:
            llm.callbacks = [callback_handler]
        else:
            llm.callbacks.append(callback_handler)
        
        # Create RAG chain and run query
        rag_chain = rag_service.get_rag_chain(llm, use_web, use_rag)
        
        # Run in a background thread to not block the main thread
        def run_chain():
            try:
                result = rag_chain.run(query)
                # Signal completion
                socketio.emit('chat_response', {
                    'content': '',
                    'status': 'complete'
                }, room=socket_id)
            except Exception as e:
                error_msg = str(e)
                logger.error(f"Error in RAG chain: {error_msg}")
                socketio.emit('chat_response', {
                    'error': f"Error processing your query: {error_msg}",
                    'status': 'error'
                }, room=socket_id)
        
        socketio.start_background_task(run_chain)
    
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Unhandled error in chat query: {error_msg}")
        socketio.emit('chat_response', {
            'error': f"Server error: {error_msg}",
            'status': 'error'
        }, room=socket_id) 
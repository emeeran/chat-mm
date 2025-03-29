# RAG Chat Application

A real-time chat application with Retrieval Augmented Generation (RAG) capabilities, web search integration, and support for multiple LLM providers.

![RAG Chat Screenshot](./screenshot.png)

## Features

- **Real-time streaming responses** with WebSockets
- **Dynamic RAG** combining document knowledge base with web search
- **Multiple LLM providers** (OpenAI, Cohere, HuggingFace)
- **Modern UI/UX** with dark/light mode, animations, and responsive design
- **Markdown and code syntax highlighting** support in messages
- **Token-by-token streaming** for fast response times

## Technology Stack

### Backend
- **Flask** with Flask-SocketIO for real-time communication
- **LangChain** for RAG implementation and agent orchestration
- **FAISS** for vector storage and similarity search
- **DuckDuckGo Search API** for web search integration
- **UV** for Python package management
- **HuggingFace Embeddings** for document encoding

### Frontend
- **React 18** with Vite for fast development
- **Material UI** for modern component design
- **Framer Motion** for smooth animations
- **Socket.IO** client for WebSocket communication
- **React Markdown** for rendering markdown in messages
- **Syntax Highlighter** for code block formatting

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- UV package manager

### Backend Setup

1. Clone the repository:
```bash
git clone https://github.com/your-username/rag-chat.git
cd rag-chat
```

2. Set up environment variables:
```bash
cd backend
cp .env.example .env
# Edit the .env file with your API keys
```

3. Install dependencies:
```bash
uv install
```

4. Create the vector store:
```bash
python create_index.py
```

5. Start the backend server:
```bash
python run.py
```

### Frontend Setup

1. Install dependencies:
```bash
cd ../frontend
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`

## Document Management

To add documents to the knowledge base:

1. Place your text files in the `backend/documents` directory
2. Run the index creation script:
```bash
cd backend
python create_index.py
```

## Configuration Options

### Backend Configuration
- `SECRET_KEY`: Flask secret key
- `DEBUG`: Enable/disable debug mode
- `OPENAI_API_KEY`: OpenAI API key
- `COHERE_API_KEY`: Cohere API key
- `HF_API_KEY`: HuggingFace API key
- `VECTOR_STORE_PATH`: Path to the FAISS index

### Frontend Configuration
The frontend can be configured via the Vite config file at `frontend/vite.config.js`.

## Production Deployment

For production deployment:

1. Build the frontend:
```bash
cd frontend
npm run build
```

2. Configure a production-ready server (Gunicorn, uWSGI) for the Flask backend
3. Set up a reverse proxy (Nginx, Apache) to handle static files and forward API requests

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- LangChain for the RAG framework
- OpenAI, Cohere, and HuggingFace for LLM APIs
- Material UI for the component library
- All other open-source libraries used in this project 
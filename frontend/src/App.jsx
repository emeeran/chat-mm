import React, { useState, useEffect, useRef } from 'react';
import { Box, CssBaseline, Snackbar, Alert } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import Header from './components/Header';
import ChatWindow from './components/ChatWindow';
import { SocketProvider, useSocket } from './services/socketContext';
import { createTheme } from '@mui/material/styles';
import Sidebar from './components/Sidebar';

// Create AppContent component that has access to socket context
const AppContent = () => {
  const { socket, isConnected } = useSocket();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [availableModels, setAvailableModels] = useState({});
  const [provider, setProvider] = useState('openai');
  const [modelId, setModelId] = useState('');
  const [mode, setMode] = useState('llm');
  const [responseMetadata, setResponseMetadata] = useState(null);
  const [providerWarnings, setProviderWarnings] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const inputRef = useRef(null);

  // Toggle dark/light mode
  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem('darkMode', JSON.stringify(newMode));
      return newMode;
    });
  };

  // Create theme based on dark mode state
  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? 'dark' : 'light',
          primary: {
            main: '#5865F2',
          },
          secondary: {
            main: '#EB459E',
          },
          background: {
            default: darkMode ? '#1e1e1e' : '#f5f5f5',
            paper: darkMode ? '#252525' : '#ffffff',
          },
        },
        typography: {
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif",
        },
        shape: {
          borderRadius: 10,
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                scrollbarWidth: 'thin',
                '&::-webkit-scrollbar': {
                  width: '8px',
                  height: '8px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: 'transparent',
                },
              },
            },
          },
        },
      }),
    [darkMode]
  );

  // Fetch available models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('/api/chat/models');
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setAvailableModels(data);
        // Set default model for the current provider
        if (data[provider] && data[provider].length > 0) {
          setModelId(data[provider][0].id);
        }
      } catch (error) {
        console.error('Error fetching models:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load available models',
          severity: 'error'
        });

        // Set some fallback models
        const fallbackModels = {
          'openai': [
            {'id': 'gpt-4o', 'name': 'GPT-4o', 'description': 'Advanced model'},
            {'id': 'gpt-4o-mini', 'name': 'GPT-4o Mini', 'description': 'Fast model'},
          ],
          'groq': [
            {'id': 'llama-3.1-8b-instant', 'name': 'Llama 3.1 8B', 'description': 'Fast model'},
            {'id': 'llama-3.3-70b-versatile', 'name': 'Llama 3.3 70B', 'description': 'Large model'},
          ]
        };
        
        setAvailableModels(fallbackModels);
        setModelId(fallbackModels[provider]?.[0]?.id || 'gpt-4o');
      }
    };
    
    fetchModels();
  }, [provider]);

  // Update model when provider changes
  useEffect(() => {
    if (availableModels[provider] && availableModels[provider].length > 0) {
      setModelId(availableModels[provider][0].id);
    }
  }, [provider, availableModels]);

  // Handle incoming messages
  useEffect(() => {
    if (!socket) return;

    const handleChatResponse = (data) => {
      if (data.status === 'streaming') {
        setMessages(prev => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg && lastMsg.type === 'bot' && isStreaming) {
            return [
              ...prev.slice(0, -1),
              { ...lastMsg, text: lastMsg.text + data.content }
            ];
          } else {
            setIsStreaming(true);
            return [...prev, { id: Date.now(), type: 'bot', text: data.content }];
          }
        });
      } else if (data.status === 'complete') {
        setIsStreaming(false);
        // Store response metadata
        setResponseMetadata({
          model: getModelName(),
          time: data.time_taken?.toFixed(2) || null,
          tokens: data.tokens || null
        });
      } else if (data.status === 'error') {
        setMessages(prev => [
          ...prev,
          { id: Date.now(), type: 'error', text: data.error || 'An error occurred' }
        ]);
        setIsStreaming(false);
        setSnackbar({
          open: true,
          message: data.error || 'An error occurred',
          severity: 'error'
        });
      }
    };

    const handleSystemMessage = (data) => {
      if (data.status === 'warning' && data.content.includes('API key')) {
        setProviderWarnings(prev => ({ ...prev, [provider]: true }));
        setSnackbar({
          open: true,
          message: data.content,
          severity: 'warning'
        });
      }
    };

    socket.on('chat_response', handleChatResponse);
    socket.on('system_message', handleSystemMessage);

    return () => {
      socket.off('chat_response', handleChatResponse);
      socket.off('system_message', handleSystemMessage);
    };
  }, [socket, isStreaming, provider, mode]);

  // Handle input change
  const handleInputChange = (e) => {
    setUserInput(e.target.value);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userInput.trim() || !isConnected || isStreaming) return;

    // Add user message
    const userMessage = { id: Date.now(), type: 'user', text: userInput.trim() };
    setMessages(prev => [...prev, userMessage]);

    // Determine RAG and Web Search settings based on selected mode
    const use_rag = mode === 'rag_llm' || mode === 'rag_llm_web';
    const use_web = mode === 'rag_llm_web';

    // Send to server
    socket.emit('chat_query', {
      query: userInput.trim(),
      provider,
      model_id: modelId,
      use_web,
      use_rag
    });

    // Clear input
    setUserInput('');
  };

  // Handle clearing chat
  const handleClearChat = () => {
    setMessages([]);
    setResponseMetadata(null);
    setSidebarOpen(false);
  };

  // Handle retrying last message
  const handleRetryLast = () => {
    if (isStreaming) return;
    
    const lastUserMessage = [...messages].reverse().find(msg => msg.type === 'user');
    if (lastUserMessage) {
      setUserInput(lastUserMessage.text);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
    
    setSidebarOpen(false);
  };

  // Handle exporting chat
  const handleExportChat = () => {
    if (messages.length === 0) return;
    
    // Format the chat for export
    const formattedChat = messages
      .filter(msg => msg.type !== 'info')
      .map(msg => {
        if (msg.type === 'user') {
          return `User: ${msg.text}`;
        } else if (msg.type === 'bot') {
          return `AI: ${msg.text}`;
        } else {
          return `System: ${msg.text}`;
        }
      })
      .join('\n\n');
    
    // Add metadata
    const metadata = `Chat-MM Export\nDate: ${new Date().toLocaleString()}\nModel: ${getProviderName(provider)} ${getModelName()}\nMode: ${mode}\n\n`;
    const exportText = metadata + formattedChat;
    
    // Create and download file
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-mm-export-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setSidebarOpen(false);
  };

  // Handle new chat
  const handleNewChat = () => {
    handleClearChat();
  };

  // Handle provider change
  const handleProviderChange = (e) => {
    setProvider(e.target.value);
    setSnackbar({ open: false, message: '', severity: 'info' });
  };

  // Handle model change
  const handleModelChange = (e) => {
    setModelId(e.target.value);
  };

  // Handle mode change
  const handleModeChange = (e) => {
    setMode(e.target.value);
  };

  // Helper functions to get provider and model names
  const getProviderName = (key) => {
    const providers = {
      'openai': 'OpenAI',
      'cohere': 'Cohere',
      'huggingface': 'HuggingFace',
      'groq': 'Groq',
      'mistral': 'Mistral',
      'anthropic': 'Anthropic',
      'xai': 'X AI',
      'deepseek': 'DeepSeek',
      'alibaba': 'Alibaba'
    };
    return providers[key] || key;
  };

  const getModelName = () => {
    if (!modelId || !availableModels[provider]) return '';
    
    const model = availableModels[provider]?.find(m => m.id === modelId);
    return model ? model.name : modelId;
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Header
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          isConnected={isConnected}
        />
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          provider={provider}
          onProviderChange={handleProviderChange}
          modelId={modelId}
          onModelChange={handleModelChange}
          availableModels={availableModels}
          mode={mode}
          onModeChange={handleModeChange}
          onClearChat={handleClearChat}
          onSaveChat={() => {}}
          onLoadChat={() => {}}
          onExportChat={handleExportChat}
          onNewChat={handleNewChat}
          onRetry={handleRetryLast}
          isStreaming={isStreaming}
          providerWarnings={providerWarnings}
          responseMetadata={responseMetadata}
          isConnected={isConnected}
        />
        <ChatWindow
          messages={messages}
          userInput={userInput}
          setUserInput={setUserInput}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isStreaming={isStreaming}
          isConnected={isConnected}
        />
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
};

// App component that provides the socket context
const App = () => {
  return (
    <SocketProvider>
      <AppContent />
    </SocketProvider>
  );
};

export default App; 
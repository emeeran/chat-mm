import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ThemeProvider, createTheme, alpha } from '@mui/material/styles';
import { CssBaseline, Box, Snackbar, Alert, useMediaQuery } from '@mui/material';
import ChatWindow from './components/ChatWindow';
import Sidebar from './components/Sidebar';
import { SocketProvider, useSocket } from './services/socketContext';
import { availableModels, providerWarnings } from './config/models';

// Define sidebar width for consistency
const sidebarWidth = { xs: 280, sm: 350 };

// Improved color palettes
const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3f51b5', // Indigo
      light: '#757de8',
      dark: '#002984',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#f50057', // Pink
      light: '#ff5983',
      dark: '#bb002f',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f7f9fc',
      paper: '#ffffff',
    },
    text: {
      primary: '#2d3748',
      secondary: '#4a5568',
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
    },
    info: {
      main: '#0288d1',
      light: '#03a9f4',
      dark: '#01579b',
    },
    warning: {
      main: '#ed6c02',
      light: '#ff9800',
      dark: '#e65100',
    },
    error: {
      main: '#d32f2f',
      light: '#ef5350',
      dark: '#c62828',
    },
    divider: 'rgba(0, 0, 0, 0.08)',
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 700,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 2px 1px -1px rgba(0,0,0,0.05),0px 1px 1px 0px rgba(0,0,0,0.03),0px 1px 3px 0px rgba(0,0,0,0.05)',
    '0px 3px 3px -2px rgba(0,0,0,0.06),0px 3px 4px 0px rgba(0,0,0,0.04),0px 1px 8px 0px rgba(0,0,0,0.06)',
    '0px 3px 4px -2px rgba(0,0,0,0.07),0px 4px 5px 0px rgba(0,0,0,0.05),0px 1px 10px 0px rgba(0,0,0,0.06)',
    '0px 4px 5px -2px rgba(0,0,0,0.07),0px 7px 10px 1px rgba(0,0,0,0.05),0px 2px 16px 1px rgba(0,0,0,0.06)',
    // Keep the rest of the default shadows
  ],
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
            backgroundColor: 'rgba(0,0,0,0.15)',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: 'rgba(0,0,0,0.25)',
            }
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#738adb', // Lighter indigo for dark mode
      light: '#9fa8da',
      dark: '#3949ab',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#ff4081', // Brighter pink for dark mode
      light: '#ff79b0',
      dark: '#c60055',
      contrastText: '#ffffff',
    },
    background: {
      default: '#111827', // Deep blue-gray
      paper: '#1e293b', // Lighter blue-gray
    },
    text: {
      primary: '#f1f5f9',
      secondary: '#cbd5e1',
    },
    success: {
      main: '#4caf50',
      light: '#81c784',
      dark: '#388e3c',
    },
    info: {
      main: '#29b6f6',
      light: '#4fc3f7',
      dark: '#0288d1',
    },
    warning: {
      main: '#ffa726',
      light: '#ffb74d',
      dark: '#f57c00',
    },
    error: {
      main: '#ef5350',
      light: '#e57373',
      dark: '#d32f2f',
    },
    divider: 'rgba(255, 255, 255, 0.08)',
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 700,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12)',
    '0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px rgba(0,0,0,0.12)',
    '0px 3px 4px -2px rgba(0,0,0,0.2),0px 4px 5px 0px rgba(0,0,0,0.14),0px 1px 10px 0px rgba(0,0,0,0.12)',
    '0px 4px 5px -2px rgba(0,0,0,0.2),0px 7px 10px 1px rgba(0,0,0,0.14),0px 2px 16px 1px rgba(0,0,0,0.12)',
    // Keep the rest of the default shadows
  ],
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
            backgroundColor: 'rgba(255,255,255,0.15)',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.25)',
            }
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});

function AppContent() {
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [provider, setProvider] = useState('groq');
  const [modelId, setModelId] = useState('');
  const [mode, setMode] = useState('llm');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [responseMetadata, setResponseMetadata] = useState(null);
  
  const { socket, isConnected, sendMessage } = useSocket();
  const isMobile = useMediaQuery('(max-width:900px)');

  // Theme
  const theme = darkMode ? darkTheme : lightTheme;
  
  // Effect to close sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  // Effect to store dark mode setting
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Effect to set modelId when provider changes
  useEffect(() => {
    if (availableModels[provider] && availableModels[provider].length > 0) {
      setModelId(availableModels[provider][0].id);
    } else {
      setModelId('');
    }
  }, [provider]);

  // Websocket message handler
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (data) => {
      console.log('Socket message received:', data);
      if (data.type === 'message') {
        console.log('Adding new assistant message');
        setMessages(prev => {
          const newMessages = [...prev, { role: 'assistant', content: data.content }];
          console.log('Updated messages:', newMessages);
          return newMessages;
        });
        setIsStreaming(false);
      } else if (data.type === 'stream') {
        console.log('Streaming content:', data.content);
        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage && lastMessage.role === 'assistant') {
            const updatedMessages = [...prev.slice(0, -1)];
            const updatedMessage = {
              ...lastMessage,
              content: lastMessage.content + data.content
            };
            updatedMessages.push(updatedMessage);
            console.log('Updated streaming message:', updatedMessage.content);
            return updatedMessages;
          } else {
            const newMessages = [...prev, { role: 'assistant', content: data.content }];
            console.log('Created new assistant message for stream');
            return newMessages;
          }
        });
      } else if (data.type === 'metadata') {
        console.log('Received metadata:', data.content);
        setResponseMetadata(data.content);
      } else if (data.type === 'error') {
        console.error('Received error:', data.content);
        setError(data.content);
        setIsStreaming(false);
      } else if (data.type === 'done') {
        console.log('Stream complete');
        setIsStreaming(false);
      }
    };

    socket.on('message', handleMessage);
    console.log('Socket message handler registered');

    return () => {
      socket.off('message', handleMessage);
    };
  }, [socket]);

  const handleSendMessage = useCallback(() => {
    if (!inputValue.trim() || !isConnected || isStreaming) return;

    const userMessage = {
      role: 'user',
      content: inputValue
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsStreaming(true);

    sendMessage({
      type: 'message',
      content: inputValue,
      provider: provider,
      model: modelId,
      mode: mode
    });
  }, [inputValue, isConnected, isStreaming, sendMessage, provider, modelId, mode]);

  const handleRetry = useCallback(() => {
    if (!isConnected || isStreaming || messages.length === 0) return;

    // Find the last user message
    const lastUserMessageIndex = [...messages].reverse().findIndex(msg => msg.role === 'user');
    
    if (lastUserMessageIndex === -1) return;
    
    const lastUserMessage = messages[messages.length - 1 - lastUserMessageIndex];

    // Remove all assistant messages after the last user message
    setMessages(prev => prev.slice(0, messages.length - lastUserMessageIndex));
    setIsStreaming(true);

    sendMessage({
      type: 'message',
      content: lastUserMessage.content,
      provider: provider,
      model: modelId,
      mode: mode
    });
  }, [messages, isConnected, isStreaming, sendMessage, provider, modelId, mode]);

  const handleClearChat = useCallback(() => {
    setMessages([]);
    setResponseMetadata(null);
  }, []);

  const handleSaveChat = useCallback(() => {
    // Future implementation
    setError('Save chat functionality not implemented yet');
  }, []);

  const handleExportChat = useCallback(() => {
    if (messages.length === 0) {
      setError('No messages to export');
      return;
    }

    const exportData = {
      messages,
      metadata: {
        timestamp: new Date().toISOString(),
        provider,
        model: modelId,
        mode
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [messages, provider, modelId, mode]);

  const handleLoadChat = useCallback((event) => {
    // Future implementation
    setError('Load chat functionality not implemented yet');
  }, []);

  const handleNewChat = useCallback(() => {
    if (messages.length > 0) {
      // Ask for confirmation
      if (window.confirm('Start a new chat? This will clear your current conversation.')) {
        handleClearChat();
      }
    }
  }, [messages.length, handleClearChat]);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev);
  }, []);

  const handleProviderChange = useCallback((event) => {
    setProvider(event.target.value);
  }, []);

  const handleModelChange = useCallback((event) => {
    setModelId(event.target.value);
  }, []);

  const handleModeChange = useCallback((event) => {
    setMode(event.target.value);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const handleErrorClose = useCallback(() => {
    setError(null);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      <Box sx={{ 
        display: 'flex', 
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: theme.palette.background.default,
      }}>
        {/* Sidebar */}
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
          onSaveChat={handleSaveChat}
          onLoadChat={handleLoadChat}
          onExportChat={handleExportChat}
          onNewChat={handleNewChat}
          onRetry={handleRetry}
          isStreaming={isStreaming}
          providerWarnings={providerWarnings}
          responseMetadata={responseMetadata}
          isConnected={isConnected}
          sidebarWidth={sidebarWidth}
          toggleSidebar={toggleSidebar}
        />
        
        {/* Main content */}
        <Box 
          sx={{ 
            flexGrow: 1,
            width: { xs: '100%', md: sidebarOpen ? `calc(100% - ${sidebarWidth.sm}px)` : '100%' },
            transition: theme.transitions.create(['margin', 'width'], {
              easing: theme.transitions.easing.easeOut,
              duration: theme.transitions.duration.enteringScreen,
            }),
            marginLeft: { xs: 0, md: sidebarOpen ? `${sidebarWidth.sm}px` : 0 },
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Chat window takes up all available space */}
          <ChatWindow 
            messages={messages}
            inputValue={inputValue}
            setInputValue={setInputValue}
            onSendMessage={handleSendMessage}
            isStreaming={isStreaming}
            isConnected={isConnected}
            toggleSidebar={toggleSidebar}
          />
        </Box>
      </Box>
      
      {/* Error messages */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={handleErrorClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleErrorClose} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

function App() {
  return (
    <SocketProvider>
      <AppContent />
    </SocketProvider>
  );
}

export default App; 
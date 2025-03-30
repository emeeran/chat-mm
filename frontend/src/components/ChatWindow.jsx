import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  IconButton,
  FormControlLabel,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  useTheme,
  alpha,
  Tooltip,
  CircularProgress,
  Alert,
  Snackbar,
  Badge
} from '@mui/material';
import {
  Send as SendIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Code as CodeIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  MenuBook as MenuBookIcon,
  Settings as SettingsIcon,
  Refresh as RetryIcon,
  Add as NewIcon,
  Save as SaveIcon,
  FileOpen as LoadIcon,
  FileDownload as ExportIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  KeyboardDoubleArrowUp as ScrollToTopIcon,
  Menu as MenuIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../services/socketContext';
import Message from './Message';
import { VariableSizeList as VirtualList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import useMediaQuery from '@mui/material/useMediaQuery';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Sidebar from './Sidebar';

const ChatWindow = () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [darkMode, setDarkMode] = useState(prefersDarkMode);
  const theme = useTheme();
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [provider, setProvider] = useState('groq');
  const [modelId, setModelId] = useState(null);
  const [availableModels, setAvailableModels] = useState({});
  const [mode, setMode] = useState('rag_llm');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [providerWarnings, setProviderWarnings] = useState({});
  const [responseMetadata, setResponseMetadata] = useState(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const [messageHeights, setMessageHeights] = useState({});
  const TYPING_INDICATOR_TIMEOUT = 500;
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  // Create custom theme
  const customTheme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? 'dark' : 'light',
          primary: {
            main: '#2196f3',
          },
          secondary: {
            main: '#f50057',
          },
          background: {
            default: darkMode ? '#121212' : '#f5f5f5',
            paper: darkMode ? '#1e1e1e' : '#ffffff',
          },
        },
        typography: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
          body1: {
            fontSize: '1rem',
            lineHeight: 1.6,
          },
          body2: {
            fontSize: '0.875rem',
            lineHeight: 1.5,
          },
        },
        shape: {
          borderRadius: 8,
        },
        components: {
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
                boxShadow: darkMode 
                  ? '0 2px 4px rgba(0,0,0,0.2)' 
                  : '0 2px 4px rgba(0,0,0,0.05)',
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: 'none',
                fontWeight: 500,
              },
            },
          },
          MuiTextField: {
            styleOverrides: {
              root: {
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                  },
                },
              },
            },
          },
        },
      }),
    [darkMode],
  );
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Alt+Enter to submit
      if (e.altKey && e.key === 'Enter' && input.trim() && !isStreaming) {
        e.preventDefault();
        handleSubmit(e);
      }
      
      // Ctrl+L to clear chat
      if (e.ctrlKey && e.key === 'l' && messages.length > 1 && !isStreaming) {
        e.preventDefault();
        handleClearChat();
      }
      
      // Ctrl+ArrowUp to retry last message
      if (e.ctrlKey && e.key === 'ArrowUp' && !isStreaming) {
        e.preventDefault();
        handleRetryLast();
      }

      // Ctrl+D to toggle dark mode
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        toggleDarkMode();
      }
      
      // Ctrl+, to toggle sidebar
      if (e.ctrlKey && e.key === ',') {
        e.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [input, isStreaming, messages]);

  // Function to measure message heights
  const measureMessage = useCallback((id, height) => {
    setMessageHeights(prev => {
      if (prev[id] !== height) {
        if (listRef.current) {
          listRef.current.resetAfterIndex(0);
        }
        return { ...prev, [id]: height };
      }
      return prev;
    });
  }, []);

  // Get message height for virtualization
  const getMessageHeight = useCallback((index) => {
    const message = messages[index];
    return messageHeights[message.id] || 100; // Default height
  }, [messages, messageHeights]);

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
          message: 'Failed to load available models. Please try refreshing the page.',
          severity: 'error'
        });
        
        // Handle the error by setting default providers and models
        const fallbackModels = {
          'openai': [
            {'id': 'gpt-4o-mini', 'name': 'GPT-4o Mini', 'description': 'Fast model'},
            {'id': 'gpt-4', 'name': 'GPT-4', 'description': 'Powerful model'},
          ],
          'groq': [
            {'id': 'llama-3.3-70b-versatile', 'name': 'Llama 3.3 70B', 'description': 'Large model'},
            {'id': 'llama-3.1-8b-instant', 'name': 'Llama 3.1 8B', 'description': 'Fast model'},
          ]
        };
        
        setAvailableModels(fallbackModels);
        setModelId(fallbackModels[provider]?.[0]?.id || 'gpt-4o-mini');
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
              Object.assign({}, lastMsg, { text: lastMsg.text + data.content })
            ];
          } else {
            setIsStreaming(true);
            return [...prev, { id: Date.now(), type: 'bot', text: data.content }];
          }
        });
      } else if (data.status === 'complete') {
        setIsStreaming(false);
        setIsTyping(false);
        // Store response metadata
        setResponseMetadata(Object.assign({}, {
          mode,
          provider: getProviderName(provider),
          model: getModelName(),
          timestamp: new Date().toLocaleTimeString(),
          timeTaken: data.time_taken || 'N/A'
        }));
      } else if (data.status === 'error') {
        setMessages(prev => [
          ...prev,
          { id: Date.now(), type: 'error', text: data.error || 'An error occurred' }
        ]);
        setIsStreaming(false);
        setIsTyping(false);
      }
    };

    const handleSystemMessage = (data) => {
      // Only show critical warnings
      if (data.status === 'warning' && data.content.includes('API key missing or invalid')) {
        setProviderWarnings(prev => Object.assign({}, prev, { [provider]: true }));

        setSnackbar(Object.assign({}, {
          open: true,
          message: data.content,
          severity: 'warning'
        }));
      }
    };

    socket.on('chat_response', handleChatResponse);
    socket.on('system_message', handleSystemMessage);

    return () => {
      socket.off('chat_response', handleChatResponse);
      socket.off('system_message', handleSystemMessage);
    };
  }, [socket, isStreaming, provider, mode]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToItem(messages.length - 1);
    }
  }, [messages]);

  // Handle typing indicator
  useEffect(() => {
    let typingTimer;
    if (isStreaming) {
      setIsTyping(true);
    } else {
      typingTimer = setTimeout(() => {
        setIsTyping(false);
      }, TYPING_INDICATOR_TIMEOUT);
    }
    return () => clearTimeout(typingTimer);
  }, [isStreaming]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || !isConnected || isStreaming) return;

    // Add user message
    const userMessage = { id: Date.now(), type: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    
    // Show typing indicator
    setIsTyping(true);
    setTimeout(() => {
      if (!isStreaming) setIsTyping(false);
    }, TYPING_INDICATOR_TIMEOUT);

    // Determine RAG and Web Search settings based on selected mode
    const use_rag = mode === 'rag_llm' || mode === 'rag_llm_web';
    const use_web = mode === 'rag_llm_web';

    // Send to server
    socket.emit('chat_query', {
      query: input.trim(),
      provider,
      model_id: modelId,
      use_web,
      use_rag
    });

    // Clear input
    setInput('');
  };

  const handleClearChat = () => {
    setMessages([]);
    
    // Clear message heights to reset virtualization
    setMessageHeights({});
    
    // Close sidebar after action
    closeSidebar();
  };

  const handleRetryLast = () => {
    if (isStreaming) return;
    
    const lastUserMessage = [...messages].reverse().find(msg => msg.type === 'user');
    if (lastUserMessage) {
      setInput(lastUserMessage.text);
      inputRef.current?.focus();
    }
    
    // Close sidebar after action
    closeSidebar();
  };
  
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
    
    // Close sidebar after action
    closeSidebar();
  };

  const handleProviderChange = (e) => {
    const newProvider = e.target.value;
    setProvider(newProvider);
    
    // Clear any previous warnings when switching providers
    setSnackbar({ open: false, message: '', severity: 'info' });
  };
  
  const handleModelChange = (e) => {
    setModelId(e.target.value);
  };
  
  const handleModeChange = (e) => {
    setMode(e.target.value);
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Helper functions
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

  // Virtualized row renderer
  const MessageRow = useCallback(({ index, style }) => {
    const message = messages[index];
    return (
      <div style={style}>
        <Message
          key={message.id}
          message={message}
          isStreaming={isStreaming && index === messages.length - 1}
          onHeightChange={(height) => measureMessage(message.id, height)}
        />
      </div>
    );
  }, [messages, isStreaming, measureMessage]);

  return (
    <ThemeProvider theme={customTheme}>
      {/* Sidebar */}
      <Sidebar 
        open={sidebarOpen}
        onClose={closeSidebar}
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
        onNewChat={handleClearChat}
        onRetry={handleRetryLast}
        isStreaming={isStreaming}
        providerWarnings={providerWarnings}
      />
    
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 64px)', // 64px is the height of the header
          overflow: 'hidden',
          bgcolor: customTheme.palette.background.default,
          transition: 'background-color 0.3s ease',
          position: 'relative',
        }}
      >
        {/* Menu button only */}
        <Box sx={{ 
          py: 2, 
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
        }}>
          <IconButton 
            sx={{ position: 'absolute', left: 16 }}
            onClick={toggleSidebar}
            color="primary"
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ position: 'absolute', right: 16 }}>
            {responseMetadata && (
              <Typography variant="caption" color="text.secondary">
                {getProviderName(provider)} {getModelName()}
              </Typography>
            )}
          </Box>
        </Box>
        
        {/* Chat messages area with virtualization */}
        <Box
          ref={chatContainerRef}
          sx={{
            flex: 1,
            overflowY: 'hidden',
            py: 1,
            px: { xs: 1, sm: 2, md: 3 },
            position: 'relative',
            mx: 'auto',
            width: '100%',
            maxWidth: '900px',
          }}
        >
          <AutoSizer>
            {({ height, width }) => (
              <VirtualList
                ref={listRef}
                height={height}
                width={width}
                itemCount={messages.length}
                itemSize={getMessageHeight}
                overscanCount={5}
              >
                {MessageRow}
              </VirtualList>
            )}
          </AutoSizer>

          {/* Typing indicator */}
          {isTyping && !isStreaming && (
            <Box 
              sx={{ 
                position: 'absolute',
                bottom: 10, 
                left: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                bgcolor: alpha(customTheme.palette.background.paper, 0.8),
                backdropFilter: 'blur(4px)',
                borderRadius: theme.shape.borderRadius,
                px: 2,
                py: 1,
                boxShadow: 1
              }}
            >
              <CircularProgress size={16} />
              <Typography variant="caption" color="text.secondary">
                {getProviderName(provider)} is thinking...
              </Typography>
            </Box>
          )}

          {/* Scroll to top button */}
          {messages.length > 8 && (
            <Tooltip title="Scroll to top">
              <IconButton
                sx={{
                  position: 'absolute',
                  right: 20,
                  bottom: 60,
                  bgcolor: alpha(customTheme.palette.background.paper, 0.8),
                  '&:hover': {
                    bgcolor: alpha(customTheme.palette.background.paper, 0.9),
                  },
                  boxShadow: 2,
                }}
                onClick={() => listRef.current?.scrollToItem(0)}
              >
                <ScrollToTopIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Input area - Fixed to bottom */}
        <Paper
          elevation={3}
          sx={{
            p: 2,
            borderTop: `1px solid ${customTheme.palette.divider}`,
            backgroundColor: customTheme.palette.mode === 'dark' 
              ? alpha(customTheme.palette.background.paper, 0.8) 
              : alpha(customTheme.palette.background.paper, 0.8),
            backdropFilter: 'blur(8px)',
            zIndex: 10,
            position: 'sticky',
            bottom: 0,
            left: 0,
            right: 0,
            transition: 'all 0.3s ease',
          }}
        >
          <Box 
            component="form" 
            onSubmit={handleSubmit}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mx: 'auto',
              maxWidth: '900px'
            }}
          >
            <TextField
              fullWidth
              placeholder={isConnected ? "Type your message..." : "Connecting..."}
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={!isConnected || isStreaming}
              multiline
              maxRows={4}
              inputRef={inputRef}
              variant="outlined"
              InputProps={{
                sx: {
                  borderRadius: 3,
                  pr: 1,
                }
              }}
            />
            <Button
              variant="contained"
              color="primary"
              disabled={!input.trim() || !isConnected || isStreaming}
              sx={{ 
                borderRadius: '50%', 
                minWidth: 0, 
                width: 44, 
                height: 44,
                p: 0
              }}
              type="submit"
            >
              <SendIcon />
            </Button>
          </Box>
        </Paper>
      </Box>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
};

export default ChatWindow; 
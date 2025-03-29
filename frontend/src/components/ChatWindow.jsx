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
  KeyboardDoubleArrowUp as ScrollToTopIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../services/socketContext';
import Message from './Message';
import { VariableSizeList as VirtualList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import useMediaQuery from '@mui/material/useMediaQuery';
import { createTheme, ThemeProvider } from '@mui/material/styles';

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
        const lastUserMessage = [...messages].reverse().find(msg => msg.type === 'user');
        if (lastUserMessage) {
          setInput(lastUserMessage.text);
          inputRef.current?.focus();
        }
      }

      // Ctrl+D to toggle dark mode
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        setDarkMode(prev => !prev);
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
    fetch('/api/chat/models')
      .then(response => response.json())
      .then(data => {
        setAvailableModels(data);
        // Set default model for the current provider
        if (data[provider] && data[provider].length > 0) {
          setModelId(data[provider][0].id);
        }
      })
      .catch(error => {
        console.error('Error fetching models:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load available models. Please try refreshing the page.',
          severity: 'error'
        });
      });
  }, []);

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
        setIsTyping(false);
        // Store response metadata
        setResponseMetadata({
          mode,
          provider: getProviderName(provider),
          model: getModelName(),
          timestamp: new Date().toLocaleTimeString(),
          timeTaken: data.time_taken || 'N/A'
        });
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
        const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);
        setProviderWarnings(prev => ({
          ...prev,
          [provider]: true
        }));

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
  };

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

  const handleProviderChange = (e) => {
    const newProvider = e.target.value;
    setProvider(newProvider);
    
    // Clear any previous warnings when switching providers
    setSnackbar({ open: false, message: '', severity: 'info' });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Get status text for the footer
  const getStatusText = () => {
    const parts = [
      `${getProviderName(provider)} ${getModelName()}`,
    ];
    
    if (mode === 'llm') {
      parts.push('using LLM only');
    } else if (mode === 'rag_llm') {
      parts.push('with document search');
    } else if (mode === 'rag_llm_web') {
      parts.push('with document search and web search');
    }
    
    return parts.join(' ');
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
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 64px)', // 64px is the height of the header
          overflow: 'hidden',
          bgcolor: customTheme.palette.background.default,
          transition: 'background-color 0.3s ease',
        }}
      >
        {/* Chat messages area with virtualization */}
        <Box
          ref={chatContainerRef}
          sx={{
            flex: 1,
            overflowY: 'hidden',
            py: 2,
            px: { xs: 0, sm: 2 },
            position: 'relative',
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
          
          {/* Response metadata */}
          {responseMetadata && !isStreaming && (
            <Box 
              sx={{ 
                mt: 2,
                mb: 1,
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                opacity: 0.7,
                fontSize: '0.75rem',
                color: 'text.secondary'
              }}
            >
              <Typography variant="caption">
                {responseMetadata.provider} {responseMetadata.model} | 
                Mode: {responseMetadata.mode === 'llm' ? 'LLM Only' : 
                       responseMetadata.mode === 'rag_llm' ? 'RAG + LLM' : 
                       'RAG + LLM + Web'} | 
                Time: {responseMetadata.timeTaken}s | 
                {responseMetadata.timestamp}
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

        {/* Input area - Now fixed to bottom */}
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
            sx={{
              mb: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              {/* Provider selection */}
              <FormControl size="small" variant="outlined" sx={{ minWidth: 120 }}>
                <InputLabel id="provider-label">Provider</InputLabel>
                <Select
                  labelId="provider-label"
                  value={provider}
                  onChange={handleProviderChange}
                  label="Provider"
                  disabled={isStreaming}
                >
                  {Object.keys(availableModels).map(key => (
                    <MenuItem key={key} value={key}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getProviderName(key)}
                        {providerWarnings[key] && (
                          <Tooltip title="API key not configured for this provider. Will fall back to OpenAI.">
                            <WarningIcon color="warning" fontSize="small" />
                          </Tooltip>
                        )}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {/* Model selection */}
              <FormControl size="small" variant="outlined" sx={{ minWidth: 150 }}>
                <InputLabel id="model-label">Model</InputLabel>
                <Select
                  labelId="model-label"
                  value={modelId || ''}
                  onChange={(e) => setModelId(e.target.value)}
                  label="Model"
                  disabled={isStreaming || !availableModels[provider]}
                >
                  {availableModels[provider]?.map(model => (
                    <MenuItem 
                      key={model.id} 
                      value={model.id}
                      title={model.description}
                    >
                      {model.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {/* Mode selection dropdown */}
              <FormControl size="small" variant="outlined" sx={{ minWidth: 150 }}>
                <InputLabel id="mode-label">Mode</InputLabel>
                <Select
                  labelId="mode-label"
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  label="Mode"
                  disabled={isStreaming}
                  startAdornment={<SettingsIcon fontSize="small" sx={{ mr: 1, ml: -0.5 }} />}
                >
                  <MenuItem value="llm">
                    <Tooltip title="Use only the LLM without retrieval or web search">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography>Mode-1: LLM Only</Typography>
                      </Box>
                    </Tooltip>
                  </MenuItem>
                  <MenuItem value="rag_llm">
                    <Tooltip title="Use document search with LLM">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <MenuBookIcon fontSize="small" sx={{ mr: 1 }} />
                        <Typography>Mode-2: RAG + LLM</Typography>
                      </Box>
                    </Tooltip>
                  </MenuItem>
                  <MenuItem value="rag_llm_web">
                    <Tooltip title="Use both document search and web search with LLM">
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <MenuBookIcon fontSize="small" sx={{ mr: 0.5 }} />
                        <SearchIcon fontSize="small" sx={{ mr: 1 }} />
                        <Typography>Mode-3: RAG + LLM + Web</Typography>
                      </Box>
                    </Tooltip>
                  </MenuItem>
                </Select>
              </FormControl>

              {/* Dark/Light mode toggle */}
              <Tooltip title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
                <IconButton
                  onClick={() => setDarkMode(prev => !prev)}
                  color="primary"
                  size="small"
                  sx={{
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'rotate(180deg)',
                    },
                  }}
                >
                  {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
                </IconButton>
              </Tooltip>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              {/* New Chat button */}
              <Tooltip title="New Chat (Ctrl+L)">
                <span>
                  <IconButton
                    onClick={handleClearChat}
                    color="primary"
                    disabled={isStreaming}
                  >
                    <NewIcon />
                  </IconButton>
                </span>
              </Tooltip>
              
              {/* Retry Last Query button */}
              <Tooltip title="Retry Last Query (Ctrl+↑)">
                <span>
                  <IconButton
                    onClick={() => {
                      // Find the last user message
                      const lastUserMessage = [...messages].reverse().find(msg => msg.type === 'user');
                      if (lastUserMessage) {
                        setInput(lastUserMessage.text);
                        inputRef.current?.focus();
                      }
                    }}
                    color="primary"
                    disabled={isStreaming || !messages.some(msg => msg.type === 'user')}
                  >
                    <RetryIcon />
                  </IconButton>
                </span>
              </Tooltip>
              
              {/* Save Chat button */}
              <Tooltip title="Save Chat">
                <span>
                  <IconButton
                    onClick={() => {
                      // Create a JSON representation of the chat
                      const chatData = {
                        messages: messages,
                        timestamp: new Date().toISOString(),
                        provider,
                        model: modelId
                      };
                      
                      // Convert to a string and create a download link
                      const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `chat-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                      
                      setSnackbar({
                        open: true,
                        message: 'Chat saved successfully!',
                        severity: 'success'
                      });
                    }}
                    color="primary"
                    disabled={isStreaming || messages.length <= 1}
                  >
                    <SaveIcon />
                  </IconButton>
                </span>
              </Tooltip>
              
              {/* Export Chat button */}
              <Tooltip title="Export Chat as Text">
                <span>
                  <IconButton
                    onClick={() => {
                      // Create a plain text representation of the chat
                      const chatText = messages
                        .filter(msg => msg.type !== 'info') // Filter out info messages
                        .map(msg => {
                          const role = msg.type === 'user' ? 'User' : 'AI';
                          return `${role}: ${msg.text}`;
                        })
                        .join('\n\n');
                      
                      // Add metadata at the top
                      const metadata = `Chat Export - ${new Date().toLocaleString()}\nModel: ${getProviderName(provider)} ${getModelName()}\n\n`;
                      const fullText = metadata + chatText;
                      
                      // Create and trigger download
                      const blob = new Blob([fullText], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `chat-export-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
                      a.click();
                      URL.revokeObjectURL(url);
                      
                      setSnackbar({
                        open: true,
                        message: 'Chat exported as text successfully!',
                        severity: 'success'
                      });
                    }}
                    color="primary"
                    disabled={isStreaming || messages.length <= 1}
                  >
                    <ExportIcon />
                  </IconButton>
                </span>
              </Tooltip>
              
              {/* Load Chat button */}
              <Tooltip title="Load Chat">
                <span>
                  <IconButton
                    onClick={() => {
                      // Create an input element to select a file
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.json';
                      
                      input.onchange = (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            try {
                              const chatData = JSON.parse(event.target.result);
                              if (chatData.messages && Array.isArray(chatData.messages)) {
                                setMessages(chatData.messages);
                                
                                // Set provider and model if available
                                if (chatData.provider && availableModels[chatData.provider]) {
                                  setProvider(chatData.provider);
                                  
                                  if (chatData.model && availableModels[chatData.provider]?.some(m => m.id === chatData.model)) {
                                    setModelId(chatData.model);
                                  } else if (availableModels[chatData.provider].length > 0) {
                                    setModelId(availableModels[chatData.provider][0].id);
                                  }
                                }
                                
                                setSnackbar({
                                  open: true,
                                  message: 'Chat loaded successfully!',
                                  severity: 'success'
                                });
                              } else {
                                throw new Error('Invalid chat data format');
                              }
                            } catch (err) {
                              setSnackbar({
                                open: true,
                                message: `Error loading chat: ${err.message}`,
                                severity: 'error'
                              });
                            }
                          };
                          reader.readAsText(file);
                        }
                      };
                      
                      input.click();
                    }}
                    color="primary"
                    disabled={isStreaming}
                  >
                    <LoadIcon />
                  </IconButton>
                </span>
              </Tooltip>
              
              {/* Delete Chat button (already exists) */}
              <Tooltip title="Clear conversation">
                <span>
                  <IconButton
                    onClick={handleClearChat}
                    color="primary"
                    disabled={messages.length <= 1 || isStreaming}
                  >
                    <DeleteIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Box>
          
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                placeholder="Ask anything about the documents or the web... (Alt+Enter to send)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={!isConnected || isStreaming}
                variant="outlined"
                inputRef={inputRef}
                InputProps={{
                  sx: {
                    pr: 1,
                    backgroundColor: customTheme.palette.mode === 'dark' 
                      ? alpha(customTheme.palette.background.paper, 0.5) 
                      : alpha(customTheme.palette.background.default, 0.7),
                  },
                  endAdornment: input.length > 0 && (
                    <Badge
                      badgeContent={input.length}
                      max={9999}
                      color={input.length > 2000 ? "error" : "primary"}
                      sx={{ mr: 1 }}
                    />
                  )
                }}
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={!input.trim() || !isConnected || isStreaming}
                sx={{ 
                  minWidth: { xs: '56px', sm: '120px' },
                  px: { xs: 2, sm: 3 }
                }}
                endIcon={isStreaming ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  {isStreaming ? 'Processing' : 'Send'}
                </Box>
              </Button>
            </Box>
          </form>
        </Paper>

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
      </Box>
    </ThemeProvider>
  );
};

export default ChatWindow; 
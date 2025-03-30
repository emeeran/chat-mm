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
  Badge,
  Chip
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
  Menu as MenuIcon,
  Android as BotIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../services/socketContext';
import Message from './Message';
import { VariableSizeList as VirtualList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import useMediaQuery from '@mui/material/useMediaQuery';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Sidebar from './Sidebar';

const ChatWindow = ({ darkMode, toggleDarkMode, sidebarOpen, setSidebarOpen }) => {
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
  
  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const closeSidebar = () => setSidebarOpen(false);

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
  }, [input, isStreaming, messages, toggleDarkMode, toggleSidebar]);

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
        setResponseMetadata({
          model: getModelName(),
          time: data.time_taken || null,
          tokens: data.tokens || null
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

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  return (
    <Box
      sx={{
        display: 'flex',
        height: 'calc(100vh - 64px)', // Subtract header height
        position: 'relative',
      }}
    >
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
        onNewChat={() => handleClearChat()}
        onRetry={handleRetryLast}
        isStreaming={isStreaming}
        providerWarnings={providerWarnings}
      />
      
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Mobile menu toggle */}
        <Box
          sx={{
            display: { xs: 'flex', md: 'none' },
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 10,
          }}
        >
          <IconButton
            color="primary"
            onClick={toggleSidebar}
            aria-label="Open settings"
            sx={{
              bgcolor: theme.palette.background.paper,
              boxShadow: 1,
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.1),
              },
            }}
          >
            <MenuIcon />
          </IconButton>
        </Box>
        
        {/* Main chat area with shadow overlay for scrolling indication */}
        <Box
          ref={chatContainerRef}
          sx={{
            flex: 1,
            overflowY: 'auto',
            px: { xs: 1, sm: 2 },
            py: 2,
            position: 'relative',
            scrollBehavior: 'smooth',
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(180deg, rgba(18,18,18,0) 0%, rgba(18,18,18,0.8) 100%)' 
              : 'linear-gradient(180deg, rgba(245,245,245,0) 0%, rgba(245,245,245,0.8) 100%)',
            backgroundSize: '100% 40px',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'bottom',
          }}
        >
          {messages.length === 0 ? (
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%',
                textAlign: 'center',
                px: 2,
                opacity: 0.7,
              }}
            >
              <BotIcon sx={{ fontSize: 60, mb: 2, color: theme.palette.primary.main }} />
              <Typography variant="h5" gutterBottom>Welcome to Chat-MM</Typography>
              <Typography variant="body1" sx={{ maxWidth: 600, mb: 3 }}>
                This is a multimodal chat application that supports various LLM providers and retrieval modes.
              </Typography>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  mt: 2,
                  maxWidth: 600,
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                }}
              >
                <Typography variant="body2" component="div">
                  <Box component="span" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>Try asking:</Box>
                  <Box component="ul" sx={{ pl: 2 }}>
                    <li>Explain the difference between RAG and traditional LLM approaches</li>
                    <li>Summarize the key features of the Groq language model</li>
                    <li>What are the advantages of using Anthropic's Claude model?</li>
                  </Box>
                </Typography>
              </Paper>
            </Box>
          ) : (
            messages.map((message) => (
              <Message
                key={message.id}
                message={message}
                isStreaming={isStreaming && message.id === messages[messages.length - 1].id}
                onHeightChange={(height) => measureMessage(message.id, height)}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </Box>

        {/* Floating scroll to bottom button */}
        {messages.length > 5 && (
          <Tooltip title="Scroll to bottom">
            <IconButton
              color="primary"
              aria-label="scroll to bottom"
              onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
              sx={{
                position: 'absolute',
                bottom: 90,
                right: 20,
                zIndex: 2,
                backgroundColor: theme.palette.background.paper,
                boxShadow: theme.shadows[3],
                opacity: 0.8,
                '&:hover': {
                  opacity: 1,
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.primary.main, 0.2) 
                    : alpha(theme.palette.primary.main, 0.1),
                },
                transition: 'all 0.2s',
              }}
            >
              <ScrollToTopIcon />
            </IconButton>
          </Tooltip>
        )}
        
        {/* Message response metadata */}
        {responseMetadata && (
          <Paper
            elevation={0}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              py: 0.5,
              px: 2,
              mx: 'auto',
              mb: 1,
              borderRadius: 10,
              bgcolor: alpha(theme.palette.info.main, 0.1),
              border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
              color: theme.palette.info.main,
              fontSize: '0.75rem',
            }}
          >
            <InfoIcon fontSize="small" sx={{ mr: 1 }} />
            {responseMetadata.model && (
              <Typography variant="caption" sx={{ mr: 1 }}>
                Model: {responseMetadata.model}
              </Typography>
            )}
            {responseMetadata.tokens && (
              <Typography variant="caption" sx={{ mr: 1 }}>
                Tokens: {responseMetadata.tokens}
              </Typography>
            )}
            {responseMetadata.time && (
              <Typography variant="caption">
                Time: {responseMetadata.time}s
              </Typography>
            )}
          </Paper>
        )}

        {/* Input Area */}
        <Paper
          elevation={3}
          component="form"
          onSubmit={handleSubmit}
          sx={{
            p: 2,
            mx: 2,
            mb: 2,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 3,
            transition: 'all 0.3s ease',
            boxShadow: isStreaming 
              ? `0 0 0 2px ${theme.palette.primary.main}`
              : theme.shadows[1],
            '&:hover': {
              boxShadow: isStreaming 
                ? `0 0 0 2px ${theme.palette.primary.main}`
                : theme.shadows[3],
            },
            position: 'relative',
          }}
        >
          {/* Status indicator */}
          <Box 
            sx={{ 
              position: 'absolute',
              top: -10,
              right: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
            }}
          >
            <Chip
              size="small"
              label={isConnected ? "Connected" : "Disconnected"}
              color={isConnected ? "success" : "error"}
              variant="outlined"
              sx={{ 
                height: 24,
                fontSize: '0.7rem',
                '& .MuiChip-label': { px: 1, py: 0.5 }
              }}
            />
          </Box>
          
          <TextField
            inputRef={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message here..."
            multiline
            maxRows={4}
            variant="outlined"
            fullWidth
            disabled={isStreaming}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                fontSize: '0.95rem',
                lineHeight: 1.5,
                py: 0.5,
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'transparent',
              },
              mb: 1,
            }}
            InputProps={{
              sx: { '&.Mui-focused': { boxShadow: 'none' } },
            }}
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
            {/* Input tools */}
            <Box>
              <Tooltip title="LLM Mode" placement="top">
                <FormControl 
                  sx={{ mr: 1, minWidth: 120 }}
                  size="small"
                >
                  <Select
                    value={mode}
                    onChange={handleModeChange}
                    displayEmpty
                    disabled={isStreaming}
                    sx={{ 
                      height: 36,
                      fontSize: '0.8rem',
                      bgcolor: alpha(theme.palette.background.paper, 0.9)
                    }}
                  >
                    <MenuItem value="llm">LLM Only</MenuItem>
                    <MenuItem value="rag_llm">RAG + LLM</MenuItem>
                    <MenuItem value="rag_llm_web">RAG + LLM + Web</MenuItem>
                  </Select>
                </FormControl>
              </Tooltip>
              
              <Tooltip title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"} placement="top">
                <IconButton
                  onClick={toggleDarkMode}
                  sx={{ mr: 1 }}
                  size="small"
                >
                  {darkMode ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Clear Chat" placement="top">
                <span>
                  <IconButton
                    onClick={handleClearChat}
                    disabled={messages.length === 0 || isStreaming}
                    size="small"
                    color="error"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
            
            {/* Submit button */}
            <Tooltip title="Send Message (Alt+Enter)">
              <span>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={!input.trim() || isStreaming}
                  endIcon={isStreaming ? <CircularProgress size={16} /> : <SendIcon />}
                  sx={{
                    px: 3,
                    py: 1,
                    borderRadius: 10,
                    textTransform: 'none',
                    fontWeight: 500,
                  }}
                >
                  {isStreaming ? 'Processing...' : 'Send'}
                </Button>
              </span>
            </Tooltip>
          </Box>
          
          {/* Keyboard shortcuts hint */}
          <Typography 
            variant="caption" 
            sx={{ 
              mt: 0.5, 
              textAlign: 'center',
              color: theme.palette.text.secondary,
              opacity: 0.7,
              fontSize: '0.7rem',
            }}
          >
            Press Alt+Enter to send • Ctrl+L to clear • Ctrl+D to toggle dark mode
          </Typography>
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
    </Box>
  );
};

export default ChatWindow; 
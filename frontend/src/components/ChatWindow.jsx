import React, { useState, useEffect, useRef } from 'react';
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
  Snackbar
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
  FileDownload as ExportIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../services/socketContext';
import Message from './Message';

const ChatWindow = () => {
  const theme = useTheme();
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState([
    { 
      id: 'welcome', 
      type: 'info', 
      text: 'Welcome to RAG Chat! Ask me anything about the documents in the knowledge base or get real-time information from the web.' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [provider, setProvider] = useState('groq');
  const [modelId, setModelId] = useState(null);
  const [availableModels, setAvailableModels] = useState({});
  const [mode, setMode] = useState('llm'); // Default to LLM-only mode
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [providerWarnings, setProviderWarnings] = useState({});
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

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
          // Check if we already have a bot message at the end
          const lastMsg = prev[prev.length - 1];
          if (lastMsg && lastMsg.type === 'bot' && isStreaming) {
            // Update the existing message
            return [
              ...prev.slice(0, -1),
              { ...lastMsg, text: lastMsg.text + data.content }
            ];
          } else {
            // Create a new bot message
            setIsStreaming(true);
            return [...prev, { id: Date.now(), type: 'bot', text: data.content }];
          }
        });
      } else if (data.status === 'complete') {
        setIsStreaming(false);
      } else if (data.status === 'error') {
        setMessages(prev => [
          ...prev,
          { id: Date.now(), type: 'error', text: data.error || 'An error occurred' }
        ]);
        setIsStreaming(false);
      }
    };

    const handleSystemMessage = (data) => {
      // Check if this is a warning about missing API keys
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

      setMessages(prev => [
        ...prev,
        { id: Date.now(), type: data.status || 'info', text: data.content }
      ]);
    };

    // Register event listeners
    socket.on('chat_response', handleChatResponse);
    socket.on('system_message', handleSystemMessage);

    // Cleanup
    return () => {
      socket.off('chat_response', handleChatResponse);
      socket.off('system_message', handleSystemMessage);
    };
  }, [socket, isStreaming, provider]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || !isConnected || isStreaming) return;

    // Add user message
    const userMessage = { id: Date.now(), type: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMessage]);

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
    setMessages([
      { 
        id: 'welcome-reset', 
        type: 'info', 
        text: 'Chat history cleared. Start a new conversation!' 
      }
    ]);
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

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 64px)', // 64px is the height of the header
        overflow: 'hidden',
      }}
    >
      {/* Chat messages area */}
      <Box
        ref={chatContainerRef}
        sx={{
          flex: 1,
          overflowY: 'auto',
          py: 2,
          px: { xs: 0, sm: 2 },
        }}
      >
        <AnimatePresence>
          {messages.map(message => (
            <Message
              key={message.id}
              message={message}
              isStreaming={isStreaming && message === messages[messages.length - 1]}
            />
          ))}
        </AnimatePresence>
        
        {/* Status message moved here from input area */}
        {isConnected && messages.length > 0 && (
          <Box 
            sx={{ 
              mt: 2,
              mb: 1,
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
              opacity: 0.7
            }}
          >
            <InfoIcon fontSize="small" sx={{ color: 'text.secondary', fontSize: '0.9rem' }} />
            <Typography 
              variant="caption" 
              color="text.secondary"
            >
              Using {getStatusText()}
            </Typography>
          </Box>
        )}
        
        <div ref={messagesEndRef} />
      </Box>

      {/* Input area - Now fixed to bottom */}
      <Paper
        elevation={3}
        sx={{
          p: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.mode === 'dark' 
            ? alpha(theme.palette.background.paper, 0.8) 
            : alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(8px)',
          zIndex: 10,
          position: 'sticky',
          bottom: 0,
          left: 0,
          right: 0,
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
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            {/* New Chat button */}
            <Tooltip title="New Chat">
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
            <Tooltip title="Retry Last Query">
              <span>
                <IconButton
                  onClick={() => {
                    // Find the last user message
                    const lastUserMessage = [...messages].reverse().find(msg => msg.type === 'user');
                    if (lastUserMessage) {
                      setInput(lastUserMessage.text);
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
              placeholder="Ask anything about the documents or the web..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!isConnected || isStreaming}
              variant="outlined"
              InputProps={{
                sx: {
                  pr: 1,
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? alpha(theme.palette.background.paper, 0.5) 
                    : alpha(theme.palette.background.default, 0.7),
                }
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
  );
};

export default ChatWindow; 
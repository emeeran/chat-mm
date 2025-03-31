import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Container,
  Fab,
  Tooltip,
  Snackbar,
  Alert,
  CircularProgress,
  useTheme,
  alpha,
  AppBar,
  Toolbar,
  Fade,
  Divider,
  Collapse,
  InputAdornment,
} from '@mui/material';
import {
  Send as SendIcon,
  KeyboardArrowDown as ScrollDownIcon,
  Image as ImageIcon,
  Android as BotIconMui,
  Menu as MenuIcon,
  ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import Message from './Message';
import BotIcon from '../icons/BotIcon';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ChatWindow = ({
  messages = [],
  inputValue = '',
  setInputValue,
  onSendMessage,
  isStreaming = false,
  isConnected = false,
  toggleSidebar,
}) => {
  const theme = useTheme();
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [typingEffect, setTypingEffect] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isCopySuccess, setIsCopySuccess] = useState(false);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setIsAtBottom(true);
  };

  // Check if scroll button should be shown
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const scrolledUp = scrollHeight - scrollTop - clientHeight > 100;
    setShowScrollButton(scrolledUp);
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && !showScrollButton) {
      scrollToBottom();
    }
  }, [messages, showScrollButton]);

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Alt+Enter or Cmd+Enter to submit
      if ((e.altKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        onSendMessage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSendMessage]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    // Add typing animation effect
    setTypingEffect(e.target.value.length > 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSendMessage();
  };

  const handleCopySuccess = () => {
    setIsCopySuccess(true);
    setTimeout(() => setIsCopySuccess(false), 2000);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'relative',
        backgroundColor: alpha(theme.palette.background.default, 0.6),
      }}
    >
      {/* Mobile app bar */}
      <AppBar 
        position="fixed" 
        color="inherit" 
        elevation={0}
        sx={{ 
          display: { md: 'none' },
          borderBottom: `1px solid ${theme.palette.divider}`,
          backdropFilter: 'blur(10px)',
          backgroundColor: alpha(theme.palette.background.paper, 0.8),
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 }, px: 1 }}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={toggleSidebar}
            sx={{ mr: 1 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Chat-MM
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            backgroundColor: isConnected ? alpha(theme.palette.success.main, 0.15) : alpha(theme.palette.error.main, 0.15),
            borderRadius: 2,
            px: 1,
            py: 0.5,
            mr: 1,
          }}>
            <Box 
              sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                backgroundColor: isConnected ? theme.palette.success.main : theme.palette.error.main,
                mr: 1,
                boxShadow: isConnected 
                  ? `0 0 0 2px ${alpha(theme.palette.success.main, 0.3)}`
                  : `0 0 0 2px ${alpha(theme.palette.error.main, 0.3)}`,
              }} 
            />
            <Typography variant="caption" sx={{ fontWeight: 500, color: isConnected ? theme.palette.success.main : theme.palette.error.main }}>
              {isConnected ? 'Connected' : 'Offline'}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Message container */}
      <Box
        ref={scrollContainerRef}
        onScroll={handleScroll}
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          mt: { xs: 7, md: 0 },
          pt: 2,
          pb: 10,
          px: { xs: 1, sm: 2, md: 3 },
          height: '100%',
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: alpha(theme.palette.text.primary, 0.15),
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: alpha(theme.palette.text.primary, 0.25),
            }
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
        }}
      >
        <Paper
          elevation={0}
          sx={{ 
            py: 0.5,
            px: 1.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 0,
            maxWidth: '1000px',
            mx: 'auto',
            width: '100%',
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.background.paper, 0.8),
            color: theme.palette.text.primary,
            overflow: 'hidden',
            minHeight: '50vh',
            border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
          }}
        >
          {messages.map((message, index) => (
            <Box key={index} sx={{ 
              mb: index < messages.length - 1 ? 0.4 : 0,
              fontSize: '0.85rem', 
              whiteSpace: 'pre-wrap', 
              lineHeight: 1.1,
              backgroundColor: message.role === 'user' 
                ? alpha(theme.palette.primary.main, 0.05) 
                : (index % 2 === 1 ? alpha(theme.palette.background.default, 0.3) : 'transparent'),
              borderLeft: message.role === 'user' 
                ? `2px solid ${alpha(theme.palette.primary.main, 0.5)}` 
                : `2px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
              pl: 0.5,
              pr: 0.3,
              py: message.role === 'user' ? 0.3 : 0.4,
              borderRadius: '2px',
              position: 'relative',
            }}>
              {message.role === 'user' && (
                <Box component="span" sx={{ 
                  color: theme.palette.primary.main, 
                  fontWeight: 'bold', 
                  fontFamily: '"Consolas", "Monaco", monospace', 
                  fontSize: '0.8rem',
                  mr: 0.3,
                  display: 'inline-block',
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  px: 0.3,
                  borderRadius: '3px',
                }}>
                  u&gt;
                </Box>
              )}
              {message.role === 'assistant' && (
                <Box component="span" sx={{ 
                  color: theme.palette.secondary.main, 
                  fontWeight: 'bold', 
                  fontFamily: '"Consolas", "Monaco", monospace', 
                  fontSize: '0.8rem',
                  mr: 0.3,
                  display: 'inline-block',
                  backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                  px: 0.3,
                  borderRadius: '3px',
                }}>
                  a&gt;
                </Box>
              )}
              <Box 
                sx={{ 
                  display: 'inline-block', 
                  width: 'calc(100% - 35px)',
                  verticalAlign: 'top',
                  ml: 0.3,
                  '& pre': {
                    backgroundColor: alpha(theme.palette.mode === 'dark' ? '#2d2d2d' : '#f5f5f5', 0.9),
                    p: 0.4,
                    borderRadius: 0.5,
                    overflow: 'auto',
                    fontSize: '0.8rem',
                    my: 0.2,
                    lineHeight: 1.05,
                    fontFamily: '"Consolas", "Monaco", monospace',
                    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                  },
                  '& code': {
                    backgroundColor: alpha(theme.palette.mode === 'dark' ? '#2d2d2d' : '#f5f5f5', 0.7),
                    p: 0.1,
                    borderRadius: 0.3,
                    fontFamily: '"Consolas", "Monaco", monospace',
                    fontSize: '0.8rem',
                    color: theme.palette.mode === 'dark' ? '#e6db74' : '#007700',
                  },
                  '& img': {
                    maxWidth: '100%',
                    borderRadius: 0.5,
                    my: 0.2,
                    border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                  },
                  '& table': {
                    borderCollapse: 'collapse',
                    width: '100%',
                    mb: 0.2,
                    mt: 0.2,
                    fontSize: '0.8rem',
                    border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
                  },
                  '& th, & td': {
                    border: `1px solid ${theme.palette.divider}`,
                    p: 0.1,
                    fontSize: '0.75rem'
                  },
                  '& th': {
                    backgroundColor: alpha(theme.palette.background.default, 0.5),
                    fontWeight: 'bold',
                  },
                  '& a': {
                    color: theme.palette.primary.main,
                    textDecoration: 'underline',
                    '&:hover': {
                      textDecoration: 'none',
                    }
                  },
                  '& blockquote': {
                    borderLeft: `2px solid ${alpha(theme.palette.primary.main, 0.4)}`,
                    pl: 0.4,
                    ml: 0,
                    my: 0.1,
                    color: theme.palette.text.secondary,
                    backgroundColor: alpha(theme.palette.background.default, 0.3),
                    py: 0,
                  },
                  '& ul, & ol': {
                    pl: 1,
                    my: 0,
                    mb: 0,
                    pt: 0,
                    pb: 0,
                  },
                  '& li': {
                    mb: 0,
                    mt: 0,
                    lineHeight: 1,
                    paddingBottom: 0,
                    paddingTop: 0,
                  },
                  '& li p': {
                    my: 0,
                    mb: 0,
                    pt: 0,
                    pb: 0,
                    lineHeight: 1,
                  },
                  '& li + li': {
                    mt: -0.1,
                  },
                  '& p': {
                    my: 0.1,
                    lineHeight: 1.05,
                    mb: 0.1,
                  },
                  '& h1, & h2, & h3, & h4, & h5, & h6': {
                    my: 0.4,
                    lineHeight: 1.1,
                    color: theme.palette.mode === 'dark' 
                      ? alpha(theme.palette.primary.light, 0.9)
                      : alpha(theme.palette.primary.dark, 0.9),
                    fontWeight: 'bold',
                  },
                  '& h2': { 
                    fontSize: '1.05rem', 
                    borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`, 
                    pb: 0.2, 
                    mb: 0.4, 
                    mt: 0.6,
                    color: theme.palette.primary.main,
                  },
                  '& h3': { 
                    fontSize: '0.95rem', 
                    mb: 0.3,
                    mt: 0.5,
                    fontWeight: 'bold',
                    color: theme.palette.secondary.main,
                  },
                  '& ul': {
                    pl: 1,
                    my: 0.2,
                    mb: 0.4,
                    pt: 0,
                    pb: 0,
                  },
                  '& ul li': {
                    mb: 0.05,
                    mt: 0,
                    lineHeight: 1.1,
                    paddingBottom: 0,
                    paddingTop: 0,
                    position: 'relative',
                    pl: 0.2,
                  },
                  '& ul li::before': {
                    content: '"-"',
                    position: 'absolute',
                    left: -0.8,
                    color: theme.palette.mode === 'dark' 
                      ? alpha(theme.palette.primary.light, 0.9)
                      : alpha(theme.palette.primary.main, 0.9),
                    fontWeight: 'bold',
                  },
                  '& table': {
                    borderCollapse: 'collapse',
                    width: '100%',
                    mb: 0.5,
                    mt: 0.5,
                    fontSize: '0.8rem',
                    border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
                  },
                  '& th': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    fontWeight: 'bold',
                    fontSize: '0.8rem',
                  },
                  '& hr': {
                    my: 0.2,
                    borderColor: theme.palette.divider,
                  },
                  '& strong': {
                    color: theme.palette.mode === 'dark' 
                      ? alpha(theme.palette.primary.light, 0.9)
                      : alpha(theme.palette.primary.dark, 0.9),
                  },
                  lineHeight: 1.1,
                }}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              </Box>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Paper>
      </Box>

      {/* Scroll to bottom button */}
      {messages.length > 0 && showScrollButton && (
        <Collapse in={showScrollButton} sx={{ position: 'absolute', bottom: 80, right: 16 }}>
          <Tooltip title="Scroll to bottom">
            <IconButton 
              color="primary" 
              onClick={scrollToBottom}
              sx={{ 
                backgroundColor: theme.palette.background.paper,
                boxShadow: theme.shadows[3],
                '&:hover': {
                  backgroundColor: alpha(theme.palette.background.paper, 0.9),
                }
              }}
            >
              <ScrollDownIcon />
            </IconButton>
          </Tooltip>
        </Collapse>
      )}

      {/* Divider above input box */}
      <Divider 
        sx={{
          position: 'sticky',
          bottom: 76,
          width: '100%',
          mx: 'auto',
          maxWidth: '1000px',
          opacity: 0.6,
        }}
      />

      {/* Input box - fixed at the bottom */}
      <Paper
        component="form"
        onSubmit={handleSubmit}
        elevation={3}
        sx={{
          p: { xs: 1.5, sm: 2 },
          display: 'flex',
          alignItems: 'center',
          position: 'sticky',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          borderRadius: '16px 16px 0 0',
          maxWidth: '1000px',
          mx: 'auto',
          width: '100%',
          mb: 0,
          transition: 'all 0.3s ease',
          boxShadow: isStreaming 
            ? `0 0 0 2px ${theme.palette.primary.main}, ${theme.shadows[3]}`
            : theme.shadows[3],
          backdropFilter: 'blur(10px)',
          backgroundColor: alpha(theme.palette.background.paper, 0.9),
        }}
      >
        <IconButton
          color="primary"
          aria-label="upload image"
          component="label"
          disabled={isStreaming || !isConnected}
          size="medium"
          sx={{ 
            mr: 1, 
            opacity: isStreaming || !isConnected ? 0.5 : 0.9,
            transition: 'all 0.2s',
            '&:hover': {
              transform: 'scale(1.05)',
              opacity: 1,
            }
          }}
        >
          <input hidden accept="image/*" type="file" />
          <ImageIcon />
        </IconButton>
        
        <TextField
          fullWidth
          variant="outlined"
          placeholder={isConnected ? "Type a message..." : "Connecting to server..."}
          value={inputValue}
          onChange={handleInputChange}
          disabled={isStreaming}
          multiline
          maxRows={4}
          size="small"
          autoComplete="off"
          InputProps={{
            sx: { 
              borderRadius: 2,
              fontSize: '0.95rem',
              py: 0.5,
              '&.Mui-focused': {
                boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.25)}`,
              },
              backgroundColor: alpha(theme.palette.background.paper, 0.6),
              backdropFilter: 'blur(4px)',
              transition: 'all 0.2s',
            }
          }}
        />
        
        <Tooltip title="Send message (Alt+Enter or Cmd+Enter)">
          <Box sx={{ position: 'relative', ml: 1 }}>
            <IconButton
              color="primary"
              aria-label="send message"
              type="submit"
              disabled={isStreaming || !isConnected || !inputValue.trim()}
              size="medium"
              sx={{ 
                backgroundColor: inputValue.trim() ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                '&:hover': {
                  backgroundColor: inputValue.trim() ? alpha(theme.palette.primary.main, 0.2) : 'transparent',
                  transform: inputValue.trim() ? 'scale(1.05)' : 'none',
                },
                transition: 'all 0.2s',
                position: 'relative',
                zIndex: 1,
              }}
            >
              {isStreaming ? <CircularProgress size={24} /> : <SendIcon />}
            </IconButton>
            {typingEffect && !isStreaming && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: '50%',
                  animation: 'pulse 1.5s infinite',
                  backgroundColor: alpha(theme.palette.primary.main, 0.2),
                  opacity: 0.6,
                  zIndex: 0,
                  '@keyframes pulse': {
                    '0%': {
                      transform: 'scale(0.95)',
                      opacity: 0.5,
                    },
                    '70%': {
                      transform: 'scale(1.1)',
                      opacity: 0.25,
                    },
                    '100%': {
                      transform: 'scale(0.95)',
                      opacity: 0.5,
                    },
                  },
                }}
              />
            )}
          </Box>
        </Tooltip>
      </Paper>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Copy Success Notification */}
      <Snackbar 
        open={isCopySuccess} 
        autoHideDuration={2000} 
        onClose={() => setIsCopySuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled">
          Copied to clipboard
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ChatWindow; 
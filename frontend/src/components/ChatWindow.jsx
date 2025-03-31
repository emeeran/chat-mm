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

  // Show welcome message when no messages
  const renderWelcomeScreen = () => (
    <Fade in={true} timeout={800}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100%',
        p: { xs: 2, sm: 4 },
        textAlign: 'center',
        opacity: 0.95,
        maxWidth: '900px',
        mx: 'auto',
      }}>
        <Typography 
          variant="h6" 
          sx={{ 
            mb: 2,
            color: theme.palette.text.secondary,
            fontWeight: 500,
          }}
        >
          Ask me anything or upload an image to discuss. I'm powered by various AI models and can perform web searches for the latest information.
        </Typography>
      </Box>
    </Fade>
  );

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
          mt: { xs: 7, md: 0 }, // Add top margin to push below the mobile app bar
          pt: 2,
          pb: 10, // Add padding to the bottom to ensure content isn't hidden behind the input box
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
        {messages.length === 0 ? (
          renderWelcomeScreen()
        ) : (
          <Box 
            sx={{ 
              py: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              maxWidth: '900px',
              mx: 'auto',
              width: '100%',
            }}
          >
            {console.log('Rendering messages:', messages)}
            {messages.map((message, index) => (
              <Message 
                key={index} 
                message={message}
                theme={theme}
                isStreaming={isStreaming && index === messages.length - 1 && message.role === 'assistant'}
                onCopySuccess={handleCopySuccess}
              />
            ))}
            <div ref={messagesEndRef} />
          </Box>
        )}
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
          maxWidth: '900px',
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
          maxWidth: '900px',
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
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
} from '@mui/material';
import {
  Send as SendIcon,
  KeyboardArrowDown as ScrollDownIcon,
  Image as ImageIcon,
  AttachFile as AttachFileIcon,
  Mic as MicIcon,
} from '@mui/icons-material';
import Message from './Message';
import BotIcon from './icons/BotIcon';

const ChatWindow = ({
  messages = [],
  userInput = '',
  setUserInput,
  handleInputChange,
  handleSubmit,
  isStreaming = false,
  isConnected = false,
}) => {
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      // Alt+Enter to submit
      if (e.altKey && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit(e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSubmit]);

  // Show welcome message when no messages
  const renderWelcomeScreen = () => (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      height: '100%',
      p: 3,
      textAlign: 'center',
      opacity: 0.8,
    }}>
      <BotIcon sx={{ fontSize: 80, mb: 2, opacity: 0.7 }} />
      <Typography variant="h5" gutterBottom>
        Welcome to Chat-MM
      </Typography>
      <Typography variant="body1" gutterBottom>
        Ask me anything or upload an image to discuss.
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500, mt: 1 }}>
        Use the sidebar to configure model settings and explore different features.
      </Typography>
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: 'calc(100vh - 64px)',
      p: { xs: 1, sm: 2 },
      overflow: 'hidden',
    }}>
      {/* Message list */}
      <Box
        ref={scrollContainerRef}
        onScroll={handleScroll}
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          mb: 2,
          px: { xs: 1, sm: 2 },
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderRadius: '4px',
          },
        }}
      >
        {messages.length === 0 ? (
          renderWelcomeScreen()
        ) : (
          <Box sx={{ py: 2 }}>
            {messages.map((message, index) => (
              <Message 
                key={index} 
                message={message}
              />
            ))}
            <div ref={messagesEndRef} />
          </Box>
        )}
      </Box>

      {/* Scroll to bottom button */}
      {messages.length > 0 && showScrollButton && (
        <Fab
          color="primary"
          size="small"
          aria-label="scroll down"
          onClick={scrollToBottom}
          sx={{
            position: 'absolute',
            bottom: 100,
            right: { xs: 20, sm: 30 },
            zIndex: 2,
          }}
        >
          <ScrollDownIcon />
        </Fab>
      )}

      {/* Input box - pinned to bottom */}
      <Paper
        component="form"
        onSubmit={handleSubmit}
        elevation={3}
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          position: 'sticky',
          bottom: 0,
          zIndex: 2,
          borderRadius: 3,
        }}
      >
        <IconButton
          color="primary"
          aria-label="upload image"
          component="label"
          disabled={isStreaming || !isConnected}
          size="small"
          sx={{ mr: 1 }}
        >
          <input hidden accept="image/*" type="file" />
          <ImageIcon />
        </IconButton>
        
        <TextField
          fullWidth
          variant="outlined"
          placeholder={isConnected ? "Type a message..." : "Connecting to server..."}
          value={userInput}
          onChange={handleInputChange}
          disabled={isStreaming || !isConnected}
          multiline
          maxRows={4}
          size="small"
          autoComplete="off"
          InputProps={{
            sx: { borderRadius: 2 }
          }}
        />
        
        <IconButton
          color="primary"
          aria-label="send message"
          type="submit"
          disabled={isStreaming || !isConnected || !userInput.trim()}
          size="small"
          sx={{ ml: 1 }}
        >
          {isStreaming ? <CircularProgress size={24} /> : <SendIcon />}
        </IconButton>
      </Paper>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ChatWindow; 
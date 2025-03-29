import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  useTheme,
  Divider,
  alpha,
  Chip,
  Tooltip,
  IconButton,
} from '@mui/material';
import { 
  Person as PersonIcon,
  Android as BotIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  ContentCopy as CopyIcon,
  Check as CopySuccessIcon
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

const Message = ({ message, isStreaming = false, onHeightChange }) => {
  const theme = useTheme();
  const messageRef = useRef(null);
  const [renderedHeight, setRenderedHeight] = useState(0);
  const [copied, setCopied] = useState(false);
  
  // Measure the height of the message after it renders
  useEffect(() => {
    if (messageRef.current && onHeightChange) {
      const observer = new ResizeObserver(entries => {
        const entry = entries[0];
        if (entry && entry.contentRect) {
          const height = entry.contentRect.height;
          if (height !== renderedHeight && height > 0) {
            setRenderedHeight(height);
            onHeightChange(height);
          }
        }
      });
      
      observer.observe(messageRef.current);
      return () => observer.disconnect();
    }
  }, [message.text, onHeightChange, renderedHeight]);

  // Reset copy status after 2 seconds
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const getBgColor = () => {
    switch (message.type) {
      case 'user':
        return theme.palette.mode === 'dark' 
          ? alpha(theme.palette.primary.dark, 0.2)
          : alpha(theme.palette.primary.light, 0.1);
      case 'bot':
        return theme.palette.mode === 'dark'
          ? alpha(theme.palette.background.paper, 0.6)
          : alpha(theme.palette.background.paper, 0.6);
      case 'error':
        return theme.palette.mode === 'dark'
          ? alpha(theme.palette.error.dark, 0.2)
          : alpha(theme.palette.error.light, 0.1);
      case 'info':
      default:
        return theme.palette.mode === 'dark'
          ? alpha(theme.palette.info.dark, 0.2)
          : alpha(theme.palette.info.light, 0.1);
    }
  };

  const getTextColor = () => {
    switch (message.type) {
      case 'error':
        return theme.palette.error.main;
      case 'info':
        return theme.palette.info.main;
      default:
        return theme.palette.text.primary;
    }
  };

  const getIcon = () => {
    switch (message.type) {
      case 'user':
        return <PersonIcon aria-hidden="true" />;
      case 'bot':
        return <BotIcon aria-hidden="true" />;
      case 'error':
        return <ErrorIcon aria-hidden="true" />;
      case 'info':
        return <InfoIcon aria-hidden="true" />;
      default:
        return <BotIcon aria-hidden="true" />;
    }
  };

  const getRoleLabel = () => {
    switch (message.type) {
      case 'user':
        return 'You';
      case 'bot':
        return 'AI';
      default:
        return message.type.charAt(0).toUpperCase() + message.type.slice(1);
    }
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
  };

  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.3,
        type: "spring",
        stiffness: 100
      }
    },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };

  // Create timestamp from message id (which is usually a timestamp)
  const messageTime = message.id && typeof message.id === 'number' 
    ? new Date(message.id).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={variants}
      ref={messageRef}
      layout
    >
      <Paper
        elevation={message.type === 'error' ? 2 : 0}
        sx={{
          p: 2,
          mb: 2,
          mx: 2,
          borderRadius: theme.shape.borderRadius * 1.5,
          backgroundColor: getBgColor(),
          borderLeft: message.type === 'user' ? `4px solid ${theme.palette.primary.main}` : 'none',
          borderRight: message.type === 'bot' ? `4px solid ${theme.palette.secondary.main}` : 'none',
          maxWidth: '100%',
          wordBreak: 'break-word',
          boxShadow: message.type === 'error' ? `0 0 5px ${theme.palette.error.main}` : 'none',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          '&:hover .message-actions': {
            opacity: 1
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              sx={{
                mr: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: '50%',
                bgcolor: alpha(getTextColor(), 0.1)
              }}
            >
              {getIcon()}
            </Box>
            <Chip
              label={getRoleLabel()}
              size="small"
              color={message.type === 'error' ? 'error' : message.type === 'info' ? 'info' : message.type === 'user' ? 'primary' : 'secondary'}
              variant="outlined"
              sx={{ height: 24, fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.7rem' }}
            />
            {isStreaming && (
              <Box 
                component="span" 
                sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  bgcolor: theme.palette.success.main,
                  display: 'inline-block',
                  ml: 1,
                  boxShadow: `0 0 0 rgba(${theme.palette.success.main}, 0.4)`,
                  animation: 'pulse 1.5s infinite',
                  '@keyframes pulse': {
                    '0%': {
                      boxShadow: `0 0 0 0 ${alpha(theme.palette.success.main, 0.4)}`
                    },
                    '70%': {
                      boxShadow: `0 0 0 10px ${alpha(theme.palette.success.main, 0)}`
                    },
                    '100%': {
                      boxShadow: `0 0 0 0 ${alpha(theme.palette.success.main, 0)}`
                    }
                  }
                }}
                aria-label="Message streaming in progress"
              />
            )}
          </Box>
          
          {/* Timestamp */}
          {messageTime && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              {messageTime}
            </Typography>
          )}
        </Box>
        
        <Divider sx={{ mb: 1.5 }} />
        
        {/* Message actions - only visible on hover */}
        {message.type !== 'info' && (
          <Box 
            className="message-actions"
            sx={{ 
              position: 'absolute', 
              top: 8, 
              right: 8,
              opacity: 0,
              transition: 'opacity 0.2s ease-in-out',
              zIndex: 2,
              bgcolor: alpha(theme.palette.background.paper, 0.8),
              backdropFilter: 'blur(4px)',
              borderRadius: theme.shape.borderRadius,
              boxShadow: 1
            }}
          >
            <Tooltip title={copied ? "Copied!" : "Copy message"}>
              <IconButton
                size="small"
                onClick={handleCopyMessage}
                color={copied ? "success" : "default"}
                aria-label="Copy message text"
              >
                {copied ? <CopySuccessIcon fontSize="small" /> : <CopyIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Box>
        )}
        
        <Box sx={{ 
          '& code': {
            backgroundColor: alpha(theme.palette.text.primary, 0.1),
            padding: '2px 5px',
            borderRadius: 1,
            fontFamily: 'monospace',
            fontSize: '0.9em'
          },
          '& p': {
            my: 0.5
          },
          '& ul, & ol': {
            pl: 2.5,
            my: 0.5
          },
          '& a': {
            color: theme.palette.primary.main,
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline'
            }
          },
          '& blockquote': {
            borderLeft: `4px solid ${alpha(theme.palette.text.primary, 0.2)}`,
            pl: 2,
            py: 0.5,
            my: 1,
            bgcolor: alpha(theme.palette.text.primary, 0.05),
            borderRadius: 1
          },
          '& table': {
            borderCollapse: 'collapse',
            width: '100%',
            my: 2
          },
          '& th, & td': {
            border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
            padding: '8px 12px',
            textAlign: 'left'
          },
          '& th': {
            backgroundColor: alpha(theme.palette.primary.main, 0.1)
          },
          '& img': {
            maxWidth: '100%',
            height: 'auto',
            borderRadius: 1,
            my: 1
          }
        }}>
          {message.type === 'user' ? (
            <Typography variant="body1">{message.text}</Typography>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({node, inline, className, children, ...props}) {
                  const match = /language-(\w+)/.exec(className || '');
                  
                  return !inline && match ? (
                    <Box sx={{ position: 'relative', mb: 2 }}>
                      <Box 
                        sx={{ 
                          position: 'absolute', 
                          top: 0, 
                          right: 0, 
                          bgcolor: alpha(theme.palette.background.paper, 0.8),
                          px: 1,
                          py: 0.5,
                          borderTopRightRadius: theme.shape.borderRadius,
                          fontSize: '0.75rem',
                          color: theme.palette.text.secondary,
                          fontFamily: 'monospace',
                          letterSpacing: 0.5,
                          zIndex: 1
                        }}
                      >
                        {match[1]}
                      </Box>
                      <SyntaxHighlighter
                        style={theme.palette.mode === 'dark' ? vscDarkPlus : prism}
                        language={match[1]}
                        PreTag="div"
                        showLineNumbers={true}
                        wrapLines={true}
                        {...props}
                        customStyle={{
                          borderRadius: theme.shape.borderRadius,
                          marginTop: '8px',
                          marginBottom: '8px'
                        }}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    </Box>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {message.text}
            </ReactMarkdown>
          )}
        </Box>
      </Paper>
    </motion.div>
  );
};

export default Message; 
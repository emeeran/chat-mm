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
  Avatar,
} from '@mui/material';
import { 
  Person as PersonIcon,
  Android as BotIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  ContentCopy as CopyIcon,
  Check as CopySuccessIcon,
  Code as CodeIcon,
  FormatQuote as QuoteIcon,
  Image as ImageIcon,
  Link as LinkIcon
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
          ? alpha(theme.palette.primary.dark, 0.1)
          : alpha(theme.palette.primary.light, 0.05);
      case 'bot':
        return theme.palette.mode === 'dark'
          ? alpha(theme.palette.background.paper, 0.6)
          : alpha(theme.palette.background.paper, 1);
      case 'error':
        return theme.palette.mode === 'dark'
          ? alpha(theme.palette.error.dark, 0.1)
          : alpha(theme.palette.error.light, 0.05);
      case 'info':
      default:
        return theme.palette.mode === 'dark'
          ? alpha(theme.palette.info.dark, 0.1)
          : alpha(theme.palette.info.light, 0.05);
    }
  };

  const getBorderColor = () => {
    switch (message.type) {
      case 'user':
        return theme.palette.mode === 'dark'
          ? alpha(theme.palette.primary.main, 0.5)
          : theme.palette.primary.main;
      case 'bot':
        return theme.palette.mode === 'dark' 
          ? alpha(theme.palette.divider, 0.2)
          : alpha(theme.palette.divider, 0.5);
      case 'error':
        return theme.palette.error.main;
      case 'info':
        return theme.palette.info.main;
      default:
        return theme.palette.divider;
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

  const getAvatarBgColor = () => {
    switch (message.type) {
      case 'user':
        return theme.palette.primary.main;
      case 'bot':
        return theme.palette.mode === 'dark'
          ? theme.palette.grey[700]
          : theme.palette.grey[300];
      case 'error':
        return theme.palette.error.main;
      case 'info':
        return theme.palette.info.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const getIcon = () => {
    switch (message.type) {
      case 'user':
        return <PersonIcon aria-hidden="true" fontSize="small" />;
      case 'bot':
        return <BotIcon aria-hidden="true" fontSize="small" />;
      case 'error':
        return <ErrorIcon aria-hidden="true" fontSize="small" />;
      case 'info':
        return <InfoIcon aria-hidden="true" fontSize="small" />;
      default:
        return <BotIcon aria-hidden="true" fontSize="small" />;
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
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.3,
        type: "spring",
        stiffness: 100,
        damping: 15
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
        elevation={message.type === 'bot' ? 1 : 0}
        sx={{
          p: 2,
          mb: 1.5,
          mx: { xs: 0, sm: message.type === 'user' ? 2 : 1 },
          ml: { sm: message.type === 'user' ? 'auto' : 1 },
          mr: { sm: message.type === 'bot' ? 'auto' : 1 },
          borderRadius: 2,
          backgroundColor: getBgColor(),
          border: `1px solid ${getBorderColor()}`,
          maxWidth: { xs: '100%', sm: message.type === 'user' ? '80%' : '90%' },
          wordBreak: 'break-word',
          position: 'relative',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: theme.shadows[2],
            transform: 'translateY(-1px)',
            '.message-actions': {
              opacity: 1
            }
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              sx={{
                mr: 1.5,
                width: 32, 
                height: 32,
                bgcolor: getAvatarBgColor(),
                color: message.type === 'bot' ? theme.palette.text.primary : '#fff',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'scale(1.1)'
                }
              }}
            >
              {getIcon()}
            </Avatar>
            <Typography 
              variant="caption" 
              sx={{ 
                fontWeight: 'bold', 
                color: message.type === 'user'
                  ? theme.palette.primary.main
                  : message.type === 'bot'
                    ? theme.palette.secondary.main
                    : getTextColor()
              }}
            >
              {getRoleLabel()}
            </Typography>
            
            {isStreaming && (
              <Box 
                component="span" 
                sx={{ 
                  width: 6, 
                  height: 6, 
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
              >
                {copied ? <CopySuccessIcon fontSize="small" /> : <CopyIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Box>
        )}
        
        {/* Message content */}
        <Box 
          sx={{ 
            pl: { sm: 4 },
            '& img': {
              maxWidth: '100%',
              borderRadius: theme.shape.borderRadius,
              my: 1
            },
            '& p:first-of-type': {
              mt: 0,
            },
            '& p:last-of-type': {
              mb: 0,
            },
            '& p': {
              my: 1.5,
              fontSize: '0.95rem',
              lineHeight: 1.6
            },
            '& h1, & h2, & h3, & h4, & h5, & h6': {
              mt: 2.5,
              mb: 1.5
            },
            '& ul, & ol': {
              paddingLeft: 2.5,
              mb: 1
            },
            '& li': {
              mb: 0.5
            },
            '& a': {
              color: theme.palette.primary.main,
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline'
              }
            },
            '& blockquote': {
              borderLeft: `3px solid ${theme.palette.divider}`,
              pl: 2,
              ml: 0,
              my: 2,
              fontStyle: 'italic',
              color: theme.palette.text.secondary
            },
            '& code': {
              fontFamily: 'monospace',
              backgroundColor: alpha(theme.palette.divider, 0.2),
              padding: '2px 4px',
              borderRadius: '3px',
              fontSize: '0.9em'
            },
            '& pre': {
              margin: '16px 0',
              borderRadius: theme.shape.borderRadius,
              padding: 0,
              overflow: 'hidden'
            },
            '& table': {
              borderCollapse: 'collapse',
              width: '100%',
              my: 2,
              borderRadius: theme.shape.borderRadius,
              overflow: 'hidden',
              border: `1px solid ${theme.palette.divider}`
            },
            '& thead': {
              backgroundColor: alpha(theme.palette.action.hover, 0.5)
            },
            '& th, & td': {
              border: `1px solid ${theme.palette.divider}`,
              padding: '8px 12px',
              textAlign: 'left'
            },
            '& hr': {
              border: 'none',
              height: '1px',
              backgroundColor: theme.palette.divider,
              my: 2
            }
          }}
        >
          {message.type === 'error' || message.type === 'info' ? (
            <Typography variant="body2" color={getTextColor()} sx={{ fontWeight: message.type === 'error' ? 500 : 400 }}>
              {message.text}
            </Typography>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({node, inline, className, children, ...props}) {
                  const match = /language-(\w+)/.exec(className || '');
                  const language = match ? match[1] : '';
                  
                  return !inline ? (
                    <Box sx={{ position: 'relative' }}>
                      <Box 
                        sx={{ 
                          position: 'absolute', 
                          top: 0, 
                          right: 0, 
                          zIndex: 1,
                          p: 0.5,
                          bgcolor: alpha(theme.palette.background.paper, 0.8),
                          borderBottomLeftRadius: theme.shape.borderRadius,
                          fontSize: '0.75rem',
                          color: theme.palette.text.secondary 
                        }}
                      >
                        {language || 'code'}
                        <Tooltip title={copied ? "Copied!" : "Copy code"}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                              setCopied(true);
                            }}
                            color={copied ? "success" : "default"}
                            sx={{ ml: 0.5, p: 0.5 }}
                          >
                            {copied ? <CopySuccessIcon fontSize="small" /> : <CopyIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <SyntaxHighlighter
                        style={theme.palette.mode === 'dark' ? vscDarkPlus : prism}
                        language={language}
                        PreTag="div"
                        wrapLines={true}
                        customStyle={{
                          margin: 0,
                          padding: '1.5rem 1rem 1rem',
                          borderRadius: theme.shape.borderRadius,
                        }}
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    </Box>
                  ) : (
                    <code
                      className={className}
                      {...props}
                      style={{
                        fontFamily: 'monospace',
                        backgroundColor: alpha(theme.palette.divider, 0.2),
                        padding: '2px 4px',
                        borderRadius: '3px',
                        fontSize: '0.85em'
                      }}
                    >
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
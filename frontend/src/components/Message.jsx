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
  Collapse,
  CircularProgress,
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
  Link as LinkIcon,
  CheckCircle as CheckIcon,
  ErrorOutline as ErrorOutlineIcon,
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, prism, tomorrow, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

const Message = ({ message, isStreaming = false, theme, onCopySuccess }) => {
  console.log('Rendering message:', message);
  const messageRef = useRef(null);
  const [renderedHeight, setRenderedHeight] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showActions, setShowActions] = useState(false);
  
  // Measure the height of the message after it renders
  useEffect(() => {
    if (messageRef.current) {
      const observer = new ResizeObserver(entries => {
        const entry = entries[0];
        if (entry && entry.contentRect) {
          const height = entry.contentRect.height;
          if (height !== renderedHeight && height > 0) {
            setRenderedHeight(height);
          }
        }
      });
      
      observer.observe(messageRef.current);
      return () => observer.disconnect();
    }
  }, [message.content, renderedHeight]);

  // Reset copy status after 2 seconds
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const isUserMessage = message.role === 'user';
  const isAssistantMessage = message.role === 'assistant';
  const isErrorMessage = message.role === 'error' || message.error;
  const isInfoMessage = message.role === 'info' || message.info;

  const getBgColor = () => {
    if (isUserMessage) {
      return alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.08);
    }
    if (isAssistantMessage) {
      return alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.4 : 1);
    }
    if (isErrorMessage) {
      return theme.palette.mode === 'dark'
        ? alpha(theme.palette.error.dark, 0.1)
        : alpha(theme.palette.error.light, 0.05);
    }
    if (isInfoMessage) {
      return theme.palette.mode === 'dark'
        ? alpha(theme.palette.info.dark, 0.1)
        : alpha(theme.palette.info.light, 0.05);
    }
    return theme.palette.mode === 'dark'
      ? alpha(theme.palette.background.paper, 0.6)
      : alpha(theme.palette.background.paper, 1);
  };

  const getBorderColor = () => {
    if (isUserMessage) {
      return alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.3 : 0.2);
    }
    if (isAssistantMessage) {
      return alpha(theme.palette.divider, 1);
    }
    if (isErrorMessage) {
      return theme.palette.error.main;
    }
    if (isInfoMessage) {
      return theme.palette.info.main;
    }
    return theme.palette.divider;
  };

  const getTextColor = () => {
    if (isErrorMessage) {
      return theme.palette.error.main;
    }
    if (isInfoMessage) {
      return theme.palette.info.main;
    }
    return theme.palette.text.primary;
  };

  const getAvatarBgColor = () => {
    if (isUserMessage) {
      return theme.palette.primary.main;
    }
    if (isAssistantMessage) {
      return theme.palette.mode === 'dark'
        ? theme.palette.grey[700]
        : theme.palette.grey[300];
    }
    if (isErrorMessage) {
      return theme.palette.error.main;
    }
    if (isInfoMessage) {
      return theme.palette.info.main;
    }
    return theme.palette.grey[500];
  };

  const getIcon = () => {
    if (isUserMessage) {
      return <PersonIcon aria-hidden="true" fontSize="small" />;
    }
    if (isAssistantMessage) {
      return <BotIcon aria-hidden="true" fontSize="small" />;
    }
    if (isErrorMessage) {
      return <ErrorIcon aria-hidden="true" fontSize="small" />;
    }
    if (isInfoMessage) {
      return <InfoIcon aria-hidden="true" fontSize="small" />;
    }
    return <BotIcon aria-hidden="true" fontSize="small" />;
  };

  const getRoleLabel = () => {
    if (isUserMessage) {
      return 'You';
    }
    if (isAssistantMessage) {
      return 'AI';
    }
    if (isErrorMessage) {
      return 'Error';
    }
    if (isInfoMessage) {
      return 'Info';
    }
    return message.role.charAt(0).toUpperCase() + message.role.slice(1);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
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

  const renderContent = () => {
    if (isErrorMessage) {
      return (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.error.main, 0.08),
            borderLeft: `4px solid ${theme.palette.error.main}`,
            color: theme.palette.error.main,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1,
          }}
        >
          <ErrorOutlineIcon color="error" sx={{ mt: 0.25 }} />
          <Typography>{message.content}</Typography>
        </Paper>
      );
    }

    if (isInfoMessage) {
      return (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.info.main, 0.08),
            borderLeft: `4px solid ${theme.palette.info.main}`,
            color: theme.palette.info.main,
          }}
        >
          <Typography>{message.content}</Typography>
        </Paper>
      );
    }

    return (
      <Box
        sx={{
          '& p': { my: 1 },
          '& h1, & h2, & h3, & h4, & h5, & h6': { 
            mt: 2, 
            mb: 1,
            fontWeight: 'bold',
          },
          '& ul, & ol': { pl: 3, my: 1 },
          '& li': { mb: 0.5 },
          '& code': {
            px: 0.5,
            py: 0.25,
            borderRadius: 0.75,
            backgroundColor: alpha(theme.palette.primary.main, 0.08),
            color: theme.palette.mode === 'dark' 
              ? theme.palette.primary.light 
              : theme.palette.primary.dark,
            fontFamily: 'monospace',
          },
          '& pre': {
            backgroundColor: 'transparent',
            p: 0,
            m: 0,
            mt: 1,
            mb: 2,
          },
          '& blockquote': {
            ml: 0,
            pl: 2,
            borderLeft: `3px solid ${alpha(theme.palette.text.secondary, 0.3)}`,
            color: theme.palette.text.secondary,
          },
          '& a': {
            color: theme.palette.primary.main,
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline',
            },
          },
          '& table': {
            borderCollapse: 'collapse',
            width: '100%',
            my: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
            borderRadius: 1,
            overflow: 'hidden',
          },
          '& th': {
            backgroundColor: alpha(theme.palette.primary.main, 0.08),
            border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
            p: 1,
            textAlign: 'left',
            fontWeight: 'bold',
          },
          '& td': {
            border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
            p: 1,
          },
          '& hr': {
            border: 'none',
            height: '1px',
            backgroundColor: theme.palette.divider,
            my: 2,
          },
        }}
      >
        <ReactMarkdown
          children={message.content}
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              const language = match ? match[1] : '';
              
              return !inline ? (
                <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', my: 2 }}>
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      top: 0, 
                      right: 0, 
                      zIndex: 1,
                      p: 0.5,
                      backgroundColor: alpha(theme.palette.background.paper, 0.8),
                      backdropFilter: 'blur(4px)',
                      borderBottomLeftRadius: 8,
                    }}
                  >
                    <Tooltip title={copied ? "Copied!" : "Copy code"}>
                      <IconButton 
                        size="small" 
                        onClick={() => {
                          navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                          setCopied(true);
                        }}
                        color={copied ? "success" : "default"}
                      >
                        {copied ? <CheckIcon fontSize="small" /> : <CopyIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <SyntaxHighlighter
                    language={language || 'text'}
                    style={theme.palette.mode === 'dark' ? tomorrow : vs}
                    PreTag="div"
                    customStyle={{
                      margin: 0,
                      borderRadius: '8px',
                      padding: '16px',
                      fontSize: '0.9rem',
                      lineHeight: '1.5',
                    }}
                    {...props}
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
        />
      </Box>
    );
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={variants}
      ref={messageRef}
      layout
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <Paper
        elevation={isAssistantMessage ? 1 : 0}
        sx={{
          p: 2,
          mb: 0,
          mx: { xs: 0, sm: isUserMessage ? 2 : 1 },
          ml: { sm: isUserMessage ? 'auto' : 1 },
          mr: { sm: isAssistantMessage ? 'auto' : 1 },
          borderRadius: 2,
          backgroundColor: getBgColor(),
          border: `1px solid ${getBorderColor()}`,
          maxWidth: { xs: '100%', sm: isUserMessage ? '80%' : '90%' },
          minWidth: { xs: '50%', sm: 'auto' },
          wordBreak: 'break-word',
          position: 'relative',
          transition: 'all 0.2s ease-in-out',
          overflow: 'hidden',
          '&:hover': {
            boxShadow: theme.shadows[2],
            transform: 'translateY(-1px)',
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              sx={{
                mr: 1.5,
                width: 32, 
                height: 32,
                bgcolor: getAvatarBgColor(),
                color: isAssistantMessage ? theme.palette.text.primary : '#fff',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'scale(1.1)'
                }
              }}
            >
              {getIcon()}
            </Avatar>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                fontWeight: 'bold', 
                color: isUserMessage
                  ? theme.palette.primary.main
                  : isAssistantMessage
                    ? theme.palette.secondary.main
                    : getTextColor()
              }}
            >
              {getRoleLabel()}
              
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
            </Typography>
          </Box>
          
          {/* Timestamp */}
          {messageTime && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              {messageTime}
            </Typography>
          )}
        </Box>
        
        {/* Message actions - only visible on hover */}
        {!isInfoMessage && (
          <Box 
            sx={{ 
              position: 'absolute', 
              top: 8, 
              right: 8,
              opacity: showActions ? 1 : 0,
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
        {renderContent()}
      </Paper>
    </motion.div>
  );
};

export default Message; 
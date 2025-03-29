import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  useTheme,
} from '@mui/material';
import { 
  Person as PersonIcon,
  SmartToy as BotIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const Message = ({ message, isStreaming = false }) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  
  // Determine message styling based on type
  const getMessageStyles = () => {
    switch (message.type) {
      case 'user':
        return {
          bg: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
          border: isDarkMode ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid rgba(59, 130, 246, 0.15)',
          icon: <PersonIcon />,
          avatar: { bgcolor: 'primary.main' },
          title: 'You',
          align: 'flex-end',
        };
      case 'bot':
        return {
          bg: 'transparent',
          border: `1px solid ${theme.palette.divider}`,
          icon: <BotIcon />,
          avatar: { bgcolor: isDarkMode ? 'grey.700' : 'grey.200' },
          title: 'Assistant',
          align: 'flex-start',
        };
      case 'error':
        return {
          bg: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
          border: isDarkMode ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(239, 68, 68, 0.15)',
          icon: <ErrorIcon />,
          avatar: { bgcolor: 'error.main' },
          title: 'Error',
          align: 'flex-start',
        };
      case 'info':
        return {
          bg: isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
          border: isDarkMode ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid rgba(59, 130, 246, 0.15)',
          icon: <InfoIcon />,
          avatar: { bgcolor: 'info.main' },
          title: 'System',
          align: 'center',
        };
      default:
        return {
          bg: 'transparent',
          border: `1px solid ${theme.palette.divider}`,
          icon: <BotIcon />,
          avatar: { bgcolor: 'grey.500' },
          title: 'Unknown',
          align: 'flex-start',
        };
    }
  };
  
  const styles = getMessageStyles();
  
  const MessageContent = () => (
    <Box sx={{ flex: 1 }}>
      {message.type !== 'info' && (
        <Typography 
          variant="subtitle2" 
          sx={{ 
            mb: 0.5, 
            color: theme.palette.text.secondary,
            fontWeight: 500
          }}
        >
          {styles.title}
        </Typography>
      )}
      
      {message.text ? (
        <ReactMarkdown
          components={{
            p: ({ node, ...props }) => (
              <Typography
                variant="body1"
                sx={{ my: 1, wordBreak: 'break-word' }}
                {...props}
              />
            ),
            code: ({ node, inline, className, children, ...props }) => {
              const match = /language-(\w+)/.exec(className || '');
              return !inline ? (
                <SyntaxHighlighter
                  style={oneDark}
                  language={match ? match[1] : 'text'}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code
                  className={className}
                  {...props}
                >
                  {children}
                </code>
              );
            },
            ul: ({ node, ...props }) => (
              <Box component="ul" sx={{ pl: 2, my: 1 }} {...props} />
            ),
            ol: ({ node, ...props }) => (
              <Box component="ol" sx={{ pl: 2, my: 1 }} {...props} />
            ),
            li: ({ node, ...props }) => (
              <Box component="li" sx={{ my: 0.5 }} {...props} />
            ),
          }}
        >
          {message.text}
        </ReactMarkdown>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
        </Box>
      )}
    </Box>
  );
  
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: styles.align === 'flex-end' ? 'flex-end' : 
                       styles.align === 'center' ? 'center' : 'flex-start',
        mb: 2,
        px: { xs: 1, sm: 2 },
        maxWidth: '100%',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ 
          maxWidth: styles.align === 'center' ? '80%' : '85%',
          width: styles.align === 'center' ? 'auto' : null
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: styles.bg,
            border: styles.border,
            display: 'flex',
            gap: 2,
            alignItems: 'flex-start',
          }}
        >
          {message.type !== 'info' && (
            <Avatar sx={styles.avatar}>
              {styles.icon}
            </Avatar>
          )}
          
          <MessageContent />
        </Paper>
      </motion.div>
    </Box>
  );
};

export default Message; 
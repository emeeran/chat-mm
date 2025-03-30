import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Box,
  Button,
  Chip,
  useTheme
} from '@mui/material';
import { 
  GitHub as GitHubIcon
} from '@mui/icons-material';
import { useSocket } from '../services/socketContext';

const Header = () => {
  const theme = useTheme();
  const { isConnected, connectionError } = useSocket();
  
  return (
    <AppBar 
      position="static" 
      color="transparent" 
      elevation={0}
      sx={{ 
        borderBottom: `1px solid ${theme.palette.divider}`,
        backdropFilter: 'blur(8px)',
        backgroundColor: theme.palette.mode === 'dark' 
          ? 'rgba(15, 23, 42, 0.8)' 
          : 'rgba(255, 255, 255, 0.8)',
      }}
    >
      <Toolbar sx={{ position: 'relative' }}>
        {/* Connection status on the left */}
        <Box sx={{ position: 'absolute', left: 16, display: 'flex', alignItems: 'center' }}>
          <Chip 
            label={isConnected ? "Connected" : connectionError ? "Error" : "Disconnected"} 
            size="small"
            color={isConnected ? "success" : connectionError ? "error" : "default"}
          />
        </Box>
        
        {/* Centered title */}
        <Box sx={{ 
          position: 'absolute', 
          left: '50%', 
          top: '50%', 
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Box 
            component="span" 
            sx={{ 
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: 'primary.main',
              color: 'white',
              fontWeight: 'bold',
              mr: 1
            }}
          >
            C
          </Box>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ fontWeight: 700 }}
          >
            Chat-MM
          </Typography>
        </Box>
        
        {/* GitHub button on the right */}
        <Box sx={{ position: 'absolute', right: 16 }}>
          <Button 
            variant="outlined" 
            color="inherit" 
            size="small"
            startIcon={<GitHubIcon />}
            href="https://github.com"
            target="_blank"
          >
            GitHub
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 
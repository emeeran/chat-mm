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
  DarkMode as DarkModeIcon, 
  LightMode as LightModeIcon,
  GitHub as GitHubIcon
} from '@mui/icons-material';
import { useColorMode } from '../theme/ThemeProvider';
import { useSocket } from '../services/socketContext';

const Header = () => {
  const theme = useTheme();
  const colorMode = useColorMode();
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
      <Toolbar>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
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
            R
          </Box>
          RAG Chat
          
          <Chip 
            label={isConnected ? "Connected" : connectionError ? "Error" : "Disconnected"} 
            size="small"
            color={isConnected ? "success" : connectionError ? "error" : "default"}
            sx={{ ml: 2 }}
          />
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="outlined" 
            color="inherit" 
            size="small"
            startIcon={<GitHubIcon />}
            href="https://github.com"
            target="_blank"
            sx={{ mr: 1 }}
          >
            GitHub
          </Button>
          
          <IconButton 
            onClick={colorMode.toggleColorMode} 
            color="inherit"
            aria-label="toggle dark mode"
          >
            {theme.palette.mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 
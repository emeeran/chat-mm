import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Tooltip,
  useMediaQuery,
  Chip,
  alpha,
  Avatar,
  Button,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Menu as MenuIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  WifiOff as DisconnectedIcon,
  SignalWifi4Bar as ConnectedIcon,
  Psychology as AIIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

const Header = ({ darkMode, toggleDarkMode, onToggleSidebar, isConnected }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <AppBar 
      position="sticky" 
      color="inherit" 
      elevation={0}
      sx={{ 
        borderBottom: `1px solid ${theme.palette.divider}`,
        backdropFilter: 'blur(12px)',
        backgroundColor: alpha(theme.palette.background.paper, 0.8),
        zIndex: theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ minHeight: { xs: 56, sm: 64 }, px: { xs: 1.5, sm: 2.5 } }}>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="open settings"
          onClick={onToggleSidebar}
          sx={{ 
            mr: 1.5,
            backgroundColor: alpha(theme.palette.primary.main, 0.08),
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.15),
            }
          }}
        >
          <MenuIcon />
        </IconButton>
        
        <Box 
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            flexGrow: 1,
          }}
        >
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5,
              mr: 2,
            }}
          >
            <Avatar 
              sx={{ 
                width: 36, 
                height: 36, 
                backgroundColor: alpha(theme.palette.primary.main, 0.9),
                color: theme.palette.primary.contrastText,
                fontWeight: 'bold',
                fontSize: '1rem',
              }}
            >
              C
            </Avatar>

            <Box>
              <Typography 
                variant="h6" 
                component="div" 
                sx={{ 
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  lineHeight: 1.2,
                }}
              >
                Chat-MM
                {!isMobile && (
                  <Chip
                    size="small"
                    label="Beta"
                    color="primary"
                    variant="outlined"
                    sx={{ ml: 0.5, height: 20, fontSize: '0.65rem' }}
                  />
                )}
              </Typography>
              {!isMobile && (
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ display: 'block', mt: -0.2 }}
                >
                  Multi-Model Chat
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Connection status indicator */}
          <Tooltip 
            title={isConnected ? "Connected to server" : "Disconnected from server"}
            arrow
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                px: 1.2,
                py: 0.6,
                borderRadius: 5,
                backgroundColor: alpha(
                  isConnected ? theme.palette.success.main : theme.palette.error.main, 
                  0.1
                ),
                border: `1px solid ${alpha(
                  isConnected ? theme.palette.success.main : theme.palette.error.main,
                  0.4
                )}`,
                color: isConnected ? theme.palette.success.main : theme.palette.error.main,
                mr: 1,
              }}
            >
              <Box 
                component="span" 
                sx={{ 
                  display: { xs: 'none', sm: 'block' },
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  mr: 0.5 
                }}
              >
                {isConnected ? "Connected" : "Offline"}
              </Box>
              {isConnected ? 
                <ConnectedIcon fontSize="small" /> : 
                <DisconnectedIcon fontSize="small" />
              }
            </Box>
          </Tooltip>
          
          {/* Dark/Light mode toggle */}
          <Tooltip 
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            arrow
          >
            <IconButton 
              onClick={toggleDarkMode} 
              color="inherit"
              sx={{ 
                borderRadius: 2,
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.15),
                }
              }}
            >
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 
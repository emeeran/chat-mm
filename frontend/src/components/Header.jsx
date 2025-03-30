import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  useTheme,
  alpha,
  Button,
  Chip,
  Tooltip,
  useMediaQuery,
  Avatar,
  Badge
} from '@mui/material';
import {
  Menu as MenuIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  GitHub as GitHubIcon,
  Info as InfoIcon,
  CloudDone as CloudIcon,
  Psychology as AIIcon,
  SmartToy as RobotIcon
} from '@mui/icons-material';

const Header = ({ 
  toggleSidebar, 
  darkMode, 
  toggleDarkMode, 
  isConnected = true
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <AppBar 
      position="sticky" 
      color="inherit" 
      elevation={0}
      sx={{
        borderBottom: `1px solid ${theme.palette.divider}`,
        bgcolor: alpha(theme.palette.background.paper, 0.7),
        backdropFilter: 'blur(10px)',
        zIndex: theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar 
        sx={{ 
          minHeight: { xs: 56, sm: 64 },
          justifyContent: 'space-between',
          px: { xs: 1, sm: 2 },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {!isMobile && (
            <IconButton 
              color="inherit" 
              edge="start" 
              onClick={toggleSidebar}
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Avatar
            sx={{
              width: 36,
              height: 36,
              mr: 1.5,
              bgcolor: theme.palette.primary.main,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
            }}
          >
            <RobotIcon fontSize="small" />
          </Avatar>
          
          <Typography 
            variant="h6" 
            component="div" 
            color="primary"
            fontWeight="700"
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              letterSpacing: 0.5,
              fontSize: { xs: '1.1rem', sm: '1.3rem' },
              mr: 1
            }}
          >
            Chat-MM
            <Chip
              size="small"
              label="BETA"
              color="secondary"
              sx={{ 
                ml: 1, 
                height: 20, 
                fontSize: '0.6rem',
                fontWeight: 'bold',
                '& .MuiChip-label': { px: 0.8 }
              }}
            />
          </Typography>
          
          {!isMobile && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                ml: 1,
                fontSize: '0.85rem',
                fontWeight: 400,
                opacity: 0.8,
              }}
            >
              Multimodal Chat Assistant
            </Typography>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {isConnected && (
            <Tooltip title="Connected to backend">
              <Badge
                variant="dot"
                color="success"
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                sx={{ mr: 1.5 }}
              >
                <CloudIcon fontSize="small" color="action" />
              </Badge>
            </Tooltip>
          )}
          
          <Tooltip title={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
            <IconButton 
              onClick={toggleDarkMode} 
              color="inherit"
              sx={{ 
                mr: { xs: 0.5, sm: 1 },
                bgcolor: darkMode 
                  ? alpha(theme.palette.primary.main, 0.1) 
                  : 'transparent' 
              }}
            >
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
          
          <Tooltip title="View on GitHub">
            <IconButton 
              component="a" 
              href="https://github.com/yourusername/Chat-MM" 
              target="_blank"
              aria-label="GitHub repository"
              color="inherit"
              sx={{ 
                mr: { xs: 0.5, sm: 1 },
                transition: 'transform 0.2s',
                '&:hover': { transform: 'rotate(5deg)' }
              }}
            >
              <GitHubIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="About">
            <IconButton
              color="inherit"
              aria-label="About this application"
              sx={{ 
                mr: { xs: 0.5, sm: 1 },
                display: { xs: 'none', sm: 'flex' }
              }}
            >
              <InfoIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 
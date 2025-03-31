import React, { useState } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Typography,
  Collapse,
  Paper,
  Button,
  Chip,
  ListItemButton,
  alpha,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  ArrowBack as ArrowBackIcon,
  Menu as MenuIcon
} from '@mui/icons-material';

const Sidebar = ({
  open,
  onClose,
  darkMode,
  toggleDarkMode,
  provider,
  onProviderChange,
  modelId,
  onModelChange,
  availableModels,
  mode,
  onModeChange,
  onClearChat,
  onSaveChat,
  onLoadChat,
  onExportChat,
  onNewChat,
  onRetry,
  isStreaming,
  providerWarnings,
  responseMetadata,
  isConnected,
  sidebarWidth,
  toggleSidebar
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [showSettings, setShowSettings] = useState(true);
  const [showActions, setShowActions] = useState(true);
  
  // Function to get provider display name and color
  const getProviderInfo = (providerName) => {
    const providerMap = {
      openai: { name: 'OpenAI', color: '#00A67E' },
      anthropic: { name: 'Anthropic', color: '#b6262e' },
      groq: { name: 'Groq', color: '#5846f6' },
      mistral: { name: 'Mistral', color: '#0a91f0' },
      cohere: { name: 'Cohere', color: '#4d21fc' },
      huggingface: { name: 'Hugging Face', color: '#FFD21E' },
      xai: { name: 'xAI', color: '#000000' },
      deepseek: { name: 'DeepSeek', color: '#3E64FF' },
      alibaba: { name: 'Alibaba', color: '#FF6A00' },
      google: { name: 'Google', color: '#4285F4' },
      ollama: { name: 'Ollama', color: '#2e3192' },
      azure: { name: 'Azure', color: '#0078d4' },
      default: { name: providerName, color: theme.palette.primary.main }
    };
    
    return providerMap[providerName] || providerMap.default;
  };
  
  const providerInfo = getProviderInfo(provider);
  
  const renderWarning = () => {
    if (!providerWarnings || !providerWarnings[provider]) return null;
    
    return (
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          mb: 2,
          backgroundColor: alpha(theme.palette.warning.main, 0.1),
          border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
          borderRadius: 1
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
          <WarningIcon 
            color="warning" 
            fontSize="small" 
            sx={{ mr: 1, mt: 0.3 }} 
          />
          <Typography variant="body2" color="text.secondary">
            {providerWarnings[provider]}
          </Typography>
        </Box>
      </Paper>
    );
  };
  
  const renderResponseMetadata = () => {
    if (!responseMetadata) return null;
    
    return (
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          mt: 2,
          mb: 1,
          backgroundColor: alpha(theme.palette.info.main, 0.07),
          border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
          borderRadius: 1
        }}
      >
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Response Metadata
        </Typography>
        
        {responseMetadata.time && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mr: 1, minWidth: 80 }}>
              Response time:
            </Typography>
            <Typography variant="body2">
              {(responseMetadata.time / 1000).toFixed(2)}s
            </Typography>
          </Box>
        )}
        
        {responseMetadata.usage && (
          <>
            {responseMetadata.usage.prompt_tokens && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mr: 1, minWidth: 80 }}>
                  Input tokens:
                </Typography>
                <Typography variant="body2">
                  {responseMetadata.usage.prompt_tokens.toLocaleString()}
                </Typography>
              </Box>
            )}
            
            {responseMetadata.usage.completion_tokens && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mr: 1, minWidth: 80 }}>
                  Output tokens:
                </Typography>
                <Typography variant="body2">
                  {responseMetadata.usage.completion_tokens.toLocaleString()}
                </Typography>
              </Box>
            )}
            
            {responseMetadata.usage.total_tokens && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ mr: 1, minWidth: 80 }}>
                  Total tokens:
                </Typography>
                <Typography variant="body2">
                  {responseMetadata.usage.total_tokens.toLocaleString()}
                </Typography>
              </Box>
            )}
          </>
        )}
      </Paper>
    );
  };
  
  const drawerContent = (
    <Box
      sx={{
        width: isMobile ? sidebarWidth.xs : sidebarWidth.sm,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
      role="presentation"
    >
      {/* Sidebar Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.mode === 'dark' 
            ? alpha(theme.palette.background.paper, 0.8)
            : alpha(theme.palette.background.paper, 0.9),
          backdropFilter: 'blur(8px)',
          position: 'sticky',
          top: 0,
          zIndex: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {isMobile ? (
            <IconButton edge="start" color="inherit" onClick={onClose} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
          ) : (
            <IconButton edge="start" color="inherit" onClick={toggleSidebar} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" component="div">
            Settings
          </Typography>
        </Box>
        
        {/* Current provider badge */}
        <Chip
          label={providerInfo.name}
          size="small"
          sx={{ 
            backgroundColor: alpha(providerInfo.color, 0.1),
            color: providerInfo.color,
            fontWeight: 600,
            border: `1px solid ${alpha(providerInfo.color, 0.3)}`,
          }}
        />
      </Box>
      
      {/* Content area with scroll */}
      <Box sx={{ 
        p: 2, 
        flexGrow: 1,
        overflowY: 'auto',
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: alpha(theme.palette.text.primary, 0.2),
          borderRadius: '4px',
          '&:hover': {
            backgroundColor: alpha(theme.palette.text.primary, 0.3),
          }
        }
      }}>
        {/* Chat Actions Section */}
        <Box sx={{ mb: 3 }}>
          <ListItemButton 
            onClick={() => setShowActions(!showActions)}
            sx={{
              borderRadius: 1,
              mb: 1,
              backgroundColor: showActions 
                ? alpha(theme.palette.primary.main, 0.08)
                : 'transparent',
            }}
          >
            <ListItemIcon>
              <InfoIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Chat Actions" 
              primaryTypographyProps={{ fontWeight: 600 }}
            />
            {showActions ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </ListItemButton>
          
          <Collapse in={showActions} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <ListItem 
                sx={{ 
                  pt: 0.5, 
                  pb: 0.5, 
                  pl: 2, 
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08)
                  },
                }}
              >
                <Button
                  startIcon={<RefreshIcon />}
                  onClick={onRetry}
                  disabled={isStreaming || !isConnected}
                  fullWidth
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Retry Last Response
                </Button>
              </ListItem>
              
              <ListItem 
                sx={{ 
                  pt: 0.5, 
                  pb: 0.5, 
                  pl: 2, 
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08)
                  },
                }}
              >
                <Button
                  startIcon={<AddIcon />}
                  onClick={onNewChat}
                  disabled={isStreaming || !isConnected}
                  fullWidth
                  sx={{ justifyContent: 'flex-start' }}
                >
                  New Chat
                </Button>
              </ListItem>
              
              <ListItem 
                sx={{ 
                  pt: 0.5, 
                  pb: 0.5, 
                  pl: 2, 
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08)
                  },
                }}
              >
                <Button
                  startIcon={<DeleteIcon />}
                  onClick={onClearChat}
                  disabled={isStreaming}
                  fullWidth
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Clear Chat
                </Button>
              </ListItem>
              
              <ListItem 
                sx={{ 
                  pt: 0.5, 
                  pb: 0.5, 
                  pl: 2, 
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08)
                  },
                }}
              >
                <Button
                  startIcon={<SaveIcon />}
                  onClick={onSaveChat}
                  disabled={isStreaming}
                  fullWidth
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Save Chat
                </Button>
              </ListItem>
              
              <ListItem 
                sx={{ 
                  pt: 0.5, 
                  pb: 0.5, 
                  pl: 2, 
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08)
                  },
                }}
              >
                <Button
                  startIcon={<UploadIcon />}
                  onClick={onLoadChat}
                  disabled={isStreaming}
                  fullWidth
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Load Chat
                </Button>
              </ListItem>
              
              <ListItem 
                sx={{ 
                  pt: 0.5, 
                  pb: 0.5, 
                  pl: 2, 
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08)
                  },
                }}
              >
                <Button
                  startIcon={<DownloadIcon />}
                  onClick={onExportChat}
                  disabled={isStreaming}
                  fullWidth
                  sx={{ justifyContent: 'flex-start' }}
                >
                  Export Chat
                </Button>
              </ListItem>
            </List>
          </Collapse>
        </Box>
        
        {/* Model Settings Section */}
        <Box sx={{ mb: 3 }}>
          <ListItemButton 
            onClick={() => setShowSettings(!showSettings)}
            sx={{
              borderRadius: 1,
              mb: 1,
              backgroundColor: showSettings 
                ? alpha(theme.palette.primary.main, 0.08)
                : 'transparent',
            }}
          >
            <ListItemIcon>
              <SettingsIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary="Model Settings" 
              primaryTypographyProps={{ fontWeight: 600 }}
            />
            {showSettings ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </ListItemButton>
          
          <Collapse in={showSettings} timeout="auto" unmountOnExit>
            <Box sx={{ px: 2, pt: 1, pb: 2 }}>
              {renderWarning()}
              
              <FormControl fullWidth margin="normal" size="small">
                <InputLabel id="provider-label">Provider</InputLabel>
                <Select
                  labelId="provider-label"
                  id="provider-select"
                  value={provider}
                  label="Provider"
                  onChange={onProviderChange}
                  disabled={isStreaming}
                >
                  {Object.keys(availableModels).map((p) => {
                    const info = getProviderInfo(p);
                    return (
                      <MenuItem key={p} value={p}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box 
                            sx={{ 
                              width: 12, 
                              height: 12, 
                              borderRadius: '50%', 
                              backgroundColor: info.color,
                              mr: 1 
                            }} 
                          />
                          {info.name}
                        </Box>
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal" size="small">
                <InputLabel id="model-label">Model</InputLabel>
                <Select
                  labelId="model-label"
                  id="model-select"
                  value={modelId}
                  label="Model"
                  onChange={onModelChange}
                  disabled={isStreaming || !availableModels[provider] || availableModels[provider].length === 0}
                >
                  {availableModels[provider]?.map((model) => (
                    <MenuItem key={model.id} value={model.id}>
                      {model.name}
                    </MenuItem>
                  ))}
                </Select>
                {(!availableModels[provider] || availableModels[provider].length === 0) && (
                  <FormHelperText error>
                    No models available for this provider
                  </FormHelperText>
                )}
              </FormControl>
              
              <FormControl fullWidth margin="normal" size="small">
                <InputLabel id="mode-label">Mode</InputLabel>
                <Select
                  labelId="mode-label"
                  id="mode-select"
                  value={mode}
                  label="Mode"
                  onChange={onModeChange}
                  disabled={isStreaming}
                >
                  <MenuItem value="llm">LLM Chat</MenuItem>
                  <MenuItem value="vision">Vision (Image Support)</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Collapse>
        </Box>
        
        {renderResponseMetadata()}
      </Box>
      
      {/* Footer with dark mode toggle */}
      <Box
        sx={{
          p: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: theme.palette.background.paper,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {darkMode ? 'Dark Mode' : 'Light Mode'}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <LightModeIcon
            fontSize="small"
            sx={{
              mr: 1,
              color: darkMode ? alpha(theme.palette.text.primary, 0.4) : theme.palette.warning.main,
            }}
          />
          <Switch checked={darkMode} onChange={toggleDarkMode} />
          <DarkModeIcon
            fontSize="small"
            sx={{
              ml: 1,
              color: darkMode ? theme.palette.primary.light : alpha(theme.palette.text.primary, 0.4),
            }}
          />
        </Box>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'persistent'}
      anchor="left"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: isMobile ? sidebarWidth.xs : sidebarWidth.sm,
          boxSizing: 'border-box',
          border: 'none',
          boxShadow: theme.shadows[3],
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
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
  useMediaQuery,
  TextField
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
  Menu as MenuIcon,
  ChatBubble as ChatIcon,
  Api as ApiIcon,
  ChatBubbleOutline as ChatBubbleOutlineIcon
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
  toggleSidebar,
  persona,
  onPersonaChange,
  customSystemMessage,
  onCustomSystemMessageChange
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [showSettings, setShowSettings] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showCustomMessage, setShowCustomMessage] = useState(persona === 'custom');
  
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
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ChatIcon 
              color="primary" 
              sx={{ mr: 1, fontSize: '1.5rem' }} 
            />
            <Typography variant="h6" component="div" sx={{ 
              fontWeight: 'bold',
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Chat-MM
            </Typography>
          </Box>
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
        {/* Settings Section */}
        <Box 
          component="div" 
          sx={{ 
            width: '100%', 
            mb: 1,
            borderBottom: `1px solid ${theme.palette.divider}`,
            pb: 1
          }}
        >
          <Button
            onClick={() => setShowSettings(!showSettings)}
            startIcon={<SettingsIcon />}
            endIcon={showSettings ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            fullWidth
            sx={{ 
              justifyContent: 'flex-start', 
              color: theme.palette.text.primary,
              textAlign: 'left',
              borderRadius: 0
            }}
          >
            <Typography sx={{ fontWeight: 'bold' }}>Settings</Typography>
          </Button>
          <Collapse in={showSettings}>
            <Box p={2}>
              {/* Mode Selection */}
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="mode-select-label">Mode</InputLabel>
                <Select
                  labelId="mode-select-label"
                  id="mode-select"
                  value={mode}
                  onChange={onModeChange}
                  label="Mode"
                  disabled={isStreaming}
                >
                  <MenuItem value="llm">LLM Chat</MenuItem>
                  <MenuItem value="llm_rag">LLM+RAG Chat</MenuItem>
                  <MenuItem value="vision">LLM Vision</MenuItem>
                  <MenuItem value="audio">LLM Audio</MenuItem>
                  <MenuItem value="content">Content Chat</MenuItem>
                </Select>
              </FormControl>

              {/* Persona Selection */}
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="persona-select-label">Persona</InputLabel>
                <Select
                  labelId="persona-select-label"
                  id="persona-select"
                  value={persona}
                  onChange={(e) => {
                    onPersonaChange(e.target.value);
                    setShowCustomMessage(e.target.value === 'custom');
                  }}
                  label="Persona"
                  disabled={isStreaming}
                >
                  <MenuItem value="default">Default Assistant</MenuItem>
                  <MenuItem value="expert">Technical Expert</MenuItem>
                  <MenuItem value="teacher">Educational Guide</MenuItem>
                  <MenuItem value="creative">Creative Assistant</MenuItem>
                  <MenuItem value="analyst">Data Analyst</MenuItem>
                  <MenuItem value="coder">Code Expert</MenuItem>
                  <MenuItem value="researcher">Research Assistant</MenuItem>
                  <MenuItem value="writer">Writing Assistant</MenuItem>
                  <MenuItem value="debater">Debate Partner</MenuItem>
                  <MenuItem value="philosopher">Philosophical Guide</MenuItem>
                  <MenuItem value="mentor">Life Mentor</MenuItem>
                  <MenuItem value="scientist">Scientific Expert</MenuItem>
                  <MenuItem value="historian">Historical Guide</MenuItem>
                  <MenuItem value="critic">Critical Analyst</MenuItem>
                  <MenuItem value="custom">Custom Persona</MenuItem>
                </Select>
              </FormControl>

              {/* Custom System Message Input */}
              {showCustomMessage && (
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  value={customSystemMessage}
                  onChange={(e) => onCustomSystemMessageChange(e.target.value)}
                  label="Custom System Message"
                  placeholder="Enter your custom system message here..."
                  disabled={isStreaming}
                  sx={{ mb: 2 }}
                />
              )}

              {/* Provider Selection */}
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="provider-select-label">Provider</InputLabel>
                <Select
                  labelId="provider-select-label"
                  id="provider-select"
                  value={provider}
                  onChange={onProviderChange}
                  label="Provider"
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
                {renderWarning()}
              </FormControl>
              
              {/* Model Selection */}
              <FormControl fullWidth>
                <InputLabel id="model-select-label">Model</InputLabel>
                <Select
                  labelId="model-select-label"
                  id="model-select"
                  value={modelId}
                  onChange={onModelChange}
                  label="Model"
                  disabled={isStreaming || !availableModels[provider] || availableModels[provider].length === 0}
                  error={!availableModels[provider]?.some(model => model.id === modelId)}
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
            </Box>
          </Collapse>
        </Box>
        
        {/* Chat Actions Section */}
        <Box 
          component="div" 
          sx={{ 
            width: '100%', 
            mb: 1,
            borderBottom: `1px solid ${theme.palette.divider}`,
            pb: 1
          }}
        >
          <Button
            onClick={() => setShowActions(!showActions)}
            startIcon={<ChatBubbleOutlineIcon />}
            endIcon={showActions ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            fullWidth
            sx={{ 
              justifyContent: 'flex-start', 
              color: theme.palette.text.primary,
              textAlign: 'left',
              borderRadius: 0
            }}
          >
            <Typography sx={{ fontWeight: 'bold' }}>Chat Actions</Typography>
          </Button>
          <Collapse in={showActions}>
            <Box p={2}>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: 1 
              }}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    p: 1,
                    borderRadius: 1,
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                    }
                  }}
                >
                  <IconButton 
                    onClick={onRetry} 
                    disabled={isStreaming || !isConnected}
                    title="Retry Last Response"
                    aria-label="Retry Last Response"
                    size="medium"
                  >
                    <RefreshIcon />
                  </IconButton>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      mt: 0.5, 
                      opacity: 0,
                      transition: 'opacity 0.2s',
                      '.MuiBox-root:hover &': {
                        opacity: 1
                      }
                    }}
                  >
                    Retry
                  </Typography>
                </Box>
                
                <Box 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    p: 1,
                    borderRadius: 1,
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                    }
                  }}
                >
                  <IconButton 
                    onClick={onNewChat} 
                    disabled={isStreaming || !isConnected}
                    title="New Chat"
                    aria-label="New Chat"
                    size="medium"
                  >
                    <AddIcon />
                  </IconButton>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      mt: 0.5, 
                      opacity: 0,
                      transition: 'opacity 0.2s',
                      '.MuiBox-root:hover &': {
                        opacity: 1
                      }
                    }}
                  >
                    New
                  </Typography>
                </Box>
                
                <Box 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    p: 1,
                    borderRadius: 1,
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                    }
                  }}
                >
                  <IconButton 
                    onClick={onClearChat} 
                    disabled={isStreaming}
                    title="Clear Chat"
                    aria-label="Clear Chat"
                    size="medium"
                  >
                    <DeleteIcon />
                  </IconButton>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      mt: 0.5, 
                      opacity: 0,
                      transition: 'opacity 0.2s',
                      '.MuiBox-root:hover &': {
                        opacity: 1
                      }
                    }}
                  >
                    Clear
                  </Typography>
                </Box>
                
                <Box 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    p: 1,
                    borderRadius: 1,
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                    }
                  }}
                >
                  <IconButton 
                    onClick={onSaveChat} 
                    disabled={isStreaming}
                    title="Save Chat"
                    aria-label="Save Chat"
                    size="medium"
                  >
                    <SaveIcon />
                  </IconButton>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      mt: 0.5, 
                      opacity: 0,
                      transition: 'opacity 0.2s',
                      '.MuiBox-root:hover &': {
                        opacity: 1
                      }
                    }}
                  >
                    Save
                  </Typography>
                </Box>
                
                <Box 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    p: 1,
                    borderRadius: 1,
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                    }
                  }}
                >
                  <IconButton 
                    onClick={onLoadChat} 
                    disabled={isStreaming}
                    title="Load Chat"
                    aria-label="Load Chat"
                    size="medium"
                  >
                    <UploadIcon />
                  </IconButton>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      mt: 0.5, 
                      opacity: 0,
                      transition: 'opacity 0.2s',
                      '.MuiBox-root:hover &': {
                        opacity: 1
                      }
                    }}
                  >
                    Load
                  </Typography>
                </Box>
                
                <Box 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    p: 1,
                    borderRadius: 1,
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                    }
                  }}
                >
                  <IconButton 
                    onClick={onExportChat} 
                    disabled={isStreaming}
                    title="Export Chat"
                    aria-label="Export Chat"
                    size="medium"
                  >
                    <DownloadIcon />
                  </IconButton>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      mt: 0.5, 
                      opacity: 0,
                      transition: 'opacity 0.2s',
                      '.MuiBox-root:hover &': {
                        opacity: 1
                      }
                    }}
                  >
                    Export
                  </Typography>
                </Box>
              </Box>
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
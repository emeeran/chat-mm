import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  FormControlLabel,
  Switch,
  Tooltip,
  alpha,
  Badge,
} from '@mui/material';
import {
  Close as CloseIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Settings as SettingsIcon,
  MenuBook as MenuBookIcon,
  Search as SearchIcon,
  Warning as WarningIcon,
  AddCircleOutline as NewIcon,
  Replay as RetryIcon,
  Save as SaveIcon,
  FileDownload as ExportIcon,
  FileUpload as LoadIcon,
  DeleteForever as ClearIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

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
}) => {
  const theme = useTheme();
  
  // Get provider display name
  const getProviderName = (key) => {
    const providers = {
      'openai': 'OpenAI',
      'cohere': 'Cohere',
      'huggingface': 'HuggingFace',
      'groq': 'Groq',
      'mistral': 'Mistral',
      'anthropic': 'Anthropic',
      'xai': 'X AI',
      'deepseek': 'DeepSeek',
      'alibaba': 'Alibaba'
    };
    return providers[key] || key;
  };
  
  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      variant="temporary"
      PaperProps={{
        sx: {
          width: { xs: '80%', sm: 320 },
          p: 2,
          backgroundColor: theme.palette.background.paper,
          backgroundImage: 'none',
          boxShadow: theme.shadows[5],
        }
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight="bold" color="primary">
          Settings
        </Typography>
        <IconButton onClick={onClose} color="inherit" edge="end">
          <CloseIcon />
        </IconButton>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      {/* Model Selection */}
      <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
        Model Selection
      </Typography>
      
      {/* Provider selection */}
      <FormControl fullWidth size="small" variant="outlined" sx={{ mb: 2 }}>
        <InputLabel id="sidebar-provider-label">Provider</InputLabel>
        <Select
          labelId="sidebar-provider-label"
          value={provider}
          onChange={onProviderChange}
          label="Provider"
          disabled={isStreaming}
        >
          {Object.keys(availableModels).map(key => (
            <MenuItem key={key} value={key}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getProviderName(key)}
                {providerWarnings[key] && (
                  <Tooltip title="API key not configured for this provider">
                    <WarningIcon color="warning" fontSize="small" />
                  </Tooltip>
                )}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      {/* Model selection */}
      <FormControl fullWidth size="small" variant="outlined" sx={{ mb: 3 }}>
        <InputLabel id="sidebar-model-label">Model</InputLabel>
        <Select
          labelId="sidebar-model-label"
          value={modelId || ''}
          onChange={onModelChange}
          label="Model"
          disabled={isStreaming || !availableModels[provider]}
        >
          {availableModels[provider]?.map(model => (
            <MenuItem 
              key={model.id} 
              value={model.id}
              title={model.description}
            >
              {model.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      {/* Mode Selection */}
      <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
        Mode Selection
      </Typography>
      
      <FormControl fullWidth size="small" variant="outlined" sx={{ mb: 3 }}>
        <InputLabel id="sidebar-mode-label">Mode</InputLabel>
        <Select
          labelId="sidebar-mode-label"
          value={mode}
          onChange={onModeChange}
          label="Mode"
          disabled={isStreaming}
        >
          <MenuItem value="llm">
            <Tooltip title="Use only the LLM without retrieval or web search">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography>LLM Only</Typography>
              </Box>
            </Tooltip>
          </MenuItem>
          <MenuItem value="rag_llm">
            <Tooltip title="Use document search with LLM">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <MenuBookIcon fontSize="small" sx={{ mr: 1 }} />
                <Typography>RAG + LLM</Typography>
              </Box>
            </Tooltip>
          </MenuItem>
          <MenuItem value="rag_llm_web">
            <Tooltip title="Use both document search and web search with LLM">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <MenuBookIcon fontSize="small" sx={{ mr: 0.5 }} />
                <SearchIcon fontSize="small" sx={{ mr: 1 }} />
                <Typography>RAG + LLM + Web</Typography>
              </Box>
            </Tooltip>
          </MenuItem>
        </Select>
      </FormControl>
      
      {/* Actions */}
      <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
        Actions
      </Typography>
      
      <Box 
        sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1,
          mb: 3
        }}
      >
        <Tooltip title="New Chat">
          <span>
            <IconButton
              onClick={onNewChat}
              disabled={isStreaming}
              color="primary"
              size="large"
            >
              <NewIcon />
            </IconButton>
          </span>
        </Tooltip>
        
        <Tooltip title="Save Chat">
          <span>
            <IconButton
              onClick={onSaveChat}
              disabled={isStreaming}
              color="primary"
              size="large"
            >
              <SaveIcon />
            </IconButton>
          </span>
        </Tooltip>
        
        <Tooltip title="Load Chat">
          <span>
            <IconButton
              onClick={onLoadChat}
              disabled={isStreaming}
              color="primary"
              size="large"
            >
              <LoadIcon />
            </IconButton>
          </span>
        </Tooltip>
        
        <Tooltip title="Export Chat">
          <span>
            <IconButton
              onClick={onExportChat}
              disabled={isStreaming}
              color="primary"
              size="large"
            >
              <ExportIcon />
            </IconButton>
          </span>
        </Tooltip>
        
        <Tooltip title="Clear Chat">
          <span>
            <IconButton
              onClick={onClearChat}
              disabled={isStreaming}
              color="primary"
              size="large"
            >
              <ClearIcon />
            </IconButton>
          </span>
        </Tooltip>
        
        <Tooltip title="Retry Last">
          <span>
            <IconButton
              onClick={onRetry}
              disabled={isStreaming}
              color="primary"
              size="large"
            >
              <RetryIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
      
      <Box sx={{ flexGrow: 1 }} />
      
      <Divider sx={{ my: 2 }} />
      
      {/* Settings */}
      <Box sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Switch 
              checked={darkMode} 
              onChange={toggleDarkMode}
              color="primary"
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {darkMode ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
              <Typography>{darkMode ? "Dark Mode" : "Light Mode"}</Typography>
            </Box>
          }
        />
      </Box>
      
      {/* App version */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.7 }}>
        <InfoIcon fontSize="small" sx={{ mr: 1, opacity: 0.6 }} />
        <Typography variant="caption" color="text.secondary">
          Chat-MM v1.0.0
        </Typography>
      </Box>
    </Drawer>
  );
};

export default Sidebar; 
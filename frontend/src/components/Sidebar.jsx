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
  Paper,
  Chip,
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
  Keyboard as KeyboardIcon,
  RestartAlt as ResetIcon,
  HelpOutline as HelpIcon,
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
  responseMetadata,
  isConnected,
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
          width: { xs: '85%', sm: 350 },
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
          Chat Settings
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Chip
            size="small"
            label={isConnected ? "Connected" : "Disconnected"}
            color={isConnected ? "success" : "error"}
            variant="outlined"
            sx={{ 
              mr: 1,
              height: 24,
              fontSize: '0.7rem',
              '& .MuiChip-label': { px: 1, py: 0.5 }
            }}
          />
          <IconButton onClick={onClose} color="inherit" edge="end">
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>
      
      {/* Connection status & response metadata */}
      {responseMetadata && (
        <Paper
          elevation={0}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            p: 1.5,
            mb: 2,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.info.main, 0.08),
            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
            color: theme.palette.text.secondary,
            fontSize: '0.75rem',
          }}
        >
          <Typography variant="subtitle2" color="primary" gutterBottom>
            <InfoIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
            Current Session
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {responseMetadata.model && (
              <Chip 
                size="small" 
                label={`Model: ${responseMetadata.model}`}
                sx={{ fontSize: '0.7rem' }}
              />
            )}
            {responseMetadata.tokens && (
              <Chip 
                size="small" 
                label={`Tokens: ${responseMetadata.tokens}`}
                sx={{ fontSize: '0.7rem' }}
              />
            )}
            {responseMetadata.time && (
              <Chip 
                size="small" 
                label={`Time: ${responseMetadata.time}s`}
                sx={{ fontSize: '0.7rem' }}
              />
            )}
          </Box>
        </Paper>
      )}
      
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
      
      {/* Appearance */}
      <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
        Appearance
      </Typography>
      
      <FormControlLabel
        control={
          <Switch
            checked={darkMode}
            onChange={toggleDarkMode}
            size="small"
          />
        }
        label={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {darkMode ? 
              <LightModeIcon fontSize="small" sx={{ mr: 1 }} /> : 
              <DarkModeIcon fontSize="small" sx={{ mr: 1 }} />
            }
            <Typography variant="body2">
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </Typography>
          </Box>
        }
        sx={{ mb: 2 }}
      />
      
      <Divider sx={{ mb: 2 }} />
      
      {/* Actions */}
      <Typography variant="subtitle2" fontWeight="medium" gutterBottom>
        Actions
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<NewIcon />}
          onClick={onNewChat}
          disabled={isStreaming}
          sx={{ borderRadius: 6 }}
        >
          New Chat
        </Button>
        
        <Button
          variant="outlined"
          size="small"
          startIcon={<ClearIcon />}
          onClick={onClearChat}
          disabled={isStreaming}
          color="error"
          sx={{ borderRadius: 6 }}
        >
          Clear
        </Button>
        
        <Button
          variant="outlined"
          size="small"
          startIcon={<RetryIcon />}
          onClick={onRetry}
          disabled={isStreaming}
          sx={{ borderRadius: 6 }}
        >
          Retry Last
        </Button>
        
        <Button
          variant="outlined"
          size="small"
          startIcon={<ExportIcon />}
          onClick={onExportChat}
          disabled={isStreaming}
          sx={{ borderRadius: 6 }}
        >
          Export
        </Button>
      </Box>
      
      {/* Keyboard shortcuts */}
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          mt: 1,
          mb: 2,
          borderRadius: 2,
          bgcolor: alpha(theme.palette.background.default, 0.5),
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <KeyboardIcon fontSize="small" sx={{ mr: 1 }} />
          Keyboard Shortcuts
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 2, fontSize: '0.8rem' }}>
          <li><strong>Alt+Enter</strong>: Send message</li>
          <li><strong>Ctrl+L</strong>: Clear chat</li>
          <li><strong>Ctrl+D</strong>: Toggle dark mode</li>
          <li><strong>Ctrl+,</strong>: Toggle sidebar</li>
        </Box>
      </Paper>
      
      <Box sx={{ mt: 'auto', textAlign: 'center', opacity: 0.7 }}>
        <Typography variant="caption" display="block" gutterBottom>
          Chat-MM v0.1.0
        </Typography>
        <Typography variant="caption">
          A multimodal chat application
        </Typography>
      </Box>
    </Drawer>
  );
};

export default Sidebar; 
import React from 'react';
import { Box, CssBaseline } from '@mui/material';
import Header from './components/Header';
import ChatWindow from './components/ChatWindow';
import { SocketProvider } from './services/socketContext';

function App() {
  return (
    <SocketProvider>
      <CssBaseline />
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          height: '100vh',
          background: theme => theme.palette.mode === 'dark' 
            ? 'linear-gradient(to bottom, #0f172a, #1e293b)'
            : 'linear-gradient(to bottom, #f8fafc, #e2e8f0)'
        }}
      >
        <Header />
        <ChatWindow />
      </Box>
    </SocketProvider>
  );
}

export default App; 
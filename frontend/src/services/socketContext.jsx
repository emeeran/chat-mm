import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io({
      path: '/socket.io',
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Event handlers
    const onConnect = () => {
      setIsConnected(true);
      setConnectionError(null);
      console.log('Connected to socket server');
    };

    const onDisconnect = (reason) => {
      setIsConnected(false);
      console.log(`Disconnected: ${reason}`);
    };

    const onError = (error) => {
      setConnectionError(error.message || 'Unknown error');
      console.error('Socket error:', error);
    };

    // Register event listeners
    socketInstance.on('connect', onConnect);
    socketInstance.on('disconnect', onDisconnect);
    socketInstance.on('connect_error', onError);

    // Set socket instance
    setSocket(socketInstance);

    // Cleanup
    return () => {
      socketInstance.off('connect', onConnect);
      socketInstance.off('disconnect', onDisconnect);
      socketInstance.off('connect_error', onError);
      socketInstance.disconnect();
    };
  }, []);

  const sendMessage = (data) => {
    if (!socket || !isConnected) {
      console.error('Cannot send message: Socket not connected');
      return false;
    }
    
    console.log('Sending message to server:', data);
    
    try {
      // Force specific format for the message to ensure backend compatibility
      const messageToSend = {
        type: data.type || 'message',
        content: data.content,
        provider: data.provider,
        model: data.model,
        mode: data.mode
      };
      
      // Emit the message on the socket
      socket.emit('message', messageToSend);
      
      // Set up a one-time listener for acknowledgment (for debugging)
      socket.once('ack', (response) => {
        console.log('Message acknowledged by server:', response);
      });
      
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  };

  const value = {
    socket,
    isConnected,
    connectionError,
    sendMessage,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}; 
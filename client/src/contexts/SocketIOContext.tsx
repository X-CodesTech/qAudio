import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useCountdown } from './CountdownContext';

export interface TimerData {
  studio: 'A' | 'B' | 'C' | 'D';
  minutes: number;
  seconds: number;
  isRunning: boolean;
  isDangerZone: boolean;
  lastUpdate?: string; // Optional timestamp for when this data was last updated
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  lastError: string | null;
}

const SocketIOContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  lastError: null
});

export const useSocketIO = () => useContext(SocketIOContext);

export const SocketIOProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const {
    startStudioA,
    startStudioB,
    startStudioC,
    startStudioD,
    pauseStudioA,
    pauseStudioB,
    pauseStudioC,
    pauseStudioD,
    setStudioATime,
    setStudioBTime,
    setStudioCTime,
    setStudioDTime
  } = useCountdown();

  useEffect(() => {
    // Create socket connection
    console.log('Initializing Socket.io connection');
    
    // Get the protocol based on whether we're using HTTPS or HTTP
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    
    // Use the same host as the current page
    const socketUrl = `${protocol}//${window.location.host}`;
    
    // Initialize socket connection with path that matches server
    const newSocket = io(socketUrl, {
      path: '/socket.io',
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 5000
    });

    // Set socket in state
    setSocket(newSocket);

    // Socket event handlers
    newSocket.on('connect', () => {
      console.log('Socket.io connected!');
      setIsConnected(true);
      setLastError(null);
    });

    newSocket.on('disconnect', (reason) => {
      console.log(`Socket.io disconnected: ${reason}`);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket.io connection error:', error);
      setLastError(error.message);
      setIsConnected(false);
    });

    // Timer state handlers
    newSocket.on('timer_state_A', (data: TimerData) => {
      console.log('Received timer state for Studio A:', data);
      if (data.isRunning) {
        startStudioA();
      } else {
        pauseStudioA();
      }
      // Convert to minutes only (the function only accepts minutes)
      const totalMinutes = Math.ceil((data.minutes * 60 + (data.seconds || 0)) / 60);
      setStudioATime(totalMinutes);
    });

    newSocket.on('timer_state_B', (data: TimerData) => {
      console.log('Received timer state for Studio B:', data);
      if (data.isRunning) {
        startStudioB();
      } else {
        pauseStudioB();
      }
      // Convert to minutes only (the function only accepts minutes)
      const totalMinutes = Math.ceil((data.minutes * 60 + (data.seconds || 0)) / 60);
      setStudioBTime(totalMinutes);
    });

    newSocket.on('timer_state_C', (data: TimerData) => {
      console.log('Received timer state for Studio C:', data);
      if (data.isRunning) {
        startStudioC();
      } else {
        pauseStudioC();
      }
      // Convert to minutes only (the function only accepts minutes)
      const totalMinutes = Math.ceil((data.minutes * 60 + (data.seconds || 0)) / 60);
      setStudioCTime(totalMinutes);
    });

    newSocket.on('timer_state_D', (data: TimerData) => {
      console.log('Received timer state for Studio D:', data);
      if (data.isRunning) {
        startStudioD();
      } else {
        pauseStudioD();
      }
      // Convert to minutes only (the function only accepts minutes)
      const totalMinutes = Math.ceil((data.minutes * 60 + (data.seconds || 0)) / 60);
      setStudioDTime(totalMinutes);
    });

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up Socket.io connection');
      newSocket.disconnect();
    };
  }, [
    startStudioA, 
    startStudioB, 
    startStudioC, 
    startStudioD, 
    pauseStudioA, 
    pauseStudioB, 
    pauseStudioC, 
    pauseStudioD, 
    setStudioATime, 
    setStudioBTime, 
    setStudioCTime, 
    setStudioDTime
  ]);

  return (
    <SocketIOContext.Provider value={{ socket, isConnected, lastError }}>
      {children}
    </SocketIOContext.Provider>
  );
};

// Helper function to get current timer state
export const requestTimerState = (socket: Socket | null, studio: 'A' | 'B' | 'C' | 'D') => {
  if (socket && socket.connected) {
    socket.emit('get_timer_state', studio);
  }
};

// Helper function to update timer state
export const updateTimerState = (socket: Socket | null, data: TimerData) => {
  if (socket && socket.connected) {
    socket.emit('timer_update', data);
  }
};
import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

// Define the buzzer data type
interface BuzzerData {
  from: string;
  to: string;
  active: boolean;
  studioId: 'A' | 'B';
}

// Define the countdown timer data type
interface TimerData {
  studio: 'A' | 'B';
  minutes: number;
  seconds: number;
  isRunning: boolean;
  isDangerZone: boolean;
}

// Store current timer states for each studio
const studioTimers: { [key: string]: TimerData } = {
  'A': { studio: 'A', minutes: 5, seconds: 0, isRunning: false, isDangerZone: false },
  'B': { studio: 'B', minutes: 5, seconds: 0, isRunning: false, isDangerZone: false }
};

/**
 * Setup Socket.io server for real-time buzzer and timer communication
 * 
 * This implementation is separate from the WebSocket server and provides
 * a dedicated channel for buzzer and timer functionality
 */
export function setupSocketIOServer(httpServer: HttpServer): SocketIOServer {
  console.log('Initializing Socket.io server for real-time communication');
  
  // Create Socket.io server with CORS configuration
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    // Use a different path to avoid conflicts with existing WebSocket server
    path: '/socket.io'
  });
  
  // Connection handler
  io.on('connection', (socket) => {
    console.log('Socket.io client connected:', socket.id);
    
    // Send current timer states to new clients
    socket.emit('timer_state_A', studioTimers['A']);
    socket.emit('timer_state_B', studioTimers['B']);
    
    // Handle buzz events
    socket.on('buzz', (data: BuzzerData) => {
      console.log(`Socket.io: Buzz from ${data.from} to ${data.to} (Studio ${data.studioId}): ${data.active ? 'Activate' : 'Deactivate'}`);
      
      // Broadcast to all clients including sender for state consistency
      io.emit('buzz', data);
    });
    
    // Handle timer update events
    socket.on('timer_update', (data: TimerData) => {
      console.log(`Socket.io: Timer update for Studio ${data.studio}: ${data.minutes}:${data.seconds}, running: ${data.isRunning}`);
      
      // Update the stored timer state
      studioTimers[data.studio] = data;
      
      // Broadcast to all clients for state consistency
      io.emit(`timer_state_${data.studio}`, data);
    });
    
    // Handle timer state request
    socket.on('get_timer_state', (studio: 'A' | 'B') => {
      console.log(`Socket.io: Timer state request for Studio ${studio}`);
      socket.emit(`timer_state_${studio}`, studioTimers[studio]);
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Socket.io client disconnected:', socket.id);
    });
  });
  
  return io;
}

// Get the current timer state for a studio
export function getTimerState(studio: string): TimerData {
  return studioTimers[studio];
}

// Update the timer state for a studio
export function updateTimerState(data: TimerData, io?: SocketIOServer): TimerData {
  studioTimers[data.studio] = data;
  
  // If io is provided, broadcast the update
  if (io) {
    io.emit(`timer_state_${data.studio}`, data);
  }
  
  return data;
}
import express, { Request, Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { Server as SocketIOServer } from 'socket.io';
import { getTimerState, updateTimerState } from '../socketio-server';

// Create a local broadcastToClients function since it's not exported from websocket-helpers
const broadcastToClients = (wss: WebSocketServer, data: any) => {
  console.log(`Timer routes broadcasting message of type: ${data.type}`);
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

// Define types for better TypeScript compatibility
type StudioId = 'A' | 'B' | 'RE';
type TimerState = {
  minutes: number;
  seconds: number;
  isRunning: boolean;
  isDangerZone: boolean;
  lastUpdate: string;
};

// Server-side state to track timers
type ServerTimerState = {
  studioATimer: TimerState;
  studioBTimer: TimerState;
  [key: string]: any; // Allow additional properties for the full server state
};

/**
 * Setup countdown timer routes for synchronization between producer and talent
 * 
 * These routes enable real-time countdown timer synchronization between
 * producer and talent views, with both WebSocket updates and HTTP fallbacks.
 */
export function setupTimerRoutes(app: express.Express, wss: WebSocketServer, serverState: ServerTimerState) {
  const isAuthenticated = (req: Request, res: Response, next: express.NextFunction) => next();

  // Initialize timer states if they don't exist
  if (!serverState.studioATimer) {
    serverState.studioATimer = {
      minutes: 5,
      seconds: 0,
      isRunning: false,
      isDangerZone: false,
      lastUpdate: new Date().toISOString()
    };
  }
  
  if (!serverState.studioBTimer) {
    serverState.studioBTimer = {
      minutes: 5,
      seconds: 0,
      isRunning: false,
      isDangerZone: false,
      lastUpdate: new Date().toISOString()
    };
  }

  // Setup routes
  
  // Add HTTP endpoint for timer updates to synchronize countdown timer between producer and talent
  app.post('/api/studio/timer-update', isAuthenticated, (req: Request, res: Response) => {
    const { studio, minutes, seconds, isRunning, isDangerZone } = req.body;
    
    if (!studio || (typeof minutes !== 'number') || (typeof isRunning !== 'boolean')) {
      return res.status(400).json({ error: 'Invalid timer data' });
    }
    
    console.log(`HTTP Fallback: Timer update for Studio ${studio}: ${minutes}:${seconds || 0}, running: ${isRunning}`);

    // Prepare timer data
    const timerData = {
      studio,
      minutes,
      seconds: seconds || 0,
      isRunning,
      isDangerZone: isDangerZone !== undefined ? isDangerZone : (minutes * 60 + (seconds || 0)) <= 120
    };
    
    // Update the server state
    if (studio === 'A') {
      serverState.studioATimer = {
        ...timerData,
        lastUpdate: new Date().toISOString()
      };
    } else if (studio === 'B') {
      serverState.studioBTimer = {
        ...timerData,
        lastUpdate: new Date().toISOString()
      };
    }
    
    // Update socket.io timer state
    updateTimerState(timerData, (req.app as any).get('io'));
    
    // Broadcast timer update to all connected WebSocket clients (for backwards compatibility)
    if (wss && wss.clients && wss.clients.size > 0) {
      broadcastToClients(wss, {
        type: 'countdown_update',
        ...timerData,
        timestamp: new Date().toISOString()
      });
    }
    
    // Return success with current timer state
    res.status(200).json({ 
      success: true,
      ...timerData
    });
  });
  
  // Add HTTP endpoint to get current timer state
  app.get('/api/studio/timer-status/:studio', (req: Request, res: Response) => {
    const studio = req.params.studio;
    
    if (studio !== 'A' && studio !== 'B') {
      return res.status(400).json({ error: 'Invalid studio' });
    }
    
    // Get the current timer state for the requested studio
    // Try socket.io state first, then fall back to serverState
    const socketIoState = getTimerState(studio);
    const serverStateTimer = studio === 'A' ? serverState.studioATimer : serverState.studioBTimer;
    
    // Merge the states, prioritizing the socket.io state
    const timer = socketIoState || serverStateTimer;
    
    res.status(200).json({
      studio,
      minutes: timer.minutes,
      seconds: timer.seconds,
      isRunning: timer.isRunning,
      isDangerZone: timer.isDangerZone,
      lastUpdate: timer.lastUpdate || new Date().toISOString()
    });
  });
  
  console.log('Timer synchronization routes registered');
}
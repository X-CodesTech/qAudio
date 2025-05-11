import { Request, Response } from 'express';
import { WebSocketServer } from 'ws';
import { broadcastToRole } from './websocket-helpers';

/**
 * Register RE Studio specific routes
 */
export function registerREStudioRoutes(app: any, wss: WebSocketServer, rtcSignals: any[]) {
  // Tech View can request a connection to RE Studio
  app.post('/api/re-studio/connect', (req: Request, res: Response) => {
    const { role } = req.body;
    
    if (!role) {
      return res.status(400).json({ error: 'Missing role parameter' });
    }
    
    console.log(`Connection request from ${role} to RE Studio`);
    
    // Store the connection request
    const connectionRequest = {
      from: role,
      timestamp: Date.now(),
      status: 'pending'
    };
    
    // Store the connection request in rtcSignals array
    rtcSignals.push(connectionRequest);
    
    // Try to notify via WebSocket
    try {
      broadcastToRole(wss, 'remote', { 
        type: 'tech-connection-request',
        timestamp: Date.now(),
        from: role
      });
    } catch (err) {
      console.error('WebSocket broadcast error:', err);
      // We'll continue even if WebSocket fails since RE Studio will poll for status
    }
    
    return res.status(200).json({ success: true });
  });
  
  // RE Studio or Tech View can disconnect
  app.post('/api/re-studio/disconnect', (req: Request, res: Response) => {
    const { role } = req.body;
    
    if (!role) {
      return res.status(400).json({ error: 'Missing role parameter' });
    }
    
    console.log(`Disconnect request from ${role}`);
    
    // Update all pending connection requests
    for (let signal of rtcSignals) {
      if (signal.status === 'pending' || signal.status === 'connected') {
        signal.status = 'disconnected';
      }
    }
    
    // Try to notify via WebSocket
    try {
      if (role === 'tech') {
        broadcastToRole(wss, 'remote', { 
          type: 'tech-disconnected',
          timestamp: Date.now()
        });
      } else if (role === 'remote') {
        broadcastToRole(wss, 'tech', { 
          type: 'remote-disconnected',
          timestamp: Date.now()
        });
      }
    } catch (err) {
      console.error('WebSocket broadcast error:', err);
    }
    
    return res.status(200).json({ success: true });
  });
  
  // Both Tech View and RE Studio can check connection status
  app.get('/api/re-studio/connection-status', (req: Request, res: Response) => {
    const { role } = req.query;
    
    if (!role) {
      return res.status(400).json({ error: 'Missing role parameter' });
    }
    
    // Determine role to look for (if tech is asking, look for remote and vice versa)
    const targetRole = role === 'tech' ? 'remote' : 'tech';
    
    // Find the most recent connection request or status
    let relevantSignals = rtcSignals
      .filter(signal => {
        return (signal.from === targetRole || signal.to === targetRole || 
                signal.from === role || signal.to === role);
      })
      .sort((a, b) => b.timestamp - a.timestamp);
    
    if (relevantSignals.length === 0) {
      return res.status(200).json({ status: 'disconnected' });
    }
    
    // Return the most recent connection status
    return res.status(200).json({ 
      status: relevantSignals[0].status || 'disconnected',
      timestamp: relevantSignals[0].timestamp
    });
  });
}
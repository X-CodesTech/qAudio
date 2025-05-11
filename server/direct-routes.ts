import { Request, Response } from 'express';
import { WebSocketServer } from 'ws';
import { broadcastToRole } from './websocket-helpers';

/**
 * Register direct API routes for RE Studio communication
 */
export function registerDirectRoutes(app: any, wss: WebSocketServer, rtcSignals: any[]) {
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
          type: 'tech-disconnection-request',
          timestamp: Date.now()
        });
      } else if (role === 'remote') {
        broadcastToRole(wss, 'tech', { 
          type: 'remote-disconnection-request',
          timestamp: Date.now()
        });
      }
    } catch (err) {
      console.error('WebSocket broadcast error:', err);
    }
    
    return res.status(200).json({ success: true });
  });
  
  // Get current connection status
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
  
  // Route for WebRTC signaling
  app.post('/api/re-studio/signal', (req: Request, res: Response) => {
    const { from, to, signal } = req.body;
    
    if (!from || !to || !signal) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    console.log(`WebRTC signal from ${from} to ${to}: ${signal.type}`);
    
    // Store the signal
    const rtcSignal = {
      from,
      to,
      signal,
      timestamp: Date.now(),
      status: signal.type === 'offer' ? 'connecting' : 
              signal.type === 'answer' ? 'connected' : 'signaling'
    };
    
    rtcSignals.push(rtcSignal);
    
    // Try to notify via WebSocket
    try {
      broadcastToRole(wss, to, {
        type: 'webrtc-signal',
        from,
        signal,
        timestamp: Date.now()
      });
    } catch (err) {
      console.error('WebSocket broadcast error:', err);
    }
    
    return res.status(200).json({ success: true });
  });
  
  // Route to get pending WebRTC signals
  app.get('/api/re-studio/signals', (req: Request, res: Response) => {
    const { role, since } = req.query;
    
    if (!role) {
      return res.status(400).json({ error: 'Missing role parameter' });
    }
    
    const sinceTimestamp = since ? parseInt(since as string) : 0;
    
    // Find signals intended for this role, newer than the 'since' timestamp
    const signals = rtcSignals
      .filter(signal => signal.to === role && signal.timestamp > sinceTimestamp)
      .sort((a, b) => a.timestamp - b.timestamp); // Oldest first
    
    return res.status(200).json(signals);
  });
}
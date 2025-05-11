/**
 * Producer Routes
 * This file contains all routes specific to the Producer role and Producer page
 */

import express, { Express, Request, Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { isAuthenticated, hasRole } from '../auth';
import { storage } from '../storage';

export function setupProducerRoutes(app: Express, wss: WebSocketServer): void {
  // Producer-specific routes
  // These routes are specifically for the producer role and producer page

  // Producer dashboard data
  app.get('/api/producer/dashboard', isAuthenticated, hasRole('producer'), async (req: Request, res: Response) => {
    try {
      // Get all relevant data for the producer dashboard
      const data = {
        callLines: await storage.getCallLines(),
        activeChats: await storage.getChatMessages({ limit: 20 }),
        onlineUsers: await storage.getOnlineUsers()
      };
      
      res.json(data);
    } catch (error) {
      console.error('Error fetching producer dashboard data:', error);
      res.status(500).json({ error: 'Failed to fetch producer dashboard data' });
    }
  });

  // Producer control routes - timer control
  app.post('/api/producer/timer/:studio/start', isAuthenticated, hasRole('producer'), (req: Request, res: Response) => {
    try {
      const { studio } = req.params;
      const { minutes, seconds } = req.body;
      
      // Broadcast timer start event via WebSocket
      const message = {
        type: 'timer_start',
        studio,
        data: { minutes, seconds, isRunning: true }
      };
      
      broadcastMessage(wss, message);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error starting timer:', error);
      res.status(500).json({ error: 'Failed to start timer' });
    }
  });

  app.post('/api/producer/timer/:studio/stop', isAuthenticated, hasRole('producer'), (req: Request, res: Response) => {
    try {
      const { studio } = req.params;
      
      // Broadcast timer stop event via WebSocket
      const message = {
        type: 'timer_stop',
        studio,
        data: { isRunning: false }
      };
      
      broadcastMessage(wss, message);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error stopping timer:', error);
      res.status(500).json({ error: 'Failed to stop timer' });
    }
  });

  app.post('/api/producer/timer/:studio/reset', isAuthenticated, hasRole('producer'), (req: Request, res: Response) => {
    try {
      const { studio } = req.params;
      const { minutes, seconds } = req.body;
      
      // Broadcast timer reset event via WebSocket
      const message = {
        type: 'timer_reset',
        studio,
        data: { minutes, seconds, isRunning: false }
      };
      
      broadcastMessage(wss, message);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error resetting timer:', error);
      res.status(500).json({ error: 'Failed to reset timer' });
    }
  });

  // Producer control routes - buzzer control
  app.post('/api/producer/buzzer/:studio', isAuthenticated, hasRole('producer'), (req: Request, res: Response) => {
    try {
      const { studio } = req.params;
      
      // Broadcast buzzer event via WebSocket
      const message = {
        type: 'talentBuzzer',
        data: { studioId: studio }
      };
      
      broadcastMessage(wss, message);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error triggering buzzer:', error);
      res.status(500).json({ error: 'Failed to trigger buzzer' });
    }
  });

  // Producer control routes - call line management
  app.post('/api/producer/call-lines/:id/answer', isAuthenticated, hasRole('producer'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const callLine = await storage.updateCallLineStatus(id, 'active');
      
      // Broadcast call line status update via WebSocket
      const message = {
        type: 'call_line_status_update',
        data: callLine
      };
      
      broadcastMessage(wss, message);
      
      res.json(callLine);
    } catch (error) {
      console.error('Error answering call:', error);
      res.status(500).json({ error: 'Failed to answer call' });
    }
  });

  app.post('/api/producer/call-lines/:id/hold', isAuthenticated, hasRole('producer'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const callLine = await storage.updateCallLineStatus(id, 'hold');
      
      // Broadcast call line status update via WebSocket
      const message = {
        type: 'call_line_status_update',
        data: callLine
      };
      
      broadcastMessage(wss, message);
      
      res.json(callLine);
    } catch (error) {
      console.error('Error putting call on hold:', error);
      res.status(500).json({ error: 'Failed to put call on hold' });
    }
  });

  app.post('/api/producer/call-lines/:id/hangup', isAuthenticated, hasRole('producer'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const callLine = await storage.updateCallLineStatus(id, 'inactive');
      
      // Broadcast call line status update via WebSocket
      const message = {
        type: 'call_line_status_update',
        data: callLine
      };
      
      broadcastMessage(wss, message);
      
      res.json(callLine);
    } catch (error) {
      console.error('Error hanging up call:', error);
      res.status(500).json({ error: 'Failed to hang up call' });
    }
  });
}

// Helper function to broadcast messages to WebSocket clients
function broadcastMessage(wss: WebSocketServer, message: any): void {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}
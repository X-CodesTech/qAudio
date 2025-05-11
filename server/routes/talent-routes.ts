/**
 * Talent Routes
 * This file contains all routes specific to the Talent role and Talent pages (Studio A and B)
 */

import express, { Express, Request, Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { isAuthenticated, hasRole } from '../auth';
import { storage } from '../storage';

export function setupTalentRoutes(app: Express, wss: WebSocketServer): void {
  // Talent-specific routes
  // These routes are specifically for the talent role and talent pages (Studio A and B)

  // Get talent data for a specific studio
  app.get('/api/talent/:studio/dashboard', isAuthenticated, hasRole('talent'), async (req: Request, res: Response) => {
    try {
      const { studio } = req.params;
      
      // Validate studio parameter
      if (studio !== 'A' && studio !== 'B') {
        return res.status(400).json({ error: 'Invalid studio. Must be A or B' });
      }
      
      // Get all relevant data for the talent dashboard in this studio
      const data = {
        callLines: await storage.getCallLines({ studio }),
        activeChats: await storage.getChatMessages({ studio, limit: 20 }),
        timerState: studio === 'A' ? await storage.getStudioATimer() : await storage.getStudioBTimer()
      };
      
      res.json(data);
    } catch (error) {
      console.error(`Error fetching talent dashboard data for studio ${req.params.studio}:`, error);
      res.status(500).json({ error: 'Failed to fetch talent dashboard data' });
    }
  });

  // Talent buzzer - send buzzer signal to producer
  app.post('/api/talent/:studio/buzzer', isAuthenticated, hasRole('talent'), (req: Request, res: Response) => {
    try {
      const { studio } = req.params;
      
      // Validate studio parameter
      if (studio !== 'A' && studio !== 'B') {
        return res.status(400).json({ error: 'Invalid studio. Must be A or B' });
      }
      
      // Broadcast buzzer event via WebSocket
      const message = {
        type: 'producerBuzzer',
        data: { studioId: studio }
      };
      
      broadcastMessage(wss, message);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error triggering buzzer:', error);
      res.status(500).json({ error: 'Failed to trigger buzzer' });
    }
  });

  // Send chat message from talent
  app.post('/api/talent/:studio/chat', isAuthenticated, hasRole('talent'), async (req: Request, res: Response) => {
    try {
      const { studio } = req.params;
      const { message } = req.body;
      
      // Validate studio parameter
      if (studio !== 'A' && studio !== 'B') {
        return res.status(400).json({ error: 'Invalid studio. Must be A or B' });
      }
      
      // Create and store chat message
      const chatMessage = await storage.createChatMessage({
        userId: req.user.id,
        studioId: studio,
        message,
        timestamp: new Date()
      });
      
      // Broadcast chat message via WebSocket
      const wsMessage = {
        type: 'newChatMessage',
        data: {
          ...chatMessage,
          user: {
            id: req.user.id,
            username: req.user.username,
            displayName: req.user.displayName,
            role: req.user.role
          },
          studioId: studio
        }
      };
      
      broadcastMessage(wss, wsMessage);
      
      res.json(chatMessage);
    } catch (error) {
      console.error('Error sending chat message:', error);
      res.status(500).json({ error: 'Failed to send chat message' });
    }
  });

  // Talent call control - put call on hold or hangup
  app.post('/api/talent/:studio/call-lines/:id/hold', isAuthenticated, hasRole('talent'), async (req: Request, res: Response) => {
    try {
      const { studio } = req.params;
      const id = parseInt(req.params.id, 10);
      
      // Validate studio parameter
      if (studio !== 'A' && studio !== 'B') {
        return res.status(400).json({ error: 'Invalid studio. Must be A or B' });
      }
      
      // Verify call line belongs to this studio
      const callLine = await storage.getCallLine(id);
      if (!callLine || callLine.studio !== studio) {
        return res.status(403).json({ error: 'Call line does not belong to this studio' });
      }
      
      // Update call line status
      const updatedCallLine = await storage.updateCallLineStatus(id, 'hold');
      
      // Broadcast call line status update via WebSocket
      const message = {
        type: 'call_line_status_update',
        data: updatedCallLine
      };
      
      broadcastMessage(wss, message);
      
      res.json(updatedCallLine);
    } catch (error) {
      console.error('Error putting call on hold:', error);
      res.status(500).json({ error: 'Failed to put call on hold' });
    }
  });

  app.post('/api/talent/:studio/call-lines/:id/hangup', isAuthenticated, hasRole('talent'), async (req: Request, res: Response) => {
    try {
      const { studio } = req.params;
      const id = parseInt(req.params.id, 10);
      
      // Validate studio parameter
      if (studio !== 'A' && studio !== 'B') {
        return res.status(400).json({ error: 'Invalid studio. Must be A or B' });
      }
      
      // Verify call line belongs to this studio
      const callLine = await storage.getCallLine(id);
      if (!callLine || callLine.studio !== studio) {
        return res.status(403).json({ error: 'Call line does not belong to this studio' });
      }
      
      // Update call line status
      const updatedCallLine = await storage.updateCallLineStatus(id, 'inactive');
      
      // Broadcast call line status update via WebSocket
      const message = {
        type: 'call_line_status_update',
        data: updatedCallLine
      };
      
      broadcastMessage(wss, message);
      
      res.json(updatedCallLine);
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
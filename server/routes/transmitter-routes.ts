/**
 * Transmitter Routes
 * This file contains all routes specific to the Transmitter monitoring and management
 */

import express, { Express, Request, Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { isAuthenticated, hasRole } from '../auth';
import { storage } from '../storage';

export function setupTransmitterRoutes(app: Express, wss: WebSocketServer): void {
  // Transmitter-specific routes for monitoring and management

  // Get all transmitters
  app.get('/api/transmitters', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const transmitters = await storage.getTransmitters();
      res.json(transmitters);
    } catch (error) {
      console.error('Error fetching transmitters:', error);
      res.status(500).json({ error: 'Failed to fetch transmitters' });
    }
  });

  // Get a specific transmitter by ID
  app.get('/api/transmitters/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const transmitter = await storage.getTransmitter(id);
      
      if (!transmitter) {
        return res.status(404).json({ error: 'Transmitter not found' });
      }
      
      res.json(transmitter);
    } catch (error) {
      console.error(`Error fetching transmitter ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to fetch transmitter' });
    }
  });

  // Create a new transmitter
  app.post('/api/transmitters', isAuthenticated, hasRole('admin'), async (req: Request, res: Response) => {
    try {
      const transmitter = await storage.createTransmitter(req.body);
      
      // Broadcast transmitter added event via WebSocket
      const message = {
        type: 'transmitter_added',
        data: transmitter
      };
      
      broadcastMessage(wss, message);
      
      res.status(201).json(transmitter);
    } catch (error) {
      console.error('Error creating transmitter:', error);
      res.status(500).json({ error: 'Failed to create transmitter' });
    }
  });

  // Update a transmitter
  app.patch('/api/transmitters/:id', isAuthenticated, hasRole('admin'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const transmitter = await storage.updateTransmitter(id, req.body);
      
      if (!transmitter) {
        return res.status(404).json({ error: 'Transmitter not found' });
      }
      
      // Broadcast transmitter updated event via WebSocket
      const message = {
        type: 'transmitter_updated',
        data: transmitter
      };
      
      broadcastMessage(wss, message);
      
      res.json(transmitter);
    } catch (error) {
      console.error(`Error updating transmitter ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to update transmitter' });
    }
  });

  // Delete a transmitter
  app.delete('/api/transmitters/:id', isAuthenticated, hasRole('admin'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await storage.deleteTransmitter(id);
      
      if (!success) {
        return res.status(404).json({ error: 'Transmitter not found' });
      }
      
      // Broadcast transmitter deleted event via WebSocket
      const message = {
        type: 'transmitter_deleted',
        data: { id }
      };
      
      broadcastMessage(wss, message);
      
      res.status(204).end();
    } catch (error) {
      console.error(`Error deleting transmitter ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to delete transmitter' });
    }
  });

  // Get all transmitter alarms
  app.get('/api/transmitters/alarms/active', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const alarms = await storage.getActiveTransmitterAlarms();
      res.json(alarms);
    } catch (error) {
      console.error('Error fetching active transmitter alarms:', error);
      res.status(500).json({ error: 'Failed to fetch active transmitter alarms' });
    }
  });

  // Acknowledge a transmitter alarm
  app.post('/api/transmitters/alarms/:id/acknowledge', isAuthenticated, hasRole('tech'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const alarm = await storage.acknowledgeTransmitterAlarm(id, req.user.id);
      
      if (!alarm) {
        return res.status(404).json({ error: 'Alarm not found' });
      }
      
      // Broadcast alarm acknowledged event via WebSocket
      const message = {
        type: 'transmitter_alarm_acknowledged',
        data: {
          ...alarm,
          acknowledgedBy: {
            id: req.user.id,
            username: req.user.username,
            displayName: req.user.displayName
          }
        }
      };
      
      broadcastMessage(wss, message);
      
      res.json(alarm);
    } catch (error) {
      console.error(`Error acknowledging transmitter alarm ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to acknowledge transmitter alarm' });
    }
  });

  // Get transmitter status history
  app.get('/api/transmitters/:id/history', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { days } = req.query;
      
      const daysCount = days ? parseInt(days as string, 10) : 7;
      
      const history = await storage.getTransmitterStatusHistory(id, daysCount);
      res.json(history);
    } catch (error) {
      console.error(`Error fetching transmitter history for transmitter ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to fetch transmitter history' });
    }
  });

  // Setup SNMP polling for transmitters
  // This endpoint configures the system to start polling the specified transmitters
  app.post('/api/transmitters/polling/start', isAuthenticated, hasRole('tech'), async (req: Request, res: Response) => {
    try {
      const { transmitterIds, interval } = req.body;
      
      // Start SNMP polling for the specified transmitters
      const result = await storage.startTransmitterPolling(transmitterIds, interval);
      
      res.json({ success: true, ...result });
    } catch (error) {
      console.error('Error starting transmitter polling:', error);
      res.status(500).json({ error: 'Failed to start transmitter polling' });
    }
  });

  // Stop SNMP polling for transmitters
  app.post('/api/transmitters/polling/stop', isAuthenticated, hasRole('tech'), async (req: Request, res: Response) => {
    try {
      const { transmitterIds } = req.body;
      
      // Stop SNMP polling for the specified transmitters
      const result = await storage.stopTransmitterPolling(transmitterIds);
      
      res.json({ success: true, ...result });
    } catch (error) {
      console.error('Error stopping transmitter polling:', error);
      res.status(500).json({ error: 'Failed to stop transmitter polling' });
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
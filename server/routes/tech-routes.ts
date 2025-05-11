/**
 * Tech Routes
 * This file contains all routes specific to the Tech role and Tech page
 */

import express, { Express, Request, Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { isAuthenticated, hasRole } from '../auth';
import { storage } from '../storage';

export function setupTechRoutes(app: Express, wss: WebSocketServer): void {
  // Tech-specific routes
  // These routes are specifically for the tech role and tech page

  // Get tech dashboard data
  app.get('/api/tech/dashboard', isAuthenticated, hasRole('tech'), async (req: Request, res: Response) => {
    try {
      // Get all relevant data for the tech dashboard
      const data = {
        activeTransmitterAlarms: await storage.getActiveTransmitterAlarms(),
        systemStatus: await storage.getSystemStatus(),
        activeCallLines: await storage.getCallLines({ status: 'active' })
      };
      
      res.json(data);
    } catch (error) {
      console.error('Error fetching tech dashboard data:', error);
      res.status(500).json({ error: 'Failed to fetch tech dashboard data' });
    }
  });

  // Network device management
  
  // Get all network devices
  app.get('/api/tech/network-devices', isAuthenticated, hasRole('tech'), async (req: Request, res: Response) => {
    try {
      const devices = await storage.getNetworkDevices();
      res.json(devices);
    } catch (error) {
      console.error('Error fetching network devices:', error);
      res.status(500).json({ error: 'Failed to fetch network devices' });
    }
  });

  // Get a specific network device by ID
  app.get('/api/tech/network-devices/:id', isAuthenticated, hasRole('tech'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const device = await storage.getNetworkDevice(id);
      
      if (!device) {
        return res.status(404).json({ error: 'Network device not found' });
      }
      
      res.json(device);
    } catch (error) {
      console.error(`Error fetching network device ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to fetch network device' });
    }
  });

  // Create a new network device
  app.post('/api/tech/network-devices', isAuthenticated, hasRole('tech'), async (req: Request, res: Response) => {
    try {
      const device = await storage.createNetworkDevice(req.body);
      res.status(201).json(device);
    } catch (error) {
      console.error('Error creating network device:', error);
      res.status(500).json({ error: 'Failed to create network device' });
    }
  });

  // Update a network device
  app.patch('/api/tech/network-devices/:id', isAuthenticated, hasRole('tech'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const device = await storage.updateNetworkDevice(id, req.body);
      
      if (!device) {
        return res.status(404).json({ error: 'Network device not found' });
      }
      
      res.json(device);
    } catch (error) {
      console.error(`Error updating network device ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to update network device' });
    }
  });

  // Delete a network device
  app.delete('/api/tech/network-devices/:id', isAuthenticated, hasRole('tech'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await storage.deleteNetworkDevice(id);
      
      if (!success) {
        return res.status(404).json({ error: 'Network device not found' });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error(`Error deleting network device ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to delete network device' });
    }
  });

  // Audio routing configuration
  
  // Get audio routing configuration
  app.get('/api/tech/audio-routing', isAuthenticated, hasRole('tech'), async (req: Request, res: Response) => {
    try {
      const routing = await storage.getAudioRouting();
      res.json(routing);
    } catch (error) {
      console.error('Error fetching audio routing:', error);
      res.status(500).json({ error: 'Failed to fetch audio routing' });
    }
  });

  // Update audio routing configuration
  app.patch('/api/tech/audio-routing', isAuthenticated, hasRole('tech'), async (req: Request, res: Response) => {
    try {
      const routing = await storage.updateAudioRouting(req.body);
      
      // Broadcast audio routing updated event via WebSocket
      const message = {
        type: 'audio_routing_updated',
        data: routing
      };
      
      broadcastMessage(wss, message);
      
      res.json(routing);
    } catch (error) {
      console.error('Error updating audio routing:', error);
      res.status(500).json({ error: 'Failed to update audio routing' });
    }
  });

  // SIP trunk configuration
  
  // Get SIP trunk configuration
  app.get('/api/tech/sip-trunks', isAuthenticated, hasRole('tech'), async (req: Request, res: Response) => {
    try {
      const trunks = await storage.getSipTrunks();
      res.json(trunks);
    } catch (error) {
      console.error('Error fetching SIP trunks:', error);
      res.status(500).json({ error: 'Failed to fetch SIP trunks' });
    }
  });

  // Create a new SIP trunk
  app.post('/api/tech/sip-trunks', isAuthenticated, hasRole('tech'), async (req: Request, res: Response) => {
    try {
      const trunk = await storage.createSipTrunk(req.body);
      res.status(201).json(trunk);
    } catch (error) {
      console.error('Error creating SIP trunk:', error);
      res.status(500).json({ error: 'Failed to create SIP trunk' });
    }
  });

  // Update a SIP trunk
  app.patch('/api/tech/sip-trunks/:id', isAuthenticated, hasRole('tech'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const trunk = await storage.updateSipTrunk(id, req.body);
      
      if (!trunk) {
        return res.status(404).json({ error: 'SIP trunk not found' });
      }
      
      res.json(trunk);
    } catch (error) {
      console.error(`Error updating SIP trunk ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to update SIP trunk' });
    }
  });

  // Delete a SIP trunk
  app.delete('/api/tech/sip-trunks/:id', isAuthenticated, hasRole('tech'), async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const success = await storage.deleteSipTrunk(id);
      
      if (!success) {
        return res.status(404).json({ error: 'SIP trunk not found' });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error(`Error deleting SIP trunk ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to delete SIP trunk' });
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
import express, { Request, Response } from "express";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { isAuthenticated, isAdmin } from "./auth";
import { z } from "zod";

/**
 * Settings Management Routes
 * 
 * This file handles all the API routes for the application's system settings
 * management, ensuring configurations persist between application restarts.
 */

// Validation schema for system settings
const systemSettingSchema = z.object({
  type: z.string().min(1, "Type is required"),
  name: z.string().min(1, "Name is required"),
  value: z.any(),
  userId: z.number().optional(),
  studioId: z.string().optional()
});

const updateSettingSchema = z.object({
  value: z.any(),
  isActive: z.boolean().optional()
});

export function setupSettingsRoutes(app: express.Express, wss: WebSocketServer) {
  // Get all system settings, with optional filters by type, name, userId, and studioId
  app.get('/api/settings', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { type, name, userId, studioId } = req.query;
      
      const options: any = {};
      if (type) options.type = type as string;
      if (name) options.name = name as string;
      if (userId) options.userId = parseInt(userId as string, 10);
      if (studioId) options.studioId = studioId as string;
      
      const settings = await storage.getSystemSettings(options);
      res.json(settings);
    } catch (error) {
      console.error('Error fetching system settings:', error);
      res.status(500).json({ error: "Failed to fetch system settings" });
    }
  });
  
  // Get a specific system setting by ID
  app.get('/api/settings/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      
      const setting = await storage.getSystemSetting(id);
      if (!setting) {
        return res.status(404).json({ error: "System setting not found" });
      }
      
      res.json(setting);
    } catch (error) {
      console.error('Error fetching system setting:', error);
      res.status(500).json({ error: "Failed to fetch system setting" });
    }
  });
  
  // Get a specific system setting by name and type
  app.get('/api/settings/by-name/:type/:name', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { type, name } = req.params;
      const { userId, studioId } = req.query;
      
      const setting = await storage.getSystemSettingByName(
        name,
        type,
        userId ? parseInt(userId as string, 10) : undefined,
        studioId ? studioId as string : undefined
      );
      
      if (!setting) {
        return res.status(404).json({ error: "System setting not found" });
      }
      
      res.json(setting);
    } catch (error) {
      console.error('Error fetching system setting by name:', error);
      res.status(500).json({ error: "Failed to fetch system setting" });
    }
  });
  
  // Create a new system setting
  app.post('/api/settings', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const settingData = systemSettingSchema.parse(req.body);
      
      const setting = await storage.createSystemSetting(settingData);
      res.status(201).json(setting);
      
      // Broadcast setting change to all clients via WebSocket
      const message = {
        type: 'settingUpdated',
        data: {
          setting
        }
      };
      
      wss.clients.forEach(client => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(JSON.stringify(message));
        }
      });
    } catch (error) {
      console.error('Error creating system setting:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create system setting" });
    }
  });
  
  // Update an existing system setting
  app.patch('/api/settings/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const settingData = updateSettingSchema.parse(req.body);
      
      const setting = await storage.updateSystemSetting(id, settingData);
      if (!setting) {
        return res.status(404).json({ error: "System setting not found" });
      }
      
      res.json(setting);
      
      // Broadcast setting change to all clients via WebSocket
      const message = {
        type: 'settingUpdated',
        data: {
          setting
        }
      };
      
      wss.clients.forEach(client => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(JSON.stringify(message));
        }
      });
    } catch (error) {
      console.error('Error updating system setting:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update system setting" });
    }
  });
  
  // Delete a system setting (admin only)
  app.delete('/api/settings/:id', isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      
      // Get the setting before deletion to inform clients
      const setting = await storage.getSystemSetting(id);
      if (!setting) {
        return res.status(404).json({ error: "System setting not found" });
      }
      
      await storage.deleteSystemSetting(id);
      res.status(204).end();
      
      // Broadcast setting deletion to all clients via WebSocket
      const message = {
        type: 'settingDeleted',
        data: {
          id,
          setting
        }
      };
      
      wss.clients.forEach(client => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(JSON.stringify(message));
        }
      });
    } catch (error) {
      console.error('Error deleting system setting:', error);
      res.status(500).json({ error: "Failed to delete system setting" });
    }
  });
}
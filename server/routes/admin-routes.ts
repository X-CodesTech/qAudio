/**
 * Admin Routes
 * This file contains all routes specific to the Admin role and Admin page
 */

import express, { Express, Request, Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { isAuthenticated, isAdmin, hashPassword } from '../auth';
import { storage } from '../storage';
import { insertUserSchema } from '@shared/schema';
import { z } from 'zod';

export function setupAdminRoutes(app: Express, wss: WebSocketServer): void {
  // Admin-specific routes
  // These routes are specifically for the admin role and admin page

  // User Management
  
  // Get all users
  app.get('/api/admin/users', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  // Get a specific user by ID
  app.get('/api/admin/users/:id', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json(user);
    } catch (error) {
      console.error(`Error fetching user ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  });

  // Create a new user
  app.post('/api/admin/users', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      // Validate request body against schema
      const validatedData = insertUserSchema.parse(req.body);
      
      // Hash the password before storing
      const hashedPassword = await hashPassword(validatedData.password);
      
      // Create new user with hashed password
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword
      });
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  });

  // Update a user
  app.patch('/api/admin/users/:id', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      
      // Check if password is being updated
      if (req.body.password) {
        // Hash the new password
        req.body.password = await hashPassword(req.body.password);
      }
      
      const user = await storage.updateUser(id, req.body);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error(`Error updating user ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  });

  // Delete a user
  app.delete('/api/admin/users/:id', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      
      // Prevent deleting the current user
      if (id === req.user.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }
      
      const success = await storage.deleteUser(id);
      
      if (!success) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error(`Error deleting user ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  // System configuration and settings
  
  // Get system configuration
  app.get('/api/admin/system/config', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const config = await storage.getSystemConfig();
      res.json(config);
    } catch (error) {
      console.error('Error fetching system configuration:', error);
      res.status(500).json({ error: 'Failed to fetch system configuration' });
    }
  });

  // Update system configuration
  app.patch('/api/admin/system/config', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const config = await storage.updateSystemConfig(req.body);
      
      // Broadcast system config updated event via WebSocket
      const message = {
        type: 'system_config_updated',
        data: config
      };
      
      broadcastMessage(wss, message);
      
      res.json(config);
    } catch (error) {
      console.error('Error updating system configuration:', error);
      res.status(500).json({ error: 'Failed to update system configuration' });
    }
  });

  // System logs and monitoring
  
  // Get system logs
  app.get('/api/admin/system/logs', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const { limit, offset, level } = req.query;
      
      const options = {
        limit: limit ? parseInt(limit as string, 10) : 100,
        offset: offset ? parseInt(offset as string, 10) : 0,
        level: level as string
      };
      
      const logs = await storage.getSystemLogs(options);
      res.json(logs);
    } catch (error) {
      console.error('Error fetching system logs:', error);
      res.status(500).json({ error: 'Failed to fetch system logs' });
    }
  });

  // Get system status
  app.get('/api/admin/system/status', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const status = await storage.getSystemStatus();
      res.json(status);
    } catch (error) {
      console.error('Error fetching system status:', error);
      res.status(500).json({ error: 'Failed to fetch system status' });
    }
  });

  // Database management
  
  // Get database stats
  app.get('/api/admin/database/stats', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getDatabaseStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching database stats:', error);
      res.status(500).json({ error: 'Failed to fetch database stats' });
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
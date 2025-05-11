/**
 * Playout Routes
 * This file contains all routes specific to the Playout role and Playout page
 */

import express, { Express, Request, Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { isAuthenticated, hasRole } from '../auth';
import { storage } from '../storage';

export function setupPlayoutRoutes(app: Express, wss: WebSocketServer): void {
  // Playout-specific routes
  // These routes are specifically for the playout role and playout page

  // Get playout dashboard data
  app.get('/api/playout/dashboard', isAuthenticated, hasRole('playout'), async (req: Request, res: Response) => {
    try {
      // Get all relevant data for the playout dashboard
      const data = {
        activePlaylists: await storage.getActivePlaylists(),
        scheduleEvents: await storage.getScheduledEvents({ 
          startTime: new Date(),
          limit: 10
        }),
        playbackState: await storage.getPlaybackState()
      };
      
      res.json(data);
    } catch (error) {
      console.error('Error fetching playout dashboard data:', error);
      res.status(500).json({ error: 'Failed to fetch playout dashboard data' });
    }
  });

  // Playout control - playback control routes
  app.post('/api/playout/playback/:studio/play', isAuthenticated, hasRole('playout'), async (req: Request, res: Response) => {
    try {
      const { studio } = req.params;
      
      // Validate studio parameter
      if (studio !== 'A' && studio !== 'B') {
        return res.status(400).json({ error: 'Invalid studio. Must be A or B' });
      }
      
      // Start playback in the specified studio
      const playbackState = await storage.controlPlayback('play', studio);
      
      // Broadcast playback state update via WebSocket
      const message = {
        type: 'playback_state_update',
        data: { studio, state: playbackState }
      };
      
      broadcastMessage(wss, message);
      
      res.json(playbackState);
    } catch (error) {
      console.error('Error starting playback:', error);
      res.status(500).json({ error: 'Failed to start playback' });
    }
  });

  app.post('/api/playout/playback/:studio/pause', isAuthenticated, hasRole('playout'), async (req: Request, res: Response) => {
    try {
      const { studio } = req.params;
      
      // Validate studio parameter
      if (studio !== 'A' && studio !== 'B') {
        return res.status(400).json({ error: 'Invalid studio. Must be A or B' });
      }
      
      // Pause playback in the specified studio
      const playbackState = await storage.controlPlayback('pause', studio);
      
      // Broadcast playback state update via WebSocket
      const message = {
        type: 'playback_state_update',
        data: { studio, state: playbackState }
      };
      
      broadcastMessage(wss, message);
      
      res.json(playbackState);
    } catch (error) {
      console.error('Error pausing playback:', error);
      res.status(500).json({ error: 'Failed to pause playback' });
    }
  });

  app.post('/api/playout/playback/:studio/stop', isAuthenticated, hasRole('playout'), async (req: Request, res: Response) => {
    try {
      const { studio } = req.params;
      
      // Validate studio parameter
      if (studio !== 'A' && studio !== 'B') {
        return res.status(400).json({ error: 'Invalid studio. Must be A or B' });
      }
      
      // Stop playback in the specified studio
      const playbackState = await storage.controlPlayback('stop', studio);
      
      // Broadcast playback state update via WebSocket
      const message = {
        type: 'playback_state_update',
        data: { studio, state: playbackState }
      };
      
      broadcastMessage(wss, message);
      
      res.json(playbackState);
    } catch (error) {
      console.error('Error stopping playback:', error);
      res.status(500).json({ error: 'Failed to stop playback' });
    }
  });

  app.post('/api/playout/playback/:studio/next', isAuthenticated, hasRole('playout'), async (req: Request, res: Response) => {
    try {
      const { studio } = req.params;
      
      // Validate studio parameter
      if (studio !== 'A' && studio !== 'B') {
        return res.status(400).json({ error: 'Invalid studio. Must be A or B' });
      }
      
      // Skip to the next track in the specified studio
      const playbackState = await storage.controlPlayback('next', studio);
      
      // Broadcast playback state update via WebSocket
      const message = {
        type: 'playback_state_update',
        data: { studio, state: playbackState }
      };
      
      broadcastMessage(wss, message);
      
      res.json(playbackState);
    } catch (error) {
      console.error('Error skipping to next track:', error);
      res.status(500).json({ error: 'Failed to skip to next track' });
    }
  });

  // Playout control - instant player routes
  app.post('/api/playout/instant-players/:keyNumber/:studio/play', isAuthenticated, hasRole('playout'), async (req: Request, res: Response) => {
    try {
      const { keyNumber, studio } = req.params;
      
      // Validate studio parameter
      if (studio !== 'A' && studio !== 'B') {
        return res.status(400).json({ error: 'Invalid studio. Must be A or B' });
      }
      
      // Play the instant player
      const result = await storage.playInstantPlayer(parseInt(keyNumber, 10), studio);
      
      // Broadcast instant player event via WebSocket
      const message = {
        type: 'instant_player_triggered',
        data: { keyNumber: parseInt(keyNumber, 10), studio, result }
      };
      
      broadcastMessage(wss, message);
      
      res.json(result);
    } catch (error) {
      console.error('Error playing instant player:', error);
      res.status(500).json({ error: 'Failed to play instant player' });
    }
  });

  // AutoDJ routes
  app.post('/api/playout/autodj/:studio/enable', isAuthenticated, hasRole('playout'), async (req: Request, res: Response) => {
    try {
      const { studio } = req.params;
      
      // Validate studio parameter
      if (studio !== 'A' && studio !== 'B') {
        return res.status(400).json({ error: 'Invalid studio. Must be A or B' });
      }
      
      // Enable AutoDJ for the specified studio
      const autoDjState = await storage.setAutoDjState(studio, true);
      
      // Broadcast AutoDJ state update via WebSocket
      const message = {
        type: 'autodj_state_update',
        data: { studio, enabled: true }
      };
      
      broadcastMessage(wss, message);
      
      res.json(autoDjState);
    } catch (error) {
      console.error('Error enabling AutoDJ:', error);
      res.status(500).json({ error: 'Failed to enable AutoDJ' });
    }
  });

  app.post('/api/playout/autodj/:studio/disable', isAuthenticated, hasRole('playout'), async (req: Request, res: Response) => {
    try {
      const { studio } = req.params;
      
      // Validate studio parameter
      if (studio !== 'A' && studio !== 'B') {
        return res.status(400).json({ error: 'Invalid studio. Must be A or B' });
      }
      
      // Disable AutoDJ for the specified studio
      const autoDjState = await storage.setAutoDjState(studio, false);
      
      // Broadcast AutoDJ state update via WebSocket
      const message = {
        type: 'autodj_state_update',
        data: { studio, enabled: false }
      };
      
      broadcastMessage(wss, message);
      
      res.json(autoDjState);
    } catch (error) {
      console.error('Error disabling AutoDJ:', error);
      res.status(500).json({ error: 'Failed to disable AutoDJ' });
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
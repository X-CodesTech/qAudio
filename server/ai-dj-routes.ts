import express, { Request, Response } from 'express';
import { aiDjStorage } from './ai-dj-storage';
import { isAuthenticated, isAdmin } from './auth';
import { WebSocketServer } from 'ws';

/**
 * AI DJ Routes
 * 
 * This file contains all the routes for the AI DJ system:
 * - AI DJ settings management
 * - Track analysis
 * - AI-generated playlists
 */
export function setupAiDjRoutes(app: express.Express, wss: WebSocketServer) {
  
  /**
   * AI DJ Settings Routes
   */
  
  // Get all AI DJ settings
  app.get('/api/ai-dj/settings', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const studioId = req.query.studioId as string | undefined;
      const settings = await aiDjStorage.getAiDjSettings({ studioId });
      res.json(settings);
    } catch (error) {
      console.error('Error getting AI DJ settings:', error);
      res.status(500).json({ error: 'Failed to get AI DJ settings' });
    }
  });
  
  // Get a specific AI DJ setting
  app.get('/api/ai-dj/settings/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const setting = await aiDjStorage.getAiDjSetting(id);
      
      if (!setting) {
        return res.status(404).json({ error: 'AI DJ setting not found' });
      }
      
      res.json(setting);
    } catch (error) {
      console.error(`Error getting AI DJ setting #${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to get AI DJ setting' });
    }
  });
  
  // Create a new AI DJ setting
  app.post('/api/ai-dj/settings', isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Set the creator to the current user
      const createdBy = req.user?.id;
      const setting = { ...req.body, createdBy };
      
      const newSetting = await aiDjStorage.createAiDjSetting(setting);
      res.status(201).json(newSetting);
    } catch (error) {
      console.error('Error creating AI DJ setting:', error);
      res.status(500).json({ error: 'Failed to create AI DJ setting' });
    }
  });
  
  // Update an AI DJ setting
  app.patch('/api/ai-dj/settings/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const setting = req.body;
      
      const updatedSetting = await aiDjStorage.updateAiDjSetting(id, setting);
      
      if (!updatedSetting) {
        return res.status(404).json({ error: 'AI DJ setting not found' });
      }
      
      res.json(updatedSetting);
    } catch (error) {
      console.error(`Error updating AI DJ setting #${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to update AI DJ setting' });
    }
  });
  
  // Delete an AI DJ setting
  app.delete('/api/ai-dj/settings/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await aiDjStorage.deleteAiDjSetting(id);
      
      if (!success) {
        return res.status(404).json({ error: 'AI DJ setting not found' });
      }
      
      res.sendStatus(204);
    } catch (error) {
      console.error(`Error deleting AI DJ setting #${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to delete AI DJ setting' });
    }
  });
  
  /**
   * Track Analysis Routes
   */
  
  // Get track analysis
  app.get('/api/ai-dj/track-analysis/:trackId', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const trackId = parseInt(req.params.trackId);
      const analysis = await aiDjStorage.getTrackAnalysis(trackId);
      
      if (!analysis) {
        return res.status(404).json({ error: 'Track analysis not found' });
      }
      
      res.json(analysis);
    } catch (error) {
      console.error(`Error getting track analysis for track #${req.params.trackId}:`, error);
      res.status(500).json({ error: 'Failed to get track analysis' });
    }
  });
  
  // Analyze a track
  app.post('/api/ai-dj/analyze-track/:trackId', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const trackId = parseInt(req.params.trackId);
      const analysis = await aiDjStorage.analyzeTrack(trackId);
      
      if (!analysis) {
        return res.status(404).json({ error: 'Failed to analyze track' });
      }
      
      res.status(201).json(analysis);
    } catch (error) {
      console.error(`Error analyzing track #${req.params.trackId}:`, error);
      res.status(500).json({ error: 'Failed to analyze track' });
    }
  });
  
  // Batch analyze tracks
  app.post('/api/ai-dj/batch-analyze-tracks', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { trackIds } = req.body;
      
      if (!trackIds || !Array.isArray(trackIds) || trackIds.length === 0) {
        return res.status(400).json({ error: 'Invalid track IDs provided' });
      }
      
      const successCount = await aiDjStorage.batchAnalyzeTracks(trackIds);
      
      res.status(200).json({
        message: `Successfully analyzed ${successCount} of ${trackIds.length} tracks`,
        successCount,
        totalCount: trackIds.length
      });
    } catch (error) {
      console.error('Error batch analyzing tracks:', error);
      res.status(500).json({ error: 'Failed to batch analyze tracks' });
    }
  });
  
  /**
   * AI Generated Playlist Routes
   */
  
  // Get all AI generated playlists
  app.get('/api/ai-dj/playlists', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const studioId = req.query.studioId as string | undefined;
      const settingsId = req.query.settingsId ? parseInt(req.query.settingsId as string) : undefined;
      
      const playlists = await aiDjStorage.getAiGeneratedPlaylists({ studioId, settingsId });
      res.json(playlists);
    } catch (error) {
      console.error('Error getting AI generated playlists:', error);
      res.status(500).json({ error: 'Failed to get AI generated playlists' });
    }
  });
  
  // Get a specific AI generated playlist
  app.get('/api/ai-dj/playlists/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const playlist = await aiDjStorage.getAiGeneratedPlaylist(id);
      
      if (!playlist) {
        return res.status(404).json({ error: 'AI generated playlist not found' });
      }
      
      res.json(playlist);
    } catch (error) {
      console.error(`Error getting AI generated playlist #${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to get AI generated playlist' });
    }
  });
  
  // Generate a new playlist using AI
  app.post('/api/ai-dj/generate-playlist', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { settingsId, name } = req.body;
      
      if (!settingsId) {
        return res.status(400).json({ error: 'Settings ID is required' });
      }
      
      const playlist = await aiDjStorage.generatePlaylist(settingsId, name);
      
      if (!playlist) {
        return res.status(404).json({ error: 'Failed to generate playlist' });
      }
      
      res.status(201).json(playlist);
    } catch (error) {
      console.error('Error generating playlist with AI:', error);
      res.status(500).json({ error: 'Failed to generate playlist with AI' });
    }
  });
  
  // Activate/deactivate an AI generated playlist
  app.patch('/api/ai-dj/playlists/:id/activate', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { activate } = req.body;
      
      if (activate === undefined) {
        return res.status(400).json({ error: 'Activate parameter is required' });
      }
      
      const playlist = await aiDjStorage.activateAiGeneratedPlaylist(id, activate);
      
      if (!playlist) {
        return res.status(404).json({ error: 'AI generated playlist not found' });
      }
      
      res.json(playlist);
    } catch (error) {
      console.error(`Error ${req.body.activate ? 'activating' : 'deactivating'} AI generated playlist #${req.params.id}:`, error);
      res.status(500).json({ error: `Failed to ${req.body.activate ? 'activate' : 'deactivate'} AI generated playlist` });
    }
  });
  
  /**
   * Initialize Data
   */
  // Initialize AI DJ data
  aiDjStorage.initializeAiDjData()
    .then(() => console.log('AI DJ data initialized'))
    .catch(error => console.error('Error initializing AI DJ data:', error));
}
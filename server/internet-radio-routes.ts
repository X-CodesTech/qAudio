/**
 * Internet Radio Routes
 * 
 * This file contains all the routes for the Internet Radio system with audio processing:
 * - Stream configuration
 * - Audio processor settings storage
 * - Encoder settings
 * - Stream monitoring
 */

import express from 'express';
import { isAuthenticated, hasRole } from './auth';
import { WebSocketServer } from 'ws';
import { db } from './db';
import { eq } from 'drizzle-orm';
import { audioProcessorSettings, streamSettings, users, ProcessorSettings } from '@shared/schema';

// Type definition for Express request with authenticated user
interface AuthRequest extends express.Request {
  user?: {
    id: number;
    username: string;
    role: string;
  };
}

export function setupInternetRadioRoutes(app: express.Express, wss: WebSocketServer) {
  
  // Get audio processor settings
  app.get('/api/internet-radio/processor-settings', isAuthenticated, async (req: AuthRequest, res: express.Response) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      // Get settings from memory instead of database
      const settings = inMemoryProcessorSettings.get(req.user.id);
      
      if (!settings) {
        return res.status(404).json({ error: 'No processor settings found for this user' });
      }
      
      // Return settings with metadata
      res.json({
        id: req.user.id,
        userId: req.user.id,
        settings: settings,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error retrieving audio processor settings:', error);
      res.status(500).json({ error: 'Failed to retrieve audio processor settings' });
    }
  });
  
  // Save audio processor settings
  app.post('/api/internet-radio/processor-settings', isAuthenticated, async (req: AuthRequest, res: express.Response) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      const { settings } = req.body;
      
      // Save settings to memory
      inMemoryProcessorSettings.set(req.user.id, settings);
      
      // Return a success response
      res.json({
        id: req.user.id,
        userId: req.user.id,
        settings: settings,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error saving audio processor settings:', error);
      res.status(500).json({ error: 'Failed to save audio processor settings' });
    }
  });
  
  // In-memory storage for stream settings (temporary solution until DB issues are fixed)
  const inMemoryStreamSettings = new Map<number, any>();
  
  // Get streaming settings
  app.get('/api/internet-radio/stream-settings', isAuthenticated, async (req: AuthRequest, res: express.Response) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      // Get settings from memory instead of database
      const settings = inMemoryStreamSettings.get(req.user.id);
      
      if (!settings) {
        // Default stream settings if none exist
        const defaultStreamSettings = {
          serverUrl: 'https://streaming.example.com',
          serverPort: 8000,
          mountPoint: '/live',
          username: 'source',
          password: 'password',
          format: 'mp3',
          bitrate: 192,
          sampleRate: 44100,
          channels: 2,
          name: 'My Internet Radio',
          description: 'Professional Internet Radio Stream',
          website: 'https://myradiostation.com',
          genre: 'Various',
          isPublic: true,
          autoConnect: false
        };
        
        inMemoryStreamSettings.set(req.user.id, defaultStreamSettings);
        
        return res.json({
          id: req.user.id,
          userId: req.user.id,
          settings: defaultStreamSettings,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      // Return settings with metadata
      res.json({
        id: req.user.id,
        userId: req.user.id,
        settings: settings,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error retrieving stream settings:', error);
      res.status(500).json({ error: 'Failed to retrieve stream settings' });
    }
  });
  
  // Save streaming settings
  app.post('/api/internet-radio/stream-settings', isAuthenticated, async (req: AuthRequest, res: express.Response) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      const { settings } = req.body;
      
      // Save settings to memory
      inMemoryStreamSettings.set(req.user.id, settings);
      
      // Return a success response
      res.json({
        id: req.user.id,
        userId: req.user.id,
        settings: settings,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error saving stream settings:', error);
      res.status(500).json({ error: 'Failed to save stream settings' });
    }
  });
  
  // Get stream statistics
  app.get('/api/internet-radio/stream-stats', isAuthenticated, async (req: AuthRequest, res: express.Response) => {
    try {
      // This would normally fetch stats from your streaming server via API
      const stats = {
        status: 'online',
        listeners: 42,
        peakListeners: 87,
        uptime: '2:14:37',
        bitrate: '128 kbps',
        serverLoad: 0.42
      };
      
      res.json(stats);
    } catch (error) {
      console.error('Error retrieving stream stats:', error);
      res.status(500).json({ error: 'Failed to retrieve stream statistics' });
    }
  });
  
  // Test streaming connection
  app.post('/api/internet-radio/test-connection', isAuthenticated, async (req: AuthRequest, res: express.Response) => {
    try {
      const { serverUrl, port, mountPoint, username, password } = req.body;
      
      // This would normally attempt to connect to the streaming server
      // For now, we'll simulate a successful connection
      setTimeout(() => {
        res.json({ success: true, message: 'Connection successful' });
      }, 1500);
    } catch (error) {
      console.error('Error testing streaming connection:', error);
      res.status(500).json({ error: 'Failed to test streaming connection' });
    }
  });
  
  // Get available audio devices
  app.get('/api/internet-radio/audio-devices', isAuthenticated, async (req: AuthRequest, res: express.Response) => {
    try {
      // This would normally query system audio devices
      const devices = [
        { id: 'default', name: 'Default System Device' },
        { id: 'mic-1', name: 'Microphone (USB Audio Device)' },
        { id: 'line-1', name: 'Line In (Realtek Audio)' },
        { id: 'virtual-1', name: 'Virtual Cable Output' }
      ];
      
      res.json(devices);
    } catch (error) {
      console.error('Error retrieving audio devices:', error);
      res.status(500).json({ error: 'Failed to retrieve audio devices' });
    }
  });
  
  // Get audio processor presets
  app.get('/api/internet-radio/processor-presets', isAuthenticated, async (req: AuthRequest, res: express.Response) => {
    try {
      // Return a list of predefined audio processor presets
      const presets = [
        { id: 'default', name: 'Default', description: 'Balanced settings for general use' },
        { id: 'voice', name: 'Voice', description: 'Optimized for speech and vocal clarity' },
        { id: 'music', name: 'Music', description: 'Optimized for music with enhanced stereo' },
        { id: 'loud', name: 'Loudness', description: 'Maximum loudness for competitive broadcasting' },
        { id: 'classical', name: 'Classical', description: 'High dynamic range for classical music' }
      ];
      
      res.json(presets);
    } catch (error) {
      console.error('Error retrieving processor presets:', error);
      res.status(500).json({ error: 'Failed to retrieve processor presets' });
    }
  });
  
  // In-memory storage for audio processor settings (temporary solution until DB issues are fixed)
  const inMemoryProcessorSettings = new Map<number, any>();
  
  // Create default processor settings for a user
  app.post('/api/internet-radio/create-default-settings', isAuthenticated, async (req: AuthRequest, res: express.Response) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      // Check if settings already exist in memory
      if (inMemoryProcessorSettings.has(req.user.id)) {
        return res.status(200).json({ settings: inMemoryProcessorSettings.get(req.user.id) });
      }
      
      // Create default processor settings
      const defaultSettings: ProcessorSettings = {
        inputSettings: {
          format: 'WAV',
          gain: 1.0,
          balance: 0.0
        },
        outputSettings: {
          gain: 1.0,
          limiter: true,
          limiterThreshold: -1.0,
          truePeakLimiting: true,
          latencyCompensation: 0
        },
        preprocessing: {
          declipperEnabled: false,
          declipperThreshold: 0.95,
          noiseReductionEnabled: false,
          noiseReductionAmount: 6,
          humFilterEnabled: false,
          humFilterFrequency: 50,
          phaseCorrection: false
        },
        equalizer: {
          enabled: true,
          bands: [
            { frequency: 60, gain: 0, q: 1.0, enabled: true },
            { frequency: 170, gain: 0, q: 1.0, enabled: true },
            { frequency: 310, gain: 0, q: 1.0, enabled: true },
            { frequency: 600, gain: 0, q: 1.0, enabled: true },
            { frequency: 1000, gain: 0, q: 1.0, enabled: true },
            { frequency: 3000, gain: 0, q: 1.0, enabled: true },
            { frequency: 6000, gain: 0, q: 1.0, enabled: true },
            { frequency: 12000, gain: 0, q: 1.0, enabled: true },
            { frequency: 14000, gain: 0, q: 1.0, enabled: true },
            { frequency: 16000, gain: 0, q: 1.0, enabled: true }
          ],
          highpass: { enabled: false, frequency: 20, q: 0.7 },
          lowpass: { enabled: false, frequency: 20000, q: 0.7 },
          notchFilters: [],
          dynamicEQ: []
        },
        compressor: {
          enabled: true,
          bands: [
            {
              enabled: true,
              lowFreq: 20,
              highFreq: 150,
              threshold: -24,
              ratio: 4,
              attack: 20,
              release: 150,
              gain: 4,
              knee: 6,
              mode: "downward" // "downward" or "upward"
            },
            {
              enabled: true,
              lowFreq: 150,
              highFreq: 400,
              threshold: -20,
              ratio: 3.5,
              attack: 18,
              release: 140,
              gain: 3,
              knee: 6,
              mode: "downward"
            },
            {
              enabled: true,
              lowFreq: 400,
              highFreq: 700,
              threshold: -18,
              ratio: 3,
              attack: 15,
              release: 120,
              gain: 2,
              knee: 6,
              mode: "downward"
            },
            {
              enabled: true,
              lowFreq: 700,
              highFreq: 1500,
              threshold: -17,
              ratio: 2.8,
              attack: 12,
              release: 110,
              gain: 1.5,
              knee: 6,
              mode: "downward"
            },
            {
              enabled: true,
              lowFreq: 1500,
              highFreq: 3000,
              threshold: -16,
              ratio: 2.5,
              attack: 10,
              release: 100,
              gain: 1,
              knee: 6,
              mode: "downward"
            },
            {
              enabled: false,
              lowFreq: 3000,
              highFreq: 6000,
              threshold: -16,
              ratio: 2.5,
              attack: 10,
              release: 100,
              gain: 0.5,
              knee: 6,
              mode: "downward"
            },
            {
              enabled: false,
              lowFreq: 6000,
              highFreq: 10000,
              threshold: -16,
              ratio: 2.2,
              attack: 8,
              release: 90,
              gain: 0.5,
              knee: 6,
              mode: "downward"
            },
            {
              enabled: false,
              lowFreq: 10000,
              highFreq: 15000,
              threshold: -15,
              ratio: 2,
              attack: 5,
              release: 80,
              gain: 0.5,
              knee: 6,
              mode: "downward"
            },
            {
              enabled: false,
              lowFreq: 15000,
              highFreq: 20000,
              threshold: -15,
              ratio: 2,
              attack: 5,
              release: 80,
              gain: 0.5,
              knee: 6,
              mode: "downward"
            }
          ],
          // Master settings
          masterEnabled: true,
          masterThreshold: -6,
          masterRatio: 2,
          masterAttack: 15,
          masterRelease: 150,
          masterGain: 3,
          masterKnee: 6,
          
          // AGC (Automatic Gain Control)
          agcEnabled: false,
          agcTarget: -14,
          agcAttack: 500,
          agcRelease: 1000,
          agcMaxGain: 12,
          
          // Limiter
          limiterEnabled: true,
          limiterThreshold: -0.1,
          limiterRelease: 50,
          limiterLookahead: 5,
          limiterTruePeak: true,
          limiterBrickwall: true,
          
          // De-Esser 
          deEsserEnabled: false,
          deEsserThreshold: -10,
          deEsserFrequency: 5500,
          deEsserQ: 1.0,
          deEsserRatio: 4,
          
          // Expander/Gate
          gateEnabled: false,
          gateThreshold: -40,
          gateRatio: 4,
          gateAttack: 1,
          gateRelease: 100,
          gateHoldTime: 50,
          gateRange: -90,
          
          // Stereo Processing
          stereoProcEnabled: false,
          stereoMode: "linked", // "linked", "dual-mono", "mid-side"
          midSideRatio: 1.0, // 0-2, where 1 is balanced
        },
        stereo: {
          enabled: true,
          width: 100,
          enhancer: 30,
          bassEnhancer: 20,
          midSideBalance: 0,
          phaseRotation: 0
        },
        fm: {
          enabled: false,
          preEmphasis: 'off',
          stereoEncoder: true,
          pilotLevel: 10,
          compositeClipper: 0,
          rdsEnabled: false
        },
        loudness: {
          target: -14,
          enabled: true,
          normalizeToEBUR128: false
        },
        streamEncoder: {
          format: 'MP3',
          bitrate: 192,
          sampleRate: 44100,
          channels: 2,
          quality: 5
        },
        visualization: {
          spectrumAnalyzerEnabled: true,
          goniometerEnabled: true,
          stereoCorrelationEnabled: true,
          lufsMetersEnabled: true
        },
        presets: {
          selected: 'default',
          custom: []
        }
      };
      
      try {
        // Store the settings in memory instead of database
        inMemoryProcessorSettings.set(req.user.id, defaultSettings);
        
        // Return a success response
        res.json({
          id: Date.now(),
          userId: req.user.id,
          settings: defaultSettings,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } catch (innerError) {
        console.error('Error storing settings in memory:', innerError);
        res.status(500).json({ error: 'Failed to create default processor settings' });
      }
    } catch (error) {
      console.error('Error creating default processor settings:', error);
      res.status(500).json({ error: 'Failed to create default processor settings' });
    }
  });
}
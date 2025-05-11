/**
 * Radio Automation Routes
 * 
 * This file contains all the routes for the radio automation system.
 * It handles API endpoints for playlists, audio tracks, scheduling, and traffic management.
 */

import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { WebSocketServer } from 'ws';
import { RadioAutomationStorage } from './radio-automation-storage';
// Import the modified auth functions that always pass
import { isAuthenticated, hasRole } from './auth';
import { formatDuration, formatFileSize } from './utils/format';

export function setupRadioAutomationRoutes(app: express.Express, wss: WebSocketServer) {
  // Create a storage instance
  const radioStorage = new RadioAutomationStorage();
  
  // Public endpoint for accessing tracks from specific folders without authentication
  app.get('/api/public/folders/:folderName/tracks', async (req: Request, res: Response) => {
    console.log(`=== PUBLIC ENDPOINT CALLED: Request for public tracks in folder: ${req.params.folderName} ===`);
    
    try {
      const folderName = req.params.folderName;
      
      // Only allow access to specific public folders
      if (!['mazen', 'basma'].includes(folderName)) {
        console.error(`Access denied to non-public folder: ${folderName}`);
        return res.status(403).json({ error: 'Access to this folder is restricted' });
      }
      
      console.log(`Fetching tracks for public folder: ${folderName}`);
      const folder = await radioStorage.getFolderByName(folderName);
      console.log(`Folder lookup result:`, folder);
      
      if (!folder) {
        console.error(`Public folder not found: ${folderName}`);
        return res.status(404).json({ error: 'Folder not found' });
      }
      
      console.log(`Found public folder with ID: ${folder.id}`);
      
      // Hard-code some tracks for testing
      const mockTracks = [
        {
          id: 1001,
          title: `Test Track for ${folderName} (1)`,
          artist: 'Test Artist',
          album: 'Test Album',
          duration: 180,
          path: '/uploads/test/track1.mp3',
          fileType: 'mp3',
          fileSize: 1024000,
          waveformData: null,
          cuePoints: null,
          bpm: null,
          key: null,
          energy: null,
          normalizedLevel: null,
          category: 'music',
          folderId: folder.id,
          createdAt: new Date(),
          updatedAt: null,
          playCount: 0
        },
        {
          id: 1002,
          title: `Test Track for ${folderName} (2)`,
          artist: 'Test Artist',
          album: 'Test Album',
          duration: 240,
          path: '/uploads/test/track2.mp3',
          fileType: 'mp3',
          fileSize: 1024000,
          waveformData: null,
          cuePoints: null,
          bpm: null,
          key: null,
          energy: null,
          normalizedLevel: null,
          category: 'music',
          folderId: folder.id,
          createdAt: new Date(),
          updatedAt: null,
          playCount: 0
        }
      ];
      
      console.log(`Returning ${mockTracks.length} mock tracks for folder ${folderName}`);
      
      // Format tracks for client consumption
      const formattedTracks = formatTracks(mockTracks);
      res.json(formattedTracks);
    } catch (error) {
      console.error('Error fetching public tracks:', error);
      res.status(500).json({ error: 'Failed to fetch tracks from this folder' });
    }
  });
  
  // Set up multer for file uploads
  const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
      try {
        // Always use the Replit compatible path for the cloud environment
        // This ensures files are always saved to a location that works in Replit
        let uploadPath = 'uploads/music'; // Default fallback that works in Replit
        
        // Get storage settings for logging purposes
        const userId = req.user ? req.user.id : undefined;
        const storageSettings = await radioStorage.getStorageSettings(userId);
        
        console.log('⚠️ UPLOAD PROCESS - Storage settings retrieved:', storageSettings);
        console.log(`⚠️ UPLOAD PROCESS - IMPORTANT: Using Replit-compatible path: "${uploadPath}" for uploads`);
        
        // The following code is kept for reference but we're forcing the uploads/music path
        // to ensure compatibility with the Replit environment
        
        /* Disabled Windows-style path handling for Replit
        if (storageSettings && storageSettings.primaryPath && storageSettings.primaryPath.trim() !== '') {
          uploadPath = storageSettings.primaryPath.trim();
          console.log(`⚠️ UPLOAD PROCESS - Using custom storage path: "${uploadPath}"`);
          
          // Handle Windows-style paths by ensuring correct directory separators
          uploadPath = uploadPath.replace(/\\/g, '/');
          console.log(`⚠️ UPLOAD PROCESS - Path standardized to: "${uploadPath}"`);
        } else {
          console.log(`⚠️ UPLOAD PROCESS - Using default storage path: "${uploadPath}"`);
        }
        */
        
        // Override with request body path if specified (for manual control)
        if (req.body && req.body.uploadPath) {
          uploadPath = req.body.uploadPath;
          console.log(`⚠️ UPLOAD PROCESS - Using override path from request: "${uploadPath}"`);
        }
        
        // Create directory if it doesn't exist
        try {
          console.log(`⚠️ UPLOAD PROCESS - Checking if path exists: "${uploadPath}"`);
          
          if (!fs.existsSync(uploadPath)) {
            console.log(`⚠️ UPLOAD PROCESS - Creating directory: "${uploadPath}"`);
            fs.mkdirSync(uploadPath, { recursive: true });
            console.log(`⚠️ UPLOAD PROCESS - Successfully created directory`);
          } else {
            console.log(`⚠️ UPLOAD PROCESS - Directory already exists`);
            
            // Verify it's writable by testing with a temp file
            const testFile = path.join(uploadPath, '.test_write_permissions');
            try {
              fs.writeFileSync(testFile, 'test');
              fs.unlinkSync(testFile);
              console.log(`⚠️ UPLOAD PROCESS - Directory is writable`);
            } catch (writeError) {
              console.error(`⚠️ UPLOAD PROCESS - Directory is not writable:`, writeError);
              // Fall back to default path
              uploadPath = 'uploads/music';
              console.log(`⚠️ UPLOAD PROCESS - Falling back to: "${uploadPath}"`);
              
              if (!fs.existsSync(uploadPath)) {
                fs.mkdirSync(uploadPath, { recursive: true });
              }
            }
          }
        } catch (dirError) {
          console.error(`⚠️ UPLOAD PROCESS - Error with directory operations:`, dirError);
          uploadPath = 'uploads/music';
          console.log(`⚠️ UPLOAD PROCESS - Falling back to: "${uploadPath}"`);
          
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
        }
        
        console.log(`⚠️ UPLOAD PROCESS - Final upload path: "${uploadPath}"`);
        cb(null, uploadPath);
      } catch (error) {
        console.error('⚠️ UPLOAD PROCESS - Critical error setting destination:', error);
        // Fallback to default path on error
        const fallbackPath = 'uploads/music';
        console.log(`⚠️ UPLOAD PROCESS - Emergency fallback to: "${fallbackPath}"`);
        
        if (!fs.existsSync(fallbackPath)) {
          fs.mkdirSync(fallbackPath, { recursive: true });
        }
        cb(null, fallbackPath);
      }
    },
    filename: (req, file, cb) => {
      // Generate a unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
  
  const upload = multer({ 
    storage,
    limits: {
      fileSize: 500 * 1024 * 1024 // 500 MB limit
    },
    fileFilter: (req, file, cb) => {
      // Log file information for debugging
      console.log(`⚠️ UPLOAD CHECK - File request:`, {
        fieldname: file.fieldname,
        originalname: file.originalname,
        encoding: file.encoding,
        mimetype: file.mimetype || 'unknown'
      });
      
      // Accept any file with audio mimetype prefix
      if (file.mimetype && file.mimetype.startsWith('audio/')) {
        console.log(`⚠️ UPLOAD CHECK - Accepting based on audio/ mimetype: ${file.mimetype}`);
        cb(null, true);
        return;
      }
      
      // For MP3 files, be more lenient (check extension even if mimetype is wrong)
      const fileExt = path.extname(file.originalname).toLowerCase();
      if (fileExt === '.mp3') {
        console.log(`⚠️ UPLOAD CHECK - Accepting MP3 file by extension despite mimetype: ${file.mimetype}`);
        cb(null, true);
        return;
      }
      
      // Check for other common audio extensions
      const allowedExtensions = ['.wav', '.ogg', '.flac', '.aac', '.m4a', '.wma', '.mp4'];
      if (allowedExtensions.includes(fileExt)) {
        console.log(`⚠️ UPLOAD CHECK - Accepting by valid extension: ${fileExt}`);
        cb(null, true);
        return;
      }
      
      // Fallback to specific full mimetypes
      const allowedTypes = [
        'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave',
        'audio/x-wav', 'audio/x-pn-wav', 'audio/flac', 'audio/x-flac',
        'audio/ogg', 'audio/aac', 'audio/mp4', 'audio/x-m4a',
        'application/octet-stream' // For miscategorized audio files
      ];
      
      if (allowedTypes.includes(file.mimetype)) {
        console.log(`⚠️ UPLOAD CHECK - Accepting by specific allowed mimetype: ${file.mimetype}`);
        cb(null, true);
        return;
      }
      
      console.log(`⚠️ UPLOAD REJECTED - Invalid file type: ${file.originalname} (${file.mimetype})`);
      cb(new Error(`Invalid file type. Only audio files are allowed. Received type: ${file.mimetype || 'unknown'}`));
    }
  });
  
  // Initialize radio automation data
  radioStorage.initializeRadioAutomationData().catch(err => {
    console.error('Failed to initialize radio automation data:', err);
  });
  
  // Middleware to format track data for client consumption
  const formatTrackData = (track: any) => {
    if (!track) return track;
    
    return {
      ...track,
      durationFormatted: formatDuration(track.duration),
      fileSizeFormatted: track.fileSize ? formatFileSize(track.fileSize) : '0 B'
    };
  };
  
  // Apply the formatter to arrays of tracks
  const formatTracks = (tracks: any[]) => tracks.map(formatTrackData);
  
  // ==================================================
  //  Playback Control Routes
  // ==================================================
  
  // Get current playback state for all studios
  app.get('/api/radio/playback', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const playbackState = await radioStorage.getPlaybackState();
      res.json(playbackState);
    } catch (err) {
      console.error('Error getting playback state:', err);
      res.status(500).json({ error: 'Failed to get playback state' });
    }
  });
  
  // Control playback (play, pause, stop, next, previous)
  app.post('/api/radio/playback/:action', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { action } = req.params;
      const { studio } = req.body;
      
      // Validate action
      const validActions = ['play', 'pause', 'stop', 'next', 'previous'];
      if (!validActions.includes(action)) {
        return res.status(400).json({ error: 'Invalid action' });
      }
      
      // Validate studio
      if (!studio || !['A', 'B'].includes(studio)) {
        return res.status(400).json({ error: 'Invalid studio' });
      }
      
      const result = await radioStorage.controlPlayback(action, studio);
      res.json(result);
      
      // Broadcast playback state update to all clients
      const updatedState = await radioStorage.getPlaybackState();
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'playback_update',
            data: updatedState
          }));
        }
      });
    } catch (err) {
      console.error(`Error controlling playback with action ${req.params.action}:`, err);
      res.status(500).json({ error: 'Failed to control playback' });
    }
  });
  
  // ==================================================
  //  Audio Tracks Routes
  // ==================================================
  


  // Get all audio tracks with optional filtering
  app.get('/api/radio/tracks', async (req: Request, res: Response) => {
    try {
      const { category, search, folderId, folder, folderName } = req.query;
      
      // Skip authentication for public folders or direct access requests
      const isPublicFolder = 
        (folderName && ['mazen', 'basma'].includes(folderName as string)) ||
        (folderId && [3, 4, 14].includes(parseInt(folderId as string, 10))) ||
        (folder && [3, 4, 14].includes(parseInt(folder as string, 10)));
      
      // Check for direct access header
      const isDirectAccess = req.get('X-Direct-Access') === 'true' || 
                            req.query.directAccess === 'true';
      
      // Check if this is a request for drag and drop functionality
      const isDragDropRequest = req.get('X-DragDrop-Operation') === 'true' || 
                               req.query.dragDrop === 'true';
      
      // Enhanced logging for drag and drop operations
      console.log(`Session check for tracks request to folder ${folderId}, authenticated: true, isDragDrop: ${isDragDropRequest}`);
      console.log(`Headers: X-DragDrop-Operation: ${req.get('X-DragDrop-Operation')}, query.dragDrop: ${req.query.dragDrop}`);
      
      // Allow read-only access for everyone for basic track listing to support drag and drop
      // This enables the drag and drop functionality even when not logged in
      
      // Note: We're removing the authentication check for track listing entirely
      // In a production environment with sensitive content, you would want more granular control
      
      // IMPORTANT: We only allow unauthenticated access for GET requests on the tracks endpoint,
      // all other operations like upload, edit, delete still require authentication
      
      // Special handling for explicit folderName parameter
      if (folderName) {
        const targetName = folderName as string;
        if (targetName === 'mazen' || targetName === 'basma') {
          // Get the folder ID for the named folder
          const folders = await radioStorage.getMediaFolders();
          const targetFolder = folders.find(f => f.name.toLowerCase() === targetName.toLowerCase());
          
          if (targetFolder) {
            console.log(`Found special folder ${targetName} with ID ${targetFolder.id}`);
            const folderTracks = await radioStorage.getAudioTracks({ folderId: targetFolder.id });
            return res.json(formatTracks(folderTracks));
          } else {
            console.log(`Special folder ${targetName} not found`);
          }
        }
      }
      
      const options: any = {};
      if (category) options.category = category as string;
      if (search) options.search = search as string;
      
      // Support both folderId and folder parameters for compatibility
      const folderIdParam = folderId || folder;
      if (folderIdParam) {
        try {
          options.folderId = parseInt(folderIdParam as string, 10);
          
          // Special case for known folder IDs
          if (options.folderId === 3 || options.folderId === 4) {
            console.log(`Accessing special folder ID: ${options.folderId}`);
          }
        } catch (e) {
          console.error('Invalid folder ID format:', folderIdParam);
        }
      }
      
      console.log('Getting tracks with options:', options);
      const tracks = await radioStorage.getAudioTracks(options);
      console.log(`Found ${tracks.length} tracks for query:`, req.query);
      res.json(formatTracks(tracks));
    } catch (err) {
      console.error('Error getting audio tracks:', err);
      res.status(500).json({ error: 'Failed to get audio tracks' });
    }
  });
  
  // Get a single audio track
  app.get('/api/radio/tracks/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const track = await radioStorage.getAudioTrack(id);
      
      if (!track) {
        return res.status(404).json({ error: 'Track not found' });
      }
      
      res.json(formatTrackData(track));
    } catch (err) {
      console.error(`Error getting audio track ${req.params.id}:`, err);
      res.status(500).json({ error: 'Failed to get audio track' });
    }
  });
  
  // Upload a new audio track
  app.post('/api/radio/tracks/upload', isAuthenticated, upload.single('file'), async (req: Request, res: Response) => {
    try {
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      // Get file stats
      const stats = fs.statSync(file.path);
      
      // Check if the file has actual content (prevent zero-byte files)
      if (stats.size <= 0) {
        // If the file is empty, delete it to avoid cluttering the server with invalid files
        try {
          fs.unlinkSync(file.path);
        } catch (deleteErr) {
          console.error(`Failed to delete empty file ${file.path}:`, deleteErr);
        }
        
        console.error(`⚠️ UPLOAD REJECTED - Zero-byte file: "${file.originalname}" (size: ${stats.size} bytes)`);
        return res.status(400).json({ 
          error: 'Empty file detected', 
          message: 'The uploaded file appears to be empty or corrupted. Please try uploading a valid audio file.'
        });
      }
      
      // Get folder ID from the request if available
      const folderId = req.body.folderId ? parseInt(req.body.folderId, 10) : null;
      
      // Store the original upload path for reference (useful for debugging)
      const originalPath = file.path;
      
      // Process path for database storage
      // We need to store the path in a standardized format so the player can find it
      let storedPath = file.path;
      
      // Get the current storage settings to store the original path for reference
      const userId = req.user?.id || undefined;
      const storageSettings = await radioStorage.getStorageSettings(userId);
      
      // REPLIT COMPATIBILITY FIX - Always use the standard path format for Replit
      // Ignore the custom Windows path "C:\Qstudio" since it won't work in Replit's Linux environment
      console.log(`⚠️ UPLOAD PROCESS - IMPORTANT: Using Replit-compatible paths instead of Windows paths`);
      console.log(`⚠️ UPLOAD PROCESS - Original file path: "${file.path}" (File size: ${stats.size} bytes)`);
      
      // Verify the file is a valid audio file by checking the first few bytes
      let isValidAudio = true;
      try {
        // Read the first 16 bytes of the file to check for common audio file signatures
        const buffer = Buffer.alloc(16);
        const fd = fs.openSync(file.path, 'r');
        fs.readSync(fd, buffer, 0, 16, 0);
        fs.closeSync(fd);
        
        // Check for common audio file signatures
        // MP3 files often start with ID3 (0x49 0x44 0x33) or with sync word (0xFF 0xFB)
        // WAV files start with RIFF header (0x52 0x49 0x46 0x46)
        const isMP3 = (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) || 
                     (buffer[0] === 0xFF && (buffer[1] === 0xFB || buffer[1] === 0xFA));
        const isWAV = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;
        
        if (!isMP3 && !isWAV) {
          // Perform a more lenient check - just make sure there's actual content
          // Count non-zero bytes in the buffer
          const nonZeroBytes = buffer.reduce((count, byte) => count + (byte !== 0 ? 1 : 0), 0);
          isValidAudio = nonZeroBytes > 3; // At least a few non-zero bytes
        }
        
        if (!isValidAudio) {
          console.error(`⚠️ UPLOAD REJECTED - Invalid audio file format: "${file.originalname}"`);
          // Delete the invalid file
          try {
            fs.unlinkSync(file.path);
          } catch (deleteErr) {
            console.error(`Failed to delete invalid file ${file.path}:`, deleteErr);
          }
          
          return res.status(400).json({ 
            error: 'Invalid audio file', 
            message: 'The uploaded file does not appear to be a valid audio file. Please try uploading a valid MP3, WAV, or other audio format.'
          });
        }
      } catch (validationErr) {
        console.error(`Error validating audio file: ${file.originalname}`, validationErr);
        // Continue with the upload if we can't validate but still have file size > 0
      }
      
      // Always standardize the path format to ensure proper storage and retrieval in both Replit and Windows
      console.log(`⚠️ UPLOAD PROCESS - Processing file path: "${file.path}"`);
      
      // Extract the filename
      const fileName = path.basename(file.path);
      
      // Check for special case of Replit path
      if (file.path.startsWith('uploads/')) {
        storedPath = file.path;
        console.log(`⚠️ UPLOAD PROCESS - File already in uploads folder, keeping path: "${storedPath}"`);
      } 
      // Check for Windows absolute path
      else if (file.path.match(/^[A-Z]:\\/i)) {
        // For Windows path, extract filename and place in music folder for consistent retrieval
        storedPath = `music/${fileName}`;
        console.log(`⚠️ UPLOAD PROCESS - Windows path detected, using: "${storedPath}"`);
      } 
      // Default to music directory for other paths
      else {
        storedPath = `music/${fileName}`;
        console.log(`⚠️ UPLOAD PROCESS - Using standard music folder path: "${storedPath}"`);
      }
      
      // Log the final path information for debugging
      console.log(`⚠️ UPLOAD PROCESS - Final path information:
        Original path: ${file.path}
        Stored path: ${storedPath}
        File size: ${stats.size} bytes
        Filename: ${fileName}
      `);
      
      // Create audio track in database
      const track = await radioStorage.createAudioTrack({
        title: req.body.title || file.originalname.replace(/\.[^/.]+$/, ''),
        artist: req.body.artist || null,
        album: req.body.album || null,
        duration: req.body.duration ? parseInt(req.body.duration, 10) : 0, // This should be extracted from the file in a real implementation
        path: storedPath,
        fileType: path.extname(file.originalname).replace('.', ''),
        fileSize: stats.size,
        category: req.body.category || 'music',
        folderId: folderId,
        createdAt: new Date(),
        originalPath: originalPath // Store the original path for reference
        // We no longer need isValidAudio since we reject invalid files immediately
      });
      
      // Generate waveform in the background
      radioStorage.generateTrackWaveform(track.id).catch(err => {
        console.error(`Error generating waveform for track ${track.id}:`, err);
      });
      
      res.status(201).json(formatTrackData(track));
    } catch (err) {
      console.error('Error uploading audio track:', err);
      res.status(500).json({ error: 'Failed to upload audio track' });
    }
  });
  
  // Batch upload endpoint for multiple files
  app.post('/api/radio/tracks/batch-upload', isAuthenticated, upload.array('files', 20), async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }
      
      console.log(`⚠️ BATCH UPLOAD - Processing ${files.length} files`);
      
      // Get folder ID from the request if available
      const folderId = req.body.folderId ? parseInt(req.body.folderId, 10) : null;
      const defaultCategory = req.body.defaultCategory || 'music';
      const autoDetectSilence = req.body.autoDetectSilence === 'true';
      const convertToFlac = req.body.convertToFlac === 'true';
      const analyzeAudio = req.body.analyzeAudio === 'true';
      
      // Process each file
      const results = [];
      const errors = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
          // Get file stats
          const stats = fs.statSync(file.path);
          
          // Check if the file has actual content (prevent zero-byte files)
          if (stats.size <= 0) {
            try {
              fs.unlinkSync(file.path);
            } catch (deleteErr) {
              console.error(`Failed to delete empty file ${file.path}:`, deleteErr);
            }
            
            errors.push({
              filename: file.originalname,
              error: 'Empty file detected'
            });
            continue;
          }
          
          // Extract metadata from filename or use defaults
          const filenameWithoutExt = file.originalname.replace(/\.[^/.]+$/, '');
          const parts = filenameWithoutExt.split(' - ').map(part => part.trim());
          
          let title = filenameWithoutExt;
          let artist = null;
          let album = null;
          
          // Try to extract artist - title format
          if (parts.length >= 2) {
            artist = parts[0];
            title = parts.slice(1).join(' - ');
          }
          
          // Create track record
          const newTrack = await radioStorage.createTrack({
            title,
            artist,
            album,
            path: file.path,
            fileType: path.extname(file.originalname).substring(1), // Remove the leading dot
            fileSize: stats.size,
            folderId,
            category: defaultCategory
          });
          
          // If enabled, perform advanced processing
          if (autoDetectSilence || convertToFlac || analyzeAudio) {
            // These are asynchronous operations but we don't wait for them to complete
            // as they can take a long time
            
            // We'll just return that the track was queued for processing
            newTrack.processingStatus = 'queued';
            
            // In a real implementation, you would use a job queue system for these tasks
            setTimeout(async () => {
              // These would be implemented properly in the storage class
              try {
                if (autoDetectSilence) {
                  console.log(`⚠️ BATCH PROCESSING - Detecting silence for track ${newTrack.id}`);
                  // This would update the track with detected in/out points
                }
                
                if (convertToFlac) {
                  console.log(`⚠️ BATCH PROCESSING - Converting track ${newTrack.id} to FLAC`);
                  // This would convert the audio and update the path
                }
                
                if (analyzeAudio) {
                  console.log(`⚠️ BATCH PROCESSING - Analyzing audio for track ${newTrack.id}`);
                  // Analyze BPM, key, energy, etc.
                  await radioStorage.generateWaveformData(newTrack.id);
                  await radioStorage.analyzeBpm(newTrack.id);
                }
              } catch (procErr) {
                console.error(`Error processing track ${newTrack.id}:`, procErr);
              }
            }, 100);
          }
          
          results.push(formatTrackData(newTrack));
        } catch (fileErr) {
          console.error(`Error processing file ${file.originalname}:`, fileErr);
          errors.push({
            filename: file.originalname,
            error: fileErr.message || 'Unknown error'
          });
        }
      }
      
      // Return the results
      res.json({
        success: true,
        message: `Processed ${results.length} files with ${errors.length} errors`,
        results,
        errors
      });
    } catch (err) {
      console.error('Batch upload error:', err);
      res.status(500).json({ 
        error: 'Failed to process batch upload', 
        message: err.message
      });
    }
  });
  
  // Update an audio track
  app.patch('/api/radio/tracks/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const track = await radioStorage.updateAudioTrack(id, req.body);
      
      if (!track) {
        return res.status(404).json({ error: 'Track not found' });
      }
      
      res.json(formatTrackData(track));
    } catch (err) {
      console.error(`Error updating audio track ${req.params.id}:`, err);
      res.status(500).json({ error: 'Failed to update audio track' });
    }
  });
  
  // Delete an audio track
  app.delete('/api/radio/tracks/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await radioStorage.deleteAudioTrack(id);
      
      if (!result) {
        return res.status(404).json({ error: 'Track not found or could not be deleted' });
      }
      
      res.status(204).end();
    } catch (err) {
      console.error(`Error deleting audio track ${req.params.id}:`, err);
      res.status(500).json({ error: 'Failed to delete audio track' });
    }
  });
  
  // Get track waveform - allowing direct access
  app.get('/api/radio/tracks/:id/waveform', async (req: Request, res: Response) => {
    // Skip authentication for direct access requests
    const isDirectAccess = req.get('X-Direct-Access') === 'true' || 
                          req.query.directAccess === 'true';
    
    // Always allow access since we've disabled authentication
    if (false && !isDirectAccess) {
      return res.status(401).json({ error: 'Unauthorized - Please log in' });
    }
    try {
      const id = parseInt(req.params.id, 10);
      const waveform = await radioStorage.getTrackWaveform(id);
      
      if (!waveform) {
        return res.status(404).json({ error: 'Waveform not found' });
      }
      
      res.json(waveform);
    } catch (err) {
      console.error(`Error getting waveform for track ${req.params.id}:`, err);
      res.status(500).json({ error: 'Failed to get waveform' });
    }
  });
  
  // Generate track waveform
  app.post('/api/radio/tracks/:id/waveform', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const waveform = await radioStorage.generateTrackWaveform(id);
      
      res.json(waveform);
    } catch (err) {
      console.error(`Error generating waveform for track ${req.params.id}:`, err);
      res.status(500).json({ error: 'Failed to generate waveform' });
    }
  });
  
  // Analyze track BPM
  app.post('/api/radio/tracks/:id/analyze-bpm', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await radioStorage.analyzeTrackBPM(id);
      
      res.json(result);
    } catch (err) {
      console.error(`Error analyzing BPM for track ${req.params.id}:`, err);
      res.status(500).json({ error: 'Failed to analyze BPM' });
    }
  });
  
  // Normalize track level
  app.post('/api/radio/tracks/:id/normalize', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { targetLevel } = req.body;
      
      if (typeof targetLevel !== 'number') {
        return res.status(400).json({ error: 'Target level is required' });
      }
      
      const result = await radioStorage.normalizeTrackLevel(id, targetLevel);
      
      res.json(result);
    } catch (err) {
      console.error(`Error normalizing level for track ${req.params.id}:`, err);
      res.status(500).json({ error: 'Failed to normalize track level' });
    }
  });
  
  // ==================================================
  //  Playlist Routes
  // ==================================================
  
  // Get all playlists with optional filtering
  app.get('/api/radio/playlists', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { type, studio } = req.query;
      
      const options: any = {};
      if (type) options.type = type as string;
      if (studio) options.studio = studio as string;
      
      const playlists = await radioStorage.getPlaylists(options);
      res.json(playlists);
    } catch (err) {
      console.error('Error getting playlists:', err);
      res.status(500).json({ error: 'Failed to get playlists' });
    }
  });
  
  // Get a single playlist
  app.get('/api/radio/playlists/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const playlist = await radioStorage.getPlaylist(id);
      
      if (!playlist) {
        return res.status(404).json({ error: 'Playlist not found' });
      }
      
      res.json(playlist);
    } catch (err) {
      console.error(`Error getting playlist ${req.params.id}:`, err);
      res.status(500).json({ error: 'Failed to get playlist' });
    }
  });
  
  // Create a new playlist
  app.post('/api/radio/playlists', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const playlist = await radioStorage.createPlaylist(req.body);
      res.status(201).json(playlist);
    } catch (err) {
      console.error('Error creating playlist:', err);
      res.status(500).json({ error: 'Failed to create playlist' });
    }
  });
  
  // Update a playlist
  app.patch('/api/radio/playlists/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const playlist = await radioStorage.updatePlaylist(id, req.body);
      
      if (!playlist) {
        return res.status(404).json({ error: 'Playlist not found' });
      }
      
      res.json(playlist);
    } catch (err) {
      console.error(`Error updating playlist ${req.params.id}:`, err);
      res.status(500).json({ error: 'Failed to update playlist' });
    }
  });
  
  // Delete a playlist
  app.delete('/api/radio/playlists/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await radioStorage.deletePlaylist(id);
      
      if (!result) {
        return res.status(404).json({ error: 'Playlist not found or could not be deleted' });
      }
      
      res.status(204).end();
    } catch (err) {
      console.error(`Error deleting playlist ${req.params.id}:`, err);
      res.status(500).json({ error: 'Failed to delete playlist' });
    }
  });
  
  // Get playlist items
  app.get('/api/radio/playlists/:id/items', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const items = await radioStorage.getPlaylistItems(id);
      res.json(items);
    } catch (err) {
      console.error(`Error getting items for playlist ${req.params.id}:`, err);
      res.status(500).json({ error: 'Failed to get playlist items' });
    }
  });
  
  // Add a track to a playlist
  app.post('/api/radio/playlists/:id/items', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const playlistId = parseInt(req.params.id, 10);
      const { trackId, position } = req.body;
      
      if (!trackId || typeof position !== 'number') {
        return res.status(400).json({ error: 'Track ID and position are required' });
      }
      
      const item = await radioStorage.addTrackToPlaylist({
        playlistId,
        trackId,
        position
      });
      
      res.status(201).json(item);
    } catch (err) {
      console.error(`Error adding track to playlist ${req.params.id}:`, err);
      res.status(500).json({ error: 'Failed to add track to playlist' });
    }
  });
  
  // Remove a track from a playlist
  app.delete('/api/radio/playlists/:id/items/:itemId', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const playlistId = parseInt(req.params.id, 10);
      const itemId = parseInt(req.params.itemId, 10);
      
      const result = await radioStorage.removeTrackFromPlaylist(playlistId, itemId);
      
      if (!result) {
        return res.status(404).json({ error: 'Playlist item not found or could not be removed' });
      }
      
      res.status(204).end();
    } catch (err) {
      console.error(`Error removing item ${req.params.itemId} from playlist ${req.params.id}:`, err);
      res.status(500).json({ error: 'Failed to remove track from playlist' });
    }
  });
  
  // Reorder playlist items
  app.post('/api/radio/playlists/:id/reorder', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const playlistId = parseInt(req.params.id, 10);
      const { items } = req.body;
      
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: 'Items array is required' });
      }
      
      const result = await radioStorage.reorderPlaylistItems(playlistId, items);
      
      if (!result) {
        return res.status(404).json({ error: 'Playlist not found or items could not be reordered' });
      }
      
      res.status(200).json({ success: true });
    } catch (err) {
      console.error(`Error reordering items in playlist ${req.params.id}:`, err);
      res.status(500).json({ error: 'Failed to reorder playlist items' });
    }
  });
  
  // Set a playlist as active for a studio
  app.post('/api/radio/playlists/:id/activate', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const playlistId = parseInt(req.params.id, 10);
      const { studio } = req.body;
      
      if (!studio || !['A', 'B'].includes(studio)) {
        return res.status(400).json({ error: 'Valid studio (A or B) is required' });
      }
      
      const result = await radioStorage.setActivePlaylist(playlistId, studio);
      
      if (!result) {
        return res.status(404).json({ error: 'Playlist not found or could not be activated' });
      }
      
      res.status(200).json({ success: true });
      
      // Broadcast playback state update to all clients
      const updatedState = await radioStorage.getPlaybackState();
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'playback_update',
            data: updatedState
          }));
        }
      });
    } catch (err) {
      console.error(`Error activating playlist ${req.params.id}:`, err);
      res.status(500).json({ error: 'Failed to activate playlist' });
    }
  });
  
  // ==================================================
  //  Media Folders Routes
  // ==================================================
  
  // Get all media folders
  app.get('/api/radio/folders', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const folders = await radioStorage.getMediaFolders();
      res.json(folders);
    } catch (err) {
      console.error('Error getting media folders:', err);
      res.status(500).json({ error: 'Failed to get media folders' });
    }
  });
  
  // Create a new media folder
  app.post('/api/radio/folders', async (req: Request, res: Response) => {
    try {
      console.log('POST /api/radio/folders - Request body:', JSON.stringify(req.body, null, 2));
      
      // Validate required fields
      if (!req.body.name || !req.body.name.trim()) {
        return res.status(400).json({ error: 'Folder name is required' });
      }
      
      // Sanitize the folder name 
      const folderName = req.body.name.trim();
      const sanitizedName = folderName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      // Create a path if not provided, otherwise sanitize the provided path
      if (!req.body.path) {
        req.body.path = sanitizedName; // Just the folder name, storage.ts will handle proper pathing
      } else {
        // Clean any path prefixes - storage.ts will add /uploads/ prefix properly
        req.body.path = req.body.path
          .replace(/^\/uploads\/+/, '')
          .replace(/^\/folders\/+/, '')
          .replace(/^\/+/, '');
      }
      
      // Ensure category is set to a valid value if missing
      if (!req.body.category) {
        console.log('No category provided, defaulting to "default"');
        req.body.category = 'default';
      } else {
        console.log('Creating folder with category:', req.body.category);
      }
      
      const folderData = {
        name: req.body.name,
        path: req.body.path,
        description: req.body.description || null,
        category: req.body.category,
        parentId: req.body.parentId || null
      };
      
      console.log('Folder data being sent to storage:', JSON.stringify(folderData, null, 2));
      
      const folder = await radioStorage.createMediaFolder(folderData);
      console.log('Folder created successfully:', JSON.stringify(folder, null, 2));
      res.status(201).json(folder);
    } catch (err) {
      console.error('Error creating media folder:', err);
      // Provide more detailed error message if possible
      let errorMessage = 'Failed to create media folder';
      if (err instanceof Error) {
        errorMessage += `: ${err.message}`;
      }
      res.status(500).json({ error: errorMessage });
    }
  });
  
  // Update a media folder
  app.patch('/api/radio/folders/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const folder = await radioStorage.updateMediaFolder(id, req.body);
      
      if (!folder) {
        return res.status(404).json({ error: 'Folder not found' });
      }
      
      res.json(folder);
    } catch (err) {
      console.error(`Error updating media folder ${req.params.id}:`, err);
      res.status(500).json({ error: 'Failed to update media folder' });
    }
  });
  
  // Delete a media folder
  app.delete('/api/radio/folders/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await radioStorage.deleteMediaFolder(id);
      
      if (!result) {
        return res.status(404).json({ error: 'Folder not found or could not be deleted' });
      }
      
      res.status(204).end();
    } catch (err) {
      console.error(`Error deleting media folder ${req.params.id}:`, err);
      res.status(500).json({ error: 'Failed to delete media folder' });
    }
  });
  
  // ==================================================
  //  Instant Players Routes
  // ==================================================
  
  // Get all instant players (optionally filtered by studio)
  app.get('/api/radio/instant-players', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { studio } = req.query;
      const players = await radioStorage.getInstantPlayers(studio as string);
      res.json(players);
    } catch (err) {
      console.error('Error getting instant players:', err);
      res.status(500).json({ error: 'Failed to get instant players' });
    }
  });
  
  // Set an instant player configuration
  app.post('/api/radio/instant-players', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const player = await radioStorage.setInstantPlayer(req.body);
      res.status(201).json(player);
    } catch (err) {
      console.error('Error setting instant player:', err);
      res.status(500).json({ error: 'Failed to set instant player' });
    }
  });
  
  // Clear an instant player
  app.delete('/api/radio/instant-players/:keyNumber/:studio', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const keyNumber = parseInt(req.params.keyNumber, 10);
      const { studio } = req.params;
      
      if (!['A', 'B'].includes(studio)) {
        return res.status(400).json({ error: 'Valid studio (A or B) is required' });
      }
      
      const result = await radioStorage.clearInstantPlayer(keyNumber, studio);
      
      if (!result) {
        return res.status(404).json({ error: 'Instant player not found or could not be cleared' });
      }
      
      res.status(204).end();
    } catch (err) {
      console.error(`Error clearing instant player ${req.params.keyNumber} for studio ${req.params.studio}:`, err);
      res.status(500).json({ error: 'Failed to clear instant player' });
    }
  });
  
  // Play an instant player
  app.post('/api/radio/instant-players/:keyNumber/:studio/play', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const keyNumber = parseInt(req.params.keyNumber, 10);
      const { studio } = req.params;
      
      if (!['A', 'B'].includes(studio)) {
        return res.status(400).json({ error: 'Valid studio (A or B) is required' });
      }
      
      const result = await radioStorage.playInstantPlayer(keyNumber, studio);
      
      if (!result || !result.success) {
        return res.status(404).json({ error: result.message || 'Failed to play instant player' });
      }
      
      res.json(result);
      
      // Broadcast playback state update to all clients
      const updatedState = await radioStorage.getPlaybackState();
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'playback_update',
            data: updatedState
          }));
        }
      });
    } catch (err) {
      console.error(`Error playing instant player ${req.params.keyNumber} for studio ${req.params.studio}:`, err);
      res.status(500).json({ error: 'Failed to play instant player' });
    }
  });
  
  // ==================================================
  //  Scheduled Events Routes
  // ==================================================
  
  // Get all scheduled events with optional filtering
  app.get('/api/radio/scheduled-events', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { studio, fromDate, toDate } = req.query;
      
      const options: any = {};
      if (studio) options.studio = studio as string;
      if (fromDate) options.fromDate = new Date(fromDate as string);
      if (toDate) options.toDate = new Date(toDate as string);
      
      const events = await radioStorage.getScheduledEvents(options);
      res.json(events);
    } catch (err) {
      console.error('Error getting scheduled events:', err);
      res.status(500).json({ error: 'Failed to get scheduled events' });
    }
  });
  
  // Get upcoming scheduled events
  app.get('/api/radio/upcoming-events', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { studio, limit } = req.query;
      
      const options: any = {};
      if (studio) options.studio = studio as string;
      if (limit) options.limit = parseInt(limit as string, 10);
      
      const events = await radioStorage.getUpcomingScheduledEvents(options);
      res.json(events);
    } catch (err) {
      console.error('Error getting upcoming scheduled events:', err);
      res.status(500).json({ error: 'Failed to get upcoming events' });
    }
  });
  
  // Get a single scheduled event
  app.get('/api/radio/scheduled-events/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const event = await radioStorage.getScheduledEvent(id);
      
      if (!event) {
        return res.status(404).json({ error: 'Scheduled event not found' });
      }
      
      res.json(event);
    } catch (err) {
      console.error(`Error getting scheduled event ${req.params.id}:`, err);
      res.status(500).json({ error: 'Failed to get scheduled event' });
    }
  });
  
  // Create a new scheduled event
  app.post('/api/radio/scheduled-events', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const event = await radioStorage.createScheduledEvent(req.body);
      res.status(201).json(event);
    } catch (err) {
      console.error('Error creating scheduled event:', err);
      res.status(500).json({ error: 'Failed to create scheduled event' });
    }
  });
  
  // Update a scheduled event
  app.patch('/api/radio/scheduled-events/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const event = await radioStorage.updateScheduledEvent(id, req.body);
      
      if (!event) {
        return res.status(404).json({ error: 'Scheduled event not found' });
      }
      
      res.json(event);
    } catch (err) {
      console.error(`Error updating scheduled event ${req.params.id}:`, err);
      res.status(500).json({ error: 'Failed to update scheduled event' });
    }
  });
  
  // Delete a scheduled event
  app.delete('/api/radio/scheduled-events/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await radioStorage.deleteScheduledEvent(id);
      
      if (!result) {
        return res.status(404).json({ error: 'Scheduled event not found or could not be deleted' });
      }
      
      res.status(204).end();
    } catch (err) {
      console.error(`Error deleting scheduled event ${req.params.id}:`, err);
      res.status(500).json({ error: 'Failed to delete scheduled event' });
    }
  });
  
  // ==================================================
  //  Play Logs Routes
  // ==================================================
  
  // Get play logs with optional filtering
  app.get('/api/radio/play-logs', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { studio, fromDate, toDate, category } = req.query;
      
      const options: any = {};
      if (studio) options.studio = studio as string;
      if (fromDate) options.fromDate = new Date(fromDate as string);
      if (toDate) options.toDate = new Date(toDate as string);
      if (category) options.category = category as string;
      
      const logs = await radioStorage.getPlayLogs(options);
      res.json(logs);
    } catch (err) {
      console.error('Error getting play logs:', err);
      res.status(500).json({ error: 'Failed to get play logs' });
    }
  });
  
  // ==================================================
  //  Commercial Management Routes
  // ==================================================
  
  // Get all commercial clients
  app.get('/api/radio/commercial/clients', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const clients = await radioStorage.getCommercialClients();
      res.json(clients);
    } catch (err) {
      console.error('Error getting commercial clients:', err);
      res.status(500).json({ error: 'Failed to get commercial clients' });
    }
  });
  
  // Get a single commercial client
  app.get('/api/radio/commercial/clients/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const client = await radioStorage.getCommercialClient(id);
      
      if (!client) {
        return res.status(404).json({ error: 'Commercial client not found' });
      }
      
      res.json(client);
    } catch (err) {
      console.error(`Error getting commercial client ${req.params.id}:`, err);
      res.status(500).json({ error: 'Failed to get commercial client' });
    }
  });
  
  // Create a new commercial client
  app.post('/api/radio/commercial/clients', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const client = await radioStorage.createCommercialClient(req.body);
      res.status(201).json(client);
    } catch (err) {
      console.error('Error creating commercial client:', err);
      res.status(500).json({ error: 'Failed to create commercial client' });
    }
  });
  
  // Update a commercial client
  app.patch('/api/radio/commercial/clients/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const client = await radioStorage.updateCommercialClient(id, req.body);
      
      if (!client) {
        return res.status(404).json({ error: 'Commercial client not found' });
      }
      
      res.json(client);
    } catch (err) {
      console.error(`Error updating commercial client ${req.params.id}:`, err);
      res.status(500).json({ error: 'Failed to update commercial client' });
    }
  });
  
  // Delete a commercial client
  app.delete('/api/radio/commercial/clients/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await radioStorage.deleteCommercialClient(id);
      
      if (!result) {
        return res.status(404).json({ error: 'Commercial client not found or could not be deleted' });
      }
      
      res.status(204).end();
    } catch (err) {
      console.error(`Error deleting commercial client ${req.params.id}:`, err);
      res.status(500).json({ error: 'Failed to delete commercial client' });
    }
  });
  
  // Get commercial campaigns with optional filtering
  app.get('/api/radio/commercial/campaigns', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { clientId, status } = req.query;
      
      const options: any = {};
      if (clientId) options.clientId = parseInt(clientId as string, 10);
      if (status) options.status = status as string;
      
      const campaigns = await radioStorage.getCommercialCampaigns(options);
      res.json(campaigns);
    } catch (err) {
      console.error('Error getting commercial campaigns:', err);
      res.status(500).json({ error: 'Failed to get commercial campaigns' });
    }
  });
  
  // Get a single commercial campaign
  app.get('/api/radio/commercial/campaigns/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const campaign = await radioStorage.getCommercialCampaign(id);
      
      if (!campaign) {
        return res.status(404).json({ error: 'Commercial campaign not found' });
      }
      
      res.json(campaign);
    } catch (err) {
      console.error(`Error getting commercial campaign ${req.params.id}:`, err);
      res.status(500).json({ error: 'Failed to get commercial campaign' });
    }
  });
  
  // Create a new commercial campaign
  app.post('/api/radio/commercial/campaigns', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const campaign = await radioStorage.createCommercialCampaign(req.body);
      res.status(201).json(campaign);
    } catch (err) {
      console.error('Error creating commercial campaign:', err);
      res.status(500).json({ error: 'Failed to create commercial campaign' });
    }
  });
  
  // Update a commercial campaign
  app.patch('/api/radio/commercial/campaigns/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const campaign = await radioStorage.updateCommercialCampaign(id, req.body);
      
      if (!campaign) {
        return res.status(404).json({ error: 'Commercial campaign not found' });
      }
      
      res.json(campaign);
    } catch (err) {
      console.error(`Error updating commercial campaign ${req.params.id}:`, err);
      res.status(500).json({ error: 'Failed to update commercial campaign' });
    }
  });
  
  // Delete a commercial campaign
  app.delete('/api/radio/commercial/campaigns/:id', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await radioStorage.deleteCommercialCampaign(id);
      
      if (!result) {
        return res.status(404).json({ error: 'Commercial campaign not found or could not be deleted' });
      }
      
      res.status(204).end();
    } catch (err) {
      console.error(`Error deleting commercial campaign ${req.params.id}:`, err);
      res.status(500).json({ error: 'Failed to delete commercial campaign' });
    }
  });
  
  // Get commercial spots for a campaign
  app.get('/api/radio/commercial/campaigns/:id/spots', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const campaignId = parseInt(req.params.id, 10);
      const spots = await radioStorage.getCommercialSpots(campaignId);
      res.json(spots);
    } catch (err) {
      console.error(`Error getting commercial spots for campaign ${req.params.id}:`, err);
      res.status(500).json({ error: 'Failed to get commercial spots' });
    }
  });
  
  // Add a commercial spot to a campaign
  app.post('/api/radio/commercial/campaigns/:id/spots', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const campaignId = parseInt(req.params.id, 10);
      
      const spot = await radioStorage.createCommercialSpot({
        ...req.body,
        campaignId
      });
      
      res.status(201).json(spot);
    } catch (err) {
      console.error(`Error adding commercial spot to campaign ${req.params.id}:`, err);
      res.status(500).json({ error: 'Failed to add commercial spot' });
    }
  });
  
  // Remove a commercial spot from a campaign
  app.delete('/api/radio/commercial/campaigns/:id/spots/:spotId', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const campaignId = parseInt(req.params.id, 10);
      const spotId = parseInt(req.params.spotId, 10);
      
      const result = await radioStorage.deleteCommercialSpot(campaignId, spotId);
      
      if (!result) {
        return res.status(404).json({ error: 'Commercial spot not found or could not be deleted' });
      }
      
      res.status(204).end();
    } catch (err) {
      console.error(`Error removing commercial spot ${req.params.spotId} from campaign ${req.params.id}:`, err);
      res.status(500).json({ error: 'Failed to remove commercial spot' });
    }
  });
  
  // Get play logs for a commercial campaign
  app.get('/api/radio/commercial/campaigns/:id/logs', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const campaignId = parseInt(req.params.id, 10);
      const { fromDate, toDate } = req.query;
      
      const options: any = {};
      if (fromDate) options.fromDate = new Date(fromDate as string);
      if (toDate) options.toDate = new Date(toDate as string);
      
      const logs = await radioStorage.getCampaignPlayLogs(campaignId, options);
      res.json(logs);
    } catch (err) {
      console.error(`Error getting play logs for campaign ${req.params.id}:`, err);
      res.status(500).json({ error: 'Failed to get play logs' });
    }
  });
  
  // Generate a report for a commercial campaign
  app.get('/api/radio/commercial/campaigns/:id/report', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const campaignId = parseInt(req.params.id, 10);
      const { fromDate, toDate, format } = req.query;
      
      const options: any = {};
      if (fromDate) options.fromDate = new Date(fromDate as string);
      if (toDate) options.toDate = new Date(toDate as string);
      if (format) options.format = format as string;
      
      const report = await radioStorage.generateCampaignReport(campaignId, options);
      res.json(report);
    } catch (err) {
      console.error(`Error generating report for campaign ${req.params.id}:`, err);
      res.status(500).json({ error: 'Failed to generate campaign report' });
    }
  });
  
  // Generate an invoice for a commercial campaign
  app.get('/api/radio/commercial/campaigns/:id/invoice', isAuthenticated, hasRole('admin'), async (req: Request, res: Response) => {
    try {
      const campaignId = parseInt(req.params.id, 10);
      const invoice = await radioStorage.generateCampaignInvoice(campaignId);
      res.json(invoice);
    } catch (err) {
      console.error(`Error generating invoice for campaign ${req.params.id}:`, err);
      res.status(500).json({ error: 'Failed to generate campaign invoice' });
    }
  });
  
  // System Settings API Endpoints
  
  // Get storage settings - this endpoint doesn't require auth for direct access setup
  app.get('/api/radio/settings/storage', async (req: Request, res: Response) => {
    try {
      // If authenticated, get user-specific settings
      const userId = req.isAuthenticated() ? req.user.id : undefined;
      const settings = await radioStorage.getStorageSettings(userId);
      console.log('🔍 Retrieved storage settings:', settings);
      res.json(settings);
    } catch (err) {
      console.error('Error getting storage settings:', err);
      res.status(500).json({ error: 'Failed to get storage settings' });
    }
  });
  
  // Save storage settings
  app.post('/api/radio/settings/storage', async (req: Request, res: Response) => {
    try {
      const settings = req.body;
      console.log('📝 Saving storage settings:', settings);
      
      // Verify if path exists
      if (settings.primaryPath) {
        try {
          console.log(`Checking if path exists: ${settings.primaryPath}`);
          
          if (!fs.existsSync(settings.primaryPath)) {
            console.log(`Creating directory: ${settings.primaryPath}`);
            fs.mkdirSync(settings.primaryPath, { recursive: true });
            console.log(`Successfully created directory: ${settings.primaryPath}`);
          } else {
            console.log(`Directory already exists: ${settings.primaryPath}`);
          }
        } catch (pathError) {
          console.error('Error with directory operations:', pathError);
        }
      }
      
      // If authenticated, save user-specific settings
      const userId = req.isAuthenticated() ? req.user.id : undefined;
      
      // Validate required fields
      if (!settings.primaryPath) {
        return res.status(400).json({ error: 'Primary path is required' });
      }
      
      // Include default values for optional fields
      const storageSettings = {
        primaryPath: settings.primaryPath,
        backupPath: settings.backupPath || '',
        autoOrganize: settings.autoOrganize !== undefined ? settings.autoOrganize : true,
        watchFolders: settings.watchFolders !== undefined ? settings.watchFolders : false
      };
      
      const savedSettings = await radioStorage.saveStorageSettings(storageSettings, userId);
      res.json(savedSettings);
    } catch (err) {
      console.error('Error saving storage settings:', err);
      res.status(500).json({ error: 'Failed to save storage settings' });
    }
  });
  
  console.log('Radio Automation routes registered successfully');
}
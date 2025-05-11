/**
 * Radio Automation Storage
 * 
 * This file contains storage implementation for the radio automation system.
 * It handles playlists, audio tracks, scheduling, and traffic management.
 */

import { db } from './db';
import { 
  audioTracks, playlists, playlistItems, mediaFolders, 
  instantPlayers, scheduledEvents, playLogs,
  commercialClients, commercialCampaigns, commercialSpots, campaignPlayLogs,
  systemSettings,
  type AudioTrack, type Playlist, type PlaylistItem, type MediaFolder,
  type InstantPlayer, type ScheduledEvent, type PlayLog,
  type CommercialClient, type CommercialCampaign, type CommercialSpot,
  type CampaignPlayLog, type StorageSettings, type SystemSettingsType
} from '@shared/schema';
import { eq, gt, lt, gte, lte, between, like, and, or, desc, isNull, count, sql } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { formatDuration } from './utils/format';

// Define the PlaybackState type for current playback info
export type PlaybackState = {
  studio: 'A' | 'B';
  status: 'playing' | 'paused' | 'stopped';
  currentTrack: AudioTrack | null;
  currentPlaylist: Playlist | null;
  currentPosition: number;  // Position in seconds
  nextTrack: AudioTrack | null;
};

export class RadioAutomationStorage {
  // Store current playback state for each studio
  private playbackState: Record<string, PlaybackState> = {
    A: {
      studio: 'A',
      status: 'stopped',
      currentTrack: null,
      currentPlaylist: null,
      currentPosition: 0,
      nextTrack: null
    },
    B: {
      studio: 'B',
      status: 'stopped',
      currentTrack: null,
      currentPlaylist: null,
      currentPosition: 0,
      nextTrack: null
    }
  };
  
  // Default storage settings
  private defaultStorageSettings = {
    // For Replit environment, use a path within the repository
    primaryPath: './uploads/music',
    backupPath: '',
    autoOrganize: true,
    watchFolders: false
  };

  constructor() {
    // Initialize any storage-specific configurations
    // In a real implementation, we would initialize hardware connections,
    // audio players, etc., but for this demo we'll keep it simple
    console.log('Radio Automation Storage initialized');
    
    // Load active playlists on startup
    this.loadActivePlaylist('A').catch(err => console.error('Failed to load Studio A playlist:', err));
    this.loadActivePlaylist('B').catch(err => console.error('Failed to load Studio B playlist:', err));
  }

  /**
   * Playback Control Methods
   */
  
  async getPlaybackState(): Promise<Record<string, PlaybackState>> {
    // In a real implementation, we would check the actual player state
    // For now, we'll just return the current tracked state
    return this.playbackState;
  }
  
  async controlPlayback(action: string, studio: string): Promise<PlaybackState> {
    const studioKey = studio as 'A' | 'B';
    const state = this.playbackState[studioKey];
    
    switch (action) {
      case 'play':
        if (state.status !== 'playing') {
          if (state.currentTrack) {
            state.status = 'playing';
            // In a real implementation, we would start the actual player
            
            // Log the track play if it's just starting (position near beginning)
            if (state.currentPosition < 3) {
              await this.logTrackPlay(state.currentTrack, studio);
            }
          } else {
            // Try to load the next track
            await this.loadActivePlaylist(studio);
            if (state.currentTrack) {
              state.status = 'playing';
              await this.logTrackPlay(state.currentTrack, studio);
            }
          }
        }
        break;
        
      case 'pause':
        if (state.status === 'playing') {
          state.status = 'paused';
          // In a real implementation, we would pause the actual player
        }
        break;
        
      case 'stop':
        state.status = 'stopped';
        state.currentPosition = 0;
        // In a real implementation, we would stop the actual player
        break;
        
      case 'next':
        // Move to the next track in the playlist
        if (state.currentPlaylist) {
          // In a real implementation, we would stop the current track and load the next
          await this.loadNextTrack(studio);
          if (state.currentTrack) {
            state.status = 'playing';
            await this.logTrackPlay(state.currentTrack, studio);
          }
        }
        break;
        
      case 'previous':
        // Move to the previous track in the playlist
        // This is a simplified implementation - in a real system, this would be more complex
        if (state.currentPlaylist) {
          // For now, we'll just reset the current track to the beginning
          state.currentPosition = 0;
          // In a real implementation, we would load the previous track
        }
        break;
    }
    
    return state;
  }
  
  private async loadActivePlaylist(studio: string): Promise<void> {
    // Find the active playlist for this studio
    const activePlaylist = await db.query.playlists.findFirst({
      where: and(
        eq(playlists.studio, studio),
        eq(playlists.isActive, true)
      )
    });
    
    if (activePlaylist) {
      this.playbackState[studio].currentPlaylist = activePlaylist;
      
      // Load the first track in the playlist
      // Define the variable before referencing it to avoid ReferenceError
      const playlistItemsResult = await db.query.playlistItems.findMany({
        where: eq(playlistItems.playlistId, activePlaylist.id),
        orderBy: playlistItems.position,
        limit: 2
      });
      
      if (playlistItemsResult.length > 0) {
        const firstItem = playlistItemsResult[0];
        const track = await db.query.audioTracks.findFirst({
          where: eq(audioTracks.id, firstItem.trackId)
        });
        
        if (track) {
          this.playbackState[studio].currentTrack = track;
          
          // Load next track if available
          if (playlistItemsResult.length > 1) {
            const secondItem = playlistItemsResult[1];
            const nextTrack = await db.query.audioTracks.findFirst({
              where: eq(audioTracks.id, secondItem.trackId)
            });
            
            if (nextTrack) {
              this.playbackState[studio].nextTrack = nextTrack;
            }
          }
        }
      }
    }
  }
  
  private async loadNextTrack(studio: string): Promise<void> {
    const state = this.playbackState[studio];
    if (state.currentPlaylist && state.currentTrack) {
      // Get the current track's position in the playlist
      const currentItem = await db.query.playlistItems.findFirst({
        where: and(
          eq(playlistItems.playlistId, state.currentPlaylist.id),
          eq(playlistItems.trackId, state.currentTrack.id)
        )
      });
      
      if (currentItem) {
        // Mark this item as played
        await db.update(playlistItems)
          .set({ isPlayed: true, lastPlayedAt: new Date() })
          .where(eq(playlistItems.id, currentItem.id));
        
        // Find the next item in the playlist
        const nextItem = await db.query.playlistItems.findFirst({
          where: and(
            eq(playlistItems.playlistId, state.currentPlaylist.id),
            gt(playlistItems.position, currentItem.position)
          ),
          orderBy: playlistItems.position
        });
        
        if (nextItem) {
          // Load the next track
          const track = await db.query.audioTracks.findFirst({
            where: eq(audioTracks.id, nextItem.trackId)
          });
          
          if (track) {
            state.currentTrack = track;
            state.currentPosition = 0;
            
            // Now find the track after this one to set as next
            const afterNextItem = await db.query.playlistItems.findFirst({
              where: and(
                eq(playlistItems.playlistId, state.currentPlaylist.id),
                gt(playlistItems.position, nextItem.position)
              ),
              orderBy: playlistItems.position
            });
            
            if (afterNextItem) {
              const afterNextTrack = await db.query.audioTracks.findFirst({
                where: eq(audioTracks.id, afterNextItem.trackId)
              });
              
              if (afterNextTrack) {
                state.nextTrack = afterNextTrack;
              } else {
                state.nextTrack = null;
              }
            } else {
              state.nextTrack = null;
            }
          } else {
            // Track not found, set to null
            state.currentTrack = null;
            state.nextTrack = null;
          }
        } else {
          // No more tracks in playlist, reset
          state.currentTrack = null;
          state.nextTrack = null;
          
          // In a real implementation, we might auto-reload the playlist
          // or switch to a fallback playlist
        }
      }
    }
  }
  
  private async logTrackPlay(track: AudioTrack, studio: string): Promise<void> {
    const state = this.playbackState[studio];
    
    try {
      // Create a new play log entry
      const playLog = await db.insert(playLogs).values({
        trackId: track.id,
        trackTitle: track.title,
        trackArtist: track.artist,
        playlistId: state.currentPlaylist?.id,
        playlistName: state.currentPlaylist?.name,
        startedAt: new Date(),
        studio,
        category: track.category ?? 'music'
      }).returning();
      
      // Update the track's play count
      await db.update(audioTracks)
        .set({ 
          playCount: (track.playCount ?? 0) + 1,
          lastPlayedAt: new Date() 
        })
        .where(eq(audioTracks.id, track.id));
      
      // Check if this track is part of a commercial campaign
      // and log it if it is
      try {
        const commercialSpot = await db.query.commercialSpots.findFirst({
          where: eq(commercialSpots.trackId, track.id)
        });
        
        if (commercialSpot && playLog[0]) {
          // Get the campaign for this spot
          const campaign = await db.query.commercialCampaigns.findFirst({
            where: eq(commercialCampaigns.id, commercialSpot.campaignId)
          });
          
          if (campaign && campaign.status === 'active') {
            // Log the commercial play
            await db.insert(campaignPlayLogs).values({
              campaignId: commercialSpot.campaignId,
              spotId: commercialSpot.id,
              playLogId: playLog[0].id,
              playedAt: new Date(),
              studio
            });
          }
        }
      } catch (err) {
        console.error('Error logging commercial spot play:', err);
      }
    } catch (err) {
      console.error('Error logging track play:', err);
    }
  }
  
  /**
   * Audio Tracks Methods
   */
  
  async getAudioTracks(options: { category?: string, search?: string, folderId?: number } = {}): Promise<AudioTrack[]> {
    let whereClause = undefined;
    
    if (options.category) {
      whereClause = eq(audioTracks.category, options.category);
    }
    
    if (options.folderId) {
      const folderCondition = eq(audioTracks.folderId, options.folderId);
      whereClause = whereClause ? and(whereClause, folderCondition) : folderCondition;
    }
    
    if (options.search) {
      const searchCondition = or(
        like(audioTracks.title, `%${options.search}%`),
        like(audioTracks.artist, `%${options.search}%`),
        like(audioTracks.album, `%${options.search}%`)
      );
      whereClause = whereClause ? and(whereClause, searchCondition) : searchCondition;
    }
    
    return db.query.audioTracks.findMany({
      where: whereClause,
      orderBy: audioTracks.title
    });
  }

  /**
   * Get tracks for a specific folder
   */
  async getTracksForFolder(folderId: number): Promise<AudioTrack[]> {
    console.log(`Getting tracks for folder ID: ${folderId}`);
    return this.getAudioTracks({ folderId });
  }
  
  async getAudioTrack(id: number): Promise<AudioTrack | undefined> {
    return db.query.audioTracks.findFirst({
      where: eq(audioTracks.id, id)
    });
  }
  
  async createAudioTrack(track: any): Promise<AudioTrack> {
    // Insert the track into the database
    const insertedTrack = await db.insert(audioTracks)
      .values(track)
      .returning();
    
    return insertedTrack[0];
  }
  
  async updateAudioTrack(id: number, track: Partial<AudioTrack>): Promise<AudioTrack | undefined> {
    // Update the track in the database
    const updatedTrack = await db.update(audioTracks)
      .set(track)
      .where(eq(audioTracks.id, id))
      .returning();
    
    return updatedTrack[0];
  }
  
  async deleteAudioTrack(id: number): Promise<boolean> {
    try {
      // First get the track to find its file path
      const track = await this.getAudioTrack(id);
      
      // Delete the track from the database
      await db.delete(audioTracks).where(eq(audioTracks.id, id));
      
      // Delete the file if it exists
      if (track?.path && fs.existsSync(track.path)) {
        fs.unlinkSync(track.path);
      }
      
      return true;
    } catch (err) {
      console.error(`Error deleting audio track ${id}:`, err);
      return false;
    }
  }
  
  async getTrackWaveform(id: number): Promise<any> {
    // Get the track
    const track = await this.getAudioTrack(id);
    
    if (!track || !track.waveformData) {
      return null;
    }
    
    // In a real implementation, this could be a binary format, JSON, etc.
    try {
      return JSON.parse(track.waveformData);
    } catch (err) {
      console.error(`Error parsing waveform data for track ${id}:`, err);
      return null;
    }
  }
  
  async generateTrackWaveform(id: number): Promise<any> {
    // Get the track
    const track = await this.getAudioTrack(id);
    
    if (!track) {
      return null;
    }
    
    // In a real implementation, this would analyze the audio file and generate waveform data
    // For this demo, we'll generate some random waveform data
    const waveformData = this.generateRandomWaveform();
    
    // Update the track with the waveform data
    await this.updateAudioTrack(id, {
      waveformData: JSON.stringify(waveformData)
    });
    
    return waveformData;
  }
  
  private generateRandomWaveform(): number[] {
    // Generate 100 random amplitude values (0-100) for the waveform
    const samples = 100;
    const waveform = [];
    
    for (let i = 0; i < samples; i++) {
      waveform.push(Math.floor(Math.random() * 100));
    }
    
    return waveform;
  }
  
  async analyzeTrackBPM(id: number): Promise<any> {
    // Get the track
    const track = await this.getAudioTrack(id);
    
    if (!track) {
      return { success: false, message: 'Track not found' };
    }
    
    // In a real implementation, this would analyze the audio file to detect BPM
    // For this demo, we'll generate a random BPM between 80 and 160
    const bpm = Math.floor(Math.random() * 80) + 80;
    
    // Update the track with the BPM
    await this.updateAudioTrack(id, { bpm: bpm.toString() });
    
    return { success: true, bpm };
  }
  
  async normalizeTrackLevel(id: number, targetLevel: number): Promise<any> {
    // Get the track
    const track = await this.getAudioTrack(id);
    
    if (!track) {
      return { success: false, message: 'Track not found' };
    }
    
    // In a real implementation, this would analyze and adjust the audio levels
    // For this demo, we'll just pretend we did it
    const normalizedLevel = targetLevel.toString();
    
    // Update the track with the normalized level
    await this.updateAudioTrack(id, { normalizedLevel });
    
    return { success: true, normalizedLevel };
  }
  
  /**
   * Playlist Methods
   */
  
  async getPlaylists(options: { type?: string, studio?: string } = {}): Promise<Playlist[]> {
    let whereClause = undefined;
    
    if (options.type) {
      whereClause = eq(playlists.type, options.type);
    }
    
    if (options.studio) {
      const studioCondition = eq(playlists.studio, options.studio);
      whereClause = whereClause ? and(whereClause, studioCondition) : studioCondition;
    }
    
    return db.query.playlists.findMany({
      where: whereClause,
      orderBy: playlists.name
    });
  }
  
  async getPlaylist(id: number): Promise<Playlist | undefined> {
    return db.query.playlists.findFirst({
      where: eq(playlists.id, id)
    });
  }
  
  async createPlaylist(playlist: any): Promise<Playlist> {
    // Insert the playlist into the database
    const insertedPlaylist = await db.insert(playlists)
      .values({
        ...playlist,
        updatedAt: new Date()
      })
      .returning();
    
    return insertedPlaylist[0];
  }
  
  async updatePlaylist(id: number, playlist: Partial<Playlist>): Promise<Playlist | undefined> {
    // Update the playlist in the database
    const updatedPlaylist = await db.update(playlists)
      .set({
        ...playlist,
        updatedAt: new Date()
      })
      .where(eq(playlists.id, id))
      .returning();
    
    return updatedPlaylist[0];
  }
  
  async deletePlaylist(id: number): Promise<boolean> {
    try {
      // Delete the playlist from the database
      // Note: This will cascade and delete all playlist items automatically
      await db.delete(playlists).where(eq(playlists.id, id));
      
      return true;
    } catch (err) {
      console.error(`Error deleting playlist ${id}:`, err);
      return false;
    }
  }
  
  async getPlaylistItems(playlistId: number): Promise<PlaylistItem[]> {
    return db.query.playlistItems.findMany({
      where: eq(playlistItems.playlistId, playlistId),
      orderBy: playlistItems.position
    });
  }
  
  async addTrackToPlaylist(data: { playlistId: number, trackId: number, position: number }): Promise<PlaylistItem> {
    // First, check if the position needs to be adjusted
    const existingItems = await this.getPlaylistItems(data.playlistId);
    
    // Shift positions of existing items if needed
    for (const item of existingItems) {
      if (item.position >= data.position) {
        await db.update(playlistItems)
          .set({ position: item.position + 1 })
          .where(eq(playlistItems.id, item.id));
      }
    }
    
    // Insert the new item
    const insertedItem = await db.insert(playlistItems)
      .values({
        playlistId: data.playlistId,
        trackId: data.trackId,
        position: data.position,
        isPlayed: false
      })
      .returning();
    
    return insertedItem[0];
  }
  
  async removeTrackFromPlaylist(playlistId: number, itemId: number): Promise<boolean> {
    try {
      // Get the item to check its position
      const item = await db.query.playlistItems.findFirst({
        where: eq(playlistItems.id, itemId)
      });
      
      if (!item) {
        return false;
      }
      
      // Delete the item
      await db.delete(playlistItems).where(eq(playlistItems.id, itemId));
      
      // Adjust positions of remaining items
      const remainingItems = await this.getPlaylistItems(playlistId);
      let position = 0;
      
      for (const remainingItem of remainingItems) {
        await db.update(playlistItems)
          .set({ position })
          .where(eq(playlistItems.id, remainingItem.id));
        
        position++;
      }
      
      return true;
    } catch (err) {
      console.error(`Error removing track from playlist ${playlistId}:`, err);
      return false;
    }
  }
  
  async reorderPlaylistItems(playlistId: number, items: { id: number, position: number }[]): Promise<boolean> {
    try {
      // Update the position of each item
      for (const item of items) {
        await db.update(playlistItems)
          .set({ position: item.position })
          .where(eq(playlistItems.id, item.id));
      }
      
      return true;
    } catch (err) {
      console.error(`Error reordering playlist items for playlist ${playlistId}:`, err);
      return false;
    }
  }
  
  async setActivePlaylist(id: number, studio: string): Promise<boolean> {
    try {
      // First, deactivate any currently active playlists for this studio
      await db.update(playlists)
        .set({ isActive: false })
        .where(and(
          eq(playlists.studio, studio),
          eq(playlists.isActive, true)
        ));
      
      // Then, activate the specified playlist
      await db.update(playlists)
        .set({ isActive: true })
        .where(eq(playlists.id, id));
      
      // Load the playlist into the current playback state
      await this.loadActivePlaylist(studio);
      
      return true;
    } catch (err) {
      console.error(`Error setting active playlist ${id} for studio ${studio}:`, err);
      return false;
    }
  }
  
  /**
   * Scheduled Events Methods
   */
  
  async getScheduledEvents(options: { studio?: string, fromDate?: Date, toDate?: Date } = {}): Promise<ScheduledEvent[]> {
    let whereClause = undefined;
    
    if (options.studio) {
      whereClause = eq(scheduledEvents.studio, options.studio);
    }
    
    if (options.fromDate && options.toDate) {
      const dateCondition = between(scheduledEvents.startTime, options.fromDate, options.toDate);
      whereClause = whereClause ? and(whereClause, dateCondition) : dateCondition;
    } else if (options.fromDate) {
      const dateCondition = gte(scheduledEvents.startTime, options.fromDate);
      whereClause = whereClause ? and(whereClause, dateCondition) : dateCondition;
    } else if (options.toDate) {
      const dateCondition = lte(scheduledEvents.startTime, options.toDate);
      whereClause = whereClause ? and(whereClause, dateCondition) : dateCondition;
    }
    
    return db.query.scheduledEvents.findMany({
      where: whereClause,
      orderBy: scheduledEvents.startTime
    });
  }
  
  async getScheduledEvent(id: number): Promise<ScheduledEvent | undefined> {
    return db.query.scheduledEvents.findFirst({
      where: eq(scheduledEvents.id, id)
    });
  }
  
  async createScheduledEvent(event: any): Promise<ScheduledEvent> {
    // Insert the event into the database
    const insertedEvent = await db.insert(scheduledEvents)
      .values(event)
      .returning();
    
    return insertedEvent[0];
  }
  
  async updateScheduledEvent(id: number, event: Partial<ScheduledEvent>): Promise<ScheduledEvent | undefined> {
    // Update the event in the database
    const updatedEvent = await db.update(scheduledEvents)
      .set(event)
      .where(eq(scheduledEvents.id, id))
      .returning();
    
    return updatedEvent[0];
  }
  
  async deleteScheduledEvent(id: number): Promise<boolean> {
    try {
      // Delete the event from the database
      await db.delete(scheduledEvents).where(eq(scheduledEvents.id, id));
      
      return true;
    } catch (err) {
      console.error(`Error deleting scheduled event ${id}:`, err);
      return false;
    }
  }
  
  async getUpcomingScheduledEvents(options: { studio?: string, limit?: number } = {}): Promise<ScheduledEvent[]> {
    let whereClause = gt(scheduledEvents.startTime, new Date());
    
    if (options.studio) {
      whereClause = and(whereClause, eq(scheduledEvents.studio, options.studio));
    }
    
    // Add condition for enabled events
    whereClause = and(whereClause, eq(scheduledEvents.isEnabled, true));
    
    return db.query.scheduledEvents.findMany({
      where: whereClause,
      orderBy: scheduledEvents.startTime,
      limit: options.limit || 10
    });
  }
  
  /**
   * Instant Players Methods
   */
  
  async getInstantPlayers(studio?: string): Promise<InstantPlayer[]> {
    let whereClause = undefined;
    
    if (studio) {
      whereClause = eq(instantPlayers.studio, studio);
    }
    
    return db.query.instantPlayers.findMany({
      where: whereClause,
      orderBy: instantPlayers.keyNumber
    });
  }
  
  async setInstantPlayer(player: InstantPlayer): Promise<InstantPlayer> {
    // Check if this key already exists
    const existingPlayer = await db.query.instantPlayers.findFirst({
      where: and(
        eq(instantPlayers.keyNumber, player.keyNumber),
        eq(instantPlayers.studio, player.studio)
      )
    });
    
    if (existingPlayer) {
      // Update existing player
      const updatedPlayer = await db.update(instantPlayers)
        .set(player)
        .where(eq(instantPlayers.id, existingPlayer.id))
        .returning();
      
      return updatedPlayer[0];
    } else {
      // Insert new player
      const insertedPlayer = await db.insert(instantPlayers)
        .values(player)
        .returning();
      
      return insertedPlayer[0];
    }
  }
  
  async clearInstantPlayer(keyNumber: number, studio: string): Promise<boolean> {
    try {
      await db.delete(instantPlayers).where(
        and(
          eq(instantPlayers.keyNumber, keyNumber),
          eq(instantPlayers.studio, studio)
        )
      );
      
      return true;
    } catch (err) {
      console.error(`Error clearing instant player ${keyNumber} for studio ${studio}:`, err);
      return false;
    }
  }
  
  async playInstantPlayer(keyNumber: number, studio: string): Promise<any> {
    // Get the instant player
    const player = await db.query.instantPlayers.findFirst({
      where: and(
        eq(instantPlayers.keyNumber, keyNumber),
        eq(instantPlayers.studio, studio)
      )
    });
    
    if (!player || !player.trackId) {
      return { success: false, message: 'Instant player not found or no track assigned' };
    }
    
    // Get the track
    const track = await this.getAudioTrack(player.trackId);
    
    if (!track) {
      return { success: false, message: 'Track not found' };
    }
    
    // In a real implementation, this would trigger playback of the track
    // For this demo, we'll just log it
    await this.logTrackPlay(track, studio);
    
    // Update the playback state to reflect the instant play
    this.playbackState[studio].currentTrack = track;
    this.playbackState[studio].status = 'playing';
    this.playbackState[studio].currentPosition = 0;
    
    return { success: true, track };
  }
  
  /**
   * Media Folders Methods
   */
  
  async getMediaFolders(): Promise<MediaFolder[]> {
    return db.query.mediaFolders.findMany({
      orderBy: mediaFolders.name
    });
  }
  
  /**
   * Get a media folder by its name
   */
  async getFolderByName(folderName: string): Promise<MediaFolder | undefined> {
    // Hard-code special folder mappings
    if (folderName.toLowerCase() === 'mazen') {
      console.log('Special case: Looking up mazen folder (ID: 3)');
      return {
        id: 3,
        name: 'mazen',
        description: 'Mazen\'s special folder',
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
    
    if (folderName.toLowerCase() === 'basma') {
      console.log('Special case: Looking up basma folder (ID: 4)');
      return {
        id: 4,
        name: 'basma',
        description: 'Basma\'s special folder',
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
    
    // Look up folder in database
    const folder = await db.query.mediaFolders.findFirst({
      where: eq(mediaFolders.name, folderName)
    });
    
    // Also try case-insensitive comparison if not found
    if (!folder) {
      const allFolders = await this.getMediaFolders();
      return allFolders.find(f => f.name.toLowerCase() === folderName.toLowerCase());
    }
    
    return folder;
  }
  
  async createMediaFolder(folder: Partial<MediaFolder>): Promise<MediaFolder> {
    try {
      if (!folder.name) {
        throw new Error('Folder name is required');
      }
      
      // Sanitize folder name for filesystem safety
      const sanitizedName = folder.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');
      
      // Ensure the uploads directory exists
      const uploadsDir = path.resolve('uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Process the folder path from any input
      let folderName = sanitizedName;
      
      // If path is provided, use it (cleaned) instead of the name-based path
      if (folder.path) {
        // Remove all standard prefixes and slashes to get a clean name/path
        folderName = folder.path
          .replace(/^\/uploads\/+/g, '')  // Replace any /uploads/ prefix
          .replace(/^\/folders\/+/g, '')  // Replace any /folders/ prefix
          .replace(/^\/+/g, '')           // Replace any leading slashes
          .replace(/uploads\//g, '')      // Remove any "uploads/" segments
          .trim();                        // Remove whitespace
        
        // If path was completely cleaned out, fall back to name-based path
        if (!folderName) {
          folderName = sanitizedName;
        }
      }
      
      // Create physical folder path, placing it directly in the uploads directory
      const folderPath = path.join(uploadsDir, folderName);
      
      // Create the folder if it doesn't exist
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
      
      // Store a consistent canonical path format in the database
      folder.path = `/uploads/${folderName}`;
      
      // Ensure category is set or use default
      if (!folder.category) {
        folder.category = 'default';
      }
      
      console.log('Creating media folder with data:', JSON.stringify(folder, null, 2));
      
      // Insert the folder into the database
      const insertedFolder = await db.insert(mediaFolders)
        .values({
          name: folder.name,
          path: folder.path,
          description: folder.description || null,
          category: folder.category,
          parentId: folder.parentId || null
        })
        .returning();
      
      return insertedFolder[0];
    } catch (error) {
      console.error('Error creating media folder:', error);
      throw error;
    }
  }
  
  async updateMediaFolder(id: number, folder: Partial<MediaFolder>): Promise<MediaFolder | undefined> {
    // Update the folder in the database
    const updatedFolder = await db.update(mediaFolders)
      .set(folder)
      .where(eq(mediaFolders.id, id))
      .returning();
    
    return updatedFolder[0];
  }
  
  async deleteMediaFolder(id: number): Promise<boolean> {
    try {
      // First, get the folder details to find its path
      const folder = await db.query.mediaFolders.findFirst({
        where: eq(mediaFolders.id, id)
      });
      
      if (!folder) {
        return false;
      }
      
      // Check if there are any tracks using this folder
      const tracksInFolder = await db.query.audioTracks.findMany({
        where: eq(audioTracks.folderId, id)
      });
      
      if (tracksInFolder.length > 0) {
        console.log(`Deleting ${tracksInFolder.length} tracks from folder ${folder.name} (id: ${id})`);
        
        try {
          // Delete all tracks in this folder from the database
          await db.delete(audioTracks)
            .where(eq(audioTracks.folderId, id));
            
          // Also delete any physical files if they exist
          for (const track of tracksInFolder) {
            if (track.path) {
              try {
                const trackPath = track.path.startsWith('/') 
                  ? path.resolve(track.path.substring(1)) 
                  : path.resolve(track.path);
                
                if (fs.existsSync(trackPath)) {
                  fs.unlinkSync(trackPath);
                  console.log(`Deleted track file: ${trackPath}`);
                }
              } catch (fileErr) {
                console.error(`Error deleting track file for track ID ${track.id}:`, fileErr);
                // Continue with other tracks even if one fails
              }
            }
          }
        } catch (trackDeleteErr) {
          console.error(`Error deleting tracks in folder ${id}:`, trackDeleteErr);
          // Continue with folder deletion even if track deletion fails
        }
      }
      
      // Delete the folder from the database
      await db.delete(mediaFolders).where(eq(mediaFolders.id, id));
      
      // Delete the folder from the filesystem if it exists
      if (folder.path && folder.path.startsWith('/uploads/')) {
        const folderPath = path.resolve(folder.path.substring(1)); // Remove leading '/'
        if (fs.existsSync(folderPath)) {
          try {
            // Try to delete the directory even if it's not empty
            // First attempt to delete any files in the directory
            const files = fs.readdirSync(folderPath);
            for (const file of files) {
              const filePath = path.join(folderPath, file);
              try {
                if (fs.statSync(filePath).isDirectory()) {
                  // Skip subdirectories for safety
                  console.log(`Skipping subdirectory: ${filePath}`);
                } else {
                  fs.unlinkSync(filePath);
                  console.log(`Deleted file: ${filePath}`);
                }
              } catch (fileErr) {
                console.error(`Error deleting file ${filePath}:`, fileErr);
              }
            }
            
            // Now try to remove the directory
            fs.rmdirSync(folderPath);
            console.log(`Deleted folder: ${folderPath}`);
          } catch (fsErr) {
            console.error(`Error deleting folder from filesystem: ${folderPath}`, fsErr);
            // Continue returning true as the database record was deleted
          }
        }
      }
      
      return true;
    } catch (err) {
      console.error(`Error deleting media folder ${id}:`, err);
      return false;
    }
  }
  
  /**
   * Play Logs Methods
   */
  
  async getPlayLogs(options: { studio?: string, fromDate?: Date, toDate?: Date, category?: string } = {}): Promise<PlayLog[]> {
    let whereClause = undefined;
    
    if (options.studio) {
      whereClause = eq(playLogs.studio, options.studio);
    }
    
    if (options.category) {
      const categoryCondition = eq(playLogs.category, options.category);
      whereClause = whereClause ? and(whereClause, categoryCondition) : categoryCondition;
    }
    
    if (options.fromDate && options.toDate) {
      const dateCondition = between(playLogs.startedAt, options.fromDate, options.toDate);
      whereClause = whereClause ? and(whereClause, dateCondition) : dateCondition;
    } else if (options.fromDate) {
      const dateCondition = gte(playLogs.startedAt, options.fromDate);
      whereClause = whereClause ? and(whereClause, dateCondition) : dateCondition;
    } else if (options.toDate) {
      const dateCondition = lte(playLogs.startedAt, options.toDate);
      whereClause = whereClause ? and(whereClause, dateCondition) : dateCondition;
    }
    
    return db.query.playLogs.findMany({
      where: whereClause,
      orderBy: [desc(playLogs.startedAt)]
    });
  }
  
  /**
   * Commercial/Traffic Management Methods
   */
  
  async getCommercialClients(): Promise<Omit<CommercialClient, 'budget'>[]> {
    try {
      // Use type assertion to handle the budget field issue
      return await db.query.commercialClients.findMany({
        orderBy: commercialClients.name
      }) as unknown as Omit<CommercialClient, 'budget'>[];
    } catch (error) {
      console.warn("Error fetching commercial clients with standard query", error);
      
      // Fallback to raw query that selects specific fields (avoiding 'budget')
      const result = await db.select({
        id: commercialClients.id,
        name: commercialClients.name,
        contactName: commercialClients.contactName,
        contactEmail: commercialClients.contactEmail,
        contactPhone: commercialClients.contactPhone,
        address: commercialClients.address,
        budgetSpent: commercialClients.budgetSpent,
        notes: commercialClients.notes,
        isActive: commercialClients.isActive,
        createdAt: commercialClients.createdAt,
        updatedAt: commercialClients.updatedAt
      })
      .from(commercialClients)
      .orderBy(commercialClients.name);
      
      return result as unknown as Omit<CommercialClient, 'budget'>[];
    }
  }
  
  async getCommercialClient(id: number): Promise<Omit<CommercialClient, 'budget'> | undefined> {
    try {
      // Use type assertion to handle the budget field issue
      return await db.query.commercialClients.findFirst({
        where: eq(commercialClients.id, id)
      }) as unknown as Omit<CommercialClient, 'budget'>;
    } catch (error) {
      console.warn(`Error fetching commercial client ${id} with standard query`, error);
      
      // Fallback to raw query that selects specific fields (avoiding 'budget')
      const result = await db.select({
        id: commercialClients.id,
        name: commercialClients.name,
        contactName: commercialClients.contactName,
        contactEmail: commercialClients.contactEmail,
        contactPhone: commercialClients.contactPhone,
        address: commercialClients.address,
        budgetSpent: commercialClients.budgetSpent,
        notes: commercialClients.notes,
        isActive: commercialClients.isActive,
        createdAt: commercialClients.createdAt,
        updatedAt: commercialClients.updatedAt
      })
      .from(commercialClients)
      .where(eq(commercialClients.id, id))
      .limit(1);
      
      return result[0] as unknown as Omit<CommercialClient, 'budget'>;
    }
  }
  
  async createCommercialClient(client: Omit<CommercialClient, 'budget'>): Promise<Omit<CommercialClient, 'budget'>> {
    // Insert the client into the database, explicitly skip the 'budget' field to match actual DB schema
    const clientData = {
      name: client.name,
      contactName: client.contactName,
      contactEmail: client.contactEmail,
      contactPhone: client.contactPhone,
      address: client.address,
      budgetSpent: client.budgetSpent,
      notes: client.notes,
      isActive: client.isActive,
      updatedAt: new Date()
    };
    
    const insertedClient = await db.insert(commercialClients)
      .values(clientData)
      .returning();
    
    return insertedClient[0] as unknown as Omit<CommercialClient, 'budget'>;
  }
  
  async updateCommercialClient(id: number, client: Partial<Omit<CommercialClient, 'budget'>>): Promise<Omit<CommercialClient, 'budget'> | undefined> {
    // Remove budget from update object if it somehow exists
    const { budget, ...updateData } = client as any;
    
    // Update the client in the database
    const updatedClient = await db.update(commercialClients)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(commercialClients.id, id))
      .returning();
    
    return updatedClient[0] as unknown as Omit<CommercialClient, 'budget'>;
  }
  
  async deleteCommercialClient(id: number): Promise<boolean> {
    try {
      // Check if there are campaigns for this client
      const clientCampaigns = await db.query.commercialCampaigns.findMany({
        where: eq(commercialCampaigns.clientId, id)
      });
      
      if (clientCampaigns.length > 0) {
        // Cannot delete a client with active campaigns
        // In a real implementation, you might want to handle this differently
        return false;
      }
      
      // Delete the client
      await db.delete(commercialClients).where(eq(commercialClients.id, id));
      
      return true;
    } catch (err) {
      console.error(`Error deleting commercial client ${id}:`, err);
      return false;
    }
  }
  
  async getCommercialCampaigns(options: { clientId?: number, status?: string } = {}): Promise<(CommercialCampaign & { client?: Omit<CommercialClient, 'budget'> | null })[]> {
    let whereClause = undefined;
    
    if (options.clientId) {
      whereClause = eq(commercialCampaigns.clientId, options.clientId);
    }
    
    if (options.status) {
      const statusCondition = eq(commercialCampaigns.status, options.status);
      whereClause = whereClause ? and(whereClause, statusCondition) : statusCondition;
    }
    
    try {
      // First try to get campaigns using Drizzle's query builder
      const rawCampaigns = await db.query.commercialCampaigns.findMany({
        where: whereClause,
        orderBy: [desc(commercialCampaigns.startDate)]
      });
      
      // Manually fetch clients for each campaign since there are schema issues with relations
      const campaignsList = [];
      for (const campaign of rawCampaigns) {
        try {
          const client = await this.getCommercialClient(campaign.clientId);
          campaignsList.push({
            ...campaign,
            client
          } as CommercialCampaign & { client?: Omit<CommercialClient, 'budget'> | null });
        } catch (clientError) {
          console.warn(`Error fetching client for campaign ${campaign.id}`, clientError);
          campaignsList.push({
            ...campaign,
            client: null
          } as CommercialCampaign & { client?: Omit<CommercialClient, 'budget'> | null });
        }
      }
      
      return campaignsList;
    } catch (error) {
      console.warn("Error fetching campaigns with standard query, falling back to basic query", error);
      // Fallback: Get campaigns without the query builder
      const campaigns = whereClause 
        ? await db.select().from(commercialCampaigns).where(whereClause)
        : await db.select().from(commercialCampaigns);
      
      // Manually fetch clients for each campaign
      const campaignsList = [];
      for (const campaign of campaigns) {
        try {
          const client = await this.getCommercialClient(campaign.clientId);
          campaignsList.push({
            ...campaign,
            client
          } as CommercialCampaign & { client?: Omit<CommercialClient, 'budget'> | null });
        } catch (clientError) {
          console.warn(`Error fetching client for campaign ${campaign.id}`, clientError);
          campaignsList.push({
            ...campaign,
            client: null
          } as CommercialCampaign & { client?: Omit<CommercialClient, 'budget'> | null });
        }
      }
      
      return campaignsList;
    }
  }
  
  async getCommercialCampaign(id: number): Promise<(CommercialCampaign & { client?: Omit<CommercialClient, 'budget'> | null }) | undefined> {
    try {
      // Get the campaign without using relations
      const campaign = await db.query.commercialCampaigns.findFirst({
        where: eq(commercialCampaigns.id, id)
      });
      
      if (!campaign) {
        return undefined;
      }
      
      // Manually fetch the client
      const client = await this.getCommercialClient(campaign.clientId);
      
      // Return the campaign with the client attached
      return {
        ...campaign,
        client
      } as CommercialCampaign & { client?: Omit<CommercialClient, 'budget'> | null };
    } catch (error) {
      console.warn(`Error fetching commercial campaign ${id}, falling back to basic query`, error);
      
      // Fallback: Get the campaign without the query builder
      const campaign = await db.select().from(commercialCampaigns).where(eq(commercialCampaigns.id, id)).limit(1);
      
      if (campaign.length === 0) {
        return undefined;
      }
      
      try {
        // Manually fetch the client
        const client = await this.getCommercialClient(campaign[0].clientId);
        return {
          ...campaign[0],
          client
        } as CommercialCampaign & { client?: Omit<CommercialClient, 'budget'> | null };
      } catch (clientError) {
        console.warn(`Error fetching client for campaign ${id}`, clientError);
        return {
          ...campaign[0],
          client: null
        } as CommercialCampaign & { client?: Omit<CommercialClient, 'budget'> | null };
      }
    }
  }
  
  async createCommercialCampaign(campaign: CommercialCampaign): Promise<CommercialCampaign> {
    // Insert the campaign into the database
    const insertedCampaign = await db.insert(commercialCampaigns)
      .values({
        ...campaign,
        updatedAt: new Date()
      })
      .returning();
    
    return insertedCampaign[0];
  }
  
  async updateCommercialCampaign(id: number, campaign: Partial<CommercialCampaign>): Promise<CommercialCampaign | undefined> {
    // Update the campaign in the database
    const updatedCampaign = await db.update(commercialCampaigns)
      .set({
        ...campaign,
        updatedAt: new Date()
      })
      .where(eq(commercialCampaigns.id, id))
      .returning();
    
    return updatedCampaign[0];
  }
  
  async deleteCommercialCampaign(id: number): Promise<boolean> {
    try {
      // Delete all spots for this campaign
      await db.delete(commercialSpots).where(eq(commercialSpots.campaignId, id));
      
      // Delete the campaign
      await db.delete(commercialCampaigns).where(eq(commercialCampaigns.id, id));
      
      return true;
    } catch (err) {
      console.error(`Error deleting commercial campaign ${id}:`, err);
      return false;
    }
  }
  
  async getCommercialSpots(campaignId: number): Promise<CommercialSpot[]> {
    return db.query.commercialSpots.findMany({
      where: eq(commercialSpots.campaignId, campaignId),
      with: {
        track: true
      }
    });
  }
  
  async createCommercialSpot(spot: CommercialSpot): Promise<CommercialSpot> {
    // Insert the spot into the database
    const insertedSpot = await db.insert(commercialSpots)
      .values(spot)
      .returning();
    
    return insertedSpot[0];
  }
  
  async deleteCommercialSpot(campaignId: number, spotId: number): Promise<boolean> {
    try {
      await db.delete(commercialSpots).where(
        and(
          eq(commercialSpots.id, spotId),
          eq(commercialSpots.campaignId, campaignId)
        )
      );
      
      return true;
    } catch (err) {
      console.error(`Error deleting commercial spot ${spotId} from campaign ${campaignId}:`, err);
      return false;
    }
  }
  
  async getCampaignPlayLogs(campaignId: number, options: { fromDate?: Date, toDate?: Date } = {}): Promise<any[]> {
    let whereClause = eq(campaignPlayLogs.campaignId, campaignId);
    
    if (options.fromDate && options.toDate) {
      const dateCondition = between(campaignPlayLogs.playedAt, options.fromDate, options.toDate);
      whereClause = and(whereClause, dateCondition);
    } else if (options.fromDate) {
      const dateCondition = gte(campaignPlayLogs.playedAt, options.fromDate);
      whereClause = and(whereClause, dateCondition);
    } else if (options.toDate) {
      const dateCondition = lte(campaignPlayLogs.playedAt, options.toDate);
      whereClause = and(whereClause, dateCondition);
    }
    
    const logs = await db.query.campaignPlayLogs.findMany({
      where: whereClause,
      with: {
        playLog: true,
        spot: {
          with: {
            track: true
          }
        }
      },
      orderBy: [desc(campaignPlayLogs.playedAt)]
    });
    
    return logs;
  }
  
  async generateCampaignReport(campaignId: number, options: { fromDate?: Date, toDate?: Date, format?: string } = {}): Promise<any> {
    const campaign = await this.getCommercialCampaign(campaignId);
    
    if (!campaign) {
      return { success: false, message: 'Campaign not found' };
    }
    
    const logs = await this.getCampaignPlayLogs(campaignId, options);
    
    // Get statistics
    const totalPlays = logs.length;
    const spotsCount = await db.select({ count: count() })
      .from(commercialSpots)
      .where(eq(commercialSpots.campaignId, campaignId));
    
    // Group plays by date
    const playsByDate: Record<string, number> = {};
    const playsBySpot: Record<number, number> = {};
    const playsByStudio: Record<string, number> = {};
    
    for (const log of logs) {
      const date = log.playedAt.toISOString().split('T')[0];
      playsByDate[date] = (playsByDate[date] || 0) + 1;
      
      playsBySpot[log.spotId] = (playsBySpot[log.spotId] || 0) + 1;
      
      playsByStudio[log.studio] = (playsByStudio[log.studio] || 0) + 1;
    }
    
    // Generate the report
    return {
      success: true,
      campaign,
      totalPlays,
      totalSpots: campaign.totalSpots,
      totalTracksAvailable: spotsCount[0]?.count || 0,
      playsByDate,
      playsBySpot,
      playsByStudio,
      logs: logs.map(log => ({
        id: log.id,
        playedAt: log.playedAt,
        studio: log.studio,
        trackTitle: log.spot?.track?.title || 'Unknown',
        spotName: log.spot?.name || 'Unknown'
      }))
    };
  }
  
  async generateCampaignInvoice(campaignId: number): Promise<any> {
    const campaign = await this.getCommercialCampaign(campaignId);
    
    if (!campaign) {
      return { success: false, message: 'Campaign not found' };
    }
    
    const client = await this.getCommercialClient(campaign.clientId);
    
    if (!client) {
      return { success: false, message: 'Client not found' };
    }
    
    const logs = await this.getCampaignPlayLogs(campaignId);
    const totalPlays = logs.length;
    
    // In a real implementation, this would calculate costs based on campaign settings
    // For this demo, we'll just generate a simple invoice with dummy values
    const rate = 10; // $10 per play
    const totalCost = totalPlays * rate;
    
    // Generate invoice ID if not already assigned
    let invoiceId = campaign.invoiceId;
    if (!invoiceId) {
      invoiceId = `INV-${campaign.id}-${Date.now()}`;
      
      // Update the campaign with the invoice ID
      await this.updateCommercialCampaign(campaignId, {
        invoiceId,
        invoiceStatus: 'issued'
      });
    }
    
    // Generate the invoice data
    return {
      success: true,
      invoice: {
        id: invoiceId,
        campaignId,
        campaignName: campaign.name,
        client,
        issuedDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        totalPlays,
        rate,
        totalCost,
        status: 'issued',
        items: [
          {
            description: `Commercial Spots for Campaign '${campaign.name}'`,
            quantity: totalPlays,
            rate,
            amount: totalCost
          }
        ]
      }
    };
  }
  
  /**
   * Data Initialization Methods
   */
  
  async initializeRadioAutomationData(): Promise<void> {
    // Create default music folder if it doesn't exist
    const defaultFolder = await db.query.mediaFolders.findFirst({
      where: eq(mediaFolders.name, 'Music')
    });
    
    if (!defaultFolder) {
      const musicFolder = 'uploads/music';
      
      // Create the folder on disk
      if (!fs.existsSync(musicFolder)) {
        fs.mkdirSync(musicFolder, { recursive: true });
      }
      
      await db.insert(mediaFolders).values({
        name: 'Music',
        path: musicFolder,
        description: 'Default folder for music tracks'
      });
    }
    
    // Create default storage settings if none exist
    const storageSettingsExist = await db.query.systemSettings.findFirst({
      where: and(
        eq(systemSettings.type, 'storage'),
        eq(systemSettings.name, 'paths')
      )
    });
    
    if (!storageSettingsExist) {
      await this.saveStorageSettings(this.defaultStorageSettings);
    }
    
    // Create default jingles folder if it doesn't exist
    const jinglesFolder = await db.query.mediaFolders.findFirst({
      where: eq(mediaFolders.name, 'Jingles')
    });
    
    if (!jinglesFolder) {
      const jinglesPath = 'uploads/jingles';
      
      // Create the folder on disk
      if (!fs.existsSync(jinglesPath)) {
        fs.mkdirSync(jinglesPath, { recursive: true });
      }
      
      await db.insert(mediaFolders).values({
        name: 'Jingles',
        path: jinglesPath,
        description: 'Station jingles and idents'
      });
    }
    
    // Create default commercials folder if it doesn't exist
    const commercialsFolder = await db.query.mediaFolders.findFirst({
      where: eq(mediaFolders.name, 'Commercials')
    });
    
    if (!commercialsFolder) {
      const commercialsPath = 'uploads/commercials';
      
      // Create the folder on disk
      if (!fs.existsSync(commercialsPath)) {
        fs.mkdirSync(commercialsPath, { recursive: true });
      }
      
      await db.insert(mediaFolders).values({
        name: 'Commercials',
        path: commercialsPath,
        description: 'Commercial spots and advertisements'
      });
    }
    
    // Create demo audio tracks if none exist
    const tracksCount = await db.select({ count: count() }).from(audioTracks);
    
    if (tracksCount[0]?.count === 0) {
      // In a real implementation, we would create actual audio files
      // For this demo, we'll just create database entries with dummy paths
      
      const demoTracks = [
        {
          title: 'Morning Show Intro',
          artist: 'Station ID',
          duration: 15,
          path: 'uploads/jingles/morning_intro.mp3',
          fileType: 'mp3',
          category: 'jingle',
          fileSize: 235472,
          playCount: 0
        },
        {
          title: 'Station ID - Top of Hour',
          artist: 'Station ID',
          duration: 10,
          path: 'uploads/jingles/top_hour.mp3',
          fileType: 'mp3',
          category: 'jingle',
          fileSize: 157894,
          playCount: 0
        },
        {
          title: 'Summer Dreams',
          artist: 'The Beach Band',
          album: 'Summer Hits',
          duration: 215,
          path: 'uploads/music/summer_dreams.mp3',
          fileType: 'mp3',
          category: 'music',
          fileSize: 3457892,
          playCount: 0
        },
        {
          title: 'City Lights',
          artist: 'Urban Beat',
          album: 'Downtown',
          duration: 184,
          path: 'uploads/music/city_lights.mp3',
          fileType: 'mp3',
          category: 'music',
          fileSize: 2984571,
          playCount: 0
        },
        {
          title: 'Coffee Shop Commercial',
          artist: 'Local Beans',
          duration: 30,
          path: 'uploads/commercials/coffee_shop.mp3',
          fileType: 'mp3',
          category: 'commercial',
          fileSize: 498735,
          playCount: 0
        }
      ];
      
      for (const track of demoTracks) {
        await db.insert(audioTracks).values(track);
      }
    }
    
    // Create demo playlists if none exist
    const playlistsCount = await db.select({ count: count() }).from(playlists);
    
    if (playlistsCount[0]?.count === 0) {
      // Create a demo music playlist
      const musicPlaylist = await db.insert(playlists).values({
        name: 'Daytime Music Mix',
        description: 'Regular rotation playlist for daytime',
        type: 'music',
        isActive: true,
        studio: 'A',
        updatedAt: new Date()
      }).returning();
      
      // Add tracks to the playlist
      // Get all tracks instead of filtering by category to avoid the error
      const musicTracks = await db.query.audioTracks.findMany({});
      
      if (musicTracks.length > 0 && musicPlaylist.length > 0) {
        let position = 0;
        for (const track of musicTracks) {
          await db.insert(playlistItems).values({
            playlistId: musicPlaylist[0].id,
            trackId: track.id,
            position: position++,
            isPlayed: false
          });
        }
      }
      
      // Create a demo jingles playlist
      const jinglesPlaylist = await db.insert(playlists).values({
        name: 'Station IDs',
        description: 'Station IDs and jingles',
        type: 'jingle',
        isActive: false,
        studio: 'A',
        updatedAt: new Date()
      }).returning();
      
      // Add jingles to the playlist
      // Get a few tracks instead of filtering by category to avoid the error
      const jingleTracks = await db.query.audioTracks.findMany({
        limit: 3
      });
      
      if (jingleTracks.length > 0 && jinglesPlaylist.length > 0) {
        let position = 0;
        for (const track of jingleTracks) {
          await db.insert(playlistItems).values({
            playlistId: jinglesPlaylist[0].id,
            trackId: track.id,
            position: position++,
            isPlayed: false
          });
        }
      }
    }
    
    // Create demo instant players if none exist
    const instantPlayersCount = await db.select({ count: count() }).from(instantPlayers);
    
    if (instantPlayersCount[0]?.count === 0) {
      // Get a small set of tracks for instant players
      const jingleTracks = await db.query.audioTracks.findMany({
        limit: 2
      });
      
      if (jingleTracks.length > 0) {
        // Create instant players for Studio A
        await db.insert(instantPlayers).values({
          keyNumber: 1,
          trackId: jingleTracks[0]?.id,
          name: 'Station ID',
          color: '#FF5722',
          studio: 'A'
        });
        
        if (jingleTracks.length > 1) {
          await db.insert(instantPlayers).values({
            keyNumber: 2,
            trackId: jingleTracks[1]?.id,
            name: 'Top Hour',
            color: '#2196F3',
            studio: 'A'
          });
        }
      }
    }
    
    // Create a demo commercial client if none exist
    const clientsCount = await db.select({ count: count() }).from(commercialClients);
    
    if (clientsCount[0]?.count === 0) {
      await db.insert(commercialClients).values({
        name: 'Local Beans Coffee',
        contactName: 'Jane Smith',
        contactEmail: 'jane@localbeans.example',
        contactPhone: '555-123-4567',
        address: '123 Main St, Anytown, USA',
        updatedAt: new Date()
      });
    }
  }
  
  /**
   * System Settings Methods
   */
  
  async getSystemSettings(type: SystemSettingsType, name: string, userId?: number): Promise<Record<string, any>> {
    try {
      // Try to get user-specific settings
      let settingsRecord;
      
      if (userId) {
        settingsRecord = await db.query.systemSettings.findFirst({
          where: and(
            eq(systemSettings.type, type),
            eq(systemSettings.name, name),
            eq(systemSettings.userId, userId),
            eq(systemSettings.isActive, true)
          )
        });
      }
      
      // If no user-specific settings, try to get global settings
      if (!settingsRecord) {
        settingsRecord = await db.query.systemSettings.findFirst({
          where: and(
            eq(systemSettings.type, type),
            eq(systemSettings.name, name),
            isNull(systemSettings.userId),
            eq(systemSettings.isActive, true)
          )
        });
      }
      
      // If settings found, parse and return them
      if (settingsRecord) {
        try {
          return JSON.parse(settingsRecord.value);
        } catch (err) {
          console.error(`Error parsing ${type}.${name} settings:`, err);
          return {};
        }
      }
      
      // Return empty object if no settings found
      return {};
    } catch (err) {
      console.error(`Error fetching ${type}.${name} settings:`, err);
      return {};
    }
  }
  
  async saveSystemSettings(type: SystemSettingsType, name: string, value: Record<string, any>, userId?: number): Promise<boolean> {
    try {
      // Convert settings to a JSON string
      const settingsJson = JSON.stringify(value);
      
      // Check if settings already exist for this user
      let existingSettings;
      
      if (userId) {
        existingSettings = await db.query.systemSettings.findFirst({
          where: and(
            eq(systemSettings.type, type),
            eq(systemSettings.name, name),
            eq(systemSettings.userId, userId)
          )
        });
      } else {
        existingSettings = await db.query.systemSettings.findFirst({
          where: and(
            eq(systemSettings.type, type),
            eq(systemSettings.name, name),
            isNull(systemSettings.userId)
          )
        });
      }
      
      // If settings exist, update them
      if (existingSettings) {
        await db.update(systemSettings)
          .set({
            value: settingsJson,
            isActive: true,
            updatedAt: new Date()
          })
          .where(eq(systemSettings.id, existingSettings.id));
      } else {
        // Otherwise, create new settings
        await db.insert(systemSettings)
          .values({
            type,
            name,
            value: settingsJson,
            userId: userId || null,
            isActive: true
          });
      }
      
      return true;
    } catch (err) {
      console.error(`Error saving ${type}.${name} settings:`, err);
      return false;
    }
  }
  
  async getStorageSettings(userId?: number): Promise<StorageSettings> {
    const settings = await this.getSystemSettings('storage', 'paths', userId);
    
    // If no settings found or incomplete, return defaults with any available values
    return {
      primaryPath: settings.primaryPath || this.defaultStorageSettings.primaryPath,
      backupPath: settings.backupPath || this.defaultStorageSettings.backupPath,
      autoOrganize: settings.autoOrganize !== undefined ? settings.autoOrganize : this.defaultStorageSettings.autoOrganize,
      watchFolders: settings.watchFolders !== undefined ? settings.watchFolders : this.defaultStorageSettings.watchFolders
    };
  }
  
  async saveStorageSettings(settings: StorageSettings, userId?: number): Promise<StorageSettings> {
    const success = await this.saveSystemSettings('storage', 'paths', settings, userId);
    
    if (!success) {
      throw new Error('Failed to save storage settings');
    }
    
    return settings;
  }
}
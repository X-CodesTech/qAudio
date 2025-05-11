import { db } from "./db";
import { aiDjSettings, aiTrackAnalysis, aiGeneratedPlaylists, AiDjSettings, AiTrackAnalysis, AiGeneratedPlaylist, playlists, audioTracks, playlistItems } from "@shared/schema";
import { analyzeTrack, generateSmartPlaylist, AnalyzeTrackResult, PlaylistGenerationParams, GeneratePlaylistResult } from "./utils/openai-service";
import { eq, desc, and, inArray, or, isNull } from "drizzle-orm";

/**
 * AI DJ Storage Class
 * 
 * Handles storage and operations for the AI DJ system, including:
 * - AI DJ settings management
 * - Track analysis
 * - AI-generated playlists
 */
export class AiDjStorage {
  
  /**
   * AI DJ Settings Methods
   */
  
  // Get all AI DJ settings
  async getAiDjSettings(options: { studioId?: string } = {}): Promise<AiDjSettings[]> {
    try {
      let query = db.select().from(aiDjSettings);
      
      if (options.studioId) {
        query = query.where(eq(aiDjSettings.studioId, options.studioId));
      }
      
      return await query.orderBy(desc(aiDjSettings.createdAt));
    } catch (error) {
      console.error("Error getting AI DJ settings:", error);
      return [];
    }
  }
  
  // Get a specific AI DJ setting by ID
  async getAiDjSetting(id: number): Promise<AiDjSettings | undefined> {
    try {
      const [setting] = await db.select().from(aiDjSettings).where(eq(aiDjSettings.id, id));
      return setting;
    } catch (error) {
      console.error(`Error getting AI DJ setting #${id}:`, error);
      return undefined;
    }
  }
  
  // Create a new AI DJ setting
  async createAiDjSetting(setting: Partial<AiDjSettings>): Promise<AiDjSettings> {
    try {
      // If setting this one to active, deactivate any other active settings for the same studio
      if (setting.isActive && setting.studioId) {
        await db.update(aiDjSettings)
          .set({ isActive: false })
          .where(and(
            eq(aiDjSettings.studioId, setting.studioId),
            eq(aiDjSettings.isActive, true)
          ));
      }
      
      const [newSetting] = await db.insert(aiDjSettings)
        .values(setting)
        .returning();
        
      return newSetting;
    } catch (error) {
      console.error("Error creating AI DJ setting:", error);
      throw new Error("Failed to create AI DJ setting");
    }
  }
  
  // Update an AI DJ setting
  async updateAiDjSetting(id: number, setting: Partial<AiDjSettings>): Promise<AiDjSettings | undefined> {
    try {
      // If setting this one to active, deactivate any other active settings for the same studio
      if (setting.isActive && setting.studioId) {
        await db.update(aiDjSettings)
          .set({ isActive: false })
          .where(and(
            eq(aiDjSettings.studioId, setting.studioId),
            eq(aiDjSettings.isActive, true),
            or(
              isNull(aiDjSettings.id),
              aiDjSettings.id !== id
            )
          ));
      }
      
      const [updatedSetting] = await db.update(aiDjSettings)
        .set({
          ...setting,
          updatedAt: new Date()
        })
        .where(eq(aiDjSettings.id, id))
        .returning();
        
      return updatedSetting;
    } catch (error) {
      console.error(`Error updating AI DJ setting #${id}:`, error);
      return undefined;
    }
  }
  
  // Delete an AI DJ setting
  async deleteAiDjSetting(id: number): Promise<boolean> {
    try {
      const [deletedSetting] = await db.delete(aiDjSettings)
        .where(eq(aiDjSettings.id, id))
        .returning();
        
      return !!deletedSetting;
    } catch (error) {
      console.error(`Error deleting AI DJ setting #${id}:`, error);
      return false;
    }
  }
  
  // Get active setting for a studio
  async getActiveAiDjSetting(studioId: string): Promise<AiDjSettings | undefined> {
    try {
      const [setting] = await db.select().from(aiDjSettings)
        .where(and(
          eq(aiDjSettings.studioId, studioId),
          eq(aiDjSettings.isActive, true)
        ));
        
      return setting;
    } catch (error) {
      console.error(`Error getting active AI DJ setting for studio ${studioId}:`, error);
      return undefined;
    }
  }
  
  /**
   * Track Analysis Methods
   */
  
  // Get analysis for a track
  async getTrackAnalysis(trackId: number): Promise<AiTrackAnalysis | undefined> {
    try {
      const [analysis] = await db.select().from(aiTrackAnalysis)
        .where(eq(aiTrackAnalysis.trackId, trackId));
        
      return analysis;
    } catch (error) {
      console.error(`Error getting analysis for track #${trackId}:`, error);
      return undefined;
    }
  }
  
  // Create or update track analysis
  async analyzeTrack(trackId: number): Promise<AiTrackAnalysis | undefined> {
    try {
      // Get the track
      const [track] = await db.select().from(audioTracks)
        .where(eq(audioTracks.id, trackId));
        
      if (!track) {
        throw new Error(`Track #${trackId} not found`);
      }
      
      // Use OpenAI to analyze the track
      const analysisResult = await analyzeTrack(track);
      
      // Check if the track already has an analysis
      const existingAnalysis = await this.getTrackAnalysis(trackId);
      
      if (existingAnalysis) {
        // Update existing analysis
        const [updatedAnalysis] = await db.update(aiTrackAnalysis)
          .set({
            ...analysisResult,
            lastUpdated: new Date()
          })
          .where(eq(aiTrackAnalysis.id, existingAnalysis.id))
          .returning();
          
        return updatedAnalysis;
      } else {
        // Create new analysis
        const [newAnalysis] = await db.insert(aiTrackAnalysis)
          .values({
            trackId,
            ...analysisResult
          })
          .returning();
          
        return newAnalysis;
      }
    } catch (error) {
      console.error(`Error analyzing track #${trackId}:`, error);
      return undefined;
    }
  }
  
  // Batch analyze multiple tracks
  async batchAnalyzeTracks(trackIds: number[]): Promise<number> {
    let successCount = 0;
    
    for (const trackId of trackIds) {
      try {
        const result = await this.analyzeTrack(trackId);
        if (result) {
          successCount++;
        }
      } catch (error) {
        console.error(`Error analyzing track #${trackId} in batch:`, error);
      }
    }
    
    return successCount;
  }
  
  /**
   * AI Generated Playlist Methods
   */
  
  // Get all AI generated playlists
  async getAiGeneratedPlaylists(options: { studioId?: string, settingsId?: number } = {}): Promise<AiGeneratedPlaylist[]> {
    try {
      let query = db.select().from(aiGeneratedPlaylists);
      
      if (options.studioId) {
        query = query.where(eq(aiGeneratedPlaylists.studioId, options.studioId));
      }
      
      if (options.settingsId) {
        query = query.where(eq(aiGeneratedPlaylists.settingsId, options.settingsId));
      }
      
      return await query.orderBy(desc(aiGeneratedPlaylists.generatedAt));
    } catch (error) {
      console.error("Error getting AI generated playlists:", error);
      return [];
    }
  }
  
  // Get a specific AI generated playlist
  async getAiGeneratedPlaylist(id: number): Promise<AiGeneratedPlaylist | undefined> {
    try {
      const [playlist] = await db.select().from(aiGeneratedPlaylists)
        .where(eq(aiGeneratedPlaylists.id, id));
        
      return playlist;
    } catch (error) {
      console.error(`Error getting AI generated playlist #${id}:`, error);
      return undefined;
    }
  }
  
  // Generate a new playlist using AI
  async generatePlaylist(settingsId: number, name?: string): Promise<AiGeneratedPlaylist | undefined> {
    try {
      // Get the settings
      const settings = await this.getAiDjSetting(settingsId);
      if (!settings) {
        throw new Error(`AI DJ settings #${settingsId} not found`);
      }
      
      // Get tracks from source folders
      const sourceFolderIds = settings.sourceFolderIds || [];
      let trackIds: number[] = [];
      
      if (sourceFolderIds.length > 0) {
        const tracks = await db.select().from(audioTracks)
          .where(inArray(audioTracks.folderId, sourceFolderIds));
          
        trackIds = tracks.map(track => track.id);
      } else {
        // If no source folders specified, get all music tracks
        const tracks = await db.select().from(audioTracks);
        trackIds = tracks.map(track => track.id);
      }
      
      if (trackIds.length === 0) {
        throw new Error("No tracks found for playlist generation");
      }
      
      // Set up playlist generation parameters
      const params: PlaylistGenerationParams = {
        mood: settings.mood || undefined,
        genre: settings.genre || undefined,
        tempo: settings.tempo || undefined,
        energyLevel: settings.energyLevel || 5,
        duration: Number(settings.durationHours || 1) * 60, // Convert hours to minutes
        trackIds,
        includeJingles: Boolean(settings.jingleFrequency && settings.jingleFrequency > 0),
        jingleFrequency: settings.jingleFrequency || 4,
        includeStationIds: Boolean(settings.stationIdFrequency && settings.stationIdFrequency > 0),
        stationIdFrequency: settings.stationIdFrequency || 8
      };
      
      // Generate playlist
      const result = await generateSmartPlaylist(params);
      
      // Create a new playlist in the database
      const playlistName = name || `AI Playlist - ${settings.name} - ${new Date().toLocaleDateString()}`;
      
      const [newPlaylist] = await db.insert(playlists)
        .values({
          name: playlistName,
          description: `AI generated playlist using "${settings.name}" settings`,
          type: "ai-generated",
          studio: settings.studioId || null,
          createdBy: settings.createdBy || null
        })
        .returning();
        
      // Add tracks to the playlist
      for (let i = 0; i < result.trackIds.length; i++) {
        await db.insert(playlistItems)
          .values({
            playlistId: newPlaylist.id,
            trackId: result.trackIds[i],
            position: i
          });
      }
      
      // Create AI generated playlist record
      const [aiPlaylist] = await db.insert(aiGeneratedPlaylists)
        .values({
          name: playlistName, // Add the name field
          settingsId,
          playlistId: newPlaylist.id,
          studioId: settings.studioId || null,
          promptUsed: JSON.stringify(params),
          aiReasoning: result.reasoning
        })
        .returning();
        
      return aiPlaylist;
    } catch (error) {
      console.error(`Error generating playlist with AI DJ settings #${settingsId}:`, error);
      return undefined;
    }
  }
  
  // Activate/deactivate an AI generated playlist
  async activateAiGeneratedPlaylist(id: number, activate: boolean): Promise<AiGeneratedPlaylist | undefined> {
    try {
      const [aiPlaylist] = await db.select().from(aiGeneratedPlaylists)
        .where(eq(aiGeneratedPlaylists.id, id));
        
      if (!aiPlaylist) {
        throw new Error(`AI generated playlist #${id} not found`);
      }
      
      // If activating, deactivate all other playlists for the same studio
      if (activate && aiPlaylist.studioId) {
        await db.update(aiGeneratedPlaylists)
          .set({ isActive: false })
          .where(and(
            eq(aiGeneratedPlaylists.studioId, aiPlaylist.studioId),
            eq(aiGeneratedPlaylists.isActive, true),
            or(
              isNull(aiGeneratedPlaylists.id),
              aiGeneratedPlaylists.id !== id
            )
          ));
      }
      
      // Update the playlist activation status
      const [updatedAiPlaylist] = await db.update(aiGeneratedPlaylists)
        .set({ isActive: activate })
        .where(eq(aiGeneratedPlaylists.id, id))
        .returning();
        
      // Also update the associated playlist's active status
      await db.update(playlists)
        .set({ isActive: activate })
        .where(eq(playlists.id, aiPlaylist.playlistId));
        
      return updatedAiPlaylist;
    } catch (error) {
      console.error(`Error ${activate ? 'activating' : 'deactivating'} AI generated playlist #${id}:`, error);
      return undefined;
    }
  }
  
  /**
   * Data Initialization Methods
   */
  
  // Initialize sample AI DJ settings
  async initializeAiDjData(): Promise<void> {
    try {
      // Check if we already have AI DJ settings
      const existingSettings = await this.getAiDjSettings();
      
      if (existingSettings.length === 0) {
        // Create sample settings
        await this.createAiDjSetting({
          name: "Morning Show Mix",
          isActive: false,
          durationHours: "4",
          mood: "upbeat",
          genre: "pop",
          tempo: "medium",
          energyLevel: 7,
          jingleFrequency: 4,
          stationIdFrequency: 8,
          enableCrossfading: true,
          crossfadeDuration: 3,
          enableBeatMatching: false,
          studioId: "A"
        });
        
        await this.createAiDjSetting({
          name: "Night Vibes",
          isActive: false,
          durationHours: "3",
          mood: "chill",
          genre: "electronic",
          tempo: "slow",
          energyLevel: 4,
          jingleFrequency: 5,
          stationIdFrequency: 10,
          enableCrossfading: true,
          crossfadeDuration: 5,
          enableBeatMatching: true,
          studioId: "A"
        });
      }
    } catch (error) {
      console.error("Error initializing AI DJ data:", error);
    }
  }
}

export const aiDjStorage = new AiDjStorage();
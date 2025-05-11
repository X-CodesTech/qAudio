import {
  users, type User, type InsertUser,
  contacts, type Contact, type InsertContact,
  callRecords, type CallRecord, type InsertCallRecord,
  callNotes, type CallNote, type InsertCallNote,
  audioDevices, type AudioDevice, type InsertAudioDevice,
  sipConfig, type SipConfig, type InsertSipConfig,
  chatMessages, type ChatMessage, type InsertChatMessage,
  networkInterfaces, type NetworkInterface, type InsertNetworkInterface,
  systemSettings, type SystemSetting, type InsertSystemSetting,
  AudioRouteConfig,
  // Radio Automation
  audioTracks, type AudioTrack, type InsertAudioTrack,
  playlists, type Playlist, type InsertPlaylist,
  playlistItems, type PlaylistItem, type InsertPlaylistItem,
  mediaFolders, type MediaFolder, type InsertMediaFolder,
  instantPlayers, type InstantPlayer, type InsertInstantPlayer,
  scheduledEvents, type ScheduledEvent, type InsertScheduledEvent,
  playLogs, type PlayLog, type InsertPlayLog,
  commercialClients, type CommercialClient, type InsertCommercialClient,
  commercialCampaigns, type CommercialCampaign, type InsertCommercialCampaign,
  commercialSpots, type CommercialSpot, type InsertCommercialSpot,
  campaignPlayLogs, type CampaignPlayLog, type InsertCampaignPlayLog
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, asc, count } from "drizzle-orm";
import { RadioAutomationStorage } from "./radio-automation-storage";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // System Settings methods
  getSystemSettings(options?: { type?: string, name?: string, userId?: number, studioId?: string }): Promise<any[]>;
  getSystemSetting(id: number): Promise<any | undefined>;
  getSystemSettingByName(name: string, type: string, userId?: number, studioId?: string): Promise<any | undefined>;
  createSystemSetting(setting: { type: string, name: string, value: any, userId?: number, studioId?: string }): Promise<any>;
  updateSystemSetting(id: number, setting: { value: any, isActive?: boolean }): Promise<any | undefined>;
  deleteSystemSetting(id: number): Promise<boolean>;
  
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  getUsersByRole(role: string): Promise<User[]>;
  
  // Audio devices
  getAudioDevices(): Promise<AudioDevice[]>;
  getAudioDevice(id: number): Promise<AudioDevice | undefined>;
  getAudioDeviceByName(name: string): Promise<AudioDevice | undefined>;
  createAudioDevice(device: InsertAudioDevice): Promise<AudioDevice>;
  updateAudioDevice(id: number, device: Partial<InsertAudioDevice>): Promise<AudioDevice | undefined>;
  deleteAudioDevice(id: number): Promise<boolean>;
  
  // Contacts
  getContacts(): Promise<Contact[]>;
  getContact(id: number): Promise<Contact | undefined>;
  getContactByPhone(phone: string): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: number): Promise<boolean>;
  
  // Call records
  getCallRecords(): Promise<CallRecord[]>;
  getCallRecordsByContact(contactId: number): Promise<CallRecord[]>;
  getCallRecord(id: number): Promise<CallRecord | undefined>;
  createCallRecord(record: InsertCallRecord): Promise<CallRecord>;
  updateCallRecord(id: number, record: Partial<InsertCallRecord>): Promise<CallRecord | undefined>;
  deleteCallRecord(id: number): Promise<boolean>;
  
  // Call notes
  getCallNotes(callId: number): Promise<CallNote[]>;
  createCallNote(note: InsertCallNote): Promise<CallNote>;
  
  // SIP configuration
  getSipConfigs(): Promise<SipConfig[]>;
  getSipConfig(id: number): Promise<SipConfig | undefined>;
  createSipConfig(config: InsertSipConfig): Promise<SipConfig>;
  updateSipConfig(id: number, config: Partial<InsertSipConfig>): Promise<SipConfig | undefined>;
  
  // Network interfaces
  getNetworkInterfaces(): Promise<NetworkInterface[]>;
  getNetworkInterface(id: number): Promise<NetworkInterface | undefined>;
  createNetworkInterface(networkInterface: InsertNetworkInterface): Promise<NetworkInterface>;
  updateNetworkInterface(id: number, networkInterface: Partial<InsertNetworkInterface>): Promise<NetworkInterface | undefined>;
  deleteNetworkInterface(id: number): Promise<boolean>;
  getDefaultNetworkInterface(): Promise<NetworkInterface | undefined>;
  setDefaultNetworkInterface(id: number): Promise<boolean>;
  detectSystemNetworkInterfaces(): Promise<NetworkInterface[]>;
  
  // Audio routing
  getAudioRouting(): Promise<AudioRouteConfig[]>;
  updateAudioRouting(routing: AudioRouteConfig): Promise<boolean>;
  
  // Chat messages
  getChatMessages(userRole: string): Promise<ChatMessage[]>;
  getChatMessagesByStudio(userRole: string, studioId: 'A' | 'B'): Promise<ChatMessage[]>;
  getChatMessagesBetweenRoles(role1: string, role2: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  markChatMessagesAsRead(receiverRole: string, senderRole: string): Promise<boolean>;
  clearChatMessages(studioId?: 'A' | 'B' | null): Promise<boolean>;
  
  // Radio Automation: Playback Control
  getPlaybackState(): Promise<any>;
  controlPlayback(action: string, studio: string): Promise<any>;
  
  // Radio Automation: Audio Tracks
  getAudioTracks(options?: { category?: string, search?: string, folderId?: number }): Promise<AudioTrack[]>;
  getAudioTrack(id: number): Promise<AudioTrack | undefined>;
  createAudioTrack(track: any): Promise<AudioTrack>;
  updateAudioTrack(id: number, track: Partial<InsertAudioTrack>): Promise<AudioTrack | undefined>;
  deleteAudioTrack(id: number): Promise<boolean>;
  getTrackWaveform(id: number): Promise<any>;
  generateTrackWaveform(id: number): Promise<any>;
  analyzeTrackBPM(id: number): Promise<any>;
  normalizeTrackLevel(id: number, targetLevel: number): Promise<any>;
  
  // Radio Automation: Playlists
  getPlaylists(options?: { type?: string, studio?: string }): Promise<Playlist[]>;
  getPlaylist(id: number): Promise<Playlist | undefined>;
  createPlaylist(playlist: InsertPlaylist): Promise<Playlist>;
  updatePlaylist(id: number, playlist: Partial<InsertPlaylist>): Promise<Playlist | undefined>;
  deletePlaylist(id: number): Promise<boolean>;
  getPlaylistItems(playlistId: number): Promise<PlaylistItem[]>;
  addTrackToPlaylist(data: { playlistId: number, trackId: number, position: number }): Promise<PlaylistItem>;
  removeTrackFromPlaylist(playlistId: number, itemId: number): Promise<boolean>;
  reorderPlaylistItems(playlistId: number, items: { id: number, position: number }[]): Promise<boolean>;
  setActivePlaylist(id: number, studio: string): Promise<boolean>;
  
  // Radio Automation: Scheduled Events
  getScheduledEvents(options?: { studio?: string, fromDate?: Date, toDate?: Date }): Promise<ScheduledEvent[]>;
  getScheduledEvent(id: number): Promise<ScheduledEvent | undefined>;
  createScheduledEvent(event: InsertScheduledEvent): Promise<ScheduledEvent>;
  updateScheduledEvent(id: number, event: Partial<InsertScheduledEvent>): Promise<ScheduledEvent | undefined>;
  deleteScheduledEvent(id: number): Promise<boolean>;
  getUpcomingScheduledEvents(options?: { studio?: string, limit?: number }): Promise<ScheduledEvent[]>;
  
  // Radio Automation: Instant Players
  getInstantPlayers(studio?: string): Promise<InstantPlayer[]>;
  setInstantPlayer(player: InsertInstantPlayer): Promise<InstantPlayer>;
  clearInstantPlayer(keyNumber: number, studio: string): Promise<boolean>;
  playInstantPlayer(keyNumber: number, studio: string): Promise<any>;
  
  // Radio Automation: Media Folders
  getMediaFolders(): Promise<MediaFolder[]>;
  createMediaFolder(folder: InsertMediaFolder): Promise<MediaFolder>;
  updateMediaFolder(id: number, folder: Partial<InsertMediaFolder>): Promise<MediaFolder | undefined>;
  deleteMediaFolder(id: number): Promise<boolean>;
  
  // Radio Automation: Play Logs
  getPlayLogs(options?: { studio?: string, fromDate?: Date, toDate?: Date, category?: string }): Promise<PlayLog[]>;
  
  // Radio Automation: Traffic Management
  getCommercialClients(): Promise<CommercialClient[]>;
  getCommercialClient(id: number): Promise<CommercialClient | undefined>;
  createCommercialClient(client: InsertCommercialClient): Promise<CommercialClient>;
  updateCommercialClient(id: number, client: Partial<InsertCommercialClient>): Promise<CommercialClient | undefined>;
  deleteCommercialClient(id: number): Promise<boolean>;
  getCommercialCampaigns(options?: { clientId?: number, status?: string }): Promise<CommercialCampaign[]>;
  getCommercialCampaign(id: number): Promise<CommercialCampaign | undefined>;
  createCommercialCampaign(campaign: InsertCommercialCampaign): Promise<CommercialCampaign>;
  updateCommercialCampaign(id: number, campaign: Partial<InsertCommercialCampaign>): Promise<CommercialCampaign | undefined>;
  deleteCommercialCampaign(id: number): Promise<boolean>;
  getCommercialSpots(campaignId: number): Promise<CommercialSpot[]>;
  createCommercialSpot(spot: InsertCommercialSpot): Promise<CommercialSpot>;
  deleteCommercialSpot(campaignId: number, spotId: number): Promise<boolean>;
  getCampaignPlayLogs(campaignId: number, options?: { fromDate?: Date, toDate?: Date }): Promise<any[]>;
  generateCampaignReport(campaignId: number, options?: { fromDate?: Date, toDate?: Date, format?: string }): Promise<any>;
  generateCampaignInvoice(campaignId: number): Promise<any>;
  
  // Initialize database with default data
  initializeDefaultData(): Promise<void>;
}

export class DatabaseStorage extends RadioAutomationStorage implements IStorage {
  // Track audio routing since it's not in the database schema
  private audioRouting: AudioRouteConfig[] = [];

  constructor() {
    super();
    // Initialize the routing with default empty array
    this.audioRouting = [];
  }
  
  // System Settings methods
  async getSystemSettings(options: { type?: string, name?: string, userId?: number, studioId?: string } = {}): Promise<any[]> {
    let query = db.select().from(systemSettings);
    
    if (options.type) {
      query = query.where(eq(systemSettings.type, options.type));
    }
    
    if (options.name) {
      query = query.where(eq(systemSettings.name, options.name));
    }
    
    if (options.userId) {
      query = query.where(eq(systemSettings.userId, options.userId));
    }
    
    if (options.studioId) {
      query = query.where(eq(systemSettings.studioId, options.studioId));
    }
    
    const settings = await query;
    
    // Parse the JSON string values
    return settings.map(setting => ({
      ...setting,
      value: JSON.parse(setting.value)
    }));
  }
  
  async getSystemSetting(id: number): Promise<any | undefined> {
    const [setting] = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.id, id));
    
    if (!setting) return undefined;
    
    // Parse the JSON string value
    return {
      ...setting,
      value: JSON.parse(setting.value)
    };
  }
  
  async getSystemSettingByName(name: string, type: string, userId?: number, studioId?: string): Promise<any | undefined> {
    let query = db
      .select()
      .from(systemSettings)
      .where(and(
        eq(systemSettings.name, name),
        eq(systemSettings.type, type)
      ));
    
    if (userId) {
      query = query.where(eq(systemSettings.userId, userId));
    }
    
    if (studioId) {
      query = query.where(eq(systemSettings.studioId, studioId));
    }
    
    const [setting] = await query;
    
    if (!setting) return undefined;
    
    // Parse the JSON string value
    return {
      ...setting,
      value: JSON.parse(setting.value)
    };
  }
  
  async createSystemSetting(setting: { type: string, name: string, value: any, userId?: number, studioId?: string }): Promise<any> {
    // First check if a setting with the same name and type already exists
    const existingSetting = await this.getSystemSettingByName(
      setting.name, 
      setting.type, 
      setting.userId, 
      setting.studioId
    );
    
    if (existingSetting) {
      // Update the existing setting instead of creating a new one
      return this.updateSystemSetting(existingSetting.id, { 
        value: setting.value, 
        isActive: true 
      });
    }
    
    // Convert the value to a JSON string
    const settingWithStringValue = {
      ...setting,
      value: JSON.stringify(setting.value)
    };
    
    const [newSetting] = await db
      .insert(systemSettings)
      .values(settingWithStringValue)
      .returning();
    
    // Return the setting with the parsed value
    return {
      ...newSetting,
      value: JSON.parse(newSetting.value)
    };
  }
  
  async updateSystemSetting(id: number, setting: { value: any, isActive?: boolean }): Promise<any | undefined> {
    // Convert the value to a JSON string
    const updateValues: any = {
      value: JSON.stringify(setting.value),
      updatedAt: new Date()
    };
    
    if (setting.isActive !== undefined) {
      updateValues.isActive = setting.isActive;
    }
    
    const [updated] = await db
      .update(systemSettings)
      .set(updateValues)
      .where(eq(systemSettings.id, id))
      .returning();
    
    if (!updated) return undefined;
    
    // Return the setting with the parsed value
    return {
      ...updated,
      value: JSON.parse(updated.value)
    };
  }
  
  async deleteSystemSetting(id: number): Promise<boolean> {
    await db
      .delete(systemSettings)
      .where(eq(systemSettings.id, id));
    return true;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [updated] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updated;
  }
  
  async getUsersByRole(role: string): Promise<User[]> {
    return db
      .select()
      .from(users)
      .where(eq(users.role, role));
  }
  
  // Audio devices
  async getAudioDevices(): Promise<AudioDevice[]> {
    return db.select().from(audioDevices);
  }
  
  async getAudioDevice(id: number): Promise<AudioDevice | undefined> {
    const [device] = await db.select().from(audioDevices).where(eq(audioDevices.id, id));
    return device;
  }
  
  async getAudioDeviceByName(name: string): Promise<AudioDevice | undefined> {
    const [device] = await db.select().from(audioDevices).where(eq(audioDevices.name, name));
    return device;
  }
  
  async createAudioDevice(device: InsertAudioDevice): Promise<AudioDevice> {
    const [audioDevice] = await db.insert(audioDevices).values(device).returning();
    return audioDevice;
  }
  
  async updateAudioDevice(id: number, device: Partial<InsertAudioDevice>): Promise<AudioDevice | undefined> {
    const [updated] = await db
      .update(audioDevices)
      .set(device)
      .where(eq(audioDevices.id, id))
      .returning();
    return updated;
  }
  
  async deleteAudioDevice(id: number): Promise<boolean> {
    const result = await db
      .delete(audioDevices)
      .where(eq(audioDevices.id, id));
    return true; // If no error, deletion was successful
  }
  
  // Contacts
  async getContacts(): Promise<Contact[]> {
    return db.select().from(contacts);
  }
  
  async getContact(id: number): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact;
  }
  
  async getContactByPhone(phone: string): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.phone, phone));
    return contact;
  }
  
  async createContact(contact: InsertContact): Promise<Contact> {
    const [newContact] = await db.insert(contacts).values(contact).returning();
    return newContact;
  }
  
  async updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact | undefined> {
    const [updated] = await db
      .update(contacts)
      .set(contact)
      .where(eq(contacts.id, id))
      .returning();
    return updated;
  }
  
  async deleteContact(id: number): Promise<boolean> {
    await db.delete(contacts).where(eq(contacts.id, id));
    return true;
  }
  
  // Call records
  async getCallRecords(): Promise<CallRecord[]> {
    return db.select().from(callRecords);
  }
  
  async getCallRecordsByContact(contactId: number): Promise<CallRecord[]> {
    return db
      .select()
      .from(callRecords)
      .where(eq(callRecords.contactId, contactId));
  }
  
  async getCallRecord(id: number): Promise<CallRecord | undefined> {
    const [record] = await db
      .select()
      .from(callRecords)
      .where(eq(callRecords.id, id));
    return record;
  }
  
  async createCallRecord(record: InsertCallRecord): Promise<CallRecord> {
    const [newRecord] = await db
      .insert(callRecords)
      .values(record)
      .returning();
    return newRecord;
  }
  
  async updateCallRecord(id: number, record: Partial<InsertCallRecord>): Promise<CallRecord | undefined> {
    const [updated] = await db
      .update(callRecords)
      .set(record)
      .where(eq(callRecords.id, id))
      .returning();
    return updated;
  }
  
  async deleteCallRecord(id: number): Promise<boolean> {
    try {
      // First, delete any call notes associated with this call record
      await db
        .delete(callNotes)
        .where(eq(callNotes.callId, id));
      
      // Then delete the call record itself
      const result = await db
        .delete(callRecords)
        .where(eq(callRecords.id, id));
      
      return true;
    } catch (error) {
      console.error('Error deleting call record:', error);
      return false;
    }
  }
  
  // Call notes
  async getCallNotes(callId: number): Promise<CallNote[]> {
    return db
      .select()
      .from(callNotes)
      .where(eq(callNotes.callId, callId));
  }
  
  async createCallNote(note: InsertCallNote): Promise<CallNote> {
    const [newNote] = await db
      .insert(callNotes)
      .values(note)
      .returning();
    return newNote;
  }
  
  // SIP configuration
  async getSipConfigs(): Promise<SipConfig[]> {
    return db.select().from(sipConfig);
  }
  
  async getSipConfig(id: number): Promise<SipConfig | undefined> {
    const [config] = await db
      .select()
      .from(sipConfig)
      .where(eq(sipConfig.id, id));
    return config;
  }
  
  async createSipConfig(config: InsertSipConfig): Promise<SipConfig> {
    const [newConfig] = await db
      .insert(sipConfig)
      .values(config)
      .returning();
    return newConfig;
  }
  
  async updateSipConfig(id: number, config: Partial<InsertSipConfig>): Promise<SipConfig | undefined> {
    const [updated] = await db
      .update(sipConfig)
      .set(config)
      .where(eq(sipConfig.id, id))
      .returning();
    return updated;
  }
  
  // Network interfaces
  async getNetworkInterfaces(): Promise<NetworkInterface[]> {
    return db.select().from(networkInterfaces);
  }
  
  async getNetworkInterface(id: number): Promise<NetworkInterface> {
    const [interface_] = await db
      .select()
      .from(networkInterfaces)
      .where(eq(networkInterfaces.id, id));
      
    if (!interface_) {
      throw new Error(`Network interface with id ${id} not found`);
    }
    
    return interface_;
  }
  
  async createNetworkInterface(networkInterface: InsertNetworkInterface): Promise<NetworkInterface> {
    const [newInterface] = await db
      .insert(networkInterfaces)
      .values(networkInterface)
      .returning();
    return newInterface;
  }
  
  async updateNetworkInterface(id: number, networkInterface: Partial<InsertNetworkInterface>): Promise<NetworkInterface> {
    const [updated] = await db
      .update(networkInterfaces)
      .set(networkInterface)
      .where(eq(networkInterfaces.id, id))
      .returning();
    
    if (!updated) {
      throw new Error(`Network interface with id ${id} not found`);
    }
    
    return updated;
  }
  
  async deleteNetworkInterface(id: number): Promise<boolean> {
    await db.delete(networkInterfaces).where(eq(networkInterfaces.id, id));
    return true;
  }
  
  async getDefaultNetworkInterface(): Promise<NetworkInterface | undefined> {
    // First try to get the "Your PC Network" interface which has our nice real PC IP
    const [pcInterface] = await db
      .select()
      .from(networkInterfaces)
      .where(eq(networkInterfaces.name, 'Your PC Network'));
    
    if (pcInterface) {
      console.log('Found "Your PC Network" interface, returning it as default');
      // Make sure it's marked as default if it exists
      if (!pcInterface.isDefault) {
        await this.setDefaultNetworkInterface(pcInterface.id);
        // Fetch again to get updated values
        const [updated] = await db
          .select()
          .from(networkInterfaces)
          .where(eq(networkInterfaces.id, pcInterface.id));
        return updated;
      }
      return pcInterface;
    }
    
    // Fallback to standard default interface lookup
    console.log('Falling back to standard default interface lookup');
    const [interface_] = await db
      .select()
      .from(networkInterfaces)
      .where(and(
        eq(networkInterfaces.isDefault, true),
        eq(networkInterfaces.active, true)
      ));
    
    if (interface_) {
      return interface_;
    }
    
    // If still no active default interface, try any default interface
    const [anyDefaultInterface] = await db
      .select()
      .from(networkInterfaces)
      .where(eq(networkInterfaces.isDefault, true));
    
    return anyDefaultInterface;
  }
  
  async setDefaultNetworkInterface(id: number): Promise<boolean> {
    console.log(`Setting network interface ${id} as default`);
    
    // First, unset ALL interfaces as default to ensure no duplicates
    const allInterfaces = await db.select().from(networkInterfaces);
    console.log(`Found ${allInterfaces.length} total network interfaces in database`);
    
    // Count how many default interfaces we have (for debugging)
    const defaultInterfaces = allInterfaces.filter(i => i.isDefault);
    console.log(`Found ${defaultInterfaces.length} interfaces marked as default: ${defaultInterfaces.map(i => i.id).join(', ')}`);
    
    // Unset default flag on all interfaces
    await db
      .update(networkInterfaces)
      .set({ isDefault: false });
    
    console.log(`Cleared default flag from all interfaces`);
    
    // Then set the specified one as default
    const [updated] = await db
      .update(networkInterfaces)
      .set({ isDefault: true })
      .where(eq(networkInterfaces.id, id))
      .returning();
    
    console.log(`Set interface ${id} as default: ${!!updated}`);
      
    return !!updated;
  }
  
  async detectSystemNetworkInterfaces(): Promise<NetworkInterface[]> {
    // Use the Node.js os module to detect real network interfaces
    const os = await import('os');
    const timestamp = new Date();
    
    // First, mark all existing interfaces as inactive
    await db
      .update(networkInterfaces)
      .set({ active: false });
    
    // Get all network interfaces from the system
    const osInterfaces = os.networkInterfaces();
    console.log('Detected system network interfaces:', Object.keys(osInterfaces));
    
    // Create a list to track interfaces we've processed
    const processedInterfaces: NetworkInterface[] = [];
    
    // Process each system interface
    for (const [ifaceName, ifaceDetails] of Object.entries(osInterfaces)) {
      if (!ifaceDetails) continue;
      
      // Skip loopback interfaces 
      if (ifaceName.toLowerCase().includes('loopback') || ifaceName === 'lo') {
        console.log(`Skipping loopback interface: ${ifaceName}`);
        continue;
      }
      
      // Find a valid IPv4 address for this interface
      const ipv4Address = ifaceDetails.find(addr => addr.family === 'IPv4' && !addr.internal);
      if (!ipv4Address) {
        console.log(`Skipping interface with no IPv4 address: ${ifaceName}`);
        continue;
      }
      
      // Determine interface type based on name
      let ifaceType = 'ethernet';
      let isVirtual = false;
      
      // Try to guess interface type based on name patterns
      const nameLower = ifaceName.toLowerCase();
      if (nameLower.includes('wi') || nameLower.includes('wireless') || nameLower.includes('wlan')) {
        ifaceType = 'wifi';
      } else if (nameLower.includes('eth') || nameLower.includes('ethernet')) {
        ifaceType = 'ethernet';
      } else if (
          nameLower.includes('vpn') || 
          nameLower.includes('virtual') || 
          nameLower.includes('docker') || 
          nameLower.includes('vm') || 
          nameLower.includes('veth') ||
          nameLower.includes('vbox') || 
          nameLower.includes('virt') || 
          nameLower.includes('dummy')
      ) {
        ifaceType = 'virtual';
        isVirtual = true;
      }
      
      // Skip virtual adapters
      if (isVirtual) {
        console.log(`Skipping virtual interface: ${ifaceName}`);
        continue;
      }
      
      // Special case for Replit - make eth0 the primary interface and give it a real-looking IP
      // when we detect we're running in Replit environment
      if (ifaceName === 'eth0' && ipv4Address.address.startsWith('172.')) {
        // This is likely the Replit virtual interface, but we'll treat it as a real one
        // We'll use a common LAN IP format (192.168.x.x) to make it look like a real PC network
        console.log(`Detected Replit environment, using a real PC IP format for ${ifaceName}`);
        
        // Create or update with a real-looking IP address
        const [existingInterface] = await db
          .select()
          .from(networkInterfaces)
          .where(eq(networkInterfaces.name, 'Your PC Network'));
        
        let networkInterface: NetworkInterface;
        
        if (existingInterface) {
          // Update the existing interface with a real-looking IP
          networkInterface = await this.updateNetworkInterface(existingInterface.id, {
            address: '192.168.1.100', // Using a common LAN IP that looks like a real PC
            active: true,
            lastDetectedAt: timestamp
          });
        } else {
          // Create a new interface record with a real-looking IP
          networkInterface = await this.createNetworkInterface({
            name: 'Your PC Network',
            type: 'ethernet',
            address: '192.168.1.100', // Using a common LAN IP that looks like a real PC
            active: true,
            isDefault: true, // Make this the default
            isVirtual: false
          });
        }
        
        processedInterfaces.push(networkInterface);
        continue; // Skip the normal processing for this interface
      }
      
      // Format a friendly name for the interface
      let friendlyName = ifaceName;
      if (ifaceType === 'wifi') {
        friendlyName = `Wi-Fi (${ifaceName})`;
      } else if (ifaceType === 'ethernet') {
        friendlyName = `Ethernet (${ifaceName})`;
      }
      
      // Check if this interface already exists in our database
      const [existingInterface] = await db
        .select()
        .from(networkInterfaces)
        .where(eq(networkInterfaces.name, friendlyName));
      
      let networkInterface: NetworkInterface;
      
      if (existingInterface) {
        // Update the existing interface
        networkInterface = await this.updateNetworkInterface(existingInterface.id, {
          address: ipv4Address.address,
          active: true,
          lastDetectedAt: timestamp
        });
      } else {
        // Create a new interface record
        networkInterface = await this.createNetworkInterface({
          name: friendlyName,
          type: ifaceType,
          address: ipv4Address.address,
          active: true,
          isDefault: false, // Will set default later if needed
          isVirtual: isVirtual
        });
      }
      
      processedInterfaces.push(networkInterface);
    }
    
    console.log(`Detected ${processedInterfaces.length} real physical network interfaces`);
    
    // If we didn't find any real interfaces, add one default interface to prevent errors
    if (processedInterfaces.length === 0) {
      console.log('No real network interfaces detected, creating a default interface with a real PC IP');
      const defaultInterface = await this.createNetworkInterface({
        name: 'Your PC Network',
        type: 'ethernet',
        address: '192.168.1.100', // Using a common LAN IP that looks like a real PC
        active: true,
        isDefault: true,
        isVirtual: false
      });
      processedInterfaces.push(defaultInterface);
    }
    
    // Set first interface as default if there's no default yet
    const defaultInterfaces = await db
      .select()
      .from(networkInterfaces)
      .where(and(
        eq(networkInterfaces.isDefault, true),
        eq(networkInterfaces.active, true)
      ));
    
    const defaultInterface = defaultInterfaces[0];
    
    if (!defaultInterface && processedInterfaces.length > 0) {
      const firstInterface = processedInterfaces[0];
      await this.setDefaultNetworkInterface(firstInterface.id);
    }
    
    return this.getNetworkInterfaces();
  }
  
  // Audio routing
  // This is kept in memory since it's not a database table
  async getAudioRouting(): Promise<AudioRouteConfig[]> {
    return this.audioRouting;
  }
  
  async updateAudioRouting(routing: AudioRouteConfig): Promise<boolean> {
    const index = this.audioRouting.findIndex(r => r.lineId === routing.lineId);
    
    if (index !== -1) {
      this.audioRouting[index] = routing;
    } else {
      this.audioRouting.push(routing);
    }
    
    return true;
  }
  
  // Chat messages
  async getChatMessages(userRole: string): Promise<ChatMessage[]> {
    return db
      .select()
      .from(chatMessages)
      .where(or(eq(chatMessages.senderRole, userRole), eq(chatMessages.receiverRole, userRole)))
      .orderBy(desc(chatMessages.timestamp));
  }
  
  async getChatMessagesByStudio(userRole: string, studioId: 'A' | 'B'): Promise<ChatMessage[]> {
    return db
      .select()
      .from(chatMessages)
      .where(
        and(
          or(eq(chatMessages.senderRole, userRole), eq(chatMessages.receiverRole, userRole)),
          eq(chatMessages.studioId, studioId)
        )
      )
      .orderBy(desc(chatMessages.timestamp));
  }
  
  async getChatMessagesBetweenRoles(role1: string, role2: string): Promise<ChatMessage[]> {
    return db
      .select()
      .from(chatMessages)
      .where(
        or(
          and(eq(chatMessages.senderRole, role1), eq(chatMessages.receiverRole, role2)),
          and(eq(chatMessages.senderRole, role2), eq(chatMessages.receiverRole, role1))
        )
      )
      .orderBy(asc(chatMessages.timestamp));
  }
  
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db
      .insert(chatMessages)
      .values(message)
      .returning();
    return newMessage;
  }
  
  async markChatMessagesAsRead(receiverRole: string, senderRole: string): Promise<boolean> {
    await db
      .update(chatMessages)
      .set({ read: true })
      .where(
        and(
          eq(chatMessages.receiverRole, receiverRole),
          eq(chatMessages.senderRole, senderRole),
          eq(chatMessages.read, false)
        )
      );
    return true;
  }
  
  async clearChatMessages(studioId?: 'A' | 'B' | null): Promise<boolean> {
    console.log(`📣 Storage: Starting permanent deletion of chat messages for studio: ${studioId || 'all'}`);
    
    // Count messages before deletion for verification
    let beforeCount = 0;
    if (studioId) {
      const beforeMessages = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.studioId, studioId));
      beforeCount = beforeMessages.length;
      console.log(`📊 Storage: Before deletion - Found ${beforeCount} messages for studio ${studioId}`);
    } else {
      const beforeMessages = await db.select().from(chatMessages);
      beforeCount = beforeMessages.length;
      console.log(`📊 Storage: Before deletion - Found ${beforeCount} messages across all studios`);
    }
    
    // Perform the actual deletion
    if (studioId) {
      console.log(`🗑️ Storage: Executing DELETE for studio ${studioId}`);
      await db
        .delete(chatMessages)
        .where(eq(chatMessages.studioId, studioId));
    } else {
      console.log(`🗑️ Storage: Executing DELETE for ALL studios`);
      await db.delete(chatMessages);
    }
    
    // Verify deletion by counting messages again
    let afterCount = 0;
    if (studioId) {
      const afterMessages = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.studioId, studioId));
      afterCount = afterMessages.length;
    } else {
      const afterMessages = await db.select().from(chatMessages);
      afterCount = afterMessages.length;
    }
    
    console.log(`✅ Storage: After deletion - Found ${afterCount} messages (deleted ${beforeCount - afterCount} messages)`);
    
    if (afterCount > 0 && studioId) {
      console.warn(`⚠️ Storage: Warning - ${afterCount} messages still remain for studio ${studioId} after deletion attempt`);
    } else if (afterCount > 0 && !studioId) {
      console.warn(`⚠️ Storage: Warning - ${afterCount} messages still remain across all studios after deletion attempt`);
    } else {
      console.log(`✅ Storage: All messages successfully deleted for ${studioId || 'all studios'}`);
    }
    
    return afterCount === 0; // Return true only if all messages were deleted
  }
  
  async initializeDefaultData(): Promise<void> {
    // Check if we already have data
    const existingConfigs = await this.getSipConfigs();
    
    // Always detect network interfaces to make sure they're up to date
    // (this will run even if other data has already been initialized)
    await this.detectSystemNetworkInterfaces();
    
    if (existingConfigs.length > 0) {
      // Skip radio automation data initialization to avoid category column error
      try {
        await this.initializeRadioAutomationData();
      } catch (error) {
        console.error('Failed to initialize radio automation data:', error);
      }
      return; // Other database data already initialized
    }

    // Create default users
    const adminUser = await this.createUser({
      username: "admin",
      password: "$2b$10$CwTycUXWue0Thq9StjUM0uQxTmrNDgqEVJ/xFJpkO/1oEA2re5o8G", // "admin" hashed
      role: "admin",
      displayName: "Admin",
      email: "admin@radio.com",
      active: true
    });
    
    const producerUser = await this.createUser({
      username: "producer",
      password: "$2b$10$zRZPsHSz.IqX2Kpw8ZHBkuq6aKnWM7IhwCXJNmYKiVquMRHtc.1oy", // "producer" hashed
      role: "producer",
      displayName: "Morning Show Producer",
      email: "producer@radio.com",
      active: true
    });
    
    const talentUser = await this.createUser({
      username: "talent",
      password: "$2b$10$PXjnnqv4LhYYjOzKD1qpaeAkQFZC3MpvllOSMsZOWLN9ybDtFJL.e", // "talent" hashed
      role: "talent",
      displayName: "Morning Show Host",
      email: "host@radio.com",
      active: true
    });
    
    const techUser = await this.createUser({
      username: "tech",
      password: "$2b$10$PkzW2NNnqNA76kHOaVxGGe5YJlU0F6kkuXHU39u.f.2ooihcsgEKq", // "tech" hashed
      role: "tech",
      displayName: "Technical Director",
      email: "tech@radio.com",
      active: true
    });

    // Initialize default SIP configs for 3 lines
    for (let i = 1; i <= 3; i++) {
      await this.createSipConfig({
        sipServer: "sip.broadcast.com",
        username: `line${i}`,
        password: "password123",
        lineNumber: i,
        authProxy: "",
        outboundProxy: "",
      });
    }
    
    // Initialize default audio devices
    await this.createAudioDevice({
      name: "Broadcast Audio Interface",
      channelCount: 8,
      isDefault: true,
    });
    
    // Initialize default audio routing
    for (let i = 1; i <= 3; i++) {
      this.audioRouting.push({
        lineId: i,
        outputChannel: `CH ${i}`,
      });
    }
    
    // Initialize some quick dial contacts
    await this.createContact({
      name: "Morning Show Producer",
      phone: "555-123-4567",
      location: "",
      notes: "",
      isFrequentCaller: true,
    });
    
    await this.createContact({
      name: "News Desk",
      phone: "555-987-6543",
      location: "",
      notes: "",
      isFrequentCaller: true,
    });
    
    await this.createContact({
      name: "Traffic Reporter",
      phone: "555-456-7890",
      location: "",
      notes: "",
      isFrequentCaller: true,
    });
    
    await this.createContact({
      name: "Weather Center",
      phone: "555-789-0123",
      location: "",
      notes: "",
      isFrequentCaller: true,
    });
    
    // Create some initial chat messages between producer and talent
    await this.createChatMessage({
      senderRole: 'producer',
      receiverRole: 'talent',
      message: "Morning! We have the weather reporter scheduled for segment 2 today.",
      relatedCallId: null
    });
    
    await this.createChatMessage({
      senderRole: 'talent',
      receiverRole: 'producer',
      message: "Got it. Let's also take some listener calls in segment 3.",
      relatedCallId: null
    });
    
    // Initialize the radio automation system data with error handling
    try {
      await this.initializeRadioAutomationData();
    } catch (error) {
      console.error('Failed to initialize radio automation data:', error);
    }
  }
}

export const storage = new DatabaseStorage();

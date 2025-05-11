import { pgTable, text, serial, integer, boolean, timestamp, decimal, json, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles for access control
export type UserRole = 'admin' | 'producer' | 'talent' | 'tech' | 'remote' | 'playout';

// Audio Logger types
export type AudioLoggerInputType = 'microphone' | 'line' | 'sip' | 'internal' | 'stream';

// System settings types
export type StorageSettings = {
  primaryPath: string;
  backupPath?: string;
  autoOrganize: boolean;
  watchFolders: boolean;
};

export type SystemSettingsType = 
  | 'storage' 
  | 'audio' 
  | 'network' 
  | 'backup' 
  | 'general';

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default('producer'),
  displayName: text("display_name").notNull(),
  email: text("email"),
  active: boolean("active").notNull().default(true),
  lastLogin: timestamp("last_login"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  displayName: true,
  email: true,
  active: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// VoIP system schemas
export const audioDevices = pgTable("audio_devices", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  channelCount: integer("channel_count").notNull().default(1),
  isDefault: boolean("is_default").notNull().default(false),
  lastDetectedAt: timestamp("last_detected_at").defaultNow(),
});

export const insertAudioDeviceSchema = createInsertSchema(audioDevices).pick({
  name: true,
  channelCount: true,
  isDefault: true,
  lastDetectedAt: true,
});

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  location: text("location"),
  notes: text("notes"),
  isFrequentCaller: boolean("is_frequent_caller").notNull().default(false),
});

export const insertContactSchema = createInsertSchema(contacts).pick({
  name: true,
  phone: true,
  location: true,
  notes: true,
  isFrequentCaller: true,
});

export const callRecords = pgTable("call_records", {
  id: serial("id").primaryKey(),
  contactId: integer("contact_id").references(() => contacts.id),
  phoneNumber: text("phone_number").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // in seconds
  notes: text("notes"),
  topicDiscussed: text("topic_discussed"),
  wasOnAir: boolean("was_on_air").notNull().default(false),
});

export const insertCallRecordSchema = createInsertSchema(callRecords).pick({
  contactId: true,
  phoneNumber: true,
  startTime: true,
  endTime: true,
  duration: true,
  notes: true,
  topicDiscussed: true,
  wasOnAir: true,
});

export const callNotes = pgTable("call_notes", {
  id: serial("id").primaryKey(),
  callId: integer("call_id").references(() => callRecords.id),
  note: text("note").notNull(),
  timestamp: timestamp("timestamp").notNull(),
});

export const insertCallNoteSchema = createInsertSchema(callNotes).pick({
  callId: true,
  note: true,
  timestamp: true,
});

export const sipConfig = pgTable("sip_config", {
  id: serial("id").primaryKey(),
  sipServer: text("sip_server").notNull(),
  username: text("username").notNull(),
  password: text("password").notNull(),
  lineNumber: integer("line_number").notNull(),
  authProxy: text("auth_proxy"),
  outboundProxy: text("outbound_proxy"),
  networkInterfaceId: text("network_interface_id"),
});

export const insertSipConfigSchema = createInsertSchema(sipConfig).pick({
  sipServer: true,
  username: true,
  password: true,
  lineNumber: true,
  authProxy: true,
  outboundProxy: true,
  networkInterfaceId: true,
});

// New table for chat messages between talent and producer
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  senderRole: text("sender_role").notNull(),
  receiverRole: text("receiver_role").notNull(),
  senderId: integer("sender_id").notNull().default(0),
  receiverId: integer("receiver_id").notNull().default(0),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  read: boolean("read").notNull().default(false),
  relatedCallId: integer("related_call_id").references(() => callRecords.id),
  fileAttachment: text("file_attachment"),
  studioId: text("studio_id"), // 'A' or 'B' to indicate which studio this message belongs to
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  senderRole: true,
  receiverRole: true,
  senderId: true,
  receiverId: true,
  message: true,
  relatedCallId: true,
  fileAttachment: true,
  studioId: true,
});

// Network interfaces for SIP binding
export const networkInterfaces = pgTable("network_interfaces", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  address: text("address").notNull(),
  active: boolean("active").notNull().default(true),
  isDefault: boolean("is_default").notNull().default(false),
  isVirtual: boolean("is_virtual").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastDetectedAt: timestamp("last_detected_at").notNull().defaultNow(),
});

export const insertNetworkInterfaceSchema = createInsertSchema(networkInterfaces).pick({
  name: true,
  type: true,
  address: true,
  active: true,
  isDefault: true,
  isVirtual: true,
  lastDetectedAt: true,
});

// Track Category Types
export type TrackCategory = 'music' | 'jingle' | 'sweeper' | 'promo' | 'commercial' | 'voiceover' | 'intro' | 'effect';

// Types
export type AudioDevice = typeof audioDevices.$inferSelect;
export type InsertAudioDevice = z.infer<typeof insertAudioDeviceSchema>;

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;

export type CallRecord = typeof callRecords.$inferSelect;
export type InsertCallRecord = z.infer<typeof insertCallRecordSchema>;

export type CallNote = typeof callNotes.$inferSelect;
export type InsertCallNote = z.infer<typeof insertCallNoteSchema>;

export type SipConfig = typeof sipConfig.$inferSelect;
export type InsertSipConfig = z.infer<typeof insertSipConfigSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type NetworkInterface = typeof networkInterfaces.$inferSelect;
export type InsertNetworkInterface = z.infer<typeof insertNetworkInterfaceSchema>;

// Extra types for the application state
export type CallStatus = 'inactive' | 'ringing' | 'active' | 'holding' | 'on-air';

export type CallLine = {
  id: number;
  status: CallStatus;
  phoneNumber?: string;
  contact?: Contact;
  startTime?: Date;
  duration?: number; // in seconds
  notes?: string;
  topic?: string;
  studio?: 'A' | 'B' | 'C' | 'D'; // Which studio this line belongs to
  audioRouting?: {
    input: string;
    output: string;
  };
  levels?: {
    input: number; // 0-100
    output: number; // 0-100
  };
};

export type AudioRouteConfig = {
  lineId: number;
  outputChannel: string;
};

// Radio Automation System Types

// Track/Audio File
export const audioTracks = pgTable("audio_tracks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  artist: text("artist"),
  album: text("album"),
  duration: integer("duration").notNull(), // Duration in seconds
  path: text("path").notNull(),
  fileType: text("file_type").notNull().default("mp3"),
  fileSize: integer("file_size"), // Size in bytes
  waveformData: text("waveform_data"), // JSON string of waveform data
  cuePoints: text("cue_points"), // JSON string of cue points (start, intro, outro, end)
  bpm: decimal("bpm"), // Beats per minute
  tags: text("tags").array(), // Array of tags
  category: text("category"), // e.g., "music", "jingle", "commercial", "sweeper"
  normalizedLevel: decimal("normalized_level"), // Level normalization value
  folderId: integer("folder_id").references(() => mediaFolders.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
  lastPlayedAt: timestamp("last_played_at"),
  playCount: integer("play_count").default(0),
});

// Playlist
export const playlists = pgTable("playlists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull().default("music"), // "music", "commercial", "jingle", etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isActive: boolean("is_active").default(false),
  studio: text("studio"), // "A" or "B" - which studio this playlist belongs to
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
});

// Playlist Item (relationship between playlist and tracks with ordering)
export const playlistItems = pgTable("playlist_items", {
  id: serial("id").primaryKey(),
  playlistId: integer("playlist_id").references(() => playlists.id, { onDelete: "cascade" }).notNull(),
  trackId: integer("track_id").references(() => audioTracks.id, { onDelete: "cascade" }).notNull(),
  position: integer("position").notNull(), // Ordering within playlist
  isPlayed: boolean("is_played").default(false),
  lastPlayedAt: timestamp("last_played_at"),
  scheduledTime: timestamp("scheduled_time"), // If this item is scheduled for a specific time
});

// Media Folders (for organizing audio files)
export const mediaFolders = pgTable("media_folders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  path: text("path").notNull(),
  parentId: integer("parent_id").references(() => mediaFolders.id, { onDelete: "cascade" }),
  description: text("description"),
  category: text("category").default("default"), // Added folder category for icon display
  createdAt: timestamp("created_at").defaultNow(),
});

// Instant Players (for hot keys 1-9)
export const instantPlayers = pgTable("instant_players", {
  id: serial("id").primaryKey(),
  keyNumber: integer("key_number").notNull(), // 1-9
  trackId: integer("track_id").references(() => audioTracks.id, { onDelete: "set null" }),
  name: text("name"), // Optional custom name
  color: text("color"), // Optional custom color
  studio: text("studio"), // "A" or "B" - which studio this instant player belongs to
});

// Scheduled Events
export const scheduledEvents = pgTable("scheduled_events", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // "playlist", "track", "stream", "command"
  targetId: integer("target_id"), // ID of playlist or track, or URL for stream
  targetUrl: text("target_url"), // For stream URL
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  recurrence: text("recurrence"), // "none", "daily", "weekly", "monthly", etc.
  daysOfWeek: text("days_of_week").array(), // Array of days ["monday", "wednesday", etc]
  isEnabled: boolean("is_enabled").default(true),
  priority: integer("priority").default(0), // Higher priority events take precedence
  playImmediately: boolean("play_immediately").default(true), // If false, waits for current track to finish
  studio: text("studio"), // "A" or "B" - which studio this event belongs to
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Play Log (history of played tracks)
export const playLogs = pgTable("play_logs", {
  id: serial("id").primaryKey(),
  trackId: integer("track_id").references(() => audioTracks.id, { onDelete: "set null" }),
  trackTitle: text("track_title").notNull(), // Denormalized for historical records
  trackArtist: text("track_artist"),
  playlistId: integer("playlist_id").references(() => playlists.id, { onDelete: "set null" }),
  playlistName: text("playlist_name"),
  startedAt: timestamp("started_at").notNull(),
  endedAt: timestamp("ended_at"),
  duration: integer("duration"), // Actual play duration in seconds
  studio: text("studio"), // "A" or "B" - which studio this was played in
  playedBy: integer("played_by").references(() => users.id, { onDelete: "set null" }),
  isScheduled: boolean("is_scheduled").default(false),
  scheduledEventId: integer("scheduled_event_id").references(() => scheduledEvents.id, { onDelete: "set null" }),
  category: text("category"), // "music", "jingle", "commercial", etc.
});

// Commercial Clients (for traffic management)
export const commercialClients = pgTable("commercial_clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  address: text("address"),
  budget: decimal("budget"),
  budgetSpent: decimal("budget_spent").default("0"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const commercialClientsRelations = relations(commercialClients, ({ many }) => ({
  campaigns: many(commercialCampaigns),
}));

// Commercial Campaigns
export const commercialCampaigns = pgTable("commercial_campaigns", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => commercialClients.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status").notNull().default("pending"), // "pending", "active", "completed", "cancelled"
  totalSpots: integer("total_spots").notNull(),
  dailySpots: integer("daily_spots"),
  spotDuration: integer("spot_duration").notNull(), // in seconds
  daysOfWeek: text("days_of_week").array(), // Array of days ["monday", "wednesday", etc]
  timeRestrictions: text("time_restrictions"), // JSON string of time ranges
  notes: text("notes"),
  invoiceId: text("invoice_id"),
  invoiceStatus: text("invoice_status").default("pending"), // "pending", "issued", "paid"
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const commercialCampaignsRelations = relations(commercialCampaigns, ({ one }) => ({
  client: one(commercialClients, {
    fields: [commercialCampaigns.clientId],
    references: [commercialClients.id],
  }),
}));

// Commercial Spots (individual audio files for a campaign)
export const commercialSpots = pgTable("commercial_spots", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => commercialCampaigns.id, { onDelete: "cascade" }).notNull(),
  trackId: integer("track_id").references(() => audioTracks.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  isActive: boolean("is_active").default(true),
  weight: integer("weight").default(1), // For rotation weighting
  createdAt: timestamp("created_at").defaultNow(),
});

// Campaign Play Log (for tracking commercial plays and reporting)
export const campaignPlayLogs = pgTable("campaign_play_logs", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => commercialCampaigns.id, { onDelete: "cascade" }).notNull(),
  spotId: integer("spot_id").references(() => commercialSpots.id, { onDelete: "cascade" }).notNull(),
  playLogId: integer("play_log_id").references(() => playLogs.id, { onDelete: "cascade" }).notNull(),
  playedAt: timestamp("played_at").notNull(),
  studio: text("studio"), // "A" or "B"
});

export const insertAudioTrackSchema = createInsertSchema(audioTracks).pick({
  title: true,
  artist: true,
  album: true,
  duration: true,
  path: true,
  fileType: true,
  fileSize: true,
  waveformData: true,
  cuePoints: true,
  bpm: true,
  tags: true,
  category: true,
  normalizedLevel: true,
  folderId: true,
});

export const insertPlaylistSchema = createInsertSchema(playlists).pick({
  name: true,
  description: true,
  type: true,
  isActive: true,
  studio: true,
  createdBy: true,
});

export const insertPlaylistItemSchema = createInsertSchema(playlistItems).pick({
  playlistId: true,
  trackId: true,
  position: true,
  isPlayed: true,
  scheduledTime: true,
});

export const insertMediaFolderSchema = createInsertSchema(mediaFolders).pick({
  name: true,
  path: true,
  parentId: true,
  description: true,
  category: true,
});

export const insertInstantPlayerSchema = createInsertSchema(instantPlayers).pick({
  keyNumber: true,
  trackId: true,
  name: true,
  color: true,
  studio: true,
});

export const insertScheduledEventSchema = createInsertSchema(scheduledEvents).pick({
  name: true,
  type: true,
  targetId: true,
  targetUrl: true,
  startTime: true,
  endTime: true,
  recurrence: true,
  daysOfWeek: true,
  isEnabled: true,
  priority: true,
  playImmediately: true,
  studio: true,
  createdBy: true,
});

export const insertPlayLogSchema = createInsertSchema(playLogs).pick({
  trackId: true,
  trackTitle: true,
  trackArtist: true,
  playlistId: true,
  playlistName: true,
  startedAt: true,
  endedAt: true,
  duration: true,
  studio: true,
  playedBy: true,
  isScheduled: true,
  scheduledEventId: true,
  category: true,
});

export const insertCommercialClientSchema = createInsertSchema(commercialClients).pick({
  name: true,
  contactName: true,
  contactEmail: true,
  contactPhone: true,
  address: true,
  // Skip budget as it's causing errors in the database
  // budget: true,
  budgetSpent: true,
  notes: true,
  isActive: true,
});

export const insertCommercialCampaignSchema = createInsertSchema(commercialCampaigns).pick({
  clientId: true,
  name: true,
  startDate: true,
  endDate: true,
  status: true,
  totalSpots: true,
  dailySpots: true,
  spotDuration: true,
  daysOfWeek: true,
  timeRestrictions: true,
  notes: true,
  invoiceId: true,
  invoiceStatus: true,
  createdBy: true,
});

export const insertCommercialSpotSchema = createInsertSchema(commercialSpots).pick({
  campaignId: true,
  trackId: true,
  name: true,
  isActive: true,
  weight: true,
});

export const insertCampaignPlayLogSchema = createInsertSchema(campaignPlayLogs).pick({
  campaignId: true,
  spotId: true,
  playLogId: true,
  playedAt: true,
  studio: true,
});

// Define types
export type AudioTrack = typeof audioTracks.$inferSelect;
export type InsertAudioTrack = z.infer<typeof insertAudioTrackSchema>;

export type Playlist = typeof playlists.$inferSelect;
export type InsertPlaylist = z.infer<typeof insertPlaylistSchema>;

export type PlaylistItem = typeof playlistItems.$inferSelect;
export type InsertPlaylistItem = z.infer<typeof insertPlaylistItemSchema>;

export type MediaFolder = typeof mediaFolders.$inferSelect;
export type InsertMediaFolder = z.infer<typeof insertMediaFolderSchema>;

export type InstantPlayer = typeof instantPlayers.$inferSelect;
export type InsertInstantPlayer = z.infer<typeof insertInstantPlayerSchema>;

export type ScheduledEvent = typeof scheduledEvents.$inferSelect;
export type InsertScheduledEvent = z.infer<typeof insertScheduledEventSchema>;

export type PlayLog = typeof playLogs.$inferSelect;
export type InsertPlayLog = z.infer<typeof insertPlayLogSchema>;

export type CommercialClient = typeof commercialClients.$inferSelect;
export type InsertCommercialClient = z.infer<typeof insertCommercialClientSchema>;

export type CommercialCampaign = typeof commercialCampaigns.$inferSelect;
export type InsertCommercialCampaign = z.infer<typeof insertCommercialCampaignSchema>;

export type CommercialSpot = typeof commercialSpots.$inferSelect;
export type InsertCommercialSpot = z.infer<typeof insertCommercialSpotSchema>;

export type CampaignPlayLog = typeof campaignPlayLogs.$inferSelect;
export type InsertCampaignPlayLog = z.infer<typeof insertCampaignPlayLogSchema>;

// AI DJ System Tables

// AI DJ Settings
export const aiDjSettings = pgTable("ai_dj_settings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  isActive: boolean("is_active").default(false),
  durationHours: decimal("duration_hours").notNull(), // How many hours AI should control music
  mood: text("mood"), // e.g., "upbeat", "chill", "high-energy"
  genre: text("genre"), // e.g., "pop", "rock", "jazz"
  tempo: text("tempo"), // e.g., "slow", "medium", "fast"
  energyLevel: integer("energy_level").default(5), // 1-10 scale
  jingleFrequency: integer("jingle_frequency").default(4), // Insert jingle every X tracks
  stationIdFrequency: integer("station_id_frequency").default(8), // Insert station ID every X tracks
  sourceFolderIds: integer("source_folder_ids").array(), // Array of folder IDs to source music from
  timeRestrictions: text("time_restrictions"), // JSON string of time ranges
  enableCrossfading: boolean("enable_crossfading").default(true),
  crossfadeDuration: integer("crossfade_duration").default(3), // Seconds
  enableBeatMatching: boolean("enable_beat_matching").default(false),
  studioId: text("studio_id"), // "A" or "B" - which studio this AI DJ is for
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI Track Analysis
export const aiTrackAnalysis = pgTable("ai_track_analysis", {
  id: serial("id").primaryKey(),
  trackId: integer("track_id").references(() => audioTracks.id, { onDelete: "cascade" }).notNull(),
  moodTags: text("mood_tags").array(), // ["energetic", "calm", "happy", etc.]
  genreTags: text("genre_tags").array(), // ["pop", "rock", "electronic", etc.]
  tempo: integer("tempo"), // BPM detected by AI
  key: text("key"), // Musical key
  energy: decimal("energy"), // 0-1 rating
  danceability: decimal("danceability"), // 0-1 rating
  valence: decimal("valence"), // 0-1 rating (happiness/positivity)
  speechContent: decimal("speech_content"), // 0-1 rating of speech vs. music
  instrumentalness: decimal("instrumentalness"), // 0-1 rating
  acousticness: decimal("acousticness"), // 0-1 rating
  introDurationSecs: decimal("intro_duration_secs"), // Detected intro length
  outroDurationSecs: decimal("outro_duration_secs"), // Detected outro length
  vocalsStartSecs: decimal("vocals_start_secs"), // When vocals start
  aiDescription: text("ai_description"), // AI-generated description of the track
  analysisDate: timestamp("analysis_date").defaultNow(),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// AI Generated Playlists
export const aiGeneratedPlaylists = pgTable("ai_generated_playlists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Display name for the AI generated playlist
  settingsId: integer("settings_id").references(() => aiDjSettings.id, { onDelete: "cascade" }).notNull(),
  playlistId: integer("playlist_id").references(() => playlists.id, { onDelete: "cascade" }).notNull(),
  generatedAt: timestamp("generated_at").defaultNow(),
  isActive: boolean("is_active").default(false),
  studioId: text("studio_id"), // "A" or "B"
  promptUsed: text("prompt_used"), // The prompt that generated this playlist
  aiReasoning: text("ai_reasoning"), // AI explanation for the playlist arrangement
});

export const insertAiDjSettingsSchema = createInsertSchema(aiDjSettings).pick({
  name: true,
  isActive: true,
  durationHours: true,
  mood: true,
  genre: true,
  tempo: true,
  energyLevel: true,
  jingleFrequency: true, 
  stationIdFrequency: true,
  sourceFolderIds: true,
  timeRestrictions: true,
  enableCrossfading: true,
  crossfadeDuration: true,
  enableBeatMatching: true,
  studioId: true,
  createdBy: true,
});

export const insertAiTrackAnalysisSchema = createInsertSchema(aiTrackAnalysis).pick({
  trackId: true,
  moodTags: true,
  genreTags: true,
  tempo: true,
  key: true,
  energy: true,
  danceability: true,
  valence: true,
  speechContent: true,
  instrumentalness: true,
  acousticness: true,
  introDurationSecs: true,
  outroDurationSecs: true,
  vocalsStartSecs: true,
  aiDescription: true,
});

export const insertAiGeneratedPlaylistSchema = createInsertSchema(aiGeneratedPlaylists).pick({
  name: true,
  settingsId: true,
  playlistId: true,
  isActive: true,
  studioId: true,
  promptUsed: true,
  aiReasoning: true,
});

export type AiDjSettings = typeof aiDjSettings.$inferSelect;
export type InsertAiDjSettings = z.infer<typeof insertAiDjSettingsSchema>;

export type AiTrackAnalysis = typeof aiTrackAnalysis.$inferSelect;
export type InsertAiTrackAnalysis = z.infer<typeof insertAiTrackAnalysisSchema>;

export type AiGeneratedPlaylist = typeof aiGeneratedPlaylists.$inferSelect;
export type InsertAiGeneratedPlaylist = z.infer<typeof insertAiGeneratedPlaylistSchema>;

// System Settings Table for application configuration
// Audio Logger Configuration Table
export const audioLoggerConfigs = pgTable("audio_logger_configs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  inputType: text("input_type").notNull(), // 'microphone', 'line', 'sip', 'internal', 'stream'
  inputDevice: text("input_device"),
  inputChannel: integer("input_channel").default(0),
  folderId: integer("folder_id").references(() => mediaFolders.id, { onDelete: "set null" }),
  isActive: boolean("is_active").default(true),
  fileFormat: text("file_format").default("flac"),
  bitrate: integer("bitrate").default(320), // For compressed formats
  sampleRate: integer("sample_rate").default(44100),
  channels: integer("channels").default(2),
  segmentDuration: integer("segment_duration").default(3600), // In seconds (default: 1 hour)
  retentionDays: integer("retention_days").default(30), // Automatic cleanup after x days
  schedule: text("schedule"), // JSON storage for recording schedule
  triggerType: text("trigger_type").default("continuous"), // 'continuous', 'vox', 'manual', 'scheduled'
  triggerThreshold: decimal("trigger_threshold").default("0.1"), // For VOX activation, 0-1
  minDuration: integer("min_duration").default(10), // Minimum recording duration in seconds
  maxDuration: integer("max_duration"), // Maximum recording duration in seconds
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
});

// Audio Recordings Table
export const audioRecordings = pgTable("audio_recordings", {
  id: serial("id").primaryKey(),
  configId: integer("config_id").references(() => audioLoggerConfigs.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  path: text("path").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // In seconds
  fileSize: integer("file_size"), // In bytes
  format: text("format").notNull(),
  waveformData: text("waveform_data"), // JSON string of waveform data
  tags: text("tags").array(),
  notes: text("notes"),
  isArchived: boolean("is_archived").default(false),
  isFlagged: boolean("is_flagged").default(false),
  isProcessed: boolean("is_processed").default(false), // For background processing tasks
  triggerType: text("trigger_type").notNull(), // How this recording was started: 'continuous', 'vox', 'manual'
  peakLevel: decimal("peak_level"), // Peak audio level during recording
  createdAt: timestamp("created_at").defaultNow(),
});

// Audio Recording Markers (for adding markers/cues within a recording)
export const audioRecordingMarkers = pgTable("audio_recording_markers", {
  id: serial("id").primaryKey(),
  recordingId: integer("recording_id").references(() => audioRecordings.id, { onDelete: "cascade" }).notNull(),
  timestamp: integer("timestamp").notNull(), // Position in seconds from start of recording
  type: text("type").notNull().default("marker"), // 'marker', 'chapter', 'note', 'edit'
  label: text("label"),
  color: text("color"),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
});

// Audio Recording Exports (tracks exports of recording segments)
export const audioRecordingExports = pgTable("audio_recording_exports", {
  id: serial("id").primaryKey(),
  recordingId: integer("recording_id").references(() => audioRecordings.id, { onDelete: "cascade" }).notNull(),
  path: text("path").notNull(),
  format: text("format").notNull(),
  startTime: integer("start_time").notNull(), // Start position in seconds from recording start
  endTime: integer("end_time").notNull(), // End position in seconds from recording start
  duration: integer("duration").notNull(), // In seconds
  fileSize: integer("file_size"),
  destination: text("destination"), // Where was this exported to - e.g., "library", "external", "email"
  status: text("status").notNull().default("processing"), // 'processing', 'completed', 'failed'
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
});

export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'storage', 'audio', 'network', 'backup', 'general'
  name: text("name").notNull(),
  value: text("value").notNull(), // JSON stringified value
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }), // User-specific settings
  studioId: text("studio_id"), // Studio-specific settings ('A', 'B', etc.)
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSystemSettingSchema = createInsertSchema(systemSettings).pick({
  type: true,
  name: true,
  value: true,
  userId: true,
  studioId: true,
  isActive: true,
});

export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;

// Internet Radio Audio Processor and Streaming Settings

// Audio Processor Settings
export const audioProcessorSettings = pgTable("audio_processor_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  settings: jsonb("settings").notNull(), // JSON object containing all processor settings
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Stream Settings
export const streamSettings = pgTable("stream_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  settings: jsonb("settings").notNull(), // JSON object containing all stream settings 
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Audio Processor Types
export type InputFormat = 'WAV' | 'MP3' | 'AAC' | 'FLAC' | 'ASIO' | 'WASAPI' | 'DirectSound';
export type EQBand = {
  frequency: number;
  gain: number;
  q: number;
  enabled: boolean;
};

export type EqualizerSettings = {
  enabled: boolean;
  bands: EQBand[];
  highpass: { enabled: boolean; frequency: number; q: number; };
  lowpass: { enabled: boolean; frequency: number; q: number; };
  notchFilters: { enabled: boolean; frequency: number; q: number; }[];
  dynamicEQ: { enabled: boolean; frequency: number; threshold: number; ratio: number; }[];
};

export type CompressorBand = {
  id: number;
  enabled: boolean;
  frequency: number;  // Center or crossover frequency
  lowFreq?: number;
  highFreq?: number;
  threshold: number;
  ratio: number;
  attack: number;
  release: number;
  knee: number;
  gain: number;
  mode?: 'downward' | 'upward';
  solo?: boolean;
  bypass?: boolean;
};

export type CompressorSettings = {
  enabled: boolean;
  bands: CompressorBand[];
  masterThreshold: number;
  masterRatio: number;
  masterAttack: number;
  masterRelease: number;
  masterGain: number;
  agcEnabled: boolean;
  agcTarget: number;
  limiterEnabled: boolean;
  limiterThreshold: number;
  limiterRelease: number;
  deEsserEnabled: boolean;
  deEsserThreshold: number;
  gateEnabled: boolean;
  gateThreshold: number;
};

export type StereoSettings = {
  enabled: boolean;
  width: number;
  enhancer: number;
  bassEnhancer: number;
  midSideBalance: number;
  phaseRotation: number;
};

export type PreprocessingSettings = {
  declipperEnabled: boolean;
  declipperThreshold: number;
  noiseReductionEnabled: boolean;
  noiseReductionAmount: number;
  humFilterEnabled: boolean;
  humFilterFrequency: number;
  phaseCorrection: boolean;
};

export type FMSettings = {
  enabled: boolean;
  preEmphasis: '50µs' | '75µs' | 'off';
  stereoEncoder: boolean;
  pilotLevel: number;
  compositeClipper: number;
  rdsEnabled: boolean;
};

export type StreamEncoderSettings = {
  format: 'MP3' | 'AAC' | 'OPUS';
  bitrate: number;
  sampleRate: number;
  channels: 1 | 2;
  quality: number;
};

export type ProcessorSettings = {
  inputSettings: {
    format: InputFormat;
    gain: number;
    balance: number;
  };
  outputSettings: {
    gain: number;
    limiter: boolean;
    limiterThreshold: number;
    truePeakLimiting: boolean;
    latencyCompensation: number;
  };
  preprocessing: PreprocessingSettings;
  equalizer: EqualizerSettings;
  compressor: CompressorSettings;
  stereo: StereoSettings;
  fm: FMSettings;
  loudness: {
    target: number;
    enabled: boolean;
    normalizeToEBUR128: boolean;
  };
  streamEncoder: StreamEncoderSettings;
  visualization: {
    spectrumAnalyzerEnabled: boolean;
    goniometerEnabled: boolean;
    stereoCorrelationEnabled: boolean;
    lufsMetersEnabled: boolean;
  };
  presets: {
    selected: string;
    custom: Record<string, any>[];
  };
};

// Types
export type AudioProcessorSettings = typeof audioProcessorSettings.$inferSelect;
export type StreamSettings = typeof streamSettings.$inferSelect;

// Insert schemas
export const insertAudioProcessorSettingsSchema = createInsertSchema(audioProcessorSettings).pick({
  userId: true,
  settings: true,
});

export const insertStreamSettingsSchema = createInsertSchema(streamSettings).pick({
  userId: true,
  settings: true,
});

export type InsertAudioProcessorSettings = z.infer<typeof insertAudioProcessorSettingsSchema>;
export type InsertStreamSettings = z.infer<typeof insertStreamSettingsSchema>;

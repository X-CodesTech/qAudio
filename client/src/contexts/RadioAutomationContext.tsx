import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { formatDuration } from '@/lib/formatters';

// Define types for our data models
export type MediaFolder = {
  id: number;
  name: string;
  path: string;
  parentId: number | null;
  description: string | null;
  createdAt: Date | null;
};

type AudioTrack = {
  id: number;
  title: string;
  artist: string | null;
  album: string | null;
  duration: number;
  path: string;
  fileType: string;
  fileSize: number | null;
  waveformData: string | null;
  cuePoints: string | null;
  bpm: string | null;
  tags: string[] | null;
  category: string | null;
  normalizedLevel: string | null;
  folderId: number | null;
  createdAt: Date | null;
  lastPlayedAt: Date | null;
  playCount: number | null;
  // UI-friendly versions of the above
  durationFormatted?: string;
  fileSizeFormatted?: string;
};

type Playlist = {
  id: number;
  name: string;
  description: string | null;
  type: string;
  isActive: boolean;
  studio: string | null;
  createdBy: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

type PlaylistItem = {
  id: number;
  playlistId: number;
  trackId: number;
  position: number;
  isPlayed: boolean;
  lastPlayedAt: Date | null;
  scheduledTime: Date | null;
  track?: AudioTrack | null;
};

type PlaylistWithItems = Playlist & {
  items: (PlaylistItem & { track: AudioTrack | null })[];
};

type InstantPlayer = {
  id: number;
  keyNumber: number;
  trackId: number | null;
  name: string | null;
  color: string | null;
  studio: string;
  track?: AudioTrack | null;
};

type ScheduledEvent = {
  id: number;
  name: string;
  type: string;
  targetId: number | null;
  targetUrl: string | null;
  startTime: Date;
  endTime: Date | null;
  recurrence: string | null;
  daysOfWeek: string[] | null;
  isEnabled: boolean;
  priority: number;
  playImmediately: boolean;
  studio: string | null;
  createdBy: number | null;
  createdAt: Date | null;
};

type PlaybackState = {
  studio: 'A' | 'B';
  status: 'playing' | 'paused' | 'stopped';
  currentTrack: AudioTrack | null;
  currentPlaylist: Playlist | null;
  currentPosition: number;
  nextTrack: AudioTrack | null;
};

// Context type definition
type RadioAutomationContextType = {
  // Playback state and control
  playbackState: Record<string, PlaybackState>;
  controlPlayback: (action: string, studio: string) => Promise<void>;
  
  // Query client for direct cache access
  queryClient: ReturnType<typeof useQueryClient>;
  
  // Audio tracks
  tracks: AudioTrack[];
  tracksLoading: boolean;
  tracksError: Error | null;
  getTracksForFolder: (folderId: number | null) => Promise<AudioTrack[]>;
  searchTracks: (query: string) => Promise<AudioTrack[]>;
  uploadTrack: (file: File, metadata: Partial<AudioTrack>) => Promise<AudioTrack>;
  updateTrackMutation: any; // Add track update mutation for category updates
  deleteTrack: (id: number) => Promise<void>;
  
  // Playlists
  playlists: Playlist[];
  playlistsLoading: boolean;
  playlistsError: Error | null;
  createPlaylist: (playlist: Partial<Playlist>) => Promise<Playlist>;
  updatePlaylist: (id: number, playlist: Partial<Playlist>) => Promise<Playlist>;
  deletePlaylist: (id: number) => Promise<void>;
  getPlaylistItems: (playlistId: number) => Promise<PlaylistItem[]>;
  addTrackToPlaylist: (playlistId: number, trackId: number, position: number) => Promise<void>;
  removeTrackFromPlaylist: (playlistId: number, itemId: number) => Promise<void>;
  setActivePlaylist: (playlistId: number, studio: string) => Promise<void>;
  
  // Player operations
  addTrackToPlayerPlaylist: (studio: string, track: AudioTrack) => Promise<void>;
  
  // Media Folders
  folders: MediaFolder[];
  foldersLoading: boolean;
  foldersError: Error | null;
  createFolder: (folder: Partial<MediaFolder>) => Promise<MediaFolder>;
  createFolderMutation: ReturnType<typeof useMutation<MediaFolder, Error, Partial<MediaFolder>>>;
  updateFolder: (id: number, folder: Partial<MediaFolder>) => Promise<MediaFolder>;
  deleteFolder: (id: number) => Promise<void>;

  // Instant Players
  instantPlayers: InstantPlayer[];
  instantPlayersLoading: boolean;
  instantPlayersError: Error | null;
  getInstantPlayersForStudio: (studio: string) => InstantPlayer[];
  setInstantPlayer: (player: Partial<InstantPlayer>) => Promise<InstantPlayer>;
  clearInstantPlayer: (keyNumber: number, studio: string) => Promise<void>;
  playInstantPlayer: (keyNumber: number, studio: string) => Promise<void>;
  
  // Scheduled Events
  scheduledEvents: ScheduledEvent[];
  scheduledEventsLoading: boolean;
  scheduledEventsError: Error | null;
  getUpcomingEvents: (studio?: string, limit?: number) => Promise<ScheduledEvent[]>;
  createScheduledEvent: (event: Partial<ScheduledEvent>) => Promise<ScheduledEvent>;
  updateScheduledEvent: (id: number, event: Partial<ScheduledEvent>) => Promise<ScheduledEvent>;
  deleteScheduledEvent: (id: number) => Promise<void>;
  
  // UI State
  selectedFolderId: number | null;
  setSelectedFolderId: (id: number | null) => void;
  selectedPlaylistId: number | null;
  setSelectedPlaylistId: (id: number | null) => void;
  selectedStudio: 'A' | 'B';
  setSelectedStudio: (studio: 'A' | 'B') => void;
};

// Create Context
export const RadioAutomationContext = createContext<RadioAutomationContextType | null>(null);

// Provider Component
export const RadioAutomationProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // UI State
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<number | null>(null);
  const [selectedStudio, setSelectedStudio] = useState<'A' | 'B'>('A');
  
  // Set up WebSocket connection for real-time updates
  useEffect(() => {
    // Determine protocol based on current connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log('WebSocket connection established for radio automation');
    };
    
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'playback_update') {
        // Update playback state
        queryClient.setQueryData(['radio/playback'], data.data);
      }
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };
    
    return () => {
      socket.close();
    };
  }, [queryClient]);
  
  // === API DATA QUERIES ===
  
  // Playback State
  const { 
    data: playbackState = { A: defaultPlaybackState('A'), B: defaultPlaybackState('B') },
    isError: playbackStateError
  } = useQuery<Record<string, PlaybackState>, Error>({
    queryKey: ['radio/playback'],
    queryFn: () => fetch('/api/radio/playback').then(res => {
      if (!res.ok) {
        // Handle 401 errors silently without throwing an exception
        if (res.status === 401) {
          console.log('User not authenticated for playback state retrieval');
          return { A: defaultPlaybackState('A'), B: defaultPlaybackState('B') };
        }
        throw new Error('Failed to fetch playback state');
      }
      return res.json();
    }),
    staleTime: 1000, // Poll more frequently for playback
    refetchInterval: 2000 // Poll every 2 seconds to keep playback state updated
  });
  
  // Audio Tracks
  const {
    data: tracks = [],
    isLoading: tracksLoading,
    error: tracksError
  } = useQuery<AudioTrack[], Error>({
    queryKey: ['radio/tracks', selectedFolderId],
    queryFn: () => {
      const url = selectedFolderId 
        ? `/api/radio/tracks?folderId=${selectedFolderId}` 
        : '/api/radio/tracks';
      return fetch(url).then(res => {
        if (!res.ok) {
          // Handle 401 errors silently without throwing an exception
          if (res.status === 401) {
            console.log('User not authenticated for track retrieval');
            return [];
          }
          throw new Error('Failed to fetch tracks');
        }
        return res.json().then((data: AudioTrack[]) => {
          // Process all tracks to ensure they have formatted durations
          return data.map(track => ({
            ...track,
            durationFormatted: formatDuration(track.duration)
          }));
        });
      });
    }
  });
  
  // Playlists
  const {
    data: playlists = [],
    isLoading: playlistsLoading,
    error: playlistsError
  } = useQuery<Playlist[], Error>({
    queryKey: ['radio/playlists'],
    queryFn: () => fetch('/api/radio/playlists').then(res => {
      if (!res.ok) {
        // Handle 401 errors silently without throwing an exception
        if (res.status === 401) {
          console.log('User not authenticated for playlist retrieval');
          return [];
        }
        throw new Error('Failed to fetch playlists');
      }
      return res.json();
    })
  });
  
  // Media Folders
  const {
    data: folders = [],
    isLoading: foldersLoading,
    error: foldersError
  } = useQuery<MediaFolder[], Error>({
    queryKey: ['radio/folders'],
    queryFn: () => fetch('/api/radio/folders').then(res => {
      if (!res.ok) {
        // Handle 401 errors silently without throwing an exception
        if (res.status === 401) {
          console.log('User not authenticated for folder retrieval');
          return [];
        }
        throw new Error('Failed to fetch folders');
      }
      return res.json();
    })
  });
  
  // Instant Players
  const {
    data: instantPlayers = [],
    isLoading: instantPlayersLoading,
    error: instantPlayersError
  } = useQuery<InstantPlayer[], Error>({
    queryKey: ['radio/instant-players'],
    queryFn: () => fetch(`/api/radio/instant-players`).then(res => {
      if (!res.ok) {
        // Handle 401 errors silently without throwing an exception
        if (res.status === 401) {
          console.log('User not authenticated for instant players retrieval');
          return [];
        }
        throw new Error('Failed to fetch instant players');
      }
      return res.json();
    })
  });
  
  // Scheduled Events
  const {
    data: scheduledEvents = [],
    isLoading: scheduledEventsLoading,
    error: scheduledEventsError
  } = useQuery<ScheduledEvent[], Error>({
    queryKey: ['radio/scheduled-events'],
    queryFn: () => fetch('/api/radio/scheduled-events').then(res => {
      if (!res.ok) {
        // Handle 401 errors silently without throwing an exception
        if (res.status === 401) {
          console.log('User not authenticated for scheduled events retrieval');
          return [];
        }
        throw new Error('Failed to fetch scheduled events');
      }
      return res.json();
    })
  });
  
  // === MUTATIONS ===
  
  // Playback Control
  const controlPlaybackMutation = useMutation({
    mutationFn: async ({ action, studio }: { action: string, studio: string }) => {
      const response = await fetch(`/api/radio/playback/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studio })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${action} playback`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['radio/playback'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Playback Control Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Track Upload
  const uploadTrackMutation = useMutation({
    mutationFn: async ({ file, metadata }: { file: File; metadata: Partial<AudioTrack> }) => {
      const formData = new FormData();
      formData.append('file', file);
      
      // Add metadata fields to form data
      Object.entries(metadata).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });
      
      const response = await fetch('/api/radio/tracks/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload track');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate all tracks queries to refresh lists
      queryClient.invalidateQueries({ queryKey: ['radio/tracks'] });
      
      // Also invalidate specific folder tracks to refresh the folder content
      if (data && data.folderId) {
        console.log('Refreshing folder tracks after upload:', data.folderId);
        queryClient.invalidateQueries({ queryKey: ['radio/tracks'] });
      }
      
      toast({
        title: 'Success',
        description: 'Track uploaded successfully'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Delete Track
  const deleteTrackMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/radio/tracks/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete track');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['radio/tracks'] });
      toast({
        title: 'Success',
        description: 'Track deleted successfully'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Delete Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Update Track
  const updateTrackMutation = useMutation({
    mutationFn: async ({ id, ...trackData }: { id: number, [key: string]: any }) => {
      const response = await fetch(`/api/radio/tracks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trackData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update track');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['radio/tracks'] });
      toast({
        title: 'Success',
        description: 'Track updated successfully'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Create Playlist
  const createPlaylistMutation = useMutation({
    mutationFn: async (playlist: Partial<Playlist>) => {
      const response = await fetch('/api/radio/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(playlist)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create playlist');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['radio/playlists'] });
      toast({
        title: 'Success',
        description: 'Playlist created successfully'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Create Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Update Playlist
  const updatePlaylistMutation = useMutation({
    mutationFn: async ({ id, playlist }: { id: number, playlist: Partial<Playlist> }) => {
      const response = await fetch(`/api/radio/playlists/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(playlist)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update playlist');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['radio/playlists'] });
      toast({
        title: 'Success',
        description: 'Playlist updated successfully'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Delete Playlist
  const deletePlaylistMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/radio/playlists/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete playlist');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['radio/playlists'] });
      toast({
        title: 'Success',
        description: 'Playlist deleted successfully'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Delete Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Delete Folder
  const deleteFolderMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/radio/folders/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete folder');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['radio/folders'] });
      toast({
        title: 'Success',
        description: 'Folder deleted successfully'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Delete Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Add Track to Playlist
  const addTrackToPlaylistMutation = useMutation({
    mutationFn: async ({ playlistId, trackId, position }: { playlistId: number, trackId: number, position: number }) => {
      const response = await fetch(`/api/radio/playlists/${playlistId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId, position })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add track to playlist');
      }
      
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['radio/playlists', variables.playlistId, 'items'] });
      toast({
        title: 'Success',
        description: 'Track added to playlist'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Remove Track from Playlist
  const removeTrackFromPlaylistMutation = useMutation({
    mutationFn: async ({ playlistId, itemId }: { playlistId: number, itemId: number }) => {
      const response = await fetch(`/api/radio/playlists/${playlistId}/items/${itemId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove track from playlist');
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['radio/playlists', variables.playlistId, 'items'] });
      toast({
        title: 'Success',
        description: 'Track removed from playlist'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Set Active Playlist
  const setActivePlaylistMutation = useMutation({
    mutationFn: async ({ playlistId, studio }: { playlistId: number, studio: string }) => {
      const response = await fetch(`/api/radio/playlists/${playlistId}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studio })
      });
      
      if (!response.ok) {
        throw new Error('Failed to activate playlist');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['radio/playlists'] });
      queryClient.invalidateQueries({ queryKey: ['radio/playback'] });
      toast({
        title: 'Success',
        description: 'Playlist activated successfully'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Activation Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Create Folder
  const createFolderMutation = useMutation({
    mutationFn: async (folder: Partial<MediaFolder>) => {
      const response = await fetch('/api/radio/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(folder)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create folder');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['radio/folders'] });
      toast({
        title: 'Success',
        description: 'Folder created successfully'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Create Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Update Folder
  const updateFolderMutation = useMutation({
    mutationFn: async ({ id, folder }: { id: number, folder: Partial<MediaFolder> }) => {
      const response = await fetch(`/api/radio/folders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(folder)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update folder');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['radio/folders'] });
      toast({
        title: 'Success',
        description: 'Folder updated successfully'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Set Instant Player
  const setInstantPlayerMutation = useMutation({
    mutationFn: async (player: Partial<InstantPlayer>) => {
      const response = await fetch('/api/radio/instant-players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(player)
      });
      
      if (!response.ok) {
        throw new Error('Failed to set instant player');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['radio/instant-players'] });
      toast({
        title: 'Success',
        description: 'Instant player configured successfully'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Configuration Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Clear Instant Player
  const clearInstantPlayerMutation = useMutation({
    mutationFn: async ({ keyNumber, studio }: { keyNumber: number, studio: string }) => {
      const response = await fetch(`/api/radio/instant-players/${keyNumber}/${studio}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to clear instant player');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['radio/instant-players'] });
      toast({
        title: 'Success',
        description: 'Instant player cleared successfully'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Clear Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Play Instant Player
  const playInstantPlayerMutation = useMutation({
    mutationFn: async ({ keyNumber, studio }: { keyNumber: number, studio: string }) => {
      const response = await fetch(`/api/radio/instant-players/${keyNumber}/${studio}/play`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to play instant player');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['radio/playback'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Playback Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Create Scheduled Event
  const createScheduledEventMutation = useMutation({
    mutationFn: async (event: Partial<ScheduledEvent>) => {
      const response = await fetch('/api/radio/scheduled-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create scheduled event');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['radio/scheduled-events'] });
      toast({
        title: 'Success',
        description: 'Event scheduled successfully'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Scheduling Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Update Scheduled Event
  const updateScheduledEventMutation = useMutation({
    mutationFn: async ({ id, event }: { id: number, event: Partial<ScheduledEvent> }) => {
      const response = await fetch(`/api/radio/scheduled-events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update scheduled event');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['radio/scheduled-events'] });
      toast({
        title: 'Success',
        description: 'Event updated successfully'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Delete Scheduled Event
  const deleteScheduledEventMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/radio/scheduled-events/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete scheduled event');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['radio/scheduled-events'] });
      toast({
        title: 'Success',
        description: 'Event deleted successfully'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Delete Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // ===== UTILITY FUNCTIONS =====
  
  // Create default playback state for a studio
  function defaultPlaybackState(studio: 'A' | 'B'): PlaybackState {
    return {
      studio,
      status: 'stopped',
      currentTrack: null,
      currentPlaylist: null,
      currentPosition: 0,
      nextTrack: null
    };
  }
  
  // Get tracks for a specific folder
  const getTracksForFolder = async (folderId: number | null): Promise<AudioTrack[]> => {
    setSelectedFolderId(folderId);
    
    // Special handling for "mazen" and "basma" folders
    const specialFolders = {
      mazen: 3,  // Adjust this to match the actual folder ID for "mazen"
      basma: 4   // Adjust this to match the actual folder ID for "basma"
    };
    
    const isSpecialFolder = folderId === specialFolders.mazen || folderId === specialFolders.basma;
    if (isSpecialFolder) {
      console.log(`Special folder requested: ${folderId === specialFolders.mazen ? 'mazen' : 'basma'}`);
    }
    
    let url = folderId 
      ? `/api/radio/tracks?folderId=${folderId}` 
      : '/api/radio/tracks';
    
    // Invalidate the cache to ensure we get fresh data
    queryClient.invalidateQueries({ queryKey: ['radio/tracks'] });
    
    try {
      // Always include credentials in the fetch request
      console.log(`Fetching tracks for folder ID ${folderId} from: ${url}`);
      
      // Correctly append dragDrop parameter to URL with either ? or & as needed
      const dragDropParam = url.includes('?') ? '&dragDrop=true' : '?dragDrop=true';
      const response = await fetch(url + dragDropParam, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'X-Direct-Access': 'true',
          'X-DragDrop-Operation': 'true' // Add header to identify drag and drop operations
        }
      });
      
      console.log(`Response status for folder ${folderId}: ${response.status}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          console.log('User not authenticated for folder tracks retrieval');
          toast({
            title: 'Authentication Required',
            description: 'Please refresh the page and log in again to view folder contents',
            variant: 'destructive',
          });
          return [];
        }
        
        // For special folders, try with alternate URL format
        if (isSpecialFolder) {
          console.log(`Trying alternate URL format for special folder ${folderId}`);
          // Some servers expect 'folder' instead of 'folderId'
          const altUrl = `/api/radio/tracks?folder=${folderId}&dragDrop=true`;
          
          const altResponse = await fetch(altUrl, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'X-Direct-Access': 'true',
              'X-DragDrop-Operation': 'true' // Add header to identify drag and drop operations
            }
          });
          
          if (altResponse.ok) {
            const altData = await altResponse.json();
            console.log(`Success with alternate URL! Found ${altData.length} tracks for folder ${folderId}`);
            return altData;
          } else {
            console.error(`Alternate URL also failed: ${altResponse.status}`);
          }
        }
        
        throw new Error(`Failed to fetch tracks: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`Successfully fetched ${data.length} tracks for folder ${folderId}`);
      
      // If we got an empty array for a special folder, try the other URL format
      if (data.length === 0 && isSpecialFolder) {
        console.log(`Got empty array for special folder ${folderId}, trying alternate URL`);
        const altUrl = `/api/radio/tracks?folder=${folderId}&dragDrop=true`;
        
        const altResponse = await fetch(altUrl, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'X-Direct-Access': 'true',
            'X-DragDrop-Operation': 'true' // Add header to identify drag and drop operations
          }
        });
        
        if (altResponse.ok) {
          const altData = await altResponse.json();
          console.log(`Alternate URL returned ${altData.length} tracks for folder ${folderId}`);
          if (altData.length > 0) {
            return altData;
          }
        }
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching tracks:', error);
      
      // One final try for special folders - use a direct fetch
      if (isSpecialFolder) {
        try {
          console.log(`Final attempt for special folder ${folderId} - direct fetch with no query params`);
          
          // Try getting all tracks and filtering client-side
          const finalResponse = await fetch('/api/radio/tracks', {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'X-Direct-Access': 'true'
            }
          });
          
          if (finalResponse.ok) {
            const allTracks = await finalResponse.json();
            // Filter tracks by folderId
            const folderTracks = allTracks.filter((track: AudioTrack) => track.folderId === folderId);
            console.log(`Client-side filtering found ${folderTracks.length} tracks for folder ${folderId}`);
            return folderTracks;
          }
        } catch (finalError) {
          console.error('Final attempt error:', finalError);
        }
      }
      
      return [];
    }
  };
  
  // Search tracks by query string
  const searchTracks = async (query: string): Promise<AudioTrack[]> => {
    try {
      const response = await fetch(`/api/radio/tracks?search=${encodeURIComponent(query)}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Direct-Access': 'true'
        }
      });
      
      if (!response.ok) {
        console.log(`Search tracks failed with status: ${response.status}`);
        return [];
      }
      
      const data = await response.json();
      console.log(`Successfully searched tracks, found ${data.length} results`);
      return data;
    } catch (error) {
      console.error('Error searching tracks:', error);
      return [];
    }
  };
  
  // Get playlist items
  const getPlaylistItems = async (playlistId: number): Promise<PlaylistItem[]> => {
    try {
      const response = await fetch(`/api/radio/playlists/${playlistId}/items`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        console.log(`Playlist items retrieval failed with status: ${response.status}`);
        return [];
      }
      
      const data = await response.json();
      console.log(`Successfully fetched ${data.length} playlist items for playlist ${playlistId}`);
      
      // Format track durations for all items that have track data
      return data.map((item: PlaylistItem) => {
        if (item.track && item.track.duration) {
          return {
            ...item,
            track: {
              ...item.track,
              durationFormatted: formatDuration(item.track.duration)
            }
          };
        }
        return item;
      });
    } catch (error) {
      console.error('Error fetching playlist items:', error);
      return [];
    }
  };
  
  // Get upcoming events
  const getUpcomingEvents = async (studio?: string, limit?: number): Promise<ScheduledEvent[]> => {
    try {
      let url = '/api/radio/upcoming-events';
      const params = new URLSearchParams();
      
      if (studio) params.append('studio', studio);
      if (limit) params.append('limit', limit.toString());
      
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        console.log(`Upcoming events retrieval failed with status: ${response.status}`);
        return [];
      }
      
      const data = await response.json();
      console.log(`Successfully fetched ${data.length} upcoming events`);
      return data;
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      return [];
    }
  };
  
  // Filter instant players by studio
  const getInstantPlayersForStudio = (studio: string): InstantPlayer[] => {
    return instantPlayers.filter(player => player.studio === studio);
  };
  
  // Context value with all data and functions
  // Add track to player playlist
  const addTrackToPlayerPlaylistMutation = useMutation({
    mutationFn: async ({ studio, track }: { studio: string, track: AudioTrack }) => {
      // Find active playlist for the studio
      const targetPlaylist = playlists.find(p => p.isActive && p.studio === studio);
      
      if (!targetPlaylist) {
        throw new Error(`No active playlist found for studio ${studio}`);
      }
      
      // Add track to this playlist at the end
      const items = await getPlaylistItems(targetPlaylist.id);
      const position = items.length > 0 ? Math.max(...items.map(item => item.position)) + 1 : 0;
      
      // Call addTrackToPlaylistMutation directly instead of using the function wrapper
      await addTrackToPlaylistMutation.mutateAsync({ 
        playlistId: targetPlaylist.id, 
        trackId: track.id, 
        position 
      });
      
      return { success: true, message: `Track "${track.title}" added to ${studio} playlist` };
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['radio/playlists'] });
      
      toast({
        title: 'Success',
        description: data.message
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Add to Player Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const value: RadioAutomationContextType = {
    // Playback state and control
    playbackState,
    controlPlayback: async (action: string, studio: string) => {
      await controlPlaybackMutation.mutateAsync({ action, studio });
    },
    
    // Query client for direct cache access
    queryClient,
    
    // Audio tracks
    tracks,
    tracksLoading,
    tracksError,
    getTracksForFolder,
    searchTracks,
    uploadTrack: async (file: File, metadata: Partial<AudioTrack>) => {
      return await uploadTrackMutation.mutateAsync({ file, metadata });
    },
    updateTrackMutation,
    deleteTrack: async (id: number) => {
      await deleteTrackMutation.mutateAsync(id);
    },
    
    // Playlists
    playlists,
    playlistsLoading,
    playlistsError,
    createPlaylist: async (playlist: Partial<Playlist>) => {
      return await createPlaylistMutation.mutateAsync(playlist);
    },
    updatePlaylist: async (id: number, playlist: Partial<Playlist>) => {
      return await updatePlaylistMutation.mutateAsync({ id, playlist });
    },
    deletePlaylist: async (id: number) => {
      await deletePlaylistMutation.mutateAsync(id);
    },
    getPlaylistItems,
    addTrackToPlaylist: async (playlistId: number, trackId: number, position: number) => {
      await addTrackToPlaylistMutation.mutateAsync({ playlistId, trackId, position });
    },
    removeTrackFromPlaylist: async (playlistId: number, itemId: number) => {
      await removeTrackFromPlaylistMutation.mutateAsync({ playlistId, itemId });
    },
    setActivePlaylist: async (playlistId: number, studio: string) => {
      await setActivePlaylistMutation.mutateAsync({ playlistId, studio });
    },
    
    // Player operations
    addTrackToPlayerPlaylist: async (studio: string, track: AudioTrack) => {
      await addTrackToPlayerPlaylistMutation.mutateAsync({ studio, track });
    },
    
    // Media Folders
    folders,
    foldersLoading,
    foldersError,
    createFolder: async (folder: Partial<MediaFolder>) => {
      return await createFolderMutation.mutateAsync(folder);
    },
    createFolderMutation, // Expose mutation for folder creation dialog
    updateFolder: async (id: number, folder: Partial<MediaFolder>) => {
      return await updateFolderMutation.mutateAsync({ id, folder });
    },
    deleteFolder: async (id: number) => {
      await deleteFolderMutation.mutateAsync(id);
    },

    // Instant Players
    instantPlayers,
    instantPlayersLoading,
    instantPlayersError,
    getInstantPlayersForStudio,
    setInstantPlayer: async (player: Partial<InstantPlayer>) => {
      return await setInstantPlayerMutation.mutateAsync(player);
    },
    clearInstantPlayer: async (keyNumber: number, studio: string) => {
      await clearInstantPlayerMutation.mutateAsync({ keyNumber, studio });
    },
    playInstantPlayer: async (keyNumber: number, studio: string) => {
      await playInstantPlayerMutation.mutateAsync({ keyNumber, studio });
    },
    
    // Scheduled Events
    scheduledEvents,
    scheduledEventsLoading,
    scheduledEventsError,
    getUpcomingEvents,
    createScheduledEvent: async (event: Partial<ScheduledEvent>) => {
      return await createScheduledEventMutation.mutateAsync(event);
    },
    updateScheduledEvent: async (id: number, event: Partial<ScheduledEvent>) => {
      return await updateScheduledEventMutation.mutateAsync({ id, event });
    },
    deleteScheduledEvent: async (id: number) => {
      await deleteScheduledEventMutation.mutateAsync(id);
    },
    
    // UI State
    selectedFolderId,
    setSelectedFolderId,
    selectedPlaylistId,
    setSelectedPlaylistId,
    selectedStudio,
    setSelectedStudio
  };
  
  // Display warning toast if playback state error occurs
  useEffect(() => {
    if (playbackStateError) {
      toast({
        title: 'Playback Connection Error',
        description: 'Unable to connect to playback system. Some features may be unavailable.',
        variant: 'destructive'
      });
    }
  }, [playbackStateError, toast]);
  
  return (
    <RadioAutomationContext.Provider value={value}>
      {children}
    </RadioAutomationContext.Provider>
  );
};

// Custom hook to use the context
export const useRadioAutomation = () => {
  const context = useContext(RadioAutomationContext);
  if (!context) {
    throw new Error('useRadioAutomation must be used within a RadioAutomationProvider');
  }
  return context;
};
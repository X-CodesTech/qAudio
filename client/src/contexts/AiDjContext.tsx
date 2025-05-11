import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { AiDjSettings, AiTrackAnalysis, AiGeneratedPlaylist } from '@shared/schema';

interface AiDjContextType {
  // AI DJ Settings
  settings: AiDjSettings[] | undefined;
  activeSetting: AiDjSettings | undefined;
  isLoadingSettings: boolean;
  createSettingMutation: any;
  updateSettingMutation: any;
  deleteSettingMutation: any;
  activateSettingMutation: any;
  
  // Track Analysis
  analyzedTracks: Record<number, AiTrackAnalysis>;
  isAnalyzing: boolean;
  analyzeTrackMutation: any;
  batchAnalyzeMutation: any;
  
  // Generated Playlists
  generatedPlaylists: AiGeneratedPlaylist[] | undefined;
  isGeneratingPlaylist: boolean;
  generatePlaylistMutation: any;
  activatePlaylistMutation: any;
  
  // Selected studio
  selectedStudio: 'A' | 'B' | undefined;
  setSelectedStudio: (studio: 'A' | 'B' | undefined) => void;
}

const AiDjContext = createContext<AiDjContextType | null>(null);

export const useAiDj = () => {
  const context = useContext(AiDjContext);
  if (!context) {
    throw new Error('useAiDj must be used within an AiDjProvider');
  }
  return context;
};

export const AiDjProvider = ({ children }: { children: ReactNode }) => {
  const [selectedStudio, setSelectedStudio] = useState<'A' | 'B' | undefined>(undefined);
  const [analyzedTracks, setAnalyzedTracks] = useState<Record<number, AiTrackAnalysis>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for AI DJ settings
  const {
    data: settings,
    isLoading: isLoadingSettings,
  } = useQuery({
    queryKey: ['/api/ai-dj/settings', selectedStudio],
    queryFn: async ({ queryKey }) => {
      const [_, studio] = queryKey;
      const url = studio ? `/api/ai-dj/settings?studioId=${studio}` : '/api/ai-dj/settings';
      return await fetch(url).then(res => {
        if (!res.ok) throw new Error('Failed to fetch AI DJ settings');
        return res.json();
      });
    },
    enabled: true,
  });

  // Query for active setting
  const activeSetting = settings?.find(s => s.isActive);

  // Query for generated playlists
  const {
    data: generatedPlaylists,
    isLoading: isLoadingPlaylists,
  } = useQuery({
    queryKey: ['/api/ai-dj/playlists', selectedStudio],
    queryFn: async ({ queryKey }) => {
      const [_, studio] = queryKey;
      const url = studio ? `/api/ai-dj/playlists?studioId=${studio}` : '/api/ai-dj/playlists';
      return await fetch(url).then(res => {
        if (!res.ok) throw new Error('Failed to fetch AI generated playlists');
        return res.json();
      });
    },
    enabled: true,
  });

  // Mutation to create a new AI DJ setting
  const createSettingMutation = useMutation({
    mutationFn: async (newSetting: Partial<AiDjSettings>) => {
      const res = await fetch('/api/ai-dj/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSetting),
      });
      
      if (!res.ok) throw new Error('Failed to create AI DJ setting');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-dj/settings'] });
      toast({
        title: 'Success',
        description: 'AI DJ setting created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create AI DJ setting',
        variant: 'destructive',
      });
    },
  });

  // Mutation to update an AI DJ setting
  const updateSettingMutation = useMutation({
    mutationFn: async ({ id, setting }: { id: number; setting: Partial<AiDjSettings> }) => {
      const res = await fetch(`/api/ai-dj/settings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setting),
      });
      
      if (!res.ok) throw new Error('Failed to update AI DJ setting');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-dj/settings'] });
      toast({
        title: 'Success',
        description: 'AI DJ setting updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update AI DJ setting',
        variant: 'destructive',
      });
    },
  });

  // Mutation to delete an AI DJ setting
  const deleteSettingMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/ai-dj/settings/${id}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) throw new Error('Failed to delete AI DJ setting');
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-dj/settings'] });
      toast({
        title: 'Success',
        description: 'AI DJ setting deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete AI DJ setting',
        variant: 'destructive',
      });
    },
  });

  // Mutation to activate an AI DJ setting
  const activateSettingMutation = useMutation({
    mutationFn: async ({ id, activate }: { id: number; activate: boolean }) => {
      const res = await fetch(`/api/ai-dj/settings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: activate }),
      });
      
      if (!res.ok) throw new Error(`Failed to ${activate ? 'activate' : 'deactivate'} AI DJ setting`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-dj/settings'] });
      toast({
        title: 'Success',
        description: 'AI DJ setting activation status updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update AI DJ setting activation status',
        variant: 'destructive',
      });
    },
  });

  // Mutation to analyze a track
  const analyzeTrackMutation = useMutation({
    mutationFn: async (trackId: number) => {
      const res = await fetch(`/api/ai-dj/analyze-track/${trackId}`, {
        method: 'POST',
      });
      
      if (!res.ok) throw new Error('Failed to analyze track');
      return await res.json();
    },
    onSuccess: (data) => {
      setAnalyzedTracks(prev => ({
        ...prev,
        [data.trackId]: data,
      }));
      toast({
        title: 'Success',
        description: 'Track analyzed successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to analyze track',
        variant: 'destructive',
      });
    },
  });

  // Mutation to batch analyze tracks
  const batchAnalyzeMutation = useMutation({
    mutationFn: async (trackIds: number[]) => {
      const res = await fetch('/api/ai-dj/batch-analyze-tracks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackIds }),
      });
      
      if (!res.ok) throw new Error('Failed to batch analyze tracks');
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Batch Analysis Started',
        description: `Processing ${data.totalCount} tracks. This may take some time.`,
      });
      
      // After a short delay, refresh the track analysis data
      setTimeout(() => {
        Promise.all(
          data.trackIds?.map((id: number) => 
            fetch(`/api/ai-dj/track-analysis/${id}`).then(res => res.ok ? res.json() : null)
          ) || []
        ).then(analyses => {
          const newAnalyzedTracks = { ...analyzedTracks };
          analyses.forEach(analysis => {
            if (analysis && analysis.trackId) {
              newAnalyzedTracks[analysis.trackId] = analysis;
            }
          });
          setAnalyzedTracks(newAnalyzedTracks);
        });
      }, 5000);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to batch analyze tracks',
        variant: 'destructive',
      });
    },
  });

  // Mutation to generate a playlist
  const generatePlaylistMutation = useMutation({
    mutationFn: async ({ settingsId, name }: { settingsId: number; name?: string }) => {
      const res = await fetch('/api/ai-dj/generate-playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settingsId, name }),
      });
      
      if (!res.ok) throw new Error('Failed to generate playlist');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-dj/playlists'] });
      toast({
        title: 'Success',
        description: 'Playlist generated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate playlist',
        variant: 'destructive',
      });
    },
  });

  // Mutation to activate a playlist
  const activatePlaylistMutation = useMutation({
    mutationFn: async ({ id, activate }: { id: number; activate: boolean }) => {
      const res = await fetch(`/api/ai-dj/playlists/${id}/activate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activate }),
      });
      
      if (!res.ok) throw new Error(`Failed to ${activate ? 'activate' : 'deactivate'} playlist`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-dj/playlists'] });
      queryClient.invalidateQueries({ queryKey: ['/api/radio/playlists'] });
      toast({
        title: 'Success',
        description: 'Playlist activation status updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update playlist activation status',
        variant: 'destructive',
      });
    },
  });

  // Value to be provided to consumers
  const value: AiDjContextType = {
    settings,
    activeSetting,
    isLoadingSettings,
    createSettingMutation,
    updateSettingMutation,
    deleteSettingMutation,
    activateSettingMutation,
    
    analyzedTracks,
    isAnalyzing: analyzeTrackMutation.isPending || batchAnalyzeMutation.isPending,
    analyzeTrackMutation,
    batchAnalyzeMutation,
    
    generatedPlaylists,
    isGeneratingPlaylist: generatePlaylistMutation.isPending,
    generatePlaylistMutation,
    activatePlaylistMutation,
    
    selectedStudio,
    setSelectedStudio,
  };

  return (
    <AiDjContext.Provider value={value}>
      {children}
    </AiDjContext.Provider>
  );
};
import { AudioTrack } from './AudioPlayerService';

// Interface for the legacy track format used in various places
export interface LegacyTrack {
  id: number;
  title: string;
  artist: string;
  duration: number;
  category: string;
  status?: string;
  position?: number;
  cuePoint?: number;
}

/**
 * Adapter function to convert the legacy track format to the new AudioTrack format
 * This allows us to gradually migrate to the new format without breaking existing code
 */
export function adaptLegacyTrack(track: LegacyTrack): AudioTrack {
  return {
    id: track.id,
    title: track.title,
    artist: track.artist || null,
    album: null, // Not available in legacy format
    duration: track.duration,
    path: `/api/radio/tracks/${track.id}/stream`, // Assuming this is the API endpoint
    fileType: 'audio/mpeg', // Default assumption
    fileSize: null, // Not available in legacy format
    waveformData: null, // Not available in legacy format
    cuePoints: track.cuePoint ? String(track.cuePoint) : null,
    bpm: null, // Not available in legacy format
    tags: track.category ? [track.category] : null, 
    category: track.category || null,
    normalizedLevel: null, // Not available in legacy format
    folderId: null, // Not available in legacy format
    createdAt: null, // Not available in legacy format
    lastPlayedAt: null, // Not available in legacy format
    playCount: null, // Not available in legacy format
  };
}

/**
 * Adapter function to convert an AudioTrack to a LegacyTrack format
 * This is useful when we need to pass data to components that still expect the legacy format
 */
export function adaptToLegacyTrack(track: AudioTrack): LegacyTrack {
  return {
    id: track.id,
    title: track.title,
    artist: track.artist || '',
    duration: track.duration,
    category: track.category || '',
    cuePoint: track.cuePoints ? Number(track.cuePoints) : undefined,
  };
}

/**
 * Helper function to determine if a track is playing based on status
 */
export function isTrackPlaying(track: LegacyTrack): boolean {
  return track.status === 'playing';
}

/**
 * Helper function to determine if a track is next up based on status
 */
export function isTrackNext(track: LegacyTrack): boolean {
  return track.status === 'next';
}

/**
 * Helper function to get track display color based on status
 */
export function getTrackStatusColor(track: LegacyTrack): string {
  if (track.status === 'playing') {
    return 'bg-red-800/40 border-l-4 border-red-600';
  } else if (track.status === 'next') {
    return 'bg-green-800/40 border-l-4 border-green-600';
  }
  return 'bg-zinc-800/40';
}
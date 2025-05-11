import React from 'react';
import { AudioTrack } from '@shared/schema';
import { cn } from '@/lib/utils';

interface SimpleTrackItemProps {
  track: AudioTrack;
  onClick?: () => void;
  onDoubleClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  className?: string;
}

/**
 * A simplified track item that only shows the track title in white
 * This component is specifically designed for folder expansion views
 */
export default function SimpleTrackItem({
  track,
  onClick,
  onDoubleClick,
  onContextMenu,
  className,
}: SimpleTrackItemProps) {
  // Handle drag start for drag and drop functionality
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    // Prepare the track data for transfer with all required properties
    const trackData = JSON.stringify({
      id: track.id,
      title: track.title,
      artist: track.artist,
      duration: track.duration,
      path: track.path,
      category: track.category,
      album: track.album,
      fileType: track.fileType || 'audio/mpeg',
      fileSize: track.fileSize || null,
      waveformData: track.waveformData || null,
      bpm: track.bpm || null,
      tags: track.tags || null,
      normalizedLevel: track.normalizedLevel || null,
      folderId: track.folderId || null,
      createdAt: track.createdAt || null,
      lastPlayedAt: track.lastPlayedAt || null,
      playCount: track.playCount || null,
      // Add status and position for PlayerTrack compatibility
      status: 'queued',
      position: 1
    });
    
    console.log('Starting drag operation with track data:', track.title);
    
    // Set the data in two formats for better compatibility
    e.dataTransfer.setData('track', trackData);
    e.dataTransfer.setData('text/plain', trackData);
    e.dataTransfer.effectAllowed = 'copyMove';
  };
  
  return (
    <div
      className={cn(
        "text-white font-medium text-sm py-1.5 px-2 cursor-pointer truncate hover:bg-zinc-900/50 border-l-2 border-transparent",
        className
      )}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={(e) => {
        e.preventDefault();
        if (onContextMenu) onContextMenu(e);
      }}
      draggable
      onDragStart={handleDragStart}
    >
      {/* Display only the track title in sharp white */}
      {track.title || (track.path ? track.path.split('/').pop() : 'Untitled')}
    </div>
  );
}
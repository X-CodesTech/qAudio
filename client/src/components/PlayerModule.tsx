import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play as PlayIcon, Pause as PauseIcon, Square as StopIcon, Upload as UploadIcon } from 'lucide-react';
import LevelMeter from './LevelMeter';
import WaveformAnalyzer from './WaveformAnalyzer';
import BackgroundWaveform from './BackgroundWaveform';
import SpectrumAnalyzer from './SpectrumAnalyzer';
import ModernLevelMeter from './ModernLevelMeter';
import { useAudioPlayer, type AudioTrack } from '@/lib/AudioPlayerService';
import { useToast } from '@/hooks/use-toast';

// Interface for simplified track data for the UI
// This is flexible to allow either direct AudioTrack compatibility or a nested fullTrack
interface Track {
  id: number;
  title: string;
  artist: string | null;
  duration: number;
  category: string | null;
  cuePoint?: number;
  
  // Extended track data that can be provided in two ways:
  // 1. A nested fullTrack reference that contains the full AudioTrack properties
  fullTrack?: AudioTrack;  
  
  // 2. Or direct properties that match AudioTrack (for direct compatibility)
  path?: string;
  album?: string | null;
  fileType?: string;
  fileSize?: number | null;
  waveformData?: string | null;
  bpm?: string | null;
  tags?: string[] | null;
  normalizedLevel?: string | null;
  folderId?: number | null;
  createdAt?: Date | null;
  lastPlayedAt?: Date | null;
  playCount?: number | null;
}

// Player Module with compact audio level meter for broadcast systems
const PlayerModule: React.FC<{
  type: 'CUE' | 'ON AIR' | 'NEXT';
  track?: Track;
  isPlaying?: boolean;
  levelPercentage?: number;
  className?: string;
  playerId?: string; // Used to identify which player this is for AudioPlayerService
  onPlay?: () => void;
  onStop?: () => void;
  onPause?: () => void;
  onCue?: () => void;
  onCuePointChange?: (cuePoint: number) => void;
}> = ({
  type,
  track,
  isPlaying = false,
  levelPercentage = 0,
  className = "",
  playerId = "playerA", // Default to Player A if not specified
  onPlay,
  onStop,
  onPause,
  onCue,
  onCuePointChange
}) => {
  // Get audio player service
  const audioPlayer = useAudioPlayer();
  const { toast } = useToast();
  
  // State for blinking effect when track is about to end (less than 1 minute remaining)
  const [isBlinking, setIsBlinking] = useState(false);
  // State for drag over visual feedback
  const [isDragOver, setIsDragOver] = useState(false);
  // Reference to the component for drag events
  const playerRef = useRef<HTMLDivElement>(null);
  
  // Calculate remaining time for the track (in seconds)
  const getRemainingTime = (): number => {
    if (!track || !isPlaying) return 0;
    // Need to mock this since we don't have actual playback position
    // In a real app, we would use the actual position from the audio player
    return track.duration - 30; // Mocking as 30 seconds into the track for demo
  };
  
  // Check if track is near the end (less than 1 minute remaining)
  useEffect(() => {
    if (!track || !isPlaying) {
      setIsBlinking(false);
      return;
    }
    
    // Check if less than 1 minute remains in the track
    const remainingTime = getRemainingTime();
    const isNearEnd = remainingTime > 0 && remainingTime <= 60;
    
    if (isNearEnd) {
      // Set up blinking animation
      const blinkInterval = setInterval(() => {
        setIsBlinking(prev => !prev);
      }, 500); // Toggle every 500ms
      
      return () => clearInterval(blinkInterval);
    } else {
      setIsBlinking(false);
    }
  }, [track, isPlaying]);
  
  // Color based on player type and state
  const getTypeColor = () => {
    // When player is ON AIR and playing, use sharp red background
    if (type === 'ON AIR' && isPlaying) {
      // If near the end of track and in blinking state, flash with more intense red
      if (isBlinking) {
        return 'bg-red-600/80 transition-colors duration-300'; // Bright red when blinking
      }
      return 'bg-red-700/70 transition-colors duration-300'; // Sharp red when playing but not blinking
    }
    
    // Otherwise use the standard colors
    switch(type) {
      case 'CUE': return 'bg-blue-900/50';
      case 'ON AIR': {
        // Return orange color for inactive Player A 
        return 'bg-[#F28C28]/50'; // Custom orange with 50% opacity
      }
      case 'NEXT': return 'bg-green-900/50';
      default: return 'bg-zinc-900/50';
    }
  };
  
  // Format duration as mm:ss
  const formatDuration = (seconds: number) => {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  // Handle cue point change from waveform
  const handleCuePointChange = (newCuePoint: number) => {
    if (onCuePointChange) {
      onCuePointChange(newCuePoint);
    }
  };
  
  // Handle file upload from drag and drop
  const handleUploadFromDragDrop = async (file: File) => {
    try {
      // Check if it's an audio file
      if (!file.type.startsWith('audio/')) {
        toast({
          title: "Invalid File Type",
          description: "Only audio files can be dropped into players",
          variant: "destructive"
        });
        return;
      }
      
      const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
      
      // Create a temporary audio element to get the duration
      const tempAudio = new Audio();
      tempAudio.src = URL.createObjectURL(file);
      
      // Create a direct AudioTrack object (no nested fullTrack)
      const tempTrackId = Math.floor(Math.random() * 10000);
      const audioTrack: AudioTrack = {
        id: tempTrackId,
        title: fileName,
        artist: 'Local Upload',
        album: 'Local Album',
        duration: 180, // Default 3 minutes, will be updated when metadata loads
        path: URL.createObjectURL(file), // Create local object URL for playback
        fileType: file.type,
        fileSize: file.size,
        waveformData: null,
        cuePoints: null,
        bpm: null,
        tags: null,
        category: 'music',
        normalizedLevel: null,
        folderId: 14,
        createdAt: null,
        lastPlayedAt: null,
        playCount: null
      };
      
      console.log("Created audio track object:", audioTrack);
      
      // Update the UI with the local track
      // This function needs to be called by the parent component
      if (onPlay) {
        onPlay();
      }
      
      // This will trigger notification that a parent component can respond to
      console.log(`Setting track in player ${playerId} with type ${type}`);
      
      try {
        // Set the track in the player regardless of type
        audioPlayer.setTrack(audioTrack, playerId);
        console.log(`Track set successfully in ${playerId}`);
        
        // Try to get the actual duration when metadata loads
        tempAudio.onloadedmetadata = () => {
          if (tempAudio.duration && !isNaN(tempAudio.duration)) {
            // Update duration in our track object
            audioTrack.duration = Math.round(tempAudio.duration);
            console.log(`Updated duration to ${audioTrack.duration} seconds`);
            
            // Update the track in the player with correct duration
            audioPlayer.updateTrack(audioTrack, playerId);
          }
        };
      } catch (error) {
        console.error("Error setting track in player:", error);
      }
      
      // Display immediate feedback that the track is now loaded
      toast({
        title: "Track Loaded",
        description: `${fileName} is now loaded in ${type} player`,
        variant: "default",
      });
      
      // In background, actually upload the file to server
      // Create FormData to upload the file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', fileName);
      formData.append('artist', 'Drag & Drop Upload');
      formData.append('category', 'Upload');
      formData.append('folderId', '14'); // Use the "mazen" folder ID
      
      // Show upload in progress notification
      toast({
        title: "Uploading Track",
        description: `Uploading ${file.name} to library...`,
      });
      
      // Send the file to the server
      const response = await fetch('/api/radio/tracks/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload file');
      }
      
      const uploadedTrack = await response.json();
      
      // Success notification
      toast({
        title: "Track Saved",
        description: `${file.name} has been saved to the library`,
      });
      
      // Convert the response to an AudioTrack format for future use
      if (uploadedTrack && uploadedTrack.id) {
        // Convert to our local track format if needed
        if (uploadedTrack.path && typeof uploadedTrack.path === 'string') {
          // Create a new AudioTrack object from the response
          const newTrack: AudioTrack = {
            id: uploadedTrack.id,
            title: uploadedTrack.title,
            path: uploadedTrack.path,
            artist: uploadedTrack.artist || null,
            album: uploadedTrack.album || null,
            duration: uploadedTrack.duration || 0,
            fileType: uploadedTrack.fileType || '',
            fileSize: uploadedTrack.fileSize || 0,
            waveformData: uploadedTrack.waveform || null,
            cuePoints: null,
            bpm: null,
            tags: null,
            category: uploadedTrack.category || null,
            normalizedLevel: null,
            folderId: uploadedTrack.folderId || null,
            createdAt: null,
            lastPlayedAt: null,
            playCount: null
          };
          
          // Replace our local track with the server version
          audioPlayer.updateTrack(newTrack, playerId);
        }
      }
      
    } catch (error) {
      console.error('Error handling file:', error);
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your file",
        variant: "destructive"
      });
    }
  };
  
  // Drag and drop event handlers
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Set appropriate drop effect
    if (e.dataTransfer.types.includes('Files')) {
      console.log("Desktop file being dragged over player");
      e.dataTransfer.dropEffect = 'copy';
    } else if (e.dataTransfer.types.includes('track')) {
      console.log(`Track from playlist being dragged over ${playerId}`);
      e.dataTransfer.dropEffect = 'move';
    } else {
      e.dataTransfer.dropEffect = 'move';
    }
    
    // Show visual indicator
    if (!isDragOver) setIsDragOver(true);
  }, [isDragOver, playerId]);
  
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    // Check if files are being dragged from the desktop
    if (e.dataTransfer.types.includes('Files') && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      console.log("Desktop file dropped onto player:", e.dataTransfer.files[0].name);
      
      // Only handle the first file for now
      const file = e.dataTransfer.files[0];
      handleUploadFromDragDrop(file);
      return;
    }
    
    // If it's not a file from desktop, check if it's a track being dragged from a playlist
    try {
      // Check if we have track data in the dataTransfer
      const trackDataRaw = e.dataTransfer.getData('track');
      if (trackDataRaw) {
        const trackData = JSON.parse(trackDataRaw);
        console.log("Track dropped from playlist:", trackData);
        
        // Create AudioTrack format from the track data
        const audioTrack: AudioTrack = {
          id: trackData.id,
          title: trackData.title,
          path: trackData.path,
          artist: trackData.artist || null,
          album: trackData.album || null,
          duration: trackData.duration || 0,
          fileType: trackData.fileType || 'audio/mpeg',
          fileSize: trackData.fileSize || null,
          waveformData: trackData.waveformData || null,
          cuePoints: trackData.cuePoints || null,
          bpm: trackData.bpm || null,
          tags: trackData.tags || null,
          category: trackData.category || null,
          normalizedLevel: trackData.normalizedLevel || null,
          folderId: trackData.folderId || null,
          createdAt: trackData.createdAt || null,
          lastPlayedAt: trackData.lastPlayedAt || null,
          playCount: trackData.playCount || null
        };
        
        // Set track in the player
        audioPlayer.setTrack(audioTrack, playerId);
        
        // Show toast notification
        toast({
          title: "Track Loaded",
          description: `${trackData.title} loaded to ${playerId === 'playerA' ? 'Player A' : playerId === 'playerB' ? 'Player B' : 'Player C'}`,
        });
        
        return;
      }
    } catch (error) {
      console.error("Error processing dropped track:", error);
    }
    
    // If it's not a file from desktop or track data, log this for debugging
    console.log("Non-file drop detected. Available types:", e.dataTransfer.types);
  }, [handleUploadFromDragDrop, audioPlayer, playerId]);
  
  // Visual indicator for drag and drop functionality
  const dragDropIndicator = (
    <div className={`absolute inset-0 flex items-center justify-center bg-black/50 z-50 transition-opacity duration-200 ${isDragOver ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="text-center text-white">
        <UploadIcon className="h-10 w-10 mx-auto mb-2" />
        <p className="text-sm">Drop track here to load in {playerId === 'playerA' ? 'Player A' : playerId === 'playerB' ? 'Player B' : 'Player C'}</p>
      </div>
    </div>
  );
  
  return (
    <div 
      ref={playerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`${getTypeColor()} border ${isDragOver ? 'border-blue-500 shadow-lg' : 'border-zinc-700'} rounded-md overflow-hidden transition-all duration-200 ${className} ${isDragOver ? 'ring-2 ring-blue-500 ring-opacity-50' : ''} relative`}
    >
      {/* Drag & Drop Overlay */}
      {dragDropIndicator}
      
      {/* Header */}
      <div className="bg-black/40 text-center py-1 font-bold text-xs px-2">
        <span>{type}</span>
      </div>
      
      {/* Track Info with Spectrum Analyzer */}
      <div className="p-2">
        {track ? (
          <div className="mb-1 relative h-14">
            {/* Spectrum Analyzer with appropriate colors based on player type */}
            {track.id && (
              <SpectrumAnalyzer 
                trackId={track.id} 
                height={56} 
                showLabels={false}
                peakHold={true}
                isPlaying={isPlaying}
                barColor={
                  type === 'CUE' ? 'rgba(59, 130, 246, 0.7)' : 
                  type === 'ON AIR' ? (
                    !isPlaying 
                      ? 'rgba(242, 140, 40, 0.7)' // Orange for inactive
                      : isBlinking 
                        ? 'rgba(220, 38, 38, 0.8)' // Bright red for blinking
                        : 'rgba(185, 28, 28, 0.7)' // Sharp red for active (non-blinking)
                  ) : 
                  'rgba(16, 185, 129, 0.7)'
                }
                peakColor={
                  type === 'CUE' ? 'rgba(59, 130, 246, 0.9)' : 
                  type === 'ON AIR' ? (
                    !isPlaying 
                      ? 'rgba(242, 140, 40, 0.9)' // Orange for inactive
                      : 'rgba(255, 255, 0, 0.8)' // Yellow peaks for active
                  ) : 
                  'rgba(16, 185, 129, 0.9)'
                }
                className="w-full h-full"
              />
            )}
            
            {/* Track Info Text - with higher z-index to be above spectrum analyzer */}
            <div className="relative z-10 p-1 h-full flex flex-col justify-center">
              <div className="font-semibold text-sm truncate">{track.title}</div>
              <div className="text-xs text-zinc-300 truncate">{track.artist}</div>
              <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                <span>{track.category}</span>
                <div className="flex items-center gap-1">
                  {track.cuePoint ? (
                    <span className="text-green-400">{formatDuration(track.cuePoint)} / </span>
                  ) : null}
                  {isPlaying && type === 'ON AIR' && getRemainingTime() <= 60 ? (
                    <span className={`${isBlinking ? 'text-red-500' : 'text-amber-500'} font-bold`}>
                      {formatDuration(getRemainingTime())} left
                    </span>
                  ) : (
                    <span>{formatDuration(track.duration)}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-1 h-14 flex items-center justify-center">
            <span className="text-xs italic text-zinc-500">No track loaded</span>
            <span className="text-xs text-blue-400 ml-2">(Drag audio here)</span>
          </div>
        )}
        
        {/* Modern Audio Level Meters */}
        <div className="mb-3 mt-1">
          {/* Three modern audio level meters */}
          <ModernLevelMeter 
            level={isPlaying ? levelPercentage : 0} 
            isActive={type === 'ON AIR'} 
            isPlaying={isPlaying}
            className="h-8"
          />
          <div className="flex justify-center text-[10px] mt-1">
            {isPlaying ? (
              <span className="text-green-400 font-mono font-semibold">PLAYING</span>
            ) : (
              <span className="text-zinc-400 font-mono">STOPPED</span>
            )}
          </div>
        </div>
        
        {/* Controls */}
        <div className="grid grid-cols-4 gap-1 mb-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="h-7 p-0 bg-blue-900/50 hover:bg-blue-800"
            onClick={() => {
              // Handle cue functionality
              if (onCue) {
                onCue();
              }
              
              // For cue points, we can use the direct track or the fullTrack
              if (track) {
                // Set cue point if needed
                if (track.cuePoint && track.id) {
                  audioPlayer.setCuePoint(track.cuePoint, track.id);
                }
              }
            }}
          >
            <div className="text-[10px]">CUE</div>
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="h-7 p-0 bg-green-900/50 hover:bg-green-800"
            onClick={() => {
              // Call the parent's onPlay callback if provided
              if (onPlay) {
                onPlay();
              }
              
              // We can play directly from the track object
              if (track) {
                if (track.fullTrack) {
                  // If we have a nested fullTrack object, use that
                  audioPlayer.playTrack(track.fullTrack, playerId);
                } else if (track.path) {
                  // Or if track itself has a path, it's already an AudioTrack
                  audioPlayer.playTrack(track as AudioTrack, playerId);
                } else {
                  console.error("Track doesn't have path information");
                }
              }
            }}
            disabled={isPlaying}
          >
            <PlayIcon className="h-3 w-3" />
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="h-7 p-0 bg-yellow-900/50 hover:bg-yellow-800"
            onClick={() => {
              // Call the parent's onPause callback if provided
              if (onPause) {
                onPause();
              }
              
              // Use the audio player service to pause
              audioPlayer.pauseTrack(playerId);
            }}
            disabled={!isPlaying}
          >
            <PauseIcon className="h-3 w-3" />
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="h-7 p-0 bg-red-900/50 hover:bg-red-800"
            onClick={() => {
              // Call the parent's onStop callback if provided
              if (onStop) {
                onStop();
              }
              
              // Use the audio player service to stop
              audioPlayer.stopTrack(playerId);
            }}
            disabled={!isPlaying}
          >
            <StopIcon className="h-3 w-3" />
          </Button>
        </div>
        
        {/* Always show Waveform analyzer instead of toggling */}
        {track && track.id && (
          <div className="border-t border-zinc-700 pt-2">
            <WaveformAnalyzer
              trackId={track.id}
              trackTitle={track.title}
              duration={track.duration}
              initialCuePoint={track.cuePoint || 0}
              onCuePointChange={handleCuePointChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerModule;
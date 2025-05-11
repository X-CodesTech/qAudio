import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Play, Pause, Square, SkipBack, SkipForward, Volume2, VolumeX, 
  Radio, Music, Activity, AlertCircle, Timer, Headphones, Clock,
  Repeat, Trash2, ChevronsRight, X as EjectIcon, Scissors
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useAudioPlayer, type AudioTrack } from '@/lib/AudioPlayerService';
import { useToast } from '@/hooks/use-toast';
import BackgroundWaveform from './BackgroundWaveform';
import AudioVisualizer from './AudioVisualizer';
import CuePointsDialog from './CuePointsDialog';
import ProfessionalWaveform from './ProfessionalWaveform';
import LevelBarsWaveform from './LevelBarsWaveform';
import Goniometer from './Goniometer';
import FullWidthSpectrumAnalyzer from './FullWidthSpectrumAnalyzer';

// Interface for the track data
interface Track {
  id: number;
  title: string;
  artist: string | null;
  album?: string | null;
  duration: number;
  path?: string;
  category?: string | null;
  cuePoint?: number;
  cuePoints?: string | null;
  waveformData?: string | null;
}

export interface AdvancedPlayerModuleProps {
  type: 'A' | 'B' | 'C'; // Player type
  studioColor: string; // Color for the player (hex code)
  isOnAir?: boolean; // Whether the player is on air
  className?: string;
  playerId: string; // "playerA", "playerB", etc.
  initialTrack?: Track | null;
}

const AdvancedPlayerModule: React.FC<AdvancedPlayerModuleProps> = ({
  type,
  studioColor,
  isOnAir = false,
  className = "",
  playerId,
  initialTrack = null
}) => {
  // Get audio player service
  const audioPlayer = useAudioPlayer();
  const { toast } = useToast();
  
  // State for the player
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(initialTrack);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [tracksInQueue, setTracksInQueue] = useState<Track[]>([]);
  const [isLooping, setIsLooping] = useState(false);
  const [isCuePointsDialogOpen, setIsCuePointsDialogOpen] = useState(false);
  
  // State for progress bar hover position
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const [peakLevel, setPeakLevel] = useState(0); // For VU meter simulation
  
  // Container ref for getting dimensions
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  
  // Sync with audio player service
  useEffect(() => {
    const checkPlayerState = () => {
      const isPlayerPlaying = audioPlayer.isPlaying(playerId);
      const currentAudioTrack = audioPlayer.currentTrack(playerId);
      const currentPosition = audioPlayer.currentPosition(playerId);
      const trackDuration = audioPlayer.duration(playerId);
      const playerVolume = audioPlayer.volume(playerId);
      
      setIsPlaying(isPlayerPlaying);
      
      if (currentAudioTrack) {
        // Convert AudioTrack to Track if needed
        if (!currentTrack || currentTrack.id !== currentAudioTrack.id) {
          // Convert cuePoints from string to number if needed
          let cuePoint: number | undefined = undefined;
          if (currentAudioTrack.cuePoints) {
            try {
              // If it's already an array, use the first item
              if (Array.isArray(currentAudioTrack.cuePoints)) {
                cuePoint = currentAudioTrack.cuePoints[0];
              } 
              // If it's a string, try to parse it as JSON
              else if (typeof currentAudioTrack.cuePoints === 'string') {
                const cuePointsArray = JSON.parse(currentAudioTrack.cuePoints);
                if (Array.isArray(cuePointsArray) && cuePointsArray.length > 0) {
                  cuePoint = cuePointsArray[0];
                }
              }
            } catch (e) {
              console.error('Error parsing cuePoints:', e);
            }
          }
          
          setCurrentTrack({
            id: currentAudioTrack.id,
            title: currentAudioTrack.title,
            artist: currentAudioTrack.artist,
            album: currentAudioTrack.album,
            duration: currentAudioTrack.duration,
            path: currentAudioTrack.path,
            category: currentAudioTrack.category,
            waveformData: currentAudioTrack.waveformData,
            cuePoint: cuePoint
          });
        }
      }
      
      setPosition(currentPosition);
      setDuration(trackDuration || (currentTrack?.duration || 0));
      setVolume(playerVolume * 100);
      
      // Simulate VU meter with some randomness when playing
      if (isPlayerPlaying) {
        const basePeak = 0.7 + (Math.sin(Date.now() / 500) * 0.2);
        const randomFactor = Math.random() * 0.1;
        setPeakLevel(Math.min(1, Math.max(0, basePeak + randomFactor)));
      } else {
        setPeakLevel(0);
      }
    };
    
    // Initial check
    checkPlayerState();
    
    // Set up an interval to poll the audio player service
    const intervalId = setInterval(checkPlayerState, 100);
    
    return () => clearInterval(intervalId);
  }, [audioPlayer, playerId, currentTrack]);
  
  // Format time as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle play/pause button click
  const handlePlayPauseClick = () => {
    if (!currentTrack) {
      toast({
        title: "No Track Loaded",
        description: `Please load a track in Player ${type} first.`,
        variant: "destructive"
      });
      return;
    }
    
    if (isPlaying) {
      audioPlayer.pauseTrack(playerId);
    } else {
      if (currentTrack) {
        // If there's already a track in the player, just play it
        audioPlayer.play(playerId);
      } else {
        // This shouldn't happen but handling just in case
        toast({
          title: "No Track Available",
          description: `No track is loaded in Player ${type}.`,
          variant: "destructive"
        });
      }
    }
  };
  
  // Handle stop button click
  const handleStopClick = () => {
    if (isPlaying || position > 0) {
      audioPlayer.stopTrack(playerId);
    }
  };
  
  // Handle back to start button click
  const handleBackToStartClick = () => {
    if (audioPlayer.currentTrack(playerId)) {
      const audioElement = document.querySelector(`audio[data-player-id="${playerId}"]`) as HTMLAudioElement;
      if (audioElement) {
        audioElement.currentTime = 0;
      }
    }
  };
  
  // Handle volume change
  const handleVolumeChange = (newVolume: number[]) => {
    const volumeValue = newVolume[0];
    setVolume(volumeValue);
    setIsMuted(volumeValue === 0);
    audioPlayer.setVolume(volumeValue / 100, playerId);
  };
  
  // Handle mute toggle
  const handleMuteToggle = () => {
    if (isMuted) {
      // Unmute - restore to previous volume
      const previousVolume = volume > 0 ? volume : 75;
      setVolume(previousVolume);
      setIsMuted(false);
      audioPlayer.setVolume(previousVolume / 100, playerId);
    } else {
      // Mute - set volume to 0
      setIsMuted(true);
      audioPlayer.setVolume(0, playerId);
    }
  };
  
  // Handler for Next Track button
  const handleNextTrack = () => {
    if (tracksInQueue.length > 0) {
      const nextTrack = tracksInQueue[0];
      // Remove the next track from the queue
      setTracksInQueue(tracksInQueue.slice(1));
      
      // Load the next track
      if (nextTrack) {
        // Create audio track with all required fields
        const audioTrack: AudioTrack = {
          id: nextTrack.id,
          title: nextTrack.title,
          artist: nextTrack.artist || null,
          album: nextTrack.album || null,
          duration: nextTrack.duration,
          path: nextTrack.path || "",
          category: nextTrack.category || null,
          waveformData: nextTrack.waveformData || null,
          cuePoints: nextTrack.cuePoint ? JSON.stringify([nextTrack.cuePoint]) : null,
          fileType: "audio/mpeg", // Default file type
          fileSize: null,
          bpm: null,
          tags: null,
          folderId: null,
          createdAt: null,
          playCount: null,
          normalizedLevel: null,
          lastPlayedAt: new Date()
        };
        
        audioPlayer.loadTrack(audioTrack, playerId);
        
        toast({
          title: "Next Track Loaded",
          description: `Loaded "${nextTrack.title}" in Player ${type}`
        });
      }
    } else {
      toast({
        title: "No Next Track",
        description: "There are no tracks in the queue",
        variant: "destructive"
      });
    }
  };
  
  // Handler for Eject button
  const handleEjectTrack = () => {
    if (currentTrack) {
      if (isPlaying) {
        audioPlayer.stopTrack(playerId);
      }
      
      // Clear the current track
      audioPlayer.unloadTrack(playerId);
      setCurrentTrack(null);
      
      toast({
        title: "Track Ejected",
        description: `Removed track from Player ${type}`
      });
    }
  };
  
  // Handler for Loop toggle
  const handleLoopToggle = () => {
    const newLoopState = !isLooping;
    setIsLooping(newLoopState);
    
    // Get the audio element and set the loop property
    const audioElement = document.querySelector(`audio[data-player-id="${playerId}"]`) as HTMLAudioElement;
    if (audioElement) {
      audioElement.loop = newLoopState;
    }
    
    toast({
      title: newLoopState ? "Loop Enabled" : "Loop Disabled",
      description: newLoopState 
        ? `Player ${type} will now loop the current track` 
        : `Player ${type} will no longer loop the current track`
    });
  };
  
  // Handler for opening the cue points dialog
  const handleOpenCuePointsDialog = () => {
    if (!currentTrack) {
      toast({
        title: "No Track Loaded",
        description: `Please load a track in Player ${type} first.`,
        variant: "destructive"
      });
      return;
    }
    
    setIsCuePointsDialogOpen(true);
  };
  
  // Calculate remaining time
  const remainingTime = duration - position;
  
  // Calculate if track is near end (less than 60 seconds)
  const isNearEnd = remainingTime > 0 && remainingTime < 60;
  
  // Calculate progress percentage
  const progressPercentage = duration > 0 ? (position / duration) * 100 : 0;
  
  // Create time markers for waveform
  const timeMarkers = Array.from({ length: 5 }, (_, i) => {
    const percent = i * 25;
    const markerTime = duration * (percent / 100);
    return { percent, time: formatTime(markerTime) };
  });
  
  // Handle progress bar click
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!currentTrack || !progressBarRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newPosition = percentage * duration;
    
    // Use the seekTo function from AudioPlayerService for better error handling
    try {
      audioPlayer.seekTo(newPosition, playerId);
      console.log(`Seeking to ${newPosition}s in ${playerId}`);
    } catch (error) {
      console.error(`Error seeking in ${playerId}:`, error);
      toast({
        title: "Playback Error",
        description: "Failed to seek to position. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle progress bar hover
  const handleProgressBarHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const hoverX = e.clientX - rect.left;
    const percentage = hoverX / rect.width;
    setHoverPosition(percentage * duration);
  };
  
  // Handle mouse leave
  const handleProgressBarLeave = () => {
    setHoverPosition(null);
  };
  
  // Get base color based on player type and state
  const getPlayerColor = () => {
    // When inactive, use playout gray for players
    if (!isPlaying && !isOnAir) {
      return '#444444'; // Playout gray when inactive
    }
    
    // Active state or on-air colors by studio
    switch(type) {
      case 'A': return '#F28C28'; // Studio A orange
      case 'B': return '#2D8D27'; // Studio B green 
      case 'C': return '#7B1FA2'; // Studio C purple
      default: return '#3B82F6'; // Default blue
    }
  };
  
  // Get player bg color based on state
  const getPlayerBgColor = () => {
    // On air playing is always red
    if (isOnAir && isPlaying) {
      return 'bg-red-700';
    }
    
    // If not playing and not on air, use dark gray
    if (!isPlaying && !isOnAir) {
      return 'bg-gray-800';
    }
    
    // Otherwise use the studio colors based on type
    switch(type) {
      case 'A': return 'bg-amber-600';
      case 'B': return 'bg-emerald-700';
      case 'C': return 'bg-purple-800';
      default: return 'bg-blue-600';
    }
  };
  
  // Get play button color
  const getPlayButtonColor = () => {
    if (isPlaying) {
      return 'bg-red-600 hover:bg-red-700 border-red-400';
    }
    return 'bg-green-600 hover:bg-green-700 border-green-400';
  };
  
  // Get bg color for time display
  const getTimeDisplayColor = () => {
    if (isNearEnd && isPlaying) {
      return 'bg-red-800/80'; 
    }
    return 'bg-black/60';
  };
  
  return (
    <div 
      ref={containerRef}
      className={`relative overflow-visible flex flex-col ${className} ${!isPlaying && !isOnAir ? 'bg-zinc-900' : 'bg-gradient-to-b from-zinc-900 to-zinc-950'} shadow-lg`}
      style={{ height: "calc(100% - 14px)", paddingBottom: "48px", zIndex: 10, outline: "3px solid #626262" }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Top bar with player identifier - increased height by 8px */}
      <div className={`flex items-center justify-between px-2 py-3 relative overflow-hidden ${getPlayerBgColor()}`}>
        {/* Progress bar as background */}
        <div 
          className={`absolute left-0 top-0 bottom-0 h-full ${
            isPlaying
              ? isNearEnd 
                ? 'bg-[#ff2020]' // Red when 60 seconds or less remaining
                : 'bg-[#13ef15]' // Green while playing
              : 'bg-gray-700/50' // Darker when not playing
          } transition-all duration-100`}
          style={{ 
            width: `${progressPercentage}%`,
            animation: isPlaying && isNearEnd ? 'slowPulse 1s ease-in-out infinite' : 'none',
            zIndex: 0
          }}
        />
        
        <div className="flex items-center space-x-1 z-10">
          <Radio className={`h-4 w-4 ${isPlaying ? 'text-white animate-pulse' : 'text-white/80'}`} />
          <span className="text-sm font-bold text-white tracking-wider">
            PLAYER {type}
          </span>
        </div>
        
        <div className="flex items-center space-x-1 z-10">
          <div className={`text-xs font-bold px-1.5 py-0.5 rounded-sm ${
            isOnAir && isPlaying 
              ? 'bg-red-600 text-white animate-pulse' 
              : isOnAir 
                ? 'bg-amber-600 text-white' 
                : 'bg-gray-700 text-white/80'
          }`}>
            {isOnAir && isPlaying 
              ? 'ON AIR' 
              : isOnAir 
                ? 'STANDBY' 
                : 'READY'
            }
          </div>
        </div>
      </div>
      
      {/* Main player controls */}
      
      {/* Track info and controls section with full-width spectrum analyzer background */}
      <div className="flex flex-col p-2 space-y-2 relative">
        {/* Full-width Spectrum Analyzer visualization as background - positioned behind everything */}
        <div className="absolute inset-0 w-full h-full z-0" ref={waveformRef} 
             style={{
               position: 'absolute',
               top: 0,
               left: 0,
               right: 0,
               bottom: 0,
               overflow: 'hidden',
             }}>
              <FullWidthSpectrumAnalyzer 
                audioElement={audioPlayer.getAudioElement ? audioPlayer.getAudioElement(playerId) : null}
                trackId={currentTrack?.id}
                isPlaying={isPlaying}
                height={300}
                studioColor={studioColor}
                isNearEnd={false} // Never pass isNearEnd as true to prevent spectrum analyzer from blinking
                className="w-full h-full" // Removed animation class
              />
        </div>
        
        {/* Track info with professional metadata display - with z-index to appear on top of spectrum analyzer */}
        <div className="grid grid-cols-12 gap-1 z-10 relative">
          {/* Title and artist info */}
          <div className="col-span-12 flex flex-col space-y-0.5 h-14 justify-center">
            <div className="text-sm font-bold tracking-wide truncate text-white drop-shadow-md">
              {currentTrack ? currentTrack.title : "Ready for Playback"}
            </div>
            <div className="text-xs text-zinc-300 truncate flex items-center space-x-1 drop-shadow-md">
              {currentTrack ? (
                <>
                  <span>{currentTrack.artist || 'Unknown Artist'}</span>
                  {currentTrack.album && (
                    <>
                      <span className="text-zinc-500">•</span>
                      <span className="text-zinc-400">{currentTrack.album}</span>
                    </>
                  )}
                </>
              ) : (
                <></>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Enhanced 3D Player controls moved up by 7px with reduced gaps between buttons */}
      <div className="flex items-center justify-center px-1 pb-2 pt-1" style={{ marginTop: '-7px', gap: '3px' }}>
        {/* Back to start button with 3D styling */}
        <button 
          className="relative p-1.5 rounded overflow-hidden flex items-center justify-center"
          style={{
            background: 'linear-gradient(to bottom, #444, #333)',
            border: '1px solid rgba(0,0,0,0.3)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.1)',
          }}
          onClick={handleBackToStartClick}
          title="Back to start"
        >
          <div style={{ 
            filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.7))',
            transform: 'translateY(1px)'
          }}>
            <SkipBack className="h-5 w-5 text-white" />
          </div>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.15), transparent)',
            borderRadius: '4px 4px 0 0',
            pointerEvents: 'none'
          }} />
        </button>
        
        {/* Play/Pause button with enhanced 3D styling */}
        <button 
          className="relative p-1.5 rounded overflow-hidden flex items-center justify-center"
          style={{
            background: isPlaying 
              ? 'linear-gradient(to bottom, #e02b2b, #a52222)' 
              : `linear-gradient(to bottom, ${type === 'A' ? '#2563eb, #1d4ed8' : '#22c55e, #15803d'})`,
            border: '1px solid rgba(0,0,0,0.3)',
            boxShadow: '0 2px 3px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.2)',
            width: '42px',
            height: '42px',
          }}
          onClick={handlePlayPauseClick}
          title={isPlaying ? "Pause" : "Play"}
        >
          <div style={{ 
            filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.7))',
            transform: 'translateY(1px)'
          }}>
            {isPlaying ? <Pause className="h-5 w-5 text-white" /> : <Play className="h-5 w-5 text-white" />}
          </div>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.25), transparent)',
            borderRadius: '4px 4px 0 0',
            pointerEvents: 'none'
          }} />
        </button>
        
        {/* Stop button with 3D styling */}
        <button 
          className="relative p-1.5 rounded overflow-hidden flex items-center justify-center"
          style={{
            background: 'linear-gradient(to bottom, #444, #333)',
            border: '1px solid rgba(0,0,0,0.3)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.1)',
          }}
          onClick={handleStopClick}
          title="Stop"
        >
          <div style={{ 
            filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.7))',
            transform: 'translateY(1px)'
          }}>
            <Square className="h-5 w-5 text-white" />
          </div>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.15), transparent)',
            borderRadius: '4px 4px 0 0',
            pointerEvents: 'none'
          }} />
        </button>
        
        {/* Next button with 3D styling */}
        <button 
          className="relative p-1.5 rounded overflow-hidden flex items-center justify-center"
          style={{
            background: 'linear-gradient(to bottom, #444, #333)',
            border: '1px solid rgba(0,0,0,0.3)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.1)',
          }}
          onClick={handleNextTrack}
          title="Next Track"
        >
          <div style={{ 
            filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.7))',
            transform: 'translateY(1px)'
          }}>
            <ChevronsRight className="h-5 w-5 text-white" />
          </div>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.15), transparent)',
            borderRadius: '4px 4px 0 0',
            pointerEvents: 'none'
          }} />
        </button>
        
        {/* Cue Points button with 3D styling */}
        <button 
          className="relative p-1.5 rounded overflow-hidden flex items-center justify-center"
          style={{
            background: 'linear-gradient(to bottom, #444, #333)',
            border: '1px solid rgba(0,0,0,0.3)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.1)',
          }}
          onClick={handleOpenCuePointsDialog}
          title="Set Cue Points"
        >
          <div style={{ 
            filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.7))',
            transform: 'translateY(1px)'
          }}>
            <Scissors className="h-5 w-5 text-white" />
          </div>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.15), transparent)',
            borderRadius: '4px 4px 0 0',
            pointerEvents: 'none'
          }} />
        </button>
        
        {/* Eject button with 3D styling */}
        <button 
          className="relative p-1.5 rounded overflow-hidden flex items-center justify-center"
          style={{
            background: 'linear-gradient(to bottom, #444, #333)',
            border: '1px solid rgba(0,0,0,0.3)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.1)',
          }}
          onClick={handleEjectTrack}
          title="Eject Track"
        >
          <div style={{ 
            filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.7))',
            transform: 'translateY(1px)'
          }}>
            <EjectIcon className="h-5 w-5 text-white" />
          </div>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.15), transparent)',
            borderRadius: '4px 4px 0 0',
            pointerEvents: 'none'
          }} />
        </button>
        
        {/* Loop button with 3D styling */}
        <button 
          className="relative p-1.5 rounded overflow-hidden flex items-center justify-center"
          style={{
            background: isLooping 
              ? 'linear-gradient(to bottom, #3b82f6, #2563eb)' 
              : 'linear-gradient(to bottom, #444, #333)',
            border: isLooping 
              ? '1px solid rgba(37, 99, 235, 0.5)' 
              : '1px solid rgba(0,0,0,0.3)',
            boxShadow: isLooping 
              ? '0 1px 2px rgba(37, 99, 235, 0.4), inset 0 1px 1px rgba(255,255,255,0.2)' 
              : '0 1px 2px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.1)',
          }}
          onClick={handleLoopToggle}
          title={isLooping ? "Disable Loop" : "Enable Loop"}
        >
          <div style={{ 
            filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.7))',
            transform: 'translateY(1px)'
          }}>
            <Repeat className="h-5 w-5 text-white" />
          </div>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.25), transparent)',
            borderRadius: '4px 4px 0 0',
            pointerEvents: 'none'
          }} />
        </button>
      </div>
      
      {/* Progress bar with optimal width (7px wider than original) */}
      <div className="px-1 relative z-20 mt-2" style={{ marginLeft: "-3.5px", marginRight: "-3.5px" }}>
        {/* Remaining time indicator above progress bar - moved up 5px, doubled in size, and blinking when 60 seconds remain */}
        <div className="flex justify-end items-center mb-1">
          <span 
            className={`font-mono font-bold text-2xl ${
              isNearEnd && isPlaying 
                ? 'text-red-500 animate-slow-pulse' // Add slow pulse animation when near end
                : 'text-white'
            }`}
            style={{ marginTop: '-14px' }}
          >
            {formatTime(remainingTime)}
          </span>
        </div>
        
        <div className="relative">
          {/* Enhanced progress bar with 14px height for better visibility */}
          <div 
            ref={progressBarRef}
            className="h-[14px] bg-zinc-900 border border-zinc-700 rounded-sm overflow-hidden cursor-pointer relative"
            onClick={handleProgressBarClick}
            onMouseMove={handleProgressBarHover}
            onMouseLeave={handleProgressBarLeave}
          >
            {/* Played progress with green color when playing and red near the end with blinking effect */}
            <div 
              className={`h-full ${
                isPlaying
                  ? isNearEnd 
                    ? 'bg-[#ff2020] animate-slow-pulse' // Red with blinking when 60 seconds or less remaining
                    : 'bg-[#13ef15]' // Green while playing
                  : type === 'A' 
                    ? 'bg-gradient-to-r from-amber-700 to-amber-600' 
                    : type === 'B' 
                      ? 'bg-gradient-to-r from-emerald-800 to-emerald-700' 
                      : 'bg-gradient-to-r from-purple-800 to-purple-700'
              } transition-all duration-100`}
              style={{ 
                width: `${progressPercentage}%`,
                // Animation is now handled by the className to ensure consistent blinking
              }}
            />
            
            {/* Progress markers every 10 seconds with improved visibility */}
            <div className="absolute inset-0 flex pointer-events-none">
              {Array.from({ length: Math.ceil(duration / 10) }).map((_, i) => {
                const percent = (i * 10) / duration * 100;
                // Major markers (minute markers) should be more visible
                const isMajorMarker = i % 6 === 0;
                return (
                  <div 
                    key={i}
                    className={`absolute top-0 bottom-0 ${isMajorMarker ? 'w-0.5 bg-zinc-600/80' : 'w-px bg-zinc-700/40'}`}
                    style={{ 
                      left: `${percent}%`,
                      height: isMajorMarker ? '100%' : '70%',
                      top: isMajorMarker ? '0' : '15%'
                    }}
                  />
                );
              })}
            </div>
            
            {/* Hover indicator with improved styling */}
            {hoverPosition !== null && (
              <>
                <div 
                  className="absolute top-0 h-full w-0.5 bg-white"
                  style={{ 
                    left: `${(hoverPosition / duration) * 100}%`,
                    transform: 'translateX(-50%)'
                  }}
                />
                
                {/* Time indicator on hover with broadcast styling */}
                <div 
                  className="absolute top-[-20px] text-xs bg-black/90 text-white px-1.5 py-0.5 rounded-sm border border-zinc-700"
                  style={{ 
                    left: `${(hoverPosition / duration) * 100}%`,
                    transform: 'translateX(-50%)'
                  }}
                >
                  {formatTime(hoverPosition)}
                </div>
              </>
            )}
          </div>
          
          {/* Position indicator tick marks below the progress bar - more compact */}
          <div className="absolute -bottom-1 left-0 right-0 flex justify-between px-0.5 text-[6px] text-zinc-500 pointer-events-none">
            {[0, 50, 100].map((percent) => (
              <div key={percent} className="flex flex-col items-center">
                <div className="h-1 w-px bg-zinc-700"></div>
                <div>{percent}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cue Points Dialog */}
      <CuePointsDialog
        isOpen={isCuePointsDialogOpen}
        onClose={() => setIsCuePointsDialogOpen(false)}
        track={currentTrack}
        playerId={playerId}
        type={type}
      />
    </div>
  );
};

export default AdvancedPlayerModule;
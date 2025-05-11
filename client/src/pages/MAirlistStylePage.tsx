import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { RadioAutomationProvider, useRadioAutomation, type MediaFolder } from '@/contexts/RadioAutomationContext';
import { useAudioPlayer, AudioTrack } from '@/lib/AudioPlayerService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import { 
  RefreshCcw, Plus, Settings, Mic, ListMusic, Clock, 
  Music, Radio, Search, FolderOpen, FileMusic, Save, Import, 
  Menu, MoreHorizontal, ArrowUpDown, Upload, Download, Calendar,
  AlertTriangle, AlertCircle, X, SkipBack, Play, Pause, Wand2,
  LogOut, FolderEdit, Volume, Volume2, Hand, ChevronDown, Waves,
  ExternalLink, CheckCircle, Trash2, Edit, LibraryBig
} from 'lucide-react';
import qstudioLogo from '@assets/qstudio_v1.png';
import LibrarySettingsDialog from '@/components/LibrarySettingsDialog';
import LibraryManagementDialog from '@/components/LibraryManagementDialog';
import ScheduleDialog from '@/components/ScheduleDialog';
import { OpenLibraryButton } from '@/components/OpenLibraryButton';
import { useAuth } from '@/contexts/AuthContext';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UploadTrackDialog from '@/components/UploadTrackDialog';
import PlayerModule from '@/components/PlayerModule';
import SettingsDialog from '@/components/SettingsDialog';
import { formatDuration, formatLongDuration, calculateTotalDuration } from '@/lib/formatters';
import { TrackMixingEditor, type CuePoints } from '@/components/TrackMixingEditor';
import { ColorCodedTrackItem } from '@/components/ColorCodedTrackItem';
import { CartWallContainer } from '@/components/CartWallContainer';
import { PlaybackLengthMeter } from '@/components/PlaybackLengthMeter';
import { AiDjPanel } from '@/components/AiDjPanel';
import { CartItem } from '@/components/CartButton';
import LevelMeter from '@/components/LevelMeter';
import ModernLevelMeter from '@/components/ModernLevelMeter';
import SimpleTrackItem from '@/components/SimpleTrackItem';
import AdvancedPlayerModule from '@/components/AdvancedPlayerModule';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import DigitalClockComponent from '@/components/DigitalClockComponent';
import DatabaseStatusFooter from '@/components/DatabaseStatusFooter';
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer';

// Redesigned, more gentle LevelMeter component
const GentleLevelMeter: React.FC<{ level: number; vertical?: boolean; height?: number }> = ({ 
  level, 
  vertical = false, 
  height = 100 
}) => {
  // Calculate colors based on level
  const getSegmentColor = (segmentLevel: number) => {
    if (segmentLevel > 90) return 'bg-red-400';
    if (segmentLevel > 75) return 'bg-yellow-400';
    return 'bg-green-400';
  };
  
  // Generate meter segments
  const segments = Array.from({ length: 20 }).map((_, index) => {
    const segmentLevel = (index + 1) * 5;
    const isActive = level >= segmentLevel;
    const opacity = isActive ? 1 : 0.15;
    
    return (
      <div
        key={index}
        className={`${getSegmentColor(segmentLevel)} rounded-full transition-all duration-150`}
        style={{
          opacity,
          height: vertical ? '4px' : `${height}%`,
          width: vertical ? '100%' : '4px',
          marginRight: vertical ? '0' : '1px',
          marginBottom: vertical ? '1px' : '0',
          boxShadow: isActive ? '0 0 4px rgba(255,255,255,0.4)' : 'none'
        }}
      />
    );
  });
  
  return (
    <div 
      className={`flex ${vertical ? 'flex-col-reverse' : 'flex-row items-end'}`}
      style={{ height: vertical ? `${height}px` : '20px' }}
    >
      {segments}
    </div>
  );
};

// Upcoming Events list component with blinking alert
const UpcomingEventsList: React.FC = () => {
  const [currentTime] = useState(new Date());
  const [blink, setBlink] = useState(false);
  
  // Set up blinking effect for events that are close to start time
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(prev => !prev);
    }, 500); // Blink every 500ms
    
    return () => clearInterval(blinkInterval);
  }, []);
  
  // Demo upcoming events
  const upcomingEvents = [
    {
      id: 1,
      title: "Morning News",
      time: new Date(currentTime.getTime() + 90000), // 1.5 minutes away
      studio: "A",
      type: "News"
    },
    {
      id: 2,
      title: "Weather Update",
      time: new Date(currentTime.getTime() + 240000), // 4 minutes away
      studio: "B",
      type: "Weather"
    },
    {
      id: 3,
      title: "Traffic Report",
      time: new Date(currentTime.getTime() + 600000), // 10 minutes away
      studio: "A",
      type: "Traffic"
    },
    {
      id: 4,
      title: "Top of the Hour ID",
      time: new Date(currentTime.getTime() + 900000), // 15 minutes away
      studio: "A",
      type: "Station ID"
    },
    {
      id: 5,
      title: "Hourly Newscast",
      time: new Date(currentTime.getTime() + 3600000), // 1 hour away
      studio: "A",
      type: "News"
    }
  ];
  
  const isCloseToStart = (eventTime: Date) => {
    const timeDiff = eventTime.getTime() - currentTime.getTime();
    return timeDiff <= 120000; // Within 2 minutes (120 seconds)
  };
  
  const formatEventTime = (time: Date) => {
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const getTimeUntil = (time: Date) => {
    const diffMs = time.getTime() - currentTime.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffSeconds = Math.floor((diffMs % 60000) / 1000);
    
    if (diffMinutes < 1) {
      return `${diffSeconds}s`;
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ${diffSeconds}s`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const mins = diffMinutes % 60;
      return `${hours}h ${mins}m`;
    }
  };
  
  return (
    <div className="divide-y divide-zinc-700">
      {upcomingEvents.map(event => {
        const isClose = isCloseToStart(event.time);
        
        return (
          <div 
            key={event.id} 
            className={`p-3 ${isClose ? (blink ? 'bg-red-900/30' : 'bg-zinc-800') : 'bg-zinc-800'} transition-colors`}
          >
            <div className="flex justify-between items-start mb-1">
              <div className="flex items-center">
                {isClose && (
                  <AlertTriangle className="h-4 w-4 text-red-500 mr-2 animate-pulse" />
                )}
                <span className="font-medium text-sm">{event.title}</span>
              </div>
              <Badge variant={isClose ? "destructive" : "outline"} className="text-xs">
                {isClose ? "SOON" : event.studio}
              </Badge>
            </div>
            <div className="flex justify-between items-center text-xs text-zinc-400">
              <div>{event.type}</div>
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1 opacity-70" />
                {formatEventTime(event.time)}
                <span className="ml-2 text-xs">({getTimeUntil(event.time)})</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Main content component for mAirlist style layout
const MAirlistStyleContent: React.FC = () => {
  const { toast } = useToast();
  const { logoutMutation } = useAuth();
  const { 
    selectedStudio, 
    tracks,
    playlists,
    setActivePlaylist
  } = useRadioAutomation();
  
  // Get audio player service for track playback
  const audioPlayer = useAudioPlayer();
  
  // Set up a ref for the main content container
  const contentRef = useRef<HTMLDivElement>(null);
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [countdownTime, setCountdownTime] = useState(1795); // 29:55 in seconds
  const [activeTab, setActiveTab] = useState('main');
  const [activePlaylistTab, setActivePlaylistTab] = useState('current');
  
  // Library management state
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [libraryTracks, setLibraryTracks] = useState<any[]>([]);
  const [playerAOnAir, setPlayerAOnAir] = useState(true);
  const [playerBOnAir, setPlayerBOnAir] = useState(false);
  
  // Track context menu state
  const [contextMenuPosition, setContextMenuPosition] = useState<{x: number, y: number} | null>(null);
  const [selectedContextTrack, setSelectedContextTrack] = useState<any | null>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  
  // Cart wall player state
  const [cartWallPlayingCart, setCartWallPlayingCart] = useState<CartItem | null>(null);
  const [cartWallPlaybackProgress, setCartWallPlaybackProgress] = useState(0);
  const cartWallPlaybackTimerRef = useRef<number | null>(null);
  
  // Transmitter alarms state - in real implementation, this would be populated from a real-time notification system
  const [transmitterAlarms, setTransmitterAlarms] = useState<Array<{id: number, siteName: string, status: string}>>([]);
  
  // State for tracking which alarm is currently visible in the rotation
  const [currentAlarmIndex, setCurrentAlarmIndex] = useState(0);
  const [isAlarmChanging, setIsAlarmChanging] = useState(false);
  
  // Audio level analysis references
  const playerAAudioElementRef = useRef<HTMLAudioElement | null>(null);
  const playerBAudioElementRef = useRef<HTMLAudioElement | null>(null);
  const playerCAudioElementRef = useRef<HTMLAudioElement | null>(null);
  
  // Use the audio analyzer hook to get real-time audio levels
  const playerAAudioLevels = useAudioAnalyzer(
    playerAAudioElementRef.current,
    { refreshRate: 33, peakFalloffRate: 2 }
  );
  
  const playerBAudioLevels = useAudioAnalyzer(
    playerBAudioElementRef.current,
    { refreshRate: 33, peakFalloffRate: 2 }
  );
  
  const playerCAudioLevels = useAudioAnalyzer(
    playerCAudioElementRef.current,
    { refreshRate: 33, peakFalloffRate: 2 }
  );
  
  // Listen for custom event to toggle transmitter alarms
  useEffect(() => {
    console.log("Setting up transmitter alarm listener");
    
    const handleToggleAlarms = (e: any) => {
      console.log("Transmitter alarm event received:", e.detail);
      
      if (e.detail.alarmsActive) {
        // Add sample alarms when activated
        const newAlarms = [
          { id: 2, siteName: "North Hill", status: "warning" },
          { id: 6, siteName: "South Bay", status: "critical" }
        ];
        
        console.log("Setting alarms:", newAlarms);
        setTransmitterAlarms(newAlarms);
        
        toast({
          title: "TRANSMITTER ALARMS DETECTED",
          description: "Critical alerts from South Bay and North Hill stations",
          variant: "destructive"
        });
      } else {
        // Clear alarms
        console.log("Clearing alarms");
        setTransmitterAlarms([]);
        setCurrentAlarmIndex(0);
        
        toast({
          title: "Transmitter Alarms Cleared",
          description: "All transmitter alarms have been acknowledged"
        });
      }
    };
    
    // Add event listener - FORCE the type casting to make TypeScript happy
    document.addEventListener('toggleTransmitterAlarms', handleToggleAlarms as any);
    
    // Clean up the event listener
    return () => {
      document.removeEventListener('toggleTransmitterAlarms', handleToggleAlarms as any);
    };
  }, [toast]);
  
  // Effect for cycling through multiple transmitter alarms every 5 seconds with smooth sliding
  useEffect(() => {
    if (transmitterAlarms.length <= 1) return;
    
    const intervalId = setInterval(() => {
      // Start the slide-out animation
      setIsAlarmChanging(true);
      
      // After the slide-out animation completes, change the alarm index
      setTimeout(() => {
        setCurrentAlarmIndex(prevIndex => 
          prevIndex >= transmitterAlarms.length - 1 ? 0 : prevIndex + 1
        );
        
        // Start the slide-in animation for the new alarm
        setTimeout(() => {
          setIsAlarmChanging(false);
        }, 50); // Short delay to ensure DOM has updated with new alarm content
      }, 300); // This matches the slideOutLeft animation duration
    }, 5000); // Display each alarm for 5 seconds
    
    return () => clearInterval(intervalId);
  }, [transmitterAlarms.length]);
  
  // Handle cart playback
  const handleCartPlay = (cartNumber: number, pageId: number) => {
    // In a real implementation, we would fetch the cart from the database
    // or use a real audio player service
    
    // For now, simulate a cart with minimal info for UI feedback
    const cart: CartItem = {
      number: cartNumber,
      label: `Cart ${cartNumber}`,
      color: "#2563eb",
      pageId: pageId,
      duration: 30 // Default 30 seconds
    };
    
    // If the same cart is already playing, stop it
    if (cartWallPlayingCart && cartWallPlayingCart.number === cartNumber && cartWallPlayingCart.pageId === pageId) {
      // Stop playback
      if (cartWallPlaybackTimerRef.current) {
        window.clearInterval(cartWallPlaybackTimerRef.current);
        cartWallPlaybackTimerRef.current = null;
      }
      setCartWallPlayingCart(null);
      setCartWallPlaybackProgress(0);
      
      toast({
        title: "Cart stopped",
        description: `Stopped playback of cart #${cartNumber}`,
      });
      return;
    }
    
    // Reset any existing timer
    if (cartWallPlaybackTimerRef.current) {
      window.clearInterval(cartWallPlaybackTimerRef.current);
    }
    
    // Set the new cart and reset progress
    setCartWallPlayingCart(cart);
    setCartWallPlaybackProgress(0);
    
    // Simulate progress for UI feedback only
    const stepSize = 100 / (cart.duration * 2); // Update twice per second
    
    cartWallPlaybackTimerRef.current = window.setInterval(() => {
      setCartWallPlaybackProgress(prev => {
        if (prev >= 100) {
          // Playback finished
          window.clearInterval(cartWallPlaybackTimerRef.current!);
          cartWallPlaybackTimerRef.current = null;
          
          // Use a slight delay to show 100% before resetting
          setTimeout(() => {
            setCartWallPlayingCart(null);
            setCartWallPlaybackProgress(0);
          }, 500);
          
          return 100; // Keep at 100% until the timeout clears it
        }
        return prev + stepSize;
      });
    }, 500); // Update every 500ms
    
    toast({
      title: "Cart triggered",
      description: `Playing cart #${cartNumber} from page ${pageId}`,
    });
  };
  
  // Add blinkState state variable
  const [blinkState, setBlinkState] = useState<boolean>(false);
  
  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      // Simulate countdown decreasing
      setCountdownTime(prev => Math.max(0, prev - 1));
      // Toggle blink state for blinking effects
      setBlinkState(prev => !prev);
    }, 500); // Changed to 500ms for smoother blinking
    
    return () => clearInterval(timer);
  }, []);
  
  // Function to simulate adding or clearing transmitter alarms (for demo only)
  const handleToggleTransmitterAlarm = () => {
    if (transmitterAlarms.length > 0) {
      // Clear alarms if there are any
      setTransmitterAlarms([]);
      toast({
        title: "Transmitter Alarms Cleared",
        description: "All transmitter alarms have been acknowledged"
      });
    } else {
      // Add two sample alarms
      setTransmitterAlarms([
        { id: 2, siteName: "North Hill", status: "warning" },
        { id: 6, siteName: "South Bay", status: "critical" }
      ]);
      toast({
        title: "Transmitter Alarms Detected",
        description: "New transmitter alarms detected",
        variant: "destructive"
      });
    }
  };
  
  // Using filteredTracks from useMemo instead of a local function
  

  
  // Format countdown time as MM:SS
  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Set background color based on countdown time
  const getCountdownColor = () => {
    if (countdownTime <= 30) return 'bg-red-600/50';
    if (countdownTime <= 90) return 'bg-yellow-600/50';
    return 'bg-blue-600/50';
  };

  // We will use real playlists and tracks from the API instead of dummy data
  const dummyPlaylists: { id: number, name: string, active: boolean }[] = [];
  
  // Track drag state
  const [draggedTrack, setDraggedTrack] = useState<any | null>(null);
  
  // Player tracks and states - using real tracks from API with PlayerTrack type
  const [playerATracks, setPlayerATracks] = useState<PlayerTrack[]>([]);
  const [currentPlayerATrack, setCurrentPlayerATrack] = useState<PlayerTrack | null>(null);
  
  // Initial effect to load real tracks into player A playlist
  useEffect(() => {
    const fetchInitialTracks = async () => {
      try {
        // Attempt to fetch real tracks from the API
        const response = await fetch('/api/radio/tracks');
        if (response.ok) {
          const tracks = await response.json();
          
          if (Array.isArray(tracks) && tracks.length > 0) {
            // Take the first 3 tracks for playlist A (or less if fewer are available)
            const tracksForPlayerA = tracks.slice(0, 3).map((track, index) => ({
              ...track,
              status: index === 0 ? "queued" : "queued",
              position: index + 1
            }));
            
            console.log('Loading real tracks into Player A:', tracksForPlayerA);
            setPlayerATracks(tracksForPlayerA);
          }
        } else {
          console.warn('Failed to load tracks from API');
          // Leave the playlist empty if API call fails
          setPlayerATracks([]);
        }
      } catch (error) {
        console.error('Error loading tracks for playlist:', error);
        // Leave the playlist empty if there's an error
        setPlayerATracks([]);
      }
    };
    
    fetchInitialTracks();
  }, []);

  // Player B tracks - initially empty, will be populated with real tracks from API
  const [playerBTracks, setPlayerBTracks] = useState<PlayerTrack[]>([]);
  const [currentPlayerBTrack, setCurrentPlayerBTrack] = useState<PlayerTrack | null>(null);
  
  // Initial effect to load real tracks into player B playlist
  useEffect(() => {
    const fetchInitialTracksForPlayerB = async () => {
      try {
        // Attempt to fetch real tracks from the API
        const response = await fetch('/api/radio/tracks');
        if (response.ok) {
          const tracks = await response.json();
          
          if (Array.isArray(tracks) && tracks.length > 0) {
            // Take tracks 4-6 for playlist B (or less if fewer are available)
            const tracksForPlayerB = tracks.slice(3, 6).map((track, index) => ({
              ...track,
              status: index === 0 ? "next" : "queued",
              position: index + 1
            }));
            
            console.log('Loading real tracks into Player B:', tracksForPlayerB);
            setPlayerBTracks(tracksForPlayerB);
          }
        } else {
          console.warn('Failed to load tracks from API for Player B');
          // Leave the playlist empty if API call fails
          setPlayerBTracks([]);
        }
      } catch (error) {
        console.error('Error loading tracks for Player B playlist:', error);
        // Leave the playlist empty if there's an error
        setPlayerBTracks([]);
      }
    };
    
    fetchInitialTracksForPlayerB();
  }, []);

  // Player C state
  const [playerCTrack, setPlayerCTrack] = useState<PlayerTrack | null>(null);
  const [playerCPlaying, setPlayerCPlaying] = useState(false);
  
  // Define a type for player tracks that includes status and position
  type PlayerTrack = {
    id: number;
    title: string;
    artist: string | null;
    duration: number;
    path?: string;
    status: 'playing' | 'queued' | 'next';
    position: number;
    category?: string | null;
    album?: string | null;
    fileType?: string;
    fileSize?: number | null;
    folderId?: number | null;
    playCount?: number | null;
    createdAt?: Date | null;
    lastPlayedAt?: Date | null;
    waveformData?: string | null;
    cuePoint?: number;
  }
  
  // NEW FUNCTION: Add a track from the library to a player playlist
  const addTrackToPlayer = (track: any, playerType: 'playerA' | 'playerB') => {
    // Make sure we have the minimal required properties
    const trackToAdd: PlayerTrack = {
      // Copy basic track properties
      id: track.id,
      title: track.title,
      artist: track.artist || null,
      duration: track.duration,
      path: track.path,
      category: track.category || null,
      album: track.album || null,
      fileType: track.fileType,
      fileSize: track.fileSize || null,
      folderId: track.folderId || null,
      // Add status and position properties needed for the player
      status: playerType === 'playerA' ? 
        (playerATracks.length === 0 ? 'queued' : 'queued') : 
        (playerBTracks.length === 0 ? 'next' : 'queued'),
      position: playerType === 'playerA' ? 
        playerATracks.length + 1 : 
        playerBTracks.length + 1
    };

    console.log(`Adding track "${track.title}" to ${playerType} playlist`);
    
    // Create an AudioTrack version that can be used with AudioPlayerService
    const audioTrack: AudioTrack = {
      id: track.id,
      title: track.title,
      path: track.path,
      artist: track.artist || null,
      album: track.album || null,
      duration: track.duration,
      fileType: track.fileType || 'audio/mpeg',
      fileSize: track.fileSize || null,
      waveformData: null,
      cuePoints: null,
      bpm: null,
      tags: null,
      category: track.category || null,
      normalizedLevel: null,
      folderId: track.folderId || null,
      createdAt: track.createdAt || null,
      lastPlayedAt: track.lastPlayedAt || null,
      playCount: track.playCount || null
    };
    
    // Add to the appropriate player
    if (playerType === 'playerA') {
      setPlayerATracks(prev => [...prev, trackToAdd]);
      
      // Set the track in the audio player service (this loads it but doesn't play it)
      audioPlayer.setTrack(audioTrack, 'playerA');
      
      // If it's the first track, set it as the current and play it
      if (playerATracks.length === 0) {
        // Automatically load and play the track if it's the first one
        audioPlayer.playTrack(audioTrack, 'playerA');
        setPlayerAOnAir(true);
        setPlayerBOnAir(false);
      }
      
      toast({
        title: "Track added",
        description: `Added "${track.title}" to Player A playlist`,
      });
    } else {
      setPlayerBTracks(prev => [...prev, trackToAdd]);
      
      // Set the track in the audio player service (this loads it but doesn't play it)
      audioPlayer.setTrack(audioTrack, 'playerB');
      
      // If it's the first track, set it as the next
      if (playerBTracks.length === 0) {
        // We don't auto-play Player B tracks
        toast({
          title: "Track added",
          description: `Added "${track.title}" to Player B playlist as next up`,
        });
      } else {
        toast({
          title: "Track added",
          description: `Added "${track.title}" to Player B playlist`,
        });
      }
    }
  };

  // Handle click on a track in the library
  const handleLibraryTrackClick = (track: any) => {
    // Create a PlayerTrack object
    const playerTrack: PlayerTrack = {
      id: track.id,
      title: track.title,
      artist: track.artist || null,
      duration: track.duration,
      path: track.path,
      category: track.category || null,
      album: track.album || null,
      fileType: track.fileType,
      fileSize: track.fileSize || null,
      folderId: track.folderId || null,
      status: 'queued',
      position: playerATracks.length + 1,
      waveformData: track.waveformData || null,
      cuePoint: track.cuePoint || null
    };
    
    // Default behavior - add to Player A
    addTrackToPlayer(playerTrack, 'playerA');
  };
  
  // Generic function to add a track to a specific player's playlist
  const addTrackToPlayerPlaylist = (playerType: 'A' | 'B' | 'C', trackToUse: any) => {
    if (!trackToUse) {
      toast({
        title: "Error",
        description: "No track selected",
        variant: "destructive",
      });
      return;
    }
    
    // Update state properly using React state management
    if (playerType === 'A') {
      // Create new track with proper position
      const newPosition = playerATracks.length + 1;
      
      // Create a complete track object using PlayerTrack type
      const newTrack: PlayerTrack = {
        id: trackToUse.id,
        title: trackToUse.title,
        artist: trackToUse.artist || null,
        duration: trackToUse.duration,
        path: trackToUse.path,
        category: trackToUse.category || null,
        album: trackToUse.album || null,
        fileType: trackToUse.fileType,
        fileSize: trackToUse.fileSize || null,
        folderId: trackToUse.folderId || null,
        playCount: trackToUse.playCount || null,
        createdAt: trackToUse.createdAt || null,
        lastPlayedAt: trackToUse.lastPlayedAt || null,
        status: "queued",
        position: newPosition,
        waveformData: trackToUse.waveformData || null,
        cuePoint: trackToUse.cuePoint || null
      };
      
      // Add the track to Player A tracks state
      setPlayerATracks(prev => [...prev, newTrack]);
      console.log(`Added ${trackToUse.title} to Studio A playlist`);
      
    } else if (playerType === 'B') {
      // Create new track with proper position
      const newPosition = playerBTracks.length + 1;
      
      // Create a complete track object
      const newTrack: PlayerTrack = {
        id: trackToUse.id,
        title: trackToUse.title,
        artist: trackToUse.artist || null,
        duration: trackToUse.duration,
        path: trackToUse.path,
        category: trackToUse.category || null,
        album: trackToUse.album || null,
        fileType: trackToUse.fileType,
        fileSize: trackToUse.fileSize || null,
        folderId: trackToUse.folderId || null,
        playCount: trackToUse.playCount || null,
        createdAt: trackToUse.createdAt || null,
        lastPlayedAt: trackToUse.lastPlayedAt || null,
        status: "queued",
        position: newPosition,
        waveformData: trackToUse.waveformData || null,
        cuePoint: trackToUse.cuePoint || null
      };
      
      // Add the track to Player B tracks state
      setPlayerBTracks(prev => [...prev, newTrack]);
      console.log(`Added ${trackToUse.title} to Studio B playlist`);
      
    } else if (playerType === 'C') {
      // For Player C, we just load the single track (no playlist)
      // Create a minimal PlayerTrack object for Player C
      const playerCTrackObj: PlayerTrack = {
        id: trackToUse.id,
        title: trackToUse.title,
        artist: trackToUse.artist || null,
        duration: trackToUse.duration,
        path: trackToUse.path,
        category: trackToUse.category || null,
        album: trackToUse.album || null,
        fileType: trackToUse.fileType,
        fileSize: trackToUse.fileSize || null,
        folderId: trackToUse.folderId || null,
        playCount: trackToUse.playCount || null,
        createdAt: trackToUse.createdAt || null,
        lastPlayedAt: trackToUse.lastPlayedAt || null,
        status: 'queued',
        position: 1,
        waveformData: trackToUse.waveformData || null,
        cuePoint: trackToUse.cuePoint || null
      };
      
      // Set the track to Player C
      setPlayerCTrack(playerCTrackObj);
      setPlayerCPlaying(false);
      console.log(`Loaded ${trackToUse.title} into universal Player C`);
    }
  };
  
  // Functions to handle track playback with AudioPlayerService
  const handlePlayTrack = (track: any, playerType: 'playerA' | 'playerB' | 'playerC') => {
    console.log("handlePlayTrack called with track:", track);
    
    // Safety check - make sure we have a valid track object
    if (!track) {
      console.error("Attempted to play undefined or null track");
      toast({
        title: "Playback Error",
        description: "Cannot play: invalid track data",
        variant: "destructive"
      });
      return;
    }
    
    // If track doesn't have a valid path, try to fetch it from the server
    if (!track.path) {
      console.log("Track is missing path:", track);
      
      // If we have a track ID, we can try to fetch the complete track data
      if (track.id) {
        console.log("Fetching full track data for ID:", track.id);
        
        // Show loading toast
        toast({
          title: "Loading Track Data",
          description: `Preparing ${track.title || 'track'} for playback...`,
        });
        
        // Get the full track data from API
        fetch(`/api/radio/tracks/${track.id}`)
          .then(response => {
            if (!response.ok) {
              throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            return response.json();
          })
          .then(fullTrack => {
            if (fullTrack && fullTrack.path) {
              console.log("Got full track data with path:", fullTrack.path);
              // Call this function again with the complete track data
              handlePlayTrack(fullTrack, playerType);
            } else {
              console.error("Failed to get valid track path even after fetching track data");
              toast({
                title: "Playback Error",
                description: "Could not find the audio file path for this track",
                variant: "destructive"
              });
            }
          })
          .catch(err => {
            console.error("Error fetching track data:", err);
            toast({
              title: "Playback Error",
              description: "Could not load the track data from the server",
              variant: "destructive"
            });
          });
        return;
      } else {
        console.error("Track has no ID and no path, cannot play");
        toast({
          title: "Playback Error",
          description: "This track is missing essential data for playback",
          variant: "destructive"
        });
        return;
      }
    }
    
    // If we get here, we have a track with a path
    // Convert to an AudioTrack that's compatible with AudioPlayerService
    // Make sure to handle any missing properties with defaults
    const audioTrack: AudioTrack = {
      id: track.id || 0,
      title: track.title || 'Unknown Track',
      path: track.path, // We already checked this exists above
      artist: track.artist || null,
      album: track.album || null,
      duration: track.duration || 120, // Default to 2 mins if duration unknown
      fileType: track.fileType || 'audio/mpeg',
      fileSize: track.fileSize || null,
      waveformData: track.waveformData || null,
      cuePoints: Array.isArray(track.cuePoints) ? track.cuePoints : null,
      bpm: track.bpm || null,
      tags: Array.isArray(track.tags) ? track.tags : null,
      category: track.category || null,
      normalizedLevel: track.normalizedLevel || null,
      folderId: track.folderId || null,
      createdAt: track.createdAt || null,
      lastPlayedAt: track.lastPlayedAt || null,
      playCount: track.playCount || null
    };

    console.log(`Playing track "${audioTrack.title}" on ${playerType} with path: ${audioTrack.path}`);
    
    try {
      // Play the track using the AudioPlayerService
      audioPlayer.playTrack(audioTrack, playerType);
      
      // Create a player track that's compatible with our player UI
      // Make sure to handle any potentially missing properties with sensible defaults
      const playerTrack: PlayerTrack = {
        id: audioTrack.id,
        title: audioTrack.title,
        artist: audioTrack.artist,
        duration: audioTrack.duration,
        path: audioTrack.path,
        category: audioTrack.category,
        album: audioTrack.album,
        fileType: audioTrack.fileType,
        fileSize: audioTrack.fileSize,
        folderId: audioTrack.folderId,
        createdAt: audioTrack.createdAt,
        lastPlayedAt: audioTrack.lastPlayedAt,
        playCount: audioTrack.playCount,
        status: 'playing' as const, // Use 'as const' to fix the type issue
        position: 1,
        waveformData: audioTrack.waveformData,
        cuePoint: audioTrack.cuePoints && audioTrack.cuePoints.length > 0 ? audioTrack.cuePoints[0] : null
      };
      
      // Update UI state based on which player is used
      if (playerType === 'playerA') {
        setPlayerAOnAir(true);
        setPlayerBOnAir(false);
        
        // Connect audio element to analyzer after a short delay
        setTimeout(() => {
          const audioElement = document.querySelector('audio[data-player="playerA"]') as HTMLAudioElement;
          if (audioElement) {
            playerAAudioElementRef.current = audioElement;
            console.log('Connected Player A audio element to analyzer');
          }
        }, 100); // Short delay to ensure the element is loaded
        
        // Check if the track is already in the player's list
        const trackInList = playerATracks.some(t => t.id === audioTrack.id);
        
        if (!trackInList) {
          // Add the track to the player if it's not already there
          setPlayerATracks(prev => {
            // Find the highest position
            const highestPosition = Math.max(0, ...prev.map(t => t.position || 0));
            return [...prev, { ...playerTrack, position: highestPosition + 1 }];
          });
        } else {
          // Just update the status
          setPlayerATracks(prev => prev.map(t => 
            t.id === audioTrack.id 
              ? { ...t, status: 'playing' as const } 
              : { ...t, status: t.status === 'playing' ? ('queued' as const) : t.status }
          ));
        }
      } else if (playerType === 'playerB') {
        setPlayerAOnAir(false);
        setPlayerBOnAir(true);
        
        // Connect audio element to analyzer after a short delay
        setTimeout(() => {
          const audioElement = document.querySelector('audio[data-player="playerB"]') as HTMLAudioElement;
          if (audioElement) {
            playerBAudioElementRef.current = audioElement;
            console.log('Connected Player B audio element to analyzer');
          }
        }, 100); // Short delay to ensure the element is loaded
        
        // Check if the track is already in the player's list
        const trackInList = playerBTracks.some(t => t.id === audioTrack.id);
        
        if (!trackInList) {
          // Add the track to the player if it's not already there
          setPlayerBTracks(prev => {
            // Find the highest position
            const highestPosition = Math.max(0, ...prev.map(t => t.position || 0));
            return [...prev, { ...playerTrack, position: highestPosition + 1 }];
          });
        } else {
          // Just update the status
          setPlayerBTracks(prev => prev.map(t => 
            t.id === audioTrack.id 
              ? { ...t, status: 'playing' as const } 
              : { ...t, status: t.status === 'playing' ? ('queued' as const) : t.status }
          ));
        }
      } else if (playerType === 'playerC') {
        setPlayerAOnAir(false);
        setPlayerBOnAir(false);
        setPlayerCPlaying(true);
        setPlayerCTrack(playerTrack);
        
        // Connect audio element to analyzer after a short delay
        setTimeout(() => {
          const audioElement = document.querySelector('audio[data-player="playerC"]') as HTMLAudioElement;
          if (audioElement) {
            playerCAudioElementRef.current = audioElement;
            console.log('Connected Player C audio element to analyzer');
          }
        }, 100); // Short delay to ensure the element is loaded
      }
      
      toast({
        title: "Playing track",
        description: `${audioTrack.title} by ${audioTrack.artist || 'Unknown Artist'} is now playing on ${playerType === 'playerA' ? 'Player A' : playerType === 'playerB' ? 'Player B' : 'Player C'}`,
      });
    } catch (error) {
      console.error('Error playing track:', error);
      toast({
        title: "Playback Error",
        description: `Failed to play track: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };
  
  const handlePauseTrack = (playerType: 'playerA' | 'playerB' | 'playerC') => {
    console.log(`Pausing playback on ${playerType}`);
    audioPlayer.pauseTrack(playerType);
    
    // Update UI state
    if (playerType === 'playerA') {
      setPlayerAOnAir(false);
    } else if (playerType === 'playerB') {
      setPlayerBOnAir(false);
    } else if (playerType === 'playerC') {
      setPlayerCPlaying(false);
    }
    
    toast({
      title: "Playback paused",
      description: `Paused playback on ${playerType === 'playerA' ? 'Player A' : playerType === 'playerB' ? 'Player B' : 'Player C'}`,
    });
  };

  // DJ Mode state
  const [autoDjEnabled, setAutoDjEnabled] = useState<boolean>(true);
  const [autoDjBlinking, setAutoDjBlinking] = useState<boolean>(false);
  const [manualDjBlinking, setManualDjBlinking] = useState<boolean>(false);
  const [flashingState, setFlashingState] = useState<boolean>(false);
  
  // Professional flashing effects for Auto DJ and Manual DJ buttons
  // Each has its own interval for different blinking speeds
  useEffect(() => {
    let autoDjInterval: NodeJS.Timeout | null = null;
    let manualDjInterval: NodeJS.Timeout | null = null;
    
    // Auto DJ blinks every 2 seconds when active
    if (autoDjBlinking) {
      autoDjInterval = setInterval(() => {
        setFlashingState((prevState) => !prevState);
      }, 2000); // 2 seconds interval
    }
    
    // Manual DJ blinks every 0.5 seconds when active
    if (manualDjBlinking) {
      manualDjInterval = setInterval(() => {
        setFlashingState((prevState) => !prevState);
      }, 500); // 0.5 seconds interval
    }
    
    // Reset when neither is blinking
    if (!autoDjBlinking && !manualDjBlinking) {
      setFlashingState(false);
    }
    
    return () => {
      if (autoDjInterval) clearInterval(autoDjInterval);
      if (manualDjInterval) clearInterval(manualDjInterval);
    };
  }, [autoDjBlinking, manualDjBlinking]);
  
  // Create folder dialog state
  const [newFolderDescription, setNewFolderDescription] = useState('');
  
  // Settings dialog state
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  
  // Folders and tracks from database - using useRadioAutomation provided methods
  const { 
    folders,
    foldersLoading,
    getTracksForFolder,
    searchTracks,
    createFolderMutation,
    deleteFolder
  } = useRadioAutomation();
  
  // Local state for create folder dialog
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  // Load tracks for selected folder
  const [currentTracks, setCurrentTracks] = useState<any[]>([]);
  const [tracksLoadingState, setTracksLoadingState] = useState(false);
  
  // Use a ref to track if we've shown the initial welcome toast
  const initialWelcomeShown = useRef(false);
  
  // Use a ref to track the previous folder ID to avoid duplicate toasts
  const prevFolderIdRef = useRef<number | null>(null);
  
  // Track expanded folders
  const [expandedFolders, setExpandedFolders] = useState<number[]>([]);
  
  // Empty object to replace demo tracks
  const demoFolderTracks = {};
  
  useEffect(() => {
    const loadTracks = async () => {
      setTracksLoadingState(true);
      try {
        let loadedTracks;
        
        // Check if folder selection changed
        const folderChanged = prevFolderIdRef.current !== selectedFolderId;
        prevFolderIdRef.current = selectedFolderId;
        
        if (selectedFolderId) {
          loadedTracks = await getTracksForFolder(selectedFolderId);
          
          // Only show toast if folder explicitly changed by user action, not on initial load
          if (folderChanged && loadedTracks) {
            const selectedFolder = folders.find(f => f.id === selectedFolderId);
            if (selectedFolder) {
              console.log(`Loaded ${loadedTracks.length} tracks from folder "${selectedFolder.name}"`);
            }
          }
        } else if (searchQuery) {
          loadedTracks = await searchTracks(searchQuery);
          
          // Only show toast for explicit searches
          if (searchQuery.trim() !== '' && loadedTracks) {
            console.log(`Found ${loadedTracks.length} tracks matching "${searchQuery}"`);
          }
        } else {
          // Get all tracks
          loadedTracks = await getTracksForFolder(null);
          
          // Show welcome notification on very first load only
          if (!initialWelcomeShown.current && loadedTracks) {
            initialWelcomeShown.current = true;
            console.log(`Loaded ${loadedTracks.length} tracks from your library`);
          }
        }
        
        setCurrentTracks(loadedTracks || []);
      } catch (error) {
        console.error('Error loading tracks:', error);
        // Only show error toasts, as they're important
        toast({
          title: "Error",
          description: "Failed to load tracks. Please try again.",
          variant: "destructive",
        });
      } finally {
        setTracksLoadingState(false);
      }
    };
    
    loadTracks();
  }, [selectedFolderId, searchQuery, getTracksForFolder, searchTracks, folders, toast]);
  
  // Filtered tracks based on search
  const filteredTracks = useMemo(() => {
    if (!searchQuery) return currentTracks;
    
    // Filter tracks based on search query - case insensitive matching on title, artist, or album
    return currentTracks.filter(track => {
      const query = searchQuery.toLowerCase();
      return (
        (track.title && track.title.toLowerCase().includes(query)) ||
        (track.artist && track.artist.toLowerCase().includes(query)) ||
        (track.album && track.album.toLowerCase().includes(query))
      );
    });
  }, [currentTracks, searchQuery]);
  
  // Auto DJ initial blink - only runs once when Auto DJ is first enabled
  useEffect(() => {
    if (autoDjEnabled && !autoDjBlinking) {
      // Set blinking when Auto DJ is enabled
      setAutoDjBlinking(true);
    }
  }, [autoDjEnabled, autoDjBlinking]);
  
  // Get playback state from context - needed for Auto DJ
  const { playbackState } = useRadioAutomation();
  
  // Auto DJ playback controller for active playlist
  useEffect(() => {
    if (!playbackState) return;
    
    let autoDjInterval: NodeJS.Timeout | null = null;
    
    // Listen for track end events to automatically play the next track
    const handleTrackEnd = (event: Event) => {
      if (autoDjEnabled) {
        console.log('🎵 AUTO DJ: Track ended event detected, preparing to play next track...', event);
        
        // Try to get details about which player/track ended from the event
        const customEvent = event as CustomEvent;
        if (customEvent.detail) {
          console.log('🎵 AUTO DJ: Track ended details:', customEvent.detail);
          
          // Only act if this is from the main player (playerA)
          if (customEvent.detail.playerId === 'playerA') {
            // Add a very small delay to ensure clean transition
            setTimeout(() => {
              console.log('🎵 AUTO DJ: Playing next track after end event');
              playNextTrackFromActivePlaylist();
            }, 100); // Very short delay for faster response
          }
        }
      }
    };
    
    // Enhanced track end approaching handler with priority levels and direct memory playback
    const handleTrackEndApproaching = (event: Event) => {
      if (autoDjEnabled) {
        const customEvent = event as CustomEvent;
        if (customEvent.detail) {
          const { playerId, track, remainingTime, priority } = customEvent.detail;
          
          console.log(`🎵 AUTO DJ: Track approaching end event received (${priority || 'default'} priority):`, customEvent.detail);
          
          // Only act if this is from the main player (playerA)
          if (playerId === 'playerA') {
            // Different actions based on priority level
            if (priority === 'early') {
              // Early warning - start prebuffering the next track
              console.log('🟢 AUTO DJ EARLY: Starting to prebuffer next track');
              
              // Find the next track in our player tracks
              const nextUpTrack = playerATracks.find(track => track.status === 'next');
              
              if (nextUpTrack && audioPlayer) {
                console.log(`🟢 AUTO DJ EARLY: Prebuffering "${nextUpTrack.title}" with ${remainingTime.toFixed(2)}s remaining`);
                
                // Create audio track from player track
                const audioTrack: AudioTrack = {
                  id: nextUpTrack.id,
                  title: nextUpTrack.title,
                  artist: nextUpTrack.artist || '',
                  album: nextUpTrack.album || null,
                  duration: nextUpTrack.duration,
                  path: nextUpTrack.path || '',
                  fileType: nextUpTrack.fileType || 'mp3',
                  fileSize: nextUpTrack.fileSize || null,
                  waveformData: null,
                  cuePoints: null,
                  bpm: null,
                  tags: null,
                  category: nextUpTrack.category || null,
                  normalizedLevel: null,
                  folderId: null,
                  createdAt: null,
                  lastPlayedAt: null,
                  playCount: null
                };
                
                // Use the prebuffer function from AudioPlayerService
                audioPlayer.prebufferTrack(audioTrack, 'playerA');
              } else {
                // If no next track in memory, try to fetch one
                console.log('🟢 AUTO DJ EARLY: No next track in memory, fetching from API');
                playNextTrackFromActivePlaylist();
              }
            }
            else if (priority === 'medium') {
              // Medium priority - load the next track into player so it's ready
              console.log('🟡 AUTO DJ MEDIUM: Loading next track into player');
              
              const currentPlayingTrack = playerATracks.find(track => track.status === 'playing');
              const nextUpTrack = playerATracks.find(track => track.status === 'next');
              
              if (currentPlayingTrack) {
                console.log(`🟡 AUTO DJ MEDIUM: Currently playing "${currentPlayingTrack.title}" with ${remainingTime.toFixed(2)}s remaining`);
              }
              
              if (nextUpTrack && audioPlayer) {
                console.log(`🟡 AUTO DJ MEDIUM: Next track is "${nextUpTrack.title}", loading now`);
                
                // Create audio track from player track
                const audioTrack: AudioTrack = {
                  id: nextUpTrack.id,
                  title: nextUpTrack.title,
                  artist: nextUpTrack.artist || '',
                  album: nextUpTrack.album || null,
                  duration: nextUpTrack.duration,
                  path: nextUpTrack.path || '',
                  fileType: nextUpTrack.fileType || 'mp3',
                  fileSize: nextUpTrack.fileSize || null,
                  waveformData: null,
                  cuePoints: null,
                  bpm: null,
                  tags: null,
                  category: nextUpTrack.category || null,
                  normalizedLevel: null,
                  folderId: null,
                  createdAt: null,
                  lastPlayedAt: null,
                  playCount: null
                };
                
                // Load the track but don't play it yet - this gets it ready
                audioPlayer.loadTrack(audioTrack, 'playerA');
              } else {
                // If no next track in memory, try to fetch one
                console.log('🟡 AUTO DJ MEDIUM: No next track in memory, fetching from API');
                playNextTrackFromActivePlaylist();
              }
            }
            else if (priority === 'critical') {
              // Critical priority - play the next track immediately
              console.log('🔴 AUTO DJ CRITICAL: Playing next track immediately');
              
              const currentPlayingTrack = playerATracks.find(track => track.status === 'playing');
              const nextUpTrack = playerATracks.find(track => track.status === 'next');
              
              if (currentPlayingTrack) {
                console.log(`🔴 AUTO DJ CRITICAL: Currently playing "${currentPlayingTrack.title}" with only ${remainingTime.toFixed(2)}s remaining!`);
              }
              
              if (nextUpTrack && audioPlayer) {
                console.log(`🔴 AUTO DJ CRITICAL: Next track is "${nextUpTrack.title}", playing immediately`);
                
                // Create audio track from player track
                const audioTrack: AudioTrack = {
                  id: nextUpTrack.id,
                  title: nextUpTrack.title,
                  artist: nextUpTrack.artist || '',
                  album: nextUpTrack.album || null,
                  duration: nextUpTrack.duration,
                  path: nextUpTrack.path || '',
                  fileType: nextUpTrack.fileType || 'mp3',
                  fileSize: nextUpTrack.fileSize || null,
                  waveformData: null,
                  cuePoints: null,
                  bpm: null,
                  tags: null,
                  category: nextUpTrack.category || null,
                  normalizedLevel: null,
                  folderId: null,
                  createdAt: null,
                  lastPlayedAt: null,
                  playCount: null
                };
                
                // Play the track directly from memory
                audioPlayer.playTrack(audioTrack, 'playerA');
                
                // Update track statuses in our local state
                const currentPosition = nextUpTrack.position || 0;
                const updatedTracks = playerATracks.map(track => {
                  if (track.id === nextUpTrack.id) {
                    // This track becomes the playing track
                    return { ...track, status: 'playing' as const };
                  } else if (track.status === 'playing') {
                    // The previously playing track is now just queued
                    return { ...track, status: 'queued' as const };
                  } else if (track.position === currentPosition + 1) {
                    // The track after the now-playing track becomes next
                    return { ...track, status: 'next' as const };
                  } else if (track.status === 'next' && track.id !== nextUpTrack.id) {
                    // Any other track marked as next, but not the one we're playing
                    return { ...track, status: 'queued' as const };
                  }
                  return track;
                });
                
                // Update the track list in state
                setPlayerATracks(updatedTracks);
                
                // Update the current track in the player
                setCurrentPlayerATrack(nextUpTrack);
              } else {
                // Default fallback to API method
                console.log('🔴 AUTO DJ CRITICAL: No next track in memory, using API fallback');
                playNextTrackFromActivePlaylist();
              }
            }
            else {
              // Default case (no priority specified) - use API method
              console.log('🎵 AUTO DJ: Standard priority - preparing track transition');
              playNextTrackFromActivePlaylist();
            }
          }
        }
      }
    };
    
    // Helper function to check if we have any playable tracks for Auto DJ
    const hasPlayableTracks = () => {
      // Check if playerA has tracks (they're already loaded in UI)
      if (playerATracks && playerATracks.length > 0) {
        return true;
      }
      
      // If not, could be no tracks are visible yet but they exist in playlists
      // This condition prevents false warnings
      return false;
    };
    
    // Enhanced handler for the autoDjPlayNext event - direct memory track playback
    const handleAutoDjPlayNext = (event: Event) => {
      if (autoDjEnabled) {
        const customEvent = event as CustomEvent;
        if (customEvent.detail) {
          console.log('🔥 AUTO DJ: Direct PlayNext event received:', customEvent.detail);
          
          // CRITICAL FIX: Check if we have a valid "next" track in memory first
          // This provides a much faster path to playing the next track
          if (playerATracks.length > 0) {
            const nextTrack = playerATracks.find(t => t.status === 'next');
            if (nextTrack) {
              console.log('🚀 CRITICAL AUTO DJ FIX: Playing next track directly from memory:', nextTrack.title);
              
              // Load the track directly - this is much faster than API calls
              if (audioPlayer) {
                // Create an AudioTrack from the PlayerTrack we have in memory
                const audioTrack: AudioTrack = {
                  id: nextTrack.id,
                  title: nextTrack.title,
                  artist: nextTrack.artist || '',
                  album: nextTrack.album || null,
                  duration: nextTrack.duration,
                  path: nextTrack.path || '',
                  fileType: nextTrack.fileType || 'mp3',
                  fileSize: nextTrack.fileSize || null,
                  waveformData: null,
                  cuePoints: null,
                  bpm: null,
                  tags: null,
                  category: nextTrack.category || null,
                  normalizedLevel: null,
                  folderId: null,
                  createdAt: null,
                  lastPlayedAt: null,
                  playCount: null
                };
                
                // Direct playback via audio player service
                audioPlayer.playTrack(audioTrack, 'playerA');
                
                // Update track statuses in our local state
                const currentPosition = nextTrack.position || 0;
                const updatedTracks = playerATracks.map(track => {
                  if (track.id === nextTrack.id) {
                    // This track becomes the playing track
                    return { ...track, status: 'playing' as const };
                  } else if (track.status === 'playing') {
                    // The previously playing track is now just queued
                    return { ...track, status: 'queued' as const };
                  } else if (track.position === currentPosition + 1) {
                    // The track after the now-playing track becomes next
                    return { ...track, status: 'next' as const };
                  } else if (track.status === 'next' && track.id !== nextTrack.id) {
                    // Any other track marked as next, but not the one we're playing
                    return { ...track, status: 'queued' as const };
                  }
                  return track;
                });
                
                // Update the track list in state
                setPlayerATracks(updatedTracks);
                
                // Update the current track in the player
                setCurrentPlayerATrack(nextTrack);
                
                // We've handled the playback directly, so return early
                return;
              }
            }
          }
          
          // If no specific player ID is provided, or if it matches playerA,
          // or if we couldn't play directly from memory, fall back to the API method
          if (!customEvent.detail.playerId || customEvent.detail.playerId === 'playerA') {
            console.log('🔥 AUTO DJ: Forcing next track playback via API for continuous Auto DJ');
            // Attempt to play via API as a fallback
            playNextTrackFromActivePlaylist();
          }
        }
      }
    };
    
    // Add event listeners for track ended, approaching end, and the new direct play next
    document.addEventListener('trackEnded', handleTrackEnd);
    document.addEventListener('trackEndApproaching', handleTrackEndApproaching);
    document.addEventListener('autoDjPlayNext', handleAutoDjPlayNext);
    
    const playNextTrackFromActivePlaylist = async () => {
      try {
        // Exit immediately if Auto DJ is disabled
        if (!autoDjEnabled) {
          console.log('Auto DJ is disabled, playNextTrackFromActivePlaylist aborted');
          return;
        }
        
        console.log('Auto DJ: playNextTrackFromActivePlaylist invoked');
        
        // Find the active playlist
        const activePlaylist = playlists.find((p: any) => p.isActive);
        
        if (!activePlaylist) {
          console.log('No active playlist found for Auto DJ');
          return;
        }
        
        // Fetch the current items in the active playlist
        console.log(`Auto DJ: Fetching items for playlist ${activePlaylist.id} (${activePlaylist.name})`);
        const response = await fetch(`/api/radio/playlists/${activePlaylist.id}/items`);
        if (!response.ok) {
          console.error(`Failed to fetch active playlist items: ${response.status} ${response.statusText}`);
          return;
        }
        
        const playlistItems = await response.json();
        console.log(`Auto DJ: Found ${playlistItems.length} items in playlist ${activePlaylist.name}`);
        
        if (playlistItems.length === 0) {
          console.log('No tracks in active playlist for Auto DJ');
          
          // Try to find another playlist with tracks
          console.log('Auto DJ: Searching for alternative playlists with tracks');
          const allPlaylistsResponse = await fetch('/api/radio/playlists');
          if (allPlaylistsResponse.ok) {
            const allPlaylists = await allPlaylistsResponse.json();
            console.log(`Auto DJ: Found ${allPlaylists.length} total playlists`);
            
            // Find a playlist that isn't currently active and has tracks
            for (const playlist of allPlaylists) {
              if (playlist.id !== activePlaylist.id) {
                // Check if this playlist has tracks
                const playlistItemsResponse = await fetch(`/api/radio/playlists/${playlist.id}/items`);
                if (playlistItemsResponse.ok) {
                  const items = await playlistItemsResponse.json();
                  if (items.length > 0) {
                    // This playlist has tracks, activate it
                    console.log(`Auto DJ: Switching to playlist ${playlist.name} which has ${items.length} tracks`);
                    
                    // Deactivate current playlist
                    await fetch(`/api/radio/playlists/${activePlaylist.id}/activate`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ isActive: false })
                    });
                    
                    // Activate new playlist
                    await fetch(`/api/radio/playlists/${playlist.id}/activate`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ isActive: true })
                    });
                    
                    toast({
                      title: "Auto DJ Switched Playlists",
                      description: `Now using playlist: ${playlist.name}`,
                      variant: "default",
                    });
                    
                    // Re-run this function to play from the new playlist
                    console.log('Auto DJ: Scheduling playback from new playlist');
                    setTimeout(playNextTrackFromActivePlaylist, 500);
                    return;
                  }
                }
              }
            }
          }
          
          // If we get here, no other playlists with tracks were found
          console.log('Auto DJ: No playlists with tracks found in API');
          
          // Check if we have tracks in the UI already loaded into players before showing a warning
          if (!hasPlayableTracks()) {
            console.log('Auto DJ: No tracks in UI either, showing warning');
            // Only show warning if we don't have any tracks already loaded
            toast({
              title: "Auto DJ Warning",
              description: "No tracks available in any playlist. Please add tracks to continue Auto DJ.",
              variant: "destructive",
            });
          } else {
            console.log('Auto DJ: No playlists with tracks in API, but we have tracks in players');
          }
          return;
        }
        
        // Find played tracks to remove
        const playedItems = playlistItems.filter((item: any) => item.isPlayed);
        
        // Remove played tracks from UI
        if (playedItems.length > 0) {
          for (const item of playedItems) {
            try {
              // Remove from playlist in UI
              const currentPlayerATracks = [...playerATracks];
              const filteredTracks = currentPlayerATracks.filter(track => track.id !== item.track.id);
              setPlayerATracks(filteredTracks);
              
              // Also remove from server-side playlist
              await fetch(`/api/radio/playlists/${activePlaylist.id}/items/${item.id}`, {
                method: 'DELETE'
              });
              
              console.log(`Removed played track: ${item.track.title}`);
            } catch (error) {
              console.error('Error removing played track:', error);
            }
          }
        }
        
        // Find the first unplayed track or the first track if all are played
        const unplayedItems = playlistItems.filter((item: any) => !item.isPlayed);
        const nextItem = unplayedItems.length > 0 ? unplayedItems[0] : (playlistItems.length > 0 ? playlistItems[0] : null);
        
        if (nextItem && nextItem.track) {
          // Check if player is already playing something 
          const currentPlayback = playbackState?.A;
          
          // Only play next if player is stopped or current track is ending soon (less than 5 seconds left)
          const isPlayerStopped = currentPlayback?.status === 'stopped';
          const isCurrentTrackEnding = currentPlayback?.status === 'playing' && 
                                      currentPlayback?.currentPosition > (currentPlayback?.currentTrack?.duration || 0) - 5;
                                      
          if (isPlayerStopped || isCurrentTrackEnding) {
            console.log('Auto DJ playing next track from active playlist:', nextItem.track.title);
            
            // Create a track that can be played with all required AudioTrack fields
            const audioTrack: AudioTrack = {
              id: nextItem.track.id,
              title: nextItem.track.title,
              artist: nextItem.track.artist,
              album: nextItem.track.album || null,
              duration: nextItem.track.duration,
              path: nextItem.track.path,
              fileType: nextItem.track.fileType || 'mp3',
              fileSize: nextItem.track.fileSize || null,
              waveformData: nextItem.track.waveformData || null,
              cuePoints: nextItem.track.cuePoints || null,
              bpm: nextItem.track.bpm || null,
              tags: nextItem.track.tags || null,
              category: nextItem.track.category || null,
              normalizedLevel: nextItem.track.normalizedLevel || null,
              folderId: nextItem.track.folderId || null,
              createdAt: nextItem.track.createdAt || null,
              lastPlayedAt: nextItem.track.lastPlayedAt || null,
              playCount: nextItem.track.playCount || null
            };
            
            // Get the next track in the playlist for prebuffering
            const nextNextItem = playlistItems.find((item: any, index: number) => 
              item.id !== nextItem.id && !item.isPlayed && 
              (unplayedItems.length > 1 
                ? unplayedItems.findIndex((ui: any) => ui.id === nextItem.id) + 1 === index
                : false)
            );
            
            // Update the playlist UI with clear PLAYING and NEXT labels
            const updatedPlayerATracks = playlistItems.map((item: any, index: number) => {
              // Get track data
              const trackData = item.track;
              
              // Create a PlayerTrack with proper status
              return {
                position: index + 1,
                // Mark as "playing" if it's the current track, "next" if it's the next track, otherwise "queued"
                status: item.id === nextItem.id ? 'playing' as const : 
                       (nextNextItem && item.id === nextNextItem.id) ? 'next' as const : 'queued' as const,
                id: trackData.id,
                title: trackData.title,
                artist: trackData.artist,
                duration: trackData.duration,
                path: trackData.path,
                category: trackData.category,
                album: trackData.album,
                fileType: trackData.fileType,
                fileSize: trackData.fileSize,
                waveformData: trackData.waveformData,
                cuePoint: trackData.cuePoint
              };
            });
            
            // Update the playlist display
            setPlayerATracks(updatedPlayerATracks);
            
            // Play track using the audio player service
            console.log('Auto DJ: Playing track and marking as PLAYING:', nextItem.track.title);
            audioPlayer.playTrack(audioTrack, 'playerA');
            
            // If there's a next track coming up, prebuffer it for smooth transitions
            if (nextNextItem && nextNextItem.track) {
              console.log('Auto DJ: Prebuffering NEXT track:', nextNextItem.track.title);
              
              // Create the next audio track object
              const nextAudioTrack: AudioTrack = {
                id: nextNextItem.track.id,
                title: nextNextItem.track.title,
                artist: nextNextItem.track.artist,
                album: nextNextItem.track.album || null,
                duration: nextNextItem.track.duration,
                path: nextNextItem.track.path,
                fileType: nextNextItem.track.fileType || 'mp3',
                fileSize: nextNextItem.track.fileSize || null,
                waveformData: nextNextItem.track.waveformData || null,
                cuePoints: nextNextItem.track.cuePoints || null,
                bpm: nextNextItem.track.bpm || null,
                tags: nextNextItem.track.tags || null,
                category: nextNextItem.track.category || null,
                normalizedLevel: nextNextItem.track.normalizedLevel || null,
                folderId: nextNextItem.track.folderId || null,
                createdAt: nextNextItem.track.createdAt || null,
                lastPlayedAt: nextNextItem.track.lastPlayedAt || null,
                playCount: nextNextItem.track.playCount || null
              };
              
              // Prebuffer the next track
              audioPlayer.prebufferNextTrack(nextAudioTrack, 'playerA');
            }
            
            // Mark the track as played
            await fetch(`/api/radio/playlists/${activePlaylist.id}/items/${nextItem.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ isPlayed: true })
            });
          }
        }
      } catch (error) {
        console.error('Error in Auto DJ playback:', error);
      }
    };
    
    if (autoDjEnabled) {
      // Clear any existing interval first to prevent duplicates
      if (autoDjInterval) {
        clearInterval(autoDjInterval);
      }
      
      console.log('🎵 AUTO DJ: Initial playlist check and starting Auto DJ mode');
      
      // Initial playlist check and play
      setTimeout(() => {
        playNextTrackFromActivePlaylist();
      }, 500);
      
      // Set interval to check for next track for more responsive operation
      // This helps ensure continuous playback even if the event-based approach fails
      let lastWarningTime = 0; // Track when we last showed a warning to prevent spam
      
      // IMPROVED: Check even more frequently (every 500ms) for a more responsive Auto DJ experience
      autoDjInterval = setInterval(() => {
        // Check if we have any tracks to play before attempting auto DJ operations
        const currentPlayback = playbackState?.A;
        
        // If player A has tracks loaded or is already playing, proceed with normal Auto DJ operations
        if (playerATracks.length > 0 || currentPlayback?.status === 'playing') {
          if (currentPlayback?.status === 'playing') {
            // Check if we're close to the end of the track
            const remainingTime = (currentPlayback?.currentTrack?.duration || 0) - (currentPlayback?.currentPosition || 0);
            
            // IMPROVED: More aggressively check for tracks approaching the end
            // Use different thresholds for different actions
            if (remainingTime < 1 && remainingTime > 0) {
              // Very near the end - critical that we start next track immediately
              console.log(`🚨 AUTO DJ: Interval detected track CRITICALLY near end (${remainingTime.toFixed(1)}s remaining), immediate action required`);
              playNextTrackFromActivePlaylist();
            } else if (remainingTime < 3 && remainingTime > 0) {
              // Approaching the end - prepare for transition
              console.log(`🎵 AUTO DJ: Interval detected track approaching end (${remainingTime.toFixed(1)}s remaining)`);
              playNextTrackFromActivePlaylist();
            }
          } else if (currentPlayback?.status === 'stopped' && playerATracks.length > 0) {
            // If player is stopped but we have tracks available, try to start playback
            console.log('🎵 AUTO DJ: Interval detected stopped player with available tracks, attempting to play');
            playNextTrackFromActivePlaylist();
          }
        } else {
          // Only check server for tracks if we don't have any in the player
          // and we haven't shown a warning recently (prevent warning spam)
          const now = Date.now();
          if (now - lastWarningTime > 10000) { // Only check every 10 seconds
            console.log('🎵 AUTO DJ: No tracks in player, checking playlists...');
            lastWarningTime = now;
            playNextTrackFromActivePlaylist();
          }
        }
      }, 500); // Check every 500ms for more responsive operation
    }
    
    return () => {
      console.log('🎵 AUTO DJ: Cleaning up event listeners and intervals');
      
      if (autoDjInterval) {
        clearInterval(autoDjInterval);
        autoDjInterval = null;
      }
      
      document.removeEventListener('trackEnded', handleTrackEnd);
      document.removeEventListener('trackEndApproaching', handleTrackEndApproaching);
      document.removeEventListener('autoDjPlayNext', handleAutoDjPlayNext);
    };
  }, [autoDjEnabled, playlists, playbackState, audioPlayer, playerATracks]);
  
  // Drag and drop handlers
  const handleDragStart = (track: any) => {
    setDraggedTrack(track);
    // Set data transfer to make drag and drop work properly
    const dragEvent = window.event as DragEvent;
    if (dragEvent.dataTransfer) {
      dragEvent.dataTransfer.setData('text/plain', JSON.stringify({id: track.id, title: track.title}));
      dragEvent.dataTransfer.effectAllowed = 'move';
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    
    // Use 'copy' effect for files from desktop, otherwise 'move' for internal elements
    if (e.dataTransfer.types.includes('Files')) {
      e.dataTransfer.dropEffect = 'copy';
    } else {
      e.dataTransfer.dropEffect = 'move';
    }
    
    // Add visual feedback for drop target
    if (e.currentTarget.classList) {
      const element = e.currentTarget as HTMLElement; // Cast to HTMLElement to access style
      
      // Add highlight class
      element.classList.add('drag-over');
      
      // Add playlist-specific highlight classes based on the container class
      if (element.classList.contains('player-a-tracks')) {
        element.classList.add('drag-over-player-a');
        element.style.borderColor = '#F28C28'; // Studio A orange
        element.style.borderWidth = '2px';
      } else if (element.classList.contains('player-b-tracks')) {
        element.classList.add('drag-over-player-b');
        element.style.borderColor = '#2D8D27'; // Studio B green
        element.style.borderWidth = '2px';
      } else {
        // Generic highlight for other drop targets
        element.style.borderColor = '#3b82f6'; // Blue
        element.style.borderWidth = '2px';
      }
    }
  };
  
  // Handle drag leave events to remove visual feedback
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Remove all visual feedback when drag leaves the drop zone
    if (e.currentTarget.classList) {
      const element = e.currentTarget as HTMLElement; // Cast to HTMLElement
      element.classList.remove('drag-over');
      element.classList.remove('drag-over-player-a');
      element.classList.remove('drag-over-player-b');
      element.style.borderColor = '';
      element.style.borderWidth = '';
    }
  };
  
  // A more flexible drop target type
  type DropTarget = 'playlist' | 'playerA' | 'playerB' | 'playerC' | 'playlistA' | 'playlistB';
  
  // Handle getting the actual track duration from the audio file
  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      // Create a temporary audio element to get the duration
      const audio = new Audio();
      audio.preload = 'metadata';
      
      // Create object URL for the file
      const objectUrl = URL.createObjectURL(file);
      audio.src = objectUrl;
      
      // Set up event to get duration once metadata is loaded
      audio.onloadedmetadata = () => {
        // Get actual duration or default to 3 minutes if can't be determined
        const duration = audio.duration ? Math.round(audio.duration) : 180;
        URL.revokeObjectURL(objectUrl); // Clean up
        resolve(duration);
      };
      
      // If metadata loading fails, use default duration
      audio.onerror = () => {
        URL.revokeObjectURL(objectUrl); // Clean up
        resolve(180); // Default 3 minutes
      };
    });
  };
  
  const handleDrop = async (e: React.DragEvent, target: DropTarget) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Remove any drag-over visual effects
    if (e.currentTarget.classList) {
      const element = e.currentTarget as HTMLElement; // Cast to HTMLElement
      element.classList.remove('drag-over');
      element.classList.remove('drag-over-player-a');
      element.classList.remove('drag-over-player-b');
      element.style.borderColor = '';
      element.style.borderWidth = '';
    }
    
    console.log(`Drop event on target: ${target}`);
    
    // Check if files are being dropped from desktop
    if (e.dataTransfer.types.includes('Files') && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]; // Get the first file
      
      // Check if it's an audio file
      if (file.type.startsWith('audio/')) {
        try {
          // Create a track object from the file
          const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
          
          // Get actual duration from the audio file (async)
          const duration = await getAudioDuration(file);
          console.log(`Detected file duration for ${fileName}: ${duration} seconds`);
          
          // Create a temporary object URL for local playback
          const objectUrl = URL.createObjectURL(file);
          
          // Create a new unique ID for this track
          const newTrackId = Math.floor(Math.random() * 10000);
          
          // Create track object with file metadata and object URL for immediate playback
          const trackToUse: PlayerTrack = {
            id: newTrackId,
            title: fileName,
            artist: 'Unknown Artist',
            duration: duration,
            category: "music",
            path: objectUrl, // Use object URL for immediate playback
            fileType: file.type,
            fileSize: file.size,
            album: 'Unknown Album',
            folderId: null,
            playCount: null,
            createdAt: new Date(),
            lastPlayedAt: null,
            status: 'queued',
            position: 1
          };
          
          // Display toast notification
          toast({
            title: "File Added",
            description: `Added file: ${file.name}`,
            variant: "default",
          });
          
          // Add to appropriate target based on drop target
          if (target === 'playlistA' || target === 'playerA') {
            // Add to player A
            const newPosition = playerATracks.length + 1;
            const newTrack = {
              ...trackToUse,
              status: "queued" as any,
              position: newPosition as any
            };
            setPlayerATracks(prev => [...prev, newTrack]);
            toast({
              title: `Track Added to Player A`,
              description: `${fileName} added to playlist A`,
              variant: "default",
            });
          } else if (target === 'playlistB' || target === 'playerB') {
            // Add to player B
            const newPosition = playerBTracks.length + 1;
            const newTrack = {
              ...trackToUse,
              status: "queued" as any,
              position: newPosition as any
            };
            setPlayerBTracks(prev => [...prev, newTrack]);
            toast({
              title: `Track Added to Player B`,
              description: `${fileName} added to playlist B`,
              variant: "default",
            });
          } else if (target === 'playerC') {
            // Add to player C for immediate playback - using PlayerTrack type
            const playerCTrackObj: PlayerTrack = {
              id: trackToUse.id,
              title: trackToUse.title,
              artist: trackToUse.artist || null,
              duration: trackToUse.duration,
              path: trackToUse.path,
              category: trackToUse.category || null,
              album: trackToUse.album || null,
              fileType: trackToUse.fileType,
              fileSize: trackToUse.fileSize || null,
              folderId: trackToUse.folderId || null,
              playCount: trackToUse.playCount || null,
              createdAt: trackToUse.createdAt || null,
              lastPlayedAt: trackToUse.lastPlayedAt || null,
              status: 'queued',
              position: 1
            };
            setPlayerCTrack(playerCTrackObj);
            setPlayerCPlaying(false);
            toast({
              title: "Track Loaded to Player C",
              description: `${fileName} is ready to play`,
              variant: "default",
            });
          }
          
        } catch (error) {
          console.error('Error processing audio file:', error);
          toast({
            title: "Error",
            description: "Failed to process audio file",
            variant: "destructive",
          });
        }
        
        // Return early as we've handled the file drop in the try block
        return;
      } else {
        // Not an audio file
        toast({
          title: "Unsupported File",
          description: "Only audio files can be dropped here",
          variant: "destructive",
        });
        return;
      }
    }
    
    // If we get here, it's a traditional drag from within the application
    console.log('Processing drag from within application to target:', target);
    
    // Try all possible data formats
    let trackToUse = null;
    const formats = ['track', 'text/plain'];
    
    // Loop through all possible formats to find valid data
    for (const format of formats) {
      try {
        const dataString = e.dataTransfer.getData(format);
        if (dataString && dataString.length > 0) {
          console.log(`Found data in format ${format}:`, dataString.substring(0, 50) + '...');
          const parsedData = JSON.parse(dataString);
          
          if (parsedData && parsedData.title) {
            // We found usable track data!
            trackToUse = {
              id: parsedData.id || Math.floor(Math.random() * 10000),
              title: parsedData.title,
              artist: parsedData.artist || 'Unknown Artist', 
              duration: parsedData.duration || 180,
              category: parsedData.category || "music",
              album: parsedData.album || null,
              path: parsedData.path || `/uploads/${parsedData.title}.mp3`,
              fileType: parsedData.fileType || "audio/mp3",
              fileSize: parsedData.fileSize || 5000000,
              folderId: parsedData.folderId || null,
              playCount: parsedData.playCount || null,
              createdAt: parsedData.createdAt || new Date(),
              lastPlayedAt: parsedData.lastPlayedAt || null,
              waveformData: parsedData.waveformData || null,
              cuePoint: parsedData.cuePoint || null
            };
            
            console.log('Successfully parsed track data for:', trackToUse.title);
            break; // We found valid data, exit the loop
          }
        }
      } catch (error) {
        console.error(`Error parsing data format ${format}:`, error);
        // Continue to next format
      }
    }
    
    // Fall back to dragged track from state if available
    if (!trackToUse && draggedTrack) {
      console.log('Using previously dragged track:', draggedTrack.title);
      trackToUse = draggedTrack;
    }
    
    // Check if we have a track from the current tracks list that matches
    if (!trackToUse && e.dataTransfer.getData('text/plain')) {
      try {
        const plainTextData = e.dataTransfer.getData('text/plain');
        
        // Try to parse as JSON first
        let parsed;
        try {
          parsed = JSON.parse(plainTextData);
        } catch (e) {
          // Not JSON, treat as plain text
        }
        
        // If we have a track ID, search in the current tracks
        if (parsed && parsed.id) {
          const foundTrack = currentTracks.find(t => t.id === parsed.id);
          if (foundTrack) {
            console.log('Found track in current tracks by ID:', foundTrack.title);
            trackToUse = foundTrack;
          }
        }
      } catch (error) {
        console.error('Error handling text/plain data:', error);
      }
    }
    
    if (!trackToUse) {
      console.error('No track available to add');
      return;
    }
    
    // From this point on, use trackToUse instead of draggedTrack
    console.log(`Dropped track ${trackToUse.title} onto ${target}`);
    
    try {
      // Special case for Player C - it's a universal player for immediate playback
      if (target === 'playerC') {
        // Create a properly typed PlayerTrack object
        const playerCTrackObj: PlayerTrack = {
          id: trackToUse.id,
          title: trackToUse.title,
          artist: trackToUse.artist || null,
          duration: trackToUse.duration,
          path: trackToUse.path,
          category: trackToUse.category || null,
          album: trackToUse.album || null,
          fileType: trackToUse.fileType,
          fileSize: trackToUse.fileSize || null,
          folderId: trackToUse.folderId || null,
          playCount: trackToUse.playCount || null,
          createdAt: trackToUse.createdAt || null,
          lastPlayedAt: trackToUse.lastPlayedAt || null,
          status: 'playing',
          position: 1
        };
        
        // Set the track to Player C
        setPlayerCTrack(playerCTrackObj);
        setPlayerCPlaying(true);
        
        // Immediately play the track using handlePlayTrack function
        console.log(`Playing dropped track in Player C: ${trackToUse.title}`);
        handlePlayTrack(trackToUse, 'playerC');
        
        toast({
          title: "Track Playing in Player C",
          description: `${trackToUse.title} by ${trackToUse.artist || 'Unknown Artist'} is now playing in Player C`,
          variant: "default",
        });
        
        setDraggedTrack(null);
        return;
      }
      
      // Check if we're dropping directly onto Player A or B (as opposed to their playlists)
      if (target === 'playerA' || target === 'playerB') {
        // Automatically start playing when dropped directly onto a player
        console.log(`Playing dropped track in ${target}: ${trackToUse.title}`);
        handlePlayTrack(trackToUse, target);
        setDraggedTrack(null);
        return;
      }
      
      // Regular case for Players A and B
      const playlistType = target === 'playerA' || target === 'playlistA' ? 'A' : 
                          (target === 'playerB' || target === 'playlistB' ? 'B' : null);
      
      if (!playlistType) {
        console.error('Invalid drop target');
        return;
      }
      
      // Update state properly using React state management
      if (playlistType === 'A') {
        // Create new track with proper position
        const newPosition = playerATracks.length + 1;
        
        // Create a complete track object using PlayerTrack type
        const newTrack: PlayerTrack = {
          id: trackToUse.id,
          title: trackToUse.title,
          artist: trackToUse.artist || null,
          duration: trackToUse.duration,
          path: trackToUse.path,
          category: trackToUse.category || null,
          album: trackToUse.album || null,
          fileType: trackToUse.fileType,
          fileSize: trackToUse.fileSize || null,
          folderId: trackToUse.folderId || null,
          playCount: trackToUse.playCount || null,
          createdAt: trackToUse.createdAt || null,
          lastPlayedAt: trackToUse.lastPlayedAt || null,
          status: "queued",
          position: newPosition
        };
        
        // Add the track to Player A tracks state
        // React will handle rendering the new track automatically through the state update
        setPlayerATracks(prev => [...prev, newTrack]);
        
        // If dropped directly onto player A, also load it as the current track
        if (target === 'playerA') {
          setCurrentPlayerATrack(newTrack);
          // The actual playback is handled in the playerA/playerB case above this section
          toast({
            title: `Track Loaded to Player A`,
            description: `${trackToUse.title} loaded and ready to play`,
            variant: "default",
          });
        } else {
          toast({
            title: `Track Added to Player A`,
            description: `${trackToUse.title} added to playlist A`,
            variant: "default",
          });
        }
        
        console.log(`Added ${trackToUse.title} to Studio A playlist`);
      } else if (playlistType === 'B') {
        // Create new track with proper position
        const newPosition = playerBTracks.length + 1;
        
        // Create a complete track object using PlayerTrack type
        const newTrack: PlayerTrack = {
          id: trackToUse.id,
          title: trackToUse.title,
          artist: trackToUse.artist || null,
          duration: trackToUse.duration,
          path: trackToUse.path,
          category: trackToUse.category || null,
          album: trackToUse.album || null,
          fileType: trackToUse.fileType,
          fileSize: trackToUse.fileSize || null,
          folderId: trackToUse.folderId || null,
          playCount: trackToUse.playCount || null,
          createdAt: trackToUse.createdAt || null,
          lastPlayedAt: trackToUse.lastPlayedAt || null,
          status: "queued",
          position: newPosition
        };
        
        // Add the track to Player B tracks state
        // React will handle rendering the new track automatically through the state update
        setPlayerBTracks(prev => [...prev, newTrack]);
        
        // If dropped directly onto player B, also load it as the current track
        if (target === 'playerB') {
          setCurrentPlayerBTrack(newTrack);
          toast({
            title: `Track Loaded to Player B`,
            description: `${trackToUse.title} loaded and ready to play`,
            variant: "default",
          });
        } else {
          toast({
            title: `Track Added to Player B`,
            description: `${trackToUse.title} added to playlist B`,
            variant: "default",
          });
        }
        
        console.log(`Added ${trackToUse.title} to Studio B playlist`);
      }
      
      // In a real implementation with working API:
      /*
      // Get active playlist for the studio
      const playlists = await fetch(`/api/radio/playlists?studio=${playlistType}`).then(res => res.json());
      
      if (!playlists || playlists.length === 0) {
        console.error(`No active playlist found for studio ${playlistType}`);
        return;
      }
      
      const activePlaylist = playlists.find((p: any) => p.isActive) || playlists[0];
      
      // Add track to playlist
      const position = target === 'playerA' ? 
        (document.querySelectorAll('.player-a-track').length + 1) : 
        (document.querySelectorAll('.player-b-track').length + 1);
      
      await fetch(`/api/radio/playlists/${activePlaylist.id}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          trackId: trackToUse.id,
          position: position
        })
      });
      */
      
      // Clear dragged track
      setDraggedTrack(null);
    } catch (error) {
      console.error('Error adding track to playlist:', error);
      toast({
        title: "Error Adding Track",
        description: "There was a problem adding the track to the playlist",
        variant: "destructive",
      });
    } finally {
      setDraggedTrack(null);
    }
  };
  
  // Toggle folder expanded/collapsed
  const toggleFolder = (folderId: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent folder selection when clicking expand/collapse
    setExpandedFolders(prev => 
      prev.includes(folderId) 
        ? prev.filter(id => id !== folderId) 
        : [...prev, folderId]
    );
  };
  
  // Use getTracksForFolder from RadioAutomationContext
  
  // Handle folder creation
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      const folderName = newFolderName.trim();
      const folderPath = folderName.toLowerCase().replace(/\s+/g, '-');
      
      await createFolderMutation.mutateAsync({
        name: folderName,
        description: newFolderDescription.trim(),
        path: `/folders/${folderPath}`,
      });
      
      toast({
        title: "Folder created",
        description: `Folder "${folderName}" has been created successfully.`,
        variant: "default",
      });
      
      // Reset form
      setNewFolderName('');
      setShowFolderDialog(false);
    } catch (error) {
      console.error('Error creating folder:', error);
      
      toast({
        title: "Error creating folder",
        description: "There was an error creating the folder. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="h-screen bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden">
      {/* Settings Dialog */}
      <SettingsDialog 
        open={showSettingsDialog} 
        onOpenChange={setShowSettingsDialog} 
      />
      {/* Create Folder Dialog */}
      <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-700">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Create a new folder to organize your audio tracks.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="folder-name" className="text-sm font-medium text-white">
                Folder Name
              </label>
              <Input
                id="folder-name"
                placeholder="My Music Folder"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="folder-description" className="text-sm font-medium text-white">
                Description (Optional)
              </label>
              <Input
                id="folder-description"
                placeholder="Description of this folder"
                value={newFolderDescription}
                onChange={(e) => setNewFolderDescription(e.target.value)}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFolderDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>
              Create Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex justify-between items-center py-2 px-3">
        <div className="flex items-center">
          <img src={qstudioLogo} alt="QStudio Logo" className="h-8 mr-2" />
        </div>
        
        {/* Main menu with tabs integrated */}
        <div className="flex items-center gap-2">
          {/* Integration of TabsList in header - Wrapped in Tabs component to fix "TabsList must be used within Tabs" error */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="inline-flex">
            <TabsList className="bg-zinc-900 h-8">
              <TabsTrigger value="main" className="data-[state=active]:bg-zinc-800 text-xs px-3">
                <Music className="h-3.5 w-3.5 mr-1" /> Main
              </TabsTrigger>
              <TabsTrigger value="playlists" className="data-[state=active]:bg-zinc-800 text-xs px-3">
                <ListMusic className="h-3.5 w-3.5 mr-1" /> Playlists
              </TabsTrigger>
              <TabsTrigger 
                value="library" 
                className="data-[state=active]:bg-zinc-800 text-xs px-3"
                onClick={(e) => {
                  // Prevent default TabsTrigger behavior to avoid activation
                  e.preventDefault();
                  e.stopPropagation();
                  
                  // Open in a new window with specific dimensions
                  const width = 1024;
                  const height = 768;
                  const left = (window.screen.width - width) / 2;
                  const top = (window.screen.height - height) / 2;
                  
                  const libraryWindow = window.open(
                    '/library', 
                    'qcaller_library',
                    `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
                  );
                  
                  if (libraryWindow) {
                    toast({
                      title: "Library Opened",
                      description: "Media library opened in a new window"
                    });
                  } else {
                    toast({
                      title: "Error",
                      description: "Could not open library window. Please check your popup blocker settings.",
                      variant: "destructive"
                    });
                  }
                }}
              >
                <FolderOpen className="h-3.5 w-3.5 mr-1" /> Library
              </TabsTrigger>
              <TabsTrigger value="schedule" className="data-[state=active]:bg-zinc-800 text-xs px-3">
                <Calendar className="h-3.5 w-3.5 mr-1" /> Schedule
              </TabsTrigger>
              <TabsTrigger value="ai-dj" className="data-[state=active]:bg-zinc-800 text-xs px-3">
                <Wand2 className="h-3.5 w-3.5 mr-1" /> AI DJ
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          {/* Library Management Dialog is now handled by the Library tab */}

          {/* Moved Refresh button from content to header */}
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8" 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['radio/tracks'] })}
          >
            <RefreshCcw className="h-3 w-3 mr-1" />
            Refresh
          </Button>

          {/* Moved Toggle On Air button from content to header - Disabled while Auto DJ is active */}
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8"
            disabled={autoDjEnabled}
            title={autoDjEnabled ? "Auto DJ is active - cannot toggle on-air state" : "Switch which player is on air"}
            onClick={() => {
              // Toggle which player is on air
              setPlayerAOnAir(!playerAOnAir);
              setPlayerBOnAir(!playerBOnAir);
              
              toast({
                title: playerBOnAir ? "Player A is now ON AIR" : "Player B is now ON AIR",
                description: playerBOnAir ? "Player B is ready" : "Player A is ready",
                variant: "default",
              });
            }}
          >
            <Radio className="h-3 w-3 mr-1 text-red-500" />
            Toggle On Air
            {autoDjEnabled && <span className="text-xs ml-1">(Locked)</span>}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8"
            onClick={() => setIsScheduleOpen(true)}
          >
            <Calendar className="h-4 w-4 mr-1" />
            Schedule
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8"
            onClick={() => setShowSettingsDialog(true)}
          >
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Menu className="h-4 w-4 mr-1" />
                Menu
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Playlist Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Save className="h-4 w-4 mr-2" />
                Save Playlist
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Import className="h-4 w-4 mr-2" />
                Import Playlist
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Plus className="h-4 w-4 mr-2" />
                Add Items
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Library</DropdownMenuLabel>
              <DropdownMenuItem>
                <Upload className="h-4 w-4 mr-2" />
                Upload Tracks
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowSettingsDialog(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Moved Logout button from content to header */}
          <Button 
            variant="destructive" 
            size="sm" 
            className="h-8"
            onClick={() => {
              logoutMutation.mutate(undefined, {
                onSuccess: () => {
                  toast({
                    title: "Logged out successfully",
                    description: "You have been logged out of the system",
                    variant: "default",
                  });
                  // Force reload the page to redirect to login
                  window.location.href = "/auth";
                },
                onError: () => {
                  toast({
                    title: "Logout failed",
                    description: "There was a problem logging out. Please try again.",
                    variant: "destructive",
                  });
                }
              });
            }}
          >
            <LogOut className="h-3 w-3 mr-1" />
            Logout
          </Button>
          
          <div className="text-lg font-mono ml-2">
            {currentTime.toLocaleTimeString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-0 flex-1 overflow-hidden">
        {/* Left sidebar for library, folders and clock */}
        <div className="col-span-12 md:col-span-3 lg:col-span-2 space-y-0 flex flex-col overflow-hidden">
          {/* Auto DJ and Manual DJ controls - moved from right side */}
          <Card className="bg-zinc-900 border-zinc-800 h-[130px] flex flex-col rounded-lg mb-2">
            <CardContent className="p-2 flex-1 flex flex-col justify-between">
              <div className="grid grid-cols-2 gap-1">
                {/* Auto DJ Button */}
                <Button
                  variant="outline"
                  size="lg"
                  className={`rounded-md h-[80px] flex flex-col items-center justify-center transition-all text-white font-bold ${autoDjEnabled ? (flashingState ? 'border-4 border-red-600' : 'border-2 border-red-800') : 'border-2 border-transparent'}`}
                  style={{
                    backgroundColor: autoDjEnabled 
                      ? (flashingState ? 'rgba(255, 49, 0, 0.7)' : 'rgba(200, 30, 0, 0.7)') // Simple toggle between two colors
                      : 'rgb(63, 63, 70)', // bg-zinc-700
                    boxShadow: 'none', // No glow effect
                    transform: 'scale(1)', // No scaling effect
                  }}
                  onClick={() => {
                    setAutoDjEnabled(true);
                    setManualDjBlinking(false);
                    setAutoDjBlinking(true);
                    
                    toast({
                      title: "Auto DJ Enabled",
                      description: "Tracks will play automatically from the active playlist",
                      variant: "default",
                    });
                  }}
                >
                  <Play className="h-6 w-6 mb-1 text-white" />
                  <span className="text-sm font-medium text-white">
                    AUTO DJ{autoDjEnabled ? ' ACTIVE' : ''}
                  </span>
                </Button>
                
                {/* Manual DJ Button */}
                <Button
                  variant="outline"
                  size="lg"
                  className={`rounded-md h-[80px] flex flex-col items-center justify-center transition-all text-white font-bold ${!autoDjEnabled ? (flashingState ? 'border-4 border-green-500' : 'border-2 border-green-700') : 'border-2 border-transparent'}`}
                  style={{
                    backgroundColor: !autoDjEnabled 
                      ? (flashingState ? 'rgba(22, 235, 0, 0.7)' : 'rgba(20, 180, 0, 0.7)') // Simple toggle between two colors
                      : 'rgb(63, 63, 70)', // bg-zinc-700
                    boxShadow: 'none', // No glow effect
                    transform: 'scale(1)', // No scaling effect
                  }}
                  onClick={() => {
                    setAutoDjEnabled(false);
                    setAutoDjBlinking(false);
                    setManualDjBlinking(true); // Start continuous pulsing effect
                    toast({
                      title: "Manual DJ Enabled",
                      description: "Only manually triggered tracks will play",
                      variant: "default",
                    });
                  }}
                >
                  <Hand className="h-6 w-6 mb-1 text-white" />
                  <span className="text-sm font-medium text-white">
                    MANUAL DJ{!autoDjEnabled ? ' ACTIVE' : ''}
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Search input */}
          <div className="relative mb-2">
            <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
            <Input 
              placeholder="Search library..." 
              className="pl-9 bg-zinc-900 border-zinc-700 rounded-lg" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Library folders and tracks explorer */}
          <Card className="bg-zinc-900 border-zinc-800 flex flex-col h-full rounded-lg">
            <CardHeader className="py-2 px-3 border-b border-zinc-800 flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Media Library
                  <UploadTrackDialog
                    trigger={
                      <button className="h-6 w-6 ml-2 flex items-center justify-center text-gray-400 hover:text-white">
                        <Plus className="h-4 w-4" />
                      </button>
                    }
                  />
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex flex-col flex-1">
              {/* File Explorer with Scrollbar */}
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                <div className="py-0">
                  {/* All Tracks option */}
                  <div 
                    className={`flex items-center px-3 py-1.5 hover:bg-zinc-800 cursor-pointer ${
                      selectedFolderId === null ? 'bg-zinc-800' : ''
                    }`}
                    onClick={() => {
                      // Simply update the selectedFolderId and let the useEffect handle loading
                      setSelectedFolderId(null);
                    }}
                  >
                    <ListMusic className="h-4 w-4 mr-2 text-purple-400" />
                    <span className="text-sm font-medium text-white">All Tracks</span>
                  </div>
                  
                  {/* Divider */}
                  <div className="my-1 border-t border-zinc-800"></div>
                  
                  {/* Loading indicator */}
                  {foldersLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <RefreshCcw className="h-4 w-4 animate-spin text-white" />
                      <span className="ml-2 text-sm text-white">Loading folders...</span>
                    </div>
                  ) : folders.length === 0 ? (
                    <div className="text-center py-4 text-sm text-white">
                      No folders found
                    </div>
                  ) : (
                    folders.map((folder) => (
                      <div key={folder.id}>
                        <div 
                          className={`flex items-center justify-between px-3 py-1.5 hover:bg-zinc-800 cursor-pointer ${
                            selectedFolderId === folder.id ? 'bg-zinc-800' : ''
                          }`}
                        >
                          <div 
                            className="flex items-center flex-grow"
                            onClick={() => {
                              // Simply update the selectedFolderId and let the useEffect handle loading
                              setSelectedFolderId(folder.id);
                            }}
                            draggable
                            onDragStart={() => {
                              console.log(`Started dragging folder: ${folder.name}`);
                              // You could store the folder info in state here if needed
                            }}
                          >
                            {folder.name.includes('Jingle') || folder.name.includes('ID') ? (
                              <FileMusic className="h-4 w-4 mr-2 text-amber-400" />
                            ) : folder.name.includes('Music') ? (
                              <Music className="h-4 w-4 mr-2 text-blue-400" />
                            ) : folder.name.includes('News') || folder.name.includes('Weather') || folder.name.includes('Traffic') ? (
                              <Radio className="h-4 w-4 mr-2 text-green-400" />
                            ) : folder.name.includes('Commercial') || folder.name.includes('Ad') ? (
                              <FileMusic className="h-4 w-4 mr-2 text-red-400" />
                            ) : (
                              <FolderOpen className="h-4 w-4 mr-2 text-yellow-400" />
                            )}
                            <span className="text-sm text-white">{folder.name}</span>
                          </div>
                          
                          {/* Action buttons */}
                          <div className="flex space-x-1">
                            {/* Delete Folder Button */}
                            <button 
                              className="h-5 w-5 flex items-center justify-center text-zinc-400 hover:text-red-400"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Are you sure you want to delete the folder "${folder.name}"?`)) {
                                  deleteFolder(folder.id);
                                  
                                  // If this was the selected folder, set selected to null
                                  if (selectedFolderId === folder.id) {
                                    setSelectedFolderId(null);
                                  }
                                  
                                  toast({
                                    title: "Folder Deleted",
                                    description: `"${folder.name}" folder has been removed`
                                  });
                                }
                              }}
                              title="Delete Folder"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                            
                            {/* Expand/Collapse button */}
                            <button 
                              className="h-5 w-5 flex items-center justify-center text-zinc-400 hover:text-white"
                              onClick={(e) => toggleFolder(folder.id, e)}
                              title={expandedFolders.includes(folder.id) ? "Collapse" : "Expand"}
                            >
                              {expandedFolders.includes(folder.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <Plus className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        
                        {/* Expanded tracks list - showing tracks in sharp white without effects */}
                        {expandedFolders.includes(folder.id) && (
                          <div className="pl-8 pr-2 pb-1 space-y-1 bg-zinc-950/20 border-l border-zinc-800">
                            {tracks.filter(track => track.folderId === folder.id).map(track => (
                              <div 
                                key={`folder-${folder.id}-track-${track.id}`}
                                className="text-white font-medium text-sm py-1.5 px-2 cursor-pointer truncate hover:bg-zinc-900/50 border-l-2 border-transparent"
                                onClick={() => handleLibraryTrackClick(track)}
                                onDoubleClick={() => handlePlayTrack(track, 'playerA')}
                                onContextMenu={(e) => {
                                  e.preventDefault();
                                  // Show context menu options
                                  const menu = [
                                    { label: 'Play in Player A', action: () => handlePlayTrack(track, 'playerA') },
                                    { label: 'Add to Player A', action: () => {
                                      addTrackToPlayerPlaylist('A', track);
                                      toast({
                                        title: "Track Added",
                                        description: `${track.title} added to Player A`,
                                      });
                                    }},
                                    { label: 'Add to Player B', action: () => {
                                      addTrackToPlayerPlaylist('B', track);
                                      toast({
                                        title: "Track Added",
                                        description: `${track.title} added to Player B`,
                                      });
                                    }},
                                    { label: 'Add to Player C', action: () => {
                                      addTrackToPlayerPlaylist('C', track);
                                      toast({
                                        title: "Track Added",
                                        description: `${track.title} added to Player C`,
                                      });
                                    }}
                                  ];
                                  console.log("Track context menu opened:", track.title, menu);
                                }}
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('track', JSON.stringify(track));
                                  e.dataTransfer.effectAllowed = 'copyMove';
                                }}
                              >
                                {track.title || (track.path ? track.path.split('/').pop() : 'Untitled')}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Add folder button */}
              <div className="border-t border-zinc-800 p-2 mt-auto">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start text-xs text-white"
                  onClick={() => setShowFolderDialog(true)}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Folder
                </Button>
              </div>
              
              {/* Transmitter Alarms Section */}
              <div className="mt-2 border-t border-zinc-800 p-2">
                <div className="bg-zinc-900/50 rounded-md overflow-hidden" style={{ outline: "3px solid #626262" }}>
                  <div className="bg-zinc-800 py-1 px-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center">
                      <Radio className="h-3.5 w-3.5 mr-1.5 text-red-400" />
                      TRANSMITTER ALARMS
                    </span>
                    <Badge 
                      variant={transmitterAlarms.length > 0 ? "destructive" : "outline"}
                      className={`${
                        transmitterAlarms.length > 0 
                          ? 'animate-pulse' 
                          : 'border-zinc-500 text-zinc-300'
                      }`}
                    >
                      {transmitterAlarms.length > 0 ? `${transmitterAlarms.length} ACTIVE` : 'MONITORING'}
                    </Badge>
                  </div>
                  
                  <div className="p-2">
                    {/* Alarm Test Toggle Button */}
                    {transmitterAlarms.length > 0 ? (
                      <Button 
                        size="sm" 
                        variant="destructive"
                        className="w-full py-2 font-bold animate-critical-blink border-white shadow-lg shadow-red-500/30"
                        onClick={handleToggleTransmitterAlarm}
                      >
                        <AlertTriangle className="h-4 w-4 mr-1.5 text-white animate-pulse" />
                        <span className="uppercase tracking-wide">CLEAR ALARMS</span>
                      </Button>
                    ) : (
                      <div className="w-full py-2 font-medium bg-green-700 text-white shadow-md rounded-md flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 mr-1.5 text-white" />
                        <span className="uppercase tracking-wide">TX Status: Healthy</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Transmitter Alarms Display - Maintains consistent size with slide animation */}
                  <div className="mt-1 min-h-[90px]"> {/* Fixed minimum height container */}
                    {transmitterAlarms.length > 0 ? (
                      <div className="p-2 relative"> {/* Relative container for absolute positioning */}
                        {/* Show current alarm only with sliding animation */}
                        <div
                          key={`alarm-${currentAlarmIndex}`}
                          className={`p-2 rounded-md flex items-center justify-between ${
                            isAlarmChanging ? 'slide-out-left' : 'slide-in-right'
                          } ${
                            transmitterAlarms[currentAlarmIndex].status === 'critical' 
                              ? 'border border-red-600 animate-critical-blink bg-red-900/30' 
                              : 'border border-amber-500 bg-amber-900/30'
                          } ${
                            transmitterAlarms[currentAlarmIndex].status === 'critical' ? 'animate-border-flash' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <div className={`h-6 w-6 rounded-full flex items-center justify-center ${
                              transmitterAlarms[currentAlarmIndex].status === 'critical' ? 'bg-red-700 animate-pulse' : 'bg-amber-700'
                            }`}>
                              <AlertTriangle className={`h-3.5 w-3.5 ${
                                transmitterAlarms[currentAlarmIndex].status === 'critical' ? 'text-white' : 'text-amber-100'
                              }`} />
                            </div>
                            <div>
                              <div className="font-medium text-white">{transmitterAlarms[currentAlarmIndex].siteName}</div>
                              <div className={`text-xs px-2 py-0.5 rounded inline-block mt-0.5 ${
                                transmitterAlarms[currentAlarmIndex].status === 'critical' 
                                  ? 'bg-red-900 text-red-100 animate-pulse' 
                                  : 'bg-amber-900 text-amber-100'
                              }`}>
                                {transmitterAlarms[currentAlarmIndex].status.toUpperCase()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs bg-black/40 rounded-full px-1.5 py-0.5">
                              {currentAlarmIndex + 1}/{transmitterAlarms.length}
                            </span>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-7 px-2"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center mt-3">
                          <span className="text-xs text-red-300">Emergency situation</span>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 text-xs"
                          >
                            <RefreshCcw className="h-3 w-3 mr-1" />
                            Refresh
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2 border-t border-zinc-800 flex items-center justify-center h-full">
                        <div className="text-xs text-white flex items-center py-4">
                          <CheckCircle className="h-3.5 w-3.5 mr-1.5 text-green-500" />
                          All transmitters operating normally
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Removed separate tracks section - tracks now displayed directly from folders */}
        </div>
        
        {/* Main content area */}
        <div className="col-span-12 md:col-span-9 lg:col-span-10 overflow-hidden flex flex-col">
          {/* Player modules row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-0 mb-0 flex-shrink-0">
            {/* Player A - Primary On Air Player - Using new AdvancedPlayerModule */}
            <div
              className="overflow-visible"
              style={{ 
                height: '205px', 
                marginBottom: '40px', 
                boxShadow: '0 4px 12px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.2), inset 0 -1px 1px rgba(0,0,0,0.5)',
                border: '1px solid #777',
                borderRadius: '0',
                background: 'linear-gradient(to bottom, #404040, #303030)'
              }}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'playerA')}
            >
              <AdvancedPlayerModule 
                type="A"
                studioColor="#F28C28" 
                isOnAir={playerAOnAir}
                playerId="playerA"
                className="h-full"
                initialTrack={playerATracks.find(t => t.status === 'playing') || playerATracks[0] || null}
              />
            </div>

            {/* Player B - Next Up Player - Using new AdvancedPlayerModule */}
            <div
              className="overflow-visible"
              style={{ 
                height: '205px', 
                marginBottom: '40px', 
                boxShadow: '0 4px 12px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.2), inset 0 -1px 1px rgba(0,0,0,0.5)',
                border: '1px solid #777',
                borderRadius: '0',
                background: 'linear-gradient(to bottom, #404040, #303030)'
              }}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'playerB')}
            >
              <AdvancedPlayerModule 
                type="B"
                studioColor="#22c55e" 
                isOnAir={playerBOnAir}
                playerId="playerB"
                className="h-full"
                initialTrack={playerBTracks.find(t => t.status === 'playing') || playerBTracks[0] || null}
              />
            </div>

            {/* Player C - Universal Drop Zone */}
            <div
              className="overflow-visible"
              style={{ 
                height: 'auto', 
                marginBottom: '40px', 
                boxShadow: '0 4px 12px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.2), inset 0 -1px 1px rgba(0,0,0,0.5)',
                border: '1px solid #777',
                borderRadius: '0',
                background: 'linear-gradient(to bottom, #404040, #303030)'
              }}
            >
              <div className="py-2 px-3 bg-gradient-to-r from-purple-900 to-purple-800 border-b border-zinc-800">
                <div className="flex justify-between items-center">
                  <div className="text-sm flex items-center font-bold">
                    <Radio className="h-4 w-4 mr-2 text-purple-400" />
                    Player C - Universal
                  </div>
                  <Badge variant="outline" className={`${playerCPlaying ? 'border-red-500 text-red-300' : 'border-purple-500 text-purple-300'}`}>
                    {playerCPlaying ? 'PLAYING' : 'READY'}
                  </Badge>
                </div>
              </div>
              <div className="p-0">
                <div 
                  className="min-h-[120px] p-4 flex flex-col items-center justify-center m-2"
                  style={{
                    background: 'linear-gradient(to bottom, #3a2a4a, #332244)',
                    borderRadius: '0',
                    boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1), inset 0 -1px 1px rgba(0,0,0,0.3), 0 2px 6px rgba(0,0,0,0.2)',
                    border: '1px solid rgba(138, 43, 226, 0.3)'
                  }}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'playerC')}
                >
                  <div className="w-full">
                    {/* Track information section (conditionally shown) */}
                    {playerCTrack ? (
                      <div className="mb-3">
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <div className="font-medium">{playerCTrack.title}</div>
                            <div className="text-xs text-zinc-400">{playerCTrack.artist || 'Unknown Artist'}</div>
                          </div>
                          <div className="text-sm font-mono">
                            {Math.floor(playerCTrack.duration / 60)}:{(playerCTrack.duration % 60).toString().padStart(2, '0')}
                          </div>
                        </div>
                        {/* Status indicator */}
                        <div className="mt-2 mb-1 flex justify-center">
                          <div className={`text-xs font-semibold px-2 py-1 ${playerCPlaying ? 'bg-purple-900/50 text-purple-300' : 'bg-zinc-800 text-zinc-400'}`}>
                            {playerCPlaying ? 'NOW PLAYING' : 'READY TO PLAY'}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* When empty - message is shown but buttons remain visible */
                      <div className="text-center mb-3">
                        <FileMusic className="h-8 w-8 text-purple-400 mx-auto mb-2 opacity-60" />
                        <p className="text-sm text-purple-300">Drag and drop any track here</p>
                        <p className="text-xs text-zinc-400 mt-1 mb-2">Universal player for quick playback</p>
                      </div>
                    )}
                    
                    {/* Enhanced Player controls with 3D styling */}
                    <div className="flex gap-2 mt-3 justify-center">
                      {/* Skip Back Button with 3D styling */}
                      <button 
                        className={`relative h-7 w-7 overflow-hidden flex items-center justify-center ${!playerCTrack ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        style={{
                          background: 'linear-gradient(to bottom, #444, #333)',
                          border: '1px solid rgba(0,0,0,0.3)',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.1)',
                        }}
                        disabled={!playerCTrack}
                        onClick={() => {
                          if (playerCTrack) {
                            // Reset playback (would actually restart the track in a real implementation)
                            setPlayerCPlaying(false);
                          }
                        }}
                      >
                        <div style={{ 
                          filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.7))',
                          transform: 'translateY(1px)'
                        }}>
                          <SkipBack className="h-3 w-3 text-white" />
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

                      {/* Play/Pause Button with 3D styling */}
                      <button 
                        className={`relative h-7 px-4 overflow-hidden flex items-center justify-center ${!playerCTrack ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        style={{
                          background: playerCPlaying 
                            ? 'linear-gradient(to bottom, #9333ea, #7928ca)' 
                            : 'linear-gradient(to bottom, #9333ea, #7928ca)',
                          border: '1px solid rgba(0,0,0,0.3)',
                          boxShadow: '0 2px 3px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.2)',
                          textShadow: '0 1px 1px rgba(0,0,0,0.5)'
                        }}
                        disabled={!playerCTrack}
                        onClick={() => {
                          if (playerCTrack) {
                            // Toggle play/pause
                            setPlayerCPlaying(prev => !prev);
                            
                            toast({
                              title: playerCPlaying ? "Playback Paused" : "Playback Started",
                              description: `${playerCTrack.title} ${playerCPlaying ? 'paused' : 'now playing'}`,
                              variant: "default",
                            });
                          }
                        }}
                      >
                        <div className="flex items-center text-white font-medium" style={{ 
                          filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.7))',
                          transform: 'translateY(1px)'
                        }}>
                          {playerCPlaying ? (
                            <>
                              <Pause className="h-3 w-3 mr-1" />
                              <span>Pause</span>
                            </>
                          ) : (
                            <>
                              <Play className="h-3 w-3 mr-1" />
                              <span>Play</span>
                            </>
                          )}
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

                      {/* Clear Button with 3D styling */}
                      <button 
                        className={`relative h-7 w-7 overflow-hidden flex items-center justify-center ${!playerCTrack ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        style={{
                          background: 'linear-gradient(to bottom, #444, #333)',
                          border: '1px solid rgba(0,0,0,0.3)',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.1)',
                        }}
                        disabled={!playerCTrack}
                        onClick={() => {
                          if (playerCTrack) {
                            // Clear the track
                            setPlayerCTrack(null);
                            setPlayerCPlaying(false);
                          }
                        }}
                      >
                        <div style={{ 
                          filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.7))',
                          transform: 'translateY(1px)'
                        }}>
                          <X className="h-3 w-3 text-white" />
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
                    </div>
                  </div>
                </div>
                
                {/* Extended Audio Levels - A, B, C, and PGM */}
                <div className="p-2 border-t border-zinc-800">
                  {/* Transmitter Alarm Banner - Prominently displayed at the top */}
                  {/* Transmitter alarms have been hidden from this section per request */}
                  
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-xs text-zinc-400">Audio Levels</div>
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-purple-300 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        <div className={`font-mono font-bold ${getCountdownColor()}`}>
                          {formatCountdown(countdownTime)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2">
                    {/* Player A Level - Redesigned with more professional look */}
                    <div className="flex flex-col h-[90px]">
                      <div className="text-center mb-1 flex items-center justify-center">
                        <div className="bg-gradient-to-r from-blue-700 to-blue-600 text-white px-3 py-0.5 text-xs font-bold rounded-sm flex items-center gap-1 shadow-md">
                          <Radio className="h-2.5 w-2.5" />
                          <span>PLAYER A</span>
                        </div>
                      </div>
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        {/* Left Channel */}
                        <div className="flex flex-col items-center">
                          <div className="text-[10px] text-gray-400 mb-1 font-medium">L</div>
                          <div className="flex-1 w-full relative rounded overflow-hidden border border-gray-800">
                            <ModernLevelMeter 
                              level={playerAOnAir ? playerAAudioLevels.left : 0} 
                              isActive={playerAOnAir} 
                              isPlaying={playerAOnAir}
                              activeColor="blue"
                              className="h-full w-full"
                              peakFalloffRate={3}
                              refreshRate={50}
                            />
                            
                            {/* dB markers */}
                            <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between text-[6px] text-gray-500 px-1 font-mono">
                              <div>0</div>
                              <div>-10</div>
                              <div>-20</div>
                              <div>-40</div>
                            </div>
                          </div>
                        </div>
                        {/* Right Channel */}
                        <div className="flex flex-col items-center">
                          <div className="text-[10px] text-gray-400 mb-1 font-medium">R</div>
                          <div className="flex-1 w-full relative rounded overflow-hidden border border-gray-800">
                            <ModernLevelMeter 
                              level={playerAOnAir ? playerAAudioLevels.right : 0} 
                              isActive={playerAOnAir} 
                              isPlaying={playerAOnAir}
                              activeColor="blue"
                              className="h-full w-full"
                              peakFalloffRate={3}
                              refreshRate={50}
                            />
                            
                            {/* dB markers */}
                            <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between text-[6px] text-gray-500 px-1 font-mono">
                              <div>0</div>
                              <div>-10</div>
                              <div>-20</div>
                              <div>-40</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Player B Level - Redesigned with more professional look */}
                    <div className="flex flex-col h-[90px]">
                      <div className="text-center mb-1 flex items-center justify-center">
                        <div className="bg-gradient-to-r from-green-700 to-green-600 text-white px-3 py-0.5 text-xs font-bold rounded-sm flex items-center gap-1 shadow-md">
                          <Radio className="h-2.5 w-2.5" />
                          <span>PLAYER B</span>
                        </div>
                      </div>
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        {/* Left Channel */}
                        <div className="flex flex-col items-center">
                          <div className="text-[10px] text-gray-400 mb-1 font-medium">L</div>
                          <div className="flex-1 w-full relative rounded overflow-hidden border border-gray-800">
                            <ModernLevelMeter 
                              level={playerBOnAir ? playerBAudioLevels.left : 0} 
                              isActive={playerBOnAir} 
                              isPlaying={playerBOnAir}
                              activeColor="green"
                              className="h-full w-full"
                              peakFalloffRate={3}
                              refreshRate={50}
                            />
                            
                            {/* dB markers */}
                            <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between text-[6px] text-gray-500 px-1 font-mono">
                              <div>0</div>
                              <div>-10</div>
                              <div>-20</div>
                              <div>-40</div>
                            </div>
                          </div>
                        </div>
                        {/* Right Channel */}
                        <div className="flex flex-col items-center">
                          <div className="text-[10px] text-gray-400 mb-1 font-medium">R</div>
                          <div className="flex-1 w-full relative rounded overflow-hidden border border-gray-800">
                            <ModernLevelMeter 
                              level={playerBOnAir ? playerBAudioLevels.right : 0} 
                              isActive={playerBOnAir} 
                              isPlaying={playerBOnAir}
                              activeColor="green"
                              className="h-full w-full"
                              peakFalloffRate={3}
                              refreshRate={50}
                            />
                            
                            {/* dB markers */}
                            <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between text-[6px] text-gray-500 px-1 font-mono">
                              <div>0</div>
                              <div>-10</div>
                              <div>-20</div>
                              <div>-40</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Player C Level - Updated to match new design */}
                    <div className="flex flex-col h-[90px]">
                      <div className="text-center mb-1 flex items-center justify-center">
                        <div className="bg-gradient-to-r from-purple-700 to-purple-600 text-white px-3 py-0.5 text-xs font-bold rounded-sm flex items-center gap-1 shadow-md">
                          <Radio className="h-2.5 w-2.5" />
                          <span>PLAYER C</span>
                        </div>
                      </div>
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        {/* Left Channel */}
                        <div className="flex flex-col items-center">
                          <div className="text-[10px] text-gray-400 mb-1 font-medium">L</div>
                          <div className="flex-1 w-full relative rounded overflow-hidden border border-gray-800">
                            <ModernLevelMeter 
                              level={playerCPlaying ? playerCAudioLevels.left : 0} 
                              isActive={playerCPlaying} 
                              isPlaying={playerCPlaying}
                              activeColor="purple"
                              className="h-full w-full"
                              peakFalloffRate={3}
                              refreshRate={50}
                            />
                            
                            {/* dB markers */}
                            <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between text-[6px] text-gray-500 px-1 font-mono">
                              <div>0</div>
                              <div>-10</div>
                              <div>-20</div>
                              <div>-40</div>
                            </div>
                          </div>
                        </div>
                        {/* Right Channel */}
                        <div className="flex flex-col items-center">
                          <div className="text-[10px] text-gray-400 mb-1 font-medium">R</div>
                          <div className="flex-1 w-full relative rounded overflow-hidden border border-gray-800">
                            <ModernLevelMeter 
                              level={playerCPlaying ? playerCAudioLevels.right : 0} 
                              isActive={playerCPlaying} 
                              isPlaying={playerCPlaying}
                              activeColor="purple"
                              className="h-full w-full"
                              peakFalloffRate={3}
                              refreshRate={50}
                            />
                            
                            {/* dB markers */}
                            <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between text-[6px] text-gray-500 px-1 font-mono">
                              <div>0</div>
                              <div>-10</div>
                              <div>-20</div>
                              <div>-40</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* PGM Level - Redesigned to match new style exactly but taller */}
                    <div className="flex flex-col h-[150px]">
                      <div className="text-center mb-1 flex items-center justify-center">
                        <div className="bg-gradient-to-r from-red-700 to-red-600 text-white px-3 py-0.5 text-xs font-bold rounded-sm flex items-center gap-1 shadow-md">
                          <Radio className="h-2.5 w-2.5" />
                          <span>PGM OUT</span>
                        </div>
                      </div>
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        {/* Left Channel */}
                        <div className="flex flex-col items-center">
                          <div className="text-[10px] text-gray-400 mb-1 font-medium">L</div>
                          <div className="flex-1 w-full relative rounded overflow-hidden border border-gray-800" style={{ height: "calc(100% - 18px)" }}>
                            {/* Custom professional-looking red audio meter */}
                            <div className="h-full w-full bg-zinc-900">
                              {Array.from({ length: 30 }).map((_, i) => {
                                // Calculate level based on any player that is active with real levels
                                let pgmLevel = 0;
                                if (playerAOnAir) {
                                  pgmLevel = playerAAudioLevels.left;
                                } else if (playerBOnAir) {
                                  pgmLevel = playerBAudioLevels.left;
                                } else if (playerCPlaying) {
                                  pgmLevel = playerCAudioLevels.left; // Use real values from playerC
                                }
                                const threshold = Math.floor(pgmLevel / 100 * 30);
                                const isActive = i < threshold;
                                
                                // Color gradient from green to yellow to red
                                let bgColor;
                                if (isActive) {
                                  if (i < 15) bgColor = '#4ade80'; // green
                                  else if (i < 22) bgColor = '#facc15'; // yellow
                                  else bgColor = '#ef4444'; // red
                                } else {
                                  bgColor = 'rgba(255, 255, 255, 0.07)';
                                }
                                
                                // Height gets slightly bigger towards the top
                                const segmentHeight = 2 + (i > 25 ? 1 : 0);
                                const gapHeight = 1;
                                
                                const topPosition = i * (segmentHeight + gapHeight);
                                
                                return (
                                  <div
                                    key={`pgm-left-${i}`}
                                    style={{ 
                                      backgroundColor: bgColor,
                                      height: `${segmentHeight}px`,
                                      position: 'absolute',
                                      bottom: `${topPosition}px`,
                                      left: 0,
                                      right: 0,
                                      transition: 'background-color 50ms ease-out'
                                    }}
                                  />
                                );
                              })}
                            </div>
                            
                            {/* dB markers */}
                            <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between text-[6px] text-gray-500 px-1 font-mono">
                              <div>+3</div>
                              <div>0</div>
                              <div>-10</div>
                              <div>-20</div>
                              <div>-40</div>
                            </div>
                          </div>
                        </div>
                        {/* Right Channel */}
                        <div className="flex flex-col items-center">
                          <div className="text-[10px] text-gray-400 mb-1 font-medium">R</div>
                          <div className="flex-1 w-full relative rounded overflow-hidden border border-gray-800" style={{ height: "calc(100% - 18px)" }}>
                            {/* Custom professional-looking red audio meter */}
                            <div className="h-full w-full bg-zinc-900">
                              {Array.from({ length: 30 }).map((_, i) => {
                                // Calculate level based on any player that is active with real levels
                                let pgmLevel = 0;
                                if (playerAOnAir) {
                                  pgmLevel = playerAAudioLevels.right;
                                } else if (playerBOnAir) {
                                  pgmLevel = playerBAudioLevels.right;
                                } else if (playerCPlaying) {
                                  pgmLevel = playerCAudioLevels.right; // Use real values from playerC
                                }
                                const threshold = Math.floor(pgmLevel / 100 * 30);
                                const isActive = i < threshold;
                                
                                // Color gradient from green to yellow to red
                                let bgColor;
                                if (isActive) {
                                  if (i < 15) bgColor = '#4ade80'; // green
                                  else if (i < 22) bgColor = '#facc15'; // yellow
                                  else bgColor = '#ef4444'; // red
                                } else {
                                  bgColor = 'rgba(255, 255, 255, 0.07)';
                                }
                                
                                // Height gets slightly bigger towards the top
                                const segmentHeight = 2 + (i > 25 ? 1 : 0);
                                const gapHeight = 1;
                                
                                const topPosition = i * (segmentHeight + gapHeight);
                                
                                return (
                                  <div
                                    key={`pgm-right-${i}`}
                                    style={{ 
                                      backgroundColor: bgColor,
                                      height: `${segmentHeight}px`,
                                      position: 'absolute',
                                      bottom: `${topPosition}px`,
                                      left: 0,
                                      right: 0,
                                      transition: 'background-color 50ms ease-out'
                                    }}
                                  />
                                );
                              })}
                            </div>
                            
                            {/* dB markers */}
                            <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between text-[6px] text-gray-500 px-1 font-mono">
                              <div>+3</div>
                              <div>0</div>
                              <div>-10</div>
                              <div>-20</div>
                              <div>-40</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Upcoming Events - New Component */}
            <Card className="border-zinc-800 flex flex-col" style={{ outline: "3px solid #626262" }}>
              <CardHeader className="py-1 border-b border-zinc-800 flex-shrink-0 bg-zinc-900">
                <CardTitle className="text-sm flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-purple-400" />
                  Upcoming Events
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 flex flex-col bg-zinc-900" style={{ height: "calc(100% - 27px)" }}>
                <div className="max-h-[190px] overflow-auto flex-1">
                  <UpcomingEventsList />
                </div>
                {/* Note: Auto DJ / Manual DJ Controls moved to the left sidebar */}
                
                {/* Add Streaming Component under Auto DJ / Manual DJ buttons */}
                <div className="bg-zinc-900" style={{ marginTop: "1px" }}>
                  <DigitalClockComponent />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main content tabs (with buttons moved to header) */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">

            {/* Main tab content */}
            <TabsContent value="main" className="mt-0 overflow-visible flex flex-col">
              <div className="grid grid-cols-12 gap-0 mb-0 overflow-visible flex-1">
                {/* Player A Playlist - Takes up 6 columns */}
                <Card className="col-span-12 md:col-span-6 bg-zinc-900 border-zinc-800 overflow-visible flex flex-col shadow-lg shadow-black/50 rounded-none" style={{ height: "807px", marginTop: "-243px", position: "relative", zIndex: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.7)", outline: "3px solid #626262", width: "calc(100% - 4px)", marginLeft: "3px" }}>
                  <CardHeader className={`py-2 px-3 ${playerAOnAir ? 'bg-red-900' : (!autoDjEnabled ? 'bg-green-900' : 'bg-green-900')} border-b border-zinc-800 rounded-none`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <CardTitle className="text-sm font-bold flex items-center text-white">
                          <Radio className={`h-4 w-4 mr-2 ${playerAOnAir ? 'text-red-400' : 'text-green-400'}`} />
                          PLAYLIST A
                        </CardTitle>
                        {/* Total playlist duration */}
                        <div className="ml-3 text-xs text-white/80 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {/* Calculate total duration of the real playlist */}
                          {formatLongDuration(calculateTotalDuration(playerATracks))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Track Mixing Editor Button */}
                        <TrackMixingEditor
                          track={playerATracks.find(t => t.status === "playing") || playerATracks[0]}
                        />
                        {playerAOnAir ? (
                          <Badge className="bg-red-600 text-xs h-5">ON AIR</Badge>
                        ) : (
                          <Badge variant="outline" className="border-green-500 text-green-300 text-xs h-5">READY</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 flex flex-col rounded-none" style={{ height: "calc(807px - 38px)" }}>
                    {/* Player A playlist table header */}
                    <div className="grid grid-cols-12 text-xs font-medium text-zinc-400 border-b border-zinc-800 py-1 px-3 flex-shrink-0">
                      <div className="col-span-1">#</div>
                      <div className="col-span-4">Title</div>
                      <div className="col-span-3">Artist</div>
                      <div className="col-span-2 flex items-center justify-center">
                        <span className="ml-[30px]">Duration</span>
                      </div>
                      <div className="col-span-2 flex justify-end">Action</div>
                    </div>
                    
                    {/* Player A playlist items - fixed height scrollable container with enhanced drag-drop */}
                    <div 
                      className="player-a-tracks overflow-y-auto border-2 border-transparent bg-zinc-900" 
                      style={{ height: "calc(100% - 28px)", marginTop: "0px" }} 
                      onDragOver={handleDragOver} 
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, 'playlistA')}>
                      
                      {/* Display message if no tracks or render tracks */}
                      {playerATracks.length === 0 ? (
                        <div className="p-4 text-center text-zinc-500">
                          <FileMusic className="h-8 w-8 mx-auto mb-2 opacity-60" />
                          <p className="text-sm">No tracks in playlist A</p>
                          <p className="text-xs mt-1">Drag and drop tracks here from the library</p>
                        </div>
                      ) : (
                        /* Render dynamically added tracks */
                        playerATracks.map((track, index) => (
                          <ColorCodedTrackItem
                            key={`player-a-track-${track.id}-${index}`}
                            track={track}
                            studio="A"
                            showPlayerButtons={true}
                            isPlaying={index === 0 && audioPlayer.isPlaying('playerA')}
                            isNext={index === 1 && !audioPlayer.isPlaying('playerA')}
                            isPlaylistActive={playerAOnAir}
                            onLoadToPlayerA={(track) => handlePlayTrack(track, 'playerA')}
                            onLoadToPlayerB={(track) => handlePlayTrack(track, 'playerB')}
                            onClick={() => {
                              // One-click play is disabled, show information to user
                              console.log("Track selected:", track.title);
                              toast({
                                title: "Double-click to play",
                                description: `Selected "${track.title}" - double-click to play in Player A`,
                              });
                            }}
                            onDoubleClick={() => {
                              // When double-clicking a track in playlist A, load it to Player A and play it
                              console.log("Loading and playing track in Player A:", track.title);
                              
                              // Call the handlePlayTrack function to play the track
                              if (track.id) {
                                // This will call the API to get the full track data if needed
                                handlePlayTrack(track, 'playerA');
                                
                                // Set this track as the first in the playlist if it isn't already
                                if (index !== 0) {
                                  const updatedTracks = [...playerATracks];
                                  // Remove the track from its current position
                                  updatedTracks.splice(index, 1);
                                  // Add it to the beginning
                                  updatedTracks.unshift(track);
                                  // Update positions
                                  const reorderedTracks = updatedTracks.map((t, i) => ({
                                    ...t,
                                    position: i + 1,
                                    status: i === 0 ? 'playing' : i === 1 ? 'next' : 'queued'
                                  }));
                                  setPlayerATracks(reorderedTracks);
                                }
                                
                                // Also update the current track in the player
                                setCurrentPlayerATrack(track);
                                
                                toast({
                                  title: "Track Playing",
                                  description: `Playing "${track.title}" in Player A`,
                                });
                              } else {
                                toast({
                                  title: "Cannot Play Track",
                                  description: "Track is missing ID information",
                                  variant: "destructive"
                                });
                              }
                            }}
                            onPlay={(track) => handlePlayTrack(track, 'playerA')}
                            onPause={() => handlePauseTrack('playerA')}
                            onDelete={(trackId) => {
                              setPlayerATracks(prev => prev.filter(t => t.id !== trackId));
                            }}
                          />
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Right side container with Player B and Cart Wall - 6 columns */}
                <div className="col-span-12 md:col-span-6 space-y-0">
                  {/* Player B Playlist */}
                  <Card className="bg-zinc-900/90 border-zinc-800 overflow-hidden rounded-none" style={{ outline: "3px solid #626262", width: "calc(100% - 8px)", marginLeft: "4px", marginTop: "-45px" }}>
                    <CardHeader className={`py-2 px-3 ${playerBOnAir ? 'bg-red-900' : (!autoDjEnabled ? 'bg-green-900' : 'bg-green-900')} border-b border-zinc-800 rounded-none`}>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <CardTitle className="text-sm font-bold flex items-center text-white">
                            <Radio className={`h-4 w-4 mr-2 ${playerBOnAir ? 'text-red-400' : 'text-green-400'}`} />
                            PLAYLIST B
                          </CardTitle>
                          {/* Total playlist duration */}
                          <div className="ml-3 text-xs text-white/80 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {/* Calculate total duration of the playlist */}
                            {formatLongDuration(calculateTotalDuration(playerBTracks))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Track Mixing Editor Button */}
                          <TrackMixingEditor
                            track={playerBTracks.find(t => t.status === "playing") || playerBTracks[0]}
                          />
                          {playerBOnAir ? (
                            <Badge className="bg-red-600 text-xs h-5">ON AIR</Badge>
                          ) : (
                            <Badge variant="outline" className="border-green-500 text-green-300 text-xs h-5">READY</Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0 h-[292px] flex flex-col rounded-none">
                      {/* Player B playlist table header */}
                      <div className="grid grid-cols-12 text-xs font-medium text-zinc-400 border-b border-zinc-800 py-1 px-3">
                        <div className="col-span-1">#</div>
                        <div className="col-span-4">Title</div>
                        <div className="col-span-3">Artist</div>
                        <div className="col-span-2 flex items-center justify-center">
                          <span className="ml-[30px]">Duration</span>
                        </div>
                        <div className="col-span-2 flex justify-end">Action</div>
                      </div>
                      
                      {/* Player B playlist items - with enhanced drag-drop */}
                      <div 
                        className="player-b-tracks flex-1 overflow-y-auto border-2 border-transparent bg-zinc-900" 
                        onDragOver={handleDragOver} 
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, 'playlistB')}>

                        {/* Display message if no tracks or render tracks */}
                        {playerBTracks.length === 0 ? (
                          <div className="p-4 text-center text-zinc-500">
                            <FileMusic className="h-8 w-8 mx-auto mb-2 opacity-60" />
                            <p className="text-sm">No tracks in playlist B</p>
                            <p className="text-xs mt-1">Drag and drop tracks here from the library</p>
                          </div>
                        ) : (
                          /* Render dynamically added tracks */
                          playerBTracks.map((track, index) => (
                            <ColorCodedTrackItem
                              key={`player-b-track-${track.id}-${index}`}
                              track={track}
                              studio="B"
                              showPlayerButtons={true}
                              isPlaying={index === 0 && audioPlayer.isPlaying('playerB')}
                              isNext={index === 1 && !audioPlayer.isPlaying('playerB')}
                              isPlaylistActive={playerBOnAir}
                              onLoadToPlayerA={(track) => handlePlayTrack(track, 'playerA')}
                              onLoadToPlayerB={(track) => handlePlayTrack(track, 'playerB')}
                              onClick={() => {
                                // One-click play is disabled, show information to user
                                console.log("Track selected:", track.title);
                                toast({
                                  title: "Double-click to play",
                                  description: `Selected "${track.title}" - double-click to play in Player B`,
                                });
                              }}
                              onDoubleClick={() => {
                                // When double-clicking a track in playlist B, load it to Player B and play it
                                console.log("Loading and playing track in Player B:", track.title);
                                
                                // Call the handlePlayTrack function to play the track
                                if (track.id) {
                                  // This will call the API to get the full track data if needed
                                  handlePlayTrack(track, 'playerB');
                                  
                                  // Set this track as the first in the playlist if it isn't already
                                  if (index !== 0) {
                                    const updatedTracks = [...playerBTracks];
                                    // Remove the track from its current position
                                    updatedTracks.splice(index, 1);
                                    // Add it to the beginning
                                    updatedTracks.unshift(track);
                                    // Update positions
                                    const reorderedTracks = updatedTracks.map((t, i) => ({
                                      ...t,
                                      position: i + 1,
                                      status: i === 0 ? 'playing' : i === 1 ? 'next' : 'queued'
                                    }));
                                    setPlayerBTracks(reorderedTracks);
                                  }
                                  
                                  // Also update the current track in the player
                                  setCurrentPlayerBTrack(track);
                                  
                                  toast({
                                    title: "Track Playing",
                                    description: `Playing "${track.title}" in Player B`,
                                  });
                                } else {
                                  toast({
                                    title: "Cannot Play Track",
                                    description: "Track is missing ID information",
                                    variant: "destructive"
                                  });
                                }
                              }}
                              onPlay={(track) => handlePlayTrack(track, 'playerB')}
                              onPause={() => handlePauseTrack('playerB')}
                              onDelete={(trackId) => {
                                setPlayerBTracks(prev => prev.filter(t => t.id !== trackId));
                              }}
                            />
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Cart Wall / Instant Players with separate playback meter */}
                  <div className="flex flex-col space-y-0">
                    <CartWallContainer 
                      className="flex-1"
                      onPlayCart={handleCartPlay} 
                    />
                    
                    {/* Standalone cart player playback meter */}
                    <div className="border border-zinc-800 rounded-md" style={{ outline: "3px solid #626262" }}>
                      <PlaybackLengthMeter 
                        playbackInfo={{
                          isPlaying: cartWallPlayingCart ? true : false,  
                          duration: cartWallPlayingCart?.duration || 0, 
                          progress: cartWallPlaybackProgress,
                          label: cartWallPlayingCart?.label || "Cart Player"
                        }}
                        className="p-2"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="playlists" className="mt-0 overflow-hidden flex flex-col">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="border-b border-zinc-800">
                  <CardTitle>Manage Playlists</CardTitle>
                  <CardDescription>Create and manage your automation playlists</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 p-4 gap-4">
                    {/* We'll display real playlists from the API instead of dummy data */}
                    {dummyPlaylists.length > 0 ? (
                      dummyPlaylists.map(playlist => (
                        <Card key={playlist.id} className={`bg-zinc-800 border-zinc-700 cursor-pointer transition-colors ${playlist.active ? 'border-green-500' : ''}`}>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-base text-white">{playlist.name}</CardTitle>
                              {playlist.active && <Badge className="bg-green-600">Active</Badge>}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="text-xs text-zinc-400">12 tracks • 45:30 total duration</div>
                            <div className="flex justify-between mt-3">
                              <Button size="sm" variant="outline" className="h-7 text-xs">
                                <ListMusic className="h-3 w-3 mr-1" />
                                View
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 text-xs">
                                <Radio className="h-3 w-3 mr-1" />
                                Activate
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="col-span-3 flex flex-col items-center justify-center p-8 text-center bg-zinc-800 rounded-md border border-zinc-700">
                        <ListMusic className="h-12 w-12 mb-4 text-zinc-500" />
                        <h3 className="text-lg font-medium mb-2">No Playlists Available</h3>
                        <p className="text-sm text-zinc-400 mb-4">Create a new playlist to get started</p>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Playlist
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="schedule" className="mt-0 overflow-hidden flex flex-col">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="border-b border-zinc-800">
                  <CardTitle>Schedule Manager</CardTitle>
                  <CardDescription>Create and manage automated scheduling</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                      <div key={day} className="text-center font-medium text-sm">{day}</div>
                    ))}
                    
                    {/* Calendar days */}
                    {Array.from({ length: 35 }).map((_, index) => {
                      const dayNumber = (index % 31) + 1;
                      const hasEvent = [3, 8, 12, 15, 20, 22, 27].includes(dayNumber);
                      
                      return (
                        <div 
                          key={index} 
                          className={`aspect-square bg-zinc-800 p-1 text-xs relative border border-zinc-700 rounded-sm ${
                            hasEvent ? 'ring-1 ring-blue-500' : ''
                          }`}
                        >
                          <div className="absolute top-1 left-1 text-white">{dayNumber}</div>
                          {hasEvent && (
                            <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-blue-500"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Upcoming scheduled events */}
                  <div className="mt-6">
                    <h3 className="text-sm font-medium mb-2">Upcoming Scheduled Events</h3>
                    <div className="space-y-2">
                      {/* Empty array for scheduled events - will be replaced with real data from API */}
                      {[].length > 0 ? (
                        [].map((event: any, i: number) => (
                          <div key={i} className="flex justify-between bg-zinc-800 p-2 rounded">
                            <div>
                              <span className="text-sm font-medium text-white">{event.name}</span>
                              <div className="text-xs text-white/70">{event.date}</div>
                            </div>
                            <div className="text-sm font-mono text-white">{event.time}</div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center p-4 text-center bg-zinc-800 rounded-md border border-zinc-700">
                          <Calendar className="h-8 w-8 mb-2 text-zinc-500" />
                          <p className="text-sm text-zinc-400">No upcoming scheduled events</p>
                          <Button size="sm" className="mt-2">
                            <Plus className="h-3 w-3 mr-1" />
                            Add Event
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="ai-dj" className="mt-0 overflow-hidden flex flex-col">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="border-b border-zinc-800">
                  <CardTitle className="flex items-center">
                    <Wand2 className="mr-2 h-5 w-5 text-purple-400" />
                    AI-Powered Radio Automation
                  </CardTitle>
                  <CardDescription>
                    Create intelligent playlists using AI to analyze your music library and generate professional radio programming based on your preferences.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <AiDjPanel 
                    studioId={selectedStudio}
                    tracks={tracks || []} 
                    folders={folders || []}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Library Management Tab */}
            <TabsContent value="library" className="mt-0 overflow-hidden flex flex-col">
              <div className="bg-zinc-900 border border-zinc-800 rounded-md p-4 mt-0 h-full w-full flex flex-col">
                {/* Redirect to separate window when library tab is activated */}
                <script
                  dangerouslySetInnerHTML={{
                    __html: `
                      // Run once to open library in separate window
                      (function() {
                        // Open in a new window with specific dimensions
                        const width = 1024;
                        const height = 768;
                        const left = (window.screen.width - width) / 2;
                        const top = (window.screen.height - height) / 2;
                        
                        const libraryWindow = window.open(
                          '/library', 
                          'qcaller_library',
                          'width='+width+',height='+height+',left='+left+',top='+top+',menubar=no,toolbar=no,location=no,status=no'
                        );
                      })();
                    `
                  }}
                />
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
                  <h2 className="text-xl font-semibold flex items-center">
                    <FolderOpen className="h-5 w-5 mr-2" /> Media Library Management
                  </h2>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center space-x-1"
                      onClick={() => {
                        // Open in a new window with specific dimensions
                        const width = 1024;
                        const height = 768;
                        const left = (window.screen.width - width) / 2;
                        const top = (window.screen.height - height) / 2;
                        
                        const libraryWindow = window.open(
                          '/library', 
                          'qcaller_library',
                          `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
                        );
                        
                        if (libraryWindow) {
                          toast({
                            title: "Library Opened",
                            description: "Media library opened in a new window"
                          });
                        } else {
                          toast({
                            title: "Error",
                            description: "Could not open library window. Please check your popup blocker settings.",
                            variant: "destructive"
                          });
                        }
                      }}
                    >
                      <LibraryBig className="h-4 w-4 mr-1" />
                      <span>Open Library</span>
                    </Button>
                    <UploadTrackDialog
                      trigger={
                        <Button variant="outline" size="sm">
                          <Upload className="h-4 w-4 mr-1" />
                          Upload Files
                        </Button>
                      }
                    />
                    <Button variant="outline" size="sm" onClick={() => setShowFolderDialog(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      New Folder
                    </Button>
                  </div>
                </div>
                
                {/* Create Folder Dialog */}
                <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Create New Folder</DialogTitle>
                      <DialogDescription>
                        Enter a name for your new media folder.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                          Folder Name
                        </Label>
                        <Input
                          id="name"
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          className="col-span-3"
                          placeholder="My Music Folder"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        onClick={handleCreateFolder}
                        disabled={foldersLoading}
                      >
                        {foldersLoading ? (
                          <>
                            <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : "Create Folder"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 overflow-hidden h-[600px]">
                  {/* Folders Panel - Fixed height with scrollbar */}
                  <div className="col-span-1 bg-zinc-950 rounded-md border border-zinc-800 overflow-hidden h-full">
                    <div className="p-3 border-b border-zinc-800 bg-zinc-900 font-medium flex items-center justify-between">
                      <div className="flex items-center">
                        <FolderOpen className="h-4 w-4 mr-2 text-yellow-500" />
                        Folders
                      </div>
                      <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded-full">{folders.length}</span>
                    </div>
                    <div className="overflow-y-auto p-1 h-[calc(100%-40px)] custom-scrollbar">
                      {/* All Tracks option */}
                      <div 
                        className={`flex items-center px-3 py-2 hover:bg-zinc-800 cursor-pointer ${
                          selectedFolderId === null ? 'bg-zinc-800' : ''
                        }`}
                        onClick={() => {
                          setSelectedFolderId(null);
                        }}
                      >
                        <ListMusic className="h-4 w-4 mr-2 text-purple-400" />
                        <span className="text-sm font-medium">All Tracks</span>
                      </div>
                      
                      {/* Divider */}
                      <div className="my-1 border-t border-zinc-800"></div>
                      
                      {/* Folders list */}
                      {foldersLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <RefreshCcw className="h-4 w-4 animate-spin text-zinc-400" />
                          <span className="ml-2 text-sm text-zinc-400">Loading folders...</span>
                        </div>
                      ) : folders.length === 0 ? (
                        <div className="text-center py-4 text-sm text-zinc-400">
                          No folders found
                        </div>
                      ) : (
                        <div className="pr-1">
                          {folders.map((folder) => (
                            <div key={folder.id} className="mb-1">
                              <div 
                                className={`flex items-center justify-between px-3 py-2 hover:bg-zinc-800 cursor-pointer ${
                                  selectedFolderId === folder.id ? 'bg-zinc-800' : ''
                                }`}
                              >
                                <div 
                                  className="flex items-center flex-grow"
                                  onClick={() => {
                                    setSelectedFolderId(folder.id);
                                  }}
                                >
                                  {folder.name.includes('Jingle') || folder.name.includes('ID') ? (
                                    <FileMusic className="h-4 w-4 mr-2 text-amber-400" />
                                  ) : folder.name.includes('Music') ? (
                                    <Music className="h-4 w-4 mr-2 text-blue-400" />
                                  ) : folder.name.includes('News') || folder.name.includes('Weather') || folder.name.includes('Traffic') ? (
                                    <Radio className="h-4 w-4 mr-2 text-green-400" />
                                  ) : folder.name.includes('Commercial') || folder.name.includes('Ad') ? (
                                    <FileMusic className="h-4 w-4 mr-2 text-red-400" />
                                  ) : (
                                    <FolderOpen className="h-4 w-4 mr-2 text-yellow-400" />
                                  )}
                                  <span className="text-sm truncate max-w-[120px]">{folder.name}</span>
                                </div>
                                
                                {/* Action buttons */}
                                <div className="flex space-x-1 ml-1 flex-shrink-0">
                                  {/* Delete Folder Button */}
                                  <button 
                                    className="h-5 w-5 flex items-center justify-center text-zinc-400 hover:text-red-400"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (confirm(`Are you sure you want to delete the folder "${folder.name}"?`)) {
                                        deleteFolder(folder.id);
                                        
                                        // If this was the selected folder, set selected to null
                                        if (selectedFolderId === folder.id) {
                                          setSelectedFolderId(null);
                                        }
                                        
                                        toast({
                                          title: "Folder Deleted",
                                          description: `"${folder.name}" folder has been removed`
                                        });
                                      }
                                    }}
                                    title="Delete Folder"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                  
                                  {/* Edit button */}
                                  <button 
                                    className="h-5 w-5 flex items-center justify-center text-zinc-400 hover:text-blue-400"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // In a real implementation, you would show an edit dialog here
                                      toast({
                                        title: "Edit Folder",
                                        description: `Edit "${folder.name}" folder settings`
                                      });
                                    }}
                                    title="Edit Folder"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Tracks Panel - Fixed height with scrollbar */}
                  <div className="col-span-1 lg:col-span-3 bg-zinc-950 rounded-md border border-zinc-800 overflow-hidden h-full">
                    <div className="p-3 border-b border-zinc-800 bg-zinc-900 font-medium flex items-center justify-between">
                      <div className="flex items-center">
                        <Music className="h-4 w-4 mr-2 text-blue-500" />
                        {selectedFolderId ? `Tracks in "${folders.find(f => f.id === selectedFolderId)?.name || ''}"` : "All Tracks"}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                          <Input 
                            placeholder="Search tracks..." 
                            className="pl-8 h-8 text-xs bg-zinc-900 border-zinc-700 w-[200px]" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                        <span className="text-xs bg-zinc-800 px-2 py-0.5 rounded-full">
                          {filteredTracks.length}
                        </span>
                      </div>
                    </div>
                    <div className="overflow-y-auto h-[calc(100%-40px)] custom-scrollbar">
                      <table className="w-full table-auto">
                        <thead className="bg-zinc-900 text-xs sticky top-0 z-10">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium">Title</th>
                            <th className="px-4 py-2 text-left font-medium">Artist</th>
                            <th className="px-4 py-2 text-left font-medium">Album</th>
                            <th className="px-4 py-2 text-left font-medium">Duration</th>
                            <th className="px-4 py-2 text-left font-medium">Category</th>
                            <th className="px-4 py-2 text-left font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTracks.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-4 py-8 text-center text-zinc-400">
                                {searchQuery ? 'No tracks match your search query' : 'No tracks found in this folder'}
                              </td>
                            </tr>
                          ) : (
                            filteredTracks.map((track) => (
                                <tr 
                                  key={track.id} 
                                  className="border-b border-zinc-900 hover:bg-zinc-900/50"
                                  onClick={() => handleLibraryTrackClick(track)}
                                  onDoubleClick={() => handlePlayTrack(track, 'playerA')}
                                >
                                  <td className="px-4 py-2 text-sm">{track.title}</td>
                                  <td className="px-4 py-2 text-sm text-zinc-300">{track.artist || '-'}</td>
                                  <td className="px-4 py-2 text-sm text-zinc-300">{track.album || '-'}</td>
                                  <td className="px-4 py-2 text-sm text-zinc-300">
                                    {formatDuration(track.duration)}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-zinc-300">
                                    {track.category || '-'}
                                  </td>
                                  <td className="px-4 py-2 text-sm">
                                    <div className="flex space-x-1">
                                      <Button variant="ghost" size="sm" className="h-6 px-2" onClick={(e) => {
                                        e.stopPropagation();
                                        handlePlayTrack(track, 'playerA');
                                      }}>
                                        <Play className="h-3 w-3" />
                                      </Button>
                                      <Button variant="ghost" size="sm" className="h-6 px-2" onClick={(e) => {
                                        e.stopPropagation();
                                        addTrackToPlayerPlaylist('A', track);
                                        toast({
                                          title: "Track Added",
                                          description: `${track.title} added to Player A`,
                                        });
                                      }}>
                                        <Plus className="h-3 w-3" />
                                        <span className="ml-1">A</span>
                                      </Button>
                                      <Button variant="ghost" size="sm" className="h-6 px-2" onClick={(e) => {
                                        e.stopPropagation();
                                        addTrackToPlayerPlaylist('B', track);
                                        toast({
                                          title: "Track Added",
                                          description: `${track.title} added to Player B`,
                                        });
                                      }}>
                                        <Plus className="h-3 w-3" />
                                        <span className="ml-1">B</span>
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Database Status Footer */}
      <DatabaseStatusFooter />
      
      {/* Track Context Menu */}
      {showContextMenu && contextMenuPosition && selectedContextTrack && (
        <div
          className="fixed bg-zinc-900 border border-zinc-700 rounded-md shadow-lg p-2 z-50"
          style={{
            top: `${contextMenuPosition.y}px`, 
            left: `${contextMenuPosition.x}px`,
            width: '200px'
          }}
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside menu
        >
          <div className="flex flex-col space-y-1">
            <button
              className="flex items-center gap-2 p-2 text-sm text-orange-500 hover:bg-zinc-800 rounded-md"
              onClick={() => {
                // Create an AudioTrack from the selected track
                const audioTrack: AudioTrack = {
                  id: selectedContextTrack.id,
                  title: selectedContextTrack.title,
                  path: selectedContextTrack.path,
                  artist: selectedContextTrack.artist || null,
                  album: selectedContextTrack.album || null,
                  duration: selectedContextTrack.duration,
                  fileType: selectedContextTrack.fileType || 'audio/mpeg',
                  fileSize: selectedContextTrack.fileSize || null,
                  waveformData: null,
                  cuePoints: null,
                  bpm: null,
                  tags: null,
                  category: selectedContextTrack.category || null,
                  normalizedLevel: null,
                  folderId: selectedContextTrack.folderId || null,
                  createdAt: selectedContextTrack.createdAt || null,
                  lastPlayedAt: selectedContextTrack.lastPlayedAt || null,
                  playCount: selectedContextTrack.playCount || null
                };
                
                // Load to player A
                try {
                  // Load track into player
                  audioPlayer.setTrack(audioTrack, 'playerA');
                  
                  // Create a properly typed PlayerTrack for the player's UI state
                  const playerTrack: PlayerTrack = {
                    id: selectedContextTrack.id,
                    title: selectedContextTrack.title,
                    artist: selectedContextTrack.artist || null,
                    duration: selectedContextTrack.duration,
                    path: selectedContextTrack.path,
                    category: selectedContextTrack.category || null,
                    album: selectedContextTrack.album || null,
                    fileType: selectedContextTrack.fileType || 'audio/mpeg',
                    fileSize: selectedContextTrack.fileSize || null,
                    folderId: selectedContextTrack.folderId || null,
                    playCount: selectedContextTrack.playCount || null,
                    createdAt: selectedContextTrack.createdAt || null,
                    lastPlayedAt: selectedContextTrack.lastPlayedAt || null,
                    status: 'queued',
                    position: 1
                  };
                  
                  // Update the tracks list for Player A
                  setPlayerATracks([playerTrack]);
                  
                  // Add a small delay to ensure the track is loaded before attempting to play
                  setTimeout(() => {
                    try {
                      if (audioPlayer.play) {
                        audioPlayer.play('playerA');
                        console.log("Successfully started playback in Player A");
                      } else {
                        console.warn("Play method not available on audioPlayer");
                      }
                    } catch (playError) {
                      console.error("Error playing track in Player A:", playError);
                    }
                  }, 300);
                  
                  console.log("Successfully loaded track to Player A:", selectedContextTrack.title);
                } catch (error) {
                  console.error("Error loading track to Player A:", error);
                }
                
                // Show toast
                toast({
                  title: "Track loaded",
                  description: `Loaded "${selectedContextTrack.title}" to Player A`,
                });
                
                // Close context menu
                setShowContextMenu(false);
              }}
            >
              <Play className="h-4 w-4" /> Load to Player A
            </button>
            
            <button
              className="flex items-center gap-2 p-2 text-sm text-green-500 hover:bg-zinc-800 rounded-md"
              onClick={() => {
                // Create an AudioTrack from the selected track
                const audioTrack: AudioTrack = {
                  id: selectedContextTrack.id,
                  title: selectedContextTrack.title,
                  path: selectedContextTrack.path,
                  artist: selectedContextTrack.artist || null,
                  album: selectedContextTrack.album || null,
                  duration: selectedContextTrack.duration,
                  fileType: selectedContextTrack.fileType || 'audio/mpeg',
                  fileSize: selectedContextTrack.fileSize || null,
                  waveformData: null,
                  cuePoints: null,
                  bpm: null,
                  tags: null,
                  category: selectedContextTrack.category || null,
                  normalizedLevel: null,
                  folderId: selectedContextTrack.folderId || null,
                  createdAt: selectedContextTrack.createdAt || null,
                  lastPlayedAt: selectedContextTrack.lastPlayedAt || null,
                  playCount: selectedContextTrack.playCount || null
                };
                
                // Load to player B
                try {
                  // Load track into player
                  audioPlayer.setTrack(audioTrack, 'playerB');
                  
                  // Create a properly typed PlayerTrack for the player's UI state
                  const playerTrack: PlayerTrack = {
                    id: selectedContextTrack.id,
                    title: selectedContextTrack.title,
                    artist: selectedContextTrack.artist || null,
                    duration: selectedContextTrack.duration,
                    path: selectedContextTrack.path,
                    category: selectedContextTrack.category || null,
                    album: selectedContextTrack.album || null,
                    fileType: selectedContextTrack.fileType || 'audio/mpeg',
                    fileSize: selectedContextTrack.fileSize || null,
                    folderId: selectedContextTrack.folderId || null,
                    playCount: selectedContextTrack.playCount || null,
                    createdAt: selectedContextTrack.createdAt || null,
                    lastPlayedAt: selectedContextTrack.lastPlayedAt || null,
                    status: 'queued',
                    position: 1
                  };
                  
                  // Update the tracks list for Player B
                  setPlayerBTracks([playerTrack]);
                  
                  // Add a small delay to ensure the track is loaded before attempting to play
                  setTimeout(() => {
                    try {
                      if (audioPlayer.play) {
                        audioPlayer.play('playerB');
                        console.log("Successfully started playback in Player B");
                      } else {
                        console.warn("Play method not available on audioPlayer");
                      }
                    } catch (playError) {
                      console.error("Error playing track in Player B:", playError);
                    }
                  }, 300);
                  
                  console.log("Successfully loaded track to Player B:", selectedContextTrack.title);
                } catch (error) {
                  console.error("Error loading track to Player B:", error);
                }
                
                // Show toast
                toast({
                  title: "Track loaded",
                  description: `Loaded "${selectedContextTrack.title}" to Player B`,
                });
                
                // Close context menu
                setShowContextMenu(false);
              }}
            >
              <Play className="h-4 w-4" /> Load to Player B
            </button>
            
            <button
              className="flex items-center gap-2 p-2 text-sm text-purple-500 hover:bg-zinc-800 rounded-md"
              onClick={() => {
                // Create an AudioTrack from the selected track
                const audioTrack: AudioTrack = {
                  id: selectedContextTrack.id,
                  title: selectedContextTrack.title,
                  path: selectedContextTrack.path,
                  artist: selectedContextTrack.artist || null,
                  album: selectedContextTrack.album || null,
                  duration: selectedContextTrack.duration,
                  fileType: selectedContextTrack.fileType || 'audio/mpeg',
                  fileSize: selectedContextTrack.fileSize || null,
                  waveformData: null,
                  cuePoints: null,
                  bpm: null,
                  tags: null,
                  category: selectedContextTrack.category || null,
                  normalizedLevel: null,
                  folderId: selectedContextTrack.folderId || null,
                  createdAt: selectedContextTrack.createdAt || null,
                  lastPlayedAt: selectedContextTrack.lastPlayedAt || null,
                  playCount: selectedContextTrack.playCount || null
                };
                
                // Create a properly typed PlayerTrack object for Player C
                const playerCTrack: PlayerTrack = {
                  id: selectedContextTrack.id,
                  title: selectedContextTrack.title,
                  artist: selectedContextTrack.artist || null,
                  duration: selectedContextTrack.duration,
                  path: selectedContextTrack.path,
                  category: selectedContextTrack.category || null,
                  album: selectedContextTrack.album || null,
                  fileType: selectedContextTrack.fileType || 'audio/mpeg',
                  fileSize: selectedContextTrack.fileSize || null,
                  folderId: selectedContextTrack.folderId || null,
                  playCount: selectedContextTrack.playCount || null,
                  createdAt: selectedContextTrack.createdAt || null,
                  lastPlayedAt: selectedContextTrack.lastPlayedAt || null,
                  status: 'queued',
                  position: 1
                };
                
                // Set as Player C track
                setPlayerCTrack(playerCTrack);
                
                // Load to player C
                audioPlayer.setTrack(audioTrack, 'playerC');
                
                // Add a small delay to ensure the track is loaded before attempting to play
                setTimeout(() => {
                  try {
                    if (audioPlayer.play) {
                      audioPlayer.play('playerC');
                      console.log("Successfully started playback in Player C");
                    } else {
                      console.warn("Play method not available on audioPlayer");
                    }
                  } catch (playError) {
                    console.error("Error playing track in Player C:", playError);
                  }
                }, 300);
                
                // Show toast
                toast({
                  title: "Track loaded",
                  description: `Loaded "${selectedContextTrack.title}" to Player C`,
                });
                
                // Close context menu
                setShowContextMenu(false);
              }}
            >
              <Play className="h-4 w-4" /> Load to Player C
            </button>
          </div>
        </div>
      )}
      
      {/* Schedule dialog */}
      <ScheduleDialog 
        isOpen={isScheduleOpen} 
        onClose={() => setIsScheduleOpen(false)} 
      />
      
    </div>
  );
  
  // Set up listener for track events from MediaFolderExplorer
  useEffect(() => {
    const handleTrackRightClick = (e: CustomEvent) => {
      const { track, x, y } = e.detail;
      
      // Position context menu at click coordinates
      setContextMenuPosition({ x, y });
      setSelectedContextTrack(track);
      setShowContextMenu(true);
      
      // Prevent default context menu from showing
      document.addEventListener('contextmenu', preventDefaultContextMenu, { once: true });
      
      console.log("Track right-clicked:", track, "at position", x, y);
    };
    
    // Function to handle direct loading to player A
    const handleLoadTrackToPlayer = (e: CustomEvent) => {
      const { track, player } = e.detail;
      
      console.log(`Loading track to player ${player}:`, track);
      
      // Create a track for the player (with the required properties)
      const playerTrack = {
        id: track.id,
        title: track.title,
        artist: track.artist || '',
        duration: track.duration || 0,
        path: track.path || '',
        status: 'queued' as 'queued' | 'playing' | 'next',
        position: 1 // Add required position field
      };
      
      // Create an AudioTrack from the selected track for audio player service
      const audioTrack: AudioTrack = {
        id: track.id,
        title: track.title,
        path: track.path || '',
        artist: track.artist || null,
        album: track.album || null,
        duration: track.duration || 0,
        fileType: track.fileType || 'audio/mpeg',
        fileSize: track.fileSize || null,
        waveformData: null,
        cuePoints: null,
        bpm: null,
        tags: null,
        category: track.category || null,
        normalizedLevel: null,
        folderId: track.folderId || null,
        createdAt: track.createdAt || null,
        lastPlayedAt: track.lastPlayedAt || null,
        playCount: track.playCount || null
      };
      
      if (player === 'A') {
        // Set the track in player A
        setPlayerATracks([playerTrack]);
        
        // Load track to audio player service
        audioPlayer.setTrack(audioTrack, 'playerA');
        
        // Add a small delay to ensure the track is loaded before attempting to play
        setTimeout(() => {
          try {
            if (audioPlayer.play) {
              audioPlayer.play('playerA');
              console.log("Successfully started playback in Player A from event handler");
            } else {
              console.warn("Play method not available on audioPlayer");
            }
          } catch (playError) {
            console.error("Error playing track in Player A:", playError);
          }
        }, 300);
        
        toast({
          title: "Track Loaded",
          description: `Loaded "${track.title}" into Player A`,
        });
      } else if (player === 'B') {
        // Set the track in player B
        setPlayerBTracks([playerTrack]);
        
        // Load track to audio player service
        audioPlayer.setTrack(audioTrack, 'playerB');
        
        // Add a small delay to ensure the track is loaded before attempting to play
        setTimeout(() => {
          try {
            if (audioPlayer.play) {
              audioPlayer.play('playerB');
              console.log("Successfully started playback in Player B from event handler");
            } else {
              console.warn("Play method not available on audioPlayer");
            }
          } catch (playError) {
            console.error("Error playing track in Player B:", playError);
          }
        }, 300);
        
        toast({
          title: "Track Loaded",
          description: `Loaded "${track.title}" into Player B`,
        });
      } else if (player === 'C') {
        // Handle Player C
        audioPlayer.setTrack(audioTrack, 'playerC');
        
        // Add a small delay to ensure the track is loaded before attempting to play
        setTimeout(() => {
          try {
            if (audioPlayer.play) {
              audioPlayer.play('playerC');
              console.log("Successfully started playback in Player C from event handler");
            } else {
              console.warn("Play method not available on audioPlayer");
            }
          } catch (playError) {
            console.error("Error playing track in Player C:", playError);
          }
        }, 300);
        
        toast({
          title: "Track Loaded",
          description: `Loaded "${track.title}" into Player C`,
        });
      }
    };
    
    // Function to play track immediately
    const handlePlayTrack = (e: CustomEvent) => {
      const { track } = e.detail;
      
      console.log("Playing track immediately:", track);
      
      try {
        // Create an AudioTrack from the selected track for audio player service
        const audioTrack: AudioTrack = {
          id: track.id,
          title: track.title,
          path: track.path || '',
          artist: track.artist || null,
          album: track.album || null,
          duration: track.duration || 0,
          fileType: track.fileType || 'audio/mpeg',
          fileSize: track.fileSize || null,
          waveformData: null,
          cuePoints: null,
          bpm: null,
          tags: null,
          category: track.category || null,
          normalizedLevel: null,
          folderId: track.folderId || null,
          createdAt: track.createdAt || null,
          lastPlayedAt: track.lastPlayedAt || null,
          playCount: track.playCount || null
        };
        
        // Create a track for the player UI
        const playerTrack: PlayerTrack = {
          id: track.id,
          title: track.title,
          artist: track.artist || null,
          duration: track.duration || 0,
          path: track.path || '',
          status: 'playing' as 'playing' | 'queued' | 'next',
          position: 1,
          category: track.category || null,
          album: track.album || null,
          fileType: track.fileType || 'audio/mpeg',
          fileSize: track.fileSize || null,
          folderId: track.folderId || null,
          playCount: track.playCount || null,
          createdAt: track.createdAt || null,
          lastPlayedAt: track.lastPlayedAt || null
        };
        
        // Set the track in Player A
        setPlayerATracks([playerTrack]);
        
        // Load track to audio player service and play it
        audioPlayer.setTrack(audioTrack, 'playerA');
        
        // If setTrack was successful, try to play the track
        setTimeout(() => {
          try {
            // Call the play method
            if (audioPlayer.play) {
              audioPlayer.play('playerA');
              console.log("Successfully started playback");
            } else {
              console.warn("Play method not available on audioPlayer");
            }
          } catch (playError) {
            console.error("Error playing track:", playError);
          }
        }, 300); // short delay to ensure track is loaded
        
        toast({
          title: "Track Playing",
          description: `Now playing "${track.title}"`,
        });
      } catch (error) {
        console.error("Error loading track for playback:", error);
        toast({
          title: "Playback Error",
          description: `Failed to play "${track.title}"`,
          variant: "destructive"
        });
      }
    };
    
    // Function to prevent default context menu
    const preventDefaultContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    
    // Add handler for adding tracks to playlist on single click
    const handleAddTrackToPlaylist = (e: CustomEvent) => {
      const { track, playlistId } = e.detail;
      
      console.log("Adding track to playlist:", track);
      
      // If a specific playlist ID was provided in the event, use that
      // Otherwise, use the currently selected playlist
      const targetPlaylistId = playlistId || selectedPlaylistId;
      
      // Ensure we have a valid playlist to add the track to
      if (!targetPlaylistId) {
        toast({
          title: "No playlist selected",
          description: "Please select a playlist first",
          variant: "destructive"
        });
        return;
      }
      
      // Find the playlist to get its name for the toast message
      const targetPlaylist = playlists.find(p => p.id === targetPlaylistId);
      
      if (!targetPlaylist) {
        toast({
          title: "Playlist not found",
          description: "The selected playlist could not be found",
          variant: "destructive"
        });
        return;
      }
      
      // Add the track to the selected playlist using the RadioAutomation context
      // This adds to the playlist without loading into players or interrupting playback
      try {
        // Use the addTrackToPlaylist function from the RadioAutomation context
        addTrackToPlaylist(targetPlaylistId, track.id, 999999); // Add to end of playlist
        
        toast({
          title: "Track added to playlist",
          description: `Added "${track.title}" to "${targetPlaylist.name}"`,
        });
      } catch (error) {
        console.error("Failed to add track to playlist:", error);
        toast({
          title: "Failed to add track",
          description: "There was an error adding the track to the playlist",
          variant: "destructive"
        });
      }
    };

    // Add event listeners for custom track events
    document.addEventListener('trackRightClick', handleTrackRightClick as EventListener);
    document.addEventListener('loadTrackToPlayer', handleLoadTrackToPlayer as EventListener);
    document.addEventListener('playTrack', handlePlayTrack as EventListener);
    document.addEventListener('loadTrackToPlayerA', handleLoadTrackToPlayer as EventListener);
    document.addEventListener('addTrackToPlaylist', handleAddTrackToPlaylist as EventListener);
    
    // Add click handler to close context menu when clicking elsewhere
    const handleDocumentClick = () => {
      if (showContextMenu) {
        setShowContextMenu(false);
      }
    };
    
    document.addEventListener('click', handleDocumentClick);
    
    // Clean up event listeners
    return () => {
      document.removeEventListener('trackRightClick', handleTrackRightClick as EventListener);
      document.removeEventListener('loadTrackToPlayer', handleLoadTrackToPlayer as EventListener);
      document.removeEventListener('playTrack', handlePlayTrack as EventListener);
      document.removeEventListener('loadTrackToPlayerA', handleLoadTrackToPlayer as EventListener);
      document.removeEventListener('addTrackToPlaylist', handleAddTrackToPlaylist as EventListener);
      document.removeEventListener('click', handleDocumentClick);
      document.removeEventListener('contextmenu', preventDefaultContextMenu);
    };
  }, [showContextMenu, audioPlayer, setPlayerATracks, setPlayerBTracks, playlists, selectedPlaylistId, addTrackToPlaylist, toast]);
};

// Wrap components that need access to the RadioAutomation context
const MAirlistStylePage = () => {
  return (
    <RadioAutomationProvider>
      <MAirlistStyleContent />
    </RadioAutomationProvider>
  );
};

export default MAirlistStylePage;
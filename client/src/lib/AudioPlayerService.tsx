import { useState, useEffect, useRef, createContext, useContext, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Interface for player output configuration
export interface PlayerOutputConfig {
  playerId: string; // "playerA", "playerB", "playerC", "cartwall"
  outputDevice: string;
  name: string;
}

// Interface for track data
export interface AudioTrack {
  id: number;
  title: string;
  path: string;
  artist: string | null;
  album: string | null;
  duration: number;
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
}

// Define the context
interface AudioPlayerContextType {
  // Functions
  playTrack: (track: AudioTrack, playerId: string) => void;
  pauseTrack: (playerId: string) => void;
  stopTrack: (playerId: string) => void;
  setVolume: (volume: number, playerId: string) => void;
  setCuePoint: (cuePoint: number, trackId: number) => void;
  getOutputDeviceForPlayer: (playerId: string) => string;
  setTrack: (track: AudioTrack, playerId: string) => void; // Add track to player without playing it
  updateTrack: (track: AudioTrack, playerId: string) => void; // Update an existing track
  play: (playerId: string) => void; // Play the currently loaded track
  loadTrack: (track: AudioTrack, playerId: string) => void; // Load a track to player
  unloadTrack: (playerId: string) => void; // Remove track from player
  getAudioElement: (playerId: string) => HTMLAudioElement | null; // Get the audio element for a player
  seekTo: (position: number, playerId: string) => void; // Seek to a specific position in the track
  prebufferTrack: (track: AudioTrack, playerId: string) => void; // Prebuffer a track for faster playback
  prebufferNextTrack: (nextTrack: AudioTrack, playerId: string) => void; // Prebuffer the next track in a playlist
  
  // State
  isPlaying: (playerId: string) => boolean;
  currentTrack: (playerId: string) => AudioTrack | null;
  currentPosition: (playerId: string) => number;
  volume: (playerId: string) => number;
  duration: (playerId: string) => number;
}

// Create context
const AudioPlayerContext = createContext<AudioPlayerContextType | null>(null);

// Create provider
export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  // Get toast function
  const { toast } = useToast();
  
  // Refs to store audio elements for each player
  const audioElementsRef = useRef<Record<string, HTMLAudioElement | null>>({
    playerA: null,
    playerB: null,
    playerC: null,
    cartwall: null
  });

  // State to track current playing tracks and player states
  const [players, setPlayers] = useState<Record<string, {
    track: AudioTrack | null;
    isPlaying: boolean;
    volume: number;
    position: number;
    duration: number;
    isPrebuffered: boolean; // Track whether the audio is prebuffered
    nextTrack: AudioTrack | null; // Store the next track for prebuffering
    isNextTrackPrebuffered: boolean; // Track whether the next track is prebuffered
  }>>({
    playerA: { track: null, isPlaying: false, volume: 1, position: 0, duration: 0, isPrebuffered: false, nextTrack: null, isNextTrackPrebuffered: false },
    playerB: { track: null, isPlaying: false, volume: 1, position: 0, duration: 0, isPrebuffered: false, nextTrack: null, isNextTrackPrebuffered: false },
    playerC: { track: null, isPlaying: false, volume: 1, position: 0, duration: 0, isPrebuffered: false, nextTrack: null, isNextTrackPrebuffered: false },
    cartwall: { track: null, isPlaying: false, volume: 1, position: 0, duration: 0, isPrebuffered: false, nextTrack: null, isNextTrackPrebuffered: false }
  });

  // State to store output device settings
  const [playerOutputs, setPlayerOutputs] = useState<PlayerOutputConfig[]>([
    { playerId: 'playerA', outputDevice: 'default', name: 'Player A' },
    { playerId: 'playerB', outputDevice: 'default', name: 'Player B' },
    { playerId: 'playerC', outputDevice: 'default', name: 'Player C' },
    { playerId: 'cartwall', outputDevice: 'default', name: 'Cart Wall' }
  ]);

  // Load player output configuration from localStorage on mount
  useEffect(() => {
    try {
      const savedOutputs = localStorage.getItem('playerOutputs');
      if (savedOutputs) {
        const parsedOutputs = JSON.parse(savedOutputs) as PlayerOutputConfig[];
        if (Array.isArray(parsedOutputs) && parsedOutputs.length > 0) {
          setPlayerOutputs(parsedOutputs);
        }
      }
    } catch (err) {
      console.error('Failed to load player outputs from localStorage:', err);
    }
  }, []);

  // Function to get the output device for a player
  const getOutputDeviceForPlayer = (playerId: string): string => {
    const playerConfig = playerOutputs.find(p => p.playerId === playerId);
    return playerConfig?.outputDevice || 'default';
  };
  
  // Function to prebuffer a track for faster playback
  const prebufferTrack = async (track: AudioTrack, playerId: string) => {
    if (!track || !track.path) {
      console.log(`Cannot prebuffer track: Invalid track or missing path`);
      return;
    }
    
    try {
      console.log(`Starting prebuffering of track "${track.title}" for ${playerId}`);
      
      // Create a temporary audio element for prebuffering
      const tempAudio = new Audio();
      tempAudio.preload = 'auto';
      
      // Process the source path just like in playTrack
      let sourcePath = track.path.trim();
      if (!sourcePath.startsWith('http') && !sourcePath.startsWith('blob:')) {
        if (!sourcePath.startsWith('/uploads/')) {
          const cleanPath = sourcePath.replace(/^\/?(uploads\/)?/, '');
          sourcePath = `/uploads/${cleanPath}`;
        }
      }
      
      // Construct the full URL
      const baseUrl = window.location.origin;
      const fullUrl = new URL(sourcePath, baseUrl).href;
      tempAudio.src = fullUrl;
      
      // Listen for the canplaythrough event
      tempAudio.addEventListener('canplaythrough', () => {
        console.log(`Track "${track.title}" prebuffered successfully for ${playerId}`);
        
        // Update player state to mark the track as prebuffered
        setPlayers(prev => ({
          ...prev,
          [playerId]: {
            ...prev[playerId],
            isPrebuffered: true
          }
        }));
        
        // Clean up the temp audio element
        tempAudio.removeAttribute('src');
      });
      
      // Listen for errors
      tempAudio.addEventListener('error', (e) => {
        console.error(`Error prebuffering track "${track.title}" for ${playerId}:`, e);
        const error = tempAudio.error;
        if (error) {
          console.error(`Prebuffer error code: ${error.code}, message: ${error.message}`);
        }
      });
      
      // Start loading the audio
      tempAudio.load();
    } catch (error) {
      console.error(`Error in prebufferTrack for ${playerId}:`, error);
    }
  };
  
  // Function to prebuffer the next track in a playlist
  const prebufferNextTrack = (nextTrack: AudioTrack, playerId: string) => {
    if (!nextTrack) return;
    
    console.log(`Setting up prebuffering for next track "${nextTrack.title}" in ${playerId}`);
    
    // Update the player state to include the next track info
    setPlayers(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        nextTrack: nextTrack,
        isNextTrackPrebuffered: false
      }
    }));
    
    // Start prebuffering the next track
    prebufferTrack(nextTrack, playerId + '_next');
  };

  // Function to play a track
  const playTrack = async (track: AudioTrack, playerId: string) => {
    try {
      console.log(`Playing track "${track.title}" on ${playerId}`);
      
      // Pre-flight checks for playback
      
      // Check 1: Verify we have a valid track object
      if (!track) {
        console.error(`Cannot play track: Track object is null or undefined`);
        toast({
          title: 'Playback Error',
          description: 'Cannot play: Invalid track data',
          variant: 'destructive',
        });
        return;
      }
      
      // Check 2: Verify track has a valid file size
      if (track.fileSize !== null && track.fileSize <= 0) {
        console.error(`Cannot play track "${track.title}" - file is empty or corrupt (size: ${track.fileSize} bytes)`);
        toast({
          title: 'Playback Error',
          description: `"${track.title}" appears to be an empty file. Please re-upload this track.`,
          variant: 'destructive',
        });
        return;
      }
      
      // Check 3: Verify track has a valid path
      if (!track.path) {
        console.error(`Track has no path:`, track);
        toast({
          title: 'Playback Error',
          description: `"${track.title}" has no associated audio file path.`,
          variant: 'destructive',
        });
        return;
      }
      
      // Check 4: Verify track has proper metadata
      if (track.duration <= 0) {
        console.warn(`Track "${track.title}" has invalid duration (${track.duration}s). This may cause playback issues.`);
      }
      
      // Check 5: Check WebSocket connection
      const hasActiveWebsocket = document.querySelector('.websocket-connected') !== null;
      if (!hasActiveWebsocket) {
        console.warn("WebSocket connection is not active. Playback may not work properly.");
        toast({
          title: 'Connection Warning',
          description: 'WebSocket connection is not active. Playback may not work correctly.',
          variant: 'destructive',
        });
      }

      // First, create a new audio element if it doesn't exist
      if (!audioElementsRef.current[playerId]) {
        audioElementsRef.current[playerId] = new Audio();
        
        // Add event listeners that will persist for the audio element's lifetime
        audioElementsRef.current[playerId].addEventListener('timeupdate', () => {
          const audioElement = audioElementsRef.current[playerId];
          if (audioElement) {
            setPlayers(prev => ({
              ...prev,
              [playerId]: {
                ...prev[playerId],
                position: audioElement.currentTime,
                duration: audioElement.duration || 0
              }
            }));
            
            // Check for cue points and apply them
            const currentTrack = players[playerId]?.track;
            if (currentTrack?.cuePoints) {
              try {
                const cuePointsData = JSON.parse(currentTrack.cuePoints);
                
                // Check if we've reached the end cue point
                if (cuePointsData.end && audioElement.currentTime >= cuePointsData.end) {
                  console.log(`Reached end cue point (${cuePointsData.end}s) for track "${currentTrack.title}" - stopping playback`);
                  audioElement.pause();
                  
                  // Dispatch a custom trackEnded event for Auto DJ to listen to
                  const trackEndedEvent = new CustomEvent('trackEnded', { 
                    detail: { 
                      playerId,
                      track: currentTrack
                    }
                  });
                  document.dispatchEvent(trackEndedEvent);
                }
                
                // Check if we need to start applying fade out
                if (cuePointsData.fadeOut && 
                    cuePointsData.end && 
                    audioElement.currentTime >= (cuePointsData.end - cuePointsData.fadeOut)) {
                  // Calculate how far into the fade out period we are (0 to 1)
                  const fadeOutProgress = (audioElement.currentTime - (cuePointsData.end - cuePointsData.fadeOut)) / cuePointsData.fadeOut;
                  // Apply volume fade (from current volume to 0)
                  const originalVolume = players[playerId]?.volume || 1;
                  audioElement.volume = originalVolume * (1 - Math.min(fadeOutProgress, 1));
                }
                
                // Apply fade in if needed
                if (cuePointsData.fadeIn && 
                    cuePointsData.start !== undefined && 
                    audioElement.currentTime >= cuePointsData.start && 
                    audioElement.currentTime <= (cuePointsData.start + cuePointsData.fadeIn)) {
                  // Calculate how far into the fade in period we are (0 to 1)
                  const fadeInProgress = (audioElement.currentTime - cuePointsData.start) / cuePointsData.fadeIn;
                  // Apply volume fade (from 0 to current volume)
                  const targetVolume = players[playerId]?.volume || 1;
                  audioElement.volume = targetVolume * Math.min(fadeInProgress, 1);
                  console.log(`Applying fade in: ${Math.round(fadeInProgress * 100)}%, volume: ${audioElement.volume.toFixed(2)}`);
                }
              } catch (error) {
                console.error('Error applying cue points:', error);
              }
            }
          }
        });
        
        audioElementsRef.current[playerId].addEventListener('ended', () => {
          console.log(`🔴 Track ended in ${playerId}. Dispatching trackEnded event...`);
          
          // Get current track info before updating state
          const currentTrack = players[playerId]?.track;
          const nextTrack = players[playerId]?.nextTrack;
          
          // Update player state
          setPlayers(prev => ({
            ...prev,
            [playerId]: {
              ...prev[playerId],
              isPlaying: false,
              position: 0
            }
          }));
          
          // Dispatch the trackEnded event for Auto DJ to pick up on
          const trackEndEvent = new CustomEvent('trackEnded', { 
            detail: { 
              playerId: playerId,
              track: currentTrack,
              nextTrack: nextTrack
            }
          });
          document.dispatchEvent(trackEndEvent);
          
          // Force immediate check for next track if Auto DJ is enabled
          // This is critical for continuous playback
          console.log(`🎵 Auto DJ: Ended track "${currentTrack?.title}". Forcing immediate next track check.`);
          
          // IMPROVED: Accelerated response for continuous playback
          // First, dispatch the event immediately (we don't want any delay)
          const autoDjEvent = new CustomEvent('autoDjPlayNext', {
            detail: {
              playerId: playerId,
              previousTrack: currentTrack,
              priority: 'high'
            }
          });
          document.dispatchEvent(autoDjEvent);
          
          // As a fallback, also trigger with slight delay in case the first one is missed
          setTimeout(() => {
            const autoDjEventRetry = new CustomEvent('autoDjPlayNext', {
              detail: {
                playerId: playerId,
                previousTrack: currentTrack,
                priority: 'critical'
              }
            });
            document.dispatchEvent(autoDjEventRetry);
          }, 10);
        });
        
        // Add a timeupdate listener to monitor for track approaching the end
        audioElementsRef.current[playerId].addEventListener('timeupdate', () => {
          const audioElement = audioElementsRef.current[playerId];
          if (audioElement && audioElement.duration > 0) {
            const remainingTime = audioElement.duration - audioElement.currentTime;
            const currentTrack = players[playerId]?.track;
            
            // Improved track end approaching logic with multiple thresholds for better Auto DJ transitions
            // Critical for Auto DJ continuous playback
            
            // ENHANCED: Track approaching end with three thresholds (3s, 1.5s, 0.5s) for more robust transitions
            const thresholds = {
              early: 3.0,   // Early warning - gives the system time to prebuffer
              medium: 1.5,  // Medium urgency - prioritizes loading the next track
              critical: 0.5 // Critical - final chance to start the next track
            };
            
            // Early warning threshold (3 seconds remaining)
            if (remainingTime <= thresholds.early && !audioElement.dataset.earlyWarningTriggered && currentTrack) {
              console.log(`🔄 EARLY TRACK END WARNING: ${currentTrack.title} has ${remainingTime.toFixed(2)}s remaining. Starting prebuffering...`);
              audioElement.dataset.earlyWarningTriggered = 'true';
              
              // Dispatch early warning event (lower priority) - perfect time to start buffering next track
              const earlyWarningEvent = new CustomEvent('trackEndApproaching', { 
                detail: { 
                  playerId,
                  track: currentTrack,
                  remainingTime,
                  priority: 'early'
                }
              });
              document.dispatchEvent(earlyWarningEvent);
              // Ensure event bubbles up to document level
              window.setTimeout(() => document.dispatchEvent(earlyWarningEvent), 50);
              
              console.log('📢 Dispatched EARLY track end warning for Auto DJ');
            }
            
            // Medium threshold (1.5 seconds remaining)
            else if (remainingTime <= thresholds.medium && !audioElement.dataset.mediumWarningTriggered && currentTrack) {
              console.log(`🟨 MEDIUM TRACK END WARNING: ${currentTrack.title} has ${remainingTime.toFixed(2)}s remaining. Preparing next track...`);
              audioElement.dataset.mediumWarningTriggered = 'true';
              
              // Dispatch medium warning event - time to ensure next track is ready
              const mediumWarningEvent = new CustomEvent('trackEndApproaching', { 
                detail: { 
                  playerId,
                  track: currentTrack,
                  remainingTime,
                  priority: 'medium'
                }
              });
              document.dispatchEvent(mediumWarningEvent);
              // Ensure event bubbles up to document level with small delay for better capturing
              window.setTimeout(() => document.dispatchEvent(mediumWarningEvent), 50);
              
              console.log('📢 Dispatched MEDIUM track end warning for Auto DJ');
            }
            
            // Critical threshold (0.5 seconds or less remaining)
            else if (remainingTime <= thresholds.critical && !audioElement.dataset.criticalWarningTriggered && currentTrack) {
              console.log(`🔴 CRITICAL TRACK END WARNING: ${currentTrack.title} has ${remainingTime.toFixed(2)}s remaining. Immediate transition needed!`);
              audioElement.dataset.criticalWarningTriggered = 'true';
              
              // Dispatch critical warning event with highest priority - last chance to transition
              const criticalWarningEvent = new CustomEvent('trackEndApproaching', { 
                detail: { 
                  playerId,
                  track: currentTrack,
                  remainingTime,
                  priority: 'critical'
                }
              });
              document.dispatchEvent(criticalWarningEvent);
              
              // Direct trigger for autoDjPlayNext with critical priority as backup
              const autoDjPlayNext = new CustomEvent('autoDjPlayNext', {
                detail: {
                  priority: 'critical',
                  reason: 'track-end-critical'
                }
              });
              document.dispatchEvent(autoDjPlayNext);
              
              // Double-dispatch to ensure capture
              window.setTimeout(() => {
                document.dispatchEvent(criticalWarningEvent);
                document.dispatchEvent(autoDjPlayNext);
              }, 50);
              
              console.log('🚨 Dispatched CRITICAL track end warning for Auto DJ with direct play next trigger');
            }
            
            // Reset flags when track is playing normally
            else if (remainingTime > thresholds.early + 1) {
              // Reset all flags when not near the end
              if (audioElement.dataset.earlyWarningTriggered || 
                  audioElement.dataset.mediumWarningTriggered || 
                  audioElement.dataset.criticalWarningTriggered ||
                  audioElement.dataset.endApproachTriggered) {
                
                delete audioElement.dataset.earlyWarningTriggered;
                delete audioElement.dataset.mediumWarningTriggered;
                delete audioElement.dataset.criticalWarningTriggered;
                delete audioElement.dataset.endApproachTriggered;
              }
            }
          }
        });
        
        audioElementsRef.current[playerId].addEventListener('error', (e) => {
          console.error(`Audio playback error on ${playerId}:`, e);
          const audioEl = audioElementsRef.current[playerId];
          if (audioEl && audioEl.error) {
            console.error(`Error code: ${audioEl.error.code}, Error message: ${audioEl.error.message}`);
            
            // Show a user-friendly error message
            toast({
              title: 'Playback Error',
              description: `Could not play "${track.title}". The file may be corrupted or missing.`,
              variant: 'destructive',
            });
          }
        });
        
        // Add more event listeners for debugging
        audioElementsRef.current[playerId].addEventListener('loadstart', () => {
          console.log(`Audio loadstart event for ${playerId}`);
        });
        
        audioElementsRef.current[playerId].addEventListener('canplay', () => {
          console.log(`Audio canplay event for ${playerId} - track is ready to play`);
        });
        
        audioElementsRef.current[playerId].addEventListener('play', () => {
          console.log(`Audio play event triggered for ${playerId}`);
        });
        
        audioElementsRef.current[playerId].addEventListener('playing', () => {
          console.log(`Audio playing event triggered for ${playerId} - playback has started`);
        });
      }

      // Get the audio element
      const audioElement = audioElementsRef.current[playerId];
      if (audioElement) {
        // Reset any previous state
        audioElement.pause();
        
        // Check if track has cue points and set the initial position to the start cue point
        if (track.cuePoints) {
          try {
            const cuePointsData = JSON.parse(track.cuePoints);
            if (cuePointsData && cuePointsData.start !== undefined && cuePointsData.start !== null) {
              console.log(`Setting initial position to cue point start: ${cuePointsData.start}s`);
              audioElement.currentTime = cuePointsData.start;
            } else {
              audioElement.currentTime = 0;
            }
          } catch (error) {
            console.error('Error parsing cue points:', error);
            audioElement.currentTime = 0;
          }
        } else {
          audioElement.currentTime = 0;
        }
        
        // Set preload to auto
        audioElement.preload = 'auto';
        
        // Set the output device if supported
        if (
          'setSinkId' in audioElement && 
          typeof (audioElement as any).setSinkId === 'function'
        ) {
          try {
            const outputDevice = getOutputDeviceForPlayer(playerId);
            await (audioElement as any).setSinkId(outputDevice);
            console.log(`Audio output set to device: ${outputDevice} for player: ${playerId}`);
          } catch (err) {
            console.error(`Failed to set audio output device for ${playerId}:`, err);
          }
        } else {
          console.log(`setSinkId not supported for ${playerId}. Using default audio output.`);
        }
        
        // FIXED: Simplified path handling to be consistent across environments
        let sourcePath = track.path.trim(); // Trim any whitespace
        console.log(`Original track path: "${sourcePath}"`);
        
        // If not an absolute URL (http/https/blob)
        if (!sourcePath.startsWith('http') && !sourcePath.startsWith('blob:')) {
          // Always ensure the path starts with /uploads/ for consistency
          if (!sourcePath.startsWith('/uploads/')) {
            // Remove any leading slashes and 'uploads/' prefix to avoid duplication
            const cleanPath = sourcePath.replace(/^\/?(uploads\/)?/, '');
            sourcePath = `/uploads/${cleanPath}`;
          }
        }
        
        console.log(`Cleaned path: "${sourcePath}"`);
        
        // For all environments, construct full URL with hostname
        const baseUrl = window.location.origin;
        const fullUrl = new URL(sourcePath, baseUrl).href;
        
        console.log(`Final audio source path: "${fullUrl}"`);
        audioElement.src = fullUrl;
        
        // Set volume to make sure it's audible
        // But initialize to 0 if we have fade-in defined in cue points
        let initialVolume = players[playerId]?.volume || 1;
        if (track.cuePoints) {
          try {
            const cuePointsData = JSON.parse(track.cuePoints);
            if (cuePointsData && cuePointsData.fadeIn && cuePointsData.fadeIn > 0) {
              // If we have a fadeIn value, start with 0 volume and let the timeupdate event handle the fade in
              initialVolume = 0;
              console.log(`Initializing volume to 0 for fade-in effect`);
            }
          } catch (error) {
            console.error('Error parsing cue points for fade-in:', error);
          }
        }
        audioElement.volume = initialVolume;
        
        // Load the audio with improved error handling
        try {
          audioElement.load();
          console.log(`Audio element load() called successfully for ${playerId}`);
        } catch (loadError) {
          console.error(`Error loading audio for ${playerId}:`, loadError);
        }
        
        // Register additional error event handler for more detailed error reporting
        const errorHandler = (e: Event) => {
          const error = audioElement.error;
          if (error) {
            console.error(`Audio loading/decoding error: Code ${error.code}, Message: ${error.message}`);
            
            // Show specific error messages based on error code
            let errorMessage = "";
            switch(error.code) {
              case MediaError.MEDIA_ERR_ABORTED:
                errorMessage = "Playback was aborted by the user";
                break;
              case MediaError.MEDIA_ERR_NETWORK:
                errorMessage = "Network error occurred while loading the audio file";
                break;
              case MediaError.MEDIA_ERR_DECODE:
                errorMessage = "Audio file could not be decoded. The file may be corrupted or in an unsupported format";
                break;
              case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                errorMessage = "Audio format is not supported by your browser";
                break;
              default:
                errorMessage = "Unknown error occurred during audio playback";
            }
            
            toast({
              title: 'Audio Error',
              description: `${errorMessage} for "${track.title}"`,
              variant: 'destructive',
            });
          }
        };
        
        audioElement.addEventListener('error', errorHandler);
        
        // Update player state to include the track
        setPlayers(prev => ({
          ...prev,
          [playerId]: {
            ...prev[playerId],
            track,
            isPlaying: false, // Will set to true when play succeeds
            position: 0,
            duration: track.duration || 0
          }
        }));
        
        console.log(`readyState before play: ${audioElement.readyState}`);
        
        // Set a timeout to detect if loading takes too long
        const loadingTimeoutId = setTimeout(() => {
          // If we're still not ready to play after 5 seconds, show an error
          if (audioElement.readyState < 2) { // HAVE_CURRENT_DATA or lower
            console.error(`Track "${track.title}" is taking too long to load. Possible file corruption.`);
            toast({
              title: 'Playback Error',
              description: `"${track.title}" could not be loaded. The file may be corrupted.`,
              variant: 'destructive',
            });
          }
        }, 5000);
        
        // Wait a moment for the audio to be ready
        setTimeout(() => {
          // Play the audio
          const playPromise = audioElement.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
              // Clear the loading timeout since playback started successfully
              clearTimeout(loadingTimeoutId);
              
              console.log(`✓ Playback SUCCESSFULLY started for "${track.title}" on ${playerId}`);
              
              // Update player state
              setPlayers(prev => ({
                ...prev,
                [playerId]: {
                  ...prev[playerId],
                  isPlaying: true
                }
              }));
            }).catch(error => {
              console.error('Error playing audio:', error);
              
              // Try autoplay workaround
              console.log(`Attempting autoplay workaround...`);
              const userInteraction = () => {
                audioElement.play()
                  .then(() => {
                    // Clear the loading timeout since playback started successfully
                    clearTimeout(loadingTimeoutId);
                    
                    console.log(`Autoplay workaround successful for ${playerId}`);
                    
                    setPlayers(prev => ({
                      ...prev,
                      [playerId]: {
                        ...prev[playerId],
                        isPlaying: true
                      }
                    }));
                    
                    // Remove the event listeners
                    document.removeEventListener('click', userInteraction);
                    document.removeEventListener('keydown', userInteraction);
                  })
                  .catch(err => {
                    console.error(`Autoplay workaround failed:`, err);
                    
                    // Check if it's due to a network error or missing file
                    if (audioElement.error && (audioElement.error.code === 2 || audioElement.error.code === 4)) {
                      toast({
                        title: 'Playback Error',
                        description: `Could not play "${track.title}". The file may be corrupted or missing.`,
                        variant: 'destructive',
                      });
                    }
                  });
              };
              
              // Add event listeners for user interaction
              document.addEventListener('click', userInteraction, { once: true });
              document.addEventListener('keydown', userInteraction, { once: true });
            });
          } else {
            console.warn(`Play promise is undefined for ${playerId}`);
          }
        }, 300); // Wait 300ms for audio to load
      }
    } catch (error) {
      console.error('Failed to play track:', error);
      
      toast({
        title: 'Playback Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred during playback',
        variant: 'destructive',
      });
    }
  };

  // Function to pause a track
  const pauseTrack = (playerId: string) => {
    const audioElement = audioElementsRef.current[playerId];
    if (audioElement) {
      audioElement.pause();
      setPlayers(prev => ({
        ...prev,
        [playerId]: {
          ...prev[playerId],
          isPlaying: false
        }
      }));
    }
  };

  // Function to stop a track
  const stopTrack = (playerId: string) => {
    const audioElement = audioElementsRef.current[playerId];
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      setPlayers(prev => ({
        ...prev,
        [playerId]: {
          ...prev[playerId],
          isPlaying: false,
          position: 0
        }
      }));
    }
  };

  // Function to set volume
  const setVolume = (volume: number, playerId: string) => {
    const audioElement = audioElementsRef.current[playerId];
    if (audioElement) {
      audioElement.volume = Math.max(0, Math.min(1, volume));
      setPlayers(prev => ({
        ...prev,
        [playerId]: {
          ...prev[playerId],
          volume
        }
      }));
    }
  };

  // Helper to format time in mm:ss format
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Function to set cue point
  const setCuePoint = async (cuePoint: number, trackId: number) => {
    try {
      // Call API to update the track's cue points
      console.log(`Setting cue point for track ${trackId} to ${cuePoint} seconds`);
      
      // Get existing cue points to preserve fade values if they exist
      let existingCuePoints = {
        start: cuePoint,
        end: null, // Use null to indicate the end of the track
        fadeIn: 0,
        fadeOut: 0
      };
      
      // Find this track in any active players to get existing cue points
      Object.keys(players).forEach(playerId => {
        const player = players[playerId];
        if (player && player.track && player.track.id === trackId && player.track.cuePoints) {
          try {
            const parsedCuePoints = JSON.parse(player.track.cuePoints);
            if (parsedCuePoints) {
              // Keep existing fade values
              existingCuePoints.fadeIn = parsedCuePoints.fadeIn || 0;
              existingCuePoints.fadeOut = parsedCuePoints.fadeOut || 0;
              // Keep existing end point if there is one
              existingCuePoints.end = parsedCuePoints.end || null;
            }
          } catch (error) {
            console.error('Error parsing existing cue points:', error);
          }
        }
      });
      
      // Update with new start cue point
      existingCuePoints.start = cuePoint;
      
      // Update cue points via API
      const response = await apiRequest(
        'PATCH',
        `/api/radio/tracks/${trackId}`,
        {
          cuePoints: JSON.stringify(existingCuePoints)
        }
      );
      
      if (!response.ok) {
        console.error('Failed to update cue points:', response.statusText);
        toast({
          title: "Error Setting Cue Point",
          description: "Failed to save cue point to the track",
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Cue Point Set",
        description: `Cue point set to ${formatTime(cuePoint)}`,
        variant: "default"
      });
      
      // Find and update all players that have this track loaded
      Object.keys(players).forEach(playerId => {
        const player = players[playerId];
        if (player && player.track && player.track.id === trackId) {
          // Update the track in the player state
          setPlayers(prev => ({
            ...prev,
            [playerId]: {
              ...prev[playerId],
              track: {
                ...prev[playerId].track!,
                // Use the existingCuePoints that we calculated earlier to preserve fade settings
                cuePoints: JSON.stringify(existingCuePoints)
              }
            }
          }));
        }
      });
    } catch (error) {
      console.error('Error setting cue point:', error);
      toast({
        title: "Error Setting Cue Point",
        description: "An error occurred while setting the cue point",
        variant: "destructive"
      });
    }
  };
  
  // Function to set a track in a player without playing it
  const setTrack = (track: AudioTrack, playerId: string) => {
    try {
      // Same pre-flight checks as in playTrack
      
      // Check 1: Verify we have a valid track object
      if (!track) {
        console.error(`Cannot set track: Track object is null or undefined`);
        toast({
          title: 'Error',
          description: 'Cannot load: Invalid track data',
          variant: 'destructive',
        });
        return;
      }
      
      console.log(`Setting track "${track.title}" in ${playerId}`, track);
      
      // Check 2: Verify track has a valid file size
      if (track.fileSize !== null && track.fileSize <= 0) {
        console.error(`Cannot load track "${track.title}" - file is empty or corrupt (size: ${track.fileSize} bytes)`);
        toast({
          title: 'Loading Error',
          description: `"${track.title}" appears to be an empty file. Please re-upload this track.`,
          variant: 'destructive',
        });
        return;
      }
      
      // Check 3: Verify track has a valid path
      if (!track.path) {
        console.error(`Track has no path:`, track);
        toast({
          title: 'Loading Error',
          description: `"${track.title}" has no associated audio file path.`,
          variant: 'destructive',
        });
        return;
      }
      
      // Start prebuffering the track for faster playback
      prebufferTrack(track, playerId);
      
      // Create the audio element if it doesn't exist yet
      if (!audioElementsRef.current[playerId]) {
        console.log(`Creating new audio element for ${playerId}`);
        audioElementsRef.current[playerId] = new Audio();
        
        // Add event listeners for debugging
        audioElementsRef.current[playerId].addEventListener('loadstart', () => {
          console.log(`Audio loadstart event for ${playerId}`);
        });
        
        audioElementsRef.current[playerId].addEventListener('canplay', () => {
          console.log(`Audio canplay event for ${playerId} - track is ready to play`);
        });
        
        audioElementsRef.current[playerId].addEventListener('error', (e) => {
          console.error(`Audio element error for ${playerId}:`, e);
          const audioEl = audioElementsRef.current[playerId];
          if (audioEl) {
            console.error(`Error code: ${audioEl.error?.code}, Error message: ${audioEl.error?.message}`);
          }
        });
        
        // Additional event listeners for better tracking
        audioElementsRef.current[playerId].addEventListener('play', () => {
          console.log(`Audio play event triggered for ${playerId}`);
        });
        
        audioElementsRef.current[playerId].addEventListener('playing', () => {
          console.log(`Audio playing event triggered for ${playerId} - playback has started`);
        });
        
        audioElementsRef.current[playerId].addEventListener('pause', () => {
          console.log(`Audio pause event triggered for ${playerId}`);
        });
        
        audioElementsRef.current[playerId].addEventListener('ended', () => {
          console.log(`Audio ended event triggered for ${playerId}`);
          
          // Dispatch a custom trackEnded event for Auto DJ to listen to
          const trackEndedEvent = new CustomEvent('trackEnded', { 
            detail: { 
              playerId,
              track
            }
          });
          document.dispatchEvent(trackEndedEvent);
        });
      }
      
      // Update the player state to include the track
      setPlayers(prev => ({
        ...prev,
        [playerId]: {
          ...prev[playerId],
          track,
          isPlaying: false,
          position: 0,
          duration: track.duration || 0
        }
      }));
      
      // Also update the audio element's source
      const audioElement = audioElementsRef.current[playerId];
      if (audioElement && track.path) {
        // Reset any previous state
        audioElement.pause();
        audioElement.currentTime = 0;
        
        // We already did fileSize check earlier, so we don't need to repeat it here
        
        // FIXED: Simplified path handling to be consistent across environments
        let sourcePath = track.path.trim(); // Trim whitespace
        console.log(`Original track path: "${sourcePath}"`);
        
        // If not an absolute URL (http/https/blob)
        if (!sourcePath.startsWith('http') && !sourcePath.startsWith('blob:')) {
          // Always ensure the path starts with /uploads/ for consistency
          if (!sourcePath.startsWith('/uploads/')) {
            // Remove any leading slashes and 'uploads/' prefix to avoid duplication
            const cleanPath = sourcePath.replace(/^\/?(uploads\/)?/, '');
            sourcePath = `/uploads/${cleanPath}`;
          }
        }
        
        console.log(`Cleaned path: "${sourcePath}"`);
        
        // For all environments, construct full URL with hostname
        const baseUrl = window.location.origin;
        const fullUrl = new URL(sourcePath, baseUrl).href;
        
        console.log(`Final audio source path: "${fullUrl}"`);
        
        // Set preload to auto
        audioElement.preload = 'auto';
        
        // Set volume to make sure it's audible when played
        audioElement.volume = players[playerId]?.volume || 1;
        
        // Set audio source and load it
        audioElement.src = fullUrl;
        console.log(`Set src attribute to: "${audioElement.src}"`);
        
        try {
          audioElement.load(); // Load the track but don't play it
          console.log(`Audio element load() called successfully for ${playerId}`);
        } catch (loadError) {
          console.error(`Error calling load() for ${playerId}:`, loadError);
        }
      } else {
        console.error(`Cannot set track - ${!audioElement ? 'No audio element' : 'No track path'} for ${playerId}`);
      }
    } catch (error) {
      console.error(`Error in setTrack for ${playerId}:`, error);
    }
  };
  
  // Function to update an existing track in a player
  const updateTrack = (track: AudioTrack, playerId: string) => {
    console.log(`Updating track info for ${track.title} in ${playerId}`);
    
    const currentPlayerState = players[playerId];
    const isCurrentlyPlaying = currentPlayerState?.isPlaying || false;
    
    // Only update the track data, keep playing status
    setPlayers(prev => {
      // Don't change anything if no track is currently set
      if (!prev[playerId]?.track) {
        return prev;
      }
      
      return {
        ...prev,
        [playerId]: {
          ...prev[playerId],
          track: {
            ...track,
            // If same track ID, keep some state like position
            position: prev[playerId].track?.id === track.id 
              ? prev[playerId].position 
              : 0
          }
        }
      };
    });
    
    // If the player is currently playing, don't interrupt it
    // This is for when we're just updating metadata
    if (!isCurrentlyPlaying) {
      const audioElement = audioElementsRef.current[playerId];
      if (audioElement && track.path) {
        const previousTime = audioElement.currentTime;
        
        // FIXED: Simplified path handling to be consistent across environments
        let sourcePath = track.path.trim(); // Trim whitespace
        console.log(`Original track path: "${sourcePath}"`);
        
        // If not an absolute URL (http/https/blob)
        if (!sourcePath.startsWith('http') && !sourcePath.startsWith('blob:')) {
          // Always ensure the path starts with /uploads/ for consistency
          if (!sourcePath.startsWith('/uploads/')) {
            // Remove any leading slashes and 'uploads/' prefix to avoid duplication
            const cleanPath = sourcePath.replace(/^\/?(uploads\/)?/, '');
            sourcePath = `/uploads/${cleanPath}`;
          }
        }
        
        console.log(`Cleaned path: "${sourcePath}"`);
        
        // For all environments, construct full URL with hostname
        const baseUrl = window.location.origin;
        const fullUrl = new URL(sourcePath, baseUrl).href;
        
        console.log(`Updating audio source to: "${fullUrl}"`);
        audioElement.src = fullUrl;
        audioElement.load();
        
        // Try to restore position if it's the same track (by ID)
        if (currentPlayerState?.track?.id === track.id && previousTime > 0) {
          audioElement.currentTime = previousTime;
        }
      }
    }
  };

  // Helper functions to get state for a specific player
  const isPlaying = (playerId: string) => players[playerId]?.isPlaying || false;
  const currentTrack = (playerId: string) => players[playerId]?.track || null;
  const currentPosition = (playerId: string) => players[playerId]?.position || 0;
  const volume = (playerId: string) => players[playerId]?.volume || 1;
  const duration = (playerId: string) => players[playerId]?.duration || 0;

  // Function to play the currently loaded track in a player
  const play = (playerId: string) => {
    console.log(`Attempting to play currently loaded track in ${playerId}`);
    
    try {
      const audioElement = audioElementsRef.current[playerId];
      const currentTrackData = players[playerId]?.track;
      
      if (!audioElement) {
        console.error(`No audio element found for ${playerId}`);
        return;
      }
      
      if (!currentTrackData) {
        console.error(`No track loaded in ${playerId}`);
        toast({
          title: "Playback Error",
          description: "No track is loaded in the player. Please select a track first.",
          variant: "destructive",
        });
        return;
      }
      
      // Before playing, check for cue points and ensure they're applied
      if (currentTrackData.cuePoints) {
        try {
          const cuePointsData = JSON.parse(currentTrackData.cuePoints);
          if (cuePointsData && cuePointsData.start !== undefined && cuePointsData.start !== null) {
            console.log(`Setting initial position to cue point start: ${cuePointsData.start}s for playback`);
            audioElement.currentTime = cuePointsData.start;
          }
        } catch (error) {
          console.error('Error parsing cue points during play:', error);
        }
      }
      
      // Check for zero-byte or invalid files
      if (currentTrackData.fileSize !== null && currentTrackData.fileSize <= 0) {
        console.error(`Cannot play track "${currentTrackData.title}" - file is empty or corrupt (size: ${currentTrackData.fileSize} bytes)`);
        toast({
          title: `Cannot play track`,
          description: `"${currentTrackData.title}" appears to be an empty or corrupt file. Please check the audio file.`,
          variant: "destructive",
        });
        return;
      }
      
      console.log(`Playing track "${currentTrackData.title}" from ${playerId}`);
      
      // Double-check that the audio source is set correctly
      if (!audioElement.src || audioElement.src === '') {
        console.log(`Audio element source is empty, setting it now...`);
        
        // FIXED: Simplified path handling to be consistent across environments
        let sourcePath = currentTrackData.path.trim(); // Trim whitespace
        console.log(`Original track path before play: "${sourcePath}"`);
        
        // If not an absolute URL (http/https/blob)
        if (!sourcePath.startsWith('http') && !sourcePath.startsWith('blob:')) {
          // Always ensure the path starts with /uploads/ for consistency
          if (!sourcePath.startsWith('/uploads/')) {
            // Remove any leading slashes and 'uploads/' prefix to avoid duplication
            const cleanPath = sourcePath.replace(/^\/?(uploads\/)?/, '');
            sourcePath = `/uploads/${cleanPath}`;
          }
        }
        
        console.log(`Cleaned path: "${sourcePath}"`);
        
        // For all environments, construct full URL with hostname
        const baseUrl = window.location.origin;
        const fullUrl = new URL(sourcePath, baseUrl).href;
        
        console.log(`Setting audio source path before play: "${fullUrl}"`);
        audioElement.src = fullUrl;
        audioElement.load();
      }
      
      // Set volume to make sure it's audible
      if (audioElement.volume === 0) {
        audioElement.volume = 1;
      }
      
      // Force preload
      audioElement.preload = 'auto';
      
      // The cue points have already been set above before playing, so we only need to apply fade-in effect here
      if (currentTrackData.cuePoints) {
        try {
          const cuePointsData = JSON.parse(currentTrackData.cuePoints);
          
          // Initialize volume for fade-in effect if needed
          if (cuePointsData && cuePointsData.fadeIn && cuePointsData.fadeIn > 0) {
            console.log(`Initializing volume to 0 for fade-in effect (duration: ${cuePointsData.fadeIn}s)`);
            const targetVolume = players[playerId]?.volume || 1;
            // Start with 0 volume, will be increased gradually in timeupdate event
            audioElement.volume = 0;
            
            // Store the original volume to restore if needed
            setPlayers(prev => ({
              ...prev,
              [playerId]: {
                ...prev[playerId],
                originalVolume: targetVolume
              }
            }));
          }
        } catch (error) {
          console.error('Error parsing cue points during play:', error);
        }
      }
      
      // Check readyState
      console.log(`Audio element readyState before play: ${audioElement.readyState}`);
      
      // Attempt to play the audio
      const playPromise = audioElement.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log(`SUCCESSFULLY started playback in ${playerId} 🎵`);
          
          // Update player state to reflect playing status
          setPlayers(prev => ({
            ...prev,
            [playerId]: {
              ...prev[playerId],
              isPlaying: true
            }
          }));
        }).catch(error => {
          console.error(`Error playing audio in ${playerId}:`, error);
          
          // Try autoplay workaround
          console.log(`Attempting autoplay workaround...`);
          const userInteraction = () => {
            audioElement.play()
              .then(() => {
                console.log(`Autoplay workaround successful for ${playerId}`);
                
                setPlayers(prev => ({
                  ...prev,
                  [playerId]: {
                    ...prev[playerId],
                    isPlaying: true
                  }
                }));
                
                // Remove the event listeners
                document.removeEventListener('click', userInteraction);
                document.removeEventListener('keydown', userInteraction);
              })
              .catch(err => {
                console.error(`Autoplay workaround failed:`, err);
              });
          };
          
          // Add event listeners for user interaction
          document.addEventListener('click', userInteraction, { once: true });
          document.addEventListener('keydown', userInteraction, { once: true });
        });
      } else {
        console.warn(`Play promise is undefined for ${playerId}`);
      }
    } catch (error) {
      console.error(`Error in play() for ${playerId}:`, error);
    }
  };
  
  // Load a track to player (same as setTrack but more explicit naming)
  const loadTrack = (track: AudioTrack, playerId: string) => {
    console.log(`Loading track to ${playerId} without auto-play:`, track.title);
    
    // Validate track first to avoid loading invalid or corrupted tracks
    if (!track.path) {
      toast({
        title: "Load Failed",
        description: `Track "${track.title}" has no valid path and cannot be loaded.`,
        variant: "destructive",
      });
      return;
    }
    
    // Check for WebSocket connection as it's required for proper playback
    const hasActiveWebsocket = document.querySelector('.websocket-connected') !== null;
    if (!hasActiveWebsocket) {
      console.warn("WebSocket connection is not active. Playback may not work properly.");
    }
    
    const audioElement = audioElementsRef.current[playerId];
    if (!audioElement) {
      console.error(`No audio element found for ${playerId}`);
      return;
    }
    
    try {
      // Reset state
      audioElement.pause();
      
      // Apply cue points if they exist - set initial position to the cue in point
      if (track.cuePoints) {
        try {
          const cuePointsData = JSON.parse(track.cuePoints);
          if (cuePointsData && cuePointsData.start !== undefined && cuePointsData.start !== null) {
            console.log(`Setting initial load position to cue point: ${cuePointsData.start}s`);
            audioElement.currentTime = cuePointsData.start;
          } else {
            audioElement.currentTime = 0;
          }
        } catch (error) {
          console.error('Error parsing cue points during load:', error);
          audioElement.currentTime = 0;
        }
      } else {
        audioElement.currentTime = 0;
      }
      
      // Process the path to ensure it's valid
      let sourcePath = track.path.trim();
      
      // If path doesn't start with http or blob, assume it's a local file
      if (!sourcePath.startsWith('http') && !sourcePath.startsWith('blob:')) {
        if (!sourcePath.startsWith('/uploads/')) {
          // Clean any existing prefixes and ensure proper path format
          const cleanPath = sourcePath.replace(/^\/?(uploads\/)?/, '');
          sourcePath = `/uploads/${cleanPath}`;
        }
      }
      
      // Set source with full URL
      const baseUrl = window.location.origin;
      const fullUrl = new URL(sourcePath, baseUrl).href;
      
      // Add an error handler to detect file loading issues
      const errorHandler = () => {
        console.error(`Error loading audio file: ${fullUrl}`);
        toast({
          title: "Load Failed",
          description: `Could not load "${track.title}". The file may be corrupted or missing.`,
          variant: "destructive",
        });
        
        // Remove error handler after it fires
        audioElement.removeEventListener('error', errorHandler);
      };
      
      // Clear any existing error handlers and add new one
      audioElement.removeEventListener('error', errorHandler);
      audioElement.addEventListener('error', errorHandler);
      
      // Set the source
      audioElement.src = fullUrl;
      
      // Update state
      setPlayers(prev => ({
        ...prev,
        [playerId]: {
          ...prev[playerId],
          track,
          isPlaying: false,
          position: 0,
          duration: track.duration || 0
        }
      }));
      
      // Force load of audio
      audioElement.load();
      
      toast({
        title: "Track Loaded",
        description: `"${track.title}" loaded into Player ${playerId.replace('player', '')}`
      });
    } catch (error) {
      console.error('Failed to load track:', error);
      toast({
        title: "Load Failed",
        description: `Error loading "${track.title}": ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };
  
  // Unload/eject track from player
  const unloadTrack = (playerId: string) => {
    console.log(`Ejecting track from ${playerId}`);
    
    const audioElement = audioElementsRef.current[playerId];
    if (!audioElement) {
      console.error(`No audio element found for ${playerId}`);
      return;
    }
    
    // Stop any playback
    audioElement.pause();
    audioElement.currentTime = 0;
    
    // Clear source
    audioElement.src = '';
    
    // Update state
    setPlayers(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        track: null,
        isPlaying: false,
        position: 0,
        duration: 0
      }
    }));
    
    toast({
      title: "Track Ejected",
      description: `Track removed from Player ${playerId.replace('player', '')}`
    });
  };

  // Helper functions for context values (removed to prevent redeclaration)

  // Function to get the audio element for a player
  const getAudioElement = (playerId: string): HTMLAudioElement | null => {
    return audioElementsRef.current[playerId] || null;
  };
  
  // Seek to a specific position in the track
  const seekTo = (position: number, playerId: string) => {
    console.log(`Seeking in ${playerId} to position: ${position}s`);
    const audioElement = audioElementsRef.current[playerId];
    if (!audioElement) {
      console.error(`Cannot seek: No audio element found for ${playerId}`);
      return;
    }
    
    // Get the track and validate
    const currentTrack = players[playerId]?.track;
    if (!currentTrack) {
      console.error(`Cannot seek: No track loaded in ${playerId}`);
      return;
    }
    
    // Check bounds
    const duration = audioElement.duration || players[playerId]?.duration || 0;
    
    // Ensure position is within valid range
    const clampedPosition = Math.max(0, Math.min(position, duration));
    
    try {
      // Apply the seek
      audioElement.currentTime = clampedPosition;
      
      // Update our state
      setPlayers(prev => ({
        ...prev,
        [playerId]: {
          ...prev[playerId],
          position: clampedPosition
        }
      }));
      
      console.log(`Seek successful. Position set to ${clampedPosition}s`);
    } catch (error) {
      console.error(`Error seeking in ${playerId}:`, error);
    }
  };

  return (
    <AudioPlayerContext.Provider value={{
      playTrack,
      pauseTrack,
      stopTrack,
      setVolume,
      setCuePoint,
      getOutputDeviceForPlayer,
      setTrack,
      updateTrack,
      play,
      loadTrack,
      unloadTrack,
      getAudioElement,
      seekTo,
      prebufferTrack,
      prebufferNextTrack,
      isPlaying: (playerId: string) => players[playerId]?.isPlaying || false,
      currentTrack: (playerId: string) => players[playerId]?.track || null,
      currentPosition: (playerId: string) => players[playerId]?.position || 0,
      volume: (playerId: string) => players[playerId]?.volume || 1,
      duration: (playerId: string) => players[playerId]?.duration || 0
    }}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

// Custom hook to use the audio player context
export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
}
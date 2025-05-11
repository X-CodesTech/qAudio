import { useEffect, useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useTranslation } from 'react-i18next';
import { Clock, Pause, Play, RotateCcw } from 'lucide-react';
import { useCountdown } from '@/contexts/CountdownContext';
import { useVoIP } from '@/contexts/VoIPContext';
import { useSocketIO, updateTimerState, TimerData } from '@/contexts/SocketIOContext';

type CountdownTimerProps = {
  studio: 'A' | 'B' | 'C' | 'D';
  variant: 'producer' | 'talent';
};

export default function DirectCountdownTimer({ studio, variant }: CountdownTimerProps) {
  const { t } = useTranslation();
  const {
    studioAState,
    studioBState,
    studioCState,
    studioDState,
    startStudioA,
    startStudioB,
    startStudioC,
    startStudioD,
    pauseStudioA,
    pauseStudioB,
    pauseStudioC,
    pauseStudioD,
    resetStudioA,
    resetStudioB,
    resetStudioC,
    resetStudioD,
    setStudioATime,
    setStudioBTime,
    setStudioCTime,
    setStudioDTime
  } = useCountdown();
  
  // For the countdown setup dialog
  const [minutes, setMinutes] = useState(5);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Get the appropriate state based on studio
  const getStateForStudio = () => {
    switch(studio) {
      case 'A': return studioAState;
      case 'B': return studioBState;
      case 'C': return studioCState;
      case 'D': return studioDState;
      default: return studioAState; // fallback to A
    }
  };
  
  const state = getStateForStudio();
  
  // Destructure state for easier use
  const { timeRemaining, isRunning, isDangerZone } = state;
  
  console.log(`DirectCountdownTimer - Studio ${studio}, variant: ${variant}, timeRemaining: ${timeRemaining}, isRunning: ${isRunning}`);

  // Format seconds to mm:ss (digital clock style with seconds) 
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Get Socket.io connection
  const { socket, isConnected } = useSocketIO();
  
  // Producer controls - IMPROVED RELIABILITY VERSION
  const startCountdown = useCallback(() => {
    console.log(`[DEBUG] startCountdown called - Studio ${studio}, timeRemaining: ${timeRemaining}`);
    
    if (timeRemaining <= 0) {
      console.log(`[DEBUG] Not starting countdown - timeRemaining is ${timeRemaining}`);
      return;
    }
    
    console.log(`Starting countdown for Studio ${studio}`);
    
    // Create timer data for updates - SAME FOR BOTH STUDIOS BUT WITH STUDIO ID
    const timerData: TimerData = {
      studio: studio,
      minutes: Math.floor(timeRemaining / 60),
      seconds: timeRemaining % 60,
      isRunning: true,
      isDangerZone: timeRemaining <= 120,
      lastUpdate: new Date().toISOString()
    };
    console.log(`[DEBUG] Created timerData:`, timerData);
    
    // MOST RELIABLE APPROACH: First send HTTP update which guarantees server-side state
    console.log('[DEBUG] Sending HTTP timer update first');
    
    fetch('/api/studio/timer-update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(timerData)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      console.log(`[DEBUG] HTTP timer update successful`);
      
      // After confirming HTTP success, update local state to match server
      switch(studio) {
        case 'A':
          console.log(`[DEBUG] Calling startStudioA() after HTTP success`);
          startStudioA();
          break;
        case 'B':
          console.log(`[DEBUG] Calling startStudioB() after HTTP success`);
          startStudioB();
          break;
        case 'C':
          console.log(`[DEBUG] Calling startStudioC() after HTTP success`);
          startStudioC();
          break;
        case 'D':
          console.log(`[DEBUG] Calling startStudioD() after HTTP success`);
          startStudioD();
          break;
      }
      
      // SECONDARY UPDATE: Update via Socket.io for live clients
      if (isConnected) {
        console.log('[DEBUG] Updating timer via Socket.io');
        updateTimerState(socket, timerData);
      }
    })
    .catch(err => {
      console.error('[DEBUG] Failed to update timer via HTTP:', err);
      
      // FALLBACK: If HTTP fails, try to update locally anyway
      switch(studio) {
        case 'A':
          console.log(`[DEBUG] FALLBACK: Calling startStudioA() after HTTP failure`);
          startStudioA();
          break;
        case 'B':
          console.log(`[DEBUG] FALLBACK: Calling startStudioB() after HTTP failure`);
          startStudioB();
          break;
        case 'C':
          console.log(`[DEBUG] FALLBACK: Calling startStudioC() after HTTP failure`);
          startStudioC();
          break;
        case 'D':
          console.log(`[DEBUG] FALLBACK: Calling startStudioD() after HTTP failure`);
          startStudioD();
          break;
      }
      
      // Still try Socket.io as last resort
      if (isConnected) {
        console.log('[DEBUG] FALLBACK: Updating timer via Socket.io after HTTP failure');
        updateTimerState(socket, timerData);
      }
    });
    
  }, [studio, timeRemaining, startStudioA, startStudioB, startStudioC, startStudioD, socket, isConnected]);

  const pauseCountdown = useCallback(() => {
    console.log(`[DEBUG] pauseCountdown called - Studio ${studio}, timeRemaining: ${timeRemaining}`);
    
    // Create timer data for updates - SAME FOR BOTH STUDIOS BUT WITH STUDIO ID
    const timerData: TimerData = {
      studio: studio,
      minutes: Math.floor(timeRemaining / 60),
      seconds: timeRemaining % 60,
      isRunning: false,
      isDangerZone: timeRemaining <= 120,
      lastUpdate: new Date().toISOString()
    };
    console.log(`[DEBUG] Created timerData for pause:`, timerData);
    
    // MOST RELIABLE APPROACH: First send HTTP update which guarantees server-side state
    console.log('[DEBUG] Sending HTTP timer pause update first');
    
    fetch('/api/studio/timer-update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(timerData)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      console.log(`[DEBUG] HTTP timer pause update successful`);
      
      // After confirming HTTP success, update local state to match server
      switch(studio) {
        case 'A':
          console.log(`[DEBUG] Calling pauseStudioA() after HTTP success`);
          pauseStudioA();
          break;
        case 'B':
          console.log(`[DEBUG] Calling pauseStudioB() after HTTP success`);
          pauseStudioB();
          break;
        case 'C':
          console.log(`[DEBUG] Calling pauseStudioC() after HTTP success`);
          pauseStudioC();
          break;
        case 'D':
          console.log(`[DEBUG] Calling pauseStudioD() after HTTP success`);
          pauseStudioD();
          break;
      }
      
      // SECONDARY UPDATE: Update via Socket.io for live clients
      if (isConnected) {
        console.log('[DEBUG] Updating timer via Socket.io (pause)');
        updateTimerState(socket, timerData);
      }
    })
    .catch(err => {
      console.error('[DEBUG] Failed to update timer via HTTP (pause):', err);
      
      // FALLBACK: If HTTP fails, try to update locally anyway
      switch(studio) {
        case 'A':
          console.log(`[DEBUG] FALLBACK: Calling pauseStudioA() after HTTP failure`);
          pauseStudioA();
          break;
        case 'B':
          console.log(`[DEBUG] FALLBACK: Calling pauseStudioB() after HTTP failure`);
          pauseStudioB();
          break;
        case 'C':
          console.log(`[DEBUG] FALLBACK: Calling pauseStudioC() after HTTP failure`);
          pauseStudioC();
          break;
        case 'D':
          console.log(`[DEBUG] FALLBACK: Calling pauseStudioD() after HTTP failure`);
          pauseStudioD();
          break;
      }
      
      // Still try Socket.io as last resort
      if (isConnected) {
        console.log('[DEBUG] FALLBACK: Updating timer via Socket.io after HTTP failure (pause)');
        updateTimerState(socket, timerData);
      }
    });
  }, [studio, timeRemaining, pauseStudioA, pauseStudioB, pauseStudioC, pauseStudioD, socket, isConnected]);

  const resetCountdown = useCallback(() => {
    console.log(`[DEBUG] resetCountdown called - Studio ${studio}`);
    
    // Create timer data for reset - always 5 minutes, not running
    const timerData: TimerData = {
      studio: studio,
      minutes: 5,
      seconds: 0,
      isRunning: false,
      isDangerZone: false,
      lastUpdate: new Date().toISOString()
    };
    console.log(`[DEBUG] Created timerData for reset:`, timerData);
    
    // MOST RELIABLE APPROACH: First send HTTP update which guarantees server-side state
    console.log('[DEBUG] Sending HTTP timer reset update first');
    
    fetch('/api/studio/timer-update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(timerData)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      console.log(`[DEBUG] HTTP timer reset update successful`);
      
      // After confirming HTTP success, update local state to match server
      switch(studio) {
        case 'A':
          console.log(`[DEBUG] Calling resetStudioA() after HTTP success`);
          resetStudioA();
          break;
        case 'B':
          console.log(`[DEBUG] Calling resetStudioB() after HTTP success`);
          resetStudioB();
          break;
        case 'C':
          console.log(`[DEBUG] Calling resetStudioC() after HTTP success`);
          resetStudioC();
          break;
        case 'D':
          console.log(`[DEBUG] Calling resetStudioD() after HTTP success`);
          resetStudioD();
          break;
      }
      
      // SECONDARY UPDATE: Update via Socket.io for live clients
      if (isConnected) {
        console.log('[DEBUG] Updating timer via Socket.io (reset)');
        updateTimerState(socket, timerData);
      }
    })
    .catch(err => {
      console.error('[DEBUG] Failed to update timer via HTTP (reset):', err);
      
      // FALLBACK: If HTTP fails, try to update locally anyway
      switch(studio) {
        case 'A':
          console.log(`[DEBUG] FALLBACK: Calling resetStudioA() after HTTP failure`);
          resetStudioA();
          break;
        case 'B':
          console.log(`[DEBUG] FALLBACK: Calling resetStudioB() after HTTP failure`);
          resetStudioB();
          break;
        case 'C':
          console.log(`[DEBUG] FALLBACK: Calling resetStudioC() after HTTP failure`);
          resetStudioC();
          break;
        case 'D':
          console.log(`[DEBUG] FALLBACK: Calling resetStudioD() after HTTP failure`);
          resetStudioD();
          break;
      }
      
      // Still try Socket.io as last resort
      if (isConnected) {
        console.log('[DEBUG] FALLBACK: Updating timer via Socket.io after HTTP failure (reset)');
        updateTimerState(socket, timerData);
      }
    });
  }, [studio, resetStudioA, resetStudioB, resetStudioC, resetStudioD, socket, isConnected]);

  const handleSetCountdown = useCallback(() => {
    console.log(`[DEBUG] handleSetCountdown called - Studio ${studio}, minutes: ${minutes}`);
    
    // Create timer data for setting new time
    const timerData: TimerData = {
      studio: studio,
      minutes: minutes,
      seconds: 0,
      isRunning: false,
      isDangerZone: minutes <= 2, // 2 minutes or less is danger zone
      lastUpdate: new Date().toISOString()
    };
    console.log(`[DEBUG] Created timerData for time setting:`, timerData);
    
    // MOST RELIABLE APPROACH: First send HTTP update which guarantees server-side state
    console.log('[DEBUG] Sending HTTP timer set update first');
    
    fetch('/api/studio/timer-update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(timerData)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      console.log(`[DEBUG] HTTP timer set update successful`);
      
      // After confirming HTTP success, update local state to match server
      switch(studio) {
        case 'A':
          console.log(`[DEBUG] Calling setStudioATime() after HTTP success`);
          setStudioATime(minutes);
          break;
        case 'B':
          console.log(`[DEBUG] Calling setStudioBTime() after HTTP success`);
          setStudioBTime(minutes);
          break;
        case 'C':
          console.log(`[DEBUG] Calling setStudioCTime() after HTTP success`);
          setStudioCTime(minutes);
          break;
        case 'D':
          console.log(`[DEBUG] Calling setStudioDTime() after HTTP success`);
          setStudioDTime(minutes);
          break;
      }
      
      // SECONDARY UPDATE: Update via Socket.io for live clients
      if (isConnected) {
        console.log('[DEBUG] Updating timer via Socket.io (set time)');
        updateTimerState(socket, timerData);
      }
    })
    .catch(err => {
      console.error('[DEBUG] Failed to update timer via HTTP (set time):', err);
      
      // FALLBACK: If HTTP fails, try to update locally anyway
      switch(studio) {
        case 'A':
          console.log(`[DEBUG] FALLBACK: Calling setStudioATime() after HTTP failure`);
          setStudioATime(minutes);
          break;
        case 'B':
          console.log(`[DEBUG] FALLBACK: Calling setStudioBTime() after HTTP failure`);
          setStudioBTime(minutes);
          break;
        case 'C':
          console.log(`[DEBUG] FALLBACK: Calling setStudioCTime() after HTTP failure`);
          setStudioCTime(minutes);
          break;
        case 'D':
          console.log(`[DEBUG] FALLBACK: Calling setStudioDTime() after HTTP failure`);
          setStudioDTime(minutes);
          break;
      }
      
      // Still try Socket.io as last resort
      if (isConnected) {
        console.log('[DEBUG] FALLBACK: Updating timer via Socket.io after HTTP failure (set time)');
        updateTimerState(socket, timerData);
      }
    });
    
    // Close the dialog
    setIsDialogOpen(false);
  }, [studio, minutes, setStudioATime, setStudioBTime, setStudioCTime, setStudioDTime, socket, isConnected]);

  // Producer view (with controls)
  if (variant === 'producer') {
    return (
      <div className="flex items-center justify-between h-full w-full">
        {/* Timer display - Digital clock style with #fe0303 red color - ENLARGED */}
        <div className={`rounded-md w-full h-full shadow-lg border p-1 flex items-center justify-between ${
          isDangerZone ? 'animate-container-pulse border-red-800' : 'border-zinc-700'
        }`} style={{ background: 'transparent' }}>
          <span 
            className={`text-4xl font-mono font-extrabold text-center tracking-wider ml-2
              ${isDangerZone ? 'animate-blink-fast text-[#ff0000] animate-timer-glow' : 'text-[#fe0303]'}`}
            style={isDangerZone ? { 
              textShadow: '0 0 15px rgba(255, 0, 0, 1), 0 0 8px rgba(255, 0, 0, 0.8), 0 0 4px rgba(255, 0, 0, 0.6)',
              filter: 'drop-shadow(0 0 10px rgba(255, 0, 0, 1))',
              WebkitTextStroke: '1px rgba(255, 80, 80, 0.8)'
            } : {}}
          >
            {formatTime(timeRemaining)}
          </span>
          
          {/* Control buttons beside the time */}
          <div className="flex items-center justify-end gap-2 mr-2">
            {isRunning ? (
              <Button 
                variant="outline" 
                size="icon" 
                className="h-7 w-7 p-0.5 border-white bg-black hover:bg-zinc-800"
                onClick={pauseCountdown}
              >
                <Pause className="h-5 w-5 text-white" />
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="icon" 
                className="h-7 w-7 p-0.5 border-white bg-black hover:bg-zinc-800"
                onClick={(e) => {
                  console.log('[DEBUG] Play button clicked', { studio, timeRemaining });
                  // Create a timestamp for tracking
                  const clickTimestamp = Date.now();
                  console.log(`[DEBUG] Click timestamp: ${clickTimestamp}`);
                  // Call the actual function
                  startCountdown();
                  // Log after function call completed
                  console.log(`[DEBUG] startCountdown function returned after ${Date.now() - clickTimestamp}ms`);
                }}
                disabled={timeRemaining === 0}
              >
                <Play className="h-5 w-5 text-white" />
              </Button>
            )}
            <Button 
              variant="outline" 
              size="icon" 
              className="h-7 w-7 p-0.5 border-white bg-black hover:bg-zinc-800"
              onClick={resetCountdown}
            >
              <RotateCcw className="h-5 w-5 text-white" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-7 w-7 p-0.5 border-white bg-black hover:bg-zinc-800"
              onClick={() => setIsDialogOpen(true)}
            >
              <Clock className="h-5 w-5 text-white" />
            </Button>
          </div>
        </div>

        {/* Dialog for setting the countdown time */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-zinc-900 text-white border-zinc-700">
            <DialogHeader>
              <DialogTitle>{t('producer.setCountdown')}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="minutes" className="text-right">
                  {t('common.minutes')}
                </label>
                <Input
                  id="minutes"
                  type="number"
                  value={minutes}
                  onChange={(e) => setMinutes(Number(e.target.value))}
                  className="col-span-3 bg-zinc-800 border-zinc-700"
                  min={1}
                  max={60}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="submit" 
                onClick={handleSetCountdown}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {t('common.set')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Add reconnection monitoring for talent view
  const { websocket } = useVoIP();
  
  // Track if we've received any timer updates
  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState<number>(Date.now());
  
  // Time threshold for detecting stalled timer (5 seconds without updates when running)
  const stalledThreshold = 5000;
  
  // Listen for custom countdown update events from TalentView WebSocket handler
  useEffect(() => {
    if (variant !== 'talent') return; // Only apply to talent view
    
    const handleCountdownUpdate = (event: CustomEvent) => {
      const data = event.detail;
      
      // Check if this update is for our studio
      if (data.studio === studio) {
        console.log(`[DirectCountdownTimer] Received countdown update from WebSocket for Studio ${studio}: ${data.minutes}:${data.seconds || 0}, running: ${data.isRunning}`);
        
        // Calculate total seconds
        const totalSeconds = (data.minutes * 60) + (data.seconds || 0);
        
        // Update our timestamp to show we got an update
        setLastUpdateTimestamp(Date.now());
      } else {
        console.log(`[DirectCountdownTimer] Ignoring countdown update for Studio ${data.studio} (we're showing Studio ${studio})`);
      }
    };
    
    // Add event listener for countdown updates
    window.addEventListener('countdown_update', handleCountdownUpdate as EventListener);
    
    // Clean up event listener
    return () => {
      window.removeEventListener('countdown_update', handleCountdownUpdate as EventListener);
    };
  }, [studio, variant]);
  
  // Monitor for timer updates and refresh lastUpdateTimestamp when we get them
  useEffect(() => {
    // Update timestamp whenever we get a new timeRemaining value from context
    setLastUpdateTimestamp(Date.now());
  }, [timeRemaining, isRunning]);
  
  // Add HTTP polling for timer state in talent view
  useEffect(() => {
    // Only apply to talent view
    if (variant !== 'talent') return;
    
    // Poll for timer updates every 2 seconds as a WebSocket fallback
    const pollInterval = setInterval(() => {
      fetch(`/api/studio/timer-status/${studio}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          console.log(`HTTP Poll: Timer status for Studio ${studio}:`, data);
          
          // Send update to countdown context via our updateStudioTime functions
          const totalSeconds = (data.minutes * 60) + (data.seconds || 0);
          
          // Only update if the timer state is different from current state
          const currentSeconds = timeRemaining;
          const stateChanged = data.isRunning !== isRunning || Math.abs(totalSeconds - currentSeconds) > 1;
          
          if (stateChanged) {
            console.log(`HTTP Poll: Updating timer state - isRunning: ${data.isRunning}, time: ${data.minutes}:${data.seconds}`);
            
            // Update local state based on studio
            switch(studio) {
              case 'A':
                if (data.isRunning && !isRunning) {
                  // Start timer if it should be running
                  startStudioA();
                } else if (!data.isRunning && isRunning) {
                  // Pause timer if it should be paused
                  pauseStudioA();
                }
                
                // Update time if different
                if (Math.abs(totalSeconds - currentSeconds) > 1) {
                  // Convert to minutes only (the function only accepts minutes)
                  const totalMinutes = Math.ceil((data.minutes * 60 + (data.seconds || 0)) / 60);
                  setStudioATime(totalMinutes);
                }
                break;
              
              case 'B':
                if (data.isRunning && !isRunning) {
                  // Start timer if it should be running
                  startStudioB();
                } else if (!data.isRunning && isRunning) {
                  // Pause timer if it should be paused
                  pauseStudioB();
                }
                
                // Update time if different
                if (Math.abs(totalSeconds - currentSeconds) > 1) {
                  // Convert to minutes only (the function only accepts minutes)
                  const totalMinutes = Math.ceil((data.minutes * 60 + (data.seconds || 0)) / 60);
                  setStudioBTime(totalMinutes);
                }
                break;
              
              case 'C':
                if (data.isRunning && !isRunning) {
                  // Start timer if it should be running
                  startStudioC();
                } else if (!data.isRunning && isRunning) {
                  // Pause timer if it should be paused
                  pauseStudioC();
                }
                
                // Update time if different
                if (Math.abs(totalSeconds - currentSeconds) > 1) {
                  // Convert to minutes only (the function only accepts minutes)
                  const totalMinutes = Math.ceil((data.minutes * 60 + (data.seconds || 0)) / 60);
                  setStudioCTime(totalMinutes);
                }
                break;
              
              case 'D':
                if (data.isRunning && !isRunning) {
                  // Start timer if it should be running
                  startStudioD();
                } else if (!data.isRunning && isRunning) {
                  // Pause timer if it should be paused
                  pauseStudioD();
                }
                
                // Update time if different
                if (Math.abs(totalSeconds - currentSeconds) > 1) {
                  // Convert to minutes only (the function only accepts minutes)
                  const totalMinutes = Math.ceil((data.minutes * 60 + (data.seconds || 0)) / 60);
                  setStudioDTime(totalMinutes);
                }
                break;
            }
          }
          
          // Update timestamp
          setLastUpdateTimestamp(Date.now());
        })
        .catch(error => {
          console.error('Error polling timer status:', error);
        });
    }, 2000); // Poll every 2 seconds
    
    return () => clearInterval(pollInterval);
  }, [variant, studio, timeRemaining, isRunning, 
    startStudioA, startStudioB, startStudioC, startStudioD, 
    pauseStudioA, pauseStudioB, pauseStudioC, pauseStudioD, 
    setStudioATime, setStudioBTime, setStudioCTime, setStudioDTime
  ]);

  // Check for stalled timer and trigger reconnection if needed
  useEffect(() => {
    // Only apply to talent view and only when timer is running
    if (variant !== 'talent' || !isRunning) return;
    
    const checkInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateTimestamp;
      
      // If timer is running but we haven't received updates in too long
      if (timeSinceLastUpdate > stalledThreshold) {
        console.log(`[DirectCountdownTimer] Timer appears stalled (${timeSinceLastUpdate}ms without updates). Requesting fresh state.`);
        
        // Request updated timer state directly using websocket
        if (websocket && websocket.readyState === WebSocket.OPEN) {
          try {
            console.log(`[DirectCountdownTimer] Requesting current timer state for Studio ${studio}`);
            websocket.send(JSON.stringify({
              type: 'countdown_state_request',
              studio: studio,
              timestamp: new Date().toISOString(),
              requestId: `stalled-${Date.now()}`
            }));
            
            // Reset the timestamp to avoid spamming requests
            setLastUpdateTimestamp(now);
          } catch (err) {
            console.error('[DirectCountdownTimer] Error requesting timer state:', err);
          }
        } else {
          // If websocket not available, try HTTP fallback
          console.log('[DirectCountdownTimer] WebSocket not available, using HTTP fallback');
          
          fetch(`/api/studio/timer-status/${studio}`)
            .then(response => response.json())
            .then(data => {
              console.log(`[DirectCountdownTimer] Got timer state via HTTP:`, data);
              
              // Use the same logic as in our polling effect
              const totalSeconds = (data.minutes * 60) + (data.seconds || 0);
              
              // Update local state based on studio
              switch(studio) {
                case 'A':
                  if (data.isRunning && !isRunning) {
                    startStudioA();
                  } else if (!data.isRunning && isRunning) {
                    pauseStudioA();
                  }
                  
                  // Update time - convert to minutes only (function accepts only minutes)
                  const totalMinutesA = Math.ceil((data.minutes * 60 + (data.seconds || 0)) / 60);
                  setStudioATime(totalMinutesA);
                  break;
                
                case 'B':
                  if (data.isRunning && !isRunning) {
                    startStudioB();
                  } else if (!data.isRunning && isRunning) {
                    pauseStudioB();
                  }
                  
                  // Update time - convert to minutes only (function accepts only minutes)
                  const totalMinutesB = Math.ceil((data.minutes * 60 + (data.seconds || 0)) / 60);
                  setStudioBTime(totalMinutesB);
                  break;
                
                case 'C':
                  if (data.isRunning && !isRunning) {
                    startStudioC();
                  } else if (!data.isRunning && isRunning) {
                    pauseStudioC();
                  }
                  
                  // Update time - convert to minutes only (function accepts only minutes)
                  const totalMinutesC = Math.ceil((data.minutes * 60 + (data.seconds || 0)) / 60);
                  setStudioCTime(totalMinutesC);
                  break;
                
                case 'D':
                  if (data.isRunning && !isRunning) {
                    startStudioD();
                  } else if (!data.isRunning && isRunning) {
                    pauseStudioD();
                  }
                  
                  // Update time - convert to minutes only (function accepts only minutes)
                  const totalMinutesD = Math.ceil((data.minutes * 60 + (data.seconds || 0)) / 60);
                  setStudioDTime(totalMinutesD);
                  break;
              }
              
              // Update timestamp
              setLastUpdateTimestamp(now);
            })
            .catch(err => {
              console.error('[DirectCountdownTimer] Error fetching timer state via HTTP:', err);
              
              // Try WebSocket reconnection as a last resort
              window.dispatchEvent(new Event('requestWebSocketReconnect'));
            });
          
          // Reset lastUpdateTimestamp to avoid spamming reconnect requests
          setLastUpdateTimestamp(now);
        }
      }
    }, 1000); // Check every second
    
    return () => clearInterval(checkInterval);
  }, [isRunning, lastUpdateTimestamp, studio, variant, websocket, 
    startStudioA, startStudioB, startStudioC, startStudioD,
    pauseStudioA, pauseStudioB, pauseStudioC, pauseStudioD, 
    setStudioATime, setStudioBTime, setStudioCTime, setStudioDTime
  ]);
  
  // Talent view (display only) with digital clock style
  return (
    <div className="flex items-center justify-center h-full w-full">
      
      <div className={`rounded-md w-full h-full shadow-lg border p-1 flex items-center justify-center ${
        isDangerZone ? 'animate-container-pulse border-red-800' : 'border-zinc-700'
      }`} style={{ background: 'transparent' }}>
        <span 
          className={`text-4xl font-mono font-extrabold text-center tracking-wider
            ${isDangerZone ? 'animate-blink-fast text-[#ff0000] animate-timer-glow' : 'text-[#fe0303]'}`}
          style={isDangerZone ? { 
            textShadow: '0 0 15px rgba(255, 0, 0, 1), 0 0 8px rgba(255, 0, 0, 0.8), 0 0 4px rgba(255, 0, 0, 0.6)',
            filter: 'drop-shadow(0 0 10px rgba(255, 0, 0, 1))',
            WebkitTextStroke: '1px rgba(255, 80, 80, 0.8)'
          } : {}}
        >
          {formatTime(timeRemaining)}
        </span>
      </div>
    </div>
  );
}
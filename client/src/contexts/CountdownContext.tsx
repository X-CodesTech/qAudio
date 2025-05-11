import React, { createContext, useContext, useEffect, useState } from 'react';
import { useVoIP } from './VoIPContext';

// Define countdown state structure
type CountdownState = {
  timeRemaining: number;
  isRunning: boolean;
  isDangerZone: boolean;
};

// Define the context type with all methods
type CountdownContextType = {
  studioAState: CountdownState;
  studioBState: CountdownState;
  studioCState: CountdownState;
  studioDState: CountdownState;
  updateStudioA: (data: Partial<CountdownState>) => void;
  updateStudioB: (data: Partial<CountdownState>) => void;
  updateStudioC: (data: Partial<CountdownState>) => void;
  updateStudioD: (data: Partial<CountdownState>) => void;
  resetStudioA: () => void;
  resetStudioB: () => void;
  resetStudioC: () => void;
  resetStudioD: () => void;
  pauseStudioA: () => void;
  pauseStudioB: () => void;
  pauseStudioC: () => void;
  pauseStudioD: () => void;
  startStudioA: () => void;
  startStudioB: () => void;
  startStudioC: () => void;
  startStudioD: () => void;
  setStudioATime: (minutes: number) => void;
  setStudioBTime: (minutes: number) => void;
  setStudioCTime: (minutes: number) => void;
  setStudioDTime: (minutes: number) => void;
};

// Default state for initializing timers
const defaultState: CountdownState = {
  timeRemaining: 300, // 5 minutes in seconds
  isRunning: false,
  isDangerZone: false,
};

// Create context with empty default value
const CountdownContext = createContext<CountdownContextType | null>(null);

// Provider component
export function CountdownProvider({ children }: { children: React.ReactNode }) {
  const { websocket } = useVoIP();
  
  // State for Studio A countdown
  const [studioAState, setStudioAState] = useState<CountdownState>({
    ...defaultState
  });
  
  // State for Studio B countdown
  const [studioBState, setStudioBState] = useState<CountdownState>({
    ...defaultState
  });
  
  // State for Studio C countdown
  const [studioCState, setStudioCState] = useState<CountdownState>({
    ...defaultState
  });
  
  // State for Studio D countdown
  const [studioDState, setStudioDState] = useState<CountdownState>({
    ...defaultState
  });
  
  // Store the initial time values for reset functionality
  const [studioAInitialTime, setStudioAInitialTime] = useState(300);
  const [studioBInitialTime, setStudioBInitialTime] = useState(300);
  const [studioCInitialTime, setStudioCInitialTime] = useState(300);
  const [studioDInitialTime, setStudioDInitialTime] = useState(300);

  // Track WebSocket ready state for reconnection
  const [wsReady, setWsReady] = useState(false);

  // Effect to set up WebSocket listener for countdown updates
  useEffect(() => {
    if (!websocket) return;

    console.log("[CountdownContext] Setting up WebSocket listeners for countdown updates");

    // Function to request initial state when WebSocket connects, with retry logic
    const requestInitialState = (studio: 'A' | 'B' | 'C' | 'D') => {
      // Function to actually send the request
      const sendRequest = () => {
        if (websocket && websocket.readyState === WebSocket.OPEN) {
          console.log(`[CountdownContext] Requesting initial countdown state for Studio ${studio}`);
          try {
            websocket.send(JSON.stringify({
              type: 'countdown_state_request',
              studio,
              timestamp: new Date().toISOString(),
              requestId: `${Date.now()}-${Math.floor(Math.random() * 10000)}` // Add unique request ID
            }));
            return true;
          } catch (err) {
            console.error(`[CountdownContext] Error requesting timer state for Studio ${studio}:`, err);
          }
        } else {
          console.warn(`[CountdownContext] WebSocket not ready for Studio ${studio} state request (state: ${websocket ? websocket.readyState : 'null'})`);
        }
        return false;
      };

      // Try immediately
      if (!sendRequest()) {
        // If failed, try again after a short delay
        setTimeout(() => {
          if (!sendRequest()) {
            // If it fails again, set up a retry interval
            const retryInterval = setInterval(() => {
              if (sendRequest()) {
                clearInterval(retryInterval);
              }
            }, 3000);
            
            // But don't keep it going forever
            setTimeout(() => clearInterval(retryInterval), 30000);
          }
        }, 1000);
      }
    };
    
    // Set up ping interval to keep connection alive (every 30 seconds)
    let pingInterval: NodeJS.Timeout | null = null;
    
    // Function to send ping to keep connection alive
    const sendPing = () => {
      if (websocket && websocket.readyState === WebSocket.OPEN) {
        console.log("[CountdownContext] Sending ping to keep WebSocket connection alive");
        websocket.send(JSON.stringify({
          type: 'ping',
          timestamp: Date.now()
        }));
      }
    };

    // Handle WebSocket connection
    const handleOpen = () => {
      console.log(`[CountdownContext] WebSocket connected or reconnected`);
      setWsReady(true);
      
      // Set up ping interval to keep connection alive
      pingInterval = setInterval(sendPing, 30000); // Every 30 seconds
      
      // Force request initial state for all studios after reconnection
      setTimeout(() => {
        console.log(`[CountdownContext] Requesting initial states after connection`);
        requestInitialState('A');
        requestInitialState('B');
        requestInitialState('C');
        requestInitialState('D');
      }, 500); // Small delay to ensure WebSocket is fully established
    };

    // Handle WebSocket close/error
    const handleClose = () => {
      console.log(`[CountdownContext] WebSocket disconnected`);
      setWsReady(false);
      
      // Clear ping interval
      if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
      }
    };

    // Set up listener for WebSocket messages to update state
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle state request broadcasts from other clients
        if (data.type === 'countdown_state_request_broadcast') {
          // Only respond if we're a producer (manage timers)
          if ((websocket as any)?.role === 'producer') {
            const studio = data.studio;
            
            console.log(`[CountdownContext] Received state request broadcast for Studio ${studio}, responding with current state`);
            
            // Prepare response based on the requested studio
            if (studio === 'A' && websocket.readyState === WebSocket.OPEN) {
              // Send current Studio A state back to everyone
              websocket.send(JSON.stringify({
                type: 'countdown_update',
                studio: 'A',
                minutes: Math.floor(studioAState.timeRemaining / 60),
                seconds: studioAState.timeRemaining % 60,
                isRunning: studioAState.isRunning,
                isDangerZone: studioAState.isDangerZone,
                requestId: data.requestId, // Echo the request ID for tracking
                timestamp: new Date().toISOString()
              }));
            } else if (studio === 'B' && websocket.readyState === WebSocket.OPEN) {
              // Send current Studio B state back to everyone
              websocket.send(JSON.stringify({
                type: 'countdown_update',
                studio: 'B',
                minutes: Math.floor(studioBState.timeRemaining / 60), 
                seconds: studioBState.timeRemaining % 60,
                isRunning: studioBState.isRunning,
                isDangerZone: studioBState.isDangerZone,
                requestId: data.requestId, // Echo the request ID for tracking
                timestamp: new Date().toISOString()
              }));
            } else if (studio === 'C' && websocket.readyState === WebSocket.OPEN) {
              // Send current Studio C state back to everyone
              websocket.send(JSON.stringify({
                type: 'countdown_update',
                studio: 'C',
                minutes: Math.floor(studioCState.timeRemaining / 60), 
                seconds: studioCState.timeRemaining % 60,
                isRunning: studioCState.isRunning,
                isDangerZone: studioCState.isDangerZone,
                requestId: data.requestId, // Echo the request ID for tracking
                timestamp: new Date().toISOString()
              }));
            } else if (studio === 'D' && websocket.readyState === WebSocket.OPEN) {
              // Send current Studio D state back to everyone
              websocket.send(JSON.stringify({
                type: 'countdown_update',
                studio: 'D',
                minutes: Math.floor(studioDState.timeRemaining / 60), 
                seconds: studioDState.timeRemaining % 60,
                isRunning: studioDState.isRunning,
                isDangerZone: studioDState.isDangerZone,
                requestId: data.requestId, // Echo the request ID for tracking
                timestamp: new Date().toISOString()
              }));
            }
          }
        }
        
        // Handle countdown updates from server
        if (data.type === 'countdown_update') {
          // Calculate total seconds
          const totalSeconds = (data.minutes * 60) + (data.seconds || 0);
          
          // Update appropriate studio state
          if (data.studio === 'A') {
            console.log(`[CountdownContext] Received countdown update for Studio A: ${data.minutes}:${data.seconds || 0}, running: ${data.isRunning}`);
            
            // Update state with payload from server
            setStudioAState({
              timeRemaining: totalSeconds,
              isRunning: data.isRunning,
              isDangerZone: data.isDangerZone !== undefined ? data.isDangerZone : totalSeconds <= 120
            });
            
            // Store the initial time for reset if this is a new timer value (not a running update)
            if (!data.isRunning) {
              setStudioAInitialTime(totalSeconds);
            }
          } 
          else if (data.studio === 'B') {
            console.log(`[CountdownContext] Received countdown update for Studio B: ${data.minutes}:${data.seconds || 0}, running: ${data.isRunning}`);
            
            // Update state with payload from server
            setStudioBState({
              timeRemaining: totalSeconds,
              isRunning: data.isRunning,
              isDangerZone: data.isDangerZone !== undefined ? data.isDangerZone : totalSeconds <= 120
            });
            
            // Store the initial time for reset if this is a new timer value (not a running update)
            if (!data.isRunning) {
              setStudioBInitialTime(totalSeconds);
            }
          }
          else if (data.studio === 'C') {
            console.log(`[CountdownContext] Received countdown update for Studio C: ${data.minutes}:${data.seconds || 0}, running: ${data.isRunning}`);
            
            // Update state with payload from server
            setStudioCState({
              timeRemaining: totalSeconds,
              isRunning: data.isRunning,
              isDangerZone: data.isDangerZone !== undefined ? data.isDangerZone : totalSeconds <= 120
            });
            
            // Store the initial time for reset if this is a new timer value (not a running update)
            if (!data.isRunning) {
              setStudioCInitialTime(totalSeconds);
            }
          }
          else if (data.studio === 'D') {
            console.log(`[CountdownContext] Received countdown update for Studio D: ${data.minutes}:${data.seconds || 0}, running: ${data.isRunning}`);
            
            // Update state with payload from server
            setStudioDState({
              timeRemaining: totalSeconds,
              isRunning: data.isRunning,
              isDangerZone: data.isDangerZone !== undefined ? data.isDangerZone : totalSeconds <= 120
            });
            
            // Store the initial time for reset if this is a new timer value (not a running update)
            if (!data.isRunning) {
              setStudioDInitialTime(totalSeconds);
            }
          }
        }
      } catch (error) {
        console.error('Error parsing countdown WebSocket message:', error);
      }
    };

    // Set up WebSocket event listeners
    if (websocket.readyState === WebSocket.OPEN) {
      console.log('[CountdownContext] WebSocket already open, requesting initial states');
      handleOpen();
    }
    
    websocket.addEventListener('open', handleOpen);
    websocket.addEventListener('close', handleClose);
    websocket.addEventListener('error', handleClose);
    websocket.addEventListener('message', handleMessage);
    
    // Clean up event listeners and intervals
    return () => {
      websocket.removeEventListener('open', handleOpen);
      websocket.removeEventListener('close', handleClose);
      websocket.removeEventListener('error', handleClose);
      websocket.removeEventListener('message', handleMessage);
      
      // Clean up ping interval
      if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
      }
    };
  }, [websocket]);

  // Effect to update local countdown timer when it's running
  useEffect(() => {
    let studioAInterval: ReturnType<typeof setInterval> | null = null;
    
    if (studioAState.isRunning && studioAState.timeRemaining > 0) {
      studioAInterval = setInterval(() => {
        setStudioAState(prev => {
          const newTime = prev.timeRemaining - 1;
          const newIsDangerZone = newTime <= 120;
          
          // Check if entering danger zone
          if (newTime <= 120 && !prev.isDangerZone && websocket && websocket.readyState === WebSocket.OPEN) {
            // Broadcast danger zone update
            websocket.send(JSON.stringify({
              type: 'countdown_update',
              studio: 'A',
              minutes: Math.floor(newTime / 60),
              seconds: newTime % 60,
              isRunning: true,
              isDangerZone: true
            }));
          }
          
          // Check if timer reached zero
          if (newTime <= 0) {
            // Broadcast that timer reached zero
            if (websocket && websocket.readyState === WebSocket.OPEN) {
              websocket.send(JSON.stringify({
                type: 'countdown_update',
                studio: 'A',
                minutes: 0,
                seconds: 0,
                isRunning: false,
                isDangerZone: true
              }));
            }
            
            // Stop the interval
            if (studioAInterval) {
              clearInterval(studioAInterval);
            }
            
            return {
              ...prev,
              timeRemaining: 0,
              isRunning: false,
              isDangerZone: true
            };
          }
          
          return {
            ...prev,
            timeRemaining: newTime,
            isDangerZone: newIsDangerZone
          };
        });
      }, 1000);
    }
    
    return () => {
      if (studioAInterval) {
        clearInterval(studioAInterval);
      }
    };
  }, [studioAState.isRunning, studioAState.timeRemaining, websocket]);

  // Effect to update Studio B countdown timer when it's running  
  useEffect(() => {
    let studioBInterval: ReturnType<typeof setInterval> | null = null;
    
    if (studioBState.isRunning && studioBState.timeRemaining > 0) {
      studioBInterval = setInterval(() => {
        setStudioBState(prev => {
          const newTime = prev.timeRemaining - 1;
          const newIsDangerZone = newTime <= 120;
          
          // Check if entering danger zone
          if (newTime <= 120 && !prev.isDangerZone && websocket && websocket.readyState === WebSocket.OPEN) {
            // Broadcast danger zone update
            websocket.send(JSON.stringify({
              type: 'countdown_update',
              studio: 'B',
              minutes: Math.floor(newTime / 60),
              seconds: newTime % 60,
              isRunning: true,
              isDangerZone: true
            }));
          }
          
          // Check if timer reached zero
          if (newTime <= 0) {
            // Broadcast that timer reached zero
            if (websocket && websocket.readyState === WebSocket.OPEN) {
              websocket.send(JSON.stringify({
                type: 'countdown_update',
                studio: 'B',
                minutes: 0,
                seconds: 0,
                isRunning: false,
                isDangerZone: true
              }));
            }
            
            // Stop the interval
            if (studioBInterval) {
              clearInterval(studioBInterval);
            }
            
            return {
              ...prev,
              timeRemaining: 0,
              isRunning: false,
              isDangerZone: true
            };
          }
          
          return {
            ...prev,
            timeRemaining: newTime,
            isDangerZone: newIsDangerZone
          };
        });
      }, 1000);
    }
    
    return () => {
      if (studioBInterval) {
        clearInterval(studioBInterval);
      }
    };
  }, [studioBState.isRunning, studioBState.timeRemaining, websocket]);

  // Effect to update Studio C countdown timer when it's running  
  useEffect(() => {
    let studioCInterval: ReturnType<typeof setInterval> | null = null;
    
    if (studioCState.isRunning && studioCState.timeRemaining > 0) {
      studioCInterval = setInterval(() => {
        setStudioCState(prev => {
          const newTime = prev.timeRemaining - 1;
          const newIsDangerZone = newTime <= 120;
          
          // Check if entering danger zone
          if (newTime <= 120 && !prev.isDangerZone && websocket && websocket.readyState === WebSocket.OPEN) {
            // Broadcast danger zone update
            websocket.send(JSON.stringify({
              type: 'countdown_update',
              studio: 'C',
              minutes: Math.floor(newTime / 60),
              seconds: newTime % 60,
              isRunning: true,
              isDangerZone: true
            }));
          }
          
          // Check if timer reached zero
          if (newTime <= 0) {
            // Broadcast that timer reached zero
            if (websocket && websocket.readyState === WebSocket.OPEN) {
              websocket.send(JSON.stringify({
                type: 'countdown_update',
                studio: 'C',
                minutes: 0,
                seconds: 0,
                isRunning: false,
                isDangerZone: true
              }));
            }
            
            // Stop the interval
            if (studioCInterval) {
              clearInterval(studioCInterval);
            }
            
            return {
              ...prev,
              timeRemaining: 0,
              isRunning: false,
              isDangerZone: true
            };
          }
          
          return {
            ...prev,
            timeRemaining: newTime,
            isDangerZone: newIsDangerZone
          };
        });
      }, 1000);
    }
    
    return () => {
      if (studioCInterval) {
        clearInterval(studioCInterval);
      }
    };
  }, [studioCState.isRunning, studioCState.timeRemaining, websocket]);

  // Effect to update Studio D countdown timer when it's running  
  useEffect(() => {
    let studioDInterval: ReturnType<typeof setInterval> | null = null;
    
    if (studioDState.isRunning && studioDState.timeRemaining > 0) {
      studioDInterval = setInterval(() => {
        setStudioDState(prev => {
          const newTime = prev.timeRemaining - 1;
          const newIsDangerZone = newTime <= 120;
          
          // Check if entering danger zone
          if (newTime <= 120 && !prev.isDangerZone && websocket && websocket.readyState === WebSocket.OPEN) {
            // Broadcast danger zone update
            websocket.send(JSON.stringify({
              type: 'countdown_update',
              studio: 'D',
              minutes: Math.floor(newTime / 60),
              seconds: newTime % 60,
              isRunning: true,
              isDangerZone: true
            }));
          }
          
          // Check if timer reached zero
          if (newTime <= 0) {
            // Broadcast that timer reached zero
            if (websocket && websocket.readyState === WebSocket.OPEN) {
              websocket.send(JSON.stringify({
                type: 'countdown_update',
                studio: 'D',
                minutes: 0,
                seconds: 0,
                isRunning: false,
                isDangerZone: true
              }));
            }
            
            // Stop the interval
            if (studioDInterval) {
              clearInterval(studioDInterval);
            }
            
            return {
              ...prev,
              timeRemaining: 0,
              isRunning: false,
              isDangerZone: true
            };
          }
          
          return {
            ...prev,
            timeRemaining: newTime,
            isDangerZone: newIsDangerZone
          };
        });
      }, 1000);
    }
    
    return () => {
      if (studioDInterval) {
        clearInterval(studioDInterval);
      }
    };
  }, [studioDState.isRunning, studioDState.timeRemaining, websocket]);

  // Function to update Studio A state (partial update)
  const updateStudioA = (data: Partial<CountdownState>) => {
    setStudioAState(prev => ({ ...prev, ...data }));
  };

  // Function to update Studio B state (partial update)
  const updateStudioB = (data: Partial<CountdownState>) => {
    setStudioBState(prev => ({ ...prev, ...data }));
  };
  
  // Function to update Studio C state (partial update)
  const updateStudioC = (data: Partial<CountdownState>) => {
    setStudioCState(prev => ({ ...prev, ...data }));
  };

  // Function to update Studio D state (partial update)
  const updateStudioD = (data: Partial<CountdownState>) => {
    setStudioDState(prev => ({ ...prev, ...data }));
  };

  // Function to reset Studio A timer
  const resetStudioA = () => {
    const resetTime = studioAInitialTime;
    
    // Update local state immediately for UI feedback
    setStudioAState({
      timeRemaining: resetTime,
      isRunning: false,
      isDangerZone: resetTime <= 120
    });
    
    // Attempt to broadcast via WebSocket if available
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      try {
        // Add unique message ID for tracking
        const messageId = `reset-A-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        
        console.log(`[CountdownContext] Resetting Studio A timer via WebSocket (${messageId})`);
        
        // Send reset message over WebSocket
        websocket.send(JSON.stringify({
          type: 'countdown_update',
          studio: 'A',
          minutes: Math.floor(resetTime / 60),
          seconds: resetTime % 60,
          isRunning: false,
          isDangerZone: resetTime <= 120,
          messageId: messageId,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        console.error('Error sending timer reset command:', error);
        
        // If websocket send failed, force reconnection
        window.dispatchEvent(new Event('requestWebSocketReconnect'));
      }
    } else {
      console.warn('[CountdownContext] WebSocket not ready when resetting timer, update will be local only');
      
      // Request WebSocket reconnection
      window.dispatchEvent(new Event('requestWebSocketReconnect'));
    }
  };

  // Function to reset Studio B timer
  const resetStudioB = () => {
    const resetTime = studioBInitialTime;
    
    // Update local state immediately for UI feedback
    setStudioBState({
      timeRemaining: resetTime,
      isRunning: false,
      isDangerZone: resetTime <= 120
    });
    
    // Attempt to broadcast via WebSocket if available
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      try {
        // Add unique message ID for tracking
        const messageId = `reset-B-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        
        console.log(`[CountdownContext] Resetting Studio B timer via WebSocket (${messageId})`);
        
        // Send reset message over WebSocket
        websocket.send(JSON.stringify({
          type: 'countdown_update',
          studio: 'B',
          minutes: Math.floor(resetTime / 60),
          seconds: resetTime % 60,
          isRunning: false,
          isDangerZone: resetTime <= 120,
          messageId: messageId,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        console.error('Error sending timer reset command:', error);
        
        // If websocket send failed, force reconnection
        window.dispatchEvent(new Event('requestWebSocketReconnect'));
      }
    } else {
      console.warn('[CountdownContext] WebSocket not ready when resetting timer, update will be local only');
      
      // Request WebSocket reconnection
      window.dispatchEvent(new Event('requestWebSocketReconnect'));
    }
  };
  
  // Function to reset Studio C timer
  const resetStudioC = () => {
    const resetTime = studioCInitialTime;
    
    // Update local state immediately for UI feedback
    setStudioCState({
      timeRemaining: resetTime,
      isRunning: false,
      isDangerZone: resetTime <= 120
    });
    
    // Attempt to broadcast via WebSocket if available
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      try {
        // Add unique message ID for tracking
        const messageId = `reset-C-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        
        console.log(`[CountdownContext] Resetting Studio C timer via WebSocket (${messageId})`);
        
        // Send reset message over WebSocket
        websocket.send(JSON.stringify({
          type: 'countdown_update',
          studio: 'C',
          minutes: Math.floor(resetTime / 60),
          seconds: resetTime % 60,
          isRunning: false,
          isDangerZone: resetTime <= 120,
          messageId: messageId,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        console.error('Error sending timer reset command:', error);
        
        // If websocket send failed, force reconnection
        window.dispatchEvent(new Event('requestWebSocketReconnect'));
      }
    } else {
      console.warn('[CountdownContext] WebSocket not ready when resetting timer, update will be local only');
      
      // Request WebSocket reconnection
      window.dispatchEvent(new Event('requestWebSocketReconnect'));
    }
  };
  
  // Function to reset Studio D timer
  const resetStudioD = () => {
    const resetTime = studioDInitialTime;
    
    // Update local state immediately for UI feedback
    setStudioDState({
      timeRemaining: resetTime,
      isRunning: false,
      isDangerZone: resetTime <= 120
    });
    
    // Attempt to broadcast via WebSocket if available
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      try {
        // Add unique message ID for tracking
        const messageId = `reset-D-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        
        console.log(`[CountdownContext] Resetting Studio D timer via WebSocket (${messageId})`);
        
        // Send reset message over WebSocket
        websocket.send(JSON.stringify({
          type: 'countdown_update',
          studio: 'D',
          minutes: Math.floor(resetTime / 60),
          seconds: resetTime % 60,
          isRunning: false,
          isDangerZone: resetTime <= 120,
          messageId: messageId,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        console.error('Error sending timer reset command:', error);
        
        // If websocket send failed, force reconnection
        window.dispatchEvent(new Event('requestWebSocketReconnect'));
      }
    } else {
      console.warn('[CountdownContext] WebSocket not ready when resetting timer, update will be local only');
      
      // Request WebSocket reconnection
      window.dispatchEvent(new Event('requestWebSocketReconnect'));
    }
  };

  // Function to pause Studio A timer
  const pauseStudioA = () => {
    // Update local state immediately for UI feedback
    setStudioAState(prev => ({ ...prev, isRunning: false }));
    
    // Attempt to broadcast via WebSocket if available
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      try {
        // Add unique message ID for tracking
        const messageId = `pause-A-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        
        console.log(`[CountdownContext] Pausing Studio A timer via WebSocket (${messageId})`);
        
        // Send pause message over WebSocket
        websocket.send(JSON.stringify({
          type: 'countdown_update',
          studio: 'A',
          minutes: Math.floor(studioAState.timeRemaining / 60),
          seconds: studioAState.timeRemaining % 60,
          isRunning: false,
          isDangerZone: studioAState.isDangerZone,
          messageId: messageId,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        console.error('Error sending timer pause command:', error);
        
        // If websocket send failed, force reconnection
        window.dispatchEvent(new Event('requestWebSocketReconnect'));
      }
    } else {
      console.warn('[CountdownContext] WebSocket not ready when pausing timer, update will be local only');
      
      // Request WebSocket reconnection
      window.dispatchEvent(new Event('requestWebSocketReconnect'));
    }
  };

  // Function to pause Studio B timer
  const pauseStudioB = () => {
    // Update local state immediately for UI feedback
    setStudioBState(prev => ({ ...prev, isRunning: false }));
    
    // Attempt to broadcast via WebSocket if available
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      try {
        // Add unique message ID for tracking
        const messageId = `pause-B-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        
        console.log(`[CountdownContext] Pausing Studio B timer via WebSocket (${messageId})`);
        
        // Send pause message over WebSocket
        websocket.send(JSON.stringify({
          type: 'countdown_update',
          studio: 'B',
          minutes: Math.floor(studioBState.timeRemaining / 60),
          seconds: studioBState.timeRemaining % 60,
          isRunning: false,
          isDangerZone: studioBState.isDangerZone,
          messageId: messageId,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        console.error('Error sending timer pause command:', error);
        
        // If websocket send failed, force reconnection
        window.dispatchEvent(new Event('requestWebSocketReconnect'));
      }
    } else {
      console.warn('[CountdownContext] WebSocket not ready when pausing timer, update will be local only');
      
      // Request WebSocket reconnection
      window.dispatchEvent(new Event('requestWebSocketReconnect'));
    }
  };
  
  // Function to pause Studio C timer
  const pauseStudioC = () => {
    // Update local state immediately for UI feedback
    setStudioCState(prev => ({ ...prev, isRunning: false }));
    
    // Attempt to broadcast via WebSocket if available
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      try {
        // Add unique message ID for tracking
        const messageId = `pause-C-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        
        console.log(`[CountdownContext] Pausing Studio C timer via WebSocket (${messageId})`);
        
        // Send pause message over WebSocket
        websocket.send(JSON.stringify({
          type: 'countdown_update',
          studio: 'C',
          minutes: Math.floor(studioCState.timeRemaining / 60),
          seconds: studioCState.timeRemaining % 60,
          isRunning: false,
          isDangerZone: studioCState.isDangerZone,
          messageId: messageId,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        console.error('Error sending timer pause command:', error);
        
        // If websocket send failed, force reconnection
        window.dispatchEvent(new Event('requestWebSocketReconnect'));
      }
    } else {
      console.warn('[CountdownContext] WebSocket not ready when pausing timer, update will be local only');
      
      // Request WebSocket reconnection
      window.dispatchEvent(new Event('requestWebSocketReconnect'));
    }
  };
  
  // Function to pause Studio D timer
  const pauseStudioD = () => {
    // Update local state immediately for UI feedback
    setStudioDState(prev => ({ ...prev, isRunning: false }));
    
    // Attempt to broadcast via WebSocket if available
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      try {
        // Add unique message ID for tracking
        const messageId = `pause-D-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        
        console.log(`[CountdownContext] Pausing Studio D timer via WebSocket (${messageId})`);
        
        // Send pause message over WebSocket
        websocket.send(JSON.stringify({
          type: 'countdown_update',
          studio: 'D',
          minutes: Math.floor(studioDState.timeRemaining / 60),
          seconds: studioDState.timeRemaining % 60,
          isRunning: false,
          isDangerZone: studioDState.isDangerZone,
          messageId: messageId,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        console.error('Error sending timer pause command:', error);
        
        // If websocket send failed, force reconnection
        window.dispatchEvent(new Event('requestWebSocketReconnect'));
      }
    } else {
      console.warn('[CountdownContext] WebSocket not ready when pausing timer, update will be local only');
      
      // Request WebSocket reconnection
      window.dispatchEvent(new Event('requestWebSocketReconnect'));
    }
  };

  // Function to start Studio A timer
  const startStudioA = () => {
    console.log('[DEBUG] startStudioA called in CountdownContext');
    
    // First check if we have a valid timer value to start
    if (studioAState.timeRemaining <= 0) {
      console.warn("[DEBUG] Cannot start timer with zero or negative time remaining:", studioAState.timeRemaining);
      return;
    }
    
    console.log('[DEBUG] Starting Studio A timer with timeRemaining:', studioAState.timeRemaining);
    
    // Update local state first for immediate UI feedback
    setStudioAState(prev => {
      console.log('[DEBUG] Updating studioAState from', prev, 'to', { ...prev, isRunning: true });
      return { ...prev, isRunning: true };
    });
    
    // Attempt to send via WebSocket if available
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      try {
        // Include timestamp and unique message ID for tracking
        const messageId = `start-A-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        
        console.log(`[DEBUG] Sending start command for Studio A timer via WebSocket (${messageId})`);
        
        // Send start message over WebSocket
        websocket.send(JSON.stringify({
          type: 'countdown_update',
          studio: 'A',
          minutes: Math.floor(studioAState.timeRemaining / 60),
          seconds: studioAState.timeRemaining % 60,
          isRunning: true,
          isDangerZone: studioAState.isDangerZone,
          messageId: messageId,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        console.error('Error sending timer start command:', error);
        
        // If websocket send failed, force reconnection
        window.dispatchEvent(new Event('requestWebSocketReconnect'));
      }
    } else {
      console.warn('[CountdownContext] WebSocket not ready, timer will run locally only');
      
      // Force reconnection if websocket is not available
      if (!websocket || websocket.readyState !== WebSocket.OPEN) {
        console.log('[CountdownContext] Requesting WebSocket reconnection due to missing connection');
        window.dispatchEvent(new Event('requestWebSocketReconnect'));
      }
    }
  };

  // Function to start Studio B timer
  const startStudioB = () => {
    console.log('[DEBUG] startStudioB called in CountdownContext');
    
    // First check if we have a valid timer value to start
    if (studioBState.timeRemaining <= 0) {
      console.warn("[DEBUG] Cannot start timer with zero or negative time remaining:", studioBState.timeRemaining);
      return;
    }
    
    console.log('[DEBUG] Starting Studio B timer with timeRemaining:', studioBState.timeRemaining);
    
    // Update local state first for immediate UI feedback
    setStudioBState(prev => {
      console.log('[DEBUG] Updating studioBState from', prev, 'to', { ...prev, isRunning: true });
      return { ...prev, isRunning: true };
    });
    
    // Attempt to send via WebSocket if available
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      try {
        // Include timestamp and unique message ID for tracking
        const messageId = `start-B-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        
        console.log(`[DEBUG] Sending start command for Studio B timer via WebSocket (${messageId})`);
        
        // Send start message over WebSocket
        websocket.send(JSON.stringify({
          type: 'countdown_update',
          studio: 'B',
          minutes: Math.floor(studioBState.timeRemaining / 60),
          seconds: studioBState.timeRemaining % 60,
          isRunning: true,
          isDangerZone: studioBState.isDangerZone,
          messageId: messageId,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        console.error('Error sending timer start command:', error);
        
        // If websocket send failed, force reconnection
        window.dispatchEvent(new Event('requestWebSocketReconnect'));
      }
    } else {
      console.warn('[CountdownContext] WebSocket not ready, timer will run locally only');
      
      // Force reconnection if websocket is not available
      if (!websocket || websocket.readyState !== WebSocket.OPEN) {
        console.log('[CountdownContext] Requesting WebSocket reconnection due to missing connection');
        window.dispatchEvent(new Event('requestWebSocketReconnect'));
      }
    }
  };
  
  // Function to start Studio C timer
  const startStudioC = () => {
    console.log('[DEBUG] startStudioC called in CountdownContext');
    
    // First check if we have a valid timer value to start
    if (studioCState.timeRemaining <= 0) {
      console.warn("[DEBUG] Cannot start timer with zero or negative time remaining:", studioCState.timeRemaining);
      return;
    }
    
    console.log('[DEBUG] Starting Studio C timer with timeRemaining:', studioCState.timeRemaining);
    
    // Update local state first for immediate UI feedback
    setStudioCState(prev => {
      console.log('[DEBUG] Updating studioCState from', prev, 'to', { ...prev, isRunning: true });
      return { ...prev, isRunning: true };
    });
    
    // Attempt to send via WebSocket if available
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      try {
        // Include timestamp and unique message ID for tracking
        const messageId = `start-C-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        
        console.log(`[DEBUG] Sending start command for Studio C timer via WebSocket (${messageId})`);
        
        // Send start message over WebSocket
        websocket.send(JSON.stringify({
          type: 'countdown_update',
          studio: 'C',
          minutes: Math.floor(studioCState.timeRemaining / 60),
          seconds: studioCState.timeRemaining % 60,
          isRunning: true,
          isDangerZone: studioCState.isDangerZone,
          messageId: messageId,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        console.error('Error sending timer start command:', error);
        
        // If websocket send failed, force reconnection
        window.dispatchEvent(new Event('requestWebSocketReconnect'));
      }
    } else {
      console.warn('[CountdownContext] WebSocket not ready, timer will run locally only');
      
      // Force reconnection if websocket is not available
      if (!websocket || websocket.readyState !== WebSocket.OPEN) {
        console.log('[CountdownContext] Requesting WebSocket reconnection due to missing connection');
        window.dispatchEvent(new Event('requestWebSocketReconnect'));
      }
    }
  };
  
  // Function to start Studio D timer
  const startStudioD = () => {
    console.log('[DEBUG] startStudioD called in CountdownContext');
    
    // First check if we have a valid timer value to start
    if (studioDState.timeRemaining <= 0) {
      console.warn("[DEBUG] Cannot start timer with zero or negative time remaining:", studioDState.timeRemaining);
      return;
    }
    
    console.log('[DEBUG] Starting Studio D timer with timeRemaining:', studioDState.timeRemaining);
    
    // Update local state first for immediate UI feedback
    setStudioDState(prev => {
      console.log('[DEBUG] Updating studioDState from', prev, 'to', { ...prev, isRunning: true });
      return { ...prev, isRunning: true };
    });
    
    // Attempt to send via WebSocket if available
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      try {
        // Include timestamp and unique message ID for tracking
        const messageId = `start-D-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        
        console.log(`[DEBUG] Sending start command for Studio D timer via WebSocket (${messageId})`);
        
        // Send start message over WebSocket
        websocket.send(JSON.stringify({
          type: 'countdown_update',
          studio: 'D',
          minutes: Math.floor(studioDState.timeRemaining / 60),
          seconds: studioDState.timeRemaining % 60,
          isRunning: true,
          isDangerZone: studioDState.isDangerZone,
          messageId: messageId,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        console.error('Error sending timer start command:', error);
        
        // If websocket send failed, force reconnection
        window.dispatchEvent(new Event('requestWebSocketReconnect'));
      }
    } else {
      console.warn('[CountdownContext] WebSocket not ready, timer will run locally only');
      
      // Force reconnection if websocket is not available
      if (!websocket || websocket.readyState !== WebSocket.OPEN) {
        console.log('[CountdownContext] Requesting WebSocket reconnection due to missing connection');
        window.dispatchEvent(new Event('requestWebSocketReconnect'));
      }
    }
  };

  // Function to set Studio A timer to a specific number of minutes
  const setStudioATime = (minutes: number) => {
    // Validate input 
    if (minutes <= 0 || minutes > 60) {
      console.warn(`Invalid minutes value: ${minutes}. Must be between 1 and 60.`);
      return;
    }
    
    // Calculate total seconds
    const seconds = minutes * 60;
    
    // Update local state immediately for UI feedback
    setStudioAState({
      timeRemaining: seconds,
      isRunning: false,
      isDangerZone: minutes <= 2
    });
    
    // Store initial time for reset
    setStudioAInitialTime(seconds);
    
    // Attempt to broadcast via WebSocket
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      try {
        // Add unique message ID for tracking
        const messageId = `set-time-A-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        
        console.log(`[CountdownContext] Setting Studio A timer to ${minutes} minutes via WebSocket (${messageId})`);
        
        // Send update message over WebSocket
        websocket.send(JSON.stringify({
          type: 'countdown_update',
          studio: 'A',
          minutes: minutes,
          seconds: 0,
          isRunning: false,
          isDangerZone: minutes <= 2,
          messageId: messageId,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        console.error('Error sending timer set command:', error);
        
        // If websocket send failed, force reconnection
        window.dispatchEvent(new Event('requestWebSocketReconnect'));
      }
    } else {
      console.warn('[CountdownContext] WebSocket not ready when setting timer, update will be local only');
      
      // Force WebSocket reconnection
      window.dispatchEvent(new Event('requestWebSocketReconnect'));
    }
  };

  // Function to set Studio B timer to a specific number of minutes
  const setStudioBTime = (minutes: number) => {
    // Validate input 
    if (minutes <= 0 || minutes > 60) {
      console.warn(`Invalid minutes value: ${minutes}. Must be between 1 and 60.`);
      return;
    }
    
    // Calculate total seconds
    const seconds = minutes * 60;
    
    // Update local state immediately for UI feedback
    setStudioBState({
      timeRemaining: seconds,
      isRunning: false,
      isDangerZone: minutes <= 2
    });
    
    // Store initial time for reset
    setStudioBInitialTime(seconds);
    
    // Attempt to broadcast via WebSocket
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      try {
        // Add unique message ID for tracking
        const messageId = `set-time-B-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        
        console.log(`[CountdownContext] Setting Studio B timer to ${minutes} minutes via WebSocket (${messageId})`);
        
        // Send update message over WebSocket
        websocket.send(JSON.stringify({
          type: 'countdown_update',
          studio: 'B',
          minutes: minutes,
          seconds: 0,
          isRunning: false,
          isDangerZone: minutes <= 2,
          messageId: messageId,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        console.error('Error sending timer set command:', error);
        
        // If websocket send failed, force reconnection
        window.dispatchEvent(new Event('requestWebSocketReconnect'));
      }
    } else {
      console.warn('[CountdownContext] WebSocket not ready when setting timer, update will be local only');
      
      // Force WebSocket reconnection
      window.dispatchEvent(new Event('requestWebSocketReconnect'));
    }
  };
  
  // Function to set Studio C timer to a specific number of minutes
  const setStudioCTime = (minutes: number) => {
    // Validate input 
    if (minutes <= 0 || minutes > 60) {
      console.warn(`Invalid minutes value: ${minutes}. Must be between 1 and 60.`);
      return;
    }
    
    // Calculate total seconds
    const seconds = minutes * 60;
    
    // Update local state immediately for UI feedback
    setStudioCState({
      timeRemaining: seconds,
      isRunning: false,
      isDangerZone: minutes <= 2
    });
    
    // Store initial time for reset
    setStudioCInitialTime(seconds);
    
    // Attempt to broadcast via WebSocket
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      try {
        // Add unique message ID for tracking
        const messageId = `set-time-C-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        
        console.log(`[CountdownContext] Setting Studio C timer to ${minutes} minutes via WebSocket (${messageId})`);
        
        // Send update message over WebSocket
        websocket.send(JSON.stringify({
          type: 'countdown_update',
          studio: 'C',
          minutes: minutes,
          seconds: 0,
          isRunning: false,
          isDangerZone: minutes <= 2,
          messageId: messageId,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        console.error('Error sending timer set command:', error);
        
        // If websocket send failed, force reconnection
        window.dispatchEvent(new Event('requestWebSocketReconnect'));
      }
    } else {
      console.warn('[CountdownContext] WebSocket not ready when setting timer, update will be local only');
      
      // Force WebSocket reconnection
      window.dispatchEvent(new Event('requestWebSocketReconnect'));
    }
  };
  
  // Function to set Studio D timer to a specific number of minutes
  const setStudioDTime = (minutes: number) => {
    // Validate input 
    if (minutes <= 0 || minutes > 60) {
      console.warn(`Invalid minutes value: ${minutes}. Must be between 1 and 60.`);
      return;
    }
    
    // Calculate total seconds
    const seconds = minutes * 60;
    
    // Update local state immediately for UI feedback
    setStudioDState({
      timeRemaining: seconds,
      isRunning: false,
      isDangerZone: minutes <= 2
    });
    
    // Store initial time for reset
    setStudioDInitialTime(seconds);
    
    // Attempt to broadcast via WebSocket
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      try {
        // Add unique message ID for tracking
        const messageId = `set-time-D-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        
        console.log(`[CountdownContext] Setting Studio D timer to ${minutes} minutes via WebSocket (${messageId})`);
        
        // Send update message over WebSocket
        websocket.send(JSON.stringify({
          type: 'countdown_update',
          studio: 'D',
          minutes: minutes,
          seconds: 0,
          isRunning: false,
          isDangerZone: minutes <= 2,
          messageId: messageId,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        console.error('Error sending timer set command:', error);
        
        // If websocket send failed, force reconnection
        window.dispatchEvent(new Event('requestWebSocketReconnect'));
      }
    } else {
      console.warn('[CountdownContext] WebSocket not ready when setting timer, update will be local only');
      
      // Force WebSocket reconnection
      window.dispatchEvent(new Event('requestWebSocketReconnect'));
    }
  };

  // Context value with all state and functions
  const contextValue: CountdownContextType = {
    studioAState,
    studioBState,
    studioCState,
    studioDState,
    updateStudioA,
    updateStudioB,
    updateStudioC,
    updateStudioD,
    resetStudioA,
    resetStudioB,
    resetStudioC,
    resetStudioD,
    pauseStudioA,
    pauseStudioB,
    pauseStudioC,
    pauseStudioD,
    startStudioA,
    startStudioB,
    startStudioC,
    startStudioD,
    setStudioATime,
    setStudioBTime,
    setStudioCTime,
    setStudioDTime
  };

  return (
    <CountdownContext.Provider value={contextValue}>
      {children}
    </CountdownContext.Provider>
  );
}

// Custom hook to use the context
export function useCountdown(studio?: string) {
  const context = useContext(CountdownContext);
  if (!context) {
    throw new Error('useCountdown must be used within a CountdownProvider');
  }
  
  // If a studio is specified, return the specific state and operations for that studio
  if (studio) {
    const studioUpper = studio.toUpperCase();
    
    if (studioUpper === 'A') {
      return {
        timeRemaining: context.studioAState.timeRemaining,
        isRunning: context.studioAState.isRunning,
        isDangerZone: context.studioAState.isDangerZone,
        startTimer: context.startStudioA,
        pauseTimer: context.pauseStudioA,
        resetTimer: context.resetStudioA,
        setTimeRemaining: context.setStudioATime
      };
    } else if (studioUpper === 'B') {
      return {
        timeRemaining: context.studioBState.timeRemaining,
        isRunning: context.studioBState.isRunning,
        isDangerZone: context.studioBState.isDangerZone,
        startTimer: context.startStudioB,
        pauseTimer: context.pauseStudioB,
        resetTimer: context.resetStudioB,
        setTimeRemaining: context.setStudioBTime
      };
    } else if (studioUpper === 'C') {
      return {
        timeRemaining: context.studioCState.timeRemaining,
        isRunning: context.studioCState.isRunning,
        isDangerZone: context.studioCState.isDangerZone,
        startTimer: context.startStudioC,
        pauseTimer: context.pauseStudioC,
        resetTimer: context.resetStudioC,
        setTimeRemaining: context.setStudioCTime
      };
    } else if (studioUpper === 'D') {
      return {
        timeRemaining: context.studioDState.timeRemaining,
        isRunning: context.studioDState.isRunning,
        isDangerZone: context.studioDState.isDangerZone,
        startTimer: context.startStudioD,
        pauseTimer: context.pauseStudioD,
        resetTimer: context.resetStudioD,
        setTimeRemaining: context.setStudioDTime
      };
    }
  }
  
  // If no studio is specified or the studio is not recognized, return the whole context
  return context;
}
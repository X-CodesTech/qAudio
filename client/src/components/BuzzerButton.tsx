import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Bell, BellRing } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import io, { Socket } from 'socket.io-client';

// Create a shared Socket.io instance for better reliability
let socket: Socket | null = null;
let socketInitialized = false;
let socketConnected = false;

// Initialize socket connection once
function initializeSocket() {
  if (socketInitialized) return;
  
  try {
    console.log('BuzzerButton: Initializing Socket.io connection');
    
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const host = window.location.host;
    
    socket = io(`${protocol}//${host}`, {
      path: '/socket.io',
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
      transports: ['websocket', 'polling']
    });
    
    socket.on('connect', () => {
      console.log('BuzzerButton: Socket.io connected with ID:', socket?.id);
      socketConnected = true;
    });
    
    socket.on('connect_error', (error: any) => {
      console.error('BuzzerButton: Socket.io connection error:', error);
      socketConnected = false;
    });
    
    socket.on('disconnect', (reason: string) => {
      console.log('BuzzerButton: Socket.io disconnected:', reason);
      socketConnected = false;
    });
    
    socketInitialized = true;
  } catch (error) {
    console.error('BuzzerButton: Failed to initialize Socket.io:', error);
    socket = null;
    socketConnected = false;
  }
}

// Initialize socket on module load
initializeSocket();

interface BuzzerButtonProps {
  isProducer: boolean;
  studioId: 'A' | 'B' | 'C' | 'D';
  hideInStudioHeader?: boolean;
}

export default function BuzzerButton({ isProducer, studioId, hideInStudioHeader = false }: BuzzerButtonProps) {
  const [isActive, setIsActive] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const socketConnectedRef = useRef<boolean>(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  // Color scheme based on studio ID
  const studioColors = {
    A: {
      base: "bg-orange-600 hover:bg-orange-700",
      active: "bg-red-600 hover:bg-red-700",
      talent: "bg-orange-500 hover:bg-orange-600",
      talentActive: "bg-red-600 hover:bg-red-700"
    },
    B: {
      base: "bg-green-600 hover:bg-green-700",
      active: "bg-red-600 hover:bg-red-700", 
      talent: "bg-green-500 hover:bg-green-600",
      talentActive: "bg-red-600 hover:bg-red-700"
    },
    C: {
      base: "bg-blue-600 hover:bg-blue-700",
      active: "bg-red-600 hover:bg-red-700", 
      talent: "bg-blue-500 hover:bg-blue-600",
      talentActive: "bg-red-600 hover:bg-red-700"
    },
    D: {
      base: "bg-purple-600 hover:bg-purple-700",
      active: "bg-red-600 hover:bg-red-700", 
      talent: "bg-purple-500 hover:bg-purple-600",
      talentActive: "bg-red-600 hover:bg-red-700"
    }
  };

  // Generate IDs for this buzzer to use with Socket.io
  const senderId = isProducer ? `producer-${studioId}` : `talent-${studioId}`;
  const receiverId = isProducer ? `talent-${studioId}` : `producer-${studioId}`;

  // Listen for buzz events with prioritized HTTP communication
  useEffect(() => {
    console.log(`BuzzerButton: Setting up listener for ${isProducer ? 'producer' : 'talent'} in Studio ${studioId}`);
    
    // Handler for receiving buzzes via Socket.io
    const handleBuzz = (data: any) => {
      console.log(`BuzzerButton: Received buzz via Socket.io:`, data);
      
      // Only react to buzzes meant for our studio
      if (data.studioId === studioId) {
        // Update local state
        setIsActive(data.activate);
        
        if (data.activate) {
          setIsBlinking(true);
          
          // Show a toast notification
          toast({
            title: isProducer 
              ? `Studio ${studioId} is buzzing you!` 
              : "Producer is buzzing you!",
            description: "Someone needs your attention!",
            duration: 5000,
          });
          
          // Play a sound effect if available
          try {
            const audio = new Audio('/sound/buzz.mp3');
            audio.volume = 0.5;
            audio.play().catch(e => console.log('Audio play error (can be ignored):', e));
          } catch (e) {
            // Ignore audio errors - they're not critical
          }
        } else {
          // Always ensure blinking stops when we receive a deactivation signal
          setIsBlinking(false);
          console.log('BuzzerButton: Stopping blinking due to Socket.io deactivation signal');
        }
      }
    };
    
    // Function to start polling - ensures we have only one polling interval
    const startPolling = () => {
      // Clear any existing polling interval first
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
      
      // Setup HTTP polling for buzzer status
      const apiEndpoint = isProducer 
        ? `/api/studio/buzzer-status?studioId=${studioId}&role=producer` 
        : `/api/studio/buzzer-status?studioId=${studioId}&role=talent`;
      
      console.log(`BuzzerButton: Starting HTTP polling from ${apiEndpoint}`);
      
      pollTimerRef.current = setInterval(() => {
        // Add a timestamp to prevent caching
        const timestampedEndpoint = `${apiEndpoint}&ts=${Date.now()}`;
        
        fetch(timestampedEndpoint)
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error ${response.status}`);
            }
            return response.json();
          })
          .then(data => {
            // Check for changes in active state or if we need to force-update blinking state
            if (data.isActive !== undefined) {
              // If state changed OR we need to ensure blinking stops when server says inactive
              if (data.isActive !== isActive || (isBlinking && !data.isActive)) {
                console.log(`BuzzerButton: State changed - updating to ${data.isActive}`);
                setIsActive(data.isActive);
                
                if (data.isActive) {
                  setIsBlinking(true);
                  
                  // Show a toast notification
                  toast({
                    title: isProducer 
                      ? `Studio ${studioId} is buzzing you!` 
                      : "Producer is buzzing you!",
                    description: "Someone needs your attention!",
                    duration: 5000,
                  });
                  
                  // Play a sound effect if available
                  try {
                    const audio = new Audio('/sound/buzz.mp3');
                    audio.volume = 0.5;
                    audio.play().catch(e => console.log('Audio play error (can be ignored):', e));
                  } catch (e) {
                    // Ignore audio errors - they're not critical
                  }
                } else {
                  // Ensure blinking stops when inactive
                  setIsBlinking(false);
                  console.log('BuzzerButton: Stopping blinking as server indicates inactive state');
                }
              }
            }
          })
          .catch(error => {
            console.error('BuzzerButton: Error polling buzzer status:', error);
          });
      }, 1000); // Poll every 1 second for more reliability
    };
    
    // Always start with polling - it's more reliable
    startPolling();
    
    // Try to setup Socket.io as a supplement (if it works)
    if (socket) {
      try {
        // Listen for Socket.io events
        socket.on('buzz', handleBuzz);
        socket.on('talentBuzzer', handleBuzz);
        socket.on('producerBuzzer', handleBuzz);
        
        socket.on('connect', () => {
          socketConnectedRef.current = true;
        });
        
        socket.on('disconnect', () => {
          socketConnectedRef.current = false;
        });
      } catch (error) {
        console.error('BuzzerButton: Error setting up Socket.io listeners:', error);
      }
    }
    
    // Clean up on unmount
    return () => {
      // Clear the polling interval
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
      
      // Clear any button deactivation timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Remove Socket.io listeners
      if (socket) {
        try {
          socket.off('buzz', handleBuzz);
          socket.off('talentBuzzer', handleBuzz);
          socket.off('producerBuzzer', handleBuzz);
        } catch (error) {
          console.error('BuzzerButton: Error removing Socket.io listeners:', error);
        }
      }
    };
  }, [isProducer, studioId, senderId, isActive, isBlinking, toast]);

  // Handle buzzer button click
  const handleBuzzerClick = () => {
    // Toggle the active state
    const newActiveState = !isActive;
    
    // Update UI state
    setIsActive(newActiveState);
    setIsBlinking(newActiveState);
    
    // Set up timeout to automatically disable after 10 seconds
    if (newActiveState) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        console.log('BuzzerButton: Auto-timeout triggered after 10 seconds');
        
        // Force update both states to ensure the button stops blinking
        setIsActive(false);
        setIsBlinking(false);
        
        // Also send deactivation signal to server
        const apiEndpoint = isProducer ? '/api/studio/buzz-talent' : '/api/studio/buzz-producer';
        
        fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studioId, activate: false })
        })
        .then(response => response.json())
        .then(data => {
          console.log('BuzzerButton: Auto-deactivation successful:', data);
          // Double-check that states are reset
          setIsActive(false);
          setIsBlinking(false);
        })
        .catch(error => {
          console.error('BuzzerButton: Error with auto-deactivation:', error);
        });
      }, 10000); // Auto-deactivate after 10 seconds
      
      // Show appropriate toast
      if (isProducer) {
        toast({
          title: "Buzzer Activated",
          description: `Talent Studio ${studioId} has been notified`,
          variant: "default",
          duration: 4000
        });
      } else {
        toast({
          title: "Producer Notified",
          description: "Your producer has been buzzed",
          variant: "default",
          duration: 4000
        });
      }
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Show appropriate toast for deactivation
      if (isProducer) {
        toast({
          title: "Buzzer Deactivated",
          description: `Talent Studio ${studioId} notification stopped`,
          variant: "default",
          duration: 3000
        });
      } else {
        toast({
          title: "Buzzer Deactivated",
          description: "Producer notification stopped",
          variant: "default",
          duration: 3000
        });
      }
    }
    
    // Primary approach: Send HTTP request to server (which will handle broadcast)
    const apiEndpoint = isProducer ? '/api/studio/buzz-talent' : '/api/studio/buzz-producer';
    
    console.log(`BuzzerButton: Sending HTTP request to ${apiEndpoint} (${newActiveState ? 'activate' : 'deactivate'})`);
    
    fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studioId, activate: newActiveState })
    })
    .then(response => response.json())
    .then(data => {
      console.log('BuzzerButton: HTTP request successful:', data);
    })
    .catch(error => {
      console.error('BuzzerButton: Error with HTTP request:', error);
      
      // Show error toast if HTTP request fails
      toast({
        title: 'Connection Issue',
        description: 'Having trouble reaching the server. Please try again.',
        variant: 'destructive',
      });
    });
    
    // Secondary approach: Try Socket.io as well for redundancy
    if (socket && socketConnectedRef.current) {
      try {
        console.log(`BuzzerButton: Also sending via Socket.io from ${senderId} to ${receiverId}`);
        
        socket.emit('buzz', {
          from: senderId,
          to: receiverId,
          studioId: studioId,
          activate: newActiveState
        });
      } catch (error) {
        console.error('BuzzerButton: Socket.io error:', error);
        // HTTP is already our primary approach, so we can ignore Socket.io errors
      }
    }
  };

  // Classes for the buzzer button
  const baseClasses = "relative";
  
  // Producer classes for integrated countdown view
  const producerClasses = isBlinking
    ? "animate-[buzzer_1s_ease-in-out_infinite] bg-red-600 border-none text-white"
    : isActive 
      ? "bg-red-600 text-white border-none" 
      : `bg-transparent text-white border-none ${
          studioId === 'A' ? 'hover:bg-[#c06f28]' :
          studioId === 'B' ? 'hover:bg-[#2D7D27]' :
          studioId === 'C' ? 'hover:bg-[#2563EB]' :
          'hover:bg-[#7C3AED]'
        }`;
  
  // Talent view classes
  const talentClasses = isBlinking 
    ? "animate-[buzzer_1s_ease-in-out_infinite] bg-red-600 border-2 border-yellow-400 text-white" 
    : isActive
      ? studioColors[studioId].talentActive + " text-white"
      : studioColors[studioId].talent + " text-white";
  
  // This effect ensures that blinking is forcibly stopped after 10 seconds, 
  // regardless of other component interactions
  useEffect(() => {
    let blinkingTimeoutRef: NodeJS.Timeout | null = null;
    
    if (isBlinking) {
      // Set up a timeout that will forcibly stop blinking after 10 seconds
      blinkingTimeoutRef = setTimeout(() => {
        console.log('BuzzerButton: Force stopping blinking after 10 seconds');
        setIsBlinking(false);
        setIsActive(false);
      }, 10000);
    }
    
    // Clean up the timeout if component unmounts or state changes
    return () => {
      if (blinkingTimeoutRef) {
        clearTimeout(blinkingTimeoutRef);
      }
    };
  }, [isBlinking]);

  // Apply the animation style for both producer and talent - strong identical flashing
  const animationStyle = isBlinking ? {
    animation: "buzzer 0.5s step-end infinite",
    transition: "none",
    borderWidth: "2px",
  } : {};

  // Return null if this buzzer should be hidden in studio header
  if (hideInStudioHeader) {
    return null;
  }

  return (
    <div className={isProducer ? "flex justify-center w-full h-full" : "flex justify-center w-full h-full"}>
      {isProducer ? (
        // Producer buzzer in countdown header - ENLARGED
        <Button
          size="lg"
          variant="ghost"
          className={`${baseClasses} ${producerClasses} h-full w-full px-4 text-lg font-medium rounded-sm flex items-center justify-center`}
          style={animationStyle}
          onClick={handleBuzzerClick}
          disabled={false}
        >
          {isBlinking ? (
            <BellRing className="mr-2 h-6 w-6 animate-ping" />
          ) : isActive ? (
            <BellRing className="mr-2 h-6 w-6" />
          ) : (
            <Bell className="mr-2 h-6 w-6" />
          )}
          <span className="whitespace-nowrap text-center font-semibold">
            {isBlinking ? `Buzzing Talent ${studioId}` : `Buzz Talent ${studioId}`}
          </span>
        </Button>
      ) : (
        // Talent view buzzer
        <Button
          size="lg"
          variant="default"
          className={`${baseClasses} ${talentClasses} w-auto h-auto mx-auto shadow-lg border-2 px-10 py-5 text-lg`}
          style={animationStyle}
          onClick={handleBuzzerClick}
          disabled={false}
        >
          {isBlinking ? (
            <>
              <BellRing className="mr-3 h-7 w-7 animate-ping" />
              <span className="whitespace-nowrap">Producer Buzzing Studio {studioId}</span>
            </>
          ) : isActive ? (
            <>
              <BellRing className="mr-3 h-7 w-7" />
              <span className="whitespace-nowrap">Buzzing Producer</span>
            </>
          ) : (
            <>
              <Bell className="mr-3 h-7 w-7" />
              <span className="whitespace-nowrap">Buzz Producer</span>
            </>
          )}
        </Button>
      )}
    </div>
  );
}
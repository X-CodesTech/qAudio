import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, BellRing } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import io, { Socket } from 'socket.io-client';

// Create a shared Socket.io instance
// We'll use HTTP-first approach with Socket.io as backup
let socket: Socket | null = null;
let socketInitialized = false;
let socketConnected = false;

// Initialize the socket connection
function initializeSocket() {
  if (socketInitialized) return;
  
  try {
    console.log('SocketBuzzer: Initializing Socket.io connection');
    
    // The protocol and host are determined dynamically
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    const host = window.location.host;
    
    // Create socket with robust reconnection options
    socket = io(`${protocol}//${host}`, {
      path: '/socket.io',
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
      transports: ['websocket', 'polling'] // Try WebSocket first, then polling
    });
    
    // Log socket connection events
    socket.on('connect', () => {
      console.log('SocketBuzzer: Socket.io connected with ID:', socket?.id);
      socketConnected = true;
      (window as any).socketIoConnected = true;
    });
    
    socket.on('connect_error', (error: any) => {
      console.error('SocketBuzzer: Socket.io connection error:', error);
      socketConnected = false;
      (window as any).socketIoConnected = false;
    });
    
    socket.on('disconnect', (reason: string) => {
      console.log('SocketBuzzer: Socket.io disconnected:', reason);
      socketConnected = false;
      (window as any).socketIoConnected = false;
    });
    
    socketInitialized = true;
  } catch (error) {
    console.error('SocketBuzzer: Failed to initialize Socket.io connection:', error);
    socket = null;
    socketConnected = false;
    (window as any).socketIoConnected = false;
  }
}

// Initialize socket on module load - but we'll primarily use HTTP
initializeSocket();

type SocketBuzzerProps = {
  isProducer: boolean;
  studioId: 'A' | 'B';
  hideInStudioHeader?: boolean;
};

export default function SocketBuzzer({ 
  isProducer, 
  studioId, 
  hideInStudioHeader = false 
}: SocketBuzzerProps) {
  const { t } = useTranslation();
  const [isActive, setIsActive] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  
  // Generate IDs for this buzzer
  const senderId = isProducer ? `producer-${studioId}` : `talent-${studioId}`;
  const receiverId = isProducer ? `talent-${studioId}` : `producer-${studioId}`;
  
  // Use a ref to store the polling timer
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const socketConnectedRef = useRef<boolean>(false);
  
  // Listen for buzz events with prioritized HTTP communication
  useEffect(() => {
    console.log(`SocketBuzzer: Setting up listener for ${isProducer ? 'producer' : 'talent'} in Studio ${studioId}`);
    
    // Handler for receiving buzzes via Socket.io
    const handleBuzz = (data: { from: string; to: string; active: boolean }) => {
      console.log(`SocketBuzzer: Received buzz from ${data.from} to ${data.to}`, data);
      
      // Only react to buzzes meant for us
      if (data.to === senderId) {
        setIsActive(data.active);
        if (data.active) {
          setIsBlinking(true);
          
          // Show a toast notification
          toast({
            title: isProducer 
              ? `Studio ${studioId} is buzzing you!` 
              : "Producer is buzzing you!",
            description: "Someone needs your attention!",
          });
        }
      }
    };
    
    // Handler for Socket.io connection success
    const handleConnect = () => {
      console.log('SocketBuzzer: Socket.io connected successfully');
      socketConnectedRef.current = true;
    };
    
    // Handler for Socket.io connection failure
    const handleConnectError = (err: any) => {
      console.error('SocketBuzzer: Socket.io connection error:', err);
      socketConnectedRef.current = false;
      
      // Ensure we start polling if Socket.io fails
      startPolling();
    };
    
    // Handler for Socket.io disconnection
    const handleDisconnect = (reason: string) => {
      console.log('SocketBuzzer: Socket.io disconnected:', reason);
      socketConnectedRef.current = false;
      
      // Ensure we start polling if Socket.io disconnects
      startPolling();
    };
    
    // Function to start polling - ensures we have only one polling interval
    const startPolling = () => {
      // Clear any existing polling interval first
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
      
      // Setup HTTP polling - check for buzzer status every 1 second
      const apiEndpoint = isProducer 
        ? `/api/studio/buzzer-status?studioId=${studioId}&role=producer` 
        : `/api/studio/buzzer-status?studioId=${studioId}&role=talent`;
      
      console.log(`SocketBuzzer: Starting HTTP polling from ${apiEndpoint}`);
      
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
            // Less frequent logging to reduce console spam
            if (data.isActive) {
              console.log(`SocketBuzzer: Received poll response:`, data);
            }
            
            // Only update if the state has changed
            if (data.isActive !== undefined && data.isActive !== isActive) {
              console.log(`SocketBuzzer: State changed - updating to ${data.isActive}`);
              setIsActive(data.isActive);
              
              if (data.isActive) {
                setIsBlinking(true);
                // Show a toast notification
                toast({
                  title: isProducer 
                    ? `Studio ${studioId} is buzzing you!` 
                    : "Producer is buzzing you!",
                  description: "Someone needs your attention!",
                  duration: 5000, // 5 second notification
                });
                
                // Play a sound effect if available
                try {
                  const audio = new Audio('/sound/buzz.mp3');
                  audio.volume = 0.5;
                  audio.play().catch(e => console.log('Audio play error (can be ignored):', e));
                } catch (e) {
                  // Ignore audio errors - they're not critical
                }
              }
            }
          })
          .catch(error => {
            console.error('SocketBuzzer: Error polling buzzer status:', error);
          });
      }, 1000); // Poll every 1 second for more reliability
    };
    
    // Always start with polling - it's more reliable
    startPolling();
    
    // Try to setup Socket.io as a supplement (if it works)
    if (socket) {
      try {
        socket.on('connect', handleConnect);
        socket.on('connect_error', handleConnectError);
        socket.on('disconnect', handleDisconnect);
        socket.on('buzz', handleBuzz);
      } catch (error) {
        console.error('SocketBuzzer: Error setting up Socket.io listeners:', error);
        // Polling is already active as a fallback
      }
    }
    
    // Clean up on unmount
    return () => {
      console.log('SocketBuzzer: Cleaning up listeners');
      
      // Clear the polling interval
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      
      // Remove Socket.io listeners if socket exists
      if (socket) {
        try {
          socket.off('connect', handleConnect);
          socket.off('connect_error', handleConnectError);
          socket.off('disconnect', handleDisconnect);
          socket.off('buzz', handleBuzz);
        } catch (error) {
          console.error('SocketBuzzer: Error cleaning up Socket.io listeners:', error);
        }
      }
    };
  }, [isProducer, studioId, senderId, isActive]);
  
  // Handle button press to send a buzz - prioritizing HTTP which is more reliable
  const handleBuzzerClick = () => {
    const newState = !isActive;
    
    // Update local state
    setIsActive(newState);
    if (newState) {
      setIsBlinking(true);
    }
    
    // Primary approach: Reliable HTTP request
    const apiEndpoint = isProducer ? '/api/studio/buzz-talent' : '/api/studio/buzz-producer';
    console.log(`SocketBuzzer: Sending HTTP request to ${apiEndpoint} (${newState ? 'activate' : 'deactivate'})`);
    
    fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studioId, activate: newState })
    })
    .then(response => response.json())
    .then(data => {
      console.log('SocketBuzzer: HTTP request successful:', data);
    })
    .catch(error => {
      console.error('SocketBuzzer: Error with HTTP request:', error);
      
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
        console.log(`SocketBuzzer: Also sending via Socket.io from ${senderId} to ${receiverId}`);
        
        socket.emit('buzz', {
          from: senderId,
          to: receiverId,
          active: newState,
          studioId: studioId
        });
      } catch (error) {
        console.error('SocketBuzzer: Socket.io error:', error);
        // HTTP is already our primary approach, so we can ignore Socket.io errors
      }
    }
    
    // Show a toast notification on activation
    if (newState) {
      toast({
        title: isProducer ? `Buzzing Studio ${studioId}` : 'Buzzing Producer',
        description: 'Buzzer activated for 5 seconds',
      });
      
      // Auto-deactivate after 5 seconds
      setTimeout(() => {
        // Update local state
        setIsActive(false);
        setIsBlinking(false);
        
        // Send deactivation via HTTP (primary)
        fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studioId, activate: false })
        })
        .then(response => response.json())
        .then(data => {
          console.log('SocketBuzzer: HTTP deactivation successful:', data);
        })
        .catch(error => {
          console.error('SocketBuzzer: Error with HTTP deactivation:', error);
        });
        
        // Also try Socket.io for deactivation (secondary)
        if (socket && socketConnectedRef.current) {
          try {
            socket.emit('buzz', {
              from: senderId,
              to: receiverId,
              active: false,
              studioId: studioId
            });
          } catch (error) {
            console.error('SocketBuzzer: Socket.io deactivation error:', error);
            // HTTP is our primary approach, so we can ignore Socket.io errors
          }
        }
      }, 5000);
    }
  };
  
  // Hide if requested
  if (hideInStudioHeader) {
    return null;
  }

  // Define animation style for the buzzer
  const animationStyle = isBlinking ? {
    animation: 'buzzer 0.6s ease-in-out infinite'
  } : {};

  // Color classes based on studio
  const studioColorClasses = studioId === 'A' 
    ? 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white' 
    : 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white';

  // Base classes for all buttons
  const baseClasses = 'flex items-center justify-center rounded-md transition-all duration-200';
  
  // Classes specific to producer or talent buttons
  const producerClasses = 'max-w-full';
  const talentClasses = 'bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-white';

  return (
    <div className="flex justify-center w-full">
      {isProducer ? (
        // Producer view buzzer
        <Button
          size="lg"
          variant="default"
          className={`${baseClasses} ${producerClasses} ${isActive || isBlinking ? 'bg-red-600 text-white' : studioColorClasses}`}
          style={animationStyle}
          onClick={handleBuzzerClick}
        >
          {isActive || isBlinking ? (
            <>
              <BellRing className="mr-2 h-6 w-6 animate-ping" />
              <span className="whitespace-nowrap text-center font-semibold">{t('studios.buzzingTalent')}</span>
            </>
          ) : (
            <>
              <Bell className="mr-2 h-6 w-6" />
              <span className="whitespace-nowrap text-center font-semibold">{t('studios.buzzTalent')}</span>
            </>
          )}
        </Button>
      ) : (
        // Talent view buzzer
        <Button
          size="lg"
          variant="default"
          className={`${baseClasses} ${talentClasses} w-auto h-auto mx-auto shadow-lg border-2 px-10 py-5 text-lg`}
          style={animationStyle}
          onClick={handleBuzzerClick}
        >
          {isBlinking ? (
            <>
              <BellRing className="mr-3 h-7 w-7 animate-ping" />
              <span className="whitespace-nowrap">{t('studios.fromProducer')}</span>
            </>
          ) : isActive ? (
            <>
              <BellRing className="mr-3 h-7 w-7" />
              <span className="whitespace-nowrap">{t('studios.buzzingProducer')}</span>
            </>
          ) : (
            <>
              <Bell className="mr-3 h-7 w-7" />
              <span className="whitespace-nowrap">{t('studios.buzzProducer')}</span>
            </>
          )}
        </Button>
      )}
    </div>
  );
}
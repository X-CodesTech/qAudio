import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo, useRef } from 'react';
import { setupSIPConnection, initSIP, SIPStatus } from '@/lib/sip';
import { setupAudioDevices, getAudioDevices } from '@/lib/audio';
import { AudioDevice, AudioRouteConfig, CallLine, CallStatus, Contact } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

type VoIPContextType = {
  callLines: CallLine[];
  audioRouting: AudioRouteConfig[];
  sipStatus: 'connected' | 'disconnected' | 'connecting';
  sipServer: string;
  selectedLine: CallLine | null;
  websocket: WebSocket | null;
  
  // Methods
  initializeVoIP: () => Promise<void>;
  makeCall: (lineId: number) => void;
  makeOutboundCall: (lineId: number, phoneNumber: string) => void;
  hangupCall: (lineId: number) => void;
  holdCall: (lineId: number) => void;
  sendToAir: (lineId: number) => void;
  takeOffAir: (lineId: number) => void;
  addNoteToCall: (lineId: number, note: string) => void;
  updateAudioRouting: (lineId: number, outputChannel: string) => void;
  setSelectedLine: (line: CallLine | null) => void;
  getAudioDevices: () => Promise<AudioDevice[]>;
  saveToPhoneBook: (lineId: number, callerName?: string) => Promise<void>;
};

// Create a hook to easily access the VoIP context
export const useVoIP = () => {
  const context = useContext(VoIPContext);
  if (!context) {
    throw new Error('useVoIP must be used within a VoIPProvider');
  }
  return context;
};

export const VoIPContext = createContext<VoIPContextType>({
  callLines: [],
  audioRouting: [],
  sipStatus: 'disconnected',
  sipServer: '',
  selectedLine: null,
  websocket: null,
  
  initializeVoIP: async () => {},
  makeCall: () => {},
  makeOutboundCall: () => {},
  hangupCall: () => {},
  holdCall: () => {},
  sendToAir: () => {},
  takeOffAir: () => {},
  addNoteToCall: () => {},
  updateAudioRouting: () => {},
  setSelectedLine: () => {},
  getAudioDevices: async () => [],
  saveToPhoneBook: async () => {},
});

type VoIPProviderProps = {
  children: ReactNode;
};

export const VoIPProvider = ({ children }: VoIPProviderProps) => {
  // Add some simulation calls for demonstration purposes
  const [callLines, setCallLines] = useState<CallLine[]>([
    // Studio A Lines (1-4) with simulation calls
    { 
      id: 1, 
      status: 'on-air', 
      studio: 'A',
      phoneNumber: '+1 (555) 123-4567',
      startTime: new Date(Date.now() - 425000), // 7 min 5 sec ago
      contact: {
        id: 1,
        name: 'John Smith',
        phone: '+1 (555) 123-4567',
        isFrequentCaller: true,
        location: null,
        notes: null
      },
      notes: 'Talking about the recent city council meeting'
    },
    { 
      id: 2, 
      status: 'active', 
      studio: 'A',
      phoneNumber: '+1 (555) 765-4321',
      startTime: new Date(Date.now() - 186000), // 3 min 6 sec ago
      contact: {
        id: 2,
        name: 'Sarah Johnson',
        phone: '+1 (555) 765-4321',
        isFrequentCaller: false,
        location: null,
        notes: null
      }
    },
    { 
      id: 3, 
      status: 'holding', 
      studio: 'A',
      phoneNumber: '+1 (555) 987-6543',
      startTime: new Date(Date.now() - 65000), // 1 min 5 sec ago
      contact: {
        id: 3,
        name: 'David Miller',
        phone: '+1 (555) 987-6543',
        isFrequentCaller: false,
        location: null,
        notes: null
      },
      notes: 'Has question about traffic report'
    },
    { id: 4, status: 'inactive', studio: 'A' },
    
    // Studio B Lines (5-8) with one simulation call
    { 
      id: 5, 
      status: 'on-air', 
      studio: 'B',
      phoneNumber: '+1 (555) 555-5555',
      startTime: new Date(Date.now() - 305000), // 5 min 5 sec ago
      contact: {
        id: 4,
        name: 'Michael Williams',
        phone: '+1 (555) 555-5555',
        isFrequentCaller: true,
        location: null,
        notes: null
      },
      notes: 'Discussing local sports team'
    },
    { id: 6, status: 'inactive', studio: 'B' },
    { id: 7, status: 'inactive', studio: 'B' },
    { id: 8, status: 'inactive', studio: 'B' }
  ]);
  const [audioRouting, setAudioRouting] = useState<AudioRouteConfig[]>([]);
  const [sipStatus, setSipStatus] = useState<SIPStatus>('disconnected');
  const [sipServer, setSipServer] = useState<string>('sip.illyvoip.com');
  const [selectedLine, setSelectedLine] = useState<CallLine | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const { toast } = useToast();
  const [hasSipInitialized, setHasSipInitialized] = useState(false);
  const [lastToastTime, setLastToastTime] = useState<number>(0);
  const [toastErrorHistory, setToastErrorHistory] = useState<{[key: string]: number}>({});
  const toastDebounceTimeMs = 30000; // Show toast messages at most once every 30 seconds
  const errorToastDebounceTimeMs = 120000; // Show error toast messages at most once every 2 minutes
  
  // Debounced toast function to prevent too many notifications
  const showDebouncedToast = useCallback((toastData: { title: string, description: string, variant?: 'default' | 'destructive' }) => {
    const now = Date.now();
    const isErrorToast = toastData.variant === 'destructive';
    const debounceTime = isErrorToast ? errorToastDebounceTimeMs : toastDebounceTimeMs;
    
    // For error toasts, check if the same title has been shown recently
    if (isErrorToast) {
      const lastErrorTime = toastErrorHistory[toastData.title] || 0;
      if (now - lastErrorTime < errorToastDebounceTimeMs) {
        console.log(`Error toast suppressed (debounced): ${toastData.title}`);
        return;
      }
      
      // Update the error history
      setToastErrorHistory(prev => ({
        ...prev,
        [toastData.title]: now
      }));
    }
    
    // Check general toast debounce
    if (now - lastToastTime > debounceTime) {
      toast(toastData);
      setLastToastTime(now);
    } else {
      console.log(`Toast suppressed (debounced): ${toastData.title}`);
    }
  }, [toast, lastToastTime, toastDebounceTimeMs, errorToastDebounceTimeMs, toastErrorHistory]);

  // Track consecutive data load failures to avoid overwhelming the user with error messages
  const [consecutiveDataFailures, setConsecutiveDataFailures] = useState<number>(0);
  
  // Define fetchInitialData first before it's used in any other functions or effects
  const fetchInitialData = useCallback(async () => {
    try {
      console.log("Fetching initial data for VoIP context...");
      let fetchSuccess = false;
      
      // Fetch call lines
      try {
        const callLinesResponse = await fetch('/api/call-lines');
        if (callLinesResponse.ok) {
          const callLinesData = await callLinesResponse.json();
          setCallLines(callLinesData);
          fetchSuccess = true;
        }
      } catch (callLinesError) {
        console.error('Error fetching call lines:', callLinesError);
        // Continue with other fetches even if this one fails
      }
      
      // Fetch audio routing
      try {
        const routingResponse = await fetch('/api/audio-routing');
        if (routingResponse.ok) {
          const routingData = await routingResponse.json();
          setAudioRouting(routingData);
          fetchSuccess = true;
        }
      } catch (routingError) {
        console.error('Error fetching audio routing:', routingError);
        // Continue with other fetches even if this one fails
      }
      
      // Fetch SIP config
      try {
        const sipConfigResponse = await fetch('/api/sip-config');
        if (sipConfigResponse.ok) {
          const sipConfigData = await sipConfigResponse.json();
          if (sipConfigData && sipConfigData.length > 0) {
            // Prioritize illyvoip.com (the real server) if it exists
            const realSipConfig = sipConfigData.find(
              (config: { sipServer: string }) => config.sipServer === 'sip.illyvoip.com'
            );
            
            if (realSipConfig) {
              console.log('Using real SIP server configuration (illyvoip.com)');
              setSipServer(realSipConfig.sipServer);
            } else {
              console.log('Real SIP server configuration not found, using first config');
              setSipServer(sipConfigData[0].sipServer);
            }
            fetchSuccess = true;
          }
        }
      } catch (sipConfigError) {
        console.error('Error fetching SIP config:', sipConfigError);
        // Continue even if this fails
      }
      
      // Update consecutive failures count based on success
      if (fetchSuccess) {
        setConsecutiveDataFailures(0);
        console.log("Initial data loaded:", "success");
        return true;
      } else {
        setConsecutiveDataFailures(prev => prev + 1);
        console.log("Initial data loaded:", "failed");
        
        // Only show toast after multiple consecutive failures
        // This avoids error messages during normal reconnection attempts
        if (consecutiveDataFailures >= 2) {
          showDebouncedToast({
            title: 'Connection Error',
            description: 'Failed to fetch data from server.',
            variant: 'destructive',
          });
        }
        return false;
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
      setConsecutiveDataFailures(prev => prev + 1);
      
      // Only show toast on repeated failures to prevent spam
      if (consecutiveDataFailures >= 2) {
        showDebouncedToast({
          title: 'Connection Error',
          description: 'Failed to fetch data from server.',
          variant: 'destructive',
        });
      }
      return false;
    }
  }, [showDebouncedToast, consecutiveDataFailures]);

  // Initialize VoIP system
  const initializeVoIP = useCallback(async () => {
    // Avoid re-initializing if already done
    if (hasSipInitialized && sipStatus === 'connected') {
      return;
    }
    
    try {
      // Fetch initial data
      await fetchInitialData();
      
      // Only change status to connecting if we're not already connected
      if (sipStatus !== 'connected') {
        setSipStatus('connecting');
      }
      
      // Get real SIP account information from server status
      interface RealSipAccount {
        server: string;
        username: string;
        id: number;
        password?: string;
      }
      
      let realSipAccount: RealSipAccount | null = null;
      try {
        const sipStatusResponse = await fetch('/api/sip-status');
        if (sipStatusResponse.ok) {
          const sipStatusData = await sipStatusResponse.json();
          if (sipStatusData.registered && sipStatusData.account) {
            realSipAccount = {
              server: sipStatusData.account.server,
              username: sipStatusData.account.username,
              id: sipStatusData.account.id
            };
            console.log("Using real SIP account for calls:", realSipAccount.username);
            
            // Get the SIP password from configuration
            const sipConfigResponse = await fetch('/api/sip-config');
            if (sipConfigResponse.ok) {
              const sipConfigData = await sipConfigResponse.json();
              const matchingConfig = sipConfigData.find(
                (config: { username: string }) => config.username === realSipAccount?.username
              );
              
              if (matchingConfig) {
                realSipAccount.password = matchingConfig.password;
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to get real SIP account information:", error);
      }
      
      // Initialize SIP only if not already connected
      if (!hasSipInitialized || sipStatus !== 'connected') {
        let sipInitialized = false;
        
        if (realSipAccount) {
          // Use the real SIP account for initialization
          console.log(`Initializing SIP with real account on ${realSipAccount.server}`);
          sipInitialized = await setupSIPConnection({
            server: realSipAccount.server,
            username: realSipAccount.username,
            password: realSipAccount.password || "",
          });
          
          // Update the SIP server for display
          setSipServer(realSipAccount.server);
        } else {
          // Fallback to demo server
          sipInitialized = await initSIP(sipServer);
        }
        
        setSipStatus(sipInitialized ? 'connected' : 'disconnected');
        setHasSipInitialized(true);
      }
      
      // Initialize audio devices
      await setupAudioDevices();
      
      if (sipStatus === 'disconnected') {
        showDebouncedToast({
          title: 'SIP Connection Failed',
          description: 'Could not connect to SIP server.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error initializing VoIP:', error);
      setSipStatus('disconnected');
      showDebouncedToast({
        title: 'Initialization Error',
        description: 'Failed to initialize VoIP system.',
        variant: 'destructive',
      });
    }
  }, [fetchInitialData, sipServer, showDebouncedToast, sipStatus, hasSipInitialized]);

  // Track reconnection attempts
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Initialize WebSocket connection
  useEffect(() => {
    // Only initialize if socket is null (first load or needs reconnection)
    if (socket === null) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log(`Initializing WebSocket connection to: ${wsUrl} (attempt ${reconnectAttempts + 1})`);
      
      // Generate a unique client ID for this session that persists across reconnects
      const storedClientId = sessionStorage.getItem('websocket_client_id');
      const uniqueClientId = storedClientId || `client-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      
      // Store the client ID in session storage for reconnects
      if (!storedClientId) {
        sessionStorage.setItem('websocket_client_id', uniqueClientId);
      }
      
      // Create new WebSocket with multiple retry attempts
      const ws = new WebSocket(wsUrl);
      
      // Track the connection time for monitoring
      const connectionTime = Date.now();
      
      // Store metadata directly on the WebSocket instance
      (ws as any).clientId = uniqueClientId;
      (ws as any).connectionTime = connectionTime;
      (ws as any).lastActivity = connectionTime;
      (ws as any).role = 'playout'; // Use playout role for radio automation system
      
      // Multiple timeouts to handle various stages of connection (connect, auth, initial data)
      // Connect timeout - ensures the socket opens and authenticates
      const connectionTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          console.log('WebSocket connection timeout after 30s - closing socket');
          try {
            ws.close();
          } catch (err) {
            console.error('Error closing WebSocket:', err);
          }
          // This will trigger the onclose handler which will retry
          showDebouncedToast({
            title: 'Connection Timeout',
            description: 'WebSocket connection timed out. Retrying...',
            variant: 'destructive',
          });
        } else if (!(ws as any).isAuthAttempted) {
          // If socket is open but auth hasn't been attempted yet, something is wrong
          console.log('WebSocket opened but authentication not attempted after 30s - closing socket');
          try {
            ws.close();
          } catch (err) {
            console.error('Error closing WebSocket during auth timeout:', err);
          }
        }
      }, 30000);
      
      // Auth verification timeout - ensures the auth response is received
      const authTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN && (ws as any).isAuthAttempted && !(ws as any).successfulAuth) {
          console.log('WebSocket authentication response not received after 10s - closing socket');
          try {
            ws.close();
          } catch (err) {
            console.error('Error closing WebSocket during auth verification timeout:', err);
          }
          showDebouncedToast({
            title: 'Authentication Timeout',
            description: 'WebSocket authentication timed out. Retrying...',
            variant: 'destructive',
          });
        }
      }, 10000);
      
      // Setup a more aggressive ping interval to keep the connection alive
      // and detect inactive connections
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          try {
            const now = Date.now();
            
            // Check for connection activity timeout (no messages received in 45 seconds)
            if ((ws as any).lastActivity && (now - (ws as any).lastActivity > 45000)) {
              console.warn('Connection appears inactive - no activity for 45 seconds, closing socket');
              try {
                ws.close(4000, 'Inactivity timeout');
              } catch (err) {
                console.error('Error closing inactive socket:', err);
              }
              
              clearInterval(pingInterval);
              return;
            }
            
            // Send ping to keep connection alive
            ws.send(JSON.stringify({
              type: 'ping',
              clientId: uniqueClientId,
              timestamp: now
            }));
            console.log('Sent ping to keep WebSocket alive');
          } catch (err) {
            console.error('Error sending ping:', err);
            clearInterval(pingInterval);
            
            // Schedule a reconnection if ping fails
            setTimeout(() => {
              if (socket === ws) {
                setSocket(null); // Trigger reconnection
              }
            }, 1000);
          }
        } else if (ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
          // Clean up if the socket is already closed
          clearInterval(pingInterval);
        }
      }, 15000); // More frequent ping - every 15 seconds
      
      ws.onopen = () => {
        console.log('WebSocket connected - preparing authentication');
        clearTimeout(connectionTimeout);
        
        // Reset reconnection attempts on successful connection
        setReconnectAttempts(0);
        
        // Mark the connection time for stable connection monitoring
        (ws as any).connectionTime = Date.now();
        (ws as any).successfulAuth = false; // Will be set to true after auth
        
        // Show a success toast if we had many failed attempts before
        if (reconnectAttempts > 3) {
          showDebouncedToast({
            title: 'Connection Restored',
            description: 'WebSocket connection has been successfully restored.',
            variant: 'default',
          });
        }
        
        // Set a delay before authenticating to ensure socket is stable
        setTimeout(() => {
          if (ws.readyState === WebSocket.OPEN) {
            // Send basic auth info directly - simplified approach
            try {
              ws.send(JSON.stringify({
                type: 'auth',
                role: 'playout',
                clientId: uniqueClientId,
                studioAccess: ['A', 'B'],
                timestamp: Date.now()
              }));
              
              // Track auth attempt status
              (ws as any).isAuthAttempted = true;
              (ws as any).authTimestamp = Date.now();
              
              console.log('WebSocket authentication sent successfully');
              
              // Listen for auth response in onmessage handler
              // We'll mark successful auth there when we get 'auth_success' message
              
              // Request initial data after connection setup
              setTimeout(() => {
                if (ws.readyState === WebSocket.OPEN) {
                  fetchInitialData()
                    .then(success => {
                      console.log('Initial data loaded:', success ? 'success' : 'failed');
                    })
                    .catch(err => {
                      console.error('Failed to load initial data:', err);
                    });
                }
              }, 500);
            } catch (err) {
              console.error('Error during WebSocket authentication:', err);
            }
          } else {
            console.warn('WebSocket not ready for auth, state:', ws.readyState);
          }
        }, 500);
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Update last activity timestamp to show the connection is live
          (ws as any).lastActivity = Date.now();
          
          if (data.type === 'auth_success' || data.type === 'auth_response') {
            console.log('Authentication response received:', data);
            (ws as any).isAuthenticated = true;
            (ws as any).successfulAuth = true;
            (ws as any).authResponseTimestamp = Date.now();
            
            // Reset reconnection attempts counter on successful auth
            if (reconnectAttempts > 3) {
              setReconnectAttempts(0);
              showDebouncedToast({
                title: 'Connection Established',
                description: 'WebSocket connection is now fully authenticated.',
                variant: 'default',
              });
            }
          } else if (data.type === 'auth_error') {
            console.error('Authentication error:', data.message);
            (ws as any).authError = data.message;
            showDebouncedToast({
              title: 'Authentication Error',
              description: data.message || 'Failed to authenticate WebSocket connection.',
              variant: 'destructive',
            });
          } else if (data.type === 'pong') {
            // Silent handling of pong responses
            (ws as any).lastPongReceived = Date.now();
          } else if (data.type === 'init') {
            console.log('Received initial data:', data.data.callLines);
            setCallLines(data.data.callLines);
          } else if (data.type === 'call_line_update') {
            console.log('Received call line update:', data.line);
            // Update the specific line
            setCallLines(prev => prev.map(line => 
              line.id === data.line.id ? data.line : line
            ));
            
            // Update selected line if it's the line that was updated
            if (selectedLine && selectedLine.id === data.line.id) {
              setSelectedLine(data.line);
            }
          } else if (data.type === 'callInfoUpdate') {
            // Handle call info updates from ProducerView
            console.log('Received call info update:', data);
            const { lineId, callerName, callerNotes } = data;
            
            if (!lineId) {
              console.error('Received callInfoUpdate with no lineId:', data);
              return;
            }
            
            // Update the specific line with caller information
            setCallLines(prev => prev.map(line => {
              if (line.id === lineId) {
                return {
                  ...line,
                  contact: callerName || line.contact,
                  notes: callerNotes || line.notes
                };
              }
              return line;
            }));
            
            // Update selected line if it's the line that was updated
            if (selectedLine && selectedLine.id === lineId) {
              setSelectedLine(prev => {
                if (!prev) return null;
                return {
                  ...prev,
                  contact: callerName || prev.contact,
                  notes: callerNotes || prev.notes
                };
              });
            }
            
            // Now also make an API call to persist this info
            apiRequest('PUT', `/api/call-lines/${lineId}`, {
              contact: callerName,
              notes: callerNotes
            }).catch(error => {
              console.error('Error updating call line info via API:', error);
            });
          } else if (data.type === 'levelUpdate') {
            // Handle level updates
            setCallLines(prev => {
              return prev.map(line => {
                if (line.id === data.data.lineId) {
                  return {
                    ...line,
                    levels: data.data.levels
                  };
                }
                return line;
              });
            });
          } else if (data.type === 'talentBuzzer' || data.type === 'producerBuzzer') {
            // Handle buzzer messages
            console.log(`Received ${data.type} message:`, data);
            
            // Dispatch a custom event for other components to react to
            const customEvent = new CustomEvent(data.type === 'talentBuzzer' ? 'talentBuzzerEvent' : 'producerBuzzerEvent', {
              detail: {
                studioId: data.data.studioId,
                activate: data.data.activate
              }
            });
            window.dispatchEvent(customEvent);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        
        // Provide more detailed error logging
        try {
          // Try to cast the error to meaningful data
          const errorData = error as any;
          if (errorData.message) {
            console.error('WebSocket error details:', errorData.message);
          } else if (errorData.error) {
            console.error('WebSocket error details:', errorData.error);
          }
        } catch (e) {
          console.error('Error extracting WebSocket error details:', e);
        }
        
        // Track the error in the WebSocket instance
        (ws as any).hasError = true;
        (ws as any).lastErrorTime = Date.now();
        
        // Don't show toasts on normal WebSocket errors
        // Let the onclose handler decide if a toast should be shown instead
        // This eliminates many duplicate error toasts since error is almost always
        // followed by close event
        
        // Don't immediately reset socket - let the onclose handler handle reconnection
        // The onclose event will fire after an error
      };
      
      ws.onclose = (event) => {
        console.log(`WebSocket disconnected (Code: ${event.code}, Reason: ${event.reason || 'No reason provided'})`);
        
        // Clear any pending timeouts and intervals
        clearTimeout(connectionTimeout);
        clearTimeout(authTimeout);
        clearInterval(pingInterval);
        
        // Check if the browser closed it due to navigation/refresh (code 1001)
        if (event.code === 1001) {
          console.log('Browser navigation or page refresh detected, not attempting reconnection');
          return;
        }
        
        // Get connection duration
        const connectionDuration = (ws as any).connectionTime ? (Date.now() - (ws as any).connectionTime) : 0;
        
        // If there are too many quick disconnects, increase the delay between reconnection attempts
        const hasRepeatedDisconnects = reconnectAttempts > 3 && (connectionDuration < 5000);
        
        // Only show toast notifications in specific situations to reduce frequency:
        // 1. On repeated quick disconnects (more than 3 attempts with connections lasting < 5s)
        // 2. After a previously stable connection disconnects (connected for > 30s)
        // 3. For explicit error codes that indicate a real problem
        const hadStableConnection = connectionDuration > 30000 && (ws as any).successfulAuth;
        const hasExplicitError = event.code === 1006 || event.code === 1011 || event.code === 1012;
        
        // Only show toast in meaningful situations, not for every disconnect
        if (hasRepeatedDisconnects) {
          console.warn('Detected unstable connection with repeated quick disconnects');
          // Show a toast notification after multiple quick disconnections
          showDebouncedToast({
            title: 'Connection Issues',
            description: 'Having trouble with the WebSocket connection. Retrying with increased delays...',
            variant: 'destructive',
          });
        } else if (hadStableConnection) {
          // Only show notification if we had a previously stable connection that disconnected
          showDebouncedToast({
            title: 'Connection Lost',
            description: 'WebSocket connection was lost. Attempting to reconnect...',
            variant: 'destructive',
          });
        } else if (hasExplicitError && (ws as any).hasError && reconnectAttempts > 2) {
          // Only show for explicit error codes and after multiple reconnect attempts
          // This suppresses transient connectivity issues
          showDebouncedToast({
            title: 'Connection Error',
            description: 'Could not establish WebSocket connection. Retrying...',
            variant: 'destructive',
          });
        }
        
        // Increment reconnect attempts and use exponential backoff
        setReconnectAttempts(prevAttempts => {
          const newAttempts = prevAttempts + 1;
          
          // Calculate backoff time with increased delays for unstable connections
          // Normal: 1st: 2s, 2nd: 4s, 3rd: 6s, 4th: 8s, 5th+: 10s
          // Unstable: 1st: 5s, 2nd: 10s, 3rd: 15s, 4th: 20s, 5th+: 30s
          const baseTime = hasRepeatedDisconnects ? 5000 : 2000;
          const maxTime = hasRepeatedDisconnects ? 30000 : 10000;
          const backoffTime = Math.min(baseTime * newAttempts, maxTime);
          
          console.log(`WebSocket reconnect attempt ${newAttempts} scheduled in ${backoffTime}ms`);
          
          // Cancel any existing timeout
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          // Schedule reconnection
          reconnectTimeoutRef.current = setTimeout(() => {
            if (document.visibilityState !== 'hidden') {
              console.log(`Attempting to reconnect WebSocket (attempt ${newAttempts})...`);
              // Reset socket to trigger reconnection in useEffect
              setSocket(null);
            }
          }, backoffTime);
          
          return newAttempts;
        });
      };
      
      setSocket(ws);
    }
    
    // Add event listener for manual reconnection requests
    const handleReconnectRequest = () => {
      console.log('Received request to reconnect WebSocket');
      if (socket) {
        console.log('Closing existing WebSocket connection for reconnection');
        try {
          socket.close();
        } catch (err) {
          console.error('Error closing socket during reconnection request:', err);
        }
      }
      setSocket(null);
    };
    
    // Using type assertion to handle the custom event
    window.addEventListener('requestWebSocketReconnect' as any, handleReconnectRequest);
    
    return () => {
      window.removeEventListener('requestWebSocketReconnect' as any, handleReconnectRequest);
      if (socket) {
        try {
          socket.close();
        } catch (err) {
          console.error('Error closing socket during cleanup:', err);
        }
      }
    };
  }, [socket, selectedLine, fetchInitialData, reconnectAttempts, showDebouncedToast]);

  // Update call line status on the server
  const updateCallLineStatus = useCallback(async (lineId: number, status: CallStatus, additionalData = {}) => {
    try {
      const response = await apiRequest('PUT', `/api/call-lines/${lineId}`, {
        status,
        ...additionalData
      });
      
      if (response.ok) {
        const updatedLine = await response.json();
        
        // Update the call lines
        setCallLines(prev => {
          return prev.map(line => {
            if (line.id === lineId) {
              return updatedLine;
            }
            return line;
          });
        });
        
        // Update selected line if it's the one that changed
        if (selectedLine && selectedLine.id === lineId) {
          setSelectedLine(updatedLine);
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error updating call line status:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update call status.',
        variant: 'destructive',
      });
      return false;
    }
  }, [selectedLine, toast]);
  
  // Make a new call
  const makeCall = useCallback((lineId: number) => {
    toast({
      title: 'Dialer Opening',
      description: 'Use the dial pad to enter a number.',
    });
  }, [toast]);
  
  // Make an outbound call to a specific number
  const makeOutboundCall = useCallback(async (lineId: number, phoneNumber: string) => {
    const line = callLines.find(line => line.id === lineId);
    
    if (!line || line.status !== 'inactive') {
      toast({
        title: 'Line Unavailable',
        description: 'The selected line is not available.',
        variant: 'destructive',
      });
      return;
    }
    
    console.log(`Attempting to make outbound call to ${phoneNumber} on line ${lineId}`);
    
    // Immediately update UI to "ringing" state for better user feedback
    const ringingSuccess = await updateCallLineStatus(lineId, 'ringing', { 
      phoneNumber, 
      startTime: new Date(),
      notes: `Calling ${phoneNumber}...`
    });
    
    if (ringingSuccess) {
      toast({
        title: 'Connecting Call',
        description: `Dialing ${phoneNumber} on Line ${lineId}...`,
      });
    }
    
    // First attempt to get the real SIP account status
    let useRealSip = false;
    let sipModule;
    
    try {
      // Load the SIP module first to avoid nested try/catch blocks
      sipModule = await import('@/lib/sip');
      
      // Interface for SIP status response
      interface SipStatusResponse {
        registered: boolean;
        account?: {
          id: number;
          username: string;
          server: string;
        };
        message: string;
      }
      
      // Force a fresh fetch of SIP status to ensure we have the latest status
      const sipStatusResponse = await fetch('/api/sip-status', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (sipStatusResponse.ok) {
        const sipStatusData: SipStatusResponse = await sipStatusResponse.json();
        
        if (sipStatusData.registered && sipStatusData.account) {
          useRealSip = true;
          console.log(`Using real SIP account for outbound call: ${sipStatusData.account.username}@${sipStatusData.account.server}`);
          
          // Use the makeCall function from sip.ts with the real phone number
          try {
            // Now make the call with the loaded module
            const callSuccess = await sipModule.makeCall(phoneNumber);
            
            if (!callSuccess) {
              console.error("Failed to make call using real SIP account");
              toast({
                title: 'Call Attempted',
                description: 'Could not connect to SIP server for the call. Continuing in demo mode.',
                variant: 'destructive',
              });
              // Continue execution to update UI in demo mode
            } else {
              console.log("Successfully initiated call with real SIP account");
            }
          } catch (error) {
            console.error("Error making call:", error);
            toast({
              title: 'SIP Call Error',
              description: 'An error occurred when trying to make the call. Continuing in demo mode.',
              variant: 'destructive',
            });
            // Continue execution to update UI in demo mode
          }
        } else {
          console.warn("SIP status doesn't indicate registered account, using demo mode");
        }
      } else {
        console.error("Failed to get SIP status, response not OK");
      }
    } catch (error) {
      console.error("Error in SIP handling for outbound call:", error);
    }
    
    // Update the UI to active state after connection attempt
    // This ensures the UI updates even if the real SIP connection isn't working
    const success = await updateCallLineStatus(lineId, 'active', { 
      phoneNumber, 
      startTime: new Date(),
      // Add a note indicating if this is a real call or demo mode
      notes: useRealSip ? "Call initiated with real SIP account" : "Call initiated in demo mode" 
    });
    
    if (!success) {
      toast({
        title: 'Call Failed',
        description: 'Failed to update call status.',
        variant: 'destructive',
      });
    }
  }, [callLines, updateCallLineStatus, toast]);
  
  // Hang up a call
  const hangupCall = useCallback(async (lineId: number) => {
    const line = callLines.find(line => line.id === lineId);
    
    if (!line || line.status === 'inactive') {
      toast({
        title: 'No Active Call',
        description: 'There is no active call to hang up.',
        variant: 'destructive',
      });
      return;
    }
    
    console.log(`Attempting to hang up call on line ${lineId}`);
    
    // Try to use the real SIP account for hangup if available
    let useRealSip = false;
    
    try {
      // Load SIP module directly to avoid nesting promises
      const sipModule = await import('@/lib/sip');
      
      // Create a session ID based on line ID
      const sessionId = `call-${lineId}`;
      
      // Check if we have a real SIP connection first
      const sipStatusResponse = await fetch('/api/sip-status', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (sipStatusResponse.ok) {
        const sipStatusData = await sipStatusResponse.json();
        
        if (sipStatusData.registered && sipStatusData.account) {
          useRealSip = true;
          console.log(`Using real SIP account for hangup: ${sipStatusData.account.username}@${sipStatusData.account.server}`);
          
          // Attempt to hang up using the SIP implementation
          try {
            await sipModule.hangupCall(sessionId);
            console.log(`Hangup initiated for call on line ${lineId} with session ${sessionId}`);
          } catch (error) {
            console.error("Error in SIP hangup operation:", error);
          }
        }
      }
    } catch (error) {
      console.error("Error in SIP hangup process:", error);
    }
    
    // Always update the UI regardless of SIP implementation
    // Reset the line completely - clear phone number, contact info, notes, and reset timer
    const success = await updateCallLineStatus(lineId, 'inactive', {
      phoneNumber: null,
      contact: null,
      notes: null,
      startTime: null,
      duration: null
    });
    
    if (success) {
      toast({
        title: 'Call Ended',
        description: `Call on Line ${lineId} has been ended${useRealSip ? ' with real SIP account' : ''}.`,
      });
    } else {
      toast({
        title: 'Hang Up Failed',
        description: 'Failed to update call status.',
        variant: 'destructive',
      });
    }
  }, [callLines, updateCallLineStatus, toast]);
  
  // Put a call on hold
  const holdCall = useCallback((lineId: number) => {
    const line = callLines.find(line => line.id === lineId);
    
    if (!line || (line.status !== 'active' && line.status !== 'on-air')) {
      toast({
        title: 'Cannot Hold',
        description: 'This call cannot be put on hold.',
        variant: 'destructive',
      });
      return;
    }
    
    updateCallLineStatus(lineId, 'holding');
    
    toast({
      title: 'Call On Hold',
      description: `Call on Line ${lineId} is now on hold.`,
    });
  }, [callLines, updateCallLineStatus, toast]);
  
  // Send a call to air
  const sendToAir = useCallback((lineId: number) => {
    const line = callLines.find(line => line.id === lineId);
    
    if (!line || (line.status !== 'active' && line.status !== 'holding')) {
      toast({
        title: 'Cannot Send to Air',
        description: 'This call cannot be sent to air.',
        variant: 'destructive',
      });
      return;
    }
    
    // Allow multiple lines to be on-air simultaneously within their respective studios
    updateCallLineStatus(lineId, 'on-air');
    
    toast({
      title: 'Call On Air',
      description: `Call on Line ${lineId} is now on air.`,
    });
  }, [callLines, updateCallLineStatus, toast]);
  
  // Take a call off air
  const takeOffAir = useCallback((lineId: number) => {
    const line = callLines.find(line => line.id === lineId);
    
    if (!line || line.status !== 'on-air') {
      toast({
        title: 'Not On Air',
        description: 'This call is not currently on air.',
        variant: 'destructive',
      });
      return;
    }
    
    updateCallLineStatus(lineId, 'active');
    
    toast({
      title: 'Call Off Air',
      description: `Call on Line ${lineId} is now off air.`,
    });
  }, [callLines, updateCallLineStatus, toast]);
  
  // Add a note to a call
  const addNoteToCall = useCallback((lineId: number, note: string) => {
    const line = callLines.find(line => line.id === lineId);
    
    if (!line || line.status === 'inactive') {
      toast({
        title: 'Cannot Add Note',
        description: 'Cannot add note to an inactive call.',
        variant: 'destructive',
      });
      return;
    }
    
    // Update the call line with the note
    updateCallLineStatus(lineId, line.status, { notes: note });
    
    toast({
      title: 'Note Added',
      description: `Note added to call on Line ${lineId}.`,
    });
  }, [callLines, updateCallLineStatus, toast]);
  
  // Update audio routing
  const updateAudioRouting = useCallback(async (lineId: number, outputChannel: string) => {
    try {
      const response = await apiRequest('POST', '/api/audio-routing', {
        lineId,
        outputChannel
      });
      
      if (response.ok) {
        // Update local state
        setAudioRouting(prev => {
          const updated = [...prev];
          const index = updated.findIndex(r => r.lineId === lineId);
          
          if (index !== -1) {
            updated[index] = { lineId, outputChannel };
          } else {
            updated.push({ lineId, outputChannel });
          }
          
          return updated;
        });
        
        toast({
          title: 'Routing Updated',
          description: `Line ${lineId} output set to ${outputChannel}.`,
        });
      }
    } catch (error) {
      console.error('Error updating audio routing:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update audio routing.',
        variant: 'destructive',
      });
    }
  }, [toast]);
  
  // Get audio devices
  const getAudioDevices = useCallback(async (): Promise<AudioDevice[]> => {
    try {
      const response = await fetch('/api/audio-devices');
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error fetching audio devices:', error);
      return [];
    }
  }, []);
  
  // Save a contact to the phone book from an active call
  const saveToPhoneBook = useCallback(async (lineId: number, callerName?: string) => {
    const line = callLines.find(line => line.id === lineId);
    
    if (!line || !line.phoneNumber) {
      toast({
        title: 'Cannot Save Contact',
        description: 'No phone number available to save.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // Use the provided callerName or fallback to existing contact name
      const contactName = callerName || line.contact?.name || `Caller (${line.phoneNumber})`;
      
      // Simplify - just create a direct POST request with minimal data
      let response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: contactName,
          phone: line.phoneNumber,
          isFrequentCaller: false
        })
      });
      
      if (response.ok) {
        const contact = await response.json();
        toast({
          title: 'Contact Saved',
          description: `${contactName} was added to your phone book.`,
        });
        
        // Update the call line with the new contact
        updateCallLineStatus(lineId, line.status, { 
          contact: contact 
        });
        
        return contact;
      } else {
        // Get more info about the error
        const errorData = await response.text();
        console.error('Server response error:', {
          status: response.status,
          statusText: response.statusText,
          responseBody: errorData
        });
        
        throw new Error(`Failed to save contact: ${response.status} ${response.statusText} - ${errorData}`);
      }
    } catch (error) {
      console.error('Error saving contact:', error);
      
      // Get more detailed error information
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
      
      // Show error message with more details if available
      toast({
        title: 'Save Failed',
        description: error instanceof Error 
          ? `Failed to save contact: ${error.message}`
          : 'Failed to save contact to phone book.',
        variant: 'destructive',
      });
    }
  }, [callLines, updateCallLineStatus, toast]);
  
  const contextValue = useMemo(() => ({
    callLines,
    audioRouting,
    sipStatus,
    sipServer,
    selectedLine,
    websocket: socket,
    
    initializeVoIP,
    makeCall,
    makeOutboundCall,
    hangupCall,
    holdCall,
    sendToAir,
    takeOffAir,
    addNoteToCall,
    updateAudioRouting,
    setSelectedLine,
    getAudioDevices,
    saveToPhoneBook,
  }), [
    callLines,
    audioRouting,
    sipStatus,
    sipServer,
    selectedLine,
    socket,
    
    initializeVoIP,
    makeCall,
    makeOutboundCall,
    hangupCall,
    holdCall,
    sendToAir,
    takeOffAir,
    addNoteToCall,
    updateAudioRouting,
    setSelectedLine,
    getAudioDevices,
    saveToPhoneBook,
  ]);
  
  return (
    <VoIPContext.Provider value={contextValue}>
      {children}
    </VoIPContext.Provider>
  );
};
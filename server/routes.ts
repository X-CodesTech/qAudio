import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { WebSocketServer, WebSocket } from "ws";
// Removed authentication middleware imports
import { registerDirectRoutes } from "./direct-routes";
import { registerREStudioRoutes } from "./re-studio-routes";
import { setupRadioAutomationRoutes } from "./radio-automation-routes";
import { setupAiDjRoutes } from "./ai-dj-routes";
import { setupTrafficRoutes } from "./traffic-routes";
import { setupSettingsRoutes } from "./settings-routes";
import { setupInternetRadioRoutes } from "./internet-radio-routes";
import { broadcastToRole } from "./websocket-helpers";
import { setupSocketIOServer } from "./socketio-server";

// Import role-specific route modules
import { setupProducerRoutes } from "./routes/producer-routes";
import { setupTalentRoutes } from "./routes/talent-routes";
import { setupPlayoutRoutes } from "./routes/playout-routes";
import { setupTransmitterRoutes } from "./routes/transmitter-routes"; 
import { setupAdminRoutes } from "./routes/admin-routes";
import { setupTechRoutes } from "./routes/tech-routes";
import { setupTimerRoutes } from "./routes/timer-routes";
import { setupChatRoutes } from "./routes/chat-routes";

// Create dummy authentication middleware 
const isAuthenticated = (req, res, next) => next();
const hasRole = () => (req, res, next) => next();
const isAdmin = (req, res, next) => next();
import { 
  insertContactSchema, 
  insertCallRecordSchema, 
  insertCallNoteSchema,
  insertUserSchema,
  insertChatMessageSchema,
  CallStatus,
  CallLine,
  UserRole as UserRoleType
} from "@shared/schema";

// Function to check for stalled connections and clean them up
function setupConnectionMonitor(wss: WebSocketServer) {
  const STALE_CONNECTION_THRESHOLD = 300000; // Increased to 5 minutes without activity
  
  // Check connections every 2 minutes
  setInterval(() => {
    const now = Date.now();
    let closedCount = 0;
    let activeConnections = 0;
    
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        activeConnections++;
        
        // Get the most recent activity timestamp from any available source
        const lastActivity = (client as any).lastActivity || 
                            (client as any).lastPing || 
                            (client as any).authTimestamp || 
                            (client as any).connectionTime || 0;
        
        // Record this check as activity to prevent premature disconnections
        (client as any).lastActivity = now;
        
        // If we haven't heard from this client in the threshold time, send a ping
        // instead of immediately closing (more forgiving approach)
        if (now - lastActivity > STALE_CONNECTION_THRESHOLD) {
          console.log(`Sending ping to potentially stale connection (${(client as any).role || 'unknown role'}, inactive for ${Math.floor((now - lastActivity)/1000)}s)`);
          
          try {
            // Send ping to check if client is still alive
            client.ping();
            
            // Only terminate if we don't get a pong back after a reasonable timeout
            setTimeout(() => {
              if (client.readyState === WebSocket.OPEN && (now - ((client as any).lastActivity || 0)) > STALE_CONNECTION_THRESHOLD) {
                console.log(`No pong received, closing stale connection: ${(client as any).role || 'unknown role'}`);
                client.terminate();
                closedCount++;
              }
            }, 5000); // Wait 5 seconds for pong response
          } catch (err) {
            console.error(`Error sending ping to client, terminating:`, err);
            client.terminate();
            closedCount++;
          }
        }
      }
    });
    
    if (closedCount > 0) {
      console.log(`Closed ${closedCount} stale connections. Active connections: ${activeConnections}`);
    } else {
      console.log(`Connection monitor: ${activeConnections} active connection(s)`);
    }
  }, 120000); // Check every 2 minutes
}

// Define types for better TypeScript compatibility
type UserRole = 'producer' | 'talent' | 'admin' | 'tech' | 'remote';
type StudioId = 'A' | 'B' | 'RE';
type TimerState = {
  minutes: number;
  seconds: number;
  isRunning: boolean;
  isDangerZone: boolean;
  lastUpdate: string;
};

// Server-side state to track timers, chat, buzzer status, etc.
const serverState = {
  // Timer state
  studioATimer: {
    minutes: 5,
    seconds: 0,
    isRunning: false,
    isDangerZone: false,
    lastUpdate: new Date().toISOString()
  } as TimerState,
  studioBTimer: {
    minutes: 5,
    seconds: 0,
    isRunning: false,
    isDangerZone: false,
    lastUpdate: new Date().toISOString()
  } as TimerState,
  
  // Track buzzer state for each studio to support HTTP polling
  buzzerState: {
    studioA: false,
    studioB: false,
    studioRE: false,
    // Add all studios with explicit keys to avoid type errors when accessed by string
    'studio-A': false,
    'studio-B': false,
    'studio-RE': false
  },
  
  // WebRTC signaling store for fallback HTTP-based signaling
  rtcSignals: [] as any[],
  
  // Track clients by role for better message routing
  clientsByRole: {
    producer: new Set<WebSocket>(),
    talent: new Set<WebSocket>(),
    admin: new Set<WebSocket>(),
    tech: new Set<WebSocket>(),
    remote: new Set<WebSocket>()
  } as Record<UserRole, Set<WebSocket>>,
  
  // Track clients by studio for studio-specific messages
  clientsByStudio: {
    A: new Set<WebSocket>(),
    B: new Set<WebSocket>(),
    RE: new Set<WebSocket>()
  } as Record<StudioId, Set<WebSocket>>
};

// Track active calls for real-time communication
const activeCallLines: CallLine[] = [
  // Studio A Lines (1-4)
  { id: 1, status: 'inactive', studio: 'A', phoneNumber: '', levels: { input: 0, output: 0 } },
  { id: 2, status: 'inactive', studio: 'A', phoneNumber: '', levels: { input: 0, output: 0 } },
  { id: 3, status: 'inactive', studio: 'A', phoneNumber: '', levels: { input: 0, output: 0 } },
  { id: 4, status: 'inactive', studio: 'A', phoneNumber: '', levels: { input: 0, output: 0 } },
  // Studio B Lines (5-8)
  { id: 5, status: 'inactive', studio: 'B', phoneNumber: '', levels: { input: 0, output: 0 } },
  { id: 6, status: 'inactive', studio: 'B', phoneNumber: '', levels: { input: 0, output: 0 } },
  { id: 7, status: 'inactive', studio: 'B', phoneNumber: '', levels: { input: 0, output: 0 } },
  { id: 8, status: 'inactive', studio: 'B', phoneNumber: '', levels: { input: 0, output: 0 } }
];

const broadcastToClients = (wss: WebSocketServer, data: any) => {
  // Debug every message we're broadcasting for diagnostic purposes
  console.log(`Broadcasting message of type: ${data.type}`);
  console.log(`Total connected clients: ${wss.clients.size}`);
  
  // Log additional details for call line updates to diagnose issues
  if (data.type === 'call_line_update' && data.line) {
    console.log(`Call line update: Line ID ${data.line.id}, Status: ${data.line.status}, Phone: ${data.line.phoneNumber || 'none'}`);
  }
  
  // Check if this is a studio-specific message
  const isStudioSpecific = data.type === 'newChatMessage' && data.data && data.data.studioId;
  const isStudioClear = data.type === 'clearChat' && data.data && data.data.studioId;
  const isTalentBuzzer = data.type === 'talentBuzzer' && data.data && data.data.studioId;
  const isProducerBuzzer = data.type === 'producerBuzzer' && data.data && data.data.studioId;
  const isCountdownUpdate = data.type === 'countdown_update' && data.studio;
  
  // Log the total number of connected clients
  console.log(`Total connected clients: ${wss.clients.size}`);
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      const clientRole = (client as any).role;
      const clientStudioId = (client as any).studioId;
      const clientStudioAccess = (client as any).studioAccess;
      
      // Debug each client for all message types
      console.log(`Checking client - Role: ${clientRole || '(no role)'}, StudioId: ${clientStudioId || '(no studio)'}`);
      
      // For talent buzzer (from producer to talent), carefully target the relevant studio
      if (isTalentBuzzer) {
        const buzzerStudioId = data.data.studioId;
        console.log(`TALENT BUZZER - Target Studio: ${buzzerStudioId}, Client Studio: ${clientStudioId || 'undefined'}, Client Role: ${clientRole || 'undefined'}`);
        
        // Send to all producers (for UI feedback)
        if (clientRole === 'producer') {
          console.log('✅ Sending talentBuzzer to producer (for UI feedback)');
          client.send(JSON.stringify(data));
        }
        // Send to all talent clients with matching studio
        else if (clientRole === 'talent') {
          // Debug studio ID matching for diagnosing buzzer issues
          console.log(`Talent client has studio ID: ${clientStudioId}, target studio is: ${buzzerStudioId}`);
          
          // If talent's studio ID matches the target
          if (clientStudioId === buzzerStudioId) {
            console.log(`✅ Sending talentBuzzer to talent in Studio ${buzzerStudioId}`);
            client.send(JSON.stringify(data));
          }
        }
        // Also send to clients with multi-studio access
        else if (Array.isArray(clientStudioAccess) && clientStudioAccess.includes(buzzerStudioId)) {
          console.log(`✅ Sending talentBuzzer to client with access to multiple studios including ${buzzerStudioId}`);
          client.send(JSON.stringify(data));
        }
      }
      // For producer buzzer (from talent to producer), send to producers and originating talent
      else if (isProducerBuzzer) {
        const buzzerStudioId = data.data.studioId;
        console.log(`PRODUCER BUZZER - From Studio: ${buzzerStudioId}, Client Role: ${clientRole}, Client Studio: ${clientStudioId}`);
        
        // Always send to ALL producers regardless of their studio
        if (clientRole === 'producer') {
          console.log('✅ Sending producerBuzzer to producer');
          client.send(JSON.stringify(data));
        }
        // Send to the talent who initiated the buzz (for UI feedback)
        else if (clientRole === 'talent' && clientStudioId === buzzerStudioId) {
          console.log('✅ Sending producerBuzzer back to originating talent for feedback');
          client.send(JSON.stringify(data));
        }
      }
      // For studio-specific chat messages, only send to relevant clients
      else if (isStudioSpecific) {
        const messageStudioId = data.data.studioId;
        const clientStudioAccess = (client as any).studioAccess;
        const clientStudioId = (client as any).studioId;
        const clientRole = (client as any).role;
        
        // Send if client has access to multiple studios including this one
        const hasAccess = Array.isArray(clientStudioAccess) && 
                          clientStudioAccess.includes(messageStudioId);
                          
        // Send if client is specifically for this studio
        const matchesStudio = clientStudioId === messageStudioId;
        
        // Debug status for this chat message routing
        console.log(`Chat routing - Message studio: ${messageStudioId}, Client studio: ${clientStudioId}, Client role: ${clientRole}`);
        console.log(`Chat routing - hasAccess: ${hasAccess}, matchesStudio: ${matchesStudio}, noStudioId: ${!clientStudioId}`);
        
        // Only send if client should receive this studio's messages
        if (hasAccess || matchesStudio || !clientStudioId) {
          console.log(`✅ Sending chat message to ${clientRole} in studio ${clientStudioId || '(no studio)'}`);
          client.send(JSON.stringify(data));
        } else {
          console.log(`❌ Skipping chat message to ${clientRole} in studio ${clientStudioId || '(no studio)'}`);
        }
      }
      // For studio-specific clears, only send to relevant clients
      else if (isStudioClear) {
        const clearStudioId = data.data.studioId;
        const clientStudioAccess = (client as any).studioAccess;
        const clientStudioId = (client as any).studioId;
        
        // Send if client has access to multiple studios including this one
        const hasAccess = Array.isArray(clientStudioAccess) && 
                          clientStudioAccess.includes(clearStudioId);
                          
        // Send if client is specifically for this studio
        const matchesStudio = clientStudioId === clearStudioId;
        
        // Only send if client should receive this studio's clear command
        if (hasAccess || matchesStudio || !clientStudioId) {
          client.send(JSON.stringify(data));
        }
      }
      // For countdown timer updates, only send to the relevant studio
      // PRIORITIZE this message type for real-time synchronization
      else if (isCountdownUpdate) {
        const timerStudioId = data.studio; // 'A' or 'B'
        const clientStudioAccess = (client as any).studioAccess;
        const clientStudioId = (client as any).studioId;
        const clientRole = (client as any).role;
        
        // Send if client has access to multiple studios including this one
        const hasAccess = Array.isArray(clientStudioAccess) && 
                          clientStudioAccess.includes(timerStudioId);
                          
        // Send if client is specifically for this studio
        const matchesStudio = clientStudioId === timerStudioId;
        
        // Send to producer (who has access to all studios)
        const isProducer = clientRole === 'producer';
        
        if (hasAccess || matchesStudio || isProducer) {
          // Prioritize timer updates by sending them immediately
          try {
            client.send(JSON.stringify(data));
          } catch (err) {
            console.error('Error sending countdown update:', err);
          }
        }
      }
      // For all other messages, broadcast to everyone
      else {
        client.send(JSON.stringify(data));
      }
    }
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication has been removed for simplicity
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Set up WebSocket server
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    // Increase timeouts and ensure proper headers are handled
    clientTracking: true,
    perMessageDeflate: {
      zlibDeflateOptions: {
        // See zlib defaults.
        chunkSize: 1024,
        memLevel: 7,
        level: 3
      },
      zlibInflateOptions: {
        chunkSize: 10 * 1024
      },
      // Below options specified as default values.
      concurrencyLimit: 10, // Limits zlib concurrency for performance.
      threshold: 1024 // Size (in bytes) below which messages should not be compressed.
    }
  });
  
  // Store WSS on the HTTP server so we can access it in route handlers
  (httpServer as any).wss = wss;
  
  // Set up Socket.io server for real-time communication
  const io = setupSocketIOServer(httpServer);
  
  // Store Socket.io server on the HTTP server for access in routes
  (httpServer as any).io = io;
  
  // Set up the connection monitor to detect and close stale connections
  setupConnectionMonitor(wss);
  
  // Register RE Studio and direct routes
  registerREStudioRoutes(app, wss, serverState.rtcSignals);
  registerDirectRoutes(app, wss, serverState.rtcSignals);
  
  // Register Radio Automation System routes
  setupRadioAutomationRoutes(app, wss);
  
  // Register AI DJ and Intelligent Playlist Generation routes
  setupAiDjRoutes(app, wss);
  
  // Register Traffic Management routes
  setupTrafficRoutes(app, wss);
  
  // Register Settings Management routes
  setupSettingsRoutes(app, wss);
  
  // Register Internet Radio routes
  setupInternetRadioRoutes(app, wss);
  
  // Register role-specific routes
  setupProducerRoutes(app, wss);
  setupTalentRoutes(app, wss);
  setupPlayoutRoutes(app, wss);
  setupTransmitterRoutes(app, wss);
  setupAdminRoutes(app, wss);
  setupTechRoutes(app, wss);
  
  // Setup timer synchronization routes
  setupTimerRoutes(app, wss, serverState);
  setupChatRoutes(app, wss);
  
  // Add HTTP fallback routes for buzzer functionality when WebSocket is unavailable
  app.post('/api/studio/buzz-talent', isAuthenticated, (req: any, res: any) => {
    const { studioId, activate } = req.body;
    
    if (!studioId || typeof activate !== 'boolean') {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    console.log(`HTTP Fallback: Producer buzzing talent in Studio ${studioId} (${activate ? 'activate' : 'deactivate'})`);
    
    // Update all possible key formats for the studio in the buzzer state
    if (studioId === 'A') {
      serverState.buzzerState.studioA = activate;
    } else if (studioId === 'B') {
      serverState.buzzerState.studioB = activate;
    } else if (studioId === 'RE') {
      serverState.buzzerState.studioRE = activate;
    }
    
    // Also try to set it using string keys for robustness
    try {
      const key = `studio-${studioId}` as keyof typeof serverState.buzzerState;
      serverState.buzzerState[key] = activate;
    } catch (error) {
      console.error('Error updating buzzer state with string key:', error);
    }
    
    // Broadcast to all WebSocket clients (same as would happen via WebSocket)
    const message = {
      type: 'talentBuzzer',
      data: {
        studioId,
        activate
      }
    };
    
    // Broadcast to talent role
    broadcastToRole(wss, 'talent', JSON.stringify(message));
    
    // If activating, store the activation timestamp for auto-deactivation
    const activationKey = `studio${studioId}ActivationTime` as keyof typeof serverState;
    if (activate) {
      (serverState as any)[activationKey] = Date.now();
      console.log(`Stored activation timestamp for Studio ${studioId}`);
    } else {
      // If deactivating, remove the timestamp
      delete (serverState as any)[activationKey];
    }
    
    // Send success response
    res.json({ success: true, message: `Talent in Studio ${studioId} ${activate ? 'buzzed' : 'unbuzzed'}` });
  });
  
  app.post('/api/studio/buzz-producer', isAuthenticated, (req: any, res: any) => {
    const { studioId, activate } = req.body;
    
    if (!studioId || typeof activate !== 'boolean') {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    console.log(`HTTP Fallback: Talent buzzing producer from Studio ${studioId} (${activate ? 'activate' : 'deactivate'})`);
    
    // Update all possible key formats for the studio in the buzzer state
    serverState.buzzerState[`studio${studioId}` as keyof typeof serverState.buzzerState] = activate;
    serverState.buzzerState[`studioId${studioId}` as keyof typeof serverState.buzzerState] = activate;
    serverState.buzzerState[`studio-${studioId}` as keyof typeof serverState.buzzerState] = activate;
    
    if (studioId === 'A') {
      serverState.buzzerState.studioA = activate;
    } else if (studioId === 'B') {
      serverState.buzzerState.studioB = activate;
    } else if (studioId === 'RE') {
      serverState.buzzerState.studioRE = activate;
    }
    
    // Broadcast to all WebSocket clients (same as would happen via WebSocket)
    const message = {
      type: 'producerBuzzer',
      data: {
        studioId,
        activate
      }
    };
    
    // Broadcast to producer role
    broadcastToRole(wss, 'producer', JSON.stringify(message));
    
    // If activating, store the activation timestamp for auto-deactivation
    const activationKey = `studio${studioId}ActivationTime` as keyof typeof serverState;
    if (activate) {
      (serverState as any)[activationKey] = Date.now();
      console.log(`Stored activation timestamp for Studio ${studioId}`);
    } else {
      // If deactivating, remove the timestamp
      delete (serverState as any)[activationKey];
    }
    
    // Send success response
    res.json({ success: true, message: `Producer notified from Studio ${studioId} ${activate ? 'buzzed' : 'unbuzzed'}` });
  });
  
  // Add buzzer status polling endpoint as a more reliable fallback
  app.get('/api/studio/buzzer-status', isAuthenticated, (req: any, res: any) => {
    const { studioId, role } = req.query;
    
    if (!studioId) {
      return res.status(400).json({ error: 'Missing required studioId parameter' });
    }
    
    // Implement auto-deactivation on the server side as well
    // Check if there's a timestamp for the last activation of this buzzer
    const activationKey = `studio${studioId}ActivationTime` as keyof typeof serverState;
    const activationTime = (serverState as any)[activationKey] as number | undefined;
    
    // If the buzzer was activated more than 10 seconds ago, automatically deactivate it
    if (activationTime && (Date.now() - activationTime > 10000)) {
      console.log(`Auto-deactivating buzzer for Studio ${studioId} after 10 seconds`);
      
      // Reset all possible formats for this studio
      if (studioId === 'A') {
        serverState.buzzerState.studioA = false;
      } else if (studioId === 'B') {
        serverState.buzzerState.studioB = false;
      } else if (studioId === 'RE') {
        serverState.buzzerState.studioRE = false;
      }
      
      // Also reset using string keys
      serverState.buzzerState[`studio${studioId}` as keyof typeof serverState.buzzerState] = false;
      serverState.buzzerState[`studioId${studioId}` as keyof typeof serverState.buzzerState] = false;
      serverState.buzzerState[`studio-${studioId}` as keyof typeof serverState.buzzerState] = false;
      
      // Delete the timestamp
      delete (serverState as any)[activationKey];
      
      // Broadcast the deactivation to all clients
      io.emit('buzzerStatus', { 
        studioId, 
        isActive: false,
        role: 'all'
      });
    }
    
    let isActive = false;
    
    // Check all possible key formats for this studio
    if (studioId === 'A') {
      isActive = serverState.buzzerState.studioA;
    } else if (studioId === 'B') {
      isActive = serverState.buzzerState.studioB;
    } else if (studioId === 'RE') {
      isActive = serverState.buzzerState.studioRE;
    } else {
      // Try various formats as a fallback
      const key1 = `studio${studioId}` as keyof typeof serverState.buzzerState;
      const key2 = `studioId${studioId}` as keyof typeof serverState.buzzerState;
      const key3 = `studio-${studioId}` as keyof typeof serverState.buzzerState;
      
      isActive = serverState.buzzerState[key1] || serverState.buzzerState[key2] || serverState.buzzerState[key3] || false;
    }
    
    console.log(`Buzzer status poll - Studio: ${studioId}, Role: ${role}, Active: ${isActive}`);
    
    return res.json({ 
      isActive,
      studioId,
      role,
      timestamp: Date.now()
    });
  });
  
  // Add direct login endpoint for simplified WebSocket auth
  app.post('/api/direct-login/:role', (req, res) => {
    const { role } = req.params;
    // Validate role is one of the expected values
    if (!['producer', 'talent', 'talent-a', 'talent-b', 'talent-test-a', 'talent-test-b', 'admin', 'tech', 'remote', 'playout'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }
    
    // Create simplified authentication token
    const authToken = {
      role,
      clientId: `client-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now(),
      isAuthenticated: true
    };
    
    // Return auth token for client use
    res.json(authToken);
  });
  
  // Add dedicated WebRTC signaling API endpoints to address WebSocket connection issues
  
  // Call lines API endpoints
  app.get('/api/call-lines', (req, res) => {
    res.json(activeCallLines);
  });
  
  app.get('/api/call-lines/:id', (req, res) => {
    const lineId = parseInt(req.params.id, 10);
    const line = activeCallLines.find(l => l.id === lineId);
    
    if (!line) {
      return res.status(404).json({ error: 'Call line not found' });
    }
    
    res.json(line);
  });
  
  app.put('/api/call-lines/:id', (req, res) => {
    const lineId = parseInt(req.params.id, 10);
    const { status, phoneNumber, contact, notes } = req.body;
    
    const line = activeCallLines.find(l => l.id === lineId);
    
    if (!line) {
      return res.status(404).json({ error: 'Call line not found' });
    }
    
    // Update line information
    if (status) line.status = status;
    if (phoneNumber !== undefined) line.phoneNumber = phoneNumber;
    if (contact !== undefined) line.contact = contact;
    if (notes !== undefined) line.notes = notes;
    
    // For new calls, set start time
    if (status === 'active' && !line.startTime) {
      line.startTime = new Date();
    }
    
    // For ended calls, clear start time and duration
    if (status === 'inactive') {
      line.startTime = undefined;
      line.duration = undefined;
    }
    
    // Broadcast line status update to all clients
    broadcastToClients(wss, {
      type: 'call_line_update',
      line
    });
    
    res.json(line);
  });
  
  // ...
  // [Keep all your API routes here]
  // ...
  
  // WebSocket server connection handler
  wss.on('connection', (ws, req) => {
    // Initialize connection tracking with the most generous data available
    const connectionTime = Date.now();
    (ws as any).connectionTime = connectionTime;
    (ws as any).lastActivity = connectionTime;
    
    const remoteIp = req.socket.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
    console.log(`WebSocket client connected (#${wss.clients.size}) from ${remoteIp}`);
    
    // Generate a unique client ID for this connection
    const clientId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    (ws as any).clientId = clientId;
    
    // Let the client know it has connected and provide a client ID
    try {
      // Send initial state data when client connects
      const initialMessage = {
        type: 'init',
        clientId,
        timestamp: Date.now(),
        activeCallLines,
        timerState: {
          studioA: serverState.studioATimer,
          studioB: serverState.studioBTimer
        },
        buzzerState: serverState.buzzerState
      };
      
          // Create a new object with all the properties of initialMessage plus origin
      const messageToSend = {
        ...initialMessage,
        origin: req.headers.origin || undefined
      };
      
      // Wait a second to ensure connection is fully established
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          console.log(`Sending initial state to client #${wss.clients.size} (${clientId})`);
          ws.send(JSON.stringify(messageToSend));
        }
      }, 1000);
    } catch (err) {
      console.error('Error sending initial state to client:', err);
    }
    
    // Handle incoming messages
    ws.on('message', (message) => {
      // Track last activity time to prevent premature disconnection
      (ws as any).lastActivity = Date.now();
      
      // Handle different message types/formats
      try {
        // Try to parse as JSON first
        let data = JSON.parse(message.toString());
        // console.log('Received WebSocket message:', data);
        
        // Immediately respond to pings
        if (data.type === 'ping') {
          (ws as any).lastPing = Date.now();
          try {
            ws.send(JSON.stringify({
              type: 'pong',
              timestamp: Date.now(),
              clientId: (ws as any).clientId || 'unknown'
            }));
            
            console.log(`Sent pong response to client ${(ws as any).clientId || 'unknown'}`);
          } catch (err) {
            console.error('Error sending pong:', err);
          }
          return;
        }
        
        // Handle client's role update
        if (data.type === 'role') {
          (ws as any).role = data.role;
          console.log(`Client ${(ws as any).clientId} set role to ${data.role}`);
          
          // For studio-specific clients, track it for better message routing
          if (data.studioId) {
            (ws as any).studioId = data.studioId;
            
            // Add client to the appropriate set for its studio
            if (['A', 'B', 'RE'].includes(data.studioId)) {
              serverState.clientsByStudio[data.studioId as StudioId].add(ws);
              console.log(`Added client to Studio ${data.studioId} group`);
            }
          }
          
          // If client has access to multiple studios, track those
          if (Array.isArray(data.studioAccess)) {
            (ws as any).studioAccess = data.studioAccess;
            console.log(`Client has access to studios: ${data.studioAccess.join(', ')}`);
          }
          
          // Add client to appropriate role-based group
          if (['producer', 'talent', 'admin', 'tech', 'remote'].includes(data.role)) {
            serverState.clientsByRole[data.role as UserRole].add(ws);
            console.log(`Added client to ${data.role} role group`);
          }
          
          return;
        }
        
        // Handle remote studio connection requests
        if (data.type === 'remote-studio-connect') {
          console.log('Received remote studio connection request');
          
          // Store client role and studio info for future message routing
          (ws as any).role = 'remote';
          (ws as any).studioId = 'RE';
          
          // Add to the appropriate client groups
          serverState.clientsByRole.remote.add(ws);
          serverState.clientsByStudio.RE.add(ws);
          
          // Broadcast the connection request to tech views
          broadcastToClients(wss, {
            type: 'remote-studio-connect-request',
            data: {
              clientId: (ws as any).clientId,
              timestamp: Date.now()
            }
          });
          return;
        }
        
        // Handle producer -> talent buzzer notification
        if (data.type === 'talentBuzzer') {
          console.log('Received talentBuzzer message from producer:', data);
          
          // Extract data from the proper location (could be nested inside data object)
          const studioId = data.data?.studioId || data.studioId;
          const activate = data.data?.activate !== undefined ? data.data.activate : data.activate;
          
          if (!studioId) {
            console.error('Missing studioId in talentBuzzer message:', data);
            return;
          }
          
          console.log(`Processing talentBuzzer: Studio ${studioId}, Activate: ${activate}`);
          
          // Update buzzer state
          if (studioId === 'A') {
            serverState.buzzerState.studioA = !!activate;
          } else if (studioId === 'B') {
            serverState.buzzerState.studioB = !!activate;
          }
          
          // Broadcast buzzer event to all clients
          broadcastToClients(wss, {
            type: 'talentBuzzer',
            data: {
              studioId: studioId, // 'A' or 'B'
              activate: activate, // true to start buzzing, false to stop
              timestamp: new Date().toISOString()
            }
          });
        }
        
        // Handle talent -> producer buzzer notification
        if (data.type === 'producerBuzzer') {
          console.log('Received producerBuzzer message from talent:', data);
          
          // Extract data from the proper location (could be nested inside data object)
          const studioId = data.data?.studioId || data.studioId;
          const activate = data.data?.activate !== undefined ? data.data.activate : data.activate;
          
          if (!studioId) {
            console.error('Missing studioId in producerBuzzer message:', data);
            return;
          }
          
          console.log(`Processing producerBuzzer: Studio ${studioId}, Activate: ${activate}`);
          
          // Broadcast buzzer event to all clients
          broadcastToClients(wss, {
            type: 'producerBuzzer',
            data: {
              studioId: studioId, // 'A' or 'B'
              activate: activate, // true to start buzzing, false to stop
              timestamp: new Date().toISOString()
            }
          });
          return;
        }
        
        // Handle authentication for the WebSocket (now using role)
        if (data.type === 'auth') {
          try {
            // Validate the role before proceeding
            const clientRole = data.role;
            
            if (!clientRole) {
              console.warn('Attempted authentication without role specification');
              ws.send(JSON.stringify({ 
                type: 'auth_failure', 
                message: 'Missing role field in auth message'
              }));
              return;
            }
            
            // Set role and client ID on the websocket object for later reference
            (ws as any).role = clientRole;
            (ws as any).authTimestamp = Date.now();
            (ws as any).clientId = data.clientId || `client-${Date.now()}`;
            
            // If a studio ID is provided, associate the client with that studio
            if (data.studioId) {
              (ws as any).studioId = data.studioId;
              console.log(`Client authenticated as ${clientRole} for studio ${data.studioId}`);
              
              // Add to studio-specific client tracking
              if (['A', 'B', 'RE'].includes(data.studioId)) {
                serverState.clientsByStudio[data.studioId as StudioId].add(ws);
              }
            } else {
              console.log(`Client authenticated as ${clientRole} (no studio specified)`);
            }
            
            // Add to role-specific client tracking
            if (['producer', 'talent', 'admin', 'tech', 'remote'].includes(clientRole)) {
              serverState.clientsByRole[clientRole as UserRole].add(ws);
            }
            
            // Send successful authentication response
            ws.send(JSON.stringify({ 
              type: 'auth_success',
              role: clientRole, 
              timestamp: new Date().toISOString()
            }));
            
            // Send current state data
            setTimeout(() => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: 'init_state', 
                  activeCallLines,
                  timerState: {
                    studioA: serverState.studioATimer,
                    studioB: serverState.studioBTimer
                  },
                  buzzerState: serverState.buzzerState,
                  timestamp: new Date().toISOString()
                }));
              }
            }, 500);
          } catch (error) {
            console.error('WebSocket auth error:', error);
            ws.send(JSON.stringify({ 
              type: 'auth_failure',
              message: 'Internal server error during authentication'
            }));
          }
          return;
        }
        
        // Handle chat messages
        if (data.type === 'chat') {
          try {
            const { message, senderRole, receiverRole, studioId } = data;
            
            if (!message || !senderRole) {
              console.warn('Missing required fields in chat message');
              return;
            }
            
            // Create a chat message record
            const chatMessageData = {
              message,
              senderRole,
              receiverRole: receiverRole || null,
              studioId: studioId || null,
              isRead: false,
              createdAt: new Date()
            };
            
            // Store in database
            storage.createChatMessage(chatMessageData)
              .then(savedMessage => {
                console.log('Chat message saved:', savedMessage.id);
                
                // Broadcast to appropriate clients
                broadcastToClients(wss, {
                  type: 'newChatMessage',
                  data: savedMessage
                });
              })
              .catch(error => {
                console.error('Error saving chat message:', error);
              });
          } catch (error) {
            console.error('Error processing chat message:', error);
          }
          return;
        }
        
        // Handle clearing chat messages
        if (data.type === 'clearChat') {
          try {
            const { studioId } = data;
            
            // Clear messages in database
            storage.clearChatMessages(studioId)
              .then(success => {
                console.log(`Cleared chat messages${studioId ? ` for studio ${studioId}` : ''}`);
                
                // Broadcast clear event
                broadcastToClients(wss, {
                  type: 'clearChat',
                  data: { studioId, timestamp: new Date().toISOString() }
                });
              })
              .catch(error => {
                console.error('Error clearing chat messages:', error);
              });
          } catch (error) {
            console.error('Error processing clear chat request:', error);
          }
          return;
        }
        
        // Handle countdown timer updates
        if (data.type === 'countdown_update' && data.studio) {
          try {
            // Validate which studio timer to update
            const studio = data.studio;
            if (!['A', 'B'].includes(studio)) {
              console.warn(`Invalid studio for countdown update: ${studio}`);
              return;
            }
            
            const minutes = parseInt(data.minutes);
            const seconds = parseInt(data.seconds);
            const isRunning = !!data.isRunning;
            const isDangerZone = !!data.isDangerZone;
            
            // Update the appropriate timer
            const timer = studio === 'A' ? serverState.studioATimer : serverState.studioBTimer;
            timer.minutes = minutes;
            timer.seconds = seconds;
            timer.isRunning = isRunning;
            timer.isDangerZone = isDangerZone;
            timer.lastUpdate = new Date().toISOString();
            
            // Broadcast timer update to all clients
            broadcastToClients(wss, data);
          } catch (error) {
            console.error('Error processing countdown update:', error);
          }
          return;
        }
        
        // Handle call line status updates
        if (data.type === 'call_line_status') {
          try {
            const { lineId, status, phoneNumber, contact } = data;
            
            if (lineId === undefined || !status) {
              console.warn('Missing required fields for call line status update');
              return;
            }
            
            // Find the line to update
            const line = activeCallLines.find(l => l.id === lineId);
            if (!line) {
              console.warn(`No active call line found with ID ${lineId}`);
              return;
            }
            
            // Update line information
            line.status = status;
            if (phoneNumber !== undefined) line.phoneNumber = phoneNumber;
            if (contact !== undefined) line.contact = contact;
            
            // For new calls, set start time
            if (status === 'active' && !line.startTime) {
              line.startTime = new Date();
            }
            
            // For ended calls, clear start time and duration
            if (status === 'inactive') {
              line.startTime = undefined;
              line.duration = undefined;
            }
            
            // Broadcast line status update to all clients
            broadcastToClients(wss, {
              type: 'call_line_update',
              line
            });
          } catch (error) {
            console.error('Error processing call line status update:', error);
          }
          return;
        }
        
        // Handle audio level updates
        if (data.type === 'audio_levels') {
          try {
            const { lineId, input, output } = data;
            
            if (lineId === undefined) {
              return; // Silent fail for performance reasons
            }
            
            // Find the line to update
            const line = activeCallLines.find(l => l.id === lineId);
            if (!line) {
              return; // Silent fail for performance reasons
            }
            
            // Initialize levels object if it doesn't exist
            if (!line.levels) {
              line.levels = { input: 0, output: 0 };
            }
            
            // Update levels if provided
            if (input !== undefined) line.levels.input = input;
            if (output !== undefined) line.levels.output = output;
            
            // Broadcast level update to all clients
            // Use a more efficient format for high-frequency updates
            broadcastToClients(wss, {
              type: 'audio_level_update',
              lineId,
              levels: line.levels
            });
          } catch (error) {
            // Silent fail for performance reasons
          }
          return;
        }
        
        // Handle WebRTC signaling
        if (data.type === 'rtc-offer' || data.type === 'rtc-answer' || data.type === 'ice-candidate') {
          try {
            console.log(`WebRTC signaling: ${data.type}`);
            
            // Store the signal for HTTP-based polling
            serverState.rtcSignals.push({
              ...data,
              timestamp: Date.now()
            });
            
            // Limit stored signals to prevent memory issues
            if (serverState.rtcSignals.length > 100) {
              serverState.rtcSignals = serverState.rtcSignals.slice(-50);
            }
            
            // Broadcast to all WebRTC participants
            broadcastToClients(wss, data);
          } catch (error) {
            console.error('Error processing WebRTC signal:', error);
          }
          return;
        }
        
        // Handle caller info updates from ProducerView
        if (data.type === 'callInfoUpdate') {
          const { lineId, callerName, callerNotes } = data;
          console.log(`Handling caller info update for line ${lineId}: ${callerName}, notes: ${callerNotes ? 'yes' : 'no'}`);
          
          if (typeof lineId === 'number') {
            // Find the call line to update
            const line = activeCallLines.find(l => l.id === lineId);
            if (line) {
              // Update the line with caller information
              if (callerName !== undefined) {
                line.contact = callerName;
              }
              
              if (callerNotes !== undefined) {
                line.notes = callerNotes;
              }
              
              // Broadcast the updated line to all clients
              broadcastToClients(wss, {
                type: 'call_line_update',
                line
              });
            } else {
              console.warn(`No call line found with ID ${lineId} for callInfoUpdate`);
            }
          } else {
            console.warn('Invalid lineId in callInfoUpdate message:', data);
          }
          return;
        }
        
        // Fallback for unhandled message types
        console.log(`Unhandled WebSocket message type: ${data.type}`);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });
    
    // Handle WebSocket closure
    ws.on('close', () => {
      try {
        console.log(`WebSocket client disconnected (#${wss.clients.size})`);
        
        // Remove client from role-based tracking
        const clientRole = (ws as any).role;
        if (clientRole && ['producer', 'talent', 'admin', 'tech', 'remote'].includes(clientRole)) {
          serverState.clientsByRole[clientRole as UserRole].delete(ws);
        }
        
        // Remove client from studio-specific tracking
        const clientStudioId = (ws as any).studioId;
        if (clientStudioId && ['A', 'B', 'RE'].includes(clientStudioId)) {
          serverState.clientsByStudio[clientStudioId as StudioId].delete(ws);
        }
      } catch (error) {
        console.error('Error handling WebSocket closure:', error);
      }
    });
    
    // Handle WebSocket errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
    
    // Handle pong responses to track activity
    ws.on('pong', () => {
      (ws as any).lastActivity = Date.now();
      console.log(`Received pong from client ${(ws as any).clientId || (ws as any).role || 'unknown'}`);
    });
  });
  
  return httpServer;
}

import express, { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { randomUUID } from 'crypto';

// Use express types to avoid type conflicts
type Request = ExpressRequest;
type Response = ExpressResponse;

// Simple middleware since auth is not fully implemented
const isAuthenticated = (req: Request, res: Response, next: Function) => next();

// Interface for chat messages
interface ChatMessage {
  id: string;
  senderRole: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  studioId: 'A' | 'B' | 'RE' | 'TECH';
}

// In-memory storage for chat messages
const chatMessages: Record<string, ChatMessage[]> = {
  A: [],
  B: [],
  RE: [],
  TECH: []
};

/**
 * Setup chat message routes
 * 
 * @param app Express application
 * @param wss WebSocket server
 */
export function setupChatRoutes(app: express.Express, wss: WebSocketServer) {
  // Get all chat messages for a specific studio
  app.get('/api/chat-messages/:studioId', isAuthenticated, (req: Request, res: Response) => {
    const studioId = req.params.studioId as 'A' | 'B' | 'RE' | 'TECH';
    
    if (!studioId || !chatMessages[studioId]) {
      return res.status(400).json({ error: 'Invalid studio ID' });
    }
    
    res.json(chatMessages[studioId]);
  });

  // Send a new chat message
  app.post('/api/chat-messages', isAuthenticated, (req: Request, res: Response) => {
    const { senderRole, content, studioId, timestamp } = req.body;
    
    if (!senderRole || !content || !studioId || !timestamp) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (!['A', 'B', 'RE', 'TECH'].includes(studioId)) {
      return res.status(400).json({ error: 'Invalid studio ID' });
    }
    
    const newMessage: ChatMessage = {
      id: randomUUID(),
      senderRole,
      content,
      timestamp: new Date(timestamp),
      isRead: false,
      studioId: studioId as 'A' | 'B' | 'RE' | 'TECH'
    };
    
    chatMessages[studioId].push(newMessage);
    
    // Broadcast message to all WebSocket clients
    wss.clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({
          type: 'newChatMessage',
          data: newMessage
        }));
      }
    });
    
    res.status(201).json(newMessage);
  });

  // Mark chat messages as read
  app.post('/api/chat-messages/mark-read', isAuthenticated, (req: Request, res: Response) => {
    const { receiverRole, senderRole, studioId } = req.body;
    
    if (!receiverRole || !senderRole || !studioId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (!chatMessages[studioId]) {
      return res.status(400).json({ error: 'Invalid studio ID' });
    }
    
    // Mark messages as read
    chatMessages[studioId].forEach(message => {
      if (message.senderRole === senderRole && !message.isRead) {
        message.isRead = true;
      }
    });
    
    res.status(200).json({ success: true });
  });

  // Clear all chat messages for a specific studio
  app.post('/api/chat-messages/clear/:studioId', isAuthenticated, (req: Request, res: Response) => {
    const studioId = req.params.studioId as 'A' | 'B' | 'RE' | 'TECH';
    
    if (!studioId || !chatMessages[studioId]) {
      return res.status(400).json({ error: 'Invalid studio ID' });
    }
    
    // Clear messages
    chatMessages[studioId] = [];
    
    // Broadcast clear message to all WebSocket clients
    wss.clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({
          type: 'clearChatMessages',
          data: { studioId }
        }));
      }
    });
    
    res.status(200).json({ success: true });
  });

  // Add WebSocket event handler for chat messages
  wss.on('connection', (ws) => {
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle chat message
        if (data.type === 'chatMessage') {
          const { senderRole, content, studioId, timestamp } = data.data;
          
          if (!senderRole || !content || !studioId || !timestamp) {
            return;
          }
          
          const newMessage: ChatMessage = {
            id: randomUUID(),
            senderRole,
            content,
            timestamp: new Date(timestamp),
            isRead: false,
            studioId
          };
          
          chatMessages[studioId].push(newMessage);
          
          // Broadcast to all clients
          wss.clients.forEach(client => {
            if (client !== ws && client.readyState === 1) {
              client.send(JSON.stringify({
                type: 'newChatMessage',
                data: newMessage
              }));
            }
          });
        }
        
        // Handle marking messages as read
        else if (data.type === 'markChatMessagesAsRead') {
          const { receiverRole, senderRole, studioId } = data.data;
          
          if (!receiverRole || !senderRole || !studioId) {
            return;
          }
          
          // Mark messages as read
          chatMessages[studioId].forEach(message => {
            if (message.senderRole === senderRole && !message.isRead) {
              message.isRead = true;
            }
          });
        }
        
        // Handle clearing chat messages
        else if (data.type === 'clearChatMessages') {
          const { studioId } = data.data;
          
          if (!studioId || !chatMessages[studioId]) {
            return;
          }
          
          // Clear messages
          chatMessages[studioId] = [];
          
          // Broadcast to all clients except sender
          wss.clients.forEach(client => {
            if (client !== ws && client.readyState === 1) {
              client.send(JSON.stringify({
                type: 'clearChatMessages',
                data: { studioId }
              }));
            }
          });
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
  });

  // Initialize with welcome messages
  if (chatMessages.A.length === 0) {
    const welcomeMessage: ChatMessage = {
      id: randomUUID(),
      senderRole: 'system',
      content: 'Welcome to Studio A chat. Messages here will be delivered instantly to the talent.',
      timestamp: new Date(),
      isRead: true,
      studioId: 'A'
    };
    chatMessages.A.push(welcomeMessage);
  }
  
  if (chatMessages.B.length === 0) {
    const welcomeMessage: ChatMessage = {
      id: randomUUID(),
      senderRole: 'system',
      content: 'Welcome to Studio B chat. Messages here will be delivered instantly to the talent.',
      timestamp: new Date(),
      isRead: true,
      studioId: 'B'
    };
    chatMessages.B.push(welcomeMessage);
  }
  
  if (chatMessages.RE.length === 0) {
    const welcomeMessage: ChatMessage = {
      id: randomUUID(),
      senderRole: 'system',
      content: 'Welcome to Remote Studio chat. Messages here will be delivered instantly to the remote talent.',
      timestamp: new Date(),
      isRead: true,
      studioId: 'RE'
    };
    chatMessages.RE.push(welcomeMessage);
  }
  
  if (chatMessages.TECH.length === 0) {
    const welcomeMessage: ChatMessage = {
      id: randomUUID(),
      senderRole: 'system',
      content: 'Welcome to Tech Support chat. Messages here will be delivered instantly to the technical team.',
      timestamp: new Date(),
      isRead: true,
      studioId: 'TECH'
    };
    chatMessages.TECH.push(welcomeMessage);
  }
}
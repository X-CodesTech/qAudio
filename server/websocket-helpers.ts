import { WebSocketServer, WebSocket } from 'ws';

/**
 * Broadcast a message to all WebSocket clients with a specific role
 */
export function broadcastToRole(wss: WebSocketServer, role: string, data: any) {
  console.log(`Broadcasting to role: ${role}, message type: ${data.type}`);
  let clientCount = 0;
  
  wss.clients.forEach(client => {
    // Check if client is open and has the matching role
    if (client.readyState === WebSocket.OPEN && (client as any).role === role) {
      try {
        client.send(JSON.stringify(data));
        clientCount++;
      } catch (error) {
        console.error(`Error sending message to ${role} client:`, error);
      }
    }
  });
  
  console.log(`Broadcasted to ${clientCount} ${role} clients`);
}

/**
 * Send a message to a specific client ID
 */
export function sendToClient(wss: WebSocketServer, clientId: string, data: any) {
  console.log(`Sending to client: ${clientId}, message type: ${data.type}`);
  let sent = false;
  
  wss.clients.forEach(client => {
    // Check if client is open and has the matching client ID
    if (client.readyState === WebSocket.OPEN && (client as any).clientId === clientId) {
      try {
        client.send(JSON.stringify(data));
        sent = true;
      } catch (error) {
        console.error(`Error sending message to client ${clientId}:`, error);
      }
    }
  });
  
  return sent;
}

/**
 * Find clients with a specific role
 */
export function findClientsByRole(wss: WebSocketServer, role: string): WebSocket[] {
  const clients: WebSocket[] = [];
  
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && (client as any).role === role) {
      clients.push(client);
    }
  });
  
  return clients;
}
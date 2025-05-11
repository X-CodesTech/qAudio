/**
 * SIP Integration
 * 
 * This module provides functions for interacting with SIP services.
 * It uses a server-side API approach rather than a direct client-side SIP connection,
 * allowing it to work with any SIP provider that uses standard protocols.
 */

export type SIPStatus = 'connected' | 'disconnected' | 'connecting';

export type NetworkInterface = {
  id: string;
  name: string;
  type: string; // 'ethernet', 'wifi', etc.
  address: string;
  active: boolean;
  isDefault: boolean;
  isVirtual: boolean;
};

// Internal state
let sipStatus: SIPStatus = 'disconnected';
let activeCallsMap = new Map<string, {
  id: string;
  phoneNumber: string;
  startTime: Date;
}>();

// Legacy reference to maintain backward compatibility
let registrationStatus = false;

// Get all available network interfaces for SIP binding
export const getNetworkInterfaces = async (): Promise<NetworkInterface[]> => {
  try {
    const response = await fetch('/api/network-interfaces');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch network interfaces: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to get network interfaces:', error);
    
    // Return a fallback
    return [
      { 
        id: 'default',
        name: 'Default System Interface', 
        type: 'system', 
        address: '0.0.0.0', 
        active: true,
        isDefault: true,
        isVirtual: false
      }
    ];
  }
};

// Keep track of connection attempts to avoid excessive reconnects
let connectionInProgress = false;
let lastConnectionAttempt = 0;
const MIN_RECONNECT_INTERVAL = 5000; // 5 seconds minimum between reconnect attempts

// Initialize SIP connection
export const initSIP = async (
  sipServer?: string, 
  networkInterfaceId?: string
): Promise<boolean> => {
  // Prevent multiple simultaneous connection attempts
  if (connectionInProgress) {
    console.log('SIP connection attempt already in progress, skipping...');
    return sipStatus === 'connected';
  }
  
  // Don't try to reconnect too frequently
  const now = Date.now();
  if (now - lastConnectionAttempt < MIN_RECONNECT_INTERVAL) {
    console.log('Too many reconnect attempts, throttling...');
    return sipStatus === 'connected';
  }
  
  connectionInProgress = true;
  lastConnectionAttempt = now;
  sipStatus = 'connecting';
  
  try {
    // Log server and interface info if provided
    if (sipServer) {
      console.log(`Initializing SIP connection to ${sipServer}${networkInterfaceId ? ` via interface ${networkInterfaceId}` : ''}...`);
    } else {
      console.log('Initializing SIP connection with default server...');
    }
    
    // Get SIP account details from the server
    try {
      // Log fetching SIP status with full URL for debugging
      console.log("Fetching SIP status from:", `${window.location.origin}/api/sip-status`);
      
      const sipStatusResponse = await fetch('/api/sip-status', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (sipStatusResponse.ok) {
        const sipStatusData = await sipStatusResponse.json();
        
        // Log raw response for debugging
        console.log("Raw SIP status response:", JSON.stringify(sipStatusData));
        
        if (sipStatusData.registered && sipStatusData.account) {
          console.log(`Using SIP account: ${sipStatusData.account.username}@${sipStatusData.account.server}`);
          sipStatus = 'connected';
          console.log("SIP Registration Status: Connected");
          console.log(`Connected to: ${sipStatusData.account.username}@${sipStatusData.account.server}`);
        } else {
          console.log('SIP account not registered');
          sipStatus = 'disconnected';
          console.log("SIP Registration Status: Disconnected");
        }
      } else {
        sipStatus = 'disconnected';
        console.log("SIP Registration Status: Disconnected (server error)");
      }
    } catch (error) {
      console.error('Error getting SIP account information:', error);
      sipStatus = 'disconnected';
      console.log("SIP Registration Status: Disconnected (error)");
    }
    
    connectionInProgress = false;
    return sipStatus === 'connected';
  } catch (error) {
    console.error('SIP initialization error:', error);
    connectionInProgress = false;
    sipStatus = 'disconnected';
    console.log("SIP Registration Status: Disconnected (initialization error)");
    return false;
  }
};

// Set up SIP connection with credentials (compatibility function)
export const setupSIPConnection = async (config: {
  server: string;
  username: string;
  password: string;
  authProxy?: string;
  outboundProxy?: string;
  networkInterfaceId?: string;
}): Promise<boolean> => {
  try {
    console.log('Setting up SIP connection with config:', { 
      server: config.server, 
      username: config.username,
      authProxy: config.authProxy,
      outboundProxy: config.outboundProxy,
      networkInterfaceId: config.networkInterfaceId
    });
    
    // Test the connection first
    const testResult = await testSIPConnection({
      server: config.server,
      username: config.username,
      password: config.password
    });
    
    if (testResult.success) {
      console.log('SIP credentials validated, initializing connection');
      // Initialize the SIP connection
      return await initSIP(config.server, config.networkInterfaceId);
    } else {
      console.error('SIP credentials validation failed:', testResult.message);
      return false;
    }
  } catch (error) {
    console.error('Error setting up SIP connection:', error);
    return false;
  }
};

// Test SIP connection with credentials
export const testSIPConnection = async (config: {
  server: string;
  username: string;
  password: string;
}): Promise<{ success: boolean; message: string; details?: any }> => {
  try {
    console.log(`Testing SIP connection to ${config.server} with username ${config.username}...`);
    
    const response = await fetch('/api/sip-test-connection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sipServer: config.server,
        username: config.username,
        password: config.password
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      return result;
    } else {
      return {
        success: false,
        message: `Server error: ${response.status} ${response.statusText}`
      };
    }
  } catch (error) {
    console.error('Error testing SIP connection:', error);
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Make a call using the SIP server API
export const makeCall = async (phoneNumber: string): Promise<boolean> => {
  try {
    console.log(`Making call to ${phoneNumber}...`);
    
    // First check if we have a SIP connection
    if (sipStatus !== 'connected') {
      // Try to initialize the SIP connection first
      await initSIP();
    }
    
    // Use the server API to place the call
    try {
      // Get current SIP status to make sure we have the latest account info
      const sipStatusResponse = await fetch('/api/sip-status', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (sipStatusResponse.ok) {
        const sipStatusData = await sipStatusResponse.json();
        
        if (sipStatusData.registered && sipStatusData.account) {
          // Log the account being used for the call
          console.log(`Using SIP account: ${sipStatusData.account.username}@${sipStatusData.account.server}`);
          
          // Make the call using the server API
          const callResponse = await fetch('/api/sip-make-call', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              phoneNumber: phoneNumber,
              username: sipStatusData.account.username,
              server: sipStatusData.account.server
            })
          });
          
          if (callResponse.ok) {
            const callResult = await callResponse.json();
            
            if (callResult.success) {
              console.log(`Call successfully initiated to ${phoneNumber}`);
              console.log('Call details:', callResult);
              
              // Store call ID for future reference
              const callId = callResult.callId || `call-${Date.now()}`;
              
              // Add to active calls map for tracking
              activeCallsMap.set(callId, {
                id: callId,
                phoneNumber,
                startTime: new Date()
              });
              
              return true;
            } else {
              console.error('Failed to make call:', callResult.message);
              return false;
            }
          } else {
            console.error('Failed to make call, API returned error:', callResponse.status, callResponse.statusText);
            return false;
          }
        } else {
          console.warn('SIP account not registered. Cannot make call.');
          return false;
        }
      } else {
        console.error('Failed to get SIP status');
        return false;
      }
    } catch (error) {
      console.error('Error making call via API:', error);
      
      // For debugging in development, fallback to a demo mode that simulates a call
      if (import.meta.env.DEV) {
        console.log('DEV MODE: Simulating successful call to:', phoneNumber);
        const callId = `demo-call-${Date.now()}`;
        
        // Add to active calls map for tracking
        activeCallsMap.set(callId, {
          id: callId,
          phoneNumber,
          startTime: new Date()
        });
        
        return true;
      }
      
      return false;
    }
  } catch (error) {
    console.error('Error making call:', error);
    return false;
  }
};

// End a call
export const hangupCall = async (sessionId: string): Promise<boolean> => {
  try {
    console.log(`Hanging up call ${sessionId}...`);
    
    // Use the API to hangup the call
    const response = await fetch('/api/sip-hangup-call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      
      if (result.success) {
        console.log(`Successfully hung up call ${sessionId}`);
        
        // Remove from active calls map
        activeCallsMap.delete(sessionId);
        
        return true;
      } else {
        console.error(`Failed to hang up call ${sessionId}:`, result.message);
        return false;
      }
    } else {
      console.error(`Failed to hang up call ${sessionId}, API returned error:`, response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error(`Error hanging up call ${sessionId}:`, error);
    return false;
  }
};

// Place a call on hold
export const holdCall = async (sessionId: string): Promise<boolean> => {
  try {
    console.log(`Placing call ${sessionId} on hold...`);
    
    // Use the API to hold the call
    const response = await fetch('/api/sip-hold-call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      
      if (result.success) {
        console.log(`Successfully placed call ${sessionId} on hold`);
        return true;
      } else {
        console.error(`Failed to hold call ${sessionId}:`, result.message);
        return false;
      }
    } else {
      console.error(`Failed to hold call ${sessionId}, API returned error:`, response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error(`Error holding call ${sessionId}:`, error);
    return false;
  }
};

// Take a call off hold
export const unholdCall = async (sessionId: string): Promise<boolean> => {
  try {
    console.log(`Taking call ${sessionId} off hold...`);
    
    // Use the API to unhold the call
    const response = await fetch('/api/sip-unhold-call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      
      if (result.success) {
        console.log(`Successfully took call ${sessionId} off hold`);
        return true;
      } else {
        console.error(`Failed to unhold call ${sessionId}:`, result.message);
        return false;
      }
    } else {
      console.error(`Failed to unhold call ${sessionId}, API returned error:`, response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error(`Error unholding call ${sessionId}:`, error);
    return false;
  }
};

// Transfer a call
export const transferCall = async (sessionId: string, target: string): Promise<boolean> => {
  try {
    console.log(`Transferring call ${sessionId} to ${target}...`);
    
    // Use the API to transfer the call
    const response = await fetch('/api/sip-transfer-call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId,
        target
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      
      if (result.success) {
        console.log(`Successfully transferred call ${sessionId} to ${target}`);
        return true;
      } else {
        console.error(`Failed to transfer call ${sessionId}:`, result.message);
        return false;
      }
    } else {
      console.error(`Failed to transfer call ${sessionId}, API returned error:`, response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.error(`Error transferring call ${sessionId}:`, error);
    return false;
  }
};

// Get current SIP status
export const getSIPStatus = (): SIPStatus => {
  return sipStatus;
};

// Get active calls
export const getActiveCalls = (): Map<string, { id: string; phoneNumber: string; startTime: Date }> => {
  return activeCallsMap;
};
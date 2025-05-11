/**
 * Direct Call Handler
 * 
 * This module provides a simplified and reliable way to make outbound calls
 * by using a server-side approach rather than relying on browser-based SIP.js.
 * This bypasses browser limitations and network issues common in web-based VoIP.
 */

import { toast } from '@/hooks/use-toast';

interface CallOptions {
  phoneNumber: string;
  lineId: number;
  sipUsername?: string;
  sipServer?: string;
  networkInterfaceId?: string | number;
}

/**
 * Makes a direct outbound call via the server
 * This approach is more reliable than browser-based SIP.js
 */
export async function makeDirectCall(options: CallOptions): Promise<{
  success: boolean;
  callId?: string;
  message: string;
  line?: any;
}> {
  try {
    console.log(`Initiating direct call to ${options.phoneNumber} on line ${options.lineId}`);
    
    // First try the specialized international call endpoint which has enhanced error handling
    const response = await fetch('/api/test-international-call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        lineId: options.lineId,
        phoneNumber: options.phoneNumber,
        username: options.sipUsername,
        server: options.sipServer,
        networkInterfaceId: options.networkInterfaceId
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Server error making direct call:", errorText);
      throw new Error(`Server error: ${response.status} ${errorText}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      console.log("Direct call initiated successfully:", result);
      return {
        success: true,
        callId: result.callId,
        message: result.message,
        line: result.line
      };
    } else {
      console.error("Error initiating direct call:", result);
      
      // Fall back to the regular SIP call endpoint
      console.log("Falling back to standard SIP call endpoint");
      const fallbackResponse = await fetch('/api/sip-make-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lineId: options.lineId,
          phoneNumber: options.phoneNumber,
          username: options.sipUsername,
          server: options.sipServer,
          networkInterfaceId: options.networkInterfaceId
        })
      });
      
      if (!fallbackResponse.ok) {
        const fallbackErrorText = await fallbackResponse.text();
        throw new Error(`Fallback error: ${fallbackResponse.status} ${fallbackErrorText}`);
      }
      
      const fallbackResult = await fallbackResponse.json();
      
      if (fallbackResult.success) {
        console.log("Fallback call initiated successfully:", fallbackResult);
        return {
          success: true,
          callId: fallbackResult.callId,
          message: 'Call initiated via fallback method',
          line: fallbackResult.line
        };
      } else {
        console.error("Both call methods failed:", fallbackResult);
        return {
          success: false,
          message: fallbackResult.message || 'Failed to initiate call with all available methods'
        };
      }
    }
  } catch (error) {
    console.error("Exception making direct call:", error);
    return {
      success: false,
      message: error instanceof Error 
        ? `Call error: ${error.message}` 
        : 'Unknown error occurred'
    };
  }
}

/**
 * Hang up a call via direct server-side method
 */
export async function hangupDirectCall(callId: string, lineId: number): Promise<boolean> {
  try {
    console.log(`Hanging up call ${callId} on line ${lineId}`);
    
    // First try the specialized hangup endpoint
    const response = await fetch('/api/sip-hangup-call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId: callId,
        lineId: lineId
      })
    });
    
    if (!response.ok) {
      console.error(`Server error (${response.status}) hanging up call`);
      
      // Try the line status update approach as fallback
      const fallbackResponse = await fetch(`/api/call-lines/${lineId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'inactive',
          phoneNumber: null,
          notes: null,
          startTime: null,
          duration: null
        })
      });
      
      if (fallbackResponse.ok) {
        console.log("Call hung up via fallback method");
        return true;
      } else {
        console.error("Both hangup methods failed");
        return false;
      }
    }
    
    const result = await response.json();
    
    if (result.success) {
      console.log("Call hung up successfully");
      return true;
    } else {
      console.error("Error hanging up call:", result);
      
      // Try the line status update approach as fallback
      const fallbackResponse = await fetch(`/api/call-lines/${lineId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'inactive',
          phoneNumber: null,
          notes: null,
          startTime: null,
          duration: null
        })
      });
      
      if (fallbackResponse.ok) {
        console.log("Call hung up via fallback method");
        return true;
      } else {
        console.error("Both hangup methods failed");
        return false;
      }
    }
  } catch (error) {
    console.error("Exception hanging up call:", error);
    return false;
  }
}

/**
 * Utility function to check if a phone number is international format
 */
export function isInternationalNumber(phoneNumber: string): boolean {
  return phoneNumber.startsWith('+') || phoneNumber.startsWith('00');
}

/**
 * Format a phone number for display
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Simple formatting - ideally you'd use a library like libphonenumber-js
  if (!phoneNumber) return '';
  
  // If it's already in international format, return as is
  if (isInternationalNumber(phoneNumber)) {
    return phoneNumber;
  }
  
  // For US numbers, try to format as (XXX) XXX-XXXX
  if (phoneNumber.length === 10) {
    return `(${phoneNumber.substring(0, 3)}) ${phoneNumber.substring(3, 6)}-${phoneNumber.substring(6)}`;
  }
  
  // For numbers that don't match patterns, return as is
  return phoneNumber;
}
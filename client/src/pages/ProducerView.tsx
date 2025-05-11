import React, { useState, useEffect, useRef } from 'react';
import { useVoIP } from '@/contexts/VoIPContext';
import { useTranslation } from 'react-i18next';
import { useStudioMode } from '@/contexts/StudioModeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLineCount } from '@/contexts/LineCountContext';
import { Link } from 'wouter';
import CallLinesContainer from '@/components/CallLinesContainer';
import axios from 'axios';
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { CallLine } from '@shared/schema';
import { formatDuration } from '../lib/utils';
import ContentTabs from '../components/ContentTabs';
import AudioMeter from '../components/AudioMeter';
import BuzzerButton from '../components/SocketBuzzer';
import StandaloneTimer from '../components/StandaloneTimer';
// CountdownHeader removed in favor of StandaloneTimer
import StudioModeSwitcher from '../components/StudioModeSwitcher';
import { StudioTransition } from '../components/StudioTransition';
import { LineCountSelector } from '../components/LineCountSelector';
// TabbedChatWindow component imported below with @/ syntax
import { 
  MessageSquare, Phone, PhoneCall, PhoneOff, Radio, 
  PauseCircle, FileText, Trash, MoreVertical, Save,
  Clock, Calendar, Wifi, WifiOff, Globe, Network,
  ArrowLeftRight, Activity, RefreshCw, PowerOff, Volume2,
  UserCircle, Settings, LogOut
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DialPad from '@/components/DialPad';
import QuickDialContacts from '@/components/QuickDialContacts';
import CallHistory from '@/components/CallHistory';
import TabbedChatWindow from '@/components/TabbedChatWindow';
import AdminViewTabs from '@/components/AdminViewTabs';
import QCallerLogo from '@assets/qcaller_logo_v4.png';

// Define types for chat messages
type ChatMessage = {
  id: number;
  senderRole: 'admin' | 'producer' | 'talent';
  receiverRole?: string;
  receiverId: number;
  message: string;
  timestamp: string;
  read: boolean;
  fileAttachment?: string;
  studioId?: 'A' | 'B' | 'C' | 'D' | 'RE'; // To distinguish between Talent A, B, C, D, and RE Studio
  isRemoteStudio?: boolean; // Flag to mark messages for RE Studio
};

// Main component for the producer view
export default function ProducerView() {
  // Hardcode the role since this is the ProducerView
  const role = 'producer';
  const { callLines, holdCall, makeCall, hangupCall, sendToAir, takeOffAir, addNoteToCall } = useVoIP();
  // Use the studio mode context instead of local state
  const { activeStudio, setActiveStudio, getStudioColor } = useStudioMode();
  // Get line count from context for dynamic line management
  const { lineCount } = useLineCount();
  // Get user data from auth context
  const { currentUser, logoutMutation } = useAuth();
  
  // Handle user logout
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  // Debug: Log to verify all call lines exist
  console.log("Available call lines:", callLines.map(line => `Line ${line.id} (Studio ${line.studio || 'unknown'})`));
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [studioAChatMessages, setStudioAChatMessages] = useState<ChatMessage[]>([]);
  const [studioBChatMessages, setStudioBChatMessages] = useState<ChatMessage[]>([]);
  const [studioCChatMessages, setStudioCChatMessages] = useState<ChatMessage[]>([]);
  const [studioDChatMessages, setStudioDChatMessages] = useState<ChatMessage[]>([]);
  const [reStudioChatMessages, setReStudioChatMessages] = useState<ChatMessage[]>([]);
  // Fixed slide transition (no selector needed)
  const transitionType = 'slide' as const;
  const [newMessage, setNewMessage] = useState('');
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const [talentId, setTalentId] = useState<number | null>(null);
  const [callNotes, setCallNotes] = useState<{ [key: number]: string }>({});
  const [callerNames, setCallerNames] = useState<{ [key: number]: string }>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedLine, setSelectedLine] = useState<number | undefined>(undefined);
  const [showDialPad, setShowDialPad] = useState(false);
  const [dialPadTab, setDialPadTab] = useState('dial-pad');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedLineTimerRef = useRef<NodeJS.Timeout | null>(null);
  const studioAMessagesEndRef = useRef<HTMLDivElement>(null);
  const studioBMessagesEndRef = useRef<HTMLDivElement>(null);
  const studioCMessagesEndRef = useRef<HTMLDivElement>(null);
  const studioDMessagesEndRef = useRef<HTMLDivElement>(null);
  const reStudioMessagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-clear selected line after 3 seconds
  useEffect(() => {
    if (selectedLine !== undefined) {
      // Clear any existing timer
      if (selectedLineTimerRef.current) {
        clearTimeout(selectedLineTimerRef.current);
      }
      
      // Set a new timer
      selectedLineTimerRef.current = setTimeout(() => {
        setSelectedLine(undefined);
      }, 3000); // 3 seconds
    }
    
    return () => {
      if (selectedLineTimerRef.current) {
        clearTimeout(selectedLineTimerRef.current);
      }
    };
  }, [selectedLine]);

  // Track if chat has been cleared
  const [studioAChatCleared, setStudioAChatCleared] = useState(false);
  const [studioBChatCleared, setStudioBChatCleared] = useState(false);
  const [studioCChatCleared, setStudioCChatCleared] = useState(false);
  const [studioDChatCleared, setStudioDChatCleared] = useState(false);
  const [hasNewReStudioMessages, setHasNewReStudioMessages] = useState(false);

  // Reference to track if WebSocket was manually closed
  const manuallyClosedRef = useRef(false);
  // Reference to track WebSocket connection status
  const wsConnectedRef = useRef(false);
  // References to track chat clearing
  const studioAClearedRef = useRef(false);
  const studioBClearedRef = useRef(false);
  const studioCClearedRef = useRef(false);
  const studioDClearedRef = useRef(false);

  // Connect to WebSocket for real-time communication
  // This effect manages the WebSocket connection
  useEffect(() => {
    // Update refs with current state values
    studioAClearedRef.current = studioAChatCleared;
    studioBClearedRef.current = studioBChatCleared;
    studioCClearedRef.current = studioCChatCleared;
    studioDClearedRef.current = studioDChatCleared;
    
    let wsInstance: WebSocket | null = null;

    // Create a function to handle WebSocket connection
    const connectWebSocket = (): void => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      wsInstance = new WebSocket(wsUrl);
  
      wsInstance.onopen = function(): void {
        console.log('WebSocket connected');
        wsConnectedRef.current = true;
        // Authenticate the WebSocket connection with current role
        wsInstance?.send(JSON.stringify({
          type: 'auth',
          role: role,
          // Producer can communicate with all studios
          studioAccess: ['A', 'B', 'C', 'D'],
          // Send the cleared states with authentication
          clearedStates: {
            studioA: studioAClearedRef.current,
            studioB: studioBClearedRef.current,
            studioC: studioCClearedRef.current,
            studioD: studioDClearedRef.current
          }
        }));
        
        // Save the WebSocket instance to state for use in other functions
        setWsConnection(wsInstance);
      };
  
      wsInstance.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'chatHistory') {
          // Process chat history and separate by studio, respecting cleared state
          const messages = data.data;
          setChatMessages(messages);
          
          console.log(`Received chat history with ${messages.length} messages. Cleared flags - A: ${studioAClearedRef.current}, B: ${studioBClearedRef.current}`);
          
          // Filter messages by studio
          const studioAMessages = messages.filter((msg: ChatMessage) => 
            msg.studioId === 'A' || !msg.studioId
          );
          const studioBMessages = messages.filter((msg: ChatMessage) => 
            msg.studioId === 'B'
          );
          const studioCMessages = messages.filter((msg: ChatMessage) => 
            msg.studioId === 'C'
          );
          const studioDMessages = messages.filter((msg: ChatMessage) => 
            msg.studioId === 'D'
          );
          const reStudioMessages = messages.filter((msg: ChatMessage) => 
            msg.studioId === 'RE' || msg.isRemoteStudio === true
          );
          
          console.log(`Studio A: ${studioAMessages.length}, Studio B: ${studioBMessages.length}, Studio C: ${studioCMessages.length}, Studio D: ${studioDMessages.length}, RE Studio: ${reStudioMessages.length} messages`);
          
          // Only update if not manually cleared
          if (!studioAClearedRef.current) {
            setStudioAChatMessages(studioAMessages);
            console.log(`Updated Studio A chat history with ${studioAMessages.length} messages`);
          } else {
            console.log('Skipped updating Studio A chat history (marked as cleared)');
          }
          
          if (!studioBClearedRef.current) {
            setStudioBChatMessages(studioBMessages);
            console.log(`Updated Studio B chat history with ${studioBMessages.length} messages`);
          } else {
            console.log('Skipped updating Studio B chat history (marked as cleared)');
          }
          
          if (!studioCClearedRef.current) {
            setStudioCChatMessages(studioCMessages);
            console.log(`Updated Studio C chat history with ${studioCMessages.length} messages`);
          } else {
            console.log('Skipped updating Studio C chat history (marked as cleared)');
          }
          
          if (!studioDClearedRef.current) {
            setStudioDChatMessages(studioDMessages);
            console.log(`Updated Studio D chat history with ${studioDMessages.length} messages`);
          } else {
            console.log('Skipped updating Studio D chat history (marked as cleared)');
          }
          
          // Always update RE Studio messages (we don't have a clear flag for this yet)
          setReStudioChatMessages(reStudioMessages);
          console.log(`Updated RE Studio chat history with ${reStudioMessages.length} messages`);
        } else if (data.type === 'newChatMessage') {
          // Process the new message and add ONLY to the appropriate studio chat
          const newMessage = data.data;
          
          // Check if this is an RE Studio message
          if (newMessage.studioId === 'RE' || newMessage.isRemoteStudio === true) {
            setReStudioChatMessages(prev => [...prev, newMessage]);
            
            // Add a visual notification for the RE Studio tab if we're not currently viewing it
            const isReStudioTabActive = document.querySelector('[data-state="active"][value="re-studio"]') !== null;
            if (!isReStudioTabActive && newMessage.senderRole !== role) {
              setHasNewReStudioMessages(true);
            }
            
          } else if (newMessage.studioId === 'A' || !newMessage.studioId) {
            // Reset cleared state for Studio A when we receive a new message
            if (studioAClearedRef.current) {
              studioAClearedRef.current = false;
              setStudioAChatCleared(false);
            }
            setStudioAChatMessages(prev => [...prev, newMessage]);
          } else if (newMessage.studioId === 'B') {
            // Reset cleared state for Studio B when we receive a new message
            if (studioBClearedRef.current) {
              studioBClearedRef.current = false;
              setStudioBChatCleared(false);
            }
            setStudioBChatMessages(prev => [...prev, newMessage]);
          } else if (newMessage.studioId === 'C') {
            // Reset cleared state for Studio C when we receive a new message
            if (studioCClearedRef.current) {
              studioCClearedRef.current = false;
              setStudioCChatCleared(false);
            }
            setStudioCChatMessages(prev => [...prev, newMessage]);
          } else if (newMessage.studioId === 'D') {
            // Reset cleared state for Studio D when we receive a new message
            if (studioDClearedRef.current) {
              studioDClearedRef.current = false;
              setStudioDChatCleared(false);
            }
            setStudioDChatMessages(prev => [...prev, newMessage]);
          }
        } else if (data.type === 'producerBuzzer') {
          // Handle buzzer notification from talent to producer
          console.log('Producer view received producerBuzzer message:', data);
          
          // Extract data to use for both studio A and B buzzers
          const { studioId, activate } = data.data;
          
          // Create a custom event to notify the BuzzerButton components
          const event = new CustomEvent('producerBuzzerEvent', { 
            detail: { studioId, activate }
          });
          
          // Dispatch the event to be caught by BuzzerButton components
          window.dispatchEvent(event);
        } else if (data.type === 'clearChat') {
          // Handle clear chat commands from other users/roles
          const { studioId } = data.data;
          console.log(`Received clearChat command for studio: ${studioId || 'all'}`);
          
          if (!studioId) {
            // Clear all chats if no studioId specified
            setChatMessages([]);
            setStudioAChatMessages([]);
            setStudioBChatMessages([]);
            setStudioCChatMessages([]);
            setStudioDChatMessages([]);
            setReStudioChatMessages([]); // Clear RE Studio messages too
            
            // Update cleared flags for all studios
            studioAClearedRef.current = true;
            studioBClearedRef.current = true;
            studioCClearedRef.current = true;
            studioDClearedRef.current = true;
            setStudioAChatCleared(true);
            setStudioBChatCleared(true);
            setStudioCChatCleared(true);
            setStudioDChatCleared(true);
            
            console.log('All chat histories have been cleared');
          } else if (studioId === 'A') {
            setStudioAChatMessages([]);
            // Update cleared flag for Studio A
            studioAClearedRef.current = true;
            setStudioAChatCleared(true);
            console.log('Studio A chat history has been cleared');
          } else if (studioId === 'B') {
            setStudioBChatMessages([]);
            // Update cleared flag for Studio B
            studioBClearedRef.current = true;
            setStudioBChatCleared(true);
            console.log('Studio B chat history has been cleared');
          } else if (studioId === 'C') {
            setStudioCChatMessages([]);
            // Update cleared flag for Studio C
            studioCClearedRef.current = true;
            setStudioCChatCleared(true);
            console.log('Studio C chat history has been cleared');
          } else if (studioId === 'D') {
            setStudioDChatMessages([]);
            // Update cleared flag for Studio D
            studioDClearedRef.current = true;
            setStudioDChatCleared(true);
            console.log('Studio D chat history has been cleared');
          } else if (studioId === 'RE') {
            // Clear RE Studio messages
            setReStudioChatMessages([]);
            // Reset notification indicator too
            setHasNewReStudioMessages(false);
            console.log('RE Studio chat history has been cleared');
          }
        }
      };

      wsInstance.onclose = function(): void {
        console.log('WebSocket disconnected');
        wsConnectedRef.current = false;
        
        // Try to reconnect after a delay if not manually closed
        if (!manuallyClosedRef.current) {
          setTimeout(() => {
            if (document.visibilityState !== 'hidden') {
              console.log('Attempting to reconnect WebSocket...');
              connectWebSocket();
            }
          }, 3000);
        }
      };
    };

    // Initial connection
    connectWebSocket();

    return () => {
      manuallyClosedRef.current = true; // Mark as manually closed to prevent reconnection
      if (wsInstance) {
        wsInstance.close();
      }
    };
  }, [role]);

  // Fetch talent user for chat
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch talent users
        const response = await fetch('/api/users?role=talent');
        const talents = await response.json();
        
        if (talents && talents.length > 0) {
          setTalentId(talents[0].id);
          
          // We'll get chat messages through WebSocket to avoid duplicates
          // The server sends the chat history when we authenticate
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    }
    
    fetchData();
  }, [role]);

  // Scroll to bottom only when sending a new message (not auto-scroll on receiving)
  const scrollToBottom = (studio: 'A' | 'B' | 'C' | 'D' | 'RE') => {
    if (studio === 'A' && studioAMessagesEndRef.current) {
      studioAMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    } else if (studio === 'B' && studioBMessagesEndRef.current) {
      studioBMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    } else if (studio === 'C' && studioCMessagesEndRef.current) {
      studioCMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    } else if (studio === 'D' && studioDMessagesEndRef.current) {
      studioDMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    } else if (studio === 'RE' && reStudioMessagesEndRef.current) {
      reStudioMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const clearChat = () => {
    if (!talentId || !wsConnection || wsConnection.readyState !== WebSocket.OPEN) return;
    
    // Determine if we're in RE Studio tab
    const isReStudio = document.querySelector('[data-state="active"][value="re-studio"]') !== null;
    const studioToUse = isReStudio ? 'RE' : activeStudio;
    
    console.log(`Clearing chat messages for ${isReStudio ? 'RE Studio' : `Studio ${activeStudio}`} - sending DELETE request to server`);
    
    // Send clear chat command via WebSocket with studio ID
    // Note: This will trigger permanent deletion on the server
    wsConnection.send(JSON.stringify({
      type: 'clearChat',
      senderRole: role,
      receiverRole: 'talent',
      studioId: studioToUse,
      // Add a flag to indicate this should be a permanent deletion
      permanent: true
    }));
    
    // Clear only the messages for the active studio and set the cleared flag
    if (isReStudio) {
      setReStudioChatMessages([]);
      // Reset notification indicator for RE Studio
      setHasNewReStudioMessages(false);
    } else if (activeStudio === 'A') {
      setStudioAChatMessages([]);
      setStudioAChatCleared(true);
      // Update ref to ensure it's consistent with state
      studioAClearedRef.current = true;
    } else if (activeStudio === 'B') {
      setStudioBChatMessages([]);
      setStudioBChatCleared(true);
      // Update ref to ensure it's consistent with state
      studioBClearedRef.current = true;
    } else if (activeStudio === 'C') {
      setStudioCChatMessages([]);
      setStudioCChatCleared(true);
      // Update ref to ensure it's consistent with state
      studioCClearedRef.current = true;
    } else if (activeStudio === 'D') {
      setStudioDChatMessages([]);
      setStudioDChatCleared(true);
      // Update ref to ensure it's consistent with state
      studioDClearedRef.current = true;
    }
    
    console.log(`Chat cleared for ${isReStudio ? 'RE Studio' : `Studio ${activeStudio}`}. Cleared flags - A: ${studioAClearedRef.current}, B: ${studioBClearedRef.current}, C: ${studioCClearedRef.current}, D: ${studioDClearedRef.current}`);
    
    // Also make a direct API call to ensure the messages are permanently deleted
    fetch(`/api/chat/clear?studioId=${studioToUse}`, {
      method: 'DELETE'
    }).then(response => {
      if (response.ok) {
        console.log(`Successfully deleted chat messages for ${isReStudio ? 'RE Studio' : `Studio ${activeStudio}`} via API`);
      } else {
        console.error(`Failed to delete chat messages via API: ${response.status}`);
      }
    }).catch(error => {
      console.error('Error deleting chat messages:', error);
    });
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !talentId) return;
    
    let fileAttachment = null;
    
    // If there's a file selected, convert it to base64
    if (selectedFile) {
      try {
        fileAttachment = await fileToBase64(selectedFile);
      } catch (error) {
        console.error('Failed to convert file:', error);
        return;
      }
    }
    
    // Determine if we're in RE Studio tab
    const isReStudio = document.querySelector('[data-state="active"][value="re-studio"]') !== null;
    
    // Create message with studio ID based on active tab or special type for RE Studio
    const messageData = {
      senderRole: role as 'admin' | 'producer' | 'talent',
      receiverRole: 'talent',
      receiverId: talentId,
      message: newMessage.trim() || 'File attachment',
      relatedCallId: null,
      fileAttachment,
      studioId: isReStudio ? 'RE' : activeStudio, // Special identifier for RE Studio
      isRemoteStudio: isReStudio // Add flag for RE Studio messages
    };
    
    // Only send via one method, we'll use WebSocket for real-time experience
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      wsConnection.send(JSON.stringify({
        type: 'chatMessage',
        ...messageData
      }));
      
      // The message will be stored and broadcast back by the server
      // For RE Studio, we'll also add it locally since we might not get it back from server yet
      if (isReStudio) {
        const timestamp = new Date().toISOString();
        const newMsg: ChatMessage = {
          id: Date.now(), // Temporary ID until server assigns one
          senderRole: role as 'admin' | 'producer' | 'talent',
          receiverRole: 'talent',
          receiverId: talentId,
          message: newMessage.trim() || 'File attachment',
          timestamp: timestamp,
          read: false,
          fileAttachment: fileAttachment || undefined,
          studioId: 'RE',
          isRemoteStudio: true
        };
        
        setReStudioChatMessages(prev => [...prev, newMsg]);
        scrollToBottom('RE');
      }
    } else {
      // Fallback to API if WebSocket is not connected
      fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      }).catch(error => {
        console.error('Failed to send message:', error);
      });
    }
    
    // Clear inputs
    setNewMessage('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Only scroll to bottom when sending a message (not when receiving)
    if (!isReStudio) {
      scrollToBottom(activeStudio);
    }
  };

  // Update caller info via WebSocket
  const updateCallerInfo = (lineId: number) => {
    if (!wsConnection || wsConnection.readyState !== WebSocket.OPEN) {
      console.warn('Cannot update caller info: WebSocket not connected');
      return;
    }
    
    const callerName = callerNames[lineId] || '';
    const callerNotes = callNotes[lineId] || '';
    
    console.log(`Sending callInfoUpdate for line ${lineId}: ${callerName}, notes: ${callerNotes}`);
    
    // Send update via WebSocket for real-time updates across all clients
    wsConnection.send(JSON.stringify({
      type: 'callInfoUpdate',
      lineId: lineId,
      callerName: callerName,
      callerNotes: callerNotes
    }));

    // Also update call notes in the system using the VoIP context
    if (callNotes[lineId]) {
      addNoteToCall(lineId, callNotes[lineId]);
    }
    
    // Also make a direct API call to ensure persistence
    fetch(`/api/call-lines/${lineId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contact: callerName,
        notes: callerNotes
      })
    }).catch(err => {
      console.error('Error updating caller info via API:', err);
    });
  };
  
  // Reset caller info when a call is hung up
  const resetCallerInfo = (lineId: number) => {
    // Reset the caller name and notes in the local state
    setCallerNames(prev => {
      const updated = {...prev};
      delete updated[lineId];
      return updated;
    });
    
    setCallNotes(prev => {
      const updated = {...prev};
      delete updated[lineId];
      return updated;
    });
    
    // Actually hang up the call using VoIP context function
    hangupCall(lineId);
  };

  // State for SIP connection status
  const [sipConnected, setSipConnected] = useState<boolean>(true);
  
  // State for SIP details, translation, and network info
  const [sipDetails, setSipDetails] = useState<{
    registered: boolean;
    account?: {
      id: number;
      username: string;
      server: string;
    };
    message: string;
  } | null>(null);
  const [localIpAddress, setLocalIpAddress] = useState<string>('');
  const { t } = useTranslation();
  
  // Get local IP address
  useEffect(() => {
    async function fetchLocalIp() {
      try {
        const response = await axios.get('/api/network-interfaces/default');
        if (response.data && response.data.address) {
          setLocalIpAddress(response.data.address);
        } else {
          setLocalIpAddress('127.0.0.1');
        }
      } catch (error) {
        console.error('Failed to fetch local IP:', error);
        setLocalIpAddress('127.0.0.1');
      }
    }
    fetchLocalIp();
  }, []);
  
  // Fetch SIP registration status from the real endpoint
  useEffect(() => {
    async function fetchSipStatus() {
      try {
        // Use real SIP registration status endpoint with full URL construction
        const baseUrl = window.location.origin;
        const apiUrl = `${baseUrl}/api/sip-status`;
        console.log("Fetching SIP status from:", apiUrl);
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          console.error(`SIP status API responded with: ${response.status} ${response.statusText}`);
          throw new Error(`Failed to fetch SIP status: ${response.statusText}`);
        }
        
        // Try to parse the response as JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.warn("Warning: SIP status API did not return JSON content type:", contentType);
        }
        
        const text = await response.text();
        console.log("Raw SIP status response:", text);
        
        // Try to parse the text as JSON
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error("Failed to parse SIP status response as JSON:", e);
          throw new Error("Invalid JSON response from SIP status API");
        }
        
        setSipDetails(data);
        setSipConnected(data.registered);
        
        // Update console with registration info for debugging
        console.log(`SIP Registration Status: ${data.registered ? 'Connected' : 'Disconnected'}`);
        if (data.account) {
          console.log(`Connected to: ${data.account.username}@${data.account.server}`);
        }
      } catch (error) {
        console.error('Failed to fetch SIP status:', error);
        setSipConnected(false);
        setSipDetails({
          registered: false,
          message: "Error fetching SIP status"
        });
      }
    }
    
    // Initial fetch
    fetchSipStatus();
    
    // Refresh status every 60 seconds (reduced frequency to prevent excessive notifications)
    const statusTimer = setInterval(fetchSipStatus, 60000);
    
    return () => {
      clearInterval(statusTimer);
    };
  }, []);

  // Language selector component removed - now in main header
  
  // Check if any call is active to determine if we need page scrolling
  // Force to false to maintain consistent container heights
  const anyCallActive = false; // callLines.some(line => line.status !== 'inactive');

  return (
    <div className={`min-h-[96vh] flex flex-col bg-zinc-950 ${anyCallActive ? 'overflow-y-auto' : 'overflow-hidden'}`}>
      {/* Black header bar with balanced layout - height reduced by 15px */}
      <div className="w-full bg-black py-1 px-4 flex items-center justify-between">
        {/* Left section with logo, studio switcher, and indicators */}
        <div className="flex-1 flex items-center gap-3">
          <img 
            src={QCallerLogo} 
            alt="QCaller" 
            className="h-12 w-auto mr-2" 
            style={{ filter: 'drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.5))' }}
          />
          
          {/* Admin Navigation Tabs - only visible for admin users */}
          <AdminViewTabs />
          
          {/* Studio Mode Switcher */}
          <div className="ml-4">
            <StudioModeSwitcher 
              activeStudio={activeStudio}
              variant="compact"
              onStudioChange={setActiveStudio}
            />
          </div>
          
          {/* Line Count Selectors for all studios */}
          <div className="ml-3 flex space-x-2">
            <LineCountSelector studio="A" />
            <LineCountSelector studio="B" />
            <LineCountSelector studio="C" />
            <LineCountSelector studio="D" />
          </div>
          
          {/* Transition type is fixed to "slide" */}
          {/* Studio indicator removed */}
        </div>
        
        {/* Center section - empty, phone controls moved to Call Lines header */}
        <div className="flex-1 flex items-center justify-center gap-2">
          {/* Phone controls removed - now in CallLinesContainer header */}
        </div>
        
        {/* Right section with date, time, and user info */}
        <div className="flex-1 flex items-center justify-end gap-4 text-white">
          {/* Date (Time has been moved to the timer container) */}
          <div className="flex items-center gap-3">
            {/* Current Date */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">{new Date().toLocaleDateString()}</span>
            </div>
          </div>
          
          {/* User Info and Menu */}
          <div className="flex items-center border-l border-zinc-800 pl-4">
            <span className="text-xs font-medium mr-2">{currentUser?.displayName}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-7 w-7 rounded-full bg-zinc-900 hover:bg-zinc-800 p-0">
                  <UserCircle className="h-5 w-5 text-gray-200" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-black border border-zinc-800 text-gray-300">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem className="flex items-center hover:bg-zinc-900">
                  <UserCircle className="h-4 w-4 mr-2" />
                  <span>{currentUser?.displayName}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem className="flex items-center text-gray-300 hover:bg-zinc-900">
                  <Settings className="h-4 w-4 mr-2" />
                  <span>Role: {currentUser?.role}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem 
                  className="flex items-center text-red-400 cursor-pointer hover:bg-zinc-900"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      
      {/* Countdown Timer Header moved to inside each CallLinesContainer */}
      
      {/* Main content area with increased width (+250px) */}
      <div className="max-w-[calc(1280px+250px)] w-full mx-auto py-2">
      {/* Main content area - fills remaining height */}
      <div className={`flex-1 ${anyCallActive ? 'overflow-y-visible' : 'overflow-y-hidden'}`}>
        {/* Call Lines container - full width */}
        <div className="w-full">
          <StudioTransition transitionType={transitionType} className="w-full h-full">
            <CallLinesContainer 
              studioId={activeStudio} 
              callLines={callLines}
              setSelectedLine={setSelectedLine}
              selectedLine={selectedLine}
              callNotes={callNotes}
              callerNames={callerNames}
              setCallNotes={setCallNotes}
              setCallerNames={setCallerNames}
              holdCall={holdCall}
              resetCallerInfo={resetCallerInfo}
              sendToAir={sendToAir}
              takeOffAir={takeOffAir}
              updateCallerInfo={updateCallerInfo}
              setShowDialPad={setShowDialPad}
              setDialPadTab={setDialPadTab}
            />
          </StudioTransition>
        </div>
      </div>
      </div>
      
      {/* Dial Pad Popup Dialog */}
      <Dialog open={showDialPad} onOpenChange={setShowDialPad}>
        <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white mb-1 flex items-center">
              <Phone className="h-5 w-5 mr-2" style={{color: activeStudio === 'A' ? '#D27D2D' : '#2D8D27'}} />
              {activeStudio === 'A' ? 'Studio A Phone Controls' : 'Studio B Phone Controls'}
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-sm">
              Make calls, view contacts, and check call history for Studio {activeStudio}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue={dialPadTab} className="w-full" onValueChange={(value) => setDialPadTab(value)}>
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger 
                value="dial-pad" 
                className={`data-[state=active]:${activeStudio === 'A' ? 'bg-[#D27D2D]' : 'bg-[#2D8D27]'}`}
              >
                <Phone className="h-4 w-4 mr-2" />
                Dial Pad
              </TabsTrigger>
              <TabsTrigger 
                value="phone-book" 
                className={`data-[state=active]:${activeStudio === 'A' ? 'bg-[#D27D2D]' : 'bg-[#2D8D27]'}`}
              >
                <FileText className="h-4 w-4 mr-2" />
                Phone Book
              </TabsTrigger>
              <TabsTrigger 
                value="call-history" 
                className={`data-[state=active]:${activeStudio === 'A' ? 'bg-[#D27D2D]' : 'bg-[#2D8D27]'}`}
              >
                <Clock className="h-4 w-4 mr-2" />
                Call History
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="dial-pad" className="mt-0">
              <DialPad selectedLineId={selectedLine} onSelectLine={setSelectedLine} studio={activeStudio} />
            </TabsContent>
            
            <TabsContent value="phone-book" className="mt-0">
              <ScrollArea className="h-[415px]">
                <div className="p-4">
                  {/* Phone Book Content will be displayed here */}
                  <QuickDialContacts />
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="call-history" className="mt-0">
              <ScrollArea className="h-[415px]">
                <div className="p-4">
                  {/* Call History Content will be displayed here */}
                  <CallHistory selectedLineId={selectedLine} onSelectLine={setSelectedLine} />
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="sm:justify-between border-t border-zinc-700 pt-4">
            <Button variant="outline" onClick={() => setShowDialPad(false)} className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 hover:text-white">
              Close
            </Button>
            {dialPadTab === 'dial-pad' && selectedLine !== null && (
              <div className="flex items-center gap-2">
                <div className="text-sm text-zinc-400">Selected Line:</div>
                <div className="text-sm font-medium text-white">
                  {callLines.find(line => line.id === selectedLine)?.id ? 
                    `Line ${callLines.find(line => line.id === selectedLine)?.id} (Studio ${callLines.find(line => line.id === selectedLine)?.id && callLines.find(line => line.id === selectedLine)!.id <= 3 ? 'A' : 'B'})` : 
                    'None'}
                </div>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Component for managing call lines
function CallLineManager({ 
  callLine,
  onHold,
  onHangup,
  onAir,
  onNotesChange,
  onCallerNameChange,
  onUpdateInfo,
  currentNotes,
  currentCallerName,
  isSelected = false,
  onSelectLine,
  setShowDialPad,
  setDialPadTab
}: { 
  callLine: CallLine;
  onHold: () => void;
  onHangup: () => void;
  onAir: () => void;
  onNotesChange: (notes: string) => void;
  onCallerNameChange: (name: string) => void;
  onUpdateInfo: () => void;
  currentNotes: string;
  currentCallerName: string;
  isSelected?: boolean;
  onSelectLine?: () => void;
  setShowDialPad?: (show: boolean) => void;
  setDialPadTab?: (tab: string) => void;
}) {
  // Get the saveToPhoneBook function from VoIP context
  const { saveToPhoneBook } = useVoIP();
  // Add state for duration tracking 
  const [duration, setDuration] = useState('00:00');

  // Duration timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (callLine.startTime && (callLine.status === 'active' || callLine.status === 'on-air')) {
      // Initialize duration immediately
      const calcDuration = () => {
        const startTime = new Date(callLine.startTime!);
        const elapsedSeconds = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
        setDuration(formatDuration(elapsedSeconds));
      };
      
      // Calculate now and then every second
      calcDuration();
      timer = setInterval(calcDuration, 1000);
    } else {
      setDuration('00:00');
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callLine.startTime, callLine.status]);
  const { makeCall } = useVoIP();
  // Previously used compact display but now use same design for all call lines
  const isCompact = false; // Keep all lines using the standard view
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'inactive': 
        return {
          background: 'bg-status-inactive',
          text: 'text-zinc-400',
          animation: '',
          badge: 'bg-zinc-800 text-zinc-400 border border-zinc-700'
        };
      case 'ringing': 
        return {
          background: 'bg-status-ringing',
          text: 'text-status-ringing',
          animation: 'animate-pulse',
          badge: 'bg-status-ringing text-white'
        };
      case 'active': 
        return {
          background: 'bg-status-active',
          text: 'text-status-active',
          animation: '',
          badge: 'bg-status-active text-white'
        };
      case 'holding': 
        return {
          background: 'bg-status-holding',
          text: 'text-status-holding',
          animation: '',
          badge: 'bg-status-holding text-white'
        };
      case 'on-air': 
        return {
          background: 'bg-status-onair',
          text: 'text-status-onair',
          animation: 'animate-on-air-blink',
          badge: 'bg-status-onair text-white'
        };
      default: 
        return {
          background: 'bg-status-inactive',
          text: 'text-zinc-400',
          animation: '',
          badge: 'bg-zinc-800 text-zinc-400 border border-zinc-700'
        };
    }
  };

  const statusStyle = getStatusStyle(callLine.status);

  return (
    <div 
      className={`border rounded-md p-2 bg-zinc-900 ${
        isSelected ? 'animate-selected-line' :
        callLine.status === 'on-air' ? 'border-status-onair' : 
        callLine.status === 'active' ? 'border-status-active' : 
        callLine.status === 'holding' ? 'border-status-holding' : 
        callLine.status === 'ringing' ? 'border-status-ringing' : 
        'border-zinc-700'
      }`}
      onClick={onSelectLine}
    >
      {/* Ultra compact header with status */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-1.5 ${statusStyle.background} ${statusStyle.animation}`} />
            <div>
              <h3 className="font-medium text-sm">Line {callLine.id}</h3>
            </div>
          </div>
          
          {/* ON-AIR indicator (split from timer) */}
          {callLine.status === 'on-air' && (
            <div className="flex items-center gap-1">
              <div className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-sm">
                <span className="inline-block">ON AIR</span>
              </div>
              <div className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-sm">
                {duration}
              </div>
              {/* Separate pulsing indicator */}
              <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
            </div>
          )}
        </div>
        
        <div className={`text-xs ${statusStyle.text}`}>
          {callLine.status !== 'on-air' && (
            <div className={`px-1.5 py-0.5 rounded-full text-center text-xs ${statusStyle.badge}`}>
              {callLine.status.charAt(0).toUpperCase() + callLine.status.slice(1)}
            </div>
          )}
        </div>
      </div>
      
      {/* Compact grid for all call information */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <Label htmlFor={`caller-name-${callLine.id}`} className="text-zinc-300 text-xs">Name</Label>
          <Input 
            id={`caller-name-${callLine.id}`}
            placeholder={callLine.status !== 'inactive' ? "Caller name" : "No call"}
            value={currentCallerName}
            onChange={(e) => onCallerNameChange(e.target.value)}
            disabled={callLine.status === 'inactive'}
            className="h-7 text-xs bg-zinc-800 border-zinc-700 text-zinc-300 placeholder:text-zinc-500"
          />
        </div>
        <div>
          <Label className="text-zinc-300 text-xs">Number</Label>
          <div className="h-7 px-2 py-1 text-xs border border-zinc-700 rounded-md bg-zinc-800 text-zinc-300 truncate">
            {callLine.status !== 'inactive' ? (callLine.phoneNumber || 'N/A') : 'No call'}
          </div>
        </div>
      </div>
      
      {/* Show notes and audio only when line is active */}
      {callLine.status !== 'inactive' ? (
        <div className="overflow-y-auto max-h-[170px] pr-1 mb-2">
          {/* Compact notes */}
          <div className="mb-2">
            <Label htmlFor={`notes-${callLine.id}`} className="text-zinc-300 text-xs">Notes</Label>
            <Textarea 
              id={`notes-${callLine.id}`}
              placeholder="Call notes..."
              className="min-h-[60px] max-h-16 text-xs bg-zinc-800 border-zinc-700 text-zinc-300 placeholder:text-zinc-500"
              value={currentNotes}
              onChange={(e) => onNotesChange(e.target.value)}
            />
          </div>
          
          {/* ON-AIR timer has been moved to the header section */}

          {/* Compact audio meter */}
          <div className="mb-2 border border-zinc-700 p-1 rounded-md bg-zinc-800/60 h-12">
            <AudioMeter lineId={callLine.id} showLabel={false} />
          </div>
        </div>
      ) : (
        /* Just show a placeholder message for inactive lines */
        <div className="text-xs text-zinc-500 italic text-center py-2 mb-2 bg-zinc-800/30 border border-zinc-800 rounded-md">
          No active call
        </div>
      )}
      
      {/* Ultra-compact button area */}
      <div className="flex flex-wrap gap-1">
        {callLine.status === 'inactive' ? (
          <Button 
            onClick={() => {
              // First select this line
              if (onSelectLine) onSelectLine();
              
              // Then open the dial pad popup
              if (setShowDialPad && setDialPadTab) {
                setShowDialPad(true);
                setDialPadTab('dial-pad');
              }
            }}
            size="sm"
            className={`w-full ${callLine.studio === 'B' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'} text-white text-xs py-1`}
          >
            <PhoneCall className="h-3 w-3 mr-1" />
            Call
          </Button>
        ) : (
          <>
            <Button 
              variant="outline" 
              onClick={onUpdateInfo} 
              size="sm"
              className="p-1 h-7 text-xs border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            >
              <Save className="h-3 w-3" />
            </Button>
            
            {callLine.status === 'holding' ? (
              <Button 
                variant="outline"
                size="sm"
                className="p-1 h-7 text-xs border-status-active text-status-active hover:bg-zinc-800"
                onClick={onHold}
              >
                <PauseCircle className="h-3 w-3 mr-1" />
                Resume
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                className="p-1 h-7 text-xs border-status-holding text-status-holding hover:bg-zinc-800"
                onClick={onHold}
              >
                <PauseCircle className="h-3 w-3 mr-1" />
                Hold
              </Button>
            )}
            
            <Button 
              variant="outline" 
              size="sm"
              className={`p-1 h-7 text-xs border-status-onair text-status-onair hover:bg-zinc-800 ${
                callLine.status === 'on-air' && 'bg-status-onair text-white'
              }`}
              onClick={onAir}
            >
              <Radio className="h-3 w-3 mr-1" />
              {callLine.status === 'on-air' ? 'Off Air' : 'On Air'}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              className="p-1 h-7 text-xs border-red-500 text-red-500 hover:bg-zinc-800 hover:border-red-600"
              onClick={onHangup}
            >
              <PhoneOff className="h-3 w-3 mr-1" />
              End
            </Button>
            
            {callLine.phoneNumber && (
              <Button
                variant="outline"
                size="sm"
                className="p-1 h-7 text-xs border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                onClick={() => {
                  if (callLine.phoneNumber) {
                    saveToPhoneBook(callLine.id, currentCallerName || 'Unknown Caller');
                  }
                }}
              >
                <svg 
                  className="w-3 h-3 mr-1" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                Save
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
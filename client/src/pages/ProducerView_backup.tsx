import React, { useState, useEffect, useRef } from 'react';
import { useVoIP } from '@/contexts/VoIPContext';
import { useTranslation } from 'react-i18next';
import { useStudioMode } from '@/contexts/StudioModeContext';
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
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { CallLine } from '@shared/schema';
import { formatDuration } from '../lib/utils';
import ContentTabs from '../components/ContentTabs';
import AudioMeter from '../components/AudioMeter';
import BuzzerButton from '../components/BuzzerButton';
import StandaloneTimer from '@/components/StandaloneTimer';
import CountdownHeader from '../components/CountdownHeader';
import StudioModeSwitcher from '../components/StudioModeSwitcher';
import { StudioTransition, StudioIndicator } from '../components/StudioTransition';
import { 
  MessageSquare, Phone, PhoneCall, PhoneOff, Radio, 
  PauseCircle, FileText, Trash, MoreVertical, Save,
  Clock, Calendar, Wifi, WifiOff, Globe, Network,
  ArrowLeftRight, Activity, RefreshCw, PowerOff, Volume2
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
  studioId?: 'A' | 'B' | 'RE'; // To distinguish between Talent A, B, and RE Studio
  isRemoteStudio?: boolean; // Flag to mark messages for RE Studio
};

// Main component for the producer view
export default function ProducerView() {
  // Hardcode the role since this is the ProducerView
  const role = 'producer';
  const { callLines, holdCall, makeCall, hangupCall, sendToAir, takeOffAir, addNoteToCall } = useVoIP();
  // Use the studio mode context instead of local state
  const { activeStudio, setActiveStudio, getStudioColor } = useStudioMode();
  
  // Debug: Log to verify all call lines exist
  console.log("Available call lines:", callLines.map(line => `Line ${line.id} (Studio ${line.studio || 'unknown'})`));
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [studioAChatMessages, setStudioAChatMessages] = useState<ChatMessage[]>([]);
  const [studioBChatMessages, setStudioBChatMessages] = useState<ChatMessage[]>([]);
  const [reStudioChatMessages, setReStudioChatMessages] = useState<ChatMessage[]>([]);
  // Use transitionType state for studio transitions
  const [transitionType, setTransitionType] = useState<'fade' | 'slide' | 'scale' | 'wipe'>('fade');
  const [newMessage, setNewMessage] = useState('');
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const [talentId, setTalentId] = useState<number | null>(null);
  const [callNotes, setCallNotes] = useState<{ [key: number]: string }>({});
  const [callerNames, setCallerNames] = useState<{ [key: number]: string }>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [showDialPad, setShowDialPad] = useState(false);
  const [dialPadTab, setDialPadTab] = useState('dial-pad');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedLineTimerRef = useRef<NodeJS.Timeout | null>(null);
  const studioAMessagesEndRef = useRef<HTMLDivElement>(null);
  const studioBMessagesEndRef = useRef<HTMLDivElement>(null);
  const reStudioMessagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-clear selected line after 3 seconds
  useEffect(() => {
    if (selectedLine !== null) {
      // Clear any existing timer
      if (selectedLineTimerRef.current) {
        clearTimeout(selectedLineTimerRef.current);
      }
      
      // Set a new timer
      selectedLineTimerRef.current = setTimeout(() => {
        setSelectedLine(null);
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
  const [hasNewReStudioMessages, setHasNewReStudioMessages] = useState(false);

  // Reference to track if WebSocket was manually closed
  const manuallyClosedRef = useRef(false);
  // Reference to track WebSocket connection status
  const wsConnectedRef = useRef(false);
  // References to track chat clearing
  const studioAClearedRef = useRef(false);
  const studioBClearedRef = useRef(false);

  // Connect to WebSocket for real-time communication
  // This effect manages the WebSocket connection
  useEffect(() => {
    // Update refs with current state values
    studioAClearedRef.current = studioAChatCleared;
    studioBClearedRef.current = studioBChatCleared;
    
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
          // Producer can communicate with both studios
          studioAccess: ['A', 'B'],
          // Send the cleared states with authentication
          clearedStates: {
            studioA: studioAClearedRef.current,
            studioB: studioBClearedRef.current
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
          const reStudioMessages = messages.filter((msg: ChatMessage) => 
            msg.studioId === 'RE' || msg.isRemoteStudio === true
          );
          
          console.log(`Studio A: ${studioAMessages.length} messages, Studio B: ${studioBMessages.length} messages, RE Studio: ${reStudioMessages.length} messages`);
          
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
            setReStudioChatMessages([]); // Clear RE Studio messages too
            
            // Update cleared flags for both studios
            studioAClearedRef.current = true;
            studioBClearedRef.current = true;
            setStudioAChatCleared(true);
            setStudioBChatCleared(true);
            
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
  const scrollToBottom = (studio: 'A' | 'B' | 'RE') => {
    if (studio === 'A' && studioAMessagesEndRef.current) {
      studioAMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    } else if (studio === 'B' && studioBMessagesEndRef.current) {
      studioBMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
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
    } else {
      setStudioBChatMessages([]);
      setStudioBChatCleared(true);
      // Update ref to ensure it's consistent with state
      studioBClearedRef.current = true;
    }
    
    console.log(`Chat cleared for ${isReStudio ? 'RE Studio' : `Studio ${activeStudio}`}. Cleared flags - A: ${studioAClearedRef.current}, B: ${studioBClearedRef.current}`);
    
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
      return;
    }

    wsConnection.send(JSON.stringify({
      type: 'callInfoUpdate',
      lineId: lineId,
      callerName: callerNames[lineId] || '',
      callerNotes: callNotes[lineId] || ''
    }));

    // Also update call notes in the system
    if (callNotes[lineId]) {
      addNoteToCall(lineId, callNotes[lineId]);
    }
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

  // State for live clock
  const [currentTime, setCurrentTime] = useState<string>(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );
  
  // State for SIP connection status
  const [sipConnected, setSipConnected] = useState<boolean>(true);
  
  // Update the clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      }));
    }, 1000);
    
    return () => {
      clearInterval(timer);
    };
  }, []);
  
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
    
    // Refresh status every 15 seconds (more frequent for real-time monitoring)
    const statusTimer = setInterval(fetchSipStatus, 15000);
    
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
      {/* Black header bar with balanced layout */}
      <div className="w-full bg-black py-3 px-4 flex items-center justify-between">
        {/* Left section with logo, studio switcher, and indicators */}
        <div className="flex-1 flex items-center gap-3">
          <img 
            src={QCallerLogo} 
            alt="QCaller" 
            className="h-16 w-auto mr-2" 
            style={{ filter: 'drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.5))' }}
          />
          
          {/* Studio Mode Switcher */}
          <div className="ml-4">
            <StudioModeSwitcher 
              activeStudio={activeStudio}
              variant="compact"
              onStudioChange={setActiveStudio}
            />
          </div>
          
          {/* Transition type selector */}
          <div className="ml-3">
            <select 
              value={transitionType}
              onChange={(e) => setTransitionType(e.target.value as any)}
              className="text-xs rounded-md bg-zinc-800 border-zinc-700 text-white p-1"
            >
              <option value="fade">Fade</option>
              <option value="slide">Slide</option>
              <option value="scale">Scale</option>
              <option value="wipe">Wipe</option>
            </select>
          </div>
          
          {/* Studio indicator */}
          <StudioIndicator />
        </div>
        
        {/* Center section with phone controls */}
        <div className="flex-1 flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 hover:text-white"
            onClick={() => {
              setShowDialPad(true);
              setDialPadTab('dial-pad');
            }}
          >
            <Phone className="h-4 w-4 mr-1 text-orange-500" />
            <span className="text-sm">{t('common.dialPad')}</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 hover:text-white"
            onClick={() => {
              setShowDialPad(true);
              setDialPadTab('phone-book');
            }}
          >
            <MessageSquare className="h-4 w-4 mr-1 text-sky-500" />
            <span className="text-sm">{t('common.phoneBook')}</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 hover:text-white"
            onClick={() => {
              setShowDialPad(true);
              setDialPadTab('call-history');
            }}
          >
            <FileText className="h-4 w-4 mr-1 text-emerald-500" />
            <span className="text-sm">{t('common.callHistory')}</span>
          </Button>
        </div>
        
        {/* Right section with date and time */}
        <div className="flex-1 flex items-center justify-end gap-3 text-white">
          {/* Date and Time */}
          <div className="flex items-center gap-3">
            {/* Current Date */}
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-500" />
              <span className="text-base font-medium">{new Date().toLocaleDateString()}</span>
            </div>
            
            {/* Current Time */}
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <span className="text-base font-medium font-mono">{currentTime}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Countdown Timer Header (using the CountdownHeader component) */}
      <CountdownHeader />
      
      {/* Main content area */}
      <div className="container mx-auto py-2">
      {/* Main content area - fills remaining height */}
      <div className={`grid grid-cols-12 gap-2 flex-1 ${anyCallActive ? 'overflow-y-visible' : 'overflow-y-hidden'}`}>
        {/* Left side: Call Lines - now using StudioTransition */}
        <div className="col-span-8">
          <StudioTransition transitionType={transitionType} className="w-full h-full">
            {activeStudio === 'A' ? (
              /* Studio A - Direct layout without Card */
              <div className="flex flex-col border border-zinc-700 shadow-md bg-zinc-800">
                <div className="border-b border-zinc-700 bg-gradient-to-r from-orange-900 to-zinc-800 py-1 px-3">
                  <div className="flex items-center justify-between">
                    <div className="text-orange-100 font-medium text-sm">
                      STUDIO A
                    </div>
                    <div className="flex items-center justify-center">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <div className="text-xs font-medium text-orange-200 bg-orange-900/40 px-1.5 py-0.5 rounded-sm text-center">
                            A
                          </div>
                          <BuzzerButton isProducer={true} studioId="A" hideInStudioHeader={true} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div 
                  className="bg-zinc-800 p-2" 
                  style={{ 
                    height: "calc(96vh - 350px)",
                    transition: "all 0.3s ease"
                  }}
                >
                  <div className="space-y-3">
                    {callLines.map(line => {
                      // Only include lines with IDs 1-3
                      const isStudioA = line.id >= 1 && line.id <= 3;
                      if (!isStudioA) return null;
                      
                      return (
                        <CallLineManager 
                          key={line.id} 
                          callLine={{...line, studio: 'A'}} // Ensure studio property is set
                          onHold={() => holdCall(line.id)}
                          onHangup={() => resetCallerInfo(line.id)}
                          onAir={() => line.status === 'on-air' ? takeOffAir(line.id) : sendToAir(line.id)}
                          onNotesChange={(notes: string) => {
                            setCallNotes(prev => ({ ...prev, [line.id]: notes }));
                          }}
                          onCallerNameChange={(name: string) => {
                            setCallerNames(prev => ({ ...prev, [line.id]: name }));
                          }}
                          onUpdateInfo={() => updateCallerInfo(line.id)}
                          currentNotes={callNotes[line.id] || ''}
                          currentCallerName={callerNames[line.id] || ''}
                          isSelected={selectedLine === line.id}
                          onSelectLine={() => setSelectedLine(line.id)}
                          setShowDialPad={setShowDialPad}
                          setDialPadTab={setDialPadTab}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* Studio B - Direct layout without Card */
              <div className="flex flex-col border border-zinc-700 shadow-md bg-zinc-800">
                <div className="border-b border-zinc-700 bg-gradient-to-r from-green-900 to-zinc-800 py-1 px-3">
                  <div className="flex items-center justify-between">
                    <div className="text-green-100 font-medium text-sm">
                      STUDIO B
                    </div>
                    <div className="flex items-center justify-center">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <div className="text-xs font-medium text-green-200 bg-green-900/40 px-1.5 py-0.5 rounded-sm text-center">
                            B
                          </div>
                          <BuzzerButton isProducer={true} studioId="B" hideInStudioHeader={true} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div 
                  className="bg-zinc-800 p-2" 
                  style={{ 
                    height: "calc(96vh - 350px)",
                    transition: "all 0.3s ease"
                  }}
                >
                  <div className="space-y-3">
                    {/* Display only 3 Studio B lines (IDs 4-6) */}
                    {callLines.map(line => {
                      // Only include lines 4-6 for Studio B
                      const isStudioB = line.id >= 4 && line.id <= 6;
                      if (!isStudioB) return null;
                      
                      return (
                        <CallLineManager 
                          key={line.id} 
                          callLine={{...line, studio: 'B'}} // Ensure studio property is set
                          onHold={() => holdCall(line.id)}
                          onHangup={() => resetCallerInfo(line.id)}
                          onAir={() => line.status === 'on-air' ? takeOffAir(line.id) : sendToAir(line.id)}
                          onNotesChange={(notes: string) => {
                            setCallNotes(prev => ({ ...prev, [line.id]: notes }));
                          }}
                          onCallerNameChange={(name: string) => {
                            setCallerNames(prev => ({ ...prev, [line.id]: name }));
                          }}
                          onUpdateInfo={() => updateCallerInfo(line.id)}
                          currentNotes={callNotes[line.id] || ''}
                          currentCallerName={callerNames[line.id] || ''}
                          isSelected={selectedLine === line.id}
                          onSelectLine={() => setSelectedLine(line.id)}
                          setShowDialPad={setShowDialPad}
                          setDialPadTab={setDialPadTab}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </StudioTransition>
        </div>
        {/* No chat section here - moved to right column */}

        {/* Right column: Chat with talents */}
        <div className="col-span-4 flex flex-col gap-2">
          {/* Chat with Talents - flexbox to take remaining space */}
          <Card className="border border-zinc-700 shadow-md bg-zinc-800 flex-1 overflow-hidden flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-700 bg-gradient-to-r from-zinc-900 to-zinc-800 py-1 px-3">
              <div className="flex items-center gap-2">
                <CardTitle className="text-zinc-100 text-xs font-medium">Communication</CardTitle>
                <Badge variant="outline" className="bg-zinc-700 text-zinc-200 text-xs font-normal py-0 border-zinc-600">Talent Chat</Badge>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-zinc-800 border-zinc-700">
                  <DropdownMenuItem onClick={clearChat} className="text-red-400 hover:bg-zinc-700 focus:bg-zinc-700">
                    <Trash className="mr-2 h-4 w-4" />
                    {activeStudio === 'A' 
                      ? 'Clear Studio A Chat' 
                      : activeStudio === 'B' 
                        ? 'Clear Studio B Chat' 
                        : 'Clear RE Studio Chat'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="bg-zinc-800 flex-1 flex flex-col overflow-hidden">
              <Tabs 
                value={activeStudio === 'A' ? 'studio-a' : activeStudio === 'B' ? 'studio-b' : 're-studio'} 
                className="w-full h-full flex flex-col"
                onValueChange={(value) => {
                  if (value === 'studio-a') setActiveStudio('A');
                  else if (value === 'studio-b') setActiveStudio('B');
                  else if (value === 'tech') {
                    // Keep the active studio unchanged when in Tech tab
                    // This tab is for monitoring and doesn't affect studio selection
                  }
                  else if (value === 're-studio') {
                    setActiveStudio('A'); // Default to A for RE Studio
                    // Clear notification indicator when RE Studio tab is selected
                    setHasNewReStudioMessages(false);
                  }
                }}
              >
                <TabsList className="grid w-full grid-cols-4 mb-2 bg-zinc-700 border-zinc-600 flex-shrink-0 h-7">
                  <TabsTrigger 
                    value="studio-a"
                    className="data-[state=active]:bg-orange-600 data-[state=active]:text-white font-medium text-zinc-300 hover:text-zinc-100 text-xs py-0 relative border-r border-zinc-700"
                  >
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                      Talent A
                    </span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="studio-b"
                    className="data-[state=active]:bg-green-600 data-[state=active]:text-white font-medium text-zinc-300 hover:text-zinc-100 text-xs py-0 relative border-r border-zinc-700"
                  >
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-green-500"></span>
                      Talent B
                    </span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="tech"
                    className="data-[state=active]:bg-purple-600 data-[state=active]:text-white font-medium text-zinc-300 hover:text-zinc-100 text-xs py-0 relative border-r border-zinc-700"
                  >
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-purple-500"></span>
                      Tech
                    </span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="re-studio"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-red-800 data-[state=active]:text-white font-medium text-zinc-300 hover:text-zinc-100 text-xs py-0 relative border-r border-zinc-700"
                  >
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-red-500"></span>
                      RE Studio 1
                    </span>
                    {hasNewReStudioMessages && (
                      <span className="absolute right-1 top-0.5 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="studio-a" className="mt-0 flex-1 flex flex-col">
                  <div className="flex flex-col">
                    <ScrollArea 
                      className="mb-2 p-3 border border-zinc-700 rounded-lg bg-zinc-900/90 shadow-lg" 
                      style={{ 
                        height: "calc(96vh - 350px)",
                        transition: "all 0.3s ease"
                      }}
                    >
                      <div className="space-y-2">
                        {studioAChatMessages.map(msg => (
                          <div 
                            key={msg.id} 
                            className={`flex items-end ${msg.senderRole === role ? 'justify-end' : 'justify-start'}`}
                          >
                            {msg.senderRole !== role && (
                              <div className="w-4 h-4 rounded-full bg-orange-600 flex items-center justify-center text-white text-[10px] mr-1 flex-shrink-0 border border-orange-500">
                                TA
                              </div>
                            )}
                            <div 
                              className={`max-w-[75%] p-1.5 rounded-md shadow-sm ${
                                msg.senderRole === role 
                                  ? 'bg-orange-600 text-white rounded-br-none border border-orange-500' 
                                  : 'bg-zinc-700 text-zinc-200 rounded-bl-none border border-zinc-600'
                              }`}
                            >
                              <div className="text-xs flex items-center justify-between">
                                <span className={`font-medium ${msg.senderRole === role ? 'text-orange-100' : 'text-zinc-300'}`}>
                                  {msg.senderRole === role ? 'You' : 'Talent A'}
                                </span>
                                <span className={`ml-2 ${msg.senderRole === role ? 'text-orange-200' : 'text-zinc-400'}`}>
                                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div className="text-sm leading-snug mt-0.5">
                                {msg.message}
                              </div>
                              {msg.fileAttachment && (
                                <div className={`mt-1 p-1 rounded-sm flex items-center text-[10px] ${
                                  msg.senderRole === role ? 'bg-orange-700' : 'bg-zinc-800 border border-zinc-600'
                                }`}>
                                  <FileText className="h-3 w-3 mr-1" />
                                  <a 
                                    href={msg.fileAttachment} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className={`truncate ${
                                      msg.senderRole === role ? 'text-orange-200' : 'text-zinc-300'
                                    }`}
                                  >
                                    {selectedFile?.name || 'Attachment'}
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        <div ref={studioAMessagesEndRef} />
                      </div>
                    </ScrollArea>
                    
                    <div className="flex gap-2 mt-auto">
                      <Input
                        placeholder="Type a message to Talent A..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        className="h-8 text-xs bg-zinc-700 border-zinc-600 text-zinc-200 placeholder:text-zinc-400"
                      />
                      <div className="flex gap-1">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="p-1 h-8 w-8 bg-transparent border-zinc-600 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-200"
                        >
                          <FileText className="h-3 w-3" />
                        </Button>
                        <Button 
                          type="button" 
                          size="sm"
                          onClick={sendMessage}
                          className="h-8 bg-orange-600 hover:bg-orange-700 text-white text-xs"
                        >
                          Send
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="studio-b" className="mt-0 flex-1 flex flex-col">
                  <div className="flex flex-col">
                    <ScrollArea 
                      className="mb-2 p-3 border border-zinc-700 rounded-lg bg-zinc-900/90 shadow-lg" 
                      style={{ 
                        height: "calc(96vh - 350px)",
                        transition: "all 0.3s ease"
                      }}
                    >
                      <div className="space-y-2">
                        {studioBChatMessages.map(msg => (
                          <div 
                            key={msg.id} 
                            className={`flex items-end ${msg.senderRole === role ? 'justify-end' : 'justify-start'}`}
                          >
                            {msg.senderRole !== role && (
                              <div className="w-4 h-4 rounded-full bg-green-600 flex items-center justify-center text-white text-[10px] mr-1 flex-shrink-0 border border-green-500">
                                TB
                              </div>
                            )}
                            <div 
                              className={`max-w-[75%] p-1.5 rounded-md shadow-sm ${
                                msg.senderRole === role 
                                  ? 'bg-green-600 text-white rounded-br-none border border-green-500' 
                                  : 'bg-zinc-700 text-zinc-200 rounded-bl-none border border-zinc-600'
                              }`}
                            >
                              <div className="text-xs flex items-center justify-between">
                                <span className={`font-medium ${msg.senderRole === role ? 'text-green-100' : 'text-zinc-300'}`}>
                                  {msg.senderRole === role ? 'You' : 'Talent B'}
                                </span>
                                <span className={`ml-2 ${msg.senderRole === role ? 'text-green-200' : 'text-zinc-400'}`}>
                                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div className="text-sm leading-snug mt-0.5">
                                {msg.message}
                              </div>
                              {msg.fileAttachment && (
                                <div className={`mt-1 p-1 rounded-sm flex items-center text-[10px] ${
                                  msg.senderRole === role ? 'bg-green-700' : 'bg-zinc-800 border border-zinc-600'
                                }`}>
                                  <FileText className="h-3 w-3 mr-1" />
                                  <a 
                                    href={msg.fileAttachment} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className={`truncate ${
                                      msg.senderRole === role ? 'text-green-200' : 'text-zinc-300'
                                    }`}
                                  >
                                    {selectedFile?.name || 'Attachment'}
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        <div ref={studioBMessagesEndRef} />
                      </div>
                    </ScrollArea>
                    
                    <div className="flex gap-2 mt-auto">
                      <Input
                        placeholder="Type a message to Talent B..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        className="h-8 text-xs bg-zinc-700 border-zinc-600 text-zinc-200 placeholder:text-zinc-400"
                      />
                      <div className="flex gap-1">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="p-1 h-8 w-8 bg-transparent border-zinc-600 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-200"
                        >
                          <FileText className="h-3 w-3" />
                        </Button>
                        <Button 
                          type="button" 
                          size="sm"
                          onClick={sendMessage}
                          className="h-8 bg-green-600 hover:bg-green-700 text-white text-xs"
                        >
                          Send
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Tech Tab Content */}
                <TabsContent value="tech" className="mt-0 flex-1 flex flex-col">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                    {/* Left Column: RE Studio Connection Status & Controls */}
                    <div className="flex flex-col space-y-4">
                      <Card className="bg-zinc-800 border-zinc-700">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-md font-semibold text-purple-300 flex items-center gap-2">
                            <Activity className="h-4 w-4 text-purple-400" />
                            RE Studio 1 Connection
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pb-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-zinc-900 rounded-md p-3 border border-zinc-700">
                              <div className="text-xs text-zinc-400 mb-1">Connection Status</div>
                              <div className="flex items-center">
                                <div className="h-3 w-3 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                                <span className="text-sm font-medium text-green-300">Connected</span>
                              </div>
                            </div>
                            <div className="bg-zinc-900 rounded-md p-3 border border-zinc-700">
                              <div className="text-xs text-zinc-400 mb-1">Audio Stream</div>
                              <div className="flex items-center">
                                <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                                <span className="text-sm font-medium text-green-300">Active</span>
                              </div>
                            </div>
                            <div className="bg-zinc-900 rounded-md p-3 border border-zinc-700">
                              <div className="text-xs text-zinc-400 mb-1">Latency</div>
                              <div className="text-sm font-medium text-white">42 ms</div>
                            </div>
                            <div className="bg-zinc-900 rounded-md p-3 border border-zinc-700">
                              <div className="text-xs text-zinc-400 mb-1">Packet Loss</div>
                              <div className="text-sm font-medium text-white">0.1%</div>
                            </div>
                          </div>
                          
                          <div className="mt-4 flex justify-between gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1 h-8 border-purple-700 bg-purple-900/30 hover:bg-purple-800 text-purple-200 text-xs"
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Refresh
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1 h-8 border-red-700 bg-red-900/30 hover:bg-red-800 text-red-200 text-xs"
                            >
                              <PowerOff className="h-3 w-3 mr-1" />
                              Restart
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-zinc-800 border-zinc-700 flex-1">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-md font-semibold text-purple-300 flex items-center gap-2">
                            <Volume2 className="h-4 w-4 text-purple-400" />
                            Audio Levels
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pb-4 flex flex-col h-full">
                          <div className="flex flex-col flex-1 justify-center items-center">
                            <div className="w-full h-32 bg-zinc-900 border border-zinc-700 rounded-md p-2 flex items-end justify-around">
                              <div className="relative h-full w-8 bg-zinc-800 rounded-sm overflow-hidden flex flex-col-reverse">
                                <div className="absolute bottom-0 left-0 right-0 h-[60%] bg-gradient-to-t from-green-500 via-yellow-500 to-red-500">
                                </div>
                                <div className="relative z-10 w-full bg-zinc-900/70 h-[40%]"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-[10px] font-bold text-white">L</span>
                                </div>
                              </div>
                              <div className="relative h-full w-8 bg-zinc-800 rounded-sm overflow-hidden flex flex-col-reverse">
                                <div className="absolute bottom-0 left-0 right-0 h-[75%] bg-gradient-to-t from-green-500 via-yellow-500 to-red-500">
                                </div>
                                <div className="relative z-10 w-full bg-zinc-900/70 h-[25%]"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-[10px] font-bold text-white">R</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-xs text-zinc-400 mt-2">
                              Peak: -3.2 dB / -1.8 dB
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    {/* Right Column: Chat with RE Studio Talent */}
                    <div className="flex flex-col">
                      <Card className="bg-zinc-800 border-zinc-700 h-full">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-md font-semibold text-purple-300 flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-purple-400" />
                            Chat with RE Studio 1
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 h-full flex flex-col">
                          <ScrollArea 
                            className="flex-1 p-3"
                            style={{ 
                              height: "calc(96vh - 350px)",
                              transition: "all 0.3s ease"
                            }}>
                            <div className="space-y-3">
                              {reStudioChatMessages.length > 0 ? (
                                reStudioChatMessages.map(msg => (
                                  <div 
                                    key={msg.id} 
                                    className={`flex items-end ${msg.senderRole === role ? 'justify-end' : 'justify-start'}`}
                                  >
                                    {msg.senderRole !== role && (
                                      <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center text-white text-xs mr-1 flex-shrink-0 border border-red-500">
                                        RE
                                      </div>
                                    )}
                                    <div 
                                      className={`max-w-[75%] p-1.5 rounded-md shadow-sm ${
                                        msg.senderRole === role 
                                          ? 'bg-purple-600 text-white rounded-br-none border border-purple-500' 
                                          : 'bg-zinc-700 text-zinc-200 rounded-bl-none border border-zinc-600'
                                      }`}
                                    >
                                      <div className="text-xs flex items-center justify-between">
                                        <span className={`font-medium ${msg.senderRole === role ? 'text-purple-100' : 'text-zinc-300'}`}>
                                          {msg.senderRole === role ? 'You' : 'RE Studio 1'}
                                        </span>
                                        <span className={`ml-2 ${msg.senderRole === role ? 'text-purple-200' : 'text-zinc-400'}`}>
                                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </div>
                                      <div className="text-sm leading-snug mt-0.5">
                                        {msg.message}
                                      </div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="flex justify-center py-4">
                                  <div className="flex items-center p-3 rounded-md bg-purple-950/30 border border-purple-900/50 text-purple-200 text-xs">
                                    <span className="mr-2">💬</span>
                                    No messages yet. Start the conversation with RE Studio 1.
                                  </div>
                                </div>
                              )}
                              <div ref={reStudioMessagesEndRef} />
                            </div>
                          </ScrollArea>
                          
                          <div className="mt-auto p-3 border-t border-zinc-700">
                            <div className="flex gap-2">
                              <Input 
                                placeholder="Type a message to RE Studio 1..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage();
                                  }
                                }}
                                className="h-8 text-xs bg-zinc-700 border-zinc-600 text-zinc-200 placeholder:text-zinc-400"
                              />
                              <Button 
                                type="button" 
                                size="sm"
                                onClick={sendMessage}
                                className="h-8 bg-purple-600 hover:bg-purple-700 text-white text-xs"
                              >
                                Send
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>
                
                {/* RE Studio Tab Content */}
                <TabsContent value="re-studio" className="mt-0 flex-1 flex flex-col">
                  <div className="flex flex-col">
                    <ScrollArea 
                      className="mb-2 p-3 border border-zinc-700 rounded-lg bg-zinc-900/90 shadow-lg" 
                      style={{ 
                        height: "calc(96vh - 350px)",
                        transition: "all 0.3s ease"
                      }}
                    >
                      <div className="space-y-2">
                        {reStudioChatMessages.length > 0 ? (
                          reStudioChatMessages.map(msg => (
                            <div 
                              key={msg.id} 
                              className={`flex items-end ${msg.senderRole === role ? 'justify-end' : 'justify-start'}`}
                            >
                              {msg.senderRole !== role && (
                                <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center text-white text-xs mr-1 flex-shrink-0 border border-red-500">
                                  RS
                                </div>
                              )}
                              <div 
                                className={`max-w-[75%] p-1.5 rounded-md shadow-sm ${
                                  msg.senderRole === role 
                                    ? 'bg-red-600 text-white rounded-br-none border border-red-500' 
                                    : 'bg-zinc-700 text-zinc-200 rounded-bl-none border border-zinc-600'
                                }`}
                              >
                                <div className="text-xs flex items-center justify-between">
                                  <span className={`font-medium ${msg.senderRole === role ? 'text-red-100' : 'text-zinc-300'}`}>
                                    {msg.senderRole === role ? 'You' : 'RE Studio 1'}
                                  </span>
                                  <span className={`ml-2 ${msg.senderRole === role ? 'text-red-200' : 'text-zinc-400'}`}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <div className="text-sm leading-snug mt-0.5">
                                  {msg.message}
                                </div>
                                {msg.fileAttachment && (
                                  <div className={`mt-1 p-1 rounded-sm flex items-center text-xs ${
                                    msg.senderRole === role ? 'bg-red-700' : 'bg-zinc-800 border border-zinc-600'
                                  }`}>
                                    <FileText className="h-3 w-3 mr-1" />
                                    <a 
                                      href={msg.fileAttachment} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className={`truncate ${
                                        msg.senderRole === role ? 'text-red-200' : 'text-zinc-300'
                                      }`}
                                    >
                                      {selectedFile?.name || 'Attachment'}
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="flex justify-center py-4">
                            <div className="flex items-center p-3 rounded-md bg-red-950/30 border border-red-900/50 text-red-200 text-xs">
                              <span className="mr-2">💬</span>
                              Chat with RE Studio 1 - remote talent
                            </div>
                          </div>
                        )}
                        <div ref={reStudioMessagesEndRef} />
                      </div>
                    </ScrollArea>
                    
                    <div className="flex gap-2 mt-auto">
                      <Input
                        placeholder="Type a message to RE Studio 1..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        className="h-8 text-xs bg-zinc-700 border-zinc-600 text-zinc-200 placeholder:text-zinc-400"
                      />
                      <div className="flex gap-1">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="p-1 h-8 w-8 bg-transparent border-zinc-600 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-200"
                        >
                          <FileText className="h-3 w-3" />
                        </Button>
                        <Button 
                          type="button" 
                          size="sm"
                          onClick={sendMessage}
                          className="h-8 bg-red-600 hover:bg-red-700 text-white text-xs"
                        >
                          Send
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
      
      {/* Dial Pad Popup Dialog */}
      <Dialog open={showDialPad} onOpenChange={setShowDialPad}>
        <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white mb-1 flex items-center">
              <Phone className="h-5 w-5 mr-2 text-orange-500" />
              Phone Controls
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-sm">
              Make calls, view contacts, and check call history
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue={dialPadTab} className="w-full" onValueChange={(value) => setDialPadTab(value)}>
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="dial-pad" className="data-[state=active]:bg-orange-600">
                <Phone className="h-4 w-4 mr-2" />
                Dial Pad
              </TabsTrigger>
              <TabsTrigger value="phone-book" className="data-[state=active]:bg-orange-600">
                <FileText className="h-4 w-4 mr-2" />
                Phone Book
              </TabsTrigger>
              <TabsTrigger value="call-history" className="data-[state=active]:bg-orange-600">
                <Clock className="h-4 w-4 mr-2" />
                Call History
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="dial-pad" className="mt-0">
              <DialPad selectedLineId={selectedLine} onSelectLine={setSelectedLine} />
            </TabsContent>
            
            <TabsContent value="phone-book" className="mt-0">
              <ScrollArea className="h-[450px]">
                <div className="p-4">
                  {/* Phone Book Content will be displayed here */}
                  <QuickDialContacts />
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="call-history" className="mt-0">
              <ScrollArea className="h-[450px]">
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
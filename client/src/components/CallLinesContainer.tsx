import React, { useState, useEffect, useRef } from 'react';
import { CallLine, CallStatus } from '@shared/schema';
import BuzzerButton from './BuzzerButton';
import CallLineManager from './CallLineManager';
import StandaloneTimer from './StandaloneTimer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StudioBadge } from './StudioBadge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Trash, Phone, MessageSquare, FileText } from 'lucide-react';
import { useVoIP } from '@/contexts/VoIPContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useLineCount } from '@/contexts/LineCountContext';

type CallLinesContainerProps = {
  studioId: 'A' | 'B' | 'C' | 'D';
  callLines: CallLine[];
  setSelectedLine: (lineId: number) => void;
  selectedLine?: number;
  callNotes: Record<number, string>;
  callerNames: Record<number, string>;
  setCallNotes: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  setCallerNames: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  holdCall: (lineId: number) => void;
  resetCallerInfo: (lineId: number) => void;
  sendToAir: (lineId: number) => void;
  takeOffAir: (lineId: number) => void;
  updateCallerInfo: (lineId: number) => void;
  setShowDialPad: React.Dispatch<React.SetStateAction<boolean>>;
  setDialPadTab: React.Dispatch<React.SetStateAction<string>>;
};

export default function CallLinesContainer({
  studioId,
  callLines,
  setSelectedLine,
  selectedLine,
  callNotes,
  callerNames,
  setCallNotes,
  setCallerNames,
  holdCall,
  resetCallerInfo,
  sendToAir,
  takeOffAir,
  updateCallerInfo,
  setShowDialPad,
  setDialPadTab,
}: CallLinesContainerProps) {
  // Set appropriate color for each studio
  let studioColor = 'orange'; // Default (Studio A)
  
  if (studioId === 'B') studioColor = 'green';
  else if (studioId === 'C') studioColor = 'blue';
  else if (studioId === 'D') studioColor = 'purple';
  
  // Access line count context to get dynamic line count
  const { lineCount, getStudioLineIds } = useLineCount();
  const studioLineIds = getStudioLineIds(studioId);
  const minLineId = studioLineIds[0]; // First line ID for this studio
  const maxLineId = studioLineIds[studioLineIds.length - 1]; // Last line ID for this studio
  
  console.log(`Studio ${studioId} has ${studioLineIds.length} lines (from ${minLineId} to ${maxLineId})`);
  
  // Access websocket and toast from contexts
  const { websocket } = useVoIP();
  const { toast } = useToast();

  // Chat message interface
  interface ChatMessage {
    id: string;
    sender: string;
    content: string;
    timestamp: Date;
    isRead: boolean;
    studioId?: 'A' | 'B' | 'C' | 'D' | 'RE' | 'TECH';
  }

  // State for the active chat tab
  const [activeChatTab, setActiveChatTab] = useState<string>("talent");
  // State for new message text
  const [newMessage, setNewMessage] = useState<string>("");
  // State for chat messages
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({
    talent: [],
    tech: [],
    remote: []
  });
  // Reference to the scroll container
  const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({
    talent: null,
    tech: null,
    remote: null
  });
  
  // Define the chat tabs
  // Get appropriate color for talent tab based on studio ID
  let talentTabColor = "#D27D2D"; // Default orange for Studio A
  if (studioId === 'B') talentTabColor = "#2D8D27"; // Green for Studio B
  else if (studioId === 'C') talentTabColor = "#2D72D3"; // Blue for Studio C
  else if (studioId === 'D') talentTabColor = "#7D2D8D"; // Purple for Studio D
  
  const chatTabs = [
    { id: "talent", label: `Talent ${studioId}`, studioId: studioId as 'A' | 'B' | 'C' | 'D', color: talentTabColor },
    { id: "tech", label: "Tech Support", studioId: 'TECH', color: "#7D2D8D" },
    { id: "remote", label: "Remote Studio", studioId: 'RE', color: "#D22D2D" }
  ];

  // Scroll to bottom when messages change
  const scrollToBottom = (tabId: string) => {
    const scrollContainer = scrollRefs.current[tabId];
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  };

  // Effect to fetch initial messages and set up WebSocket listeners
  useEffect(() => {
    let isMounted = true;
    
    // Fetch initial messages for each chat tab
    const fetchMessages = async (tabId: string, tabStudioId: 'A' | 'B' | 'C' | 'D' | 'RE' | 'TECH') => {
      try {
        console.log(`[Chat] Fetching messages for ${tabId} (Studio ${tabStudioId})`);
        
        // Get messages from the server
        const response = await fetch(`/api/chat-messages/${tabStudioId}`);
        
        if (!isMounted) return;
        
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            // Format the messages
            const formattedMessages: ChatMessage[] = data.map((msg: any) => ({
              id: msg.id.toString(),
              sender: msg.senderRole,
              content: msg.content,
              timestamp: new Date(msg.timestamp),
              isRead: msg.isRead,
              studioId: msg.studioId
            }));
            
            // Add messages to state
            setMessages(prev => ({
              ...prev,
              [tabId]: formattedMessages
            }));

            // Scroll to bottom after a short delay to ensure rendering
            setTimeout(() => scrollToBottom(tabId), 100);
          } else {
            // Add a welcome message if no messages
            setMessages(prev => ({
              ...prev,
              [tabId]: [{
                id: `welcome-${tabId}`,
                sender: 'system',
                content: `Welcome to the ${tabId} chat. Messages sent here will be delivered instantly.`,
                timestamp: new Date(),
                isRead: true,
                studioId: tabStudioId
              }]
            }));
          }
        }
      } catch (error) {
        console.error(`[Chat] Error fetching messages for ${tabId}:`, error);
      }
    };
    
    // Fetch messages for all tabs
    chatTabs.forEach(tab => {
      fetchMessages(tab.id, tab.studioId as 'A' | 'B' | 'C' | 'D' | 'RE' | 'TECH');
    });
    
    // WebSocket message handler
    const handleWebSocketMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'newChatMessage' && data.data) {
          // Create a new message from the data
          const newMsg: ChatMessage = {
            id: data.data.id || Math.random().toString(36).substr(2, 9),
            sender: data.data.senderRole,
            content: data.data.content,
            timestamp: new Date(data.data.timestamp),
            isRead: false,
            studioId: data.data.studioId
          };
          
          // Find which tab this message belongs to
          const targetTab = chatTabs.find(tab => tab.studioId === newMsg.studioId)?.id;
          
          if (targetTab) {
            console.log(`[Chat] Received new message for ${targetTab}:`, newMsg);
            
            // Add message to the appropriate tab
            setMessages(prev => ({
              ...prev,
              [targetTab]: [...prev[targetTab], newMsg]
            }));
            
            // Scroll to bottom
            setTimeout(() => scrollToBottom(targetTab), 100);
            
            // Show a toast notification if not on this tab
            if (activeChatTab !== targetTab) {
              toast({
                title: `New message in ${chatTabs.find(tab => tab.id === targetTab)?.label}`,
                description: `${newMsg.sender}: ${newMsg.content.substring(0, 30)}${newMsg.content.length > 30 ? '...' : ''}`,
                variant: 'default',
              });
            }
          }
        }
      } catch (error) {
        console.error('[Chat] Error handling WebSocket message:', error);
      }
    };
    
    // Set up WebSocket listener
    if (websocket) {
      websocket.addEventListener('message', handleWebSocketMessage);
      
      // Clean up listener on unmount
      return () => {
        isMounted = false;
        if (websocket) {
          websocket.removeEventListener('message', handleWebSocketMessage);
        }
      };
    }
    
    return () => {
      isMounted = false;
    };
  }, [websocket, toast, activeChatTab, chatTabs]);
  
  // Effect to scroll to bottom when tab changes
  useEffect(() => {
    scrollToBottom(activeChatTab);
  }, [activeChatTab]);

  // Handle sending a new message
  const handleSendMessage = (tabId: string) => {
    if (newMessage.trim() === '') return;
    
    // Get the studio ID for this tab
    const tabInfo = chatTabs.find(tab => tab.id === tabId);
    if (!tabInfo) return;
    
    // Create a temporary ID for the message
    const tempId = Math.random().toString(36).substr(2, 9);
    
    // Create a temporary message for immediate UI feedback
    const tempMessage: ChatMessage = {
      id: tempId,
      sender: 'producer',
      content: newMessage,
      timestamp: new Date(),
      isRead: false,
      studioId: tabInfo.studioId as 'A' | 'B' | 'C' | 'D' | 'RE' | 'TECH'
    };
    
    // Add message to UI immediately
    setMessages(prev => ({
      ...prev,
      [tabId]: [...prev[tabId], tempMessage]
    }));
    
    // Clear the input
    setNewMessage('');
    
    // Scroll to bottom
    setTimeout(() => scrollToBottom(tabId), 100);
    
    // Try to send via WebSocket
    let wsMessageSent = false;
    
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      try {
        console.log(`[Chat] Sending message to ${tabInfo.studioId} via WebSocket:`, newMessage);
        
        // Send the message
        websocket.send(JSON.stringify({
          type: 'chatMessage',
          data: {
            senderRole: 'producer',
            content: newMessage,
            studioId: tabInfo.studioId,
            timestamp: new Date().toISOString()
          }
        }));
        
        wsMessageSent = true;
      } catch (error) {
        console.error('[Chat] Error sending message via WebSocket:', error);
      }
    }
    
    // Fallback to HTTP if WebSocket fails
    if (!wsMessageSent) {
      console.log(`[Chat] Falling back to HTTP for sending message to ${tabInfo.studioId}`);
      
      // Send via HTTP
      fetch('/api/chat-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderRole: 'producer',
          content: newMessage,
          studioId: tabInfo.studioId,
          timestamp: new Date().toISOString()
        })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to send message via HTTP');
        }
        return response.json();
      })
      .then(data => {
        console.log('[Chat] Message sent successfully via HTTP:', data);
      })
      .catch(error => {
        console.error('[Chat] Error sending message via HTTP:', error);
        toast({
          title: 'Message Failed',
          description: 'Could not send your message. Please try again.',
          variant: 'destructive',
        });
      });
    }
  };

  // Handle clearing the chat
  const clearChat = (tabId: string) => {
    if (!window.confirm(`Are you sure you want to clear all messages in this chat?`)) return;
    
    // Get the studio ID for this tab
    const tabInfo = chatTabs.find(tab => tab.id === tabId);
    if (!tabInfo) return;
    
    // Clear messages locally
    setMessages(prev => ({
      ...prev,
      [tabId]: []
    }));
    
    // Try WebSocket first
    let wsCommandSent = false;
    
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      try {
        console.log(`[Chat] Clearing chat messages for ${tabInfo.studioId} via WebSocket`);
        
        // Send the clear command
        websocket.send(JSON.stringify({
          type: 'clearChatMessages',
          data: {
            studioId: tabInfo.studioId
          }
        }));
        
        wsCommandSent = true;
        
        // Show confirmation
        toast({
          title: 'Chat Cleared',
          description: `All messages for this chat have been cleared.`,
          variant: 'default',
        });
      } catch (error) {
        console.error('[Chat] Error clearing chat via WebSocket:', error);
      }
    }
    
    // Fallback to HTTP
    if (!wsCommandSent) {
      console.log(`[Chat] Falling back to HTTP for clearing chat for ${tabInfo.studioId}`);
      
      // Send clear command via HTTP
      fetch(`/api/chat-messages/clear/${tabInfo.studioId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to clear messages via HTTP');
        }
        
        toast({
          title: 'Chat Cleared',
          description: `All messages for this chat have been cleared.`,
          variant: 'default',
        });
      })
      .catch(error => {
        console.error('[Chat] Error clearing chat via HTTP:', error);
        toast({
          title: 'Partially Cleared',
          description: 'Messages cleared locally but server could not be updated.',
          variant: 'destructive',
        });
      });
    }
  };

  // Function to get sender name for display
  const getSenderName = (role: string): string => {
    if (role === 'admin') return 'Admin';
    if (role === 'producer') return 'Producer';
    if (role === 'talent') return `Talent ${studioId}`;
    if (role === 'remote') return 'Remote';
    if (role === 'system') return 'System';
    return role;
  };

  // Function to handle keyboard submission
  const handleKeyDown = (e: React.KeyboardEvent, tabId: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(tabId);
    }
  };

  return (
    <div className="flex flex-col border border-zinc-700 shadow-xl bg-zinc-900 rounded-lg overflow-hidden"
         style={{ 
           height: "calc(100vh - 110px)", /* Further increased height by additional 35px (from 145px to 110px) */
           transition: "all 0.3s ease",
           background: "linear-gradient(160deg, #212130, #18181f)",
           boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)"
         }}>
      {/* Studio header with 3D appearance */}
      <div 
        className="py-2 px-4" 
        style={{ 
          background: 
            studioId === 'A' ? "linear-gradient(145deg, #D27D2D, #b36a26)" : 
            studioId === 'B' ? "linear-gradient(145deg, #2D8D27, #267521)" :
            studioId === 'C' ? "linear-gradient(145deg, #2D72D3, #2659B3)" :
            "linear-gradient(145deg, #7D2D8D, #6A267A)",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.2)",
          borderBottom: 
            studioId === 'A' ? "2px solid #8a5113" : 
            studioId === 'B' ? "2px solid #1e5a1a" :
            studioId === 'C' ? "2px solid #1a4a8a" :
            "2px solid #5a1a7a"
        }}
      >
        <div className="flex items-center justify-between">
          {/* Left section with studio indicator */}
          <div className="text-white font-bold text-base flex items-center">
            <div 
              className="w-2.5 h-2.5 rounded-full mr-2 animate-pulse" 
              style={{ 
                backgroundColor: "#fff",
                boxShadow: `0 0 10px rgba(255, 255, 255, 0.8)`
              }}
            ></div>
            STUDIO {studioId}
          </div>
          
          {/* Center section with phone controls */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800 hover:text-white px-3"
              style={{
                minWidth: "82px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.1)",
                borderRadius: "4px",
                height: "39px", /* Increased from 28px (h-7) to 39px (+ 8px top and bottom) */
                paddingTop: "8px",
                paddingBottom: "8px"
              }}
              onClick={() => {
                setShowDialPad(true);
                setDialPadTab('dial-pad');
              }}
            >
              <Phone className="h-3.5 w-3.5 mr-1.5 text-orange-500" />
              <span className="text-xs font-medium">Dial Pad</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800 hover:text-white px-3"
              style={{
                minWidth: "82px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.1)",
                borderRadius: "4px",
                height: "39px", /* Increased from 28px (h-7) to 39px (+ 8px top and bottom) */
                paddingTop: "8px",
                paddingBottom: "8px"
              }}
              onClick={() => {
                setShowDialPad(true);
                setDialPadTab('phone-book');
              }}
            >
              <MessageSquare className="h-3.5 w-3.5 mr-1.5 text-sky-500" />
              <span className="text-xs font-medium">Phone Book</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800 hover:text-white px-3"
              style={{
                minWidth: "82px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.1)",
                borderRadius: "4px",
                height: "39px", /* Increased from 28px (h-7) to 39px (+ 8px top and bottom) */
                paddingTop: "8px",
                paddingBottom: "8px"
              }}
              onClick={() => {
                setShowDialPad(true);
                setDialPadTab('call-history');
              }}
            >
              <FileText className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
              <span className="text-xs font-medium">Call History</span>
            </Button>
          </div>
          
          {/* Right section with studio badge */}
          <div className="flex items-center justify-center">
            <div 
              className="text-sm font-bold text-white px-3 py-1 rounded-full" 
              style={{ 
                background: "rgba(0,0,0,0.3)",
                boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 1px rgba(255, 255, 255, 0.1)",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.5)"
              }}
            >
              {studioId}
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content area with glass effect */}
      <div 
        className={`p-3 overflow-hidden flex-1 relative ${
          studioLineIds.length > 4 ? 'min-w-fit' : ''
        }`}
        style={{ 
          height: "calc(100vh - 90px)", /* Increased height by 15px (from 105px to 90px) */
          transition: "all 0.3s ease",
          background: "linear-gradient(160deg, rgba(30, 30, 45, 0.95), rgba(20, 20, 30, 0.95))",
          backdropFilter: "blur(10px)",
          width: studioLineIds.length > 4 
            ? studioLineIds.length === 5 
              ? 'calc(1200px)' /* 5 lines at slightly reduced width */
              : 'calc(1440px)' /* 6 lines at slightly reduced width */
            : 'auto'
        }}
      >
        {/* Grid layout for call lines with dynamic columns based on line count */}
        <div className={`grid ${
          studioLineIds.length === 4 ? 'grid-cols-4' : 
          studioLineIds.length === 5 ? 'grid-cols-5' : 
          studioLineIds.length === 6 ? 'grid-cols-6' : 'grid-cols-4'
        } gap-2`}>
          {/* Each call line gets its own dedicated column */}
          {studioLineIds.map(lineId => {
            // Find the call line with this ID if it exists, or create a placeholder
            const callLine = callLines.find(line => line.id === lineId) || {
              id: lineId,
              status: 'inactive' as CallStatus,
              phoneNumber: '',
              callerName: '',
              notes: '',
              studio: studioId
            };
            
            return (
              <div key={lineId} className={studioLineIds.length > 4 ? 'scale-[0.9] transform-gpu origin-top' : ''}>
                <CallLineManager 
                  key={lineId} 
                  callLine={{...callLine, studio: studioId}} 
                  onHold={() => holdCall(lineId)}
                  onHangup={() => resetCallerInfo(lineId)}
                  onAir={() => callLine.status === 'on-air' ? takeOffAir(lineId) : sendToAir(lineId)}
                  onNotesChange={(notes: string) => {
                    setCallNotes(prev => ({ ...prev, [lineId]: notes }));
                  }}
                  onCallerNameChange={(name: string) => {
                    setCallerNames(prev => ({ ...prev, [lineId]: name }));
                  }}
                  onUpdateInfo={() => updateCallerInfo(lineId)}
                  currentNotes={callNotes[lineId] || ''}
                  currentCallerName={callerNames[lineId] || ''}
                  isSelected={selectedLine === lineId}
                  onSelectLine={() => setSelectedLine(lineId)}
                  setShowDialPad={setShowDialPad}
                  setDialPadTab={setDialPadTab}
                />
              </div>
            );
          })}
        </div>

        {/* Countdown timer and buzzer with enhanced 3D appearance */}
        <div 
          className="mt-[5px] p-2 rounded-xl relative z-10" /* Changed from mt-1 to mt-[5px] (moved up by 20px) */
          style={{
            background: "linear-gradient(145deg, #1e1e2d, #252536)",
            boxShadow: "0 8px 16px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(30, 30, 40, 0.8)"
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            {/* Timer with 3D digital display effect */}
            <div 
              className="h-18 rounded-lg overflow-hidden" 
              style={{
                boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.5), 0 1px 2px rgba(255, 255, 255, 0.05)"
              }}
            >
              <StandaloneTimer studio={studioId} variant="producer" />
            </div>
            
            {/* Buzzer button with 3D button appearance and light effect */}
            <div 
              className="flex items-center justify-center h-18 rounded-lg overflow-hidden" 
              style={{ 
                background: 
                  studioId === 'A' ? "linear-gradient(145deg, #D27D2D, #b3621c)" : 
                  studioId === 'B' ? "linear-gradient(145deg, #2D8D27, #267521)" :
                  studioId === 'C' ? "linear-gradient(145deg, #2D72D3, #2659B3)" :
                  "linear-gradient(145deg, #7D2D8D, #6A267A)",
                boxShadow: "0 8px 20px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.2)"
              }}
            >
              <div className="w-full h-full flex items-center justify-center p-1">
                <BuzzerButton isProducer={true} studioId={studioId} />
              </div>
            </div>
          </div>
        </div>
        
        {/* Multi-panel chat area with 3D appearance */}
        <div 
          className="mt-[5px] rounded-xl relative z-10" /* Changed from mt-1 to mt-[5px] (moved up by 20px) */
          style={{
            background: "linear-gradient(145deg, #1e1e2d, #252536)",
            boxShadow: "0 8px 16px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(30, 30, 40, 0.8)",
            height: "calc(100% + 565px)" /* Reduced by 60px from previous 625px height */
          }}
        >
          <div className="flex flex-col" style={{ minHeight: "30px" /* Further reduced by 100px from 130px to 30px */}}>
            <div 
              className="text-white font-bold py-2 px-4 flex justify-between items-center"
              style={{
                background: "linear-gradient(to bottom, rgba(40, 40, 60, 0.5), rgba(30, 30, 50, 0.5))",
                borderBottom: "1px solid rgba(20, 20, 30, 0.8)",
                textShadow: "0 1px 2px rgba(0, 0, 0, 0.7)"
              }}
            >
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 12h16M4 6h16M4 18h16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>COMMUNICATIONS</span>
              </div>
              <div className="flex items-center gap-2">
                <span 
                  className="px-3 py-1 rounded-full text-xs" 
                  style={{ 
                    background: 
                      studioId === 'A' ? 'rgba(210, 125, 45, 0.3)' : 
                      studioId === 'B' ? 'rgba(45, 141, 39, 0.3)' :
                      studioId === 'C' ? 'rgba(45, 114, 211, 0.3)' :
                      'rgba(125, 45, 141, 0.3)',
                    color: 
                      studioId === 'A' ? '#ffb066' : 
                      studioId === 'B' ? '#80e878' :
                      studioId === 'C' ? '#66a9ff' :
                      '#e078e6',
                    border: 
                      studioId === 'A' ? '1px solid #D27D2D' : 
                      studioId === 'B' ? '1px solid #2D8D27' :
                      studioId === 'C' ? '1px solid #2D72D3' :
                      '1px solid #7D2D8D',
                    boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.1), 0 1px 2px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  Studio {studioId}
                </span>
              </div>
            </div>
            
            {/* Multi-panel chat display - shows all three chats at once */}
            <div className="p-2 grid grid-cols-3 gap-3" style={{ height: "calc(100% - 110px)" /* Reduced by 200px more from +90px to -110px */}}>
              {chatTabs.map((tab) => (
                <div 
                  key={tab.id} 
                  className="flex flex-col rounded-lg overflow-hidden border"
                  style={{
                    background: "linear-gradient(to bottom, #1e1e2d, #252530)",
                    border: `1px solid ${tab.color}40`,
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
                    height: "435px", /* Reduced by 200px more from 635px to 435px as requested */
                    display: "flex",
                    flexDirection: "column"
                  }}
                >
                  {/* Chat panel header */}
                  <div 
                    className="px-3 py-1.5 flex items-center justify-between"
                    style={{
                      background: `linear-gradient(145deg, ${tab.color}33, ${tab.color}22)`,
                      borderBottom: `1px solid ${tab.color}40`,
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <div 
                        className={`w-2.5 h-2.5 rounded-full animate-pulse`} 
                        style={{ 
                          backgroundColor: tab.color,
                          boxShadow: `0 0 8px ${tab.color}`
                        }}
                      ></div>
                      <span className="text-sm font-bold" style={{color: tab.color}}>{tab.label}</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-[10px] h-6 px-2"
                      onClick={() => clearChat(tab.id)}
                      style={{
                        background: "linear-gradient(145deg, #2a2a3a, #232330)",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.1)",
                        border: "1px solid rgba(30, 30, 40, 0.8)",
                        color: "#ccc",
                        borderRadius: '4px',
                        textShadow: "0 1px 1px rgba(0, 0, 0, 0.7)",
                        minWidth: "55px"
                      }}
                    >
                      <Trash className="h-3 w-3 mr-1" color="#ff6b6b" />
                      <span className="font-medium">Clear</span>
                    </Button>
                  </div>
                  
                  {/* Chat messages area */}
                  <div 
                    className="flex-1 overflow-auto p-2 bg-zinc-800/50" 
                    style={{ 
                      height: "auto", 
                      maxHeight: "335px", 
                      fontSize: "0.8rem", 
                      flex: 1 
                    }} /* Changed from fixed to flexible height */
                    ref={(el) => scrollRefs.current[tab.id] = el}
                  >
                    {messages[tab.id]?.length > 0 ? (
                      <div className="space-y-2">
                        {messages[tab.id].map((message) => (
                          <div
                            key={message.id}
                            className={`flex items-start gap-2 ${
                              message.sender === 'producer'
                                ? 'justify-end'
                                : 'justify-start'
                            }`}
                          >
                            {message.sender !== 'producer' && (
                              <div 
                                className="h-5 w-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                style={{ 
                                  backgroundColor: message.sender === 'talent' 
                                    ? tab.color
                                    : message.sender === 'system'
                                    ? '#555'
                                    : '#7D2D8D'
                                }}
                              >
                                {message.sender === 'talent' ? 'T' : 
                                 message.sender === 'admin' ? 'A' : 
                                 message.sender === 'system' ? 'S' : 
                                 message.sender.charAt(0).toUpperCase()}
                              </div>
                            )}
                            
                            <div
                              className={`rounded-lg px-2 py-1 max-w-[85%] border ${
                                message.sender === 'producer'
                                  ? 'bg-blue-900 border-blue-500 text-white'
                                  : message.sender === 'system'
                                  ? 'bg-zinc-800 border-zinc-600 text-white italic'
                                  : 'bg-zinc-800 border-zinc-600 text-white'
                              }`}
                            >
                              <div className="flex items-baseline justify-between gap-2 mb-0.5 border-b border-white/30 pb-0.5">
                                <span 
                                  className="font-bold text-white" 
                                  style={{ 
                                    fontSize: '0.65rem',
                                    textShadow: '0px 0px 1px rgba(0,0,0,0.7)'
                                  }}
                                >
                                  {message.sender === 'producer' ? 'You' : getSenderName(message.sender)}
                                </span>
                                <span 
                                  className="text-white font-medium" 
                                  style={{ 
                                    fontSize: '0.6rem',
                                    textShadow: '0px 0px 1px rgba(0,0,0,0.7)'
                                  }}
                                >
                                  {format(message.timestamp, 'HH:mm')}
                                </span>
                              </div>
                              <p 
                                className="whitespace-pre-wrap break-words text-white font-bold" 
                                style={{ 
                                  fontSize: '0.7rem', 
                                  textShadow: '0px 0px 1px rgba(0,0,0,0.7)',
                                  letterSpacing: '0.01em'
                                }}
                              >
                                {message.content}
                              </p>
                            </div>
                            
                            {message.sender === 'producer' && (
                              <div 
                                className="h-5 w-5 rounded-full flex items-center justify-center bg-blue-700 text-white text-xs font-bold"
                              >
                                P
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-zinc-400 italic text-center py-4 text-xs">
                        No messages in this chat yet.
                      </div>
                    )}
                  </div>
                  
                  {/* Input area for sending messages with enhanced 3D styling */}
                  <div className="flex gap-1 mt-1 px-2 pb-2 min-h-[40px]">
                    <Input 
                      value={tab.id === activeChatTab ? newMessage : ""}
                      onChange={(e) => {
                        if (tab.id === activeChatTab) {
                          setNewMessage(e.target.value);
                        } else {
                          setActiveChatTab(tab.id);
                          setNewMessage(e.target.value);
                        }
                      }}
                      onFocus={() => setActiveChatTab(tab.id)}
                      onKeyDown={(e) => handleKeyDown(e, tab.id)}
                      placeholder={`Message to ${tab.label}...`} 
                      className="flex-1 h-8 text-white font-medium text-sm"
                      style={{
                        background: "linear-gradient(to bottom, #1a1a24, #23232f)",
                        boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.4), 0 1px 1px rgba(255, 255, 255, 0.05)",
                        border: tab.id === activeChatTab ? `1px solid ${tab.color}` : "1px solid rgba(30, 30, 40, 0.8)",
                        color: "#ffffff",
                        textShadow: '0px 0px 1px rgba(0,0,0,0.7)',
                        fontSize: '0.8rem',
                        borderRadius: '6px'
                      }}
                    />
                    <Button 
                      size="sm" 
                      className="h-8 px-2 text-white"
                      onClick={() => handleSendMessage(tab.id)}
                      disabled={tab.id === activeChatTab ? newMessage.trim() === '' : true}
                      style={{ 
                        background: `linear-gradient(145deg, ${tab.color}, ${
                          tab.color === '#D27D2D' ? '#b3621c' : // Studio A (orange)
                          tab.color === '#2D8D27' ? '#267521' : // Studio B (green)
                          tab.color === '#2D72D3' ? '#2659B3' : // Studio C (blue)
                          tab.color === '#7D2D8D' ? '#6a2678' : // Studio D (purple)
                          tab.color === '#D22D2D' ? '#b91c1c' : // RE Studio (red)
                          '#3c3c50' // Tech (default)
                        })`,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.1)",
                        border: `1px solid ${tab.color}`,
                        textShadow: "0 1px 1px rgba(0, 0, 0, 0.5)",
                        borderRadius: '4px',
                        opacity: (tab.id === activeChatTab && newMessage.trim() !== '') ? 1 : 0.5,
                        minWidth: "40px"
                      }}
                    >
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
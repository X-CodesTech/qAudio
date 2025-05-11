import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CallLine } from '@shared/schema';
import { useVoIP } from '@/contexts/VoIPContext';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import AudioMeter, { AudioMetersPanel } from '@/components/AudioMeter';
import { Paperclip, MoreVertical, Trash, FileText, X, ChevronRight, Mic, Radio, LogOut } from 'lucide-react';
import { formatDuration } from '@/lib/utils';
import BuzzerButton from '@/components/SocketBuzzer';
import StandaloneTimer from '@/components/StandaloneTimer';
import AdminViewTabs from '@/components/AdminViewTabs';
// Import QCaller logo from attached assets
import QCallerLogo from '@assets/qcaller_logo_v4.png';
import { useLocation, useRoute, Link } from 'wouter';
import { WebSocket as WSType } from 'ws';
import { useToast } from '@/hooks/use-toast';

type ChatMessage = {
  id: number;
  senderRole: 'admin' | 'producer' | 'talent';
  receiverRole?: string;
  receiverId: number;
  message: string;
  timestamp: string;
  read: boolean;
  fileAttachment?: string;
};

type StudioType = 'A' | 'B';

export default function TalentView() {
  // Hardcode the role since this is the TalentView
  const role = 'talent';
  const { callLines, websocket } = useVoIP();
  const { logoutMutation } = useAuth();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [studio, setStudio] = useState<StudioType>('A');
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Function to handle logout - direct approach
  const handleLogout = async () => {
    console.log("Logout button clicked in TalentView - Direct approach");
    
    try {
      // Direct fetch to logout endpoint
      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "include" // Include cookies
      });
      
      console.log("Logout response:", response.status);
      
      // Regardless of response, redirect to home/login page
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      // Even if there's an error, try to redirect
      window.location.href = "/";
    }
  };
  
  // Allow scrolling in talent view page
  // Previously prevented scrolling with:
  // useEffect(() => {
  //   // Save original overflow style
  //   const originalOverflow = document.body.style.overflow;
  //   
  //   // Disable scrolling
  //   document.body.style.overflow = 'hidden';
  //   
  //   // Clean up function to restore original overflow style when component unmounts
  //   return () => {
  //     document.body.style.overflow = originalOverflow;
  //   };
  // }, []);

  // Use the WebSocket connection from VoIPContext
  useEffect(() => {
    if (!websocket) return;
    
    // When the component mounts, authenticate with the current studio
    if (websocket.readyState === WebSocket.OPEN) {
      console.log(`TalentView: Initial authentication with Studio ${studio}`);
      websocket.send(JSON.stringify({
        type: 'auth',
        role: role,
        studioId: studio,
        studioAccess: ['A', 'B'] // Give access to both studios to ensure messages are received
      }));
      
      // Request initial countdown state for this studio
      websocket.send(JSON.stringify({
        type: 'countdown_state_request',
        studio: studio
      }));
    }
    
    // Set up listeners for the websocket
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'chatHistory') {
          // Only set messages for the current studio
          const messages = data.data;
          setChatMessages(messages);
        } else if (data.type === 'newChatMessage') {
          // Only add message if it's for the current studio or has no studioId
          const newMessage = data.data;
          if (newMessage.studioId === studio || !newMessage.studioId) {
            setChatMessages(prev => [...prev, newMessage]);
          }
        } else if (data.type === 'talentBuzzer' || data.type === 'producerBuzzer') {
          // Both buzzer types are handled by the BuzzerButton component
          // We don't need to do anything here as the BuzzerButton listens for these events
          console.log(`Received buzzer event: ${data.type}`, data);
        } else if (data.type === 'clearChat') {
          // Handle clear chat command from producer
          const { studioId } = data.data;
          
          // Clear the chat if it's a general clear or specifically for the current studio
          if (!studioId || studioId === studio) {
            setChatMessages([]);
          }
        } else if (data.type === 'countdown_update') {
          // Countdown updates are handled by the CountdownTimer component
          const updateStudio = data.studio;
          
          console.log(`TalentView: Received countdown update for studio ${updateStudio} (current studio: ${studio})`);
          
          // Only process if this update is for the current studio or we haven't specified a studio yet
          if (!studio || updateStudio === studio) {
            // We dispatch a custom event for the CountdownTimer to pick up
            const countdownEvent = new CustomEvent('countdown_update', { 
              detail: data 
            });
            window.dispatchEvent(countdownEvent);
            
            // Request a fresh update every 30 seconds while timer is running
            // to ensure we're synced with the producer's timer
            if (data.isRunning) {
              const lastUpdateTime = new Date(data.timestamp || new Date()).getTime();
              const currentTime = new Date().getTime();
              const timeSinceUpdate = currentTime - lastUpdateTime;
              
              // If the update is more than 5 seconds old, request an immediate fresh update
              if (timeSinceUpdate > 5000) {
                console.log(`TalentView: Update is ${Math.round(timeSinceUpdate / 1000)}s old, requesting fresh state`);
                if (websocket && websocket.readyState === WebSocket.OPEN) {
                  try {
                    websocket.send(JSON.stringify({
                      type: 'countdown_state_request',
                      studio: updateStudio,
                      timestamp: new Date().toISOString(),
                      requestId: `refresh-${Date.now()}`
                    }));
                  } catch (err) {
                    console.error("Error requesting timer update:", err);
                  }
                }
              }
            }
          } else {
            console.log(`TalentView: Ignoring countdown update for studio ${updateStudio} (we're in studio ${studio})`);
          }
        }
      } catch (error) {
        console.error("Error handling WebSocket message:", error);
      }
    };
    
    // Add event listener
    websocket.addEventListener('message', handleMessage);
    
    // Clean up the event listener
    return () => {
      websocket.removeEventListener('message', handleMessage);
    };
  }, [websocket, studio]); // Added studio to dependencies to properly update listeners when studio changes

  // Fetch initial chat messages from producer
  useEffect(() => {
    // We'll receive the chat history through the WebSocket connection
    // So no need to fetch it again here, which could cause duplicates
    // The server will send the chat history when we authenticate
  }, []);
  
  // Auto-scroll to bottom of chat whenever messages change
  // Manual scroll function instead of automatic scrolling
  const scrollToLatestMessages = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // No automatic scrolling on messages update

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
    if (!websocket || websocket.readyState !== WebSocket.OPEN) return;
    
    // Send clear chat command via WebSocket
    websocket.send(JSON.stringify({
      type: 'clearChat',
      senderRole: role,
      receiverRole: 'producer',
      studioId: studio // Use current studio
    }));
    
    // Clear local chat messages
    setChatMessages([]);
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile)) return;
    
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
    
    const messageData = {
      senderRole: role,
      receiverRole: 'producer',
      message: newMessage.trim() || 'File attachment',
      relatedCallId: null,
      fileAttachment,
      studioId: studio // Use current studio
    };
    
    // Only send via one method, we'll use WebSocket for real-time experience
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      websocket.send(JSON.stringify({
        type: 'chatMessage',
        ...messageData
      }));
      // The message will be stored and broadcast back by the server
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
    
    setNewMessage('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle studio switching
  const handleStudioChange = (newStudio: StudioType) => {
    setStudio(newStudio);
    
    // Re-authenticate WebSocket with the new studio
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      console.log(`TalentView: Switching to Studio ${newStudio}`);
      websocket.send(JSON.stringify({
        type: 'auth',
        role: role,
        studioId: newStudio,
        studioAccess: ['A', 'B'] // Give access to both studios to ensure messages are received
      }));
      
      // Request updated countdown state for the new studio
      websocket.send(JSON.stringify({
        type: 'countdown_state_request',
        studio: newStudio
      }));
    }
  };


  
  // Get color theme based on studio
  const getStudioTheme = () => {
    return {
      primary: studio === 'A' ? 'orange' : 'green',
      badge: studio === 'A' ? 'bg-orange-900/30 text-orange-300 border-orange-800' : 'bg-green-900/30 text-green-300 border-green-800',
      pulse: studio === 'A' ? 'bg-orange-400' : 'bg-green-400',
      highlight: studio === 'A' ? 'bg-orange-600' : 'bg-green-600',
      highlightHover: studio === 'A' ? 'hover:bg-orange-700' : 'hover:bg-green-700',
      border: studio === 'A' ? 'border-orange-800' : 'border-green-800',
    };
  };
  
  const theme = getStudioTheme();

  // Check if this view is being rendered inside TalentsView
  const isEmbedded = window.location.pathname.includes('/talents');

  return (
    <>
      {/* Fixed transparent header - Only shown when not embedded in TalentsView */}
      {!isEmbedded && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-zinc-900/80 backdrop-blur-sm border-b border-zinc-800 shadow-lg">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Badge 
                variant="outline" 
                className={`${studio === 'A' ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'} px-3 py-1.5`}
              >
                Studio {studio}
              </Badge>
              
              {/* Admin navigation tabs - only visible for admin users */}
              <AdminViewTabs />
            </div>
            <img 
              src={QCallerLogo} 
              alt="QCaller Studio" 
              className="h-8 w-auto mx-auto absolute left-1/2 transform -translate-x-1/2"
            />
            <div className="flex items-center gap-2">
              <a href="/api/logout" className="inline-block">
                <div className="flex items-center gap-1 text-zinc-300 hover:text-white px-2 py-1 rounded hover:bg-zinc-800">
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}
      
      {/* Enhanced talent view with dark mode */}
      <div className={`${isEmbedded ? '' : 'min-h-screen'} bg-zinc-900 text-zinc-100`}>
        {/* Spacer to push content below fixed header - only when not embedded */}
        {!isEmbedded && <div className="h-[60px]"></div>}
        
        {/* Studio Switching Controls & Countdown Timer - Now below the header */}
        <div className="container mx-auto pt-6 pb-4 px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Countdown Timer */}
          <div className="w-full md:w-1/2 flex justify-center">
            <StandaloneTimer studio={studio} variant="talent" />
          </div>
          
          {/* BuzzerButton - Add prominent buzzer button that changes color based on studio */}
          <div className="w-full md:w-1/4 flex justify-center mb-4 md:mb-0">
            <BuzzerButton isProducer={false} studioId={studio} />
          </div>
          
          {/* Studio Switching Controls */}
          <Tabs defaultValue={studio} className="w-auto" onValueChange={(value) => handleStudioChange(value as StudioType)}>
            <TabsList className="grid grid-cols-2 w-[200px] bg-zinc-800 border border-zinc-700">
              <TabsTrigger 
                value="A" 
                className={`data-[state=active]:${theme.primary === 'orange' ? 'bg-orange-600 text-white' : 'bg-zinc-700'}`}
              >
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4" />
                  <span>Studio A</span>
                </div>
              </TabsTrigger>
              <TabsTrigger 
                value="B" 
                className={`data-[state=active]:${theme.primary === 'green' ? 'bg-green-600 text-white' : 'bg-zinc-700'}`}
              >
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4" />
                  <span>Studio B</span>
                </div>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Main content */}
        <div className="container mx-auto pb-8 px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left column: Active Call Lines with improved styling */}
            <div className="lg:col-span-5 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Studio {studio} Call Lines</h2>
                <Badge variant="outline" className={`${theme.badge} text-white font-medium`}>
                  Active Call Console
                </Badge>
              </div>
              <div className={`space-y-1 bg-zinc-800 p-1 rounded-xl shadow-lg border ${studio === 'A' ? 'border-orange-800/30' : 'border-green-800/30'}`} style={{ height: '235px', overflow: 'auto' }}>
                {/* Filter to show only active or on-air calls, limit to max 3 lines */}
                {callLines
                  .filter(line => studio === 'A' 
                    ? line.id <= 4  // Filter by Studio A lines
                    : (line.id >= 5 && line.id <= 8)) // Filter by Studio B lines
                  .filter(line => line.status !== 'inactive') // Only show active calls
                  .filter((_, index) => index < 3) // Limit to 3 active call lines
                  .map(line => (
                    <CallInfoCard key={line.id} callLine={line} />
                  ))
                }
                {/* Show a message if there are no active calls */}
                {callLines
                  .filter(line => studio === 'A' 
                    ? line.id <= 4 
                    : (line.id >= 5 && line.id <= 8))
                  .filter(line => line.status !== 'inactive')
                  .length === 0 && (
                    <div className="text-center py-1 text-zinc-400 text-xs">
                      <p>No active calls</p>
                    </div>
                  )
                }
              </div>
            </div>
          
          {/* Right column: Producer Chat with enhanced styling */}
          <div className="lg:col-span-7">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-semibold text-white">Chat with Producer</h2>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`${theme.badge} text-white font-medium`}>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${theme.pulse} animate-pulse`}></div>
                    Studio {studio} Messages
                  </div>
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 px-2 border-zinc-700 bg-zinc-800 hover:bg-zinc-700">
                      <MoreVertical className="h-4 w-4 text-white" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-zinc-800 border-zinc-700">
                    <DropdownMenuItem onClick={clearChat} className="text-red-400 hover:bg-zinc-700 focus:bg-zinc-700">
                      <Trash className="mr-2 h-4 w-4" />
                      Clear Chat
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            <Card className="shadow-lg border border-zinc-700 bg-zinc-800">
              <CardContent className="p-0 rounded-xl overflow-hidden">
                <div className="flex flex-col h-[600px]">
                  {/* Chat header with the Producer avatar */}
                  <div className="bg-gradient-to-r from-zinc-800 to-zinc-700 p-4 border-b border-zinc-700">
                    <div className="flex items-center">
                      <Avatar className={`mr-3 h-10 w-10 bg-${theme.primary}-600 border-2 border-zinc-600 shadow-md`}>
                        <AvatarFallback className="font-bold">P</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium text-zinc-100">Producer</h3>
                        <p className="text-xs text-zinc-400">Studio {studio} Communication Channel</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Messages area with improved styling */}
                  <ScrollArea className="flex-1 p-5 bg-zinc-900">
                    <div className="space-y-4">
                      {chatMessages.map(msg => (
                        <div 
                          key={msg.id} 
                          className={`flex ${msg.senderRole === role ? 'justify-end' : 'justify-start'} items-end space-x-2`}
                        >
                          {msg.senderRole !== role && (
                            <Avatar className={`h-8 w-8 bg-${theme.primary}-600 border-2 border-zinc-700 shadow-md`}>
                              <AvatarFallback className="text-xs font-bold">P</AvatarFallback>
                            </Avatar>
                          )}
                          
                          <div 
                            className={`max-w-[70%] p-3 rounded-lg shadow-md ${
                              msg.senderRole === role 
                                ? `bg-${theme.primary}-600 text-white rounded-tr-none` 
                                : 'bg-zinc-700 border border-zinc-600 rounded-tl-none text-zinc-100'
                            }`}
                          >
                            <p>{msg.message}</p>
                            
                            {msg.fileAttachment && (
                              <div className={`mt-2 p-2 rounded flex items-center ${
                                msg.senderRole === role ? `bg-${theme.primary}-700` : 'bg-zinc-800'
                              }`}>
                                <FileText className="h-4 w-4 mr-2" />
                                <span className="text-xs">File Attachment</span>
                                <a 
                                  href={msg.fileAttachment} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className={`ml-2 text-xs underline ${
                                    msg.senderRole === role ? `text-${theme.primary}-100` : `text-${theme.primary}-300`
                                  }`}
                                >
                                  View
                                </a>
                              </div>
                            )}
                            
                            <p className={`text-xs mt-1 ${
                              msg.senderRole === role ? `text-${theme.primary}-100` : 'text-zinc-400'
                            }`}>
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                          
                          {msg.senderRole === role && (
                            <Avatar className={`h-8 w-8 bg-${theme.primary}-600 border-2 border-zinc-700 shadow-md`}>
                              <AvatarFallback className="text-xs font-bold">TA</AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      ))}
                      {/* Empty div for auto-scrolling to the latest message */}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                  
                  {/* Message input area with improved styling */}
                  <div className="p-4 border-t border-zinc-700 bg-zinc-800">
                    {selectedFile && (
                      <div className={`mb-3 p-2 bg-${theme.primary}-900/30 rounded-md flex items-center justify-between border ${theme.border}`}>
                        <div className="flex items-center">
                          <FileText className={`h-4 w-4 mr-2 text-${theme.primary}-400`} />
                          <span className={`text-sm truncate max-w-[200px] text-${theme.primary}-300`}>
                            {selectedFile.name}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-7 w-7 rounded-full hover:bg-${theme.primary}-800/50 text-${theme.primary}-300`}
                          onClick={() => setSelectedFile(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    
                    <div className="flex space-x-2">
                      <Input 
                        placeholder="Type your message to producer..." 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                        className={`border-zinc-600 bg-zinc-700 text-zinc-100 focus:border-${theme.primary}-500 placeholder-zinc-400`}
                      />
                      <input
                        type="file"
                        id="talent-file-attachment"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Button 
                        variant="outline" 
                        size="icon"
                        className="border-zinc-600 bg-zinc-700 hover:bg-zinc-600 text-zinc-300"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Button 
                        onClick={sendMessage}
                        className={`bg-${theme.primary}-600 hover:bg-${theme.primary}-700 text-white`}
                      >
                        Send
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

function CallInfoCard({ callLine }: { callLine: CallLine }) {
  // State for call duration
  const [duration, setDuration] = useState('00:00');
  
  // Calculate and update duration for calls
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
  
  // Get status style information for dark mode
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'inactive': 
        return {
          background: 'bg-zinc-600',
          text: 'text-zinc-400',
          animation: '',
          badge: 'bg-zinc-700 text-zinc-400',
          border: 'border-zinc-700',
          bgLight: 'bg-zinc-800'
        };
      case 'ringing': 
        return {
          background: 'bg-orange-500',
          text: 'text-orange-300',
          animation: 'animate-pulse',
          badge: 'bg-orange-700 text-orange-100',
          border: 'border-orange-700',
          bgLight: 'bg-orange-900/40'
        };
      case 'active': 
        return {
          background: 'bg-green-500',
          text: 'text-green-300',
          animation: '',
          badge: 'bg-green-700 text-green-100',
          border: 'border-green-700',
          bgLight: 'bg-green-900/40'
        };
      case 'holding': 
        return {
          background: 'bg-amber-500',
          text: 'text-amber-300',
          animation: '',
          badge: 'bg-amber-700 text-amber-100',
          border: 'border-amber-700',
          bgLight: 'bg-amber-900/40'
        };
      case 'on-air': 
        return {
          background: 'bg-red-500',
          text: 'text-red-300',
          animation: 'animate-on-air-blink',
          badge: 'bg-red-700 text-red-100',
          border: 'border-red-700',
          bgLight: 'bg-red-900/40'
        };
      default: 
        return {
          background: 'bg-zinc-600',
          text: 'text-zinc-400',
          animation: '',
          badge: 'bg-zinc-700 text-zinc-400',
          border: 'border-zinc-700',
          bgLight: 'bg-zinc-800'
        };
    }
  };

  const statusStyle = getStatusStyle(callLine.status);

  return (
    <Card className={`bg-zinc-800 ${callLine.status !== 'inactive' ? `border ${statusStyle.border}` : 'border-zinc-700'}`} style={{ minHeight: '90px' }}>
      <div className="flex justify-between items-center px-2 py-0.5 border-b border-zinc-700/50">
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${statusStyle.background} ${statusStyle.animation}`} />
          <span className="text-xs font-medium text-zinc-100">Line {callLine.id}</span>
        </div>
        <div className={`text-xs px-1 py-px rounded ${statusStyle.badge} text-[10px]`}>
          {callLine.status.charAt(0).toUpperCase() + callLine.status.slice(1)}
        </div>
      </div>
      <div className="px-2 py-1 text-zinc-100">
        {callLine.status !== 'inactive' ? (
          <div className="flex flex-col gap-0.5">
            <div className="text-sm font-medium flex justify-between">
              <span className="truncate max-w-[70%]">{callLine.contact?.name || 'Unknown'}</span>
              {callLine.status === 'on-air' && (
                <span className="bg-red-600 text-white text-[10px] px-1 py-px rounded">ON AIR: {duration}</span>
              )}
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-zinc-400 truncate">{callLine.phoneNumber || 'No number'}</span>
              {callLine.status === 'holding' && <span className={`text-[10px] ${statusStyle.text}`}>ON HOLD</span>}
              {callLine.status === 'ringing' && <span className={`text-[10px] ${statusStyle.text} ${statusStyle.animation}`}>INCOMING</span>}
            </div>
            
            {/* Audio Meter - simplified and smaller */}
            {(callLine.status === 'active' || callLine.status === 'on-air' || callLine.status === 'holding') && (
              <div className="border-t border-zinc-700/50 pt-1 mt-1">
                <AudioMeter lineId={callLine.id} height={20} />
              </div>
            )}
          </div>
        ) : (
          <div className="py-1 text-center text-zinc-500 text-xs">
            No active call
          </div>
        )}
      </div>
    </Card>
  );
}
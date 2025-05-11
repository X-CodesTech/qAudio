import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Paperclip, MoreVertical, Trash, FileText, X, Phone, Radio } from 'lucide-react';
import { CallLine, CallStatus } from '@shared/schema';
import { useVoIP } from '@/contexts/VoIPContext';
import { useCountdown } from '@/contexts/CountdownContext';
import QCallerLogo from '@assets/qcaller_logo_v3.png';
import { formatDuration } from '@/lib/utils';
import StandaloneTimer from '@/components/StandaloneTimer';
import BuzzerButton from '@/components/BuzzerButton';
import { useToast } from '@/hooks/use-toast';

export default function TalentViewBNew() {
  const { t } = useTranslation();
  const role = 'talent';
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { callLines, websocket } = useVoIP();
  
  console.log('TalentViewBNew (Studio B) rendering, callLines:', callLines);
  
  // State for messages, active calls, and chat functionality
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{
    id: number;
    senderRole: string;
    receiverRole: string;
    studioId: 'A' | 'B' | null;
    message: string;
    timestamp: Date;
    fileAttachment?: string;
    read: boolean;
  }>>([]);
  
  // Effect to handle WebSocket authentication with studio ID
  useEffect(() => {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      // Send proper authentication with studio ID
      websocket.send(JSON.stringify({
        type: 'auth',
        role: 'talent',
        studioId: 'B' // Explicitly set Studio B for this talent view
      }));
      
      console.log('TalentViewB: Sent authentication with studioId: B');
      
      // Request chat messages
      websocket.send(JSON.stringify({
        type: 'getChatMessages',
        data: { role: 'talent', studioId: 'B' }
      }));
      
      // Mark messages as read
      websocket.send(JSON.stringify({
        type: 'markChatMessagesAsRead',
        data: { receiverRole: 'talent', senderRole: 'producer' }
      }));
    }
  }, [websocket]);
  
  // Listen for WebSocket events (messages, call updates)
  useEffect(() => {
    if (!websocket) return;
    
    const handleWebSocketMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      
      // Log all websocket messages for debugging
      console.log(`TalentViewB WebSocket message: ${data.type}`, data);
      
      // Handle producer buzzer to talent notification
      if (data.type === 'talentBuzzer') {
        console.log('⚠️ TALENT B received talentBuzzer message:', JSON.stringify(data));
        const buzzerStudioId = data.data?.studioId;
        const activate = data.data?.activate !== undefined ? data.data.activate : false;
        
        // Only handle messages for Studio B in this component
        if (buzzerStudioId === 'B') {
          console.log(`⚠️ TALENT B dispatching talentBuzzerEvent for Studio B: ${activate}`);
          
          // Show a direct toast notification
          if (activate) {
            toast({
              title: "Producer Alert",
              description: "Your producer is buzzing you",
              variant: "destructive",
            });
            
            // Play a sound if available
            const audio = new Audio("/buzzer-sound.mp3");
            audio.play().catch(e => console.log("Audio play error:", e));
          }
          
          // Dispatch a custom event that the BuzzerButton component will listen for
          window.dispatchEvent(new CustomEvent('talentBuzzerEvent', {
            detail: { studioId: buzzerStudioId, activate }
          }));
        }
      }
      
      // Handle chat history (initial load of messages)
      if (data.type === 'chatHistory' && data.studioId === 'B') {
        console.log('Received chat history for Studio B:', data.messages);
        setChatMessages(data.messages || []);
        
        // Automatically mark messages as read when received
        websocket.send(JSON.stringify({
          type: 'markChatMessagesAsRead',
          data: { receiverRole: 'talent', senderRole: 'producer' }
        }));
      }
      
      // Handle new individual chat messages
      if (data.type === 'newChatMessage' && data.data && data.data.studioId === 'B') {
        console.log('Received new chat message for Studio B:', data.data);
        setChatMessages(prev => [...prev, data.data]);
        
        // Automatically mark messages as read when received
        websocket.send(JSON.stringify({
          type: 'markChatMessagesAsRead',
          data: { receiverRole: 'talent', senderRole: 'producer' }
        }));
      }
    };
    
    websocket.addEventListener('message', handleWebSocketMessage);
    
    return () => {
      websocket.removeEventListener('message', handleWebSocketMessage);
    };
  }, [websocket]);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);
  
  // Handle file selection for attachments
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  // Send a message via WebSocket
  const sendMessage = () => {
    if ((!newMessage.trim() && !selectedFile) || !websocket || websocket.readyState !== WebSocket.OPEN) return;
    
    // Convert file to base64 if needed
    let fileAttachmentData = undefined;
    if (selectedFile) {
      // For simplicity in this fix, we'll handle files differently
      console.log('File attachments will be handled in a future update');
    }
    
    // Create the message with the correct type 'chatMessage' that the server expects
    const message = {
      type: 'chatMessage',
      receiverRole: 'producer',
      message: newMessage.trim(),
      studioId: 'B',
      timestamp: new Date().toISOString(),
      fileAttachment: fileAttachmentData
    };
    
    console.log('Sending chat message:', message);
    websocket.send(JSON.stringify(message));
    setNewMessage('');
    setSelectedFile(null);
  };
  
  // Clear chat messages
  const clearChat = () => {
    if (!websocket || websocket.readyState !== WebSocket.OPEN) return;
    
    console.log('Talent B: Clearing chat messages permanently');
    
    // Send WebSocket message to clear messages
    websocket.send(JSON.stringify({
      type: 'clearChat',
      senderRole: 'talent',
      receiverRole: 'producer',
      studioId: 'B',
      permanent: true  // Add permanent flag to ensure messages are deleted from DB
    }));
    
    setChatMessages([]);
  };
  
  return (
    <>
      {/* Buzzer button for Talent to notify Producer */}
      <BuzzerButton isProducer={false} studioId="B" />
      
      {/* Completely redesigned layout structure */}
      <div className="flex flex-col min-h-screen bg-zinc-900 text-zinc-100">
        {/* 1. Main logo header */}
        <header className="bg-gradient-to-r from-black to-zinc-900 text-white shadow-md py-3">
          <div className="container mx-auto flex justify-center">
            <img 
              src={QCallerLogo} 
              alt="QCaller by Mazen Shahin" 
              className="h-14 w-auto" 
            />
          </div>
        </header>
        
        {/* 2. Standalone timer header positioned like reference photo */}
        <div className="bg-black text-white py-4 border-t border-b border-zinc-800 shadow-lg">
          <div className="relative">
            {/* Studio label at top */}
            <div className="absolute top-0 left-4 text-sm text-green-400 font-medium">
              STUDIO B
            </div>
            
            {/* Centered countdown timer in white box */}
            <div className="flex justify-center">
              <div className="flex flex-col items-center">
                <div className="px-6 py-3 rounded-md mb-1 scale-110">
                  <StandaloneTimer studio="B" variant="talent" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Main content area */}
        <main className="flex-1 container mx-auto py-8 px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left column: Active Call Lines */}
            <div className="lg:col-span-5 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-green-300">Studio B Call Lines</h2>
                <Badge variant="outline" className="bg-green-900/60 text-green-300 border-green-700">
                  Active Call Console
                </Badge>
              </div>
              <div className="space-y-5 bg-zinc-800 p-5 rounded-xl shadow-md border border-zinc-700">
                {/* Only show call lines that are active, or show a placeholder if all are inactive */}
                {callLines
                  .filter(line => line.id >= 4 && line.id <= 6) // Only show Studio B lines (4-6)
                  .some(line => line.status !== 'inactive') ? (
                    // If at least one line is active, show only active lines
                    callLines
                      .filter(line => line.id >= 4 && line.id <= 6 && line.status !== 'inactive')
                      .map(line => (
                        <CallInfoCard key={line.id} callLine={line} />
                      ))
                  ) : (
                    // If all lines are inactive, show a placeholder message
                    <div className="p-4 text-center text-zinc-500">
                      <p>No active calls</p>
                    </div>
                  )
                }
              </div>
            </div>
          
            {/* Right column: Producer Chat */}
            <div className="lg:col-span-7">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold text-white">Producer Communication</h2>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-900/60 text-white font-medium border-green-700">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
                      Studio Messages
                    </div>
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 px-2 bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 hover:text-zinc-100">
                        <MoreVertical className="h-4 w-4" />
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
              
              <Card className="shadow-md border border-zinc-700 bg-zinc-800">
                <CardContent className="p-0 bg-zinc-800 rounded-xl overflow-hidden">
                  <div className="flex flex-col h-[600px]">
                    {/* Chat header with the Producer avatar */}
                    <div className="bg-gradient-to-r from-zinc-900 to-zinc-800 p-4 border-b border-zinc-700">
                      <div className="flex items-center">
                        <Avatar className="mr-3 h-10 w-10 bg-green-900 border-2 border-green-700 shadow-md">
                          <AvatarFallback className="font-bold text-green-100">P</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium text-zinc-100">Producer</h3>
                          <p className="text-xs text-zinc-400">Direct Communication Channel</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Messages area with improved styling */}
                    <ScrollArea className="flex-1 p-5 bg-gradient-to-b from-zinc-900 to-zinc-800">
                      <div className="space-y-4">
                        {chatMessages.map(msg => (
                          <div 
                            key={msg.id} 
                            className={`flex ${msg.senderRole === role ? 'justify-end' : 'justify-start'} items-end space-x-2`}
                          >
                            {msg.senderRole !== role && (
                              <Avatar className="h-8 w-8 bg-green-900 border-2 border-zinc-700 shadow-md">
                                <AvatarFallback className="text-xs font-bold text-green-100">P</AvatarFallback>
                              </Avatar>
                            )}
                            
                            <div 
                              className={`max-w-[70%] p-3 rounded-lg shadow-md ${
                                msg.senderRole === role 
                                  ? 'bg-green-700 text-white rounded-tr-none border border-green-600' 
                                  : 'bg-zinc-700 border border-zinc-600 rounded-tl-none text-zinc-100'
                              }`}
                            >
                              <p>{msg.message}</p>
                              
                              {msg.fileAttachment && (
                                <div className={`mt-2 p-2 rounded flex items-center ${
                                  msg.senderRole === role ? 'bg-green-800' : 'bg-zinc-800'
                                }`}>
                                  <FileText className="h-4 w-4 mr-2" />
                                  <span className="text-xs">File Attachment</span>
                                  <a 
                                    href={msg.fileAttachment} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className={`ml-2 text-xs underline ${
                                      msg.senderRole === role ? 'text-green-200' : 'text-green-300'
                                    }`}
                                  >
                                    View
                                  </a>
                                </div>
                              )}
                              
                              <p className={`text-xs mt-1 ${
                                msg.senderRole === role ? 'text-green-200' : 'text-zinc-400'
                              }`}>
                                {new Date(msg.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                            
                            {msg.senderRole === role && (
                              <Avatar className="h-8 w-8 bg-green-600 border-2 border-zinc-700 shadow-md">
                                <AvatarFallback className="text-xs font-bold text-green-100">TB</AvatarFallback>
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
                        <div className="mb-3 p-2 bg-green-900/40 rounded-md flex items-center justify-between border border-green-800">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-green-400" />
                            <span className="text-sm truncate max-w-[200px] text-green-300">
                              {selectedFile.name}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full hover:bg-green-800/50 text-green-300"
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
                          className="bg-zinc-700 border-zinc-600 text-zinc-100 focus:border-green-600 placeholder:text-zinc-400"
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
                          className="bg-zinc-700 border-zinc-600 text-zinc-300 hover:bg-green-800 hover:text-green-200"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Paperclip className="h-4 w-4" />
                        </Button>
                        <Button 
                          onClick={sendMessage}
                          className="bg-green-700 hover:bg-green-600 text-white"
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
        </main>
      </div>
    </>
  );
}

// Enhanced CallInfoCard component with better styling
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
  
  // Get status style information
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'inactive': 
        return {
          background: 'bg-gray-300',
          text: 'text-gray-500',
          animation: '',
          badge: 'bg-gray-100 text-gray-500',
          border: 'border-gray-200',
          bgLight: 'bg-gray-50'
        };
      case 'ringing': 
        return {
          background: 'bg-blue-500',
          text: 'text-blue-600',
          animation: 'animate-pulse',
          badge: 'bg-blue-500 text-white',
          border: 'border-blue-300',
          bgLight: 'bg-blue-50'
        };
      case 'active': 
        return {
          background: 'bg-green-500',
          text: 'text-green-600',
          animation: '',
          badge: 'bg-green-500 text-white',
          border: 'border-green-300',
          bgLight: 'bg-green-50'
        };
      case 'holding': 
        return {
          background: 'bg-amber-500',
          text: 'text-amber-600',
          animation: 'animate-pulse',
          badge: 'bg-amber-500 text-white',
          border: 'border-amber-300',
          bgLight: 'bg-amber-50'
        };
      case 'on-air': 
        return {
          background: 'bg-red-500',
          text: 'text-red-600',
          animation: 'animate-pulse',
          badge: 'bg-red-500 text-white',
          border: 'border-red-300',
          bgLight: 'bg-red-50'
        };
      default: 
        return {
          background: 'bg-gray-300',
          text: 'text-gray-500',
          animation: '',
          badge: 'bg-gray-100 text-gray-500',
          border: 'border-gray-200',
          bgLight: 'bg-gray-50'
        };
    }
  };
  
  const statusStyle = getStatusStyle(callLine.status);
  
  // Status label mapping
  const getStatusLabel = (status: CallStatus) => {
    switch (status) {
      case 'inactive': return 'Inactive';
      case 'ringing': return 'Ringing';
      case 'active': return 'Connected';
      case 'holding': return 'On Hold';
      case 'on-air': return 'ON AIR';
      default: return 'Unknown';
    }
  };
  
  return (
    <Card className={`overflow-hidden shadow-md transition-all duration-200 bg-zinc-800 ${callLine.status !== 'inactive' ? `border ${statusStyle.border}` : 'border-zinc-700'}`}>
      <CardContent className="p-0">
        {/* Call Header - Status Badge and Line Info */}
        <div className={`p-3 border-b ${callLine.status !== 'inactive' ? 'border-green-700/40' : 'border-zinc-700'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                callLine.status === 'inactive' ? 'bg-zinc-500' : 
                callLine.status === 'on-air' ? 'bg-red-500 animate-pulse' : 
                callLine.status === 'holding' ? 'bg-amber-500 animate-pulse' : 
                callLine.status === 'ringing' ? 'bg-blue-500 animate-pulse' : 
                'bg-green-500'
              }`}></div>
              <span className={`text-sm font-medium ${
                callLine.status === 'inactive' ? 'text-zinc-400' : 
                callLine.status === 'on-air' ? 'text-red-400' : 
                callLine.status === 'holding' ? 'text-amber-400' : 
                callLine.status === 'ringing' ? 'text-blue-400' : 
                'text-green-400'
              }`}>
                Line {callLine.id}
              </span>
            </div>
            
            <Badge 
              variant="outline" 
              className={`text-xs ${
                callLine.status === 'inactive' ? 'bg-zinc-700/50 text-zinc-400 border-zinc-600' : 
                callLine.status === 'on-air' ? 'bg-red-900/30 text-red-300 border-red-800' : 
                callLine.status === 'holding' ? 'bg-amber-900/30 text-amber-300 border-amber-800' : 
                callLine.status === 'ringing' ? 'bg-blue-900/30 text-blue-300 border-blue-800' : 
                'bg-green-900/30 text-green-300 border-green-800'
              }`}
            >
              {getStatusLabel(callLine.status)}
            </Badge>
          </div>
        </div>
        
        {/* Call Details - Reduced for talent view */}
        <div className="p-3 bg-zinc-800/80">
          {callLine.status !== 'inactive' && (
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {callLine.contact ? (
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-200">{callLine.contact.name}</h3>
                    <p className="text-sm text-zinc-400">{callLine.contact.phone}</p>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-200">{callLine.phoneNumber || 'Unknown'}</h3>
                    <p className="text-sm text-zinc-400">No contact information</p>
                  </div>
                )}
              </div>
              
              <div className="text-right">
                <div className="text-sm font-mono text-zinc-300">{duration}</div>
                <div className="text-xs text-zinc-500">Duration</div>
              </div>
            </div>
          )}
          
          {callLine.status === 'inactive' && (
            <div className="py-1 text-center text-zinc-500 text-sm">
              No active call
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
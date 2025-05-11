import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Alert } from '@/components/ui/alert';
import { CallLine } from '@shared/schema';
import { useVoIP } from '@/contexts/VoIPContext';
import { useAuth } from '@/contexts/AuthContext';
import AdminViewTabs from '@/components/AdminViewTabs';
import { Paperclip, MoreVertical, Trash, FileText, X, LogOut, Radio } from 'lucide-react';
import QCallerLogo from '@assets/qcaller_logo_v4.png';
import { formatDuration } from '@/lib/utils';
import BuzzerButton from '@/components/SocketBuzzer';
import StandaloneTimer from '@/components/StandaloneTimer';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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

export default function TalentViewB() {
  // Hardcode the role since this is the TalentView
  const role = 'talent';
  const { callLines, websocket } = useVoIP();
  const { logoutMutation } = useAuth();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Check if this view is being rendered inside TalentsView
  const isEmbedded = window.location.pathname.includes('/talents');

  // Use the WebSocket connection from VoIPContext
  useEffect(() => {
    if (!websocket) return;
    
    // When the component mounts, authenticate with Studio B
    if (websocket.readyState === WebSocket.OPEN) {
      console.log("TalentViewB: Initial authentication with Studio B");
      websocket.send(JSON.stringify({
        type: 'auth',
        role: role,
        studioId: 'B',
        studioAccess: ['A', 'B'] // Give access to both studios to ensure messages are received
      }));
      
      // Request initial countdown state for Studio B
      websocket.send(JSON.stringify({
        type: 'countdown_state_request',
        studio: 'B'
      }));
    }
    
    // Set up listeners for the websocket
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'chatHistory') {
          // Set messages for Studio B
          const messages = data.data;
          setChatMessages(messages);
        } else if (data.type === 'newChatMessage') {
          // Add message if it's for Studio B or has no studioId
          const newMessage = data.data;
          if (newMessage.studioId === 'B' || !newMessage.studioId) {
            setChatMessages(prev => [...prev, newMessage]);
          }
        } else if (data.type === 'clearChat') {
          // Handle clear chat command from producer
          const { studioId } = data.data;
          
          // Clear the chat if it's a general clear or specifically for Studio B
          if (!studioId || studioId === 'B') {
            setChatMessages([]);
          }
        } else if (data.type === 'countdown_update') {
          // Countdown updates are handled by the CountdownTimer component
          const updateStudio = data.studio;
          
          // Only process if this update is for Studio B
          if (updateStudio === 'B') {
            // We dispatch a custom event for the CountdownTimer to pick up
            const countdownEvent = new CustomEvent('countdown_update', { 
              detail: data 
            });
            window.dispatchEvent(countdownEvent);
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
  }, [websocket]); 

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
      studioId: 'B'
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
      studioId: 'B'
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

  return (
    <>
      {/* Fixed transparent header - Only shown when not embedded in TalentsView */}
      {!isEmbedded && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-zinc-900/80 backdrop-blur-sm border-b border-zinc-800 shadow-lg">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Badge 
                variant="outline" 
                className="bg-green-500 text-white px-3 py-1.5"
              >
                Studio B
              </Badge>
              <div className="ml-4">
                <AdminViewTabs />
              </div>
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
              <BuzzerButton isProducer={false} studioId="B" hideInStudioHeader={true} />
            </div>
          </div>
        </div>
      )}
      
      {/* Main content with spacing for fixed header */}
      <div className={`${isEmbedded ? '' : 'min-h-screen'} bg-zinc-900 text-zinc-100`}>
        {/* Spacer to push content below fixed header - only when not embedded */}
        {!isEmbedded && <div className="h-[60px]"></div>}
        
        {/* Main content */}
        <div className="container mx-auto px-4 pt-6 pb-8">
          {/* Countdown Timer */}
          <div className="mb-6 flex justify-center">
            <StandaloneTimer studio="B" variant="talent" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left column: Active Call Lines */}
            <div className="lg:col-span-5 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-zinc-100">Studio B Call Lines</h2>
                <Badge variant="outline" className="bg-green-900/30 text-green-300 border-green-800">
                  Active Call Console
                </Badge>
              </div>
              <div className="space-y-5 bg-zinc-800 p-5 rounded-xl shadow-lg border border-green-800/30">
                {callLines
                  .filter(line => line.id >= 5 && line.id <= 8) // Show lines 5-8 for Studio B
                  .map(line => (
                    <CallInfoCard key={line.id} callLine={line} />
                  ))
                }
              </div>
            </div>
            
            {/* Right column: Producer Chat */}
            <div className="lg:col-span-7">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold text-white">Chat with Producer</h2>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-900/30 text-white font-medium border-green-800">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
                      Studio B Messages
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
                        <Avatar className="mr-3 h-10 w-10 bg-green-600 border-2 border-zinc-600 shadow-md">
                          <AvatarFallback className="font-bold">P</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium text-zinc-100">Producer</h3>
                          <p className="text-xs text-zinc-400">Studio B Communication Channel</p>
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
                              <Avatar className="h-8 w-8 bg-green-600 border-2 border-zinc-700 shadow-md">
                                <AvatarFallback className="text-xs font-bold">P</AvatarFallback>
                              </Avatar>
                            )}
                            
                            <div 
                              className={`max-w-[70%] p-3 rounded-lg shadow-md ${
                                msg.senderRole === role 
                                  ? 'bg-green-600 text-white rounded-tr-none' 
                                  : 'bg-zinc-700 border border-zinc-600 rounded-tl-none text-zinc-100'
                              }`}
                            >
                              <p>{msg.message}</p>
                              
                              {msg.fileAttachment && (
                                <div className={`mt-2 p-2 rounded flex items-center ${
                                  msg.senderRole === role ? 'bg-green-700' : 'bg-zinc-800'
                                }`}>
                                  <FileText className="h-4 w-4 mr-2" />
                                  <span className="text-xs">File Attachment</span>
                                  <a 
                                    href={msg.fileAttachment} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className={`ml-2 text-xs underline ${
                                      msg.senderRole === role ? 'text-green-100' : 'text-green-300'
                                    }`}
                                  >
                                    View
                                  </a>
                                </div>
                              )}
                              
                              <p className={`text-xs mt-1 ${
                                msg.senderRole === role ? 'text-green-100' : 'text-zinc-400'
                              }`}>
                                {new Date(msg.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                            
                            {msg.senderRole === role && (
                              <Avatar className="h-8 w-8 bg-green-600 border-2 border-zinc-700 shadow-md">
                                <AvatarFallback className="text-xs font-bold">TB</AvatarFallback>
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
                        <div className="mb-3 p-2 bg-green-900/30 rounded-md flex items-center justify-between border border-green-800">
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
                          className="border-zinc-600 bg-zinc-700 text-zinc-100 focus:border-green-500 placeholder-zinc-400"
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
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-zinc-700 border-zinc-600 hover:bg-zinc-600"
                        >
                          <Paperclip className="h-4 w-4" />
                        </Button>
                        <Button 
                          onClick={sendMessage}
                          className="bg-green-600 hover:bg-green-700"
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
  
  // Get status style information
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'inactive': 
        return {
          background: 'bg-zinc-400',
          text: 'text-zinc-500',
          animation: '',
          badge: 'bg-zinc-200 text-zinc-500',
          border: 'border-zinc-300',
          bgLight: 'bg-zinc-50'
        };
      case 'ringing': 
        return {
          background: 'bg-blue-500',
          text: 'text-blue-600',
          animation: 'animate-pulse',
          badge: 'bg-blue-500 text-white',
          border: 'border-blue-400',
          bgLight: 'bg-blue-50'
        };
      case 'active': 
        return {
          background: 'bg-green-500',
          text: 'text-green-600',
          animation: '',
          badge: 'bg-green-500 text-white',
          border: 'border-green-400',
          bgLight: 'bg-green-50'
        };
      case 'holding': 
        return {
          background: 'bg-amber-500',
          text: 'text-amber-600',
          animation: '',
          badge: 'bg-amber-500 text-white',
          border: 'border-amber-400',
          bgLight: 'bg-amber-50'
        };
      case 'on-air': 
        return {
          background: 'bg-red-500',
          text: 'text-red-600',
          animation: 'animate-pulse',
          badge: 'bg-red-500 text-white',
          border: 'border-red-400',
          bgLight: 'bg-red-50'
        };
      default: 
        return {
          background: 'bg-zinc-400',
          text: 'text-zinc-500',
          animation: '',
          badge: 'bg-zinc-200 text-zinc-500',
          border: 'border-zinc-300',
          bgLight: 'bg-zinc-50'
        };
    }
  };

  const statusStyle = getStatusStyle(callLine.status);

  return (
    <Card className={callLine.status !== 'inactive' ? `border ${statusStyle.border}` : ''}>
      <CardHeader className={`flex flex-row items-center justify-between pb-2 ${callLine.status !== 'inactive' ? statusStyle.bgLight : ''}`}>
        <div className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded-full ${statusStyle.background} ${statusStyle.animation}`} />
          <CardTitle className="text-sm font-medium">
            Line {callLine.id}
          </CardTitle>
        </div>
        <div className={`text-xs px-2 py-0.5 rounded-full ${statusStyle.badge}`}>
          {callLine.status.charAt(0).toUpperCase() + callLine.status.slice(1)}
        </div>
      </CardHeader>
      <CardContent>
        {callLine.status !== 'inactive' ? (
          <>
            <div className="text-xl font-bold">
              {callLine.contact?.name || callLine.phoneNumber || 'Unknown Caller'}
            </div>
            {callLine.phoneNumber && (
              <div className="text-sm text-muted-foreground">
                {callLine.phoneNumber}
              </div>
            )}
            {callLine.notes && (
              <>
                <Separator className="my-2" />
                <div className="text-sm mt-2">
                  <p className="font-semibold">Notes:</p>
                  <p>{callLine.notes}</p>
                </div>
              </>
            )}
            <div className="mt-3">
              {callLine.status === 'on-air' && (
                <div style={{
                  backgroundColor: 'red',
                  color: 'white',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  padding: '8px',
                  margin: '0 0 12px 0',
                  borderRadius: '4px'
                }}>
                  ON AIR: {duration}
                </div>
              )}
              {callLine.status === 'holding' && (
                <div className={`text-center py-2 font-semibold ${statusStyle.text}`}>
                  ON HOLD
                </div>
              )}
              {callLine.status === 'ringing' && (
                <div className={`text-center py-2 font-semibold ${statusStyle.text} ${statusStyle.animation}`}>
                  INCOMING CALL
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-6 text-gray-400">
            Line {callLine.id} - No Active Call
          </div>
        )}
      </CardContent>
    </Card>
  );
}
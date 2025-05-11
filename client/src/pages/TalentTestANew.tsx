import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Mic, 
  Clock, 
  MessageCircle, 
  Phone,
  Music,
  PhoneForwarded,
  PhoneOff,
  Home
} from 'lucide-react';
import { Link } from 'wouter';
import BuzzerButton from '@/components/BuzzerButton';
// Import QCaller logo from attached assets
import QCallerLogo from '@assets/qcaller_logo_v4.png';
import { Progress } from '@/components/ui/progress';
import { useVoIP } from '@/contexts/VoIPContext';
import { CallLine } from '@shared/schema';
import StandaloneTimer from '@/components/StandaloneTimer';

export default function TalentTestANew() {
  const role = 'talent';
  const studio = 'A';
  const [newMessage, setNewMessage] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Use real call lines data from VoIP context
  const { callLines: contextCallLines, hangupCall, holdCall, sendToAir, takeOffAir } = useVoIP();
  
  // Filter call lines for this studio
  const callLines = contextCallLines?.filter(line => line.studio === 'A') || [];
  
  // Chat messages
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      senderRole: 'producer',
      message: 'Welcome to Studio A! Your show starts in 10 minutes.',
      timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      read: true
    },
    {
      id: 2,
      senderRole: 'talent',
      message: 'Thanks, I\'m ready to go!',
      timestamp: new Date(Date.now() - 1000 * 60 * 9).toISOString(),
      read: true
    },
    {
      id: 3,
      senderRole: 'producer',
      message: 'Your first caller will be John Smith discussing the local festival.',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      read: true
    }
  ]);
  
  // Update time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Handle sending a message
  const sendMessage = () => {
    if (!newMessage.trim()) return;
    
    setChatMessages([
      ...chatMessages,
      {
        id: Date.now(),
        senderRole: 'talent',
        message: newMessage,
        timestamp: new Date().toISOString(),
        read: true
      }
    ]);
    
    // Simulate producer response
    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          senderRole: 'producer',
          message: 'Message received, thanks!',
          timestamp: new Date().toISOString(),
          read: true
        }
      ]);
    }, 2000);
    
    setNewMessage('');
  };
  
  // Color theme for Studio A
  const theme = {
    primary: 'orange',
    badge: 'bg-orange-900/30 text-orange-300 border-orange-800',
    pulse: 'bg-orange-400',
    highlight: 'bg-orange-600', 
    highlightHover: 'hover:bg-orange-700',
    border: 'border-orange-800',
  };
  
  // Scroll to bottom of chat messages when new message is added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);
  
  return (
    <>
      {/* Fixed transparent header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-zinc-900/80 backdrop-blur-sm border-b border-zinc-800 shadow-lg">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Badge 
              variant="outline" 
              className="bg-orange-500 text-white px-3 py-1.5"
            >
              Studio A
            </Badge>
          </div>
          <img 
            src={QCallerLogo} 
            alt="QCaller Studio" 
            className="h-8 w-auto mx-auto absolute left-1/2 transform -translate-x-1/2"
          />
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded transition-colors">
              <Home className="h-4 w-4 text-orange-500" />
              <span>Home</span>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="min-h-screen bg-zinc-900 text-zinc-100">
        {/* Spacer to push content below fixed header */}
        <div className="h-[60px]"></div>
        
        {/* Empty space for header spacing */}
        <div className="container mx-auto pt-6 pb-4 px-4"></div>

        {/* Content grid */}
        <div className="container mx-auto pb-8 px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left column: Active Call Lines */}
            <div className="lg:col-span-5 space-y-5">
              {/* Call Lines */}
              <Card className="border-zinc-800 bg-zinc-800/50 h-[540px] overflow-hidden">
                <CardHeader className="pb-1 px-3 pt-2">
                  <CardTitle className="text-sm flex items-center text-white">
                    <Phone className="h-4 w-4 mr-1.5 text-orange-500" />
                    Active Call Lines
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2">
                  <ScrollArea className="h-[490px]">
                    <div className="space-y-1.5">
                      {callLines.map(line => (
                        <div 
                          key={line.id}
                          className={`p-2 border rounded-md min-h-[120px] ${
                            line.status === 'inactive' ? 'border-zinc-700 bg-zinc-900/50' :
                            line.status === 'ringing' ? 'border-yellow-500/40 bg-yellow-950/20' :
                            line.status === 'holding' ? 'border-yellow-500 bg-yellow-500/25' : 
                            line.status === 'on-air' ? 'border-red-500 bg-red-500/25' :
                            'border-emerald-500/40 bg-emerald-950/20'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-1">
                              {line.status === 'inactive' ? (
                                <Phone className="h-3 w-3 text-zinc-500" />
                              ) : line.status === 'ringing' ? (
                                <Phone className="h-3 w-3 text-yellow-500 animate-pulse" />
                              ) : line.status === 'holding' ? (
                                <PhoneOff className="h-3 w-3 text-yellow-500" />
                              ) : line.status === 'on-air' ? (
                                <PhoneForwarded className="h-3 w-3 text-red-500" />
                              ) : (
                                <PhoneForwarded className="h-3 w-3 text-emerald-500" />
                              )}
                              <span className="text-xs font-medium">Line {line.id}</span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              {line.status !== 'inactive' && (
                                <>
                                  <span 
                                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                                      line.status === 'holding' ? 'bg-yellow-950 text-yellow-500 border border-yellow-600' : 
                                      line.status === 'ringing' ? 'bg-yellow-950 text-yellow-500' :
                                      line.status === 'on-air' ? 'bg-red-950 text-red-500' :
                                      'bg-emerald-950 text-emerald-500'
                                    }`}
                                  >
                                    {line.status === 'holding' ? 'Hold' : line.status === 'ringing' ? 'Ring' : 'Connected'}
                                  </span>
                                  
                                  {line.status === 'on-air' && (
                                    <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded">
                                      ON AIR
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                          
                          {line.status !== 'inactive' && (
                            <div className="mt-1.5 flex justify-between items-center">
                              <div>
                                <div className="text-sm font-medium">{line.contact?.name || 'Unknown'}</div>
                                <div className="text-xs text-zinc-400">{line.phoneNumber || 'Unknown'}</div>
                              </div>
                              
                              <div className="h-4 bg-zinc-950 rounded-sm overflow-hidden w-24">
                                <div
                                  className={`h-full ${
                                    line.status === 'on-air' ? 'bg-red-500' :
                                    line.status === 'holding' ? 'bg-yellow-500' :
                                    'bg-green-500'
                                  } transition-all duration-100`}
                                  style={{ width: `${Math.random() * 80}%` }}
                                />
                              </div>
                            </div>
                          )}
                          
                          {(line.status === 'active' || line.status === 'connected') && (
                            <div className="grid grid-cols-2 gap-1 mt-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-xs h-8"
                                onClick={() => holdCall(line.id)}
                              >
                                {line.status === 'holding' ? 'Resume' : 'Hold'}
                              </Button>
                              <Button 
                                size="sm" 
                                variant={line.status === 'on-air' ? "destructive" : "default"} 
                                className="text-xs h-8"
                                onClick={() => line.status === 'on-air' ? takeOffAir(line.id) : sendToAir(line.id)}
                              >
                                {line.status === 'on-air' ? 'Off Air' : 'On Air'}
                              </Button>
                            </div>
                          )}
                          
                          {line.status === 'ringing' && (
                            <div className="grid grid-cols-2 gap-1 mt-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-xs h-8"
                                onClick={() => hangupCall(line.id)}
                              >
                                Reject
                              </Button>
                              <Button 
                                size="sm" 
                                variant="default" 
                                className="text-xs h-8"
                                onClick={() => {
                                  // Using the API directly since answerCall not exposed
                                  const handleAnswer = async () => {
                                    try {
                                      await fetch(`/api/call-lines/${line.id}/answer`, {
                                        method: 'POST'
                                      });
                                    } catch (error) {
                                      console.error('Error answering call:', error);
                                    }
                                  };
                                  handleAnswer();
                                }}
                              >
                                Answer
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
              
              {/* Now Playing Card */}
              <Card className="border-zinc-800 bg-zinc-800/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center text-white">
                    <Music className="h-5 w-5 mr-2 text-orange-500" />
                    Now Playing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-zinc-900 p-3 rounded-md">
                    <div className="text-orange-400 text-sm font-medium">TRACK:</div>
                    <div className="text-lg font-medium">Summer Events Intro</div>
                    <div className="text-zinc-400 text-sm">Jingle • 0:30</div>
                    <Progress value={75} max={100} className="h-1 mt-2" />
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-zinc-400">Auto Segue: ON</span>
                    <span className="bg-orange-500/20 text-orange-300 text-xs px-2 py-1 rounded-full">
                      00:07 remaining
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Right column: Producer chat */}
            <div className="lg:col-span-7 space-y-5 mt-[5px]">
              <Card className="border-zinc-800 bg-zinc-800/50">
                <CardHeader>
                  <CardTitle className="text-white">Producer Chat</CardTitle>
                  <CardDescription className="text-zinc-300">
                    Send and receive messages from your producer
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[460px] rounded-md border border-zinc-700 bg-zinc-900 p-4">
                    {chatMessages.map((msg) => (
                      <div 
                        key={msg.id} 
                        className={`mb-3 p-3 rounded-md shadow-md ${
                          msg.senderRole === 'producer' 
                            ? 'bg-orange-950 border-2 border-orange-700 ml-6' 
                            : 'bg-zinc-900 border-2 border-blue-700 mr-6'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2 pb-1 border-b border-white/20">
                          <div className="font-bold text-base text-white" style={{ textShadow: '0px 0px 1px rgba(0,0,0,0.7)' }}>
                            {msg.senderRole === 'producer' ? 'Producer' : 'Me'}
                          </div>
                          <div className="text-sm font-semibold text-white" style={{ textShadow: '0px 0px 1px rgba(0,0,0,0.5)' }}>
                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                        <div className="text-base font-bold text-white" style={{ 
                          textShadow: '0px 0px 2px rgba(0,0,0,0.7)', 
                          letterSpacing: '0.02em',
                          lineHeight: '1.5'
                        }}>{msg.message}</div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </ScrollArea>
                  
                  <div className="flex mt-4 space-x-2">
                    <Input 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 bg-zinc-700 border-zinc-600 font-semibold text-white text-base h-12"
                      style={{ textShadow: '0px 0px 1px rgba(0,0,0,0.5)' }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') sendMessage();
                      }}
                    />
                    <Button 
                      onClick={sendMessage}
                      className="bg-orange-600 hover:bg-orange-700 h-12 px-5 font-bold text-white text-base"
                    >
                      Send
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Timer and BuzzerButton placed below chat container */}
              <div className="flex flex-col md:flex-row items-center justify-between mt-5 gap-4">
                {/* Countdown Timer - Height reduced by 30px */}
                <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 w-full md:w-1/2 max-w-md h-[120px] flex items-center">
                  <StandaloneTimer studio="A" variant="talent" />
                </div>
                
                {/* BuzzerButton - Sized to match timer */}
                <div className="w-full md:w-1/2 flex justify-center">
                  <div className="h-[120px] w-full max-w-md flex items-center justify-center bg-zinc-800 border border-zinc-700 rounded-lg p-3">
                    <BuzzerButton isProducer={false} studioId="A" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
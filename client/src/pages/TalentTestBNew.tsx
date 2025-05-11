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
  LogOut,
  List
} from 'lucide-react';
import BuzzerButton from '@/components/BuzzerButton';
// Import QCaller logo from attached assets
import QCallerLogo from '@assets/qcaller_logo_v4.png';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useVoIP } from '@/contexts/VoIPContext';
import { CallLine } from '@shared/schema';

export default function TalentTestBNew() {
  const role = 'talent';
  const studio = 'B';
  const [timerMinutes, setTimerMinutes] = useState(10);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Use real call lines data from VoIP context
  const { callLines: contextCallLines, hangupCall, holdCall, sendToAir, takeOffAir } = useVoIP();
  
  // Filter call lines for this studio
  const callLines = contextCallLines?.filter(line => line.studio === 'B') || [];
  
  // Chat messages
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      senderRole: 'producer',
      message: 'Welcome to Studio B! Your show starts in 15 minutes.',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      read: true
    },
    {
      id: 2,
      senderRole: 'talent',
      message: 'Thanks, I\'m ready to go!',
      timestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
      read: true
    },
    {
      id: 3,
      senderRole: 'producer',
      message: 'Your guest will be connecting via Line 3 shortly.',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      read: true
    }
  ]);

  // Playlist items
  const [playlistItems, setPlaylistItems] = useState([
    {
      id: 1,
      title: 'Interview with Jane Wilson',
      type: 'Live',
      duration: '10:00',
      status: 'Current'
    },
    {
      id: 2,
      title: 'News Update',
      type: 'Recording',
      duration: '3:45',
      status: 'Next'
    },
    {
      id: 3,
      title: 'Community Segment',
      type: 'Live',
      duration: '15:00',
      status: 'Upcoming'
    },
    {
      id: 4,
      title: 'Weather Report',
      type: 'Recording',
      duration: '2:30',
      status: 'Upcoming'
    }
  ]);
  
  // Handle timer countdown
  useEffect(() => {
    if (!timerRunning) return;
    
    const interval = setInterval(() => {
      if (timerSeconds > 0) {
        setTimerSeconds(timerSeconds - 1);
      } else if (timerMinutes > 0) {
        setTimerMinutes(timerMinutes - 1);
        setTimerSeconds(59);
      } else {
        setTimerRunning(false);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [timerMinutes, timerSeconds, timerRunning]);
  
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

  const formattedTime = (value: number): string => {
    return value < 10 ? `0${value}` : value.toString();
  };
  
  // Color theme for Studio B
  const theme = {
    primary: 'green',
    badge: 'bg-green-900/30 text-green-300 border-green-800',
    pulse: 'bg-green-400',
    highlight: 'bg-green-600',
    highlightHover: 'hover:bg-green-700',
    border: 'border-green-800',
  };
  
  return (
    <>
      {/* Fixed transparent header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-zinc-900/80 backdrop-blur-sm border-b border-zinc-800 shadow-lg">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Badge 
              variant="outline" 
              className="bg-green-500 text-white px-3 py-1.5"
            >
              Studio B
            </Badge>
          </div>
          <img 
            src={QCallerLogo} 
            alt="QCaller Studio" 
            className="h-8 w-auto mx-auto absolute left-1/2 transform -translate-x-1/2"
          />
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-zinc-300 px-2 py-1 rounded">
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </div>
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
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-zinc-100">Studio B Call Lines</h2>
                <Badge variant="outline" className={theme.badge}>
                  Talent View
                </Badge>
              </div>
              
              {/* Call Lines */}
              <Card className="border-zinc-800 bg-zinc-800/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Phone className="h-5 w-5 mr-2 text-green-500" />
                    Active Call Lines
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {callLines.map(line => (
                    <div 
                      key={line.id}
                      className={`p-3 border rounded-md min-h-[160px] ${
                        line.status === 'inactive' ? 'border-zinc-700 bg-zinc-900/50' :
                        line.status === 'ringing' ? 'border-yellow-500/40 bg-yellow-950/20' :
                        line.status === 'holding' ? 'border-orange-500/40 bg-orange-950/20' : 
                        'border-emerald-500/40 bg-emerald-950/20'
                      }`}
                    >
                      <div className="flex justify-between">
                        <div className="flex items-center">
                          {line.status === 'inactive' ? (
                            <Phone className="h-4 w-4 text-zinc-500 mr-2" />
                          ) : line.status === 'ringing' ? (
                            <Phone className="h-4 w-4 text-yellow-500 animate-pulse mr-2" />
                          ) : line.status === 'holding' ? (
                            <PhoneOff className="h-4 w-4 text-orange-500 mr-2" />
                          ) : (
                            <PhoneForwarded className="h-4 w-4 text-emerald-500 mr-2" />
                          )}
                          <span className="font-medium">Line {line.id}</span>
                        </div>
                        
                        <div className="flex space-x-1">
                          {line.status !== 'inactive' && (
                            <>
                              <Badge variant={line.status === 'holding' ? "outline" : "secondary"} className="text-xs">
                                {line.status === 'holding' ? 'On Hold' : line.status === 'ringing' ? 'Ringing' : 'Connected'}
                              </Badge>
                              
                              {line.status === 'on-air' && (
                                <Badge className="bg-red-600 text-white hover:bg-red-700 text-xs">
                                  On Air
                                </Badge>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      
                      {line.status !== 'inactive' && (
                        <div className="mt-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Caller:</span>
                            <span>{line.contact?.name || 'Unknown'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Number:</span>
                            <span>{line.phoneNumber || 'Unknown'}</span>
                          </div>
                        </div>
                      )}
                      
                      {(line.status === 'active' || line.status === 'connected') && (
                        <div className="grid grid-cols-2 gap-2 mt-3">
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
                        <div className="grid grid-cols-2 gap-2 mt-3">
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
                </CardContent>
              </Card>
              
              {/* Now Playing Card */}
              <Card className="border-zinc-800 bg-zinc-800/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Music className="h-5 w-5 mr-2 text-green-500" />
                    Now Playing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-zinc-900 p-3 rounded-md">
                    <div className="text-green-400 text-sm font-medium">TRACK:</div>
                    <div className="text-lg font-medium">Community Spotlight Intro</div>
                    <div className="text-zinc-400 text-sm">Jingle • 0:45</div>
                    <Progress value={75} max={100} className="h-1 mt-2" />
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-zinc-400">Auto Segue: ON</span>
                    <span className="bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded-full">
                      00:12 remaining
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Right column: Tabs for Playlists and Producer chat */}
            <div className="lg:col-span-7 space-y-5">
              <Tabs defaultValue="chat" className="border border-zinc-800 rounded-lg bg-zinc-800/50 p-0">
                <TabsList className="grid grid-cols-2 bg-zinc-900 rounded-t-md">
                  <TabsTrigger value="chat" className="rounded-none data-[state=active]:bg-green-900/20 data-[state=active]:text-green-300">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Producer Chat
                  </TabsTrigger>
                  <TabsTrigger value="playlist" className="rounded-none data-[state=active]:bg-green-900/20 data-[state=active]:text-green-300">
                    <List className="h-4 w-4 mr-2" />
                    Show Playlist
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="chat" className="p-4 space-y-4">
                  <ScrollArea className="h-[320px] rounded-md border border-zinc-700 bg-zinc-900 p-4">
                    {chatMessages.map((msg) => (
                      <div 
                        key={msg.id} 
                        className={`mb-3 p-2 rounded-md ${
                          msg.senderRole === 'producer' 
                            ? 'bg-green-950/30 border border-green-900/50 ml-6' 
                            : 'bg-zinc-800 border border-zinc-700 mr-6'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div className="font-medium text-sm text-green-400">
                            {msg.senderRole === 'producer' ? 'Producer' : 'Me'}
                          </div>
                          <div className="text-xs text-zinc-500">
                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                        <div className="text-sm">{msg.message}</div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </ScrollArea>
                  
                  <div className="flex mt-4 space-x-2">
                    <Input 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 bg-zinc-700 border-zinc-600"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') sendMessage();
                      }}
                    />
                    <Button 
                      onClick={sendMessage}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Send
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="playlist" className="p-4">
                  <div className="rounded-md border border-zinc-700 bg-zinc-900 overflow-hidden">
                    <div className="bg-zinc-800 p-2 sticky top-0">
                      <div className="grid grid-cols-12 gap-2 text-xs font-medium text-zinc-400">
                        <div className="col-span-5">Title</div>
                        <div className="col-span-3">Type</div>
                        <div className="col-span-2">Duration</div>
                        <div className="col-span-2">Status</div>
                      </div>
                    </div>
                    
                    <div className="space-y-1 p-2 max-h-[320px] overflow-y-auto">
                      {playlistItems.map((item) => (
                        <div 
                          key={item.id}
                          className={`grid grid-cols-12 gap-2 p-2 text-sm rounded ${
                            item.status === 'Current' 
                              ? 'bg-green-900/20 border border-green-900/50' 
                              : item.status === 'Next'
                                ? 'bg-zinc-800/80 border border-zinc-700' 
                                : 'bg-zinc-800/40 border border-zinc-700/50'
                          }`}
                        >
                          <div className="col-span-5 font-medium">{item.title}</div>
                          <div className="col-span-3">
                            <Badge variant="outline" className="text-xs">
                              {item.type}
                            </Badge>
                          </div>
                          <div className="col-span-2 text-xs text-zinc-400">{item.duration}</div>
                          <div className="col-span-2">
                            <Badge 
                              variant="outline" 
                              className={
                                item.status === 'Current' 
                                  ? 'bg-green-500/20 text-green-300 border-green-600' 
                                  : item.status === 'Next'
                                    ? 'bg-blue-500/20 text-blue-300 border-blue-600'
                                    : 'bg-zinc-500/20 text-zinc-300 border-zinc-600'
                              }
                            >
                              {item.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              {/* Timer and BuzzerButton placed below chat container */}
              <div className="flex flex-col md:flex-row items-center justify-between mt-5 gap-4">
                {/* Countdown Timer - Height reduced by 30px */}
                <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 w-full md:w-1/2 max-w-md h-[120px] flex items-center">
                  <div className="text-center w-full">
                    <h3 className="text-lg font-medium">Segment Timer</h3>
                    <div className="text-4xl font-mono font-bold">
                      {formattedTime(timerMinutes)}:{formattedTime(timerSeconds)}
                    </div>
                    <div className="text-sm text-zinc-400">
                      {timerRunning ? "Timer running" : "Timer paused"}
                    </div>
                  </div>
                </div>
                
                {/* BuzzerButton - Sized to match timer */}
                <div className="w-full md:w-1/2 flex justify-center">
                  <div className="h-[120px] w-full max-w-md flex items-center justify-center bg-zinc-800 border border-zinc-700 rounded-lg p-3">
                    <BuzzerButton isProducer={false} studioId="B" />
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
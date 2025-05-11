import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mic, Headphones, MessageCircle, Clock, Volume2, AlertCircle, Music, List, Phone, PhoneOff, PhoneForwarded } from 'lucide-react';
import BuzzerButton from '@/components/SocketBuzzer';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from "@/components/ui/badge";

/**
 * Enhanced test page for Talent Studio B
 * Includes buzzer functionality and a more comprehensive talent interface
 */
export default function TalentTestB() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [inputLevel, setInputLevel] = useState(0);
  const [outputLevel, setOutputLevel] = useState(0);
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { id: 1, sender: 'Producer', text: 'Welcome to Studio B!' },
    { id: 2, sender: 'Producer', text: 'Your show starts in 10 minutes.' },
  ]);
  const [timerMinutes, setTimerMinutes] = useState(10);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [playlistItems, setPlaylistItems] = useState([
    { id: 1, title: 'News Intro', duration: '0:30', type: 'Jingle', status: 'Next' },
    { id: 2, title: 'Summer Events Interview', duration: '5:45', type: 'Content', status: 'Upcoming' },
    { id: 3, title: 'Weather Update', duration: '2:15', type: 'Segment', status: 'Upcoming' },
    { id: 4, title: 'Top of Hour ID', duration: '0:10', type: 'Ident', status: 'Upcoming' },
    { id: 5, title: 'Call-In Segment', duration: '15:00', type: 'Content', status: 'Upcoming' },
  ]);
  
  // Phone line states
  const [callLines, setCallLines] = useState([
    { id: 1, status: 'ringing', caller: 'Robert Davis', phoneNumber: '555-2345', onHold: false, onAir: false },
    { id: 2, status: 'active', caller: 'Sarah Wilson', phoneNumber: '555-6789', onHold: false, onAir: true },
    { id: 3, status: 'inactive', caller: '', phoneNumber: '', onHold: false, onAir: false },
  ]);

  // Update current time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulate audio levels
  useEffect(() => {
    const simulateAudioLevels = () => {
      setInputLevel(Math.random() * 80);
      setOutputLevel(Math.random() * 70);
    };
    
    const interval = setInterval(simulateAudioLevels, 500);
    return () => clearInterval(interval);
  }, []);

  // Simulate countdown timer
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

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    setChatMessages([
      ...chatMessages,
      { id: chatMessages.length + 1, sender: 'Talent', text: message }
    ]);
    setMessage('');
    
    // Simulate producer response
    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        { id: prev.length + 1, sender: 'Producer', text: 'Got your message, thanks!' }
      ]);
    }, 2000);
  };

  const formattedTime = (value: number): string => {
    return value < 10 ? `0${value}` : value.toString();
  };
  
  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="bg-green-600 text-white p-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center">
            <Mic className="h-6 w-6 mr-2" />
            <h1 className="text-2xl font-bold">Studio B - Talent Dashboard</h1>
          </div>
          <div className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            <span className="text-lg font-mono">
              {currentTime.toLocaleTimeString()}
            </span>
          </div>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
          {/* Main Controls Column */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="bg-zinc-800 border-green-500 border">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2 text-green-500" />
                  Producer Alert System
                </CardTitle>
                <CardDescription>Use the buzzer to alert the producer</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <div className="w-full max-w-xs">
                  <BuzzerButton 
                    isProducer={false} 
                    studioId="B" 
                  />
                </div>
              </CardContent>
            </Card>
            
            <Tabs defaultValue="audio" className="w-full">
              <TabsList className="w-full bg-zinc-800">
                <TabsTrigger value="audio" className="flex-1">
                  <Headphones className="h-4 w-4 mr-2" />
                  Audio
                </TabsTrigger>
                <TabsTrigger value="chat" className="flex-1">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Producer Chat
                </TabsTrigger>
                <TabsTrigger value="playlist" className="flex-1">
                  <List className="h-4 w-4 mr-2" />
                  Playlist
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="audio" className="mt-0">
                <Card className="bg-zinc-800 border-green-500 border">
                  <CardHeader>
                    <CardTitle>Audio Monitoring</CardTitle>
                    <CardDescription>Monitor your microphone levels and headphone output</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Mic Input */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="flex items-center">
                          <Mic className="h-4 w-4 mr-2 text-green-500" />
                          Microphone Input
                        </span>
                        <span className="text-sm">{Math.round(inputLevel)} dB</span>
                      </div>
                      <Progress value={inputLevel} max={100} className="h-3" 
                        style={{
                          background: 'linear-gradient(to right, #22c55e, #eab308, #ef4444)',
                          ["data-progress-value" as any]: `${inputLevel}%`,
                        }} 
                      />
                      <div className="flex justify-between text-xs text-zinc-400">
                        <span>-60 dB</span>
                        <span>-20 dB</span>
                        <span>0 dB</span>
                      </div>
                    </div>
                    
                    {/* Headphone Output */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="flex items-center">
                          <Headphones className="h-4 w-4 mr-2 text-green-500" />
                          Headphone Output
                        </span>
                        <span className="text-sm">{Math.round(outputLevel)} dB</span>
                      </div>
                      <Progress value={outputLevel} max={100} className="h-3"
                        style={{
                          background: 'linear-gradient(to right, #22c55e, #eab308, #ef4444)',
                          ["data-progress-value" as any]: `${outputLevel}%`,
                        }}
                      />
                      <div className="flex justify-between text-xs text-zinc-400">
                        <span>-60 dB</span>
                        <span>-20 dB</span>
                        <span>0 dB</span>
                      </div>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    {/* Volume Controls */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium flex items-center">
                        <Volume2 className="h-4 w-4 mr-2 text-green-500" />
                        Headphone Volume
                      </h4>
                      <Slider defaultValue={[70]} max={100} step={1} className="w-full" />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="chat" className="mt-0">
                <Card className="bg-zinc-800 border-green-500 border">
                  <CardHeader>
                    <CardTitle>Chat with Producer</CardTitle>
                    <CardDescription>Send and receive messages from your producer</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-zinc-900 rounded-md p-4 h-64 overflow-y-auto mb-4">
                      {chatMessages.map((msg) => (
                        <div 
                          key={msg.id} 
                          className={`mb-3 p-2 rounded ${
                            msg.sender === 'Producer' 
                              ? 'bg-green-900/30 ml-4' 
                              : 'bg-zinc-800 mr-4'
                          }`}
                        >
                          <div className="font-bold text-sm text-green-300">
                            {msg.sender}
                          </div>
                          <div>{msg.text}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <Input 
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="bg-zinc-700"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSendMessage();
                        }}
                      />
                      <Button 
                        onClick={handleSendMessage}
                        variant="secondary"
                      >
                        Send
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="playlist" className="mt-0">
                <Card className="bg-zinc-800 border-green-500 border">
                  <CardHeader>
                    <CardTitle>Current Playlist</CardTitle>
                    <CardDescription>Upcoming content for your show</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border border-zinc-700 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-zinc-700">
                          <tr>
                            <th className="text-left py-2 px-3">Item</th>
                            <th className="text-left py-2 px-3">Type</th>
                            <th className="text-left py-2 px-3">Duration</th>
                            <th className="text-left py-2 px-3">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {playlistItems.map((item, index) => (
                            <tr 
                              key={item.id} 
                              className={`border-t border-zinc-700 ${
                                index === 0 ? 'bg-green-900/20' : ''
                              }`}
                            >
                              <td className="py-2 px-3">{item.title}</td>
                              <td className="py-2 px-3">{item.type}</td>
                              <td className="py-2 px-3">{item.duration}</td>
                              <td className="py-2 px-3">
                                <span 
                                  className={`px-2 py-1 rounded-full text-xs ${
                                    item.status === 'Next' 
                                      ? 'bg-green-500/20 text-green-300' 
                                      : 'bg-zinc-600/30 text-zinc-300'
                                  }`}
                                >
                                  {item.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Side Controls Column */}
          <div className="space-y-4">
            <Card className="bg-zinc-800 border-green-500 border">
              <CardHeader>
                <CardTitle>Countdown Timer</CardTitle>
                <CardDescription>Time remaining in current segment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-mono text-center py-4 font-bold">
                  {formattedTime(timerMinutes)}:{formattedTime(timerSeconds)}
                </div>
                <div className="flex space-x-2 mt-2">
                  <Button 
                    onClick={() => setTimerRunning(!timerRunning)}
                    variant="outline"
                    className="flex-1"
                  >
                    {timerRunning ? 'Pause' : 'Start'}
                  </Button>
                  <Button 
                    onClick={() => {
                      setTimerMinutes(10);
                      setTimerSeconds(0);
                      setTimerRunning(false);
                    }}
                    variant="destructive"
                    className="flex-1"
                  >
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-zinc-800 border-green-500 border">
              <CardHeader>
                <CardTitle>On-Air Status</CardTitle>
                <CardDescription>Current microphone status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <div className="bg-green-700 text-white text-xl font-bold py-3 px-6 rounded-md w-full text-center flex items-center justify-center space-x-2">
                    <div className="h-3 w-3 rounded-full bg-green-400 animate-pulse"></div>
                    <span>ON AIR</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-zinc-800 border-green-500 border">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Phone className="h-5 w-5 mr-2 text-green-500" />
                  Call Lines
                </CardTitle>
                <CardDescription>Live phone line status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {callLines.map((line) => (
                  <div 
                    key={line.id} 
                    className={`border rounded-md p-3 ${
                      line.status === 'inactive' 
                        ? 'border-gray-700 bg-zinc-900/50' 
                        : line.status === 'ringing' 
                          ? 'border-yellow-500/50 bg-yellow-900/20'
                          : 'border-green-500/50 bg-green-900/20'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        {line.status === 'inactive' ? (
                          <Phone className="h-4 w-4 text-gray-500 mr-2" />
                        ) : line.status === 'ringing' ? (
                          <Phone className="h-4 w-4 text-yellow-500 animate-pulse mr-2" />
                        ) : line.onHold ? (
                          <PhoneOff className="h-4 w-4 text-orange-500 mr-2" />
                        ) : (
                          <PhoneForwarded className="h-4 w-4 text-green-500 mr-2" />
                        )}
                        <span className="font-medium">Line {line.id}</span>
                      </div>
                      
                      <div className="flex space-x-1">
                        {line.status !== 'inactive' && (
                          <>
                            <Badge variant={line.onHold ? "outline" : "secondary"} className="text-xs">
                              {line.onHold ? 'On Hold' : 'Connected'}
                            </Badge>
                            
                            {line.onAir && (
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
                          <span>{line.caller}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Number:</span>
                          <span>{line.phoneNumber}</span>
                        </div>
                      </div>
                    )}
                    
                    {line.status === 'active' && (
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <Button size="sm" variant="outline" className="text-xs h-8">
                          {line.onHold ? 'Resume' : 'Hold'}
                        </Button>
                        <Button size="sm" variant={line.onAir ? "destructive" : "default"} className="text-xs h-8">
                          {line.onAir ? 'Off Air' : 'On Air'}
                        </Button>
                      </div>
                    )}
                    
                    {line.status === 'ringing' && (
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <Button size="sm" variant="outline" className="text-xs h-8">
                          Reject
                        </Button>
                        <Button size="sm" variant="default" className="text-xs h-8">
                          Answer
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
            
            <Card className="bg-zinc-800 border-green-500 border">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Music className="h-4 w-4 mr-2 text-green-500" />
                  Now Playing
                </CardTitle>
                <CardDescription>Current audio source</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-zinc-900 p-3 rounded-md">
                  <div className="text-green-400 text-sm font-medium">TRACK:</div>
                  <div className="text-lg font-medium">Summer Events Intro</div>
                  <div className="text-zinc-400 text-sm">Jingle • 0:30</div>
                  <Progress value={75} max={100} className="h-1 mt-2" />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">Auto Segue: ON</span>
                  <span className="bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded-full">
                    00:07 remaining
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <footer className="mt-4 text-center text-zinc-500 text-sm">
          QCaller Studio - Talent View (Studio B) - v1.0
        </footer>
      </div>
    </div>
  );
}
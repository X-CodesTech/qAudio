import React, { FC, useState, useEffect, useRef, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Radio, MessageSquare, Volume2, VolumeX, Wifi, Activity, Sliders, 
  Gauge, Headphones, Power, Save, RotateCcw, Play, Pause, Square, CheckCircle2, AlertCircle } from 'lucide-react';
import ChatWindow from '@/components/ChatWindow';
import ProfessionalMixer from '@/components/UpdatedProfessionalMixer';
import PlayoutStatusDisplay from '@/components/PlayoutStatusDisplay';
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useLocation } from 'wouter';
import { useAuth } from '../hooks/use-auth';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Types
type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

type AudioLevels = {
  left: number;
  right: number;
};

type CodecQuality = 'low' | 'medium' | 'high';

const RemoteStudioView: FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();
  
  // Connection state
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [codecQuality, setCodecQuality] = useState<CodecQuality>('medium');
  const [bitRate, setBitRate] = useState<number>(192);
  const [micActive, setMicActive] = useState(false);
  
  // Audio device selection
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedInputDevice, setSelectedInputDevice] = useState<string>('');
  const [selectedOutputDevice, setSelectedOutputDevice] = useState<string>('');
  
  // Studio settings
  const [studioId, setStudioId] = useState<string>("A");
  const [simulationActive, setSimulationActive] = useState(false);
  
  // Audio levels
  const [audioLevels, setAudioLevels] = useState<AudioLevels>({ left: 0, right: 0 });
  
  // Chat state
  const [messages, setMessages] = useState<any[]>([
    {
      id: 1,
      text: 'Welcome to RE-Studio. Connect to begin broadcasting.',
      sender: 'system',
      timestamp: new Date(),
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Program state
  const [programName, setProgramName] = useState('');
  const [remoteIp, setRemoteIp] = useState('');
  const [remotePort, setRemotePort] = useState('8000');
  const [latency, setLatency] = useState('100');
  const [cleanFeed, setCleanFeed] = useState(false);
  const [networkStats, setNetworkStats] = useState({
    ping: '43',
    jitter: '12',
    packetLoss: '0.1'
  });
  
  // Audio player state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioFileName, setAudioFileName] = useState('No file selected');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  
  // Audio level meters state
  const [studioAudioLevel, setStudioAudioLevel] = useState({ left: 0, right: 0 });
  const [pgmAudioLevel, setPgmAudioLevel] = useState({ left: 0, right: 0 });

  // Simulate audio levels when connected
  useEffect(() => {
    const simulateAudioLevels = () => {
      if (connectionStatus === 'connected' && micActive) {
        setAudioLevels({
          left: Math.min(Math.random() * 100 + 10, 100),
          right: Math.min(Math.random() * 100 + 10, 100),
        });
        
        // Simulate studio input audio levels
        setStudioAudioLevel({
          left: Math.min(Math.random() * 90 + 20, 100),
          right: Math.min(Math.random() * 90 + 20, 100),
        });
        
        // Simulate program (pgm) output audio levels
        setPgmAudioLevel({
          left: Math.min(Math.random() * 80 + 30, 100),
          right: Math.min(Math.random() * 80 + 30, 100),
        });
      } else {
        setAudioLevels({ left: 0, right: 0 });
        setStudioAudioLevel({ left: 0, right: 0 });
        setPgmAudioLevel({ left: 0, right: 0 });
      }
    };

    const interval = setInterval(simulateAudioLevels, 100);
    return () => clearInterval(interval);
  }, [connectionStatus, micActive]);

  // Connect to studio
  const connectToStudio = () => {
    console.log("Connecting to RE-Studio...");
    setConnectionStatus('connecting');
    
    // Simulate connection delay
    setTimeout(() => {
      console.log("Connected to RE-Studio successfully!");
      setConnectionStatus('connected');
      
      // Add a system message to chat
      const systemMessage = {
        id: Date.now(),
        text: 'You are now connected to the studio.',
        sender: 'system',
        timestamp: new Date(),
      };
      setMessages(prevMessages => [...prevMessages, systemMessage]);
    }, 2000);
  };

  // Disconnect from studio
  const disconnectFromStudio = () => {
    console.log("Disconnecting from RE-Studio...");
    setConnectionStatus('disconnected');
    setMicActive(false);
    
    // Add a system message to chat
    const systemMessage = {
      id: Date.now(),
      text: 'You have disconnected from the studio.',
      sender: 'system',
      timestamp: new Date(),
    };
    setMessages(prevMessages => [...prevMessages, systemMessage]);
  };
  
  // Handle logout
  const handleLogout = () => {
    // First disconnect if connected
    if (connectionStatus !== 'disconnected') {
      disconnectFromStudio();
    }
    
    // Then perform logout
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate('/auth');
      }
    });
  };
  
  // Get audio devices
  async function getAudioDevices() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      console.error("Enumeration of media devices is not supported by this browser");
      return { inputDevices: [], outputDevices: [] };
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      const audioOutputs = devices.filter(device => device.kind === 'audiooutput');
      
      return { 
        inputDevices: audioInputs,
        outputDevices: audioOutputs
      };
    } catch (error) {
      console.error("Error enumerating audio devices:", error);
      return { inputDevices: [], outputDevices: [] };
    }
  }
  
  // Scan for devices
  const scanForDevices = async () => {
    try {
      const { inputDevices, outputDevices } = await getAudioDevices();
      
      setAudioInputDevices(inputDevices);
      setAudioOutputDevices(outputDevices);
      
      // Set default devices if available and not already set
      if (inputDevices.length > 0 && !selectedInputDevice) {
        setSelectedInputDevice(inputDevices[0].deviceId);
      }
      
      if (outputDevices.length > 0 && !selectedOutputDevice) {
        setSelectedOutputDevice(outputDevices[0].deviceId);
      }
      
      // Show success toast with device count
      toast({
        title: "Devices Detected",
        description: `Found ${inputDevices.length} microphones and ${outputDevices.length} speakers`,
        variant: "default",
        duration: 3000
      });
    } catch (error) {
      console.error("Error scanning for audio devices:", error);
      toast({
        title: "Device Scan Failed",
        description: "Failed to detect audio devices. Please check permissions.",
        variant: "destructive",
        duration: 5000
      });
    }
  };
  
  // Scan for devices on component mount
  useEffect(() => {
    scanForDevices();
  }, []);
  
  // Handle codec quality change
  const handleCodecChange = async (value: CodecQuality) => {
    setCodecQuality(value);
    
    // Update bitrate based on selected quality
    switch(value) {
      case 'low':
        setBitRate(96);
        break;
      case 'medium':
        setBitRate(192);
        break;
      case 'high':
        setBitRate(320);
        break;
    }
    
    toast({
      title: "Codec Quality Updated",
      description: `Set to ${value === 'low' ? 'Voice Optimized (96kbps)' : 
                    value === 'medium' ? 'Music Optimized (192kbps)' : 
                    'Studio Quality (320kbps)'}`,
      variant: "default",
      duration: 2000
    });
  };
  
  // Send chat message
  const sendMessage = () => {
    if (!newMessage.trim()) return;
    
    const newMessageObj = {
      id: Date.now(),
      text: newMessage,
      sender: user?.username || 'Anonymous',
      timestamp: new Date(),
    };
    
    setMessages(prevMessages => [...prevMessages, newMessageObj]);
    setNewMessage('');
    
    // Scroll to bottom of chat
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };
  
  // Toggle microphone
  const toggleMicrophone = () => {
    if (connectionStatus === 'connected') {
      setMicActive(!micActive);
      
      toast({
        title: !micActive ? "Microphone Activated" : "Microphone Muted",
        description: !micActive ? "Your microphone is now live" : "Your microphone has been muted",
        variant: "default",
        duration: 2000
      });
    }
  };

  // Request microphone permission
  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      toast({
        title: "Microphone Access Granted",
        description: "Successfully accessed your microphone. You can now connect to the studio.",
        variant: "default",
        duration: 3000
      });
      
      // Stop the stream after getting permission
      setTimeout(() => {
        stream.getTracks().forEach(track => track.stop());
        scanForDevices();
      }, 500);
      
    } catch (error: any) {
      let errorMessage = "Could not access your microphone.";
      if (error.name === 'NotAllowedError') {
        errorMessage = "Microphone access was denied. Please allow microphone access in your browser settings.";
      } else if (error.name === 'NotFoundError') {
        errorMessage = "No microphone found. Please connect a microphone and try again.";
      }
      
      toast({
        title: "Microphone Access Error",
        description: errorMessage,
        variant: "destructive",
        duration: 5000
      });
    }
  };
  
  // Test network connection for the program
  const testNetworkConnection = () => {
    if (connectionStatus !== 'connected' || !remoteIp) {
      toast({
        title: "Connection Test Failed",
        description: "Please connect to the studio and enter a valid Remote IP address first.",
        variant: "destructive",
        duration: 3000
      });
      return;
    }
    
    // Simulate network test
    toast({
      title: "Testing Connection",
      description: `Testing connection to ${remoteIp}...`,
      variant: "default",
      duration: 2000
    });
    
    // Simulate changing network stats after test
    setTimeout(() => {
      // Generate new random stats
      const newPing = Math.floor(Math.random() * 30 + 20).toString();
      const newJitter = Math.floor(Math.random() * 15 + 5).toString();
      const newPacketLoss = (Math.random() * 0.5).toFixed(2);
      
      setNetworkStats({
        ping: newPing,
        jitter: newJitter,
        packetLoss: newPacketLoss
      });
      
      toast({
        title: "Connection Test Complete",
        description: `Ping: ${newPing}ms | Jitter: ${newJitter}ms | Loss: ${newPacketLoss}%`,
        variant: "default",
        duration: 4000
      });
    }, 2000);
  };
  
  // Save program settings
  const saveProgram = (e: FormEvent) => {
    e.preventDefault();
    
    if (!programName) {
      toast({
        title: "Validation Error",
        description: "Please enter a program name",
        variant: "destructive",
        duration: 3000
      });
      return;
    }
    
    if (!remoteIp) {
      toast({
        title: "Validation Error",
        description: "Please enter a remote IP address",
        variant: "destructive",
        duration: 3000
      });
      return;
    }
    
    // Simulated save
    toast({
      title: "Program Saved",
      description: `Program "${programName}" has been saved successfully`,
      variant: "default",
      duration: 3000
    });
  };
  
  // Audio player functions
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAudioFile(file);
      setAudioFileName(file.name);
      
      // Create a temporary URL for the audio file
      const audioElement = new Audio(URL.createObjectURL(file));
      
      // Get the duration once metadata is loaded
      audioElement.addEventListener('loadedmetadata', () => {
        setAudioDuration(audioElement.duration);
      });
      
      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = URL.createObjectURL(file);
        audioPlayerRef.current.load();
      }
      
      toast({
        title: "Audio File Loaded",
        description: `Loaded "${file.name}"`,
        variant: "default",
        duration: 2000
      });
    }
  };
  
  const playAudio = () => {
    if (audioPlayerRef.current && audioFile) {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    } else {
      toast({
        title: "No Audio File",
        description: "Please select an audio file first",
        variant: "destructive",
        duration: 2000
      });
    }
  };
  
  const pauseAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    }
  };
  
  const stopAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
      setProgress(0);
    }
  };
  
  const handleTimeUpdate = () => {
    if (audioPlayerRef.current) {
      setCurrentTime(audioPlayerRef.current.currentTime);
      setProgress((audioPlayerRef.current.currentTime / audioDuration) * 100);
    }
  };
  
  const toggleLooping = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.loop = !isLooping;
      setIsLooping(!isLooping);
    }
  };
  
  const ejectAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.src = '';
      setIsPlaying(false);
      setAudioFile(null);
      setAudioFileName('No file selected');
      setCurrentTime(0);
      setProgress(0);
      setAudioDuration(0);
      
      toast({
        title: "File Ejected",
        description: "Audio file has been ejected",
        variant: "default",
        duration: 2000
      });
    }
  };
  
  const seekAudio = (value: number[]) => {
    if (audioPlayerRef.current && audioDuration) {
      const seekTime = (value[0] / 100) * audioDuration;
      audioPlayerRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };
  
  // Format time from seconds to MM:SS
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  };

  return (
    <div className="container mx-auto p-4">
      {/* Header with studio name and connection status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-red-500" />
          <span className="text-xl font-bold text-white">RE-Studio 1</span>
          <Badge 
            variant={connectionStatus === 'connected' ? "default" : 
                   connectionStatus === 'connecting' ? "outline" : "destructive"}
            className={connectionStatus === 'connected' ? 'bg-green-600' : 
                      connectionStatus === 'connecting' ? 'bg-amber-600' : ''}
          >
            {connectionStatus === 'connected' ? (t('remoteStudio.connected') || "Connected") : 
             connectionStatus === 'connecting' ? (t('remoteStudio.connecting') || "Connecting...") : 
             (t('remoteStudio.disconnected') || "Disconnected")}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {connectionStatus === 'disconnected' ? (
            <Button 
              onClick={connectToStudio}
              className="bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              <Power className="mr-2 h-4 w-4" />
              Connect
            </Button>
          ) : (
            <Button 
              onClick={disconnectFromStudio} 
              variant="destructive"
              size="sm"
            >
              <Power className="mr-2 h-4 w-4" />
              Disconnect
            </Button>
          )}
          <Button 
            variant="outline"
            size="sm"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </div>
      
      {/* Main content with side-by-side mixer and chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left side - Mixer and controls */}
        <div className="lg:col-span-2 space-y-4">
          <Tabs defaultValue="mixer" className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg">
            <TabsList className="w-full bg-gradient-to-r from-zinc-900 to-zinc-800 p-1 border-b border-zinc-700/50">
              <TabsTrigger value="mixer" className="data-[state=active]:bg-red-900/30 data-[state=active]:text-red-50 text-zinc-200">
                <Activity className="h-4 w-4 mr-2" />
                Mixer
              </TabsTrigger>
              <TabsTrigger value="program" className="data-[state=active]:bg-red-900/30 data-[state=active]:text-red-50 text-zinc-200">
                <Radio className="h-4 w-4 mr-2" />
                Program
              </TabsTrigger>
              <TabsTrigger value="devices" className="data-[state=active]:bg-zinc-800/30 data-[state=active]:text-zinc-50 text-zinc-200">
                <Headphones className="h-4 w-4 mr-2" />
                Devices
              </TabsTrigger>
              <TabsTrigger value="connection" className="data-[state=active]:bg-zinc-800/30 data-[state=active]:text-zinc-50 text-zinc-200">
                <Wifi className="h-4 w-4 mr-2" />
                Connection
              </TabsTrigger>
            </TabsList>
            
            {/* MIXER TAB */}
            <TabsContent value="mixer" className="p-4 space-y-4">
              <ProfessionalMixer 
                connectionStatus={connectionStatus}
                externalAudioLevels={audioLevels}
                micActive={micActive}
                toggleMicrophone={toggleMicrophone}
              />
              
              {/* Playout Status */}
              <Card className="bg-gradient-to-br from-zinc-900 to-slate-900 border border-red-900/40 shadow-md shadow-red-900/10">
                <CardHeader className="bg-gradient-to-r from-red-950 to-zinc-900 py-2 px-3 border-b border-red-900/50">
                  <CardTitle className="flex items-center gap-2 text-sm text-red-100">
                    <Radio className="h-4 w-4 text-red-400" />
                    Studio Playout Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Player A */}
                    <div className="p-3 bg-zinc-900 rounded-lg border border-blue-900/20 shadow-inner shadow-blue-900/10">
                      <div className="text-sm font-semibold text-blue-200 mb-2">Player A</div>
                      <div className="text-xs text-zinc-400 mb-1">Now Playing:</div>
                      <div className="text-sm text-white font-medium">Summer Beats - Cool Jazz Mix</div>
                      <div className="flex justify-between items-center mt-2">
                        <div className="text-xs text-zinc-500">03:45 / 05:30</div>
                        <Badge className="bg-blue-600">ON AIR</Badge>
                      </div>
                    </div>
                    
                    {/* Player B */}
                    <div className="p-3 bg-zinc-900 rounded-lg border border-green-900/20 shadow-inner shadow-green-900/10">
                      <div className="text-sm font-semibold text-green-200 mb-2">Player B</div>
                      <div className="text-xs text-zinc-400 mb-1">Next Up:</div>
                      <div className="text-sm text-white font-medium">Advertising Block - Local News</div>
                      <div className="flex justify-between items-center mt-2">
                        <div className="text-xs text-zinc-500">00:00 / 02:15</div>
                        <Badge variant="outline" className="border-green-600 text-green-400">LOADED</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Audio Meters */}
              <Card className="bg-gradient-to-br from-zinc-900 to-slate-900 border border-red-900/40 shadow-md shadow-red-900/10">
                <CardHeader className="bg-gradient-to-r from-red-950 to-zinc-900 py-2 px-3 border-b border-red-900/50">
                  <CardTitle className="flex items-center gap-2 text-sm text-red-100">
                    <Activity className="h-4 w-4 text-red-400" />
                    Audio Levels
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {/* Studio Input Audio Level Meter */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <Label className="text-sm text-red-200">Studio Input</Label>
                      <div className="text-xs text-zinc-400">
                        {Math.round(studioAudioLevel.left)} | {Math.round(studioAudioLevel.right)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {/* Left Channel */}
                      <div className="h-4 bg-black/30 rounded-md overflow-hidden flex">
                        <div 
                          className={`h-full ${
                            studioAudioLevel.left > 90 ? 'bg-red-500' : 
                            studioAudioLevel.left > 75 ? 'bg-yellow-500' : 
                            'bg-green-500'
                          }`} 
                          style={{ width: `${studioAudioLevel.left}%` }}
                        />
                      </div>
                      {/* Right Channel */}
                      <div className="h-4 bg-black/30 rounded-md overflow-hidden flex">
                        <div 
                          className={`h-full ${
                            studioAudioLevel.right > 90 ? 'bg-red-500' : 
                            studioAudioLevel.right > 75 ? 'bg-yellow-500' : 
                            'bg-green-500'
                          }`} 
                          style={{ width: `${studioAudioLevel.right}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* PGM Output Audio Level Meter */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <Label className="text-sm text-red-200">PGM Output</Label>
                      <div className="text-xs text-zinc-400">
                        {Math.round(pgmAudioLevel.left)} | {Math.round(pgmAudioLevel.right)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {/* Left Channel */}
                      <div className="h-4 bg-black/30 rounded-md overflow-hidden flex">
                        <div 
                          className={`h-full ${
                            pgmAudioLevel.left > 90 ? 'bg-red-500' : 
                            pgmAudioLevel.left > 75 ? 'bg-yellow-500' : 
                            'bg-green-500'
                          }`} 
                          style={{ width: `${pgmAudioLevel.left}%` }}
                        />
                      </div>
                      {/* Right Channel */}
                      <div className="h-4 bg-black/30 rounded-md overflow-hidden flex">
                        <div 
                          className={`h-full ${
                            pgmAudioLevel.right > 90 ? 'bg-red-500' : 
                            pgmAudioLevel.right > 75 ? 'bg-yellow-500' : 
                            'bg-green-500'
                          }`} 
                          style={{ width: `${pgmAudioLevel.right}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* PROGRAM TAB */}
            <TabsContent value="program" className="p-4 space-y-4">
              <form onSubmit={saveProgram}>
                <Card className="bg-gradient-to-br from-zinc-900 to-slate-900 border border-red-900/40 shadow-md shadow-red-900/10">
                  <CardHeader className="bg-gradient-to-r from-red-950 to-zinc-900 py-2 px-3 border-b border-red-900/50">
                    <CardTitle className="flex items-center gap-2 text-sm text-red-100">
                      <Radio className="h-4 w-4 text-red-400" />
                      Program Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Program Name */}
                        <div className="space-y-2">
                          <Label htmlFor="program-name" className="text-sm text-red-200">Program Name</Label>
                          <input
                            id="program-name"
                            type="text"
                            placeholder="My Radio Show"
                            value={programName}
                            onChange={(e) => setProgramName(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white"
                          />
                        </div>
                        
                        {/* Remote IP */}
                        <div className="space-y-2">
                          <Label htmlFor="remote-ip" className="text-sm text-red-200">Remote IP</Label>
                          <input
                            id="remote-ip"
                            type="text"
                            placeholder="192.168.1.1"
                            value={remoteIp}
                            onChange={(e) => setRemoteIp(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white"
                          />
                        </div>
                        
                        {/* Remote Port */}
                        <div className="space-y-2">
                          <Label htmlFor="remote-port" className="text-sm text-red-200">Remote Port</Label>
                          <input
                            id="remote-port"
                            type="number"
                            placeholder="8000"
                            value={remotePort}
                            onChange={(e) => setRemotePort(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white"
                          />
                        </div>
                        
                        {/* Latency */}
                        <div className="space-y-2">
                          <Label htmlFor="latency" className="text-sm text-red-200">Latency (ms)</Label>
                          <input
                            id="latency"
                            type="number"
                            placeholder="100"
                            value={latency}
                            onChange={(e) => setLatency(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white"
                          />
                        </div>
                      </div>
                      
                      {/* Clean Feed Option */}
                      <div className="flex items-center space-x-2 pt-2">
                        <Checkbox 
                          id="cleanfeed" 
                          checked={cleanFeed}
                          onCheckedChange={(checked) => setCleanFeed(checked === true)}
                          className="border-zinc-700 bg-zinc-800 data-[state=checked]:bg-red-600"
                        />
                        <Label htmlFor="cleanfeed" className="text-sm text-red-200">Enable Clean Feed</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              
              {/* Network Analysis */}
              <Card className="bg-gradient-to-br from-zinc-900 to-slate-900 border border-red-900/40 shadow-md shadow-red-900/10">
                <CardHeader className="bg-gradient-to-r from-red-950 to-zinc-900 py-2 px-3 border-b border-red-900/50">
                  <CardTitle className="flex items-center gap-2 text-sm text-red-100">
                    <Activity className="h-4 w-4 text-red-400" />
                    Network Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Ping */}
                      <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800 shadow-inner">
                        <div className="text-xs text-zinc-400 mb-1">Ping</div>
                        <div className="text-lg font-semibold text-white">{networkStats.ping} ms</div>
                        <div className="mt-2 h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              parseInt(networkStats.ping) < 30 ? 'bg-green-500' : 
                              parseInt(networkStats.ping) < 60 ? 'bg-yellow-500' : 
                              'bg-red-500'
                            }`} 
                            style={{ width: `${Math.min(parseInt(networkStats.ping) / 2, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {/* Jitter */}
                      <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800 shadow-inner">
                        <div className="text-xs text-zinc-400 mb-1">Jitter</div>
                        <div className="text-lg font-semibold text-white">{networkStats.jitter} ms</div>
                        <div className="mt-2 h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              parseInt(networkStats.jitter) < 10 ? 'bg-green-500' : 
                              parseInt(networkStats.jitter) < 20 ? 'bg-yellow-500' : 
                              'bg-red-500'
                            }`} 
                            style={{ width: `${Math.min(parseInt(networkStats.jitter) * 3, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {/* Packet Loss */}
                      <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800 shadow-inner">
                        <div className="text-xs text-zinc-400 mb-1">Packet Loss</div>
                        <div className="text-lg font-semibold text-white">{networkStats.packetLoss}%</div>
                        <div className="mt-2 h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              parseFloat(networkStats.packetLoss) < 0.5 ? 'bg-green-500' : 
                              parseFloat(networkStats.packetLoss) < 2 ? 'bg-yellow-500' : 
                              'bg-red-500'
                            }`} 
                            style={{ width: `${Math.min(parseFloat(networkStats.packetLoss) * 20, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Connection Status with Remote IP */}
                    {remoteIp && (
                      <div className="p-3 bg-black/30 rounded-lg border border-zinc-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Wifi className={connectionStatus === 'connected' ? 'text-green-500' : 'text-red-500'} size={16} />
                            <span className="text-sm text-zinc-400">Remote connection:</span>
                            <span className="text-sm font-medium text-white">{remoteIp}</span>
                          </div>
                          <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'} className={connectionStatus === 'connected' ? 'bg-green-700' : ''}>
                            {connectionStatus === 'connected' ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    )}
                    
                    {/* Network Test Button */}
                    <div className="flex justify-end">
                      <Button 
                        type="button"
                        variant="outline"
                        className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
                        disabled={connectionStatus !== 'connected'}
                        onClick={testNetworkConnection}
                      >
                        <Activity className="mr-2 h-4 w-4" />
                        Test Connection
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Save Program */}
              <div className="flex justify-end space-x-3">
                <Button 
                  type="button"
                  variant="outline"
                  className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700"
                  onClick={() => {
                    setProgramName('');
                    setRemoteIp('');
                    setRemotePort('8000');
                    setLatency('100');
                    setCleanFeed(false);
                  }}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
                <Button 
                  type="submit"
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Program
                </Button>
              </div>
              </form>
            </TabsContent>
            
            {/* DEVICES TAB */}
            <TabsContent value="devices" className="p-4">
              <Card className="bg-gradient-to-br from-zinc-900 to-slate-900 border border-zinc-800/40 shadow-md">
                <CardHeader className="bg-gradient-to-r from-zinc-900 to-slate-950 py-2 px-3 border-b border-zinc-800/50">
                  <CardTitle className="flex items-center gap-2 text-sm text-zinc-100">
                    <Headphones className="h-4 w-4 text-zinc-400" />
                    Audio Devices
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-6">
                    <div className="flex w-full justify-between items-center">
                      <div className="font-bold text-white text-lg">Device Configuration</div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={requestMicrophonePermission}
                        >
                          Allow Mic
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => scanForDevices()}
                        >
                          Scan Devices
                        </Button>
                      </div>
                    </div>
                    
                    {/* Microphone Input Selection */}
                    <div className="space-y-2">
                      <Label className="text-sm text-zinc-200">Microphone Input</Label>
                      <Select
                        value={selectedInputDevice}
                        onValueChange={setSelectedInputDevice}
                        disabled={connectionStatus === 'connecting' || audioInputDevices.length === 0}
                      >
                        <SelectTrigger className="w-full bg-black/30 border-zinc-700">
                          <SelectValue placeholder="Select microphone" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                          {audioInputDevices.length > 0 ? (
                            audioInputDevices.map(device => (
                              <SelectItem key={device.deviceId} value={device.deviceId} className="text-white">
                                {device.label || `Microphone ${device.deviceId.slice(0, 5)}...`}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-device" disabled className="text-gray-400">
                              No microphones found
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      
                      <div className="text-xs text-gray-400 mt-1">
                        {audioInputDevices.length === 0 
                          ? "Please allow microphone access to view available devices" 
                          : `${audioInputDevices.length} microphone${audioInputDevices.length !== 1 ? 's' : ''} available`}
                      </div>
                    </div>
                    
                    {/* Speaker Output Selection */}
                    <div className="space-y-2">
                      <Label className="text-sm text-zinc-200">Speaker Output</Label>
                      <Select
                        value={selectedOutputDevice}
                        onValueChange={setSelectedOutputDevice}
                        disabled={connectionStatus === 'connecting' || audioOutputDevices.length === 0}
                      >
                        <SelectTrigger className="w-full bg-black/30 border-zinc-700">
                          <SelectValue placeholder="Select speakers" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                          {audioOutputDevices.length > 0 ? (
                            audioOutputDevices.map(device => (
                              <SelectItem key={device.deviceId} value={device.deviceId} className="text-white">
                                {device.label || `Speaker ${device.deviceId.slice(0, 5)}...`}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-device" disabled className="text-gray-400">
                              No speakers found
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      
                      <div className="text-xs text-gray-400 mt-1">
                        {audioOutputDevices.length === 0 
                          ? "Please allow audio access to view available devices" 
                          : `${audioOutputDevices.length} speaker${audioOutputDevices.length !== 1 ? 's' : ''} available`}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Program Status - Moved below audio player */}
              <Card className="bg-gradient-to-br from-zinc-900 to-slate-900 border border-red-900/40 shadow-md shadow-red-900/10 mt-4">
                <CardHeader className="bg-gradient-to-r from-red-950 to-zinc-900 py-2 px-3 border-b border-red-900/50">
                  <CardTitle className="flex items-center gap-2 text-sm text-red-100">
                    <Radio className="h-4 w-4 text-red-400" />
                    Current Program Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="p-3 bg-zinc-900 rounded-lg border border-red-900/20 shadow-inner">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`h-3 w-3 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                        <div className="text-sm font-semibold text-red-100">
                          {programName || 'No Program Loaded'}
                        </div>
                        <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'} className={connectionStatus === 'connected' ? 'bg-green-700 ml-auto' : 'ml-auto'}>
                          {connectionStatus === 'connected' ? 'ACTIVE' : 'INACTIVE'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <div>
                          <div className="text-xs text-zinc-400 mb-1">Connection:</div>
                          <div className="text-sm text-white font-medium flex items-center gap-1">
                            <Wifi className="h-3 w-3 text-blue-400" /> 
                            {remoteIp || 'Not configured'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-zinc-400 mb-1">Audio Quality:</div>
                          <div className="text-sm text-white font-medium flex items-center gap-1">
                            <Sliders className="h-3 w-3 text-purple-400" />
                            {codecQuality === 'high' ? 'Studio (320kbps)' : 
                             codecQuality === 'medium' ? 'Music (192kbps)' : 
                             'Voice (96kbps)'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-zinc-400 mb-1">Latency:</div>
                          <div className="text-sm text-white font-medium flex items-center gap-1">
                            <Activity className="h-3 w-3 text-amber-400" /> 
                            {latency || '100'} ms
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-zinc-400 mb-1">Clean Feed:</div>
                          <div className="text-sm text-white font-medium flex items-center gap-1">
                            <Mic className="h-3 w-3 text-green-400" /> 
                            {cleanFeed ? 'Enabled' : 'Disabled'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Playout Status Display - Players A and B */}
              <Card className="bg-gradient-to-br from-zinc-900 to-slate-900 border border-red-900/40 shadow-md shadow-red-900/10 mt-4">
                <CardHeader className="bg-gradient-to-r from-red-950 to-zinc-900 py-2 px-3 border-b border-red-900/50">
                  <CardTitle className="flex items-center justify-between text-sm text-red-100">
                    <div className="flex items-center gap-2">
                      <Radio className="h-4 w-4 text-red-400" />
                      Playout Status
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${simulationActive ? 'bg-green-600/30 text-green-400' : 'bg-zinc-800/30 text-zinc-400'}`}>
                        {simulationActive ? 
                          <><CheckCircle2 className="h-3 w-3" /> Simulation Active</> : 
                          <><AlertCircle className="h-3 w-3" /> Simulation Off</>
                        }
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className={`h-7 text-xs ${simulationActive ? 'border-red-700 text-red-400 hover:bg-red-900/20' : 'border-green-700 text-green-400 hover:bg-green-900/20'}`}
                        onClick={() => setSimulationActive(!simulationActive)}
                      >
                        {simulationActive ? 'Stop Simulation' : 'Start Simulation'}
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <PlayoutStatusDisplay studioId={studioId} simulationActive={simulationActive} />
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* CONNECTION TAB */}
            <TabsContent value="connection" className="p-4">
              <Card className="bg-gradient-to-br from-zinc-900 to-slate-900 border border-zinc-800/40 shadow-md">
                <CardHeader className="bg-gradient-to-r from-zinc-900 to-slate-950 py-2 px-3 border-b border-zinc-800/50">
                  <CardTitle className="flex items-center gap-2 text-sm text-zinc-100">
                    <Wifi className="h-4 w-4 text-zinc-400" />
                    Connection Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Wifi className={`h-6 w-6 ${connectionStatus === 'connected' ? 'text-green-500' : connectionStatus === 'connecting' ? 'text-yellow-500' : 'text-red-500'}`} />
                      <div>
                        <div className="font-bold text-white">Status</div>
                        <div className={`text-sm ${connectionStatus === 'connected' ? 'text-green-400' : connectionStatus === 'connecting' ? 'text-yellow-400' : 'text-red-400'}`}>
                          {connectionStatus === 'connected' ? "Connected" : 
                           connectionStatus === 'connecting' ? "Connecting..." : 
                           "Disconnected"}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Gauge className="h-6 w-6 text-blue-400" />
                        <div>
                          <div className="font-bold text-white">Opus Codec</div>
                          <div className="text-sm text-blue-300">
                            {connectionStatus === 'connected' 
                              ? `Active: ${bitRate} kbps - ${codecQuality === 'low' 
                                  ? 'Voice Optimized' 
                                  : codecQuality === 'medium' 
                                    ? 'Music Optimized' 
                                    : 'Studio Quality'}`
                              : "Inactive"}
                          </div>
                        </div>
                      </div>
                      
                      <div className="w-full max-w-[220px]">
                        <Select
                          value={codecQuality}
                          onValueChange={(value) => handleCodecChange(value as CodecQuality)}
                          disabled={connectionStatus === 'connecting'}
                        >
                          <SelectTrigger className="w-full bg-black/30 border-zinc-700">
                            <SelectValue placeholder="Select Quality" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                            <SelectItem value="low" className="text-white">Voice Optimized (96kbps)</SelectItem>
                            <SelectItem value="medium" className="text-white">Music Optimized (192kbps)</SelectItem>
                            <SelectItem value="high" className="text-white">Studio Quality (320kbps)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Right side - Chat */}
        <div>
          <Card className="bg-gradient-to-br from-zinc-900 to-slate-900 border border-red-900/40 shadow-md shadow-red-900/10 h-[480px] flex flex-col">
            <CardHeader className="bg-gradient-to-r from-red-950 to-zinc-900 py-2 px-3 border-b border-red-900/50">
              <CardTitle className="flex items-center gap-2 text-sm text-red-100">
                <MessageSquare className="h-4 w-4 text-red-400" />
                Studio Chat
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col">
              <div className="flex-1">
                <ChatWindow 
                  messages={messages}
                  newMessage={newMessage}
                  setNewMessage={setNewMessage}
                  sendMessage={sendMessage}
                  className="h-full" 
                />
              </div>
              
              {/* Updated ON AIR Indicator styled from UpdatedProfessionalMixer */}
              <div className="pt-3 border-t border-zinc-800">
                <div className="relative w-full">
                  <div 
                    className="w-full h-20 border-4 rounded-md flex items-center justify-center transition-all duration-300 border-red-600 bg-red-600 slow-blink"
                  >
                    <div className="text-white text-xl font-bold tracking-widest">
                      ON AIR
                    </div>
                  </div>
                  <div className="absolute -top-2 -left-2 w-3 h-3 rounded-full bg-black border border-gray-700"></div>
                  <div className="absolute -top-2 -right-2 w-3 h-3 rounded-full bg-black border border-gray-700"></div>
                  <div className="absolute -bottom-2 -left-2 w-3 h-3 rounded-full bg-black border border-gray-700"></div>
                  <div className="absolute -bottom-2 -right-2 w-3 h-3 rounded-full bg-black border border-gray-700"></div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Audio Player - Moved below ON AIR indicator */}
          <Card className="bg-gradient-to-br from-zinc-900 to-slate-900 border border-red-900/40 shadow-md shadow-red-900/10 mt-4">
            <CardHeader className="bg-gradient-to-r from-red-950 to-zinc-900 py-2 px-3 border-b border-red-900/50">
              <CardTitle className="flex items-center gap-2 text-sm text-red-100">
                <Volume2 className="h-4 w-4 text-red-400" />
                Audio Player
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2" style={{ height: 'calc(100% - 16px)' }}>
              <div className="flex flex-col space-y-4">
                {/* Hidden audio element */}
                <audio 
                  ref={audioPlayerRef} 
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={() => setIsPlaying(false)}
                  loop={isLooping}
                  className="hidden"
                />
                
                <div className="p-3 bg-zinc-900 rounded-lg border border-red-900/20 shadow-inner shadow-red-900/10">
                  <div className="flex flex-col gap-4">
                    <div className="flex-1">
                      <Label className="text-sm text-red-200 mb-2 block">Import Audio File</Label>
                      <div className="flex gap-2">
                        <input
                          type="file"
                          accept="audio/*"
                          className="hidden"
                          id="audio-file-upload"
                          onChange={handleFileChange}
                          disabled={connectionStatus !== 'connected'}
                        />
                        <label 
                          htmlFor="audio-file-upload" 
                          className={`flex-1 cursor-pointer px-4 py-2 rounded border border-zinc-700 bg-zinc-800 text-zinc-300 text-sm flex items-center justify-center ${connectionStatus !== 'connected' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-zinc-700'}`}
                        >
                          Choose audio file...
                        </label>
                        <Button
                          size="sm"
                          onClick={() => playAudio()}
                          disabled={!audioFile || connectionStatus !== 'connected'}
                          variant="outline"
                          className="text-xs border-zinc-700"
                        >
                          Play to Channel 2
                        </Button>
                      </div>
                    </div>
                    
                    {/* Audio track title and time */}
                    <div className="mt-2">
                      <div className="text-sm font-medium text-red-100 mb-1 truncate">
                        {audioFile ? audioFileName : 'No file selected'}
                      </div>
                      <div className="flex justify-between text-xs text-zinc-400 mb-2">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(audioDuration)}</span>
                      </div>
                      
                      {/* Progress bar */}
                      <Slider
                        value={[progress]}
                        onValueChange={seekAudio}
                        disabled={!audioFile}
                        className="mb-3"
                      />
                      
                      {/* Playback controls */}
                      <div className="flex justify-center gap-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className={`h-8 w-8 rounded-full ${isPlaying ? 'bg-red-800 border-red-700' : 'bg-zinc-800 border-zinc-700'}`}
                          disabled={!audioFile}
                          onClick={isPlaying ? pauseAudio : playAudio}
                        >
                          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 rounded-full bg-zinc-800 border-zinc-700"
                          disabled={!audioFile}
                          onClick={stopAudio}
                        >
                          <Square className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className={`h-8 w-8 rounded-full ${isLooping ? 'bg-green-800 border-green-700' : 'bg-zinc-800 border-zinc-700'}`}
                          disabled={!audioFile}
                          onClick={toggleLooping}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 rounded-full bg-zinc-800 border-zinc-700 hover:bg-red-900"
                          disabled={!audioFile}
                          onClick={ejectAudio}
                        >
                          <VolumeX className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Program Status card below the audio player */}
          <Card className="bg-gradient-to-br from-zinc-900 to-slate-900 border border-red-900/40 shadow-md shadow-red-900/10">
            <CardHeader className="bg-gradient-to-r from-red-950 to-zinc-900 py-2 px-3 border-b border-red-900/50">
              <CardTitle className="flex items-center gap-2 text-sm text-red-100">
                <Radio className="h-4 w-4 text-red-400" />
                Program Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2" style={{ height: 'calc(100% - 16px)' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-zinc-400">Program:</span>
                    <span className="text-sm font-medium text-red-100">{programName || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-zinc-400">Remote Connection:</span>
                    <Badge 
                      variant={connectionStatus === 'connected' ? "default" : 
                             connectionStatus === 'connecting' ? "outline" : "destructive"}
                      className={connectionStatus === 'connected' ? 'bg-green-600' : 
                                connectionStatus === 'connecting' ? 'bg-amber-600' : ''}
                    >
                      {connectionStatus === 'connected' ? "Connected" : 
                       connectionStatus === 'connecting' ? "Connecting..." : 
                       "Disconnected"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-zinc-400">Microphone:</span>
                    <Badge variant={micActive ? "default" : "outline"} className={micActive ? 'bg-green-600' : ''}>
                      {micActive ? "Live" : "Muted"}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-zinc-400">Network Quality:</span>
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-green-400 mr-1">Good</span>
                      <div className="flex gap-1">
                        <div className="w-1.5 h-4 bg-green-500 rounded-sm"></div>
                        <div className="w-1.5 h-4 bg-green-500 rounded-sm"></div>
                        <div className="w-1.5 h-4 bg-green-500 rounded-sm"></div>
                        <div className="w-1.5 h-4 bg-zinc-700 rounded-sm"></div>
                        <div className="w-1.5 h-4 bg-zinc-700 rounded-sm"></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-zinc-400">Ping:</span>
                    <span className="text-sm font-medium text-white">{networkStats.ping}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-zinc-400">Packet Loss:</span>
                    <span className="text-sm font-medium text-white">{networkStats.packetLoss}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RemoteStudioView;
import React, { useState } from 'react';
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { 
  Globe, 
  Rss, 
  Radio, 
  Server, 
  Music, 
  Sliders, 
  Waves, 
  Play, 
  Square, 
  RefreshCcw, 
  ArrowUpDown,
  Volume2,
  Headphones,
  AlertTriangle
} from "lucide-react";

// Audio level meter component for small visualization
const TinyAudioMeter: React.FC<{ level: number }> = ({ level }) => {
  const segments = 5;
  const filledSegments = Math.floor((level / 100) * segments);
  
  return (
    <div className="flex items-center gap-0.5 h-4">
      {Array.from({ length: segments }).map((_, i) => (
        <div 
          key={i} 
          className={`w-1 h-full rounded-sm ${
            i < filledSegments 
              ? i >= segments - 2 
                ? 'bg-red-500' 
                : i >= segments - 3 
                  ? 'bg-yellow-500' 
                  : 'bg-green-500'
              : 'bg-zinc-700'
          }`}
        ></div>
      ))}
    </div>
  );
};

// Main streaming component
const StreamingComponent: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('icecast');
  const [streamingEnabled, setStreamingEnabled] = useState(false);
  const [leftChannelLevel, setLeftChannelLevel] = useState(60);
  const [rightChannelLevel, setRightChannelLevel] = useState(65);
  const [alarmsActive, setAlarmsActive] = useState(false);
  
  // Function to toggle transmitter alarms
  // In a real implementation, this would be connected to the global state
  const handleToggleAlarms = () => {
    // Create a custom event to communicate with MAirlistStylePage
    const event = new CustomEvent('toggleTransmitterAlarms', {
      detail: { alarmsActive: !alarmsActive }
    });
    document.dispatchEvent(event);
    
    setAlarmsActive(!alarmsActive);
    
    toast({
      title: alarmsActive ? "Transmitter Alarms Cleared" : "Transmitter Alarms Triggered",
      description: alarmsActive ? "All transmitter alarms acknowledged" : "Simulating transmitter alarms for North Hill and South Bay",
      variant: alarmsActive ? "default" : "destructive"
    });
  };
  
  // Simulate audio level fluctuation
  React.useEffect(() => {
    if (streamingEnabled) {
      const interval = setInterval(() => {
        setLeftChannelLevel(Math.max(40, Math.min(90, leftChannelLevel + (Math.random() * 10 - 5))));
        setRightChannelLevel(Math.max(40, Math.min(90, rightChannelLevel + (Math.random() * 10 - 5))));
      }, 500);
      
      return () => clearInterval(interval);
    }
  }, [streamingEnabled, leftChannelLevel, rightChannelLevel]);
  
  return (
    <Card className="bg-zinc-900 border-zinc-800 h-[200px] flex flex-col">
      <CardHeader className="py-1 border-b border-zinc-800 flex-shrink-0">
        <CardTitle className="text-sm flex items-center">
          <Globe className="h-4 w-4 mr-2 text-blue-400" />
          Internet Streaming
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 flex-1 overflow-hidden">
        <Tabs defaultValue="icecast" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-zinc-800 w-full mb-2">
            <TabsTrigger value="icecast" className="flex-1 text-xs">
              <Rss className="h-3 w-3 mr-1" /> Icecast
            </TabsTrigger>
            <TabsTrigger value="shoutcast" className="flex-1 text-xs">
              <Radio className="h-3 w-3 mr-1" /> ShoutCast
            </TabsTrigger>
            <TabsTrigger value="server" className="flex-1 text-xs">
              <Server className="h-3 w-3 mr-1" /> Server
            </TabsTrigger>
            <TabsTrigger value="processing" className="flex-1 text-xs">
              <Sliders className="h-3 w-3 mr-1" /> Processing
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="icecast" className="mt-0">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="icecast-server" className="text-xs">Server URL:</Label>
                <Input 
                  id="icecast-server" 
                  placeholder="http://yourserver:8000/mount" 
                  className="max-w-[180px] h-7 text-xs bg-zinc-800"
                  defaultValue="https://stream.example.com:8000/live"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="icecast-password" className="text-xs">Password:</Label>
                <Input 
                  id="icecast-password" 
                  type="password" 
                  placeholder="Password" 
                  className="max-w-[180px] h-7 text-xs bg-zinc-800"
                  defaultValue="••••••••"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="streaming-bitrate" className="text-xs">Bitrate:</Label>
                <select 
                  id="streaming-bitrate" 
                  className="max-w-[180px] h-7 text-xs bg-zinc-800 border border-zinc-700 rounded-md px-2"
                  defaultValue="128"
                >
                  <option value="64">64 kbps</option>
                  <option value="96">96 kbps</option>
                  <option value="128">128 kbps</option>
                  <option value="192">192 kbps</option>
                  <option value="256">256 kbps</option>
                  <option value="320">320 kbps</option>
                </select>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="shoutcast" className="mt-0">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="shoutcast-server" className="text-xs">Server URL:</Label>
                <Input 
                  id="shoutcast-server" 
                  placeholder="http://yourserver:8000" 
                  className="max-w-[180px] h-7 text-xs bg-zinc-800"
                  defaultValue="http://stream.example.com:8000"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="shoutcast-password" className="text-xs">Password:</Label>
                <Input 
                  id="shoutcast-password" 
                  type="password" 
                  placeholder="Password" 
                  className="max-w-[180px] h-7 text-xs bg-zinc-800"
                  defaultValue="••••••••"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="stream-name" className="text-xs">Stream Name:</Label>
                <Input 
                  id="stream-name" 
                  placeholder="Stream name" 
                  className="max-w-[180px] h-7 text-xs bg-zinc-800"
                  defaultValue="QCaller Radio"
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="server" className="mt-0">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="streaming-format" className="text-xs">Format:</Label>
                <select 
                  id="streaming-format" 
                  className="max-w-[180px] h-7 text-xs bg-zinc-800 border border-zinc-700 rounded-md px-2"
                  defaultValue="mp3"
                >
                  <option value="mp3">MP3</option>
                  <option value="aac">AAC</option>
                  <option value="ogg">OGG Vorbis</option>
                  <option value="opus">Opus</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="streaming-channels" className="text-xs">Channels:</Label>
                <select 
                  id="streaming-channels" 
                  className="max-w-[180px] h-7 text-xs bg-zinc-800 border border-zinc-700 rounded-md px-2"
                  defaultValue="stereo"
                >
                  <option value="mono">Mono</option>
                  <option value="stereo">Stereo</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="streaming-public" className="text-xs">Public Directory:</Label>
                <div className="flex items-center h-7">
                  <Switch id="streaming-public" />
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="processing" className="mt-0">
            <div className="space-y-2">
              <div className="flex flex-col gap-1">
                <Label htmlFor="compression-slider" className="text-xs flex justify-between">
                  <span>Compression:</span>
                  <span className="text-zinc-400">4:1</span>
                </Label>
                <Slider defaultValue={[40]} max={100} step={1} id="compression-slider" className="h-2" />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="eq-slider" className="text-xs flex justify-between">
                  <span>Equalization:</span>
                  <span className="text-zinc-400">+3dB</span>
                </Label>
                <Slider defaultValue={[60]} max={100} step={1} id="eq-slider" className="h-2" />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="loudness-slider" className="text-xs flex justify-between">
                  <span>Loudness:</span>
                  <span className="text-zinc-400">-14 LUFS</span>
                </Label>
                <Slider defaultValue={[75]} max={100} step={1} id="loudness-slider" className="h-2" />
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Stream control and audio metering */}
        <div className="flex items-center justify-between mt-2 border-t border-zinc-800 pt-2">
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              className={`h-7 px-3 text-xs ${streamingEnabled ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
              onClick={() => setStreamingEnabled(!streamingEnabled)}
            >
              {streamingEnabled ? (
                <>
                  <Square className="h-3 w-3 mr-1" />
                  Stop Stream
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 mr-1" />
                  Start Stream
                </>
              )}
            </Button>
            <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
              <RefreshCcw className="h-3 w-3" />
            </Button>
          </div>
          
          {/* Audio level meters */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <TinyAudioMeter level={leftChannelLevel} />
              <Label className="text-[10px] text-zinc-400">L</Label>
            </div>
            <div className="flex flex-col items-center gap-1">
              <TinyAudioMeter level={rightChannelLevel} />
              <Label className="text-[10px] text-zinc-400">R</Label>
            </div>
            <Volume2 className="h-4 w-4 text-zinc-400" />
            
            {/* Test button for triggering transmitter alarms - MAKE PROMINENT */}
            <Button 
              size="sm" 
              variant={alarmsActive ? "destructive" : "default"}
              className={`h-7 px-3 text-xs ml-2 font-semibold ${
                alarmsActive 
                  ? 'animate-critical-blink border-white shadow-lg shadow-red-500/30' 
                  : 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg'
              }`}
              onClick={handleToggleAlarms}
              title={alarmsActive ? "Clear Transmitter Alarms" : "Test Transmitter Alarms"}
            >
              <AlertTriangle className={`h-4 w-4 mr-1.5 ${alarmsActive ? 'text-white animate-pulse' : 'text-white'}`} />
              <span className="uppercase tracking-wide">{alarmsActive ? 'CLEAR ALARMS' : 'TEST ALARMS'}</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StreamingComponent;
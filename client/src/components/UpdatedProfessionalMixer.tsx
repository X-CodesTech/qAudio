import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Mic, Volume2, Headphones, Play, Square } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfessionalMixerProps {
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  externalAudioLevels?: { left: number, right: number };
  micActive?: boolean;
  toggleMicrophone?: () => void;
}

interface DynamicsProcessor {
  id: 'compressor' | 'limiter' | 'eq' | 'deesser' | 'gate';
  active: boolean;
  title: string;
}

interface DynamicsSettings {
  compressor: {
    threshold: number;
    ratio: number;
    attack: number;
    release: number;
    makeupGain: number;
  };
  limiter: {
    threshold: number;
    release: number;
  };
  eq: {
    low: number;
    mid: number;
    high: number;
  };
  deesser: {
    frequency: number;
    threshold: number;
    ratio: number;
  };
  gate: {
    threshold: number;
    attack: number;
    release: number;
  };
}

export default function ProfessionalMixer({ 
  connectionStatus, 
  externalAudioLevels,
  micActive,
  toggleMicrophone 
}: ProfessionalMixerProps) {
  const { toast } = useToast();
  const [channel1Volume, setChannel1Volume] = useState(75);
  const [channel2Volume, setChannel2Volume] = useState(75);
  const [headphoneVolume, setHeadphoneVolume] = useState(75);
  const [channel1Muted, setChannel1Muted] = useState(false);
  const [channel2Muted, setChannel2Muted] = useState(false);
  const [audioLevels, setAudioLevels] = useState({ left: 0, right: 0 });
  const [headphoneBus, setHeadphoneBus] = useState(false);
  const [isProcessorDialogOpen, setIsProcessorDialogOpen] = useState(false);
  const [selectedProcessor, setSelectedProcessor] = useState<DynamicsProcessor['id'] | null>(null);
  const [dynamicsConfig, setDynamicsConfig] = useState<DynamicsProcessor[]>([
    { id: 'eq', active: false, title: 'EQ' },
    { id: 'compressor', active: false, title: 'Compressor' },
    { id: 'limiter', active: false, title: 'Limiter' },
    { id: 'deesser', active: false, title: 'De-esser' },
    { id: 'gate', active: false, title: 'Gate' },
  ]);
  
  const [dynamicsSettings, setDynamicsSettings] = useState<DynamicsSettings>({
    compressor: {
      threshold: -18,
      ratio: 4,
      attack: 10,
      release: 100,
      makeupGain: 0
    },
    limiter: {
      threshold: -3,
      release: 50,
    },
    eq: {
      low: 0,
      mid: 0,
      high: 0
    },
    deesser: {
      frequency: 6000,
      threshold: -20,
      ratio: 4
    },
    gate: {
      threshold: -40,
      attack: 1,
      release: 100
    }
  });
  
  const [autoMixEnabled, setAutoMixEnabled] = useState(false);
  const autoMixTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Function to toggle channel 1 mute state
  const toggleChannel1Mute = () => {
    setChannel1Muted(!channel1Muted);
  };
  
  // Function to toggle channel 2 mute state
  const toggleChannel2Mute = () => {
    setChannel2Muted(!channel2Muted);
  };
  
  // Function to toggle headphone bus
  const toggleHeadphoneBus = () => {
    setHeadphoneBus(!headphoneBus);
    toast({
      title: headphoneBus ? "Headphone disconnected" : "Headphone connected",
      description: headphoneBus ? "Audio no longer sent to headphones" : "Audio now routed to headphones",
    });
  };
  
  // Function to handle dynamics processor dialog
  const openDynamicsDialog = (processorId: DynamicsProcessor['id']) => {
    setSelectedProcessor(processorId);
    setIsProcessorDialogOpen(true);
  };
  
  // Function to close dynamics processor dialog
  const closeDynamicsDialog = () => {
    setIsProcessorDialogOpen(false);
    setSelectedProcessor(null);
  };
  
  // Function to toggle dynamics processor active state
  const toggleProcessorActive = (processorId: DynamicsProcessor['id']) => {
    setDynamicsConfig(prev => 
      prev.map(processor => 
        processor.id === processorId 
          ? { ...processor, active: !processor.active } 
          : processor
      )
    );
    
    toast({
      title: dynamicsConfig.find(p => p.id === processorId)?.active
        ? `${processorId.toUpperCase()} Disabled`
        : `${processorId.toUpperCase()} Enabled`,
      description: dynamicsConfig.find(p => p.id === processorId)?.active
        ? `${processorId} processing has been turned off`
        : `${processorId} processing is now active`,
    });
  };

  // Function to update audio levels (simulating VU meters)
  useEffect(() => {
    if (externalAudioLevels) {
      setAudioLevels(externalAudioLevels);
      
      // If AutoMix is enabled and there's significant audio on channel 1
      if (autoMixEnabled && externalAudioLevels.left > 20) {
        // Reduce channel 2 volume
        setChannel2Volume(10);
        
        // Clear any existing timeout
        if (autoMixTimeoutRef.current) {
          clearTimeout(autoMixTimeoutRef.current);
        }
        
        // Set timeout to restore channel 2 volume after 2 seconds of silence
        autoMixTimeoutRef.current = setTimeout(() => {
          setChannel2Volume(75);
        }, 2000);
      }
    } else {
      const interval = setInterval(() => {
        // Simulate audio peaks based on connection status and channel mute states
        const randomMultiplier = connectionStatus === 'connected' ? 1 : 0.2;
        const channel1Level = channel1Muted ? 0 : Math.random() * 80 * randomMultiplier;
        const channel2Level = channel2Muted ? 0 : Math.random() * 80 * randomMultiplier;
        
        setAudioLevels({
          left: channel1Level,
          right: channel2Level
        });
        
        // AutoMix feature - when channel 1 has significant audio, reduce channel 2 volume
        if (autoMixEnabled && channel1Level > 60) {
          setChannel2Volume(10);
          
          // Clear any existing timeout
          if (autoMixTimeoutRef.current) {
            clearTimeout(autoMixTimeoutRef.current);
          }
          
          // Set timeout to restore channel 2 volume after 1 second
          autoMixTimeoutRef.current = setTimeout(() => {
            setChannel2Volume(75);
          }, 1000);
        }
      }, 100);
      
      return () => clearInterval(interval);
    }
  }, [connectionStatus, channel1Muted, channel2Muted, externalAudioLevels, autoMixEnabled]);
  
  // Cleanup AutoMix timeout on unmount
  useEffect(() => {
    return () => {
      if (autoMixTimeoutRef.current) {
        clearTimeout(autoMixTimeoutRef.current);
      }
    };
  }, []);
  
  // Function to toggle AutoMix feature
  const toggleAutoMix = () => {
    setAutoMixEnabled(!autoMixEnabled);
    toast({
      title: autoMixEnabled ? "AutoMix Disabled" : "AutoMix Enabled",
      description: autoMixEnabled 
        ? "Manual control of both channels restored" 
        : "Channel 2 will automatically reduce volume when Channel 1 is active",
    });
  };

  // Calculate if any channel is active
  const isAnyChannelActive = !channel1Muted || !channel2Muted;
  
  return (
    <div className="w-full">
      <Card className="border-zinc-800 bg-black/30 rounded-md overflow-hidden">
        <div className="flex justify-between items-center py-1.5 px-3 bg-gradient-to-r from-red-950/80 to-black border-b border-red-900/30">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-red-300/80">AUDIO MIXER</h3>
            {/* ON AIR Indicator */}
            <div className="px-2 py-0.5 rounded-sm font-bold text-xs bg-red-600 text-white slow-blink">
              ON AIR
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className={`h-7 text-xs rounded-sm ${
              autoMixEnabled
                ? "bg-red-900/50 hover:bg-red-900/80 text-red-100 border-red-800 animate-pulse"
                : "bg-zinc-900/60 hover:bg-zinc-800/60 text-zinc-400 border-zinc-800/60"
            }`}
            onClick={toggleAutoMix}
          >
            AUTO MIX
          </Button>
        </div>
        
        <CardContent className="p-6 pt-4 pb-0 grid grid-cols-1 md:grid-cols-2 gap-4" style={{ height: 'calc(100% - 18px)' }}>
          {/* Channel 1 (Mic) */}
          <div className="border border-zinc-800/50 rounded-sm bg-gradient-to-b from-zinc-900/30 to-black p-2 flex flex-col">
            <div className="text-xs font-semibold text-red-300/80 bg-gradient-to-r from-red-950/80 to-black border-b border-red-900/30 py-1.5 px-2 rounded-t-sm flex justify-between items-center">
              <span>CHANNEL 1 (MIC)</span>
              <Button 
                size="sm" 
                variant="outline" 
                className={`h-7 rounded-sm px-2 py-0 ${headphoneBus ? 'bg-amber-900/60 hover:bg-amber-900/80 text-amber-100 border-amber-800' : 'bg-zinc-900/60 hover:bg-zinc-800/60 text-zinc-400 border-zinc-800/60'}`}
                onClick={toggleHeadphoneBus}
              >
                <Headphones className="h-4 w-4 mr-1" />
                <span className="text-xs">PFL</span>
              </Button>
            </div>
            
            <div className="flex mt-3 mb-4 items-center">
              {/* Volume Controls */}
              <div className="flex flex-col items-center space-y-1 px-4">
                <Button 
                  variant="outline"
                  size="icon"
                  className={`h-8 w-8 rounded-sm ${!channel1Muted ? 'bg-red-900 hover:bg-red-800 text-white border border-red-700' : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800'}`}
                  onClick={toggleChannel1Mute}
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
                
                <Button 
                  variant="outline"
                  size="icon"
                  className={`h-8 w-8 rounded-sm ${micActive ? 'bg-red-900 hover:bg-red-800 text-white border border-red-700 animate-pulse' : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800'}`}
                  onClick={toggleMicrophone}
                >
                  <Mic className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Vertical Fader and Level Meter */}
              <div className="flex items-end justify-center space-x-2 flex-1 relative">
                {/* Level Meter */}
                <div className="w-7 h-[200px] relative bg-zinc-900/60 rounded-sm overflow-hidden border border-zinc-800/70" style={{ marginLeft: "-30px" }}>
                  <div 
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-500 via-yellow-500 to-red-500 transition-all duration-75"
                    style={{ height: `${Math.min(100, audioLevels.left * 1.25)}%` }}
                  />
                  
                  {/* Meter scale markers */}
                  <div className="absolute inset-0 flex flex-col justify-between px-1 py-1 pointer-events-none">
                    <div className="h-[1px] w-4 bg-red-200/30"></div>
                    <div className="h-[1px] w-3 bg-red-200/30"></div>
                    <div className="h-[1px] w-4 bg-red-200/30"></div>
                    <div className="h-[1px] w-3 bg-red-200/30"></div>
                    <div className="h-[1px] w-4 bg-red-200/30"></div>
                    <div className="h-[1px] w-3 bg-red-200/30"></div>
                    <div className="h-[1px] w-4 bg-red-200/30"></div>
                    <div className="h-[1px] w-3 bg-red-200/30"></div>
                    <div className="h-[1px] w-4 bg-red-200/30"></div>
                    <div className="h-[1px] w-3 bg-red-200/30"></div>
                  </div>
                </div>
                
                {/* Vertical Fader */}
                <div className="h-[200px] flex items-center">
                  <Slider
                    value={[channel1Volume]}
                    max={100}
                    step={1}
                    orientation="vertical"
                    className="h-full"
                    trackClassName="bg-gradient-to-t from-zinc-800 to-zinc-700 w-[6px]"
                    thumbClassName="h-5 w-12 bg-gradient-to-b from-zinc-300 to-zinc-400 border border-zinc-600 rounded-sm focus:ring-1 focus:ring-zinc-400"
                    onValueChange={(value) => setChannel1Volume(value[0])}
                  />
                </div>
              </div>
            </div>
            
            {/* ON/OFF Button */}
            <div className="flex justify-center mt-1 mb-3">
              <Button 
                variant="outline"
                className={`h-10 min-w-[120px] rounded-sm font-medium ${
                  !channel1Muted 
                    ? 'bg-red-900 hover:bg-red-800 text-white border border-red-700' 
                    : 'bg-gradient-to-b from-zinc-900 to-black hover:from-zinc-800 hover:to-zinc-900 text-zinc-400 border border-zinc-800'
                }`}
                onClick={toggleChannel1Mute}
              >
                {!channel1Muted ? 'ON' : 'OFF'}
              </Button>
            </div>
            
            <div className="flex flex-col -mt-[13px]">
              {/* Dynamics Section Label */}
              <div className="text-xs font-semibold text-red-300/80 bg-gradient-to-r from-red-950/80 to-black border-b border-red-900/30 py-1.5 px-2 mb-2 rounded-t-sm">DYNAMICS</div>
              
              {/* Dynamics Processor Buttons in Grid Layout - Centralized with increased width */}
              <div className="flex justify-center">
                <div className="flex gap-1 mx-auto" style={{ width: 'calc(100% + 50px)' }}>
                  {/* EQ */}
                  <Button 
                    variant="outline" 
                    size="sm"
                    className={`h-7 w-12 flex items-center justify-center p-1 rounded-sm ${
                      dynamicsConfig.find(p => p.id === 'eq')?.active 
                        ? 'bg-green-900 hover:bg-green-800 text-white border border-green-700 shadow-sm' 
                        : 'bg-gradient-to-b from-zinc-900 to-black hover:from-zinc-800 hover:to-zinc-900 text-zinc-400 border border-zinc-800'
                    }`}
                    onClick={() => openDynamicsDialog('eq')}
                  >
                    <span className="text-[10px] font-medium uppercase tracking-wide">EQ</span>
                  </Button>
                  
                  {/* Compressor */}
                  <Button 
                    variant="outline"
                    size="sm" 
                    className={`h-7 w-12 flex items-center justify-center p-1 rounded-sm ${
                      dynamicsConfig.find(p => p.id === 'compressor')?.active 
                        ? 'bg-green-900 hover:bg-green-800 text-white border border-green-700 shadow-sm' 
                        : 'bg-gradient-to-b from-zinc-900 to-black hover:from-zinc-800 hover:to-zinc-900 text-zinc-400 border border-zinc-800'
                    }`}
                    onClick={() => openDynamicsDialog('compressor')}
                  >
                    <span className="text-[10px] font-medium uppercase tracking-wide">COMP</span>
                  </Button>
                  
                  {/* Limiter */}
                  <Button 
                    variant="outline"
                    size="sm" 
                    className={`h-7 w-12 flex items-center justify-center p-1 rounded-sm ${
                      dynamicsConfig.find(p => p.id === 'limiter')?.active 
                        ? 'bg-green-900 hover:bg-green-800 text-white border border-green-700 shadow-sm' 
                        : 'bg-gradient-to-b from-zinc-900 to-black hover:from-zinc-800 hover:to-zinc-900 text-zinc-400 border border-zinc-800'
                    }`}
                    onClick={() => openDynamicsDialog('limiter')}
                  >
                    <span className="text-[10px] font-medium uppercase tracking-wide">LIMIT</span>
                  </Button>
                  
                  {/* De-esser */}
                  <Button 
                    variant="outline"
                    size="sm" 
                    className={`h-7 w-12 flex items-center justify-center p-1 rounded-sm ${
                      dynamicsConfig.find(p => p.id === 'deesser')?.active 
                        ? 'bg-green-900 hover:bg-green-800 text-white border border-green-700 shadow-sm' 
                        : 'bg-gradient-to-b from-zinc-900 to-black hover:from-zinc-800 hover:to-zinc-900 text-zinc-400 border border-zinc-800'
                    }`}
                    onClick={() => openDynamicsDialog('deesser')}
                  >
                    <span className="text-[10px] font-medium uppercase tracking-wide">DE-ESS</span>
                  </Button>
                  
                  {/* Gate */}
                  <Button 
                    variant="outline"
                    size="sm" 
                    className={`h-7 w-12 flex items-center justify-center p-1 rounded-sm ${
                      dynamicsConfig.find(p => p.id === 'gate')?.active 
                        ? 'bg-green-900 hover:bg-green-800 text-white border border-green-700 shadow-sm' 
                        : 'bg-gradient-to-b from-zinc-900 to-black hover:from-zinc-800 hover:to-zinc-900 text-zinc-400 border border-zinc-800'
                    }`}
                    onClick={() => openDynamicsDialog('gate')}
                  >
                    <span className="text-[10px] font-medium uppercase tracking-wide">GATE</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Channel 2 (Line) */}
          <div className="border border-zinc-800/50 rounded-sm bg-gradient-to-b from-zinc-900/30 to-black p-2 flex flex-col">
            <div className="text-xs font-semibold text-red-300/80 bg-gradient-to-r from-red-950/80 to-black border-b border-red-900/30 py-1.5 px-2 rounded-t-sm flex justify-between items-center">
              <span>CHANNEL 2 (LINE)</span>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-7 rounded-sm px-2 py-0 bg-zinc-900/60 hover:bg-zinc-800/60 text-zinc-400 border-zinc-800/60"
              >
                <Headphones className="h-4 w-4 mr-1" />
                <span className="text-xs">PFL</span>
              </Button>
            </div>
            
            <div className="flex mt-3 mb-4 items-center">
              {/* Volume Controls */}
              <div className="flex flex-col items-center space-y-1 px-4">
                <Button 
                  variant="outline"
                  size="icon"
                  className={`h-8 w-8 rounded-sm ${!channel2Muted ? 'bg-red-900 hover:bg-red-800 text-white border border-red-700' : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800'}`}
                  onClick={toggleChannel2Mute}
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
                
                <Button 
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-sm bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800"
                >
                  <Play className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Vertical Fader and Level Meter */}
              <div className="flex items-end justify-center space-x-2 flex-1 relative">
                {/* Stereo Level Meters */}
                <div className="flex space-x-1" style={{ marginLeft: "-30px" }}>
                  {/* Left Channel */}
                  <div className="w-3.5 h-[200px] relative bg-zinc-900/60 rounded-sm overflow-hidden border border-zinc-800/70">
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-500 via-yellow-500 to-red-500 transition-all duration-75"
                      style={{ height: `${Math.min(100, audioLevels.left * 1.25)}%` }}
                    />
                    
                    {/* Meter scale markers */}
                    <div className="absolute inset-0 flex flex-col justify-between px-0.5 py-1 pointer-events-none">
                      <div className="h-[1px] w-2 bg-red-200/30"></div>
                      <div className="h-[1px] w-1.5 bg-red-200/30"></div>
                      <div className="h-[1px] w-2 bg-red-200/30"></div>
                      <div className="h-[1px] w-1.5 bg-red-200/30"></div>
                      <div className="h-[1px] w-2 bg-red-200/30"></div>
                      <div className="h-[1px] w-1.5 bg-red-200/30"></div>
                      <div className="h-[1px] w-2 bg-red-200/30"></div>
                      <div className="h-[1px] w-1.5 bg-red-200/30"></div>
                      <div className="h-[1px] w-2 bg-red-200/30"></div>
                      <div className="h-[1px] w-1.5 bg-red-200/30"></div>
                    </div>
                  </div>
                  
                  {/* Right Channel */}
                  <div className="w-3.5 h-[200px] relative bg-zinc-900/60 rounded-sm overflow-hidden border border-zinc-800/70">
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-500 via-yellow-500 to-red-500 transition-all duration-75"
                      style={{ height: `${Math.min(100, audioLevels.right * 1.25)}%` }}
                    />
                    
                    {/* Meter scale markers */}
                    <div className="absolute inset-0 flex flex-col justify-between px-0.5 py-1 pointer-events-none">
                      <div className="h-[1px] w-2 bg-red-200/30"></div>
                      <div className="h-[1px] w-1.5 bg-red-200/30"></div>
                      <div className="h-[1px] w-2 bg-red-200/30"></div>
                      <div className="h-[1px] w-1.5 bg-red-200/30"></div>
                      <div className="h-[1px] w-2 bg-red-200/30"></div>
                      <div className="h-[1px] w-1.5 bg-red-200/30"></div>
                      <div className="h-[1px] w-2 bg-red-200/30"></div>
                      <div className="h-[1px] w-1.5 bg-red-200/30"></div>
                      <div className="h-[1px] w-2 bg-red-200/30"></div>
                      <div className="h-[1px] w-1.5 bg-red-200/30"></div>
                    </div>
                  </div>
                </div>
                
                {/* Vertical Fader */}
                <div className="h-[200px] flex items-center">
                  <Slider
                    value={[channel2Volume]}
                    max={100}
                    step={1}
                    orientation="vertical"
                    className="h-full"
                    trackClassName="bg-gradient-to-t from-zinc-800 to-zinc-700 w-[6px]"
                    thumbClassName="h-5 w-12 bg-gradient-to-b from-zinc-300 to-zinc-400 border border-zinc-600 rounded-sm focus:ring-1 focus:ring-zinc-400"
                    onValueChange={(value) => setChannel2Volume(value[0])}
                  />
                </div>
              </div>
            </div>
            
            {/* ON/OFF Button */}
            <div className="flex justify-center mt-1 mb-3">
              <Button 
                variant="outline"
                className={`h-10 min-w-[120px] rounded-sm font-medium ${
                  !channel2Muted 
                    ? 'bg-red-900 hover:bg-red-800 text-white border border-red-700' 
                    : 'bg-gradient-to-b from-zinc-900 to-black hover:from-zinc-800 hover:to-zinc-900 text-zinc-400 border border-zinc-800'
                }`}
                onClick={toggleChannel2Mute}
              >
                {!channel2Muted ? 'ON' : 'OFF'}
              </Button>
            </div>
            
            <div className="flex flex-col -mt-[13px]">
              {/* Dynamics Section Label */}
              <div className="text-xs font-semibold text-red-300/80 bg-gradient-to-r from-red-950/80 to-black border-b border-red-900/30 py-1.5 px-2 mb-2 rounded-t-sm">DYNAMICS</div>
              
              {/* Dynamics Processor Buttons in Grid Layout - Centralized with increased width */}
              <div className="flex justify-center">
                <div className="flex gap-1 mx-auto" style={{ width: 'calc(100% + 50px)' }}>
                  {/* EQ */}
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="h-7 w-12 flex items-center justify-center p-1 rounded-sm bg-gradient-to-b from-zinc-900 to-black hover:from-zinc-800 hover:to-zinc-900 text-zinc-400 border border-zinc-800"
                  >
                    <span className="text-[10px] font-medium uppercase tracking-wide">EQ</span>
                  </Button>
                  
                  {/* Compressor */}
                  <Button 
                    variant="outline"
                    size="sm" 
                    className="h-7 w-12 flex items-center justify-center p-1 rounded-sm bg-gradient-to-b from-zinc-900 to-black hover:from-zinc-800 hover:to-zinc-900 text-zinc-400 border border-zinc-800"
                  >
                    <span className="text-[10px] font-medium uppercase tracking-wide">COMP</span>
                  </Button>
                  
                  {/* Limiter */}
                  <Button 
                    variant="outline"
                    size="sm" 
                    className="h-7 w-12 flex items-center justify-center p-1 rounded-sm bg-gradient-to-b from-zinc-900 to-black hover:from-zinc-800 hover:to-zinc-900 text-zinc-400 border border-zinc-800"
                  >
                    <span className="text-[10px] font-medium uppercase tracking-wide">LIMIT</span>
                  </Button>
                  
                  {/* De-esser */}
                  <Button 
                    variant="outline"
                    size="sm" 
                    className="h-7 w-12 flex items-center justify-center p-1 rounded-sm bg-gradient-to-b from-zinc-900 to-black hover:from-zinc-800 hover:to-zinc-900 text-zinc-400 border border-zinc-800"
                  >
                    <span className="text-[10px] font-medium uppercase tracking-wide">DE-ESS</span>
                  </Button>
                  
                  {/* Gate */}
                  <Button 
                    variant="outline"
                    size="sm" 
                    className="h-7 w-12 flex items-center justify-center p-1 rounded-sm bg-gradient-to-b from-zinc-900 to-black hover:from-zinc-800 hover:to-zinc-900 text-zinc-400 border border-zinc-800"
                  >
                    <span className="text-[10px] font-medium uppercase tracking-wide">GATE</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Dynamics Processor Dialog */}
      <Dialog open={isProcessorDialogOpen} onOpenChange={setIsProcessorDialogOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-200 max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedProcessor && dynamicsConfig.find(p => p.id === selectedProcessor)?.title} Settings
            </DialogTitle>
          </DialogHeader>
          
          {selectedProcessor === 'compressor' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="threshold">Threshold ({dynamicsSettings.compressor.threshold} dB)</Label>
                <Slider 
                  id="threshold"
                  min={-60}
                  max={0}
                  step={1}
                  value={[dynamicsSettings.compressor.threshold]}
                  onValueChange={(value) => setDynamicsSettings(prev => ({...prev, compressor: {...prev.compressor, threshold: value[0]}}))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ratio">Ratio ({dynamicsSettings.compressor.ratio}:1)</Label>
                <Slider 
                  id="ratio"
                  min={1}
                  max={20}
                  step={0.5}
                  value={[dynamicsSettings.compressor.ratio]}
                  onValueChange={(value) => setDynamicsSettings(prev => ({...prev, compressor: {...prev.compressor, ratio: value[0]}}))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="attack">Attack ({dynamicsSettings.compressor.attack} ms)</Label>
                <Slider 
                  id="attack"
                  min={0.1}
                  max={100}
                  step={0.1}
                  value={[dynamicsSettings.compressor.attack]}
                  onValueChange={(value) => setDynamicsSettings(prev => ({...prev, compressor: {...prev.compressor, attack: value[0]}}))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="release">Release ({dynamicsSettings.compressor.release} ms)</Label>
                <Slider 
                  id="release"
                  min={10}
                  max={2000}
                  step={10}
                  value={[dynamicsSettings.compressor.release]}
                  onValueChange={(value) => setDynamicsSettings(prev => ({...prev, compressor: {...prev.compressor, release: value[0]}}))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="makeupGain">Makeup Gain ({dynamicsSettings.compressor.makeupGain} dB)</Label>
                <Slider 
                  id="makeupGain"
                  min={0}
                  max={24}
                  step={0.5}
                  value={[dynamicsSettings.compressor.makeupGain]}
                  onValueChange={(value) => setDynamicsSettings(prev => ({...prev, compressor: {...prev.compressor, makeupGain: value[0]}}))}
                />
              </div>
            </div>
          )}
          
          {selectedProcessor === 'eq' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="low">Low ({dynamicsSettings.eq.low > 0 ? '+' : ''}{dynamicsSettings.eq.low} dB)</Label>
                <Slider 
                  id="low"
                  min={-12}
                  max={12}
                  step={0.5}
                  value={[dynamicsSettings.eq.low]}
                  onValueChange={(value) => setDynamicsSettings(prev => ({...prev, eq: {...prev.eq, low: value[0]}}))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mid">Mid ({dynamicsSettings.eq.mid > 0 ? '+' : ''}{dynamicsSettings.eq.mid} dB)</Label>
                <Slider 
                  id="mid"
                  min={-12}
                  max={12}
                  step={0.5}
                  value={[dynamicsSettings.eq.mid]}
                  onValueChange={(value) => setDynamicsSettings(prev => ({...prev, eq: {...prev.eq, mid: value[0]}}))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="high">High ({dynamicsSettings.eq.high > 0 ? '+' : ''}{dynamicsSettings.eq.high} dB)</Label>
                <Slider 
                  id="high"
                  min={-12}
                  max={12}
                  step={0.5}
                  value={[dynamicsSettings.eq.high]}
                  onValueChange={(value) => setDynamicsSettings(prev => ({...prev, eq: {...prev.eq, high: value[0]}}))}
                />
              </div>
            </div>
          )}
          
          {selectedProcessor === 'limiter' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="limiterThreshold">Threshold ({dynamicsSettings.limiter.threshold} dB)</Label>
                <Slider 
                  id="limiterThreshold"
                  min={-30}
                  max={0}
                  step={0.5}
                  value={[dynamicsSettings.limiter.threshold]}
                  onValueChange={(value) => setDynamicsSettings(prev => ({...prev, limiter: {...prev.limiter, threshold: value[0]}}))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="limiterRelease">Release ({dynamicsSettings.limiter.release} ms)</Label>
                <Slider 
                  id="limiterRelease"
                  min={10}
                  max={1000}
                  step={10}
                  value={[dynamicsSettings.limiter.release]}
                  onValueChange={(value) => setDynamicsSettings(prev => ({...prev, limiter: {...prev.limiter, release: value[0]}}))}
                />
              </div>
            </div>
          )}
          
          {selectedProcessor === 'deesser' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency ({dynamicsSettings.deesser.frequency} Hz)</Label>
                <Slider 
                  id="frequency"
                  min={1000}
                  max={16000}
                  step={100}
                  value={[dynamicsSettings.deesser.frequency]}
                  onValueChange={(value) => setDynamicsSettings(prev => ({...prev, deesser: {...prev.deesser, frequency: value[0]}}))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deesserThreshold">Threshold ({dynamicsSettings.deesser.threshold} dB)</Label>
                <Slider 
                  id="deesserThreshold"
                  min={-60}
                  max={0}
                  step={1}
                  value={[dynamicsSettings.deesser.threshold]}
                  onValueChange={(value) => setDynamicsSettings(prev => ({...prev, deesser: {...prev.deesser, threshold: value[0]}}))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deesserRatio">Ratio ({dynamicsSettings.deesser.ratio}:1)</Label>
                <Slider 
                  id="deesserRatio"
                  min={1}
                  max={10}
                  step={0.5}
                  value={[dynamicsSettings.deesser.ratio]}
                  onValueChange={(value) => setDynamicsSettings(prev => ({...prev, deesser: {...prev.deesser, ratio: value[0]}}))}
                />
              </div>
            </div>
          )}
          
          {selectedProcessor === 'gate' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gateThreshold">Threshold ({dynamicsSettings.gate.threshold} dB)</Label>
                <Slider 
                  id="gateThreshold"
                  min={-80}
                  max={0}
                  step={1}
                  value={[dynamicsSettings.gate.threshold]}
                  onValueChange={(value) => setDynamicsSettings(prev => ({...prev, gate: {...prev.gate, threshold: value[0]}}))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gateAttack">Attack ({dynamicsSettings.gate.attack} ms)</Label>
                <Slider 
                  id="gateAttack"
                  min={0.1}
                  max={100}
                  step={0.1}
                  value={[dynamicsSettings.gate.attack]}
                  onValueChange={(value) => setDynamicsSettings(prev => ({...prev, gate: {...prev.gate, attack: value[0]}}))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gateRelease">Release ({dynamicsSettings.gate.release} ms)</Label>
                <Slider 
                  id="gateRelease"
                  min={10}
                  max={1000}
                  step={10}
                  value={[dynamicsSettings.gate.release]}
                  onValueChange={(value) => setDynamicsSettings(prev => ({...prev, gate: {...prev.gate, release: value[0]}}))}
                />
              </div>
            </div>
          )}
          
          <DialogFooter className="flex justify-between">
            <div className="flex items-center space-x-2">
              <Switch 
                id="active" 
                checked={selectedProcessor ? dynamicsConfig.find(p => p.id === selectedProcessor)?.active : false}
                onCheckedChange={() => selectedProcessor && toggleProcessorActive(selectedProcessor)}
              />
              <Label htmlFor="active">Enable</Label>
            </div>
            
            <Button variant="outline" onClick={closeDynamicsDialog}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Mic, 
  MicOff, 
  Headphones, 
  Volume2, 
  VolumeX,
  Activity,
  X,
  Save,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

// Component props type definition
interface ProfessionalMixerProps {
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  externalAudioLevels?: { left: number, right: number };
  micActive?: boolean;
  toggleMicrophone?: () => void;
}

// For dynamics processing configuration
interface DynamicsProcessor {
  id: 'compressor' | 'limiter' | 'eq' | 'deesser' | 'gate';
  active: boolean;
  title: string;
}

const ProfessionalMixer: React.FC<ProfessionalMixerProps> = ({ 
  connectionStatus: externalConnectionStatus, 
  externalAudioLevels, 
  micActive: externalMicActive,
  toggleMicrophone: externalToggleMicrophone
}) => {
  // Force connection status to "connected" for testing dynamics
  // This allows us to test the dynamics processor without a real connection
  const connectionStatus = 'connected'; 
  
  // State for audio levels (simulated for now)
  const [internalAudioLevels, setInternalAudioLevels] = useState({ left: 0, right: 0 });
  const [internalMicActive, setInternalMicActive] = useState(false);
  const [lineActive, setLineActive] = useState(false);
  const [autoMixActive, setAutoMixActive] = useState(false);
  
  // Channel fader positions
  const [faderPosition, setFaderPosition] = useState(75);
  
  // Monitoring state
  const [monitoringActive, setMonitoringActive] = useState(false);
  
  // Dynamics processing state
  const [dynamicsConfig, setDynamicsConfig] = useState<DynamicsProcessor[]>([
    { id: 'compressor', active: false, title: 'Compressor' },
    { id: 'limiter', active: false, title: 'Limiter' },
    { id: 'eq', active: false, title: 'Equalizer' },
    { id: 'deesser', active: false, title: 'De-Esser' },
    { id: 'gate', active: false, title: 'Noise Gate' }
  ]);
  const [activeDynamicsDialogId, setActiveDynamicsDialogId] = useState<string | null>(null);
  const [showDynamicsDialog, setShowDynamicsDialog] = useState(false);
  
  // We now directly use the conditional check in the JSX for audio levels
  // This ensures proper references to external or internal values
  const micActive = externalMicActive !== undefined ? externalMicActive : internalMicActive;
  
  // Toggle microphone state
  const toggleMicrophone = () => {
    if (externalToggleMicrophone) {
      externalToggleMicrophone();
    } else {
      setInternalMicActive(!internalMicActive);
    }
  };
  
  // Toggle line state
  const toggleLine = () => {
    setLineActive(!lineActive);
  };

  // Toggle AutoMix state
  const toggleAutoMix = () => {
    setAutoMixActive(!autoMixActive);
  };

  // Open dynamics dialog
  const openDynamicsDialog = (processorId: DynamicsProcessor['id']) => {
    // Only allow dynamics on channel 1 as requested
    setActiveDynamicsDialogId(processorId);
    setShowDynamicsDialog(true);
  };

  // Save dynamics settings
  const saveDynamicsSettings = () => {
    if (!activeDynamicsDialogId) return;
    
    // Toggle or enable the selected processor
    setDynamicsConfig(prevConfig => 
      prevConfig.map(processor => 
        processor.id === activeDynamicsDialogId 
          ? { ...processor, active: true } 
          : processor
      )
    );
    
    setShowDynamicsDialog(false);
  };
  
  // State to store the channel 2 volume without AutoMix reduction
  const [channel2NormalVolume, setChannel2NormalVolume] = useState(75);
  // State for the visual fader position of channel 2
  const [channel2FaderPosition, setChannel2FaderPosition] = useState(75);
  
  // Simulate randomized audio level meters when microphone or line is active
  useEffect(() => {
    if ((!micActive && !lineActive) || externalAudioLevels) return;
    
    const interval = setInterval(() => {
      const newLeft = Math.min(Math.max(internalAudioLevels.left + (Math.random() * 30 - 15), 0), 100);
      const newRight = Math.min(Math.max(internalAudioLevels.right + (Math.random() * 30 - 15), 0), 100);
      
      setInternalAudioLevels({
        left: newLeft,
        right: newRight
      });
      
      // AutoMix functionality - reduce channel 2 volume when audio is detected on channel 1
      if (autoMixActive && micActive && newLeft > 30) {
        // Set channel 2 to -29 dB (approximately 25% on our volume scale)
        setChannel2NormalVolume(25);
        setChannel2FaderPosition(25);
      } else if (autoMixActive && !micActive) {
        // Restore channel 2 volume when channel 1 is quiet
        setChannel2NormalVolume(75);
        setChannel2FaderPosition(75);
      }
    }, 150);
    
    return () => clearInterval(interval);
  }, [micActive, lineActive, internalAudioLevels, externalAudioLevels, autoMixActive]);
  
  return (
    <Card className="bg-gradient-to-br from-zinc-900 to-black border border-red-900/30 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-red-950 to-zinc-900 py-3 px-4 border-b border-red-900/50">
        <CardTitle className="flex items-center justify-between text-lg text-red-100">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-red-400" />
            Professional Audio Mixer
            
            {/* ON AIR Indicator - smaller version that coordinates with the larger one in RemoteStudioView */}
            <div 
              className={`px-2 py-0.5 rounded-sm font-bold text-xs ${
                (micActive || lineActive || (externalAudioLevels && externalAudioLevels.left > 20) || (externalAudioLevels && externalAudioLevels.right > 20)) 
                  ? "bg-red-600 text-white slow-blink"
                  : "bg-zinc-800 text-zinc-500"
              }`}
            >
              ON AIR
            </div>
          </div>
          
          {/* AutoMix button moved to header */}
          <Button
            onClick={toggleAutoMix}
            className={`font-bold ${
              autoMixActive 
                ? 'bg-red-600 hover:bg-red-700 animate-[pulse_1.5s_ease-in-out_infinite]' 
                : 'bg-zinc-800 hover:bg-zinc-700'
            } h-9 w-24 border border-gray-600 shadow-md text-sm`}
            disabled={connectionStatus !== 'connected'}
          >
            <Activity className="h-4 w-4 mr-1" />
            AutoMix
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-[34px]">
        <div className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
            
            {/* Channel 1 - Completely Redesigned Professional Audio Channel */}
            <div className="flex flex-col bg-gradient-to-br from-zinc-900 to-black rounded-lg p-4 border border-red-900/30 shadow-lg">
              {/* Channel Header with Title and On/Off Button */}
              <div className="flex items-center mb-3">
                <div className={`w-2.5 h-2.5 rounded-full mr-2.5 ${micActive ? 'bg-red-500 animate-pulse' : 'bg-zinc-600'}`}></div>
                <h3 className="text-base font-bold text-red-200">Channel 1 (Mic)</h3>
                
                {/* Note: Mic toggle button removed as it's redundant with the ON/OFF button elsewhere in the interface */}
              </div>
              
              {/* Main Channel Content */}
              <div className="flex gap-5">
                {/* Left Side: Audio Meters + Level Indicators */}
                <div className="w-[90px]">
                  {/* Audio Level Meters with Professional LED-style Indicators */}
                  <div className="flex gap-2 h-56 mb-2">
                    {/* Left Channel Meter */}
                    <div className="flex-1 relative rounded-sm overflow-hidden bg-black border border-zinc-800">
                      {/* LED Segments - Stacked from bottom to top */}
                      <div className="absolute inset-0 flex flex-col-reverse">
                        {/* Red zone (Top) */}
                        <div className={`w-full h-[15%] ${micActive && (externalAudioLevels?.left || internalAudioLevels.left) > 85 ? 'bg-red-600' : 'bg-red-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${micActive && (externalAudioLevels?.left || internalAudioLevels.left) > 80 ? 'bg-red-600' : 'bg-red-950/30'} mb-px`}></div>
                        
                        {/* Yellow zone */}
                        <div className={`w-full h-[5%] ${micActive && (externalAudioLevels?.left || internalAudioLevels.left) > 75 ? 'bg-yellow-500' : 'bg-yellow-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${micActive && (externalAudioLevels?.left || internalAudioLevels.left) > 70 ? 'bg-yellow-500' : 'bg-yellow-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${micActive && (externalAudioLevels?.left || internalAudioLevels.left) > 65 ? 'bg-yellow-500' : 'bg-yellow-950/30'} mb-px`}></div>
                        
                        {/* Green zone (Bottom) */}
                        <div className={`w-full h-[5%] ${micActive && (externalAudioLevels?.left || internalAudioLevels.left) > 60 ? 'bg-green-500' : 'bg-green-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${micActive && (externalAudioLevels?.left || internalAudioLevels.left) > 55 ? 'bg-green-500' : 'bg-green-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${micActive && (externalAudioLevels?.left || internalAudioLevels.left) > 50 ? 'bg-green-500' : 'bg-green-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${micActive && (externalAudioLevels?.left || internalAudioLevels.left) > 45 ? 'bg-green-500' : 'bg-green-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${micActive && (externalAudioLevels?.left || internalAudioLevels.left) > 40 ? 'bg-green-500' : 'bg-green-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${micActive && (externalAudioLevels?.left || internalAudioLevels.left) > 35 ? 'bg-green-500' : 'bg-green-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${micActive && (externalAudioLevels?.left || internalAudioLevels.left) > 30 ? 'bg-green-500' : 'bg-green-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${micActive && (externalAudioLevels?.left || internalAudioLevels.left) > 25 ? 'bg-green-500' : 'bg-green-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${micActive && (externalAudioLevels?.left || internalAudioLevels.left) > 20 ? 'bg-green-500' : 'bg-green-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${micActive && (externalAudioLevels?.left || internalAudioLevels.left) > 15 ? 'bg-green-500' : 'bg-green-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${micActive && (externalAudioLevels?.left || internalAudioLevels.left) > 10 ? 'bg-green-500' : 'bg-green-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${micActive && (externalAudioLevels?.left || internalAudioLevels.left) > 5 ? 'bg-green-500' : 'bg-green-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${micActive && (externalAudioLevels?.left || internalAudioLevels.left) > 0 ? 'bg-green-500' : 'bg-green-950/30'}`}></div>
                      </div>
                      
                      {/* Level scale markers */}
                      <div className="absolute right-0 top-0 h-full flex flex-col justify-between items-end pr-0.5 text-[8px] text-zinc-500 pointer-events-none">
                        <span>+12</span>
                        <span>0</span>
                        <span>-20</span>
                        <span>-40</span>
                      </div>
                    </div>
                    
                    {/* Right Channel Meter */}
                    <div className="flex-1 relative rounded-sm overflow-hidden bg-black border border-zinc-800">
                      {/* LED Segments - Stacked from bottom to top */}
                      <div className="absolute inset-0 flex flex-col-reverse">
                        {/* Red zone (Top) */}
                        <div className={`w-full h-[15%] ${micActive && (externalAudioLevels?.right || internalAudioLevels.right) > 85 ? 'bg-red-600' : 'bg-red-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${micActive && (externalAudioLevels?.right || internalAudioLevels.right) > 80 ? 'bg-red-600' : 'bg-red-950/30'} mb-px`}></div>
                        
                        {/* Yellow zone */}
                        <div className={`w-full h-[5%] ${micActive && (externalAudioLevels?.right || internalAudioLevels.right) > 75 ? 'bg-yellow-500' : 'bg-yellow-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${micActive && (externalAudioLevels?.right || internalAudioLevels.right) > 70 ? 'bg-yellow-500' : 'bg-yellow-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${micActive && (externalAudioLevels?.right || internalAudioLevels.right) > 65 ? 'bg-yellow-500' : 'bg-yellow-950/30'} mb-px`}></div>
                        
                        {/* Green zone (Bottom) */}
                        <div className={`w-full h-[5%] ${micActive && (externalAudioLevels?.right || internalAudioLevels.right) > 60 ? 'bg-green-500' : 'bg-green-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${micActive && (externalAudioLevels?.right || internalAudioLevels.right) > 55 ? 'bg-green-500' : 'bg-green-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${micActive && (externalAudioLevels?.right || internalAudioLevels.right) > 50 ? 'bg-green-500' : 'bg-green-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${micActive && (externalAudioLevels?.right || internalAudioLevels.right) > 45 ? 'bg-green-500' : 'bg-green-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${micActive && (externalAudioLevels?.right || internalAudioLevels.right) > 40 ? 'bg-green-500' : 'bg-green-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${micActive && (externalAudioLevels?.right || internalAudioLevels.right) > 35 ? 'bg-green-500' : 'bg-green-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${micActive && (externalAudioLevels?.right || internalAudioLevels.right) > 30 ? 'bg-green-500' : 'bg-green-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${micActive && (externalAudioLevels?.right || internalAudioLevels.right) > 25 ? 'bg-green-500' : 'bg-green-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${micActive && (externalAudioLevels?.right || internalAudioLevels.right) > 20 ? 'bg-green-500' : 'bg-green-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${micActive && (externalAudioLevels?.right || internalAudioLevels.right) > 15 ? 'bg-green-500' : 'bg-green-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${micActive && (externalAudioLevels?.right || internalAudioLevels.right) > 10 ? 'bg-green-500' : 'bg-green-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${micActive && (externalAudioLevels?.right || internalAudioLevels.right) > 5 ? 'bg-green-500' : 'bg-green-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${micActive && (externalAudioLevels?.right || internalAudioLevels.right) > 0 ? 'bg-green-500' : 'bg-green-950/30'}`}></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Channel Labels */}
                  <div className="text-center text-xs text-zinc-400">L&nbsp;&nbsp;&nbsp;R</div>
                  
                  {/* Headphone Monitor Toggle Button - Centralized with increased width */}
                  <div className="flex justify-center mt-4">
                    <div className="relative mx-auto" style={{ width: 'calc(100% + 50px)' }}>
                      <Button
                        size="sm" 
                        variant={monitoringActive ? "default" : "outline"}
                        className={`h-10 w-full rounded-md text-center flex items-center justify-center transition-all ${
                          monitoringActive 
                            ? 'bg-red-700 hover:bg-red-800 text-white border border-red-600 shadow-[0_0_8px_rgba(239,68,68,0.5)]' 
                            : 'border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300'
                        }`}
                        onClick={() => setMonitoringActive(!monitoringActive)}
                        disabled={connectionStatus !== 'connected'}
                      >
                        <Headphones className={`h-4 w-4 mr-1.5 ${monitoringActive ? 'text-white' : 'text-zinc-400'}`} />
                        <span className="text-xs font-medium">{monitoringActive ? "ON" : "OFF"}</span>
                      </Button>
                      
                      {/* Active status indicator */}
                      {monitoringActive && (
                        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Right Side: Fader and Dynamics Controls */}
                <div className="flex flex-1 gap-5">
                  {/* Professional Broadcast Fader */}
                  <div className="relative w-16 h-56">
                    {/* Fader Background with Scale */}
                    <div className="absolute inset-0 bg-black rounded-md border border-zinc-800 overflow-hidden">
                      {/* Level markings */}
                      <div className="absolute left-0 top-0 h-full w-full px-2 pt-1 pb-1">
                        <div className="h-full flex flex-col justify-between text-right">
                          <div className="flex justify-between items-center">
                            <div className="w-3 h-[1px] bg-red-600"></div>
                            <span className="text-[8px] text-red-500">+12</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="w-2 h-[1px] bg-red-600"></div>
                            <span className="text-[8px] text-red-500">+6</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="w-3 h-[1px] bg-yellow-600"></div>
                            <span className="text-[8px] text-yellow-500">+3</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="w-4 h-[1px] bg-green-600"></div>
                            <span className="text-[8px] text-green-500">0</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="w-2 h-[1px] bg-green-600"></div>
                            <span className="text-[8px] text-green-500">-10</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="w-3 h-[1px] bg-green-600"></div>
                            <span className="text-[8px] text-green-500">-20</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="w-2 h-[1px] bg-zinc-600"></div>
                            <span className="text-[8px] text-zinc-500">-40</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="w-3 h-[1px] bg-zinc-600"></div>
                            <span className="text-[8px] text-zinc-500">-∞</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Fader center line */}
                      <div className="absolute left-1/2 top-0 bottom-0 w-px h-full -ml-px bg-zinc-700"></div>
                    </div>
                    
                    {/* Level indicator LED strip */}
                    <div 
                      className="absolute left-1/2 bottom-0 w-1.5 -ml-[0.75px] bg-gradient-to-t from-green-500 via-yellow-500 to-red-500 rounded-t transition-all duration-100"
                      style={{ height: `${micActive ? (faderPosition * 0.85) : 0}%` }}
                    ></div>
                    
                    {/* Fader control */}
                    <Slider
                      value={[faderPosition]}
                      onValueChange={(values) => setFaderPosition(values[0])}
                      max={100}
                      step={1}
                      orientation="vertical"
                      className="absolute inset-0 h-full"
                      disabled={connectionStatus !== 'connected'}
                      trackClassName="data-[orientation=vertical]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:bg-transparent"
                      thumbClassName="flex h-7 w-24 -translate-x-[33px] rounded-sm bg-gradient-to-b from-red-700 to-red-800 border border-red-950 shadow-lg cursor-grab active:cursor-grabbing"
                    />
                    
                    {/* Fader handle line marker */}
                    <div 
                      className="absolute pointer-events-none z-10 left-1/2 w-20 h-px flex items-center justify-center -translate-x-[40px] -translate-y-[3.5px]"
                      style={{ top: `${100 - faderPosition}%` }}
                    >
                      <div className="w-full h-[2px] bg-red-500/80"></div>
                    </div>
                  </div>
                  
                  {/* Dynamics Controls - Uniform Compact Professional Layout */}
                  <div className="flex flex-col">
                    {/* Dynamics Section Label */}
                    <div className="text-xs font-semibold text-red-300/80 bg-gradient-to-r from-red-950/80 to-black border-b border-red-900/30 py-1.5 px-2 mb-2 rounded-t-sm">DYNAMICS</div>
                    
                    {/* Dynamics Processor Buttons in Grid Layout */}
                    <div className="grid grid-cols-3 gap-1">
                      {/* EQ */}
                      <Button 
                        variant="outline" 
                        size="sm"
                        className={`h-9 w-full flex items-center justify-center p-1 rounded-sm ${
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
                        className={`h-9 w-full flex items-center justify-center p-1 rounded-sm ${
                          dynamicsConfig.find(p => p.id === 'compressor')?.active 
                            ? 'bg-green-900 hover:bg-green-800 text-white border border-green-700 shadow-sm' 
                            : 'bg-gradient-to-b from-zinc-900 to-black hover:from-zinc-800 hover:to-zinc-900 text-zinc-400 border border-zinc-800'
                        }`}
                        onClick={() => openDynamicsDialog('compressor')}
                      >
                        <span className="text-[10px] font-medium uppercase tracking-wide">Comp</span>
                      </Button>
                        
                      {/* Limiter */}
                      <Button 
                        variant="outline"
                        size="sm" 
                        className={`h-9 w-full flex items-center justify-center p-1 rounded-sm ${
                          dynamicsConfig.find(p => p.id === 'limiter')?.active 
                            ? 'bg-green-900 hover:bg-green-800 text-white border border-green-700 shadow-sm' 
                            : 'bg-gradient-to-b from-zinc-900 to-black hover:from-zinc-800 hover:to-zinc-900 text-zinc-400 border border-zinc-800'
                        }`}
                        onClick={() => openDynamicsDialog('limiter')}
                      >
                        <span className="text-[10px] font-medium uppercase tracking-wide">Lim</span>
                      </Button>
                      
                      {/* Noise Gate */}
                      <Button 
                        variant="outline"
                        size="sm" 
                        className={`h-9 w-full flex items-center justify-center p-1 rounded-sm ${
                          dynamicsConfig.find(p => p.id === 'gate')?.active 
                            ? 'bg-green-900 hover:bg-green-800 text-white border border-green-700 shadow-sm' 
                            : 'bg-gradient-to-b from-zinc-900 to-black hover:from-zinc-800 hover:to-zinc-900 text-zinc-400 border border-zinc-800'
                        }`}
                        onClick={() => openDynamicsDialog('gate')}
                      >
                        <span className="text-[10px] font-medium uppercase tracking-wide">NG</span>
                      </Button>
                      
                      {/* DeEsser */}
                      <Button 
                        variant="outline"
                        size="sm" 
                        className={`h-9 w-full flex items-center justify-center p-1 rounded-sm ${
                          dynamicsConfig.find(p => p.id === 'deesser')?.active 
                            ? 'bg-green-900 hover:bg-green-800 text-white border border-green-700 shadow-sm' 
                            : 'bg-gradient-to-b from-zinc-900 to-black hover:from-zinc-800 hover:to-zinc-900 text-zinc-400 border border-zinc-800'
                        }`}
                        onClick={() => openDynamicsDialog('deesser')}
                      >
                        <span className="text-[10px] font-medium uppercase tracking-wide">DE</span>
                      </Button>
                      
                      {/* Empty cell for grid balance */}
                      <div className="h-9"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Channel 2 - Matching the design of Channel 1 */}
            <div className="flex flex-col bg-gradient-to-br from-zinc-900 to-black rounded-lg p-4 border border-red-900/30 shadow-lg">
              {/* Channel Header with Title and Status Indicator */}
              <div className="flex items-center mb-3">
                <div className={`w-2.5 h-2.5 rounded-full mr-2.5 ${lineActive ? 'bg-red-500 animate-pulse' : 'bg-zinc-600'}`}></div>
                <h3 className="text-base font-bold text-red-200">Channel 2 (Line)</h3>
              </div>
              
              {/* Main Channel Content */}
              <div className="flex gap-5">
                {/* Left Side: Audio Meters + Level Indicators */}
                <div className="w-[90px]">
                  {/* Audio Level Meters with Professional LED-style Indicators */}
                  <div className="flex gap-2 h-56 mb-2">
                    {/* Left Channel Meter */}
                    <div className="flex-1 relative rounded-sm overflow-hidden bg-black border border-zinc-800">
                      {/* LED Segments - Stacked from bottom to top */}
                      <div className="absolute inset-0 flex flex-col-reverse">
                        {/* Red zone (Top) */}
                        <div className={`w-full h-[15%] ${lineActive && (externalAudioLevels?.left || internalAudioLevels.left) > 85 ? 'bg-red-600' : 'bg-red-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${lineActive && (externalAudioLevels?.left || internalAudioLevels.left) > 80 ? 'bg-red-600' : 'bg-red-950/30'} mb-px`}></div>
                        
                        {/* Yellow zone */}
                        <div className={`w-full h-[5%] ${lineActive && (externalAudioLevels?.left || internalAudioLevels.left) > 75 ? 'bg-yellow-500' : 'bg-yellow-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${lineActive && (externalAudioLevels?.left || internalAudioLevels.left) > 70 ? 'bg-yellow-500' : 'bg-yellow-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${lineActive && (externalAudioLevels?.left || internalAudioLevels.left) > 65 ? 'bg-yellow-500' : 'bg-yellow-950/30'} mb-px`}></div>
                        
                        {/* Green zone (Bottom) */}
                        <div className={`w-full h-[5%] ${lineActive && (externalAudioLevels?.left || internalAudioLevels.left) > 60 ? 'bg-green-500' : 'bg-green-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${lineActive && (externalAudioLevels?.left || internalAudioLevels.left) > 55 ? 'bg-green-500' : 'bg-green-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${lineActive && (externalAudioLevels?.left || internalAudioLevels.left) > 50 ? 'bg-green-500' : 'bg-green-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${lineActive && (externalAudioLevels?.left || internalAudioLevels.left) > 45 ? 'bg-green-500' : 'bg-green-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${lineActive && (externalAudioLevels?.left || internalAudioLevels.left) > 40 ? 'bg-green-500' : 'bg-green-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${lineActive && (externalAudioLevels?.left || internalAudioLevels.left) > 35 ? 'bg-green-500' : 'bg-green-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${lineActive && (externalAudioLevels?.left || internalAudioLevels.left) > 30 ? 'bg-green-500' : 'bg-green-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${lineActive && (externalAudioLevels?.left || internalAudioLevels.left) > 25 ? 'bg-green-500' : 'bg-green-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${lineActive && (externalAudioLevels?.left || internalAudioLevels.left) > 20 ? 'bg-green-500' : 'bg-green-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${lineActive && (externalAudioLevels?.left || internalAudioLevels.left) > 15 ? 'bg-green-500' : 'bg-green-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${lineActive && (externalAudioLevels?.left || internalAudioLevels.left) > 10 ? 'bg-green-500' : 'bg-green-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${lineActive && (externalAudioLevels?.left || internalAudioLevels.left) > 5 ? 'bg-green-500' : 'bg-green-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${lineActive && (externalAudioLevels?.left || internalAudioLevels.left) > 0 ? 'bg-green-500' : 'bg-green-950/30'}`}></div>
                      </div>
                      
                      {/* Level scale markers */}
                      <div className="absolute right-0 top-0 h-full flex flex-col justify-between items-end pr-0.5 text-[8px] text-zinc-500 pointer-events-none">
                        <span>+12</span>
                        <span>0</span>
                        <span>-20</span>
                        <span>-40</span>
                      </div>
                    </div>
                    
                    {/* Right Channel Meter */}
                    <div className="flex-1 relative rounded-sm overflow-hidden bg-black border border-zinc-800">
                      {/* LED Segments - Stacked from bottom to top */}
                      <div className="absolute inset-0 flex flex-col-reverse">
                        {/* Red zone (Top) */}
                        <div className={`w-full h-[15%] ${lineActive && (externalAudioLevels?.right || internalAudioLevels.right) > 85 ? 'bg-red-600' : 'bg-red-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${lineActive && (externalAudioLevels?.right || internalAudioLevels.right) > 80 ? 'bg-red-600' : 'bg-red-950/30'} mb-px`}></div>
                        
                        {/* Yellow zone */}
                        <div className={`w-full h-[5%] ${lineActive && (externalAudioLevels?.right || internalAudioLevels.right) > 75 ? 'bg-yellow-500' : 'bg-yellow-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${lineActive && (externalAudioLevels?.right || internalAudioLevels.right) > 70 ? 'bg-yellow-500' : 'bg-yellow-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${lineActive && (externalAudioLevels?.right || internalAudioLevels.right) > 65 ? 'bg-yellow-500' : 'bg-yellow-950/30'} mb-px`}></div>
                        
                        {/* Green zone (Bottom) */}
                        <div className={`w-full h-[5%] ${lineActive && (externalAudioLevels?.right || internalAudioLevels.right) > 60 ? 'bg-green-500' : 'bg-green-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${lineActive && (externalAudioLevels?.right || internalAudioLevels.right) > 55 ? 'bg-green-500' : 'bg-green-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${lineActive && (externalAudioLevels?.right || internalAudioLevels.right) > 50 ? 'bg-green-500' : 'bg-green-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${lineActive && (externalAudioLevels?.right || internalAudioLevels.right) > 45 ? 'bg-green-500' : 'bg-green-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${lineActive && (externalAudioLevels?.right || internalAudioLevels.right) > 40 ? 'bg-green-500' : 'bg-green-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${lineActive && (externalAudioLevels?.right || internalAudioLevels.right) > 35 ? 'bg-green-500' : 'bg-green-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${lineActive && (externalAudioLevels?.right || internalAudioLevels.right) > 30 ? 'bg-green-500' : 'bg-green-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${lineActive && (externalAudioLevels?.right || internalAudioLevels.right) > 25 ? 'bg-green-500' : 'bg-green-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${lineActive && (externalAudioLevels?.right || internalAudioLevels.right) > 20 ? 'bg-green-500' : 'bg-green-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${lineActive && (externalAudioLevels?.right || internalAudioLevels.right) > 15 ? 'bg-green-500' : 'bg-green-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${lineActive && (externalAudioLevels?.right || internalAudioLevels.right) > 10 ? 'bg-green-500' : 'bg-green-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${lineActive && (externalAudioLevels?.right || internalAudioLevels.right) > 5 ? 'bg-green-500' : 'bg-green-950/30'} mb-px`}></div>
                        <div className={`w-full h-[5%] ${lineActive && (externalAudioLevels?.right || internalAudioLevels.right) > 0 ? 'bg-green-500' : 'bg-green-950/30'}`}></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Channel Labels */}
                  <div className="text-center text-xs text-zinc-400">L&nbsp;&nbsp;&nbsp;R</div>
                  
                  {/* Line ON/OFF Toggle Button - Centralized with increased width */}
                  <div className="flex justify-center mt-4">
                    <div className="relative mx-auto" style={{ width: 'calc(100% + 50px)' }}>
                      <Button
                        size="sm" 
                        variant={lineActive ? "default" : "outline"}
                        className={`h-10 w-full rounded-md text-center flex items-center justify-center transition-all ${
                          lineActive 
                            ? 'bg-red-700 hover:bg-red-800 text-white border border-red-600 shadow-[0_0_8px_rgba(239,68,68,0.5)]' 
                            : 'border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300'
                        }`}
                        onClick={toggleLine}
                        disabled={connectionStatus !== 'connected'}
                      >
                        {lineActive ? <Volume2 className={`h-4 w-4 mr-1.5 text-white`} /> : <VolumeX className="h-4 w-4 mr-1.5 text-zinc-400" />}
                        <span className="text-xs font-medium">{lineActive ? "ON" : "OFF"}</span>
                      </Button>
                      
                      {/* Active status indicator */}
                      {lineActive && (
                        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Right Side: Fader and Dynamics Controls */}
                <div className="flex flex-1 gap-5">
                  {/* Professional Broadcast Fader */}
                  <div className="relative w-16 h-56">
                    {/* Fader Background with Scale */}
                    <div className="absolute inset-0 bg-black rounded-md border border-zinc-800 overflow-hidden">
                      {/* Level markings */}
                      <div className="absolute left-0 top-0 h-full w-full px-2 pt-1 pb-1">
                        <div className="h-full flex flex-col justify-between text-right">
                          <div className="flex justify-between items-center">
                            <div className="w-3 h-[1px] bg-red-600"></div>
                            <span className="text-[8px] text-red-500">+12</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="w-2 h-[1px] bg-red-600"></div>
                            <span className="text-[8px] text-red-500">+6</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="w-3 h-[1px] bg-yellow-600"></div>
                            <span className="text-[8px] text-yellow-500">+3</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="w-4 h-[1px] bg-green-600"></div>
                            <span className="text-[8px] text-green-500">0</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="w-2 h-[1px] bg-green-600"></div>
                            <span className="text-[8px] text-green-500">-10</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="w-3 h-[1px] bg-green-600"></div>
                            <span className="text-[8px] text-green-500">-20</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="w-2 h-[1px] bg-zinc-600"></div>
                            <span className="text-[8px] text-zinc-500">-40</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="w-3 h-[1px] bg-zinc-600"></div>
                            <span className="text-[8px] text-zinc-500">-∞</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Fader center line */}
                      <div className="absolute left-1/2 top-0 bottom-0 w-px h-full -ml-px bg-zinc-700"></div>
                    </div>
                    
                    {/* Level indicator LED strip */}
                    <div 
                      className="absolute left-1/2 bottom-0 w-1.5 -ml-[0.75px] bg-gradient-to-t from-green-500 via-yellow-500 to-red-500 rounded-t transition-all duration-100"
                      style={{ height: `${lineActive ? (channel2FaderPosition * 0.85) : 0}%` }}
                    ></div>
                    
                    {/* Fader control */}
                    <Slider
                      value={[channel2FaderPosition]}
                      onValueChange={(values) => {
                        if (!autoMixActive) {
                          setChannel2NormalVolume(values[0]);
                          setChannel2FaderPosition(values[0]);
                        }
                      }}
                      max={100}
                      step={1}
                      orientation="vertical"
                      className="absolute inset-0 h-full"
                      disabled={connectionStatus !== 'connected' || autoMixActive}
                      trackClassName="data-[orientation=vertical]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:bg-transparent"
                      thumbClassName="flex h-7 w-24 -translate-x-[33px] rounded-sm bg-gradient-to-b from-red-700 to-red-800 border border-red-950 shadow-lg cursor-grab active:cursor-grabbing"
                    />
                    
                    {/* Fader handle line marker */}
                    <div 
                      className="absolute pointer-events-none z-10 left-1/2 w-20 h-px flex items-center justify-center -translate-x-[40px] -translate-y-[3.5px]"
                      style={{ top: `${100 - channel2FaderPosition}%` }}
                    >
                      <div className="w-full h-[2px] bg-red-500/80"></div>
                    </div>
                  </div>
                  
                  {/* Dynamics Controls - Uniform Compact Professional Layout */}
                  <div className="flex flex-col">
                    {/* Dynamics Section Label */}
                    <div className="text-xs font-semibold text-red-300/80 bg-gradient-to-r from-red-950/80 to-black border-b border-red-900/30 py-1.5 px-2 mb-2 rounded-t-sm">DYNAMICS</div>
                    
                    {/* Dynamics Processor Buttons in Grid Layout */}
                    <div className="grid grid-cols-3 gap-1">
                      {/* EQ */}
                      <Button 
                        variant="outline" 
                        size="sm"
                        className={`h-9 w-full flex items-center justify-center p-1 rounded-sm ${
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
                        className={`h-9 w-full flex items-center justify-center p-1 rounded-sm ${
                          dynamicsConfig.find(p => p.id === 'compressor')?.active 
                            ? 'bg-green-900 hover:bg-green-800 text-white border border-green-700 shadow-sm' 
                            : 'bg-gradient-to-b from-zinc-900 to-black hover:from-zinc-800 hover:to-zinc-900 text-zinc-400 border border-zinc-800'
                        }`}
                        onClick={() => openDynamicsDialog('compressor')}
                      >
                        <span className="text-[10px] font-medium uppercase tracking-wide">Comp</span>
                      </Button>
                        
                      {/* Limiter */}
                      <Button 
                        variant="outline"
                        size="sm" 
                        className={`h-9 w-full flex items-center justify-center p-1 rounded-sm ${
                          dynamicsConfig.find(p => p.id === 'limiter')?.active 
                            ? 'bg-green-900 hover:bg-green-800 text-white border border-green-700 shadow-sm' 
                            : 'bg-gradient-to-b from-zinc-900 to-black hover:from-zinc-800 hover:to-zinc-900 text-zinc-400 border border-zinc-800'
                        }`}
                        onClick={() => openDynamicsDialog('limiter')}
                      >
                        <span className="text-[10px] font-medium uppercase tracking-wide">Lim</span>
                      </Button>
                      
                      {/* Noise Gate */}
                      <Button 
                        variant="outline"
                        size="sm" 
                        className={`h-9 w-full flex items-center justify-center p-1 rounded-sm ${
                          dynamicsConfig.find(p => p.id === 'gate')?.active 
                            ? 'bg-green-900 hover:bg-green-800 text-white border border-green-700 shadow-sm' 
                            : 'bg-gradient-to-b from-zinc-900 to-black hover:from-zinc-800 hover:to-zinc-900 text-zinc-400 border border-zinc-800'
                        }`}
                        onClick={() => openDynamicsDialog('gate')}
                      >
                        <span className="text-[10px] font-medium uppercase tracking-wide">NG</span>
                      </Button>
                      
                      {/* DeEsser */}
                      <Button 
                        variant="outline"
                        size="sm" 
                        className={`h-9 w-full flex items-center justify-center p-1 rounded-sm ${
                          dynamicsConfig.find(p => p.id === 'deesser')?.active 
                            ? 'bg-green-900 hover:bg-green-800 text-white border border-green-700 shadow-sm' 
                            : 'bg-gradient-to-b from-zinc-900 to-black hover:from-zinc-800 hover:to-zinc-900 text-zinc-400 border border-zinc-800'
                        }`}
                        onClick={() => openDynamicsDialog('deesser')}
                      >
                        <span className="text-[10px] font-medium uppercase tracking-wide">DE</span>
                      </Button>
                      
                      {/* Empty cell for grid balance */}
                      <div className="h-9"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Master section removed from here */}
        </div>
      </CardContent>
      
      {/* Dynamics Processing Dialog */}
      <Dialog open={showDynamicsDialog} onOpenChange={setShowDynamicsDialog}>
        <DialogContent className="sm:max-w-[600px] bg-gradient-to-b from-zinc-900 to-black border-red-900/40">
          <DialogHeader className="bg-gradient-to-r from-red-950 to-zinc-900 -mx-6 -my-2 px-6 py-4 mb-4 border-b border-red-900/30">
            <DialogTitle className="text-xl text-red-100 flex items-center gap-2">
              <Activity className="h-5 w-5 text-red-400" />
              {activeDynamicsDialogId && dynamicsConfig.find(p => p.id === activeDynamicsDialogId)?.title} Configuration
            </DialogTitle>
            <DialogDescription className="text-red-200/70">
              Configure audio dynamics processing for Channel 1 (Mic)
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-2">
            <Tabs defaultValue="settings" className="w-full">
              <TabsList className="grid grid-cols-3 mb-4 bg-gray-800">
                <TabsTrigger value="settings" className="data-[state=active]:bg-red-900 data-[state=active]:text-white">
                  Settings
                </TabsTrigger>
                <TabsTrigger value="visualization" className="data-[state=active]:bg-red-900 data-[state=active]:text-white">
                  Visualization
                </TabsTrigger>
                <TabsTrigger value="presets" className="data-[state=active]:bg-red-900 data-[state=active]:text-white">
                  Presets
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="settings" className="space-y-4">
                {activeDynamicsDialogId === 'compressor' && (
                  <div className="space-y-4">
                    <Card className="bg-zinc-900/70 border-zinc-800">
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="threshold" className="text-red-200">Threshold (dB)</Label>
                            <div className="flex items-center gap-2">
                              <Slider 
                                id="threshold" 
                                defaultValue={[-18]} 
                                max={0} 
                                min={-60} 
                                step={1} 
                                className="bg-gradient-to-r from-red-500/10 to-red-500/5 rounded-sm"
                              />
                              <span className="text-xs font-mono bg-black/50 px-2 py-1 rounded-sm w-12 text-center">-18 dB</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="ratio" className="text-red-200">Ratio</Label>
                            <div className="flex items-center gap-2">
                              <Slider 
                                id="ratio" 
                                defaultValue={[4]} 
                                max={20} 
                                min={1} 
                                step={0.1} 
                                className="bg-gradient-to-r from-red-500/10 to-red-500/5 rounded-sm"
                              />
                              <span className="text-xs font-mono bg-black/50 px-2 py-1 rounded-sm w-12 text-center">4:1</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="attack" className="text-red-200">Attack (ms)</Label>
                            <div className="flex items-center gap-2">
                              <Slider 
                                id="attack" 
                                defaultValue={[10]} 
                                max={100} 
                                min={0.1} 
                                step={0.1} 
                                className="bg-gradient-to-r from-red-500/10 to-red-500/5 rounded-sm"
                              />
                              <span className="text-xs font-mono bg-black/50 px-2 py-1 rounded-sm w-12 text-center">10 ms</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="release" className="text-red-200">Release (ms)</Label>
                            <div className="flex items-center gap-2">
                              <Slider 
                                id="release" 
                                defaultValue={[80]} 
                                max={1000} 
                                min={10} 
                                step={10} 
                                className="bg-gradient-to-r from-red-500/10 to-red-500/5 rounded-sm"
                              />
                              <span className="text-xs font-mono bg-black/50 px-2 py-1 rounded-sm w-12 text-center">80 ms</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 mt-4">
                          <Switch id="enable-compressor" defaultChecked />
                          <Label htmlFor="enable-compressor" className="text-red-200">Enable Compressor</Label>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
                
                {activeDynamicsDialogId === 'limiter' && (
                  <div className="space-y-4">
                    <Card className="bg-zinc-900/70 border-zinc-800">
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="limiter-threshold" className="text-red-200">Threshold (dB)</Label>
                            <div className="flex items-center gap-2">
                              <Slider 
                                id="limiter-threshold" 
                                defaultValue={[-2]} 
                                max={0} 
                                min={-20} 
                                step={0.1} 
                                className="bg-gradient-to-r from-red-500/10 to-red-500/5 rounded-sm"
                              />
                              <span className="text-xs font-mono bg-black/50 px-2 py-1 rounded-sm w-12 text-center">-2 dB</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="limiter-release" className="text-red-200">Release (ms)</Label>
                            <div className="flex items-center gap-2">
                              <Slider 
                                id="limiter-release" 
                                defaultValue={[50]} 
                                max={500} 
                                min={1} 
                                step={1} 
                                className="bg-gradient-to-r from-red-500/10 to-red-500/5 rounded-sm"
                              />
                              <span className="text-xs font-mono bg-black/50 px-2 py-1 rounded-sm w-12 text-center">50 ms</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 mt-4">
                          <Switch id="enable-limiter" defaultChecked />
                          <Label htmlFor="enable-limiter" className="text-red-200">Enable Limiter</Label>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
                
                {activeDynamicsDialogId === 'eq' && (
                  <div className="space-y-4">
                    <Card className="bg-zinc-900/70 border-zinc-800">
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="low-gain" className="text-red-200">Low Gain (dB)</Label>
                            <div className="flex items-center gap-2">
                              <Slider 
                                id="low-gain" 
                                defaultValue={[0]} 
                                max={12} 
                                min={-12} 
                                step={0.5} 
                                className="bg-gradient-to-r from-red-500/10 to-red-500/5 rounded-sm"
                              />
                              <span className="text-xs font-mono bg-black/50 px-2 py-1 rounded-sm w-12 text-center">0 dB</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="mid-gain" className="text-red-200">Mid Gain (dB)</Label>
                            <div className="flex items-center gap-2">
                              <Slider 
                                id="mid-gain" 
                                defaultValue={[0]} 
                                max={12} 
                                min={-12} 
                                step={0.5} 
                                className="bg-gradient-to-r from-red-500/10 to-red-500/5 rounded-sm"
                              />
                              <span className="text-xs font-mono bg-black/50 px-2 py-1 rounded-sm w-12 text-center">0 dB</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="high-gain" className="text-red-200">High Gain (dB)</Label>
                            <div className="flex items-center gap-2">
                              <Slider 
                                id="high-gain" 
                                defaultValue={[0]} 
                                max={12} 
                                min={-12} 
                                step={0.5} 
                                className="bg-gradient-to-r from-red-500/10 to-red-500/5 rounded-sm"
                              />
                              <span className="text-xs font-mono bg-black/50 px-2 py-1 rounded-sm w-12 text-center">0 dB</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 mt-4">
                          <Switch id="enable-eq" defaultChecked />
                          <Label htmlFor="enable-eq" className="text-red-200">Enable Equalizer</Label>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
                
                {activeDynamicsDialogId === 'deesser' && (
                  <div className="space-y-4">
                    <Card className="bg-zinc-900/70 border-zinc-800">
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="deess-freq" className="text-red-200">Frequency (Hz)</Label>
                            <div className="flex items-center gap-2">
                              <Slider 
                                id="deess-freq" 
                                defaultValue={[5000]} 
                                max={12000} 
                                min={2000} 
                                step={100} 
                                className="bg-gradient-to-r from-red-500/10 to-red-500/5 rounded-sm"
                              />
                              <span className="text-xs font-mono bg-black/50 px-2 py-1 rounded-sm w-16 text-center">5000 Hz</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="deess-amount" className="text-red-200">Amount</Label>
                            <div className="flex items-center gap-2">
                              <Slider 
                                id="deess-amount" 
                                defaultValue={[6]} 
                                max={12} 
                                min={0} 
                                step={0.5} 
                                className="bg-gradient-to-r from-red-500/10 to-red-500/5 rounded-sm"
                              />
                              <span className="text-xs font-mono bg-black/50 px-2 py-1 rounded-sm w-12 text-center">6 dB</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 mt-4">
                          <Switch id="enable-deesser" defaultChecked />
                          <Label htmlFor="enable-deesser" className="text-red-200">Enable De-Esser</Label>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
                
                {activeDynamicsDialogId === 'gate' && (
                  <div className="space-y-4">
                    <Card className="bg-zinc-900/70 border-zinc-800">
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="gate-threshold" className="text-red-200">Threshold (dB)</Label>
                            <div className="flex items-center gap-2">
                              <Slider 
                                id="gate-threshold" 
                                defaultValue={[-40]} 
                                max={0} 
                                min={-80} 
                                step={1} 
                                className="bg-gradient-to-r from-red-500/10 to-red-500/5 rounded-sm"
                              />
                              <span className="text-xs font-mono bg-black/50 px-2 py-1 rounded-sm w-12 text-center">-40 dB</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="gate-reduction" className="text-red-200">Reduction (dB)</Label>
                            <div className="flex items-center gap-2">
                              <Slider 
                                id="gate-reduction" 
                                defaultValue={[20]} 
                                max={60} 
                                min={0} 
                                step={1} 
                                className="bg-gradient-to-r from-red-500/10 to-red-500/5 rounded-sm"
                              />
                              <span className="text-xs font-mono bg-black/50 px-2 py-1 rounded-sm w-12 text-center">20 dB</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 mt-4">
                          <Switch id="enable-gate" defaultChecked />
                          <Label htmlFor="enable-gate" className="text-red-200">Enable Noise Gate</Label>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="visualization" className="mt-2">
                <Card className="bg-zinc-900/70 border-zinc-800">
                  <CardContent className="p-4">
                    <div className="h-48 w-full bg-black/70 rounded-md flex items-center justify-center border border-zinc-800">
                      <div className="relative w-full h-[calc(100%+40px)] p-4">
                        <div className="absolute inset-0 grid grid-cols-12 grid-rows-6 gap-1 p-4 pointer-events-none">
                          {/* Horizontal grid lines */}
                          {[...Array(7)].map((_, i) => (
                            <div key={`h-${i}`} className="col-span-12 border-t border-gray-800/50" style={{ gridRow: i + 1 }} />
                          ))}
                          
                          {/* Vertical grid lines */}
                          {[...Array(13)].map((_, i) => (
                            <div key={`v-${i}`} className="row-span-6 border-l border-gray-800/50" style={{ gridColumn: i + 1 }} />
                          ))}
                          
                          {/* Sample visualization based on processor type */}
                          {activeDynamicsDialogId === 'compressor' && (
                            <div className="absolute top-0 left-0 w-full h-[calc(100%+40px)] p-4 flex items-center justify-center">
                              <svg viewBox="0 0 100 60" className="w-full h-[calc(100%+40px)] stroke-red-500/70" strokeWidth="1.5" fill="none">
                                <path d="M0,60 L60,60 L60,30 C60,20 70,20 70,10 L70,0 L100,0" />
                              </svg>
                            </div>
                          )}
                          
                          {activeDynamicsDialogId === 'eq' && (
                            <div className="absolute top-0 left-0 w-full h-[calc(100%+40px)] p-4 flex items-center justify-center">
                              <svg viewBox="0 0 100 60" className="w-full h-[calc(100%+40px)] stroke-red-500/70" strokeWidth="1.5" fill="none">
                                <path d="M0,30 C10,40 25,10 40,30 C55,50 70,15 85,30 C95,40 100,30 100,30" />
                              </svg>
                            </div>
                          )}
                          
                          {activeDynamicsDialogId === 'gate' && (
                            <div className="absolute top-0 left-0 w-full h-[calc(100%+40px)] p-4 flex items-center justify-center">
                              <svg viewBox="0 0 100 60" className="w-full h-[calc(100%+40px)] stroke-red-500/70" strokeWidth="1.5" fill="none">
                                <path d="M0,60 L40,60 L40,0 L45,0 L45,60 L100,60" />
                              </svg>
                            </div>
                          )}
                          
                          {activeDynamicsDialogId === 'limiter' && (
                            <div className="absolute top-0 left-0 w-full h-[calc(100%+40px)] p-4 flex items-center justify-center">
                              <svg viewBox="0 0 100 60" className="w-full h-[calc(100%+40px)] stroke-red-500/70" strokeWidth="1.5" fill="none">
                                <path d="M0,60 L70,60 L70,0 L100,0" />
                              </svg>
                            </div>
                          )}
                          
                          {activeDynamicsDialogId === 'deesser' && (
                            <div className="absolute top-0 left-0 w-full h-[calc(100%+40px)] p-4 flex items-center justify-center">
                              <svg viewBox="0 0 100 60" className="w-full h-[calc(100%+40px)] stroke-red-500/70" strokeWidth="1.5" fill="none">
                                <path d="M0,30 C15,30 15,30 20,30 C25,30 25,10 30,10 C35,10 35,30 40,30 C45,30 45,50 50,50 C55,50 55,30 60,30 C65,30 65,30 100,30" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="presets" className="mt-2">
                <Card className="bg-zinc-900/70 border-zinc-800">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="bg-gray-800 hover:bg-gray-700 border-gray-700 justify-start text-left">
                        <div className="mr-2 h-4 w-4 rounded-full bg-red-400"></div>
                        Vocal Presence
                      </Button>
                      <Button variant="outline" className="bg-gray-800 hover:bg-gray-700 border-gray-700 justify-start text-left">
                        <div className="mr-2 h-4 w-4 rounded-full bg-green-400"></div>
                        Broadcast Voice
                      </Button>
                      <Button variant="outline" className="bg-gray-800 hover:bg-gray-700 border-gray-700 justify-start text-left">
                        <div className="mr-2 h-4 w-4 rounded-full bg-blue-400"></div>
                        Gentle De-Essing
                      </Button>
                      <Button variant="outline" className="bg-gray-800 hover:bg-gray-700 border-gray-700 justify-start text-left">
                        <div className="mr-2 h-4 w-4 rounded-full bg-purple-400"></div>
                        Music Performance
                      </Button>
                      <Button variant="outline" className="bg-gray-800 hover:bg-gray-700 border-gray-700 justify-start text-left">
                        <div className="mr-2 h-4 w-4 rounded-full bg-yellow-400"></div>
                        Telephone EQ
                      </Button>
                      <Button variant="outline" className="bg-gray-800 hover:bg-gray-700 border-gray-700 justify-start text-left">
                        <div className="mr-2 h-4 w-4 rounded-full bg-pink-400"></div>
                        Custom Setting
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          <DialogFooter className="pt-2 border-t border-zinc-800/50 mt-4">
            <Button 
              variant="outline"
              onClick={() => setShowDynamicsDialog(false)}
              className="bg-gray-800 hover:bg-gray-700 border-gray-700"
            >
              <X className="w-4 h-4 mr-2" /> Cancel
            </Button>
            <Button 
              onClick={saveDynamicsSettings}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="w-4 h-4 mr-2" /> Save and Enable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ProfessionalMixer;
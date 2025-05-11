import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import AudioProcessorLeftMenu from '@/components/audio-processor/AudioProcessorLeftMenu';
import { AppLayout } from '@/components/AppLayout';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Slider
} from '@/components/ui/slider';
import {
  Switch
} from '@/components/ui/switch';
import {
  Label
} from '@/components/ui/label';
import {
  Radio,
  Save,
  Headphones,
  Wifi,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Audio processor settings interface - this should match your backend schema
interface ProcessorSettings {
  id?: number;
  name: string;
  isDefault: boolean;
  inputFormat: string;
  inputDevice: string;
  inputGain: number;
  outputGain: number;
  enabled: boolean;
  preProcessing: {
    enabled: boolean;
    declipper: {
      enabled: boolean;
      threshold: number;
    };
    noiseReduction: {
      enabled: boolean;
      amount: number;
    };
    humFilter: {
      enabled: boolean;
      frequency: number;
      amount: number;
    };
    phaseCorrection: {
      enabled: boolean;
      amount: number;
    };
  };
  equalizer: {
    enabled: boolean;
    bands: {
      frequency: number;
      gain: number;
      q: number;
      type: string;
    }[];
  };
  compressor: {
    enabled: boolean;
    threshold: number;
    ratio: number;
    attack: number;
    release: number;
    gain: number;
  };
  multibandCompressor: {
    enabled: boolean;
    bands: CompressorBand[];
  };
  limiter: {
    enabled: boolean;
    threshold: number;
    release: number;
    lookahead: boolean;
  };
  stereoTool: {
    enabled: boolean;
    width: number;
    panning: number;
  };
}

// Stream settings interface
interface StreamSettings {
  id?: number;
  name: string;
  isDefault: boolean;
  serverUrl: string;
  port: number;
  mountPoint: string;
  password: string;
  format: string;
  bitrate: number;
  sampleRate: number;
  channels: number;
  publicServer: boolean;
  serverName: string;
  serverDescription: string;
  serverGenre: string;
  serverUrl2: string;
  enabled: boolean;
}

// Compressor band interface
interface CompressorBand {
  id: number;
  frequency: number;
  enabled: boolean;
  lowFreq: number;
  highFreq: number;
  threshold: number;
  ratio: number;
  attack: number;
  release: number;
  gain: number;
  knee: number;
  mode: "downward" | "upward";
}

// Get active band by ID helper function
const getActiveBand = (bands: CompressorBand[], id: number): CompressorBand => {
  return bands.find(band => band.id === id) || bands[0];
};

// Function to get color for different band frequencies
const getBandColor = (bandId: number): string => {
  switch (bandId) {
    case 1: return 'blue';       // Low bass
    case 2: return 'indigo';     // Upper bass
    case 3: return 'violet';     // Lower mids
    case 4: return 'purple';     // Mids
    case 5: return 'emerald';    // Upper mids
    case 6: return 'yellow';     // Presence
    case 7: return 'orange';     // Lower highs
    case 8: return 'red';        // Highs
    case 9: return 'rose';       // Air
    default: return 'gray';
  }
};

// Default settings in case the server doesn't respond
const defaultProcessorSettings: ProcessorSettings = {
  name: "Default Settings",
  isDefault: true,
  inputFormat: "wav",
  inputDevice: "default",
  inputGain: 0,
  outputGain: 0,
  enabled: true,
  preProcessing: {
    enabled: true,
    declipper: {
      enabled: true,
      threshold: -1
    },
    noiseReduction: {
      enabled: false,
      amount: 10
    },
    humFilter: {
      enabled: false,
      frequency: 50,
      amount: 40
    },
    phaseCorrection: {
      enabled: false,
      amount: 50
    }
  },
  equalizer: {
    enabled: true,
    bands: [
      { frequency: 31, gain: 0, q: 1, type: "peaking" },
      { frequency: 63, gain: 0, q: 1, type: "peaking" },
      { frequency: 125, gain: 0, q: 1, type: "peaking" },
      { frequency: 250, gain: 0, q: 1, type: "peaking" },
      { frequency: 500, gain: 0, q: 1, type: "peaking" },
      { frequency: 1000, gain: 0, q: 1, type: "peaking" },
      { frequency: 2000, gain: 0, q: 1, type: "peaking" },
      { frequency: 4000, gain: 0, q: 1, type: "peaking" },
      { frequency: 8000, gain: 0, q: 1, type: "peaking" },
      { frequency: 16000, gain: 0, q: 1, type: "peaking" }
    ]
  },
  compressor: {
    enabled: true,
    threshold: -18,
    ratio: 4,
    attack: 5,
    release: 50,
    gain: 3
  },
  multibandCompressor: {
    enabled: true,
    bands: [
      {
        id: 1,
        frequency: 80,
        enabled: true,
        lowFreq: 20,
        highFreq: 150,
        threshold: -24,
        ratio: 4,
        attack: 5,
        release: 50,
        gain: 3,
        knee: 6,
        mode: "downward"
      },
      {
        id: 2,
        frequency: 300,
        enabled: true,
        lowFreq: 150,
        highFreq: 700,
        threshold: -24,
        ratio: 3,
        attack: 10,
        release: 80,
        gain: 2,
        knee: 6,
        mode: "downward"
      },
      {
        id: 3,
        frequency: 1000,
        enabled: true,
        lowFreq: 700,
        highFreq: 3000,
        threshold: -20,
        ratio: 2.5,
        attack: 15,
        release: 100,
        gain: 1.5,
        knee: 6,
        mode: "downward"
      },
      {
        id: 4,
        frequency: 5000,
        enabled: true,
        lowFreq: 3000,
        highFreq: 8000,
        threshold: -18,
        ratio: 2,
        attack: 5,
        release: 50,
        gain: 1,
        knee: 6,
        mode: "downward"
      },
      {
        id: 5,
        frequency: 12000,
        enabled: true,
        lowFreq: 8000,
        highFreq: 20000,
        threshold: -16,
        ratio: 1.5,
        attack: 2,
        release: 30,
        gain: 0.5,
        knee: 6,
        mode: "downward"
      }
    ]
  },
  limiter: {
    enabled: true,
    threshold: -1.5,
    release: 50,
    lookahead: true
  },
  stereoTool: {
    enabled: false,
    width: 100,
    panning: 0
  }
};

// Default stream settings
const defaultStreamSettings: StreamSettings = {
  name: "Default Stream",
  isDefault: true,
  serverUrl: "http://your-server.com",
  port: 8000,
  mountPoint: "/stream",
  password: "",
  format: "mp3",
  bitrate: 128,
  sampleRate: 44100,
  channels: 2,
  publicServer: true,
  serverName: "My Radio Station",
  serverDescription: "Playing the best music 24/7",
  serverGenre: "Various",
  serverUrl2: "http://your-website.com",
  enabled: false
};

const InternetRadioPage: React.FC = () => {
  const { toast } = useToast();
  
  // State for active section in left menu
  const [activeSection, setActiveSection] = useState<string>('multiband');
  
  // State for active band in multiband compressor
  const [activeBandId, setActiveBandId] = useState<number>(1);
  
  // State for processor and stream settings
  const [processorSettings, setProcessorSettings] = useState<ProcessorSettings>(defaultProcessorSettings);
  const [streamSettings, setStreamSettings] = useState<StreamSettings>(defaultStreamSettings);
  
  // Query for processor settings
  const {
    data: processorSettingsData,
    isLoading: isLoadingProcessorSettings,
    error: processorSettingsError
  } = useQuery({
    queryKey: ['/api/internet-radio/processor-settings'],
    onSuccess: (data) => {
      if (data) {
        setProcessorSettings(data);
      }
    },
    onError: () => {
      toast({
        title: "Error loading processor settings",
        description: "Using default settings instead",
        variant: "destructive"
      });
    }
  });
  
  // Query for stream settings
  const {
    data: streamSettingsData,
    isLoading: isLoadingStreamSettings,
    error: streamSettingsError
  } = useQuery({
    queryKey: ['/api/internet-radio/stream-settings'],
    onSuccess: (data) => {
      if (data) {
        setStreamSettings(data);
      }
    },
    onError: () => {
      toast({
        title: "Error loading stream settings",
        description: "Using default settings instead",
        variant: "destructive"
      });
    }
  });
  
  // Mutation for saving processor settings
  const saveProcessorSettingsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/internet-radio/processor-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(processorSettings)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save processor settings');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Your audio processor settings have been saved",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/internet-radio/processor-settings'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to save settings",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Mutation for saving stream settings
  const saveStreamSettingsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/internet-radio/stream-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(streamSettings)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save stream settings');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Stream settings saved",
        description: "Your stream settings have been saved",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/internet-radio/stream-settings'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to save stream settings",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Mutation for creating default settings
  const createDefaultSettingsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/internet-radio/create-default-settings', {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to create default settings');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Default settings created",
        description: "Default processor and stream settings have been created",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/internet-radio/processor-settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/internet-radio/stream-settings'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to create default settings",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Handle compressor change
  const handleCompressorChange = (field: string, value: number[]) => {
    setProcessorSettings(prev => ({
      ...prev,
      compressor: {
        ...prev.compressor,
        [field]: value[0]
      }
    }));
  };
  
  // Handle multiband compressor change
  const handleMultibandCompressorChange = (field: string, value: number[]) => {
    setProcessorSettings(prev => {
      const updatedBands = [...prev.multibandCompressor.bands];
      const bandIndex = updatedBands.findIndex(band => band.id === activeBandId);
      
      if (bandIndex !== -1) {
        updatedBands[bandIndex] = {
          ...updatedBands[bandIndex],
          [field]: value[0]
        };
      }
      
      return {
        ...prev,
        multibandCompressor: {
          ...prev.multibandCompressor,
          bands: updatedBands
        }
      };
    });
  };
  
  // Handle toggle changes
  const handleToggleChange = (section: string, value: boolean) => {
    setProcessorSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        enabled: value
      }
    }));
  };
  
  // Handle multiband toggle change
  const handleMultibandToggleChange = (value: boolean) => {
    setProcessorSettings(prev => {
      const updatedBands = [...prev.multibandCompressor.bands];
      const bandIndex = updatedBands.findIndex(band => band.id === activeBandId);
      
      if (bandIndex !== -1) {
        updatedBands[bandIndex] = {
          ...updatedBands[bandIndex],
          enabled: value
        };
      }
      
      return {
        ...prev,
        multibandCompressor: {
          ...prev.multibandCompressor,
          bands: updatedBands
        }
      };
    });
  };
  
  // Handle pre-processing toggle changes
  const handlePreProcessingToggleChange = (feature: string, value: boolean) => {
    setProcessorSettings(prev => ({
      ...prev,
      preProcessing: {
        ...prev.preProcessing,
        [feature]: {
          ...prev.preProcessing[feature],
          enabled: value
        }
      }
    }));
  };
  
  // Handle input format change
  const handleInputFormatChange = (value: string) => {
    setProcessorSettings(prev => ({
      ...prev,
      inputFormat: value
    }));
  };
  
  // Handle band selection change
  const handleBandSelectionChange = (bandId: number) => {
    setActiveBandId(bandId);
  };
  
  // Handle save settings
  const handleSaveSettings = () => {
    saveProcessorSettingsMutation.mutate();
  };
  
  // Handle save stream settings
  const handleSaveStreamSettings = () => {
    saveStreamSettingsMutation.mutate();
  };
  
  // Handle create default settings
  const handleCreateDefaultSettings = () => {
    if (window.confirm("This will create new default settings. Continue?")) {
      createDefaultSettingsMutation.mutate();
    }
  };
  
  // Get the active band from the multibandCompressor bands
  const activeBand = getActiveBand(processorSettings.multibandCompressor.bands, activeBandId);
  
  // Render the main component
  return (
    <AppLayout>
      <div className="flex h-full">
        {/* Left Side Menu */}
        <AudioProcessorLeftMenu 
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
        
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-gray-950 p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-white">Internet Radio</h1>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSaveSettings}
                disabled={saveProcessorSettingsMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleCreateDefaultSettings}
                disabled={createDefaultSettingsMutation.isPending}
              >
                Create Default Settings
              </Button>
            </div>
          </div>
          
          <Tabs defaultValue="processor" className="w-full">
            <TabsList className="grid grid-cols-3 w-full max-w-md mb-4">
              <TabsTrigger value="processor" className="flex items-center">
                <Sliders className="h-4 w-4 mr-2" />
                Audio Processor
              </TabsTrigger>
              <TabsTrigger value="streaming" className="flex items-center">
                <Wifi className="h-4 w-4 mr-2" />
                Streaming Config
              </TabsTrigger>
              <TabsTrigger value="monitor" className="flex items-center">
                <Headphones className="h-4 w-4 mr-2" />
                Monitor
              </TabsTrigger>
            </TabsList>
            
            {/* Audio Processor Tab */}
            <TabsContent value="processor" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Left Column - Processing Modules */}
                <div className="md:col-span-8 space-y-4">
                  {/* Input Format Selection */}
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-yellow-500 flex items-center">
                        <Radio className="h-5 w-5 mr-2" />
                        Input Format
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {["wav", "mp3", "aac", "flac", "asio", "wasapi", "direct", "test"].map((format) => (
                          <Button
                            key={format}
                            variant={processorSettings.inputFormat === format ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleInputFormatChange(format)}
                            className="capitalize"
                          >
                            {format}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                
                  {/* Multiband Compressor Card - Showing for the current active section */}
                  {activeSection === 'multiband' && (
                    <Card className="bg-gray-900 border-gray-800">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg text-yellow-500 flex items-center justify-between">
                          <div className="flex items-center">
                            <BarChart className="h-5 w-5 mr-2" />
                            Multiband Compressor
                          </div>
                          <Switch 
                            checked={processorSettings.multibandCompressor.enabled}
                            onCheckedChange={(value) => handleToggleChange('multibandCompressor', value)}
                          />
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {/* Band Selection Tabs */}
                        <div className="grid grid-cols-5 gap-1 mb-4">
                          {processorSettings.multibandCompressor.bands.map((band) => (
                            <Button
                              key={band.id}
                              variant={activeBandId === band.id ? "default" : "outline"}
                              size="sm"
                              className={`text-xs ${activeBandId === band.id ? `bg-${getBandColor(band.id)}-600` : ''}`}
                              onClick={() => handleBandSelectionChange(band.id)}
                            >
                              Band {band.id}
                            </Button>
                          ))}
                        </div>
                        
                        {/* Active Band Settings */}
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-300">
                              Band {activeBand.id}: {activeBand.lowFreq} Hz - {activeBand.highFreq} Hz
                            </span>
                            <div className="flex items-center space-x-2">
                              <Label htmlFor="mb-enable" className="text-xs">Enable</Label>
                              <Switch 
                                id="mb-enable"
                                checked={activeBand.enabled}
                                onCheckedChange={handleMultibandToggleChange}
                                disabled={!processorSettings.multibandCompressor.enabled}
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="mb-threshold">Threshold ({activeBand.threshold} dB)</Label>
                              <Slider
                                id="mb-threshold"
                                min={-60}
                                max={0}
                                step={0.5}
                                value={[activeBand.threshold]}
                                onValueChange={(value) => handleMultibandCompressorChange('threshold', value)}
                                disabled={!activeBand.enabled || !processorSettings.multibandCompressor.enabled}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="mb-ratio">Ratio ({activeBand.ratio}:1)</Label>
                              <Slider
                                id="mb-ratio"
                                min={1}
                                max={20}
                                step={0.1}
                                value={[activeBand.ratio]}
                                onValueChange={(value) => handleMultibandCompressorChange('ratio', value)}
                                disabled={!activeBand.enabled || !processorSettings.multibandCompressor.enabled}
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="mb-attack">Attack ({activeBand.attack} ms)</Label>
                              <Slider
                                id="mb-attack"
                                min={0.1}
                                max={100}
                                step={0.1}
                                value={[activeBand.attack]}
                                onValueChange={(value) => handleMultibandCompressorChange('attack', value)}
                                disabled={!activeBand.enabled || !processorSettings.multibandCompressor.enabled}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="mb-release">Release ({activeBand.release} ms)</Label>
                              <Slider
                                id="mb-release"
                                min={5}
                                max={1000}
                                step={5}
                                value={[activeBand.release]}
                                onValueChange={(value) => handleMultibandCompressorChange('release', value)}
                                disabled={!activeBand.enabled || !processorSettings.multibandCompressor.enabled}
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="mb-knee">Knee ({activeBand.knee} dB)</Label>
                              <Slider
                                id="mb-knee"
                                min={0}
                                max={24}
                                step={0.5}
                                value={[activeBand.knee]}
                                onValueChange={(value) => handleMultibandCompressorChange('knee', value)}
                                disabled={!activeBand.enabled || !processorSettings.multibandCompressor.enabled}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="mb-gain">Makeup Gain ({activeBand.gain} dB)</Label>
                              <Slider
                                id="mb-gain"
                                min={0}
                                max={24}
                                step={0.5}
                                value={[activeBand.gain]}
                                onValueChange={(value) => handleMultibandCompressorChange('gain', value)}
                                disabled={!activeBand.enabled || !processorSettings.multibandCompressor.enabled}
                              />
                            </div>
                          </div>
                          
                          <div className="mt-3 flex justify-between items-center">
                            <div className="flex items-center">
                              <Label htmlFor="mb-mode" className="text-xs mr-2">Mode:</Label>
                              <Select 
                                defaultValue={activeBand.mode}
                                disabled={!activeBand.enabled || !processorSettings.multibandCompressor.enabled}
                              >
                                <SelectTrigger className="h-7 w-32 text-xs">
                                  <SelectValue placeholder="Mode" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="downward">Downward</SelectItem>
                                  <SelectItem value="upward">Upward</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Label htmlFor="mb-solo" className="text-xs">Solo</Label>
                              <Switch 
                                id="mb-solo"
                                disabled={!activeBand.enabled || !processorSettings.multibandCompressor.enabled} 
                              />
                              <Label htmlFor="mb-bypass" className="text-xs ml-2">Bypass</Label>
                              <Switch 
                                id="mb-bypass"
                                disabled={!processorSettings.multibandCompressor.enabled} 
                              />
                            </div>
                          </div>
                          
                          {/* Frequency Range Visualization */}
                          <div className="space-y-2 mb-2">
                            <div className="flex justify-between text-xs text-gray-400">
                              <span>20 Hz</span>
                              <span>150 Hz</span>
                              <span>700 Hz</span>
                              <span>4 kHz</span>
                              <span>20 kHz</span>
                            </div>
                            <div className="h-2 bg-gradient-to-r from-blue-500 via-green-500 to-red-500 rounded-full relative">
                              {/* Crossover points */}
                              <div className="absolute top-0 left-[15%] h-full w-0.5 bg-white"></div>
                              <div className="absolute top-0 left-[35%] h-full w-0.5 bg-white"></div>
                              <div className="absolute top-0 left-[65%] h-full w-0.5 bg-white"></div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Other audio processing content would go here, switched based on activeSection */}
                </div>
                
                {/* Right Column - Meters and Visual Feedback */}
                <div className="md:col-span-4 space-y-4">
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-blue-500">Input/Output Meters</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Input Level</p>
                          <div className="h-6 bg-gray-800 rounded-sm overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 animate-pulse" style={{ width: '65%' }}></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>-30dB</span>
                            <span>-18dB</span>
                            <span>-12dB</span>
                            <span>-6dB</span>
                            <span>0dB</span>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Output Level</p>
                          <div className="h-6 bg-gray-800 rounded-sm overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 animate-pulse" style={{ width: '80%' }}></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>-30dB</span>
                            <span>-18dB</span>
                            <span>-12dB</span>
                            <span>-6dB</span>
                            <span>0dB</span>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Gain Reduction</p>
                          <div className="h-6 bg-gray-800 rounded-sm overflow-hidden">
                            <div className="h-full bg-blue-500 animate-pulse" style={{ width: '40%' }}></div>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>0dB</span>
                            <span>-3dB</span>
                            <span>-6dB</span>
                            <span>-12dB</span>
                            <span>-24dB</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-purple-500">Spectrum Analyzer</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-40 bg-gray-800 rounded-sm p-2 flex items-end space-x-1">
                        {/* Simulated spectrum bars */}
                        {Array.from({ length: 32 }).map((_, i) => {
                          const height = Math.floor(Math.random() * 60) + 20;
                          return (
                            <div
                              key={i}
                              className="flex-1 bg-gradient-to-t from-blue-500 to-purple-500 rounded-t-sm"
                              style={{ height: `${height}%` }}
                            ></div>
                          );
                        })}
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>20Hz</span>
                        <span>100Hz</span>
                        <span>500Hz</span>
                        <span>1kHz</span>
                        <span>5kHz</span>
                        <span>20kHz</span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg text-green-500">Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Input Format:</span>
                          <span className="text-sm text-white font-medium capitalize">{processorSettings.inputFormat}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Sample Rate:</span>
                          <span className="text-sm text-white font-medium">48 kHz</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Stream Status:</span>
                          <span className="text-sm font-medium text-green-500">Connected</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Active Listeners:</span>
                          <span className="text-sm text-white font-medium">23</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Processor Active:</span>
                          <Switch checked={processorSettings.enabled} onCheckedChange={(value) => setProcessorSettings(prev => ({ ...prev, enabled: value }))} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            {/* Streaming Config Tab */}
            <TabsContent value="streaming" className="space-y-4">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg text-blue-500">Stream Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="server-url">Server URL</Label>
                        <input
                          id="server-url"
                          className="w-full rounded-md bg-gray-800 border-gray-700 text-white"
                          value={streamSettings.serverUrl}
                          onChange={(e) => setStreamSettings(prev => ({ ...prev, serverUrl: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="server-port">Port</Label>
                        <input
                          id="server-port"
                          type="number"
                          className="w-full rounded-md bg-gray-800 border-gray-700 text-white"
                          value={streamSettings.port}
                          onChange={(e) => setStreamSettings(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="mount-point">Mount Point</Label>
                        <input
                          id="mount-point"
                          className="w-full rounded-md bg-gray-800 border-gray-700 text-white"
                          value={streamSettings.mountPoint}
                          onChange={(e) => setStreamSettings(prev => ({ ...prev, mountPoint: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <input
                          id="password"
                          type="password"
                          className="w-full rounded-md bg-gray-800 border-gray-700 text-white"
                          value={streamSettings.password}
                          onChange={(e) => setStreamSettings(prev => ({ ...prev, password: e.target.value }))}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="format">Format</Label>
                        <Select
                          value={streamSettings.format}
                          onValueChange={(value) => setStreamSettings(prev => ({ ...prev, format: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Format" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mp3">MP3</SelectItem>
                            <SelectItem value="aac">AAC</SelectItem>
                            <SelectItem value="ogg">OGG Vorbis</SelectItem>
                            <SelectItem value="opus">Opus</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bitrate">Bitrate (kbps)</Label>
                        <Select
                          value={streamSettings.bitrate.toString()}
                          onValueChange={(value) => setStreamSettings(prev => ({ ...prev, bitrate: parseInt(value) }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Bitrate" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="64">64 kbps</SelectItem>
                            <SelectItem value="96">96 kbps</SelectItem>
                            <SelectItem value="128">128 kbps</SelectItem>
                            <SelectItem value="192">192 kbps</SelectItem>
                            <SelectItem value="256">256 kbps</SelectItem>
                            <SelectItem value="320">320 kbps</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sample-rate">Sample Rate (Hz)</Label>
                        <Select
                          value={streamSettings.sampleRate.toString()}
                          onValueChange={(value) => setStreamSettings(prev => ({ ...prev, sampleRate: parseInt(value) }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sample Rate" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="22050">22050 Hz</SelectItem>
                            <SelectItem value="44100">44100 Hz</SelectItem>
                            <SelectItem value="48000">48000 Hz</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="public-server"
                          checked={streamSettings.publicServer}
                          onCheckedChange={(value) => setStreamSettings(prev => ({ ...prev, publicServer: value }))}
                        />
                        <Label htmlFor="public-server">List on public server directory</Label>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="server-name">Stream Name</Label>
                        <input
                          id="server-name"
                          className="w-full rounded-md bg-gray-800 border-gray-700 text-white"
                          value={streamSettings.serverName}
                          onChange={(e) => setStreamSettings(prev => ({ ...prev, serverName: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="server-genre">Genre</Label>
                        <input
                          id="server-genre"
                          className="w-full rounded-md bg-gray-800 border-gray-700 text-white"
                          value={streamSettings.serverGenre}
                          onChange={(e) => setStreamSettings(prev => ({ ...prev, serverGenre: e.target.value }))}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="server-description">Description</Label>
                      <textarea
                        id="server-description"
                        className="w-full rounded-md bg-gray-800 border-gray-700 text-white"
                        rows={3}
                        value={streamSettings.serverDescription}
                        onChange={(e) => setStreamSettings(prev => ({ ...prev, serverDescription: e.target.value }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="server-url2">Website URL</Label>
                      <input
                        id="server-url2"
                        className="w-full rounded-md bg-gray-800 border-gray-700 text-white"
                        value={streamSettings.serverUrl2}
                        onChange={(e) => setStreamSettings(prev => ({ ...prev, serverUrl2: e.target.value }))}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center pt-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="stream-enabled"
                          checked={streamSettings.enabled}
                          onCheckedChange={(value) => setStreamSettings(prev => ({ ...prev, enabled: value }))}
                        />
                        <Label htmlFor="stream-enabled">Enable Streaming</Label>
                      </div>
                      
                      <Button
                        onClick={handleSaveStreamSettings}
                        disabled={saveStreamSettingsMutation.isPending}
                      >
                        Save Stream Settings
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Monitor Tab */}
            <TabsContent value="monitor" className="space-y-4">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg text-purple-500">Stream Monitoring</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-gray-800 p-4 rounded-md">
                      <h3 className="text-lg font-medium text-white mb-2">Stream Status</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-400">Status:</p>
                          <p className="text-sm font-medium text-green-500">Connected</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-400">Uptime:</p>
                          <p className="text-sm font-medium text-white">3h 45m</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-400">Current Listeners:</p>
                          <p className="text-sm font-medium text-white">23</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-400">Peak Listeners:</p>
                          <p className="text-sm font-medium text-white">42</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-400">Data Transfer:</p>
                          <p className="text-sm font-medium text-white">2.3 GB</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-gray-400">Bitrate:</p>
                          <p className="text-sm font-medium text-white">{streamSettings.bitrate} kbps</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-800 p-4 rounded-md">
                      <h3 className="text-lg font-medium text-white mb-2">Listener Chart</h3>
                      <div className="h-60 bg-gray-900 rounded-md p-3">
                        {/* Placeholder for listener chart */}
                        <div className="h-full w-full bg-gradient-to-r from-gray-900 to-gray-800 rounded-md border border-gray-700 flex items-center justify-center">
                          <p className="text-gray-500">Listener statistics chart would appear here</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-800 p-4 rounded-md">
                      <h3 className="text-lg font-medium text-white mb-2">Stream Link</h3>
                      <div className="flex items-center space-x-2">
                        <input
                          className="flex-1 rounded-md bg-gray-900 border-gray-700 text-white"
                          value={`${streamSettings.serverUrl}:${streamSettings.port}${streamSettings.mountPoint}`}
                          readOnly
                        />
                        <Button variant="outline" size="sm">
                          Copy
                        </Button>
                      </div>
                      <div className="mt-4">
                        <Button variant="outline" size="sm">
                          <Headphones className="h-4 w-4 mr-2" />
                          Listen to Stream
                        </Button>
                      </div>
                    </div>
                    
                    <div className="bg-yellow-500/10 p-4 rounded-md">
                      <div className="flex items-start">
                        <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                        <div>
                          <h3 className="text-lg font-medium text-yellow-500 mb-1">Important Notes</h3>
                          <p className="text-sm text-yellow-200/80">
                            1. Ensure you have the necessary rights to broadcast the content.
                          </p>
                          <p className="text-sm text-yellow-200/80">
                            2. Some ISPs may block streaming ports. If you have connection issues, contact your provider.
                          </p>
                          <p className="text-sm text-yellow-200/80">
                            3. Higher bitrates provide better quality but require more bandwidth for both server and listeners.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
};

export default InternetRadioPage;
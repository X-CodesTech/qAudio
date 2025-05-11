import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  AudioLines, 
  Mic, 
  Save, 
  FileAudio, 
  AudioWaveform, 
  Plus, 
  Settings, 
  Trash2, 
  Play, 
  Download, 
  Scissors, 
  Flag,
  HardDrive,
  Clock,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from '@/components/ui/switch';

// Type definitions for the Audio Logger
type AudioLoggerConfig = {
  id: number;
  name: string;
  inputType: 'microphone' | 'line' | 'sip' | 'internal' | 'stream';
  inputDevice?: string;
  inputChannel: number;
  folderId?: number;
  folderPath?: string;
  isActive: boolean;
  fileFormat: string;
  bitrate: number;
  sampleRate: number;
  channels: number;
  segmentDuration: number;
  retentionDays: number;
  schedule?: string;
  triggerType: 'continuous' | 'vox' | 'manual' | 'scheduled';
  triggerThreshold: number;
  minDuration: number;
  maxDuration?: number;
};

type AudioRecording = {
  id: number;
  configId: number;
  title: string;
  path: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  fileSize?: number;
  format: string;
  waveformData?: string;
  tags?: string[];
  notes?: string;
  isArchived: boolean;
  isFlagged: boolean;
  isProcessed: boolean;
  triggerType: string;
  peakLevel?: number;
};

type AudioRecordingMarker = {
  id: number;
  recordingId: number;
  timestamp: number;
  type: 'marker' | 'chapter' | 'note' | 'edit';
  label?: string;
  color?: string;
  note?: string;
};

const AudioLoggerPage: React.FC = () => {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState('recorders');
  const [selectedConfig, setSelectedConfig] = useState<AudioLoggerConfig | null>(null);
  const [selectedRecording, setSelectedRecording] = useState<AudioRecording | null>(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [isRecordingDialogOpen, setIsRecordingDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Mock data for initial UI development, with audio levels
  const [loggerConfigs, setLoggerConfigs] = useState<(AudioLoggerConfig & { audioLevels?: { left: number; right: number } })[]>([
    {
      id: 1,
      name: 'Studio A Main Mic',
      inputType: 'microphone',
      inputDevice: 'Audio Interface 1',
      inputChannel: 1,
      folderId: 1,
      folderPath: '/recordings/studio-a',
      isActive: true,
      fileFormat: 'flac',
      bitrate: 320,
      sampleRate: 44100,
      channels: 2,
      segmentDuration: 3600,
      retentionDays: 30,
      triggerType: 'continuous',
      triggerThreshold: 0.1,
      minDuration: 10,
      audioLevels: { left: -18, right: -20 }
    },
    {
      id: 2,
      name: 'Studio B Call Line',
      inputType: 'sip',
      inputDevice: 'SIP:12345',
      inputChannel: 0,
      folderId: 2,
      folderPath: '/recordings/studio-b/calls',
      isActive: true,
      fileFormat: 'mp3',
      bitrate: 192,
      sampleRate: 48000,
      channels: 1,
      segmentDuration: 1800,
      retentionDays: 90,
      triggerType: 'vox',
      triggerThreshold: 0.2,
      minDuration: 5,
      audioLevels: { left: -22, right: -22 }
    },
    {
      id: 3,
      name: 'Stream Recorder',
      inputType: 'stream',
      inputDevice: 'http://stream.example.com/live',
      inputChannel: 0,
      folderId: 3,
      folderPath: '/recordings/streams',
      isActive: false,
      fileFormat: 'mp3',
      bitrate: 256,
      sampleRate: 44100,
      channels: 2,
      segmentDuration: 7200,
      retentionDays: 14,
      triggerType: 'scheduled',
      triggerThreshold: 0,
      minDuration: 300,
      schedule: JSON.stringify({
        days: [1, 2, 3, 4, 5], // Mon-Fri
        startTime: '09:00',
        endTime: '17:00'
      }),
      audioLevels: { left: 0, right: 0 }
    }
  ]);

  // Fetch logger configs
  const { data: configsData, isLoading: isLoadingConfigs, error: configsError } = useQuery({
    queryKey: ['/api/audio-logger/configs'],
    queryFn: async () => {
      // In real app, this would fetch from API
      return Promise.resolve(loggerConfigs);
    },
    enabled: false // Disable for now since we're using mock data
  });

  // Fetch recordings
  const { data: recordingsData, isLoading: isLoadingRecordings, error: recordingsError } = useQuery({
    queryKey: ['/api/audio-logger/recordings'],
    queryFn: async () => {
      // Mock data for recordings
      const mockRecordings: AudioRecording[] = [
        {
          id: 1,
          configId: 1,
          title: 'Morning Show 2023-05-01',
          path: '/recordings/studio-a/2023-05-01-morning-show.flac',
          startTime: '2023-05-01T06:00:00Z',
          endTime: '2023-05-01T10:00:00Z',
          duration: 14400,
          fileSize: 2048000000,
          format: 'flac',
          waveformData: '[...]',
          tags: ['morning-show', 'interview'],
          isArchived: false,
          isFlagged: false,
          isProcessed: true,
          triggerType: 'continuous',
          peakLevel: -6.2
        },
        {
          id: 2,
          configId: 2,
          title: 'Call with Mayor 2023-05-02',
          path: '/recordings/studio-b/calls/2023-05-02-mayor.mp3',
          startTime: '2023-05-02T14:30:00Z',
          endTime: '2023-05-02T15:15:00Z',
          duration: 2700,
          fileSize: 38000000,
          format: 'mp3',
          tags: ['interview', 'politics'],
          notes: 'Important call with mayor about city budget',
          isArchived: false,
          isFlagged: true,
          isProcessed: true,
          triggerType: 'manual',
          peakLevel: -12.5
        }
      ];
      return Promise.resolve(mockRecordings);
    },
    enabled: false // Disable for now since we're using mock data
  });

  const handleAddConfig = () => {
    setSelectedConfig(null);
    setIsConfigDialogOpen(true);
  };

  const handleEditConfig = (config: AudioLoggerConfig) => {
    setSelectedConfig(config);
    setIsConfigDialogOpen(true);
  };

  const handleToggleConfigActive = (configId: number, isActive: boolean) => {
    setLoggerConfigs(prev => 
      prev.map(config => 
        config.id === configId ? { ...config, isActive } : config
      )
    );
    toast({
      title: isActive ? "Recorder Activated" : "Recorder Deactivated",
      description: `The recorder has been ${isActive ? 'activated' : 'deactivated'}.`,
      duration: 3000,
    });
  };

  const handleViewRecording = (recording: AudioRecording) => {
    setSelectedRecording(recording);
    setIsRecordingDialogOpen(true);
  };

  const handleExportRecording = (recording: AudioRecording) => {
    toast({
      title: "Export Started",
      description: "The recording export has been initiated.",
      duration: 3000,
    });
  };

  const handleDeleteRecording = (recordingId: number) => {
    toast({
      title: "Recording Deleted",
      description: "The recording has been deleted.",
      duration: 3000,
    });
  };

  // Each recorder/input configuration card
  const RecorderCard = ({ config }: { config: AudioLoggerConfig & { audioLevels?: { left: number; right: number } } }) => {
    // For audio meters, we use a range of -60dB to 0dB
    // Convert to a percentage for the progress component (0 to 100)
    const leftLevel = config.audioLevels ? Math.min(100, Math.max(0, (config.audioLevels.left + 60) * 1.66)) : 0;
    const rightLevel = config.audioLevels ? Math.min(100, Math.max(0, (config.audioLevels.right + 60) * 1.66)) : 0;
    
    // Get meter color based on level (green, yellow, red)
    const getAudioLevelColor = (level: number) => {
      if (level < 70) return "bg-green-500"; // Below -18dB
      if (level < 85) return "bg-yellow-500"; // Between -18dB and -9dB
      return "bg-red-500"; // Above -9dB
    };
    
    const leftLevelColor = getAudioLevelColor(leftLevel);
    const rightLevelColor = getAudioLevelColor(rightLevel);
    
    return (
      <Card className="overflow-hidden border-gray-700 bg-gray-800/70">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {config.inputType === 'microphone' && <Mic className="h-5 w-5 text-blue-400" />}
              {config.inputType === 'sip' && <AudioLines className="h-5 w-5 text-green-400" />}
              {config.inputType === 'stream' && <AudioWaveform className="h-5 w-5 text-purple-400" />}
              {config.inputType === 'line' && <AudioLines className="h-5 w-5 text-orange-400" />}
              {config.inputType === 'internal' && <AudioLines className="h-5 w-5 text-pink-400" />}
              <CardTitle className="text-lg font-semibold">{config.name}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Switch 
                checked={config.isActive} 
                onCheckedChange={(checked) => handleToggleConfigActive(config.id, checked)}
              />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleEditConfig(config)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>
            {config.inputType === 'microphone' && 'Microphone Input'}
            {config.inputType === 'sip' && 'SIP Phone Line'}
            {config.inputType === 'stream' && 'Stream Input'}
            {config.inputType === 'line' && 'Line Input'}
            {config.inputType === 'internal' && 'Internal Audio'} 
            {config.inputDevice && ` - ${config.inputDevice}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-1">
              <HardDrive className="h-4 w-4 text-gray-400" />
              <span className="text-gray-300">{config.folderPath}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-gray-300">{config.segmentDuration / 60} minutes per file</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-300">{config.retentionDays} days retention</span>
            </div>
            <div className="flex items-center gap-1">
              <FileAudio className="h-4 w-4 text-gray-400" />
              <span className="text-gray-300">{config.fileFormat.toUpperCase()} {config.bitrate}kbps</span>
            </div>
          </div>

          {/* Audio level meters */}
          <div className="mt-3">
            <div className="flex items-center mb-1">
              <span className="text-xs text-gray-400 w-10">Left</span>
              <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className={`h-full ${leftLevelColor}`} style={{ width: `${leftLevel}%`, transition: 'width 0.1s ease-out' }}></div>
              </div>
              <span className="text-xs text-gray-400 w-10 text-right">{config.audioLevels?.left || 0} dB</span>
            </div>
            <div className="flex items-center">
              <span className="text-xs text-gray-400 w-10">Right</span>
              <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className={`h-full ${rightLevelColor}`} style={{ width: `${rightLevel}%`, transition: 'width 0.1s ease-out' }}></div>
              </div>
              <span className="text-xs text-gray-400 w-10 text-right">{config.audioLevels?.right || 0} dB</span>
            </div>
          </div>

          {/* Live recording indicator (if active) */}
          {config.isActive && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2"></div>
                  <span className="text-xs text-red-400">Recording</span>
                </div>
                <span className="text-xs text-gray-400">01:23:45</span>
              </div>
              <Progress value={65} className="h-1.5 bg-gray-700" />
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Recording entry component
  const RecordingItem = ({ recording }: { recording: AudioRecording }) => {
    const recordingDate = new Date(recording.startTime);
    const formattedDate = recordingDate.toLocaleDateString();
    const formattedTime = recordingDate.toLocaleTimeString();
    const durationFormatted = recording.duration ? 
      `${Math.floor(recording.duration / 3600)}:${String(Math.floor((recording.duration % 3600) / 60)).padStart(2, '0')}:${String(Math.floor(recording.duration % 60)).padStart(2, '0')}` : 
      '--:--:--';
    
    return (
      <div className="p-3 rounded-md bg-gray-800 border border-gray-700 hover:bg-gray-750">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-white flex items-center gap-2">
              {recording.isFlagged && <Flag className="h-3.5 w-3.5 text-amber-500" />}
              {recording.title}
            </h3>
            <div className="text-xs text-gray-400 mt-1">
              {formattedDate} {formattedTime} • {durationFormatted} • {recording.format.toUpperCase()}
            </div>
          </div>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" onClick={() => handleViewRecording(recording)}>
              <Play className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => handleExportRecording(recording)}>
              <Download className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => handleDeleteRecording(recording.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {recording.tags && recording.tags.length > 0 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {recording.tags.map((tag, i) => (
              <span key={i} className="inline-flex px-2 py-0.5 rounded-full bg-gray-700 text-xs text-gray-300">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Configuration dialog content
  const ConfigDialogContent = () => {
    const isEditing = !!selectedConfig;
    const [formData, setFormData] = useState<Partial<AudioLoggerConfig>>({
      name: '',
      inputType: 'microphone',
      inputDevice: '',
      inputChannel: 0,
      folderPath: '',
      isActive: true,
      fileFormat: 'flac',
      bitrate: 320,
      sampleRate: 44100,
      channels: 2,
      segmentDuration: 3600,
      retentionDays: 30,
      triggerType: 'continuous',
      triggerThreshold: 0.1,
      minDuration: 10
    });

    useEffect(() => {
      if (selectedConfig) {
        setFormData(selectedConfig);
      }
    }, [selectedConfig]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value, type } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) : value
      }));
    };

    const handleSelectChange = (name: string, value: string) => {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    };

    const handleSaveConfig = () => {
      // If we're adding a new config (not editing), check the limit
      if (!isEditing && loggerConfigs.length >= 8) {
        toast({
          title: "Maximum Recorders Reached",
          description: "You can only have up to 8 audio logger recorders.",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }

      toast({
        title: isEditing ? "Configuration Updated" : "Configuration Added",
        description: isEditing 
          ? "The recorder configuration has been updated." 
          : "A new recorder configuration has been added.",
        duration: 3000,
      });
      
      setIsConfigDialogOpen(false);
    };

    return (
      <DialogContent className="max-w-2xl bg-gray-900">
        <DialogHeader>
          <DialogTitle className="text-xl">{isEditing ? 'Edit' : 'Add'} Audio Logger Configuration</DialogTitle>
          <DialogDescription>
            Configure the settings for this audio recording input.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                name="name" 
                value={formData.name} 
                onChange={handleInputChange} 
                className="bg-gray-800"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="inputType">Input Type</Label>
              <Select 
                value={formData.inputType} 
                onValueChange={(value) => handleSelectChange('inputType', value)}
              >
                <SelectTrigger className="bg-gray-800">
                  <SelectValue placeholder="Select input type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800">
                  <SelectItem value="microphone">Microphone</SelectItem>
                  <SelectItem value="line">Line Input</SelectItem>
                  <SelectItem value="sip">SIP Phone</SelectItem>
                  <SelectItem value="internal">Internal Audio</SelectItem>
                  <SelectItem value="stream">Stream URL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="inputDevice">Device/Source</Label>
              <Input 
                id="inputDevice" 
                name="inputDevice" 
                value={formData.inputDevice || ''} 
                onChange={handleInputChange} 
                className="bg-gray-800"
                placeholder={formData.inputType === 'stream' ? 'https://stream.example.com/live' : 'Device name or ID'}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="folderPath">Recording Folder</Label>
              <Input 
                id="folderPath" 
                name="folderPath" 
                value={formData.folderPath || ''} 
                onChange={handleInputChange} 
                className="bg-gray-800"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fileFormat">File Format</Label>
              <Select 
                value={formData.fileFormat} 
                onValueChange={(value) => handleSelectChange('fileFormat', value)}
              >
                <SelectTrigger className="bg-gray-800">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800">
                  <SelectItem value="flac">FLAC</SelectItem>
                  <SelectItem value="wav">WAV</SelectItem>
                  <SelectItem value="mp3">MP3</SelectItem>
                  <SelectItem value="aac">AAC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bitrate">Bitrate (kbps)</Label>
              <Input 
                id="bitrate" 
                name="bitrate" 
                type="number" 
                value={formData.bitrate} 
                onChange={handleInputChange} 
                className="bg-gray-800"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sampleRate">Sample Rate (Hz)</Label>
              <Select 
                value={formData.sampleRate?.toString()} 
                onValueChange={(value) => handleSelectChange('sampleRate', value)}
              >
                <SelectTrigger className="bg-gray-800">
                  <SelectValue placeholder="Select sample rate" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800">
                  <SelectItem value="44100">44.1 kHz</SelectItem>
                  <SelectItem value="48000">48 kHz</SelectItem>
                  <SelectItem value="96000">96 kHz</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="channels">Channels</Label>
              <Select 
                value={formData.channels?.toString()} 
                onValueChange={(value) => handleSelectChange('channels', value)}
              >
                <SelectTrigger className="bg-gray-800">
                  <SelectValue placeholder="Select channels" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800">
                  <SelectItem value="1">Mono (1)</SelectItem>
                  <SelectItem value="2">Stereo (2)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="segmentDuration">Segment Duration (minutes)</Label>
              <Input 
                id="segmentDuration" 
                name="segmentDuration" 
                type="number" 
                value={formData.segmentDuration ? formData.segmentDuration / 60 : 60} 
                onChange={(e) => {
                  const minutes = parseFloat(e.target.value);
                  setFormData(prev => ({
                    ...prev,
                    segmentDuration: minutes * 60
                  }));
                }} 
                className="bg-gray-800"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="retentionDays">Retention Period (days)</Label>
              <Input 
                id="retentionDays" 
                name="retentionDays" 
                type="number" 
                value={formData.retentionDays} 
                onChange={handleInputChange} 
                className="bg-gray-800"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="triggerType">Recording Trigger</Label>
              <Select 
                value={formData.triggerType} 
                onValueChange={(value) => handleSelectChange('triggerType', value)}
              >
                <SelectTrigger className="bg-gray-800">
                  <SelectValue placeholder="Select trigger type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800">
                  <SelectItem value="continuous">Continuous</SelectItem>
                  <SelectItem value="vox">Voice Activated (VOX)</SelectItem>
                  <SelectItem value="manual">Manual Start/Stop</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveConfig}>Save Configuration</Button>
        </DialogFooter>
      </DialogContent>
    );
  };

  // Recording dialog content
  const RecordingDialogContent = () => {
    if (!selectedRecording) return null;
    
    const recordingDate = new Date(selectedRecording.startTime);
    const formattedDate = recordingDate.toLocaleDateString();
    const formattedTime = recordingDate.toLocaleTimeString();
    const durationFormatted = selectedRecording.duration ? 
      `${Math.floor(selectedRecording.duration / 3600)}:${String(Math.floor((selectedRecording.duration % 3600) / 60)).padStart(2, '0')}:${String(Math.floor(selectedRecording.duration % 60)).padStart(2, '0')}` : 
      '--:--:--';

    return (
      <DialogContent className="max-w-4xl bg-gray-900">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            {selectedRecording.isFlagged && <Flag className="h-4 w-4 text-amber-500" />}
            {selectedRecording.title}
          </DialogTitle>
          <DialogDescription>
            {formattedDate} {formattedTime} • {durationFormatted} • {selectedRecording.format.toUpperCase()}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {/* Waveform placeholder */}
          <div className="w-full h-32 bg-gray-800 rounded-md mb-4 flex items-center justify-center">
            <AudioWaveform className="h-16 w-16 text-gray-600" />
          </div>
          
          <div className="flex justify-center mb-4 gap-2">
            <Button>
              <Play className="h-4 w-4 mr-2" />
              Play
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline">
              <Scissors className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline">
              <Flag className="h-4 w-4 mr-2" />
              Flag
            </Button>
          </div>
          
          <Separator className="my-4" />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Recording Details</h3>
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-3">
                  <span className="text-gray-400">Source</span>
                  <span className="text-white col-span-2">Studio A Main Mic</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-gray-400">File Path</span>
                  <span className="text-white col-span-2">{selectedRecording.path}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-gray-400">File Size</span>
                  <span className="text-white col-span-2">{selectedRecording.fileSize ? `${(selectedRecording.fileSize / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}</span>
                </div>
                <div className="grid grid-cols-3">
                  <span className="text-gray-400">Peak Level</span>
                  <span className="text-white col-span-2">{selectedRecording.peakLevel ? `${selectedRecording.peakLevel} dB` : 'Unknown'}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Tags & Notes</h3>
              {selectedRecording.tags && selectedRecording.tags.length > 0 && (
                <div className="flex gap-2 mb-3 flex-wrap">
                  {selectedRecording.tags.map((tag, i) => (
                    <span key={i} className="inline-flex px-2 py-0.5 rounded-full bg-gray-700 text-xs text-gray-300">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              
              <p className="text-sm text-gray-300">
                {selectedRecording.notes || 'No notes available for this recording.'}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <AudioLines className="h-8 w-8 text-indigo-400 mr-3" />
            <h1 className="text-3xl font-bold">Audio Logger</h1>
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-8">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="recorders" className="data-[state=active]:bg-indigo-900">
              Recorders
            </TabsTrigger>
            <TabsTrigger value="recordings" className="data-[state=active]:bg-indigo-900">
              Recordings
            </TabsTrigger>
            <TabsTrigger value="export" className="data-[state=active]:bg-indigo-900">
              Export
            </TabsTrigger>
          </TabsList>

          {/* Recorders Tab */}
          <TabsContent value="recorders" className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Recording Inputs</h2>
              <Button 
                onClick={handleAddConfig} 
                disabled={loggerConfigs.length >= 8}
                title={loggerConfigs.length >= 8 ? "Maximum of 8 recorders allowed" : "Add a new recorder"}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Recorder {loggerConfigs.length >= 8 ? `(${loggerConfigs.length}/8)` : ""}
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loggerConfigs.map(config => (
                <RecorderCard key={config.id} config={config} />
              ))}
            </div>
          </TabsContent>

          {/* Recordings Tab */}
          <TabsContent value="recordings" className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Recorded Files</h2>
              <div className="flex gap-2">
                <Input 
                  placeholder="Search recordings..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 bg-gray-800"
                />
                <Input 
                  type="date" 
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-48 bg-gray-800"
                />
              </div>
            </div>
            
            <div className="space-y-3">
              {recordingsData ? (
                recordingsData.map(recording => (
                  <RecordingItem key={recording.id} recording={recording} />
                ))
              ) : (
                <div className="text-center py-12 text-gray-400">
                  No recordings found. Start a recorder to create recordings.
                </div>
              )}
            </div>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Export Manager</h2>
            </div>
            
            <Card className="bg-gray-800/70 border-gray-700">
              <CardHeader>
                <CardTitle>Batch Export</CardTitle>
                <CardDescription>
                  Export multiple recordings at once based on date range, tags, or other criteria.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input 
                      id="startDate" 
                      type="date" 
                      className="bg-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input 
                      id="endDate" 
                      type="date" 
                      className="bg-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fileFormat">Export Format</Label>
                    <Select defaultValue="mp3">
                      <SelectTrigger className="bg-gray-700">
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700">
                        <SelectItem value="original">Original Format</SelectItem>
                        <SelectItem value="mp3">MP3</SelectItem>
                        <SelectItem value="wav">WAV</SelectItem>
                        <SelectItem value="flac">FLAC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="destination">Destination</Label>
                    <Select defaultValue="local">
                      <SelectTrigger className="bg-gray-700">
                        <SelectValue placeholder="Select destination" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700">
                        <SelectItem value="local">Local Folder</SelectItem>
                        <SelectItem value="mediaLibrary">Media Library</SelectItem>
                        <SelectItem value="ftp">FTP Server</SelectItem>
                        <SelectItem value="cloud">Cloud Storage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button className="mt-4 w-full">Start Batch Export</Button>
              </CardContent>
            </Card>
            
            <div className="mt-6">
              <h3 className="text-xl font-semibold mb-4">Recent Exports</h3>
              <div className="text-center py-12 text-gray-400">
                No recent exports. Start an export to see it here.
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Configuration Dialog */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <ConfigDialogContent />
      </Dialog>
      
      {/* Recording Dialog */}
      <Dialog open={isRecordingDialogOpen} onOpenChange={setIsRecordingDialogOpen}>
        <RecordingDialogContent />
      </Dialog>
    </div>
  );
};

export default AudioLoggerPage;
import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  Calendar,
  Folder,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Clock,
  Download,
  FileAudio,
  Scissors,
  Save,
  Filter,
  Search,
  Bookmark,
  Loader2,
  HardDrive,
  SquareArrowOutUpRight,
  RefreshCw,
  Info,
  Check,
  X
} from 'lucide-react';

// Mock types for audio logger recordings
interface AudioLoggerConfig {
  id: number;
  name: string;
  inputType: 'microphone' | 'line' | 'sip' | 'stream' | 'internal';
  inputDevice: string;
  inputChannel: number;
  folderId: number;
  folderPath: string;
  isActive: boolean;
  fileFormat: string;
  bitrate: number;
  sampleRate: number;
  channels: number;
  segmentDuration: number;
  retentionDays: number;
  triggerType: 'continuous' | 'vox' | 'manual' | 'scheduled';
  triggerThreshold: number;
  minDuration: number;
  schedule?: string;
}

interface AudioRecording {
  id: number;
  configId: number;
  title: string;
  path: string;
  startTime: string;
  endTime: string;
  duration: number;
  fileSize: number;
  format: string;
  waveformData?: string;
  tags?: string[];
  notes?: string;
  isArchived: boolean;
  isFlagged: boolean;
  isProcessed: boolean;
  triggerType: string;
  peakLevel: number;
}

interface AudioSegment {
  id: number;
  recordingId: number;
  title: string;
  startTime: number; // in seconds from the start of the recording
  endTime: number; // in seconds from the start of the recording
  notes?: string;
  tags?: string[];
  isFlagged: boolean;
  isExported: boolean;
  createdAt: string;
}

const LoggerAccessPage: React.FC = () => {
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedSource, setSelectedSource] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [selectedRecording, setSelectedRecording] = useState<AudioRecording | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [markIn, setMarkIn] = useState<number | null>(null);
  const [markOut, setMarkOut] = useState<number | null>(null);
  const [segmentTitle, setSegmentTitle] = useState("");
  const [segmentNotes, setSegmentNotes] = useState("");
  const [segmentTags, setSegmentTags] = useState<string[]>([]);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState("mp3");
  const [exportQuality, setExportQuality] = useState("high");
  const [exportProgress, setExportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredRecordings, setFilteredRecordings] = useState<AudioRecording[]>([]);
  const [segments, setSegments] = useState<AudioSegment[]>([]);
  const [isSegmentProcessing, setIsSegmentProcessing] = useState(false);
  const [isLoadingWaveform, setIsLoadingWaveform] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");

  // Mock data for sources (logger configs)
  const [sources, setSources] = useState<AudioLoggerConfig[]>([
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
      minDuration: 10
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
      minDuration: 5
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
      })
    }
  ]);

  // Mock recordings for the selected source and date
  const [recordings, setRecordings] = useState<AudioRecording[]>([
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
      notes: 'Morning show with guest interview',
      isArchived: false,
      isFlagged: false,
      isProcessed: true,
      triggerType: 'continuous',
      peakLevel: -6.2
    },
    {
      id: 2,
      configId: 1,
      title: 'Afternoon Show 2023-05-01',
      path: '/recordings/studio-a/2023-05-01-afternoon-show.flac',
      startTime: '2023-05-01T14:00:00Z',
      endTime: '2023-05-01T16:00:00Z',
      duration: 7200,
      fileSize: 1024000000,
      format: 'flac',
      tags: ['afternoon-show', 'news'],
      isArchived: false,
      isFlagged: false,
      isProcessed: true,
      triggerType: 'continuous',
      peakLevel: -8.5
    },
    {
      id: 3,
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
  ]);

  // Mock segments for the selected recording
  const [mockSegments, setMockSegments] = useState<AudioSegment[]>([
    {
      id: 1,
      recordingId: 1,
      title: 'Weather Report',
      startTime: 1200, // 20 minutes in
      endTime: 1500, // 25 minutes in
      notes: 'Daily weather forecast',
      tags: ['weather', 'forecast'],
      isFlagged: false,
      isExported: true,
      createdAt: '2023-05-01T08:30:00Z'
    },
    {
      id: 2,
      recordingId: 1,
      title: 'Guest Interview',
      startTime: 3600, // 1 hour in
      endTime: 4500, // 1 hour 15 minutes in
      notes: 'Interview with local business owner',
      tags: ['interview', 'business'],
      isFlagged: true,
      isExported: false,
      createdAt: '2023-05-01T09:45:00Z'
    }
  ]);

  // useEffect to update filtered recordings when search term changes
  useEffect(() => {
    if (!recordings) return;
    
    const filtered = recordings.filter(recording => 
      recording.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recording.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
      recording.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredRecordings(filtered);
  }, [recordings, searchTerm]);

  // useEffect to fetch segments when recording is selected
  useEffect(() => {
    if (selectedRecording) {
      // In real app, fetch segments for selected recording
      setSegments(mockSegments.filter(segment => segment.recordingId === selectedRecording.id));
    } else {
      setSegments([]);
    }
  }, [selectedRecording, mockSegments]);

  // Audio control functions
  const togglePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration);
  };

  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    const newTime = value[0];
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    if (!audioRef.current) return;
    const newVolume = value[0];
    audioRef.current.volume = newVolume;
    setVolume(newVolume);
    if (newVolume === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const skipBackward = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
  };

  const skipForward = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 10);
  };

  // Mark in/out functions
  const handleSetMarkIn = () => {
    setMarkIn(currentTime);
    toast({
      title: "Mark In Set",
      description: `Mark in point set at ${formatTime(currentTime)}`,
      duration: 2000,
    });
  };

  const handleSetMarkOut = () => {
    setMarkOut(currentTime);
    toast({
      title: "Mark Out Set",
      description: `Mark out point set at ${formatTime(currentTime)}`,
      duration: 2000,
    });
  };

  const clearMarks = () => {
    setMarkIn(null);
    setMarkOut(null);
    toast({
      title: "Marks Cleared",
      description: "In and out points have been cleared",
      duration: 2000,
    });
  };

  // Segment creation
  const handleCreateSegment = () => {
    if (!selectedRecording || markIn === null || markOut === null) {
      toast({
        title: "Cannot Create Segment",
        description: "Please set both in and out points first",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (markIn >= markOut) {
      toast({
        title: "Invalid Segment",
        description: "Mark out must be after mark in",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (!segmentTitle.trim()) {
      toast({
        title: "Title Required",
        description: "Please provide a title for the segment",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setIsSegmentProcessing(true);

    // Simulate processing delay
    setTimeout(() => {
      const newSegment: AudioSegment = {
        id: Math.max(0, ...segments.map(s => s.id)) + 1,
        recordingId: selectedRecording.id,
        title: segmentTitle,
        startTime: markIn,
        endTime: markOut,
        notes: segmentNotes,
        tags: segmentTags,
        isFlagged: false,
        isExported: false,
        createdAt: new Date().toISOString()
      };

      setSegments([...segments, newSegment]);
      setSegmentTitle("");
      setSegmentNotes("");
      setSegmentTags([]);
      setIsSegmentProcessing(false);

      toast({
        title: "Segment Created",
        description: "Audio segment has been saved successfully",
        duration: 3000,
      });
    }, 1500);
  };

  // Export segment
  const handleExportSegment = () => {
    if (!selectedRecording || markIn === null || markOut === null) {
      toast({
        title: "Cannot Export",
        description: "Please set both in and out points first",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setIsExportDialogOpen(true);
  };

  const startExport = () => {
    setIsExporting(true);
    setExportProgress(0);

    // Simulate export progress
    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsExporting(false);
            setIsExportDialogOpen(false);
            toast({
              title: "Export Complete",
              description: `Segment exported as ${exportFormat.toUpperCase()} file`,
              duration: 3000,
            });
          }, 500);
          return 100;
        }
        return prev + 5;
      });
    }, 200);
  };

  // Formatting utilities
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return format(date, 'PPP');
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return format(date, 'PPp');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  // Mock waveform drawing
  const drawWaveform = () => {
    if (!waveformCanvasRef.current || !selectedRecording) return;
    
    const canvas = waveformCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsLoadingWaveform(true);
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Simulate loading delay
    setTimeout(() => {
      // Draw background
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw waveform
      const barWidth = 2;
      const barGap = 1;
      const totalBars = Math.floor(canvas.width / (barWidth + barGap));
      
      // Mock waveform data
      for (let i = 0; i < totalBars; i++) {
        // Generate random height based on position (for realistic-looking waveform)
        let height = 0;
        
        // Create a recurring pattern
        const position = i / totalBars; // 0 to 1
        const cycle = Math.sin(position * Math.PI * 20) * 0.5 + 0.5; // 0 to 1 with waves
        
        // Add some noise
        const noise = Math.random() * 0.2;
        
        // Combine pattern and noise
        height = ((cycle * 0.8) + noise) * (canvas.height * 0.8);
        
        // Ensure minimum height
        height = Math.max(2, height);
        
        const x = i * (barWidth + barGap);
        const y = (canvas.height - height) / 2;
        
        // Check if this bar is within mark in/out range
        let inSelectedRegion = false;
        if (markIn !== null && markOut !== null) {
          const barPosition = (i / totalBars) * duration;
          inSelectedRegion = barPosition >= markIn && barPosition <= markOut;
        }
        
        // Set color based on whether it's in the selected region
        ctx.fillStyle = inSelectedRegion ? '#3b82f6' : '#64748b';
        
        // Draw bar
        ctx.fillRect(x, y, barWidth, height);
      }
      
      // Draw mark in/out lines if set
      if (markIn !== null) {
        const x = (markIn / duration) * canvas.width;
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
        
        // Label
        ctx.fillStyle = '#22c55e';
        ctx.font = '10px sans-serif';
        ctx.fillText('IN', x + 2, 10);
      }
      
      if (markOut !== null) {
        const x = (markOut / duration) * canvas.width;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
        
        // Label
        ctx.fillStyle = '#ef4444';
        ctx.font = '10px sans-serif';
        ctx.fillText('OUT', x + 2, 10);
      }
      
      // Draw playhead
      const playheadX = (currentTime / duration) * canvas.width;
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, canvas.height);
      ctx.stroke();
      
      setIsLoadingWaveform(false);
    }, 800);
  };

  // Update waveform when recording changes or marks are set/cleared
  useEffect(() => {
    drawWaveform();
  }, [selectedRecording, markIn, markOut, currentTime]);

  // Handle tag input
  const addTag = () => {
    if (newTagInput.trim() && !segmentTags.includes(newTagInput.trim())) {
      setSegmentTags([...segmentTags, newTagInput.trim()]);
      setNewTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setSegmentTags(segmentTags.filter(t => t !== tag));
  };

  return (
    <div className="container mx-auto py-6 px-4 min-h-screen bg-gray-950 text-gray-100">
      <h1 className="text-3xl font-bold mb-6">Audio Logger Access</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left sidebar - Source selection */}
        <div className="lg:col-span-1">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle>Recording Sources</CardTitle>
              <CardDescription>
                Select a recording source to browse archives
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {sources.map(source => (
                <Button
                  key={source.id}
                  variant={selectedSource === source.id ? "default" : "outline"}
                  className="w-full justify-start mb-2"
                  onClick={() => setSelectedSource(source.id)}
                >
                  <div className="flex items-center">
                    <Folder className="mr-2 h-4 w-4" />
                    <div className="text-left">
                      <div className="font-medium">{source.name}</div>
                      <div className="text-xs text-gray-400">{source.folderPath}</div>
                    </div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>
          
          {selectedSource && (
            <Card className="bg-gray-900 border-gray-800 mt-4">
              <CardHeader>
                <CardTitle>Date Selection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="date">Select Date</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <Input
                      id="date"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="bg-gray-800"
                    />
                  </div>
                </div>
                
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="search">Search Recordings</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Search by title, tags, notes..."
                      className="bg-gray-800 pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Main content area */}
        <div className="lg:col-span-3">
          {!selectedSource ? (
            <div className="flex flex-col items-center justify-center h-96 bg-gray-900 rounded-lg border border-gray-800">
              <FileAudio className="h-16 w-16 text-gray-700 mb-4" />
              <h3 className="text-xl font-medium text-gray-400">Select a Recording Source</h3>
              <p className="text-gray-500 mt-2 text-center max-w-md">
                Choose a recording source from the sidebar to browse archives and edit recordings
              </p>
            </div>
          ) : !selectedRecording ? (
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {sources.find(s => s.id === selectedSource)?.name} - Recordings
                </h2>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => {
                    toast({
                      title: "Refreshed",
                      description: "Recording list has been refreshed",
                      duration: 2000,
                    });
                  }}>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Refresh
                  </Button>
                </div>
              </div>
              
              <div className="space-y-3">
                {filteredRecordings.length > 0 ? (
                  filteredRecordings.map(recording => (
                    <div 
                      key={recording.id} 
                      className="p-4 bg-gray-800 border border-gray-700 rounded-md hover:bg-gray-750 cursor-pointer"
                      onClick={() => setSelectedRecording(recording)}
                    >
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-medium text-white">{recording.title}</h3>
                          <div className="text-sm text-gray-400 mt-1">
                            {formatDateTime(recording.startTime)} • {formatTime(recording.duration)} • {recording.format.toUpperCase()}
                          </div>
                        </div>
                        <div className="flex gap-1 items-start">
                          {recording.isFlagged && (
                            <div className="bg-amber-900/30 text-amber-500 rounded px-2 py-0.5 text-xs flex items-center">
                              <Bookmark className="h-3 w-3 mr-1" />
                              Flagged
                            </div>
                          )}
                          <Button size="sm" variant="ghost" onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRecording(recording);
                          }}>
                            <Play className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {recording.tags && recording.tags.length > 0 && (
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {recording.tags.map((tag, i) => (
                            <span key={i} className="px-2 py-0.5 bg-gray-700 rounded-full text-xs text-gray-300">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                        <div>
                          <HardDrive className="h-3 w-3 inline mr-1" />
                          {formatFileSize(recording.fileSize)}
                        </div>
                        <div>
                          <Clock className="h-3 w-3 inline mr-1" />
                          {formatTime(recording.duration)}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 bg-gray-800 rounded-lg">
                    <Info className="h-8 w-8 text-gray-600 mb-2" />
                    <p className="text-gray-500">No recordings found for the selected date and search criteria</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Recording header */}
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                  <div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mb-2"
                      onClick={() => setSelectedRecording(null)}
                    >
                      <SkipBack className="h-4 w-4 mr-1" />
                      Back to recordings
                    </Button>
                    <h2 className="text-xl font-semibold">{selectedRecording.title}</h2>
                    <div className="text-sm text-gray-400 mt-1">
                      {formatDateTime(selectedRecording.startTime)} • {formatTime(selectedRecording.duration)} • {selectedRecording.format.toUpperCase()}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3 md:mt-0">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        toast({
                          title: "Download Started",
                          description: "The full recording is being downloaded",
                          duration: 3000,
                        });
                      }}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleExportSegment}
                      disabled={markIn === null || markOut === null}
                    >
                      <SquareArrowOutUpRight className="h-4 w-4 mr-1" />
                      Export Selection
                    </Button>
                  </div>
                </div>
                
                {selectedRecording.tags && selectedRecording.tags.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {selectedRecording.tags.map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 bg-gray-700 rounded-full text-xs text-gray-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                {selectedRecording.notes && (
                  <div className="mt-2 text-sm text-gray-300 bg-gray-800 p-2 rounded">
                    <p>{selectedRecording.notes}</p>
                  </div>
                )}
              </div>
              
              {/* Audio player and waveform */}
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <div className="relative mb-4">
                  <canvas 
                    ref={waveformCanvasRef} 
                    className="w-full h-32 bg-gray-800 rounded"
                  />
                  
                  {isLoadingWaveform && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800/50 rounded">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  {/* Playback controls */}
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-medium text-gray-400 w-16">
                      {formatTime(currentTime)}
                    </div>
                    <div className="flex-1 mx-4">
                      <Slider
                        value={[currentTime]}
                        min={0}
                        max={duration || 100}
                        step={0.1}
                        onValueChange={handleSeek}
                      />
                    </div>
                    <div className="text-xs font-medium text-gray-400 w-16 text-right">
                      {formatTime(duration)}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={toggleMute}
                      >
                        {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </Button>
                      <div className="w-24 mx-2">
                        <Slider
                          value={[isMuted ? 0 : volume]}
                          min={0}
                          max={1}
                          step={0.01}
                          onValueChange={handleVolumeChange}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={skipBackward}
                      >
                        <SkipBack className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="default" 
                        size="icon"
                        onClick={togglePlayPause}
                      >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={skipForward}
                      >
                        <SkipForward className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleSetMarkIn}
                      >
                        <Bookmark className="h-3 w-3 mr-1 text-green-500" />
                        Mark In
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleSetMarkOut}
                      >
                        <Bookmark className="h-3 w-3 mr-1 text-red-500" />
                        Mark Out
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={clearMarks}
                        disabled={markIn === null && markOut === null}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Clear
                      </Button>
                    </div>
                  </div>
                  
                  {/* Hidden audio element */}
                  <audio
                    ref={audioRef}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={() => setIsPlaying(false)}
                    src={`/api/audio-logger/recordings/${selectedRecording.id}/stream`}
                  />
                </div>
              </div>
              
              {/* Segment creation */}
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <Tabs defaultValue="create">
                  <TabsList className="bg-gray-800 mb-4">
                    <TabsTrigger value="create">Create Segment</TabsTrigger>
                    <TabsTrigger value="segments">Saved Segments</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="create">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="segmentTitle">Segment Title</Label>
                          <Input
                            id="segmentTitle"
                            placeholder="Enter segment title"
                            value={segmentTitle}
                            onChange={(e) => setSegmentTitle(e.target.value)}
                            className="bg-gray-800"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Selection Range</Label>
                          <div className="flex items-center bg-gray-800 p-2 rounded">
                            <div className="text-xs text-gray-400">
                              <span className="text-green-500 font-semibold">In: </span>
                              {markIn !== null ? formatTime(markIn) : "--:--:--"}
                            </div>
                            <div className="mx-2 text-gray-600">→</div>
                            <div className="text-xs text-gray-400">
                              <span className="text-red-500 font-semibold">Out: </span>
                              {markOut !== null ? formatTime(markOut) : "--:--:--"}
                            </div>
                            <div className="ml-auto text-xs text-gray-400">
                              {markIn !== null && markOut !== null
                                ? `Duration: ${formatTime(markOut - markIn)}`
                                : "Set in and out points"}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="segmentNotes">Notes</Label>
                        <Input
                          id="segmentNotes"
                          placeholder="Add notes about this segment"
                          value={segmentNotes}
                          onChange={(e) => setSegmentNotes(e.target.value)}
                          className="bg-gray-800"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Tags</Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {segmentTags.map((tag) => (
                            <div 
                              key={tag} 
                              className="bg-gray-700 text-gray-200 px-2 py-1 rounded-full text-xs flex items-center"
                            >
                              {tag}
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-4 w-4 ml-1"
                                onClick={() => removeTag(tag)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                          {segmentTags.length === 0 && (
                            <div className="text-xs text-gray-500">No tags added</div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add a tag"
                            value={newTagInput}
                            onChange={(e) => setNewTagInput(e.target.value)}
                            className="bg-gray-800"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addTag();
                              }
                            }}
                          />
                          <Button 
                            variant="outline"
                            onClick={addTag}
                            disabled={!newTagInput.trim()}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full"
                        onClick={handleCreateSegment}
                        disabled={isSegmentProcessing || markIn === null || markOut === null || !segmentTitle.trim()}
                      >
                        {isSegmentProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Segment
                          </>
                        )}
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="segments">
                    <div className="space-y-4">
                      {segments.length > 0 ? (
                        segments.map((segment) => (
                          <div 
                            key={segment.id} 
                            className="bg-gray-800 p-3 rounded-lg border border-gray-700"
                          >
                            <div className="flex justify-between">
                              <div>
                                <h4 className="font-medium">{segment.title}</h4>
                                <div className="text-xs text-gray-400 mt-1">
                                  {formatTime(segment.startTime)} - {formatTime(segment.endTime)} (Duration: {formatTime(segment.endTime - segment.startTime)})
                                </div>
                              </div>
                              <div className="flex items-start gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => {
                                    // Set playback to this segment
                                    if (audioRef.current) {
                                      audioRef.current.currentTime = segment.startTime;
                                      setCurrentTime(segment.startTime);
                                      if (!isPlaying) {
                                        audioRef.current.play();
                                        setIsPlaying(true);
                                      }
                                    }
                                    // Set marks to this segment
                                    setMarkIn(segment.startTime);
                                    setMarkOut(segment.endTime);
                                  }}
                                >
                                  <Play className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => {
                                    // Set marks to this segment for export
                                    setMarkIn(segment.startTime);
                                    setMarkOut(segment.endTime);
                                    handleExportSegment();
                                  }}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            {segment.tags && segment.tags.length > 0 && (
                              <div className="flex gap-2 mt-2 flex-wrap">
                                {segment.tags.map((tag, i) => (
                                  <span key={i} className="px-2 py-0.5 bg-gray-700 rounded-full text-xs text-gray-300">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            
                            {segment.notes && (
                              <div className="mt-2 text-xs text-gray-300 bg-gray-900 p-2 rounded">
                                <p>{segment.notes}</p>
                              </div>
                            )}
                            
                            <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                              <div>
                                Created: {format(new Date(segment.createdAt), 'PP')}
                              </div>
                              {segment.isExported && (
                                <div className="bg-green-900/30 text-green-500 rounded px-2 py-0.5 text-xs flex items-center">
                                  <Check className="h-3 w-3 mr-1" />
                                  Exported
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8">
                          <Scissors className="h-8 w-8 text-gray-600 mb-2" />
                          <p className="text-gray-500">No segments have been created for this recording</p>
                          <p className="text-gray-600 text-sm mt-1">Use the Create Segment tab to create and save segments</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="bg-gray-900 text-gray-100">
          <DialogHeader>
            <DialogTitle>Export Audio Segment</DialogTitle>
            <DialogDescription>
              Configure export options for the selected audio segment
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="exportRange">Selected Range</Label>
              <div className="flex items-center bg-gray-800 p-2 rounded">
                <div className="text-xs text-gray-200">
                  {markIn !== null && markOut !== null
                    ? `${formatTime(markIn)} - ${formatTime(markOut)} (Duration: ${formatTime(markOut - markIn)})`
                    : "No range selected"}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exportFormat">File Format</Label>
                <Select
                  value={exportFormat}
                  onValueChange={setExportFormat}
                >
                  <SelectTrigger className="bg-gray-800">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800">
                    <SelectItem value="mp3">MP3</SelectItem>
                    <SelectItem value="wav">WAV</SelectItem>
                    <SelectItem value="flac">FLAC</SelectItem>
                    <SelectItem value="aac">AAC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="exportQuality">Quality</Label>
                <Select
                  value={exportQuality}
                  onValueChange={setExportQuality}
                >
                  <SelectTrigger className="bg-gray-800">
                    <SelectValue placeholder="Select quality" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800">
                    <SelectItem value="low">Low (128kbps)</SelectItem>
                    <SelectItem value="medium">Medium (192kbps)</SelectItem>
                    <SelectItem value="high">High (256kbps)</SelectItem>
                    <SelectItem value="veryHigh">Very High (320kbps)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox id="normalizeAudio" />
                <Label htmlFor="normalizeAudio">Normalize Audio Levels</Label>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox id="includeMetadata" defaultChecked />
                <Label htmlFor="includeMetadata">Include Metadata (title, tags, notes)</Label>
              </div>
            </div>
            
            {isExporting && (
              <div className="space-y-2 mt-4">
                <Label>Export Progress</Label>
                <Progress value={exportProgress} className="h-2" />
                <div className="text-xs text-gray-400 text-right">{exportProgress}%</div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsExportDialogOpen(false)}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button
              onClick={startExport}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoggerAccessPage;
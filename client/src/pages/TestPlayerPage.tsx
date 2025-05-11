import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useRadioAutomation } from '@/contexts/RadioAutomationContext';
import SimpleAudioPlayer from '@/components/SimpleAudioPlayer';
import { Loader2, Upload, ArrowUpDown, Clock, FileType } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { formatDuration } from '@/lib/utils';

// Define track interface
interface Track {
  id: number;
  title: string;
  artist: string | null;
  album: string | null;
  duration: number;
  path: string;
  fileType?: string;
  fileSize?: number;
}

// This is a test page to demonstrate the audio player functionality
const TestPlayerPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [customUrl, setCustomUrl] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'duration' | 'fileSize'>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Use direct query for all tracks
  const { data: publicTracks = [], isLoading: tracksLoading } = useQuery<Track[]>({
    queryKey: ['all-tracks'],
    queryFn: async () => {
      // Get all tracks from the database
      const res = await fetch('/api/radio/tracks');
      if (!res.ok) {
        if (res.status === 401) {
          // If unauthorized, try the public endpoint as fallback
          const publicRes = await fetch('/api/public/folders/mazen/tracks');
          if (publicRes.ok) {
            return publicRes.json();
          }
          return [];
        }
        throw new Error('Failed to fetch tracks');
      }
      return res.json();
    },
  });
  
  // File upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/radio/tracks/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload file');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Upload Success',
        description: 'Audio file uploaded successfully',
      });
      // Refresh track list
      queryClient.invalidateQueries({ queryKey: ['all-tracks'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsUploading(false);
    }
  });
  
  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check if it's an audio file
    if (!file.type.startsWith('audio/')) {
      toast({
        title: 'Invalid File',
        description: 'Please select an audio file (MP3, WAV, etc.)',
        variant: 'destructive',
      });
      return;
    }
    
    // Create FormData
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name.replace(/\.[^/.]+$/, '')); // Remove extension for title
    formData.append('folderId', '3'); // Mazen folder ID
    
    setIsUploading(true);
    uploadMutation.mutate(formData);
  };
  
  // Sorted tracks
  const sortedTracks = [...publicTracks].sort((a, b) => {
    // Handle null values
    const aValue = a[sortBy] ?? 0;
    const bValue = b[sortBy] ?? 0;
    
    // For string comparison
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    // For number comparison
    return sortOrder === 'asc' 
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });
  
  useEffect(() => {
    // Auto-select the first track when tracks are loaded
    if (publicTracks && publicTracks.length > 0 && !selectedTrack) {
      setSelectedTrack(publicTracks[0]);
    }
  }, [publicTracks, selectedTrack]);

  const handleTrackSelect = (track: Track) => {
    setSelectedTrack(track);
    toast({
      title: 'Track Selected',
      description: `Selected: ${track.title}`,
    });
  };

  const handleCustomUrlPlay = () => {
    if (!customUrl) {
      toast({
        title: 'Error',
        description: 'Please enter a URL',
        variant: 'destructive',
      });
      return;
    }
    
    setSelectedTrack({
      id: 999,
      title: 'Custom URL',
      artist: 'Custom Source',
      album: null,
      duration: 0,
      path: customUrl,
    });
  };
  
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Audio Player Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Track Selection</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Sort controls */}
            <div className="mb-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Available Tracks</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={toggleSortOrder}
                  className="w-8 h-8 p-0"
                >
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex gap-2 mb-2">
                <div className="w-full">
                  <Select 
                    value={sortBy} 
                    onValueChange={(value) => setSortBy(value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="title">Title</SelectItem>
                      <SelectItem value="duration">Length</SelectItem>
                      <SelectItem value="fileSize">Size</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            {/* Track list */}
            <div className="mb-4">
              {tracksLoading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : sortedTracks.length > 0 ? (
                <div className="max-h-[300px] overflow-y-auto border rounded-md">
                  {sortedTracks.map((track) => (
                    <div
                      key={track.id}
                      className={`p-2 cursor-pointer hover:bg-muted transition-colors ${
                        selectedTrack?.id === track.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => handleTrackSelect(track)}
                    >
                      <div className="font-medium truncate">{track.title}</div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{track.artist || 'Unknown Artist'}</span>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" /> 
                            {formatDuration(track.duration)}
                          </span>
                          {track.fileSize && 
                            <span className="flex items-center">
                              <FileType className="h-3 w-3 mr-1" /> 
                              {Math.round(track.fileSize / 1024)}KB
                            </span>
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 border rounded-md bg-muted">
                  No tracks available.
                </div>
              )}
            </div>
            
            {/* Upload section */}
            <div className="mt-2 mb-4">
              <h3 className="text-lg font-medium mb-2">Upload MP3</h3>
              <div className="flex flex-col gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="audio/*"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="w-full flex items-center gap-2"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {isUploading ? 'Uploading...' : 'Upload Audio File'}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Upload an audio file to test the workflow
                </p>
              </div>
            </div>
            
            {/* Custom URL */}
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Custom URL</h3>
              <div className="flex space-x-2">
                <Input
                  placeholder="Enter audio URL"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                />
                <Button onClick={handleCustomUrlPlay}>
                  Play
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Player</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedTrack ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Selected Track</h3>
                  <div className="p-3 border rounded-md bg-muted">
                    <p><strong>Title:</strong> {selectedTrack.title}</p>
                    <p><strong>Artist:</strong> {selectedTrack.artist || 'Unknown'}</p>
                    {selectedTrack.duration > 0 && (
                      <p><strong>Duration:</strong> {formatDuration(selectedTrack.duration)}</p>
                    )}
                    {selectedTrack.fileSize && (
                      <p><strong>File Size:</strong> {Math.round(selectedTrack.fileSize / 1024)} KB</p>
                    )}
                    <p><strong>Path:</strong> <span className="text-xs break-all">{selectedTrack.path}</span></p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">SimpleAudioPlayer Component</h3>
                  <SimpleAudioPlayer
                    audioSrc={selectedTrack.path}
                    title={selectedTrack.title}
                    artist={selectedTrack.artist}
                    onPlay={() => toast({ title: 'Playing', description: selectedTrack.title })}
                    onPause={() => toast({ title: 'Paused', description: selectedTrack.title })}
                    onEnded={() => toast({ title: 'Ended', description: selectedTrack.title })}
                    onError={(error) => toast({ 
                      title: 'Error', 
                      description: error, 
                      variant: 'destructive' 
                    })}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-60">
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">No track selected.</p>
                  <p className="text-sm">Select a track from the list or enter a custom URL to play.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestPlayerPage;
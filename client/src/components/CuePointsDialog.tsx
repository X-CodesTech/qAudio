import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Waves, BarChart4, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface Track {
  id: number;
  title: string;
  artist: string | null;
  album?: string | null;
  duration: number;
  path?: string;
  category?: string | null;
  waveformData?: string | null;
  cuePoints?: string | null;
}

interface CuePoints {
  start: number;
  end: number;
  fadeIn: number;
  fadeOut: number;
}

interface CuePointsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  playerId: string;
  type: 'A' | 'B' | 'C';
}

const CuePointsDialog: React.FC<CuePointsDialogProps> = ({ isOpen, onClose, track, playerId, type }) => {
  const { toast } = useToast();
  const [cuePoints, setCuePoints] = useState<CuePoints>({
    start: 0,
    end: 0,
    fadeIn: 0,
    fadeOut: 0
  });
  const [activeTab, setActiveTab] = useState('cue-points');
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  
  // When track changes, update the cue points
  useEffect(() => {
    if (!track) return;
    
    // Try to parse cuePoints from track if they exist
    if (track.cuePoints) {
      try {
        const parsedCuePoints = JSON.parse(track.cuePoints);
        setCuePoints({
          start: parsedCuePoints.start || 0,
          end: parsedCuePoints.end || track.duration,
          fadeIn: parsedCuePoints.fadeIn || 0,
          fadeOut: parsedCuePoints.fadeOut || 0
        });
      } catch (e) {
        console.error('Error parsing cue points:', e);
        // Set defaults if parsing fails
        setCuePoints({
          start: 0,
          end: track.duration,
          fadeIn: 0,
          fadeOut: 0
        });
      }
    } else {
      // Set defaults if no cue points exist
      setCuePoints({
        start: 0,
        end: track.duration,
        fadeIn: 0,
        fadeOut: 0
      });
    }
    
    // Find the audio element for this player
    const element = document.querySelector(`audio[data-player-id="${playerId}"]`) as HTMLAudioElement;
    if (element) {
      setAudioElement(element);
      
      // Set up listeners
      const handleTimeUpdate = () => {
        setPlaybackPosition(element.currentTime);
        setIsPlaying(!element.paused);
      };
      
      element.addEventListener('timeupdate', handleTimeUpdate);
      element.addEventListener('play', () => setIsPlaying(true));
      element.addEventListener('pause', () => setIsPlaying(false));
      
      return () => {
        element.removeEventListener('timeupdate', handleTimeUpdate);
        element.removeEventListener('play', () => setIsPlaying(true));
        element.removeEventListener('pause', () => setIsPlaying(false));
      };
    }
  }, [track, playerId]);

  const handleCuePointChange = (key: keyof CuePoints, value: number) => {
    setCuePoints(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const parseTimeInput = (timeStr: string): number => {
    const [mins, secs] = timeStr.split(':').map(Number);
    if (!isNaN(mins) && !isNaN(secs)) {
      return mins * 60 + secs;
    }
    return 0;
  };

  const handleSaveCuePoints = async () => {
    if (!track) return;
    
    try {
      // Validate cue points
      if (cuePoints.start > cuePoints.end) {
        toast({
          title: "Invalid Cue Points",
          description: "Start point cannot be after end point",
          variant: "destructive"
        });
        return;
      }

      if (cuePoints.fadeIn > (cuePoints.end - cuePoints.start) / 2) {
        toast({
          title: "Invalid Fade In",
          description: "Fade in time is too long",
          variant: "destructive"
        });
        return;
      }

      if (cuePoints.fadeOut > (cuePoints.end - cuePoints.start) / 2) {
        toast({
          title: "Invalid Fade Out",
          description: "Fade out time is too long",
          variant: "destructive"
        });
        return;
      }

      // Save cue points to track
      const response = await apiRequest(
        'PATCH',
        `/api/radio/tracks/${track.id}`,
        {
          cuePoints: JSON.stringify(cuePoints)
        }
      );

      if (response.ok) {
        toast({
          title: "Cue Points Saved",
          description: "Track cue points have been updated successfully",
          variant: "default"
        });
        
        // If the audio element exists, update its time range
        if (audioElement) {
          // Set the current time to the start cue point if not already playing
          if (!isPlaying) {
            audioElement.currentTime = cuePoints.start;
          }
        }
        
        onClose();
      } else {
        toast({
          title: "Error Saving Cue Points",
          description: "There was an error saving the cue points",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error saving cue points:', error);
      toast({
        title: "Error Saving Cue Points",
        description: "There was an error saving the cue points",
        variant: "destructive"
      });
    }
  };

  const seekToPosition = (position: number) => {
    if (audioElement) {
      audioElement.currentTime = position;
    }
  };

  const togglePlayback = () => {
    if (!audioElement) return;
    
    if (isPlaying) {
      audioElement.pause();
    } else {
      audioElement.play();
    }
  };

  if (!track) return null;

  // Generate a simple waveform visualization from track duration
  const generateWaveform = () => {
    const segments = 100;
    const height = 40; // Reduced by 10px from 50
    const points = [];
    
    // Use actual waveform data if available
    if (track.waveformData) {
      try {
        return JSON.parse(track.waveformData);
      } catch (e) {
        console.error('Error parsing waveform data:', e);
      }
    }
    
    // Generate random waveform data if none exists
    for (let i = 0; i < segments; i++) {
      const amplitude = Math.random() * height * 0.8 + height * 0.2;
      points.push(amplitude);
    }
    
    return points;
  };

  const waveformData = generateWaveform();
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] bg-zinc-900 border-zinc-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full bg-${type === 'A' ? 'amber' : type === 'B' ? 'emerald' : 'purple'}-500`}></span>
            Set Cue Points - {track.title}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="cue-points" className="flex items-center gap-1.5">
              <Waves className="h-4 w-4" />
              Cue Points
            </TabsTrigger>
            <TabsTrigger value="fade" className="flex items-center gap-1.5">
              <BarChart4 className="h-4 w-4" />
              Fade Options
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="cue-points" className="space-y-4 mt-4">
            {/* Waveform visualization */}
            <div className="relative h-24 bg-zinc-800 rounded-md overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <svg width="100%" height="100%" preserveAspectRatio="none">
                  <g>
                    {waveformData.map((value: number, index: number) => {
                      const x = (index / waveformData.length) * 100;
                      // Color the played part of the waveform
                      const isPlayed = (index / waveformData.length) * track.duration < playbackPosition;
                      
                      return (
                        <line
                          key={index}
                          x1={`${x}%`}
                          y1="50%"
                          x2={`${x}%`}
                          y2={`${50 - value/2}%`}
                          stroke={isPlayed ? '#10B981' : '#999'}
                          strokeWidth="2"
                        />
                      );
                    })}
                  </g>
                </svg>
              </div>
              
              {/* Cue point markers */}
              <div 
                className="absolute h-full w-0.5 bg-green-500 cursor-ew-resize" 
                style={{ left: `${(cuePoints.start / track.duration) * 100}%` }}
              />
              <div 
                className="absolute h-full w-0.5 bg-red-500 cursor-ew-resize" 
                style={{ left: `${(cuePoints.end / track.duration) * 100}%` }}
              />
              
              {/* Playback position marker */}
              <div 
                className="absolute h-full w-0.5 bg-white cursor-ew-resize" 
                style={{ left: `${(playbackPosition / track.duration) * 100}%` }}
              />
            </div>
            
            {/* Playback controls */}
            <div className="flex justify-center gap-4 mb-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => seekToPosition(cuePoints.start)}
              >
                Go to Start
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={togglePlayback}
              >
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => seekToPosition(cuePoints.end)}
              >
                Go to End
              </Button>
            </div>
            
            {/* Cue point sliders */}
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="start" className="text-xs flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div> Start Point
                </Label>
                <div className="flex gap-2">
                  <Slider 
                    id="start" 
                    value={[cuePoints.start]} 
                    max={track.duration}
                    step={0.1}
                    onValueChange={(value) => handleCuePointChange('start', value[0])}
                    className="flex-1"
                  />
                  <Input 
                    className="w-20 h-8 text-xs"
                    value={formatTime(cuePoints.start)}
                    onChange={(e) => handleCuePointChange('start', parseTimeInput(e.target.value))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="end" className="text-xs flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div> End Point
                </Label>
                <div className="flex gap-2">
                  <Slider 
                    id="end" 
                    value={[cuePoints.end]} 
                    max={track.duration}
                    step={0.1}
                    onValueChange={(value) => handleCuePointChange('end', value[0])}
                    className="flex-1"
                  />
                  <Input 
                    className="w-20 h-8 text-xs"
                    value={formatTime(cuePoints.end)}
                    onChange={(e) => handleCuePointChange('end', parseTimeInput(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="fade" className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label htmlFor="fadeIn" className="text-xs flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div> Fade In Duration (seconds)
              </Label>
              <div className="flex gap-2">
                <Slider 
                  id="fadeIn" 
                  value={[cuePoints.fadeIn]} 
                  max={10} // Max 10 seconds for fade in
                  step={0.1}
                  onValueChange={(value) => handleCuePointChange('fadeIn', value[0])}
                  className="flex-1"
                />
                <Input 
                  className="w-20 h-8 text-xs"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={cuePoints.fadeIn.toFixed(1)}
                  onChange={(e) => handleCuePointChange('fadeIn', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fadeOut" className="text-xs flex items-center gap-1">
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div> Fade Out Duration (seconds)
              </Label>
              <div className="flex gap-2">
                <Slider 
                  id="fadeOut" 
                  value={[cuePoints.fadeOut]} 
                  max={10} // Max 10 seconds for fade out
                  step={0.1}
                  onValueChange={(value) => handleCuePointChange('fadeOut', value[0])}
                  className="flex-1"
                />
                <Input 
                  className="w-20 h-8 text-xs"
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={cuePoints.fadeOut.toFixed(1)}
                  onChange={(e) => handleCuePointChange('fadeOut', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            
            <div className="rounded-md bg-zinc-800 p-3 text-xs">
              <h4 className="font-medium mb-2">Fade Preview</h4>
              <div className="relative h-12 bg-zinc-900 rounded-md overflow-hidden">
                <div 
                  className="absolute top-0 h-full bg-gradient-to-r from-transparent to-blue-500/50" 
                  style={{ 
                    left: `${(cuePoints.start / track.duration) * 100}%`,
                    width: `${(cuePoints.fadeIn / track.duration) * 100}%` 
                  }}
                />
                <div 
                  className="absolute top-0 h-full bg-gradient-to-l from-transparent to-amber-500/50" 
                  style={{ 
                    right: `${100 - (cuePoints.end / track.duration) * 100}%`,
                    width: `${(cuePoints.fadeOut / track.duration) * 100}%` 
                  }}
                />
                
                {/* Start marker */}
                <div 
                  className="absolute h-full w-0.5 bg-green-500" 
                  style={{ left: `${(cuePoints.start / track.duration) * 100}%` }}
                />
                
                {/* End marker */}
                <div 
                  className="absolute h-full w-0.5 bg-red-500" 
                  style={{ left: `${(cuePoints.end / track.duration) * 100}%` }}
                />
              </div>
              <p className="mt-2 text-zinc-400">
                Track will fade in for {cuePoints.fadeIn.toFixed(1)}s after start point 
                and fade out for {cuePoints.fadeOut.toFixed(1)}s before end point.
              </p>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSaveCuePoints}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-4 w-4 mr-2" />
            Set Cue Points
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CuePointsDialog;
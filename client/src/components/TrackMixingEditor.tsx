import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AudioTrack } from '@shared/schema';
import { formatDuration } from '@/lib/formatters';
import { Music, Timer, Wand2, Waves, Volume, Volume2, BarChart4 } from 'lucide-react';

interface TrackMixingEditorProps {
  track?: AudioTrack | null;
  onSave?: (track: AudioTrack, cuePoints: CuePoints) => void;
  defaultCuePoints?: CuePoints;
  alwaysVisible?: boolean; // New prop to control visibility
}

export interface CuePoints {
  start: number;
  intro: number;
  outro: number;
  end: number;
}

export function TrackMixingEditor({ track, onSave, defaultCuePoints, alwaysVisible = true }: TrackMixingEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [cuePoints, setCuePoints] = useState<CuePoints>({
    start: 0,
    intro: 0,
    outro: 0,
    end: 0
  });
  const [tab, setTab] = useState('cue-points');

  // If track changes or defaultCuePoints are provided, update the cue points
  useEffect(() => {
    if (!track) return;

    // Try to parse cuePoints from track if they exist
    if (track.cuePoints) {
      try {
        const parsedCuePoints = JSON.parse(track.cuePoints);
        setCuePoints({
          start: parsedCuePoints.start || 0,
          intro: parsedCuePoints.intro || 0,
          outro: parsedCuePoints.outro || (track.duration * 0.8) || 0,
          end: parsedCuePoints.end || track.duration || 0
        });
        return;
      } catch (e) {
        console.error('Error parsing cue points:', e);
      }
    }

    // Use defaultCuePoints if provided
    if (defaultCuePoints) {
      setCuePoints(defaultCuePoints);
      return;
    }

    // Otherwise set reasonable defaults
    setCuePoints({
      start: 0,
      intro: 0,
      outro: track.duration ? Math.max(0, track.duration - 10) : 0,
      end: track.duration || 0
    });
  }, [track, defaultCuePoints]);

  const handleSave = () => {
    if (!track) return;

    // Validate cue points order
    if (cuePoints.start > cuePoints.intro || 
        cuePoints.intro > cuePoints.outro || 
        cuePoints.outro > cuePoints.end) {
      alert('Cue points must be in order: start ≤ intro ≤ outro ≤ end');
      return;
    }

    // Make sure end doesn't exceed track duration
    if (cuePoints.end > (track.duration || 0)) {
      setCuePoints(prev => ({ ...prev, end: track.duration || 0 }));
    }

    // Call onSave with the updated track and cue points
    if (onSave) {
      onSave(track, cuePoints);
    }

    setIsOpen(false);
  };

  const handleCuePointChange = (type: keyof CuePoints, value: number) => {
    setCuePoints(prev => ({ ...prev, [type]: value }));
  };

  // Always render the button if alwaysVisible is true, even when no track is selected
  if (!track && !alwaysVisible) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 gap-1 px-2 text-xs"
          disabled={!track} // Disable the button when no track is selected
          title={track ? "Open Mix Editor" : "No track loaded"}
        >
          <Waves className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Mix Editor</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Track Mixing Editor</DialogTitle>
        </DialogHeader>

        {track ? (
          <>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{track.title}</h3>
                  {track.artist && <p className="text-sm text-muted-foreground">{track.artist}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{formatDuration(track.duration)}</span>
                </div>
              </div>

              <Tabs value={tab} onValueChange={setTab} className="w-full">
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="cue-points" className="flex items-center gap-1.5">
                    <Waves className="h-4 w-4" />
                    Cue Points
                  </TabsTrigger>
                  <TabsTrigger value="mixing" className="flex items-center gap-1.5">
                    <BarChart4 className="h-4 w-4" />
                    Mixing Options
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="cue-points" className="space-y-5 mt-4">
                  <div className="relative h-24 bg-muted rounded-md">
                    {/* Visualization of the waveform and cue points would go here */}
                    <div className="absolute inset-0 flex items-center justify-between px-2">
                      <div 
                        className="absolute h-full w-1 bg-green-500 cursor-ew-resize" 
                        style={{ left: `${(cuePoints.start / (track.duration || 1)) * 100}%` }}
                      />
                      <div 
                        className="absolute h-full w-1 bg-blue-500 cursor-ew-resize" 
                        style={{ left: `${(cuePoints.intro / (track.duration || 1)) * 100}%` }}
                      />
                      <div 
                        className="absolute h-full w-1 bg-amber-500 cursor-ew-resize" 
                        style={{ left: `${(cuePoints.outro / (track.duration || 1)) * 100}%` }}
                      />
                      <div 
                        className="absolute h-full w-1 bg-red-500 cursor-ew-resize" 
                        style={{ left: `${(cuePoints.end / (track.duration || 1)) * 100}%` }}
                      />
                      <div className="w-full h-12 bg-black/20 rounded-md"></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start" className="text-xs flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div> Start Point
                      </Label>
                      <div className="flex gap-2">
                        <Slider 
                          id="start" 
                          value={[cuePoints.start]} 
                          max={track.duration || 100}
                          step={0.1}
                          onValueChange={(value) => handleCuePointChange('start', value[0])}
                          className="flex-1"
                        />
                        <Input 
                          className="w-20 h-8 text-xs"
                          value={formatDuration(cuePoints.start)}
                          onChange={(e) => {
                            const [mins, secs] = e.target.value.split(':').map(Number);
                            if (!isNaN(mins) && !isNaN(secs)) {
                              handleCuePointChange('start', mins * 60 + secs);
                            }
                          }}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="intro" className="text-xs flex items-center gap-1">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div> Intro End
                      </Label>
                      <div className="flex gap-2">
                        <Slider 
                          id="intro" 
                          value={[cuePoints.intro]} 
                          max={track.duration || 100}
                          step={0.1}
                          onValueChange={(value) => handleCuePointChange('intro', value[0])}
                          className="flex-1"
                        />
                        <Input 
                          className="w-20 h-8 text-xs"
                          value={formatDuration(cuePoints.intro)}
                          onChange={(e) => {
                            const [mins, secs] = e.target.value.split(':').map(Number);
                            if (!isNaN(mins) && !isNaN(secs)) {
                              handleCuePointChange('intro', mins * 60 + secs);
                            }
                          }}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="outro" className="text-xs flex items-center gap-1">
                        <div className="w-3 h-3 bg-amber-500 rounded-full"></div> Outro Start
                      </Label>
                      <div className="flex gap-2">
                        <Slider 
                          id="outro" 
                          value={[cuePoints.outro]} 
                          max={track.duration || 100}
                          step={0.1}
                          onValueChange={(value) => handleCuePointChange('outro', value[0])}
                          className="flex-1"
                        />
                        <Input 
                          className="w-20 h-8 text-xs"
                          value={formatDuration(cuePoints.outro)}
                          onChange={(e) => {
                            const [mins, secs] = e.target.value.split(':').map(Number);
                            if (!isNaN(mins) && !isNaN(secs)) {
                              handleCuePointChange('outro', mins * 60 + secs);
                            }
                          }}
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
                          max={track.duration || 100}
                          step={0.1}
                          onValueChange={(value) => handleCuePointChange('end', value[0])}
                          className="flex-1"
                        />
                        <Input 
                          className="w-20 h-8 text-xs"
                          value={formatDuration(cuePoints.end)}
                          onChange={(e) => {
                            const [mins, secs] = e.target.value.split(':').map(Number);
                            if (!isNaN(mins) && !isNaN(secs)) {
                              handleCuePointChange('end', mins * 60 + secs);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="mixing" className="space-y-5 mt-4">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="fade-in" className="text-xs flex items-center gap-1">
                        <Volume className="h-3.5 w-3.5" /> Fade In Duration
                      </Label>
                      <div className="flex gap-2">
                        <Slider 
                          id="fade-in" 
                          value={[3]} 
                          max={10}
                          step={0.5}
                          className="flex-1"
                        />
                        <Input className="w-20 h-8 text-xs" value="3.0s" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="fade-out" className="text-xs flex items-center gap-1">
                        <Volume2 className="h-3.5 w-3.5" /> Fade Out Duration
                      </Label>
                      <div className="flex gap-2">
                        <Slider 
                          id="fade-out" 
                          value={[5]} 
                          max={10}
                          step={0.5}
                          className="flex-1"
                        />
                        <Input className="w-20 h-8 text-xs" value="5.0s" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="overlap" className="text-xs flex items-center gap-1">
                        <Music className="h-3.5 w-3.5" /> Track Overlap
                      </Label>
                      <div className="flex gap-2">
                        <Slider 
                          id="overlap" 
                          value={[2]} 
                          max={10}
                          step={0.5}
                          className="flex-1"
                        />
                        <Input className="w-20 h-8 text-xs" value="2.0s" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="volume" className="text-xs flex items-center gap-1">
                        <BarChart4 className="h-3.5 w-3.5" /> Volume Normalization
                      </Label>
                      <div className="flex gap-2">
                        <Slider 
                          id="volume" 
                          value={[0]} 
                          min={-12}
                          max={12}
                          step={0.5}
                          className="flex-1"
                        />
                        <Input className="w-20 h-8 text-xs" value="0.0 dB" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t">
                    <Button size="sm" className="gap-1" variant="secondary">
                      <Wand2 className="h-3.5 w-3.5" /> 
                      Auto-Detect Cue Points
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </>
        ) : (
          <div className="mt-4 p-6 text-center text-muted-foreground">
            <Waves className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No track selected</p>
            <p className="text-sm">Select a track in the playlist to edit its mix points</p>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!track}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
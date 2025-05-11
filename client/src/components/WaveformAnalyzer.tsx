import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, Play, Pause } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface WaveformAnalyzerProps {
  trackId: number;
  trackTitle: string;
  duration: number; // in seconds
  onCuePointChange?: (cuePoint: number) => void;
  initialCuePoint?: number;
}

// Generate dummy waveform for fallback - moved to the top for better readability
const generateDummyWaveform = (): number[] => {
  const numPoints = 100;
  return Array.from({ length: numPoints }, () => Math.random() * 0.5 + 0.2);
};

export const WaveformAnalyzer: React.FC<WaveformAnalyzerProps> = ({
  trackId,
  trackTitle,
  duration,
  onCuePointChange,
  initialCuePoint = 0,
}) => {
  const [waveformData, setWaveformData] = useState<number[]>(generateDummyWaveform());
  const [loading, setLoading] = useState(false); // Start with false to immediately show waveform
  const [error, setError] = useState<string | null>(null);
  const [cuePoint, setCuePoint] = useState<number>(initialCuePoint);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Generate and draw static waveform immediately
  useEffect(() => {
    // Always ensure we have some waveform data to display
    const staticWaveform = generateDummyWaveform();
    setWaveformData(staticWaveform);
    
    // Don't wait for API - we already have a visible waveform
    // No need to block rendering on API requests
  }, [trackId]);
  
  // Attempt to fetch real waveform data in the background
  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 2;
    
    const fetchWaveform = async () => {
      try {
        // We already have static waveform displayed, so this is just an enhancement
        const response = await fetch(`/api/radio/tracks/${trackId}/waveform`);
        
        if (!isMounted) return;
        
        if (!response.ok) {
          // If waveform doesn't exist, generate it
          if (response.status === 404) {
            try {
              const generateResponse = await fetch(`/api/radio/tracks/${trackId}/waveform`, {
                method: 'POST'
              });
              
              if (!isMounted) return;
              
              if (!generateResponse.ok) {
                throw new Error('Failed to generate waveform');
              }
              
              const data = await generateResponse.json();
              if (data.waveform && data.waveform.length > 0 && isMounted) {
                setWaveformData(data.waveform);
              }
            } catch (genError) {
              console.warn('Error generating waveform, using static data:', genError);
              // Static waveform already displayed, so no user impact
            }
          } else if (retryCount < maxRetries) {
            // Retry with exponential backoff
            retryCount++;
            const delay = Math.pow(2, retryCount) * 500; // 1s, 2s, 4s...
            setTimeout(fetchWaveform, delay);
          }
        } else {
          const data = await response.json();
          if (data.waveform && data.waveform.length > 0 && isMounted) {
            setWaveformData(data.waveform);
          }
        }
      } catch (err) {
        console.warn('Error fetching waveform, using static data:', err);
        // Static waveform already displayed, so no user impact
      }
    };
    
    // Start fetch in background
    fetchWaveform();
    
    return () => {
      isMounted = false;
    };
  }, [trackId]);
  
  // Draw waveform immediately and on every update
  useEffect(() => {
    // Skip if canvas not available
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    context.clearRect(0, 0, width, height);
    
    // Draw waveform (ensure we have data, even if empty array)
    const dataToUse = waveformData.length > 0 ? waveformData : generateDummyWaveform();
    const barWidth = width / dataToUse.length;
    
    context.fillStyle = '#06ef45'; // Bright green color as requested
    
    dataToUse.forEach((value, index) => {
      const barHeight = value * (height * 0.8);
      const x = index * barWidth;
      const y = (height - barHeight) / 2;
      
      context.fillRect(x, y, barWidth - 1, barHeight);
    });
    
    // Draw current position
    const positionX = (currentPosition / duration) * width;
    context.fillStyle = '#ffffff';
    context.fillRect(positionX, 0, 2, height);
    
    // Draw cue point
    const cuePointX = (cuePoint / duration) * width;
    context.fillStyle = '#ff5500';
    context.fillRect(cuePointX - 2, 0, 4, height);
    
  }, [waveformData, cuePoint, currentPosition, duration]);
  
  // Handle canvas click for setting cue point
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickPositionRatio = x / canvas.width;
    
    // Calculate seconds from position
    const newCuePoint = clickPositionRatio * duration;
    setCuePoint(newCuePoint);
    
    if (onCuePointChange) {
      onCuePointChange(newCuePoint);
    }
    
    // If audio is loaded, set current time
    if (audioRef.current) {
      audioRef.current.currentTime = newCuePoint;
    }
  };
  
  // Play/pause audio preview
  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      // Start from cue point
      audioRef.current.currentTime = cuePoint;
      audioRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  // Update position during playback
  useEffect(() => {
    if (!audioRef.current || !isPlaying) return;
    
    const updatePosition = () => {
      if (audioRef.current) {
        setCurrentPosition(audioRef.current.currentTime);
      }
    };
    
    const interval = setInterval(updatePosition, 33); // ~30fps
    
    return () => {
      clearInterval(interval);
    };
  }, [isPlaying]);
  
  // Format time (seconds to MM:SS)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="waveform-analyzer bg-zinc-900 p-2 rounded-md border border-zinc-800">
      <div className="flex justify-between items-center mb-2">
        <div className="text-xs text-zinc-400 truncate max-w-[180px]">
          {trackTitle}
        </div>
        <div className="text-xs font-mono">
          <span className="text-green-400">{formatTime(cuePoint)}</span>
          <span className="mx-1 text-zinc-500">/</span>
          <span className="text-zinc-400">{formatTime(duration)}</span>
        </div>
      </div>
      
      {/* Always show the waveform canvas regardless of loading state - reduced height by 10px */}
      <canvas 
        ref={canvasRef}
        width={500}
        height={70}
        className="w-full h-16 bg-zinc-800 rounded-sm cursor-pointer"
        onClick={handleCanvasClick}
      />
      
      <div className="flex justify-between items-center mt-2">
        <Button 
          size="sm" 
          variant="ghost" 
          className="h-7 w-7 p-0"
          onClick={togglePlayback}
        >
          {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </Button>
        
        <Button 
          size="sm" 
          variant="ghost" 
          className="h-7 text-xs"
          onClick={() => {
            if (onCuePointChange) {
              onCuePointChange(cuePoint);
            }
          }}
        >
          <span className="mr-1">Set Cue</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
      
      {/* Hidden audio element for preview */}
      <audio 
        ref={audioRef}
        src={`/api/radio/tracks/${trackId}/file`}
        onEnded={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentPosition(audioRef.current.currentTime);
          }
        }}
      />
    </div>
  );
};

export default WaveformAnalyzer;
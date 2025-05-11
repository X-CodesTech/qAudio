import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Wand2, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';

interface PlayfulWaveInteractionProps {
  audioSrc?: string;
  waveformData?: number[]; // Array of amplitude values (typically between 0-1)
  trackTitle?: string;
  trackArtist?: string;
  onPlay?: () => void;
  onPause?: () => void;
  className?: string;
}

const PlayfulWaveInteraction: React.FC<PlayfulWaveInteractionProps> = ({
  audioSrc,
  waveformData = generateDemoWaveform(), // Use demo data if none provided
  trackTitle = "Demo Track",
  trackArtist = "Demo Artist",
  onPlay,
  onPause,
  className = ""
}) => {
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number>(0);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.75);
  const [isMuted, setIsMuted] = useState(false);
  const [effectMode, setEffectMode] = useState<'normal' | 'ripple' | 'bounce' | 'rainbow'>('normal');
  
  // Initialize audio if src is provided
  useEffect(() => {
    if (!audioSrc) return;
    
    if (!audioRef.current) {
      audioRef.current = new Audio(audioSrc);
      
      // Set up audio event listeners
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      audioRef.current.addEventListener('ended', handleEnded);
      
      // Set initial volume
      audioRef.current.volume = volume;
    } else {
      audioRef.current.src = audioSrc;
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audioRef.current.removeEventListener('ended', handleEnded);
      }
    };
  }, [audioSrc]);
  
  // Audio event handlers
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };
  
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };
  
  const handleEnded = () => {
    setIsPlaying(false);
    if (onPause) onPause();
  };
  
  // Audio control functions
  const togglePlayPause = () => {
    if (!audioRef.current && !audioSrc) {
      // If no audio source, just animate the waveform
      setIsPlaying(!isPlaying);
      if (!isPlaying) {
        if (onPlay) onPlay();
        startWaveformAnimation();
      } else {
        if (onPause) onPause();
        stopWaveformAnimation();
      }
      return;
    }
    
    if (isPlaying) {
      audioRef.current?.pause();
      if (onPause) onPause();
      stopWaveformAnimation();
    } else {
      audioRef.current?.play();
      if (onPlay) onPlay();
      startWaveformAnimation();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  const handleSeek = (value: number[]) => {
    const seekTime = value[0];
    setCurrentTime(seekTime);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
    }
  };
  
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };
  
  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
      } else {
        audioRef.current.volume = 0;
      }
    }
    setIsMuted(!isMuted);
  };
  
  const skip = (seconds: number) => {
    if (audioRef.current) {
      const newTime = Math.min(
        Math.max(0, audioRef.current.currentTime + seconds),
        audioRef.current.duration || 0
      );
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };
  
  // Effect cycle button
  const cycleEffect = () => {
    const effects: ('normal' | 'ripple' | 'bounce' | 'rainbow')[] = [
      'normal', 'ripple', 'bounce', 'rainbow'
    ];
    const currentIndex = effects.indexOf(effectMode);
    const nextIndex = (currentIndex + 1) % effects.length;
    setEffectMode(effects[nextIndex]);
    
    toast({
      title: "Effect Changed",
      description: `Visualization set to ${effects[nextIndex].toUpperCase()} mode`,
      variant: "default",
    });
  };
  
  // Canvas waveform animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    const setCanvasDimensions = () => {
      if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = 120; // Fixed height
      }
    };
    
    // Initial setup
    setCanvasDimensions();
    
    // Handle resize
    const handleResize = () => {
      setCanvasDimensions();
      drawWaveform(ctx, waveformData, 0, effectMode);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Draw initial waveform
    drawWaveform(ctx, waveformData, 0, effectMode);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [waveformData, effectMode]);
  
  // Animation functions
  const startWaveformAnimation = () => {
    if (!canvasRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    let animationProgress = 0;
    
    const animate = () => {
      animationProgress += 0.01;
      if (animationProgress > 1) animationProgress = 0;
      
      drawWaveform(ctx, waveformData, animationProgress, effectMode);
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
  };
  
  const stopWaveformAnimation = () => {
    cancelAnimationFrame(animationRef.current);
    
    // Reset to static waveform
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    drawWaveform(ctx, waveformData, 0, 'normal');
  };
  
  // Format time (seconds to MM:SS)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden ${className}`}>
      {/* Waveform visualization */}
      <div className="relative h-32 overflow-hidden p-3">
        <canvas 
          ref={canvasRef} 
          className="w-full h-full"
        />
        
        {/* Playback progress overlay */}
        {audioSrc && (
          <div 
            className="absolute top-0 left-0 h-full bg-primary/10"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        )}
        
        {/* Track info overlay */}
        <div className="absolute bottom-4 left-4 text-white bg-black/30 px-2 py-1 rounded">
          <div className="font-medium">{trackTitle}</div>
          <div className="text-xs text-zinc-300">{trackArtist}</div>
        </div>
      </div>
      
      {/* Controls */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-950 flex flex-col gap-2">
        {/* Time display and seekbar */}
        {audioSrc && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 w-10">{formatTime(currentTime)}</span>
            <Slider 
              value={[currentTime]} 
              min={0} 
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="flex-1"
            />
            <span className="text-xs text-zinc-400 w-10">{formatTime(duration)}</span>
          </div>
        )}
        
        {/* Playback buttons */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1">
            <Button 
              onClick={() => skip(-10)} 
              size="sm" 
              variant="ghost" 
              className="h-8 w-8 p-0" 
              disabled={!audioSrc}
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            
            <Button
              onClick={togglePlayPause}
              size="sm"
              variant={isPlaying ? "destructive" : "default"}
              className="h-9 w-9 rounded-full p-0 text-white"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 ml-0.5" />
              )}
            </Button>
            
            <Button 
              onClick={() => skip(10)} 
              size="sm" 
              variant="ghost" 
              className="h-8 w-8 p-0"
              disabled={!audioSrc}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              onClick={toggleMute}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
              disabled={!audioSrc}
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            
            {audioSrc && (
              <Slider
                value={[isMuted ? 0 : volume]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
                className="w-20"
                disabled={!audioSrc}
              />
            )}
            
            <Button
              onClick={cycleEffect}
              size="sm"
              variant="outline"
              className={`h-8 px-2 ${
                effectMode === 'normal' ? 'bg-zinc-800' :
                effectMode === 'ripple' ? 'bg-blue-900/30' :
                effectMode === 'bounce' ? 'bg-green-900/30' :
                'bg-purple-900/30'
              }`}
            >
              <Wand2 className="h-3 w-3 mr-1" />
              {effectMode.charAt(0).toUpperCase() + effectMode.slice(1)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Generate demo waveform data if none provided
function generateDemoWaveform(length = 100): number[] {
  const waveform: number[] = [];
  
  // Generate a more realistic looking waveform with some randomization
  for (let i = 0; i < length; i++) {
    // Base wave with multiple frequencies
    const baseValue = 
      0.5 + 
      0.3 * Math.sin(i * 0.1) + 
      0.15 * Math.sin(i * 0.05) +
      0.1 * Math.sin(i * 0.2);
      
    // Add some randomization
    const randomFactor = 0.1 * (Math.random() - 0.5);
    
    // Ensure value is between 0 and 1
    waveform.push(Math.max(0, Math.min(1, baseValue + randomFactor)));
  }
  
  return waveform;
}

// Draw waveform based on effect mode
function drawWaveform(
  ctx: CanvasRenderingContext2D, 
  waveformData: number[], 
  animationProgress: number,
  effectMode: 'normal' | 'ripple' | 'bounce' | 'rainbow'
) {
  const { width, height } = ctx.canvas;
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  // Set default style
  ctx.lineWidth = 2;
  
  const centerY = height / 2;
  const barWidth = width / waveformData.length;
  const minBarHeight = 2; // Ensure bars have a minimum height
  
  // Draw waveform based on effect mode
  for (let i = 0; i < waveformData.length; i++) {
    // Calculate bar height and position
    let amplitude = waveformData[i];
    
    // Apply animation effects
    switch(effectMode) {
      case 'ripple':
        // Ripple effect - wave moving through the waveform
        const rippleFactor = Math.sin((i / waveformData.length + animationProgress) * Math.PI * 2);
        amplitude = amplitude * (0.7 + 0.3 * rippleFactor);
        break;
        
      case 'bounce':
        // Bounce effect - entire waveform pulses up and down
        const bounceFactor = Math.sin(animationProgress * Math.PI * 4);
        amplitude = amplitude * (0.8 + 0.2 * bounceFactor);
        break;
        
      case 'rainbow':
        // Rainbow effect - color changes over time
        const hue = (i + animationProgress * 360) % 360;
        ctx.strokeStyle = `hsl(${hue}, 80%, 60%)`;
        break;
        
      default:
        // Normal mode - static color based on amplitude
        const brightness = 40 + amplitude * 40;
        ctx.strokeStyle = `hsl(210, 80%, ${brightness}%)`;
    }
    
    // Calculate bar height with a minimum value
    const barHeight = Math.max(minBarHeight, amplitude * height * 0.8);
    
    // Draw bar (centered vertically)
    const x = i * barWidth;
    
    ctx.beginPath();
    ctx.moveTo(x, centerY - barHeight / 2);
    ctx.lineTo(x, centerY + barHeight / 2);
    ctx.stroke();
  }
}

export default PlayfulWaveInteraction;
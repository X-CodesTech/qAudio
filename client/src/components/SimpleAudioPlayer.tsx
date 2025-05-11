import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SimpleAudioPlayerProps {
  audioSrc: string;
  title: string;
  artist?: string | null;
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: (error: string) => void;
}

const SimpleAudioPlayer: React.FC<SimpleAudioPlayerProps> = ({
  audioSrc,
  title,
  artist,
  className = '',
  onPlay,
  onPause,
  onEnded,
  onError
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      
      audioRef.current.addEventListener('timeupdate', updateProgress);
      audioRef.current.addEventListener('durationchange', () => {
        if (audioRef.current) {
          setDuration(audioRef.current.duration);
        }
      });
      audioRef.current.addEventListener('ended', handleEnded);
      audioRef.current.addEventListener('canplay', () => {
        setIsLoading(false);
        console.log("Audio is ready to play");
      });
      audioRef.current.addEventListener('error', handleError);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('timeupdate', updateProgress);
        audioRef.current.removeEventListener('ended', handleEnded);
        audioRef.current.removeEventListener('error', handleError);
      }
    };
  }, []);

  // Update audio source when it changes
  useEffect(() => {
    if (audioRef.current) {
      // Reset player state
      setIsPlaying(false);
      setCurrentTime(0);
      setIsLoading(true);
      
      // Clean up the URL
      let cleanSrc = audioSrc;
      
      // Make sure the path is properly formatted
      if (!cleanSrc.startsWith('http') && !cleanSrc.startsWith('blob:')) {
        // If this is a Replit environment, ensure the path starts with /uploads/
        if (window.location.hostname.includes('replit')) {
          // Remove any existing /uploads/ prefix to avoid duplication
          const cleanPath = cleanSrc.replace(/^\/?(uploads\/)?/, '');
          cleanSrc = `/uploads/${cleanPath}`;
        } else {
          // For Windows environment, ensure we have proper path formatting
          if (!cleanSrc.startsWith('/') && !cleanSrc.startsWith('C:')) {
            cleanSrc = `/${cleanSrc}`;
          }
        }
      }
      
      // For all environments, construct full URL with hostname if it's a relative path
      if (!cleanSrc.startsWith('http') && !cleanSrc.startsWith('blob:')) {
        const baseUrl = window.location.origin;
        cleanSrc = new URL(cleanSrc, baseUrl).href;
      }
      
      console.log(`Setting audio source to: ${cleanSrc}`);
      
      // Set the audio source
      audioRef.current.src = cleanSrc;
      audioRef.current.load();
    }
  }, [audioSrc]);

  // Update volume when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const updateProgress = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    if (onEnded) onEnded();
  };

  const handleError = () => {
    setIsLoading(false);
    const errorMessage = "Error playing audio. Please try again.";
    console.error(errorMessage, audioRef.current?.error);
    
    toast({
      title: "Playback Error",
      description: errorMessage,
      variant: "destructive",
    });
    
    if (onError) onError(errorMessage);
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (onPause) onPause();
    } else {
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            if (onPlay) onPlay();
          })
          .catch(error => {
            console.error("Play error:", error);
            toast({
              title: "Playback Error",
              description: "Failed to play audio. Please try again.",
              variant: "destructive",
            });
          });
      }
    }
  };

  const handleSeek = (values: number[]) => {
    const newTime = values[0];
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleVolumeChange = (values: number[]) => {
    const newVolume = values[0];
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardContent className="pt-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0 mr-2">
              <div className="text-base font-medium truncate">{title}</div>
              {artist && <div className="text-sm text-muted-foreground truncate">{artist}</div>}
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={togglePlayPause} 
                disabled={isLoading || !audioSrc}
                className="h-8 w-8"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleMute}
                className="h-8 w-8"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <div className="space-y-1">
            <Slider
              value={[currentTime]}
              min={0}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              disabled={isLoading || !audioSrc || duration === 0}
              className="w-full"
            />
            
            <div className="flex justify-between text-xs">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
          
          <div className="space-y-1">
            <Slider
              value={[isMuted ? 0 : volume]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={handleVolumeChange}
              className="w-full"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleAudioPlayer;
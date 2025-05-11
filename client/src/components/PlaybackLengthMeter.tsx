import React from 'react';
import { Clock } from 'lucide-react';

export interface PlaybackInfo {
  isPlaying: boolean;
  duration: number; // Total duration in seconds
  progress: number; // 0-100 percentage
  label?: string;
}

interface PlaybackLengthMeterProps {
  playbackInfo: PlaybackInfo | null;
  className?: string;
}

export function PlaybackLengthMeter({ playbackInfo, className = '' }: PlaybackLengthMeterProps) {
  // Format time in MM:SS format
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Calculate remaining time for playback
  const calculateRemainingTime = () => {
    if (!playbackInfo || !playbackInfo.duration) return "0:00";
    const elapsedSeconds = (playbackInfo.duration * playbackInfo.progress) / 100;
    const remainingSeconds = playbackInfo.duration - elapsedSeconds;
    return formatTime(remainingSeconds);
  };

  return (
    <div className={`p-2 border-t border-zinc-800 bg-zinc-900 mt-auto ${className}`}>
      <div className="w-full flex items-center gap-2">
        {playbackInfo && playbackInfo.isPlaying ? (
          <>
            <div className="text-xs flex items-center gap-1 text-[#17f900]">
              <Clock className="h-3 w-3" />
              {formatTime(playbackInfo.duration || 0)}
            </div>
            {playbackInfo.label && (
              <div className="text-xs text-[#17f900] truncate max-w-[100px]">
                {playbackInfo.label}
              </div>
            )}
            <div className="flex-1 h-4 bg-zinc-800 rounded-sm overflow-hidden relative">
              <div 
                className="h-full transition-all duration-300 absolute top-0 left-0"
                style={{ width: `${playbackInfo.progress}%`, backgroundColor: '#17f900' }}
              />
            </div>
            <div className="text-xs flex items-center gap-1 text-[#17f900] opacity-80">
              -{calculateRemainingTime()}
            </div>
          </>
        ) : (
          <>
            <div className="text-xs flex items-center gap-1 text-[#17f900] opacity-40">
              <Clock className="h-3 w-3" />
              0:00
            </div>
            <div className="flex-1 h-4 bg-zinc-800 rounded-sm overflow-hidden">
              <div className="h-full w-0" style={{ backgroundColor: '#17f900', opacity: 0.3 }}></div>
            </div>
            <div className="text-xs flex items-center gap-1 text-[#17f900] opacity-40">
              -0:00
            </div>
          </>
        )}
      </div>
    </div>
  );
}
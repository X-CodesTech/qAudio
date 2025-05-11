import React, { useState, useEffect } from 'react';
import { Music, Play, Disc } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface PlayoutStatusDisplayProps {
  studioId?: string;
  simulationActive?: boolean;
}

interface PlayoutPlayer {
  status: 'playing' | 'ready' | 'empty';
  trackTitle: string;
  artist: string;
  duration: number;
  elapsed: number;
  audioLevels: {
    left: number;
    right: number;
  };
}

const PlayoutStatusDisplay: React.FC<PlayoutStatusDisplayProps> = ({ studioId = "A", simulationActive = false }) => {
  // Demo state for player A and B
  const [playerA, setPlayerA] = useState<PlayoutPlayer>({
    status: 'playing',
    trackTitle: 'The Sound of Music',
    artist: 'DJ Audio Master',
    duration: 180,
    elapsed: 45,
    audioLevels: { left: 70, right: 65 }
  });
  
  const [playerB, setPlayerB] = useState<PlayoutPlayer>({
    status: 'ready',
    trackTitle: 'Rhythm of the Night',
    artist: 'The Night Crew',
    duration: 210,
    elapsed: 0,
    audioLevels: { left: 0, right: 0 }
  });
  
  // Track peak values for audio meters
  const [peakLevels, setPeakLevels] = useState({
    playerA: { left: 0, right: 0 },
    playerB: { left: 0, right: 0 }
  });
  
  // Simulate track progression and player switching
  useEffect(() => {
    if (!simulationActive) return;
    
    const interval = setInterval(() => {
      if (playerA.status === 'playing') {
        // Increment elapsed time
        setPlayerA(prev => ({
          ...prev,
          elapsed: prev.elapsed + 1 > prev.duration ? 0 : prev.elapsed + 1
        }));
      }
      
      // Simulate switching to player B when player A finishes
      if (playerA.elapsed >= playerA.duration - 1 && playerB.status === 'ready') {
        setPlayerA({
          ...playerB,
          status: 'playing',
          elapsed: 0,
          audioLevels: { left: 60, right: 55 }
        });
        
        // Set player B to a new random track
        setPlayerB({
          status: 'ready',
          trackTitle: `New Track ${Math.floor(Math.random() * 100)}`,
          artist: `Artist ${Math.floor(Math.random() * 50)}`,
          duration: Math.floor(Math.random() * 100) + 120,
          elapsed: 0,
          audioLevels: { left: 0, right: 0 }
        });
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [playerA, playerB, simulationActive]);
  
  // Audio level meter animation with music rhythm simulation
  useEffect(() => {
    if (!simulationActive) {
      // Reset audio levels when simulation is turned off
      setPlayerA(prev => ({
        ...prev,
        audioLevels: { left: 0, right: 0 }
      }));
      setPlayerB(prev => ({
        ...prev,
        audioLevels: { left: 0, right: 0 }
      }));
      setPeakLevels({
        playerA: { left: 0, right: 0 },
        playerB: { left: 0, right: 0 }
      });
      return;
    }
    
    // Generate a more realistic audio level pattern that simulates music
    const createRealisticAudioLevel = () => {
      // Base level - more dynamic when simulation is active
      const baseLevel = 55;
      
      // Random fluctuation amount to simulate beat patterns
      const beatIntensity = Math.random() < 0.2 ? 35 : 15; // Occasional peaks
      
      // Generate slightly different values for left and right for stereo effect
      const left = Math.min(Math.max(baseLevel + (Math.random() * beatIntensity), 30), 95);
      const right = Math.min(Math.max(baseLevel + (Math.random() * beatIntensity) - 5, 30), 95);
      
      return { left, right };
    };
    
    const levelInterval = setInterval(() => {
      if (playerA.status === 'playing') {
        const newLevels = createRealisticAudioLevel();
        
        setPlayerA(prev => ({
          ...prev,
          audioLevels: newLevels
        }));
        
        // Update peak levels for playerA
        setPeakLevels(prev => ({
          ...prev,
          playerA: {
            left: Math.max(prev.playerA.left, newLevels.left),
            right: Math.max(prev.playerA.right, newLevels.right)
          }
        }));
      }
      
      // Also update Player B levels if it's in playing status
      if (playerB.status === 'playing') {
        const newLevels = createRealisticAudioLevel();
        
        setPlayerB(prev => ({
          ...prev,
          audioLevels: newLevels
        }));
        
        // Update peak levels for playerB
        setPeakLevels(prev => ({
          ...prev,
          playerB: {
            left: Math.max(prev.playerB.left, newLevels.left),
            right: Math.max(prev.playerB.right, newLevels.right)
          }
        }));
      }
      
      // Decay peak levels over time
      setPeakLevels(prev => ({
        playerA: {
          left: prev.playerA.left > 0 ? prev.playerA.left * 0.95 : 0,
          right: prev.playerA.right > 0 ? prev.playerA.right * 0.95 : 0
        },
        playerB: {
          left: prev.playerB.left > 0 ? prev.playerB.left * 0.95 : 0,
          right: prev.playerB.right > 0 ? prev.playerB.right * 0.95 : 0
        }
      }));
    }, 80); // Faster updates for smoother animation
    
    return () => clearInterval(levelInterval);
  }, [playerA.status, playerB.status, simulationActive]);
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Player A */}
      <Card className={`bg-gradient-to-br from-zinc-900 to-slate-900 border ${
        playerA.status === 'playing' 
          ? 'border-red-600 shadow-md shadow-red-700/20' 
          : 'border-zinc-800'
      }`}>
        <CardHeader className={`py-2 px-3 border-b ${
          playerA.status === 'playing' 
            ? 'bg-gradient-to-r from-red-950 to-black border-red-900/50' 
            : 'bg-gradient-to-r from-zinc-900 to-black border-zinc-800'
        }`}>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-red-100">
              <Disc className={`h-4 w-4 ${playerA.status === 'playing' ? 'text-red-400 animate-spin' : 'text-zinc-400'}`} />
              Player A {playerA.status === 'playing' && <span className="ml-2 text-xs px-1.5 py-0.5 bg-red-600 rounded-sm slow-blink">ON AIR</span>}
            </div>
            <span className="text-xs font-medium text-zinc-400">
              {formatTime(playerA.elapsed)} / {formatTime(playerA.duration)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-white truncate">{playerA.trackTitle}</h3>
              <p className="text-xs text-zinc-400 truncate">{playerA.artist}</p>
            </div>
            
            <div>
              <Progress value={(playerA.elapsed / playerA.duration) * 100} className="h-1 mb-2" />
            </div>
            
            {/* Audio level meters */}
            <div className="flex gap-1 h-7">
              {/* Left channel */}
              <div className="flex-1 bg-black/80 rounded-sm overflow-hidden flex items-end relative">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-75 shadow-glow"
                  style={{ width: `${playerA.audioLevels.left}%` }}
                />
                {/* Peak indicator */}
                <div 
                  className="absolute h-1 bg-red-500 top-0 transition-all duration-150"
                  style={{ left: `${peakLevels.playerA.left}%`, width: '2px' }}
                />
                {/* Segmented meter overlay */}
                <div className="absolute inset-0 flex w-full">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div 
                      key={`left-${i}`}
                      className="flex-1 border-r border-black/30 h-full"
                    />
                  ))}
                </div>
              </div>
              
              {/* Right channel */}
              <div className="flex-1 bg-black/80 rounded-sm overflow-hidden flex items-end relative">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-75 shadow-glow"
                  style={{ width: `${playerA.audioLevels.right}%` }}
                />
                {/* Peak indicator */}
                <div 
                  className="absolute h-1 bg-red-500 top-0 transition-all duration-150"
                  style={{ left: `${peakLevels.playerA.right}%`, width: '2px' }}
                />
                {/* Segmented meter overlay */}
                <div className="absolute inset-0 flex w-full">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div 
                      key={`right-${i}`}
                      className="flex-1 border-r border-black/30 h-full"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Player B */}
      <Card className={`bg-gradient-to-br from-zinc-900 to-slate-900 border ${
        playerB.status === 'playing' 
          ? 'border-red-600 shadow-md shadow-red-700/20' 
          : playerB.status === 'ready' 
            ? 'border-green-600 shadow-md shadow-green-700/20' 
            : 'border-zinc-800'
      }`}>
        <CardHeader className={`py-2 px-3 border-b ${
          playerB.status === 'playing' 
            ? 'bg-gradient-to-r from-red-950 to-black border-red-900/50' 
            : playerB.status === 'ready'
              ? 'bg-gradient-to-r from-green-950 to-black border-green-900/50'
              : 'bg-gradient-to-r from-zinc-900 to-black border-zinc-800'
        }`}>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-zinc-100">
              <Play className={`h-4 w-4 ${
                playerB.status === 'playing' 
                  ? 'text-red-400' 
                  : playerB.status === 'ready' 
                    ? 'text-green-400' 
                    : 'text-zinc-400'
              }`} />
              Player B {playerB.status === 'ready' && <span className="ml-2 text-xs px-1.5 py-0.5 bg-green-600 rounded-sm">READY</span>}
              {playerB.status === 'playing' && <span className="ml-2 text-xs px-1.5 py-0.5 bg-red-600 rounded-sm slow-blink">ON AIR</span>}
            </div>
            <span className="text-xs font-medium text-zinc-400">
              {formatTime(playerB.elapsed)} / {formatTime(playerB.duration)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-white truncate">{playerB.trackTitle}</h3>
              <p className="text-xs text-zinc-400 truncate">{playerB.artist}</p>
            </div>
            
            <div>
              <Progress value={(playerB.elapsed / playerB.duration) * 100} className="h-1 mb-2" />
            </div>
            
            {/* Audio level meters */}
            <div className="flex gap-1 h-7">
              {/* Left channel */}
              <div className="flex-1 bg-black/80 rounded-sm overflow-hidden flex items-end relative">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-75 shadow-glow"
                  style={{ width: `${playerB.audioLevels.left}%` }}
                />
                {/* Peak indicator */}
                <div 
                  className="absolute h-1 bg-red-500 top-0 transition-all duration-150"
                  style={{ left: `${peakLevels.playerB.left}%`, width: '2px' }}
                />
                {/* Segmented meter overlay */}
                <div className="absolute inset-0 flex w-full">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div 
                      key={`b-left-${i}`}
                      className="flex-1 border-r border-black/30 h-full"
                    />
                  ))}
                </div>
              </div>
              
              {/* Right channel */}
              <div className="flex-1 bg-black/80 rounded-sm overflow-hidden flex items-end relative">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all duration-75 shadow-glow"
                  style={{ width: `${playerB.audioLevels.right}%` }}
                />
                {/* Peak indicator */}
                <div 
                  className="absolute h-1 bg-red-500 top-0 transition-all duration-150"
                  style={{ left: `${peakLevels.playerB.right}%`, width: '2px' }}
                />
                {/* Segmented meter overlay */}
                <div className="absolute inset-0 flex w-full">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div 
                      key={`b-right-${i}`}
                      className="flex-1 border-r border-black/30 h-full"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlayoutStatusDisplay;
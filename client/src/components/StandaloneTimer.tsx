import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Clock, Timer } from 'lucide-react';
import { useCountdown } from '@/contexts/CountdownContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type StandaloneTimerProps = {
  studio: 'A' | 'B' | 'C' | 'D';
  variant: 'producer' | 'talent';
};

export default function StandaloneTimer({ studio, variant }: StandaloneTimerProps) {
  // Get countdown context
  const countdown = useCountdown(studio);
  const timeRemaining = countdown?.timeRemaining || 300; // Default to 5 minutes if null
  const isRunning = countdown?.isRunning || false;
  
  // Local danger zone state
  const [isDangerZone, setIsDangerZone] = useState<boolean>(timeRemaining <= 120);
  
  // State for timer set dialog
  const [showSetDialog, setShowSetDialog] = useState(false);
  const [minutes, setMinutes] = useState(Math.floor(timeRemaining / 60).toString());
  const [seconds, setSeconds] = useState((timeRemaining % 60).toString());
  
  // State for live clock
  const [currentTime, setCurrentTime] = useState<string>(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );
  
  // Format seconds to mm:ss:00 (digital clock style with seconds) 
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '00:00:00'; // Handle NaN case
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    // Format as mm:ss:00 to show seconds display format
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}:00`;
  };
  
  // Effect to update danger zone state when timeRemaining changes
  useEffect(() => {
    setIsDangerZone(timeRemaining <= 120);
  }, [timeRemaining]);
  
  // Update the clock every second
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    }, 1000);
    
    return () => clearInterval(clockInterval);
  }, []);
  
  // Start the timer
  const startTimer = () => {
    if (countdown && timeRemaining > 0) {
      countdown.startTimer();
    }
  };
  
  // Pause the timer
  const pauseTimer = () => {
    if (countdown) {
      countdown.pauseTimer();
    }
  };
  
  // Reset the timer
  const resetTimer = () => {
    if (countdown) {
      countdown.resetTimer();
      setIsDangerZone(false);
    }
  };
  
  // Open timer set dialog
  const openSetDialog = () => {
    setMinutes(Math.floor(timeRemaining / 60).toString());
    setSeconds((timeRemaining % 60).toString());
    setShowSetDialog(true);
  };
  
  // Apply timer settings
  const applyTimerSettings = () => {
    if (countdown) {
      const newMinutes = parseInt(minutes) || 0;
      const newSeconds = parseInt(seconds) || 0;
      const newTotalSeconds = (newMinutes * 60) + newSeconds;
      
      countdown.setTimeRemaining(newTotalSeconds);
      setIsDangerZone(newTotalSeconds <= 120);
    }
    setShowSetDialog(false);
  };
  
  // Producer view (with controls)
  if (variant === 'producer') {
    return (
      <>
        <div className="flex items-center justify-between h-full w-full py-1">
          <div className="flex w-full gap-3">
            {/* Digital Clock */}
            <div 
              className="rounded-none shadow-lg border border-zinc-700 p-2 flex items-center justify-center" 
              style={{ width: '38%' }}
            >
              <div className="flex items-center justify-center w-full">
                <div className="flex items-center justify-center">
                  <Clock className="h-5 w-5 text-[#e9b902] mr-1.5" />
                  <span className="text-[32px] font-bold font-mono text-[#e9b902] drop-shadow-[0_0_4px_rgba(233,185,2,0.5)]">
                    {currentTime}
                  </span>
                </div>
              </div>
            </div>
          
            {/* Timer display - Digital clock style with #fe0303 red color */}
            <div 
              className={`rounded-none shadow-lg border p-1 flex items-center justify-between flex-1 ${
                isDangerZone ? 'animate-slow-pulse border-red-800' : 'border-zinc-700'
              }`}
            >
              <div className="w-full flex items-center justify-center">
                <div className="flex items-center justify-center">
                  <span 
                    className={`text-3xl font-mono font-extrabold text-center tracking-wider
                      ${isDangerZone ? 'animate-slow-pulse text-[#ff0000] animate-timer-glow' : 'text-[#fe0303]'}`}
                  style={isDangerZone ? { 
                    textShadow: '0 0 15px rgba(255, 0, 0, 1), 0 0 8px rgba(255, 0, 0, 0.8), 0 0 4px rgba(255, 0, 0, 0.6)',
                    filter: 'drop-shadow(0 0 10px rgba(255, 0, 0, 1))',
                    WebkitTextStroke: '1px rgba(255, 80, 80, 0.8)'
                  } : {
                    textShadow: '0 0 10px rgba(254, 3, 3, 0.6), 0 0 4px rgba(254, 3, 3, 0.4)',
                  }}
                >
                  {formatTime(timeRemaining)}
                </span>
                </div>
              </div>
              
              {/* Control buttons beside the time */}
              <div className="flex items-center justify-end gap-1 mr-2">
                {isRunning ? (
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 p-0.5 border-white bg-black hover:bg-zinc-800"
                    onClick={pauseTimer}
                  >
                    <Pause className="h-5 w-5 text-white" />
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 p-0.5 border-white bg-black hover:bg-zinc-800"
                    onClick={startTimer}
                    disabled={timeRemaining === 0}
                  >
                    <Play className="h-5 w-5 text-white" />
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8 p-0.5 border-white bg-black hover:bg-zinc-800"
                  onClick={resetTimer}
                >
                  <RotateCcw className="h-5 w-5 text-white" />
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 border-white bg-black hover:bg-zinc-800 text-white text-xs"
                  onClick={openSetDialog}
                >
                  <Timer className="h-4 w-4 mr-1 text-white" />
                  Set
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Set Timer Dialog */}
        <Dialog open={showSetDialog} onOpenChange={setShowSetDialog}>
          <DialogContent className="bg-zinc-900 border-zinc-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-white">Set Timer - Studio {studio}</DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="minutes" className="text-white">Minutes</Label>
                <Input 
                  id="minutes"
                  type="number" 
                  min="0" 
                  max="59"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  className="bg-zinc-800 border-zinc-600 text-white"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="seconds" className="text-white">Seconds</Label>
                <Input 
                  id="seconds"
                  type="number" 
                  min="0" 
                  max="59"
                  value={seconds}
                  onChange={(e) => setSeconds(e.target.value)}
                  className="bg-zinc-800 border-zinc-600 text-white"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowSetDialog(false)} 
                className="bg-zinc-800 border-zinc-600 text-white"
              >
                Cancel
              </Button>
              <Button 
                onClick={applyTimerSettings} 
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Apply
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }
  
  // Talent view (display only) with digital clock style
  return (
    <div className="flex items-center justify-center h-full w-full py-1">
      <div className="flex w-full gap-3">
        {/* Digital Clock - improved for talent view */}
        <div 
          className="rounded-none shadow-lg p-2 flex items-center justify-center"
          style={{ width: '38%' }}
        >
          <div className="flex items-center justify-center w-full">
            <div className="flex items-center justify-center">
              <Clock className="h-5 w-5 text-[#e9b902] mr-1.5" />
              <span className="text-[32px] font-bold font-mono text-[#e9b902] drop-shadow-[0_0_4px_rgba(233,185,2,0.5)]">
                {currentTime}
              </span>
            </div>
          </div>
        </div>
      
        {/* Timer display - improved */}
        <div 
          className={`rounded-none flex-1 shadow-lg p-1 flex items-center justify-center ${
            isDangerZone ? 'animate-slow-pulse' : ''
          }`}
        >
          <span 
            className={`text-5xl font-mono font-extrabold text-center tracking-wider
              ${isDangerZone ? 'animate-slow-pulse text-[#ff0000] animate-timer-glow' : 'text-[#fe0303]'}`}
            style={isDangerZone ? { 
              textShadow: '0 0 15px rgba(255, 0, 0, 1), 0 0 8px rgba(255, 0, 0, 0.8), 0 0 4px rgba(255, 0, 0, 0.6)',
              filter: 'drop-shadow(0 0 10px rgba(255, 0, 0, 1))',
              WebkitTextStroke: '1px rgba(255, 80, 80, 0.8)'
            } : {
              textShadow: '0 0 10px rgba(254, 3, 3, 0.6), 0 0 4px rgba(254, 3, 3, 0.4)',
            }}
          >
            {formatTime(timeRemaining)}
          </span>
        </div>
      </div>
    </div>
  );
}
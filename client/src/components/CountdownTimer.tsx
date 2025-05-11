import React, { useState } from 'react';
import { useCountdown } from '@/contexts/CountdownContext';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, Play, Pause, RotateCcw, Timer, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Utility function to format time in MM:SS format
const formatTime = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

interface CountdownTimerProps {
  studio: 'A' | 'B';
  variant: 'producer' | 'talent';
}

export default function CountdownTimer({ studio, variant }: CountdownTimerProps) {
  const { t } = useTranslation();
  const {
    studioAState,
    studioBState,
    startStudioA,
    startStudioB,
    pauseStudioA,
    pauseStudioB,
    resetStudioA,
    resetStudioB,
    setStudioATime,
    setStudioBTime
  } = useCountdown(); // Hook doesn't take parameters
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [minutes, setMinutes] = useState<number>(5);

  // Select appropriate state and functions based on studio
  const state = studio === 'A' ? studioAState : studioBState;
  const startCountdown = studio === 'A' ? startStudioA : startStudioB;
  const pauseCountdown = studio === 'A' ? pauseStudioA : pauseStudioB;
  const resetCountdown = studio === 'A' ? resetStudioA : resetStudioB;
  const setCountdownTime = studio === 'A' ? setStudioATime : setStudioBTime;

  // Set the countdown time and close the dialog
  const handleSetCountdown = () => {
    setCountdownTime(minutes);
    setIsDialogOpen(false);
  };

  // For producer view, show controls
  if (variant === 'producer') {
    return (
      <div className="flex flex-col">
        {/* Dialog for setting the countdown time */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-zinc-900 text-white border-zinc-700">
            <DialogHeader>
              <DialogTitle>{t('producer.setCountdown')}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="minutes" className="text-right">
                  {t('common.minutes')}
                </Label>
                <Input
                  id="minutes"
                  type="number"
                  value={minutes}
                  onChange={(e) => setMinutes(Number(e.target.value))}
                  className="col-span-3 bg-zinc-800 border-zinc-700"
                  min={1}
                  max={60}
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="submit" 
                onClick={handleSetCountdown}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {t('common.set')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // For talent view, show only the timer with more prominence
  return (
    <div className="w-full">
      <div 
        className={`flex items-center justify-center p-3 rounded-md ${
          state.isDangerZone 
            ? state.isRunning 
              ? studio === 'A'
                ? 'bg-black text-white border-2 border-blue-500 animate-pulse shadow-lg shadow-blue-500/50' 
                : 'bg-black text-white border-2 border-green-500 animate-pulse shadow-lg shadow-green-500/50'
              : studio === 'A'
                ? 'bg-black text-white border-2 border-blue-500 shadow-lg' 
                : 'bg-black text-white border-2 border-green-500 shadow-lg'
            : 'bg-black text-white border-2 border-zinc-600'
        } ${state.timeRemaining > 0 ? 'opacity-100' : 'opacity-50'}`}
      >
        <div className="flex items-center gap-3">
          {state.isDangerZone && (
            <AlertTriangle className={`h-6 w-6 ${studio === 'A' ? 'text-blue-300' : 'text-green-300'} ${state.isRunning ? 'animate-pulse' : ''}`} />
          )}
          {!state.isDangerZone && (
            <Clock className="h-6 w-6 text-white" />
          )}
          <span className="text-2xl font-mono font-bold text-white">
            {formatTime(state.timeRemaining)}
          </span>
          <span className={`text-base font-semibold ${
            state.isDangerZone 
              ? studio === 'A' ? 'text-blue-300' : 'text-green-300'
              : 'text-white'
          }`}>
            {state.isDangerZone 
              ? t('talent.almostTime')
              : t('talent.timeRemaining')
            }
          </span>
        </div>
      </div>
      {/* Add a clear studio indicator */}
      <div className={`text-center mt-1 text-sm font-semibold ${studio === 'A' ? 'text-blue-400' : 'text-green-400'}`}>
        {t('talent.studioCountdown', { studio })}
      </div>
    </div>
  );
}
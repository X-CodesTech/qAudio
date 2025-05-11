import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Power, AlertCircle, Square } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AudioProcessingControlsProps {
  isProcessing: boolean;
  isStartingProcessor: boolean;
  hasRealAudio: boolean;
  onStartProcessing: () => void;
  audioInputDevices: any[];
  audioOutputDevices: any[];
}

/**
 * Dedicated component for audio processing controls
 * This component makes it very clear to users when they are using 
 * simulated audio vs real audio processing
 */
const AudioProcessingControls = ({
  isProcessing,
  isStartingProcessor,
  hasRealAudio,
  onStartProcessing,
  audioInputDevices,
  audioOutputDevices
}: AudioProcessingControlsProps) => {
  const { toast } = useToast();
  const [showToast, setShowToast] = useState(true);
  
  // Show a reminder toast if not processing with real audio
  useEffect(() => {
    if (!isProcessing && showToast) {
      toast({
        title: "Real Audio Not Active",
        description: "Click 'START AUDIO PROCESSING' to use real audio devices instead of simulation",
        duration: 7000,
      });
      setShowToast(false);
      
      // Show reminder again after 60 seconds if still not processing
      const timer = setTimeout(() => {
        if (!isProcessing) {
          setShowToast(true);
        }
      }, 60000);
      
      return () => clearTimeout(timer);
    }
  }, [isProcessing, showToast, toast]);
  
  return (
    <div className="mt-6 mb-8 bg-black/30 border border-yellow-600/30 rounded-lg p-4">
      <div className="flex items-center mb-2">
        <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
        <h3 className="text-base font-medium text-yellow-500">Audio Processor Status</h3>
      </div>
      
      <div className="text-sm text-yellow-200/70 mb-4">
        {isProcessing ? (
          <div>
            <p className="flex items-center">
              <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              Audio processor is <span className="text-green-400 font-medium mx-1">ACTIVE</span> - 
              <span className={`ml-1 font-medium ${hasRealAudio ? 'text-green-400' : 'text-amber-400'}`}>
                {(window as any).testOscillator ? 'TEST OSCILLATOR MODE' : (hasRealAudio ? 'REAL HARDWARE MODE' : 'SIMULATED MODE')}
              </span>
            </p>
            {hasRealAudio && (
              <p className="mt-1 text-xs text-green-300">
                {(window as any).testOscillator 
                  ? "✓ Using test oscillator with real audio processor chain" 
                  : "✓ Using real audio hardware for input and output"}
              </p>
            )}
          </div>
        ) : (
          <p className="flex items-center">
            <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
            Audio processor is <span className="text-red-400 font-medium mx-1">INACTIVE</span> - 
            <span className="ml-1 text-gray-400 font-medium">Currently in DEMO mode</span>
          </p>
        )}
        
        <div className="mt-2 text-xs flex flex-col gap-1">
          {audioInputDevices.length > 0 ? (
            <>
              <p className="flex items-center">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                Detected {audioInputDevices.length} input device{audioInputDevices.length !== 1 ? 's' : ''}
              </p>
              <p className="flex items-center">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                Detected {audioOutputDevices.length} output device{audioOutputDevices.length !== 1 ? 's' : ''}
              </p>
            </>
          ) : (
            <p className="flex items-center">
              <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-1"></span>
              No audio devices detected. Check browser permissions.
            </p>
          )}
        </div>
      </div>
      
      <Button
        type="button"
        size="lg"
        variant={isProcessing ? "destructive" : "default"}
        onClick={onStartProcessing}
        disabled={isStartingProcessor}
        className={`w-full font-bold ${!isProcessing ? 'bg-green-600 hover:bg-green-700 animate-pulse' : ''}`}
      >
        {isStartingProcessor ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Activating Audio Processor...
          </>
        ) : isProcessing ? (
          <>
            <Square className="h-5 w-5 mr-2" /> Stop Audio Processing
          </>
        ) : (
          <>
            <Power className="h-5 w-5 mr-2" /> START AUDIO PROCESSING
          </>
        )}
      </Button>
    </div>
  );
};

export default AudioProcessingControls;
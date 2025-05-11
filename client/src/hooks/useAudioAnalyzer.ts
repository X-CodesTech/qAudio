import { useState, useEffect, useRef } from 'react';

interface AudioLevels {
  left: number;
  right: number;
  peak: {
    left: number;
    right: number;
  };
}

/**
 * Hook for analyzing audio levels from an HTML audio element
 * 
 * This hook connects to an audio element and provides real-time
 * audio level analysis for both left and right channels.
 * 
 * @param audioRef - Reference to an HTML audio element
 * @param options - Configuration options for the analyzer
 * @returns Current audio levels and peak values
 */
export function useAudioAnalyzer(
  audioElement: HTMLAudioElement | null,
  options?: {
    fftSize?: number;
    smoothingTimeConstant?: number;
    refreshRate?: number;
    peakFalloffRate?: number;
  }
) {
  // Default options
  const {
    fftSize = 1024,
    smoothingTimeConstant = 0.8,
    refreshRate = 50,
    peakFalloffRate = 2
  } = options || {};

  // State for audio levels
  const [audioLevels, setAudioLevels] = useState<AudioLevels>({
    left: 0,
    right: 0,
    peak: {
      left: 0,
      right: 0
    }
  });

  // Refs for Web Audio API objects
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserLeftRef = useRef<AnalyserNode | null>(null);
  const analyserRightRef = useRef<AnalyserNode | null>(null);
  const splitterRef = useRef<ChannelSplitterNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const dataArrayLeftRef = useRef<Uint8Array | null>(null);
  const dataArrayRightRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isConnectedRef = useRef<boolean>(false);
  
  // Current peak levels for falloff animation
  const peakLeftRef = useRef<number>(0);
  const peakRightRef = useRef<number>(0);
  const lastUpdateTimeRef = useRef<number>(Date.now());

  // Set up audio analyzer when audio element is available
  useEffect(() => {
    if (!audioElement) return;
    
    const setupAnalyzer = () => {
      try {
        // Create audio context if not already created
        if (!audioContextRef.current) {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          audioContextRef.current = new AudioContext();
        }
        
        // Create analyzer nodes for each channel if not already created
        if (!analyserLeftRef.current) {
          const analyserLeft = audioContextRef.current.createAnalyser();
          analyserLeft.fftSize = fftSize;
          analyserLeft.smoothingTimeConstant = smoothingTimeConstant;
          analyserLeftRef.current = analyserLeft;
          
          // Create data array for left channel
          dataArrayLeftRef.current = new Uint8Array(analyserLeft.frequencyBinCount);
        }
        
        if (!analyserRightRef.current) {
          const analyserRight = audioContextRef.current.createAnalyser();
          analyserRight.fftSize = fftSize;
          analyserRight.smoothingTimeConstant = smoothingTimeConstant;
          analyserRightRef.current = analyserRight;
          
          // Create data array for right channel
          dataArrayRightRef.current = new Uint8Array(analyserRight.frequencyBinCount);
        }
        
        // Create channel splitter if not already created
        if (!splitterRef.current) {
          splitterRef.current = audioContextRef.current.createChannelSplitter(2);
        }
        
        // Connect the audio source to the analyzers
        if (!isConnectedRef.current && audioContextRef.current.state !== 'closed') {
          try {
            // Create media source from audio element
            if (!sourceNodeRef.current) {
              sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioElement);
            }
            
            // Connect the source to the splitter
            sourceNodeRef.current.connect(splitterRef.current);
            
            // Connect splitter outputs to analyzers
            splitterRef.current.connect(analyserLeftRef.current, 0);
            splitterRef.current.connect(analyserRightRef.current, 1);
            
            // Connect source back to destination for audio output
            sourceNodeRef.current.connect(audioContextRef.current.destination);
            
            isConnectedRef.current = true;
          } catch (error) {
            // Handle already connected errors - this can happen if the audio element
            // is already connected to another audio context
            console.warn("Error connecting audio source:", error);
            return false;
          }
        }
        
        return true;
      } catch (error) {
        console.error("Failed to initialize audio analyzer:", error);
        return false;
      }
    };
    
    // If the audio element is available and ready, set up the analyzer
    const isSetupSuccessful = setupAnalyzer();
    
    // Resume audio context if suspended
    if (isSetupSuccessful && audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().catch(error => {
        console.warn("Could not resume audio context:", error);
      });
    }
    
    // Start the animation loop for continuous analysis
    startAnalysis();
    
    return () => {
      // Clean up animation frame on unmount
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [audioElement, fftSize, smoothingTimeConstant]);
  
  // Function to start audio analysis
  const startAnalysis = () => {
    if (!analyserLeftRef.current || !analyserRightRef.current || 
        !dataArrayLeftRef.current || !dataArrayRightRef.current) {
      return;
    }
    
    const analyzeFrame = () => {
      if (!analyserLeftRef.current || !analyserRightRef.current || 
          !dataArrayLeftRef.current || !dataArrayRightRef.current) {
        animationFrameRef.current = requestAnimationFrame(analyzeFrame);
        return;
      }
      
      // Get current time for update frequency control
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
      
      // Only update if enough time has passed (refresh rate control)
      if (timeSinceLastUpdate >= refreshRate) {
        // Get frequency data for each channel
        analyserLeftRef.current.getByteFrequencyData(dataArrayLeftRef.current);
        analyserRightRef.current.getByteFrequencyData(dataArrayRightRef.current);
        
        // Process frequency data to get RMS power
        const leftSum = dataArrayLeftRef.current.reduce((sum, value) => sum + (value * value), 0);
        const rightSum = dataArrayRightRef.current.reduce((sum, value) => sum + (value * value), 0);
        
        // Calculate RMS (root mean square) and normalize to 0-100 range
        const leftRMS = Math.sqrt(leftSum / dataArrayLeftRef.current.length);
        const rightRMS = Math.sqrt(rightSum / dataArrayRightRef.current.length);
        
        // Convert to percentages (0-100 scale)
        const leftLevel = Math.min(100, (leftRMS / 128) * 100);
        const rightLevel = Math.min(100, (rightRMS / 128) * 100);
        
        // Update peak values with falloff
        if (leftLevel > peakLeftRef.current) {
          peakLeftRef.current = leftLevel;
        } else {
          peakLeftRef.current = Math.max(leftLevel, peakLeftRef.current - peakFalloffRate);
        }
        
        if (rightLevel > peakRightRef.current) {
          peakRightRef.current = rightLevel;
        } else {
          peakRightRef.current = Math.max(rightLevel, peakRightRef.current - peakFalloffRate);
        }
        
        // Update state with new values
        setAudioLevels({
          left: leftLevel,
          right: rightLevel,
          peak: {
            left: peakLeftRef.current,
            right: peakRightRef.current
          }
        });
        
        // Update last update time
        lastUpdateTimeRef.current = now;
      }
      
      // Continue analysis loop
      animationFrameRef.current = requestAnimationFrame(analyzeFrame);
    };
    
    // Start the analysis loop
    animationFrameRef.current = requestAnimationFrame(analyzeFrame);
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop analysis loop
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      // Clean up audio nodes
      try {
        if (sourceNodeRef.current) {
          sourceNodeRef.current.disconnect();
        }
        
        if (splitterRef.current) {
          splitterRef.current.disconnect();
        }
        
        if (analyserLeftRef.current) {
          analyserLeftRef.current.disconnect();
        }
        
        if (analyserRightRef.current) {
          analyserRightRef.current.disconnect();
        }
        
        // Close audio context
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(error => {
            console.warn("Error closing audio context:", error);
          });
        }
      } catch (error) {
        console.warn("Error cleaning up audio analyzer:", error);
      }
    };
  }, []);
  
  return audioLevels;
}

export default useAudioAnalyzer;
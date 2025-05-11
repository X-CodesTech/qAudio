import React, { useEffect, useRef, useState } from 'react';

interface LevelBarsWaveformProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  waveformData?: string;
  isPlaying: boolean;
  height?: number;
  color?: string;
  backgroundColor?: string;
  accentColor?: string;
  isActive?: boolean;
  showProgress?: boolean;
  className?: string;
}

/**
 * Level Bars Waveform Visualizer
 * 
 * Features:
 * - Real-time audio level bar visualization
 * - Audio data analysis through Web Audio API
 * - Responsive design with dynamic bars
 * - Compatible with the existing player interface
 */
export function LevelBarsWaveform({
  audioRef,
  waveformData,
  isPlaying,
  height = 70,
  color = '#22dd08',
  backgroundColor = '#1f1f1f',
  accentColor = '#ff0000',
  isActive = false,
  showProgress = true,
  className = '',
}: LevelBarsWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const mediaElementSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  
  // Store levels for visualization
  const barCount = 32; // Number of level bars to display
  const [levels, setLevels] = useState<number[]>(Array(barCount).fill(0));
  const levelsRef = useRef<number[]>(Array(barCount).fill(0));
  const peakRef = useRef<number[]>(Array(barCount).fill(0));
  const frameCountRef = useRef(0);
  
  // Parse waveform data for fallback visualization when audio not playing
  const parseWaveformData = () => {
    if (!waveformData) return Array(barCount).fill(0);
    
    try {
      // Parse the waveform data string into an array
      const data = JSON.parse(waveformData);
      // If we have data, convert it to level bars format (average chunks)
      if (Array.isArray(data) && data.length > 0) {
        // Divide the waveform data into barCount chunks and calculate average for each
        const chunkSize = Math.floor(data.length / barCount);
        const levels = Array(barCount).fill(0);
        
        for (let i = 0; i < barCount; i++) {
          const startIdx = i * chunkSize;
          const endIdx = Math.min((i + 1) * chunkSize, data.length);
          
          // Calculate average for this chunk
          let sum = 0;
          for (let j = startIdx; j < endIdx; j++) {
            sum += Math.abs(data[j]);
          }
          levels[i] = sum / (endIdx - startIdx);
        }
        return levels.map(level => Math.min(1, level * 3)); // Scale values for better visualization
      }
    } catch (error) {
      console.warn("Failed to parse waveform data:", error);
    }
    
    return Array(barCount).fill(0);
  };

  // Initialize with any available waveform data
  useEffect(() => {
    const parsedLevels = parseWaveformData();
    setLevels(parsedLevels);
    levelsRef.current = parsedLevels;
    peakRef.current = [...parsedLevels];
  }, [waveformData]);

  // Set up audio context when audio element is available
  useEffect(() => {
    if (!audioRef?.current) return;
    if (audioContextRef.current) return;
    
    try {
      // Create audio context
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      // Create analyzer node
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256; // More appropriate for level bars (128 frequency bins)
      analyser.smoothingTimeConstant = 0.8; // Higher smoothing for level bars
      analyserRef.current = analyser;
      
      // Create data array for analyzer
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      dataArrayRef.current = dataArray;
    } catch (err) {
      console.error("Failed to initialize audio context:", err);
    }
  }, [audioRef?.current]);
  
  // Connect media source when playing starts/stops
  useEffect(() => {
    if (!audioRef?.current || !audioContextRef.current || !analyserRef.current) return;
    
    // Handle media source connection
    const connectSource = () => {
      // Only create a new media source if we don't have one
      if (!mediaElementSourceRef.current) {
        try {
          const mediaSource = audioContextRef.current!.createMediaElementSource(audioRef.current!);
          mediaElementSourceRef.current = mediaSource;
          
          // Connect the audio graph: mediaSource -> analyser -> destination
          mediaSource.connect(analyserRef.current!);
          analyserRef.current!.connect(audioContextRef.current!.destination);
          return true;
        } catch (err) {
          console.warn("Could not create media source (might already be connected):", err);
          return false;
        }
      }
      return true;
    };
    
    // If playing, ensure audio context is running and source is connected
    if (isPlaying) {
      // Resume audio context if suspended
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(err => {
          console.warn("Could not resume audio context:", err);
        });
      }
      
      // Connect source if not already connected
      connectSource();
    }
  }, [isPlaying, audioRef?.current]);
    
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
  // Start or stop the visualization based on isPlaying
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const drawLevelBars = () => {
      if (!canvasRef.current) {
        return;
      }
      
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;
      
      // Get dimensions
      const width = canvas.width;
      const canvasHeight = canvas.height;
      
      // Read data from analyzer if available and playing
      if (analyserRef.current && dataArrayRef.current && isPlaying) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        
        // Process frequency data into level bars
        const dataArray = dataArrayRef.current;
        const frequencyBinCount = analyserRef.current.frequencyBinCount;
        const binSize = Math.floor(frequencyBinCount / barCount);
        
        // Update level bars with a bit of smoothing
        const newLevels = Array(barCount).fill(0);
        
        for (let i = 0; i < barCount; i++) {
          // Each bar represents a frequency range
          const startBin = i * binSize;
          const endBin = Math.min(startBin + binSize, frequencyBinCount);
          
          // Calculate average volume in this frequency range
          let sum = 0;
          for (let j = startBin; j < endBin; j++) {
            sum += dataArray[j];
          }
          const average = sum / (endBin - startBin);
          
          // Normalize to 0-1 range
          newLevels[i] = average / 255;
          
          // Update peak for this bar with slow falloff
          if (newLevels[i] > peakRef.current[i]) {
            peakRef.current[i] = newLevels[i];
          } else {
            peakRef.current[i] = Math.max(0, peakRef.current[i] - 0.02); // Slow falloff
          }
        }
        
        // Apply smoothing between frames
        for (let i = 0; i < barCount; i++) {
          levelsRef.current[i] = levelsRef.current[i] * 0.7 + newLevels[i] * 0.3;
        }
      } else if (!isPlaying) {
        // When not playing, animate the waveform with a more dynamic effect
        const staticLevels = parseWaveformData();
        const pulseRate = 0.03; // Slower rate for more visible effect
        const pulseAmount = 0.4; // Increased pulse amount for more visibility
        
        // Animate a wave moving across the waveform
        for (let i = 0; i < barCount; i++) {
          // Create a wave that moves across the bars (phase offset based on position)
          const phaseOffset = (i / barCount) * Math.PI * 2; // spread across full width
          const waveFactor = 1 + Math.sin(frameCountRef.current * pulseRate + phaseOffset) * pulseAmount;
          
          // Apply wave factor to create movement across bars
          const targetLevel = staticLevels[i] * waveFactor;
          // Fast response to show animation clearly
          levelsRef.current[i] = levelsRef.current[i] * 0.7 + targetLevel * 0.3;
          // Also animate peak markers with slight delay
          peakRef.current[i] = peakRef.current[i] * 0.8 + (staticLevels[i] * waveFactor * 1.2) * 0.2;
        }
      }
      
      // Update state for React
      setLevels([...levelsRef.current]);
      
      // Increment frame counter for animation effects
      frameCountRef.current = (frameCountRef.current + 1) % 120;
      
      // Determine drawing color based on active state
      const mainColor = isActive ? accentColor : color;
      
      // Clear canvas
      context.clearRect(0, 0, width, canvasHeight);
      
      // Draw the level bars
      // Fill the entire width with bars, with minimal spacing
      const totalBarSpace = width;
      const gap = 1; // Minimal gap
      const barWidth = Math.floor(totalBarSpace / barCount) - gap;
      
      for (let i = 0; i < barCount; i++) {
        // Get bar height based on level
        const level = levelsRef.current[i];
        const peak = peakRef.current[i];
        
        // Calculate position
        const barHeight = Math.max(2, level * canvasHeight);
        const x = (barWidth + gap) * i + gap/2;
        const y = canvasHeight - barHeight;
        
        // Create gradient
        const gradient = context.createLinearGradient(0, canvasHeight, 0, 0);
        
        // Pulse effect for audio visualization
        const pulseRate = 0.1;
        const pulseAmount = 0.3;
        const pulseFactor = 1 + (Math.sin(frameCountRef.current * pulseRate) * pulseAmount * (isPlaying ? 1 : 0.8));
        
        // Dynamic color based on level and activity with 100% intensity
        if (isPlaying) {
          // Using full color intensity
          gradient.addColorStop(0, `${mainColor}`); // Base with 100% intensity
          gradient.addColorStop(0.7, `${mainColor}`); // Mid with 100% opacity
          gradient.addColorStop(1, `${mainColor}CC`); // Top with 80% opacity
        } else {
          gradient.addColorStop(0, `${mainColor}CC`); // Slightly subdued when not playing, 80% opacity
          gradient.addColorStop(1, `${mainColor}99`); // Subtle, 60% opacity
        }
        
        context.fillStyle = gradient;
        
        // Draw bar with rounded corners
        context.beginPath();
        const radius = Math.min(3, barWidth / 2);
        context.moveTo(x + radius, y);
        context.lineTo(x + barWidth - radius, y);
        context.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
        context.lineTo(x + barWidth, canvasHeight - radius);
        context.quadraticCurveTo(x + barWidth, canvasHeight, x + barWidth - radius, canvasHeight);
        context.lineTo(x + radius, canvasHeight);
        context.quadraticCurveTo(x, canvasHeight, x, canvasHeight - radius);
        context.lineTo(x, y + radius);
        context.quadraticCurveTo(x, y, x + radius, y);
        context.closePath();
        context.fill();
        
        // Draw peak marker
        const peakY = canvasHeight - (peak * canvasHeight);
        context.fillStyle = '#ffffff';
        context.fillRect(x, peakY, barWidth, 2);
      }
      
      // Draw progress bar if needed
      if (showProgress && audioRef.current) {
        const currentTime = audioRef.current.currentTime;
        const duration = audioRef.current.duration || 1;
        const progress = currentTime / duration;
        const progressX = width * progress;
        
        // Check if we are in the last 60 seconds
        const remainingTime = duration - currentTime;
        const isNearEnd = remainingTime <= 60 && remainingTime > 0;
        
        // Add glow effect to the progress line
        if (isPlaying) {
          // If near end, use a 2-second slow pulse blinking effect
          if (isNearEnd) {
            // Slow pulse effect (2 second cycle)
            const blinkFactor = (Math.sin(frameCountRef.current * 0.05) + 1) / 2; // 0.05 gives approx 2-second cycle
            const glowWidth = 5 + (blinkFactor * 8); // Wider glow for more visibility when blinking
            const glowOpacity = 0.4 + (blinkFactor * 0.6); // Vary from 40% to 100% opacity
            
            // Red warning color for blink
            context.fillStyle = `rgba(255, 0, 0, ${glowOpacity})`;
            context.fillRect(progressX - glowWidth/2, 0, glowWidth, canvasHeight);
          } else {
            // Normal glow for non-warning state
            const glowWidth = 3 + (Math.sin(frameCountRef.current * 0.2) * 2); // Regular pulsing glow
            context.fillStyle = `${mainColor}40`; // Semi-transparent glow
            context.fillRect(progressX - glowWidth/2, 0, glowWidth, canvasHeight);
          }
        }
        
        // Main progress line - white for normal, red pulse for warning
        if (isNearEnd && isPlaying) {
          // Use slow blinking effect from our pulse animation
          const blinkFactor = (Math.sin(frameCountRef.current * 0.05) + 1) / 2; // 0.05 for 2-second cycle
          context.fillStyle = `rgba(255, ${Math.floor(blinkFactor * 255)}, 0, 1)`;
          context.fillRect(progressX - 1, 0, 2, canvasHeight); // Slightly thicker for visibility
        } else {
          context.fillStyle = '#ffffff';
          context.fillRect(progressX, 0, 1, canvasHeight);
        }
      }
      
      // Continue animation loop
      animationRef.current = requestAnimationFrame(drawLevelBars);
    };
    
    // Start animation
    animationRef.current = requestAnimationFrame(drawLevelBars);
    
    return () => {
      // Clean up animation on unmount or state change
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, color, backgroundColor, accentColor, isActive, showProgress, waveformData]);
  
  return (
    <canvas
      ref={canvasRef}
      className={`level-bars-waveform ${className}`}
      width={300}
      height={height}
      style={{ width: '100%', height: `${height}px` }}
    />
  );
}

export default LevelBarsWaveform;
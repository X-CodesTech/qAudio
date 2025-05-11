import React, { useEffect, useRef, useState } from 'react';

interface ProfessionalWaveformProps {
  audioRef: React.RefObject<HTMLAudioElement>;
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
 * Professional Real-time Waveform Visualizer
 * 
 * Features:
 * - Real-time audio input/output handling through Web Audio API
 * - Buffering for smooth visualization with circular buffer approach
 * - Signal processing with RMS and peak detection
 * - Scrolling waveform visualization
 * - Gradient coloring based on signal intensity
 * - Responsive design
 */
export function ProfessionalWaveform({
  audioRef,
  isPlaying,
  height = 70,
  color = '#06ef45',
  backgroundColor = '#1f1f1f',
  accentColor = '#ff0000',
  isActive = false,
  showProgress = true,
  className = '',
}: ProfessionalWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const mediaElementSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  
  // Rolling buffer for smooth visualization - increased for more detail
  const [bufferSize] = useState(1024); // Doubled buffer size for more detail (was 512)
  const bufferRef = useRef<Array<number>>([]);
  const scrollPositionRef = useRef(0);
  const frameCountRef = useRef(0); // For animation effects
  
  // Used for visualization metrics
  const [rmsValue, setRmsValue] = useState(0);
  const [peakValue, setPeakValue] = useState(0);
  const peakRef = useRef<number[]>([]);
  
  // Initialize Web Audio API and attach to audio element
  // Initialize buffer and peak history - independent of audio context
  useEffect(() => {
    // Initialize buffer with zeros
    bufferRef.current = Array(bufferSize).fill(0);
    
    // Pre-fill peak history
    peakRef.current = Array(30).fill(0); // Last 30 frames for peak falloff
  }, [bufferSize]);

  // Set up audio context when audio element is available
  useEffect(() => {
    // Skip if we don't have an audio element
    if (!audioRef?.current) return;
    
    // If we already have an audio context, don't recreate it
    if (audioContextRef.current) return;
    
    try {
      // Create audio context
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      // Create analyzer node
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = bufferSize * 2;
      analyser.smoothingTimeConstant = 0.7;
      analyserRef.current = analyser;
      
      // Create data array for analyzer
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      dataArrayRef.current = dataArray;
      
      // Don't immediately connect to avoid errors - we'll connect during playback
    } catch (err) {
      console.error("Failed to initialize audio context:", err);
    }
  }, [audioRef?.current, bufferSize]);
  
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
          
          console.log("Successfully connected audio source to analyzer");
          return true;
        } catch (err) {
          // If error occurs, it's likely the source is already connected
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
    
    return () => {
      // We don't disconnect on cleanup to avoid issues with 
      // reconnecting the same audio element
    };
  }, [isPlaying, audioRef?.current]);
    
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      // Don't close audio context on unmount to avoid issues with 
      // player continuing to function
    };
  }, []);
  
  // Start or stop the visualization based on isPlaying
  useEffect(() => {
    if (!analyserRef.current || !dataArrayRef.current || !canvasRef.current) return;
    
    const drawWaveform = () => {
      if (!analyserRef.current || !dataArrayRef.current || !canvasRef.current) {
        return;
      }
      
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;
      
      // Get dimensions based on the canvas
      const width = canvas.width;
      const canvasHeight = canvas.height;
      
      // Read data from analyzer
      analyserRef.current.getByteTimeDomainData(dataArrayRef.current);
      
      // Process the data for visualization
      const dataArray = dataArrayRef.current;
      const waveformData = Array.from(dataArray).map(val => (val / 128.0) - 1.0);
      
      // Increment frame counter for animation effects
      frameCountRef.current = (frameCountRef.current + 1) % 120; // Reset every 120 frames (approx 2 seconds)
      
      // Calculate RMS (root mean square) for volume indication
      let sumSquares = 0;
      for (let i = 0; i < waveformData.length; i++) {
        sumSquares += waveformData[i] * waveformData[i];
      }
      const instantRms = Math.sqrt(sumSquares / waveformData.length);
      setRmsValue(instantRms);
      
      // Calculate peak (with slow falloff for natural look)
      const instantPeak = Math.max(...waveformData.map(Math.abs));
      peakRef.current.shift();
      peakRef.current.push(instantPeak);
      const smoothedPeak = Math.max(...peakRef.current);
      setPeakValue(smoothedPeak);
      
      // Update rolling buffer
      if (isPlaying) {
        // Get average of the latest data to reduce noise
        const avgSample = waveformData.reduce((a, b) => a + Math.abs(b), 0) / waveformData.length;
        
        // Add to buffer with scroll - compressed buffer for more track details
        bufferRef.current.push(avgSample);
        
        // Make buffer 2x the width to compress more data into the same space
        const bufferMax = width * 2; // Doubled buffer size for compression
        if (bufferRef.current.length > bufferMax) {
          bufferRef.current.shift();
        }
        
        // Keep waveform in place without scrolling (per user request)
        // scrollPositionRef.current = (scrollPositionRef.current + 4) % bufferMax; // Scrolling disabled
      }
      
      // Clear canvas with transparency
      context.clearRect(0, 0, width, canvasHeight);
      
      // Determine drawing color based on active state
      const mainColor = isActive ? accentColor : color;
      
      // Get animation phase (0.0 to 1.0) based on frame count for dynamic effects
      const animationPhase = Math.sin(frameCountRef.current * 0.05) * 0.5 + 0.5; // Oscillates between 0-1
      
      // Create a gradient based on signal intensity with dynamic color
      const baseGradient = context.createLinearGradient(0, canvasHeight, 0, 0);
      baseGradient.addColorStop(0, mainColor); // Base color at bottom
      baseGradient.addColorStop(0.5, `${mainColor}${Math.floor(animationPhase * 80 + 20).toString(16).padStart(2, '0')}`); // Dynamic middle opacity
      baseGradient.addColorStop(1, `${mainColor}60`); // Lighter transparency at top
      
      // Get the buffer length to visualize
      const bufferData = bufferRef.current;
      
      // Draw the waveform
      context.beginPath();
      context.strokeStyle = isPlaying ? baseGradient : mainColor; // Use gradient when playing
      context.lineWidth = 2;
      
      // Move to first point
      let x = 0;
      let y = canvasHeight / 2;
      context.moveTo(x, y);
      
      // Linear interpolation helper
      const lerp = (a: number, b: number, t: number) => a + t * (b - a);
      
      // Draw scrolling waveform with smooth interpolation and enhanced animation - compressed
      for (let i = 0; i < width; i++) {
        // For compressed data, we sample at double the rate (i*2)
        // This makes the waveform display more data points per pixel
        const samplePos = i * 2; // Doubled to compress data
        const index = (samplePos + scrollPositionRef.current) % bufferData.length;
        const nextIndex = (index + 1) % bufferData.length;
        
        // Enhanced interpolation for smoother curves
        const t = i / width;
        let value = lerp(bufferData[index] || 0, bufferData[nextIndex] || 0, t);
        
        // Add subtle animation effect based on frame count when playing
        if (isPlaying) {
          // Apply a subtle wave motion effect to the waveform
          const waveEffect = Math.sin((i * 0.1) + (frameCountRef.current * 0.05)) * 0.05;
          value = value * (1 + waveEffect);
        }
        
        // Scale to canvas height with TRIPLE the amplitude as requested
        const amplitude = value * (canvasHeight * 2.4); // Tripled from 0.8 to 2.4
        y = (canvasHeight / 2) + amplitude;
        
        // Draw current point
        context.lineTo(i, y);
      }
      
      // Complete the waveform
      context.stroke();
      
      // Draw a mirror reflection effect at bottom with fancy animation
      context.beginPath();
      // Animate reflection opacity for additional effect
      const reflectionOpacity = 0.3 + (animationPhase * 0.15); // Varies between 0.3 and 0.45
      context.globalAlpha = reflectionOpacity;
      context.strokeStyle = isPlaying ? baseGradient : `${mainColor}80`; // More transparent for reflection
      
      for (let i = 0; i < width; i++) {
        // Compressed data for reflection too, matching main waveform
        const samplePos = i * 2; // Doubled to compress data
        const index = (samplePos + scrollPositionRef.current) % bufferData.length;
        const nextIndex = (index + 1) % bufferData.length;
        
        const t = i / width;
        let value = lerp(bufferData[index] || 0, bufferData[nextIndex] || 0, t);
        
        // Add ripple effect to reflection when playing
        if (isPlaying) {
          // Different wave pattern for reflection
          const rippleEffect = Math.sin((i * 0.2) + (frameCountRef.current * 0.08)) * 0.08;
          value = value * (1 + rippleEffect);
        }
        
        // Scale to canvas height with TRIPLE the amplitude for reflection too
        const amplitude = value * (canvasHeight * 1.2); // Tripled from 0.4 to 1.2
        y = (canvasHeight / 2) - amplitude;
        
        if (i === 0) {
          context.moveTo(i, y);
        } else {
          context.lineTo(i, y);
        }
      }
      context.stroke();
      context.globalAlpha = 1.0;
      
      // Draw enhanced level indicators (left and right)
      if (showProgress) {
        // Create pulsing effect for meters when playing
        const pulseEffect = isPlaying ? 1 + (Math.sin(frameCountRef.current * 0.1) * 0.1) : 1;
        
        // RMS meter (left side) with gradient
        const rmsHeight = canvasHeight * Math.min(rmsValue * pulseEffect, 1);
        const rmsGradient = context.createLinearGradient(0, canvasHeight, 0, canvasHeight - rmsHeight);
        rmsGradient.addColorStop(0, mainColor);
        rmsGradient.addColorStop(1, `${mainColor}80`);
        context.fillStyle = rmsGradient;
        context.fillRect(0, canvasHeight - rmsHeight, 5, rmsHeight);
        
        // Peak meter (right side) with gradient
        const peakHeight = canvasHeight * Math.min(peakValue * pulseEffect, 1);
        const peakGradient = context.createLinearGradient(width, canvasHeight, width, canvasHeight - peakHeight);
        peakGradient.addColorStop(0, mainColor);
        peakGradient.addColorStop(1, `${mainColor}80`);
        context.fillStyle = peakGradient;
        context.fillRect(width - 5, canvasHeight - peakHeight, 5, peakHeight);
        
        // Progress indicator (center line) with glowing effect
        if (audioRef.current) {
          const progress = audioRef.current.currentTime / (audioRef.current.duration || 1);
          const progressX = width * progress;
          
          // Add glow effect to the progress line when playing
          if (isPlaying) {
            // Draw glow behind the line
            const glowWidth = 3 + (Math.sin(frameCountRef.current * 0.2) * 2); // Pulsing glow
            context.fillStyle = `${mainColor}40`; // Semi-transparent glow
            context.fillRect(progressX - glowWidth/2, 0, glowWidth, canvasHeight);
          }
          
          // Main progress line
          context.fillStyle = '#ffffff';
          context.fillRect(progressX, 0, 1, canvasHeight);
        }
      }
      
      // Continue animation loop if playing
      if (isPlaying) {
        animationRef.current = requestAnimationFrame(drawWaveform);
      }
    };
    
    // Start or stop animation based on playback
    if (isPlaying) {
      // Ensure audio context is running (may be suspended on some browsers)
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      
      // Start animation
      animationRef.current = requestAnimationFrame(drawWaveform);
    } else {
      // Stop animation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      
      // Draw a static frame
      drawWaveform();
    }
    
    return () => {
      // Clean up animation on unmount or state change
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, color, backgroundColor, accentColor, isActive, showProgress]);
  
  return (
    <canvas
      ref={canvasRef}
      className={`professional-waveform ${className}`}
      width={300}
      height={height}
      style={{ width: '100%', height: `${height}px` }}
    />
  );
}

export default ProfessionalWaveform;
import React, { useState, useEffect, useRef } from 'react';

// Frequency bands for the spectrum analyzer (Hz) - Increased number of bands for more detailed visualization
const frequencyBands = [
  20, 22, 25, 28, 31.5, 35, 40, 45, 50, 56, 63, 70, 80, 90, 100, 112, 125, 140, 160, 180, 200, 224, 250, 280, 315, 355, 400, 450, 500, 560, 630, 710, 800, 900, 1000,
  1120, 1250, 1400, 1600, 1800, 2000, 2240, 2500, 2800, 3150, 3550, 4000, 4500, 5000, 5600, 6300, 7100, 8000, 9000, 10000, 11200, 12500, 14000, 16000, 18000, 20000
];

// Helper function to generate realistic spectrum data
const generateSpectrumData = (seed: number = Date.now(), isPlaying: boolean = false) => {
  // Create a deterministic pseudo-random number generator based on seed
  const seededRandom = (seed: number, index: number) => {
    const value = Math.sin(seed * index) * 10000;
    return Math.abs(value - Math.floor(value));
  };
  
  // Generate data with audio-like characteristics
  const data: number[] = [];
  const totalBands = frequencyBands.length;
  
  // Base level for non-playing state
  const baseLevel = isPlaying ? 0.7 : 0.1;
  
  // Create a realistic audio frequency response curve
  for (let i = 0; i < totalBands; i++) {
    // Position in the frequency spectrum (0 to 1)
    const position = i / totalBands;
    
    // Base curve shape - frequencies in the middle range are usually louder
    const baseCurve = Math.sin(position * Math.PI) * 0.5 + 0.3;
    
    // Add some variations for different frequency bands (common in music)
    const frequencyVariation = 
      Math.sin(position * Math.PI * 8) * 0.15 + // Fast variations
      Math.sin(position * Math.PI * 2) * 0.25;  // Slow variations
    
    // Combine factors with seeded random value for consistency
    const amplitude = isPlaying ? 
      (baseCurve + frequencyVariation) * (baseLevel + seededRandom(seed, i) * 0.5) // More dynamic when playing
      : 
      (baseCurve * 0.3) * (baseLevel + seededRandom(seed, i) * 0.1); // Subtle movement when not playing
    
    // Convert to decibel scale (-60 to 0 dB)
    const db = -60 + amplitude * 60;
    
    data.push(db);
  }
  
  return data;
};

interface FullWidthSpectrumAnalyzerProps {
  audioElement: HTMLAudioElement | null;
  trackId?: number;
  isPlaying?: boolean;
  height?: number;
  studioColor?: string;
  className?: string;
  isNearEnd?: boolean;
}

const FullWidthSpectrumAnalyzer: React.FC<FullWidthSpectrumAnalyzerProps> = ({
  audioElement,
  trackId,
  isPlaying = false,
  height = 132, // Reduced from 150px to 132px (by 18px)
  studioColor = '#13ef15', // Default to green
  className = '',
  isNearEnd = false
}) => {
  // Canvas reference
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // State for spectrum data
  const [spectrumData, setSpectrumData] = useState<number[]>([]);
  const [peakData, setPeakData] = useState<number[]>([]);
  
  // Animation frame reference
  const animationRef = useRef<number>();
  
  // Settings for analyzer
  const minDecibels = -60;
  const maxDecibels = 0;
  
  // Seed based on track ID for consistency
  const seedRef = useRef<number>(trackId || Date.now());
  
  // Generate and update spectrum data
  useEffect(() => {
    // Set seed based on track ID for consistent generation
    if (trackId) {
      seedRef.current = trackId;
    }
    
    // Generate initial data
    const initialData = generateSpectrumData(seedRef.current, isPlaying);
    setSpectrumData(initialData);
    setPeakData(initialData.slice());
    
    // Function to update spectrum data (simulates audio analysis)
    const updateSpectrumData = () => {
      if (!isPlaying) {
        // If not playing, gradually decrease all values
        setSpectrumData(prev => 
          prev.map(val => Math.max(minDecibels, val - 1))
        );
        
        // Gradually decrease peak values
        setPeakData(prev =>
          prev.map(val => Math.max(minDecibels, val - 0.2))
        );
        
        return;
      }
      
      // Generate new data based on seed
      const newData = generateSpectrumData(seedRef.current + Date.now() % 1000, isPlaying);
      
      // Update spectrum data
      setSpectrumData(newData);
      
      // Update peak data
      setPeakData(prev => 
        prev.map((val, i) => Math.max(val, newData[i]))
      );
    };
    
    // Start animation loop
    const startAnimation = () => {
      // Update data every 33ms (30fps) for smoother animation
      const updateInterval = setInterval(() => {
        updateSpectrumData();
      }, 33);
      
      return () => clearInterval(updateInterval);
    };
    
    // Start and return cleanup
    const cleanup = startAnimation();
    return () => cleanup();
  }, [trackId, isPlaying]);
  
  // Draw spectrum analyzer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    
    const drawFrame = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Background with gradient
      const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
      bgGradient.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
      bgGradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);
      
      // Draw subtle grid
      ctx.strokeStyle = 'rgba(50, 50, 50, 0.3)';
      ctx.lineWidth = 1;
      
      // Horizontal grid lines (amplitude) - fewer lines for cleaner look
      for (let db = 0; db >= -60; db -= 12) {
        const y = (1 - (db - minDecibels) / (maxDecibels - minDecibels)) * height;
        
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      
      // Calculate bar width with minimal gap for more bars
      const numBands = spectrumData.length;
      const barSpacing = 0.5; // Reduced from 1px to 0.5px for more dense bars
      const availableWidth = width - ((numBands - 1) * barSpacing);
      const barWidth = availableWidth / numBands;
      
      // Determine base color based on studio color and playing state
      let baseColor = studioColor;
      if (isNearEnd && isPlaying) {
        baseColor = '#ff2020'; // Red when near end
      } else if (!isPlaying) {
        baseColor = '#444444'; // Gray when not playing
      }
      
      // Draw spectrum bars
      spectrumData.forEach((value, i) => {
        // Calculate position
        const x = i * (barWidth + barSpacing);
        
        // Convert dB value to height
        const normalizedValue = (value - minDecibels) / (maxDecibels - minDecibels);
        const barHeight = normalizedValue * height;
        
        // Create color gradient based on level
        let barFillColor;
        if (value > -5) {
          barFillColor = isPlaying ? 'rgba(255, 50, 50, 0.95)' : 'rgba(100, 100, 100, 0.8)'; // Red/hot
        } else if (value > -20) {
          barFillColor = isPlaying ? 'rgba(255, 255, 50, 0.9)' : 'rgba(80, 80, 80, 0.8)'; // Yellow/warm
        } else {
          // Base color with transparency based on level
          const alpha = 0.6 + (normalizedValue * 0.4); // 0.6 to 1.0 based on level
          barFillColor = isPlaying 
            ? `rgba(${parseInt(baseColor.slice(1, 3), 16)}, ${parseInt(baseColor.slice(3, 5), 16)}, ${parseInt(baseColor.slice(5, 7), 16)}, ${alpha})`
            : `rgba(68, 68, 68, ${alpha})`;
        }
        
        // Draw bar with gradient
        const barGradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
        barGradient.addColorStop(0, barFillColor);
        barGradient.addColorStop(1, barFillColor.replace(/, [0-9.]+\)/, ', 0.5)')); // Fade to more transparent
        
        ctx.fillStyle = barGradient;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        
        // Add glow effect for high levels
        if (value > -20 && isPlaying) {
          ctx.shadowColor = value > -5 ? 'rgba(255, 50, 50, 0.7)' : 'rgba(255, 255, 0, 0.5)';
          ctx.shadowBlur = 5;
          ctx.fillRect(x, height - barHeight, barWidth, barHeight);
          ctx.shadowBlur = 0;
        }
      });
      
      // Draw peak hold markers
      const peakColor = isNearEnd && isPlaying ? 'rgba(255, 50, 50, 0.9)' : 'rgba(255, 255, 255, 0.7)';
      ctx.fillStyle = peakColor;
      
      peakData.forEach((value, i) => {
        // Calculate position
        const x = i * (barWidth + barSpacing);
        
        // Convert dB value to height
        const normalizedValue = (value - minDecibels) / (maxDecibels - minDecibels);
        const markerY = height - (normalizedValue * height);
        
        // Draw peak marker (small rectangle)
        if (value > minDecibels) {
          ctx.fillRect(x, markerY - 1, barWidth, 2);
        }
      });
      
      // Request next animation frame
      animationRef.current = requestAnimationFrame(drawFrame);
    };
    
    // Start drawing
    drawFrame();
    
    // Clean up
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [spectrumData, peakData, studioColor, isPlaying, isNearEnd]);
  
  return (
    <div 
      className={`full-width-spectrum-analyzer ${className}`} 
      style={{ height, width: '100%' }}
    >
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
      />
    </div>
  );
};

export default FullWidthSpectrumAnalyzer;
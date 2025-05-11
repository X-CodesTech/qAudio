import React, { useState, useEffect, useRef } from 'react';

// Custom styles
const graphBg = '#111111';

// Frequency bands for the spectrum analyzer (Hz)
const frequencyBands = [
  20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000,
  1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500, 16000, 20000
];

// Helper function to generate random spectrum data with a more realistic audio profile
const generateSpectrumData = (seed: number = Date.now()) => {
  // Create a deterministic pseudo-random number generator based on seed
  const seededRandom = (seed: number, index: number) => {
    const value = Math.sin(seed * index) * 10000;
    return Math.abs(value - Math.floor(value));
  };
  
  // Generate data with audio-like characteristics
  const data: number[] = [];
  const totalBands = frequencyBands.length;
  
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
    const amplitude = 
      (baseCurve + frequencyVariation) * 
      (0.7 + seededRandom(seed, i) * 0.3); // Randomize slightly
    
    // Convert to decibel scale (-60 to 0 dB)
    const db = -60 + amplitude * 60;
    
    data.push(db);
  }
  
  return data;
};

interface SpectrumAnalyzerProps {
  trackId?: number;
  height?: number;
  width?: string;
  showLabels?: boolean;
  peakHold?: boolean;
  barColor?: string;
  peakColor?: string;
  onRender?: () => void;
  className?: string;
  isPlaying?: boolean;
}

const SpectrumAnalyzer: React.FC<SpectrumAnalyzerProps> = ({
  trackId,
  height = 150,
  width = '100%',
  showLabels = true,
  peakHold = true,
  barColor = 'rgba(0, 150, 255, 0.8)',
  peakColor = 'rgba(255, 255, 0, 0.8)',
  onRender,
  className = '',
  isPlaying = false
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
    const initialData = generateSpectrumData(seedRef.current);
    setSpectrumData(initialData);
    setPeakData(initialData.slice());
    
    // Function to update spectrum data (simulates audio analysis)
    const updateSpectrumData = () => {
      if (!isPlaying) {
        // If not playing, gradually decrease all values
        setSpectrumData(prev => 
          prev.map(val => Math.max(minDecibels, val - 1))
        );
        return;
      }
      
      // Generate new data based on seed
      const newData = generateSpectrumData(seedRef.current + Date.now() % 1000);
      
      // Update spectrum data
      setSpectrumData(newData);
      
      // Update peak data
      setPeakData(prev => 
        prev.map((val, i) => Math.max(val, newData[i]))
      );
      
      // Call the onRender callback
      if (onRender) {
        onRender();
      }
    };
    
    // Start animation loop
    const startAnimation = () => {
      // Update data every 50ms (20fps) for performance
      const updateInterval = setInterval(() => {
        updateSpectrumData();
      }, 50);
      
      return () => clearInterval(updateInterval);
    };
    
    // Start and return cleanup
    const cleanup = startAnimation();
    return () => cleanup();
  }, [trackId, isPlaying, onRender]);
  
  // Draw spectrum analyzer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions based on container (1px difference to avoid blurring)
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    
    const drawFrame = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Background
      ctx.fillStyle = graphBg;
      ctx.fillRect(0, 0, width, height);
      
      // Draw grid
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 1;
      
      // Vertical grid lines (frequency)
      const octaves = [31.5, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
      if (showLabels) {
        octaves.forEach(freq => {
          // Calculate x position based on logarithmic scale
          const x = Math.log10(freq / 20) / Math.log10(20000 / 20) * width;
          
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
          
          // Label
          ctx.fillStyle = '#666666';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(freq >= 1000 ? `${freq/1000}k` : `${freq}`, x, height - 5);
        });
      }
      
      // Horizontal grid lines (amplitude)
      for (let db = 0; db >= -60; db -= 10) {
        const y = (1 - (db - minDecibels) / (maxDecibels - minDecibels)) * height;
        
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
        
        // Label for dB scale
        if (showLabels) {
          ctx.fillStyle = '#666666';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(`${db} dB`, width - 5, y + 3);
        }
      }
      
      // Calculate bar width with small gap between bars
      const numBands = spectrumData.length;
      const barSpacing = 2;
      const barWidth = (width / numBands) - barSpacing;
      
      // Draw spectrum bars
      spectrumData.forEach((value, i) => {
        // Calculate position based on logarithmic frequency scale
        const x = Math.log10(frequencyBands[i] / 20) / Math.log10(20000 / 20) * width;
        
        // Convert dB value to height
        const normalizedValue = (value - minDecibels) / (maxDecibels - minDecibels);
        const barHeight = normalizedValue * height;
        
        // Select color based on value (green to yellow to red gradient)
        let barFillColor;
        if (value > -10) {
          barFillColor = 'rgba(255, 50, 50, 0.8)'; // Red for high values
        } else if (value > -30) {
          barFillColor = 'rgba(255, 255, 50, 0.8)'; // Yellow for mid values
        } else {
          barFillColor = barColor; // Default color for low values
        }
        
        // Draw bar
        ctx.fillStyle = barFillColor;
        ctx.fillRect(x - barWidth / 2, height - barHeight, barWidth, barHeight);
      });
      
      // Draw peak hold markers
      if (peakHold && peakData.length > 0) {
        ctx.fillStyle = peakColor;
        
        peakData.forEach((value, i) => {
          // Calculate position based on logarithmic frequency scale
          const x = Math.log10(frequencyBands[i] / 20) / Math.log10(20000 / 20) * width;
          
          // Convert dB value to height
          const normalizedValue = (value - minDecibels) / (maxDecibels - minDecibels);
          const markerY = height - (normalizedValue * height);
          
          // Draw peak marker (small rectangle)
          if (value > minDecibels) {
            ctx.fillRect(x - barWidth / 2, markerY - 2, barWidth, 2);
          }
        });
      }
      
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
  }, [spectrumData, peakData, peakHold, barColor, peakColor, showLabels]);
  
  return (
    <div className={`spectrum-analyzer ${className}`} style={{ height, width }}>
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
      />
    </div>
  );
};

export default SpectrumAnalyzer;
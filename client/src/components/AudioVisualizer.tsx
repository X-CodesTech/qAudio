import React, { useEffect, useState, useRef } from 'react';

interface AudioVisualizerProps {
  audioElement: HTMLAudioElement | null;
  color?: string;
  height?: number;
  className?: string;
  forceAnimation?: boolean; // Force animation even when not playing
}

// Simpler but reliable bar-style audio visualizer
const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioElement,
  color = '#ff0000', // Red color as required
  height = 80, // Reduced by 10px from original 90px
  className = '',
  forceAnimation = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const animationTimerRef = useRef<number | null>(null);
  
  // Ensure we always have animation, even without audio events
  useEffect(() => {
    // Always keep animation running for visual feedback
    const startAnimationTimer = () => {
      // Clear any existing timer first
      if (animationTimerRef.current) {
        clearInterval(animationTimerRef.current);
      }
      
      // Set up a new timer
      animationTimerRef.current = window.setInterval(() => {
        setCurrentTime(Date.now());
      }, 50);
    };
    
    // Start the animation timer immediately
    startAnimationTimer();
    
    // Cleanup timer on unmount
    return () => {
      if (animationTimerRef.current) {
        clearInterval(animationTimerRef.current);
        animationTimerRef.current = null;
      }
    };
  }, []);
  
  // Set up event listeners for audio playback
  useEffect(() => {
    if (!audioElement) return;
    
    const handlePlay = () => {
      setIsPlaying(true);
    };
    
    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(Date.now()); // Just to force re-render
    };
    
    // Add all event listeners
    audioElement.addEventListener('play', handlePlay);
    audioElement.addEventListener('pause', handlePause);
    audioElement.addEventListener('ended', handlePause);
    audioElement.addEventListener('timeupdate', handleTimeUpdate);
    audioElement.addEventListener('canplay', handleTimeUpdate);
    audioElement.addEventListener('loadedmetadata', handleTimeUpdate);
    
    // Check if already playing
    if (!audioElement.paused) {
      setIsPlaying(true);
    }
    
    return () => {
      // Clean up all event listeners
      audioElement.removeEventListener('play', handlePlay);
      audioElement.removeEventListener('pause', handlePause);
      audioElement.removeEventListener('ended', handlePause);
      audioElement.removeEventListener('timeupdate', handleTimeUpdate);
      audioElement.removeEventListener('canplay', handleTimeUpdate);
      audioElement.removeEventListener('loadedmetadata', handleTimeUpdate);
    };
  }, [audioElement]);
  
  // Generate a more professional bar visualization
  const renderBars = () => {
    const barCount = 64; // Increased bar count for more detailed visualization
    const timeValue = currentTime / 1000;
    
    // Create array of bars
    const bars = [];
    
    for (let i = 0; i < barCount; i++) {
      // Position factor (0 to 1)
      const position = i / barCount;
      
      // Calculate bar height based on a more professional pattern
      // More pronounced in the center with professional distribution
      const centerEmphasis = 20 * Math.exp(-Math.pow((position - 0.5) * 4, 2));
      
      let height;
      let brightness;
      let barColor = color;
      
      if (isPlaying || forceAnimation) {
        // Professional broadcasting style animation with symmetrical patterns
        // These formulas are designed to mimic professional audio broadcast visualizers
        
        // Primary wave - smoother frequency response curve
        const primaryWave = 20 * Math.abs(Math.sin(timeValue * 5 + position * Math.PI * 2));
        
        // Secondary high-frequency detail
        const secondaryWave = 12 * Math.abs(Math.sin(timeValue * 7 + position * Math.PI * 4));
        
        // Tertiary modulation
        const tertiaryWave = 8 * Math.abs(Math.cos(timeValue * 2.5 + position * Math.PI * 3));
        
        // Add controlled randomness for natural appearance (broadcast EQ style)
        const randomFactor = Math.sin(position * 100 + timeValue) * 10;
        
        // VU meter fall-off effect (faster rise, slower fall)
        const falloffFactor = i % 2 === 0 ? 5 : 0; // Alternate bars have falloff effect
        
        // Calculate height (in percentage) - increased baseline for solid appearance
        height = 20 + centerEmphasis + primaryWave + secondaryWave + tertiaryWave + randomFactor - falloffFactor;
        
        // Cap height with proper minimum for professional look
        height = Math.min(100, Math.max(15, height));
        
        // Professional broadcast levels - brightness adds a "hot" look to peaks
        brightness = 100 + (height > 70 ? 30 : 0);
        
        // Active color with intensity based on level
        barColor = isPlaying ? color : `${color}CC`;
      } else {
        // Static pattern for standby state - professional broadcast style with "ready" levels
        // Using Gaussian distribution for a more realistic frequency response
        
        // Base pattern with frequency weighting (more bass, less treble)
        const basePattern = 12 + 
          15 * Math.pow(Math.sin(position * Math.PI), 2) + 
          8 * Math.pow(Math.cos(position * Math.PI * 2), 2);
        
        // Add harmonics for texture (mimics standby broadcast analyzer)
        const harmonics = 6 * Math.sin(position * Math.PI * 8) * Math.sin(position * Math.PI * 2);
        
        // Combine factors for final height - more subtle in standby mode
        height = Math.max(8, centerEmphasis + basePattern + harmonics);
        
        // Static brightness based on professional broadcast standards
        brightness = 85;
        
        // Standard standby color for professional broadcast (semi-transparent)
        barColor = `${color}90`;
      }
      
      // Bar width (percentage, with small spacing for professional look)
      const barWidth = 100 / barCount * 0.92; // Tighter spacing
      
      // Professional style with subtle rounding
      const barClass = 'audio-bar';
      
      bars.push(
        <div 
          key={i}
          className={barClass}
          style={{
            width: `${barWidth}%`,
            height: `${height}%`,
            background: isPlaying || forceAnimation
              ? `linear-gradient(to top, ${barColor}, ${barColor}ee, ${barColor}99)`  // Gradient effect for more professional look
              : barColor,
            borderRadius: '1px', // Sharper edges for broadcast look
            filter: `brightness(${brightness}%)`,
            boxShadow: isPlaying ? `0 0 3px ${color}60, 0 0 1px ${color}` : 'none',
            transition: 'height 40ms linear, filter 200ms ease', // Smoother transitions
          }}
        />
      );
    }
    
    return bars;
  };
  
  // Get container style
  const getContainerStyle = (): React.CSSProperties => {
    return {
      position: 'relative',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgb(0, 0, 0)', // Pure black background
      overflow: 'hidden',
      borderRadius: '3px',
      display: 'block', // Ensure it's always displayed
    };
  };
  
  // Get bar container style
  const getBarContainerStyle = (): React.CSSProperties => {
    return {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: '100%',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between', // Tighter bars
      padding: '0 2px',
    };
  };
  
  // Enhanced CSS animations
  const styleSheet = `
    @keyframes pulse {
      0%, 100% { opacity: 0.9; }
      50% { opacity: 1; }
    }
    
    .audio-visualizer-container:hover .audio-bar {
      filter: brightness(110%) !important;
      box-shadow: 0 0 8px rgba(255, 0, 0, 0.6) !important;
    }
    
    .audio-reflection {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 30%;
      background: linear-gradient(to bottom, 
        ${isPlaying 
          ? 'rgba(255,0,0,0.09), rgba(255,0,0,0.05), transparent' 
          : 'rgba(100,100,100,0.06), rgba(100,100,100,0.03), transparent'
        });
      transform: scaleY(-1);
      opacity: ${isPlaying ? 0.5 : 0.3};
      filter: blur(1px);
      pointer-events: none;
      border-top: 1px solid ${isPlaying ? 'rgba(255,50,50,0.15)' : 'rgba(150,150,150,0.1)'};
    }
    
    .audio-centerline {
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background-color: rgba(255, 255, 255, 0.1);
      transform: translateY(-50%);
    }
    
    .audio-live-indicator {
      position: absolute;
      top: 8px;
      right: 8px;
      background-color: rgba(0, 0, 0, 0.7);
      color: #ff0000;
      padding: 2px 5px;
      font-size: 9px;
      font-family: monospace;
      border-radius: 2px;
      border: 1px solid rgba(255, 0, 0, 0.4);
      box-shadow: 0 0 6px rgba(255, 0, 0, 0.5);
      animation: pulse 2s ease-in-out infinite;
    }
  `;
  
  return (
    <div className={`audio-visualizer ${className}`} style={getContainerStyle()}>
      <style>{styleSheet}</style>
      
      <div className="audio-centerline" />
      
      <div className="audio-visualizer-container" style={getBarContainerStyle()}>
        {renderBars()}
      </div>
      
      <div className="audio-reflection" />
      
      {isPlaying && <div className="audio-live-indicator">LIVE</div>}
    </div>
  );
};

export default AudioVisualizer;
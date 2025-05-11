import React, { useState, useEffect, useRef } from 'react';

export interface ModernLevelMeterProps {
  level: number; // 0-100
  isActive: boolean; // true when on air
  isPlaying: boolean; // true when playing
  className?: string;
  activeColor?: 'red' | 'green' | 'blue' | 'purple' | string; // Allow red, green, blue, purple or custom color
  peakFalloffRate?: number; // How quickly peaks fall (higher means faster falloff)
  refreshRate?: number; // How often to refresh the display in ms
}

const ModernLevelMeter: React.FC<ModernLevelMeterProps> = ({
  level,
  isActive,
  isPlaying,
  className = '',
  activeColor,
  peakFalloffRate = 1,
  refreshRate = 100
}) => {
  // Create 2 segments (stereo signal) instead of 3
  const segments = 20;
  const segmentsArray = Array.from({ length: segments });
  
  // State for peak level falloff animation
  const [peakLevel, setPeakLevel] = useState(level);
  const [displayLevel, setDisplayLevel] = useState(level);
  const lastUpdateTime = useRef(Date.now());
  
  // Effect to animate peak level falloff
  useEffect(() => {
    if (level > peakLevel) {
      setPeakLevel(level);
    }
    
    const now = Date.now();
    // Only update on every refreshRate interval to avoid too many re-renders
    if (now - lastUpdateTime.current >= refreshRate) {
      setDisplayLevel(level);
      lastUpdateTime.current = now;
    }
    
    const falloffInterval = setInterval(() => {
      setPeakLevel(prev => {
        // Gradual falloff effect
        return Math.max(level, prev - peakFalloffRate);
      });
    }, 50); // Update every 50ms for smooth animation
    
    return () => clearInterval(falloffInterval);
  }, [level, peakLevel, peakFalloffRate, refreshRate]);
  
  // Get active color based on state and activeColor prop
  const getSegmentColor = (index: number) => {
    // Calculate threshold for active segments
    const threshold = Math.floor(displayLevel / 100 * segments);
    const peakThreshold = Math.floor(peakLevel / 100 * segments);
    
    // Peak indicator (highlight the peak segment)
    if (index === peakThreshold && index > threshold) {
      return '#ffffff'; // White peak indicator
    }
    
    if (index < threshold) {
      // When explicit color is provided via activeColor prop
      if (activeColor) {
        // Apply custom color with gradient based on level
        if (activeColor === 'red') {
          // Red color scale
          if (index > Math.floor(segments * 0.8)) {
            return '#dc2626'; // bright red for high levels
          } else if (index > Math.floor(segments * 0.6)) {
            return '#ef4444'; // red for mid-high levels
          } else {
            return '#f87171'; // light red for normal levels
          }
        } else if (activeColor === 'green') {
          // Green color scale
          if (index > Math.floor(segments * 0.8)) {
            return '#15803d'; // dark green for high levels
          } else if (index > Math.floor(segments * 0.6)) {
            return '#22c55e'; // green for mid-high levels
          } else {
            return '#4ade80'; // bright green for normal levels
          }
        } else if (activeColor === 'blue') {
          // Blue color scale
          if (index > Math.floor(segments * 0.8)) {
            return '#1e40af'; // dark blue for high levels
          } else if (index > Math.floor(segments * 0.6)) {
            return '#3b82f6'; // blue for mid-high levels
          } else {
            return '#60a5fa'; // light blue for normal levels
          }
        } else if (activeColor === 'purple') {
          // Purple color scale
          if (index > Math.floor(segments * 0.8)) {
            return '#7e22ce'; // dark purple for high levels
          } else if (index > Math.floor(segments * 0.6)) {
            return '#a855f7'; // purple for mid-high levels
          } else {
            return '#c084fc'; // light purple for normal levels
          }
        } else {
          // Custom color passed directly
          return activeColor;
        }
      }
      
      // Default behavior when no activeColor specified
      // When player is on-air and playing, use sharp red
      if (isActive && isPlaying) {
        return '#b91c1c'; // sharp red
      }
      
      // Default gradient
      if (index > Math.floor(segments * 0.8)) {
        return '#ef4444'; // red for high levels
      } else if (index > Math.floor(segments * 0.6)) {
        return '#f59e0b'; // amber for mid-high levels
      } else {
        return '#06ef45'; // bright green (requested color) for normal levels
      }
    }
    
    // Inactive segments
    return 'rgba(255, 255, 255, 0.1)';
  };
  
  return (
    <div className={`flex gap-[1px] h-10 ${className}`}>
      {/* Create 2 separate meter strips for stereo signal with small gap between them */}
      {[0, 1].map((meterIndex) => (
        <div key={meterIndex} className="flex-1 flex flex-col-reverse gap-[1px]">
          {segmentsArray.map((_, i) => (
            <div
              key={i}
              style={{ 
                backgroundColor: getSegmentColor(i),
                // Add a slight transition for smoothness
                transition: 'background-color 100ms ease-out'
              }}
              className="w-full h-[4px]"
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default ModernLevelMeter;
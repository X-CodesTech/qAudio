import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

type ConnectionPulseProps = {
  connected: boolean;
  size?: 'sm' | 'md' | 'lg';
  pulseColor?: string;
  label?: string;
  showLabel?: boolean;
  className?: string;
  pulseSpeed?: 'slow' | 'normal' | 'fast';
  animationType?: 'pulse' | 'blink' | 'wave';
};

export default function ConnectionPulse({
  connected,
  size = 'md',
  pulseColor = 'bg-blue-500',
  label,
  showLabel = true,
  className,
  pulseSpeed = 'normal',
  animationType = 'pulse',
}: ConnectionPulseProps) {
  const [isActive, setIsActive] = useState(false);
  
  // Define size classes
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };
  
  // Define pulse speed classes
  const speedClasses = {
    slow: 'animate-pulse-slow',
    normal: 'animate-pulse',
    fast: 'animate-pulse-fast',
  };

  // Define animation type classes
  const animationClasses = {
    pulse: speedClasses[pulseSpeed],
    blink: 'animate-blink',
    wave: 'animate-wave',
  };
  
  // Status color when not connected
  const disconnectedColor = 'bg-gray-400';
  
  // Set random active state changes for visual interest if connected
  useEffect(() => {
    if (!connected) {
      setIsActive(false);
      return;
    }
    
    // Initialize as active when connected
    setIsActive(true);
    
    // Simulate activity by toggling the pulse occasionally
    const activityInterval = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance to toggle activity state
        setIsActive(prev => !prev);
        
        // Always return to active state after a brief period
        if (!isActive) {
          setTimeout(() => setIsActive(true), 300);
        }
      }
    }, 2000);
    
    return () => clearInterval(activityInterval);
  }, [connected]);
  
  return (
    <div className={cn("flex items-center", className)}>
      <div className="relative flex items-center justify-center">
        {/* Background circle */}
        <div 
          className={cn(
            "rounded-full",
            sizeClasses[size],
            connected ? pulseColor : disconnectedColor
          )}
        />
        
        {/* Animated pulse overlay (only shown when connected and active) */}
        {connected && isActive && (
          <div 
            className={cn(
              "absolute rounded-full",
              sizeClasses[size],
              pulseColor,
              animationClasses[animationType],
              "opacity-75"
            )}
          />
        )}
      </div>
      
      {showLabel && label && (
        <span className="ml-2 text-sm">
          {label}
        </span>
      )}
    </div>
  );
}
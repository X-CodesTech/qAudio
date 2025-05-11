import { useState, useEffect } from 'react';
import { formatDuration } from '@/lib/utils';

type OnAirTimerProps = {
  startTime?: Date | string | null;
  isOnAir: boolean;
}

export function OnAirTimer({ startTime, isOnAir }: OnAirTimerProps) {
  const [duration, setDuration] = useState<string>('00:00');
  const [isBlinking, setIsBlinking] = useState(true);
  
  // Timer effect
  useEffect(() => {
    if (!isOnAir || !startTime) {
      setDuration('00:00');
      return;
    }
    
    const start = typeof startTime === 'string' ? new Date(startTime) : startTime;
    
    const intervalId = setInterval(() => {
      const now = new Date();
      const diffMs = now.getTime() - start.getTime();
      setDuration(formatDuration(Math.floor(diffMs / 1000)));
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [startTime, isOnAir]);
  
  // Blinking effect
  useEffect(() => {
    if (!isOnAir) return;
    
    const blinkIntervalId = setInterval(() => {
      setIsBlinking(prev => !prev);
    }, 500);
    
    return () => clearInterval(blinkIntervalId);
  }, [isOnAir]);
  
  if (!isOnAir) return null;
  
  return (
    <div 
      style={{
        position: 'relative',
        margin: '10px 0',
        padding: '16px',
        backgroundColor: isBlinking ? '#ef4444' : '#dc2626',
        transition: 'background-color 0.3s',
        border: '6px solid #b91c1c',
        borderRadius: '10px',
        boxShadow: '0 0 30px #ef4444, inset 0 0 15px rgba(255, 0, 0, 0.5)',
        textAlign: 'center',
        color: 'white'
      }}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        gap: '15px' 
      }}>
        {/* Blinking indicator */}
        <div 
          style={{ 
            width: '24px', 
            height: '24px', 
            borderRadius: '50%', 
            backgroundColor: 'white',
            boxShadow: '0 0 10px white',
            opacity: isBlinking ? 1 : 0.3, 
            transition: 'opacity 0.3s'
          }}
        ></div>
        
        {/* Timer display */}
        <div style={{ 
          fontSize: '40px', 
          fontFamily: 'monospace', 
          fontWeight: 'bold',
          textShadow: '3px 3px 6px rgba(0, 0, 0, 0.5)'
        }}>
          ON AIR: {duration}
        </div>
      </div>
    </div>
  );
}
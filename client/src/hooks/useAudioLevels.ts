import { useState, useCallback, useRef } from 'react';
import { apiRequest } from '@/lib/queryClient';

type AudioLevels = {
  [key: number]: {
    input: number;
    output: number;
  };
};

export const useAudioLevels = () => {
  const [levels, setLevels] = useState<AudioLevels>({});
  const lastUpdateRef = useRef<{[key: number]: number}>({});
  
  // Simulate getting audio levels for a specific line
  const getLevelsForLine = useCallback((lineId: number, mode: 'active' | 'holding' = 'active') => {
    // Calculate a realistic audio level based on time and some randomness
    const now = Date.now();
    const lastUpdate = lastUpdateRef.current[lineId] || 0;
    const timeDiff = now - lastUpdate;
    
    // Update at most every 100ms to prevent excessive calculations
    if (timeDiff < 100) {
      return levels[lineId] || { input: mode === 'active' ? 60 : 5, output: mode === 'active' ? 50 : 30 };
    }
    
    lastUpdateRef.current[lineId] = now;
    
    let inputLevel: number;
    let outputLevel: number;
    
    if (mode === 'active') {
      // For active calls, simulate realistic voice patterns with more fluctuation
      const baseInputLevel = levels[lineId]?.input || 60;
      const baseOutputLevel = levels[lineId]?.output || 50;
      
      // Create a natural fluctuation that sometimes goes higher and sometimes lower
      const inputChange = Math.sin(now / 500) * 15 + (Math.random() * 10 - 5);
      const outputChange = Math.sin((now / 500) + 1) * 10 + (Math.random() * 8 - 4);
      
      inputLevel = Math.max(5, Math.min(95, baseInputLevel + inputChange));
      outputLevel = Math.max(5, Math.min(90, baseOutputLevel + outputChange));
    } else {
      // For calls on hold, much less fluctuation and lower overall levels
      const baseOutputLevel = levels[lineId]?.output || 30;
      
      // Hold music is consistent with small fluctuations
      const outputChange = Math.sin(now / 1000) * 5 + (Math.random() * 4 - 2);
      
      inputLevel = 5; // Almost no input from a call on hold
      outputLevel = Math.max(20, Math.min(40, baseOutputLevel + outputChange));
    }
    
    // Update local state
    setLevels(prev => ({
      ...prev,
      [lineId]: {
        input: inputLevel,
        output: outputLevel
      }
    }));
    
    // Send to server (in a production app, this would be reversed - levels would come from server via WebSocket)
    apiRequest('PUT', `/api/call-lines/${lineId}/levels`, {
      input: inputLevel,
      output: outputLevel
    }).catch(error => {
      console.error('Error updating audio levels:', error);
    });
    
    return {
      input: inputLevel,
      output: outputLevel
    };
  }, [levels]);
  
  return {
    levels,
    getLevelsForLine
  };
};

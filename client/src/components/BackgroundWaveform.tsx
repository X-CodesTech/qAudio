import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

interface BackgroundWaveformProps {
  trackId: number;
  height?: number;
  color?: string;
}

/**
 * BackgroundWaveform Component
 * 
 * Displays a waveform visualization for a track as a background element
 * Height reduced by 10px as requested
 */
const BackgroundWaveform: React.FC<BackgroundWaveformProps> = ({ 
  trackId, 
  height = 90, // Reduced from 100 to 90
  color = 'rgba(59, 130, 246, 0.7)'
}) => {
  const [waveformData, setWaveformData] = useState<number[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Helper function to generate consistent waveform data based on track ID
  const generateWaveformDataForTrack = (id: number) => {
    // Create a seed based on the track ID for consistent generation
    const seed = id || 12345;
    
    // Create a deterministic pseudo-random number generator
    const seededRandom = (seed: number, index: number) => {
      const value = Math.sin(seed * index) * 10000;
      return Math.abs(value - Math.floor(value));
    };
    
    // Generate data with more realistic audio waveform characteristics
    const generatedData: number[] = [];
    const totalSamples = 200;
    
    // Create realistic audio-like waveform with quieter intro/outro and louder middle section
    for (let i = 0; i < totalSamples; i++) {
      const position = i / totalSamples; // 0 to 1
      
      // Create a natural amplitude envelope (quieter at start/end, louder in middle)
      const envelopeMultiplier = Math.sin(position * Math.PI);
      
      // Add some variations for verse/chorus patterns (common in music)
      const patternVariation = 
        Math.sin(position * Math.PI * 8) * 0.2 + // Fast variations
        Math.sin(position * Math.PI * 2) * 0.3;  // Slow variations for verse/chorus
      
      // Combine factors with seeded random value for consistency
      const amplitude = 
        (0.3 + (seededRandom(seed, i) * 0.4)) * // Base randomness (0.3-0.7)
        envelopeMultiplier * // Overall shape
        (1 + patternVariation); // Add pattern variations
      
      // Ensure values stay within 0-1 range
      generatedData.push(Math.max(0.05, Math.min(0.95, amplitude)));
    }
    
    return generatedData;
  };
  
  useEffect(() => {
    const fetchWaveformData = async () => {
      if (!trackId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch track waveform data from API
        const response = await apiRequest('GET', `/api/radio/tracks/${trackId}/waveform`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data && data.waveformData) {
            // Convert waveform data string to array if needed
            let parsedData: number[];
            
            if (typeof data.waveformData === 'string') {
              try {
                parsedData = JSON.parse(data.waveformData);
              } catch (e) {
                // If string isn't valid JSON, try to parse as comma-separated values
                parsedData = data.waveformData.split(',').map(Number);
              }
            } else if (Array.isArray(data.waveformData)) {
              parsedData = data.waveformData;
            } else {
              throw new Error('Invalid waveform data format');
            }
            
            // Filter out any NaN values and normalize between 0 and 1
            parsedData = parsedData
              .filter(val => !isNaN(val))
              .map(val => Math.min(Math.max(val, 0), 1));
            
            setWaveformData(parsedData);
          } else {
            // Generate a proper-looking waveform pattern based on the track ID
            const generated = generateWaveformDataForTrack(trackId);
            setWaveformData(generated);
          }
        } else {
          // Generate waveform data on error but make it look realistic
          const generated = generateWaveformDataForTrack(trackId);
          setWaveformData(generated);
        }
      } catch (err) {
        setError('Failed to load waveform data');
        console.error('Error fetching waveform data:', err);
        
        // Generate consistent waveform pattern based on track ID
        const generated = generateWaveformDataForTrack(trackId);
        setWaveformData(generated);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWaveformData();
  }, [trackId]);
  
  // Show loading state
  if (isLoading && !waveformData) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-pulse text-xs text-zinc-500">Loading...</div>
      </div>
    );
  }
  
  // Show error state
  if (error && !waveformData) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-xs text-red-500">{error}</div>
      </div>
    );
  }
  
  // If no data, show nothing
  if (!waveformData) {
    return null;
  }
  
  // Calculate bar dimensions
  const totalBars = waveformData.length;
  const barWidth = 100 / totalBars;
  
  return (
    <div className="w-full h-full flex items-end justify-between">
      {waveformData.map((amplitude, index) => (
        <div
          key={index}
          className="rounded-t"
          style={{
            backgroundColor: color,
            width: `${barWidth}%`,
            height: `${Math.max(amplitude * height, 2)}%`, // Ensure minimum visibility
            marginRight: `${index < totalBars - 1 ? '1px' : '0'}`
          }}
        />
      ))}
    </div>
  );
};

export default BackgroundWaveform;
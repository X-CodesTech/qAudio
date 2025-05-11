import React, { createContext, useContext, useState } from 'react';

type StudioLineCount = {
  studioA: number;
  studioB: number;
  studioC: number;
  studioD: number;
};

type StudioType = 'A' | 'B' | 'C' | 'D';

type LineCountContextType = {
  lineCount: StudioLineCount;
  setStudioLineCount: (studio: StudioType, count: number) => void;
  getStudioLineIds: (studio: StudioType) => number[];
};

const defaultLineCount: StudioLineCount = {
  studioA: 6,
  studioB: 6,
  studioC: 4,
  studioD: 4
};

export const LineCountContext = createContext<LineCountContextType>({
  lineCount: defaultLineCount,
  setStudioLineCount: () => {},
  getStudioLineIds: () => [],
});

export function useLineCount() {
  return useContext(LineCountContext);
}

export function LineCountProvider({ children }: { children: React.ReactNode }) {
  // Force reset the stored line count to update it to our new defaults
  // This is a one-time operation to ensure Studios C and D have 4 lines
  React.useEffect(() => {
    localStorage.removeItem('studioLineCount');
  }, []);

  const [lineCount, setLineCount] = useState<StudioLineCount>(() => {
    // Try to load from localStorage
    const savedLineCount = localStorage.getItem('studioLineCount');
    if (savedLineCount) {
      try {
        return JSON.parse(savedLineCount);
      } catch (error) {
        console.error("Error parsing saved line count:", error);
      }
    }
    return defaultLineCount;
  });

  // Update the line count for a specific studio
  const setStudioLineCount = (studio: StudioType, count: number) => {
    // Studios C and D should always have 4 lines
    if (studio === 'C' || studio === 'D') {
      count = 4; // Force 4 lines for Studios C and D, regardless of input
    }
    
    setLineCount(prev => {
      const studioKey = `studio${studio}` as keyof StudioLineCount;
      const newLineCount = {
        ...prev,
        [studioKey]: count
      };
      
      // Save to localStorage
      localStorage.setItem('studioLineCount', JSON.stringify(newLineCount));
      
      return newLineCount;
    });
  };

  // Get line IDs for a studio based on its current line count
  const getStudioLineIds = (studio: StudioType): number[] => {
    // Studios C and D should always return exactly 4 lines
    if (studio === 'C') {
      return [13, 14, 15, 16]; // Fixed line IDs for Studio C
    }
    
    if (studio === 'D') {
      return [19, 20, 21, 22]; // Fixed line IDs for Studio D
    }
    
    // For Studios A and B, get the current count from lineCount state
    const studioKey = `studio${studio}` as keyof StudioLineCount;
    const count = lineCount[studioKey];
    
    // Calculate base ID for studios A and B
    let baseId: number;
    switch (studio) {
      case 'A': baseId = 1; break;    // Lines 1-6
      case 'B': baseId = 7; break;    // Lines 7-12
      default: baseId = 1;
    }
    
    // Generate array of line IDs based on count
    return Array.from({ length: count }, (_, i) => baseId + i);
  };

  return (
    <LineCountContext.Provider value={{ lineCount, setStudioLineCount, getStudioLineIds }}>
      {children}
    </LineCountContext.Provider>
  );
}
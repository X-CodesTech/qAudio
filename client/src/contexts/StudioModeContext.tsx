import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type StudioType = 'A' | 'B' | 'C' | 'D';

type StudioModeContextType = {
  activeStudio: StudioType;
  setActiveStudio: (studio: StudioType) => void;
  toggleStudio: () => void; // Cycles through studios
  isTransitioning: boolean;
  // Helper functions for styling
  getStudioColor: (type: 'bg' | 'text' | 'border', opacity?: number) => string;
  StudioWrapper: React.FC<{
    children: ReactNode;
    transitionKey?: string;
    className?: string;
    animation?: 'fade' | 'slide' | 'scale' | 'none';
  }>;
};

export const StudioModeContext = createContext<StudioModeContextType | null>(null);

export function StudioModeProvider({ children }: { children: ReactNode }) {
  const [activeStudio, setActiveStudio] = useState<StudioType>('A');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const toggleStudio = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveStudio(prev => {
        switch (prev) {
          case 'A': return 'B';
          case 'B': return 'C';
          case 'C': return 'D';
          case 'D': return 'A';
          default: return 'A';
        }
      });
      setIsTransitioning(false);
    }, 300); // Match this to the animation duration
  };

  // Helper function to get colors based on the active studio
  const getStudioColor = (type: 'bg' | 'text' | 'border', opacity: number = 100) => {
    const opacityValue = opacity >= 100 ? '' : `-${opacity}`;
    
    // Define color schemes for all studios
    const studioColors = {
      A: {
        bg: `bg-orange-500${opacityValue}`,
        text: `text-orange-500${opacityValue}`,
        border: `border-orange-500${opacityValue}`
      },
      B: {
        bg: `bg-green-600${opacityValue}`,
        text: `text-green-500${opacityValue}`,
        border: `border-green-500${opacityValue}`
      },
      C: {
        bg: `bg-blue-500${opacityValue}`,
        text: `text-blue-500${opacityValue}`,
        border: `border-blue-500${opacityValue}`
      },
      D: {
        bg: `bg-purple-500${opacityValue}`,
        text: `text-purple-500${opacityValue}`,
        border: `border-purple-500${opacityValue}`
      }
    };
    
    return studioColors[activeStudio][type] || '';
  };

  // Component to wrap content that needs to animate on studio change
  const StudioWrapper: StudioModeContextType['StudioWrapper'] = ({ 
    children, 
    transitionKey,
    className = '',
    animation = 'fade',
  }) => {
    // Different animation variants
    const variants = {
      fade: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.3 }
      },
      slide: {
        initial: { x: -20, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: 20, opacity: 0 },
        transition: { duration: 0.3 }
      },
      scale: {
        initial: { scale: 0.9, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        exit: { scale: 0.9, opacity: 0 },
        transition: { duration: 0.3 }
      },
      none: {
        initial: {},
        animate: {},
        exit: {},
        transition: { duration: 0 }
      }
    };

    const selectedVariant = variants[animation];

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={transitionKey || activeStudio}
          initial={selectedVariant.initial}
          animate={selectedVariant.animate}
          exit={selectedVariant.exit}
          transition={selectedVariant.transition}
          className={className}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    );
  };

  // Set up a handler for studio switching with keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shift + Letter for switching studios (A, B, C, D)
      if (e.shiftKey && !isTransitioning) {
        const key = e.key.toUpperCase();
        if ((key === 'A' || key === 'B' || key === 'C' || key === 'D') && key !== activeStudio) {
          setIsTransitioning(true);
          setTimeout(() => {
            setActiveStudio(key as StudioType);
            setIsTransitioning(false);
          }, 300);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeStudio, isTransitioning]);

  return (
    <StudioModeContext.Provider
      value={{
        activeStudio,
        setActiveStudio: (studio) => {
          if (studio !== activeStudio && !isTransitioning) {
            setIsTransitioning(true);
            setTimeout(() => {
              setActiveStudio(studio);
              setIsTransitioning(false);
            }, 300);
          }
        },
        toggleStudio,
        isTransitioning,
        getStudioColor,
        StudioWrapper,
      }}
    >
      {children}
    </StudioModeContext.Provider>
  );
}

export function useStudioMode() {
  const context = useContext(StudioModeContext);
  if (!context) {
    throw new Error('useStudioMode must be used within a StudioModeProvider');
  }
  return context;
}
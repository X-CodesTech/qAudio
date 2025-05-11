import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStudioMode } from '@/contexts/StudioModeContext';

export interface StudioTransitionProps {
  children: React.ReactNode;
  transitionType?: 'fade' | 'slide' | 'scale' | 'wipe' | 'none';
  className?: string;
}

export function StudioTransition({
  children,
  transitionType = 'fade',
  className = '',
}: StudioTransitionProps) {
  const { activeStudio, isTransitioning } = useStudioMode();

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
      initial: { scale: 0.95, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.95, opacity: 0 },
      transition: { duration: 0.3 }
    },
    wipe: {
      initial: { clipPath: 'inset(0 100% 0 0)' },
      animate: { clipPath: 'inset(0 0% 0 0)' },
      exit: { clipPath: 'inset(0 0 0 100%)' },
      transition: { duration: 0.4, ease: 'easeInOut' }
    },
    none: {
      initial: {},
      animate: {},
      exit: {},
      transition: { duration: 0 }
    }
  };

  // Get the appropriate variant
  const selectedVariant = variants[transitionType];

  return (
    <div className={`relative ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStudio}
          className="w-full"
          initial={selectedVariant.initial}
          animate={selectedVariant.animate}
          exit={selectedVariant.exit}
          transition={selectedVariant.transition}
        >
          {children}
        </motion.div>
      </AnimatePresence>

      {/* Overlay during transition */}
      {isTransitioning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          exit={{ opacity: 0 }}
          className={`absolute inset-0 z-10 ${
            activeStudio === 'A' ? 'bg-blue-500' : 'bg-green-500'
          }`}
        />
      )}
    </div>
  );
}

// Specialized version for use with panels and cards
export function StudioPanel({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { activeStudio } = useStudioMode();

  const studioColors = {
    A: 'border-blue-500/30 bg-gradient-to-tr from-blue-950/20 to-blue-900/5',
    B: 'border-green-500/30 bg-gradient-to-tr from-green-950/20 to-green-900/5',
  };

  return (
    <div
      className={`rounded-lg border ${studioColors[activeStudio]} p-4 shadow-md transition-colors duration-300 ${className}`}
    >
      {children}
    </div>
  );
}

// Visual indicator for the active studio (compact display)
export function StudioIndicator({ className = '' }: { className?: string }) {
  const { activeStudio, isTransitioning } = useStudioMode();
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="text-xs font-semibold text-zinc-400">Studio:</div>
      <div 
        className={`relative rounded-md px-2 py-0.5 text-xs font-bold ${
          activeStudio === 'A' 
            ? 'bg-blue-500/20 text-blue-200' 
            : 'bg-green-500/20 text-green-200'
        } transition-colors duration-300`}
      >
        <motion.span 
          animate={{ 
            opacity: isTransitioning ? [0.5, 1, 0.5, 1] : 1 
          }}
          transition={{ 
            duration: 0.5, 
            repeat: isTransitioning ? Infinity : 0,
            repeatType: 'loop' 
          }}
        >
          {activeStudio}
        </motion.span>
        
        <motion.div 
          className={`absolute -bottom-1 left-0 h-0.5 rounded-full ${
            activeStudio === 'A' ? 'bg-blue-400' : 'bg-green-400'
          }`}
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 0.4 }}
        />
      </div>
    </div>
  );
}
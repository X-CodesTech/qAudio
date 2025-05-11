import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeftRight, 
  Radio, 
  Mic2, 
  Headphones, 
  MoveHorizontal,
  Tv,
  MonitorPlay
} from 'lucide-react';

type StudioType = 'A' | 'B' | 'C' | 'D';

type StudioModeSwitcherProps = {
  activeStudio: StudioType;
  onStudioChange: (studio: StudioType) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'full' | 'compact';
  showTooltips?: boolean;
};

export default function StudioModeSwitcher({
  activeStudio,
  onStudioChange,
  className = '',
  size = 'md',
  variant = 'full',
  showTooltips = true,
}: StudioModeSwitcherProps) {
  const { t } = useTranslation();
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Size mapping
  const sizeClasses = {
    sm: 'text-xs p-1',
    md: 'text-sm p-2',
    lg: 'text-base p-3',
  };

  // Handle studio change with transition
  const handleStudioChange = (studio: StudioType) => {
    if (studio === activeStudio || isTransitioning) return;
    
    setIsTransitioning(true);
    
    // Trigger the change after a short delay to show the transition
    setTimeout(() => {
      onStudioChange(studio);
      setIsTransitioning(false);
    }, 300); // Matches the transition duration
  };

  // Get the next studio in rotation
  const getNextStudio = (): StudioType => {
    switch (activeStudio) {
      case 'A': return 'B';
      case 'B': return 'C';
      case 'C': return 'D';
      case 'D': return 'A';
      default: return 'A';
    }
  };

  // Get the background color for studio indicator based on active studio
  const getStudioBgColor = (studio: StudioType): string => {
    switch (studio) {
      case 'A': return 'bg-orange-500';
      case 'B': return 'bg-green-500';
      case 'C': return 'bg-blue-500';
      case 'D': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  // Conditional rendering based on variant
  if (variant === 'icon') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <Button
          variant="outline"
          size="icon"
          className={`relative bg-zinc-800 border-zinc-700 ${isTransitioning ? 'opacity-50' : ''}`}
          onClick={() => handleStudioChange(getNextStudio())}
          title={showTooltips ? t('producer.switchToStudio', { studio: getNextStudio() }) : ''}
          disabled={isTransitioning}
        >
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: isTransitioning ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ArrowLeftRight className="h-4 w-4" />
          </motion.div>
          <div 
            className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
              getStudioBgColor(activeStudio)} text-white`}
          >
            {activeStudio}
          </div>
        </Button>
      </div>
    );
  }

  if (variant === 'compact') {
    // Helper function to get button style based on studio
    const getStudioButtonStyle = (studio: StudioType) => {
      const baseClass = 'border-t border-b border-zinc-700';
      const isActive = activeStudio === studio;
      
      let positionClass = '';
      if (studio === 'A') positionClass = 'rounded-l-md border-l';
      else if (studio === 'D') positionClass = 'rounded-r-md border-r';
      
      let colorClass = '';
      if (isActive) {
        switch (studio) {
          case 'A': colorClass = 'bg-orange-500 hover:bg-orange-600 text-white'; break;
          case 'B': colorClass = 'bg-green-600 hover:bg-green-700 text-white'; break;
          case 'C': colorClass = 'bg-blue-500 hover:bg-blue-600 text-white'; break;
          case 'D': colorClass = 'bg-purple-500 hover:bg-purple-600 text-white'; break;
        }
      } else {
        colorClass = 'bg-zinc-800 text-zinc-400 hover:text-zinc-100';
      }
      
      return `${baseClass} ${positionClass} ${colorClass} ${isTransitioning ? 'opacity-50' : ''}`;
    };
    
    return (
      <div className={`inline-flex shadow-sm ${className}`}>
        <Button
          variant={activeStudio === 'A' ? 'default' : 'outline'}
          size="sm"
          className={getStudioButtonStyle('A')}
          onClick={() => handleStudioChange('A')}
          disabled={isTransitioning}
        >
          A
        </Button>
        <Button
          variant={activeStudio === 'B' ? 'default' : 'outline'}
          size="sm"
          className={getStudioButtonStyle('B')}
          onClick={() => handleStudioChange('B')}
          disabled={isTransitioning}
        >
          B
        </Button>
        <Button
          variant={activeStudio === 'C' ? 'default' : 'outline'}
          size="sm"
          className={getStudioButtonStyle('C')}
          onClick={() => handleStudioChange('C')}
          disabled={isTransitioning}
        >
          C
        </Button>
        <Button
          variant={activeStudio === 'D' ? 'default' : 'outline'}
          size="sm"
          className={getStudioButtonStyle('D')}
          onClick={() => handleStudioChange('D')}
          disabled={isTransitioning}
        >
          D
        </Button>
      </div>
    );
  }

  // Default full variant
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {/* Studio A */}
      <motion.div
        className="flex"
        initial={{ opacity: 1 }}
        animate={{ 
          opacity: isTransitioning ? 0.5 : 1,
          scale: isTransitioning ? 0.95 : 1,
        }}
        transition={{ duration: 0.3 }}
      >
        <Button
          variant={activeStudio === 'A' ? 'default' : 'outline'}
          className={`flex items-center gap-2 px-4 ${sizeClasses[size]} relative overflow-hidden ${
            activeStudio === 'A' 
              ? 'bg-orange-500 hover:bg-orange-600 text-white' 
              : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-100'
          }`}
          onClick={() => handleStudioChange('A')}
          disabled={isTransitioning || activeStudio === 'A'}
        >
          {activeStudio === 'A' && (
            <motion.div 
              className="absolute inset-0 bg-orange-400 opacity-20"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ 
                repeat: Infinity, 
                duration: 1.5, 
                ease: 'linear',
              }}
            />
          )}
          <Radio className="h-4 w-4" />
          <span>{t('producer.studioA')}</span>
          {activeStudio === 'A' && (
            <div className="absolute -right-1 -top-1 bg-orange-300 text-orange-900 text-xs px-1 rotate-12 shadow-md">
              {t('producer.active')}
            </div>
          )}
        </Button>
      </motion.div>

      <MoveHorizontal className={`h-4 w-4 text-zinc-500 ${isTransitioning ? 'animate-pulse' : ''}`} />

      {/* Studio B */}
      <motion.div
        className="flex"
        initial={{ opacity: 1 }}
        animate={{ 
          opacity: isTransitioning ? 0.5 : 1,
          scale: isTransitioning ? 0.95 : 1,
        }}
        transition={{ duration: 0.3 }}
      >
        <Button
          variant={activeStudio === 'B' ? 'default' : 'outline'}
          className={`flex items-center gap-2 px-4 ${sizeClasses[size]} relative overflow-hidden ${
            activeStudio === 'B' 
              ? 'bg-green-600 hover:bg-green-700 text-white' 
              : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-100'
          }`}
          onClick={() => handleStudioChange('B')}
          disabled={isTransitioning || activeStudio === 'B'}
        >
          {activeStudio === 'B' && (
            <motion.div 
              className="absolute inset-0 bg-green-400 opacity-20"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ 
                repeat: Infinity, 
                duration: 1.5, 
                ease: 'linear',
              }}
            />
          )}
          <Mic2 className="h-4 w-4" />
          <span>{t('producer.studioB')}</span>
          {activeStudio === 'B' && (
            <div className="absolute -right-1 -top-1 bg-green-300 text-green-900 text-xs px-1 rotate-12 shadow-md">
              {t('producer.active')}
            </div>
          )}
        </Button>
      </motion.div>

      <MoveHorizontal className={`h-4 w-4 text-zinc-500 ${isTransitioning ? 'animate-pulse' : ''}`} />

      {/* Studio C */}
      <motion.div
        className="flex"
        initial={{ opacity: 1 }}
        animate={{ 
          opacity: isTransitioning ? 0.5 : 1,
          scale: isTransitioning ? 0.95 : 1,
        }}
        transition={{ duration: 0.3 }}
      >
        <Button
          variant={activeStudio === 'C' ? 'default' : 'outline'}
          className={`flex items-center gap-2 px-4 ${sizeClasses[size]} relative overflow-hidden ${
            activeStudio === 'C' 
              ? 'bg-blue-500 hover:bg-blue-600 text-white' 
              : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-100'
          }`}
          onClick={() => handleStudioChange('C')}
          disabled={isTransitioning || activeStudio === 'C'}
        >
          {activeStudio === 'C' && (
            <motion.div 
              className="absolute inset-0 bg-blue-400 opacity-20"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ 
                repeat: Infinity, 
                duration: 1.5, 
                ease: 'linear',
              }}
            />
          )}
          <Tv className="h-4 w-4" />
          <span>{t('producer.studioC', 'Studio C')}</span>
          {activeStudio === 'C' && (
            <div className="absolute -right-1 -top-1 bg-blue-300 text-blue-900 text-xs px-1 rotate-12 shadow-md">
              {t('producer.active')}
            </div>
          )}
        </Button>
      </motion.div>

      <MoveHorizontal className={`h-4 w-4 text-zinc-500 ${isTransitioning ? 'animate-pulse' : ''}`} />

      {/* Studio D */}
      <motion.div
        className="flex"
        initial={{ opacity: 1 }}
        animate={{ 
          opacity: isTransitioning ? 0.5 : 1,
          scale: isTransitioning ? 0.95 : 1,
        }}
        transition={{ duration: 0.3 }}
      >
        <Button
          variant={activeStudio === 'D' ? 'default' : 'outline'}
          className={`flex items-center gap-2 px-4 ${sizeClasses[size]} relative overflow-hidden ${
            activeStudio === 'D' 
              ? 'bg-purple-500 hover:bg-purple-600 text-white' 
              : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-100'
          }`}
          onClick={() => handleStudioChange('D')}
          disabled={isTransitioning || activeStudio === 'D'}
        >
          {activeStudio === 'D' && (
            <motion.div 
              className="absolute inset-0 bg-purple-400 opacity-20"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ 
                repeat: Infinity, 
                duration: 1.5, 
                ease: 'linear',
              }}
            />
          )}
          <MonitorPlay className="h-4 w-4" />
          <span>{t('producer.studioD', 'Studio D')}</span>
          {activeStudio === 'D' && (
            <div className="absolute -right-1 -top-1 bg-purple-300 text-purple-900 text-xs px-1 rotate-12 shadow-md">
              {t('producer.active')}
            </div>
          )}
        </Button>
      </motion.div>
    </div>
  );
}
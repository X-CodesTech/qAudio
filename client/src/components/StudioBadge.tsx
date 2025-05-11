import React from 'react';
import { cn } from '@/lib/utils';

interface StudioBadgeProps {
  studioId: 'A' | 'B' | 'C' | 'D' | 'RE' | 'TECH';
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StudioBadge({ 
  studioId, 
  showLabel = true, 
  size = 'md', 
  className 
}: StudioBadgeProps) {
  let bgColor = '';
  let text = '';
  
  switch (studioId) {
    case 'A':
      bgColor = 'bg-[#D27D2D]';
      text = 'Studio A';
      break;
    case 'B':
      bgColor = 'bg-[#2D8D27]';
      text = 'Studio B';
      break;
    case 'C':
      bgColor = 'bg-[#2D7D8D]'; // Blue color for Studio C
      text = 'Studio C';
      break;
    case 'D':
      bgColor = 'bg-[#7D2D8D]'; // Purple color for Studio D
      text = 'Studio D';
      break;
    case 'RE':
      bgColor = 'bg-[#D22D2D]';
      text = 'RE Studio';
      break;
    case 'TECH':
      bgColor = 'bg-[#7D2D8D]';
      text = 'Tech';
      break;
  }
  
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };
  
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className={cn("rounded-full", bgColor, sizeClasses[size])} />
      {showLabel && <span>{text}</span>}
    </div>
  );
}
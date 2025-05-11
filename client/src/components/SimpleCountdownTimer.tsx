import React from 'react';
import StandaloneTimer from './StandaloneTimer';

interface SimpleCountdownTimerProps {
  studio: 'A' | 'B';
  variant: 'producer' | 'talent';
}

// This is now just a wrapper around StandaloneTimer for backward compatibility
export default function SimpleCountdownTimer({ studio, variant }: SimpleCountdownTimerProps) {
  console.log(`SimpleCountdownTimer rendering for Studio ${studio}, variant: ${variant} - Using StandaloneTimer instead`);
  
  // Simply delegate to StandaloneTimer
  return (
    <StandaloneTimer studio={studio} variant={variant} />
  );
}
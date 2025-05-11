import { useContext } from 'react';
import { VoIPContext } from '@/contexts/VoIPContext';

export const useVoIP = () => {
  const context = useContext(VoIPContext);
  
  if (!context) {
    throw new Error('useVoIP must be used within a VoIPProvider');
  }
  
  return context;
};

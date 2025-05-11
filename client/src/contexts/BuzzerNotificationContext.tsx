import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useVoIP } from './VoIPContext';

type StudioNotification = {
  A: boolean;
  B: boolean;
};

type BuzzerNotificationContextType = {
  studioNotifications: StudioNotification;
  clearNotification: (studio: 'A' | 'B') => void;
};

const BuzzerNotificationContext = createContext<BuzzerNotificationContextType | null>(null);

export function BuzzerNotificationProvider({ children }: { children: ReactNode }) {
  const { websocket } = useVoIP();
  const [studioNotifications, setStudioNotifications] = useState<StudioNotification>({
    A: false,
    B: false
  });

  const clearNotification = (studio: 'A' | 'B') => {
    setStudioNotifications(prev => ({
      ...prev,
      [studio]: false
    }));
  };

  useEffect(() => {
    if (!websocket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        // When a producerBuzzer message is received (from talent to producer)
        if (data.type === 'producerBuzzer' && data.data) {
          const { studioId, activate } = data.data;
          
          if (studioId && (studioId === 'A' || studioId === 'B')) {
            if (activate) {
              console.log(`Setting notification for Studio ${studioId} to true`);
              setStudioNotifications(prev => ({
                ...prev,
                [studioId]: true
              }));
            }
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message in BuzzerNotificationContext:', error);
      }
    };

    websocket.addEventListener('message', handleMessage);

    return () => {
      websocket.removeEventListener('message', handleMessage);
    };
  }, [websocket]);

  return (
    <BuzzerNotificationContext.Provider value={{ studioNotifications, clearNotification }}>
      {children}
    </BuzzerNotificationContext.Provider>
  );
}

export function useBuzzerNotification() {
  const context = useContext(BuzzerNotificationContext);
  if (!context) {
    throw new Error('useBuzzerNotification must be used within a BuzzerNotificationProvider');
  }
  return context;
}
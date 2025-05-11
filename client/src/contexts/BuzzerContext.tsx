import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import { useVoIP } from './VoIPContext';
import { useToast } from '@/hooks/use-toast';

type StudioId = 'A' | 'B';

// Define buzzer state type
interface BuzzerState {
  studioA: boolean;
  studioB: boolean;
}

// Context interface
interface BuzzerContextType {
  // Is buzzer active for producer in studio A or B
  producerBuzzerActive: BuzzerState;
  // Is buzzer active for talent in studio A or B
  talentBuzzerActive: BuzzerState;
  // Functions to trigger and cancel buzzer
  triggerProducerBuzzer: (studioId: StudioId, activate: boolean) => void;
  triggerTalentBuzzer: (studioId: StudioId, activate: boolean) => void;
}

// Create context with default values
const BuzzerContext = createContext<BuzzerContextType>({
  producerBuzzerActive: { studioA: false, studioB: false },
  talentBuzzerActive: { studioA: false, studioB: false },
  triggerProducerBuzzer: () => {},
  triggerTalentBuzzer: () => {},
});

// Custom events for buzzer communication
interface TalentBuzzerEvent extends CustomEvent {
  detail: {
    studioId: StudioId;
    activate: boolean;
  };
}

interface ProducerBuzzerEvent extends CustomEvent {
  detail: {
    studioId: StudioId;
    activate: boolean;
  };
}

// Add custom event types to window interface
declare global {
  interface WindowEventMap {
    'talentBuzzerEvent': TalentBuzzerEvent;
    'producerBuzzerEvent': ProducerBuzzerEvent;
  }
}

// Provider component
export const BuzzerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { websocket } = useVoIP();
  const { toast } = useToast();

  // State for buzzer status
  const [producerBuzzerActive, setProducerBuzzerActive] = useState<BuzzerState>({ 
    studioA: false, 
    studioB: false 
  });
  
  const [talentBuzzerActive, setTalentBuzzerActive] = useState<BuzzerState>({ 
    studioA: false, 
    studioB: false 
  });

  // Dispatch custom event for local component communication
  const dispatchBuzzerEvent = useCallback((eventType: string, studioId: StudioId, activate: boolean) => {
    const event = new CustomEvent(eventType, {
      detail: { studioId, activate }
    });
    window.dispatchEvent(event);
  }, []);

  // Function to send buzzer notification from producer to talent
  const triggerTalentBuzzer = useCallback((studioId: StudioId, activate: boolean) => {
    // Convert studioId to state property name
    const studioKey = studioId === 'A' ? 'studioA' : 'studioB';
    
    // Update local state first
    setTalentBuzzerActive(prev => ({
      ...prev,
      [studioKey]: activate
    }));
    
    // Dispatch custom event
    dispatchBuzzerEvent('talentBuzzerEvent', studioId, activate);
    
    // Send HTTP request (primary communication channel)
    fetch('/api/studio/buzz-talent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studioId, activate })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Talent buzzer HTTP request success:', data);
      
      // Try WebSocket as backup if available
      const OPEN_STATE = typeof WebSocket !== 'undefined' ? WebSocket.OPEN : 1;
      if (websocket && websocket.readyState === OPEN_STATE) {
        try {
          websocket.send(JSON.stringify({
            type: 'talentBuzzer',
            data: { studioId, activate }
          }));
        } catch (error) {
          console.log('WebSocket send failed, but HTTP succeeded');
        }
      }
    })
    .catch(error => {
      console.error('Error with talent buzzer HTTP request:', error);
      toast({
        title: "Connection Error",
        description: "Unable to send buzzer notification. Please try again.",
        variant: "destructive"
      });
    });
  }, [dispatchBuzzerEvent, toast, websocket]);

  // Function to send buzzer notification from talent to producer
  const triggerProducerBuzzer = useCallback((studioId: StudioId, activate: boolean) => {
    // Convert studioId to state property name
    const studioKey = studioId === 'A' ? 'studioA' : 'studioB';
    
    // Update local state first
    setProducerBuzzerActive(prev => ({
      ...prev,
      [studioKey]: activate
    }));
    
    // Dispatch custom event
    dispatchBuzzerEvent('producerBuzzerEvent', studioId, activate);
    
    // Send HTTP request (primary communication channel)
    fetch('/api/studio/buzz-producer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studioId, activate })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Producer buzzer HTTP request success:', data);
      
      // Try WebSocket as backup if available
      const OPEN_STATE = typeof WebSocket !== 'undefined' ? WebSocket.OPEN : 1;
      if (websocket && websocket.readyState === OPEN_STATE) {
        try {
          websocket.send(JSON.stringify({
            type: 'producerBuzzer',
            data: { studioId, activate }
          }));
        } catch (error) {
          console.log('WebSocket send failed, but HTTP succeeded');
        }
      }
    })
    .catch(error => {
      console.error('Error with producer buzzer HTTP request:', error);
      toast({
        title: "Connection Error",
        description: "Unable to send buzzer notification. Please try again.",
        variant: "destructive"
      });
    });
  }, [dispatchBuzzerEvent, toast, websocket]);

  // Listen for WebSocket messages
  useEffect(() => {
    if (!websocket) return;
    
    const handleWebSocketMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle producer buzzer message (from talent to producer)
        if (data.type === 'producerBuzzer') {
          const { studioId, activate } = data.data;
          if (studioId === 'A' || studioId === 'B') {
            const studioKey = studioId === 'A' ? 'studioA' : 'studioB';
            setProducerBuzzerActive(prev => ({
              ...prev,
              [studioKey]: activate
            }));
          }
        }
        
        // Handle talent buzzer message (from producer to talent)
        else if (data.type === 'talentBuzzer') {
          const { studioId, activate } = data.data;
          if (studioId === 'A' || studioId === 'B') {
            const studioKey = studioId === 'A' ? 'studioA' : 'studioB';
            setTalentBuzzerActive(prev => ({
              ...prev,
              [studioKey]: activate
            }));
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    websocket.addEventListener('message', handleWebSocketMessage);
    
    return () => {
      websocket.removeEventListener('message', handleWebSocketMessage);
    };
  }, [websocket]);
  
  // Listen for custom events
  useEffect(() => {
    // Handle producer buzzer events
    const handleProducerBuzzerEvent = (event: ProducerBuzzerEvent) => {
      const { studioId, activate } = event.detail;
      if (studioId === 'A' || studioId === 'B') {
        const studioKey = studioId === 'A' ? 'studioA' : 'studioB';
        setProducerBuzzerActive(prev => ({
          ...prev,
          [studioKey]: activate
        }));
      }
    };
    
    // Handle talent buzzer events
    const handleTalentBuzzerEvent = (event: TalentBuzzerEvent) => {
      const { studioId, activate } = event.detail;
      if (studioId === 'A' || studioId === 'B') {
        const studioKey = studioId === 'A' ? 'studioA' : 'studioB';
        setTalentBuzzerActive(prev => ({
          ...prev,
          [studioKey]: activate
        }));
      }
    };
    
    window.addEventListener('producerBuzzerEvent', handleProducerBuzzerEvent as EventListener);
    window.addEventListener('talentBuzzerEvent', handleTalentBuzzerEvent as EventListener);
    
    return () => {
      window.removeEventListener('producerBuzzerEvent', handleProducerBuzzerEvent as EventListener);
      window.removeEventListener('talentBuzzerEvent', handleTalentBuzzerEvent as EventListener);
    };
  }, []);

  // Context value
  const contextValue: BuzzerContextType = {
    producerBuzzerActive,
    talentBuzzerActive,
    triggerProducerBuzzer,
    triggerTalentBuzzer
  };

  return (
    <BuzzerContext.Provider value={contextValue}>
      {children}
    </BuzzerContext.Provider>
  );
};

// Custom hook to use the buzzer context
export const useBuzzer = () => {
  const context = useContext(BuzzerContext);
  if (!context) {
    throw new Error('useBuzzer must be used within a BuzzerProvider');
  }
  return context;
};
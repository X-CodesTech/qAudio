import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, BellRing } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

// Use static key names that are very unique to avoid conflicts
const BUZZER_KEY_PREFIX = 'QSTUDIO_DIRECT_BUZZER_';

type BuzzerProps = {
  isProducer: boolean;
  studioId: 'A' | 'B';
  hideInStudioHeader?: boolean;
};

export default function DirectBuzzer({ 
  isProducer, 
  studioId, 
  hideInStudioHeader = false 
}: BuzzerProps) {
  const { t } = useTranslation();
  const [isActive, setIsActive] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  
  // Each buzzer broadcasts to a specific channel and listens to its counterpart
  const broadcastChannel = `${BUZZER_KEY_PREFIX}${isProducer ? 'PRODUCER_TO_TALENT' : 'TALENT_TO_PRODUCER'}_${studioId}`;
  const listenChannel = `${BUZZER_KEY_PREFIX}${isProducer ? 'TALENT_TO_PRODUCER' : 'PRODUCER_TO_TALENT'}_${studioId}`;
  
  const checkInterval = 250; // Check more frequently (250ms)
  
  // Set up the listener for the buzzer state changes
  useEffect(() => {
    // Initialize with current state from localStorage
    const storedState = localStorage.getItem(listenChannel);
    const isActivated = storedState === 'ACTIVE';
    setIsActive(isActivated);
    
    // If active, also set blinking
    if (isActivated) {
      setIsBlinking(true);
    }
    
    // Function to check the buzzer state
    const checkBuzzerState = () => {
      const currentState = localStorage.getItem(listenChannel);
      const nowActive = currentState === 'ACTIVE';
      
      if (nowActive !== isActive) {
        setIsActive(nowActive);
        if (nowActive) {
          setIsBlinking(true);
        }
      }
    };
    
    // Listen for storage events from other windows/tabs
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === listenChannel) {
        const nowActive = event.newValue === 'ACTIVE';
        setIsActive(nowActive);
        if (nowActive) {
          setIsBlinking(true);
        }
      }
    };
    
    // Set up polling interval and event listener
    const intervalId = setInterval(checkBuzzerState, checkInterval);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [listenChannel, isActive]);
  
  // Handle button press to activate or deactivate
  const handleBuzzerClick = () => {
    // Also make an HTTP request as a fallback
    const apiEndpoint = isProducer 
      ? `/api/studio/buzz-talent` 
      : `/api/studio/buzz-producer`;
    
    const newState = !isActive;
    
    // First update localStorage to broadcast immediately
    localStorage.setItem(broadcastChannel, newState ? 'ACTIVE' : 'INACTIVE');
    
    // Update local state
    setIsActive(newState);
    if (newState) {
      setIsBlinking(true);
    }
    
    // Make HTTP fallback request
    fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        studioId,
        activate: newState,
      }),
    })
    .then(response => response.json())
    .then(data => {
      console.log('Buzzer HTTP request successful:', data);
    })
    .catch(error => {
      console.error('Buzzer HTTP request failed:', error);
      // Still continue with localStorage mechanism
    });
    
    // Auto-deactivate after 5 seconds
    if (newState) {
      toast({
        title: isProducer ? `Buzzing Studio ${studioId}` : 'Buzzing Producer',
        description: 'Buzzer activated for 5 seconds',
      });
      
      setTimeout(() => {
        localStorage.setItem(broadcastChannel, 'INACTIVE');
        setIsActive(false);
        
        // Also send deactivate request
        fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            studioId,
            activate: false,
          }),
        });
      }, 5000);
    }
  };
  
  // Hide if requested
  if (hideInStudioHeader) {
    return null;
  }

  // Define animation style for the buzzer
  const animationStyle = isBlinking ? {
    animation: 'buzzer 0.6s ease-in-out infinite'
  } : {};

  // Color classes based on studio
  const studioColorClasses = studioId === 'A' 
    ? 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white' 
    : 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white';

  // Base classes for all buttons
  const baseClasses = 'flex items-center justify-center rounded-md transition-all duration-200';
  
  // Classes specific to producer or talent buttons
  const producerClasses = 'max-w-full';
  const talentClasses = 'bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-white';

  return (
    <div className="flex justify-center w-full">
      {isProducer ? (
        // Producer view buzzer
        <Button
          size="lg"
          variant="default"
          className={`${baseClasses} ${producerClasses} ${isActive || isBlinking ? 'bg-red-600 text-white' : studioColorClasses}`}
          style={animationStyle}
          onClick={handleBuzzerClick}
        >
          {isActive || isBlinking ? (
            <>
              <BellRing className="mr-2 h-6 w-6 animate-ping" />
              <span className="whitespace-nowrap text-center font-semibold">{t('studios.buzzingTalent')}</span>
            </>
          ) : (
            <>
              <Bell className="mr-2 h-6 w-6" />
              <span className="whitespace-nowrap text-center font-semibold">{t('studios.buzzTalent')}</span>
            </>
          )}
        </Button>
      ) : (
        // Talent view buzzer
        <Button
          size="lg"
          variant="default"
          className={`${baseClasses} ${talentClasses} w-auto h-auto mx-auto shadow-lg border-2 px-10 py-5 text-lg`}
          style={animationStyle}
          onClick={handleBuzzerClick}
        >
          {isBlinking ? (
            <>
              <BellRing className="mr-3 h-7 w-7 animate-ping" />
              <span className="whitespace-nowrap">{t('studios.fromProducer')}</span>
            </>
          ) : isActive ? (
            <>
              <BellRing className="mr-3 h-7 w-7" />
              <span className="whitespace-nowrap">{t('studios.buzzingProducer')}</span>
            </>
          ) : (
            <>
              <Bell className="mr-3 h-7 w-7" />
              <span className="whitespace-nowrap">{t('studios.buzzProducer')}</span>
            </>
          )}
        </Button>
      )}
    </div>
  );
}
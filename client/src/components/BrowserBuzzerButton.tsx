import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Bell, BellRing } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Define localStorage keys used for buzzer communication
const STUDIO_A_BUZZER_KEY = 'qcaller_studio_a_buzzer'; 
const STUDIO_B_BUZZER_KEY = 'qcaller_studio_b_buzzer';

interface BuzzerButtonProps {
  isProducer: boolean;
  studioId: 'A' | 'B';
  hideInStudioHeader?: boolean;
}

export default function BrowserBuzzerButton({ isProducer, studioId, hideInStudioHeader = false }: BuzzerButtonProps) {
  const [isActive, setIsActive] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  // Get the appropriate localStorage key based on the studio ID
  const getStorageKey = () => {
    return studioId === 'A' ? STUDIO_A_BUZZER_KEY : STUDIO_B_BUZZER_KEY;
  };

  // Function to update the buzzer state in localStorage
  const updateBuzzerState = (activate: boolean) => {
    const key = getStorageKey();
    localStorage.setItem(key, JSON.stringify({
      isActive: activate,
      timestamp: new Date().getTime(),
      sender: isProducer ? 'producer' : 'talent'
    }));
  };

  // Color scheme based on studio ID
  const studioColors = {
    A: {
      talent: "bg-orange-500 hover:bg-orange-600",
      talentActive: "bg-red-600 hover:bg-red-700",
      producer: "bg-transparent hover:bg-[#c06f28] text-white"
    },
    B: {
      talent: "bg-green-500 hover:bg-green-600",
      talentActive: "bg-red-600 hover:bg-red-700",
      producer: "bg-transparent hover:bg-[#2D7D27] text-white"
    }
  };

  // Listen for localStorage changes
  useEffect(() => {
    // Function to handle storage events
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === getStorageKey()) {
        try {
          const data = JSON.parse(e.newValue || '{}');
          const sender = data.sender;
          
          // Only process if sender is different from current role
          if ((isProducer && sender === 'talent') || (!isProducer && sender === 'producer')) {
            if (data.isActive) {
              setIsActive(true);
              setIsBlinking(true);
              
              // Auto-deactivate after 15 seconds
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
              }
              
              timeoutRef.current = setTimeout(() => {
                setIsActive(false);
                setIsBlinking(false);
              }, 15000);
              
              // Show toast notification
              toast({
                title: isProducer ? `Studio ${studioId} Buzzer` : "Producer Alert",
                description: isProducer 
                  ? `Talent in Studio ${studioId} is buzzing` 
                  : "The producer is buzzing you",
                variant: "default"
              });
            } else {
              // Handle buzzer deactivation
              setIsActive(false);
              setIsBlinking(false);
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
              }
            }
          }
        } catch (error) {
          console.error("Error parsing buzzer data:", error);
        }
      }
    };

    // Check for initial state when component mounts
    try {
      const storedState = localStorage.getItem(getStorageKey());
      if (storedState) {
        const data = JSON.parse(storedState);
        const sender = data.sender;
        const timestamp = data.timestamp;
        const now = new Date().getTime();
        
        // Only process if sender is different from current role and timestamp is recent (< 15 seconds)
        if ((isProducer && sender === 'talent' || !isProducer && sender === 'producer') && 
            data.isActive && (now - timestamp < 15000)) {
          setIsActive(true);
          setIsBlinking(true);
          
          // Set timeout to auto-deactivate based on remaining time
          const remainingTime = 15000 - (now - timestamp);
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          
          timeoutRef.current = setTimeout(() => {
            setIsActive(false);
            setIsBlinking(false);
          }, remainingTime);
        }
      }
    } catch (error) {
      console.error("Error checking initial buzzer state:", error);
    }

    // Add event listener for storage changes
    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup when component unmounts
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isProducer, studioId, toast, getStorageKey]);

  // Handle buzzer button click
  const handleBuzzerClick = () => {
    const newActiveState = !isActive;
    
    // Update local UI state
    setIsActive(newActiveState);
    setIsBlinking(newActiveState);
    
    // Update localStorage to communicate with other windows/tabs
    updateBuzzerState(newActiveState);
    
    // Set up timeout to automatically disable after 15 seconds
    if (newActiveState) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        setIsActive(false);
        setIsBlinking(false);
        updateBuzzerState(false);
      }, 15000);
      
      // Show appropriate toast
      toast({
        title: isProducer ? `Buzzing Studio ${studioId}` : "Buzzing Producer",
        description: isProducer 
          ? `Talent in Studio ${studioId} has been notified` 
          : "Your producer has been notified",
        variant: "default"
      });
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Show appropriate toast for deactivation
      toast({
        title: isProducer ? "Buzzer Deactivated" : "Buzzer Deactivated",
        description: isProducer 
          ? `Talent Studio ${studioId} notification stopped` 
          : "Producer notification stopped",
        variant: "default"
      });
    }
  };

  // Classes for the buzzer button
  const baseClasses = "relative";
  
  // Producer classes for integrated countdown view
  const producerClasses = isBlinking
    ? "animate-[buzzer_0.6s_ease-in-out_infinite] text-white shadow-lg"
    : isActive 
      ? "bg-red-600 text-white border-none shadow-lg" 
      : studioColors[studioId].producer;
  
  // Talent view classes with enhanced visibility
  const talentClasses = isBlinking 
    ? "animate-[buzzer_0.6s_ease-in-out_infinite] bg-red-600 border-2 border-yellow-400 text-white shadow-lg" 
    : isActive
      ? studioColors[studioId].talentActive + " text-white shadow-lg"
      : studioColors[studioId].talent + " text-white";

  // Return null if this buzzer should be hidden in studio header
  if (hideInStudioHeader) {
    return null;
  }

  return (
    <div className={isProducer ? "flex justify-center w-full h-full" : "flex justify-center w-full h-full"}>
      {isProducer ? (
        // Producer buzzer in countdown header
        <Button
          size="lg"
          variant="ghost"
          className={`${baseClasses} ${producerClasses} h-full w-full px-4 text-lg font-medium rounded-sm flex items-center justify-center`}
          onClick={handleBuzzerClick}
        >
          {isActive ? <BellRing className="mr-2 h-6 w-6 animate-pulse" /> : <Bell className="mr-2 h-6 w-6" />}
          <span className="whitespace-nowrap text-center font-semibold">{t('studios.buzzTalent')}</span>
        </Button>
      ) : (
        // Talent view buzzer
        <Button
          size="lg"
          variant="default"
          className={`${baseClasses} ${talentClasses} w-auto h-auto mx-auto shadow-lg border-2 px-10 py-5 text-lg`}
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
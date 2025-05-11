import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, BellRing } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

// Store buzzer states in localStorage with these keys
const STUDIO_A_PRODUCER_TO_TALENT = 'A_producer_to_talent';
const STUDIO_A_TALENT_TO_PRODUCER = 'A_talent_to_producer';
const STUDIO_B_PRODUCER_TO_TALENT = 'B_producer_to_talent';
const STUDIO_B_TALENT_TO_PRODUCER = 'B_talent_to_producer';

type BuzzerProps = {
  isProducer: boolean;
  studioId: 'A' | 'B';
  hideInStudioHeader?: boolean;
};

export default function SuperSimpleBuzzer({ isProducer, studioId, hideInStudioHeader = false }: BuzzerProps) {
  const [isActive, setIsActive] = useState(false);
  const { t } = useTranslation();

  // Determine which localStorage keys to use based on buzzer type
  const myTriggerKey = isProducer 
    ? (studioId === 'A' ? STUDIO_A_PRODUCER_TO_TALENT : STUDIO_B_PRODUCER_TO_TALENT)
    : (studioId === 'A' ? STUDIO_A_TALENT_TO_PRODUCER : STUDIO_B_TALENT_TO_PRODUCER);
    
  const myListenKey = isProducer 
    ? (studioId === 'A' ? STUDIO_A_TALENT_TO_PRODUCER : STUDIO_B_TALENT_TO_PRODUCER)
    : (studioId === 'A' ? STUDIO_A_PRODUCER_TO_TALENT : STUDIO_B_PRODUCER_TO_TALENT);

  // Listen for buzzer activations
  useEffect(() => {
    // Function to check localStorage
    const checkBuzzer = () => {
      const buzzerState = localStorage.getItem(myListenKey);
      if (buzzerState === 'active') {
        setIsActive(true);
      } else {
        setIsActive(false);
      }
    };

    // Check initially
    checkBuzzer();

    // Set up interval to check periodically
    const intervalId = setInterval(checkBuzzer, 500);

    // Set up storage event listener for changes in other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === myListenKey) {
        checkBuzzer();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Clean up
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [myListenKey]);

  // Handle button click to activate/deactivate buzzer
  const handleClick = () => {
    const newState = !isActive;
    
    // Update localStorage to trigger other windows
    if (newState) {
      localStorage.setItem(myTriggerKey, 'active');
      
      // Auto-deactivate after 10 seconds
      setTimeout(() => {
        localStorage.setItem(myTriggerKey, 'inactive');
        setIsActive(false);
      }, 10000);
      
      toast({
        title: isProducer ? `Buzzing Studio ${studioId}` : "Buzzing Producer",
        description: "Buzzer activated for 10 seconds",
      });
    } else {
      localStorage.setItem(myTriggerKey, 'inactive');
      
      toast({
        title: "Buzzer Deactivated",
        description: "Buzzer has been turned off",
      });
    }
    
    setIsActive(newState);
  };

  // Buzzer colors based on studio and state
  const getButtonColor = () => {
    if (isActive) {
      return "bg-red-600 hover:bg-red-700 text-white animate-[buzzer_0.6s_ease-in-out_infinite]";
    }
    
    if (studioId === 'A') {
      return isProducer ? "bg-orange-500 hover:bg-orange-600 text-white" : "bg-orange-500 hover:bg-orange-600 text-white";
    } else {
      return isProducer ? "bg-green-600 hover:bg-green-700 text-white" : "bg-green-600 hover:bg-green-700 text-white";
    }
  };

  // Hide if requested
  if (hideInStudioHeader) {
    return null;
  }

  return (
    <Button
      className={`w-full h-full text-lg font-bold shadow-lg ${getButtonColor()}`}
      onClick={handleClick}
    >
      {isActive ? (
        <>
          <BellRing className="mr-2 h-6 w-6 animate-ping" />
          {isProducer ? 'BUZZING TALENT' : 'BUZZING PRODUCER'}
        </>
      ) : (
        <>
          <Bell className="mr-2 h-6 w-6" />
          {isProducer ? 'Buzz Talent' : 'Buzz Producer'}
        </>
      )}
    </Button>
  );
}
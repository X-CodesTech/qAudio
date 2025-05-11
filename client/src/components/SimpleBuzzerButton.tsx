import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Bell, BellRing } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface BuzzerButtonProps {
  isProducer: boolean;
  studioId: 'A' | 'B';
  hideInStudioHeader?: boolean;
}

export default function SimpleBuzzerButton({ isProducer, studioId, hideInStudioHeader = false }: BuzzerButtonProps) {
  const [isActive, setIsActive] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  // Color scheme based on studio ID
  const studioColors = {
    A: {
      talent: "bg-orange-500 hover:bg-orange-600",
      talentActive: "bg-red-600 hover:bg-red-700"
    },
    B: {
      talent: "bg-green-500 hover:bg-green-600",
      talentActive: "bg-red-600 hover:bg-red-700"
    }
  };

  // Clean up timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Handle buzzer button click - only changes local state
  const handleBuzzerClick = () => {
    // Toggle the active state
    const newActiveState = !isActive;
    
    // Update UI state
    setIsActive(newActiveState);
    setIsBlinking(newActiveState);
    
    // Set up timeout to automatically disable after 15 seconds
    if (newActiveState) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        setIsActive(false);
        setIsBlinking(false);
      }, 15000);
      
      // Show appropriate toast
      if (isProducer) {
        toast({
          title: "Buzzer Activated",
          description: `Talent Studio ${studioId} has been notified`,
          variant: "default"
        });
      } else {
        toast({
          title: "Producer Notified",
          description: "Your producer has been buzzed",
          variant: "default"
        });
      }
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Show appropriate toast for deactivation
      if (isProducer) {
        toast({
          title: "Buzzer Deactivated",
          description: `Talent Studio ${studioId} notification stopped`,
          variant: "default"
        });
      } else {
        toast({
          title: "Buzzer Deactivated",
          description: "Producer notification stopped",
          variant: "default"
        });
      }
    }
  };

  // Classes for the buzzer button
  const baseClasses = "relative";
  
  // Producer classes for integrated countdown view - enhancing the color contrast
  const producerClasses = isBlinking
    ? "animate-[buzzer_0.6s_ease-in-out_infinite] bg-red-600 border-none text-white shadow-lg"
    : isActive 
      ? "bg-red-600 text-white border-none shadow-lg" 
      : `bg-transparent text-white border-none hover:bg-${studioId === 'A' ? '[#c06f28]' : '[#2D7D27]'}`;
  
  // Talent view classes with enhanced visibility
  const talentClasses = isBlinking 
    ? "animate-[buzzer_0.6s_ease-in-out_infinite] bg-red-600 border-2 border-yellow-400 text-white shadow-lg" 
    : isActive
      ? studioColors[studioId].talentActive + " text-white shadow-lg"
      : studioColors[studioId].talent + " text-white";
  
  // Apply the animation style for both producer and talent - making it much more pronounced
  const animationStyle = isBlinking ? {
    animation: "buzzer 0.5s ease-in-out infinite", // The animation is already defined in index.css with strong effects
    transition: "all 0.2s ease-out",
  } : {};

  // Return null if this buzzer should be hidden in studio header
  if (hideInStudioHeader) {
    return null;
  }

  return (
    <div className={isProducer ? "flex justify-center w-full h-full" : "flex justify-center w-full h-full"}>
      {isProducer ? (
        // Producer buzzer in countdown header - ENLARGED
        <Button
          size="lg"
          variant="ghost"
          className={`${baseClasses} ${producerClasses} h-full w-full px-4 text-lg font-medium rounded-sm flex items-center justify-center`}
          style={animationStyle}
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
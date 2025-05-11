import { useEffect, useState, useRef } from 'react';
import { useVoIP } from '@/contexts/VoIPContext';
import { useAudioLevels } from '@/hooks/useAudioLevels';
import { CallLine as CallLineType } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { formatDuration } from '@/lib/utils';
import { OnAirTimer } from '@/components/OnAirTimer';
import { BookmarkPlus, Phone, PhoneOff, Pause, Mic, MicOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type CallLineProps = {
  line: CallLineType;
};

// Map call status to visual representation
const statusToDisplay = {
  'inactive': { 
    text: 'AVAILABLE', 
    color: 'bg-status-inactive', 
    animation: '',
    badgeColor: 'bg-gray-100 text-gray-500',
    iconPulse: false
  },
  'ringing': { 
    text: 'RINGING', 
    color: 'bg-status-ringing', 
    animation: 'animate-pulse',
    badgeColor: 'bg-status-ringing text-white',
    iconPulse: true
  },
  'active': { 
    text: 'ACTIVE', 
    color: 'bg-status-active', 
    animation: '',
    badgeColor: 'bg-status-active text-white',
    iconPulse: false
  },
  'holding': { 
    text: 'HOLDING', 
    color: 'bg-status-holding', 
    animation: '',
    badgeColor: 'bg-status-holding text-white',
    iconPulse: false
  },
  'on-air': { 
    text: 'ON AIR', 
    color: 'bg-status-onair', 
    animation: 'animate-on-air-blink',
    badgeColor: 'bg-status-onair text-white animate-on-air-blink',
    iconPulse: true
  }
};

export default function CallLine({ line }: CallLineProps) {
  const { t } = useTranslation();
  const { 
    makeCall, 
    hangupCall, 
    holdCall, 
    sendToAir, 
    takeOffAir,
    setSelectedLine,
    selectedLine,
    saveToPhoneBook
  } = useVoIP();
  
  const { levels, getLevelsForLine } = useAudioLevels();
  const [duration, setDuration] = useState<string>('--:--');
  const [durationSec, setDurationSec] = useState<number>(0);
  const [onAirStartTime, setOnAirStartTime] = useState<Date | null>(null);
  const [onAirDuration, setOnAirDuration] = useState<string>('00:00');
  const [isBlinking, setIsBlinking] = useState<boolean>(true);
  const timerRef = useRef<number | null>(null);
  
  // Translated status display text
  const statusToDisplayTranslated = {
    'inactive': { 
      text: t('calls.available'), 
      color: 'bg-status-inactive', 
      animation: '',
      badgeColor: 'bg-gray-100 text-gray-500',
      iconPulse: false
    },
    'ringing': { 
      text: t('calls.ringing'), 
      color: 'bg-status-ringing', 
      animation: 'animate-pulse',
      badgeColor: 'bg-status-ringing text-white',
      iconPulse: true
    },
    'active': { 
      text: t('calls.active'), 
      color: 'bg-status-active', 
      animation: '',
      badgeColor: 'bg-status-active text-white',
      iconPulse: false
    },
    'holding': { 
      text: t('calls.holding'), 
      color: 'bg-status-holding', 
      animation: '',
      badgeColor: 'bg-status-holding text-white',
      iconPulse: false
    },
    'on-air': { 
      text: t('calls.onAir'), 
      color: 'bg-status-onair', 
      animation: 'animate-on-air-blink',
      badgeColor: 'bg-status-onair text-white animate-on-air-blink',
      iconPulse: true
    }
  };
  
  const isSelected = selectedLine?.id === line.id;
  // Use the translated status display
  const statusDisplay = statusToDisplayTranslated[line.status || 'inactive'];
  
  // Calculate input and output level in dB (approximation)
  const inputLevel = levels[line.id]?.input || 0;
  const outputLevel = levels[line.id]?.output || 0;
  
  const inputDb = inputLevel < 5 ? '-inf' : `-${Math.floor((100 - inputLevel) / 3)}dB`;
  const outputDb = outputLevel < 5 ? '-inf' : `-${Math.floor((100 - outputLevel) / 3)}dB`;
  
  useEffect(() => {
    if (line.status === 'active' || line.status === 'on-air' || line.status === 'holding') {
      const intervalId = setInterval(() => {
        if (line.startTime) {
          const now = new Date();
          const diff = Math.floor((now.getTime() - line.startTime.getTime()) / 1000);
          setDurationSec(diff);
          setDuration(formatDuration(diff));
        }
      }, 1000);
      
      return () => clearInterval(intervalId);
    } else {
      setDuration('--:--');
      setDurationSec(0);
    }
  }, [line.status, line.startTime]);
  
  // Specialized timer for on-air duration
  useEffect(() => {
    // When line goes on air, start the on-air timer
    if (line.status === 'on-air') {
      // Set the start time if not already set
      if (!onAirStartTime) {
        setOnAirStartTime(new Date());
      }
      
      // Set up an interval to update the on-air timer
      const intervalId = window.setInterval(() => {
        if (onAirStartTime) {
          const now = new Date();
          const diffSeconds = Math.floor((now.getTime() - onAirStartTime.getTime()) / 1000);
          setOnAirDuration(formatDuration(diffSeconds));
        }
      }, 1000);
      
      timerRef.current = intervalId;
      
      return () => {
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
        }
      };
    } else {
      // Reset the on-air timer when the line is no longer on air
      setOnAirStartTime(null);
      setOnAirDuration('00:00');
      
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [line.status, onAirStartTime]);
  
  // Effect for the blinking indicator
  useEffect(() => {
    let timerId: number;
    
    if (line.status === 'on-air') {
      timerId = window.setInterval(() => {
        setIsBlinking(prev => !prev);
      }, 500); // Blink every 500ms
    }
    
    return () => {
      if (timerId) {
        window.clearInterval(timerId);
      }
    };
  }, [line.status]);
  
  useEffect(() => {
    // Update audio levels
    const intervalId = setInterval(() => {
      if (line.status === 'active' || line.status === 'on-air') {
        // For active calls, simulate realistic audio level updates
        getLevelsForLine(line.id);
      } else if (line.status === 'holding') {
        // For holding calls, simulate minimal audio level updates
        getLevelsForLine(line.id, 'holding');
      }
    }, 200);
    
    return () => clearInterval(intervalId);
  }, [line.status, line.id, getLevelsForLine]);
  
  const handleLineClick = () => {
    setSelectedLine(line);
  };
  
  return (
    <div 
      className={`p-3 border-b border-neutral-200 hover:bg-neutral-100 cursor-pointer ${
        line.status === 'on-air' ? 'bg-red-50 border-l-4 border-l-red-500' : 
        isSelected ? 'bg-neutral-100' : 'bg-white'
      }`}
      onClick={handleLineClick}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <span className={`inline-block w-6 h-6 rounded-full ${statusDisplay.color} mr-2 ${statusDisplay.animation}`}></span>
          <div className="flex items-center">
            <div>
              <h3 className="font-bold text-gray-800">{t('calls.line')} {line.id}</h3>
              {line.status !== 'on-air' && (
                <div className={`text-xs px-2 py-0.5 rounded-full ${statusDisplay.badgeColor} inline-block mt-1 font-semibold`}>
                  {statusDisplay.text}
                </div>
              )}
            </div>
            
            {/* Move ON-AIR status right next to the line name to save vertical space */}
            {line.status === 'on-air' && (
              <div className="flex items-center ml-3">
                <div className={`text-xs px-2 py-1 rounded-full ${statusDisplay.badgeColor} inline-block font-bold flex items-center`}>
                  <span className="mr-1">{statusDisplay.text}</span>
                  <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse"></span>
                </div>
                <div className="text-sm ml-2 px-2 py-0.5 rounded-md bg-red-100 text-red-800 border border-status-onair font-bold">
                  {onAirDuration}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className={`text-sm px-3 py-1 rounded-full ${
          line.status === 'inactive' ? 'bg-neutral-100 text-gray-800' :
          line.status === 'on-air' ? 'bg-red-100 text-red-800 border border-status-onair font-bold' :
          line.status === 'active' ? 'bg-green-100 text-green-800 border border-status-active font-bold' :
          line.status === 'holding' ? 'bg-amber-100 text-amber-800 border border-status-holding font-bold' :
          'bg-neutral-100 text-gray-800'
        }`}>
          <span className="font-mono font-bold">{duration}</span>
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-2">
        <div className="font-medium text-gray-800">
          {line.contact?.name || (line.phoneNumber 
            ? `${t('calls.caller')}: ${line.phoneNumber}` 
            : <span className="text-gray-500">{t('calls.noCaller')}</span>)}
        </div>
        
        {/* Save to Phone Book button as a standalone prominent element */}
        {!line.contact && line.phoneNumber && line.status !== 'inactive' && (
          <Button 
            variant="default" 
            size="sm" 
            className="h-7 px-3 bg-orange-500 text-white hover:bg-orange-600 font-bold"
            onClick={(e) => {
              e.stopPropagation();
              saveToPhoneBook(line.id);
            }}
            title={t('calls.saveToPhoneBook')}
          >
            <BookmarkPlus className="w-4 h-4 mr-1" />
            {t('common.save')}
          </Button>
        )}
        <div className="flex space-x-1">
          {line.status === 'inactive' ? (
            <Button 
              variant="default" 
              size="sm" 
              className="h-6 bg-status-active text-white hover:bg-green-700"
              onClick={(e) => {
                e.stopPropagation();
                makeCall(line.id);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-3 h-3"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </Button>
          ) : (
            <>
              <Button 
                variant="destructive" 
                size="sm" 
                className="h-6 bg-red-600 hover:bg-red-700 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  hangupCall(line.id);
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-3 h-3"
                >
                  <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
                  <line x1="2" y1="2" x2="22" y2="22" />
                </svg>
              </Button>
              
              {line.status === 'holding' ? (
                <Button 
                  variant="default" 
                  size="sm" 
                  className="h-6 bg-status-onair text-white hover:bg-red-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    sendToAir(line.id);
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-3 h-3"
                  >
                    <path d="M12 10c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2s2 .9 2 2v4c0 1.1-.9 2-2 2z" />
                    <path d="M12 22c-4.97 0-9-4.03-9-9 0-4.632 3.501-8.442 8-8.941v3.942c-2.206.462-4 2.481-4 4.999a5 5 0 0 0 10 0c0-2.518-1.794-4.537-4-4.999V4.059c4.499.499 8 4.309 8 8.941 0 4.97-4.03 9-9 9z" />
                  </svg>
                </Button>
              ) : line.status === 'on-air' ? (
                <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-6 border-status-onair text-status-onair hover:bg-red-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    takeOffAir(line.id);
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-3 h-3"
                  >
                    <path d="M12 10c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2s2 .9 2 2v4c0 1.1-.9 2-2 2z" />
                    <path d="M19 12a7 7 0 1 1-14 0" />
                    <line x1="2" y1="2" x2="22" y2="22" />
                  </svg>
                </Button>
                

                </>
              ) : (
                <>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="h-6 bg-status-holding text-white hover:bg-amber-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    holdCall(line.id);
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-3 h-3"
                  >
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                </Button>
                

                </>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* ON-AIR TIMER - Only shown when line is on air */}
      {line.status === 'on-air' && (
        <div className="my-2">
          <div style={{
            backgroundColor: 'red',
            color: 'white',
            fontSize: '24px',
            fontWeight: 'bold',
            textAlign: 'center',
            padding: '12px',
            margin: '8px 0',
            borderRadius: '8px',
            border: '4px solid darkred',
            boxShadow: '0 0 15px rgba(255, 0, 0, 0.8)'
          }}>
            {t('calls.onAir')}: {duration}
          </div>
        </div>
      )}

      {/* Horizontal compact audio level meters */}
      <div className="flex justify-between items-center gap-3 mt-2">
        {/* Input level */}
        <div className="flex items-center gap-1 flex-1">
          <span className="text-[10px] font-medium min-w-[24px] text-gray-700">{t('audio.inputLevel').substring(0, 2)}</span>
          <div className="flex-1 h-1.5 bg-neutral-100 rounded-sm overflow-hidden">
            <div 
              className={`h-full transition-all duration-100 ${
                line.status === 'active' ? 'bg-status-active' : 
                line.status === 'on-air' ? 'bg-status-onair' : 
                line.status === 'holding' ? 'bg-status-holding' : 
                line.status === 'ringing' ? 'bg-status-ringing' : 
                'bg-status-inactive'
              }`}
              style={{ width: `${inputLevel}%` }}
            ></div>
          </div>
          <span className="text-[10px] font-mono font-semibold text-gray-700 min-w-[32px] text-right">{inputDb}</span>
        </div>

        {/* Output level */}
        <div className="flex items-center gap-1 flex-1">
          <span className="text-[10px] font-medium min-w-[24px] text-gray-700">{t('audio.outputLevel').substring(0, 3)}</span>
          <div className="flex-1 h-1.5 bg-neutral-100 rounded-sm overflow-hidden">
            <div 
              className={`h-full transition-all duration-100 ${
                line.status === 'active' ? 'bg-status-active' : 
                line.status === 'on-air' ? 'bg-status-onair' : 
                line.status === 'holding' ? 'bg-status-holding' : 
                line.status === 'ringing' ? 'bg-status-ringing' : 
                'bg-status-inactive'
              }`}
              style={{ width: `${outputLevel}%` }}
            ></div>
          </div>
          <span className="text-[10px] font-mono font-semibold text-gray-700 min-w-[32px] text-right">{outputDb}</span>
        </div>
      </div>
    </div>
  );
}

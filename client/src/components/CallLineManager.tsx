import React, { useState, useEffect } from 'react';
import { CallLine } from '@shared/schema';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  Phone, PhoneCall, PhoneOff, Radio, PauseCircle, FileText, Save, Clock, UserPlus
} from 'lucide-react';
import { useVoIP } from '@/contexts/VoIPContext';
import { useLineCount } from '@/contexts/LineCountContext';

type CallLineManagerProps = {
  callLine: CallLine;
  onHold: () => void;
  onHangup: () => void;
  onAir: () => void;
  onNotesChange: (notes: string) => void;
  onCallerNameChange: (name: string) => void;
  onUpdateInfo: () => void;
  currentNotes: string;
  currentCallerName: string;
  isSelected: boolean;
  onSelectLine: () => void;
  setShowDialPad: React.Dispatch<React.SetStateAction<boolean>>;
  setDialPadTab: React.Dispatch<React.SetStateAction<string>>;
};

// Helper function to format seconds into MM:SS format
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default function CallLineManager({
  callLine,
  onHold,
  onHangup,
  onAir,
  onNotesChange,
  onCallerNameChange,
  onUpdateInfo,
  currentNotes,
  currentCallerName,
  isSelected,
  onSelectLine,
  setShowDialPad,
  setDialPadTab
}: CallLineManagerProps) {
  const { id, status, phoneNumber, studio, startTime } = callLine;
  const { saveToPhoneBook } = useVoIP();
  
  // Dial functionality now handled by global dial button
  
  // Add state for duration tracking 
  const [duration, setDuration] = useState('00:00');
  
  // Duration timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (startTime && (status === 'active' || status === 'on-air' || status === 'holding')) {
      // Initialize duration immediately
      const calcDuration = () => {
        const callStartTime = new Date(startTime);
        const elapsedSeconds = Math.floor((new Date().getTime() - callStartTime.getTime()) / 1000);
        setDuration(formatDuration(elapsedSeconds));
      };
      
      // Calculate now and then every second
      calcDuration();
      timer = setInterval(calcDuration, 1000);
    } else {
      setDuration('00:00');
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [startTime, status]);
  
  const studioColor = 
    studio === 'A' ? 'orange' : 
    studio === 'B' ? 'green' : 
    studio === 'C' ? 'blue' : 
    'purple';
  
  const getStatusColor = () => {
    switch (status) {
      case 'active': return 'bg-blue-500';
      case 'ringing': return 'bg-yellow-500 animate-pulse';
      case 'holding': return 'bg-purple-500';
      case 'on-air': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'active': return 'Active';
      case 'ringing': return 'Ringing';
      case 'holding': return 'On Hold';
      case 'on-air': return 'On Air';
      default: return 'Inactive';
    }
  };
  
  const getStatusClass = () => {
    switch (status) {
      case 'active': return 'text-blue-300';
      case 'ringing': return 'text-yellow-300 animate-pulse';
      case 'holding': return 'text-purple-300';
      case 'on-air': return 'text-red-300 font-semibold';
      default: return 'text-zinc-400';
    }
  };

  return (
    <Card 
      className={`${isSelected ? `border-${studioColor}-500 shadow-${studioColor}-500/30 shadow-lg` : 'border-zinc-700'} 
              bg-zinc-900 p-2 transition-all text-xs rounded-xl`}
      onClick={onSelectLine}
      style={{
        background: `linear-gradient(145deg, #212230, #1a1a24)`,
        boxShadow: isSelected 
          ? `inset 0 1px 1px rgba(255, 255, 255, 0.1), 
             0 8px 16px rgba(0, 0, 0, 0.4), 
             0 0 0 1px ${
               studio === 'A' ? 'rgba(255, 140, 0, 0.4)' : 
               studio === 'B' ? 'rgba(0, 160, 0, 0.4)' :
               studio === 'C' ? 'rgba(45, 114, 211, 0.4)' :
               'rgba(125, 45, 141, 0.4)'
             }`
          : `inset 0 1px 1px rgba(255, 255, 255, 0.05), 
             0 4px 8px rgba(0, 0, 0, 0.3)`
      }}
    >
      <div className="flex flex-col">
        {/* Header with line info & status - Enhanced with beveled edge */}
        <div 
          className="flex items-center justify-between mb-2 p-1.5 rounded-lg"
          style={{
            background: 'linear-gradient(145deg, #2a2a38, #1f1f2c)',
            boxShadow: `inset 0px 1px 2px rgba(255, 255, 255, 0.05), 
                       inset 0px -1px 2px rgba(0, 0, 0, 0.2)`
          }}
        >
          <div className="flex items-center">
            <div 
              className={`h-3 w-3 rounded-full ${getStatusColor()} mr-2 relative`}
              style={{
                boxShadow: `0 0 8px ${status === 'on-air' ? 'rgba(255, 0, 0, 0.6)' : 
                             status === 'holding' ? 'rgba(168, 85, 247, 0.6)' : 
                             status === 'active' ? 'rgba(59, 130, 246, 0.6)' : 
                             status === 'ringing' ? 'rgba(234, 179, 8, 0.6)' : 'transparent'}`
              }}
            >
              {(status === 'ringing' || status === 'on-air') && (
                <div className="absolute inset-0 rounded-full animate-ping bg-current opacity-75 z-10"></div>
              )}
            </div>
            <span className="text-zinc-100 text-xs font-medium">Line {id}</span>
            <span className="text-zinc-400 text-xs ml-1.5">
              {status !== 'inactive' && phoneNumber && `(${phoneNumber})`}
            </span>
          </div>
          
          {/* Call status indicator - Enhanced with 3D pill */}
          <div 
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusClass()}`}
            style={{
              background: status === 'on-air' ? 'linear-gradient(145deg, #c11d1d, #e52222)' :
                          status === 'holding' ? 'linear-gradient(145deg, #8831c5, #9d38e6)' :
                          status === 'active' ? 'linear-gradient(145deg, #1e56b1, #246fe5)' :
                          status === 'ringing' ? 'linear-gradient(145deg, #c99400, #e9ae00)' :
                          'linear-gradient(145deg, #41414d, #36363f)',
              boxShadow: `inset 0 1px 1px rgba(255, 255, 255, 0.15), 
                         0 1px 2px rgba(0, 0, 0, 0.3)`,
              textShadow: '0 1px 1px rgba(0, 0, 0, 0.5)'
            }}
          >
            {getStatusText()}
          </div>
        </div>
        
        {/* Call duration & On Air status - Larger and more prominent with 3D effect */}
        <div 
          className="flex items-center justify-between mb-3 p-2 rounded-lg relative overflow-hidden" 
          style={{
            background: 'linear-gradient(145deg, #23232f, #1d1d28)',
            boxShadow: `inset 0 1px 3px rgba(0, 0, 0, 0.3), 
                       0 1px 1px rgba(255, 255, 255, 0.05)`
          }}
        >
          {/* Background glow effect for on-air */}
          {status === 'on-air' && (
            <div 
              className="absolute inset-0 opacity-30" 
              style={{
                background: 'radial-gradient(circle at center, rgba(220, 38, 38, 0.4) 0%, rgba(220, 38, 38, 0.1) 50%, transparent 70%)'
              }}
            ></div>
          )}
          
          {/* Call duration - bigger font with 3D effect */}
          <div className="flex items-center">
            <Clock 
              className="h-5 w-5 mr-2" 
              style={{
                filter: 'drop-shadow(0 1px 1px rgba(0, 0, 0, 0.5))',
                color: status === 'on-air' ? '#f87171' : 
                        status === 'holding' ? '#c084fc' : 
                        status === 'active' ? '#93c5fd' : 
                        '#6b7280'
              }}
            />
            <span 
              className="text-lg font-mono font-bold tracking-wider"
              style={{
                color: status === 'on-air' ? '#f87171' : 
                        status === 'holding' ? '#c084fc' : 
                        status === 'active' ? '#93c5fd' : 
                        '#9ca3af',
                textShadow: '0 2px 2px rgba(0, 0, 0, 0.6)'
              }}
            >
              {duration}
            </span>
          </div>
          
          {/* On Air indicator - with 3D button appearance */}
          {status === 'on-air' ? (
            <div 
              className="text-white text-sm font-bold px-3 py-1.5 rounded-lg flex items-center"
              style={{
                background: 'linear-gradient(145deg, #dc2626, #b91c1c)',
                boxShadow: `0 2px 10px rgba(220, 38, 38, 0.5), 
                          inset 0 1px 1px rgba(255, 255, 255, 0.3)`,
                textShadow: '0 1px 1px rgba(0, 0, 0, 0.5)'
              }}
            >
              <Radio className="h-4 w-4 mr-1.5 animate-pulse" />
              ON AIR
            </div>
          ) : (
            <div 
              className="text-zinc-400 text-sm font-medium px-3 py-1.5 rounded-lg flex items-center opacity-70"
              style={{
                background: 'linear-gradient(145deg, #2a2a38, #24242f)',
                boxShadow: `inset 0 1px 2px rgba(0, 0, 0, 0.4),
                          0 1px 1px rgba(255, 255, 255, 0.05)`
              }}
            >
              <Radio className="h-4 w-4 mr-1.5" />
              OFF AIR
            </div>
          )}
        </div>
        
        {/* Audio levels - Enhanced with 3D effect and glow */}
        <div className="flex flex-col gap-2 mb-3 p-2 rounded-lg bg-zinc-900/50" style={{
          boxShadow: `inset 0 2px 4px rgba(0, 0, 0, 0.4)`
        }}>
          <div className="flex items-center justify-between">
            <div className="flex-1 relative h-3 rounded-full overflow-hidden" style={{
              background: 'linear-gradient(145deg, #1a1a24, #212130)',
              boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.5)'
            }}>
              {status !== 'inactive' ? (
                <div 
                  className={`h-3 relative`}
                  style={{ 
                    width: `${callLine.levels?.input || 0}%`,
                    background: status === 'on-air' 
                      ? 'linear-gradient(90deg, #dc2626, #ef4444)' 
                      : status === 'active' 
                      ? 'linear-gradient(90deg, #2563eb, #3b82f6)' 
                      : 'linear-gradient(90deg, #8b5cf6, #a855f7)',
                    boxShadow: status === 'on-air' 
                      ? '0 0 10px rgba(239, 68, 68, 0.5)' 
                      : status === 'active' 
                      ? '0 0 10px rgba(59, 130, 246, 0.5)' 
                      : '0 0 10px rgba(168, 85, 247, 0.5)'
                  }}
                >
                  <div className="absolute top-0 left-0 right-0 h-full opacity-50" style={{
                    background: 'linear-gradient(0deg, transparent, rgba(255, 255, 255, 0.3))'
                  }}></div>
                </div>
              ) : (
                <div className="h-3" style={{ width: '0%' }}></div>
              )}
            </div>
            <span className="text-[10px] text-zinc-400 ml-2 font-semibold">
              IN
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex-1 relative h-3 rounded-full overflow-hidden" style={{
              background: 'linear-gradient(145deg, #1a1a24, #212130)',
              boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.5)'
            }}>
              {status !== 'inactive' ? (
                <div 
                  className={`h-3 relative`}
                  style={{ 
                    width: `${callLine.levels?.output || 0}%`,
                    background: status === 'on-air' 
                      ? 'linear-gradient(90deg, #dc2626, #ef4444)' 
                      : status === 'active' 
                      ? 'linear-gradient(90deg, #2563eb, #3b82f6)' 
                      : 'linear-gradient(90deg, #8b5cf6, #a855f7)',
                    boxShadow: status === 'on-air' 
                      ? '0 0 10px rgba(239, 68, 68, 0.5)' 
                      : status === 'active' 
                      ? '0 0 10px rgba(59, 130, 246, 0.5)' 
                      : '0 0 10px rgba(168, 85, 247, 0.5)'
                  }}
                >
                  <div className="absolute top-0 left-0 right-0 h-full opacity-50" style={{
                    background: 'linear-gradient(0deg, transparent, rgba(255, 255, 255, 0.3))'
                  }}></div>
                </div>
              ) : (
                <div className="h-3" style={{ width: '0%' }}></div>
              )}
            </div>
            <span className="text-[10px] text-zinc-400 ml-2 font-semibold">
              OUT
            </span>
          </div>
        </div>
        
        {/* Caller name input field with Add to Phone Book button - 3D effect */}
        <div className="flex flex-col gap-2 mb-3 w-full">
          <div className="flex gap-2 w-full">
            <Input 
              placeholder="Caller name..."
              className="h-8 text-xs bg-zinc-800 border-zinc-700 w-full"
              value={currentCallerName}
              onChange={(e) => onCallerNameChange(e.target.value)}
              style={{
                boxShadow: `inset 0 2px 4px rgba(0, 0, 0, 0.3)`,
                background: 'linear-gradient(180deg, #1f1f2c, #26263a)'
              }}
            />
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs text-white"
              onClick={() => {
                if (phoneNumber) {
                  saveToPhoneBook(id, currentCallerName);
                }
              }}
              disabled={!phoneNumber}
              style={{
                background: 
                  studio === 'A' ? 'linear-gradient(145deg, #d27d2d, #b36925)' : 
                  studio === 'B' ? 'linear-gradient(145deg, #2d8d27, #267521)' :
                  studio === 'C' ? 'linear-gradient(145deg, #2d72d3, #2659b3)' :
                  'linear-gradient(145deg, #7d2d8d, #6a2678)',
                boxShadow: `inset 0 1px 1px rgba(255, 255, 255, 0.3), 
                          0 2px 4px rgba(0, 0, 0, 0.3)`,
                borderColor: 
                  studio === 'A' ? '#b36925' : 
                  studio === 'B' ? '#267521' :
                  studio === 'C' ? '#2659b3' :
                  '#6a2678',
                textShadow: '0 1px 1px rgba(0, 0, 0, 0.5)'
              }}
            >
              <UserPlus className="h-3 w-3 mr-1" />
              Save
            </Button>
          </div>
        </div>
        
        {/* Call notes text area - 3D effect */}
        <div className="flex gap-1.5 mb-3 w-full">
          <Textarea 
            placeholder="Notes..."
            className="h-16 min-h-16 text-xs bg-zinc-800 border-zinc-700 w-full"
            value={currentNotes}
            onChange={(e) => onNotesChange(e.target.value)}
            style={{
              boxShadow: `inset 0 2px 4px rgba(0, 0, 0, 0.3)`,
              background: 'linear-gradient(180deg, #1f1f2c, #26263a)'
            }}
          />
        </div>
        
        {/* Action buttons - Stacked for narrow column layout with 3D buttons */}
        <div className="flex flex-col gap-2">
          {/* Top row - Call control buttons */}
          <div className="flex gap-2 justify-center w-full">
            {status === 'inactive' ? (
              // No controls for inactive lines
              <div></div>
            ) : (
              <>
                {status !== 'holding' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 flex-1 text-xs text-white"
                    onClick={onHold}
                    style={{
                      background: 'linear-gradient(145deg, #a855f7, #8b5cf6)',
                      boxShadow: `inset 0 1px 1px rgba(255, 255, 255, 0.3), 
                                0 2px 4px rgba(0, 0, 0, 0.3)`,
                      borderColor: '#8b5cf6',
                      textShadow: '0 1px 1px rgba(0, 0, 0, 0.5)'
                    }}
                  >
                    <PauseCircle className="h-3 w-3 mr-1" />
                    Hold
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 flex-1 text-xs text-white"
                    onClick={onHold}
                    style={{
                      background: 'linear-gradient(145deg, #3b82f6, #2563eb)',
                      boxShadow: `inset 0 1px 1px rgba(255, 255, 255, 0.3), 
                                0 2px 4px rgba(0, 0, 0, 0.3)`,
                      borderColor: '#2563eb',
                      textShadow: '0 1px 1px rgba(0, 0, 0, 0.5)'
                    }}
                  >
                    <PhoneCall className="h-3 w-3 mr-1" />
                    Resume
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 flex-1 text-xs text-white"
                  onClick={onHangup}
                  style={{
                    background: 'linear-gradient(145deg, #dc2626, #b91c1c)',
                    boxShadow: `inset 0 1px 1px rgba(255, 255, 255, 0.3), 
                              0 2px 4px rgba(0, 0, 0, 0.3)`,
                    borderColor: '#b91c1c',
                    textShadow: '0 1px 1px rgba(0, 0, 0, 0.5)'
                  }}
                >
                  <PhoneOff className="h-3 w-3 mr-1" />
                  Hangup
                </Button>
              </>
            )}
          </div>
          
          {/* Bottom row - Update & On Air buttons only */}
          <div className="flex gap-2 justify-center w-full">
            <Button
              variant="outline"
              size="sm"
              className="h-8 flex-1 text-xs text-white"
              onClick={onUpdateInfo}
              style={{
                background: 'linear-gradient(145deg, #4f4f6b, #3a3a50)',
                boxShadow: `inset 0 1px 1px rgba(255, 255, 255, 0.2), 
                          0 2px 4px rgba(0, 0, 0, 0.3)`,
                borderColor: '#3a3a50',
                textShadow: '0 1px 1px rgba(0, 0, 0, 0.5)'
              }}
            >
              <Save className="h-3 w-3 mr-1" />
              Update
            </Button>
            
            {/* On Air button (only shown if call is active) */}
            {status !== 'inactive' ? (
              <Button
                variant={status === 'on-air' ? 'destructive' : 'outline'}
                size="sm"
                className={`h-8 flex-1 text-xs text-white`}
                onClick={onAir}
                style={{
                  background: status === 'on-air' 
                    ? 'linear-gradient(145deg, #b91c1c, #dc2626)' 
                    : 'linear-gradient(145deg, #7d1a1a, #991f1f)',
                  boxShadow: status === 'on-air'
                    ? `0 0 15px rgba(220, 38, 38, 0.5), 
                       inset 0 1px 1px rgba(255, 255, 255, 0.3)`
                    : `inset 0 1px 1px rgba(255, 255, 255, 0.2), 
                       0 2px 4px rgba(0, 0, 0, 0.3)`,
                  borderColor: status === 'on-air' ? '#b91c1c' : '#7d1a1a',
                  textShadow: '0 1px 1px rgba(0, 0, 0, 0.5)'
                }}
              >
                <Radio className={`h-3 w-3 mr-1 ${status === 'on-air' ? 'animate-pulse' : ''}`} />
                {status === 'on-air' ? 'On Air' : 'Air'}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-8 flex-1 text-xs text-zinc-500"
                disabled
                style={{
                  background: 'linear-gradient(145deg, #2a2a38, #24242f)',
                  boxShadow: `inset 0 1px 2px rgba(0, 0, 0, 0.2)`,
                  borderColor: '#24242f',
                  opacity: 0.5
                }}
              >
                <Radio className="h-3 w-3 mr-1" />
                Air
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
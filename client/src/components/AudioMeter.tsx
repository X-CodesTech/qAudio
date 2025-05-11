import { useEffect, useState } from 'react';
import { useVoIP } from '@/contexts/VoIPContext';
import { useAudioLevels } from '@/hooks/useAudioLevels';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type AudioMeterProps = {
  lineId: number;
  showLabel?: boolean;
  height?: number;
};

export default function AudioMeter({ lineId, showLabel = true, height = 14 }: AudioMeterProps) {
  const { callLines } = useVoIP();
  const { levels, getLevelsForLine } = useAudioLevels();
  const [inputLevel, setInputLevel] = useState(0);
  const [outputLevel, setOutputLevel] = useState(0);
  
  const callLine = callLines.find(line => line.id === lineId);
  const isActive = callLine?.status === 'active' || callLine?.status === 'on-air';
  const isHolding = callLine?.status === 'holding';
  
  // Update audio levels regularly
  useEffect(() => {
    if (!isActive && !isHolding) {
      setInputLevel(0);
      setOutputLevel(0);
      return;
    }
    
    const mode = isActive ? 'active' : 'holding';
    
    const intervalId = setInterval(() => {
      const newLevels = getLevelsForLine(lineId, mode);
      if (newLevels) {
        setInputLevel(newLevels.input);
        setOutputLevel(newLevels.output);
      }
    }, 100);
    
    return () => clearInterval(intervalId);
  }, [lineId, isActive, isHolding, getLevelsForLine]);
  
  const getColorClass = (level: number) => {
    // Color is based on level and status
    if (callLine?.status === 'on-air') {
      // On-air status - use red colors when on-air
      if (level > 80) return 'bg-red-700';
      if (level > 65) return 'bg-status-onair';
      return 'bg-red-400';
    } else if (callLine?.status === 'active') {
      // Active status - use green colors when active
      if (level > 80) return 'bg-green-700';
      if (level > 65) return 'bg-status-active';
      return 'bg-green-400';
    } else if (callLine?.status === 'holding') {
      // Holding status - use amber colors when on hold
      if (level > 80) return 'bg-amber-700';
      if (level > 65) return 'bg-status-holding';
      return 'bg-amber-400';
    }
    
    // Default color scheme for other statuses
    if (level > 80) return 'bg-red-500';
    if (level > 65) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  if (!isActive && !isHolding) {
    return null;
  }
  
  // Determine color classes based on call status
  const getStatusClass = () => {
    switch (callLine?.status) {
      case 'on-air': return 'text-status-onair';
      case 'active': return 'text-status-active';
      case 'holding': return 'text-status-holding';
      default: return 'text-muted-foreground';
    }
  };

  // Segment the meter into multiple sections for a more professional look
  const renderSegments = (level: number, type: 'input' | 'output') => {
    const segments = [];
    const segmentCount = 10; // Reduce to 10 segments for a more compact display
    const segmentWidth = 100 / segmentCount;
    
    for (let i = 0; i < segmentCount; i++) {
      const isActive = i * segmentWidth <= level;
      const segmentLevel = i / segmentCount * 100;
      let colorClass = '';
      
      if (isActive) {
        colorClass = getColorClass(segmentLevel);
      } else {
        colorClass = 'bg-zinc-800 dark:bg-zinc-800'; // darker background for inactive segments
      }
      
      segments.push(
        <div 
          key={`${type}-${i}`}
          className={`h-2 w-1.5 rounded-[1px] transition-all duration-50 mx-px ${colorClass}`}
        ></div>
      );
    }
    
    return segments;
  };

  return (
    <div className="flex flex-col space-y-1">
      {showLabel && (
        <div className={`text-xs font-medium ${getStatusClass()}`}>
          Line {lineId} Audio
          <span className="text-[10px] ml-1">
            {callLine?.status === 'on-air' ? '(ON AIR)' : 
             callLine?.status === 'holding' ? '(ON HOLD)' : ''}
          </span>
        </div>
      )}
      <div className="flex justify-between items-center gap-2">
        {/* Horizontal compact layout */}
        <div className="flex items-center gap-1">
          <span className={`text-[10px] font-medium min-w-[28px] ${getStatusClass()}`}>IN</span>
          <div className="flex items-center" style={{ height: `${height / 2}px` }}>
            {renderSegments(inputLevel, 'input')}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <span className={`text-[10px] font-medium min-w-[28px] ${getStatusClass()}`}>OUT</span>
          <div className="flex items-center" style={{ height: `${height / 2}px` }}>
            {renderSegments(outputLevel, 'output')}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AudioMetersPanel() {
  const { callLines } = useVoIP();
  const activeLines = callLines.filter(line => 
    line.status === 'active' || 
    line.status === 'on-air' || 
    line.status === 'holding'
  );
  
  if (activeLines.length === 0) {
    return (
      <Card className="bg-zinc-800 border-zinc-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Audio Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-zinc-400 py-2 text-xs">
            No active calls to monitor
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="bg-zinc-800 border-zinc-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Audio Levels</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {activeLines.map(line => (
          <div key={line.id} className="flex items-center justify-between border-b border-zinc-700 pb-2 last:border-b-0 last:pb-0">
            <div className="flex items-center gap-2">
              <div className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                line.status === 'on-air' ? 'bg-status-onair text-white' :
                line.status === 'active' ? 'bg-status-active text-white' :
                line.status === 'holding' ? 'bg-status-holding text-white' :
                'bg-zinc-700 text-zinc-300'
              }`}>
                L{line.id}
              </div>
              <div className={`text-[10px] ${
                line.status === 'on-air' ? 'text-status-onair' :
                line.status === 'active' ? 'text-status-active' :
                line.status === 'holding' ? 'text-status-holding' :
                'text-zinc-400'
              }`}>
                {line.status === 'on-air' ? 'ON AIR' :
                 line.status === 'active' ? 'ACTIVE' :
                 line.status === 'holding' ? 'HOLDING' : 'INACTIVE'}
              </div>
            </div>
            <div className="flex-1 max-w-[140px]">
              <AudioMeter lineId={line.id} showLabel={false} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
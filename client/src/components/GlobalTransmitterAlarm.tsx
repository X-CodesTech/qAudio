import React, { useState, useEffect } from 'react';
import { AlertTriangle, Bell, BellRing, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type TransmitterAlarm = {
  id: number;
  siteName: string;
  status: 'critical' | 'warning';
};

const GlobalTransmitterAlarm: React.FC = () => {
  const [transmitterAlarms, setTransmitterAlarms] = useState<TransmitterAlarm[]>([]);
  const [currentAlarmIndex, setCurrentAlarmIndex] = useState(0);
  const [isAlarmChanging, setIsAlarmChanging] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  
  // Listen for custom event to toggle transmitter alarms
  useEffect(() => {
    const handleToggleAlarms = (e: CustomEvent) => {
      if (e.detail.alarmsActive) {
        // Add sample alarms when activated
        setTransmitterAlarms([
          { id: 2, siteName: "North Hill", status: 'warning' },
          { id: 6, siteName: "South Bay", status: 'critical' }
        ]);
        setDismissed(false);
      } else {
        // Clear alarms
        setTransmitterAlarms([]);
        setCurrentAlarmIndex(0);
      }
    };
    
    // Listen for updated transmitter alarms from TransmittersPage
    const handleTransmitterAlarmsUpdate = (e: CustomEvent) => {
      if (e.detail.alarmsActive) {
        // Update with real-time alarms from transmitters
        setTransmitterAlarms(e.detail.alarmData);
        setDismissed(false);
      } else {
        // Clear alarms if none are active
        setTransmitterAlarms([]);
        setCurrentAlarmIndex(0);
      }
    };
    
    // Add event listeners
    document.addEventListener('toggleTransmitterAlarms', handleToggleAlarms as EventListener);
    document.addEventListener('transmitterAlarmsUpdate', handleTransmitterAlarmsUpdate as EventListener);
    
    // Clean up the event listeners
    return () => {
      document.removeEventListener('toggleTransmitterAlarms', handleToggleAlarms as EventListener);
      document.removeEventListener('transmitterAlarmsUpdate', handleTransmitterAlarmsUpdate as EventListener);
    };
  }, []);
  
  // Effect for cycling through multiple transmitter alarms every 5 seconds
  useEffect(() => {
    if (transmitterAlarms.length <= 1) return;
    
    const intervalId = setInterval(() => {
      // Start the transition animation
      setIsAlarmChanging(true);
      
      // After a short delay, change the alarm index
      setTimeout(() => {
        setCurrentAlarmIndex(prevIndex => 
          prevIndex >= transmitterAlarms.length - 1 ? 0 : prevIndex + 1
        );
        
        // Reset the animation state
        setTimeout(() => {
          setIsAlarmChanging(false);
        }, 300);
      }, 300);
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, [transmitterAlarms.length]);
  
  // If no alarms or dismissed, don't render anything
  if (transmitterAlarms.length === 0 || dismissed) {
    return null;
  }
  
  const currentAlarm = transmitterAlarms[currentAlarmIndex];
  const isCritical = currentAlarm?.status === 'critical';
  
  return (
    <div className="transmitter-alarm-banner">
      <div 
        className={`py-3 px-4 ${
          isCritical 
            ? 'animate-critical-blink' 
            : 'animate-warning-blink'
        }`}
        style={{ 
          backdropFilter: 'blur(4px)',
          boxShadow: `0 4px 20px rgba(${isCritical ? '220, 38, 38' : '217, 119, 6'}, 0.5)`,
        }}
      >
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-black/30 p-2 rounded-full">
              <AlertTriangle className={`h-8 w-8 text-white ${isCritical ? 'animate-pulse' : ''}`} />
            </div>
            <div className="flex flex-col">
              <span className="text-white text-xl font-bold tracking-wide" style={{ textShadow: '0 0 8px rgba(255,255,255,0.5)' }}>
                TRANSMITTER ALARM
              </span>
              <div className="flex items-center">
                <span className={`text-white font-medium text-base py-0.5 px-2 rounded ${isCritical ? 'bg-red-800/60' : 'bg-amber-700/60'}`}>
                  {currentAlarm?.siteName}
                </span>
                <span className="mx-2 text-white/90">-</span>
                <span className={`text-white font-bold text-base py-0.5 px-2 rounded ${
                  isCritical ? 'bg-red-900/80 animate-pulse' : 'bg-amber-800/80'
                }`}>
                  {currentAlarm?.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {transmitterAlarms.length > 1 && (
              <div className="bg-black/40 text-white px-3 py-1.5 rounded-full font-medium flex items-center">
                <span className="mr-1">Alarm</span>
                <span className="bg-white/20 w-6 h-6 rounded-full flex items-center justify-center text-sm">
                  {currentAlarmIndex + 1}
                </span>
                <span className="mx-1">of</span>
                <span className="bg-white/20 w-6 h-6 rounded-full flex items-center justify-center text-sm">
                  {transmitterAlarms.length}
                </span>
              </div>
            )}
            
            <Button 
              variant={isCritical ? "destructive" : "default"}
              size="sm" 
              className={`h-9 ${
                isCritical
                  ? 'bg-red-700 hover:bg-red-800 text-white border-white/50 px-4'
                  : 'bg-amber-600 hover:bg-amber-700 text-white border-white/30 px-4'
              }`}
              onClick={() => setDismissed(true)}
            >
              <X className="h-5 w-5 mr-2" />
              <span className="font-medium">Dismiss</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalTransmitterAlarm;
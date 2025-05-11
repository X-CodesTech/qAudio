import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { X, Minus, Calendar, Clock, File, Play, Pause, Radio, MessageSquare, Thermometer, Droplets } from 'lucide-react';
import { addDays, format } from 'date-fns';

interface ScheduleDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ScheduleDialog: React.FC<ScheduleDialogProps> = ({ isOpen, onClose }) => {
  // States for form controls
  const [periodicity, setPeriodicity] = useState<string>('daily');
  const [startDate, setStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState<string>(format(new Date(), 'HH:mm:ss'));
  const [hasExpiration, setHasExpiration] = useState<boolean>(false);
  const [expirationDate, setExpirationDate] = useState<string>(format(addDays(new Date(), 7), 'yyyy-MM-dd'));
  const [expirationTime, setExpirationTime] = useState<string>(format(new Date(), 'HH:mm:ss'));
  const [isImmediate, setIsImmediate] = useState<boolean>(false);
  const [maxWait, setMaxWait] = useState<boolean>(false);
  const [maxWaitMinutes, setMaxWaitMinutes] = useState<number>(5);
  const [priority, setPriority] = useState<string>('low');
  const [eventType, setEventType] = useState<string>('file');
  const [filePath, setFilePath] = useState<string>('');
  const [eventDuration, setEventDuration] = useState<string>('00:00:00');
  
  // Days of the week
  const [selectedDays, setSelectedDays] = useState<Record<string, boolean>>({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: true,
    sunday: true
  });

  // Dialog position
  const [dialogPosition, setDialogPosition] = useState({ x: 50, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dialogRef = useRef<HTMLDivElement>(null);

  // Start drag
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dialogRef.current) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - dialogRef.current.getBoundingClientRect().left,
        y: e.clientY - dialogRef.current.getBoundingClientRect().top
      });
    }
  };

  // End drag
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Dragging
  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setDialogPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  };

  // Add mouse move event listener
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Handle day selection
  const toggleDay = (day: string) => {
    setSelectedDays(prev => ({
      ...prev,
      [day]: !prev[day]
    }));
  };

  // Select all days
  const selectAllDays = () => {
    setSelectedDays({
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true
    });
  };

  // Clear all days
  const clearAllDays = () => {
    setSelectedDays({
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false
    });
  };

  // Handle OK button click
  const handleSubmit = () => {
    // Collect all form data
    const scheduleData = {
      periodicity,
      startDate,
      startTime,
      hasExpiration,
      expirationDate,
      expirationTime,
      isImmediate,
      maxWait,
      maxWaitMinutes,
      priority,
      eventType,
      filePath,
      eventDuration,
      selectedDays
    };
    
    console.log('Schedule created:', scheduleData);
    // Here you would typically send this data to your backend
    
    // Close the dialog
    onClose();
  };

  // If dialog is not open, don't render anything
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-transparent flex items-start justify-start z-50 pointer-events-none"
      aria-hidden={!isOpen}
    >
      <div 
        ref={dialogRef}
        style={{ 
          position: 'absolute',
          left: `${dialogPosition.x}px`, 
          top: `${dialogPosition.y}px`,
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
        }}
        className="bg-card rounded-md border w-[650px] pointer-events-auto"
      >
        {/* Custom dialog header with drag handle */}
        <div 
          className="flex items-center justify-between p-4 border-b cursor-move"
          onMouseDown={handleMouseDown}
        >
          <h2 className="text-lg font-semibold">Schedule Event</h2>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Dialog content */}
        <div className="p-4 overflow-auto max-h-[80vh]">
          <div className="grid grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-4">
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-3">Periodicity</h3>
                <RadioGroup value={periodicity} onValueChange={setPeriodicity} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="daily" id="daily" />
                    <Label htmlFor="daily">Once a day</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hourly" id="hourly" />
                    <Label htmlFor="hourly">Play every hour</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="custom" />
                    <Label htmlFor="custom">Other hours...</Label>
                  </div>
                </RadioGroup>
                
                <div className="mt-3 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="immediate" 
                      checked={isImmediate}
                      onCheckedChange={(checked) => setIsImmediate(!!checked)}
                    />
                    <Label htmlFor="immediate">Immediate</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="maxWait" 
                      checked={maxWait}
                      onCheckedChange={(checked) => setMaxWait(!!checked)}
                    />
                    <Label htmlFor="maxWait">Maximum wait</Label>
                    <Input 
                      type="number" 
                      min="1" 
                      max="120"
                      value={maxWaitMinutes}
                      onChange={(e) => setMaxWaitMinutes(parseInt(e.target.value))}
                      className="w-16 h-8"
                      disabled={!maxWait}
                    />
                    <span className="text-sm">minutes</span>
                  </div>
                </div>
              </div>
              
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-3">Event type</h3>
                <RadioGroup value={eventType} onValueChange={setEventType} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="file" id="file" />
                    <Label htmlFor="file" className="flex items-center">
                      <File className="h-4 w-4 mr-2" />
                      File:
                    </Label>
                    <div className="flex-1 flex space-x-1">
                      <Input 
                        value={filePath}
                        onChange={(e) => setFilePath(e.target.value)}
                        className="flex-1"
                        disabled={eventType !== 'file'}
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={eventType !== 'file'}
                      >
                        ...
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="play" id="play" />
                    <Label htmlFor="play" className="flex items-center">
                      <Play className="h-4 w-4 mr-2" />
                      Play
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="stop" id="stop" />
                    <Label htmlFor="stop" className="flex items-center">
                      <Pause className="h-4 w-4 mr-2" />
                      Stop
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="satellite" id="satellite" />
                    <Label htmlFor="satellite" className="flex items-center">
                      <Radio className="h-4 w-4 mr-2" />
                      Satellite
                    </Label>
                    <Input 
                      type="text"
                      value={eventDuration}
                      onChange={(e) => setEventDuration(e.target.value)}
                      className="w-28 h-8"
                      disabled={eventType !== 'satellite'}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="announcement" id="announcement" />
                    <Label htmlFor="announcement" className="flex items-center">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Time announcement
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="temperature" id="temperature" />
                    <Label htmlFor="temperature" className="flex items-center">
                      <Thermometer className="h-4 w-4 mr-2" />
                      Temperature
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="humidity" id="humidity" />
                    <Label htmlFor="humidity" className="flex items-center">
                      <Droplets className="h-4 w-4 mr-2" />
                      Humidity
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            
            {/* Right column */}
            <div className="space-y-4">
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-3">Date and time</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="startDateTime" className="block mb-2">Start date and time</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input 
                        type="time" 
                        step="1"
                        id="startTime"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                      <Input 
                        type="date" 
                        id="startDate"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-2">
                    <Checkbox 
                      id="expiration" 
                      checked={hasExpiration}
                      onCheckedChange={(checked) => setHasExpiration(!!checked)}
                    />
                    <Label htmlFor="expiration">Expiration</Label>
                  </div>
                  
                  {hasExpiration && (
                    <div className="grid grid-cols-2 gap-2">
                      <Input 
                        type="time" 
                        step="1"
                        id="expirationTime"
                        value={expirationTime}
                        onChange={(e) => setExpirationTime(e.target.value)}
                        disabled={!hasExpiration}
                      />
                      <Input 
                        type="date" 
                        id="expirationDate"
                        value={expirationDate}
                        onChange={(e) => setExpirationDate(e.target.value)}
                        disabled={!hasExpiration}
                      />
                    </div>
                  )}
                  
                  <div>
                    <Label className="block mb-2">Priority</Label>
                    <RadioGroup value={priority} onValueChange={setPriority} className="flex space-x-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="low" id="lowPriority" />
                        <Label htmlFor="lowPriority">Low priority</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="high" id="highPriority" />
                        <Label htmlFor="highPriority">High priority</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>
              
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-3">Days</h3>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(selectedDays).map(([day, isSelected]) => (
                    <div key={day} className="flex items-center space-x-2">
                      <Checkbox 
                        id={day} 
                        checked={isSelected}
                        onCheckedChange={() => toggleDay(day)}
                      />
                      <Label htmlFor={day} className="capitalize">{day}</Label>
                    </div>
                  ))}
                  
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={selectAllDays}
                      className="w-full"
                    >
                      All
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={clearAllDays}
                      className="w-full"
                    >
                      None
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Dialog footer */}
        <div className="flex items-center justify-end p-4 border-t space-x-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>OK</Button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleDialog;
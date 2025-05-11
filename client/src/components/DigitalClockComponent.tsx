import React, { useState, useEffect } from 'react';
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { 
  Clock, 
  Pause, 
  AlarmClock, 
  Plus, 
  Settings, 
  X 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

// Break interface for type safety
interface BreakTime {
  id: number;
  hour: number;
  minute: number;
  name: string;
}

const DigitalClockComponent: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  // State for configured breaks
  const [configuredBreaks, setConfiguredBreaks] = useState<BreakTime[]>([
    { id: 1, hour: 10, minute: 0, name: "Morning News" },
    { id: 2, hour: 12, minute: 0, name: "Noon News" },
    { id: 3, hour: 15, minute: 30, name: "Weather Update" },
    { id: 4, hour: 18, minute: 0, name: "Evening News" },
  ]);
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  // New break form state
  const [newBreakHour, setNewBreakHour] = useState<number>(12);
  const [newBreakMinute, setNewBreakMinute] = useState<number>(0);
  const [newBreakName, setNewBreakName] = useState<string>("");
  // Blinking state
  const [shouldBlink, setShouldBlink] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(true);
  // Next break info
  const [nextBreak, setNextBreak] = useState<BreakTime | null>(null);
  const [timeToNextBreak, setTimeToNextBreak] = useState<number>(0);
  
  useEffect(() => {
    // Update the time every second
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      
      // Calculate time to next break
      const nextBreakInfo = findNextBreak(now, configuredBreaks);
      setNextBreak(nextBreakInfo.nextBreak);
      setTimeToNextBreak(nextBreakInfo.timeToNextBreak);
      
      // Should blink if less than 2 minutes to break
      setShouldBlink(nextBreakInfo.timeToNextBreak <= 120 && nextBreakInfo.timeToNextBreak > 0);
    }, 1000);
    
    // Clean up the interval on component unmount
    return () => clearInterval(interval);
  }, [configuredBreaks]);
  
  // Effect for handling sharp blinking without fading
  useEffect(() => {
    let blinkInterval: NodeJS.Timeout;
    
    if (shouldBlink) {
      // Toggle visibility every 500ms for a sharp on/off blinking effect
      blinkInterval = setInterval(() => {
        setIsVisible(prev => !prev);
      }, 500);
    } else {
      // Make sure it's visible when not blinking
      setIsVisible(true);
    }
    
    return () => {
      if (blinkInterval) clearInterval(blinkInterval);
    };
  }, [shouldBlink]);
  
  // Find the next upcoming break and calculate time to it
  const findNextBreak = (currentTime: Date, breaks: BreakTime[]): { nextBreak: BreakTime | null, timeToNextBreak: number } => {
    if (breaks.length === 0) {
      return { nextBreak: null, timeToNextBreak: 0 };
    }
    
    const now = currentTime;
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentSecond = now.getSeconds();
    
    // Convert all times to seconds since midnight for easier comparison
    const currentTimeInSeconds = (currentHour * 3600) + (currentMinute * 60) + currentSecond;
    
    let closestBreak: BreakTime | null = null;
    let minDifference = Infinity;
    
    breaks.forEach(breakTime => {
      // Convert break time to seconds
      const breakTimeInSeconds = (breakTime.hour * 3600) + (breakTime.minute * 60);
      
      // Calculate difference, handling the case where the break is tomorrow
      let difference = breakTimeInSeconds - currentTimeInSeconds;
      if (difference < 0) {
        // Break time is earlier in the day, so it must be for tomorrow
        difference += 24 * 3600; // Add 24 hours in seconds
      }
      
      if (difference < minDifference) {
        minDifference = difference;
        closestBreak = breakTime;
      }
    });
    
    return { nextBreak: closestBreak, timeToNextBreak: minDifference };
  };
  
  // Format the time in 12-hour format (e.g., "7:33 AM")
  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    const formattedHours = hours % 12 || 12; // Convert to 12-hour format
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  };
  
  // Format the date (e.g., "TUE, 18 OCT")
  const formatDate = (date: Date) => {
    const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    
    const dayOfWeek = daysOfWeek[date.getDay()];
    const dayOfMonth = date.getDate();
    const month = months[date.getMonth()];
    
    return `${dayOfWeek}, ${dayOfMonth} ${month}`;
  };
  
  // Format the countdown time (e.g., "01:23:45")
  const formatCountdown = (totalSeconds: number) => {
    if (totalSeconds <= 0) return "00:00:00";
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Format time for display (12-hour format with AM/PM)
  const formatBreakTime = (hour: number, minute: number) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
  };
  
  // Add a new break time
  const handleAddBreak = () => {
    if (newBreakHour >= 0 && newBreakHour < 24 && newBreakMinute >= 0 && newBreakMinute < 60 && newBreakName) {
      const newBreak: BreakTime = {
        id: Date.now(), // Use timestamp as a unique ID
        hour: newBreakHour,
        minute: newBreakMinute,
        name: newBreakName
      };
      
      setConfiguredBreaks([...configuredBreaks, newBreak]);
      
      // Reset form
      setNewBreakHour(12);
      setNewBreakMinute(0);
      setNewBreakName("");
      setDialogOpen(false);
    }
  };
  
  // Remove a break
  const handleRemoveBreak = (id: number) => {
    setConfiguredBreaks(configuredBreaks.filter(breakTime => breakTime.id !== id));
  };
  
  return (
    <Card className="bg-zinc-900 border-zinc-800 h-[180px] flex flex-col rounded-none" style={{ outline: "3px solid #626262", marginBottom: "0" }}>
      <CardHeader className="py-1 border-b border-zinc-800 flex-shrink-0 rounded-none">
        <div className="flex items-center w-full relative">
          <div className="absolute left-2">
            <Clock className="h-4 w-4 text-[#17f900]" />
          </div>
          <CardTitle className="text-sm flex items-center justify-center w-full text-white font-medium">
            Studio Clock
          </CardTitle>
          <div className="absolute right-0">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Settings className="h-4 w-4 text-[#17f900]" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-zinc-950 border-zinc-800">
                <DialogHeader>
                  <DialogTitle className="text-white">Configure Breaks</DialogTitle>
                  <DialogDescription>
                    Add scheduled breaks for your broadcast. These will appear in the countdown timer.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="time" className="text-white">Break Time</Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          id="hour"
                          type="number"
                          min={0}
                          max={23}
                          value={newBreakHour}
                          onChange={(e) => setNewBreakHour(parseInt(e.target.value) || 0)}
                          className="bg-zinc-900 border-zinc-700"
                        />
                        <span className="text-white">:</span>
                        <Input
                          id="minute"
                          type="number" 
                          min={0}
                          max={59}
                          value={newBreakMinute}
                          onChange={(e) => setNewBreakMinute(parseInt(e.target.value) || 0)}
                          className="bg-zinc-900 border-zinc-700"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="name" className="text-white">Break Name</Label>
                      <Input
                        id="name"
                        value={newBreakName}
                        onChange={(e) => setNewBreakName(e.target.value)}
                        className="bg-zinc-900 border-zinc-700"
                      />
                    </div>
                  </div>
                  
                  <Button type="button" onClick={handleAddBreak} className="w-full">
                    <Plus className="h-4 w-4 mr-2" /> Add Break
                  </Button>
                  
                  <ScrollArea className="h-[200px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Time</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {configuredBreaks.map((breakTime) => (
                          <TableRow key={breakTime.id}>
                            <TableCell>{formatBreakTime(breakTime.hour, breakTime.minute)}</TableCell>
                            <TableCell>{breakTime.name}</TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleRemoveBreak(breakTime.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Close</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 pb-0 flex-1 flex flex-col justify-center items-center bg-zinc-900 rounded-none" style={{ paddingBottom: "1px" }}>
        {/* Digital clock display */}
        <div className="font-mono flex flex-col items-center justify-center h-full w-full bg-zinc-900">
          {/* Time display */}
          <div className="text-[35px] font-bold tracking-wider text-[#e9b902] mb-1">
            {formatTime(currentTime)}
          </div>
          
          {/* Date display */}
          <div className="text-xl font-medium tracking-wide text-[#e9b902] mb-1">
            {formatDate(currentTime)}
          </div>
          
          {/* Next break countdown */}
          {nextBreak && (
            <div 
              className={`flex items-center`}
              style={{ 
                color: shouldBlink ? (isVisible ? '#ff0000' : 'transparent') : '#e9b902',
                transition: 'none',
                marginBottom: "1px"
              }}
            >
              <AlarmClock className="h-4 w-4 mr-1" />
              <div style={{ fontSize: '25px' }} className="font-medium text-center">
                {nextBreak.name} in {formatCountdown(timeToNextBreak)}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DigitalClockComponent;
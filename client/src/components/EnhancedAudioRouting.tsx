import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Phone, Mic, Volume2, RefreshCw } from 'lucide-react';

// Audio level meter component
const AudioLevelMeter: React.FC<{ level: number; type: 'input' | 'output' }> = ({ level, type }) => {
  // Generate color based on level and type
  const getColor = () => {
    if (type === 'input') {
      if (level > 80) return 'bg-red-500';
      if (level > 60) return 'bg-yellow-500';
      return 'bg-green-500';
    } else {
      if (level > 80) return 'bg-red-500';
      if (level > 60) return 'bg-blue-500';
      return 'bg-green-500';
    }
  };

  return (
    <div className="w-full h-4 bg-muted rounded-full overflow-hidden relative">
      <div 
        className={`h-full ${getColor()} transition-all duration-200`} 
        style={{ width: `${level}%` }}
      />
      <div className="absolute top-0 left-0 w-full h-full flex justify-between px-1">
        <span className="text-[9px] text-white font-bold">-40</span>
        <span className="text-[9px] text-white font-bold">0</span>
      </div>
    </div>
  );
};

// Call line audio routing component
interface CallLineAudioProps {
  lineId: number;
  audioDevices: AudioDevice[];
  onSaveRouting?: (routing: LineRouting) => void;
}

interface AudioDevice {
  id: number;
  name: string;
  channelCount: number;
}

interface LineRouting {
  lineId: number;
  inputDeviceId: string;
  outputDeviceId: string;
}

const CallLineAudio: React.FC<CallLineAudioProps> = ({ lineId, audioDevices, onSaveRouting }) => {
  const [inputDevice, setInputDevice] = useState<string>('');
  const [outputDevice, setOutputDevice] = useState<string>('');
  const [inputLevel, setInputLevel] = useState<number>(0);
  const [outputLevel, setOutputLevel] = useState<number>(0);

  // Simulate real-time audio levels with random variation
  useEffect(() => {
    const updateLevels = () => {
      if (inputDevice) {
        // Fluctuate around a base level with some randomness
        setInputLevel(prev => {
          const baseLevel = 40; // Moderate level when active
          const fluctuation = Math.random() * 30 - 15; // -15 to +15 fluctuation
          return Math.max(0, Math.min(100, baseLevel + fluctuation));
        });
      } else {
        setInputLevel(Math.random() * 5); // Very low random noise when no device selected
      }

      if (outputDevice) {
        setOutputLevel(prev => {
          const baseLevel = 60; // Higher level for output
          const fluctuation = Math.random() * 25 - 10; // -10 to +15 fluctuation
          return Math.max(0, Math.min(100, baseLevel + fluctuation));
        });
      } else {
        setOutputLevel(Math.random() * 3); // Very low random noise when no device selected
      }
    };

    const interval = setInterval(updateLevels, 200); // Update every 200ms for smooth animation
    return () => clearInterval(interval);
  }, [inputDevice, outputDevice]);

  // Save the routing configuration
  const saveRouting = () => {
    if (onSaveRouting) {
      onSaveRouting({
        lineId,
        inputDeviceId: inputDevice,
        outputDeviceId: outputDevice
      });
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Phone className="h-5 w-5 mr-2" />
          Line {lineId}
        </CardTitle>
        <CardDescription>Configure audio routing for call line {lineId}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid grid-cols-[120px_1fr_120px] gap-2 items-center">
            <Label htmlFor={`input-${lineId}`} className="flex items-center">
              <Mic className="h-4 w-4 mr-1" />
              Input
            </Label>
            <Select 
              value={inputDevice} 
              onValueChange={setInputDevice}
            >
              <SelectTrigger id={`input-${lineId}`}>
                <SelectValue placeholder="Select input device" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {audioDevices.map(device => (
                  <SelectItem key={`input-${device.id}`} value={device.id.toString()}>
                    {device.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="w-full">
              <AudioLevelMeter level={inputLevel} type="input" />
            </div>
          </div>

          <div className="grid grid-cols-[120px_1fr_120px] gap-2 items-center">
            <Label htmlFor={`output-${lineId}`} className="flex items-center">
              <Volume2 className="h-4 w-4 mr-1" />
              Output
            </Label>
            <Select 
              value={outputDevice} 
              onValueChange={setOutputDevice}
            >
              <SelectTrigger id={`output-${lineId}`}>
                <SelectValue placeholder="Select output device" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {audioDevices.map(device => (
                  <SelectItem key={`output-${device.id}`} value={device.id.toString()}>
                    {device.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="w-full">
              <AudioLevelMeter level={outputLevel} type="output" />
            </div>
          </div>

          <Button 
            className="w-full mt-2" 
            variant="outline" 
            onClick={saveRouting}
          >
            Save Routing
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export function EnhancedAudioRouting() {
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const { toast } = useToast();

  // Detect audio devices
  const detectAudioDevices = async () => {
    setIsDetecting(true);
    try {
      // Simulate browser's media devices API
      const mockDetectedDevices = [
        { deviceId: 'mic1', kind: 'audioinput', label: 'Built-in Microphone' },
        { deviceId: 'mic2', kind: 'audioinput', label: 'USB Microphone' },
        { deviceId: 'speaker1', kind: 'audiooutput', label: 'Built-in Speakers' },
        { deviceId: 'speaker2', kind: 'audiooutput', label: 'HDMI Audio' },
        { deviceId: 'headset', kind: 'audiooutput', label: 'Headset' }
      ];

      // Send detected devices to the server
      const response = await fetch('/api/audio-devices/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          devices: mockDetectedDevices.map(d => ({ name: d.label }))
        })
      });

      if (response.ok) {
        const savedDevices = await response.json();
        setAudioDevices(savedDevices);
        toast({
          title: 'Audio Devices Detected',
          description: `Found ${savedDevices.length} audio devices`,
        });
      } else {
        throw new Error('Failed to save detected devices');
      }
    } catch (error) {
      console.error('Error detecting audio devices:', error);
      toast({
        title: 'Detection Error',
        description: 'Failed to detect audio devices. Please try again.',
        variant: 'destructive'
      });
      
      // Fallback to demo devices
      setAudioDevices([
        { id: 1, name: 'Built-in Microphone', channelCount: 2 },
        { id: 2, name: 'USB Microphone', channelCount: 2 },
        { id: 3, name: 'Built-in Speakers', channelCount: 2 },
        { id: 4, name: 'HDMI Audio', channelCount: 2 },
        { id: 5, name: 'Headset', channelCount: 2 }
      ]);
    } finally {
      setIsDetecting(false);
    }
  };

  // Load audio devices on component mount
  useEffect(() => {
    const fetchAudioDevices = async () => {
      try {
        const response = await fetch('/api/audio-devices');
        if (response.ok) {
          const devices = await response.json();
          if (devices && devices.length > 0) {
            setAudioDevices(devices);
          } else {
            // If no devices in database, detect them
            await detectAudioDevices();
          }
        } else {
          throw new Error('Failed to fetch audio devices');
        }
      } catch (error) {
        console.error('Error loading audio devices:', error);
        // Fallback to demo devices
        setAudioDevices([
          { id: 1, name: 'Built-in Microphone', channelCount: 2 },
          { id: 2, name: 'USB Microphone', channelCount: 2 },
          { id: 3, name: 'Built-in Speakers', channelCount: 2 },
          { id: 4, name: 'HDMI Audio', channelCount: 2 },
          { id: 5, name: 'Headset', channelCount: 2 }
        ]);
      }
    };

    fetchAudioDevices();
  }, []);

  // Handle saving the routing configuration
  const handleSaveRouting = (routing: LineRouting) => {
    console.log('Saving routing:', routing);
    toast({
      title: 'Routing Saved',
      description: `Updated audio routing for Line ${routing.lineId}`,
    });
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Audio Routing</h2>
        <Button 
          onClick={detectAudioDevices} 
          variant="outline" 
          disabled={isDetecting}
          className="flex items-center"
        >
          {isDetecting ? (
            <>
              <span className="mr-2">Detecting...</span>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Detect Audio Devices
            </>
          )}
        </Button>
      </div>

      {audioDevices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground mb-4">No audio devices detected</p>
            <Button onClick={detectAudioDevices} disabled={isDetecting}>
              Detect Audio Devices
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Available Audio Devices</CardTitle>
              <CardDescription>Audio devices detected on this system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {audioDevices.map(device => (
                  <div key={device.id} className="flex justify-between items-center p-3 border rounded-md">
                    <div>
                      <p className="font-medium">{device.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {device.channelCount} channels
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <h3 className="text-xl font-bold mb-4">Call Line Audio Routing</h3>
          
          {/* Call Lines - let's create 4 lines */}
          {[1, 2, 3, 4].map(lineId => (
            <CallLineAudio 
              key={lineId} 
              lineId={lineId} 
              audioDevices={audioDevices}
              onSaveRouting={handleSaveRouting}
            />
          ))}
        </div>
      )}
    </div>
  );
}
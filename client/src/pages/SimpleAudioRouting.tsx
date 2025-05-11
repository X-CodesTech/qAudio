import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mic, Speaker, Phone, RefreshCw } from 'lucide-react';

// Simple progress bar component for audio levels
const AudioLevelBar = ({ level, color }: { level: number; color: string }) => (
  <div className="w-full h-2 bg-slate-200 rounded overflow-hidden">
    <div 
      className={`h-full ${color}`} 
      style={{ width: `${level}%` }}
    />
  </div>
);

// Simple line routing component
const LineRouting = ({ lineNumber }: { lineNumber: number }) => {
  // Define mock audio devices
  const audioDevices = [
    { id: 1, name: 'Built-in Microphone' },
    { id: 2, name: 'USB Microphone' },
    { id: 3, name: 'Built-in Speakers' },
    { id: 4, name: 'HDMI Audio' }
  ];

  // Random level for visual interest
  const inputLevel = Math.floor(Math.random() * 65) + 20;
  const outputLevel = Math.floor(Math.random() * 75) + 15;

  return (
    <Card className="mb-4 border-blue-200 shadow-md">
      <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-blue-100">
        <CardTitle className="text-lg flex items-center text-blue-700">
          <Phone className="h-5 w-5 mr-2 text-blue-600" />
          Line {lineNumber}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div>
              <Label htmlFor={`input-${lineNumber}`} className="mb-2 flex items-center">
                <Mic className="h-4 w-4 mr-1" />
                Input Source
              </Label>
              <Select defaultValue="1">
                <SelectTrigger id={`input-${lineNumber}`}>
                  <SelectValue placeholder="Select input" />
                </SelectTrigger>
                <SelectContent>
                  {audioDevices.map(device => (
                    <SelectItem key={`in-${device.id}`} value={device.id.toString()}>
                      {device.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor={`output-${lineNumber}`} className="mb-2 flex items-center">
                <Speaker className="h-4 w-4 mr-1" />
                Output Destination
              </Label>
              <Select defaultValue="3">
                <SelectTrigger id={`output-${lineNumber}`}>
                  <SelectValue placeholder="Select output" />
                </SelectTrigger>
                <SelectContent>
                  {audioDevices.map(device => (
                    <SelectItem key={`out-${device.id}`} value={device.id.toString()}>
                      {device.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <div className="mb-3">
                <Label className="flex items-center mb-1">
                  <Mic className="h-4 w-4 mr-1" />
                  Input Level
                </Label>
                <AudioLevelBar level={inputLevel} color="bg-blue-400" />
              </div>
              
              <div>
                <Label className="flex items-center mb-1">
                  <Speaker className="h-4 w-4 mr-1" />
                  Output Level
                </Label>
                <AudioLevelBar level={outputLevel} color="bg-blue-600" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function SimpleAudioRouting() {
  const { toast } = useToast();
  
  // Handle detecting audio devices
  const detectAudioDevices = () => {
    toast({
      title: "Audio Devices Detected",
      description: "Found 4 audio devices on your system",
    });
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Audio Routing</h2>
        <Button 
          onClick={detectAudioDevices}
          variant="outline"
          className="flex items-center"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Detect Audio Devices
        </Button>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Available Audio Devices</CardTitle>
          <CardDescription>
            Configure how audio is routed between devices for each call line
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 border rounded-md">
              <p className="font-medium">Built-in Microphone</p>
              <p className="text-sm text-muted-foreground">Input Device</p>
            </div>
            <div className="p-3 border rounded-md">
              <p className="font-medium">USB Microphone</p>
              <p className="text-sm text-muted-foreground">Input Device</p>
            </div>
            <div className="p-3 border rounded-md">
              <p className="font-medium">Built-in Speakers</p>
              <p className="text-sm text-muted-foreground">Output Device</p>
            </div>
            <div className="p-3 border rounded-md">
              <p className="font-medium">HDMI Audio</p>
              <p className="text-sm text-muted-foreground">Output Device</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <h3 className="text-xl font-bold mb-4">Call Line Audio Routing</h3>
      
      {/* Render 4 call lines */}
      {[1, 2, 3, 4].map(line => (
        <LineRouting key={line} lineNumber={line} />
      ))}
      
      <div className="flex justify-end mt-4">
        <Button 
          onClick={() => {
            toast({
              title: "Audio Routing Saved",
              description: "Your audio routing configuration has been saved.",
            });
          }}
        >
          Save Audio Configuration
        </Button>
      </div>
    </div>
  );
}
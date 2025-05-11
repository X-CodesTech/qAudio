import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ConnectionPulse from './ConnectionPulse';
import { Mic, Speaker, Network, Router, HardDrive, RefreshCw } from 'lucide-react';

type Device = {
  id: number;
  name: string;
  type: 'input' | 'output' | 'network' | 'server';
  status: 'connected' | 'disconnected';
  icon: React.ReactNode;
};

export default function DeviceConnectionDemo() {
  const [devices, setDevices] = useState<Device[]>([
    { 
      id: 1, 
      name: 'Studio Microphone', 
      type: 'input', 
      status: 'connected',
      icon: <Mic className="h-4 w-4 mr-2" />
    },
    { 
      id: 2, 
      name: 'USB Audio Interface', 
      type: 'input', 
      status: 'connected',
      icon: <Mic className="h-4 w-4 mr-2" />
    },
    { 
      id: 3, 
      name: 'Control Room Speakers', 
      type: 'output', 
      status: 'connected',
      icon: <Speaker className="h-4 w-4 mr-2" />
    },
    { 
      id: 4, 
      name: 'Headphone Output', 
      type: 'output', 
      status: 'disconnected',
      icon: <Speaker className="h-4 w-4 mr-2" />
    },
    { 
      id: 5, 
      name: 'Primary Network', 
      type: 'network', 
      status: 'connected',
      icon: <Network className="h-4 w-4 mr-2" />
    },
    { 
      id: 6, 
      name: 'Backup Network', 
      type: 'network', 
      status: 'disconnected',
      icon: <Network className="h-4 w-4 mr-2" />
    },
    { 
      id: 7, 
      name: 'SIP Server', 
      type: 'server', 
      status: 'connected',
      icon: <Router className="h-4 w-4 mr-2" />
    },
    { 
      id: 8, 
      name: 'Storage Server', 
      type: 'server', 
      status: 'connected',
      icon: <HardDrive className="h-4 w-4 mr-2" />
    },
  ]);
  
  const [pulseSetting, setPulseSetting] = useState<'pulse' | 'blink' | 'wave'>('pulse');
  const [pulseSpeed, setPulseSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  
  // Randomly toggle device connection status every few seconds for demo purposes
  useEffect(() => {
    const interval = setInterval(() => {
      const randomDeviceIndex = Math.floor(Math.random() * devices.length);
      
      setDevices(prevDevices => prevDevices.map((device, index) => {
        if (index === randomDeviceIndex) {
          // 30% chance to toggle status
          if (Math.random() > 0.7) {
            return {
              ...device,
              status: device.status === 'connected' ? 'disconnected' : 'connected'
            };
          }
        }
        return device;
      }));
    }, 3000);
    
    return () => clearInterval(interval);
  }, [devices]);
  
  // Handler to toggle all devices status
  const toggleAllDevices = () => {
    setDevices(prevDevices => prevDevices.map(device => ({
      ...device,
      status: 'connected'
    })));
  };
  
  return (
    <Card className="border-emerald-200">
      <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100">
        <CardTitle className="text-emerald-700">Device Connection Status</CardTitle>
        <CardDescription>
          Real-time visualization of connected devices with pulse animations
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex space-x-4">
              <Tabs defaultValue="pulse" onValueChange={(v) => setPulseSetting(v as any)}>
                <TabsList>
                  <TabsTrigger value="pulse">Pulse</TabsTrigger>
                  <TabsTrigger value="blink">Blink</TabsTrigger>
                  <TabsTrigger value="wave">Wave</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <Tabs defaultValue="normal" onValueChange={(v) => setPulseSpeed(v as any)}>
                <TabsList>
                  <TabsTrigger value="slow">Slow</TabsTrigger>
                  <TabsTrigger value="normal">Normal</TabsTrigger>
                  <TabsTrigger value="fast">Fast</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center"
              onClick={toggleAllDevices}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Connect All
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {devices.map(device => (
              <div 
                key={device.id} 
                className={`
                  flex items-center p-3 border rounded-md
                  ${device.status === 'connected' ? 'border-emerald-300 bg-emerald-50' : 'border-gray-300 bg-gray-50'}
                  transition-colors duration-300
                `}
              >
                <div className="mr-3">
                  {device.icon}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{device.name}</p>
                  <p className="text-sm text-muted-foreground capitalize">{device.type} Device</p>
                </div>
                <ConnectionPulse 
                  connected={device.status === 'connected'} 
                  label={device.status} 
                  pulseColor={
                    device.type === 'input' ? 'bg-emerald-500' : 
                    device.type === 'output' ? 'bg-green-500' : 
                    device.type === 'network' ? 'bg-teal-500' : 
                    'bg-emerald-700'
                  }
                  size="md"
                  animationType={pulseSetting}
                  pulseSpeed={pulseSpeed}
                />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
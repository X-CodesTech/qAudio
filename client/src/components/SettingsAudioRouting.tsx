import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AudioRouteConfig, AudioDevice, CallLine } from '@shared/schema';

// Default audio outputs will be supplemented with detected devices
const DEFAULT_AUDIO_OUTPUTS = [
  { id: 'main', name: 'Main Output' },
  { id: 'aux1', name: 'Aux 1' },
  { id: 'aux2', name: 'Aux 2' },
  { id: 'headphones', name: 'Headphones' },
  { id: 'monitor', name: 'Studio Monitor' },
];

// Player output configuration
interface PlayerOutputConfig {
  playerId: string; // "playerA", "playerB", "playerC", "cartwall"
  outputDevice: string;
  name: string;
}

export function SettingsAudioRouting() {
  const [audioRouting, setAudioRouting] = useState<AudioRouteConfig[]>([]);
  const [callLines, setCallLines] = useState<CallLine[]>([]);
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [systemAudioDevices, setSystemAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [allAudioOutputs, setAllAudioOutputs] = useState(DEFAULT_AUDIO_OUTPUTS);
  const [playerOutputs, setPlayerOutputs] = useState<PlayerOutputConfig[]>([
    { playerId: 'playerA', outputDevice: 'main', name: 'Player A' },
    { playerId: 'playerB', outputDevice: 'main', name: 'Player B' },
    { playerId: 'playerC', outputDevice: 'main', name: 'Player C' },
    { playerId: 'cartwall', outputDevice: 'main', name: 'Cart Wall' }
  ]);
  const [loading, setLoading] = useState(true);
  const [isDetectingDevices, setIsDetectingDevices] = useState(false);
  const { toast } = useToast();

  // Function to detect system audio devices
  const detectSystemAudioDevices = async () => {
    setIsDetectingDevices(true);
    try {
      // Check if the browser supports the MediaDevices API
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        throw new Error('Browser does not support device enumeration');
      }

      // We need to request permission to use microphone to get labeled devices
      let audioStream;
      try {
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (permissionError) {
        console.warn('Permission to use microphone was denied', permissionError);
        // Continue without labels since permissions were denied
      }

      // Get list of all media devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      // Filter to only audio output devices
      const audioOutputDevices = devices.filter(device => device.kind === 'audiooutput');
      setSystemAudioDevices(audioOutputDevices);
      
      // Create a combined list of default outputs and detected system devices
      const systemOutputs = audioOutputDevices.map(device => ({
        id: device.deviceId,
        name: device.label || `Audio Device (${device.deviceId.substring(0, 8)}...)`,
      }));
      
      // Merge with default outputs, keeping default outputs first
      setAllAudioOutputs([
        ...DEFAULT_AUDIO_OUTPUTS,
        ...systemOutputs
      ]);

      // If we had no real device information, still create some demo devices for development
      if (audioOutputDevices.length === 0 || audioOutputDevices.every(d => !d.label)) {
        const demoDevices = [
          { id: 'demo-device-1', name: 'Built-in Speakers' },
          { id: 'demo-device-2', name: 'Broadcast Headset' },
          { id: 'demo-device-3', name: 'Studio Monitors' }
        ];
        
        setAllAudioOutputs([
          ...DEFAULT_AUDIO_OUTPUTS,
          ...demoDevices
        ]);
      }

      // Stop the audio stream if we got permission
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }

      // Save the detected devices to the server
      const response = await fetch('/api/audio-devices/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          devices: systemOutputs.length > 0 ? systemOutputs : [
            { id: 'demo-device-1', name: 'Built-in Speakers' },
            { id: 'demo-device-2', name: 'Broadcast Headset' },
            { id: 'demo-device-3', name: 'Studio Monitors' }
          ]
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Detected ${systemOutputs.length > 0 ? systemOutputs.length : 3} audio devices`,
        });
      }
    } catch (error) {
      console.error('Error detecting audio devices:', error);
      toast({
        title: 'Error',
        description: 'Failed to detect audio devices. Please ensure you have granted permission to access audio devices.',
        variant: 'destructive',
      });
    } finally {
      setIsDetectingDevices(false);
    }
  };

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Define a helper function to safely fetch data
        const safeFetch = async (url: string, dataHandler: (data: any) => void) => {
          try {
            const response = await fetch(url);
            if (response.ok) {
              const data = await response.json();
              dataHandler(data);
            }
          } catch (err) {
            console.error(`Error fetching from ${url}:`, err);
          }
        };

        // Load player output configuration from localStorage
        try {
          const savedPlayerOutputs = localStorage.getItem('playerOutputs');
          if (savedPlayerOutputs) {
            const parsedOutputs = JSON.parse(savedPlayerOutputs) as PlayerOutputConfig[];
            if (Array.isArray(parsedOutputs) && parsedOutputs.length > 0) {
              setPlayerOutputs(parsedOutputs);
            }
          }
        } catch (err) {
          console.error('Failed to load player outputs from localStorage:', err);
        }

        // Fetch call lines
        await safeFetch('/api/call-lines', (callLinesData) => {
          setCallLines(callLinesData);
        });
        
        // Fetch audio routing
        await safeFetch('/api/audio-routing', (routingData) => {
          setAudioRouting(routingData);
        });
        
        // Fetch player outputs from server
        await safeFetch('/api/player-outputs', (outputsData) => {
          if (outputsData && Array.isArray(outputsData) && outputsData.length > 0) {
            setPlayerOutputs(outputsData);
            // Also update localStorage for immediate use
            localStorage.setItem('playerOutputs', JSON.stringify(outputsData));
          }
        });
        
        // Fetch audio devices
        await safeFetch('/api/audio-devices', (devicesData) => {
          setAudioDevices(devicesData);
          
          // Update allAudioOutputs with the stored devices from the server
          if (devicesData && devicesData.length > 0) {
            const storedDevices = devicesData.map((device: AudioDevice) => ({
              id: device.id.toString(),
              name: device.name,
            }));
            
            setAllAudioOutputs([
              ...DEFAULT_AUDIO_OUTPUTS,
              ...storedDevices.filter((device: {id: string, name: string}) => 
                // Filter out any duplicates from default outputs
                !DEFAULT_AUDIO_OUTPUTS.some(defaultDevice => defaultDevice.id === device.id)
              )
            ]);
          }
        });
        
        // Try to detect system audio devices on component mount
        try {
          await detectSystemAudioDevices();
        } catch (e) {
          // Silent fail - we'll just use the devices from the server
          console.error('Error auto-detecting audio devices:', e);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load audio routing data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);

  // Handle route change
  const handleRouteChange = (lineId: number, outputChannel: string) => {
    const updatedRouting = [...audioRouting];
    const existingRouteIndex = updatedRouting.findIndex(r => r.lineId === lineId);
    
    if (existingRouteIndex >= 0) {
      updatedRouting[existingRouteIndex].outputChannel = outputChannel;
    } else {
      updatedRouting.push({ lineId, outputChannel });
    }
    
    setAudioRouting(updatedRouting);
  };

  // Handle player output change
  const handlePlayerOutputChange = (playerId: string, outputDevice: string) => {
    const updatedOutputs = playerOutputs.map(output => 
      output.playerId === playerId ? { ...output, outputDevice } : output
    );
    setPlayerOutputs(updatedOutputs);
    
    // Save to localStorage for immediate use in audio player components
    localStorage.setItem('playerOutputs', JSON.stringify(updatedOutputs));
  };

  // Save routing changes
  const saveChanges = async () => {
    try {
      // Save call line routing
      const callLinePromises = audioRouting.map(route => 
        fetch(`/api/audio-routing`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(route),
        })
      );
      
      // Save player output configuration
      const playerOutputPromise = fetch(`/api/player-outputs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(playerOutputs),
      }).catch(err => {
        console.error('Failed to save player outputs to server, but local storage is updated:', err);
        // Even if the server save fails, the localStorage save still works
        return null;
      });
      
      await Promise.all([...callLinePromises, playerOutputPromise]);
      
      toast({
        title: 'Success',
        description: 'Audio routing configuration saved',
      });
    } catch (error) {
      console.error('Error saving audio routing:', error);
      toast({
        title: 'Error',
        description: 'Failed to save audio routing configuration',
        variant: 'destructive',
      });
    }
  };

  // Get current route for a line
  const getRouteForLine = (lineId: number) => {
    const route = audioRouting.find(r => r.lineId === lineId);
    return route?.outputChannel || 'main';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audio Routing</CardTitle>
          <CardDescription>Loading audio configuration...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Audio Routing</CardTitle>
          <CardDescription>Configure audio routing for each call line</CardDescription>
        </div>
        <Button 
          onClick={detectSystemAudioDevices}
          disabled={isDetectingDevices}
          variant="outline"
          size="sm"
        >
          {isDetectingDevices ? (
            <>
              <span className="mr-2">Detecting...</span>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </>
          ) : (
            <>Detect Audio Devices</>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">System Audio Devices</h3>
            {systemAudioDevices.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No system audio devices detected. Click "Detect Audio Devices" to scan for connected audio devices.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 mb-4">
                <div className="border rounded-md p-3 bg-muted/30">
                  <div className="font-medium">Detected Audio Devices</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {systemAudioDevices.map((device, index) => (
                      <div key={device.deviceId || `device-${index}`}>
                        {device.label || `Device ${index + 1}`}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Player Output Configuration</h3>
            <div className="space-y-4">
              {playerOutputs.map(player => (
                <div key={player.playerId} className="grid grid-cols-2 gap-4 items-center">
                  <div>
                    <Label htmlFor={`player-${player.playerId}`}>{player.name}</Label>
                    <p className="text-sm text-muted-foreground">
                      Configure which audio device this player will use
                    </p>
                  </div>
                  <div>
                    <Select
                      value={player.outputDevice}
                      onValueChange={(value) => handlePlayerOutputChange(player.playerId, value)}
                    >
                      <SelectTrigger id={`player-${player.playerId}`}>
                        <SelectValue placeholder="Select output device" />
                      </SelectTrigger>
                      <SelectContent>
                        {allAudioOutputs.map((output) => (
                          <SelectItem key={output.id} value={output.id}>
                            {output.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Call Line Routing</h3>
            <div className="space-y-4">
              {callLines.map(line => (
                <div key={line.id} className="grid grid-cols-2 gap-4 items-center">
                  <div>
                    <Label htmlFor={`line-${line.id}`}>Call Line {line.id}</Label>
                    <p className="text-sm text-muted-foreground">
                      {line.status === 'inactive' ? 'Inactive' : `Status: ${line.status}`}
                    </p>
                  </div>
                  <div>
                    <Select
                      value={getRouteForLine(line.id)}
                      onValueChange={(value) => handleRouteChange(line.id, value)}
                    >
                      <SelectTrigger id={`line-${line.id}`}>
                        <SelectValue placeholder="Select output" />
                      </SelectTrigger>
                      <SelectContent>
                        {allAudioOutputs.map((output) => (
                          <SelectItem key={output.id} value={output.id}>
                            {output.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={saveChanges}>Save Audio Routing</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
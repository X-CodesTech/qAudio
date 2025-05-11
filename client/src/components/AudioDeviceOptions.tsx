import React, { useState, useEffect } from 'react';
import { SelectItem } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface AudioDeviceOptionsProps {
  type: 'input' | 'output';
}

export const AudioDeviceOptions: React.FC<AudioDeviceOptionsProps> = ({ type }) => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getDevices() {
      try {
        // Request user permission to access audio devices
        await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Get list of all media devices
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        
        // Filter for audio devices of the requested type
        const audioDevices = allDevices.filter(device => {
          return type === 'input' 
            ? device.kind === 'audioinput' 
            : device.kind === 'audiooutput';
        });
        
        setDevices(audioDevices);
      } catch (err) {
        console.error("Failed to access audio devices:", err);
        setError("Failed to access audio devices. Please ensure you've granted permission.");
      } finally {
        setLoading(false);
      }
    }

    getDevices();
  }, [type]);

  if (loading) {
    return <SelectItem value="loading" disabled><Loader2 className="h-4 w-4 animate-spin mr-2 inline" /> Loading devices...</SelectItem>;
  }

  if (error) {
    return <SelectItem value="error" disabled>Error: {error}</SelectItem>;
  }

  if (devices.length === 0) {
    return <SelectItem value="none" disabled>No {type} devices found</SelectItem>;
  }

  return (
    <>
      {devices.map((device) => (
        <SelectItem key={device.deviceId} value={device.deviceId}>
          {device.label || `${type === 'input' ? 'Microphone' : 'Speaker'} (${device.deviceId.slice(0, 8)}...)`}
        </SelectItem>
      ))}
    </>
  );
};

export default AudioDeviceOptions;
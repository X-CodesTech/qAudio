import { useState, useEffect } from 'react';
import { useVoIP } from '@/hooks/useVoIP';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function Footer() {
  const { getAudioDevices, sipServer } = useVoIP();
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('');
  const [systemStatus, setSystemStatus] = useState<'ready' | 'error'>('ready');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Get default audio device on component mount
    const fetchAudioDevice = async () => {
      const devices = await getAudioDevices();
      if (devices && devices.length > 0) {
        const defaultDevice = devices.find(device => device.isDefault) || devices[0];
        setSelectedAudioDevice(defaultDevice.name);
      }
    };

    fetchAudioDevice();
  }, [getAudioDevices]);

  return (
    <footer className="bg-neutral-100 border-t border-neutral-200 py-1 px-4 text-sm text-neutral-500 flex justify-between">
      <div className="flex items-center space-x-4">
        <div>
          <span className="font-semibold">SIP Server:</span> {sipServer}
        </div>
        <div>
          <span className="font-semibold">Audio Device:</span> {selectedAudioDevice}
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className={systemStatus === 'ready' ? "text-green-700" : "text-red-700"}>
          {systemStatus === 'ready' ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 inline-block mr-1"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <path d="m9 11 3 3L22 4" />
              </svg>
              System Ready
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 inline-block mr-1"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              System Error
            </>
          )}
        </div>
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-neutral-500 hover:text-neutral-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 mr-1"
              >
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Settings
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>System Settings</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Settings content would go here */}
              <p>VoIP and audio settings form would be displayed here.</p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </footer>
  );
}

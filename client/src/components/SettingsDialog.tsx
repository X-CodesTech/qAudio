import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  HardDrive,
  Volume,
  Music,
  User,
  History,
  Wrench,
  Network,
  Palette,
  Paintbrush,
  Loader2
} from "lucide-react";
import { ColorCodingLegend } from "@/components/ColorCodingLegend";
import { Switch } from "@/components/ui/switch";
import { StorageSettings } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { AudioDeviceOptions } from '@/components/AudioDeviceOptions';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onOpenChange }) => {
  const [activeTab, setActiveTab] = useState("database");
  const { toast } = useToast();
  
  // State for storage settings
  const [storageSettings, setStorageSettings] = useState<StorageSettings>({
    primaryPath: '',
    backupPath: '',
    autoOrganize: true,
    watchFolders: false
  });
  
  // Query to fetch storage settings
  const { data: fetchedStorageSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['/api/radio/settings/storage'],
    queryFn: async () => {
      const response = await fetch('/api/radio/settings/storage');
      if (!response.ok) {
        throw new Error('Failed to fetch storage settings');
      }
      return response.json() as Promise<StorageSettings>;
    },
    enabled: activeTab === 'system'
  });
  
  // Mutation to save storage settings
  const { mutate: saveStorageSettings, isPending: isSavingSettings } = useMutation({
    mutationFn: async (settings: StorageSettings) => {
      const response = await apiRequest('POST', '/api/radio/settings/storage', settings);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save storage settings');
      }
      return response.json() as Promise<StorageSettings>;
    },
    onSuccess: (data) => {
      toast({
        title: 'Settings Saved',
        description: 'Storage settings have been updated successfully.',
      });
      setStorageSettings(data);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Update local state when fetched settings change
  useEffect(() => {
    if (fetchedStorageSettings) {
      setStorageSettings(fetchedStorageSettings);
    }
  }, [fetchedStorageSettings]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-auto bg-zinc-900 text-white border border-zinc-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Application Settings</DialogTitle>
          <DialogDescription>
            Configure application preferences and system settings
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="database" value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-8 w-full bg-zinc-800">
            <TabsTrigger value="database" className="flex flex-col items-center p-2 gap-1 data-[state=active]:bg-zinc-700">
              <HardDrive className="h-4 w-4" />
              <span className="text-xs">Database</span>
            </TabsTrigger>
            <TabsTrigger value="audio" className="flex flex-col items-center p-2 gap-1 data-[state=active]:bg-zinc-700">
              <Volume className="h-4 w-4" />
              <span className="text-xs">Audio Routing</span>
            </TabsTrigger>
            <TabsTrigger value="player" className="flex flex-col items-center p-2 gap-1 data-[state=active]:bg-zinc-700">
              <Music className="h-4 w-4" />
              <span className="text-xs">Player</span>
            </TabsTrigger>
            <TabsTrigger value="colors" className="flex flex-col items-center p-2 gap-1 data-[state=active]:bg-zinc-700">
              <Palette className="h-4 w-4" />
              <span className="text-xs">Track Colors</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex flex-col items-center p-2 gap-1 data-[state=active]:bg-zinc-700">
              <User className="h-4 w-4" />
              <span className="text-xs">User Profile</span>
            </TabsTrigger>
            <TabsTrigger value="logging" className="flex flex-col items-center p-2 gap-1 data-[state=active]:bg-zinc-700">
              <History className="h-4 w-4" />
              <span className="text-xs">Logging</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="flex flex-col items-center p-2 gap-1 data-[state=active]:bg-zinc-700">
              <Wrench className="h-4 w-4" />
              <span className="text-xs">System</span>
            </TabsTrigger>
            <TabsTrigger value="network" className="flex flex-col items-center p-2 gap-1 data-[state=active]:bg-zinc-700">
              <Network className="h-4 w-4" />
              <span className="text-xs">Network</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Database settings */}
          <TabsContent value="database" className="p-4 space-y-4 border rounded-md border-zinc-800 mt-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Database Configuration</h3>
                <p className="text-sm text-gray-400">Configure your database connection settings</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="db-host">Database Host</Label>
                <Input
                  id="db-host"
                  className="bg-zinc-800 border-zinc-700"
                  placeholder="localhost"
                  defaultValue="localhost"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="db-port">Database Port</Label>
                <Input
                  id="db-port"
                  className="bg-zinc-800 border-zinc-700"
                  placeholder="5432"
                  defaultValue="5432"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="db-name">Database Name</Label>
                <Input
                  id="db-name"
                  className="bg-zinc-800 border-zinc-700"
                  placeholder="radio_automation"
                  defaultValue="radio_automation"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="db-user">Username</Label>
                  <Input
                    id="db-user"
                    className="bg-zinc-800 border-zinc-700"
                    placeholder="postgres"
                    defaultValue="postgres"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="db-password">Password</Label>
                  <Input
                    id="db-password"
                    type="password"
                    className="bg-zinc-800 border-zinc-700"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Button className="bg-blue-600 hover:bg-blue-700">Test Connection</Button>
                <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                  Reset to Default
                </Button>
              </div>
            </div>
          </TabsContent>
          
          {/* Audio Routing settings */}
          <TabsContent value="audio" className="p-4 space-y-4 border rounded-md border-zinc-800 mt-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Audio Routing Configuration</h3>
                <p className="text-sm text-gray-400">Configure audio inputs, outputs and routing rules</p>
              </div>
              
              <div className="space-y-4 border rounded-md border-zinc-800 p-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-md font-medium">Audio Output Devices</h4>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    onClick={async () => {
                      try {
                        // Request permission to access audio devices
                        await navigator.mediaDevices.getUserMedia({ audio: true });
                        toast({
                          title: "Audio devices detected",
                          description: "Successfully detected audio devices",
                        });
                      } catch (err) {
                        toast({
                          title: "Error",
                          description: "Failed to access audio devices. Please ensure you've granted permission.",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <Loader2 className="h-4 w-4 mr-2" /> Refresh Devices
                  </Button>
                </div>
                
                <div className="grid gap-4 mt-4">
                  <div className="grid gap-2">
                    <Label htmlFor="playerA-output">Player A Output Device</Label>
                    <Select defaultValue="default">
                      <SelectTrigger id="playerA-output" className="bg-zinc-800 border-zinc-700">
                        <SelectValue placeholder="Select output device" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700 max-h-60">
                        <SelectItem value="default">System Default</SelectItem>
                        {typeof navigator !== 'undefined' && 'mediaDevices' in navigator && (
                          <AudioDeviceOptions type="output" />
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="playerB-output">Player B Output Device</Label>
                    <Select defaultValue="default">
                      <SelectTrigger id="playerB-output" className="bg-zinc-800 border-zinc-700">
                        <SelectValue placeholder="Select output device" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700 max-h-60">
                        <SelectItem value="default">System Default</SelectItem>
                        {typeof navigator !== 'undefined' && 'mediaDevices' in navigator && (
                          <AudioDeviceOptions type="output" />
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="cart-wall-output">Cart Wall Output Device</Label>
                    <Select defaultValue="default">
                      <SelectTrigger id="cart-wall-output" className="bg-zinc-800 border-zinc-700">
                        <SelectValue placeholder="Select output device" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700 max-h-60">
                        <SelectItem value="default">System Default</SelectItem>
                        {typeof navigator !== 'undefined' && 'mediaDevices' in navigator && (
                          <AudioDeviceOptions type="output" />
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4 border rounded-md border-zinc-800 p-4">
                <h4 className="text-md font-medium">Audio Processing Settings</h4>
                
                <div className="grid gap-2">
                  <Label htmlFor="sample-rate">Sample Rate</Label>
                  <Select defaultValue="48000">
                    <SelectTrigger id="sample-rate" className="bg-zinc-800 border-zinc-700">
                      <SelectValue placeholder="Select sample rate" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="44100">44.1 kHz</SelectItem>
                      <SelectItem value="48000">48 kHz</SelectItem>
                      <SelectItem value="96000">96 kHz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="audio-buffer">Buffer Size</Label>
                  <Select defaultValue="256">
                    <SelectTrigger id="audio-buffer" className="bg-zinc-800 border-zinc-700">
                      <SelectValue placeholder="Select buffer size" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="128">128 samples</SelectItem>
                      <SelectItem value="256">256 samples</SelectItem>
                      <SelectItem value="512">512 samples</SelectItem>
                      <SelectItem value="1024">1024 samples</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2 mt-2">
                  <Switch id="auto-ducking" defaultChecked={true} />
                  <Label htmlFor="auto-ducking">Enable automatic voice ducking</Label>
                </div>
                
                <div className="flex items-center space-x-2 mt-2">
                  <Switch id="auto-level" defaultChecked={true} />
                  <Label htmlFor="auto-level">Enable automatic level adjustment</Label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4">
                <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                  Reset to Default
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700">Save Changes</Button>
              </div>
            </div>
          </TabsContent>
          
          {/* Player settings */}
          <TabsContent value="player" className="p-4 space-y-4 border rounded-md border-zinc-800 mt-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Player Settings</h3>
                <p className="text-sm text-gray-400">Configure how audio players behave and operate</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch id="fade-enabled" defaultChecked={true} />
                <Label htmlFor="fade-enabled">Enable auto fades between tracks</Label>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="fade-duration">Fade Duration (ms)</Label>
                <Input
                  id="fade-duration"
                  type="number"
                  className="bg-zinc-800 border-zinc-700"
                  placeholder="1000"
                  defaultValue="1000"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="preload-time">Preload Time (seconds)</Label>
                <Input
                  id="preload-time"
                  type="number"
                  className="bg-zinc-800 border-zinc-700"
                  placeholder="5"
                  defaultValue="5"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="player-cache">Player Cache Size (MB)</Label>
                <Input
                  id="player-cache"
                  type="number"
                  className="bg-zinc-800 border-zinc-700"
                  placeholder="512"
                  defaultValue="512"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch id="auto-segue" defaultChecked={true} />
                <Label htmlFor="auto-segue">Enable automatic segue</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch id="auto-normalize" defaultChecked={true} />
                <Label htmlFor="auto-normalize">Automatically normalize track volumes</Label>
              </div>
              
              <div className="flex justify-end space-x-4">
                <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                  Reset to Default
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700">Save Changes</Button>
              </div>
            </div>
          </TabsContent>
          
          {/* Track Color Coding settings */}
          <TabsContent value="colors" className="p-4 space-y-4 border rounded-md border-zinc-800 mt-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Smart Playlist Color Coding</h3>
                <p className="text-sm text-gray-400">Configure color coding for easier visual identification of track types</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <ColorCodingLegend />
                  
                  <div className="space-y-2 border rounded-md border-zinc-800 p-4">
                    <h4 className="text-sm font-medium flex items-center gap-1">
                      <Paintbrush className="h-4 w-4" /> Color Coding Settings
                    </h4>
                    
                    <div className="flex items-center space-x-2 mt-4">
                      <Switch id="auto-color-detection" defaultChecked={true} />
                      <Label htmlFor="auto-color-detection">Enable automatic category detection for new tracks</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-2">
                      <Switch id="color-borders" defaultChecked={true} />
                      <Label htmlFor="color-borders">Show colored borders for track items</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-2">
                      <Switch id="status-badges" defaultChecked={true} />
                      <Label htmlFor="status-badges">Show status badges (ON AIR, NEXT, etc.)</Label>
                    </div>
                    
                    <div className="grid gap-2 mt-4">
                      <Label htmlFor="color-opacity">Color intensity</Label>
                      <div className="px-1">
                        <Input
                          id="color-opacity"
                          type="range"
                          min={10}
                          max={100}
                          step={5}
                          defaultValue={50}
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="border rounded-md border-zinc-800 p-4">
                    <h4 className="text-sm font-medium">Color Coding Benefits</h4>
                    <ul className="mt-2 space-y-2 text-sm text-gray-400">
                      <li className="flex items-start gap-2">
                        <div className="rounded-full bg-blue-500 h-2 w-2 mt-1.5" />
                        <span>Quickly identify track types with color coding</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="rounded-full bg-blue-500 h-2 w-2 mt-1.5" />
                        <span>Simplify playlist organization with visual cues</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="rounded-full bg-blue-500 h-2 w-2 mt-1.5" />
                        <span>Ensure proper playlist balance of content types</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="rounded-full bg-blue-500 h-2 w-2 mt-1.5" />
                        <span>Auto-detect track categories based on metadata</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="rounded-full bg-blue-500 h-2 w-2 mt-1.5" />
                        <span>Monitor category distribution with real-time analytics</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="border rounded-md border-zinc-800 p-4">
                    <h4 className="text-sm font-medium">Quick Actions</h4>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs h-8">
                        Analyze All Tracks
                      </Button>
                      <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs h-8">
                        Bulk Recategorize
                      </Button>
                      <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs h-8">
                        Export Categories
                      </Button>
                      <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 text-xs h-8">
                        Import Categories
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 mt-4">
                <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                  Reset to Default
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700">Save Changes</Button>
              </div>
            </div>
          </TabsContent>
          
          {/* User Profile settings */}
          <TabsContent value="profile" className="p-4 space-y-4 border rounded-md border-zinc-800 mt-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">User Profile</h3>
                <p className="text-sm text-gray-400">Manage your user profile and authentication settings</p>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="display-name">Display Name</Label>
                <Input
                  id="display-name"
                  className="bg-zinc-800 border-zinc-700"
                  placeholder="John Smith"
                  defaultValue="John Smith"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="email-address">Email Address</Label>
                <Input
                  id="email-address"
                  type="email"
                  className="bg-zinc-800 border-zinc-700"
                  placeholder="john@example.com"
                  defaultValue="john@example.com"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="password">Current Password</Label>
                <Input
                  id="password"
                  type="password"
                  className="bg-zinc-800 border-zinc-700"
                  placeholder="••••••••"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  className="bg-zinc-800 border-zinc-700"
                  placeholder="••••••••"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  className="bg-zinc-800 border-zinc-700"
                  placeholder="••••••••"
                />
              </div>
              
              <div className="flex justify-end space-x-4">
                <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                  Cancel
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700">Save Profile</Button>
              </div>
            </div>
          </TabsContent>
          
          {/* Logging settings */}
          <TabsContent value="logging" className="p-4 space-y-4 border rounded-md border-zinc-800 mt-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Logging Configuration</h3>
                <p className="text-sm text-gray-400">Configure logging levels and options</p>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="log-level">Log Level</Label>
                <Select defaultValue="info">
                  <SelectTrigger id="log-level" className="bg-zinc-800 border-zinc-700">
                    <SelectValue placeholder="Select log level" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="warn">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="debug">Debug</SelectItem>
                    <SelectItem value="trace">Trace</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch id="log-file" defaultChecked={true} />
                <Label htmlFor="log-file">Enable file logging</Label>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="log-path">Log File Path</Label>
                <Input
                  id="log-path"
                  className="bg-zinc-800 border-zinc-700"
                  placeholder="/var/log/radio-automation/"
                  defaultValue="/var/log/radio-automation/"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="log-format">Log Format</Label>
                <Select defaultValue="json">
                  <SelectTrigger id="log-format" className="bg-zinc-800 border-zinc-700">
                    <SelectValue placeholder="Select log format" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="text">Plain Text</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch id="log-rotation" defaultChecked={true} />
                <Label htmlFor="log-rotation">Enable log rotation</Label>
              </div>
              
              <div className="flex justify-end space-x-4">
                <Button variant="default" className="bg-orange-600 hover:bg-orange-700">
                  Clear Logs
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700">Save Settings</Button>
              </div>
            </div>
          </TabsContent>
          
          {/* System settings */}
          <TabsContent value="system" className="p-4 space-y-4 border rounded-md border-zinc-800 mt-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">System Settings</h3>
                <p className="text-sm text-gray-400">Configure system-wide settings and maintenance options</p>
              </div>
              
              {/* System maintenance settings */}
              <div className="space-y-4 border rounded-md border-zinc-800 p-4">
                <h4 className="text-md font-medium">System Maintenance</h4>
                <p className="text-sm text-gray-400">Configure system-wide maintenance and performance options</p>
                
                <div className="flex items-center space-x-2 mt-2">
                  <Switch 
                    id="auto-cleanup" 
                    defaultChecked={true}
                  />
                  <Label htmlFor="auto-cleanup">Enable automatic temporary file cleanup</Label>
                </div>
                
                <div className="flex items-center space-x-2 mt-2">
                  <Switch 
                    id="error-reporting"
                    defaultChecked={true}
                  />
                  <Label htmlFor="error-reporting">Enable error reporting and diagnostics</Label>
                </div>
                
                <div className="flex items-center space-x-2 mt-2">
                  <Switch 
                    id="background-indexing"
                    defaultChecked={true}
                  />
                  <Label htmlFor="background-indexing">Enable background audio file indexing</Label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 mt-4">
                <Button 
                  variant="outline" 
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  onClick={() => setStorageSettings({
                    primaryPath: 'C:\\Qstudio',
                    backupPath: '',
                    autoOrganize: true,
                    watchFolders: false
                  })}
                  disabled={isLoadingSettings || isSavingSettings}
                >
                  Reset to Default
                </Button>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => saveStorageSettings(storageSettings)}
                  disabled={isLoadingSettings || isSavingSettings}
                >
                  {isSavingSettings ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : 'Save Storage Settings'}
                </Button>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="language">System Language</Label>
                <Select defaultValue="en">
                  <SelectTrigger id="language" className="bg-zinc-800 border-zinc-700">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="time-zone">Time Zone</Label>
                <Select defaultValue="utc">
                  <SelectTrigger id="time-zone" className="bg-zinc-800 border-zinc-700">
                    <SelectValue placeholder="Select time zone" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="utc">UTC</SelectItem>
                    <SelectItem value="est">Eastern Time (EST)</SelectItem>
                    <SelectItem value="cst">Central Time (CST)</SelectItem>
                    <SelectItem value="mst">Mountain Time (MST)</SelectItem>
                    <SelectItem value="pst">Pacific Time (PST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch id="auto-update" defaultChecked={true} />
                <Label htmlFor="auto-update">Enable automatic updates</Label>
              </div>
              
              <div className="space-y-4">
                <div className="border-l-4 border-yellow-500 bg-yellow-500/10 p-4 rounded">
                  <h4 className="font-medium mb-1">Track Storage Configuration</h4>
                  <p className="text-sm text-gray-400 mb-2">
                    Specify where audio tracks should be stored on your PC. This path will be used for all uploaded and imported tracks.
                  </p>
                  
                  {isLoadingSettings && (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-yellow-500" />
                      <span className="ml-2 text-yellow-500">Loading storage settings...</span>
                    </div>
                  )}
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="storage-path">Primary Storage Path</Label>
                  <div className="flex gap-2">
                    <Input
                      id="storage-path"
                      className="bg-zinc-800 border-zinc-700 flex-1"
                      placeholder="C:\Qstudio"
                      value={storageSettings.primaryPath}
                      onChange={(e) => setStorageSettings({
                        ...storageSettings,
                        primaryPath: e.target.value
                      })}
                    />
                    <Button 
                      variant="outline" 
                      className="border-zinc-700 hover:bg-zinc-800"
                      type="button"
                      onClick={() => {
                        // Set the default path to C:\Qstudio
                        setStorageSettings({
                          ...storageSettings,
                          primaryPath: 'C:\\Qstudio'
                        });
                        toast({
                          title: "Storage Path Set",
                          description: "Default storage path set to C:\\Qstudio",
                        });
                      }}
                    >
                      Browse...
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">This is where new uploads will be stored</p>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="backup-storage-path">Backup Storage Path (Optional)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="backup-storage-path"
                      className="bg-zinc-800 border-zinc-700 flex-1"
                      placeholder="C:\Qstudio\Backup"
                      value={storageSettings.backupPath || ''}
                      onChange={(e) => setStorageSettings({
                        ...storageSettings,
                        backupPath: e.target.value
                      })}
                    />
                    <Button 
                      variant="outline" 
                      className="border-zinc-700 hover:bg-zinc-800"
                      type="button"
                      onClick={() => {
                        // Set a backup path in the same parent directory
                        setStorageSettings({
                          ...storageSettings,
                          backupPath: 'C:\\Qstudio\\Backup'
                        });
                        toast({
                          title: "Backup Path Set",
                          description: "Backup storage path set to C:\\Qstudio\\Backup",
                        });
                      }}
                    >
                      Browse...
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">If specified, tracks will be backed up to this location</p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="auto-organize" 
                    checked={storageSettings.autoOrganize}
                    onCheckedChange={(checked) => setStorageSettings({
                      ...storageSettings,
                      autoOrganize: checked
                    })}
                  />
                  <div>
                    <Label htmlFor="auto-organize">Auto-organize tracks into folders by date</Label>
                    <p className="text-xs text-gray-500">Example: 2023/06/25/track_name.mp3</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="watch-import-folder" 
                    checked={storageSettings.watchFolders}
                    onCheckedChange={(checked) => setStorageSettings({
                      ...storageSettings,
                      watchFolders: checked
                    })}
                  />
                  <div>
                    <Label htmlFor="watch-import-folder">Watch import folder for new files</Label>
                    <p className="text-xs text-gray-500">Automatically import new files added to the storage path</p>
                  </div>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="backup-freq">Backup Frequency</Label>
                <Select defaultValue="daily">
                  <SelectTrigger id="backup-freq" className="bg-zinc-800 border-zinc-700">
                    <SelectValue placeholder="Select backup frequency" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end space-x-4">
                <Button 
                  variant="outline" 
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  onClick={() => setStorageSettings({
                    primaryPath: 'C:\\Qstudio',
                    backupPath: '',
                    autoOrganize: true,
                    watchFolders: false
                  })}
                >
                  Reset to Default
                </Button>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => saveStorageSettings(storageSettings)}
                  disabled={isSavingSettings || !storageSettings.primaryPath}
                >
                  {isSavingSettings ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : 'Save Settings'}
                </Button>
              </div>
            </div>
          </TabsContent>
          
          {/* Network settings */}
          <TabsContent value="network" className="p-4 space-y-4 border rounded-md border-zinc-800 mt-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Network Configuration</h3>
                <p className="text-sm text-gray-400">Configure network and connectivity settings</p>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="server-ip">Server IP Address</Label>
                <Input
                  id="server-ip"
                  className="bg-zinc-800 border-zinc-700"
                  placeholder="0.0.0.0"
                  defaultValue="0.0.0.0"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="server-port">Server Port</Label>
                <Input
                  id="server-port"
                  className="bg-zinc-800 border-zinc-700"
                  placeholder="8080"
                  defaultValue="8080"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch id="use-ssl" defaultChecked={true} />
                <Label htmlFor="use-ssl">Enable SSL/TLS</Label>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="ssl-cert">SSL Certificate Path</Label>
                <Input
                  id="ssl-cert"
                  className="bg-zinc-800 border-zinc-700"
                  placeholder="/etc/ssl/certs/radio-automation.crt"
                  defaultValue="/etc/ssl/certs/radio-automation.crt"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="ssl-key">SSL Key Path</Label>
                <Input
                  id="ssl-key"
                  className="bg-zinc-800 border-zinc-700"
                  placeholder="/etc/ssl/private/radio-automation.key"
                  defaultValue="/etc/ssl/private/radio-automation.key"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch id="remote-access" defaultChecked={true} />
                <Label htmlFor="remote-access">Enable remote access</Label>
              </div>
              
              <div className="flex justify-end space-x-4">
                <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                  Test Connection
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700">Save Settings</Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-zinc-800">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
            Cancel
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            Save All Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
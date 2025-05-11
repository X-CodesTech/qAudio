import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Phone, 
  PhoneOff, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Activity,
  Settings,
  RotateCw,
  Trash2,
  Sliders,
  Home
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Define types for connection logs
type LogType = 'info' | 'warning' | 'error' | 'success';

interface ConnectionLog {
  timestamp: Date;
  type: LogType;
  message: string;
}

// Define types for studio metrics
interface StudioMetrics {
  id: string;
  name: string;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  lastConnected: Date | null;
  audioLevels: {
    input: { left: number; right: number; leftPeak: number; rightPeak: number };
    output: { left: number; right: number; leftPeak: number; rightPeak: number };
  };
  network: {
    latency: number;
    packetLoss: number;
    bandwidth: number;
    quality: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  };
  devices: {
    inputDevice: string;
    outputDevice: string;
    codec: string;
    sampleRate: number;
    bitDepth: number;
  };
  logs: ConnectionLog[];
}

// Connection log item component
const LogItem = ({ log }: { log: ConnectionLog }) => {
  // Format the timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Style based on log type
  const getLogStyle = (type: LogType) => {
    switch (type) {
      case 'info':
        return 'bg-blue-900/20 border-blue-800 text-blue-300';
      case 'warning':
        return 'bg-yellow-900/20 border-yellow-800 text-yellow-300';
      case 'error':
        return 'bg-red-900/20 border-red-800 text-red-300';
      case 'success':
        return 'bg-green-900/20 border-green-800 text-green-300';
      default:
        return 'bg-zinc-800 border-zinc-700 text-zinc-300';
    }
  };

  // Icon based on log type
  const getLogIcon = (type: LogType) => {
    switch (type) {
      case 'info':
        return <Activity className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'error':
        return <XCircle className="h-4 w-4" />;
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className={`flex p-2 my-1 border rounded ${getLogStyle(log.type)}`}>
      <div className="flex-shrink-0 mr-2 pt-1">
        {getLogIcon(log.type)}
      </div>
      <div className="flex-grow">
        <div className="text-xs opacity-80 mb-0.5">{formatTime(log.timestamp)}</div>
        <div className="text-sm">{log.message}</div>
      </div>
    </div>
  );
};

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function TechViewNew() {
  const { toast } = useToast();
  
  // Available audio devices for simulation
  const [availableDevices, setAvailableDevices] = useState<{
    inputs: { id: string; name: string }[];
    outputs: { id: string; name: string }[];
  }>({
    inputs: [
      { id: 'input-1', name: 'Built-in Microphone' },
      { id: 'input-2', name: 'Focusrite Scarlett 2i2 (Input)' },
      { id: 'input-3', name: 'Audio Interface ASIO (Input)' },
      { id: 'input-4', name: 'Dante Virtual Soundcard (Input)' },
      { id: 'input-5', name: 'RØDECaster Pro (Input)' }
    ],
    outputs: [
      { id: 'output-1', name: 'Built-in Speakers' },
      { id: 'output-2', name: 'Focusrite Scarlett 2i2 (Output)' },
      { id: 'output-3', name: 'Audio Interface ASIO (Output)' },
      { id: 'output-4', name: 'Dante Virtual Soundcard (Output)' },
      { id: 'output-5', name: 'RØDECaster Pro (Output)' }
    ]
  });
  
  // State for studio being configured in the dialog
  const [configStudio, setConfigStudio] = useState<string | null>(null);
  const [selectedInput, setSelectedInput] = useState<string>('');
  const [selectedOutput, setSelectedOutput] = useState<string>('');
  
  // Remote Studios data
  const [studios, setStudios] = useState<StudioMetrics[]>([
    {
      id: 'A',
      name: 'Studio A',
      connectionStatus: 'disconnected',
      lastConnected: null,
      audioLevels: {
        input: { left: 0, right: 0, leftPeak: -60, rightPeak: -60 },
        output: { left: 0, right: 0, leftPeak: -60, rightPeak: -60 }
      },
      network: {
        latency: 0,
        packetLoss: 0,
        bandwidth: 0,
        quality: 'excellent'
      },
      devices: {
        inputDevice: '',
        outputDevice: '',
        codec: 'Opus',
        sampleRate: 48000,
        bitDepth: 24
      },
      logs: []
    },
    {
      id: 'B',
      name: 'Studio B',
      connectionStatus: 'disconnected',
      lastConnected: null,
      audioLevels: {
        input: { left: 0, right: 0, leftPeak: -60, rightPeak: -60 },
        output: { left: 0, right: 0, leftPeak: -60, rightPeak: -60 }
      },
      network: {
        latency: 0,
        packetLoss: 0,
        bandwidth: 0,
        quality: 'excellent'
      },
      devices: {
        inputDevice: '',
        outputDevice: '',
        codec: 'Opus',
        sampleRate: 48000,
        bitDepth: 24
      },
      logs: []
    },
    {
      id: 'C',
      name: 'Studio C',
      connectionStatus: 'disconnected',
      lastConnected: null,
      audioLevels: {
        input: { left: 0, right: 0, leftPeak: -60, rightPeak: -60 },
        output: { left: 0, right: 0, leftPeak: -60, rightPeak: -60 }
      },
      network: {
        latency: 0,
        packetLoss: 0,
        bandwidth: 0,
        quality: 'excellent'
      },
      devices: {
        inputDevice: '',
        outputDevice: '',
        codec: 'Opus',
        sampleRate: 48000,
        bitDepth: 24
      },
      logs: []
    },
    {
      id: 'D',
      name: 'Studio D',
      connectionStatus: 'disconnected',
      lastConnected: null,
      audioLevels: {
        input: { left: 0, right: 0, leftPeak: -60, rightPeak: -60 },
        output: { left: 0, right: 0, leftPeak: -60, rightPeak: -60 }
      },
      network: {
        latency: 0,
        packetLoss: 0,
        bandwidth: 0,
        quality: 'excellent'
      },
      devices: {
        inputDevice: '',
        outputDevice: '',
        codec: 'Opus',
        sampleRate: 48000,
        bitDepth: 24
      },
      logs: []
    }
  ]);
  
  // Selected studio for detailed view
  const [selectedStudio, setSelectedStudio] = useState<string>('A');
  
  // Global system status
  const [systemStatus, setSystemStatus] = useState({
    activeConnections: 0,
    totalBandwidth: 0,
    systemTime: new Date(),
    cpuUsage: 0,
    memoryUsage: 0
  });
  
  // Demo interval ref
  const demoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Function to simulate audio levels and network metrics for demo purposes
  const startDemoSimulation = () => {
    // Clear any existing interval
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
    }
    
    // Initial connection of studios
    setStudios(prev => {
      const updated = [...prev];
      // Studio A connected
      updated[0] = {
        ...updated[0],
        connectionStatus: 'connected',
        lastConnected: new Date(),
        network: {
          ...updated[0].network,
          latency: 12 + Math.random() * 5,
          packetLoss: Math.random() * 0.3,
          bandwidth: 1500 + Math.random() * 200,
          quality: 'excellent'
        }
      };
      
      // Studio B connecting
      updated[1] = {
        ...updated[1],
        connectionStatus: 'connecting'
      };
      
      // Studio C with error
      updated[2] = {
        ...updated[2],
        connectionStatus: 'error',
        network: {
          ...updated[2].network,
          latency: 120 + Math.random() * 50,
          packetLoss: 5 + Math.random() * 8,
          bandwidth: 400 + Math.random() * 200,
          quality: 'critical'
        }
      };
      
      // Studio D disconnected
      updated[3] = {
        ...updated[3],
        connectionStatus: 'disconnected'
      };
      
      return updated;
    });
    
    // Set up an interval to update all metrics
    demoIntervalRef.current = setInterval(() => {
      setStudios(prev => {
        const updated = [...prev];
        
        // Update each studio
        updated.forEach((studio, index) => {
          if (studio.connectionStatus === 'connected') {
            // Generate random levels for connected studios
            const baseLeftLevel = 10 + Math.random() * 40;
            const baseRightLevel = 10 + Math.random() * 40;
            
            // Add random peaks occasionally
            const leftPeak = Math.random() > 0.9 ? baseLeftLevel + 20 : baseLeftLevel;
            const rightPeak = Math.random() > 0.9 ? baseRightLevel + 20 : baseRightLevel;
            
            // Convert to dB scale for peak display (-60 to 0 dB)
            const leftPeakDb = -60 + (leftPeak / 100 * 60);
            const rightPeakDb = -60 + (rightPeak / 100 * 60);
            
            // Update the studio metrics
            updated[index] = {
              ...studio,
              audioLevels: {
                input: {
                  left: baseLeftLevel,
                  right: baseRightLevel,
                  leftPeak: leftPeakDb,
                  rightPeak: rightPeakDb
                },
                output: {
                  left: baseRightLevel * 0.8,
                  right: baseLeftLevel * 0.8,
                  leftPeak: rightPeakDb - 5,
                  rightPeak: leftPeakDb - 5
                }
              },
              network: {
                ...studio.network,
                latency: Math.max(5, studio.network.latency + (Math.random() * 2 - 1)),
                packetLoss: Math.max(0, studio.network.packetLoss + (Math.random() * 0.2 - 0.1)),
                bandwidth: Math.max(500, studio.network.bandwidth + (Math.random() * 40 - 20))
              }
            };
            
            // Occasionally add logs
            if (Math.random() > 0.95) {
              const logTypes: LogType[] = ['info', 'warning', 'error', 'success'];
              const messages = [
                `Audio packet received (${Math.floor(Math.random() * 1000)} bytes)`,
                `Network jitter detected: ${(Math.random() * 10).toFixed(2)}ms`,
                `Codec adaptation: bitrate changed to ${Math.floor(Math.random() * 20 + 100)}kbps`,
                `Connection quality: ${studio.network.quality}`,
                `Buffer underrun detected, increasing buffer size`,
                `Remote endpoint acknowledged settings change`
              ];
              
              const randomType = logTypes[Math.floor(Math.random() * logTypes.length)];
              const randomMessage = messages[Math.floor(Math.random() * messages.length)];
              
              updated[index] = {
                ...updated[index],
                logs: [
                  {
                    timestamp: new Date(),
                    type: randomType,
                    message: randomMessage
                  },
                  ...updated[index].logs.slice(0, 20) // Keep last 20 logs
                ]
              };
            }
          }
          
          // Occasionally change studio B status
          if (index === 1 && Math.random() > 0.98) {
            if (studio.connectionStatus === 'connecting') {
              updated[1] = {
                ...studio,
                connectionStatus: 'connected',
                lastConnected: new Date(),
                network: {
                  ...studio.network,
                  latency: 20 + Math.random() * 10,
                  packetLoss: Math.random() * 1,
                  bandwidth: 1200 + Math.random() * 200,
                  quality: 'good'
                },
                logs: [
                  {
                    timestamp: new Date(),
                    type: 'success',
                    message: 'Connection established successfully'
                  },
                  ...studio.logs
                ]
              };
            }
          }
          
          // Update system metrics
          setSystemStatus(prev => ({
            ...prev,
            activeConnections: updated.filter(s => s.connectionStatus === 'connected').length,
            totalBandwidth: updated.reduce((sum, s) => sum + (s.connectionStatus === 'connected' ? s.network.bandwidth : 0), 0),
            systemTime: new Date(),
            cpuUsage: Math.min(100, Math.max(5, prev.cpuUsage + (Math.random() * 4 - 2))),
            memoryUsage: Math.min(100, Math.max(10, prev.memoryUsage + (Math.random() * 2 - 1)))
          }));
        });
        
        return updated;
      });
    }, 200);
  };
  
  // Update the component with useEffect to start the simulation
  useEffect(() => {
    // Start demo simulation on component mount
    startDemoSimulation();
    
    // Cleanup on unmount
    return () => {
      if (demoIntervalRef.current) {
        clearInterval(demoIntervalRef.current);
      }
    };
  }, []);

  // Function to get icon based on connection status
  const getConnectionStatusIcon = (status: StudioMetrics['connectionStatus']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'connecting':
        return <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'disconnected':
      default:
        return <XCircle className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Function to get color for studio based on ID
  const getStudioColor = (studioId: string) => {
    switch (studioId) {
      case 'A':
        return 'from-orange-600 to-orange-800';
      case 'B':
        return 'from-green-600 to-green-800';
      case 'C':
        return 'from-blue-600 to-blue-800';
      case 'D':
        return 'from-purple-600 to-purple-800';
      default:
        return 'from-gray-600 to-gray-800';
    }
  };
  
  // Function to handle studio connection toggle
  const handleToggleConnection = (studioId: string) => {
    setStudios(prev => {
      return prev.map(studio => {
        if (studio.id === studioId) {
          // If connected, disconnect. If disconnected, connect. If error, retry.
          let newStatus: StudioMetrics['connectionStatus'];
          
          if (studio.connectionStatus === 'connected') {
            newStatus = 'disconnected';
          } else if (studio.connectionStatus === 'disconnected' || studio.connectionStatus === 'error') {
            newStatus = 'connecting';
            
            // Simulate connecting to connected transition after a delay
            setTimeout(() => {
              setStudios(prev => {
                return prev.map(s => {
                  if (s.id === studioId && s.connectionStatus === 'connecting') {
                    return {
                      ...s,
                      connectionStatus: 'connected',
                      lastConnected: new Date(),
                      network: {
                        ...s.network,
                        latency: 15 + Math.random() * 10,
                        packetLoss: Math.random() * 0.5,
                        bandwidth: 1200 + Math.random() * 300,
                        quality: 'excellent'
                      },
                      logs: [
                        {
                          timestamp: new Date(),
                          type: 'success',
                          message: 'Connection established successfully'
                        },
                        ...s.logs
                      ]
                    };
                  }
                  return s;
                });
              });
            }, 2000);
          } else {
            // Keep connecting status
            return studio;
          }
          
          return {
            ...studio,
            connectionStatus: newStatus,
            logs: [
              {
                timestamp: new Date(),
                type: newStatus === 'disconnected' ? 'info' : 'warning',
                message: newStatus === 'disconnected' 
                  ? 'Remote connection closed by tech operator' 
                  : 'Initiating connection to remote studio...'
              },
              ...studio.logs
            ]
          };
        }
        return studio;
      });
    });
  };
  
  // Create Studio Card component
  // Function to open the device configuration dialog
  const openDeviceConfig = (studioId: string) => {
    const studio = studios.find(s => s.id === studioId);
    if (studio) {
      setConfigStudio(studioId);
      setSelectedInput(studio.devices.inputDevice || 'none');
      setSelectedOutput(studio.devices.outputDevice || 'none');
    }
  };
  
  // Function to save device configuration
  const saveDeviceConfig = () => {
    if (!configStudio) return;
    
    setStudios(prev => prev.map(studio => {
      if (studio.id === configStudio) {
        return {
          ...studio,
          devices: {
            ...studio.devices,
            inputDevice: selectedInput === 'none' ? '' : selectedInput,
            outputDevice: selectedOutput === 'none' ? '' : selectedOutput
          },
          logs: [
            {
              timestamp: new Date(),
              type: 'info',
              message: `Audio devices updated: ${selectedInput !== 'none' ? availableDevices.inputs.find(d => d.id === selectedInput)?.name : 'None'} (input), ${selectedOutput !== 'none' ? availableDevices.outputs.find(d => d.id === selectedOutput)?.name : 'None'} (output)`
            },
            ...studio.logs
          ]
        };
      }
      return studio;
    }));
    
    toast({
      title: "Devices Updated",
      description: `Audio devices for Studio ${configStudio} have been updated.`,
      variant: "default"
    });
    
    setConfigStudio(null);
  };

  const StudioCard = ({ studio }: { studio: StudioMetrics }) => {
    const bg = getStudioColor(studio.id);
    const isActive = studio.connectionStatus === 'connected';
    
    return (
      <Card className={`h-full border-0 overflow-hidden shadow-lg flex flex-col`}>
        <div className={`bg-gradient-to-r ${bg} p-4`}>
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              {getConnectionStatusIcon(studio.connectionStatus)}
              Studio {studio.id}
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost" 
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => openDeviceConfig(studio.id)}
                title="Configure Audio Devices"
              >
                <Sliders className="h-4 w-4" />
              </Button>
              <Button 
                variant={isActive ? "destructive" : "secondary"}
                size="sm"
                className={isActive ? "bg-opacity-90 hover:bg-opacity-100" : ""}
                onClick={() => handleToggleConnection(studio.id)}
                disabled={studio.connectionStatus === 'connecting'}
              >
                {studio.connectionStatus === 'connecting' ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    Connecting...
                  </>
                ) : isActive ? (
                  <>
                    <PhoneOff className="mr-1 h-3 w-3" />
                    Disconnect
                  </>
                ) : (
                  <>
                    <Phone className="mr-1 h-3 w-3" />
                    Connect
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
        
        <CardContent className="bg-gray-900 p-[17px] text-white flex-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-400 mb-1">Status</p>
              <p className={`text-sm font-semibold ${
                studio.connectionStatus === 'connected' ? 'text-green-400' :
                studio.connectionStatus === 'connecting' ? 'text-yellow-400' :
                studio.connectionStatus === 'error' ? 'text-red-400' :
                'text-gray-400'
              }`}>
                {studio.connectionStatus.charAt(0).toUpperCase() + studio.connectionStatus.slice(1)}
              </p>
            </div>
            
            <div>
              <p className="text-xs text-gray-400 mb-1">Last Connected</p>
              <p className="text-sm">
                {studio.lastConnected ? new Date(studio.lastConnected).toLocaleTimeString() : 'Never'}
              </p>
            </div>
            
            <div>
              <p className="text-xs text-gray-400 mb-1">Latency</p>
              <p className={`text-sm font-mono ${
                studio.network.latency < 50 ? 'text-green-400' :
                studio.network.latency < 100 ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {studio.connectionStatus === 'connected' ? 
                  `${studio.network.latency.toFixed(1)} ms` : 
                  '---'
                }
              </p>
            </div>
            
            <div>
              <p className="text-xs text-gray-400 mb-1">Packet Loss</p>
              <p className={`text-sm font-mono ${
                studio.network.packetLoss < 1 ? 'text-green-400' :
                studio.network.packetLoss < 5 ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {studio.connectionStatus === 'connected' ? 
                  `${studio.network.packetLoss.toFixed(2)}%` : 
                  '---'
                }
              </p>
            </div>
          </div>
          
          {/* Audio levels - always shown, but inactive state when not connected */}
          <div className="mt-4">
            <div className="flex items-center mb-2">
              <p className="text-xs text-gray-400 mr-2 w-12">Input</p>
              <div className="flex-1 h-4 bg-gray-800 rounded-sm overflow-hidden">
                <div className={`h-full transition-all ${isActive 
                  ? 'bg-gradient-to-r from-green-500 via-yellow-500 to-red-500' 
                  : 'bg-gray-700'}`}
                     style={{ width: isActive ? `${studio.audioLevels.input.left}%` : '0%' }}>
                </div>
              </div>
              <div className="ml-2 text-xs w-14 text-right">
                {isActive ? `${studio.audioLevels.input.leftPeak.toFixed(1)} dB` : 'Inactive'}
              </div>
            </div>
            
            <div className="flex items-center">
              <p className="text-xs text-gray-400 mr-2 w-12">Output</p>
              <div className="flex-1 h-4 bg-gray-800 rounded-sm overflow-hidden">
                <div className={`h-full transition-all ${isActive 
                  ? 'bg-gradient-to-r from-green-500 via-yellow-500 to-red-500' 
                  : 'bg-gray-700'}`}
                     style={{ width: isActive ? `${studio.audioLevels.output.left}%` : '0%' }}>
                </div>
              </div>
              <div className="ml-2 text-xs w-14 text-right">
                {isActive ? `${studio.audioLevels.output.leftPeak.toFixed(1)} dB` : 'Inactive'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  // Get the currently selected studio's details
  const selectedStudioData = studios.find(s => s.id === selectedStudio) || studios[0];

  return (
    <div className="w-full min-h-screen bg-gray-950 text-white p-4">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Remote Studio Tech Monitor</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${systemStatus.activeConnections > 0 ? 'bg-green-500' : 'bg-gray-500'}`}></div>
              <span className="text-sm">
                {systemStatus.activeConnections} Active {systemStatus.activeConnections === 1 ? 'Connection' : 'Connections'}
              </span>
            </div>
            <div className="text-sm text-gray-400">
              System Time: {systemStatus.systemTime.toLocaleTimeString()}
            </div>
            <Link to="/" className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 text-white px-3 py-1 rounded-md transition-colors">
              <Home className="h-4 w-4" />
              <span className="text-sm">Home</span>
            </Link>
          </div>
        </div>
        
        {/* Studios Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {studios.map(studio => (
            <div key={studio.id} onClick={() => setSelectedStudio(studio.id)} 
                 className={`cursor-pointer transform transition-transform duration-200 h-[270px] ${selectedStudio === studio.id ? 'scale-[1.02]' : 'scale-100'}`}>
              <StudioCard studio={studio} />
            </div>
          ))}
        </div>
        
        {/* Detailed View for Selected Studio */}
        {selectedStudioData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Audio Levels and Processing */}
            <Card className="bg-gray-900 text-white lg:col-span-2 flex flex-col">
              <CardHeader className={`bg-gradient-to-r ${getStudioColor(selectedStudioData.id)}`}>
                <CardTitle className="text-white flex items-center gap-2">
                  {getConnectionStatusIcon(selectedStudioData.connectionStatus)}
                  Studio {selectedStudioData.id} Audio
                </CardTitle>
              </CardHeader>
              <CardContent className="p-[17px] flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Input Levels */}
                  <div>
                    <h3 className="text-sm font-medium mb-3">Input Levels</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-gray-400">Left Channel</span>
                          <span className="text-xs font-mono">
                            {selectedStudioData.connectionStatus === 'connected' ? 
                              `${selectedStudioData.audioLevels.input.leftPeak.toFixed(1)} dB` : 
                              '---'
                            }
                          </span>
                        </div>
                        <div className="h-6 bg-gray-800 rounded-sm overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all"
                            style={{ width: `${selectedStudioData.audioLevels.input.left}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-gray-400">Right Channel</span>
                          <span className="text-xs font-mono">
                            {selectedStudioData.connectionStatus === 'connected' ? 
                              `${selectedStudioData.audioLevels.input.rightPeak.toFixed(1)} dB` : 
                              '---'
                            }
                          </span>
                        </div>
                        <div className="h-6 bg-gray-800 rounded-sm overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all"
                            style={{ width: `${selectedStudioData.audioLevels.input.right}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Output Levels */}
                  <div>
                    <h3 className="text-sm font-medium mb-3">Output Levels</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-gray-400">Left Channel</span>
                          <span className="text-xs font-mono">
                            {selectedStudioData.connectionStatus === 'connected' ? 
                              `${selectedStudioData.audioLevels.output.leftPeak.toFixed(1)} dB` : 
                              '---'
                            }
                          </span>
                        </div>
                        <div className="h-6 bg-gray-800 rounded-sm overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all"
                            style={{ width: `${selectedStudioData.audioLevels.output.left}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-gray-400">Right Channel</span>
                          <span className="text-xs font-mono">
                            {selectedStudioData.connectionStatus === 'connected' ? 
                              `${selectedStudioData.audioLevels.output.rightPeak.toFixed(1)} dB` : 
                              '---'
                            }
                          </span>
                        </div>
                        <div className="h-6 bg-gray-800 rounded-sm overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 transition-all"
                            style={{ width: `${selectedStudioData.audioLevels.output.right}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Audio Processing Controls */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium mb-3">Device Configuration</h3>
                    <div className="space-y-3 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Audio Codec</p>
                          <p>{selectedStudioData.devices.codec}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Sample Rate</p>
                          <p>{selectedStudioData.devices.sampleRate} Hz</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Bit Depth</p>
                          <p>{selectedStudioData.devices.bitDepth} bit</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Bandwidth</p>
                          <p>
                            {selectedStudioData.connectionStatus === 'connected' ? 
                              `${Math.round(selectedStudioData.network.bandwidth)} kbps` : 
                              '---'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-3">Network Quality</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-gray-400">Latency</span>
                          <span className={`text-xs font-mono ${
                            selectedStudioData.network.latency < 50 ? 'text-green-400' :
                            selectedStudioData.network.latency < 100 ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {selectedStudioData.connectionStatus === 'connected' ? 
                              `${selectedStudioData.network.latency.toFixed(1)} ms` : 
                              '---'
                            }
                          </span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all ${
                              selectedStudioData.network.latency < 50 
                                ? "bg-gradient-to-r from-green-500 to-green-400" 
                                : selectedStudioData.network.latency < 100
                                  ? "bg-gradient-to-r from-yellow-500 to-yellow-400"
                                  : "bg-gradient-to-r from-red-500 to-red-400"
                            }`}
                            style={{ 
                              width: `${selectedStudioData.connectionStatus === 'connected' ? 
                                Math.min(100, selectedStudioData.network.latency / 2) : 0}%` 
                            }}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-gray-400">Packet Loss</span>
                          <span className={`text-xs font-mono ${
                            selectedStudioData.network.packetLoss < 1 ? 'text-green-400' :
                            selectedStudioData.network.packetLoss < 5 ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {selectedStudioData.connectionStatus === 'connected' ? 
                              `${selectedStudioData.network.packetLoss.toFixed(2)}%` : 
                              '---'
                            }
                          </span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all ${
                              selectedStudioData.network.packetLoss < 1 
                                ? "bg-gradient-to-r from-green-500 to-green-400" 
                                : selectedStudioData.network.packetLoss < 5
                                  ? "bg-gradient-to-r from-yellow-500 to-yellow-400"
                                  : "bg-gradient-to-r from-red-500 to-red-400"
                            }`}
                            style={{ 
                              width: `${selectedStudioData.connectionStatus === 'connected' ? 
                                Math.min(100, selectedStudioData.network.packetLoss * 10) : 0}%` 
                            }}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-gray-400">Connection Quality</span>
                          <span className={`text-xs font-mono ${
                            selectedStudioData.network.quality === 'excellent' ? 'text-green-400' :
                            selectedStudioData.network.quality === 'good' ? 'text-green-400' :
                            selectedStudioData.network.quality === 'fair' ? 'text-yellow-400' :
                            selectedStudioData.network.quality === 'poor' ? 'text-orange-400' :
                            'text-red-400'
                          }`}>
                            {selectedStudioData.connectionStatus === 'connected' ? 
                              selectedStudioData.network.quality.charAt(0).toUpperCase() + 
                              selectedStudioData.network.quality.slice(1) : 
                              '---'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Control buttons */}
                <div className="mt-6 flex flex-wrap gap-2">
                  <Button
                    variant={selectedStudioData.connectionStatus === 'connected' ? "destructive" : "default"}
                    onClick={() => handleToggleConnection(selectedStudioData.id)}
                    disabled={selectedStudioData.connectionStatus === 'connecting'}
                    className="flex-1"
                  >
                    {selectedStudioData.connectionStatus === 'connecting' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : selectedStudioData.connectionStatus === 'connected' ? (
                      <>
                        <PhoneOff className="mr-2 h-4 w-4" />
                        Disconnect Studio {selectedStudioData.id}
                      </>
                    ) : (
                      <>
                        <Phone className="mr-2 h-4 w-4" />
                        Connect Studio {selectedStudioData.id}
                      </>
                    )}
                  </Button>
                  
                  <Button variant="outline" disabled={selectedStudioData.connectionStatus !== 'connected'}>
                    <RotateCw className="mr-2 h-4 w-4" />
                    Reset Connection
                  </Button>
                  
                  <Button variant="outline" disabled={selectedStudioData.connectionStatus !== 'connected'}>
                    <Settings className="mr-2 h-4 w-4" />
                    Configure Codec
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Connection Log */}
            <Card className="bg-gray-900 text-white flex flex-col">
              <CardHeader className={`bg-gradient-to-r ${getStudioColor(selectedStudioData.id)}`}>
                <CardTitle className="text-white flex justify-between w-full">
                  <span className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Connection Log
                  </span>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-6 w-6 text-white/80 hover:text-white hover:bg-white/20"
                    onClick={() => {
                      setStudios(prev => prev.map(s => 
                        s.id === selectedStudioData.id ? { ...s, logs: [] } : s
                      ));
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-[17px] flex-1">
                <div className="h-[420px] overflow-y-auto text-sm pr-2 space-y-2">
                  {selectedStudioData.logs.length === 0 ? (
                    <div className="text-gray-400 italic text-center py-6">No connection logs available</div>
                  ) : (
                    selectedStudioData.logs.map((log, index) => (
                      <LogItem key={index} log={log} />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      
      {/* Device Configuration Dialog */}
      <Dialog open={configStudio !== null} onOpenChange={(open) => !open && setConfigStudio(null)}>
        <DialogContent className="sm:max-w-[425px] bg-gray-900 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>Audio Device Configuration</DialogTitle>
            <DialogDescription className="text-gray-400">
              Configure input and output audio devices for Studio {configStudio}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="input-device" className="text-right">
                Input Device
              </Label>
              <Select
                value={selectedInput}
                onValueChange={setSelectedInput}
              >
                <SelectTrigger className="col-span-3 bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Select input device" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="none">None</SelectItem>
                  {availableDevices.inputs.map(device => (
                    <SelectItem key={device.id} value={device.id}>
                      {device.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="output-device" className="text-right">
                Output Device
              </Label>
              <Select
                value={selectedOutput}
                onValueChange={setSelectedOutput}
              >
                <SelectTrigger className="col-span-3 bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Select output device" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="none">None</SelectItem>
                  {availableDevices.outputs.map(device => (
                    <SelectItem key={device.id} value={device.id}>
                      {device.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Current device badges */}
            {configStudio && (
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Current Input:</span>
                  <Badge variant="outline" className="bg-gray-800">
                    {studios.find(s => s.id === configStudio)?.devices.inputDevice && 
                     studios.find(s => s.id === configStudio)?.devices.inputDevice !== 'none'
                      ? availableDevices.inputs.find(d => d.id === studios.find(s => s.id === configStudio)?.devices.inputDevice)?.name
                      : 'None'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Current Output:</span>
                  <Badge variant="outline" className="bg-gray-800">
                    {studios.find(s => s.id === configStudio)?.devices.outputDevice && 
                     studios.find(s => s.id === configStudio)?.devices.outputDevice !== 'none'
                      ? availableDevices.outputs.find(d => d.id === studios.find(s => s.id === configStudio)?.devices.outputDevice)?.name
                      : 'None'}
                  </Badge>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              type="submit" 
              onClick={saveDeviceConfig}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
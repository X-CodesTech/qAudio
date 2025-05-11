import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  SelectGroup,
  SelectLabel
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { 
  RefreshCw, 
  Mic, 
  Headphones,
  Power,
  Activity,
  BarChart3,
  Wifi,
  Clock,
  AlertCircle,
  CheckCircle2,
  InfoIcon,
  Loader2,
  LucideXCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Define types for connection logs
type LogType = 'info' | 'warning' | 'error' | 'success';

interface ConnectionLog {
  timestamp: Date;
  type: LogType;
  message: string;
}

// Define type for the WebSocket message
interface WebSocketMessage {
  type: string;
  data?: any;
}

// Define AudioMonitor component that will display audio levels
const AudioMonitor = ({ 
  leftLevel = 0, 
  rightLevel = 0, 
  leftPeak = -60, 
  rightPeak = -60 
}: { 
  leftLevel: number; 
  rightLevel: number; 
  leftPeak: number; 
  rightPeak: number; 
}) => {
  return (
    <div className="bg-black p-2 rounded border border-gray-800">
      <div className="flex justify-between mb-1 text-xs text-gray-500">
        <span>Level</span>
        <span>Peak: L: {leftPeak.toFixed(1)} dB R: {rightPeak.toFixed(1)} dB</span>
      </div>
      <div className="flex gap-1 mb-1">
        <div className="h-3 w-full bg-gray-900 rounded-sm overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500" 
            style={{ width: `${leftLevel}%` }}
          />
        </div>
        <div className="h-3 w-full bg-gray-900 rounded-sm overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500" 
            style={{ width: `${rightLevel}%` }}
          />
        </div>
      </div>
    </div>
  );
};

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
        return <InfoIcon className="h-4 w-4" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4" />;
      case 'error':
        return <LucideXCircle className="h-4 w-4" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <InfoIcon className="h-4 w-4" />;
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

export default function TechView() {
  const { toast } = useToast();
  
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
  
  // Global audio device state
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [isDetectingDevices, setIsDetectingDevices] = useState(false);
  
  // Global system status
  const [systemStatus, setSystemStatus] = useState({
    activeConnections: 0,
    totalBandwidth: 0,
    systemTime: new Date(),
    cpuUsage: 0,
    memoryUsage: 0
  });
  
  // Audio processing settings
  const [inputVolume, setInputVolume] = useState<number>(100);
  const [outputVolume, setOutputVolume] = useState<number>(100);
  const [stereoMixEnabled, setStereoMixEnabled] = useState<boolean>(true);
  const [monitorVolume, setMonitorVolume] = useState<number>(50);
  
  // WebSocket reference
  const wsConnection = useRef<WebSocket | null>(null);
  const wsConnectedRef = useRef<boolean>(false);
  const manuallyClosedRef = useRef<boolean>(false);
  const reconnectAttemptRef = useRef<number>(0);
  const maxReconnectAttempts = 5;
  
  // WebRTC references
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const pollingIntervalRef = useRef<number | null>(null);
  
  // Audio processing nodes
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioAnalyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const inputGainNodeRef = useRef<GainNode | null>(null);
  const outputGainNodeRef = useRef<GainNode | null>(null);
  const monitorGainNodeRef = useRef<GainNode | null>(null);
  const destinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
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
  
  // Function to detect available audio devices
  const getAudioDevices = async () => {
    setIsDetectingDevices(true);
    try {
      // Request permission to access audio devices
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Get list of available devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      // Filter audio input devices (microphones)
      const inputs = devices.filter(device => device.kind === 'audioinput');
      console.log("Detected audio input devices:", inputs);
      setAudioInputDevices(inputs);
      
      // If there's a default device, select it
      if (inputs.length > 0 && (!selectedInputDevice || selectedInputDevice === '')) {
        setSelectedInputDevice(inputs[0].deviceId);
      }
      
      // Filter audio output devices (speakers, headphones)
      const outputs = devices.filter(device => device.kind === 'audiooutput');
      console.log("Detected audio output devices:", outputs);
      setAudioOutputDevices(outputs);
      
      // If there's a default device, select it
      if (outputs.length > 0 && (!selectedOutputDevice || selectedOutputDevice === '')) {
        setSelectedOutputDevice(outputs[0].deviceId);
      }
      
      // Add to connection logs
      setConnectionLogs(prev => [
        { timestamp: new Date(), type: 'info', message: `Detected ${inputs.length} input and ${outputs.length} output devices` },
        ...prev
      ]);
      
      toast({
        title: "Audio devices detected",
        description: `Found ${inputs.length} input and ${outputs.length} output devices`,
      });
    } catch (error) {
      console.error('Error accessing media devices:', error);
      
      // Add to connection logs
      setConnectionLogs(prev => [
        { timestamp: new Date(), type: 'error', message: `Failed to access audio devices: ${(error as Error).message}` },
        ...prev
      ]);
      
      toast({
        title: "Error detecting audio devices",
        description: "Please ensure you've given browser permission to access your microphone.",
        variant: "destructive",
      });
    } finally {
      setIsDetectingDevices(false);
    }
  };
  
  // Setup WebSocket connection
  const setupWebSocket = () => {
    if (wsConnection.current && wsConnection.current.readyState === WebSocket.OPEN) {
      console.log("WebSocket already open, skipping setup");
      return;
    }

    manuallyClosedRef.current = false;

    try {
      // Get the correct WebSocket URL based on the current window location
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      // Create new WebSocket connection
      console.log("Initializing WebSocket connection to:", wsUrl);
      wsConnection.current = new WebSocket(wsUrl);
      
      // Connection established
      wsConnection.current.onopen = () => {
        console.log("WebSocket connection established");
        wsConnectedRef.current = true;
        reconnectAttemptRef.current = 0;
        
        // Authenticate as tech role
        if (wsConnection.current && wsConnection.current.readyState === WebSocket.OPEN) {
          wsConnection.current.send(JSON.stringify({
            type: 'authenticate',
            role: 'tech',
            studioId: 'RE' // For connecting with RE Studio
          }));
          
          console.log("Sent authentication request to WebSocket server");
        }
        
        // Add to connection logs
        setConnectionLogs(prev => [
          { timestamp: new Date(), type: 'success', message: 'WebSocket connection established for signaling' },
          ...prev
        ]);
      };
      
      // Connection closed
      wsConnection.current.onclose = () => {
        console.log("WebSocket connection closed");
        wsConnectedRef.current = false;
        
        // Add to connection logs
        setConnectionLogs(prev => [
          { timestamp: new Date(), type: 'warning', message: 'WebSocket connection closed' },
          ...prev
        ]);
        
        // Attempt to reconnect if not manually closed
        if (!manuallyClosedRef.current && reconnectAttemptRef.current < maxReconnectAttempts) {
          reconnectAttemptRef.current++;
          const delay = Math.min(1000 * reconnectAttemptRef.current, 5000);
          
          // Add to connection logs
          setConnectionLogs(prev => [
            { 
              timestamp: new Date(), 
              type: 'info', 
              message: `Reconnecting in ${delay / 1000} seconds (attempt ${reconnectAttemptRef.current}/${maxReconnectAttempts})` 
            },
            ...prev
          ]);
          
          setTimeout(setupWebSocket, delay);
        }
      };
      
      // Error occurred
      wsConnection.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        
        // Add to connection logs
        setConnectionLogs(prev => [
          { timestamp: new Date(), type: 'error', message: 'WebSocket connection error' },
          ...prev
        ]);
      };
      
      // Message received
      wsConnection.current.onmessage = (event) => {
        const message = JSON.parse(event.data) as WebSocketMessage;
        console.log("WebSocket message received:", message);
        
        // Process different message types
        if (message.type === 'authentication_success') {
          console.log("WebSocket authentication successful");
          
          // Add to connection logs
          setConnectionLogs(prev => [
            { timestamp: new Date(), type: 'success', message: 'WebSocket authentication successful' },
            ...prev
          ]);
          
        } else if (message.type === 'rtc-offer') {
          console.log("Received WebRTC offer:", message.data);
          
          // Add to connection logs
          setConnectionLogs(prev => [
            { timestamp: new Date(), type: 'info', message: 'Received connection request from RE Studio' },
            ...prev
          ]);
          
          // Process the offer
          handleIncomingOffer(message.data);
          
        } else if (message.type === 'rtc-ice-candidate' && peerConnectionRef.current) {
          console.log("Received ICE candidate:", message.data);
          
          // Process the ICE candidate
          try {
            peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(message.data))
              .then(() => {
                console.log("Added remote ICE candidate successfully");
              })
              .catch(err => {
                console.error("Error adding received ICE candidate:", err);
              });
          } catch (error) {
            console.error("Error processing ICE candidate:", error);
          }
          
        } else if (message.type === 'network-stats') {
          // Update network statistics
          if (message.data) {
            setLatency(message.data.latency || 0);
            setPacketLoss(message.data.packetLoss || 0);
          }
        }
      };
    } catch (error) {
      console.error("Error setting up WebSocket:", error);
      
      // Add to connection logs
      setConnectionLogs(prev => [
        { timestamp: new Date(), type: 'error', message: `Failed to setup WebSocket: ${(error as Error).message}` },
        ...prev
      ]);
    }
  };
  
  // Create a WebRTC peer connection
  const createPeerConnection = () => {
    try {
      // Create new RTCPeerConnection with STUN servers
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });
      
      // Handle ICE candidates
      pc.onicecandidate = event => {
        if (event.candidate) {
          console.log("Generated ICE candidate:", event.candidate);
          
          // Send ICE candidate to RE Studio via WebSocket
          if (wsConnection.current && wsConnection.current.readyState === WebSocket.OPEN) {
            wsConnection.current.send(JSON.stringify({
              type: 'rtc-ice-candidate',
              data: event.candidate,
              studioId: 'RE',
              fromTech: true
            }));
            console.log("Sent ICE candidate via WebSocket");
          } else {
            // Fallback to HTTP for sending ICE candidates
            console.log("WebSocket not open, using HTTP fallback for ICE candidate");
            sendIceCandidateViaHttp(event.candidate);
          }
        }
      };
      
      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        console.log("Connection state changed:", pc.connectionState);
        
        // Add to connection logs
        setConnectionLogs(prev => [
          { timestamp: new Date(), type: 'info', message: `WebRTC connection state: ${pc.connectionState}` },
          ...prev
        ]);
        
        if (pc.connectionState === 'connected') {
          setIsConnected(true);
          
          // Add to connection logs
          setConnectionLogs(prev => [
            { timestamp: new Date(), type: 'success', message: 'WebRTC connection established with RE Studio' },
            ...prev
          ]);
          
          // Start HTTP polling for network stats
          startNetworkStatsPolling();
          
        } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          setIsConnected(false);
          setAudioActive(false);
          
          // Add to connection logs
          setConnectionLogs(prev => [
            { timestamp: new Date(), type: 'warning', message: `WebRTC connection ${pc.connectionState}` },
            ...prev
          ]);
          
          // Cleanup audio processing
          cleanupAudioProcessing();
        }
      };
      
      // Handle incoming audio tracks
      pc.ontrack = event => {
        console.log("Received track from RE Studio:", event.track.kind);
        
        // Create a new MediaStream with received tracks
        const remoteStream = new MediaStream();
        event.streams[0].getTracks().forEach(track => {
          remoteStream.addTrack(track);
        });
        
        // Store the remote stream
        remoteStreamRef.current = remoteStream;
        
        // Connect to audio element
        if (audioElementRef.current) {
          audioElementRef.current.srcObject = remoteStream;
        }
        
        // Set up audio processing for the remote stream
        setupAudioProcessing(remoteStream);
        
        setIsConnected(true);
        setAudioActive(true);
        
        // Add to connection logs
        setConnectionLogs(prev => [
          { timestamp: new Date(), type: 'success', message: 'RE Studio audio stream connected' },
          ...prev
        ]);
      };
      
      peerConnectionRef.current = pc;
      return pc;
    } catch (error) {
      console.error("Error creating peer connection:", error);
      
      // Add to connection logs
      setConnectionLogs(prev => [
        { timestamp: new Date(), type: 'error', message: `Failed to create WebRTC connection: ${(error as Error).message}` },
        ...prev
      ]);
      
      return null;
    }
  };
  
  // Handle incoming WebRTC offer
  const handleIncomingOffer = async (offerData: any) => {
    try {
      console.log("Processing WebRTC offer:", offerData);
      
      // Create peer connection if it doesn't exist
      if (!peerConnectionRef.current) {
        createPeerConnection();
      }
      
      const peerConnection = peerConnectionRef.current;
      if (!peerConnection) {
        throw new Error('Failed to create WebRTC connection');
      }
      
      // Set up local audio stream from selected input device
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: selectedInputDevice ? { exact: selectedInputDevice } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      // Store the local stream
      localStreamRef.current = micStream;
      
      // Add local audio tracks to peer connection
      micStream.getAudioTracks().forEach(track => {
        peerConnection.addTrack(track, micStream);
      });
      
      // Set the remote description from the offer
      await peerConnection.setRemoteDescription(new RTCSessionDescription({
        type: 'offer',
        sdp: offerData.sdp
      }));
      
      // Create an answer
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      // Send the answer back to RE Studio via WebSocket
      if (wsConnection.current && wsConnection.current.readyState === WebSocket.OPEN) {
        wsConnection.current.send(JSON.stringify({
          type: 'rtc-answer',
          data: peerConnection.localDescription,
          studioId: 'RE'
        }));
        console.log("Sent WebRTC answer via WebSocket");
      } else {
        // Fallback to HTTP
        console.log("WebSocket not open, using HTTP fallback for answer");
        sendAnswerViaHttp(peerConnection.localDescription);
      }
      
      // Add to connection logs
      setConnectionLogs(prev => [
        { timestamp: new Date(), type: 'info', message: 'Sent connection response to RE Studio' },
        ...prev
      ]);
    } catch (error) {
      console.error("Error handling incoming offer:", error);
      
      // Add to connection logs
      setConnectionLogs(prev => [
        { timestamp: new Date(), type: 'error', message: `Error processing connection request: ${(error as Error).message}` },
        ...prev
      ]);
    }
  };
  
  // Set up audio processing for visualization
  const setupAudioProcessing = (stream: MediaStream) => {
    try {
      if (!stream) return;
      
      // Create audio context if needed
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const audioContext = audioContextRef.current;
      
      // Clean up existing connections
      cleanupAudioProcessing();
      
      // Create media source from stream
      const source = audioContext.createMediaStreamSource(stream);
      audioSourceRef.current = source;
      
      // Create input gain node
      const inputGain = audioContext.createGain();
      inputGain.gain.value = inputVolume / 100;
      inputGainNodeRef.current = inputGain;
      
      // Create output gain node
      const outputGain = audioContext.createGain();
      outputGain.gain.value = outputVolume / 100;
      outputGainNodeRef.current = outputGain;
      
      // Create analyzer for visualization
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 2048;
      analyzer.smoothingTimeConstant = 0.8;
      audioAnalyserRef.current = analyzer;
      
      // Create destination for output
      const destination = audioContext.createMediaStreamDestination();
      destinationRef.current = destination;
      
      // Connect nodes:
      // source -> inputGain -> analyzer -> outputGain -> destination
      source.connect(inputGain);
      inputGain.connect(analyzer);
      analyzer.connect(outputGain);
      
      // If stereo mix is enabled, connect to both output and internal monitor
      if (stereoMixEnabled) {
        // Create monitor gain node for headphone mix
        const monitorGain = audioContext.createGain();
        monitorGain.gain.value = monitorVolume / 100;
        monitorGainNodeRef.current = monitorGain;
        
        // Connect output to monitor gain for headphone mix
        outputGain.connect(monitorGain);
        
        // Connect monitor gain to audio context destination for local monitoring
        monitorGain.connect(audioContext.destination);
      }
      
      // Connect output gain to destination
      outputGain.connect(destination);
      
      // Create data array for analyzer
      const bufferLength = analyzer.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      dataArrayRef.current = dataArray;
      
      // Set up visualization loop
      const updateMeters = () => {
        if (!audioAnalyserRef.current || !dataArrayRef.current) return;
        
        // Get the audio data
        audioAnalyserRef.current.getByteFrequencyData(dataArrayRef.current);
        
        // Calculate average level (simplistic approach)
        const avg = Array.from(dataArrayRef.current).reduce((sum, val) => sum + val, 0) / dataArrayRef.current.length;
        
        // Normalize to percentage (0-100)
        const level = Math.min(100, (avg / 255) * 100);
        
        // Calculate peak in dB (rough approximation)
        const peakDb = 20 * Math.log10(avg / 255);
        
        // Update state with the new values - use left/right for stereo visualization
        setLeftChannelLevel(level);
        setRightChannelLevel(level * 0.9); // Slightly different for visual effect
        setLeftPeak(peakDb || -60);
        setRightPeak((peakDb || -60) - 2); // Slightly different for visual effect
        
        // Request next frame if still active
        if (isConnected) {
          requestAnimationFrame(updateMeters);
        }
      };
      
      // Start the visualization loop
      updateMeters();
      
      setAudioActive(true);
      
      // Add connection log entry
      setConnectionLogs(prev => [
        { timestamp: new Date(), type: 'info', message: 'Audio processing connected to RE Studio stream' },
        ...prev
      ]);
    } catch (error) {
      console.error('Error setting up audio processing:', error);
      
      // Add to connection logs
      setConnectionLogs(prev => [
        { timestamp: new Date(), type: 'error', message: `Failed to set up audio processing: ${(error as Error).message}` },
        ...prev
      ]);
    }
  };
  
  // Clean up audio processing
  const cleanupAudioProcessing = () => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.disconnect();
      } catch (error) {
        console.error('Error disconnecting audio source:', error);
      }
      audioSourceRef.current = null;
    }
    
    if (inputGainNodeRef.current) {
      try {
        inputGainNodeRef.current.disconnect();
      } catch (error) {
        console.error('Error disconnecting input gain:', error);
      }
      inputGainNodeRef.current = null;
    }
    
    if (outputGainNodeRef.current) {
      try {
        outputGainNodeRef.current.disconnect();
      } catch (error) {
        console.error('Error disconnecting output gain:', error);
      }
      outputGainNodeRef.current = null;
    }
    
    if (monitorGainNodeRef.current) {
      try {
        monitorGainNodeRef.current.disconnect();
      } catch (error) {
        console.error('Error disconnecting monitor gain:', error);
      }
      monitorGainNodeRef.current = null;
    }
    
    if (audioAnalyserRef.current) {
      try {
        audioAnalyserRef.current.disconnect();
      } catch (error) {
        console.error('Error disconnecting analyzer:', error);
      }
      audioAnalyserRef.current = null;
    }
    
    if (destinationRef.current) {
      try {
        destinationRef.current.disconnect();
      } catch (error) {
        console.error('Error disconnecting destination:', error);
      }
      destinationRef.current = null;
    }
    
    dataArrayRef.current = null;
  };
  
  // Send WebRTC answer via HTTP fallback
  const sendAnswerViaHttp = async (answer: RTCSessionDescription | null) => {
    if (!answer) return;
    
    try {
      const response = await fetch('/api/rtc/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answer,
          studioId: 'RE'
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      console.log('TechView: Sent WebRTC answer via HTTP fallback');
    } catch (error) {
      console.error('TechView: Failed to send answer via HTTP:', error);
      
      // Add to connection logs
      setConnectionLogs(prev => [
        { timestamp: new Date(), type: 'error', message: `Failed to send connection response: ${(error as Error).message}` },
        ...prev
      ]);
    }
  };
  
  // Send ICE candidate via HTTP fallback
  const sendIceCandidateViaHttp = async (candidate: RTCIceCandidate) => {
    try {
      const response = await fetch('/api/rtc/ice-candidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate,
          studioId: 'RE'
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      console.log('TechView: Sent ICE candidate via HTTP fallback');
    } catch (error) {
      console.error('TechView: Failed to send ICE candidate via HTTP:', error);
    }
  };
  
  // Start polling for network statistics
  const startNetworkStatsPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    // Poll every 2 seconds
    pollingIntervalRef.current = window.setInterval(async () => {
      if (peerConnectionRef.current && peerConnectionRef.current.connectionState === 'connected') {
        try {
          // Get connection stats
          const stats = await peerConnectionRef.current.getStats();
          
          // Process stats to extract network metrics
          let currentLatency = 0;
          let currentPacketLoss = 0;
          
          stats.forEach(report => {
            if (report.type === 'transport') {
              // RTT (Round Trip Time) is the latency
              if (report.currentRoundTripTime) {
                currentLatency = report.currentRoundTripTime * 1000; // Convert to ms
              }
            }
            
            if (report.type === 'inbound-rtp' && report.kind === 'audio') {
              // Calculate packet loss
              if (report.packetsLost !== undefined && report.packetsReceived !== undefined) {
                const total = report.packetsLost + report.packetsReceived;
                if (total > 0) {
                  currentPacketLoss = (report.packetsLost / total) * 100;
                }
              }
            }
          });
          
          // Update state with network metrics
          setLatency(currentLatency);
          setPacketLoss(currentPacketLoss);
        } catch (error) {
          console.error('Error getting WebRTC stats:', error);
        }
      }
    }, 2000);
  };
  
  // Initialize on component mount
  useEffect(() => {
    console.log('TechView initialized');
    
    // Detect audio devices
    getAudioDevices();
    
    // Set up WebSocket connection
    setupWebSocket();
    
    // Add event listener for device changes
    navigator.mediaDevices.addEventListener('devicechange', getAudioDevices);
    
    // Clean up on unmount
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', getAudioDevices);
      
      // Close WebSocket
      if (wsConnection.current) {
        manuallyClosedRef.current = true;
        wsConnection.current.close();
        wsConnection.current = null;
      }
      
      // Close peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      
      // Clean up audio processing
      cleanupAudioProcessing();
      
      // Clean up local stream tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Clear intervals
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      
      console.log('TechView cleanup');
    };
  }, []);
  
  // Update audio processing when volume changes
  useEffect(() => {
    if (inputGainNodeRef.current) {
      inputGainNodeRef.current.gain.value = inputVolume / 100;
    }
    
    if (outputGainNodeRef.current) {
      outputGainNodeRef.current.gain.value = outputVolume / 100;
    }
    
    if (monitorGainNodeRef.current) {
      monitorGainNodeRef.current.gain.value = monitorVolume / 100;
    }
  }, [inputVolume, outputVolume, monitorVolume]);
  
  // Handle connection to RE Studio
  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      
      // Validate device selections
      if (!selectedInputDevice || !selectedOutputDevice) {
        throw new Error('Please select input and output devices');
      }
      
      // Add to connection logs
      setConnectionLogs(prev => [
        { timestamp: new Date(), type: 'info', message: 'Connecting to RE Studio...' },
        ...prev
      ]);
      
      // Use direct HTTP API endpoint instead of WebSocket
      try {
        const response = await fetch('/api/re-studio/connect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            inputDeviceId: selectedInputDevice,
            outputDeviceId: selectedOutputDevice,
            inputVolume,
            outputVolume,
            stereoMixEnabled,
            monitorVolume
          }),
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Connection request result:', result);
        
        // Add to connection logs
        setConnectionLogs(prev => [
          { timestamp: new Date(), type: 'info', message: 'Connection request sent to RE Studio' },
          ...prev
        ]);

        // Create peer connection
        if (!peerConnectionRef.current) {
          createPeerConnection();
        }
        
        // For demo purposes, simulate a successful connection after a delay
        setTimeout(() => {
          setIsConnected(true);
          setAudioActive(true);
          setIsConnecting(false);
          
          // Simulate audio levels
          startDemoAudioLevels();
          
          // Add to connection logs
          setConnectionLogs(prev => [
            { timestamp: new Date(), type: 'success', message: 'Connection established with RE Studio' },
            ...prev
          ]);
          
          toast({
            title: "Connected to RE Studio",
            description: "Audio stream established successfully",
          });
        }, 2000);
        
      } catch (apiError: any) {
        console.error('API connection error:', apiError);
        throw new Error(`API connection failed: ${apiError?.message || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.error('Error connecting to RE Studio:', error);
      setIsConnecting(false);
      
      // Add to connection logs
      setConnectionLogs(prev => [
        { timestamp: new Date(), type: 'error', message: `Connection failed: ${(error as Error).message}` },
        ...prev
      ]);
      
      toast({
        title: "Connection failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };
  
  // Handle disconnection from RE Studio
  const handleDisconnect = async () => {
    try {
      // Close peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      
      // Stop local audio tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      
      // Clean up remote stream
      if (remoteStreamRef.current) {
        remoteStreamRef.current.getTracks().forEach(track => track.stop());
        remoteStreamRef.current = null;
      }
      
      // Clean up audio processing
      cleanupAudioProcessing();
      
      // Clear audio element
      if (audioElementRef.current) {
        audioElementRef.current.srcObject = null;
      }
      
      // Use direct HTTP API endpoint instead of WebSocket
      try {
        const response = await fetch('/api/re-studio/disconnect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (!response.ok) {
          console.warn(`Server responded with status: ${response.status} when disconnecting`);
        }
      } catch (apiError: any) {
        console.error('API disconnection error:', apiError);
      }
      
      // Stop demo audio levels
      if (demoIntervalRef.current) {
        clearInterval(demoIntervalRef.current);
        demoIntervalRef.current = null;
      }
      
      // Update connection state
      setIsConnected(false);
      setAudioActive(false);
      
      // Add to connection logs
      setConnectionLogs(prev => [
        { timestamp: new Date(), type: 'info', message: 'Disconnected from RE Studio' },
        ...prev
      ]);
      
      toast({
        title: "Disconnected from RE Studio",
        description: "Audio stream closed",
      });
    } catch (error) {
      console.error('Error disconnecting from RE Studio:', error);
      
      // Add to connection logs
      setConnectionLogs(prev => [
        { timestamp: new Date(), type: 'error', message: `Disconnection error: ${(error as Error).message}` },
        ...prev
      ]);
    }
  };
  
  // Update device status styles
  const getStatusStyle = (isActive: boolean) => {
    return isActive ? 'bg-green-500 text-green-300' : 'bg-red-500 text-red-300';
  };

  return (
    <div className="container mx-auto p-4">
      {/* Hidden audio element for remote audio playback */}
      <audio ref={audioElementRef} autoPlay playsInline className="hidden" />
      
      <Tabs defaultValue="audio" className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="audio">
            <Headphones className="h-4 w-4 mr-2" />
            Audio Connection
          </TabsTrigger>
          <TabsTrigger value="monitoring">
            <BarChart3 className="h-4 w-4 mr-2" />
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="logs">
            <InfoIcon className="h-4 w-4 mr-2" />
            Connection Logs
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="audio" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>RE Studio Audio Connection</CardTitle>
              <CardDescription>Configure and connect to RE Studio audio stream</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Audio Device Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Input Device */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Mic className="h-4 w-4" />
                    <span className="text-sm font-medium">Microphone Input</span>
                  </div>
                  <Select
                    value={selectedInputDevice}
                    onValueChange={(value) => setSelectedInputDevice(value)}
                    disabled={isConnected || isConnecting || isDetectingDevices}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select microphone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Available Microphones</SelectLabel>
                        {audioInputDevices.length === 0 && (
                          <SelectItem value="none">No microphones detected</SelectItem>
                        )}
                        {audioInputDevices.map((device) => (
                          <SelectItem key={device.deviceId} value={device.deviceId}>
                            {device.label || `Microphone ${device.deviceId.substring(0, 5)}`}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Output Device */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Headphones className="h-4 w-4" />
                    <span className="text-sm font-medium">Speaker Output</span>
                  </div>
                  <Select
                    value={selectedOutputDevice}
                    onValueChange={(value) => setSelectedOutputDevice(value)}
                    disabled={isConnected || isConnecting || isDetectingDevices}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select speakers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Available Speakers</SelectLabel>
                        {audioOutputDevices.length === 0 && (
                          <SelectItem value="none">No speakers detected</SelectItem>
                        )}
                        {audioOutputDevices.map((device) => (
                          <SelectItem key={device.deviceId} value={device.deviceId}>
                            {device.label || `Speaker ${device.deviceId.substring(0, 5)}`}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Audio Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                {/* Input Volume */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Input Volume</span>
                    <span className="text-sm text-gray-400">{inputVolume}%</span>
                  </div>
                  <Slider 
                    value={[inputVolume]} 
                    onValueChange={(value) => setInputVolume(value[0])}
                    min={0}
                    max={200}
                    step={1}
                    disabled={!isConnected}
                  />
                </div>
                
                {/* Output Volume */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Output Volume</span>
                    <span className="text-sm text-gray-400">{outputVolume}%</span>
                  </div>
                  <Slider 
                    value={[outputVolume]} 
                    onValueChange={(value) => setOutputVolume(value[0])}
                    min={0}
                    max={200}
                    step={1}
                    disabled={!isConnected}
                  />
                </div>
              </div>
              
              {/* Stereo Mix Settings */}
              <div className="pt-4 border-t border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-medium">Stereo Mix Monitoring</h4>
                    <p className="text-xs text-gray-400">Hear what you're sending to RE Studio in your headphones</p>
                  </div>
                  <Switch 
                    checked={stereoMixEnabled}
                    onCheckedChange={setStereoMixEnabled}
                    disabled={!isConnected}
                  />
                </div>
                
                {stereoMixEnabled && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Monitor Volume</span>
                      <span className="text-sm text-gray-400">{monitorVolume}%</span>
                    </div>
                    <Slider 
                      value={[monitorVolume]} 
                      onValueChange={(value) => setMonitorVolume(value[0])}
                      min={0}
                      max={100}
                      step={1}
                      disabled={!isConnected || !stereoMixEnabled}
                    />
                  </div>
                )}
              </div>
              
              {/* Connection Controls */}
              <div className="flex flex-wrap gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={getAudioDevices}
                  disabled={isDetectingDevices}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isDetectingDevices ? 'animate-spin' : ''}`} />
                  {isDetectingDevices ? 'Detecting...' : 'Refresh Devices'}
                </Button>
                
                {!isConnected ? (
                  <Button
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleConnect}
                    disabled={isConnecting || !selectedInputDevice || !selectedOutputDevice}
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Power className="h-4 w-4 mr-2" />
                        Connect to RE Studio
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    onClick={handleDisconnect}
                  >
                    <Power className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                )}
                
                <div className="flex items-center ml-4 gap-2">
                  <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Audio Monitor Panel */}
          <Card className={isConnected ? '' : 'opacity-50'}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <Activity className="h-4 w-4 mr-2" />
                Audio Levels
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AudioMonitor 
                leftLevel={leftChannelLevel} 
                rightLevel={rightChannelLevel}
                leftPeak={leftPeak}
                rightPeak={rightPeak}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="monitoring">
          <Card>
            <CardHeader>
              <CardTitle>Performance Monitoring</CardTitle>
              <CardDescription>Monitor connection quality and audio performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Connection Status */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium mb-2">Connection Status</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center justify-between rounded bg-gray-800 p-2">
                      <span className="text-xs">WebRTC</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${isConnected ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                        {isConnected ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded bg-gray-800 p-2">
                      <span className="text-xs">Audio</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${audioActive ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                        {audioActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded bg-gray-800 p-2">
                      <span className="text-xs">SignalR</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${wsConnectedRef.current ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                        {wsConnectedRef.current ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded bg-gray-800 p-2">
                      <span className="text-xs">Stereo Mix</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${stereoMixEnabled ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>
                        {stereoMixEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Network Stats */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium mb-2">Network Statistics</h3>
                  <div className="space-y-4">
                    {/* Latency */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-xs">Latency</span>
                        </div>
                        <span className="text-xs font-medium">{latency.toFixed(1)} ms</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-800 rounded overflow-hidden">
                        <div 
                          className={`h-full ${latency > 200 ? "bg-red-500" : latency > 100 ? "bg-yellow-500" : "bg-green-500"}`}
                          style={{ width: `${Math.min(100, (latency / 500) * 100)}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Packet Loss */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Wifi className="h-3 w-3 text-gray-400" />
                          <span className="text-xs">Packet Loss</span>
                        </div>
                        <span className="text-xs font-medium">{packetLoss.toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-800 rounded overflow-hidden">
                        <div 
                          className={`h-full ${packetLoss > 5 ? "bg-red-500" : packetLoss > 1 ? "bg-yellow-500" : "bg-green-500"}`}
                          style={{ width: `${Math.min(100, packetLoss * 5)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="text-xs text-gray-400 border-t border-gray-800 pt-4">
              Network statistics are only available when connected to RE Studio
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Connection Logs</CardTitle>
              <CardDescription>View detailed connection events and diagnostics</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] border border-gray-800 rounded p-2">
                {connectionLogs.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 italic">
                    No connection logs yet. Connect to RE Studio to see logs.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {connectionLogs.map((log, index) => (
                      <LogItem key={index} log={log} />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setConnectionLogs([])}
                disabled={connectionLogs.length === 0}
              >
                Clear Logs
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
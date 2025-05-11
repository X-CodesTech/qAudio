import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Activity, BarChart, Waves, Radio, Wifi, Maximize2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

// Custom styles to be applied
const goldAccent = '#e6a305';
const darkBg = '#1a1a1a';
const mediumBg = '#2a2a2a';
const graphBg = '#111111';
const enabledGreen = '#22c55e'; // Green color for enabled buttons

// Helper function to generate random data (for fallback use)
const generateRandomData = (length: number, min: number, max: number) => {
  return Array.from({ length }, () => Math.floor(Math.random() * (max - min + 1)) + min);
};

// Frequency bands for the spectrum analyzer
const frequencyBands = [
  20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000,
  1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500, 16000, 20000
];

// Interface for the component
interface AnalyzerSectionProps {
  onSave?: () => void;
}

interface AudioDevice {
  deviceId: string;
  label: string;
  kind: string;
}

const AnalyzerSection: React.FC<AnalyzerSectionProps> = ({ onSave }) => {
  const { toast } = useToast();
  // State for active tab
  const [activeTab, setActiveTab] = useState<string>('spectrum');
  
  // State for audio devices
  const [audioInputDevices, setAudioInputDevices] = useState<AudioDevice[]>([]);
  const [selectedInputDevice, setSelectedInputDevice] = useState<string>('');
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  
  // State for analyzer settings
  const [analyzerSettings, setAnalyzerSettings] = useState({
    source: 'input',
    fftSize: 4096,
    smoothing: 0.8,
    minDecibels: -100,
    maxDecibels: 0,
    peakHold: true,
    showAverage: true,
    logarithmic: true,
    stereoSeparate: true,
    refreshRate: 60
  });
  
  // State for the analyzer data
  const [spectrumData, setSpectrumData] = useState<number[]>([]);
  const [leftSpectrumData, setLeftSpectrumData] = useState<number[]>([]);
  const [rightSpectrumData, setRightSpectrumData] = useState<number[]>([]);
  const [peakLeft, setPeakLeft] = useState<number>(-24);
  const [peakRight, setPeakRight] = useState<number>(-26);
  const [rmsLeft, setRmsLeft] = useState<number>(-32);
  const [rmsRight, setRmsRight] = useState<number>(-34);
  const [lufs, setLufs] = useState<number>(-23);
  const [stereoCorrelation, setStereoCorrelation] = useState<number>(0.85);
  const [dynamicRange, setDynamicRange] = useState<number>(14);
  
  // Phase data for goniometer
  const [phaseData, setPhaseData] = useState<Array<{x: number, y: number}>>([]);
  
  // Canvas refs for the visualizations
  const spectrumCanvasRef = useRef<HTMLCanvasElement>(null);
  const goniometerCanvasRef = useRef<HTMLCanvasElement>(null);
  const oscilloscopeCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Audio analysis refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerNodeRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  // For fallback demo mode in case no audio devices are available
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get available audio devices
  const detectAudioDevices = async () => {
    try {
      // Request permission to access audio devices
      let tempStream: MediaStream | null = null;
      try {
        tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (permissionError) {
        console.warn('Permission to use microphone was denied', permissionError);
        toast({
          title: "Microphone Access Required",
          description: "Please allow microphone access to use the audio analyzer features.",
          variant: "destructive",
        });
        return;
      }
      
      // Get list of available devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      // Filter audio input devices (microphones)
      const inputs = devices.filter(device => device.kind === 'audioinput');
      console.log("Detected audio input devices:", inputs);
      
      const formattedInputs = inputs.map(device => ({
        deviceId: device.deviceId,
        label: device.label || `Microphone (${device.deviceId.substring(0, 8)}...)`,
        kind: device.kind
      }));
      
      setAudioInputDevices(formattedInputs);
      
      // If there's a default device, select it
      if (formattedInputs.length > 0 && (!selectedInputDevice || selectedInputDevice === '')) {
        setSelectedInputDevice(formattedInputs[0].deviceId);
      }
      
      // Stop the temporary stream
      if (tempStream) {
        tempStream.getTracks().forEach(track => track.stop());
      }
      
      toast({
        title: "Audio Devices Detected",
        description: `Found ${formattedInputs.length} audio input devices.`,
      });
    } catch (error) {
      console.error('Error accessing media devices:', error);
      toast({
        title: "Error",
        description: "Failed to detect audio devices. Please check your system permissions.",
        variant: "destructive",
      });
    }
  };
  
  // Update analyzer source
  const updateSource = (source: string) => {
    setAnalyzerSettings(prev => ({ ...prev, source }));
  };
  
  // Toggle analyzer settings
  const toggleSetting = (setting: keyof typeof analyzerSettings) => {
    setAnalyzerSettings(prev => ({
      ...prev,
      [setting]: typeof prev[setting] === 'boolean' ? !prev[setting] : prev[setting]
    }));
  };
  
  // Update number setting
  const updateSetting = (setting: keyof typeof analyzerSettings, value: number | string) => {
    setAnalyzerSettings(prev => ({
      ...prev,
      [setting]: typeof value === 'string' ? parseInt(value, 10) : value
    }));
    
    // Update analyzer node settings if it exists
    if (analyzerNodeRef.current && setting === 'fftSize') {
      analyzerNodeRef.current.fftSize = typeof value === 'string' ? parseInt(value, 10) : value;
    } else if (analyzerNodeRef.current && setting === 'smoothing') {
      analyzerNodeRef.current.smoothingTimeConstant = typeof value === 'number' ? value : parseFloat(value);
    } else if (analyzerNodeRef.current && setting === 'minDecibels') {
      analyzerNodeRef.current.minDecibels = typeof value === 'number' ? value : parseFloat(value);
    } else if (analyzerNodeRef.current && setting === 'maxDecibels') {
      analyzerNodeRef.current.maxDecibels = typeof value === 'number' ? value : parseFloat(value);
    }
  };
  
  // Helper function to draw the spectrum analyzer
  const drawSpectrumAnalyzer = () => {
    const canvas = spectrumCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Background
    ctx.fillStyle = graphBg;
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    
    // Vertical grid lines (frequency)
    const octaves = [31.5, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
    octaves.forEach(freq => {
      const x = Math.log10(freq / 20) / Math.log10(20000 / 20) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      
      // Label
      ctx.fillStyle = '#666666';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(freq >= 1000 ? `${freq/1000}k` : `${freq}`, x, height - 5);
    });
    
    // Horizontal grid lines (amplitude)
    for (let db = 0; db >= -60; db -= 10) {
      const y = (1 - db / analyzerSettings.minDecibels) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      
      // Label
      ctx.fillStyle = '#666666';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${db} dB`, width - 5, y + 3);
    }
    
    // Draw left channel spectrum
    if (analyzerSettings.stereoSeparate) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0, 150, 255, 0.8)';
      ctx.lineWidth = 2;
      
      leftSpectrumData.forEach((value, i) => {
        const x = i / (leftSpectrumData.length - 1) * width;
        const y = (1 - (value - analyzerSettings.minDecibels) / 
          (analyzerSettings.maxDecibels - analyzerSettings.minDecibels)) * height;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
      
      // Draw right channel spectrum
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)';
      ctx.lineWidth = 2;
      
      rightSpectrumData.forEach((value, i) => {
        const x = i / (rightSpectrumData.length - 1) * width;
        const y = (1 - (value - analyzerSettings.minDecibels) / 
          (analyzerSettings.maxDecibels - analyzerSettings.minDecibels)) * height;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    } else {
      // Draw combined spectrum
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(100, 255, 100, 0.8)';
      ctx.lineWidth = 2;
      
      spectrumData.forEach((value, i) => {
        const x = i / (spectrumData.length - 1) * width;
        const y = (1 - (value - analyzerSettings.minDecibels) / 
          (analyzerSettings.maxDecibels - analyzerSettings.minDecibels)) * height;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    }
    
    // Draw peak lines
    if (analyzerSettings.peakHold) {
      // Get the highest value at each x position
      const peakLine = Array(width).fill(analyzerSettings.minDecibels);
      
      leftSpectrumData.forEach((value, i) => {
        const x = Math.floor(i / (leftSpectrumData.length - 1) * width);
        if (x >= 0 && x < width && value > peakLine[x]) {
          peakLine[x] = value;
        }
      });
      
      rightSpectrumData.forEach((value, i) => {
        const x = Math.floor(i / (rightSpectrumData.length - 1) * width);
        if (x >= 0 && x < width && value > peakLine[x]) {
          peakLine[x] = value;
        }
      });
      
      // Draw peak hold line
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
      ctx.lineWidth = 1;
      
      peakLine.forEach((value, x) => {
        if (value > analyzerSettings.minDecibels) {
          const y = (1 - (value - analyzerSettings.minDecibels) / 
            (analyzerSettings.maxDecibels - analyzerSettings.minDecibels)) * height;
          
          ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
          ctx.fillRect(x, y, 1, 2);
        }
      });
    }
  };
  
  // Helper function to draw the goniometer (phase scope)
  const drawGoniometer = () => {
    const canvas = goniometerCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Background
    ctx.fillStyle = graphBg;
    ctx.fillRect(0, 0, width, height);
    
    // Draw outer circle
    ctx.beginPath();
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Draw coordinate lines
    ctx.beginPath();
    ctx.strokeStyle = '#444444';
    
    // Horizontal line (left/right)
    ctx.moveTo(centerX - radius, centerY);
    ctx.lineTo(centerX + radius, centerY);
    
    // Vertical line (mono)
    ctx.moveTo(centerX, centerY - radius);
    ctx.lineTo(centerX, centerY + radius);
    
    // 45 degree lines (out of phase)
    ctx.moveTo(centerX - radius * Math.cos(Math.PI / 4), centerY - radius * Math.sin(Math.PI / 4));
    ctx.lineTo(centerX + radius * Math.cos(Math.PI / 4), centerY + radius * Math.sin(Math.PI / 4));
    ctx.moveTo(centerX - radius * Math.cos(Math.PI / 4), centerY + radius * Math.sin(Math.PI / 4));
    ctx.lineTo(centerX + radius * Math.cos(Math.PI / 4), centerY - radius * Math.sin(Math.PI / 4));
    
    ctx.stroke();
    
    // Labels
    ctx.fillStyle = '#666666';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('L', centerX - radius - 10, centerY);
    ctx.fillText('R', centerX + radius + 10, centerY);
    ctx.fillText('M', centerX, centerY - radius - 10);
    ctx.fillText('S', centerX, centerY + radius + 10);
    
    // Draw correlation indicator
    const correlationText = stereoCorrelation.toFixed(2);
    const correlationColor = 
      stereoCorrelation > 0.9 ? '#00ff00' : 
      stereoCorrelation > 0.5 ? '#ffff00' : 
      stereoCorrelation > 0 ? '#ff9900' : '#ff0000';
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Correlation: ${correlationText}`, centerX, height - 20);
    
    ctx.beginPath();
    ctx.strokeStyle = correlationColor;
    ctx.lineWidth = 3;
    const corrBarWidth = 80;
    const corrBarX = centerX - corrBarWidth / 2;
    const corrBarY = height - 10;
    ctx.moveTo(corrBarX, corrBarY);
    ctx.lineTo(corrBarX + corrBarWidth * (stereoCorrelation * 0.5 + 0.5), corrBarY);
    ctx.stroke();
    
    // Plot audio data points
    ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
    ctx.lineWidth = 1;
    
    phaseData.forEach(point => {
      const x = centerX + point.x * radius;
      const y = centerY + point.y * radius;
      
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, 2 * Math.PI);
      ctx.fill();
    });
  };
  
  // Helper function to draw the oscilloscope
  const drawOscilloscope = () => {
    const canvas = oscilloscopeCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Background
    ctx.fillStyle = graphBg;
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = i * height / 4;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const x = i * width / 10;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Generate some waveform data (simulated)
    const samples = 1000;
    const waveformLeft = generateRandomData(samples, -50, 50);
    const waveformRight = generateRandomData(samples, -50, 50);
    
    // Draw left channel waveform
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(0, 150, 255, 0.8)';
    ctx.lineWidth = 2;
    
    waveformLeft.forEach((value, i) => {
      const x = i / (samples - 1) * width;
      const y = centerY - (value / 100 * centerY);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    
    // Draw right channel waveform
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)';
    ctx.lineWidth = 2;
    
    waveformRight.forEach((value, i) => {
      const x = i / (samples - 1) * width;
      const y = centerY - (value / 100 * centerY);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
  };
  
  // Draw level meters
  const drawLevelMeters = (
    context: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    value: number, 
    peakValue: number, 
    minDb: number, 
    maxDb: number
  ) => {
    // Draw meter background
    context.fillStyle = graphBg;
    context.fillRect(x, y, width, height);
    
    // Draw meter scale
    context.strokeStyle = '#333333';
    context.lineWidth = 1;
    
    // Scale marks
    for (let db = maxDb; db >= minDb; db -= 3) {
      const yPos = y + height * (1 - (db - minDb) / (maxDb - minDb));
      
      context.beginPath();
      context.moveTo(x, yPos);
      context.lineTo(x + width, yPos);
      context.stroke();
      
      // Add labels every 6 dB
      if (db % 6 === 0) {
        context.fillStyle = '#666666';
        context.font = '9px sans-serif';
        context.textAlign = 'right';
        context.fillText(`${db}`, x - 2, yPos + 3);
      }
    }
    
    // Calculate meter level height
    const levelHeight = height * (value - minDb) / (maxDb - minDb);
    const peakHeight = height * (peakValue - minDb) / (maxDb - minDb);
    
    // Draw level
    const gradient = context.createLinearGradient(0, y + height, 0, y);
    gradient.addColorStop(0, '#00ff00');
    gradient.addColorStop(0.7, '#ffff00');
    gradient.addColorStop(0.9, '#ff9900');
    gradient.addColorStop(1, '#ff0000');
    
    context.fillStyle = gradient;
    context.fillRect(x, y + height - levelHeight, width, levelHeight);
    
    // Draw peak indicator
    context.fillStyle = '#ffffff';
    context.fillRect(x, y + height - peakHeight - 1, width, 2);
  };
  
  // Draw the meters
  const drawMeters = () => {
    const canvas = document.getElementById('metersCanvas') as HTMLCanvasElement;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Background
    ctx.fillStyle = graphBg;
    ctx.fillRect(0, 0, width, height);
    
    // Draw left channel meter
    const meterWidth = 20;
    const meterSpacing = 20;
    const metersStartX = (width - (meterWidth * 2 + meterSpacing)) / 2;
    
    drawLevelMeters(
      ctx,
      metersStartX,
      10,
      meterWidth,
      height - 80,
      rmsLeft,
      peakLeft,
      -60,
      0
    );
    
    // Draw right channel meter
    drawLevelMeters(
      ctx,
      metersStartX + meterWidth + meterSpacing,
      10,
      meterWidth,
      height - 80,
      rmsRight,
      peakRight,
      -60,
      0
    );
    
    // Draw LUFS meter
    const lufsWidth = 30;
    const lufsX = (width - lufsWidth) / 2;
    const lufsY = height - 60;
    const lufsHeight = 40;
    
    ctx.fillStyle = graphBg;
    ctx.fillRect(lufsX, lufsY, lufsWidth, lufsHeight);
    
    // LUFS gradient
    const lufsGradient = ctx.createLinearGradient(lufsX, lufsY, lufsX + lufsWidth, lufsY);
    lufsGradient.addColorStop(0, '#ff0000');
    lufsGradient.addColorStop(0.2, '#ff9900');
    lufsGradient.addColorStop(0.4, '#ffff00');
    lufsGradient.addColorStop(0.6, '#00ff00');
    lufsGradient.addColorStop(0.8, '#00aaff');
    lufsGradient.addColorStop(1, '#0000ff');
    
    // Calculate position based on LUFS value
    const lufsPos = (lufs + 30) / 30; // Map -30 to 0 LUFS to 0-1
    const lufsWidth2 = lufsWidth * Math.min(1, Math.max(0, lufsPos));
    
    ctx.fillStyle = lufsGradient;
    ctx.fillRect(lufsX, lufsY, lufsWidth2, lufsHeight);
    
    // LUFS border
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    ctx.strokeRect(lufsX, lufsY, lufsWidth, lufsHeight);
    
    // LUFS value
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${lufs.toFixed(1)} LUFS`, width / 2, lufsY + lufsHeight + 15);
    
    // Draw labels
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('L', metersStartX + meterWidth / 2, height - 65);
    ctx.fillText('R', metersStartX + meterWidth + meterSpacing + meterWidth / 2, height - 65);
    
    // Display RMS values
    ctx.fillText(`${rmsLeft.toFixed(1)} dB`, metersStartX + meterWidth / 2, height - 50);
    ctx.fillText(`${rmsRight.toFixed(1)} dB`, metersStartX + meterWidth + meterSpacing + meterWidth / 2, height - 50);
    
    // Display Peak values
    ctx.fillText(`Peak: ${peakLeft.toFixed(1)} dB`, metersStartX + meterWidth / 2, height - 35);
    ctx.fillText(`Peak: ${peakRight.toFixed(1)} dB`, metersStartX + meterWidth + meterSpacing + meterWidth / 2, height - 35);
  };
  
  // Draw the dynamic range meter
  const drawDynamicRangeMeter = () => {
    const canvas = document.getElementById('dynamicRangeCanvas') as HTMLCanvasElement;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Background
    ctx.fillStyle = graphBg;
    ctx.fillRect(0, 0, width, height);
    
    // Draw scale
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    
    // Draw scale marks
    const maxDR = 24;
    for (let dr = 0; dr <= maxDR; dr += 3) {
      const x = width * dr / maxDR;
      
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      
      // Add labels every 6 dB
      if (dr % 6 === 0) {
        ctx.fillStyle = '#666666';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${dr}`, x, height - 5);
      }
    }
    
    // Draw dynamic range value
    const drWidth = width * Math.min(1, dynamicRange / maxDR);
    
    // DR gradient
    const drGradient = ctx.createLinearGradient(0, 0, width, 0);
    drGradient.addColorStop(0, '#ff0000');
    drGradient.addColorStop(0.33, '#ffff00');
    drGradient.addColorStop(0.67, '#00ff00');
    drGradient.addColorStop(1, '#00ffff');
    
    ctx.fillStyle = drGradient;
    ctx.fillRect(0, height / 4, drWidth, height / 2);
    
    // Draw dynamic range text
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Dynamic Range: ${dynamicRange.toFixed(1)} dB`, width / 2, height / 2 + 5);
    
    // Label
    ctx.fillStyle = '#888888';
    ctx.font = '10px sans-serif';
    ctx.fillText('DR (dB)', width / 2, 12);
  };
  
  // Start audio analysis from the selected input device
  const startAudioAnalysis = async () => {
    try {
      if (!selectedInputDevice) {
        toast({
          title: "No Input Device Selected",
          description: "Please select an audio input device first.",
          variant: "destructive",
        });
        return;
      }
      
      // Stop any existing analysis
      stopAudioAnalysis();
      
      // Request access to the selected audio device
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: selectedInputDevice },
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });
      
      // Create audio context and analyzer
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyzerNode = audioContext.createAnalyser();
      
      // Configure analyzer based on settings
      analyzerNode.fftSize = analyzerSettings.fftSize;
      analyzerNode.smoothingTimeConstant = analyzerSettings.smoothing;
      analyzerNode.minDecibels = analyzerSettings.minDecibels;
      analyzerNode.maxDecibels = analyzerSettings.maxDecibels;
      
      // Create source node from the audio stream
      const sourceNode = audioContext.createMediaStreamSource(stream);
      sourceNode.connect(analyzerNode);
      
      // Save references
      audioContextRef.current = audioContext;
      analyzerNodeRef.current = analyzerNode;
      sourceNodeRef.current = sourceNode;
      setAudioStream(stream);
      setIsAnalyzing(true);
      
      // Start animation frame for real-time analysis
      updateAnalyzerData();
      
      toast({
        title: "Audio Analysis Started",
        description: "Receiving real-time audio data from selected device.",
      });
    } catch (error) {
      console.error('Error starting audio analysis:', error);
      toast({
        title: "Error",
        description: "Failed to start audio analysis. Please check permissions.",
        variant: "destructive",
      });
    }
  };
  
  // Stop audio analysis
  const stopAudioAnalysis = () => {
    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Close audio stream
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      setAudioStream(null);
    }
    
    // Clean up audio context
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      audioContextRef.current = null;
    }
    
    setIsAnalyzing(false);
  };
  
  // Process real-time audio data
  const updateAnalyzerData = () => {
    if (!analyzerNodeRef.current || !isAnalyzing) return;
    
    const analyzer = analyzerNodeRef.current;
    
    // Update data based on active tab
    if (activeTab === 'spectrum') {
      // Get frequency data
      const frequencyData = new Uint8Array(analyzer.frequencyBinCount);
      analyzer.getByteFrequencyData(frequencyData);
      
      // Convert to dB values
      const frequencyDataDb = Array.from(frequencyData).map(value => 
        analyzer.minDecibels + (value / 255) * (analyzer.maxDecibels - analyzer.minDecibels)
      );
      
      // Set spectrum data
      // For demo, split into left/right channels (in reality we'd need a dual-channel analyzer)
      setSpectrumData(frequencyDataDb);
      setLeftSpectrumData(frequencyDataDb.map(v => v - Math.random() * 3)); // Slight variation for stereo effect
      setRightSpectrumData(frequencyDataDb.map(v => v - Math.random() * 3));
    }
    
    if (activeTab === 'phase' || activeTab === 'scope') {
      // Get time domain data for phase and oscilloscope
      const timeData = new Uint8Array(analyzer.fftSize);
      analyzer.getByteTimeDomainData(timeData);
      
      // Calculate correlation and phase data
      let correlation = 0;
      const phasePoints: Array<{x: number, y: number}> = [];
      
      // For demo, generate phase data based on time domain
      // In reality, we'd need separate left/right channels
      for (let i = 0; i < timeData.length - 1; i += 2) {
        const x = (timeData[i] / 128) - 1;     // Convert to -1 to 1
        const y = (timeData[i+1] / 128) - 1;   // Convert to -1 to 1
        
        correlation += x * y; // Simplified correlation calculation
        
        if (i % 10 === 0) { // Reduce number of points for performance
          phasePoints.push({ x, y });
        }
      }
      
      // Update phase data and correlation
      setPhaseData(phasePoints);
      
      // Normalize correlation
      correlation = correlation / (timeData.length / 2);
      setStereoCorrelation(correlation);
    }
    
    // Calculate levels (RMS and peak)
    const timeData = new Float32Array(analyzer.fftSize);
    analyzer.getFloatTimeDomainData(timeData);
    
    let sumSquaresLeft = 0;
    let sumSquaresRight = 0;
    let peakL = 0;
    let peakR = 0;
    
    // For demo, split array in half for left/right channel simulation
    const leftChannel = timeData.slice(0, timeData.length / 2);
    const rightChannel = timeData.slice(timeData.length / 2);
    
    // Calculate RMS and peak
    leftChannel.forEach(sample => {
      sumSquaresLeft += sample * sample;
      peakL = Math.max(peakL, Math.abs(sample));
    });
    
    rightChannel.forEach(sample => {
      sumSquaresRight += sample * sample;
      peakR = Math.max(peakR, Math.abs(sample));
    });
    
    // Convert to dB
    const rmsL = sumSquaresLeft / leftChannel.length;
    const rmsR = sumSquaresRight / rightChannel.length;
    
    const rmsLeftDb = rmsL > 0 ? 20 * Math.log10(Math.sqrt(rmsL)) : -100;
    const rmsRightDb = rmsR > 0 ? 20 * Math.log10(Math.sqrt(rmsR)) : -100;
    const peakLeftDb = peakL > 0 ? 20 * Math.log10(peakL) : -100;
    const peakRightDb = peakR > 0 ? 20 * Math.log10(peakR) : -100;
    
    // Update state values
    setRmsLeft(rmsLeftDb);
    setRmsRight(rmsRightDb);
    setPeakLeft(peakLeftDb);
    setPeakRight(peakRightDb);
    
    // Estimate LUFS (simplified)
    const estimatedLufs = Math.max(-70, (rmsLeftDb + rmsRightDb) / 2 + 10);
    setLufs(estimatedLufs);
    
    // Calculate dynamic range (simplified)
    const averageRms = (rmsLeftDb + rmsRightDb) / 2;
    const averagePeak = (peakLeftDb + peakRightDb) / 2;
    const range = Math.max(0, averagePeak - averageRms);
    setDynamicRange(Math.min(24, range * 1.5)); // Scale for better visualization
    
    // Draw visualization
    drawVisualization();
    
    // Schedule next update
    animationFrameRef.current = requestAnimationFrame(updateAnalyzerData);
  };
  
  // Draw the appropriate visualization based on the active tab
  const drawVisualization = () => {
    switch (activeTab) {
      case 'spectrum':
        drawSpectrumAnalyzer();
        break;
      case 'phase':
        drawGoniometer();
        break;
      case 'scope':
        drawOscilloscope();
        break;
      case 'meters':
        drawMeters();
        break;
      case 'dr':
        drawDynamicRangeMeter();
        break;
    }
  };
  
  // Effect to detect audio devices on mount
  useEffect(() => {
    detectAudioDevices();
    
    // Listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', detectAudioDevices);
    
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', detectAudioDevices);
      stopAudioAnalysis();
    };
  }, []);
  
  // Effect to handle tab changes
  useEffect(() => {
    // If analyzing, update the visualization on tab change
    if (isAnalyzing) {
      drawVisualization();
    } else {
      // Otherwise use fallback demo data
      if (!audioStream) {
        // Generate random data for visualization
        const demoSpectrumData = frequencyBands.map(() => 
          Math.random() * (analyzerSettings.maxDecibels - analyzerSettings.minDecibels) * 0.5 + analyzerSettings.minDecibels);
        
        setSpectrumData(demoSpectrumData);
        setLeftSpectrumData(demoSpectrumData.map(v => v - Math.random() * 3));
        setRightSpectrumData(demoSpectrumData.map(v => v - Math.random() * 3));
        
        drawVisualization();
      }
    }
  }, [activeTab]);
  
  // Resize canvas on mount and window resize
  useEffect(() => {
    const resizeCanvas = () => {
      const spectrumCanvas = spectrumCanvasRef.current;
      const goniometerCanvas = goniometerCanvasRef.current;
      const oscilloscopeCanvas = oscilloscopeCanvasRef.current;
      const metersCanvas = document.getElementById('metersCanvas') as HTMLCanvasElement;
      const dynamicRangeCanvas = document.getElementById('dynamicRangeCanvas') as HTMLCanvasElement;
      
      if (spectrumCanvas) {
        const container = spectrumCanvas.parentElement;
        if (container) {
          spectrumCanvas.width = container.clientWidth;
          spectrumCanvas.height = 300;
        }
      }
      
      if (goniometerCanvas) {
        const container = goniometerCanvas.parentElement;
        if (container) {
          goniometerCanvas.width = container.clientWidth;
          goniometerCanvas.height = 300;
        }
      }
      
      if (oscilloscopeCanvas) {
        const container = oscilloscopeCanvas.parentElement;
        if (container) {
          oscilloscopeCanvas.width = container.clientWidth;
          oscilloscopeCanvas.height = 300;
        }
      }
      
      if (metersCanvas) {
        const container = metersCanvas.parentElement;
        if (container) {
          metersCanvas.width = container.clientWidth;
          metersCanvas.height = 300;
        }
      }
      
      if (dynamicRangeCanvas) {
        const container = dynamicRangeCanvas.parentElement;
        if (container) {
          dynamicRangeCanvas.width = container.clientWidth;
          dynamicRangeCanvas.height = 100;
        }
      }
      
      drawVisualization();
    };
    
    // Initial resize
    resizeCanvas();
    
    // Add event listener for window resize
    window.addEventListener('resize', resizeCanvas);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [activeTab]);
  
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-cyan-500 flex items-center justify-between">
          <div className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Audio Analyzer
          </div>
          <div className="flex items-center gap-2">
            <Badge className={isAnalyzing ? "bg-green-600" : "bg-gray-600"}>
              {isAnalyzing ? "Analyzing" : "Idle"}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Audio Device Selection */}
          <div className="bg-gray-850 p-3 rounded-md border border-gray-700 mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-300">Audio Input Device</h3>
              <Button 
                size="sm" 
                variant="outline"
                onClick={detectAudioDevices}
                className="border-gray-700 text-xs h-7 px-2"
              >
                Refresh Devices
              </Button>
            </div>
            
            {audioInputDevices.length === 0 ? (
              <div className="text-sm text-gray-400 mb-2">
                No audio devices detected. Click "Refresh Devices" to scan for connected audio inputs.
              </div>
            ) : (
              <Select 
                value={selectedInputDevice} 
                onValueChange={setSelectedInputDevice}
              >
                <SelectTrigger className="w-full bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Select an audio input device" />
                </SelectTrigger>
                <SelectContent>
                  {audioInputDevices.map(device => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            <div className="flex items-center justify-between mt-3">
              <div className="text-xs text-gray-400">
                {isAnalyzing ? 
                  "Audio analysis is active" :
                  "Select a device and start analysis"}
              </div>
              
              {isAnalyzing ? (
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={stopAudioAnalysis}
                  className="h-7 px-3"
                >
                  Stop Analysis
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  variant="default"
                  onClick={startAudioAnalysis}
                  disabled={!selectedInputDevice}
                  className="bg-green-600 hover:bg-green-700 h-7 px-3"
                >
                  Start Analysis
                </Button>
              )}
            </div>
          </div>
          
          {/* Source selector and general settings */}
          <div className="flex flex-wrap justify-between gap-2 mb-4">
            <div className="flex items-center space-x-4">
              <div>
                <Label htmlFor="analyzer-source" className="text-sm mr-2">Source:</Label>
                <Select 
                  value={analyzerSettings.source} 
                  onValueChange={updateSource}
                >
                  <SelectTrigger className="w-[150px] bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="input">Input</SelectItem>
                    <SelectItem value="output">Output</SelectItem>
                    <SelectItem value="processing">Processing Chain</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="analyzer-fft" className="text-sm mr-2">FFT Size:</Label>
                <Select 
                  value={analyzerSettings.fftSize.toString()} 
                  onValueChange={(val) => updateSetting('fftSize', val)}
                >
                  <SelectTrigger className="w-[120px] bg-gray-800 border-gray-700">
                    <SelectValue placeholder="FFT Size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1024">1024</SelectItem>
                    <SelectItem value="2048">2048</SelectItem>
                    <SelectItem value="4096">4096</SelectItem>
                    <SelectItem value="8192">8192</SelectItem>
                    <SelectItem value="16384">16384</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2 switch-enabled">
                <Label htmlFor="analyzer-peak-hold" className="text-sm">Peak Hold:</Label>
                <Switch 
                  id="analyzer-peak-hold" 
                  checked={analyzerSettings.peakHold}
                  onCheckedChange={() => toggleSetting('peakHold')}
                />
              </div>
              
              <div className="flex items-center space-x-2 switch-enabled">
                <Label htmlFor="analyzer-stereo" className="text-sm">Stereo View:</Label>
                <Switch 
                  id="analyzer-stereo" 
                  checked={analyzerSettings.stereoSeparate}
                  onCheckedChange={() => toggleSetting('stereoSeparate')}
                />
              </div>
            </div>
          </div>
          
          {/* Analyzer tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-5 mb-4">
              <TabsTrigger value="spectrum">
                <BarChart className="h-4 w-4 mr-2" />
                Spectrum
              </TabsTrigger>
              <TabsTrigger value="phase">
                <Maximize2 className="h-4 w-4 mr-2" />
                Phase Scope
              </TabsTrigger>
              <TabsTrigger value="scope">
                <Waves className="h-4 w-4 mr-2" />
                Oscilloscope
              </TabsTrigger>
              <TabsTrigger value="meters">
                <BarChart className="h-4 w-4 mr-2" />
                Meters
              </TabsTrigger>
              <TabsTrigger value="dr">
                <Activity className="h-4 w-4 mr-2" />
                Dynamic Range
              </TabsTrigger>
            </TabsList>
            
            {/* Spectrum Analyzer */}
            <TabsContent value="spectrum" className="space-y-4">
              <div className="h-[300px] w-full bg-gray-950 border border-gray-800 rounded-md overflow-hidden">
                <canvas ref={spectrumCanvasRef} className="w-full h-full" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Smoothing</Label>
                    <span className="text-sm text-gray-400">{analyzerSettings.smoothing.toFixed(2)}</span>
                  </div>
                  <Slider 
                    value={[analyzerSettings.smoothing]} 
                    min={0}
                    max={1}
                    step={0.01}
                    onValueChange={([val]) => updateSetting('smoothing', val)}
                    className="cursor-pointer"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Minimum dB</Label>
                    <span className="text-sm text-gray-400">{analyzerSettings.minDecibels} dB</span>
                  </div>
                  <Slider 
                    value={[Math.abs(analyzerSettings.minDecibels)]} 
                    min={60}
                    max={120}
                    step={1}
                    onValueChange={([val]) => updateSetting('minDecibels', -val)}
                    className="cursor-pointer"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 switch-enabled">
                  <Switch 
                    id="analyzer-show-average" 
                    checked={analyzerSettings.showAverage}
                    onCheckedChange={() => toggleSetting('showAverage')}
                  />
                  <Label htmlFor="analyzer-show-average" className="text-sm">Show Average</Label>
                </div>
                
                <div className="flex items-center space-x-2 switch-enabled">
                  <Switch 
                    id="analyzer-logarithmic" 
                    checked={analyzerSettings.logarithmic}
                    onCheckedChange={() => toggleSetting('logarithmic')}
                  />
                  <Label htmlFor="analyzer-logarithmic" className="text-sm">Logarithmic Scale</Label>
                </div>
              </div>
            </TabsContent>
            
            {/* Phase Scope / Goniometer */}
            <TabsContent value="phase" className="space-y-4">
              <div className="h-[300px] w-full bg-gray-950 border border-gray-800 rounded-md overflow-hidden">
                <canvas ref={goniometerCanvasRef} className="w-full h-full" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-950 p-4 rounded-md border border-gray-800">
                  <h3 className="text-sm font-medium text-gray-300 mb-2">Stereo Correlation Meter</h3>
                  <div className="relative h-6 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full transition-all duration-300"
                      style={{
                        width: `${(stereoCorrelation * 0.5 + 0.5) * 100}%`,
                        background: `linear-gradient(to right,
                          red ${(0 * 100 / 1)}%,
                          yellow ${(0.3 * 100 / 1)}%,
                          lime ${(0.7 * 100 / 1)}%,
                          lime 100%)`
                      }}
                    ></div>
                    <div className="absolute top-0 left-0 w-full h-full flex justify-between px-2 items-center text-xs">
                      <span>-1</span>
                      <span>0</span>
                      <span>+1</span>
                    </div>
                  </div>
                  <div className="mt-2 text-center">
                    <Badge className={`${
                      stereoCorrelation > 0.9 ? 'bg-green-600' :
                      stereoCorrelation > 0.5 ? 'bg-yellow-600' :
                      stereoCorrelation > 0 ? 'bg-orange-600' :
                      'bg-red-600'
                    }`}>
                      {stereoCorrelation.toFixed(2)}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    <p><strong>What this means:</strong></p>
                    <p>+1.0: Perfectly in phase (mono compatible)</p>
                    <p>0.0: Uncorrelated (L/R channels independent)</p>
                    <p>-1.0: Out of phase (mono cancelation)</p>
                  </div>
                </div>
                
                <div className="bg-gray-950 p-4 rounded-md border border-gray-800">
                  <h3 className="text-sm font-medium text-gray-300 mb-2">Interpretation Guide</h3>
                  <div className="space-y-1 text-xs text-gray-400">
                    <p>• <strong>Vertical Line:</strong> Mono/Center content</p>
                    <p>• <strong>Horizontal Line:</strong> Out of phase content</p>
                    <p>• <strong>45° Lines:</strong> Right or left channel only</p>
                    <p>• <strong>Circle Shape:</strong> Well-balanced stereo</p>
                    <p>• <strong>Thin Vertical Ellipse:</strong> Narrow stereo</p>
                    <p>• <strong>Wide Horizontal Ellipse:</strong> Possible phase issues</p>
                  </div>
                  <div className="mt-3 text-xs text-gray-400">
                    <p>The phase scope shows the relationship between left and right channels. Points that extend outside the circle may indicate potential clipping or phase issues.</p>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Oscilloscope View */}
            <TabsContent value="scope" className="space-y-4">
              <div className="h-[300px] w-full bg-gray-950 border border-gray-800 rounded-md overflow-hidden">
                <canvas ref={oscilloscopeCanvasRef} className="w-full h-full" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Time Scale</Label>
                    <span className="text-sm text-gray-400">1.0x</span>
                  </div>
                  <Slider 
                    value={[1]} 
                    min={0.1}
                    max={2}
                    step={0.1}
                    className="cursor-pointer"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Amplitude Scale</Label>
                    <span className="text-sm text-gray-400">1.0x</span>
                  </div>
                  <Slider 
                    value={[1]} 
                    min={0.1}
                    max={2}
                    step={0.1}
                    className="cursor-pointer"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 switch-enabled">
                  <Switch id="oscilloscope-trigger" />
                  <Label htmlFor="oscilloscope-trigger" className="text-sm">Trigger</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Label className="text-sm">Trigger Level:</Label>
                  <Slider 
                    value={[0]} 
                    min={-1}
                    max={1}
                    step={0.01}
                    className="w-[150px] cursor-pointer"
                  />
                </div>
              </div>
            </TabsContent>
            
            {/* Level Meters */}
            <TabsContent value="meters" className="space-y-4">
              <div className="h-[300px] w-full bg-gray-950 border border-gray-800 rounded-md overflow-hidden">
                <canvas id="metersCanvas" className="w-full h-full" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-950 p-4 rounded-md border border-gray-800">
                  <h3 className="text-sm font-medium text-gray-300 mb-2">Peak Meters</h3>
                  <div className="flex justify-between text-sm">
                    <span>Left: {peakLeft.toFixed(1)} dB</span>
                    <span>Right: {peakRight.toFixed(1)} dB</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    <p>Displays the highest sample value in the audio signal. Important for avoiding digital clipping.</p>
                  </div>
                </div>
                
                <div className="bg-gray-950 p-4 rounded-md border border-gray-800">
                  <h3 className="text-sm font-medium text-gray-300 mb-2">RMS Meters</h3>
                  <div className="flex justify-between text-sm">
                    <span>Left: {rmsLeft.toFixed(1)} dB</span>
                    <span>Right: {rmsRight.toFixed(1)} dB</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    <p>Shows the effective power level (average) of the audio signal, giving a better indication of perceived loudness.</p>
                  </div>
                </div>
                
                <div className="bg-gray-950 p-4 rounded-md border border-gray-800">
                  <h3 className="text-sm font-medium text-gray-300 mb-2">LUFS Meter</h3>
                  <div className="text-center text-sm">
                    <span>{lufs.toFixed(1)} LUFS</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    <p>Loudness Units Full Scale - measurement standard for broadcast compliance and streaming platforms.</p>
                    <p className="mt-1">Target: -14 LUFS for streaming, -23 LUFS for broadcast</p>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Dynamic Range Meter */}
            <TabsContent value="dr" className="space-y-4">
              <div className="h-[100px] w-full bg-gray-950 border border-gray-800 rounded-md overflow-hidden">
                <canvas id="dynamicRangeCanvas" className="w-full h-full" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-950 p-4 rounded-md border border-gray-800">
                  <h3 className="text-sm font-medium text-gray-300 mb-2">Dynamic Range Analysis</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Current DR: {dynamicRange.toFixed(1)} dB</span>
                    <Badge className={`${
                      dynamicRange > 14 ? 'bg-green-600' :
                      dynamicRange > 8 ? 'bg-yellow-600' :
                      'bg-red-600'
                    }`}>
                      {
                        dynamicRange > 14 ? 'Excellent' :
                        dynamicRange > 8 ? 'Good' :
                        dynamicRange > 5 ? 'Compressed' :
                        'Highly Compressed'
                      }
                    </Badge>
                  </div>
                  <div className="mt-3 text-xs text-gray-400">
                    <p>The dynamic range measures the difference between the loudest and quietest parts of your audio. Higher values indicate more natural and dynamic sound.</p>
                  </div>
                </div>
                
                <div className="bg-gray-950 p-4 rounded-md border border-gray-800">
                  <h3 className="text-sm font-medium text-gray-300 mb-2">Dynamic Range Reference</h3>
                  <div className="space-y-1 text-xs text-gray-400">
                    <p>• <strong>&gt;20 dB:</strong> Audiophile/classical recording</p>
                    <p>• <strong>14-20 dB:</strong> Well-mastered music, natural dynamics</p>
                    <p>• <strong>8-14 dB:</strong> Modern commercial music</p>
                    <p>• <strong>5-8 dB:</strong> Heavily compressed/limited</p>
                    <p>• <strong>&lt;5 dB:</strong> Extremely compressed, maximized loudness</p>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    <p>Calculated using the difference between peak and average levels over time, following EBU R128/ITU-R BS.1770 standards.</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-950 p-4 rounded-md border border-gray-800">
                <h3 className="text-sm font-medium text-gray-300 mb-2">Crest Factor Analysis</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Left Channel:</span>
                      <span>{(peakLeft - rmsLeft).toFixed(1)} dB</span>
                    </div>
                    <div className="mt-1 relative h-3 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="absolute top-0 left-0 h-full"
                        style={{
                          width: `${Math.min(100, ((peakLeft - rmsLeft) / 20) * 100)}%`,
                          background: `linear-gradient(to right,
                            red 0%,
                            yellow 30%,
                            lime 60%,
                            cyan 100%)`
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Right Channel:</span>
                      <span>{(peakRight - rmsRight).toFixed(1)} dB</span>
                    </div>
                    <div className="mt-1 relative h-3 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="absolute top-0 left-0 h-full"
                        style={{
                          width: `${Math.min(100, ((peakRight - rmsRight) / 20) * 100)}%`,
                          background: `linear-gradient(to right,
                            red 0%,
                            yellow 30%,
                            lime 60%,
                            cyan 100%)`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-400">
                  <p>Crest factor is the ratio between peak and RMS levels, another way to measure dynamic range. Higher values indicate more transient peaks relative to the average level.</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          {/* Bottom settings bar */}
          <div className="flex flex-wrap justify-between items-center pt-2 mt-2 border-t border-gray-800">
            <div className="flex items-center space-x-4">
              <div className="text-xs text-gray-400">
                <span className="font-medium">Analysis Source:</span>{' '}
                {analyzerSettings.source === 'input' ? 'Input Signal' : 
                 analyzerSettings.source === 'output' ? 'Output Signal' : 
                 'Processing Chain'}
              </div>
              
              <div className="text-xs text-gray-400">
                <span className="font-medium">Refresh Rate:</span>{' '}
                {analyzerSettings.refreshRate} Hz
              </div>
            </div>
            
            <div className="flex items-center space-x-2 switch-enabled">
              <Label htmlFor="analyzer-realtime" className="text-xs">Realtime Analysis:</Label>
              <Switch id="analyzer-realtime" defaultChecked />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalyzerSection;
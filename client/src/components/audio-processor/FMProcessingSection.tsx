import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Radio,
  Antenna,
  Signal,
  Wifi,
  Save,
  RefreshCw,
  PlayCircle,
  BarChart4,
  Settings,
  Activity,
  Gauge,
  Scissors,
  CheckSquare,
  X,
  LucideIcon
} from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';

interface FMProcessingSectionProps {
  onSave?: () => void;
}

// Pre-emphasis settings
interface PreEmphasisSettings {
  enabled: boolean;
  type: '0µs' | '25µs' | '50µs' | '75µs';
  preEmphasisAmount: number;
  deEmphasisAmount: number;
  highFrequencyLimiting: boolean;
  protectionThreshold: number;
}

// Stereo Encoder settings
interface StereoEncoderSettings {
  enabled: boolean;
  pilotLevel: number;
  stereoWidth: number;
  monoBassCutoff: number;
  monoBassMix: number;
  stereoEnhancement: number;
  phaseRotation: number;
  pilotProtection: boolean;
  antiAlias: boolean;
}

// RDS Encoder settings
interface RDSSettings {
  enabled: boolean;
  piCode: string;
  psName: string;
  radioText: string;
  programType: string;
  driveRTLevel: number;
  phase: number;
  dynamicPTY: boolean;
  trafficAnnouncement: boolean;
  altFrequencies: string[];
}

// Composite Clipper settings
interface ClipperSettings {
  enabled: boolean;
  threshold: number;
  driveLevel: number;
  asymmetry: number;
  mode: 'hard' | 'soft' | 'adaptive';
  bassProtection: boolean;
  bandwidthExtension: boolean;
  oversample: '1x' | '2x' | '4x' | '8x';
  itrBand: boolean; // ITR correction
}

// HD Radio Processing settings
interface HDSettings {
  enabled: boolean;
  activeDelay: number; // in samples
  diversity: number;
  syncLevel: number;
  hdPreset: 'normal' | 'enhanced' | 'extreme';
  delayCompensation: boolean;
  hdGain: number;
  hdLimiterThreshold: number;
}

// DAB+ Processing settings
interface DABSettings {
  enabled: boolean;
  bitrate: number;
  protection: 'normal' | 'high';
  dabPlusMode: boolean;
  audioObjectType: 'LC' | 'HE' | 'HE v2';
  parametricStereo: boolean;
  bandwidthLimit: number;
  aacGain: number;
}

// Signal visualization data
interface SignalData {
  mpxLevel: number;
  pilotLevel: number;
  rdsLevel: number;
  leftLevel: number;
  rightLevel: number;
  monoLevel: number;
  diffLevel: number;
  history: { left: number; right: number; mpx: number; rds: number }[];
}

// Processing presets
const PROCESSING_PRESETS = [
  { id: 'clean', name: 'Clean', description: 'Transparent sound with minimal processing' },
  { id: 'music', name: 'Music', description: 'Balanced processing for music stations' },
  { id: 'talk', name: 'Talk', description: 'Optimized for voice content' },
  { id: 'club', name: 'Club', description: 'Aggressive processing for dance and club music' },
  { id: 'rock', name: 'Rock & Roll', description: 'Punchy sound for rock stations' },
  { id: 'classical', name: 'Classical', description: 'Gentle processing for classical music' },
];

// Default signal data for visualization
const DEFAULT_SIGNAL_DATA: SignalData = {
  mpxLevel: 75,
  pilotLevel: 8.5,
  rdsLevel: 3.2,
  leftLevel: 90,
  rightLevel: 87,
  monoLevel: 88,
  diffLevel: 35,
  history: Array(100).fill(0).map(() => ({
    left: 60 + Math.random() * 30,
    right: 60 + Math.random() * 30,
    mpx: 70 + Math.random() * 10,
    rds: 3 + Math.random() * 1
  }))
};

const FMProcessingSection: React.FC<FMProcessingSectionProps> = ({ onSave }) => {
  // State for active tab
  const [activeTab, setActiveTab] = useState<string>('preemphasis');
  
  // Main enable switch
  const [processingEnabled, setProcessingEnabled] = useState<boolean>(true);
  
  // Signal visualization data
  const [signalData, setSignalData] = useState<SignalData>(DEFAULT_SIGNAL_DATA);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  
  // Individual processing module settings
  const [preEmphasisSettings, setPreEmphasisSettings] = useState<PreEmphasisSettings>({
    enabled: true,
    type: '75µs',
    preEmphasisAmount: 100,
    deEmphasisAmount: 100,
    highFrequencyLimiting: true,
    protectionThreshold: 80
  });
  
  const [stereoEncoderSettings, setStereoEncoderSettings] = useState<StereoEncoderSettings>({
    enabled: true,
    pilotLevel: 9,
    stereoWidth: 90,
    monoBassCutoff: 120,
    monoBassMix: 60,
    stereoEnhancement: 30,
    phaseRotation: 0,
    pilotProtection: true,
    antiAlias: true
  });
  
  const [rdsSettings, setRdsSettings] = useState<RDSSettings>({
    enabled: true,
    piCode: '2DE0',
    psName: 'QSTUDIO',
    radioText: 'Now Playing: QCaller Studio - Professional Radio Broadcasting',
    programType: 'NEWS',
    driveRTLevel: 4,
    phase: 90,
    dynamicPTY: false,
    trafficAnnouncement: false,
    altFrequencies: ['95.5', '102.3']
  });
  
  const [clipperSettings, setClipperSettings] = useState<ClipperSettings>({
    enabled: true,
    threshold: 110,
    driveLevel: 40,
    asymmetry: 0,
    mode: 'soft',
    bassProtection: true,
    bandwidthExtension: false,
    oversample: '4x',
    itrBand: true
  });
  
  const [hdSettings, setHdSettings] = useState<HDSettings>({
    enabled: false,
    activeDelay: 8192,
    diversity: 50,
    syncLevel: 80,
    hdPreset: 'normal',
    delayCompensation: true,
    hdGain: 0,
    hdLimiterThreshold: -3.0
  });
  
  const [dabSettings, setDABSettings] = useState<DABSettings>({
    enabled: false,
    bitrate: 128,
    protection: 'normal',
    dabPlusMode: true,
    audioObjectType: 'HE',
    parametricStereo: true,
    bandwidthLimit: 15000,
    aacGain: 0
  });
  
  // Canvas references for visualizations
  const mpxSpectrumRef = useRef<HTMLCanvasElement | null>(null);
  const stereoGoniometerRef = useRef<HTMLCanvasElement | null>(null);
  const meterCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Animation frame reference
  const requestAnimationRef = useRef<number | null>(null);
  
  // Handle pre-emphasis settings changes
  const handlePreEmphasisChange = (property: keyof PreEmphasisSettings, value: any) => {
    setPreEmphasisSettings(prev => ({
      ...prev,
      [property]: value
    }));
  };
  
  // Handle pre-emphasis slider changes
  const handlePreEmphasisSliderChange = (property: keyof PreEmphasisSettings, values: number[]) => {
    if (values.length > 0) {
      handlePreEmphasisChange(property, values[0]);
    }
  };
  
  // Handle stereo encoder settings changes
  const handleStereoEncoderChange = (property: keyof StereoEncoderSettings, value: any) => {
    setStereoEncoderSettings(prev => ({
      ...prev,
      [property]: value
    }));
  };
  
  // Handle stereo encoder slider changes
  const handleStereoEncoderSliderChange = (property: keyof StereoEncoderSettings, values: number[]) => {
    if (values.length > 0) {
      handleStereoEncoderChange(property, values[0]);
    }
  };
  
  // Handle RDS settings changes
  const handleRdsChange = (property: keyof RDSSettings, value: any) => {
    setRdsSettings(prev => ({
      ...prev,
      [property]: value
    }));
  };
  
  // Handle RDS slider changes
  const handleRdsSliderChange = (property: keyof RDSSettings, values: number[]) => {
    if (values.length > 0) {
      handleRdsChange(property, values[0]);
    }
  };
  
  // Handle RDS alt frequencies changes
  const handleAltFrequencyChange = (index: number, value: string) => {
    setRdsSettings(prev => {
      const newFreqs = [...prev.altFrequencies];
      newFreqs[index] = value;
      return {
        ...prev,
        altFrequencies: newFreqs
      };
    });
  };
  
  // Add new alt frequency
  const addAltFrequency = () => {
    setRdsSettings(prev => ({
      ...prev,
      altFrequencies: [...prev.altFrequencies, '']
    }));
  };
  
  // Remove alt frequency
  const removeAltFrequency = (index: number) => {
    setRdsSettings(prev => ({
      ...prev,
      altFrequencies: prev.altFrequencies.filter((_, i) => i !== index)
    }));
  };
  
  // Handle clipper settings changes
  const handleClipperChange = (property: keyof ClipperSettings, value: any) => {
    setClipperSettings(prev => ({
      ...prev,
      [property]: value
    }));
  };
  
  // Handle clipper slider changes
  const handleClipperSliderChange = (property: keyof ClipperSettings, values: number[]) => {
    if (values.length > 0) {
      handleClipperChange(property, values[0]);
    }
  };
  
  // Handle HD settings changes
  const handleHDChange = (property: keyof HDSettings, value: any) => {
    setHdSettings(prev => ({
      ...prev,
      [property]: value
    }));
  };
  
  // Handle HD slider changes
  const handleHDSliderChange = (property: keyof HDSettings, values: number[]) => {
    if (values.length > 0) {
      handleHDChange(property, values[0]);
    }
  };
  
  // Handle DAB settings changes
  const handleDABChange = (property: keyof DABSettings, value: any) => {
    setDABSettings(prev => ({
      ...prev,
      [property]: value
    }));
  };
  
  // Handle DAB slider changes
  const handleDABSliderChange = (property: keyof DABSettings, values: number[]) => {
    if (values.length > 0) {
      handleDABChange(property, values[0]);
    }
  };
  
  // Toggle playback
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
    
    if (!isPlaying) {
      // Start analysis
      setIsAnalyzing(true);
      // In a real app, this would trigger actual signal analysis
    } else {
      // Stop analysis
      setIsAnalyzing(false);
    }
  };
  
  // Reset all settings to default
  const resetSettings = () => {
    if (window.confirm('Reset all FM/AM/HD Radio Processing settings to default?')) {
      setPreEmphasisSettings({
        enabled: true,
        type: '75µs',
        preEmphasisAmount: 100,
        deEmphasisAmount: 100,
        highFrequencyLimiting: true,
        protectionThreshold: 80
      });
      
      setStereoEncoderSettings({
        enabled: true,
        pilotLevel: 9,
        stereoWidth: 90,
        monoBassCutoff: 120,
        monoBassMix: 60,
        stereoEnhancement: 30,
        phaseRotation: 0,
        pilotProtection: true,
        antiAlias: true
      });
      
      setRdsSettings({
        enabled: true,
        piCode: '2DE0',
        psName: 'QSTUDIO',
        radioText: 'Now Playing: QCaller Studio - Professional Radio Broadcasting',
        programType: 'NEWS',
        driveRTLevel: 4,
        phase: 90,
        dynamicPTY: false,
        trafficAnnouncement: false,
        altFrequencies: ['95.5', '102.3']
      });
      
      setClipperSettings({
        enabled: true,
        threshold: 110,
        driveLevel: 40,
        asymmetry: 0,
        mode: 'soft',
        bassProtection: true,
        bandwidthExtension: false,
        oversample: '4x',
        itrBand: true
      });
      
      setHdSettings({
        enabled: false,
        activeDelay: 8192,
        diversity: 50,
        syncLevel: 80,
        hdPreset: 'normal',
        delayCompensation: true,
        hdGain: 0,
        hdLimiterThreshold: -3.0
      });
      
      setDABSettings({
        enabled: false,
        bitrate: 128,
        protection: 'normal',
        dabPlusMode: true,
        audioObjectType: 'HE',
        parametricStereo: true,
        bandwidthLimit: 15000,
        aacGain: 0
      });
    }
  };
  
  // Load preset for FM processing
  const loadProcessingPreset = (presetId: string) => {
    switch (presetId) {
      case 'clean':
        setPreEmphasisSettings(prev => ({
          ...prev,
          preEmphasisAmount: 90,
          highFrequencyLimiting: true,
          protectionThreshold: 90
        }));
        setClipperSettings(prev => ({
          ...prev,
          threshold: 100,
          driveLevel: 20,
          mode: 'soft'
        }));
        setStereoEncoderSettings(prev => ({
          ...prev,
          stereoWidth: 100,
          stereoEnhancement: 10
        }));
        break;
        
      case 'music':
        setPreEmphasisSettings(prev => ({
          ...prev,
          preEmphasisAmount: 100,
          highFrequencyLimiting: true,
          protectionThreshold: 80
        }));
        setClipperSettings(prev => ({
          ...prev,
          threshold: 110,
          driveLevel: 40,
          mode: 'soft'
        }));
        setStereoEncoderSettings(prev => ({
          ...prev,
          stereoWidth: 90,
          monoBassCutoff: 120,
          stereoEnhancement: 30
        }));
        break;
        
      case 'talk':
        setPreEmphasisSettings(prev => ({
          ...prev,
          preEmphasisAmount: 80,
          highFrequencyLimiting: true,
          protectionThreshold: 70
        }));
        setClipperSettings(prev => ({
          ...prev,
          threshold: 105,
          driveLevel: 30,
          mode: 'soft'
        }));
        setStereoEncoderSettings(prev => ({
          ...prev,
          stereoWidth: 70,
          monoBassCutoff: 200,
          stereoEnhancement: 20
        }));
        break;
        
      case 'club':
        setPreEmphasisSettings(prev => ({
          ...prev,
          preEmphasisAmount: 110,
          highFrequencyLimiting: true,
          protectionThreshold: 75
        }));
        setClipperSettings(prev => ({
          ...prev,
          threshold: 120,
          driveLevel: 60,
          mode: 'adaptive',
          asymmetry: 20
        }));
        setStereoEncoderSettings(prev => ({
          ...prev,
          stereoWidth: 110,
          monoBassCutoff: 100,
          stereoEnhancement: 50
        }));
        break;
        
      case 'rock':
        setPreEmphasisSettings(prev => ({
          ...prev,
          preEmphasisAmount: 105,
          highFrequencyLimiting: true,
          protectionThreshold: 70
        }));
        setClipperSettings(prev => ({
          ...prev,
          threshold: 115,
          driveLevel: 50,
          mode: 'adaptive',
          asymmetry: 10
        }));
        setStereoEncoderSettings(prev => ({
          ...prev,
          stereoWidth: 95,
          monoBassCutoff: 80,
          stereoEnhancement: 40
        }));
        break;
        
      case 'classical':
        setPreEmphasisSettings(prev => ({
          ...prev,
          preEmphasisAmount: 85,
          highFrequencyLimiting: false,
          protectionThreshold: 95
        }));
        setClipperSettings(prev => ({
          ...prev,
          threshold: 98,
          driveLevel: 15,
          mode: 'soft',
          asymmetry: 0
        }));
        setStereoEncoderSettings(prev => ({
          ...prev,
          stereoWidth: 100,
          monoBassCutoff: 80,
          stereoEnhancement: 0
        }));
        break;
    }
  };
  
  // Draw MPX spectrum
  const drawMPXSpectrum = () => {
    const canvas = mpxSpectrumRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size to match display size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    
    // Draw frequency scale (0-100 kHz)
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    
    // Draw frequency markers (kHz)
    const freqMarkers = [0, 15, 19, 38, 53, 57, 67, 74.5, 100];
    const freqLabels = ['0', '15', '19k\nPilot', '38k\nL-R', '53k', '57k\nRDS', '67k', '74.5k', '100k'];
    
    freqMarkers.forEach((freq, idx) => {
      const x = (freq / 100) * width;
      
      // Draw vertical grid line
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height - 20);
      ctx.stroke();
      
      // Draw frequency label
      ctx.fillStyle = '#666';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      
      // Handle multi-line labels
      const lines = freqLabels[idx].split('\n');
      if (lines.length > 1) {
        lines.forEach((line, lineIdx) => {
          ctx.fillText(line, x, height - 5 + (lineIdx - lines.length) * 12);
        });
      } else {
        ctx.fillText(freqLabels[idx], x, height - 5);
      }
    });
    
    // Draw level scale
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, 30, height - 20);
    
    // Level markers (dB)
    const dbMarkers = [0, -10, -20, -30, -40, -50, -60];
    
    dbMarkers.forEach(db => {
      const y = ((db + 60) / 60) * (height - 20);
      
      // Draw horizontal grid line
      ctx.beginPath();
      ctx.moveTo(30, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      
      // Draw dB label
      ctx.fillStyle = '#666';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${db}`, 25, y + 3);
    });
    
    // Draw MPX components with simulated data
    if (isPlaying || isAnalyzing) {
      // L+R (mono) component (0-15 kHz)
      ctx.fillStyle = 'rgba(0, 150, 255, 0.6)';
      const monoWidth = (15 / 100) * width;
      const monoHeight = ((signalData.monoLevel / 100) * (height - 20));
      ctx.fillRect(30, height - 20 - monoHeight, monoWidth - 30, monoHeight);
      ctx.fillStyle = 'rgba(0, 150, 255, 0.8)';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('L+R', monoWidth / 2, height - 25 - monoHeight);
      
      // Pilot tone (19 kHz)
      if (stereoEncoderSettings.enabled) {
        const pilotX = (19 / 100) * width;
        const pilotHeight = ((stereoEncoderSettings.pilotLevel / 10) * (height - 20));
        ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
        ctx.fillRect(pilotX - 1, height - 20 - pilotHeight, 2, pilotHeight);
        ctx.fillStyle = 'rgba(255, 255, 0, 0.9)';
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Pilot', pilotX, height - 25 - pilotHeight);
      }
      
      // L-R (stereo difference) component (23-53 kHz)
      if (stereoEncoderSettings.enabled) {
        ctx.fillStyle = 'rgba(255, 100, 100, 0.6)';
        const stereoStartX = (23 / 100) * width;
        const stereoEndX = (53 / 100) * width;
        const stereoWidth = stereoEndX - stereoStartX;
        const stereoHeight = ((signalData.diffLevel / 100) * (height - 20));
        ctx.fillRect(stereoStartX, height - 20 - stereoHeight, stereoWidth, stereoHeight);
        ctx.fillStyle = 'rgba(255, 100, 100, 0.8)';
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('L-R', (stereoStartX + stereoEndX) / 2, height - 25 - stereoHeight);
      }
      
      // RDS component (57 kHz)
      if (rdsSettings.enabled) {
        ctx.fillStyle = 'rgba(100, 255, 100, 0.6)';
        const rdsStartX = (56 / 100) * width;
        const rdsEndX = (58 / 100) * width;
        const rdsWidth = rdsEndX - rdsStartX;
        const rdsHeight = ((rdsSettings.driveRTLevel / 6) * (height - 20));
        ctx.fillRect(rdsStartX, height - 20 - rdsHeight, rdsWidth, rdsHeight);
        ctx.fillStyle = 'rgba(100, 255, 100, 0.8)';
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('RDS', (rdsStartX + rdsEndX) / 2, height - 25 - rdsHeight);
      }
      
      // SCA/HD component
      if (hdSettings.enabled) {
        ctx.fillStyle = 'rgba(180, 100, 255, 0.4)';
        const hdStartX = (62 / 100) * width;
        const hdEndX = (74.5 / 100) * width;
        const hdWidth = hdEndX - hdStartX;
        const hdHeight = ((30 / 100) * (height - 20)); // Fixed height for HD
        ctx.fillRect(hdStartX, height - 20 - hdHeight, hdWidth, hdHeight);
        ctx.fillStyle = 'rgba(180, 100, 255, 0.8)';
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('HD Radio', (hdStartX + hdEndX) / 2, height - 25 - hdHeight);
      }
      
      // Draw MPX limiting threshold if clipper enabled
      if (clipperSettings.enabled) {
        const thresholdY = height - 20 - ((clipperSettings.threshold / 120) * (height - 20));
        ctx.strokeStyle = 'rgba(255, 50, 50, 0.8)';
        ctx.setLineDash([4, 2]);
        ctx.beginPath();
        ctx.moveTo(30, thresholdY);
        ctx.lineTo(width, thresholdY);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Label
        ctx.fillStyle = 'rgba(255, 50, 50, 0.9)';
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`Clip: ${clipperSettings.threshold}%`, 35, thresholdY - 5);
      }
      
      // Draw pre-emphasis curve
      if (preEmphasisSettings.enabled) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        // Calculate time constant in µs
        const tcValue = parseInt(preEmphasisSettings.type.replace('µs', ''));
        if (tcValue > 0) {
          const cornerFreq = 1000000 / (2 * Math.PI * tcValue);
          
          for (let i = 0; i <= width - 30; i++) {
            const freqKHz = (i / (width - 30)) * 100;
            const freqHz = freqKHz * 1000;
            const boost = 10 * Math.log10(1 + Math.pow(freqHz / cornerFreq, 2));
            const y = height - 20 - ((30 + boost) / 60) * (height - 20);
            
            if (i === 0) {
              ctx.moveTo(i + 30, y);
            } else {
              ctx.lineTo(i + 30, y);
            }
          }
          ctx.stroke();
          
          // Pre-emphasis label
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.font = '9px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`Pre-emphasis: ${preEmphasisSettings.type}`, 35, 15);
        }
      }
    }
  };
  
  // Draw stereo goniometer (L/R correlation)
  const drawStereoGoniometer = () => {
    const canvas = stereoGoniometerRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size to match display size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const size = Math.min(canvas.offsetWidth, canvas.offsetHeight);
    const centerX = canvas.offsetWidth / 2;
    const centerY = canvas.offsetHeight / 2;
    const radius = size * 0.45;
    
    // Draw grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    
    // Draw outer circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw inner circles
    [0.33, 0.66].forEach(r => {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * r, 0, Math.PI * 2);
      ctx.stroke();
    });
    
    // Draw crosshairs
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius);
    ctx.lineTo(centerX, centerY + radius);
    ctx.moveTo(centerX - radius, centerY);
    ctx.lineTo(centerX + radius, centerY);
    ctx.stroke();
    
    // Draw diagonal lines (45 degrees for M/S)
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(centerX - radius * 0.7071, centerY - radius * 0.7071); // -45 degrees (M axis)
    ctx.lineTo(centerX + radius * 0.7071, centerY + radius * 0.7071);
    ctx.moveTo(centerX + radius * 0.7071, centerY - radius * 0.7071); // 45 degrees (S axis)
    ctx.lineTo(centerX - radius * 0.7071, centerY + radius * 0.7071);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Add labels
    ctx.fillStyle = '#888';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('L', centerX - radius - 10, centerY);
    ctx.fillText('R', centerX + radius + 10, centerY);
    ctx.fillText('+M', centerX, centerY + radius + 10);
    ctx.fillText('-M', centerX, centerY - radius - 10);
    ctx.fillText('+S', centerX + radius * 0.7071 + 15, centerY - radius * 0.7071 - 5);
    ctx.fillText('-S', centerX - radius * 0.7071 - 15, centerY + radius * 0.7071 + 5);
    
    // Simulate stereo signal (Lissajous pattern)
    if (isPlaying || isAnalyzing) {
      // Draw the Lissajous pattern
      const points = 100;
      const stereoWidth = stereoEncoderSettings.stereoWidth / 100; // Normalized to 0-1
      
      // Draw the pattern
      ctx.strokeStyle = 'rgba(0, 200, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      for (let i = 0; i < points; i++) {
        const phase = (i / points) * Math.PI * 2;
        
        // Simulate some audio with phase offset between channels
        const phaseOffset = (stereoEncoderSettings.phaseRotation / 180) * Math.PI;
        const left = Math.sin(phase);
        const right = Math.sin(phase + phaseOffset) * stereoWidth;
        
        // Convert to XY coordinates
        const x = centerX + radius * ((left + right) / 2);
        const y = centerY + radius * ((left - right) / 2);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.stroke();
      
      // Add some random points to simulate transients
      ctx.fillStyle = 'rgba(0, 200, 255, 0.4)';
      for (let i = 0; i < 30; i++) {
        const left = (Math.random() * 2 - 1) * 0.8;
        const right = (Math.random() * 2 - 1) * 0.8 * stereoWidth;
        
        const x = centerX + radius * ((left + right) / 2);
        const y = centerY + radius * ((left - right) / 2);
        
        const dotSize = Math.random() * 3 + 1;
        ctx.beginPath();
        ctx.arc(x, y, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Show correlation meter
      const correlation = 0.9 - (stereoEncoderSettings.stereoWidth / 200); // Simulate correlation based on width
      const correlationY = centerY + radius * 1.2;
      const correlationWidth = radius * 1.6;
      
      // Draw correlation meter background
      ctx.fillStyle = '#333';
      ctx.fillRect(centerX - correlationWidth / 2, correlationY, correlationWidth, 10);
      
      // Draw correlation value
      const corrPosition = centerX + correlationWidth * (correlation / 2);
      const corrColor = correlation > 0.5 ? 
                      `hsl(${120 * correlation}, 80%, 50%)` : 
                      `hsl(${120 * correlation}, 80%, 50%)`;
      
      ctx.fillStyle = corrColor;
      ctx.fillRect(centerX - 1, correlationY, corrPosition - centerX + 1, 10);
      
      // Draw correlation value text
      ctx.fillStyle = '#fff';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Correlation: ${(correlation * 100).toFixed(0)}%`, centerX, correlationY + 25);
      
      // Draw labels on correlation meter
      ctx.fillStyle = '#888';
      ctx.textAlign = 'center';
      ctx.fillText('-1', centerX - correlationWidth / 2, correlationY + 20);
      ctx.fillText('0', centerX, correlationY + 20);
      ctx.fillText('+1', centerX + correlationWidth / 2, correlationY + 20);
    }
  };
  
  // Draw level meters
  const drawLevelMeters = () => {
    const canvas = meterCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size to match display size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    
    // Draw level meters for L, R, L+R, L-R, MPX, Pilot, RDS
    const channels = [
      { name: 'Left', level: signalData.leftLevel, color: 'rgba(0, 150, 255, 0.8)' },
      { name: 'Right', level: signalData.rightLevel, color: 'rgba(0, 200, 255, 0.8)' },
      { name: 'L+R', level: signalData.monoLevel, color: 'rgba(100, 255, 255, 0.8)' },
      { name: 'L-R', level: signalData.diffLevel, color: 'rgba(255, 100, 100, 0.8)' },
      { name: 'MPX', level: signalData.mpxLevel, color: 'rgba(255, 200, 0, 0.8)' },
      { name: 'Pilot', level: signalData.pilotLevel * 10, color: 'rgba(255, 255, 0, 0.8)' },
      { name: 'RDS', level: signalData.rdsLevel * 25, color: 'rgba(100, 255, 100, 0.8)' }
    ];
    
    const meterHeight = height / channels.length;
    const meterWidth = width - 70; // Leave space for labels
    
    channels.forEach((channel, index) => {
      const y = index * meterHeight;
      
      // Draw channel label
      ctx.fillStyle = '#aaa';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(channel.name, 60, y + meterHeight / 2 + 3);
      
      // Draw meter background
      ctx.fillStyle = '#333';
      ctx.fillRect(70, y + meterHeight * 0.2, meterWidth, meterHeight * 0.6);
      
      // Draw level gradient
      const gradient = ctx.createLinearGradient(70, 0, 70 + meterWidth, 0);
      gradient.addColorStop(0, '#080');
      gradient.addColorStop(0.6, '#0a0');
      gradient.addColorStop(0.8, '#aa0');
      gradient.addColorStop(0.9, '#a70');
      gradient.addColorStop(1.0, '#a00');
      
      // Draw meter level
      const levelWidth = (channel.level / 100) * meterWidth;
      ctx.fillStyle = gradient;
      ctx.fillRect(70, y + meterHeight * 0.2, levelWidth, meterHeight * 0.6);
      
      // Draw numeric level value
      ctx.fillStyle = channel.color;
      ctx.textAlign = 'left';
      ctx.fillText(`${channel.level.toFixed(1)}%`, levelWidth + 75, y + meterHeight / 2 + 3);
      
      // Draw tick marks
      [0, 25, 50, 75, 100].forEach(tick => {
        const tickX = 70 + (tick / 100) * meterWidth;
        const tickHeight = tick % 50 === 0 ? meterHeight * 0.6 : meterHeight * 0.3;
        const tickY = y + meterHeight * 0.2 + (meterHeight * 0.6 - tickHeight) / 2;
        
        ctx.fillStyle = '#444';
        ctx.fillRect(tickX, tickY, 1, tickHeight);
        
        if (tick % 50 === 0) {
          ctx.fillStyle = '#777';
          ctx.textAlign = 'center';
          ctx.fillText(`${tick}`, tickX, y + meterHeight - 2);
        }
      });
    });
    
    // Draw MPX limiting indicator if clipper is enabled
    if (clipperSettings.enabled) {
      const clipY = 4 * meterHeight + meterHeight / 2;
      const clipThresholdX = 70 + (clipperSettings.threshold / 100) * meterWidth;
      
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(clipThresholdX, 4 * meterHeight);
      ctx.lineTo(clipThresholdX, 5 * meterHeight);
      ctx.stroke();
      
      // Draw clipping indicator text
      if (signalData.mpxLevel > clipperSettings.threshold) {
        ctx.fillStyle = '#f00';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('CLIP', clipThresholdX, 4 * meterHeight - 3);
      }
    }
  };
  
  // Update all visualizations in animation frame
  const updateVisualizations = () => {
    drawMPXSpectrum();
    drawStereoGoniometer();
    drawLevelMeters();
    
    // Simulate changing signal data if playback is active
    if (isPlaying) {
      // Simulate some modulation for signal levels
      const newMpxLevel = Math.min(120, Math.max(60,
        signalData.mpxLevel + (Math.random() * 6 - 3)
      ));
      
      const newLeftLevel = Math.min(100, Math.max(50,
        signalData.leftLevel + (Math.random() * 4 - 2)
      ));
      
      const newRightLevel = Math.min(100, Math.max(50,
        signalData.rightLevel + (Math.random() * 4 - 2)
      ));
      
      // Update mono level based on L/R
      const newMonoLevel = (newLeftLevel + newRightLevel) / 2;
      
      // Update differential level based on stereo width
      const width = stereoEncoderSettings.stereoWidth / 100;
      const newDiffLevel = Math.abs(newLeftLevel - newRightLevel) * width;
      
      // Update other signal components
      const newPilotLevel = stereoEncoderSettings.enabled ? 
        (stereoEncoderSettings.pilotLevel) : 0;
      
      const newRdsLevel = rdsSettings.enabled ?
        (rdsSettings.driveRTLevel) : 0;
      
      // Calculate current history
      const newHistory = [...signalData.history.slice(1), {
        left: newLeftLevel,
        right: newRightLevel,
        mpx: newMpxLevel,
        rds: newRdsLevel
      }];
      
      // Update the signal data state
      setSignalData({
        mpxLevel: newMpxLevel,
        pilotLevel: newPilotLevel,
        rdsLevel: newRdsLevel,
        leftLevel: newLeftLevel,
        rightLevel: newRightLevel,
        monoLevel: newMonoLevel,
        diffLevel: newDiffLevel,
        history: newHistory
      });
    }
    
    // Continue animation loop
    requestAnimationRef.current = requestAnimationFrame(updateVisualizations);
  };
  
  // Initialize and cleanup animation loop
  useEffect(() => {
    // Start animation loop
    requestAnimationRef.current = requestAnimationFrame(updateVisualizations);
    
    // Cleanup function
    return () => {
      if (requestAnimationRef.current) {
        cancelAnimationFrame(requestAnimationRef.current);
      }
    };
  }, [
    processingEnabled,
    preEmphasisSettings,
    stereoEncoderSettings,
    rdsSettings,
    clipperSettings,
    hdSettings,
    dabSettings,
    signalData,
    isPlaying,
    activeTab
  ]);
  
  // Resize canvas to match display size
  useEffect(() => {
    const canvases = [
      mpxSpectrumRef.current,
      stereoGoniometerRef.current,
      meterCanvasRef.current
    ];
    
    canvases.forEach(canvas => {
      if (canvas) {
        canvas.width = canvas.offsetWidth * window.devicePixelRatio;
        canvas.height = canvas.offsetHeight * window.devicePixelRatio;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        }
      }
    });
  }, [activeTab]);
  
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-green-500 flex items-center justify-between">
          <div className="flex items-center">
            <Radio className="h-5 w-5 mr-2" />
            FM/AM/HD Radio
          </div>
          <Switch 
            checked={processingEnabled}
            onCheckedChange={setProcessingEnabled}
          />
        </CardTitle>
      </CardHeader>
      <CardContent className={`${!processingEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Signal visualization area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-950 border border-gray-800 rounded-md p-3 lg:col-span-2">
            <div className="flex justify-between mb-2">
              <div className="text-sm font-medium text-gray-400">MPX Spectrum</div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  className="h-6 w-6"
                  onClick={togglePlayback}
                >
                  {isPlaying ? (
                    <Gauge className="h-4 w-4 text-red-500" />
                  ) : (
                    <BarChart4 className="h-4 w-4 text-green-500" />
                  )}
                </Button>
              </div>
            </div>
            <div className="h-60">
              <canvas 
                ref={mpxSpectrumRef} 
                className="w-full h-full" 
                style={{ display: 'block' }}
              />
            </div>
          </div>
          <div className="bg-gray-950 border border-gray-800 rounded-md p-3">
            <div className="text-sm font-medium text-gray-400 mb-2">Stereo Goniometer</div>
            <div className="h-60">
              <canvas 
                ref={stereoGoniometerRef} 
                className="w-full h-full" 
                style={{ display: 'block' }}
              />
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="bg-gray-950 border border-gray-800 rounded-md p-3">
            <div className="text-sm font-medium text-gray-400 mb-2">Signal Levels</div>
            <div className="h-60">
              <canvas 
                ref={meterCanvasRef} 
                className="w-full h-full" 
                style={{ display: 'block' }}
              />
            </div>
          </div>
        </div>
        
        {/* Tabs for different processing sections */}
        <Tabs defaultValue="preemphasis" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList className="grid grid-cols-6">
              <TabsTrigger value="preemphasis">
                <Signal className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Pre-emphasis</span>
              </TabsTrigger>
              <TabsTrigger value="stereo">
                <Radio className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Stereo Encoder</span>
              </TabsTrigger>
              <TabsTrigger value="rds">
                <Antenna className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">RDS Encoder</span>
              </TabsTrigger>
              <TabsTrigger value="clipper">
                <Scissors className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Composite Clipper</span>
              </TabsTrigger>
              <TabsTrigger value="hd">
                <Signal className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">HD Radio</span>
              </TabsTrigger>
              <TabsTrigger value="dab">
                <Wifi className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">DAB+</span>
              </TabsTrigger>
            </TabsList>
            
            <Select defaultValue="preset" onValueChange={loadProcessingPreset}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Presets" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="preset" disabled>Presets</SelectItem>
                {PROCESSING_PRESETS.map(preset => (
                  <SelectItem key={preset.id} value={preset.id}>
                    {preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Pre-emphasis Tab */}
          <TabsContent value="preemphasis" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h3 className="text-sm font-medium">FM Pre-emphasis / De-emphasis</h3>
                <Switch 
                  className="ml-2"
                  checked={preEmphasisSettings.enabled}
                  onCheckedChange={(value) => handlePreEmphasisChange('enabled', value)}
                />
              </div>
              <div>
                <Select
                  value={preEmphasisSettings.type}
                  onValueChange={(value) => handlePreEmphasisChange('type', value)}
                  disabled={!preEmphasisSettings.enabled}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0µs">0µs (none)</SelectItem>
                    <SelectItem value="25µs">25µs (Japan)</SelectItem>
                    <SelectItem value="50µs">50µs (Europe)</SelectItem>
                    <SelectItem value="75µs">75µs (USA)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preemphasis-amount">Pre-emphasis Amount ({preEmphasisSettings.preEmphasisAmount}%)</Label>
                  <Slider
                    id="preemphasis-amount"
                    min={0}
                    max={150}
                    step={1}
                    value={[preEmphasisSettings.preEmphasisAmount]}
                    onValueChange={(value) => handlePreEmphasisSliderChange('preEmphasisAmount', value)}
                    disabled={!preEmphasisSettings.enabled || preEmphasisSettings.type === '0µs'}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="deemphasis-amount">De-emphasis Amount ({preEmphasisSettings.deEmphasisAmount}%)</Label>
                  <Slider
                    id="deemphasis-amount"
                    min={0}
                    max={150}
                    step={1}
                    value={[preEmphasisSettings.deEmphasisAmount]}
                    onValueChange={(value) => handlePreEmphasisSliderChange('deEmphasisAmount', value)}
                    disabled={!preEmphasisSettings.enabled || preEmphasisSettings.type === '0µs'}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="hf-limiting"
                  checked={preEmphasisSettings.highFrequencyLimiting}
                  onCheckedChange={(value) => handlePreEmphasisChange('highFrequencyLimiting', value)}
                  disabled={!preEmphasisSettings.enabled || preEmphasisSettings.type === '0µs'}
                />
                <Label htmlFor="hf-limiting">High Frequency Limiting</Label>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="protection-threshold">Protection Threshold ({preEmphasisSettings.protectionThreshold}%)</Label>
                <Slider
                  id="protection-threshold"
                  min={0}
                  max={100}
                  step={1}
                  value={[preEmphasisSettings.protectionThreshold]}
                  onValueChange={(value) => handlePreEmphasisSliderChange('protectionThreshold', value)}
                  disabled={!preEmphasisSettings.enabled || !preEmphasisSettings.highFrequencyLimiting || preEmphasisSettings.type === '0µs'}
                />
              </div>
              
              <div className="text-xs text-gray-400 p-3 bg-gray-950 border border-gray-800 rounded-md">
                <p className="mb-1">
                  <strong>Pre-emphasis</strong> boosts high frequencies before transmission, while <strong>de-emphasis</strong> 
                  restores the normal frequency balance on receivers, improving signal-to-noise ratio.
                </p>
                <p>
                  <span className="text-blue-400">75µs</span> is used in the Americas and South Korea,
                  <span className="text-blue-400"> 50µs</span> in Europe and Australia, and
                  <span className="text-blue-400"> 25µs</span> in Japan.
                  Enable <span className="text-blue-400">High Frequency Limiting</span> to prevent over-modulation
                  caused by boosted high frequencies.
                </p>
              </div>
            </div>
          </TabsContent>
          
          {/* Stereo Encoder Tab */}
          <TabsContent value="stereo" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h3 className="text-sm font-medium">Stereo Encoder</h3>
                <Switch 
                  className="ml-2"
                  checked={stereoEncoderSettings.enabled}
                  onCheckedChange={(value) => handleStereoEncoderChange('enabled', value)}
                />
              </div>
              <div className="text-xs text-gray-400">
                Stereo Pilot & MPX Generation
              </div>
            </div>
            
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pilot-level">Pilot Level ({stereoEncoderSettings.pilotLevel}%)</Label>
                  <Slider
                    id="pilot-level"
                    min={0}
                    max={12}
                    step={0.1}
                    value={[stereoEncoderSettings.pilotLevel]}
                    onValueChange={(value) => handleStereoEncoderSliderChange('pilotLevel', value)}
                    disabled={!stereoEncoderSettings.enabled}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="stereo-width">Stereo Width ({stereoEncoderSettings.stereoWidth}%)</Label>
                  <Slider
                    id="stereo-width"
                    min={0}
                    max={150}
                    step={1}
                    value={[stereoEncoderSettings.stereoWidth]}
                    onValueChange={(value) => handleStereoEncoderSliderChange('stereoWidth', value)}
                    disabled={!stereoEncoderSettings.enabled}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mono-bass-cutoff">Mono Bass Cutoff ({stereoEncoderSettings.monoBassCutoff} Hz)</Label>
                  <Slider
                    id="mono-bass-cutoff"
                    min={0}
                    max={300}
                    step={10}
                    value={[stereoEncoderSettings.monoBassCutoff]}
                    onValueChange={(value) => handleStereoEncoderSliderChange('monoBassCutoff', value)}
                    disabled={!stereoEncoderSettings.enabled}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="mono-bass-mix">Mono Bass Mix ({stereoEncoderSettings.monoBassMix}%)</Label>
                  <Slider
                    id="mono-bass-mix"
                    min={0}
                    max={100}
                    step={1}
                    value={[stereoEncoderSettings.monoBassMix]}
                    onValueChange={(value) => handleStereoEncoderSliderChange('monoBassMix', value)}
                    disabled={!stereoEncoderSettings.enabled || stereoEncoderSettings.monoBassCutoff === 0}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stereo-enhancement">Stereo Enhancement ({stereoEncoderSettings.stereoEnhancement}%)</Label>
                  <Slider
                    id="stereo-enhancement"
                    min={0}
                    max={100}
                    step={1}
                    value={[stereoEncoderSettings.stereoEnhancement]}
                    onValueChange={(value) => handleStereoEncoderSliderChange('stereoEnhancement', value)}
                    disabled={!stereoEncoderSettings.enabled}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phase-rotation">Phase Rotation ({stereoEncoderSettings.phaseRotation}°)</Label>
                  <Slider
                    id="phase-rotation"
                    min={-180}
                    max={180}
                    step={1}
                    value={[stereoEncoderSettings.phaseRotation]}
                    onValueChange={(value) => handleStereoEncoderSliderChange('phaseRotation', value)}
                    disabled={!stereoEncoderSettings.enabled}
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="pilot-protection"
                    checked={stereoEncoderSettings.pilotProtection}
                    onCheckedChange={(value) => handleStereoEncoderChange('pilotProtection', value)}
                    disabled={!stereoEncoderSettings.enabled}
                  />
                  <Label htmlFor="pilot-protection">Pilot Protection</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="anti-alias"
                    checked={stereoEncoderSettings.antiAlias}
                    onCheckedChange={(value) => handleStereoEncoderChange('antiAlias', value)}
                    disabled={!stereoEncoderSettings.enabled}
                  />
                  <Label htmlFor="anti-alias">Anti-alias Filtering</Label>
                </div>
              </div>
              
              <div className="text-xs text-gray-400 p-3 bg-gray-950 border border-gray-800 rounded-md">
                <p className="mb-1">
                  <strong>Stereo Encoder</strong> generates the FM multiplex signal by creating a 19 kHz pilot tone
                  and modulating the stereo difference signal (L-R) on a 38 kHz subcarrier.
                </p>
                <p>
                  <span className="text-blue-400">Pilot Level</span> should typically be 8-10% for optimal stereo reception.
                  <span className="text-blue-400"> Mono Bass</span> keeps low frequencies in mono to improve overall loudness
                  and reduce receiver distortion. <span className="text-blue-400">Stereo Enhancement</span> increases perceived
                  stereo width without causing mono compatibility issues.
                </p>
              </div>
            </div>
          </TabsContent>
          
          {/* RDS Encoder Tab */}
          <TabsContent value="rds" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h3 className="text-sm font-medium">RDS Encoder</h3>
                <Switch 
                  className="ml-2"
                  checked={rdsSettings.enabled}
                  onCheckedChange={(value) => handleRdsChange('enabled', value)}
                />
              </div>
              <div className="text-xs text-gray-400">
                Radio Data System Configuration
              </div>
            </div>
            
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pi-code">PI Code</Label>
                  <Input
                    id="pi-code"
                    value={rdsSettings.piCode}
                    onChange={(e) => handleRdsChange('piCode', e.target.value.toUpperCase().substring(0, 4))}
                    placeholder="E.g. 2DE0"
                    maxLength={4}
                    className="uppercase"
                    disabled={!rdsSettings.enabled}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ps-name">PS Name (8 chars max)</Label>
                  <Input
                    id="ps-name"
                    value={rdsSettings.psName}
                    onChange={(e) => handleRdsChange('psName', e.target.value.toUpperCase().substring(0, 8))}
                    placeholder="Station name"
                    maxLength={8}
                    className="uppercase"
                    disabled={!rdsSettings.enabled}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="radio-text">Radio Text (64 chars max)</Label>
                <Input
                  id="radio-text"
                  value={rdsSettings.radioText}
                  onChange={(e) => handleRdsChange('radioText', e.target.value.substring(0, 64))}
                  placeholder="Now playing information..."
                  maxLength={64}
                  disabled={!rdsSettings.enabled}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="program-type">Program Type</Label>
                  <Select
                    value={rdsSettings.programType}
                    onValueChange={(value) => handleRdsChange('programType', value)}
                    disabled={!rdsSettings.enabled}
                  >
                    <SelectTrigger id="program-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEWS">News</SelectItem>
                      <SelectItem value="CURR">Current Affairs</SelectItem>
                      <SelectItem value="INFO">Information</SelectItem>
                      <SelectItem value="SPORT">Sport</SelectItem>
                      <SelectItem value="EDUCATE">Education</SelectItem>
                      <SelectItem value="DRAMA">Drama</SelectItem>
                      <SelectItem value="CULTURE">Culture</SelectItem>
                      <SelectItem value="SCIENCE">Science</SelectItem>
                      <SelectItem value="VARIED">Varied</SelectItem>
                      <SelectItem value="POP M">Pop Music</SelectItem>
                      <SelectItem value="ROCK M">Rock Music</SelectItem>
                      <SelectItem value="EASY M">Easy Listening</SelectItem>
                      <SelectItem value="LIGHT M">Light Classical</SelectItem>
                      <SelectItem value="CLASSICS">Serious Classical</SelectItem>
                      <SelectItem value="OTHER M">Other Music</SelectItem>
                      <SelectItem value="WEATHER">Weather</SelectItem>
                      <SelectItem value="FINANCE">Finance</SelectItem>
                      <SelectItem value="CHILDREN">Children's Programs</SelectItem>
                      <SelectItem value="SOCIAL">Social Affairs</SelectItem>
                      <SelectItem value="RELIGION">Religion</SelectItem>
                      <SelectItem value="PHONE IN">Phone In</SelectItem>
                      <SelectItem value="TRAVEL">Travel</SelectItem>
                      <SelectItem value="LEISURE">Leisure</SelectItem>
                      <SelectItem value="JAZZ">Jazz Music</SelectItem>
                      <SelectItem value="COUNTRY">Country Music</SelectItem>
                      <SelectItem value="NATION M">National Music</SelectItem>
                      <SelectItem value="OLDIES">Oldies Music</SelectItem>
                      <SelectItem value="FOLK M">Folk Music</SelectItem>
                      <SelectItem value="DOCUMENT">Documentary</SelectItem>
                      <SelectItem value="TEST">Test</SelectItem>
                      <SelectItem value="ALARM">Alarm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="drive-level">Drive Level ({rdsSettings.driveRTLevel}%)</Label>
                  <Slider
                    id="drive-level"
                    min={0}
                    max={6}
                    step={0.1}
                    value={[rdsSettings.driveRTLevel]}
                    onValueChange={(value) => handleRdsSliderChange('driveRTLevel', value)}
                    disabled={!rdsSettings.enabled}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phase">RDS Phase ({rdsSettings.phase}°)</Label>
                <Slider
                  id="phase"
                  min={0}
                  max={360}
                  step={1}
                  value={[rdsSettings.phase]}
                  onValueChange={(value) => handleRdsSliderChange('phase', value)}
                  disabled={!rdsSettings.enabled}
                />
              </div>
              
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="dynamic-pty"
                    checked={rdsSettings.dynamicPTY}
                    onCheckedChange={(value) => handleRdsChange('dynamicPTY', value)}
                    disabled={!rdsSettings.enabled}
                  />
                  <Label htmlFor="dynamic-pty">Dynamic PTY</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="traffic-announcement"
                    checked={rdsSettings.trafficAnnouncement}
                    onCheckedChange={(value) => handleRdsChange('trafficAnnouncement', value)}
                    disabled={!rdsSettings.enabled}
                  />
                  <Label htmlFor="traffic-announcement">Traffic Announcement</Label>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="flex justify-between">
                  Alternative Frequencies
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-5 w-5"
                    onClick={addAltFrequency}
                    disabled={!rdsSettings.enabled}
                  >
                    <CheckSquare className="h-3 w-3" />
                  </Button>
                </Label>
                <div className="space-y-2">
                  {rdsSettings.altFrequencies.map((freq, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={freq}
                        onChange={(e) => handleAltFrequencyChange(index, e.target.value)}
                        placeholder="MHz"
                        className="flex-1"
                        disabled={!rdsSettings.enabled}
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeAltFrequency(index)}
                        disabled={!rdsSettings.enabled}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="text-xs text-gray-400 p-3 bg-gray-950 border border-gray-800 rounded-md">
                <p className="mb-1">
                  <strong>RDS (Radio Data System)</strong> transmits digital information on a 57 kHz subcarrier,
                  providing station information and enhanced features to FM receivers.
                </p>
                <p>
                  <span className="text-blue-400">PI Code</span> is a unique station identifier (country code + station ID).
                  <span className="text-blue-400"> PS Name</span> is the 8-character station name displayed on receivers.
                  <span className="text-blue-400"> RadioText</span> can display longer messages like song information.
                  <span className="text-blue-400"> Alternative Frequencies</span> help receivers automatically switch
                  to stronger signals from the same station.
                </p>
              </div>
            </div>
          </TabsContent>
          
          {/* Composite Clipper Tab */}
          <TabsContent value="clipper" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h3 className="text-sm font-medium">Composite Clipper</h3>
                <Switch 
                  className="ml-2"
                  checked={clipperSettings.enabled}
                  onCheckedChange={(value) => handleClipperChange('enabled', value)}
                />
              </div>
              <div className="text-xs text-gray-400">
                Controls peak MPX levels
              </div>
            </div>
            
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="threshold">Threshold ({clipperSettings.threshold}%)</Label>
                  <Slider
                    id="threshold"
                    min={80}
                    max={120}
                    step={1}
                    value={[clipperSettings.threshold]}
                    onValueChange={(value) => handleClipperSliderChange('threshold', value)}
                    disabled={!clipperSettings.enabled}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="drive-level">Drive Level ({clipperSettings.driveLevel}%)</Label>
                  <Slider
                    id="drive-level"
                    min={0}
                    max={100}
                    step={1}
                    value={[clipperSettings.driveLevel]}
                    onValueChange={(value) => handleClipperSliderChange('driveLevel', value)}
                    disabled={!clipperSettings.enabled}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="asymmetry">Asymmetry ({clipperSettings.asymmetry}%)</Label>
                  <Slider
                    id="asymmetry"
                    min={-50}
                    max={50}
                    step={1}
                    value={[clipperSettings.asymmetry]}
                    onValueChange={(value) => handleClipperSliderChange('asymmetry', value)}
                    disabled={!clipperSettings.enabled}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="clipper-mode">Clipper Mode</Label>
                  <Select
                    value={clipperSettings.mode}
                    onValueChange={(value) => handleClipperChange('mode', value)}
                    disabled={!clipperSettings.enabled}
                  >
                    <SelectTrigger id="clipper-mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hard">Hard Clipper</SelectItem>
                      <SelectItem value="soft">Soft Clipper</SelectItem>
                      <SelectItem value="adaptive">Adaptive Clipper</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="oversample">Oversampling</Label>
                  <Select
                    value={clipperSettings.oversample}
                    onValueChange={(value) => handleClipperChange('oversample', value)}
                    disabled={!clipperSettings.enabled}
                  >
                    <SelectTrigger id="oversample">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1x">1x (None)</SelectItem>
                      <SelectItem value="2x">2x</SelectItem>
                      <SelectItem value="4x">4x (Recommended)</SelectItem>
                      <SelectItem value="8x">8x (Highest Quality)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex flex-col justify-center space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="itr-band"
                      checked={clipperSettings.itrBand}
                      onCheckedChange={(value) => handleClipperChange('itrBand', value)}
                      disabled={!clipperSettings.enabled}
                    />
                    <Label htmlFor="itr-band">ITU-R BS.412 Protection</Label>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="bass-protection"
                    checked={clipperSettings.bassProtection}
                    onCheckedChange={(value) => handleClipperChange('bassProtection', value)}
                    disabled={!clipperSettings.enabled}
                  />
                  <Label htmlFor="bass-protection">Bass Protection</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="bandwidth-extension"
                    checked={clipperSettings.bandwidthExtension}
                    onCheckedChange={(value) => handleClipperChange('bandwidthExtension', value)}
                    disabled={!clipperSettings.enabled}
                  />
                  <Label htmlFor="bandwidth-extension">Bandwidth Extension</Label>
                </div>
              </div>
              
              <div className="text-xs text-gray-400 p-3 bg-gray-950 border border-gray-800 rounded-md">
                <p className="mb-1">
                  <strong>Composite Clipper</strong> controls the maximum FM deviation (modulation) by limiting
                  the MPX signal before transmission. This helps prevent over-modulation while maximizing loudness.
                </p>
                <p>
                  <span className="text-blue-400">Threshold</span> controls the clipping point (100% = standard modulation limit).
                  <span className="text-blue-400"> ITU-R BS.412 Protection</span> ensures compliance with European
                  regulations by adjusting clipping based on stereo width.
                  <span className="text-blue-400"> Oversampling</span> and <span className="text-blue-400">Soft Clipping</span> reduce
                  distortion artifacts while <span className="text-blue-400">Asymmetry</span> allows for positive peak enhancement.
                </p>
              </div>
            </div>
          </TabsContent>
          
          {/* HD Radio Tab */}
          <TabsContent value="hd" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h3 className="text-sm font-medium">HD Radio Processing</h3>
                <Switch 
                  className="ml-2"
                  checked={hdSettings.enabled}
                  onCheckedChange={(value) => handleHDChange('enabled', value)}
                />
              </div>
              <div className="text-xs text-gray-400">
                Digital audio processing for HD Radio broadcasts
              </div>
            </div>
            
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="active-delay">Alignment Delay ({hdSettings.activeDelay} samples)</Label>
                  <Slider
                    id="active-delay"
                    min={0}
                    max={16384}
                    step={1}
                    value={[hdSettings.activeDelay]}
                    onValueChange={(value) => handleHDSliderChange('activeDelay', value)}
                    disabled={!hdSettings.enabled}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="diversity">Blend Control ({hdSettings.diversity}%)</Label>
                  <Slider
                    id="diversity"
                    min={0}
                    max={100}
                    step={1}
                    value={[hdSettings.diversity]}
                    onValueChange={(value) => handleHDSliderChange('diversity', value)}
                    disabled={!hdSettings.enabled}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hd-gain">HD Output Gain ({hdSettings.hdGain} dB)</Label>
                  <Slider
                    id="hd-gain"
                    min={-12}
                    max={12}
                    step={0.1}
                    value={[hdSettings.hdGain]}
                    onValueChange={(value) => handleHDSliderChange('hdGain', value)}
                    disabled={!hdSettings.enabled}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="hd-limiter">HD Limiter Threshold ({hdSettings.hdLimiterThreshold} dB)</Label>
                  <Slider
                    id="hd-limiter"
                    min={-12}
                    max={0}
                    step={0.1}
                    value={[hdSettings.hdLimiterThreshold]}
                    onValueChange={(value) => handleHDSliderChange('hdLimiterThreshold', value)}
                    disabled={!hdSettings.enabled}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sync-level">Sync Level ({hdSettings.syncLevel}%)</Label>
                  <Slider
                    id="sync-level"
                    min={0}
                    max={100}
                    step={1}
                    value={[hdSettings.syncLevel]}
                    onValueChange={(value) => handleHDSliderChange('syncLevel', value)}
                    disabled={!hdSettings.enabled}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="hd-preset">HD Audio Preset</Label>
                  <Select
                    value={hdSettings.hdPreset}
                    onValueChange={(value) => handleHDChange('hdPreset', value)}
                    disabled={!hdSettings.enabled}
                  >
                    <SelectTrigger id="hd-preset">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="enhanced">Enhanced</SelectItem>
                      <SelectItem value="extreme">Extreme</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="delay-compensation"
                  checked={hdSettings.delayCompensation}
                  onCheckedChange={(value) => handleHDChange('delayCompensation', value)}
                  disabled={!hdSettings.enabled}
                />
                <Label htmlFor="delay-compensation">Automatic Delay Compensation</Label>
              </div>
              
              <div className="text-xs text-gray-400 p-3 bg-gray-950 border border-gray-800 rounded-md">
                <p className="mb-1">
                  <strong>HD Radio Processing</strong> configures digital audio signal processing for hybrid
                  analog/digital radio broadcasts in the United States and some other countries.
                </p>
                <p>
                  <span className="text-blue-400">Alignment Delay</span> synchronizes analog and digital signals for
                  smooth blending. <span className="text-blue-400">Blend Control</span> manages the transition between analog
                  and digital signals as reception changes. <span className="text-blue-400">HD Audio Preset</span> configures
                  the processing characteristics for the digital signal, taking advantage of the wider frequency response
                  and dynamic range of digital broadcasting.
                </p>
              </div>
            </div>
          </TabsContent>
          
          {/* DAB+ Tab */}
          <TabsContent value="dab" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h3 className="text-sm font-medium">DAB+ Processing</h3>
                <Switch 
                  className="ml-2"
                  checked={dabSettings.enabled}
                  onCheckedChange={(value) => handleDABChange('enabled', value)}
                />
              </div>
              <div className="text-xs text-gray-400">
                Digital Audio Broadcasting settings
              </div>
            </div>
            
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bitrate">Bitrate ({dabSettings.bitrate} kbps)</Label>
                  <Slider
                    id="bitrate"
                    min={32}
                    max={192}
                    step={8}
                    value={[dabSettings.bitrate]}
                    onValueChange={(value) => handleDABSliderChange('bitrate', value)}
                    disabled={!dabSettings.enabled}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bandwidth-limit">Bandwidth Limit ({dabSettings.bandwidthLimit} Hz)</Label>
                  <Slider
                    id="bandwidth-limit"
                    min={10000}
                    max={20000}
                    step={500}
                    value={[dabSettings.bandwidthLimit]}
                    onValueChange={(value) => handleDABSliderChange('bandwidthLimit', value)}
                    disabled={!dabSettings.enabled}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="aac-gain">AAC Output Gain ({dabSettings.aacGain} dB)</Label>
                  <Slider
                    id="aac-gain"
                    min={-12}
                    max={12}
                    step={0.1}
                    value={[dabSettings.aacGain]}
                    onValueChange={(value) => handleDABSliderChange('aacGain', value)}
                    disabled={!dabSettings.enabled}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="protection">Error Protection</Label>
                  <Select
                    value={dabSettings.protection}
                    onValueChange={(value) => handleDABChange('protection', value)}
                    disabled={!dabSettings.enabled}
                  >
                    <SelectTrigger id="protection">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="audio-object-type">Audio Object Type</Label>
                  <Select
                    value={dabSettings.audioObjectType}
                    onValueChange={(value) => handleDABChange('audioObjectType', value)}
                    disabled={!dabSettings.enabled || !dabSettings.dabPlusMode}
                  >
                    <SelectTrigger id="audio-object-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LC">LC-AAC (Low Complexity)</SelectItem>
                      <SelectItem value="HE">HE-AAC (High Efficiency)</SelectItem>
                      <SelectItem value="HE v2">HE-AAC v2 (with PS)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex flex-col justify-center space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="dab-plus"
                      checked={dabSettings.dabPlusMode}
                      onCheckedChange={(value) => handleDABChange('dabPlusMode', value)}
                      disabled={!dabSettings.enabled}
                    />
                    <Label htmlFor="dab-plus">DAB+ Mode (AAC)</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="parametric-stereo"
                      checked={dabSettings.parametricStereo}
                      onCheckedChange={(value) => handleDABChange('parametricStereo', value)}
                      disabled={!dabSettings.enabled || !dabSettings.dabPlusMode || dabSettings.audioObjectType !== 'HE v2'}
                    />
                    <Label htmlFor="parametric-stereo">Parametric Stereo</Label>
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-gray-400 p-3 bg-gray-950 border border-gray-800 rounded-md">
                <p className="mb-1">
                  <strong>DAB+ Processing</strong> configures the digital signal processing for Digital Audio
                  Broadcasting plus, the enhanced version of the DAB standard used in Europe and elsewhere.
                </p>
                <p>
                  <span className="text-blue-400">DAB+</span> uses the AAC codec instead of MP2 used in original DAB.
                  <span className="text-blue-400"> HE-AAC</span> (High-Efficiency AAC) and <span className="text-blue-400">PS</span> 
                  (Parametric Stereo) significantly improve audio quality at low bitrates.
                  <span className="text-blue-400"> Bandwidth Limiting</span> and <span className="text-blue-400">Bitrate</span> 
                  settings should be balanced based on your allocated multiplex capacity.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Control buttons at the bottom */}
        <div className="flex justify-between mt-4">
          <Button
            variant="outline"
            size="sm"
            className="text-gray-400"
            onClick={resetSettings}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset All
          </Button>
          
          <Button
            variant="default"
            size="sm"
            onClick={onSave}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FMProcessingSection;
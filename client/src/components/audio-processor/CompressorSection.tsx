import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  BarChart3,
  BarChart4,
  Save,
  RefreshCw,
  Waves,
  Settings,
  PlayCircle,
  StopCircle,
  Upload,
  Download,
  Activity,
  SlidersHorizontal,
  Check,
  X,
  Copy,
  ArrowDownUp,
  Gauge,
  SlidersHorizontal as LevelIcon,
  Volume2,
  Layers
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

interface CompressorSectionProps {
  onSave?: () => void;
}

// Defining types for our compressor bands
interface CompressorBand {
  id: number;
  enabled: boolean;
  frequency: number;
  lowFreq: number;
  highFreq: number;
  threshold: number;
  ratio: number;
  attack: number;
  release: number;
  knee: number;
  gain: number;
  mode: 'downward' | 'upward';
  solo?: boolean;
  bypass?: boolean;
}

// AGC (Automatic Gain Control) settings
interface AGCSettings {
  enabled: boolean;
  target: number;
  speed: number;
  freeze: boolean;
}

// Expander/Gate settings
interface GateSettings {
  enabled: boolean;
  threshold: number;
  ratio: number;
  attack: number;
  release: number;
  range: number;
}

// Limiter settings
interface LimiterSettings {
  enabled: boolean;
  threshold: number;
  release: number;
  lookahead: boolean;
  truePeak: boolean;
  ceiling: number;
}

// Stereo Compressor settings
interface StereoCompressorSettings {
  enabled: boolean;
  mode: 'stereo' | 'dual-mono' | 'mid-side';
  threshold: number;
  ratio: number;
  attack: number;
  release: number;
  knee: number;
  gain: number;
  midSideRatio: number;
}

// For AGC preset selection
const AGC_PRESETS = [
  { id: 'gentle', name: 'Gentle', description: 'Slow, gentle correction' },
  { id: 'medium', name: 'Medium', description: 'Balanced correction speed' },
  { id: 'aggressive', name: 'Aggressive', description: 'Fast level correction' },
  { id: 'voice', name: 'Voice', description: 'Optimized for speech' },
  { id: 'music', name: 'Music', description: 'Optimized for music' },
];

// For compressor preset selection
const COMPRESSOR_PRESETS = [
  { id: 'gentle', name: 'Gentle', description: 'Subtle, transparent compression' },
  { id: 'vocal', name: 'Vocal', description: 'Vocal compression with presence' },
  { id: 'punch', name: 'Punch', description: 'Hard-hitting drums and percussive sounds' },
  { id: 'master', name: 'Mastering', description: 'Subtle glue for mastering' },
  { id: 'broadcast', name: 'Broadcast', description: 'Consistent loudness for broadcasting' },
];

// Create default multiband compressor bands 
const createDefaultBands = (): CompressorBand[] => {
  // Define frequency bands for a 5-band compressor (can be expanded up to 9)
  const bands: CompressorBand[] = [
    {
      id: 1,
      enabled: true, 
      frequency: 80,
      lowFreq: 20,
      highFreq: 150, 
      threshold: -24,
      ratio: 4,
      attack: 5,
      release: 150, 
      knee: 6,
      gain: 3,
      mode: 'downward'
    },
    {
      id: 2,
      enabled: true, 
      frequency: 300,
      lowFreq: 150,
      highFreq: 500, 
      threshold: -20,
      ratio: 3,
      attack: 10,
      release: 200, 
      knee: 6,
      gain: 2,
      mode: 'downward'
    },
    {
      id: 3,
      enabled: true, 
      frequency: 1000,
      lowFreq: 500,
      highFreq: 2000, 
      threshold: -18,
      ratio: 2.5,
      attack: 15,
      release: 250, 
      knee: 8,
      gain: 1.5,
      mode: 'downward'
    },
    {
      id: 4,
      enabled: true, 
      frequency: 3500,
      lowFreq: 2000,
      highFreq: 6000, 
      threshold: -16,
      ratio: 2,
      attack: 10,
      release: 200, 
      knee: 6,
      gain: 2,
      mode: 'downward'
    },
    {
      id: 5,
      enabled: true, 
      frequency: 10000,
      lowFreq: 6000,
      highFreq: 20000, 
      threshold: -14,
      ratio: 1.5,
      attack: 5,
      release: 150, 
      knee: 4,
      gain: 1,
      mode: 'downward'
    }
  ];

  return bands;
};

// Get band color based on band ID
const getBandColor = (bandId: number): string => {
  switch (bandId) {
    case 1: return 'blue';       // Low bass
    case 2: return 'indigo';     // Upper bass
    case 3: return 'violet';     // Lower mids
    case 4: return 'purple';     // Mids
    case 5: return 'emerald';    // Upper mids
    case 6: return 'yellow';     // Presence
    case 7: return 'orange';     // Lower highs
    case 8: return 'red';        // Highs
    case 9: return 'rose';       // Air
    default: return 'gray';
  }
};

const CompressorSection: React.FC<CompressorSectionProps> = ({ onSave }) => {
  // State for active tab (multiband, agc, expander, limiter, stereo)
  const [activeTab, setActiveTab] = useState<string>('multiband');
  
  // State for main compressor parameters
  const [compressorEnabled, setCompressorEnabled] = useState<boolean>(true);
  
  // Multiband compressor state
  const [multibandEnabled, setMultibandEnabled] = useState<boolean>(true);
  const [bands, setBands] = useState<CompressorBand[]>(createDefaultBands());
  const [activeBandId, setActiveBandId] = useState<number>(1);
  const [bandCount, setBandCount] = useState<number>(5);
  
  // AGC state
  const [agcSettings, setAgcSettings] = useState<AGCSettings>({
    enabled: true,
    target: -14,
    speed: 50,
    freeze: false
  });
  
  // Expander/Gate state
  const [gateSettings, setGateSettings] = useState<GateSettings>({
    enabled: false,
    threshold: -40,
    ratio: 4,
    attack: 1,
    release: 100,
    range: 20
  });
  
  // Limiter state
  const [limiterSettings, setLimiterSettings] = useState<LimiterSettings>({
    enabled: true,
    threshold: -0.5,
    release: 50,
    lookahead: true,
    truePeak: true,
    ceiling: -0.1
  });
  
  // Stereo compressor state
  const [stereoCompressorSettings, setStereoCompressorSettings] = useState<StereoCompressorSettings>({
    enabled: false,
    mode: 'stereo',
    threshold: -18,
    ratio: 3,
    attack: 10,
    release: 150,
    knee: 6,
    gain: 2,
    midSideRatio: 1.0
  });
  
  // Reference to canvas elements
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const miniCanvasRef = useRef<HTMLCanvasElement[]>([]);
  
  // Get the active band
  const activeBand = bands.find(band => band.id === activeBandId) || bands[0];
  
  // Handle band selection change
  const handleBandSelect = (id: number) => {
    setActiveBandId(id);
  };
  
  // Handle band parameter changes
  const handleBandChange = (property: keyof CompressorBand, value: number | boolean | string) => {
    setBands(prevBands => 
      prevBands.map(band => 
        band.id === activeBandId 
          ? { ...band, [property]: value } 
          : band
      )
    );
  };
  
  // Handle band parameter changes from slider
  const handleSliderChange = (property: keyof CompressorBand, values: number[]) => {
    if (values.length > 0) {
      handleBandChange(property, values[0]);
    }
  };

  // Handle AGC setting changes
  const handleAgcChange = (property: keyof AGCSettings, value: number | boolean) => {
    setAgcSettings(prev => ({
      ...prev,
      [property]: value
    }));
  };
  
  // Handle gate setting changes
  const handleGateChange = (property: keyof GateSettings, value: number | boolean) => {
    setGateSettings(prev => ({
      ...prev,
      [property]: value
    }));
  };
  
  // Handle gate setting changes from slider
  const handleGateSliderChange = (property: keyof GateSettings, values: number[]) => {
    if (values.length > 0) {
      handleGateChange(property, values[0]);
    }
  };
  
  // Handle limiter setting changes
  const handleLimiterChange = (property: keyof LimiterSettings, value: number | boolean) => {
    setLimiterSettings(prev => ({
      ...prev,
      [property]: value
    }));
  };
  
  // Handle limiter setting changes from slider
  const handleLimiterSliderChange = (property: keyof LimiterSettings, values: number[]) => {
    if (values.length > 0) {
      handleLimiterChange(property, values[0]);
    }
  };
  
  // Handle stereo compressor setting changes
  const handleStereoCompressorChange = (property: keyof StereoCompressorSettings, value: number | boolean | string) => {
    setStereoCompressorSettings(prev => ({
      ...prev,
      [property]: value
    }));
  };
  
  // Handle stereo compressor setting changes from slider
  const handleStereoCompressorSliderChange = (property: keyof StereoCompressorSettings, values: number[]) => {
    if (values.length > 0) {
      handleStereoCompressorChange(property, values[0]);
    }
  };
  
  // Handle band count change
  const handleBandCountChange = (count: number) => {
    if (count === bandCount) return;
    
    // Adjust the band count by adding or removing bands
    if (count > bandCount) {
      // Adding bands
      const newBands = [...bands];
      
      // Define crossover points for new bands
      const existingFrequencies = bands.map(band => band.frequency).sort((a, b) => a - b);
      
      for (let i = bandCount; i < count; i++) {
        // Find the largest gap in the frequency spectrum
        let largestGap = 0;
        let gapCenter = 0;
        
        for (let j = 0; j < existingFrequencies.length - 1; j++) {
          const gap = Math.log10(existingFrequencies[j + 1]) - Math.log10(existingFrequencies[j]);
          if (gap > largestGap) {
            largestGap = gap;
            gapCenter = Math.pow(10, (Math.log10(existingFrequencies[j]) + Math.log10(existingFrequencies[j + 1])) / 2);
          }
        }
        
        // Create a new band in the largest gap
        const newBand: CompressorBand = {
          id: i + 1,
          enabled: true,
          frequency: Math.round(gapCenter),
          lowFreq: Math.round(gapCenter / 2),
          highFreq: Math.round(gapCenter * 2),
          threshold: -18,
          ratio: 2.5,
          attack: 10, 
          release: 200,
          knee: 6,
          gain: 2,
          mode: 'downward'
        };
        
        newBands.push(newBand);
        existingFrequencies.push(newBand.frequency);
        existingFrequencies.sort((a, b) => a - b);
      }
      
      // Renumber IDs to ensure they are sequential
      newBands.sort((a, b) => a.frequency - b.frequency);
      newBands.forEach((band, index) => { band.id = index + 1; });
      
      setBands(newBands);
    } else {
      // Removing bands
      const sortedBands = [...bands].sort((a, b) => a.frequency - b.frequency);
      const newBands = sortedBands.slice(0, count);
      
      // Update IDs to ensure they are sequential
      newBands.forEach((band, index) => { band.id = index + 1; });
      
      setBands(newBands);
      
      // Update active band if needed
      if (activeBandId > count) {
        setActiveBandId(count);
      }
    }
    
    setBandCount(count);
  };
  
  // Reset all settings to default
  const resetSettings = () => {
    if (window.confirm('Reset all compression settings to default?')) {
      setBands(createDefaultBands());
      setAgcSettings({
        enabled: true,
        target: -14,
        speed: 50,
        freeze: false
      });
      setGateSettings({
        enabled: false,
        threshold: -40,
        ratio: 4,
        attack: 1,
        release: 100,
        range: 20
      });
      setLimiterSettings({
        enabled: true,
        threshold: -0.5,
        release: 50,
        lookahead: true,
        truePeak: true,
        ceiling: -0.1
      });
      setStereoCompressorSettings({
        enabled: false,
        mode: 'stereo',
        threshold: -18,
        ratio: 3,
        attack: 10,
        release: 150,
        knee: 6,
        gain: 2,
        midSideRatio: 1.0
      });
    }
  };
  
  // Load a preset for multiband compressor
  const loadMultibandPreset = (presetId: string) => {
    switch (presetId) {
      case 'gentle':
        setBands(prevBands => prevBands.map(band => ({
          ...band,
          threshold: -24,
          ratio: Math.max(1.5, band.ratio / 2),
          attack: band.attack * 1.5,
          release: band.release * 1.5,
          knee: 12
        })));
        break;
      case 'vocal':
        setBands(prevBands => prevBands.map(band => {
          if (band.frequency > 500 && band.frequency < 3000) {
            // More compression in vocal range
            return {
              ...band,
              threshold: -22,
              ratio: 4,
              attack: 10,
              release: 150,
              knee: 6,
              gain: 3
            };
          } else {
            // Less compression outside vocal range
            return {
              ...band,
              threshold: -18,
              ratio: 2,
              attack: 15,
              release: 200,
              knee: 8,
              gain: 1
            };
          }
        }));
        break;
      case 'punch':
        setBands(prevBands => prevBands.map(band => {
          if (band.frequency < 250) {
            // Heavy compression for low-end punch
            return {
              ...band,
              threshold: -28,
              ratio: 6,
              attack: 2,
              release: 100,
              knee: 3,
              gain: 4
            };
          } else {
            return {
              ...band,
              threshold: -20,
              ratio: 3,
              attack: 8,
              release: 150,
              knee: 6,
              gain: 2
            };
          }
        }));
        break;
      case 'master':
        setBands(prevBands => prevBands.map(band => ({
          ...band,
          threshold: -16,
          ratio: 1.8,
          attack: 20,
          release: 250,
          knee: 12,
          gain: 1
        })));
        break;
      case 'broadcast':
        setBands(prevBands => prevBands.map(band => ({
          ...band,
          threshold: -20,
          ratio: 4,
          attack: 5,
          release: 100,
          knee: 6,
          gain: 3
        })));
        break;
    }
  };
  
  // Draw the compressor visualization on canvas
  useEffect(() => {
    if (!canvasRef.current || !compressorEnabled) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size to match parent container
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Constants for drawing
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    const padding = 30;
    const graphWidth = width - 2 * padding;
    const graphHeight = height - 2 * padding;
    
    // Draw grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    
    // Horizontal grid lines (input level)
    const dbSteps = [-60, -48, -36, -24, -12, 0];
    
    dbSteps.forEach(db => {
      const normalizedDb = (db + 60) / 60; // Normalize to 0-1 range
      const y = padding + graphHeight * (1 - normalizedDb);
      
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
      
      // Label
      ctx.fillStyle = '#666';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${db}`, padding - 5, y + 3);
    });
    
    // Vertical grid lines (output level)
    dbSteps.forEach(db => {
      const normalizedDb = (db + 60) / 60; // Normalize to 0-1 range
      const x = padding + graphWidth * normalizedDb;
      
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
      
      // Label
      ctx.fillStyle = '#666';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${db}`, x, height - padding + 15);
    });
    
    // X and Y axis labels
    ctx.fillStyle = '#888';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Input Level (dB)', width / 2, height - 5);
    
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Output Level (dB)', 0, 0);
    ctx.restore();
    
    // Draw 1:1 reference line (input = output)
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, padding);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw the compression curve for the currently selected band
    if (activeTab === 'multiband' && activeBand) {
      ctx.strokeStyle = activeBand.enabled ? `var(--${getBandColor(activeBand.id)}-500)` : '#777';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      // Start at the bottom left
      ctx.moveTo(padding, height - padding);
      
      // Calculate points along the compression curve
      const points = 100;
      const threshold = activeBand.threshold;
      const ratio = activeBand.ratio;
      const knee = activeBand.knee;
      const gain = activeBand.gain;
      
      for (let i = 0; i <= points; i++) {
        const inputDb = -60 + (i / points) * 60; // -60dB to 0dB
        
        // Apply compression curve
        let outputDb;
        if (inputDb < threshold - knee / 2) {
          // Below knee start - no compression
          outputDb = inputDb;
        } else if (inputDb > threshold + knee / 2) {
          // Above knee end - full compression
          const dbOverThreshold = inputDb - (threshold + knee / 2);
          outputDb = threshold + knee / 2 + dbOverThreshold / ratio;
        } else {
          // Within knee range - gradual transition to compression
          const kneeRangeDb = inputDb - (threshold - knee / 2);
          const kneePercentage = kneeRangeDb / knee;
          const effectiveRatio = 1 + (ratio - 1) * kneePercentage;
          outputDb = inputDb - (kneePercentage * kneeRangeDb * (1 - 1 / effectiveRatio));
        }
        
        // Apply makeup gain
        outputDb += gain;
        
        // Convert to canvas coordinates
        const x = padding + ((inputDb + 60) / 60) * graphWidth;
        const y = padding + (1 - ((outputDb + 60) / 60)) * graphHeight;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.stroke();
      
      // Mark the threshold point
      const thresholdX = padding + ((threshold + 60) / 60) * graphWidth;
      const thresholdY = padding + (1 - ((threshold + 60) / 60)) * graphHeight;
      
      ctx.fillStyle = activeBand.enabled ? `var(--${getBandColor(activeBand.id)}-500)` : '#777';
      ctx.beginPath();
      ctx.arc(thresholdX, thresholdY, 5, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw threshold lines
      ctx.strokeStyle = activeBand.enabled ? `var(--${getBandColor(activeBand.id)}-500)` : '#777';
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(thresholdX, padding);
      ctx.lineTo(thresholdX, height - padding);
      ctx.moveTo(padding, thresholdY);
      ctx.lineTo(width - padding, thresholdY);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (activeTab === 'stereo' && stereoCompressorSettings.enabled) {
      // Draw the stereo compressor curve
      ctx.strokeStyle = '#e879f9'; // Purple for stereo compressor
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      // Start at the bottom left
      ctx.moveTo(padding, height - padding);
      
      // Calculate points along the compression curve
      const points = 100;
      const threshold = stereoCompressorSettings.threshold;
      const ratio = stereoCompressorSettings.ratio;
      const knee = stereoCompressorSettings.knee;
      const gain = stereoCompressorSettings.gain;
      
      for (let i = 0; i <= points; i++) {
        const inputDb = -60 + (i / points) * 60; // -60dB to 0dB
        
        // Apply compression curve
        let outputDb;
        if (inputDb < threshold - knee / 2) {
          // Below knee start - no compression
          outputDb = inputDb;
        } else if (inputDb > threshold + knee / 2) {
          // Above knee end - full compression
          const dbOverThreshold = inputDb - (threshold + knee / 2);
          outputDb = threshold + knee / 2 + dbOverThreshold / ratio;
        } else {
          // Within knee range - gradual transition to compression
          const kneeRangeDb = inputDb - (threshold - knee / 2);
          const kneePercentage = kneeRangeDb / knee;
          const effectiveRatio = 1 + (ratio - 1) * kneePercentage;
          outputDb = inputDb - (kneePercentage * kneeRangeDb * (1 - 1 / effectiveRatio));
        }
        
        // Apply makeup gain
        outputDb += gain;
        
        // Convert to canvas coordinates
        const x = padding + ((inputDb + 60) / 60) * graphWidth;
        const y = padding + (1 - ((outputDb + 60) / 60)) * graphHeight;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.stroke();
      
      // Mark the threshold point
      const thresholdX = padding + ((threshold + 60) / 60) * graphWidth;
      const thresholdY = padding + (1 - ((threshold + 60) / 60)) * graphHeight;
      
      ctx.fillStyle = '#e879f9';
      ctx.beginPath();
      ctx.arc(thresholdX, thresholdY, 5, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw threshold lines
      ctx.strokeStyle = '#e879f9';
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(thresholdX, padding);
      ctx.lineTo(thresholdX, height - padding);
      ctx.moveTo(padding, thresholdY);
      ctx.lineTo(width - padding, thresholdY);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (activeTab === 'expander' && gateSettings.enabled) {
      // Draw the expander/gate curve
      ctx.strokeStyle = '#fbbf24'; // Amber for expander
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      // Start at the bottom left
      ctx.moveTo(padding, height - padding);
      
      // Calculate points along the expansion curve
      const points = 100;
      const threshold = gateSettings.threshold;
      const ratio = gateSettings.ratio;
      const range = gateSettings.range;
      
      for (let i = 0; i <= points; i++) {
        const inputDb = -60 + (i / points) * 60; // -60dB to 0dB
        
        // Apply expansion curve
        let outputDb;
        if (inputDb > threshold) {
          // Above threshold - no expansion
          outputDb = inputDb;
        } else {
          // Below threshold - apply expansion
          const dbBelowThreshold = threshold - inputDb;
          outputDb = inputDb - Math.min(range, dbBelowThreshold * (ratio - 1));
        }
        
        // Convert to canvas coordinates
        const x = padding + ((inputDb + 60) / 60) * graphWidth;
        const y = padding + (1 - ((outputDb + 60) / 60)) * graphHeight;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.stroke();
      
      // Mark the threshold point
      const thresholdX = padding + ((threshold + 60) / 60) * graphWidth;
      const thresholdY = padding + (1 - ((threshold + 60) / 60)) * graphHeight;
      
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(thresholdX, thresholdY, 5, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw threshold lines
      ctx.strokeStyle = '#fbbf24';
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(thresholdX, padding);
      ctx.lineTo(thresholdX, height - padding);
      ctx.moveTo(padding, thresholdY);
      ctx.lineTo(width - padding, thresholdY);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (activeTab === 'limiter' && limiterSettings.enabled) {
      // Draw the limiter curve
      ctx.strokeStyle = '#ef4444'; // Red for limiter
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      // Start at the bottom left
      ctx.moveTo(padding, height - padding);
      
      // Calculate points along the limiter curve
      const points = 100;
      const threshold = limiterSettings.threshold;
      const ceiling = limiterSettings.ceiling;
      
      for (let i = 0; i <= points; i++) {
        const inputDb = -60 + (i / points) * 60; // -60dB to 0dB
        
        // Apply limiter curve
        let outputDb;
        if (inputDb < threshold) {
          // Below threshold - no limiting
          outputDb = inputDb;
        } else {
          // Above threshold - apply brick wall limiting
          outputDb = Math.min(inputDb, ceiling);
        }
        
        // Convert to canvas coordinates
        const x = padding + ((inputDb + 60) / 60) * graphWidth;
        const y = padding + (1 - ((outputDb + 60) / 60)) * graphHeight;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.stroke();
      
      // Mark the threshold point
      const thresholdX = padding + ((threshold + 60) / 60) * graphWidth;
      const thresholdY = padding + (1 - ((threshold + 60) / 60)) * graphHeight;
      
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(thresholdX, thresholdY, 5, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw threshold lines
      ctx.strokeStyle = '#ef4444';
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(thresholdX, padding);
      ctx.lineTo(thresholdX, height - padding);
      ctx.moveTo(padding, thresholdY);
      ctx.lineTo(width - padding, thresholdY);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
  }, [
    compressorEnabled, 
    activeTab, 
    activeBand, 
    activeBandId, 
    bands, 
    stereoCompressorSettings, 
    gateSettings, 
    limiterSettings
  ]);
  
  // Main component render
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-yellow-500 flex items-center justify-between">
          <div className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Compression & Dynamics
          </div>
          <Switch 
            checked={compressorEnabled}
            onCheckedChange={setCompressorEnabled}
          />
        </CardTitle>
      </CardHeader>
      <CardContent className={`${!compressorEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Tabs for the different compressor sections */}
        <Tabs defaultValue="multiband" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="multiband">
              <BarChart4 className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Multiband</span>
            </TabsTrigger>
            <TabsTrigger value="agc">
              <LevelIcon className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">AGC</span>
            </TabsTrigger>
            <TabsTrigger value="expander">
              <Gauge className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Expander</span>
            </TabsTrigger>
            <TabsTrigger value="limiter">
              <Waves className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Limiter</span>
            </TabsTrigger>
            <TabsTrigger value="stereo">
              <SlidersHorizontal className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Stereo</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Main compressor visualization */}
          <div className="w-full h-60 bg-gray-950 border border-gray-700 rounded-md mb-4 p-2 relative">
            <canvas 
              ref={canvasRef} 
              className="w-full h-full" 
              style={{ display: 'block' }}
            />
          </div>
          
          {/* Multiband Compressor Tab */}
          <TabsContent value="multiband" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h3 className="text-sm font-medium">Multiband Compressor</h3>
                <Switch 
                  className="ml-2"
                  checked={multibandEnabled}
                  onCheckedChange={setMultibandEnabled}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Select value={bandCount.toString()} onValueChange={(value) => handleBandCountChange(parseInt(value))}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Band Count" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 Bands</SelectItem>
                    <SelectItem value="4">4 Bands</SelectItem>
                    <SelectItem value="5">5 Bands</SelectItem>
                    <SelectItem value="6">6 Bands</SelectItem>
                    <SelectItem value="7">7 Bands</SelectItem>
                    <SelectItem value="8">8 Bands</SelectItem>
                    <SelectItem value="9">9 Bands</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select defaultValue="preset" onValueChange={loadMultibandPreset}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Presets" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preset" disabled>Presets</SelectItem>
                    {COMPRESSOR_PRESETS.map(preset => (
                      <SelectItem key={preset.id} value={preset.id}>
                        {preset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Band selection */}
            <div className="grid grid-cols-9 gap-1 mb-4">
              {bands.map((band) => (
                <Button
                  key={band.id}
                  variant={activeBandId === band.id ? "default" : "outline"}
                  size="sm"
                  className={`${activeBandId === band.id ? `bg-${getBandColor(band.id)}-500 hover:bg-${getBandColor(band.id)}-600` : ''} 
                               ${!band.enabled ? 'opacity-50' : ''}`}
                  onClick={() => handleBandSelect(band.id)}
                  disabled={!multibandEnabled}
                >
                  <span>Band {band.id}</span>
                </Button>
              )).slice(0, bandCount)}
            </div>
            
            {/* Active band controls */}
            {activeBand && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="band-enabled" className="text-xs">Enable</Label>
                      <Switch
                        id="band-enabled"
                        checked={activeBand.enabled}
                        onCheckedChange={(value) => handleBandChange('enabled', value)}
                        disabled={!multibandEnabled}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="band-solo" className="text-xs">Solo</Label>
                      <Switch
                        id="band-solo"
                        checked={activeBand.solo || false}
                        onCheckedChange={(value) => handleBandChange('solo', value)}
                        disabled={!multibandEnabled || !activeBand.enabled}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="band-bypass" className="text-xs">Bypass</Label>
                      <Switch
                        id="band-bypass"
                        checked={activeBand.bypass || false}
                        onCheckedChange={(value) => handleBandChange('bypass', value)}
                        disabled={!multibandEnabled || !activeBand.enabled}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="band-mode" className="text-xs">Mode</Label>
                    <Select 
                      value={activeBand.mode}
                      onValueChange={(value) => handleBandChange('mode', value)}
                      disabled={!multibandEnabled || !activeBand.enabled}
                    >
                      <SelectTrigger className="w-36" id="band-mode">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="downward">Downward Comp</SelectItem>
                        <SelectItem value="upward">Upward Comp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Frequency range display */}
                <div className="p-3 bg-gray-950 border border-gray-700 rounded-md">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{activeBand.lowFreq} Hz</span>
                    <span>{activeBand.frequency} Hz</span>
                    <span>{activeBand.highFreq} Hz</span>
                  </div>
                  <div className="h-2 bg-gradient-to-r from-blue-500 via-green-500 to-red-500 rounded-full mt-1">
                    <div 
                      className="h-full bg-gray-900 w-1/2 rounded-r-full"
                      style={{ 
                        width: `${(1 - (Math.log10(activeBand.frequency) - Math.log10(activeBand.lowFreq)) / (Math.log10(activeBand.highFreq) - Math.log10(activeBand.lowFreq))) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
                
                {/* Main compressor controls - first row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="threshold">Threshold ({activeBand.threshold} dB)</Label>
                    <Slider
                      id="threshold"
                      min={-60}
                      max={0}
                      step={0.5}
                      value={[activeBand.threshold]}
                      onValueChange={(value) => handleSliderChange('threshold', value)}
                      disabled={!multibandEnabled || !activeBand.enabled}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="ratio">Ratio ({activeBand.ratio}:1)</Label>
                    <Slider
                      id="ratio"
                      min={1}
                      max={20}
                      step={0.1}
                      value={[activeBand.ratio]}
                      onValueChange={(value) => handleSliderChange('ratio', value)}
                      disabled={!multibandEnabled || !activeBand.enabled}
                    />
                  </div>
                </div>
                
                {/* Second row of controls */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="attack">Attack ({activeBand.attack} ms)</Label>
                    <Slider
                      id="attack"
                      min={0.1}
                      max={100}
                      step={0.1}
                      value={[activeBand.attack]}
                      onValueChange={(value) => handleSliderChange('attack', value)}
                      disabled={!multibandEnabled || !activeBand.enabled}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="release">Release ({activeBand.release} ms)</Label>
                    <Slider
                      id="release"
                      min={5}
                      max={1000}
                      step={5}
                      value={[activeBand.release]}
                      onValueChange={(value) => handleSliderChange('release', value)}
                      disabled={!multibandEnabled || !activeBand.enabled}
                    />
                  </div>
                </div>
                
                {/* Third row of controls */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="knee">Knee ({activeBand.knee} dB)</Label>
                    <Slider
                      id="knee"
                      min={0}
                      max={24}
                      step={0.5}
                      value={[activeBand.knee]}
                      onValueChange={(value) => handleSliderChange('knee', value)}
                      disabled={!multibandEnabled || !activeBand.enabled}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="gain">Makeup Gain ({activeBand.gain} dB)</Label>
                    <Slider
                      id="gain"
                      min={0}
                      max={24}
                      step={0.5}
                      value={[activeBand.gain]}
                      onValueChange={(value) => handleSliderChange('gain', value)}
                      disabled={!multibandEnabled || !activeBand.enabled}
                    />
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
          
          {/* AGC (Automatic Gain Control) Tab */}
          <TabsContent value="agc" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h3 className="text-sm font-medium">Automatic Gain Control</h3>
                <Switch 
                  className="ml-2"
                  checked={agcSettings.enabled}
                  onCheckedChange={(value) => handleAgcChange('enabled', value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Select defaultValue="medium" onValueChange={(value) => {
                  switch (value) {
                    case 'gentle':
                      setAgcSettings(prev => ({ ...prev, speed: 30, target: -16 }));
                      break;
                    case 'medium':
                      setAgcSettings(prev => ({ ...prev, speed: 50, target: -14 }));
                      break;
                    case 'aggressive':
                      setAgcSettings(prev => ({ ...prev, speed: 80, target: -12 }));
                      break;
                    case 'voice':
                      setAgcSettings(prev => ({ ...prev, speed: 60, target: -16 }));
                      break;
                    case 'music':
                      setAgcSettings(prev => ({ ...prev, speed: 40, target: -14 }));
                      break;
                  }
                }}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Presets" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preset" disabled>AGC Presets</SelectItem>
                    {AGC_PRESETS.map(preset => (
                      <SelectItem key={preset.id} value={preset.id}>
                        {preset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* AGC visualization */}
            <div className="p-3 bg-gray-950 border border-gray-700 rounded-md">
              <div className="flex items-center justify-center">
                <div className="text-center w-full">
                  <div className="text-xs text-gray-400 mb-1">Target Level</div>
                  <div className={`text-2xl font-semibold ${agcSettings.enabled ? 'text-yellow-500' : 'text-gray-500'}`}>
                    {agcSettings.target} dB
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full w-full mt-2 overflow-hidden">
                    <div 
                      className={`h-full ${agcSettings.enabled ? 'bg-yellow-500' : 'bg-gray-600'}`}
                      style={{ width: `${(agcSettings.target + 24) / 24 * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>-24 dB</span>
                    <span>-12 dB</span>
                    <span>0 dB</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* AGC Controls */}
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="agc-target">Target Level ({agcSettings.target} dB)</Label>
                <Slider
                  id="agc-target"
                  min={-24}
                  max={-6}
                  step={0.5}
                  value={[agcSettings.target]}
                  onValueChange={(value) => handleAgcChange('target', value[0])}
                  disabled={!agcSettings.enabled}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="agc-speed">Speed ({agcSettings.speed}%)</Label>
                <Slider
                  id="agc-speed"
                  min={1}
                  max={100}
                  step={1}
                  value={[agcSettings.speed]}
                  onValueChange={(value) => handleAgcChange('speed', value[0])}
                  disabled={!agcSettings.enabled}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="agc-freeze" className="text-sm">Freeze on Silence</Label>
                  <Switch 
                    id="agc-freeze"
                    checked={agcSettings.freeze}
                    onCheckedChange={(value) => handleAgcChange('freeze', value)}
                    disabled={!agcSettings.enabled}
                  />
                </div>
                <div className="text-xs text-gray-400">
                  AGC maintains consistent average loudness
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Expander/Gate Tab */}
          <TabsContent value="expander" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h3 className="text-sm font-medium">Noise Gate / Expander</h3>
                <Switch 
                  className="ml-2"
                  checked={gateSettings.enabled}
                  onCheckedChange={(value) => handleGateChange('enabled', value)}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" 
                        onClick={() => {
                          handleGateChange('threshold', -40);
                          handleGateChange('ratio', 4);
                          handleGateChange('attack', 1);
                          handleGateChange('release', 100);
                          handleGateChange('range', 20);
                        }}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Reset to defaults</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="gate-threshold">Threshold ({gateSettings.threshold} dB)</Label>
                <Slider
                  id="gate-threshold"
                  min={-80}
                  max={-10}
                  step={0.5}
                  value={[gateSettings.threshold]}
                  onValueChange={(value) => handleGateSliderChange('threshold', value)}
                  disabled={!gateSettings.enabled}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gate-ratio">Ratio ({gateSettings.ratio}:1)</Label>
                <Slider
                  id="gate-ratio"
                  min={1.1}
                  max={20}
                  step={0.1}
                  value={[gateSettings.ratio]}
                  onValueChange={(value) => handleGateSliderChange('ratio', value)}
                  disabled={!gateSettings.enabled}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gate-attack">Attack ({gateSettings.attack} ms)</Label>
                  <Slider
                    id="gate-attack"
                    min={0.1}
                    max={100}
                    step={0.1}
                    value={[gateSettings.attack]}
                    onValueChange={(value) => handleGateSliderChange('attack', value)}
                    disabled={!gateSettings.enabled}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="gate-release">Release ({gateSettings.release} ms)</Label>
                  <Slider
                    id="gate-release"
                    min={5}
                    max={1000}
                    step={5}
                    value={[gateSettings.release]}
                    onValueChange={(value) => handleGateSliderChange('release', value)}
                    disabled={!gateSettings.enabled}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gate-range">Range ({gateSettings.range} dB)</Label>
                <Slider
                  id="gate-range"
                  min={1}
                  max={100}
                  step={1}
                  value={[gateSettings.range]}
                  onValueChange={(value) => handleGateSliderChange('range', value)}
                  disabled={!gateSettings.enabled}
                />
              </div>
              
              <div className="text-xs text-gray-400 p-3 bg-gray-950 border border-gray-800 rounded-md">
                <p className="mb-1">
                  <strong>Expander/Gate</strong> reduces noise by attenuating signals below the threshold.
                </p>
                <p>
                  Use lower ratio (1.5:1 - 3:1) for subtle noise reduction, higher ratio (4:1+) for more aggressive gating.
                </p>
              </div>
            </div>
          </TabsContent>
          
          {/* Limiter Tab */}
          <TabsContent value="limiter" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h3 className="text-sm font-medium">Limiter</h3>
                <Switch 
                  className="ml-2"
                  checked={limiterSettings.enabled}
                  onCheckedChange={(value) => handleLimiterChange('enabled', value)}
                />
              </div>
              
              <div className="text-xs text-gray-400">
                {limiterSettings.truePeak && limiterSettings.lookahead ? 
                  "True Peak + Look-ahead Mode" : 
                  limiterSettings.truePeak ? "True Peak Mode" : 
                  limiterSettings.lookahead ? "Look-ahead Mode" : "Standard Mode"}
              </div>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="limiter-threshold">Threshold ({limiterSettings.threshold} dB)</Label>
                <Slider
                  id="limiter-threshold"
                  min={-12}
                  max={0}
                  step={0.1}
                  value={[limiterSettings.threshold]}
                  onValueChange={(value) => handleLimiterSliderChange('threshold', value)}
                  disabled={!limiterSettings.enabled}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="limiter-ceiling">Ceiling ({limiterSettings.ceiling} dB)</Label>
                <Slider
                  id="limiter-ceiling"
                  min={-6}
                  max={0}
                  step={0.1}
                  value={[limiterSettings.ceiling]}
                  onValueChange={(value) => handleLimiterSliderChange('ceiling', value)}
                  disabled={!limiterSettings.enabled}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="limiter-release">Release ({limiterSettings.release} ms)</Label>
                <Slider
                  id="limiter-release"
                  min={1}
                  max={500}
                  step={1}
                  value={[limiterSettings.release]}
                  onValueChange={(value) => handleLimiterSliderChange('release', value)}
                  disabled={!limiterSettings.enabled}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="limiter-lookahead" className="text-sm">Look-ahead</Label>
                  <Switch 
                    id="limiter-lookahead"
                    checked={limiterSettings.lookahead}
                    onCheckedChange={(value) => handleLimiterChange('lookahead', value)}
                    disabled={!limiterSettings.enabled}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="limiter-truepeak" className="text-sm">True Peak</Label>
                  <Switch 
                    id="limiter-truepeak"
                    checked={limiterSettings.truePeak}
                    onCheckedChange={(value) => handleLimiterChange('truePeak', value)}
                    disabled={!limiterSettings.enabled}
                  />
                </div>
              </div>
              
              <div className="text-xs text-gray-400 p-3 bg-gray-950 border border-gray-800 rounded-md">
                <p>
                  <strong>Look-ahead</strong> provides cleaner limiting by analyzing the audio before processing.
                </p>
                <p className="mt-1">
                  <strong>True Peak</strong> detection prevents inter-sample peaks and digital clipping.
                </p>
              </div>
            </div>
          </TabsContent>
          
          {/* Stereo Compressor Tab */}
          <TabsContent value="stereo" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h3 className="text-sm font-medium">Stereo Compressor</h3>
                <Switch 
                  className="ml-2"
                  checked={stereoCompressorSettings.enabled}
                  onCheckedChange={(value) => handleStereoCompressorChange('enabled', value)}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Label htmlFor="stereo-mode" className="text-xs">Mode</Label>
                <Select 
                  value={stereoCompressorSettings.mode}
                  onValueChange={(value) => handleStereoCompressorChange('mode', value)}
                  disabled={!stereoCompressorSettings.enabled}
                >
                  <SelectTrigger className="w-36" id="stereo-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stereo">Stereo Linked</SelectItem>
                    <SelectItem value="dual-mono">Dual Mono</SelectItem>
                    <SelectItem value="mid-side">Mid/Side</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stereo-threshold">Threshold ({stereoCompressorSettings.threshold} dB)</Label>
                  <Slider
                    id="stereo-threshold"
                    min={-60}
                    max={0}
                    step={0.5}
                    value={[stereoCompressorSettings.threshold]}
                    onValueChange={(value) => handleStereoCompressorSliderChange('threshold', value)}
                    disabled={!stereoCompressorSettings.enabled}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="stereo-ratio">Ratio ({stereoCompressorSettings.ratio}:1)</Label>
                  <Slider
                    id="stereo-ratio"
                    min={1}
                    max={20}
                    step={0.1}
                    value={[stereoCompressorSettings.ratio]}
                    onValueChange={(value) => handleStereoCompressorSliderChange('ratio', value)}
                    disabled={!stereoCompressorSettings.enabled}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stereo-attack">Attack ({stereoCompressorSettings.attack} ms)</Label>
                  <Slider
                    id="stereo-attack"
                    min={0.1}
                    max={100}
                    step={0.1}
                    value={[stereoCompressorSettings.attack]}
                    onValueChange={(value) => handleStereoCompressorSliderChange('attack', value)}
                    disabled={!stereoCompressorSettings.enabled}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="stereo-release">Release ({stereoCompressorSettings.release} ms)</Label>
                  <Slider
                    id="stereo-release"
                    min={5}
                    max={1000}
                    step={5}
                    value={[stereoCompressorSettings.release]}
                    onValueChange={(value) => handleStereoCompressorSliderChange('release', value)}
                    disabled={!stereoCompressorSettings.enabled}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stereo-knee">Knee ({stereoCompressorSettings.knee} dB)</Label>
                  <Slider
                    id="stereo-knee"
                    min={0}
                    max={24}
                    step={0.5}
                    value={[stereoCompressorSettings.knee]}
                    onValueChange={(value) => handleStereoCompressorSliderChange('knee', value)}
                    disabled={!stereoCompressorSettings.enabled}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="stereo-gain">Makeup Gain ({stereoCompressorSettings.gain} dB)</Label>
                  <Slider
                    id="stereo-gain"
                    min={0}
                    max={24}
                    step={0.5}
                    value={[stereoCompressorSettings.gain]}
                    onValueChange={(value) => handleStereoCompressorSliderChange('gain', value)}
                    disabled={!stereoCompressorSettings.enabled}
                  />
                </div>
              </div>
              
              {/* Mid/Side control (only visible in mid-side mode) */}
              {stereoCompressorSettings.mode === 'mid-side' && (
                <div className="space-y-2">
                  <Label htmlFor="stereo-midside">Mid/Side Ratio ({stereoCompressorSettings.midSideRatio.toFixed(1)})</Label>
                  <Slider
                    id="stereo-midside"
                    min={0}
                    max={2}
                    step={0.1}
                    value={[stereoCompressorSettings.midSideRatio]}
                    onValueChange={(value) => handleStereoCompressorSliderChange('midSideRatio', value)}
                    disabled={!stereoCompressorSettings.enabled}
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Mid Only</span>
                    <span>Balanced</span>
                    <span>Side Only</span>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-xs text-gray-400">
                  {stereoCompressorSettings.mode === 'stereo' ? 'Linked stereo - both channels compressed equally' : 
                   stereoCompressorSettings.mode === 'dual-mono' ? 'Independent L/R channel compression' : 
                   'Mid/Side processing - separate center and side compression'}
                </span>
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

export default CompressorSection;
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Volume2,
  BarChart4,
  Save,
  RefreshCw,
  Waves as Waveform,
  PlayCircle,
  StopCircle,
  Upload,
  Download,
  Gauge,
  Music,
  Radio,
  Check,
  X,
  Copy,
  Volume,
  Music2,
  ChevronsUp,
  ChevronsDown,
  Settings,
  Scissors,
  ArrowRightLeft,
  ZoomIn,
  Loader2
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

interface LoudnessSectionProps {
  onSave?: () => void;
}

// Loudness Normalization settings
interface LoudnessSettings {
  enabled: boolean;
  standard: 'ebu' | 'itu' | 'custom';
  targetLUFS: number;
  truePeakLimit: number;
  lra: number;  // Loudness Range
  measurementMode: 'momentary' | 'short-term' | 'integrated';
  autoLevel: boolean;
}

// Psychoacoustic Enhancer settings
interface EnhancerSettings {
  enabled: boolean;
  bassIntensity: number;
  bassFrequency: number;
  trebleIntensity: number;
  trebleFrequency: number;
  harmonic: number;
  brilliance: number;
  exciterMix: number;
}

// Bass Clarity Enhancement settings
interface BassSettings {
  enabled: boolean;
  tightness: number;
  punch: number;
  depth: number;
  subBoost: number;
  subFrequency: number;
  harmonicContent: number;
  transientShaper: number;
}

// De-esser settings
interface DeEsserSettings {
  enabled: boolean;
  threshold: number;
  frequency: number;
  range: number;
  attackTime: number;
  releaseTime: number;
  listenMode: boolean;
  autoThreshold: boolean;
  splitBand: boolean;
}

// Final Limiter/Clipper settings
interface LimiterSettings {
  enabled: boolean;
  threshold: number;
  ceiling: number;
  release: number;
  clipperAmount: number;
  clipperShape: 'hard' | 'soft' | 'adaptive';
  oversample: '1x' | '2x' | '4x' | '8x';
  dither: boolean;
  autoGain: boolean;
}

// Loudness measurement data structure
interface LoudnessData {
  shortTerm: number;
  momentary: number;
  integrated: number;
  truePeak: number;
  loudnessRange: number;
  history: number[];
}

// For preset selections
const LOUDNESS_PRESETS = [
  { id: 'broadcast', name: 'Broadcast Standard', description: 'EBU R128 compliance' },
  { id: 'streaming', name: 'Streaming', description: 'Optimized for music streaming' },
  { id: 'podcast', name: 'Podcast', description: 'Clear speech with dynamics' },
  { id: 'dance', name: 'Dance Music', description: 'Maximum loudness for clubs' },
  { id: 'cinematic', name: 'Cinematic', description: 'Wide dynamic range' },
  { id: 'vinyl', name: 'Vinyl Ready', description: 'Analog-friendly mastering' },
];

// Default loudness measurements for initial display
const DEFAULT_LOUDNESS_DATA: LoudnessData = {
  shortTerm: -18.2,
  momentary: -16.7,
  integrated: -16.1,
  truePeak: -0.8,
  loudnessRange: 8.4,
  history: Array(100).fill(0).map(() => -23 + Math.random() * 10)
};

const LoudnessSection: React.FC<LoudnessSectionProps> = ({ onSave }) => {
  // State for active tab
  const [activeTab, setActiveTab] = useState<string>('loudness');
  
  // Main enable switch
  const [masteringEnabled, setMasteringEnabled] = useState<boolean>(true);
  
  // Loudness measurement display state
  const [loudnessData, setLoudnessData] = useState<LoudnessData>(DEFAULT_LOUDNESS_DATA);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  
  // Individual tools settings
  const [loudnessSettings, setLoudnessSettings] = useState<LoudnessSettings>({
    enabled: true,
    standard: 'ebu',
    targetLUFS: -16.0,
    truePeakLimit: -1.0,
    lra: 8,
    measurementMode: 'integrated',
    autoLevel: true
  });
  
  const [enhancerSettings, setEnhancerSettings] = useState<EnhancerSettings>({
    enabled: true,
    bassIntensity: 25,
    bassFrequency: 120,
    trebleIntensity: 20,
    trebleFrequency: 8000,
    harmonic: 15,
    brilliance: 30,
    exciterMix: 20
  });
  
  const [bassSettings, setBassSettings] = useState<BassSettings>({
    enabled: true,
    tightness: 40,
    punch: 30,
    depth: 35,
    subBoost: 20,
    subFrequency: 60,
    harmonicContent: 15,
    transientShaper: 30
  });
  
  const [deEsserSettings, setDeEsserSettings] = useState<DeEsserSettings>({
    enabled: true,
    threshold: -18,
    frequency: 6500,
    range: 6,
    attackTime: 1.5,
    releaseTime: 40,
    listenMode: false,
    autoThreshold: true,
    splitBand: true
  });
  
  const [limiterSettings, setLimiterSettings] = useState<LimiterSettings>({
    enabled: true,
    threshold: -1.5,
    ceiling: -0.1,
    release: 25,
    clipperAmount: 20,
    clipperShape: 'adaptive',
    oversample: '4x',
    dither: true,
    autoGain: true
  });
  
  // Canvas references for visualizations
  const loudnessCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const spectrumCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const waveMeterCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Animation frame reference
  const requestAnimationRef = useRef<number | null>(null);
  
  // Handle loudness normalization settings changes
  const handleLoudnessChange = (property: keyof LoudnessSettings, value: any) => {
    setLoudnessSettings(prev => ({
      ...prev,
      [property]: value
    }));
    
    // Auto-adjust settings based on standard
    if (property === 'standard') {
      switch (value) {
        case 'ebu':
          setLoudnessSettings(prev => ({
            ...prev,
            standard: 'ebu',
            targetLUFS: -23.0,
            truePeakLimit: -1.0,
            lra: 15
          }));
          break;
        case 'itu':
          setLoudnessSettings(prev => ({
            ...prev,
            standard: 'itu',
            targetLUFS: -24.0,
            truePeakLimit: -2.0,
            lra: 20
          }));
          break;
        case 'custom':
          // Keep current values
          break;
      }
    }
  };
  
  // Handle loudness slider changes
  const handleLoudnessSliderChange = (property: keyof LoudnessSettings, values: number[]) => {
    if (values.length > 0) {
      handleLoudnessChange(property, values[0]);
      
      // If we're adjusting target LUFS manually, switch to custom standard
      if (property === 'targetLUFS' || property === 'truePeakLimit' || property === 'lra') {
        handleLoudnessChange('standard', 'custom');
      }
    }
  };
  
  // Handle enhancer settings changes
  const handleEnhancerChange = (property: keyof EnhancerSettings, value: number | boolean) => {
    setEnhancerSettings(prev => ({
      ...prev,
      [property]: value
    }));
  };
  
  // Handle enhancer slider changes
  const handleEnhancerSliderChange = (property: keyof EnhancerSettings, values: number[]) => {
    if (values.length > 0) {
      handleEnhancerChange(property, values[0]);
    }
  };
  
  // Handle bass settings changes
  const handleBassChange = (property: keyof BassSettings, value: number | boolean) => {
    setBassSettings(prev => ({
      ...prev,
      [property]: value
    }));
  };
  
  // Handle bass slider changes
  const handleBassSliderChange = (property: keyof BassSettings, values: number[]) => {
    if (values.length > 0) {
      handleBassChange(property, values[0]);
    }
  };
  
  // Handle de-esser settings changes
  const handleDeEsserChange = (property: keyof DeEsserSettings, value: number | boolean) => {
    setDeEsserSettings(prev => ({
      ...prev,
      [property]: value
    }));
  };
  
  // Handle de-esser slider changes
  const handleDeEsserSliderChange = (property: keyof DeEsserSettings, values: number[]) => {
    if (values.length > 0) {
      handleDeEsserChange(property, values[0]);
    }
  };
  
  // Handle limiter settings changes
  const handleLimiterChange = (property: keyof LimiterSettings, value: any) => {
    setLimiterSettings(prev => ({
      ...prev,
      [property]: value
    }));
  };
  
  // Handle limiter slider changes
  const handleLimiterSliderChange = (property: keyof LimiterSettings, values: number[]) => {
    if (values.length > 0) {
      handleLimiterChange(property, values[0]);
    }
  };
  
  // Toggle playback
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
    
    if (!isPlaying) {
      // Start analysis
      setIsAnalyzing(true);
      // In a real app, this would trigger actual audio analysis
    } else {
      // Stop analysis
      setIsAnalyzing(false);
    }
  };
  
  // Start loudness analysis
  const analyzeLoudness = () => {
    setIsAnalyzing(true);
    // Simulate analysis - in a real app this would process the actual audio
    setTimeout(() => {
      setIsAnalyzing(false);
      // Update with "measured" data
      setLoudnessData({
        shortTerm: -18.2 + (Math.random() * 4 - 2),
        momentary: -16.7 + (Math.random() * 4 - 2),
        integrated: -16.1 + (Math.random() * 2 - 1),
        truePeak: -0.8 + (Math.random() * 0.5 - 0.25),
        loudnessRange: 8.4 + (Math.random() * 2 - 1),
        history: Array(100).fill(0).map(() => -20 + Math.random() * 8)
      });
    }, 2000);
  };
  
  // Reset all settings to default
  const resetSettings = () => {
    if (window.confirm('Reset all loudness and mastering settings to default?')) {
      setLoudnessSettings({
        enabled: true,
        standard: 'ebu',
        targetLUFS: -16.0,
        truePeakLimit: -1.0,
        lra: 8,
        measurementMode: 'integrated',
        autoLevel: true
      });
      
      setEnhancerSettings({
        enabled: true,
        bassIntensity: 25,
        bassFrequency: 120,
        trebleIntensity: 20,
        trebleFrequency: 8000,
        harmonic: 15,
        brilliance: 30,
        exciterMix: 20
      });
      
      setBassSettings({
        enabled: true,
        tightness: 40,
        punch: 30,
        depth: 35,
        subBoost: 20,
        subFrequency: 60,
        harmonicContent: 15,
        transientShaper: 30
      });
      
      setDeEsserSettings({
        enabled: true,
        threshold: -18,
        frequency: 6500,
        range: 6,
        attackTime: 1.5,
        releaseTime: 40,
        listenMode: false,
        autoThreshold: true,
        splitBand: true
      });
      
      setLimiterSettings({
        enabled: true,
        threshold: -1.5,
        ceiling: -0.1,
        release: 25,
        clipperAmount: 20,
        clipperShape: 'adaptive',
        oversample: '4x',
        dither: true,
        autoGain: true
      });
    }
  };
  
  // Load preset for loudness
  const loadLoudnessPreset = (presetId: string) => {
    switch (presetId) {
      case 'broadcast':
        setLoudnessSettings({
          enabled: true,
          standard: 'ebu',
          targetLUFS: -23.0,
          truePeakLimit: -1.0,
          lra: 15,
          measurementMode: 'integrated',
          autoLevel: true
        });
        setLimiterSettings(prev => ({
          ...prev,
          threshold: -3.0,
          ceiling: -0.2,
          clipperAmount: 10
        }));
        break;
      case 'streaming':
        setLoudnessSettings({
          enabled: true,
          standard: 'custom',
          targetLUFS: -14.0,
          truePeakLimit: -1.0,
          lra: 8,
          measurementMode: 'integrated',
          autoLevel: true
        });
        setLimiterSettings(prev => ({
          ...prev,
          threshold: -1.5,
          ceiling: -0.1,
          clipperAmount: 20
        }));
        break;
      case 'podcast':
        setLoudnessSettings({
          enabled: true,
          standard: 'custom',
          targetLUFS: -16.0,
          truePeakLimit: -1.5,
          lra: 10,
          measurementMode: 'integrated',
          autoLevel: true
        });
        setLimiterSettings(prev => ({
          ...prev,
          threshold: -2.0,
          ceiling: -0.2,
          clipperAmount: 15
        }));
        setDeEsserSettings(prev => ({
          ...prev,
          enabled: true,
          threshold: -18,
          range: 8
        }));
        break;
      case 'dance':
        setLoudnessSettings({
          enabled: true,
          standard: 'custom',
          targetLUFS: -9.0,
          truePeakLimit: -0.3,
          lra: 4,
          measurementMode: 'short-term',
          autoLevel: true
        });
        setLimiterSettings(prev => ({
          ...prev,
          threshold: -0.5,
          ceiling: -0.1,
          clipperAmount: 40,
          clipperShape: 'hard'
        }));
        setEnhancerSettings(prev => ({
          ...prev,
          bassIntensity: 40,
          bassFrequency: 100
        }));
        setBassSettings(prev => ({
          ...prev,
          punch: 60,
          depth: 50
        }));
        break;
      case 'cinematic':
        setLoudnessSettings({
          enabled: true,
          standard: 'custom',
          targetLUFS: -18.0,
          truePeakLimit: -3.0,
          lra: 20,
          measurementMode: 'integrated',
          autoLevel: true
        });
        setLimiterSettings(prev => ({
          ...prev,
          threshold: -3.0,
          ceiling: -0.5,
          clipperAmount: 0
        }));
        setEnhancerSettings(prev => ({
          ...prev,
          exciterMix: 10,
          harmonic: 5
        }));
        break;
      case 'vinyl':
        setLoudnessSettings({
          enabled: true,
          standard: 'custom',
          targetLUFS: -14.0,
          truePeakLimit: -2.0,
          lra: 12,
          measurementMode: 'integrated',
          autoLevel: true
        });
        setLimiterSettings(prev => ({
          ...prev,
          threshold: -2.5,
          ceiling: -0.5,
          clipperAmount: 5,
          clipperShape: 'soft'
        }));
        setBassSettings(prev => ({
          ...prev,
          subBoost: 10, // Limited sub for vinyl
          tightness: 60 // Tighter bass for vinyl
        }));
        break;
    }
  };
  
  // Draw loudness history graph
  const drawLoudnessHistory = () => {
    const canvas = loudnessCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size to match parent container
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid lines
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    
    // Draw horizontal lines for LUFS levels
    const lufsLevels = [-36, -30, -24, -18, -12, -6, 0];
    lufsLevels.forEach(level => {
      const normalizedLevel = (level + 36) / 36; // Normalize to 0-1 range where 0 is -36 LUFS
      const y = height - (normalizedLevel * height);
      
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
      
      // Label
      ctx.fillStyle = '#666';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${level} LUFS`, 5, y - 3);
    });
    
    // Draw target LUFS line
    const targetY = height - ((loudnessSettings.targetLUFS + 36) / 36) * height;
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.6)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 2]);
    ctx.beginPath();
    ctx.moveTo(0, targetY);
    ctx.lineTo(width, targetY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw label for target LUFS
    ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Target: ${loudnessSettings.targetLUFS} LUFS`, width - 5, targetY - 3);
    
    // Draw loudness history
    if (loudnessData.history.length > 0) {
      const historyLength = loudnessData.history.length;
      const stepSize = width / historyLength;
      
      // Draw short-term loudness history (blue line)
      ctx.strokeStyle = 'rgba(50, 150, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      loudnessData.history.forEach((lufs, index) => {
        const normalizedLevel = (lufs + 36) / 36; // Normalize to 0-1 range
        const x = index * stepSize;
        const y = height - (normalizedLevel * height);
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
      
      // Fill area under the curve
      ctx.fillStyle = 'rgba(50, 150, 255, 0.1)';
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.fill();
      
      // Draw integrated loudness as horizontal line
      const integratedY = height - ((loudnessData.integrated + 36) / 36) * height;
      ctx.strokeStyle = 'rgba(255, 255, 100, 0.8)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, integratedY);
      ctx.lineTo(width, integratedY);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Label for integrated loudness
      ctx.fillStyle = 'rgba(255, 255, 100, 0.8)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`Integrated: ${loudnessData.integrated.toFixed(1)} LUFS`, 5, integratedY - 15);
      
      // Draw momentary loudness as a dot at the end
      const momentaryY = height - ((loudnessData.momentary + 36) / 36) * height;
      ctx.fillStyle = 'rgba(0, 255, 150, 0.8)';
      ctx.beginPath();
      ctx.arc(width - 10, momentaryY, 5, 0, Math.PI * 2);
      ctx.fill();
      
      // Label for momentary loudness
      ctx.fillStyle = 'rgba(0, 255, 150, 0.8)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`Momentary: ${loudnessData.momentary.toFixed(1)} LUFS`, width - 20, momentaryY - 10);
    }
  };
  
  // Draw spectrum analyzer
  const drawSpectrum = () => {
    const canvas = spectrumCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size to match parent container
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
    
    // Draw frequency scale
    ctx.fillStyle = '#333';
    ctx.fillRect(0, height - 20, width, 20);
    
    // Draw frequency labels
    const freqLabels = ['20', '50', '100', '200', '500', '1k', '2k', '5k', '10k', '20k'];
    const freqPositions = [0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.85, 0.95];
    
    ctx.fillStyle = '#999';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    
    freqLabels.forEach((label, index) => {
      const x = width * freqPositions[index];
      ctx.fillText(label, x, height - 6);
    });
    
    // Draw level scale on left
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, 30, height - 20);
    
    // Draw level labels
    const dbLabels = ['0', '-6', '-12', '-18', '-24', '-30', '-36', '-42'];
    const dbPositions = [0.05, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75];
    
    ctx.fillStyle = '#999';
    ctx.textAlign = 'right';
    
    dbLabels.forEach((label, index) => {
      const y = height * dbPositions[index];
      ctx.fillText(label + ' dB', 25, y);
    });
    
    // Simulate spectrum data
    const bands = 64;
    const barWidth = (width - 30) / bands;
    const barSpacing = 1;
    
    // Generate spectrum data with a shape influenced by enhancer and bass settings
    const generateSpectrumData = () => {
      const data = [];
      
      // Base spectrum shape (pink noise falloff)
      for (let i = 0; i < bands; i++) {
        // Logarithmic frequency distribution
        const freq = 20 * Math.pow(1000, i / bands);
        
        // Pink noise falls off at 3dB/octave
        let level = -3 - 10 * Math.log10((i + 1) / bands);
        
        // Randomize a bit
        level += Math.random() * 3 - 1.5;
        
        // Apply bass boost based on settings
        if (freq < bassSettings.subFrequency * 2 && bassSettings.enabled) {
          level += (bassSettings.subBoost / 12) * (1 - freq / (bassSettings.subFrequency * 2));
        }
        
        // Apply bass tightness (controlled shaping in low end)
        if (freq < 250 && bassSettings.enabled) {
          const tightnessEffect = (bassSettings.tightness / 100) * 6;
          const punchEffect = (bassSettings.punch / 100) * 8;
          
          // Add punch around 80-120 Hz
          if (freq > 60 && freq < 150) {
            level += punchEffect * (1 - Math.abs(freq - 100) / 50);
          }
          
          // Tightness reduces muddiness around 200-300 Hz
          if (freq > 180 && freq < 350) {
            level -= tightnessEffect * (1 - Math.abs(freq - 250) / 70);
          }
        }
        
        // Apply enhancer effect (higher frequencies)
        if (freq > 3000 && enhancerSettings.enabled) {
          // Treble boost
          const trebleBoost = (enhancerSettings.trebleIntensity / 100) * 12;
          level += trebleBoost * (freq / 20000);
          
          // Brilliance (10-15kHz)
          if (freq > 8000) {
            const brillianceEffect = (enhancerSettings.brilliance / 100) * 9;
            level += brillianceEffect * (freq / 20000);
          }
        }
        
        // Apply bass harmonic generation
        if (freq > 80 && freq < 500 && enhancerSettings.enabled) {
          const harmonicEffect = (enhancerSettings.harmonic / 100) * 6;
          
          // Add harmonics at key frequencies
          if ((freq > 120 && freq < 140) || (freq > 240 && freq < 260)) {
            level += harmonicEffect;
          }
        }
        
        // Limit to reasonable range
        level = Math.max(-42, Math.min(0, level));
        
        data.push(level);
      }
      
      return data;
    };
    
    const spectrumData = generateSpectrumData();
    
    // Draw spectrum bars
    for (let i = 0; i < bands; i++) {
      const level = spectrumData[i];
      const normalizedLevel = (level + 42) / 42; // Normalize -42dB to 0dB to 0-1 range
      
      // Log-scaled x position
      const x = 30 + i * ((width - 30) / bands);
      
      // Bar height
      const barHeight = normalizedLevel * (height - 20);
      
      // Color gradient based on frequency
      const hue = 180 + (i / bands) * 180; // 180-360 (cyan to magenta)
      let barColor = `hsl(${hue}, 70%, 60%)`;
      
      // Special coloring for frequencies affected by enhancers
      if ((i / bands) < 0.2 && bassSettings.enabled) {
        // Bass region
        barColor = `rgba(255, ${100 + Math.floor(i / bands * 400)}, 50, 0.8)`;
      } else if ((i / bands) > 0.7 && enhancerSettings.enabled) {
        // Treble region
        barColor = `rgba(100, 200, ${200 + Math.floor((i / bands - 0.7) * 200)}, 0.8)`;
      }
      
      ctx.fillStyle = barColor;
      ctx.fillRect(
        x, 
        height - 20 - barHeight, 
        barWidth - barSpacing, 
        barHeight
      );
    }
    
    // Draw frequency regions affected by processing
    
    // Bass region
    if (bassSettings.enabled) {
      const bassMaxFreq = Math.log10(250) / Math.log10(20000); // Normalized position for 250 Hz
      const bassX = 30 + bassMaxFreq * (width - 30);
      
      ctx.fillStyle = 'rgba(255, 150, 50, 0.1)';
      ctx.fillRect(30, 0, bassX - 30, height - 20);
      
      // Sub region
      const subMaxFreq = Math.log10(bassSettings.subFrequency) / Math.log10(20000);
      const subX = 30 + subMaxFreq * (width - 30);
      
      ctx.fillStyle = 'rgba(255, 100, 50, 0.15)';
      ctx.fillRect(30, 0, subX - 30, height - 20);
    }
    
    // De-esser region
    if (deEsserSettings.enabled) {
      const minFreq = Math.log10(deEsserSettings.frequency - 1000) / Math.log10(20000);
      const maxFreq = Math.log10(deEsserSettings.frequency + 1000) / Math.log10(20000);
      
      const deEsserMinX = 30 + minFreq * (width - 30);
      const deEsserMaxX = 30 + maxFreq * (width - 30);
      
      ctx.fillStyle = 'rgba(255, 50, 200, 0.1)';
      ctx.fillRect(deEsserMinX, 0, deEsserMaxX - deEsserMinX, height - 20);
      
      // Draw de-esser center line
      const centerFreq = Math.log10(deEsserSettings.frequency) / Math.log10(20000);
      const centerX = 30 + centerFreq * (width - 30);
      
      ctx.strokeStyle = 'rgba(255, 50, 200, 0.5)';
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, height - 20);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // Draw threshold line for limiter
    const limiterY = (Math.abs(limiterSettings.threshold) / 42) * (height - 20);
    ctx.strokeStyle = 'rgba(255, 50, 50, 0.6)';
    ctx.setLineDash([4, 2]);
    ctx.beginPath();
    ctx.moveTo(30, limiterY);
    ctx.lineTo(width, limiterY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw label for limiter threshold
    ctx.fillStyle = 'rgba(255, 50, 50, 0.8)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Limiter: ${limiterSettings.threshold} dB`, 35, limiterY - 5);
  };
  
  // Draw wave/level meter
  const drawLevelMeter = () => {
    const canvas = waveMeterCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size to match parent container
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
    
    // Draw level meters (L and R channels)
    const channelHeight = height / 2 - 5;
    const meterWidth = width - 50;
    const dbRange = 60; // -60dB to 0dB
    
    // Draw scale
    ctx.fillStyle = '#333';
    ctx.fillRect(meterWidth + 5, 0, 45, height);
    
    // Draw scale markers
    const dbMarkers = [0, -3, -6, -12, -18, -24, -36, -48];
    ctx.fillStyle = '#999';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    
    dbMarkers.forEach(db => {
      const x = meterWidth + 10 + (db === 0 ? 5 : 0); // Offset 0dB for emphasis
      const yL = (Math.abs(db) / dbRange) * channelHeight;
      const yR = channelHeight + 10 + (Math.abs(db) / dbRange) * channelHeight;
      
      // L channel markers
      ctx.fillText(`${db}`, x, yL + 3);
      
      // R channel markers
      ctx.fillText(`${db}`, x, yR + 3);
    });
    
    // Generate levels based on settings and LUFS target
    const generateLevels = () => {
      // Base level influenced by LUFS measurement
      const baseLevelDb = loudnessData.momentary;
      
      // Randomize slightly to simulate movement
      const levelL = Math.min(0, baseLevelDb + Math.random() * 6 - 3);
      const levelR = Math.min(0, baseLevelDb + Math.random() * 6 - 3);
      
      // Peaks (occasional transients)
      const hasPeakL = Math.random() > 0.8;
      const hasPeakR = Math.random() > 0.8;
      
      // Peak levels
      const peakL = hasPeakL ? Math.min(0, levelL + Math.random() * 10) : levelL;
      const peakR = hasPeakR ? Math.min(0, levelR + Math.random() * 10) : levelR;
      
      // If limiter is enabled, ensure peaks don't exceed threshold
      const limitedPeakL = limiterSettings.enabled 
        ? Math.min(peakL, limiterSettings.threshold) 
        : peakL;
        
      const limitedPeakR = limiterSettings.enabled 
        ? Math.min(peakR, limiterSettings.threshold) 
        : peakR;
      
      return {
        levelL,
        levelR,
        peakL: limitedPeakL,
        peakR: limitedPeakR
      };
    };
    
    const levels = generateLevels();
    
    // Draw L channel meter
    // Background meter gradient
    const gradientL = ctx.createLinearGradient(0, 0, meterWidth, 0);
    gradientL.addColorStop(0, '#073');    // -60dB (green)
    gradientL.addColorStop(0.6, '#3a3');  // -24dB (green)
    gradientL.addColorStop(0.75, '#aa3');  // -15dB (yellow)
    gradientL.addColorStop(0.85, '#a73');  // -9dB (orange)
    gradientL.addColorStop(0.95, '#a33');  // -3dB (red)
    gradientL.addColorStop(1, '#f33');    // 0dB (bright red)
    
    // Draw meter background
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, meterWidth, channelHeight);
    
    // Calculate level width
    const levelWidthL = (1 - Math.abs(levels.levelL) / dbRange) * meterWidth;
    
    // Draw the meter level
    ctx.fillStyle = gradientL;
    ctx.fillRect(0, 0, levelWidthL, channelHeight);
    
    // Draw peak marker
    const peakWidthL = (1 - Math.abs(levels.peakL) / dbRange) * meterWidth;
    ctx.fillStyle = '#fff';
    ctx.fillRect(peakWidthL - 2, 0, 2, channelHeight);
    
    // Draw R channel meter
    // Background meter gradient (same as L)
    const gradientR = ctx.createLinearGradient(0, 0, meterWidth, 0);
    gradientR.addColorStop(0, '#073');
    gradientR.addColorStop(0.6, '#3a3');
    gradientR.addColorStop(0.75, '#aa3');
    gradientR.addColorStop(0.85, '#a73');
    gradientR.addColorStop(0.95, '#a33');
    gradientR.addColorStop(1, '#f33');
    
    // Draw meter background
    ctx.fillStyle = '#222';
    ctx.fillRect(0, channelHeight + 10, meterWidth, channelHeight);
    
    // Calculate level width
    const levelWidthR = (1 - Math.abs(levels.levelR) / dbRange) * meterWidth;
    
    // Draw the meter level
    ctx.fillStyle = gradientR;
    ctx.fillRect(0, channelHeight + 10, levelWidthR, channelHeight);
    
    // Draw peak marker
    const peakWidthR = (1 - Math.abs(levels.peakR) / dbRange) * meterWidth;
    ctx.fillStyle = '#fff';
    ctx.fillRect(peakWidthR - 2, channelHeight + 10, 2, channelHeight);
    
    // Draw channel labels
    ctx.fillStyle = '#aaa';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('L', 5, channelHeight - 8);
    ctx.fillText('R', 5, height - 8);
    
    // Draw LUFS level
    ctx.fillStyle = '#66ccff';
    ctx.textAlign = 'right';
    ctx.fillText(`${loudnessData.momentary.toFixed(1)} LUFS`, meterWidth - 5, channelHeight - 8);
    ctx.fillText(`${loudnessData.integrated.toFixed(1)} LUFS`, meterWidth - 5, height - 8);
    
    // Draw limiter threshold line
    if (limiterSettings.enabled) {
      const thresholdX = (1 - Math.abs(limiterSettings.threshold) / dbRange) * meterWidth;
      
      ctx.strokeStyle = 'rgba(255, 100, 100, 0.7)';
      ctx.setLineDash([4, 2]);
      ctx.beginPath();
      ctx.moveTo(thresholdX, 0);
      ctx.lineTo(thresholdX, channelHeight);
      ctx.moveTo(thresholdX, channelHeight + 10);
      ctx.lineTo(thresholdX, height);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // Draw target LUFS marker
    const targetX = (1 - Math.abs(loudnessSettings.targetLUFS) / dbRange) * meterWidth;
    
    ctx.strokeStyle = 'rgba(100, 255, 255, 0.7)';
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(targetX, 0);
    ctx.lineTo(targetX, channelHeight);
    ctx.moveTo(targetX, channelHeight + 10);
    ctx.lineTo(targetX, height);
    ctx.stroke();
    ctx.setLineDash([]);
  };
  
  // Update all visualizations in animation frame
  const updateVisualizations = () => {
    drawLoudnessHistory();
    drawSpectrum();
    drawLevelMeter();
    
    // Simulate changing loudness data if playback is active
    if (isPlaying) {
      // Update history by shifting and adding new point
      const newHistory = [...loudnessData.history.slice(1)];
      const newLUFS = loudnessData.momentary + (Math.random() * 2 - 1);
      newHistory.push(newLUFS);
      
      // Update momentary and short-term (with smaller variance)
      const newMomentary = loudnessData.momentary + (Math.random() * 1 - 0.5);
      const newShortTerm = loudnessData.shortTerm + (Math.random() * 0.4 - 0.2);
      
      // Slowly converge integrated towards target if auto-level is on
      let newIntegrated = loudnessData.integrated;
      if (loudnessSettings.autoLevel) {
        const targetDiff = loudnessSettings.targetLUFS - loudnessData.integrated;
        newIntegrated += targetDiff * 0.01;
      } else {
        // Small random walk for integrated
        newIntegrated += (Math.random() * 0.2 - 0.1);
      }
      
      // Update true peak (with smaller variance)
      const newTruePeak = loudnessData.truePeak + (Math.random() * 0.2 - 0.1);
      
      // Ensure true peak is limited if limiter is enabled
      const limitedTruePeak = limiterSettings.enabled 
        ? Math.min(newTruePeak, limiterSettings.ceiling)
        : newTruePeak;
      
      // Update the loudness data
      setLoudnessData({
        shortTerm: newShortTerm,
        momentary: newMomentary,
        integrated: newIntegrated,
        truePeak: limitedTruePeak,
        loudnessRange: loudnessData.loudnessRange,
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
    masteringEnabled,
    loudnessSettings,
    enhancerSettings,
    bassSettings,
    deEsserSettings,
    limiterSettings,
    loudnessData,
    isPlaying,
    activeTab
  ]);
  
  // Resize canvas to match display size
  useEffect(() => {
    const canvases = [
      loudnessCanvasRef.current,
      spectrumCanvasRef.current,
      waveMeterCanvasRef.current
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
        <CardTitle className="text-lg text-red-500 flex items-center justify-between">
          <div className="flex items-center">
            <Volume2 className="h-5 w-5 mr-2" />
            Loudness & Mastering Tools
          </div>
          <Switch 
            checked={masteringEnabled}
            onCheckedChange={setMasteringEnabled}
          />
        </CardTitle>
      </CardHeader>
      <CardContent className={`${!masteringEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Loudness visualization area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-950 border border-gray-800 rounded-md p-3">
            <div className="flex justify-between mb-2">
              <div className="text-sm font-medium text-gray-400">Loudness History</div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-6 w-6"
                  onClick={togglePlayback}
                >
                  {isPlaying ? (
                    <StopCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <PlayCircle className="h-4 w-4 text-green-500" />
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-6 w-6"
                  onClick={analyzeLoudness}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  ) : (
                    <Gauge className="h-4 w-4 text-blue-500" />
                  )}
                </Button>
              </div>
            </div>
            <canvas 
              ref={loudnessCanvasRef} 
              className="w-full h-40" 
              style={{ display: 'block' }}
            />
            {/* Key measurement display */}
            <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
              <div className="bg-gray-900 p-2 rounded border border-gray-800">
                <div className="text-gray-400">Integrated</div>
                <div className={`text-lg font-medium ${
                  loudnessData.integrated > loudnessSettings.targetLUFS + 1 ? 'text-red-400' :
                  loudnessData.integrated < loudnessSettings.targetLUFS - 1 ? 'text-blue-400' :
                  'text-green-400'
                }`}>
                  {loudnessData.integrated.toFixed(1)} LUFS
                </div>
              </div>
              <div className="bg-gray-900 p-2 rounded border border-gray-800">
                <div className="text-gray-400">True Peak</div>
                <div className={`text-lg font-medium ${
                  loudnessData.truePeak > limiterSettings.ceiling ? 'text-red-400' : 'text-green-400'
                }`}>
                  {loudnessData.truePeak.toFixed(1)} dB
                </div>
              </div>
              <div className="bg-gray-900 p-2 rounded border border-gray-800">
                <div className="text-gray-400">Loudness Range</div>
                <div className="text-lg font-medium text-yellow-400">
                  {loudnessData.loudnessRange.toFixed(1)} LU
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-950 border border-gray-800 rounded-md p-3">
            <div className="text-sm font-medium text-gray-400 mb-2">Spectrum & Level</div>
            <div className="h-40">
              <canvas 
                ref={spectrumCanvasRef} 
                className="w-full h-full" 
                style={{ display: 'block' }}
              />
            </div>
            <div className="mt-2">
              <canvas 
                ref={waveMeterCanvasRef} 
                className="w-full h-20" 
                style={{ display: 'block' }}
              />
            </div>
          </div>
        </div>
        
        {/* Tabs for different mastering tools */}
        <Tabs defaultValue="loudness" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList className="grid grid-cols-5">
              <TabsTrigger value="loudness">
                <Gauge className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Loudness</span>
              </TabsTrigger>
              <TabsTrigger value="enhancer">
                <Music className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Enhancer</span>
              </TabsTrigger>
              <TabsTrigger value="bass">
                <Waveform className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Bass</span>
              </TabsTrigger>
              <TabsTrigger value="deesser">
                <Scissors className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">De-esser</span>
              </TabsTrigger>
              <TabsTrigger value="limiter">
                <ChevronsUp className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Limiter</span>
              </TabsTrigger>
            </TabsList>
            
            <Select defaultValue="preset" onValueChange={loadLoudnessPreset}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Presets" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="preset" disabled>Presets</SelectItem>
                {LOUDNESS_PRESETS.map(preset => (
                  <SelectItem key={preset.id} value={preset.id}>
                    {preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Loudness Tab */}
          <TabsContent value="loudness" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h3 className="text-sm font-medium">Loudness Normalization</h3>
                <Switch 
                  className="ml-2"
                  checked={loudnessSettings.enabled}
                  onCheckedChange={(value) => handleLoudnessChange('enabled', value)}
                />
              </div>
              <div className="flex items-center">
                <Label htmlFor="loudness-standard" className="text-xs mr-2">Standard</Label>
                <Select 
                  value={loudnessSettings.standard}
                  onValueChange={(value) => handleLoudnessChange('standard', value)}
                  disabled={!loudnessSettings.enabled}
                >
                  <SelectTrigger className="w-32" id="loudness-standard">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ebu">EBU R128</SelectItem>
                    <SelectItem value="itu">ITU BS.1770</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="target-lufs">Target Level ({loudnessSettings.targetLUFS} LUFS)</Label>
                <Slider
                  id="target-lufs"
                  min={-36}
                  max={-9}
                  step={0.5}
                  value={[loudnessSettings.targetLUFS]}
                  onValueChange={(value) => handleLoudnessSliderChange('targetLUFS', value)}
                  disabled={!loudnessSettings.enabled}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>-36 LUFS</span>
                  <span>-24 LUFS</span>
                  <span>-16 LUFS</span>
                  <span>-9 LUFS</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="true-peak-limit">True Peak Limit ({loudnessSettings.truePeakLimit} dB)</Label>
                  <Slider
                    id="true-peak-limit"
                    min={-9}
                    max={0}
                    step={0.1}
                    value={[loudnessSettings.truePeakLimit]}
                    onValueChange={(value) => handleLoudnessSliderChange('truePeakLimit', value)}
                    disabled={!loudnessSettings.enabled}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lra">Loudness Range Target ({loudnessSettings.lra} LU)</Label>
                  <Slider
                    id="lra"
                    min={2}
                    max={30}
                    step={1}
                    value={[loudnessSettings.lra]}
                    onValueChange={(value) => handleLoudnessSliderChange('lra', value)}
                    disabled={!loudnessSettings.enabled}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="measurement-mode" className="text-xs">Measurement Mode</Label>
                  <Select 
                    value={loudnessSettings.measurementMode}
                    onValueChange={(value) => handleLoudnessChange('measurementMode', value)}
                    disabled={!loudnessSettings.enabled}
                  >
                    <SelectTrigger className="w-32" id="measurement-mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="momentary">Momentary</SelectItem>
                      <SelectItem value="short-term">Short-term</SelectItem>
                      <SelectItem value="integrated">Integrated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto-level"
                    checked={loudnessSettings.autoLevel}
                    onCheckedChange={(value) => handleLoudnessChange('autoLevel', value)}
                    disabled={!loudnessSettings.enabled}
                  />
                  <Label htmlFor="auto-level" className="text-sm">Auto Level</Label>
                </div>
              </div>
              
              <div className="text-xs text-gray-400 p-3 bg-gray-950 border border-gray-800 rounded-md">
                <p className="mb-1">
                  <strong>Loudness Normalization</strong> ensures your audio conforms to broadcast or streaming specifications.
                </p>
                <p>
                  <span className="text-blue-400">EBU R128</span> is the European broadcast standard (-23 LUFS target).
                  <span className="text-blue-400"> ITU BS.1770</span> is the international standard.
                  Modern streaming platforms typically use <span className="text-green-400">-14 LUFS</span> as a reference.
                </p>
              </div>
            </div>
          </TabsContent>
          
          {/* Psychoacoustic Enhancer Tab */}
          <TabsContent value="enhancer" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h3 className="text-sm font-medium">Psychoacoustic Enhancer</h3>
                <Switch 
                  className="ml-2"
                  checked={enhancerSettings.enabled}
                  onCheckedChange={(value) => handleEnhancerChange('enabled', value)}
                />
              </div>
              <div className="text-xs text-gray-400">
                Enhances harmonics and frequency detail
              </div>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="exciter-mix">Overall Mix ({enhancerSettings.exciterMix}%)</Label>
                <Slider
                  id="exciter-mix"
                  min={0}
                  max={100}
                  step={1}
                  value={[enhancerSettings.exciterMix]}
                  onValueChange={(value) => handleEnhancerSliderChange('exciterMix', value)}
                  disabled={!enhancerSettings.enabled}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bass-intensity">Bass Intensity ({enhancerSettings.bassIntensity}%)</Label>
                  <Slider
                    id="bass-intensity"
                    min={0}
                    max={100}
                    step={1}
                    value={[enhancerSettings.bassIntensity]}
                    onValueChange={(value) => handleEnhancerSliderChange('bassIntensity', value)}
                    disabled={!enhancerSettings.enabled}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bass-frequency">Bass Frequency ({enhancerSettings.bassFrequency} Hz)</Label>
                  <Slider
                    id="bass-frequency"
                    min={30}
                    max={250}
                    step={5}
                    value={[enhancerSettings.bassFrequency]}
                    onValueChange={(value) => handleEnhancerSliderChange('bassFrequency', value)}
                    disabled={!enhancerSettings.enabled}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="treble-intensity">Treble Intensity ({enhancerSettings.trebleIntensity}%)</Label>
                  <Slider
                    id="treble-intensity"
                    min={0}
                    max={100}
                    step={1}
                    value={[enhancerSettings.trebleIntensity]}
                    onValueChange={(value) => handleEnhancerSliderChange('trebleIntensity', value)}
                    disabled={!enhancerSettings.enabled}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="treble-frequency">Treble Frequency ({enhancerSettings.trebleFrequency} Hz)</Label>
                  <Slider
                    id="treble-frequency"
                    min={3000}
                    max={12000}
                    step={100}
                    value={[enhancerSettings.trebleFrequency]}
                    onValueChange={(value) => handleEnhancerSliderChange('trebleFrequency', value)}
                    disabled={!enhancerSettings.enabled}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="harmonic">Harmonic Content ({enhancerSettings.harmonic}%)</Label>
                  <Slider
                    id="harmonic"
                    min={0}
                    max={100}
                    step={1}
                    value={[enhancerSettings.harmonic]}
                    onValueChange={(value) => handleEnhancerSliderChange('harmonic', value)}
                    disabled={!enhancerSettings.enabled}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="brilliance">Brilliance ({enhancerSettings.brilliance}%)</Label>
                  <Slider
                    id="brilliance"
                    min={0}
                    max={100}
                    step={1}
                    value={[enhancerSettings.brilliance]}
                    onValueChange={(value) => handleEnhancerSliderChange('brilliance', value)}
                    disabled={!enhancerSettings.enabled}
                  />
                </div>
              </div>
              
              <div className="text-xs text-gray-400 p-3 bg-gray-950 border border-gray-800 rounded-md">
                <p className="mb-1">
                  <strong>Psychoacoustic Enhancement</strong> generates harmonics and enhances perceived 
                  frequency detail without adding significant level.
                </p>
                <p>
                  <span className="text-blue-400">Bass Enhancement</span> adds harmonic content to low frequencies, 
                  making them more audible on small speakers.
                  <span className="text-blue-400"> Treble Enhancement</span> adds sparkle and presence.
                </p>
              </div>
            </div>
          </TabsContent>
          
          {/* Bass Clarity Tab */}
          <TabsContent value="bass" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h3 className="text-sm font-medium">Bass Clarity Enhancer</h3>
                <Switch 
                  className="ml-2"
                  checked={bassSettings.enabled}
                  onCheckedChange={(value) => handleBassChange('enabled', value)}
                />
              </div>
              <div className="text-xs text-gray-400">
                Tightens bass without distortion
              </div>
            </div>
            
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tightness">Tightness ({bassSettings.tightness}%)</Label>
                  <Slider
                    id="tightness"
                    min={0}
                    max={100}
                    step={1}
                    value={[bassSettings.tightness]}
                    onValueChange={(value) => handleBassSliderChange('tightness', value)}
                    disabled={!bassSettings.enabled}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="punch">Punch ({bassSettings.punch}%)</Label>
                  <Slider
                    id="punch"
                    min={0}
                    max={100}
                    step={1}
                    value={[bassSettings.punch]}
                    onValueChange={(value) => handleBassSliderChange('punch', value)}
                    disabled={!bassSettings.enabled}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="depth">Depth ({bassSettings.depth}%)</Label>
                  <Slider
                    id="depth"
                    min={0}
                    max={100}
                    step={1}
                    value={[bassSettings.depth]}
                    onValueChange={(value) => handleBassSliderChange('depth', value)}
                    disabled={!bassSettings.enabled}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="transient-shaper">Transient Shaper ({bassSettings.transientShaper}%)</Label>
                  <Slider
                    id="transient-shaper"
                    min={0}
                    max={100}
                    step={1}
                    value={[bassSettings.transientShaper]}
                    onValueChange={(value) => handleBassSliderChange('transientShaper', value)}
                    disabled={!bassSettings.enabled}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subboost">Sub Boost ({bassSettings.subBoost}%)</Label>
                  <Slider
                    id="subboost"
                    min={0}
                    max={100}
                    step={1}
                    value={[bassSettings.subBoost]}
                    onValueChange={(value) => handleBassSliderChange('subBoost', value)}
                    disabled={!bassSettings.enabled}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="subfreq">Sub Frequency ({bassSettings.subFrequency} Hz)</Label>
                  <Slider
                    id="subfreq"
                    min={20}
                    max={120}
                    step={1}
                    value={[bassSettings.subFrequency]}
                    onValueChange={(value) => handleBassSliderChange('subFrequency', value)}
                    disabled={!bassSettings.enabled}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="harmonic-content">Harmonic Content ({bassSettings.harmonicContent}%)</Label>
                <Slider
                  id="harmonic-content"
                  min={0}
                  max={100}
                  step={1}
                  value={[bassSettings.harmonicContent]}
                  onValueChange={(value) => handleBassSliderChange('harmonicContent', value)}
                  disabled={!bassSettings.enabled}
                />
              </div>
              
              <div className="text-xs text-gray-400 p-3 bg-gray-950 border border-gray-800 rounded-md">
                <p className="mb-1">
                  <strong>Bass Clarity Enhancement</strong> improves definition in the low frequency range 
                  without causing muddiness or distortion.
                </p>
                <p>
                  <span className="text-blue-400">Tightness</span> reduces resonance and improves articulation in bass instruments.
                  <span className="text-blue-400"> Punch</span> enhances attack while 
                  <span className="text-blue-400"> Depth</span> adds weight and extension.
                </p>
              </div>
            </div>
          </TabsContent>
          
          {/* De-esser Tab */}
          <TabsContent value="deesser" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h3 className="text-sm font-medium">De-esser</h3>
                <Switch 
                  className="ml-2"
                  checked={deEsserSettings.enabled}
                  onCheckedChange={(value) => handleDeEsserChange('enabled', value)}
                />
              </div>
              <div className="text-xs text-gray-400">
                Reduces sibilant sounds
              </div>
            </div>
            
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deesser-threshold">Threshold ({deEsserSettings.threshold} dB)</Label>
                  <Slider
                    id="deesser-threshold"
                    min={-40}
                    max={0}
                    step={0.5}
                    value={[deEsserSettings.threshold]}
                    onValueChange={(value) => handleDeEsserSliderChange('threshold', value)}
                    disabled={!deEsserSettings.enabled || deEsserSettings.autoThreshold}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="deesser-range">Range ({deEsserSettings.range} dB)</Label>
                  <Slider
                    id="deesser-range"
                    min={1}
                    max={24}
                    step={0.5}
                    value={[deEsserSettings.range]}
                    onValueChange={(value) => handleDeEsserSliderChange('range', value)}
                    disabled={!deEsserSettings.enabled}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deesser-frequency">Center Frequency ({deEsserSettings.frequency} Hz)</Label>
                <Slider
                  id="deesser-frequency"
                  min={3000}
                  max={12000}
                  step={100}
                  value={[deEsserSettings.frequency]}
                  onValueChange={(value) => handleDeEsserSliderChange('frequency', value)}
                  disabled={!deEsserSettings.enabled}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>3 kHz</span>
                  <span>6 kHz</span>
                  <span>9 kHz</span>
                  <span>12 kHz</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deesser-attack">Attack ({deEsserSettings.attackTime} ms)</Label>
                  <Slider
                    id="deesser-attack"
                    min={0.1}
                    max={10}
                    step={0.1}
                    value={[deEsserSettings.attackTime]}
                    onValueChange={(value) => handleDeEsserSliderChange('attackTime', value)}
                    disabled={!deEsserSettings.enabled}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="deesser-release">Release ({deEsserSettings.releaseTime} ms)</Label>
                  <Slider
                    id="deesser-release"
                    min={10}
                    max={500}
                    step={5}
                    value={[deEsserSettings.releaseTime]}
                    onValueChange={(value) => handleDeEsserSliderChange('releaseTime', value)}
                    disabled={!deEsserSettings.enabled}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="deesser-auto"
                    checked={deEsserSettings.autoThreshold}
                    onCheckedChange={(value) => handleDeEsserChange('autoThreshold', value)}
                    disabled={!deEsserSettings.enabled}
                  />
                  <Label htmlFor="deesser-auto" className="text-sm">Auto Threshold</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="deesser-split"
                    checked={deEsserSettings.splitBand}
                    onCheckedChange={(value) => handleDeEsserChange('splitBand', value)}
                    disabled={!deEsserSettings.enabled}
                  />
                  <Label htmlFor="deesser-split" className="text-sm">Split Band Mode</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="deesser-listen"
                    checked={deEsserSettings.listenMode}
                    onCheckedChange={(value) => handleDeEsserChange('listenMode', value)}
                    disabled={!deEsserSettings.enabled}
                  />
                  <Label htmlFor="deesser-listen" className="text-sm">Listen Mode</Label>
                </div>
              </div>
              
              <div className="text-xs text-gray-400 p-3 bg-gray-950 border border-gray-800 rounded-md">
                <p className="mb-1">
                  <strong>De-esser</strong> reduces harsh sibilance ("s", "sh", "t" sounds) in vocals
                  and high-frequency content.
                </p>
                <p>
                  <span className="text-blue-400">Split Band Mode</span> only processes the selected frequency band
                  instead of the full signal. <span className="text-blue-400">Listen Mode</span> lets you hear
                  only the audio being removed.
                </p>
              </div>
            </div>
          </TabsContent>
          
          {/* Limiter Tab */}
          <TabsContent value="limiter" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h3 className="text-sm font-medium">Final Limiter & Clipper</h3>
                <Switch 
                  className="ml-2"
                  checked={limiterSettings.enabled}
                  onCheckedChange={(value) => handleLimiterChange('enabled', value)}
                />
              </div>
              <div className="text-xs text-gray-400">
                Controls output peaks
              </div>
            </div>
            
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
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
              </div>
              
              <div className="grid grid-cols-2 gap-4">
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
                
                <div className="space-y-2">
                  <Label htmlFor="limiter-clipper">Clipper Amount ({limiterSettings.clipperAmount}%)</Label>
                  <Slider
                    id="limiter-clipper"
                    min={0}
                    max={100}
                    step={1}
                    value={[limiterSettings.clipperAmount]}
                    onValueChange={(value) => handleLimiterSliderChange('clipperAmount', value)}
                    disabled={!limiterSettings.enabled}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clipper-shape" className="text-xs">Clipper Shape</Label>
                  <Select 
                    value={limiterSettings.clipperShape}
                    onValueChange={(value) => handleLimiterChange('clipperShape', value)}
                    disabled={!limiterSettings.enabled || limiterSettings.clipperAmount === 0}
                  >
                    <SelectTrigger className="w-full" id="clipper-shape">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="soft">Soft</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                      <SelectItem value="adaptive">Adaptive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="oversample" className="text-xs">Oversample</Label>
                  <Select 
                    value={limiterSettings.oversample}
                    onValueChange={(value) => handleLimiterChange('oversample', value)}
                    disabled={!limiterSettings.enabled}
                  >
                    <SelectTrigger className="w-full" id="oversample">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1x">1x</SelectItem>
                      <SelectItem value="2x">2x</SelectItem>
                      <SelectItem value="4x">4x</SelectItem>
                      <SelectItem value="8x">8x</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="limiter-dither" className="text-xs">Dither</Label>
                    <Switch
                      id="limiter-dither"
                      checked={limiterSettings.dither}
                      onCheckedChange={(value) => handleLimiterChange('dither', value)}
                      disabled={!limiterSettings.enabled}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="limiter-autogain" className="text-xs">Auto-Gain</Label>
                    <Switch
                      id="limiter-autogain"
                      checked={limiterSettings.autoGain}
                      onCheckedChange={(value) => handleLimiterChange('autoGain', value)}
                      disabled={!limiterSettings.enabled}
                    />
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-gray-400 p-3 bg-gray-950 border border-gray-800 rounded-md">
                <p className="mb-1">
                  <strong>Limiter & Clipper</strong> controls the final output level of your audio
                  and prevents peaks from exceeding the ceiling threshold.
                </p>
                <p>
                  <span className="text-blue-400">True Peak Limiting</span> (with oversampling) prevents inter-sample peaks
                  that can cause distortion during conversion. The <span className="text-blue-400">Clipper</span> can
                  add density and perceived loudness through controlled distortion.
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

export default LoudnessSection;
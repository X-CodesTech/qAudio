import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  SlidersHorizontal,
  RefreshCw,
  Save,
  ArrowRightLeft,
  Magnet,
  Move,
  CornerUpRight,
  ArrowLeftRight,
  GitMerge,
  Compass,
  RotateCw,
  Share2,
  Maximize,
  Expand,
  Upload,
  Download,
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

interface StereoToolSectionProps {
  onSave?: () => void;
}

// Stereo Enhancer/Expander settings
interface StereoEnhancerSettings {
  enabled: boolean;
  intensity: number;
  density: number;
  focus: number;
  mono: boolean;
  lowCutFrequency: number;
  highCutFrequency: number;
}

// Stereo Width Control settings
interface StereoWidthSettings {
  enabled: boolean;
  width: number;
  bassMonoFrequency: number;
  multiband: boolean;
  lowWidth: number;
  midWidth: number;
  highWidth: number;
  lowCrossover: number;
  highCrossover: number;
}

// Mid/Side Processing settings
interface MidSideSettings {
  enabled: boolean;
  midLevel: number;
  sideLevel: number;
  midPan: number;
  sidePan: number;
  midDelay: number;
  sideDelay: number;
  midEQ: {
    lowGain: number;
    midGain: number;
    highGain: number;
  };
  sideEQ: {
    lowGain: number;
    midGain: number;
    highGain: number;
  };
}

// Phase Rotation & Correction settings
interface PhaseSettings {
  enabled: boolean;
  rotation: number;
  allPass: boolean;
  autoAlign: boolean;
  detectThreshold: number;
  correctAmount: number;
  lowCutFrequency: number;
  highCutFrequency: number;
}

// Panning and Imaging settings
interface PanningSettings {
  enabled: boolean;
  panPosition: number;
  balance: number;
  spatialExpansion: number;
  imageRotation: number;
  imageWidth: number;
  bassPreservation: boolean;
  bassFrequency: number;
}

// For preset selections
const STEREO_PRESETS = [
  { id: 'natural', name: 'Natural Stereo', description: 'Subtle, natural stereo enhancement' },
  { id: 'wide', name: 'Wide Stereo', description: 'Expanded stereo field' },
  { id: 'super-wide', name: 'Super Wide', description: 'Maximum stereo width' },
  { id: 'focused', name: 'Focused', description: 'Centered with precision' },
  { id: 'mastering', name: 'Mastering', description: 'Subtle enhancement for mastering' },
  { id: 'mono-compatible', name: 'Mono Compatible', description: 'Wide but mono compatible' },
];

const StereoToolSection: React.FC<StereoToolSectionProps> = ({ onSave }) => {
  // State for active tab
  const [activeTab, setActiveTab] = useState<string>('enhancer');
  
  // Master enable for all stereo processing
  const [stereoToolEnabled, setStereoToolEnabled] = useState<boolean>(true);
  
  // Individual effect states
  const [stereoEnhancer, setStereoEnhancer] = useState<StereoEnhancerSettings>({
    enabled: true,
    intensity: 35,
    density: 50,
    focus: 0,
    mono: false,
    lowCutFrequency: 100,
    highCutFrequency: 12000
  });
  
  const [stereoWidth, setStereoWidth] = useState<StereoWidthSettings>({
    enabled: true,
    width: 110,
    bassMonoFrequency: 200,
    multiband: false,
    lowWidth: 90,
    midWidth: 110,
    highWidth: 120,
    lowCrossover: 250,
    highCrossover: 6000
  });
  
  const [midSide, setMidSide] = useState<MidSideSettings>({
    enabled: false,
    midLevel: 0,
    sideLevel: 0,
    midPan: 0,
    sidePan: 0,
    midDelay: 0,
    sideDelay: 0,
    midEQ: {
      lowGain: 0,
      midGain: 0,
      highGain: 0
    },
    sideEQ: {
      lowGain: 0,
      midGain: 0,
      highGain: 0
    }
  });
  
  const [phaseSettings, setPhaseSettings] = useState<PhaseSettings>({
    enabled: false,
    rotation: 0,
    allPass: false,
    autoAlign: false,
    detectThreshold: -30,
    correctAmount: 80,
    lowCutFrequency: 80,
    highCutFrequency: 8000
  });
  
  const [panningSettings, setPanningSettings] = useState<PanningSettings>({
    enabled: true,
    panPosition: 0,
    balance: 0,
    spatialExpansion: 20,
    imageRotation: 0,
    imageWidth: 100,
    bassPreservation: true,
    bassFrequency: 150
  });
  
  // Canvas references for visualizations
  const stereoVectorScopeRef = useRef<HTMLCanvasElement | null>(null);
  const stereoFieldRef = useRef<HTMLCanvasElement | null>(null);
  const phaseScopeRef = useRef<HTMLCanvasElement | null>(null);
  const goniometerRef = useRef<HTMLCanvasElement | null>(null);
  
  // Animation frame reference
  const requestAnimationRef = useRef<number | null>(null);
  
  // Handle stereo enhancer setting changes
  const handleEnhancerChange = (property: keyof StereoEnhancerSettings, value: number | boolean) => {
    setStereoEnhancer(prev => ({
      ...prev,
      [property]: value
    }));
  };
  
  // Handle stereo enhancer slider changes
  const handleEnhancerSliderChange = (property: keyof StereoEnhancerSettings, values: number[]) => {
    if (values.length > 0) {
      handleEnhancerChange(property, values[0]);
    }
  };
  
  // Handle stereo width setting changes
  const handleWidthChange = (property: keyof StereoWidthSettings, value: number | boolean) => {
    setStereoWidth(prev => ({
      ...prev,
      [property]: value
    }));
  };
  
  // Handle stereo width slider changes
  const handleWidthSliderChange = (property: keyof StereoWidthSettings, values: number[]) => {
    if (values.length > 0) {
      handleWidthChange(property, values[0]);
    }
  };
  
  // Handle mid/side setting changes
  const handleMidSideChange = (property: keyof MidSideSettings, value: number | boolean) => {
    setMidSide(prev => ({
      ...prev,
      [property]: value
    }));
  };
  
  // Handle mid/side slider changes
  const handleMidSideSliderChange = (property: keyof MidSideSettings, values: number[]) => {
    if (values.length > 0) {
      handleMidSideChange(property, values[0]);
    }
  };
  
  // Handle mid EQ changes
  const handleMidEQChange = (property: keyof MidSideSettings['midEQ'], value: number) => {
    setMidSide(prev => ({
      ...prev,
      midEQ: {
        ...prev.midEQ,
        [property]: value
      }
    }));
  };
  
  // Handle side EQ changes
  const handleSideEQChange = (property: keyof MidSideSettings['sideEQ'], value: number) => {
    setMidSide(prev => ({
      ...prev,
      sideEQ: {
        ...prev.sideEQ,
        [property]: value
      }
    }));
  };
  
  // Handle phase setting changes
  const handlePhaseChange = (property: keyof PhaseSettings, value: number | boolean) => {
    setPhaseSettings(prev => ({
      ...prev,
      [property]: value
    }));
  };
  
  // Handle phase slider changes
  const handlePhaseSliderChange = (property: keyof PhaseSettings, values: number[]) => {
    if (values.length > 0) {
      handlePhaseChange(property, values[0]);
    }
  };
  
  // Handle panning setting changes
  const handlePanningChange = (property: keyof PanningSettings, value: number | boolean) => {
    setPanningSettings(prev => ({
      ...prev,
      [property]: value
    }));
  };
  
  // Handle panning slider changes
  const handlePanningSliderChange = (property: keyof PanningSettings, values: number[]) => {
    if (values.length > 0) {
      handlePanningChange(property, values[0]);
    }
  };
  
  // Reset all settings to default
  const resetSettings = () => {
    if (window.confirm('Reset all stereo tool settings to default?')) {
      setStereoEnhancer({
        enabled: true,
        intensity: 35,
        density: 50,
        focus: 0,
        mono: false,
        lowCutFrequency: 100,
        highCutFrequency: 12000
      });
      
      setStereoWidth({
        enabled: true,
        width: 110,
        bassMonoFrequency: 200,
        multiband: false,
        lowWidth: 90,
        midWidth: 110,
        highWidth: 120,
        lowCrossover: 250,
        highCrossover: 6000
      });
      
      setMidSide({
        enabled: false,
        midLevel: 0,
        sideLevel: 0,
        midPan: 0,
        sidePan: 0,
        midDelay: 0,
        sideDelay: 0,
        midEQ: {
          lowGain: 0,
          midGain: 0,
          highGain: 0
        },
        sideEQ: {
          lowGain: 0,
          midGain: 0,
          highGain: 0
        }
      });
      
      setPhaseSettings({
        enabled: false,
        rotation: 0,
        allPass: false,
        autoAlign: false,
        detectThreshold: -30,
        correctAmount: 80,
        lowCutFrequency: 80,
        highCutFrequency: 8000
      });
      
      setPanningSettings({
        enabled: true,
        panPosition: 0,
        balance: 0,
        spatialExpansion: 20,
        imageRotation: 0,
        imageWidth: 100,
        bassPreservation: true,
        bassFrequency: 150
      });
    }
  };
  
  // Load preset for stereo enhancement
  const loadStereoPreset = (presetId: string) => {
    switch (presetId) {
      case 'natural':
        setStereoEnhancer(prev => ({
          ...prev,
          intensity: 25,
          density: 40,
          focus: 0
        }));
        setStereoWidth(prev => ({
          ...prev,
          width: 105,
          bassMonoFrequency: 180
        }));
        break;
      case 'wide':
        setStereoEnhancer(prev => ({
          ...prev,
          intensity: 40,
          density: 60,
          focus: -10
        }));
        setStereoWidth(prev => ({
          ...prev,
          width: 130,
          bassMonoFrequency: 150
        }));
        break;
      case 'super-wide':
        setStereoEnhancer(prev => ({
          ...prev,
          intensity: 60,
          density: 80,
          focus: -20
        }));
        setStereoWidth(prev => ({
          ...prev,
          width: 160,
          bassMonoFrequency: 120
        }));
        setPanningSettings(prev => ({
          ...prev,
          spatialExpansion: 40,
          imageWidth: 130
        }));
        break;
      case 'focused':
        setStereoEnhancer(prev => ({
          ...prev,
          intensity: 20,
          density: 30,
          focus: 15
        }));
        setStereoWidth(prev => ({
          ...prev,
          width: 95,
          bassMonoFrequency: 250
        }));
        break;
      case 'mastering':
        setStereoEnhancer(prev => ({
          ...prev,
          intensity: 15,
          density: 25,
          focus: 0
        }));
        setStereoWidth(prev => ({
          ...prev,
          width: 105,
          bassMonoFrequency: 200
        }));
        break;
      case 'mono-compatible':
        setStereoEnhancer(prev => ({
          ...prev,
          intensity: 30,
          density: 45,
          focus: -5
        }));
        setStereoWidth(prev => ({
          ...prev,
          width: 120,
          bassMonoFrequency: 220
        }));
        break;
    }
  };
  
  // Draw stereo vectorscope
  const drawVectorScope = () => {
    const canvas = stereoVectorScopeRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid lines
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    
    // Vertical and horizontal lines
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    
    // Draw circles
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 4, 0, 2 * Math.PI);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2.5, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Calculate visualization based on current settings
    // This is a simulation since we don't have real audio data
    
    // For stereo enhancer: create a shape based on intensity and density
    const intensity = stereoEnhancer.enabled ? stereoEnhancer.intensity / 100 : 0.35;
    const density = stereoEnhancer.enabled ? stereoEnhancer.density / 100 : 0.5;
    const focus = stereoEnhancer.enabled ? 1 - Math.abs(stereoEnhancer.focus) / 50 : 1;
    
    // For stereo width: adjust the shape spread
    const width = stereoWidth.enabled ? stereoWidth.width / 100 : 1.1;
    
    // For mid/side: adjust the shape orientation
    const midLevel = midSide.enabled ? (midSide.midLevel + 12) / 24 : 0.5;
    const sideLevel = midSide.enabled ? (midSide.sideLevel + 12) / 24 : 0.5;
    
    // Draw simulated stereo content
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = canvas.width / 3;
    
    ctx.lineWidth = 2;
    
    // Draw a simulated stereo field
    if (stereoToolEnabled) {
      // Effect of stereo width
      const widthFactor = width * 0.8;
      
      // Effect of intensity and density
      const dotCount = Math.floor(30 + intensity * 70);
      const dotSize = 1 + density * 3;
      
      // Draw dots for stereo field
      ctx.fillStyle = 'rgba(64, 196, 255, 0.7)';
      
      for (let i = 0; i < dotCount; i++) {
        // Calculate position with some randomness
        const angle = Math.random() * Math.PI * 2;
        const randomFactor = Math.random() * 0.5 + 0.5; // 0.5 to 1.0
        const radius = randomFactor * maxRadius * widthFactor;
        
        // Apply focus (vertical compression)
        const focusedY = (Math.sin(angle) * radius) * focus;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + focusedY;
        
        // Draw dot
        ctx.beginPath();
        ctx.arc(x, y, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Effect of mid/side processing
      if (midSide.enabled) {
        ctx.strokeStyle = 'rgba(220, 120, 255, 0.6)';
        ctx.beginPath();
        
        // Draw an ellipse representing mid/side balance
        const midFactor = midLevel * 1.5;
        const sideFactor = sideLevel * 1.5;
        
        ctx.ellipse(
          centerX,
          centerY,
          maxRadius * midFactor * 0.8,
          maxRadius * sideFactor * 0.8,
          0,
          0,
          Math.PI * 2
        );
        
        ctx.stroke();
      }
      
      // Effect of phase rotation
      if (phaseSettings.enabled && phaseSettings.rotation !== 0) {
        ctx.strokeStyle = 'rgba(255, 200, 50, 0.6)';
        ctx.beginPath();
        
        // Convert rotation from degrees to radians
        const rotationRad = (phaseSettings.rotation / 180) * Math.PI;
        
        // Draw rotated line
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(rotationRad);
        ctx.moveTo(-maxRadius, 0);
        ctx.lineTo(maxRadius, 0);
        ctx.restore();
        
        ctx.stroke();
      }
      
      // Effect of panning
      if (panningSettings.enabled && (panningSettings.panPosition !== 0 || panningSettings.balance !== 0)) {
        const panOffset = (panningSettings.panPosition / 100) * maxRadius * 0.5;
        const balanceScale = 1 - Math.abs(panningSettings.balance) / 200;
        
        ctx.strokeStyle = 'rgba(255, 160, 50, 0.8)';
        ctx.beginPath();
        
        // Draw a circle representing the panned image
        ctx.arc(
          centerX + panOffset,
          centerY,
          maxRadius * 0.6 * balanceScale,
          0,
          Math.PI * 2
        );
        
        ctx.stroke();
      }
      
    } else {
      // When stereo tool is disabled, show a simple centered dot
      ctx.fillStyle = 'rgba(150, 150, 150, 0.8)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Labels
    ctx.fillStyle = '#888';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('L', 10, centerY);
    ctx.fillText('R', canvas.width - 10, centerY);
    ctx.fillText('M', centerX, 10);
    ctx.fillText('S', centerX, canvas.height - 5);
  };
  
  // Draw stereo field representation
  const drawStereoField = () => {
    const canvas = stereoFieldRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Parameters that affect the visualization
    const width = stereoWidth.enabled ? stereoWidth.width / 100 : 1.1;
    const intensity = stereoEnhancer.enabled ? stereoEnhancer.intensity / 100 : 0.35;
    const panPosition = panningSettings.enabled ? panningSettings.panPosition / 100 : 0;
    const imageWidth = panningSettings.enabled ? panningSettings.imageWidth / 100 : 1;
    
    // Calculate visualization
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxWidth = canvas.width * 0.8;
    
    // Draw stereo field representation
    if (stereoToolEnabled) {
      // Draw center line
      ctx.strokeStyle = '#444';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX, 5);
      ctx.lineTo(centerX, canvas.height - 5);
      ctx.stroke();
      
      // Draw stereo width representation
      const fieldWidth = maxWidth * width * imageWidth;
      const panOffset = panPosition * maxWidth * 0.4;
      
      // Draw stereo field gradient
      const gradient = ctx.createLinearGradient(
        centerX - fieldWidth / 2 + panOffset,
        centerY,
        centerX + fieldWidth / 2 + panOffset,
        centerY
      );
      
      gradient.addColorStop(0, 'rgba(50, 100, 255, 0.7)');
      gradient.addColorStop(0.5, 'rgba(80, 200, 255, 0.7)');
      gradient.addColorStop(1, 'rgba(50, 100, 255, 0.7)');
      
      // Draw gradient bar
      const barHeight = 30 + intensity * 50;
      ctx.fillStyle = gradient;
      ctx.fillRect(
        centerX - fieldWidth / 2 + panOffset,
        centerY - barHeight / 2,
        fieldWidth,
        barHeight
      );
      
      // Draw markers for L and R channels
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(centerX - fieldWidth / 2 + panOffset, centerY, 3, 0, Math.PI * 2);
      ctx.arc(centerX + fieldWidth / 2 + panOffset, centerY, 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw scale
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      
      // Draw scale markers
      for (let i = -100; i <= 100; i += 25) {
        const x = centerX + (i / 100) * (maxWidth / 2);
        
        ctx.beginPath();
        ctx.moveTo(x, centerY - 20);
        ctx.lineTo(x, centerY + 20);
        ctx.stroke();
        
        if (i !== 0) {
          ctx.fillStyle = '#666';
          ctx.font = '9px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(i + '%', x, centerY + 35);
        }
      }
      
      // Indicate mono region if bass preservation is enabled
      if (stereoWidth.enabled && stereoWidth.bassMonoFrequency > 0) {
        ctx.fillStyle = 'rgba(255, 200, 100, 0.2)';
        ctx.fillRect(
          centerX - 20 + panOffset,
          centerY - barHeight / 2,
          40,
          barHeight
        );
        
        ctx.fillStyle = '#888';
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Mono', centerX + panOffset, centerY + barHeight / 2 + 12);
        ctx.fillText(`< ${stereoWidth.bassMonoFrequency}Hz`, centerX + panOffset, centerY + barHeight / 2 + 24);
      }
      
    } else {
      // When stereo tool is disabled, show a simple centered line
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - 20);
      ctx.lineTo(centerX, centerY + 20);
      ctx.stroke();
      
      ctx.fillStyle = '#666';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Mono', centerX, centerY + 40);
    }
    
    // Labels
    ctx.fillStyle = '#888';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LEFT', 30, centerY - 25);
    ctx.fillText('RIGHT', canvas.width - 30, centerY - 25);
    ctx.fillText('CENTER', centerX, 15);
  };
  
  // Draw phase scope
  const drawPhaseScope = () => {
    const canvas = phaseScopeRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) / 2 - 10;
    
    // Draw circle
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Draw crosshairs
    ctx.beginPath();
    ctx.moveTo(centerX - radius, centerY);
    ctx.lineTo(centerX + radius, centerY);
    ctx.moveTo(centerX, centerY - radius);
    ctx.lineTo(centerX, centerY + radius);
    ctx.stroke();
    
    // Draw phase indicators
    if (stereoToolEnabled && phaseSettings.enabled) {
      // Convert rotation from degrees to radians
      const rotationRad = (phaseSettings.rotation / 180) * Math.PI;
      
      // Draw rotated line representing phase
      ctx.strokeStyle = '#f90';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(rotationRad);
      ctx.moveTo(0, -radius * 0.8);
      ctx.lineTo(0, radius * 0.8);
      ctx.restore();
      
      ctx.stroke();
      
      // Draw simulated phase correlation
      const correlation = Math.cos(rotationRad);
      const correlationX = centerX + correlation * radius * 0.8;
      
      ctx.fillStyle = correlation > 0 ? 'rgba(100, 255, 100, 0.8)' : 'rgba(255, 100, 100, 0.8)';
      ctx.beginPath();
      ctx.arc(correlationX, centerY, 5, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw correlation scale
      ctx.strokeStyle = '#444';
      ctx.lineWidth = 1;
      
      ctx.beginPath();
      ctx.moveTo(centerX - radius, centerY + radius * 0.9);
      ctx.lineTo(centerX + radius, centerY + radius * 0.9);
      ctx.stroke();
      
      // Scale markers
      for (let i = -1; i <= 1; i += 0.5) {
        const x = centerX + i * radius;
        
        ctx.beginPath();
        ctx.moveTo(x, centerY + radius * 0.85);
        ctx.lineTo(x, centerY + radius * 0.95);
        ctx.stroke();
        
        ctx.fillStyle = '#888';
        ctx.font = '9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(i.toString(), x, centerY + radius * 1.1);
      }
      
      // Labels
      ctx.fillStyle = '#888';
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Out of Phase', centerX - radius, centerY + radius * 0.8);
      
      ctx.textAlign = 'right';
      ctx.fillText('In Phase', centerX + radius, centerY + radius * 0.8);
      
    } else {
      // When phase tool is disabled or stereo tool is off
      ctx.fillStyle = '#666';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(stereoToolEnabled ? 'Phase: Disabled' : 'Stereo Tool: Off', centerX, centerY + 25);
    }
  };
  
  // Draw goniometer
  const drawGoniometer = () => {
    const canvas = goniometerRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const size = Math.min(canvas.width, canvas.height) - 20;
    const halfSize = size / 2;
    
    // Draw borders of the goniometer (square)
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.strokeRect(centerX - halfSize, centerY - halfSize, size, size);
    
    // Draw diagonal lines (L+R and L-R axes)
    ctx.beginPath();
    ctx.moveTo(centerX - halfSize, centerY - halfSize);
    ctx.lineTo(centerX + halfSize, centerY + halfSize);
    ctx.moveTo(centerX - halfSize, centerY + halfSize);
    ctx.lineTo(centerX + halfSize, centerY - halfSize);
    ctx.stroke();
    
    // Draw center lines
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - halfSize);
    ctx.lineTo(centerX, centerY + halfSize);
    ctx.moveTo(centerX - halfSize, centerY);
    ctx.lineTo(centerX + halfSize, centerY);
    ctx.stroke();
    
    // Parameters that affect the visualization
    if (stereoToolEnabled) {
      const width = stereoWidth.enabled ? stereoWidth.width / 100 : 1.1;
      const intensity = stereoEnhancer.enabled ? stereoEnhancer.intensity / 100 : 0.35;
      const panPosition = panningSettings.enabled ? panningSettings.panPosition / 100 : 0;
      const imageRotation = panningSettings.enabled ? (panningSettings.imageRotation / 180) * Math.PI : 0;
      
      // Draw stereo pattern based on settings
      ctx.fillStyle = 'rgba(80, 180, 255, 0.6)';
      
      // Number of points to draw
      const points = 200;
      
      for (let i = 0; i < points; i++) {
        // Calculate random point that simulates stereo content
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * halfSize * 0.8 * width * (0.5 + intensity / 2);
        
        // Apply rotation and panning
        let x = Math.cos(angle + imageRotation) * distance;
        let y = Math.sin(angle + imageRotation) * distance;
        
        // Apply panning
        x += panPosition * halfSize * 0.5;
        
        // Plot point
        ctx.beginPath();
        ctx.arc(centerX + x, centerY + y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Add some emphasis to left and right channels
      if (stereoEnhancer.enabled) {
        ctx.fillStyle = 'rgba(100, 200, 255, 0.8)';
        
        // Left channel emphasis
        for (let i = 0; i < 20; i++) {
          const x = -halfSize * 0.7 + Math.random() * halfSize * 0.3 + panPosition * halfSize * 0.5;
          const y = (Math.random() - 0.5) * halfSize * 0.8;
          
          ctx.beginPath();
          ctx.arc(centerX + x, centerY + y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Right channel emphasis
        for (let i = 0; i < 20; i++) {
          const x = halfSize * 0.4 + Math.random() * halfSize * 0.3 + panPosition * halfSize * 0.5;
          const y = (Math.random() - 0.5) * halfSize * 0.8;
          
          ctx.beginPath();
          ctx.arc(centerX + x, centerY + y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
    } else {
      // When stereo tool is disabled
      ctx.fillStyle = '#666';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Labels
    ctx.fillStyle = '#888';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('L+R', centerX + halfSize + 12, centerY + halfSize + 12);
    ctx.fillText('L-R', centerX + halfSize + 12, centerY - halfSize - 8);
    ctx.fillText('L', centerX - halfSize - 10, centerY);
    ctx.fillText('R', centerX + halfSize + 10, centerY);
  };
  
  // Update all visualizations in animation frame
  const updateVisualizations = () => {
    drawVectorScope();
    drawStereoField();
    drawPhaseScope();
    drawGoniometer();
    
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
    stereoToolEnabled,
    stereoEnhancer,
    stereoWidth,
    midSide,
    phaseSettings,
    panningSettings,
    activeTab
  ]);
  
  // Resize canvas to match display size
  useEffect(() => {
    const canvases = [
      stereoVectorScopeRef.current,
      stereoFieldRef.current,
      phaseScopeRef.current,
      goniometerRef.current
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
        <CardTitle className="text-lg text-rose-500 flex items-center justify-between">
          <div className="flex items-center">
            <SlidersHorizontal className="h-5 w-5 mr-2" />
            Stereo & Spatial Processing
          </div>
          <Switch 
            checked={stereoToolEnabled}
            onCheckedChange={setStereoToolEnabled}
          />
        </CardTitle>
      </CardHeader>
      <CardContent className={`${!stereoToolEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Stereo visualization area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-950 border border-gray-800 rounded-md p-3">
            <div className="text-sm font-medium text-gray-400 mb-2">Stereo Vector Scope</div>
            <canvas 
              ref={stereoVectorScopeRef} 
              className="w-full h-40" 
              style={{ display: 'block' }}
            />
          </div>
          <div className="bg-gray-950 border border-gray-800 rounded-md p-3">
            <div className="text-sm font-medium text-gray-400 mb-2">Stereo Field</div>
            <canvas 
              ref={stereoFieldRef} 
              className="w-full h-40" 
              style={{ display: 'block' }}
            />
          </div>
          <div className="bg-gray-950 border border-gray-800 rounded-md p-3">
            <div className="text-sm font-medium text-gray-400 mb-2">Phase Correlation</div>
            <canvas 
              ref={phaseScopeRef} 
              className="w-full h-40" 
              style={{ display: 'block' }}
            />
          </div>
          <div className="bg-gray-950 border border-gray-800 rounded-md p-3">
            <div className="text-sm font-medium text-gray-400 mb-2">Goniometer</div>
            <canvas 
              ref={goniometerRef} 
              className="w-full h-40" 
              style={{ display: 'block' }}
            />
          </div>
        </div>
        
        {/* Tabs for different stereo tools */}
        <Tabs defaultValue="enhancer" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList className="grid grid-cols-5">
              <TabsTrigger value="enhancer">
                <Expand className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Enhancer</span>
              </TabsTrigger>
              <TabsTrigger value="width">
                <ArrowLeftRight className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Width</span>
              </TabsTrigger>
              <TabsTrigger value="midside">
                <GitMerge className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Mid/Side</span>
              </TabsTrigger>
              <TabsTrigger value="phase">
                <RotateCw className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Phase</span>
              </TabsTrigger>
              <TabsTrigger value="panning">
                <Move className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Panning</span>
              </TabsTrigger>
            </TabsList>
            
            <Select defaultValue="preset" onValueChange={loadStereoPreset}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Presets" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="preset" disabled>Presets</SelectItem>
                {STEREO_PRESETS.map(preset => (
                  <SelectItem key={preset.id} value={preset.id}>
                    {preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Stereo Enhancer Tab */}
          <TabsContent value="enhancer" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h3 className="text-sm font-medium">Stereo Enhancer</h3>
                <Switch 
                  className="ml-2"
                  checked={stereoEnhancer.enabled}
                  onCheckedChange={(value) => handleEnhancerChange('enabled', value)}
                />
              </div>
              <div className="text-xs text-gray-400">
                Enhances stereo image by manipulating phase relationships
              </div>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="enhancer-intensity">Intensity ({stereoEnhancer.intensity}%)</Label>
                <Slider
                  id="enhancer-intensity"
                  min={0}
                  max={100}
                  step={1}
                  value={[stereoEnhancer.intensity]}
                  onValueChange={(value) => handleEnhancerSliderChange('intensity', value)}
                  disabled={!stereoEnhancer.enabled}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="enhancer-density">Density ({stereoEnhancer.density}%)</Label>
                <Slider
                  id="enhancer-density"
                  min={0}
                  max={100}
                  step={1}
                  value={[stereoEnhancer.density]}
                  onValueChange={(value) => handleEnhancerSliderChange('density', value)}
                  disabled={!stereoEnhancer.enabled}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="enhancer-focus">Focus ({stereoEnhancer.focus > 0 ? '+' : ''}{stereoEnhancer.focus})</Label>
                <Slider
                  id="enhancer-focus"
                  min={-50}
                  max={50}
                  step={1}
                  value={[stereoEnhancer.focus]}
                  onValueChange={(value) => handleEnhancerSliderChange('focus', value)}
                  disabled={!stereoEnhancer.enabled}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Wide</span>
                  <span>Centered</span>
                  <span>Focused</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="enhancer-low-cut">Low Cut ({stereoEnhancer.lowCutFrequency} Hz)</Label>
                  <Slider
                    id="enhancer-low-cut"
                    min={20}
                    max={500}
                    step={10}
                    value={[stereoEnhancer.lowCutFrequency]}
                    onValueChange={(value) => handleEnhancerSliderChange('lowCutFrequency', value)}
                    disabled={!stereoEnhancer.enabled}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="enhancer-high-cut">High Cut ({stereoEnhancer.highCutFrequency} Hz)</Label>
                  <Slider
                    id="enhancer-high-cut"
                    min={2000}
                    max={20000}
                    step={500}
                    value={[stereoEnhancer.highCutFrequency]}
                    onValueChange={(value) => handleEnhancerSliderChange('highCutFrequency', value)}
                    disabled={!stereoEnhancer.enabled}
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="enhancer-mono"
                  checked={stereoEnhancer.mono}
                  onCheckedChange={(value) => handleEnhancerChange('mono', value)}
                  disabled={!stereoEnhancer.enabled}
                />
                <Label htmlFor="enhancer-mono">Check Mono Compatibility</Label>
              </div>
              
              <div className="text-xs text-gray-400 p-3 bg-gray-950 border border-gray-800 rounded-md">
                <p className="mb-1">
                  <strong>Stereo Enhancer</strong> enriches the stereo image by manipulating phase relationships 
                  between channels.
                </p>
                <p>
                  Use <strong>Intensity</strong> to control the amount of enhancement and <strong>Density</strong> to 
                  adjust the texture. <strong>Focus</strong> affects the spatial positioning.
                </p>
              </div>
            </div>
          </TabsContent>
          
          {/* Stereo Width Tab */}
          <TabsContent value="width" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h3 className="text-sm font-medium">Stereo Width Control</h3>
                <Switch 
                  className="ml-2"
                  checked={stereoWidth.enabled}
                  onCheckedChange={(value) => handleWidthChange('enabled', value)}
                />
              </div>
              <div className="text-xs text-gray-400">
                Controls the width of the stereo image
              </div>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="width-amount">Width ({stereoWidth.width}%)</Label>
                <Slider
                  id="width-amount"
                  min={0}
                  max={200}
                  step={1}
                  value={[stereoWidth.width]}
                  onValueChange={(value) => handleWidthSliderChange('width', value)}
                  disabled={!stereoWidth.enabled}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Mono</span>
                  <span>Normal</span>
                  <span>Wide</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="width-bass-mono">Bass Mono Frequency ({stereoWidth.bassMonoFrequency} Hz)</Label>
                <Slider
                  id="width-bass-mono"
                  min={0}
                  max={500}
                  step={10}
                  value={[stereoWidth.bassMonoFrequency]}
                  onValueChange={(value) => handleWidthSliderChange('bassMonoFrequency', value)}
                  disabled={!stereoWidth.enabled}
                />
                <div className="text-xs text-gray-500 mt-1">
                  <span>Frequencies below this value will be centered (0 = disabled)</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="width-multiband"
                    checked={stereoWidth.multiband}
                    onCheckedChange={(value) => handleWidthChange('multiband', value)}
                    disabled={!stereoWidth.enabled}
                  />
                  <Label htmlFor="width-multiband">Enable Multiband Width Control</Label>
                </div>
              </div>
              
              {stereoWidth.multiband && (
                <div className="space-y-4 p-3 bg-gray-900 border border-gray-800 rounded-md">
                  <div className="space-y-2">
                    <Label htmlFor="width-low">Low Band Width ({stereoWidth.lowWidth}%)</Label>
                    <Slider
                      id="width-low"
                      min={0}
                      max={200}
                      step={1}
                      value={[stereoWidth.lowWidth]}
                      onValueChange={(value) => handleWidthSliderChange('lowWidth', value)}
                      disabled={!stereoWidth.enabled}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="width-mid">Mid Band Width ({stereoWidth.midWidth}%)</Label>
                    <Slider
                      id="width-mid"
                      min={0}
                      max={200}
                      step={1}
                      value={[stereoWidth.midWidth]}
                      onValueChange={(value) => handleWidthSliderChange('midWidth', value)}
                      disabled={!stereoWidth.enabled}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="width-high">High Band Width ({stereoWidth.highWidth}%)</Label>
                    <Slider
                      id="width-high"
                      min={0}
                      max={200}
                      step={1}
                      value={[stereoWidth.highWidth]}
                      onValueChange={(value) => handleWidthSliderChange('highWidth', value)}
                      disabled={!stereoWidth.enabled}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="width-low-crossover">Low Crossover ({stereoWidth.lowCrossover} Hz)</Label>
                      <Slider
                        id="width-low-crossover"
                        min={20}
                        max={1000}
                        step={10}
                        value={[stereoWidth.lowCrossover]}
                        onValueChange={(value) => handleWidthSliderChange('lowCrossover', value)}
                        disabled={!stereoWidth.enabled}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="width-high-crossover">High Crossover ({stereoWidth.highCrossover} Hz)</Label>
                      <Slider
                        id="width-high-crossover"
                        min={1000}
                        max={15000}
                        step={100}
                        value={[stereoWidth.highCrossover]}
                        onValueChange={(value) => handleWidthSliderChange('highCrossover', value)}
                        disabled={!stereoWidth.enabled}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              <div className="text-xs text-gray-400 p-3 bg-gray-950 border border-gray-800 rounded-md">
                <p className="mb-1">
                  <strong>Stereo Width Control</strong> adjusts the perceived stereo field width.
                </p>
                <p>
                  Bass frequencies are often kept mono (centered) for better phase coherence
                  and compatibility with mono systems.
                </p>
              </div>
            </div>
          </TabsContent>
          
          {/* Mid/Side Processing Tab */}
          <TabsContent value="midside" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h3 className="text-sm font-medium">Mid/Side Processing</h3>
                <Switch 
                  className="ml-2"
                  checked={midSide.enabled}
                  onCheckedChange={(value) => handleMidSideChange('enabled', value)}
                />
              </div>
              <div className="text-xs text-gray-400">
                Process mid (mono) and side (stereo) components separately
              </div>
            </div>
            
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ms-mid-level">Mid Level ({midSide.midLevel > 0 ? '+' : ''}{midSide.midLevel} dB)</Label>
                  <Slider
                    id="ms-mid-level"
                    min={-12}
                    max={12}
                    step={0.5}
                    value={[midSide.midLevel]}
                    onValueChange={(value) => handleMidSideSliderChange('midLevel', value)}
                    disabled={!midSide.enabled}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ms-side-level">Side Level ({midSide.sideLevel > 0 ? '+' : ''}{midSide.sideLevel} dB)</Label>
                  <Slider
                    id="ms-side-level"
                    min={-12}
                    max={12}
                    step={0.5}
                    value={[midSide.sideLevel]}
                    onValueChange={(value) => handleMidSideSliderChange('sideLevel', value)}
                    disabled={!midSide.enabled}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ms-mid-pan">Mid Pan ({midSide.midPan})</Label>
                  <Slider
                    id="ms-mid-pan"
                    min={-100}
                    max={100}
                    step={1}
                    value={[midSide.midPan]}
                    onValueChange={(value) => handleMidSideSliderChange('midPan', value)}
                    disabled={!midSide.enabled}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ms-side-pan">Side Pan ({midSide.sidePan})</Label>
                  <Slider
                    id="ms-side-pan"
                    min={-100}
                    max={100}
                    step={1}
                    value={[midSide.sidePan]}
                    onValueChange={(value) => handleMidSideSliderChange('sidePan', value)}
                    disabled={!midSide.enabled}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ms-mid-delay">Mid Delay ({midSide.midDelay} ms)</Label>
                  <Slider
                    id="ms-mid-delay"
                    min={0}
                    max={50}
                    step={0.1}
                    value={[midSide.midDelay]}
                    onValueChange={(value) => handleMidSideSliderChange('midDelay', value)}
                    disabled={!midSide.enabled}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ms-side-delay">Side Delay ({midSide.sideDelay} ms)</Label>
                  <Slider
                    id="ms-side-delay"
                    min={0}
                    max={50}
                    step={0.1}
                    value={[midSide.sideDelay]}
                    onValueChange={(value) => handleMidSideSliderChange('sideDelay', value)}
                    disabled={!midSide.enabled}
                  />
                </div>
              </div>
              
              <div className="p-3 bg-gray-900 border border-gray-800 rounded-md space-y-4">
                <div className="text-sm font-medium text-gray-300 mb-1">Mid/Side EQ</div>
                
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Mid Channel EQ</span>
                      <span>Low / Mid / High</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Slider
                        min={-12}
                        max={12}
                        step={0.5}
                        value={[midSide.midEQ.lowGain]}
                        onValueChange={(value) => handleMidEQChange('lowGain', value[0])}
                        disabled={!midSide.enabled}
                      />
                      <Slider
                        min={-12}
                        max={12}
                        step={0.5}
                        value={[midSide.midEQ.midGain]}
                        onValueChange={(value) => handleMidEQChange('midGain', value[0])}
                        disabled={!midSide.enabled}
                      />
                      <Slider
                        min={-12}
                        max={12}
                        step={0.5}
                        value={[midSide.midEQ.highGain]}
                        onValueChange={(value) => handleMidEQChange('highGain', value[0])}
                        disabled={!midSide.enabled}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{midSide.midEQ.lowGain > 0 ? '+' : ''}{midSide.midEQ.lowGain} dB</span>
                      <span>{midSide.midEQ.midGain > 0 ? '+' : ''}{midSide.midEQ.midGain} dB</span>
                      <span>{midSide.midEQ.highGain > 0 ? '+' : ''}{midSide.midEQ.highGain} dB</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Side Channel EQ</span>
                      <span>Low / Mid / High</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Slider
                        min={-12}
                        max={12}
                        step={0.5}
                        value={[midSide.sideEQ.lowGain]}
                        onValueChange={(value) => handleSideEQChange('lowGain', value[0])}
                        disabled={!midSide.enabled}
                      />
                      <Slider
                        min={-12}
                        max={12}
                        step={0.5}
                        value={[midSide.sideEQ.midGain]}
                        onValueChange={(value) => handleSideEQChange('midGain', value[0])}
                        disabled={!midSide.enabled}
                      />
                      <Slider
                        min={-12}
                        max={12}
                        step={0.5}
                        value={[midSide.sideEQ.highGain]}
                        onValueChange={(value) => handleSideEQChange('highGain', value[0])}
                        disabled={!midSide.enabled}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{midSide.sideEQ.lowGain > 0 ? '+' : ''}{midSide.sideEQ.lowGain} dB</span>
                      <span>{midSide.sideEQ.midGain > 0 ? '+' : ''}{midSide.sideEQ.midGain} dB</span>
                      <span>{midSide.sideEQ.highGain > 0 ? '+' : ''}{midSide.sideEQ.highGain} dB</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-gray-400 p-3 bg-gray-950 border border-gray-800 rounded-md">
                <p className="mb-1">
                  <strong>Mid/Side Processing</strong> separates audio into Mid channel (L+R, center) and 
                  Side channel (L-R, stereo information) for independent processing.
                </p>
                <p>
                  Use to control stereo image precisely, enhance spatial characteristics,
                  or create unique stereo effects.
                </p>
              </div>
            </div>
          </TabsContent>
          
          {/* Phase Rotation & Correction Tab */}
          <TabsContent value="phase" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h3 className="text-sm font-medium">Phase Rotation & Correction</h3>
                <Switch 
                  className="ml-2"
                  checked={phaseSettings.enabled}
                  onCheckedChange={(value) => handlePhaseChange('enabled', value)}
                />
              </div>
              <div className="text-xs text-gray-400">
                Corrects phase issues between channels
              </div>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="phase-rotation">Phase Rotation ({phaseSettings.rotation}°)</Label>
                <Slider
                  id="phase-rotation"
                  min={-180}
                  max={180}
                  step={1}
                  value={[phaseSettings.rotation]}
                  onValueChange={(value) => handlePhaseSliderChange('rotation', value)}
                  disabled={!phaseSettings.enabled}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>-180°</span>
                  <span>0°</span>
                  <span>+180°</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="phase-allpass"
                    checked={phaseSettings.allPass}
                    onCheckedChange={(value) => handlePhaseChange('allPass', value)}
                    disabled={!phaseSettings.enabled}
                  />
                  <Label htmlFor="phase-allpass">All-Pass Filter</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="phase-auto"
                    checked={phaseSettings.autoAlign}
                    onCheckedChange={(value) => handlePhaseChange('autoAlign', value)}
                    disabled={!phaseSettings.enabled}
                  />
                  <Label htmlFor="phase-auto">Auto Alignment</Label>
                </div>
              </div>
              
              {phaseSettings.autoAlign && (
                <div className="space-y-4 p-3 bg-gray-900 border border-gray-800 rounded-md">
                  <div className="space-y-2">
                    <Label htmlFor="phase-threshold">Detection Threshold ({phaseSettings.detectThreshold} dB)</Label>
                    <Slider
                      id="phase-threshold"
                      min={-60}
                      max={-10}
                      step={1}
                      value={[phaseSettings.detectThreshold]}
                      onValueChange={(value) => handlePhaseSliderChange('detectThreshold', value)}
                      disabled={!phaseSettings.enabled || !phaseSettings.autoAlign}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phase-amount">Correction Amount ({phaseSettings.correctAmount}%)</Label>
                    <Slider
                      id="phase-amount"
                      min={0}
                      max={100}
                      step={1}
                      value={[phaseSettings.correctAmount]}
                      onValueChange={(value) => handlePhaseSliderChange('correctAmount', value)}
                      disabled={!phaseSettings.enabled || !phaseSettings.autoAlign}
                    />
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phase-low-cut">Low Cut ({phaseSettings.lowCutFrequency} Hz)</Label>
                  <Slider
                    id="phase-low-cut"
                    min={20}
                    max={500}
                    step={10}
                    value={[phaseSettings.lowCutFrequency]}
                    onValueChange={(value) => handlePhaseSliderChange('lowCutFrequency', value)}
                    disabled={!phaseSettings.enabled}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phase-high-cut">High Cut ({phaseSettings.highCutFrequency} Hz)</Label>
                  <Slider
                    id="phase-high-cut"
                    min={2000}
                    max={20000}
                    step={500}
                    value={[phaseSettings.highCutFrequency]}
                    onValueChange={(value) => handlePhaseSliderChange('highCutFrequency', value)}
                    disabled={!phaseSettings.enabled}
                  />
                </div>
              </div>
              
              <div className="text-xs text-gray-400 p-3 bg-gray-950 border border-gray-800 rounded-md">
                <p className="mb-1">
                  <strong>Phase Rotation & Correction</strong> helps fix phase issues between channels 
                  and can improve mono compatibility.
                </p>
                <p>
                  Manual phase rotation alters the phase relationship directly, while
                  auto alignment automatically detects and corrects phase problems.
                </p>
              </div>
            </div>
          </TabsContent>
          
          {/* Panning and Imaging Tab */}
          <TabsContent value="panning" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <h3 className="text-sm font-medium">Panning & Imaging</h3>
                <Switch 
                  className="ml-2"
                  checked={panningSettings.enabled}
                  onCheckedChange={(value) => handlePanningChange('enabled', value)}
                />
              </div>
              <div className="text-xs text-gray-400">
                Adjust stereo image positioning and spatial properties
              </div>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="pan-position">Pan Position ({panningSettings.panPosition})</Label>
                <Slider
                  id="pan-position"
                  min={-100}
                  max={100}
                  step={1}
                  value={[panningSettings.panPosition]}
                  onValueChange={(value) => handlePanningSliderChange('panPosition', value)}
                  disabled={!panningSettings.enabled}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Left</span>
                  <span>Center</span>
                  <span>Right</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="pan-balance">Balance ({panningSettings.balance})</Label>
                <Slider
                  id="pan-balance"
                  min={-100}
                  max={100}
                  step={1}
                  value={[panningSettings.balance]}
                  onValueChange={(value) => handlePanningSliderChange('balance', value)}
                  disabled={!panningSettings.enabled}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Left</span>
                  <span>Center</span>
                  <span>Right</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="pan-expansion">Spatial Expansion ({panningSettings.spatialExpansion}%)</Label>
                <Slider
                  id="pan-expansion"
                  min={0}
                  max={100}
                  step={1}
                  value={[panningSettings.spatialExpansion]}
                  onValueChange={(value) => handlePanningSliderChange('spatialExpansion', value)}
                  disabled={!panningSettings.enabled}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pan-rotation">Image Rotation ({panningSettings.imageRotation}°)</Label>
                  <Slider
                    id="pan-rotation"
                    min={-180}
                    max={180}
                    step={1}
                    value={[panningSettings.imageRotation]}
                    onValueChange={(value) => handlePanningSliderChange('imageRotation', value)}
                    disabled={!panningSettings.enabled}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pan-width">Image Width ({panningSettings.imageWidth}%)</Label>
                  <Slider
                    id="pan-width"
                    min={0}
                    max={200}
                    step={1}
                    value={[panningSettings.imageWidth]}
                    onValueChange={(value) => handlePanningSliderChange('imageWidth', value)}
                    disabled={!panningSettings.enabled}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="pan-bass"
                    checked={panningSettings.bassPreservation}
                    onCheckedChange={(value) => handlePanningChange('bassPreservation', value)}
                    disabled={!panningSettings.enabled}
                  />
                  <Label htmlFor="pan-bass">Bass Preservation</Label>
                </div>
                
                {panningSettings.bassPreservation && (
                  <div className="w-32">
                    <Label htmlFor="pan-bass-freq" className="text-xs">Frequency: {panningSettings.bassFrequency} Hz</Label>
                    <Slider
                      id="pan-bass-freq"
                      min={20}
                      max={500}
                      step={10}
                      value={[panningSettings.bassFrequency]}
                      onValueChange={(value) => handlePanningSliderChange('bassFrequency', value)}
                      disabled={!panningSettings.enabled || !panningSettings.bassPreservation}
                    />
                  </div>
                )}
              </div>
              
              <div className="text-xs text-gray-400 p-3 bg-gray-950 border border-gray-800 rounded-md">
                <p className="mb-1">
                  <strong>Panning & Imaging</strong> tools control the stereo image positioning
                  and spatial properties of the audio.
                </p>
                <p>
                  <strong>Pan Position</strong> shifts the entire stereo image, while <strong>Balance</strong> adjusts
                  the relative levels. <strong>Spatial Expansion</strong> and <strong>Image Width</strong> control the
                  perceived depth and width of the stereo field.
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

export default StereoToolSection;
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Sliders,
  SlidersHorizontal,
  BarChart4,
  Save,
  RefreshCw,
  Waves,
  Scissors,
  PlayCircle,
  StopCircle,
  Upload,
  Download,
  Gauge,
  Moon,
  Check,
  X,
  Copy,
  ListFilter,
  Trash2,
  Plus,
  Minus
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

interface EqualizerSectionProps {
  onSave?: () => void;
}

interface EQBand {
  id: number;
  frequency: number;
  gain: number;
  q: number;
  type: 'parametric' | 'low-shelf' | 'high-shelf' | 'low-pass' | 'high-pass' | 'notch' | 'dynamic';
  enabled: boolean;
  // Dynamic EQ specific properties
  threshold?: number;
  ratio?: number;
  attack?: number;
  release?: number;
}

interface FilterSettings {
  highPass: {
    enabled: boolean;
    frequency: number;
    q: number;
    slope: number;
  };
  lowPass: {
    enabled: boolean;
    frequency: number;
    q: number;
    slope: number;
  };
  notch: {
    enabled: boolean;
    frequency: number;
    q: number;
    depth: number;
  };
}

// Initial EQ bands - 10 band parametric EQ
const createInitialBands = (): EQBand[] => {
  // Standard frequencies for a 10-band EQ
  const frequencies = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
  
  return frequencies.map((freq, index) => ({
    id: index + 1,
    frequency: freq,
    gain: 0,
    q: 1.0,
    type: 'parametric',
    enabled: true
  }));
};

// Preset definitions
const EQ_PRESETS = [
  { id: 'flat', name: 'Flat (0 dB)', description: 'Neutral response' },
  { id: 'vocal', name: 'Vocal Boost', description: 'Enhances vocals' },
  { id: 'bass', name: 'Bass Boost', description: 'Enhanced low frequencies' },
  { id: 'treble', name: 'Treble Boost', description: 'Enhanced high frequencies' },
  { id: 'loudness', name: 'Loudness', description: 'Boosted lows and highs' },
  { id: 'acoustic', name: 'Acoustic', description: 'For acoustic instruments' },
  { id: 'electronic', name: 'Electronic', description: 'For electronic music' },
  { id: 'speech', name: 'Speech', description: 'Optimized for voice clarity' },
];

// Generate frequency labels for the spectrum display
const generateFrequencyLabels = () => {
  const frequencies = [20, 50, 100, 200, 500, "1k", "2k", "5k", "10k", "20k"];
  return frequencies;
};

const EqualizerSection: React.FC<EqualizerSectionProps> = ({ onSave }) => {
  // Main state for the Equalizer section
  const [equalizerEnabled, setEqualizerEnabled] = useState(true);
  const [eqMode, setEqMode] = useState<'parametric' | 'graphic'>('parametric');
  const [eqBands, setEqBands] = useState<EQBand[]>(createInitialBands());
  const [selectedBandId, setSelectedBandId] = useState<number | null>(1);
  const [numBands, setNumBands] = useState(10);
  const [showGridLines, setShowGridLines] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Filter settings
  const [filters, setFilters] = useState<FilterSettings>({
    highPass: {
      enabled: false,
      frequency: 20,
      q: 0.7,
      slope: 12
    },
    lowPass: {
      enabled: false,
      frequency: 20000,
      q: 0.7,
      slope: 12
    },
    notch: {
      enabled: false,
      frequency: 440,
      q: 30,
      depth: 30
    }
  });
  
  // Reference to the canvas element for drawing the EQ curve
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Get selected band
  const selectedBand = eqBands.find(band => band.id === selectedBandId) || null;
  
  // Toggle EQ mode between parametric and graphic
  const toggleEqMode = () => {
    const newMode = eqMode === 'parametric' ? 'graphic' : 'parametric';
    setEqMode(newMode);
    
    // Reset bands when switching modes to ensure consistency
    if (newMode === 'graphic') {
      // Graphic EQ has fixed frequencies and Q values
      setEqBands(eqBands.map(band => ({
        ...band,
        q: 1.4,
        type: 'parametric'
      })));
    }
  };
  
  // Change number of bands
  const handleBandCountChange = (count: number) => {
    if (count === numBands) return;
    
    setNumBands(count);
    
    // Create new band distribution based on the count
    const minFreq = 20;
    const maxFreq = 20000;
    
    // Calculate frequencies logarithmically
    const bands: EQBand[] = [];
    for (let i = 0; i < count; i++) {
      const factor = i / (count - 1);
      // Logarithmic distribution (sounds more natural)
      const frequency = Math.round(minFreq * Math.pow(maxFreq / minFreq, factor));
      
      // Check if we have an existing band close to this frequency
      const existingBand = eqBands.find(b => 
        Math.abs(Math.log(b.frequency) - Math.log(frequency)) < 0.1
      );
      
      if (existingBand) {
        bands.push({...existingBand, id: i + 1});
      } else {
        bands.push({
          id: i + 1,
          frequency,
          gain: 0,
          q: 1.0,
          type: 'parametric',
          enabled: true
        });
      }
    }
    
    setEqBands(bands);
    setSelectedBandId(1);
  };
  
  // Handle band parameter changes
  const updateBand = (bandId: number, updates: Partial<EQBand>) => {
    setEqBands(prevBands => 
      prevBands.map(band => 
        band.id === bandId ? { ...band, ...updates } : band
      )
    );
  };
  
  // Reset all bands to 0dB
  const resetEqualizer = () => {
    setEqBands(prevBands => 
      prevBands.map(band => ({ ...band, gain: 0 }))
    );
  };
  
  // Toggle playback
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };
  
  // Load a preset
  const loadPreset = (presetId: string) => {
    // In a real app, these would be actual EQ settings
    // For now, we'll just demonstrate with some simple presets
    switch (presetId) {
      case 'flat':
        setEqBands(prevBands => prevBands.map(band => ({ ...band, gain: 0 })));
        break;
      case 'bass':
        setEqBands(prevBands => 
          prevBands.map(band => ({ 
            ...band, 
            gain: band.frequency < 250 ? 6 : band.frequency < 500 ? 3 : 0 
          }))
        );
        break;
      case 'treble':
        setEqBands(prevBands => 
          prevBands.map(band => ({ 
            ...band, 
            gain: band.frequency > 2000 ? 4 : 0 
          }))
        );
        break;
      case 'vocal':
        setEqBands(prevBands => 
          prevBands.map(band => ({ 
            ...band, 
            gain: (band.frequency > 400 && band.frequency < 2000) ? 3 : 0 
          }))
        );
        break;
      case 'loudness':
        setEqBands(prevBands => 
          prevBands.map(band => ({ 
            ...band, 
            gain: (band.frequency < 150 || band.frequency > 6000) ? 5 : 0 
          }))
        );
        break;
      default:
        // Other presets would be implemented similarly
        break;
    }
  };
  
  // Update filter settings
  const updateFilter = (
    filterType: 'highPass' | 'lowPass' | 'notch', 
    property: string, 
    value: number | boolean
  ) => {
    setFilters(prev => {
      const updated = { ...prev };
      // Type assertion to avoid TypeScript error
      (updated[filterType] as any)[property] = value;
      return updated;
    });
  };
  
  // Add a band (only possible in parametric mode)
  const addBand = () => {
    if (eqMode !== 'parametric' || eqBands.length >= 30) return;
    
    // Find a good default frequency in the middle of the largest gap
    const sortedBands = [...eqBands].sort((a, b) => a.frequency - b.frequency);
    let largestGap = 0;
    let gapCenter = 1000; // Default if no gap is found
    
    for (let i = 0; i < sortedBands.length - 1; i++) {
      const gap = Math.log(sortedBands[i + 1].frequency) - Math.log(sortedBands[i].frequency);
      if (gap > largestGap) {
        largestGap = gap;
        gapCenter = Math.exp(
          (Math.log(sortedBands[i].frequency) + Math.log(sortedBands[i + 1].frequency)) / 2
        );
      }
    }
    
    const newBand: EQBand = {
      id: Math.max(...eqBands.map(b => b.id)) + 1,
      frequency: Math.round(gapCenter),
      gain: 0,
      q: 1.0,
      type: 'parametric',
      enabled: true
    };
    
    setEqBands([...eqBands, newBand]);
    setSelectedBandId(newBand.id);
  };
  
  // Remove the selected band (only in parametric mode)
  const removeSelectedBand = () => {
    if (eqMode !== 'parametric' || !selectedBandId || eqBands.length <= 3) return;
    
    const newBands = eqBands.filter(band => band.id !== selectedBandId);
    setEqBands(newBands);
    setSelectedBandId(newBands[0].id);
  };
  
  // Convert a band type to a human-readable label
  const getBandTypeLabel = (type: EQBand['type']) => {
    switch (type) {
      case 'parametric': return 'Parametric';
      case 'low-shelf': return 'Low Shelf';
      case 'high-shelf': return 'High Shelf';
      case 'low-pass': return 'Low Pass';
      case 'high-pass': return 'High Pass';
      case 'notch': return 'Notch';
      case 'dynamic': return 'Dynamic EQ';
    }
  };
  
  // Draw the EQ curve on the canvas
  useEffect(() => {
    if (!canvasRef.current || !equalizerEnabled) return;
    
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
    const padding = 20;
    const graphWidth = width - 2 * padding;
    const graphHeight = height - 2 * padding;
    
    // Draw grid
    if (showGridLines) {
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 0.5;
      
      // Horizontal grid lines (gain)
      const dbStep = 3; // 3dB steps
      const dbRange = 24; // ±24 dB
      const pixelsPerDb = graphHeight / (2 * dbRange);
      
      for (let db = -dbRange; db <= dbRange; db += dbStep) {
        if (db === 0) continue; // We'll draw the 0dB line separately
        
        const y = padding + graphHeight / 2 - db * pixelsPerDb;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(padding + graphWidth, y);
        ctx.stroke();
        
        // Label
        ctx.fillStyle = '#666';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`${db > 0 ? '+' : ''}${db}`, padding - 5, y + 3);
      }
      
      // Vertical grid lines (frequency)
      const frequencies = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
      const minFrequency = 20;
      const maxFrequency = 20000;
      
      frequencies.forEach(freq => {
        const normFreq = Math.log(freq / minFrequency) / Math.log(maxFrequency / minFrequency);
        const x = padding + normFreq * graphWidth;
        
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, padding + graphHeight);
        ctx.stroke();
        
        // Label
        ctx.fillStyle = '#666';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(freq >= 1000 ? `${freq/1000}k` : `${freq}`, x, height - 5);
      });
    }
    
    // Draw 0dB line
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    const zeroDbY = padding + graphHeight / 2;
    ctx.beginPath();
    ctx.moveTo(padding, zeroDbY);
    ctx.lineTo(padding + graphWidth, zeroDbY);
    ctx.stroke();
    
    // Draw the EQ curve
    ctx.strokeStyle = '#4d7fe4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    // Calculate response at each point
    const pixelsPerDb = graphHeight / 48; // ±24 dB range
    const points = 200; // Number of points to evaluate
    const minFreq = 20;
    const maxFreq = 20000;
    
    for (let i = 0; i < points; i++) {
      const normX = i / (points - 1);
      const freq = minFreq * Math.pow(maxFreq / minFreq, normX);
      const x = padding + normX * graphWidth;
      
      // Calculate combined response from all enabled bands
      let dbResponse = 0;
      
      // Add response from equalizer bands
      eqBands.forEach(band => {
        if (!band.enabled) return;
        
        let bandResponse = 0;
        const f0 = band.frequency;
        const gain = band.gain;
        
        if (band.type === 'parametric') {
          // Simplified parametric EQ formula
          const Q = band.q;
          const w0 = freq / f0;
          const numerator = 1 + Math.pow(w0, 2) / Q;
          const denominator = Math.pow(1 - Math.pow(w0, 2), 2) + Math.pow(w0, 2) / Q;
          const response = 1 + (numerator / denominator) * gain / 15;
          bandResponse = Math.log10(response) * 20; // Convert to dB
        } else if (band.type === 'low-shelf') {
          // Simplified low shelf response
          const shelf = 1 / (1 + Math.pow(freq / f0, 4));
          bandResponse = gain * shelf;
        } else if (band.type === 'high-shelf') {
          // Simplified high shelf response
          const shelf = 1 / (1 + Math.pow(f0 / freq, 4));
          bandResponse = gain * shelf;
        } else if (band.type === 'low-pass') {
          // Simplified low pass response
          const cutoff = 1 / (1 + Math.pow(freq / f0, 4));
          bandResponse = -24 * (1 - cutoff);
        } else if (band.type === 'high-pass') {
          // Simplified high pass response
          const cutoff = 1 / (1 + Math.pow(f0 / freq, 4));
          bandResponse = -24 * (1 - cutoff);
        } else if (band.type === 'notch') {
          // Simplified notch filter response
          const Q = band.q;
          const w0 = freq / f0;
          const notchResponse = 1 - 1 / (1 + Math.pow((w0 - 1) * Q, 2));
          bandResponse = -30 * (1 - notchResponse);
        }
        
        dbResponse += bandResponse;
      });
      
      // Add response from additional filters
      if (filters.highPass.enabled) {
        const f0 = filters.highPass.frequency;
        const slope = filters.highPass.slope;
        const cutoff = 1 / (1 + Math.pow(f0 / freq, slope/6));
        dbResponse -= Math.max(0, (1 - cutoff) * 30);
      }
      
      if (filters.lowPass.enabled) {
        const f0 = filters.lowPass.frequency;
        const slope = filters.lowPass.slope;
        const cutoff = 1 / (1 + Math.pow(freq / f0, slope/6));
        dbResponse -= Math.max(0, (1 - cutoff) * 30);
      }
      
      if (filters.notch.enabled) {
        const f0 = filters.notch.frequency;
        const Q = filters.notch.q;
        const depth = filters.notch.depth;
        const w0 = freq / f0;
        const notchResponse = 1 - 1 / (1 + Math.pow((w0 - 1) * Q, 2));
        dbResponse -= (1 - notchResponse) * depth;
      }
      
      // Clamp response to the visible range
      dbResponse = Math.max(-24, Math.min(24, dbResponse));
      
      // Convert to y coordinate
      const y = padding + graphHeight / 2 - dbResponse * pixelsPerDb;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
    
    // Draw band markers on the curve
    eqBands.forEach(band => {
      if (!band.enabled) return;
      
      const normX = Math.log(band.frequency / 20) / Math.log(20000 / 20);
      const x = padding + normX * graphWidth;
      const y = padding + graphHeight / 2 - band.gain * pixelsPerDb;
      
      const isSelected = band.id === selectedBandId;
      
      // Band handle
      ctx.beginPath();
      ctx.arc(x, y, isSelected ? 8 : 6, 0, 2 * Math.PI);
      
      if (isSelected) {
        ctx.fillStyle = '#ffcc00';
      } else {
        ctx.fillStyle = getBandTypeColor(band.type);
      }
      
      ctx.fill();
      
      // Add border to handles
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      
      // Show frequency for selected band
      if (isSelected) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${formatFrequency(band.frequency)}`, x, y - 12);
      }
    });
    
  }, [eqBands, filters, equalizerEnabled, selectedBandId, showGridLines]);
  
  // Get color for band type
  const getBandTypeColor = (type: EQBand['type']) => {
    switch (type) {
      case 'parametric': return '#4d7fe4';  // Blue
      case 'low-shelf': return '#f1b211';   // Yellow
      case 'high-shelf': return '#f1b211';  // Yellow
      case 'low-pass': return '#e44d8a';    // Pink
      case 'high-pass': return '#e44d8a';   // Pink
      case 'notch': return '#e44d4d';       // Red
      case 'dynamic': return '#9d4de4';     // Purple
    }
  };
  
  // Format frequency for display (e.g., 1000 → "1 kHz")
  const formatFrequency = (freq: number) => {
    if (freq >= 1000) {
      return `${(freq / 1000).toFixed(freq >= 10000 ? 0 : 1)} kHz`;
    }
    return `${freq} Hz`;
  };
  
  // Handle canvas interaction - for future implementation
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !equalizerEnabled) return;
    
    // This would select the closest band to the click point
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert x position to frequency
    const padding = 20;
    const graphWidth = canvas.offsetWidth - 2 * padding;
    const normX = (x - padding) / graphWidth;
    const minFreq = 20;
    const maxFreq = 20000;
    const freq = minFreq * Math.pow(maxFreq / minFreq, normX);
    
    // Find closest band
    let closestBand = eqBands[0];
    let minDist = Number.MAX_VALUE;
    
    eqBands.forEach(band => {
      // Use logarithmic distance for frequencies
      const dist = Math.abs(Math.log(band.frequency) - Math.log(freq));
      if (dist < minDist) {
        minDist = dist;
        closestBand = band;
      }
    });
    
    setSelectedBandId(closestBand.id);
  };
  
  return (
    <div className="space-y-4">
      {/* Master Controls */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg text-violet-500 flex items-center">
              <Sliders className="h-5 w-5 mr-2" />
              Equalizer & Filtering
            </CardTitle>
            <div className="flex items-center">
              <Label htmlFor="equalizer-enabled" className="mr-2 text-sm text-gray-400">
                {equalizerEnabled ? 'Enabled' : 'Bypassed'}
              </Label>
              <Switch
                id="equalizer-enabled"
                checked={equalizerEnabled}
                onCheckedChange={setEqualizerEnabled}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Response Visualization */}
            <div className={`h-64 relative rounded-lg border border-gray-800 ${!equalizerEnabled && 'opacity-50'}`}>
              <canvas 
                ref={canvasRef} 
                className="w-full h-full" 
                onClick={handleCanvasClick}
              />
              
              {/* Overlay when disabled */}
              {!equalizerEnabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px] rounded-lg">
                  <div className="px-3 py-1.5 bg-gray-800 rounded-md text-sm font-medium">
                    Equalizer Bypassed
                  </div>
                </div>
              )}
            </div>
            
            {/* EQ Controls */}
            <div className="flex flex-wrap gap-2 justify-between items-center">
              <div className="flex items-center space-x-2">
                <Button
                  variant={eqMode === 'parametric' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEqMode('parametric')}
                  disabled={!equalizerEnabled}
                >
                  Parametric
                </Button>
                <Button
                  variant={eqMode === 'graphic' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEqMode('graphic')}
                  disabled={!equalizerEnabled}
                >
                  Graphic
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Label className="text-sm text-gray-400">Bands:</Label>
                <Select 
                  value={numBands.toString()} 
                  onValueChange={(value) => handleBandCountChange(parseInt(value))}
                  disabled={!equalizerEnabled}
                >
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="7">7</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="15">15</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="30">30</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={resetEqualizer}
                        disabled={!equalizerEnabled}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Reset to Flat (0dB)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={!equalizerEnabled}
                    >
                      Presets
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-900 text-gray-100">
                    <DialogHeader>
                      <DialogTitle>Equalizer Presets</DialogTitle>
                      <DialogDescription className="text-gray-400">
                        Select a preset or save your current settings
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid grid-cols-2 gap-2 py-4">
                      {EQ_PRESETS.map(preset => (
                        <Button
                          key={preset.id}
                          variant="outline"
                          size="sm"
                          className="justify-start px-3 h-auto py-2"
                          onClick={() => {
                            loadPreset(preset.id);
                          }}
                        >
                          <div className="text-left">
                            <div className="font-medium">{preset.name}</div>
                            <div className="text-xs text-gray-400">{preset.description}</div>
                          </div>
                        </Button>
                      ))}
                    </div>
                    
                    <DialogFooter className="flex justify-between">
                      <Button variant="outline" size="sm">
                        <Save className="h-4 w-4 mr-2" />
                        Save Current
                      </Button>
                      <Button variant="default" size="sm">
                        Done
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                {eqMode === 'parametric' && (
                  <div className="flex items-center space-x-1">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={addBand}
                      disabled={!equalizerEnabled || eqBands.length >= 30}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={removeSelectedBand}
                      disabled={!equalizerEnabled || !selectedBandId || eqBands.length <= 3}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={togglePlayback}
                  disabled={!equalizerEnabled}
                >
                  {isPlaying ? (
                    <>
                      <StopCircle className="h-4 w-4 mr-1" />
                      Stop
                    </>
                  ) : (
                    <>
                      <PlayCircle className="h-4 w-4 mr-1" />
                      Preview
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Band Controls (left panel) */}
        <Card className={`bg-gray-900 border-gray-800 lg:col-span-1 ${!equalizerEnabled && 'opacity-70'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-violet-500 flex items-center">
              <Gauge className="h-4 w-4 mr-2" />
              {eqMode === 'parametric' ? 'Band Controls' : 'Graphic EQ'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {eqMode === 'parametric' && selectedBand ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div 
                      className="h-3 w-3 rounded-full mr-2" 
                      style={{ backgroundColor: getBandTypeColor(selectedBand.type) }}
                    ></div>
                    <span className="text-sm font-medium">Band {selectedBand.id}</span>
                  </div>
                  <div className="flex items-center">
                    <Label htmlFor="band-enabled" className="mr-2 text-xs text-gray-400">
                      {selectedBand.enabled ? 'Enabled' : 'Bypassed'}
                    </Label>
                    <Switch
                      id="band-enabled"
                      checked={selectedBand.enabled}
                      onCheckedChange={(checked) => updateBand(selectedBand.id, { enabled: checked })}
                      disabled={!equalizerEnabled}
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm text-gray-300 mb-1 block">Band Type</Label>
                  <Select
                    value={selectedBand.type}
                    onValueChange={(value: EQBand['type']) => updateBand(selectedBand.id, { type: value })}
                    disabled={!equalizerEnabled || !selectedBand.enabled}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parametric">Parametric EQ</SelectItem>
                      <SelectItem value="low-shelf">Low Shelf</SelectItem>
                      <SelectItem value="high-shelf">High Shelf</SelectItem>
                      <SelectItem value="low-pass">Low Pass</SelectItem>
                      <SelectItem value="high-pass">High Pass</SelectItem>
                      <SelectItem value="notch">Notch</SelectItem>
                      <SelectItem value="dynamic">Dynamic EQ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Frequency</span>
                    <span className="text-gray-400">{formatFrequency(selectedBand.frequency)}</span>
                  </div>
                  <Slider
                    value={[selectedBand.frequency]}
                    min={20}
                    max={20000}
                    step={1}
                    disabled={!equalizerEnabled || !selectedBand.enabled}
                    onValueChange={(value) => {
                      // Use logarithmic scale for better control
                      const freq = value[0];
                      updateBand(selectedBand.id, { frequency: freq });
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>20 Hz</span>
                    <span>1 kHz</span>
                    <span>20 kHz</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Gain</span>
                    <span className="text-gray-400">{selectedBand.gain > 0 ? '+' : ''}{selectedBand.gain} dB</span>
                  </div>
                  <Slider
                    value={[selectedBand.gain]}
                    min={-24}
                    max={24}
                    step={0.5}
                    disabled={!equalizerEnabled || !selectedBand.enabled || 
                              ['low-pass', 'high-pass', 'notch'].includes(selectedBand.type)}
                    onValueChange={(value) => updateBand(selectedBand.id, { gain: value[0] })}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>-24 dB</span>
                    <span>0 dB</span>
                    <span>+24 dB</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Q / Bandwidth</span>
                    <span className="text-gray-400">{selectedBand.q.toFixed(1)}</span>
                  </div>
                  <Slider
                    value={[selectedBand.q]}
                    min={0.1}
                    max={10}
                    step={0.1}
                    disabled={!equalizerEnabled || !selectedBand.enabled}
                    onValueChange={(value) => updateBand(selectedBand.id, { q: value[0] })}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Wide</span>
                    <span>Medium</span>
                    <span>Narrow</span>
                  </div>
                </div>
                
                {/* Dynamic EQ Controls */}
                {selectedBand.type === 'dynamic' && (
                  <div className="space-y-4 border-t border-gray-800 pt-4 mt-4">
                    <h4 className="text-sm font-medium text-violet-400">Dynamic EQ Parameters</h4>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">Threshold</span>
                        <span className="text-gray-400">
                          {selectedBand.threshold || -18} dB
                        </span>
                      </div>
                      <Slider
                        value={[selectedBand.threshold || -18]}
                        min={-60}
                        max={0}
                        step={1}
                        disabled={!equalizerEnabled || !selectedBand.enabled}
                        onValueChange={(value) => updateBand(selectedBand.id, { threshold: value[0] })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">Ratio</span>
                        <span className="text-gray-400">
                          {selectedBand.ratio || 2}:1
                        </span>
                      </div>
                      <Slider
                        value={[selectedBand.ratio || 2]}
                        min={1}
                        max={20}
                        step={0.1}
                        disabled={!equalizerEnabled || !selectedBand.enabled}
                        onValueChange={(value) => updateBand(selectedBand.id, { ratio: value[0] })}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-400">Attack</Label>
                        <Slider
                          value={[selectedBand.attack || 20]}
                          min={0.1}
                          max={200}
                          step={0.1}
                          disabled={!equalizerEnabled || !selectedBand.enabled}
                          onValueChange={(value) => updateBand(selectedBand.id, { attack: value[0] })}
                        />
                        <div className="text-right text-xs text-gray-500">
                          {selectedBand.attack || 20} ms
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-400">Release</Label>
                        <Slider
                          value={[selectedBand.release || 150]}
                          min={5}
                          max={1000}
                          step={1}
                          disabled={!equalizerEnabled || !selectedBand.enabled}
                          onValueChange={(value) => updateBand(selectedBand.id, { release: value[0] })}
                        />
                        <div className="text-right text-xs text-gray-500">
                          {selectedBand.release || 150} ms
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : eqMode === 'graphic' ? (
              // Graphic EQ sliders
              <div className="flex items-end justify-between h-64">
                {eqBands.map(band => (
                  <div key={band.id} className="flex flex-col items-center w-full">
                    <div className="text-xs text-gray-500 mb-1 truncate w-full text-center">
                      {formatFrequency(band.frequency)}
                    </div>
                    <div className="flex-1 w-full flex flex-col items-center justify-center">
                      <div className="h-full w-8 relative flex items-center justify-center">
                        <div className="absolute h-full w-px bg-gray-800 left-1/2 transform -translate-x-1/2"></div>
                        <Slider
                          value={[band.gain]}
                          min={-24}
                          max={24}
                          step={0.5}
                          orientation="vertical"
                          disabled={!equalizerEnabled}
                          onValueChange={(value) => updateBand(band.id, { gain: value[0] })}
                          className="h-full flex-1"
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1 w-full text-center font-semibold">
                        {band.gain > 0 ? '+' : ''}{band.gain}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-gray-500">
                No band selected
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Additional Filters (middle panel) */}
        <Card className={`bg-gray-900 border-gray-800 ${!equalizerEnabled && 'opacity-70'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-violet-500 flex items-center">
              <ListFilter className="h-4 w-4 mr-2" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {/* High-pass Filter */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-gray-300">High-Pass Filter</h3>
                  <Switch
                    checked={filters.highPass.enabled && equalizerEnabled}
                    onCheckedChange={(checked) => updateFilter('highPass', 'enabled', checked)}
                    disabled={!equalizerEnabled}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Cutoff Frequency</span>
                    <span className="text-gray-400">{formatFrequency(filters.highPass.frequency)}</span>
                  </div>
                  <Slider
                    value={[filters.highPass.frequency]}
                    min={20}
                    max={1000}
                    step={1}
                    disabled={!equalizerEnabled || !filters.highPass.enabled}
                    onValueChange={(value) => updateFilter('highPass', 'frequency', value[0])}
                  />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <Label className="text-gray-400">Slope</Label>
                        <span className="text-gray-500">{filters.highPass.slope} dB/oct</span>
                      </div>
                      <Select
                        value={filters.highPass.slope.toString()}
                        onValueChange={(value) => updateFilter('highPass', 'slope', parseInt(value))}
                        disabled={!equalizerEnabled || !filters.highPass.enabled}
                      >
                        <SelectTrigger className="h-8 bg-gray-800 border-gray-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6">6 dB/oct</SelectItem>
                          <SelectItem value="12">12 dB/oct</SelectItem>
                          <SelectItem value="18">18 dB/oct</SelectItem>
                          <SelectItem value="24">24 dB/oct</SelectItem>
                          <SelectItem value="36">36 dB/oct</SelectItem>
                          <SelectItem value="48">48 dB/oct</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <Label className="text-gray-400">Q Factor</Label>
                        <span className="text-gray-500">{filters.highPass.q.toFixed(2)}</span>
                      </div>
                      <Slider
                        value={[filters.highPass.q]}
                        min={0.1}
                        max={2.0}
                        step={0.01}
                        disabled={!equalizerEnabled || !filters.highPass.enabled}
                        onValueChange={(value) => updateFilter('highPass', 'q', value[0])}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Low-pass Filter */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-gray-300">Low-Pass Filter</h3>
                  <Switch
                    checked={filters.lowPass.enabled && equalizerEnabled}
                    onCheckedChange={(checked) => updateFilter('lowPass', 'enabled', checked)}
                    disabled={!equalizerEnabled}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Cutoff Frequency</span>
                    <span className="text-gray-400">{formatFrequency(filters.lowPass.frequency)}</span>
                  </div>
                  <Slider
                    value={[filters.lowPass.frequency]}
                    min={1000}
                    max={20000}
                    step={100}
                    disabled={!equalizerEnabled || !filters.lowPass.enabled}
                    onValueChange={(value) => updateFilter('lowPass', 'frequency', value[0])}
                  />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <Label className="text-gray-400">Slope</Label>
                        <span className="text-gray-500">{filters.lowPass.slope} dB/oct</span>
                      </div>
                      <Select
                        value={filters.lowPass.slope.toString()}
                        onValueChange={(value) => updateFilter('lowPass', 'slope', parseInt(value))}
                        disabled={!equalizerEnabled || !filters.lowPass.enabled}
                      >
                        <SelectTrigger className="h-8 bg-gray-800 border-gray-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6">6 dB/oct</SelectItem>
                          <SelectItem value="12">12 dB/oct</SelectItem>
                          <SelectItem value="18">18 dB/oct</SelectItem>
                          <SelectItem value="24">24 dB/oct</SelectItem>
                          <SelectItem value="36">36 dB/oct</SelectItem>
                          <SelectItem value="48">48 dB/oct</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <Label className="text-gray-400">Q Factor</Label>
                        <span className="text-gray-500">{filters.lowPass.q.toFixed(2)}</span>
                      </div>
                      <Slider
                        value={[filters.lowPass.q]}
                        min={0.1}
                        max={2.0}
                        step={0.01}
                        disabled={!equalizerEnabled || !filters.lowPass.enabled}
                        onValueChange={(value) => updateFilter('lowPass', 'q', value[0])}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Notch Filter */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-gray-300">Notch Filter</h3>
                  <Switch
                    checked={filters.notch.enabled && equalizerEnabled}
                    onCheckedChange={(checked) => updateFilter('notch', 'enabled', checked)}
                    disabled={!equalizerEnabled}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Target Frequency</span>
                    <span className="text-gray-400">{formatFrequency(filters.notch.frequency)}</span>
                  </div>
                  <Slider
                    value={[filters.notch.frequency]}
                    min={20}
                    max={20000}
                    step={1}
                    disabled={!equalizerEnabled || !filters.notch.enabled}
                    onValueChange={(value) => updateFilter('notch', 'frequency', value[0])}
                  />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <Label className="text-gray-400">Width (Q)</Label>
                        <span className="text-gray-500">{filters.notch.q.toFixed(1)}</span>
                      </div>
                      <Slider
                        value={[filters.notch.q]}
                        min={0.1}
                        max={100}
                        step={0.1}
                        disabled={!equalizerEnabled || !filters.notch.enabled}
                        onValueChange={(value) => updateFilter('notch', 'q', value[0])}
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <Label className="text-gray-400">Depth</Label>
                        <span className="text-gray-500">-{filters.notch.depth} dB</span>
                      </div>
                      <Slider
                        value={[filters.notch.depth]}
                        min={1}
                        max={96}
                        step={1}
                        disabled={!equalizerEnabled || !filters.notch.enabled}
                        onValueChange={(value) => updateFilter('notch', 'depth', value[0])}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-1 mt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      updateFilter('notch', 'frequency', 50);
                      updateFilter('notch', 'q', 30);
                      updateFilter('notch', 'enabled', true);
                    }}
                    disabled={!equalizerEnabled}
                  >
                    50 Hz Hum
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      updateFilter('notch', 'frequency', 60);
                      updateFilter('notch', 'q', 30);
                      updateFilter('notch', 'enabled', true);
                    }}
                    disabled={!equalizerEnabled}
                  >
                    60 Hz Hum
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      updateFilter('notch', 'frequency', 1000);
                      updateFilter('notch', 'q', 30);
                      updateFilter('notch', 'enabled', true);
                    }}
                    disabled={!equalizerEnabled}
                  >
                    Whistle
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Dynamic EQ (right panel) */}
        <Card className={`bg-gray-900 border-gray-800 ${!equalizerEnabled && 'opacity-70'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-violet-500 flex items-center">
              <BarChart4 className="h-4 w-4 mr-2" />
              Dynamic EQ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-violet-900/20 p-3 rounded-md text-sm border border-violet-800">
                <p className="text-violet-300">
                  Dynamic EQ automatically adjusts frequency response based on input levels.
                  Add bands with dynamic processing by changing a band's type to "Dynamic EQ".
                </p>
              </div>
              
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-gray-300">Dynamic Bands</h3>
                {eqBands.filter(band => band.type === 'dynamic').length === 0 ? (
                  <div className="p-4 border border-gray-800 rounded-md flex flex-col items-center justify-center">
                    <Moon className="h-6 w-6 text-gray-600 mb-2" />
                    <p className="text-gray-500 text-sm text-center">
                      No dynamic bands have been added.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        if (selectedBandId) {
                          updateBand(selectedBandId, { type: 'dynamic', threshold: -18, ratio: 2, attack: 20, release: 150 });
                        }
                      }}
                      disabled={!equalizerEnabled || !selectedBandId}
                    >
                      Convert Selected to Dynamic
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {eqBands
                      .filter(band => band.type === 'dynamic')
                      .map(band => (
                        <div 
                          key={band.id}
                          className={`flex items-center justify-between p-2 rounded-md border border-gray-800 ${band.id === selectedBandId ? 'bg-gray-800' : ''}`}
                          onClick={() => setSelectedBandId(band.id)}
                        >
                          <div className="flex items-center">
                            <div className="h-3 w-3 rounded-full mr-2 bg-violet-500"></div>
                            <div>
                              <div className="text-sm font-medium">{formatFrequency(band.frequency)}</div>
                              <div className="text-xs text-gray-500">
                                Threshold: {band.threshold || -18}dB, Ratio: {band.ratio || 2}:1
                              </div>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {band.gain > 0 ? '+' : ''}{band.gain} dB
                          </Badge>
                        </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="border-t border-gray-800 pt-4">
                <h3 className="text-sm font-medium text-gray-300 mb-2">Common Applications</h3>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start h-auto py-2"
                    onClick={() => {
                      // De-esser preset
                      const deEsserBand = eqBands.find(b => b.frequency > 5000 && b.frequency < 9000) ||
                                          eqBands.find(b => b.id === 8 || b.id === 9);
                      
                      if (deEsserBand) {
                        updateBand(deEsserBand.id, { 
                          type: 'dynamic', 
                          frequency: 7500, 
                          gain: -10, 
                          q: 3, 
                          threshold: -20, 
                          ratio: 4,
                          attack: 1,
                          release: 80
                        });
                        setSelectedBandId(deEsserBand.id);
                      }
                    }}
                    disabled={!equalizerEnabled}
                  >
                    <div className="text-left">
                      <div className="font-medium">De-esser (sibilance control)</div>
                      <div className="text-xs text-gray-400">Reduces harsh S and T sounds</div>
                    </div>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start h-auto py-2"
                    onClick={() => {
                      // Plosive remover preset
                      const plosiveBand = eqBands.find(b => b.frequency < 120) ||
                                          eqBands.find(b => b.id === 1);
                      
                      if (plosiveBand) {
                        updateBand(plosiveBand.id, { 
                          type: 'dynamic', 
                          frequency: 80, 
                          gain: -12, 
                          q: 2, 
                          threshold: -15, 
                          ratio: 5,
                          attack: 0.5,
                          release: 50
                        });
                        setSelectedBandId(plosiveBand.id);
                      }
                    }}
                    disabled={!equalizerEnabled}
                  >
                    <div className="text-left">
                      <div className="font-medium">Plosive Controller</div>
                      <div className="text-xs text-gray-400">Reduces P and B popping sounds</div>
                    </div>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start h-auto py-2"
                    onClick={() => {
                      // Bass enhancer preset
                      const bassBand = eqBands.find(b => b.frequency > 80 && b.frequency < 150) ||
                                       eqBands.find(b => b.id === 2 || b.id === 3);
                      
                      if (bassBand) {
                        updateBand(bassBand.id, { 
                          type: 'dynamic', 
                          frequency: 120, 
                          gain: 6, 
                          q: 1.2, 
                          threshold: -30, 
                          ratio: 1.5,
                          attack: 15,
                          release: 150
                        });
                        setSelectedBandId(bassBand.id);
                      }
                    }}
                    disabled={!equalizerEnabled}
                  >
                    <div className="text-left">
                      <div className="font-medium">Dynamic Bass Enhancer</div>
                      <div className="text-xs text-gray-400">Adds warmth without muddiness</div>
                    </div>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EqualizerSection;
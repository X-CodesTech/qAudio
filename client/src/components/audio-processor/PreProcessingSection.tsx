import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  LayoutGrid, 
  Scissors, 
  Waves as WaveSine, // Using Waves icon for Hum Filter
  RefreshCw,
  Waves,
  EyeOff,
  Activity,
  Gauge,
  Check,
  Undo2,
  Volume2,
  Radio,
  PlayCircle,
  StopCircle
} from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PreProcessingSectionProps {
  onSave?: () => void;
}

const PreProcessingSection: React.FC<PreProcessingSectionProps> = ({ onSave }) => {
  // State for pre-processing tools
  const [preProcessingEnabled, setPreProcessingEnabled] = useState(true);
  
  // Declipper settings
  const [declipperEnabled, setDeclipperEnabled] = useState(true);
  const [declipperThreshold, setDeclipperThreshold] = useState(0.95);
  const [declipperAlgorithm, setDeclipperAlgorithm] = useState('standard');
  
  // Noise Reduction settings
  const [noiseReductionEnabled, setNoiseReductionEnabled] = useState(true);
  const [noiseProfile, setNoiseProfile] = useState('auto');
  const [noiseReductionAmount, setNoiseReductionAmount] = useState(12);
  const [noiseReductionAttack, setNoiseReductionAttack] = useState(5);
  const [noiseReductionRelease, setNoiseReductionRelease] = useState(20);
  
  // Hum Filter settings
  const [humFilterEnabled, setHumFilterEnabled] = useState(true);
  const [humFrequency, setHumFrequency] = useState(50); // 50Hz or 60Hz
  const [humFilterDepth, setHumFilterDepth] = useState(48);
  const [harmonicsFiltered, setHarmonicsFiltered] = useState(4);
  
  // Phase Correction settings
  const [phaseCorrectionEnabled, setPhaseCorrectionEnabled] = useState(true);
  const [phaseCorrectionAmount, setPhaseCorrectionAmount] = useState(80);
  const [autoCorrectPhase, setAutoCorrectPhase] = useState(true);
  const [lowFrequencyProtection, setLowFrequencyProtection] = useState(true);
  
  // Preview audio state
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Toggle preview playback
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };
  
  return (
    <div className="space-y-4">
      {/* Master Enable Switch */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg text-indigo-500 flex items-center">
              <LayoutGrid className="h-5 w-5 mr-2" />
              Pre-Processing Tools
            </CardTitle>
            <div className="flex items-center">
              <Label htmlFor="pre-processing-enabled" className="mr-2 text-sm text-gray-400">
                {preProcessingEnabled ? 'Enabled' : 'Bypassed'}
              </Label>
              <Switch
                id="pre-processing-enabled"
                checked={preProcessingEnabled}
                onCheckedChange={setPreProcessingEnabled}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-indigo-900/20 p-3 rounded-md text-sm border border-indigo-800">
            <div className="flex items-start">
              <Activity className="h-5 w-5 text-indigo-400 mr-2 mt-0.5" />
              <p className="text-indigo-300">
                Pre-processing tools help fix common audio problems before applying further processing.
                Enable each tool as needed or use the master switch to bypass all pre-processing.
              </p>
            </div>
          </div>
          
          {/* Preview Controls */}
          <div className="mt-4 mb-4 flex items-center justify-between">
            <div className="text-sm text-gray-300 flex items-center">
              <Gauge className="h-4 w-4 mr-1 text-indigo-400" />
              <span>Pre-Processing:</span>
              <span className="ml-1 text-indigo-400">-3.2 dB gain reduction</span>
            </div>
            <div className="flex items-center">
              <Button
                variant="outline"
                size="sm"
                className="h-8 mr-2"
                onClick={togglePlayback}
              >
                {isPlaying ? (
                  <>
                    <StopCircle className="h-4 w-4 mr-1 text-red-400" />
                    Stop
                  </>
                ) : (
                  <>
                    <PlayCircle className="h-4 w-4 mr-1 text-green-400" />
                    Preview
                  </>
                )}
              </Button>
              <div className="flex space-x-1">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Undo2 className="h-4 w-4 text-gray-400" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Check className="h-4 w-4 text-gray-400" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Visualizer */}
          <div className="h-20 w-full bg-gray-800 rounded-md overflow-hidden mb-4">
            <div className="h-full w-full p-2 flex items-center justify-center">
              <div className="flex-1 h-full flex items-center">
                {/* Before waveform */}
                <div className="h-full flex-1 flex items-center justify-center">
                  <div className="w-full h-16 relative">
                    {Array.from({ length: 100 }).map((_, i) => {
                      // Simulate a waveform with clipping
                      let height = (Math.sin(i / 5) * 0.5 + Math.sin(i / 3) * 0.3) * 100;
                      if (Math.abs(height) > 70) height = Math.sign(height) * 100; // Simulate clipping
                      const h = Math.abs(height);
                      return (
                        <div
                          key={`before-${i}`}
                          className="absolute bg-red-500"
                          style={{
                            height: `${Math.min(100, h)}%`,
                            width: '1px',
                            left: `${i}%`,
                            bottom: height < 0 ? '50%' : 'auto',
                            top: height >= 0 ? '50%' : 'auto',
                            transform: height < 0 ? 'scaleY(-1)' : 'scaleY(1)',
                            opacity: h > 70 ? 1 : 0.7
                          }}
                        />
                      );
                    })}
                    <div className="absolute top-0 left-2 text-xs text-gray-500">Before</div>
                  </div>
                </div>
                
                {/* Divider */}
                <div className="w-px h-full bg-gray-700 mx-2"></div>
                
                {/* After waveform */}
                <div className="h-full flex-1 flex items-center justify-center">
                  <div className="w-full h-16 relative">
                    {Array.from({ length: 100 }).map((_, i) => {
                      // Simulate a corrected waveform
                      let height = (Math.sin(i / 5) * 0.5 + Math.sin(i / 3) * 0.3) * 80;
                      const h = Math.abs(height);
                      return (
                        <div
                          key={`after-${i}`}
                          className="absolute bg-indigo-500"
                          style={{
                            height: `${h}%`,
                            width: '1px',
                            left: `${i}%`,
                            bottom: height < 0 ? '50%' : 'auto',
                            top: height >= 0 ? '50%' : 'auto',
                            transform: height < 0 ? 'scaleY(-1)' : 'scaleY(1)',
                            opacity: 0.7
                          }}
                        />
                      );
                    })}
                    <div className="absolute top-0 left-2 text-xs text-gray-500">After</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Declipper */}
        <Card className={`bg-gray-900 border-gray-800 ${!preProcessingEnabled && 'opacity-70'}`}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base text-red-500 flex items-center">
                <Scissors className="h-4 w-4 mr-2" />
                Declipper
              </CardTitle>
              <div className="flex items-center">
                <Switch
                  id="declipper-enabled"
                  checked={declipperEnabled && preProcessingEnabled}
                  onCheckedChange={setDeclipperEnabled}
                  disabled={!preProcessingEnabled}
                  className="ml-2"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-400 mb-3">
              Restores audio peaks that were clipped during recording or mastering
            </p>
            
            <div className="space-y-4" aria-disabled={!declipperEnabled || !preProcessingEnabled}>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Threshold</span>
                  <span className="text-gray-400">{(declipperThreshold * 100).toFixed(0)}%</span>
                </div>
                <Slider
                  value={[declipperThreshold * 100]}
                  min={50}
                  max={100}
                  step={1}
                  disabled={!declipperEnabled || !preProcessingEnabled}
                  onValueChange={(value) => setDeclipperThreshold(value[0] / 100)}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Lower (50%)</span>
                  <span>Higher (100%)</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <Label className="text-sm text-gray-300" htmlFor="declipper-algorithm">
                  Algorithm
                </Label>
                <Select
                  value={declipperAlgorithm}
                  onValueChange={setDeclipperAlgorithm}
                  disabled={!declipperEnabled || !preProcessingEnabled}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Select algorithm" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard (Fast)</SelectItem>
                    <SelectItem value="enhanced">Enhanced Recovery</SelectItem>
                    <SelectItem value="complex">Complex Interpolation</SelectItem>
                    <SelectItem value="neural">Neural Network</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-between bg-gray-800 p-2 rounded text-xs">
                <div className="flex items-center">
                  <span className="text-gray-400 mr-1">Clipped Samples:</span>
                  <span className="text-red-400 font-medium">1,248</span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-400 mr-1">Restored:</span>
                  <span className="text-green-400 font-medium">1,241</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Noise Reduction */}
        <Card className={`bg-gray-900 border-gray-800 ${!preProcessingEnabled && 'opacity-70'}`}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base text-blue-500 flex items-center">
                <EyeOff className="h-4 w-4 mr-2" />
                Noise Reduction
              </CardTitle>
              <div className="flex items-center">
                <Switch
                  id="noise-reduction-enabled"
                  checked={noiseReductionEnabled && preProcessingEnabled}
                  onCheckedChange={setNoiseReductionEnabled}
                  disabled={!preProcessingEnabled}
                  className="ml-2"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-400 mb-3">
              Removes background hum, hiss, and static while preserving audio quality
            </p>
            
            <div className="space-y-4" aria-disabled={!noiseReductionEnabled || !preProcessingEnabled}>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Reduction Amount</span>
                  <span className="text-gray-400">{noiseReductionAmount} dB</span>
                </div>
                <Slider
                  value={[noiseReductionAmount]}
                  min={0}
                  max={30}
                  step={1}
                  disabled={!noiseReductionEnabled || !preProcessingEnabled}
                  onValueChange={(value) => setNoiseReductionAmount(value[0])}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Subtle</span>
                  <span>Moderate</span>
                  <span>Aggressive</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-sm text-gray-300" htmlFor="noise-profile">
                    Noise Profile
                  </Label>
                  <Select
                    value={noiseProfile}
                    onValueChange={setNoiseProfile}
                    disabled={!noiseReductionEnabled || !preProcessingEnabled}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue placeholder="Select profile" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto Detect</SelectItem>
                      <SelectItem value="learn">Learn from Selection</SelectItem>
                      <SelectItem value="white">White Noise</SelectItem>
                      <SelectItem value="pink">Pink Noise</SelectItem>
                      <SelectItem value="brown">Brown Noise</SelectItem>
                      <SelectItem value="air">Air Conditioning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex mt-6">
                  <Button 
                    variant="outline"
                    size="sm"
                    className="bg-gray-800 border-gray-700 text-xs h-8"
                    disabled={!noiseReductionEnabled || !preProcessingEnabled || noiseProfile !== 'learn'}
                  >
                    Capture Noise Profile
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <Label className="text-gray-300" htmlFor="noise-attack">
                      Attack
                    </Label>
                    <span className="text-gray-400">{noiseReductionAttack} ms</span>
                  </div>
                  <Slider
                    id="noise-attack"
                    value={[noiseReductionAttack]}
                    min={0}
                    max={50}
                    step={1}
                    disabled={!noiseReductionEnabled || !preProcessingEnabled}
                    onValueChange={(value) => setNoiseReductionAttack(value[0])}
                  />
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <Label className="text-gray-300" htmlFor="noise-release">
                      Release
                    </Label>
                    <span className="text-gray-400">{noiseReductionRelease} ms</span>
                  </div>
                  <Slider
                    id="noise-release"
                    value={[noiseReductionRelease]}
                    min={0}
                    max={100}
                    step={1}
                    disabled={!noiseReductionEnabled || !preProcessingEnabled}
                    onValueChange={(value) => setNoiseReductionRelease(value[0])}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Hum Filter */}
        <Card className={`bg-gray-900 border-gray-800 ${!preProcessingEnabled && 'opacity-70'}`}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base text-yellow-500 flex items-center">
                <WaveSine className="h-4 w-4 mr-2" />
                Hum Filter
              </CardTitle>
              <div className="flex items-center">
                <Switch
                  id="hum-filter-enabled"
                  checked={humFilterEnabled && preProcessingEnabled}
                  onCheckedChange={setHumFilterEnabled}
                  disabled={!preProcessingEnabled}
                  className="ml-2"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-400 mb-3">
              Removes power line hum and its harmonics from the audio signal
            </p>
            
            <div className="space-y-4" aria-disabled={!humFilterEnabled || !preProcessingEnabled}>
              <div className="flex space-x-2">
                <Button
                  variant={humFrequency === 50 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setHumFrequency(50)}
                  disabled={!humFilterEnabled || !preProcessingEnabled}
                  className="flex-1"
                >
                  50 Hz (Europe/Asia)
                </Button>
                <Button
                  variant={humFrequency === 60 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setHumFrequency(60)}
                  disabled={!humFilterEnabled || !preProcessingEnabled}
                  className="flex-1"
                >
                  60 Hz (Americas)
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Filter Depth</span>
                  <span className="text-gray-400">-{humFilterDepth} dB</span>
                </div>
                <Slider
                  value={[humFilterDepth]}
                  min={12}
                  max={96}
                  step={6}
                  disabled={!humFilterEnabled || !preProcessingEnabled}
                  onValueChange={(value) => setHumFilterDepth(value[0])}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Light (-12dB)</span>
                  <span>Deep (-96dB)</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Harmonics</span>
                  <span className="text-gray-400">{harmonicsFiltered} harmonics</span>
                </div>
                <Slider
                  value={[harmonicsFiltered]}
                  min={1}
                  max={9}
                  step={1}
                  disabled={!humFilterEnabled || !preProcessingEnabled}
                  onValueChange={(value) => setHarmonicsFiltered(value[0])}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Fundamental only</span>
                  <span>All harmonics</span>
                </div>
              </div>
              
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 9 }).map((_, i) => {
                  const isActive = i < harmonicsFiltered && humFilterEnabled && preProcessingEnabled;
                  const frequency = humFrequency * (i + 1);
                  return (
                    <div 
                      key={`harmonic-${i}`} 
                      className={`flex flex-col items-center justify-center p-2 rounded bg-gray-800 ${!isActive && 'opacity-50'}`}
                    >
                      <span className="text-xs font-medium mb-1 text-yellow-400">{frequency} Hz</span>
                      <div className={`h-1 w-full rounded-full ${isActive ? 'bg-yellow-500' : 'bg-gray-700'}`}></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Phase Correction */}
        <Card className={`bg-gray-900 border-gray-800 ${!preProcessingEnabled && 'opacity-70'}`}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base text-green-500 flex items-center">
                <RefreshCw className="h-4 w-4 mr-2" />
                Phase Correction
              </CardTitle>
              <div className="flex items-center">
                <Switch
                  id="phase-correction-enabled"
                  checked={phaseCorrectionEnabled && preProcessingEnabled}
                  onCheckedChange={setPhaseCorrectionEnabled}
                  disabled={!preProcessingEnabled}
                  className="ml-2"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-400 mb-3">
              Fixes inverted or out-of-phase stereo issues for better mono compatibility
            </p>
            
            <div className="space-y-4" aria-disabled={!phaseCorrectionEnabled || !preProcessingEnabled}>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Correction Amount</span>
                  <span className="text-gray-400">{phaseCorrectionAmount}%</span>
                </div>
                <Slider
                  value={[phaseCorrectionAmount]}
                  min={0}
                  max={100}
                  step={5}
                  disabled={!phaseCorrectionEnabled || !preProcessingEnabled}
                  onValueChange={(value) => setPhaseCorrectionAmount(value[0])}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Subtle</span>
                  <span>Normal</span>
                  <span>Complete</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center justify-between bg-gray-800 p-2 rounded">
                  <Label htmlFor="auto-phase" className="text-sm text-gray-300 cursor-pointer">
                    Auto-correct severe phase issues
                  </Label>
                  <Switch
                    id="auto-phase"
                    checked={autoCorrectPhase && phaseCorrectionEnabled && preProcessingEnabled}
                    onCheckedChange={setAutoCorrectPhase}
                    disabled={!phaseCorrectionEnabled || !preProcessingEnabled}
                  />
                </div>
                
                <div className="flex items-center justify-between bg-gray-800 p-2 rounded">
                  <Label htmlFor="low-freq-protection" className="text-sm text-gray-300 cursor-pointer">
                    Protect low frequencies
                  </Label>
                  <Switch
                    id="low-freq-protection"
                    checked={lowFrequencyProtection && phaseCorrectionEnabled && preProcessingEnabled}
                    onCheckedChange={setLowFrequencyProtection}
                    disabled={!phaseCorrectionEnabled || !preProcessingEnabled}
                  />
                </div>
              </div>
              
              <div className="h-20 bg-gray-800 rounded-md overflow-hidden">
                {/* Phase correlation meter */}
                <div className="h-full w-full p-2 flex flex-col">
                  <div className="text-xs text-center text-gray-500 mb-2">Phase Correlation</div>
                  <div className="flex-1 relative">
                    <div className="absolute inset-x-0 h-px bg-gray-700 top-1/2"></div>
                    <div className="absolute inset-y-0 w-px bg-gray-700 left-1/2"></div>
                    
                    {/* Scale markers */}
                    <div className="absolute top-1/2 left-0 h-2 w-px bg-gray-600" style={{ transform: 'translateY(-50%)' }}></div>
                    <div className="absolute top-1/2 left-1/4 h-2 w-px bg-gray-600" style={{ transform: 'translateY(-50%)' }}></div>
                    <div className="absolute top-1/2 left-3/4 h-2 w-px bg-gray-600" style={{ transform: 'translateY(-50%)' }}></div>
                    <div className="absolute top-1/2 right-0 h-2 w-px bg-gray-600" style={{ transform: 'translateY(-50%)' }}></div>
                    
                    {/* Scale labels */}
                    <div className="absolute top-1/2 left-0 text-[9px] text-gray-500" style={{ transform: 'translate(-2px, 8px)' }}>-1</div>
                    <div className="absolute top-1/2 left-1/4 text-[9px] text-gray-500" style={{ transform: 'translate(-4px, 8px)' }}>-0.5</div>
                    <div className="absolute top-1/2 left-1/2 text-[9px] text-gray-500" style={{ transform: 'translate(-4px, 8px)' }}>0</div>
                    <div className="absolute top-1/2 left-3/4 text-[9px] text-gray-500" style={{ transform: 'translate(-4px, 8px)' }}>+0.5</div>
                    <div className="absolute top-1/2 right-0 text-[9px] text-gray-500" style={{ transform: 'translate(-8px, 8px)' }}>+1</div>
                    
                    {/* Indicator needle - at 0.75 position for good correlation */}
                    <div 
                      className="absolute top-1/2 h-full w-1 bg-green-500 transform -translate-y-1/2 rounded-full"
                      style={{ left: '87.5%', opacity: 0.8 }}
                    ></div>
                    
                    {/* Moving markers to show history */}
                    {Array.from({ length: 30 }).map((_, i) => {
                      // Random positions to simulate history with a bias toward good correlation
                      const position = 0.75 + (Math.random() * 0.3 - 0.1);
                      return (
                        <div
                          key={`phase-marker-${i}`}
                          className="absolute top-1/2 h-1 w-1 rounded-full transform -translate-y-1/2"
                          style={{ 
                            left: `${position * 100}%`, 
                            backgroundColor: position > 0.5 ? 'rgb(34, 197, 94)' : 
                                             position > 0 ? 'rgb(250, 204, 21)' : 'rgb(239, 68, 68)',
                            opacity: 0.5 - (i * 0.01)
                          }}
                        ></div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PreProcessingSection;
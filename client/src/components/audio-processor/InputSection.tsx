import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Radio, 
  Volume, 
  Mic, 
  AudioLines,
  Clock,
  Sliders,
  BarChart4,
  RefreshCw
} from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface InputSectionProps {
  onSave?: () => void;
}

const InputSection: React.FC<InputSectionProps> = ({ onSave }) => {
  // State for input settings
  const [inputFormat, setInputFormat] = useState('asio');
  const [inputDevice, setInputDevice] = useState('default');
  const [inputGain, setInputGain] = useState(0);
  const [outputGain, setOutputGain] = useState(0);
  const [channels, setChannels] = useState('stereo');
  const [sampleRate, setSampleRate] = useState('48000');
  const [bitDepth, setBitDepth] = useState('24');
  const [bufferSize, setBufferSize] = useState('512');
  const [latencyCompensation, setLatencyCompensation] = useState(0);
  const [enablePeakLimiter, setEnablePeakLimiter] = useState(true);
  const [monitorInput, setMonitorInput] = useState(false);
  
  const formatButtons = [
    { id: 'wav', label: 'WAV' },
    { id: 'mp3', label: 'MP3' },
    { id: 'aac', label: 'AAC' },
    { id: 'flac', label: 'FLAC' },
    { id: 'asio', label: 'ASIO' },
    { id: 'wasapi', label: 'WASAPI' },
    { id: 'directsound', label: 'DirectSound' },
  ];
  
  // Sample devices for each format - would be populated dynamically in a real app
  const deviceOptions = {
    asio: ['ASIO4ALL v2', 'RME Fireface', 'Focusrite Scarlett 2i2', 'Steinberg UR22'],
    wasapi: ['Primary Sound Driver', 'Speakers (High Definition Audio)', 'Microphone (High Definition Audio)', 'Line In (High Definition Audio)'],
    directsound: ['Primary Sound Driver', 'Secondary Sound Driver', 'Microphone', 'Line In'],
    wav: ['File Input'],
    mp3: ['File Input'],
    aac: ['File Input'],
    flac: ['File Input'],
  };
  
  // Handle input format change and reset device to default for that format
  const handleFormatChange = (format: string) => {
    setInputFormat(format);
    setInputDevice(deviceOptions[format][0] || 'default');
  };
  
  return (
    <div className="space-y-4">
      {/* Input Format Selection */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-blue-500 flex items-center">
            <Radio className="h-5 w-5 mr-2" />
            Input Format & Device
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Audio Input Format</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {formatButtons.map((format) => (
                <Button
                  key={format.id}
                  variant={inputFormat === format.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFormatChange(format.id)}
                  className="text-xs"
                >
                  {format.label}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Input Device</h3>
            <Select
              value={inputDevice}
              onValueChange={setInputDevice}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700">
                <SelectValue placeholder="Select device" />
              </SelectTrigger>
              <SelectContent>
                {deviceOptions[inputFormat]?.map((device) => (
                  <SelectItem key={device} value={device}>
                    {device}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-sm font-medium text-gray-300">Configuration</h3>
              <Button variant="outline" size="sm" className="h-7">
                <Settings className="h-3.5 w-3.5 mr-1" />
                Advanced
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-gray-800 p-2 rounded-md">
                <Label htmlFor="sample-rate" className="text-xs text-gray-400">Sample Rate</Label>
                <Select
                  value={sampleRate}
                  onValueChange={setSampleRate}
                >
                  <SelectTrigger className="mt-1 h-8 bg-gray-700 border-gray-600">
                    <SelectValue placeholder="Sample Rate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="44100">44.1 kHz</SelectItem>
                    <SelectItem value="48000">48 kHz</SelectItem>
                    <SelectItem value="88200">88.2 kHz</SelectItem>
                    <SelectItem value="96000">96 kHz</SelectItem>
                    <SelectItem value="192000">192 kHz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="bg-gray-800 p-2 rounded-md">
                <Label htmlFor="bit-depth" className="text-xs text-gray-400">Bit Depth</Label>
                <Select
                  value={bitDepth}
                  onValueChange={setBitDepth}
                >
                  <SelectTrigger className="mt-1 h-8 bg-gray-700 border-gray-600">
                    <SelectValue placeholder="Bit Depth" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16">16-bit</SelectItem>
                    <SelectItem value="24">24-bit</SelectItem>
                    <SelectItem value="32">32-bit float</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="bg-gray-800 p-2 rounded-md">
                <Label htmlFor="buffer-size" className="text-xs text-gray-400">Buffer Size</Label>
                <Select
                  value={bufferSize}
                  onValueChange={setBufferSize}
                >
                  <SelectTrigger className="mt-1 h-8 bg-gray-700 border-gray-600">
                    <SelectValue placeholder="Buffer Size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="128">128 samples</SelectItem>
                    <SelectItem value="256">256 samples</SelectItem>
                    <SelectItem value="512">512 samples</SelectItem>
                    <SelectItem value="1024">1024 samples</SelectItem>
                    <SelectItem value="2048">2048 samples</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Channel Configuration</h3>
            <div className="flex space-x-2">
              <Button
                variant={channels === 'mono' ? "default" : "outline"}
                size="sm"
                onClick={() => setChannels('mono')}
              >
                Mono
              </Button>
              <Button
                variant={channels === 'stereo' ? "default" : "outline"}
                size="sm"
                onClick={() => setChannels('stereo')}
              >
                Stereo
              </Button>
              <Button
                variant={channels === '5.1' ? "default" : "outline"}
                size="sm"
                onClick={() => setChannels('5.1')}
              >
                5.1 Surround
              </Button>
              <Button
                variant={channels === '7.1' ? "default" : "outline"}
                size="sm"
                onClick={() => setChannels('7.1')}
              >
                7.1 Surround
              </Button>
            </div>
          </div>
          
          <div className="bg-blue-900/20 p-3 rounded-md text-sm border border-blue-800">
            <div className="flex items-start">
              <AudioLines className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
              <div>
                <p className="text-blue-300">{inputFormat.toUpperCase()} input is active with {deviceOptions[inputFormat][0]}</p>
                <p className="text-blue-300 text-xs mt-1">
                  Sample rate: {sampleRate} Hz | Bit depth: {bitDepth}-bit | Buffer: {bufferSize} samples | Channels: {channels}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Input/Output Gain Control */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-blue-500 flex items-center">
            <Volume className="h-5 w-5 mr-2" />
            Gain Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">Input Gain</span>
                <span className="text-gray-400">{inputGain > 0 ? '+' : ''}{inputGain} dB</span>
              </div>
              <Slider
                value={[inputGain]}
                min={-24}
                max={24}
                step={0.5}
                onValueChange={(value) => setInputGain(value[0])}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>-24 dB</span>
                <span>0 dB</span>
                <span>+24 dB</span>
              </div>
            </div>
            
            {channels === 'stereo' && (
              <div className="pt-2 pb-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-300">Stereo Balance</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-gray-400 hover:text-white"
                    onClick={() => {}}
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1" />
                    Reset
                  </Button>
                </div>
                <div className="h-6 w-full bg-gray-800 rounded-full relative flex items-center">
                  <div className="absolute w-0.5 h-4 bg-gray-600 left-1/2 transform -translate-x-1/2"></div>
                  <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full cursor-pointer"></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>L</span>
                  <span>Center</span>
                  <span>R</span>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Output Gain</span>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center">
                    <Switch
                      id="peak-limiter"
                      checked={enablePeakLimiter}
                      onCheckedChange={setEnablePeakLimiter}
                      className="mr-2"
                    />
                    <Label htmlFor="peak-limiter" className="text-xs text-gray-400">
                      Peak Limiter
                    </Label>
                  </div>
                  <span className="text-sm text-gray-400">{outputGain > 0 ? '+' : ''}{outputGain} dB</span>
                </div>
              </div>
              <Slider
                value={[outputGain]}
                min={-24}
                max={12}
                step={0.5}
                onValueChange={(value) => setOutputGain(value[0])}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>-24 dB</span>
                <span>0 dB</span>
                <span>+12 dB</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Latency Compensation */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-blue-500 flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Latency Control
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h3 className="text-sm font-medium text-gray-300">Latency Compensation</h3>
                <p className="text-xs text-gray-500 mt-0.5">Adjust to compensate for processing delay</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-blue-400">{latencyCompensation} ms</span>
                <p className="text-xs text-gray-500 mt-0.5">{bufferSize} samples @ {sampleRate} Hz</p>
              </div>
            </div>
            
            <Slider
              value={[latencyCompensation]}
              min={0}
              max={100}
              step={1}
              onValueChange={(value) => setLatencyCompensation(value[0])}
            />
            
            <div className="flex justify-between bg-gray-800 p-3 rounded-md">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span className="text-xs text-gray-300">Input Latency: 4.8 ms</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                <span className="text-xs text-gray-300">Processing: 6.2 ms</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                <span className="text-xs text-gray-300">Output Latency: 5.1 ms</span>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <div className="flex items-center space-x-2 bg-gray-800 p-2 rounded-md flex-1">
                <Switch
                  id="monitor-input"
                  checked={monitorInput}
                  onCheckedChange={setMonitorInput}
                />
                <Label htmlFor="monitor-input" className="text-sm text-gray-300">
                  Direct Monitoring
                </Label>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="bg-gray-800 border-gray-700"
              >
                <BarChart4 className="h-4 w-4 mr-1" />
                Measure Latency
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Input Meter */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-blue-500 flex items-center justify-between">
            <div className="flex items-center">
              <Mic className="h-5 w-5 mr-2" />
              Input Monitoring
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                <span className="text-gray-400">Left</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>
                <span className="text-gray-400">Right</span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Input level meters */}
            <div className="space-y-1">
              <div className="flex space-x-1">
                {/* Left channel */}
                <div className="h-6 bg-gray-800 rounded-sm overflow-hidden flex-1">
                  <div className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 animate-pulse" style={{ width: '65%' }}></div>
                </div>
                {/* Right channel */}
                <div className="h-6 bg-gray-800 rounded-sm overflow-hidden flex-1">
                  <div className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 animate-pulse" style={{ width: '58%' }}></div>
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>-42</span>
                <span>-36</span>
                <span>-24</span>
                <span>-18</span>
                <span>-12</span>
                <span>-6</span>
                <span>-3</span>
                <span>0dB</span>
              </div>
            </div>
            
            <Tabs defaultValue="meter" className="w-full">
              <TabsList className="grid grid-cols-3 mb-2">
                <TabsTrigger value="meter" className="text-xs">Meter</TabsTrigger>
                <TabsTrigger value="spectrum" className="text-xs">Spectrum</TabsTrigger>
                <TabsTrigger value="goniometer" className="text-xs">Goniometer</TabsTrigger>
              </TabsList>
              
              <TabsContent value="meter" className="mt-0">
                <div className="h-40 bg-gray-800 rounded-sm p-2 flex flex-col justify-end">
                  <div className="flex space-x-2">
                    <div className="flex-1 space-y-1">
                      <div className="text-xs text-center text-gray-500 mb-1">Peak</div>
                      <div className="h-32 w-full bg-gray-900 rounded-sm relative">
                        <div className="absolute bottom-0 left-0 right-0 bg-green-500 rounded-sm" style={{ height: '40%' }}></div>
                        <div className="absolute bottom-1/2 left-0 right-0 h-px bg-gray-700"></div>
                        <div className="absolute bottom-3/4 left-0 right-0 h-px bg-gray-700"></div>
                      </div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="text-xs text-center text-gray-500 mb-1">RMS</div>
                      <div className="h-32 w-full bg-gray-900 rounded-sm relative">
                        <div className="absolute bottom-0 left-0 right-0 bg-blue-500 rounded-sm" style={{ height: '25%' }}></div>
                        <div className="absolute bottom-1/2 left-0 right-0 h-px bg-gray-700"></div>
                        <div className="absolute bottom-3/4 left-0 right-0 h-px bg-gray-700"></div>
                      </div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="text-xs text-center text-gray-500 mb-1">LUFS</div>
                      <div className="h-32 w-full bg-gray-900 rounded-sm relative">
                        <div className="absolute bottom-0 left-0 right-0 bg-purple-500 rounded-sm" style={{ height: '30%' }}></div>
                        <div className="absolute bottom-1/2 left-0 right-0 h-px bg-gray-700"></div>
                        <div className="absolute bottom-3/4 left-0 right-0 h-px bg-gray-700"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="spectrum" className="mt-0">
                <div className="h-40 bg-gray-800 rounded-sm p-2 flex items-end space-x-0.5">
                  {/* Simulated spectrum bars */}
                  {Array.from({ length: 64 }).map((_, i) => {
                    const height = Math.floor(Math.random() * 60) + 10;
                    return (
                      <div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-blue-500 to-purple-500 rounded-t-sm"
                        style={{ height: `${height}%` }}
                      ></div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>20Hz</span>
                  <span>100Hz</span>
                  <span>500Hz</span>
                  <span>1kHz</span>
                  <span>5kHz</span>
                  <span>20kHz</span>
                </div>
              </TabsContent>
              
              <TabsContent value="goniometer" className="mt-0">
                <div className="h-40 bg-gray-800 rounded-sm p-2 flex justify-center items-center">
                  <div className="relative h-32 w-32 border border-gray-700 rounded-full">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-px w-full bg-gray-700"></div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-full w-px bg-gray-700"></div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-24 w-24 border border-gray-700 rounded-full"></div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-16 w-16 border border-gray-700 rounded-full"></div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-8 w-8 border border-gray-700 rounded-full"></div>
                    </div>
                    
                    {/* Simulated goniometer dots */}
                    {Array.from({ length: 60 }).map((_, i) => {
                      const x = (Math.random() * 2 - 1) * 15;
                      const y = (Math.random() * 2 - 1) * 15;
                      return (
                        <div
                          key={i}
                          className="absolute h-1 w-1 bg-green-500 rounded-full opacity-80"
                          style={{ 
                            left: `calc(50% + ${x}px)`, 
                            top: `calc(50% + ${y}px)` 
                          }}
                        ></div>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InputSection;
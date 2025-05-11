import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Radio as RadioIcon, MusicIcon, PlaySquare, Radio, Save, Settings, Volume2, Activity, Wifi } from 'lucide-react';

const StreamingPage: React.FC = () => {
  // State for different settings sections
  const [activeTab, setActiveTab] = useState('loudness');
  
  // Loudness Management state
  const [loudnessSettings, setLoudnessSettings] = useState({
    targetLUFS: -14,
    maxTruePeak: -1.0,
    enableLimiter: true,
    platformPreset: 'spotify',
    enableDynamicProcessing: true,
    dynamicRange: 8,
  });

  // Streaming Server state
  const [serverSettings, setServerSettings] = useState({
    serverType: 'icecast',
    serverUrl: 'https://streaming.example.com',
    port: '8000',
    mountpoint: '/stream',
    username: 'source',
    password: '',
    streamName: 'My Radio Station',
    streamDescription: 'The best music all day long',
    streamGenre: 'Variety',
    streamWebsite: 'https://www.example.com',
    publicServer: true,
  });

  // Encoder settings state
  const [encoderSettings, setEncoderSettings] = useState({
    format: 'aac',
    bitrate: 128,
    channels: 'stereo',
    sampleRate: 44100,
    enableMultipleFormats: false,
    formats: [
      { id: 1, enabled: true, format: 'aac', bitrate: 128 },
      { id: 2, enabled: false, format: 'mp3', bitrate: 192 },
      { id: 3, enabled: false, format: 'opus', bitrate: 96 }
    ]
  });

  // Preview settings state
  const [previewSettings, setPreviewSettings] = useState({
    enabled: false,
    volume: 80,
    showLatencyControl: true,
    latency: 2000, // ms
    audioDevice: 'default'
  });

  // Audio devices list (would be loaded from backend in a real application)
  const audioDevices = [
    { id: 'default', name: 'System Default' },
    { id: 'device1', name: 'Main Speakers' },
    { id: 'device2', name: 'Studio Headphones' }
  ];

  // Platform presets for loudness
  const platformPresets = [
    { id: 'spotify', name: 'Spotify (-14 LUFS)', lufs: -14, peak: -1.0 },
    { id: 'youtube', name: 'YouTube (-14 LUFS)', lufs: -14, peak: -1.0 },
    { id: 'apple', name: 'Apple Music (-16 LUFS)', lufs: -16, peak: -1.0 },
    { id: 'amazon', name: 'Amazon Music (-14 LUFS)', lufs: -14, peak: -2.0 },
    { id: 'tidal', name: 'Tidal (-14 LUFS)', lufs: -14, peak: -1.0 },
    { id: 'custom', name: 'Custom', lufs: loudnessSettings.targetLUFS, peak: loudnessSettings.maxTruePeak }
  ];

  // Handle changing loudness preset
  const handleLoudnessPresetChange = (presetId: string) => {
    const preset = platformPresets.find(p => p.id === presetId);
    if (preset) {
      setLoudnessSettings(prev => ({
        ...prev,
        platformPreset: presetId,
        targetLUFS: preset.lufs,
        maxTruePeak: preset.peak
      }));
    }
  };

  // Handle changing encoder settings
  const handleEncoderFormatChange = (format: string) => {
    let defaultBitrate = 128;
    
    switch (format) {
      case 'mp3':
        defaultBitrate = 192;
        break;
      case 'aac':
        defaultBitrate = 128;
        break;
      case 'opus':
        defaultBitrate = 96;
        break;
      default:
        defaultBitrate = 128;
    }
    
    setEncoderSettings(prev => ({
      ...prev,
      format,
      bitrate: defaultBitrate
    }));
  };

  // Handle toggle for multiple formats
  const handleToggleFormat = (formatId: number, enabled: boolean) => {
    setEncoderSettings(prev => ({
      ...prev,
      formats: prev.formats.map(format => 
        format.id === formatId ? { ...format, enabled } : format
      )
    }));
  };

  // Handle changing format settings
  const handleFormatChange = (formatId: number, key: string, value: any) => {
    setEncoderSettings(prev => ({
      ...prev,
      formats: prev.formats.map(format => 
        format.id === formatId ? { ...format, [key]: value } : format
      )
    }));
  };

  // Handle save settings
  const handleSaveSettings = () => {
    // In a real app, this would send data to the backend
    console.log('Saving settings...');
    console.log('Loudness:', loudnessSettings);
    console.log('Server:', serverSettings);
    console.log('Encoder:', encoderSettings);
    console.log('Preview:', previewSettings);
    
    // Show success notification (would use a proper toast in real app)
    alert('Settings saved successfully!');
  };

  // Toggle streaming preview
  const handleTogglePreview = () => {
    setPreviewSettings(prev => ({
      ...prev,
      enabled: !prev.enabled
    }));
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950">
      {/* Left Side Menu (similar to InternetRadioPage) */}
      <div className="w-64 bg-gray-900 border-r border-gray-800 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center space-x-2">
            <Wifi className="h-6 w-6 text-purple-500" />
            <h2 className="text-lg font-semibold text-white">Streaming</h2>
          </div>
          <p className="text-sm text-gray-400 mt-1">Configure streaming settings</p>
        </div>
        
        <div className="px-3 py-2">
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab('loudness')}
              className={`flex items-center w-full px-3 py-2 text-sm rounded-md font-medium ${
                activeTab === 'loudness' ? 'bg-purple-900/30 text-purple-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Volume2 className="h-4 w-4 mr-2" />
              Loudness Management
            </button>
            <button
              onClick={() => setActiveTab('server')}
              className={`flex items-center w-full px-3 py-2 text-sm rounded-md font-medium ${
                activeTab === 'server' ? 'bg-purple-900/30 text-purple-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Radio className="h-4 w-4 mr-2" />
              Shoutcast/Icecast
            </button>
            <button
              onClick={() => setActiveTab('encoder')}
              className={`flex items-center w-full px-3 py-2 text-sm rounded-md font-medium ${
                activeTab === 'encoder' ? 'bg-purple-900/30 text-purple-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Settings className="h-4 w-4 mr-2" />
              Encoder Settings
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center w-full px-3 py-2 text-sm rounded-md font-medium ${
                activeTab === 'preview' ? 'bg-purple-900/30 text-purple-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <PlaySquare className="h-4 w-4 mr-2" />
              Stream Preview
            </button>
          </div>
        </div>
        
        <div className="mt-6 px-4">
          <Button 
            className="w-full bg-purple-600 hover:bg-purple-700"
            onClick={handleSaveSettings}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-gray-950 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Streaming Configuration</h1>
          <div className="flex items-center space-x-2">
            {previewSettings.enabled && (
              <div className="flex items-center space-x-2 bg-green-900/30 text-green-400 px-3 py-1 rounded-md">
                <div className="animate-pulse h-3 w-3 rounded-full bg-green-500"></div>
                <span className="text-sm">Streaming Preview Active</span>
              </div>
            )}
            <Button 
              variant={previewSettings.enabled ? "destructive" : "outline"} 
              size="sm"
              onClick={handleTogglePreview}
            >
              {previewSettings.enabled ? 'Stop Preview' : 'Start Preview'}
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          {/* Loudness Management */}
          {activeTab === 'loudness' && (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-purple-500 flex items-center">
                  <Volume2 className="h-5 w-5 mr-2" />
                  Loudness Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Platform Presets</Label>
                      <Select 
                        value={loudnessSettings.platformPreset} 
                        onValueChange={handleLoudnessPresetChange}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Select a platform" />
                        </SelectTrigger>
                        <SelectContent>
                          {platformPresets.map((preset) => (
                            <SelectItem key={preset.id} value={preset.id}>
                              {preset.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label htmlFor="target-lufs">Target LUFS ({loudnessSettings.targetLUFS} dB)</Label>
                          </div>
                          <Slider
                            id="target-lufs"
                            min={-23}
                            max={-9}
                            step={0.5}
                            value={[loudnessSettings.targetLUFS]}
                            onValueChange={(value) => setLoudnessSettings(prev => ({ ...prev, targetLUFS: value[0] }))}
                          />
                          <p className="text-xs text-gray-400 mt-1">
                            Industry standard for streaming platforms is between -16 and -14 LUFS
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label htmlFor="max-true-peak">Maximum True Peak ({loudnessSettings.maxTruePeak} dBTP)</Label>
                          </div>
                          <Slider
                            id="max-true-peak"
                            min={-6}
                            max={0}
                            step={0.1}
                            value={[loudnessSettings.maxTruePeak]}
                            onValueChange={(value) => setLoudnessSettings(prev => ({ ...prev, maxTruePeak: value[0] }))}
                          />
                          <p className="text-xs text-gray-400 mt-1">
                            Recommended value is -1.0 dBTP to prevent clipping on lossy codecs
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="enable-limiter"
                              checked={loudnessSettings.enableLimiter}
                              onCheckedChange={(checked) => setLoudnessSettings(prev => ({ ...prev, enableLimiter: checked }))}
                            />
                            <Label htmlFor="enable-limiter">Enable Limiter</Label>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="enable-dynamic-processing"
                              checked={loudnessSettings.enableDynamicProcessing}
                              onCheckedChange={(checked) => setLoudnessSettings(prev => ({ ...prev, enableDynamicProcessing: checked }))}
                            />
                            <Label htmlFor="enable-dynamic-processing">Dynamic Processing</Label>
                          </div>
                        </div>
                        
                        <div className="space-y-2 mt-2">
                          <div className="flex justify-between">
                            <Label htmlFor="dynamic-range">Dynamic Range ({loudnessSettings.dynamicRange} LU)</Label>
                          </div>
                          <Slider
                            id="dynamic-range"
                            min={3}
                            max={15}
                            step={1}
                            value={[loudnessSettings.dynamicRange]}
                            onValueChange={(value) => setLoudnessSettings(prev => ({ ...prev, dynamicRange: value[0] }))}
                            disabled={!loudnessSettings.enableDynamicProcessing}
                          />
                          <p className="text-xs text-gray-400 mt-1">
                            Lower values create a more consistent loudness at the expense of dynamics
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 bg-gray-800 p-4 rounded-md">
                      <h3 className="font-medium text-white mb-2">Loudness Visualization</h3>
                      <div className="h-20 bg-gray-900 rounded-md overflow-hidden relative">
                        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                          <Activity className="h-8 w-8" />
                          <span className="ml-2">Loudness meters will appear here during streaming</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Server Configuration */}
          {activeTab === 'server' && (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-purple-500 flex items-center">
                  <Radio className="h-5 w-5 mr-2" />
                  Shoutcast/Icecast Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Server Type</Label>
                    <Tabs defaultValue={serverSettings.serverType} onValueChange={(value) => setServerSettings(prev => ({ ...prev, serverType: value }))}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="icecast">
                          Icecast
                        </TabsTrigger>
                        <TabsTrigger value="shoutcast">
                          Shoutcast
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="server-url">Server URL</Label>
                        <Input 
                          id="server-url" 
                          placeholder="https://streaming.example.com" 
                          value={serverSettings.serverUrl}
                          onChange={(e) => setServerSettings(prev => ({ ...prev, serverUrl: e.target.value }))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="server-port">Port</Label>
                        <Input 
                          id="server-port" 
                          placeholder="8000" 
                          value={serverSettings.port}
                          onChange={(e) => setServerSettings(prev => ({ ...prev, port: e.target.value }))}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="mountpoint">
                          {serverSettings.serverType === 'icecast' ? 'Mountpoint' : 'Stream ID'}
                        </Label>
                        <Input 
                          id="mountpoint" 
                          placeholder={serverSettings.serverType === 'icecast' ? '/stream' : '1'} 
                          value={serverSettings.mountpoint}
                          onChange={(e) => setServerSettings(prev => ({ ...prev, mountpoint: e.target.value }))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="server-username">Username</Label>
                        <Input 
                          id="server-username" 
                          placeholder="source" 
                          value={serverSettings.username}
                          onChange={(e) => setServerSettings(prev => ({ ...prev, username: e.target.value }))}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="server-password">Password</Label>
                      <Input 
                        id="server-password" 
                        type="password" 
                        placeholder="Enter password" 
                        value={serverSettings.password}
                        onChange={(e) => setServerSettings(prev => ({ ...prev, password: e.target.value }))}
                      />
                    </div>
                    
                    <div className="pt-4 border-t border-gray-800">
                      <h3 className="font-medium text-white mb-4">Stream Information</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="stream-name">Stream Name</Label>
                          <Input 
                            id="stream-name" 
                            placeholder="My Radio Station" 
                            value={serverSettings.streamName}
                            onChange={(e) => setServerSettings(prev => ({ ...prev, streamName: e.target.value }))}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="stream-genre">Genre</Label>
                          <Input 
                            id="stream-genre" 
                            placeholder="Variety" 
                            value={serverSettings.streamGenre}
                            onChange={(e) => setServerSettings(prev => ({ ...prev, streamGenre: e.target.value }))}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2 mt-4">
                        <Label htmlFor="stream-description">Description</Label>
                        <Input 
                          id="stream-description" 
                          placeholder="The best music all day long" 
                          value={serverSettings.streamDescription}
                          onChange={(e) => setServerSettings(prev => ({ ...prev, streamDescription: e.target.value }))}
                        />
                      </div>
                      
                      <div className="space-y-2 mt-4">
                        <Label htmlFor="stream-website">Website URL</Label>
                        <Input 
                          id="stream-website" 
                          placeholder="https://www.example.com" 
                          value={serverSettings.streamWebsite}
                          onChange={(e) => setServerSettings(prev => ({ ...prev, streamWebsite: e.target.value }))}
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-4">
                        <Switch
                          id="public-server"
                          checked={serverSettings.publicServer}
                          onCheckedChange={(checked) => setServerSettings(prev => ({ ...prev, publicServer: checked }))}
                        />
                        <Label htmlFor="public-server">List on Public Directory</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Encoder Settings */}
          {activeTab === 'encoder' && (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-purple-500 flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Encoder Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="multiple-formats"
                        checked={encoderSettings.enableMultipleFormats}
                        onCheckedChange={(checked) => setEncoderSettings(prev => ({ ...prev, enableMultipleFormats: checked }))}
                      />
                      <Label htmlFor="multiple-formats">Enable Multiple Format Encoding</Label>
                    </div>
                  </div>
                  
                  {!encoderSettings.enableMultipleFormats ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Format</Label>
                          <Select 
                            value={encoderSettings.format} 
                            onValueChange={handleEncoderFormatChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select format" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mp3">MP3</SelectItem>
                              <SelectItem value="aac">AAC</SelectItem>
                              <SelectItem value="opus">Opus</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Bitrate (kbps)</Label>
                          <Select 
                            value={encoderSettings.bitrate.toString()} 
                            onValueChange={(value) => setEncoderSettings(prev => ({ ...prev, bitrate: parseInt(value) }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select bitrate" />
                            </SelectTrigger>
                            <SelectContent>
                              {encoderSettings.format === 'mp3' && (
                                <>
                                  <SelectItem value="128">128 kbps</SelectItem>
                                  <SelectItem value="192">192 kbps</SelectItem>
                                  <SelectItem value="256">256 kbps</SelectItem>
                                  <SelectItem value="320">320 kbps</SelectItem>
                                </>
                              )}
                              {encoderSettings.format === 'aac' && (
                                <>
                                  <SelectItem value="64">64 kbps</SelectItem>
                                  <SelectItem value="96">96 kbps</SelectItem>
                                  <SelectItem value="128">128 kbps</SelectItem>
                                  <SelectItem value="192">192 kbps</SelectItem>
                                  <SelectItem value="256">256 kbps</SelectItem>
                                </>
                              )}
                              {encoderSettings.format === 'opus' && (
                                <>
                                  <SelectItem value="48">48 kbps</SelectItem>
                                  <SelectItem value="64">64 kbps</SelectItem>
                                  <SelectItem value="96">96 kbps</SelectItem>
                                  <SelectItem value="128">128 kbps</SelectItem>
                                </>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Channels</Label>
                          <Select 
                            value={encoderSettings.channels} 
                            onValueChange={(value) => setEncoderSettings(prev => ({ ...prev, channels: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select channels" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="stereo">Stereo</SelectItem>
                              <SelectItem value="mono">Mono</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Sample Rate</Label>
                          <Select 
                            value={encoderSettings.sampleRate.toString()} 
                            onValueChange={(value) => setEncoderSettings(prev => ({ ...prev, sampleRate: parseInt(value) }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select sample rate" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="44100">44.1 kHz</SelectItem>
                              <SelectItem value="48000">48 kHz</SelectItem>
                              <SelectItem value="32000">32 kHz</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {encoderSettings.formats.map((format, index) => (
                        <div key={format.id} className="p-4 bg-gray-800 rounded-md">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-2">
                              <Switch
                                id={`format-${format.id}-enabled`}
                                checked={format.enabled}
                                onCheckedChange={(checked) => handleToggleFormat(format.id, checked)}
                              />
                              <Label htmlFor={`format-${format.id}-enabled`}>Stream #{index + 1}</Label>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label>Format</Label>
                              <Select 
                                value={format.format} 
                                onValueChange={(value) => handleFormatChange(format.id, 'format', value)}
                                disabled={!format.enabled}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select format" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="mp3">MP3</SelectItem>
                                  <SelectItem value="aac">AAC</SelectItem>
                                  <SelectItem value="opus">Opus</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Bitrate (kbps)</Label>
                              <Select 
                                value={format.bitrate.toString()} 
                                onValueChange={(value) => handleFormatChange(format.id, 'bitrate', parseInt(value))}
                                disabled={!format.enabled}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select bitrate" />
                                </SelectTrigger>
                                <SelectContent>
                                  {format.format === 'mp3' && (
                                    <>
                                      <SelectItem value="128">128 kbps</SelectItem>
                                      <SelectItem value="192">192 kbps</SelectItem>
                                      <SelectItem value="256">256 kbps</SelectItem>
                                      <SelectItem value="320">320 kbps</SelectItem>
                                    </>
                                  )}
                                  {format.format === 'aac' && (
                                    <>
                                      <SelectItem value="64">64 kbps</SelectItem>
                                      <SelectItem value="96">96 kbps</SelectItem>
                                      <SelectItem value="128">128 kbps</SelectItem>
                                      <SelectItem value="192">192 kbps</SelectItem>
                                      <SelectItem value="256">256 kbps</SelectItem>
                                    </>
                                  )}
                                  {format.format === 'opus' && (
                                    <>
                                      <SelectItem value="48">48 kbps</SelectItem>
                                      <SelectItem value="64">64 kbps</SelectItem>
                                      <SelectItem value="96">96 kbps</SelectItem>
                                      <SelectItem value="128">128 kbps</SelectItem>
                                    </>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      <div className="bg-gray-900 p-4 rounded-md border border-gray-800">
                        <p className="text-sm text-gray-400">
                          Multiple streams can be used to provide different quality options for listeners with varying connection speeds. Each stream can have its own mountpoint/stream ID.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Stream Preview */}
          {activeTab === 'preview' && (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-purple-500 flex items-center">
                  <PlaySquare className="h-5 w-5 mr-2" />
                  Stream Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label htmlFor="preview-volume">Preview Volume ({previewSettings.volume}%)</Label>
                        </div>
                        <Slider
                          id="preview-volume"
                          min={0}
                          max={100}
                          step={1}
                          value={[previewSettings.volume]}
                          onValueChange={(value) => setPreviewSettings(prev => ({ ...prev, volume: value[0] }))}
                          disabled={!previewSettings.enabled}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Audio Output Device</Label>
                        <Select 
                          value={previewSettings.audioDevice} 
                          onValueChange={(value) => setPreviewSettings(prev => ({ ...prev, audioDevice: value }))}
                          disabled={!previewSettings.enabled}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select audio device" />
                          </SelectTrigger>
                          <SelectContent>
                            {audioDevices.map(device => (
                              <SelectItem key={device.id} value={device.id}>
                                {device.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="show-latency-control"
                            checked={previewSettings.showLatencyControl}
                            onCheckedChange={(checked) => setPreviewSettings(prev => ({ ...prev, showLatencyControl: checked }))}
                            disabled={!previewSettings.enabled}
                          />
                          <Label htmlFor="show-latency-control">Show Latency Control</Label>
                        </div>
                      </div>
                      
                      {previewSettings.showLatencyControl && (
                        <div className="space-y-2 mt-4">
                          <div className="flex justify-between">
                            <Label htmlFor="latency-control">Latency Buffer ({(previewSettings.latency / 1000).toFixed(1)} seconds)</Label>
                          </div>
                          <Slider
                            id="latency-control"
                            min={500}
                            max={10000}
                            step={100}
                            value={[previewSettings.latency]}
                            onValueChange={(value) => setPreviewSettings(prev => ({ ...prev, latency: value[0] }))}
                            disabled={!previewSettings.enabled || !previewSettings.showLatencyControl}
                          />
                          <p className="text-xs text-gray-400 mt-1">
                            Lower values reduce delay but may cause more audio buffering
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-6 p-6 bg-gray-800 rounded-md flex flex-col items-center justify-center">
                    <div className={`p-4 bg-gray-900 rounded-full ${previewSettings.enabled ? 'animate-pulse' : ''}`}>
                      {previewSettings.enabled ? (
                        <Activity className="h-16 w-16 text-purple-500" />
                      ) : (
                        <MusicIcon className="h-16 w-16 text-gray-600" />
                      )}
                    </div>
                    <h3 className="mt-4 font-medium text-lg">
                      {previewSettings.enabled ? 'Stream Preview Active' : 'Stream Preview Inactive'}
                    </h3>
                    <p className="text-sm text-gray-400 mt-2 text-center max-w-md">
                      {previewSettings.enabled 
                        ? 'You are currently listening to your stream with the configured settings. The audio you hear is what your listeners will experience.' 
                        : 'Start the preview to listen to your stream with the current settings and check for quality issues.'}
                    </p>
                    
                    {previewSettings.enabled && (
                      <div className="mt-4 grid grid-cols-3 gap-2 w-full max-w-md">
                        <div className="bg-gray-900 p-3 rounded-md">
                          <div className="text-sm text-gray-400">Format</div>
                          <div className="font-medium text-white">
                            {encoderSettings.format.toUpperCase()}
                          </div>
                        </div>
                        <div className="bg-gray-900 p-3 rounded-md">
                          <div className="text-sm text-gray-400">Bitrate</div>
                          <div className="font-medium text-white">
                            {encoderSettings.bitrate} kbps
                          </div>
                        </div>
                        <div className="bg-gray-900 p-3 rounded-md">
                          <div className="text-sm text-gray-400">Latency</div>
                          <div className="font-medium text-white">
                            {(previewSettings.latency / 1000).toFixed(1)}s
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <Button 
                      className={`mt-4 ${previewSettings.enabled ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'}`}
                      onClick={handleTogglePreview}
                    >
                      {previewSettings.enabled ? 'Stop Preview' : 'Start Preview'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default StreamingPage;
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  PlugIcon,
  Cpu,
  Waves,
  Globe,
  PanelLeft,
  FilePlus,
  Trash2,
  RefreshCw,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  TerminalSquare,
  Layers,
  Database,
  Sliders
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"

interface PluginSystemSectionProps {
  onSave?: () => void;
}

// Plugin Types
type PluginFormat = 'VST' | 'VST3' | 'AU' | 'AAX';

interface Plugin {
  id: string;
  name: string;
  format: PluginFormat;
  version: string;
  manufacturer: string;
  path: string;
  enabled: boolean;
  favorite: boolean;
  lastScanned: string;
  parameters?: number;
}

interface PluginScanResult {
  timestamp: string;
  totalFound: number;
  newFound: number;
  failures: number;
  duration: string;
}

// CPU/Performance Presets
interface PerformancePreset {
  id: string;
  name: string;
  description: string;
  maxThreads: number;
  bufferSize: number;
  lowLatencyMode: boolean;
  rtPriority: boolean;
  guardBand: number;
  isDefault: boolean;
}

// Remote API settings
interface RemoteEndpoint {
  id: string;
  name: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  enabled: boolean;
  requiresAuth: boolean;
  description: string;
}

const PluginSystemSection: React.FC<PluginSystemSectionProps> = ({ onSave }) => {
  // State for the active tab
  const [activeTab, setActiveTab] = useState<string>('plugins');
  
  // State for plugin folders
  const [pluginFolders, setPluginFolders] = useState<string[]>([
    'C:/Program Files/Common Files/VST3',
    'C:/Program Files/Steinberg/VSTPlugins',
    'C:/Program Files/Common Files/VST2',
    '/Library/Audio/Plug-Ins/Components',
    '/Library/Audio/Plug-Ins/VST3'
  ]);
  
  // State for plugin scan results
  const [pluginScanResults, setPluginScanResults] = useState<PluginScanResult[]>([
    {
      timestamp: '2025-05-01 13:45:22',
      totalFound: 247,
      newFound: 12,
      failures: 3,
      duration: '37.5s'
    },
    {
      timestamp: '2025-04-28 10:12:05',
      totalFound: 235,
      newFound: 0,
      failures: 2,
      duration: '35.1s'
    }
  ]);
  
  // State for plugins
  const [plugins, setPlugins] = useState<Plugin[]>([
    {
      id: 'p1',
      name: 'FabFilter Pro-Q 3',
      format: 'VST3',
      version: '3.21',
      manufacturer: 'FabFilter',
      path: 'C:/Program Files/Common Files/VST3/FabFilter/FabFilter Pro-Q 3.vst3',
      enabled: true,
      favorite: true,
      lastScanned: '2025-05-01 13:45:22',
      parameters: 136
    },
    {
      id: 'p2',
      name: 'Serum',
      format: 'VST',
      version: '1.35',
      manufacturer: 'Xfer Records',
      path: 'C:/Program Files/Steinberg/VSTPlugins/Serum.dll',
      enabled: true,
      favorite: true,
      lastScanned: '2025-05-01 13:45:22',
      parameters: 246
    },
    {
      id: 'p3',
      name: 'Ozone 10',
      format: 'VST3',
      version: '10.2.0',
      manufacturer: 'iZotope',
      path: 'C:/Program Files/Common Files/VST3/iZotope/Ozone 10.vst3',
      enabled: true,
      favorite: false,
      lastScanned: '2025-05-01 13:45:22',
      parameters: 320
    },
    {
      id: 'p4',
      name: 'Kontakt 7',
      format: 'VST3',
      version: '7.3.1',
      manufacturer: 'Native Instruments',
      path: 'C:/Program Files/Common Files/VST3/Native Instruments/Kontakt 7.vst3',
      enabled: true,
      favorite: false,
      lastScanned: '2025-05-01 13:45:22',
      parameters: 543
    },
    {
      id: 'p5',
      name: 'Soothe2',
      format: 'VST3',
      version: '1.3.2',
      manufacturer: 'Oeksound',
      path: 'C:/Program Files/Common Files/VST3/Oeksound/Soothe2.vst3',
      enabled: true,
      favorite: false,
      lastScanned: '2025-05-01 13:45:22',
      parameters: 112
    }
  ]);
  
  // State for performance presets
  const [performancePresets, setPerformancePresets] = useState<PerformancePreset[]>([
    {
      id: 'perf1',
      name: 'Balanced',
      description: 'Good balance between latency and CPU usage',
      maxThreads: 4,
      bufferSize: 512,
      lowLatencyMode: false,
      rtPriority: false,
      guardBand: 10,
      isDefault: true
    },
    {
      id: 'perf2',
      name: 'Maximum performance',
      description: 'Uses all available CPU resources',
      maxThreads: 16,
      bufferSize: 1024,
      lowLatencyMode: false,
      rtPriority: true,
      guardBand: 20,
      isDefault: false
    },
    {
      id: 'perf3',
      name: 'Low Latency',
      description: 'Minimizes latency for live performance',
      maxThreads: 2,
      bufferSize: 128,
      lowLatencyMode: true,
      rtPriority: true,
      guardBand: 5,
      isDefault: false
    }
  ]);
  
  // State for system info
  const [systemInfo, setSystemInfo] = useState({
    cpuCores: 16,
    cpuThreads: 32,
    ramTotal: 32768,
    ramAvailable: 20480,
    audioInterface: 'ASIO - Focusrite USB ASIO',
    sampleRate: 48000,
    bitDepth: 24
  });
  
  // State for remote API endpoints
  const [remoteEndpoints, setRemoteEndpoints] = useState<RemoteEndpoint[]>([
    {
      id: 'api1',
      name: 'Get Status',
      path: '/api/status',
      method: 'GET',
      enabled: true,
      requiresAuth: false,
      description: 'Returns the current status of the audio processor'
    },
    {
      id: 'api2',
      name: 'Apply Preset',
      path: '/api/presets/:id/apply',
      method: 'POST',
      enabled: true,
      requiresAuth: true,
      description: 'Applies a preset by ID'
    },
    {
      id: 'api3',
      name: 'Adjust Parameter',
      path: '/api/parameters/:id',
      method: 'PUT',
      enabled: true,
      requiresAuth: true,
      description: 'Adjusts a specific parameter value'
    },
    {
      id: 'api4',
      name: 'Toggle Plugin',
      path: '/api/plugins/:id/toggle',
      method: 'POST',
      enabled: true,
      requiresAuth: true,
      description: 'Enables or disables a plugin'
    },
    {
      id: 'api5',
      name: 'Get Metrics',
      path: '/api/metrics',
      method: 'GET',
      enabled: true,
      requiresAuth: true,
      description: 'Retrieves performance metrics'
    }
  ]);
  
  // State for remote control settings
  const [remoteSettings, setRemoteSettings] = useState({
    enableRemoteControl: true,
    authRequired: true,
    listeningPort: 8080,
    allowExternalConnections: false,
    apiKey: 'sk-rJaLOP5fgH09Qlk785Trs',
    webhookURL: 'https://myserver.com/webhook/audio-processor'
  });
  
  // State for new plugin folder input
  const [newFolderPath, setNewFolderPath] = useState('');
  
  // State for current performance preset
  const [currentPreset, setCurrentPreset] = useState<string>('perf1');
  
  // State for active plugin format filter
  const [formatFilter, setFormatFilter] = useState<string>('all');
  
  // Function to add a new plugin folder
  const addPluginFolder = () => {
    if (newFolderPath.trim() && !pluginFolders.includes(newFolderPath)) {
      setPluginFolders([...pluginFolders, newFolderPath]);
      setNewFolderPath('');
    }
  };
  
  // Function to remove a plugin folder
  const removePluginFolder = (folder: string) => {
    setPluginFolders(pluginFolders.filter(f => f !== folder));
  };
  
  // Function to toggle plugin enabled status
  const togglePluginEnabled = (id: string) => {
    setPlugins(plugins.map(plugin => 
      plugin.id === id ? { ...plugin, enabled: !plugin.enabled } : plugin
    ));
  };
  
  // Function to toggle plugin favorite status
  const togglePluginFavorite = (id: string) => {
    setPlugins(plugins.map(plugin => 
      plugin.id === id ? { ...plugin, favorite: !plugin.favorite } : plugin
    ));
  };
  
  // Function to handle scan for plugins
  const scanForPlugins = () => {
    console.log('Scanning for plugins...');
    // In a real app, this would initiate a plugin scan
    const newScanResult: PluginScanResult = {
      timestamp: new Date().toLocaleString(),
      totalFound: plugins.length + 2,
      newFound: 2,
      failures: 1,
      duration: '36.2s'
    };
    
    setPluginScanResults([newScanResult, ...pluginScanResults]);
    
    // Add some mock new plugins
    const newPlugins: Plugin[] = [
      {
        id: `p${plugins.length + 1}`,
        name: 'Pro-L 2',
        format: 'VST3',
        version: '2.1.5',
        manufacturer: 'FabFilter',
        path: 'C:/Program Files/Common Files/VST3/FabFilter/Pro-L 2.vst3',
        enabled: true,
        favorite: false,
        lastScanned: new Date().toLocaleString(),
        parameters: 86
      },
      {
        id: `p${plugins.length + 2}`,
        name: 'Spire',
        format: 'VST',
        version: '1.5.10',
        manufacturer: 'Reveal Sound',
        path: 'C:/Program Files/Steinberg/VSTPlugins/Spire.dll',
        enabled: true,
        favorite: false,
        lastScanned: new Date().toLocaleString(),
        parameters: 214
      }
    ];
    
    setPlugins([...plugins, ...newPlugins]);
  };
  
  // Function to apply performance preset
  const applyPerformancePreset = (id: string) => {
    setCurrentPreset(id);
    
    // In a real app, this would actually apply the performance settings
    console.log(`Applied performance preset: ${id}`);
  };
  
  // Filter plugins based on format
  const filteredPlugins = formatFilter === 'all' 
    ? plugins 
    : plugins.filter(p => p.format === formatFilter);
  
  // Get the current performance preset
  const activePreset = performancePresets.find(p => p.id === currentPreset);
  
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-purple-500 flex items-center">
          <PlugIcon className="h-5 w-5 mr-2" />
          Plugin & System Integration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="plugins">
              <PlugIcon className="h-4 w-4 mr-2" />
              Plugins
            </TabsTrigger>
            <TabsTrigger value="performance">
              <Cpu className="h-4 w-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="application">
              <PanelLeft className="h-4 w-4 mr-2" />
              Application Mode
            </TabsTrigger>
            <TabsTrigger value="remote">
              <Globe className="h-4 w-4 mr-2" />
              Remote Control
            </TabsTrigger>
          </TabsList>
          
          {/* Plugins Tab */}
          <TabsContent value="plugins" className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="space-x-2">
                <Button variant="outline" onClick={scanForPlugins}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Scan for Plugins
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                <Label htmlFor="format-filter" className="text-sm">Format:</Label>
                <Select value={formatFilter} onValueChange={setFormatFilter}>
                  <SelectTrigger className="w-[120px] h-8">
                    <SelectValue placeholder="All Formats" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Formats</SelectItem>
                    <SelectItem value="VST">VST</SelectItem>
                    <SelectItem value="VST3">VST3</SelectItem>
                    <SelectItem value="AU">AU</SelectItem>
                    <SelectItem value="AAX">AAX</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Plugin Directories */}
              <div className="lg:col-span-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-gray-200">Plugin Directories</h3>
                </div>
                
                <div className="flex space-x-2">
                  <Input 
                    placeholder="Add new plugin directory..." 
                    className="bg-gray-950 border-gray-800"
                    value={newFolderPath}
                    onChange={(e) => setNewFolderPath(e.target.value)}
                  />
                  <Button size="sm" onClick={addPluginFolder}>
                    <FilePlus className="h-4 w-4" />
                  </Button>
                </div>
                
                <ScrollArea className="h-[300px] bg-gray-950 rounded-md border border-gray-800 p-2">
                  <div className="space-y-2">
                    {pluginFolders.map((folder, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-900 rounded-md">
                        <span className="text-sm text-gray-300 truncate max-w-[250px]">{folder}</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 w-7 p-0" 
                          onClick={() => removePluginFolder(folder)}
                        >
                          <Trash2 className="h-4 w-4 text-gray-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                <div className="bg-gray-950 rounded-md border border-gray-800 p-3">
                  <h4 className="text-sm font-medium text-gray-200 mb-2">Last Scan Results</h4>
                  {pluginScanResults.length > 0 ? (
                    <div className="space-y-2">
                      {pluginScanResults.slice(0, 3).map((result, index) => (
                        <div key={index} className="bg-gray-900 rounded-md p-2 text-xs">
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-400">{result.timestamp}</span>
                            <span className="text-gray-400">Duration: {result.duration}</span>
                          </div>
                          <div className="flex space-x-3">
                            <span className="text-gray-300">
                              Total: <span className="text-blue-400">{result.totalFound}</span>
                            </span>
                            <span className="text-gray-300">
                              New: <span className="text-green-400">{result.newFound}</span>
                            </span>
                            <span className="text-gray-300">
                              Failures: <span className="text-red-400">{result.failures}</span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 text-sm py-2">
                      No scan history available
                    </div>
                  )}
                </div>
              </div>
              
              {/* Plugin List */}
              <div className="lg:col-span-8">
                <h3 className="text-sm font-medium text-gray-200 mb-3">Available Plugins ({filteredPlugins.length})</h3>
                
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[200px]">Name</TableHead>
                        <TableHead>Format</TableHead>
                        <TableHead>Manufacturer</TableHead>
                        <TableHead>Version</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPlugins.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center h-24 text-gray-500">
                            No plugins found with the selected filter
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPlugins.map((plugin) => (
                          <TableRow key={plugin.id} className="border-gray-800">
                            <TableCell className="font-medium">
                              <div className="flex items-center">
                                <div className={`w-2 h-2 rounded-full mr-2 ${plugin.enabled ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                                <span className={plugin.favorite ? 'text-yellow-400' : 'text-gray-200'}>
                                  {plugin.name}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{plugin.format}</Badge>
                            </TableCell>
                            <TableCell>{plugin.manufacturer}</TableCell>
                            <TableCell>v{plugin.version}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => togglePluginFavorite(plugin.id)}
                                  title={plugin.favorite ? "Remove from favorites" : "Add to favorites"}
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill={plugin.favorite ? "currentColor" : "none"}
                                    stroke="currentColor"
                                    className={`h-4 w-4 ${plugin.favorite ? 'text-yellow-400' : 'text-gray-500'}`}
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                  </svg>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => togglePluginEnabled(plugin.id)}
                                  title={plugin.enabled ? "Disable plugin" : "Enable plugin"}
                                >
                                  {plugin.enabled ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-gray-500" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>
          
          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Performance Presets */}
              <div className="lg:col-span-5 space-y-3">
                <h3 className="text-sm font-medium text-gray-200">Performance Presets</h3>
                
                <div className="space-y-2">
                  {performancePresets.map((preset) => (
                    <div
                      key={preset.id}
                      className={`p-3 ${currentPreset === preset.id ? 'bg-gray-800 border-blue-500' : 'bg-gray-950 border-gray-800'} border rounded-md cursor-pointer transition-colors`}
                      onClick={() => applyPerformancePreset(preset.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-2 ${currentPreset === preset.id ? 'bg-blue-500' : 'bg-gray-600'}`}></div>
                          <h4 className="font-medium text-gray-200">{preset.name}</h4>
                        </div>
                        {preset.isDefault && (
                          <Badge variant="outline" className="text-xs">Default</Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-400 mt-1">{preset.description}</p>
                      
                      <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-gray-400">
                        <div>Threads: {preset.maxThreads}</div>
                        <div>Buffer: {preset.bufferSize} samples</div>
                        <div>Low Latency: {preset.lowLatencyMode ? 'Yes' : 'No'}</div>
                        <div>RT Priority: {preset.rtPriority ? 'Yes' : 'No'}</div>
                      </div>
                      
                      {currentPreset === preset.id && (
                        <Button size="sm" className="w-full mt-2" disabled>
                          Current Preset
                        </Button>
                      )}
                      {currentPreset !== preset.id && (
                        <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => applyPerformancePreset(preset.id)}>
                          Apply Preset
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Current Performance Settings */}
              <div className="lg:col-span-7 space-y-3">
                <h3 className="text-sm font-medium text-gray-200">Performance Configuration</h3>
                
                <div className="bg-gray-950 border border-gray-800 rounded-md p-4 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="cpu-threads">CPU Threads</Label>
                      <span className="text-sm text-gray-400">{activePreset?.maxThreads} / {systemInfo.cpuThreads}</span>
                    </div>
                    <Slider 
                      id="cpu-threads"
                      min={1} 
                      max={systemInfo.cpuThreads} 
                      step={1} 
                      value={[activePreset?.maxThreads || 4]}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-gray-500">
                      Controls how many CPU threads are used for audio processing.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="buffer-size">Buffer Size</Label>
                      <span className="text-sm text-gray-400">{activePreset?.bufferSize} samples</span>
                    </div>
                    <Select value={activePreset?.bufferSize.toString()}>
                      <SelectTrigger id="buffer-size">
                        <SelectValue placeholder="Select buffer size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="64">64 samples (1.3ms @ 48kHz)</SelectItem>
                        <SelectItem value="128">128 samples (2.7ms @ 48kHz)</SelectItem>
                        <SelectItem value="256">256 samples (5.3ms @ 48kHz)</SelectItem>
                        <SelectItem value="512">512 samples (10.7ms @ 48kHz)</SelectItem>
                        <SelectItem value="1024">1024 samples (21.3ms @ 48kHz)</SelectItem>
                        <SelectItem value="2048">2048 samples (42.7ms @ 48kHz)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      Smaller values reduce latency but increase CPU usage and risk of audio dropouts.
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="low-latency">Low Latency Mode</Label>
                      <p className="text-xs text-gray-500">
                        Optimizes for minimum latency at the expense of throughput
                      </p>
                    </div>
                    <Switch 
                      id="low-latency" 
                      checked={activePreset?.lowLatencyMode} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="rt-priority">Realtime Priority</Label>
                      <p className="text-xs text-gray-500">
                        Gives audio processing threads higher system priority
                      </p>
                    </div>
                    <Switch 
                      id="rt-priority" 
                      checked={activePreset?.rtPriority} 
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="bg-gray-900 p-3 rounded-md">
                    <h4 className="text-sm font-medium text-gray-200 mb-2">System Information</h4>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <div className="text-gray-400">CPU Cores:</div>
                      <div className="text-gray-300">{systemInfo.cpuCores} cores / {systemInfo.cpuThreads} threads</div>
                      
                      <div className="text-gray-400">RAM:</div>
                      <div className="text-gray-300">{systemInfo.ramTotal / 1024} GB ({systemInfo.ramAvailable / 1024} GB free)</div>
                      
                      <div className="text-gray-400">Audio Interface:</div>
                      <div className="text-gray-300">{systemInfo.audioInterface}</div>
                      
                      <div className="text-gray-400">Sample Rate:</div>
                      <div className="text-gray-300">{systemInfo.sampleRate / 1000} kHz / {systemInfo.bitDepth}-bit</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Application Mode Tab */}
          <TabsContent value="application" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Standalone Mode */}
              <div className="lg:col-span-6">
                <div className="bg-gray-950 border border-gray-800 rounded-md p-4">
                  <div className="flex items-center mb-4">
                    <PanelLeft className="h-5 w-5 mr-2 text-blue-500" />
                    <h3 className="text-lg font-medium text-gray-200">Standalone Mode</h3>
                  </div>
                  
                  <p className="text-sm text-gray-400 mb-4">
                    Configure how the application behaves when running as a standalone application.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Start Minimized</Label>
                        <p className="text-xs text-gray-500">
                          Start the application in minimized state
                        </p>
                      </div>
                      <Switch />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Show in System Tray</Label>
                        <p className="text-xs text-gray-500">
                          Show the application icon in the system tray
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Start with System</Label>
                        <p className="text-xs text-gray-500">
                          Automatically start the application with the operating system
                        </p>
                      </div>
                      <Switch />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Load Last Session</Label>
                        <p className="text-xs text-gray-500">
                          Automatically load the last saved session on startup
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Default Project Location</Label>
                      <div className="flex space-x-2">
                        <Input 
                          className="bg-gray-900 border-gray-800"
                          value="C:/Users/Admin/Documents/Audio Processor Projects"
                        />
                        <Button variant="secondary" size="sm">
                          Browse
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="bg-gray-900 p-3 rounded-md mb-4">
                    <h4 className="text-sm font-medium text-gray-200 mb-2">Standalone Features</h4>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-center text-gray-300">
                        <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-green-500" />
                        Full UI with complete control panel
                      </li>
                      <li className="flex items-center text-gray-300">
                        <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-green-500" />
                        Project save/load functionality
                      </li>
                      <li className="flex items-center text-gray-300">
                        <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-green-500" />
                        MIDI controller mapping
                      </li>
                      <li className="flex items-center text-gray-300">
                        <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-green-500" />
                        Multiple I/O configuration
                      </li>
                    </ul>
                  </div>
                  
                  <Button className="w-full">
                    Apply Standalone Settings
                  </Button>
                </div>
              </div>
              
              {/* Plugin Mode */}
              <div className="lg:col-span-6">
                <div className="bg-gray-950 border border-gray-800 rounded-md p-4">
                  <div className="flex items-center mb-4">
                    <PlugIcon className="h-5 w-5 mr-2 text-purple-500" />
                    <h3 className="text-lg font-medium text-gray-200">Plugin Mode</h3>
                  </div>
                  
                  <p className="text-sm text-gray-400 mb-4">
                    Configure how the processor behaves when loaded as a plugin in a host application.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <Label>Plugin Formats</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="vst2" className="rounded text-blue-500" defaultChecked />
                          <label htmlFor="vst2" className="text-sm text-gray-300">VST2</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="vst3" className="rounded text-blue-500" defaultChecked />
                          <label htmlFor="vst3" className="text-sm text-gray-300">VST3</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="au" className="rounded text-blue-500" defaultChecked />
                          <label htmlFor="au" className="text-sm text-gray-300">AU (Mac only)</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="aax" className="rounded text-blue-500" />
                          <label htmlFor="aax" className="text-sm text-gray-300">AAX (Pro Tools)</label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Use Fixed Buffer Size</Label>
                        <p className="text-xs text-gray-500">
                          Override host buffer size with fixed value
                        </p>
                      </div>
                      <Switch />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Sync to Host Tempo</Label>
                        <p className="text-xs text-gray-500">
                          Synchronize time-based effects to host tempo
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Reduced UI Mode</Label>
                        <p className="text-xs text-gray-500">
                          Use a more compact UI when loaded as a plugin
                        </p>
                      </div>
                      <Switch />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Plugin Parameter Automation</Label>
                      <Select defaultValue="all">
                        <SelectTrigger>
                          <SelectValue placeholder="Select automation mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Parameters</SelectItem>
                          <SelectItem value="main">Main Parameters Only</SelectItem>
                          <SelectItem value="custom">Custom Selection</SelectItem>
                          <SelectItem value="none">No Automation</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">
                        Controls which parameters can be automated by the host DAW
                      </p>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="bg-gray-900 p-3 rounded-md mb-4">
                    <h4 className="text-sm font-medium text-gray-200 mb-2">Plugin Identifier Information</h4>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-gray-400">VST3 UUID:</div>
                      <div className="text-gray-300 col-span-2 font-mono">550e8400-e29b-41d4-a716-446655440000</div>
                      
                      <div className="text-gray-400">VST2 ID:</div>
                      <div className="text-gray-300 col-span-2 font-mono">APrc</div>
                      
                      <div className="text-gray-400">AU Bundle ID:</div>
                      <div className="text-gray-300 col-span-2 font-mono">com.qcaller.audioprocessor</div>
                    </div>
                  </div>
                  
                  <Button className="w-full">
                    Apply Plugin Settings
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Remote Control Tab */}
          <TabsContent value="remote" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Remote control settings */}
              <div className="lg:col-span-5 space-y-3">
                <h3 className="text-sm font-medium text-gray-200">Remote Control Configuration</h3>
                
                <div className="bg-gray-950 border border-gray-800 rounded-md p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="enable-remote">Enable Remote Control</Label>
                      <p className="text-xs text-gray-500">
                        Allow remote control via HTTP API
                      </p>
                    </div>
                    <Switch 
                      id="enable-remote" 
                      checked={remoteSettings.enableRemoteControl}
                      onCheckedChange={(checked) => 
                        setRemoteSettings({...remoteSettings, enableRemoteControl: checked})
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auth-required">Authentication Required</Label>
                      <p className="text-xs text-gray-500">
                        Require API key for all remote requests
                      </p>
                    </div>
                    <Switch 
                      id="auth-required" 
                      checked={remoteSettings.authRequired}
                      onCheckedChange={(checked) => 
                        setRemoteSettings({...remoteSettings, authRequired: checked})
                      }
                      disabled={!remoteSettings.enableRemoteControl}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="port">Listening Port</Label>
                    <Input 
                      id="port"
                      type="number" 
                      value={remoteSettings.listeningPort}
                      onChange={(e) => 
                        setRemoteSettings({
                          ...remoteSettings, 
                          listeningPort: parseInt(e.target.value) || 8080
                        })
                      }
                      min={1024}
                      max={65535}
                      className="bg-gray-900 border-gray-800"
                      disabled={!remoteSettings.enableRemoteControl}
                    />
                    <p className="text-xs text-gray-500">
                      Port on which the remote control server will listen
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="external-conn">Allow External Connections</Label>
                      <p className="text-xs text-gray-500">
                        Allow connections from outside the local network
                      </p>
                    </div>
                    <Switch 
                      id="external-conn" 
                      checked={remoteSettings.allowExternalConnections}
                      onCheckedChange={(checked) => 
                        setRemoteSettings({...remoteSettings, allowExternalConnections: checked})
                      }
                      disabled={!remoteSettings.enableRemoteControl}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="api-key">API Key</Label>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-6 text-xs"
                        disabled={!remoteSettings.enableRemoteControl || !remoteSettings.authRequired}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Generate New
                      </Button>
                    </div>
                    <div className="relative">
                      <Input 
                        id="api-key"
                        type="password" 
                        value={remoteSettings.apiKey}
                        className="bg-gray-900 border-gray-800 pr-10"
                        disabled={!remoteSettings.enableRemoteControl || !remoteSettings.authRequired}
                      />
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="absolute right-0 top-0 h-full"
                        disabled={!remoteSettings.enableRemoteControl || !remoteSettings.authRequired}
                      >
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor" 
                          className="h-4 w-4"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="webhook-url">Webhook URL (Optional)</Label>
                    <Input 
                      id="webhook-url"
                      placeholder="https://your-server.com/webhook" 
                      value={remoteSettings.webhookURL}
                      onChange={(e) => 
                        setRemoteSettings({...remoteSettings, webhookURL: e.target.value})
                      }
                      className="bg-gray-900 border-gray-800"
                      disabled={!remoteSettings.enableRemoteControl}
                    />
                    <p className="text-xs text-gray-500">
                      URL to which state change events will be sent
                    </p>
                  </div>
                  
                  <Button 
                    className="w-full"
                    disabled={!remoteSettings.enableRemoteControl}
                  >
                    Apply Remote Control Settings
                  </Button>
                </div>
              </div>
              
              {/* API Endpoints */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-gray-200">Available API Endpoints</h3>
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        API Help
                      </Button>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-96">
                      <div className="space-y-2">
                        <h4 className="font-medium">API Usage Information</h4>
                        <p className="text-sm">
                          All endpoints are available at <code className="text-xs bg-gray-900 px-1 py-0.5 rounded">http://localhost:{remoteSettings.listeningPort}/api/...</code>
                        </p>
                        <p className="text-sm">
                          When authentication is enabled, include the API key in the header:
                          <code className="text-xs block bg-gray-900 p-1 mt-1 rounded">X-API-Key: your-api-key</code>
                        </p>
                        <p className="text-sm">
                          All responses are in JSON format with HTTP status codes.
                        </p>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </div>
                
                <ScrollArea className="h-[450px] bg-gray-950 border border-gray-800 rounded-md p-4">
                  <Accordion type="multiple" className="w-full">
                    {remoteEndpoints.map((endpoint) => (
                      <AccordionItem key={endpoint.id} value={endpoint.id}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center">
                            <Badge className={`mr-2 ${
                              endpoint.method === 'GET' ? 'bg-blue-900 hover:bg-blue-900' :
                              endpoint.method === 'POST' ? 'bg-green-900 hover:bg-green-900' :
                              endpoint.method === 'PUT' ? 'bg-yellow-900 hover:bg-yellow-900' :
                              'bg-red-900 hover:bg-red-900'
                            }`}>
                              {endpoint.method}
                            </Badge>
                            <span className="text-sm font-mono text-gray-300">{endpoint.path}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="pl-6 border-l border-gray-800 space-y-3 py-2">
                            <div>
                              <h4 className="text-sm font-medium text-gray-300">{endpoint.name}</h4>
                              <p className="text-sm text-gray-400 mt-1">{endpoint.description}</p>
                            </div>
                            
                            <div className="flex space-x-4 text-sm">
                              <div className="flex items-center">
                                <Clock className="h-3.5 w-3.5 mr-1 text-gray-500" />
                                <span className="text-gray-400">
                                  Authentication: {endpoint.requiresAuth ? 'Required' : 'Optional'}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <span className={`h-2 w-2 rounded-full mr-1 ${endpoint.enabled ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                <span className="text-gray-400">
                                  Status: {endpoint.enabled ? 'Enabled' : 'Disabled'}
                                </span>
                              </div>
                            </div>
                            
                            {endpoint.method !== 'GET' && (
                              <div className="bg-gray-900 p-2 rounded-md">
                                <h5 className="text-xs font-medium text-gray-400">Example Request Body:</h5>
                                <pre className="text-xs font-mono text-gray-300 mt-1 overflow-x-auto p-1">
                                  {endpoint.method === 'POST' && endpoint.path.includes('presets') && 
                                    `{\n  "presetId": "preset-123"\n}`
                                  }
                                  {endpoint.method === 'PUT' && endpoint.path.includes('parameters') && 
                                    `{\n  "value": 0.75,\n  "normalized": true\n}`
                                  }
                                  {endpoint.method === 'POST' && endpoint.path.includes('toggle') && 
                                    `{\n  "enabled": true\n}`
                                  }
                                </pre>
                              </div>
                            )}
                            
                            <div className="bg-gray-900 p-2 rounded-md">
                              <h5 className="text-xs font-medium text-gray-400">Example Response:</h5>
                              <pre className="text-xs font-mono text-gray-300 mt-1 overflow-x-auto p-1">
                                {endpoint.path.includes('status') && 
                                  `{\n  "status": "running",\n  "cpu_usage": 23.5,\n  "active_plugins": 4,\n  "latency": 4.2\n}`
                                }
                                {endpoint.path.includes('presets') && 
                                  `{\n  "success": true,\n  "preset": {\n    "id": "preset-123",\n    "name": "Studio Preset"\n  }\n}`
                                }
                                {endpoint.path.includes('parameters') && 
                                  `{\n  "id": "param-456",\n  "value": 0.75,\n  "real_value": "-12.5 dB"\n}`
                                }
                                {endpoint.path.includes('toggle') && 
                                  `{\n  "plugin_id": "plugin-789",\n  "enabled": true\n}`
                                }
                                {endpoint.path.includes('metrics') && 
                                  `{\n  "system": {\n    "cpu": 45.2,\n    "ram": 1.7,\n    "load": 0.56\n  },\n  "audio": {\n    "peaks": [-6.2, -5.8],\n    "lufs": -14.2\n  }\n}`
                                }
                              </pre>
                            </div>
                            
                            <div className="flex justify-between pt-2">
                              <div className="flex items-center">
                                <Switch 
                                  id={`endpoint-${endpoint.id}`} 
                                  checked={endpoint.enabled}
                                  disabled={!remoteSettings.enableRemoteControl}
                                  className="mr-2"
                                />
                                <Label htmlFor={`endpoint-${endpoint.id}`} className="text-sm text-gray-300">
                                  {endpoint.enabled ? 'Enabled' : 'Disabled'}
                                </Label>
                              </div>
                              
                              <Button 
                                variant="ghost" 
                                size="sm"
                                disabled={!remoteSettings.enableRemoteControl}
                              >
                                <TerminalSquare className="h-3.5 w-3.5 mr-1" />
                                Test Endpoint
                              </Button>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                  
                  <div className="mt-4 pt-4 border-t border-gray-800">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      disabled={!remoteSettings.enableRemoteControl}
                    >
                      <Database className="h-4 w-4 mr-2" />
                      Generate API Documentation
                    </Button>
                  </div>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PluginSystemSection;
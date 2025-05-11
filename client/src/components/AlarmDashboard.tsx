import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Bell, 
  CheckCircle, 
  Clock, 
  Filter, 
  Search,
  Thermometer,
  Volume2,
  Zap,
  Server,
  Wifi,
  X,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Info
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Alarm, 
  AlarmSeverity, 
  AlarmCategory, 
  sortAlarmsByPriority,
  filterAlarms,
  getAlarmSeverityColor,
  getAlarmSeverityBgColor,
  getAlarmSeverityAnimation,
  getAlarmSeverityLabel,
  checkTransmitterAlarms
} from '@/lib/alarmPrioritization';
import { format } from 'date-fns';

interface AlarmDashboardProps {
  transmitters: any[];
  onAcknowledgeAlarm: (alarmId: number) => void;
  onResolveAlarm: (alarmId: number, notes?: string) => void;
  onClearAlarm: (alarmId: number) => void;
}

const AlarmDashboard: React.FC<AlarmDashboardProps> = ({
  transmitters,
  onAcknowledgeAlarm,
  onResolveAlarm,
  onClearAlarm
}) => {
  // Generate alarms from transmitters
  const generateAlarms = () => {
    let allAlarms: Alarm[] = [];
    
    for (const transmitter of transmitters) {
      const transmitterAlarms = checkTransmitterAlarms(transmitter);
      allAlarms = [...allAlarms, ...transmitterAlarms];
    }
    
    return sortAlarmsByPriority(allAlarms);
  };
  
  const [alarms, setAlarms] = useState<Alarm[]>(generateAlarms());
  const [selectedSeverities, setSelectedSeverities] = useState<AlarmSeverity[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<AlarmCategory[]>([]);
  const [showAcknowledged, setShowAcknowledged] = useState<boolean | undefined>(undefined);
  const [showResolved, setShowResolved] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlarm, setSelectedAlarm] = useState<Alarm | null>(null);
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);
  const [resolveNotes, setResolveNotes] = useState('');
  const [currentTab, setCurrentTab] = useState('active');
  
  // Update alarms when transmitters change
  useEffect(() => {
    setAlarms(generateAlarms());
    // In a real application, we'd also set up a websocket or polling mechanism
    // to receive alarm updates from the server
    
    // Simulate realtime updates with a timer for demo purposes
    const timer = setInterval(() => {
      setAlarms(generateAlarms());
    }, 10000); // Update alarms every 10 seconds
    
    return () => clearInterval(timer);
  }, [transmitters]);
  
  // Filter alarms based on current filters
  const filteredAlarms = filterAlarms(alarms, {
    severity: selectedSeverities.length > 0 ? selectedSeverities : undefined,
    category: selectedCategories.length > 0 ? selectedCategories : undefined,
    acknowledged: showAcknowledged,
    resolved: showResolved,
    search: searchQuery,
  });
  
  // Get counts for each status tab
  const activeAlarms = alarms.filter(a => !a.acknowledged && !a.resolved);
  const acknowledgedAlarms = alarms.filter(a => a.acknowledged && !a.resolved);
  const resolvedAlarms = alarms.filter(a => a.resolved);
  
  // Group alarms by severity for active alarms view
  const alarmsByTransmitter = activeAlarms.reduce((groups: Record<number, Alarm[]>, alarm) => {
    if (!groups[alarm.transmitterId]) {
      groups[alarm.transmitterId] = [];
    }
    groups[alarm.transmitterId].push(alarm);
    return groups;
  }, {});
  
  // Get the transmitter by ID
  const getTransmitterById = (id: number) => {
    return transmitters.find(t => t.id === id);
  };
  
  // Handle acknowledge
  const handleAcknowledge = (alarm: Alarm) => {
    onAcknowledgeAlarm(alarm.id);
    
    // Optimistic update for UI
    setAlarms(prevAlarms => 
      prevAlarms.map(a => 
        a.id === alarm.id ? { ...a, acknowledged: true } : a
      )
    );
  };
  
  // Handle resolve dialog
  const openResolveDialog = (alarm: Alarm) => {
    setSelectedAlarm(alarm);
    setResolveNotes('');
    setIsResolveDialogOpen(true);
  };
  
  // Handle resolve
  const handleResolve = () => {
    if (selectedAlarm) {
      onResolveAlarm(selectedAlarm.id, resolveNotes);
      
      // Optimistic update for UI
      setAlarms(prevAlarms => 
        prevAlarms.map(a => 
          a.id === selectedAlarm.id ? { 
            ...a, 
            resolved: true, 
            acknowledged: true,
            notes: resolveNotes || a.notes
          } : a
        )
      );
      
      setIsResolveDialogOpen(false);
      setSelectedAlarm(null);
    }
  };
  
  // Handle clear (only for demo)
  const handleClear = (alarm: Alarm) => {
    onClearAlarm(alarm.id);
    
    // Optimistic update for UI
    setAlarms(prevAlarms => 
      prevAlarms.filter(a => a.id !== alarm.id)
    );
  };
  
  // Get icon for alarm category
  const getCategoryIcon = (category: AlarmCategory) => {
    switch (category) {
      case AlarmCategory.POWER:
        return <Zap className="h-4 w-4" />;
      case AlarmCategory.AUDIO:
        return <Volume2 className="h-4 w-4" />;
      case AlarmCategory.THERMAL:
        return <Thermometer className="h-4 w-4" />;
      case AlarmCategory.CONNECTION:
        return <Wifi className="h-4 w-4" />;
      case AlarmCategory.HARDWARE:
        return <Server className="h-4 w-4" />;
      case AlarmCategory.SYSTEM:
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };
  
  // Format time relative to now
  const formatTime = (date: Date) => {
    return format(date, 'HH:mm:ss - MMM d, yyyy');
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-start">
        <Card className="flex-1 bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Alarm Dashboard
                </CardTitle>
                <CardDescription>
                  Monitor and manage all transmitter alarms
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {activeAlarms.length > 0 && (
                  <div className={`flex items-center gap-1 px-2 py-1 rounded ${
                    activeAlarms.some(a => a.severity === AlarmSeverity.CRITICAL) 
                      ? 'bg-red-950 text-red-200' 
                      : 'bg-gray-800 text-gray-200'
                  }`}>
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">{activeAlarms.length} Active</span>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pb-0">
            {/* Filters */}
            <div className="space-y-2 mb-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search alarms..."
                    className="pl-9 bg-gray-900 border-gray-700 text-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Select
                    value="severity"
                    onValueChange={() => {}}
                  >
                    <SelectTrigger className="w-[120px] bg-gray-900 border-gray-700 text-white">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-gray-400" />
                        <SelectValue placeholder="Severity" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700 text-white">
                      <SelectItem value="severity">Severity</SelectItem>
                      <SelectItem
                        value={AlarmSeverity.CRITICAL}
                        onClick={() => {
                          setSelectedSeverities(prev => 
                            prev.includes(AlarmSeverity.CRITICAL)
                              ? prev.filter(s => s !== AlarmSeverity.CRITICAL)
                              : [...prev, AlarmSeverity.CRITICAL]
                          );
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            checked={selectedSeverities.includes(AlarmSeverity.CRITICAL)}
                            readOnly
                          />
                          <span className="text-red-500">Critical</span>
                        </div>
                      </SelectItem>
                      <SelectItem
                        value={AlarmSeverity.HIGH}
                        onClick={() => {
                          setSelectedSeverities(prev => 
                            prev.includes(AlarmSeverity.HIGH)
                              ? prev.filter(s => s !== AlarmSeverity.HIGH)
                              : [...prev, AlarmSeverity.HIGH]
                          );
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            checked={selectedSeverities.includes(AlarmSeverity.HIGH)}
                            readOnly
                          />
                          <span className="text-orange-500">High</span>
                        </div>
                      </SelectItem>
                      <SelectItem
                        value={AlarmSeverity.MEDIUM}
                        onClick={() => {
                          setSelectedSeverities(prev => 
                            prev.includes(AlarmSeverity.MEDIUM)
                              ? prev.filter(s => s !== AlarmSeverity.MEDIUM)
                              : [...prev, AlarmSeverity.MEDIUM]
                          );
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            checked={selectedSeverities.includes(AlarmSeverity.MEDIUM)}
                            readOnly
                          />
                          <span className="text-yellow-500">Medium</span>
                        </div>
                      </SelectItem>
                      <SelectItem
                        value={AlarmSeverity.LOW}
                        onClick={() => {
                          setSelectedSeverities(prev => 
                            prev.includes(AlarmSeverity.LOW)
                              ? prev.filter(s => s !== AlarmSeverity.LOW)
                              : [...prev, AlarmSeverity.LOW]
                          );
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            checked={selectedSeverities.includes(AlarmSeverity.LOW)}
                            readOnly
                          />
                          <span className="text-blue-500">Low</span>
                        </div>
                      </SelectItem>
                      <SelectItem
                        value={AlarmSeverity.INFO}
                        onClick={() => {
                          setSelectedSeverities(prev => 
                            prev.includes(AlarmSeverity.INFO)
                              ? prev.filter(s => s !== AlarmSeverity.INFO)
                              : [...prev, AlarmSeverity.INFO]
                          );
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            checked={selectedSeverities.includes(AlarmSeverity.INFO)}
                            readOnly
                          />
                          <span className="text-gray-500">Info</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value="category"
                    onValueChange={() => {}}
                  >
                    <SelectTrigger className="w-[120px] bg-gray-900 border-gray-700 text-white">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-gray-400" />
                        <SelectValue placeholder="Category" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-700 text-white">
                      <SelectItem value="category">Category</SelectItem>
                      <SelectItem
                        value={AlarmCategory.POWER}
                        onClick={() => {
                          setSelectedCategories(prev => 
                            prev.includes(AlarmCategory.POWER)
                              ? prev.filter(c => c !== AlarmCategory.POWER)
                              : [...prev, AlarmCategory.POWER]
                          );
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            checked={selectedCategories.includes(AlarmCategory.POWER)}
                            readOnly
                          />
                          <Zap className="h-4 w-4 text-yellow-500" />
                          <span>Power</span>
                        </div>
                      </SelectItem>
                      <SelectItem
                        value={AlarmCategory.AUDIO}
                        onClick={() => {
                          setSelectedCategories(prev => 
                            prev.includes(AlarmCategory.AUDIO)
                              ? prev.filter(c => c !== AlarmCategory.AUDIO)
                              : [...prev, AlarmCategory.AUDIO]
                          );
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            checked={selectedCategories.includes(AlarmCategory.AUDIO)}
                            readOnly
                          />
                          <Volume2 className="h-4 w-4 text-blue-500" />
                          <span>Audio</span>
                        </div>
                      </SelectItem>
                      <SelectItem
                        value={AlarmCategory.THERMAL}
                        onClick={() => {
                          setSelectedCategories(prev => 
                            prev.includes(AlarmCategory.THERMAL)
                              ? prev.filter(c => c !== AlarmCategory.THERMAL)
                              : [...prev, AlarmCategory.THERMAL]
                          );
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            checked={selectedCategories.includes(AlarmCategory.THERMAL)}
                            readOnly
                          />
                          <Thermometer className="h-4 w-4 text-red-500" />
                          <span>Thermal</span>
                        </div>
                      </SelectItem>
                      <SelectItem
                        value={AlarmCategory.CONNECTION}
                        onClick={() => {
                          setSelectedCategories(prev => 
                            prev.includes(AlarmCategory.CONNECTION)
                              ? prev.filter(c => c !== AlarmCategory.CONNECTION)
                              : [...prev, AlarmCategory.CONNECTION]
                          );
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            checked={selectedCategories.includes(AlarmCategory.CONNECTION)}
                            readOnly
                          />
                          <Wifi className="h-4 w-4 text-green-500" />
                          <span>Connection</span>
                        </div>
                      </SelectItem>
                      <SelectItem
                        value={AlarmCategory.HARDWARE}
                        onClick={() => {
                          setSelectedCategories(prev => 
                            prev.includes(AlarmCategory.HARDWARE)
                              ? prev.filter(c => c !== AlarmCategory.HARDWARE)
                              : [...prev, AlarmCategory.HARDWARE]
                          );
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            checked={selectedCategories.includes(AlarmCategory.HARDWARE)}
                            readOnly
                          />
                          <Server className="h-4 w-4 text-purple-500" />
                          <span>Hardware</span>
                        </div>
                      </SelectItem>
                      <SelectItem
                        value={AlarmCategory.SYSTEM}
                        onClick={() => {
                          setSelectedCategories(prev => 
                            prev.includes(AlarmCategory.SYSTEM)
                              ? prev.filter(c => c !== AlarmCategory.SYSTEM)
                              : [...prev, AlarmCategory.SYSTEM]
                          );
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            checked={selectedCategories.includes(AlarmCategory.SYSTEM)}
                            readOnly
                          />
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                          <span>System</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {selectedSeverities.length > 0 && (
                  <div className="flex items-center gap-1">
                    {selectedSeverities.map((severity) => (
                      <Badge 
                        key={severity}
                        variant="outline"
                        className={`${getAlarmSeverityColor(severity)} border-current flex items-center gap-1`}
                      >
                        {getAlarmSeverityLabel(severity)}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => setSelectedSeverities(prev => prev.filter(s => s !== severity))}
                        />
                      </Badge>
                    ))}
                    
                    {selectedSeverities.length > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 px-2 text-xs hover:bg-gray-800"
                        onClick={() => setSelectedSeverities([])}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                )}
                
                {selectedCategories.length > 0 && (
                  <div className="flex items-center gap-1">
                    {selectedCategories.map((category) => (
                      <Badge 
                        key={category}
                        variant="outline"
                        className="border-gray-600 flex items-center gap-1"
                      >
                        {getCategoryIcon(category)}
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => setSelectedCategories(prev => prev.filter(c => c !== category))}
                        />
                      </Badge>
                    ))}
                    
                    {selectedCategories.length > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 px-2 text-xs hover:bg-gray-800"
                        onClick={() => setSelectedCategories([])}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <Tabs value={currentTab} onValueChange={setCurrentTab}>
              <TabsList className="bg-gray-900 border border-gray-800">
                <TabsTrigger 
                  value="active" 
                  className="relative data-[state=active]:bg-gray-800"
                >
                  Active
                  {activeAlarms.length > 0 && (
                    <Badge 
                      className={`ml-2 ${
                        activeAlarms.some(a => a.severity === AlarmSeverity.CRITICAL)
                          ? 'bg-red-700 text-white'
                          : 'bg-gray-700'
                      }`}
                    >
                      {activeAlarms.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="acknowledged" 
                  className="data-[state=active]:bg-gray-800"
                >
                  Acknowledged
                  {acknowledgedAlarms.length > 0 && (
                    <Badge className="ml-2 bg-gray-700">{acknowledgedAlarms.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="resolved" 
                  className="data-[state=active]:bg-gray-800"
                >
                  Resolved
                  {resolvedAlarms.length > 0 && (
                    <Badge className="ml-2 bg-gray-700">{resolvedAlarms.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="all" 
                  className="data-[state=active]:bg-gray-800"
                >
                  All Alarms
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="active" className="mt-4">
                {activeAlarms.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <CheckCircle className="mx-auto h-10 w-10 mb-2 text-green-500 opacity-50" />
                    <p>No active alarms. All systems nominal.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <ScrollArea className="h-[400px] pr-4">
                      <Accordion
                        type="multiple"
                        className="space-y-2"
                        defaultValue={Object.keys(alarmsByTransmitter)}
                      >
                        {Object.entries(alarmsByTransmitter).map(([transmitterId, transmitterAlarms]) => {
                          const transmitter = getTransmitterById(parseInt(transmitterId));
                          if (!transmitter) return null;
                          
                          const hasCritical = transmitterAlarms.some(a => a.severity === AlarmSeverity.CRITICAL);
                          
                          return (
                            <AccordionItem 
                              key={transmitterId} 
                              value={transmitterId}
                              className={`border ${hasCritical ? 'border-red-800 bg-red-950/30' : 'border-gray-800 bg-gray-900'} rounded-md`}
                            >
                              <AccordionTrigger className={`px-4 py-2 hover:bg-gray-800/50 rounded-t-md ${hasCritical ? 'text-red-300' : ''}`}>
                                <div className="flex items-center gap-2 text-left">
                                  <div className={`w-2 h-2 rounded-full ${
                                    hasCritical ? 'bg-red-500' : 'bg-yellow-500'
                                  }`}></div>
                                  <span className="font-medium">{transmitter.siteName}</span>
                                  <span className="text-sm text-gray-400">{transmitter.frequency} MHz</span>
                                  <Badge variant="outline" className={`ml-auto ${hasCritical ? 'border-red-700' : 'border-gray-700'}`}>
                                    {transmitterAlarms.length} {transmitterAlarms.length === 1 ? 'alarm' : 'alarms'}
                                  </Badge>
                                </div>
                              </AccordionTrigger>
                              
                              <AccordionContent className="px-0 pt-0 pb-0">
                                <div className="border-t border-gray-800">
                                  {transmitterAlarms.map((alarm, idx) => (
                                    <div 
                                      key={alarm.id} 
                                      className={`p-3 flex flex-col ${
                                        idx !== transmitterAlarms.length - 1 ? 'border-b border-gray-800' : ''
                                      } ${getAlarmSeverityAnimation(alarm.severity)}`}
                                    >
                                      <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                          <div className={`p-1.5 rounded ${getAlarmSeverityBgColor(alarm.severity)}`}>
                                            {getCategoryIcon(alarm.category)}
                                          </div>
                                          <div>
                                            <div className="flex items-center">
                                              <h4 className={`font-medium ${getAlarmSeverityColor(alarm.severity)}`}>
                                                {getAlarmSeverityLabel(alarm.severity)}
                                              </h4>
                                              <span className="text-xs text-gray-400 ml-2">
                                                <Clock className="inline-block h-3 w-3 mr-1" />
                                                {formatTime(alarm.timestamp)}
                                              </span>
                                            </div>
                                            <p className="text-sm mt-1">{alarm.message}</p>
                                            {alarm.value !== undefined && alarm.threshold !== undefined && (
                                              <p className="text-xs text-gray-400 mt-1">
                                                Value: {alarm.value} (Threshold: {alarm.threshold})
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-green-800 text-green-400 hover:bg-green-950 hover:text-green-300"
                                            onClick={() => handleAcknowledge(alarm)}
                                          >
                                            <Bell className="h-4 w-4 mr-1" />
                                            Acknowledge
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-blue-800 text-blue-400 hover:bg-blue-950 hover:text-blue-300"
                                            onClick={() => openResolveDialog(alarm)}
                                          >
                                            <CheckCircle className="h-4 w-4 mr-1" />
                                            Resolve
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    </ScrollArea>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="acknowledged" className="mt-4">
                <AcknowledgedAlarmsTab 
                  alarms={acknowledgedAlarms} 
                  transmitters={transmitters}
                  onResolve={openResolveDialog}
                  getCategoryIcon={getCategoryIcon}
                  formatTime={formatTime}
                />
              </TabsContent>
              
              <TabsContent value="resolved" className="mt-4">
                <ResolvedAlarmsTab 
                  alarms={resolvedAlarms} 
                  transmitters={transmitters}
                  onClear={handleClear}
                  getCategoryIcon={getCategoryIcon}
                  formatTime={formatTime}
                />
              </TabsContent>
              
              <TabsContent value="all" className="mt-4">
                <AllAlarmsTab 
                  alarms={alarms}
                  filteredAlarms={filteredAlarms} 
                  transmitters={transmitters}
                  showAcknowledged={showAcknowledged}
                  setShowAcknowledged={setShowAcknowledged}
                  showResolved={showResolved}
                  setShowResolved={setShowResolved}
                  onAcknowledge={handleAcknowledge}
                  onResolve={openResolveDialog}
                  onClear={handleClear}
                  getCategoryIcon={getCategoryIcon}
                  formatTime={formatTime}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
          
          <CardFooter className="pt-4 pb-4 flex justify-between">
            <div className="text-sm text-gray-400">
              {currentTab === 'all' ? filteredAlarms.length : (
                currentTab === 'active' ? activeAlarms.length : (
                  currentTab === 'acknowledged' ? acknowledgedAlarms.length : resolvedAlarms.length
                )
              )} {currentTab === 'all' ? 'filtered' : currentTab} alarm{
                (currentTab === 'all' ? filteredAlarms.length : (
                  currentTab === 'active' ? activeAlarms.length : (
                    currentTab === 'acknowledged' ? acknowledgedAlarms.length : resolvedAlarms.length
                  )
                )) !== 1 ? 's' : ''
              }
            </div>
            <div>
              {currentTab === 'all' && selectedSeverities.length === 0 && selectedCategories.length === 0 && !searchQuery && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-sm border-gray-700"
                  onClick={() => {
                    setShowAcknowledged(undefined);
                    setShowResolved(false);
                  }}
                >
                  Reset Filters
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
      
      {/* Resolve Dialog */}
      <Dialog open={isResolveDialogOpen} onOpenChange={setIsResolveDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Resolve Alarm
            </DialogTitle>
            <DialogDescription>
              {selectedAlarm && (
                <div className="text-gray-400">
                  {selectedAlarm.message} - {getTransmitterById(selectedAlarm.transmitterId)?.siteName}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Resolution Notes</label>
              <Textarea
                placeholder="Enter details about how the issue was resolved..."
                className="bg-gray-800 border-gray-700 min-h-[120px]"
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setIsResolveDialogOpen(false)}
              className="border-gray-700"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleResolve}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Component for Acknowledged Alarms Tab
const AcknowledgedAlarmsTab: React.FC<{
  alarms: Alarm[];
  transmitters: any[];
  onResolve: (alarm: Alarm) => void;
  getCategoryIcon: (category: AlarmCategory) => JSX.Element;
  formatTime: (date: Date) => string;
}> = ({ alarms, transmitters, onResolve, getCategoryIcon, formatTime }) => {
  const getTransmitterById = (id: number) => {
    return transmitters.find(t => t.id === id);
  };
  
  return (
    <div>
      {alarms.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <Bell className="mx-auto h-10 w-10 mb-2 text-gray-500 opacity-50" />
          <p>No acknowledged alarms.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <ScrollArea className="h-[400px] pr-4">
            <Table>
              <TableHeader className="bg-gray-900">
                <TableRow className="border-gray-800 hover:bg-gray-900">
                  <TableHead className="text-gray-400">Severity</TableHead>
                  <TableHead className="text-gray-400">Type</TableHead>
                  <TableHead className="text-gray-400">Transmitter</TableHead>
                  <TableHead className="text-gray-400">Message</TableHead>
                  <TableHead className="text-gray-400">Time</TableHead>
                  <TableHead className="text-right text-gray-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alarms.map((alarm) => {
                  const transmitter = getTransmitterById(alarm.transmitterId);
                  
                  return (
                    <TableRow key={alarm.id} className="border-gray-800 hover:bg-gray-850">
                      <TableCell>
                        <Badge className={`${getAlarmSeverityBgColor(alarm.severity)} text-xs font-normal`}>
                          {getAlarmSeverityLabel(alarm.severity)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(alarm.category)}
                          <span className="capitalize text-sm">{alarm.category}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {transmitter?.siteName}
                        <div className="text-xs text-gray-400">{transmitter?.frequency} MHz</div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate">{alarm.message}</div>
                        {alarm.value !== undefined && alarm.threshold !== undefined && (
                          <div className="text-xs text-gray-400">
                            Value: {alarm.value} (Threshold: {alarm.threshold})
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-400">{formatTime(alarm.timestamp)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-blue-800 text-blue-400 hover:bg-blue-950 hover:text-blue-300"
                          onClick={() => onResolve(alarm)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Resolve
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

// Component for Resolved Alarms Tab
const ResolvedAlarmsTab: React.FC<{
  alarms: Alarm[];
  transmitters: any[];
  onClear: (alarm: Alarm) => void;
  getCategoryIcon: (category: AlarmCategory) => JSX.Element;
  formatTime: (date: Date) => string;
}> = ({ alarms, transmitters, onClear, getCategoryIcon, formatTime }) => {
  const getTransmitterById = (id: number) => {
    return transmitters.find(t => t.id === id);
  };
  
  return (
    <div>
      {alarms.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <CheckCircle className="mx-auto h-10 w-10 mb-2 text-gray-500 opacity-50" />
          <p>No resolved alarms.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <ScrollArea className="h-[400px] pr-4">
            <Table>
              <TableHeader className="bg-gray-900">
                <TableRow className="border-gray-800 hover:bg-gray-900">
                  <TableHead className="text-gray-400">Severity</TableHead>
                  <TableHead className="text-gray-400">Type</TableHead>
                  <TableHead className="text-gray-400">Transmitter</TableHead>
                  <TableHead className="text-gray-400">Message</TableHead>
                  <TableHead className="text-gray-400">Time</TableHead>
                  <TableHead className="text-gray-400">Notes</TableHead>
                  <TableHead className="text-right text-gray-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alarms.map((alarm) => {
                  const transmitter = getTransmitterById(alarm.transmitterId);
                  
                  return (
                    <TableRow key={alarm.id} className="border-gray-800 hover:bg-gray-850">
                      <TableCell>
                        <Badge className={`bg-gray-800 border-gray-700 text-xs font-normal`}>
                          {getAlarmSeverityLabel(alarm.severity)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(alarm.category)}
                          <span className="capitalize text-sm">{alarm.category}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {transmitter?.siteName}
                        <div className="text-xs text-gray-400">{transmitter?.frequency} MHz</div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[150px] truncate">{alarm.message}</div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-400">{formatTime(alarm.timestamp)}</TableCell>
                      <TableCell>
                        {alarm.notes ? (
                          <div className="max-w-[150px] truncate text-sm text-gray-400">{alarm.notes}</div>
                        ) : (
                          <span className="text-sm text-gray-600">No notes</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-gray-300"
                          onClick={() => onClear(alarm)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

// Component for All Alarms Tab
const AllAlarmsTab: React.FC<{
  alarms: Alarm[];
  filteredAlarms: Alarm[];
  transmitters: any[];
  showAcknowledged: boolean | undefined;
  setShowAcknowledged: (val: boolean | undefined) => void;
  showResolved: boolean;
  setShowResolved: (val: boolean) => void;
  onAcknowledge: (alarm: Alarm) => void;
  onResolve: (alarm: Alarm) => void;
  onClear: (alarm: Alarm) => void;
  getCategoryIcon: (category: AlarmCategory) => JSX.Element;
  formatTime: (date: Date) => string;
}> = ({ 
  alarms, 
  filteredAlarms, 
  transmitters, 
  showAcknowledged, 
  setShowAcknowledged,
  showResolved,
  setShowResolved,
  onAcknowledge, 
  onResolve, 
  onClear,
  getCategoryIcon,
  formatTime
}) => {
  const getTransmitterById = (id: number) => {
    return transmitters.find(t => t.id === id);
  };
  
  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">Status:</label>
          <Select
            value={showAcknowledged === undefined ? "all" : (showAcknowledged ? "acknowledged" : "unacknowledged")}
            onValueChange={(value) => {
              if (value === "all") {
                setShowAcknowledged(undefined);
              } else if (value === "acknowledged") {
                setShowAcknowledged(true);
              } else {
                setShowAcknowledged(false);
              }
            }}
          >
            <SelectTrigger className="w-[180px] bg-gray-900 border-gray-700 text-white">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700 text-white">
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="acknowledged">Acknowledged only</SelectItem>
              <SelectItem value="unacknowledged">Unacknowledged only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm font-normal">
            <input 
              type="checkbox" 
              checked={showResolved} 
              onChange={(e) => setShowResolved(e.target.checked)}
              className="mr-1"
            />
            Show resolved
          </label>
        </div>
      </div>
      
      {filteredAlarms.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <Bell className="mx-auto h-10 w-10 mb-2 text-gray-500 opacity-50" />
          <p>No alarms match your filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <ScrollArea className="h-[400px] pr-4">
            <Table>
              <TableHeader className="bg-gray-900">
                <TableRow className="border-gray-800 hover:bg-gray-900">
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400">Severity</TableHead>
                  <TableHead className="text-gray-400">Type</TableHead>
                  <TableHead className="text-gray-400">Transmitter</TableHead>
                  <TableHead className="text-gray-400">Message</TableHead>
                  <TableHead className="text-gray-400">Time</TableHead>
                  <TableHead className="text-right text-gray-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlarms.map((alarm) => {
                  const transmitter = getTransmitterById(alarm.transmitterId);
                  
                  return (
                    <TableRow 
                      key={alarm.id} 
                      className={`border-gray-800 hover:bg-gray-850 ${
                        alarm.resolved ? 'opacity-70' : (
                          !alarm.acknowledged && alarm.severity === AlarmSeverity.CRITICAL ? 
                            getAlarmSeverityAnimation(alarm.severity) : ''
                        )
                      }`}
                    >
                      <TableCell>
                        <Badge className={`${
                          alarm.resolved 
                            ? 'bg-green-900 border-green-700'
                            : alarm.acknowledged
                              ? 'bg-blue-900 border-blue-700'
                              : 'bg-red-900 border-red-700 animate-pulse'
                        } text-xs font-normal`}>
                          {alarm.resolved 
                            ? 'Resolved' 
                            : alarm.acknowledged 
                              ? 'Acknowledged' 
                              : 'Active'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${
                          alarm.resolved 
                            ? 'bg-gray-800 border-gray-700'
                            : getAlarmSeverityBgColor(alarm.severity)
                        } text-xs font-normal`}>
                          {getAlarmSeverityLabel(alarm.severity)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(alarm.category)}
                          <span className="capitalize text-sm">{alarm.category}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {transmitter?.siteName}
                        <div className="text-xs text-gray-400">{transmitter?.frequency} MHz</div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[150px] truncate">{alarm.message}</div>
                        {!alarm.resolved && alarm.value !== undefined && alarm.threshold !== undefined && (
                          <div className="text-xs text-gray-400">
                            Value: {alarm.value} (Threshold: {alarm.threshold})
                          </div>
                        )}
                        {alarm.resolved && alarm.notes && (
                          <div className="text-xs text-gray-500 truncate max-w-[150px]">
                            {alarm.notes}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-400">{formatTime(alarm.timestamp)}</TableCell>
                      <TableCell className="text-right">
                        {!alarm.resolved && !alarm.acknowledged && (
                          <div className="flex items-center gap-1 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-green-800 text-green-400 hover:bg-green-950 hover:text-green-300"
                              onClick={() => onAcknowledge(alarm)}
                            >
                              <Bell className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-blue-800 text-blue-400 hover:bg-blue-950 hover:text-blue-300"
                              onClick={() => onResolve(alarm)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        
                        {!alarm.resolved && alarm.acknowledged && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-blue-800 text-blue-400 hover:bg-blue-950 hover:text-blue-300"
                            onClick={() => onResolve(alarm)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {alarm.resolved && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-gray-300"
                            onClick={() => onClear(alarm)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};

export default AlarmDashboard;
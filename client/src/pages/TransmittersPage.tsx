import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { 
  RadioTower,
  ArrowLeft, 
  Signal, 
  AlertTriangle, 
  Thermometer, 
  Wifi,
  RefreshCw,
  Filter,
  Search,
  Plus,
  Settings,
  Save,
  Trash2,
  X,
  Bell
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import AlarmDashboard from "@/components/AlarmDashboard";

// Define the transmitter interface with SNMP configuration
interface Transmitter {
  id: number;
  siteName: string;
  frequency: string;
  forwardPower: number;
  reflectedPower: number;
  audioLevelLeft: number;
  audioLevelRight: number;
  temperature: number;
  hasAlarm: boolean;
  status: 'online' | 'offline' | 'warning' | 'critical';
  snmpConfig?: {
    ipAddress: string;
    port: number;
    community: string;
    version: '1' | '2c' | '3';
    oids: {
      forwardPower: string;
      reflectedPower: string;
      audioLevelLeft: string;
      audioLevelRight: string;
      temperature: string;
      status: string;
    };
    credentials?: {
      username?: string;
      authProtocol?: string;
      authKey?: string;
      privProtocol?: string;
      privKey?: string;
    };
    // Alarm thresholds
    alarmThresholds?: {
      forwardPowerMin: number;
      reflectedPowerMax: number;
      temperatureWarning: number;
      temperatureCritical: number;
      audioLevelMin: number;
      frequencyDeviation: number;
    };
  };
}

// Validation schema for SNMP configuration
const snmpConfigSchema = z.object({
  ipAddress: z.string().min(1, "IP address is required"),
  port: z.coerce.number().int().min(1).max(65535),
  community: z.string().min(1, "Community string is required"),
  version: z.enum(['1', '2c', '3']),
  forwardPowerOid: z.string().min(1, "OID is required"),
  reflectedPowerOid: z.string().min(1, "OID is required"),
  audioLevelLeftOid: z.string().min(1, "OID is required"),
  audioLevelRightOid: z.string().min(1, "OID is required"),
  temperatureOid: z.string().min(1, "OID is required"),
  statusOid: z.string().min(1, "OID is required"),
  username: z.string().optional(),
  authProtocol: z.string().optional(),
  authKey: z.string().optional(),
  privProtocol: z.string().optional(),
  privKey: z.string().optional(),
  // Alarm thresholds
  forwardPowerMinThreshold: z.coerce.number().min(0).default(500),
  reflectedPowerMaxThreshold: z.coerce.number().min(0).default(50),
  temperatureWarningThreshold: z.coerce.number().min(0).default(40),
  temperatureCriticalThreshold: z.coerce.number().min(0).default(65),
  audioLevelMinThreshold: z.coerce.number().max(0).default(-30), // in dB
  frequencyDeviationThreshold: z.coerce.number().min(0).default(0.1), // in MHz
});

// Validation schema for adding a new transmitter
const newTransmitterSchema = z.object({
  siteName: z.string().min(1, "Site name is required"),
  frequency: z.string().min(1, "Frequency is required"),
});

// Component for SNMP Configuration Dialog
const SnmpConfigDialog = ({ 
  transmitter, 
  isOpen, 
  onClose, 
  onSave 
}: { 
  transmitter: Transmitter, 
  isOpen: boolean, 
  onClose: () => void, 
  onSave: (id: number, config: any) => void 
}) => {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof snmpConfigSchema>>({
    resolver: zodResolver(snmpConfigSchema),
    defaultValues: {
      ipAddress: transmitter.snmpConfig?.ipAddress || '',
      port: transmitter.snmpConfig?.port || 161,
      community: transmitter.snmpConfig?.community || 'public',
      version: transmitter.snmpConfig?.version || '2c',
      forwardPowerOid: transmitter.snmpConfig?.oids?.forwardPower || '.1.3.6.1.2.1.1.1.0',
      reflectedPowerOid: transmitter.snmpConfig?.oids?.reflectedPower || '.1.3.6.1.2.1.1.2.0',
      audioLevelLeftOid: transmitter.snmpConfig?.oids?.audioLevelLeft || '.1.3.6.1.2.1.1.3.0',
      audioLevelRightOid: transmitter.snmpConfig?.oids?.audioLevelRight || '.1.3.6.1.2.1.1.4.0',
      temperatureOid: transmitter.snmpConfig?.oids?.temperature || '.1.3.6.1.2.1.1.5.0',
      statusOid: transmitter.snmpConfig?.oids?.status || '.1.3.6.1.2.1.1.6.0',
      username: transmitter.snmpConfig?.credentials?.username || '',
      authProtocol: transmitter.snmpConfig?.credentials?.authProtocol || '',
      authKey: transmitter.snmpConfig?.credentials?.authKey || '',
      privProtocol: transmitter.snmpConfig?.credentials?.privProtocol || '',
      privKey: transmitter.snmpConfig?.credentials?.privKey || '',
      // Alarm thresholds defaults
      forwardPowerMinThreshold: transmitter.snmpConfig?.alarmThresholds?.forwardPowerMin || 500,
      reflectedPowerMaxThreshold: transmitter.snmpConfig?.alarmThresholds?.reflectedPowerMax || 50,
      temperatureWarningThreshold: transmitter.snmpConfig?.alarmThresholds?.temperatureWarning || 40,
      temperatureCriticalThreshold: transmitter.snmpConfig?.alarmThresholds?.temperatureCritical || 65,
      audioLevelMinThreshold: transmitter.snmpConfig?.alarmThresholds?.audioLevelMin || -30,
      frequencyDeviationThreshold: transmitter.snmpConfig?.alarmThresholds?.frequencyDeviation || 0.1,
    }
  });
  
  const onSubmit = (values: z.infer<typeof snmpConfigSchema>) => {
    // Transform form values into SNMP config
    const snmpConfig = {
      ipAddress: values.ipAddress,
      port: values.port,
      community: values.community,
      version: values.version,
      oids: {
        forwardPower: values.forwardPowerOid,
        reflectedPower: values.reflectedPowerOid,
        audioLevelLeft: values.audioLevelLeftOid,
        audioLevelRight: values.audioLevelRightOid,
        temperature: values.temperatureOid,
        status: values.statusOid,
      },
      credentials: {
        username: values.username,
        authProtocol: values.authProtocol,
        authKey: values.authKey,
        privProtocol: values.privProtocol,
        privKey: values.privKey,
      },
      // Add alarm thresholds
      alarmThresholds: {
        forwardPowerMin: values.forwardPowerMinThreshold,
        reflectedPowerMax: values.reflectedPowerMaxThreshold,
        temperatureWarning: values.temperatureWarningThreshold,
        temperatureCritical: values.temperatureCriticalThreshold,
        audioLevelMin: values.audioLevelMinThreshold,
        frequencyDeviation: values.frequencyDeviationThreshold,
      }
    };
    
    onSave(transmitter.id, snmpConfig);
    toast({
      title: "SNMP Configuration Saved",
      description: `SNMP settings updated for ${transmitter.siteName}`,
    });
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-gray-950 text-white border-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5 text-blue-500" />
            SNMP Configuration for {transmitter.siteName}
          </DialogTitle>
          <DialogDescription>
            Configure SNMP agent details to monitor this transmitter.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs defaultValue="connection" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="connection">Connection</TabsTrigger>
                <TabsTrigger value="oids">OID Mapping</TabsTrigger>
                <TabsTrigger value="alarms">Alarm Thresholds</TabsTrigger>
              </TabsList>
              
              <TabsContent value="connection" className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="ipAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IP Address</FormLabel>
                        <FormControl>
                          <Input placeholder="192.168.1.100" {...field} className="bg-gray-900 border-gray-700" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="port"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Port</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="bg-gray-900 border-gray-700" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="community"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Community String</FormLabel>
                        <FormControl>
                          <Input placeholder="public" {...field} className="bg-gray-900 border-gray-700" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="version"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SNMP Version</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-gray-900 border-gray-700">
                              <SelectValue placeholder="Select version" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-gray-900 border-gray-700">
                            <SelectItem value="1">Version 1</SelectItem>
                            <SelectItem value="2c">Version 2c</SelectItem>
                            <SelectItem value="3">Version 3</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {form.watch("version") === "3" && (
                  <div className="space-y-4 pt-2 border-t border-gray-800">
                    <h4 className="text-sm font-medium">SNMP v3 Authentication</h4>
                    
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input {...field} className="bg-gray-900 border-gray-700" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="authProtocol"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Auth Protocol</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="bg-gray-900 border-gray-700">
                                  <SelectValue placeholder="Select protocol" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-gray-900 border-gray-700">
                                <SelectItem value="MD5">MD5</SelectItem>
                                <SelectItem value="SHA">SHA</SelectItem>
                                <SelectItem value="SHA-256">SHA-256</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="authKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Auth Key</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} className="bg-gray-900 border-gray-700" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="privProtocol"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Privacy Protocol</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="bg-gray-900 border-gray-700">
                                  <SelectValue placeholder="Select protocol" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-gray-900 border-gray-700">
                                <SelectItem value="DES">DES</SelectItem>
                                <SelectItem value="AES">AES</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="privKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Privacy Key</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} className="bg-gray-900 border-gray-700" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="oids" className="space-y-4 py-2">
                <FormField
                  control={form.control}
                  name="forwardPowerOid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Forward Power OID</FormLabel>
                      <FormControl>
                        <Input placeholder=".1.3.6.1.2.1.1.1.0" {...field} className="bg-gray-900 border-gray-700" />
                      </FormControl>
                      <FormDescription className="text-xs text-gray-500">
                        OID for the forward power value in Watts
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="reflectedPowerOid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reflected Power OID</FormLabel>
                      <FormControl>
                        <Input placeholder=".1.3.6.1.2.1.1.2.0" {...field} className="bg-gray-900 border-gray-700" />
                      </FormControl>
                      <FormDescription className="text-xs text-gray-500">
                        OID for the reflected power value in Watts
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="audioLevelLeftOid"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Left Audio Level OID</FormLabel>
                        <FormControl>
                          <Input placeholder=".1.3.6.1.2.1.1.3.0" {...field} className="bg-gray-900 border-gray-700" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="audioLevelRightOid"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Right Audio Level OID</FormLabel>
                        <FormControl>
                          <Input placeholder=".1.3.6.1.2.1.1.4.0" {...field} className="bg-gray-900 border-gray-700" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="temperatureOid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Temperature OID</FormLabel>
                      <FormControl>
                        <Input placeholder=".1.3.6.1.2.1.1.5.0" {...field} className="bg-gray-900 border-gray-700" />
                      </FormControl>
                      <FormDescription className="text-xs text-gray-500">
                        OID for the temperature value in °C
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="statusOid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status OID</FormLabel>
                      <FormControl>
                        <Input placeholder=".1.3.6.1.2.1.1.6.0" {...field} className="bg-gray-900 border-gray-700" />
                      </FormControl>
                      <FormDescription className="text-xs text-gray-500">
                        OID for the device status (online, warning, offline)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="alarms" className="space-y-4 py-2">
                <div className="border-b border-gray-800 pb-2 mb-4">
                  <p className="text-sm text-gray-400">Configure thresholds that will trigger alarms when values are outside the acceptable range.</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="forwardPowerMinThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Forward Power Min (W)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="bg-gray-900 border-gray-700" />
                        </FormControl>
                        <FormDescription className="text-xs text-gray-500">
                          Alarm if forward power falls below this value
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="reflectedPowerMaxThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reflected Power Max (W)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="bg-gray-900 border-gray-700" />
                        </FormControl>
                        <FormDescription className="text-xs text-gray-500">
                          Alarm if reflected power exceeds this value
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="temperatureWarningThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Temperature Warning (°C)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="bg-gray-900 border-gray-700" />
                        </FormControl>
                        <FormDescription className="text-xs text-gray-500">
                          Warning if temperature exceeds this value
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="temperatureCriticalThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Temperature Critical (°C)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="bg-gray-900 border-gray-700" />
                        </FormControl>
                        <FormDescription className="text-xs text-gray-500">
                          Critical alarm if temperature exceeds this value
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="audioLevelMinThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Audio Level Min (dB)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="bg-gray-900 border-gray-700" />
                        </FormControl>
                        <FormDescription className="text-xs text-gray-500">
                          Alarm if audio level falls below this value (e.g., -30)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="frequencyDeviationThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frequency Deviation (MHz)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} step="0.01" className="bg-gray-900 border-gray-700" />
                        </FormControl>
                        <FormDescription className="text-xs text-gray-500">
                          Alarm if frequency deviates more than this value
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter className="pt-4 border-t border-gray-800">
              <Button type="button" variant="outline" onClick={onClose} className="border-gray-700">
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 mr-2" />
                Save Configuration
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

// Component for adding a new transmitter
const AddTransmitterDialog = ({ 
  isOpen, 
  onClose, 
  onAdd 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onAdd: (data: any) => void 
}) => {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof newTransmitterSchema>>({
    resolver: zodResolver(newTransmitterSchema),
    defaultValues: {
      siteName: '',
      frequency: '',
    }
  });
  
  const onSubmit = (values: z.infer<typeof newTransmitterSchema>) => {
    onAdd(values);
    toast({
      title: "Transmitter Added",
      description: `New transmitter "${values.siteName}" has been added`,
    });
    form.reset();
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-gray-950 text-white border-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Plus className="mr-2 h-5 w-5 text-green-500" />
            Add New Transmitter
          </DialogTitle>
          <DialogDescription>
            Enter the details for the new transmitter. You can configure SNMP settings later.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="siteName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Site Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Main Tower" {...field} className="bg-gray-900 border-gray-700" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequency</FormLabel>
                  <FormControl>
                    <Input placeholder="101.5" {...field} className="bg-gray-900 border-gray-700" />
                  </FormControl>
                  <FormDescription className="text-xs text-gray-500">
                    Broadcast frequency in MHz
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-4 border-t border-gray-800">
              <Button type="button" variant="outline" onClick={onClose} className="border-gray-700">
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Add Transmitter
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

// Component for displaying a single transmitter
const TransmitterCard: React.FC<{ 
  transmitter: Transmitter, 
  onConfigureSnmp: (transmitter: Transmitter) => void,
  onDelete: (id: number) => void 
}> = ({ transmitter, onConfigureSnmp, onDelete }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'warning': return 'text-yellow-400';
      case 'critical': return 'text-red-500';
      case 'offline': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  const getStatusPulse = (status: string) => {
    switch (status) {
      case 'warning': return 'animate-blink';
      case 'critical': return 'animate-blink';
      default: return '';
    }
  };

  const getAudioBarAnimation = (level: number) => {
    // Higher negative dB means lower volume
    const normalizedLevel = Math.abs(level / -30);
    if (normalizedLevel < 0.3) return 'animate-audio-low';
    if (normalizedLevel < 0.7) return 'animate-audio-medium';
    return 'animate-audio-high';
  };

  const getTempWarning = (temp: number) => {
    if (temp > 40) return 'text-red-500';
    if (temp > 35) return 'text-orange-400';
    return 'text-green-400';
  };

  // Calculate the angle for the power gauge needles
  const calculateNeedleAngle = (value: number, max: number) => {
    // Convert the value to a percentage of the max (0-100)
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    // Map 0-100 to an angle from -120 to 120 degrees (240 degree sweep)
    return -120 + (percentage * 240 / 100);
  };

  // Get the class for the main card based on status
  const getCardClass = () => {
    if (transmitter.status === 'offline' || transmitter.hasAlarm) {
      return 'bg-gray-900 border-red-700 shadow-error';
    }
    if (transmitter.status === 'critical') {
      return 'bg-gray-900 border-red-700 border-2';
    }
    if (transmitter.status === 'warning') {
      return 'bg-gray-900 border-yellow-700 border-2';
    }
    return 'bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors';
  };
  
  // Get the class for the status banner
  const getStatusBannerClass = () => {
    if (transmitter.status === 'online') return 'bg-green-500';
    if (transmitter.status === 'warning') return 'bg-yellow-400';
    if (transmitter.status === 'critical') return 'bg-red-600';
    return 'bg-red-600';
  };
  
  // Calculate RF efficiency
  const rfEfficiency = transmitter.forwardPower > 0 
    ? Math.round((1 - transmitter.reflectedPower / transmitter.forwardPower) * 100)
    : 0;

  return (
    <Card className={getCardClass()}>
      <div className="relative">
        {/* Status Banner */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${getStatusBannerClass()}`}></div>
        
        {/* "ON AIR" Display */}
        <div className={`w-full ${transmitter.status === 'online' ? 'bg-green-500' : 'bg-gray-800'} py-3 text-center font-bold text-white text-2xl tracking-widest relative overflow-hidden`}>
          {transmitter.status === 'online' && (
            <>
              <span className="relative z-10">ON AIR</span>
              <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-400 opacity-30"></div>
            </>
          )}
          {transmitter.status === 'offline' && (
            <span className="text-gray-500">OFFLINE</span>
          )}
          {transmitter.status === 'warning' && (
            <span className="text-yellow-300">WARNING</span>
          )}
          {transmitter.status === 'critical' && (
            <span className="text-red-300 animate-blink">CRITICAL</span>
          )}
        </div>
      </div>
      
      <CardHeader className={`pb-1 pt-2 ${
        transmitter.status === 'warning' ? 'animate-warning-blink' : 
        transmitter.status === 'critical' ? 'animate-critical-blink' : 
        transmitter.status === 'offline' ? 'bg-gray-800' : 'bg-green-900'
      }`}>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <RadioTower className={`h-5 w-5 ${transmitter.status !== 'offline' ? 'text-blue-400' : 'text-gray-400'}`} />
              {transmitter.siteName}
            </CardTitle>
            <div className="flex items-center mt-1">
              <Signal className="h-4 w-4 mr-1 text-yellow-400" />
              <span className="text-sm font-medium text-yellow-300">{transmitter.frequency} MHz</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex gap-1 mb-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-950"
                onClick={() => onDelete(transmitter.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-950"
                onClick={() => onConfigureSnmp(transmitter)}
              >
                <Settings className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className={`flex items-center mb-1 ${getStatusColor(transmitter.status)}`}>
              <Wifi className={`h-4 w-4 mr-1 ${getStatusPulse(transmitter.status)}`} />
              <span className="text-xs font-medium">{transmitter.status.charAt(0).toUpperCase() + transmitter.status.slice(1)}</span>
            </div>
            
            {transmitter.hasAlarm && (
              <div className="flex items-center text-red-500">
                <AlertTriangle className="h-4 w-4 mr-1" />
                <span className="text-xs font-medium">Alarm</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2 p-2">
        {/* Power Display Row - Compact Version */}
        <div className="grid grid-cols-3 gap-2">
          {/* Forward Power Digital Display */}
          <div className="bg-gray-950 border border-gray-800 rounded-md p-1 flex flex-col justify-center">
            <div className="text-xs text-gray-400 text-center font-medium mb-0.5">Forward Power</div>
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500">Target:</div>
              <div className="text-xs text-gray-300">1000W</div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500">Actual:</div>
              <div className={`text-lg font-mono font-bold ${
                transmitter.forwardPower < 300 ? 'text-red-400' : 
                transmitter.forwardPower < 700 ? 'text-yellow-400' : 'text-green-400'
              }`}>{transmitter.forwardPower}W</div>
            </div>
          </div>
          
          {/* Reflected Power Digital Display */}
          <div className="bg-gray-950 border border-gray-800 rounded-md p-1 flex flex-col justify-center">
            <div className="text-xs text-gray-400 text-center font-medium mb-0.5">Reflected</div>
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500">Max:</div>
              <div className="text-xs text-gray-300">50W</div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500">Actual:</div>
              <div className={`text-lg font-mono font-bold ${
                transmitter.reflectedPower > 100 ? 'text-red-400' : 
                transmitter.reflectedPower > 50 ? 'text-yellow-400' : 'text-green-400'
              }`}>{transmitter.reflectedPower}W</div>
            </div>
          </div>
          
          {/* Efficiency Display */}
          <div className="bg-gray-950 border border-gray-800 rounded-md p-1 flex flex-col justify-center">
            <div className="text-xs text-gray-400 text-center font-medium mb-0.5">Efficiency</div>
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500">VSWR:</div>
              <div className="text-xs text-gray-300">{((1 + Math.sqrt(transmitter.reflectedPower / Math.max(transmitter.forwardPower, 1))) / (1 - Math.sqrt(transmitter.reflectedPower / Math.max(transmitter.forwardPower, 1)))).toFixed(2)}</div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500">Efficiency:</div>
              <div className={`text-lg font-mono font-bold ${
                rfEfficiency < 60 ? 'text-red-400' : 
                rfEfficiency < 80 ? 'text-yellow-400' : 'text-green-400'
              }`}>{rfEfficiency}%</div>
            </div>
          </div>
        </div>
        
        {/* Second row - Frequency and RF Efficiency */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <div className="text-xs text-gray-400 text-center font-medium">Frequency</div>
            <div className="bg-gray-950 border border-gray-800 rounded-md p-1 flex flex-col items-center">
              {/* Linear scale with marker */}
              <div className="w-full h-4 bg-gray-900 relative rounded my-2">
                <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2">
                  <span className="text-xs text-gray-500">88</span>
                  <span className="text-xs text-gray-500">98</span>
                  <span className="text-xs text-gray-500">108</span>
                </div>
                
                {/* Marker */}
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500" 
                  style={{ 
                    left: `${((parseFloat(transmitter.frequency) - 88) / 20) * 100}%` 
                  }}
                ></div>
              </div>
              
              {/* Frequency value */}
              <div className="bg-black px-2 mt-1">
                <p className="text-lg font-mono text-yellow-400 font-bold">{transmitter.frequency}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-xs text-gray-400 text-center font-medium">RF Efficiency</div>
            <div className="bg-gray-950 border border-gray-800 rounded-md p-1 flex flex-col items-center">
              {/* Linear scale with marker */}
              <div className="w-full h-4 bg-gray-900 relative rounded my-2">
                <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2">
                  <span className="text-xs text-gray-500">0</span>
                  <span className="text-xs text-gray-500">50</span>
                  <span className="text-xs text-gray-500">100</span>
                </div>
                
                {/* Marker */}
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500" 
                  style={{ 
                    left: `${rfEfficiency}%` 
                  }}
                ></div>
              </div>
              
              {/* Efficiency value */}
              <div className="bg-black px-2 mt-1">
                <p className="text-lg font-mono text-yellow-400 font-bold">{rfEfficiency}%</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Third row - Audio Levels and Temperature */}
        <div className="grid grid-cols-2 gap-2">
          {/* Audio meters */}
          <div className="space-y-1">
            <div className="text-xs text-gray-400 text-center font-medium">Audio Levels</div>
            <div className="bg-gray-950 border border-gray-800 rounded-md p-1">
              <div className="flex justify-between text-xs text-gray-500 mb-0.5">
                <span>L: {transmitter.audioLevelLeft} dB</span>
                <span>R: {transmitter.audioLevelRight} dB</span>
              </div>
              
              {/* VU Meter style display - vertical layout - reduced height */}
              <div className="flex gap-2 h-11">
                {/* Left channel (vertical) */}
                <div className="flex-1 flex flex-col-reverse">
                  {Array.from({ length: 16 }).map((_, i) => {
                    // Map the index to a dB value (approximating -40dB to 0dB)
                    const dbValue = -40 + (i * 2.5);
                    // Determine if this segment should be lit based on audio level
                    const isActive = transmitter.audioLevelLeft >= dbValue;
                    // Determine color based on level
                    let color = 'bg-green-500';
                    if (i >= 12) color = 'bg-red-500';
                    else if (i >= 9) color = 'bg-yellow-500';
                    
                    return (
                      <div 
                        key={i} 
                        className={`w-full h-full my-0.5 ${isActive ? color : 'bg-gray-800'}`}
                      ></div>
                    );
                  })}
                </div>
                
                {/* Scale markers */}
                <div className="flex flex-col-reverse justify-between text-xs text-gray-500 py-2">
                  <span>-40</span>
                  <span>-20</span>
                  <span>-0</span>
                </div>
                
                {/* Right channel (vertical) */}
                <div className="flex-1 flex flex-col-reverse">
                  {Array.from({ length: 16 }).map((_, i) => {
                    const dbValue = -40 + (i * 2.5);
                    const isActive = transmitter.audioLevelRight >= dbValue;
                    let color = 'bg-green-500';
                    if (i >= 12) color = 'bg-red-500';
                    else if (i >= 9) color = 'bg-yellow-500';
                    
                    return (
                      <div 
                        key={i} 
                        className={`w-full h-full my-0.5 ${isActive ? color : 'bg-gray-800'}`}
                      ></div>
                    );
                  })}
                </div>
              </div>
              
              {/* Label */}
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>L</span>
                <span>R</span>
              </div>
            </div>
          </div>
          
          {/* Temperature display - compact */}
          <div className="space-y-1">
            <div className="text-xs text-gray-400 text-center font-medium">Temperature</div>
            <div className="bg-gray-950 border border-gray-800 rounded-md p-1 flex flex-col justify-center">
              {/* Temperature indicator */}
              <div className="flex justify-between items-center mb-1">
                <div className="text-xs text-gray-500">Warning:</div>
                <div className="text-xs text-gray-300">40°C</div>
              </div>
              <div className="flex justify-between items-center mb-1">
                <div className="text-xs text-gray-500">Critical:</div>
                <div className="text-xs text-gray-300">65°C</div>
              </div>
              
              {/* Progress bar for temperature */}
              <div className="w-full h-2 bg-gray-900 rounded overflow-hidden mb-1">
                <div 
                  className={`h-full ${
                    transmitter.temperature > 40 ? 'bg-red-500' : 
                    transmitter.temperature > 35 ? 'bg-orange-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${(transmitter.temperature / 100) * 100}%` }}
                ></div>
              </div>
              
              {/* Digital readout */}
              <div className="flex items-center justify-center">
                <Thermometer className="h-5 w-5 mr-1" />
                <span className={`text-lg font-mono font-bold ${
                  transmitter.temperature > 40 ? 'text-red-400' : 
                  transmitter.temperature > 35 ? 'text-orange-400' : 'text-green-400'
                }`}>{transmitter.temperature}°C</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const TransmittersPage: React.FC = () => {
  const [_, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTransmitter, setSelectedTransmitter] = useState<Transmitter | null>(null);
  const [isSnmpDialogOpen, setIsSnmpDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [showAlarmDashboard, setShowAlarmDashboard] = useState(false);
  const { toast } = useToast();

  // Mock transmitter data - in a real app, this would come from an API
  const [transmitters, setTransmitters] = useState<Transmitter[]>([
    {
      id: 1,
      siteName: "Main Tower",
      frequency: "101.5",
      forwardPower: 850,
      reflectedPower: 15,
      audioLevelLeft: -18,
      audioLevelRight: -16,
      temperature: 36,
      hasAlarm: false,
      status: 'online',
      snmpConfig: {
        ipAddress: "192.168.1.100",
        port: 161,
        community: "public",
        version: "2c",
        oids: {
          forwardPower: ".1.3.6.1.2.1.1.1.0",
          reflectedPower: ".1.3.6.1.2.1.1.2.0",
          audioLevelLeft: ".1.3.6.1.2.1.1.3.0",
          audioLevelRight: ".1.3.6.1.2.1.1.4.0",
          temperature: ".1.3.6.1.2.1.1.5.0",
          status: ".1.3.6.1.2.1.1.6.0"
        }
      }
    },
    {
      id: 2,
      siteName: "North Hill",
      frequency: "97.8",
      forwardPower: 650,
      reflectedPower: 22,
      audioLevelLeft: -20,
      audioLevelRight: -22,
      temperature: 42,
      hasAlarm: true,
      status: 'warning'
    },
    {
      id: 3,
      siteName: "Downtown",
      frequency: "93.2",
      forwardPower: 500,
      reflectedPower: 8,
      audioLevelLeft: -24,
      audioLevelRight: -25,
      temperature: 38,
      hasAlarm: false,
      status: 'online'
    },
    {
      id: 4,
      siteName: "East Side",
      frequency: "105.3",
      forwardPower: 0,
      reflectedPower: 0,
      audioLevelLeft: 0,
      audioLevelRight: 0,
      temperature: 0,
      hasAlarm: true,
      status: 'offline'
    },
    {
      id: 5,
      siteName: "West Mountains",
      frequency: "89.9",
      forwardPower: 750,
      reflectedPower: 12,
      audioLevelLeft: -15,
      audioLevelRight: -14,
      temperature: 33,
      hasAlarm: false,
      status: 'online'
    },
    {
      id: 6,
      siteName: "South Bay",
      frequency: "102.7",
      forwardPower: 950,
      reflectedPower: 300, 
      audioLevelLeft: -19,
      audioLevelRight: -18,
      temperature: 68,
      hasAlarm: true,
      status: 'critical'
    },
    {
      id: 7,
      siteName: "Airport",
      frequency: "94.5",
      forwardPower: 400,
      reflectedPower: 5,
      audioLevelLeft: -22,
      audioLevelRight: -21,
      temperature: 37,
      hasAlarm: false,
      status: 'online'
    },
    {
      id: 8,
      siteName: "University",
      frequency: "107.1",
      forwardPower: 350,
      reflectedPower: 4,
      audioLevelLeft: -26,
      audioLevelRight: -28,
      temperature: 35,
      hasAlarm: false,
      status: 'online'
    },
    {
      id: 9,
      siteName: "Stadium",
      frequency: "99.9",
      forwardPower: 600,
      reflectedPower: 10,
      audioLevelLeft: -17,
      audioLevelRight: -19,
      temperature: 39,
      hasAlarm: false,
      status: 'online'
    },
    {
      id: 10,
      siteName: "Harbor",
      frequency: "91.3",
      forwardPower: 550,
      reflectedPower: 9,
      audioLevelLeft: -21,
      audioLevelRight: -23,
      temperature: 40,
      hasAlarm: false,
      status: 'online'
    }
  ]);
  
  // Monitor transmitter status and send updates to global alarm system
  useEffect(() => {
    // Find transmitters with warning or critical status
    const alarmsActive = transmitters.some(tx => 
      tx.status === 'warning' || tx.status === 'critical' || tx.hasAlarm
    );
    
    // Create array of alarm data for transmitters with issues
    const alarmData = transmitters
      .filter(tx => tx.status === 'warning' || tx.status === 'critical' || tx.hasAlarm)
      .map(tx => ({
        id: tx.id,
        siteName: tx.siteName,
        status: tx.status === 'critical' ? 'critical' : 'warning'
      }));
      
    // Dispatch event to update global alarm system
    const event = new CustomEvent('transmitterAlarmsUpdate', { 
      detail: { 
        alarmsActive,
        alarmData
      } 
    });
    document.dispatchEvent(event);
    
  }, [transmitters]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    // Simulate API call with timeout
    setTimeout(() => {
      // In a real app, we would fetch updated transmitter data here
      setRefreshing(false);
      toast({
        title: "Refreshed",
        description: "Transmitter data has been updated",
      });
    }, 1000);
  };

  // Configure SNMP for a transmitter
  const handleConfigureSnmp = (transmitter: Transmitter) => {
    setSelectedTransmitter(transmitter);
    setIsSnmpDialogOpen(true);
  };

  // Save SNMP configuration
  const handleSaveSnmpConfig = (id: number, config: any) => {
    setTransmitters(prev => 
      prev.map(t => t.id === id ? { ...t, snmpConfig: config } : t)
    );
  };

  // Add a new transmitter
  const handleAddTransmitter = (data: any) => {
    const newId = Math.max(...transmitters.map(t => t.id)) + 1;
    const newTransmitter: Transmitter = {
      id: newId,
      siteName: data.siteName,
      frequency: data.frequency,
      forwardPower: 0,
      reflectedPower: 0,
      audioLevelLeft: 0,
      audioLevelRight: 0,
      temperature: 0,
      hasAlarm: false,
      status: 'offline'
    };
    
    setTransmitters(prev => [...prev, newTransmitter]);
  };

  // Delete a transmitter
  const handleDeleteTransmitter = (id: number) => {
    setTransmitters(prev => prev.filter(t => t.id !== id));
    toast({
      title: "Transmitter Removed",
      description: "The transmitter has been removed from monitoring",
      variant: "destructive",
    });
  };

  // Filter transmitters based on search query and status filter
  const filteredTransmitters = transmitters.filter(transmitter => {
    const matchesSearch = transmitter.siteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          transmitter.frequency.includes(searchQuery);
    
    const matchesStatus = statusFilter && statusFilter !== 'all' ? transmitter.status === statusFilter : true;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const stats = {
    total: transmitters.length,
    online: transmitters.filter(t => t.status === 'online').length,
    warning: transmitters.filter(t => t.status === 'warning').length,
    offline: transmitters.filter(t => t.status === 'offline').length,
    withAlarms: transmitters.filter(t => t.hasAlarm).length,
    configured: transmitters.filter(t => t.snmpConfig).length
  };
  
  // Alarm dashboard handlers
  const handleAcknowledgeAlarm = (alarmId: number) => {
    toast({
      title: "Alarm Acknowledged",
      description: "The alarm has been acknowledged",
    });
  };
  
  const handleResolveAlarm = (alarmId: number, notes?: string) => {
    toast({
      title: "Alarm Resolved",
      description: notes ? `Alarm resolved with notes: ${notes}` : "Alarm has been resolved",
    });
  };
  
  const handleClearAlarm = (alarmId: number) => {
    toast({
      title: "Alarm Cleared",
      description: "The alarm has been cleared from the system",
      variant: "destructive",
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header with back button */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-gray-400 hover:text-white mr-2"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-xl font-bold flex items-center">
                <RadioTower className="h-5 w-5 mr-2 text-blue-400" />
                Transmitters Monitoring
              </h1>
            </div>
            <div className="flex gap-2">
              <Button 
                variant={showAlarmDashboard ? "default" : "outline"}
                size="sm"
                className={showAlarmDashboard 
                  ? "bg-red-900 hover:bg-red-800 text-white" 
                  : "text-red-400 border-red-800 hover:bg-red-900/20"}
                onClick={() => setShowAlarmDashboard(!showAlarmDashboard)}
              >
                <Bell className="h-4 w-4 mr-2" />
                {showAlarmDashboard ? "Hide Alarm Dashboard" : "Alarm Dashboard"}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="text-green-400 border-green-800 hover:bg-green-900/20"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Transmitter
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-gray-400 hover:text-white"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        {showAlarmDashboard && (
          <div className="mb-8">
            <AlarmDashboard 
              transmitters={transmitters}
              onAcknowledgeAlarm={handleAcknowledgeAlarm}
              onResolveAlarm={handleResolveAlarm}
              onClearAlarm={handleClearAlarm}
            />
          </div>
        )}
        
        {/* Stats section */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4 flex items-center">
              <RadioTower className="h-5 w-5 mr-3 text-blue-400" />
              <div>
                <p className="text-xs text-gray-400">Total</p>
                <p className="text-lg font-bold">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4 flex items-center">
              <Wifi className="h-5 w-5 mr-3 text-green-400" />
              <div>
                <p className="text-xs text-gray-400">Online</p>
                <p className="text-lg font-bold text-green-400">{stats.online}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4 flex items-center">
              <Signal className="h-5 w-5 mr-3 text-yellow-400" />
              <div>
                <p className="text-xs text-gray-400">Warning</p>
                <p className="text-lg font-bold text-yellow-400">{stats.warning}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4 flex items-center">
              <Wifi className="h-5 w-5 mr-3 text-red-400" />
              <div>
                <p className="text-xs text-gray-400">Offline</p>
                <p className="text-lg font-bold text-red-400">{stats.offline}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className="bg-gray-900 border-gray-800 cursor-pointer hover:bg-gray-850 transition-colors"
            onClick={() => setShowAlarmDashboard(true)}
          >
            <CardContent className="p-4 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-3 text-red-400" />
              <div>
                <p className="text-xs text-gray-400">Alarms</p>
                <p className="text-lg font-bold text-red-400">{stats.withAlarms}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4 flex items-center">
              <Settings className="h-5 w-5 mr-3 text-blue-400" />
              <div>
                <p className="text-xs text-gray-400">Configured</p>
                <p className="text-lg font-bold text-blue-400">{stats.configured}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and filter section */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search transmitters by name or frequency..."
              className="pl-9 bg-gray-900 border-gray-700 text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 items-center">
            <Filter className="h-4 w-4 text-gray-400" />
            <Select
              value={statusFilter}
              onValueChange={(value: string) => setStatusFilter(value)}
            >
              <SelectTrigger className="w-[180px] bg-gray-900 border-gray-700 text-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700 text-white">
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Grid of transmitters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-10">
          {filteredTransmitters.map(transmitter => (
            <TransmitterCard 
              key={transmitter.id} 
              transmitter={transmitter} 
              onConfigureSnmp={handleConfigureSnmp}
              onDelete={handleDeleteTransmitter}
            />
          ))}
        </div>

        {filteredTransmitters.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <RadioTower className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No transmitters found</p>
            <p className="text-sm">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </main>

      {/* SNMP Configuration Dialog */}
      {selectedTransmitter && (
        <SnmpConfigDialog 
          transmitter={selectedTransmitter}
          isOpen={isSnmpDialogOpen}
          onClose={() => setIsSnmpDialogOpen(false)}
          onSave={handleSaveSnmpConfig}
        />
      )}

      {/* Add Transmitter Dialog */}
      <AddTransmitterDialog 
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={handleAddTransmitter}
      />
    </div>
  );
};

export default TransmittersPage;
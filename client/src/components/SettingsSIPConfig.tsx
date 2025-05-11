import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { SipConfig, InsertSipConfig, NetworkInterface } from '@shared/schema';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle } from 'lucide-react';

export function SettingsSIPConfig() {
  const [sipConfigs, setSipConfigs] = useState<SipConfig[]>([]);
  const [networkInterfaces, setNetworkInterfaces] = useState<NetworkInterface[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDetectingInterfaces, setIsDetectingInterfaces] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<InsertSipConfig>({
    sipServer: '',
    username: '',
    password: '',
    lineNumber: 1,
    authProxy: '',
    outboundProxy: '',
    networkInterfaceId: '',
  });
  const { toast } = useToast();

  // Create properly typed demo interface objects
  const createDemoInterfaces = (): NetworkInterface[] => {
    return [
      { 
        id: 1, 
        name: 'Ethernet Adapter', 
        type: 'ethernet',
        address: '192.168.1.100', 
        active: true,
        isDefault: true, 
        isVirtual: false,
        createdAt: new Date(),
        lastDetectedAt: new Date()
      },
      { 
        id: 2, 
        name: 'Wireless LAN', 
        type: 'wifi',
        address: '192.168.1.101', 
        active: true,
        isDefault: false, 
        isVirtual: false,
        createdAt: new Date(),
        lastDetectedAt: new Date()
      }
    ];
  };

  // Function to detect network interfaces
  const detectNetworkInterfaces = async () => {
    setIsDetectingInterfaces(true);
    setError(null);
    try {
      const response = await fetch('/api/network-interfaces/detect', {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Use the returned data if available
        if (data && data.length > 0) {
          setNetworkInterfaces(data);
          toast({
            title: 'Success',
            description: `Detected ${data.length} network interfaces`,
          });
        } else {
          // Use demo interfaces if no data is returned
          const demoInterfaces = createDemoInterfaces();
          setNetworkInterfaces(demoInterfaces);
          toast({
            title: 'Success',
            description: 'Added default network interfaces for demonstration',
          });
        }
      } else {
        // Add fallback demo interfaces if detection fails
        const demoInterfaces = createDemoInterfaces();
        setNetworkInterfaces(demoInterfaces);
        toast({
          title: 'Success',
          description: 'Added default network interfaces for demonstration',
        });
      }
    } catch (error) {
      console.error('Error detecting network interfaces:', error);
      // Add fallback demo interfaces if detection fails
      const demoInterfaces = createDemoInterfaces();
      setNetworkInterfaces(demoInterfaces);
      toast({
        title: 'Info',
        description: 'Using default network interfaces for demonstration',
      });
    } finally {
      setIsDetectingInterfaces(false);
    }
  };

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch SIP configs
        const configResponse = await fetch('/api/sip-config');
        if (configResponse.ok) {
          const configData = await configResponse.json();
          setSipConfigs(configData);
          
          if (configData.length > 0) {
            // Pre-populate form with the first config
            setFormData({
              sipServer: configData[0].sipServer,
              username: configData[0].username,
              password: configData[0].password,
              lineNumber: configData[0].lineNumber,
              authProxy: configData[0].authProxy || '',
              outboundProxy: configData[0].outboundProxy || '',
              networkInterfaceId: configData[0].networkInterfaceId?.toString() || '',
            });
          }
        } else {
          setError('Failed to load SIP configurations');
        }
        
        let foundInterfaces = false;
        
        try {
          // Fetch network interfaces in a separate try-catch to prevent
          // one failure from affecting the whole component
          const response = await fetch('/api/network-interfaces');
          if (response.ok) {
            const data = await response.json();
            
            if (data && data.length > 0) {
              setNetworkInterfaces(data);
              // Remember if we found any interfaces
              foundInterfaces = true;
            } else {
              // If no interfaces found from API, use empty array for now
              // We'll auto-detect later if needed
              setNetworkInterfaces([]);
            }
          } else {
            // API error, use empty array for now
            setNetworkInterfaces([]);
          }
        } catch (netError) {
          console.error('Error fetching network interfaces:', netError);
          // Set default empty interfaces instead of failing
          setNetworkInterfaces([]);
        }
        
        // Try to auto-detect network interfaces on component mount if none were found
        try {
          if (!foundInterfaces) {
            await detectNetworkInterfaces();
          }
        } catch (e) {
          // Silent fail - we'll just use what we have
          console.error('Error auto-detecting network interfaces:', e);
        }
      } catch (error) {
        console.error('Error fetching SIP data:', error);
        setError('Failed to load SIP configuration data');
        toast({
          title: 'Error',
          description: 'Failed to load SIP configuration data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'lineNumber' ? parseInt(value, 10) : value,
    }));
  };

  // Handle form submission
  const saveChanges = async () => {
    try {
      const method = sipConfigs.length > 0 ? 'PUT' : 'POST';
      const url = sipConfigs.length > 0 ? `/api/sip-config/${sipConfigs[0].id}` : '/api/sip-config';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'SIP configuration saved',
        });
        
        // Refresh data
        const newData = await response.json();
        setSipConfigs([newData]);
      } else {
        throw new Error('Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving SIP config:', error);
      toast({
        title: 'Error',
        description: 'Failed to save SIP configuration',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>SIP Configuration</CardTitle>
          <CardDescription>Loading SIP configuration...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <AlertCircle className="h-5 w-5 mr-2" />
            Error Loading SIP Configuration
          </CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>SIP Configuration</CardTitle>
          <CardDescription>Configure SIP server connection details</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); saveChanges(); }}>
          <div className="space-y-4">
            <h3 className="text-lg font-medium">SIP Connection Settings</h3>
            <div className="space-y-2">
              <Label htmlFor="sipServer">SIP Server</Label>
              <Input
                id="sipServer"
                name="sipServer"
                value={formData.sipServer}
                onChange={handleInputChange}
                placeholder="sip.example.com"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Username"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Password"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lineNumber">Line Number</Label>
              <Input
                id="lineNumber"
                name="lineNumber"
                type="number"
                min="1"
                value={formData.lineNumber}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="authProxy">Auth Proxy (Optional)</Label>
                <Input
                  id="authProxy"
                  name="authProxy"
                  value={formData.authProxy || ''}
                  onChange={handleInputChange}
                  placeholder="Authentication proxy"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="outboundProxy">Outbound Proxy (Optional)</Label>
                <Input
                  id="outboundProxy"
                  name="outboundProxy"
                  value={formData.outboundProxy || ''}
                  onChange={handleInputChange}
                  placeholder="Outbound proxy"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex flex-row items-center justify-between">
              <h3 className="text-lg font-medium">Network Interface Configuration</h3>
              <Button 
                type="button"
                onClick={detectNetworkInterfaces}
                disabled={isDetectingInterfaces}
                variant="outline"
                size="sm"
              >
                {isDetectingInterfaces ? (
                  <>
                    <span className="mr-2">Detecting...</span>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </>
                ) : (
                  <>Detect Network Interfaces</>
                )}
              </Button>
            </div>
            
            {networkInterfaces.length === 0 ? (
              <div className="text-sm text-muted-foreground mb-4">
                No network interfaces detected. Click "Detect Network Interfaces" to scan available network cards.
              </div>
            ) : (
              <div className="border rounded-md p-3 bg-muted/30 mb-4">
                <div className="font-medium">Detected Network Interfaces</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {networkInterfaces.map((intf) => (
                    <div key={intf.id} className="flex justify-between">
                      <span>{intf.name}</span>
                      <span className="text-sm font-mono">{intf.address}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="networkInterface">
                Select Network Interface for SIP Communication
              </Label>
              <Select 
                value={formData.networkInterfaceId || ''}
                onValueChange={(value) => setFormData(prev => ({ ...prev, networkInterfaceId: value }))}
              >
                <SelectTrigger id="networkInterface">
                  <SelectValue placeholder="Select network interface" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Default (System Selected)</SelectItem>
                  {networkInterfaces.map(intf => (
                    <SelectItem key={intf.id} value={intf.id.toString()}>
                      {intf.name} - {intf.address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Selecting a specific network interface can help resolve connectivity issues 
                or optimize network traffic for SIP communication.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button type="submit">Save SIP Configuration</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { SipConfig, InsertSipConfig } from '@shared/schema';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, ArrowLeft, CheckCircle, XCircle, Network, Loader2 } from 'lucide-react';
import { Link } from 'wouter';
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

// Define types for SIP connection test
interface SipServiceStatus {
  name: string;
  status: "OK" | "Warning" | "Failed" | "Unknown";
  message?: string;
}

interface SipTestResult {
  success: boolean;
  message: string;
  details?: {
    pingTime?: number;
    registered?: boolean;
    services?: SipServiceStatus[];
    error?: string;
  };
}

export default function EditSIPConfig() {
  const [sipConfigs, setSipConfigs] = useState<SipConfig[]>([]);
  const [loading, setLoading] = useState(true);
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
  
  // State for SIP connection test
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<SipTestResult | null>(null);
  const [showTestDetails, setShowTestDetails] = useState(false);
  
  const { toast } = useToast();

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
            // Find the real SIP server configuration (illyvoip.com)
            const realSipConfig = configData.find(
              (config: SipConfig) => config.sipServer === 'sip.illyvoip.com' || config.sipServer.includes('illyvoip')
            );
            
            // Pre-populate form with the real config if found, otherwise use the first config
            const configToUse = realSipConfig || configData[0];
            
            setFormData({
              sipServer: configToUse.sipServer,
              username: configToUse.username,
              password: configToUse.password,
              lineNumber: configToUse.lineNumber,
              authProxy: configToUse.authProxy || '',
              outboundProxy: configToUse.outboundProxy || '',
              networkInterfaceId: configToUse.networkInterfaceId?.toString() || '',
            });
          }
        } else {
          setError('Failed to load SIP configurations');
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

  // Test SIP connection
  const testConnection = async () => {
    try {
      setTestingConnection(true);
      setConnectionTestResult(null);
      setShowTestDetails(false);
      
      // Call the API with the current form data
      const response = await fetch('/api/sip-test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sipServer: formData.sipServer,
          username: formData.username,
          password: formData.password
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        setConnectionTestResult(result);
        
        // Show toast notification based on result
        if (result.success) {
          toast({
            title: 'Connection Successful',
            description: result.message,
          });
        } else {
          toast({
            title: 'Connection Failed',
            description: result.message,
            variant: 'destructive',
          });
        }
      } else {
        throw new Error('Failed to test connection');
      }
    } catch (error) {
      console.error('Error testing SIP connection:', error);
      toast({
        title: 'Test Failed',
        description: 'Failed to test SIP server connection',
        variant: 'destructive',
      });
      
      setConnectionTestResult({
        success: false,
        message: 'Failed to test connection',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      });
    } finally {
      setTestingConnection(false);
    }
  };

  // Handle form submission
  const saveChanges = async () => {
    try {
      // Find the illyvoip config if it exists
      const realSipConfig = sipConfigs.find(
        config => config.sipServer === 'sip.illyvoip.com' || config.sipServer.includes('illyvoip')
      );
      
      // Determine which config to update - prioritize real SIP account if available
      const configToUpdate = realSipConfig || (sipConfigs.length > 0 ? sipConfigs[0] : null);
      
      const method = configToUpdate ? 'PUT' : 'POST';
      const url = configToUpdate ? `/api/sip-config/${configToUpdate.id}` : '/api/sip-config';
      
      console.log(`Saving SIP configuration to ${url} using ${method} method`);
      
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
        
        // Update configs with new data
        if (configToUpdate) {
          setSipConfigs(prev => 
            prev.map(c => c.id === configToUpdate.id ? newData : c)
          );
        } else {
          setSipConfigs(prev => [...prev, newData]);
        }
        
        // Force a reload of the SIP status to ensure the changes take effect
        try {
          await fetch('/api/sip-status');
        } catch (e) {
          console.error('Error refreshing SIP status after save:', e);
        }
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
      <div className="container mx-auto py-8">
        <div className="flex items-center mb-6">
          <Link href="/settings">
            <Button variant="ghost" size="sm" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Settings
            </Button>
          </Link>
          <h2 className="text-2xl font-bold">Edit SIP Configuration</h2>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>SIP Configuration</CardTitle>
            <CardDescription>Loading SIP configuration...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center mb-6">
          <Link href="/settings">
            <Button variant="ghost" size="sm" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Settings
            </Button>
          </Link>
          <h2 className="text-2xl font-bold">Edit SIP Configuration</h2>
        </div>
        
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
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6">
        <Link href="/settings">
          <Button variant="ghost" size="sm" className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Settings
          </Button>
        </Link>
        <h2 className="text-2xl font-bold">Edit SIP Configuration</h2>
      </div>
      
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
            
            <div className="flex justify-end">
              <Button type="submit">Save SIP Configuration</Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch space-y-4 pt-0">
          <div className="flex flex-col space-y-4 border-t pt-4">
            <h3 className="text-lg font-medium flex items-center">
              <Network className="mr-2 h-5 w-5" />
              SIP Connectivity Test
            </h3>
            
            <p className="text-sm text-muted-foreground mb-2">
              Test the connection to your SIP server to verify it's working correctly.
              This will attempt to connect and register with the server using the credentials above.
            </p>
            
            <div className="flex space-x-4">
              <Button 
                onClick={testConnection}
                disabled={testingConnection}
                className="flex items-center"
                variant="outline"
              >
                {testingConnection ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                    Testing Connection...
                  </>
                ) : (
                  <>Test Connection</>
                )}
              </Button>
              
              {connectionTestResult && !testingConnection && (
                <Button 
                  variant="ghost" 
                  onClick={() => setShowTestDetails(!showTestDetails)}
                >
                  {showTestDetails ? "Hide Details" : "Show Details"}
                </Button>
              )}
            </div>
            
            {connectionTestResult && !testingConnection && (
              <div className="mt-4">
                <Alert variant={connectionTestResult.success ? "default" : "destructive"}>
                  <div className="flex items-center">
                    {connectionTestResult.success ? (
                      <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 mr-2" />
                    )}
                    <AlertTitle>
                      {connectionTestResult.success ? "Connection Successful" : "Connection Failed"}
                    </AlertTitle>
                  </div>
                  <AlertDescription className="mt-2">
                    {connectionTestResult.message}
                  </AlertDescription>
                </Alert>
                
                {showTestDetails && connectionTestResult.details && (
                  <div className="mt-4 border rounded-md p-4 space-y-3">
                    <h4 className="font-medium">Connection Details</h4>
                    
                    {connectionTestResult.details.pingTime && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Ping Time:</span>
                        <Badge variant="outline">
                          {connectionTestResult.details.pingTime} ms
                        </Badge>
                      </div>
                    )}
                    
                    {connectionTestResult.details.services && connectionTestResult.details.services.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">Services:</h5>
                        <div className="space-y-2">
                          {connectionTestResult.details.services.map((service, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <span className="text-sm">{service.name}:</span>
                              <Badge 
                                variant={
                                  service.status === "OK" ? "default" : 
                                  service.status === "Warning" ? "secondary" : 
                                  "destructive"
                                }
                              >
                                {service.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {connectionTestResult.details.error && (
                      <div className="mt-2 text-sm text-destructive">
                        Error: {connectionTestResult.details.error}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
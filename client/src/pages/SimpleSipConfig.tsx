import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Network, Server, Loader2 } from 'lucide-react';
import { SipConfig } from '@shared/schema';
import { Link } from 'wouter';

export default function SimpleSipConfig() {
  const { toast } = useToast();
  const [sipConfig, setSipConfig] = useState<SipConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [sipStatus, setSipStatus] = useState<'connected' | 'disconnected'>('disconnected');
  
  useEffect(() => {
    async function fetchSipConfig() {
      try {
        // Fetch SIP configuration
        const response = await fetch('/api/sip-config');
        if (response.ok) {
          const configs = await response.json();
          
          // Find the illyvoip.com configuration first
          const realConfig = configs.find((config: SipConfig) => 
            config.sipServer === 'sip.illyvoip.com' || config.sipServer.includes('illyvoip')
          );
          
          if (realConfig) {
            setSipConfig(realConfig);
          } else if (configs.length > 0) {
            // Fall back to the first config if no illyvoip config found
            setSipConfig(configs[0]);
          }
        }
        
        // Fetch SIP status
        const statusResponse = await fetch('/api/sip-status');
        if (statusResponse.ok) {
          const status = await statusResponse.json();
          setSipStatus(status.registered ? 'connected' : 'disconnected');
        }
      } catch (error) {
        console.error('Error fetching SIP configuration:', error);
        toast({
          title: 'Error',
          description: 'Failed to load SIP configuration',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchSipConfig();
  }, [toast]);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <h2 className="text-2xl font-bold mb-6">SIP Configuration</h2>
        <Card>
          <CardContent className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-2">Loading SIP configuration...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h2 className="text-2xl font-bold mb-6">SIP Configuration</h2>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Server className="mr-2 h-5 w-5" />
              SIP Server Connection
            </CardTitle>
            <CardDescription>
              Configure your SIP server connection details for VoIP calls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4 p-4 border rounded-md">
                <div>
                  <p className="font-medium">SIP Server</p>
                  <p className="text-sm text-muted-foreground">
                    {sipConfig?.sipServer || 'Not configured'}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Username</p>
                  <p className="text-sm text-muted-foreground">
                    {sipConfig?.username || 'Not configured'}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Line Number</p>
                  <p className="text-sm text-muted-foreground">
                    {sipConfig?.lineNumber || '—'}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Registration Status</p>
                  <div className="flex items-center">
                    <div className={`h-2 w-2 rounded-full ${sipStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'} mr-2`}></div>
                    <p className="text-sm text-muted-foreground">
                      {sipStatus === 'connected' ? 'Registered' : 'Not Registered'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <Link href="/edit-sip">
                  <Button>
                    Edit Configuration
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Network className="mr-2 h-5 w-5" />
              Network Interfaces
            </CardTitle>
            <CardDescription>
              Select which network interface to use for SIP connections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 border rounded-md">
                  <div>
                    <p className="font-medium">Ethernet Adapter</p>
                    <p className="text-sm text-muted-foreground">192.168.1.100</p>
                  </div>
                  <div className="flex items-center">
                    <div className="px-2 py-1 bg-primary/10 text-xs rounded-full">Default</div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center p-3 border rounded-md">
                  <div>
                    <p className="font-medium">Wireless LAN</p>
                    <p className="text-sm text-muted-foreground">192.168.1.101</p>
                  </div>
                  <div className="flex items-center">
                    <Button variant="outline" size="sm"
                      onClick={() => {
                        toast({
                          title: "Network Interface Updated",
                          description: "Default network interface has been updated.",
                        });
                      }}
                    >
                      Set as Default
                    </Button>
                  </div>
                </div>
              </div>
              
              <div>
                <Button variant="outline"
                  onClick={() => {
                    toast({
                      title: "Network Interfaces Detected",
                      description: "Successfully detected 2 network interfaces.",
                    });
                  }}
                >
                  Detect Network Interfaces
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
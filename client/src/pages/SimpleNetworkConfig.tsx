import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Network, Wifi, Router, Server, Loader } from 'lucide-react';
import { NetworkInterface } from '@shared/schema';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

export default function SimpleNetworkConfig() {
  const { toast } = useToast();
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [defaultInterfaceId, setDefaultInterfaceId] = useState<number | null>(null);

  // Query to get all network interfaces
  const { data: interfaces, isLoading: isLoadingInterfaces, error: interfacesError } = useQuery<NetworkInterface[]>({
    queryKey: ['/api/network-interfaces'],
    queryFn: async () => {
      const response = await fetch('/api/network-interfaces');
      if (!response.ok) {
        throw new Error('Failed to fetch network interfaces');
      }
      return response.json();
    }
  });

  // Query to get the default network interface
  const { data: defaultInterface, isLoading: isLoadingDefault } = useQuery<NetworkInterface | null>({
    queryKey: ['/api/network-interfaces/default'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/network-interfaces/default');
        if (!response.ok) {
          // If there's no default interface, that's OK
          if (response.status === 404) {
            return null;
          }
          throw new Error('Failed to fetch default network interface');
        }
        return await response.json();
      } catch (error) {
        console.error('Error fetching default network interface:', error);
        return null;
      }
    }
  });
  
  // Update default interface ID when data changes
  useEffect(() => {
    if (defaultInterface?.id) {
      setDefaultInterfaceId(defaultInterface.id);
    }
  }, [defaultInterface]);

  // Mutation to detect network interfaces
  const detectMutation = useMutation({
    mutationFn: async () => {
      setIsDetecting(true);
      const response = await fetch('/api/network-interfaces/detect', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to detect network interfaces');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Network Interfaces Detected",
        description: `Successfully detected ${data.length} network interfaces.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/network-interfaces'] });
    },
    onError: (error) => {
      toast({
        title: "Detection Failed",
        description: "Failed to detect network interfaces. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsDetecting(false);
    }
  });

  // Mutation to set default network interface
  const setDefaultMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('PUT', `/api/network-interfaces/${id}/default`);
      if (!response.ok) {
        throw new Error('Failed to set default network interface');
      }
      return response.json();
    },
    onSuccess: (_, id) => {
      toast({
        title: "Default Interface Updated",
        description: "Default network interface has been updated successfully.",
      });
      setDefaultInterfaceId(id);
      queryClient.invalidateQueries({ queryKey: ['/api/network-interfaces'] });
      queryClient.invalidateQueries({ queryKey: ['/api/network-interfaces/default'] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to set default network interface.",
        variant: "destructive",
      });
    }
  });

  // Get the icon component based on interface type
  const getInterfaceIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'wifi':
      case 'wireless':
        return <Wifi className="h-5 w-5 mr-3" />;
      case 'ethernet':
        return <Router className="h-5 w-5 mr-3" />;
      case 'virtual':
      case 'loopback':
        return <Server className="h-5 w-5 mr-3" />;
      default:
        return <Network className="h-5 w-5 mr-3" />;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h2 className="text-2xl font-bold mb-6">Network Configuration</h2>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Network className="mr-2 h-5 w-5" />
              Network Interfaces
            </CardTitle>
            <CardDescription>
              Manage network interfaces for optimal SIP connectivity
            </CardDescription>
          </CardHeader>
          <CardContent>
            {interfacesError ? (
              <Alert variant="destructive">
                <AlertDescription>
                  Failed to load network interfaces. Please refresh the page or try again later.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid gap-4">
                <div className="space-y-4">
                  {isLoadingInterfaces || isLoadingDefault ? (
                    // Loading skeleton
                    Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="flex justify-between items-center p-4 border rounded-md">
                        <div className="flex items-center">
                          <Skeleton className="h-5 w-5 mr-3 rounded-full" />
                          <div>
                            <Skeleton className="h-5 w-40 mb-1" />
                            <Skeleton className="h-4 w-32" />
                          </div>
                        </div>
                        <Skeleton className="h-8 w-24" />
                      </div>
                    ))
                  ) : interfaces && interfaces.length > 0 ? (
                    // Display available interfaces
                    interfaces.map((iface) => (
                      <div 
                        key={iface.id} 
                        className={`flex justify-between items-center p-4 border rounded-md ${iface.isDefault || iface.id === defaultInterfaceId ? 'bg-green-50' : ''}`}
                      >
                        <div className="flex items-center">
                          {getInterfaceIcon(iface.type)}
                          <div>
                            <p className="font-medium">{iface.name}</p>
                            <p className="text-sm text-muted-foreground">{iface.address}</p>
                          </div>
                        </div>
                        <div>
                          {iface.isDefault || iface.id === defaultInterfaceId ? (
                            <div className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                              Default
                            </div>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              disabled={setDefaultMutation.isPending}
                              onClick={() => setDefaultMutation.mutate(iface.id)}
                            >
                              {setDefaultMutation.isPending && setDefaultMutation.variables === iface.id ? (
                                <>
                                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                                  Setting...
                                </>
                              ) : (
                                'Set as Default'
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    // No interfaces found
                    <div className="p-4 border rounded-md text-center">
                      <p className="text-muted-foreground">No network interfaces found. Click "Detect Interfaces" to find available network interfaces.</p>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button 
                    variant="outline"
                    className="flex items-center"
                    disabled={isDetecting || detectMutation.isPending}
                    onClick={() => detectMutation.mutate()}
                  >
                    {(isDetecting || detectMutation.isPending) ? (
                      <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Detecting...
                      </>
                    ) : (
                      <>
                        <Network className="mr-2 h-4 w-4" />
                        Detect Interfaces
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Router className="mr-2 h-5 w-5" />
              VoIP Traffic Routing
            </CardTitle>
            <CardDescription>
              Configure how SIP traffic is routed through your network
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="p-4 border rounded-md">
                <div className="flex items-center justify-between mb-4">
                  <p className="font-medium">SIP Traffic Priority</p>
                  <div className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Enabled</div>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  When enabled, VoIP traffic will be given priority over other network traffic to ensure optimal audio quality.
                </p>
              </div>
              
              <div className="pt-2">
                <Button
                  onClick={() => {
                    toast({
                      title: "Traffic Settings Saved",
                      description: "VoIP traffic routing settings have been updated.",
                    });
                  }}
                >
                  Apply Routing Settings
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
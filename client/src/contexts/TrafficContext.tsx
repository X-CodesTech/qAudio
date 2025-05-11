import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  CommercialClient, 
  CommercialCampaign, 
  CommercialSpot, 
  InsertCommercialClient, 
  InsertCommercialCampaign, 
  InsertCommercialSpot 
} from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

interface TrafficContextType {
  // Clients
  clients: CommercialClient[];
  isLoadingClients: boolean;
  selectedClient: CommercialClient | null;
  setSelectedClient: (client: CommercialClient | null) => void;
  createClient: (client: InsertCommercialClient) => Promise<CommercialClient>;
  updateClient: (id: number, client: Partial<InsertCommercialClient>) => Promise<CommercialClient>;
  deleteClient: (id: number) => Promise<void>;
  
  // Campaigns
  campaigns: CommercialCampaign[];
  isLoadingCampaigns: boolean;
  selectedCampaign: CommercialCampaign | null;
  setSelectedCampaign: (campaign: CommercialCampaign | null) => void;
  createCampaign: (campaign: InsertCommercialCampaign) => Promise<CommercialCampaign>;
  updateCampaign: (id: number, campaign: Partial<InsertCommercialCampaign>) => Promise<CommercialCampaign>;
  deleteCampaign: (id: number) => Promise<void>;
  
  // Spots
  spots: CommercialSpot[];
  isLoadingSpots: boolean;
  selectedSpot: CommercialSpot | null;
  setSelectedSpot: (spot: CommercialSpot | null) => void;
  createSpot: (campaignId: number, spot: InsertCommercialSpot) => Promise<CommercialSpot>;
  deleteSpot: (campaignId: number, spotId: number) => Promise<void>;
  
  // Reports
  generateCampaignReport: (campaignId: number) => Promise<void>;
  generateCampaignInvoice: (campaignId: number) => Promise<void>;
}

const TrafficContext = createContext<TrafficContextType | null>(null);

interface TrafficProviderProps {
  children: ReactNode;
}

export const TrafficProvider: React.FC<TrafficProviderProps> = ({ children }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Client state
  const [selectedClient, setSelectedClient] = useState<CommercialClient | null>(null);
  
  // Campaign state
  const [selectedCampaign, setSelectedCampaign] = useState<CommercialCampaign | null>(null);
  
  // Spot state
  const [selectedSpot, setSelectedSpot] = useState<CommercialSpot | null>(null);
  
  // Fetch clients
  const { 
    data: clients = [], 
    isLoading: isLoadingClients 
  } = useQuery({
    queryKey: ['/api/radio/commercial/clients'],
    staleTime: 60000, // 1 minute
  });
  
  // Create client mutation
  const createClientMutation = useMutation({
    mutationFn: async (client: InsertCommercialClient) => {
      const response = await apiRequest('POST', '/api/radio/commercial/clients', client);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/radio/commercial/clients'] });
      toast({
        title: 'Client created successfully',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating client',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: async ({ id, client }: { id: number; client: Partial<InsertCommercialClient> }) => {
      const response = await apiRequest('PATCH', `/api/radio/commercial/clients/${id}`, client);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/radio/commercial/clients'] });
      toast({
        title: 'Client updated successfully',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating client',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Delete client mutation
  const deleteClientMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/radio/commercial/clients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/radio/commercial/clients'] });
      setSelectedClient(null);
      toast({
        title: 'Client deleted successfully',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting client',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Fetch campaigns (all or filtered by client)
  const {
    data: campaigns = [],
    isLoading: isLoadingCampaigns,
  } = useQuery({
    queryKey: ['/api/radio/commercial/campaigns', selectedClient?.id],
    staleTime: 60000, // 1 minute
    enabled: true, // Always fetch campaigns, even if no client is selected
  });
  
  // Create campaign mutation
  const createCampaignMutation = useMutation({
    mutationFn: async (campaign: InsertCommercialCampaign) => {
      const response = await apiRequest('POST', '/api/radio/commercial/campaigns', campaign);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/radio/commercial/campaigns'] });
      toast({
        title: 'Campaign created successfully',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating campaign',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Update campaign mutation
  const updateCampaignMutation = useMutation({
    mutationFn: async ({ id, campaign }: { id: number; campaign: Partial<InsertCommercialCampaign> }) => {
      const response = await apiRequest('PATCH', `/api/radio/commercial/campaigns/${id}`, campaign);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/radio/commercial/campaigns'] });
      toast({
        title: 'Campaign updated successfully',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating campaign',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Delete campaign mutation
  const deleteCampaignMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/radio/commercial/campaigns/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/radio/commercial/campaigns'] });
      setSelectedCampaign(null);
      toast({
        title: 'Campaign deleted successfully',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting campaign',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Fetch spots for selected campaign
  const {
    data: spots = [],
    isLoading: isLoadingSpots,
  } = useQuery({
    queryKey: ['/api/radio/commercial/campaigns', selectedCampaign?.id, 'spots'],
    staleTime: 60000, // 1 minute
    enabled: !!selectedCampaign, // Only fetch spots if a campaign is selected
  });
  
  // Create spot mutation
  const createSpotMutation = useMutation({
    mutationFn: async ({ campaignId, spot }: { campaignId: number; spot: InsertCommercialSpot }) => {
      const response = await apiRequest('POST', `/api/radio/commercial/campaigns/${campaignId}/spots`, spot);
      return await response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/radio/commercial/campaigns', variables.campaignId, 'spots'] 
      });
      toast({
        title: 'Spot created successfully',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating spot',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Delete spot mutation
  const deleteSpotMutation = useMutation({
    mutationFn: async ({ campaignId, spotId }: { campaignId: number; spotId: number }) => {
      await apiRequest('DELETE', `/api/radio/commercial/campaigns/${campaignId}/spots/${spotId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/radio/commercial/campaigns', variables.campaignId, 'spots'] 
      });
      setSelectedSpot(null);
      toast({
        title: 'Spot deleted successfully',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting spot',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Generate campaign report
  const generateCampaignReportMutation = useMutation({
    mutationFn: async (campaignId: number) => {
      await apiRequest('GET', `/api/radio/commercial/campaigns/${campaignId}/report`);
    },
    onSuccess: () => {
      toast({
        title: 'Campaign report generated',
        description: 'Report has been downloaded',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error generating report',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Generate campaign invoice
  const generateCampaignInvoiceMutation = useMutation({
    mutationFn: async (campaignId: number) => {
      await apiRequest('GET', `/api/radio/commercial/campaigns/${campaignId}/invoice`);
    },
    onSuccess: () => {
      toast({
        title: 'Campaign invoice generated',
        description: 'Invoice has been downloaded',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error generating invoice',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Wrapper functions to simplify the API for consumers of the context
  const createClient = async (client: InsertCommercialClient) => {
    return await createClientMutation.mutateAsync(client);
  };

  const updateClient = async (id: number, client: Partial<InsertCommercialClient>) => {
    return await updateClientMutation.mutateAsync({ id, client });
  };

  const deleteClient = async (id: number) => {
    await deleteClientMutation.mutateAsync(id);
  };

  const createCampaign = async (campaign: InsertCommercialCampaign) => {
    return await createCampaignMutation.mutateAsync(campaign);
  };

  const updateCampaign = async (id: number, campaign: Partial<InsertCommercialCampaign>) => {
    return await updateCampaignMutation.mutateAsync({ id, campaign });
  };

  const deleteCampaign = async (id: number) => {
    await deleteCampaignMutation.mutateAsync(id);
  };

  const createSpot = async (campaignId: number, spot: InsertCommercialSpot) => {
    return await createSpotMutation.mutateAsync({ campaignId, spot });
  };

  const deleteSpot = async (campaignId: number, spotId: number) => {
    await deleteSpotMutation.mutateAsync({ campaignId, spotId });
  };

  const generateCampaignReport = async (campaignId: number) => {
    await generateCampaignReportMutation.mutateAsync(campaignId);
  };

  const generateCampaignInvoice = async (campaignId: number) => {
    await generateCampaignInvoiceMutation.mutateAsync(campaignId);
  };

  return (
    <TrafficContext.Provider
      value={{
        // Clients
        clients,
        isLoadingClients,
        selectedClient,
        setSelectedClient,
        createClient,
        updateClient,
        deleteClient,
        
        // Campaigns
        campaigns,
        isLoadingCampaigns,
        selectedCampaign,
        setSelectedCampaign,
        createCampaign,
        updateCampaign,
        deleteCampaign,
        
        // Spots
        spots,
        isLoadingSpots,
        selectedSpot,
        setSelectedSpot,
        createSpot,
        deleteSpot,
        
        // Reports
        generateCampaignReport,
        generateCampaignInvoice,
      }}
    >
      {children}
    </TrafficContext.Provider>
  );
};

export const useTraffic = () => {
  const context = useContext(TrafficContext);
  if (!context) {
    throw new Error('useTraffic must be used within a TrafficProvider');
  }
  return context;
};
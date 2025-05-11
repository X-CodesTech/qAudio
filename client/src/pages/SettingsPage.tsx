import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Phone, SettingsIcon, Users, Activity, Network, Server, Zap, Paintbrush } from 'lucide-react';
import { SettingsUserManagement } from '@/components/SettingsUserManagement';
import { SettingsSystemStatus } from '@/components/SettingsSystemStatus';
import SimpleAudioRouting from './SimpleAudioRouting';
import SimpleSipConfig from './SimpleSipConfig';
import SimpleNetworkConfig from './SimpleNetworkConfig';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import AdminViewTabs from '@/components/AdminViewTabs';

export default function SettingsPage() {
  // Always start with 'status' tab as it's the most reliable
  const [activeTab, setActiveTab] = useState('status');
  
  return (
    <div className="container mx-auto py-8">
      <header className="mb-8">
        <div className="flex justify-between items-center">
          <div className="flex space-x-4 items-center">
            <Link href="/">
              <div className="flex items-center space-x-2 cursor-pointer">
                <Phone className="h-6 w-6 text-emerald-600" />
                <h1 className="text-2xl font-bold text-emerald-700">Mazen Studio Settings</h1>
              </div>
            </Link>
            
            {/* Admin navigation tabs */}
            <div className="ml-4">
              <AdminViewTabs />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/device-connections">
              <Button variant="outline" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span>Device Connections</span>
              </Button>
            </Link>
            <Link href="/theme-creator">
              <Button variant="outline" className="flex items-center gap-2">
                <Paintbrush className="h-4 w-4" />
                <span>Theme Creator</span>
              </Button>
            </Link>
            <div className="text-sm text-muted-foreground">
              Settings & Administration
            </div>
          </div>
        </div>
      </header>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b">
          <TabsList className="h-12 w-full justify-start rounded-none bg-transparent p-0">
            <TabsTrigger
              value="status"
              className="flex items-center rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary"
            >
              <Activity className="mr-2 h-4 w-4" />
              System Status
            </TabsTrigger>
            
            <TabsTrigger
              value="audio"
              className="flex items-center rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary"
            >
              <Phone className="mr-2 h-4 w-4" />
              Audio Routing
            </TabsTrigger>
            
            <TabsTrigger
              value="sip"
              className="flex items-center rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary"
            >
              <Server className="mr-2 h-4 w-4" />
              SIP Configuration
            </TabsTrigger>
            
            <TabsTrigger
              value="users"
              className="flex items-center rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary"
            >
              <Users className="mr-2 h-4 w-4" />
              User Management
            </TabsTrigger>
            
            <TabsTrigger
              value="network"
              className="flex items-center rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary"
            >
              <Network className="mr-2 h-4 w-4" />
              Network
            </TabsTrigger>
          </TabsList>
        </div>
        
        <div className="mt-8">
          <TabsContent value="status" className="m-0">
            <SettingsSystemStatus />
          </TabsContent>
          
          <TabsContent value="audio" className="m-0">
            <SimpleAudioRouting />
          </TabsContent>
          
          <TabsContent value="sip" className="m-0">
            <SimpleSipConfig />
          </TabsContent>
          
          <TabsContent value="users" className="m-0">
            <SettingsUserManagement />
          </TabsContent>
          
          <TabsContent value="network" className="m-0">
            <SimpleNetworkConfig />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
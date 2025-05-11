import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProducerView from '@/pages/ProducerView';
import TalentsView from '@/pages/TalentsView';
import RemoteStudioView from '@/pages/RemoteStudioView';
import TechView from '@/pages/TechView';
import AdminView from '@/pages/AdminView';
import PerformanceDashboardView from '@/pages/PerformanceDashboardView';
import RadioAutomationPage from '@/pages/RadioAutomationPage';
import WaveInteractionDemo from '@/pages/WaveInteractionDemo';
import { useAuth } from '@/contexts/AuthContext';
import { Radio, Headphones, Activity, Settings, User, BarChart3, Music, Radio as RadioIcon, Wand2 } from 'lucide-react';

interface AdminLayoutProps {
  children?: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState('/admin');
  const { currentUser } = useAuth();
  
  // Update active tab based on location
  useEffect(() => {
    setActiveTab(location);
  }, [location]);
  
  // Only render tabs for admin users
  if (currentUser?.role !== 'admin') {
    return <>{children}</>;
  }
  
  // Render the content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case '/producer':
        return <ProducerView />;
      case '/talents':
        return <TalentsView />;
      case '/remote-studio':
        return <RemoteStudioView />;
      case '/tech':
        return <TechView />;
      case '/performance-dashboard':
        return <PerformanceDashboardView />;
      case '/admin':
        return <AdminView />;
      case '/wave-demo':
        return <WaveInteractionDemo />;
      default:
        return children;
    }
  };
  
  // Map location path to tab value
  const getTabValue = () => {
    const path = location.startsWith('/') ? location.substring(1) : location;
    return path || 'admin';
  };

  const handleTabChange = (value: string) => {
    // Scroll to top of page when changing tabs
    window.scrollTo(0, 0);
    setActiveTab(`/${value}`);
    window.history.pushState(null, '', `/${value}`);
  };

  // Tab definitions with icons
  const tabs = [
    { 
      id: 'producer', 
      label: 'Producer',
      icon: <Radio className="h-4 w-4 mr-2" />
    },
    { 
      id: 'talents', 
      label: 'Talents',
      icon: <Headphones className="h-4 w-4 mr-2" />
    },
    { 
      id: 'remote-studio', 
      label: 'RE Studio',
      icon: <Headphones className="h-4 w-4 mr-2" />
    },
    { 
      id: 'tech', 
      label: 'Tech',
      icon: <Activity className="h-4 w-4 mr-2" />
    },
    {
      id: 'performance-dashboard',
      label: 'Dashboard',
      icon: <BarChart3 className="h-4 w-4 mr-2" />
    },
    {
      id: 'radio-automation',
      label: 'Automation',
      icon: <Music className="h-4 w-4 mr-2" />
    },
    {
      id: 'wave-demo',
      label: 'Wave Demo',
      icon: <Wand2 className="h-4 w-4 mr-2" />
    },
    { 
      id: 'admin', 
      label: 'Admin',
      icon: <Settings className="h-4 w-4 mr-2" />
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100">
      <div className="container mx-auto px-4 py-4">
        <Tabs
          defaultValue={getTabValue()}
          value={getTabValue()}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <Card className="bg-zinc-800 border-zinc-700 mb-4">
            <CardContent className="p-2">
              <TabsList className="bg-zinc-900 grid grid-cols-8 h-auto p-1">
                {tabs.map(tab => (
                  <TabsTrigger 
                    key={tab.id} 
                    value={tab.id}
                    className="flex items-center h-10"
                  >
                    {tab.icon}
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </CardContent>
          </Card>
          
          <div className="min-h-[calc(100vh-150px)]">
            {tabs.map(tab => (
              <TabsContent key={tab.id} value={tab.id} className="mt-0 border-none p-0">
                {tab.id === 'producer' && <ProducerView />}
                {tab.id === 'talents' && <TalentsView />}
                {tab.id === 'remote-studio' && <RemoteStudioView />}
                {tab.id === 'tech' && <TechView />}
                {tab.id === 'performance-dashboard' && <PerformanceDashboardView />}
                {tab.id === 'radio-automation' && <RadioAutomationPage />}
                {tab.id === 'wave-demo' && <WaveInteractionDemo />}
                {tab.id === 'admin' && <AdminView />}
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>
    </div>
  );
}
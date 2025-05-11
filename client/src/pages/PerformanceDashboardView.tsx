import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import StudioPerformanceDashboard from '@/components/StudioPerformanceDashboard';
import AdminViewTabs from '@/components/AdminViewTabs';
import { BarChart3, Radio } from 'lucide-react';
import QCallerLogo from '@assets/qcaller_logo_v4.png';

export default function PerformanceDashboardView() {
  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800 shadow-md">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-orange-500" />
                <h1 className="text-xl font-bold">Performance Dashboard</h1>
              </div>
              <AdminViewTabs />
            </div>
            
            <img 
              src={QCallerLogo} 
              alt="QCaller Studio" 
              className="h-8 w-auto mx-auto absolute left-1/2 transform -translate-x-1/2"
            />
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="container mx-auto px-4 py-6">
        <StudioPerformanceDashboard />
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import TalentView from '@/pages/TalentView';
import TalentViewB from '@/pages/TalentViewB';
import { Headphones, Radio } from 'lucide-react';
import AdminViewTabs from '@/components/AdminViewTabs';
import QCallerLogo from '@assets/qcaller_logo_v4.png';

export default function TalentsView() {
  const [studioTab, setStudioTab] = useState('studio-a');
  
  // Handle studio tab change
  const handleStudioChange = (value: string) => {
    // No longer scrolling to top of page when changing studio
    setStudioTab(value);
  };

  // Get color theme based on studio
  const getStudioColor = () => {
    return studioTab === 'studio-a' 
      ? { bg: 'bg-orange-600', hover: 'hover:bg-orange-700', text: 'text-white' }
      : { bg: 'bg-green-600', hover: 'hover:bg-green-700', text: 'text-white' };
  };

  const studioColor = getStudioColor();

  return (
    <div className="bg-zinc-900 min-h-screen">
      {/* Fixed header with switcher */}
      <div className="sticky top-0 z-30 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800 shadow-md mb-6">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Badge 
                variant="outline" 
                className={`${studioTab === 'studio-a' ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'} px-3 py-1.5`}
              >
                {studioTab === 'studio-a' ? 'Studio A' : 'Studio B'}
              </Badge>
            
            <img 
              src={QCallerLogo} 
              alt="QCaller Studio" 
              className="h-8 w-auto mx-auto absolute left-1/2 transform -translate-x-1/2"
            />
            
            {/* Studio switcher in the header */}
            <div className="inline-flex bg-zinc-800 rounded-md p-1 border border-zinc-700">
              <Button
                variant={studioTab === 'studio-a' ? 'default' : 'outline'}
                onClick={() => handleStudioChange('studio-a')}
                className={`flex items-center gap-2 ${
                  studioTab === 'studio-a' 
                    ? 'bg-orange-600 text-white hover:bg-orange-700' 
                    : 'text-zinc-400 hover:text-zinc-100'
                }`}
                size="sm"
              >
                <Radio size={14} />
                Studio A
              </Button>
              <Button
                variant={studioTab === 'studio-b' ? 'default' : 'outline'}
                onClick={() => handleStudioChange('studio-b')}
                className={`flex items-center gap-2 ${
                  studioTab === 'studio-b' 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'text-zinc-400 hover:text-zinc-100'
                }`}
                size="sm"
              >
                <Radio size={14} />
                Studio B
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="container mx-auto px-4">
        {studioTab === 'studio-a' ? <TalentView /> : <TalentViewB />}
      </div>
    </div>
  );
}
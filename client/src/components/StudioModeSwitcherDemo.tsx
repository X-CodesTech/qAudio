import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useStudioMode } from '@/contexts/StudioModeContext';
import StudioModeSwitcher from '@/components/StudioModeSwitcher';
import { StudioTransition, StudioPanel, StudioIndicator } from '@/components/StudioTransition';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ChevronRight, 
  Headphones, 
  Radio, 
  Mic2, 
  Building2, 
  GitBranch, 
  Layers, 
  Settings,
  LayoutDashboard
} from 'lucide-react';

export default function StudioModeSwitcherDemo() {
  const { activeStudio, setActiveStudio } = useStudioMode();
  const [transitionType, setTransitionType] = useState<'fade' | 'slide' | 'scale' | 'wipe'>('fade');

  return (
    <div className="p-4 space-y-6 bg-zinc-900 rounded-lg border border-zinc-800 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutDashboard className={`h-5 w-5 ${activeStudio === 'A' ? 'text-blue-400' : 'text-green-400'} transition-colors duration-300`} />
          <h2 className="text-xl font-semibold text-white">Studio Mode Switcher</h2>
        </div>
        <StudioIndicator />
      </div>

      <div className="flex items-center justify-center gap-4 py-6">
        <StudioModeSwitcher 
          activeStudio={activeStudio}
          variant="full"
          onStudioChange={setActiveStudio}
        />
      </div>

      {/* Transition type selector */}
      <Tabs defaultValue="fade" className="w-full" 
        value={transitionType}
        onValueChange={(v) => setTransitionType(v as any)}
      >
        <TabsList className="w-full grid grid-cols-4 bg-zinc-800">
          <TabsTrigger value="fade">Fade</TabsTrigger>
          <TabsTrigger value="slide">Slide</TabsTrigger>
          <TabsTrigger value="scale">Scale</TabsTrigger>
          <TabsTrigger value="wipe">Wipe</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Content that changes with studio */}
      <StudioTransition transitionType={transitionType}>
        <StudioContent />
      </StudioTransition>
    </div>
  );
}

function StudioContent() {
  const { activeStudio, getStudioColor } = useStudioMode();
  
  // Dynamic content based on active studio
  const studioInfo = {
    A: {
      title: 'Studio A Dashboard',
      description: 'Primary broadcast studio for main programming',
      icon: <Radio className="h-5 w-5 text-blue-400" />,
      panels: [
        { title: 'Live Lines', count: 3, icon: <Headphones className="h-4 w-4" /> },
        { title: 'Audio Channels', count: 8, icon: <Layers className="h-4 w-4" /> },
        { title: 'Broadcast Quality', value: '96%', icon: <Mic2 className="h-4 w-4" /> },
      ]
    },
    B: {
      title: 'Studio B Dashboard',
      description: 'Secondary production studio for special segments',
      icon: <Building2 className="h-5 w-5 text-green-400" />,
      panels: [
        { title: 'Live Lines', count: 3, icon: <Headphones className="h-4 w-4" /> },
        { title: 'Audio Channels', count: 6, icon: <Layers className="h-4 w-4" /> },
        { title: 'Production Ready', value: 'Yes', icon: <GitBranch className="h-4 w-4" /> },
      ]
    }
  };

  const currentStudio = studioInfo[activeStudio];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        {currentStudio.icon}
        <div>
          <h3 className={`text-lg font-semibold ${getStudioColor('text')}`}>
            {currentStudio.title}
          </h3>
          <p className="text-sm text-zinc-400">{currentStudio.description}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        {currentStudio.panels.map((panel, index) => (
          <StudioPanel key={index} className="flex flex-col items-center justify-center py-6">
            <div className={`rounded-full p-2 ${activeStudio === 'A' ? 'bg-blue-900/30' : 'bg-green-900/30'} mb-2`}>
              {panel.icon}
            </div>
            <div className="text-xl font-bold">
              {panel.count || panel.value}
            </div>
            <div className="text-xs text-zinc-400">{panel.title}</div>
          </StudioPanel>
        ))}
      </div>
      
      <Card className={`border ${activeStudio === 'A' ? 'border-blue-900/50' : 'border-green-900/50'} bg-zinc-900`}>
        <CardHeader>
          <CardTitle className={getStudioColor('text')}>
            {activeStudio === 'A' ? 'Studio A Controls' : 'Studio B Controls'}
          </CardTitle>
          <CardDescription>
            Manage {activeStudio === 'A' ? 'primary' : 'secondary'} studio settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between py-1 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-zinc-400" />
                <span>Audio Routing</span>
              </div>
              <ChevronRight className="h-4 w-4 text-zinc-500" />
            </div>
            <div className="flex items-center justify-between py-1 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Mic2 className="h-4 w-4 text-zinc-400" />
                <span>Broadcast Settings</span>
              </div>
              <ChevronRight className="h-4 w-4 text-zinc-500" />
            </div>
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <Headphones className="h-4 w-4 text-zinc-400" />
                <span>Line Management</span>
              </div>
              <ChevronRight className="h-4 w-4 text-zinc-500" />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            className={`w-full ${
              activeStudio === 'A' 
                ? 'bg-blue-900/20 border-blue-700/30 text-blue-300 hover:bg-blue-800/30 hover:text-blue-200' 
                : 'bg-green-900/20 border-green-700/30 text-green-300 hover:bg-green-800/30 hover:text-green-200'
            }`}
          >
            Open Studio Control Panel
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
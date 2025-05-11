import React from 'react';
import { useState } from 'react';
import {
  Sliders,
  BarChart3, // Changed from WaveformIcon which doesn't exist
  BarChart,
  Radio,
  Mic2,
  Music,
  SlidersHorizontal,
  Volume2,
  Waves,
  Activity,
  LayoutGrid,
  Settings,
  PlugIcon
} from 'lucide-react';

// Define the menu item interface
interface MenuItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
}

// Props for the component
interface AudioProcessorLeftMenuProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const AudioProcessorLeftMenu: React.FC<AudioProcessorLeftMenuProps> = ({
  activeSection,
  onSectionChange
}) => {
  // Define the menu categories - these will be consistent across all audio processing pages
  const menuItems: MenuItem[] = [
    {
      id: 'input-output',
      name: 'Input\\Output',
      icon: <Mic2 className="h-5 w-5" />,
      color: 'text-green-500'
    },
    {
      id: 'pre-processor',
      name: 'Pre-Processing Tools',
      icon: <LayoutGrid className="h-5 w-5" />,
      color: 'text-indigo-500'
    },
    {
      id: 'equalizer',
      name: 'Equalizer',
      icon: <Sliders className="h-5 w-5" />,
      color: 'text-violet-500'
    },
    {
      id: 'dynamics',
      name: 'Dynamics',
      icon: <BarChart3 className="h-5 w-5" />,
      color: 'text-yellow-500'
    },
    {
      id: 'multiband',
      name: 'FM/AM/HD Radio',
      icon: <Radio className="h-5 w-5" />,
      color: 'text-orange-500'
    },
    {
      id: 'stereo',
      name: 'Stereo Tool',
      icon: <SlidersHorizontal className="h-5 w-5" />,
      color: 'text-rose-500'
    },
    {
      id: 'loudness',
      name: 'Loudness',
      icon: <Volume2 className="h-5 w-5" />,
      color: 'text-red-500'
    },
    {
      id: 'limiter',
      name: 'Limiter',
      icon: <Waves className="h-5 w-5" />,
      color: 'text-purple-500'
    },
    {
      id: 'streaming',
      name: 'Streaming',
      icon: <Radio className="h-5 w-5" />,
      color: 'text-emerald-500'
    },
    {
      id: 'plugin-system',
      name: 'Plugin & System INT',
      icon: <PlugIcon className="h-5 w-5" />,
      color: 'text-purple-500'
    },
    {
      id: 'workflow',
      name: 'Workflow Management',
      icon: <Settings className="h-5 w-5" />,
      color: 'text-blue-500'
    },
    {
      id: 'analyzer',
      name: 'Analyzer',
      icon: <Activity className="h-5 w-5" />,
      color: 'text-cyan-500'
    }
  ];

  return (
    <div className="h-full w-[265px] bg-gradient-to-b from-gray-900 to-gray-950 border-r border-amber-900/20 overflow-y-auto py-4 relative">
      {/* Background subtle pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
      }}></div>
      
      {/* Golden accent line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-700/50 via-yellow-500/70 to-amber-700/50"></div>
      
      <div className="px-3 mb-6 relative z-10">
        <div className="flex items-center justify-center mb-5 bg-gradient-to-b from-gray-800/50 to-gray-900/50 rounded-lg p-3 border border-amber-900/10">
          <Radio className="h-7 w-7 text-yellow-500 mr-2" strokeWidth={1.5} />
          <h2 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-600">
            Audio Processor
          </h2>
        </div>
        <button 
          onClick={() => window.location.href = '/'}
          className="w-full flex items-center justify-center px-3 py-2.5 mb-2 text-sm rounded-md font-medium bg-gradient-to-br from-amber-700 to-amber-900 hover:from-amber-600 hover:to-amber-800 text-amber-100 transition-all shadow-md hover:shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
          Return to Dashboard
        </button>
        <div className="h-[1px] bg-gradient-to-r from-transparent via-amber-800/20 to-transparent my-3"></div>
      </div>
      
      <div className="px-3 space-y-1 relative z-10">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={`flex items-center w-full px-3 py-2.5 text-sm rounded-md font-medium transition-all ${
              activeSection === item.id
                ? `bg-gradient-to-r from-gray-800 to-gray-900 shadow-lg border border-amber-800/30 ${item.color}`
                : 'text-gray-400 hover:bg-gray-800/30 hover:text-amber-300/90 border border-transparent'
            }`}
          >
            <span className={`flex items-center justify-center h-6 w-6 ${
              activeSection === item.id 
                ? `${item.color} bg-black/30 rounded-md p-1` 
                : 'text-amber-700'
            }`}>
              {item.icon}
            </span>
            <span className={`ml-2 ${activeSection === item.id ? 'text-amber-300' : ''}`}>
              {item.name}
            </span>
            {activeSection === item.id && (
              <span className="ml-auto w-1.5 h-6 bg-gradient-to-b from-amber-300 to-amber-600 rounded-full"></span>
            )}
          </button>
        ))}
      </div>
      
      <div className="px-3 mt-6 relative z-10">
        <div className="h-[1px] bg-gradient-to-r from-transparent via-amber-800/20 to-transparent my-4"></div>
        <div className="text-xs px-3 py-3 bg-black/20 rounded-lg border border-amber-900/10">
          <p className="text-amber-500/80">Audio Processor v1.0</p>
          <p className="mt-1 text-amber-600/60">© {new Date().getFullYear()} QCaller Studio</p>
        </div>
      </div>
    </div>
  );
};

export default AudioProcessorLeftMenu;
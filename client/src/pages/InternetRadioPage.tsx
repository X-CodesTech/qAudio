import React, { useState } from 'react';
import AudioProcessorLeftMenu from '@/components/audio-processor/AudioProcessorLeftMenu';
import InputOutputSection from '@/components/audio-processor/InputOutputSection';
import PreProcessingSection from '@/components/audio-processor/PreProcessingSection';
import EqualizerSection from '@/components/audio-processor/EqualizerSection';
import CompressorSection from '@/components/audio-processor/CompressorSection';
import StereoToolSection from '@/components/audio-processor/StereoToolSection';
import LoudnessSection from '@/components/audio-processor/LoudnessSection';
import LimiterSection from '@/components/audio-processor/LimiterSection';
import FMProcessingSection from '@/components/audio-processor/FMProcessingSection';
import WorkflowManagementSection from '@/components/audio-processor/WorkflowManagementSection';
import PluginSystemSection from '@/components/audio-processor/PluginSystemSection';
import AnalyzerSection from '@/components/audio-processor/AnalyzerSection';
import StreamingPage from '../pages/StreamingPage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Radio, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

const InternetRadioPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('input-output');

  // Function to render the active section component
  const renderActiveSection = () => {
    switch (activeSection) {
      case 'input-output':
        return <InputOutputSection />;
      case 'pre-processor':
        return <PreProcessingSection />;
      case 'equalizer':
        return <EqualizerSection />;
      case 'dynamics':
        return <CompressorSection />;
      case 'stereo':
        return <StereoToolSection />;
      case 'loudness':
        return <LoudnessSection />;
      case 'limiter':
        return <LimiterSection />;
      case 'streaming':
        return <StreamingPage />;
      case 'multiband':
        return <FMProcessingSection />;
      case 'workflow':
        return <WorkflowManagementSection />;
      case 'plugin-system':
        return <PluginSystemSection />;
      case 'analyzer':
        return <AnalyzerSection />;
      default:
        return (
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-yellow-500 flex items-center">
                <Radio className="h-5 w-5 mr-2" />
                {activeSection === 'output' ? 'Output' : 'Audio Processor Section'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-6 flex flex-col items-center justify-center">
                <div className="text-5xl text-gray-700 mb-4">
                  {activeSection === 'output' && '📻'}
                </div>
                <p className="text-gray-400 text-center mb-4">
                  You're currently viewing the {activeSection} section. 
                </p>
                <div className="mt-4 p-4 bg-gray-800 rounded-md w-full max-w-md">
                  <p className="text-yellow-400 font-medium text-center">Coming Soon</p>
                  <p className="text-gray-300 mt-2 text-center">
                    This section will include advanced audio processing capabilities.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-b from-gray-950 to-gray-900">
      {/* Left Side Menu */}
      <AudioProcessorLeftMenu 
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Header with gradient background */}
        <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-800/50 relative">
          <div className="absolute -top-6 -left-6 -right-6 h-24 bg-gradient-to-r from-blue-900/30 via-indigo-900/20 to-purple-900/30 blur-xl opacity-50 z-0"></div>
          
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-600 z-10 flex items-center">
            <Radio className="h-6 w-6 mr-3 text-yellow-500" strokeWidth={1.5} />
            Professional Broadcast Audio Processor
          </h1>
          
          <div className="flex gap-2 z-10">
            <Button 
              variant="outline" 
              size="sm"
              className="border-amber-800/50 text-amber-400 hover:bg-amber-950/50 hover:text-amber-300"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
            <Button
              variant="default"
              size="sm"
              className="bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-gray-950 font-medium"
            >
              Create Default Settings
            </Button>
          </div>
        </div>
        
        {/* Content area with subtle pattern overlay */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 relative">
          <div className="absolute inset-0 opacity-5 z-0 pointer-events-none" style={{
            backgroundImage: 'radial-gradient(rgba(255, 215, 0, 0.1) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}></div>
          
          {/* Main Content */}
          <div className="lg:col-span-12 relative z-10">
            {renderActiveSection()}
          </div>
          
          {/* Decorative audio wave element */}
          <div className="absolute bottom-0 left-0 right-0 h-16 overflow-hidden opacity-20 pointer-events-none">
            <svg viewBox="0 0 1440 120" className="absolute bottom-0">
              <defs>
                <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#e6b01e" />
                  <stop offset="50%" stopColor="#f7d875" />
                  <stop offset="100%" stopColor="#e6b01e" />
                </linearGradient>
              </defs>
              <path 
                d="M0,32L60,37.3C120,43,240,53,360,53.3C480,53,600,43,720,48C840,53,960,75,1080,80C1200,85,1320,75,1380,69.3L1440,64L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z" 
                fill="url(#gold-gradient)" 
                fillOpacity="1"
              ></path>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InternetRadioPage;
import React, { useState } from 'react';
import AudioProcessorLeftMenu from '@/components/audio-processor/AudioProcessorLeftMenu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Radio, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

const InternetRadioPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('multiband');

  return (
    <div className="flex h-screen bg-gray-950">
      {/* Left Side Menu */}
      <AudioProcessorLeftMenu 
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-gray-950 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Internet Radio</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
            <Button
              variant="default"
              size="sm"
            >
              Create Default Settings
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Main Content */}
          <div className="md:col-span-8 space-y-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-yellow-500 flex items-center">
                  <Radio className="h-5 w-5 mr-2" />
                  {activeSection === 'multiband' ? 'Multiband Compressor' : 
                   activeSection === 'input' ? 'Input Settings' :
                   activeSection === 'equalizer' ? 'Equalizer' : 
                   activeSection === 'limiter' ? 'Limiter' : 
                   'Audio Processor Section'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  You're currently viewing the {activeSection} section. 
                  Use the left side menu to navigate between different audio processor sections.
                </p>
                <div className="mt-4 p-4 bg-gray-800 rounded-md">
                  <p className="text-yellow-400 font-medium">Feature in Progress</p>
                  <p className="text-gray-300 mt-2">
                    This section is currently being implemented with advanced audio processing capabilities.
                    The left-side menu structure has been put in place to allow for better navigation
                    between the different audio processing components.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right Column - Meters */}
          <div className="md:col-span-4 space-y-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-blue-500">Input/Output Meters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Input Level</p>
                    <div className="h-6 bg-gray-800 rounded-sm overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 animate-pulse" style={{ width: '65%' }}></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>-30dB</span>
                      <span>-18dB</span>
                      <span>-12dB</span>
                      <span>-6dB</span>
                      <span>0dB</span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Output Level</p>
                    <div className="h-6 bg-gray-800 rounded-sm overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 animate-pulse" style={{ width: '80%' }}></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>-30dB</span>
                      <span>-18dB</span>
                      <span>-12dB</span>
                      <span>-6dB</span>
                      <span>0dB</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-purple-500">Spectrum Analyzer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-40 bg-gray-800 rounded-sm p-2 flex items-end space-x-1">
                  {/* Simulated spectrum bars */}
                  {Array.from({ length: 32 }).map((_, i) => {
                    const height = Math.floor(Math.random() * 60) + 20;
                    return (
                      <div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-blue-500 to-purple-500 rounded-t-sm"
                        style={{ height: `${height}%` }}
                      ></div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>20Hz</span>
                  <span>100Hz</span>
                  <span>500Hz</span>
                  <span>1kHz</span>
                  <span>5kHz</span>
                  <span>20kHz</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InternetRadioPage;
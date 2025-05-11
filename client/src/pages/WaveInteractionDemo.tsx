import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Music, Play, Pause, Airplay, Volume2, Wand2 } from 'lucide-react';
import PlayfulWaveInteraction from '@/components/PlayfulWaveInteraction';

const WaveInteractionDemo: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState('demo1');

  // Example demo tracks
  const demoTracks = [
    {
      id: 1,
      title: "Funky Baseline",
      artist: "QCaller Studio",
      duration: 235,
      waveformData: generateRandomWaveform(120, 'smooth')
    },
    {
      id: 2,
      title: "Pop Anthem",
      artist: "Radio Hits",
      duration: 187,
      waveformData: generateRandomWaveform(120, 'dynamic')
    },
    {
      id: 3,
      title: "Smooth Jazz",
      artist: "Midnight Session",
      duration: 312,
      waveformData: generateRandomWaveform(120, 'gentle')
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center">
            <Airplay className="mr-2 h-6 w-6 text-yellow-500" />
            Playful Audio Wave Interaction
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel - Feature description */}
          <Card className="bg-zinc-900 border-zinc-800 lg:col-span-1">
            <CardHeader>
              <CardTitle>Interactive Audio Visualization</CardTitle>
              <CardDescription>
                Engaging audio waveform with playful effects and controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-zinc-400">
                This component provides a visually appealing and interactive audio waveform
                visualization with multiple animation effects and playback controls.
              </p>

              <div className="border-t border-zinc-800 pt-4">
                <h3 className="text-sm font-medium mb-2">Features:</h3>
                <ul className="text-sm text-zinc-400 space-y-1 ml-4 list-disc">
                  <li>Interactive waveform visualization</li>
                  <li>Multiple animation effects</li>
                  <li>Play, pause, skip controls</li>
                  <li>Volume adjustment</li>
                  <li>Responsive design</li>
                </ul>
              </div>

              <div className="border-t border-zinc-800 pt-4">
                <h3 className="text-sm font-medium mb-2">Animation Modes:</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="justify-start h-8 bg-zinc-800"
                  >
                    <Wand2 className="h-3 w-3 mr-1" />
                    Normal
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="justify-start h-8 bg-blue-900/30"
                  >
                    <Wand2 className="h-3 w-3 mr-1" />
                    Ripple
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="justify-start h-8 bg-green-900/30"
                  >
                    <Wand2 className="h-3 w-3 mr-1" />
                    Bounce
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="justify-start h-8 bg-purple-900/30"
                  >
                    <Wand2 className="h-3 w-3 mr-1" />
                    Rainbow
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right panel - Demo examples */}
          <Card className="bg-zinc-900 border-zinc-800 lg:col-span-2">
            <CardHeader className="border-b border-zinc-800">
              <CardTitle>Demo Examples</CardTitle>
              <CardDescription>
                Try out different configurations and effects
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <Tabs 
                value={activeTab} 
                onValueChange={setActiveTab}
                className="mb-6"
              >
                <TabsList className="bg-zinc-900 mb-4">
                  <TabsTrigger value="demo1" className="data-[state=active]:bg-zinc-800">
                    <Music className="h-4 w-4 mr-2" /> Example 1
                  </TabsTrigger>
                  <TabsTrigger value="demo2" className="data-[state=active]:bg-zinc-800">
                    <Music className="h-4 w-4 mr-2" /> Example 2
                  </TabsTrigger>
                  <TabsTrigger value="demo3" className="data-[state=active]:bg-zinc-800">
                    <Music className="h-4 w-4 mr-2" /> Example 3
                  </TabsTrigger>
                </TabsList>

                {/* Example 1 - Funky Baseline */}
                <TabsContent value="demo1">
                  <PlayfulWaveInteraction
                    waveformData={demoTracks[0].waveformData}
                    trackTitle={demoTracks[0].title}
                    trackArtist={demoTracks[0].artist}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                  <div className="mt-4 text-center text-sm text-zinc-400">
                    Try clicking the play button and using the effect button to change visualization modes
                  </div>
                </TabsContent>

                {/* Example 2 - Pop Anthem */}
                <TabsContent value="demo2">
                  <PlayfulWaveInteraction
                    waveformData={demoTracks[1].waveformData}
                    trackTitle={demoTracks[1].title}
                    trackArtist={demoTracks[1].artist}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                  <div className="mt-4 text-center text-sm text-zinc-400">
                    This example has a more dynamic waveform pattern with bigger amplitude variations
                  </div>
                </TabsContent>

                {/* Example 3 - Smooth Jazz */}
                <TabsContent value="demo3">
                  <PlayfulWaveInteraction
                    waveformData={demoTracks[2].waveformData}
                    trackTitle={demoTracks[2].title}
                    trackArtist={demoTracks[2].artist}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                  <div className="mt-4 text-center text-sm text-zinc-400">
                    This example has a smoother, gentler waveform pattern
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mt-6 border-t border-zinc-800 pt-6">
                <h3 className="font-medium mb-4">Player Customization Options</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-zinc-800 border-zinc-700">
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">Radio Station Environment</CardTitle>
                    </CardHeader>
                    <CardContent className="py-3">
                      <div className="flex gap-2">
                        <Button variant="default" size="sm" className="h-8">
                          <Play className="h-3 w-3 mr-1" /> Use in Studio A
                        </Button>
                        <Button variant="outline" size="sm" className="h-8">
                          <Volume2 className="h-3 w-3 mr-1" /> Add to Cart Wall
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-zinc-800 border-zinc-700">
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm">Audio Processing</CardTitle>
                    </CardHeader>
                    <CardContent className="py-3">
                      <div className="flex gap-2">
                        <Button variant="default" size="sm" className="h-8">
                          <Wand2 className="h-3 w-3 mr-1" /> Add Beat Effects
                        </Button>
                        <Button variant="outline" size="sm" className="h-8">
                          <Music className="h-3 w-3 mr-1" /> Auto Fade
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Helper function to generate random waveform data
function generateRandomWaveform(length = 100, type: 'smooth' | 'dynamic' | 'gentle' = 'smooth'): number[] {
  const waveform: number[] = [];
  
  for (let i = 0; i < length; i++) {
    let value: number;
    
    switch (type) {
      case 'dynamic':
        // More dramatic variations
        value = 
          0.4 + 
          0.4 * Math.sin(i * 0.15) + 
          0.3 * Math.sin(i * 0.3) +
          0.2 * Math.cos(i * 0.1) +
          0.15 * Math.random();
        break;
      
      case 'gentle':
        // Smoother, less variation
        value = 
          0.3 + 
          0.2 * Math.sin(i * 0.05) + 
          0.1 * Math.sin(i * 0.1) +
          0.05 * Math.cos(i * 0.2) +
          0.05 * Math.random();
        break;
      
      case 'smooth':
      default:
        // Standard balanced waveform
        value = 
          0.5 + 
          0.3 * Math.sin(i * 0.1) + 
          0.15 * Math.sin(i * 0.05) +
          0.1 * Math.sin(i * 0.2) +
          0.1 * Math.random();
    }
    
    // Ensure value is between 0 and 1
    waveform.push(Math.max(0, Math.min(1, value)));
  }
  
  return waveform;
}

export default WaveInteractionDemo;
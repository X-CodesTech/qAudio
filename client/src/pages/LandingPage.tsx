import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import QcallerLogo from "@assets/qcaller_logo_v4.png";
import { useToast } from '@/hooks/use-toast';
import { 
  UserCog, // Admin
  Radio, // Producer
  Mic2, // Talent A
  Mic, // Talent B
  Video, // Remote Studio
  PlaySquare, // Playout
  Wrench, // Tech
  BarChart3, // Traffic
  Settings,
  Users,
  Headphones,
  Music,
  Activity,
  AlertTriangle,
  Signal,
  ArrowRight,
  BarChart,
  Thermometer,
  RadioTower,
  Wifi,
  AudioLines, // Audio Logger
  Save,
  FileAudio,
  AudioWaveform
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

interface RoleCardProps {
  title: string;
  icon: React.ReactNode;
  bgColor: string;
  route: string;
  description: string;
}

const RoleCard: React.FC<RoleCardProps> = ({ title, icon, bgColor, route, description }) => {
  const [_, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Extract the role from the route
  const getRoleFromRoute = (route: string): string => {
    if (route.startsWith('/direct-access/')) {
      return route.split('/').pop() || '';
    }
    // Handle talent test routes directly
    if (route === '/talent-test-a') {
      return 'talent-test-a';
    }
    if (route === '/talent-test-b') {
      return 'talent-test-b';
    }
    return '';
  };

  const handleDirectLogin = async () => {
    try {
      setIsLoading(true);
      const role = getRoleFromRoute(route);
      
      // For talent test routes and remote studio, navigate directly without authentication
      if (route === '/talent-test-a' || route === '/talent-test-b' || route === '/remote-studio') {
        console.log(`Direct navigation to ${route}`);
        navigate(route);
        return;
      }
      
      if (!role) {
        console.error('No role found in route:', route);
        toast({
          title: 'Error',
          description: 'Could not determine role for direct access',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
      
      console.log(`Attempting direct login for role: ${role}`);
      
      // Call our new direct login endpoint
      const response = await fetch(`/api/direct-login/${role}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Direct login failed');
      }
      
      const userData = await response.json();
      console.log('Direct login successful:', userData);
      
      // Handle role-specific redirection
      let targetPath;
      switch (role) {
        case 'admin':
          targetPath = '/admin';
          break;
        case 'producer':
          targetPath = '/producer';
          break;
        case 'talent-a':
        case 'talent-test-a':
          targetPath = '/talent-test-a';
          break;
        case 'talent-b':
        case 'talent-test-b':
          targetPath = '/talent-test-b';
          break;
        case 'remote-studio':
          targetPath = '/remote-studio';
          break;
        case 'playout':
          targetPath = '/radio-automation';
          break;
        case 'tech':
          targetPath = '/tech';
          break;
        case 'traffic':
          targetPath = '/traffic';
          break;
        default:
          targetPath = '/';
      }
      
      // Force reload to ensure context is updated
      window.location.href = targetPath;
    } catch (error) {
      console.error('Direct login error:', error);
      toast({
        title: 'Login Failed',
        description: error instanceof Error ? error.message : 'Could not log in directly',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  return (
    <div 
      className={`${bgColor} rounded-lg shadow-lg p-6 cursor-pointer transition-all hover:scale-105 hover:shadow-xl relative`}
      onClick={handleDirectLogin}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg z-10">
          <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full"></div>
        </div>
      )}
      <div className="flex flex-col items-center text-center">
        <div className="bg-white/10 p-4 rounded-full mb-4 backdrop-blur-sm">
          {icon}
        </div>
        <h3 className="text-white text-xl font-bold mb-2">{title}</h3>
        <p className="text-gray-200 text-sm">{description}</p>
      </div>
    </div>
  );
};

// Transmitter type definition
interface Transmitter {
  id: number;
  siteName: string;
  frequency: string;
  forwardPower: number;
  reflectedPower: number;
  audioLevelLeft: number;
  audioLevelRight: number;
  temperature: number;
  hasAlarm: boolean;
  status: 'online' | 'offline' | 'warning';
}

// Component for displaying a single transmitter
const TransmitterCard: React.FC<{ transmitter: Transmitter }> = ({ transmitter }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'warning': return 'text-yellow-400';
      case 'offline': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  const getProgressColor = (value: number, max: number) => {
    const percentage = (value / max) * 100;
    if (percentage > 80) return 'bg-red-500';
    if (percentage > 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <RadioTower className="h-5 w-5" />
              {transmitter.siteName}
            </CardTitle>
            <p className="text-sm text-gray-400">{transmitter.frequency} MHz</p>
          </div>
          <div className={`flex items-center ${getStatusColor(transmitter.status)}`}>
            <Wifi className="h-4 w-4 mr-1" />
            <span className="text-xs font-medium">{transmitter.status.charAt(0).toUpperCase() + transmitter.status.slice(1)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Forward Power</span>
              <span>{transmitter.forwardPower} W</span>
            </div>
            <Progress value={(transmitter.forwardPower / 1000) * 100} className={`h-2 ${getProgressColor(transmitter.forwardPower, 1000)}`} />
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Reflected Power</span>
              <span>{transmitter.reflectedPower} W</span>
            </div>
            <Progress value={(transmitter.reflectedPower / 100) * 100} className={`h-2 ${getProgressColor(transmitter.reflectedPower, 100)}`} />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Left Audio</span>
                <span>{transmitter.audioLevelLeft} dB</span>
              </div>
              <Progress value={(transmitter.audioLevelLeft / -30) * 100} className="h-2 bg-blue-500" />
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Right Audio</span>
                <span>{transmitter.audioLevelRight} dB</span>
              </div>
              <Progress value={(transmitter.audioLevelRight / -30) * 100} className="h-2 bg-blue-600" />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Thermometer className="h-4 w-4 mr-1 text-orange-400" />
              <span className="text-sm">{transmitter.temperature}°C</span>
            </div>
            
            {transmitter.hasAlarm && (
              <div className="flex items-center text-red-500">
                <AlertTriangle className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Alarm</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const LandingPage: React.FC = () => {
  const [_, navigate] = useLocation();
  // Mock transmitter data - in a real app, this would come from an API
  const [transmitters, setTransmitters] = useState<Transmitter[]>([
    {
      id: 1,
      siteName: "Main Tower",
      frequency: "101.5",
      forwardPower: 850,
      reflectedPower: 15,
      audioLevelLeft: -18,
      audioLevelRight: -16,
      temperature: 36,
      hasAlarm: false,
      status: 'online'
    },
    {
      id: 2,
      siteName: "North Hill",
      frequency: "97.8",
      forwardPower: 650,
      reflectedPower: 22,
      audioLevelLeft: -20,
      audioLevelRight: -22,
      temperature: 42,
      hasAlarm: true,
      status: 'warning'
    },
    {
      id: 3,
      siteName: "Downtown",
      frequency: "93.2",
      forwardPower: 500,
      reflectedPower: 8,
      audioLevelLeft: -24,
      audioLevelRight: -25,
      temperature: 38,
      hasAlarm: false,
      status: 'online'
    },
    {
      id: 4,
      siteName: "East Side",
      frequency: "105.3",
      forwardPower: 0,
      reflectedPower: 0,
      audioLevelLeft: 0,
      audioLevelRight: 0,
      temperature: 0,
      hasAlarm: true,
      status: 'offline'
    },
    {
      id: 5,
      siteName: "West Mountains",
      frequency: "89.9",
      forwardPower: 750,
      reflectedPower: 12,
      audioLevelLeft: -15,
      audioLevelRight: -14,
      temperature: 33,
      hasAlarm: false,
      status: 'online'
    },
    {
      id: 6,
      siteName: "South Bay",
      frequency: "102.7",
      forwardPower: 950,
      reflectedPower: 30,
      audioLevelLeft: -19,
      audioLevelRight: -18,
      temperature: 45,
      hasAlarm: true,
      status: 'warning'
    },
    {
      id: 7,
      siteName: "Airport",
      frequency: "94.5",
      forwardPower: 400,
      reflectedPower: 5,
      audioLevelLeft: -22,
      audioLevelRight: -21,
      temperature: 37,
      hasAlarm: false,
      status: 'online'
    },
    {
      id: 8,
      siteName: "University",
      frequency: "107.1",
      forwardPower: 350,
      reflectedPower: 4,
      audioLevelLeft: -26,
      audioLevelRight: -28,
      temperature: 35,
      hasAlarm: false,
      status: 'online'
    },
    {
      id: 9,
      siteName: "Stadium",
      frequency: "99.9",
      forwardPower: 600,
      reflectedPower: 10,
      audioLevelLeft: -17,
      audioLevelRight: -19,
      temperature: 39,
      hasAlarm: false,
      status: 'online'
    },
    {
      id: 10,
      siteName: "Harbor",
      frequency: "91.3",
      forwardPower: 550,
      reflectedPower: 9,
      audioLevelLeft: -21,
      audioLevelRight: -23,
      temperature: 40,
      hasAlarm: false,
      status: 'online'
    }
  ]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header with logo */}
      <header className="py-8 bg-gradient-to-b from-gray-900 to-black">
        <div className="container mx-auto px-4 flex flex-col items-center">
          <img src={QcallerLogo} alt="QCaller Studio" className="h-28 mb-6 filter drop-shadow-lg" />
          <h1 className="text-4xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            QCaller Studio
          </h1>
          <p className="text-gray-300 text-center mt-3 max-w-2xl">
            Advanced radio automation and studio communication system with integrated traffic management
          </p>
          <div className="mt-4 flex space-x-2">
            <span className="px-3 py-1 bg-purple-900/40 text-purple-200 rounded-full text-xs font-medium">Radio</span>
            <span className="px-3 py-1 bg-blue-900/40 text-blue-200 rounded-full text-xs font-medium">VoIP</span>
            <span className="px-3 py-1 bg-amber-900/40 text-amber-200 rounded-full text-xs font-medium">Traffic</span>
            <span className="px-3 py-1 bg-gray-800/80 text-gray-200 rounded-full text-xs font-medium">Automation</span>
          </div>
        </div>
      </header>

      {/* Role selection grid */}
      <main className="flex-1 container mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold mb-8 flex items-center">
          <Users className="w-6 h-6 mr-2 text-purple-400" />
          Studio Access
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <RoleCard 
            title="Admin"
            icon={<UserCog className="w-8 h-8" />}
            bgColor="bg-purple-900 border border-purple-700"
            route="/direct-access/admin"
            description="Complete system administration"
          />
          
          <RoleCard 
            title="Producer"
            icon={<Users className="w-8 h-8" />}
            bgColor="bg-blue-900 border border-blue-700"
            route="/direct-access/producer"
            description="Call management and production tools"
          />
          
          <RoleCard 
            title="Talent Studio A"
            icon={<Mic2 className="w-8 h-8" />}
            bgColor="bg-orange-900 border border-orange-700"
            route="/talent-test-a"
            description="On-air studio interface for Studio A"
          />
          
          <RoleCard 
            title="Talent Studio B"
            icon={<Mic className="w-8 h-8" />}
            bgColor="bg-green-900 border border-green-700"
            route="/talent-test-b"
            description="On-air studio interface for Studio B"
          />
          
          <RoleCard 
            title="Remote Studio"
            icon={<Video className="w-8 h-8" />}
            bgColor="bg-red-900 border border-red-700"
            route="/remote-studio"
            description="Remote talent connection interface"
          />
          
          <RoleCard 
            title="Playout"
            icon={<Music className="w-8 h-8" />}
            bgColor="bg-gray-800 border border-gray-700"
            route="/direct-access/playout"
            description="Radio automation playout system"
          />
          
          <RoleCard 
            title="Tech"
            icon={<Settings className="w-8 h-8" />}
            bgColor="bg-cyan-900 border border-cyan-700"
            route="/direct-access/tech"
            description="Technical configuration and monitoring"
          />
          
          <RoleCard 
            title="Traffic"
            icon={<BarChart3 className="w-8 h-8" />}
            bgColor="bg-amber-900 border border-amber-700"
            route="/direct-access/traffic"
            description="Advertising and traffic management"
          />
          
          <div 
            className="bg-indigo-900 border border-indigo-700 rounded-lg shadow-lg p-6 cursor-pointer transition-all hover:scale-105 hover:shadow-xl relative"
            onClick={() => navigate('/audio-logger')}
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-white/10 p-4 rounded-full mb-4 backdrop-blur-sm">
                <AudioLines className="w-8 h-8" />
              </div>
              <h3 className="text-white text-xl font-bold mb-2">Audio Logger</h3>
              <p className="text-gray-200 text-sm">Multi-input audio recording system</p>
            </div>
          </div>
          
          <div 
            className="bg-blue-900 border border-blue-700 rounded-lg shadow-lg p-6 cursor-pointer transition-all hover:scale-105 hover:shadow-xl relative"
            onClick={() => navigate('/transmitters')}
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-white/10 p-4 rounded-full mb-4 backdrop-blur-sm">
                <RadioTower className="w-8 h-8" />
              </div>
              <h3 className="text-white text-xl font-bold mb-2">Transmitters</h3>
              <p className="text-gray-200 text-sm">Monitor transmitter network status</p>
            </div>
          </div>
          
          <div 
            className="bg-purple-900 border border-purple-700 rounded-lg shadow-lg p-6 cursor-pointer transition-all hover:scale-105 hover:shadow-xl relative"
            onClick={() => navigate('/logger-access')}
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-white/10 p-4 rounded-full mb-4 backdrop-blur-sm">
                <FileAudio className="w-8 h-8" />
              </div>
              <h3 className="text-white text-xl font-bold mb-2">Logger Access</h3>
              <p className="text-gray-200 text-sm">Edit and export archived audio recordings</p>
            </div>
          </div>
          
          <div 
            className="bg-blue-800 border border-blue-600 rounded-lg shadow-lg p-6 cursor-pointer transition-all hover:scale-105 hover:shadow-xl relative"
            onClick={() => navigate('/internet-radio')}
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-white/10 p-4 rounded-full mb-4 backdrop-blur-sm">
                <Radio className="w-8 h-8" />
              </div>
              <h3 className="text-white text-xl font-bold mb-2">Professional Broadcast Audio Processor</h3>
              <p className="text-gray-200 text-sm">Advanced audio processing for broadcasting</p>
            </div>
          </div>
          
          <div 
            className="bg-indigo-900 border border-indigo-700 rounded-lg shadow-lg p-6 cursor-pointer transition-all hover:scale-105 hover:shadow-xl relative"
            onClick={() => navigate('/studio-dashboard')}
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-white/10 p-4 rounded-full mb-4 backdrop-blur-sm">
                <BarChart3 className="w-8 h-8" />
              </div>
              <h3 className="text-white text-xl font-bold mb-2">Studio Dashboard</h3>
              <p className="text-gray-200 text-sm">Interactive performance analytics</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-2 bg-gray-900 border-t border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center md:flex-row md:justify-between md:items-center">
            <div className="mb-1 md:mb-0">
              <img src={QcallerLogo} alt="Logo" className="h-6" />
            </div>
            <div className="flex items-center">
              <div className="flex space-x-4 mx-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Activity className="w-4 h-4" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Headphones className="w-4 h-4" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <Music className="w-4 h-4" />
                </a>
              </div>
              <p className="text-gray-500 text-xs">
                &copy; {new Date().getFullYear()} Xcodes Innovation FZC. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
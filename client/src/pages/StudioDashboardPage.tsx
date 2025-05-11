import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  AreaChart, 
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Toggle } from '@/components/ui/toggle';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Activity,
  AlertCircle,
  BarChart3,
  BarChart4,
  ChevronDown,
  ChevronUp,
  Clock,
  Disc3,
  Download,
  FileAudio,
  Filter,
  Headphones,
  LineChart as LineChartIcon,
  Loader2,
  MicVocal,
  Mic2,
  Music2,
  Play,
  Radio,
  RefreshCw,
  Save,
  Settings,
  Signal,
  Timer,
  TrendingDown,
  TrendingUp,
  UserRound,
  Users,
  Volume2,
  Zap
} from 'lucide-react';

// Mock types for studio performance data
interface StudioUsageData {
  id: number;
  studioId: string;
  date: string;
  hoursUsed: number;
  mostActiveHour: number;
  userCount: number;
  sessionCount: number;
  averageSessionLength: number;
  peakAudioLevel: number;
}

interface TrackPlayData {
  id: number;
  trackId: number;
  trackTitle: string;
  artist: string;
  playCount: number;
  totalPlayDuration: number;
  lastPlayed: string;
  category: string;
}

interface UserActivity {
  id: number;
  userId: number;
  username: string;
  role: string;
  lastActive: string;
  totalSessions: number;
  totalHours: number;
  averageSessionLength: number;
  mostUsedFeature: string;
}

interface SystemMetric {
  id: number;
  timestamp: string;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIn: number;
  networkOut: number;
  activeConnections: number;
}

interface ErrorEvent {
  id: number;
  timestamp: string;
  type: string;
  message: string;
  component: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
}

// Main Dashboard Component
const StudioDashboardPage: React.FC = () => {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<string>('7d');
  const [selectedStudio, setSelectedStudio] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [refreshInterval, setRefreshInterval] = useState<number>(60); // in seconds
  const [showLegend, setShowLegend] = useState<boolean>(true);
  const [studioUsage, setStudioUsage] = useState<StudioUsageData[]>([]);
  const [trackPlayData, setTrackPlayData] = useState<TrackPlayData[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([]);
  const [errorEvents, setErrorEvents] = useState<ErrorEvent[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Mock data for studio usage
  const mockStudioUsage: StudioUsageData[] = [
    {
      id: 1,
      studioId: 'Studio A',
      date: '2025-04-26',
      hoursUsed: 15.5,
      mostActiveHour: 10,
      userCount: 8,
      sessionCount: 12,
      averageSessionLength: 78,
      peakAudioLevel: -12.4
    },
    {
      id: 2,
      studioId: 'Studio B',
      date: '2025-04-26',
      hoursUsed: 10.2,
      mostActiveHour: 14,
      userCount: 6,
      sessionCount: 8,
      averageSessionLength: 65,
      peakAudioLevel: -14.8
    },
    {
      id: 3,
      studioId: 'Studio A',
      date: '2025-04-27',
      hoursUsed: 16.8,
      mostActiveHour: 11,
      userCount: 7,
      sessionCount: 13,
      averageSessionLength: 82,
      peakAudioLevel: -11.9
    },
    {
      id: 4,
      studioId: 'Studio B',
      date: '2025-04-27',
      hoursUsed: 11.5,
      mostActiveHour: 15,
      userCount: 5,
      sessionCount: 9,
      averageSessionLength: 68,
      peakAudioLevel: -13.5
    },
    {
      id: 5,
      studioId: 'RE Studio',
      date: '2025-04-26',
      hoursUsed: 8.3,
      mostActiveHour: 16,
      userCount: 4,
      sessionCount: 6,
      averageSessionLength: 72,
      peakAudioLevel: -15.2
    },
    {
      id: 6,
      studioId: 'RE Studio',
      date: '2025-04-27',
      hoursUsed: 7.9,
      mostActiveHour: 17,
      userCount: 3,
      sessionCount: 5,
      averageSessionLength: 70,
      peakAudioLevel: -16.1
    },
    {
      id: 7,
      studioId: 'Tech Studio',
      date: '2025-04-26',
      hoursUsed: 5.2,
      mostActiveHour: 9,
      userCount: 2,
      sessionCount: 4,
      averageSessionLength: 55,
      peakAudioLevel: -18.6
    },
    {
      id: 8,
      studioId: 'Tech Studio',
      date: '2025-04-27',
      hoursUsed: 4.8,
      mostActiveHour: 10,
      userCount: 2,
      sessionCount: 3,
      averageSessionLength: 52,
      peakAudioLevel: -17.9
    },
    {
      id: 9,
      studioId: 'Studio A',
      date: '2025-04-28',
      hoursUsed: 17.2,
      mostActiveHour: 11,
      userCount: 9,
      sessionCount: 14,
      averageSessionLength: 85,
      peakAudioLevel: -10.8
    },
    {
      id: 10,
      studioId: 'Studio B',
      date: '2025-04-28',
      hoursUsed: 12.1,
      mostActiveHour: 14,
      userCount: 7,
      sessionCount: 10,
      averageSessionLength: 72,
      peakAudioLevel: -13.2
    },
    {
      id: 11,
      studioId: 'RE Studio',
      date: '2025-04-28',
      hoursUsed: 8.5,
      mostActiveHour: 16,
      userCount: 4,
      sessionCount: 7,
      averageSessionLength: 74,
      peakAudioLevel: -15.5
    },
    {
      id: 12,
      studioId: 'Tech Studio',
      date: '2025-04-28',
      hoursUsed: 5.5,
      mostActiveHour: 9,
      userCount: 3,
      sessionCount: 4,
      averageSessionLength: 58,
      peakAudioLevel: -17.5
    },
    {
      id: 13,
      studioId: 'Studio A',
      date: '2025-04-29',
      hoursUsed: 16.9,
      mostActiveHour: 10,
      userCount: 8,
      sessionCount: 13,
      averageSessionLength: 84,
      peakAudioLevel: -11.2
    },
    {
      id: 14,
      studioId: 'Studio B',
      date: '2025-04-29',
      hoursUsed: 11.8,
      mostActiveHour: 15,
      userCount: 6,
      sessionCount: 9,
      averageSessionLength: 70,
      peakAudioLevel: -14.1
    }
  ];

  // Mock data for track plays
  const mockTrackPlayData: TrackPlayData[] = [
    {
      id: 1,
      trackId: 101,
      trackTitle: 'Morning Show Intro',
      artist: 'In-house Production',
      playCount: 28,
      totalPlayDuration: 1680,
      lastPlayed: '2025-04-29T08:15:00Z',
      category: 'Jingles'
    },
    {
      id: 2,
      trackId: 102,
      trackTitle: 'News Background',
      artist: 'In-house Production',
      playCount: 42,
      totalPlayDuration: 3780,
      lastPlayed: '2025-04-29T09:30:00Z',
      category: 'Background'
    },
    {
      id: 3,
      trackId: 103,
      trackTitle: 'Weather Report Theme',
      artist: 'Studio Sound Effects',
      playCount: 35,
      totalPlayDuration: 2450,
      lastPlayed: '2025-04-29T10:45:00Z',
      category: 'Themes'
    },
    {
      id: 4,
      trackId: 104,
      trackTitle: 'Interview Background',
      artist: 'Ambient Sounds',
      playCount: 31,
      totalPlayDuration: 7440,
      lastPlayed: '2025-04-29T14:20:00Z',
      category: 'Background'
    },
    {
      id: 5,
      trackId: 105,
      trackTitle: 'Commercial Break Bumper',
      artist: 'In-house Production',
      playCount: 56,
      totalPlayDuration: 2240,
      lastPlayed: '2025-04-29T11:55:00Z',
      category: 'Jingles'
    },
    {
      id: 6,
      trackId: 106,
      trackTitle: 'Call-in Show Theme',
      artist: 'Studio Sound Effects',
      playCount: 18,
      totalPlayDuration: 1620,
      lastPlayed: '2025-04-28T16:10:00Z',
      category: 'Themes'
    },
    {
      id: 7,
      trackId: 107,
      trackTitle: 'Station ID',
      artist: 'In-house Production',
      playCount: 98,
      totalPlayDuration: 1960,
      lastPlayed: '2025-04-29T15:45:00Z',
      category: 'Identification'
    },
    {
      id: 8,
      trackId: 108,
      trackTitle: 'Traffic Report Background',
      artist: 'Ambient Sounds',
      playCount: 22,
      totalPlayDuration: 1320,
      lastPlayed: '2025-04-29T08:50:00Z',
      category: 'Background'
    }
  ];

  // Mock data for user activity
  const mockUserActivity: UserActivity[] = [
    {
      id: 1,
      userId: 1001,
      username: 'john_producer',
      role: 'producer',
      lastActive: '2025-04-29T16:45:00Z',
      totalSessions: 42,
      totalHours: 168.5,
      averageSessionLength: 4.01,
      mostUsedFeature: 'playout'
    },
    {
      id: 2,
      userId: 1002,
      username: 'sarah_host',
      role: 'talent',
      lastActive: '2025-04-29T12:30:00Z',
      totalSessions: 38,
      totalHours: 152.0,
      averageSessionLength: 4.00,
      mostUsedFeature: 'microphone'
    },
    {
      id: 3,
      userId: 1003,
      username: 'mike_tech',
      role: 'tech',
      lastActive: '2025-04-29T17:15:00Z',
      totalSessions: 50,
      totalHours: 225.5,
      averageSessionLength: 4.51,
      mostUsedFeature: 'settings'
    },
    {
      id: 4,
      userId: 1004,
      username: 'lisa_remote',
      role: 'remote',
      lastActive: '2025-04-29T10:20:00Z',
      totalSessions: 30,
      totalHours: 95.0,
      averageSessionLength: 3.17,
      mostUsedFeature: 'call-in'
    },
    {
      id: 5,
      userId: 1005,
      username: 'david_admin',
      role: 'admin',
      lastActive: '2025-04-29T15:10:00Z',
      totalSessions: 56,
      totalHours: 232.5,
      averageSessionLength: 4.15,
      mostUsedFeature: 'library'
    }
  ];

  // Mock data for system metrics
  const mockSystemMetrics: SystemMetric[] = Array.from({ length: 24 }, (_, i) => {
    const now = new Date();
    now.setHours(now.getHours() - 23 + i);
    
    return {
      id: i + 1,
      timestamp: now.toISOString(),
      cpuUsage: 20 + Math.random() * 50,
      memoryUsage: 30 + Math.random() * 40,
      diskUsage: 45 + Math.random() * 20,
      networkIn: Math.random() * 15,
      networkOut: Math.random() * 10,
      activeConnections: Math.floor(2 + Math.random() * 12)
    };
  });

  // Mock data for error events
  const mockErrorEvents: ErrorEvent[] = [
    {
      id: 1,
      timestamp: '2025-04-28T09:45:12Z',
      type: 'Network',
      message: 'Connection to remote studio lost temporarily',
      component: 'Remote Studio Interface',
      severity: 'medium',
      resolved: true
    },
    {
      id: 2,
      timestamp: '2025-04-28T14:22:35Z',
      type: 'Audio',
      message: 'Audio dropout detected in Studio B',
      component: 'Audio Processor',
      severity: 'high',
      resolved: true
    },
    {
      id: 3,
      timestamp: '2025-04-29T08:15:27Z',
      type: 'System',
      message: 'High CPU usage detected during morning show',
      component: 'System Resources',
      severity: 'medium',
      resolved: true
    },
    {
      id: 4,
      timestamp: '2025-04-29T11:05:43Z',
      type: 'Database',
      message: 'Slow query performance in media library',
      component: 'Media Database',
      severity: 'low',
      resolved: false
    },
    {
      id: 5,
      timestamp: '2025-04-29T15:37:18Z',
      type: 'Audio',
      message: 'Audio levels exceeding threshold in Studio A',
      component: 'Audio Level Monitor',
      severity: 'medium',
      resolved: false
    }
  ];

  // Fetch data based on date range and studio selection
  useEffect(() => {
    setIsLoading(true);
    
    // Simulate API call delay
    const timer = setTimeout(() => {
      setStudioUsage(mockStudioUsage);
      setTrackPlayData(mockTrackPlayData);
      setUserActivity(mockUserActivity);
      setSystemMetrics(mockSystemMetrics);
      setErrorEvents(mockErrorEvents);
      setLastUpdated(new Date());
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [dateRange, selectedStudio]);

  // Set up periodic refresh
  useEffect(() => {
    const interval = setInterval(() => {
      // Only refresh if not already loading
      if (!isLoading) {
        setIsLoading(true);
        
        // Simulate API call delay
        setTimeout(() => {
          setStudioUsage(prevData => {
            // Simulate some changes in data
            return prevData.map(item => ({
              ...item,
              hoursUsed: item.hoursUsed + (Math.random() * 0.2 - 0.1),
              userCount: Math.max(1, item.userCount + (Math.random() > 0.7 ? 1 : 0) - (Math.random() > 0.7 ? 1 : 0)),
              sessionCount: Math.max(1, item.sessionCount + (Math.random() > 0.7 ? 1 : 0) - (Math.random() > 0.7 ? 1 : 0)),
            }));
          });
          
          // Update system metrics with new values
          setSystemMetrics(prevMetrics => {
            const newMetric = {
              id: prevMetrics.length + 1,
              timestamp: new Date().toISOString(),
              cpuUsage: 20 + Math.random() * 50,
              memoryUsage: 30 + Math.random() * 40,
              diskUsage: 45 + Math.random() * 20,
              networkIn: Math.random() * 15,
              networkOut: Math.random() * 10,
              activeConnections: Math.floor(2 + Math.random() * 12)
            };
            
            return [...prevMetrics.slice(1), newMetric];
          });
          
          setLastUpdated(new Date());
          setIsLoading(false);
        }, 1000);
      }
    }, refreshInterval * 1000);
    
    return () => clearInterval(interval);
  }, [refreshInterval, isLoading]);

  // Calculate dashboard summary metrics
  const totalHoursUsed = studioUsage.reduce((sum, item) => sum + item.hoursUsed, 0);
  const totalSessions = studioUsage.reduce((sum, item) => sum + item.sessionCount, 0);
  const totalUsers = userActivity.length;
  const totalTracks = trackPlayData.length;
  const totalPlayCount = trackPlayData.reduce((sum, item) => sum + item.playCount, 0);
  const activeErrorsCount = errorEvents.filter(err => !err.resolved).length;
  const averageCpuUsage = systemMetrics.reduce((sum, item) => sum + item.cpuUsage, 0) / systemMetrics.length;
  const averageMemoryUsage = systemMetrics.reduce((sum, item) => sum + item.memoryUsage, 0) / systemMetrics.length;
  
  // Prepare chart data
  const studioUsageChartData = studioUsage.reduce((acc, item) => {
    const existingDay = acc.find(d => d.date === item.date);
    if (existingDay) {
      existingDay[item.studioId] = item.hoursUsed;
    } else {
      const newDay = { date: item.date };
      newDay[item.studioId] = item.hoursUsed;
      acc.push(newDay);
    }
    return acc;
  }, [] as any[]).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const userRoleDistribution = userActivity.reduce((acc, user) => {
    const role = user.role;
    const existingRole = acc.find(r => r.role === role);
    if (existingRole) {
      existingRole.count += 1;
    } else {
      acc.push({ role, count: 1 });
    }
    return acc;
  }, [] as { role: string; count: number }[]);

  const trackCategoryDistribution = trackPlayData.reduce((acc, track) => {
    const category = track.category;
    const existingCategory = acc.find(c => c.category === category);
    if (existingCategory) {
      existingCategory.count += 1;
      existingCategory.playCount += track.playCount;
    } else {
      acc.push({ category, count: 1, playCount: track.playCount });
    }
    return acc;
  }, [] as { category: string; count: number; playCount: number }[]);

  const topTracks = [...trackPlayData]
    .sort((a, b) => b.playCount - a.playCount)
    .slice(0, 5);

  const mostActiveUsers = [...userActivity]
    .sort((a, b) => b.totalHours - a.totalHours)
    .slice(0, 5);

  const studioColors = {
    'Studio A': '#F28C28',
    'Studio B': '#2E8B57',
    'RE Studio': '#DC3545',
    'Tech Studio': '#8A2BE2'
  };

  const severityColors = {
    'low': '#3498db',
    'medium': '#f39c12',
    'high': '#e74c3c',
    'critical': '#8e44ad'
  };

  const roleColors = {
    'admin': '#3498db',
    'producer': '#2ecc71',
    'talent': '#f39c12',
    'tech': '#9b59b6',
    'remote': '#1abc9c'
  };

  const categoryColors = {
    'Jingles': '#3498db',
    'Background': '#2ecc71',
    'Themes': '#f39c12',
    'Identification': '#9b59b6'
  };

  // Handle refresh button click
  const handleRefresh = () => {
    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setStudioUsage(mockStudioUsage);
      setTrackPlayData(mockTrackPlayData);
      setUserActivity(mockUserActivity);
      setSystemMetrics(mockSystemMetrics);
      setErrorEvents(mockErrorEvents);
      setLastUpdated(new Date());
      setIsLoading(false);
      
      toast({
        title: "Dashboard Refreshed",
        description: "All dashboard data has been updated",
        duration: 3000,
      });
    }, 1000);
  };

  // Handle date range change
  const handleDateRangeChange = (value: string) => {
    setDateRange(value);
  };

  // Handle studio selection change
  const handleStudioChange = (value: string) => {
    setSelectedStudio(value);
  };

  // Handle refresh interval change
  const handleRefreshIntervalChange = (value: number[]) => {
    setRefreshInterval(value[0]);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  // Format time for display
  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm:ss');
  };

  // Format duration in hours and minutes
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="container mx-auto py-6 px-4 bg-gray-950 text-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Studio Performance Dashboard</h1>
          <p className="text-gray-400">
            Monitoring key metrics and performance indicators
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center text-sm text-gray-400">
            <Clock className="h-4 w-4 mr-1" />
            Last updated: {format(lastUpdated, 'MMM dd, yyyy HH:mm:ss')}
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Studio Selection</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedStudio}
              onValueChange={handleStudioChange}
            >
              <SelectTrigger className="bg-gray-800">
                <SelectValue placeholder="Select studio" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800">
                <SelectItem value="all">All Studios</SelectItem>
                <SelectItem value="Studio A">Studio A</SelectItem>
                <SelectItem value="Studio B">Studio B</SelectItem>
                <SelectItem value="RE Studio">RE Studio</SelectItem>
                <SelectItem value="Tech Studio">Tech Studio</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Date Range</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={dateRange}
              onValueChange={handleDateRangeChange}
            >
              <SelectTrigger className="bg-gray-800">
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800">
                <SelectItem value="1d">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Auto Refresh (seconds)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <Slider
                value={[refreshInterval]}
                min={10}
                max={300}
                step={10}
                onValueChange={handleRefreshIntervalChange}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>10s</span>
                <span>{refreshInterval}s</span>
                <span>300s</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Display Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                variant={showLegend ? "default" : "outline"}
                size="sm"
                onClick={() => setShowLegend(!showLegend)}
                className="flex items-center"
              >
                <Legend className="h-4 w-4 mr-1" />
                Show Legend
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium">Total Studio Hours</CardTitle>
              <Timer className="h-5 w-5 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalHoursUsed.toFixed(1)}h</div>
            <p className="text-xs text-gray-400 mt-1">Across all studios in selected period</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Radio className="h-5 w-5 text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalSessions}</div>
            <p className="text-xs text-gray-400 mt-1">Broadcasting sessions in selected period</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium">Track Plays</CardTitle>
              <Disc3 className="h-5 w-5 text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalPlayCount}</div>
            <p className="text-xs text-gray-400 mt-1">{totalTracks} unique tracks played</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Activity className="h-5 w-5 text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-gray-400">CPU</span>
              <span className="text-xs">{Math.round(averageCpuUsage)}%</span>
            </div>
            <Progress value={averageCpuUsage} className="h-1 mb-2" />
            
            <div className="flex justify-between mb-1">
              <span className="text-xs text-gray-400">Memory</span>
              <span className="text-xs">{Math.round(averageMemoryUsage)}%</span>
            </div>
            <Progress value={averageMemoryUsage} className="h-1 mb-2" />
            
            <div className="flex items-center mt-2">
              <AlertCircle className={`h-4 w-4 ${activeErrorsCount > 0 ? 'text-red-500' : 'text-green-500'} mr-1`} />
              <span className="text-xs">
                {activeErrorsCount > 0 
                  ? `${activeErrorsCount} active issue${activeErrorsCount > 1 ? 's' : ''}` 
                  : 'All systems normal'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid grid-cols-5 bg-gray-900">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="studios">Studios</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Studio Usage Trends</CardTitle>
                <CardDescription>Studio hours usage over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={studioUsageChartData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#6B7280" />
                      <YAxis stroke="#6B7280" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F9FAFB' }}
                        itemStyle={{ color: '#F9FAFB' }}
                        formatter={(value) => [`${typeof value === 'number' ? value.toFixed(1) : value}h`, undefined]}
                        labelFormatter={(value) => formatDate(value)}
                      />
                      {showLegend && <Legend />}
                      <Area 
                        type="monotone" 
                        dataKey="Studio A" 
                        stackId="1"
                        stroke="#F28C28" 
                        fill="#F28C28" 
                        fillOpacity={0.5}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="Studio B" 
                        stackId="1"
                        stroke="#2E8B57" 
                        fill="#2E8B57" 
                        fillOpacity={0.5}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="RE Studio" 
                        stackId="1"
                        stroke="#DC3545" 
                        fill="#DC3545" 
                        fillOpacity={0.5}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="Tech Studio" 
                        stackId="1"
                        stroke="#8A2BE2" 
                        fill="#8A2BE2" 
                        fillOpacity={0.5}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Track Play Analysis</CardTitle>
                <CardDescription>Most played tracks and categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Top Tracks</h3>
                    <div className="space-y-2">
                      {topTracks.map((track, index) => (
                        <div key={track.id} className="flex items-center bg-gray-800 rounded p-2">
                          <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center text-lg font-bold">
                            {index + 1}
                          </div>
                          <div className="ml-3 flex-1 min-w-0">
                            <div className="font-medium truncate">{track.trackTitle}</div>
                            <div className="text-xs text-gray-400 truncate">{track.artist}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{track.playCount}</div>
                            <div className="text-xs text-gray-400">plays</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Categories</h3>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={trackCategoryDistribution}
                            cx="50%"
                            cy="50%"
                            outerRadius={70}
                            dataKey="playCount"
                            nameKey="category"
                            label={(entry) => entry.category}
                            labelLine={false}
                          >
                            {trackCategoryDistribution.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={categoryColors[entry.category as keyof typeof categoryColors] || '#777'} 
                              />
                            ))}
                          </Pie>
                          {showLegend && <Legend />}
                          <Tooltip 
                            formatter={(value) => [`${value} plays`, undefined]}
                            contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F9FAFB' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>System Metrics</CardTitle>
                <CardDescription>CPU, memory usage and network activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={systemMetrics}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="timestamp" 
                        stroke="#6B7280"
                        tickFormatter={(timestamp) => format(new Date(timestamp), 'HH:mm')} 
                      />
                      <YAxis stroke="#6B7280" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F9FAFB' }}
                        formatter={(value) => [`${value.toFixed(1)}%`, undefined]}
                        labelFormatter={(timestamp) => format(new Date(timestamp), 'HH:mm:ss')}
                      />
                      {showLegend && <Legend />}
                      <Line 
                        type="monotone" 
                        dataKey="cpuUsage" 
                        name="CPU" 
                        stroke="#3B82F6" 
                        dot={false} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="memoryUsage" 
                        name="Memory" 
                        stroke="#10B981" 
                        dot={false} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="diskUsage" 
                        name="Disk" 
                        stroke="#F59E0B" 
                        dot={false} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Active Users</CardTitle>
                <CardDescription>Most active users and user roles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Top Users</h3>
                    <div className="space-y-2">
                      {mostActiveUsers.map((user) => (
                        <div key={user.id} className="flex items-center bg-gray-800 rounded p-2">
                          <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center">
                            <UserRound className="h-4 w-4" />
                          </div>
                          <div className="ml-3 flex-1 min-w-0">
                            <div className="font-medium truncate">{user.username}</div>
                            <div className="text-xs text-gray-400 truncate">{user.role}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{user.totalHours.toFixed(1)}h</div>
                            <div className="text-xs text-gray-400">{user.totalSessions} sessions</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">User Roles</h3>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={userRoleDistribution}
                            cx="50%"
                            cy="50%"
                            outerRadius={70}
                            dataKey="count"
                            nameKey="role"
                            label={(entry) => entry.role}
                            labelLine={false}
                          >
                            {userRoleDistribution.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={roleColors[entry.role as keyof typeof roleColors] || '#777'} 
                              />
                            ))}
                          </Pie>
                          {showLegend && <Legend />}
                          <Tooltip 
                            formatter={(value) => [`${value} users`, undefined]}
                            contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F9FAFB' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Studios Tab */}
        <TabsContent value="studios">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Studio Usage Comparison</CardTitle>
                <CardDescription>Hours used by each studio</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={studioUsage
                        .reduce((acc, curr) => {
                          const existingStudio = acc.find(s => s.studioId === curr.studioId);
                          if (existingStudio) {
                            existingStudio.hoursUsed += curr.hoursUsed;
                          } else {
                            acc.push({...curr});
                          }
                          return acc;
                        }, [] as StudioUsageData[])
                        .sort((a, b) => b.hoursUsed - a.hoursUsed)
                      }
                      margin={{ top: 10, right: 30, left: 20, bottom: 40 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis type="number" stroke="#6B7280" />
                      <YAxis 
                        type="category" 
                        dataKey="studioId" 
                        stroke="#6B7280" 
                        width={100} 
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F9FAFB' }}
                        formatter={(value) => [`${value.toFixed(1)}h`, undefined]}
                      />
                      {showLegend && <Legend />}
                      <Bar 
                        dataKey="hoursUsed" 
                        name="Hours Used"
                        fill="#1E40AF" 
                        radius={[0, 4, 4, 0]}
                      >
                        {studioUsage.map((entry) => (
                          <Cell 
                            key={`cell-${entry.id}`} 
                            fill={studioColors[entry.studioId as keyof typeof studioColors] || '#777'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Daily Studio Usage</CardTitle>
                <CardDescription>Hours used per day for each studio</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={studioUsageChartData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#6B7280" />
                      <YAxis stroke="#6B7280" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F9FAFB' }}
                        formatter={(value) => [`${value.toFixed(1)}h`, undefined]}
                        labelFormatter={(value) => formatDate(value)}
                      />
                      {showLegend && <Legend />}
                      <Line 
                        type="monotone" 
                        dataKey="Studio A" 
                        stroke="#F28C28" 
                        activeDot={{ r: 8 }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="Studio B" 
                        stroke="#2E8B57" 
                        activeDot={{ r: 8 }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="RE Studio" 
                        stroke="#DC3545" 
                        activeDot={{ r: 8 }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="Tech Studio" 
                        stroke="#8A2BE2" 
                        activeDot={{ r: 8 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900 border-gray-800 col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle>Studio Performance Details</CardTitle>
                <CardDescription>Detailed metrics for each studio</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {['Studio A', 'Studio B', 'RE Studio', 'Tech Studio'].map((studio) => {
                    const studioData = studioUsage.filter(item => item.studioId === studio);
                    const totalHours = studioData.reduce((sum, item) => sum + item.hoursUsed, 0);
                    const totalSessions = studioData.reduce((sum, item) => sum + item.sessionCount, 0);
                    const avgSessionLength = studioData.reduce((sum, item) => sum + item.averageSessionLength, 0) / studioData.length;
                    const peakAudioLevel = Math.min(...studioData.map(item => item.peakAudioLevel));
                    
                    return (
                      <Card key={studio} className="bg-gray-800 border-gray-700">
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center text-base">
                            <Radio className="h-4 w-4 mr-2" style={{ color: studioColors[studio as keyof typeof studioColors] }} />
                            {studio}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-gray-900 p-2 rounded">
                              <div className="text-xs text-gray-400">Total Hours</div>
                              <div className="text-lg font-medium">{totalHours.toFixed(1)}h</div>
                            </div>
                            <div className="bg-gray-900 p-2 rounded">
                              <div className="text-xs text-gray-400">Sessions</div>
                              <div className="text-lg font-medium">{totalSessions}</div>
                            </div>
                            <div className="bg-gray-900 p-2 rounded">
                              <div className="text-xs text-gray-400">Avg. Session</div>
                              <div className="text-lg font-medium">{formatDuration(avgSessionLength)}</div>
                            </div>
                            <div className="bg-gray-900 p-2 rounded">
                              <div className="text-xs text-gray-400">Peak Audio</div>
                              <div className="text-lg font-medium">{peakAudioLevel.toFixed(1)} dB</div>
                            </div>
                          </div>
                          <div className="pt-2">
                            <div className="flex justify-between mb-1">
                              <span className="text-xs text-gray-400">Utilization</span>
                              <span className="text-xs">{Math.min(100, Math.round(totalHours / 24 * 100))}%</span>
                            </div>
                            <Progress 
                              value={Math.min(100, totalHours / 24 * 100)} 
                              className="h-1.5"
                              style={{ 
                                backgroundColor: 'rgba(0,0,0,0.2)',
                                '--tw-progress-fill': studioColors[studio as keyof typeof studioColors] || '#4B5563'
                              } as any}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Content Tab */}
        <TabsContent value="content">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Top Played Tracks</CardTitle>
                <CardDescription>Most frequently played tracks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topTracks}
                      margin={{ top: 10, right: 30, left: 20, bottom: 40 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis type="number" stroke="#6B7280" />
                      <YAxis 
                        type="category" 
                        dataKey="trackTitle" 
                        stroke="#6B7280" 
                        width={150}
                        tickFormatter={(value) => value.length > 18 ? `${value.slice(0, 18)}...` : value}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F9FAFB' }}
                        formatter={(value) => [`${value} plays`, undefined]}
                      />
                      {showLegend && <Legend />}
                      <Bar 
                        dataKey="playCount" 
                        name="Play Count"
                        fill="#3B82F6" 
                        radius={[0, 4, 4, 0]}
                      >
                        {topTracks.map((entry) => (
                          <Cell 
                            key={`cell-${entry.id}`} 
                            fill={categoryColors[entry.category as keyof typeof categoryColors] || '#4B5563'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Track Categories</CardTitle>
                <CardDescription>Distribution of track categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={trackCategoryDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={60}
                        dataKey="playCount"
                        nameKey="category"
                        paddingAngle={5}
                        label={(entry) => `${entry.category}: ${entry.playCount}`}
                      >
                        {trackCategoryDistribution.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={categoryColors[entry.category as keyof typeof categoryColors] || '#4B5563'} 
                          />
                        ))}
                      </Pie>
                      {showLegend && <Legend />}
                      <Tooltip 
                        formatter={(value, name, props) => {
                          const category = props.payload.category;
                          return [`${value} plays (${props.payload.count} tracks)`, category];
                        }}
                        contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F9FAFB' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900 border-gray-800 col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle>Detailed Tracks Analysis</CardTitle>
                <CardDescription>Play statistics for all tracks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="py-2 px-4 text-left">Track</th>
                        <th className="py-2 px-4 text-left">Artist</th>
                        <th className="py-2 px-4 text-left">Category</th>
                        <th className="py-2 px-4 text-right">Play Count</th>
                        <th className="py-2 px-4 text-right">Duration</th>
                        <th className="py-2 px-4 text-right">Last Played</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trackPlayData.map((track) => (
                        <tr key={track.id} className="hover:bg-gray-800 border-b border-gray-800">
                          <td className="py-2 px-4">{track.trackTitle}</td>
                          <td className="py-2 px-4">{track.artist}</td>
                          <td className="py-2 px-4">
                            <Badge 
                              className="font-normal"
                              style={{ 
                                backgroundColor: categoryColors[track.category as keyof typeof categoryColors] || '#4B5563',
                                color: 'white' 
                              }}
                            >
                              {track.category}
                            </Badge>
                          </td>
                          <td className="py-2 px-4 text-right font-medium">{track.playCount}</td>
                          <td className="py-2 px-4 text-right text-gray-400">
                            {formatDuration(track.totalPlayDuration / 60)}
                          </td>
                          <td className="py-2 px-4 text-right text-gray-400">
                            {format(new Date(track.lastPlayed), 'MMM d, HH:mm')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Users Tab */}
        <TabsContent value="users">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>User Activity</CardTitle>
                <CardDescription>Hours logged by top users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={userActivity.sort((a, b) => b.totalHours - a.totalHours)}
                      margin={{ top: 10, right: 30, left: 20, bottom: 40 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis type="number" stroke="#6B7280" />
                      <YAxis 
                        type="category" 
                        dataKey="username" 
                        stroke="#6B7280" 
                        width={120}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F9FAFB' }}
                        formatter={(value) => [`${value.toFixed(1)}h`, undefined]}
                      />
                      {showLegend && <Legend />}
                      <Bar 
                        dataKey="totalHours" 
                        name="Total Hours"
                        fill="#3B82F6" 
                        radius={[0, 4, 4, 0]}
                      >
                        {userActivity.map((entry) => (
                          <Cell 
                            key={`cell-${entry.id}`} 
                            fill={roleColors[entry.role as keyof typeof roleColors] || '#4B5563'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>User Roles Distribution</CardTitle>
                <CardDescription>Distribution of user roles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={userRoleDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="count"
                        nameKey="role"
                        paddingAngle={5}
                        label={(entry) => `${entry.role}: ${entry.count}`}
                      >
                        {userRoleDistribution.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={roleColors[entry.role as keyof typeof roleColors] || '#4B5563'} 
                          />
                        ))}
                      </Pie>
                      {showLegend && <Legend />}
                      <Tooltip 
                        formatter={(value) => [`${value} users`, undefined]}
                        contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F9FAFB' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900 border-gray-800 col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle>User Activity Details</CardTitle>
                <CardDescription>Session and feature usage statistics for all users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {userActivity.map((user) => (
                    <Card key={user.id} className="bg-gray-800 border-gray-700">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center text-base">
                          <UserRound className="h-4 w-4 mr-2" />
                          {user.username}
                        </CardTitle>
                        <CardDescription className="flex items-center">
                          <Badge 
                            className="font-normal"
                            style={{ 
                              backgroundColor: roleColors[user.role as keyof typeof roleColors] || '#4B5563',
                              color: 'white' 
                            }}
                          >
                            {user.role}
                          </Badge>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-gray-900 p-2 rounded">
                            <div className="text-xs text-gray-400">Total Hours</div>
                            <div className="text-lg font-medium">{user.totalHours.toFixed(1)}h</div>
                          </div>
                          <div className="bg-gray-900 p-2 rounded">
                            <div className="text-xs text-gray-400">Sessions</div>
                            <div className="text-lg font-medium">{user.totalSessions}</div>
                          </div>
                        </div>
                        <div className="bg-gray-900 p-2 rounded">
                          <div className="text-xs text-gray-400">Avg. Session Length</div>
                          <div className="text-lg font-medium">{formatDuration(user.averageSessionLength * 60)}</div>
                        </div>
                        <div className="bg-gray-900 p-2 rounded">
                          <div className="text-xs text-gray-400">Most Used Feature</div>
                          <div className="text-lg font-medium">{user.mostUsedFeature}</div>
                        </div>
                        <div className="pt-1 text-xs text-gray-400">
                          Last active: {format(new Date(user.lastActive), 'MMM d, HH:mm')}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* System Tab */}
        <TabsContent value="system">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>System Resource Usage</CardTitle>
                <CardDescription>CPU, memory, and disk usage over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={systemMetrics}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="timestamp" 
                        stroke="#6B7280"
                        tickFormatter={(timestamp) => format(new Date(timestamp), 'HH:mm')} 
                      />
                      <YAxis 
                        stroke="#6B7280"
                        domain={[0, 100]} 
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F9FAFB' }}
                        formatter={(value) => [`${value.toFixed(1)}%`, undefined]}
                        labelFormatter={(timestamp) => format(new Date(timestamp), 'HH:mm:ss')}
                      />
                      {showLegend && <Legend />}
                      <Line 
                        type="monotone" 
                        dataKey="cpuUsage" 
                        name="CPU" 
                        stroke="#3B82F6" 
                        activeDot={{ r: 8 }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="memoryUsage" 
                        name="Memory" 
                        stroke="#10B981" 
                        activeDot={{ r: 8 }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="diskUsage" 
                        name="Disk" 
                        stroke="#F59E0B" 
                        activeDot={{ r: 8 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Network Activity</CardTitle>
                <CardDescription>Network traffic and active connections</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={systemMetrics}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="timestamp" 
                        stroke="#6B7280"
                        tickFormatter={(timestamp) => format(new Date(timestamp), 'HH:mm')} 
                      />
                      <YAxis yAxisId="left" stroke="#6B7280" />
                      <YAxis yAxisId="right" orientation="right" stroke="#6B7280" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F9FAFB' }}
                        formatter={(value, name) => {
                          if (name === 'Active Connections') return [value, name];
                          return [`${value.toFixed(2)} MB/s`, name];
                        }}
                        labelFormatter={(timestamp) => format(new Date(timestamp), 'HH:mm:ss')}
                      />
                      {showLegend && <Legend />}
                      <Line 
                        type="monotone" 
                        dataKey="networkIn" 
                        name="Network In" 
                        stroke="#3B82F6" 
                        yAxisId="left"
                        dot={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="networkOut" 
                        name="Network Out" 
                        stroke="#EC4899" 
                        yAxisId="left"
                        dot={false}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="activeConnections" 
                        name="Active Connections" 
                        stroke="#F59E0B" 
                        yAxisId="right"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900 border-gray-800 col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle>System Errors & Events</CardTitle>
                <CardDescription>Recent errors and warning events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="py-2 px-4 text-left">Timestamp</th>
                        <th className="py-2 px-4 text-left">Type</th>
                        <th className="py-2 px-4 text-left">Component</th>
                        <th className="py-2 px-4 text-left">Message</th>
                        <th className="py-2 px-4 text-left">Severity</th>
                        <th className="py-2 px-4 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {errorEvents.map((event) => (
                        <tr key={event.id} className="hover:bg-gray-800 border-b border-gray-800">
                          <td className="py-2 px-4 text-gray-400">{format(new Date(event.timestamp), 'MMM d, HH:mm:ss')}</td>
                          <td className="py-2 px-4">{event.type}</td>
                          <td className="py-2 px-4">{event.component}</td>
                          <td className="py-2 px-4">{event.message}</td>
                          <td className="py-2 px-4">
                            <Badge 
                              className="font-normal"
                              style={{ 
                                backgroundColor: severityColors[event.severity] || '#4B5563',
                                color: 'white' 
                              }}
                            >
                              {event.severity}
                            </Badge>
                          </td>
                          <td className="py-2 px-4">
                            <Badge 
                              className="font-normal"
                              variant={event.resolved ? "outline" : "destructive"}
                            >
                              {event.resolved ? 'Resolved' : 'Active'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-900 border-gray-800 col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle>Current System Status</CardTitle>
                <CardDescription>Real-time system resource utilization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* CPU Usage */}
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <Zap className="h-4 w-4 mr-2 text-blue-400" />
                        CPU Usage
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-center py-6">
                        <div className="relative w-32 h-32">
                          <svg className="w-full h-full" viewBox="0 0 100 100">
                            {/* Background circle */}
                            <circle
                              className="text-gray-700"
                              strokeWidth="10"
                              stroke="currentColor"
                              fill="transparent"
                              r="40"
                              cx="50"
                              cy="50"
                            />
                            {/* Foreground circle */}
                            <circle
                              className="text-blue-500"
                              strokeWidth="10"
                              strokeDasharray={`${averageCpuUsage * 2.51} 251.2`}
                              strokeLinecap="round"
                              stroke="currentColor"
                              fill="transparent"
                              r="40"
                              cx="50"
                              cy="50"
                              transform="rotate(-90 50 50)"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-2xl font-bold">{Math.round(averageCpuUsage)}%</div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="flex justify-between items-center text-sm">
                          <div className="flex items-center">
                            <span className={`h-2 w-2 rounded-full mr-1 ${averageCpuUsage > 80 ? 'bg-red-500' : averageCpuUsage > 60 ? 'bg-amber-500' : 'bg-green-500'}`}></span>
                            <span>
                              {averageCpuUsage > 80 ? 'High' : averageCpuUsage > 60 ? 'Medium' : 'Low'} Load
                            </span>
                          </div>
                          <div className="text-gray-400">
                            {systemMetrics[systemMetrics.length - 1]?.cpuUsage.toFixed(1)}% current
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Memory Usage */}
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <Zap className="h-4 w-4 mr-2 text-green-400" />
                        Memory Usage
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-center py-6">
                        <div className="relative w-32 h-32">
                          <svg className="w-full h-full" viewBox="0 0 100 100">
                            {/* Background circle */}
                            <circle
                              className="text-gray-700"
                              strokeWidth="10"
                              stroke="currentColor"
                              fill="transparent"
                              r="40"
                              cx="50"
                              cy="50"
                            />
                            {/* Foreground circle */}
                            <circle
                              className="text-green-500"
                              strokeWidth="10"
                              strokeDasharray={`${averageMemoryUsage * 2.51} 251.2`}
                              strokeLinecap="round"
                              stroke="currentColor"
                              fill="transparent"
                              r="40"
                              cx="50"
                              cy="50"
                              transform="rotate(-90 50 50)"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-2xl font-bold">{Math.round(averageMemoryUsage)}%</div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="flex justify-between items-center text-sm">
                          <div className="flex items-center">
                            <span className={`h-2 w-2 rounded-full mr-1 ${averageMemoryUsage > 80 ? 'bg-red-500' : averageMemoryUsage > 60 ? 'bg-amber-500' : 'bg-green-500'}`}></span>
                            <span>
                              {averageMemoryUsage > 80 ? 'High' : averageMemoryUsage > 60 ? 'Medium' : 'Low'} Usage
                            </span>
                          </div>
                          <div className="text-gray-400">
                            {systemMetrics[systemMetrics.length - 1]?.memoryUsage.toFixed(1)}% current
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Disk Usage */}
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <Zap className="h-4 w-4 mr-2 text-amber-400" />
                        Disk Usage
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-center py-6">
                        <div className="relative w-32 h-32">
                          <svg className="w-full h-full" viewBox="0 0 100 100">
                            {/* Background circle */}
                            <circle
                              className="text-gray-700"
                              strokeWidth="10"
                              stroke="currentColor"
                              fill="transparent"
                              r="40"
                              cx="50"
                              cy="50"
                            />
                            {/* Foreground circle */}
                            <circle
                              className="text-amber-500"
                              strokeWidth="10"
                              strokeDasharray={`${systemMetrics[systemMetrics.length - 1]?.diskUsage * 2.51} 251.2`}
                              strokeLinecap="round"
                              stroke="currentColor"
                              fill="transparent"
                              r="40"
                              cx="50"
                              cy="50"
                              transform="rotate(-90 50 50)"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-2xl font-bold">{Math.round(systemMetrics[systemMetrics.length - 1]?.diskUsage)}%</div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="flex justify-between items-center text-sm">
                          <div className="flex items-center">
                            <span className={`h-2 w-2 rounded-full mr-1 ${systemMetrics[systemMetrics.length - 1]?.diskUsage > 80 ? 'bg-red-500' : systemMetrics[systemMetrics.length - 1]?.diskUsage > 60 ? 'bg-amber-500' : 'bg-green-500'}`}></span>
                            <span>
                              {systemMetrics[systemMetrics.length - 1]?.diskUsage > 80 ? 'High' : systemMetrics[systemMetrics.length - 1]?.diskUsage > 60 ? 'Medium' : 'Low'} Usage
                            </span>
                          </div>
                          <div className="text-gray-400">
                            {(100 - systemMetrics[systemMetrics.length - 1]?.diskUsage).toFixed(1)}% free
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudioDashboardPage;
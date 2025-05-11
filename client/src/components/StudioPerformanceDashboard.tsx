import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useVoIP } from '@/contexts/VoIPContext';
import { 
  Phone, 
  Clock, 
  BarChart2, 
  Users, 
  PhoneCall, 
  PhoneOff, 
  Percent,
  Timer,
  RadioTower,
  Activity,
  RefreshCw,
  Cpu,
  HardDrive,
  Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Type definitions for our performance metrics
type StudioPerformanceMetrics = {
  totalCalls: number;
  callsAnswered: number;
  callsMissed: number;
  averageDuration: number; // in seconds
  callSuccessRate: number; // percentage
  currentLoad: number; // percentage
  callsPerHour: number[];
  callDurations: number[];
  studioId: 'A' | 'B';
  peakHour: number;
  operatorPerformance: {
    name: string;
    calls: number;
    averageDuration: number;
  }[];
  resourceUtilization: number; // percentage
};

// Sample data for initial rendering and testing
const generateSampleData = (studioId: 'A' | 'B'): StudioPerformanceMetrics => {
  // Base values
  let base = studioId === 'A' ? 120 : 95;
  let answered = studioId === 'A' ? 105 : 85;
  let avgDuration = studioId === 'A' ? 180 : 210; // 3 or 3.5 minutes
  
  // Generate random hourly data (last 24 hours)
  const hourlyData = Array.from({ length: 24 }, (_, i) => {
    // More calls during work hours (9-17), fewer at night
    const hourMultiplier = i >= 9 && i <= 17 ? 1.5 : 0.5;
    return Math.floor(Math.random() * 10 * hourMultiplier);
  });
  
  // Set peak hour based on highest call volume
  const peakHour = hourlyData.indexOf(Math.max(...hourlyData));
  
  // Sample duration data - each call's duration in seconds
  const durations = Array.from({ length: 20 }, () => 
    Math.floor(30 + Math.random() * 300) // 30 sec to 5.5 min
  );
  
  // Sample operator performance
  const operators = [
    { name: 'Operator 1', calls: Math.floor(30 + Math.random() * 30), averageDuration: Math.floor(140 + Math.random() * 120) },
    { name: 'Operator 2', calls: Math.floor(25 + Math.random() * 40), averageDuration: Math.floor(160 + Math.random() * 100) },
    { name: 'Operator 3', calls: Math.floor(20 + Math.random() * 35), averageDuration: Math.floor(170 + Math.random() * 90) },
  ];
  
  return {
    totalCalls: base,
    callsAnswered: answered,
    callsMissed: base - answered,
    averageDuration: avgDuration,
    callSuccessRate: Math.floor((answered / base) * 100),
    currentLoad: Math.floor(20 + Math.random() * 60),
    callsPerHour: hourlyData,
    callDurations: durations,
    studioId,
    peakHour,
    operatorPerformance: operators,
    resourceUtilization: Math.floor(40 + Math.random() * 50)
  };
};

// Component for displaying key metrics in cards
const MetricCard = ({ 
  title, 
  value, 
  icon, 
  description, 
  trend,
  variant = 'default' 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  variant?: 'default' | 'primary' | 'warning' | 'danger' | 'info';
}) => {
  // Determine the color scheme based on variant
  const getColors = () => {
    switch (variant) {
      case 'primary':
        return { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-800' };
      case 'warning':
        return { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-200 dark:border-yellow-800' };
      case 'danger':
        return { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-800' };
      case 'info':
        return { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' };
      default:
        return { bg: 'bg-gray-50 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-700' };
    }
  };
  
  const colors = getColors();
  
  return (
    <div className={`p-4 rounded-lg border ${colors.border} ${colors.bg}`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className={`text-sm font-medium ${colors.text}`}>{title}</h3>
          <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
          {description && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{description}</p>
          )}
        </div>
        <div className={`p-2 rounded-full ${colors.bg} ${colors.text}`}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-2">
          <Badge variant={trend === 'up' ? 'default' : trend === 'down' ? 'destructive' : 'outline'}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} 
            {trend === 'up' ? '5.3%' : trend === 'down' ? '2.1%' : '0%'} from last week
          </Badge>
        </div>
      )}
    </div>
  );
};

// Component for the call volume chart (hourly breakdown)
const CallVolumeChart = ({ data }: { data: number[] }) => {
  // Convert data array to format required by recharts
  const chartData = data.map((value, index) => ({
    hour: index,
    calls: value
  }));
  
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
        <XAxis 
          dataKey="hour" 
          tick={{ fill: '#9ca3af' }}
          tickFormatter={(hour) => `${hour}:00`}
        />
        <YAxis tick={{ fill: '#9ca3af' }} />
        <Tooltip 
          contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#e5e7eb' }}
          labelFormatter={(hour) => `Time: ${hour}:00`}
        />
        <Legend wrapperStyle={{ color: '#e5e7eb' }} />
        <Line 
          type="monotone" 
          dataKey="calls" 
          stroke="#f97316" 
          activeDot={{ r: 6 }} 
          name="Number of Calls"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

// Component for the call duration distribution chart
const CallDurationChart = ({ data }: { data: number[] }) => {
  // Group call durations into bins for histogram-like display
  const bins = [
    '0-1 min', 
    '1-2 min', 
    '2-3 min', 
    '3-5 min', 
    '5+ min'
  ];
  
  const countsInBins = [0, 0, 0, 0, 0];
  
  data.forEach(duration => {
    const minutes = duration / 60;
    if (minutes < 1) countsInBins[0]++;
    else if (minutes < 2) countsInBins[1]++;
    else if (minutes < 3) countsInBins[2]++;
    else if (minutes < 5) countsInBins[3]++;
    else countsInBins[4]++;
  });
  
  const chartData = bins.map((bin, index) => ({
    bin,
    count: countsInBins[index]
  }));
  
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
        <XAxis dataKey="bin" tick={{ fill: '#9ca3af' }} />
        <YAxis tick={{ fill: '#9ca3af' }} />
        <Tooltip 
          contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#e5e7eb' }}
        />
        <Legend wrapperStyle={{ color: '#e5e7eb' }} />
        <Bar 
          dataKey="count" 
          name="Number of Calls" 
          fill="#f97316" 
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

// Component for operator performance comparison
const OperatorPerformanceChart = ({ data }: { 
  data: {
    name: string;
    calls: number;
    averageDuration: number;
  }[]
}) => {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart 
        data={data} 
        margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
        layout="vertical"
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
        <XAxis type="number" tick={{ fill: '#9ca3af' }} />
        <YAxis 
          dataKey="name" 
          type="category" 
          tick={{ fill: '#9ca3af' }}
        />
        <Tooltip 
          contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#e5e7eb' }}
        />
        <Legend wrapperStyle={{ color: '#e5e7eb' }} />
        <Bar 
          dataKey="calls" 
          name="Calls Handled" 
          fill="#f97316" 
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

// Resource usage card component
const ResourceUsageCard = ({
  title,
  value,
  icon
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) => {
  // Determine color based on value
  const getColorClass = () => {
    if (value > 80) return 'text-red-500';
    if (value > 60) return 'text-yellow-500';
    return 'text-green-500';
  };
  
  return (
    <div className="p-4 bg-zinc-700/50 rounded-lg">
      <div className="flex justify-between items-start mb-2">
        <div className="text-sm text-gray-400">{title}</div>
        <div className="">{icon}</div>
      </div>
      <div className="flex items-end gap-1">
        <div className={`text-xl font-bold ${getColorClass()}`}>{value}%</div>
        <div className="text-xs text-gray-400 mb-1">of capacity</div>
      </div>
      <div className="mt-2">
        <div className="bg-zinc-800 rounded-full h-1.5 w-full">
          <div 
            className={`h-1.5 rounded-full ${value > 80 ? 'bg-red-500' : value > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
            style={{ width: `${value}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

// Success rate pie chart
const SuccessRateChart = ({ 
  successRate, 
  studioId 
}: { 
  successRate: number; 
  studioId: 'A' | 'B';
}) => {
  const data = [
    { name: 'Success', value: successRate },
    { name: 'Missed', value: 100 - successRate }
  ];
  
  const COLORS = studioId === 'A' 
    ? ['#f97316', '#374151'] // Orange theme for Studio A
    : ['#22c55e', '#374151']; // Green theme for Studio B
  
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          fill="#8884d8"
          paddingAngle={2}
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#e5e7eb' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

// Main dashboard component
export default function StudioPerformanceDashboard() {
  const [activeTab, setActiveTab] = useState<string>('studio-a');
  const { callLines } = useVoIP();
  
  // Generate sample data - in a real app, this would come from an API
  const [studioA, setStudioA] = useState<StudioPerformanceMetrics>(generateSampleData('A'));
  const [studioB, setStudioB] = useState<StudioPerformanceMetrics>(generateSampleData('B'));
  
  // Refresh data (simulated)
  const refreshData = () => {
    setStudioA(generateSampleData('A'));
    setStudioB(generateSampleData('B'));
  };
  
  // Format time for display (seconds to MM:SS)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Get current active data based on selected tab
  const currentData = activeTab === 'studio-a' ? studioA : studioB;
  
  // Calculate real-time activity based on call lines
  const activeLines = callLines.filter(line => 
    line.status !== 'inactive' && line.studio === (activeTab === 'studio-a' ? 'A' : 'B')
  ).length;
  
  const totalLines = callLines.filter(line => 
    line.studio === (activeTab === 'studio-a' ? 'A' : 'B')
  ).length;
  
  const lineUtilization = totalLines > 0 ? Math.floor((activeLines / totalLines) * 100) : 0;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Studio Performance Dashboard</h2>
        <div className="flex items-center gap-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="studio-a" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
                Studio A
              </TabsTrigger>
              <TabsTrigger value="studio-b" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                Studio B
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshData}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Key metrics section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Calls"
          value={currentData.totalCalls}
          icon={<Phone className="h-5 w-5" />}
          description="Total number of calls today"
          trend="up"
          variant="info"
        />
        <MetricCard
          title="Avg. Call Duration"
          value={formatTime(currentData.averageDuration)}
          icon={<Clock className="h-5 w-5" />}
          description="Average length of all calls"
          trend="down"
          variant="warning"
        />
        <MetricCard
          title="Success Rate"
          value={`${currentData.callSuccessRate}%`}
          icon={<Percent className="h-5 w-5" />}
          description="Percentage of calls answered"
          trend={currentData.callSuccessRate > 85 ? 'up' : 'down'}
          variant={currentData.callSuccessRate > 85 ? 'primary' : 'danger'}
        />
        <MetricCard
          title="Current Load"
          value={`${lineUtilization}%`}
          icon={<Activity className="h-5 w-5" />}
          description={`${activeLines} of ${totalLines} lines active`}
          variant={lineUtilization > 80 ? 'danger' : lineUtilization > 50 ? 'warning' : 'primary'}
        />
      </div>
      
      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Call volume by hour */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-orange-400" />
              Call Volume (24h)
            </CardTitle>
            <CardDescription>
              Peak hour: {currentData.peakHour}:00 ({currentData.callsPerHour[currentData.peakHour]} calls)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CallVolumeChart data={currentData.callsPerHour} />
          </CardContent>
        </Card>
        
        {/* Call duration distribution */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Timer className="h-5 w-5 text-orange-400" />
              Call Duration Distribution
            </CardTitle>
            <CardDescription>
              Breakdown of call lengths
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CallDurationChart data={currentData.callDurations} />
          </CardContent>
        </Card>
      </div>
      
      {/* Second row of charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Success rate visualization */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <PhoneCall className="h-5 w-5 text-orange-400" />
              Call Success Rate
            </CardTitle>
            <CardDescription>
              Answered vs. Missed Calls
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <SuccessRateChart 
              successRate={currentData.callSuccessRate} 
              studioId={currentData.studioId} 
            />
            <div className="mt-4 grid grid-cols-2 gap-4 w-full">
              <div className="flex flex-col items-center p-3 bg-zinc-700/50 rounded-lg">
                <div className="text-sm text-gray-400">Answered</div>
                <div className="text-xl font-bold text-white">{currentData.callsAnswered}</div>
                <div className="text-xs text-gray-400">calls</div>
              </div>
              <div className="flex flex-col items-center p-3 bg-zinc-700/50 rounded-lg">
                <div className="text-sm text-gray-400">Missed</div>
                <div className="text-xl font-bold text-white">{currentData.callsMissed}</div>
                <div className="text-xs text-gray-400">calls</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Operator performance */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-400" />
              Operator Performance
            </CardTitle>
            <CardDescription>
              Calls handled by each operator
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OperatorPerformanceChart data={currentData.operatorPerformance} />
          </CardContent>
        </Card>
      </div>
      
      {/* Resource utilization */}
      <Card className="bg-zinc-800 border-zinc-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <RadioTower className="h-5 w-5 text-orange-400" />
            Resource Utilization
          </CardTitle>
          <CardDescription>
            Overall studio resource usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">System Load</span>
                <span className="text-sm font-medium">{currentData.resourceUtilization}%</span>
              </div>
              <Progress 
                value={currentData.resourceUtilization} 
                className="progress"
                // Use different colors based on utilization level
                style={{
                  '--progress-bar-color': currentData.resourceUtilization > 80 
                    ? "#ef4444" // red-500 
                    : currentData.resourceUtilization > 60 
                      ? "#eab308" // yellow-500
                      : "#22c55e" // green-500
                } as React.CSSProperties}
              />
            </div>
            
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Phone Line Utilization</span>
                <span className="text-sm font-medium">{lineUtilization}%</span>
              </div>
              <Progress 
                value={lineUtilization} 
                className="progress"
                // Use different colors based on utilization level
                style={{
                  '--progress-bar-color': lineUtilization > 80 
                    ? "#ef4444" // red-500 
                    : lineUtilization > 60 
                      ? "#eab308" // yellow-500
                      : "#22c55e" // green-500
                } as React.CSSProperties}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ResourceUsageCard
                title="CPU Usage"
                value={Math.floor(30 + Math.random() * 40)}
                icon={<Cpu className="h-4 w-4 text-blue-400" />}
              />
              <ResourceUsageCard
                title="Memory Usage"
                value={Math.floor(50 + Math.random() * 20)}
                icon={<HardDrive className="h-4 w-4 text-green-400" />}
              />
              <ResourceUsageCard
                title="Network Usage"
                value={Math.floor(20 + Math.random() * 30)}
                icon={<Share2 className="h-4 w-4 text-orange-400" />}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
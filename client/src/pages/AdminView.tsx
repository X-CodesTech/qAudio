import { useState, useEffect, memo, useMemo } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useVoIP } from '@/hooks/useVoIP';
import { AudioMetersPanel } from '@/components/AudioMeter';
import AudioRoutingPanel from '@/components/AudioRoutingPanel';
import ContentTabs from '@/components/ContentTabs';
import { Badge } from '@/components/ui/badge';
import { CallLine } from '@shared/schema';
import AdminViewTabs from '@/components/AdminViewTabs';
import { useAuth } from '@/contexts/AuthContext';

// Create a memoized component for the SIP status indicator
const SipStatusIndicator = memo(({ status }: { status: 'connected' | 'disconnected' | 'connecting' }) => {
  return (
    <div className={`px-3 py-1 rounded-full text-sm ${
      status === 'connected' 
        ? 'bg-green-100 text-green-800' 
        : status === 'connecting' 
          ? 'bg-yellow-100 text-yellow-800' 
          : 'bg-red-100 text-red-800'
    }`}>
      SIP Status: {status.charAt(0).toUpperCase() + status.slice(1)}
    </div>
  );
});
export default function AdminView() {
  const { currentUser } = useAuth();
  const { callLines, initializeVoIP, sipStatus } = useVoIP();
  const [activeTab, setActiveTab] = useState('system');
  const [users, setUsers] = useState<Array<{
    id: number;
    username: string;
    displayName: string;
    role: string;
    lastLogin: string | null;
  }>>([]);
  const [stats, setStats] = useState({
    activeUsers: 0,
    totalCalls: 0,
    activeCalls: 0,
    systemUptime: '0h 0m'
  });

  // Effect for initializing VoIP - only run once on component mount
  useEffect(() => {
    // Initialize the VoIP system
    initializeVoIP().catch(error => {
      console.error('Failed to initialize VoIP:', error);
    });
  }, [initializeVoIP]);

  // Separate effect for fetching users and stats - depends on callLines
  useEffect(() => {
    // Fetch users and system stats
    async function fetchData() {
      try {
        const usersResponse = await fetch('/api/users');
        if (usersResponse.ok) {
          const userData = await usersResponse.json();
          setUsers(userData);
          setStats(prev => ({
            ...prev,
            activeUsers: userData.filter((u: {lastLogin: string | null}) => u.lastLogin).length
          }));
        }

        // Update stats based on callLines
        setStats(prev => ({
          ...prev,
          totalCalls: 24,
          activeCalls: callLines.filter(line => line.status !== 'inactive').length,
          systemUptime: '4h 32m'
        }));
        
        // Log that admin page is loaded with navigation
        console.log('Admin page loaded with navigation tabs');
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    }

    fetchData();
  }, [callLines]);

  return (
    <>
      <div className="container mx-auto py-4">
        <header className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <SipStatusIndicator status={sipStatus} />
            <Button variant="outline" size="sm">
              System Settings
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left column: System Overview */}
          <div className="lg:col-span-8 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Overview</CardTitle>
                <CardDescription>Key metrics and statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted/50 p-4 rounded-lg text-center">
                    <div className="text-sm text-muted-foreground">Active Users</div>
                    <div className="text-3xl font-bold">{stats.activeUsers}</div>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg text-center">
                    <div className="text-sm text-muted-foreground">Total Calls</div>
                    <div className="text-3xl font-bold">{stats.totalCalls}</div>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg text-center">
                    <div className="text-sm text-muted-foreground">Active Calls</div>
                    <div className="text-3xl font-bold">{stats.activeCalls}</div>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg text-center">
                    <div className="text-sm text-muted-foreground">System Uptime</div>
                    <div className="text-3xl font-bold">{stats.systemUptime}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <CardHeader>
                  <TabsList>
                    <TabsTrigger value="system">System Status</TabsTrigger>
                    <TabsTrigger value="lines">Call Lines</TabsTrigger>
                    <TabsTrigger value="users">User Management</TabsTrigger>
                    <TabsTrigger value="logs">System Logs</TabsTrigger>
                  </TabsList>
                </CardHeader>
                <CardContent>
                  <TabsContent value="system" className="m-0">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 border rounded-md">
                        <div>
                          <div className="font-medium">SIP Server Connection</div>
                          <div className="text-sm text-muted-foreground">sip.broadcast.com</div>
                        </div>
                        <div className="px-3 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          {sipStatus === 'connected' ? 'Online' : 'Offline'}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 border rounded-md">
                        <div>
                          <div className="font-medium">Database Connection</div>
                          <div className="text-sm text-muted-foreground">PostgreSQL</div>
                        </div>
                        <div className="px-3 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          Online
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 border rounded-md">
                        <div>
                          <div className="font-medium">Audio Processing</div>
                          <div className="text-sm text-muted-foreground">WebRTC Audio Service</div>
                        </div>
                        <div className="px-3 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          Active
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="lines" className="m-0">
                    <div className="space-y-4">
                      <div className="border rounded-md overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="px-4 py-2 text-left">Line ID</th>
                              <th className="px-4 py-2 text-left">Status</th>
                              <th className="px-4 py-2 text-left">Caller</th>
                              <th className="px-4 py-2 text-left">Phone Number</th>
                              <th className="px-4 py-2 text-left">Duration</th>
                              <th className="px-4 py-2 text-left">Audio Levels</th>
                              <th className="px-4 py-2 text-left">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {callLines.map((line) => (
                              <tr key={line.id} className="border-t">
                                <td className="px-4 py-3">Line {line.id}</td>
                                <td className="px-4 py-3">
                                  <Badge 
                                    className={`${
                                      line.status === 'active' ? 'bg-status-active' : 
                                      line.status === 'inactive' ? 'bg-slate-500' : 
                                      line.status === 'on-air' ? 'bg-status-onair' : 
                                      line.status === 'holding' ? 'bg-status-holding' : 
                                      'bg-status-ringing'
                                    } text-white`}
                                  >
                                    {line.status.charAt(0).toUpperCase() + line.status.slice(1)}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3">{line.contact?.name || 'Unknown'}</td>
                                <td className="px-4 py-3">{line.phoneNumber || 'N/A'}</td>
                                <td className="px-4 py-3">{line.duration ? `${Math.floor(line.duration / 60)}m ${line.duration % 60}s` : 'N/A'}</td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="text-xs w-9">In: {line.levels?.input || 0}%</div>
                                    <div className="w-20 bg-slate-200 rounded-full h-2 overflow-hidden">
                                      <div 
                                        className={`h-full ${line.levels && line.levels.input > 70 ? 'bg-red-500' : line.levels && line.levels.input > 30 ? 'bg-green-500' : 'bg-green-300'}`}
                                        style={{ width: `${line.levels?.input || 0}%` }}
                                      ></div>
                                    </div>
                                    <div className="text-xs w-9">Out: {line.levels?.output || 0}%</div>
                                    <div className="w-20 bg-slate-200 rounded-full h-2 overflow-hidden">
                                      <div 
                                        className={`h-full ${line.levels && line.levels.output > 70 ? 'bg-red-500' : line.levels && line.levels.output > 30 ? 'bg-yellow-500' : 'bg-yellow-300'}`}
                                        style={{ width: `${line.levels?.output || 0}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex gap-2">
                                    {line.status !== 'inactive' && (
                                      <>
                                        {line.status === 'holding' ? (
                                          <Button size="sm" variant="outline" className="text-status-active">Unhold</Button>
                                        ) : (
                                          <Button size="sm" variant="outline" className="text-status-holding">Hold</Button>
                                        )}
                                        
                                        {line.status === 'on-air' ? (
                                          <Button size="sm" variant="outline" className="text-status-onair">Off Air</Button>
                                        ) : (
                                          <Button size="sm" variant="outline" className="text-status-active">On Air</Button>
                                        )}
                                        
                                        <Button size="sm" variant="outline" className="text-red-500">Hang Up</Button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="users" className="m-0">
                    <div className="space-y-4">
                      <div className="flex justify-end">
                        <Button size="sm">Add New User</Button>
                      </div>
                      
                      <div className="border rounded-md overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="px-4 py-2 text-left">Username</th>
                              <th className="px-4 py-2 text-left">Display Name</th>
                              <th className="px-4 py-2 text-left">Role</th>
                              <th className="px-4 py-2 text-left">Last Login</th>
                              <th className="px-4 py-2 text-left">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {users.map((user) => (
                              <tr key={user.id} className="border-t">
                                <td className="px-4 py-3">{user.username}</td>
                                <td className="px-4 py-3">{user.displayName}</td>
                                <td className="px-4 py-3 capitalize">{user.role}</td>
                                <td className="px-4 py-3">
                                  {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex gap-2">
                                    <Button size="sm" variant="outline">Edit</Button>
                                    <Button size="sm" variant="outline" className="text-red-500">Reset</Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="logs" className="m-0">
                    <ScrollArea className="h-[300px] border rounded-md p-4">
                      <div className="space-y-2 font-mono text-sm">
                        <div>[2023-04-18 09:15:32] INFO: System started</div>
                        <div>[2023-04-18 09:15:34] INFO: Connected to SIP server</div>
                        <div>[2023-04-18 09:20:14] INFO: User admin logged in</div>
                        <div>[2023-04-18 09:45:22] INFO: Call received on line 2</div>
                        <div>[2023-04-18 09:46:53] INFO: Call on line 2 sent to air</div>
                        <div>[2023-04-18 10:12:31] INFO: Call on line 2 ended (duration: 27m 08s)</div>
                        <div>[2023-04-18 10:30:15] INFO: User producer1 logged in</div>
                        <div>[2023-04-18 11:02:47] WARNING: High CPU usage detected (85%)</div>
                        <div>[2023-04-18 11:04:22] INFO: CPU usage normalized (42%)</div>
                        <div>[2023-04-18 11:25:30] INFO: Outbound call made on line 1</div>
                        <div>[2023-04-18 11:27:18] INFO: Call on line 1 ended (duration: 1m 48s)</div>
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>

          {/* Right column */}
          <div className="lg:col-span-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Phone Controls</CardTitle>
                <CardDescription>Make calls and manage contacts</CardDescription>
              </CardHeader>
              <CardContent>
                <ContentTabs />
              </CardContent>
            </Card>
            
            {/* Audio Meters Panel */}
            <AudioMetersPanel />
            
            {/* Audio Routing Panel */}
            <AudioRoutingPanel />
          </div>
        </div>
      </div>
    </>
  );
}
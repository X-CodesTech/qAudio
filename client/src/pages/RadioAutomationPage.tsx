import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioAutomationProvider, useRadioAutomation } from '@/contexts/RadioAutomationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; 
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlayIcon, PauseIcon, SkipForwardIcon, Square as StopIcon, UploadIcon, FolderIcon, ListIcon, ClockIcon, Clock, RefreshCcw, Search, Plus, Settings, VolumeIcon, Volume2, Mic, Music, Headphones, Radio, Disc3, Disc, MinusCircle, XCircle, AlertCircle, Airplay, Wand2 } from 'lucide-react';
import PlayerModule from '@/components/PlayerModule';
import LevelMeter from '@/components/LevelMeter';
import UploadTrackDialog from '@/components/UploadTrackDialog';
import CreateFolderDialog from '@/components/CreateFolderDialog';
import { AiDjPanel } from '@/components/AiDjPanel';

// Wrap components that need access to the RadioAutomation context
const RadioAutomationPageWithProvider: React.FC = () => {
  return (
    <RadioAutomationProvider>
      <RadioAutomationPageContent />
    </RadioAutomationProvider>
  );
};

// Component to display playback controls for a studio
const PlaybackControls: React.FC<{ studio: 'A' | 'B' }> = ({ studio }) => {
  const { 
    playbackState, 
    controlPlayback 
  } = useRadioAutomation();
  
  const studioState = playbackState[studio];
  const isPlaying = studioState.status === 'playing';
  const isPaused = studioState.status === 'paused';
  const isStopped = studioState.status === 'stopped';
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between items-center">
          <span>Studio {studio} Playback</span>
          <span className={`text-sm font-normal px-2 py-1 rounded ${
            isPlaying ? 'bg-green-100 text-green-800' : 
            isPaused ? 'bg-yellow-100 text-yellow-800' : 
            'bg-gray-100 text-gray-800'
          }`}>
            {studioState.status.toUpperCase()}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          {studioState.currentTrack ? (
            <div>
              <p className="font-semibold">{studioState.currentTrack.title}</p>
              <p className="text-sm text-gray-500">
                {studioState.currentTrack.artist || 'Unknown Artist'} 
                {studioState.currentTrack.album ? ` • ${studioState.currentTrack.album}` : ''}
              </p>
              <div className="mt-2 text-xs">
                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                  <div 
                    className="bg-primary h-1.5 rounded-full" 
                    style={{ 
                      width: `${studioState.currentTrack.duration > 0 
                        ? (studioState.currentPosition / studioState.currentTrack.duration) * 100 
                        : 0}%` 
                    }}
                  ></div>
                </div>
                <div className="flex justify-between">
                  <span>
                    {Math.floor(studioState.currentPosition / 60)}:
                    {(studioState.currentPosition % 60).toString().padStart(2, '0')}
                  </span>
                  <span>
                    {Math.floor(studioState.currentTrack.duration / 60)}:
                    {(studioState.currentTrack.duration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 italic">No track playing</p>
          )}
        </div>
        
        <div className="flex justify-center space-x-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => controlPlayback('stop', studio)}
            disabled={isStopped}
          >
            <StopIcon className="h-4 w-4" />
          </Button>
          
          {isPlaying ? (
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => controlPlayback('pause', studio)}
            >
              <PauseIcon className="h-4 w-4" />
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => controlPlayback('play', studio)}
            >
              <PlayIcon className="h-4 w-4" />
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => controlPlayback('next', studio)}
            disabled={!studioState.currentPlaylist}
          >
            <SkipForwardIcon className="h-4 w-4" />
          </Button>
        </div>
        
        {studioState.nextTrack && (
          <div className="mt-4 text-xs">
            <p className="text-gray-500">Up Next:</p>
            <p>{studioState.nextTrack.title}</p>
            <p className="text-gray-500">{studioState.nextTrack.artist || 'Unknown Artist'}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Component to display playlists for a studio
const PlaylistsPanel: React.FC<{ studio: 'A' | 'B' }> = ({ studio }) => {
  const { 
    playlists, 
    playlistsLoading,
    setActivePlaylist,
    selectedPlaylistId,
    setSelectedPlaylistId
  } = useRadioAutomation();
  
  // Filter playlists for this studio
  const studioPlaylists = playlists.filter(
    p => !p.studio || p.studio === studio
  );
  
  const activatePlaylist = async (id: number) => {
    await setActivePlaylist(id, studio);
  };
  
  if (playlistsLoading) {
    return <p>Loading playlists...</p>;
  }
  
  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-medium">Playlists</h3>
        <Button variant="outline" size="sm">
          <ListIcon className="h-4 w-4 mr-2" />
          New Playlist
        </Button>
      </div>
      
      {studioPlaylists.length === 0 ? (
        <p className="text-gray-500 italic">No playlists available</p>
      ) : (
        <div className="space-y-2">
          {studioPlaylists.map(playlist => (
            <div 
              key={playlist.id}
              className={`p-3 border rounded-md cursor-pointer hover:bg-gray-50 ${
                playlist.isActive ? 'border-primary bg-primary/5' : 'border-gray-200'
              }`}
              onClick={() => setSelectedPlaylistId(playlist.id)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{playlist.name}</p>
                  <p className="text-xs text-gray-500">{playlist.type}</p>
                </div>
                {playlist.isActive ? (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    Active
                  </span>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      activatePlaylist(playlist.id);
                    }}
                  >
                    Activate
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Component to display tracks in a media library
const MediaLibraryPanel: React.FC = () => {
  const { 
    tracks, 
    tracksLoading,
    folders,
    foldersLoading,
    selectedFolderId,
    setSelectedFolderId
  } = useRadioAutomation();
  
  if (tracksLoading || foldersLoading) {
    return <p>Loading media library...</p>;
  }
  
  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-medium">Media Library</h3>
        <div className="flex space-x-2">
          <CreateFolderDialog />
          <UploadTrackDialog />
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-1">
          <div className="border rounded-md p-2">
            <div className="font-medium mb-2">Folders</div>
            <div className="space-y-1">
              <div 
                className={`p-2 rounded-md cursor-pointer hover:bg-gray-100 ${
                  selectedFolderId === null ? 'bg-gray-100' : ''
                }`}
                onClick={() => setSelectedFolderId(null)}
              >
                All Tracks
              </div>
              
              {folders.map(folder => (
                <div 
                  key={folder.id}
                  className={`p-2 rounded-md cursor-pointer hover:bg-gray-100 ${
                    selectedFolderId === folder.id ? 'bg-gray-100' : ''
                  }`}
                  onClick={() => setSelectedFolderId(folder.id)}
                >
                  {folder.name}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="col-span-3">
          <div className="border rounded-md p-2">
            <div className="font-medium mb-2">
              Tracks {selectedFolderId !== null && 
                `in ${folders.find(f => f.id === selectedFolderId)?.name || ''}`}
            </div>
            
            {tracks.length === 0 ? (
              <p className="text-gray-500 italic">No tracks available</p>
            ) : (
              <div className="space-y-1">
                <div className="grid grid-cols-12 text-xs font-medium text-gray-500 p-2">
                  <div className="col-span-5">Title</div>
                  <div className="col-span-3">Artist</div>
                  <div className="col-span-2">Duration</div>
                  <div className="col-span-2">File Type</div>
                </div>
                
                {tracks.map(track => (
                  <div 
                    key={track.id}
                    className="grid grid-cols-12 p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                  >
                    <div className="col-span-5">{track.title}</div>
                    <div className="col-span-3">{track.artist || 'Unknown'}</div>
                    <div className="col-span-2">
                      {Math.floor(track.duration / 60)}:
                      {(track.duration % 60).toString().padStart(2, '0')}
                    </div>
                    <div className="col-span-2 uppercase">{track.fileType}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Component to display scheduled events
const SchedulingPanel: React.FC = () => {
  const { scheduledEvents, scheduledEventsLoading } = useRadioAutomation();
  
  if (scheduledEventsLoading) {
    return <p>Loading scheduled events...</p>;
  }
  
  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-medium">Scheduled Events</h3>
        <Button variant="outline" size="sm">
          <ClockIcon className="h-4 w-4 mr-2" />
          Schedule New Event
        </Button>
      </div>
      
      {scheduledEvents.length === 0 ? (
        <p className="text-gray-500 italic">No scheduled events</p>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Studio
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {scheduledEvents.map(event => (
                <tr key={event.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {event.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {event.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(event.startTime).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {event.studio || 'Both'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      event.isEnabled 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {event.isEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Current Time Clock - Professional broadcast style
const CurrentTimeClock: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className="bg-black text-green-500 font-mono p-4 rounded-md text-center">
      <div className="text-4xl font-bold">
        {currentTime.toLocaleTimeString('en-US', { 
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })}
      </div>
      <div className="text-sm mt-1">
        {currentTime.toLocaleDateString('en-US', { 
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })}
      </div>
    </div>
  );
};

// Countdown Timer with colored background based on remaining time
const CountdownTimer: React.FC<{ 
  initialSeconds: number,
  label?: string
}> = ({ initialSeconds, label = "COUNTDOWN" }) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  
  useEffect(() => {
    if (!isRunning) return;
    
    const timer = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isRunning]);
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  const getBackgroundColor = () => {
    if (seconds <= 10) return 'bg-red-600'; // Danger zone
    if (seconds <= 30) return 'bg-yellow-500'; // Warning
    return 'bg-green-600'; // Safe
  };
  
  return (
    <div className={`text-white font-mono p-4 rounded-md text-center ${getBackgroundColor()}`}>
      <div className="text-sm font-semibold mb-1">{label}</div>
      <div className="text-4xl font-bold">
        {minutes.toString().padStart(2, '0')}:
        {remainingSeconds.toString().padStart(2, '0')}
      </div>
      <div className="mt-2 flex justify-center space-x-2">
        <Button 
          size="sm"
          variant="outline" 
          className="bg-black/20 hover:bg-black/40 text-white border-white/20"
          onClick={() => setIsRunning(!isRunning)}
        >
          {isRunning ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
        </Button>
        <Button 
          size="sm"
          variant="outline" 
          className="bg-black/20 hover:bg-black/40 text-white border-white/20"
          onClick={() => setSeconds(initialSeconds)}
        >
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// Track List Item component - Matches the reference DAD playout system
const TrackListItem: React.FC<{
  id: number,
  index: number,
  title: string,
  artist: string,
  duration: number,
  category?: string,
  isPlaying?: boolean,
  onPlay: () => void
}> = ({ id, index, title, artist, duration, category = "MUSIC", isPlaying, onPlay }) => {
  // Get background color based on category for professional broadcast look
  const getCategoryColor = () => {
    switch(category?.toUpperCase()) {
      case 'ID': return 'bg-red-600'; 
      case 'JINGLE': return 'bg-purple-600';
      case 'COMMERCIAL': return 'bg-pink-600';
      case 'STATION': return 'bg-green-600';
      case 'SWEEP': return 'bg-blue-600';
      default: return 'bg-indigo-600';
    }
  };
  
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  
  // Format duration as mm:ss
  const formattedDuration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  return (
    <div className={`${getCategoryColor()} text-white mb-2 rounded-sm overflow-hidden`}>
      <div className="flex items-stretch">
        {/* Left side - Play indicator */}
        <div className={`w-14 flex items-center justify-center ${isPlaying ? 'bg-green-500' : ''}`}>
          <div className="text-2xl font-bold">{index + 1}</div>
        </div>
        
        {/* Middle - Track information */}
        <div className="flex-1 p-2 flex flex-col justify-between">
          <div className="font-bold uppercase text-sm">{title}</div>
          <div className="text-xs opacity-90">{artist}</div>
          <div className="flex justify-between text-xs mt-1">
            <div>{formattedDuration}</div>
            <div className="opacity-75">{category}</div>
          </div>
        </div>
        
        {/* Right side - Play button */}
        <button 
          className="bg-black/30 hover:bg-black/50 text-white w-12 flex items-center justify-center"
          onClick={onPlay}
        >
          <PlayIcon size={20} />
        </button>
      </div>
    </div>
  );
};

// Instant Player Button - For broadcast cart wall
const CartButton: React.FC<{
  number: number,
  label?: string,
  color?: string,
  onClick: () => void
}> = ({ number, label = "Empty", color = "bg-blue-600", onClick }) => {
  return (
    <button 
      className={`${color} text-white p-1 rounded-sm flex flex-col items-center justify-center h-16 transition-colors hover:brightness-110 active:scale-95`}
      onClick={onClick}
    >
      <div className="text-xl font-bold">{number}</div>
      <div className="text-xs truncate w-full text-center font-semibold">{label}</div>
    </button>
  );
};

// Audio Waveform Component
const AudioWaveform: React.FC<{ data?: number[], isPlaying?: boolean }> = ({ 
  data = Array(100).fill(0).map(() => Math.random() * 100), 
  isPlaying = false 
}) => {
  return (
    <div className="w-full h-16 bg-zinc-800 rounded-sm relative overflow-hidden">
      <div className="flex items-end justify-between h-full px-1">
        {data.map((value, index) => (
          <div 
            key={index}
            className={`w-1 rounded-sm ${isPlaying ? 'bg-green-500' : 'bg-blue-400'}`}
            style={{ 
              height: `${value}%`,
              opacity: isPlaying && index < data.length * 0.3 ? 0.5 : 1 // Dim passed part if playing
            }}
          ></div>
        ))}
      </div>
      {isPlaying && (
        <div className="absolute left-0 top-0 h-full border-r-2 border-yellow-500" 
          style={{ left: `${30}%` }}>
        </div>
      )}
    </div>
  );
};

// Advanced Track Editor Modal
const TrackEditorModal: React.FC<{ 
  track: any,
  isOpen: boolean,
  onClose: () => void,
  onSave: (track: any) => void
}> = ({ track, isOpen, onClose, onSave }) => {
  const [editedTrack, setEditedTrack] = useState(track);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-zinc-900 border border-zinc-700 rounded-md w-[800px] max-h-[80vh] overflow-auto">
        <div className="p-4 border-b border-zinc-700 flex justify-between items-center">
          <h2 className="text-xl font-bold">Edit Track: {track.title}</h2>
          <Button variant="ghost" onClick={onClose} className="text-zinc-400 hover:text-white">
            &times;
          </Button>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm mb-1">Title</label>
              <Input 
                className="bg-zinc-800 border-zinc-700 text-white"
                value={editedTrack.title}
                onChange={(e) => setEditedTrack({...editedTrack, title: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Artist</label>
              <Input 
                className="bg-zinc-800 border-zinc-700 text-white"
                value={editedTrack.artist || ''}
                onChange={(e) => setEditedTrack({...editedTrack, artist: e.target.value})}
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm mb-1">Waveform</label>
            <AudioWaveform />
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm mb-1">Category</label>
              <Select
                value={editedTrack.category}
                onValueChange={(v) => setEditedTrack({...editedTrack, category: v})}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectItem value="MUSIC">Music</SelectItem>
                  <SelectItem value="ID">Station ID</SelectItem>
                  <SelectItem value="JINGLE">Jingle</SelectItem>
                  <SelectItem value="SWEEP">Sweep</SelectItem>
                  <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                  <SelectItem value="EFFECT">Effect</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm mb-1">Duration</label>
              <Input 
                className="bg-zinc-800 border-zinc-700 text-white"
                value={`${Math.floor(editedTrack.duration / 60)}:${(editedTrack.duration % 60).toString().padStart(2, '0')}`}
                disabled
              />
            </div>
            <div>
              <label className="block text-sm mb-1">BPM</label>
              <Input 
                className="bg-zinc-800 border-zinc-700 text-white"
                value={editedTrack.bpm || 'N/A'}
                disabled
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm mb-1">Start Point</label>
              <div className="flex">
                <Input 
                  className="bg-zinc-800 border-zinc-700 text-white"
                  value="00:00"
                />
                <Button className="ml-2 bg-blue-600">Mark</Button>
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1">End Point</label>
              <div className="flex">
                <Input 
                  className="bg-zinc-800 border-zinc-700 text-white"
                  value={`${Math.floor(editedTrack.duration / 60)}:${(editedTrack.duration % 60).toString().padStart(2, '0')}`}
                />
                <Button className="ml-2 bg-blue-600">Mark</Button>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={onClose} className="bg-zinc-800 border-zinc-700 text-white">
              Cancel
            </Button>
            <Button className="bg-green-600" onClick={() => onSave(editedTrack)}>
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Scheduler Week View Calendar
const SchedulerCalendar: React.FC = () => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  return (
    <div className="bg-black rounded-md p-2 overflow-auto">
      <div className="grid grid-cols-8 gap-1">
        {/* Time column */}
        <div className="col-span-1">
          <div className="h-10 mb-1"></div> {/* Empty header cell */}
          {hours.map(hour => (
            <div key={hour} className="h-12 text-xs flex items-center justify-center text-gray-400">
              {`${hour.toString().padStart(2, '0')}:00`}
            </div>
          ))}
        </div>
        
        {/* Day columns */}
        {days.map(day => (
          <div key={day} className="col-span-1">
            <div className="h-10 bg-zinc-800 rounded-t-md mb-1 flex items-center justify-center text-sm font-semibold">
              {day}
            </div>
            {hours.map(hour => (
              <div key={`${day}-${hour}`} className="h-12 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors">
                {/* Sample events for visualization */}
                {day === 'Monday' && hour === 8 && (
                  <div className="h-full w-full bg-blue-900 text-xs p-1 overflow-hidden">
                    Morning Show
                  </div>
                )}
                {day === 'Wednesday' && hour === 17 && (
                  <div className="h-full w-full bg-purple-900 text-xs p-1 overflow-hidden">
                    Top 40 Show
                  </div>
                )}
                {day === 'Friday' && hour === 20 && (
                  <div className="h-full w-full bg-red-900 text-xs p-1 overflow-hidden">
                    Evening Mix
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// Audio Processing Effects Panel
const AudioProcessingPanel: React.FC<{ trackId: number }> = ({ trackId }) => {
  return (
    <div className="bg-black rounded-md p-3">
      <h3 className="text-lg font-semibold mb-2">Audio Processing</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Compression</label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-gray-400 mb-1 block">Ratio</span>
              <div className="h-4 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600" style={{ width: '60%' }}></div>
              </div>
            </div>
            <div>
              <span className="text-xs text-gray-400 mb-1 block">Threshold</span>
              <div className="h-4 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-green-600" style={{ width: '40%' }}></div>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-sm mb-1">Equalization</label>
          <div className="flex justify-between items-end h-16">
            {[60, 150, 400, 1000, 2500, 6000, 15000].map((freq, i) => (
              <div key={freq} className="flex flex-col items-center">
                <div 
                  className="w-4 bg-purple-600 rounded-t-sm" 
                  style={{ height: `${Math.random() * 70 + 30}%` }}
                ></div>
                <span className="text-[9px] text-gray-400 mt-1">{freq < 1000 ? freq : `${freq/1000}k`}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-sm mb-1">Normalization</label>
          <div className="flex items-center">
            <Button variant="outline" size="sm" className="bg-zinc-800 border-zinc-700 text-white">
              Normalize to -3dB
            </Button>
            <div className="ml-4 flex-1">
              <div className="h-4 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-red-600" style={{ width: '75%' }}></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" size="sm" className="bg-zinc-800 border-zinc-700 text-white">
            Preview
          </Button>
          <Button size="sm" className="bg-green-600">
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
};

// Voice Tracker Component
const VoiceTrackerPanel: React.FC = () => {
  return (
    <div className="bg-black rounded-md p-3">
      <h3 className="text-lg font-semibold mb-2">Voice Tracker</h3>
      
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-blue-900 p-2 rounded">
          <div className="text-xs text-gray-300 mb-1">Previous Track</div>
          <div className="font-semibold text-sm">THE WORLD LEADER</div>
          <div className="text-xs text-gray-300">ERGO RADIO - SWEEP</div>
          <AudioWaveform data={Array(50).fill(0).map(() => Math.random() * 100)} />
        </div>
        
        <div className="bg-red-900 p-2 rounded">
          <div className="text-xs text-gray-300 mb-1">Voice Track</div>
          <div className="font-semibold text-sm">DJ INTRO</div>
          <div className="text-xs text-gray-300">Voice Track</div>
          <AudioWaveform data={Array(50).fill(0).map(() => Math.random() * 100)} isPlaying={true} />
          <div className="flex justify-center mt-2 space-x-2">
            <Button size="sm" variant="outline" className="bg-zinc-800 h-7 w-7 p-0">
              <Mic className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="outline" className="bg-zinc-800 h-7 w-7 p-0">
              <PlayIcon className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="outline" className="bg-zinc-800 h-7 w-7 p-0">
              <StopIcon className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        <div className="bg-green-900 p-2 rounded">
          <div className="text-xs text-gray-300 mb-1">Next Track</div>
          <div className="font-semibold text-sm">100 YEARS</div>
          <div className="text-xs text-gray-300">FIVE FOR FIGHTING</div>
          <AudioWaveform data={Array(50).fill(0).map(() => Math.random() * 100)} />
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button variant="outline" size="sm" className="bg-zinc-800 border-zinc-700 text-white">
          Cancel
        </Button>
        <Button size="sm" className="bg-green-600">
          Save Voice Track
        </Button>
      </div>
    </div>
  );
};

// Main content of the Radio Automation page - styled like DAD from the reference image
const RadioAutomationPageContent: React.FC = () => {
  const { 
    selectedStudio, 
    setSelectedStudio,
    playbackState,
    controlPlayback,
    instantPlayers,
    playInstantPlayer
  } = useRadioAutomation();
  
  // State for editor modal
  const [editingTrack, setEditingTrack] = useState<any>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  
  // State for active feature tab
  const [activeFeature, setActiveFeature] = useState<'playlist' | 'scheduler' | 'voice-tracker' | 'audio-processing' | 'ai-dj'>('playlist');
  
  // State for AI DJ panel visibility
  const [showAiDj, setShowAiDj] = useState(false);
  
  // Demo data for visualization (will connect to real data later)
  const demoCarts = [
    { number: 1, label: "TOP HOUR", color: "bg-red-600" },
    { number: 2, label: "WEATHER", color: "bg-blue-600" },
    { number: 3, label: "SWEEP 1", color: "bg-indigo-600" },
    { number: 4, label: "NEWS", color: "bg-orange-600" },
    { number: 5, label: "STATION ID", color: "bg-emerald-600" },
    { number: 6, label: "JINGLE", color: "bg-purple-600" },
    { number: 7, label: "PROMO", color: "bg-yellow-600" },
    { number: 8, label: "EFFECT", color: "bg-cyan-600" },
    { number: 9, label: "TRAFFIC", color: "bg-amber-600" },
    { number: 10, label: "WEATHER", color: "bg-teal-600" },
    { number: 11, label: "SPOT 1", color: "bg-pink-600" },
    { number: 12, label: "SPOT 2", color: "bg-violet-600" },
  ];
  
  // Demo tracks to visualize the UI
  const demoTracks = [
    { id: 1, title: "THIS IS DAD - TOP OF HOUR", artist: "ERGO RADIO - ID", duration: 32, category: "ID" },
    { id: 2, title: "Last Friday Night (T.G.I.F.)", artist: "Katy Perry", duration: 228, category: "MUSIC" },
    { id: 3, title: "EXPERIENCE THE DIFFERENCE", artist: "ERGO RADIO - SWEEP", duration: 15, category: "SWEEP" },
    { id: 4, title: "100 YEARS", artist: "FIVE FOR FIGHTING", duration: 244, category: "MUSIC" },
    { id: 5, title: "SOMEDAY", artist: "SUGAR RAY", duration: 267, category: "MUSIC" },
    { id: 6, title: "THE WORLD LEADER", artist: "ERGO RADIO - SWEEP", duration: 12, category: "SWEEP" },
  ];
  
  const openEditor = (track: any) => {
    setEditingTrack(track);
    setIsEditorOpen(true);
  };
  
  const saveTrackChanges = (updatedTrack: any) => {
    // In a real implementation, would save to backend
    console.log('Saving track changes:', updatedTrack);
    setIsEditorOpen(false);
  };
  
  return (
    <div className="bg-zinc-900 text-white p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold flex items-center">
          <Music className="mr-2" />
          QCaller Radio Automation
        </h1>
        
        <div className="flex items-center space-x-2">
          <Select
            value={selectedStudio}
            onValueChange={(value) => setSelectedStudio(value as 'A' | 'B')}
          >
            <SelectTrigger className="w-[120px] bg-zinc-800 border-zinc-700 text-white">
              <SelectValue placeholder="Studio" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
              <SelectGroup>
                <SelectLabel>Select Studio</SelectLabel>
                <SelectItem value="A">Studio A</SelectItem>
                <SelectItem value="B">Studio B</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          
          <Button variant="outline" className="bg-zinc-800 border-zinc-700 text-white">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>
      
      {/* Top row - Players and transport controls */}
      <div className="grid grid-cols-12 gap-4 mb-4">
        {/* Current time and Countdown */}
        <div className="col-span-3">
          <div className="grid grid-rows-2 gap-2">
            <CurrentTimeClock />
            <CountdownTimer initialSeconds={300} label="COUNTDOWN" />
          </div>
        </div>
        
        {/* CUE, ON AIR, and NEXT players with compact audio level meters */}
        <div className="col-span-9">
          <div className="grid grid-cols-3 gap-3">
            {/* CUE Player */}
            <PlayerModule 
              type="CUE"
              track={demoTracks[1]}
              isPlaying={false}
              levelPercentage={0}
              onPlay={() => console.log('Playing CUE track')}
              onStop={() => console.log('Stopping CUE track')}
              onPause={() => console.log('Pausing CUE track')}
              onCue={() => console.log('Cueing track')}
            />
            
            {/* ON AIR Player */}
            <PlayerModule 
              type="ON AIR"
              track={demoTracks[0]}
              isPlaying={true}
              levelPercentage={85}
              onPlay={() => console.log('Playing ON AIR track')}
              onStop={() => controlPlayback('stop', selectedStudio)}
              onPause={() => controlPlayback('pause', selectedStudio)}
              onCue={() => console.log('Cueing track')}
            />
            
            {/* NEXT Player */}
            <PlayerModule 
              type="NEXT"
              track={demoTracks[2]}
              isPlaying={false}
              levelPercentage={0}
              onPlay={() => console.log('Playing NEXT track')}
              onStop={() => console.log('Stopping NEXT track')}
              onPause={() => console.log('Pausing NEXT track')}
              onCue={() => console.log('Cueing track')}
            />
          </div>
          
          {/* Control buttons */}
          <div className="grid grid-cols-6 gap-2 mt-2">
            <Button 
              variant={activeFeature === 'playlist' ? 'default' : 'outline'} 
              className={`${activeFeature === 'playlist' ? 'bg-green-600' : 'bg-zinc-800 border-zinc-700'} text-white`}
              onClick={() => setActiveFeature('playlist')}
            >
              <ListIcon className="h-4 w-4 mr-2" />
              Playlist
            </Button>
            <Button 
              variant={activeFeature === 'scheduler' ? 'default' : 'outline'} 
              className={`${activeFeature === 'scheduler' ? 'bg-orange-600' : 'bg-zinc-800 border-zinc-700'} text-white`}
              onClick={() => setActiveFeature('scheduler')}
            >
              <Clock className="h-4 w-4 mr-2" />
              Scheduler
            </Button>
            <Button 
              variant={activeFeature === 'voice-tracker' ? 'default' : 'outline'}
              className={`${activeFeature === 'voice-tracker' ? 'bg-purple-600' : 'bg-zinc-800 border-zinc-700'} text-white`}
              onClick={() => setActiveFeature('voice-tracker')}
            >
              <Mic className="h-4 w-4 mr-2" />
              Voice Tracker
            </Button>
            <Button 
              variant={activeFeature === 'audio-processing' ? 'default' : 'outline'} 
              className={`${activeFeature === 'audio-processing' ? 'bg-blue-600' : 'bg-zinc-800 border-zinc-700'} text-white`}
              onClick={() => setActiveFeature('audio-processing')}
            >
              <Settings className="h-4 w-4 mr-2" />
              Audio Processing
            </Button>
            <Button 
              variant={activeFeature === 'ai-dj' ? 'default' : 'outline'} 
              className={`${activeFeature === 'ai-dj' ? 'bg-purple-500' : 'bg-zinc-800 border-zinc-700'} text-white`}
              onClick={() => setActiveFeature('ai-dj')}
            >
              <Wand2 className="h-4 w-4 mr-2" />
              AI DJ
            </Button>
            <Button variant="outline" className="bg-red-900 hover:bg-red-800 text-white border-zinc-700">
              <StopIcon className="h-4 w-4 mr-2" />
              Emergency Stop
            </Button>
          </div>
        </div>
      </div>
      
      {/* Feature toggles */}
      <div className="mb-4 flex space-x-2">
        <Button 
          variant={activeFeature === 'playlist' ? 'default' : 'outline'} 
          className={`${activeFeature === 'playlist' ? 'bg-green-600' : 'bg-zinc-800 border-zinc-700'} text-white`}
          onClick={() => setActiveFeature('playlist')}
        >
          <ListIcon className="h-4 w-4 mr-2" />
          Playlist
        </Button>
        <Button 
          variant={activeFeature === 'scheduler' ? 'default' : 'outline'} 
          className={`${activeFeature === 'scheduler' ? 'bg-orange-600' : 'bg-zinc-800 border-zinc-700'} text-white`}
          onClick={() => setActiveFeature('scheduler')}
        >
          <Clock className="h-4 w-4 mr-2" />
          Scheduler
        </Button>
        <Button 
          variant={activeFeature === 'ai-dj' ? 'default' : 'outline'} 
          className={`${activeFeature === 'ai-dj' ? 'bg-purple-500' : 'bg-zinc-800 border-zinc-700'} text-white`}
          onClick={() => setActiveFeature('ai-dj')}
        >
          <Wand2 className="h-4 w-4 mr-2" />
          AI DJ
        </Button>
      </div>
      
      {/* Main content area - Feature specific content */}
      {activeFeature === 'playlist' && (
        <div className="grid grid-cols-12 gap-4">
          {/* Left side - Current playlist */}
          <div className="col-span-6">
            <div className="bg-black p-2 rounded-md">
              <div className="flex justify-between items-center mb-2">
                <div className="font-bold">Playlist • Studio {selectedStudio}</div>
                <div className="flex space-x-1">
                  <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700 h-8">
                    <PlayIcon className="h-4 w-4 mr-1" /> Play
                  </Button>
                  <Button size="sm" variant="default" className="bg-red-600 hover:bg-red-700 h-8">
                    <StopIcon className="h-4 w-4 mr-1" /> Stop
                  </Button>
                  <Button size="sm" variant="outline" className="bg-zinc-800 h-8 border-zinc-700">
                    <ListIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-1 h-[60vh] overflow-y-auto pr-1">
                {demoTracks.map((track, index) => (
                  <div className="group" key={track.id} onDoubleClick={() => openEditor(track)}>
                    <TrackListItem 
                      id={track.id}
                      index={index}
                      title={track.title}
                      artist={track.artist}
                      duration={track.duration}
                      category={track.category}
                      isPlaying={index === 0}
                      onPlay={() => controlPlayback('play', selectedStudio)}
                    />
                    <div className="hidden group-hover:flex justify-end -mt-8 mr-2 space-x-1 z-10 relative">
                      <Button size="sm" variant="outline" className="h-6 w-6 p-0 bg-black/50">
                        <Settings className="h-3 w-3" onClick={() => openEditor(track)} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-2 text-xs text-right text-gray-400">
                Double-click on any track to edit its properties
              </div>
            </div>
          </div>
          
          {/* Right side - Cart wall and instant players */}
          <div className="col-span-6">
            <div className="bg-black p-2 rounded-md">
              <div className="font-bold mb-2">Cart Wall • Function Buttons</div>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {demoCarts.slice(0, 12).map(cart => (
                  <CartButton 
                    key={cart.number}
                    number={cart.number}
                    label={cart.label}
                    color={cart.color}
                    onClick={() => playInstantPlayer(cart.number, selectedStudio)}
                  />
                ))}
              </div>
              
              {/* Track Preview Waveform */}
              <div className="mb-4">
                <div className="font-bold text-sm mb-1">Selected Track Preview</div>
                <AudioWaveform isPlaying={true} />
              </div>
              
              {/* Footer control buttons */}
              <div className="grid grid-cols-5 gap-2">
                <Button variant="outline" className="bg-green-900 hover:bg-green-800 h-10">
                  <PlayIcon className="h-4 w-4 mr-1" /> Play
                </Button>
                <Button variant="outline" className="bg-yellow-900 hover:bg-yellow-800 h-10">
                  <PauseIcon className="h-4 w-4 mr-1" /> Pause
                </Button>
                <Button variant="outline" className="bg-red-900 hover:bg-red-800 h-10">
                  <StopIcon className="h-4 w-4 mr-1" /> Stop All
                </Button>
                <Button variant="outline" className="bg-blue-900 hover:bg-blue-800 h-10">
                  <ListIcon className="h-4 w-4 mr-1" /> Playlist
                </Button>
                <Button variant="outline" className="bg-zinc-800 hover:bg-zinc-700 h-10">
                  <Settings className="h-4 w-4 mr-1" /> Config
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeFeature === 'scheduler' && (
        <div className="h-[63vh] overflow-auto">
          <SchedulerCalendar />
        </div>
      )}
      
      {activeFeature === 'voice-tracker' && (
        <div className="h-[63vh] overflow-auto">
          <VoiceTrackerPanel />
        </div>
      )}
      
      {activeFeature === 'audio-processing' && (
        <div className="h-[63vh] overflow-auto">
          <AudioProcessingPanel trackId={1} />
        </div>
      )}
      
      {activeFeature === 'ai-dj' && (
        <div className="h-[63vh] overflow-auto">
          <div className="bg-black p-4 rounded-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold flex items-center">
                <Wand2 className="mr-2" />
                AI-Powered Radio Automation
              </h3>
              <span className="text-purple-400">Studio {selectedStudio}</span>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-300 mb-2">Create intelligent playlists using AI to analyze your music library and generate professional radio programming based on your preferences.</p>
            </div>
            
            <AiDjPanel 
              studioId={selectedStudio}
              tracks={demoTracks} 
              folders={[
                { id: 1, name: "Music", path: "/music", parentId: null },
                { id: 2, name: "Jingles", path: "/jingles", parentId: null },
                { id: 3, name: "Sweepers", path: "/sweepers", parentId: null },
                { id: 4, name: "IDs", path: "/ids", parentId: null }
              ]}
            />
          </div>
        </div>
      )}
      
      {/* Track Editor Modal */}
      {editingTrack && (
        <TrackEditorModal 
          track={editingTrack}
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          onSave={saveTrackChanges}
        />
      )}
    </div>
  );
};

export default RadioAutomationPageWithProvider;
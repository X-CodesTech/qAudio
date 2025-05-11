import { getCategoryIcon, getCategoryColor } from '@/lib/colorCodingSystem';
import { Badge } from '@/components/ui/badge';
import { formatDuration } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { PlayCircle, Radio, Trash2 } from 'lucide-react';

interface TrackProps {
  track: {
    id: number;
    title: string;
    artist: string | null;
    album?: string | null;
    duration: number;
    category?: string | null;
    path?: string;
    fileType?: string;
    fileSize?: number | null;
    durationFormatted?: string;
    position?: number;
    status?: 'playing' | 'next' | 'queued'; // Added status property for Auto DJ
  };
  isPlaying?: boolean;
  isNext?: boolean;
  isPlaylistActive?: boolean;
  isSelected?: boolean;
  showDuration?: boolean;
  showArtist?: boolean;
  showPlayerButtons?: boolean;
  onSelect?: (track: any) => void;
  onLoadToPlayerA?: (track: any) => void;
  onLoadToPlayerB?: (track: any) => void;
  onDelete?: (trackId: number) => void;
  onClick?: () => void;
  onDoubleClick?: () => void;
  onPlay?: (track: any) => void;
  onPause?: () => void;
  className?: string;
  draggable?: boolean;
  studio?: string;
  onDragStart?: (e: React.DragEvent, track: any) => void;
}

export function ColorCodedTrackItem({ 
  track, 
  isSelected, 
  isPlaying,
  isNext,
  isPlaylistActive,
  showDuration = true, 
  showArtist = true,
  showPlayerButtons = false,
  onSelect, 
  onLoadToPlayerA,
  onLoadToPlayerB,
  onDelete,
  onClick,
  onDoubleClick,
  onPlay,
  onPause,
  className = '',
  draggable = false,
  studio = '',
  onDragStart
}: TrackProps) {
  const categoryColor = getCategoryColor(track.category || null);
  const CategoryIcon = () => getCategoryIcon(track.category || null);
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (onSelect) {
      onSelect(track);
    }
  };

  const handleDoubleClick = () => {
    if (onDoubleClick) {
      onDoubleClick();
    }
  };
  
  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart && draggable) {
      onDragStart(e, track);
    }
  };

  const handleLoadToPlayerA = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onLoadToPlayerA) {
      onLoadToPlayerA(track);
    }
  };

  const handleLoadToPlayerB = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onLoadToPlayerB) {
      onLoadToPlayerB(track);
    }
  };
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && track.id) {
      onDelete(track.id);
    }
  };

  // Get the formatted duration, either from the track or calculate it
  const displayDuration = track.durationFormatted || formatDuration(track.duration);

  // Grid-based layout for playlist items
  if (className.includes('grid-cols-12')) {
    // Determine the highlight style for playing/next tracks
    let highlightStyle = {};
    let statusBadge = null;
    
    // IMPROVED: Check both isPlaying prop and track.status for better status indication
    // This allows the component to work with both prop-based and object-based status indicators
    const isTrackPlaying = isPlaying || track.status === 'playing';
    const isTrackNext = isNext || track.status === 'next';
    
    if (isTrackPlaying) {
      highlightStyle = { 
        backgroundColor: 'rgba(234, 88, 12, 0.15)', // Orange background for playing track
        borderLeft: `3px solid #F28C28`, // Studio A color
        boxShadow: '0 0 8px rgba(242, 140, 40, 0.4)' // Add subtle glow for playing track
      };
      statusBadge = (
        <Badge className="ml-2 bg-orange-600 text-xs h-5 animate-pulse">
          PLAYING
        </Badge>
      );
    } else if (isTrackNext) {
      highlightStyle = { 
        backgroundColor: 'rgba(22, 163, 74, 0.15)', // Green background for next track
        borderLeft: `3px solid #2D8D27`, // Studio B color
        boxShadow: '0 0 5px rgba(45, 141, 39, 0.3)' // Add subtle glow for next track
      };
      statusBadge = <Badge className="ml-2 bg-green-600 text-xs h-5">NEXT</Badge>;
    } else {
      highlightStyle = { borderLeft: `3px solid ${categoryColor}` };
    }
    
    return (
      <div 
        className={`${className} cursor-pointer transition-colors hover:bg-zinc-800 items-center px-2 py-1 border-b border-zinc-800`}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        draggable={draggable}
        onDragStart={handleDragStart}
        style={highlightStyle}
      >
        <div className="col-span-1 flex items-center text-white">
          {track.position || ""}
        </div>
        <div className="col-span-4 truncate flex items-center">
          <CategoryIcon />
          <span className="ml-2 text-white">{track.title}</span>
          {statusBadge}
        </div>
        <div className="col-span-3 truncate text-white">
          {track.artist || ""}
        </div>
        <div className="col-span-2 flex items-center justify-center">
          <span className="text-center ml-[30px] text-white">{displayDuration}</span>
        </div>
        {showPlayerButtons && (
          <div className="col-span-2 flex space-x-1 justify-end">
            {/* Player A button - orange with Radio icon for consistency */}
            <Button 
              size="sm" 
              variant="outline" 
              className="h-6 w-6 p-0 rounded-full bg-orange-600 hover:bg-orange-700 border-transparent"
              onClick={handleLoadToPlayerA}
              title="Load to Player A"
            >
              <Radio className="h-3.5 w-3.5 text-white" />
              <span className="sr-only">Load to Player A</span>
            </Button>
            
            {/* Player B button - green with Radio icon for consistency */}
            <Button 
              size="sm" 
              variant="outline" 
              className="h-6 w-6 p-0 rounded-full bg-green-600 hover:bg-green-700 border-transparent"
              onClick={handleLoadToPlayerB}
              title="Load to Player B"
            >
              <Radio className="h-3.5 w-3.5 text-white" />
              <span className="sr-only">Load to Player B</span>
            </Button>
            
            {/* Delete button */}
            <Button 
              size="sm" 
              variant="outline" 
              className="h-6 w-6 p-0 rounded-full bg-red-600 hover:bg-red-700 border-transparent"
              onClick={handleDelete}
              title="Remove from playlist"
            >
              <Trash2 className="h-3.5 w-3.5 text-white" />
              <span className="sr-only">Remove from playlist</span>
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Original non-grid layout
  // Apply the same highlight styles for the non-grid layout
  let highlightStyle = {};
  let statusBadge = null;
  
  // IMPROVED: Check both isPlaying prop and track.status for better status indication
  // This allows the component to work with both prop-based and object-based status indicators
  const isTrackPlaying = isPlaying || track.status === 'playing';
  const isTrackNext = isNext || track.status === 'next';
  
  if (isTrackPlaying) {
    highlightStyle = { 
      backgroundColor: 'rgba(234, 88, 12, 0.15)', // Orange background for playing track
      borderLeft: `3px solid #F28C28`, // Studio A color
      boxShadow: '0 0 8px rgba(242, 140, 40, 0.4)' // Add subtle glow for playing track
    };
    statusBadge = (
      <Badge className="ml-2 bg-orange-600 text-xs h-5 animate-pulse">
        PLAYING
      </Badge>
    );
  } else if (isTrackNext) {
    highlightStyle = { 
      backgroundColor: 'rgba(22, 163, 74, 0.15)', // Green background for next track
      borderLeft: `3px solid #2D8D27`, // Studio B color
      boxShadow: '0 0 5px rgba(45, 141, 39, 0.3)' // Add subtle glow for next track
    };
    statusBadge = <Badge className="ml-2 bg-green-600 text-xs h-5">NEXT</Badge>;
  } else {
    highlightStyle = { borderLeft: `3px solid ${categoryColor}` };
  }
  
  return (
    <div 
      className={`p-2 rounded-md cursor-pointer transition-colors hover:bg-muted/70 flex items-center space-x-3 ${isSelected ? 'bg-muted' : ''} ${className}`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      draggable={draggable}
      onDragStart={handleDragStart}
      style={highlightStyle}
    >
      <div className="flex-shrink-0 text-foreground/70">
        <CategoryIcon />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate text-white">{track.title}</div>
        {showArtist && track.artist && (
          <div className="text-xs text-white truncate">{track.artist}</div>
        )}
      </div>
      
      {showDuration && (
        <div className="flex-shrink-0 text-xs text-white font-mono mr-2">
          {displayDuration}
        </div>
      )}
      
      {showPlayerButtons && (
        <div className="flex space-x-1 items-center">
          {/* Player A button - orange with Radio icon for consistency */}
          <Button 
            size="sm" 
            variant="outline" 
            className="h-6 w-6 p-0 rounded-full bg-orange-600 hover:bg-orange-700 border-transparent"
            onClick={handleLoadToPlayerA}
            title="Load to Player A"
          >
            <Radio className="h-3.5 w-3.5 text-white" />
            <span className="sr-only">Load to Player A</span>
          </Button>
          
          {/* Player B button - green with Radio icon for consistency */}
          <Button 
            size="sm" 
            variant="outline" 
            className="h-6 w-6 p-0 rounded-full bg-green-600 hover:bg-green-700 border-transparent"
            onClick={handleLoadToPlayerB}
            title="Load to Player B"
          >
            <Radio className="h-3.5 w-3.5 text-white" />
            <span className="sr-only">Load to Player B</span>
          </Button>
          
          {/* Delete button */}
          <Button 
            size="sm" 
            variant="outline" 
            className="h-6 w-6 p-0 rounded-full bg-red-600 hover:bg-red-700 border-transparent"
            onClick={handleDelete}
            title="Remove from playlist"
          >
            <Trash2 className="h-3.5 w-3.5 text-white" />
            <span className="sr-only">Remove from playlist</span>
          </Button>
        </div>
      )}
    </div>
  );
}
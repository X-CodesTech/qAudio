import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { LibraryBig } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRadioAutomation } from "@/contexts/RadioAutomationContext";

export function OpenLibraryButton() {
  const { toast } = useToast();
  const { addTrackToPlayerPlaylist, controlPlayback } = useRadioAutomation();

  // Handle messages from the library window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security check to verify message origin if needed
      // if (event.origin !== window.location.origin) return;
      
      if (!event.data || typeof event.data !== 'object') return;
      
      const { type, payload } = event.data;
      
      if (type === 'PLAY_TRACK') {
        // Handle playing track in the main window
        console.log('Received request to play track:', payload);
        
        if (payload && payload.track && payload.player && controlPlayback) {
          // First add track to player and then play it
          addTrackToPlayerPlaylist(payload.player, payload.track)
            .then(() => {
              // After adding track, play it by controlling the player
              return controlPlayback('play', payload.player);
            })
            .then(() => {
              toast({
                title: "Track Playing",
                description: `${payload.track.title} playing in ${payload.player}`
              });
            })
            .catch(error => {
              toast({
                title: "Playback Error",
                description: error.message,
                variant: "destructive"
              });
            });
        }
      }
      
      if (type === 'ADD_TRACK_TO_PLAYER') {
        // Handle adding track to player playlist
        console.log('Received request to add track to player:', payload);
        
        if (payload && payload.track && payload.player && addTrackToPlayerPlaylist) {
          addTrackToPlayerPlaylist(payload.player, payload.track)
            .then(() => {
              toast({
                title: "Track Added",
                description: `${payload.track.title} added to Player ${payload.player} from Library window`
              });
            })
            .catch(error => {
              toast({
                title: "Error Adding Track",
                description: error.message,
                variant: "destructive"
              });
            });
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [toast, addTrackToPlayerPlaylist, controlPlayback]);

  const openLibraryWindow = () => {
    // Open in a new window with specific dimensions
    const width = 1024;
    const height = 768;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    const libraryWindow = window.open(
      '/library', 
      'qcaller_library',
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
    );
    
    if (libraryWindow) {
      toast({
        title: "Library Opened",
        description: "Media library opened in a new window"
      });
    } else {
      toast({
        title: "Error",
        description: "Could not open library window. Please check your popup blocker settings.",
        variant: "destructive"
      });
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="flex items-center space-x-1"
      onClick={openLibraryWindow}
    >
      <LibraryBig className="h-4 w-4" />
      <span>Open Library</span>
    </Button>
  );
}
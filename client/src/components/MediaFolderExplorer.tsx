import React, { useState, useEffect } from 'react';
import { useRadioAutomation } from '@/contexts/RadioAutomationContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  Folder, FolderOpen, Music, Plus, RefreshCw, LogIn, AlertCircle, Upload, 
  Trash2, MoreHorizontal, Edit, PlayCircle, Radio, Star, Mic, Volume2, 
  Zap, FileMusic 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import UploadTrackDialog, { type UploadTrackDialogProps } from './UploadTrackDialog';
import CreateFolderDialog, { type CreateFolderDialogProps } from './CreateFolderDialog';
import BatchUploadDialog, { type BatchUploadDialogProps } from './BatchUploadDialog';
import SimpleTrackItem from '@/components/SimpleTrackItem';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { type AudioTrack } from '@shared/schema';

// Define special folder constants at the top level
const SPECIAL_FOLDERS = {
  mazen: 14,  // Updated to match the actual folder ID in the database
  basma: 4
};

const SPECIAL_FOLDER_NAMES: Record<number, string> = {
  14: 'mazen',  // Updated to match the actual folder ID
  4: 'basma'
};

// Helper function to check if a folder is special
const isSpecialFolder = (folderId: number | null): boolean => {
  if (!folderId) return false;
  return folderId === SPECIAL_FOLDERS.mazen || folderId === SPECIAL_FOLDERS.basma;
};

// Get folder icon based on category
const getFolderIcon = (category: string | null, isOpen: boolean) => {
  if (isOpen) {
    return <FolderOpen className="h-4 w-4 text-primary mr-2" />;
  }

  switch(category) {
    case 'music':
      return <Music className="h-4 w-4 text-primary mr-2" />;
    case 'jingles':
      return <Radio className="h-4 w-4 text-primary mr-2" />;
    case 'commercials':
      return <Star className="h-4 w-4 text-primary mr-2" />;
    case 'voiceovers':
      return <Mic className="h-4 w-4 text-primary mr-2" />;
    case 'effects':
      return <Volume2 className="h-4 w-4 text-primary mr-2" />;
    case 'sweepers':
      return <Zap className="h-4 w-4 text-primary mr-2" />;
    case 'promos':
      return <FileMusic className="h-4 w-4 text-primary mr-2" />;
    default:
      return <Folder className="h-4 w-4 text-primary mr-2" />;
  }
};

interface MediaFolderExplorerProps {
  title?: string;
  className?: string;
  maxHeight?: string;
  requiresLogin?: boolean;
}

const MediaFolderExplorer: React.FC<MediaFolderExplorerProps> = ({ 
  title = 'Media Library', 
  className = '',
  maxHeight = '400px',
  requiresLogin = false
}) => {
  const { 
    folders, 
    foldersLoading, 
    tracks, 
    tracksLoading, 
    selectedFolderId, 
    setSelectedFolderId,
    getTracksForFolder,
    queryClient
  } = useRadioAutomation();
  
  const { toast } = useToast();
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [lastUploadedFolderId, setLastUploadedFolderId] = useState<number | null>(null);
  const [trackToDelete, setTrackToDelete] = useState<AudioTrack | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Function to handle delete track confirmation
  const handleDeleteTrack = async () => {
    if (!trackToDelete) return;
    
    try {
      console.log("Deleting track:", trackToDelete.id, trackToDelete.title);
      
      // Send delete request to the API
      const response = await fetch(`/api/radio/tracks/${trackToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete track: ${response.statusText}`);
      }
      
      // Show success toast
      toast({
        title: 'Track Deleted',
        description: `"${trackToDelete.title}" has been successfully deleted.`,
        variant: 'default',
      });
      
      // Refresh the folder tracks
      queryClient.invalidateQueries({ queryKey: ['radio/tracks'] });
      
      // Close the dialog
      setDeleteDialogOpen(false);
      setTrackToDelete(null);
    } catch (error) {
      console.error('Error deleting track:', error);
      
      // Show error toast
      toast({
        title: 'Delete Failed',
        description: 'An error occurred while trying to delete the track.',
        variant: 'destructive',
      });
    }
  };
  
  // Check authentication status when we get folder/track data
  useEffect(() => {
    // If folder loading finished and we have no folders, and the radio context should contain folders
    if (!foldersLoading && folders.length === 0) {
      // Check for 401 errors in the console logs that indicate auth issues
      const authErrors = document.querySelectorAll('.console-error');
      if (authErrors.length > 0) {
        const authErrorText = Array.from(authErrors)
          .map(el => el.textContent?.toLowerCase() || '')
          .some(text => text.includes('unauthorized') || text.includes('not authenticated'));
        
        if (authErrorText) {
          setIsLoggedIn(false);
        }
      }
    } else if (!foldersLoading && folders.length > 0) {
      setIsLoggedIn(true);
    }
  }, [foldersLoading, folders.length]);
  
  // Fetch tracks for a folder when it's expanded
  useEffect(() => {
    if (expandedFolders.size > 0) {
      // Convert Set to Array to avoid iteration issues
      Array.from(expandedFolders).forEach(folderId => {
        // Special handling for public folders
        const isPublicFolder = isSpecialFolder(folderId);
        
        // For special folders, try the public endpoint that doesn't require auth
        if (isPublicFolder) {
          const folderName = SPECIAL_FOLDER_NAMES[folderId];
          console.log(`Fetching from public endpoint for ${folderName} folder in useEffect`);
          
          fetch(`/api/public/folders/${folderName}/tracks`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
          }).then(response => {
            if (response.ok) {
              return response.json();
            }
            throw new Error(`Public endpoint failed: ${response.statusText}`);
          }).then(publicTracks => {
            console.log(`UseEffect: Public endpoint found ${publicTracks.length} tracks for ${folderName}`);
            
            if (publicTracks.length > 0) {
              // Force refresh to show the tracks by toggling the folder
              setExpandedFolders(prev => {
                const newSet = new Set(prev);
                newSet.delete(folderId);
                setTimeout(() => {
                  setExpandedFolders(prev => {
                    const refreshSet = new Set(prev);
                    refreshSet.add(folderId);
                    return refreshSet;
                  });
                }, 100);
                return newSet;
              });
              
              // No need to continue with other methods
              return;
            }
          }).catch(error => {
            console.error('UseEffect: Public endpoint error:', error);
            // Will fall back to regular auth method below if needed
          });
        }
        
        // Only proceed with authenticated method if user is logged in
        if (isLoggedIn) {
          // Force clear the cache before fetching
          queryClient.invalidateQueries({ queryKey: ['radio/tracks'] });
          
          getTracksForFolder(folderId)
            .then(tracks => {
              console.log(`Tracks for folder ${folderId}:`, tracks);
              
              if (tracks.length === 0) {
                // If no tracks were found, try fetching again in 1 second
                setTimeout(() => {
                  getTracksForFolder(folderId)
                    .then(retryTracks => {
                      console.log(`RETRY: Tracks for folder ${folderId}:`, retryTracks);
                    })
                    .catch(error => console.error('Error in retry fetch:', error));
                }, 1000);
              }
            })
            .catch(error => {
              // Type guard to check if error is an object with a message property
              if (typeof error === 'object' && error !== null) {
                const err = error as { message?: string };
                if (err.message && (err.message.includes('401') || err.message.includes('authentication'))) {
                  setIsLoggedIn(false);
                } else {
                  toast({
                    title: 'Error Loading Tracks',
                    description: 'Failed to load tracks for this folder',
                    variant: 'destructive',
                  });
                }
              } else {
                toast({
                  title: 'Error Loading Tracks',
                  description: 'Failed to load tracks for this folder',
                  variant: 'destructive',
                });
              }
              console.error('Error fetching tracks for folder', folderId, error);
            });
        }
      });
    }
  }, [expandedFolders, getTracksForFolder, toast, isLoggedIn, queryClient]);
  
  const toggleFolder = (folderId: number) => {
    // Check if it's a special public folder
    const isFolderSpecial = isSpecialFolder(folderId);
    
    // Only check login for non-special folders
    if (!isLoggedIn && !isFolderSpecial) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to access standard folders',
        variant: 'destructive',
      });
      return;
    }
    
    // For special folders, try the public endpoint directly
    if (isFolderSpecial) {
      const folderName = SPECIAL_FOLDER_NAMES[folderId];
      console.log(`Toggle: Using public endpoint for ${folderName} folder`);
      
      // Use public endpoint that doesn't require authentication
      fetch(`/api/public/folders/${folderName}/tracks`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch public tracks: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log(`Toggle: Public endpoint returned ${data.length} tracks for ${folderName}`);
        // Continue with folder toggling after successful fetch
        setExpandedFolders(prev => {
          const prevArray = Array.from(prev);
          const newSet = new Set(prevArray);
          if (newSet.has(folderId)) {
            newSet.delete(folderId);
          } else {
            newSet.add(folderId);
          }
          return newSet;
        });
        setSelectedFolderId(folderId);
      })
      .catch(error => {
        console.error(`Toggle: Error with public endpoint for ${folderName}:`, error);
        toast({
          title: 'Error Accessing Folder',
          description: 'Could not access the tracks in this folder',
          variant: 'destructive',
        });
      });
      
      return; // Return early for special folders
    }
    
    // For regular folders, use the standard approach
    queryClient.invalidateQueries({ queryKey: ['radio/tracks'] });
    getTracksForFolder(folderId).catch(error => {
      console.error('Error fetching tracks for folder:', error);
    });
    
    setExpandedFolders(prev => {
      // Convert Set to Array first
      const prevArray = Array.from(prev);
      const newSet = new Set(prevArray);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
    setSelectedFolderId(folderId);
  };

  const refreshFolders = async () => {
    // Check if it's a special public folder
    const isFolderSpecial = isSpecialFolder(selectedFolderId);
    
    // Only check login for non-special folders
    if (!isLoggedIn && !isFolderSpecial) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to refresh folders',
        variant: 'destructive',
      });
      return;
    }
    
    setIsRefreshing(true);
    
    // For special folders, use the public endpoint
    if (isFolderSpecial && selectedFolderId) {
      try {
        const folderName = SPECIAL_FOLDER_NAMES[selectedFolderId];
        console.log(`Refresh: Using public endpoint for ${folderName}`);
        
        const response = await fetch(`/api/public/folders/${folderName}/tracks`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch public tracks: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`Refresh: Public endpoint returned ${data.length} tracks for ${folderName}`);
        
        // Force refresh to show the tracks
        setExpandedFolders(prev => {
          const newSet = new Set(prev);
          if (selectedFolderId) {
            newSet.delete(selectedFolderId);
            setTimeout(() => {
              setExpandedFolders(prev => {
                const refreshSet = new Set(prev);
                if (selectedFolderId) {
                  refreshSet.add(selectedFolderId);
                }
                return refreshSet;
              });
            }, 100);
          }
          return newSet;
        });
        
        setIsRefreshing(false);
        return;
      } catch (error) {
        console.error('Error refreshing special folder:', error);
        setIsRefreshing(false);
        toast({
          title: 'Error Refreshing Folder',
          description: 'Could not refresh the folder content',
          variant: 'destructive',
        });
        return;
      }
    }
    
    // For regular folders with authentication
    try {
      // Force refetch data by invalidating queries
      if (selectedFolderId) {
        await getTracksForFolder(selectedFolderId);
      }
      setIsRefreshing(false);
    } catch (error) {
      console.error('Error refreshing folders', error);
      setIsRefreshing(false);
      
      // Type guard to check if error is an Error object
      if (typeof error === 'object' && error !== null) {
        const err = error as { message?: string };
        if (err.message && (err.message.includes('401') || err.message.includes('authentication'))) {
          setIsLoggedIn(false);
        }
      }
    }
  };
  
  return (
    <>
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">{title}</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={refreshFolders} disabled={isRefreshing}>
                {isRefreshing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="ml-2">Refresh</span>
              </Button>
              <CreateFolderDialog
                trigger={
                  <Button size="sm" variant="outline">
                    <Folder className="h-4 w-4 mr-2" />
                    <span>New Folder</span>
                  </Button>
                }
                onCreateComplete={() => {
                  queryClient.invalidateQueries({ queryKey: ['radio/folders'] });
                }}
              />
              <BatchUploadDialog
                trigger={
                  <Button size="sm" variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    <span>Batch Upload</span>
                  </Button>
                }
                onUploadComplete={(folderId) => {
                  if (folderId) {
                    setLastUploadedFolderId(folderId);
                    // Force refresh the folder contents
                    queryClient.invalidateQueries({ queryKey: ['radio/tracks'] });
                  }
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Unauthorized Access Alert */}
          {requiresLogin && !isLoggedIn && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Authentication required to access files.
                <Link href="/login">
                  <Button variant="link" size="sm" className="p-0 h-auto ml-2">
                    <LogIn className="h-4 w-4 mr-1" />
                    Login
                  </Button>
                </Link>
              </AlertDescription>
            </Alert>
          )}

          {/* Loading State - Folder Skeletons */}
          {foldersLoading && (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              ))}
            </div>
          )}

          {/* Empty Folders State */}
          {!foldersLoading && folders.length === 0 && (
            <div className="text-center py-6">
              <Folder className="h-8 w-8 mx-auto text-muted-foreground" />
              <h3 className="mt-2 text-lg font-medium">No Folders Available</h3>
              <p className="text-sm text-muted-foreground">
                Create your first folder to start organizing your tracks.
              </p>
              <CreateFolderDialog
                trigger={
                  <Button className="mt-4" size="sm">
                    <Plus className="h-4 w-4 mr-2" /> Create Folder
                  </Button>
                }
                onCreateComplete={() => {
                  queryClient.invalidateQueries({ queryKey: ['radio/folders'] });
                }}
              />
            </div>
          )}

          {/* Folder List */}
          {!foldersLoading && folders.length > 0 && (
            <div className="space-y-1">
              {folders.map((folder) => (
                <div key={folder.id} className="space-y-1">
                  {/* Folder Header */}
                  <div
                    className="flex items-center p-2 rounded-md hover:bg-zinc-800 transition-colors cursor-pointer"
                    onClick={() => toggleFolder(folder.id)}
                  >
                    {getFolderIcon(folder.category, expandedFolders.has(folder.id))}
                    <span className="text-sm">{folder.name}</span>
                    
                    {expandedFolders.has(folder.id) && !tracksLoading && (
                      <Badge variant="outline" className="ml-auto text-xs">
                        {tracks.filter(t => t.folderId === folder.id).length || 0} tracks
                      </Badge>
                    )}
                  </div>
                  
                  {/* Folder Content - Tracks */}
                  {expandedFolders.has(folder.id) && (
                    <div className="pl-4 bg-zinc-950/30 border-l border-zinc-800">
                      {/* Track Loading State */}
                      {tracksLoading && (
                        <div className="py-2 pl-6 space-y-2">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-center space-x-2">
                              <Skeleton className="h-3 w-3 rounded-full" />
                              <Skeleton className="h-3 w-[150px]" />
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Empty Tracks State */}
                      {!tracksLoading && tracks.filter(t => t.folderId === folder.id).length === 0 && (
                        <div className="py-4 pl-6 text-center">
                          <p className="text-xs text-muted-foreground">No tracks in this folder</p>
                          
                          <UploadTrackDialog
                            folderId={folder.id}
                            trigger={
                              <Button size="sm" variant="ghost" className="mt-2">
                                <Music className="h-3 w-3 mr-1" />
                                <span className="text-xs">Upload Track</span>
                              </Button>
                            }
                            onUploadComplete={(folderId) => {
                              // Auto-expand the folder that received uploads
                              if (folderId) {
                                setLastUploadedFolderId(folderId);
                                // Force refresh the folder contents
                                queryClient.invalidateQueries({ queryKey: ['radio/tracks'] });
                              }
                            }}
                          />
                        </div>
                      )}
                      
                      {/* Tracks List - Using sharp white styling without effects */}
                      {!tracksLoading && tracks.filter(t => t.folderId === folder.id).length > 0 && (
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                          <div className="py-1">
                            {tracks.filter(t => t.folderId === folder.id).map((track) => (
                              <ContextMenu key={track.id}>
                                <ContextMenuTrigger>
                                  <SimpleTrackItem
                                    track={track}
                                    className="text-white"
                                    onClick={() => {
                                      console.log("Track clicked - adding to playlist:", track.title);
                                      
                                      // Dispatch a custom event to add this track to the active playlist
                                      const addEvent = new CustomEvent('addTrackToPlaylist', {
                                        detail: { track }
                                      });
                                      document.dispatchEvent(addEvent);
                                    }}
                                    onDoubleClick={() => {
                                      console.log("Track double-clicked:", track.title);
                                      
                                      // Dispatch a custom event to play this track immediately
                                      const playEvent = new CustomEvent('playTrack', {
                                        detail: { track }
                                      });
                                      document.dispatchEvent(playEvent);
                                    }}
                                    onContextMenu={(e) => {
                                      e.preventDefault();
                                      console.log("Context menu opened for track:", track.title);
                                    }}
                                  />
                                </ContextMenuTrigger>
                                <ContextMenuContent className="w-48">
                                  <ContextMenuItem 
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      console.log("Play track requested via context menu:", track.title);
                                      
                                      // Play the track
                                      const playEvent = new CustomEvent('playTrack', {
                                        detail: { track }
                                      });
                                      document.dispatchEvent(playEvent);
                                      
                                      toast({
                                        title: 'Playing Track',
                                        description: `Now playing: ${track.title}`,
                                      });
                                    }}
                                  >
                                    <PlayCircle className="h-4 w-4 mr-2" />
                                    Play
                                  </ContextMenuItem>
                                  <ContextMenuItem
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      console.log("Edit track requested:", track.title);
                                      
                                      // Edit track info (placeholder for future implementation)
                                      toast({
                                        title: 'Coming Soon',
                                        description: 'Track editing feature will be available soon',
                                      });
                                    }}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </ContextMenuItem>
                                  <ContextMenuSeparator />
                                  <ContextMenuItem 
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      console.log("Delete track requested via context menu:", track.title);
                                      
                                      setTrackToDelete(track);
                                      setDeleteDialogOpen(true);
                                    }}
                                    className="text-red-500 focus:text-red-500"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </ContextMenuItem>
                                </ContextMenuContent>
                              </ContextMenu>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Track</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{trackToDelete?.title}"?
              <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTrack}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MediaFolderExplorer;
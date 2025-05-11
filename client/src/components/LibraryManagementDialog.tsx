import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; 
import { Folder, Music, Plus, Trash2, Upload, Edit, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRadioAutomation } from "@/contexts/RadioAutomationContext";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

// Track uploader dialog component
import UploadTrackDialog from './UploadTrackDialog';

export interface FolderWithTracks {
  id: number;
  name: string;
  description: string | null;
  path?: string;
  parentId?: number | null;
  createdAt: Date | null;
  category?: string | null;
  tracks: any[];
}

interface LibraryManagementDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export default function LibraryManagementDialog({ 
  open: propOpen, 
  onOpenChange, 
  trigger 
}: LibraryManagementDialogProps = {}) {
  const { toast } = useToast();
  const { folders, foldersLoading, createFolderMutation, deleteFolder, getTracksForFolder } = useRadioAutomation();
  
  // State for dialog open/close - controlled if props are provided, uncontrolled otherwise
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Use either the prop or internal state for the open state
  const open = propOpen !== undefined ? propOpen : internalOpen;
  
  // Handler for changing open state that respects props
  const handleOpenChange = (newOpenState: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpenState);
    } else {
      setInternalOpen(newOpenState);
    }
  };
  
  // State for folder creation
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');
  
  // State for folder deletion
  const [showDeleteFolderDialog, setShowDeleteFolderDialog] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<{ id: number, name: string } | null>(null);
  
  // State for folders with tracks
  const [foldersWithTracks, setFoldersWithTracks] = useState<FolderWithTracks[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<FolderWithTracks | null>(null);
  
  // State for upload track dialog
  const [showUploadTrackDialog, setShowUploadTrackDialog] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Load folder contents when dialog opens or folders change
  useEffect(() => {
    if (open && !foldersLoading) {
      loadFoldersWithTracks();
    }
  }, [open, folders, foldersLoading]);

  // Load all folders with their tracks
  const loadFoldersWithTracks = async () => {
    if (!folders || folders.length === 0) return;
    
    try {
      const foldersWithTracksData: FolderWithTracks[] = [];
      
      for (const folder of folders) {
        const tracks = await getTracksForFolder(folder.id);
        foldersWithTracksData.push({
          ...folder,
          tracks: tracks || []
        });
      }
      
      setFoldersWithTracks(foldersWithTracksData);
      
      // Select the first folder by default if none is selected
      if (!selectedFolder && foldersWithTracksData.length > 0) {
        setSelectedFolder(foldersWithTracksData[0]);
      }
    } catch (error) {
      console.error('Error loading folders with tracks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load library content',
        variant: 'destructive',
      });
    }
  };

  // Create a new folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a folder name',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      await createFolderMutation.mutateAsync({
        name: newFolderName.trim(),
        description: newFolderDescription.trim() || null,
      });
      
      toast({
        title: 'Folder Created',
        description: `Folder "${newFolderName}" has been created successfully`,
        variant: 'default',
      });
      
      // Reset form
      setNewFolderName('');
      setNewFolderDescription('');
      setShowCreateFolderDialog(false);
      
      // Reload folders
      await loadFoldersWithTracks();
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        title: 'Error',
        description: 'Failed to create folder',
        variant: 'destructive',
      });
    }
  };

  // Delete a folder
  const handleDeleteFolder = async () => {
    if (!folderToDelete) return;
    
    try {
      await deleteFolder(folderToDelete.id);
      
      toast({
        title: 'Folder Deleted',
        description: `Folder "${folderToDelete.name}" has been deleted successfully`,
        variant: 'default',
      });
      
      // Reset selection if the deleted folder was selected
      if (selectedFolder && selectedFolder.id === folderToDelete.id) {
        setSelectedFolder(null);
      }
      
      // Close dialog
      setShowDeleteFolderDialog(false);
      setFolderToDelete(null);
      
      // Reload folders
      await loadFoldersWithTracks();
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete folder',
        variant: 'destructive',
      });
    }
  };

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    
    try {
      // Use the searchTracks function from context if available
      const results = await fetch(`/api/radio/tracks/search?query=${encodeURIComponent(searchQuery)}`);
      const data = await results.json();
      
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching tracks:', error);
      toast({
        title: 'Search Error',
        description: 'Failed to search tracks',
        variant: 'destructive',
      });
      setSearchResults([]);
    }
    
    setIsSearching(false);
  };

  // Add track to folder
  const addTrackToFolder = async (trackId: number, folderId: number) => {
    try {
      const response = await fetch(`/api/radio/tracks/${trackId}/folder`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add track to folder');
      }
      
      toast({
        title: 'Track Added',
        description: 'Track has been added to the folder successfully',
        variant: 'default',
      });
      
      // Reload folders to update UI
      await loadFoldersWithTracks();
    } catch (error) {
      console.error('Error adding track to folder:', error);
      toast({
        title: 'Error',
        description: 'Failed to add track to folder',
        variant: 'destructive',
      });
    }
  };

  // Remove track from folder
  const removeTrackFromFolder = async (trackId: number) => {
    try {
      const response = await fetch(`/api/radio/tracks/${trackId}/folder`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove track from folder');
      }
      
      toast({
        title: 'Track Removed',
        description: 'Track has been removed from the folder successfully',
        variant: 'default',
      });
      
      // Reload folders to update UI
      await loadFoldersWithTracks();
    } catch (error) {
      console.error('Error removing track from folder:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove track from folder',
        variant: 'destructive',
      });
    }
  };

  // Format track duration to MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ? trigger : (
          <Button variant="ghost" className="h-9 w-9 p-0">
            <span className="sr-only">Library</span>
            <Folder className="h-5 w-5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Folder className="mr-2 h-5 w-5" />
            Media Library Management
          </DialogTitle>
          <DialogDescription>
            Browse, organize, and manage your media library. Create folders, upload tracks, and organize your content.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="folders" className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="folders" className="flex items-center">
                  <Folder className="mr-2 h-4 w-4" />
                  Folders
                </TabsTrigger>
                <TabsTrigger value="search" className="flex items-center">
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </TabsTrigger>
              </TabsList>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center"
                  onClick={() => setShowCreateFolderDialog(true)}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  New Folder
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center"
                  onClick={() => {
                    if (selectedFolder) {
                      setShowUploadTrackDialog(true);
                    } else {
                      toast({
                        title: 'No Folder Selected',
                        description: 'Please select a folder first',
                        variant: 'destructive',
                      });
                    }
                  }}
                >
                  <Upload className="mr-1 h-4 w-4" />
                  Upload Track
                </Button>
              </div>
            </div>
            
            <TabsContent value="folders" className="flex flex-1 overflow-hidden">
              <div className="grid grid-cols-12 gap-4 h-full">
                {/* Folder list */}
                <div className="col-span-4 border rounded-md overflow-hidden flex flex-col">
                  <div className="p-3 font-medium border-b bg-muted/50">
                    Folders
                  </div>
                  <ScrollArea className="flex-1">
                    {foldersLoading ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
                      </div>
                    ) : foldersWithTracks.length === 0 ? (
                      <div className="p-6 text-center text-muted-foreground">
                        No folders found. Create your first folder to get started.
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        {foldersWithTracks.map((folder) => (
                          <div
                            key={folder.id}
                            className={`flex items-center justify-between p-3 hover:bg-muted cursor-pointer ${
                              selectedFolder?.id === folder.id ? 'bg-muted' : ''
                            }`}
                            onClick={() => setSelectedFolder(folder)}
                          >
                            <div className="flex items-center">
                              <Folder className="mr-2 h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">{folder.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {folder.tracks.length} tracks
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFolderToDelete(folder);
                                setShowDeleteFolderDialog(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
                
                {/* Folder contents */}
                <div className="col-span-8 border rounded-md overflow-hidden flex flex-col">
                  <div className="p-3 font-medium border-b bg-muted/50 flex justify-between items-center">
                    <span>
                      {selectedFolder
                        ? `${selectedFolder.name} (${selectedFolder.tracks.length} tracks)`
                        : 'No Folder Selected'}
                    </span>
                  </div>
                  <ScrollArea className="flex-1">
                    {!selectedFolder ? (
                      <div className="p-6 text-center text-muted-foreground">
                        Select a folder to view its contents
                      </div>
                    ) : selectedFolder.tracks.length === 0 ? (
                      <div className="p-6 text-center text-muted-foreground">
                        This folder is empty. Upload tracks to get started.
                      </div>
                    ) : (
                      <div className="divide-y">
                        {selectedFolder.tracks.map((track) => (
                          <div
                            key={track.id}
                            className="flex items-center justify-between p-3 hover:bg-muted group"
                          >
                            <div className="flex items-center">
                              <Music className="mr-3 h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">{track.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {track.artist || 'Unknown Artist'} • {formatDuration(track.duration)}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100"
                                onClick={() => removeTrackFromFolder(track.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="search" className="h-full flex flex-col">
              <div className="flex mb-4 gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Search tracks by title, artist, or album..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch();
                      }
                    }}
                  />
                </div>
                <Button onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? (
                    <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                  ) : (
                    <Search className="mr-2 h-4 w-4" />
                  )}
                  Search
                </Button>
              </div>
              
              <ScrollArea className="flex-1 border rounded-md">
                {isSearching ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    {searchQuery
                      ? 'No tracks found matching your search'
                      : 'Enter a search term to find tracks'}
                  </div>
                ) : (
                  <div className="divide-y">
                    {searchResults.map((track) => (
                      <div
                        key={track.id}
                        className="flex items-center justify-between p-3 hover:bg-muted group"
                      >
                        <div className="flex items-center">
                          <Music className="mr-3 h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{track.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {track.artist || 'Unknown Artist'} • {formatDuration(track.duration)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <select
                              className="text-xs rounded border px-2 py-1"
                              onChange={(e) => {
                                const folderId = Number(e.target.value);
                                if (folderId) {
                                  addTrackToFolder(track.id, folderId);
                                }
                              }}
                              value=""
                            >
                              <option value="" disabled>
                                Add to folder...
                              </option>
                              {foldersWithTracks.map((folder) => (
                                <option key={folder.id} value={folder.id}>
                                  {folder.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Create Folder Dialog */}
        {showCreateFolderDialog && (
          <AlertDialog open={showCreateFolderDialog} onOpenChange={setShowCreateFolderDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Create New Folder</AlertDialogTitle>
                <AlertDialogDescription>
                  Enter the details for your new folder.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Folder Name</Label>
                  <Input
                    id="name"
                    placeholder="New Folder"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    placeholder="Enter a description..."
                    value={newFolderDescription}
                    onChange={(e) => setNewFolderDescription(e.target.value)}
                  />
                </div>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleCreateFolder}>Create Folder</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        
        {/* Delete Folder Dialog */}
        {showDeleteFolderDialog && folderToDelete && (
          <AlertDialog open={showDeleteFolderDialog} onOpenChange={setShowDeleteFolderDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Folder</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete the folder "{folderToDelete.name}"?
                  This action cannot be undone and all tracks in this folder will be
                  disassociated (but not deleted).
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteFolder}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        
        {/* Upload Track Dialog */}
        {selectedFolder && (
          <UploadTrackDialog
            open={showUploadTrackDialog}
            onOpenChange={setShowUploadTrackDialog}
            folderId={selectedFolder.id}
            onUploadComplete={() => loadFoldersWithTracks()}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
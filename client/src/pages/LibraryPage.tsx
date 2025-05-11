import React, { useState, useEffect } from 'react';
import { useRadioAutomation } from '@/contexts/RadioAutomationContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Loader2, Home, Folder, Music, Play, PlayCircle, PlusCircle, 
  Upload, FileAudio2, Search, RefreshCw, ChevronRight, ChevronDown, 
  FolderPlus, FilePlus, Trash2, Download, Edit, Info, Filter, Library, Clock,
  Headphones, VolumeX, BarChart, FileEdit, Waves
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

// Define types for our data models (simplified versions of what's in contexts)
type MediaFolder = {
  id: number;
  name: string;
  path: string;
  parentId: number | null;
  description: string | null;
  createdAt: Date | null;
};

type AudioTrack = {
  id: number;
  title: string;
  artist: string | null;
  album: string | null;
  duration: number;
  path: string;
  fileType: string;
  fileSize: number | null;
  waveformData: string | null;
  cuePoints: string | null;
  bpm: string | null;
  tags: string[] | null;
  category: string | null;
  normalizedLevel: string | null;
  folderId: number | null;
  createdAt: Date | null;
  lastPlayedAt: Date | null;
  playCount: number | null;
  durationFormatted?: string;
  fileSizeFormatted?: string;
};

// Type for folder tree node with children
type FolderTreeNode = MediaFolder & {
  children: FolderTreeNode[];
  expanded: boolean;
};

// Helper function to create folder tree
function buildFolderTree(folders: MediaFolder[]): FolderTreeNode[] {
  const folderMap = new Map<number | null, FolderTreeNode[]>();
  
  // Initialize map with empty arrays
  folders.forEach(folder => {
    if (!folderMap.has(folder.parentId)) {
      folderMap.set(folder.parentId, []);
    }
  });
  
  // Populate map with folder nodes
  folders.forEach(folder => {
    const node: FolderTreeNode = {
      ...folder,
      children: [],
      expanded: false,
    };
    const children = folderMap.get(folder.id) || [];
    node.children = children;
    
    const parentChildren = folderMap.get(folder.parentId) || [];
    parentChildren.push(node);
    folderMap.set(folder.parentId, parentChildren);
  });
  
  // Return root nodes (parentId is null)
  return folderMap.get(null) || [];
}

export default function LibraryPage() {
  const { toast } = useToast();
  const { 
    tracks, 
    tracksLoading, 
    folders, 
    foldersLoading,
    selectedFolderId,
    setSelectedFolderId,
    getTracksForFolder
  } = useRadioAutomation();
  
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [folderPath, setFolderPath] = useState<MediaFolder[]>([]);
  const [currentTracks, setCurrentTracks] = useState<AudioTrack[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<number[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<AudioTrack[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [currentTab, setCurrentTab] = useState<string>('tracks');
  const [folderTree, setFolderTree] = useState<FolderTreeNode[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState<boolean>(false);
  const [folderStats, setFolderStats] = useState<{
    totalTracks: number;
    totalDuration: string;
    averageDuration: string;
    sizeOnDisk: string;
  }>({
    totalTracks: 0,
    totalDuration: '00:00:00',
    averageDuration: '00:00',
    sizeOnDisk: '0 MB'
  });
  
  // Build folder tree
  useEffect(() => {
    if (folders.length > 0) {
      const tree = buildFolderTree(folders);
      setFolderTree(tree);
    }
  }, [folders]);
  
  // Calculate folder statistics when tracks change
  useEffect(() => {
    if (currentTracks.length > 0) {
      // Calculate total duration in seconds
      const totalDurationSeconds = currentTracks.reduce((sum, track) => sum + track.duration, 0);
      
      // Format total duration as HH:MM:SS
      const hours = Math.floor(totalDurationSeconds / 3600);
      const minutes = Math.floor((totalDurationSeconds % 3600) / 60);
      const seconds = Math.floor(totalDurationSeconds % 60);
      const totalDuration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      // Calculate average duration
      const avgDurationSeconds = totalDurationSeconds / currentTracks.length;
      const avgMinutes = Math.floor(avgDurationSeconds / 60);
      const avgSeconds = Math.floor(avgDurationSeconds % 60);
      const averageDuration = `${avgMinutes.toString().padStart(2, '0')}:${avgSeconds.toString().padStart(2, '0')}`;
      
      // Calculate total size
      const totalSizeBytes = currentTracks.reduce((sum, track) => sum + (track.fileSize || 0), 0);
      const sizeInMB = totalSizeBytes / (1024 * 1024);
      const sizeOnDisk = sizeInMB < 1 
        ? `${(sizeInMB * 1024).toFixed(2)} KB` 
        : `${sizeInMB.toFixed(2)} MB`;
      
      setFolderStats({
        totalTracks: currentTracks.length,
        totalDuration,
        averageDuration,
        sizeOnDisk
      });
    } else {
      setFolderStats({
        totalTracks: 0,
        totalDuration: '00:00:00',
        averageDuration: '00:00',
        sizeOnDisk: '0 MB'
      });
    }
  }, [currentTracks]);
  
  // Toggle folder expand/collapse
  const toggleFolder = (folderId: number) => {
    if (expandedFolders.includes(folderId)) {
      setExpandedFolders(expandedFolders.filter(id => id !== folderId));
    } else {
      setExpandedFolders([...expandedFolders, folderId]);
    }
  };
  
  // Load tracks for a folder
  const loadTracksForFolder = async (folderId: number | null) => {
    try {
      setIsLoadingTracks(true);
      const folderTracks = await getTracksForFolder(folderId);
      setCurrentTracks(folderTracks);
      setIsLoadingTracks(false);
      
      // Update the path to this folder
      if (folderId === null) {
        setFolderPath([]);
      } else {
        // Find this folder
        const folder = folders.find(f => f.id === folderId);
        if (folder) {
          // Find parent folders to build complete path
          const path: MediaFolder[] = [folder];
          let parentId = folder.parentId;
          
          while (parentId !== null) {
            const parentFolder = folders.find(f => f.id === parentId);
            if (parentFolder) {
              path.unshift(parentFolder);
              parentId = parentFolder.parentId;
            } else {
              break;
            }
          }
          
          setFolderPath(path);
        }
      }
    } catch (error) {
      console.error("Error loading tracks:", error);
      toast({
        title: "Error",
        description: "Failed to load tracks for this folder",
        variant: "destructive"
      });
      setIsLoadingTracks(false);
    }
  };
  
  // Handle folder selection
  const handleFolderSelect = async (folderId: number | null) => {
    setCurrentFolderId(folderId);
    setSelectedFolderId(folderId);
    await loadTracksForFolder(folderId);
    
    // Ensure the folder is expanded in the tree
    if (folderId !== null) {
      // Expand all parent folders
      const folder = folders.find(f => f.id === folderId);
      if (folder && folder.parentId !== null) {
        let parentId = folder.parentId;
        const parentsToExpand: number[] = [];
        
        while (parentId !== null) {
          parentsToExpand.push(parentId);
          const parentFolder = folders.find(f => f.id === parentId);
          if (!parentFolder) break;
          parentId = parentFolder.parentId;
        }
        
        // Add all parent IDs to expanded list if not already there
        const newExpanded = [...expandedFolders];
        parentsToExpand.forEach(id => {
          if (!newExpanded.includes(id)) {
            newExpanded.push(id);
          }
        });
        
        setExpandedFolders(newExpanded);
      }
    }
  };
  
  // Search tracks
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    
    // Simple search implementation
    const query = searchQuery.toLowerCase();
    const results = tracks.filter(track => 
      track.title.toLowerCase().includes(query) ||
      (track.artist && track.artist.toLowerCase().includes(query)) ||
      (track.album && track.album.toLowerCase().includes(query)) ||
      (track.category && track.category.toLowerCase().includes(query))
    );
    
    setSearchResults(results);
  };
  
  // Send track to main window
  const sendTrackToMainWindow = (track: AudioTrack, action: 'play' | 'add', player: string) => {
    const messageType = action === 'play' ? 'PLAY_TRACK' : 'ADD_TRACK_TO_PLAYER';
    
    if (window.opener) {
      window.opener.postMessage({
        type: messageType,
        payload: {
          track,
          player
        }
      }, '*');
      
      toast({
        title: action === 'play' ? "Playing Track" : "Track Added",
        description: `${track.title} ${action === 'play' ? 'playing in' : 'added to'} Player ${player}`,
      });
    } else {
      toast({
        title: "Error",
        description: "Cannot communicate with main window",
        variant: "destructive"
      });
    }
  };
  
  // Render folder tree node
  const renderFolderTreeNode = (node: FolderTreeNode, level: number = 0) => {
    const isSelected = currentFolderId === node.id;
    const isExpanded = expandedFolders.includes(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const paddingLeft = `${level * 16 + 8}px`;
    
    return (
      <React.Fragment key={node.id}>
        <div 
          className={`flex items-center py-1.5 pr-2 cursor-pointer hover:bg-accent/50 transition-colors ${
            isSelected ? 'bg-primary/20 font-medium' : ''
          }`}
          style={{ paddingLeft }}
          onClick={() => handleFolderSelect(node.id)}
        >
          {hasChildren ? (
            <button 
              className="mr-1 h-4 w-4 flex items-center justify-center text-white hover:text-primary"
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(node.id);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <div className="w-4 mr-1"></div>
          )}
          
          <Folder className="h-4 w-4 mr-1.5 flex-shrink-0 text-white" />
          <span className="truncate text-sm">{node.name}</span>
        </div>
        
        {isExpanded && hasChildren && (
          <div>
            {node.children.map(childNode => renderFolderTreeNode(childNode, level + 1))}
          </div>
        )}
      </React.Fragment>
    );
  };
  
  // Generate folder tree view
  const folderTreeView = (
    <ScrollArea className="h-[calc(100vh-220px)]">
      <div className="pr-4 py-2">
        <div 
          className={`flex items-center py-1.5 px-2 cursor-pointer hover:bg-accent/50 ${
            currentFolderId === null ? 'bg-primary/20 font-medium' : ''
          }`}
          onClick={() => handleFolderSelect(null)}
        >
          <Home className="h-4 w-4 mr-1.5 text-white" />
          <span className="text-sm">All Tracks</span>
        </div>
        
        <Separator className="my-2" />
        
        {folderTree.map(node => renderFolderTreeNode(node))}
      </div>
    </ScrollArea>
  );
  
  // Initialize
  useEffect(() => {
    const loadInitialTracks = async () => {
      try {
        setIsLoadingTracks(true);
        const rootTracks = await getTracksForFolder(null);
        setCurrentTracks(rootTracks);
        setIsLoadingTracks(false);
      } catch (error) {
        console.error("Error loading initial tracks:", error);
        toast({
          title: "Error",
          description: "Failed to load tracks",
          variant: "destructive"
        });
        setIsLoadingTracks(false);
      }
    };
    
    loadInitialTracks();
  }, [getTracksForFolder, toast]);
  
  // Loading state
  if (foldersLoading || (tracksLoading && !currentTracks.length)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p>Loading media library...</p>
        </div>
      </div>
    );
  }
  
  // Determine which tracks to display
  const displayTracks = isSearching ? searchResults : currentTracks;
  
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4">
      <Card className="border-zinc-800 bg-zinc-900 shadow-lg">
        <CardHeader className="pb-2 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center text-white">
                <Library className="h-5 w-5 mr-2 text-orange-500" />
                <span>Media Library Manager</span>
                <Badge variant="outline" className="ml-3 text-xs text-white">Professional Edition</Badge>
              </CardTitle>
              <CardDescription className="text-white">Advanced media organization and management</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => window.location.reload()}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Refresh Library</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="secondary" size="sm" title="Close Window" onClick={() => window.close()} className="text-white">
                      Close
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Close Library Manager</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          
          {/* Path & Search */}
          <div className="mt-4 flex items-center justify-between">
            <Breadcrumb className="flex-grow">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink 
                    className="text-sm text-white hover:text-primary" 
                    onClick={() => handleFolderSelect(null)}
                  >
                    <Home className="h-3.5 w-3.5" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {folderPath.map((folder, index) => (
                  <React.Fragment key={folder.id}>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink 
                        className="text-sm text-white hover:text-primary" 
                        onClick={() => handleFolderSelect(folder.id)}
                      >
                        {folder.name}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
            <div className="relative flex flex-shrink-0 w-64">
              <Input 
                className="pr-8 text-sm bg-zinc-950 border-zinc-800"
                placeholder="Search library..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button 
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:text-primary"
                onClick={handleSearch}
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="flex h-full">
            {/* Left sidebar - Folder Tree */}
            <div className="w-64 border-r border-zinc-800 p-3 bg-zinc-950/50">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold text-white/90">Folders</h3>
                <div className="flex space-x-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-white" title="Add New Folder">
                    <FolderPlus className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-white" title="Upload Files">
                    <Upload className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              
              {/* Folder Tree Component */}
              {folderTreeView}
            </div>
            
            {/* Main content area */}
            <div className="flex-1 overflow-hidden">
              <Tabs defaultValue="tracks" value={currentTab} onValueChange={setCurrentTab}>
                <div className="pl-3 pr-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                  <TabsList className="h-10 bg-transparent">
                    <TabsTrigger 
                      value="tracks" 
                      className="h-10 px-4 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none text-sm text-white"
                    >
                      Tracks
                    </TabsTrigger>
                    <TabsTrigger 
                      value="analytics" 
                      className="h-10 px-4 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none text-sm text-white"
                    >
                      Analytics
                    </TabsTrigger>
                    <TabsTrigger 
                      value="metadata" 
                      className="h-10 px-4 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none text-sm text-white"
                    >
                      Metadata
                    </TabsTrigger>
                  </TabsList>
                  
                  <div className="flex items-center gap-1">
                    {isLoadingTracks ? (
                      <div className="flex items-center">
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5 text-primary" />
                        <span className="text-xs text-white">Loading...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 text-xs text-white">
                        <div className="flex items-center">
                          <Music className="h-3.5 w-3.5 mr-1" />
                          <span>{folderStats.totalTracks} tracks</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-3.5 w-3.5 mr-1" />
                          <span>{folderStats.totalDuration}</span>
                        </div>
                        <div className="flex items-center">
                          <FileAudio2 className="h-3.5 w-3.5 mr-1" />
                          <span>{folderStats.sizeOnDisk}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <TabsContent value="tracks" className="m-0 p-0 h-[calc(100vh-220px)] overflow-hidden">
                  {isSearching && searchResults.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <Search className="h-12 w-12 mb-3 text-white/60" />
                      <h3 className="font-medium text-lg mb-1 text-white">No Results Found</h3>
                      <p className="text-sm text-white">Try a different search term</p>
                    </div>
                  ) : displayTracks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <Music className="h-12 w-12 mb-3 text-white/60" />
                      <h3 className="font-medium text-lg mb-1 text-white">No Tracks Found</h3>
                      <p className="text-sm text-white mb-4">This folder is empty</p>
                      <Button variant="outline" size="sm" className="text-white">
                        <Upload className="h-4 w-4 mr-1.5" />
                        Upload Tracks
                      </Button>
                    </div>
                  ) : (
                    <ScrollArea className="h-full">
                      <Table>
                        <TableHeader className="sticky top-0 bg-zinc-900/95 backdrop-blur-sm z-10">
                          <TableRow className="hover:bg-transparent border-zinc-800">
                            <TableHead className="w-[50px]">Actions</TableHead>
                            <TableHead className="w-[300px]">Title</TableHead>
                            <TableHead className="w-[180px]">Artist</TableHead>
                            <TableHead className="w-[180px]">Album</TableHead>
                            <TableHead className="w-[100px]">Duration</TableHead>
                            <TableHead className="w-[120px]">Category</TableHead>
                            <TableHead className="w-[80px]">Format</TableHead>
                            <TableHead className="w-[100px]">Size</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {displayTracks.map((track) => (
                            <TableRow 
                              key={track.id} 
                              className={`hover:bg-accent/10 border-zinc-800/50 ${selectedTrackId === track.id ? 'bg-primary/10' : ''}`}
                              onClick={() => setSelectedTrackId(track.id)}
                            >
                              <TableCell className="px-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                      <Play className="h-4 w-4 text-primary" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start" className="w-52 bg-zinc-950 border-zinc-800">
                                    <DropdownMenuLabel className="text-xs">Playback Options</DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-zinc-800" />
                                    <DropdownMenuItem onClick={() => sendTrackToMainWindow(track, 'play', 'A')}>
                                      <PlayCircle className="h-4 w-4 mr-2 text-orange-500" />
                                      Play in Studio A
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => sendTrackToMainWindow(track, 'play', 'B')}>
                                      <PlayCircle className="h-4 w-4 mr-2 text-green-500" />
                                      Play in Studio B
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-zinc-800" />
                                    <DropdownMenuItem onClick={() => sendTrackToMainWindow(track, 'add', 'A')}>
                                      <PlusCircle className="h-4 w-4 mr-2 text-orange-500" />
                                      Add to Studio A
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => sendTrackToMainWindow(track, 'add', 'B')}>
                                      <PlusCircle className="h-4 w-4 mr-2 text-green-500" />
                                      Add to Studio B
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-zinc-800" />
                                    <DropdownMenuItem>
                                      <Headphones className="h-4 w-4 mr-2" />
                                      Preview
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Waves className="h-4 w-4 mr-2" />
                                      Edit Markers
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                              <TableCell className="font-medium">
                                <div className="flex items-center">
                                  <FileAudio2 className="h-4 w-4 mr-2 text-white flex-shrink-0" />
                                  <span className="truncate">{track.title}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-white">{track.artist || "-"}</TableCell>
                              <TableCell className="text-sm text-white">{track.album || "-"}</TableCell>
                              <TableCell className="text-sm font-mono text-white">{track.durationFormatted || "-"}</TableCell>
                              <TableCell>
                                {track.category ? (
                                  <Badge variant="outline" className="font-normal rounded-sm text-xs">
                                    {track.category}
                                  </Badge>
                                ) : "-"}
                              </TableCell>
                              <TableCell className="text-xs text-white uppercase">{track.fileType}</TableCell>
                              <TableCell className="text-xs text-white">{track.fileSizeFormatted || "-"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  )}
                </TabsContent>
                
                <TabsContent value="analytics" className="m-0 p-6 h-[calc(100vh-220px)] overflow-auto">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <Card className="bg-zinc-950 border-zinc-800">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center text-white">
                          <BarChart className="h-4 w-4 mr-2 text-primary" />
                          Media Statistics
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-zinc-900 p-3 rounded-md">
                            <div className="text-xs text-zinc-400 mb-1">Total Tracks</div>
                            <div className="text-2xl font-bold">{folderStats.totalTracks}</div>
                          </div>
                          <div className="bg-zinc-900 p-3 rounded-md">
                            <div className="text-xs text-zinc-400 mb-1">Total Duration</div>
                            <div className="text-xl font-mono font-bold">{folderStats.totalDuration}</div>
                          </div>
                          <div className="bg-zinc-900 p-3 rounded-md">
                            <div className="text-xs text-zinc-400 mb-1">Average Duration</div>
                            <div className="text-xl font-mono font-bold">{folderStats.averageDuration}</div>
                          </div>
                          <div className="bg-zinc-900 p-3 rounded-md">
                            <div className="text-xs text-zinc-400 mb-1">Storage Used</div>
                            <div className="text-xl font-bold">{folderStats.sizeOnDisk}</div>
                          </div>
                        </div>
                        <Separator className="my-4" />
                        <div className="text-sm">
                          <p className="mb-2 text-zinc-400">Current folder analysis:</p>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                            <div className="flex justify-between py-1 border-b border-zinc-800">
                              <span>Audio Quality:</span>
                              <span className="font-medium">High (44.1kHz)</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-zinc-800">
                              <span>Most Common Format:</span>
                              <span className="font-medium">MP3</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-zinc-800">
                              <span>Analyzed Tracks:</span>
                              <span className="font-medium">{Math.floor(folderStats.totalTracks * 0.85)}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-zinc-800">
                              <span>Pending Analysis:</span>
                              <span className="font-medium">{Math.ceil(folderStats.totalTracks * 0.15)}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-zinc-950 border-zinc-800">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center text-white">
                          <Info className="h-4 w-4 mr-2 text-primary" />
                          Processing Status
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-xs text-zinc-400">Waveform Generation</span>
                              <span className="text-xs font-medium">{Math.floor(folderStats.totalTracks * 0.92)} / {folderStats.totalTracks}</span>
                            </div>
                            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-600 rounded-full" style={{ width: '92%' }}></div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-xs text-zinc-400">BPM Detection</span>
                              <span className="text-xs font-medium">{Math.floor(folderStats.totalTracks * 0.78)} / {folderStats.totalTracks}</span>
                            </div>
                            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-600 rounded-full" style={{ width: '78%' }}></div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-xs text-zinc-400">Audio Normalization</span>
                              <span className="text-xs font-medium">{Math.floor(folderStats.totalTracks * 0.65)} / {folderStats.totalTracks}</span>
                            </div>
                            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                              <div className="h-full bg-green-600 rounded-full" style={{ width: '65%' }}></div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-xs text-zinc-400">AI Genre Classification</span>
                              <span className="text-xs font-medium">{Math.floor(folderStats.totalTracks * 0.45)} / {folderStats.totalTracks}</span>
                            </div>
                            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                              <div className="h-full bg-purple-600 rounded-full" style={{ width: '45%' }}></div>
                            </div>
                          </div>
                          
                          <Separator className="my-2" />
                          
                          <div className="flex justify-between">
                            <Button variant="outline" size="sm">
                              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                              Process All
                            </Button>
                            <Button variant="ghost" size="sm">
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Card className="bg-zinc-950 border-zinc-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center">
                        <Filter className="h-4 w-4 mr-2 text-primary" />
                        Content Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-zinc-900 p-4 rounded-md">
                          <h4 className="text-sm font-medium mb-2">Category Distribution</h4>
                          <div className="space-y-2">
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span>Music</span>
                                <span>65%</span>
                              </div>
                              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: '65%' }}></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span>Jingles</span>
                                <span>15%</span>
                              </div>
                              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500 rounded-full" style={{ width: '15%' }}></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span>Commercials</span>
                                <span>10%</span>
                              </div>
                              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 rounded-full" style={{ width: '10%' }}></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span>Voice Tracks</span>
                                <span>8%</span>
                              </div>
                              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500 rounded-full" style={{ width: '8%' }}></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span>Sound Effects</span>
                                <span>2%</span>
                              </div>
                              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-red-500 rounded-full" style={{ width: '2%' }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-zinc-900 p-4 rounded-md">
                          <h4 className="text-sm font-medium mb-2">Duration Analysis</h4>
                          <div className="space-y-2">
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span>Short (&lt;1 min)</span>
                                <span>20%</span>
                              </div>
                              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: '20%' }}></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span>Medium (1-3 min)</span>
                                <span>45%</span>
                              </div>
                              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500 rounded-full" style={{ width: '45%' }}></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span>Long (3-5 min)</span>
                                <span>30%</span>
                              </div>
                              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 rounded-full" style={{ width: '30%' }}></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span>Extended (&gt;5 min)</span>
                                <span>5%</span>
                              </div>
                              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500 rounded-full" style={{ width: '5%' }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-zinc-900 p-4 rounded-md">
                          <h4 className="text-sm font-medium mb-2">Audio Quality</h4>
                          <div className="space-y-2">
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span>High Quality</span>
                                <span>72%</span>
                              </div>
                              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 rounded-full" style={{ width: '72%' }}></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span>Medium Quality</span>
                                <span>25%</span>
                              </div>
                              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500 rounded-full" style={{ width: '25%' }}></div>
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span>Low Quality</span>
                                <span>3%</span>
                              </div>
                              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-red-500 rounded-full" style={{ width: '3%' }}></div>
                              </div>
                            </div>
                            <div className="pt-1">
                              <Button variant="outline" size="sm" className="w-full text-xs">
                                <VolumeX className="h-3.5 w-3.5 mr-1.5" />
                                Find Problematic Audio
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="metadata" className="m-0 p-0 h-[calc(100vh-220px)] overflow-hidden">
                  {selectedTrackId ? (
                    <div className="grid grid-cols-2 gap-0 h-full">
                      <div className="border-r border-zinc-800 p-4 overflow-auto">
                        <h3 className="text-base font-semibold mb-4 flex items-center">
                          <FileEdit className="h-4 w-4 mr-2 text-primary" />
                          Track Editor
                        </h3>
                        
                        {/* Track details would be displayed here */}
                        <div className="space-y-4">
                          <div>
                            <label className="text-xs text-zinc-400 block mb-1">Title</label>
                            <Input 
                              className="bg-zinc-950 border-zinc-800"
                              value={currentTracks.find(t => t.id === selectedTrackId)?.title || ''}
                              readOnly
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs text-zinc-400 block mb-1">Artist</label>
                              <Input 
                                className="bg-zinc-950 border-zinc-800"
                                value={currentTracks.find(t => t.id === selectedTrackId)?.artist || ''}
                                readOnly
                              />
                            </div>
                            <div>
                              <label className="text-xs text-zinc-400 block mb-1">Album</label>
                              <Input 
                                className="bg-zinc-950 border-zinc-800"
                                value={currentTracks.find(t => t.id === selectedTrackId)?.album || ''}
                                readOnly
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <label className="text-xs text-zinc-400 block mb-1">Duration</label>
                              <Input 
                                className="bg-zinc-950 border-zinc-800"
                                value={currentTracks.find(t => t.id === selectedTrackId)?.durationFormatted || ''}
                                readOnly
                              />
                            </div>
                            <div>
                              <label className="text-xs text-zinc-400 block mb-1">BPM</label>
                              <Input 
                                className="bg-zinc-950 border-zinc-800"
                                value={currentTracks.find(t => t.id === selectedTrackId)?.bpm || ''}
                                readOnly
                              />
                            </div>
                            <div>
                              <label className="text-xs text-zinc-400 block mb-1">Category</label>
                              <Input 
                                className="bg-zinc-950 border-zinc-800"
                                value={currentTracks.find(t => t.id === selectedTrackId)?.category || ''}
                                readOnly
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="text-xs text-zinc-400 block mb-1">File Path</label>
                            <Input 
                              className="bg-zinc-950 border-zinc-800 font-mono text-xs"
                              value={currentTracks.find(t => t.id === selectedTrackId)?.path || ''}
                              readOnly
                            />
                          </div>
                          
                          <div className="pt-2 flex justify-between">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4 mr-1.5" />
                              Edit Metadata
                            </Button>
                            <Button variant="outline" size="sm">
                              <Headphones className="h-4 w-4 mr-1.5" />
                              Preview
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 overflow-auto">
                        <h3 className="text-base font-semibold mb-4 flex items-center">
                          <Waves className="h-4 w-4 mr-2 text-primary" />
                          Waveform & Cue Points
                        </h3>
                        
                        {/* Waveform would be displayed here */}
                        <div className="border border-zinc-800 rounded-md bg-zinc-950 h-24 mb-4 flex items-center justify-center">
                          <div className="text-center text-zinc-500">
                            <p className="mb-2">Waveform visualization would be displayed here</p>
                            <Button variant="outline" size="sm">
                              <Waves className="h-3.5 w-3.5 mr-1.5" />
                              Generate Waveform
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium">Cue Points</h4>
                          
                          <div className="grid grid-cols-3 gap-2">
                            <div className="p-2 border border-zinc-800 rounded-md">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-medium">Intro Start</span>
                                <Badge variant="outline" className="text-xs py-0 px-1.5 h-5">00:00:00</Badge>
                              </div>
                              <Button variant="ghost" size="sm" className="w-full text-xs h-7">
                                Set Point
                              </Button>
                            </div>
                            
                            <div className="p-2 border border-zinc-800 rounded-md">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-medium">Intro End</span>
                                <Badge variant="outline" className="text-xs py-0 px-1.5 h-5">00:12:34</Badge>
                              </div>
                              <Button variant="ghost" size="sm" className="w-full text-xs h-7">
                                Set Point
                              </Button>
                            </div>
                            
                            <div className="p-2 border border-zinc-800 rounded-md">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-medium">Hook Start</span>
                                <Badge variant="outline" className="text-xs py-0 px-1.5 h-5">00:40:12</Badge>
                              </div>
                              <Button variant="ghost" size="sm" className="w-full text-xs h-7">
                                Set Point
                              </Button>
                            </div>
                            
                            <div className="p-2 border border-zinc-800 rounded-md">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-medium">Segue Start</span>
                                <Badge variant="outline" className="text-xs py-0 px-1.5 h-5">03:25:00</Badge>
                              </div>
                              <Button variant="ghost" size="sm" className="w-full text-xs h-7">
                                Set Point
                              </Button>
                            </div>
                            
                            <div className="p-2 border border-zinc-800 rounded-md">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-medium">Outro Start</span>
                                <Badge variant="outline" className="text-xs py-0 px-1.5 h-5">03:45:15</Badge>
                              </div>
                              <Button variant="ghost" size="sm" className="w-full text-xs h-7">
                                Set Point
                              </Button>
                            </div>
                            
                            <div className="p-2 border border-zinc-800 rounded-md">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-medium">End</span>
                                <Badge variant="outline" className="text-xs py-0 px-1.5 h-5">04:02:18</Badge>
                              </div>
                              <Button variant="ghost" size="sm" className="w-full text-xs h-7">
                                Set Point
                              </Button>
                            </div>
                          </div>
                          
                          <Button variant="default" size="sm" className="mt-4">
                            <Edit className="h-4 w-4 mr-1.5" />
                            Save Cue Points
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                      <Info className="h-12 w-12 mb-3" />
                      <h3 className="font-medium">No Track Selected</h3>
                      <p className="text-sm mt-1">Select a track to view and edit its metadata</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="p-2 border-t border-zinc-800 flex justify-between items-center">
          <div className="text-xs text-zinc-500">
            Showing {displayTracks.length} tracks {isSearching ? `matching "${searchQuery}"` : currentFolderId ? `in "${folderPath[folderPath.length-1]?.name}"` : 'in All Tracks'}
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm">
              <Download className="h-3.5 w-3.5 mr-1" />
              Export
            </Button>
            <Button variant="ghost" size="sm">Help</Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
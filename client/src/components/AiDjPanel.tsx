import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useRadioAutomation } from "@/contexts/RadioAutomationContext";
import { useAiDj } from "@/contexts/AiDjContext";
import { AiDjSettingsDialog } from "@/components/AiDjSettingsDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AudioTrack, MediaFolder } from "@shared/schema";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  AlertCircle, 
  Disc, 
  Edit, 
  ListMusic, 
  Loader2, 
  Megaphone, 
  MoreVertical, 
  Music, 
  Music2, 
  Play, 
  Plus, 
  Radio, 
  Save, 
  Settings, 
  Tag, 
  Trash, 
  Wand2 
} from "lucide-react";

interface AiDjPanelProps {
  studioId?: "A" | "B";
  tracks: AudioTrack[];
  folders: MediaFolder[];
}

const panelIcons = {
  "A": {
    className: "text-amber-500",
    color: "#D27D2D",
  },
  "B": {
    className: "text-emerald-500",
    color: "#2D8D27",
  },
  "default": {
    className: "text-blue-500",
    color: "#0098DB",
  }
};

export function AiDjPanel({ studioId = "A", tracks, folders }: AiDjPanelProps) {
  const [selectedSettingId, setSelectedSettingId] = useState<number | null>(null);
  const [selectedTrackIds, setSelectedTrackIds] = useState<number[]>([]);
  const [playlistName, setPlaylistName] = useState<string>("");
  const [isShowingAnalyzeDialog, setIsShowingAnalyzeDialog] = useState(false);
  const { toast } = useToast();
  const { 
    settings,
    activeSetting,
    isLoadingSettings,
    createSettingMutation,
    updateSettingMutation,
    deleteSettingMutation,
    activateSettingMutation,
    
    analyzedTracks,
    isAnalyzing,
    analyzeTrackMutation,
    batchAnalyzeMutation,
    
    generatedPlaylists,
    isGeneratingPlaylist,
    generatePlaylistMutation,
    activatePlaylistMutation,
    
    setSelectedStudio
  } = useAiDj();
  
  const { playlists } = useRadioAutomation();
  
  // Filter settings and playlists by studio
  const studioSettings = settings?.filter(s => s.studioId === studioId) || [];
  const studioPlaylists = generatedPlaylists?.filter(p => p.studioId === studioId) || [];
  const iconConfig = studioId ? panelIcons[studioId] : panelIcons.default;
  
  // Make sure selected studio is set correctly
  React.useEffect(() => {
    if (studioId) {
      setSelectedStudio(studioId);
    }
  }, [studioId, setSelectedStudio]);
  
  // Handle generating a new playlist
  const handleGeneratePlaylist = () => {
    if (!selectedSettingId) {
      toast({
        title: "No Setting Selected",
        description: "Please select an AI DJ setting first.",
        variant: "destructive",
      });
      return;
    }
    
    generatePlaylistMutation.mutate({
      settingId: selectedSettingId,
      name: playlistName || undefined,
    });
  };
  
  // Handle track analysis
  const handleAnalyzeTracks = () => {
    if (selectedTrackIds.length === 0) {
      toast({
        title: "No Tracks Selected",
        description: "Please select at least one track to analyze.",
        variant: "destructive",
      });
      return;
    }
    
    batchAnalyzeMutation.mutate(selectedTrackIds);
    setIsShowingAnalyzeDialog(false);
    setSelectedTrackIds([]);
  };
  
  // Count analyzed tracks
  const analyzedTrackCount = Object.keys(analyzedTracks).length;
  const totalTracks = tracks.length;
  const analyzedPercentage = totalTracks > 0 ? Math.round((analyzedTrackCount / totalTracks) * 100) : 0;
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Radio className={`h-5 w-5 ${iconConfig.className}`} />
            <CardTitle>AI DJ Studio {studioId}</CardTitle>
          </div>
          <AiDjSettingsDialog folders={folders} onSuccess={() => setSelectedSettingId(null)}>
            <Button variant="outline" size="sm" className="h-8 gap-1">
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New Setting</span>
            </Button>
          </AiDjSettingsDialog>
        </div>
        <CardDescription>
          Intelligent playlists powered by AI
        </CardDescription>
      </CardHeader>
      
      <Tabs defaultValue="settings" className="flex flex-col h-[calc(100%-5rem)]">
        <div className="px-6 pb-0">
          <TabsListWrapper>
            <TabsListInner>
              <TabsTrigger value="settings" className="flex items-center gap-1.5">
                <Settings className="h-4 w-4" />
                AI Settings
              </TabsTrigger>
              <TabsTrigger value="playlists" className="flex items-center gap-1.5">
                <ListMusic className="h-4 w-4" />
                AI Playlists
              </TabsTrigger>
              <TabsTrigger value="analysis" className="flex items-center gap-1.5">
                <Tag className="h-4 w-4" />
                Track Analysis
              </TabsTrigger>
            </TabsListInner>
          </TabsListWrapper>
        </div>
        
        <CardContent className="flex-1 overflow-hidden pb-0 pt-1">
          <TabsContent value="settings" className="h-full">
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full pr-4">
                  {isLoadingSettings ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : studioSettings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
                      <Wand2 className="h-12 w-12 text-muted-foreground" />
                      <div>
                        <h3 className="text-lg font-semibold">No AI DJ Settings Yet</h3>
                        <p className="text-sm text-muted-foreground max-w-md mt-1">
                          Create AI DJ settings to define how your playlists should be generated with specific moods, genres, and station elements.
                        </p>
                      </div>
                      <AiDjSettingsDialog folders={folders}>
                        <Button className="mt-2">
                          <Plus className="h-4 w-4 mr-2" />
                          Create First Setting
                        </Button>
                      </AiDjSettingsDialog>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {studioSettings.map((setting) => (
                        <SettingCard 
                          key={setting.id} 
                          setting={setting}
                          isActive={setting.isActive}
                          isSelected={selectedSettingId === setting.id}
                          onDelete={() => deleteSettingMutation.mutate(setting.id)}
                          onActivate={(active) => activateSettingMutation.mutate({ id: setting.id, activate: active })}
                          onSelect={() => setSelectedSettingId(prev => prev === setting.id ? null : setting.id)}
                          folders={folders}
                        />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
              
              {selectedSettingId && (
                <div className="pt-4 mt-3 border-t">
                  <div className="flex flex-col sm:flex-row gap-3 mb-3">
                    <div className="flex-1">
                      <Label htmlFor="playlist-name">Playlist Name (Optional)</Label>
                      <Input 
                        id="playlist-name"
                        placeholder="My AI Playlist"
                        value={playlistName}
                        onChange={(e) => setPlaylistName(e.target.value)}
                      />
                    </div>
                    <Button
                      className="sm:self-end gap-2 min-w-32"
                      onClick={handleGeneratePlaylist}
                      disabled={isGeneratingPlaylist || !selectedSettingId}
                    >
                      {isGeneratingPlaylist && <Loader2 className="h-4 w-4 animate-spin" />}
                      <Wand2 className="h-4 w-4" />
                      Generate Playlist
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="playlists" className="h-full">
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full pr-4">
                  {studioPlaylists.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
                      <Music2 className="h-12 w-12 text-muted-foreground" />
                      <div>
                        <h3 className="text-lg font-semibold">No AI Generated Playlists Yet</h3>
                        <p className="text-sm text-muted-foreground max-w-md mt-1">
                          Select an AI DJ setting and generate a playlist to get started.
                        </p>
                      </div>
                      {studioSettings.length > 0 ? (
                        <Button 
                          onClick={() => {
                            if (studioSettings.length > 0) {
                              setSelectedSettingId(studioSettings[0].id);
                            }
                          }}
                          className="mt-2"
                        >
                          <Wand2 className="h-4 w-4 mr-2" />
                          Generate First Playlist
                        </Button>
                      ) : (
                        <AiDjSettingsDialog folders={folders}>
                          <Button className="mt-2">
                            <Settings className="h-4 w-4 mr-2" />
                            Create AI Setting First
                          </Button>
                        </AiDjSettingsDialog>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {studioPlaylists.map((aiPlaylist) => {
                        const playlist = playlists?.find(p => p.id === aiPlaylist.playlistId);
                        const setting = settings?.find(s => s.id === aiPlaylist.settingsId);
                        
                        return (
                          <PlaylistCard 
                            key={aiPlaylist.id} 
                            generatedPlaylist={aiPlaylist}
                            playlist={playlist}
                            setting={setting}
                            isActive={aiPlaylist.isActive}
                            onActivate={(active) => activatePlaylistMutation.mutate({ id: aiPlaylist.id, activate: active })}
                          />
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="analysis" className="h-full">
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full pr-4">
                  <div className="space-y-4">
                    <div className="rounded-lg border bg-card p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-medium">Track Analysis Status</h3>
                        <Badge variant="outline" className="text-xs">
                          {analyzedTrackCount} / {totalTracks} tracks
                        </Badge>
                      </div>
                      
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-500 ease-in-out" 
                          style={{ width: `${analyzedPercentage}%` }}
                        ></div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mt-2">
                        {analyzedPercentage}% of your tracks have been analyzed by AI
                      </p>
                      
                      <div className="mt-4">
                        <Dialog open={isShowingAnalyzeDialog} onOpenChange={setIsShowingAnalyzeDialog}>
                          <DialogTrigger asChild>
                            <Button className="w-full gap-2" variant="secondary">
                              <Tag className="h-4 w-4" />
                              Analyze More Tracks
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle>Analyze Tracks with AI</DialogTitle>
                              <DialogDescription>
                                Select tracks to analyze for their musical characteristics, mood, and style
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="py-4">
                              <h4 className="mb-2 text-sm font-medium">Select tracks to analyze</h4>
                              <div className="rounded-md border h-64 overflow-y-auto p-2">
                                <div className="space-y-1">
                                  {tracks.map((track) => {
                                    const isAnalyzed = Boolean(analyzedTracks[track.id]);
                                    return (
                                      <div 
                                        key={track.id}
                                        className={`flex items-center justify-between rounded-md px-3 py-2 text-sm 
                                          ${isAnalyzed ? 'bg-muted' : 
                                            selectedTrackIds.includes(track.id) ? 'bg-accent' : 'hover:bg-accent/50'}`}
                                        onClick={() => {
                                          if (!isAnalyzed) {
                                            setSelectedTrackIds(prev => 
                                              prev.includes(track.id) 
                                                ? prev.filter(id => id !== track.id)
                                                : [...prev, track.id]
                                            );
                                          }
                                        }}
                                      >
                                        <div className="flex items-center gap-2">
                                          <Disc className="h-4 w-4 text-muted-foreground" />
                                          <span className={isAnalyzed ? 'text-muted-foreground' : ''}>
                                            {track.title}
                                          </span>
                                        </div>
                                        
                                        {isAnalyzed && (
                                          <Badge variant="outline" className="text-xs">
                                            Analyzed
                                          </Badge>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                              
                              <div className="mt-2 text-xs text-muted-foreground">
                                Selected: {selectedTrackIds.length} tracks
                              </div>
                            </div>
                            
                            <DialogFooter>
                              <Button 
                                type="submit"
                                onClick={handleAnalyzeTracks}
                                disabled={isAnalyzing || selectedTrackIds.length === 0}
                                className="gap-2"
                              >
                                {isAnalyzing && <Loader2 className="h-4 w-4 animate-spin" />}
                                <Tag className="h-4 w-4" />
                                Analyze {selectedTrackIds.length} Tracks
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium">Recently Analyzed Tracks</h3>
                      
                      {Object.keys(analyzedTracks).length === 0 ? (
                        <div className="rounded-lg border bg-card p-6 text-center">
                          <Music className="mx-auto h-8 w-8 text-muted-foreground" />
                          <h3 className="mt-3 text-sm font-medium">No Analyzed Tracks</h3>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Analyze tracks to see their musical properties and AI-detected characteristics
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {Object.values(analyzedTracks)
                            .sort((a, b) => new Date(b.analysisDate).getTime() - new Date(a.analysisDate).getTime())
                            .slice(0, 5)
                            .map((analysis) => {
                              const track = tracks.find(t => t.id === analysis.trackId);
                              
                              return (
                                <div key={analysis.trackId} className="rounded-lg border bg-card p-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Music className="h-4 w-4 text-muted-foreground" />
                                    <h4 className="text-sm font-medium">{track?.title || 'Unknown Track'}</h4>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                      <span className="text-muted-foreground">Mood: </span>
                                      <span>{analysis.moodTags?.join(', ') || 'Unknown'}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Genre: </span>
                                      <span>{analysis.genreTags?.join(', ') || 'Unknown'}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Tempo: </span>
                                      <span>{analysis.tempo || 'Unknown'} BPM</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Energy: </span>
                                      <span>{analysis.energy ? `${Math.round(Number(analysis.energy) * 100)}%` : 'Unknown'}</span>
                                    </div>
                                  </div>
                                  
                                  <Separator className="my-2" />
                                  
                                  <div className="text-xs text-muted-foreground italic">
                                    {analysis.aiDescription?.substring(0, 100)}
                                    {analysis.aiDescription && analysis.aiDescription.length > 100 ? '...' : ''}
                                  </div>
                                </div>
                              );
                            })
                          }
                        </div>
                      )}
                    </div>
                  </div>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}

// Helper component for tabs styling
function TabsListWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-auto pb-1 mb-1">
      {children}
    </div>
  );
}

function TabsListInner({ children }: { children: React.ReactNode }) {
  return (
    <TabsListWrapper>
      <TabsListInnerScroller>{children}</TabsListInnerScroller>
    </TabsListWrapper>
  );
}

function TabsListInnerScroller({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-auto">
      <TabsList className="w-max">{children}</TabsList>
    </div>
  );
}

// Setting Card Component
interface SettingCardProps {
  setting: any;
  isActive: boolean;
  isSelected: boolean;
  onDelete: () => void;
  onActivate: (active: boolean) => void;
  onSelect: () => void;
  folders: MediaFolder[];
}

function SettingCard({ setting, isActive, isSelected, onDelete, onActivate, onSelect, folders }: SettingCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  return (
    <div 
      className={`border rounded-lg p-3 bg-card cursor-pointer transition 
        ${isSelected ? 'ring-2 ring-primary ring-offset-2' : 'hover:bg-accent/50'}
        ${isActive ? 'border-primary/50' : ''}`}
      onClick={onSelect}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-sm">{setting.name}</h3>
            {isActive && (
              <Badge variant="default" className="text-[10px] h-5 px-1 rounded-sm">Active</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {setting.durationHours}h duration • Studio {setting.studioId}
          </p>
        </div>
        
        <div className="flex gap-1">
          <AiDjSettingsDialog setting={setting} folders={folders}>
            <Button size="icon" variant="ghost" className="h-7 w-7">
              <Edit className="h-3.5 w-3.5" />
            </Button>
          </AiDjSettingsDialog>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-7 w-7">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onActivate(!isActive);
              }}>
                {isActive ? 'Deactivate' : 'Activate'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                setShowDeleteDialog(true);
              }}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete AI DJ Setting</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{setting.name}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel 
                  onClick={(e) => e.stopPropagation()}
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction 
                  className="bg-destructive hover:bg-destructive/90"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                    setShowDeleteDialog(false);
                  }}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3">
        <div className="flex items-center gap-1.5">
          <Settings className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs">
            {setting.mood || "Any mood"}
          </span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <Music className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs">
            {setting.genre || "Any genre"}
          </span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <Disc className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs">
            {setting.tempo || "Any tempo"}
          </span>
        </div>
        
        <div className="flex items-center gap-1.5">
          <Radio className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs">
            {setting.jingleFrequency > 0 ? `Jingle every ${setting.jingleFrequency}` : "No jingles"}
          </span>
        </div>
      </div>
      
      {setting.sourceFolderIds && setting.sourceFolderIds.length > 0 && (
        <>
          <Separator className="my-2" />
          <div className="flex flex-wrap gap-1 mt-2">
            {setting.sourceFolderIds.map((id: number) => {
              const folder = folders.find(f => f.id === id);
              return folder ? (
                <Badge key={id} variant="outline" className="text-xs">
                  {folder.name}
                </Badge>
              ) : null;
            })}
          </div>
        </>
      )}
    </div>
  );
}

// Playlist Card Component
interface PlaylistCardProps {
  generatedPlaylist: any;
  playlist: any;
  setting: any;
  isActive: boolean;
  onActivate: (active: boolean) => void;
}

function PlaylistCard({ generatedPlaylist, playlist, setting, isActive, onActivate }: PlaylistCardProps) {
  const [showActivateDialog, setShowActivateDialog] = useState(false);
  
  if (!playlist) return null;
  
  return (
    <div className={`border rounded-lg p-3 bg-card ${isActive ? 'border-primary/50' : ''}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-sm">{playlist.name}</h3>
            {isActive && (
              <Badge variant="default" className="text-[10px] h-5 px-1 rounded-sm">Active</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Generated on {new Date(generatedPlaylist.generatedAt).toLocaleDateString()}
          </p>
        </div>
        
        <div className="flex gap-1">
          <Button 
            size="sm" 
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={() => setShowActivateDialog(true)}
          >
            {isActive ? (
              <>
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Deactivate</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                <span>Activate</span>
              </>
            )}
          </Button>
          
          <AlertDialog open={showActivateDialog} onOpenChange={setShowActivateDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {isActive ? "Deactivate" : "Activate"} AI Playlist
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {isActive 
                    ? `Are you sure you want to deactivate "${playlist.name}"?`
                    : `Are you sure you want to activate "${playlist.name}"? This will deactivate any other active playlists for Studio ${generatedPlaylist.studioId}.`
                  }
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => {
                    onActivate(!isActive);
                    setShowActivateDialog(false);
                  }}
                >
                  {isActive ? "Deactivate" : "Activate"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      <div className="flex items-center gap-1.5 mt-1">
        <Megaphone className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs">
          Based on: {setting?.name || "Unknown setting"}
        </span>
      </div>
      
      {generatedPlaylist.aiReasoning && (
        <>
          <Separator className="my-2" />
          <div className="text-xs text-muted-foreground italic">
            {generatedPlaylist.aiReasoning.substring(0, 120)}
            {generatedPlaylist.aiReasoning.length > 120 ? '...' : ''}
          </div>
        </>
      )}
    </div>
  );
}
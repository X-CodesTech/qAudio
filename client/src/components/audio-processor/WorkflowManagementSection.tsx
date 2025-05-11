import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Settings,
  RotateCcw,
  RotateCw,
  Save,
  Share2,
  Download,
  Upload,
  FileText,
  Star,
  StarOff,
  Check,
  Clock,
  Search,
  Plus,
  Trash2,
  Clipboard,
  ArrowDownToLine,
  ArrowUpFromLine,
  Info,
  Edit,
  Copy,
  Lock,
  LucideIcon
} from 'lucide-react';

interface WorkflowManagementSectionProps {
  onSave?: () => void;
}

// Sample preset data for demonstration
interface Preset {
  id: string;
  name: string;
  description: string;
  category: string;
  isFactory: boolean;
  isFavorite: boolean;
  dateCreated: string;
  dateModified: string;
  createdBy?: string;
}

// Sample history entry for demonstration
interface HistoryEntry {
  id: string;
  timestamp: string;
  action: string;
  description: string;
  canRevert: boolean;
}

// Sample snapshot for demonstration
interface Snapshot {
  id: string;
  name: string;
  description: string;
  dateCreated: string;
  previewImage?: string;
}

const WorkflowManagementSection: React.FC<WorkflowManagementSectionProps> = ({ onSave }) => {
  // State for the active tab
  const [activeTab, setActiveTab] = useState<string>('presets');
  
  // State for presets
  const [presets, setPresets] = useState<Preset[]>([
    {
      id: 'preset1',
      name: 'Default Settings',
      description: 'Factory default settings with balanced processing',
      category: 'General',
      isFactory: true,
      isFavorite: true,
      dateCreated: '2025-01-15',
      dateModified: '2025-01-15'
    },
    {
      id: 'preset2',
      name: 'Rock Station',
      description: 'Optimized for rock music with aggressive processing',
      category: 'Music',
      isFactory: true,
      isFavorite: false,
      dateCreated: '2025-01-16',
      dateModified: '2025-01-16'
    },
    {
      id: 'preset3',
      name: 'Talk Radio',
      description: 'Optimized for speech clarity with minimal processing',
      category: 'Speech',
      isFactory: true,
      isFavorite: false,
      dateCreated: '2025-01-17',
      dateModified: '2025-01-17'
    },
    {
      id: 'preset4',
      name: 'My Custom Preset',
      description: 'Custom settings for evening broadcasts',
      category: 'Custom',
      isFactory: false,
      isFavorite: true,
      dateCreated: '2025-04-21',
      dateModified: '2025-04-25',
      createdBy: 'Admin'
    }
  ]);
  
  // State for history entries
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([
    {
      id: 'history1',
      timestamp: '2025-05-01 14:23:45',
      action: 'Changed Limiter Settings',
      description: 'Modified threshold from -2.0 dB to -1.5 dB',
      canRevert: true
    },
    {
      id: 'history2',
      timestamp: '2025-05-01 14:20:18',
      action: 'Applied Preset',
      description: 'Applied "Rock Station" preset',
      canRevert: true
    },
    {
      id: 'history3',
      timestamp: '2025-05-01 14:15:02',
      action: 'Changed EQ Settings',
      description: 'Boosted high frequencies by 2.5 dB',
      canRevert: true
    },
    {
      id: 'history4',
      timestamp: '2025-05-01 14:10:56',
      action: 'Changed Compressor Settings',
      description: 'Modified ratio from 4:1 to 5:1',
      canRevert: false
    },
    {
      id: 'history5',
      timestamp: '2025-05-01 14:05:20',
      action: 'Started New Session',
      description: 'Initialized with default settings',
      canRevert: false
    },
  ]);
  
  // State for snapshots
  const [snapshots, setSnapshots] = useState<Snapshot[]>([
    {
      id: 'snapshot1',
      name: 'Backup before weekend',
      description: 'Full system backup before making weekend adjustments',
      dateCreated: '2025-04-28 17:30:15'
    },
    {
      id: 'snapshot2',
      name: 'Special Event Settings',
      description: 'Configuration for annual charity broadcast',
      dateCreated: '2025-04-22 09:15:42'
    }
  ]);
  
  // State for new preset form
  const [newPresetName, setNewPresetName] = useState<string>('');
  const [newPresetDescription, setNewPresetDescription] = useState<string>('');
  const [newPresetCategory, setNewPresetCategory] = useState<string>('Custom');
  const [isNewPresetDialogOpen, setIsNewPresetDialogOpen] = useState<boolean>(false);
  
  // State for new snapshot form
  const [newSnapshotName, setNewSnapshotName] = useState<string>('');
  const [newSnapshotDescription, setNewSnapshotDescription] = useState<string>('');
  const [isNewSnapshotDialogOpen, setIsNewSnapshotDialogOpen] = useState<boolean>(false);
  
  // State for Import/Export dialog
  const [isImportExportDialogOpen, setIsImportExportDialogOpen] = useState<boolean>(false);
  const [exportCode, setExportCode] = useState<string>('');
  const [importCode, setImportCode] = useState<string>('');
  
  // Function to toggle favorite status
  const toggleFavorite = (presetId: string) => {
    setPresets(presets.map(preset => 
      preset.id === presetId 
        ? { ...preset, isFavorite: !preset.isFavorite } 
        : preset
    ));
  };
  
  // Function to create a new preset
  const createNewPreset = () => {
    if (newPresetName.trim() === '') return;
    
    const newPreset: Preset = {
      id: `preset${Date.now()}`,
      name: newPresetName,
      description: newPresetDescription,
      category: newPresetCategory,
      isFactory: false,
      isFavorite: false,
      dateCreated: new Date().toISOString().split('T')[0],
      dateModified: new Date().toISOString().split('T')[0],
      createdBy: 'Admin'
    };
    
    setPresets([...presets, newPreset]);
    setNewPresetName('');
    setNewPresetDescription('');
    setNewPresetCategory('Custom');
    setIsNewPresetDialogOpen(false);
  };
  
  // Function to delete a preset
  const deletePreset = (presetId: string) => {
    setPresets(presets.filter(preset => preset.id !== presetId));
  };
  
  // Function to create a new snapshot
  const createNewSnapshot = () => {
    if (newSnapshotName.trim() === '') return;
    
    const newSnapshot: Snapshot = {
      id: `snapshot${Date.now()}`,
      name: newSnapshotName,
      description: newSnapshotDescription,
      dateCreated: new Date().toLocaleString()
    };
    
    setSnapshots([newSnapshot, ...snapshots]);
    setNewSnapshotName('');
    setNewSnapshotDescription('');
    setIsNewSnapshotDialogOpen(false);
  };
  
  // Function to delete a snapshot
  const deleteSnapshot = (snapshotId: string) => {
    setSnapshots(snapshots.filter(snapshot => snapshot.id !== snapshotId));
  };
  
  // Function to revert to a history entry
  const revertToHistoryEntry = (entryId: string) => {
    // In a real app, this would apply the stored state
    console.log(`Reverting to history entry ${entryId}`);
    
    // Update history to show this reversion
    const newHistoryEntry: HistoryEntry = {
      id: `history${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      action: 'Reverted Changes',
      description: `Reverted to previous state (${historyEntries.find(e => e.id === entryId)?.action})`,
      canRevert: true
    };
    
    setHistoryEntries([newHistoryEntry, ...historyEntries]);
  };
  
  // Function to clear history
  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear the entire history? This cannot be undone.')) {
      setHistoryEntries([]);
    }
  };
  
  // Function to generate export code
  const generateExportCode = () => {
    // In a real app, this would serialize the current state
    const dummyExport = {
      type: 'AudioProcessorExport',
      version: '1.0',
      timestamp: new Date().toISOString(),
      settings: {
        // Simplified example of settings that would be exported
        inputGain: 0,
        equalizerBands: [
          { frequency: 100, gain: 0 },
          { frequency: 300, gain: 0 },
          { frequency: 1000, gain: 0 },
          { frequency: 3000, gain: 0 },
          { frequency: 10000, gain: 0 }
        ],
        compressor: {
          threshold: -18,
          ratio: 4,
          attack: 5,
          release: 50
        },
        limiter: {
          threshold: -1.5,
          release: 50
        }
      }
    };
    
    // Create a JSON string and encode it to make it more compact
    const jsonString = JSON.stringify(dummyExport);
    // In a real app, might use Base64 or other encoding
    setExportCode(jsonString);
    setIsImportExportDialogOpen(true);
  };
  
  // Function to import settings from code
  const importFromCode = () => {
    try {
      // In a real app, would decode and validate the import data
      const importData = JSON.parse(importCode);
      
      if (importData.type !== 'AudioProcessorExport') {
        throw new Error('Invalid import data format');
      }
      
      // Would apply the imported settings to the actual audio processor
      console.log('Imported settings:', importData);
      
      // Add to history
      const newHistoryEntry: HistoryEntry = {
        id: `history${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        action: 'Imported Settings',
        description: `Imported settings from external source`,
        canRevert: true
      };
      
      setHistoryEntries([newHistoryEntry, ...historyEntries]);
      setImportCode('');
      setIsImportExportDialogOpen(false);
      
      // Show success message
      window.alert('Settings imported successfully!');
    } catch (error: any) {
      alert(`Import failed: ${error.message}`);
    }
  };
  
  // Function to restore a snapshot
  const restoreSnapshot = (snapshotId: string) => {
    // In a real app, this would apply the stored snapshot state
    console.log(`Restoring snapshot ${snapshotId}`);
    
    // Add to history
    const snapshot = snapshots.find(s => s.id === snapshotId);
    const newHistoryEntry: HistoryEntry = {
      id: `history${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      action: 'Restored Snapshot',
      description: `Restored snapshot "${snapshot?.name}"`,
      canRevert: true
    };
    
    setHistoryEntries([newHistoryEntry, ...historyEntries]);
  };
  
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-blue-500 flex items-center">
          <Settings className="h-5 w-5 mr-2" />
          Workflow Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="presets">
              <FileText className="h-4 w-4 mr-2" />
              Presets
            </TabsTrigger>
            <TabsTrigger value="history">
              <Clock className="h-4 w-4 mr-2" />
              History
            </TabsTrigger>
            <TabsTrigger value="snapshots">
              <Save className="h-4 w-4 mr-2" />
              Snapshots
            </TabsTrigger>
            <TabsTrigger value="sharing">
              <Share2 className="h-4 w-4 mr-2" />
              Import/Export
            </TabsTrigger>
          </TabsList>
          
          {/* Presets Tab */}
          <TabsContent value="presets" className="space-y-4">
            <div className="flex justify-between">
              <div className="space-x-2">
                <Button variant="outline" onClick={() => setIsNewPresetDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Preset
                </Button>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search presets..."
                  className="pl-8 bg-gray-950 border-gray-800"
                />
              </div>
            </div>
            
            <ScrollArea className="h-[550px] pr-4">
              <div className="space-y-3">
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    className="p-3 bg-gray-950 border border-gray-800 rounded-md hover:border-gray-700 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center">
                          <h3 className="font-medium text-gray-200">{preset.name}</h3>
                          <Badge variant={preset.isFactory ? "secondary" : "outline"} className="ml-2">
                            {preset.isFactory ? "Factory" : "Custom"}
                          </Badge>
                          {preset.category && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {preset.category}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mt-1">{preset.description}</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => toggleFavorite(preset.id)}
                        >
                          {preset.isFavorite ? (
                            <Star className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <StarOff className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                        {!preset.isFactory && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-500"
                            onClick={() => deletePreset(preset.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <div className="text-xs text-gray-500">
                        {preset.dateModified && preset.dateModified !== preset.dateCreated ? (
                          <>Modified: {preset.dateModified}</>
                        ) : (
                          <>Created: {preset.dateCreated}</>
                        )}
                        {preset.createdBy && <> by {preset.createdBy}</>}
                      </div>
                      <div className="flex space-x-1">
                        <Button size="sm" variant="outline" className="h-8">
                          <Check className="h-4 w-4 mr-1" />
                          Apply
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            {/* New Preset Dialog */}
            <Dialog open={isNewPresetDialogOpen} onOpenChange={setIsNewPresetDialogOpen}>
              <DialogContent className="bg-gray-900 border-gray-800">
                <DialogHeader>
                  <DialogTitle>Create New Preset</DialogTitle>
                  <DialogDescription>
                    Save current settings as a new preset
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="preset-name">Preset Name</Label>
                    <Input
                      id="preset-name"
                      value={newPresetName}
                      onChange={(e) => setNewPresetName(e.target.value)}
                      placeholder="My Custom Preset"
                      className="bg-gray-950 border-gray-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preset-description">Description</Label>
                    <Textarea
                      id="preset-description"
                      value={newPresetDescription}
                      onChange={(e) => setNewPresetDescription(e.target.value)}
                      placeholder="Describe your preset..."
                      className="bg-gray-950 border-gray-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preset-category">Category</Label>
                    <Input
                      id="preset-category"
                      value={newPresetCategory}
                      onChange={(e) => setNewPresetCategory(e.target.value)}
                      placeholder="Custom"
                      className="bg-gray-950 border-gray-800"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsNewPresetDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createNewPreset}>
                    Create Preset
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
          
          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <div className="flex justify-between">
              <div className="flex items-center">
                <h3 className="text-sm font-medium text-gray-300">Undo/Redo History</h3>
                <div className="ml-4 flex space-x-2">
                  <Button variant="outline" size="sm" disabled={historyEntries.length === 0}>
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Undo
                  </Button>
                  <Button variant="outline" size="sm" disabled={historyEntries.length === 0}>
                    <RotateCw className="h-4 w-4 mr-1" />
                    Redo
                  </Button>
                </div>
              </div>
              {historyEntries.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-red-500"
                  onClick={clearHistory}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear History
                </Button>
              )}
            </div>
            
            <ScrollArea className="h-[550px]">
              {historyEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40">
                  <Clock className="h-10 w-10 text-gray-700 mb-2" />
                  <p className="text-gray-500">No history entries yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Time</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Revert</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyEntries.map((entry) => (
                      <TableRow key={entry.id} className="border-gray-800 hover:bg-gray-850">
                        <TableCell className="text-xs text-gray-400">{entry.timestamp}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">
                            {entry.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{entry.description}</TableCell>
                        <TableCell className="text-right">
                          {entry.canRevert ? (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => revertToHistoryEntry(entry.id)}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" disabled>
                              <Lock className="h-4 w-4 text-gray-600" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </TabsContent>
          
          {/* Snapshots Tab */}
          <TabsContent value="snapshots" className="space-y-4">
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setIsNewSnapshotDialogOpen(true)}>
                <Save className="h-4 w-4 mr-2" />
                Create Snapshot
              </Button>
              <div className="text-sm text-gray-400">
                Snapshots capture the entire state of all audio processor settings
              </div>
            </div>
            
            <ScrollArea className="h-[550px]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {snapshots.map((snapshot) => (
                  <div
                    key={snapshot.id}
                    className="p-4 bg-gray-950 border border-gray-800 rounded-md hover:border-gray-700 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-200">{snapshot.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">Created: {snapshot.dateCreated}</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-500"
                          onClick={() => deleteSnapshot(snapshot.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-400 mt-3">{snapshot.description}</p>
                    
                    <div className="mt-4 h-20 bg-gray-850 rounded flex items-center justify-center">
                      <Info className="h-6 w-6 text-gray-600" />
                      <span className="text-xs text-gray-500 ml-2">Snapshot preview</span>
                    </div>
                    
                    <div className="flex justify-end mt-3">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8"
                        onClick={() => restoreSnapshot(snapshot.id)}
                      >
                        <ArrowDownToLine className="h-4 w-4 mr-1" />
                        Restore
                      </Button>
                    </div>
                  </div>
                ))}
                
                {snapshots.length === 0 && (
                  <div className="col-span-2 flex flex-col items-center justify-center h-40">
                    <Save className="h-10 w-10 text-gray-700 mb-2" />
                    <p className="text-gray-500">No snapshots saved yet</p>
                  </div>
                )}
              </div>
            </ScrollArea>
            
            {/* New Snapshot Dialog */}
            <Dialog open={isNewSnapshotDialogOpen} onOpenChange={setIsNewSnapshotDialogOpen}>
              <DialogContent className="bg-gray-900 border-gray-800">
                <DialogHeader>
                  <DialogTitle>Create New Snapshot</DialogTitle>
                  <DialogDescription>
                    Save the current state of all audio processor settings
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="snapshot-name">Snapshot Name</Label>
                    <Input
                      id="snapshot-name"
                      value={newSnapshotName}
                      onChange={(e) => setNewSnapshotName(e.target.value)}
                      placeholder="My Snapshot"
                      className="bg-gray-950 border-gray-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="snapshot-description">Description (Optional)</Label>
                    <Textarea
                      id="snapshot-description"
                      value={newSnapshotDescription}
                      onChange={(e) => setNewSnapshotDescription(e.target.value)}
                      placeholder="Describe this snapshot..."
                      className="bg-gray-950 border-gray-800"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsNewSnapshotDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createNewSnapshot}>
                    Create Snapshot
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
          
          {/* Import/Export Tab */}
          <TabsContent value="sharing" className="space-y-4">
            <div className="p-4 bg-gray-950 border border-gray-800 rounded-md">
              <h3 className="text-lg font-medium text-gray-200 flex items-center mb-3">
                <Upload className="h-5 w-5 mr-2 text-blue-500" />
                Export Settings
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                Export your current processor settings to share with others or save for later use.
              </p>
              
              <div className="flex space-x-2">
                <Button variant="outline" onClick={generateExportCode}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Generate Export Code
                </Button>
                <Button variant="outline" disabled>
                  <Download className="h-4 w-4 mr-2" />
                  Download as File
                </Button>
              </div>
            </div>
            
            <div className="p-4 bg-gray-950 border border-gray-800 rounded-md">
              <h3 className="text-lg font-medium text-gray-200 flex items-center mb-3">
                <Download className="h-5 w-5 mr-2 text-green-500" />
                Import Settings
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                Import settings from an export code or file.
              </p>
              
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsImportExportDialogOpen(true)}
                >
                  <ArrowUpFromLine className="h-4 w-4 mr-2" />
                  Import from Code
                </Button>
                <Button variant="outline" disabled>
                  <Upload className="h-4 w-4 mr-2" />
                  Import from File
                </Button>
              </div>
            </div>
            
            <Dialog open={isImportExportDialogOpen} onOpenChange={setIsImportExportDialogOpen}>
              <DialogContent className="bg-gray-900 border-gray-800 max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Import/Export Settings</DialogTitle>
                  <DialogDescription>
                    Share settings between different systems or create backups
                  </DialogDescription>
                </DialogHeader>
                
                <Tabs defaultValue="export" className="w-full">
                  <TabsList className="grid grid-cols-2 mb-4">
                    <TabsTrigger value="export">
                      <Share2 className="h-4 w-4 mr-2" />
                      Export
                    </TabsTrigger>
                    <TabsTrigger value="import">
                      <Download className="h-4 w-4 mr-2" />
                      Import
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="export" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Export Code</Label>
                      <div className="relative">
                        <Textarea
                          value={exportCode}
                          readOnly
                          className="h-32 font-mono text-xs bg-gray-950 border-gray-800"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            navigator.clipboard.writeText(exportCode);
                            alert('Copied to clipboard!');
                          }}
                        >
                          <Clipboard className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-400">
                        Copy this code and share it with others, or save it for later use.
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="import" className="space-y-4">
                    <div className="space-y-2">
                      <Label>Paste Import Code</Label>
                      <Textarea
                        value={importCode}
                        onChange={(e) => setImportCode(e.target.value)}
                        placeholder='Paste export code here...'
                        className="h-32 font-mono text-xs bg-gray-950 border-gray-800"
                      />
                      <p className="text-xs text-gray-400">
                        Warning: Importing settings will replace your current configuration.
                      </p>
                    </div>
                    <Button 
                      onClick={importFromCode}
                      disabled={!importCode.trim()}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Import Settings
                    </Button>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default WorkflowManagementSection;
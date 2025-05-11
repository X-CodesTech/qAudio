import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Settings, FolderCheck } from 'lucide-react';
import { useRadioAutomation } from '@/contexts/RadioAutomationContext';
import { MediaFolder } from '@shared/schema';

interface LibrarySettingsDialogProps {
  trigger?: React.ReactNode;
}

const LibrarySettingsDialog: React.FC<LibrarySettingsDialogProps> = ({ trigger }) => {
  const { toast } = useToast();
  const { folders, createFolder } = useRadioAutomation();
  const [open, setOpen] = useState(false);
  const [libraryFolderName, setLibraryFolderName] = useState('');
  const [defaultLibraryFolder, setDefaultLibraryFolder] = useState<MediaFolder | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Find the library folder if it exists
  useEffect(() => {
    const libraryFolder = folders.find(folder => folder.path?.includes('library') || 
                                                folder.name.toLowerCase() === 'library' || 
                                                folder.name.toLowerCase() === 'music library');
    if (libraryFolder) {
      setDefaultLibraryFolder(libraryFolder);
      setLibraryFolderName(libraryFolder.name);
    } else if (folders.length > 0) {
      // Default to first folder if no library folder is found
      setDefaultLibraryFolder(folders[0]);
      setLibraryFolderName(folders[0].name);
    }
  }, [folders]);

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      
      if (!libraryFolderName.trim()) {
        toast({
          title: 'Error',
          description: 'Please enter a valid folder name',
          variant: 'destructive',
        });
        return;
      }
      
      // Check if the folder already exists
      const existingFolder = folders.find(
        folder => folder.name.toLowerCase() === libraryFolderName.toLowerCase()
      );
      
      let resultFolder;
      
      if (existingFolder) {
        // Use existing folder
        resultFolder = existingFolder;
        toast({
          title: 'Library Settings Updated',
          description: `Using existing folder "${libraryFolderName}" as your music library`,
        });
      } else {
        // Create a new folder
        resultFolder = await createFolder({
          name: libraryFolderName,
          path: `uploads/library/${libraryFolderName.toLowerCase().replace(/\s+/g, '_')}`,
          description: 'Music Library Folder'
        });
        
        toast({
          title: 'Library Folder Created',
          description: `Created "${libraryFolderName}" folder for your music library`,
        });
      }
      
      // Store the default folder ID in localStorage for persistence
      localStorage.setItem('defaultLibraryFolderId', resultFolder.id.toString());
      
      setDefaultLibraryFolder(resultFolder);
      setOpen(false);
    } catch (error) {
      console.error('Error saving library settings:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save library settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="h-4 w-4" />
            Library Settings
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Music Library Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="libraryFolder" className="col-span-4">
              Music Library Folder
            </Label>
            <div className="col-span-4 flex gap-2">
              <Input
                id="libraryFolder"
                value={libraryFolderName}
                onChange={(e) => setLibraryFolderName(e.target.value)}
                placeholder="Enter folder name (e.g., Music Library)"
              />
            </div>
            {defaultLibraryFolder && (
              <div className="col-span-4 text-sm text-muted-foreground flex items-center gap-2">
                <FolderCheck className="h-4 w-4 text-green-500" />
                Current library folder: <span className="font-medium">{defaultLibraryFolder.name}</span>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSaveSettings} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LibrarySettingsDialog;
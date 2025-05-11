import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRadioAutomation } from '@/contexts/RadioAutomationContext';
import { UploadIcon, AlertCircle, Music } from 'lucide-react';
import { MediaFolder } from '@shared/schema';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

interface UploadTrackDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  folderId?: number;
  onUploadComplete?: (folderId: number | null) => void;
}

const UploadTrackDialog: React.FC<UploadTrackDialogProps> = ({ 
  trigger, 
  open: externalOpen, 
  onOpenChange: externalOnOpenChange,
  folderId,
  onUploadComplete 
}) => {
  const { folders, uploadTrack } = useRadioAutomation();
  const { toast } = useToast();
  const [internalOpen, setInternalOpen] = useState(false);
  
  // If external open state is provided, use it; otherwise use internal state
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [defaultLibraryFolder, setDefaultLibraryFolder] = useState<MediaFolder | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Get the default library folder when the component mounts or folders change
  useEffect(() => {
    // If folder ID is provided as a prop, use it
    if (folderId && folders.length > 0) {
      const folderStr = folderId.toString();
      const selectedFolder = folders.find(folder => folder.id.toString() === folderStr);
      if (selectedFolder) {
        setDefaultLibraryFolder(selectedFolder);
        setSelectedFolderId(folderStr);
        return;
      }
    }
    
    // Otherwise use saved preference
    const savedFolderId = localStorage.getItem('defaultLibraryFolderId');
    
    if (savedFolderId && folders.length > 0) {
      const libraryFolder = folders.find(folder => folder.id.toString() === savedFolderId);
      if (libraryFolder) {
        setDefaultLibraryFolder(libraryFolder);
        setSelectedFolderId(libraryFolder.id.toString());
        return;
      }
    }

    // If no saved folder or folder not found, look for a library folder
    const libraryFolder = folders.find(folder => 
      folder.path?.includes('library') || 
      folder.name.toLowerCase() === 'library' || 
      folder.name.toLowerCase() === 'music library' ||
      folder.name.toLowerCase() === 'mazen' ||
      folder.name.toLowerCase() === 'basma'
    );
    
    if (libraryFolder) {
      setDefaultLibraryFolder(libraryFolder);
      setSelectedFolderId(libraryFolder.id.toString());
    } else if (folders.length > 0) {
      // If no library folder found, use the first available folder
      setSelectedFolderId(folders[0].id.toString());
    }
  }, [folders, folderId]);

  const processFile = useCallback((file: File) => {
    // Check for zero-byte files
    if (file.size <= 0) {
      toast({
        title: 'Empty File Detected',
        description: 'The selected file appears to be empty or corrupted. Please select a valid audio file.',
        variant: 'destructive',
      });
      return;
    }
    
    // Simple check to verify it's an audio file based on MIME type
    if (!file.type.startsWith('audio/') && 
        !['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac'].some(ext => 
          file.name.toLowerCase().endsWith(ext))) {
      toast({
        title: 'Invalid File Type',
        description: 'Please select a valid audio file (MP3, WAV, FLAC, etc.)',
        variant: 'destructive',
      });
      return;
    }
    
    setSelectedFile(file);
    
    // Auto-extract title from filename if empty
    if (!title) {
      const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
      setTitle(fileName);
    }
  }, [title, toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      
      // Use the same processFile function that has comprehensive validation
      processFile(file);
        
      // Also update the file input so it's consistent if file was valid
      if (fileInputRef.current && file.size > 0 && 
          (file.type.startsWith('audio/') || 
           ['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac'].some(ext => 
             file.name.toLowerCase().endsWith(ext)))) {
        // This is a hack but it works in most browsers
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInputRef.current.files = dataTransfer.files;
      }
    }
  }, [processFile]);

  const resetForm = () => {
    setSelectedFile(null);
    setTitle('');
    setArtist('');
    setAlbum('');
    setUploadProgress(0);
    // Don't reset the selected folder ID to maintain the user's library preference
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast({
        title: 'Error',
        description: 'Please select a file to upload',
        variant: 'destructive',
      });
      return;
    }

    // If no folder is selected but we have a default library folder, use that
    const folderId = selectedFolderId || (defaultLibraryFolder ? defaultLibraryFolder.id.toString() : null);

    try {
      setUploading(true);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90; // Hold at 90% until actual upload completes
          }
          return prev + 10;
        });
      }, 300);
      
      const result = await uploadTrack(selectedFile, {
        title,
        artist: artist || null,
        album: album || null,
        folderId: folderId ? parseInt(folderId, 10) : null,
        category: 'music'  // Add default category
      });
      
      // Complete the progress bar
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      toast({
        title: 'Success',
        description: `Track "${title}" uploaded successfully${folderId ? ` to ${folders.find(f => f.id.toString() === folderId)?.name}` : ''}`
      });
      
      resetForm();
      setOpen(false);
      
      // Call the onUploadComplete callback with the folder ID to trigger refresh
      if (onUploadComplete && folderId) {
        onUploadComplete(parseInt(folderId, 10));
      }
    } catch (error) {
      console.error('Track upload error:', error);
      setUploadProgress(0);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <UploadIcon className="h-4 w-4 mr-2" />
            Upload
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Track</DialogTitle>
          <DialogDescription>
            Drag and drop an audio file or click to select a file to upload
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {defaultLibraryFolder && (
              <Alert className="bg-zinc-800 border-zinc-700">
                <AlertCircle className="h-4 w-4 text-blue-400" />
                <AlertDescription>
                  Tracks will be uploaded to: <strong>{selectedFolderId ? folders.find(f => f.id.toString() === selectedFolderId)?.name || defaultLibraryFolder.name : defaultLibraryFolder.name}</strong>
                </AlertDescription>
              </Alert>
            )}
            
            <div 
              ref={dropZoneRef}
              className={`grid gap-2 p-2 border-2 border-dashed rounded-md transition-colors ${
                isDragOver 
                  ? 'border-primary bg-primary/10' 
                  : 'border-zinc-700 hover:border-zinc-500'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{ cursor: 'pointer' }}
            >
              <div className="flex flex-col items-center justify-center py-4">
                <Music className={`h-12 w-12 mb-2 ${isDragOver ? 'text-primary' : 'text-zinc-400'}`} />
                <p className={`text-sm font-medium ${isDragOver ? 'text-primary' : 'text-zinc-300'}`}>
                  {selectedFile ? 'Change Audio File' : 'Drag & drop audio file here or click to browse'}
                </p>
                {!selectedFile && (
                  <p className="text-xs text-zinc-500 mt-1">MP3, WAV, FLAC, OGG, and other audio formats supported</p>
                )}
                {selectedFile && (
                  <div className="w-full mt-2 p-2 bg-zinc-800 rounded-md">
                    <p className="text-sm text-zinc-300 font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-zinc-500">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type}</p>
                  </div>
                )}
                <Input
                  id="file"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="audio/*"
                  required
                  className="hidden"
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Track title"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="artist">Artist (optional)</Label>
              <Input
                id="artist"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="Artist name"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="album">Album (optional)</Label>
              <Input
                id="album"
                value={album}
                onChange={(e) => setAlbum(e.target.value)}
                placeholder="Album name"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="folder">Folder</Label>
              <Select
                value={selectedFolderId}
                onValueChange={setSelectedFolderId}
              >
                <SelectTrigger id="folder">
                  <SelectValue placeholder={defaultLibraryFolder ? defaultLibraryFolder.name : "Select a folder"} />
                </SelectTrigger>
                <SelectContent>
                  {folders.length === 0 ? (
                    <SelectItem value="none">No folders available</SelectItem>
                  ) : (
                    <>
                      <SelectItem value="none">No Folder</SelectItem>
                      {folders.map((folder) => (
                        <SelectItem key={folder.id} value={folder.id.toString()}>
                          {folder.name} {defaultLibraryFolder?.id === folder.id ? '(Default Library)' : ''}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            {uploading && (
              <div className="mt-2">
                <Label className="text-xs mb-1 block">Upload Progress</Label>
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-zinc-500 mt-1 text-right">{uploadProgress}%</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={uploading}>
              Cancel
            </Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UploadTrackDialog;
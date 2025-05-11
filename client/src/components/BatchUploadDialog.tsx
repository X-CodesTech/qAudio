import { useState, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FolderSelector } from './FolderSelector';
import { TrackCategorySelector } from './TrackCategorySelector';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { UploadCloud, Check, X, AlertTriangle, Info } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from "@/components/ui/scroll-area";

interface BatchUploadDialogProps {
  trigger: React.ReactElement;
  onUploadsComplete?: (results: any) => void;
}

export function BatchUploadDialog({ trigger, onUploadsComplete }: BatchUploadDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [folderId, setFolderId] = useState<number | null>(null);
  const [defaultCategory, setDefaultCategory] = useState('music');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any>(null);
  const [processing, setProcessing] = useState(true);
  
  // Advanced settings
  const [autoDetectSilence, setAutoDetectSilence] = useState(true);
  const [convertToFlac, setConvertToFlac] = useState(false);
  const [analyzeAudio, setAnalyzeAudio] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get folders for dropdown
  const { data: folders = [] } = useQuery({
    queryKey: ['/api/radio/folders'],
    enabled: isOpen
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Filter only audio files
      const audioFiles = Array.from(e.dataTransfer.files).filter(file => 
        file.type.startsWith('audio/') || 
        file.name.endsWith('.mp3') || 
        file.name.endsWith('.wav') || 
        file.name.endsWith('.flac') ||
        file.name.endsWith('.aac') ||
        file.name.endsWith('.ogg') ||
        file.name.endsWith('.m4a')
      );
      
      if (audioFiles.length === 0) {
        toast({
          title: "No audio files",
          description: "Please drop audio files only.",
          variant: "destructive"
        });
        return;
      }
      
      setFiles(prev => [...prev, ...audioFiles]);
    }
  }, [toast]);
  
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const resetForm = () => {
    setFiles([]);
    setFolderId(null);
    setDefaultCategory('music');
    setAutoDetectSilence(true);
    setConvertToFlac(false);
    setAnalyzeAudio(true);
    setProgress(0);
    setResults(null);
    setUploading(false);
    setProcessing(true);
  };
  
  const handleUpload = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one file to upload.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setUploading(true);
      
      const formData = new FormData();
      
      files.forEach(file => {
        formData.append('files', file);
      });
      
      if (folderId) {
        formData.append('folderId', folderId.toString());
      }
      
      formData.append('defaultCategory', defaultCategory);
      formData.append('autoDetectSilence', autoDetectSilence.toString());
      formData.append('convertToFlac', convertToFlac.toString());
      formData.append('analyzeAudio', analyzeAudio.toString());
      
      // Upload files
      const response = await apiRequest(
        'POST',
        '/api/radio/tracks/batch-upload',
        formData,
        {
          headers: {
            // Don't set Content-Type, let the browser set it with the boundary
          },
          onProgress: (progressEvent) => {
            if (progressEvent.lengthComputable) {
              const percentComplete = Math.round((progressEvent.loaded / progressEvent.total) * 100);
              setProgress(percentComplete);
            }
          }
        }
      );
      
      if (response.ok) {
        const result = await response.json();
        setResults(result);
        
        // Invalidate queries to refresh the track list and folder contents
        queryClient.invalidateQueries({ queryKey: ['/api/radio/tracks'] });
        if (folderId) {
          queryClient.invalidateQueries({ queryKey: ['/api/radio/folders', folderId, 'tracks'] });
        }
        
        if (onUploadsComplete) {
          onUploadsComplete(result);
        }
        
        if (result.errors.length === 0) {
          toast({
            title: "Upload Complete",
            description: `Successfully uploaded ${result.results.length} files.`,
            variant: "default"
          });
        } else {
          toast({
            title: "Upload Partially Complete",
            description: `Uploaded ${result.results.length} files with ${result.errors.length} errors.`,
            variant: "destructive"
          });
        }
      } else {
        const errorData = await response.json();
        toast({
          title: "Upload Failed",
          description: errorData.error || "Failed to upload files. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error during batch upload:", error);
      toast({
        title: "Upload Error",
        description: "An unexpected error occurred during upload.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      // After a timeout, we'll assume processing is complete for demo purposes
      // In a real implementation, we would poll the server for status
      setTimeout(() => {
        setProcessing(false);
      }, 2000);
    }
  };
  
  const handleClose = () => {
    if (uploading) {
      toast({
        title: "Upload in Progress",
        description: "Please wait for the upload to complete.",
        variant: "destructive"
      });
      return;
    }
    setIsOpen(false);
    // Wait a bit before resetting the form to avoid visual glitches
    setTimeout(resetForm, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild onClick={() => setIsOpen(true)}>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Batch Upload Audio Files</DialogTitle>
          <DialogDescription>
            Upload multiple audio files at once. You can select files or drag and drop them below.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {!uploading && results === null ? (
            <div className="space-y-4">
              <div 
                className={`border-2 border-dashed rounded-md p-6 transition-colors ${
                  isDragging 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center justify-center space-y-2 cursor-pointer">
                  <UploadCloud className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm text-center text-muted-foreground">
                    Drag and drop audio files here, or click to select files
                  </p>
                  <p className="text-xs text-center text-muted-foreground">
                    Supports MP3, WAV, FLAC, AAC, OGG, M4A
                  </p>
                  <input
                    type="file"
                    accept="audio/*"
                    multiple
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    className="hidden"
                  />
                </div>
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">
                    Selected Files ({files.length})
                  </h3>
                  <ScrollArea className="h-[200px] rounded-md border">
                    <div className="p-2">
                      {files.map((file, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                          <div className="flex-1 truncate pr-2">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(index);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="folder">Target Folder</Label>
                    <FolderSelector
                      value={folderId}
                      onChange={setFolderId}
                      placeholder="Select a folder"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Default Track Category</Label>
                    <TrackCategorySelector
                      value={defaultCategory}
                      onChange={setDefaultCategory}
                    />
                  </div>
                </div>

                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="advanced-options">
                    <AccordionTrigger>Advanced Options</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="auto-detect-silence"
                            checked={autoDetectSilence}
                            onCheckedChange={(checked) => setAutoDetectSilence(checked === true)}
                          />
                          <Label htmlFor="auto-detect-silence" className="cursor-pointer">
                            Auto-detect silence and set in/out points
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="convert-to-flac" 
                            checked={convertToFlac}
                            onCheckedChange={(checked) => setConvertToFlac(checked === true)}
                          />
                          <Label htmlFor="convert-to-flac" className="cursor-pointer">
                            Convert to FLAC format
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="analyze-audio" 
                            checked={analyzeAudio}
                            onCheckedChange={(checked) => setAnalyzeAudio(checked === true)}
                          />
                          <Label htmlFor="analyze-audio" className="cursor-pointer">
                            Analyze audio (BPM, waveform, levels)
                          </Label>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          ) : uploading || processing ? (
            <div className="space-y-4 py-4">
              <div className="text-center">
                <h3 className="text-lg font-medium">
                  {uploading ? 'Uploading...' : 'Processing...'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {uploading 
                    ? `Uploading ${files.length} files to the server.` 
                    : 'Processing uploaded files (analyzing audio, detecting silence, etc.)'}
                </p>
              </div>
              
              <Progress value={progress} className="w-full h-2" />
              
              <p className="text-sm text-center text-muted-foreground">
                {progress}% complete
              </p>
            </div>
          ) : results ? (
            <div className="space-y-4 py-4">
              <div className="text-center">
                <div className="flex justify-center">
                  {results.errors.length === 0 ? (
                    <Check className="h-10 w-10 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-10 w-10 text-amber-500" />
                  )}
                </div>
                <h3 className="text-lg font-medium mt-2">
                  {results.errors.length === 0 
                    ? 'Upload Complete' 
                    : 'Upload Partially Complete'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {results.message}
                </p>
              </div>
              
              <Tabs defaultValue="uploaded">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="uploaded">
                    Uploaded Files ({results.results.length})
                  </TabsTrigger>
                  <TabsTrigger value="errors" disabled={results.errors.length === 0}>
                    Errors ({results.errors.length})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="uploaded" className="space-y-4">
                  <ScrollArea className="h-[300px] rounded-md border">
                    <div className="p-4 space-y-2">
                      {results.results.map((track: any, index: number) => (
                        <div key={index} className="flex items-center space-x-2 p-2 rounded-md bg-background border">
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <div className="flex-1 overflow-hidden">
                            <p className="font-medium truncate">{track.title}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {track.artist || "Unknown Artist"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="errors" className="space-y-4">
                  <ScrollArea className="h-[300px] rounded-md border">
                    <div className="p-4 space-y-2">
                      {results.errors.map((error: any, index: number) => (
                        <Alert key={index} variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>{error.filename}</AlertTitle>
                          <AlertDescription>
                            {error.error}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Processing Information</AlertTitle>
                <AlertDescription>
                  {autoDetectSilence && (
                    <p>✓ Silence detection is being processed in the background.</p>
                  )}
                  {convertToFlac && (
                    <p>✓ FLAC conversion is being processed in the background.</p>
                  )}
                  {analyzeAudio && (
                    <p>✓ Audio analysis (BPM, waveform) is being processed in the background.</p>
                  )}
                </AlertDescription>
              </Alert>
            </div>
          ) : null}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            {results ? 'Close' : 'Cancel'}
          </Button>
          {!uploading && results === null && (
            <Button onClick={handleUpload} disabled={files.length === 0}>
              Upload {files.length > 0 ? `(${files.length})` : ''}
            </Button>
          )}
          {results && (
            <Button onClick={resetForm} variant="outline">
              Upload More
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
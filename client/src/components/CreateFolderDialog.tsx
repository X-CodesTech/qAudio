import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRadioAutomation } from '@/contexts/RadioAutomationContext';
import { FolderPlus, Music, FileMusic, Radio, Star, Mic, Volume2, Zap, Folder } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface CreateFolderDialogProps {
  trigger?: React.ReactNode;
  onFolderCreated?: (folderId: number) => void;
}

// Helper function to get folder category icon
const getFolderCategoryIcon = (category: string) => {
  switch(category) {
    case 'music':
      return <Music className="h-4 w-4" />;
    case 'jingles':
      return <Radio className="h-4 w-4" />;
    case 'commercials':
      return <Star className="h-4 w-4" />;
    case 'voiceovers':
      return <Mic className="h-4 w-4" />;
    case 'effects':
      return <Volume2 className="h-4 w-4" />;
    case 'sweepers':
      return <Zap className="h-4 w-4" />;
    case 'promos':
      return <FileMusic className="h-4 w-4" />;
    default:
      return <Folder className="h-4 w-4" />;
  }
};

const CreateFolderDialog: React.FC<CreateFolderDialogProps> = ({ trigger, onFolderCreated }) => {
  const { createFolderMutation } = useRadioAutomation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('default');
  const [isCreating, setIsCreating] = useState(false);

  const resetForm = () => {
    setName('');
    setDescription('');
    setCategory('default');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a folder name',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsCreating(true);
      
      // Create the folder data with explicit category
      const folderData = {
        name: name.trim(),
        description: description.trim() || null,
        category: category || 'default' // Ensure category is always set
      };
      
      // Log what we're sending to the API
      console.log('Creating folder with data:', JSON.stringify(folderData, null, 2));
      
      // Make direct fetch call to inspect the actual request/response
      try {
        const response = await fetch('/api/radio/folders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(folderData)
        });
        
        console.log('Folder creation response status:', response.status);
        
        if (!response.ok) {
          let errorText = 'Server error';
          try {
            const errorData = await response.json();
            errorText = errorData.error || 'Unknown server error';
          } catch (e) {
            errorText = 'Failed to parse error response';
          }
          throw new Error(errorText);
        }
        
        const result = await response.json();
        console.log('Folder created successfully:', result);
        
        toast({
          title: 'Success',
          description: `Folder "${name}" created successfully`
        });
        
        if (onFolderCreated && result.id) {
          onFolderCreated(result.id);
        }
        
        resetForm();
        setOpen(false);
      } catch (fetchError) {
        console.error('Fetch error during folder creation:', fetchError);
        throw fetchError;
      }
    } catch (error) {
      console.error('Folder creation error:', error);
      toast({
        title: 'Creation Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Folder</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Folder Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Music Library"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="category">Folder Category</Label>
              <Select
                value={category}
                onValueChange={setCategory}
              >
                <SelectTrigger id="category" className="w-full">
                  <div className="flex items-center gap-2">
                    {category === "default" && <Folder className="h-4 w-4 text-primary" />}
                    {category === "music" && <Music className="h-4 w-4 text-primary" />}
                    {category === "jingles" && <Radio className="h-4 w-4 text-primary" />}
                    {category === "commercials" && <Star className="h-4 w-4 text-primary" />}
                    {category === "voiceovers" && <Mic className="h-4 w-4 text-primary" />}
                    {category === "effects" && <Volume2 className="h-4 w-4 text-primary" />}
                    {category === "sweepers" && <Zap className="h-4 w-4 text-primary" />}
                    {category === "promos" && <FileMusic className="h-4 w-4 text-primary" />}
                    <span>
                      {category === "default" ? "Default" :
                       category === "music" ? "Music" :
                       category === "jingles" ? "Jingles" :
                       category === "commercials" ? "Commercials" :
                       category === "voiceovers" ? "Voiceovers" :
                       category === "effects" ? "Sound Effects" :
                       category === "sweepers" ? "Sweepers" :
                       category === "promos" ? "Promos" : "Select category"}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4" />
                      <span>Default</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="music">
                    <div className="flex items-center gap-2">
                      <Music className="h-4 w-4" />
                      <span>Music</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="jingles">
                    <div className="flex items-center gap-2">
                      <Radio className="h-4 w-4" />
                      <span>Jingles</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="commercials">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      <span>Commercials</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="voiceovers">
                    <div className="flex items-center gap-2">
                      <Mic className="h-4 w-4" />
                      <span>Voiceovers</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="effects">
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4" />
                      <span>Sound Effects</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="sweepers">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      <span>Sweepers</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="promos">
                    <div className="flex items-center gap-2">
                      <FileMusic className="h-4 w-4" />
                      <span>Promos</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              
              {/* Visual indicator of selected category */}
              <div className="bg-zinc-900 p-3 rounded-md border border-zinc-800 mt-2">
                <div className="text-sm text-zinc-400 mb-2">Selected Folder Type:</div>
                <div className="flex items-center gap-3">
                  {category === "default" && <Folder className="h-5 w-5 text-primary" />}
                  {category === "music" && <Music className="h-5 w-5 text-primary" />}
                  {category === "jingles" && <Radio className="h-5 w-5 text-primary" />}
                  {category === "commercials" && <Star className="h-5 w-5 text-primary" />}
                  {category === "voiceovers" && <Mic className="h-5 w-5 text-primary" />}
                  {category === "effects" && <Volume2 className="h-5 w-5 text-primary" />}
                  {category === "sweepers" && <Zap className="h-5 w-5 text-primary" />}
                  {category === "promos" && <FileMusic className="h-5 w-5 text-primary" />}
                  <span className="font-medium text-white">
                    {category === "default" ? "Default Folder" :
                     category === "music" ? "Music Folder" :
                     category === "jingles" ? "Jingles Folder" :
                     category === "commercials" ? "Commercials Folder" :
                     category === "voiceovers" ? "Voiceovers Folder" :
                     category === "effects" ? "Sound Effects Folder" :
                     category === "sweepers" ? "Sweepers Folder" :
                     category === "promos" ? "Promos Folder" : "Unknown Type"}
                  </span>
                </div>
                <div className="text-xs text-zinc-500 mt-2">
                  This icon will appear next to your folder in the media library.
                </div>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this folder's contents"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Folder'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateFolderDialog;
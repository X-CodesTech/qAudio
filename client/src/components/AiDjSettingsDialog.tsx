import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AiDjSettings, MediaFolder } from '@shared/schema';
import { useAiDj } from '@/contexts/AiDjContext';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, Plus } from 'lucide-react';

// Define the form validation schema
const settingsFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  isActive: z.boolean().optional(),
  durationHours: z.coerce.number().min(0.5, {
    message: "Duration must be at least 30 minutes.",
  }).max(24, {
    message: "Duration can't exceed 24 hours.",
  }),
  mood: z.string().optional(),
  genre: z.string().optional(),
  tempo: z.string().optional(),
  energyLevel: z.coerce.number().min(1).max(10).optional(),
  jingleFrequency: z.coerce.number().min(0).max(20).optional(),
  stationIdFrequency: z.coerce.number().min(0).max(20).optional(),
  sourceFolderIds: z.array(z.number()).optional(),
  enableCrossfading: z.boolean().optional(),
  crossfadeDuration: z.coerce.number().min(0).max(10).optional(),
  enableBeatMatching: z.boolean().optional(),
  studioId: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

interface AiDjSettingsDialogProps {
  setting?: AiDjSettings;
  folders: MediaFolder[];
  children?: React.ReactNode;
  onSuccess?: () => void;
}

export function AiDjSettingsDialog({ setting, folders, children, onSuccess }: AiDjSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const { createSettingMutation, updateSettingMutation } = useAiDj();
  
  // Create form with validation
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      name: setting?.name || '',
      isActive: setting?.isActive || false,
      durationHours: setting?.durationHours ? Number(setting.durationHours) : 2,
      mood: setting?.mood || '',
      genre: setting?.genre || '',
      tempo: setting?.tempo || '',
      energyLevel: setting?.energyLevel || 5,
      jingleFrequency: setting?.jingleFrequency || 4,
      stationIdFrequency: setting?.stationIdFrequency || 8,
      sourceFolderIds: setting?.sourceFolderIds || [],
      enableCrossfading: setting?.enableCrossfading || true,
      crossfadeDuration: setting?.crossfadeDuration || 3,
      enableBeatMatching: setting?.enableBeatMatching || false,
      studioId: setting?.studioId || 'A',
    }
  });
  
  // Reset form when setting changes
  useEffect(() => {
    if (setting) {
      form.reset({
        name: setting.name,
        isActive: setting.isActive || false,
        durationHours: setting.durationHours ? Number(setting.durationHours) : 2,
        mood: setting.mood || '',
        genre: setting.genre || '',
        tempo: setting.tempo || '',
        energyLevel: setting.energyLevel || 5,
        jingleFrequency: setting.jingleFrequency || 4,
        stationIdFrequency: setting.stationIdFrequency || 8,
        sourceFolderIds: setting.sourceFolderIds || [],
        enableCrossfading: setting.enableCrossfading || true,
        crossfadeDuration: setting.crossfadeDuration || 3,
        enableBeatMatching: setting.enableBeatMatching || false,
        studioId: setting.studioId || 'A',
      });
    } else {
      form.reset({
        name: '',
        isActive: false,
        durationHours: 2,
        mood: '',
        genre: '',
        tempo: '',
        energyLevel: 5,
        jingleFrequency: 4,
        stationIdFrequency: 8,
        sourceFolderIds: [],
        enableCrossfading: true,
        crossfadeDuration: 3,
        enableBeatMatching: false,
        studioId: 'A',
      });
    }
  }, [setting, form, open]);
  
  const onSubmit = async (data: SettingsFormValues) => {
    if (setting) {
      // Update existing setting
      await updateSettingMutation.mutateAsync({
        id: setting.id,
        setting: data
      });
    } else {
      // Create new setting
      await createSettingMutation.mutateAsync(data);
    }
    
    setOpen(false);
    if (onSuccess) onSuccess();
  };
  
  const isPending = createSettingMutation.isPending || updateSettingMutation.isPending;
  
  // For folder selection
  const musicFolders = folders.filter(f => f.name.toLowerCase() !== 'commercials' && f.name.toLowerCase() !== 'jingles');
  
  const handleFolderChange = (folderId: number) => {
    const currentFolders = form.getValues('sourceFolderIds') || [];
    const newFolders = currentFolders.includes(folderId)
      ? currentFolders.filter(id => id !== folderId)
      : [...currentFolders, folderId];
    
    form.setValue('sourceFolderIds', newFolders);
  };
  
  const selectedFolders = form.watch('sourceFolderIds') || [];
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            New AI DJ Setting
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{setting ? 'Edit AI DJ Setting' : 'Create New AI DJ Setting'}</DialogTitle>
          <DialogDescription>
            Configure how the AI DJ should generate and manage playlists
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Morning Show Mix" {...field} />
                      </FormControl>
                      <FormDescription>
                        Give this AI DJ setting a descriptive name
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="studioId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Studio</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select studio" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="A">Studio A</SelectItem>
                          <SelectItem value="B">Studio B</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Which studio this AI DJ setting is for
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between space-x-2 rounded-md border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active</FormLabel>
                        <FormDescription>
                          Set this AI DJ to be active and generate playlists automatically
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <Separator />
                <h3 className="text-lg font-semibold">Content Settings</h3>
                
                <FormField
                  control={form.control}
                  name="durationHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (hours)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={0.5} 
                          max={24} 
                          step={0.5} 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        How many hours of content should the AI DJ generate
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="mood"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mood</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select mood" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Any mood</SelectItem>
                            <SelectItem value="upbeat">Upbeat</SelectItem>
                            <SelectItem value="energetic">Energetic</SelectItem>
                            <SelectItem value="chill">Chill</SelectItem>
                            <SelectItem value="relaxed">Relaxed</SelectItem>
                            <SelectItem value="happy">Happy</SelectItem>
                            <SelectItem value="melancholic">Melancholic</SelectItem>
                            <SelectItem value="romantic">Romantic</SelectItem>
                            <SelectItem value="dramatic">Dramatic</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="genre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Genre</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select genre" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Any genre</SelectItem>
                            <SelectItem value="pop">Pop</SelectItem>
                            <SelectItem value="rock">Rock</SelectItem>
                            <SelectItem value="electronic">Electronic</SelectItem>
                            <SelectItem value="dance">Dance</SelectItem>
                            <SelectItem value="hip-hop">Hip-Hop</SelectItem>
                            <SelectItem value="rnb">R&B</SelectItem>
                            <SelectItem value="country">Country</SelectItem>
                            <SelectItem value="jazz">Jazz</SelectItem>
                            <SelectItem value="classical">Classical</SelectItem>
                            <SelectItem value="alternative">Alternative</SelectItem>
                            <SelectItem value="indie">Indie</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tempo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tempo</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select tempo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Any tempo</SelectItem>
                            <SelectItem value="slow">Slow</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="fast">Fast</SelectItem>
                            <SelectItem value="variable">Variable</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="energyLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Energy Level ({field.value}/10)</FormLabel>
                        <FormControl>
                          <Slider
                            defaultValue={[field.value || 5]}
                            max={10}
                            min={1}
                            step={1}
                            onValueChange={(vals) => field.onChange(vals[0])}
                          />
                        </FormControl>
                        <FormDescription>
                          1 = Very low energy, 10 = Very high energy
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <Separator />
                <h3 className="text-lg font-semibold">Station Elements</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="jingleFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jingle Frequency</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={0} 
                            max={20} 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Insert jingle every X tracks (0 = disabled)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="stationIdFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Station ID Frequency</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={0} 
                            max={20} 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Insert station ID every X tracks (0 = disabled)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <Separator />
                <h3 className="text-lg font-semibold">Source Content</h3>
                
                <div className="space-y-3">
                  <Label>Music Source Folders</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {musicFolders.map((folder) => (
                      <div 
                        key={folder.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`folder-${folder.id}`}
                          checked={selectedFolders.includes(folder.id)}
                          onCheckedChange={() => handleFolderChange(folder.id)}
                        />
                        <label
                          htmlFor={`folder-${folder.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {folder.name}
                        </label>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedFolders.length > 0 ? (
                      selectedFolders.map((id) => {
                        const folder = folders.find(f => f.id === id);
                        return folder ? (
                          <Badge key={id} variant="secondary" className="text-xs">
                            {folder.name}
                          </Badge>
                        ) : null;
                      })
                    ) : (
                      <FormDescription>No folders selected. AI will use all available music.</FormDescription>
                    )}
                  </div>
                </div>
                
                <Separator />
                <h3 className="text-lg font-semibold">Audio Settings</h3>
                
                <FormField
                  control={form.control}
                  name="enableCrossfading"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between space-x-2 rounded-md border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Enable Crossfading</FormLabel>
                        <FormDescription>
                          Automatically crossfade between tracks
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                {form.watch('enableCrossfading') && (
                  <FormField
                    control={form.control}
                    name="crossfadeDuration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Crossfade Duration (seconds)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={0} 
                            max={10} 
                            step={0.5}
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <FormField
                  control={form.control}
                  name="enableBeatMatching"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between space-x-2 rounded-md border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Enable Beat Matching</FormLabel>
                        <FormDescription>
                          Try to match tempo between consecutive tracks
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </ScrollArea>
            
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={isPending}
                className="gap-2"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <Save className="h-4 w-4" />
                {setting ? 'Update Setting' : 'Create Setting'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
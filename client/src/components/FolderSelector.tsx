import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useQuery } from '@tanstack/react-query';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getFolderIcon } from '@/lib/colorCodingSystem';

interface FolderSelectorProps {
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function FolderSelector({ 
  value, 
  onChange, 
  placeholder = "Select a folder", 
  disabled = false 
}: FolderSelectorProps) {
  const [open, setOpen] = useState(false);

  // Fetch folders 
  const { data: folders = [] } = useQuery({
    queryKey: ['/api/radio/folders']
  });

  const selectedFolder = folders.find((folder: any) => folder.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between", !value && "text-muted-foreground")}
        >
          {selectedFolder ? (
            <div className="flex items-center gap-2">
              {getFolderIcon(selectedFolder.category)}
              <span>{selectedFolder.name}</span>
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search folders..." />
          <CommandEmpty>No folder found.</CommandEmpty>
          <CommandGroup>
            <ScrollArea className="h-[200px]">
              <CommandItem
                value="none"
                key="none"
                onSelect={() => {
                  onChange(null);
                  setOpen(false);
                }}
              >
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4" />
                  <span>Root (No folder)</span>
                </div>
                {value === null && <Check className="ml-auto h-4 w-4" />}
              </CommandItem>
              {folders.map((folder: any) => (
                <CommandItem
                  key={folder.id}
                  value={folder.name}
                  onSelect={() => {
                    onChange(folder.id);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2">
                    {getFolderIcon(folder.category)}
                    <span>{folder.name}</span>
                  </div>
                  {value === folder.id && <Check className="ml-auto h-4 w-4" />}
                </CommandItem>
              ))}
            </ScrollArea>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
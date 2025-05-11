import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { getCategoryIcon, getCategoryColor, TRACK_CATEGORIES } from '@/lib/colorCodingSystem';

interface TrackCategorySelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function TrackCategorySelector({ 
  value, 
  onChange, 
  placeholder = "Select a category", 
  disabled = false 
}: TrackCategorySelectorProps) {
  const [open, setOpen] = useState(false);

  // Get selected category
  const selectedCategory = TRACK_CATEGORIES.find(cat => cat.value === value);

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
          {selectedCategory ? (
            <div className="flex items-center gap-2">
              {getCategoryIcon(selectedCategory.value)}
              <span>{selectedCategory.label}</span>
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search categories..." />
          <CommandEmpty>No category found.</CommandEmpty>
          <CommandGroup>
            <ScrollArea className="h-[200px]">
              {TRACK_CATEGORIES.map((category) => (
                <CommandItem
                  key={category.value}
                  value={category.value}
                  onSelect={() => {
                    onChange(category.value);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(category.value)}
                    <span>{category.label}</span>
                  </div>
                  {value === category.value && <Check className="ml-auto h-4 w-4" />}
                </CommandItem>
              ))}
            </ScrollArea>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLineCount } from '@/contexts/LineCountContext';
import { PhoneCall } from 'lucide-react';

type LineCountSelectorProps = {
  studio: 'A' | 'B' | 'C' | 'D';
  className?: string;
};

// Studio color mapping
const studioColors = {
  'A': '#D27D2D', // Orange
  'B': '#2D8D27', // Green
  'C': '#2D72D2', // Blue
  'D': '#8D2D8D', // Purple
};

export function LineCountSelector({ studio, className = '' }: LineCountSelectorProps) {
  const { lineCount, setStudioLineCount } = useLineCount();
  
  // Get the current line count for the specified studio
  const getCurrentLineCount = () => {
    const studioKey = `studio${studio}` as keyof typeof lineCount;
    return lineCount[studioKey]; 
  };
  
  const currentLineCount = getCurrentLineCount();
  
  const handleLineCountChange = (value: string) => {
    setStudioLineCount(studio, parseInt(value));
  };

  // Get studio color from the mapping
  const studioColor = studioColors[studio] || '#FFFFFF';

  // For Studios C and D, show a static label with fixed 4 lines
  if (studio === 'C' || studio === 'D') {
    return (
      <div className={`${className} flex items-center`}>
        <div 
          className="h-8 bg-zinc-900/70 border border-zinc-700 text-zinc-100 w-28 text-xs flex items-center rounded-md px-3"
          style={{ borderColor: studioColor }}
        >
          <PhoneCall className="h-3 w-3 mr-1.5" style={{ color: studioColor }} />
          <span style={{ color: studioColor }} className="mr-1 font-bold">{studio}:</span>
          <span className="text-zinc-200">4 lines</span>
        </div>
      </div>
    );
  }
  
  // For Studios A and B, show the dropdown selector
  return (
    <div className={`${className} flex items-center`}>
      <Select
        value={currentLineCount.toString()}
        onValueChange={handleLineCountChange}
      >
        <SelectTrigger
          className="h-8 bg-zinc-900/70 border-zinc-700 text-zinc-100 w-28 text-xs flex items-center"
          style={{ borderColor: studioColor }}
        >
          <PhoneCall className="h-3 w-3 mr-1.5" style={{ color: studioColor }} />
          <span style={{ color: studioColor }} className="mr-1 font-bold">{studio}:</span>
          <SelectValue placeholder="Lines" />
        </SelectTrigger>
        <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-100">
          <SelectItem value="4" className="text-xs">4 lines</SelectItem>
          <SelectItem value="5" className="text-xs">5 lines</SelectItem>
          <SelectItem value="6" className="text-xs">6 lines</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TRACK_CATEGORIES } from '@/lib/colorCodingSystem';
import { getCategoryIcon } from '@/lib/colorCodingSystem';
import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ColorCodingLegend() {
  const [isOpen, setIsOpen] = useState(false);
  
  // Group categories by their group
  const groupedCategories = TRACK_CATEGORIES.reduce((groups, category) => {
    const group = category.group || 'Other';
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(category);
    return groups;
  }, {} as Record<string, typeof TRACK_CATEGORIES>);
  
  return (
    <div className="relative">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8" 
              onClick={() => setIsOpen(!isOpen)}
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Track category legend</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {isOpen && (
        <Card className="absolute z-50 top-full right-0 mt-2 p-4 w-[350px] shadow-lg">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Track Categories</h3>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
              <span className="sr-only">Close</span>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-4">
            {Object.entries(groupedCategories).map(([group, categories]) => (
              <div key={group}>
                <h4 className="text-sm font-medium mb-2">{group}</h4>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map(category => (
                    <div 
                      key={category.value} 
                      className="flex items-center gap-2 p-1.5 rounded-md"
                      style={{ backgroundColor: `${category.color}15` }}
                    >
                      <div style={{ color: category.color }}>
                        {getCategoryIcon(category.value)}
                      </div>
                      <span className="text-sm">{category.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function X(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}
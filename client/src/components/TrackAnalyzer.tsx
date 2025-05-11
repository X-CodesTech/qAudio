import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wand2, TrendingUp, BarChart2 } from 'lucide-react';
import { TrackCategory, categoryColors } from '@/lib/colorCodingSystem';
import { useRadioAutomation } from '@/contexts/RadioAutomationContext';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

interface TrackAnalyzerProps {
  tracks: any[];
  playlistId?: number;
  className?: string;
  onTrackCategoriesUpdated?: () => void;
}

export function TrackAnalyzer({ 
  tracks = [], 
  playlistId,
  className,
  onTrackCategoriesUpdated
}: TrackAnalyzerProps) {
  const { toast } = useToast();
  const { updateTrackMutation } = useRadioAutomation();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Calculate category distribution for the playlist
  const categoryDistribution = useMemo(() => {
    const distribution: Record<string, { count: number, percentage: number }> = {};
    
    if (tracks.length === 0) return distribution;
    
    // Count occurrences of each category
    tracks.forEach(track => {
      const category = track.category || 'unclassified';
      if (!distribution[category]) {
        distribution[category] = { count: 0, percentage: 0 };
      }
      distribution[category].count += 1;
    });
    
    // Calculate percentages
    Object.keys(distribution).forEach(category => {
      distribution[category].percentage = (distribution[category].count / tracks.length) * 100;
    });
    
    return distribution;
  }, [tracks]);

  // Get top categories in descending order
  const topCategories = useMemo(() => {
    return Object.entries(categoryDistribution)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5);
  }, [categoryDistribution]);

  const getCategoryDisplayName = (category: string): string => {
    // Convert kebab-case to Title Case
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const autoDetectCategory = (track: any): TrackCategory => {
    if (!track) return 'unclassified';
    
    // Simple algorithm to guess category (same as in TrackCategorySelector)
    let detectedCategory: TrackCategory = 'unclassified';
    
    const title = track.title?.toLowerCase() || '';
    const artist = track.artist?.toLowerCase() || '';
    const duration = track.duration || 0;
    
    if (duration < 20) {
      if (title.includes('id') || title.includes('ident')) {
        detectedCategory = 'station-id';
      } else if (title.includes('trans')) {
        detectedCategory = 'transition';
      } else {
        detectedCategory = 'jingle';
      }
    }
    else if (duration < 60) {
      if (title.includes('weather') || artist.includes('weather')) {
        detectedCategory = 'weather';
      } else if (title.includes('traffic') || artist.includes('traffic')) {
        detectedCategory = 'traffic';
      } else if (
        title.includes('ad') || 
        title.includes('commercial') || 
        title.includes('spot')
      ) {
        detectedCategory = 'commercial';
      } else {
        detectedCategory = 'sweeper';
      }
    }
    else if (duration < 300) {
      if (
        title.includes('news') || 
        artist.includes('news') ||
        title.includes('report')
      ) {
        detectedCategory = 'news';
      } else if (title.includes('promo')) {
        detectedCategory = 'promo';
      } else {
        detectedCategory = 'music';
      }
    }
    else {
      if (
        title.includes('talk') || 
        title.includes('interview') || 
        title.includes('discussion')
      ) {
        detectedCategory = 'talk';
      } else if (title.includes('podcast')) {
        detectedCategory = 'podcast';
      } else {
        detectedCategory = 'music';
      }
    }
    
    return detectedCategory;
  };

  const analyzePlaylist = async () => {
    if (tracks.length === 0 || !updateTrackMutation) return;
    
    setIsAnalyzing(true);
    setProgress(0);
    
    try {
      let processed = 0;
      const uncategorizedTracks = tracks.filter(track => 
        !track.category || track.category === 'unclassified'
      );
      
      if (uncategorizedTracks.length === 0) {
        toast({
          title: "All tracks categorized",
          description: "All tracks in this playlist already have categories assigned.",
          variant: "default",
        });
        setIsAnalyzing(false);
        return;
      }
      
      // Process tracks in batches to avoid overwhelming the API
      const batchSize = 5;
      const batches = Math.ceil(uncategorizedTracks.length / batchSize);
      
      for (let i = 0; i < batches; i++) {
        const start = i * batchSize;
        const end = Math.min(start + batchSize, uncategorizedTracks.length);
        const batch = uncategorizedTracks.slice(start, end);
        
        // Process tracks in the current batch
        const updatePromises = batch.map(track => {
          const detectedCategory = autoDetectCategory(track);
          
          return updateTrackMutation.mutateAsync({
            id: track.id,
            category: detectedCategory
          }).then(() => {
            processed++;
            setProgress(Math.floor((processed / uncategorizedTracks.length) * 100));
            return true;
          }).catch((error) => {
            console.error(`Error updating track ${track.id}:`, error instanceof Error ? error.message : 'Unknown error');
            return false;
          });
        });
        
        await Promise.all(updatePromises);
      }
      
      toast({
        title: "Analysis complete",
        description: `${uncategorizedTracks.length} tracks were categorized`,
        variant: "default",
      });
      
      if (onTrackCategoriesUpdated) {
        onTrackCategoriesUpdated();
      }
    } catch (error) {
      console.error("Error during playlist analysis:", error);
      toast({
        title: "Analysis failed",
        description: "Failed to analyze and categorize tracks",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
      setProgress(0);
    }
  };

  return (
    <Card className={`${className || ''}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Playlist Analysis</CardTitle>
        <CardDescription className="text-xs">
          Analyze track categories and distribution
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {tracks.length > 0 ? (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium flex items-center gap-1">
                  <BarChart2 className="h-4 w-4" />
                  Category Distribution
                </h3>
                <span className="text-xs text-muted-foreground">
                  {tracks.length} tracks total
                </span>
              </div>
              
              <div className="space-y-1">
                {topCategories.map(([category, data]) => {
                  // Get color scheme if it's a known category
                  const colors = (category in categoryColors) 
                    ? categoryColors[category as TrackCategory].background
                    : 'bg-slate-800/20';
                    
                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>{getCategoryDisplayName(category)}</span>
                        <span>{data.count} tracks ({Math.round(data.percentage)}%)</span>
                      </div>
                      <Progress 
                        value={data.percentage} 
                        className={`h-2 ${colors.replace('/20', '/50')}`} 
                      />
                    </div>
                  );
                })}
              </div>
              
              {topCategories.length === 0 && (
                <div className="text-xs text-center py-2 text-muted-foreground">
                  No categorized tracks yet
                </div>
              )}
            </div>
            
            <div className="pt-2">
              <Button
                onClick={analyzePlaylist}
                className="w-full flex items-center justify-center gap-1"
                disabled={isAnalyzing}
                variant="secondary"
                size="sm"
              >
                {isAnalyzing ? (
                  <>
                    <TrendingUp className="h-3.5 w-3.5 animate-pulse" />
                    Analyzing... {progress}%
                  </>
                ) : (
                  <>
                    <Wand2 className="h-3.5 w-3.5" />
                    Auto-categorize Tracks
                  </>
                )}
              </Button>
              
              {isAnalyzing && (
                <Progress value={progress} className="h-1 mt-2" />
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-xs">
            No tracks to analyze
          </div>
        )}
      </CardContent>
    </Card>
  );
}
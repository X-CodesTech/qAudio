import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash, PhoneCall, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useVoIP } from '@/hooks/useVoIP';
import { format, formatDistance } from 'date-fns';

interface CallRecord {
  id: number;
  contactId?: number;
  phoneNumber: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  notes?: string;
  topicDiscussed?: string;
  wasOnAir: boolean;
}

export default function CallHistory({ selectedLineId, onSelectLine }: { selectedLineId?: number | null, onSelectLine?: (lineId: number) => void }) {
  const [callRecords, setCallRecords] = useState<CallRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();
  const { makeOutboundCall } = useVoIP();

  useEffect(() => {
    fetchCallRecords();
  }, []);

  const fetchCallRecords = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/calls');
      if (response.ok) {
        const data = await response.json();
        setCallRecords(data);
      } else {
        console.error('Failed to fetch call records');
      }
    } catch (error) {
      console.error('Error fetching call records:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCallRecord = async (id: number) => {
    try {
      const response = await fetch(`/api/calls/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from local state
        setCallRecords(prev => prev.filter(record => record.id !== id));
        toast({
          title: 'Call Record Deleted',
          description: 'The call record has been removed from the history.',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete call record',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting call record:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while deleting the call record',
        variant: 'destructive',
      });
    }
  };

  const handleCallNumber = (phoneNumber: string) => {
    if (!selectedLineId || !onSelectLine) {
      toast({
        title: 'No Line Selected',
        description: 'Please select a call line first',
        variant: 'destructive',
      });
      return;
    }
    
    makeOutboundCall(selectedLineId, phoneNumber);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatTimeWithDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };

  const filteredRecords = callRecords.filter(record => 
    record.phoneNumber.includes(searchQuery) ||
    (record.notes && record.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (record.topicDiscussed && record.topicDiscussed.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Input
          type="text"
          placeholder="Search call records..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>
      
      <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
        {isLoading ? (
          <Card className="p-4 text-center text-gray-500">Loading call records...</Card>
        ) : filteredRecords.length === 0 ? (
          <Card className="p-4 text-center text-gray-500">
            {searchQuery ? 'No matching call records found' : 'No call records available'}
          </Card>
        ) : (
          filteredRecords.map((record) => (
            <Card key={record.id} className="overflow-hidden bg-white hover:bg-zinc-50">
              <CardContent className="p-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium">{record.phoneNumber}</div>
                    <div className="text-xs text-zinc-500 mt-1 flex flex-wrap gap-x-2">
                      <span>{formatTimeWithDate(record.startTime)}</span>
                      <span>•</span>
                      <span>{formatDuration(record.duration)}</span>
                      {record.wasOnAir && <span className="text-red-500 font-medium">• On Air</span>}
                    </div>
                    {record.notes && (
                      <div className="mt-2 text-sm text-zinc-600 line-clamp-2">
                        {record.notes}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 items-start ml-3">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() => handleCallNumber(record.phoneNumber)}
                    >
                      <PhoneCall className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => deleteCallRecord(record.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
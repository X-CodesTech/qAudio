import { useState } from 'react';
import { useVoIP } from '@/contexts/VoIPContext';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { formatDuration } from '@/lib/utils';

export default function CallDetailsPanel() {
  const { selectedLine, addNoteToCall } = useVoIP();
  const [note, setNote] = useState<string>('');
  
  if (!selectedLine) {
    return (
      <div className="w-1/4 bg-white border-l border-neutral-200 flex flex-col">
        <div className="p-3 bg-neutral-100 border-b border-neutral-200 flex justify-between items-center">
          <h2 className="font-semibold text-lg">Call Details</h2>
        </div>
        <div className="p-4 text-center text-neutral-400 italic mt-8">
          No call selected. Select a call to view details.
        </div>
      </div>
    );
  }
  
  const getStatusBackground = () => {
    switch (selectedLine.status) {
      case 'on-air':
        return 'bg-red-50 border-status-onair text-status-onair';
      case 'holding':
        return 'bg-amber-50 border-status-holding text-status-holding';
      case 'active':
        return 'bg-green-50 border-status-active text-status-active';
      case 'ringing':
        return 'bg-blue-50 border-status-ringing text-status-ringing';
      default:
        return 'bg-neutral-50 border-neutral-200 text-neutral-500';
    }
  };
  
  const getStatusText = () => {
    switch (selectedLine.status) {
      case 'on-air':
        return 'CURRENTLY ON AIR';
      case 'holding':
        return 'CURRENTLY ON HOLD';
      case 'active':
        return 'ACTIVE CALL';
      case 'inactive':
        return 'AVAILABLE';
      default:
        return selectedLine.status.toUpperCase();
    }
  };
  
  const handleAddNote = () => {
    if (note.trim()) {
      addNoteToCall(selectedLine.id, note);
      setNote('');
    }
  };
  
  return (
    <div className="w-1/4 bg-white border-l border-neutral-200 flex flex-col">
      <div className="p-3 bg-neutral-100 border-b border-neutral-200 flex justify-between items-center">
        <h2 className="font-semibold text-lg">Call Details</h2>
        <div className="flex">
          <button className="p-1 text-neutral-500 hover:text-neutral-700" title="Previous call">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button className="p-1 text-neutral-500 hover:text-neutral-700" title="Next call">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="p-4 overflow-auto">
        {selectedLine.status !== 'inactive' && (
          <div 
            className={`text-center py-3 px-2 rounded-lg mb-4 border ${getStatusBackground()}`}
          >
            <div className="font-semibold text-sm">{getStatusText()}</div>
            <div className="text-neutral-500 text-xs">
              Line {selectedLine.id} • 
              {selectedLine.startTime ? ` Started ${formatDuration(
                Math.floor((new Date().getTime() - selectedLine.startTime.getTime()) / 1000)
              )} ago` : ' Just started'}
            </div>
          </div>
        )}
        
        {selectedLine.contact ? (
          <div className="mb-4">
            <h3 className="text-sm text-neutral-400 uppercase mb-1">Caller Information</h3>
            <div className="flex items-center mb-2">
              <span className="font-semibold">{selectedLine.contact.name}</span>
              {selectedLine.contact.isFrequentCaller && (
                <span className="ml-2 text-xs bg-neutral-100 px-2 py-0.5 rounded-full">Frequent caller</span>
              )}
            </div>
            <div className="text-sm text-neutral-400">
              <div className="mb-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 inline-block mr-2"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg> 
                {selectedLine.contact.phone}
              </div>
              {selectedLine.contact.location && (
                <div className="mb-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4 inline-block mr-2"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg> 
                  {selectedLine.contact.location}
                </div>
              )}
            </div>
          </div>
        ) : selectedLine.phoneNumber ? (
          <div className="mb-4">
            <h3 className="text-sm text-neutral-400 uppercase mb-1">Caller Information</h3>
            <div className="flex items-center mb-2">
              <span className="font-semibold">Unknown Caller</span>
            </div>
            <div className="text-sm text-neutral-400">
              <div className="mb-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 inline-block mr-2"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg> 
                {selectedLine.phoneNumber}
              </div>
            </div>
          </div>
        ) : null}
        
        {selectedLine.topic && (
          <div className="mb-4">
            <h3 className="text-sm text-neutral-400 uppercase mb-1">Call Topic</h3>
            <div className="bg-neutral-100 rounded-lg p-2 text-sm">
              {selectedLine.topic}
            </div>
          </div>
        )}
        
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <h3 className="text-sm text-neutral-400 uppercase">Call Notes</h3>
            <button 
              className="text-xs text-primary"
              onClick={handleAddNote}
            >
              + Add Note
            </button>
          </div>
          <Textarea 
            className="w-full h-32 p-2 text-sm border border-neutral-200 rounded-lg resize-none"
            placeholder="Add notes about this caller..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        
        {selectedLine.contact && (
          <div className="mb-4">
            <h3 className="text-sm text-neutral-400 uppercase mb-1">Previous Calls</h3>
            <div className="text-sm space-y-2">
              <div className="flex justify-between p-2 bg-neutral-100 rounded">
                <span>No previous calls</span>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-auto">
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              className="flex-1 py-2 bg-neutral-100 text-neutral-500 rounded-lg hover:bg-neutral-200 text-sm font-medium"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 mr-1"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              Save Contact
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 py-2 bg-neutral-100 text-neutral-500 rounded-lg hover:bg-neutral-200 text-sm font-medium"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 mr-1"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
              Block
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

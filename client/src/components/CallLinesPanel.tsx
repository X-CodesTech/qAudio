import { useState } from 'react';
import { useVoIP } from '@/contexts/VoIPContext';
import CallLine from './CallLine';
import AudioRouting from './AudioRouting';

export default function CallLinesPanel() {
  const { callLines, audioRouting, updateAudioRouting } = useVoIP();
  
  // Handle audio routing changes
  const handleRoutingChange = (lineId: number, outputChannel: string) => {
    updateAudioRouting(lineId, outputChannel);
  };

  // Count how many lines have each status
  const statusCount = callLines.reduce((count, line) => {
    const status = line.status || 'inactive';
    count[status] = (count[status] || 0) + 1;
    return count;
  }, {} as Record<string, number>);

  return (
    <div className="w-1/4 bg-white border-r border-neutral-200 flex flex-col">
      <div className="p-3 bg-neutral-100 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Phone Lines</h2>
          <div className="flex space-x-1">
            {statusCount['on-air'] > 0 && (
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 rounded-full bg-status-onair animate-on-air-blink mr-1"></span>
                <span className="text-xs font-medium">{statusCount['on-air']}</span>
              </div>
            )}
            {statusCount['active'] > 0 && (
              <div className="flex items-center ml-2">
                <span className="inline-block w-3 h-3 rounded-full bg-status-active mr-1"></span>
                <span className="text-xs font-medium">{statusCount['active']}</span>
              </div>
            )}
            {statusCount['holding'] > 0 && (
              <div className="flex items-center ml-2">
                <span className="inline-block w-3 h-3 rounded-full bg-status-holding mr-1"></span>
                <span className="text-xs font-medium">{statusCount['holding']}</span>
              </div>
            )}
            {statusCount['ringing'] > 0 && (
              <div className="flex items-center ml-2">
                <span className="inline-block w-3 h-3 rounded-full bg-status-ringing animate-pulse mr-1"></span>
                <span className="text-xs font-medium">{statusCount['ringing']}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex mt-2 text-xs text-gray-500">
          <div className="flex items-center mr-3">
            <div className="w-2 h-2 rounded-full bg-status-onair mr-1"></div>
            <span>On Air</span>
          </div>
          <div className="flex items-center mr-3">
            <div className="w-2 h-2 rounded-full bg-status-active mr-1"></div>
            <span>Active</span>
          </div>
          <div className="flex items-center mr-3">
            <div className="w-2 h-2 rounded-full bg-status-holding mr-1"></div>
            <span>Holding</span>
          </div>
        </div>
      </div>
      
      {/* Map through the call lines */}
      {callLines.map((line) => (
        <CallLine key={line.id} line={line} />
      ))}
      
      {/* Audio Routing Controls */}
      <div className="mt-auto p-4 bg-neutral-100 border-t border-neutral-200">
        <h3 className="text-sm font-semibold mb-2">Audio Routing</h3>
        
        <div className="space-y-2">
          {callLines.map((line) => (
            <AudioRouting 
              key={line.id}
              lineId={line.id}
              outputChannel={audioRouting.find(r => r.lineId === line.id)?.outputChannel || `CH ${line.id}`}
              onOutputChannelChange={(channel) => handleRoutingChange(line.id, channel)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

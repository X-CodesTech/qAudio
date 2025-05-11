import { useVoIP } from '@/contexts/VoIPContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AudioRouting from './AudioRouting';

export default function AudioRoutingPanel() {
  const { callLines, audioRouting, updateAudioRouting } = useVoIP();
  
  // Filter to only show active lines
  const activeLines = callLines.filter(line => 
    line.status === 'active' || 
    line.status === 'on-air' || 
    line.status === 'holding'
  );
  
  if (activeLines.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audio Routing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-6">
            No active calls to route
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Audio Routing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeLines.map(line => {
          const routing = audioRouting.find(r => r.lineId === line.id);
          const outputChannel = routing ? routing.outputChannel : `CH ${line.id}`;
          
          return (
            <div key={line.id} className="pb-2 border-b last:border-0 last:pb-0">
              <div className="flex justify-between items-center mb-1">
                <div className="font-medium text-sm">Line {line.id}</div>
                <div className="text-xs px-2 py-0.5 rounded-full bg-muted">
                  {line.status.charAt(0).toUpperCase() + line.status.slice(1)}
                </div>
              </div>
              <AudioRouting 
                lineId={line.id}
                outputChannel={outputChannel}
                onOutputChannelChange={(channel) => updateAudioRouting(line.id, channel)}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
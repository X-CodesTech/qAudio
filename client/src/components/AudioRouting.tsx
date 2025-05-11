import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVoIP } from '@/contexts/VoIPContext';
import { CallStatus } from '@shared/schema';

type AudioRoutingProps = {
  lineId: number;
  outputChannel: string;
  onOutputChannelChange: (channel: string) => void;
};

// Map status to style
const getStatusStyle = (status: CallStatus | undefined) => {
  switch(status) {
    case 'on-air':
      return 'border-status-onair text-status-onair';
    case 'active':
      return 'border-status-active text-status-active';
    case 'holding':
      return 'border-status-holding text-status-holding';
    case 'ringing':
      return 'border-status-ringing text-status-ringing';
    default:
      return 'border-gray-200 text-gray-700';
  }
};

export default function AudioRouting({ lineId, outputChannel, onOutputChannelChange }: AudioRoutingProps) {
  const { callLines } = useVoIP();
  const line = callLines.find(l => l.id === lineId);
  const statusStyle = getStatusStyle(line?.status);
  
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <div className={`w-2 h-2 rounded-full mr-2 ${
          line?.status === 'on-air' ? 'bg-status-onair animate-on-air-blink' :
          line?.status === 'active' ? 'bg-status-active' :
          line?.status === 'holding' ? 'bg-status-holding' :
          line?.status === 'ringing' ? 'bg-status-ringing animate-pulse' :
          'bg-status-inactive'
        }`}></div>
        <span className="text-sm">Line {lineId}</span>
      </div>
      <Select
        value={outputChannel}
        onValueChange={onOutputChannelChange}
      >
        <SelectTrigger className={`w-20 h-6 text-xs border ${statusStyle}`}>
          <SelectValue placeholder={outputChannel} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="CH 1">CH 1</SelectItem>
          <SelectItem value="CH 2">CH 2</SelectItem>
          <SelectItem value="CH 3">CH 3</SelectItem>
          <SelectItem value="CH 4">CH 4</SelectItem>
          <SelectItem value="CH 5">CH 5</SelectItem>
          <SelectItem value="CH 6">CH 6</SelectItem>
          <SelectItem value="CH 7">CH 7</SelectItem>
          <SelectItem value="CH 8">CH 8</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

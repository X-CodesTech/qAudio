import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DialPad from './DialPad';
import QuickDialContacts from './QuickDialContacts';
import CallHistory from './CallHistory';

type ContentTabsProps = {
  selectedLineId?: number | null;
  onSelectLine?: (lineId: number) => void;
}

export default function ContentTabs({ selectedLineId, onSelectLine }: ContentTabsProps) {
  const [activeTab, setActiveTab] = useState<string>("dial");

  return (
    <div className="flex-1 flex flex-col">
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full flex-1 flex flex-col"
      >
        <TabsList className="bg-zinc-800 border-b border-zinc-700 justify-start rounded-none shadow-sm">
          <TabsTrigger 
            value="dial" 
            className={`px-3 py-2 text-sm ${activeTab === 'dial' 
              ? 'text-zinc-100 font-medium border-b-2 border-blue-600'
              : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            Dial Pad
          </TabsTrigger>
          <TabsTrigger 
            value="phone-book" 
            className={`px-3 py-2 text-sm ${activeTab === 'phone-book' 
              ? 'text-zinc-100 font-medium border-b-2 border-blue-600'
              : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            Phone Book
          </TabsTrigger>
          <TabsTrigger 
            value="call-history" 
            className={`px-3 py-2 text-sm ${activeTab === 'call-history' 
              ? 'text-zinc-100 font-medium border-b-2 border-blue-600'
              : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            Call History
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dial" className="flex-1 p-2 overflow-auto bg-zinc-900">
          <DialPad selectedLineId={selectedLineId} onSelectLine={onSelectLine} />
        </TabsContent>
        
        <TabsContent value="phone-book" className="flex-1 p-2 overflow-auto bg-zinc-900">
          <div className="max-w-md mx-auto">
            <h2 className="text-sm font-semibold mb-2 text-zinc-200">Phone Book</h2>
            <QuickDialContacts />
          </div>
        </TabsContent>
        
        <TabsContent value="call-history" className="flex-1 p-2 overflow-auto bg-zinc-900">
          <div className="max-w-md mx-auto">
            <h2 className="text-sm font-semibold mb-2 text-zinc-200">Call History</h2>
            <CallHistory selectedLineId={selectedLineId} onSelectLine={onSelectLine} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

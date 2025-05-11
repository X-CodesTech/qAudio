import React, { FC, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from 'lucide-react';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ChatMessage {
  id: number;
  text: string;
  sender: string;
  timestamp: Date;
}

interface ChatWindowProps {
  messages: ChatMessage[];
  newMessage: string;
  setNewMessage: (message: string) => void;
  sendMessage: () => void;
  className?: string;
}

const ChatWindow: FC<ChatWindowProps> = ({ 
  messages, 
  newMessage, 
  setNewMessage, 
  sendMessage, 
  className = '' 
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle key press for Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-4">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex items-start gap-2 ${
                message.sender === 'system' 
                  ? 'justify-center' 
                  : message.sender === 'me' 
                    ? 'justify-end' 
                    : 'justify-start'
              }`}
            >
              {message.sender !== 'system' && message.sender !== 'me' && (
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarFallback className="bg-red-800 text-white text-xs">
                    {message.sender.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div 
                className={`rounded-lg px-3 py-2 max-w-[85%] ${
                  message.sender === 'system' 
                    ? 'bg-slate-800/60 text-slate-300 text-xs italic' 
                    : message.sender === 'me' 
                      ? 'bg-blue-900/60 text-white' 
                      : 'bg-zinc-800/60 text-white'
                }`}
              >
                {message.sender !== 'system' && (
                  <div className="flex justify-between items-center gap-2 mb-1">
                    <span className="text-xs font-semibold">
                      {message.sender === 'me' ? 'You' : message.sender}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {format(new Date(message.timestamp), 'HH:mm')}
                    </span>
                  </div>
                )}
                <div className={message.sender === 'system' ? 'text-center' : ''}>
                  {message.text}
                </div>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>
      
      <div className="p-2 border-t border-zinc-800 bg-zinc-900/50">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            className="bg-zinc-800 border-zinc-700"
          />
          <Button 
            onClick={sendMessage}
            disabled={!newMessage.trim()} 
            size="icon"
            className="bg-red-900 hover:bg-red-800 rounded-lg"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
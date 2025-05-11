import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChatWindow from "@/components/ChatWindow";
import { StudioBadge } from "./StudioBadge";

type ChatTab = {
  id: string;
  label: string;
  studioId: 'A' | 'B' | 'C' | 'D' | 'RE' | 'TECH';
  badgeColor?: string;
};

interface TabbedChatWindowProps {
  userRole: string;
  className?: string;
}

/**
 * TabbedChatWindow component that allows producers to switch between different chat conversations
 * with Talent A, Talent B, Tech, and Remote Studio
 */
export default function TabbedChatWindow({ userRole, className }: TabbedChatWindowProps) {
  const [activeTab, setActiveTab] = useState<string>("studioA");

  // Define the chat tabs
  const chatTabs: ChatTab[] = [
    { id: "studioA", label: "Studio A", studioId: 'A', badgeColor: "#D27D2D" },
    { id: "studioB", label: "Studio B", studioId: 'B', badgeColor: "#2D8D27" },
    { id: "studioC", label: "Studio C", studioId: 'C', badgeColor: "#2D7D8D" }, // Blue color for Studio C
    { id: "studioD", label: "Studio D", studioId: 'D', badgeColor: "#7D2D8D" }, // Purple color for Studio D
    { id: "tech", label: "Tech", studioId: 'TECH', badgeColor: "#7D2D8D" },
    { id: "remote", label: "Remote Studio", studioId: 'RE', badgeColor: "#D22D2D" }
  ];

  // Since 'TECH' is not a valid studioId for the ChatWindow component, we map it to 'A' and add a prefix
  const getStudioId = (tab: ChatTab): 'A' | 'B' | 'C' | 'D' | 'RE' => {
    if (tab.studioId === 'TECH') return 'A';
    return tab.studioId as 'A' | 'B' | 'C' | 'D' | 'RE';
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <Tabs defaultValue="studioA" value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
        <TabsList className="grid grid-cols-6 mb-2">
          {chatTabs.map((tab) => (
            <TabsTrigger 
              key={tab.id} 
              value={tab.id}
              className="relative"
            >
              <div className="flex items-center gap-1.5">
                <StudioBadge studioId={tab.studioId} showLabel={false} size="sm" />
                <span>{tab.label}</span>
              </div>
            </TabsTrigger>
          ))}
        </TabsList>

        {chatTabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="flex-grow">
            <ChatWindow 
              userRole={userRole}
              studioId={getStudioId(tab)}
              className="h-full"
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
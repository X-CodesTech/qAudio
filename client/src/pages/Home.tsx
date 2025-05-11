import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CallLinesPanel from "@/components/CallLinesPanel";
import ContentTabs from "@/components/ContentTabs";
import CallDetailsPanel from "@/components/CallDetailsPanel";
import { useVoIP } from "@/hooks/useVoIP";

export default function Home() {
  const { initializeVoIP } = useVoIP();

  useEffect(() => {
    // Initialize VoIP system when component mounts
    initializeVoIP();
  }, [initializeVoIP]);

  return (
    <div className="bg-gray-100 font-sans text-neutral-500 h-screen flex flex-col">
      <Header />
      
      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - Call lines and status */}
        <CallLinesPanel />

        {/* Main content area with tabs */}
        <ContentTabs />
        
        {/* Right sidebar - Call details & notes */}
        <CallDetailsPanel />
      </div>

      <Footer />
    </div>
  );
}

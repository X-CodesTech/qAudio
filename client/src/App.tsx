import React from "react";
import { useLocation, Route, Switch } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { AiDjProvider } from "@/contexts/AiDjContext";
import { AudioPlayerProvider } from "@/lib/AudioPlayerService";
import { RadioAutomationProvider } from "@/contexts/RadioAutomationContext";
import { SocketIOProvider } from "@/contexts/SocketIOContext";
import MAirlistStylePage from "@/pages/MAirlistStylePage";
import LibraryPage from "@/pages/LibraryPage";
import WaveInteractionDemo from "@/pages/WaveInteractionDemo";
import AdminLayout from "@/components/AdminLayout";
import ProductionLayout from "@/components/ProductionLayout";
import TalentLayout from "@/components/TalentLayout";
import TalentTestANew from "@/pages/TalentTestANew";
import TalentTestBNew from "@/pages/TalentTestBNew";
import TestLinks from "@/pages/TestLinks";
import RemoteStudioView from "@/pages/RemoteStudioView";
import LandingPage from "@/pages/LandingPage";
import TestPlayerPage from "@/pages/TestPlayerPage";
import TrafficPage from "@/pages/TrafficPage";
import TransmittersPage from "@/pages/TransmittersPage";
import AudioLoggerPage from "@/pages/AudioLoggerPage";
import LoggerAccessPage from "@/pages/LoggerAccessPage";
import StudioDashboardPage from "@/pages/StudioDashboardPage";
import InternetRadioPage from "@/pages/InternetRadioPage";
import StreamingPage from "@/pages/StreamingPage";
import GlobalTransmitterAlarm from "@/components/GlobalTransmitterAlarm";
import TechViewNew from "@/pages/TechViewNew";

function App() {
  // Import the required hooks from our contexts
  const { currentUser } = useAuth();
  const [location] = useLocation();

  // Always display landing page if on root path
  if (location === '/') {
    return (
      <>
        {/* Global Transmitter Alarm - appears on all pages when triggered */}
        <GlobalTransmitterAlarm />
        <LandingPage />
      </>
    );
  }

  // Show the appropriate view based on URL path without authentication
  return (
    <div>
      {/* Global Transmitter Alarm - appears on all pages when triggered */}
      <GlobalTransmitterAlarm />
      
      <Switch>
        {/* Special route for the Wave Interaction Demo */}
        <Route path="/wave-demo">
          <WaveInteractionDemo />
        </Route>
        
        {/* Admin routes */}
        <Route path="/admin">
          <AdminLayout />
        </Route>
        
        {/* Producer route */}
        <Route path="/producer">
          <ProductionLayout />
        </Route>
        
        {/* Tech route */}
        <Route path="/tech">
          <div className="min-h-screen bg-gray-950">
            <TechViewNew />
          </div>
        </Route>
        
        {/* Talent routes */}
        <Route path="/talents">
          <TalentLayout />
        </Route>
        
        <Route path="/talents-b">
          <TalentLayout />
        </Route>
        
        {/* Direct talent test routes for testing */}
        <Route path="/talent-test-a">
          <TalentTestANew />
        </Route>
        
        <Route path="/talent-test-b">
          <TalentTestBNew />
        </Route>
        
        {/* Test links page - easy access to test views */}
        <Route path="/test-links">
          <TestLinks />
        </Route>
        
        {/* Radio automation and playout route */}
        <Route path="/radio-automation">
          <div className="h-screen overflow-hidden bg-zinc-950 text-zinc-100 flex flex-col">
            <MAirlistStylePage />
          </div>
        </Route>
        
        {/* Remote studio route */}
        <Route path="/remote-studio">
          <div className="min-h-screen bg-zinc-900 text-zinc-100">
            <div className="container mx-auto px-4 py-4">
              <RemoteStudioView />
            </div>
          </div>
        </Route>
        
        {/* Test audio player route */}
        <Route path="/test-player">
          <div className="min-h-screen bg-zinc-900 text-zinc-100">
            {/* Wrap in RadioAutomation context */}
            <RadioAutomationProvider>
              <TestPlayerPage />
            </RadioAutomationProvider>
          </div>
        </Route>
        
        {/* Traffic management route */}
        <Route path="/traffic">
          <div className="min-h-screen bg-background">
            <RadioAutomationProvider>
              <TrafficPage />
            </RadioAutomationProvider>
          </div>
        </Route>
        
        {/* Transmitters monitoring route */}
        <Route path="/transmitters">
            <TransmittersPage />
        </Route>
        
        {/* Standalone Library Page route */}
        <Route path="/library">
          <RadioAutomationProvider>
            <LibraryPage />
          </RadioAutomationProvider>
        </Route>

        {/* Audio Logger route */}
        <Route path="/audio-logger">
          <div className="min-h-screen bg-black">
            <AudioLoggerPage />
          </div>
        </Route>

        {/* Logger Access route */}
        <Route path="/logger-access">
          <div className="min-h-screen bg-gray-950">
            <LoggerAccessPage />
          </div>
        </Route>

        {/* Studio Dashboard route */}
        <Route path="/studio-dashboard">
          <div className="min-h-screen bg-gray-950">
            <StudioDashboardPage />
          </div>
        </Route>

        {/* Internet Radio route */}
        <Route path="/internet-radio">
          <div className="min-h-screen bg-gray-950">
            <InternetRadioPage />
          </div>
        </Route>
        
        {/* Streaming route */}
        <Route path="/streaming">
          <div className="min-h-screen bg-gray-950">
            <StreamingPage />
          </div>
        </Route>
        
        {/* Default route - fallback to landing page */}
        <Route>
          <LandingPage />
        </Route>
      </Switch>
    </div>
  );
}

// Wrap the App with all the providers we need
const AppWithProviders = () => (
  <AiDjProvider>
    <AudioPlayerProvider>
      <SocketIOProvider>
        <App />
      </SocketIOProvider>
    </AudioPlayerProvider>
  </AiDjProvider>
);

export default AppWithProviders;
import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import App from "./App";
import "./index.css";
// Import i18n configuration
import "./i18n/i18n";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { BuzzerNotificationProvider } from "@/contexts/BuzzerNotificationContext";
import { CountdownProvider } from "@/contexts/CountdownContext";
import { StudioModeProvider } from "@/contexts/StudioModeContext";
import { VoIPProvider } from "@/contexts/VoIPContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <ThemeProvider>
            <TooltipProvider>
              <BuzzerNotificationProvider>
                <CountdownProvider>
                  <StudioModeProvider>
                    <VoIPProvider>
                      <App />
                      <Toaster />
                    </VoIPProvider>
                  </StudioModeProvider>
                </CountdownProvider>
              </BuzzerNotificationProvider>
            </TooltipProvider>
          </ThemeProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </StrictMode>
);

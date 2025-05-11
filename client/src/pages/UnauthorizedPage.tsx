import React from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import MazenStudioLogo from '@/assets/mazen_studio_logo_wide.png';

export default function UnauthorizedPage() {
  const [, navigate] = useLocation();
  const { currentUser, logoutMutation } = useAuth();

  const handleGoBack = () => {
    navigate('/');
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <img src={MazenStudioLogo} alt="Mazen Studio" className="h-20 mx-auto mb-8" />
        
        <div className="bg-destructive/10 p-6 rounded-lg border border-destructive mb-8">
          <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            Sorry, you don't have permission to access this page. This area is restricted to specific user roles.
          </p>
          
          {currentUser && (
            <div className="bg-background p-4 rounded-md mb-4">
              <p className="text-sm mb-1">Logged in as:</p>
              <p className="font-medium">{currentUser.displayName || currentUser.username}</p>
              <p className="text-xs mt-1 capitalize">Role: {currentUser.role}</p>
            </div>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={handleGoBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back Home
          </Button>
          
          <Button 
            variant="destructive" 
            className="flex-1"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Log Out
          </Button>
        </div>
      </div>
    </div>
  );
}
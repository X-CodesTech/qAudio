import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import TalentsView from '@/pages/TalentsView';
import { Link } from 'wouter';
import { Home } from 'lucide-react';

interface TalentLayoutProps {
  children?: React.ReactNode;
}

export default function TalentLayout({ children }: TalentLayoutProps) {
  const { currentUser } = useAuth();
  
  // Only render for talent users
  if (currentUser?.role !== 'talent') {
    return <>{children}</>;
  }
  
  // Admin header with navigation to admin page
  const renderAdminHeader = () => {
    if (currentUser?.role !== 'admin') return null;
    
    return (
      <div className="bg-zinc-800 border-b border-zinc-700 py-2 mb-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link href="/admin" onClick={() => window.scrollTo(0, 0)}>
            <div className="flex items-center text-blue-500 hover:text-blue-400 cursor-pointer">
              <Home className="h-5 w-5 mr-2" />
              <span className="font-medium">Admin Home</span>
            </div>
          </Link>
          <div className="text-sm text-zinc-400">
            Logged in as <span className="text-zinc-200 font-medium">{currentUser.displayName || currentUser.username}</span>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100">
      {renderAdminHeader()}
      <div className="container mx-auto px-4 py-4">
        <TalentsView />
      </div>
    </div>
  );
}
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';

interface MainLayoutProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export default function MainLayout({ children, requireAuth = true }: MainLayoutProps) {
  const { currentUser, isLoading } = useAuth();
  
  // Header has been removed to save space
  
  return (
    <>
      {/* Header removed */}
      <div> 
        {children}
      </div>
    </>
  );
}
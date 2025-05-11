import React, { ReactNode } from 'react';
import { Route, Redirect, useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@shared/schema';

interface ProtectedRouteProps {
  children: ReactNode;
  path: string;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({
  children,
  path,
  allowedRoles = [],
}: ProtectedRouteProps) {
  const { currentUser, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  console.log(`ProtectedRoute for path ${path}: user=${currentUser?.username || 'none'}, loading=${isLoading}`);

  return (
    <Route path={path}>
      {() => {
        // If we're still loading the user, show a loading spinner
        if (isLoading) {
          console.log(`ProtectedRoute ${path}: Still loading user data...`);
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }

        // If user is not logged in, redirect to login
        if (!currentUser) {
          console.log(`ProtectedRoute ${path}: No user found, redirecting to login`);
          // Redirect to login page with a return URL
          setTimeout(() => {
            setLocation(`/login?returnUrl=${encodeURIComponent(path)}`);
          }, 100);
          return (
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                <p>Redirecting to login page...</p>
              </div>
            </div>
          );
        }

        // If we're checking roles and user doesn't have permission
        if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
          console.log(`ProtectedRoute ${path}: User ${currentUser.username} does not have required role (${currentUser.role})`);
          console.log(`Required roles: ${allowedRoles.join(', ')}`);
          // Redirect to unauthorized page
          setTimeout(() => {
            setLocation('/unauthorized');
          }, 100);
          return (
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                <p>Checking permissions...</p>
              </div>
            </div>
          );
        }

        // User is authenticated and authorized
        console.log(`ProtectedRoute ${path}: User ${currentUser.username} authorized, rendering children`);
        return children;
      }}
    </Route>
  );
}
import React from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { 
  Radio, 
  Headphones, 
  Activity,
  Settings,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminViewTabs() {
  const [location] = useLocation();
  const currentPath = location || '/';
  const { currentUser } = useAuth();
  
  // Only render for admin users
  if (currentUser?.role !== 'admin') {
    return null;
  }
  
  // Navigation items with icons, colors, and paths
  const navItems = [
    // Producer tab removed from tabs to avoid redundant navigation
    // when already in Producer view
    { 
      name: 'Talents', 
      path: '/talents', 
      icon: <Headphones className="h-3 w-3 mr-1" />, 
      color: 'text-blue-500',
      activeColor: 'bg-blue-900/20'
    },
    { 
      name: 'RE Studio', 
      path: '/remote-studio', 
      icon: <Headphones className="h-3 w-3 mr-1" />, 
      color: 'text-red-500',
      activeColor: 'bg-red-900/20'
    },
    { 
      name: 'Tech', 
      path: '/tech', 
      icon: <Activity className="h-3 w-3 mr-1" />, 
      color: 'text-purple-500',
      activeColor: 'bg-purple-900/20'
    },
    {
      name: 'Dashboard',
      path: '/performance-dashboard',
      icon: <BarChart3 className="h-3 w-3 mr-1" />,
      color: 'text-yellow-500',
      activeColor: 'bg-yellow-900/20'
    },
    { 
      name: 'Admin', 
      path: '/admin', 
      icon: <Settings className="h-3 w-3 mr-1" />, 
      color: 'text-blue-500',
      activeColor: 'bg-blue-900/20'
    }
  ];

  // Don't show navigation tabs on certain views
  if (currentPath === "/" || 
      currentPath === "/producer" || 
      currentPath === "/performance-dashboard") {
    return null;
  }

  return (
    <>
      {navItems.map((item) => (
        <Link
          key={item.path}
          href={item.path}
          // Removed automatic scrolling to prevent Tech and Talents tabs scrolling down
          className={cn(
            "flex items-center px-2 py-1 rounded transition-colors whitespace-nowrap text-xs ml-1",
            currentPath === item.path 
              ? "bg-zinc-800 text-white" 
              : "text-zinc-300 hover:bg-zinc-800/50"
          )}
        >
          {item.icon}
          {item.name}
        </Link>
      ))}
    </>
  );
}
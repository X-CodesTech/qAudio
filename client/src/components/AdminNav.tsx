import React from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { 
  UserCircle, 
  Radio, 
  Headphones, 
  Activity,
  Settings,
  BarChart
} from 'lucide-react';

interface AdminNavProps {
  className?: string;
}

export default function AdminNav({ className }: AdminNavProps) {
  const [location] = useLocation();
  const currentPath = location || '/';
  const { currentUser } = useAuth();
  
  // Log admin nav user info for debugging
  console.log('Admin navigation rendered for user:', currentUser?.displayName);
  
  // Navigation items with icons, colors, and paths
  const navItems = [
    { 
      name: 'Producer View', 
      path: '/producer', 
      icon: <Radio className="h-4 w-4 mr-2" />, 
      color: 'text-orange-500',
      activeColor: 'bg-orange-900/20'
    },
    { 
      name: 'Talents', 
      path: '/talents', 
      icon: <Headphones className="h-4 w-4 mr-2" />, 
      color: 'text-blue-500',
      activeColor: 'bg-blue-900/20'
    },
    { 
      name: 'RE Studio', 
      path: '/remote-studio', 
      icon: <Headphones className="h-4 w-4 mr-2" />, 
      color: 'text-red-500',
      activeColor: 'bg-red-900/20'
    },
    { 
      name: 'Tech', 
      path: '/tech', 
      icon: <Activity className="h-4 w-4 mr-2" />, 
      color: 'text-purple-500',
      activeColor: 'bg-purple-900/20'
    },
    { 
      name: 'Admin', 
      path: '/admin', 
      icon: <Settings className="h-4 w-4 mr-2" />, 
      color: 'text-blue-500',
      activeColor: 'bg-blue-900/20'
    }
  ];

  // Return the map of navigation items directly without a wrapper element
  return (
    <>
      {navItems.map((item) => (
        <Link
          key={item.path}
          href={item.path}
          onClick={() => window.scrollTo(0, 0)} // Add this scroll behavior on all links
          className={cn(
            "flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
            currentPath === item.path || 
            (currentPath === "/" && item.path === "/producer") // Consider the root as producer view
              ? `${item.color} ${item.activeColor}` 
              : "text-gray-400 hover:text-gray-100 hover:bg-zinc-800"
          )}
        >
          {item.icon}
          {item.name}
        </Link>
      ))}
    </>
  );
}
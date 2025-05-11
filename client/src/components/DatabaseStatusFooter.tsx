import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Database } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

/**
 * A thin footer component that displays database connection status
 */
export const DatabaseStatusFooter: React.FC = () => {
  const [status, setStatus] = useState<'connected' | 'error' | 'checking'>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  // Check database connection status
  const checkDatabaseStatus = async () => {
    setStatus('checking');
    try {
      // Makes a simple API request to check connection status
      const response = await apiRequest('GET', '/api/radio/playback');
      if (response.ok) {
        setStatus('connected');
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Error checking database status:', error);
      setStatus('error');
    }
    setLastChecked(new Date());
  };

  useEffect(() => {
    // Check status on initial load
    checkDatabaseStatus();

    // Set up interval to check status every minute
    const intervalId = setInterval(checkDatabaseStatus, 60000); // 60 seconds
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  // Define color and icon based on status
  const getStatusInfo = () => {
    switch (status) {
      case 'connected':
        return {
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
          icon: <CheckCircle className="h-4 w-4 mr-1.5" />,
          text: 'Database Connected'
        };
      case 'error':
        return {
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          icon: <XCircle className="h-4 w-4 mr-1.5" />,
          text: 'Database Connection Error'
        };
      case 'checking':
      default:
        return {
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          icon: <AlertCircle className="h-4 w-4 mr-1.5" />,
          text: 'Checking Database Connection...'
        };
    }
  };

  const statusInfo = getStatusInfo();
  
  return (
    <footer className="w-full py-1 px-3 border-t border-zinc-800 bg-zinc-900 text-xs flex justify-between items-center">
      <div className="flex items-center">
        <Database className="h-3.5 w-3.5 text-zinc-400 mr-1.5" />
        <span className="text-zinc-400 mr-3">Mazen Studio</span>

        <div className={`flex items-center ${statusInfo.color}`}>
          {statusInfo.icon}
          <span>{statusInfo.text}</span>
        </div>
      </div>
      
      {lastChecked && (
        <div className="text-zinc-500">
          Last checked: {lastChecked.toLocaleTimeString()}
        </div>
      )}
    </footer>
  );
};

export default DatabaseStatusFooter;
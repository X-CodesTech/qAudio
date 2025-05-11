import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import DeviceConnectionDemo from '@/components/DeviceConnectionDemo';
import { useRole } from '@/App';

export default function DeviceConnectionsPage() {
  const { role } = useRole();
  
  return (
    <div className="container mx-auto py-8">
      <header className="mb-8">
        <div className="flex justify-between items-center">
          <div className="flex space-x-4 items-center">
            <Link href="/">
              <div className="flex items-center space-x-2 cursor-pointer">
                <Button variant="outline" size="sm" className="flex items-center">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <h1 className="text-2xl font-bold text-emerald-700">Mazen Studio Device Connections</h1>
              </div>
            </Link>
          </div>
        </div>
      </header>
      
      <div className="grid grid-cols-1 gap-8">
        <DeviceConnectionDemo />
        
        <div className="bg-emerald-50 p-6 rounded-lg border border-emerald-200 shadow-sm">
          <h2 className="text-xl font-semibold text-emerald-700 mb-3">About Device Connection Pulse</h2>
          <p className="mb-4">
            This feature provides real-time visual feedback about the connection status of various 
            devices in your broadcast setup. The pulsing indicators help quickly identify which 
            devices are connected and operational.
          </p>
          
          <h3 className="text-lg font-medium text-emerald-600 mt-6 mb-2">Usage in the Mazen Studio System</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
            <li>
              <span className="font-medium">Input/output devices:</span> Microphones, speakers, and audio interfaces 
              show their connection status with green and blue indicators.
            </li>
            <li>
              <span className="font-medium">Network connections:</span> Primary and backup network connections 
              use yellow indicators to show health status.
            </li>
            <li>
              <span className="font-medium">Servers and services:</span> SIP servers and other critical services 
              use purple indicators when connected.
            </li>
          </ul>
          
          <p className="text-sm text-gray-500 mt-6">
            The animation options allow you to customize the appearance based on your preferences.
            Choose between pulse, blink, and wave animations with variable speeds for different visual feedback.
          </p>
        </div>
      </div>
    </div>
  );
}
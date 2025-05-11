import React from 'react';
import ProducerView from '@/pages/ProducerView';
import { LineCountProvider } from '@/contexts/LineCountContext';

// Simplified ProductionLayout component that only shows the producer view
export default function ProductionLayout() {
  console.log('Using producer-only layout');
  
  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100">
      <div className="container mx-auto px-4 py-4">
        <LineCountProvider>
          <ProducerView />
        </LineCountProvider>
      </div>
    </div>
  );
}
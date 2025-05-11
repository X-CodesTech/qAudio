import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Phone, Settings } from 'lucide-react';

// This simplified Navbar doesn't use useRole to avoid circular dependencies
export default function Navbar({ role = 'admin' }: { role?: 'admin' | 'producer' | 'talent' }) {
  const isAdmin = role === 'admin';
  
  return (
    <div className="hidden">
      {/* Header removed as per user request */}
    </div>
  );
}
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

/**
 * TestLinks Page
 * 
 * A simple page that provides direct links to test pages like Talent Test A & B.
 * This page intentionally has no authentication requirements.
 */
export default function TestLinks() {
  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-zinc-800 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-2xl text-center">QCaller Studio Test Pages</CardTitle>
          <CardDescription className="text-center text-zinc-400">
            Click on any link below to access the test pages directly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <Link href="/talent-test-a">
              <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white" size="lg">
                Talent Test A (Studio A)
              </Button>
            </Link>
            
            <Link href="/talent-test-b">
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white" size="lg">
                Talent Test B (Studio B)
              </Button>
            </Link>
            
            <Link href="/">
              <Button className="w-full" variant="outline" size="lg">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
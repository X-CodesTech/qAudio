import { useState } from 'react';
import QcallerLogo from "@/assets/qcaller_logo_v4.png";

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Login failed');
      }

      const userData = await response.json();
      console.log('Login successful:', userData);
      
      // Determine redirect based on role
      let redirectPath = '/';
      if (userData.role === 'talent') {
        redirectPath = '/talent-a';
      } else if (userData.role === 'tech') {
        redirectPath = '/tech';
      } else {
        redirectPath = '/producer';
      }
      
      // Use direct window location change with full URL
      const baseUrl = window.location.origin;
      window.location.replace(`${baseUrl}${redirectPath}`);
      
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md border border-gray-700">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-6">
            <img src={QcallerLogo} alt="QCaller Studio" className="h-20" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-white">QCaller Studio</h1>
          <p className="text-gray-400">Please sign in to continue</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 text-red-200 rounded">
            {error}
          </div>
        )}
        
        <form className="space-y-5" onSubmit={handleLogin}>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">Username</label>
            <input
              type="text"
              className="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">Password</label>
            <input
              type="password"
              className="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-400">
          <p>All users: admin, producer, talent, tech</p>
          <p>Password for all: 123456</p>
        </div>
      </div>
    </div>
  );
}
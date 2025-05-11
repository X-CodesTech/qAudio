import { useState } from 'react';

// Simple auth hook for the studio demo
export const useAuth = () => {
  const [user, setUser] = useState({ 
    id: 1, 
    username: 'producer',
    displayName: 'Studio Producer',
    role: 'producer'
  });

  const logoutMutation = {
    mutate: (params: any, options: { onSuccess: () => void }) => {
      // Instead of setting to null (which would cause a type error),
      // we just navigate and let the auth page handle things
      options.onSuccess();
    }
  };

  return {
    user,
    logoutMutation
  };
};
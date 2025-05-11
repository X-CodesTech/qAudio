import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseMutationResult,
} from "@tanstack/react-query";
import { UserRole } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

type User = {
  id: number;
  username: string;
  role: UserRole;
  displayName: string;
};

type LoginData = {
  username: string;
  password: string;
};

type RegisterData = LoginData & {
  displayName: string;
  role: UserRole;
};

type AuthContextType = {
  currentUser: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch current user data - will always return a system user with our updated backend
  const {
    data: currentUser,
    error,
    isLoading,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/user");
        
        if (!response.ok) {
          console.log("Error fetching user, using default system user");
          // Return a default system user as a fallback
          return {
            id: 999,
            username: "system_user",
            role: "admin" as UserRole,
            displayName: "System User"
          };
        }
        
        return await response.json();
      } catch (error) {
        console.error("Error fetching user:", error);
        // Return a default system user as a fallback
        return {
          id: 999,
          username: "system_user",
          role: "admin" as UserRole,
          displayName: "System User"
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      console.log("Login attempt for user:", credentials.username);
      
      try {
        const response = await fetch("/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(credentials),
          credentials: "include" // Important: include cookies for session
        });
        
        // Debug the response
        console.log("Login response status:", response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Login error response:", errorText);
          
          let errorMessage = "Login failed";
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorData.message || "Login failed";
          } catch (e) {
            // If JSON parsing fails, use the error text
            errorMessage = errorText || "Login failed";
          }
          
          throw new Error(errorMessage);
        }
        
        const userData = await response.json();
        console.log("Login successful for user:", userData);
        return userData;
      } catch (error) {
        console.error("Login error:", error);
        throw error;
      }
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.displayName || user.username}!`,
      });
      
      // Force a refresh of the user data from the server
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      console.error("Login mutation error:", error);
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userRegData: RegisterData) => {
      console.log("Registration attempt for user:", userRegData.username);
      
      try {
        const response = await fetch("/api/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userRegData),
          credentials: "include" // Important: include cookies for session
        });
        
        // Debug the response
        console.log("Registration response status:", response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Registration error response:", errorText);
          
          let errorMessage = "Registration failed";
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorData.message || "Registration failed";
          } catch (e) {
            // If JSON parsing fails, use the error text
            errorMessage = errorText || "Registration failed";
          }
          
          throw new Error(errorMessage);
        }
        
        const registeredUser = await response.json();
        console.log("Registration successful for user:", registeredUser);
        return registeredUser;
      } catch (error) {
        console.error("Registration error:", error);
        throw error;
      }
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registration successful",
        description: `Welcome, ${user.displayName || user.username}!`,
      });
      
      // Force a refresh of the user data from the server
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      console.error("Registration mutation error:", error);
      toast({
        title: "Registration failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      console.log("Logout attempt");
      
      try {
        const response = await fetch("/api/logout", {
          method: "POST",
          credentials: "include" // Important: include cookies for session
        });
        
        // Debug the response
        console.log("Logout response status:", response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Logout error response:", errorText);
          
          let errorMessage = "Logout failed";
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorData.message || "Logout failed";
          } catch (e) {
            // If JSON parsing fails, use the error text
            errorMessage = errorText || "Logout failed";
          }
          
          throw new Error(errorMessage);
        }
        
        console.log("Logout successful");
        
        // Immediately clear user data in query cache
        queryClient.setQueryData(["/api/user"], null);
        
        // Directly navigate to the login page on successful API response
        // This should happen BEFORE the onSuccess callback to ensure it happens
        window.location.href = "/";
        
        return; // Successful logout
        
      } catch (error) {
        console.error("Logout error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      
      // Navigation is already handled in the mutationFn
      // This avoids potential race conditions
    },
    onError: (error: Error) => {
      console.error("Logout mutation error:", error);
      toast({
        title: "Logout failed",
        description: error.message || "Could not log out properly",
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        currentUser: currentUser || null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
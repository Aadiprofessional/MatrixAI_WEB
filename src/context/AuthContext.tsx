import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase, checkUser, signIn, signUp, signOut } from '../supabaseClient';

// Define the shape of the auth context state
interface AuthContextType {
  user: any;
  session: any;
  loading: boolean;
  signUp: (email: string, password: string, metadata: any) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  error: string | null;
  setError: (error: string | null) => void;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for an existing session
    const initSession = async () => {
      try {
        setLoading(true);
        
        // Get the session from Supabase
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        
        // Subscribe to auth changes
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
          }
        );

        return () => {
          authListener?.subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing auth:', error);
        setError('Failed to initialize authentication');
      } finally {
        setLoading(false);
      }
    };

    initSession();
  }, []);

  // Sign up a new user
  const handleSignUp = async (email: string, password: string, metadata: any = {}) => {
    try {
      setLoading(true);
      setError(null);
      return await signUp(email, password, metadata);
    } catch (error: any) {
      setError(error.message || 'An error occurred during sign-up');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign in a user
  const handleSignIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      return await signIn(email, password);
    } catch (error: any) {
      setError(error.message || 'Invalid email or password');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      setLoading(true);
      setError(null);
      await signOut();
      setUser(null);
      setSession(null);
    } catch (error: any) {
      setError(error.message || 'Failed to sign out');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Define the value object
  const value = {
    user,
    session,
    loading,
    signUp: handleSignUp,
    signIn: handleSignIn,
    signOut: handleSignOut,
    error,
    setError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 
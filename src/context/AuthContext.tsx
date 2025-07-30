import React, { createContext, useState, useEffect, useContext, useRef, ReactNode } from 'react';
import { supabase, checkUser, signIn, signUp, signOut, signInWithGoogle, signInWithApple } from '../supabaseClient';

// Define the shape of the auth context state
interface AuthContextType {
  user: any;
  session: any;
  loading: boolean;
  signUp: (email: string, password: string, metadata: any) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  signInWithApple: () => Promise<any>;
  signOut: () => Promise<void>;
  error: string | null;
  setError: (error: string | null) => void;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use refs to track if we've already initialized auth
  const authInitialized = useRef(false);
  const authCheckedFromLocalStorage = useRef(false);
  
  const [user, setUser] = useState<any>(() => {
    authCheckedFromLocalStorage.current = true;
    // Try to get user from localStorage when component mounts
    const storedUser = localStorage.getItem('matrixai_user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  
  const [session, setSession] = useState<any>(() => {
    // Try to get session from localStorage when component mounts
    const storedSession = localStorage.getItem('matrixai_session');
    return storedSession ? JSON.parse(storedSession) : null;
  });
  
  const [loading, setLoading] = useState(!authCheckedFromLocalStorage.current);
  const [error, setError] = useState<string | null>(null);

  // Track last time auth was refreshed from server
  const lastRefreshTime = useRef(0);
  const AUTH_REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes

  // Function to compare sessions to avoid unnecessary updates
  const isSameSession = (newSession: any, oldSession: any): boolean => {
    if (!newSession && !oldSession) return true;
    if (!newSession || !oldSession) return false;
    
    return newSession.access_token === oldSession.access_token &&
           newSession.refresh_token === oldSession.refresh_token;
  };

  // Function to verify session from server
  const verifySession = async (forceRefresh = false) => {
    try {
      const now = Date.now();
      
      // Skip verification if we've checked recently and force refresh is not required
      if (!forceRefresh && now - lastRefreshTime.current < AUTH_REFRESH_INTERVAL) {
        return;
      }
      
      // Get the session from Supabase
      const { data: { session: newSession } } = await supabase.auth.getSession();
      lastRefreshTime.current = now;
      
      if (newSession) {
        // Only update if session changed
        if (!isSameSession(newSession, session)) {
          localStorage.setItem('matrixai_session', JSON.stringify(newSession));
          localStorage.setItem('matrixai_user', JSON.stringify(newSession.user));
          
          setSession(newSession);
          setUser(newSession.user);
        }
      } else if (session) {
        // If we had a session but server says no session, clear it
        localStorage.removeItem('matrixai_session');
        localStorage.removeItem('matrixai_user');
        
        setSession(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Error verifying session:', error);
    }
  };

  useEffect(() => {
    // Prevent multiple initialization
    if (authInitialized.current) return;
    
    // Check for an existing session
    const initSession = async () => {
      try {
        // Check if we have a hash fragment from OAuth redirect
        const hasHashParams = window.location.hash && window.location.hash.includes('access_token');
        const hasQueryParams = window.location.search && window.location.search.includes('access_token');
        
        if (hasHashParams || hasQueryParams) {
          console.log('Detected OAuth redirect, setting session...');
          // Let Supabase handle the hash fragment
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            console.error('Error getting session from hash:', error);
          }
        }
        
        if (!authCheckedFromLocalStorage.current) {
          setLoading(true);
        }
        
        // Subscribe to auth changes
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            // Only update if session actually changed
            if (!isSameSession(newSession, session)) {
              if (newSession) {
                localStorage.setItem('matrixai_session', JSON.stringify(newSession));
                localStorage.setItem('matrixai_user', JSON.stringify(newSession.user));
                
                setSession(newSession);
                setUser(newSession.user);
              } else {
                localStorage.removeItem('matrixai_session');
                localStorage.removeItem('matrixai_user');
                
                setSession(null);
                setUser(null);
              }
            }
          }
        );
        
        // Verify session from server
        await verifySession(true);
        
        // Mark as initialized
        authInitialized.current = true;
        
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
    
    // Add visibility change listener to handle tab focus changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Just verify the session without full reload when tab becomes visible
        verifySession(false);
      }
    };
    
    // Handle page show event (when navigating back to the page via history)
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        // Page was restored from bfcache (back/forward cache)
        verifySession(false);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [session]);

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

  // Sign in with Google
  const handleSignInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      return await signInWithGoogle();
    } catch (error: any) {
      setError(error.message || 'Failed to sign in with Google');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign in with Apple
  const handleSignInWithApple = async () => {
    try {
      setLoading(true);
      setError(null);
      return await signInWithApple();
    } catch (error: any) {
      setError(error.message || 'Failed to sign in with Apple');
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
      localStorage.removeItem('matrixai_session');
      localStorage.removeItem('matrixai_user');
      localStorage.removeItem('matrixai_userData');
      localStorage.removeItem('matrixai_userDataTimestamp');
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
    signInWithGoogle: handleSignInWithGoogle,
    signInWithApple: handleSignInWithApple,
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
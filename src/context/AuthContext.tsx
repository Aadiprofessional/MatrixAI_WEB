import React, { createContext, useState, useEffect, useContext, useRef, ReactNode } from 'react';

// Define the User interface
export interface User {
  uid: string;
  id?: string; // For backward compatibility
  email: string;
  coins?: number;
  [key: string]: any; // Allow other properties
}

// Define the Session interface
interface Session {
  access_token: string;
  [key: string]: any; // Allow other properties
}

// Define the shape of the auth context state
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata: any) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  signInWithApple: () => Promise<any>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<any>;
  error: string | null;
  setError: (error: string | null) => void;
  setUserData: (userData: any, token: string) => void;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use refs to track if we've already initialized auth
  const authInitialized = useRef(false);
  const authCheckedFromLocalStorage = useRef(false);
  
  const [user, setUser] = useState<User | null>(() => {
    authCheckedFromLocalStorage.current = true;
    // Try to get user from localStorage when component mounts
    const storedUser = localStorage.getItem('userData') || localStorage.getItem('matrixai_user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  
  const [session, setSession] = useState<Session | null>(() => {
    // Try to get session from localStorage when component mounts
    const storedToken = localStorage.getItem('authToken') || localStorage.getItem('matrixai_session');
    return storedToken ? { access_token: storedToken } : null;
  });
  
  const [loading, setLoading] = useState(!authCheckedFromLocalStorage.current);
  const [error, setError] = useState<string | null>(null);

  // Function to set user data and token
  const setUserData = (userData: User, token: string) => {
    console.log('Setting user data in AuthContext:', userData);
    console.log('Setting token in AuthContext:', token);
    
    // Ensure userData has both uid and id for compatibility
    if (userData.uid && !userData.id) {
      userData.id = userData.uid;
    } else if (userData.id && !userData.uid) {
      userData.uid = userData.id;
    }
    
    // Store in new format
    localStorage.setItem('authToken', token);
    localStorage.setItem('userData', JSON.stringify(userData));
    
    // Store in legacy format for compatibility
    localStorage.setItem('matrixai_session', token);
    localStorage.setItem('matrixai_user', JSON.stringify(userData));
    
    // Update state
    setUser(userData);
    setSession({ access_token: token });
  };

  // Function to verify session from localStorage
  const verifySession = async (forceRefresh = false) => {
    try {
      console.log('Verifying session from localStorage...');
      
      // Check for stored auth token and user data from new API
      const storedToken = localStorage.getItem('authToken');
      const storedUserData = localStorage.getItem('userData');
      const storedSession = localStorage.getItem('matrixai_session');
      const storedUser = localStorage.getItem('matrixai_user');
      
      console.log('Found stored token:', !!storedToken);
      console.log('Found stored user data:', !!storedUserData);
      
      if (storedToken && (storedUserData || storedUser)) {
        // We have valid auth data, update context if needed
        let userData: User | null = null;
        
        if (storedUserData) {
          userData = JSON.parse(storedUserData);
        } else if (storedUser) {
          userData = JSON.parse(storedUser);
        }
        
        // Ensure userData has both uid and id for compatibility
        if (userData) {
          if (userData.uid && !userData.id) {
            userData.id = userData.uid;
          } else if (userData.id && !userData.uid) {
            userData.uid = userData.id;
          }
        }
        
        const sessionData: Session = { access_token: storedToken };
        
        console.log('Updating auth context with stored user data:', userData);
        setUser(userData);
        setSession(sessionData);
      } else if (user || session) {
        // No valid auth data but we have user/session in context, clear it
        console.log('No valid auth data found, clearing context...');
        setSession(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Error verifying session:', error);
      // Clear invalid data
      setSession(null);
      setUser(null);
    }
  };

  useEffect(() => {
    // Prevent multiple initialization
    if (authInitialized.current) return;
    
    // Initialize auth with new API system
    const initSession = async () => {
      try {
        if (!authCheckedFromLocalStorage.current) {
          setLoading(true);
        }
        
        console.log('Initializing auth context...');
        
        // Verify session from localStorage (new API system)
        await verifySession(true);
        
        // Mark as initialized
        authInitialized.current = true;
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
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_API_URL}/api/user/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, ...metadata }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Sign up failed');
      }
      
      return data;
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
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_API_URL}/api/user/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Invalid email or password');
      }
      
      if (data.success && data.data) {
        setUserData(data.data, data.data.token);
      }
      
      return data;
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
      // TODO: Implement Google OAuth with new API
      throw new Error('Google sign-in not implemented yet');
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
      // TODO: Implement Apple OAuth with new API
      throw new Error('Apple sign-in not implemented yet');
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
      
      // Clear all authentication data
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      localStorage.removeItem('matrixai_session');
      localStorage.removeItem('matrixai_user');
      localStorage.removeItem('matrixai_userData');
      localStorage.removeItem('matrixai_userDataTimestamp');
      
      setUser(null);
      setSession(null);
      
      console.log('User signed out successfully');
    } catch (error: any) {
      setError(error.message || 'Failed to sign out');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const handleResetPassword = async (email: string) => {
    try {
      setError(null);
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_API_URL}/api/user/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset email');
      }
      
      return data;
    } catch (error: any) {
      setError(error.message || 'An error occurred while sending reset email');
      throw error;
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
    resetPassword: handleResetPassword,
    error,
    setError,
    setUserData,
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
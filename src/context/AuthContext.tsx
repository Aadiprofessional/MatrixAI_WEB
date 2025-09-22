import React, { createContext, useState, useEffect, useContext, useRef, ReactNode, useCallback } from 'react';
import { signInWithGoogle as supabaseSignInWithGoogle, signInWithApple as supabaseSignInWithApple, signOut as supabaseSignOut, supabase } from '../supabaseClient';

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
  
  const [userState, setUserState] = useState<User | null>(() => {
    authCheckedFromLocalStorage.current = true;
    // Try to get user from localStorage when component mounts
    const storedUser = localStorage.getItem('userData') || localStorage.getItem('matrixai_user');
    console.log('🔍 AuthContext - Initial user from localStorage:', storedUser);
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    console.log('🔍 AuthContext - Parsed initial user:', parsedUser);
    return parsedUser;
  });
  
  // Wrapper function to log user state changes
  const setUser = (newUser: User | null) => {
    console.log('🔄 AuthContext - setUser called with:', newUser);
    console.log('🔄 AuthContext - Previous user was:', userState);
    setUserState(newUser);
  };
  
  const user = userState;
  
  // Track user state changes
  useEffect(() => {
    console.log('🔄 AuthContext - User state changed to:', user);
  }, [user]);
  
  const [session, setSession] = useState<Session | null>(() => {
    // Try to get session from localStorage when component mounts
    const storedToken = localStorage.getItem('authToken') || localStorage.getItem('matrixai_session');
    return storedToken ? { access_token: storedToken } : null;
  });
  
  const [loading, setLoading] = useState(!authCheckedFromLocalStorage.current);
  const [error, setError] = useState<string | null>(null);

  // Function to set user data and store in localStorage
  const setUserData = useCallback((userData: User, token: string) => {
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
  }, []);

  // Function to verify session from localStorage
  const verifySession = useCallback(async (forceRefresh = false) => {
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
        
        console.log('🔄 AuthContext - Updating auth context with stored user data:', userData);
        setUser(userData);
        setSession(sessionData);
      } else if (user || session) {
        // No valid auth data but we have user/session in context, clear it
        console.log('❌ AuthContext - No valid auth data found, clearing context...');
        setSession(null);
        setUser(null);
      }
    } catch (error) {
      console.error('❌ AuthContext - Error verifying session:', error);
      // Clear invalid data
      setSession(null);
      setUser(null);
    }
  }, [user, session]);

  // OAuth callback handler to sync Supabase users with backend
  const handleOAuthCallback = async (session: any) => {
    if (!session?.user) return;
    
    try {
      console.log('🔄 Handling OAuth callback for user:', session.user.email);
      setLoading(true);
      
      // Get user data from Supabase session
      const supabaseUser = session.user;
      
      console.log('👤 Supabase user data:', {
        id: supabaseUser.id,
        email: supabaseUser.email,
        metadata: supabaseUser.user_metadata
      });
      
      // Check if user exists in backend
      const backendUrl = process.env.REACT_APP_BACKEND_API_URL;
      if (!backendUrl) {
        console.warn('⚠️ Backend API URL not configured, using session data only');
        throw new Error('Backend API URL not configured');
      }
      
      const checkResponse = await fetch(`${backendUrl}/api/user/check-oauth-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          uid: session.user.id,
          email: session.user.email,
          provider: 'google'
        }),
      });
      
      // Handle case where backend endpoints don't exist yet
      if (checkResponse.status === 404) {
        console.warn('⚠️ OAuth endpoints not implemented in backend yet. Creating temporary user data.');
        throw new Error('OAuth endpoints not implemented');
      }
      
      if (!checkResponse.ok) {
        console.warn(`⚠️ Backend check failed: ${checkResponse.status}, using session data`);
        throw new Error(`Backend check failed: ${checkResponse.status}`);
      }
      
      const checkData = await checkResponse.json();
      
      if (checkData.exists) {
        // User exists, get their data and set in context
        console.log('✅ OAuth user exists in backend, setting user data');
        setUserData(checkData.user, session.access_token);
      } else {
        // User doesn't exist, create them in backend
        console.log('🆕 Creating new OAuth user in backend');
        const createResponse = await fetch(`${backendUrl}/api/user/create-oauth-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            uid: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
            provider: 'google',
            avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture
          }),
        });
        
        if (!createResponse.ok) {
          throw new Error(`Backend create failed: ${createResponse.status}`);
        }
        
        const createData = await createResponse.json();
        
        if (createData.success) {
          console.log('✅ OAuth user created successfully in backend');
          setUserData(createData.user, session.access_token);
        } else {
          console.error('❌ Failed to create OAuth user in backend:', createData.message);
          throw new Error(createData.message || 'Failed to create user in backend');
        }
      }
    } catch (error) {
      console.error('❌ Error handling OAuth callback:', error);
      
      // Create minimal user data from session as fallback
      const supabaseUser = session.user;
      if (supabaseUser) {
        const fallbackUserData = {
          uid: supabaseUser.id,
          email: supabaseUser.email || '',
          name: supabaseUser.user_metadata?.full_name || 
                supabaseUser.user_metadata?.name || 
                supabaseUser.user_metadata?.display_name ||
                supabaseUser.email?.split('@')[0] || 
                'User',
          avatar_url: supabaseUser.user_metadata?.avatar_url || 
                     supabaseUser.user_metadata?.picture || '',
          subscription_active: false,
          credits: 0,
          provider: 'google',
          is_fallback: true
        };
        
        console.log('🔄 Using fallback user data:', fallbackUserData);
        setUserData(fallbackUserData, session.access_token);
        return;
      }
      
      setError('Failed to complete authentication. Please try again.');
      // Clear the session if backend sync fails
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
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
        
        // Set up Supabase auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('🔄 Supabase auth state changed:', event, session?.user?.email);
          
          if (event === 'SIGNED_IN' && session) {
            // Handle OAuth callback
            await handleOAuthCallback(session);
          } else if (event === 'SIGNED_OUT') {
            // Clear user data on sign out
            setUser(null);
            setSession(null);
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            localStorage.removeItem('matrixai_session');
            localStorage.removeItem('matrixai_user');
            localStorage.removeItem('matrixai_userData');
            localStorage.removeItem('matrixai_userDataTimestamp');
            
            // Clear any Supabase-specific storage keys
            const supabaseKeys = Object.keys(localStorage).filter(key => 
              key.startsWith('sb-') && key.includes('auth')
            );
            supabaseKeys.forEach(key => localStorage.removeItem(key));
            
            // Also clear sessionStorage in case Supabase uses it
             sessionStorage.clear();
             
             // Clear Google OAuth related cookies and storage
             try {
               document.cookie.split(';').forEach(cookie => {
                 const eqPos = cookie.indexOf('=');
                 const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
                 if (name.toLowerCase().includes('google') || name.toLowerCase().includes('oauth') || name.toLowerCase().includes('auth')) {
                   document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
                   document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
                   document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
                 }
               });
             } catch (error) {
               console.warn('Could not clear cookies:', error);
             }
             
             console.log('🔄 Supabase SIGNED_OUT event: cleared all auth data including Supabase keys and cookies');
          }
        });
        
        // Verify session from localStorage (new API system)
        await verifySession(true);
        
        // Mark as initialized
        authInitialized.current = true;
        
        // Cleanup subscription on unmount
        return () => {
          subscription.unsubscribe();
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
  }, [verifySession]);

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
      const result = await supabaseSignInWithGoogle();
      return result;
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
      const result = await supabaseSignInWithApple();
      return result;
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
      
      // First, sign out from Supabase to clear OAuth session
      await supabaseSignOut();
      
      // Clear all authentication data from localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      localStorage.removeItem('matrixai_session');
      localStorage.removeItem('matrixai_user');
      localStorage.removeItem('matrixai_userData');
      localStorage.removeItem('matrixai_userDataTimestamp');
      
      // Clear any Supabase-specific storage keys
      // Supabase stores auth data with keys like 'sb-<project-ref>-auth-token'
      const supabaseKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('sb-') && key.includes('auth')
      );
      supabaseKeys.forEach(key => localStorage.removeItem(key));
      
      // Also clear sessionStorage in case Supabase uses it
      sessionStorage.clear();
      
      // Clear Google OAuth related cookies and storage
      // This helps prevent automatic re-authentication
      try {
        // Clear Google-related cookies by setting them to expire
        document.cookie.split(';').forEach(cookie => {
          const eqPos = cookie.indexOf('=');
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          if (name.toLowerCase().includes('google') || name.toLowerCase().includes('oauth') || name.toLowerCase().includes('auth')) {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          }
        });
      } catch (error) {
        console.warn('Could not clear cookies:', error);
      }
      
      // Clear context state
      setUser(null);
      setSession(null);
      
      console.log('User signed out successfully from both Supabase and local storage');
    } catch (error: any) {
      console.error('Error during sign out:', error);
      // Even if Supabase signOut fails, we should still clear local data
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      localStorage.removeItem('matrixai_session');
      localStorage.removeItem('matrixai_user');
      localStorage.removeItem('matrixai_userData');
      localStorage.removeItem('matrixai_userDataTimestamp');
      
      // Clear any Supabase-specific storage keys
      const supabaseKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('sb-') && key.includes('auth')
      );
      supabaseKeys.forEach(key => localStorage.removeItem(key));
      
      // Also clear sessionStorage in case Supabase uses it
      sessionStorage.clear();
      
      // Clear Google OAuth related cookies and storage
      try {
        document.cookie.split(';').forEach(cookie => {
          const eqPos = cookie.indexOf('=');
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          if (name.toLowerCase().includes('google') || name.toLowerCase().includes('oauth') || name.toLowerCase().includes('auth')) {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          }
        });
      } catch (error) {
        console.warn('Could not clear cookies:', error);
      }
      
      setUser(null);
      setSession(null);
      
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
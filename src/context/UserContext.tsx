import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { fetchUserById } from '../supabaseClient';

// Define user data interface based on the database structure
interface UserData {
  id: number;
  name: string;
  gender: string;
  age: number;
  preferred_language: string;
  referral_code: string;
  email?: string;
  uid?: string;
  user_coins?: number;
  phone?: string;
  dp_url?: string;
  newuser?: boolean;
  subscription_active?: boolean;
  user_plan?: string;
  plan_valid_till?: string;
  pending_plan?: any;
  coins_expiry?: string;
  last_coin_addition?: string;
  invited_members?: string[];
  referred_by?: string;
}

interface UserContextType {
  userData: UserData | null;
  loading: boolean;
  error: string | null;
  refreshUserData: () => Promise<void>;
  isPro: boolean;
}

// Create the user context
const UserContext = createContext<UserContextType | undefined>(undefined);

// User provider component
export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const previousUserId = useRef<string | null>(null);
  const fetchInProgress = useRef(false);
  
  const [userData, setUserData] = useState<UserData | null>(() => {
    // Try to get userData from localStorage when component mounts
    const storedUserData = localStorage.getItem('matrixai_userData');
    return storedUserData ? JSON.parse(storedUserData) : null;
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(() => {
    return parseInt(localStorage.getItem('matrixai_userDataTimestamp') || '0');
  });

  // Calculate if user has pro subscription
  const isPro = userData?.subscription_active || false;

  // Function to fetch user data with de-duplication
  const fetchUserData = useCallback(async (force = false) => {
    // Skip if no user
    if (!user?.id) return;
    
    // Skip if same user and data is not stale and not forced
    const now = Date.now();
    if (
      !force && 
      userData && 
      user.id === previousUserId.current && 
      now - lastFetch < 5 * 60 * 1000
    ) {
      return;
    }
    
    // Skip if fetch already in progress
    if (fetchInProgress.current) return;
    
    try {
      fetchInProgress.current = true;
      setLoading(true);
      
      const data = await fetchUserById(user.id);
      
      // Only update if data changed or is new
      if (!userData || JSON.stringify(data) !== JSON.stringify(userData)) {
        setUserData(data);
        
        // Cache the user data and timestamp in localStorage
        localStorage.setItem('matrixai_userData', JSON.stringify(data));
        localStorage.setItem('matrixai_userDataTimestamp', now.toString());
        setLastFetch(now);
      }
      
      // Store the user ID we just fetched for
      previousUserId.current = user.id;
    } catch (err: any) {
      console.error('Error fetching user data:', err);
      setError(err.message || 'Failed to load user data');
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  }, [user, userData, lastFetch]);

  // Fetch user data when auth user changes
  useEffect(() => {
    if (user) {
      if (user.id !== previousUserId.current) {
        fetchUserData(true);
      } else {
        fetchUserData(false);
      }
    } else {
      setUserData(null);
      localStorage.removeItem('matrixai_userData');
      localStorage.removeItem('matrixai_userDataTimestamp');
      previousUserId.current = null;
    }
  }, [user, fetchUserData]);
  
  // Use a ref to track if component is mounted
  const isMounted = useRef(true);
  
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Add visibility and page navigation event handlers
  useEffect(() => {
    // Only refresh data when tab becomes visible and user exists
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user && isMounted.current) {
        // Check if data is stale (older than 5 minutes)
        const now = Date.now();
        if (now - lastFetch > 5 * 60 * 1000) {
          fetchUserData(false);
        }
      }
    };
    
    // Handle page show event (when navigating back to the page via history)
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted && user && isMounted.current) {
        // Check if data is stale
        const now = Date.now();
        if (now - lastFetch > 5 * 60 * 1000) {
          fetchUserData(false);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [user, lastFetch, fetchUserData]);

  // Expose method to manually refresh user data
  const refreshUserData = async () => {
    await fetchUserData(true);
  };

  const value = {
    userData,
    loading,
    error,
    refreshUserData,
    isPro
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// Custom hook to use the user context
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 
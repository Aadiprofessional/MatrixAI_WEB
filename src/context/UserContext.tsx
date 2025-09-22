import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { userService } from '../services/userService';
import { supabase } from '../supabaseClient';

// Define user data interface based on the new API structure
interface UserData {
  uid: string;
  email: string;
  coins: number;
  name?: string;
  gender?: string;
  age?: number;
  preferred_language?: string;
  referral_code?: string;
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
  const previousUserDataRef = useRef<UserData | null>(null);
  
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
    if (!user?.uid) return;
    
    // Skip if same user and data is not stale and not forced
    const now = Date.now();
    if (
      !force && 
      userData && 
      user.uid === previousUserId.current && 
      now - lastFetch < 5 * 60 * 1000
    ) {
      return;
    }
    
    // Skip if fetch already in progress
    if (fetchInProgress.current) return;
    
    try {
      fetchInProgress.current = true;
      setLoading(true);
      
      console.log('Fetching user data for:', user.uid, 'force:', force);
      
      // Get additional user info from the API
      const userInfoResponse = await userService.getUserInfo(user.uid);
      
      // Get the latest coin count from Supabase
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('user_coins')
        .eq('uid', user.uid)
        .single();
      
      if (userError) {
        console.error('Error fetching user coins from Supabase:', userError);
      }
      
      const latestCoins = userData?.user_coins || user.coins || 0;
      console.log('Latest coins from Supabase:', latestCoins);
      
      if (userInfoResponse.success) {
        // Combine auth user data with additional user info
        const combinedData: UserData = {
          uid: user.uid,
          email: user.email,
          coins: latestCoins, // Use the latest coins from Supabase
          name: userInfoResponse.data.name,
          age: userInfoResponse.data.age,
          gender: userInfoResponse.data.gender,
          dp_url: userInfoResponse.data.dp_url,
          subscription_active: userInfoResponse.data.subscription_active,
        };
        
        console.log('Updated user data:', combinedData);
        
        // Always update if forced, otherwise only if data changed
        if (force || !previousUserDataRef.current || JSON.stringify(combinedData) !== JSON.stringify(previousUserDataRef.current)) {
          setUserData(combinedData);
          previousUserDataRef.current = combinedData;
          
          // Cache the user data and timestamp in localStorage
          localStorage.setItem('matrixai_userData', JSON.stringify(combinedData));
          localStorage.setItem('matrixai_userDataTimestamp', now.toString());
          setLastFetch(now);
        }
      } else {
        // If we can't get additional info, use basic auth data with latest coins
        const basicData: UserData = {
          uid: user.uid,
          email: user.email,
          coins: latestCoins, // Use the latest coins from Supabase
        };
        setUserData(basicData);
      }
      
      // Store the user ID we just fetched for
      previousUserId.current = user.uid;
    } catch (err: any) {
      console.error('Error fetching user data:', err);
      // If API call fails, still set basic user data from auth
      if (user?.uid) {
        const basicData: UserData = {
          uid: user.uid,
          email: user.email,
          coins: user.coins || 0,
        };
        setUserData(basicData);
      }
      setError(err.message || 'Failed to load user data');
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  }, [user, lastFetch]);

  // Fetch user data when auth user changes
  useEffect(() => {
    if (user) {
      if (user.uid !== previousUserId.current) {
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
  
  // Set up real-time subscription to user data in Supabase
  useEffect(() => {
    if (!user?.uid) return;
    
    console.log('Setting up Supabase real-time subscription in UserContext for user:', user.uid);
    
    // Set up real-time subscription to the users table
     const subscription = supabase
       .channel('user-data-channel')
       .on('postgres_changes', 
         { 
           event: 'UPDATE', 
           schema: 'public', 
           table: 'users',
           filter: `uid=eq.${user.uid}`
         }, 
         (payload) => {
           console.log('UserContext: Supabase real-time update received:', payload);
           
           // Update user data when changes occur
           if (payload.new && payload.new.user_coins !== undefined) {
             console.log('UserContext: Received updated user_coins:', payload.new.user_coins);
             // Force refresh user data to get the latest from the database
             fetchUserData(true);
           }
         }
       )
       .subscribe();
       
     console.log('Supabase real-time subscription set up with filter:', `uid=eq.${user.uid}`);
    
    // Clean up subscription on unmount
    return () => {
      console.log('Cleaning up Supabase real-time subscription in UserContext');
      subscription.unsubscribe();
    };
  }, [user?.uid, fetchUserData]);

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
  const refreshUserData = useCallback(async () => {
    await fetchUserData(true);
  }, [fetchUserData]);

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
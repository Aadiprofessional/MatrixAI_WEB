import React, { createContext, useState, useEffect, useContext } from 'react';
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
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate if user has pro subscription
  const isPro = userData?.subscription_active || false;

  // Function to fetch user data
  const fetchUserData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const data = await fetchUserById(user.id);
      setUserData(data);
    } catch (err: any) {
      console.error('Error fetching user data:', err);
      setError(err.message || 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user data when auth user changes
  useEffect(() => {
    if (user) {
      fetchUserData();
    } else {
      setUserData(null);
    }
  }, [user]);

  // Expose method to manually refresh user data
  const refreshUserData = async () => {
    await fetchUserData();
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
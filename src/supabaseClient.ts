import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://ddtgdhehxhgarkonvpfq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkdGdkaGVoeGhnYXJrb252cGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2Njg4MTIsImV4cCI6MjA1MDI0NDgxMn0.mY8nx-lKrNXjJxHU7eEja3-fTSELQotOP4aZbxvmNPY';
export const supabase = createClient(supabaseUrl, supabaseKey);

// ===== Authentication functions =====

// Sign up a new user
export const signUp = async (email: string, password: string, metadata = {}) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  });
  
  if (error) {
    throw error;
  }
  
  return data;
};

// Sign in a user
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) {
    throw error;
  }
  
  return data;
};

// Sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    throw error;
  }
};

// Check if a user is authenticated
export const checkUser = async () => {
  const { data } = await supabase.auth.getUser();
  return data.user;
};

// ===== User functions =====

// Fetch user by ID
export const fetchUserById = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('uid', userId)
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
};

// Update user subscription status
export const updateUserSubscription = async (userId: string, subscriptionData: any) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(subscriptionData)
      .eq('uid', userId)
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error updating user subscription:', error);
    throw error;
  }
};

// Verify subscription purchase
export const verifySubscriptionPurchase = async (purchaseData: any) => {
  try {
    // In a real app, you would have an API endpoint to verify the purchase
    // and update the user's subscription status accordingly
    
    // This is just a placeholder function
    return { success: true, message: 'Subscription verified successfully' };
  } catch (error) {
    console.error('Error verifying subscription:', error);
    throw error;
  }
};

// Get user's usage metrics
export const getUserUsageMetrics = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_usage')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching user usage metrics:', error);
    throw error;
  }
};

// Update user profile data
export const updateUserProfile = async (userId: string, userData: any) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(userData)
      .eq('uid', userId)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}; 
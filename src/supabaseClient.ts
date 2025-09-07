import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://ddtgdhehxhgarkonvpfq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkdGdkaGVoeGhnYXJrb252cGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2Njg4MTIsImV4cCI6MjA1MDI0NDgxMn0.mY8nx-lKrNXjJxHU7eEja3-fTSELQotOP4aZbxvmNPY';

// Configure Supabase client with custom storage to prevent session persistence issues
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: {
      getItem: (key: string) => {
        // Use sessionStorage instead of localStorage for auth tokens
        // This ensures sessions are cleared when browser tab is closed
        return sessionStorage.getItem(key);
      },
      setItem: (key: string, value: string) => {
        sessionStorage.setItem(key, value);
      },
      removeItem: (key: string) => {
        sessionStorage.removeItem(key);
      },
    },
    persistSession: true,
    autoRefreshToken: true,
  },
});

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

// Sign in with Google
export const signInWithGoogle = async () => {
  // Get the current URL path (login or signup)
  const currentPath = window.location.pathname;
  
  // Set redirectTo to the current page instead of dashboard
  // This way we can handle the redirect in the current page
  const redirectUrl = window.location.hostname === 'localhost'
    ? `http://localhost:3000${currentPath}`
    : `https://matrixai.asia${currentPath}`;
    
  console.log('Setting Google OAuth redirectTo:', redirectUrl);
  
  const { data, error } = await supabase.auth.signInWithOAuth({ 
    provider: 'google', 
    options: { 
      redirectTo: redirectUrl,
      queryParams: {
        // Force account selection and consent screen every time
        prompt: 'select_account consent',
        // Add a timestamp to prevent caching
        state: `timestamp_${Date.now()}`,
        // Force fresh authentication
        max_age: '0'
      }
    }, 
  });
  
  if (error) {
    throw error;
  }
  
  return data;
};

// Sign in with Apple
export const signInWithApple = async () => {
  // Get the current URL path (login or signup)
  const currentPath = window.location.pathname;
  
  // Set redirectTo to the current page instead of dashboard
  // This way we can handle the redirect in the current page
  const redirectUrl = window.location.hostname === 'localhost'
    ? `http://localhost:3000${currentPath}`
    : `https://matrixai.asia${currentPath}`;
    
  console.log('Setting Apple OAuth redirectTo:', redirectUrl);
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        // Improve Apple login by requesting name and email
        response_mode: 'form_post',
        scope: 'name email'
      }
    },
  });
  
  if (error) {
    throw error;
  }
  
  return data;
};

// Sign out
export const signOut = async () => {
  try {
    // Check if there's an active session before attempting to sign out
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
    }
    // If no session exists, we consider the sign out successful
    // since the user is already signed out
  } catch (error: any) {
    // If the error is about missing session, we can ignore it
    // since the user is already signed out
    if (error.message && error.message.includes('Auth session missing')) {
      console.log('No active session to sign out from');
      return;
    }
    throw error;
  }
};

// Reset password
export const resetPassword = async (email: string) => {
  const redirectUrl = window.location.hostname === 'localhost'
    ? 'https://main-matrixai-server-lujmidrakh.cn-hangzhou.fcapp.run/reset-password'
    : `${window.location.origin}/reset-password`;
    
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  });
  
  if (error) {
    throw error;
  }
  
  return data;
};

// Update password (for reset password flow)
export const updatePassword = async (newPassword: string) => {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  });
  
  if (error) {
    throw error;
  }
  
  return data;
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

// ===== Storage functions =====

// Upload file to Supabase storage
export const uploadImageToStorage = async (file: File, userId: string) => {
  try {
    // Create a unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `user-uploads/${fileName}`;
    
    // Upload the file
    const { data, error } = await supabase.storage
      .from('user-uploads')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      throw error;
    }
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('user-uploads')
      .getPublicUrl(filePath);
    
    return {
      fileName,
      filePath,
      publicUrl
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};
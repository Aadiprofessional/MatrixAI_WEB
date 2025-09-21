import { createClient } from '@supabase/supabase-js';
import { compressImage, shouldCompressImage } from './utils/imageCompression';

// Initialize Supabase client
const supabaseUrl = 'https://ddtgdhehxhgarkonvpfq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkdGdkaGVoeGhnYXJrb252cGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2Njg4MTIsImV4cCI6MjA1MDI0NDgxMn0.mY8nx-lKrNXjJxHU7eEja3-fTSELQotOP4aZbxvmNPY';

// Configure Supabase client with localStorage for proper OAuth session persistence
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: {
      getItem: (key: string) => {
        // Use localStorage for auth tokens to ensure OAuth redirects work properly
        return localStorage.getItem(key);
      },
      setItem: (key: string, value: string) => {
        localStorage.setItem(key, value);
      },
      removeItem: (key: string) => {
        localStorage.removeItem(key);
      },
    },
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // Important for OAuth redirects
    flowType: 'pkce', // Use PKCE flow for better security
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
  try {
    // Clear any existing auth state to prevent conflicts
    await supabase.auth.signOut();
    
    // Get the current URL path (login or signup)
    const currentPath = window.location.pathname;
    
    // Set redirectTo to the dashboard for successful authentication
    const redirectUrl = window.location.hostname === 'localhost'
      ? `http://localhost:3000/dashboard`
      : `https://matrixai.asia/dashboard`;
      
    console.log('🔄 Starting Google OAuth with redirectTo:', redirectUrl);
    
    const { data, error } = await supabase.auth.signInWithOAuth({ 
      provider: 'google', 
      options: { 
        redirectTo: redirectUrl,
        queryParams: {
          // Force account selection and consent screen
          prompt: 'select_account',
          // Request necessary scopes
          scope: 'openid email profile',
          // Force fresh authentication
          max_age: '0'
        }
      }, 
    });
    
    if (error) {
      console.error('❌ Google OAuth error:', error);
      throw error;
    }
    
    console.log('✅ Google OAuth initiated successfully');
    return data;
  } catch (error) {
    console.error('❌ Error in signInWithGoogle:', error);
    throw error;
  }
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

// Upload file to Supabase storage with automatic image compression
export const uploadImageToStorage = async (file: File, userId: string) => {
  try {
    let fileToUpload = file;
    
    // Compress image before upload
    if (file.type.startsWith('image/')) {
      console.log(`Original image size: ${Math.round(file.size / 1024)}KB`);
      
      try {
        // Check if compression is needed
        const needsCompression = await shouldCompressImage(file, 500);
        
        if (needsCompression) {
          console.log('Compressing image...');
          const compressionResult = await compressImage(file, {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 0.8,
            maxSizeKB: 500,
            outputFormat: 'jpeg'
          });
          
          fileToUpload = compressionResult.compressedFile;
          console.log(`Compressed to: ${Math.round(compressionResult.compressedSize / 1024)}KB (${compressionResult.compressionRatio.toFixed(1)}% reduction)`);
        } else {
          console.log('Image compression not needed - file already optimized');
        }
      } catch (compressionError) {
        console.warn('Image compression failed, uploading original:', compressionError);
        // Continue with original file if compression fails
      }
    }
    
    // Create a unique file name
    const fileExt = fileToUpload.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `user-uploads/${fileName}`;
    
    // Upload the file
    const { data, error } = await supabase.storage
      .from('user-uploads')
      .upload(filePath, fileToUpload, {
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
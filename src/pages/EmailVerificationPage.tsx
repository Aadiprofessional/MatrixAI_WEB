import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiCheck, FiRefreshCw } from 'react-icons/fi';
import { supabase } from '../supabaseClient';

const EmailVerificationPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Check for redirects from email verification
  const type = searchParams.get('type');
  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');
  const expiresIn = searchParams.get('expires_in');
  const tokenType = searchParams.get('token_type');
  
  const { email, message, isNewUser, isPasswordReset, userData } = location.state || {};
  
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [verificationChecked, setVerificationChecked] = useState(false);
  const [autoCheckActive, setAutoCheckActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  // Check if user is verified and has tokens in URL (redirected after email verification)
  useEffect(() => {
    const handleTokenRedirect = async () => {
      if (accessToken && type === 'signup') {
        setLoading(true);
        try {
          // Get user from the access token
          const { data: { user }, error: getUserError } = await supabase.auth.getUser(accessToken);
          
          if (getUserError || !user) {
            console.error('Error getting user from token:', getUserError);
            setError('Invalid verification link. Please try again.');
            setLoading(false);
            return;
          }
          
          console.log('User verified via redirect:', user);
          setVerificationChecked(true);
          setSuccess('Your email has been successfully verified!');
          
          // Try to set the session with the tokens
          if (refreshToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
          }
          
          // Get user data from localStorage if we don't have state
          let userDataToSave = userData;
          if (!userDataToSave) {
            try {
              const storedUserData = localStorage.getItem('pendingUserData');
              if (storedUserData) {
                userDataToSave = JSON.parse(storedUserData);
              }
            } catch (error) {
              console.error('Error parsing stored user data:', error);
            }
          }
          
          // Save user data
          if (userDataToSave) {
            await saveUserDataAfterVerification(user.id);
            
            // Clear stored user data
            localStorage.removeItem('pendingUserData');
          }
          
          // Store session data
          localStorage.setItem('uid', user.id);
          localStorage.setItem('userLoggedIn', 'true');
          
          // Navigate to dashboard
          setTimeout(() => {
            navigate('/dashboard');
          }, 1500);
        } catch (error) {
          console.error('Error handling token redirect:', error);
          setError('Error processing verification. Please try manually verifying.');
        } finally {
          setLoading(false);
        }
      }
    };
    
    handleTokenRedirect();
  }, [accessToken, type, navigate, userData]);

  // Save user data even without state (for redirects)
  useEffect(() => {
    if (userData && !localStorage.getItem('pendingUserData')) {
      localStorage.setItem('pendingUserData', JSON.stringify(userData));
    }
  }, [userData]);

  // Function to save user data after verification
  const saveUserDataAfterVerification = async (userId: string) => {
    // Try to get user data from state or localStorage
    let userDataToSave = userData;
    if (!userDataToSave) {
      try {
        const storedUserData = localStorage.getItem('pendingUserData');
        if (storedUserData) {
          userDataToSave = JSON.parse(storedUserData);
        }
      } catch (error) {
        console.error('Error parsing stored user data:', error);
      }
    }
    
    if (!userDataToSave) {
      console.log('No user data to save');
      return;
    }
    
    try {
      console.log('Saving user data after verification for user ID:', userId);
      
      // First check if user already exists either by uid or email
      const { data: existingUserByUid } = await supabase
        .from('users')
        .select('uid, email')
        .eq('uid', userId)
        .maybeSingle();
        
      const { data: existingUserByEmail } = await supabase
        .from('users')
        .select('uid, email')
        .eq('email', userDataToSave.email)
        .maybeSingle();
      
      // If the user exists by either uid or email, we should not try to create a new record
      if (existingUserByUid || existingUserByEmail) {
        console.log('User already exists in database:', existingUserByUid || existingUserByEmail);
        
        // If the user exists with a different uid but same email, we might need to update the uid
        if (existingUserByEmail && existingUserByEmail.uid !== userId) {
          console.log('User exists with different uid but same email. Updating uid...');
          
          const { error: updateError } = await supabase
            .from('users')
            .update({ uid: userId })
            .eq('email', userDataToSave.email);
            
          if (updateError) {
            console.error('Error updating user uid:', updateError);
          } else {
            console.log('Updated user uid successfully');
          }
        }
        
        // We might want to update other user fields here if needed
        
        return; // Skip insertion since user already exists
      }
      
      // Prepare user data for database
      const dbUserData = {
        uid: userId,
        name: userDataToSave.name,
        email: userDataToSave.email,
        age: userDataToSave.age || 0,
        gender: userDataToSave.gender || 'Not specified',
        preferred_language: userDataToSave.preferred_language || 'English',
        referral_code: userDataToSave.referral_code || '',
        user_coins: userDataToSave.referrerId ? 50 : 0, // 50 coins if referred, 0 if not
        invited_members: [],
        referred_by: userDataToSave.referrerId || null
      };
      
      console.log('Inserting new user into database:', dbUserData);
      
      // Try direct insertion with a delay to ensure auth is propagated
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        const { error: insertError } = await supabase
          .from('users')
          .insert([dbUserData]);
          
        if (insertError) {
          console.error('Insert error:', insertError);
          throw insertError;
        }
        
        console.log('User data saved successfully');
      } catch (insertError: any) {
        // If the error is not a duplicate key error, or it's a different field than email, try upsert
        if (insertError.code !== '23505' || !insertError.details?.includes('email')) {
          try {
            console.log('Trying upsert as fallback...');
            const { error: upsertError } = await supabase
              .from('users')
              .upsert([dbUserData], { 
                onConflict: 'uid',
                ignoreDuplicates: false
              });
              
            if (upsertError) {
              console.error('Upsert error:', upsertError);
              throw upsertError;
            }
            
            console.log('User data upserted successfully');
          } catch (upsertError) {
            console.error('Upsert failed:', upsertError);
            throw upsertError;
          }
        } else {
          console.error('Email already exists and cannot be inserted/upserted');
          throw insertError;
        }
      }
      
      // If user was referred, update the referrer
      if (userDataToSave.referrerId) {
        await updateReferrer(userDataToSave.referrerId, userId);
      }
    } catch (error: any) {
      console.error('Error saving user data:', error);
      if (error.code === '23505' && error.details?.includes('email')) {
        setError('This email is already registered with another account.');
      } else {
        setError('Your account was created but we had trouble saving some additional data. Please try refreshing the page.');
      }
    }
  };
  
  // Function to update referrer's invited_members and add coins
  const updateReferrer = async (referrerId: string, newUserId: string) => {
    try {
      console.log('Updating referrer:', referrerId, 'with new user:', newUserId);
      
      // Get current invited_members array
      const { data: referrerData, error: referrerError } = await supabase
        .from('users')
        .select('invited_members, user_coins')
        .eq('uid', referrerId)
        .maybeSingle();
        
      if (referrerError) {
        console.error('Error getting referrer data:', referrerError);
        throw referrerError;
      }
      
      if (!referrerData) {
        console.log('Referrer not found in database');
        return;
      }
      
      // Prepare the updated array
      const updatedInvitedMembers = referrerData.invited_members || [];
      if (!updatedInvitedMembers.includes(newUserId)) {
        updatedInvitedMembers.push(newUserId);
      }
      
      // Calculate new coin value (add 50)
      const newCoinValue = (referrerData.user_coins || 0) + 50;
      
      // Update the referrer record
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          invited_members: updatedInvitedMembers,
          user_coins: newCoinValue
        })
        .eq('uid', referrerId);
        
      if (updateError) {
        console.error('Error updating referrer:', updateError);
        throw updateError;
      }
      
      console.log('Referrer updated successfully');
    } catch (error) {
      console.error('Error updating referrer:', error);
    }
  };

  // Function to open email app/service
  const openEmailApp = () => {
    window.open('https://mail.google.com', '_blank');
  };

  // Function to handle checking verification by signing in
  const checkEmailVerificationBySignIn = async () => {
    if (!email || !userData?.password) {
      console.log('Missing email or password for verification check');
      return null;
    }
    
    try {
      // Try to sign in - this will only work if the email is verified
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: userData.password
      });
      
      if (error) {
        console.log('Sign in failed during verification check:', error.message);
        return null;
      }
      
      console.log('Sign in succeeded - email is verified');
      return data;
    } catch (error) {
      console.error('Error checking verification by sign in:', error);
      return null;
    }
  };

  // Function to open verification link
  const openVerificationLink = () => {
    window.open('https://app.supabase.com/project/_/auth/email/confirm', '_blank');
  };

  // Check verification status periodically
  useEffect(() => {
    if (!email || verificationChecked || !autoCheckActive) return;

    const checkVerification = async () => {
      try {
        const signInData = await checkEmailVerificationBySignIn();
        
        if (signInData?.user) {
          console.log('Email verified via sign in check');
          setVerificationChecked(true);
          setSuccess('Your email has been successfully verified!');
          
          // Save user data if needed
          if (isNewUser && userData) {
            await saveUserDataAfterVerification(signInData.user.id);
            
            // Add a delay to ensure data is saved before navigating
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
          // Store session data (in localStorage for web)
          localStorage.setItem('uid', signInData.user.id);
          localStorage.setItem('userLoggedIn', 'true');
          
          // Navigate to dashboard
          setTimeout(() => {
            navigate('/dashboard');
          }, 1500);
        } else {
          console.log('Email not verified yet for:', email);
        }
      } catch (err) {
        console.error('Error checking verification:', err);
      }
    };

    // Check immediately and then every 10 seconds
    checkVerification();
    const intervalId = setInterval(checkVerification, 10000);

    return () => clearInterval(intervalId);
  }, [email, navigate, verificationChecked, isPasswordReset, userData, isNewUser, autoCheckActive]);

  // Timer countdown effect
  useEffect(() => {
    if (timeLeft <= 0) {
      // Time expired
      setAutoCheckActive(false);
      setError('The verification time has expired. Please request a new verification email.');
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft(prevTime => prevTime - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft]);

  // Function to handle manual verification check
  const handleManualVerification = async () => {
    setLoading(true);
    setError(null);
    try {
      // Try to sign in - this will only work if email is verified
      const signInData = await checkEmailVerificationBySignIn();
      
      if (!signInData?.user) {
        setError('Your email has not been verified yet. Please check your inbox and click the verification link.');
        setLoading(false);
        return;
      }
      
      // Email is verified, user is signed in
      setSuccess('Your email has been verified and you are now logged in!');
      
      // Save user data if needed
      if (isNewUser && userData) {
        await saveUserDataAfterVerification(signInData.user.id);
      }
      
      // Store session data
      localStorage.setItem('uid', signInData.user.id);
      localStorage.setItem('userLoggedIn', 'true');
      
      // Navigate to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err: any) {
      console.error('Error during manual verification:', err);
      setError(err.message || 'Failed to verify email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle resend verification email
  const handleResendVerification = async () => {
    setLoading(true);
    setError(null);
    try {
      // Reset auto-check
      setAutoCheckActive(true);
      setVerificationChecked(false);
      
      // Use Supabase to resend verification email
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) throw error;
      
      setSuccess('A new verification email has been sent to your email address.');
      
      // Reset timer
      setTimeLeft(600);
    } catch (err: any) {
      console.error('Error resending verification:', err);
      setError(err.message || 'Failed to resend verification email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // If no email in state, redirect to signup
  useEffect(() => {
    if (!email && !location.state) {
      navigate('/signup');
    }
  }, [email, navigate, location.state]);

  // Handle deep linking for email verification
  useEffect(() => {
    // Get the current URL
    const url = window.location.href;
    
    // Check if URL contains verification tokens but not as search params
    if (url.includes('type=signup') && !accessToken) {
      console.log('Detected verification link in URL');
      
      try {
        // Extract verification parameters
        const params = new URLSearchParams(url.split('#')[1] || url.split('?')[1]);
        const extractedAccessToken = params.get('access_token');
        const extractedRefreshToken = params.get('refresh_token');
        
        if (extractedAccessToken) {
          // Redirect to ourselves with proper query parameters
          const newUrl = `/verify-email?access_token=${extractedAccessToken}&refresh_token=${extractedRefreshToken}&type=signup`;
          window.location.href = newUrl;
        }
      } catch (error) {
        console.error('Error processing URL tokens:', error);
      }
    }
  }, [accessToken]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12 bg-gray-50">
      {/* Animated Background Gradients */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-br from-blue-500/30 via-indigo-500/20 to-purple-600/30 blur-3xl opacity-60 animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-0 right-0 w-full h-1/3 bg-gradient-to-tr from-purple-600/30 via-pink-500/20 to-blue-500/30 blur-3xl opacity-60 animate-pulse" style={{ animationDuration: '10s' }}></div>
      </div>
      
      <div className="relative w-full max-w-md">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="p-8 rounded-2xl shadow-xl backdrop-blur-xl bg-white/90 text-gray-900 border border-opacity-20 border-blue-500/30"
        >
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <FiMail className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 mb-2">
              Verify Your Email
            </h1>
            <p className="text-center text-gray-600 mb-1">
              {message || `We've sent a verification link to`}
            </p>
            {email && (
              <p className="text-center font-medium text-blue-700 mb-2">
                {email}
              </p>
            )}
            <div className="bg-blue-50 p-3 rounded-lg mt-2 w-full">
              <p className="text-sm text-blue-800">
                Please check your email and click the verification link to complete your registration.
              </p>
            </div>
          </div>
          
          {/* Timer */}
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600">Verification expires in</p>
            <p className="text-xl font-mono font-semibold text-blue-700">
              {formatTime(timeLeft)}
            </p>
          </div>
          
          {/* Status messages */}
          {error && (
            <div className="p-3 rounded-lg mb-6 text-sm text-center bg-red-50 text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 rounded-lg mb-6 text-sm text-center bg-green-50 text-green-700 flex items-center justify-center">
              <FiCheck className="mr-2" />
              {success}
            </div>
          )}
          
          {/* Action buttons */}
          <div className="space-y-4 mt-6">
            <button
              onClick={openEmailApp}
              className="w-full py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors shadow-md"
            >
              Open Email App
            </button>
            
            <button
              onClick={handleManualVerification}
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors shadow-md flex items-center justify-center"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                "I've Verified My Email"
              )}
            </button>
            
            <button
              onClick={handleResendVerification}
              disabled={loading}
              className="w-full flex items-center justify-center py-3 px-4 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium transition-colors"
            >
              <FiRefreshCw className="mr-2" />
              Resend Verification Email
            </button>
          </div>
          
          {/* Help text */}
          <p className="mt-6 text-center text-sm text-gray-600">
            Didn't receive the email? Check your spam folder or click resend above.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default EmailVerificationPage; 
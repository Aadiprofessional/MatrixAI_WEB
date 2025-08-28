import React, { useState, useContext, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiMoon, FiSun } from 'react-icons/fi';
import { ThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import matrix from '../assets/matrix.png';
import LanguageSelector from '../components/LanguageSelector';
import { Turnstile } from '@marsidev/react-turnstile';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const turnstileRef = useRef<any>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const { signIn, signInWithGoogle, signInWithApple, error, setError, user } = useAuth();
  const { t } = useTranslation();

  // Handle pre-filled credentials from signup
  useEffect(() => {
    const state = location.state as any;
    if (state?.email) {
      setEmail(state.email);
    }
    if (state?.password) {
      setPassword(state.password);
    }
    if (state?.showEmailVerificationAlert && state?.alertMessage) {
      setShowAlert(true);
      setAlertMessage(state.alertMessage);
    }
  }, [location.state]);

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    // Check for OAuth error parameters in URL
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    
    const error = urlParams.get('error') || hashParams.get('error');
    const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');
    const errorCode = urlParams.get('error_code') || hashParams.get('error_code');
    
    // Handle OAuth errors
    if (error) {
      console.error('OAuth error detected:', { error, errorDescription, errorCode });
      let errorMessage = 'Authentication failed. Please try again.';
      
      if (error === 'server_error' && errorDescription?.includes('Database error saving new user')) {
        errorMessage = 'There was an issue with your account. This has been fixed - please try logging in again.';
      } else if (error === 'access_denied') {
        errorMessage = 'Access was denied. Please try again and make sure to grant the necessary permissions.';
      } else if (errorDescription) {
        errorMessage = decodeURIComponent(errorDescription);
      }
      
      setError(errorMessage);
      setLoading(false);
      
      // Clean up URL by removing error parameters
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      return;
    }
    
    // Check for OAuth redirect parameters in URL
    const hasOAuthParams = window.location.hash.includes('access_token') || 
                          window.location.search.includes('access_token');
    
    // If we detect OAuth parameters, we're in a redirect flow
    if (hasOAuthParams) {
      console.log('Detected OAuth redirect parameters, checking session...');
      // We'll let the AuthContext handle the session setup
      // Just show loading state until that's complete
      setLoading(true);
      return;
    }
    
    if (user) {
      console.log('User detected, redirecting to dashboard');
      navigate('/dashboard');
    }
  }, [user, navigate, setError]);

  // Check if we're in localhost/development environment
  const isLocalhost = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' || 
                     window.location.hostname === '0.0.0.0';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError(t('auth.emailRequired') + ' and ' + t('auth.passwordRequired'));
      return;
    }

    // Skip Turnstile validation for localhost
    if (!isLocalhost && !turnstileToken) {
      setError('Please complete the Turnstile verification');
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting login with AuthContext...');
      
      // Use AuthContext signIn method
      const result = await signIn(email.trim(), password);
      
      console.log('Login successful:', result);
      
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed');
      // Reset Turnstile on error (only if not localhost)
      if (!isLocalhost && turnstileRef.current) {
        turnstileRef.current.reset();
        setTurnstileToken(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTurnstileSuccess = (token: string) => {
    setTurnstileToken(token);
    if (error && token) {
      setError('');
    }
  };

  const handleTurnstileError = () => {
    setTurnstileToken(null);
    setError('Turnstile verification failed. Please try again.');
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video 
          className="w-full h-full object-cover" 
          autoPlay 
          loop 
          muted 
          playsInline
        >
          <source src="https://ddtgdhehxhgarkonvpfq.supabase.co/storage/v1/object/public/user-uploads//loginvideo.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        {/* Black Overlay */}
        <div className="absolute inset-0 bg-black/60"></div>
      </div>
      {/* Theme Toggle */}
      <button 
        onClick={toggleDarkMode}
        className="fixed top-6 right-6 p-3 rounded-full z-50 transition-all bg-black/40 text-white hover:bg-black/60 backdrop-blur-sm shadow-lg hover:scale-110"
        aria-label="Toggle dark mode"
      >
        {darkMode ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
      </button>

      {/* Language Selector */}
    
      {/* Left Side - Website Info */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 items-center justify-center p-12">
        <div className="max-w-xl">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative mb-8 mx-auto"
          >
            <div className="relative flex items-center justify-center">
              <span className="text-3xl font-bold text-white drop-shadow-md">matrixai<span className="text-red-500">.</span><span className="text-white">asia</span></span>
            </div>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-5xl font-bold mb-6 text-center text-white"
          >
            {t('login.heroTitle')}
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-xl text-center text-white/90 max-w-md mx-auto mb-12"
          >
            {t('login.heroSubtitle')}
          </motion.p>
          
          {/* Feature List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="space-y-6 text-white/90 max-w-md mx-auto"
          >
            <div className="flex items-center transform transition-transform hover:translate-x-2 bg-white/10 backdrop-blur-sm p-4 rounded-xl">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500/80 to-purple-600/80 flex items-center justify-center mr-4 shadow-md">
                <span className="text-lg">✓</span>
              </div>
              <p className="text-lg">{t('login.feature1')}</p>
            </div>
            <div className="flex items-center transform transition-transform hover:translate-x-2 bg-white/10 backdrop-blur-sm p-4 rounded-xl">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500/80 to-purple-600/80 flex items-center justify-center mr-4 shadow-md">
                <span className="text-lg">✓</span>
              </div>
              <p className="text-lg">{t('login.feature2')}</p>
            </div>
            <div className="flex items-center transform transition-transform hover:translate-x-2 bg-white/10 backdrop-blur-sm p-4 rounded-xl">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500/80 to-purple-600/80 flex items-center justify-center mr-4 shadow-md">
                <span className="text-lg">✓</span>
              </div>
              <p className="text-lg">{t('login.feature3')}</p>
            </div>
          </motion.div>
          
          {/* Social Proof - Removed */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0 }}
            transition={{ delay: 0, duration: 0 }}
            className="hidden"
          >
          </motion.div>
        </div>
      </div>
      
      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-2 lg:p-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-[98%] lg:w-full max-w-md p-6 lg:p-10 rounded-3xl shadow-2xl backdrop-blur-md bg-black/30 text-white border border-white/10"
        >
          <div className="lg:hidden flex justify-center mb-8">
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="relative flex items-center justify-center">
                <div className="bg-white rounded-2xl p-3 shadow-lg">
                  <img src={matrix} alt="MatrixAI" className="h-16 w-16 object-contain" />
                </div>
              </div>
            </motion.div>
          </div>
          
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-3xl font-bold text-center mb-2 text-white"
          >
            {t('auth.loginTitle')}
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-center mb-8 text-gray-200"
          >
            {t('auth.loginSubtitle')}
          </motion.p>
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg mb-6 text-sm text-center bg-red-900/40 text-red-200 backdrop-blur-sm border border-red-500/30"
            >
              {error}
            </motion.div>
          )}
          
          {showAlert && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg mb-6 text-sm text-center bg-blue-900/40 text-blue-200 backdrop-blur-sm border border-blue-500/30"
            >
              <div className="flex items-center justify-between">
                <span>{alertMessage}</span>
                <button
                  type="button"
                  onClick={() => setShowAlert(false)}
                  className="ml-2 text-blue-300 hover:text-blue-100 transition-colors"
                >
                  ×
                </button>
              </div>
            </motion.div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <label className="block text-sm font-medium mb-1 text-gray-200" htmlFor="email">
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-3.5 rounded-xl focus:outline-none focus:ring-2 transition-all bg-white/10 text-white border border-white/20 focus:ring-purple-500 focus:border-purple-500 backdrop-blur-md"
                    placeholder={t('login.emailPlaceholder')}
                  />
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <label className="block text-sm font-medium mb-1 text-gray-200" htmlFor="password">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3.5 rounded-xl focus:outline-none focus:ring-2 transition-all bg-white/10 text-white border border-white/20 focus:ring-purple-500 focus:border-purple-500 backdrop-blur-md"
                    placeholder={t('login.passwordPlaceholder')}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="focus:outline-none text-gray-400 hover:text-gray-300"
                    >
                      {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="flex items-center justify-between mt-6"
              >
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={() => setRememberMe(!rememberMe)}
                    className="h-4 w-4 rounded focus:ring-2 bg-white/10 border-white/30 focus:ring-purple-500 text-purple-500"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-200">
                    {t('auth.rememberMe')}
                  </label>
                </div>
                <div className="text-sm">
                  <Link to="/forgot-password" className="font-medium text-purple-400 hover:text-purple-300">
                    {t('auth.forgotPassword')}
                  </Link>
                </div>
              </motion.div>
              
              {/* Turnstile - Only show in production */}
              {!isLocalhost && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65, duration: 0.5 }}
                  className="mt-6 flex justify-center"
                >
                  <Turnstile
                    ref={turnstileRef}
                    siteKey={process.env.REACT_APP_TURNSTILE_SITE_KEY || ''}
                    onSuccess={handleTurnstileSuccess}
                    onError={handleTurnstileError}
                    options={{
                      theme: darkMode ? 'dark' : 'light'
                    }}
                  />
                </motion.div>
              )}
              
              {/* Development notice for localhost */}
              {isLocalhost && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65, duration: 0.5 }}
                  className="mt-6 flex justify-center"
                >
                  <div className="text-sm text-yellow-400 bg-yellow-900/20 px-3 py-2 rounded-lg border border-yellow-500/30">
                    Development Mode: Turnstile bypassed for localhost
                  </div>
                </motion.div>
              )}
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="mt-6"
              >
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3.5 px-4 border border-white/20 rounded-xl shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 bg-gradient-to-r from-purple-600/90 to-indigo-600/90 hover:from-purple-700/90 hover:to-indigo-700/90 focus:ring-purple-500 backdrop-blur-md"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('auth.loggingIn')}
                    </div>
                  ) : (
                    t('auth.login')
                  )}
                </button>
              </motion.div>
            </div>
          </form>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="mt-8 text-center"
          >
            <p className="text-gray-300">
              {t('auth.noAccount')}{' '}
              <Link to="/signup" className="font-medium text-purple-400 hover:text-purple-300">
                {t('auth.signUp')}
              </Link>
            </p>
          </motion.div>
          
          {/* Alternative Login Methods */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="mt-8 pt-6 border-t border-white/20"
          >
            <p className="text-center text-sm mb-4 text-gray-300">
              {t('auth.orContinueWith')}
            </p>
            <div className="flex justify-center space-x-4">
              <button 
                onClick={async () => {
                  try {
                    setLoading(true);
                    await signInWithGoogle();
                    // Note: The redirect will happen automatically, so we don't need to navigate
                  } catch (err) {
                    console.error('Google login error:', err);
                  } finally {
                    setLoading(false);
                  }
                }}
                className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 transition-colors border border-white/20 text-gray-200"
                aria-label="Login with Google"
                disabled={loading}
              >
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </button>
              <button 
                onClick={async () => {
                  try {
                    setLoading(true);
                    await signInWithApple();
                    // Note: The redirect will happen automatically, so we don't need to navigate
                  } catch (err) {
                    console.error('Apple login error:', err);
                  } finally {
                    setLoading(false);
                  }
                }}
                className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 transition-colors border border-white/20 text-gray-200"
                aria-label="Login with Apple"
                disabled={loading}
              >
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 814 1000" fill="currentColor">
                  <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/>
                </svg>
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
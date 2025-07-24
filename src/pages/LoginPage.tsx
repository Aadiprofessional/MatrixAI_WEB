import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiMoon, FiSun } from 'react-icons/fi';
import { ThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const { signIn, error, setError, user } = useAuth();
  const { t } = useLanguage();

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError(t('auth.emailRequired') + ' and ' + t('auth.passwordRequired'));
      return;
    }

    try {
      setLoading(true);
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err) {
      // Error is already set in the auth context
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
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

      {/* Left Side - Website Info */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 items-center justify-center p-12">
        <div className="max-w-xl">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative mb-8 mx-auto"
          >
            <div className="absolute inset-0 rounded-full bg-white/10 blur-xl opacity-70 animate-pulse" style={{ animationDuration: '8s' }}></div>
            <div className="relative flex items-center justify-center h-28 w-28 rounded-full overflow-hidden bg-gradient-to-br from-blue-400/80 to-purple-600/80 shadow-lg backdrop-blur-sm">
              <span className="text-5xl font-bold text-white drop-shadow-md">AI</span>
            </div>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-5xl font-bold mb-6 text-center text-white"
          >
            Matrix AI Assistant
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-xl text-center text-white/90 max-w-md mx-auto mb-12"
          >
            Your intelligent companion for productivity and creativity
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
              <p className="text-lg">Advanced AI-powered conversations</p>
            </div>
            <div className="flex items-center transform transition-transform hover:translate-x-2 bg-white/10 backdrop-blur-sm p-4 rounded-xl">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500/80 to-purple-600/80 flex items-center justify-center mr-4 shadow-md">
                <span className="text-lg">✓</span>
              </div>
              <p className="text-lg">Professional content generation</p>
            </div>
            <div className="flex items-center transform transition-transform hover:translate-x-2 bg-white/10 backdrop-blur-sm p-4 rounded-xl">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500/80 to-purple-600/80 flex items-center justify-center mr-4 shadow-md">
                <span className="text-lg">✓</span>
              </div>
              <p className="text-lg">Seamless file and image sharing</p>
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
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md p-10 rounded-3xl shadow-2xl backdrop-blur-md bg-black/30 text-white border border-white/10"
        >
          <div className="lg:hidden flex justify-center mb-8">
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="absolute inset-0 rounded-full bg-white/10 blur-xl opacity-70 animate-pulse" style={{ animationDuration: '8s' }}></div>
              <div className="relative flex items-center justify-center h-24 w-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-400/80 to-purple-600/80 shadow-lg backdrop-blur-sm">
                <span className="text-4xl font-bold text-white drop-shadow-md">AI</span>
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
                    placeholder="you@example.com"
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
                    placeholder="Enter your password"
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
                className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 transition-colors border border-white/20 text-gray-200"
                aria-label="Login with Google"
              >
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </button>
              <button 
                className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 transition-colors border border-white/20 text-gray-200"
                aria-label="Login with Apple"
              >
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.125 0c.167.14.331.31.496.47.661.66 1.157 1.456 1.49 2.39.333.934.333 1.803 0 2.607-.332.803-.828 1.456-1.49 1.96-.66.503-1.322.755-1.983.755-.332 0-.663-.084-.994-.252-.332-.167-.663-.335-.994-.503-.332-.167-.663-.251-.994-.251-.332 0-.663.084-.994.251-.332.168-.663.336-.994.503-.332.168-.663.252-.995.252-.661 0-1.322-.252-1.983-.755-.662-.504-1.158-1.157-1.49-1.96-.332-.804-.332-1.673 0-2.607.332-.934.828-1.73 1.49-2.39.661-.66 1.322-.99 1.983-.99.332 0 .663.084.994.252.332.167.663.335.994.503.332.167.663.251.994.251.332 0 .663-.084.994-.251.332-.168.663-.336.994-.503.332-.168.663-.252.995-.252.66 0 1.322.33 1.983.99zm-3.14 20.29c.662-.168 1.158-.42 1.49-.755.332-.335.662-.838.994-1.508-.662-.335-1.158-.503-1.49-.503-.332 0-.663.084-.994.252-.332.167-.663.335-.994.503-.332.167-.663.251-.994.251-.332 0-.663-.084-.994-.251-.332-.168-.663-.336-.994-.503-.332-.168-.663-.252-.995-.252-.332 0-.828.168-1.49.503.332.67.662 1.173.994 1.508.332.335.828.587 1.49.755.66.168 1.322.252 1.983.252.66 0 1.322-.084 1.983-.252zm1.983-10.062c1.322.335 2.315.838 2.977 1.508.662.67.994 1.34.994 2.01 0 .67-.332 1.34-.994 2.01-.662.67-1.655 1.173-2.977 1.508.332-.67.497-1.34.497-2.01v-3.015c0-.67-.165-1.34-.497-2.01zm-7.932 0c-.332.67-.497 1.34-.497 2.01v3.015c0 .67.165 1.34.497 2.01-1.322-.335-2.315-.838-2.977-1.508-.662-.67-.994-1.34-.994-2.01 0-.67.332-1.34.994-2.01.662-.67 1.655-1.173 2.977-1.508z" fill="currentColor"/>
                </svg>
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
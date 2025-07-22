import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiMoon, FiSun, FiGithub, FiTwitter, FiLinkedin } from 'react-icons/fi';
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
    <div className={`min-h-screen flex ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300 relative overflow-hidden`}>
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute top-96 -right-24 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-24 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>
      {/* Theme Toggle */}
      <button 
        onClick={toggleDarkMode}
        className={`fixed top-6 right-6 p-3 rounded-full z-50 transition-all ${
          darkMode ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-white text-blue-900 hover:bg-gray-100'
        } shadow-lg hover:scale-110`}
        aria-label="Toggle dark mode"
      >
        {darkMode ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
      </button>

      {/* Left Side - Branding/Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700">
          {/* Animated Gradient Overlay */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-pink-500/30 via-purple-500/20 to-blue-500/30 blur-3xl animate-pulse" style={{ animationDuration: '8s' }}></div>
            <div className="absolute bottom-0 right-0 w-full h-full bg-gradient-to-tr from-blue-500/30 via-indigo-500/20 to-purple-600/30 blur-3xl animate-pulse" style={{ animationDuration: '10s' }}></div>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-[10%] left-[20%] w-32 h-32 border-2 border-white/30 rounded-full"></div>
            <div className="absolute top-[30%] right-[15%] w-24 h-24 border border-white/20 rounded-full"></div>
            <div className="absolute bottom-[20%] left-[30%] w-40 h-40 border border-white/20 rounded-full"></div>
            <div className="absolute top-[60%] right-[25%] w-16 h-16 border-2 border-white/30 rounded-full"></div>
          </div>
          
          {/* Branding Content */}
          <div className="relative h-full flex flex-col items-center justify-center p-12 text-white">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="relative mb-8"
            >
              <div className="absolute inset-0 rounded-full bg-white/20 blur-xl opacity-70 animate-pulse" style={{ animationDuration: '8s' }}></div>
              <div className="relative flex items-center justify-center h-28 w-28 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-600 shadow-lg">
                <span className="text-5xl font-bold text-white drop-shadow-md">AI</span>
              </div>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-5xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-white"
            >
              Matrix AI Assistant
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-xl text-center text-white/80 max-w-md"
            >
              Your intelligent companion for productivity and creativity
            </motion.p>
            
            {/* Feature List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mt-12 space-y-5 text-white/90"
            >
              <div className="flex items-center transform transition-transform hover:translate-x-2">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-4 shadow-md">
                  <span className="text-lg">✓</span>
                </div>
                <p className="text-lg">Advanced AI-powered conversations</p>
              </div>
              <div className="flex items-center transform transition-transform hover:translate-x-2">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-4 shadow-md">
                  <span className="text-lg">✓</span>
                </div>
                <p className="text-lg">Professional content generation</p>
              </div>
              <div className="flex items-center transform transition-transform hover:translate-x-2">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-4 shadow-md">
                  <span className="text-lg">✓</span>
                </div>
                <p className="text-lg">Seamless file and image sharing</p>
              </div>
            </motion.div>
            
            {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="mt-16 pt-8 border-t border-white/20 w-full"
            >
              <p className="text-center text-white/70 mb-4">Trusted by innovative teams worldwide</p>
              <div className="flex justify-center space-x-6">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                  <FiGithub className="h-5 w-5" />
                </div>
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                  <FiTwitter className="h-5 w-5" />
                </div>
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                  <FiLinkedin className="h-5 w-5" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`w-full max-w-md p-10 rounded-3xl shadow-2xl backdrop-blur-sm ${
            darkMode ? 'bg-gray-800/90 text-white' : 'bg-white/90 text-gray-900'
          } border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}
        >
          <div className="lg:hidden flex justify-center mb-8">
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 blur-xl opacity-70 animate-spin" style={{ animationDuration: '8s' }}></div>
              <div className={`relative flex items-center justify-center h-24 w-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg`}>
                <span className="text-4xl font-bold text-white drop-shadow-md">AI</span>
              </div>
            </motion.div>
          </div>
          
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-3xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
          >
            {t('auth.loginTitle')}
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className={`text-center mb-8 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
          >
            {t('auth.loginSubtitle')}
          </motion.p>
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-lg mb-6 text-sm text-center ${
                darkMode ? 'bg-red-900/40 text-red-200' : 'bg-red-50 text-red-700'
              }`}
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
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} htmlFor="email">
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className={`h-5 w-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-10 pr-3 py-3.5 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                      darkMode 
                        ? 'bg-gray-700/70 text-white border border-gray-600 focus:ring-purple-500 focus:border-purple-500' 
                        : 'bg-white/70 text-gray-900 border border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                    } backdrop-blur-sm`}
                    placeholder="you@example.com"
                  />
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} htmlFor="password">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className={`h-5 w-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-10 pr-10 py-3.5 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                      darkMode 
                        ? 'bg-gray-700/70 text-white border border-gray-600 focus:ring-purple-500 focus:border-purple-500' 
                        : 'bg-white/70 text-gray-900 border border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                    } backdrop-blur-sm`}
                    placeholder="Enter your password"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`focus:outline-none ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-600'}`}
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
                    className={`h-5 w-5 rounded-md focus:ring-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-purple-500 focus:ring-purple-500' : 'bg-white border-gray-300 text-blue-500 focus:ring-blue-500'}`}
                  />
                  <label htmlFor="remember-me" className={`ml-2 block text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t('auth.rememberMe')}
                  </label>
                </div>
                <div className="text-sm">
                  <Link to="/forgot-password" className={`font-medium ${darkMode ? 'text-purple-400 hover:text-purple-300' : 'text-blue-600 hover:text-blue-500'}`}>
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
                  className={`w-full py-4 px-4 rounded-xl font-medium transition-all ${
                    loading
                      ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('auth.loggingIn')}
                    </div>
                  ) : t('auth.login')}
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
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              {t('auth.noAccount')}{' '}
              <Link to="/signup" className={`font-medium ${darkMode ? 'text-purple-400 hover:text-purple-300' : 'text-blue-600 hover:text-blue-500'}`}>
                {t('auth.signUp')}
              </Link>
            </p>
          </motion.div>
          
          {/* Alternative Login Methods */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700"
          >
            <p className={`text-center text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Or continue with
            </p>
            <div className="flex justify-center space-x-4">
              <button className={`flex items-center justify-center w-12 h-12 rounded-xl ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}>
                <FiGithub className="h-5 w-5" />
              </button>
              <button className={`flex items-center justify-center w-12 h-12 rounded-xl ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}>
                <FiTwitter className="h-5 w-5" />
              </button>
              <button className={`flex items-center justify-center w-12 h-12 rounded-xl ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}>
                <FiLinkedin className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiCheck, FiX, FiMoon, FiSun, FiGithub, FiTwitter, FiLinkedin } from 'react-icons/fi';
import { ThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../supabaseClient';

// Default language constant
const DEFAULT_LANGUAGE = 'English';

const SignupPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState(DEFAULT_LANGUAGE);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const { error, setError, user } = useAuth();
  const { t } = useLanguage();

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Function to generate a random 6-digit alphanumeric code
  const generateReferralCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Function to check if referral code is valid
  const checkReferralCode = async (code: string | null) => {
    if (!code) return { valid: true, referrerId: null }; // Empty code is considered valid (optional)
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('uid')
        .eq('referral_code', code.toUpperCase())
        .single();
          
      if (error) throw error;
        
      return { valid: !!data, referrerId: data?.uid };
    } catch (error) {
      console.error('Error checking referral code:', error);
      return { valid: false, referrerId: null };
    }
  };

  const handleSelectLanguage = (language: string) => {
    setPreferredLanguage(language);
    setLanguageModalVisible(false);
  };

  // Password strength calculation
  const getPasswordStrength = () => {
    if (!password) return 0;
    
    let strength = 0;
    
    // Length check
    if (password.length >= 8) strength += 1;
    
    // Contains uppercase
    if (/[A-Z]/.test(password)) strength += 1;
    
    // Contains lowercase
    if (/[a-z]/.test(password)) strength += 1;
    
    // Contains numbers
    if (/[0-9]/.test(password)) strength += 1;
    
    // Contains special characters
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    return strength;
  };
  
  const renderPasswordStrength = () => {
    const strength = getPasswordStrength();
    const strengthText = ['Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
    const strengthColor = [
      'bg-red-500',
      'bg-orange-500',
      'bg-yellow-500',
      'bg-green-500',
      'bg-green-600'
    ];
    
    return (
      <div className="mt-1">
        <div className="flex w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`h-full ${i < strength ? strengthColor[strength - 1] : 'bg-gray-200 dark:bg-gray-700'} ${
                i === 0 ? 'rounded-l-full' : ''
              } ${i === 4 ? 'rounded-r-full' : ''}`}
              style={{ width: '20%' }}
            ></div>
          ))}
        </div>
        {password && (
          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Strength: {strengthText[strength - 1] || 'Very Weak'}
          </p>
        )}
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (!agreeToTerms) {
      setError('You must agree to the terms and conditions');
      return;
    }
    
    try {
      setLoading(true);
      
      // Check if referral code is valid
      const { valid, referrerId } = await checkReferralCode(referralCode);
      
      if (referralCode && !valid) {
        setError('Invalid referral code');
        return;
      }
      
      // Generate a unique referral code for the new user
      const newReferralCode = generateReferralCode();
      
      // Use Supabase for signup
      const { data, error: signupError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            name: name.trim(),
            age: age ? parseInt(age, 10) : null,
            gender: gender,
            preferred_language: preferredLanguage,
            referral_code: newReferralCode,
            referrer_id: referrerId
          }
        }
      });

      if (signupError) throw signupError;

      console.log('Signup successful:', data);
      
      // Navigate to verification page
      navigate('/verification', { 
        state: { 
          email: email.trim(),
          message: 'Please check your email for a verification link.'
        } 
      });
      
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300 relative overflow-hidden`}>
      {/* Advanced AI Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Single Color Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-purple-800/30 to-purple-900/30 animate-fadeIn"></div>
        
        {/* Enhanced Glowing Orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-purple-500/20 blur-2xl animate-float animate-pulse" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-3/4 right-1/4 w-80 h-80 rounded-full bg-purple-600/20 blur-2xl animate-float animate-pulse" style={{ animationDelay: '-2s' }}></div>
        <div className="absolute top-2/4 left-3/4 w-72 h-72 rounded-full bg-purple-700/20 blur-2xl animate-float animate-pulse" style={{ animationDelay: '-4s' }}></div>
        <div className="absolute bottom-1/4 right-1/3 w-56 h-56 rounded-full bg-purple-400/20 blur-2xl animate-float animate-pulse" style={{ animationDelay: '-3s' }}></div>
        <div className="absolute top-1/3 right-1/4 w-48 h-48 rounded-full bg-purple-300/20 blur-2xl animate-float animate-pulse" style={{ animationDelay: '-1s' }}></div>
        
        {/* Digital Particles */}
        <div className="absolute inset-0 opacity-20">
          {/* Enhanced Grid Pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDUwIEwgNTAgNTAgTSA1MCAwIEwgNTAgNTAgTSAwIDAgTCA1MCAwIE0gMCAwIEwgMCA1MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIiAvPjwvc3ZnPg==')] animate-gridMove opacity-40"></div>
          
          {/* Enhanced Animated Dots */}
          <div className="absolute top-1/3 left-1/5 w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
          <div className="absolute top-2/3 left-3/5 w-3 h-3 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '-1s' }}></div>
          <div className="absolute top-1/5 left-4/5 w-3 h-3 bg-purple-600 rounded-full animate-pulse" style={{ animationDelay: '-2s' }}></div>
          <div className="absolute top-4/5 left-1/5 w-3 h-3 bg-purple-300 rounded-full animate-pulse" style={{ animationDelay: '-3s' }}></div>
          <div className="absolute top-2/5 left-2/5 w-3 h-3 bg-purple-700 rounded-full animate-pulse" style={{ animationDelay: '-0.5s' }}></div>
          <div className="absolute top-3/5 left-4/5 w-3 h-3 bg-purple-800 rounded-full animate-pulse" style={{ animationDelay: '-2.5s' }}></div>
        </div>
        
        {/* Enhanced Light Beams */}
        <div className="absolute top-0 left-1/4 w-1 h-full bg-gradient-to-b from-transparent via-purple-400/40 to-transparent animate-verticalBeam"></div>
        <div className="absolute top-0 left-2/3 w-1 h-full bg-gradient-to-b from-transparent via-purple-500/40 to-transparent animate-verticalBeam" style={{ animationDelay: '-2s' }}></div>
        <div className="absolute top-0 left-1/2 w-1 h-full bg-gradient-to-b from-transparent via-purple-600/40 to-transparent animate-verticalBeam" style={{ animationDelay: '-3s' }}></div>
        <div className="absolute top-1/3 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-400/40 to-transparent animate-beam"></div>
        <div className="absolute top-2/3 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500/40 to-transparent animate-beam" style={{ animationDelay: '-1.5s' }}></div>
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-600/40 to-transparent animate-beam" style={{ animationDelay: '-2.5s' }}></div>
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
              Join Matrix AI Today
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-xl text-center text-white/80 max-w-md"
            >
              Create your account and unlock the full potential of AI
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
                <p className="text-lg">Personalized AI experience</p>
              </div>
              <div className="flex items-center transform transition-transform hover:translate-x-2">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-4 shadow-md">
                  <span className="text-lg">✓</span>
                </div>
                <p className="text-lg">Save and share your conversations</p>
              </div>
              <div className="flex items-center transform transition-transform hover:translate-x-2">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-4 shadow-md">
                  <span className="text-lg">✓</span>
                </div>
                <p className="text-lg">Access premium features and roles</p>
              </div>
            </motion.div>
            
            {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="mt-16 pt-8 border-t border-white/20 w-full"
            >
              <p className="text-center text-white/70 mb-4">Join thousands of satisfied users</p>
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
      
      {/* Right Side - Signup Form */}
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
            {t('auth.createAccount')}
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className={`text-center mb-8 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
          >
            {t('auth.signupSubtitle')}
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
          
          <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto max-h-[60vh] pr-2 -mr-2">
            {/* Full Name */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} htmlFor="name">
                {t('auth.fullName')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className={`h-5 w-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full pl-10 pr-3 py-3.5 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                    darkMode 
                      ? 'bg-gray-700/70 text-white border border-gray-600 focus:ring-purple-500 focus:border-purple-500' 
                      : 'bg-white/70 text-gray-900 border border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                  } backdrop-blur-sm`}
                  placeholder="John Doe"
                />
              </div>
            </motion.div>

            {/* Email */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
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

            {/* Age and Gender in a row */}
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} htmlFor="age">
                  {t('auth.age')}
                </label>
                <input
                  id="age"
                  name="age"
                  type="number"
                  min="13"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className={`w-full px-3 py-3.5 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                    darkMode 
                      ? 'bg-gray-700/70 text-white border border-gray-600 focus:ring-purple-500 focus:border-purple-500' 
                      : 'bg-white/70 text-gray-900 border border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                  } backdrop-blur-sm`}
                  placeholder="25"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} htmlFor="gender">
                  {t('auth.gender')}
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className={`w-full px-3 py-3.5 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                    darkMode 
                      ? 'bg-gray-700/70 text-white border border-gray-600 focus:ring-purple-500 focus:border-purple-500' 
                      : 'bg-white/70 text-gray-900 border border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                  } backdrop-blur-sm`}
                >
                  <option value="Male">{t('auth.male')}</option>
                  <option value="Female">{t('auth.female')}</option>
                  <option value="Other">{t('auth.other')}</option>
                  <option value="Prefer not to say">{t('auth.preferNotToSay')}</option>
                </select>
              </motion.div>
            </div>

            {/* Password */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-10 pr-10 py-3.5 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                    darkMode 
                      ? 'bg-gray-700/70 text-white border border-gray-600 focus:ring-purple-500 focus:border-purple-500' 
                      : 'bg-white/70 text-gray-900 border border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                  } backdrop-blur-sm`}
                  placeholder="Create a strong password"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`focus:outline-none p-1 rounded-full hover:bg-gray-200/30 ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-600'}`}
                  >
                    {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              {renderPasswordStrength()}
            </motion.div>

            {/* Confirm Password */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} htmlFor="confirmPassword">
                {t('auth.confirmPassword')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className={`h-5 w-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full pl-10 pr-10 py-3.5 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                    darkMode 
                      ? 'bg-gray-700/70 text-white border border-gray-600 focus:ring-purple-500 focus:border-purple-500' 
                      : 'bg-white/70 text-gray-900 border border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                  } backdrop-blur-sm`}
                  placeholder="Confirm your password"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={`focus:outline-none p-1 rounded-full hover:bg-gray-200/30 ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-600'}`}
                  >
                    {showConfirmPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              {confirmPassword && (
                <div className="flex items-center mt-2">
                  {password === confirmPassword ? (
                    <div className="flex items-center text-green-500 bg-green-100/20 px-3 py-1 rounded-lg">
                      <FiCheck className="h-4 w-4 mr-1" />
                      <span className="text-xs font-medium">Passwords match</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-500 bg-red-100/20 px-3 py-1 rounded-lg">
                      <FiX className="h-4 w-4 mr-1" />
                      <span className="text-xs font-medium">Passwords do not match</span>
                    </div>
                  )}
                </div>
              )}
            </motion.div>

            {/* Referral Code */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
            >
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} htmlFor="referralCode">
                {t('auth.referralCode')} <span className="text-xs text-gray-500 ml-1 px-2 py-0.5 rounded-full bg-gray-200/30">(Optional)</span>
              </label>
              <div className="relative">
                <input
                  id="referralCode"
                  name="referralCode"
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  className={`w-full px-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 transition-all ${
                    darkMode 
                      ? 'bg-gray-700/70 text-white border border-gray-600 focus:ring-purple-500 focus:border-purple-500' 
                      : 'bg-white/70 text-gray-900 border border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                  } backdrop-blur-sm`}
                  placeholder="Enter referral code if you have one"
                />
                {referralCode && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <span className={`text-xs px-2 py-1 rounded-full ${darkMode ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-600'}`}>
                      {referralCode}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Terms and Conditions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.5 }}
              className="flex items-start mt-6"
            >
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={() => setAgreeToTerms(!agreeToTerms)}
                  className={`h-5 w-5 rounded-md focus:ring-2 cursor-pointer ${darkMode ? 'bg-gray-700 border-gray-600 text-purple-500 focus:ring-purple-500' : 'bg-white border-gray-300 text-blue-500 focus:ring-blue-500'}`}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms" className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} cursor-pointer`}>
                  {t('auth.agreeToTerms')}{' '}
                  <a href="/terms" className={`font-medium underline ${darkMode ? 'text-purple-400 hover:text-purple-300' : 'text-blue-600 hover:text-blue-500'}`}>
                    {t('auth.termsOfService')}
                  </a>{' '}
                  {t('auth.and')}{' '}
                  <a href="/privacy" className={`font-medium underline ${darkMode ? 'text-purple-400 hover:text-purple-300' : 'text-blue-600 hover:text-blue-500'}`}>
                    {t('auth.privacyPolicy')}
                  </a>
                </label>
              </div>
            </motion.div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.5 }}
              className="mt-8"
            >
              <button
                type="submit"
                disabled={loading || !agreeToTerms}
                className={`w-full py-4 px-4 rounded-xl font-medium text-lg transition-all ${
                  loading
                    ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                    : !agreeToTerms
                    ? 'bg-gradient-to-r from-blue-400/70 to-purple-500/70 text-white/80 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('auth.creatingAccount')}
                  </div>
                ) : t('auth.createAccount')}
              </button>
              {!agreeToTerms && (
                <p className="text-xs text-center mt-2 text-amber-500">
                  Please agree to the Terms of Service and Privacy Policy to continue
                </p>
              )}
            </motion.div>
          </form>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="mt-8 text-center"
          >
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              {t('auth.alreadyHaveAccount')}{' '}
              <Link to="/login" className={`font-medium ${darkMode ? 'text-purple-400 hover:text-purple-300' : 'text-blue-600 hover:text-blue-500'}`}>
                {t('auth.login')}
              </Link>
            </p>
          </motion.div>
          
          {/* Alternative Signup Methods */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3, duration: 0.5 }}
            className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700"
          >
            <p className={`text-center text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Or sign up with
            </p>
            <div className="flex justify-center space-x-4">
              <button 
                className={`flex items-center justify-center w-14 h-14 rounded-xl ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-all hover:scale-105 shadow-sm hover:shadow`}
                aria-label="Sign up with GitHub"
              >
                <FiGithub className="h-6 w-6" />
              </button>
              <button 
                className={`flex items-center justify-center w-14 h-14 rounded-xl ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-all hover:scale-105 shadow-sm hover:shadow`}
                aria-label="Sign up with Twitter"
              >
                <FiTwitter className="h-6 w-6" />
              </button>
              <button 
                className={`flex items-center justify-center w-14 h-14 rounded-xl ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-all hover:scale-105 shadow-sm hover:shadow`}
                aria-label="Sign up with LinkedIn"
              >
                <FiLinkedin className="h-6 w-6" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default SignupPage;
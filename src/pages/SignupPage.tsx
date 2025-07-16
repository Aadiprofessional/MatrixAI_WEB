import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiCheck, FiX, FiMoon, FiSun } from 'react-icons/fi';
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
        <div className="flex w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`h-full ${i < strength ? strengthColor[strength - 1] : 'bg-gray-200'} ${
                i === 0 ? 'rounded-l-full' : ''
              } ${i === 4 ? 'rounded-r-full' : ''}`}
              style={{ width: '20%' }}
            ></div>
          ))}
        </div>
        {password && (
          <p className="text-xs mt-1 text-gray-600">
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
      
      // Pass user data to verification screen
      const userData = {
        uid: data.user?.id || '',
        name: name.trim(),
        email: email.trim(),
        age: age ? parseInt(age, 10) : null,
        gender: gender,
        preferred_language: preferredLanguage,
        referral_code: newReferralCode,
        referrerId: referrerId,
        password: password // Pass password for auto-login after verification
      };
      
      // Navigate to email verification page instead of login page
      navigate('/verify-email', { 
        state: { 
          email: email.trim(),
          message: 'We have sent a verification link to your email. Please verify your email within 10 minutes to continue.',
          isNewUser: true,
          userData: userData
        } 
      });
    } catch (err: any) {
      console.error('Error during signup:', err);
      
      // Handle specific error cases
      if (err.message && err.message.includes('already registered')) {
        setError('This email is already registered. Please login instead.');
        navigate('/login');
        return;
      }
      
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 py-12 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
      {/* Animated Background Gradients */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-br from-blue-500/30 via-indigo-500/20 to-purple-600/30 blur-3xl opacity-60 animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-0 right-0 w-full h-1/3 bg-gradient-to-tr from-purple-600/30 via-pink-500/20 to-blue-500/30 blur-3xl opacity-60 animate-pulse" style={{ animationDuration: '10s' }}></div>
      </div>

      {/* Theme Toggle */}
      <button 
        onClick={toggleDarkMode}
        className={`fixed top-6 right-6 p-2 rounded-full z-50 transition-colors ${
          darkMode ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-white text-blue-900 hover:bg-gray-100'
        } shadow-lg`}
        aria-label="Toggle dark mode"
      >
        {darkMode ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
      </button>
      
      <div className="relative w-full max-w-xl">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`p-8 rounded-2xl shadow-xl backdrop-blur-xl ${
            darkMode ? 'bg-gray-800/80 text-white' : 'bg-white/90 text-gray-900'
          } border border-opacity-20 ${
            darkMode ? 'border-purple-500/30' : 'border-blue-500/30'
          }`}
        >
          <h1 className={`text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 mb-2`}>
            Create your account
          </h1>
          <p className={`text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-8`}>
            Sign up to get started
          </p>
          
          {error && (
            <div className={`p-3 rounded-lg mb-6 text-sm text-center ${
              darkMode ? 'bg-red-900/40 text-red-200' : 'bg-red-50 text-red-700'
            }`}>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`} htmlFor="name">
                  Full Name
                </label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className={`h-5 w-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full pl-10 pr-3 py-3 rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                      darkMode 
                        ? 'bg-gray-700 text-white border-gray-600 focus:ring-purple-500' 
                        : 'bg-white text-gray-900 border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="John Doe"
                  />
                </div>
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`} htmlFor="email">
                  Email Address
                </label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className={`h-5 w-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-10 pr-3 py-3 rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                      darkMode 
                        ? 'bg-gray-700 text-white border-gray-600 focus:ring-purple-500' 
                        : 'bg-white text-gray-900 border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`} htmlFor="age">
                    Age
                  </label>
                  <input
                    id="age"
                    name="age"
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className={`w-full px-3 py-3 rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                      darkMode 
                        ? 'bg-gray-700 text-white border-gray-600 focus:ring-purple-500' 
                        : 'bg-white text-gray-900 border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="25"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`} htmlFor="gender">
                    Gender
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className={`w-full px-3 py-3 rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                      darkMode 
                        ? 'bg-gray-700 text-white border-gray-600 focus:ring-purple-500' 
                        : 'bg-white text-gray-900 border-gray-300 focus:ring-blue-500'
                    }`}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`} htmlFor="language">
                  Preferred Language
                </label>
                <select
                  id="language"
                  name="language"
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className={`w-full px-3 py-3 rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    darkMode 
                      ? 'bg-gray-700 text-white border-gray-600 focus:ring-purple-500' 
                      : 'bg-white text-gray-900 border-gray-300 focus:ring-blue-500'
                  }`}
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Chinese">Chinese</option>
                  <option value="Japanese">Japanese</option>
                  <option value="Korean">Korean</option>
                </select>
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`} htmlFor="password">
                  Password
                </label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className={`h-5 w-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-10 pr-10 py-3 rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                      darkMode 
                        ? 'bg-gray-700 text-white border-gray-600 focus:ring-purple-500' 
                        : 'bg-white text-gray-900 border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="Create a password"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className={`focus:outline-none ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-600'}`}
                    >
                      {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                {renderPasswordStrength()}
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`} htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className={`h-5 w-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pl-10 pr-10 py-3 rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                      darkMode 
                        ? 'bg-gray-700 text-white border-gray-600 focus:ring-purple-500' 
                        : 'bg-white text-gray-900 border-gray-300 focus:ring-blue-500'
                    } ${
                      confirmPassword && password !== confirmPassword
                        ? darkMode ? 'ring-2 ring-red-500' : 'border-red-500 ring-red-500'
                        : ''
                    }`}
                    placeholder="Confirm your password"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={toggleConfirmPasswordVisibility}
                      className={`focus:outline-none ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-600'}`}
                    >
                      {showConfirmPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                    </button>
                  </div>
                  {confirmPassword && (
                    <div className="absolute inset-y-0 right-12 pr-3 flex items-center">
                      {password === confirmPassword ? (
                        <FiCheck className="h-5 w-5 text-green-500" />
                      ) : (
                        <FiX className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`} htmlFor="referralCode">
                  Referral Code (Optional)
                </label>
                <input
                  id="referralCode"
                  name="referralCode"
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  className={`w-full px-3 py-3 rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    darkMode 
                      ? 'bg-gray-700 text-white border-gray-600 focus:ring-purple-500' 
                      : 'bg-white text-gray-900 border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="Enter referral code"
                />
              </div>
              
              <div className="mt-6">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="terms"
                      name="terms"
                      type="checkbox"
                      checked={agreeToTerms}
                      onChange={(e) => setAgreeToTerms(e.target.checked)}
                      className={`focus:ring-3 h-4 w-4 rounded border-gray-300 ${
                        darkMode 
                          ? 'bg-gray-700 text-purple-500 focus:ring-purple-600' 
                          : 'bg-white text-blue-600 focus:ring-blue-300'
                      }`}
                    />
                  </div>
                  <div className="ml-3">
                    <label htmlFor="terms" className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      I agree to the{' '}
                      <Link to="/terms" className={`font-medium ${darkMode ? 'text-purple-400' : 'text-blue-600'} hover:underline`}>
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link to="/privacy" className={`font-medium ${darkMode ? 'text-purple-400' : 'text-blue-600'} hover:underline`}>
                        Privacy Policy
                      </Link>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full relative py-3 px-4 rounded-lg font-medium transition-all ${
                    darkMode
                      ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white'
                      : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white'
                  } shadow-lg ${
                    loading ? 'opacity-80' : ''
                  } group overflow-hidden`}
                >
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-gradient-x"></span>
                  <span className="relative flex items-center justify-center">
                    {loading ? (
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      'Create Account'
                    )}
                  </span>
                </button>
              </div>
            </div>
          </form>
          
          <p className={`mt-8 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Already have an account?{' '}
            <Link to="/login" className={`font-medium ${
              darkMode ? 'text-purple-400 hover:text-purple-300' : 'text-blue-600 hover:text-blue-500'
            }`}>
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default SignupPage; 
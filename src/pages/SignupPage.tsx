import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiCheck, FiX } from 'react-icons/fi';

const SignupPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [planType, setPlanType] = useState<'personal' | 'enterprise'>('personal');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
    
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (getPasswordStrength() < 3) {
      setError('Please use a stronger password');
      return;
    }
    
    if (!agreeToTerms) {
      setError('You must agree to the terms and conditions');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real app, you would register the user here
      
      // Navigate to the appropriate dashboard based on plan type
      if (planType === 'enterprise') {
        navigate('/enterprise-chat');
      } else {
        navigate('/chat');
      }
    } catch (err) {
      setError('Error creating account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-12">
      <div className="relative w-full max-w-xl">
        {/* Decorative elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary-100 rounded-full opacity-50 blur-3xl"></div>
          <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-secondary-100 rounded-full opacity-40 blur-3xl"></div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white p-8 rounded-2xl shadow-soft"
        >
          <div className="flex justify-center mb-6">
            <img src="/logo.svg" alt="Matrix AI" className="h-16 w-auto" />
          </div>
          
          <h1 className="text-2xl font-display font-bold text-center text-gray-900 mb-2">
            Create your account
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Start your journey with Matrix AI today
          </p>
          
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-6 text-sm text-center">
              {error}
            </div>
          )}
          
          {/* Plan selection */}
          <div className="mb-8">
            <p className="text-sm font-medium text-gray-700 mb-2">Select a plan:</p>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPlanType('personal')}
                className={`relative p-4 border rounded-lg focus:outline-none transition-all duration-200 ${
                  planType === 'personal'
                    ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500 ring-opacity-50'
                    : 'border-gray-300 hover:border-primary-400'
                }`}
              >
                <div className="text-left">
                  <span className="block text-lg font-semibold text-gray-900">Personal</span>
                  <span className="mt-1 block text-sm text-gray-500">
                    For individual use
                  </span>
                  <span className="mt-2 block text-primary-600 font-medium">
                    Free trial, then $19/mo
                  </span>
                </div>
                {planType === 'personal' && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                    <FiCheck className="text-white" size={12} />
                  </div>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => setPlanType('enterprise')}
                className={`relative p-4 border rounded-lg focus:outline-none transition-all duration-200 ${
                  planType === 'enterprise'
                    ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-500 ring-opacity-50'
                    : 'border-gray-300 hover:border-primary-400'
                }`}
              >
                <div className="text-left">
                  <span className="block text-lg font-semibold text-gray-900">Enterprise</span>
                  <span className="mt-1 block text-sm text-gray-500">
                    For teams & businesses
                  </span>
                  <span className="mt-2 block text-primary-600 font-medium">
                    Free trial, then $99/mo
                  </span>
                </div>
                {planType === 'enterprise' && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                    <FiCheck className="text-white" size={12} />
                  </div>
                )}
              </button>
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">
                  Full Name
                </label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input pl-10"
                    placeholder="John Doe"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
                  Email Address
                </label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input pl-10"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
                  Password
                </label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pl-10 pr-10"
                    placeholder="Create a strong password"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-500 focus:outline-none"
                    >
                      {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                {renderPasswordStrength()}
                
                <div className="mt-2 space-y-1">
                  <div className="flex items-center">
                    <div className={`mr-2 ${password.length >= 8 ? 'text-green-500' : 'text-gray-300'}`}>
                      {password.length >= 8 ? <FiCheck size={14} /> : <FiX size={14} />}
                    </div>
                    <span className="text-xs text-gray-600">At least 8 characters</span>
                  </div>
                  <div className="flex items-center">
                    <div className={`mr-2 ${/[A-Z]/.test(password) ? 'text-green-500' : 'text-gray-300'}`}>
                      {/[A-Z]/.test(password) ? <FiCheck size={14} /> : <FiX size={14} />}
                    </div>
                    <span className="text-xs text-gray-600">At least 1 uppercase letter</span>
                  </div>
                  <div className="flex items-center">
                    <div className={`mr-2 ${/[0-9]/.test(password) ? 'text-green-500' : 'text-gray-300'}`}>
                      {/[0-9]/.test(password) ? <FiCheck size={14} /> : <FiX size={14} />}
                    </div>
                    <span className="text-xs text-gray-600">At least 1 number</span>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="confirmPassword">
                  Confirm Password
                </label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input pl-10"
                    placeholder="Confirm your password"
                  />
                </div>
                {confirmPassword && (
                  <div className="mt-2 flex items-center">
                    <div className={`mr-2 ${password === confirmPassword ? 'text-green-500' : 'text-red-500'}`}>
                      {password === confirmPassword ? <FiCheck size={14} /> : <FiX size={14} />}
                    </div>
                    <span className="text-xs text-gray-600">
                      {password === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    checked={agreeToTerms}
                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="terms" className="text-gray-700">
                    I agree to the{' '}
                    <Link to="/terms" className="text-primary-600 hover:text-primary-500">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
                      Privacy Policy
                    </Link>
                  </label>
                </div>
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full btn btn-primary py-3 relative ${loading ? 'opacity-80' : ''}`}
                >
                  {loading ? (
                    <>
                      <span className="opacity-0">Create Account</span>
                      <span className="absolute inset-0 flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </span>
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </div>
            </div>
          </form>
          
          <p className="mt-8 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default SignupPage; 
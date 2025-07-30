import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiArrowLeft, FiMoon, FiSun, FiCheck } from 'react-icons/fi';
import { ThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../components/LanguageSelector';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const { resetPassword, error, setError } = useAuth();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !email.includes('@')) {
      setError(t('forgotPassword.invalidEmail'));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await resetPassword(email.trim());
      setEmailSent(true);
    } catch (error: any) {
      console.error('Reset password error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
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
            {t('common.videoNotSupported')}
          </video>
          {/* Black Overlay */}
          <div className="absolute inset-0 bg-black/60"></div>
        </div>
        
        {/* Theme Toggle */}
        <button 
          onClick={toggleDarkMode}
          className="fixed top-6 right-6 p-3 rounded-full z-50 transition-all bg-black/40 text-white hover:bg-black/60 backdrop-blur-sm shadow-lg hover:scale-110"
          aria-label={t('common.toggleDarkMode')}
        >
          {darkMode ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
        </button>

        {/* Language Selector */}
        <div className="fixed top-6 right-20 z-50">
          <LanguageSelector />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 w-full max-w-md"
        >
          <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8">
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                <FiCheck className="h-8 w-8 text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                {t('forgotPassword.emailSent')}
              </h1>
              <p className="text-gray-300 text-sm leading-relaxed">
                {t('forgotPassword.checkEmail')}
              </p>
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-4">
                  {t('forgotPassword.didntReceive')}
                </p>
                <button
                  onClick={() => {
                    setEmailSent(false);
                    setEmail('');
                  }}
                  className="text-purple-400 hover:text-purple-300 text-sm font-medium"
                >
                  {t('forgotPassword.tryAgain')}
                </button>
              </div>

              <div className="pt-4 border-t border-white/10">
                <Link
                  to="/login"
                  className="flex items-center justify-center text-gray-400 hover:text-white transition-colors text-sm"
                >
                  <FiArrowLeft className="h-4 w-4 mr-2" />
                  {t('forgotPassword.backToLogin')}
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
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
        aria-label={t('common.toggleDarkMode')}
      >
        {darkMode ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
      </button>

      {/* Language Selector */}
      <div className="fixed top-6 right-20 z-50">
        <LanguageSelector />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">
              {t('forgotPassword.title')}
            </h1>
            <p className="text-gray-300 text-sm leading-relaxed">
              {t('forgotPassword.subtitle')}
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm backdrop-blur-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
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
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-3.5 rounded-xl focus:outline-none focus:ring-2 transition-all bg-white/10 text-white border border-white/20 focus:ring-purple-500 focus:border-purple-500 backdrop-blur-md"
                  placeholder={t('forgotPassword.emailPlaceholder')}
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all backdrop-blur-md"
              >
                {loading ? t('forgotPassword.sending') : t('forgotPassword.sendResetEmail')}
              </button>
            </motion.div>
          </form>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-6 pt-6 border-t border-white/10"
          >
            <div className="text-center">
              <Link
                to="/login"
                className="flex items-center justify-center text-gray-400 hover:text-white transition-colors text-sm"
              >
                <FiArrowLeft className="h-4 w-4 mr-2" />
                {t('forgotPassword.backToLogin')}
              </Link>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
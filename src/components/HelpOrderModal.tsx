import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHelpCircle, FiX } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';

interface HelpOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
}

const HelpOrderModal: React.FC<HelpOrderModalProps> = ({
  isOpen,
  onClose,
  orderId
}) => {
  const { t } = useTranslation();
  const { darkMode } = useTheme();
  const { user } = useAuth();
  
  const [issue, setIssue] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Issue options
  const issueOptions = [
    { value: 'technical', label: t('help.issueOptions.technical') },
    { value: 'billing', label: t('help.issueOptions.billing') },
    { value: 'subscription', label: t('help.issueOptions.subscription') },
    { value: 'feature', label: t('help.issueOptions.feature') },
    { value: 'other', label: t('help.issueOptions.other') }
  ];
  
  // Form validation
  const validateForm = () => {
    if (!issue) {
      setError(t('help.issueRequired'));
      return false;
    }
    
    if (!description) {
      setError(t('help.descriptionRequired'));
      return false;
    }
    
    return true;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !user?.uid) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await userService.getHelp(
        user.uid,
        issue,
        description,
        orderId
      );
      
      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          // Reset form after closing
          setIssue('');
          setDescription('');
          setSuccess(false);
        }, 2000);
      } else {
        setError(t('help.errorMessage'));
      }
    } catch (error) {
      console.error('Error submitting help request:', error);
      setError(t('help.errorMessage'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative z-10 max-w-md w-full mx-4 pointer-events-auto"
          >
            <div className={`
              p-5 rounded-lg border shadow-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
            `}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    <FiHelpCircle className="w-6 h-6" />
                  </div>
                  <h3 className={`ml-3 text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {t('help.helpWithOrder')}
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className={`flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              
              {success ? (
                <div className={`p-4 mb-4 rounded-lg ${darkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-50 text-green-800'}`}>
                  {t('help.successMessage')}
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {/* Order ID */}
                  <div className="mb-4">
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('help.orderNumber')}
                    </label>
                    <input
                      type="text"
                      value={orderId}
                      disabled
                      className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-100 border-gray-300 text-gray-800'}`}
                    />
                  </div>
                  
                  {/* Issue Selection */}
                  <div className="mb-4">
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('help.selectIssue')}
                    </label>
                    <select
                      value={issue}
                      onChange={(e) => setIssue(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-white border-gray-300 text-gray-800'}`}
                    >
                      <option value="">{t('help.selectIssue')}</option>
                      {issueOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Description */}
                  <div className="mb-4">
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('feedback.describeIssue')}
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-white border-gray-300 text-gray-800'}`}
                      placeholder={t('feedback.descriptionPlaceholder')}
                    />
                  </div>
                  
                  {/* Error message */}
                  {error && (
                    <div className={`p-3 mb-4 rounded-lg ${darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-800'}`}>
                      {error}
                    </div>
                  )}
                  
                  {/* Buttons */}
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className={`px-4 py-2 rounded-md transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                    >
                      {t('help.cancelButton')}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`px-4 py-2 rounded-md transition-colors ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'} ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center">
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          {t('help.submitButton')}
                        </div>
                      ) : t('help.submitButton')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default HelpOrderModal;
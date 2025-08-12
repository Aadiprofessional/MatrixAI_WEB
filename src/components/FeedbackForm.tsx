import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiSend } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';

const FeedbackForm: React.FC = () => {
  const { t } = useTranslation();
  const { darkMode } = useTheme();
  const { user } = useAuth();
  
  const [selectedIssue, setSelectedIssue] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Issue options
  const issueOptions = [
    { value: 'greatExperience', label: t('feedback.issueOptions.greatExperience') },
    { value: 'goodExperience', label: t('feedback.issueOptions.goodExperience') },
    { value: 'couldBeBetter', label: t('feedback.issueOptions.couldBeBetter') },
    { value: 'notHelpful', label: t('feedback.issueOptions.notHelpful') },
    { value: 'otherIssues', label: t('feedback.issueOptions.otherIssues') }
  ];
  
  // Handle issue selection
  const handleIssueSelect = (value: string) => {
    setSelectedIssue(value);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedIssue) {
      setError(t('help.issueRequired'));
      return;
    }
    
    if (!description) {
      setError(t('help.descriptionRequired'));
      return;
    }
    
    if (!user?.uid) {
      setError('You must be logged in to submit feedback');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await userService.submitFeedback(
        user.uid,
        selectedIssue,
        description
      );
      
      if (response.success) {
        setSuccess(true);
        setSelectedIssue('');
        setDescription('');
        
        // Reset success message after 5 seconds
        setTimeout(() => {
          setSuccess(false);
        }, 5000);
      } else {
        setError(t('feedback.errorMessage'));
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setError(t('feedback.errorMessage'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="mb-16"
    >
      <div className={`rounded-xl glass-effect border p-6 ${darkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
        <h2 className="text-2xl font-bold mb-6 text-primary">
          {t('feedback.title')}
        </h2>
        
        {success ? (
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-50 text-green-800'}`}>
            {t('feedback.successMessage')}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <h3 className={`text-lg font-medium mb-4 ${darkMode ? 'text-primary' : 'text-gray-800'}`}>
                {t('feedback.subtitle')}
              </h3>
              
              <div className="space-y-3">
                {issueOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleIssueSelect(option.value)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${selectedIssue === option.value
                      ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                      : (darkMode ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-white text-gray-800 hover:bg-gray-50')
                    } ${darkMode ? 'border border-gray-700' : 'border border-gray-300'}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className={`text-lg font-medium mb-4 ${darkMode ? 'text-primary' : 'text-gray-800'}`}>
                {t('feedback.describeIssue')}
              </h3>
              
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className={`w-full px-4 py-3 rounded-lg ${darkMode
                  ? 'bg-gray-800 text-gray-200 border border-gray-700 focus:border-blue-500'
                  : 'bg-white text-gray-800 border border-gray-300 focus:border-blue-500'
                } focus:ring-blue-500 focus:outline-none`}
                placeholder={t('feedback.descriptionPlaceholder')}
              />
            </div>
            
            {error && (
              <div className={`p-4 mb-6 rounded-lg ${darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-800'}`}>
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex justify-center items-center px-6 py-3 rounded-lg transition-colors ${darkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
              } ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  {t('feedback.submitButton')}
                </div>
              ) : (
                <>
                  <FiSend className="mr-2" />
                  {t('feedback.submitButton')}
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </motion.div>
  );
};

export default FeedbackForm;
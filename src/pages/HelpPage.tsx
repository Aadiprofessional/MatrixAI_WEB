import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '../context/ThemeContext';
import { Layout } from '../components';
import { 
  FiSearch, 
  FiHelpCircle, 
  FiMessageSquare, 
  FiMail, 
  FiPhone,
  FiBookOpen,
  FiInfo,
  FiExternalLink,
  FiArrowRight,
  FiChevronDown,
  FiChevronUp,
  FiCpu
} from 'react-icons/fi';

// FAQ Item component
const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { darkMode } = useContext(ThemeContext);
  
  return (
    <div className={`border-b py-4 ${
      darkMode ? 'border-gray-700' : 'border-gray-200'
    }`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center focus:outline-none"
      >
        <h3 className="text-lg font-medium text-left text-primary">
          {question}
        </h3>
        <span>
          {isOpen ? (
            <FiChevronUp className="text-tertiary" />
          ) : (
            <FiChevronDown className="text-tertiary" />
          )}
        </span>
      </button>
      
      {isOpen && (
        <div className="mt-2 text-secondary">
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
};

// Help Category component
const HelpCategory = ({ title, icon, description, linkText, linkUrl }: { 
  title: string;
  icon: React.ReactNode;
  description: string;
  linkText: string;
  linkUrl: string;
}) => {
  const { darkMode } = useContext(ThemeContext);
  
  return (
    <div className={`rounded-xl h-full glass-effect border p-6 transition-all duration-300 hover:shadow-lg ${
      darkMode ? 'border-gray-700/50' : 'border-gray-200/50'
    }`}>
      <div className={`w-12 h-12 rounded-lg text-white flex items-center justify-center mb-4 ${
        darkMode 
          ? 'bg-gradient-to-r from-blue-900 to-purple-900' 
          : 'bg-gradient-to-r from-blue-600 to-purple-600'
      }`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2 text-primary">
        {title}
      </h3>
      <p className="mb-4 text-secondary">
        {description}
      </p>
      <a 
        href={linkUrl}
        className={`inline-flex items-center font-medium ${
          darkMode 
            ? 'text-blue-400 hover:text-blue-300' 
            : 'text-blue-600 hover:text-blue-700'
        }`}
      >
        {linkText}
        <FiArrowRight className="ml-2" />
      </a>
    </div>
  );
};

const HelpPage: React.FC = () => {
  const { t } = useTranslation();
  const { darkMode } = useContext(ThemeContext);
  const [searchQuery, setSearchQuery] = useState('');
  
  // FAQ Data
  const faqData = [
    {
      question: t('help.faq.whatIsMatrixAI.question'),
      answer: t('help.faq.whatIsMatrixAI.answer')
    },
    {
      question: t('help.faq.howToGetStarted.question'),
      answer: t('help.faq.howToGetStarted.answer')
    },
    {
      question: t('help.faq.pricingPlans.question'),
      answer: t('help.faq.pricingPlans.answer')
    },
    {
      question: t('help.faq.accuracy.question'),
      answer: t('help.faq.accuracy.answer')
    },
    {
      question: t('help.faq.commercialUse.question'),
      answer: t('help.faq.commercialUse.answer')
    },
    {
      question: t('help.faq.cancelSubscription.question'),
      answer: t('help.faq.cancelSubscription.answer')
    },
    {
      question: t('help.faq.dataSecurity.question'),
      answer: t('help.faq.dataSecurity.answer')
    }
  ];
  
  // Help categories
  const helpCategories = [
    {
      title: t('help.categories.documentation.title'),
      icon: <FiBookOpen className="h-5 w-5" />,
      description: t('help.categories.documentation.description'),
      linkText: t('help.categories.documentation.linkText'),
      linkUrl: "/documentation"
    },
    {
      title: t('help.categories.videoTutorials.title'),
      icon: <FiExternalLink className="h-5 w-5" />,
      description: t('help.categories.videoTutorials.description'),
      linkText: t('help.categories.videoTutorials.linkText'),
      linkUrl: "/tutorials"
    },
    {
      title: t('help.categories.contactSupport.title'),
      icon: <FiMail className="h-5 w-5" />,
      description: t('help.categories.contactSupport.description'),
      linkText: t('help.categories.contactSupport.linkText'),
      linkUrl: "/contact"
    },
    {
      title: t('help.categories.communityForum.title'),
      icon: <FiMessageSquare className="h-5 w-5" />,
      description: t('help.categories.communityForum.description'),
      linkText: t('help.categories.communityForum.linkText'),
      linkUrl: "/forum"
    }
  ];

  return (
    <Layout>
      <div className={`py-8 px-4 lg:px-8 page-background ${
        darkMode ? 'dark' : ''
      }`}>
        {/* Background gradient effects */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-purple-500/10 blur-3xl opacity-70"></div>
          <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-purple-500/10 via-pink-500/5 to-blue-500/10 blur-3xl opacity-70"></div>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-3xl font-bold text-primary">
              {t('help.title')}
            </h1>
            <p className="text-tertiary mt-2 max-w-2xl mx-auto">
              {t('help.subtitle')}
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-2xl mx-auto mb-12"
          >
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-tertiary">
                <FiSearch className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`block w-full p-4 pl-10 text-sm rounded-lg text-primary focus:ring-blue-500 focus:border-blue-500 ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 placeholder-gray-400' 
                    : 'bg-white border-gray-300 placeholder-gray-500'
                }`}
                placeholder={t('help.searchPlaceholder')}
              />
              <button 
                className="absolute right-2.5 bottom-2.5 px-4 py-2 rounded-lg text-white btn-primary"
              >
                {t('help.searchButton')}
              </button>
            </div>
          </motion.div>

          {/* Help Categories */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-bold mb-6 text-primary">
              {t('help.resourcesTitle')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {helpCategories.map((category, index) => (
                <HelpCategory
                  key={index}
                  title={category.title}
                  icon={category.icon}
                  description={category.description}
                  linkText={category.linkText}
                  linkUrl={category.linkUrl}
                />
              ))}
            </div>
          </motion.div>

          {/* Frequently Asked Questions */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-bold mb-6 text-primary">
              {t('help.faqTitle')}
            </h2>
            <div className={`rounded-xl glass-effect border p-6 ${
              darkMode ? 'border-gray-700/50' : 'border-gray-200/50'
            }`}>
              {faqData.map((faq, index) => (
                <FAQItem key={index} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </motion.div>

          {/* AI Assistant */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mb-8"
          >
            <div className={`rounded-xl glass-effect border p-6 text-center ${
              darkMode ? 'border-gray-700/50' : 'border-gray-200/50'
            }`}>
              <div className={`mx-auto w-16 h-16 rounded-full text-white flex items-center justify-center mb-4 ${
                darkMode 
                  ? 'bg-gradient-to-r from-blue-900 to-purple-900' 
                  : 'bg-gradient-to-r from-blue-600 to-purple-600'
              }`}>
                <FiCpu className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-primary">
                {t('help.needMoreHelp.title')}
              </h2>
              <p className="mb-6 max-w-2xl mx-auto text-secondary">
                {t('help.needMoreHelp.description')}
              </p>
              <button
                className="px-6 py-3 rounded-lg btn-primary flex items-center mx-auto"
              >
                <FiMessageSquare className="mr-2" />
                {t('help.needMoreHelp.chatButton')}
              </button>
            </div>
          </motion.div>

          {/* Contact Information */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className={`rounded-xl glass-effect border p-6 ${
              darkMode ? 'border-gray-700/50' : 'border-gray-200/50'
            }`}>
              <h2 className="text-2xl font-bold mb-6 text-primary">
                {t('help.contact.title')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start">
                  <div className={`rounded-lg p-3 mr-4 ${
                    darkMode 
                      ? 'bg-gray-700 text-blue-400' 
                      : 'bg-gray-100 text-blue-600'
                  }`}>
                    <FiMail className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-medium text-primary">
                      {t('help.contact.emailSupport')}
                    </h3>
                    <p className="text-secondary mt-1">
                      {t('help.contact.responseTime')}
                    </p>
                    <a 
                      href="mailto:support@matrixaiglobal.com"
                      className={`mt-2 inline-block font-medium ${
                        darkMode 
                          ? 'text-blue-400 hover:text-blue-300' 
                          : 'text-blue-600 hover:text-blue-700'
                      }`}
                    >
                      support@matrixaiglobal.com
                    </a>
                  </div>
                </div>
                
               
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </Layout>
  );
};

export default HelpPage;
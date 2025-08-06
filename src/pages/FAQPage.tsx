import React from 'react';
import { motion } from 'framer-motion';
import { FiHelpCircle } from 'react-icons/fi';
import { HomeNavbar } from '../components';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const FAQPage: React.FC = () => {
  const { darkMode } = useTheme();
  const { t } = useTranslation();
  
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-black text-white' : 'bg-white text-gray-800'}`}>
      {/* Add HomeNavbar */}
      <HomeNavbar />
      
      {/* Main content with padding for the fixed navbar */}
      <div className="pt-24">
        {/* FAQ Section */}
        <section className="py-20 relative">
          {/* Background gradient */}
          <div className={`absolute inset-0 ${darkMode ? 'bg-gradient-to-b from-black/90 to-black' : 'bg-gradient-to-b from-gray-50/90 to-white'} z-0`}></div>
          
          {/* Animated grid background */}
          <div className="absolute inset-0 z-0 opacity-20">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          </div>
          
          {/* Glowing orb decoration */}
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/20 rounded-full filter blur-3xl opacity-20"></div>
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full filter blur-3xl opacity-20"></div>
          
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
              >
                <div className="flex justify-center mb-4">
                  <div className="bg-purple-900/30 p-4 rounded-full">
                    <FiHelpCircle className="h-10 w-10 text-purple-400" />
                  </div>
                </div>
                <h1 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'} mb-4`}>{t('faq.title')}</h1>
                <p className={`mt-4 text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto`}>
                  {t('faq.description')}
                </p>
              </motion.div>
            </div>
            
            <div className="space-y-8">
              {/* General Questions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <h2 className={`text-2xl font-semibold ${darkMode ? 'text-purple-400' : 'text-purple-600'} mb-6`}>{t('faq.sections.general.title')}</h2>
                <div className="space-y-6">
                  {[
                    {
                      question: t('faq.sections.general.questions.whatIsMatrixAI.question'),
                      answer: t('faq.sections.general.questions.whatIsMatrixAI.answer')
                    },
                    {
                      question: t('faq.sections.general.questions.howToGetStarted.question'),
                      answer: t('faq.sections.general.questions.howToGetStarted.answer')
                    },
                    {
                      question: t('faq.sections.general.questions.suitableForBeginners.question'),
                      answer: t('faq.sections.general.questions.suitableForBeginners.answer')
                    },
                  ].map((faq, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className={`backdrop-blur-md ${darkMode ? 'bg-black/30 border-gray-700 hover:shadow-purple-900/20 hover:border-purple-700/50' : 'bg-white/70 border-gray-200 hover:shadow-purple-500/20 hover:border-purple-300'} rounded-lg p-6 shadow-lg transition-all duration-300`}
                    >
                      <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{faq.question}</h3>
                      <p className={`mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{faq.answer}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
              
              {/* Subscription & Pricing */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <h2 className={`text-2xl font-semibold ${darkMode ? 'text-purple-400' : 'text-purple-600'} mb-6`}>{t('faq.sections.subscription.title')}</h2>
                <div className="space-y-6">
                  {[
                    {
                      question: t('faq.sections.subscription.questions.subscriptionPlans.question'),
                      answer: t('faq.sections.subscription.questions.subscriptionPlans.answer')
                    },
                    {
                      question: t('faq.sections.subscription.questions.upgradeDowngrade.question'),
                      answer: t('faq.sections.subscription.questions.upgradeDowngrade.answer')
                    },
                    {
                      question: t('faq.sections.subscription.questions.refunds.question'),
                      answer: t('faq.sections.subscription.questions.refunds.answer')
                    },
                  ].map((faq, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className={`backdrop-blur-md ${darkMode ? 'bg-black/30 border-gray-700 hover:shadow-purple-900/20 hover:border-purple-700/50' : 'bg-white/70 border-gray-200 hover:shadow-purple-500/20 hover:border-purple-300'} rounded-lg p-6 shadow-lg transition-all duration-300`}
                    >
                      <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{faq.question}</h3>
                      <p className={`mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{faq.answer}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
              
              {/* Technical Support */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <h2 className={`text-2xl font-semibold ${darkMode ? 'text-purple-400' : 'text-purple-600'} mb-6`}>{t('faq.sections.support.title')}</h2>
                <div className="space-y-6">
                  {[
                    {
                      question: t('faq.sections.support.questions.responseTime.question'),
                      answer: t('faq.sections.support.questions.responseTime.answer')
                    },
                   
                    {
                      question: t('faq.sections.support.questions.knowledgeBase.question'),
                      answer: t('faq.sections.support.questions.knowledgeBase.answer')
                    },
                    {
                      question: t('faq.sections.support.questions.partnership.question'),
                      answer: t('faq.sections.support.questions.partnership.answer')
                    }
                  ].map((faq, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className={`backdrop-blur-md ${darkMode ? 'bg-black/30 border-gray-700 hover:shadow-purple-900/20 hover:border-purple-700/50' : 'bg-white/70 border-gray-200 hover:shadow-purple-500/20 hover:border-purple-300'} rounded-lg p-6 shadow-lg transition-all duration-300`}
                    >
                      <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{faq.question}</h3>
                      <p className={`mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{faq.answer}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default FAQPage;
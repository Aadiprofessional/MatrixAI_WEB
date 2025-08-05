import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiCheck, FiStar, FiZap, FiTrendingUp, FiPackage, FiMic, FiImage, FiVideo, FiMessageSquare, FiEdit3, FiArrowRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';

interface PricingPlan {
  id: string;
  name: string;
  coins: number;
  price: number;
  currency: string;
  popular?: boolean;
  bonus?: number;
  features: string[];
  icon: React.ReactNode;
  color: string;
  bgGradient: string;
  period?: string;
  originalPrice?: number;
  discount?: string;
}

interface ServiceInfo {
  type: string;
  icon: React.ReactNode;
  cost: string;
  unit: string;
  color: string;
  bgColor: string;
}

const PricingPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [selectedPlan, setSelectedPlan] = useState<string>('monthly');

  // Pricing plans data from ChargeModal.tsx
  const pricingPlans: PricingPlan[] = [
    {
      id: 'tester',
      name: t('pricing.tester'),
      coins: 450,
      price: 50,
      currency: 'HKD',
      features: [
        t('pricing.testerFeature1'),
        t('pricing.testerFeature2'),
        t('pricing.testerFeature3'),
        t('pricing.testerFeature4')
      ],
      icon: <FiZap className="w-6 h-6" />,
      color: 'blue',
      bgGradient: 'from-blue-600 to-cyan-600'
    },
    {
      id: 'monthly',
      name: t('pricing.monthly'),
      coins: 1380,
      price: 138,
      currency: 'HKD',
      popular: true,
      features: [
        t('pricing.monthlyFeature1'),
        t('pricing.monthlyFeature2'),
        t('pricing.monthlyFeature3'),
        t('pricing.monthlyFeature4')
      ],
      icon: <FiStar className="w-6 h-6" />,
      color: 'purple',
      bgGradient: 'from-purple-600 to-pink-600'
    },
    {
      id: 'yearly',
      name: t('pricing.yearly'),
      coins: 1380,
      price: 1490,
      currency: 'HKD',
      period: t('pricing.perMonth'),
      originalPrice: 1656,
      discount: t('pricing.save10'),
      features: [
        t('pricing.yearlyFeature1'),
        t('pricing.yearlyFeature2'),
        t('pricing.yearlyFeature3'),
        t('pricing.yearlyFeature4'),
        t('pricing.yearlyFeature5')
      ],
      icon: <FiTrendingUp className="w-6 h-6" />,
      color: 'green',
      bgGradient: 'from-green-600 to-emerald-600'
    },
    {
      id: 'addon',
      name: t('pricing.addonPack'),
      coins: 550,
      price: 50,
      currency: 'HKD',
      features: [
        t('pricing.addonFeature1'),
        t('pricing.addonFeature2'),
        t('pricing.addonFeature3'),
        t('pricing.addonFeature4')
      ],
      icon: <FiPackage className="w-6 h-6" />,
      color: 'amber',
      bgGradient: 'from-amber-600 to-orange-600'
    }
  ];

  // AI services pricing info from ChargeModal.tsx
  const aiServicesInfo: ServiceInfo[] = [
    {
      type: t('pricing.aiChat'),
      icon: <FiMessageSquare className="w-5 h-5" />,
      cost: t('pricing.oneCoin'),
      unit: t('pricing.perMessage'),
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
      type: t('pricing.imageGeneration'),
      icon: <FiImage className="w-5 h-5" />,
      cost: t('pricing.threeCoins'),
      unit: t('pricing.perImage'),
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30'
    },
    {
      type: t('pricing.videoGeneration'),
      icon: <FiVideo className="w-5 h-5" />,
      cost: t('pricing.thirtyCoins'),
      unit: t('pricing.perFiveSeconds'),
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30'
    },
    {
      type: t('pricing.audioTranscription'),
      icon: <FiMic className="w-5 h-5" />,
      cost: t('pricing.twoCoins'),
      unit: t('pricing.perMinute'),
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30'
    },
    {
      type: t('pricing.contentWriting'),
      icon: <FiEdit3 className="w-5 h-5" />,
      cost: t('pricing.oneCoin'),
      unit: t('pricing.perRequest'),
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30'
    },
    {
      type: t('pricing.humaniseText'),
      icon: <FiZap className="w-5 h-5" />,
      cost: t('pricing.oneCoin'),
      unit: t('pricing.perRequest'),
      color: 'text-cyan-600 dark:text-cyan-400',
      bgColor: 'bg-cyan-100 dark:bg-cyan-900/30'
    }
  ];

  const handleSubscribe = (plan: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Navigate to payment page with plan details
    navigate('/payment', { 
      state: { 
        uid: user.id,
        plan: plan,
        price: plan === 'Tester' ? '50 HKD' : plan === 'Monthly' ? '138 HKD' : plan === 'Yearly' ? '1490 HKD' : '50 HKD',
        isAddon: plan === 'Addon'
      } 
    });
  };

  return (
    <div className={`min-h-screen page-background ${darkMode ? 'text-white' : 'text-gray-800'}`}>
      {/* Background gradient effects */}
      <div className="gradient-blob-1"></div>
      <div className="gradient-blob-2"></div>

      {/* Content */}
      <div className="relative z-10">
        <div className={`container mx-auto px-4 ${!user ? 'pt-20' : 'pt-20'} pb-20`}>
          {/* Hero Section */}
          <div className={`text-center mb-16 glass-effect rounded-xl p-10 max-w-4xl mx-auto`}>
            <motion.h1 
              className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-600"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {t('pricing.title')}
            </motion.h1>
            <motion.p 
              className={`text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'} max-w-3xl mx-auto`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {t('pricing.subtitle')}
            </motion.p>
          </div>

          {/* Pricing Cards */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {pricingPlans.map((plan, index) => (
              <motion.div 
                key={plan.id}
                className={`relative rounded-2xl glass-effect overflow-hidden transition-all duration-300 hover:transform hover:scale-105 hover:shadow-xl hover:shadow-${plan.color}-500/20 flex flex-col h-[550px]`}
                whileHover={{ y: -5 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-bl-lg text-sm font-medium z-10">
                    {t('pricing.mostPopular')}
                  </div>
                )}
                
                {/* Discount badge */}
                {plan.discount && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-1 rounded-bl-lg text-sm font-medium z-10">
                    {plan.discount}
                  </div>
                )}
                
                {/* Header */}
                <div className={`p-6 bg-gradient-to-r ${plan.bgGradient} h-[140px] flex flex-col justify-center`}>
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-black/30 rounded-lg mr-4 text-white">
                      {plan.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                  </div>
                  
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="ml-1 text-lg text-white opacity-80">{plan.currency}</span>
                    {plan.period && (
                      <span className="ml-1 text-sm text-white opacity-70">{plan.period}</span>
                    )}
                  </div>
                  
                  {plan.originalPrice && (
                    <div className="mt-1">
                      <span className="text-sm line-through text-white opacity-70">{plan.originalPrice} {plan.currency}</span>
                    </div>
                  )}
                </div>
                
                {/* Coins */}
                <div className={`p-6 border-b ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex items-center">
                    <div className="p-2 bg-amber-500/10 rounded-lg mr-3">
                      <FiZap className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <span className="text-2xl font-bold text-amber-400">{plan.coins}</span>
                      <span className={`ml-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t('pricing.coins')}</span>
                    </div>
                  </div>
                </div>
                
                {/* Features */}
                <div className="p-6 flex-grow flex flex-col justify-between">
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <FiCheck className="w-5 h-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                        <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="mt-6 pt-4">
                    <button
                      onClick={() => handleSubscribe(plan.name)}
                      className={`w-full py-3 rounded-lg bg-gradient-to-r ${plan.bgGradient} text-white font-medium hover:opacity-90 transition-opacity flex justify-center items-center`}
                    >
                      {user ? t('pricing.subscribeNow') : t('pricing.loginToJoin')}
                      <FiArrowRight className="ml-2" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Usage Pricing */}
          <motion.div 
            className="mb-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-600">{t('pricing.aiServicesPricing')}</h2>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto`}>
                {t('pricing.coinSystemDescription')}
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {aiServicesInfo.map((service, index) => (
                <motion.div 
                  key={index}
                  className={`glass-effect rounded-xl p-6 transition-all duration-300 ${darkMode ? 'hover:border-gray-600' : 'hover:border-gray-400'} h-[140px] flex flex-col justify-between`}
                  whileHover={{ y: -5 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                >
                  <div className="flex items-center mb-4">
                    <div className={`p-3 rounded-lg mr-3 ${service.bgColor.replace('bg-', 'bg-').replace('dark:bg-', 'bg-')} bg-opacity-20`}>
                      <div className={`w-5 h-5 ${service.color}`}>
                        {service.icon}
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold">{service.type}</h3>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{service.unit}</div>
                    <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{service.cost}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* FAQ Section */}
          <motion.div 
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">{t('pricing.faq')}</h2>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t('pricing.faqDescription')}</p>
            </div>
            
            <div className="space-y-6">
              <div className={`glass-effect rounded-xl p-6 ${darkMode ? 'hover:border-gray-700' : 'hover:border-gray-400'} transition-colors duration-300`}>
                <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{t('pricing.faqQuestion1')}</h3>
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t('pricing.faqAnswer1')}</p>
              </div>
              
              <div className={`glass-effect rounded-xl p-6 ${darkMode ? 'hover:border-gray-700' : 'hover:border-gray-400'} transition-colors duration-300`}>
                <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{t('pricing.faqQuestion2')}</h3>
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t('pricing.faqAnswer2')}</p>
              </div>
              
              <div className={`glass-effect rounded-xl p-6 ${darkMode ? 'hover:border-gray-700' : 'hover:border-gray-400'} transition-colors duration-300`}>
                <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{t('pricing.faqQuestion3')}</h3>
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t('pricing.faqAnswer3')}</p>
              </div>
              
              <div className={`glass-effect rounded-xl p-6 ${darkMode ? 'hover:border-gray-700' : 'hover:border-gray-400'} transition-colors duration-300`}>
                <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{t('pricing.faqQuestion4')}</h3>
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{t('pricing.faqAnswer4')}</p>
              </div>
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div 
            className="text-center mt-20 glass-effect rounded-xl p-10 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <h2 className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-600">{t('pricing.readyToStart')}</h2>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                to="/signup" 
                className="px-8 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-700 text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center"
              >
                {t('pricing.signUpNow')}
                <FiArrowRight className="ml-2" />
              </Link>
              <Link 
                to="/contact" 
                className={`px-8 py-3 rounded-lg border ${darkMode ? 'border-gray-600 text-white hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-100'} font-medium transition-colors flex items-center justify-center`}
              >
                {t('pricing.contactSales')}
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
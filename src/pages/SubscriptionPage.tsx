import React, { useState, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FiCheck, 
  FiStar, 
  FiArrowLeft, 
  FiShoppingBag, 
  FiCalendar, 
  FiCreditCard,
  FiInfo,
  FiPackage
} from 'react-icons/fi';
import { Layout } from '../components';
import { ThemeContext } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import coinImage from '../assets/coin.png';

interface SubscriptionPlan {
  id: number;
  plan_name: string;
  coins: number;
  plan_period: string;
  price: number;
}

interface PlanProps {
  name: string;
  price: string;
  coins: number;
  period: string;
  originalPrice?: string;
  discount?: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}

const PlanCard: React.FC<PlanProps> = ({ 
  name, 
  price, 
  coins, 
  period, 
  originalPrice, 
  discount, 
  description,
  selected, 
  onSelect 
}) => {
  const { darkMode } = useContext(ThemeContext);
  const { t } = useTranslation();

  // Check if this is the yearly plan to show special pricing
  const isYearlyPlan = name.toLowerCase().includes('yearly') || name.toLowerCase().includes('year');
  const displayOriginalPrice = isYearlyPlan ? '1656' : originalPrice;
  const displayDiscount = isYearlyPlan ? 'Save 10%' : discount;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      onClick={onSelect}
      className={`relative rounded-xl overflow-hidden transition-all duration-300 cursor-pointer h-[420px] flex flex-col ${
        selected 
          ? 'border-2 border-blue-500 transform scale-[1.02] shadow-lg shadow-blue-500/25' 
          : `border ${darkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'}`
      } ${darkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50'} shadow-sm hover:shadow-md p-6`}
    >
      {/* Discount badge for yearly plan */}
      {isYearlyPlan && (
        <div className="absolute top-0 right-0 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-bl-lg text-xs font-semibold z-10">
          Save 10%
        </div>
      )}
      
      {/* Header Section - Fixed Height */}
      <div className="mb-3 h-12">
        <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {name}
        </h3>
        {isYearlyPlan && (
          <p className={`text-xs mt-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
            Coins credited every 30 days from start date
          </p>
        )}
      </div>
      
      {/* Price Section - Fixed Height */}
      <div className="mb-3 h-16">
        {(isYearlyPlan || originalPrice) && (
          <div className="mb-2 flex items-center">
            <span className={`text-lg line-through mr-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {displayOriginalPrice} HKD
            </span>
            <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded-full">
              {displayDiscount}
            </span>
          </div>
        )}
        <div className="flex items-baseline">
          <span className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {price}
          </span>
          <span className={`ml-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            HKD
          </span>
        </div>
      </div>
      
      {/* Coins Section - Fixed Height */}
      <div className={`flex items-center mb-3 p-3 rounded-lg h-14 ${
        darkMode ? 'bg-gray-700/50' : 'bg-gray-100'
      }`}>
        <img 
          src={coinImage} 
          alt={t('coin')} 
          className="w-6 h-6 mr-2 object-contain" 
          onError={(e) => {
            e.currentTarget.src = 'https://via.placeholder.com/24?text=$';
            e.currentTarget.onerror = null;
          }}
        />
        <span className={`text-xl font-bold ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
          {coins}
        </span>
        {period && (
          <span className={`ml-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {period}
          </span>
        )}
      </div>

      {/* Description Section - Flexible Height */}
      <div className="flex-1 mb-3">
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {description}
        </p>
      </div>
      
      {/* Progress Bar - Fixed Height */}
      <div className={`w-full h-2 rounded-full mb-3 ${
        selected 
          ? 'bg-gradient-to-r from-blue-400 to-purple-500' 
          : (darkMode ? 'bg-gray-700' : 'bg-gray-200')
      }`}>
        <div 
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600" 
          style={{ width: selected ? '100%' : '0%', transition: 'width 0.3s ease-in-out' }}
        ></div>
      </div>
      
      {/* Button Section - Fixed Height */}
      <button
        className={`w-full py-3 rounded-lg font-medium text-center transition-colors h-12 ${
          selected
            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
            : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
        }`}
      >
        {selected ? t('subscription.selected', 'Selected') : t('subscription.select_plan', 'Select Plan')}
      </button>
    </motion.div>
  );
};

interface AddonCardProps {
  price: string;
  coins: number;
  description: string;
  onSelect: () => void;
}

const AddonCard: React.FC<AddonCardProps> = ({ price, coins, description, onSelect }) => {
  const { darkMode } = useContext(ThemeContext);
  const { t } = useTranslation();

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className={`rounded-xl overflow-hidden transition-all duration-300 h-[420px] flex flex-col ${
        darkMode ? 'bg-gradient-to-br from-purple-800/30 to-blue-900/30 backdrop-blur-sm border border-purple-700/50 hover:border-purple-600/70' : 'bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-100 hover:border-purple-200'
      } shadow-md hover:shadow-lg p-6`}
    >
      {/* Header Section - Fixed Height */}
      <div className="flex items-center mb-4 h-16">
        <div className={`p-3 rounded-lg mr-4 ${
          darkMode ? 'bg-purple-900/50 text-purple-400' : 'bg-purple-100 text-purple-600'
        }`}>
          <FiPackage className="h-6 w-6" />
        </div>
        <div>
          <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {t('subscription.addon_pack', 'Addon Pack')}
          </h3>
          <p className={`text-sm ${darkMode ? 'text-orange-400' : 'text-orange-600'} font-medium`}>
            ⚠️ Coins expire with current plan month
          </p>
        </div>
      </div>
      
      {/* Price Section - Fixed Height */}
      <div className="flex items-baseline mb-4 h-20">
        <span className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {price}
        </span>
        <span className={`ml-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          HKD
        </span>
      </div>
      
      {/* Coins Section - Fixed Height */}
      <div className={`flex items-center mb-4 p-3 rounded-lg h-16 ${
        darkMode ? 'bg-gray-700/50' : 'bg-gray-100'
      }`}>
        <img 
          src={coinImage} 
          alt="Coin" 
          className="w-6 h-6 mr-2 object-contain" 
          onError={(e) => {
            e.currentTarget.src = 'https://via.placeholder.com/24?text=$';
            e.currentTarget.onerror = null;
          }}
        />
        <span className={`text-xl font-bold ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
          {coins}
        </span>
      </div>

      {/* Description Section - Flexible Height */}
      <div className="flex-1 mb-4">
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {description}
        </p>
      </div>
      
      {/* Progress Bar Placeholder - Fixed Height */}
      <div className="mb-4 h-2">
        {/* Empty space to match PlanCard layout */}
      </div>
      
      {/* Button Section - Fixed Height */}
      <button
        onClick={onSelect}
        className="w-full py-3 rounded-lg font-medium bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:opacity-90 transition-opacity h-12"
      >
        {t('subscription.add_coins', 'Add Coins')}
      </button>
    </motion.div>
  );
};

const SubscriptionPage: React.FC = () => {
  const { darkMode } = useContext(ThemeContext);
  const { userData, isPro } = useUser();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [selectedPlan, setSelectedPlan] = useState<string>('Monthly');
  const [showTnC, setShowTnC] = useState(false);
  const [showAddon, setShowAddon] = useState(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch subscription plans from API
  const fetchSubscriptionPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('https://main-matrixai-server-lujmidrakh.cn-hangzhou.fcapp.run/api/user/getSubscriptionPlans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: user?.uid || null
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscription plans');
      }
      
      const data = await response.json();
      
      if (data.success && data.plans) {
        setSubscriptionPlans(data.plans);
        // Set default selected plan to the first one if available
        if (data.plans.length > 0) {
          setSelectedPlan(data.plans[0].plan_name);
        }
      } else {
        throw new Error(data.message || 'Failed to load subscription plans');
      }
    } catch (err: any) {
      console.error('Error fetching subscription plans:', err);
      setError(err.message || 'Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionPlans();
  }, [user?.uid]);

  useEffect(() => {
    // Check if user has active subscription to show the addon option
    if (userData?.user_plan && userData.user_plan !== 'Free') {
      setShowAddon(true);
    } else {
      setShowAddon(false);
    }
  }, [userData]);

  const getPlanText = () => {
    const plan = subscriptionPlans.find(p => p.plan_name === selectedPlan);
    if (!plan) return '';
    
    return `Get ${plan.coins} coins valid for ${plan.plan_period}.`;
  };

  const getButtonPrice = () => {
    const plan = subscriptionPlans.find(p => p.plan_name === selectedPlan);
    if (!plan) return '';
    
    return `$${plan.price} HKD`;
  };

  const getSelectedPlan = () => {
    return subscriptionPlans.find(p => p.plan_name === selectedPlan);
  };

  const handleSubscribe = (planName: string) => {
    const plan = subscriptionPlans.find(p => p.plan_name === planName);
    if (!plan) return;
    
    // Navigate to payment page with plan details
    navigate('/payment', { 
      state: { 
        uid: user?.uid,
        plan: plan.plan_name,
        price: `${plan.price} HKD`,
        isAddon: false
      } 
    });
  };

  const handleAddonPurchase = () => {
    const addonPlan = subscriptionPlans.find(plan => plan.plan_name === 'Addon');
    if (!addonPlan) return;
    
    // Navigate to payment page with addon details
    navigate('/payment', { 
      state: { 
        uid: user?.uid,
        plan: addonPlan.plan_name,
        price: `${addonPlan.price} HKD`,
        isAddon: true
      } 
    });
  };

  const handleTermsAndConditions = () => {
    setShowTnC(true);
  };

  return (
    <Layout>
      <div className={`py-10 px-4 lg:px-8 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {/* Background gradient effects */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10 blur-3xl opacity-70"></div>
          <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-purple-500/10 via-cyan-500/5 to-blue-500/10 blur-3xl opacity-70"></div>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h1 className={`text-4xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {t('subscription.choose_plan_heading', 'Choose Your Perfect Plan')}
            </h1>
            <p className={`text-lg max-w-3xl mx-auto ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {t('subscription.unlock_potential', 'Unlock the full potential of MatrixAI with our flexible subscription options')}
            </p>
          </motion.div>

          {/* Loading State */}
          {loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              <p className={`mt-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Loading subscription plans...
              </p>
            </motion.div>
          )}

          {/* Error State */}
          {error && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-red-900/20 border border-red-500/30 text-red-300' : 'bg-red-100 border border-red-300 text-red-700'}`}>
                <p className="font-medium">Error loading subscription plans</p>
                <p className="text-sm mt-1">{error}</p>
                <button 
                  onClick={fetchSubscriptionPlans}
                  className="mt-3 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Retry
                </button>
              </div>
            </motion.div>
          )}

          {/* Main Subscription Plans */}
          {!loading && !error && !showAddon && subscriptionPlans.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {subscriptionPlans.map((plan) => (
                  <PlanCard 
                    key={plan.id}
                    name={plan.plan_name}
                    price={plan.price.toString()}
                    coins={plan.coins}
                    period={plan.plan_period}
                    description={`Get ${plan.coins} coins valid for ${plan.plan_period}.`}
                    selected={selectedPlan === plan.plan_name}
                    onSelect={() => setSelectedPlan(plan.plan_name)}
                  />
                ))}
              </div>

              {/* Plan Details */}
              <div className={`rounded-xl p-8 mb-10 backdrop-blur-sm border ${
                darkMode 
                  ? 'bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/30' 
                  : 'bg-gradient-to-br from-blue-50/80 to-purple-50/80 border-blue-200/50'
              } shadow-lg`}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                  {/* Plan Info Section */}
                  <div className="lg:col-span-2">
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-lg ${
                        darkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-600'
                      }`}>
                        <FiInfo className="h-6 w-6" />
                      </div>
                      
                      <div className="flex-1">
                        <h3 className={`text-xl font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {t('subscription.plan_details', 'Plan Details')}
                        </h3>
                        <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-4 text-base leading-relaxed`}>
                          {getPlanText()}
                        </p>
                        
                        <button
                          className={`text-sm flex items-center transition-colors ${
                            darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
                          }`}
                          onClick={handleTermsAndConditions}
                        >
                          {t('subscription.terms_conditions', 'Terms & Conditions Apply')}
                          <FiArrowLeft className="ml-1 transform rotate-180 h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Buy Now Section */}
                  <div className="lg:col-span-1 flex flex-col items-center lg:items-end">
                    <div className={`text-center lg:text-right mb-4 p-4 rounded-lg ${
                      darkMode ? 'bg-gray-800/50' : 'bg-white/70'
                    } border border-gray-200/20`}>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                        Total Price
                      </p>
                      <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {getButtonPrice()}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => handleSubscribe(selectedPlan)}
                      className="w-full lg:w-auto px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                    >
                      <FiShoppingBag className="h-5 w-5" />
                      <span>{t('subscription.buy_now', 'Buy Now')}</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Addon Plan (only shown for users with active subscription) */}
          {showAddon && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl mx-auto"
            >
              <div className="text-center mb-8">
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {t('subscription.need_extra_coins', 'Need Extra Coins?')}
                </h2>
                <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t('subscription.add_more_coins', 'Add more coins to your current subscription')}
                </p>
              </div>
              
              {(() => {
                const addonPlan = subscriptionPlans.find(plan => plan.plan_name === 'Addon');
                return addonPlan ? (
                  <AddonCard 
                    price={addonPlan.price.toString()}
                    coins={addonPlan.coins}
                    description={`These ${addonPlan.coins} coins will be added to your existing balance and expire at the end of this month.`}
                    onSelect={handleAddonPurchase}
                  />
                ) : null;
              })()}
              
              <div className="text-center mt-6">
                <button
                  onClick={() => setShowAddon(false)}
                  className={`text-sm ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'}`}
                >
                  {t('subscription.view_all_plans', 'Looking for a different plan? View all plans')}
                </button>
              </div>
            </motion.div>
          )}

          {/* Features Section */}
          <div className="mt-16">
            <h2 className={`text-2xl font-bold text-center mb-10 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Why Choose Our Platform
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <motion.div 
                whileHover={{ y: -5 }}
                className={`p-6 rounded-xl ${
                  darkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-100'
                } shadow-sm`}
              >
                <div className={`p-3 rounded-lg inline-block mb-4 ${
                  darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-600'
                }`}>
                  <FiStar className="h-6 w-6" />
                </div>
                <h3 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  All-in-One Platform
                </h3>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  No need for multiple platforms - all AI tools in one place
                </p>
              </motion.div>
              
              <motion.div 
                whileHover={{ y: -5 }}
                className={`p-6 rounded-xl ${
                  darkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-100'
                } shadow-sm`}
              >
                <div className={`p-3 rounded-lg inline-block mb-4 ${
                  darkMode ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-600'
                }`}>
                  <FiCreditCard className="h-6 w-6" />
                </div>
                <h3 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Pay-Per-Use Model
                </h3>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Pay-per-use model with no monthly fixed limits
                </p>
              </motion.div>
              
              <motion.div 
                whileHover={{ y: -5 }}
                className={`p-6 rounded-xl ${
                  darkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-100'
                } shadow-sm`}
              >
                <div className={`p-3 rounded-lg inline-block mb-4 ${
                  darkMode ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-100 text-amber-600'
                }`}>
                  <FiPackage className="h-6 w-6" />
                </div>
                <h3 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Flexible Add-ons
                </h3>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Buy addons anytime to extend your usage
                </p>
              </motion.div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-20">
            <h2 className={`text-2xl font-bold text-center mb-10 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {t('subscription.faq', 'Frequently Asked Questions')}
            </h2>
            
            <div className={`space-y-6 max-w-4xl mx-auto ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>
              <motion.div 
                whileHover={{ x: 5 }}
                className={`p-6 rounded-xl ${
                  darkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-100'
                }`}
              >
                <h3 className="text-lg font-semibold mb-2">{t('subscription.faq_coins_work', 'How do coins work?')}</h3>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t('subscription.faq_coins_work_answer', 'Coins are the currency used within MatrixAI. Each AI operation costs a certain number of coins depending on complexity. Coins are valid for the duration of your subscription period.')}
                </p>
              </motion.div>
              
              <motion.div 
                whileHover={{ x: 5 }}
                className={`p-6 rounded-xl ${
                  darkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-100'
                }`}
              >
                <h3 className="text-lg font-semibold mb-2">{t('subscription.faq_cancel', 'Can I cancel my subscription?')}</h3>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t('subscription.faq_cancel_answer', 'Yes, you can cancel your subscription at any time. Your subscription will remain active until the end of your current billing period.')}
                </p>
              </motion.div>
              
              <motion.div 
                whileHover={{ x: 5 }}
                className={`p-6 rounded-xl ${
                  darkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-100'
                }`}
              >
                <h3 className="text-lg font-semibold mb-2">{t('subscription.faq_rollover', 'Do unused coins roll over?')}</h3>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t('subscription.faq_rollover_answer', 'Monthly coins expire at the end of each billing cycle. Yearly plan users receive a fresh allocation of 1380 coins at the beginning of each month.')}
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Terms and Conditions Modal */}
      {showTnC && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`max-w-2xl w-full rounded-xl p-6 ${
              darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{t('subscription.terms_and_conditions', 'Terms and Conditions')}</h2>
              <button 
                onClick={() => setShowTnC(false)}
                className={`p-2 rounded-full ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <FiArrowLeft className="transform rotate-45" />
              </button>
            </div>
            
            <div className={`max-h-96 overflow-y-auto pr-4 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              <h3 className="font-semibold mb-2">{t('subscription.terms_subscription', '1. Subscription Terms')}</h3>
              <p className="mb-4 text-sm">
                {t('subscription.terms_subscription_desc', 'Subscriptions automatically renew at the end of each billing period. You will be charged at the rate stated at the time of purchase. For monthly plans, your subscription will renew monthly. For yearly plans, your subscription will renew annually.')}
              </p>
              
              <h3 className="font-semibold mb-2">{t('subscription.terms_coin_allocation', '2. Coin Allocation')}</h3>
              <p className="mb-4 text-sm">
                {t('subscription.terms_coin_allocation_desc', 'Coins are allocated at the beginning of each billing period and expire at the end of the period. Unused coins do not roll over to the next billing period.')}
              </p>
              
              <h3 className="font-semibold mb-2">{t('subscription.terms_cancellation', '3. Cancellation Policy')}</h3>
              <p className="mb-4 text-sm">
                {t('subscription.terms_cancellation_desc', 'You can cancel your subscription at any time. Upon cancellation, you will continue to have access to your subscription benefits until the end of your current billing period. No refunds are provided for partial subscription periods.')}
              </p>
              
              <h3 className="font-semibold mb-2">{t('subscription.terms_addon', '4. Addon Pack')}</h3>
              <p className="mb-4 text-sm">
                {t('subscription.terms_addon_desc', 'Addon Packs provide additional coins that expire at the end of the current month, regardless of when they were purchased. Addon Packs are non-refundable.')}
              </p>
              
              <h3 className="font-semibold mb-2">5. Price Changes</h3>
              <p className="mb-4 text-sm">
                MatrixAI reserves the right to change subscription prices with 30 days notice. Any price changes will take effect at the next billing cycle.
              </p>
              
              <h3 className="font-semibold mb-2">6. Usage Limitations</h3>
              <p className="mb-4 text-sm">
                MatrixAI reserves the right to impose usage limitations to prevent abuse of the service. Excessive usage that suggests automated or non-personal use may result in account restrictions.
              </p>
            </div>
            
            <div className="mt-6 text-center">
              <button
                onClick={() => setShowTnC(false)}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg"
              >
                {t('subscription.i_understand', 'I Understand')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </Layout>
  );
};

export default SubscriptionPage;
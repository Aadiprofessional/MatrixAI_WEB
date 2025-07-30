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

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      onClick={onSelect}
      className={`relative rounded-xl overflow-hidden transition-colors cursor-pointer ${
        selected 
          ? 'border-2 border-blue-500 transform scale-[1.01]' 
          : `border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`
      } ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm p-6`}
    >
      {discount && (
        <div className="absolute -top-1 -right-1">
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-xs font-semibold px-4 py-1 rounded-bl-lg shadow-md transform rotate-[45deg] translate-x-[25%] translate-y-[-25%] w-36 text-center">
            {discount}
          </div>
        </div>
      )}
      
      <div className="mb-3">
        <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {name}
        </h3>
      </div>
      
      <div className="flex items-baseline mb-4">
        <span className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {price}
        </span>
        <span className={`ml-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          HKD
        </span>
      </div>

      {originalPrice && (
        <div className="mb-3 flex items-center">
          <span className={`text-sm line-through mr-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            {originalPrice} HKD
          </span>
          <span className="text-xs font-semibold text-green-500">
            {discount}
          </span>
        </div>
      )}
      
      <div className={`flex items-center mb-4 p-3 rounded-lg ${
        darkMode ? 'bg-gray-700/50' : 'bg-gray-100'
      }`}>
        <img 
          src="https://via.placeholder.com/24?text=$" 
          alt={t('coin')} 
          className="w-6 h-6 mr-2" 
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

      <p className={`mb-5 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        {description}
      </p>
      
      <div className={`w-full h-2 rounded-full mb-4 ${
        selected 
          ? 'bg-gradient-to-r from-blue-400 to-purple-500' 
          : (darkMode ? 'bg-gray-700' : 'bg-gray-200')
      }`}>
        <div 
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600" 
          style={{ width: selected ? '100%' : '0%', transition: 'width 0.3s ease-in-out' }}
        ></div>
      </div>
      
      <button
        className={`w-full py-2.5 rounded-lg font-medium text-center transition-colors ${
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
      className={`rounded-xl overflow-hidden transition-colors ${
        darkMode ? 'bg-gradient-to-br from-purple-800/30 to-blue-900/30 backdrop-blur-sm border border-purple-700/50' : 'bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-100'
      } shadow-md p-6`}
    >
      <div className="flex items-center mb-4">
        <div className={`p-3 rounded-lg mr-4 ${
          darkMode ? 'bg-purple-900/50 text-purple-400' : 'bg-purple-100 text-purple-600'
        }`}>
          <FiPackage className="h-6 w-6" />
        </div>
        <div>
          <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {t('subscription.addon_pack', 'Addon Pack')}
          </h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {t('subscription.expires_month_end', 'Expires at month end')}
          </p>
        </div>
      </div>
      
      <div className="flex items-baseline mb-4">
        <span className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {price}
        </span>
        <span className={`ml-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          HKD
        </span>
      </div>
      
      <div className={`flex items-center mb-4 p-3 rounded-lg ${
        darkMode ? 'bg-gray-700/50' : 'bg-gray-100'
      }`}>
        <img 
          src="https://via.placeholder.com/24?text=$" 
          alt="Coin" 
          className="w-6 h-6 mr-2" 
          onError={(e) => {
            e.currentTarget.src = 'https://via.placeholder.com/24?text=$';
            e.currentTarget.onerror = null;
          }}
        />
        <span className={`text-xl font-bold ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
          {coins}
        </span>
      </div>

      <p className={`mb-5 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        {description}
      </p>
      
      <button
        onClick={onSelect}
        className="w-full py-2.5 rounded-lg font-medium bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:opacity-90 transition-opacity"
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
  
  const [selectedPlan, setSelectedPlan] = useState<'Tester' | 'Monthly' | 'Yearly'>('Monthly');
  const [showTnC, setShowTnC] = useState(false);
  const [showAddon, setShowAddon] = useState(false);

  useEffect(() => {
    // Check if user has active subscription to show the addon option
    if (userData?.user_plan && userData.user_plan !== 'Free') {
      setShowAddon(true);
    } else {
      setShowAddon(false);
    }
  }, [userData]);

  const getPlanText = () => {
    switch (selectedPlan) {
      case 'Tester':
        return t('subscription.tester_description', 'Perfect for those who want to try our service. Get 450 coins valid for 15 days.');
      case 'Monthly':
        return t('subscription.monthly_description', 'Ideal for regular users. Get 1380 coins each month.');
      case 'Yearly':
        return t('subscription.yearly_description', 'Best value for committed users. Get 1380 coins each month for a full year with 10% discount.');
      default:
        return '';
    }
  };

  const getButtonPrice = () => {
    switch (selectedPlan) {
      case 'Tester':
        return t('subscription.tester_price', '$50 HKD');
      case 'Monthly':
        return t('subscription.monthly_price', '$138 HKD');
      case 'Yearly':
        return t('subscription.yearly_price', '$1490 HKD');
      default:
        return '';
    }
  };

  const handleSubscribe = (plan: string) => {
    // Navigate to payment page with plan details
    navigate('/payment', { 
      state: { 
        uid: user?.id,
        plan: plan,
        price: plan === 'Tester' ? '50 HKD' : plan === 'Monthly' ? '138 HKD' : '1490 HKD',
        isAddon: false
      } 
    });
  };

  const handleAddonPurchase = () => {
    // Navigate to payment page with addon details
    navigate('/payment', { 
      state: { 
        uid: user?.id,
        plan: 'Addon',
        price: '50 HKD',
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

          {/* Main Subscription Plans */}
          {!showAddon && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                <PlanCard 
                  name={t('subscription.tester_plan', 'Tester')}
                  price="50"
                  coins={450}
                  period=""
                  description={t('subscription.tester_plan_desc', 'Try our service with a small package of coins. Valid for 15 days.')}
                  selected={selectedPlan === 'Tester'}
                  onSelect={() => setSelectedPlan('Tester')}
                />
                
                <PlanCard 
                  name={t('subscription.monthly_plan', 'Monthly')}
                  price="138"
                  coins={1380}
                  period=""
                  description={t('subscription.monthly_plan_desc', 'Perfect for regular users. Get a monthly allocation of coins.')}
                  selected={selectedPlan === 'Monthly'}
                  onSelect={() => setSelectedPlan('Monthly')}
                />
                
                <PlanCard 
                  name={t('subscription.yearly_plan', 'Yearly')}
                  price="1490"
                  coins={1380}
                  period={t('subscription.per_month', '/month')}
                  originalPrice="1656"
                  discount={t('subscription.save_percent', 'Save 10%')}
                  description={t('subscription.yearly_plan_desc', 'Our best value plan. 1380 coins delivered every month for a full year.')}
                  selected={selectedPlan === 'Yearly'}
                  onSelect={() => setSelectedPlan('Yearly')}
                />
              </div>

              {/* Plan Details */}
              <div className="bg-gradient-to-br from-blue-600/10 to-purple-600/10 rounded-xl p-6 mb-10 backdrop-blur-sm border border-blue-500/20">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${
                    darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-600'
                  }`}>
                    <FiInfo className="h-6 w-6" />
                  </div>
                  
                  <div>
                    <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {t('subscription.plan_details', 'Plan Details')}
                    </h3>
                    <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-4`}>
                      {getPlanText()}
                    </p>
                    
                    <div className="flex flex-wrap items-center justify-between">
                      <button
                        className="text-sm flex items-center text-blue-500 hover:text-blue-400 mb-4 md:mb-0"
                        onClick={handleTermsAndConditions}
                      >
                        {t('subscription.terms_conditions', 'Terms & Conditions Apply')}
                        <FiArrowLeft className="ml-1 transform rotate-180 h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleSubscribe(selectedPlan)}
                        className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
                      >
                        {t('subscription.buy_now', 'Buy Now')} <span className="ml-1 font-bold">{getButtonPrice()}</span>
                      </button>
                    </div>
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
              
              <AddonCard 
                price="50"
                coins={550}
                description={t('subscription.addon_description', 'These coins will be added to your existing balance and expire at the end of this month.')}
                onSelect={handleAddonPurchase}
              />
              
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
              {t('subscription.whats_included', 'What\'s Included in All Plans')}
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
                  {t('subscription.premium_ai_features', 'Premium AI Features')}
                </h3>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t('subscription.premium_ai_desc', 'Access to all our advanced AI tools including image and video generation')}
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
                  {t('subscription.flexible_coin_system', 'Flexible Coin System')}
                </h3>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t('subscription.flexible_coin_desc', 'Use coins across any AI service based on your specific needs')}
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
                  <FiCalendar className="h-6 w-6" />
                </div>
                <h3 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {t('subscription.regular_updates', 'Regular Updates')}
                </h3>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {t('subscription.regular_updates_desc', 'Access to new features and improvements as they\'re released')}
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
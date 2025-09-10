import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FiX, 
  FiCheck, 
  FiStar, 
  FiZap, 
  FiTrendingUp, 
  FiShield, 
  FiImage, 
  FiMic, 
  FiVideo,
  FiPackage
} from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

interface SubscriptionPlan {
  id: number;
  plan_name: string;
  coins: number;
  plan_period: string;
  price: number;
}

interface ChargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCoins?: number;
}

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

const ChargeModal: React.FC<ChargeModalProps> = ({ isOpen, onClose, currentCoins = 0 }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string>('Monthly');
  const [loading, setLoading] = useState(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [apiLoading, setApiLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Function to fetch subscription plans from API
  const fetchSubscriptionPlans = async () => {
    try {
      setApiLoading(true);
      setApiError(null);
      
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
      setApiError(err.message || 'Failed to load subscription plans');
    } finally {
      setApiLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSubscriptionPlans();
    }
  }, [isOpen, user?.uid]);

  // Helper function to get icon for plan
  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'tester':
        return <FiZap className="w-6 h-6" />;
      case 'monthly':
        return <FiStar className="w-6 h-6" />;
      case 'yearly':
        return <FiTrendingUp className="w-6 h-6" />;
      case 'addon':
        return <FiPackage className="w-6 h-6" />;
      default:
        return <FiStar className="w-6 h-6" />;
    }
  };

  // Helper function to get color scheme for plan
  const getPlanColors = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'tester':
        return { color: 'blue', bgGradient: 'from-blue-500 to-cyan-500' };
      case 'monthly':
        return { color: 'purple', bgGradient: 'from-purple-500 to-pink-500' };
      case 'yearly':
        return { color: 'green', bgGradient: 'from-green-500 to-emerald-500' };
      case 'addon':
        return { color: 'amber', bgGradient: 'from-amber-500 to-orange-500' };
      default:
        return { color: 'purple', bgGradient: 'from-purple-500 to-pink-500' };
    }
  };

  // Convert API data to PricingPlan format
  const pricingPlans: PricingPlan[] = subscriptionPlans.map((plan, index) => {
    const colors = getPlanColors(plan.plan_name);
    return {
      id: plan.plan_name.toLowerCase(),
      name: plan.plan_name,
      coins: plan.coins,
      price: plan.price,
      currency: 'HKD',
      popular: plan.plan_name === 'Monthly', // Mark Monthly as popular
      features: [
        t('chargeModal.features.getCoins', `Get ${plan.coins} coins`),
        t('chargeModal.features.validFor', `Valid for ${plan.plan_period}`),
        t('chargeModal.features.accessAllTools', 'Access to all AI tools'),
        t('chargeModal.features.prioritySupport', 'Priority support')
      ],
      icon: getPlanIcon(plan.plan_name),
      color: colors.color,
      bgGradient: colors.bgGradient,
      period: plan.plan_period
    };
  });

  // Fallback pricing plans (kept for reference but not used when API data is available)
  const fallbackPricingPlans: PricingPlan[] = [
    {
      id: 'tester',
      name: 'Tester',
      coins: 450,
      price: 50,
      currency: 'HKD',
      features: [
        t('chargeModal.features.perfectForTrying', 'Perfect for trying our service'),
        t('chargeModal.features.validFor15Days', 'Valid for 15 days'),
        t('chargeModal.features.basicSupport', 'Basic support'),
        t('chargeModal.features.accessAllTools', 'Access to all AI tools')
      ],
      icon: <FiZap className="w-6 h-6" />,
      color: 'blue',
      bgGradient: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'monthly',
      name: 'Monthly',
      coins: 1380,
      price: 138,
      currency: 'HKD',
      popular: true,
      features: [
        t('chargeModal.features.perfectForRegular', 'Perfect for regular users'),
        t('chargeModal.features.monthlyAllocation', 'Monthly allocation of coins'),
        t('chargeModal.features.prioritySupport', 'Priority support'),
        t('chargeModal.features.fullAccess', 'Full access to all features')
      ],
      icon: <FiStar className="w-6 h-6" />,
      color: 'purple',
      bgGradient: 'from-purple-500 to-pink-500'
    },
    {
      id: 'yearly',
      name: 'Yearly',
      coins: 1380,
      price: 1490,
      currency: 'HKD',
      period: '/month',
      originalPrice: 1656,
      discount: 'Save 10%',
      features: [
        t('chargeModal.features.bestValue', 'Best value plan'),
        t('chargeModal.features.coinsEveryMonth', '1380 coins every month'),
        t('chargeModal.features.fullYear', 'Full year subscription'),
        t('chargeModal.features.premiumSupport', 'Premium support'),
        t('chargeModal.features.discount10', '10% discount')
      ],
      icon: <FiTrendingUp className="w-6 h-6" />,
      color: 'green',
      bgGradient: 'from-green-500 to-emerald-500'
    },
    {
      id: 'addon',
      name: 'Addon Pack',
      coins: 550,
      price: 50,
      currency: 'HKD',
      features: [
        t('chargeModal.features.extraCoins', 'Extra coins for existing users'),
        t('chargeModal.features.expiresMonthEnd', 'Expires at month end'),
        t('chargeModal.features.addToBalance', 'Add to current balance'),
        t('chargeModal.features.instantActivation', 'Instant activation')
      ],
      icon: <FiPackage className="w-6 h-6" />,
      color: 'amber',
      bgGradient: 'from-amber-500 to-orange-500'
    }
  ];

  const aiServicesInfo = [
    {
      type: t('chargeModal.services.aiChat', 'AI Chat'),
      icon: <FiMic className="w-5 h-5" />,
      cost: t('chargeModal.costs.oneCoin', '1 coin'),
      unit: t('chargeModal.units.perMessage', 'per message'),
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
      type: t('chargeModal.services.imageGeneration', 'Image Generation'),
      icon: <FiImage className="w-5 h-5" />,
      cost: t('chargeModal.costs.threeCoins', '3 coins'),
      unit: t('chargeModal.units.perImage', 'per image'),
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30'
    },
    {
      type: t('chargeModal.services.videoGeneration', 'Video Generation'),
      icon: <FiVideo className="w-5 h-5" />,
      cost: t('chargeModal.costs.thirtyCoins', '30 coins'),
      unit: t('chargeModal.units.perFiveSeconds', 'per 5 seconds'),
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30'
    },
    {
      type: t('chargeModal.services.audioTranscription', 'Audio Transcription'),
      icon: <FiMic className="w-5 h-5" />,
      cost: t('chargeModal.costs.twoCoins', '2 coins'),
      unit: t('chargeModal.units.perMinute', 'per minute'),
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30'
    },
    {
      type: t('chargeModal.services.contentWriting', 'Content Writing'),
      icon: <FiImage className="w-5 h-5" />,
      cost: t('chargeModal.costs.oneCoin', '1 coin'),
      unit: t('chargeModal.units.perRequest', 'per request'),
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30'
    },
    {
      type: t('chargeModal.services.humaniseText', 'Humanise Text'),
      icon: <FiZap className="w-5 h-5" />,
      cost: t('chargeModal.costs.oneCoin', '1 coin'),
      unit: t('chargeModal.units.perRequest', 'per request'),
      color: 'text-cyan-600 dark:text-cyan-400',
      bgColor: 'bg-cyan-100 dark:bg-cyan-900/30'
    }
  ];

  const handlePurchase = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const plan = pricingPlans.find(p => p.id === selectedPlan);
      if (!plan) return;

      // Navigate to payment page with plan details
      navigate('/payment', {
        state: {
          uid: user.uid,
          plan: plan.name,
          price: `${plan.price} ${plan.currency}`,
          coins: plan.coins + (plan.bonus || 0),
          isAddon: plan.id === 'addon'
        }
      });
      
      onClose();
    } catch (error) {
      console.error('Error initiating purchase:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-40 pointer-events-none">
      {/* Backdrop - only capture clicks for closing */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto"
        onClick={onClose}
      />
      
      {/* Modal positioned below navbar - responsive for mobile and desktop */}
      <div className="fixed top-20 right-4 left-4 md:left-auto pointer-events-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, x: 20, y: -20 }}
          animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, x: 20, y: -20 }}
          className={`relative w-full md:w-96 max-w-[calc(100vw-2rem)] md:max-w-96 rounded-xl shadow-2xl ${
            theme === 'dark' ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
          } max-h-[calc(100vh-6rem)] overflow-hidden`}
        >
          {/* Header */}
          <div className={`px-3 md:px-4 py-2 md:py-3 border-b ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base md:text-lg font-bold text-gray-900 dark:text-white">
                  {t('chargeModal.title', 'Buy Coins')}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 md:p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <FiX className="w-4 h-4 md:w-5 md:h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-3 md:p-4 overflow-y-auto max-h-[calc(100vh-12rem)]">
            {/* Current Balance */}
            <div className={`mb-3 md:mb-4 p-2 md:p-3 rounded-lg ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white">
                    {t('chargeModal.currentBalance', 'Current Balance')}
                  </h3>
                </div>
                <div className="text-right">
                  <div className="text-lg md:text-xl font-bold text-blue-600 dark:text-blue-400">
                    {currentCoins}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{t('chargeModal.coins', 'coins')}</div>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {apiLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">{t('chargeModal.loadingPlans', 'Loading plans...')}</span>
              </div>
            )}

            {/* Error State */}
            {apiError && (
              <div className={`mb-4 p-3 rounded-lg border ${
                theme === 'dark' 
                  ? 'bg-red-900/20 border-red-800 text-red-400' 
                  : 'bg-red-50 border-red-200 text-red-600'
              }`}>
                <p className="text-sm">{apiError}</p>
                <button 
                  onClick={fetchSubscriptionPlans}
                  className="mt-2 text-sm underline hover:no-underline"
                >
                  {t('chargeModal.tryAgain', 'Try again')}
                </button>
              </div>
            )}

            {/* Pricing Plans */}
            {!apiLoading && !apiError && pricingPlans.length > 0 && (
              <div className="mb-4 md:mb-6">
                <h3 className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white mb-2 md:mb-3">
                  {t('chargeModal.chooseYourPlan', 'Choose Your Plan')}
                </h3>
                <div className="space-y-1.5 md:space-y-2">
                  {pricingPlans.map((plan) => (
                  <motion.div
                    key={plan.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`relative p-2 md:p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedPlan === plan.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : theme === 'dark'
                        ? 'border-gray-700 hover:border-gray-600 bg-gray-800'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 md:space-x-3">
                        <div className={`p-1.5 md:p-2 rounded-full bg-gradient-to-r ${plan.bgGradient} text-white flex-shrink-0`}>
                          <div className="w-3 h-3 md:w-4 md:h-4">
                            {plan.icon}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center space-x-1 md:space-x-2">
                            <h4 className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white">
                              {plan.name}
                            </h4>
                            {plan.popular && (
                              <span className="bg-purple-500 text-white px-1 md:px-1.5 py-0.5 rounded text-xs font-semibold">
                                {t('chargeModal.popular', 'Popular')}
                              </span>
                            )}
                            {plan.discount && (
                              <span className="bg-green-500 text-white px-1 md:px-1.5 py-0.5 rounded text-xs font-semibold">
                                {plan.discount}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {plan.coins} coins{plan.period || ''}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs md:text-sm font-bold text-gray-900 dark:text-white">
                          {plan.originalPrice && (
                            <span className="text-xs text-gray-500 line-through mr-1">
                              {plan.originalPrice}
                            </span>
                          )}
                          {plan.price} {plan.currency}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}              </div>
              </div>
            )}

            {/* AI Services Pricing */}
            <div className="mb-3 md:mb-4">
              <h3 className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white mb-2 md:mb-3">
                {t('chargeModal.aiServicesPricing', 'AI Services Pricing')}
              </h3>
              <div className="space-y-1.5 md:space-y-2">
                {aiServicesInfo.map((service, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-1.5 md:p-2 rounded-lg ${
                      theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 md:space-x-2">
                      <div className={`p-1 md:p-1.5 rounded-full ${service.bgColor}`}>
                        <div className={`w-2.5 h-2.5 md:w-3 md:h-3 ${service.color}`}>
                          {service.icon}
                        </div>
                      </div>
                      <span className="text-xs font-medium text-gray-900 dark:text-white">
                        {service.type}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {service.cost} {service.unit}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Purchase Button */}
            {/* Purchase Button */}
            {!apiLoading && !apiError && pricingPlans.length > 0 && (
              <div className="text-center pt-1 md:pt-2">
                <button
                  onClick={handlePurchase}
                  disabled={loading || !selectedPlan}
                  className={`w-full px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-semibold text-white transition-all ${
                    loading || !selectedPlan
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                  }`}
                >
                  {loading ? t('chargeModal.processing', 'Processing...') : t('chargeModal.purchase', 'Purchase {{planName}}', { planName: pricingPlans.find(p => p.id === selectedPlan)?.name || t('chargeModal.plan', 'Plan') })}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Test without portal first */}
          {modalContent}
          {/* Original portal version */}
          {/* {createPortal(modalContent, document.body)} */}
        </>
      )}
    </AnimatePresence>
  );
};

export default ChargeModal;
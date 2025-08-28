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
        `Get ${plan.coins} coins`,
        `Valid for ${plan.plan_period}`,
        'Access to all AI tools',
        'Priority support'
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
        'Perfect for trying our service',
        'Valid for 15 days',
        'Basic support',
        'Access to all AI tools'
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
        'Perfect for regular users',
        'Monthly allocation of coins',
        'Priority support',
        'Full access to all features'
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
        'Best value plan',
        '1380 coins every month',
        'Full year subscription',
        'Premium support',
        '10% discount'
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
        'Extra coins for existing users',
        'Expires at month end',
        'Add to current balance',
        'Instant activation'
      ],
      icon: <FiPackage className="w-6 h-6" />,
      color: 'amber',
      bgGradient: 'from-amber-500 to-orange-500'
    }
  ];

  const aiServicesInfo = [
    {
      type: 'AI Chat',
      icon: <FiMic className="w-5 h-5" />,
      cost: '1 coin',
      unit: 'per message',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
      type: 'Image Generation',
      icon: <FiImage className="w-5 h-5" />,
      cost: '3 coins',
      unit: 'per image',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30'
    },
    {
      type: 'Video Generation',
      icon: <FiVideo className="w-5 h-5" />,
      cost: '30 coins',
      unit: 'per 5 seconds',
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30'
    },
    {
      type: 'Audio Transcription',
      icon: <FiMic className="w-5 h-5" />,
      cost: '2 coins',
      unit: 'per minute',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30'
    },
    {
      type: 'Content Writing',
      icon: <FiImage className="w-5 h-5" />,
      cost: '1 coin',
      unit: 'per request',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30'
    },
    {
      type: 'Humanise Text',
      icon: <FiZap className="w-5 h-5" />,
      cost: '1 coin',
      unit: 'per request',
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
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Backdrop - only capture clicks for closing */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto"
        onClick={onClose}
      />
      
      {/* Modal positioned below navbar in top-right */}
      <div className="fixed top-20 right-4 pointer-events-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, x: 20, y: -20 }}
          animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, x: 20, y: -20 }}
          className={`relative w-96 max-w-[calc(100vw-2rem)] rounded-xl shadow-2xl ${
            theme === 'dark' ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
          } max-h-[calc(100vh-2rem)] overflow-hidden`}
        >
          {/* Header */}
          <div className={`px-4 py-3 border-b ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Buy Coins
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <FiX className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-[calc(100vh-8rem)]">
            {/* Current Balance */}
            <div className={`mb-4 p-3 rounded-lg ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Current Balance
                  </h3>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {currentCoins}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">coins</div>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {apiLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">Loading plans...</span>
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
                  Try again
                </button>
              </div>
            )}

            {/* Pricing Plans */}
            {!apiLoading && !apiError && pricingPlans.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Choose Your Plan
                </h3>
                <div className="space-y-2">
                  {pricingPlans.map((plan) => (
                  <motion.div
                    key={plan.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={`relative p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedPlan === plan.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : theme === 'dark'
                        ? 'border-gray-700 hover:border-gray-600 bg-gray-800'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full bg-gradient-to-r ${plan.bgGradient} text-white flex-shrink-0`}>
                          <div className="w-4 h-4">
                            {plan.icon}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                              {plan.name}
                            </h4>
                            {plan.popular && (
                              <span className="bg-purple-500 text-white px-1.5 py-0.5 rounded text-xs font-semibold">
                                Popular
                              </span>
                            )}
                            {plan.discount && (
                              <span className="bg-green-500 text-white px-1.5 py-0.5 rounded text-xs font-semibold">
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
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
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
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                AI Services Pricing
              </h3>
              <div className="space-y-2">
                {aiServicesInfo.map((service, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`p-1.5 rounded-full ${service.bgColor}`}>
                        <div className={`w-3 h-3 ${service.color}`}>
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
              <div className="text-center pt-2">
                <button
                  onClick={handlePurchase}
                  disabled={loading || !selectedPlan}
                  className={`w-full px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all ${
                    loading || !selectedPlan
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                  }`}
                >
                  {loading ? 'Processing...' : `Purchase ${pricingPlans.find(p => p.id === selectedPlan)?.name || 'Plan'}`}
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
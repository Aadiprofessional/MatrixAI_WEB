import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiArrowLeft, 
  FiCreditCard, 
  FiDollarSign, 
  FiCheck,
  FiLock,
  FiInfo,
  FiLoader,
  FiStar,
  FiShield,
  FiZap,
  FiGlobe,
  FiClock,
  FiUsers,
  FiTrendingUp,
  FiAward
} from 'react-icons/fi';
import { Layout } from '../components';
import { ThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import airwallexService from '../services/airwallexService';

// Plan details interface
interface PlanDetails {
  title: string;
  coins: string;
  duration: string;
  expiry: string;
  price: string;
  features?: string[];
  originalPrice?: string;
  savings?: string;
  popular?: boolean;
}

// Plan features data
const getPlanFeatures = (planTitle: string, t: any): string[] => {
  const features: { [key: string]: string[] } = {
    'Basic': [
      t('airwallexPayment.planFeatures.basic.tokensPerMonth'),
      t('airwallexPayment.planFeatures.basic.basicModelsAccess'),
      t('airwallexPayment.planFeatures.basic.standardSupport'),
      t('airwallexPayment.planFeatures.basic.webDashboardAccess'),
      t('airwallexPayment.planFeatures.basic.basicAnalytics')
    ],
    'Pro': [
      t('airwallexPayment.planFeatures.pro.tokensPerMonth'),
      t('airwallexPayment.planFeatures.pro.advancedModelsAccess'),
      t('airwallexPayment.planFeatures.pro.prioritySupport'),
      t('airwallexPayment.planFeatures.pro.apiAccess'),
      t('airwallexPayment.planFeatures.pro.advancedAnalytics'),
      t('airwallexPayment.planFeatures.pro.customIntegrations'),
      t('airwallexPayment.planFeatures.pro.teamCollaboration')
    ],
    'Enterprise': [
      t('airwallexPayment.planFeatures.enterprise.unlimitedTokens'),
      t('airwallexPayment.planFeatures.enterprise.allModelsAccess'),
      t('airwallexPayment.planFeatures.enterprise.dedicatedSupport'),
      t('airwallexPayment.planFeatures.enterprise.fullApiAccess'),
      t('airwallexPayment.planFeatures.enterprise.advancedReporting'),
      t('airwallexPayment.planFeatures.enterprise.customIntegrations'),
      t('airwallexPayment.planFeatures.enterprise.teamManagement'),
      t('airwallexPayment.planFeatures.enterprise.whiteLabelOptions'),
      t('airwallexPayment.planFeatures.enterprise.slaGuarantee'),
      t('airwallexPayment.planFeatures.enterprise.customTraining')
    ]
  };
  
  return features[planTitle] || [
    t('airwallexPayment.planFeatures.default.tokensIncluded'),
    t('airwallexPayment.planFeatures.default.modelsAccess'),
    t('airwallexPayment.planFeatures.default.customerSupport'),
    t('airwallexPayment.planFeatures.default.dashboardAccess')
  ];
};

const AirwallexPaymentPage: React.FC = () => {
  const { darkMode } = useContext(ThemeContext);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  
  // Extract plan info from location state
  const planData = location.state || {};
  const { 
    uid = user?.uid,
    plan = 'Unknown', 
    price = '0', 
    isAddon = false,
    finalPrice,
    discount = 0,
    appliedCoupon,
    planDetails: passedPlanDetails,
    startDate: startDateStr,
    endDate: endDateStr 
  } = planData;
  
  // Payment state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Use the singleton airwallexService instance
  
  // Plan details state
  const [planDetails, setPlanDetails] = useState<PlanDetails>({
    title: plan,
    coins: '0',
    duration: '1 month',
    expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    price: finalPrice || price,
    features: getPlanFeatures(plan, t),
    originalPrice: price !== finalPrice ? price : undefined,
    savings: price !== finalPrice ? (parseFloat(price) - parseFloat(finalPrice || price)).toFixed(2) : undefined,
    popular: plan === 'Pro'
  });

  useEffect(() => {
    if (passedPlanDetails) {
      setPlanDetails({
        ...passedPlanDetails,
        features: passedPlanDetails.features || getPlanFeatures(passedPlanDetails.title, t),
        originalPrice: passedPlanDetails.originalPrice || (price !== finalPrice ? price : undefined),
        savings: passedPlanDetails.savings || (price !== finalPrice ? (parseFloat(price) - parseFloat(finalPrice || price)).toFixed(2) : undefined),
        popular: passedPlanDetails.popular || passedPlanDetails.title === 'Pro'
      });
    }
  }, [passedPlanDetails, price, finalPrice]);

  const handlePayment = async () => {
    if (!user?.uid) {
      setError(t('airwallexPayment.errors.userNotAuthenticated'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Extract numeric value from price string (e.g., '50 HKD' -> 50)
      const numericPrice = parseFloat(planDetails.price.replace(/[^0-9.]/g, ''));
      
      // Create payment intent
      const paymentIntent = await airwallexService.createPaymentIntent({
        amount: Math.round(numericPrice), // HKD amount as-is (no cents conversion)
        currency: 'HKD',
        merchantOrderId: airwallexService.generateMerchantOrderId(),
        returnUrl: `${window.location.origin}/payment/airwallex/result`,
        uid: user.uid,
        plan: planDetails.title
      });

      // Initialize Airwallex SDK and redirect to checkout
      const { init } = await import('@airwallex/components-sdk');
      
      const airwallexEnv = (process.env.REACT_APP_AIRWALLEX_ENV as 'demo' | 'dev' | 'staging' | 'prod') || 'demo';
      console.log('🔧 Airwallex Environment:', airwallexEnv);
      console.log('🔧 Payment Intent ID:', paymentIntent.id);
      
      const airwallex = await init({
        env: airwallexEnv,
        enabledElements: ['payments'],
      });
      
      console.log('✅ Airwallex SDK initialized successfully');
      console.log('🔧 Airwallex instance:', airwallex);

      // Redirect to Airwallex hosted payment page
      console.log('🚀 Redirecting to Airwallex checkout...');
      console.log('🔧 Redirect params:', {
        intent_id: paymentIntent.id,
        client_secret: paymentIntent.client_secret ? '[REDACTED]' : 'MISSING',
        currency: 'HKD',
        country_code: 'HK',
        successUrl: `${window.location.origin}/payment/airwallex/success?intent_id=${paymentIntent.id}`,
        failUrl: `${window.location.origin}/payment/airwallex/failure?intent_id=${paymentIntent.id}`,
        logoUrl: `${window.location.origin}/logo.svg`,
        appearance: {
          mode: darkMode ? 'dark' : 'light'
        }
      });
      
      if (!airwallex.payments) {
        throw new Error('Airwallex payments module not available');
      }
      
      await airwallex.payments.redirectToCheckout({
        intent_id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        currency: 'HKD',
        country_code: 'HK',
        successUrl: `${window.location.origin}/payment/airwallex/success?intent_id=${paymentIntent.id}`,
        failUrl: `${window.location.origin}/payment/airwallex/failure?intent_id=${paymentIntent.id}`,
        logoUrl: `${window.location.origin}/logo.svg`,
        appearance: {
          mode: darkMode ? 'dark' : 'light'
        }
      });
      
      console.log('✅ Redirect initiated successfully');

    } catch (err) {
      console.error('❌ Error during payment process:', err);
       console.error('❌ Error details:', {
         message: err instanceof Error ? err.message : 'Unknown error',
         stack: err instanceof Error ? err.stack : undefined,
         environment: process.env.REACT_APP_AIRWALLEX_ENV
       });
      setError(`Failed to initialize payment: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`);
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <Layout>
      <div className={`min-h-screen transition-colors duration-300 ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate(-1)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'text-gray-300 hover:text-white hover:bg-gray-800' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <FiArrowLeft className="w-5 h-5" />
              <span>{t('airwallexPayment.navigation.back')}</span>
            </button>
            
            <div className="text-center">
              <h1 className={`text-3xl font-bold ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {t('airwallexPayment.header.title')}
              </h1>
              <p className={`text-sm mt-1 ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {t('airwallexPayment.header.subtitle')}
              </p>
            </div>
            
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Plan Details & Features */}
            <div className="lg:col-span-2 space-y-6">
              {/* Plan Overview */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl p-6 ${
                  darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                } shadow-lg relative overflow-hidden`}
              >
                {planDetails.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 text-sm font-semibold rounded-bl-lg">
                    <FiStar className="inline w-4 h-4 mr-1" />
                    {t('airwallexPayment.planOverview.mostPopular')}
                  </div>
                )}
                
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className={`text-2xl font-bold mb-2 ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {t('airwallexPayment.planOverview.planTitle', { title: planDetails.title })}
                    </h2>
                    <p className={`text-sm ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {t('airwallexPayment.planOverview.description')}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    {planDetails.originalPrice && (
                      <div className={`text-sm line-through ${
                        darkMode ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        {planDetails.originalPrice}
                      </div>
                    )}
                    <div className={`text-3xl font-bold ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {planDetails.price}
                    </div>
                    <div className={`text-sm ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {t('airwallexPayment.planOverview.per')} {planDetails.duration}
                    </div>
                    {planDetails.savings && (
                      <div className="text-green-500 text-sm font-semibold mt-1">
                        {t('airwallexPayment.planOverview.save', { amount: planDetails.savings })}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Plan Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className={`text-center p-3 rounded-lg ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <FiZap className={`w-6 h-6 mx-auto mb-2 ${
                      darkMode ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                    <div className={`text-lg font-bold ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {planDetails.coins}
                    </div>
                    <div className={`text-xs ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {t('airwallexPayment.planStats.aiTokens')}
                    </div>
                  </div>
                  
                  <div className={`text-center p-3 rounded-lg ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <FiClock className={`w-6 h-6 mx-auto mb-2 ${
                      darkMode ? 'text-green-400' : 'text-green-600'
                    }`} />
                    <div className={`text-lg font-bold ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {planDetails.duration}
                    </div>
                    <div className={`text-xs ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {t('airwallexPayment.planStats.duration')}
                    </div>
                  </div>
                  
                  <div className={`text-center p-3 rounded-lg ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <FiTrendingUp className={`w-6 h-6 mx-auto mb-2 ${
                      darkMode ? 'text-purple-400' : 'text-purple-600'
                    }`} />
                    <div className={`text-lg font-bold ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      24/7
                    </div>
                    <div className={`text-xs ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {t('airwallexPayment.planStats.support')}
                    </div>
                  </div>
                </div>
              </motion.div>
              
              {/* Features List */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`rounded-xl p-6 ${
                  darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                } shadow-lg`}
              >
                <h3 className={`text-xl font-semibold mb-4 flex items-center ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  <FiCheck className="w-5 h-5 mr-2 text-green-500" />
                  {t('airwallexPayment.features.title')}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {planDetails.features?.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <FiCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className={`text-sm ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
              
              {/* Security & Trust Badges */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={`rounded-xl p-6 ${
                  darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                } shadow-lg`}
              >
                <h3 className={`text-lg font-semibold mb-4 flex items-center ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  <FiShield className="w-5 h-5 mr-2 text-green-500" />
                  {t('airwallexPayment.security.title')}
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <FiLock className={`w-8 h-8 mx-auto mb-2 ${
                      darkMode ? 'text-green-400' : 'text-green-600'
                    }`} />
                    <div className={`text-xs font-medium ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {t('airwallexPayment.security.sslEncrypted')}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <FiShield className={`w-8 h-8 mx-auto mb-2 ${
                      darkMode ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                    <div className={`text-xs font-medium ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {t('airwallexPayment.security.threeDSecure')}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <FiGlobe className={`w-8 h-8 mx-auto mb-2 ${
                      darkMode ? 'text-purple-400' : 'text-purple-600'
                    }`} />
                    <div className={`text-xs font-medium ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {t('airwallexPayment.security.globalPayments')}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <FiAward className={`w-8 h-8 mx-auto mb-2 ${
                      darkMode ? 'text-yellow-400' : 'text-yellow-600'
                    }`} />
                    <div className={`text-xs font-medium ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {t('airwallexPayment.security.pciCompliant')}
                    </div>
                  </div>
                </div>
              </motion.div>
              
              {/* Plan Benefits */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`rounded-xl p-6 ${
                  darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                } shadow-lg`}
              >
                <h3 className={`text-lg font-semibold mb-4 flex items-center ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  <FiZap className="w-5 h-5 mr-2 text-blue-500" />
                  {t('airwallexPayment.benefits.title')}
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <FiCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className={`text-sm ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {t('airwallexPayment.benefits.allInOne')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FiCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className={`text-sm ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {t('airwallexPayment.benefits.payPerUse')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <FiCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className={`text-sm ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {t('airwallexPayment.benefits.buyAddons')}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1"
            >
              <div className={`rounded-xl p-6 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-lg sticky top-8`}>
                <h2 className={`text-xl font-semibold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {t('airwallexPayment.orderSummary.title')}
                </h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('airwallexPayment.orderSummary.plan')}:
                    </span>
                    <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {planDetails.title}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('airwallexPayment.orderSummary.aiTokens')}:
                    </span>
                    <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {planDetails.coins}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('airwallexPayment.orderSummary.billingCycle')}:
                    </span>
                    <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {planDetails.duration}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('airwallexPayment.orderSummary.validUntil')}:
                    </span>
                    <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {planDetails.expiry}
                    </span>
                  </div>
                  
                  {planDetails.originalPrice && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {t('airwallexPayment.orderSummary.originalPrice')}:
                        </span>
                        <span className={`line-through ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          {planDetails.originalPrice}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center text-green-600">
                        <span className="font-medium">
                          {t('airwallexPayment.orderSummary.discount')}:
                        </span>
                        <span className="font-semibold">
                          -{planDetails.savings} HKD
                        </span>
                      </div>
                    </>
                  )}
                  
                  {discount > 0 && (
                    <div className="flex justify-between items-center text-green-600">
                      <span className="font-medium">
                        {t('airwallexPayment.orderSummary.additionalDiscount')}:
                      </span>
                      <span className="font-semibold">
                        -{discount.toFixed(2)} HKD
                      </span>
                    </div>
                  )}
                  
                  <div className={`border-t pt-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex justify-between items-center">
                      <span className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {t('airwallexPayment.orderSummary.total')}:
                      </span>
                      <span className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                        {planDetails.price}
                      </span>
                    </div>
                    <div className={`text-xs text-right mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {t('airwallexPayment.orderSummary.billedDuration', { duration: planDetails.duration })}
                    </div>
                  </div>
                  
                  {/* Secure Checkout Button */}
                  <button
                    onClick={handlePayment}
                    disabled={loading}
                    className={`w-full mt-6 py-4 px-6 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 text-lg ${
                      loading
                        ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                    }`}
                  >
                    {loading ? (
                      <>
                        <FiLoader className="w-5 h-5 animate-spin" />
                        <span>{t('airwallexPayment.payment.processing')}</span>
                      </>
                    ) : (
                      <>
                        <FiLock className="w-5 h-5" />
                        <span>{t('airwallexPayment.payment.secureCheckout')}</span>
                      </>
                    )}
                  </button>
                  
                  {/* Secure Payment Notice */}
                  <div className={`mt-4 p-3 rounded-lg text-center ${darkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
                    <FiLock className={`w-4 h-4 mx-auto mb-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    <div className={`text-xs font-medium ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                      {t('airwallexPayment.payment.secureProcessing')}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Payment Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-2"
            >
              <div className={`rounded-xl p-6 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} shadow-lg`}>
                <h2 className={`text-xl font-semibold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {t('airwallexPayment.paymentMethod.title')}
                </h2>
                
                {/* Airwallex Payment Info */}
                <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
                  <div className="flex items-center space-x-3">
                    <FiInfo className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    <div>
                      <p className={`text-sm font-medium ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                        {t('airwallexPayment.paymentMethod.securePayment')}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                        {t('airwallexPayment.paymentMethod.encryptionNotice')}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Payment Methods */}
                <div className="mb-6">
                  <h3 className={`text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {t('airwallexPayment.paymentMethod.acceptedMethods')}
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`p-3 rounded-lg border text-center ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                      <FiCreditCard className={`w-6 h-6 mx-auto mb-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                      <div className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {t('airwallexPayment.paymentMethod.creditCards')}
                      </div>
                    </div>
                    
                    <div className={`p-3 rounded-lg border text-center ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                      <FiDollarSign className={`w-6 h-6 mx-auto mb-1 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                      <div className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {t('airwallexPayment.paymentMethod.digitalWallets')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}
                  >
                    <p className={`text-sm ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                      {error}
                    </p>
                  </motion.div>
                )}

                <p className={`text-xs text-center mt-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {t('airwallexPayment.paymentMethod.redirectNotice')}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AirwallexPaymentPage;
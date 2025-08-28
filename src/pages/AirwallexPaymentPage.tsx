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
const getPlanFeatures = (planTitle: string): string[] => {
  const features: { [key: string]: string[] } = {
    'Basic': [
      '1,000 AI tokens per month',
      'Basic AI models access',
      'Standard support',
      'Web dashboard access',
      'Basic analytics'
    ],
    'Pro': [
      '10,000 AI tokens per month',
      'Advanced AI models access',
      'Priority support',
      'API access',
      'Advanced analytics',
      'Custom integrations',
      'Team collaboration tools'
    ],
    'Enterprise': [
      'Unlimited AI tokens',
      'All AI models access',
      '24/7 dedicated support',
      'Full API access',
      'Advanced analytics & reporting',
      'Custom integrations',
      'Team management',
      'White-label options',
      'SLA guarantee',
      'Custom training'
    ]
  };
  
  return features[planTitle] || [
    'AI tokens included',
    'Access to AI models',
    'Customer support',
    'Dashboard access'
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
    features: getPlanFeatures(plan),
    originalPrice: price !== finalPrice ? price : undefined,
    savings: price !== finalPrice ? (parseFloat(price) - parseFloat(finalPrice || price)).toFixed(2) : undefined,
    popular: plan === 'Pro'
  });

  useEffect(() => {
    if (passedPlanDetails) {
      setPlanDetails({
        ...passedPlanDetails,
        features: passedPlanDetails.features || getPlanFeatures(passedPlanDetails.title),
        originalPrice: passedPlanDetails.originalPrice || (price !== finalPrice ? price : undefined),
        savings: passedPlanDetails.savings || (price !== finalPrice ? (parseFloat(price) - parseFloat(finalPrice || price)).toFixed(2) : undefined),
        popular: passedPlanDetails.popular || passedPlanDetails.title === 'Pro'
      });
    }
  }, [passedPlanDetails, price, finalPrice]);

  const handlePayment = async () => {
    if (!user?.uid) {
      setError('User not authenticated');
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
        returnUrl: `${window.location.origin}/payment/airwallex/result`
      });

      // Initialize Airwallex SDK and redirect to checkout
      const { init } = await import('@airwallex/components-sdk');
      
      const airwallex = await init({
        env: 'demo', // Demo sandbox environment
        enabledElements: ['payments'],
      });

      // Redirect to Airwallex hosted payment page
      airwallex.payments?.redirectToCheckout({
        intent_id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        currency: 'HKD',
        country_code: 'HK',
        successUrl: `${window.location.origin}/payment/airwallex/success?intent_id=${paymentIntent.id}`,
        failUrl: `${window.location.origin}/payment/airwallex/failure?intent_id=${paymentIntent.id}`,
        logoUrl: `${window.location.origin}/logo.png`,
        appearance: {
          mode: darkMode ? 'dark' : 'light'
        }
      });

    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Payment failed');
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
              <span>Back</span>
            </button>
            
            <div className="text-center">
              <h1 className={`text-3xl font-bold ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Complete Your Purchase
              </h1>
              <p className={`text-sm mt-1 ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Secure checkout powered by Airwallex
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
                    Most Popular
                  </div>
                )}
                
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className={`text-2xl font-bold mb-2 ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {planDetails.title} Plan
                    </h2>
                    <p className={`text-sm ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Everything you need to get started with AI
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
                      per {planDetails.duration}
                    </div>
                    {planDetails.savings && (
                      <div className="text-green-500 text-sm font-semibold mt-1">
                        Save {planDetails.savings} HKD
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
                      AI Tokens
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
                      Duration
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
                      Support
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
                  What's Included
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
                  Secure & Trusted
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <FiLock className={`w-8 h-8 mx-auto mb-2 ${
                      darkMode ? 'text-green-400' : 'text-green-600'
                    }`} />
                    <div className={`text-xs font-medium ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      SSL Encrypted
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <FiShield className={`w-8 h-8 mx-auto mb-2 ${
                      darkMode ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                    <div className={`text-xs font-medium ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      3D Secure
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <FiGlobe className={`w-8 h-8 mx-auto mb-2 ${
                      darkMode ? 'text-purple-400' : 'text-purple-600'
                    }`} />
                    <div className={`text-xs font-medium ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Global Payments
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <FiAward className={`w-8 h-8 mx-auto mb-2 ${
                      darkMode ? 'text-yellow-400' : 'text-yellow-600'
                    }`} />
                    <div className={`text-xs font-medium ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      PCI Compliant
                    </div>
                  </div>
                </div>
              </motion.div>
              
              {/* Customer Testimonials */}
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
                  <FiUsers className="w-5 h-5 mr-2 text-blue-500" />
                  Trusted by 10,000+ Users
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-lg ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <div className="flex items-center mb-2">
                      {[...Array(5)].map((_, i) => (
                        <FiStar key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className={`text-sm mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      "Amazing AI capabilities and great value for money!"
                    </p>
                    <div className={`text-xs ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      - Sarah K., Developer
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-lg ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <div className="flex items-center mb-2">
                      {[...Array(5)].map((_, i) => (
                        <FiStar key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className={`text-sm mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      "The Pro plan has everything I need for my projects."
                    </p>
                    <div className={`text-xs ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      - Mike R., Entrepreneur
                    </div>
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
                  Order Summary
                </h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Plan:
                    </span>
                    <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {planDetails.title}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      AI Tokens:
                    </span>
                    <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {planDetails.coins}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Billing Cycle:
                    </span>
                    <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {planDetails.duration}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Valid Until:
                    </span>
                    <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {planDetails.expiry}
                    </span>
                  </div>
                  
                  {planDetails.originalPrice && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Original Price:
                        </span>
                        <span className={`line-through ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          {planDetails.originalPrice}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center text-green-600">
                        <span className="font-medium">
                          Discount:
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
                        Additional Discount:
                      </span>
                      <span className="font-semibold">
                        -{discount.toFixed(2)} HKD
                      </span>
                    </div>
                  )}
                  
                  <div className={`border-t pt-4 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex justify-between items-center">
                      <span className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Total:
                      </span>
                      <span className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                        {planDetails.price}
                      </span>
                    </div>
                    <div className={`text-xs text-right mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      HKD, billed {planDetails.duration}
                    </div>
                  </div>
                  
                  {/* Money Back Guarantee */}
                  <div className={`mt-4 p-3 rounded-lg text-center ${darkMode ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'}`}>
                    <FiShield className={`w-4 h-4 mx-auto mb-1 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                    <div className={`text-xs font-medium ${darkMode ? 'text-green-300' : 'text-green-800'}`}>
                      30-Day Money Back Guarantee
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
                  Payment Method
                </h2>
                
                {/* Airwallex Payment Info */}
                <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
                  <div className="flex items-center space-x-3">
                    <FiInfo className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    <div>
                      <p className={`text-sm font-medium ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                        Secure Payment with Airwallex
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                        Your payment information is encrypted and secure
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Payment Methods */}
                <div className="mb-6">
                  <h3 className={`text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Accepted Payment Methods
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`p-3 rounded-lg border text-center ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                      <FiCreditCard className={`w-6 h-6 mx-auto mb-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                      <div className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Credit Cards
                      </div>
                    </div>
                    
                    <div className={`p-3 rounded-lg border text-center ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                      <FiDollarSign className={`w-6 h-6 mx-auto mb-1 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                      <div className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Digital Wallets
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

                {/* Payment Button */}
                <button
                  onClick={handlePayment}
                  disabled={loading}
                  className={`w-full py-4 px-6 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 text-lg ${
                    loading
                      ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                  }`}
                >
                  {loading ? (
                    <>
                      <FiLoader className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <FiLock className="w-5 h-5" />
                      <span>Secure Checkout - ${planDetails.price}</span>
                    </>
                  )}
                </button>

                <p className={`text-xs text-center mt-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  You will be redirected to Airwallex secure payment page
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
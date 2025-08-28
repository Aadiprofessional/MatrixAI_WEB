import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiX, 
  FiRefreshCw, 
  FiHome, 
  FiLoader,
  FiCreditCard,
  FiCalendar,
  FiDollarSign,
  FiAlertCircle
} from 'react-icons/fi';
import { Layout } from '../components';
import { ThemeContext } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import airwallexService, { PaymentIntentStatusResponse } from '../services/airwallexService';

const AirwallexPaymentFailure: React.FC = () => {
  const { darkMode } = useContext(ThemeContext);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [paymentDetails, setPaymentDetails] = useState<PaymentIntentStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const intentId = searchParams.get('intent_id');

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      if (!intentId) {
        setError('Payment intent ID not found');
        setLoading(false);
        return;
      }

      try {
        const details = await airwallexService.getPaymentIntentStatus(intentId);
        setPaymentDetails(details);
      } catch (err) {
        console.error('Error fetching payment details:', err);
        setError('Failed to fetch payment details');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentDetails();
  }, [intentId]);

  const handleRetryPayment = () => {
    // Navigate back to payment page with the same details
    navigate('/payment/airwallex', { 
      state: { 
        retryPayment: true,
        intentId: intentId 
      } 
    });
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const getFailureReason = (status: string) => {
    switch (status) {
      case 'FAILED':
        return 'Payment was declined by your bank or card issuer.';
      case 'CANCELLED':
        return 'Payment was cancelled.';
      case 'REQUIRES_PAYMENT_METHOD':
        return 'Payment method was invalid or expired.';
      case 'REQUIRES_CONFIRMATION':
        return 'Payment requires additional confirmation.';
      case 'REQUIRES_ACTION':
        return 'Payment requires additional authentication.';
      default:
        return 'Payment could not be completed.';
    }
  };

  const getFailureAdvice = (status: string) => {
    switch (status) {
      case 'FAILED':
        return 'Please try a different payment method or contact your bank.';
      case 'CANCELLED':
        return 'You can retry the payment or choose a different payment method.';
      case 'REQUIRES_PAYMENT_METHOD':
        return 'Please check your card details and try again.';
      case 'REQUIRES_CONFIRMATION':
      case 'REQUIRES_ACTION':
        return 'Please complete the required authentication and try again.';
      default:
        return 'Please try again or contact support if the problem persists.';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
          <div className="text-center">
            <FiLoader className={`w-12 h-12 animate-spin mx-auto mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`} />
            <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Loading payment details...
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiAlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Error
            </h1>
            <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {error}
            </p>
            <button
              onClick={handleGoHome}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} py-8`}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            {/* Failure Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <FiX className="w-10 h-10 text-red-600" />
            </motion.div>

            {/* Failure Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Payment Failed
              </h1>
              <p className={`text-lg mb-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Unfortunately, your payment could not be processed.
              </p>
            </motion.div>

            {/* Failure Details */}
            {paymentDetails && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-6 mb-8 text-left`}
              >
                <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Payment Details
                </h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FiDollarSign className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Amount</span>
                    </div>
                    <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      ${(paymentDetails.amount / 100).toFixed(2)} {paymentDetails.currency}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FiCreditCard className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Payment ID</span>
                    </div>
                    <span className={`font-mono text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {paymentDetails.id}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FiCalendar className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Order ID</span>
                    </div>
                    <span className={`font-mono text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {paymentDetails.merchant_order_id}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FiAlertCircle className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Status</span>
                    </div>
                    <span className="font-medium text-red-600">
                      {paymentDetails.status}
                    </span>
                  </div>
                </div>

                {/* Failure Reason and Advice */}
                <div className={`p-4 ${darkMode ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'} border rounded-lg`}>
                  <h3 className={`font-medium mb-2 ${darkMode ? 'text-red-300' : 'text-red-900'}`}>
                    What happened?
                  </h3>
                  <p className={`text-sm mb-3 ${darkMode ? 'text-red-400' : 'text-red-700'}`}>
                    {getFailureReason(paymentDetails.status)}
                  </p>
                  <h3 className={`font-medium mb-2 ${darkMode ? 'text-red-300' : 'text-red-900'}`}>
                    What can you do?
                  </h3>
                  <p className={`text-sm ${darkMode ? 'text-red-400' : 'text-red-700'}`}>
                    {getFailureAdvice(paymentDetails.status)}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <button
                onClick={handleRetryPayment}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <FiRefreshCw className="w-5 h-5" />
                <span>Try Again</span>
              </button>
              
              <button
                onClick={handleGoHome}
                className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                  darkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600' 
                    : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300'
                }`}
              >
                <FiHome className="w-5 h-5" />
                <span>Go to Dashboard</span>
              </button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default AirwallexPaymentFailure;
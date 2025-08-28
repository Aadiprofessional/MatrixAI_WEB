import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiCheck, 
  FiDownload, 
  FiHome, 
  FiLoader,
  FiCreditCard,
  FiCalendar,
  FiDollarSign
} from 'react-icons/fi';
import { Layout } from '../components';
import { ThemeContext } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import airwallexService, { PaymentIntentStatusResponse } from '../services/airwallexService';

const AirwallexPaymentSuccess: React.FC = () => {
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
        
        // Verify payment was successful
        if (details.status !== 'SUCCEEDED') {
          setError('Payment was not successful');
        }
      } catch (err) {
        console.error('Error fetching payment details:', err);
        setError('Failed to fetch payment details');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentDetails();
  }, [intentId]);

  const handleDownloadReceipt = () => {
    if (!paymentDetails) return;
    
    // Create a simple receipt content
    const receiptContent = `
Payment Receipt
===============

Payment ID: ${paymentDetails.id}
Amount: $${(paymentDetails.amount / 100).toFixed(2)} ${paymentDetails.currency}
Status: ${paymentDetails.status}
Order ID: ${paymentDetails.merchant_order_id}
Date: ${new Date().toLocaleDateString()}

Thank you for your payment!
    `;
    
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${paymentDetails.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGoHome = () => {
    navigate('/');
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
              <FiCheck className="w-8 h-8 text-red-600" />
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
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <FiCheck className="w-10 h-10 text-green-600" />
            </motion.div>

            {/* Success Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Payment Successful!
              </h1>
              <p className={`text-lg mb-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Thank you for your payment. Your transaction has been completed successfully.
              </p>
            </motion.div>

            {/* Payment Details */}
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
                
                <div className="space-y-3">
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
                  
                  {paymentDetails.latest_payment_attempt?.payment_method && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FiCreditCard className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                        <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Payment Method</span>
                      </div>
                      <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {paymentDetails.latest_payment_attempt.payment_method.type}
                      </span>
                    </div>
                  )}
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
                onClick={handleDownloadReceipt}
                className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                  darkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600' 
                    : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300'
                }`}
              >
                <FiDownload className="w-5 h-5" />
                <span>Download Receipt</span>
              </button>
              
              <button
                onClick={handleGoHome}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
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

export default AirwallexPaymentSuccess;
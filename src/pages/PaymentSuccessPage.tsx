import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheck, FiLoader, FiAlertTriangle } from 'react-icons/fi';
import { Layout } from '../components';
import { useUser } from '../context/UserContext';
import { useTranslation } from 'react-i18next';
import * as paymentService from '../services/paymentService';

const PaymentSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUserData } = useUser();
  const { t } = useTranslation();
  
  // Parse query parameters
  const queryParams = new URLSearchParams(location.search);
  const paymentRequestId = queryParams.get('paymentRequestId');
  
  // State
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(5);
  
  useEffect(() => {
    const verifyPayment = async () => {
      if (!paymentRequestId) {
        setStatus('failed');
        setMessage(t('payment.no_id_found') || 'No payment ID found. Please try again.');
        return;
      }
      
      try {
        // Check payment status
        const paymentStatus = await paymentService.getTransferStatus(paymentRequestId);
        console.log('Payment status:', paymentStatus);
        
        if (paymentStatus.status === 'SUCCEEDED') {
          // Payment was successful
          setStatus('success');
          setMessage(t('payment.success_message') || 'Your payment was successful!');
          
          // Refresh user data
          refreshUserData();
          
          // Start countdown
          startCountdown();
        } else if (paymentStatus.status === 'PENDING' || paymentStatus.status === 'PROCESSING') {
          setStatus('loading');
          setMessage(t('payment.processing_message') || 'Your payment is still being processed. Please wait...');
          
          // Check again in 5 seconds
          setTimeout(verifyPayment, 5000);
        } else {
          // Payment failed
          setStatus('failed');
          setMessage(t('payment.failed_message', {status: paymentStatus.status}) || `Payment failed: ${paymentStatus.status}`);
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        setStatus('failed');
        setMessage(t('payment.error_message') || 'An error occurred while verifying your payment. Please contact support.');
      }
    };
    
    verifyPayment();
  }, [paymentRequestId, refreshUserData]);
  
  // Start countdown to redirect
  const startCountdown = () => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/transactions');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  };
  
  return (
    <Layout>
      <div className="max-w-lg mx-auto py-12 px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center p-8 rounded-2xl bg-white dark:bg-gray-800 shadow-lg"
        >
          {status === 'loading' && (
            <>
              <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-blue-100 mb-6">
                <FiLoader className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                {t('payment.verifying') || 'Verifying Payment'}
              </h2>
              <p className="mb-6 text-gray-600 dark:text-gray-300">
                {message || t('payment.please_wait') || 'Please wait while we verify your payment...'}
              </p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-green-100 mb-6">
                <FiCheck className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                {t('payment.successful') || 'Payment Successful!'}
              </h2>
              <p className="mb-6 text-gray-600 dark:text-gray-300">
                {t('payment.subscription_activated') || 'Your subscription has been activated successfully. Thank you for your purchase!'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('payment.redirecting', {countdown}) || `Redirecting to your transactions in ${countdown} seconds...`}
              </p>
            </>
          )}
          
          {status === 'failed' && (
            <>
              <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-red-100 mb-6">
                <FiAlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                {t('payment.failed') || 'Payment Failed'}
              </h2>
              <p className="mb-6 text-gray-600 dark:text-gray-300">
                {message || t('payment.issue') || 'There was an issue with your payment. Please try again.'}
              </p>
              <button
                onClick={() => navigate('/payment')}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                {t('payment.try_again') || 'Try Again'}
              </button>
            </>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

export default PaymentSuccessPage;
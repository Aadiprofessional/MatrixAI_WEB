import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiArrowLeft, 
  FiCreditCard, 
  FiDollarSign, 
  FiCheck,
  FiLock,
  FiInfo
} from 'react-icons/fi';
import { Layout } from '../components';
import { ThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { useTranslation } from 'react-i18next';
import * as paymentService from '../services/paymentService';

// Configuration
const API_BASE_URL = 'https://main-matrixai-server-lujmidrakh.cn-hangzhou.fcapp.run';

// Payment method types
interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

// Plan details interface
interface PlanDetails {
  title: string;
  coins: string;
  duration: string;
  expiry: string;
  price: string;
}

interface Coupon {
  coupon_name: string;
  description: string;
  coupon_amount: number;
  coupon_id?: string;
}

const PaymentPage: React.FC = () => {
  const { darkMode } = useContext(ThemeContext);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshUserData } = useUser();
  const { t } = useTranslation();
  
  // Extract plan info from location state
  const planData = location.state || {};
  const { 
    uid = user?.id,
    plan = 'Unknown', 
    price = '0', 
    isAddon = false,
    finalPrice,
    discount,
    appliedCoupon,
    planDetails: passedPlanDetails,
    startDate: startDateStr,
    endDate: endDateStr 
  } = planData;
  
  // Payment state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('VISA');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVC, setCardCVC] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [cardValid, setCardValid] = useState(false);
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);
  
  // Payment success flag to trigger refresh in useEffect
  const [shouldRefreshUserData, setShouldRefreshUserData] = useState(false);
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(discount || 0);
  const [originalPrice, setOriginalPrice] = useState<string | number>(finalPrice || price);
  const [finalPriceState, setFinalPriceState] = useState<string | number>(finalPrice || price);
  const [appliedCouponState, setAppliedCouponState] = useState<Coupon | null>(appliedCoupon || null);
  
  // Date state
  const [startDate, setStartDate] = useState<Date>(
    startDateStr ? new Date(startDateStr) : new Date()
  );
  const [endDate, setEndDate] = useState<Date>(
    endDateStr ? new Date(endDateStr) : new Date()
  );
  
  // Payment intent
  const [paymentIntent, setPaymentIntent] = useState<any>(null);
  
  // Define payment methods
  const paymentMethods: PaymentMethod[] = [
    {
      id: 'VISA',
      name: 'Visa',
      icon: <FiCreditCard className="w-6 h-6 text-blue-600" />,
      description: t('payment.visa_desc') || 'Pay with Visa credit or debit card'
    },
    {
      id: 'MASTERCARD',
      name: 'Mastercard',
      icon: <FiCreditCard className="w-6 h-6 text-red-600" />,
      description: t('payment.mastercard_desc') || 'Pay with Mastercard credit or debit card'
    },
    {
      id: 'ALIPAY_HK',
      name: 'Alipay HK',
      icon: <FiDollarSign className="w-6 h-6 text-blue-500" />,
      description: t('payment.alipay_hk_desc') || 'Pay with Alipay Hong Kong'
    },
    {
      id: 'ALIPAY_CN',
      name: 'Alipay China',
      icon: <FiDollarSign className="w-6 h-6 text-blue-500" />,
      description: t('payment.alipay_cn_desc') || 'Pay with Alipay China'
    }
  ];
  
  // Set start and end dates based on plan
  useEffect(() => {
    const now = new Date();
    setStartDate(now);
    
    const newEndDate = new Date(now);
    if (plan === 'Tester') {
      newEndDate.setDate(now.getDate() + 7); // 7 days for tester
    } else if (plan === 'Monthly') {
      newEndDate.setMonth(now.getMonth() + 1); // 1 month
    } else if (plan === 'Yearly') {
      newEndDate.setFullYear(now.getFullYear() + 1); // 1 year
    } else if (plan === 'Addon') {
      // For addon, we don't change the expiry date
      if (endDateStr) {
        setEndDate(new Date(endDateStr));
        return;
      }
    }
    
    setEndDate(newEndDate);
  }, [plan, endDateStr]);
  
  // Countdown for payment success navigation
  useEffect(() => {
    if (paymentSuccess && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (paymentSuccess && countdown === 0) {
      navigate('/transactions');
    }
  }, [paymentSuccess, countdown, navigate]);
  
  // Refresh user data after successful payment
  useEffect(() => {
    if (shouldRefreshUserData) {
      refreshUserData();
      setShouldRefreshUserData(false);
    }
  }, [shouldRefreshUserData, refreshUserData]);
  
  // Get plan details
  const getPlanDetails = (): PlanDetails => {
    if (passedPlanDetails) return passedPlanDetails;
    
    let title = plan;
    let coins = '';
    let duration = '';
    
    switch (plan) {
      case 'Tester':
        coins = '100';
        duration = t('payment.7_days') || '7 days';
        break;
      case 'Monthly':
        coins = '1000';
        duration = t('payment.30_days') || '30 days';
        break;
      case 'Yearly':
        coins = '15000';
        duration = t('payment.365_days') || '365 days';
        break;
      case 'Addon':
        coins = '500';
        duration = t('payment.addon') || 'Add-on';
        break;
      default:
        coins = '0';
        duration = '';
    }
    
    return {
      title,
      coins,
      duration,
      expiry: endDate.toLocaleDateString(),
      price: price.toString()
    };
  };
  
  const planDetailsData = getPlanDetails();
  
  // Handle card number input with formatting
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    let formattedValue = '';
    
    for (let i = 0; i < value.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formattedValue += ' ';
      }
      formattedValue += value[i];
    }
    
    setCardNumber(formattedValue.slice(0, 19)); // 16 digits + 3 spaces
  };
  
  // Handle expiry date input with formatting
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    let formattedValue = '';
    
    if (value.length > 0) {
      formattedValue = value.slice(0, 2);
      if (value.length > 2) {
        formattedValue += '/' + value.slice(2, 4);
      }
    }
    
    setCardExpiry(formattedValue);
  };
  
  // Handle CVC input
  const handleCVCChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setCardCVC(value.slice(0, 3));
  };
  
  // Validate card details
  useEffect(() => {
    const isCardNumberValid = cardNumber.replace(/\s/g, '').length === 16;
    const isExpiryValid = cardExpiry.length === 5;
    const isCVCValid = cardCVC.length === 3;
    const isNameValid = cardHolderName.trim().length > 0;
    
    setCardValid(isCardNumberValid && isExpiryValid && isCVCValid && isNameValid);
  }, [cardNumber, cardExpiry, cardCVC, cardHolderName]);
  
  // Poll payment status
  const pollPaymentStatus = async (paymentId: string) => {
    try {
      const result = await paymentService.queryPaymentStatus(paymentId, null);
      
      // Check if result has data property
      if ('data' in result && result.data) {
        if (result.data.status === 'completed') {
          setPaymentSuccess(true);
          setShouldRefreshUserData(true);
          return true;
        } else if (result.data.status === 'failed' || result.data.status === 'cancelled') {
          setPaymentError(t('payment.failed') || 'Payment failed. Please try again.');
          setIsProcessing(false);
          return true;
        }
      } else if (!result.success) {
        // Handle error response
        setPaymentError(t('payment.failed') || 'Payment failed. Please try again.');
        setIsProcessing(false);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking payment status:', error);
      setPaymentError(t('payment.check_error') || 'Error checking payment status. Please check your transactions page.');
      setIsProcessing(false);
      return true;
    }
  };
  
  // Handle payment submission
  const handlePayNow = async () => {
    setIsProcessing(true);
    setPaymentError(null);
    
    try {
      // For card payments, validate card details
      if (selectedPaymentMethod === 'VISA' || selectedPaymentMethod === 'MASTERCARD') {
        if (!cardValid) {
          setPaymentError(t('payment.invalid_card') || 'Please enter valid card details');
          setIsProcessing(false);
          return;
        }
      }
      
      // Create payment intent
      const paymentData = {
        amount: finalPriceState,
        currency: 'PHP',
        paymentMethodType: selectedPaymentMethod,
        orderDescription: isAddon ? `Addon Purchase: ${plan}` : `Subscription Plan: ${plan}`,
        redirectUrl: `${window.location.origin}/payment/success`,
        notifyUrl: `${API_BASE_URL}/api/payment/notify`,
        ...(isAddon ? { addonId: plan } : { planId: plan })
      };
      
      const response = isAddon 
        ? await paymentService.createAddonPayment(plan, finalPriceState, 'PHP', selectedPaymentMethod, null)
        : await paymentService.createSubscriptionPayment(plan, finalPriceState, 'PHP', selectedPaymentMethod, null);
      
      if (response.success) {
        // For redirect methods like Alipay
        let paymentId: string | undefined;
        
        if ('data' in response && response.data) {
          if (response.data.paymentUrl || response.data.redirectUrl) {
            window.location.href = response.data.paymentUrl || response.data.redirectUrl;
            return;
          }
          
          // For card payments, poll status
          paymentId = response.data.paymentRequestId;
        }
        
        if (paymentId) {
          // Poll payment status every 2 seconds
          const pollInterval = setInterval(async () => {
            const isDone = await pollPaymentStatus(paymentId!);
            if (isDone) {
              clearInterval(pollInterval);
            }
          }, 2000);
          
          // Set a timeout to stop polling after 30 seconds
          setTimeout(() => {
            clearInterval(pollInterval);
            if (!paymentSuccess) {
              setPaymentError(t('payment.timeout') || 'Payment processing is taking longer than expected. Please check your transactions page.');
              setIsProcessing(false);
            }
          }, 30000);
        } else {
          setPaymentError(t('payment.no_id') || 'No payment ID received. Please try again.');
          setIsProcessing(false);
        }
      } else {
        // Handle different error response structures
        let errorMessage = 'Payment failed';
        if (typeof response === 'object') {
          if ('message' in response) {
            errorMessage = response.message as string;
          } else if ('error' in response) {
            errorMessage = response.error as string;
          }
        }
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      setPaymentError(error.message || t('payment.error') || 'An error occurred during payment processing');
      setIsProcessing(false);
    }
  };
  
  // If payment is successful, show success message
  if (paymentSuccess) {
    return (
      <Layout>
        <div className="max-w-md mx-auto mt-16 p-6 rounded-xl shadow-lg bg-white dark:bg-gray-800 border dark:border-gray-700">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            
            <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              {t('payment.success_title') || 'Payment Successful!'}
            </h2>
            
            <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {t('payment.success_message') || 'Your payment has been processed successfully. Thank you for your purchase!'}
            </p>
            
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {t('payment.redirecting', { seconds: countdown }) || `Redirecting to your transactions in ${countdown} seconds...`}
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto pt-16 pb-12"> {/* Added pt-16 for top padding */}
        <div className="px-4 sm:px-6 lg:px-8">
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className={`flex items-center text-sm font-medium mb-6 ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'}`}
          >
            <FiArrowLeft className="mr-2" />
            {t('payment.back') || 'Back'}
          </button>
          
          {/* Page title */}
          <h1 className={`text-2xl font-bold mb-8 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {t('payment.checkout') || 'Checkout'}
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Payment Methods & Form */}
            <div className="md:col-span-2 space-y-6">
              <div className={`rounded-xl p-6 ${
                darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
              } shadow-sm`}>
                <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {t('payment.method_title') || 'Payment Method'}
                </h2>
                
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <div 
                      key={method.id}
                      onClick={() => setSelectedPaymentMethod(method.id)}
                      className={`p-4 border rounded-lg cursor-pointer flex items-center ${
                        selectedPaymentMethod === method.id 
                          ? `border-blue-500 ${darkMode ? 'bg-blue-900/20' : 'bg-blue-50'}` 
                          : `${darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}`
                      }`}
                    >
                      <div className="mr-4">
                        {method.icon}
                      </div>
                      <div>
                        <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {method.name}
                        </div>
                        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {method.description}
                        </div>
                      </div>
                      {selectedPaymentMethod === method.id && (
                        <div className="ml-auto">
                          <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                            <FiCheck className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Test Card Information */}
                {(selectedPaymentMethod === 'VISA' || selectedPaymentMethod === 'MASTERCARD') && (
                  <div className={`mt-6 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <h3 className={`text-sm font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Test Card Information (Sandbox Mode)
                    </h3>
                    <div className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <p className="mb-1">• Visa: 4242 4242 4242 4242</p>
                      <p className="mb-1">• Mastercard: 5555 5555 5555 4444</p>
                      <p className="mb-1">• Expiry Date: Any future date (MM/YY)</p>
                      <p className="mb-1">• CVC: Any 3 digits</p>
                      <p className="mb-1">• Name: Any name</p>
                    </div>
                  </div>
                )}
                
                {/* Alipay Test Account Information */}
                {(selectedPaymentMethod === 'ALIPAY_HK' || selectedPaymentMethod === 'ALIPAY_CN') && (
                  <div className={`mt-6 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <h3 className={`text-sm font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Alipay Test Account (Sandbox Mode)
                    </h3>
                    <div className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <p className="mb-1">• Test Account: alipaytest@example.com</p>
                      <p className="mb-1">• Password: test123</p>
                      <p className="mt-2 text-amber-500">
                        <FiInfo className="inline-block mr-1" />
                        You will be redirected to Alipay's payment page to complete the transaction.
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Error Message */}
              {paymentError && (
                <div className="bg-red-100 border border-red-200 text-red-800 rounded-lg p-4 text-sm">
                  <div className="flex">
                    <FiInfo className="w-5 h-5 mr-2 text-red-500" />
                    <span>{paymentError}</span>
                  </div>
                </div>
              )}
              
              {/* Payment Button */}
              <button
                onClick={handlePayNow}
                disabled={isProcessing}
                className={`w-full py-3.5 rounded-lg font-medium flex justify-center items-center ${
                  isProcessing
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:opacity-90 transition-opacity'
                }`}
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-3"></div>
                    {t('payment.processing') || 'Processing...'}
                  </>
                ) : (
                  `${t('payment.pay') || 'Pay'} ${finalPriceState} PHP ${t('payment.now') || 'Now'}`
                )}
              </button>
            </div>
            
            {/* Order Summary */}
            <div className="md:col-span-1">
              <div className={`rounded-xl p-6 ${
                darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
              } shadow-sm sticky top-24`}>
                <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {t('payment.order_summary') || 'Order Summary'}
                </h2>
                
                <div className={`p-4 rounded-lg mb-4 ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                    {t('payment.plan') || 'Plan'}
                  </div>
                  <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {planDetailsData.title}
                  </div>
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('payment.coins') || 'Coins'}
                    </div>
                    <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {planDetailsData.coins}
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('payment.duration') || 'Duration'}
                    </div>
                    <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {planDetailsData.duration}
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('payment.expiry') || 'Expiry'}
                    </div>
                    <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {endDate.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-dashed pt-4 mb-2">
                  <div className="flex justify-between items-center mb-2">
                    <div className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('payment.original_price') || 'Original Price'}
                    </div>
                    <div className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {originalPrice} PHP
                    </div>
                  </div>
                  
                  {couponDiscount > 0 && (
                    <div className="flex justify-between items-center mb-2">
                      <div className={`text-green-500`}>
                        {t('payment.discount') || 'Discount'}
                      </div>
                      <div className={`text-green-500`}>
                        -{couponDiscount}%
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center mt-2 pt-2 border-t">
                    <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {t('payment.total') || 'Total'}
                    </div>
                    <div className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {finalPriceState} PHP
                    </div>
                  </div>
                </div>
                
                {appliedCouponState && (
                  <div className={`mt-4 p-3 rounded-lg bg-green-100 border border-green-200 text-green-800 text-sm`}>
                    <div className="flex items-center">
                      <FiCheck className="w-4 h-4 mr-2" />
                      <span>{t('payment.coupon_applied', {coupon: appliedCouponState.coupon_name}) || `Coupon "${appliedCouponState.coupon_name}" applied!`}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentPage;
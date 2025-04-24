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
import * as paymentService from '../services/paymentService';

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
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('card');
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
  
  // Payment methods
  const paymentMethods: PaymentMethod[] = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: <FiCreditCard className="w-6 h-6 text-blue-500" />,
      description: 'Pay using Visa, Mastercard, or American Express'
    },
    {
      id: 'alipay',
      name: 'Alipay HK',
      icon: <FiDollarSign className="w-6 h-6 text-blue-500" />,
      description: 'Pay with your Alipay Hong Kong account'
    },
    {
      id: 'wechat',
      name: 'WeChat Pay HK',
      icon: <FiDollarSign className="w-6 h-6 text-blue-500" />,
      description: 'Pay with your WeChat Pay Hong Kong'
    },
    {
      id: 'fps',
      name: 'FPS / PayMe',
      icon: <FiDollarSign className="w-6 h-6 text-blue-500" />,
      description: 'Pay via Faster Payment System or PayMe'
    }
  ];

  // Set dates and prices based on passed data or defaults
  useEffect(() => {
    if (!finalPrice) {
      const start = new Date();
      setStartDate(start);
      
      const end = new Date(start);
      if (plan === 'Tester') {
        end.setDate(end.getDate() + 15); // 15 days
      } else if (plan === 'Monthly') {
        end.setMonth(end.getMonth() + 1); // 1 month
      } else if (plan === 'Yearly') {
        end.setFullYear(end.getFullYear() + 1); // 1 year
      } else if (plan === 'Addon') {
        // Addon expires at the end of the current month
        end.setMonth(end.getMonth() + 1);
        end.setDate(0); // Last day of current month
      }
      setEndDate(end);
      
      // Clean price value
      const cleanPrice = String(price).replace(/[^0-9.]/g, '');
      setOriginalPrice(cleanPrice);
      setFinalPriceState(cleanPrice);
    }
  }, [plan, price, finalPrice]);

  // Handle payment success countdown
  useEffect(() => {
    if (paymentSuccess) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // Navigate to transactions page after countdown
            navigate('/transactions');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [paymentSuccess, navigate]);

  // Effect to refresh user data when payment is successful
  useEffect(() => {
    if (shouldRefreshUserData) {
      console.log('Refreshing user data after successful payment');
      refreshUserData();
      setShouldRefreshUserData(false);
    }
  }, [shouldRefreshUserData, refreshUserData]);

  // Get plan details
  const getPlanDetails = (): PlanDetails => {
    if (passedPlanDetails) {
      return passedPlanDetails;
    }
    
    if (plan === 'Tester') {
      return {
        title: 'Tester Plan',
        coins: '450 coins',
        duration: '15 Days',
        expiry: 'Coins will expire after 15 days',
        price: String(price)
      };
    } else if (plan === 'Monthly') {
      return {
        title: 'Monthly Plan',
        coins: '1380 coins',
        duration: '1 Month',
        expiry: 'Coins will expire after 1 month',
        price: String(price)
      };
    } else if (plan === 'Yearly') {
      return {
        title: 'Yearly Plan',
        coins: '1380 coins/month',
        duration: '12 Months',
        expiry: 'You will receive 1380 coins each month. These coins will expire at the end of each month.',
        price: String(price)
      };
    } else {
      return {
        title: 'Addon Pack',
        coins: '550 coins',
        duration: 'Until end of month',
        expiry: 'Coins will expire at end of the current month',
        price: String(price)
      };
    }
  };

  const planDetailsData = getPlanDetails();

  // Card validation functions
  const validateCardNumber = (number: string): boolean => {
    const cleaned = number.replace(/\D/g, '');
    return cleaned.length >= 13 && cleaned.length <= 19;
  };

  const validateCardExpiry = (expiry: string): boolean => {
    // Format should be MM/YY
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      return false;
    }
    
    const [month, year] = expiry.split('/');
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100; // Get last 2 digits of year
    const currentMonth = currentDate.getMonth() + 1; // Months are 0-indexed
    
    const expiryMonth = parseInt(month, 10);
    const expiryYear = parseInt(year, 10);
    
    // Check if month is valid (1-12)
    if (expiryMonth < 1 || expiryMonth > 12) {
      return false;
    }
    
    // Check if card is not expired
    return (expiryYear > currentYear) || 
           (expiryYear === currentYear && expiryMonth >= currentMonth);
  };

  const validateCVC = (cvc: string): boolean => {
    const cleaned = cvc.replace(/\D/g, '');
    return cleaned.length >= 3 && cleaned.length <= 4;
  };

  const formatCardNumber = (text: string): string => {
    const cleaned = text.replace(/\D/g, '');
    const groups = [];
    
    for (let i = 0; i < cleaned.length; i += 4) {
      groups.push(cleaned.substring(i, i + 4));
    }
    
    return groups.join(' ').substring(0, 19);
  };

  const formatExpiry = (text: string): string => {
    const cleaned = text.replace(/\D/g, '');
    
    if (cleaned.length < 3) {
      return cleaned;
    }
    
    let month = cleaned.substring(0, 2);
    let year = cleaned.substring(2, 4);
    
    // Adjust month if greater than 12
    if (parseInt(month, 10) > 12) {
      month = '12';
    }
    
    return `${month}/${year}`;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiry(e.target.value);
    setCardExpiry(formatted);
  };

  const handleCVCChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cvc = e.target.value.replace(/\D/g, '').substring(0, 4);
    setCardCVC(cvc);
  };

  // Update cardValid state when card details change
  useEffect(() => {
    const isCardNumberValid = validateCardNumber(cardNumber);
    const isExpiryValid = validateCardExpiry(cardExpiry);
    const isCVCValid = validateCVC(cardCVC);
    const isNameValid = cardHolderName.trim().length > 0;
    
    setCardValid(isCardNumberValid && isExpiryValid && isCVCValid && isNameValid);
  }, [cardNumber, cardExpiry, cardCVC, cardHolderName]);

  // Function to start countdown after successful payment
  const startCountdown = () => {
    setCountdown(5);
    const timer = setInterval(() => {
      setCountdown((prevCount) => {
        if (prevCount <= 1) {
          clearInterval(timer);
          navigate('/dashboard');
          return 0;
        }
        return prevCount - 1;
      });
    }, 1000);
  };

  const handlePayNow = async () => {
    try {
      setIsProcessing(true);
      setPaymentError(null);
      
      // Check if card is valid
      if (!cardValid) {
        setPaymentError('Please enter valid card details');
        setIsProcessing(false);
        return;
      }
      
      // Get finalized amount
      const amount = Number(finalPriceState);
      console.log('Processing payment for amount:', amount, 'Plan:', plan, 'User ID:', uid);
      
      // Create payment intent
      console.log('Creating payment intent...');
      const intent = await paymentService.createPaymentIntent(amount);
      setPaymentIntent(intent);
      console.log('Payment intent created:', intent);
      
      // Simulate payment processing
      console.log('Processing payment...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check payment status
      console.log('Checking payment status...');
      const status = await paymentService.getTransferStatus(intent.id);
      console.log('Payment status:', status);
      
      if (status.status === 'CONFIRMED') {
        // Process subscription/purchase
        const couponId = appliedCouponState?.coupon_id || '';
        console.log('Confirming subscription purchase with coupon ID:', couponId || 'none');
        
        const result = await paymentService.confirmSubscriptionPurchase(
          uid,
          plan,
          amount,
          couponId,
          intent.id
        );
        
        if (result.success) {
          // Don't call refreshUserData directly, set flag to trigger the effect
          console.log('Payment successful, will refresh user data');
          setShouldRefreshUserData(true);
          setPaymentSuccess(true);
          startCountdown();
        } else {
          console.error('Payment failed with error:', result.message);
          setPaymentError(result.message || 'Payment failed');
        }
      } else {
        console.error('Payment processing failed, status:', status.status);
        setPaymentError('Payment processing failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentError('An error occurred during payment processing');
    } finally {
      setIsProcessing(false);
    }
  };

  // Render card form
  const renderCardForm = () => (
    <div className={`mt-4 space-y-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
      <div>
        <label className="block text-sm font-medium mb-1">Card Number</label>
        <input
          type="text"
          value={cardNumber}
          onChange={handleCardNumberChange}
          placeholder="•••• •••• •••• ••••"
          className={`w-full p-3 rounded-lg border ${
            darkMode 
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
          } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
          maxLength={19}
        />
      </div>
      
      <div className="flex space-x-4">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Expiration Date</label>
          <input
            type="text"
            value={cardExpiry}
            onChange={handleExpiryChange}
            placeholder="MM/YY"
            className={`w-full p-3 rounded-lg border ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
            } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            maxLength={5}
          />
        </div>
        <div className="w-1/3">
          <label className="block text-sm font-medium mb-1">CVC</label>
          <input
            type="text"
            value={cardCVC}
            onChange={handleCVCChange}
            placeholder="CVC"
            className={`w-full p-3 rounded-lg border ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
            } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            maxLength={4}
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Card Holder Name</label>
        <input
          type="text"
          value={cardHolderName}
          onChange={(e) => setCardHolderName(e.target.value)}
          placeholder="Name on card"
          className={`w-full p-3 rounded-lg border ${
            darkMode 
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
          } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
        />
      </div>
      
      <div className={`flex items-center text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        <FiLock className="w-4 h-4 mr-1" />
        <span>Your payment information is securely processed</span>
      </div>
    </div>
  );

  // Success page
  if (paymentSuccess) {
    return (
      <Layout>
        <div className="max-w-lg mx-auto py-12 px-4">
          <div className={`text-center p-8 rounded-2xl ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          } shadow-lg`}>
            <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-green-100 mb-6">
              <FiCheck className="w-8 h-8 text-green-500" />
            </div>
            
            <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Payment Successful!
            </h2>
            
            <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Your {plan} has been activated successfully. Thank you for your purchase!
            </p>
            
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Redirecting to your transactions in {countdown} seconds...
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center mb-8">
          <button 
            onClick={() => navigate(-1)}
            className={`p-2 rounded-full mr-3 ${
              darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            <FiArrowLeft className={`w-5 h-5 ${darkMode ? 'text-white' : 'text-gray-700'}`} />
          </button>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Payment
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Payment Methods & Form */}
          <div className="md:col-span-2 space-y-6">
            <div className={`rounded-xl p-6 ${
              darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            } shadow-sm`}>
              <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Payment Method
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
              
              {selectedPaymentMethod === 'card' && renderCardForm()}
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
              disabled={isProcessing || !cardValid}
              className={`w-full py-3.5 rounded-lg font-medium flex justify-center items-center ${
                isProcessing || !cardValid
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:opacity-90 transition-opacity'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-3"></div>
                  Processing...
                </>
              ) : (
                `Pay ${finalPriceState} HKD Now`
              )}
            </button>
          </div>
          
          {/* Order Summary */}
          <div className="md:col-span-1">
            <div className={`rounded-xl p-6 ${
              darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            } shadow-sm sticky top-24`}>
              <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Order Summary
              </h2>
              
              <div className={`p-4 rounded-lg mb-4 ${
                darkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                  Plan
                </div>
                <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {planDetailsData.title}
                </div>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Coins
                  </div>
                  <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {planDetailsData.coins}
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Duration
                  </div>
                  <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {planDetailsData.duration}
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Expiry
                  </div>
                  <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {endDate.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}
                  </div>
                </div>
              </div>
              
              <div className="border-t border-dashed pt-4 mb-2">
                <div className="flex justify-between items-center mb-2">
                  <div className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Original Price
                  </div>
                  <div className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {originalPrice} HKD
                  </div>
                </div>
                
                {couponDiscount > 0 && (
                  <div className="flex justify-between items-center mb-2">
                    <div className={`text-green-500`}>
                      Discount
                    </div>
                    <div className={`text-green-500`}>
                      -{couponDiscount}%
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between items-center mt-2 pt-2 border-t">
                  <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Total
                  </div>
                  <div className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {finalPriceState} HKD
                  </div>
                </div>
              </div>
              
              {appliedCouponState && (
                <div className={`mt-4 p-3 rounded-lg bg-green-100 border border-green-200 text-green-800 text-sm`}>
                  <div className="flex items-center">
                    <FiCheck className="w-4 h-4 mr-2" />
                    <span>Coupon "{appliedCouponState.coupon_name}" applied!</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentPage; 
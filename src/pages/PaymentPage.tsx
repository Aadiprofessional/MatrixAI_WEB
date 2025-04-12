import React, { useState, useContext, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  FiCreditCard, 
  FiDollarSign, 
  FiShield, 
  FiAlertCircle, 
  FiCheckCircle,
  FiClock,
  FiArrowLeft,
  FiRefreshCw
} from 'react-icons/fi';
import { Layout } from '../components';
import { ThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

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

const PaymentPage: React.FC = () => {
  const { darkMode } = useContext(ThemeContext);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Extract plan info from location state
  const planData = location.state || {};
  const { plan = 'Unknown', price = '0', isAddon = false } = planData;
  
  // Payment state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVC, setCardCVC] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [cardValid, setCardValid] = useState(false);
  
  // Processing state
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [countdown, setCountdown] = useState(10);
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [originalPrice, setOriginalPrice] = useState(price);
  const [finalPrice, setFinalPrice] = useState(price);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  
  // Date state
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  
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

  // Set dates based on plan
  useEffect(() => {
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
    setFinalPrice(cleanPrice);
  }, [plan, price]);

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

  // Get plan details
  const getPlanDetails = (): PlanDetails => {
    if (plan === 'Tester') {
      return {
        title: 'Tester Plan',
        coins: '450 coins',
        duration: '15 Days',
        expiry: 'Coins will expire after 15 days',
        price
      };
    } else if (plan === 'Monthly') {
      return {
        title: 'Monthly Plan',
        coins: '1380 coins',
        duration: '1 Month',
        expiry: 'Coins will expire after 1 month',
        price
      };
    } else if (plan === 'Yearly') {
      return {
        title: 'Yearly Plan',
        coins: '1380 coins/month',
        duration: '12 Months',
        expiry: 'You will receive 1380 coins each month. These coins will expire at the end of each month.',
        price
      };
    } else {
      return {
        title: 'Addon Pack',
        coins: '550 coins',
        duration: 'Until end of month',
        expiry: 'Coins will expire at end of the current month',
        price
      };
    }
  };

  const planDetails = getPlanDetails();

  // Card validation functions
  const validateCardNumber = (number: string) => {
    const cleaned = number.replace(/\D/g, '');
    return cleaned.length >= 13 && cleaned.length <= 19;
  };

  const validateCardExpiry = (expiry: string) => {
    const regex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
    if (!regex.test(expiry)) return false;

    const [month, year] = expiry.split('/');
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;
    
    const expiryYear = parseInt(year, 10);
    const expiryMonth = parseInt(month, 10);

    return !(expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth));
  };

  const validateCVC = (cvc: string) => {
    return /^[0-9]{3,4}$/.test(cvc);
  };

  // Format card inputs
  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    let formatted = '';
    
    for (let i = 0; i < cleaned.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formatted += ' ';
      }
      formatted += cleaned[i];
    }
    
    return formatted;
  };

  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    
    if (cleaned.length >= 3) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    } else if (cleaned.length === 2) {
      return `${cleaned}/`;
    }
    
    return cleaned;
  };

  // Handle input changes
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted.slice(0, 19));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiry(e.target.value);
    setCardExpiry(formatted.slice(0, 5));
  };

  const handleCVCChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, '');
    setCardCVC(cleaned.slice(0, 4));
  };

  // Validate all fields
  useEffect(() => {
    const isCardNumberValid = validateCardNumber(cardNumber);
    const isExpiryValid = validateCardExpiry(cardExpiry);
    const isCVCValid = validateCVC(cardCVC);
    const isNameValid = cardHolderName.trim().length > 0;
    
    setCardValid(isCardNumberValid && isExpiryValid && isCVCValid && isNameValid);
  }, [cardNumber, cardExpiry, cardCVC, cardHolderName]);

  // Handle payment submission
  const handlePayNow = () => {
    if (!selectedPaymentMethod) {
      alert('Please select a payment method');
      return;
    }

    if (selectedPaymentMethod === 'card' && !cardValid) {
      alert('Please enter valid card details');
      return;
    }

    // Simulate payment processing
    setProcessing(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setProcessing(false);
      setPaymentSuccess(true);
    }, 2000);
  };

  // Apply coupon
  const applyCoupon = () => {
    if (!couponCode) {
      alert('Please enter a coupon code');
      return;
    }

    // Simulate coupon application (10% discount)
    setDiscount(10);
    const discountAmount = parseFloat(originalPrice) * 0.1;
    const discountedPrice = parseFloat(originalPrice) - discountAmount;
    setFinalPrice(discountedPrice.toFixed(2));
    setAppliedCoupon({ id: '123', name: couponCode });
    setCouponCode('');
  };

  // Remove coupon
  const removeCoupon = () => {
    setDiscount(0);
    setFinalPrice(originalPrice);
    setAppliedCoupon(null);
  };

  return (
    <Layout>
      <div className={`py-8 px-4 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="max-w-4xl mx-auto">
          {/* Payment flow header */}
          <div className="mb-8">
            <button 
              onClick={() => navigate(-1)}
              className={`flex items-center text-sm ${
                darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              } mb-4`}
            >
              <FiArrowLeft className="mr-2" /> Back to Plans
            </button>
            <h1 className="text-2xl font-bold mb-2">
              {paymentSuccess ? 'Payment Successful!' : 'Complete Your Purchase'}
            </h1>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
              {paymentSuccess 
                ? `Redirecting in ${countdown} seconds...` 
                : `Purchase ${planDetails.title} and start using MatrixAI today!`}
            </p>
          </div>

          {paymentSuccess ? (
            // Success State
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`rounded-xl p-8 text-center ${
                darkMode 
                  ? 'bg-gray-800/50 border border-gray-700/50' 
                  : 'bg-white border border-gray-100'
              }`}
            >
              <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <FiCheckCircle className="h-10 w-10 text-green-500" />
              </div>
              
              <h2 className="text-xl font-bold mb-2">Payment Completed</h2>
              <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Your payment of ${finalPrice} HKD for {planDetails.title} was processed successfully!
              </p>
              
              <div className={`p-4 rounded-lg mb-6 ${
                darkMode ? 'bg-gray-700/50' : 'bg-gray-100'
              }`}>
                <div className="flex justify-between mb-2">
                  <span>Plan:</span>
                  <span>{planDetails.title}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Coins:</span>
                  <span>{planDetails.coins}</span>
                </div>
                <div className="flex justify-between">
                  <span>Validity:</span>
                  <span>{startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}</span>
                </div>
              </div>
              
              <button
                onClick={() => navigate('/transactions')}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg"
              >
                Go to Transactions
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Payment methods */}
              <div className="md:col-span-2">
                <div className={`rounded-xl mb-6 ${
                  darkMode 
                    ? 'bg-gray-800/50 border border-gray-700/50' 
                    : 'bg-white border border-gray-100'
                }`}>
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold">Payment Method</h2>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-4">
                      {paymentMethods.map((method) => (
                        <div 
                          key={method.id}
                          onClick={() => setSelectedPaymentMethod(method.id)}
                          className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                            selectedPaymentMethod === method.id
                              ? (darkMode ? 'border-blue-500 bg-blue-900/10' : 'border-blue-500 bg-blue-50')
                              : (darkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300')
                          }`}
                        >
                          <div className="flex items-center">
                            <div className="mr-4">
                              {method.icon}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium">{method.name}</h3>
                              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {method.description}
                              </p>
                            </div>
                            <div className={`h-5 w-5 rounded-full border ${
                              selectedPaymentMethod === method.id
                                ? (darkMode ? 'border-blue-500 bg-blue-500' : 'border-blue-500 bg-blue-500')
                                : (darkMode ? 'border-gray-600' : 'border-gray-300')
                            }`}>
                              {selectedPaymentMethod === method.id && (
                                <div className="h-3 w-3 rounded-full bg-white mx-auto my-1"></div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Card Information - Only shown when card payment is selected */}
                    {selectedPaymentMethod === 'card' && (
                      <div className="mt-6 space-y-4">
                        <h3 className="text-lg font-medium">Card Information</h3>
                        
                        <div>
                          <label className={`block text-sm font-medium mb-1 ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            Card Holder Name
                          </label>
                          <input
                            type="text"
                            value={cardHolderName}
                            onChange={(e) => setCardHolderName(e.target.value)}
                            placeholder="Name on card"
                            className={`w-full p-3 rounded-lg ${
                              darkMode 
                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                            } border focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                          />
                        </div>
                        
                        <div>
                          <label className={`block text-sm font-medium mb-1 ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            Card Number
                          </label>
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={handleCardNumberChange}
                            placeholder="1234 5678 9012 3456"
                            className={`w-full p-3 rounded-lg ${
                              darkMode 
                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                            } border focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={`block text-sm font-medium mb-1 ${
                              darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Expiration Date
                            </label>
                            <input
                              type="text"
                              value={cardExpiry}
                              onChange={handleExpiryChange}
                              placeholder="MM/YY"
                              className={`w-full p-3 rounded-lg ${
                                darkMode 
                                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                              } border focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                            />
                          </div>
                          <div>
                            <label className={`block text-sm font-medium mb-1 ${
                              darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              CVC
                            </label>
                            <input
                              type="text"
                              value={cardCVC}
                              onChange={handleCVCChange}
                              placeholder="123"
                              className={`w-full p-3 rounded-lg ${
                                darkMode 
                                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                              } border focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                            />
                          </div>
                        </div>
                        
                        <div className="flex items-center pt-4">
                          <FiShield className={`h-5 w-5 mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Your payment info is secured. We use secure transmission and encrypted storage.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Coupon Code */}
                <div className={`rounded-xl mb-6 ${
                  darkMode 
                    ? 'bg-gray-800/50 border border-gray-700/50' 
                    : 'bg-white border border-gray-100'
                }`}>
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold">Discount Code</h2>
                  </div>
                  
                  <div className="p-6">
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Coupon Applied: {appliedCoupon.name}</p>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            You're saving {discount}% on your purchase
                          </p>
                        </div>
                        <button 
                          onClick={removeCoupon}
                          className={`text-sm ${darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="flex">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          placeholder="Enter discount code"
                          className={`flex-1 p-3 rounded-l-lg ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                          } border focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                        />
                        <button
                          onClick={applyCoupon}
                          className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-r-lg"
                        >
                          Apply
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Order Summary */}
              <div className="md:col-span-1">
                <div className={`rounded-xl sticky top-8 ${
                  darkMode 
                    ? 'bg-gray-800/50 border border-gray-700/50' 
                    : 'bg-white border border-gray-100'
                }`}>
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold">Order Summary</h2>
                  </div>
                  
                  <div className="p-6">
                    <div className="mb-4">
                      <h3 className="font-medium mb-2">{planDetails.title}</h3>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>
                        {planDetails.coins}
                      </p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {planDetails.expiry}
                      </p>
                    </div>
                    
                    <div className={`p-3 rounded-lg mb-6 ${
                      darkMode ? 'bg-gray-700/50' : 'bg-gray-100'
                    }`}>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Subtotal</span>
                        <span>${originalPrice} HKD</span>
                      </div>
                      
                      {discount > 0 && (
                        <div className="flex justify-between mb-2 text-green-500">
                          <span className="text-sm">Discount ({discount}%)</span>
                          <span>-${(parseFloat(originalPrice) - parseFloat(finalPrice)).toFixed(2)} HKD</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-600 font-bold">
                        <span>Total</span>
                        <span>${finalPrice} HKD</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={handlePayNow}
                      disabled={processing}
                      className={`w-full py-3 rounded-lg font-medium text-white transition-colors ${
                        processing 
                          ? 'bg-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90'
                      }`}
                    >
                      {processing ? (
                        <span className="flex items-center justify-center">
                          <FiRefreshCw className="animate-spin mr-2" />
                          Processing...
                        </span>
                      ) : (
                        `Pay ${finalPrice} HKD Now`
                      )}
                    </button>
                    
                    <div className="flex items-center justify-center mt-4">
                      <FiShield className={`h-4 w-4 mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Secure Payment
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PaymentPage; 
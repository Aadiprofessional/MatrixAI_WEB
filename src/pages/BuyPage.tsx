import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { ThemeContext } from '../context/ThemeContext';
import { FiInfo, FiArrowLeft, FiCheck, FiPackage } from 'react-icons/fi';
import { Layout } from '../components';
import { motion } from 'framer-motion';

// Define coupon interface
interface Coupon {
  coupon_name: string;
  description: string;
  coupon_amount: number;
}

const BuyPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { darkMode } = useContext(ThemeContext);
  const { user } = useAuth();
  const { userData } = useUser();
  
  // Always set plan to Addon since this is specifically for addon purchases
  const uid = user?.id;
  const plan = 'Addon';
  const price = '50 HKD';
  
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [suggestedCoupons, setSuggestedCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [finalPrice, setFinalPrice] = useState(price);
  const [originalPrice, setOriginalPrice] = useState(price);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  useEffect(() => {
    // Set end date for addon (end of current month)
    const start = new Date();
    setStartDate(start);
    
    const end = new Date(start);
    // Addon expires at the end of the current month
    end.setMonth(end.getMonth() + 1);
    end.setDate(0); // Last day of current month
    setEndDate(end);

    // Clean and set price values
    // Remove HKD from price string to get number
    const cleanPrice = typeof price === 'string' ? price.replace(/[^0-9.]/g, '') : price;
    console.log('Original price:', price);
    console.log('Cleaned price:', cleanPrice);
    setOriginalPrice(cleanPrice);
    setFinalPrice(cleanPrice);

    // Fetch suggested coupons
    fetchCoupons();
  }, []);

  const getPlanDetails = () => {
    return {
      title: 'Addon Pack',
      coins: '550 coins',
      duration: 'Until end of month',
      expiry: 'Coins will expire at end of the current month',
      price: price
    };
  };

  const planDetails = getPlanDetails();

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://main-matrixai-server-lujmidrakh.cn-hangzhou.fcapp.run/getCoupon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uid: uid }),
      });

      const result = await response.json();
      if (result.success) {
        setSuggestedCoupons(result.data);
      } else {
        console.error('Failed to fetch coupons');
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyCoupon = (coupon: Coupon | null = null) => {
    const codeToApply = coupon ? coupon.coupon_name : couponCode;
    
    // Find the coupon in the suggested coupons
    const selectedCoupon = coupon || suggestedCoupons.find(c => c.coupon_name === codeToApply);
    
    if (!selectedCoupon) {
      console.error('Invalid Coupon', 'Please enter a valid coupon code');
      return;
    }

    // Check if coupon is already applied
    if (appliedCoupon && appliedCoupon.coupon_name === selectedCoupon.coupon_name) {
      console.log('Already Applied', 'This coupon is already applied');
      return;
    }

    // Apply discount
    const discountAmount = selectedCoupon.coupon_amount;
    setDiscount(discountAmount);
    
    // Calculate final price - ensure we're working with numbers
    const originalPriceNum = parseFloat(originalPrice);
    const discountedPrice = originalPriceNum * (1 - discountAmount / 100);
    const finalPriceValue = discountedPrice.toFixed(0);
    console.log('Discounted price calculation:', originalPriceNum, discountAmount, finalPriceValue);
    setFinalPrice(finalPriceValue);
    
    // Set applied coupon
    setAppliedCoupon(selectedCoupon);
    
    // If coupon was manually entered, clear the input
    if (!coupon) setCouponCode('');
  };

  const removeCoupon = () => {
    setDiscount(0);
    setFinalPrice(originalPrice);
    setAppliedCoupon(null);
  };

  const handleConfirm = () => {
    // Format dates as strings to avoid serialization issues
    const formattedStartDate = startDate.toISOString();
    const formattedEndDate = endDate.toISOString();
    
    // Navigate to payment screen with necessary details
    navigate('/payment', {
      state: {
        uid: uid,
        plan: plan,
        planDetails: planDetails,
        finalPrice: finalPrice,
        originalPrice: originalPrice,
        discount: discount,
        appliedCoupon: appliedCoupon,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        isAddon: true
      }
    });
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <button 
            onClick={() => navigate(-1)} 
            className={`mr-4 p-2 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            <FiArrowLeft className={`w-5 h-5 ${darkMode ? 'text-white' : 'text-gray-700'}`} />
          </button>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Buy Additional Coins
          </h1>
        </div>
        
        {/* Addon Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`mb-8 rounded-xl overflow-hidden ${
            darkMode ? 'bg-gradient-to-br from-purple-800/30 to-blue-900/30 backdrop-blur-sm border border-purple-700/50' : 'bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-100'
          } shadow-md p-6`}
        >
          <div className="flex items-center mb-4">
            <div className={`p-3 rounded-lg mr-4 ${
              darkMode ? 'bg-purple-900/50 text-purple-400' : 'bg-purple-100 text-purple-600'
            }`}>
              <FiPackage className="h-6 w-6" />
            </div>
            <div>
              <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Addon Pack
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Expires at month end
              </p>
            </div>
          </div>
          
          <div className="flex items-baseline mb-4">
            <span className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {parseInt(finalPrice as string)} 
            </span>
            <span className={`ml-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              HKD
            </span>
          </div>
          
          <div className={`flex items-center mb-4 p-3 rounded-lg ${
            darkMode ? 'bg-gray-700/50' : 'bg-gray-100'
          }`}>
            <img 
              src="https://via.placeholder.com/24?text=$" 
              alt="Coin" 
              className="w-6 h-6 mr-2" 
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/24?text=$';
                e.currentTarget.onerror = null;
              }}
            />
            <span className={`text-xl font-bold ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
              550
            </span>
          </div>

          <p className={`mb-5 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            These coins will be added to your existing balance and expire at the end of this month.
          </p>
        </motion.div>

        {/* Coupon Section */}
        <div className={`rounded-xl overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'} mb-8`}>
          <div className="p-6">
            <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Apply Coupon
            </h2>
            
            <div className="flex mb-4">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Enter coupon code"
                className={`flex-grow p-2.5 rounded-l-lg border-r-0 ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                disabled={appliedCoupon !== null}
              />
              <button
                onClick={() => applyCoupon()}
                disabled={!couponCode || appliedCoupon !== null}
                className={`px-4 py-2.5 rounded-r-lg font-medium ${
                  !couponCode || appliedCoupon !== null
                    ? 'bg-gray-400 text-gray-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Apply
              </button>
            </div>
            
            {appliedCoupon && (
              <div className={`flex justify-between items-center p-3 mb-4 rounded-lg bg-green-100 border border-green-200 text-green-800`}>
                <div className="flex items-center">
                  <FiCheck className="w-5 h-5 mr-2" />
                  <span>Coupon "{appliedCoupon.coupon_name}" applied successfully!</span>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-sm text-green-700 hover:text-green-900 underline"
                >
                  Remove
                </button>
              </div>
            )}
            
            {/* Suggested Coupons */}
            {suggestedCoupons.length > 0 && (
              <div>
                <h3 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Available Coupons for You
                </h3>
                <div className="space-y-2">
                  {suggestedCoupons.map((coupon, index) => (
                    <div key={index} className={`flex justify-between items-center p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <div>
                        <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                          {coupon.coupon_name}
                        </div>
                        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {coupon.description}
                        </div>
                      </div>
                      <button
                        className={`px-3 py-1.5 rounded text-white text-sm font-medium ${
                          appliedCoupon && appliedCoupon.coupon_name === coupon.coupon_name 
                            ? 'bg-green-500' 
                            : 'bg-blue-500 hover:bg-blue-600'
                        }`}
                        onClick={() => appliedCoupon && appliedCoupon.coupon_name === coupon.coupon_name 
                          ? removeCoupon() 
                          : applyCoupon(coupon)}
                      >
                        {appliedCoupon && appliedCoupon.coupon_name === coupon.coupon_name ? 'Applied' : 'Apply'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Price Section */}
        <div className={`rounded-xl p-6 mb-8 ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex justify-between items-center mb-3">
            <div className={`text-base ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Original Price</div>
            <div className={`text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {originalPrice} HKD
            </div>
          </div>
          
          {discount > 0 && (
            <div className="flex justify-between items-center mb-3">
              <div className={`text-base ${darkMode ? 'text-green-400' : 'text-green-600'}`}>Discount</div>
              <div className={`text-base ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                -{discount}%
              </div>
            </div>
          )}
          
          <div className="flex justify-between items-center pt-3 border-t border-dashed mt-3 mb-6">
            <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Total Price</div>
            <div className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {finalPrice} HKD
            </div>
          </div>
          
          <button
            onClick={handleConfirm}
            disabled={processing}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-500 to-blue-600 text-white font-medium hover:opacity-90 transition-opacity flex justify-center items-center"
          >
            {processing ? 'Processing...' : 'Proceed to Payment'}
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default BuyPage; 
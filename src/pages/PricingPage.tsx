import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiCheck, FiStar, FiZap, FiTrendingUp, FiPackage, FiMic, FiImage, FiVideo, FiMessageSquare, FiEdit3, FiArrowRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import HomeNavbar from '../components/HomeNavbar';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

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

interface ServiceInfo {
  type: string;
  icon: React.ReactNode;
  cost: string;
  unit: string;
  color: string;
  bgColor: string;
}

const PricingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string>('monthly');

  // Pricing plans data from ChargeModal.tsx
  const pricingPlans: PricingPlan[] = [
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
      bgGradient: 'from-blue-600 to-cyan-600'
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
      bgGradient: 'from-purple-600 to-pink-600'
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
      bgGradient: 'from-green-600 to-emerald-600'
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
      bgGradient: 'from-amber-600 to-orange-600'
    }
  ];

  // AI services pricing info from ChargeModal.tsx
  const aiServicesInfo: ServiceInfo[] = [
    {
      type: 'AI Chat',
      icon: <FiMessageSquare className="w-5 h-5" />,
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
      icon: <FiEdit3 className="w-5 h-5" />,
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

  const handleSubscribe = (plan: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Navigate to payment page with plan details
    navigate('/payment', { 
      state: { 
        uid: user.id,
        plan: plan,
        price: plan === 'Tester' ? '50 HKD' : plan === 'Monthly' ? '138 HKD' : plan === 'Yearly' ? '1490 HKD' : '50 HKD',
        isAddon: plan === 'Addon'
      } 
    });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background video with overlay */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute min-w-full min-h-full object-cover"
          style={{ filter: 'brightness(0.3) contrast(1.2)' }}
        >
          <source src="/videos/matrix-bg.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/90 backdrop-blur-md"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <HomeNavbar />

        <div className="container mx-auto px-4 pt-32 pb-20">
          {/* Hero Section */}
          <div className="text-center mb-16 backdrop-blur-md bg-gray-950/60 border border-gray-800 rounded-xl p-10 max-w-4xl mx-auto">
            <motion.h1 
              className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-600"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Simple, Transparent Pricing
            </motion.h1>
            <motion.p 
              className="text-xl text-gray-300 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              Choose the plan that works best for you. All plans include access to our full suite of AI tools.
            </motion.p>
          </div>

          {/* Pricing Cards */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {pricingPlans.map((plan, index) => (
              <motion.div 
                key={plan.id}
                className={`relative rounded-2xl backdrop-blur-md bg-gray-950 border border-gray-800 overflow-hidden transition-all duration-300 hover:transform hover:scale-105 hover:shadow-xl hover:shadow-${plan.color}-500/20 flex flex-col h-[550px]`}
                whileHover={{ y: -5 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-bl-lg text-sm font-medium z-10">
                    Most Popular
                  </div>
                )}
                
                {/* Discount badge */}
                {plan.discount && (
                  <div className="absolute top-0 left-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-1 rounded-br-lg text-sm font-medium z-10">
                    {plan.discount}
                  </div>
                )}
                
                {/* Header */}
                <div className={`p-6 bg-gradient-to-r ${plan.bgGradient} h-[140px] flex flex-col justify-center`}>
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-black/30 rounded-lg mr-4">
                      {plan.icon}
                    </div>
                    <h3 className="text-2xl font-bold">{plan.name}</h3>
                  </div>
                  
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="ml-1 text-lg opacity-80">{plan.currency}</span>
                    {plan.period && (
                      <span className="ml-1 text-sm opacity-70">{plan.period}</span>
                    )}
                  </div>
                  
                  {plan.originalPrice && (
                    <div className="mt-1">
                      <span className="text-sm line-through opacity-70">{plan.originalPrice} {plan.currency}</span>
                    </div>
                  )}
                </div>
                
                {/* Coins */}
                <div className="p-6 border-b border-gray-800 bg-gray-900">
                  <div className="flex items-center">
                    <div className="p-2 bg-amber-500/10 rounded-lg mr-3">
                      <FiZap className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <span className="text-2xl font-bold text-amber-400">{plan.coins}</span>
                      <span className="ml-2 text-gray-300">coins</span>
                    </div>
                  </div>
                </div>
                
                {/* Features */}
                <div className="p-6 flex-grow flex flex-col justify-between">
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <FiCheck className="w-5 h-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="mt-6 pt-4">
                    <button
                      onClick={() => handleSubscribe(plan.name)}
                      className={`w-full py-3 rounded-lg bg-gradient-to-r ${plan.bgGradient} text-white font-medium hover:opacity-90 transition-opacity flex justify-center items-center`}
                    >
                      {user ? 'Subscribe Now' : 'Login to Join'}
                      <FiArrowRight className="ml-2" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Usage Pricing */}
          <motion.div 
            className="mb-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-600">AI Services Pricing</h2>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Our pricing is based on a coin system. Different AI services consume different amounts of coins.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {aiServicesInfo.map((service, index) => (
                <motion.div 
                  key={index}
                  className="backdrop-blur-md bg-gray-950 border border-gray-800 rounded-xl p-6 transition-all duration-300 hover:border-gray-600 h-[140px] flex flex-col justify-between"
                  whileHover={{ y: -5 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                >
                  <div className="flex items-center mb-4">
                    <div className={`p-3 rounded-lg mr-3 ${service.bgColor.replace('bg-', 'bg-').replace('dark:bg-', 'bg-')} bg-opacity-20`}>
                      <div className={`w-5 h-5 ${service.color}`}>
                        {service.icon}
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold">{service.type}</h3>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-gray-400">{service.unit}</div>
                    <div className="text-lg font-bold text-white">{service.cost}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* FAQ Section */}
          <motion.div 
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">Frequently Asked Questions</h2>
              <p className="text-gray-300">Have questions about our pricing? Find answers to common questions below.</p>
            </div>
            
            <div className="space-y-6">
              <div className="backdrop-blur-md bg-gray-950 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors duration-300">
                <h3 className="text-xl font-semibold mb-2 text-white">How does the coin system work?</h3>
                <p className="text-gray-300">Our platform uses a coin-based system where different AI services consume different amounts of coins. You purchase a plan that gives you a certain number of coins, which you can then spend on various AI services.</p>
              </div>
              
              <div className="backdrop-blur-md bg-gray-950 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors duration-300">
                <h3 className="text-xl font-semibold mb-2 text-white">Do coins expire?</h3>
                <p className="text-gray-300">Yes, coins from monthly plans expire at the end of each billing cycle. Coins from the Tester plan expire after 15 days. Addon pack coins expire at the end of the current month.</p>
              </div>
              
              <div className="backdrop-blur-md bg-gray-950 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors duration-300">
                <h3 className="text-xl font-semibold mb-2 text-white">Can I upgrade my plan?</h3>
                <p className="text-gray-300">Yes, you can upgrade your plan at any time. When you upgrade, we'll prorate the remaining value of your current plan and apply it to your new plan.</p>
              </div>
              
              <div className="backdrop-blur-md bg-gray-950 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors duration-300">
                <h3 className="text-xl font-semibold mb-2 text-white">What payment methods do you accept?</h3>
                <p className="text-gray-300">We accept major credit cards (Visa, Mastercard), as well as Alipay HK and Alipay China for payments.</p>
              </div>
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div 
            className="text-center mt-20 backdrop-blur-md bg-gray-950/80 border border-gray-800 rounded-xl p-10 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <h2 className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-600">Ready to get started?</h2>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                to="/signup" 
                className="px-8 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-700 text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center"
              >
                Sign Up Now
                <FiArrowRight className="ml-2" />
              </Link>
              <Link 
                to="/contact" 
                className="px-8 py-3 rounded-lg border border-gray-600 text-white font-medium hover:bg-gray-800 transition-colors flex items-center justify-center"
              >
                Contact Sales
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
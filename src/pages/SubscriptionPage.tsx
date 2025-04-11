import React, { useState, useContext } from 'react';
import { FiCheck, FiStar, FiArrowLeft } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components';
import { ThemeContext } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';

const SubscriptionPage: React.FC = () => {
  const { darkMode } = useContext(ThemeContext);
  const { userData, isPro } = useUser();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

  // Mock function to handle subscription purchase
  const handleSubscribe = () => {
    alert('This would integrate with a payment processor in a real application.');
    // After successful payment, refresh user data and redirect
    navigate('/dashboard');
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-center">
          <Link to="/dashboard" className="mr-4 text-blue-500 hover:text-blue-600">
            <FiArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Upgrade to MatrixAI Pro
          </h1>
        </div>

        {/* Hero Section */}
        <div className="relative rounded-2xl overflow-hidden mb-12">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700"></div>
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white_0%,_transparent_70%)]"></div>
          
          <div className="relative px-8 py-16 md:px-16">
            <div className="max-w-3xl text-center mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Unlock the Full Power of AI
              </h2>
              <p className="text-lg md:text-xl text-white text-opacity-90 mb-8">
                Join thousands of creators who use MatrixAI Pro to bring their ideas to life with cutting-edge AI tools
              </p>
              
              <div className="inline-flex p-1 bg-white bg-opacity-20 rounded-lg mb-10">
                <button
                  onClick={() => setSelectedPlan('monthly')}
                  className={`px-6 py-2 text-sm font-medium rounded-md transition-colors ${
                    selectedPlan === 'monthly'
                      ? 'bg-white text-blue-700 shadow-lg'
                      : 'text-white hover:bg-white hover:bg-opacity-10'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setSelectedPlan('yearly')}
                  className={`px-6 py-2 text-sm font-medium rounded-md flex items-center transition-colors ${
                    selectedPlan === 'yearly'
                      ? 'bg-white text-blue-700 shadow-lg'
                      : 'text-white hover:bg-white hover:bg-opacity-10'
                  }`}
                >
                  Yearly
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-white">
                    SAVE 20%
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Free Plan */}
          <div className={`rounded-xl border ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } shadow-sm p-8 relative overflow-hidden`}>
            <div className="mb-4">
              <h3 className={`text-xl font-semibold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Free
              </h3>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                For casual exploration
              </p>
            </div>
            
            <div className="flex items-baseline mb-6">
              <span className={`text-5xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>$0</span>
              <span className={`ml-1 text-xl ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>/forever</span>
            </div>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <div className="flex-shrink-0 w-5 h-5 text-green-500 mt-0.5">
                  <FiCheck className="w-5 h-5" />
                </div>
                <span className={`ml-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Basic dashboard access
                </span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 w-5 h-5 text-green-500 mt-0.5">
                  <FiCheck className="w-5 h-5" />
                </div>
                <span className={`ml-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Limited image generation (3/day)
                </span>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 w-5 h-5 text-green-500 mt-0.5">
                  <FiCheck className="w-5 h-5" />
                </div>
                <span className={`ml-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Basic AI assistance
                </span>
              </li>
            </ul>
            
            <button
              disabled={true}
              className={`w-full py-3 rounded-lg font-medium ${
                darkMode 
                  ? 'bg-gray-700 text-gray-400' 
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              Current Plan
            </button>
          </div>
          
          {/* Pro Plan */}
          <div className="rounded-xl border border-transparent bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-0.5 shadow-lg relative overflow-hidden">
            <div className={`rounded-[10px] h-full p-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="absolute -top-1 -right-1">
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-xs font-semibold px-4 py-1 rounded-bl-lg shadow-md transform rotate-[45deg] translate-x-[25%] translate-y-[-25%] w-36 text-center">
                  RECOMMENDED
                </div>
              </div>
              
              <div className="mb-4">
                <h3 className={`text-xl font-semibold mb-1 text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500`}>
                  Pro
                </h3>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  For serious creators
                </p>
              </div>
              
              <div className="flex items-baseline mb-2">
                <span className={`text-5xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {selectedPlan === 'monthly' ? '$29' : '$279'}
                </span>
                <span className={`ml-1 text-xl ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  /{selectedPlan === 'monthly' ? 'month' : 'year'}
                </span>
              </div>
              
              {selectedPlan === 'yearly' && (
                <p className="mb-6 text-sm text-green-500 font-medium">
                  Save $69 with annual billing
                </p>
              )}
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-5 h-5 text-blue-500 mt-0.5">
                    <FiCheck className="w-5 h-5" />
                  </div>
                  <span className={`ml-2 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Unlimited image generation
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-5 h-5 text-blue-500 mt-0.5">
                    <FiCheck className="w-5 h-5" />
                  </div>
                  <span className={`ml-2 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Full video creation tools
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-5 h-5 text-blue-500 mt-0.5">
                    <FiCheck className="w-5 h-5" />
                  </div>
                  <span className={`ml-2 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Advanced content writing
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-5 h-5 text-blue-500 mt-0.5">
                    <FiCheck className="w-5 h-5" />
                  </div>
                  <span className={`ml-2 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Priority support and updates
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-5 h-5 text-blue-500 mt-0.5">
                    <FiCheck className="w-5 h-5" />
                  </div>
                  <span className={`ml-2 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    4K resolution outputs
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-5 h-5 text-blue-500 mt-0.5">
                    <FiStar className="w-5 h-5" />
                  </div>
                  <span className={`ml-2 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Exclusive PRO badge
                  </span>
                </li>
              </ul>
              
              <button
                onClick={handleSubscribe}
                className="w-full py-3 rounded-lg font-medium text-white bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 transition duration-300 transform hover:scale-[1.02]"
              >
                {isPro ? 'Manage Subscription' : 'Upgrade Now'}
              </button>
            </div>
          </div>
        </div>
        
        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Frequently Asked Questions
          </h2>
          
          <div className={`space-y-4 rounded-xl border ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          } p-6`}>
            <div>
              <h3 className={`font-medium text-lg mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Can I cancel my subscription anytime?
              </h3>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Yes, you can cancel your subscription at any time. Your subscription will remain active until the end of your current billing period.
              </p>
            </div>
            
            <div>
              <h3 className={`font-medium text-lg mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                How do I get help if I have questions?
              </h3>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Our support team is available 24/7. Pro users get priority support with faster response times.
              </p>
            </div>
            
            <div>
              <h3 className={`font-medium text-lg mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Are there any refunds if I'm not satisfied?
              </h3>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                We offer a 7-day money-back guarantee for all new Pro subscriptions if you're not completely satisfied.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SubscriptionPage; 
import React, { useState, useContext, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { Layout } from '../components';
import { useTranslation } from 'react-i18next';
import '../styles/CommonStyles.css';
import { 
  FiUsers, 
  FiUserPlus, 
  FiCopy, 
  FiShare2, 
  FiGift,
  FiMail,
  FiMessageSquare,
  FiCheckCircle
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const ReferralPage: React.FC = () => {
  const { t } = useTranslation();
  const { darkMode } = useContext(ThemeContext);
  const { user } = useAuth();
  const { userData } = useUser();
  const [copied, setCopied] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteHistory, setInviteHistory] = useState<{email: string, date: string, status: string}[]>([]);

  const referralCode = userData?.referral_code || 'LOADING';
  const referralUrl = `https://matrixai.app/signup?ref=${referralCode}`;
  
  // Get invited members
  useEffect(() => {
    // This would normally fetch from API, using mock data for now
    setInviteHistory([
      { email: 'friend1@example.com', date: '2023-12-15', status: 'Joined' },
      { email: 'friend2@example.com', date: '2023-12-10', status: 'Pending' },
      { email: 'colleague@example.com', date: '2023-11-28', status: 'Joined' }
    ]);
  }, []);

  // Copy referral link to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    toast.success('Referral link copied to clipboard!');
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };
  
  // Share via social media
  const shareVia = (platform: string) => {
    let url = '';
    const text = `Join me on MatrixAI - Use my referral code ${referralCode} to get started!`;
    
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralUrl)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}&quote=${encodeURIComponent(text)}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(text + ' ' + referralUrl)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}&title=${encodeURIComponent(text)}`;
        break;
      default:
        return;
    }
    
    window.open(url, '_blank');
  };

  // Send email invitation
  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailInput.trim() || !user?.id) return;
    
    try {
      setIsSubmitting(true);
      
      // Mock API call - in a real app, this would call your backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Success
      toast.success(`Invitation sent to ${emailInput}`);
      setEmailInput('');
      setInviteHistory(prev => [
        { email: emailInput, date: new Date().toISOString().split('T')[0], status: 'Pending' },
        ...prev
      ]);
    } catch (error) {
      toast.error('Failed to send invitation');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className={`page-background py-8 px-4 lg:px-8 ${darkMode ? 'dark' : ''}`}>
        {/* Background gradient effects */}
        <div className="gradient-blob-1"></div>
        <div className="gradient-blob-2"></div>

        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="page-title">
              Refer Friends & Earn Rewards
            </h1>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
              Invite friends to join AI and earn bonus coins for every referral
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
            {/* Referral Info Card */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="rounded-xl glass-effect p-6 lg:col-span-1"
            >
              <div className="flex items-center mb-6">
                <div className={`p-3 rounded-lg ${
                  darkMode ? 'bg-pink-900/30 text-pink-300' : 'bg-pink-100 text-pink-600'
                } mr-4`}>
                  <FiGift className="h-6 w-6" />
                </div>
                <div>
                  <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Referral Rewards
                  </h2>
                </div>
              </div>

              <div className={`p-4 rounded-lg mb-4 ${
                darkMode ? 'bg-gray-700/50' : 'bg-gray-50'
              }`}>
                <div className="flex items-start mb-3">
                  <div className={`p-2 rounded-md ${
                    darkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-600'
                  } mr-3`}>
                    <FiUserPlus className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      For Each Friend Who Joins
                    </h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                      You get 100 coins when they sign up using your code
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className={`p-2 rounded-md ${
                    darkMode ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-600'
                  } mr-3`}>
                    <FiUsers className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      When They Subscribe
                    </h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                      You get 500 additional coins when they purchase a subscription
                    </p>
                  </div>
                </div>
              </div>

              <div className={`text-center p-4 rounded-lg ${
                darkMode ? 'bg-blue-900/20 border border-blue-800/30' : 'bg-blue-50 border border-blue-100'
              }`}>
                <div className={`text-lg font-bold mb-1 ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                  Your Referral Stats
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-white'}`}>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Total Invited
                    </div>
                    <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {userData?.invited_members?.length || 0}
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-white'}`}>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Coins Earned
                    </div>
                    <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      1,200
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Referral Link Section */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="rounded-xl glass-effect p-6 lg:col-span-2"
            >
              <div className="flex items-center mb-6">
                <div className={`p-3 rounded-lg ${
                  darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-600'
                } mr-4`}>
                  <FiShare2 className="h-6 w-6" />
                </div>
                <div>
                  <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Share Your Referral Link
                  </h2>
                </div>
              </div>

              {/* Referral Code Display */}
              <div className="mb-6">
                <div className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Your Referral Code
                </div>
                <div className={`flex items-center p-4 rounded-lg ${
                  darkMode ? 'bg-gray-700/50 border border-gray-600/50' : 'bg-gray-50 border border-gray-200'
                }`}>
                  <div className={`text-xl font-mono font-bold tracking-wider ${
                    darkMode ? 'text-amber-300' : 'text-amber-600'
                  }`}>
                    {referralCode}
                  </div>
                  <button 
                    onClick={copyToClipboard}
                    className={`ml-auto p-2 rounded-md ${
                      darkMode 
                        ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                    aria-label="Copy referral code"
                  >
                    {copied ? <FiCheckCircle className="h-5 w-5" /> : <FiCopy className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Referral Link */}
              <div className="mb-6">
                <div className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Referral Link
                </div>
                <div className={`flex items-center p-4 rounded-lg ${
                  darkMode ? 'bg-gray-700/50 border border-gray-600/50' : 'bg-gray-50 border border-gray-200'
                }`}>
                  <div className={`text-sm truncate font-medium ${
                    darkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {referralUrl}
                  </div>
                  <button 
                    onClick={copyToClipboard}
                    className={`ml-auto p-2 rounded-md flex-shrink-0 ${
                      darkMode 
                        ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                    aria-label="Copy referral link"
                  >
                    {copied ? <FiCheckCircle className="h-5 w-5" /> : <FiCopy className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Social Share */}
              <div className="mb-6">
                <div className={`text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('referral.shareViaSocialMedia')}
                </div>
                <div className="flex flex-wrap gap-3">
                  {[
                    { name: 'twitter', color: 'bg-[#1DA1F2]', label: t('common.socialMedia.twitter') },
                    { name: 'facebook', color: 'bg-[#4267B2]', label: t('common.socialMedia.facebook') },
                    { name: 'linkedin', color: 'bg-[#0077B5]', label: t('common.socialMedia.linkedin') },
                    { name: 'whatsapp', color: 'bg-[#25D366]', label: t('common.socialMedia.whatsapp') }
                  ].map((platform) => (
                    <button
                      key={platform.name}
                      onClick={() => shareVia(platform.name)}
                      className={`px-4 py-2 rounded-lg text-white ${platform.color} hover:opacity-90 transition-opacity`}
                    >
                      {platform.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Email Invite Form */}
              <div>
                <div className={`text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Invite via Email
                </div>
                <form onSubmit={sendInvite} className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMail className={`h-5 w-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                    </div>
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="Enter your friend's email"
                      className={`block w-full pl-10 pr-3 py-2 rounded-lg ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500' 
                          : 'bg-white border border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting || !emailInput.trim()}
                    className={`px-4 py-2 rounded-lg flex items-center justify-center ${
                      darkMode 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    } ${(isSubmitting || !emailInput.trim()) ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    <FiMessageSquare className="h-4 w-4 mr-2" />
                    <span>{isSubmitting ? 'Sending...' : 'Send Invite'}</span>
                  </button>
                </form>
              </div>
            </motion.div>
          </div>

          {/* Referral History */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="rounded-xl glass-effect p-6"
          >
            <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Invitation History
            </h2>
            
            {inviteHistory.length === 0 ? (
              <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No invitations sent yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}>
                    <tr>
                      <th className={`px-6 py-3 text-left text-xs font-medium ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      } uppercase tracking-wider`}>
                        Email
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      } uppercase tracking-wider`}>
                        Date Invited
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      } uppercase tracking-wider`}>
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    {inviteHistory.map((invite, index) => (
                      <tr key={index} className={darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                          darkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {invite.email}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                          darkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {invite.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            invite.status === 'Joined'
                              ? (darkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800')
                              : (darkMode ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-800')
                          }`}>
                            {invite.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default ReferralPage;
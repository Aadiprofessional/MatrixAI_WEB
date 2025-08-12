import React, { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ThemeContext } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components';
import '../styles/CommonStyles.css';
import { userService } from '../services/userService';
import { useTranslation } from 'react-i18next';
import { 
  FiEdit2, 
  FiUser, 
  FiMail, 
  FiLock, 
  FiCalendar, 
  FiClock,
  FiImage,
  FiVideo,
  FiFileText,
  FiMessageSquare,
  FiUpload,
  FiSave,
  FiPhone,
  FiGlobe,
  FiCode,
  FiRefreshCw,
  FiLoader,
  FiDollarSign,
  FiActivity,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiList,
  FiArrowDown,
  FiArrowUp,
  FiCornerLeftUp,
  FiCornerRightUp,
  FiCreditCard,
  FiStar
} from 'react-icons/fi';
import { updateUserProfile } from '../supabaseClient';
import { toast } from 'react-hot-toast';

// Transaction interface - updated to match userService
interface Transaction {
  id: number;
  uid: string;
  transaction_name: string;
  coin_amount: number;
  remaining_coins: number;
  status: string;
  time: string;
}

// Activity item component definition
const ActivityItem: React.FC<{ item: { type: string, text: string, time: string } }> = ({ item }) => {
  const { darkMode } = useContext(ThemeContext);
  
  const getIcon = (type: string) => {
    switch(type) {
      case 'image':
        return <FiImage className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'video':
        return <FiVideo className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'document':
        return <FiFileText className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'chat':
        return <FiMessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />;
      default:
        return <FiClock className="w-3 h-3 sm:w-4 sm:h-4" />;
    }
  };

  const getColor = (type: string) => {
    switch(type) {
      case 'image':
        return darkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-600';
      case 'video':
        return darkMode ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-600';
      case 'document':
        return darkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-600';
      case 'chat':
        return darkMode ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-100 text-indigo-600';
      default:
        return darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="p-3 sm:p-4 border-b border-gray-700 last:border-b-0">
      <div className="flex items-start">
        <div className={`p-1.5 sm:p-2 rounded-lg mr-2 sm:mr-3 ${getColor(item.type)}`}>
          {getIcon(item.type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm sm:text-base text-primary truncate">{item.text}</p>
          <p className="text-xs text-tertiary mt-1">{item.time}</p>
        </div>
      </div>
    </div>
  );
};

// Transaction item component
const TransactionItem: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
  const { t } = useTranslation();
  const { darkMode } = useContext(ThemeContext);
  
  const getTransactionIcon = (transactionName: string) => {
    // Check for transaction type patterns
    if (!transactionName) return <FiActivity className="w-5 h-5" />;
    
    const name = transactionName.toLowerCase();
    
    // Content generation related
    if (name.includes('content_generation')) return <FiFileText className="w-5 h-5" />;
    
    // Chat related
    if (name.includes('chat') || name.includes('message')) return <FiMessageSquare className="w-5 h-5" />;
    
    // Image related
    if (name.includes('image')) return <FiImage className="w-5 h-5" />;
    
    // Video related
    if (name.includes('video')) return <FiVideo className="w-5 h-5" />;
    
    // Audio/transcription related
    if (name.includes('audio') || name.includes('transcription')) return <FiFileText className="w-5 h-5" />;
    
    // Credit/debit related
    if (name.includes('credit')) return <FiArrowDown className="w-5 h-5" />;
    if (name.includes('debit')) return <FiArrowUp className="w-5 h-5" />;
    
    // Subscription related
    if (name.includes('subscription')) return <FiClock className="w-5 h-5" />;
    
    // Refund related
    if (name.includes('refund')) return <FiCornerLeftUp className="w-5 h-5" />;
    
    // Withdrawal related
    if (name.includes('withdrawal')) return <FiCornerRightUp className="w-5 h-5" />;
    
    // Default fallback
    return <FiCreditCard className="w-5 h-5" />;
  };

  const getTransactionColor = (transactionName: string) => {
    if (!transactionName) return darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700';
    
    const name = transactionName.toLowerCase();
    
    // Content generation related
    if (name.includes('content_generation')) 
      return darkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700';
    
    // Chat related
    if (name.includes('chat') || name.includes('message')) 
      return darkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700';
    
    // Image related
    if (name.includes('image')) 
      return darkMode ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-700';
    
    // Video related
    if (name.includes('video')) 
      return darkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700';
    
    // Audio/transcription related
    if (name.includes('audio') || name.includes('transcription')) 
      return darkMode ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-100 text-indigo-700';
    
    // Credit related
    if (name.includes('credit')) 
      return darkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700';
    
    // Debit related
    if (name.includes('debit')) 
      return darkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700';
    
    // Subscription related
    if (name.includes('subscription')) 
      return darkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700';
    
    // Refund related
    if (name.includes('refund')) 
      return darkMode ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-700';
    
    // Withdrawal related
    if (name.includes('withdrawal')) 
      return darkMode ? 'bg-amber-900/50 text-amber-300' : 'bg-amber-100 text-amber-700';
    
    // Default fallback
    return darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return <FiCheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
      case 'error':
        return <FiXCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <FiAlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <FiClock className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Safely handle amount with fallback
  const safeAmount = typeof transaction.coin_amount === 'number' ? transaction.coin_amount : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 border-b last:border-b-0 hover:bg-opacity-70 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${getTransactionColor(transaction.transaction_name)}`}>
            {getTransactionIcon(transaction.transaction_name)}
          </div>
          <div>
            <h4 className="font-medium text-primary">
              {transaction.transaction_name ? 
                transaction.transaction_name.split('_').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ') : 
                t('profile.transaction')
              }
            </h4>
            <p className="text-sm text-tertiary">
              {formatDate(transaction.time)}
            </p>
            {/* transaction.description is removed as per new Transaction interface */}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="font-semibold text-primary flex items-center">
              {safeAmount > 0 
                ? `-${safeAmount.toFixed(0)}` 
                : `-${Math.abs(safeAmount).toFixed(0)}`
              } {t('profile.coins')}
            </div>
            <div className="flex items-center space-x-1">
              {getStatusIcon(transaction.status)}
              <span className="text-xs capitalize text-tertiary">
                {transaction.status}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ProfilePage: React.FC = () => {
  const { t } = useTranslation();
  const { darkMode } = useContext(ThemeContext);
  const { userData, loading, refreshUserData } = useUser();
  const { user } = useAuth();
  const uid = user?.uid;
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    gender: '',
    age: '',
    preferred_language: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Load user data into form when it's available
  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        gender: userData.gender || '',
        age: userData.age ? userData.age.toString() : '',
        preferred_language: userData.preferred_language || '',
        phone: userData.phone || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  }, [userData]);

  // Fetch transactions when component mounts
  useEffect(() => {
    if (uid) {
      fetchTransactions();
    }
  }, [uid]);

  const fetchTransactions = async () => {
    if (!uid) return;
    
    setTransactionsLoading(true);
    try {
      const response = await userService.getAllTransactions(uid);
      
      if (response.success) {
        const sortedTransactions = response.data.sort((a: Transaction, b: Transaction) => {
          const timeA = a.time ? new Date(a.time).getTime() : 0;
          const timeB = b.time ? new Date(b.time).getTime() : 0;
          return timeB - timeA;
        });
        setTransactions(sortedTransactions);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setTransactionsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefreshTransactions = () => {
    setRefreshing(true);
    fetchTransactions();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData?.uid) return;
    
    try {
      setIsSubmitting(true);
      
      // Prepare update data - only send what's changed and needed
      const updateData: any = {};
      
      if (formData.name !== userData.name) updateData.name = formData.name;
      if (formData.gender !== userData.gender) updateData.gender = formData.gender;
      if (formData.preferred_language !== userData.preferred_language) 
        updateData.preferred_language = formData.preferred_language;
      if (formData.phone !== userData.phone) updateData.phone = formData.phone;
      
      // Convert age to number if it's changed
      const numAge = parseInt(formData.age);
      if (!isNaN(numAge) && numAge !== userData.age) updateData.age = numAge;
      
      // If we have changes to update
      if (Object.keys(updateData).length > 0) {
        await updateUserProfile(userData.uid, updateData);
        await refreshUserData();
        toast.success(t('profile.profileUpdatedSuccessfully'));
      }
      
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || t('profile.failedToUpdateProfile'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="page-background dark py-8 px-4 lg:px-8 min-h-screen">
          <div className="max-w-7xl mx-auto flex items-center justify-center">
            <p className="text-xl text-primary">{t('profile.loadingProfile')}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={`page-background py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-8 ${darkMode ? 'dark' : ''}`}>
        {/* Background gradient effects */}
        <div className="gradient-blob-1"></div>
        <div className="gradient-blob-2"></div>

        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-4 sm:mb-6 lg:mb-8"
          >
            <h1 className="page-title text-2xl sm:text-3xl lg:text-4xl mb-1 sm:mb-2">
              {t('profile.yourProfile')}
            </h1>
            <p className="text-sm sm:text-base text-tertiary">
              {t('profile.manageAccountSettings')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Profile Card */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="rounded-xl glass-effect p-4 sm:p-5 lg:p-6 lg:col-span-1"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 relative">
                  {userData?.dp_url ? (
                    <img 
                      src={userData.dp_url} 
                      alt={userData.name} 
                      className="rounded-full object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full flex items-center justify-center text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
                      {userData?.name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <button 
                    className="absolute bottom-0 right-0 p-1.5 sm:p-2 rounded-full bg-gray-700 text-blue-400 border border-gray-600"
                  >
                    <FiEdit2 size={12} className="sm:w-3.5 sm:h-3.5" />
                  </button>
                </div>

                <h2 className="text-lg sm:text-xl font-bold mt-3 sm:mt-4 text-primary">
                  {userData?.name}
                </h2>
                <p className="text-xs sm:text-sm text-tertiary">
                  {userData?.email}
                </p>
                
                <div className="mt-2 px-2 sm:px-3 py-1 rounded-full text-xs font-medium badge-primary">
                  {userData?.user_plan || 'Free'} Plan
                </div>
                
                <div className="w-full mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-dashed border-opacity-50 border-gray-500">
                  <div className="flex items-center justify-center">
                    <div className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg flex items-center badge-secondary text-xs sm:text-sm">
                      <FiCode className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span>{t('profile.referralCode')}: {userData?.referral_code}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Stats */}
              <div className="mt-4 sm:mt-6">
                <h3 className="text-sm sm:text-md font-semibold mb-2 sm:mb-3 text-primary">
                  {t('profile.yourCredits')}
                </h3>
                <div className="p-3 sm:p-4 rounded-lg glass-effect-light flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div className="flex items-center">
                    <div className="p-1.5 sm:p-2 rounded-lg badge-secondary">
                      <FiClock className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="ml-2 sm:ml-3">
                      <p className="text-xs sm:text-sm text-secondary">{t('profile.availableCoins')}</p>
                      <p className="text-base sm:text-lg font-bold text-primary">
                        {userData?.coins || 0}
                      </p>
                    </div>
                  </div>
                  <div className="px-2 py-1 rounded text-xs badge-neutral">
                    {t('profile.expires')}: {userData?.coins_expiry ? new Date(userData.coins_expiry).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Profile Settings */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="rounded-xl glass-effect p-4 sm:p-5 lg:p-6 lg:col-span-2"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
                <h2 className="text-lg sm:text-xl font-bold text-primary">
                  {t('profile.accountSettings')}
                </h2>
                <button
                  onClick={() => isEditing ? handleSubmit : setIsEditing(true)}
                  disabled={isSubmitting}
                  className={`px-3 sm:px-4 py-2 rounded-lg flex items-center text-sm sm:text-base ${isEditing ? 'btn-secondary' : 'btn-primary'} ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isEditing ? (
                    <>
                      <FiSave className="mr-1 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{isSubmitting ? t('profile.saving') : t('profile.save')}</span>
                    </>
                  ) : (
                    <>
                      <FiEdit2 className="mr-1 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{t('profile.editProfile')}</span>
                    </>
                  )}
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4 sm:space-y-5">
                  <div>
                    <label 
                      htmlFor="name" 
                      className="block text-xs sm:text-sm font-medium mb-1 text-secondary"
                    >
                      {t('profile.fullName')}
                    </label>
                    <div className="flex items-center">
                      <span className="p-1.5 sm:p-2 input-icon-wrapper rounded-l-lg">
                        <FiUser className="w-4 h-4 sm:w-5 sm:h-5" />
                      </span>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        disabled={!isEditing}
                        value={formData.name}
                        onChange={handleChange}
                        className={`flex-1 p-2 sm:p-3 input-field rounded-r-lg text-sm sm:text-base ${!isEditing ? 'input-disabled' : ''}`}
                      />
                    </div>
                  </div>

                  <div>
                    <label 
                      htmlFor="email" 
                      className="block text-xs sm:text-sm font-medium mb-1 text-secondary"
                    >
                      {t('profile.emailAddress')}
                    </label>
                    <div className="flex items-center">
                      <span className="p-1.5 sm:p-2 input-icon-wrapper rounded-l-lg">
                        <FiMail className="w-4 h-4 sm:w-5 sm:h-5" />
                      </span>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        disabled={true} // Email can't be changed here
                        value={formData.email}
                        className="flex-1 p-2 sm:p-3 input-field rounded-r-lg input-disabled text-sm sm:text-base"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                    <div>
                      <label 
                        htmlFor="gender" 
                        className="block text-xs sm:text-sm font-medium mb-1 text-secondary"
                      >
                        {t('profile.gender')}
                      </label>
                      <div className="flex items-center">
                        <span className="p-1.5 sm:p-2 input-icon-wrapper rounded-l-lg">
                          <FiUser className="w-4 h-4 sm:w-5 sm:h-5" />
                        </span>
                        <input
                          type="text"
                          id="gender"
                          name="gender"
                          disabled={!isEditing}
                          value={formData.gender}
                          onChange={handleChange}
                          className={`flex-1 p-2 sm:p-3 input-field rounded-r-lg text-sm sm:text-base ${!isEditing ? 'input-disabled' : ''}`}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label 
                        htmlFor="age" 
                        className="block text-xs sm:text-sm font-medium mb-1 text-secondary"
                      >
                        {t('profile.age')}
                      </label>
                      <div className="flex items-center">
                        <span className="p-1.5 sm:p-2 input-icon-wrapper rounded-l-lg">
                          <FiCalendar className="w-4 h-4 sm:w-5 sm:h-5" />
                        </span>
                        <input
                          type="number"
                          id="age"
                          name="age"
                          disabled={!isEditing}
                          value={formData.age}
                          onChange={handleChange}
                          className={`flex-1 p-2 sm:p-3 input-field rounded-r-lg text-sm sm:text-base ${!isEditing ? 'input-disabled' : ''}`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                    <div>
                      <label 
                        htmlFor="preferred_language" 
                        className="block text-xs sm:text-sm font-medium mb-1 text-secondary"
                      >
                        {t('profile.preferredLanguage')}
                      </label>
                      <div className="flex items-center">
                        <span className="p-1.5 sm:p-2 input-icon-wrapper rounded-l-lg">
                          <FiGlobe className="w-4 h-4 sm:w-5 sm:h-5" />
                        </span>
                        <input
                          type="text"
                          id="preferred_language"
                          name="preferred_language"
                          disabled={!isEditing}
                          value={formData.preferred_language}
                          onChange={handleChange}
                          className={`flex-1 p-2 sm:p-3 input-field rounded-r-lg text-sm sm:text-base ${!isEditing ? 'input-disabled' : ''}`}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label 
                        htmlFor="phone" 
                        className="block text-xs sm:text-sm font-medium mb-1 text-secondary"
                      >
                        {t('profile.phoneOptional')}
                      </label>
                      <div className="flex items-center">
                        <span className="p-1.5 sm:p-2 input-icon-wrapper rounded-l-lg">
                          <FiPhone className="w-4 h-4 sm:w-5 sm:h-5" />
                        </span>
                        <input
                          type="text"
                          id="phone"
                          name="phone"
                          disabled={!isEditing}
                          value={formData.phone}
                          onChange={handleChange}
                          className={`flex-1 p-2 sm:p-3 input-field rounded-r-lg text-sm sm:text-base ${!isEditing ? 'input-disabled' : ''}`}
                        />
                      </div>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex flex-col sm:flex-row justify-end mt-4 sm:mt-6 space-y-2 sm:space-y-0 sm:space-x-3">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-3 sm:px-4 py-2 rounded-lg btn-secondary text-sm sm:text-base"
                      >
                        {t('profile.cancel')}
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`px-3 sm:px-4 py-2 rounded-lg btn-primary text-sm sm:text-base ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        {isSubmitting ? t('profile.saving') : t('profile.saveChanges')}
                      </button>
                    </div>
                  )}
                </div>
              </form>
            </motion.div>

            {/* Recent Activity */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="rounded-xl glass-effect lg:col-span-3"
            >
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-700 flex items-center justify-between">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <FiActivity className="w-4 h-4 sm:w-5 sm:h-5" />
                  <h2 className="text-lg sm:text-xl font-bold section-title">
                    {t('profile.recentTransactions')}
                  </h2>
                </div>
                <button
                  onClick={handleRefreshTransactions}
                  disabled={refreshing}
                  className={`p-1.5 sm:p-2 rounded-lg transition-colors btn-icon ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={t('profile.refreshTransactions')}
                >
                  <FiRefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
              
              <div className="max-h-80 sm:max-h-96 overflow-y-auto">
                {transactionsLoading ? (
                  <div className="flex items-center justify-center py-8 sm:py-12">
                    <div className="flex flex-col items-center space-y-2 sm:space-y-3">
                      <FiLoader className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-primary" />
                      <p className="text-xs sm:text-sm text-secondary">
                        {t('profile.loadingTransactions')}
                      </p>
                    </div>
                  </div>
                ) : transactions.length > 0 ? (
                  <div>
                    {transactions.slice(0, 10).map((transaction) => (
                      <TransactionItem key={transaction.id} transaction={transaction} />
                    ))}
                    {transactions.length > 10 && (
                      <div className="p-3 sm:p-4 text-center border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs sm:text-sm text-secondary">
                          {t('profile.showingTransactions', { count: 10, total: transactions.length })}
                        </p>
                        <Link 
                          to="/transactions"
                          className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg btn-primary transition-colors text-xs sm:text-sm"
                        >
                          <FiList className="w-3 h-3 sm:w-4 sm:h-4" />
                          {t('profile.viewAllTransactions')}
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 sm:py-12">
                    <div className="p-3 sm:p-4 rounded-full bg-gray-700/50 mb-3 sm:mb-4">
                      <FiDollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                    </div>
                    <h3 className="text-base sm:text-lg font-medium text-primary mb-2">
                      {t('profile.noTransactionsYet')}
                    </h3>
                    <p className="text-xs sm:text-sm text-tertiary text-center max-w-sm px-4">
                      {t('profile.transactionHistoryMessage')}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
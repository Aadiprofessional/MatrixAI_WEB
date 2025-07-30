import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { Layout } from '../components';
import { userService } from '../services/userService';
import { 
  FiCreditCard, 
  FiArrowDown, 
  FiArrowUp, 
  FiClock, 
  FiRefreshCw,
  FiFilter,
  FiDownload,
  FiCornerLeftUp,
  FiCornerRightUp,
  FiCheckCircle,
  FiXCircle,
  FiMessageSquare,
  FiVideo,
  FiFileText,
  FiImage,
  FiMic
} from 'react-icons/fi';

interface Transaction {
  id: number;
  uid: string;
  transaction_name: string;
  coin_amount: number;
  remaining_coins: number;
  description?: string;
  created_at?: string;
  time?: string;
  status: string;
}

// Mock transactions data for development or when API is unavailable
// Mock transactions will use translation keys for descriptions
const getMockTransactions = (t: any): Transaction[] => [
  {
    id: 1,
    uid: '',
    transaction_name: 'Credit',
    coin_amount: 500,
    remaining_coins: 500,
    description: t('transactions.mockData.welcomeBonus'),
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    status: 'Completed'
  },
  {
    id: 2,
    uid: '',
    transaction_name: 'Content generation',
    coin_amount: -50,
    remaining_coins: 450,
    description: t('transactions.mockData.contentGeneration'),
    created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    status: 'Completed'
  },
  {
    id: 3,
    uid: '',
    transaction_name: 'Credit',
    coin_amount: 100,
    remaining_coins: 550,
    description: t('transactions.mockData.referralReward'),
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
    status: 'Completed'
  },
  {
    id: 4,
    uid: '',
    transaction_name: 'Subscription',
    coin_amount: -200,
    remaining_coins: 350,
    description: t('transactions.mockData.monthlySubscription'),
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(), // 15 days ago
    status: 'Completed'
  },
  {
    id: 5,
    uid: '',
    transaction_name: 'Refund',
    coin_amount: 75,
    remaining_coins: 425,
    description: t('transactions.mockData.serviceCredit'),
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
    status: 'Completed'
  }
];

const TransactionsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { userData, refreshUserData } = useUser();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);

  // Fetch transactions from API
  const fetchTransactions = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Use userService to fetch transactions
      const response = await userService.getAllTransactions(user.id);
      
      if (response.success) {
        // Sort transactions by time (newest first)
        const sortedTransactions = response.data.sort((a: Transaction, b: Transaction) => {
          const timeA = a.created_at ? new Date(a.created_at).getTime() : 
                      (a.time ? new Date(a.time).getTime() : 0);
          const timeB = b.created_at ? new Date(b.created_at).getTime() : 
                      (b.time ? new Date(b.time).getTime() : 0);
          return timeB - timeA;
        });
        
        setTransactions(sortedTransactions);
      }
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      setError(t('transactions.errors.connectionError'));
      
      // Use mock data if API call fails
      setTransactions(getMockTransactions(t));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchTransactions();
  }, [user?.id]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

  // Format date string
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return t('transactions.dateNotAvailable');
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get filtered transactions
  const getFilteredTransactions = () => {
    if (filter === 'all') return transactions;
    
    return transactions.filter(t => {
      const transactionName = t.transaction_name?.toLowerCase() || '';
      
      switch(filter.toLowerCase()) {
        case 'credit':
          return t.coin_amount > 0;
        case 'debit':
          return t.coin_amount < 0;
        case 'subscription':
          return transactionName.includes('subscription');
        case 'refund':
          return transactionName.includes('refund');
        default:
          return true;
      }
    });
  };

  const filteredTransactions = getFilteredTransactions();

  // Get transaction icon based on transaction name and amount
  const getTransactionIcon = (transaction: Transaction) => {
    const name = transaction.transaction_name?.toLowerCase() || '';
    const amount = transaction.coin_amount;
    
    if (amount > 0) {
      return <FiArrowDown className="h-5 w-5" />; // Credit
    } else if (amount < 0) {
      if (name.includes('subscription')) {
        return <FiClock className="h-5 w-5" />;
      } else if (name.includes('chat') || name.includes('message')) {
        return <FiMessageSquare className="h-5 w-5" />;
      } else if (name.includes('video')) {
        return <FiVideo className="h-5 w-5" />;
      } else if (name.includes('content generation') || name.includes('content_generation')) {
        return <FiFileText className="h-5 w-5" />;
      } else if (name.includes('image')) {
        return <FiImage className="h-5 w-5" />;
      } else if (name.includes('audio') || name.includes('transcription')) {
        return <FiMic className="h-5 w-5" />;
      } else {
        return <FiArrowUp className="h-5 w-5" />; // Generic debit
      }
    } else if (name.includes('refund')) {
      return <FiCornerLeftUp className="h-5 w-5" />;
    } else if (name.includes('withdrawal')) {
      return <FiCornerRightUp className="h-5 w-5" />;
    }
    
    return <FiCreditCard className="h-5 w-5" />; // Default
  };

  // Get transaction color based on transaction name and amount
  const getTransactionColor = (transaction: Transaction) => {
    const name = transaction.transaction_name?.toLowerCase() || '';
    const amount = transaction.coin_amount;
    
    if (amount > 0) {
      return 'bg-green-900/50 text-green-300'; // Credit
    } else if (amount < 0) {
      if (name.includes('subscription')) {
        return 'bg-blue-900/50 text-blue-300';
      } else if (name.includes('chat') || name.includes('message')) {
        return 'bg-blue-900/50 text-blue-300';
      } else if (name.includes('video')) {
        return 'bg-purple-900/50 text-purple-300';
      } else if (name.includes('content generation') || name.includes('content_generation')) {
        return 'bg-green-900/50 text-green-300';
      } else if (name.includes('image')) {
        return 'bg-indigo-900/50 text-indigo-300';
      } else if (name.includes('audio') || name.includes('transcription')) {
        return 'bg-orange-900/50 text-orange-300';
      } else {
        return 'bg-red-900/50 text-red-300'; // Generic debit
      }
    } else if (name.includes('refund')) {
      return 'bg-purple-900/50 text-purple-300';
    } else if (name.includes('withdrawal')) {
      return 'bg-amber-900/50 text-amber-300';
    }
    
    return 'bg-gray-800 text-gray-300'; // Default
  };

  // Get status icon and color
  const getStatusInfo = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return {
          icon: <FiCheckCircle className="h-5 w-5" />,
          color: 'text-green-400'
        };
      case 'pending':
        return {
          icon: <FiClock className="h-5 w-5" />,
          color: 'text-amber-400'
        };
      case 'failed':
      case 'error':
        return {
          icon: <FiXCircle className="h-5 w-5" />,
          color: 'text-red-400'
        };
      default:
        return {
          icon: <FiCreditCard className="h-5 w-5" />,
          color: 'text-gray-400'
        };
    }
  };

  return (
    <Layout>
      <div className="py-8 px-4 lg:px-8 page-background dark">
        {/* Background gradient effects */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-purple-500/10 blur-3xl opacity-70"></div>
          <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-purple-500/10 via-pink-500/5 to-blue-500/10 blur-3xl opacity-70"></div>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center"
          >
            <div>
              <h1 className="text-3xl font-bold text-primary">
                {t('transactions.title')}
              </h1>
              <p className="text-tertiary mt-1">
                {t('transactions.subtitle')}
              </p>
            </div>

            <div className="flex mt-4 md:mt-0 space-x-3">
              <button 
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center px-3 py-2 rounded-lg text-sm bg-gray-800 hover:bg-gray-700 text-gray-200 transition-colors border border-gray-700"
              >
                <FiRefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? t('transactions.refreshing') : t('transactions.refresh')}</span>
              </button>
              
              <button 
                className="flex items-center px-3 py-2 rounded-lg text-sm bg-gray-800 hover:bg-gray-700 text-gray-200 transition-colors border border-gray-700"
              >
                <FiDownload className="h-4 w-4 mr-2" />
                <span>{t('transactions.export')}</span>
              </button>
            </div>
          </motion.div>

          {/* Error message */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-lg bg-red-900/20 border border-red-800/30 text-red-300"
            >
              {error}
            </motion.div>
          )}

          {/* Coins Summary Card */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-xl glass-effect border border-gray-700/50 p-6 mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center mb-4 md:mb-0">
                <div className="p-3 rounded-lg bg-amber-900/30 text-amber-300 mr-4">
                  <FiCreditCard className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-medium text-tertiary">{t('transactions.currentBalance')}</div>
                  <div className="text-2xl font-bold text-primary">
                    {userData?.user_coins || 0} {t('transactions.coins')}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <div className="flex flex-col">
                  <div className="text-sm font-medium text-tertiary">{t('transactions.nextExpiry')}</div>
                  <div className="text-sm font-bold text-primary">
                    {userData?.coins_expiry 
                      ? new Date(userData.coins_expiry).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})
                      : t('transactions.notAvailable')}
                  </div>
                </div>
                
                <div className="flex flex-col">
                  <div className="text-sm font-medium text-tertiary">{t('transactions.lastUpdate')}</div>
                  <div className="text-sm font-bold text-primary">
                    {userData?.last_coin_addition 
                      ? new Date(userData.last_coin_addition).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})
                      : t('transactions.notAvailable')}
                  </div>
                </div>
                
                <div className="flex flex-col">
                  <div className="text-sm font-medium text-tertiary">{t('transactions.subscriptionPlan')}</div>
                  <div className="text-sm font-bold text-primary">
                    {userData?.user_plan || t('transactions.freePlan')}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Filter Controls Removed */}
          <div className="mb-6"></div>

          {/* Transactions Table */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="rounded-xl overflow-hidden glass-effect border border-gray-700/50"
          >
            {loading ? (
              <div className="p-8 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="p-8 text-center text-tertiary">
                {t('transactions.noTransactionsFound')}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        {t('transactions.table.type')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        {t('transactions.table.description')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        {t('transactions.table.amount')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        {t('transactions.table.date')}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        {t('transactions.table.status')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredTransactions.map((transaction, index) => {
                      // Default status to 'completed' if not provided
                      const status = transaction.status || 'completed';
                      const statusInfo = getStatusInfo(status);
                      const transactionType = transaction.coin_amount > 0 ? t('transactions.types.credit') : t('transactions.types.debit');
                      
                      return (
                        <tr 
                          key={transaction.id || index}
                          className="hover:bg-gray-700/50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={`p-2 rounded-lg mr-3 ${getTransactionColor(transaction)}`}>
                                {getTransactionIcon(transaction)}
                              </div>
                              <div className="text-sm font-medium text-primary">
                                {transaction.transaction_name ? 
                                  t(`transactions.types.${transaction.transaction_name.toLowerCase().replace(/\s+/g, '_')}`, {
                                    defaultValue: transaction.transaction_name.split('_').map(word => 
                                      word.charAt(0).toUpperCase() + word.slice(1)
                                    ).join(' ')
                                  }) : 
                                  transactionType
                                }
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                            {transaction.description || transaction.transaction_name || t('transactions.defaultTransactionName')}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                            transaction.coin_amount > 0
                              ? 'text-green-400'
                              : 'text-red-400'
                          }`}>
                            {transaction.coin_amount > 0
                              ? `+${transaction.coin_amount}`
                              : transaction.coin_amount
                            } {t('transactions.coins')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                            {formatDate(transaction.created_at || transaction.time)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-gray-800 ${statusInfo.color}`}>
                              {statusInfo.icon}
                              <span className="ml-1.5">{t(`transactions.status.${status.toLowerCase()}`, { defaultValue: status })}</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
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

export default TransactionsPage;
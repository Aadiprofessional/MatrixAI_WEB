import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { Layout } from '../components';
import { userService } from '../services/userService';
import coinImage from '../assets/coin.png';
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
  FiMic,
  FiList,
  FiGrid,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';

interface Transaction {
  id: number;
  uid: string;
  transaction_name: string;
  coin_amount: number;
  remaining_coins: number;

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
  
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    status: 'Completed'
  },
  {
    id: 2,
    uid: '',
    transaction_name: 'Content generation',
    coin_amount: -50,
    remaining_coins: 450,

    created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    status: 'Completed'
  },
  {
    id: 3,
    uid: '',
    transaction_name: 'Credit',
    coin_amount: 100,
    remaining_coins: 550,
  
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
    status: 'Completed'
  },
  {
    id: 4,
    uid: '',
    transaction_name: 'Subscription',
    coin_amount: -200,
    remaining_coins: 350,

    created_at: new Date(Date.now() - 86400000 * 15).toISOString(), // 15 days ago
    status: 'Completed'
  },
  {
    id: 5,
    uid: '',
    transaction_name: 'Refund',
    coin_amount: 75,
    remaining_coins: 425,

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
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const transactionsPerPage = 6;

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
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (page - 1) * transactionsPerPage,
    page * transactionsPerPage
  );
  
  // Handle pagination
  const nextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };
  
  const prevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

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
                  <div className="text-2xl font-bold text-primary flex items-center">
                    {userData?.user_coins || 0}
                    <img src={coinImage} alt="coin" className="w-6 h-6 ml-2" />
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

          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            {/* Filter Controls Removed */}
            <div></div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2">
              <div className="text-sm font-medium text-secondary">
                {t('transactions.view')}:
              </div>
              <div className="flex rounded-lg overflow-hidden border border-gray-700">
                <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${
                      viewMode === 'list'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                >
                  <FiList className="h-4 w-4" />
                </button>
                <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${
                      viewMode === 'grid'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                >
                  <FiGrid className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Transactions Display */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {loading ? (
              <div className="rounded-xl p-20 flex justify-center items-center glass-effect border border-gray-700/50">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="rounded-xl p-12 text-center glass-effect border border-gray-700/50 text-tertiary">
                <FiCreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2 text-secondary">{t('transactions.noTransactionsFound')}</h3>
                <p>{t('transactions.noTransactionsYet')}</p>
              </div>
            ) : viewMode === 'list' ? (
              // List View
              <div className="rounded-xl overflow-hidden glass-effect border border-gray-700/50">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-700/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          {t('transactions.table.type')}
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
                      {paginatedTransactions.map((transaction, index) => {
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
                           
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                              transaction.coin_amount > 0
                                ? 'text-green-400'
                                : 'text-red-400'
                            }`}>
                              <div className="flex items-center">
                                {transaction.coin_amount > 0
                                  ? `-${transaction.coin_amount}`
                                  : `${transaction.coin_amount}`
                                }
                                <img src={coinImage} alt="coin" className="w-4 h-4 ml-1" />
                              </div>
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
              </div>
            ) : (
              // Grid View
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedTransactions.map((transaction, index) => {
                  const status = transaction.status || 'completed';
                  const statusInfo = getStatusInfo(status);
                  const transactionType = transaction.coin_amount > 0 ? t('transactions.types.credit') : t('transactions.types.debit');
                  
                  return (
                    <motion.div
                      key={transaction.id || index}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="rounded-xl overflow-hidden bg-gray-800/50 border border-gray-700/50 hover:border-indigo-700/50 transition-all duration-300 hover:shadow-lg"
                    >
                      <div className="p-5 border-b border-gray-700/50">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className={`p-2 rounded-lg mr-3 ${getTransactionColor(transaction)}`}>
                              {getTransactionIcon(transaction)}
                            </div>
                            <h3 className="text-lg font-medium text-primary">
                              {transaction.transaction_name ? 
                                t(`transactions.types.${transaction.transaction_name.toLowerCase().replace(/\s+/g, '_')}`, {
                                  defaultValue: transaction.transaction_name.split('_').map(word => 
                                    word.charAt(0).toUpperCase() + word.slice(1)
                                  ).join(' ')
                                }) : 
                                transactionType
                              }
                            </h3>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color} bg-gray-800`}>
                            {statusInfo.icon}
                            <span className="ml-1.5">{t(`transactions.status.${status.toLowerCase()}`, { defaultValue: status })}</span>
                          </span>
                        </div>
                        <div className="text-sm mt-1 text-tertiary">
                          {t('transactions.transactionId', { id: transaction.id || index + 1 })}
                        </div>
                      </div>
                      
                      <div className="p-5">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs font-medium text-tertiary">
                              {t('transactions.amount')}
                            </div>
                            <div className={`mt-1 text-lg font-medium flex items-center ${
                              transaction.coin_amount > 0
                                ? 'text-green-400'
                                : 'text-red-400'
                            }`}>
                              {transaction.coin_amount > 0
                                ? `+${transaction.coin_amount}`
                                : `${transaction.coin_amount}`
                              }
                              <img src={coinImage} alt="coin" className="w-4 h-4 ml-1" />
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-xs font-medium text-tertiary">
                              {t('transactions.remainingBalance')}
                            </div>
                            <div className="mt-1 text-lg font-medium text-secondary flex items-center">
                              {transaction.remaining_coins}
                              <img src={coinImage} alt="coin" className="w-4 h-4 ml-1" />
                            </div>
                          </div>
                          
                          <div className="col-span-2">
                            <div className="text-xs font-medium text-tertiary">
                              {t('transactions.date')}
                            </div>
                            <div className="mt-1 text-sm text-secondary">
                              {formatDate(transaction.created_at || transaction.time)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {filteredTransactions.length > 0 && (
              <div className="mt-6 flex justify-between items-center">
                <div className="text-sm text-tertiary">
                  {t('transactions.pagination.showing', {
                    start: (page - 1) * transactionsPerPage + 1,
                    end: Math.min(page * transactionsPerPage, filteredTransactions.length),
                    total: filteredTransactions.length
                  })}
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={prevPage}
                    disabled={page === 1}
                    className={`p-2 rounded-lg ${
                      page === 1
                        ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                        : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                    } border border-gray-700`}
                  >
                    <FiChevronLeft className="h-5 w-5" />
                  </button>
                  
                  <div className="px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700">
                    {page} / {totalPages}
                  </div>
                  
                  <button
                    onClick={nextPage}
                    disabled={page === totalPages}
                    className={`p-2 rounded-lg ${
                      page === totalPages
                        ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                        : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                    } border border-gray-700`}
                  >
                    <FiChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </Layout>
  );
};

export default TransactionsPage;
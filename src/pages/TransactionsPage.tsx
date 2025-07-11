import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { ThemeContext } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { Layout } from '../components';
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
  FiXCircle
} from 'react-icons/fi';

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  time: string;
  status: string;
}

// Mock transactions data for development or when API is unavailable
const mockTransactions: Transaction[] = [
  {
    id: '1',
    amount: 500,
    type: 'Credit',
    description: 'Welcome bonus',
    time: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    status: 'Completed'
  },
  {
    id: '2',
    amount: 50,
    type: 'Debit',
    description: 'Content generation',
    time: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    status: 'Completed'
  },
  {
    id: '3',
    amount: 100,
    type: 'Credit',
    description: 'Referral reward',
    time: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
    status: 'Completed'
  },
  {
    id: '4',
    amount: 200,
    type: 'Subscription',
    description: 'Monthly subscription',
    time: new Date(Date.now() - 86400000 * 15).toISOString(), // 15 days ago
    status: 'Completed'
  },
  {
    id: '5',
    amount: 75,
    type: 'Refund',
    description: 'Service credit',
    time: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago
    status: 'Completed'
  }
];

const TransactionsPage: React.FC = () => {
  const { darkMode } = useContext(ThemeContext);
  const { user } = useAuth();
  const { userData } = useUser();
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
      // Attempt to fetch from API
      const response = await axios.post('https://main-matrixai-server-lujmidrakh.cn-hangzhou.fcapp.run/AllTransactions', {
        uid: user.id
      });
      
      if (response.data.success) {
        // Map API response to match our Transaction interface
        const formattedTransactions = response.data.data.map((item: any) => ({
          id: item.id?.toString() || '',
          amount: item.coin_amount || 0,
          // Set a default type based on transaction_name
          type: 'Debit', // Default type
          description: item.transaction_name || '',
          time: item.time || new Date().toISOString(),
          status: item.status || 'Completed'
        }));
        
        const sortedTransactions = formattedTransactions.sort((a: any, b: any) => 
          new Date(b.time).getTime() - new Date(a.time).getTime()
        );
        setTransactions(sortedTransactions);
      }
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      setError('Could not connect to the server. Showing sample data instead.');
      
      // Use mock data if API call fails
      setTransactions(mockTransactions);
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

  // Format date
  const formatDate = (dateString: string) => {
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
    return transactions.filter(t => t.type.toLowerCase() === filter.toLowerCase());
  };

  const filteredTransactions = getFilteredTransactions();

  // Get transaction icon based on type
  const getTransactionIcon = (type: string | undefined) => {
    if (!type) return <FiCreditCard className="h-4 w-4" />;
    
    switch (type.toLowerCase()) {
      case 'credit':
        return <FiArrowDown className="h-4 w-4" />;
      case 'debit':
        return <FiArrowUp className="h-4 w-4" />;
      case 'subscription':
        return <FiClock className="h-4 w-4" />;
      case 'refund':
        return <FiCornerLeftUp className="h-4 w-4" />;
      case 'withdrawal':
        return <FiCornerRightUp className="h-4 w-4" />;
      default:
        return <FiCreditCard className="h-4 w-4" />;
    }
  };

  // Get transaction color based on type
  const getTransactionColor = (type: string | undefined) => {
    if (!type) return darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600';
    
    switch (type.toLowerCase()) {
      case 'credit':
        return darkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-600';
      case 'debit':
        return darkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-600';
      case 'subscription':
        return darkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-600';
      case 'refund':
        return darkMode ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-600';
      case 'withdrawal':
        return darkMode ? 'bg-amber-900/50 text-amber-300' : 'bg-amber-100 text-amber-600';
      default:
        return darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600';
    }
  };

  // Get status icon and color
  const getStatusInfo = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return {
          icon: <FiCheckCircle className="h-4 w-4" />,
          color: darkMode ? 'text-green-400' : 'text-green-600'
        };
      case 'pending':
        return {
          icon: <FiClock className="h-4 w-4" />,
          color: darkMode ? 'text-amber-400' : 'text-amber-600'
        };
      case 'failed':
      case 'error':
        return {
          icon: <FiXCircle className="h-4 w-4" />,
          color: darkMode ? 'text-red-400' : 'text-red-600'
        };
      default:
        return {
          icon: <FiCreditCard className="h-4 w-4" />,
          color: darkMode ? 'text-gray-400' : 'text-gray-600'
        };
    }
  };

  return (
    <Layout>
      <div className={`py-8 px-4 lg:px-8 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
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
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Transactions
              </h1>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                View your coin transactions history
              </p>
            </div>

            <div className="flex mt-4 md:mt-0 space-x-3">
              <button 
                onClick={handleRefresh}
                disabled={refreshing}
                className={`flex items-center px-3 py-2 rounded-lg text-sm ${
                  darkMode 
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' 
                    : 'bg-white hover:bg-gray-100 text-gray-700'
                } transition-colors border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
              >
                <FiRefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              
              <button 
                className={`flex items-center px-3 py-2 rounded-lg text-sm ${
                  darkMode 
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' 
                    : 'bg-white hover:bg-gray-100 text-gray-700'
                } transition-colors border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
              >
                <FiDownload className="h-4 w-4 mr-2" />
                <span>Export</span>
              </button>
            </div>
          </motion.div>

          {/* Error message */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 p-4 rounded-lg ${
                darkMode ? 'bg-red-900/20 border border-red-800/30 text-red-300' : 'bg-red-50 border border-red-100 text-red-600'
              }`}
            >
              {error}
            </motion.div>
          )}

          {/* Coins Summary Card */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`rounded-xl ${
              darkMode 
                ? 'bg-gray-800/50 border border-gray-700/50' 
                : 'bg-white border border-gray-100'
            } p-6 mb-8`}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center mb-4 md:mb-0">
                <div className={`p-3 rounded-lg ${
                  darkMode ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-100 text-amber-600'
                } mr-4`}>
                  <FiCreditCard className="h-6 w-6" />
                </div>
                <div>
                  <div className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Current Balance</div>
                  <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {userData?.user_coins || 0} Coins
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <div className="flex flex-col">
                  <div className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Next Expiry</div>
                  <div className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {userData?.coins_expiry 
                      ? new Date(userData.coins_expiry).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})
                      : 'N/A'}
                  </div>
                </div>
                
                <div className="flex flex-col">
                  <div className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Last Update</div>
                  <div className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {userData?.last_coin_addition 
                      ? new Date(userData.last_coin_addition).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})
                      : 'N/A'}
                  </div>
                </div>
                
                <div className="flex flex-col">
                  <div className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Subscription Plan</div>
                  <div className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {userData?.user_plan || 'Free'}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <div className={`text-sm font-medium mr-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <FiFilter className="inline-block mr-1" /> Filter:
            </div>
            {['all', 'credit', 'debit', 'subscription', 'refund'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                  filter === f
                    ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                    : (darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Transactions Table */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className={`rounded-xl overflow-hidden ${
              darkMode 
                ? 'bg-gray-800/50 border border-gray-700/50' 
                : 'bg-white border border-gray-100'
            }`}
          >
            {loading ? (
              <div className="p-8 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className={`p-8 text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No transactions found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}>
                    <tr>
                      <th className={`px-6 py-3 text-left text-xs font-medium ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      } uppercase tracking-wider`}>
                        Type
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      } uppercase tracking-wider`}>
                        Description
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      } uppercase tracking-wider`}>
                        Amount
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      } uppercase tracking-wider`}>
                        Date
                      </th>
                      <th className={`px-6 py-3 text-left text-xs font-medium ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      } uppercase tracking-wider`}>
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredTransactions.map((transaction, index) => {
                      const statusInfo = getStatusInfo(transaction.status);
                      
                      return (
                        <tr 
                          key={transaction.id || index}
                          className={darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={`p-2 rounded-lg mr-3 ${getTransactionColor(transaction.type)}`}>
                                {getTransactionIcon(transaction.type)}
                              </div>
                              <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {transaction.type}
                              </div>
                            </div>
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                            darkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            {transaction.description}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                            transaction.type && (transaction.type.toLowerCase() === 'credit' || transaction.type.toLowerCase() === 'refund')
                              ? (darkMode ? 'text-green-400' : 'text-green-600')
                              : (darkMode ? 'text-red-400' : 'text-red-600')
                          }`}>
                            {transaction.type && (transaction.type.toLowerCase() === 'credit' || transaction.type.toLowerCase() === 'refund')
                              ? `+${transaction.amount}`
                              : `-${transaction.amount}`
                            } Coins
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                            darkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            {formatDate(transaction.time)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className={`flex items-center ${statusInfo.color}`}>
                              {statusInfo.icon}
                              <span className="ml-1.5">{transaction.status}</span>
                            </div>
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
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { Layout } from '../components';
import { userService } from '../services/userService';
import { useTranslation } from 'react-i18next';
import { 
  FiShoppingBag, 
  FiCalendar, 
  FiDollarSign, 
  FiPackage, 
  FiFilter,
  FiDownload,
  FiClock,
  FiRefreshCw,
  FiCheckCircle,
  FiXCircle,
  FiList,
  FiGrid,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';

interface Order {
  id: number;
  uid: string;
  plan_name: string;
  total_price: number;
  coins_added: number;
  plan_valid_till: string;
  coupon_id: number | null;
  created_at: string;
  status: string;
}

const OrderHistoryPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { userData } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const ordersPerPage = 6;

  // Fetch orders from API
  const fetchOrders = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await userService.getUserOrder(user.id);
      
      if (response.success) {
        const sortedOrders = response.data.sort((a: Order, b: Order) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setOrders(sortedOrders);
      }
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      setError(t('orderHistory.errors.connectionError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, [user?.id]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
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

  // Get filtered orders
  const getFilteredOrders = () => {
    if (filter === 'all') return orders;
    return orders.filter(o => o.status.toLowerCase() === filter.toLowerCase());
  };

  const filteredOrders = getFilteredOrders();
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const paginatedOrders = filteredOrders.slice(
    (page - 1) * ordersPerPage,
    page * ordersPerPage
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

  // Get order status info (icon and color)
  const getStatusInfo = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'completed':
        return {
          icon: <FiCheckCircle className="h-5 w-5" />,
          color: 'text-green-400',
          bgColor: 'bg-green-900/20'
        };
      case 'pending':
        return {
          icon: <FiClock className="h-5 w-5" />,
          color: 'text-amber-400',
          bgColor: 'bg-amber-900/20'
        };
      case 'expired':
      case 'failed':
        return {
          icon: <FiXCircle className="h-5 w-5" />,
          color: 'text-red-400',
          bgColor: 'bg-red-900/20'
        };
      default:
        return {
          icon: <FiPackage className="h-5 w-5" />,
          color: 'text-blue-400',
          bgColor: 'bg-blue-900/20'
        };
    }
  };

  // Calculate total spending
  const totalSpending = orders.reduce((sum, order) => sum + order.total_price, 0);
  
  // Calculate total coins added
  const totalCoinsAdded = orders.reduce((sum, order) => sum + order.coins_added, 0);

  return (
    <Layout>
      <div className="py-8 px-4 lg:px-8 page-background dark">
        {/* Background gradient effects */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10 blur-3xl opacity-70"></div>
          <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-blue-500/10 via-cyan-500/5 to-teal-500/10 blur-3xl opacity-70"></div>
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
                {t('orderHistory.title')}
              </h1>
              <p className="text-tertiary mt-1">
                {t('orderHistory.subtitle')}
              </p>
            </div>

            <div className="flex mt-4 md:mt-0 space-x-3">
              <button 
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center px-3 py-2 rounded-lg text-sm bg-gray-800 hover:bg-gray-700 text-gray-200 transition-colors border border-gray-700"
              >
                <FiRefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? t('orderHistory.refreshing') : t('orderHistory.refresh')}</span>
              </button>
              
              <button 
                className="flex items-center px-3 py-2 rounded-lg text-sm bg-gray-800 hover:bg-gray-700 text-gray-200 transition-colors border border-gray-700"
              >
                <FiDownload className="h-4 w-4 mr-2" />
                <span>{t('orderHistory.export')}</span>
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

          {/* Summary Cards */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            {/* Total Orders */}
            <div className="rounded-xl p-6 glass-effect border border-gray-700/50">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-900/30 text-blue-300 mr-4">
                  <FiShoppingBag className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-medium text-tertiary">{t('orderHistory.totalOrders')}</div>
                  <div className="text-2xl font-bold text-primary">
                    {orders.length}
                  </div>
                </div>
              </div>
            </div>

            {/* Total Spending */}
            <div className="rounded-xl p-6 glass-effect border border-gray-700/50">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-green-900/30 text-green-300 mr-4">
                  <FiDollarSign className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-medium text-tertiary">{t('orderHistory.totalSpending')}</div>
                  <div className="text-2xl font-bold text-primary">
                    ${totalSpending.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Total Coins */}
            <div className="rounded-xl p-6 glass-effect border border-gray-700/50">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-amber-900/30 text-amber-300 mr-4">
                  <FiPackage className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-medium text-tertiary">{t('orderHistory.totalCoinsAdded')}</div>
                  <div className="text-2xl font-bold text-primary">
                    {totalCoinsAdded}
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
                {t('orderHistory.view')}:
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

          {/* Orders Display */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {loading ? (
              <div className="rounded-xl p-20 flex justify-center items-center glass-effect border border-gray-700/50">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="rounded-xl p-12 text-center glass-effect border border-gray-700/50 text-tertiary">
                <FiShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2 text-secondary">{t('orderHistory.noOrdersFound')}</h3>
                <p>{t('orderHistory.noPurchasesYet')}</p>
              </div>
            ) : viewMode === 'list' ? (
              // List View
              <div className="rounded-xl overflow-hidden glass-effect border border-gray-700/50">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-700/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          {t('orderHistory.table.orderId')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          {t('orderHistory.table.plan')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          {t('orderHistory.table.date')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          {t('orderHistory.table.amount')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          {t('orderHistory.table.coins')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          {t('orderHistory.table.validTill')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          {t('orderHistory.table.status')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {paginatedOrders.map((order) => {
                        const statusInfo = getStatusInfo(order.status);
                        
                        return (
                          <tr 
                            key={order.id}
                            className="hover:bg-gray-700/50"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">
                              #{order.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                              {order.plan_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                              {formatDate(order.created_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">
                              ${order.total_price.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                              +{order.coins_added}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                              {formatDate(order.plan_valid_till)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}>
                                {statusInfo.icon}
                                <span className="ml-1.5">{order.status}</span>
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
                {paginatedOrders.map((order) => {
                  const statusInfo = getStatusInfo(order.status);
                  
                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="rounded-xl overflow-hidden bg-gray-800/50 border border-gray-700/50 hover:border-indigo-700/50 transition-all duration-300 hover:shadow-lg"
                    >
                      <div className="p-5 border-b border-gray-700/50">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-medium text-primary">
                            {order.plan_name}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color} ${statusInfo.bgColor}`}>
                            {statusInfo.icon}
                            <span className="ml-1.5">{order.status}</span>
                          </span>
                        </div>
                        <div className="text-sm mt-1 text-tertiary">
                          {t('orderHistory.orderNumber', { id: order.id })}
                        </div>
                      </div>
                      
                      <div className="p-5">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs font-medium text-tertiary">
                              {t('orderHistory.purchaseDate')}
                            </div>
                            <div className="mt-1 text-sm text-secondary">
                              {formatDate(order.created_at)}
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-xs font-medium text-tertiary">
                              {t('orderHistory.validUntil')}
                            </div>
                            <div className="mt-1 text-sm text-secondary">
                              {formatDate(order.plan_valid_till)}
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-xs font-medium text-tertiary">
                              {t('orderHistory.amount')}
                            </div>
                            <div className="mt-1 text-sm font-medium text-amber-400">
                              ${order.total_price.toFixed(2)}
                            </div>
                          </div>
                          
                          <div>
                            <div className="text-xs font-medium text-tertiary">
                              {t('orderHistory.coinsAdded')}
                            </div>
                            <div className="mt-1 text-sm font-medium text-secondary">
                              +{order.coins_added}
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
            {filteredOrders.length > 0 && (
              <div className="mt-6 flex justify-between items-center">
                <div className="text-sm text-tertiary">
                  {t('orderHistory.pagination.showing', {
                    start: (page - 1) * ordersPerPage + 1,
                    end: Math.min(page * ordersPerPage, filteredOrders.length),
                    total: filteredOrders.length
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

export default OrderHistoryPage;
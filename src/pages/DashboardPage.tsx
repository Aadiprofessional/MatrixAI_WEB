import React, { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiMessageSquare, 
  FiImage,
  FiVideo,
  FiFileText,
  FiBarChart2,
  FiPenTool,
  FiLayers,
  FiCpu,
  FiStar,
  FiPlus,
  FiUser,
  FiSettings,
  FiClock,
  FiMic,
  FiDollarSign,
  FiTrendingUp,
  FiActivity,
  FiCalendar,
  FiTarget,
  FiArrowRight
} from 'react-icons/fi';
import { ThemeContext } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { userService } from '../services/userService';
import { videoService } from '../services/videoService';

interface DashboardStats {
  totalCoins: number;
  coinsUsed: number;
  videoCount: number;
  chatMessages: number;
  contentGenerated: number;
  subscriptionStatus: string;
  lastActivity: string;
}

interface RecentActivity {
  id: string;
  type: 'chat' | 'video' | 'content' | 'audio';
  title: string;
  date: string;
  coins: number;
}

interface LoadingState {
  coins: boolean;
  userInfo: boolean;
  transactions: boolean;
  videos: boolean;
}

// Skeleton Components
const SkeletonCard = ({ className = "" }: { className?: string }) => {
  const { darkMode } = useContext(ThemeContext);
  
  return (
    <div className={`relative overflow-hidden rounded-xl border ${
      darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
    } ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent 
                      animate-pulse transform -skew-x-12 opacity-30"></div>
      <div className="p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className={`w-8 h-8 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-300'} animate-pulse`}></div>
          <div className={`w-16 h-4 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-300'} animate-pulse`}></div>
        </div>
        <div className={`w-24 h-6 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-300'} animate-pulse`}></div>
        <div className={`w-32 h-8 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-300'} animate-pulse`}></div>
      </div>
    </div>
  );
};

const SkeletonActivityItem = () => {
  const { darkMode } = useContext(ThemeContext);
  
  return (
    <div className={`p-4 rounded-lg border ${
      darkMode ? 'bg-gray-800/30 border-gray-700' : 'bg-gray-50 border-gray-200'
    } relative overflow-hidden`}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent 
                      animate-pulse transform -skew-x-12 opacity-50"></div>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-300'} animate-pulse`}></div>
          <div className="space-y-2">
            <div className={`w-32 h-4 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-300'} animate-pulse`}></div>
            <div className={`w-20 h-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-300'} animate-pulse`}></div>
          </div>
        </div>
        <div className={`w-12 h-4 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-300'} animate-pulse`}></div>
      </div>
    </div>
  );
};

const AIToolSection = ({ title, icon, description, color, route, isPopular = false }: { 
  title: string, 
  icon: React.ReactNode, 
  description: string, 
  color: string,
  route: string,
  isPopular?: boolean
}) => {
  const { darkMode } = useContext(ThemeContext);

  return (
    <Link to={route} className="block group">
      <div className={`relative h-full rounded-xl p-6 transition-all duration-300 ${
        darkMode 
          ? 'bg-gray-800/50 hover:bg-gray-800/80 border border-gray-700/50' 
          : 'bg-white hover:bg-white/80 border border-gray-100'
      } hover:shadow-lg hover:scale-105`}>
        {isPopular && (
          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
            Popular
          </div>
        )}
        <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center mb-4`}>
          {icon}
        </div>
        <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>{description}</p>
        <div className={`text-sm font-medium ${
          darkMode ? 'text-blue-400' : 'text-blue-600'
        } flex items-center group-hover:text-blue-500 transition-colors`}>
          Get started
          <FiArrowRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
};

const DashboardPage: React.FC = () => {
  const { darkMode } = useContext(ThemeContext);
  const { userData, isPro } = useUser();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalCoins: 0,
    coinsUsed: 0,
    videoCount: 0,
    chatMessages: 0,
    contentGenerated: 0,
    subscriptionStatus: 'Free',
    lastActivity: new Date().toISOString()
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    coins: true,
    userInfo: true,
    transactions: true,
    videos: true
  });
  const [currentDate] = useState(new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }));

  // Parallel data fetching
  useEffect(() => {
    if (!user?.id) {
      setLoadingState({ coins: false, userInfo: false, transactions: false, videos: false });
      return;
    }

    // Fetch coins data
    const fetchCoins = async () => {
      try {
        const coinsResponse = await userService.getUserCoins(user.id);
        setDashboardStats(prev => ({ ...prev, totalCoins: coinsResponse.coins || 0 }));
      } catch (error) {
        console.error('Error fetching coins:', error);
      } finally {
        setLoadingState(prev => ({ ...prev, coins: false }));
      }
    };

    // Fetch user info
    const fetchUserInfo = async () => {
      try {
        const userInfoResponse = await userService.getUserInfo(user.id);
        setDashboardStats(prev => ({ 
          ...prev, 
          subscriptionStatus: userInfoResponse.data?.subscription_active ? 'Pro' : 'Free' 
        }));
      } catch (error) {
        console.error('Error fetching user info:', error);
      } finally {
        setLoadingState(prev => ({ ...prev, userInfo: false }));
      }
    };

    // Fetch transactions
    const fetchTransactions = async () => {
      try {
        const transactionsResponse = await userService.getAllTransactions(user.id);
        const transactions = transactionsResponse.data || [];
        
        const coinsUsed = transactions
          .filter((t: any) => t.coin_amount < 0)
          .reduce((sum: number, t: any) => sum + Math.abs(t.coin_amount), 0);

        const chatMessages = transactions
          .filter((t: any) => t.transaction_name?.includes('chat'))
          .length;

        const contentGenerated = transactions
          .filter((t: any) => t.transaction_name?.includes('content'))
          .length;

        const activities: RecentActivity[] = transactions
          .slice(0, 5)
          .map((t: any) => ({
            id: t.id?.toString() || '',
            type: t.transaction_name?.includes('chat') ? 'chat' : 
                  t.transaction_name?.includes('video') ? 'video' :
                  t.transaction_name?.includes('content') ? 'content' : 'audio',
            title: t.transaction_name?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Activity',
            date: new Date(t.time).toLocaleDateString(),
            coins: Math.abs(t.coin_amount || 0)
          }));

        setDashboardStats(prev => ({ 
          ...prev, 
          coinsUsed, 
          chatMessages, 
          contentGenerated,
          lastActivity: transactions[0]?.time || new Date().toISOString()
        }));
        setRecentActivity(activities);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoadingState(prev => ({ ...prev, transactions: false }));
      }
    };

    // Fetch videos
    const fetchVideos = async () => {
      try {
        const videosResponse = await videoService.getAllVideos(user.id);
        setDashboardStats(prev => ({ 
          ...prev, 
          videoCount: videosResponse.videos?.length || 0 
        }));
      } catch (error) {
        console.log('Videos not available:', error);
      } finally {
        setLoadingState(prev => ({ ...prev, videos: false }));
      }
    };

    // Execute all fetches in parallel
    fetchCoins();
    fetchUserInfo();
    fetchTransactions();
    fetchVideos();
  }, [user?.id]);

  const isLoading = Object.values(loadingState).some(loading => loading);

  return (
    <div className={`py-8 px-4 lg:px-8 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} min-h-screen`}>
      {/* Background gradient effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-purple-500/10 blur-3xl opacity-70"></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-purple-500/10 via-pink-500/5 to-blue-500/10 blur-3xl opacity-70"></div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start mb-8 gap-4">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}
            >
              {t('dashboard.welcome')}, {userData?.name?.split(' ')[0] || 'User'}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1 flex items-center gap-2`}
            >
              <FiCalendar className="w-4 h-4" />
              {currentDate} • {t('dashboard.subtitle')}
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="flex gap-3"
          >
            <Link to="/profile" className={`p-3 rounded-lg flex items-center ${
              darkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' : 'bg-white hover:bg-gray-100 text-gray-700'
            } transition-colors shadow-sm`}>
              <FiUser className="h-5 w-5" />
            </Link>
            <Link to="/settings" className={`p-3 rounded-lg flex items-center ${
              darkMode ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' : 'bg-white hover:bg-gray-100 text-gray-700'
            } transition-colors shadow-sm`}>
              <FiSettings className="h-5 w-5" />
            </Link>
            <Link 
              to="/chat" 
              className={`px-6 py-3 rounded-lg flex items-center gap-2 ${
                darkMode
                  ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white'
                  : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white'
              } shadow-lg hover:shadow-xl transition-all`}
            >
              <FiMessageSquare className="h-4 w-4" />
              <span>{t('dashboard.startChat')}</span>
            </Link>
          </motion.div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {/* Coins Card */}
          {loadingState.coins ? (
            <SkeletonCard />
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`rounded-xl p-6 ${
                darkMode 
                  ? 'bg-gray-800/50 border border-gray-700/50 backdrop-blur-sm' 
                  : 'bg-white border border-gray-100 shadow-sm'
              } hover:shadow-lg transition-shadow`}
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm font-medium`}>{t('dashboard.coins')}</span>
                  <span className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{dashboardStats.totalCoins.toLocaleString()}</span>
                </div>
                <div className="w-12 h-12 rounded-lg bg-yellow-500 flex items-center justify-center text-white shadow-sm">
                  <FiDollarSign size={20} />
                </div>
              </div>
              <div className={`mt-3 text-xs ${darkMode ? 'text-yellow-400' : 'text-yellow-600'} flex items-center gap-1`}>
                <FiTrendingUp className="w-3 h-3" />
                <span>{dashboardStats.coinsUsed} {t('dashboard.coinsUsed')}</span>
              </div>
            </motion.div>
          )}

          {/* Chat Messages Card */}
          {loadingState.transactions ? (
            <SkeletonCard />
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className={`rounded-xl p-6 ${
                darkMode 
                  ? 'bg-gray-800/50 border border-gray-700/50 backdrop-blur-sm' 
                  : 'bg-white border border-gray-100 shadow-sm'
              } hover:shadow-lg transition-shadow`}
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm font-medium`}>{t('dashboard.chatMessages')}</span>
                  <span className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{dashboardStats.chatMessages}</span>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center text-white shadow-sm">
                  <FiMessageSquare size={20} />
                </div>
              </div>
              <div className={`mt-3 text-xs ${darkMode ? 'text-blue-400' : 'text-blue-600'} flex items-center gap-1`}>
                <FiTrendingUp className="w-3 h-3" />
                <span>{t('dashboard.thisMonth')}</span>
              </div>
            </motion.div>
          )}

          {/* Videos Created Card */}
          {loadingState.videos ? (
            <SkeletonCard />
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className={`rounded-xl p-6 ${
                darkMode 
                  ? 'bg-gray-800/50 border border-gray-700/50 backdrop-blur-sm' 
                  : 'bg-white border border-gray-100 shadow-sm'
              } hover:shadow-lg transition-shadow`}
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm font-medium`}>{t('dashboard.videosCreated')}</span>
                  <span className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{dashboardStats.videoCount}</span>
                </div>
                <div className="w-12 h-12 rounded-lg bg-purple-500 flex items-center justify-center text-white shadow-sm">
                  <FiVideo size={20} />
                </div>
              </div>
              <div className={`mt-3 text-xs ${darkMode ? 'text-purple-400' : 'text-purple-600'} flex items-center gap-1`}>
                <FiTrendingUp className="w-3 h-3" />
                <span>total</span>
              </div>
            </motion.div>
          )}

          {/* Subscription Card */}
          {loadingState.userInfo ? (
            <SkeletonCard />
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className={`rounded-xl p-6 ${
                darkMode 
                  ? 'bg-gray-800/50 border border-gray-700/50 backdrop-blur-sm' 
                  : 'bg-white border border-gray-100 shadow-sm'
              } hover:shadow-lg transition-shadow`}
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm font-medium`}>Subscription</span>
                  <span className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{dashboardStats.subscriptionStatus}</span>
                </div>
                <div className={`w-12 h-12 rounded-lg ${isPro ? 'bg-green-500' : 'bg-gray-500'} flex items-center justify-center text-white shadow-sm`}>
                  <FiStar size={20} />
                </div>
              </div>
              <div className={`mt-3 text-xs ${darkMode ? 'text-green-400' : 'text-green-600'} flex items-center gap-1`}>
                <FiTrendingUp className="w-3 h-3" />
                <span>{isPro ? 'Active' : 'Upgrade available'}</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* AI Tools Section */}
          <div className="lg:col-span-2">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  AI Tools
                </h2>
                <Link to="/tools" className={`text-sm flex items-center gap-1 ${
                  darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                } font-medium`}>
                  View all tools
                  <FiArrowRight className="w-4 h-4" />
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AIToolSection 
                  title="Chat Assistant" 
                  icon={<FiMessageSquare className="text-white text-xl" />} 
                  description="Get answers, ideas, and assistance through natural conversation." 
                  color="bg-gradient-to-r from-blue-500 to-cyan-500"
                  route="/chat"
                  isPopular={true}
                />
                
                <AIToolSection 
                  title="Video Creator" 
                  icon={<FiVideo className="text-white text-xl" />} 
                  description="Transform ideas into captivating videos with AI." 
                  color="bg-gradient-to-r from-purple-500 to-pink-600"
                  route="/tools/video-creator"
                />
                
                <AIToolSection 
                  title="Content Writer" 
                  icon={<FiFileText className="text-white text-xl" />} 
                  description="Generate high-quality articles, essays, and content." 
                  color="bg-gradient-to-r from-green-500 to-emerald-600"
                  route="/tools/content-writer"
                />
                
                <AIToolSection 
                  title="Speech to Text" 
                  icon={<FiMic className="text-white text-xl" />} 
                  description="Convert audio files to accurate text transcriptions." 
                  color="bg-gradient-to-r from-orange-500 to-red-500"
                  route="/tools/speech-to-text"
                />
              </div>
            </motion.div>
          </div>

          {/* Recent Activity Sidebar */}
          <div className="lg:col-span-1">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
              className={`rounded-xl p-6 ${
                darkMode 
                  ? 'bg-gray-800/50 border border-gray-700/50 backdrop-blur-sm' 
                  : 'bg-white border border-gray-100 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {t('dashboard.recentActivity')}
                </h3>
                <FiActivity className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </div>
              
              {loadingState.transactions ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, index) => (
                    <SkeletonActivityItem key={index} />
                  ))}
                </div>
              ) : recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className={`flex items-center gap-3 p-3 rounded-lg ${
                      darkMode ? 'bg-gray-700/30' : 'bg-gray-50'
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.type === 'chat' ? 'bg-blue-500' :
                        activity.type === 'video' ? 'bg-purple-500' :
                        activity.type === 'content' ? 'bg-green-500' : 'bg-orange-500'
                      }`}>
                        {activity.type === 'chat' ? <FiMessageSquare className="w-4 h-4 text-white" /> :
                         activity.type === 'video' ? <FiVideo className="w-4 h-4 text-white" /> :
                         activity.type === 'content' ? <FiFileText className="w-4 h-4 text-white" /> :
                         <FiMic className="w-4 h-4 text-white" />}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {activity.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {activity.date}
                          </span>
                          <span className="text-xs text-yellow-500 flex items-center gap-1">
                            <FiDollarSign className="w-3 h-3" />
                            {activity.coins}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FiActivity className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No recent activity yet
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} mt-1`}>
                    Start using AI tools to see your activity here
                  </p>
                </div>
              )}
            </motion.div>

            {/* Quick Actions */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.8 }}
              className={`mt-6 rounded-xl p-6 ${
                darkMode 
                  ? 'bg-gray-800/50 border border-gray-700/50 backdrop-blur-sm' 
                  : 'bg-white border border-gray-100 shadow-sm'
              }`}
            >
              <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Link 
                  to="/chat" 
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    darkMode ? 'hover:bg-gray-700/50 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <FiMessageSquare className="w-4 h-4" />
                  <span className="text-sm">Start new chat</span>
                </Link>
                <Link 
                  to="/tools/video-creator" 
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    darkMode ? 'hover:bg-gray-700/50 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <FiVideo className="w-4 h-4" />
                  <span className="text-sm">Create video</span>
                </Link>
                <Link 
                  to="/buy" 
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    darkMode ? 'hover:bg-gray-700/50 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <FiDollarSign className="w-4 h-4" />
                  <span className="text-sm">Buy more coins</span>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 
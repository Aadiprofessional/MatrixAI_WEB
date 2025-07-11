import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiCheckCircle, 
  FiAlertCircle, 
  FiXCircle, 
  FiClock, 
  FiServer, 
  FiDatabase, 
  FiGlobe, 
  FiShield,
  FiMail,
  FiPhone,
  FiActivity,
  FiTrendingUp,
  FiZap
} from 'react-icons/fi';

interface ServiceStatus {
  id: string;
  name: string;
  status: 'operational' | 'degraded' | 'outage' | 'maintenance';
  description: string;
  uptime: number;
  responseTime: number;
  icon: React.ReactNode;
}

interface Incident {
  id: string;
  title: string;
  description: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  severity: 'low' | 'medium' | 'high' | 'critical';
  startTime: string;
  endTime?: string;
  updates: {
    time: string;
    message: string;
    status: string;
  }[];
}

const StatusPage: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const services: ServiceStatus[] = [
    {
      id: 'api',
      name: 'API Services',
      status: 'operational',
      description: 'Core API endpoints and AI model access',
      uptime: 99.98,
      responseTime: 245,
      icon: <FiServer className="h-6 w-6" />
    },
    {
      id: 'chat',
      name: 'Chat Interface',
      status: 'operational',
      description: 'Real-time chat and conversation features',
      uptime: 99.95,
      responseTime: 180,
      icon: <FiActivity className="h-6 w-6" />
    },
    {
      id: 'image-gen',
      name: 'Image Generation',
      status: 'operational',
      description: 'AI-powered image creation and editing',
      uptime: 99.92,
      responseTime: 3200,
      icon: <FiZap className="h-6 w-6" />
    },
    {
      id: 'database',
      name: 'Database',
      status: 'operational',
      description: 'User data and content storage',
      uptime: 99.99,
      responseTime: 95,
      icon: <FiDatabase className="h-6 w-6" />
    },
    {
      id: 'cdn',
      name: 'Content Delivery',
      status: 'operational',
      description: 'Global content distribution network',
      uptime: 99.97,
      responseTime: 120,
      icon: <FiGlobe className="h-6 w-6" />
    },
    {
      id: 'auth',
      name: 'Authentication',
      status: 'operational',
      description: 'User login and security services',
      uptime: 99.96,
      responseTime: 210,
      icon: <FiShield className="h-6 w-6" />
    }
  ];

  const incidents: Incident[] = [
    {
      id: '1',
      title: 'Resolved: Intermittent API Timeouts',
      description: 'Some users experienced slower response times during peak hours',
      status: 'resolved',
      severity: 'medium',
      startTime: '2024-01-14T10:30:00Z',
      endTime: '2024-01-14T11:45:00Z',
      updates: [
        {
          time: '2024-01-14T11:45:00Z',
          message: 'Issue has been fully resolved. All services are operating normally.',
          status: 'resolved'
        },
        {
          time: '2024-01-14T11:15:00Z',
          message: 'We have implemented a fix and are monitoring the situation.',
          status: 'monitoring'
        },
        {
          time: '2024-01-14T10:45:00Z',
          message: 'We have identified the cause as increased traffic load and are scaling our infrastructure.',
          status: 'identified'
        },
        {
          time: '2024-01-14T10:30:00Z',
          message: 'We are investigating reports of slower API response times.',
          status: 'investigating'
        }
      ]
    },
    {
      id: '2',
      title: 'Scheduled Maintenance: Database Optimization',
      description: 'Routine database maintenance to improve performance',
      status: 'resolved',
      severity: 'low',
      startTime: '2024-01-12T02:00:00Z',
      endTime: '2024-01-12T04:30:00Z',
      updates: [
        {
          time: '2024-01-12T04:30:00Z',
          message: 'Maintenance completed successfully. All systems are fully operational.',
          status: 'resolved'
        },
        {
          time: '2024-01-12T02:00:00Z',
          message: 'Scheduled maintenance has begun. Some features may be temporarily unavailable.',
          status: 'monitoring'
        }
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'text-green-600 dark:text-green-400';
      case 'degraded':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'outage':
        return 'text-red-600 dark:text-red-400';
      case 'maintenance':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <FiCheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />;
      case 'degraded':
        return <FiAlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
      case 'outage':
        return <FiXCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
      case 'maintenance':
        return <FiClock className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
      default:
        return <FiAlertCircle className="h-5 w-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'high':
        return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200';
      case 'critical':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      default:
        return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200';
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleString();
  };

  const overallStatus = services.every(service => service.status === 'operational') 
    ? 'All Systems Operational' 
    : services.some(service => service.status === 'outage')
    ? 'Service Disruption'
    : 'Partial Service Degradation';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-green-600 to-blue-600 py-20">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <FiActivity className="h-16 w-16 text-white mx-auto mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              System Status
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8">
              Real-time status and performance metrics for all MatrixAI services and infrastructure.
            </p>
            <div className="text-white/80">
              <p className="mb-2">Current Status: <span className="font-semibold">{overallStatus}</span></p>
              <p>Last Updated: {currentTime.toLocaleString()}</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Overall Status */}
      <section className="py-8 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-4">
            {overallStatus === 'All Systems Operational' ? (
              <>
                <FiCheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {overallStatus}
                </span>
              </>
            ) : (
              <>
                <FiAlertCircle className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {overallStatus}
                </span>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Service Status */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Service Status
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Current status of all MatrixAI services and infrastructure
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-blue-600 dark:text-blue-400">
                    {service.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {service.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {service.description}
                    </p>
                  </div>
                  {getStatusIcon(service.status)}
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                    <span className={`text-sm font-medium capitalize ${getStatusColor(service.status)}`}>
                      {service.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Uptime:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {service.uptime}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Response Time:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {service.responseTime}ms
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Incident History */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Recent Incidents
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Past incidents and their resolution status
            </p>
          </div>

          <div className="space-y-6">
            {incidents.map((incident, index) => (
              <motion.div
                key={incident.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {incident.title}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                        {incident.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      {incident.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>Started: {formatTime(incident.startTime)}</span>
                      {incident.endTime && (
                        <span>Resolved: {formatTime(incident.endTime)}</span>
                      )}
                    </div>
                  </div>
                  {getStatusIcon(incident.status)}
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">Updates:</h4>
                  {incident.updates.map((update, updateIndex) => (
                    <div key={updateIndex} className="flex gap-3 text-sm">
                      <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {formatTime(update.time)}
                      </span>
                      <span className="text-gray-700 dark:text-gray-300">
                        {update.message}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Performance Metrics */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Performance Metrics
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Key performance indicators for the past 30 days
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md text-center"
            >
              <FiTrendingUp className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-4" />
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">99.97%</div>
              <div className="text-gray-600 dark:text-gray-400">Overall Uptime</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md text-center"
            >
              <FiZap className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">185ms</div>
              <div className="text-gray-600 dark:text-gray-400">Avg Response Time</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md text-center"
            >
              <FiServer className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-4" />
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">2.1M</div>
              <div className="text-gray-600 dark:text-gray-400">API Requests</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md text-center"
            >
              <FiCheckCircle className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-4" />
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">99.8%</div>
              <div className="text-gray-600 dark:text-gray-400">Success Rate</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              Need Help or Have Questions?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              If you're experiencing issues not reflected on this page, please contact our support team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:matrixai.global@gmail.com"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
              >
                <FiMail className="h-5 w-5" />
                Email Support
              </a>
              <a
                href="/contact"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <FiPhone className="h-5 w-5" />
                Contact Form
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default StatusPage; 
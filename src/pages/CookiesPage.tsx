import React from 'react';
import { motion } from 'framer-motion';
import { FiPackage, FiSettings, FiShield, FiBarChart, FiMail, FiPhone, FiToggleLeft, FiToggleRight } from 'react-icons/fi';

const CookiesPage: React.FC = () => {
  const cookieTypes = [
    {
      id: 'essential',
      title: 'Essential Cookies',
      icon: <FiShield className="h-6 w-6" />,
      description: 'These cookies are necessary for the website to function properly and cannot be disabled.',
      examples: [
        'Authentication cookies to keep you logged in',
        'Security cookies to protect against attacks',
        'Session cookies to maintain your preferences',
        'Load balancing cookies for optimal performance'
      ],
      required: true
    },
    {
      id: 'functional',
      title: 'Functional Cookies',
      icon: <FiSettings className="h-6 w-6" />,
      description: 'These cookies enable enhanced functionality and personalization.',
      examples: [
        'Language and region preferences',
        'Theme and display settings (dark/light mode)',
        'Accessibility preferences',
        'Customized dashboard layouts'
      ],
      required: false
    },
    {
      id: 'analytics',
      title: 'Analytics Cookies',
      icon: <FiBarChart className="h-6 w-6" />,
      description: 'These cookies help us understand how visitors interact with our website.',
      examples: [
        'Google Analytics for usage statistics',
        'Performance monitoring cookies',
        'A/B testing cookies for feature improvements',
        'User behavior tracking (anonymized)'
      ],
      required: false
    },
    {
      id: 'marketing',
      title: 'Marketing Cookies',
      icon: <FiPackage className="h-6 w-6" />,
      description: 'These cookies are used to deliver relevant advertisements and track campaign effectiveness.',
      examples: [
        'Social media integration cookies',
        'Advertising platform cookies',
        'Remarketing and retargeting cookies',
        'Campaign attribution cookies'
      ],
      required: false
    }
  ];

  const thirdPartyServices = [
    {
      name: 'Google Analytics',
      purpose: 'Website analytics and performance monitoring',
      dataCollected: 'Usage patterns, page views, session duration',
      retention: '26 months',
      optOut: 'https://tools.google.com/dlpage/gaoptout'
    },
    {
      name: 'Stripe',
      purpose: 'Payment processing and fraud prevention',
      dataCollected: 'Payment information, transaction data',
      retention: '7 years (regulatory requirement)',
      optOut: 'N/A (essential for payment processing)'
    },
    {
      name: 'Intercom',
      purpose: 'Customer support and communication',
      dataCollected: 'Support conversations, user preferences',
      retention: '2 years',
      optOut: 'Contact support to disable'
    },
    {
      name: 'Hotjar',
      purpose: 'User experience analysis and heatmaps',
      dataCollected: 'Mouse movements, clicks, scroll behavior',
      retention: '365 days',
      optOut: 'https://www.hotjar.com/legal/compliance/opt-out'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-orange-600 to-red-600 py-20">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <FiPackage className="h-16 w-16 text-white mx-auto mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Cookie Policy
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8">
              Learn about how MatrixAI uses cookies and similar technologies to enhance your experience and provide our services.
            </p>
            <div className="text-white/80">
              <p className="mb-2">Last updated: January 15, 2024</p>
              <p>Effective date: January 15, 2024</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* What Are Cookies Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              What Are Cookies?
            </h2>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-8">
              <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                Cookies are small text files that are stored on your device when you visit our website. They help us provide you with a better experience by remembering your preferences, keeping you logged in, and analyzing how you use our services.
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                We use both first-party cookies (set by MatrixAI) and third-party cookies (set by our partners) to enhance functionality, provide analytics, and deliver relevant content.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Cookie Types Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Types of Cookies We Use
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              We use different types of cookies for various purposes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {cookieTypes.map((type, index) => (
              <motion.div
                key={type.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-md"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="text-orange-600 dark:text-orange-400">
                    {type.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {type.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      {type.required ? (
                        <span className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded text-sm">
                          Required
                        </span>
                      ) : (
                        <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded text-sm">
                          Optional
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {type.description}
                </p>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">Examples:</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    {type.examples.map((example, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Third-Party Services Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Third-Party Services
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              We work with trusted partners who may also set cookies
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-white">Service</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-white">Purpose</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-white">Data Collected</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-white">Retention</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-white">Opt-Out</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {thirdPartyServices.map((service, index) => (
                  <motion.tr
                    key={service.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {service.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {service.purpose}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {service.dataCollected}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {service.retention}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {service.optOut.startsWith('http') ? (
                        <a
                          href={service.optOut}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-orange-600 dark:text-orange-400 hover:underline"
                        >
                          Opt-out link
                        </a>
                      ) : (
                        <span className="text-gray-600 dark:text-gray-400">
                          {service.optOut}
                        </span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Managing Cookies Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
              Managing Your Cookie Preferences
            </h2>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Browser Settings
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    You can control cookies through your browser settings:
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li>• Block all cookies</li>
                    <li>• Block third-party cookies only</li>
                    <li>• Delete existing cookies</li>
                    <li>• Set cookies to expire when you close your browser</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Cookie Consent
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    You can manage your cookie preferences at any time:
                  </p>
                  <button className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors">
                    Cookie Preferences
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Updates Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Updates to This Policy
            </h2>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-8">
              <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                We may update this Cookie Policy from time to time to reflect changes in our practices or applicable laws. We will notify you of any material changes by posting the updated policy on our website.
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                We encourage you to review this policy periodically to stay informed about how we use cookies and similar technologies.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-orange-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              Questions About Cookies?
            </h2>
            <p className="text-xl text-orange-100 mb-8">
              If you have any questions about our use of cookies or this Cookie Policy, please don't hesitate to contact us.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:matrixai.global@gmail.com"
                className="bg-white text-orange-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
              >
                <FiMail className="h-5 w-5" />
                Email Us
              </a>
              <a
                href="/contact"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-orange-600 transition-colors flex items-center justify-center gap-2"
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

export default CookiesPage; 
import React from 'react';
import { motion } from 'framer-motion';
import { FiPackage, FiSettings, FiShield, FiBarChart, FiMail, FiPhone, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const CookiesPage: React.FC = () => {
  const { t } = useTranslation();
  const cookieTypes = [
    {
      id: 'essential',
      title: t('cookies.types.essential.title'),
      icon: <FiShield className="h-6 w-6" />,
      description: t('cookies.types.essential.description'),
      examples: [
        t('cookies.types.essential.example1'),
        t('cookies.types.essential.example2'),
        t('cookies.types.essential.example3'),
        t('cookies.types.essential.example4')
      ],
      required: true
    },
    {
      id: 'functional',
      title: t('cookies.types.functional.title'),
      icon: <FiSettings className="h-6 w-6" />,
      description: t('cookies.types.functional.description'),
      examples: [
        t('cookies.types.functional.example1'),
        t('cookies.types.functional.example2'),
        t('cookies.types.functional.example3'),
        t('cookies.types.functional.example4')
      ],
      required: false
    },
    {
      id: 'analytics',
      title: t('cookies.types.analytics.title'),
      icon: <FiBarChart className="h-6 w-6" />,
      description: t('cookies.types.analytics.description'),
      examples: [
        t('cookies.types.analytics.example1'),
        t('cookies.types.analytics.example2'),
        t('cookies.types.analytics.example3'),
        t('cookies.types.analytics.example4')
      ],
      required: false
    },
    {
      id: 'marketing',
      title: t('cookies.types.marketing.title'),
      icon: <FiPackage className="h-6 w-6" />,
      description: t('cookies.types.marketing.description'),
      examples: [
        t('cookies.types.marketing.example1'),
        t('cookies.types.marketing.example2'),
        t('cookies.types.marketing.example3'),
        t('cookies.types.marketing.example4')
      ],
      required: false
    }
  ];

  const thirdPartyServices = [
    {
      name: t('cookies.thirdParty.googleAnalytics.name'),
      purpose: t('cookies.thirdParty.googleAnalytics.purpose'),
      dataCollected: t('cookies.thirdParty.googleAnalytics.dataCollected'),
      retention: t('cookies.thirdParty.googleAnalytics.retention'),
      optOut: 'https://tools.google.com/dlpage/gaoptout'
    },
    {
      name: t('cookies.thirdParty.stripe.name'),
      purpose: t('cookies.thirdParty.stripe.purpose'),
      dataCollected: t('cookies.thirdParty.stripe.dataCollected'),
      retention: t('cookies.thirdParty.stripe.retention'),
      optOut: t('cookies.thirdParty.stripe.optOut')
    },
    {
      name: t('cookies.thirdParty.intercom.name'),
      purpose: t('cookies.thirdParty.intercom.purpose'),
      dataCollected: t('cookies.thirdParty.intercom.dataCollected'),
      retention: t('cookies.thirdParty.intercom.retention'),
      optOut: t('cookies.thirdParty.intercom.optOut')
    },
    {
      name: t('cookies.thirdParty.hotjar.name'),
      purpose: t('cookies.thirdParty.hotjar.purpose'),
      dataCollected: t('cookies.thirdParty.hotjar.dataCollected'),
      retention: t('cookies.thirdParty.hotjar.retention'),
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
              {t('cookies.title')}
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8">
              {t('cookies.description')}
            </p>
            <div className="text-white/80">
              <p className="mb-2">{t('cookies.lastUpdated')}</p>
              <p>{t('cookies.effectiveDate')}</p>
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
              {t('cookies.whatAreCookies.title')}
            </h2>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-8">
              <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                {t('cookies.whatAreCookies.content1')}
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                {t('cookies.whatAreCookies.content2')}
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
              {t('cookies.typesSection.title')}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              {t('cookies.typesSection.description')}
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
                          {t('cookies.labels.required')}
                        </span>
                      ) : (
                        <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded text-sm">
                          {t('cookies.labels.optional')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {type.description}
                </p>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">{t('cookies.labels.examples')}</h4>
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
              {t('cookies.thirdPartySection.title')}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              {t('cookies.thirdPartySection.description')}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-white">{t('cookies.table.service')}</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-white">{t('cookies.table.purpose')}</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-white">{t('cookies.table.dataCollected')}</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-white">{t('cookies.table.retention')}</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-900 dark:text-white">{t('cookies.table.optOut')}</th>
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
                          {t('cookies.table.optOutLink')}
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
              {t('cookies.managingSection.title')}
            </h2>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    {t('cookies.managingSection.browserSettings.title')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {t('cookies.managingSection.browserSettings.description')}
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li>• {t('cookies.managingSection.browserSettings.option1')}</li>
                    <li>• {t('cookies.managingSection.browserSettings.option2')}</li>
                    <li>• {t('cookies.managingSection.browserSettings.option3')}</li>
                    <li>• {t('cookies.managingSection.browserSettings.option4')}</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    {t('cookies.managingSection.consent.title')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {t('cookies.managingSection.consent.description')}
                  </p>
                  <button className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors">
                    {t('cookies.managingSection.consent.button')}
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
              {t('cookies.updatesSection.title')}
            </h2>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-8">
              <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                {t('cookies.updatesSection.content1')}
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                {t('cookies.updatesSection.content2')}
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
              {t('cookies.contact.title')}
            </h2>
            <p className="text-xl text-orange-100 mb-8">
              {t('cookies.contact.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:info@matrixaiglobal.com"
                className="bg-white text-orange-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
              >
                <FiMail className="h-5 w-5" />
                {t('cookies.contact.email')}
              </a>
              <a
                href="/contact"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-orange-600 transition-colors flex items-center justify-center gap-2"
              >
                <FiPhone className="h-5 w-5" />
                {t('cookies.contact.form')}
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default CookiesPage;
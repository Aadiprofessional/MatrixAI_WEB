import React from 'react';
import { motion } from 'framer-motion';
import { FiShield, FiLock, FiEye, FiDatabase, FiMail, FiPhone } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const PrivacyPage: React.FC = () => {
  const { t } = useTranslation();
  const sections = [
    {
      id: 'information-collection',
      title: t('privacy.informationCollection.title'),
      icon: <FiDatabase className="h-6 w-6" />,
      content: t('privacy.informationCollection.content')
    },
    {
      id: 'information-use',
      title: t('privacy.informationUse.title'),
      icon: <FiEye className="h-6 w-6" />,
      content: t('privacy.informationUse.content')
    },
    {
      id: 'information-sharing',
      title: t('privacy.informationSharing.title'),
      icon: <FiShield className="h-6 w-6" />,
      content: t('privacy.informationSharing.content')
    },
    {
      id: 'data-security',
      title: t('privacy.dataSecurity.title'),
      icon: <FiLock className="h-6 w-6" />,
      content: t('privacy.dataSecurity.content')
    },
    {
      id: 'your-rights',
      title: t('privacy.yourRights.title'),
      icon: <FiEye className="h-6 w-6" />,
      content: t('privacy.yourRights.content')
    },
    {
      id: 'cookies',
      title: t('privacy.cookies.title'),
      icon: <FiDatabase className="h-6 w-6" />,
      content: t('privacy.cookies.content')
    },
    {
      id: 'international-transfers',
      title: t('privacy.internationalTransfers.title'),
      icon: <FiShield className="h-6 w-6" />,
      content: t('privacy.internationalTransfers.content')
    },
    {
      id: 'children-privacy',
      title: t('privacy.childrenPrivacy.title'),
      icon: <FiShield className="h-6 w-6" />,
      content: t('privacy.childrenPrivacy.content')
    },
    {
      id: 'changes',
      title: t('privacy.changes.title'),
      icon: <FiEye className="h-6 w-6" />,
      content: t('privacy.changes.content')
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-purple-600 py-20">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <FiShield className="h-16 w-16 text-white mx-auto mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              {t('privacy.title')}
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8">
              {t('privacy.subtitle')}
            </p>
            <div className="text-white/80">
              <p className="mb-2">{t('privacy.lastUpdated')}</p>
              <p>{t('privacy.effectiveDate')}</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Table of Contents */}
      <section className="py-8 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('privacy.tableOfContents')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sections.map((section, index) => (
              <motion.a
                key={section.id}
                href={`#${section.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="text-blue-600 dark:text-blue-400">
                  {section.icon}
                </div>
                <span className="text-gray-900 dark:text-white font-medium">
                  {section.title}
                </span>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy Policy Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {sections.map((section, index) => (
            <motion.div
              key={section.id}
              id={section.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="mb-12 bg-white dark:bg-gray-800 rounded-xl p-8 shadow-md"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="text-blue-600 dark:text-blue-400">
                  {section.icon}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {section.title}
                </h2>
              </div>
              <div className="prose prose-gray dark:prose-invert max-w-none">
                {section.content.split('\n').map((paragraph: string, pIndex: number) => (
                  <p key={pIndex} className="mb-4 text-gray-600 dark:text-gray-400 leading-relaxed">
                    {paragraph.trim()}
                  </p>
                ))}
              </div>
            </motion.div>
          ))}
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
              {t('privacy.contact.title')}
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              {t('privacy.contact.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:info@matrixaiglobal.com"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
              >
                <FiMail className="h-5 w-5" />
                {t('privacy.contact.emailUs')}
              </a>
              <a
                href="/contact"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <FiPhone className="h-5 w-5" />
                {t('privacy.contact.contactForm')}
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPage;
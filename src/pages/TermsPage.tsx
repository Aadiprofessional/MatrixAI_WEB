import React from 'react';
import { motion } from 'framer-motion';
import { FiFileText, FiShield, FiUsers, FiDollarSign, FiMail, FiPhone, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const TermsPage: React.FC = () => {
  const { t } = useTranslation();
  const sections = [
    {
      id: 'acceptance',
      title: t('terms.sections.acceptance.title'),
      icon: <FiCheckCircle className="h-6 w-6" />,
      content: `
        ${t('terms.sections.acceptance.content1')}
        
        ${t('terms.sections.acceptance.content2')}
        
        ${t('terms.sections.acceptance.content3')}
      `
    },
    {
      id: 'description',
      title: t('terms.sections.description.title'),
      icon: <FiFileText className="h-6 w-6" />,
      content: `
        ${t('terms.sections.description.content1')}
        
        ${t('terms.sections.description.service1')}
        ${t('terms.sections.description.service2')}
        ${t('terms.sections.description.service3')}
        ${t('terms.sections.description.service4')}
        ${t('terms.sections.description.service5')}
        ${t('terms.sections.description.service6')}
        ${t('terms.sections.description.service7')}
        
        ${t('terms.sections.description.content2')}
      `
    },
    {
      id: 'user-accounts',
      title: t('terms.sections.userAccounts.title'),
      icon: <FiUsers className="h-6 w-6" />,
      content: `
        ${t('terms.sections.userAccounts.content1')}
        
        ${t('terms.sections.userAccounts.requirement1')}
        ${t('terms.sections.userAccounts.requirement2')}
        ${t('terms.sections.userAccounts.requirement3')}
        ${t('terms.sections.userAccounts.requirement4')}
        ${t('terms.sections.userAccounts.requirement5')}
        
        ${t('terms.sections.userAccounts.content2')}
        
        ${t('terms.sections.userAccounts.content3')}
      `
    },
    {
      id: 'acceptable-use',
      title: t('terms.sections.acceptableUse.title'),
      icon: <FiShield className="h-6 w-6" />,
      content: `
        ${t('terms.sections.acceptableUse.content1')}
        
        ${t('terms.sections.acceptableUse.prohibition1')}
        ${t('terms.sections.acceptableUse.prohibition2')}
        ${t('terms.sections.acceptableUse.prohibition3')}
        ${t('terms.sections.acceptableUse.prohibition4')}
        ${t('terms.sections.acceptableUse.prohibition5')}
        ${t('terms.sections.acceptableUse.prohibition6')}
        ${t('terms.sections.acceptableUse.prohibition7')}
        ${t('terms.sections.acceptableUse.prohibition8')}
        
        ${t('terms.sections.acceptableUse.content2')}
      `
    },
    {
      id: 'content-policy',
      title: t('terms.sections.contentPolicy.title'),
      icon: <FiFileText className="h-6 w-6" />,
      content: `
        ${t('terms.sections.contentPolicy.ownershipTitle')}
        ${t('terms.sections.contentPolicy.ownership1')}
        ${t('terms.sections.contentPolicy.ownership2')}
        ${t('terms.sections.contentPolicy.ownership3')}
        
        ${t('terms.sections.contentPolicy.licenseTitle')}
        ${t('terms.sections.contentPolicy.license1')}
        ${t('terms.sections.contentPolicy.license2')}
        ${t('terms.sections.contentPolicy.license3')}
        
        ${t('terms.sections.contentPolicy.ipTitle')}
        ${t('terms.sections.contentPolicy.ip1')}
        ${t('terms.sections.contentPolicy.ip2')}
        ${t('terms.sections.contentPolicy.ip3')}
      `
    },
    {
      id: 'payment-terms',
      title: t('terms.sections.paymentTerms.title'),
      icon: <FiDollarSign className="h-6 w-6" />,
      content: `
        ${t('terms.sections.paymentTerms.subscriptionTitle')}
        ${t('terms.sections.paymentTerms.subscription1')}
        ${t('terms.sections.paymentTerms.subscription2')}
        ${t('terms.sections.paymentTerms.subscription3')}
        
        ${t('terms.sections.paymentTerms.processingTitle')}
        ${t('terms.sections.paymentTerms.processing1')}
        ${t('terms.sections.paymentTerms.processing2')}
        ${t('terms.sections.paymentTerms.processing3')}
        
        ${t('terms.sections.paymentTerms.pricingTitle')}
        ${t('terms.sections.paymentTerms.pricing1')}
        ${t('terms.sections.paymentTerms.pricing2')}
        ${t('terms.sections.paymentTerms.pricing3')}
        
        ${t('terms.sections.paymentTerms.limitsTitle')}
        ${t('terms.sections.paymentTerms.limits1')}
        ${t('terms.sections.paymentTerms.limits2')}
        ${t('terms.sections.paymentTerms.limits3')}
      `
    },
    {
      id: 'privacy-security',
      title: t('terms.sections.privacy.title'),
      icon: <FiShield className="h-6 w-6" />,
      content: `
        ${t('terms.sections.privacy.dataProtectionTitle')}
        ${t('terms.sections.privacy.dataProtection1')}
        ${t('terms.sections.privacy.dataProtection2')}
        ${t('terms.sections.privacy.dataProtection3')}
        
        ${t('terms.sections.privacy.dataRetentionTitle')}
        ${t('terms.sections.privacy.dataRetention1')}
        ${t('terms.sections.privacy.dataRetention2')}
        ${t('terms.sections.privacy.dataRetention3')}
        
        ${t('terms.sections.privacy.thirdPartyTitle')}
        ${t('terms.sections.privacy.thirdParty1')}
        ${t('terms.sections.privacy.thirdParty2')}
        ${t('terms.sections.privacy.thirdParty3')}
      `
    },
    {
      id: 'disclaimers',
      title: t('terms.sections.disclaimers.title'),
      icon: <FiAlertTriangle className="h-6 w-6" />,
      content: `
        ${t('terms.sections.disclaimers.serviceAvailabilityTitle')}
        ${t('terms.sections.disclaimers.serviceAvailability1')}
        ${t('terms.sections.disclaimers.serviceAvailability2')}
        ${t('terms.sections.disclaimers.serviceAvailability3')}
        
        ${t('terms.sections.disclaimers.aiLimitationsTitle')}
        ${t('terms.sections.disclaimers.aiLimitations1')}
        ${t('terms.sections.disclaimers.aiLimitations2')}
        ${t('terms.sections.disclaimers.aiLimitations3')}
        
        ${t('terms.sections.disclaimers.liabilityTitle')}
        ${t('terms.sections.disclaimers.liability1')}
        ${t('terms.sections.disclaimers.liability2')}
        ${t('terms.sections.disclaimers.liability3')}
        
        ${t('terms.sections.disclaimers.damagesTitle')}
        ${t('terms.sections.disclaimers.damages1')}
        ${t('terms.sections.disclaimers.damages2')}
        ${t('terms.sections.disclaimers.damages3')}
        ${t('terms.sections.disclaimers.damages4')}
        
        ${t('terms.sections.disclaimers.indemnificationTitle')}
        ${t('terms.sections.disclaimers.indemnification1')}
        ${t('terms.sections.disclaimers.indemnification2')}
        ${t('terms.sections.disclaimers.indemnification3')}
        ${t('terms.sections.disclaimers.indemnification4')}
      `
    },
    {
      id: 'termination',
      title: t('terms.sections.termination.title'),
      icon: <FiAlertTriangle className="h-6 w-6" />,
      content: `
        ${t('terms.sections.termination.byYouTitle')}
        ${t('terms.sections.termination.byYou1')}
        ${t('terms.sections.termination.byYou2')}
        ${t('terms.sections.termination.byYou3')}
        
        ${t('terms.sections.termination.byUsTitle')}
        ${t('terms.sections.termination.byUs1')}
        ${t('terms.sections.termination.byUs2')}
        ${t('terms.sections.termination.byUs3')}
        
        ${t('terms.sections.termination.effectTitle')}
        ${t('terms.sections.termination.effect1')}
        ${t('terms.sections.termination.effect2')}
        ${t('terms.sections.termination.effect3')}
      `
    },
    {
      id: 'governing-law',
      title: t('terms.sections.governingLaw.title'),
      icon: <FiFileText className="h-6 w-6" />,
      content: `
        ${t('terms.sections.governingLaw.lawTitle')}
        ${t('terms.sections.governingLaw.law1')}
        ${t('terms.sections.governingLaw.law2')}
        ${t('terms.sections.governingLaw.law3')}
        
        ${t('terms.sections.governingLaw.disputeTitle')}
        ${t('terms.sections.governingLaw.dispute1')}
        ${t('terms.sections.governingLaw.dispute2')}
        ${t('terms.sections.governingLaw.dispute3')}
        
        ${t('terms.sections.governingLaw.classActionTitle')}
        ${t('terms.sections.governingLaw.classAction1')}
        ${t('terms.sections.governingLaw.classAction2')}
        ${t('terms.sections.governingLaw.classAction3')}
      `
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-purple-600 to-blue-600 py-20">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <FiFileText className="h-16 w-16 text-white mx-auto mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              {t('terms.title')}
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8">
              {t('terms.description')}
            </p>
            <div className="text-white/80">
              <p className="mb-2">{t('terms.lastUpdated')}</p>
              <p>{t('terms.effectiveDate')}</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Table of Contents */}
      <section className="py-8 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('terms.tableOfContents')}</h2>
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
                <div className="text-purple-600 dark:text-purple-400">
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

      {/* Terms Content */}
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
                <div className="text-purple-600 dark:text-purple-400">
                  {section.icon}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {section.title}
                </h2>
              </div>
              <div className="prose prose-gray dark:prose-invert max-w-none">
                {section.content.split('\n').map((paragraph, pIndex) => (
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
      <section className="py-16 bg-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              {t('terms.contact.title')}
            </h2>
            <p className="text-xl text-purple-100 mb-8">
              {t('terms.contact.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:info@matrixaiglobal.com"
                className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
              >
                <FiMail className="h-5 w-5" />
                {t('terms.contact.email')}
              </a>
              <a
                href="/contact"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-purple-600 transition-colors flex items-center justify-center gap-2"
              >
                <FiPhone className="h-5 w-5" />
                {t('terms.contact.form')}
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default TermsPage;
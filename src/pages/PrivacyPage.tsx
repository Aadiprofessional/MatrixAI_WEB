import React from 'react';
import { motion } from 'framer-motion';
import { FiShield, FiLock, FiEye, FiDatabase, FiMail, FiPhone } from 'react-icons/fi';

const PrivacyPage: React.FC = () => {
  const sections = [
    {
      id: 'information-collection',
      title: 'Information We Collect',
      icon: <FiDatabase className="h-6 w-6" />,
      content: `
        We collect information you provide directly to us, such as when you create an account, use our services, or contact us. This includes:
        
        • Personal information (name, email address, phone number)
        • Account credentials and preferences
        • Content you create or upload using our AI tools
        • Payment information (processed securely through third-party providers)
        • Communication history with our support team
        
        We also automatically collect certain information about your device and usage patterns, including:
        
        • Device information (IP address, browser type, operating system)
        • Usage data (features used, time spent, interaction patterns)
        • Performance data to improve our AI models
        • Cookies and similar tracking technologies
      `
    },
    {
      id: 'information-use',
      title: 'How We Use Your Information',
      icon: <FiEye className="h-6 w-6" />,
      content: `
        We use the information we collect to:
        
        • Provide, maintain, and improve our AI services
        • Process transactions and send related information
        • Personalize your experience and provide relevant content
        • Train and improve our AI models (with appropriate safeguards)
        • Communicate with you about our services, updates, and offers
        • Detect, prevent, and address technical issues and security threats
        • Comply with legal obligations and protect our rights
        
        We use your data to make our AI more helpful while respecting your privacy. Content you create is used to improve our models only in aggregated, anonymized ways unless you explicitly opt-in to additional data usage.
      `
    },
    {
      id: 'information-sharing',
      title: 'Information Sharing and Disclosure',
      icon: <FiShield className="h-6 w-6" />,
      content: `
        We do not sell, trade, or otherwise transfer your personal information to third parties except in the following circumstances:
        
        • Service Providers: We may share information with trusted third-party service providers who help us operate our platform (cloud hosting, payment processing, analytics)
        • Legal Requirements: We may disclose information if required by law, court order, or government request
        • Business Transfers: Information may be transferred as part of a merger, acquisition, or sale of assets
        • Protection of Rights: We may share information to protect our rights, property, or safety, or that of our users
        • Consent: We may share information with your explicit consent
        
        All third-party service providers are bound by confidentiality agreements and are prohibited from using your information for any other purpose.
      `
    },
    {
      id: 'data-security',
      title: 'Data Security',
      icon: <FiLock className="h-6 w-6" />,
      content: `
        We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction:
        
        • Encryption in transit and at rest using industry-standard protocols
        • Regular security audits and penetration testing
        • Access controls and authentication requirements for our staff
        • Secure data centers with physical and environmental protections
        • Incident response procedures for potential security breaches
        • Regular security training for our employees
        
        While we strive to protect your information, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security but are committed to protecting your data using industry best practices.
      `
    },
    {
      id: 'your-rights',
      title: 'Your Rights and Choices',
      icon: <FiEye className="h-6 w-6" />,
      content: `
        You have several rights regarding your personal information:
        
        • Access: Request a copy of the personal information we hold about you
        • Correction: Request correction of inaccurate or incomplete information
        • Deletion: Request deletion of your personal information (subject to certain exceptions)
        • Portability: Request transfer of your data to another service provider
        • Restriction: Request limitation of processing of your personal information
        • Objection: Object to processing of your personal information for certain purposes
        • Withdraw Consent: Withdraw consent for data processing where consent is the legal basis
        
        To exercise these rights, please contact us at matrixai.global@gmail.com. We will respond to your request within 30 days.
      `
    },
    {
      id: 'cookies',
      title: 'Cookies and Tracking Technologies',
      icon: <FiDatabase className="h-6 w-6" />,
      content: `
        We use cookies and similar tracking technologies to collect and store information about your interactions with our services:
        
        • Essential Cookies: Required for basic functionality and security
        • Performance Cookies: Help us understand how you use our services
        • Functionality Cookies: Remember your preferences and settings
        • Analytics Cookies: Provide insights into usage patterns and performance
        
        You can control cookies through your browser settings, but disabling certain cookies may affect the functionality of our services. We also use local storage and similar technologies to enhance your experience.
      `
    },
    {
      id: 'international-transfers',
      title: 'International Data Transfers',
      icon: <FiShield className="h-6 w-6" />,
      content: `
        MatrixAI operates globally, and your information may be transferred to and processed in countries other than your own. When we transfer personal information internationally, we ensure appropriate safeguards are in place:
        
        • Standard Contractual Clauses approved by relevant authorities
        • Adequacy decisions recognizing equivalent protection levels
        • Binding corporate rules for intra-group transfers
        • Your explicit consent for specific transfers
        
        We are committed to protecting your information regardless of where it is processed and ensure that international transfers comply with applicable data protection laws.
      `
    },
    {
      id: 'children-privacy',
      title: 'Children\'s Privacy',
      icon: <FiShield className="h-6 w-6" />,
      content: `
        Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
        
        If we discover that we have collected personal information from a child under 13, we will take steps to delete such information promptly. For users between 13 and 18, we recommend parental guidance when using our services.
      `
    },
    {
      id: 'changes',
      title: 'Changes to This Privacy Policy',
      icon: <FiEye className="h-6 w-6" />,
      content: `
        We may update this Privacy Policy from time to time to reflect changes in our practices or applicable laws. We will notify you of any material changes by:
        
        • Posting the updated policy on our website
        • Sending an email notification to registered users
        • Displaying a prominent notice on our platform
        
        The updated policy will be effective when posted unless otherwise specified. We encourage you to review this policy periodically to stay informed about how we protect your information.
      `
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
              Privacy Policy
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8">
              Your privacy is important to us. This policy explains how we collect, use, and protect your personal information when you use MatrixAI.
            </p>
            <div className="text-white/80">
              <p className="mb-2">Last updated: January 15, 2024</p>
              <p>Effective date: January 15, 2024</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Table of Contents */}
      <section className="py-8 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Table of Contents</h2>
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
      <section className="py-16 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              Questions About Your Privacy?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              If you have any questions about this Privacy Policy or how we handle your personal information, please don't hesitate to contact us.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:matrixai.global@gmail.com"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
              >
                <FiMail className="h-5 w-5" />
                Email Us
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

export default PrivacyPage; 
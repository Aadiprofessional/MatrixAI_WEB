import React from 'react';
import { motion } from 'framer-motion';
import { FiFileText, FiShield, FiUsers, FiDollarSign, FiMail, FiPhone, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';

const TermsPage: React.FC = () => {
  const sections = [
    {
      id: 'acceptance',
      title: 'Acceptance of Terms',
      icon: <FiCheckCircle className="h-6 w-6" />,
      content: `
        By accessing or using MatrixAI's services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing our services.
        
        These terms constitute a legally binding agreement between you and MatrixAI. Your use of our services is also governed by our Privacy Policy, which is incorporated into these terms by reference.
        
        We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Your continued use of our services after any such changes constitutes your acceptance of the new terms.
      `
    },
    {
      id: 'description',
      title: 'Description of Service',
      icon: <FiFileText className="h-6 w-6" />,
      content: `
        MatrixAI provides artificial intelligence-powered tools and services including but not limited to:
        
        • AI-powered chat and conversation interfaces
        • Image generation and editing tools
        • Video creation and editing capabilities
        • Content writing and text generation
        • Speech-to-text and text-to-speech services
        • Data analysis and visualization tools
        • API access for developers
        
        Our services are provided "as is" and we reserve the right to modify, suspend, or discontinue any aspect of our services at any time without notice.
      `
    },
    {
      id: 'user-accounts',
      title: 'User Accounts and Registration',
      icon: <FiUsers className="h-6 w-6" />,
      content: `
        To access certain features of our services, you must create an account. You agree to:
        
        • Provide accurate, current, and complete information during registration
        • Maintain the security of your account credentials
        • Accept responsibility for all activities that occur under your account
        • Notify us immediately of any unauthorized use of your account
        • Not share your account with others or allow others to access your account
        
        You must be at least 13 years old to create an account. If you are under 18, you must have parental consent to use our services.
        
        We reserve the right to suspend or terminate accounts that violate these terms or engage in prohibited activities.
      `
    },
    {
      id: 'acceptable-use',
      title: 'Acceptable Use Policy',
      icon: <FiShield className="h-6 w-6" />,
      content: `
        You agree not to use our services for any unlawful or prohibited activities, including but not limited to:
        
        • Generating harmful, illegal, or offensive content
        • Violating intellectual property rights
        • Harassing, threatening, or intimidating others
        • Distributing malware or conducting cyberattacks
        • Attempting to reverse engineer our AI models
        • Circumventing usage limits or security measures
        • Creating fake accounts or impersonating others
        • Spamming or sending unsolicited communications
        
        We reserve the right to monitor usage and take appropriate action against violations, including account suspension or termination.
      `
    },
    {
      id: 'content-policy',
      title: 'Content and Intellectual Property',
      icon: <FiFileText className="h-6 w-6" />,
      content: `
        Content Ownership:
        • You retain ownership of content you create using our services
        • We do not claim ownership of your generated content
        • You are responsible for ensuring your content complies with applicable laws
        
        License to Us:
        • You grant us a limited license to process your content to provide our services
        • We may use aggregated, anonymized data to improve our AI models
        • We will not use your content for marketing without your consent
        
        Our Intellectual Property:
        • Our AI models, software, and services are protected by intellectual property laws
        • You may not copy, modify, or distribute our proprietary technology
        • Our trademarks and branding are protected and may not be used without permission
      `
    },
    {
      id: 'payment-terms',
      title: 'Payment and Billing',
      icon: <FiDollarSign className="h-6 w-6" />,
      content: `
        Subscription Plans:
        • We offer various subscription plans with different features and usage limits
        • Subscription fees are billed in advance on a recurring basis
        • All fees are non-refundable unless required by law
        
        Payment Processing:
        • Payments are processed through secure third-party payment processors
        • You must provide accurate payment information
        • You authorize us to charge your payment method for applicable fees
        
        Changes to Pricing:
        • We may change our pricing with 30 days' notice
        • Price changes will not affect your current billing cycle
        • You may cancel your subscription before price changes take effect
        
        Usage Limits:
        • Each plan has specific usage limits and features
        • Exceeding limits may result in additional charges or service restrictions
        • We will notify you when approaching usage limits
      `
    },
    {
      id: 'privacy-security',
      title: 'Privacy and Data Security',
      icon: <FiShield className="h-6 w-6" />,
      content: `
        Data Protection:
        • We implement industry-standard security measures to protect your data
        • Your personal information is handled according to our Privacy Policy
        • We use encryption and secure protocols for data transmission and storage
        
        Data Retention:
        • We retain your data only as long as necessary to provide our services
        • You may request deletion of your data subject to legal requirements
        • Some data may be retained for security and legal compliance purposes
        
        Third-Party Services:
        • We may use third-party services for payment processing, analytics, and infrastructure
        • These services are bound by confidentiality agreements
        • We carefully vet all third-party providers for security and privacy compliance
      `
    },
    {
      id: 'disclaimers',
      title: 'Disclaimers and Limitations',
      icon: <FiAlertTriangle className="h-6 w-6" />,
      content: `
        Service Availability:
        • Our services are provided "as is" without warranties of any kind
        • We do not guarantee uninterrupted or error-free service
        • Scheduled maintenance may temporarily affect service availability
        
        AI Limitations:
        • AI-generated content may contain errors or inaccuracies
        • You are responsible for reviewing and verifying AI-generated content
        • We do not guarantee the accuracy, completeness, or reliability of AI outputs
        
        Limitation of Liability:
        • Our liability is limited to the amount you paid for our services
        • We are not liable for indirect, incidental, or consequential damages
        • Some jurisdictions do not allow certain limitations, so these may not apply to you
      `
    },
    {
      id: 'termination',
      title: 'Termination',
      icon: <FiAlertTriangle className="h-6 w-6" />,
      content: `
        Termination by You:
        • You may terminate your account at any time through your account settings
        • Cancellation will take effect at the end of your current billing period
        • You remain responsible for all charges incurred before termination
        
        Termination by Us:
        • We may terminate your account for violations of these terms
        • We may suspend or terminate services for non-payment
        • We will provide reasonable notice before termination when possible
        
        Effect of Termination:
        • Your right to use our services will cease immediately
        • We may delete your account and data after termination
        • Certain provisions of these terms will survive termination
      `
    },
    {
      id: 'governing-law',
      title: 'Governing Law and Disputes',
      icon: <FiFileText className="h-6 w-6" />,
      content: `
        Governing Law:
        • These terms are governed by the laws of the jurisdiction where MatrixAI is incorporated
        • Any disputes will be resolved in the courts of that jurisdiction
        • You consent to the jurisdiction and venue of these courts
        
        Dispute Resolution:
        • We encourage resolving disputes through direct communication
        • For formal disputes, we may require binding arbitration
        • You may opt out of arbitration by providing written notice within 30 days
        
        Class Action Waiver:
        • You agree to resolve disputes individually, not as part of a class action
        • This waiver applies to all claims and disputes between us
        • Some jurisdictions may not allow class action waivers
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
              Terms of Service
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8">
              These terms govern your use of MatrixAI's services. Please read them carefully to understand your rights and responsibilities.
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
              Questions About These Terms?
            </h2>
            <p className="text-xl text-purple-100 mb-8">
              If you have any questions about these Terms of Service, please contact us. We're here to help clarify any concerns.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:matrixai.global@gmail.com"
                className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
              >
                <FiMail className="h-5 w-5" />
                Email Us
              </a>
              <a
                href="/contact"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-purple-600 transition-colors flex items-center justify-center gap-2"
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

export default TermsPage; 
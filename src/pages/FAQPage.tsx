import React from 'react';
import { motion } from 'framer-motion';
import { FiHelpCircle } from 'react-icons/fi';
import { HomeNavbar } from '../components';

const FAQPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Add HomeNavbar */}
      <HomeNavbar />
      
      {/* Main content with padding for the fixed navbar */}
      <div className="pt-24">
        {/* FAQ Section */}
        <section className="py-20 relative">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/90 to-black z-0"></div>
          
          {/* Animated grid background */}
          <div className="absolute inset-0 z-0 opacity-20">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          </div>
          
          {/* Glowing orb decoration */}
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/20 rounded-full filter blur-3xl opacity-20"></div>
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full filter blur-3xl opacity-20"></div>
          
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
              >
                <div className="flex justify-center mb-4">
                  <div className="bg-purple-900/30 p-4 rounded-full">
                    <FiHelpCircle className="h-10 w-10 text-purple-400" />
                  </div>
                </div>
                <h1 className="text-4xl font-bold text-white mb-4">Frequently Asked Questions</h1>
                <p className="mt-4 text-xl text-gray-300 max-w-2xl mx-auto">
                  Find answers to common questions about MatrixAI's services, features, and capabilities.
                </p>
              </motion.div>
            </div>
            
            <div className="space-y-8">
              {/* General Questions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-2xl font-semibold text-purple-400 mb-6">General Questions</h2>
                <div className="space-y-6">
                  {[
                    {
                      question: 'What is MatrixAI?',
                      answer: 'MatrixAI is a comprehensive AI platform that offers a suite of tools for content creation, image generation, video production, and more. Our platform is designed to help individuals and businesses leverage the power of artificial intelligence to enhance their creative and professional workflows.'
                    },
                    {
                      question: 'How do I get started with MatrixAI?',
                      answer: 'Getting started is easy! Simply sign up for an account, choose a subscription plan that fits your needs, and you\'ll have immediate access to our AI tools. We offer a user-friendly interface and comprehensive tutorials to help you make the most of our platform.'
                    },
                    {
                      question: 'Is MatrixAI suitable for beginners?',
                      answer: 'Absolutely! MatrixAI is designed to be accessible to users of all skill levels. Our intuitive interface and guided workflows make it easy for beginners to create professional-quality content, while advanced users will appreciate the depth of customization options available.'
                    },
                  ].map((faq, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="backdrop-blur-md bg-black/30 rounded-lg p-6 shadow-lg border border-gray-700 hover:shadow-purple-900/20 hover:border-purple-700/50 transition-all duration-300"
                    >
                      <h3 className="text-lg font-semibold text-white">{faq.question}</h3>
                      <p className="mt-2 text-gray-300">{faq.answer}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
              
              {/* Subscription & Pricing */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <h2 className="text-2xl font-semibold text-purple-400 mb-6">Subscription & Pricing</h2>
                <div className="space-y-6">
                  {[
                    {
                      question: 'What subscription plans do you offer?',
                      answer: 'We offer several subscription tiers to meet different needs and budgets. Our plans range from a free tier with basic functionality to premium plans with advanced features, higher usage limits, and priority support. Visit our Pricing page for detailed information on each plan.'
                    },
                    {
                      question: 'Can I upgrade or downgrade my subscription?',
                      answer: 'Yes, you can change your subscription plan at any time. When upgrading, you\'ll have immediate access to the additional features. When downgrading, the changes will take effect at the end of your current billing cycle.'
                    },
                    {
                      question: 'Do you offer refunds?',
                      answer: 'We offer a 7-day money-back guarantee for new subscribers. If you\'re not satisfied with our service within the first week, contact our support team for a full refund. After this period, refunds are handled on a case-by-case basis.'
                    },
                  ].map((faq, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="backdrop-blur-md bg-black/30 rounded-lg p-6 shadow-lg border border-gray-700 hover:shadow-purple-900/20 hover:border-purple-700/50 transition-all duration-300"
                    >
                      <h3 className="text-lg font-semibold text-white">{faq.question}</h3>
                      <p className="mt-2 text-gray-300">{faq.answer}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
              
              {/* Technical Support */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <h2 className="text-2xl font-semibold text-purple-400 mb-6">Technical Support</h2>
                <div className="space-y-6">
                  {[
                    {
                      question: 'How quickly will I receive a response to my support request?',
                      answer: 'We aim to respond to all inquiries within 24 hours during business days. For urgent support issues, premium and enterprise customers have access to expedited response times.'
                    },
                    {
                      question: 'Do you offer phone support?',
                      answer: 'Phone support is available for enterprise customers. All customers can reach us via email, chat, or by submitting a contact form through our website.'
                    },
                    {
                      question: 'Do you have a knowledge base or help center?',
                      answer: 'Yes, we have an extensive knowledge base with tutorials, guides, and FAQs at help.matrixai.asia. It\'s a great first stop for common questions and learning how to use our platform effectively.'
                    },
                    {
                      question: 'I\'m interested in a partnership. Who should I contact?',
                      answer: 'For partnership inquiries, please visit our Contact page and select "General Inquiries" and mention partnership in your message. Our business development team will get back to you promptly.'
                    }
                  ].map((faq, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="backdrop-blur-md bg-black/30 rounded-lg p-6 shadow-lg border border-gray-700 hover:shadow-purple-900/20 hover:border-purple-700/50 transition-all duration-300"
                    >
                      <h3 className="text-lg font-semibold text-white">{faq.question}</h3>
                      <p className="mt-2 text-gray-300">{faq.answer}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default FAQPage;
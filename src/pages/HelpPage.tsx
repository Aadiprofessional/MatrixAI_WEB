import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { ThemeContext } from '../context/ThemeContext';
import { Layout } from '../components';
import { 
  FiSearch, 
  FiHelpCircle, 
  FiMessageSquare, 
  FiMail, 
  FiPhone,
  FiBookOpen,
  FiInfo,
  FiExternalLink,
  FiArrowRight,
  FiChevronDown,
  FiChevronUp,
  FiCpu
} from 'react-icons/fi';

// FAQ Item component
const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { darkMode } = useContext(ThemeContext);
  
  return (
    <div className="border-b border-gray-700 py-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center focus:outline-none"
      >
        <h3 className="text-lg font-medium text-left text-primary">
          {question}
        </h3>
        <span>
          {isOpen ? (
            <FiChevronUp className="text-tertiary" />
          ) : (
            <FiChevronDown className="text-tertiary" />
          )}
        </span>
      </button>
      
      {isOpen && (
        <div className="mt-2 text-secondary">
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
};

// Help Category component
const HelpCategory = ({ title, icon, description, linkText, linkUrl }: { 
  title: string;
  icon: React.ReactNode;
  description: string;
  linkText: string;
  linkUrl: string;
}) => {
  const { darkMode } = useContext(ThemeContext);
  
  return (
    <div className="rounded-xl h-full glass-effect border border-gray-700/50 p-6 transition-all duration-300 hover:shadow-lg">
      <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-900 to-purple-900 text-white flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2 text-primary">
        {title}
      </h3>
      <p className="mb-4 text-secondary">
        {description}
      </p>
      <a 
        href={linkUrl}
        className="inline-flex items-center font-medium text-blue-400 hover:text-blue-300"
      >
        {linkText}
        <FiArrowRight className="ml-2" />
      </a>
    </div>
  );
};

const HelpPage: React.FC = () => {
  const { darkMode } = useContext(ThemeContext);
  const [searchQuery, setSearchQuery] = useState('');
  
  // FAQ Data
  const faqs = [
    {
      question: "What is MatrixAI?",
      answer: "MatrixAI is a powerful platform that provides various AI tools for content creation, including image generation, video creation, document writing, and more. Our state-of-the-art AI models help you create high-quality content quickly and efficiently."
    },
    {
      question: "How do I get started with MatrixAI?",
      answer: "Getting started is easy! Simply create an account, verify your email, and you'll have immediate access to our basic features. You can upgrade to our Pro plan anytime to unlock advanced capabilities and higher usage limits."
    },
    {
      question: "What are the subscription plans?",
      answer: "We offer three main plans: Free, Pro, and Business. The Free plan gives you limited access to our tools. The Pro plan ($19.99/month) provides full access with higher quality outputs and usage limits. The Business plan offers custom solutions for teams and enterprises."
    },
    {
      question: "How accurate is MatrixAI?",
      answer: "Our AI models are trained on vast datasets and continually improved. While they produce high-quality results, AI technology isn't perfect. We recommend reviewing and refining AI-generated content before using it in professional contexts."
    },
    {
      question: "Can I use generated content commercially?",
      answer: "Yes, with the Pro and Business plans, you own all rights to the content you generate and can use it for commercial purposes. Please note that you should still verify the content doesn't infringe on existing copyrights or trademarks."
    },
    {
      question: "How do I cancel my subscription?",
      answer: "You can cancel your subscription anytime from your account settings page. After cancellation, you'll continue to have access to your plan's features until the end of your current billing period."
    },
    {
      question: "Is my data secure?",
      answer: "Yes, we take data security very seriously. All data is encrypted both in transit and at rest. We do not sell your personal information to third parties. You can read more about our data practices in our Privacy Policy."
    }
  ];
  
  // Help categories
  const helpCategories = [
    {
      title: "Documentation",
      icon: <FiBookOpen className="h-5 w-5" />,
      description: "Explore detailed guides and tutorials on how to use MatrixAI features and tools.",
      linkText: "Browse documentation",
      linkUrl: "/documentation"
    },
    {
      title: "Video Tutorials",
      icon: <FiExternalLink className="h-5 w-5" />,
      description: "Watch step-by-step video guides to learn how to get the most out of our platform.",
      linkText: "Watch tutorials",
      linkUrl: "/tutorials"
    },
    {
      title: "Contact Support",
      icon: <FiMail className="h-5 w-5" />,
      description: "Need personalized help? Our support team is ready to assist you with any issues.",
      linkText: "Contact us",
      linkUrl: "/contact"
    },
    {
      title: "Community Forum",
      icon: <FiMessageSquare className="h-5 w-5" />,
      description: "Join discussions with other users to share tips, get help, and learn new techniques.",
      linkText: "Join the community",
      linkUrl: "/forum"
    }
  ];

  return (
    <Layout>
      <div className="py-8 px-4 lg:px-8 page-background dark">
        {/* Background gradient effects */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-purple-500/10 blur-3xl opacity-70"></div>
          <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-purple-500/10 via-pink-500/5 to-blue-500/10 blur-3xl opacity-70"></div>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-3xl font-bold text-primary">
              Help & Support
            </h1>
            <p className="text-tertiary mt-2 max-w-2xl mx-auto">
              Get assistance, learn more about our platform, and find answers to your questions
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-2xl mx-auto mb-12"
          >
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-tertiary">
                <FiSearch className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full p-4 pl-10 text-sm rounded-lg bg-gray-800 border-gray-700 text-primary placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search for help topics, guides, or questions..."
              />
              <button 
                className="absolute right-2.5 bottom-2.5 px-4 py-2 rounded-lg text-white btn-primary"
              >
                Search
              </button>
            </div>
          </motion.div>

          {/* Help Categories */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-bold mb-6 text-primary">
              Resources
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {helpCategories.map((category, index) => (
                <HelpCategory
                  key={index}
                  title={category.title}
                  icon={category.icon}
                  description={category.description}
                  linkText={category.linkText}
                  linkUrl={category.linkUrl}
                />
              ))}
            </div>
          </motion.div>

          {/* Frequently Asked Questions */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-bold mb-6 text-primary">
              Frequently Asked Questions
            </h2>
            <div className="rounded-xl glass-effect border border-gray-700/50 p-6">
              {faqs.map((faq, index) => (
                <FAQItem key={index} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </motion.div>

          {/* AI Assistant */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mb-8"
          >
            <div className="rounded-xl glass-effect border border-gray-700/50 p-6 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-r from-blue-900 to-purple-900 text-white flex items-center justify-center mb-4">
                <FiCpu className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-primary">
                Need More Help?
              </h2>
              <p className="mb-6 max-w-2xl mx-auto text-secondary">
                Our AI assistant is available 24/7 to help answer your questions and guide you through any issues you might be experiencing.
              </p>
              <button
                className="px-6 py-3 rounded-lg btn-primary flex items-center mx-auto"
              >
                <FiMessageSquare className="mr-2" />
                Chat with Assistant
              </button>
            </div>
          </motion.div>

          {/* Contact Information */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="rounded-xl glass-effect border border-gray-700/50 p-6">
              <h2 className="text-2xl font-bold mb-6 text-primary">
                Contact Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start">
                  <div className="rounded-lg p-3 bg-gray-700 text-blue-400 mr-4">
                    <FiMail className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-medium text-primary">
                      Email Support
                    </h3>
                    <p className="text-secondary mt-1">
                      Our team typically responds within 24 hours
                    </p>
                    <a 
                      href="mailto:support@matrixaiglobal.com"
                      className="mt-2 inline-block font-medium text-blue-400 hover:text-blue-300"
                    >
                      support@matrixaiglobal.com
                    </a>
                  </div>
                </div>
                
               
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </Layout>
  );
};

export default HelpPage;
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiMessageSquare, 
  FiUsers, 
  FiBarChart2, 
  FiShield, 
  FiGlobe, 
  FiCpu, 
  FiDatabase, 
  FiLock,
  FiCheck,
  FiArrowRight
} from 'react-icons/fi';

const features = [
  {
    name: "Natural Language Processing",
    description: "Communicate with our AI assistant using natural language, just like you would with a human. Our advanced NLP technology understands context, nuance, and intent.",
    icon: <FiMessageSquare className="w-6 h-6" />,
    color: "bg-primary-100 text-primary-600",
  },
  {
    name: "Team Collaboration",
    description: "Work together with your team by sharing conversations, insights, and data analyses. Collaborate in real-time with shared AI workspaces.",
    icon: <FiUsers className="w-6 h-6" />,
    color: "bg-blue-100 text-blue-600",
  },
  {
    name: "Advanced Analytics",
    description: "Transform raw data into actionable insights with powerful data visualization and analysis tools. Identify trends, patterns, and opportunities.",
    icon: <FiBarChart2 className="w-6 h-6" />,
    color: "bg-green-100 text-green-600",
  },
  {
    name: "Enterprise Security",
    description: "Your data is protected with enterprise-grade security including end-to-end encryption, secure authentication, and compliance with industry standards.",
    icon: <FiShield className="w-6 h-6" />,
    color: "bg-red-100 text-red-600",
  },
  {
    name: "Multi-language Support",
    description: "Communicate in your preferred language with support for over 50 languages. Our AI can translate and understand global contexts.",
    icon: <FiGlobe className="w-6 h-6" />,
    color: "bg-yellow-100 text-yellow-600",
  },
  {
    name: "Specialized AI Roles",
    description: "Access AI specialists tailored for different tasks such as data analysis, creative writing, coding assistance, and more.",
    icon: <FiCpu className="w-6 h-6" />,
    color: "bg-purple-100 text-purple-600",
  },
];

const FeaturesPage: React.FC = () => {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-white to-primary-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block">Powerful Features for</span>
                <span className="block text-primary-600">Intelligent Conversations</span>
              </h1>
              <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
                Discover how our AI assistant can transform your workflow with these powerful capabilities
              </p>
            </motion.div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-0 -right-20 w-80 h-80 bg-primary-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-secondary-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>
      </section>

      {/* Main Features Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-xl shadow-soft border border-gray-100 hover:shadow-medium transition-shadow duration-300"
              >
                <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-5`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.name}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Feature Showcase */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Designed for Your Workflow
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI assistant integrates seamlessly into your existing workflow, enhancing productivity without disruption
            </p>
          </div>

          {/* Feature 1: Data Analysis */}
          <div className="flex flex-col lg:flex-row items-center mb-20 lg:mb-32">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="lg:w-1/2 lg:pr-12 mb-8 lg:mb-0"
            >
              <div className="bg-white p-1 rounded-2xl shadow-soft overflow-hidden">
                <div className="bg-gray-800 rounded-xl p-4">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="mt-4 bg-gray-900 rounded-lg p-6 font-mono text-sm text-gray-300">
                    <div className="text-blue-400">{">"} Analyze sales data Q1 2023</div>
                    <div className="mt-2 text-green-400">
                      Processing sales data for Q1 2023...
                    </div>
                    <div className="mt-2">
                      <div className="text-yellow-400">Sales Analysis Results:</div>
                      <div className="ml-4">- Total Revenue: $1,245,360 (+12.4% YoY)</div>
                      <div className="ml-4">- Highest Growth: Electronics (+23.1%)</div>
                      <div className="ml-4">- Most Profitable Region: West (+18.7%)</div>
                      <div className="ml-4">- Customer Acquisition Cost: $34.21 (-5.2%)</div>
                    </div>
                    <div className="mt-2 text-blue-400">{">"} Generate visualization</div>
                    <div className="mt-2 text-green-400">Preparing visual report...</div>
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="lg:w-1/2 lg:pl-12"
            >
              <div className={`w-16 h-16 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center mb-6`}>
                <FiDatabase className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Powerful Data Analysis
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                Transform raw data into actionable insights with our AI-powered analysis tools. Identify trends, patterns, and opportunities with ease.
              </p>
              <ul className="space-y-3">
                {[
                  "Process and analyze large datasets",
                  "Automated trend identification",
                  "Custom data visualization",
                  "Export in multiple formats",
                  "Natural language data queries"
                ].map((item, i) => (
                  <li key={i} className="flex items-start">
                    <FiCheck className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Feature 2: Security */}
          <div className="flex flex-col-reverse lg:flex-row items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="lg:w-1/2 lg:pr-12 mt-8 lg:mt-0"
            >
              <div className={`w-16 h-16 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-6`}>
                <FiLock className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Enterprise-Grade Security
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                Your data's security is our top priority. We implement the highest standards of data protection and privacy controls.
              </p>
              <ul className="space-y-3">
                {[
                  "End-to-end encryption",
                  "SOC 2 Type II compliant",
                  "GDPR and CCPA ready",
                  "Data residency options",
                  "Regular security audits",
                  "SSO and advanced authentication"
                ].map((item, i) => (
                  <li key={i} className="flex items-start">
                    <FiCheck className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="lg:w-1/2 lg:pl-12"
            >
              <div className="bg-white p-1 rounded-2xl shadow-soft overflow-hidden">
                <div className="bg-blue-50 p-8 rounded-xl">
                  <div className="flex justify-center">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                      <FiLock className="text-blue-600 w-10 h-10" />
                    </div>
                  </div>
                  <div className="mt-6 text-center">
                    <h4 className="text-lg font-semibold text-gray-900">Your data is secure</h4>
                    <p className="mt-2 text-gray-600">All communications encrypted with AES-256</p>
                  </div>
                  <div className="mt-8 space-y-4">
                    <div className="bg-white rounded-lg p-4 flex items-center shadow-sm">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                        <FiCheck className="text-green-600" />
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900">End-to-end encryption</h5>
                        <p className="text-sm text-gray-600">Your data never leaves your device unencrypted</p>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 flex items-center shadow-sm">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                        <FiCheck className="text-green-600" />
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900">GDPR Compliant</h5>
                        <p className="text-sm text-gray-600">Full compliance with global privacy regulations</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl mb-6">
            Ready to experience the power of AI?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Sign up today and transform the way you interact with data and information
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link to="/signup" className="btn bg-white text-primary-600 hover:bg-primary-50 px-8 py-3 text-lg">
              Start for Free
            </Link>
            <Link to="/pricing" className="btn border-2 border-white text-white hover:bg-primary-700 px-8 py-3 text-lg flex items-center justify-center">
              <span>View Pricing</span>
              <FiArrowRight className="ml-2" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FeaturesPage; 
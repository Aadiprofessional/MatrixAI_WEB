import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiShield, FiUsers, FiBarChart2, FiServer, FiSettings } from 'react-icons/fi';

const EnterprisePage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    employees: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      // Reset form after submission
      setFormData({
        name: '',
        company: '',
        email: '',
        phone: '',
        employees: '',
        message: ''
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero section */}
      <div className="relative bg-indigo-700 dark:bg-indigo-900">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2850&q=80"
            alt="Enterprise office"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-indigo-700 mix-blend-multiply" />
        </div>
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl"
          >
            Enterprise Solutions
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6 text-xl text-indigo-100 max-w-3xl"
          >
            Scale AI capabilities across your organization with custom solutions built for enterprise needs.
            Our enterprise plan provides dedicated support, advanced security, and customized AI training.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-10"
          >
            <Link
              to="#contact-form"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-indigo-700 bg-white hover:bg-indigo-50 transition-colors"
            >
              Contact Sales
            </Link>
            <Link
              to="/signup?plan=enterprise"
              className="ml-4 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 bg-opacity-60 hover:bg-opacity-70 transition-colors"
            >
              Sign Up Now
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Features section */}
      <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-extrabold text-gray-900 dark:text-white"
          >
            Enterprise-grade features
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 max-w-3xl mx-auto text-xl text-gray-500 dark:text-gray-400"
          >
            Designed to meet the needs of organizations of all sizes
          </motion.p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-8"
          >
            <FiShield className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
            <h3 className="mt-6 text-xl font-bold text-gray-900 dark:text-white">Advanced Security</h3>
            <p className="mt-4 text-gray-500 dark:text-gray-400">
              SOC 2 Type II compliance, single sign-on (SSO), role-based access control, and encryption at rest and in transit.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-8"
          >
            <FiUsers className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
            <h3 className="mt-6 text-xl font-bold text-gray-900 dark:text-white">Team Collaboration</h3>
            <p className="mt-4 text-gray-500 dark:text-gray-400">
              Shared workspaces, team libraries, collaborative AI training, and departmental analytics dashboards.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-8"
          >
            <FiBarChart2 className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
            <h3 className="mt-6 text-xl font-bold text-gray-900 dark:text-white">Advanced Analytics</h3>
            <p className="mt-4 text-gray-500 dark:text-gray-400">
              Detailed usage metrics, performance insights, ROI calculators, and custom reporting capabilities.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-8"
          >
            <FiServer className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
            <h3 className="mt-6 text-xl font-bold text-gray-900 dark:text-white">API Access</h3>
            <p className="mt-4 text-gray-500 dark:text-gray-400">
              Full API access for integration with existing systems, custom applications, and third-party tools.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-8"
          >
            <FiSettings className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
            <h3 className="mt-6 text-xl font-bold text-gray-900 dark:text-white">Custom AI Training</h3>
            <p className="mt-4 text-gray-500 dark:text-gray-400">
              Train custom AI models on your industry or organization-specific data for more accurate and relevant responses.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-8"
          >
            <FiCheckCircle className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
            <h3 className="mt-6 text-xl font-bold text-gray-900 dark:text-white">Dedicated Support</h3>
            <p className="mt-4 text-gray-500 dark:text-gray-400">
              24/7 priority support, dedicated account manager, quarterly business reviews, and custom onboarding.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-white dark:bg-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-extrabold text-gray-900 dark:text-white"
            >
              Trusted by leading organizations
            </motion.h2>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-gray-50 dark:bg-gray-700 rounded-xl p-8"
            >
              <p className="text-gray-600 dark:text-gray-300 italic">"The AI assistant has transformed how our team handles customer inquiries, reducing response time by 70% and improving satisfaction scores."</p>
              <div className="mt-6 flex items-center">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                  AB
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Alex Becker</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">CTO, TechCorp</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-gray-50 dark:bg-gray-700 rounded-xl p-8"
            >
              <p className="text-gray-600 dark:text-gray-300 italic">"The enterprise security features gave us the confidence to deploy across our entire organization, even in our regulated divisions."</p>
              <div className="mt-6 flex items-center">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                  SR
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Sarah Rodriguez</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">CISO, Global Financial</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-gray-50 dark:bg-gray-700 rounded-xl p-8"
            >
              <p className="text-gray-600 dark:text-gray-300 italic">"Custom AI training on our medical datasets has allowed us to create an assistant that understands our specific terminology and workflows."</p>
              <div className="mt-6 flex items-center">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                  JK
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">James Kim</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">VP of Innovation, HealthTech</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Contact form */}
      <div id="contact-form" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Get in touch with our sales team</h2>
            <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
              Interested in our enterprise solutions? Fill out the form and one of our sales representatives will contact you within 24 hours.
            </p>
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">What to expect</h3>
              <ul className="mt-4 space-y-4">
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <FiCheckCircle />
                  </div>
                  <p className="ml-3 text-base text-gray-500 dark:text-gray-400">Personalized demo tailored to your industry</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <FiCheckCircle />
                  </div>
                  <p className="ml-3 text-base text-gray-500 dark:text-gray-400">Custom pricing proposal based on your needs</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <FiCheckCircle />
                  </div>
                  <p className="ml-3 text-base text-gray-500 dark:text-gray-400">Free technical consultation with our AI experts</p>
                </li>
              </ul>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-8"
          >
            {isSubmitted ? (
              <div className="text-center py-10">
                <FiCheckCircle className="mx-auto h-16 w-16 text-green-500" />
                <h3 className="mt-4 text-xl font-medium text-gray-900 dark:text-white">Thank you!</h3>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                  Your message has been received. A member of our sales team will contact you shortly.
                </p>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 dark:text-indigo-200 dark:bg-indigo-900 dark:hover:bg-indigo-800"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Full name
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="name"
                      id="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Company
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="company"
                      id="company"
                      required
                      value={formData.company}
                      onChange={handleChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <div className="mt-1">
                    <input
                      type="email"
                      name="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Phone
                  </label>
                  <div className="mt-1">
                    <input
                      type="tel"
                      name="phone"
                      id="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="employees" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Company size
                  </label>
                  <div className="mt-1">
                    <select
                      id="employees"
                      name="employees"
                      required
                      value={formData.employees}
                      onChange={handleChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">Select an option</option>
                      <option value="1-10">1-10 employees</option>
                      <option value="11-50">11-50 employees</option>
                      <option value="51-200">51-200 employees</option>
                      <option value="201-500">201-500 employees</option>
                      <option value="501-1000">501-1000 employees</option>
                      <option value="1000+">1000+ employees</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    How can we help?
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      required
                      value={formData.message}
                      onChange={handleChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Sending...' : 'Contact Sales'}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default EnterprisePage; 
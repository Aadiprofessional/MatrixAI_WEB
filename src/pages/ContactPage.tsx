import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiMapPin, FiPhone, FiHelpCircle, FiMessageSquare, FiUsers } from 'react-icons/fi';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '../context/ThemeContext';

const offices = [
 
  {
    city: 'Hong Kong',
    country: 'Hong Kong SAR',
    address: 'Unit G1, 35/F, Legend Tower, 7 Shing Yip Street, Kwun Tong, KLN',
    phone: '+852 66359879',
    email: 'info@matrixaiglobal.com',
    image: 'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2340&q=80',
  },
  {
    city: 'Shenzhen',
    country: 'China',
    address: '前海桂湾三路深港青年夢工場, 香港大學青年科創學院4樓',
    phone: '+86 13266989879',
    email: 'info@matrixaiglobal.com',
    image: 'https://images.unsplash.com/photo-1474181487882-5abf3f0ba6c2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2340&q=80',
  },
];

const ContactPage: React.FC = () => {
  const { t } = useTranslation();
  const { darkMode } = useContext(ThemeContext);
  
  const contactOptions = [
    {
      name: t('contact.generalInquiries'),
      description: t('contact.generalInquiriesDesc'),
      icon: FiHelpCircle,
      iconClass: 'text-blue-500',
    },
    {
    name: t('contact.sales'),
      description: t('contact.salesDesc'),
      icon: FiUsers,
      iconClass: 'text-green-500',
    },
    {
      name: t('contact.support'),
      description: t('contact.supportDesc'),
      icon: FiMessageSquare,
      iconClass: 'text-purple-500',
    },
  ];
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const typeParam = searchParams.get('type');

  const [contactReason, setContactReason] = useState<string>(
    typeParam === 'support' 
      ? 'Support' 
      : typeParam === 'enterprise' 
        ? 'Sales' 
        : typeParam === 'press' 
          ? 'Press' 
          : ''
  );
  const [submitted, setSubmitted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real application, we would handle the form submission here
    // For this demo, we'll just show a success message
    setSubmitted(true);
  };

  return (
    <div className={`min-h-screen ${
      darkMode ? 'bg-black' : 'bg-white'
    }`}>
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        {/* Background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-b z-0 ${
          darkMode ? 'from-purple-900/20 to-black' : 'from-purple-100/30 to-white'
        }`}></div>
        
        {/* Animated grid background */}
        <div className="absolute inset-0 z-0 opacity-30">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <h1 className={`text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {t('contact.title')}
              </h1>
              <p className={`mt-6 text-xl max-w-3xl mx-auto ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {t('contact.subtitle')}
              </p>
            </motion.div>
          </div>
        </div>
        
        {/* Glowing orb decoration */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full filter blur-3xl opacity-30"></div>
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full filter blur-3xl opacity-20"></div>
      </section>

      {/* Contact Options */}
      <section className="py-12 relative">
        {/* Background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-b z-0 ${
          darkMode ? 'from-black to-black/80' : 'from-white to-gray-50/80'
        }`}></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {contactOptions.map((option) => (
              <motion.div
                key={option.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className={`backdrop-blur-md rounded-xl p-8 border cursor-pointer hover:shadow-lg transition-all duration-300 ${
                  darkMode 
                    ? 'bg-black/30 border-gray-700 hover:shadow-purple-900/20 hover:border-purple-700/50' 
                    : 'bg-white/30 border-gray-300 hover:shadow-purple-200/20 hover:border-purple-300/50'
                } ${
                  contactReason === option.name ? 'ring-2 ring-purple-500' : ''
                }`}
                onClick={() => setContactReason(option.name)}
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${option.iconClass} bg-opacity-20`}>
                  <option.icon className="h-6 w-6" />
                </div>
                <h3 className={`mt-4 text-lg font-semibold ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>{option.name}</h3>
                <p className={`mt-2 text-sm ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>{option.description}</p>
                <div className="mt-4">
                  <input
                    type="radio"
                    name="contact-reason"
                    id={`option-${option.name}`}
                    checked={contactReason === option.name}
                    onChange={() => setContactReason(option.name)}
                    className="sr-only"
                  />
                  <label
                    htmlFor={`option-${option.name}`}
                    className={`inline-flex items-center text-sm font-medium ${
                      contactReason === option.name 
                        ? 'text-purple-400' 
                        : darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    <span className={`w-4 h-4 mr-2 rounded-full border ${
                      contactReason === option.name
                        ? 'bg-purple-500 border-purple-500'
                        : darkMode ? 'border-gray-600' : 'border-gray-400'
                    }`}>
                      {contactReason === option.name && (
                        <span className="absolute w-2 h-2 mx-1 my-1 rounded-full bg-white" />
                      )}
                    </span>
                    {t('contact.select')}
                  </label>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-12 relative">
        {/* Background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-b z-0 ${
          darkMode ? 'from-black/80 to-black' : 'from-gray-50/80 to-white'
        }`}></div>
        
        {/* Animated grid background */}
        <div className="absolute inset-0 z-0 opacity-20">
          <div className={`absolute inset-0 bg-[size:24px_24px] ${
            darkMode 
              ? 'bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)]'
              : 'bg-[linear-gradient(to_right,#00000012_1px,transparent_1px),linear-gradient(to_bottom,#00000012_1px,transparent_1px)]'
          }`}></div>
        </div>
        
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className={`backdrop-blur-md rounded-2xl shadow-lg border overflow-hidden ${
              darkMode 
                ? 'bg-black/30 border-gray-700' 
                : 'bg-white/30 border-gray-300'
            }`}
          >
            <div className="px-6 py-8 md:p-10">
              {!submitted ? (
                <>
                  <div className="text-center mb-10">
                    <h2 className={`text-3xl font-bold ${
                      darkMode ? 'text-white' : 'text-gray-900'
                    }`}>{t('contact.sendMessage')}</h2>
                    <p className={`mt-4 text-lg ${
                      darkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {contactReason
                        ? t('contact.selectedReason', { reason: contactReason })
                        : t('contact.selectReason')}
                    </p>
                  </div>
                  
                  <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="first-name" className={`block text-sm font-medium ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {t('contact.firstName')}
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            name="first-name"
                            id="first-name"
                            autoComplete="given-name"
                            required
                            className={`py-3 px-4 block w-full border focus:ring-purple-500 focus:border-purple-500 rounded-md ${
                              darkMode 
                                ? 'bg-black/50 border-gray-700 text-white placeholder-gray-500' 
                                : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-400'
                            }`}
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="last-name" className={`block text-sm font-medium ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {t('contact.lastName')}
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            name="last-name"
                            id="last-name"
                            autoComplete="family-name"
                            required
                            className={`py-3 px-4 block w-full border focus:ring-purple-500 focus:border-purple-500 rounded-md ${
                              darkMode 
                                ? 'bg-black/50 border-gray-700 text-white placeholder-gray-500' 
                                : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-400'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="email" className={`block text-sm font-medium ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {t('contact.email')}
                        </label>
                        <div className="mt-1">
                          <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            className={`py-3 px-4 block w-full border focus:ring-purple-500 focus:border-purple-500 rounded-md ${
                              darkMode 
                                ? 'bg-black/50 border-gray-700 text-white placeholder-gray-500' 
                                : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-400'
                            }`}
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="phone" className={`block text-sm font-medium ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {t('contact.phone')}
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            name="phone"
                            id="phone"
                            autoComplete="tel"
                            className={`py-3 px-4 block w-full border focus:ring-purple-500 focus:border-purple-500 rounded-md ${
                              darkMode 
                                ? 'bg-black/50 border-gray-700 text-white placeholder-gray-500' 
                                : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-400'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="company" className={`block text-sm font-medium ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {t('contact.company')}
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="company"
                          id="company"
                          autoComplete="organization"
                          className={`py-3 px-4 block w-full border focus:ring-purple-500 focus:border-purple-500 rounded-md ${
                            darkMode 
                              ? 'bg-black/50 border-gray-700 text-white placeholder-gray-500' 
                              : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-400'
                          }`}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="subject" className={`block text-sm font-medium ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {t('contact.subject')}
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="subject"
                          id="subject"
                          required
                          className={`py-3 px-4 block w-full border focus:ring-purple-500 focus:border-purple-500 rounded-md ${
                            darkMode 
                              ? 'bg-black/50 border-gray-700 text-white placeholder-gray-500' 
                              : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-400'
                          }`}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="message" className={`block text-sm font-medium ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {t('contact.message')}
                      </label>
                      <div className="mt-1">
                        <textarea
                          id="message"
                          name="message"
                          rows={6}
                          required
                          className={`py-3 px-4 block w-full border focus:ring-purple-500 focus:border-purple-500 rounded-md ${
                            darkMode 
                              ? 'bg-black/50 border-gray-700 text-white placeholder-gray-500' 
                              : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-400'
                          }`}
                          placeholder={t('contact.messagePlaceholder')}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-baseline">
                      <input
                        id="agree-terms"
                        name="agree-terms"
                        type="checkbox"
                        required
                        className={`h-4 w-4 text-purple-600 focus:ring-purple-500 rounded ${
                          darkMode ? 'bg-black/50 border-gray-700' : 'bg-white border-gray-300'
                        }`}
                      />
                      <label htmlFor="agree-terms" className={`ml-2 block text-sm ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {t('contact.agreeTerms')}
                      </label>
                    </div>
                    
                    <div className="text-center">
                      <button
                        type="submit"
                        className={`inline-flex justify-center py-3 px-6 border border-transparent shadow-lg text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-300 ${
                          darkMode ? 'focus:ring-offset-black' : 'focus:ring-offset-white'
                        }`}
                      >
                        {t('contact.sendButton')}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <svg className="w-16 h-16 text-purple-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <h2 className={`mt-6 text-3xl font-bold ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>{t('contact.thankYou')}</h2>
                  <p className={`mt-2 text-lg ${
                    darkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {t('contact.successMessage')}
                  </p>
                  <button
                    className={`mt-8 inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-lg text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-300 ${
                      darkMode ? 'focus:ring-offset-black' : 'focus:ring-offset-white'
                    }`}
                    onClick={() => setSubmitted(false)}
                  >
                    {t('contact.sendAnother')}
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Offices */}
      <section className="py-20 relative">
        {/* Background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-b z-0 ${
          darkMode ? 'from-black to-black/90' : 'from-gray-50 to-white'
        }`}></div>
        
        {/* Animated grid background */}
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <h2 className={`text-3xl font-bold ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>{t('contact.ourOffices')}</h2>
              <p className={`mt-4 text-xl ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {t('contact.visitOffices')}
              </p>
            </motion.div>
          </div>
          
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {offices.map((office, index) => (
              <motion.div
                key={office.city}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`backdrop-blur-md rounded-xl shadow-lg border overflow-hidden transition-all duration-300 ${
                  darkMode 
                    ? 'bg-black/30 border-gray-700 hover:shadow-purple-900/20 hover:border-purple-700/50' 
                    : 'bg-white/30 border-gray-300 hover:shadow-purple-200/20 hover:border-purple-300/50'
                }`}
              >
                <div className="h-48 relative overflow-hidden">
                  <img
                    src={office.image}
                    alt={`${office.city} office`}
                    className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity duration-300"
                  />
                </div>
                <div className="p-6">
                  <h3 className={`text-xl font-semibold ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>{office.city}, {office.country}</h3>
                  <div className="mt-4 space-y-3">
                    <div className="flex">
                      <FiMapPin className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                      <span className={`ml-3 ${
                        darkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>{office.address}</span>
                    </div>
                    <div className="flex">
                      <FiPhone className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                      <span className={`ml-3 ${
                        darkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>{office.phone}</span>
                    </div>
                    <div className="flex">
                      <FiMail className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                      <a href={`mailto:${office.email}`} className="ml-3 text-purple-400 hover:text-purple-300 transition-colors duration-300">
                        {office.email}
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


    </div>
  );
};

export default ContactPage;
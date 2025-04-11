import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiMapPin, FiPhone, FiHelpCircle, FiMessageSquare, FiUsers } from 'react-icons/fi';
import { useLocation } from 'react-router-dom';

const contactOptions = [
  {
    name: 'General Inquiries',
    description: 'Questions about our products or services',
    icon: FiHelpCircle,
    iconClass: 'text-blue-500',
  },
  {
    name: 'Sales',
    description: 'Talk to our sales team about your needs',
    icon: FiUsers,
    iconClass: 'text-green-500',
  },
  {
    name: 'Support',
    description: 'Get help with your existing account',
    icon: FiMessageSquare,
    iconClass: 'text-purple-500',
  },
];

const offices = [
  {
    city: 'San Francisco',
    country: 'United States',
    address: '100 Market Street, Suite 300, San Francisco, CA 94105',
    phone: '+1 (415) 555-1234',
    email: 'sf@aiassistant.com',
    image: 'https://images.unsplash.com/photo-1449034446853-66c86144b0ad?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2340&q=80',
  },
  {
    city: 'London',
    country: 'United Kingdom',
    address: '10 Primrose Street, London, EC2A 2EW',
    phone: '+44 20 7123 4567',
    email: 'london@aiassistant.com',
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2340&q=80',
  },
  {
    city: 'Singapore',
    country: 'Singapore',
    address: '1 Raffles Place, #20-61 Tower 2, Singapore 048616',
    phone: '+65 6123 4567',
    email: 'singapore@aiassistant.com',
    image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2829&q=80',
  },
];

const ContactPage: React.FC = () => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real application, we would handle the form submission here
    // For this demo, we'll just show a success message
    setSubmitted(true);
  };

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
                Get in Touch
              </h1>
              <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
                Have questions or need help? We're here for you. Reach out to our team and we'll get back to you shortly.
              </p>
            </motion.div>
          </div>
        </div>
        {/* Background decoration */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-10">
          <svg width="640" height="392" fill="none" viewBox="0 0 640 392">
            <defs>
              <pattern id="9ebea6f4-a1f5-4d96-8c4e-4c2abf658047" x="118" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="4" height="4" className="text-gray-100" fill="currentColor" />
              </pattern>
            </defs>
            <rect x="118" y="0" width="404" height="392" fill="url(#9ebea6f4-a1f5-4d96-8c4e-4c2abf658047)" />
          </svg>
        </div>
      </section>

      {/* Contact Options */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {contactOptions.map((option) => (
              <motion.div
                key={option.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className={`bg-white rounded-xl shadow-soft p-8 border border-gray-100 cursor-pointer hover:shadow-md transition-shadow ${
                  contactReason === option.name ? 'ring-2 ring-primary-500' : ''
                }`}
                onClick={() => setContactReason(option.name)}
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${option.iconClass} bg-opacity-10`}>
                  <option.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{option.name}</h3>
                <p className="mt-2 text-sm text-gray-600">{option.description}</p>
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
                      contactReason === option.name ? 'text-primary-600' : 'text-gray-500'
                    }`}
                  >
                    <span className={`w-4 h-4 mr-2 rounded-full border ${
                      contactReason === option.name
                        ? 'bg-primary-500 border-primary-500'
                        : 'border-gray-300'
                    }`}>
                      {contactReason === option.name && (
                        <span className="absolute w-2 h-2 mx-1 my-1 rounded-full bg-white" />
                      )}
                    </span>
                    Select
                  </label>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-soft overflow-hidden"
          >
            <div className="px-6 py-8 md:p-10">
              {!submitted ? (
                <>
                  <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold text-gray-900">Send us a message</h2>
                    <p className="mt-4 text-lg text-gray-600">
                      {contactReason
                        ? `You've selected ${contactReason}. Fill out the form below and we'll get back to you as soon as possible.`
                        : 'Please select a reason for contact above and fill out the form below.'}
                    </p>
                  </div>
                  
                  <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="first-name" className="block text-sm font-medium text-gray-700">
                          First name
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            name="first-name"
                            id="first-name"
                            autoComplete="given-name"
                            required
                            className="py-3 px-4 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="last-name" className="block text-sm font-medium text-gray-700">
                          Last name
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            name="last-name"
                            id="last-name"
                            autoComplete="family-name"
                            required
                            className="py-3 px-4 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                          Email
                        </label>
                        <div className="mt-1">
                          <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            className="py-3 px-4 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                          Phone
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            name="phone"
                            id="phone"
                            autoComplete="tel"
                            className="py-3 px-4 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                        Company
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="company"
                          id="company"
                          autoComplete="organization"
                          className="py-3 px-4 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                        Subject
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="subject"
                          id="subject"
                          required
                          className="py-3 px-4 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                        Message
                      </label>
                      <div className="mt-1">
                        <textarea
                          id="message"
                          name="message"
                          rows={6}
                          required
                          className="py-3 px-4 block w-full shadow-sm focus:ring-primary-500 focus:border-primary-500 border-gray-300 rounded-md"
                          placeholder="How can we help you?"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-baseline">
                      <input
                        id="agree-terms"
                        name="agree-terms"
                        type="checkbox"
                        required
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="agree-terms" className="ml-2 block text-sm text-gray-600">
                        I agree to the privacy policy and terms of service.
                      </label>
                    </div>
                    
                    <div className="text-center">
                      <button
                        type="submit"
                        className="inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        Send Message
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
                  <svg className="w-16 h-16 text-green-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <h2 className="mt-6 text-3xl font-bold text-gray-900">Thank you!</h2>
                  <p className="mt-2 text-lg text-gray-600">
                    Your message has been sent successfully. We'll get back to you as soon as possible.
                  </p>
                  <button
                    className="mt-8 inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    onClick={() => setSubmitted(false)}
                  >
                    Send another message
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Offices */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-bold text-gray-900">Our Offices</h2>
              <p className="mt-4 text-xl text-gray-600">
                Visit us at one of our global offices
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
                className="bg-white rounded-xl shadow-soft overflow-hidden"
              >
                <div className="h-48 relative overflow-hidden">
                  <img
                    src={office.image}
                    alt={`${office.city} office`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900">{office.city}, {office.country}</h3>
                  <div className="mt-4 space-y-3">
                    <div className="flex">
                      <FiMapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="ml-3 text-gray-600">{office.address}</span>
                    </div>
                    <div className="flex">
                      <FiPhone className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <span className="ml-3 text-gray-600">{office.phone}</span>
                    </div>
                    <div className="flex">
                      <FiMail className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <a href={`mailto:${office.email}`} className="ml-3 text-primary-600 hover:text-primary-500">
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

      {/* FAQ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
              <p className="mt-4 text-xl text-gray-600">
                Can't find what you're looking for? Contact our support team.
              </p>
            </motion.div>
          </div>
          
          <div className="space-y-6">
            {[
              {
                question: 'How quickly will I receive a response?',
                answer: 'We aim to respond to all inquiries within 24 hours during business days. For urgent support issues, premium and enterprise customers have access to expedited response times.'
              },
              {
                question: 'Do you offer phone support?',
                answer: 'Phone support is available for enterprise customers. All customers can reach us via email, chat, or by submitting this contact form.'
              },
              {
                question: 'I\'m interested in a partnership. Who should I contact?',
                answer: 'For partnership inquiries, please select "General Inquiries" and mention partnership in your message. Our business development team will get back to you.'
              },
              {
                question: 'Do you have a knowledge base or help center?',
                answer: 'Yes, we have an extensive knowledge base with tutorials, guides, and FAQs at help.aiassistant.com. It\'s a great first stop for common questions.'
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-white rounded-lg p-6 shadow-soft"
              >
                <h3 className="text-lg font-semibold text-gray-900">{faq.question}</h3>
                <p className="mt-2 text-gray-600">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage; 
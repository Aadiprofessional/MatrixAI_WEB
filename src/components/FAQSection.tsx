import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  title: string;
  faqs: FAQItem[];
}

const FAQSection: React.FC<FAQSectionProps> = ({ title, faqs }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20 bg-black">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold text-white text-center mb-12"
        >
          {title}
        </motion.h2>
        
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="border-b border-gray-800 pb-2"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between py-4 text-left focus:outline-none"
              >
                <span className="text-lg font-medium text-white">{faq.question}</span>
                <span className="ml-6 flex-shrink-0">
                  <svg
                    className={`h-6 w-6 transform ${openIndex === index ? 'rotate-180' : 'rotate-0'} text-gray-400 transition-transform duration-300`}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </button>
              
              <div
                className={`overflow-hidden transition-all duration-300 ${openIndex === index ? 'max-h-96 opacity-100 pb-4' : 'max-h-0 opacity-0'}`}
              >
                <p className="text-gray-400">{faq.answer}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
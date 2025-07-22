import React from 'react';
import { motion } from 'framer-motion';

interface ComparisonItemProps {
  icon: React.ReactNode;
  text: string;
  isPositive?: boolean;
}

const ComparisonItem: React.FC<ComparisonItemProps> = ({ icon, text, isPositive = true }) => {
  return (
    <div className="flex items-center space-x-3 mb-4">
      <span className={`flex-shrink-0 ${isPositive ? 'text-blue-500' : 'text-gray-500'}`}>
        {icon}
      </span>
      <span className={`text-sm ${isPositive ? 'text-white' : 'text-gray-400'}`}>{text}</span>
    </div>
  );
};

const ComparisonSection: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-black to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-4xl font-bold text-white text-center mb-4"
        >
          Why wait weeks? Turn images<br />into videos in minutes
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
          className="text-xl text-gray-300 text-center mb-16 max-w-3xl mx-auto"
        >
          Experience the difference between instant creativity and old-school production headaches.
        </motion.p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 relative">
          {/* Left side - AI Video Generator */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="relative rounded-xl overflow-hidden"
          >
            {/* Outer layer - white opacity border with glow */}
            <div className="absolute inset-0 border-2 border-white/40 rounded-xl shadow-lg shadow-blue-500/20"></div>
            
            {/* Middle layer - subtle glow effect */}
            <div className="absolute inset-[3px] rounded-lg bg-gradient-to-br from-white/10 to-transparent"></div>
            
            {/* Inner layer - glass effect with backdrop blur */}
            <div className="absolute inset-[6px] backdrop-blur-lg bg-black/30 rounded-lg border border-white/20 shadow-inner shadow-white/10"></div>
            
            {/* Content container with glass morphism */}
            <div className="absolute inset-[6px] bg-gradient-to-br from-white/5 to-transparent opacity-80 rounded-lg"></div>
            
            <div className="relative z-10 p-6">
              <div className="mb-6 overflow-hidden rounded-lg">
                <img 
                  src="/images/ai-generator.svg" 
                  alt="AI Video Generator" 
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">matrixai.asia's Video Generator</h3>
              
              <ComparisonItem 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>}
                text="Write Your Prompt"
              />
              <p className="text-sm text-gray-400 ml-8 mb-4">Share your idea in plain language. Be specific about style, subject, action and camera movements.</p>
              
              <ComparisonItem 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>}
                text="Upload an Image"
              />
              <p className="text-sm text-gray-400 ml-8 mb-4">Drop in any photo, drawing, or graphic from your device or choose one from your matrixai.asia Gallery.</p>
              
              <ComparisonItem 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>}
                text="Generate and Download"
              />
              <p className="text-sm text-gray-400 ml-8 mb-4">Click once. The platform handles everything. Your video will be ready to preview and download in minutes.</p>
            </div>
          </motion.div>
          
          {/* VS in the middle with vertical line */}
          <div className="hidden md:flex absolute left-1/2 top-0 bottom-0 -translate-x-1/2 items-center justify-center z-20">
            {/* Vertical line */}
            <div className="absolute h-full w-[1px] bg-gradient-to-b from-transparent via-white/30 to-transparent"></div>
            
            {/* VS in the middle */}
          
              <span className="text-2xl font-semibold text-white">vs</span>
        
          </div>
          
          {/* Right side - Traditional Video Production */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="relative rounded-xl overflow-hidden"
          >
            {/* Outer layer - white opacity border with glow */}
            <div className="absolute inset-0 border-2 border-white/40 rounded-xl shadow-lg shadow-blue-500/20"></div>
            
            {/* Middle layer - subtle glow effect */}
            <div className="absolute inset-[3px] rounded-lg bg-gradient-to-br from-white/10 to-transparent"></div>
            
            {/* Inner layer - glass effect with backdrop blur */}
            <div className="absolute inset-[6px] backdrop-blur-lg bg-black/30 rounded-lg border border-white/20 shadow-inner shadow-white/10"></div>
            
            {/* Content container with glass morphism */}
            <div className="absolute inset-[6px] bg-gradient-to-br from-white/5 to-transparent opacity-80 rounded-lg"></div>
            
            <div className="relative z-10 p-6">
              <div className="mb-6 overflow-hidden rounded-lg">
                <img 
                  src="/images/traditional-video.svg" 
                  alt="Traditional Video Production" 
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Traditional Video Production</h3>
              
              <div className="space-y-4">
                <ComparisonItem 
                  icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>}
                  text="Research production companies or freelancers"
                  isPositive={false}
                />
                
                <ComparisonItem 
                  icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>}
                  text="Request quotes and negotiate contracts"
                  isPositive={false}
                />
                
                <ComparisonItem 
                  icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>}
                  text="Plan concepts and write scripts"
                  isPositive={false}
                />
                
                <ComparisonItem 
                  icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>}
                  text="Schedule calls and creative meetings"
                  isPositive={false}
                />
                
                <ComparisonItem 
                  icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>}
                  text="Scout locations and secure equipment"
                  isPositive={false}
                />
                
                <ComparisonItem 
                  icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>}
                  text="Book talent, crew, and manage calendars"
                  isPositive={false}
                />
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Mobile VS (only visible on small screens) */}
        <div className="md:hidden relative flex items-center justify-center mt-8 mb-8">
          {/* Horizontal line */}
          <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
          
          {/* VS in the middle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
            className="relative z-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full px-6 py-3 shadow-lg shadow-indigo-500/20"
          >
            <span className="text-2xl font-semibold text-white">vs</span>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ComparisonSection;
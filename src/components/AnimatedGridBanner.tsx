import React from 'react';
import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';

interface AnimatedGridBannerProps {
  title: string;
  description?: string;
  buttonText?: string;
  buttonLink?: string;
}

const AnimatedGridBanner: React.FC<AnimatedGridBannerProps> = ({
  title,
  description,
  buttonText = 'Get Started',
  buttonLink = '/signup'
}) => {
  // No need to generate grid cells as we're using separate horizontal and vertical lines
  
  return (
    <div className="relative w-full max-w-5xl mx-auto overflow-hidden rounded-lg border border-gray-800/30 shadow-2xl shadow-blue-900/10 bg-black mb-10">
      {/* Animated grid background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Horizontal grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between">
          {Array.from({ length: 12 }, (_, i) => (
            <motion.div 
              key={`h-${i}`}
              className="h-px w-full bg-white/5"
              initial={{ opacity: 0.03, boxShadow: '0 0 1px rgba(255,255,255,0.05)' }}
              animate={{ 
                opacity: [0.03, 0.07, 0.03],
                boxShadow: [
                  '0 0 1px rgba(255,255,255,0.05)', 
                  '0 0 2px rgba(255,255,255,0.1)', 
                  '0 0 1px rgba(255,255,255,0.05)'
                ]
              }}
              transition={{ 
                duration: 3 + Math.random() * 2, 
                repeat: Infinity,
                repeatType: 'reverse',
                delay: Math.random() * 2
              }}
            />
          ))}
        </div>
        
        {/* Vertical grid lines */}
        <div className="absolute inset-0 flex flex-row justify-between">
          {Array.from({ length: 15 }, (_, i) => (
            <motion.div 
              key={`v-${i}`}
              className="w-px h-full bg-white/5"
              initial={{ opacity: 0.03, boxShadow: '0 0 1px rgba(255,255,255,0.05)' }}
              animate={{ 
                opacity: [0.03, 0.07, 0.03],
                boxShadow: [
                  '0 0 1px rgba(255,255,255,0.05)', 
                  '0 0 2px rgba(255,255,255,0.1)', 
                  '0 0 1px rgba(255,255,255,0.05)'
                ]
              }}
              transition={{ 
                duration: 3 + Math.random() * 2, 
                repeat: Infinity,
                repeatType: 'reverse',
                delay: Math.random() * 2
              }}
            />
          ))}
        </div>
        
        {/* Gradient overlay */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-b from-black/10 via-blue-900/5 to-black/20"
          animate={{
            background: [
              'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(29,78,216,0.05), rgba(0,0,0,0.2))',
              'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(37,99,235,0.07), rgba(0,0,0,0.2))',
              'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(29,78,216,0.05), rgba(0,0,0,0.2))'
            ]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
        />
        
        {/* Additional subtle glow effect */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent"
          animate={{
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            repeatType: 'reverse'
          }}
        />
      </div>
      
      {/* Content */}
      <div className="relative z-10 px-6 py-12 md:py-16 lg:py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
            {title}
          </h2>
          
          {description && (
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
              {description}
            </p>
          )}
          
          {buttonText && (
            <Link 
              to={buttonLink} 
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-medium text-base shadow-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors duration-300"
            >
              {buttonText} <FiArrowRight className="ml-2" />
            </Link>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AnimatedGridBanner;
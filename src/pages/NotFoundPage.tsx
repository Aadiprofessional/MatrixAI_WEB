import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import '../styles/CommonStyles.css';

const NotFoundPage: React.FC = () => {
  const { t } = useTranslation();
  const { darkMode } = useTheme();
  
  return (
    <div className={`min-h-[calc(100vh-16rem)] flex items-center justify-center px-4 py-12 page-background ${darkMode ? 'text-white' : 'text-gray-900'}`}>
      {/* Background gradient effects */}
      <div className="gradient-blob-1"></div>
      <div className="gradient-blob-2"></div>
      <div className="relative">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden -z-10">
          <div className="absolute top-40 -left-20 w-40 h-40 bg-primary-100 rounded-full opacity-50 blur-3xl"></div>
          <div className="absolute -bottom-20 right-10 w-60 h-60 bg-secondary-200 rounded-full opacity-40 blur-3xl"></div>
          <div className="absolute -top-10 right-20 w-20 h-20 bg-secondary-100 rounded-full opacity-60 blur-xl"></div>
        </div>
        
        <div className="max-w-lg text-center glass-effect p-8 rounded-xl">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-9xl font-bold page-title mb-6 opacity-80 font-display">
              404
            </h1>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-primary mb-6 section-title">
              {t('notFound.title')}
            </h2>
            
            <p className="text-lg text-secondary mb-8">
              {t('notFound.description')}
            </p>
            
            <div className="space-y-4">
              <Link 
                to="/" 
                className="btn btn-primary px-8 py-3 inline-block"
              >
                {t('notFound.returnHome')}
              </Link>
              
              <div className="pt-4">
                <span className="text-tertiary">
                  {t('notFound.needHelp')} <Link to="/contact" className="text-primary-600 hover:text-primary-700 underline">{t('notFound.contactUs')}</Link>
                </span>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Decorative circuit board pattern */}
        <svg 
          className="absolute -z-10 w-full h-full inset-0 opacity-5 text-primary-500" 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 800 800"
          fill="currentColor"
        >
          <rect x="400" y="0" width="2" height="800"></rect>
          <rect x="0" y="400" width="800" height="2"></rect>
          
          {/* Horizontal lines */}
          {[100, 200, 300, 500, 600, 700].map(y => (
            <rect key={`h-${y}`} x="0" y={y} width="800" height="1"></rect>
          ))}
          
          {/* Vertical lines */}
          {[100, 200, 300, 500, 600, 700].map(x => (
            <rect key={`v-${x}`} x={x} y="0" width="1" height="800"></rect>
          ))}
          
          {/* Random circles */}
          {[
            { cx: 100, cy: 100, r: 5 },
            { cx: 300, cy: 200, r: 8 },
            { cx: 500, cy: 100, r: 4 },
            { cx: 700, cy: 300, r: 6 },
            { cx: 200, cy: 500, r: 7 },
            { cx: 400, cy: 600, r: 5 },
            { cx: 600, cy: 700, r: 8 },
            { cx: 100, cy: 700, r: 4 },
            { cx: 700, cy: 500, r: 6 },
          ].map((circle, idx) => (
            <circle key={idx} {...circle}></circle>
          ))}
          
          {/* Circuit connections */}
          <path d="M100,100 L200,100 L200,200 L300,200 L300,100 L400,100"></path>
          <path d="M500,100 L600,100 L600,200 L700,200 L700,300 L600,300"></path>
          <path d="M100,700 L100,600 L200,600 L200,500 L300,500 L300,600"></path>
          <path d="M500,700 L500,600 L600,600 L600,500 L700,500 L700,400"></path>
        </svg>
      </div>
    </div>
  );
};

export default NotFoundPage;
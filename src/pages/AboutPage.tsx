import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { FiMessageCircle, FiUsers, FiGlobe, FiStar } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '../context/ThemeContext';
import '../styles/CommonStyles.css';

const AboutPage: React.FC = () => {
  const { t } = useTranslation();
  const { darkMode } = useContext(ThemeContext);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Add scroll event listener to create a scrolled effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  


  const values = [
    {
      title: t('about.values.userCentric.title'),
      description: t('about.values.userCentric.description'),
      icon: <FiUsers className={`h-12 w-12 ${
        darkMode ? 'text-indigo-400' : 'text-indigo-600'
      }`} />
    },
    {
      title: t('about.values.responsibleAI.title'),
      description: t('about.values.responsibleAI.description'),
      icon: <FiStar className={`h-12 w-12 ${
        darkMode ? 'text-indigo-400' : 'text-indigo-600'
      }`} />
    },
    {
      title: t('about.values.openCommunication.title'),
      description: t('about.values.openCommunication.description'),
      icon: <FiMessageCircle className={`h-12 w-12 ${
        darkMode ? 'text-indigo-400' : 'text-indigo-600'
      }`} />
    },
    {
      title: t('about.values.globalPerspective.title'),
      description: t('about.values.globalPerspective.description'),
      icon: <FiGlobe className={`h-12 w-12 ${
        darkMode ? 'text-indigo-400' : 'text-indigo-600'
      }`} />
    }
  ];

  return (
    <div className={`min-h-screen page-background ${darkMode ? 'text-white' : 'text-gray-900'}`}>
      {/* Background gradient effects */}
      <div className="gradient-blob-1"></div>
      <div className="gradient-blob-2"></div>
      
      {/* Hero section */}
      <div className="relative py-24 overflow-hidden">
        {/* Animated grid background similar to HomePage */}
        <div className="absolute inset-0 z-0 opacity-30">
          <div className={`absolute inset-0 bg-[size:24px_24px] ${
            darkMode 
              ? 'bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)]'
              : 'bg-[linear-gradient(to_right,#00000012_1px,transparent_1px),linear-gradient(to_bottom,#00000012_1px,transparent_1px)]'
          }`}></div>
        </div>
        
        {/* Background image with overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2850&q=80"
            alt="Team collaboration"
            className="w-full h-full object-cover opacity-20"
          />
          <div className={`absolute inset-0 ${darkMode ? 'bg-gradient-to-b from-purple-900/40 to-black/90' : 'bg-gradient-to-b from-purple-100/40 to-white/90'}`}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="page-title text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl"
          >
            {t('about.title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className={`mt-6 text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'} max-w-3xl`}
          >
            {t('about.description')}
          </motion.p>
        </div>
      </div>

      {/* Our story section */}
      <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative">
        {/* Glass card effect */}
        <div className="glass-effect mx-4 sm:mx-6 lg:mx-8 z-0"></div>
        
        <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
          >
            <h2 className={`text-3xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{t('about.ourStory.title')}</h2>
            <div className={`mt-6 space-y-6 text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <p>
                {t('about.ourStory.paragraph1')}
              </p>
              <p>
                {t('about.ourStory.paragraph2')}
              </p>
              <p>
                {t('about.ourStory.paragraph3')}
              </p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative h-96 rounded-xl overflow-hidden shadow-xl"
          >
            <img
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2850&q=80"
              alt="Our team"
              className="w-full h-full object-cover"
            />
          </motion.div>
        </div>
      </div>

      {/* Values section */}
      <div className="py-16 relative overflow-hidden">
        {/* Animated grid background */}
        <div className="absolute inset-0 z-0 opacity-30">
          <div className={`absolute inset-0 bg-[size:24px_24px] ${
            darkMode 
              ? 'bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)]'
              : 'bg-[linear-gradient(to_right,#00000012_1px,transparent_1px),linear-gradient(to_bottom,#00000012_1px,transparent_1px)]'
          }`}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="section-title text-3xl font-extrabold">{t('about.values.title')}</h2>
            <p className={`mt-4 max-w-3xl mx-auto text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {t('about.values.description')}
            </p>
          </motion.div>
          
          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`glass-effect p-8 text-center transition-all duration-300 ${
                  darkMode 
                    ? 'hover:shadow-purple-900/20 hover:border-purple-700/50' 
                    : 'hover:shadow-purple-200/20 hover:border-purple-300/50'
                }`}
              >
                <div className={`flex justify-center ${
                  darkMode ? 'text-purple-400' : 'text-purple-600'
                }`}>{value.icon}</div>
                <h3 className={`mt-6 text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value.title}</h3>
                <p className={`mt-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>


    </div>
  );
};

export default AboutPage;
import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  FiGithub, 
  FiTwitter, 
  FiLinkedin, 
  FiInstagram, 
  FiYoutube, 
  FiHelpCircle, 
  FiLock, 
  FiShield,
  FiCpu,
  FiUsers,
  FiBookOpen,
  FiHeadphones,
  FiChevronDown
} from 'react-icons/fi';

const Footer: React.FC = () => {
  const { darkMode } = useContext(ThemeContext);
  const { t } = useLanguage();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  const toggleSection = (title: string) => {
    if (expandedSection === title) {
      setExpandedSection(null);
    } else {
      setExpandedSection(title);
    }
  };
  
  // Links grouped by category
  const footerSections = [
    {
      title: t('footer.company'),
      links: [
        { text: t('footer.about'), url: "/about", icon: <FiUsers size={14} /> },
        { text: t('footer.careers'), url: "/careers", icon: <FiBookOpen size={14} /> },
        { text: t('footer.blog'), url: "/blog", icon: <FiBookOpen size={14} /> },
      ]
    },
    
    {
      title: t('footer.legal'),
      links: [
        { text: t('footer.privacy'), url: "/privacy", icon: <FiLock size={14} /> },
        { text: t('footer.terms'), url: "/terms", icon: <FiShield size={14} /> },
        { text: t('footer.cookies'), url: "/cookies", icon: <FiShield size={14} /> },
      ]
    },
    {
      title: t('footer.support'),
      links: [
        { text: t('footer.help'), url: "/help", icon: <FiHelpCircle size={14} /> },
        { text: t('footer.contact'), url: "/contact", icon: <FiHeadphones size={14} /> },
        { text: t('footer.status'), url: "/status", icon: <FiCpu size={14} /> },
      ]
    }
  ];
  
  return (
    <footer className={`${
      darkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600'
    } border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} w-full`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-8">
          {/* Brand and company info */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                AI
              </div>
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
                AI
              </span>
            </div>
            <p className={`mb-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {t('footer.description')}
            </p>
            <div className="flex space-x-4 mb-4">
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors`}
                aria-label="GitHub"
              >
                <FiGithub size={20} />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors`}
                aria-label="Twitter"
              >
                <FiTwitter size={20} />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors`}
                aria-label="LinkedIn"
              >
                <FiLinkedin size={20} />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors`}
                aria-label="Instagram"
              >
                <FiInstagram size={20} />
              </a>
              <a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className={`${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors`}
                aria-label="YouTube"
              >
                <FiYoutube size={20} />
              </a>
            </div>
          </div>
          
          {/* Links sections - Collapsible on mobile */}
          {footerSections.map((section) => (
            <div key={section.title} className="md:col-span-auto border-b md:border-b-0 last:border-b-0 pb-2 md:pb-0">
              <button 
                onClick={() => toggleSection(section.title)}
                className={`w-full text-left flex items-center justify-between py-3 md:py-0 ${darkMode ? 'text-gray-300' : 'text-gray-800'} md:cursor-default`}
              >
                <h3 className="text-sm font-semibold">{section.title}</h3>
                <FiChevronDown className={`md:hidden transition-transform duration-200 ${expandedSection === section.title ? 'transform rotate-180' : ''}`} />
              </button>
              <ul className={`space-y-3 mt-3 overflow-hidden transition-all duration-200 ${
                expandedSection === section.title ? 'max-h-40' : 'max-h-0 md:max-h-40'
              }`}>
                {section.links.map((link) => (
                  <li key={link.url}>
                    <Link 
                      to={link.url} 
                      className={`text-sm flex items-center ${
                        darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                      } transition-colors`}
                    >
                      <span className="mr-2">{link.icon}</span>
                      {link.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        {/* Bottom section */}
        <div className={`pt-6 mt-4 md:pt-8 md:mt-8 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex flex-col md:flex-row justify-between items-center`}>
          <div className={`text-xs md:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {t('footer.copyright')}
          </div>
          <div className={`mt-2 md:mt-0 text-xs md:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {t('footer.madeWith')}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import matrixLogo from '../assets/matrix.png';

interface FooterCategory {
  title: string;
  links: {
    name: string;
    url: string;
  }[];
}

interface FooterProps {
  categories: FooterCategory[];
  socialLinks?: {
    icon: React.ReactNode;
    url: string;
  }[];
  companyName: string;
}

const Footer: React.FC<FooterProps> = ({ 
  categories, 
  socialLinks = [],
  companyName 
}) => {
  const { darkMode } = useContext(ThemeContext);
  
  return (
    <footer className={`py-16 border-t ${
      darkMode 
        ? 'bg-black border-gray-800' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {categories.map((category, index) => (
            <div key={index} className="space-y-4">
              <h3 className={`font-medium text-sm ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>{category.title}</h3>
              <ul className="space-y-1">
                {category.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link 
                      to={link.url} 
                      className={`transition-colors text-sm ${
                        darkMode 
                          ? 'text-gray-500 hover:text-gray-300' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className={`mt-12 pt-8 border-t flex flex-col md:flex-row justify-between items-center ${
          darkMode ? 'border-gray-800' : 'border-gray-200'
        }`}>
          <div className={`mb-4 md:mb-0 flex flex-col items-center md:items-start space-y-2 ${
            darkMode ? 'text-gray-500' : 'text-gray-600'
          }`}>
            <div className="flex items-center space-x-2">
              <img src={matrixLogo} alt="Matrix AI" className="w-8 h-8 object-contain rounded-lg flex-shrink-0" />
              <span className={`text-xl font-bold leading-none flex items-center ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>matrixai<span className="text-red-500">.</span>asia</span>
            </div>
            <div className={`text-sm text-center md:text-left ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Copyright © 2025 MatrixAI. All rights reserved.
            </div>
          </div>
          
          {socialLinks.length > 0 && (
            <div className="flex space-x-6">
              {socialLinks.map((link, index) => (
                <a 
                  key={index} 
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`transition-colors ${
                    darkMode 
                      ? 'text-gray-400 hover:text-white' 
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {link.icon}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
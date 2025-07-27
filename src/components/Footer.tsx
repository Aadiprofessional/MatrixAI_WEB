import React from 'react';
import { Link } from 'react-router-dom';

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
  
  return (
    <footer className="bg-black py-16 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {categories.map((category, index) => (
            <div key={index} className="space-y-4">
              <h3 className="text-gray-300 font-medium text-sm">{category.title}</h3>
              <ul className="space-y-1">
                {category.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link 
                      to={link.url} 
                      className="text-gray-500 hover:text-gray-300 transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-500 mb-4 md:mb-0">
            <span className="text-xl font-medium text-white">{companyName}</span>
          </div>
          
          {socialLinks.length > 0 && (
            <div className="flex space-x-6">
              {socialLinks.map((link, index) => (
                <a 
                  key={index} 
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
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
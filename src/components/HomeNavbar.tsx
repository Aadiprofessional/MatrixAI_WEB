import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';

interface HomeNavbarProps {}

const HomeNavbar: React.FC<HomeNavbarProps> = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-3">
      <div className="max-w-7xl mx-auto">
        <div className="backdrop-blur-md bg-black/20 rounded-lg shadow-lg px-4 py-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link to="/" className="font-bold text-xl">matrixai<span className="text-red-500">.</span>asia</Link>
            </div>
            
            <div className="hidden md:flex items-center space-x-6">
              <Link to="#" className="text-gray-200 hover:text-white transition-colors duration-200">Tools</Link>
              <Link to="#" className="text-gray-200 hover:text-white transition-colors duration-200">Resources</Link>
              <Link to="#" className="text-gray-200 hover:text-white transition-colors duration-200">API</Link>
              <Link to="#" className="text-gray-200 hover:text-white transition-colors duration-200">Pricing</Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-gray-200 hover:text-white transition-colors duration-200">Log in</Link>
              <Link 
                to="/signup" 
                className="inline-flex items-center px-4 py-2 rounded-lg font-medium text-sm bg-indigo-600 hover:bg-indigo-700 text-white transition-colors duration-300"
              >
                Get started now
                <FiArrowRight className="ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default HomeNavbar;
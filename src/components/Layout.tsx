import React, { useContext } from 'react';
import { Navbar, Sidebar, Footer } from './';
import { ThemeContext } from '../context/ThemeContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { darkMode } = useContext(ThemeContext);

  return (
    <div className={`flex min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <Navbar />
        <main className={`flex-1 flex flex-col ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="flex-1 overflow-auto pb-20">
            {children}
          </div>
        </main>
        <div className="w-full z-20">
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Layout; 
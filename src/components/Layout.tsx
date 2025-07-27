import React, { useContext, useState, useEffect } from 'react';
import { Navbar, Sidebar, Footer, FooterLinks } from './';
import { ThemeContext } from '../context/ThemeContext';
import { FiGithub, FiInstagram, FiLinkedin, FiMenu, FiTwitter, FiX, FiYoutube } from 'react-icons/fi';
import { useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { darkMode } = useContext(ThemeContext);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256); // 256px = 16rem (w-64)
  const [isDesktop, setIsDesktop] = useState(false);
  const location = useLocation();
  
  // Check if current route is chat-related
  const isChatRoute = location.pathname.includes('/chat');

  // Check if desktop on initial render and on resize
  useEffect(() => {
    const checkIfDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    
    // Initial check
    checkIfDesktop();
    
    // Add resize listener
    window.addEventListener('resize', checkIfDesktop);
    
    // Close sidebar when screen size changes to desktop
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileSidebarOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkIfDesktop);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  // Handle sidebar toggle for main content
  const handleSidebarCollapse = (collapsed: boolean) => {
    setSidebarWidth(collapsed ? 64 : 256); // 64px = 4rem (w-16), 256px = 16rem (w-64)
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark text-white' : 'text-gray-900'} ${isDesktop && sidebarWidth === 64 ? 'sidebar-collapsed' : ''}`}>
      {/* Mobile sidebar overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar - always fixed on desktop, hidden on mobile when closed */}
      <div className={`md:block ${isMobileSidebarOpen ? 'block' : 'hidden'}`}>
        <Sidebar onToggle={handleSidebarCollapse} />
      </div>
      
      {/* Main content area */}
      <div 
        className="flex flex-col min-h-screen transition-all duration-300"
        style={{ marginLeft: isDesktop || isMobileSidebarOpen ? `${sidebarWidth}px` : '0' }}
      >
        {/* Mobile sidebar toggle button - positioned within navbar space */}
        <button 
          onClick={toggleMobileSidebar}
          className={`md:hidden fixed top-3 left-3 z-[60] p-2 rounded-lg ${
            darkMode 
              ? 'bg-gray-800 text-white hover:bg-gray-700' 
              : 'bg-white text-gray-800 hover:bg-gray-100'
          } shadow-md`}
          aria-label="Toggle mobile menu"
        >
          {isMobileSidebarOpen ? 
            <FiX className="w-5 h-5" /> : 
            <FiMenu className="w-5 h-5" />
          }
        </button>
        
        <Navbar />
        
        <main className="flex-1 flex flex-col">
          <div className="flex-1">
            {children}
          </div>
        </main>
        {/* Only render Footer if not on a chat route */}
        {!isChatRoute && (
          <div className="w-full z-20">
            <FooterLinks 
              categories={[
          {
            title: "Tools",
            links: [
              { name: "Image Generator", url: "tools/image-generator" },
              { name: "Video Generator", url: "tools/video-creator" },
              { name: "Content Writer", url: "tools/content-writer" },
              { name: "Speech to Text", url: "tools/speech-to-text" },
              { name: "Chat", url: "/chat" }
            ]
          },
          {
            title: "Features",
            links: [
              { name: "Image to Video", url: "tools/video-creator" },
              { name: "Text to Image", url: "tools/image-generator" },
              { name: "Content Generation", url: "tools/content-writer" },
              { name: "Speech to Text", url: "tools/speech-to-text" },
              { name: "AI Chat", url: "tools/chat" }
            ]
          },
          {
            title: "Explore",
            links: [
              { name: "About Us", url: "/about" },
              { name: "Features", url: "/features" },
              { name: "Blog", url: "/blog" },
              { name: "Enterprise", url: "/enterprise" },
              { name: "Careers", url: "/careers" },
              { name: "Contact", url: "/contact" }
            ]
          },
          {
            title: "Resources",
            links: [
              { name: "Privacy Policy", url: "/privacy" },
              { name: "Terms of Service", url: "/terms" },
              { name: "Cookies Policy", url: "/cookies" },
              { name: "Referral Program", url: "/referral" }
            ]
          },
          {
            title: "Help",
            links: [
              { name: "Subscription", url: "/subscription" },
              { name: "FAQ", url: "/faq" },
              { name: "Help Center", url: "/help" },
              { name: "System Status", url: "/status" }
            ]
          }
        ]}
        socialLinks={[
          { icon: <FiInstagram className="h-6 w-6" />, url: "https://instagram.com" },
          { icon: <FiTwitter className="h-6 w-6" />, url: "https://twitter.com" },
          { icon: <FiYoutube className="h-6 w-6" />, url: "https://youtube.com" },
          { icon: <FiGithub className="h-6 w-6" />, url: "https://github.com" },
          { icon: <FiLinkedin className="h-6 w-6" />, url: "https://linkedin.com" }
        ]}
        companyName="matrixai.asia"
      />
          </div>
        )}
      </div>
    </div>
  );
};

export default Layout;
import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar, Sidebar, Footer, FooterLinks } from './';
import { ThemeContext } from '../context/ThemeContext';
import { FiGithub, FiInstagram, FiLinkedin, FiMenu, FiTwitter, FiX, FiYoutube } from 'react-icons/fi';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { darkMode } = useContext(ThemeContext);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256); // 256px = 16rem (w-64)
  const [isDesktop, setIsDesktop] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();
  
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
      {/* Sidebar - always visible, handles its own mobile state */}
      <Sidebar 
        onToggle={handleSidebarCollapse} 
        isMobileMenuOpen={isMobileSidebarOpen}
        onMobileMenuToggle={setIsMobileSidebarOpen}
      />
      
      {/* Main content area */}
      <div 
        className="flex flex-col min-h-screen transition-all duration-300"
        style={{ marginLeft: isDesktop ? `${sidebarWidth}px` : '0' }}
      >
        {/* Mobile sidebar toggle button - positioned within navbar space, hidden when sidebar is open */}
        {!isMobileSidebarOpen && (
          <button 
            onClick={toggleMobileSidebar}
            className={`md:hidden fixed top-3 left-3 z-[60] p-2 rounded-lg ${
              darkMode 
                ? 'bg-gray-800 text-white hover:bg-gray-700' 
                : 'bg-white text-gray-800 hover:bg-gray-100'
            } shadow-md`}
            aria-label="Toggle mobile menu"
          >
            <FiMenu className="w-5 h-5" />
          </button>
        )}
        
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
            title: t('layout.footer.categories.tools'),
            links: [
              { name: t('layout.footer.links.imageGenerator'), url: "tools/image-generator" },
              { name: t('layout.footer.links.videoGenerator'), url: "tools/video-creator" },
              { name: t('layout.footer.links.contentWriter'), url: "tools/content-writer" },
              { name: t('layout.footer.links.speechToText'), url: "tools/speech-to-text" },
              { name: t('layout.footer.links.chat'), url: "/chat" }
            ]
          },
          {
            title: t('layout.footer.categories.features'),
            links: [
              { name: t('layout.footer.links.imageToVideo'), url: "tools/video-creator" },
              { name: t('layout.footer.links.textToImage'), url: "tools/image-generator" },
              { name: t('layout.footer.links.contentGeneration'), url: "tools/content-writer" },
              { name: t('layout.footer.links.speechToText'), url: "tools/speech-to-text" },
              { name: t('layout.footer.links.aiChat'), url: "tools/chat" }
            ]
          },
          {
            title: t('layout.footer.categories.explore'),
            links: [
              { name: t('layout.footer.links.aboutUs'), url: "/about" },
              { name: t('layout.footer.links.features'), url: "/features" },
              { name: t('layout.footer.links.blog'), url: "/blog" },
              { name: t('layout.footer.links.enterprise'), url: "/enterprise" },
              { name: t('layout.footer.links.careers'), url: "/careers" },
              { name: t('layout.footer.links.contact'), url: "/contact" }
            ]
          },
          {
            title: t('layout.footer.categories.resources'),
            links: [
              { name: t('layout.footer.links.privacyPolicy'), url: "/privacy" },
              { name: t('layout.footer.links.termsOfService'), url: "/terms" },
              { name: t('layout.footer.links.cookiesPolicy'), url: "/cookies" },
              { name: t('layout.footer.links.referralProgram'), url: "/referral" }
            ]
          },
          {
            title: t('layout.footer.categories.help'),
            links: [
              { name: t('layout.footer.links.subscription'), url: "/subscription" },
              { name: t('layout.footer.links.faq'), url: "/faq" },
              { name: t('layout.footer.links.helpCenter'), url: "/help" },
              { name: t('layout.footer.links.systemStatus'), url: "/status" }
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
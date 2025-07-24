import React from 'react';
import { HomeNavbar } from './';
import FooterLinks from './FooterLinks';
import { FiInstagram, FiTwitter, FiYoutube, FiGithub, FiLinkedin } from 'react-icons/fi';

interface PublicResourceLayoutProps {
  children: React.ReactNode;
}

/**
 * PublicResourceLayout component that renders the HomeNavbar and children
 * for public resource pages accessed from the HomeNavbar.
 */
const PublicResourceLayout: React.FC<PublicResourceLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-black text-white">
      <HomeNavbar />
      <main className="flex-1 flex flex-col">
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
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
        companyName="Matrix AI"
      />
    </div>
  );
};

export default PublicResourceLayout;
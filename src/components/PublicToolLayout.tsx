import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Layout, FooterLinks } from './';
import HomeNavbar2 from './HomeNavbar2';
import { useTranslation } from 'react-i18next';
import { FiGithub, FiInstagram, FiLinkedin, FiTwitter, FiYoutube } from 'react-icons/fi';

interface PublicToolLayoutProps {
  children: React.ReactNode;
}

/**
 * PublicToolLayout component that conditionally renders the Layout component
 * based on user authentication status. If the user is not logged in, it renders
 * only the children without the Layout (no sidebar, header, or footer).
 */
const PublicToolLayout: React.FC<PublicToolLayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  
  // If user is logged in, render with Layout
  if (user) {
    return <Layout>{children}</Layout>;
  }
  
  // If user is not logged in, render with HomeNavbar and Footer
  
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <HomeNavbar2 />
      <main className="flex-1 flex flex-col bg-gray-900">
        <div className="flex-1">
          {children}
        </div>
      </main>
      <div className="w-full z-auto">
        <FooterLinks 
          categories={[
            {
              title: t('layout.footer.categories.tools'),
              links: [
                { name: t('layout.footer.links.imageGenerator'), url: "/tools/image-generator" },
              { name: t('layout.footer.links.videoGenerator'), url: "/tools/video-creator" },
              { name: t('layout.footer.links.contentWriter'), url: "/tools/content-writer" },
              { name: t('layout.footer.links.speechToText'), url: "/tools/speech-to-text" },
                { name: t('layout.footer.links.chat'), url: "/chat" }
              ]
            },
            {
              title: t('layout.footer.categories.features'),
              links: [
                { name: t('layout.footer.links.imageToVideo'), url: "/tools/video-creator" },
              { name: t('layout.footer.links.textToImage'), url: "/tools/image-generator" },
              { name: t('layout.footer.links.contentGeneration'), url: "/tools/content-writer" },
              { name: t('layout.footer.links.speechToText'), url: "/tools/speech-to-text" },
              { name: t('layout.footer.links.aiChat'), url: "/tools/chat" }
              ]
            },
            {
              title: t('layout.footer.categories.explore'),
              links: [
                { name: t('layout.footer.links.aboutUs'), url: "/about" },
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
    </div>
  );
};

export default PublicToolLayout;
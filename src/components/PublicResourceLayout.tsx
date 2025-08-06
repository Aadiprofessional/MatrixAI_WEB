import React from 'react';
import { HomeNavbar } from './';
import FooterLinks from './FooterLinks';
import { FiInstagram, FiTwitter, FiYoutube, FiGithub, FiLinkedin } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

interface PublicResourceLayoutProps {
  children: React.ReactNode;
}

/**
 * PublicResourceLayout component that renders the HomeNavbar and children
 * for public resource pages accessed from the HomeNavbar.
 */
const PublicResourceLayout: React.FC<PublicResourceLayoutProps> = ({ children }) => {
  const { t } = useTranslation();
  
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
        companyName="Matrix AI"
      />
    </div>
  );
};

export default PublicResourceLayout;
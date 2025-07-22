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
              { name: "Image Generator", url: "/image-generator" },
              { name: "Video Generator", url: "/video-generator" },
              { name: "Upscaler", url: "/upscaler" },
              { name: "Image Editor", url: "/image-editor" },
              { name: "Model Trainer", url: "/model-trainer" },
              { name: "Image Extender", url: "/image-extender" },
              { name: "AI Resizer", url: "/ai-resizer" },
              { name: "Background Remover", url: "/background-remover" }
            ]
          },
          {
            title: "Features",
            links: [
              { name: "Image to Video", url: "/image-to-video" },
              { name: "Text to Image", url: "/text-to-image" },
              { name: "Image to Image", url: "/image-to-image" },
              { name: "Consistent AI Characters", url: "/consistent-characters" },
              { name: "Custom Styles", url: "/custom-styles" },
              { name: "Background Changer", url: "/background-changer" },
              { name: "Inpainting", url: "/inpainting" },
              { name: "Banners", url: "/banners" }
            ]
          },
          {
            title: "Explore",
            links: [
              { name: "Pixel Art", url: "/explore/pixel-art" },
              { name: "Anime", url: "/explore/anime" },
              { name: "Realistic AI Images", url: "/explore/realistic" },
              { name: "AI Art", url: "/explore/ai-art" },
              { name: "AI Characters", url: "/explore/characters" },
              { name: "Headshots", url: "/explore/headshots" },
              { name: "Stickers", url: "/explore/stickers" },
              { name: "Thumbnails", url: "/explore/thumbnails" }
            ]
          },
          {
            title: "Models",
            links: [
              { name: "Seedream 3", url: "/models/seedream-3" },
              { name: "FLUX1", url: "/models/flux1" },
              { name: "Seedance", url: "/models/seedance" },
              { name: "Google Veo 3", url: "/models/google-veo-3" },
              { name: "MAGI-1", url: "/models/magi-1" },
              { name: "MiniMax Hailuo 02", url: "/models/minimax-hailuo-02" }
            ]
          },
          {
            title: "Resources",
            links: [
              { name: "API", url: "/api" },
              { name: "Privacy Policy", url: "/privacy" },
              { name: "Terms of Service", url: "/terms" },
              { name: "Restrictions", url: "/restrictions" },
              { name: "Affiliate Program", url: "/affiliate" },
              { name: "Suggest a feature", url: "/suggest" }
            ]
          },
          {
            title: "Help",
            links: [
              { name: "Pricing", url: "/pricing" },
              { name: "Guides", url: "/guides" },
              { name: "FAQ", url: "/faq" },
              { name: "Support", url: "/support" },
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
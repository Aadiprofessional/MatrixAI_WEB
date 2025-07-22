import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface UseCaseTabProps {
  id: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const UseCaseTab: React.FC<UseCaseTabProps> = ({ id, label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`py-2 px-1 border-l-2 text-left ${isActive ? 'border-indigo-500 text-white' : 'border-transparent text-gray-400 hover:text-gray-300'}`}
    >
      {label}
    </button>
  );
};

const UseCasesSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState('ads');
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const useCases = [
    { id: 'ads', label: 'Ads' },
    { id: 'animation', label: 'Animation' },
    { id: 'film-production', label: 'Film Production' },
    { id: 'product-demos', label: 'Product Demos' },
    { id: 'social-media', label: 'Social Media' },
    { id: 'branding', label: 'Branding' },
  ];
  
  // Video/image content for each tab
  const tabContent: Record<string, string> = {
    'ads': 'https://ddtgdhehxhgarkonvpfq.supabase.co/storage/v1/object/public/user-uploads/mainvideo.mp4',
    'animation': 'https://ddtgdhehxhgarkonvpfq.supabase.co/storage/v1/object/public/user-uploads/mainvideo.mp4',
    'film-production': 'https://ddtgdhehxhgarkonvpfq.supabase.co/storage/v1/object/public/user-uploads/mainvideo.mp4',
    'product-demos': 'https://ddtgdhehxhgarkonvpfq.supabase.co/storage/v1/object/public/user-uploads/mainvideo.mp4',
    'social-media': 'https://ddtgdhehxhgarkonvpfq.supabase.co/storage/v1/object/public/user-uploads/mainvideo.mp4',
    'branding': 'https://ddtgdhehxhgarkonvpfq.supabase.co/storage/v1/object/public/user-uploads/mainvideo.mp4',
  };
  
  // Auto-switch tabs when video ends
  useEffect(() => {
    const videoElement = videoRef.current;
    
    const handleVideoEnd = () => {
      // Find current index and move to next tab
      const currentIndex = useCases.findIndex(useCase => useCase.id === activeTab);
      const nextIndex = (currentIndex + 1) % useCases.length;
      setActiveTab(useCases[nextIndex].id);
    };
    
    if (videoElement) {
      videoElement.addEventListener('ended', handleVideoEnd);
      return () => {
        videoElement.removeEventListener('ended', handleVideoEnd);
      };
    }
  }, [activeTab, useCases]);
  
  // Play video when in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && videoRef.current) {
            videoRef.current.play();
          } else if (videoRef.current) {
            videoRef.current.pause();
          }
        });
      },
      { threshold: 0.3 }
    );
    
    if (videoRef.current) {
      observer.observe(videoRef.current);
    }
    
    return () => {
      if (videoRef.current) {
        observer.unobserve(videoRef.current);
      }
    };
  }, []);
  
  // Auto-switch tabs every 10 seconds as fallback
  useEffect(() => {
    const interval = setInterval(() => {
      const currentIndex = useCases.findIndex(useCase => useCase.id === activeTab);
      const nextIndex = (currentIndex + 1) % useCases.length;
      setActiveTab(useCases[nextIndex].id);
    }, 10000);
    
    return () => clearInterval(interval);
  }, [activeTab, useCases]);

  return (
    <section className="py-20 bg-gradient-to-b from-black to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold text-white mb-6"
            >
              Made for every creator.<br />
              See how pros use Image<br />
              to Video.
            </motion.h2>
            
            <div className="flex flex-col space-y-4">
              {useCases.map((useCase) => (
                <UseCaseTab
                  key={useCase.id}
                  id={useCase.id}
                  label={useCase.label}
                  isActive={activeTab === useCase.id}
                  onClick={() => setActiveTab(useCase.id)}
                />
              ))}
            </div>
          </div>
          
          <div className="relative rounded-lg overflow-hidden aspect-square">
            {/* Outer layer - white opacity border with glow */}
            <div className="absolute inset-0 border-2 border-white/10 rounded-xl shadow-lg shadow-blue-500/20"></div>
            
            {/* Middle layer - subtle glow effect */}
            <div className="absolute inset-[3px] rounded-lg bg-gradient-to-br from-white/10 to-transparent"></div>
            
            {/* Inner layer - glass effect with backdrop blur */}
            <div className="absolute inset-[6px] backdrop-blur-lg bg-black/30 rounded-lg border border-white/20 shadow-inner shadow-white/10"></div>
            
            {/* Content container with glass morphism */}
            <div className="absolute inset-[6px] bg-gradient-to-br from-white/5 to-transparent opacity-80 rounded-lg"></div>
            
            <div className="relative z-10 p-4 h-full flex items-center justify-center">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full h-full"
              >
                <video 
                  ref={videoRef}
                  className="w-full h-full object-cover rounded-lg" 
                  autoPlay 
                  muted 
                  playsInline
                >
                  <source src={tabContent[activeTab]} type="video/mp4" />
                </video>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UseCasesSection;
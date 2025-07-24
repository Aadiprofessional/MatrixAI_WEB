import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface FeatureCardProps {
  title: string;
  description: string;
  videoSrc?: string;
  imageSrc?: string;
  position: 'left' | 'right';
  index?: number;
}

const FeatureCard: React.FC<FeatureCardProps & { index?: number }> = ({ title, description, videoSrc, imageSrc, position, index }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Determine if this card should be square (1st and 4th cards)
  const isSquare = index === 0 || index === 3;
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && videoRef.current) {
            videoRef.current.play().catch((error) => {
              console.error("Error playing video:", error);
            });
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
  
  return (
    <div className={`rounded-xl overflow-hidden h-full relative ${position === 'left' ? 'col-span-1' : 'col-span-2'}`}>
      {/* Outer layer - white opacity border with glow */}
      <div className="absolute inset-0 border-2 border-white/10 rounded-xl shadow-lg shadow-blue-500/20"></div>
      
      {/* Middle layer - subtle glow effect */}
      <div className="absolute inset-[3px] rounded-lg bg-gradient-to-br from-white/10 to-transparent"></div>
      
      {/* Inner layer - glass effect with padding */}
      <div className="relative m-2 rounded-lg overflow-hidden backdrop-blur-lg bg-black/30 h-[calc(100%-16px)] border border-white/20 shadow-inner shadow-white/10">
        {/* Content container with glass morphism */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-80"></div>
        
        <div className={`relative z-10 ${isSquare ? 'aspect-square' : 'aspect-video'}`}>
          {videoSrc ? (
            <video 
              ref={videoRef}
              className="w-full h-full object-cover" 
              loop 
              muted 
              playsInline
            >
              <source src={videoSrc} type="video/mp4" />
            </video>
          ) : imageSrc ? (
            <img 
              src={imageSrc} 
              alt={title} 
              className="w-full h-full object-cover"
            />
          ) : null}
        </div>
        <div className="relative z-10 p-6">
          <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
          <p className="text-gray-400">{description}</p>
        </div>
      </div>
    </div>
  );
};

const FeatureSection: React.FC = () => {
  return (
    <section className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-white mb-10 text-left">Why creators are switching to MatrixAI</h2>
        <p className="text-xl text-gray-300 mb-10 text-left max-w-3xl">Tired of slow tools and generic results? See how our all-in-one AI platform solves the problems nobody else can.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard 
            title="Image to Video Magic"
            description="Transform any image into stunning, cinematic videos with natural motion. Just upload, describe your vision, and get professional results in minutes."
            videoSrc="https://ddtgdhehxhgarkonvpfq.supabase.co/storage/v1/object/public/user-uploads/mainvideo.mp4"
            position="left"
            index={0}
          />
          <FeatureCard 
            title="AI Image Generation"
            description="Create beautiful, unique images from text descriptions. Perfect for marketing materials, social media, illustrations, and creative projects."
            videoSrc="https://ddtgdhehxhgarkonvpfq.supabase.co/storage/v1/object/public/user-uploads/mainvideo.mp4"
            position="right"
            index={1}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <FeatureCard 
            title="Speech to Text & Content Writing"
            description="Transcribe audio with 95%+ accuracy and generate compelling content for blogs, marketing, and more—all powered by advanced AI models."
            videoSrc="https://ddtgdhehxhgarkonvpfq.supabase.co/storage/v1/object/public/user-uploads/mainvideo.mp4"
            position="right"
            index={2}
          />
          <FeatureCard 
            title="Lightning-Fast AI Chat"
            description="Get instant answers, creative ideas, and problem-solving assistance from our responsive AI assistant that remembers your conversation context."
            videoSrc="https://ddtgdhehxhgarkonvpfq.supabase.co/storage/v1/object/public/user-uploads/mainvideo.mp4"
            position="left"
            index={3}
          />
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;
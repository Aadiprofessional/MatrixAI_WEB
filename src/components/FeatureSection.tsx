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
        <h2 className="text-4xl font-bold text-white mb-10 text-left">Why creators are switching to matrixai.asia</h2>
        <p className="text-xl text-gray-300 mb-10 text-left max-w-3xl">Tired of slow tools and generic results? See how we solve the problems nobody else can.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard 
            title="Fastest Workflow"
            description="No hours-long tutorials, no tinkering, no wasted time. Upload, describe your vision, and get your video in minutes—done."
            videoSrc="https://ddtgdhehxhgarkonvpfq.supabase.co/storage/v1/object/public/user-uploads/mainvideo.mp4"
            position="left"
            index={0}
          />
          <FeatureCard 
            title="Unmatched Video Quality"
            description="Forget cartoonish or blurry results. getimg.ai delivers crisp, cinematic motion from any image—photos, art, even sketches."
            videoSrc="https://ddtgdhehxhgarkonvpfq.supabase.co/storage/v1/object/public/user-uploads/mainvideo.mp4"
            position="right"
            index={1}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <FeatureCard 
            title="Always Up-to-Date"
            description="No more FOMO. getimg.ai adds every breakthrough model and new feature the moment it's available."
            videoSrc="https://ddtgdhehxhgarkonvpfq.supabase.co/storage/v1/object/public/user-uploads/mainvideo.mp4"
            position="right"
            index={2}
          />
          <FeatureCard 
            title="Surprisingly Affordable"
            description="Access advanced video creation for a fraction of the cost of traditional video production software."
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
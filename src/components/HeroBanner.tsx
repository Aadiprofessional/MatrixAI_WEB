import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface HeroBannerProps {
  title: string;
  description: string;
  backgroundImage?: string;
}

const HeroBanner: React.FC<HeroBannerProps> = ({ 
  title, 
  description, 
  backgroundImage 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  return (
    <section className="relative py-20 bg-black text-white overflow-hidden">
      {/* Background image with overlay */}
      {backgroundImage && (
        <div className="absolute inset-0 z-0">
          <img 
            src={backgroundImage} 
            alt="Background" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/90"></div>
        </div>
      )}
      
      <div className="relative z-10 max-w-10xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            {title}
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-3xl mx-auto">
            {description}
          </p>
          
          {/* Video container with increased width */}
          <div className="relative w-full max-w-9xl mx-auto rounded-lg overflow-hidden border border-gray-700/50 shadow-2xl shadow-purple-900/20 mb-10">
            <div style={{ height: '500px' }} className="w-full">
              <video 
                ref={videoRef}
                className="w-full h-full object-cover" 
                loop 
                muted 
                playsInline
              >
                <source src="/videos/sample-video.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              {/* Optional dark overlay */}
              <div className="absolute inset-0 bg-black/20"></div>
              
              {/* Play/Pause Button */}
              <button 
                onClick={togglePlayPause}
                className="absolute bottom-4 right-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm p-3 rounded-full transition-all duration-300"
                aria-label={isPlaying ? 'Pause video' : 'Play video'}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="white" 
                  className="w-6 h-6"
                >
                  {isPlaying ? (
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  ) : (
                    <path d="M8 5v14l11-7z" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroBanner;

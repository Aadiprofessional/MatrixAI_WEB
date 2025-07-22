import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface ModelInfo {
  id: string;
  name: string;
  description: string;
  detailedDescription?: string;
  icon: React.ReactNode;
}

interface FeatureSectionProps {
  title: string;
  subtitle: string;
  description: string;
  modelName: string;
  imageSrc?: string;
  imageAlt?: string;
  videoSrc?: string;
  isReversed?: boolean;
  hasPlayButton?: boolean;
  hasSpeakerButton?: boolean;
  bgStyle?: React.CSSProperties;
}

// Feature section component for model capabilities
const FeatureSection: React.FC<FeatureSectionProps> = ({ 
  title, 
  subtitle, 
  description, 
  modelName, 
  imageSrc, 
  imageAlt, 
  videoSrc,
  isReversed = false,
  hasPlayButton = false,
  hasSpeakerButton = false,
  bgStyle
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <section className="min-h-screen flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex flex-col ${isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12`}>
          {/* Text content */}
          <div className="lg:w-1/2 space-y-6">
            <div className="text-purple-500 font-medium uppercase tracking-wider">{modelName}</div>
            <h2 className="text-4xl font-bold text-white">{title}</h2>
            <p className="text-gray-300 text-lg leading-relaxed">{description}</p>
          </div>
          
          {/* Media content */}
          <div className="lg:w-1/2 relative">
            {/* Glass card effect */}
            <div className="relative rounded-xl overflow-hidden">
              {/* Outer layer - white opacity border with glow */}
              <div className="absolute inset-0 border-2 border-white/40 rounded-xl shadow-lg shadow-blue-500/20"></div>
              
              {/* Middle layer - subtle glow effect */}
              <div className="absolute inset-[3px] rounded-lg bg-gradient-to-br from-white/10 to-transparent"></div>
              
              {/* Inner layer - glass effect with backdrop blur */}
              <div className="absolute inset-[6px] backdrop-blur-lg bg-black/30 rounded-lg border border-white/20 shadow-inner shadow-white/10"></div>
              
              {/* Content container with glass morphism */}
              <div className="absolute inset-[6px] bg-gradient-to-br from-white/5 to-transparent opacity-80 rounded-lg"></div>
              
              <div className="relative z-10 p-4 flex justify-center items-center">
                <div className="flex flex-col md:flex-row items-center justify-center w-full relative gap-6">
                  {/* Left side - Image */}
                  <div className="md:w-5/12 relative">
                    {imageSrc && (
                      <img src={imageSrc} alt={imageAlt || title} className="rounded-lg w-full object-cover h-48 md:h-64" />
                    )}
                  </div>
                  
                  {/* Middle - Arrow - Positioned absolutely to overlap both containers */}
                  <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 bg-black/70 rounded-lg p-2">
                    <img src="/images/arrow-right.svg" alt="Arrow right" className="w-8 h-8 filter invert" />
                  </div>
                  
                  {/* Right side - Video */}
                  <div className="md:w-5/12 relative">
                    {videoSrc ? (
                      <div className="relative">
                        <video 
                          ref={videoRef}
                          src={videoSrc} 
                          className="rounded-lg w-full object-cover h-48 md:h-64" 
                          loop 
                          muted={isMuted}
                          playsInline
                        />
                        
                        {/* Controls */}
                        <div className="absolute bottom-3 right-3 flex space-x-2">
                          {/* Play/Pause button */}
                          {hasPlayButton && (
                            <button 
                              onClick={togglePlay}
                              className="bg-white/90 rounded-full h-10 w-10 flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                            >
                              {isPlaying ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-black" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-black" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                              )}
                            </button>
                          )}
                          
                          {/* Speaker button */}
                          {hasSpeakerButton && (
                            <button 
                              onClick={toggleMute}
                              className="bg-white/90 rounded-full h-10 w-10 flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                            >
                              {isMuted ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-black" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-black" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                                </svg>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ) : imageSrc && (
                      <img src={imageSrc} alt={imageAlt || title} className="rounded-lg w-full object-cover h-48 md:h-64" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const ModelsShowcaseSection: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<string>('google-veo');
  
  // Define a common background style for all sections
  const sectionBgStyle = {
    background: 'linear-gradient(to bottom, #000000, #111827)',
    backgroundAttachment: 'fixed'
  };
  
  const models: ModelInfo[] = [
    {
      id: 'google-veo',
      name: 'Google Veo',
      description: 'The benchmark for cinematic realism.',
      detailedDescription: 'Google Veo 2\nUltra-high quality, lifelike video from any image. Trusted by professionals for its detail and natural motion.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="12" cy="12" r="10" strokeWidth="2" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l-3 3m0 0l-3-3m3 3V8" />
        </svg>
      )
    },
    {
      id: 'kling',
      name: 'Kling',
      description: 'Specialized in character animation and movement.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'magi',
      name: 'MAGI',
      description: 'Exceptional for stylized and artistic animations.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      )
    },
    {
      id: 'runway',
      name: 'Runway',
      description: 'Perfect for scene transitions and camera movements.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
        </svg>
      )
    },
    {
      id: 'minimax',
      name: 'MiniMax',
      description: 'Optimized for quick renders and prototyping.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    {
      id: 'bytedance',
      name: 'ByteDance Seedance',
      description: 'Specialized in dynamic and trending visual styles.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
  ];
  
  const currentModel = models.find(model => model.id === selectedModel);
  
  return (
    <div style={sectionBgStyle}>
      {/* Main Models Showcase Section */}
      <section className="min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-white text-center mb-4"
          >
            All the leading AI Image to Video models on one platform
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-xl text-gray-300 text-center mb-16 max-w-3xl mx-auto"
          >
            With matrixai.asia, you always have the right tool—never just one option. Instantly access every industry-leading model, all in one place.
          </motion.p>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left sidebar - Model selection */}
            <div className="relative rounded-xl overflow-hidden">
              {/* Outer layer - white opacity border with glow */}
              <div className="absolute inset-0 border-2 border-white/40 rounded-xl shadow-lg shadow-blue-500/20"></div>
              
              {/* Middle layer - subtle glow effect */}
              <div className="absolute inset-[3px] rounded-lg bg-gradient-to-br from-white/10 to-transparent"></div>
              
              {/* Inner layer - glass effect with backdrop blur */}
              <div className="absolute inset-[6px] backdrop-blur-lg bg-black/30 rounded-lg border border-white/20 shadow-inner shadow-white/10"></div>
              
              {/* Content container with glass morphism */}
              <div className="absolute inset-[6px] bg-gradient-to-br from-white/5 to-transparent opacity-80 rounded-lg"></div>
              
              <div className="relative z-10 p-4">
                <div className="space-y-2">
                  {models.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => setSelectedModel(model.id)}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${selectedModel === model.id ? 'bg-blue-900/30 border border-blue-700/50' : 'hover:bg-gray-800/50'}`}
                    >
                      <div className={`text-gray-400 ${selectedModel === model.id ? 'text-blue-400' : ''}`}>
                        {model.icon}
                      </div>
                      <span className={`text-sm font-medium ${selectedModel === model.id ? 'text-white' : 'text-gray-400'}`}>
                        {model.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Right content - Model details */}
            <div className="lg:col-span-3 relative rounded-xl overflow-hidden">
              {/* Outer layer - white opacity border with glow */}
              <div className="absolute inset-0 border-2 border-white/40 rounded-xl shadow-lg shadow-blue-500/20"></div>
              
              {/* Middle layer - subtle glow effect */}
              <div className="absolute inset-[3px] rounded-lg bg-gradient-to-br from-white/10 to-transparent"></div>
              
              {/* Inner layer - glass effect with backdrop blur */}
              <div className="absolute inset-[6px] backdrop-blur-lg bg-black/30 rounded-lg border border-white/20 shadow-inner shadow-white/10"></div>
              
              {/* Content container with glass morphism */}
              <div className="absolute inset-[6px] bg-gradient-to-br from-white/5 to-transparent opacity-80 rounded-lg"></div>
              
              <div className="relative z-10 p-6">
                {currentModel && (
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-4">{currentModel.name}</h3>
                    <p className="text-gray-300 mb-6">{currentModel.description}</p>
                    
                    {currentModel.detailedDescription && (
                      <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg p-5 mb-6 border border-gray-700/50">
                        <pre className="text-gray-300 whitespace-pre-line">{currentModel.detailedDescription}</pre>
                      </div>
                    )}
                    
                    <div className="mt-8">
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg transition-colors shadow-lg shadow-indigo-500/20 font-medium"
                      >
                        Try now →
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Feature Sections for different model capabilities */}
      <FeatureSection 
        title="Choose the start and end frames"
        subtitle="RUNWAY GEN-3 TURBO & KLING 1.6 PRO"
        modelName="RUNWAY GEN-3 TURBO & KLING 1.6 PRO"
        description="With Runway Gen-3 Turbo and Kling 1.6 Pro, you get a level of creative control that's almost unheard of in AI video. Upload your starting image, then upload your ending frame—lock in both the opening and the closing of your video. No more leaving results to chance: you decide how your story begins and ends, and our models handle the rest with seamless, cinematic transitions. If you want your vision executed with surgical precision, these are the models professionals choose."
        imageSrc="https://ddtgdhehxhgarkonvpfq.supabase.co/storage/v1/object/public/user-uploads/users/0a147ebe-af99-481b-bcaf-ae70c9aeb8d8/images/0a147ebe-af99-481b-bcaf-ae70c9aeb8d8_0a6fb8f0-d1b0-4328-a715-f0915691ef07.png"
        imageAlt="Runway Gen-3 Turbo & Kling 1.6 Pro demonstration"
        videoSrc="https://ddtgdhehxhgarkonvpfq.supabase.co/storage/v1/object/public/user-uploads/users/0a147ebe-af99-481b-bcaf-ae70c9aeb8d8/videos/video_1752772565812.mp4"
        hasPlayButton={true}
        hasSpeakerButton={true}
        bgStyle={sectionBgStyle}
      />
      
      <FeatureSection 
        title="Enjoy unlimited creativity"
        subtitle="HAILUO'S STANDARD MODE"
        modelName="HAILUO'S STANDARD MODE"
        description="Hailuo's Standard mode is your go-to solution for transforming a wide variety of images into captivating short videos. Whether you upload a cherished photograph, a vibrant anime graphic, or a detailed painting, Standard Mode can handle it. This multi-purpose mode is designed to adapt to various styles and content, providing a flexible foundation for your video creations."
        imageSrc="https://ddtgdhehxhgarkonvpfq.supabase.co/storage/v1/object/public/user-uploads/users/0a147ebe-af99-481b-bcaf-ae70c9aeb8d8/images/0a147ebe-af99-481b-bcaf-ae70c9aeb8d8_0a6fb8f0-d1b0-4328-a715-f0915691ef07.png"
        imageAlt="Hailuo's Standard Mode demonstration"
        videoSrc="https://ddtgdhehxhgarkonvpfq.supabase.co/storage/v1/object/public/user-uploads/users/0a147ebe-af99-481b-bcaf-ae70c9aeb8d8/videos/video_1752772565812.mp4"
        isReversed={true}
        hasPlayButton={true}
        hasSpeakerButton={true}
        bgStyle={sectionBgStyle}
      />
      
      <FeatureSection 
        title="Animate any character consistently"
        subtitle="HAILUO'S SUBJECT MODE"
        modelName="HAILUO'S SUBJECT MODE"
        description="Need a character to move and perform across multiple shots? Hailuo's Subject Mode is engineered for creators who want to build entire storylines around one original character, mascot, or persona. Upload a single photo, and this mode lets you generate endless videos with your subject—always on-model, always recognizable. It's the solution for brands, artists, and storytellers who want consistency and impact, every single time."
        imageSrc="https://ddtgdhehxhgarkonvpfq.supabase.co/storage/v1/object/public/user-uploads/users/0a147ebe-af99-481b-bcaf-ae70c9aeb8d8/images/0a147ebe-af99-481b-bcaf-ae70c9aeb8d8_0a6fb8f0-d1b0-4328-a715-f0915691ef07.png"
        imageAlt="Hailuo's Subject Mode demonstration"
        videoSrc="https://ddtgdhehxhgarkonvpfq.supabase.co/storage/v1/object/public/user-uploads/users/0a147ebe-af99-481b-bcaf-ae70c9aeb8d8/videos/video_1752772565812.mp4"
        hasPlayButton={true}
        hasSpeakerButton={true}
        bgStyle={sectionBgStyle}
      />
      
      <FeatureSection 
        title="Animate your drawings and sketches"
        subtitle="HAILUO'S LIVE MODE"
        modelName="HAILUO'S LIVE MODE"
        description="Hailuo's Live Mode is purpose-built for animating line art, sketches, and digital drawings—instantly turning static outlines into smooth, expressive motion. This mode recognizes the unique personality in every stroke, ensuring your original artwork translates into dynamic, lifelike video. It's a must-have for illustrators, concept artists, and anyone looking to make hand-drawn creations move with style and intent."
        imageSrc="https://ddtgdhehxhgarkonvpfq.supabase.co/storage/v1/object/public/user-uploads/users/0a147ebe-af99-481b-bcaf-ae70c9aeb8d8/images/0a147ebe-af99-481b-bcaf-ae70c9aeb8d8_0a6fb8f0-d1b0-4328-a715-f0915691ef07.png"
        imageAlt="Hailuo's Live Mode demonstration"
        videoSrc="https://ddtgdhehxhgarkonvpfq.supabase.co/storage/v1/object/public/user-uploads/users/0a147ebe-af99-481b-bcaf-ae70c9aeb8d8/videos/video_1752772565812.mp4"
        isReversed={true}
        hasPlayButton={true}
        hasSpeakerButton={true}
        bgStyle={sectionBgStyle}
      />
    </div>
  );
};

export default ModelsShowcaseSection;
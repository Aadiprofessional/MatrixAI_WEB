import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

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
  bgStyle,
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
          <motion.div 
            className="lg:w-1/2 space-y-6"
            initial={{ opacity: 0, x: isReversed ? 50 : -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.div 
              className="text-purple-500 font-medium uppercase tracking-wider"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              {modelName}
            </motion.div>
            <motion.h2 
              className="text-4xl font-bold text-white"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              viewport={{ once: true }}
            >
              {title}
            </motion.h2>
            <motion.p 
              className="text-gray-300 text-lg leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
            >
              {description}
            </motion.p>
          </motion.div>
          
          {/* Media content */}
          <motion.div 
            className="lg:w-1/2 relative"
            initial={{ opacity: 0, x: isReversed ? -50 : 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            viewport={{ once: true, margin: "-100px" }}
          >
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
                      <img src={imageSrc} alt={imageAlt || title} className="rounded-lg w-full object-cover h-96 md:h-128" />
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
                          className="rounded-lg w-full object-cover h-96 md:h-128" 
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
                      <img src={imageSrc} alt={imageAlt || title} className="rounded-lg w-full object-cover h-96 md:h-128" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const ModelsShowcaseSection: React.FC = () => {
  const { t } = useTranslation();
  const [selectedModel, setSelectedModel] = useState<string>('google-veo');
  
  // Define a common background style for all sections
  const sectionBgStyle = {
    background: 'linear-gradient(to bottom, #000000, #111827)',
    backgroundAttachment: 'fixed'
  };
  


  
  return (
    <div>
      {/* Main Models Showcase Section */}
    
      
      {/* Feature Sections for different AI capabilities */}
      <FeatureSection 
        title={t('modelsShowcase.featureSections.videoGeneration.title', 'Transform Images into Dynamic Videos')}
        subtitle={t('modelsShowcase.featureSections.videoGeneration.subtitle', 'VIDEO GENERATION')}
        modelName={t('modelsShowcase.featureSections.videoGeneration.modelName', 'VIDEO GENERATION')}
        description={t('modelsShowcase.featureSections.videoGeneration.description', 'Turn any static image into high-quality, lifelike video with our advanced AI video generation. Upload your starting image, add optional parameters, and watch as our models create seamless, cinematic transitions with natural motion. Perfect for marketing, social media content, product demos, and creative projects.')}
        imageSrc="https://ddtgdhehxhgarkonvpfq.supabase.co/storage/v1/object/public/user-uploads/users/0a147ebe-af99-481b-bcaf-ae70c9aeb8d8/images/0a147ebe-af99-481b-bcaf-ae70c9aeb8d8_0a6fb8f0-d1b0-4328-a715-f0915691ef07.png"
        imageAlt="Video Generation demonstration"
        videoSrc="https://ddtgdhehxhgarkonvpfq.supabase.co/storage/v1/object/public/user-uploads/users/0a147ebe-af99-481b-bcaf-ae70c9aeb8d8/videos/video_1752772565812.mp4"
        hasPlayButton={true}
        hasSpeakerButton={true}
        bgStyle={sectionBgStyle}
      />
      
      <FeatureSection 
        title={t('modelsShowcase.featureSections.imageGeneration.title', 'Create Stunning AI-Generated Images')}
        subtitle={t('modelsShowcase.featureSections.imageGeneration.subtitle', 'IMAGE GENERATION')}
        modelName={t('modelsShowcase.featureSections.imageGeneration.modelName', 'IMAGE GENERATION')}
        description={t('modelsShowcase.featureSections.imageGeneration.description', 'Generate high-quality, customized images from simple text descriptions. Our AI image generation models understand complex prompts and produce detailed, creative visuals that match your specifications. Perfect for creating unique visuals for marketing, design projects, or creative inspiration.')}
        imageSrc="https://ddtgdhehxhgarkonvpfq.supabase.co/storage/v1/object/public/user-uploads/users/0a147ebe-af99-481b-bcaf-ae70c9aeb8d8/images/0a147ebe-af99-481b-bcaf-ae70c9aeb8d8_0a6fb8f0-d1b0-4328-a715-f0915691ef07.png"
        imageAlt="Image Generation demonstration"
        videoSrc="https://ddtgdhehxhgarkonvpfq.supabase.co/storage/v1/object/public/user-uploads/users/0a147ebe-af99-481b-bcaf-ae70c9aeb8d8/videos/video_1752772565812.mp4"
        isReversed={true}
        hasPlayButton={true}
        hasSpeakerButton={true}
        bgStyle={sectionBgStyle}
      />
      
      <FeatureSection 
        title={t('modelsShowcase.featureSections.speechToText.title', 'Convert Speech to Accurate Text')}
        subtitle={t('modelsShowcase.featureSections.speechToText.subtitle', 'SPEECH TO TEXT & CONTENT WRITING')}
        modelName={t('modelsShowcase.featureSections.speechToText.modelName', 'SPEECH TO TEXT & CONTENT WRITING')}
        description={t('modelsShowcase.featureSections.speechToText.description', 'Our advanced speech recognition technology converts audio recordings into precise text transcriptions with high accuracy. Perfect for meetings, interviews, content creation, and accessibility. Combine with our content generation to transform your spoken ideas into polished written content instantly.')}
        imageSrc="https://ddtgdhehxhgarkonvpfq.supabase.co/storage/v1/object/public/user-uploads/users/0a147ebe-af99-481b-bcaf-ae70c9aeb8d8/images/0a147ebe-af99-481b-bcaf-ae70c9aeb8d8_0a6fb8f0-d1b0-4328-a715-f0915691ef07.png"
        imageAlt="Speech to Text demonstration"
        videoSrc="https://ddtgdhehxhgarkonvpfq.supabase.co/storage/v1/object/public/user-uploads/users/0a147ebe-af99-481b-bcaf-ae70c9aeb8d8/videos/video_1752772565812.mp4"
        hasPlayButton={true}
        hasSpeakerButton={true}
        bgStyle={sectionBgStyle}
      />
      
      <FeatureSection 
        title={t('modelsShowcase.featureSections.aiChat.title', 'Experience Lightning-Fast AI Chat')}
        subtitle={t('modelsShowcase.featureSections.aiChat.subtitle', 'AI CHAT ASSISTANT')}
        modelName={t('modelsShowcase.featureSections.aiChat.modelName', 'AI CHAT ASSISTANT')}
        description={t('modelsShowcase.featureSections.aiChat.description', 'Our advanced AI chat system provides instant responses to queries, creative assistance, and problem-solving support. Experience minimal latency and high-quality interactions for productivity and creative work. Get immediate answers, brainstorm ideas, draft content, and more with our responsive AI assistant.')}
        imageSrc="https://ddtgdhehxhgarkonvpfq.supabase.co/storage/v1/object/public/user-uploads/users/0a147ebe-af99-481b-bcaf-ae70c9aeb8d8/images/0a147ebe-af99-481b-bcaf-ae70c9aeb8d8_0a6fb8f0-d1b0-4328-a715-f0915691ef07.png"
        imageAlt="AI Chat demonstration"
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
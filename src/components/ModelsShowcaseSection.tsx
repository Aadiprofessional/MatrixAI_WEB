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
      id: 'video-generation',
      name: 'Video Generation',
      description: 'Transform static images into dynamic videos.',
      detailedDescription: 'Our video generation models turn any image into high-quality, lifelike video with natural motion and cinematic quality. Perfect for marketing, social media, and creative projects.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l-3 3m0 0l-3-3m3 3V8M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V16" />
        </svg>
      )
    },
    {
      id: 'image-generation',
      name: 'Image Generation',
      description: 'Create stunning AI-generated images from text prompts.',
      detailedDescription: 'Generate high-quality, customized images from simple text descriptions. Perfect for creating unique visuals for marketing, design projects, or creative inspiration.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      id: 'speech-to-text',
      name: 'Speech to Text',
      description: 'Convert spoken words into accurate text transcriptions.',
      detailedDescription: 'Our advanced speech recognition technology converts audio recordings into precise text transcriptions with high accuracy. Perfect for meetings, interviews, content creation, and accessibility.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      )
    },
    {
      id: 'content-generation',
      name: 'Content Generation',
      description: 'Create engaging written content for any purpose.',
      detailedDescription: 'Generate high-quality written content for blogs, social media, marketing materials, and more. Our AI understands context and can match your brand voice for consistent, engaging content.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      )
    },
    {
      id: 'ai-chat',
      name: 'AI Chat',
      description: 'Engage with our lightning-fast AI assistant.',
      detailedDescription: 'Our advanced AI chat system provides instant responses to queries, creative assistance, and problem-solving support. Experience minimal latency and high-quality interactions for productivity and creative work.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      )
    },
    {
      id: 'creative-suite',
      name: 'Creative Suite',
      description: 'All creative AI tools in one integrated platform.',
      detailedDescription: 'Access our complete suite of AI creative tools in one seamless platform. Combine video generation, image creation, speech-to-text, content writing, and AI chat for comprehensive creative projects with consistent quality.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
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
            All the leading AI models and features on one platform
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-xl text-gray-300 text-center mb-16 max-w-3xl mx-auto"
          >
            With matrixai.asia, you always have the right tool—never just one option. Instantly access video generation, image creation, speech-to-text, content writing, and AI chat, all in one place.
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
      
      {/* Feature Sections for different AI capabilities */}
      <FeatureSection 
        title="Transform Images into Dynamic Videos"
        subtitle="VIDEO GENERATION"
        modelName="VIDEO GENERATION"
        description="Turn any static image into high-quality, lifelike video with our advanced AI video generation. Upload your starting image, add optional parameters, and watch as our models create seamless, cinematic transitions with natural motion. Perfect for marketing, social media content, product demos, and creative projects."
        imageSrc="https://ddtgdhehxhgarkonvpfq.supabase.co/storage/v1/object/public/user-uploads/users/0a147ebe-af99-481b-bcaf-ae70c9aeb8d8/images/0a147ebe-af99-481b-bcaf-ae70c9aeb8d8_0a6fb8f0-d1b0-4328-a715-f0915691ef07.png"
        imageAlt="Video Generation demonstration"
        videoSrc="https://ddtgdhehxhgarkonvpfq.supabase.co/storage/v1/object/public/user-uploads/users/0a147ebe-af99-481b-bcaf-ae70c9aeb8d8/videos/video_1752772565812.mp4"
        hasPlayButton={true}
        hasSpeakerButton={true}
        bgStyle={sectionBgStyle}
      />
      
      <FeatureSection 
        title="Create Stunning AI-Generated Images"
        subtitle="IMAGE GENERATION"
        modelName="IMAGE GENERATION"
        description="Generate high-quality, customized images from simple text descriptions. Our AI image generation models understand complex prompts and produce detailed, creative visuals that match your specifications. Perfect for creating unique visuals for marketing, design projects, or creative inspiration."
        imageSrc="https://ddtgdhehxhgarkonvpfq.supabase.co/storage/v1/object/public/user-uploads/users/0a147ebe-af99-481b-bcaf-ae70c9aeb8d8/images/0a147ebe-af99-481b-bcaf-ae70c9aeb8d8_0a6fb8f0-d1b0-4328-a715-f0915691ef07.png"
        imageAlt="Image Generation demonstration"
        videoSrc="https://ddtgdhehxhgarkonvpfq.supabase.co/storage/v1/object/public/user-uploads/users/0a147ebe-af99-481b-bcaf-ae70c9aeb8d8/videos/video_1752772565812.mp4"
        isReversed={true}
        hasPlayButton={true}
        hasSpeakerButton={true}
        bgStyle={sectionBgStyle}
      />
      
      <FeatureSection 
        title="Convert Speech to Accurate Text"
        subtitle="SPEECH TO TEXT & CONTENT WRITING"
        modelName="SPEECH TO TEXT & CONTENT WRITING"
        description="Our advanced speech recognition technology converts audio recordings into precise text transcriptions with high accuracy. Perfect for meetings, interviews, content creation, and accessibility. Combine with our content generation to transform your spoken ideas into polished written content instantly."
        imageSrc="https://ddtgdhehxhgarkonvpfq.supabase.co/storage/v1/object/public/user-uploads/users/0a147ebe-af99-481b-bcaf-ae70c9aeb8d8/images/0a147ebe-af99-481b-bcaf-ae70c9aeb8d8_0a6fb8f0-d1b0-4328-a715-f0915691ef07.png"
        imageAlt="Speech to Text demonstration"
        videoSrc="https://ddtgdhehxhgarkonvpfq.supabase.co/storage/v1/object/public/user-uploads/users/0a147ebe-af99-481b-bcaf-ae70c9aeb8d8/videos/video_1752772565812.mp4"
        hasPlayButton={true}
        hasSpeakerButton={true}
        bgStyle={sectionBgStyle}
      />
      
      <FeatureSection 
        title="Experience Lightning-Fast AI Chat"
        subtitle="AI CHAT ASSISTANT"
        modelName="AI CHAT ASSISTANT"
        description="Our advanced AI chat system provides instant responses to queries, creative assistance, and problem-solving support. Experience minimal latency and high-quality interactions for productivity and creative work. Get immediate answers, brainstorm ideas, draft content, and more with our responsive AI assistant."
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
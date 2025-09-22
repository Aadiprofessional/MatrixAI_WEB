import React from 'react';
import { motion } from 'framer-motion';
import { FiImage, FiCode, FiCpu, FiEye } from 'react-icons/fi';

interface IntelligentImageThinkingProps {
  stage: 'analyzing' | 'generating_description' | 'calling_api' | 'completed';
  darkMode?: boolean;
}

export const IntelligentImageThinking: React.FC<IntelligentImageThinkingProps> = ({
  stage,
  darkMode = false
}) => {
  const getStageInfo = () => {
    switch (stage) {
      case 'analyzing':
        return {
          icon: FiEye,
          text: 'Analyzing if visual content would help...',
          color: 'text-blue-500'
        };
      case 'generating_description':
        return {
          icon: FiCode,
          text: 'Generating image description...',
          color: 'text-green-500'
        };
      case 'calling_api':
        return {
          icon: FiCpu,
          text: 'Creating image with AI...',
          color: 'text-purple-500'
        };
      case 'completed':
        return {
          icon: FiImage,
          text: 'Image generation completed!',
          color: 'text-orange-500'
        };
      default:
        return {
          icon: FiCpu,
          text: 'Processing...',
          color: 'text-gray-500'
        };
    }
  };

  const stageInfo = getStageInfo();
  const Icon = stageInfo.icon;

  return (
    <div className={`intelligent-image-thinking-container flex items-center space-x-3 p-3 rounded-lg ${
      darkMode 
        ? 'bg-gray-800/50 border border-gray-700' 
        : 'bg-blue-50/50 border border-blue-200'
    }`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className={`p-2 rounded-full ${
          darkMode ? 'bg-gray-700' : 'bg-white'
        }`}
      >
        <Icon className={`w-4 h-4 ${stageInfo.color}`} />
      </motion.div>
      
      <div className="flex-1">
        <motion.div
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
          className={`text-sm font-medium ${
            darkMode ? 'text-gray-200' : 'text-gray-800'
          }`}
        >
          {stageInfo.text}
        </motion.div>
        
        {/* Animated dots */}
        <div className="flex space-x-1 mt-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2
              }}
              className={`w-1 h-1 rounded-full ${
                darkMode ? 'bg-gray-400' : 'bg-gray-500'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default IntelligentImageThinking;
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiImage, FiLoader, FiCheck, FiX, FiDownload, FiMaximize, 
  FiCode, FiEye, FiCopy, FiRefreshCw 
} from 'react-icons/fi';

interface IntelligentImageGenerationProps {
  isGenerating: boolean;
  generationStage: 'analyzing' | 'generating_description' | 'calling_api' | 'completed' | 'error';
  progress: number;
  imageUrl?: string;
  imageId?: string;
  contentType?: string;
  description?: string;
  error?: string;
  coinCost?: number;
  onRetry?: () => void;
  onDownload?: () => void;
  onViewDescription?: () => void;
  darkMode?: boolean;
}

export const IntelligentImageGeneration: React.FC<IntelligentImageGenerationProps> = ({
  isGenerating,
  generationStage,
  progress,
  imageUrl,
  imageId,
  contentType,
  description,
  error,
  coinCost,
  onRetry,
  onDownload,
  onViewDescription,
  darkMode = false
}) => {
  const [showCode, setShowCode] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const getStageText = () => {
    switch (generationStage) {
      case 'analyzing':
        return 'Understanding your request...';
      case 'generating_description':
        return 'Creating detailed description...';
      case 'calling_api':
        return 'Generating your image...';
      case 'completed':
        return 'Image created successfully!';
      case 'error':
        return 'Something went wrong';
      default:
        return 'Processing...';
    }
  };

  const getStageIcon = () => {
    switch (generationStage) {
      case 'analyzing':
        return <FiEye className="w-4 h-4" />;
      case 'generating_description':
        return <FiCode className="w-4 h-4" />;
      case 'calling_api':
        return <FiImage className="w-4 h-4" />;
      case 'completed':
        return <FiCheck className="w-4 h-4 text-green-500" />;
      case 'error':
        return <FiX className="w-4 h-4 text-red-500" />;
      default:
        return <FiLoader className="w-4 h-4 animate-spin" />;
    }
  };

  const copyDescription = () => {
    if (description) {
      navigator.clipboard.writeText(description);
    }
  };

  if (!isGenerating && !imageUrl && !error) {
    return null;
  }

  return (
    <div className={`intelligent-image-container ${darkMode ? 'dark' : ''}`}>
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`generation-progress-container p-4 rounded-lg border ${
              darkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-blue-50 border-blue-200'
            }`}
          >
            <div className="flex items-center space-x-3 mb-3">
              <div className={`p-2 rounded-full ${
                darkMode ? 'bg-gray-700' : 'bg-blue-100'
              }`}>
                {getStageIcon()}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  darkMode ? 'text-gray-200' : 'text-gray-800'
                }`}>
                  {getStageText()}
                </p>
                {description && (
                  <p className={`text-xs mt-1 ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {description}
                  </p>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className={`w-full bg-gray-200 rounded-full h-2 ${
              darkMode ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              <motion.div
                className="bg-blue-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            <div className="flex justify-between items-center mt-2">
              <span className={`text-xs ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {progress}% complete
              </span>
              {contentType && (
                <span className={`text-xs px-2 py-1 rounded ${
                  darkMode 
                    ? 'bg-gray-700 text-gray-300' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {contentType}
                </span>
              )}
            </div>
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`error-container p-4 rounded-lg border ${
              darkMode 
                ? 'bg-red-900/20 border-red-700' 
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-center space-x-3">
              <FiX className="w-5 h-5 text-red-500" />
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  darkMode ? 'text-red-400' : 'text-red-800'
                }`}>
                  Failed to generate visual content
                </p>
                <p className={`text-xs mt-1 ${
                  darkMode ? 'text-red-300' : 'text-red-600'
                }`}>
                  {error}
                </p>
              </div>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className={`p-2 rounded-lg transition-colors ${
                    darkMode 
                      ? 'bg-red-800 hover:bg-red-700 text-red-200' 
                      : 'bg-red-100 hover:bg-red-200 text-red-800'
                  }`}
                >
                  <FiRefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Generated Image Display */}
        {imageUrl && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`generated-image-container mt-4 rounded-lg border overflow-hidden ${
              darkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}
          >
            {/* Image Header */}
            <div className={`px-4 py-3 border-b ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FiImage className={`w-4 h-4 ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`} />
                  <span className={`text-sm font-medium ${
                    darkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    Generated {contentType || 'Visualization'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {description && (
                    <button
                      onClick={() => setShowCode(!showCode)}
                      className={`p-1.5 rounded transition-colors ${
                        darkMode 
                          ? 'hover:bg-gray-700 text-gray-400' 
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                      title="View description"
                    >
                      <FiCode className="w-4 h-4" />
                    </button>
                  )}
                  {onDownload && (
                    <button
                      onClick={onDownload}
                      className={`p-1.5 rounded transition-colors ${
                        darkMode 
                          ? 'hover:bg-gray-700 text-gray-400' 
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                      title="Download image"
                    >
                      <FiDownload className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              {description && (
                <p className={`text-xs mt-2 ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {description}
                </p>
              )}
            </div>

            {/* Image Display */}
            <div className="relative">
              <img
                src={imageUrl}
                alt={description || 'Generated visualization'}
                className={`w-full h-auto transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(true)}
              />
              {!imageLoaded && (
                <div className={`absolute inset-0 flex items-center justify-center ${
                  darkMode ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                  <FiLoader className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              )}
            </div>

            {/* Description Display */}
            <AnimatePresence>
              {showCode && description && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className={`border-t ${
                    darkMode ? 'border-gray-700' : 'border-gray-200'
                  }`}
                >
                  <div className={`px-4 py-3 ${
                    darkMode ? 'bg-gray-900' : 'bg-gray-50'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-medium ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Description
                      </span>
                      <button
                        onClick={copyDescription}
                        className={`p-1 rounded transition-colors ${
                          darkMode 
                            ? 'hover:bg-gray-800 text-gray-400' 
                            : 'hover:bg-gray-200 text-gray-600'
                        }`}
                        title="Copy description"
                      >
                        <FiCopy className="w-3 h-3" />
                      </button>
                    </div>
                    <div className={`text-sm p-3 rounded ${
                      darkMode 
                        ? 'bg-gray-800 text-gray-300' 
                        : 'bg-white text-gray-800'
                    }`}>
                      {description}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .intelligent-image-container {
          margin: 1rem 0;
        }
        
        .generation-progress-container {
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        
        .generated-image-container img {
          max-height: 500px;
          object-fit: contain;
        }
        
        .error-container {
          animation: shake 0.5s ease-in-out;
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
};

export default IntelligentImageGeneration;
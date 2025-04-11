import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiDownload, FiShare2, FiCopy, FiImage, FiSend, FiSliders, FiPlus, FiTrash, FiCheck } from 'react-icons/fi';
import { ProFeatureAlert } from '../components';
import { useUser } from '../context/UserContext';

const ImageGeneratorPage: React.FC = () => {
  const { userData, isPro } = useUser();
  const [prompt, setPrompt] = useState('');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('square');
  const [stylePreset, setStylePreset] = useState('natural');
  const [imageCount, setImageCount] = useState(4);
  const [showProAlert, setShowProAlert] = useState(false);
  const [freeGenerationsLeft, setFreeGenerationsLeft] = useState(3);
  const [savedPrompts, setSavedPrompts] = useState<string[]>([
    'A futuristic city with flying cars and neon lights',
    'Underwater scene with colorful coral reef and tropical fish',
    'Mountain landscape at sunset with reflection in a lake'
  ]);

  // Placeholder styles for the image generator
  const styleOptions = [
    { id: 'natural', name: 'Natural' },
    { id: 'digital-art', name: 'Digital Art' },
    { id: 'cinematic', name: 'Cinematic' },
    { id: 'anime', name: 'Anime' },
    { id: 'fantasy', name: 'Fantasy' },
    { id: 'abstract', name: 'Abstract' },
    { id: 'watercolor', name: 'Watercolor' },
    { id: 'oil-painting', name: 'Oil Painting' },
  ];

  // Placeholder ratio options
  const ratioOptions = [
    { id: 'square', name: '1:1', width: 512, height: 512 },
    { id: 'portrait', name: '3:4', width: 512, height: 680 },
    { id: 'landscape', name: '4:3', width: 680, height: 512 },
    { id: 'widescreen', name: '16:9', width: 912, height: 512 },
  ];

  const handleGenerateImages = async () => {
    if (!prompt.trim()) return;
    
    // If user is not pro and has used all free generations, show pro alert
    if (!isPro && freeGenerationsLeft <= 0) {
      setShowProAlert(true);
      return;
    }

    setIsGenerating(true);
    
    try {
      // Simulate image generation API call
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Placeholder images (in a real app, these would come from the API)
      const dummyImages = [
        'https://source.unsplash.com/random/512x512?sig=1',
        'https://source.unsplash.com/random/512x512?sig=2',
        'https://source.unsplash.com/random/512x512?sig=3',
        'https://source.unsplash.com/random/512x512?sig=4',
      ].slice(0, imageCount);
      
      setGeneratedImages(dummyImages);
      
      // Add the prompt to saved prompts if it's not already there
      if (!savedPrompts.includes(prompt)) {
        setSavedPrompts(prev => [prompt, ...prev].slice(0, 10));
      }
      
      // Decrease free generations left if user is not pro
      if (!isPro) {
        setFreeGenerationsLeft(prev => prev - 1);
      }
    } catch (error) {
      console.error('Error generating images:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (imageUrl: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `matrixai-image-${new Date().getTime()}.jpg`;
    link.click();
  };

  const handleCopyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };

  const handleSelectImage = (imageUrl: string) => {
    setSelectedImage(imageUrl === selectedImage ? null : imageUrl);
  };

  return (
    <div className="container mx-auto max-w-6xl p-4 py-8">
      {showProAlert && (
        <ProFeatureAlert 
          featureName="Unlimited Image Generation"
          onClose={() => setShowProAlert(false)}
        />
      )}
      
      <div className="mb-8">
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
        >
          AI Image Generator
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-500 dark:text-gray-400"
        >
          Transform your ideas into stunning images with the power of AI
        </motion.p>
        
        {!isPro && (
          <div className="mt-2 flex items-center text-sm text-yellow-600 dark:text-yellow-400">
            <FiImage className="mr-1.5" />
            <span>{freeGenerationsLeft} free generations left today</span>
            {freeGenerationsLeft === 0 && (
              <button 
                onClick={() => setShowProAlert(true)}
                className="ml-2 text-blue-500 hover:text-blue-600 font-medium"
              >
                Upgrade to Pro
              </button>
            )}
          </div>
        )}
      </div>

      {/* Prompt Input and Generation Controls */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to generate..."
                className="w-full p-4 pr-12 border rounded-lg shadow-sm h-24 dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="absolute top-2 right-2">
                <button 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <FiSliders />
                </button>
              </div>
            </div>

            {showAdvanced && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-4 border rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-300">Style</label>
                    <select 
                      value={stylePreset}
                      onChange={(e) => setStylePreset(e.target.value)}
                      className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                    >
                      {styleOptions.map(style => (
                        <option key={style.id} value={style.id}>{style.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-300">Aspect Ratio</label>
                    <select 
                      value={aspectRatio}
                      onChange={(e) => setAspectRatio(e.target.value)}
                      className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                    >
                      {ratioOptions.map(ratio => (
                        <option key={ratio.id} value={ratio.id}>{ratio.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-300">Number of Images</label>
                    <select 
                      value={imageCount}
                      onChange={(e) => setImageCount(Number(e.target.value))}
                      className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                    >
                      {[1, 2, 4].map(count => (
                        <option key={count} value={count}>{count}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
          <div className="flex-shrink-0">
            <button
              onClick={handleGenerateImages}
              disabled={!prompt.trim() || isGenerating}
              className={`h-24 px-6 rounded-lg font-medium flex items-center justify-center ${
                !prompt.trim() || isGenerating
                  ? 'bg-gray-300 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                  : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white hover:opacity-90'
              } transition`}
            >
              {isGenerating ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating
                </div>
              ) : (
                <div className="flex items-center">
                  <FiImage className="mr-2" />
                  Generate
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Saved Prompts */}
        {savedPrompts.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Recent Prompts</h3>
            <div className="flex flex-wrap gap-2">
              {savedPrompts.map((savedPrompt, index) => (
                <button
                  key={index}
                  onClick={() => setPrompt(savedPrompt)}
                  className="flex items-center text-sm text-left bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 group max-w-xs"
                >
                  <span className="truncate">{savedPrompt}</span>
                  <FiCopy 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyPrompt(savedPrompt);
                    }}
                    className="ml-2 w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" 
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Generated Images */}
      {generatedImages.length > 0 && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Generated Images</h2>
            {selectedImage && (
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleDownload(selectedImage)}
                  className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <FiDownload className="mr-1.5" />
                  Download
                </button>
                <button className="flex items-center px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">
                  <FiShare2 className="mr-1.5" />
                  Share
                </button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {generatedImages.map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative rounded-lg overflow-hidden border-2 cursor-pointer ${
                  selectedImage === image
                    ? 'border-blue-500 dark:border-blue-500'
                    : 'border-transparent'
                }`}
                onClick={() => handleSelectImage(image)}
              >
                <img 
                  src={image} 
                  alt={`Generated image ${index + 1}`}
                  className="w-full h-full object-cover aspect-square"
                />
                {selectedImage === image && (
                  <div className="absolute top-2 right-2">
                    <div className="bg-blue-500 text-white rounded-full p-1">
                      <FiCheck className="w-4 h-4" />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Image Generation History - Could be implemented in a more comprehensive app */}
      {/* Example suggestions for image generation */}
      {generatedImages.length === 0 && !isGenerating && (
        <div className="mt-8 p-8 border border-dashed rounded-lg text-center dark:border-gray-700">
          <FiImage className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">No images generated yet</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
            Enter a descriptive prompt and click the Generate button to create AI-powered images
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
            <button
              onClick={() => setPrompt('A cyberpunk city street at night with neon signs and rain')}
              className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm flex items-start"
            >
              <FiPlus className="mr-2 mt-0.5 text-blue-500 flex-shrink-0" />
              A cyberpunk city street at night with neon signs and rain
            </button>
            <button
              onClick={() => setPrompt('A photorealistic portrait of an astronaut in space with Earth visible in the helmet reflection')}
              className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm flex items-start"
            >
              <FiPlus className="mr-2 mt-0.5 text-blue-500 flex-shrink-0" />
              A photorealistic portrait of an astronaut in space with Earth visible
            </button>
            <button
              onClick={() => setPrompt('A serene Japanese garden with cherry blossoms and a small bridge over a pond')}
              className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm flex items-start"
            >
              <FiPlus className="mr-2 mt-0.5 text-blue-500 flex-shrink-0" />
              A serene Japanese garden with cherry blossoms and a small bridge
            </button>
            <button
              onClick={() => setPrompt('A fantasy landscape with floating islands, waterfalls, and rainbow bridges')}
              className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm flex items-start"
            >
              <FiPlus className="mr-2 mt-0.5 text-blue-500 flex-shrink-0" />
              A fantasy landscape with floating islands, waterfalls, and rainbow bridges
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGeneratorPage; 
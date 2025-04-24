import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiDownload, FiShare2, FiCopy, FiImage, FiSliders, FiPlus, FiTrash, FiCheck, FiChevronDown } from 'react-icons/fi';
import { ProFeatureAlert } from '../components';
import { useUser } from '../context/UserContext';
import axios from 'axios';

// Define image interface
interface ImageData {
  url: string;
  image_id: string;
  prompt: string;
  created_at: string;
}

const ImageGeneratorPage: React.FC = () => {
  const { userData, isPro } = useUser();
  const uid = userData?.uid || '';

  
  const [prompt, setPrompt] = useState('');
  const [generatedImages, setGeneratedImages] = useState<ImageData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
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
  
  // Image History states
  const [imageHistory, setImageHistory] = useState<ImageData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [hasMoreImages, setHasMoreImages] = useState(true);
  const [imagesPerPage] = useState(8);
  const [showHistory, setShowHistory] = useState(false);

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

  // Fetch image history on component mount
  useEffect(() => {
    if (uid) {
      fetchImageHistory();
    }
  }, [uid]);

  const fetchImageHistory = async (page = 1) => {
    if (!uid) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `https://matrix-server.vercel.app/getGeneratedImage?uid=${uid}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch image history');
      }
      
      const result = await response.json();
      const newImages = result.data || [];
      
      setImageHistory(newImages);
      setHasMoreImages(false); // Since we're getting all images at once
      
    } catch (err: any) {
      console.error('Error fetching image history:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreImages = () => {
    if (!isLoading && hasMoreImages) {
      fetchImageHistory(historyPage + 1);
    }
  };
  
  const handleRemoveImage = async (imageId: string) => {
    if (!uid || !imageId) return;
    
    try {
      if (window.confirm("Are you sure you want to remove this image?")) {
        setIsLoading(true);
        const response = await fetch(
          'https://matrix-server.vercel.app/removeImage',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              uid: uid,
              image_id: imageId
            })
          }
        );
        
        if (!response.ok) {
          throw new Error('Failed to remove image');
        }
        
        // Remove the image from the local state
        setImageHistory(prev => prev.filter(img => img.image_id !== imageId));
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('Error removing image:', err);
      alert('Failed to remove the image. Please try again.');
      setIsLoading(false);
    }
  };

  const handleGenerateImages = async () => {
    if (!prompt.trim() || !uid) return;
    
    // If user is not pro and has used all free generations, show pro alert
    if (!isPro && freeGenerationsLeft <= 0) {
      setShowProAlert(true);
      return;
    }

    setIsGenerating(true);
    
    try {
      const newImages: ImageData[] = [];
      
      // Generate the requested number of images
      for (let i = 0; i < imageCount; i++) {
        // Use server proxy to avoid CORS issues
        const response = await fetch(
          'https://ddtgdhehxhgarkonvpfq.supabase.co/functions/v1/generateImage',
          {
            method: 'POST',
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkdGdkaGVoeGhnYXJrb252cGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2Njg4MTIsImV4cCI6MjA1MDI0NDgxMn0.mY8nx-lKrNXjJxHU7eEja3-fTSELQotOP4aZbxvmNPY`,
            },
            body: JSON.stringify({
              text: prompt, 
              uid: uid,
            })
          }
        );
        
        if (!response.ok) {
          throw new Error('Failed to generate image');
        }
        
        const result = await response.json();
        
        if (result && result.image && result.image.url) {
          newImages.push(result.image);
        }
      }
      
      setGeneratedImages(newImages);
      
      // Add the prompt to saved prompts if it's not already there
      if (!savedPrompts.includes(prompt)) {
        setSavedPrompts(prev => [prompt, ...prev].slice(0, 10));
      }
      
      // Decrease free generations left if user is not pro
      if (!isPro) {
        setFreeGenerationsLeft(prev => prev - 1);
      }
      
      // Refresh image history
      fetchImageHistory(1);
    } catch (error) {
      console.error('Error generating images:', error);
      alert('Failed to generate images. Please try again.');
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
    alert('Prompt copied to clipboard!');
  };

  const handleSelectImage = (image: ImageData) => {
    setSelectedImage(image === selectedImage ? null : image);
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
                className="w-full p-4 pr-12 border rounded-lg shadow-sm h-24 dark:bg-gray-800 dark:border-gray-700 bg-white text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    <label className="block text-sm font-medium mb-2 dark:text-gray-300 text-gray-700">Style</label>
                    <select 
                      value={stylePreset}
                      onChange={(e) => setStylePreset(e.target.value)}
                      className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 bg-white text-gray-800 dark:text-gray-200"
                    >
                      {styleOptions.map(style => (
                        <option key={style.id} value={style.id}>{style.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-300 text-gray-700">Aspect Ratio</label>
                    <select 
                      value={aspectRatio}
                      onChange={(e) => setAspectRatio(e.target.value)}
                      className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 bg-white text-gray-800 dark:text-gray-200"
                    >
                      {ratioOptions.map(ratio => (
                        <option key={ratio.id} value={ratio.id}>{ratio.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-300 text-gray-700">Number of Images</label>
                    <select 
                      value={imageCount}
                      onChange={(e) => setImageCount(Number(e.target.value))}
                      className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 bg-white text-gray-800 dark:text-gray-200"
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
            <h3 className="text-sm font-medium mb-2 dark:text-gray-300 text-gray-700">Your recent prompts:</h3>
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
      {isGenerating ? (
        <div className="mt-8 p-8 border border-dashed rounded-lg text-center dark:border-gray-700">
          <div className="flex flex-col items-center justify-center">
            <svg className="animate-spin h-12 w-12 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Generating your {imageCount > 1 ? `${imageCount} images` : 'image'}...</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              This may take a few moments as we create your AI-powered masterpiece
            </p>
          </div>
        </div>
      ) : generatedImages.length > 0 && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold mb-4 dark:text-gray-200 text-gray-800">Generated Images</h2>
            {selectedImage && (
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleDownload(selectedImage.url)}
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
                  src={image.url} 
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
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-40 transition-all duration-300 flex items-end justify-center p-3 opacity-0 hover:opacity-100">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(image.url);
                    }}
                    className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 mx-1"
                  >
                    <FiDownload size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Image History Section */}
      <div className="mt-12">
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center justify-between w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg mb-4 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <div className="flex items-center">
            <FiImage className="mr-2 text-blue-500" />
            <h2 className="text-xl font-bold dark:text-gray-200 text-gray-800">Your Image History</h2>
          </div>
          <FiChevronDown className={`transition-transform ${showHistory ? 'transform rotate-180' : ''}`} />
        </button>
        
        {showHistory && (
          <div className="mt-4">
            {error && (
              <div className="p-4 mb-4 bg-red-100 text-red-700 rounded-lg">
                Error: {error}
              </div>
            )}
            
            {imageHistory.length === 0 && !isLoading ? (
              <div className="p-8 border border-dashed rounded-lg text-center dark:border-gray-700">
                <FiImage className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">No image history found</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  Generate your first image to start building your collection
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {imageHistory.map((image, index) => (
                    <div 
                      key={image.image_id || index} 
                      className="relative group rounded-lg overflow-hidden border dark:border-gray-700"
                    >
                      <img 
                        src={image.url} 
                        alt={image.prompt || `Generated image ${index + 1}`}
                        className="w-full h-full object-cover aspect-square"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex flex-col justify-between p-3">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleRemoveImage(image.image_id)} 
                            className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <FiTrash size={14} />
                          </button>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                          <button 
                            onClick={() => handleDownload(image.url)} 
                            className="p-1.5 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                          >
                            <FiDownload size={14} />
                          </button>
                          <button 
                            onClick={() => handleCopyPrompt(image.prompt || '')} 
                            className="p-1.5 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600"
                          >
                            <FiCopy size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {hasMoreImages && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={loadMoreImages}
                      disabled={isLoading}
                      className={`px-4 py-2 rounded-lg ${
                        isLoading 
                        ? 'bg-gray-300 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      {isLoading ? 'Loading...' : 'Load More'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

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
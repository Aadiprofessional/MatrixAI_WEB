import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { FiDownload, FiShare2, FiTrash, FiChevronDown, FiImage, FiRefreshCw, FiList, FiX, FiClock } from 'react-icons/fi';
import { Navbar, Sidebar, ProFeatureAlert } from '../components';
import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { imageService } from '../services/imageService';

// Define image interface
interface ImageData {
  url: string;
  image_id: string;
  prompt: string;
  created_at: string;
}

interface ImageHistoryItem {
  image_id: string;
  image_name: string;
  image_url: string;
  prompt_text: string;
  created_at: string;
  url: string;
}

const ImageGeneratorPage: React.FC = () => {
  const { userData, isPro } = useUser();
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const uid = user?.id || '';

  // State for image generation
  const [message, setMessage] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [imageCount, setImageCount] = useState(4);
  const [showProAlert, setShowProAlert] = useState(false);
  const [freeGenerationsLeft, setFreeGenerationsLeft] = useState(3);
  
  // Image generation state
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  
  // Animation controls
  const imageOpacity = useAnimation();
  const imageScale = useAnimation();
  
  // Image History states
  const [imageHistory, setImageHistory] = useState<ImageHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [hasMoreImages, setHasMoreImages] = useState(true);
  const [imagesPerPage] = useState(8);
  const [showHistory, setShowHistory] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Polling refs
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Fade in animation
  const fadeInImage = () => {
    imageOpacity.start({ 
      opacity: 1, 
      transition: { duration: 0.5 } 
    });
    imageScale.start({ 
      scale: 1, 
      transition: { duration: 0.5, type: 'spring' } 
    });
  };

  // Clear stored images from local storage
  const clearStoredImages = async () => {
    localStorage.removeItem("downloadedImages");
    return true;
  };

  // Start polling for image status
  const startPolling = (taskId: string) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setInterval(async () => {
      try {
        if (!uid) return;
        
        const response = await imageService.getImageStatus(uid, taskId);
        console.log('Image status response:', response);
        
        setGenerationStatus(response.status);
        
        // Update progress bar while processing
        if (response.status === 'processing') {
          setProcessingProgress(prev => {
            const newProgress = prev + Math.random() * 2; // Slower increment during polling
            return newProgress > 95 ? 95 : newProgress;
          });
        }
        
        // Check if images are completed
        if (response.status === 'completed') {
          // Images are ready
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }
          
          setProcessingProgress(100);
          
          // Check if images are returned in the response
          if (response.images && response.images.length > 0) {
            // Transform the image data to match expected format
            const imageData = response.images.map((img: any) => ({
              url: img.imageUrl,
              image_id: img.imageId,
              image_name: img.imageName,
              image_url: img.imageUrl,
              prompt: message,
              created_at: new Date().toISOString()
            }));
            
            // Store the images and update UI
            localStorage.setItem("downloadedImages", JSON.stringify(imageData));
            setImages(imageData.map((img: any) => img.url));
            
            // Show skeleton for 1 second before revealing the images
            setTimeout(() => {
              setShowSkeleton(false);
              setLoading(false);
              fadeInImage();
            }, 1000);
            
          } else {
            // Fallback: Images were generated but not returned in status response
            // Fetch recent images from getAllImages endpoint
            console.log('Images completed but empty array returned, fetching from database...');
            
            try {
              const allImagesResponse = await imageService.getAllImages(uid);
              
              if (allImagesResponse.images && allImagesResponse.images.length > 0) {
                // Get the most recent images (assuming they are the ones just generated)
                const recentImages = allImagesResponse.images
                  .slice(0, imageCount) // Get the number of images we requested
                  .map((img: any) => ({
                    url: img.image_url,
                    image_id: img.image_id,
                    image_name: img.image_name,
                    image_url: img.image_url,
                    prompt: img.prompt_text || message,
                    created_at: img.created_at
                  }));
                
                // Store the images and update UI
                localStorage.setItem("downloadedImages", JSON.stringify(recentImages));
                setImages(recentImages.map((img: any) => img.url));
                
                // Show skeleton for 1 second before revealing the images
                setTimeout(() => {
                  setShowSkeleton(false);
                  setLoading(false);
                  fadeInImage();
                }, 1000);
              } else {
                // No images found even in database
                setLoading(false);
                setShowSkeleton(false);
                setError('Images were generated but could not be retrieved. Please check your history or try again.');
              }
            } catch (fetchError) {
              console.error('Error fetching images from database:', fetchError);
              setLoading(false);
              setShowSkeleton(false);
              setError('Images were generated but could not be retrieved. Please check your history or try again.');
            }
          }
          
          // Decrease free generations left if user is not pro
          if (!isPro) {
            setFreeGenerationsLeft(prev => Math.max(0, prev - 1));
          }
          
          // Refresh image history
          fetchImageHistory(1);
          
        } else if (response.status === 'failed') {
          // Image generation failed
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }
          setLoading(false);
          setShowSkeleton(false);
          setError(response.error || 'Image generation failed. Please try again.');
        }
        // Continue polling if status is still 'processing'
      } catch (error: any) {
        console.error('Error checking image status:', error);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
        setLoading(false);
        setShowSkeleton(false);
        setError('Failed to check image status. Please try again.');
      }
    }, 500); // Poll every 0.5 seconds (500ms)

    // Clear interval after 2 minutes to prevent infinite polling
    setTimeout(() => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        if (loading) {
          setLoading(false);
          setShowSkeleton(false);
          setError('Image generation is taking longer than expected. Please try again later.');
        }
      }
    }, 120000); // 2 minutes timeout
  };

  // Function to fetch and generate images
  const fetchAndStoreImages = async () => {
    try {
      // Clear any previously stored images when fetching new ones
      await clearStoredImages();
      
      setLoading(true);
      setShowSkeleton(true);
      setError(null);
      setCurrentTaskId(null);
      setGenerationStatus('');
      setProcessingProgress(0);
      
      // Reset animation values
      imageOpacity.set({ opacity: 0 });
      imageScale.set({ scale: 0.95 });
      
      // Start progress animation
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          const newProgress = prev + Math.random() * 3;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 500);
      
      try {
        // Step 1: Make API request to generate new images (this returns a taskId)
        const generationResponse = await imageService.generateImage(uid, message, imageCount);
        console.log('Image generation response:', generationResponse);
        
        if (!generationResponse.taskId) {
          throw new Error('No task ID received from generation request');
        }
        
        setCurrentTaskId(generationResponse.taskId);
        setGenerationStatus(generationResponse.status || 'processing');
        
        // Start polling for image status
        startPolling(generationResponse.taskId);
        
        // Clear the progress interval since we're now polling
        clearInterval(progressInterval);
        
      } catch (apiError) {
        console.error("Error from API:", apiError);
        setLoading(false);
        setShowSkeleton(false);
        setError("Failed to generate images. Please try again.");
        clearInterval(progressInterval);
      }
      
    } catch (error) {
      console.error("Error fetching images:", error);
      setLoading(false);
      setShowSkeleton(false);
      setError("Something went wrong. Please try again.");
    }
  };

  // Function to cancel generation
  const cancelGeneration = () => {
    setLoading(false);
    setShowSkeleton(false);
    setProcessingProgress(0);
    setError(null);
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
  };

  // Function to get status text
  const getStatusText = () => {
    switch (generationStatus) {
      case 'processing':
        return 'Generating images...';
      case 'completed':
        return 'Images generated successfully!';
      case 'failed':
        return 'Image generation failed';
      default:
        return 'Initializing image generation...';
    }
  };

  // Function to fetch image history
  const fetchImageHistory = async (page = 1) => {
    if (!uid) return;
    
    setIsLoading(true);
    setHistoryError(null);
    
    try {
      const response = await imageService.getImageHistory(uid, page, 5); // Load recent 5 images
      
      const newImages = response.data || [];
      
      if (page === 1) {
        setImageHistory(newImages);
        // Also save to localStorage for offline use
        localStorage.setItem("imageHistory", JSON.stringify(newImages));
      } else {
        const updatedHistory = [...imageHistory, ...newImages];
        setImageHistory(updatedHistory);
        // Update localStorage
        localStorage.setItem("imageHistory", JSON.stringify(updatedHistory));
      }
      
      setHistoryPage(page);
      setHasMoreImages(newImages.length >= 5);
      setIsLoading(false);
    } catch (err: any) {
      console.error('Error fetching image history:', err);
      setHistoryError(err.message || "Failed to load image history");
      setIsLoading(false);
    }
  };

  // Function to handle image removal
  const handleRemoveImage = async (imageId: string) => {
    if (!uid || !imageId) return;
    
    try {
      if (window.confirm("Are you sure you want to remove this image?")) {
        setIsLoading(true);
        
        try {
          // Try to remove from server using imageService
          await imageService.removeImage(uid, imageId);
        } catch (apiError) {
          console.error('API error:', apiError);
          // Continue with local removal
        }
        
        // Always update local state
        setImageHistory(prev => prev.filter(img => img.image_id !== imageId));
        
        // Update localStorage history
        const historyJson = localStorage.getItem("imageHistory");
        if (historyJson) {
          try {
            const historyData = JSON.parse(historyJson);
            const updatedHistory = historyData.filter((img: any) => img.image_id !== imageId);
            localStorage.setItem("imageHistory", JSON.stringify(updatedHistory));
          } catch (error) {
            console.error('Error updating localStorage history:', error);
          }
        }
        
        // Also check in downloadedImages
        const storedImagesJson = localStorage.getItem("downloadedImages");
        if (storedImagesJson) {
          try {
            const storedImages = JSON.parse(storedImagesJson);
            const updatedImages = storedImages.filter((img: any) => img.image_id !== imageId);
            localStorage.setItem("downloadedImages", JSON.stringify(updatedImages));
          } catch (error) {
            console.error('Error updating localStorage:', error);
          }
        }
        
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error('Error removing image:', err);
      alert('Failed to remove the image. Please try again.');
      setIsLoading(false);
    }
  };

  // Function to generate images
  const handleGenerateImages = async () => {
    if (!message.trim() || !uid) return;
    
    // If user is not pro and has used all free generations, show pro alert
    if (!isPro && freeGenerationsLeft <= 0) {
      setShowProAlert(true);
      return;
    }

    await fetchAndStoreImages();
  };

  // Function to download image
  const handleDownload = async (imageUrl: string, prompt?: string) => {
    try {
      // Show loading state
      const loadingToast = document.createElement('div');
      loadingToast.className = `fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all`;
      loadingToast.textContent = 'Downloading image...';
      document.body.appendChild(loadingToast);

      // Fetch the image as blob to handle CORS issues
      const response = await fetch(imageUrl, {
        mode: 'cors',
        headers: {
          'Accept': 'image/*',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch image');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with prompt if available
      const timestamp = new Date().getTime();
      const promptPrefix = prompt ? prompt.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_') : 'image';
      link.download = `matrixai_${promptPrefix}_${timestamp}.jpg`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(loadingToast);
      
      // Show success message
      const successToast = document.createElement('div');
      successToast.className = `fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all`;
      successToast.textContent = 'Image downloaded successfully!';
      document.body.appendChild(successToast);
      
      setTimeout(() => {
        if (document.body.contains(successToast)) {
          document.body.removeChild(successToast);
        }
      }, 3000);
      
    } catch (error) {
      console.error('Error downloading image:', error);
      
      // Fallback to simple download
      try {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `matrixai-image-${new Date().getTime()}.jpg`;
        link.target = '_blank';
        link.click();
      } catch (fallbackError) {
        // Show error message
        const errorToast = document.createElement('div');
        errorToast.className = `fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all`;
        errorToast.textContent = 'Failed to download image. Please try right-click and save.';
        document.body.appendChild(errorToast);
        
        setTimeout(() => {
          if (document.body.contains(errorToast)) {
            document.body.removeChild(errorToast);
          }
        }, 5000);
      }
    }
  };

  // Function to share image
  const handleShare = async (imageUrl: string) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'MatrixAI Generated Image',
          url: imageUrl
        });
      } else {
        navigator.clipboard.writeText(imageUrl);
        alert('Image URL copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing image:', error);
    }
  };

  // Load more images from history
  const loadMoreImages = () => {
    if (!isLoading && hasMoreImages) {
      fetchImageHistory(historyPage + 1);
    }
  };

  // Handle sidebar toggle
  const handleSidebarToggle = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
  };

  // Fetch image history on component mount
  useEffect(() => {
    if (uid) {
      fetchImageHistory();
    }
  }, [uid]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar onToggle={handleSidebarToggle} activeLink="/tools/image-generator" />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
       
        
        <div className={`flex-1 overflow-y-auto p-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="max-w-6xl mx-auto">
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
                className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}
              >
                AI Image Generator
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
              >
                Create stunning AI-generated images from text descriptions
              </motion.p>
            </div>
            
            {/* Prompt input */}
            <div className={`mb-6 p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="mb-4">
                <label htmlFor="prompt" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Describe the image you want to generate
                </label>
                <textarea
                  id="prompt"
                  className={`w-full px-4 py-3 rounded-lg ${
                    darkMode 
                      ? 'bg-gray-700 text-white border-gray-600 focus:border-blue-500' 
                      : 'bg-white text-gray-800 border-gray-300 focus:border-blue-600'
                  } border focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                  rows={3}
                  placeholder="A futuristic city with flying cars and neon lights..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center">
                  <label className={`text-sm font-medium mr-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Number of images:
                  </label>
                  <select 
                    value={imageCount}
                    onChange={(e) => setImageCount(parseInt(e.target.value))}
                    disabled={loading}
                    className={`px-3 py-2 rounded-lg ${
                      darkMode 
                        ? 'bg-gray-700 text-white border-gray-600' 
                        : 'bg-white text-gray-800 border-gray-300'
                    } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                  </select>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    disabled={loading}
                    className={`px-4 py-2 rounded-lg flex items-center transition-colors ${
                      loading
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : darkMode
                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                  >
                    <FiList className="mr-2" />
                    <span>History</span>
                  </button>
                </div>
              </div>
              
              {/* Error Display */}
              {error && (
                <div className={`mt-4 p-3 rounded-lg ${darkMode ? 'bg-red-900 border-red-700' : 'bg-red-100 border-red-300'} border`}>
                  <p className={`text-sm ${darkMode ? 'text-red-300' : 'text-red-700'}`}>{error}</p>
                </div>
              )}
              
              {/* Generate Button */}
              <div className="mt-4">
                {loading ? (
                  <div className="space-y-3">
                    <div className={`w-full rounded-full h-2.5 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div 
                        className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${processingProgress}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm flex items-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <FiClock className="mr-1" /> {getStatusText()}
                      </span>
                      <button
                        onClick={cancelGeneration}
                        className={`text-sm flex items-center ${darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-700'}`}
                      >
                        <FiX className="mr-1" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleGenerateImages}
                    disabled={!message.trim() || !uid}
                    className={`w-full py-3 rounded-lg font-medium flex items-center justify-center ${
                      !message.trim() || !uid
                        ? 'bg-gray-300 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                        : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white hover:opacity-90'
                    } transition`}
                  >
                    <FiImage className="mr-2" />
                    Generate Images
                  </button>
                )}
              </div>
              
              {!isPro && (
                <div className={`mt-4 text-sm ${darkMode ? 'text-yellow-300' : 'text-yellow-600'}`}>
                  Free generations remaining: {freeGenerationsLeft}
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
            
            {/* Main content area */}
            {showHistory ? (
              // History View
              <div className={`p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex justify-between items-center mb-6">
                  <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Recent Images</h2>
                  <button
                    onClick={() => setShowHistory(false)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      darkMode
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    Back to Generator
                  </button>
                </div>
                
                {isLoading && imageHistory.length === 0 ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className={`flex space-x-4 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} animate-pulse`}>
                        <div className={`w-24 h-24 rounded-lg ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                        <div className="flex-1 space-y-2">
                          <div className={`h-4 rounded ${darkMode ? 'bg-gray-600' : 'bg-gray-300'} w-3/4`}></div>
                          <div className={`h-3 rounded ${darkMode ? 'bg-gray-600' : 'bg-gray-300'} w-1/2`}></div>
                          <div className={`h-3 rounded ${darkMode ? 'bg-gray-600' : 'bg-gray-300'} w-1/4`}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : historyError ? (
                  <div className={`text-center py-8 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                    <p className="text-lg mb-2">Error loading history</p>
                    <p className="text-sm">{historyError}</p>
                    <button
                      onClick={() => fetchImageHistory(1)}
                      className={`mt-4 px-4 py-2 rounded-lg ${
                        darkMode
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      Retry
                    </button>
                  </div>
                ) : imageHistory.length === 0 ? (
                  <div className={`text-center py-16 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <FiImage className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg">No images generated yet</p>
                    <p className="text-sm mt-2">Generate your first image to see it here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {imageHistory.map((image, index) => (
                      <div 
                        key={image.image_id} 
                        className={`flex space-x-4 p-4 rounded-lg border transition-all hover:shadow-md ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 hover:bg-gray-650' 
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {/* Image Thumbnail */}
                        <div className="flex-shrink-0">
                          <img 
                            src={image.image_url} 
                            alt={image.prompt_text || 'Generated image'} 
                            className="w-24 h-24 object-cover rounded-lg shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => {
                              setImages([image.image_url]);
                              setShowHistory(false);
                            }}
                          />
                        </div>
                        
                        {/* Image Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className={`text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {image.prompt_text || 'Generated Image'}
                              </h3>
                              <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {new Date(image.created_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                              <div className="flex items-center mt-2 space-x-2">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  darkMode
                                    ? 'bg-green-900 text-green-200'
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  Ready
                                </span>
                                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  Image #{imageHistory.length - index}
                                </span>
                              </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex space-x-2 ml-4">
                              <button 
                                onClick={() => {
                                  setImages([image.image_url]);
                                  setShowHistory(false);
                                }}
                                className={`p-2 rounded-lg transition-colors ${
                                  darkMode
                                    ? 'text-blue-400 hover:bg-gray-600'
                                    : 'text-blue-600 hover:bg-blue-50'
                                }`}
                                title="View image"
                              >
                                <FiImage size={16} />
                              </button>
                              <button 
                                onClick={() => handleDownload(image.image_url, image.prompt_text)}
                                className={`p-2 rounded-lg transition-colors ${
                                  darkMode
                                    ? 'text-gray-400 hover:bg-gray-600'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                                title="Download image"
                              >
                                <FiDownload size={16} />
                              </button>
                              <button 
                                onClick={() => handleShare(image.image_url)}
                                className={`p-2 rounded-lg transition-colors ${
                                  darkMode
                                    ? 'text-gray-400 hover:bg-gray-600'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                                title="Share image"
                              >
                                <FiShare2 size={16} />
                              </button>
                              <button 
                                onClick={() => handleRemoveImage(image.image_id)}
                                className={`p-2 rounded-lg transition-colors ${
                                  darkMode
                                    ? 'text-red-400 hover:bg-gray-600'
                                    : 'text-red-600 hover:bg-red-50'
                                }`}
                                title="Remove image"
                              >
                                <FiTrash size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {hasMoreImages && (
                      <div className="text-center pt-4">
                        <button
                          onClick={loadMoreImages}
                          disabled={isLoading}
                          className={`px-6 py-2 rounded-lg transition-colors ${
                            isLoading
                              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                              : darkMode
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-blue-500 text-white hover:bg-blue-600'
                          }`}
                        >
                          {isLoading ? 'Loading...' : 'Load More Images'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              // Generator View
              <div className={`p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                {showSkeleton ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[...Array(imageCount)].map((_, i) => (
                      <div key={i} className={`rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse h-80`}></div>
                    ))}
                  </div>
                ) : images.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {images.map((imageUrl, index) => (
                      <motion.div 
                        key={index} 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`relative group overflow-hidden rounded-lg shadow-md ${darkMode ? 'bg-gray-700' : 'bg-white'}`}
                      >
                        <img 
                          src={imageUrl} 
                          alt={`Generated image ${index + 1}`} 
                          className="w-full h-80 object-cover"
                        />
                        <div className={`absolute inset-0 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-t from-black/80 via-black/40 to-transparent`}>
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleDownload(imageUrl, message)}
                              className="p-2 rounded-full bg-gray-800/80 text-white hover:bg-gray-700"
                            >
                              <FiDownload size={16} />
                            </button>
                            <button 
                              onClick={() => handleShare(imageUrl)}
                              className="p-2 rounded-full bg-gray-800/80 text-white hover:bg-gray-700"
                            >
                              <FiShare2 size={16} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className={`text-center py-16 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <FiImage className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg">Enter a prompt and generate your first image</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageGeneratorPage; 
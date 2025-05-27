import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { FiDownload, FiShare2, FiTrash, FiChevronDown, FiImage, FiRefreshCw } from 'react-icons/fi';
import { Navbar, Sidebar, ProFeatureAlert } from '../components';
import { useUser } from '../context/UserContext';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';

// Define image interface
interface ImageData {
  url: string;
  image_id: string;
  prompt: string;
  created_at: string;
}

const ImageGeneratorPage: React.FC = () => {
  const { userData, isPro } = useUser();
  const { darkMode } = useTheme();
  const uid = userData?.uid || '';

  // State for image generation
  const [message, setMessage] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [imageCount, setImageCount] = useState(4);
  const [showProAlert, setShowProAlert] = useState(false);
  const [freeGenerationsLeft, setFreeGenerationsLeft] = useState(3);
  
  // Animation controls
  const imageOpacity = useAnimation();
  const imageScale = useAnimation();
  
  // Image History states
  const [imageHistory, setImageHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [hasMoreImages, setHasMoreImages] = useState(true);
  const [imagesPerPage] = useState(8);
  const [showHistory, setShowHistory] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
    // In a web app, we'll use localStorage instead of AsyncStorage
    localStorage.removeItem("downloadedImages");
    return true;
  };

  // Function to fetch and generate images
  const fetchAndStoreImages = async () => {
    try {
      // Clear any previously stored images when fetching new ones
      await clearStoredImages();
      
      setLoading(true);
      setShowSkeleton(true);
      
      // Reset animation values
      imageOpacity.set({ opacity: 0 });
      imageScale.set({ scale: 0.95 });
      
      // Create a timeout to detect when network is taking too long
      let apiTimedOut = false;
      const timeoutId = setTimeout(() => {
        apiTimedOut = true;
        generateFallbackImages();
      }, 5000); // Wait 5 seconds before showing fallbacks
      
      try {
        // Only attempt API call if not already timed out
        if (!apiTimedOut) {
          // Make API request to generate new images
          const response = await axios.post(
            "https://ddtgdhehxhgarkonvpfq.supabase.co/functions/v1/generateImage2",
            { 
              text: message, 
              uid: uid,
              imageCount: imageCount 
            },
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkdGdkaGVoeGhnYXJrb252cGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2Njg4MTIsImV4cCI6MjA1MDI0NDgxMn0.mY8nx-lKrNXjJxHU7eEja3-fTSELQotOP4aZbxvmNPY`,
              },
              timeout: 10000 // 10 second timeout
            }
          );
          
          // Clear the timeout since we got a response
          clearTimeout(timeoutId);

          if (response.data && response.data.images && response.data.images.length > 0) {
            const imageData = response.data.images;
            // In a web app, we'll use localStorage instead of AsyncStorage
            localStorage.setItem("downloadedImages", JSON.stringify(imageData));
            setImages(imageData.map((img: any) => img.url));
            
            // Show skeleton for 1 second before revealing the images
            setTimeout(() => {
              setShowSkeleton(false);
              setLoading(false);
              fadeInImage();
            }, 1000);
            
            // Decrease free generations left if user is not pro
            if (!isPro) {
              setFreeGenerationsLeft(prev => Math.max(0, prev - 1));
            }
            
            // Refresh image history
            fetchImageHistory(1);
            return;
          }
        }
      } catch (apiError) {
        // Clear the timeout since we got an error
        clearTimeout(timeoutId);
        console.error("Error from API:", apiError);
        // Continue to fallback
        generateFallbackImages();
        return;
      }
      
      // If we get here, we need to generate fallback images
      generateFallbackImages();
      
    } catch (error) {
      console.error("Error fetching images:", error);
      setLoading(false);
      setShowSkeleton(false);
      alert("Something went wrong. Please try again.");
    }
  };
  
  // Generate offline fallback images
  const generateFallbackImages = () => {
    console.log("Using fallback image generation");
    
    // Create colorful solid colored blocks instead of placeholder.com which needs internet
    const colors = ['3498db', '9b59b6', '2ecc71', 'e74c3c', 'f39c12', '1abc9c', 'd35400', '34495e'];
    
    // Create data URLs for colored blocks with the prompt text
    const placeholderImages = [];
    for (let i = 0; i < imageCount; i++) {
      const color = colors[i % colors.length];
      // Create a data URL for a canvas with the message text
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Fill background
        ctx.fillStyle = `#${color}`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Wrap text if necessary
        const maxWidth = 460;
        const words = message.substring(0, 100).split(' ');
        let line = '';
        const lines = [];
        
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;
          
          if (testWidth > maxWidth && n > 0) {
            lines.push(line);
            line = words[n] + ' ';
          } else {
            line = testLine;
          }
        }
        lines.push(line);
        
        // Draw text lines
        const lineHeight = 30;
        const y = canvas.height / 2 - (lines.length - 1) * lineHeight / 2;
        
        for (let i = 0; i < lines.length; i++) {
          ctx.fillText(lines[i], canvas.width / 2, y + i * lineHeight);
        }
      }
      
      // Convert canvas to data URL
      const dataUrl = canvas.toDataURL('image/png');
      placeholderImages.push(dataUrl);
    }
    
    // Store and display the placeholder images
    const placeholderData = placeholderImages.map((url, idx) => ({
      url,
      image_id: `placeholder-${Date.now()}-${idx}`,
      prompt: message,
      created_at: new Date().toISOString()
    }));
    
    localStorage.setItem("downloadedImages", JSON.stringify(placeholderData));
    setImages(placeholderImages);
    
    // Add to history
    const currentHistory = JSON.parse(localStorage.getItem("imageHistory") || "[]");
    localStorage.setItem("imageHistory", JSON.stringify([...placeholderData, ...currentHistory]));
    
    // Show skeleton for 1 second before revealing the images
    setTimeout(() => {
      setShowSkeleton(false);
      setLoading(false);
      fadeInImage();
    }, 1000);
    
    // Decrease free generations left if user is not pro
    if (!isPro) {
      setFreeGenerationsLeft(prev => Math.max(0, prev - 1));
    }
  };

  // Function to fetch image history
  const fetchImageHistory = async (page = 1) => {
    if (!uid) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Set a timeout for the network request
      let apiTimedOut = false;
      const timeoutId = setTimeout(() => {
        apiTimedOut = true;
        loadLocalHistory();
      }, 3000); // Wait 3 seconds before using local history
      
      if (!apiTimedOut) {
        try {
          const controller = new AbortController();
          const signal = controller.signal;
          
          const response = await fetch(
            `https://matrix-server.vercel.app/getGeneratedImage?uid=${uid}&page=${page}&limit=${imagesPerPage}`,
            {
              headers: {
                'Content-Type': 'application/json'
              },
              signal // Add abort signal
            }
          );
          
          // Clear the timeout since we got a response
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const result = await response.json();
            const newImages = result.data || [];
            
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
            setHasMoreImages(newImages.length >= imagesPerPage);
            setIsLoading(false);
            return;
          } else {
            throw new Error('Server returned an error');
          }
        } catch (apiError) {
          console.error('API error:', apiError);
          // Clear the timeout
          clearTimeout(timeoutId);
          // Continue to fallback
          loadLocalHistory();
          return;
        }
      }
    } catch (err: any) {
      console.error('Error fetching image history:', err);
      setError(err.message || "Failed to load image history");
      loadLocalHistory();
    }
  };
  
  // Load image history from localStorage
  const loadLocalHistory = () => {
    console.log("Using fallback history from localStorage");
    
    // First check for dedicated history in localStorage
    const historyJson = localStorage.getItem("imageHistory");
    if (historyJson) {
      try {
        const historyData = JSON.parse(historyJson);
        setImageHistory(historyData);
        setHasMoreImages(false);
        setIsLoading(false);
        return;
      } catch (parseError) {
        console.error('Error parsing stored history:', parseError);
      }
    }
    
    // Fallback to using the last generated images if available
    const storedImagesJson = localStorage.getItem("downloadedImages");
    if (storedImagesJson) {
      try {
        const storedImages = JSON.parse(storedImagesJson);
        setImageHistory(storedImages);
        setHasMoreImages(false);
      } catch (parseError) {
        console.error('Error parsing stored images:', parseError);
        setImageHistory([]);
        setError("Couldn't load image history. Please try again later.");
      }
    } else {
      // No stored images
      setImageHistory([]);
    }
    
    setIsLoading(false);
  };

  // Function to handle image removal
  const handleRemoveImage = async (imageId: string) => {
    if (!uid || !imageId) return;
    
    try {
      if (window.confirm("Are you sure you want to remove this image?")) {
        setIsLoading(true);
        
        try {
          // Try to remove from server
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
              }),
              // Add timeout with AbortController
              signal: AbortSignal.timeout(5000)
            }
          );
          
          if (!response.ok) {
            throw new Error('Server error');
          }
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
  const handleDownload = (imageUrl: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `matrixai-image-${new Date().getTime()}.jpg`;
    link.click();
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
        <Navbar />
        
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
                    className={`px-3 py-2 rounded-lg ${
                      darkMode 
                        ? 'bg-gray-700 text-white border-gray-600' 
                        : 'bg-white text-gray-800 border-gray-300'
                    } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={4}>4</option>
                    {isPro && (
                      <>
                        <option value={6}>6</option>
                        <option value={8}>8</option>
                      </>
                    )}
                  </select>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className={`px-4 py-2 rounded-lg flex items-center transition-colors ${
                      darkMode
                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                  >
                    <FiImage className="mr-2" />
                    <span>History</span>
                  </button>
                  <button
                    onClick={handleGenerateImages}
                    disabled={loading || !message.trim()}
                    className={`px-6 py-3 rounded-lg font-medium flex items-center justify-center min-w-[150px] ${
                      loading || !message.trim()
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : darkMode
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-700 hover:to-indigo-800'
                        : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
                    }`}
                  >
                    {loading ? (
                      <>
                        <FiRefreshCw className="animate-spin mr-2" />
                        Generating...
                      </>
                    ) : (
                      'Generate Images'
                    )}
                  </button>
                </div>
              </div>
              
              {!isPro && (
                <div className={`mt-4 text-sm ${darkMode ? 'text-yellow-300' : 'text-yellow-600'}`}>
                  Free generations remaining: {freeGenerationsLeft}
                </div>
              )}
            </div>
            
            {/* Main content area */}
            {showHistory ? (
              // History View
              <div className={`p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Image History</h2>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className={`rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse h-60`}></div>
                    ))}
                  </div>
                ) : error ? (
                  <div className={`text-center py-8 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                    {error}
                  </div>
                ) : imageHistory.length === 0 ? (
                  <div className={`text-center py-16 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <FiImage className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg">No images generated yet</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {imageHistory.map((image) => (
                        <div 
                          key={image.image_id} 
                          className={`relative group overflow-hidden rounded-lg shadow-md ${darkMode ? 'bg-gray-700' : 'bg-white'}`}
                        >
                          <img 
                            src={image.url} 
                            alt={image.prompt || 'Generated image'} 
                            className="w-full h-60 object-cover"
                          />
                          <div className={`absolute inset-0 flex flex-col justify-between p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-t from-black/80 via-black/40 to-transparent`}>
                            <div className="self-end">
                              <button 
                                onClick={() => handleRemoveImage(image.image_id)}
                                className="p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                              >
                                <FiTrash size={16} />
                              </button>
                            </div>
                            <div>
                              <p className="text-white text-sm line-clamp-2 mb-2">{image.prompt}</p>
                              <div className="flex space-x-2">
                                <button 
                                  onClick={() => handleDownload(image.url)}
                                  className="p-2 rounded-full bg-gray-800/80 text-white hover:bg-gray-700"
                                >
                                  <FiDownload size={16} />
                                </button>
                                <button 
                                  onClick={() => handleShare(image.url)}
                                  className="p-2 rounded-full bg-gray-800/80 text-white hover:bg-gray-700"
                                >
                                  <FiShare2 size={16} />
                                </button>
                              </div>
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
                          className={`px-6 py-2 rounded-lg ${
                            isLoading
                              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                              : darkMode
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
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
                              onClick={() => handleDownload(imageUrl)}
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
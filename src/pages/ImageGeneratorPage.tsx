import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { FiDownload, FiShare2, FiTrash, FiChevronDown, FiImage, FiRefreshCw, FiList, FiX, FiClock, FiChevronLeft, FiChevronRight, FiUpload } from 'react-icons/fi';
import { ProFeatureAlert, AuthRequiredButton } from '../components';
import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useAlert } from '../context/AlertContext';
import { imageService } from '../services/imageService';
import { uploadImageToStorage } from '../supabaseClient';

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
  const { showAlert, showSuccess, showError, showInfo, showWarning, showConfirmation } = useAlert();
  const uid = user?.id || '';

  // State for image generation
  const [message, setMessage] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [imageCount, setImageCount] = useState(1);
  const [showProAlert, setShowProAlert] = useState(false);
  const [freeGenerationsLeft, setFreeGenerationsLeft] = useState(3);
  
  // Image upload state
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Image generation state
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
  const [imagesPerPage] = useState(10); // Changed to 10 images per page
  const [showHistory, setShowHistory] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [allImageHistory, setAllImageHistory] = useState<ImageHistoryItem[]>([]);






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



  // Function to fetch and generate images using direct API
  const fetchAndStoreImages = async () => {
    try {
      // Clear any previously stored images when fetching new ones
      await clearStoredImages();
      
      setLoading(true);
      setShowSkeleton(true);
      setError(null);
      setGenerationStatus('processing');
      setProcessingProgress(0);
      
      // Reset animation values
      imageOpacity.set({ opacity: 0 });
      imageScale.set({ scale: 0.95 });
      
      // Start progress animation
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          const newProgress = prev + Math.random() * 15;
          return newProgress > 95 ? 95 : newProgress;
        });
      }, 200);
      
      try {
        // Make direct API request to the new endpoint
        const response = await fetch('https://main-matrixai-server-lujmidrakh.cn-hangzhou.fcapp.run/api/image/createImage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid: uid,
            promptText: message,
            imageCount: imageCount
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Image generation response:', result);
        
        // Check if the response indicates an error
        // The API sometimes returns success: false but still has valid images and message
        if (!result.images || result.images.length === 0) {
          throw new Error(result.message || 'Failed to generate images');
        }
        
        // Clear progress interval and set completion
        clearInterval(progressInterval);
        setProcessingProgress(100);
        setGenerationStatus('completed');
        
        // Extract image URLs and update state
        const generatedImageUrls = result.images.map((img: any) => img.imageUrl);
        setImages(generatedImageUrls);
        
        // Store images for history
        const imageData = result.images.map((img: any) => ({
          image_id: img.imageId,
          image_name: img.imageName,
          image_url: img.imageUrl,
          prompt_text: message,
          created_at: new Date().toISOString(),
          url: img.imageUrl
        }));
        
        // Update history
        setImageHistory(prev => [...imageData, ...prev]);
        
        // Store in localStorage
        const existingHistory = JSON.parse(localStorage.getItem("imageHistory") || "[]");
        const updatedHistory = [...imageData, ...existingHistory];
        localStorage.setItem("imageHistory", JSON.stringify(updatedHistory));
        
        // Animate images in
        setTimeout(() => {
          imageOpacity.start({ opacity: 1 });
          imageScale.start({ scale: 1 });
        }, 300);
        
        setLoading(false);
        setShowSkeleton(false);
        
        // Update free generations if not pro
        if (!isPro) {
          setFreeGenerationsLeft(prev => Math.max(0, prev - 1));
        }
        
        // Refresh image history from server
        fetchImageHistory(1);
        
      } catch (apiError: any) {
        console.error("Error from API:", apiError);
        clearInterval(progressInterval);
        
        // Check if the error message indicates success
        if (apiError.message && apiError.message.toLowerCase().includes('successfully')) {
          handleSuccessfulErrorResponse(apiError.message);
        } else {
          setLoading(false);
          setShowSkeleton(false);
          setGenerationStatus('failed');
          setError(apiError.message || "Failed to generate images. Please try again.");
        }
      }
      
    } catch (error: any) {
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
  };

  // Function to get status text
  const getStatusText = () => {
    if (isUploading) {
      return `Uploading image... ${Math.round(uploadProgress)}%`;
    } else if (isEnhancing) {
      return 'Enhancing your image...';
    } else {
      switch (generationStatus) {
        case 'processing':
          return uploadedImage ? 'Processing your image...' : 'Generating images...';
        case 'completed':
          return uploadedImage ? 'Image enhanced successfully!' : 'Images generated successfully!';
        case 'failed':
          return uploadedImage ? 'Image enhancement failed' : 'Image generation failed';
        default:
          return uploadedImage ? 'Preparing to enhance...' : 'Initializing image generation...';
      }
    }
  };
  
  // Add scanning animation style
  useEffect(() => {
    // Add keyframes for scanning animation if not already present
    if (!document.querySelector('#scan-animation')) {
      const style = document.createElement('style');
      style.id = 'scan-animation';
      style.innerHTML = `
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .animate-scan {
          animation: scan 1.5s linear infinite;
        }
      `;
      document.head.appendChild(style);
    }
    
    return () => {
      // Clean up the style element when component unmounts
      const styleElement = document.querySelector('#scan-animation');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);
  
  // Function to handle API responses with success messages in error
  const handleSuccessfulErrorResponse = (errorMessage: string) => {
    console.log('Received successful error response:', errorMessage);
    // Set generation status to completed
    setGenerationStatus('completed');
    // Clear any error messages
    setError(null);
    // Refresh image history
    fetchImageHistory(1);
    // Set loading states to false
    setLoading(false);
    setShowSkeleton(false);
    setProcessingProgress(100);
  };

  // Function to fetch image history
  const fetchImageHistory = async (page = 1) => {
    if (!uid) return;
    
    setIsLoading(true);
    setHistoryError(null);
    
    try {
      // Load all images to support pagination
      const response = await imageService.getImageHistory(uid, page, 100); // Load more images at once
      
      const newImages = response.data || [];
      
      if (page === 1) {
        setAllImageHistory(newImages);
        // Also save to localStorage for offline use
        localStorage.setItem("imageHistory", JSON.stringify(newImages));
      } else {
        const updatedHistory = [...allImageHistory, ...newImages];
        setAllImageHistory(updatedHistory);
        // Update localStorage
        localStorage.setItem("imageHistory", JSON.stringify(updatedHistory));
      }
      
      // Calculate total pages
      // Don't update totalPages or reset to page 1 here
      // This will be handled by the useEffect that watches allImageHistory
      
      // Only update current page images if we're on page 1 or this is a refresh
      if (page === 1) {
        updateCurrentPageImages(1);
      }
      
      setHistoryPage(page);
      setHasMoreImages(newImages.length >= 100);
      setIsLoading(false);
    } catch (err: any) {
      console.error('Error fetching image history:', err);
      setHistoryError(err.message || "Failed to load image history");
      setIsLoading(false);
    }
  };
  
  // Function to update current page images
  const updateCurrentPageImages = (page: number) => {
    setCurrentPage(page);
    const startIndex = (page - 1) * imagesPerPage;
    const endIndex = startIndex + imagesPerPage;
    const paginatedImages = allImageHistory.slice(startIndex, endIndex);
    setImageHistory(paginatedImages);
  };
  
  // Functions for pagination navigation
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      updateCurrentPageImages(currentPage + 1);
    }
  };
  
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      updateCurrentPageImages(currentPage - 1);
    }
  };

  // Function to handle image upload
  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      showError('Please upload an image file');
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('Image size should be less than 5MB');
      return;
    }
    
    // Set the uploaded image
    setUploadedImage(file);
    
    // Create a preview URL
    const previewUrl = URL.createObjectURL(file);
    setUploadedImageUrl(previewUrl);
    
    // Reset any previous errors
    setError(null);
  };
  
  // Function to trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Function to remove uploaded image
  const removeUploadedImage = () => {
    setUploadedImage(null);
    setUploadedImageUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Function to upload image to Supabase and enhance it
  const uploadAndEnhanceImage = async () => {
    if (!uid || !uploadedImage || !message.trim()) return;
    
    try {
      // Start uploading
      setIsUploading(true);
      setUploadProgress(0);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 20;
          return newProgress > 95 ? 95 : newProgress;
        });
      }, 200);
      
      // Upload image to Supabase
      const uploadResult = await uploadImageToStorage(uploadedImage, uid);
      
      // Complete upload progress
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Start enhancing
      setIsEnhancing(true);
      setIsUploading(false);
      setShowSkeleton(true);
      setGenerationStatus('processing');
      setProcessingProgress(0);
      
      // Start progress animation for enhancement
      const enhanceProgressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          const newProgress = prev + Math.random() * 15;
          return newProgress > 95 ? 95 : newProgress;
        });
      }, 200);
      
      // Call the API to enhance the image
      const enhancementResult = await imageService.enhanceImageFromUrl(uid, message, uploadResult.publicUrl);
      
      // Clear progress interval and set completion
      clearInterval(enhanceProgressInterval);
      setProcessingProgress(100);
      setGenerationStatus('completed');
      
      // Update images with the enhanced image
      setImages([enhancementResult.imageUrl]);
      
      // Create image data for history
      const imageData = {
        image_id: enhancementResult.imageId,
        image_name: enhancementResult.imageName,
        image_url: enhancementResult.imageUrl,
        prompt_text: message,
        created_at: new Date().toISOString(),
        url: enhancementResult.imageUrl
      };
      
      // Update history
      setImageHistory(prev => [imageData, ...prev]);
      
      // Store in localStorage
      const existingHistory = JSON.parse(localStorage.getItem("imageHistory") || "[]");
      const updatedHistory = [imageData, ...existingHistory];
      localStorage.setItem("imageHistory", JSON.stringify(updatedHistory));
      
      // Reset states
      setIsEnhancing(false);
      setShowSkeleton(false);
      removeUploadedImage();
      
      // Update free generations if not pro
      if (!isPro) {
        setFreeGenerationsLeft(prev => Math.max(0, prev - 1));
      }
      
      // Refresh image history
      fetchImageHistory(1);
      
    } catch (error: any) {
      console.error('Error enhancing image:', error);
      setIsUploading(false);
      setIsEnhancing(false);
      setShowSkeleton(false);
      setGenerationStatus('failed');
      setError(error.message || 'Failed to enhance image. Please try again.');
    }
  };

  // Function to handle image removal
  const handleRemoveImage = async (imageId: string) => {
    if (!uid || !imageId) return;
    
    // Use confirmation dialog with Yes/No buttons
    showConfirmation(
      "Are you sure you want to remove this image?",
      // onConfirm callback
      async () => {
        try {
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
          
          // Also update allImageHistory for pagination
          setAllImageHistory(prev => prev.filter(img => img.image_id !== imageId));
          
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
          
          // Show success message
          showSuccess("Image removed successfully");
        } catch (error) {
          console.error('Error removing image:', error);
          showError("Failed to remove image");
        } finally {
          setIsLoading(false);
        }
      },
      // onCancel callback
      () => {
        // Do nothing when canceled
      },
      {
        confirmText: "Yes",
        cancelText: "No",
        type: "warning"
      }
    );
  };

  // Function to generate images
  const handleGenerateImages = async () => {
    if (!message.trim() || !uid) return;
    
    // If user is not pro and has used all free generations, show pro alert
    if (!isPro && freeGenerationsLeft <= 0) {
      setShowProAlert(true);
      return;
    }

    try {
      // If there's an uploaded image, enhance it instead of generating new images
      if (uploadedImage) {
        await uploadAndEnhanceImage();
      } else {
        await fetchAndStoreImages();
      }
    } catch (error: any) {
      // If the error message contains "successfully", it's likely not a real error
      // This handles the case where the API returns a success message in the error
      if (error.message && error.message.toLowerCase().includes('successfully')) {
        handleSuccessfulErrorResponse(error.message);
      } else {
        // This is a genuine error, let it propagate
        console.error('Error generating images:', error);
        setError(error.message || 'Failed to generate images');
      }
    }
  };

  // Function to download image
  const handleDownload = async (imageUrl: string, prompt?: string) => {
    try {
      // Show loading state
      showInfo('Downloading image...', 3000);

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
      
      // Show success message
      showSuccess('Image downloaded successfully!');
      
    } catch (error) {
      console.error('Error downloading image:', error);
      
      // Fallback to simple download
      try {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `matrixai-image-${new Date().getTime()}.jpg`;
        link.target = '_blank';
        link.click();
        showSuccess('Image downloaded successfully!');
      } catch (fallbackError) {
        // Show error message
        showError('Failed to download image. Please try right-click and save.');
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
        showSuccess('Image URL copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing image:', error);
      showError('Failed to share image. Please try again.');
    }
  };

  // Load more images from history if needed
  const loadMoreImages = () => {
    if (!isLoading && hasMoreImages) {
      fetchImageHistory(historyPage + 1);
    }
  };
  
  // Check if we need to load more images when navigating to next page
  const checkAndLoadMoreIfNeeded = () => {
    const totalLoadedImages = allImageHistory.length;
    const neededImages = currentPage * imagesPerPage;
    
    if (neededImages > totalLoadedImages && hasMoreImages && !isLoading) {
      loadMoreImages();
    }
  };



  // Update totalPages and current page images when allImageHistory changes
  useEffect(() => {
    const calculatedTotalPages = Math.ceil(allImageHistory.length / imagesPerPage);
    setTotalPages(calculatedTotalPages || 1);
    
    // Update current page images
    updateCurrentPageImages(currentPage);
  }, [allImageHistory, imagesPerPage]);
  
  // Fetch image history on component mount
  useEffect(() => {
    if (uid) {
      fetchImageHistory();
    }
  }, [uid]);
  
  // Refresh image history when generation status changes to completed
  useEffect(() => {
    if (generationStatus === 'completed' && uid) {
      // Short delay to ensure backend has processed the new images
      const refreshTimer = setTimeout(() => {
        fetchImageHistory(1);
      }, 1000);
      
      return () => clearTimeout(refreshTimer);
    }
  }, [generationStatus, uid]);

  return (
    <div className="min-h-screen">
      <div className="flex-1 flex flex-col">
       
        
        <div className={`flex-1 p-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="max-w-6xl mx-auto">
            {showProAlert && (
              <ProFeatureAlert 
                featureName="Unlimited Image Generation"
                onClose={() => setShowProAlert(false)}
              />
            )}
            
            <div className="mb-6 md:mb-8">
              <motion.h1 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-2xl md:text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}
              >
                AI Image Generator
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`text-sm md:text-base ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
              >
                Create stunning AI-generated images from text descriptions
              </motion.p>
            </div>
            
            {/* Prompt input */}
            <div className={`mb-4 md:mb-6 p-4 md:p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              {/* Image Upload Area */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Upload an image to enhance (optional)
                  </label>
                  {uploadedImage && (
                    <button
                      onClick={removeUploadedImage}
                      className={`text-xs flex items-center ${darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-700'}`}
                    >
                      <FiX className="mr-1" /> Remove
                    </button>
                  )}
                </div>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                
                {uploadedImageUrl ? (
                  <div className="relative rounded-lg overflow-hidden mb-3 flex justify-center items-center bg-gray-100 dark:bg-gray-700">
                    <img 
                      src={uploadedImageUrl} 
                      alt="Uploaded image" 
                      className="max-w-full max-h-48 h-auto object-contain rounded-lg"
                      style={{ aspectRatio: '16/9' }}
                    />
                    {isUploading && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50">
                        <div className="w-full max-w-xs px-4">
                          <div className="mb-2 w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-blue-600 h-2.5 rounded-full" 
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                          <p className="text-white text-sm text-center">Uploading... {Math.round(uploadProgress)}%</p>
                        </div>
                      </div>
                    )}
                    {isEnhancing && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50">
                        <div className="w-full max-w-xs px-4">
                          <div className="relative">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-12 h-12 border-l-2 border-r-2 border-purple-500 rounded-full animate-spin animation-delay-150"></div>
                            </div>
                            <div className="h-12"></div>
                          </div>
                          <p className="text-white text-sm text-center mt-2">Enhancing your image...</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <AuthRequiredButton
                    onClick={triggerFileInput}
                    className={`w-full h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center mb-3 transition-colors ${
                      darkMode 
                        ? 'border-gray-600 hover:border-gray-500 text-gray-400' 
                        : 'border-gray-300 hover:border-gray-400 text-gray-600'
                    }`}
                  >
                    <FiUpload className="w-6 h-6 mb-2" />
                    <span className="text-sm">Click to upload an image</span>
                    <span className="text-xs mt-1 text-gray-500">JPG, PNG, GIF (max 5MB)</span>
                  </AuthRequiredButton>
                )}
              </div>
              
              <div className="mb-3 md:mb-4">
                <label htmlFor="prompt" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  {uploadedImage ? 'Describe how to enhance your image' : 'Describe the image you want to generate'}
                </label>
                <textarea
                  id="prompt"
                  className={`w-full px-3 md:px-4 py-2 md:py-3 rounded-lg text-sm md:text-base ${
                    darkMode 
                      ? 'bg-gray-700 text-white border-gray-600 focus:border-blue-500' 
                      : 'bg-white text-gray-800 border-gray-300 focus:border-blue-600'
                  } border focus:ring-2 focus:ring-blue-500 focus:outline-none`}
                  rows={3}
                  placeholder={uploadedImage ? "Make my image look like an anime movie..." : "A futuristic city with flying cars and neon lights..."}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4">
                <div className="flex items-center">
                  <label className={`text-xs md:text-sm font-medium mr-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Number of images:
                  </label>
                  <select 
                    value={uploadedImage ? 1 : imageCount}
                    onChange={(e) => setImageCount(parseInt(e.target.value))}
                    disabled={loading || !!uploadedImage}
                    className={`px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm rounded-lg ${
                      darkMode 
                        ? 'bg-gray-700 text-white border-gray-600' 
                        : 'bg-white text-gray-800 border-gray-300'
                    } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value={1}>1</option>
                    {!uploadedImage && (
                      <>
                        <option value={2}>2</option>
                        <option value={3}>3</option>
                        <option value={4}>4</option>
                      </>
                    )}
                  </select>
                  {uploadedImage && (
                    <span className={`ml-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      (Fixed for image enhancement)
                    </span>
                  )}
                </div>
                <div className="flex mt-2 sm:mt-0">
                  <AuthRequiredButton
                    onClick={() => setShowHistory(!showHistory)}
                    disabled={loading}
                    className={`px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm rounded-lg flex items-center transition-colors w-full sm:w-auto justify-center ${
                      loading
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : darkMode
                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                  >
                    <FiList className="mr-1.5 md:mr-2" />
                    <span>History</span>
                  </AuthRequiredButton>
                </div>
              </div>
              
              {/* Error Display */}
              {error && (
                <div className={`mt-3 md:mt-4 p-2 md:p-3 rounded-lg ${darkMode ? 'bg-red-900 border-red-700' : 'bg-red-100 border-red-300'} border`}>
                  <p className={`text-xs md:text-sm ${darkMode ? 'text-red-300' : 'text-red-700'}`}>{error}</p>
                </div>
              )}
              
              {/* Generate Button */}
              <div className="mt-3 md:mt-4">
                {loading ? (
                  <div className="space-y-2 md:space-y-3">
                    <div className={`w-full rounded-full h-2 md:h-2.5 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div 
                        className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-2 md:h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${processingProgress}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs md:text-sm flex items-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <FiClock className="mr-1" /> {getStatusText()}
                      </span>
                      <button
                        onClick={cancelGeneration}
                        className={`text-xs md:text-sm flex items-center ${darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-700'}`}
                      >
                        <FiX className="mr-1" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <AuthRequiredButton
                    onClick={handleGenerateImages}
                    disabled={!message.trim()}
                    className={`w-full py-2 md:py-3 rounded-lg text-sm md:text-base font-medium flex items-center justify-center ${
                      !message.trim()
                        ? 'bg-gray-300 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                        : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white hover:opacity-90'
                    } transition`}
                  >
                    <FiImage className="mr-1.5 md:mr-2" />
                    {uploadedImage ? 'Enhance Image' : 'Generate Images'}
                  </AuthRequiredButton>
                )}
              </div>
              
              {!isPro && (
                <div className={`mt-3 md:mt-4 text-xs md:text-sm ${darkMode ? 'text-yellow-300' : 'text-yellow-600'}`}>
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
              <div className={`p-4 md:p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-3 sm:gap-0">
                  <h2 className={`text-lg md:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Recent Images</h2>
                  <button
                    onClick={() => setShowHistory(false)}
                    className={`w-full sm:w-auto px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm rounded-lg transition-colors ${
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
                        <div className={`w-24 h-24 rounded-lg ${darkMode ? 'bg-gray-600' : 'bg-gray-300'} aspect-square`}></div>
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
                        className={`flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 p-3 md:p-4 rounded-lg border transition-all hover:shadow-md ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 hover:bg-gray-650' 
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {/* Image Thumbnail */}
                        <div className="flex-shrink-0 mx-auto sm:mx-0 flex justify-center items-center bg-gray-100 dark:bg-gray-600 rounded-lg">
                          <img 
                            src={image.image_url} 
                            alt={image.prompt_text || 'Generated image'} 
                            className="sm:w-20 md:w-24 sm:h-20 md:h-24 object-contain rounded-lg shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
                            style={{ aspectRatio: '16/9' }}
                            onClick={() => {
                              setImages([image.image_url]);
                              setShowHistory(false);
                            }}
                          />
                        </div>
                        
                        {/* Image Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between">
                            <div className="flex-1 min-w-0 text-center sm:text-left">
                              <h3 className={`text-xs md:text-sm font-medium truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
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
                              <div className="flex items-center mt-2 space-x-2 justify-center sm:justify-start">
                                <span className={`inline-flex items-center px-2 py-0.5 md:py-1 rounded-full text-xs font-medium ${
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
                            <div className="flex space-x-2 justify-center sm:justify-end mt-3 sm:mt-0 sm:ml-4">
                              <button 
                                onClick={() => {
                                  setImages([image.image_url]);
                                  setShowHistory(false);
                                }}
                                className={`p-1.5 md:p-2 rounded-lg transition-colors ${
                                  darkMode
                                    ? 'text-blue-400 hover:bg-gray-600'
                                    : 'text-blue-600 hover:bg-blue-50'
                                }`}
                                title="View image"
                              >
                                <FiImage size={14} className="md:w-4 md:h-4" />
                              </button>
                              <button 
                                onClick={() => handleDownload(image.image_url, image.prompt_text)}
                                className={`p-1.5 md:p-2 rounded-lg transition-colors ${
                                  darkMode
                                    ? 'text-gray-400 hover:bg-gray-600'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                                title="Download image"
                              >
                                <FiDownload size={14} className="md:w-4 md:h-4" />
                              </button>
                              <button 
                                onClick={() => handleShare(image.image_url)}
                                className={`p-1.5 md:p-2 rounded-lg transition-colors ${
                                  darkMode
                                    ? 'text-gray-400 hover:bg-gray-600'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                                title="Share image"
                              >
                                <FiShare2 size={14} className="md:w-4 md:h-4" />
                              </button>
                              <button 
                                onClick={() => handleRemoveImage(image.image_id)}
                                className={`p-1.5 md:p-2 rounded-lg transition-colors ${
                                  darkMode
                                    ? 'text-red-400 hover:bg-gray-600'
                                    : 'text-red-600 hover:bg-red-50'
                                }`}
                                title="Remove image"
                              >
                                <FiTrash size={14} className="md:w-4 md:h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Pagination Controls */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0 pt-4">
                      <button
                        onClick={goToPreviousPage}
                        disabled={currentPage <= 1 || isLoading}
                        className={`flex items-center justify-center w-full sm:w-auto px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm rounded-lg transition-colors ${
                          currentPage <= 1 || isLoading
                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                            : darkMode
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                      >
                        <FiChevronLeft className="mr-1" />
                        Previous
                      </button>
                      
                      <div className={`text-xs md:text-sm order-first sm:order-none ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Page {currentPage} of {totalPages}
                      </div>
                      
                      <button
                        onClick={() => {
                          goToNextPage();
                          checkAndLoadMoreIfNeeded();
                        }}
                        disabled={currentPage >= totalPages || isLoading}
                        className={`flex items-center justify-center w-full sm:w-auto px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm rounded-lg transition-colors ${
                          currentPage >= totalPages || isLoading
                            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                            : darkMode
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                      >
                        Next
                        <FiChevronRight className="ml-1" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Generator View
              <div className={`p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                {showSkeleton ? (
                  uploadedImage && uploadedImageUrl ? (
                    // Custom skeleton for image enhancement
                    <div className="grid grid-cols-1 gap-3 md:gap-4">
                      <div className="relative rounded-lg overflow-hidden max-w-md mx-auto" style={{ aspectRatio: '16/9' }}>
                        {/* Display the uploaded image */}
                        <img 
                          src={uploadedImageUrl} 
                          alt="Uploaded image" 
                          className="w-full h-full object-contain"
                          style={{ aspectRatio: '16/9' }}
                        />
                        
                        {/* Scanning animation overlay */}
                        <div className="absolute inset-0 overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/20 to-transparent animate-scan"></div>
                        </div>
                        
                        {/* Light animation */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 animate-gradient-x"></div>
                        
                        {/* Progress indicator */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-1.5 rounded-full transition-all duration-500" 
                              style={{ width: `${processingProgress}%` }}
                            ></div>
                          </div>
                          <p className="text-white text-xs mt-1 text-center">{getStatusText()}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Regular skeleton for image generation
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                      {[...Array(imageCount)].map((_, i) => (
                        <div key={i} className={`relative rounded-lg overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`} style={{ aspectRatio: '16/9' }}>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse transform -skew-x-12 opacity-30"></div>
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 animate-gradient-x"></div>
                        </div>
                      ))}
                    </div>
                  )
                ) : images.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                    {images.map((imageUrl, index) => (
                      <motion.div 
                        key={index} 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`relative group overflow-hidden rounded-lg shadow-md ${darkMode ? 'bg-gray-700' : 'bg-white'}`}
                        style={{ aspectRatio: '16/9' }}
                      >
                        <img 
                          src={imageUrl} 
                          alt={`Generated image ${index + 1}`} 
                          className="w-full h-full object-contain"
                          style={{ aspectRatio: '16/9' }}
                        />
                        <div className={`absolute inset-0 flex flex-col justify-end p-2 md:p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-t from-black/80 via-black/40 to-transparent`}>
                          <div className="flex space-x-1 md:space-x-2">
                            <button 
                              onClick={() => handleDownload(imageUrl, message)}
                              className="p-1.5 md:p-2 rounded-full bg-gray-800/80 text-white hover:bg-gray-700"
                            >
                              <FiDownload size={14} className="md:w-4 md:h-4" />
                            </button>
                            <button 
                              onClick={() => handleShare(imageUrl)}
                              className="p-1.5 md:p-2 rounded-full bg-gray-800/80 text-white hover:bg-gray-700"
                            >
                              <FiShare2 size={14} className="md:w-4 md:h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className={`text-center py-8 md:py-16 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <FiImage className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 opacity-30" />
                    <p className="text-base md:text-lg">Enter a prompt and generate your first image</p>
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
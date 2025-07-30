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
import { useTranslation } from 'react-i18next';
import './ImageGeneratorPage.css';

// Add gradient animation style
const gradientAnimationStyle = document.createElement('style');
gradientAnimationStyle.textContent = `
  @keyframes gradient-x {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  .animate-gradient-x {
    background-size: 200% 200%;
    animation: gradient-x 3s ease infinite;
    background-image: linear-gradient(to right, #ec4899, #eab308, #a855f7);
  }
`;
document.head.appendChild(gradientAnimationStyle);

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
  const { t } = useTranslation();
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
      return `${t('imageGenerator.uploadingImage')} ${Math.round(uploadProgress)}%`;
    } else if (isEnhancing) {
      return t('imageGenerator.enhancingImage');
    } else {
      switch (generationStatus) {
        case 'processing':
          return uploadedImage ? t('imageGenerator.processingImage') : t('imageGenerator.generatingImages');
        case 'completed':
          return uploadedImage ? t('imageGenerator.imageEnhancedSuccess') : t('imageGenerator.imagesGeneratedSuccess');
        case 'failed':
          return uploadedImage ? t('imageGenerator.imageEnhancementFailed') : t('imageGenerator.imageGenerationFailed');
        default:
          return uploadedImage ? t('imageGenerator.preparingToEnhance') : t('imageGenerator.initializingGeneration');
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
      setHistoryError(err.message || t('imageGenerator.failedToLoadHistory'));
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
      showError(t('imageGenerator.pleaseUploadImageFile'));
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError(t('imageGenerator.imageSizeLimit'));
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
      setError(error.message || t('imageGenerator.failedToEnhanceImage'));
    }
  };

  // Function to handle image removal
  const handleRemoveImage = async (imageId: string) => {
    if (!uid || !imageId) return;
    
    // Use confirmation dialog with Yes/No buttons
    showConfirmation(
      t('imageGenerator.confirmRemoveImage'),
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
          showSuccess(t('imageGenerator.imageRemovedSuccess'));
        } catch (error) {
          console.error('Error removing image:', error);
          showError(t('imageGenerator.failedToRemoveImage'));
        } finally {
          setIsLoading(false);
        }
      },
      // onCancel callback
      () => {
        // Do nothing when canceled
      },
      {
        confirmText: t('common.yes'),
        cancelText: t('common.no'),
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
        showSuccess(t('imageGenerator.imageDownloadedSuccess'));
      } catch (fallbackError) {
        // Show error message
        showError(t('imageGenerator.failedToDownloadImage'));
      }
    }
  };

  // Function to share image
  const handleShare = async (imageUrl: string) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: t('imageGenerator.matrixAIGeneratedImage'),
          url: imageUrl
        });
      } else {
        navigator.clipboard.writeText(imageUrl);
        showSuccess(t('imageGenerator.imageUrlCopied'));
      }
    } catch (error) {
      console.error('Error sharing image:', error);
      showError(t('imageGenerator.failedToShareImage'));
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Black background with fixed height */}
      
      {/* Gradient overlay with the same fixed height */}
      <div className="absolute inset-0 bg-black z-0"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 via-transparent to-purple-900/30 z-0"></div>
      
      
      {/* Subtle gradient from bottom to create a fade to black effect */}
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black via-black/80 to-transparent z-0"></div>
      
      {/* Subtle grid lines with animation - same fixed height */}
      <div className="absolute inset-x-0 top-0 h-[600px] opacity-10 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] animate-gridMove"></div>
      
      <div className="flex-1 flex flex-col relative z-10">
          
          <div className="flex-1 p-0">
          <div className="max-w-7xl mx-auto pt-8 md:pt-10">
            {showProAlert && (
              <ProFeatureAlert 
                featureName="Unlimited Image Generation"
                onClose={() => setShowProAlert(false)}
              />
            )}
            
            <div className="mb-6 md:mb-8 px-4 md:px-6 text-left ml-3 mt-[-10px]">
              <motion.h1 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-yellow-500 to-purple-500 animate-gradient-x"
              >
                {t('imageGenerator.title')}
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-gray-500 dark:text-gray-400"
              >
                {t('imageGenerator.description')}
              </motion.p>
            </div>
            
            {/* Main content with two-column layout */}
            <div className="flex flex-col lg:flex-row gap-6 px-4 md:px-6 pb-6 md:pb-8">
              {/* Left Column - Controls */}
              <div className="lg:w-2/5 p-4 md:p-6 rounded-lg shadow-lg glass-effect ml-3 mt-[-2px]">
                {/* Image Upload Area */}
                <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-200">
                    {t('imageGenerator.uploadImageOptional')}
                  </label>
                  {uploadedImage && (
                    <button
                      onClick={removeUploadedImage}
                      className="text-xs flex items-center text-red-400 hover:text-red-300"
                    >
                      <FiX className="mr-1" /> {t('common.remove')}
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
                          <p className="text-white text-sm text-center">{t('imageGenerator.uploading')} {Math.round(uploadProgress)}%</p>
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
                          <p className="text-white text-sm text-center mt-2">{t('imageGenerator.enhancingImage')}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <AuthRequiredButton
                    onClick={triggerFileInput}
                    className="w-full h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center mb-3 transition-colors border-gray-600 hover:border-indigo-500 text-gray-400 bg-gray-800/30 backdrop-blur-sm"
                  >
                    <FiUpload className="w-6 h-6 mb-2" />
                    <span className="text-sm">{t('imageGenerator.clickToUpload')}</span>
                    <span className="text-xs mt-1 text-gray-500">{t('imageGenerator.fileFormats')}</span>
                  </AuthRequiredButton>
                )}
              </div>
              
              <div className="mb-3 md:mb-4">
                <label htmlFor="prompt" className="block text-sm font-medium mb-2 text-gray-200">
                  {uploadedImage ? t('imageGenerator.describeEnhancement') : t('imageGenerator.describeImage')}
                </label>
                <textarea
                  id="prompt"
                  className="w-full px-3 md:px-4 py-2 md:py-3 rounded-lg text-sm md:text-base bg-gray-800/70 text-white border-gray-700 focus:border-indigo-500 border focus:ring-2 focus:ring-indigo-500 focus:outline-none backdrop-blur-sm"
                  rows={3}
                  placeholder={uploadedImage ? t('imageGenerator.enhancementPlaceholder') : t('imageGenerator.generationPlaceholder')}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
              
              <div className="mb-4">
                <div className="flex items-center">
                  <label className="text-xs md:text-sm font-medium mr-2 text-gray-200">
                    {t('imageGenerator.numberOfImages')}
                  </label>
                  <select 
                    value={uploadedImage ? 1 : imageCount}
                    onChange={(e) => setImageCount(parseInt(e.target.value))}
                    disabled={loading || !!uploadedImage}
                    className="px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm rounded-lg bg-gray-800/70 text-white border-gray-700 border focus:outline-none focus:ring-2 focus:ring-indigo-500 backdrop-blur-sm"
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
                    <span className="ml-2 text-xs text-gray-400">
                      {t('imageGenerator.fixedForEnhancement')}
                    </span>
                  )}
                </div>
              </div>
             
              
              {/* Error Display */}
              {error && (
                <div className="mt-3 md:mt-4 p-2 md:p-3 rounded-lg bg-red-900/50 border-red-700/50 border backdrop-blur-sm">
                  <p className="text-xs md:text-sm text-red-300">{error}</p>
                </div>
              )}
              
              {/* Generate Button */}
              <div className="mt-3 md:mt-4">
                {loading ? (
                  <div className="space-y-2 md:space-y-3">
                    <div className="w-full rounded-full h-2 md:h-2.5 bg-gray-800/70">
                      <div 
                        className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-2 md:h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${processingProgress}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm flex items-center text-gray-400">
                        <FiClock className="mr-1" /> {getStatusText()}
                      </span>
                      <button
                        onClick={cancelGeneration}
                        className="text-xs md:text-sm flex items-center text-red-400 hover:text-red-300"
                      >
                        <FiX className="mr-1" /> {t('common.cancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <AuthRequiredButton
                    onClick={handleGenerateImages}
                    disabled={!message.trim()}
                    className={`w-full py-2 md:py-3 rounded-lg text-sm md:text-base font-medium flex items-center justify-center ${
                      !message.trim()
                        ? 'bg-gray-800/50 text-gray-500'
                        : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white hover:opacity-90 shadow-lg shadow-indigo-500/20'
                    } transition backdrop-blur-sm`}
                  >
                    <FiImage className="mr-1.5 md:mr-2" />
                    {uploadedImage ? t('imageGenerator.enhanceImage') : t('imageGenerator.generateImages')}
                  </AuthRequiredButton>
                )}
              </div>
              
              {!isPro && (
                <div className="mt-3 md:mt-4 text-xs md:text-sm text-yellow-300">
                  {t('imageGenerator.freeGenerationsRemaining')}: {freeGenerationsLeft}
                  {freeGenerationsLeft === 0 && (
                    <button 
                      onClick={() => setShowProAlert(true)}
                      className="ml-2 text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      {t('common.upgradeToPro')}
                    </button>
                  )}
                </div>
              )}
              
              {/* History Toggle Button */}
              <div className="mt-4">
                <AuthRequiredButton
                  onClick={() => setShowHistory(!showHistory)}
                  disabled={loading}
                  className={`px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm rounded-lg flex items-center transition-colors w-full justify-center ${
                    loading
                      ? 'bg-gray-700/50 text-gray-400 cursor-not-allowed'
                      : showHistory
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20'
                        : 'bg-gray-800/70 text-white hover:bg-gray-700/90 backdrop-blur-sm border border-gray-700/50'
                  }`}
                >
                  <FiList className="mr-1.5 md:mr-2" />
                  <span>{showHistory ? t('imageGenerator.backToGenerator') : t('imageGenerator.viewHistory')}</span>
                </AuthRequiredButton>
              </div>
              
              {/* Quick Prompts */}
              {!showHistory && (
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2 text-gray-200">
                    {t('imageGenerator.quickPrompts')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      t('imageGenerator.quickPrompt1'),
                      t('imageGenerator.quickPrompt2'),
                      t('imageGenerator.quickPrompt3'),
                      t('imageGenerator.quickPrompt4')
                    ].map((prompt, index) => (
                      <button
                        key={index}
                        onClick={() => setMessage(prompt)}
                        className="px-3 py-2 text-xs rounded-lg bg-gray-800/70 text-white hover:bg-gray-700/90 backdrop-blur-sm border border-gray-700/50 transition-colors text-left truncate"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Right Column - Image Display */}
            <div className="lg:w-3/5 flex justify-center">
              {/* Add animated border effect */}
              <div className="relative rounded-lg overflow-hidden w-full max-w-2xl h-[600px]">
                {/* Colorful border using gradient background without purple */}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500 to-pink-500 animate-gradient-x p-[6px]"></div>
                
                {/* Main content area */}
                <div className="relative glass-effect rounded-lg overflow-hidden h-full">
                {showHistory ? (
              // History View
                <div className="p-4 md:p-6 h-[600px] overflow-y-auto">
                <div className="mb-4 md:mb-6">
                    <h2 className="text-lg md:text-xl font-bold text-white">{t('imageGenerator.recentImages')}</h2>
                  </div>
                
                {isLoading && imageHistory.length === 0 ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex space-x-4 p-4 rounded-lg bg-gray-800/50 animate-pulse border border-gray-700/30">
                        <div className="w-24 h-24 rounded-lg bg-gray-700/70 aspect-square"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 rounded bg-gray-700/70 w-3/4"></div>
                          <div className="h-3 rounded bg-gray-700/70 w-1/2"></div>
                          <div className="h-3 rounded bg-gray-700/70 w-1/4"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : historyError ? (
                  <div className="text-center py-8 text-red-400">
                    <p className="text-lg mb-2">{t('imageGenerator.errorLoadingHistory')}</p>
                    <p className="text-sm">{historyError}</p>
                    <button
                      onClick={() => fetchImageHistory(1)}
                      className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
                    >
                      {t('common.retry')}
                    </button>
                  </div>
                ) : imageHistory.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <FiImage className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg">{t('imageGenerator.noImagesYet')}</p>
                    <p className="text-sm mt-2">{t('imageGenerator.generateFirstImage')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {imageHistory.map((image, index) => (
                      <div 
                        key={image.image_id} 
                        className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 p-3 md:p-4 rounded-lg border transition-all hover:shadow-md bg-gray-800/50 border-gray-700/50 hover:bg-gray-700/60 backdrop-blur-sm"
                      >
                        {/* Image Thumbnail */}
                        <div className="relative flex-shrink-0 mx-auto sm:mx-0 flex justify-center items-center bg-gray-700/70 rounded-lg group">
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
                          {/* Cross button for removing image from history */}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage(image.image_id);
                            }}
                            className="absolute -top-1 -right-1 p-1 rounded-full bg-red-600/80 text-white hover:bg-red-700/90 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                            title="Remove image"
                          >
                            <FiX size={10} />
                          </button>
                        </div>
                        
                        {/* Image Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between">
                            <div className="flex-1 min-w-0 text-center sm:text-left">
                              <h3 className="text-xs md:text-sm font-medium truncate text-white">
                                {image.prompt_text || t('imageGenerator.generatedImage')}
                              </h3>
                              <p className="text-xs mt-1 text-gray-400">
                                {new Date(image.created_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                              <div className="flex items-center mt-2 space-x-2 justify-center sm:justify-start">
                                <span className="inline-flex items-center px-2 py-0.5 md:py-1 rounded-full text-xs font-medium bg-green-900/70 text-green-200">
                                  {t('imageGenerator.ready')}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {t('imageGenerator.imageNumber', { number: imageHistory.length - index })}
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
                                className="p-1.5 md:p-2 rounded-lg transition-colors text-indigo-400 hover:bg-gray-700/70"
                                title={t('imageGenerator.viewImage')}
                              >
                                <FiImage size={14} className="md:w-4 md:h-4" />
                              </button>
                              <button 
                                onClick={() => handleDownload(image.image_url, image.prompt_text)}
                                className="p-1.5 md:p-2 rounded-lg transition-colors text-gray-400 hover:bg-gray-700/70"
                                title={t('imageGenerator.downloadImage')}
                              >
                                <FiDownload size={14} className="md:w-4 md:h-4" />
                              </button>
                              <button 
                                onClick={() => handleShare(image.image_url)}
                                className="p-1.5 md:p-2 rounded-lg transition-colors text-gray-400 hover:bg-gray-700/70"
                                title={t('imageGenerator.shareImage')}
                              >
                                <FiShare2 size={14} className="md:w-4 md:h-4" />
                              </button>
                              <button 
                                onClick={() => handleRemoveImage(image.image_id)}
                                className="p-1.5 md:p-2 rounded-lg transition-colors text-red-400 hover:bg-gray-700/70"
                                title={t('imageGenerator.removeImage')}
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
                            ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20'
                        }`}
                      >
                        <FiChevronLeft className="mr-1" />
                        {t('common.previous')}
                      </button>
                      
                      <div className="text-xs md:text-sm order-first sm:order-none text-gray-300">
                        {t('common.pageOf', { current: currentPage, total: totalPages })}
                      </div>
                      
                      <button
                        onClick={() => {
                          goToNextPage();
                          checkAndLoadMoreIfNeeded();
                        }}
                        disabled={currentPage >= totalPages || isLoading}
                        className={`flex items-center justify-center w-full sm:w-auto px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm rounded-lg transition-colors ${
                          currentPage >= totalPages || isLoading
                            ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20'
                        }`}
                      >
                        {t('common.next')}
                        <FiChevronRight className="ml-1" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Generator View
              <div className="p-6 rounded-lg shadow-lg bg-black backdrop-blur-md h-[600px] overflow-hidden">
                {showSkeleton ? (
                  uploadedImage && uploadedImageUrl ? (
                    // Custom skeleton for image enhancement
                    <div className="grid grid-cols-1 gap-3 md:gap-4">
                      <div className="relative rounded-lg overflow-hidden max-w-md mx-auto" style={{ aspectRatio: '16/9' }}>
                        {/* Display the uploaded image */}
                        <img 
                          src={uploadedImageUrl} 
                          alt={t('imageGenerator.uploadedImage')} 
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
                    <div className={`grid ${imageCount === 1 ? 'grid-cols-1' : imageCount === 2 ? 'grid-cols-2' : imageCount === 3 ? 'grid-cols-3' : 'grid-cols-2'} gap-3 md:gap-4 p-4 md:p-6 h-full`}>
                      {[...Array(imageCount)].map((_, i) => (
                        <div key={i} className="relative rounded-lg overflow-hidden bg-gray-800/70 aspect-square">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse transform -skew-x-12 opacity-30"></div>
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 animate-gradient-x"></div>
                        </div>
                      ))}
                    </div>
                  )
                ) : images.length > 0 ? (
                  <div className="flex items-center justify-center h-full p-4 md:p-6">
                    <div className={`grid ${images.length === 1 ? 'grid-cols-1' : images.length === 2 ? 'grid-cols-2' : images.length === 3 ? 'grid-cols-3' : 'grid-cols-2 md:grid-cols-2'} gap-3 md:gap-4 max-w-4xl`}>
                      {images.map((imageUrl, index) => (
                        <motion.div 
                          key={index} 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="relative group overflow-hidden rounded-lg shadow-md bg-gray-800/70 border border-gray-700/30 aspect-square"
                        >
                          <img 
                            src={imageUrl} 
                            alt={t('imageGenerator.generatedImageAlt', { number: index + 1 })} 
                            className="w-full h-full object-cover"
                          />
                          {/* Cross button for removing image */}
                          <button 
                            onClick={() => {
                              const updatedImages = images.filter((_, i) => i !== index);
                              setImages(updatedImages);
                            }}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-red-600/80 text-white hover:bg-red-700/90 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                            title="Remove image"
                          >
                            <FiX size={14} />
                          </button>
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
                  </div>
                ) : (
                  <div className="text-center text-gray-400 h-[600px] flex flex-col items-center justify-center p-4 md:p-6 bg-gray-900/30 backdrop-blur-md overflow-hidden border border-gray-700/30">
                    <FiImage className="w-16 h-16 md:w-20 md:h-40 mx-auto mb-4 md:mb-5 opacity-30" />
                    <p className="text-base md:text-lg max-w-xs">{t('imageGenerator.enterPromptToGenerate')}</p>
                  </div>
                )}
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
      
       </div>
        </div>
         </div>
    </div>
  );
};

export default ImageGeneratorPage;
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import imageCompression from 'browser-image-compression';
import { FiVideo, FiUpload, FiPlay, FiPause, FiDownload, FiSliders, FiPlus, FiTrash, FiX, FiCheck, FiClock, FiList, FiVolume2, FiVolumeX, FiMaximize, FiMinimize, FiLoader, FiImage, FiLock } from 'react-icons/fi';
import { ProFeatureAlert, AuthRequiredButton } from '../components';
import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAlert } from '../context/AlertContext';
import { videoService } from '../services/videoService';
import { userService } from '../services/userService';
import { uploadImageToStorage, supabase } from '../supabaseClient';
import coinImage from '../assets/coin.png';

// Add CSS for animated gradient border
const gradientAnimationStyle = document.createElement('style');
gradientAnimationStyle.innerHTML = `
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

interface VideoHistoryItem {
  videoId: string;
  promptText: string;
  size: string;
  taskId: string;
  taskStatus: string;
  statusDisplay: string;
  isReady: boolean;
  hasVideo: boolean;
  videoUrl?: string; // Make videoUrl optional to match the enhanced API response
  createdAt: string;
  ageDisplay: string;
  apiType: string;
  requestId?: string; // Make optional to match enhanced API
  submitTime?: string; // Make optional to match enhanced API
  scheduledTime?: string; // Make optional to match enhanced API
  endTime?: string; // Make optional to match enhanced API
  template?: string; // Template name if template-based generation was used
  origPrompt?: string; // Make optional to match enhanced API
  actualPrompt?: string; // Make optional to match enhanced API
  imageUrl?: string;
  ratio?: string;
  duration?: string;
  videoStyle?: string;
  negative_prompt?: string; // Add negative prompt field
  error_message?: string; // Error message from API if video generation failed
}

interface TemplateVideo {
  id: string;
  name: string;
  videoUrl: string;
  thumbnailUrl?: string;
  category: 'basic' | 'premium';
  description?: string;
}

const VideoCreatorPage: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { userData, isPro } = useUser();
  const { user } = useAuth();
  const { t } = useLanguage();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { darkMode } = useTheme();
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [duration, setDuration] = useState(5);
  const [resolution, setResolution] = useState('720p');
  const [isPlaying, setIsPlaying] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [style, setStyle] = useState('cinematic');
  const [template, setTemplate] = useState('flying');
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [showProAlert, setShowProAlert] = useState(false);
  const [freeGenerationsLeft, setFreeGenerationsLeft] = useState(1);
  const [presetPrompts, setPresetPrompts] = useState([
    'A timelapse of a bustling city from day to night',
    'A drone shot flying over majestic mountains with snow caps',
    'An animation of a futuristic city with flying vehicles',
    'A nature scene with animals in a forest'
  ]);
  
  // Video generation state
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  // History state
  const [showHistory, setShowHistory] = useState(false);
  const [videoHistory, setVideoHistory] = useState<VideoHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyPage, setHistoryPage] = useState<number>(1);
  const [hasMoreHistory, setHasMoreHistory] = useState<boolean>(true);
  const [isLoadingMoreHistory, setIsLoadingMoreHistory] = useState<boolean>(false);
  const [totalPages, setTotalPages] = useState<number>(1);
  const historyItemsPerPage = 20; // Number of items to load per page
  const [generateButtonClicked, setGenerateButtonClicked] = useState(false);
  
  // Template state
  const [templateVideos, setTemplateVideos] = useState<TemplateVideo[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showTemplateGrid, setShowTemplateGrid] = useState(false);
  const [templateCategory, setTemplateCategory] = useState<'basic' | 'premium'>('basic');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Style options for video

  
  // Template options for image-to-video
  const templateOptions = [
    { id: 'flying', name: 'Flying' },
    { id: 'zoom', name: 'Zoom In' },
    { id: 'pan', name: 'Panning' },
    { id: 'rotate', name: 'Rotation' },
    { id: 'dolly', name: 'Dolly Zoom' },
    { id: 'none', name: 'No Motion' },
  ];
  
  // Fetch template videos from Supabase storage
  const fetchTemplateVideos = useCallback(async () => {
    setIsLoadingTemplates(true);
    try {
      // List all files in the user-uploads/important folder
      const { data: files, error } = await supabase.storage
        .from('user-uploads')
        .list('important', {
          limit: 100,
          sortBy: { column: 'name', order: 'asc' }
        });
      
      if (error) {
        console.error('Error fetching template videos:', error);
        return;
      }
      
      if (!files) {
        console.log('No template videos found');
        return;
      }
      
      // Filter video files and create template objects
      const videoFiles = files.filter(file => 
        file.name.toLowerCase().endsWith('.mp4') || 
        file.name.toLowerCase().endsWith('.mov') ||
        file.name.toLowerCase().endsWith('.webm')
      );
      
      const templates: TemplateVideo[] = videoFiles.map((file, index) => {
        const { data: { publicUrl } } = supabase.storage
          .from('user-uploads')
          .getPublicUrl(`important/${file.name}`);
        
        // Determine category based on file name or index
        // Check if the template name matches any of the premium templates
        const premiumTemplates = ['dance1', 'dance2', 'dance3', 'mermaid', 'graduation', 'dragon', 'money'];
        const templateId = file.name.replace(/\.(mp4|mov|webm)$/i, '');
        const category: 'basic' | 'premium' = premiumTemplates.includes(templateId) ? 'premium' : 'basic';
        
        // Extract template name from filename (remove extension and format)
        const templateName = file.name
          .replace(/\.(mp4|mov|webm)$/i, '')
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
        
        return {
          id: file.name.replace(/\.(mp4|mov|webm)$/i, ''),
          name: templateName,
          videoUrl: publicUrl,
          category,
          description: `${templateName} template animation`
        };
      });
      
      setTemplateVideos(templates);
    } catch (error) {
      console.error('Error fetching template videos:', error);
    } finally {
      setIsLoadingTemplates(false);
    }
  }, []);
  
  // Resolution options
  const resolutionOptions = [
    { id: '480p', name: '480p (SD)', width: 854, height: 480 },
    { id: '720p', name: '720p (HD)', width: 1280, height: 720 },
    { id: '1080p', name: '1080p (Full HD)', width: 1920, height: 1080 },
  ];

  // Transform API video data to match VideoHistoryItem interface
  // This is used for the regular API response
  const transformVideoData = useCallback((apiVideo: any): VideoHistoryItem => {
    // Format date properly - handle different date formats from API
    const formatDate = (dateStr: string) => {
      if (!dateStr) return 'Unknown';
      try {
        // Handle different date formats
        // ISO format: 2025-07-18T23:41:13.702
        // Standard format: 2025-07-19 07:41:14.382
        const date = new Date(dateStr);
        
        // Check if date is valid before formatting
        if (isNaN(date.getTime())) {
          return 'Unknown';
        }
        
        // Get current time in client's system
        const now = new Date();
        
        // Calculate time difference in milliseconds
        // This uses the client's system time but maintains the same relative difference
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        // For recently created videos, show more precise time
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
        if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
        
        // Fall back to date format using China timezone (UTC+8)
        return date.toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: 'Asia/Shanghai' // Explicitly use China timezone
        }) + ' (China time)';
      } catch (e) {
        console.warn('Error parsing date:', dateStr, e);
        return 'Unknown';
      }
    };

    // Format status for display
    const getStatusDisplay = (status: string) => {
      if (!status) return 'Unknown';
      
      // Normalize status to uppercase for consistent comparison
      const normalizedStatus = status.toUpperCase();
      
      switch(normalizedStatus) {
        case 'SUCCEEDED':
        case 'COMPLETED':
          return 'Ready';
        case 'RUNNING':
        case 'GENERATING':
          return 'Processing';
        case 'PENDING':
        case 'QUEUED':
          return 'Queued';
        case 'FAILED':
          return 'Failed';
        default:
          return status;
      }
    };
    
    // Handle both camelCase and snake_case API responses
    return {
      videoId: apiVideo.videoId || apiVideo.video_id,
      promptText: apiVideo.promptText || apiVideo.prompt_text,
      size: apiVideo.size || '1280*720',
      taskId: apiVideo.taskId || apiVideo.task_id || '',
      taskStatus: apiVideo.taskStatus || apiVideo.task_status || 'unknown',
      statusDisplay: getStatusDisplay(apiVideo.status === 'completed' ? 'SUCCEEDED' : (apiVideo.taskStatus || apiVideo.task_status || 'unknown')),
      isReady: (apiVideo.taskStatus || apiVideo.task_status) === 'SUCCEEDED' || apiVideo.status === 'completed',
      hasVideo: !!(apiVideo.videoUrl || apiVideo.video_url),
      videoUrl: apiVideo.videoUrl || apiVideo.video_url || '',
      createdAt: apiVideo.createdAt || apiVideo.created_at,
      ageDisplay: formatDate(apiVideo.createdAt || apiVideo.created_at),
      apiType: apiVideo.apiType || 'video',
      requestId: apiVideo.requestId || apiVideo.request_id || '',
      submitTime: apiVideo.submitTime || apiVideo.submit_time || apiVideo.createdAt || apiVideo.created_at,
      scheduledTime: apiVideo.scheduledTime || apiVideo.scheduled_time || '',
      endTime: apiVideo.endTime || apiVideo.end_time || '',
      origPrompt: apiVideo.origPrompt || apiVideo.prompt_text,
      actualPrompt: apiVideo.actualPrompt || apiVideo.prompt_text || '',
      imageUrl: apiVideo.imageUrl || apiVideo.image_url,
      ratio: apiVideo.ratio,
      duration: apiVideo.duration,
      videoStyle: apiVideo.videoStyle || apiVideo.video_style,
      template: apiVideo.template || apiVideo.templateName || '',
      error_message: apiVideo.error_message || apiVideo.errorMessage || ''
    };
  }, []);
  
  const fetchVideoHistory = useCallback(async (page = 1, append = false) => {
    if (!user?.id) return;
    
    if (page === 1) {
      setIsLoadingHistory(true);
    } else {
      setIsLoadingMoreHistory(true);
    }
    setHistoryError(null);
    
    try {
      // Use the POST method API endpoint with pagination parameters
      const response = await videoService.getAllVideos(user.id, page, historyItemsPerPage);
      
      // Check if response has videos array
      if (!response.videos || !Array.isArray(response.videos)) {
        throw new Error('Invalid response format: missing videos array');
      }
      
      // Transform the video data to match our interface
      const transformedVideos = response.videos.map(transformVideoData);
      
      // Use pagination info from the API response
      console.log('Debug pagination from API:', { 
        page, 
        currentPage: response.currentPage,
        totalItems: response.totalItems,
        totalPages: response.totalPages,
        itemsPerPage: response.itemsPerPage,
        hasNextPage: response.pagination?.hasNextPage,
        hasPreviousPage: response.pagination?.hasPreviousPage
      });
      
      // Set pagination states based on API response
      setHasMoreHistory(!!response.pagination?.hasNextPage);
      setTotalPages(response.totalPages || 1);
      
      // Update state based on whether we're appending or replacing
      if (append) {
        setVideoHistory(prevHistory => [...prevHistory, ...transformedVideos]);
      } else {
        setVideoHistory(transformedVideos);
      }
    } catch (err: any) {
      console.error('Error fetching video history:', err);
      setHistoryError(err.message || 'Failed to fetch video history');
      if (!append) {
        setVideoHistory([]);
      }
    } finally {
      if (page === 1) {
        setIsLoadingHistory(false);
      } else {
        setIsLoadingMoreHistory(false);
      }
    }
  }, [user?.id, transformVideoData, historyItemsPerPage]);

  // Fetch video history when component mounts or when history is toggled
  useEffect(() => {
    if (showHistory && user?.id) {
      // Reset pagination when showing history
      setHistoryPage(1);
      // Don't set hasMoreHistory here, let fetchVideoHistory determine it
      // Fetch video history for the current user
      fetchVideoHistory(1, false);
    }
  }, [showHistory, user?.id, fetchVideoHistory]);
  
  // Function to load more history items
  const loadMoreHistory = useCallback(() => {
    if (isLoadingMoreHistory || !hasMoreHistory) return;
    
    const nextPage = historyPage + 1;
    setHistoryPage(nextPage);
    fetchVideoHistory(nextPage, false); // Changed from true to false to replace instead of append
  }, [historyPage, isLoadingMoreHistory, hasMoreHistory, fetchVideoHistory]);
  
  // Fetch template videos when component mounts
  useEffect(() => {
    fetchTemplateVideos();
  }, [fetchTemplateVideos]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Any cleanup needed
    };
  }, []);

  // Initialize negative prompt with default value
  useEffect(() => {
    // Set default negative prompt to "no blur" if it's empty
    if (!negativePrompt || negativePrompt.trim() === "") {
      setNegativePrompt("no blur");
    }
  }, [negativePrompt]);
  
  // Handle template selection
  const handleTemplateSelect = (templateName: string) => {
    setSelectedTemplate(templateName);
    
    // Find the template by name and set the template ID
    const templateObj = templateVideos.find(t => t.name === templateName);
    if (templateObj) {
      setTemplate(templateObj.id);
    }
    
    setShowTemplateGrid(false);
    // Clear prompt when using template-based generation
    setPrompt('');
    // Set default negative prompt
    setNegativePrompt('no blur');
  };
  
  // Filter templates by category
  const getFilteredTemplates = () => {
    return templateVideos.filter(template => template.category === templateCategory);
  };
  
  // Check if user can access premium templates
  const canAccessPremium = () => {
    return isPro; // Only pro users can access premium templates
  };

  const handleGenerateVideo = async () => {
    if (!user?.id) return;
    
    // Disable the button to prevent multiple clicks
    setGenerateButtonClicked(true);
    
    // For image upload, we need to check if we have a valid option selected
    if (uploadedImageUrl) {
      // For template-based generation, we need a template
      if (template) {
        if (template.trim() === '') {
          setError('Please select a template for template-based generation');
          setGenerateButtonClicked(false);
          return;
        }
        // Template-based generation doesn't need a prompt
      } else {
        // For Text-to-Video with Negative Prompt option
        // Negative prompt is now optional
        if (!prompt || prompt.trim() === '') {
          setError('Please enter a prompt when using text-to-video option');
          setGenerateButtonClicked(false);
          return;
        }
      }
    } else {
      // For regular text-to-video (no image), we need a prompt
      if (!prompt.trim()) {
        setError('Please enter a prompt to generate a video');
        setGenerateButtonClicked(false);
        return;
      }
    }
    
    // Determine if this is a premium template generation
    const isPremiumTemplate = selectedTemplate && templateVideos.find(t => t.name === selectedTemplate)?.category === 'premium';
    
    // If user is not pro and has used all free generations, show pro alert
    if (!isPro && freeGenerationsLeft <= 0) {
      setShowProAlert(true);
      setGenerateButtonClicked(false);
      return;
    }
    
    // Deduct coins - 70 for premium templates, 25 for regular
    const coinCost = isPremiumTemplate ? 70 : 25;
    try {
      await userService.subtractCoins(user.id, coinCost, 'video_generation');
      console.log(`Coins deducted successfully: ${coinCost}`);
    } catch (error) {
      console.error('Error deducting coins:', error);
      setError('Failed to deduct coins. Please try again.');
      setIsGenerating(false);
      setGenerateButtonClicked(false);
      return;
    }
    
    setIsGenerating(true);
    setProcessingProgress(0);
    setError(null);
    setApiError(null);
    setVideoUrl(null);
    setCurrentVideoId(null);
    setTaskStatus('');
    
    // Show alert about 2-minute wait time
    showInfo('Video generation will take approximately 2 minutes. Please be patient.', 10000);
    
    // Start progress animation - calibrated to reach ~95% in exactly 2 minutes
    const startTime = Date.now();
    const totalDuration = 120000; // 2 minutes in milliseconds
    
    const progressInterval = setInterval(() => {
      const elapsedTime = Date.now() - startTime;
      const calculatedProgress = Math.min(95, (elapsedTime / totalDuration) * 95);
      
      setProcessingProgress(calculatedProgress);
      
      // If we've reached the end of our expected duration, slow down updates
      if (elapsedTime >= totalDuration) {
        clearInterval(progressInterval);
        // Switch to a slower interval for the remaining 5%
        const finalInterval = setInterval(() => {
          setProcessingProgress(prev => {
            const newProgress = prev + 0.1;
            if (newProgress >= 95) {
              clearInterval(finalInterval);
              return 95;
            }
            return newProgress;
          });
        }, 3000);
      }
    }, 1000); // Update every second for smoother progress
    
    try {
      // Get resolution dimensions
      const selectedResolution = resolutionOptions.find(r => r.id === resolution);
      const size = selectedResolution ? `${selectedResolution.width}*${selectedResolution.height}` : '1280*720';
      
      let response;
      
      // Check if we have an uploaded image
      if (uploadedImageUrl) {
        try {
          // Check if we're using a local file (from handleImageFileChange) or a URL
          if (uploadedImageUrl === 'local-file' && uploadedImage) {
            console.log('Using local image file for direct API upload');
            
            // Determine which API call to make based on the selected option
            if (template) {
              // Option 1: Template-based Generation with direct file upload
              console.log('Using template-based generation with template:', template);
              response = await videoService.createVideoWithImage(
                user.id,
                uploadedImage,
                template,
                "", // Empty prompt for template-based generation
                size
              );
            } else {
              // Option 2: Text-to-Video with direct file upload
              console.log('Using text-to-video with prompt:', prompt);
              response = await videoService.createVideoWithImage(
                user.id,
                uploadedImage,
                undefined, // No template
                prompt,
                size
              );
            }
          } else {
            // We have a URL (from previous implementation) - this is a fallback
            console.error('Using URL-based image upload is deprecated, please use direct file upload');
            setError('Image upload method not supported. Please try uploading the image again.');
            setIsGenerating(false);
            setGenerateButtonClicked(false);
            clearInterval(progressInterval);
            return;
          }
          
          console.log('Create video with image response:', response);
          
          // Check for error in response
          if (response.error) {
            setError(`Video generation failed: ${response.message || 'The server could not process your image. Please try a different image or prompt.'}`);
            setIsGenerating(false);
            setGenerateButtonClicked(false);
            clearInterval(progressInterval);
            return;
          }
          
          // If the API returns success with video URL
          if (response.videoUrl) {
            setVideoUrl(response.videoUrl);
            setTaskStatus('SUCCEEDED');
            setProcessingProgress(100);
            setIsGenerating(false);
            setGenerateButtonClicked(false);
            clearInterval(progressInterval);
            
            // Refresh video history
            fetchVideoHistory();
            return;
          }
        } catch (apiError: any) {
          console.error('API error in handleGenerateVideo:', apiError);
          
          // Log more details about the error
          console.error('Error type:', typeof apiError);
          console.error('Error message:', apiError.message);
          console.error('Error stack:', apiError.stack);
          
          // Handle different error status codes
          if (apiError.message && apiError.message.includes('Image download timeout')) {
            setError('Image download issue: The server could not process your image. Please try again with a smaller image file or a different image.');
            console.error('Image download timeout detected');
          } else if (apiError.message && apiError.message.includes('500')) {
            setError('Server error (500): The video generation service is currently experiencing issues. This may be due to high demand or server maintenance. Please try again later.');
            console.error('500 error detected in message');
          } else if (apiError.message && apiError.message.includes('Failed to create video from image')) {
            setError(`Video creation failed: ${apiError.message}. Please check that your image is valid and accessible.`);
            console.error('Video creation failure detected');
          } else if (apiError.message && apiError.message.includes('DashScope API error')) {
            setError('AI service error: The video generation AI service encountered an issue processing your image. Please try a different image or prompt.');
            console.error('DashScope API error detected');
          } else {
            setError(apiError.message || 'Failed to connect to video generation service. Please check your internet connection and try again.');
            console.error('Other error type detected');
          }
          
          // Set API error for debugging
          setApiError(apiError.message || 'Unknown API error');
          
          setIsGenerating(false);
          setGenerateButtonClicked(false);
          clearInterval(progressInterval);
          return;
        }
      } else {
        // Use the standard text-to-video API
        response = await videoService.createVideo(user.id, prompt, size);
        console.log('Create video response:', response);
        
        // If the API returns success with video URL
        if (response.videoUrl) {
          setVideoUrl(response.videoUrl);
          setTaskStatus('SUCCEEDED');
          setProcessingProgress(100);
          setIsGenerating(false);
          setGenerateButtonClicked(false);
          clearInterval(progressInterval);
          
          // Refresh video history
          fetchVideoHistory();
          return;
        }
      }
      
      if (response.videoId) {
        setCurrentVideoId(response.videoId);
        setTaskStatus( response.status || 'SUCCEEDED');
        
        // If we're not a pro user, decrement the free generations
        if (!isPro) {
          setFreeGenerationsLeft(prev => Math.max(0, prev - 1));
        }
        
        clearInterval(progressInterval);
        setIsGenerating(false);
        setGenerateButtonClicked(false);
      } else {
        throw new Error(response.message || 'Failed to initiate video generation');
      }
    } catch (error: any) {
      console.error('Error generating video:', error);
      let errorMessage = error.message;
      
      // Don't show error if it contains "Video generated and saved successfully"
      if (errorMessage.includes('Video generated and saved successfully')) {
        // This is actually a success case, not an error
        setIsGenerating(false);
        setGenerateButtonClicked(false);
        clearInterval(progressInterval);
        return;
      }
      
      // Make error messages more user-friendly
      if (errorMessage.includes('API error')) {
        errorMessage = 'Server error: Unable to process your request. Please try again later.';
      } else if (errorMessage.includes('Failed to connect')) {
        errorMessage = 'Connection error: Please check your internet connection and try again.';
      } else if (errorMessage.includes('Video generation failed')) {
        errorMessage = 'Video generation failed. The server may be busy or your image may not be suitable.';
      }
      
      setError(errorMessage);
      setIsGenerating(false);
      setGenerateButtonClicked(false);
      clearInterval(progressInterval);
    }
  };

  const { showConfirmation, showError, showInfo, showSuccess } = useAlert();

  const handleRemoveVideo = async (videoId: string) => {
    if (!user?.id) return;
    
    showConfirmation(
      'Are you sure you want to remove this video? This action cannot be undone.',
      async () => {
        try {
          // Show alert before removing
          showInfo('Removing video...', 2000);
          
          await videoService.removeVideo(user.id!, videoId);
          
          // Remove the video from the local state
          setVideoHistory(prev => prev.filter(video => video.videoId !== videoId));
          
          // Show success message
          showSuccess('Video removed successfully');
        } catch (error: any) {
          console.error('Error removing video:', error);
          showError('Failed to remove the video. Please try again.');
        }
      },
      undefined,
      {
        confirmText: 'Yes, Remove',
        cancelText: 'Cancel',
        type: 'warning'
      }
    );
  };
  
  const handlePlayPause = async () => {
    if (!videoRef.current) return;
    
    try {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        await videoRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error playing video:', error);
    }
  };
  
  const handleVideoTimeUpdate = () => {
    if (!videoRef.current) return;
    
    const currentTime = videoRef.current.currentTime;
    const duration = videoRef.current.duration;
    
    setCurrentTime(currentTime);
    setVideoProgress((currentTime / duration) * 100);
    
    // If video ends, reset to playing state to false
    if (currentTime === duration) {
      setIsPlaying(false);
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setVideoDuration(videoRef.current.duration);
  };

  const handleVideoLoading = () => {
    setIsBuffering(true);
  };

  const handleVideoLoaded = () => {
    setIsBuffering(false);
  };

  const handleVideoError = () => {
    setIsBuffering(false);
    setError('Error loading video. Please try again.');
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    
    const seekTime = (parseFloat(e.target.value) / 100) * videoDuration;
    videoRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
    setVideoProgress(parseFloat(e.target.value));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    
    const newVolume = parseFloat(e.target.value);
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    
    if (isMuted) {
      videoRef.current.volume = volume;
      setIsMuted(false);
    } else {
      videoRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    
    if (!isFullscreen) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const handleUploadVideoClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedVideo(file);
      // Create an object URL for the uploaded video
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      
      // Reset image upload when video is uploaded
      setUploadedImage(null);
      setUploadedImageUrl(null);
      
      // Clean up old video URL if needed
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  };
  
  /**
   * Checks if an image URL is accessible by attempting to load it
   * @param imageUrl The URL of the image to check
   * @returns Promise that resolves to true if accessible, false otherwise
   */
  const checkImageAccessibility = (imageUrl: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      const timeout = setTimeout(() => {
        console.log('Image accessibility check timed out');
        resolve(false);
      }, 5000); // 5 second timeout
      
      img.onload = () => {
        clearTimeout(timeout);
        console.log('Image is accessible');
        resolve(true);
      };
      
      img.onerror = () => {
        clearTimeout(timeout);
        console.log('Image is not accessible');
        resolve(false);
      };
      
      // Ensure the URL doesn't have any quotes or backticks, but preserve spaces
      try {
        // Clean quotes and backticks, but keep spaces
        let cleanedUrl = imageUrl.replace(/["'`]/g, '');
        
        // Double-check for any remaining backticks (sometimes regex can miss them)
        while (cleanedUrl.includes('`')) {
          cleanedUrl = cleanedUrl.replace('`', '');
        }
        
        console.log('Using cleaned URL for accessibility check:', cleanedUrl);
        
        // Try to encode the URL properly
        try {
          // For URLs that might contain spaces and special characters
          const encodedUrl = encodeURI(cleanedUrl);
          img.src = encodedUrl;
        } catch (error) {
          console.error('Error setting image URL:', error);
          resolve(false);
        }
      } catch (error) {
        console.error('Error setting image URL:', error);
        resolve(false);
      }
    });
  };
  
  const handleUploadImageClick = () => {
    // Clear the current image if one exists
    if (uploadedImageUrl) {
      setUploadedImage(null);
      setUploadedImageUrl(null);
      setGenerateButtonClicked(false);
    }
    // Trigger file input click
    imageInputRef.current?.click();
  };
  
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user?.id) {
      try {
        setIsUploadingImage(true);
        setError(null);
        setApiError(null);
        setUploadedImage(file);
        
        console.log('Selected image file:', file.name, file.type, file.size);
        
        if (!file.type.startsWith('image/')) {
          throw new Error('Invalid file type. Please upload an image file.');
        }
        
        // Check if the file is HEIC format
        const isHeic = file.type === 'image/heic' || 
                      file.name.toLowerCase().endsWith('.heic') || 
                      file.name.toLowerCase().endsWith('.heif');
        
        if (isHeic) {
          // Convert HEIC to JPEG immediately
          console.log('HEIC format detected, converting to JPEG now...');
          setError('Converting HEIC image to JPG... Please wait.');
          
          try {
            // Import videoService for HEIC conversion
            const { videoService } = await import('../services/videoService');
            
            // Convert the HEIC file to JPEG
            const convertedFile = await videoService.convertHeicToJpeg(file);
            
            // Update the file reference with the converted JPEG
            setUploadedImage(convertedFile);
            console.log('HEIC conversion complete:', convertedFile.name, convertedFile.type, convertedFile.size);
            
            // Now check dimensions of the converted image with a timeout
            const checkImageDimensions = () => {
              return new Promise<void>((resolve, reject) => {
                const img = new Image();
                
                // Set a timeout to handle cases where the image might take too long to load
                const timeoutId = setTimeout(() => {
                  console.log('Image dimension check timed out, proceeding anyway');
                  resolve(); // Resolve anyway to prevent blocking the user
                }, 5000); // 5 second timeout
                
                img.onload = () => {
                  clearTimeout(timeoutId);
                  // Check if image is too large in dimensions
                  if (img.width > 4000 || img.height > 4000) {
                    reject(new Error('Image dimensions are too large. Please use an image smaller than 4000x4000 pixels to prevent timeout issues.'));
                  } else if (img.width < 256 || img.height < 256) {
                    reject(new Error('Image dimensions are too small. Please use an image at least 256x256 pixels for best results.'));
                  } else {
                    resolve();
                  }
                };
                
                img.onerror = () => {
                  clearTimeout(timeoutId);
                  console.warn('Image failed to load for validation, but proceeding with conversion');
                  resolve(); // Allow the conversion to proceed even if validation fails
                };
                
                img.src = URL.createObjectURL(convertedFile);
              });
            };
            
            try {
              // Try to check dimensions but don't block if it fails
              await checkImageDimensions();
            } catch (dimensionError) {
              console.warn('Dimension check error:', dimensionError);
              // Continue anyway since we have a valid converted file
            }
            
            // Clear the error message since conversion was successful
            setError(null);
          } catch (conversionError: any) {
            console.error('Error converting HEIC image:', conversionError);
            throw new Error('Failed to convert HEIC image. Please try another image format.');
          }
        } else {
          // For non-HEIC images, check dimensions with timeout
          const checkImageDimensions = () => {
            return new Promise<void>((resolve, reject) => {
              const img = new Image();
              
              // Set a timeout to handle cases where the image might take too long to load
              const timeoutId = setTimeout(() => {
                console.log('Image dimension check timed out, proceeding anyway');
                resolve(); // Resolve anyway to prevent blocking the user
              }, 5000); // 5 second timeout
              
              img.onload = () => {
                clearTimeout(timeoutId);
                // Check if image is too large in dimensions
                if (img.width > 4000 || img.height > 4000) {
                  reject(new Error('Image dimensions are too large. Please use an image smaller than 4000x4000 pixels to prevent timeout issues.'));
                } else if (img.width < 256 || img.height < 256) {
                  reject(new Error('Image dimensions are too small. Please use an image at least 256x256 pixels for best results.'));
                } else {
                  resolve();
                }
              };
              
              img.onerror = () => {
                clearTimeout(timeoutId);
                reject(new Error('Failed to load image for validation. Please try another image.'));
              };
              
              img.src = URL.createObjectURL(file);
            });
          };
          
          try {
            // Check image dimensions before proceeding
            await checkImageDimensions();
          } catch (dimensionError) {
            throw dimensionError; // For non-HEIC images, we still want to enforce dimension requirements
          }
        }
        
        // Store the file directly without uploading to storage
        // The file will be sent directly to the API in handleGenerateVideo
        setUploadedImageUrl('local-file'); // Use a marker to indicate we have a local file
        
        // Reset video upload when image is uploaded
        setUploadedVideo(null);
        setVideoUrl(null);
        
        setIsUploadingImage(false);
      } catch (error: any) {
        console.error('Error processing image:', error);
        setError(error.message || 'Failed to process image. Please try again.');
        setUploadedImage(null);
        setIsUploadingImage(false);
      }
    }
  };
  
  const handleDownload = async (videoUrl?: string, promptText?: string) => {
    const urlToDownload = videoUrl || videoUrl;
    if (!urlToDownload) return;
    
    try {
      // Show loading state
      const loadingToast = document.createElement('div');
      loadingToast.className = `fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all`;
      loadingToast.textContent = 'Downloading video...';
      document.body.appendChild(loadingToast);

      // Fetch the video as blob to handle CORS issues
      const response = await fetch(urlToDownload, {
        mode: 'cors',
        headers: {
          'Accept': 'video/*',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch video');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with prompt if available
      const timestamp = new Date().getTime();
      const promptPrefix = promptText ? promptText.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_') : 'video';
      link.download = `matrixai_${promptPrefix}_${timestamp}.mp4`;
      
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
      successToast.textContent = 'Video downloaded successfully!';
      document.body.appendChild(successToast);
      
      setTimeout(() => {
        if (document.body.contains(successToast)) {
          document.body.removeChild(successToast);
        }
      }, 3000);
      
    } catch (error) {
      console.error('Error downloading video:', error);
      
      // Fallback to simple download
      try {
        const link = document.createElement('a');
        link.href = urlToDownload;
        link.download = `matrixai-video-${new Date().getTime()}.mp4`;
        link.target = '_blank';
        link.click();
      } catch (fallbackError) {
        // Show error message
        const errorToast = document.createElement('div');
        errorToast.className = `fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all`;
        errorToast.textContent = 'Failed to download video. Please try right-click and save.';
        document.body.appendChild(errorToast);
        
        setTimeout(() => {
          if (document.body.contains(errorToast)) {
            document.body.removeChild(errorToast);
          }
        }, 5000);
      }
    }
  };

  const cancelGeneration = () => {
    setIsGenerating(false);
    setGenerateButtonClicked(false);
    setProcessingProgress(0);
    setError(null);
  };

  const getStatusText = () => {
    // Fixed time status of 40 seconds for text-to-video
    const getRemainingTimeText = () => {
      // If progress is over 95%, just say "almost done"
      if (processingProgress >= 95) {
        return "(almost done)";
      }
      
      // Fixed time of 40 seconds for text-to-video
      const totalTimeSeconds = 40;
      const remainingProgress = 100 - processingProgress;
      const remainingTimeSeconds = Math.ceil((remainingProgress / 100) * totalTimeSeconds);
      
      // Format the remaining time
      if (remainingTimeSeconds > 60) {
        const minutes = Math.floor(remainingTimeSeconds / 60);
        const seconds = remainingTimeSeconds % 60;
        return `(about ${minutes}m ${seconds}s remaining)`;
      } else {
        return `(about ${remainingTimeSeconds}s remaining)`;
      }
    };
    
    // Special case for image upload
    if (uploadedImageUrl && isGenerating) {
      if (taskStatus === 'PENDING' || taskStatus === 'pending') {
        return `Preparing your image for animation... ${getRemainingTimeText()}`;
      } else if (taskStatus === 'RUNNING' || taskStatus === 'PROCESSING' || taskStatus === 'processing') {
        return `Animating your image... ${getRemainingTimeText()}`;
      } else if (taskStatus === 'FAILED' || taskStatus === 'failed') {
        return 'Animation failed. Please try a different image or prompt.';
      }
    }
    
    // Normalize status to lowercase for consistent comparison
    const normalizedStatus = taskStatus.toLowerCase();
    
    switch (normalizedStatus) {
      case 'pending':
        return `Initializing video generation... ${getRemainingTimeText()}`;
      case 'running':
      case 'processing':
      case 'generating':
        return `Generating video... ${getRemainingTimeText()}`;
      case 'succeeded':
      case 'completed':
        return 'Video generated successfully!';
      case 'failed':
        return 'Video generation failed';
      default:
        return `Generating video... ${getRemainingTimeText()}`;
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced background gradient effect */}
      <div className="absolute inset-0 bg-black z-0"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 via-transparent to-purple-900/30 z-0"></div>
      
      {/* Subtle gradient from bottom to create a fade to black effect */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black to-transparent z-0"></div>
      
      {/* Subtle grid lines with animation */}
      <div className="absolute inset-0 opacity-10 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] animate-gridMove"></div>
      
      <div className="flex-1 flex flex-col relative z-10">
        <div className="flex-1 p-0">
          <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
      {showProAlert && (
        <ProFeatureAlert 
          featureName="Advanced Video Creation"
          onClose={() => setShowProAlert(false)}
        />
      )}
      
      <div className="mt-6 mb-8">
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-yellow-500 to-purple-500 animate-gradient-x"
        >
          {t('video.title')}
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-500 dark:text-gray-400"
        >
          {t('video.subtitle')}
        </motion.p>
        
        {!isPro && (
          <div className="mt-2 flex items-center text-sm text-yellow-600 dark:text-yellow-400">
            <FiVideo className="mr-1.5" />
            <span>{freeGenerationsLeft} {freeGenerationsLeft === 1 ? t('video.freeLeft') || 'free generation' : t('video.freeLeftPlural') || 'free generations'} left</span>
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

      {/* Video Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-8">
        <div className="lg:col-span-3">
          {videoUrl ? (
            <div 
              className="relative rounded-lg overflow-hidden bg-black aspect-video shadow-lg group"
              onMouseEnter={() => setShowControls(true)}
              onMouseLeave={() => setShowControls(false)}
            >
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-contain"
                onTimeUpdate={handleVideoTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onLoadStart={handleVideoLoading}
                onCanPlay={handleVideoLoaded}
                onWaiting={handleVideoLoading}
                onPlaying={handleVideoLoaded}
                onError={handleVideoError}
                onEnded={() => setIsPlaying(false)}
                onClick={handlePlayPause}
              />
              
              {/* Reupload Button with AI styling */}
              <div className="absolute top-4 right-4 z-50">
                <div className="relative p-[1px] rounded-lg overflow-hidden bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-gradient-x">
                  <button
                    onClick={handleUploadImageClick}
                    className="px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-md text-white hover:bg-black/60 flex items-center shadow-lg transition-all duration-300"
                  >
                    <FiUpload className="mr-1.5" size={14} />
                    Reupload
                  </button>
                </div>
              </div>
              <input
                type="file"
                ref={imageInputRef}
                onChange={handleImageFileChange}
                accept="image/*"
                className="hidden"
              />
              
              {/* Buffering Indicator */}
              {isBuffering && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="flex items-center space-x-2 text-white">
                    <FiLoader className="animate-spin" size={24} />
                    <span>Buffering...</span>
                  </div>
                </div>
              )}
              
              {/* Center Play/Pause Button */}
              {!isPlaying && !isBuffering && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={handlePlayPause}
                    className="bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-4 text-white transition-all transform hover:scale-110"
                  >
                    <FiPlay size={24} />
                  </button>
                </div>
              )}
              
              {/* Video Controls */}
              <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-4 transition-all duration-300 ${
                showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              }`}>
                {/* Progress Bar */}
                <div className="mb-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={videoProgress}
                    onChange={handleSeek}
                    className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider-thumb"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${videoProgress}%, #6b7280 ${videoProgress}%, #6b7280 100%)`
                    }}
                  />
                </div>
                
                {/* Control Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {/* Play/Pause */}
                    <button
                      onClick={handlePlayPause}
                      className="text-white hover:text-blue-400 transition-colors"
                    >
                      {isPlaying ? <FiPause size={20} /> : <FiPlay size={20} />}
                    </button>
                    
                    {/* Volume Control */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={toggleMute}
                        className="text-white hover:text-blue-400 transition-colors"
                      >
                        {isMuted ? <FiVolumeX size={18} /> : <FiVolume2 size={18} />}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    
                    {/* Time Display */}
                    <div className="text-white text-sm">
                      {formatTime(currentTime)} / {formatTime(videoDuration)}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Download Button */}
                    <button
                      onClick={() => handleDownload(videoUrl, prompt)}
                      className="text-white hover:text-blue-400 transition-colors"
                      title="Download video"
                    >
                      <FiDownload size={18} />
                    </button>
                    
                    {/* Fullscreen Button */}
                    <button
                      onClick={toggleFullscreen}
                      className="text-white hover:text-blue-400 transition-colors"
                      title="Toggle fullscreen"
                    >
                      {isFullscreen ? <FiMinimize size={18} /> : <FiMaximize size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 backdrop-blur-sm bg-white/10 dark:bg-gray-800/20 aspect-video flex flex-col items-center justify-center text-center p-6 relative overflow-hidden shadow-xl hover:border-blue-500 dark:hover:border-blue-400 focus:border-purple-500 dark:focus:border-purple-400 transition-colors duration-300">
              {uploadedImageUrl ? (
                <>
                  <div className="relative w-full h-full overflow-hidden rounded-lg shadow-xl">
                    {uploadedImageUrl === 'local-file' && uploadedImage ? (
                      // Display the image (HEIC images are already converted at this point)
                      (
                        // For non-HEIC images, show the actual image
                        <img 
                          src={URL.createObjectURL(uploadedImage)} 
                          alt="Uploaded" 
                          className="max-h-full max-w-full object-contain z-10 mx-auto"
                          onError={(e) => {
                            console.error('Local image failed to load');
                            e.currentTarget.onerror = null; // Prevent infinite error loop
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNMTAwIDcwQzExNy42NyA3MCAxMzIgODQuMzMgMTMyIDEwMkMxMzIgMTE5LjY3IDExNy42NyAxMzQgMTAwIDEzNEM4Mi4zMyAxMzQgNjggMTE5LjY3IDY4IDEwMkM2OCA4NC4zMyA4Mi4zMyA3MCAxMDAgNzBaIiBmaWxsPSIjOTRBM0IzIi8+PHBhdGggZD0iTTYwIDEzNkM2MCAxMjIuNzQ1IDcwLjc0NSAxMTIgODQgMTEySDExNkMxMjkuMjU1IDExMiAxNDAgMTIyLjc0NSAxNDAgMTM2VjE0MEg2MFYxMzZaIiBmaWxsPSIjOTRBM0IzIi8+PC9zdmc+'; // Fallback image
                          }}
                        />
                      )
                    ) : (
                      <img 
                        src={uploadedImageUrl} 
                        alt="Uploaded" 
                        className="max-h-full max-w-full object-contain z-10 mx-auto" 
                        onError={(e) => {
                          console.error('Image failed to load:', uploadedImageUrl);
                          e.currentTarget.onerror = null; // Prevent infinite error loop
                          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNMTAwIDcwQzExNy42NyA3MCAxMzIgODQuMzMgMTMyIDEwMkMxMzIgMTE5LjY3IDExNy42NyAxMzQgMTAwIDEzNEM4Mi4zMyAxMzQgNjggMTE5LjY3IDY4IDEwMkM2OCA4NC4zMyA4Mi4zMyA3MCAxMDAgNzBaIiBmaWxsPSIjOTRBM0IzIi8+PHBhdGggZD0iTTYwIDEzNkM2MCAxMjIuNzQ1IDcwLjc0NSAxMTIgODQgMTEySDExNkMxMjkuMjU1IDExMiAxNDAgMTIyLjc0NSAxNDAgMTM2VjE0MEg2MFYxMzZaIiBmaWxsPSIjOTRBM0IzIi8+PC9zdmc+'; // Fallback image
                        }}
                      />
                    )}
                    {isGenerating && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30 animate-pulse flex items-center justify-center z-20"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-slide-right z-30"></div>
                        
                        {/* Progress bar overlay */}
                        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 w-3/4 max-w-md z-40">
                          <div className="w-full bg-gray-700/70 rounded-full h-2 mb-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${processingProgress}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        {/* Status text */}
                        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-white text-lg font-medium bg-black/70 px-6 py-3 rounded-full z-40 shadow-xl flex items-center">
                          <FiLoader className="animate-spin mr-3" size={20} />
                          {getStatusText()}
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <FiVideo className="w-12 h-12 text-gray-400 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">No video generated yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mb-4">
                    Enter a prompt describing the video you want to create, upload an image to animate, or upload a video to enhance
                  </p>
                </>
              )}
              {!uploadedImageUrl && (
                <div className="flex flex-col items-center">
                  <div className="flex space-x-3">
                    <AuthRequiredButton
                      onClick={handleUploadImageClick}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:opacity-90 flex items-center shadow-lg transform transition-transform hover:scale-105"
                      title="Images larger than 5MB will be automatically compressed"
                    >
                      <FiImage className="mr-2" />
                      Upload Image
                    </AuthRequiredButton>
                    <input
                      type="file"
                      ref={imageInputRef}
                      onChange={handleImageFileChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    Images larger than 5MB will be automatically compressed
                  </div>
                </div>
              )}
              {uploadedImageUrl && !isGenerating && (
                <div className="flex flex-col items-center">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setUploadedImage(null);
                        setUploadedImageUrl(null);
                        setGenerateButtonClicked(false);
                      }}
                      className="mt-4 px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 flex items-center"
                    >
                      <FiTrash className="mr-2" />
                      Remove Image
                    </button>
                    <AuthRequiredButton
                      onClick={handleUploadImageClick}
                      className="mt-4 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:opacity-90 flex items-center shadow-lg transform transition-transform hover:scale-105"
                    >
                      <FiUpload className="mr-2" />
                      Reupload Image
                    </AuthRequiredButton>
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    Images larger than 5MB are automatically compressed
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Template Video Grid */}
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">Available Templates</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {templateVideos.slice(0, 8).map((template) => (
                  <div
                    key={template.id}
                    className={`relative group cursor-pointer rounded-lg overflow-hidden border transition-all duration-200 ${
                      selectedTemplate === template.name
                        ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    } ${template.category === 'premium' && !canAccessPremium() ? 'opacity-60' : ''}`}
                    onClick={() => {
                      if (template.category === 'premium' && !canAccessPremium()) {
                        setShowProAlert(true);
                        return;
                      }
                      handleTemplateSelect(template.name);
                    }}
                  >
                    {/* Video Preview */}
                    <div className="aspect-video bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                      <video
                        src={template.videoUrl}
                        className="w-full h-full object-cover"
                        muted
                        loop
                        preload="metadata"
                        onMouseEnter={(e) => {
                          if (template.category === 'basic' || canAccessPremium()) {
                            e.currentTarget.play();
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.pause();
                          e.currentTarget.currentTime = 0;
                        }}
                      />
                      
                      {/* Premium Lock Overlay */}
                      {template.category === 'premium' && !canAccessPremium() && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <div className="text-white text-center">
                            <FiLock className="w-6 h-6 mx-auto mb-2" />
                            <span className="text-xs font-medium">Premium</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Selected Indicator */}
                      {selectedTemplate === template.name && (
                        <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                          <FiCheck size={16} />
                        </div>
                      )}
                    </div>
                    
                    {/* Template Info */}
                    <div className="p-2">
                      <h3 className="font-medium text-xs text-gray-900 dark:text-white truncate">
                        {template.name}
                      </h3>
                      <div className="flex items-center justify-between mt-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${template.category === 'basic' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'}`}>
                          {template.category === 'basic' ? '25 coins' : '70 coins'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => setShowTemplateGrid(true)}
                  className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 flex items-center"
                >
                  <FiVideo className="mr-1" size={14} />
                  View All Templates
                </button>
              </div>
            </div>
          </div>
        
        <div className="lg:col-span-2">
          <div className="space-y-6">
            {/* Prompt Input */}
            <div>
              <div className="relative">
                {/* Animated gradient border wrapper */}
            <div className="relative p-[2px] rounded-lg overflow-hidden bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-gradient-x">
  {/* Inner glass container with transparent black glass effect */}
  <div className="rounded-lg bg-black/80 backdrop-blur-md bg-clip-padding">
    <textarea
      id="promptInput"
      value={prompt}
      onChange={(e) => setPrompt(e.target.value)}
      placeholder="Describe the video you want to generate..."
      className="w-full p-4 pr-12 h-24 border-0 rounded-lg bg-transparent text-white placeholder:text-white/50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      disabled={isGenerating}
    />
  </div>
</div>

                {/* Only show filter button when image is uploaded */}
                {uploadedImageUrl && (
                  <div className="absolute top-2 right-2">
                    <button 
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      disabled={isGenerating}
                    >
                      <FiSliders />
                    </button>
                  </div>
                )}
              </div>
              
              {/* Video Generation Options - Only shown when image is uploaded */}
              {uploadedImageUrl && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-4 border rounded-lg shadow-sm backdrop-blur-sm bg-white/20 dark:bg-gray-800/20 border-gray-200 dark:border-gray-700"
                >
                  <h3 className="text-md font-medium mb-3 text-gray-800 dark:text-gray-200">Video Generation Options</h3>
                  
                  <div className="space-y-4">
                    {/* Option 1: Text-to-Video */}
                    <div className="p-3 border rounded-md border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition-all"
                         onClick={() => {
                           setTemplate("");
                           // Always set negative prompt to "no blur" to ensure it's treated as user input
                           // This forces it to be included in the API request but is hidden from the user
                           setNegativePrompt("no blur");
                           setShowAdvanced(false);
                           // Enable prompt input
                           document.getElementById('promptInput')?.removeAttribute('disabled');
                         }}
                    >
                      <div className="flex items-center">
                        <div className="h-4 w-4 rounded-full border border-gray-400 dark:border-gray-500 flex items-center justify-center mr-2">
                          {!template && <div className="h-2 w-2 rounded-full bg-blue-500"></div>}
                        </div>
                        <h4 className="font-medium text-gray-800 dark:text-gray-200">Text-to-Video</h4>
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 ml-6">
                        Generate video with your prompt
                      </p>
                      {/* Hidden input for negative prompt - not shown to user */}
                      <input type="hidden" value="no blur" />
                    </div>
                    
                    {/* Option 2: Template-based Generation */}
                    <div className="p-3 border rounded-md border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition-all"
                         onClick={() => {
                           // Set template to first option if not already set
                           if (!template) {
                             const firstTemplate = templateOptions.length > 0 ? templateOptions[0].id : "";
                             setTemplate(firstTemplate);
                           }
                           // Set default negative prompt to "no blur" for template-based generation too
                           if (!negativePrompt || negativePrompt.trim() === "") {
                             setNegativePrompt("no blur");
                           }
                           setShowAdvanced(true); // Show advanced options to display negative prompt
                           // Clear prompt when template is selected
                           setPrompt("");
                           // Disable prompt input when template is selected
                           document.getElementById('promptInput')?.setAttribute('disabled', 'disabled');
                         }}
                    >
                      <div className="flex items-center">
                        <div className="h-4 w-4 rounded-full border border-gray-400 dark:border-gray-500 flex items-center justify-center mr-2">
                          {template && <div className="h-2 w-2 rounded-full bg-blue-500"></div>}
                        </div>
                        <h4 className="font-medium text-gray-800 dark:text-gray-200">Template-based Generation</h4>
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 ml-6">
                        Apply a motion template to your image (no prompt needed)
                      </p>
                      
                      {/* Template selection - Always shown for this option */}
                      {template && (
                        <div className="mt-2 ml-6 space-y-4">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Motion Template</label>
                              <button
                                onClick={() => setShowTemplateGrid(true)}
                                className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 flex items-center"
                                disabled={isGenerating}
                              >
                                <FiVideo className="mr-1" size={14} />
                                Browse Templates
                              </button>
                            </div>
                            {selectedTemplate ? (
                              <div className="p-3 border rounded-md bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                    {templateVideos.find(t => t.name === selectedTemplate)?.name || selectedTemplate}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setSelectedTemplate(null);
                                      setTemplate('');
                                    }}
                                    className="text-red-500 hover:text-red-600 dark:text-red-400"
                                    disabled={isGenerating}
                                  >
                                    <FiX size={16} />
                                  </button>
                                </div>
                                {/* Show selected template video */}
                                {templateVideos.find(t => t.name === selectedTemplate)?.videoUrl && (
                                  <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden">
                                    <video 
                                      src={templateVideos.find(t => t.name === selectedTemplate)?.videoUrl}
                                      className="w-full h-full object-cover"
                                      autoPlay
                                      loop
                                      muted
                                      playsInline
                                    />
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <select 
                                  value={template}
                                  onChange={(e) => {
                                    setTemplate(e.target.value);
                                    // Find the template in templateVideos and set selectedTemplate
                                    const selectedTemplateObj = templateVideos.find(t => t.id === e.target.value);
                                    if (selectedTemplateObj) {
                                      setSelectedTemplate(selectedTemplateObj.name);
                                    }
                                  }}
                                  className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600"
                                  disabled={isGenerating}
                                >
                                  <option value="">Select a template...</option>
                                  <optgroup label="Basic Templates">
                                    {templateVideos
                                      .filter(t => t.category === 'basic')
                                      .map(template => (
                                        <option key={template.id} value={template.id}>
                                          {template.name}
                                        </option>
                                      ))}
                                  </optgroup>
                                  <optgroup label="Premium Templates 🔒 (70 coins)">
                                    {templateVideos
                                      .filter(t => t.category === 'premium')
                                      .map(template => (
                                        <option key={template.id} value={template.id} disabled={!canAccessPremium()}>
                                          {template.name} {!canAccessPremium() ? '🔒' : '(70 coins)'}
                                        </option>
                                      ))}
                                  </optgroup>
                                </select>
                                
                                {/* Show preview of currently selected template in dropdown */}
                                {template && templateVideos.find(t => t.id === template)?.videoUrl && (
                                  <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden mt-2">
                                    <video 
                                      src={templateVideos.find(t => t.id === template)?.videoUrl}
                                      className="w-full h-full object-cover"
                                      autoPlay
                                      loop
                                      muted
                                      playsInline
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Set default negative prompt as hidden input */}
                          {template && (
                            <input 
                              type="hidden" 
                              value="no blur"
                              onChange={() => setNegativePrompt("no blur")}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
            
            {/* Error Display */}
            {(error || apiError) && (
              <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg shadow-md mt-4">
                <p className="text-red-700 dark:text-red-300 font-medium flex items-center">
                  <FiX className="mr-2 flex-shrink-0 text-red-500" size={18} />
                  {error || apiError}
                </p>
                {(error?.includes('Video generation failed') || error?.includes('Task processing failed')) && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 pl-6">
                    This may be due to server issues or the image not being suitable for animation. Try using a different image with a clear subject or try again later.
                  </p>
                )}
                {(error?.includes('Converting HEIC image')) && (
                  <p className="mt-2 text-sm text-amber-600 dark:text-amber-400 pl-6">
                    <strong>Please wait:</strong> HEIC is an Apple image format that is being converted to JPG for compatibility.
                    <br/><br/>
                    <strong>What's happening:</strong> Your HEIC image is being converted to JPG format right now.
                    <br/>
                    <strong>No action needed:</strong> The image will be displayed once conversion is complete.
                  </p>
                )}
              </div>
            )}
            
            {/* Generate Button */}
            <div>
              {isGenerating && !uploadedImageUrl ? (
                <div className="space-y-3">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 animate-gradient-x h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${processingProgress}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                      <FiClock className="mr-1" /> {getStatusText()}
                    </span>
                    <button
                      onClick={cancelGeneration}
                      className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 flex items-center"
                    >
                      <FiX className="mr-1" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <AuthRequiredButton
                  onClick={handleGenerateVideo}
                  disabled={((!prompt.trim() && !template) || isUploadingImage || generateButtonClicked || isGenerating)}
                  className={`w-full py-3 rounded-lg font-medium flex items-center justify-center ${
                    ((!prompt.trim() && !template) || isUploadingImage || generateButtonClicked || isGenerating)
                      ? 'bg-gray-300 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 animate-gradient-x text-white hover:opacity-90'
                  } transition`}
                >
                  {isUploadingImage ? (
                    <>
                      <FiLoader className="animate-spin mr-2" />
                      Uploading Image...
                    </>
                  ) : (
                    <>
                      <FiVideo className="mr-2" />
                      Generate Video
                      <div className="ml-2 flex items-center bg-black/20 px-2 py-0.5 rounded-full">
                        <span className="text-sm font-bold mr-1">
                          {templateVideos.find(t => t.name === selectedTemplate)?.category === 'premium' ? '-70' : '-25'}
                        </span>
                        <img src={coinImage} alt="Coins" className="h-4 w-4" />
                      </div>
                    </>
                  )}
                </AuthRequiredButton>
              )}
            </div>
            
            {/* History Button */}
            <div>
              <AuthRequiredButton
                onClick={() => setShowHistory(!showHistory)}
                className="w-full py-2 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center"
              >
                <FiList className="mr-2" />
                {showHistory ? 'Hide History' : 'Show History'}
              </AuthRequiredButton>
            </div>
            
            {/* Video History */}
            {showHistory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border rounded-lg p-4 backdrop-blur-sm bg-white/20 dark:bg-gray-800/20 border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto shadow-lg"
              >
                <h3 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-300">Video History</h3>
                
                {isLoadingHistory ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-start space-x-3 p-3 backdrop-blur-sm bg-white/20 dark:bg-gray-800/20 rounded-lg animate-pulse">
                        <div className="w-16 h-12 bg-gray-300 dark:bg-gray-600 rounded"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
                        </div>
                        <div className="flex space-x-2">
                          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : historyError ? (
                  <div className="text-center py-8">
                    <p className="text-red-500 dark:text-red-400 text-sm mb-2">Error loading history</p>
                    <p className="text-red-500 dark:text-red-400 text-xs">{historyError}</p>
                    <button
                      onClick={() => fetchVideoHistory(1, false)}
                      className="mt-4 px-4 py-2 rounded-lg bg-blue-500 text-white hover-bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-sm"
                    >
                      Retry
                    </button>
                  </div>
                ) : videoHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <FiVideo className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-600" />
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No videos generated yet</p>
                    <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Generate your first video to see it here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {videoHistory.map((video) => (
                      <div key={video.videoId} className="flex items-start space-x-3 p-3 backdrop-blur-sm bg-white/20 dark:bg-gray-800/20 rounded-lg hover:border hover:border-blue-500 dark:hover:border-blue-400 transition-colors duration-300">
                        {/* Video Thumbnail */}
                        {video.videoUrl && (video.isReady || video.statusDisplay === 'Ready') && (
                          <div className="flex-shrink-0">
                            <video
                              src={video.videoUrl}
                              className="w-16 h-12 object-cover rounded border"
                              muted
                              preload="metadata"
                              onError={(e) => {
                                console.error('Video thumbnail failed to load:', video.videoUrl);
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {video.promptText || video.template}
                          </p>
                          <div className="flex items-center space-x-4 mt-1">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {video.ageDisplay}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {video.size}
                            </p>
                          </div>
                          <div className="flex flex-col space-y-1 mt-1">
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                (video.taskStatus === 'SUCCEEDED' || video.statusDisplay === 'Ready')
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : (video.taskStatus === 'RUNNING' || video.taskStatus === 'PENDING' || 
                                    video.taskStatus === 'processing' || video.taskStatus === 'generating' ||
                                    video.statusDisplay === 'Processing' || video.statusDisplay === 'Queued')
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                  : (video.taskStatus === 'FAILED' || video.taskStatus === 'failed' || video.statusDisplay === 'Failed')
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                              }`}>
                                {/* Use the statusDisplay field which is already formatted by transformVideoData */}
                                {video.statusDisplay}
                              </span>
                            </div>
                            {/* Display error message if video failed and has an error message */}
                            {(video.taskStatus === 'FAILED' || video.taskStatus === 'failed' || video.statusDisplay === 'Failed') && video.error_message && (
                              <p className="text-xs text-red-500 dark:text-red-400 italic">
                                {video.error_message}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          {video.videoUrl && (video.isReady || video.statusDisplay === 'Ready') && (
                            <>
                              <button
                                onClick={() => setVideoUrl(video.videoUrl || null)}
                                className="text-blue-500 hover:text-blue-700 dark:text-blue-400"
                                title="Load video"
                              >
                                <FiPlay size={16} />
                              </button>
                              <button
                                onClick={() => handleDownload(video.videoUrl, video.promptText)}
                                className="text-green-500 hover:text-green-700 dark:text-green-400"
                                title="Download video"
                              >
                                <FiDownload size={16} />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleRemoveVideo(video.videoId)}
                            className="text-red-500 hover:text-red-700 dark:text-red-400"
                            title="Remove video"
                          >
                            <FiTrash size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {/* Loading indicator */}
                    {isLoadingMoreHistory && (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 dark:border-blue-400 mr-2"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Loading more...</span>
                      </div>
                    )}
                    
                    {/* Pagination controls */}
                    {videoHistory.length > 0 && !isLoadingMoreHistory && (
                      <div className="flex justify-between items-center py-3">
                        <button 
                          onClick={() => {
                            if (historyPage > 1) {
                              const prevPage = historyPage - 1;
                              setHistoryPage(prevPage);
                              fetchVideoHistory(prevPage, false);
                            }
                          }}
                          disabled={historyPage <= 1}
                          className={`px-4 py-2 rounded-lg text-sm transition-colors duration-300 ${historyPage <= 1 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                        >
                          Previous
                        </button>
                        
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Page {historyPage} of {totalPages}
                        </span>
                        
                        <button 
                          onClick={() => {
                            if (hasMoreHistory) {
                              const nextPage = historyPage + 1;
                              setHistoryPage(nextPage);
                              fetchVideoHistory(nextPage, false);
                            }
                          }}
                          disabled={!hasMoreHistory}
                          className={`px-4 py-2 rounded-lg text-sm transition-colors duration-300 ${!hasMoreHistory ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
            
            {/* Presets */}
            <div>
              <h3 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Try these ideas</h3>
              <div className="grid grid-cols-1 gap-2">
                {presetPrompts.map((presetPrompt, index) => (
                  <button
                    key={index}
                    onClick={() => setPrompt(presetPrompt)}
                    disabled={isGenerating}
                    className="text-left p-3 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm flex items-start"
                  >
                    <FiPlus className="mr-2 mt-0.5 text-blue-500 flex-shrink-0" />
                    {presetPrompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Examples and Suggestions */}
      <div className="mt-12 border-t border-gray-200 dark:border-gray-700 pt-8">
        <h2 className="text-xl font-bold mb-6">What you can create</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-lg overflow-hidden border dark:border-gray-700">
            <div className="bg-blue-100 dark:bg-blue-900 p-4">
              <h3 className="font-medium mb-1">Text to Video</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Create videos directly from textual descriptions</p>
            </div>
            <div className="p-4 text-sm">
              <ul className="space-y-2">
                <li className="flex items-start">
                  <FiCheck className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  Generate scenes based on detailed descriptions
                </li>
                <li className="flex items-start">
                  <FiCheck className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  Create animated sequences for presentations
                </li>
                <li className="flex items-start">
                  <FiCheck className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  Visualize creative concepts and stories
                </li>
              </ul>
            </div>
          </div>
          
          <div className="rounded-lg overflow-hidden border dark:border-gray-700">
            <div className="bg-purple-100 dark:bg-purple-900 p-4">
              <h3 className="font-medium mb-1">Video Enhancement</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Upgrade and transform existing videos</p>
            </div>
            <div className="p-4 text-sm">
              <ul className="space-y-2">
                <li className="flex items-start">
                  <FiCheck className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  Enhance video quality and resolution
                </li>
                <li className="flex items-start">
                  <FiCheck className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  Apply artistic styles to existing footage
                </li>
                <li className="flex items-start">
                  <FiCheck className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  Stabilize shaky videos and improve colors
                </li>
              </ul>
            </div>
          </div>
          
          <div className="rounded-lg overflow-hidden border dark:border-gray-700">
            <div className="bg-pink-100 dark:bg-pink-900 p-4">
              <h3 className="font-medium mb-1">Motion Graphics</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Create dynamic visual animations</p>
            </div>
            <div className="p-4 text-sm">
              <ul className="space-y-2">
                <li className="flex items-start">
                  <FiCheck className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  Generate logo animations and branding elements
                </li>
                <li className="flex items-start">
                  <FiCheck className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  Create animated infographics from data
                </li>
                <li className="flex items-start">
                  <FiCheck className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  Design animated text and title sequences
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
          </div>
        </div>
      </div>

      {/* Template Grid Modal */}
      {showTemplateGrid && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Choose a Template</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Select from our collection of video templates
                </p>
              </div>
              <button
                onClick={() => setShowTemplateGrid(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <FiX size={24} />
              </button>
            </div>
            
            {/* Category Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setTemplateCategory('basic')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  templateCategory === 'basic'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                Basic Templates (12)
              </button>
              <button
                onClick={() => setTemplateCategory('premium')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  templateCategory === 'premium'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                Premium Templates (7) {!canAccessPremium() && '🔒'}
              </button>
            </div>
            
            {/* Template Grid */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {isLoadingTemplates ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-3 text-gray-600 dark:text-gray-400">Loading templates...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {getFilteredTemplates().map((template) => (
                    <div
                      key={template.id}
                      className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                        selectedTemplate === template.name
                          ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      } ${
                        templateCategory === 'premium' && !canAccessPremium()
                          ? 'opacity-60'
                          : ''
                      }`}
                      onClick={() => {
                        if (templateCategory === 'premium' && !canAccessPremium()) {
                          alert('Premium templates require a subscription. Please upgrade your plan.');
                          return;
                        }
                        handleTemplateSelect(template.name);
                        setShowTemplateGrid(false);
                      }}
                    >
                      {/* Video Preview */}
                      <div className="aspect-video bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                        <video
                          src={template.videoUrl}
                          className="w-full h-full object-cover"
                          muted
                          loop
                          preload="metadata"
                          onMouseEnter={(e) => {
                            if (templateCategory === 'basic' || canAccessPremium()) {
                              e.currentTarget.play();
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.pause();
                            e.currentTarget.currentTime = 0;
                          }}
                        />
                        
                        {/* Premium Lock Overlay */}
                        {templateCategory === 'premium' && !canAccessPremium() && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <div className="text-white text-center">
                              <FiLock className="w-6 h-6 mx-auto mb-2" />
                              <span className="text-xs font-medium">Premium</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Selected Indicator */}
                        {selectedTemplate === template.name && (
                          <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                            <FiCheck size={16} />
                          </div>
                        )}
                        
                        {/* Play Button Overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <FiPlay className="w-8 h-8 text-white" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Template Info */}
                      <div className="p-3">
                        <h3 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                          {template.name}
                        </h3>
                        {template.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                            {template.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            template.category === 'basic'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          }`}>
                            {template.category === 'basic' ? 'Basic' : 'Premium'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Empty State */}
              {!isLoadingTemplates && getFilteredTemplates().length === 0 && (
                <div className="text-center py-12">
                  <FiVideo className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-600" />
                  <p className="text-gray-500 dark:text-gray-400">No templates available</p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                    Templates will appear here once they're uploaded
                  </p>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedTemplate ? (
                    <span>Selected: <strong>{selectedTemplate}</strong></span>
                  ) : (
                    <span>Select a template to continue</span>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowTemplateGrid(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  {selectedTemplate && (
                    <button
                      onClick={() => setShowTemplateGrid(false)}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-lg"
                    >
                      Use Template
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCreatorPage;
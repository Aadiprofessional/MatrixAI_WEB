import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiVideo, FiUpload, FiPlay, FiPause, FiDownload, FiSliders, FiPlus, FiTrash, FiX, FiCheck, FiClock, FiList, FiVolume2, FiVolumeX, FiMaximize, FiMinimize, FiLoader, FiImage } from 'react-icons/fi';
import { ProFeatureAlert, AuthRequiredButton } from '../components';
import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAlert } from '../context/AlertContext';
import { videoService } from '../services/videoService';
import { uploadImageToStorage } from '../supabaseClient';

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
  origPrompt?: string; // Make optional to match enhanced API
  actualPrompt?: string; // Make optional to match enhanced API
  imageUrl?: string;
  ratio?: string;
  duration?: string;
  videoStyle?: string;
}

const VideoCreatorPage: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { userData, isPro } = useUser();
  const { user } = useAuth();
  const { t } = useLanguage();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { darkMode } = useTheme();
  const [prompt, setPrompt] = useState('');
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
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Style options for video
  const styleOptions = [
    { id: 'cinematic', name: 'Cinematic' },
    { id: 'animation', name: 'Animation' },
    { id: 'vintage', name: 'Vintage Film' },
    { id: 'documentary', name: 'Documentary' },
    { id: 'music-video', name: 'Music Video' },
    { id: 'scifi', name: 'Sci-Fi' },
  ];
  
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
        
        // Calculate time difference
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
        if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
        
        // Fall back to standard date format
        return date.toLocaleDateString();
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
      taskStatus: apiVideo.taskStatus || apiVideo.task_status || apiVideo.status || 'unknown',
      statusDisplay: getStatusDisplay(apiVideo.taskStatus || apiVideo.task_status || apiVideo.status || 'unknown'),
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
      videoStyle: apiVideo.videoStyle || apiVideo.video_style
    };
  }, []);
  
  const fetchVideoHistory = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoadingHistory(true);
    setHistoryError(null);
    
    try {
      // Use the POST method API endpoint
      const response = await videoService.getAllVideos(user.id);
      
      // Check if response has videos array
      if (!response.videos || !Array.isArray(response.videos)) {
        throw new Error('Invalid response format: missing videos array');
      }
      
      // Transform the video data to match our interface
      const transformedVideos = response.videos.map(transformVideoData);
      setVideoHistory(transformedVideos);
    } catch (err: any) {
      console.error('Error fetching video history:', err);
      setHistoryError(err.message || 'Failed to fetch video history');
      setVideoHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user?.id, transformVideoData]);

  // Fetch video history when component mounts or when history is toggled
  useEffect(() => {
    if (showHistory && user?.id) {
      // Fetch video history for the current user
      // This will now use the enhanced API endpoint
      fetchVideoHistory();
    }
  }, [showHistory, user?.id, fetchVideoHistory]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const startPolling = (videoId: string) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setInterval(async () => {
      try {
        if (!user?.id) return;
        
        const response = await videoService.getVideoStatus(user.id, videoId);
        console.log('Video status response:', response);
        
        // Update task status - server returns taskStatus, not status
        // Handle both direct taskStatus and nested details.task_status
        const currentTaskStatus = response.taskStatus || 
                                 (response.details && response.details.task_status) || 
                                 response.status || '';
        setTaskStatus(currentTaskStatus);
        
        // Update progress bar while processing
        if (currentTaskStatus === 'PENDING' || currentTaskStatus === 'RUNNING') {
          setProcessingProgress(prev => {
            const newProgress = prev + Math.random() * 2; // Slower increment during polling
            return newProgress > 95 ? 95 : newProgress;
          });
        }
        
        // Check if video is completed - server returns 'SUCCEEDED' status and videoUrl
        if ((currentTaskStatus === 'SUCCEEDED' || currentTaskStatus === 'COMPLETED') && response.videoUrl) {
          // Video is ready
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }
          setVideoUrl(response.videoUrl);
          setProcessingProgress(100);
          
          // Add prompt to recent prompts if not already there
          if (!presetPrompts.includes(prompt)) {
            setPresetPrompts(prev => [prompt, ...prev.slice(0, 3)]);
          }
          
          // Decrease free generations left if user is not pro
          if (!isPro) {
            setFreeGenerationsLeft(prev => prev - 1);
          }
          
          setTimeout(() => {
            setIsGenerating(false);
          }, 500);
        } else if (currentTaskStatus === 'FAILED') {
          // Video generation failed
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }
          setIsGenerating(false);
          setError(response.message || 'Video generation failed. Please try again.');
        }
        // Continue polling if status is still PENDING or RUNNING
      } catch (error: any) {
        console.error('Error checking video status:', error);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
        setIsGenerating(false);
        setError('Failed to check video status. Please try again.');
      }
    }, 1000); // Poll every 1 second as requested

    // Clear interval after 5 minutes to prevent infinite polling
    setTimeout(() => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        if (isGenerating) {
          setIsGenerating(false);
          setError('Video generation is taking longer than expected. Please try again later.');
        }
      }
    }, 300000); // 5 minutes timeout
  };

  const handleGenerateVideo = async () => {
    if (!prompt.trim() || !user?.id) return;
    
    // If user is not pro and has used all free generations, show pro alert
    if (!isPro && freeGenerationsLeft <= 0) {
      setShowProAlert(true);
      return;
    }
    
    setIsGenerating(true);
    setProcessingProgress(0);
    setError(null);
    setApiError(null);
    setVideoUrl(null);
    setCurrentVideoId(null);
    setTaskStatus('');
    
    // Start progress animation
    const progressInterval = setInterval(() => {
      setProcessingProgress(prev => {
        const newProgress = prev + Math.random() * 5;
        return newProgress > 95 ? 95 : newProgress;
      });
    }, 1000);
    
    try {
      // Get resolution dimensions
      const selectedResolution = resolutionOptions.find(r => r.id === resolution);
      const size = selectedResolution ? `${selectedResolution.width}*${selectedResolution.height}` : '1280*720';
      
      let response;
      
      // Check if we have an uploaded image
      if (uploadedImageUrl) {
        try {
          // Use the image-to-video API
          // Log the image URL being sent to the API
          console.log('Sending image URL to API:', uploadedImageUrl);
          
          // Ensure the image URL doesn't have extra spaces
          const cleanImageUrl = uploadedImageUrl.trim();
          
          // Use the videoService method instead of direct fetch
          response = await videoService.createVideoWithUrl(user.id, prompt, cleanImageUrl);
          console.log('Create video with image response:', response);
          
          // Check for error in response
          if (response.error) {
            setError(`Video generation failed: ${response.message || 'The server could not process your image. Please try a different image or prompt.'}`);
            setIsGenerating(false);
            return;
          }
          
          // If the API returns success immediately
          if (response.videoUrl && response.taskStatus === 'SUCCEEDED') {
            setVideoUrl(response.videoUrl);
            setProcessingProgress(100);
            setIsGenerating(false);
            clearInterval(progressInterval);
            return;
          }
        } catch (apiError: any) {
          console.error('API error:', apiError);
          
          // Handle different error status codes
          if (apiError.message.includes('500')) {
            setError('Server error: The video generation service is currently experiencing issues. This may be due to high demand or server maintenance. Please try again later.');
          } else {
            setError(apiError.message || 'Failed to connect to video generation service. Please check your internet connection and try again.');
          }
          
          setIsGenerating(false);
          return;
        }
      } else {
        // Use the standard text-to-video API
        response = await videoService.createVideo(user.id, prompt, size);
        console.log('Create video response:', response);
      }
      
      if (response.videoId) {
        setCurrentVideoId(response.videoId);
        // Server returns taskStatus in the response
        setTaskStatus(response.taskStatus || response.status || 'PENDING');
        
        // Start polling for video status
        startPolling(response.videoId);
        
        // Clear the progress interval since we're now polling
        clearInterval(progressInterval);
      } else {
        throw new Error(response.message || 'Failed to initiate video generation');
      }
    } catch (error: any) {
      console.error('Error generating video:', error);
      let errorMessage = error.message;
      
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
      clearInterval(progressInterval);
    }
  };

  const { showConfirmation, showError } = useAlert();

  const handleRemoveVideo = async (videoId: string) => {
    if (!user?.id) return;
    
    showConfirmation(
      'Are you sure you want to remove this video?',
      async () => {
        try {
          await videoService.removeVideo(user.id!, videoId);
          // Remove the video from the local state
          setVideoHistory(prev => prev.filter(video => video.videoId !== videoId));
        } catch (error: any) {
          console.error('Error removing video:', error);
          showError('Failed to remove the video. Please try again.');
        }
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
  
  const handleUploadImageClick = () => {
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
        
        // Validate file size and type
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          throw new Error('Image size exceeds 10MB limit. Please choose a smaller image.');
        }
        
        if (!file.type.startsWith('image/')) {
          throw new Error('Invalid file type. Please upload an image file.');
        }
        
        // Check if the file is HEIC format
        const isHeic = file.type === 'image/heic' || 
                      file.name.toLowerCase().endsWith('.heic') || 
                      file.name.toLowerCase().endsWith('.heif');
        
        if (isHeic) {
          setError('HEIC image format is not supported by the video generation API. Please convert your image to JPG or PNG format before uploading.');
          setUploadedImage(null);
          setIsUploadingImage(false);
          return;
        }
        
        // Upload image to Supabase storage
        console.log('Uploading image to Supabase storage...');
        const result = await uploadImageToStorage(file, user.id);
        console.log('Image upload successful, public URL:', result.publicUrl);
        
        // Ensure the URL is properly formatted and trimmed
        const cleanUrl = result.publicUrl.trim();
        setUploadedImageUrl(cleanUrl);
        
        // Reset video upload when image is uploaded
        setUploadedVideo(null);
        setVideoUrl(null);
        
        setIsUploadingImage(false);
      } catch (error: any) {
        console.error('Error uploading image:', error);
        setError(error.message || 'Failed to upload image. Please try again.');
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
    setProcessingProgress(0);
    setError(null);
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
  };

  const getStatusText = () => {
    // Special case for image upload
    if (uploadedImageUrl && isGenerating) {
      if (taskStatus === 'PENDING' || taskStatus === 'pending') {
        return 'Preparing your image for animation...';
      } else if (taskStatus === 'RUNNING' || taskStatus === 'PROCESSING' || taskStatus === 'processing') {
        return 'Animating your image...';
      } else if (taskStatus === 'FAILED' || taskStatus === 'failed') {
        return 'Animation failed. Please try a different image or prompt.';
      }
    }
    
    // Normalize status to lowercase for consistent comparison
    const normalizedStatus = taskStatus.toLowerCase();
    
    switch (normalizedStatus) {
      case 'pending':
        return 'Initializing video generation...';
      case 'running':
      case 'processing':
      case 'generating':
        return 'Generating video...';
      case 'succeeded':
      case 'completed':
        return 'Video generated successfully!';
      case 'failed':
        return 'Video generation failed';
      default:
        return 'Generating video...';
    }
  };

  return (
    <div className="container mx-auto max-w-6xl p-4 py-8">
      {showProAlert && (
        <ProFeatureAlert 
          featureName="Advanced Video Creation"
          onClose={() => setShowProAlert(false)}
        />
      )}
      
      <div className="mb-8">
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
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
            <div className="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 aspect-video flex flex-col items-center justify-center text-center p-6 relative overflow-hidden shadow-xl">
              {uploadedImageUrl ? (
                <>
                  <div className="relative w-full h-full overflow-hidden rounded-lg shadow-xl">
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
                    {isGenerating && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30 animate-pulse flex items-center justify-center z-20"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-slide-right z-30"></div>
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
                <div className="flex space-x-3">
                  <AuthRequiredButton
                    onClick={handleUploadImageClick}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:opacity-90 flex items-center shadow-lg transform transition-transform hover:scale-105"
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
              )}
              {uploadedImageUrl && !isGenerating && (
                <button
                  onClick={() => {
                    setUploadedImage(null);
                    setUploadedImageUrl(null);
                  }}
                  className="mt-4 px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 flex items-center"
                >
                  <FiTrash className="mr-2" />
                  Remove Image
                </button>
              )}
            </div>
          )}
        </div>
        
        <div className="lg:col-span-2">
          <div className="space-y-6">
            {/* Prompt Input */}
            <div>
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the video you want to generate..."
                  className="w-full p-4 pr-12 border rounded-lg shadow-sm h-24 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isGenerating}
                />
                <div className="absolute top-2 right-2">
                  <button 
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    disabled={isGenerating}
                  >
                    <FiSliders />
                  </button>
                </div>
              </div>
              
              {/* Advanced Settings */}
              {showAdvanced && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-4 border rounded-lg shadow-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Style</label>
                      <select 
                        value={style}
                        onChange={(e) => setStyle(e.target.value)}
                        className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600"
                        disabled={isGenerating}
                      >
                        {styleOptions.map(styleOption => (
                          <option key={styleOption.id} value={styleOption.id}>{styleOption.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Resolution</label>
                      <select 
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                        className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600"
                        disabled={isGenerating}
                      >
                        {resolutionOptions.map(option => (
                          <option key={option.id} value={option.id}>{option.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Duration (seconds)</label>
                      <input 
                        type="number" 
                        min="3" 
                        max={isPro ? "60" : "15"}
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600"
                      />
                      {!isPro && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {t('video.upgradeText') || 'Upgrade to Pro'} for videos up to 60 seconds
                        </p>
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
                {(error?.includes('HEIC image format')) && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 pl-6">
                    HEIC is an Apple image format that is not widely supported by web browsers and APIs. 
                    Please convert your image to JPG or PNG using an image converter tool before uploading.
                    <br/><br/>
                    <strong>Why this happens:</strong> HEIC images from iPhones are not compatible with our video generation API.
                    <br/>
                    <strong>How to fix:</strong> Use an image converter app or website to convert your HEIC image to JPG or PNG format.
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
                      className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-2.5 rounded-full transition-all duration-500"
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
                  disabled={!prompt.trim() || isUploadingImage}
                  className={`w-full py-3 rounded-lg font-medium flex items-center justify-center ${
                    !prompt.trim() || isUploadingImage
                      ? 'bg-gray-300 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                      : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white hover:opacity-90'
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
                className="border rounded-lg p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto"
              >
                <h3 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-300">Video History</h3>
                
                {isLoadingHistory ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg animate-pulse">
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
                      onClick={fetchVideoHistory}
                      className="mt-4 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-sm"
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
                      <div key={video.videoId} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        {/* Video Thumbnail */}
                        {video.videoUrl && (video.isReady || video.statusDisplay === 'Ready') && (
                          <div className="flex-shrink-0">
                            <video
                              src={video.videoUrl}
                              className="w-16 h-12 object-cover rounded border"
                              muted
                              preload="metadata"
                            />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {video.promptText}
                          </p>
                          <div className="flex items-center space-x-4 mt-1">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {video.ageDisplay}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {video.size}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              video.taskStatus === 'SUCCEEDED' || video.taskStatus === 'completed' || video.statusDisplay === 'Ready'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : video.taskStatus === 'RUNNING' || video.taskStatus === 'PENDING' || 
                                  video.taskStatus === 'processing' || video.taskStatus === 'generating' ||
                                  video.statusDisplay === 'Processing' || video.statusDisplay === 'Queued'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                : video.taskStatus === 'FAILED' || video.taskStatus === 'failed' || video.statusDisplay === 'Failed'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                            }`}>
                              {/* Use the statusDisplay field which is already formatted by transformVideoData */}
                              {video.statusDisplay}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          {video.videoUrl && (video.taskStatus === 'SUCCEEDED' || video.taskStatus === 'completed' || video.statusDisplay === 'Ready') && (
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
  );
};

export default VideoCreatorPage;
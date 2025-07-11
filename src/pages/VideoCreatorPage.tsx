import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiVideo, FiUpload, FiPlay, FiPause, FiDownload, FiSliders, FiPlus, FiTrash, FiX, FiCheck, FiClock, FiList } from 'react-icons/fi';
import { ProFeatureAlert } from '../components';
import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import { videoService } from '../services/videoService';

interface VideoHistoryItem {
  videoId: string;
  promptText: string;
  size: string;
  taskId: string;
  taskStatus: string;
  statusDisplay: string;
  isReady: boolean;
  hasVideo: boolean;
  videoUrl: string;
  createdAt: string;
  ageDisplay: string;
  apiType: string;
  requestId: string;
  submitTime: string;
  scheduledTime: string;
  endTime: string;
  origPrompt: string;
  actualPrompt: string;
  imageUrl?: string;
  ratio?: string;
  duration?: string;
  videoStyle?: string;
}

const VideoCreatorPage: React.FC = () => {
  const { userData, isPro } = useUser();
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [duration, setDuration] = useState(5);
  const [resolution, setResolution] = useState('720p');
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
  const [style, setStyle] = useState('cinematic');
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

  // Fetch video history when component mounts or when history is toggled
  useEffect(() => {
    if (showHistory && user?.id) {
      fetchVideoHistory();
    }
  }, [showHistory, user?.id]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Transform API video data to match VideoHistoryItem interface
  const transformVideoData = (apiVideo: any): VideoHistoryItem => {
    return {
      videoId: apiVideo.video_id,
      promptText: apiVideo.prompt_text,
      size: apiVideo.size || '1280*720',
      taskId: apiVideo.task_id || '',
      taskStatus: apiVideo.task_status || apiVideo.status || 'unknown',
      statusDisplay: apiVideo.task_status || apiVideo.status || 'unknown',
      isReady: apiVideo.task_status === 'SUCCEEDED' || apiVideo.status === 'completed',
      hasVideo: !!(apiVideo.video_url),
      videoUrl: apiVideo.video_url || '',
      createdAt: apiVideo.created_at,
      ageDisplay: new Date(apiVideo.created_at).toLocaleDateString(),
      apiType: 'video',
      requestId: apiVideo.request_id || '',
      submitTime: apiVideo.submit_time || apiVideo.created_at,
      scheduledTime: apiVideo.scheduled_time || '',
      endTime: apiVideo.end_time || '',
      origPrompt: apiVideo.prompt_text,
      actualPrompt: apiVideo.prompt_text,
      imageUrl: apiVideo.image_url,
      ratio: apiVideo.ratio,
      duration: apiVideo.duration,
      videoStyle: apiVideo.video_style
    };
  };

  const fetchVideoHistory = async () => {
    if (!user?.id) return;
    
    setIsLoadingHistory(true);
    setHistoryError(null);
    
    try {
      const response = await videoService.getAllVideos(user.id);
      const transformedVideos = (response.videos || []).map(transformVideoData);
      setVideoHistory(transformedVideos);
    } catch (err: any) {
      console.error('Error fetching video history:', err);
      setHistoryError(err.message);
    } finally {
      setIsLoadingHistory(false);
    }
  };

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
        const currentTaskStatus = response.taskStatus || response.status || '';
        setTaskStatus(currentTaskStatus);
        
        // Update progress bar while processing
        if (currentTaskStatus === 'PENDING' || currentTaskStatus === 'RUNNING') {
          setProcessingProgress(prev => {
            const newProgress = prev + Math.random() * 2; // Slower increment during polling
            return newProgress > 95 ? 95 : newProgress;
          });
        }
        
        // Check if video is completed - server returns 'SUCCEEDED' status and videoUrl
        if (currentTaskStatus === 'SUCCEEDED' && response.videoUrl) {
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
    }, 500); // Poll every 0.5 seconds (500ms)

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
      
      // Initiate video generation
      const response = await videoService.createVideo(user.id, prompt, size);
      console.log('Create video response:', response);
      
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
      setError(error.message);
      setIsGenerating(false);
      clearInterval(progressInterval);
    }
  };

  const handleRemoveVideo = async (videoId: string) => {
    if (!user?.id) return;
    
    if (window.confirm('Are you sure you want to remove this video?')) {
      try {
        await videoService.removeVideo(user.id, videoId);
        // Remove the video from the local state
        setVideoHistory(prev => prev.filter(video => video.videoId !== videoId));
      } catch (error: any) {
        console.error('Error removing video:', error);
        alert('Failed to remove the video. Please try again.');
      }
    }
  };
  
  const handlePlayPause = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  const handleVideoTimeUpdate = () => {
    if (!videoRef.current) return;
    
    // If video ends, reset to playing state to false
    if (videoRef.current.currentTime === videoRef.current.duration) {
      setIsPlaying(false);
    }
  };
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedVideo(file);
      // Create an object URL for the uploaded video
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      
      // Clean up old video URL if needed
      return () => {
        URL.revokeObjectURL(url);
      };
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
    switch (taskStatus) {
      case 'PENDING':
        return 'Initializing video generation...';
      case 'RUNNING':
        return 'Generating video...';
      case 'SUCCEEDED':
        return 'Video generated successfully!';
      case 'FAILED':
        return 'Video generation failed';
      case 'pending':
        return 'Initializing video generation...';
      case 'processing':
        return 'Setting up video generation...';
      case 'generating':
        return 'Generating video...';
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
          AI Video Creator
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-500 dark:text-gray-400"
        >
          Transform your ideas into high-quality videos with AI
        </motion.p>
        
        {!isPro && (
          <div className="mt-2 flex items-center text-sm text-yellow-600 dark:text-yellow-400">
            <FiVideo className="mr-1.5" />
            <span>{freeGenerationsLeft} free generation{freeGenerationsLeft !== 1 ? 's' : ''} left</span>
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
            <div className="relative rounded-lg overflow-hidden bg-black aspect-video shadow-lg">
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full h-full object-contain"
                onTimeUpdate={handleVideoTimeUpdate}
                onEnded={() => setIsPlaying(false)}
              />
              {/* Video Controls Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={handlePlayPause}
                  className="bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-4 text-white transition-all transform hover:scale-110"
                >
                  {isPlaying ? <FiPause size={24} /> : <FiPlay size={24} />}
                </button>
              </div>
              
              {/* Video Actions */}
              <div className="absolute bottom-3 right-3 flex space-x-2">
                <button
                  onClick={() => handleDownload(videoUrl, prompt)}
                  className="bg-black bg-opacity-70 hover:bg-opacity-90 rounded-full p-2 text-white"
                  title="Download video"
                >
                  <FiDownload size={18} />
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 aspect-video flex flex-col items-center justify-center text-center p-6">
              <FiVideo className="w-12 h-12 text-gray-400 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">No video generated yet</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mb-4">
                Enter a prompt describing the video you want to create, or upload a video to enhance
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleUploadClick}
                  className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center"
                >
                  <FiUpload className="mr-2" />
                  Upload Video
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="video/*"
                  className="hidden"
                />
              </div>
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
                          Upgrade to Pro for videos up to 60 seconds
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
            
            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg">
                <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
              </div>
            )}
            
            {/* Generate Button */}
            <div>
              {isGenerating ? (
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
                <button
                  onClick={handleGenerateVideo}
                  disabled={!prompt.trim() || !user?.id}
                  className={`w-full py-3 rounded-lg font-medium flex items-center justify-center ${
                    !prompt.trim() || !user?.id
                      ? 'bg-gray-300 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                      : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white hover:opacity-90'
                  } transition`}
                >
                  <FiVideo className="mr-2" />
                  Generate Video
                </button>
              )}
            </div>
            
            {/* History Button */}
            <div>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="w-full py-2 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center"
              >
                <FiList className="mr-2" />
                {showHistory ? 'Hide History' : 'Show History'}
              </button>
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
                        {video.videoUrl && video.isReady && (
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
                              video.taskStatus === 'SUCCEEDED' || video.taskStatus === 'completed'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : video.taskStatus === 'RUNNING' || video.taskStatus === 'PENDING' || video.taskStatus === 'processing'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                : video.taskStatus === 'FAILED' || video.taskStatus === 'failed'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                            }`}>
                              {video.taskStatus === 'SUCCEEDED' ? 'Ready' : 
                               video.taskStatus === 'RUNNING' ? 'Generating' :
                               video.taskStatus === 'PENDING' ? 'Pending' :
                               video.taskStatus === 'FAILED' ? 'Failed' :
                               video.statusDisplay}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          {video.videoUrl && (video.taskStatus === 'SUCCEEDED' || video.taskStatus === 'completed') && (
                            <>
                              <button
                                onClick={() => setVideoUrl(video.videoUrl)}
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
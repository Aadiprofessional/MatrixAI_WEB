import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiVideo, FiUpload, FiPlay, FiPause, FiDownload, FiSliders, FiPlus, FiTrash, FiX, FiCheck, FiClock } from 'react-icons/fi';
import { ProFeatureAlert } from '../components';
import { useUser } from '../context/UserContext';

const VideoCreatorPage: React.FC = () => {
  const { userData, isPro } = useUser();
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
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleGenerateVideo = async () => {
    if (!prompt.trim()) return;
    
    // If user is not pro and has used all free generations, show pro alert
    if (!isPro && freeGenerationsLeft <= 0) {
      setShowProAlert(true);
      return;
    }
    
    setIsGenerating(true);
    setProcessingProgress(0);
    
    const progressInterval = setInterval(() => {
      setProcessingProgress(prev => {
        const newProgress = prev + Math.random() * 10;
        return newProgress > 98 ? 98 : newProgress;
      });
    }, 800);
    
    try {
      // Simulate video generation API call
      await new Promise(resolve => setTimeout(resolve, 6000));
      
      // Sample placeholder video - in a real app, this would come from an API
      const demoVideo = 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4';
      setVideoUrl(demoVideo);
      
      // Add prompt to recent prompts if not already there
      if (!presetPrompts.includes(prompt)) {
        setPresetPrompts(prev => [prompt, ...prev.slice(0, 3)]);
      }
      
      // Decrease free generations left if user is not pro
      if (!isPro) {
        setFreeGenerationsLeft(prev => prev - 1);
      }
      
      clearInterval(progressInterval);
      setProcessingProgress(100);
    } catch (error) {
      console.error('Error generating video:', error);
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
      }, 500);
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
  
  const handleDownload = () => {
    if (!videoUrl) return;
    
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = `matrixai-video-${new Date().getTime()}.mp4`;
    link.click();
  };
  
  const cancelGeneration = () => {
    setIsGenerating(false);
    setProcessingProgress(0);
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
                  onClick={handleDownload}
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
                  placeholder="Describe the video you want to create..."
                  className="w-full p-4 pr-12 border rounded-lg shadow-sm h-32 dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="mt-4 p-4 border rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700"
                >
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 dark:text-gray-300">Video Style</label>
                      <select 
                        value={style}
                        onChange={(e) => setStyle(e.target.value)}
                        className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                        disabled={isGenerating}
                      >
                        {styleOptions.map(option => (
                          <option key={option.id} value={option.id}>{option.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 dark:text-gray-300">Resolution</label>
                      <select 
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                        className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                        disabled={isGenerating}
                      >
                        {resolutionOptions.map(option => (
                          <option key={option.id} value={option.id}>{option.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                        Duration: {duration} seconds
                      </label>
                      <input
                        type="range"
                        min="3"
                        max="15"
                        value={duration}
                        onChange={(e) => setDuration(parseInt(e.target.value))}
                        className="w-full"
                        disabled={isGenerating}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
            
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
                      <FiClock className="mr-1" /> Generating video...
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
                  disabled={!prompt.trim()}
                  className={`w-full py-3 rounded-lg font-medium flex items-center justify-center ${
                    !prompt.trim()
                      ? 'bg-gray-300 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                      : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white hover:opacity-90'
                  } transition`}
                >
                  <FiVideo className="mr-2" />
                  Generate Video
                </button>
              )}
            </div>
            
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
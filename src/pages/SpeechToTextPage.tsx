import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FiUpload, FiMic, FiFileText, FiClock, FiCheck, FiLoader, 
  FiX, FiGlobe, FiZap, FiSettings, FiVolume2, FiDownload,
  FiTrash, FiRefreshCw, FiPlay, FiPause, FiInfo, FiSearch, FiChevronLeft, FiGrid, FiList
} from 'react-icons/fi';
import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../supabaseClient';
import { ProFeatureAlert } from '../components';

// Define interface for files
interface AudioFile {
  audioid: string;
  audio_name: string;
  uploaded_at: string;
  duration: number;
  language: string;
  status: string;
  audio_url?: string;
}

const SpeechToTextPage: React.FC = () => {
  const { userData, isPro } = useUser();
  const { user } = useAuth();
  const { theme, getThemeColors } = useTheme();
  const navigate = useNavigate();
  const colors = getThemeColors();
  
  // File upload state
  const [isUploading, setIsUploading] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [duration, setDuration] = useState(0);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioPreviewRef = useRef<HTMLAudioElement>(null);
  
  // Files and UI state
  const [files, setFiles] = useState<AudioFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showProAlert, setShowProAlert] = useState(false);
  const [freeTranscriptionsLeft, setFreeTranscriptionsLeft] = useState(3);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLanguage, setFilterLanguage] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'duration'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedFile, setSelectedFile] = useState<AudioFile | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [loadingAudioIds, setLoadingAudioIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [supportedFormats] = useState([
    'audio/wav', 'audio/x-wav', 'audio/mpeg', 'audio/mp3', 'audio/mp4', 
    'audio/x-m4a', 'audio/aac', 'audio/ogg', 'audio/flac'
  ]);

  const [languages] = useState([
    { label: 'Bulgarian', value: 'bg' },
    { label: 'Catalan', value: 'ca' },
    { label: 'Chinese', value: 'zh' },
    { label: 'Czech', value: 'cs' },
    { label: 'Danish', value: 'da' },
    { label: 'Dutch', value: 'nl' },
    { label: 'English (US)', value: 'en-US' },
    { label: 'French', value: 'fr' },
    { label: 'German', value: 'de' },
    { label: 'Hindi', value: 'hi' },
    { label: 'Italian', value: 'it' },
    { label: 'Japanese', value: 'ja' },
    { label: 'Korean', value: 'ko' },
    { label: 'Portuguese', value: 'pt' },
    { label: 'Russian', value: 'ru' },
    { label: 'Spanish', value: 'es' },
  ]);

  useEffect(() => {
    if (user?.id) {
      loadFiles();
      checkFreeTranscriptionsLeft();
    }
  }, [user]);

  const checkFreeTranscriptionsLeft = async () => {
    try {
      if (isPro) {
        setFreeTranscriptionsLeft(Infinity);
        return;
      }
      
      const { data, error } = await supabase
        .from("user_usage")
        .select("free_transcriptions_left")
        .eq("uid", user?.id)
        .single();

      if (error) {
        console.error('Error checking free transcriptions:', error);
        return;
      }

      if (data) {
        setFreeTranscriptionsLeft(data.free_transcriptions_left);
      }
    } catch (error) {
      console.error('Error in checkFreeTranscriptionsLeft:', error);
    }
  };

  const loadFiles = async (forceRefresh = false) => {
    setIsLoading(true);
    
    try {
      // If not forcing a refresh, try to get data from local storage first
      if (!forceRefresh) {
        const cachedFiles = getFilesFromLocalStorage();
        if (cachedFiles && cachedFiles.length > 0) {
          console.log('Using cached files from local storage');
          setFiles(cachedFiles);
          setIsLoading(false);
          return;
        }
      }
      
      // If forcing refresh or no cached data, fetch from API
      const response = await fetch(`https://matrix-server.vercel.app/getAudio/${user?.id}`);
      
      // Check response content type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.log('Non-JSON response received');
        setFiles([]); // Set empty files array
        setIsLoading(false); // Stop loading
        return;
      }

      const data = await response.json();
      
      if (response.ok) {
        // Sort files by uploaded_at in descending order (newest first)
        const sortedFiles = (data.audioData || []).sort((a: AudioFile, b: AudioFile) => 
          new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
        );
        setFiles(sortedFiles);
        
        // Save to local storage for future use
        saveFilesToLocalStorage(sortedFiles);
      } else {
        console.log('Error fetching audio:', data.error);
        setFiles([]); // Set empty files array
      }
    } catch (error) {
      console.log('Error fetching audio:', error);
      setFiles([]); // Set empty files array
    } finally {
      setIsLoading(false); // Stop loading
      setIsRefreshing(false);
    }
  };

  const refreshFiles = () => {
    setIsRefreshing(true);
    loadFiles(true);
  };

  const getFilesFromLocalStorage = () => {
    try {
      const filesData = localStorage.getItem(`audio_files_${user?.id}`);
      return filesData ? JSON.parse(filesData) : null;
    } catch (error) {
      console.error('Error getting files from localStorage:', error);
      return null;
    }
  };

  const saveFilesToLocalStorage = (filesData: AudioFile[]) => {
    try {
      localStorage.setItem(`audio_files_${user?.id}`, JSON.stringify(filesData));
    } catch (error) {
      console.error('Error saving files to localStorage:', error);
    }
  };

  const generateAudioID = () => {
    return `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const isFormatSupported = (fileType: string) => {
    if (fileType) {
      if (fileType.toLowerCase().includes('wav')) {
        return true;
      }
      
      return supportedFormats.some(format => fileType.toLowerCase().includes(format.split('/')[1]));
    }
    return true;
  };

  const getFileExtension = (fileName: string) => {
    return fileName.split('.').pop()?.toLowerCase() || '';
  };

  const createAudioPreview = (file: File) => {
    // Create an object URL for audio preview
    const objectUrl = URL.createObjectURL(file);
    setAudioPreview(objectUrl);
    
    // Create new audio element to get duration
    const audio = new Audio(objectUrl);
    audio.addEventListener('loadedmetadata', () => {
      setDuration(Math.round(audio.duration));
    });
    
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const fileExtension = getFileExtension(file.name);
    
    if (!isFormatSupported(file.type) && !['wav', 'mp3', 'm4a', 'aac', 'ogg', 'flac', 'mp4'].includes(fileExtension)) {
      alert(`The file format ${fileExtension.toUpperCase()} is not supported. Please select a different audio file.`);
      return;
    }

    setAudioFile(file);
    
    // Create audio preview
    const cleanup = createAudioPreview(file);
    
    // Show advanced options
    setShowAdvancedOptions(true);
    
    return () => {
      cleanup();
    };
  };

  const toggleAudioPreview = () => {
    if (audioPreviewRef.current) {
      if (isAudioPlaying) {
        audioPreviewRef.current.pause();
      } else {
        audioPreviewRef.current.play();
      }
      setIsAudioPlaying(!isAudioPlaying);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const fileExtension = getFileExtension(file.name);
      
      if (!isFormatSupported(file.type) && !['wav', 'mp3', 'm4a', 'aac', 'ogg', 'flac', 'mp4'].includes(fileExtension)) {
        alert(`The file format ${fileExtension.toUpperCase()} is not supported. Please select a different audio file.`);
        return;
      }
      
      setAudioFile(file);
      
      // Create audio preview
      const cleanup = createAudioPreview(file);
      
      // Show advanced options
      setShowAdvancedOptions(true);
      
      return () => {
        cleanup();
      };
    }
  };

  const checkUserCoins = async (uid: string, requiredCoins: number) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("user_coins")
        .eq("uid", uid)
        .single();

      if (error) {
        console.error('Error checking user coins:', error);
        return false;
      }

      if (!data || data.user_coins < requiredCoins) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in checkUserCoins:', error);
      return false;
    }
  };

  const downloadAudio = async (file: AudioFile) => {
    if (!file.audio_url) {
      alert('Audio URL not available for download');
      return;
    }
    
    try {
      const link = document.createElement('a');
      link.href = file.audio_url;
      link.download = file.audio_name || `audio_${file.audioid}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download audio file');
    }
  };

  const deleteAudio = async (file: AudioFile) => {
    if (!user?.id || !file.audioid) {
      alert('Cannot delete file: Missing user ID or audio ID');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const response = await fetch('https://matrix-server.vercel.app/removeAudio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: user.id,
          audioid: file.audioid
        }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Remove from local state and storage
        const updatedFiles = files.filter(f => f.audioid !== file.audioid);
        setFiles(updatedFiles);
        saveFilesToLocalStorage(updatedFiles);
        alert('Audio file deleted successfully');
      } else {
        alert(`Failed to delete audio: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting audio:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`An error occurred while deleting the audio file: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      setIsDeleteModalOpen(false);
      setSelectedFile(null);
    }
  };

  // Apply filtering and sorting to files
  const getFilteredAndSortedFiles = () => {
    let filteredFiles = [...files];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredFiles = filteredFiles.filter(file => 
        file.audio_name.toLowerCase().includes(query)
      );
    }
    
    // Apply language filter
    if (filterLanguage !== 'all') {
      filteredFiles = filteredFiles.filter(file => file.language === filterLanguage);
    }
    
    // Apply sorting
    filteredFiles.sort((a, b) => {
      if (sortBy === 'date') {
        return sortDirection === 'desc'
          ? new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
          : new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime();
      } else if (sortBy === 'name') {
        return sortDirection === 'desc'
          ? b.audio_name.localeCompare(a.audio_name)
          : a.audio_name.localeCompare(b.audio_name);
      } else { // duration
        return sortDirection === 'desc'
          ? b.duration - a.duration
          : a.duration - b.duration;
      }
    });
    
    return filteredFiles;
  };

  const handleUpload = async () => {
    if (!audioFile || !user?.id) {
      alert('No file selected or user not logged in');
      return;
    }
    
    // Check if user has enough coins
    const hasEnoughCoins = await checkUserCoins(user.id, duration);
    
    if (!hasEnoughCoins && !isPro) {
      setShowProAlert(true);
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Generate a secure unique ID for the audio file
      const audioID = generateAudioID();
      
      // Set the loading state for this audio ID
      setLoadingAudioIds(prev => new Set(prev).add(audioID));
      
      const audioName = audioFile.name;
      const fileExtension = getFileExtension(audioName);
      
      // Create sanitized file path for Supabase storage
      const sanitizedFileName = `${audioID}.${fileExtension}`;
      const filePath = `users/${user.id}/audioFile/${sanitizedFileName}`;
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 15;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 500);
      
      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, audioFile, {
          cacheControl: '3600',
          upsert: false
        });
        
      clearInterval(progressInterval);
      setUploadProgress(100);
        
      if (uploadError) {
        console.error('Supabase storage upload error:', {
          message: uploadError.message,
          error: uploadError,
        });
        throw new Error(`Storage upload error: ${uploadError.message || 'Unknown error'}`);
      }
      
      // Get the public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(filePath);
        
      // Save metadata to database - without the model field
      const { data: metadataData, error: metadataError } = await supabase
        .from('audio_metadata')
        .insert([
          {
            uid: user.id,
            audioid: audioID,
            audio_name: audioName,
            language: selectedLanguage,
            audio_url: publicUrl,
            file_path: filePath,
            duration: parseInt(duration.toString(), 10),
            uploaded_at: new Date().toISOString(),
          }
        ]);
        
      if (metadataError) {
        console.error('Supabase metadata insert error:', {
          message: metadataError.message,
          error: metadataError,
        });
        throw new Error(`Metadata error: ${metadataError.message}`);
      }
      
      // Success - refresh the files list
      await loadFiles(true);
      
      // Start processing automatically
      await handleProcessAudio(audioID, publicUrl);
      
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setShowAdvancedOptions(false);
      setAudioFile(null);
      setAudioPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const handleProcessAudio = async (audioid: string, audioUrl: string) => {
    try {
      setIsProcessing(true);
      setLoadingAudioIds(prev => new Set(prev).add(audioid));
      
      console.log('audioid:', audioid, 'uid:', user?.id);
      console.log('Types:', typeof audioid, typeof user?.id);
      
      // Create a proper JSON object for the request body with string values
      const requestBody = JSON.stringify({
        uid: String(user?.id),
        audioid: String(audioid)
      });
      
      console.log('Request body:', requestBody);

      const response = await fetch('https://ddtgdhehxhgarkonvpfq.supabase.co/functions/v1/convertAudio', {
        method: 'POST',
        headers: { 
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: requestBody
      });

      // Log the raw response for debugging
      const responseText = await response.text();
      console.log('Raw response:', responseText);

      // Parse the response text as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        alert('Invalid response from server. Please try again later.');
        return;
      }

      if (response.ok && data.message === "Transcription completed and saved") {
        navigate(`/transcription/${audioid}`, {
          state: {
            uid: user?.id,
            audioid,
            transcription: data.transcription,
            audio_url: data.audio_url || audioUrl // Use audio_url from response if available, otherwise use our url
          }
        });
      } else {
        console.error('API Error:', data);
        alert(`Failed to process audio: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Network Error:', error);
      alert('Network error occurred. Please check your connection.');
    } finally {
      setIsProcessing(false);
      setLoadingAudioIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(audioid);
        return newSet;
      });
    }
  };

  const handleFileClick = (item: AudioFile) => {
    if (loadingAudioIds.has(item.audioid)) {
      // If already processing, do nothing
      return;
    }
    
    // If we have audio_url, we can navigate directly
    if (item.audio_url) {
      navigate(`/transcription/${item.audioid}`, {
        state: {
          uid: user?.id,
          audioid: item.audioid
        }
      });
    } else {
      // Otherwise, start processing
      handleProcessAudio(item.audioid, item.audio_url || '');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${
      theme === 'dark' 
        ? 'from-gray-900 via-gray-800 to-gray-900' 
        : 'from-gray-50 via-blue-50 to-gray-50'
    }`}>
      <div className="container mx-auto max-w-7xl p-4 py-8">
        {showProAlert && (
          <ProFeatureAlert 
            featureName="Unlimited Transcriptions"
            onClose={() => setShowProAlert(false)}
          />
        )}
        
        {/* Header section */}
        <div className="mb-8">
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
          >
            Speech to Text Converter
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl"
          >
            Transform your audio files into accurate text transcriptions with AI-powered technology
          </motion.p>
          
          {!isPro && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-3 flex items-center text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-md max-w-fit"
            >
              <FiMic className="mr-1.5" />
              <span>{freeTranscriptionsLeft} free transcriptions left today</span>
              {freeTranscriptionsLeft === 0 && (
                <button 
                  onClick={() => setShowProAlert(true)}
                  className="ml-2 text-blue-500 hover:text-blue-600 font-medium"
                >
                  Upgrade to Pro
                </button>
              )}
            </motion.div>
          )}
        </div>

        {/* File Upload Area */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div 
            className={`border-2 border-dashed rounded-xl p-8 transition-all ${
              audioFile 
                ? 'border-green-500 bg-green-50 dark:bg-green-900/10' 
                : 'border-gray-300 hover:border-blue-500 dark:border-gray-700 dark:hover:border-blue-500'
            } ${
              isUploading ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-500' : ''
            }`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {!audioFile ? (
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 bg-opacity-10 dark:bg-opacity-20">
                  <FiUpload className="h-10 w-10 text-blue-500 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Drag & drop your audio file here
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                  Supported formats: WAV, MP3, MP4, M4A, AAC, OGG, FLAC
                </p>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:opacity-90 cursor-pointer shadow-md hover:shadow-lg transition-all inline-flex items-center"
                  >
                    <FiUpload className="mr-2" />
                    Browse Files
                  </label>
                </div>
              </div>
            ) : isUploading ? (
              <div className="flex flex-col items-center">
                <div className="w-full max-w-md mb-4">
                  <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-1 text-sm text-gray-500 dark:text-gray-400">
                    <span>Uploading...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  {audioFile.name}
                </p>
                <p className="text-gray-500 dark:text-gray-500 animate-pulse">
                  Please wait while we upload your file
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <FiCheck className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                  File selected
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-1">
                  {audioFile.name}
                </p>
                <p className="text-gray-500 dark:text-gray-500 mb-4">
                  {(audioFile.size / (1024 * 1024)).toFixed(2)} MB • Estimated duration: {formatDuration(duration)}
                </p>
                
                {audioPreview && (
                  <div className="mb-4 flex items-center space-x-3">
                    <button
                      onClick={toggleAudioPreview}
                      className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      {isAudioPlaying ? <FiPause className="text-gray-700 dark:text-gray-300" /> : <FiPlay className="text-gray-700 dark:text-gray-300" />}
                    </button>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">
                      {isAudioPlaying ? 'Pause preview' : 'Play preview'}
                    </span>
                    <audio 
                      ref={audioPreviewRef}
                      src={audioPreview} 
                      onEnded={() => setIsAudioPlaying(false)}
                      className="hidden" 
                    />
                  </div>
                )}
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setAudioFile(null);
                      setAudioPreview(null);
                      setShowAdvancedOptions(false);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Advanced Options */}
          <AnimatePresence>
            {showAdvancedOptions && audioFile && !isUploading && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-6 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md dark:border dark:border-gray-700"
              >
                <h3 className="text-lg font-medium mb-6 dark:text-gray-300 border-b pb-3 dark:border-gray-700">Transcription Options</h3>
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-300">Language</label>
                  <div className="relative max-w-md">
                    <select 
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-gray-800 dark:text-gray-200 appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      {languages.map(language => (
                        <option key={language.value} value={language.value}>
                          {language.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <FiChevronLeft className="transform rotate-90 text-gray-400" />
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Select the primary language spoken in your audio
                  </p>
                </div>
                
                <div className="mt-8 flex justify-end">
                  <button
                    onClick={handleUpload}
                    disabled={isUploading || isProcessing}
                    className={`px-8 py-3 rounded-lg font-medium shadow-md flex items-center ${
                      isUploading || isProcessing
                        ? 'bg-gray-300 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                        : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white hover:shadow-lg'
                    } transition-all`}
                  >
                    {isUploading || isProcessing ? (
                      <>
                        <FiLoader className="animate-spin -ml-1 mr-2 h-5 w-5" />
                        {isUploading ? 'Uploading...' : 'Processing...'}
                      </>
                    ) : (
                      <>
                        <FiZap className="mr-2" />
                        Convert to Text
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Recent Transcriptions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-10"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Recent Transcriptions</h2>
            
            <div className="flex items-center space-x-2 mt-3 sm:mt-0">
              <button
                onClick={refreshFiles}
                disabled={isRefreshing}
                className={`p-2 text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`}
                title="Refresh"
              >
                <FiRefreshCw />
              </button>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-gray-800 dark:text-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto transition-colors"
                />
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              
              <div className="flex">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-l-lg border ${
                    viewMode === 'grid'
                      ? 'bg-blue-50 border-blue-500 text-blue-500 dark:bg-blue-900/30 dark:border-blue-500'
                      : 'border-gray-300 text-gray-500 dark:border-gray-600 dark:text-gray-400'
                  }`}
                >
                  <FiGrid />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-r-lg border-t border-b border-r ${
                    viewMode === 'list'
                      ? 'bg-blue-50 border-blue-500 text-blue-500 dark:bg-blue-900/30 dark:border-blue-500'
                      : 'border-gray-300 text-gray-500 dark:border-gray-600 dark:text-gray-400'
                  }`}
                >
                  <FiList />
                </button>
              </div>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="flex flex-col items-center">
                <FiLoader className="animate-spin h-8 w-8 text-blue-500 mb-4" />
                <span className="text-gray-600 dark:text-gray-400">Loading transcriptions...</span>
              </div>
            </div>
          ) : getFilteredAndSortedFiles().length > 0 ? (
            <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5' : 'space-y-4'}`}>
              {getFilteredAndSortedFiles().map((file, index) => (
                <motion.div
                  key={file.audioid}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg dark:border dark:border-gray-700 cursor-pointer transition-all overflow-hidden ${
                    viewMode === 'list' ? 'flex items-center' : ''
                  }`}
                >
                  <div
                    className={`${viewMode === 'list' ? 'flex-1 flex items-center p-4' : 'p-5'}`}
                    onClick={() => handleFileClick(file)}
                  >
                    <div className={`${viewMode === 'list' ? 'flex items-center w-full' : ''}`}>
                      <div className={`${viewMode === 'list' ? 'flex-1' : ''}`}>
                        <h3 className={`font-medium text-gray-800 dark:text-gray-300 truncate ${viewMode === 'list' ? 'text-lg' : 'mb-2'}`} title={file.audio_name}>
                          {file.audio_name}
                        </h3>
                        
                        <div className={`flex items-center text-sm text-gray-500 dark:text-gray-400 ${viewMode === 'list' ? 'mr-4' : 'mt-2'}`}>
                          <FiClock className="mr-1.5" />
                          <span>{formatDate(file.uploaded_at)}</span>
                        </div>
                        
                        <div className={`flex items-center text-sm text-gray-500 dark:text-gray-400 ${viewMode === 'list' ? 'mr-4' : 'mt-2'}`}>
                          <FiGlobe className="mr-1.5" />
                          <span>{languages.find(l => l.value === file.language)?.label || 'Unknown'}</span>
                          <span className="mx-2">•</span>
                          <span>{formatDuration(file.duration)}</span>
                        </div>
                      </div>
                      
                      <div className={`${
                        viewMode === 'list' ? 'ml-4' : 'absolute top-4 right-4'
                      }`}>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          loadingAudioIds.has(file.audioid)
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 flex items-center'
                            : file.status === 'completed'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                        }`}>
                          {loadingAudioIds.has(file.audioid) ? (
                            <>
                              <FiLoader className="animate-spin mr-1 h-3 w-3" />
                              Processing...
                            </>
                          ) : (
                            file.status === 'completed' ? 'Completed' : 'Processing'
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {viewMode === 'list' && (
                    <div className="flex items-center px-4">
                      <button 
                        onClick={() => downloadAudio(file)}
                        className="p-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                        title="Download audio"
                      >
                        <FiDownload />
                      </button>
                      <button 
                        onClick={() => { 
                          setSelectedFile(file);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-2 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors ml-1"
                        title="Delete"
                      >
                        <FiTrash />
                      </button>
                    </div>
                  )}
                  
                  {viewMode === 'grid' && (
                    <div className="mt-2 pt-3 px-5 pb-4 flex justify-between border-t dark:border-gray-700">
                      <button 
                        onClick={() => downloadAudio(file)}
                        className="text-sm flex items-center text-gray-600 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                      >
                        <FiDownload className="mr-1" /> Download
                      </button>
                      <button 
                        onClick={() => { 
                          setSelectedFile(file);
                          setIsDeleteModalOpen(true);
                        }}
                        className="text-sm flex items-center text-gray-600 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                      >
                        <FiTrash className="mr-1" /> Delete
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="p-10 bg-white dark:bg-gray-800 border border-dashed rounded-xl text-center dark:border-gray-700 shadow-sm">
              <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                <FiFileText className="h-10 w-10 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">No transcriptions yet</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                Upload an audio file to get started with your first transcription
              </p>
              <button
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.click();
                  }
                }}
                className="mt-6 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg shadow-md hover:shadow-lg transition-all inline-flex items-center"
              >
                <FiUpload className="mr-2" />
                Upload Audio File
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && selectedFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-xl"
            >
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500 mr-3">
                  <FiTrash />
                </div>
                <h3 className="text-lg font-medium dark:text-gray-200">Confirm Deletion</h3>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete <span className="font-medium">{selectedFile.audio_name}</span>? This action cannot be undone.
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedFile(null);
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteAudio(selectedFile)}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SpeechToTextPage; 
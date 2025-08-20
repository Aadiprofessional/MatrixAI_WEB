import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import './SpeechToTextPage.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FiUpload, FiMic, FiFileText, FiClock, FiCheck, FiLoader, 
  FiX, FiGlobe, FiZap, FiSettings, FiVolume2, FiDownload,
  FiTrash, FiRefreshCw, FiPlay, FiPause, FiInfo, FiSearch, FiChevronLeft, FiChevronRight, FiGrid, FiList, FiEdit3
} from 'react-icons/fi';
import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useAlert } from '../context/AlertContext';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import { ProFeatureAlert } from '../components';
import AuthRequiredButton from '../components/AuthRequiredButton';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

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
    background-image: linear-gradient(to right, #059669, #2563eb, #7c3aed);
  }
  .dark .animate-gradient-x {
    background-image: linear-gradient(to right, #ec4899, #eab308, #a855f7);
  }
`;
document.head.appendChild(gradientAnimationStyle);

// Define interface for files
interface AudioFile {
  audioid: string;
  uid: string;
  audio_url: string;
  file_path: string;
  language: string;
  duration: number;
  status?: string; // Make status optional since server might not always return it
  uploaded_at: string;
  transcription?: string;
  words_data?: Array<{
    word: string;
    start: number;
    end: number;
    confidence: number;
    punctuated_word: string;
  }>;
  error_message?: string;
  display_name?: string;
  audio_name?: string; // Add audio_name property
  video_file?: string; // Add video_file property for storing video URL
  // Computed field for display
}

// Lazy load the TranscriptionFileItem component
const TranscriptionFileItem = lazy(() => import('../components/TranscriptionFileItem'));

const SpeechToTextPage: React.FC = () => {
  const { userData, isPro } = useUser();
  const { user } = useAuth();
  const { theme, getThemeColors } = useTheme();
  const { showAlert, showError, showSuccess } = useAlert();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const colors = getThemeColors();
  
  // File upload state
  const [isUploading, setIsUploading] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [duration, setDuration] = useState(0);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioPreviewRef = useRef<HTMLAudioElement>(null);
  
  // Video processing state
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const [videoProcessingProgress, setVideoProcessingProgress] = useState(0);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [showVideoProcessingModal, setShowVideoProcessingModal] = useState(false);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  
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

  // Add state for editing
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingName, setEditingName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [filesPerPage] = useState(6);

  // Add polling intervals state
  const [pollingIntervals, setPollingIntervals] = useState<Map<string, NodeJS.Timeout>>(new Map());

  const [supportedFormats] = useState([
    'audio/wav', 'audio/x-wav', 'audio/mpeg', 'audio/mp3', 'audio/mp4', 
    'audio/x-m4a', 'audio/aac', 'audio/ogg', 'audio/flac',
    // Video formats
    'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 
    'video/webm', 'video/x-ms-wmv', 'video/3gpp', 'video/x-flv'
  ]);
  
  const [supportedVideoExtensions] = useState([
    'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', '3gp', 'mpg', 'mpeg'
  ]);
  
  const [supportedAudioExtensions] = useState([
    'wav', 'mp3', 'm4a', 'aac', 'ogg', 'flac'
  ]);

  const [languages] = useState([
    { label: t('speechToText.languages.bulgarian'), value: 'bg' },
    { label: t('speechToText.languages.catalan'), value: 'ca' },
    { label: t('speechToText.languages.chinese'), value: 'zh' },
    { label: t('speechToText.languages.czech'), value: 'cs' },
    { label: t('speechToText.languages.danish'), value: 'da' },
    { label: t('speechToText.languages.dutch'), value: 'nl' },
    { label: t('speechToText.languages.englishUS'), value: 'en-US' },
    { label: t('speechToText.languages.englishUK'), value: 'en-GB' },
    { label: t('speechToText.languages.french'), value: 'fr' },
    { label: t('speechToText.languages.german'), value: 'de' },
    { label: t('speechToText.languages.hindi'), value: 'hi' },
    { label: t('speechToText.languages.italian'), value: 'it' },
    { label: t('speechToText.languages.japanese'), value: 'ja' },
    { label: t('speechToText.languages.korean'), value: 'ko' },
    { label: t('speechToText.languages.portuguese'), value: 'pt' },
    { label: t('speechToText.languages.russian'), value: 'ru' },
    { label: t('speechToText.languages.spanish'), value: 'es' },
  ]);

  useEffect(() => {
    if (user?.id) {
      loadFiles(true); // Force refresh from API on initial load
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
          
          // Start polling for any files that are still processing
          cachedFiles.forEach((file: AudioFile) => {
            if (file.status === 'pending' || file.status === 'processing') {
              setLoadingAudioIds(prev => new Set(prev).add(file.audioid));
              startStatusPolling(file.audioid);
            }
          });
          return;
        }
      }
      
      // If forcing refresh or no cached data, fetch from correct API
      const response = await fetch('https://main-matrixai-server-lujmidrakh.cn-hangzhou.fcapp.run/api/audio/getAllAudioFiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: user?.id
        }),
      });
      
      // Check if response is ok first
      if (!response.ok) {
        console.log('API request failed with status:', response.status);
        setFiles([]);
        setIsLoading(false);
        return;
      }
      
      // Try to parse as JSON regardless of content-type header
      // (server sometimes returns wrong content-type but valid JSON)
      let data;
      try {
        data = await response.json();
        console.log('Successfully parsed JSON response:', data);
      } catch (jsonError) {
        console.log('Failed to parse JSON response:', jsonError);
        // If JSON parsing fails, try to read as text to debug
        try {
          const responseText = await response.text();
          console.log('Response text:', responseText);
        } catch (textError) {
          console.log('Failed to read response as text:', textError);
        }
        setFiles([]);
        setIsLoading(false);
        return;
      }
      
      if (data.success) {
        // Handle successful response
        const audioFiles = data.audioFiles || [];
        console.log('Raw audioFiles from API:', audioFiles);
        
        // Sort files by uploaded_at in descending order (newest first)
        const sortedFiles = audioFiles.map((file: any) => ({
          ...file,
          // Map server fields to frontend interface
          audio_url: file.audio_url || file.file_path, // Use audio_url or fallback to file_path
          audio_name: file.audio_name || file.audio_url?.split('/').pop()?.split('?')[0] || file.audioid,
          status: file.status || (file.transcription ? 'completed' : 'pending') // Set default status based on transcription
        })).sort((a: AudioFile, b: AudioFile) => 
          new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
        );
        
        console.log('Processed sortedFiles:', sortedFiles);
        setFiles(sortedFiles);
        
        // Save to local storage for future use with longer persistence
        saveFilesToLocalStorage(sortedFiles);
        
        // Start polling for any files that are still processing
        sortedFiles.forEach((file: AudioFile) => {
          if (file.status === 'pending' || file.status === 'processing') {
            setLoadingAudioIds(prev => new Set(prev).add(file.audioid));
            startStatusPolling(file.audioid);
          }
        });
        
        console.log('Successfully loaded', sortedFiles.length, 'audio files');
      } else {
        // Handle API error response
        console.log('API returned error:', data.message || data.error || 'Unknown error');
        setFiles([]);
      }
    } catch (error) {
      console.log('Network error fetching audio files:', error);
      setFiles([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const refreshFiles = () => {
    setIsRefreshing(true);
    loadFiles(true);
  };

  const getFilesFromLocalStorage = (): AudioFile[] | null => {
    try {
      // Try sessionStorage first (for current session)
      let storedData = sessionStorage.getItem('speechToTextFiles');
      
      // Fallback to localStorage if sessionStorage is empty
      if (!storedData) {
        storedData = localStorage.getItem('speechToTextFiles');
      }
      
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        
        // Check if data is recent (less than 24 hours old)
        const dataAge = Date.now() - (parsedData.timestamp || 0);
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (dataAge < maxAge && parsedData.files) {
          console.log('Using cached files from storage');
          return parsedData.files;
        } else {
          console.log('Cached data is too old, will refresh from API');
          // Clean up old data
          localStorage.removeItem('speechToTextFiles');
          sessionStorage.removeItem('speechToTextFiles');
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error retrieving files from storage:', error);
      return null;
    }
  };

  const saveFilesToLocalStorage = (files: AudioFile[]) => {
    try {
      const dataToStore = {
        files,
        timestamp: Date.now(),
        version: '1.0' // Add version for future compatibility
      };
      
      // Use both localStorage and sessionStorage for better persistence
      localStorage.setItem('speechToTextFiles', JSON.stringify(dataToStore));
      sessionStorage.setItem('speechToTextFiles', JSON.stringify(dataToStore));
      
      // Also save individual file data with extended expiry
      files.forEach(file => {
        const fileData = {
          ...file,
          cached_at: Date.now(),
          expires_at: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days expiry
        };
        localStorage.setItem(`audioFile-${file.audioid}`, JSON.stringify(fileData));
      });
      
      console.log('Files saved to storage successfully');
    } catch (error) {
      console.error('Error saving files to storage:', error);
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
  
  const isVideoFile = (file: File) => {
    const fileExtension = getFileExtension(file.name);
    return file.type.startsWith('video/') || supportedVideoExtensions.includes(fileExtension);
  };
  
  const isAudioFile = (file: File) => {
    const fileExtension = getFileExtension(file.name);
    return file.type.startsWith('audio/') || supportedAudioExtensions.includes(fileExtension);
  };
  
  // Initialize FFmpeg
  const initializeFFmpeg = async () => {
    if (ffmpegRef.current) return ffmpegRef.current;
    
    const ffmpeg = new FFmpeg();
    
    ffmpeg.on('log', ({ message }) => {
      console.log('FFmpeg log:', message);
    });
    
    ffmpeg.on('progress', ({ progress }) => {
      setVideoProcessingProgress(Math.round(progress * 100));
    });
    
    try {
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      
      ffmpegRef.current = ffmpeg;
      return ffmpeg;
    } catch (error) {
      console.error('Failed to initialize FFmpeg:', error);
      throw new Error('Failed to initialize video processing. Please try again.');
    }
  };
  
  // Extract audio from video file
  const extractAudioFromVideo = async (videoFile: File): Promise<File> => {
    setIsProcessingVideo(true);
    setVideoProcessingProgress(0);
    
    try {
      const ffmpeg = await initializeFFmpeg();
      
      const inputFileName = 'input.' + getFileExtension(videoFile.name);
      const outputFileName = 'output.mp3';
      
      // Write video file to FFmpeg filesystem
      await ffmpeg.writeFile(inputFileName, await fetchFile(videoFile));
      
      // Extract audio with optimized settings
      await ffmpeg.exec([
        '-i', inputFileName,
        '-vn', // No video
        '-acodec', 'mp3', // Audio codec
        '-ab', '128k', // Audio bitrate
        '-ar', '44100', // Audio sample rate
        '-y', // Overwrite output file
        outputFileName
      ]);
      
      // Read the output file
      const audioData = await ffmpeg.readFile(outputFileName);
      
      // Create a new File object with the extracted audio
      const audioBlob = new Blob([audioData], { type: 'audio/mp3' });
      const audioFileName = videoFile.name.replace(/\.[^/.]+$/, '') + '.mp3';
      const audioFile = new File([audioBlob], audioFileName, { type: 'audio/mp3' });
      
      // Clean up FFmpeg filesystem
      await ffmpeg.deleteFile(inputFileName);
      await ffmpeg.deleteFile(outputFileName);
      
      setVideoProcessingProgress(100);
      return audioFile;
      
    } catch (error) {
      console.error('Error extracting audio from video:', error);
      throw new Error('Failed to extract audio from video. Please try a different file.');
    } finally {
      setIsProcessingVideo(false);
      setVideoProcessingProgress(0);
    }
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
    
    // Check if file format is supported (audio or video)
    const isSupported = isFormatSupported(file.type) || 
                       supportedAudioExtensions.includes(fileExtension) || 
                       supportedVideoExtensions.includes(fileExtension);
    
    if (!isSupported) {
      showError(t('speechToText.errors.unsupportedFormat', { format: fileExtension.toUpperCase() }));
      return;
    }

    try {
      setOriginalFile(file);
      
      if (isVideoFile(file)) {
        // Handle video file - extract audio
        setShowVideoProcessingModal(true);
        
        const extractedAudioFile = await extractAudioFromVideo(file);
        setAudioFile(extractedAudioFile);
        
        // Create audio preview from extracted audio
        const cleanup = createAudioPreview(extractedAudioFile);
        
        setShowVideoProcessingModal(false);
        
        // Show advanced options
        setShowAdvancedOptions(true);
        
        return () => {
          cleanup();
        };
      } else if (isAudioFile(file)) {
        // Handle audio file directly
        setAudioFile(file);
        
        // Create audio preview
        const cleanup = createAudioPreview(file);
        
        // Show advanced options
        setShowAdvancedOptions(true);
        
        return () => {
          cleanup();
        };
      } else {
          console.error('Unsupported format:', fileExtension.toUpperCase());
        }
      } catch (error) {
        console.error('Error processing file:', error);
        setShowVideoProcessingModal(false);
      }
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

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const fileExtension = getFileExtension(file.name);
      
      // Check if file format is supported (audio or video)
      const isSupported = isFormatSupported(file.type) || 
                         supportedAudioExtensions.includes(fileExtension) || 
                         supportedVideoExtensions.includes(fileExtension);
      
      if (!isSupported) {
        console.error('Unsupported format:', fileExtension.toUpperCase());
        return;
      }
      
      try {
        setOriginalFile(file);
        
        if (isVideoFile(file)) {
          // Handle video file - extract audio
          setShowVideoProcessingModal(true);
          
          const extractedAudioFile = await extractAudioFromVideo(file);
          setAudioFile(extractedAudioFile);
          
          // Create audio preview from extracted audio
          const cleanup = createAudioPreview(extractedAudioFile);
          
          setShowVideoProcessingModal(false);
          
          // Show advanced options
          setShowAdvancedOptions(true);
          
          return () => {
            cleanup();
          };
        } else if (isAudioFile(file)) {
          // Handle audio file directly
          setAudioFile(file);
          
          // Create audio preview
          const cleanup = createAudioPreview(file);
          
          // Show advanced options
          setShowAdvancedOptions(true);
          
          return () => {
            cleanup();
          };
        } else {
          console.error('Unsupported format:', fileExtension.toUpperCase());
        }
      } catch (error) {
        console.error('Error processing file:', error);
        setShowVideoProcessingModal(false);
      }
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
      showError(t('speechToText.errors.audioUrlNotAvailable'));
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
      showError(t('speechToText.errors.downloadFailed'));
    }
  };

  const deleteAudio = async (file: AudioFile) => {
    if (!user?.id || !file.audioid) {
      showError(t('speechToText.errors.cannotDelete'));
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Use the correct removeAudio API endpoint
      const response = await fetch('https://main-matrixai-server-lujmidrakh.cn-hangzhou.fcapp.run/api/audio/removeAudio', {
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
      
      if (response.ok && !result.error) {
        // Remove from local state and storage
        const updatedFiles = files.filter(f => f.audioid !== file.audioid);
        setFiles(updatedFiles);
        saveFilesToLocalStorage(updatedFiles);
        showSuccess(t('speechToText.success.audioDeleted'));
        
        // Also clear any polling for this audio ID
        const existingInterval = pollingIntervals.get(file.audioid);
        if (existingInterval) {
          clearInterval(existingInterval);
          setPollingIntervals(prev => {
            const newMap = new Map(prev);
            newMap.delete(file.audioid);
            return newMap;
          });
        }
        
        // Remove from loading state
        setLoadingAudioIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(file.audioid);
          return newSet;
        });
      } else {
        showError(t('speechToText.errors.deleteFailed', { error: result.error || result.message || t('speechToText.errors.unknownError') }));
      }
    } catch (error) {
      console.error('Error deleting audio:', error);
      const errorMessage = error instanceof Error ? error.message : t('speechToText.errors.unknownErrorOccurred');
      showError(t('speechToText.errors.deleteError', { error: errorMessage }));
    } finally {
      setIsLoading(false);
      setIsDeleteModalOpen(false);
      setSelectedFile(null);
    }
  };

  // Add function to edit audio name
  const editAudioName = async (file: AudioFile, newName: string) => {
    if (!user?.id || !file.audioid || !newName.trim()) {
      showError(t('speechToText.errors.cannotEdit'));
      return;
    }
    
    try {
      setIsEditingName(true);
      const response = await fetch('https://main-matrixai-server-lujmidrakh.cn-hangzhou.fcapp.run/api/audio/editAudio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: user.id,
          audioid: file.audioid,
          updatedName: newName.trim()
        }),
      });
      
      const result = await response.json();
      
      if (response.ok && !result.error) {
        // Update local state and storage
        const updatedFiles = files.map(f => 
          f.audioid === file.audioid 
            ? { ...f, audio_name: newName.trim() }
            : f
        );
        setFiles(updatedFiles);
        saveFilesToLocalStorage(updatedFiles);
        showSuccess(t('speechToText.success.nameUpdated'));
        setIsEditModalOpen(false);
        setSelectedFile(null);
        setEditingName('');
      } else {
        showError(t('speechToText.errors.updateNameFailed', { error: result.error || result.message || t('speechToText.errors.unknownError') }));
      }
    } catch (error) {
      console.error('Error editing audio name:', error);
      showError(t('speechToText.errors.updateNameError'));
    } finally {
      setIsEditingName(false);
    }
  };

  const openEditModal = (file: AudioFile) => {
    setSelectedFile(file);
    setEditingName(file.audio_name || file.audio_url?.split('/').pop() || ''); // Use existing name or derive from URL
    setIsEditModalOpen(true);
  };

  const getDisplayName = (file: AudioFile): string => {
    return file.audio_name || file.audio_url?.split('/').pop()?.split('?')[0] || file.audioid;
  };

  // Apply filtering and sorting to files
  const getFilteredAndSortedFiles = () => {
    let filteredFiles = [...files];
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredFiles = filteredFiles.filter(file => 
        getDisplayName(file).toLowerCase().includes(query)
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
        const aName = getDisplayName(a);
        const bName = getDisplayName(b);
        return sortDirection === 'desc'
          ? bName.localeCompare(aName)
          : aName.localeCompare(bName);
      } else { // duration
        return sortDirection === 'desc'
          ? b.duration - a.duration
          : a.duration - b.duration;
      }
    });
    
    return filteredFiles;
  };

  // Pagination logic
  const totalPages = Math.ceil(getFilteredAndSortedFiles().length / filesPerPage);
  const paginatedFiles = getFilteredAndSortedFiles().slice(
    (page - 1) * filesPerPage,
    page * filesPerPage
  );

  const nextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const prevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterLanguage, sortBy, sortDirection]);

  // Clean up polling intervals on unmount
  useEffect(() => {
    return () => {
      pollingIntervals.forEach(interval => clearInterval(interval));
    };
  }, [pollingIntervals]);

  // Function to start status polling
  const startStatusPolling = (audioid: string) => {
    // Clear any existing interval for this audio ID
    const existingInterval = pollingIntervals.get(audioid);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    const interval = setInterval(async () => {
      try {
        const response = await fetch('https://main-matrixai-server-lujmidrakh.cn-hangzhou.fcapp.run/api/audio/getAudioStatus', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid: user?.id,
            audioid: audioid
          }),
        });

        const data = await response.json();
        
        if (response.ok && data.success && data.status === 'completed') {
          // Stop polling for this audio
          clearInterval(interval);
          setPollingIntervals(prev => {
            const newMap = new Map(prev);
            newMap.delete(audioid);
            return newMap;
          });
          
          // Remove from loading state
          setLoadingAudioIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(audioid);
            return newSet;
          });
          
          // Update files list to reflect completion
          setFiles(prevFiles => 
            prevFiles.map(file => 
              file.audioid === audioid 
                ? { ...file, status: 'completed' }
                : file
            )
          );
          
          // Save updated files to localStorage
          const updatedFiles = files.map(file => 
            file.audioid === audioid 
              ? { ...file, status: 'completed' }
              : file
          );
          saveFilesToLocalStorage(updatedFiles);
          
          // Navigate to transcription page
          navigate(`/transcription/${audioid}`, {
            state: {
              uid: user?.id,
              audioid: audioid
            }
          });
        } else if (response.ok && data.success && data.status === 'failed') {
          // Stop polling on failure
          clearInterval(interval);
          setPollingIntervals(prev => {
            const newMap = new Map(prev);
            newMap.delete(audioid);
            return newMap;
          });
          
          // Remove from loading state
          setLoadingAudioIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(audioid);
            return newSet;
          });
          
          // Update files list to reflect failure
          setFiles(prevFiles => 
            prevFiles.map(file => 
              file.audioid === audioid 
                ? { ...file, status: 'failed', error_message: data.error_message }
                : file
            )
          );
          
          showError(t('speechToText.errors.transcriptionFailed', { error: data.error_message || t('speechToText.errors.unknownError') }));
        }
      } catch (error) {
        console.error('Error polling status for', audioid, ':', error);
      }
    }, 2000); // Poll every 2 seconds

    // Store the interval
    setPollingIntervals(prev => new Map(prev).set(audioid, interval));
  };

  // Updated handleUpload function to use correct API
  const handleUpload = async () => {
    if (!audioFile || !user?.id) {
      showError(t('speechToText.errors.noFileOrUser'));
      return;
    }
    
    // Check if user has enough coins (you might want to remove this check if the new API handles it)
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
      
      const audioName = audioFile.name;
      const fileExtension = getFileExtension(audioName);
      
      // Create sanitized file path for Supabase storage
      const sanitizedFileName = `${audioID}.${fileExtension}`;
      const filePath = `users/${user.id}/audioFile/${sanitizedFileName}`;
      
      // Handle video file upload if original file was a video
      let videoUrl = null;
      if (originalFile && isVideoFile(originalFile)) {
        // Upload original video file to storage
        const videoFileExtension = getFileExtension(originalFile.name);
        const sanitizedVideoFileName = `${audioID}_video.${videoFileExtension}`;
        const videoFilePath = `users/${user.id}/videoFile/${sanitizedVideoFileName}`;
        
        const { data: videoUploadData, error: videoUploadError } = await supabase.storage
          .from('user-uploads')
          .upload(videoFilePath, originalFile, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (videoUploadError) {
          console.error('Video upload error:', videoUploadError);
          throw new Error(`Video upload error: ${videoUploadError.message || 'Unknown error'}`);
        }
        
        // Get the public URL for the uploaded video file
        const { data: { publicUrl: videoPublicUrl } } = supabase.storage
          .from('user-uploads')
          .getPublicUrl(videoFilePath);
          
        videoUrl = videoPublicUrl;
      }
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 15;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 500);
      
      // Upload audio file to Supabase storage
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
      
      // Get the public URL for the uploaded audio file
      const { data: { publicUrl } } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(filePath);
        
      // Prepare API payload with video URL if available
      const apiPayload = {
        uid: user.id,
        audioUrl: publicUrl,
        language: selectedLanguage,
        duration: duration,
        audio_name: audioName,
        ...(videoUrl && { video_file: videoUrl }) // Add video_file only if videoUrl exists
      };
        
      // Now use the correct uploadAudioUrl API
      const uploadResponse = await fetch('https://main-matrixai-server-lujmidrakh.cn-hangzhou.fcapp.run/api/audio/uploadAudioUrl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiPayload),
      });

      const uploadResult = await uploadResponse.json();
      
      if (uploadResponse.ok && uploadResult.success) {
        // The server now processes immediately, so check if it's completed
        if (uploadResult.status === 'completed') {
          // Navigate directly to transcription page
          navigate(`/transcription/${uploadResult.audioid}`, {
            state: {
              uid: user.id,
              audioid: uploadResult.audioid,
              transcription: uploadResult.transcription,
              audio_url: publicUrl,
              audio_name: audioName,
              language: selectedLanguage,
              duration: duration,
              ...(videoUrl && { video_file: videoUrl }) // Add video_file only if videoUrl exists
            }
          });
        } else {
          // Set the loading state for this audio ID if still processing
          setLoadingAudioIds(prev => new Set(prev).add(uploadResult.audioid));
          
          // Add the new file to the files list immediately
          const newFile: AudioFile = {
            audioid: uploadResult.audioid,
            uid: user.id,
            audio_url: publicUrl,
            file_path: publicUrl,
            language: selectedLanguage,
            duration: duration,
            status: uploadResult.status || 'pending',
            uploaded_at: new Date().toISOString(),
            audio_name: audioName,
            transcription: uploadResult.transcription,
            error_message: uploadResult.error_message,
            ...(videoUrl && { video_file: videoUrl }) // Add video_file only if videoUrl exists
          };
          
          setFiles(prevFiles => [newFile, ...prevFiles]);
          
          // Save to localStorage
          const updatedFiles = [newFile, ...files];
          saveFilesToLocalStorage(updatedFiles);
          
          // Start polling for status if not completed
          if (uploadResult.status !== 'completed') {
            startStatusPolling(uploadResult.audioid);
          }
        }
        
      } else {
        throw new Error(`Upload API error: ${uploadResult.error || uploadResult.message || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      showError(t('speechToText.errors.uploadFailed', { error: error instanceof Error ? error.message : t('speechToText.errors.unknownError') }));
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
  
  // Remove the old handleProcessAudio function and replace with new getAudioFile logic
  const handleFileClick = async (item: AudioFile) => {
    if (loadingAudioIds.has(item.audioid)) {
      // If already processing, do nothing
      return;
    }
    
    // If the file already has a completed status and transcription, navigate directly
    if (item.status === 'completed' && item.transcription) {
      navigate(`/transcription/${item.audioid}`, {
        state: {
          uid: user?.id,
          audioid: item.audioid,
          transcription: item.transcription,
          audio_url: item.audio_url,
          words_data: item.words_data,
          audio_name: item.audio_name,
          language: item.language,
          duration: item.duration,
          ...(item.video_file && { video_file: item.video_file }) // Add video_file only if it exists
        }
      });
      return;
    }
    
    // Always fetch the latest file data using the correct API
    try {
      const response = await fetch('https://main-matrixai-server-lujmidrakh.cn-hangzhou.fcapp.run/api/audio/getAudioFile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: user?.id,
          audioid: item.audioid
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        if (data.status === 'completed' || data.transcription) {
          // Navigate to transcription page with the data
          navigate(`/transcription/${item.audioid}`, {
            state: {
              uid: user?.id,
              audioid: item.audioid,
              transcription: data.transcription,
              audio_url: data.audioUrl || data.audio_url,
              words_data: data.words_data,
              audio_name: data.audio_name,
              language: data.language,
              duration: data.duration,
              ...(data.video_file && { video_file: data.video_file }) // Add video_file only if it exists
            }
          });
        } else {
          // If still processing, start polling
          setLoadingAudioIds(prev => new Set(prev).add(item.audioid));
          startStatusPolling(item.audioid);
        }
      } else {
        showError(t('speechToText.errors.getAudioDataFailed', { error: data.error || data.message || t('speechToText.errors.unknownError') }));
      }
    } catch (error) {
      console.error('Error fetching audio file:', error);
      showError(t('speechToText.errors.networkError'));
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

  const clearExpiredCache = () => {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('audioFile-')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          if (data.expires_at && Date.now() > data.expires_at) {
            keysToRemove.push(key);
          }
        } catch (error) {
          keysToRemove.push(key);
        }
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  };

  // Clear expired cache on component mount
  useEffect(() => {
    clearExpiredCache();
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced background gradient effect */}
      <div className="absolute inset-0 bg-white dark:bg-black z-0"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/30 dark:from-indigo-900/30 via-transparent to-purple-100/30 dark:to-purple-900/30 z-0"></div>
      
      {/* Subtle gradient from bottom to create a fade effect */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-white dark:from-black to-transparent z-0"></div>
      
      {/* Subtle grid lines with animation */}
      <div className="absolute inset-0 opacity-10 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] animate-gridMove"></div>
      
      <div className="flex-1 flex flex-col relative z-10">
        <div className="flex-1 p-0">
          <div className="max-w-7xl mx-auto px-1 sm:px-2 py-2 sm:py-4">
        {showProAlert && (
          <div className="mx-2">
            <ProFeatureAlert 
              featureName={t('speechToText.unlimitedTranscriptions')}
              onClose={() => setShowProAlert(false)}
            />
          </div>
        )}
        
        {/* Header section */}
        <div className="mb-6 sm:mb-8 mx-1 sm:mx-2">
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl sm:text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-yellow-500 to-purple-500 animate-gradient-x"
          >
            {t('speechToText.title')}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-500 dark:text-gray-400 text-base sm:text-lg max-w-2xl"
          >
            {t('speechToText.subtitle')}
          </motion.p>
          
          {!isPro && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-3 flex items-center text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-md max-w-fit"
            >
              <FiMic className="mr-1.5" />
              <span>{freeTranscriptionsLeft} {freeTranscriptionsLeft === 1 ? t('speechToText.freeLeft') : t('speechToText.freeLeftPlural')} {t('speechToText.leftToday')}</span>
              {freeTranscriptionsLeft === 0 && (
                <button 
                  onClick={() => setShowProAlert(true)}
                  className="ml-2 text-blue-500 hover:text-blue-600 font-medium"
                >
                  {t('speechToText.upgradeText')}
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
          className="mb-6 sm:mb-8"
        >
          <div 
            className={`border-2 border-dashed rounded-xl p-4 sm:p-8 m-1 sm:m-2 transition-all ${
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
                  {t('speechToText.dragDropText')}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                  {t('speechToText.supportedFormats')}
                </p>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*,video/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <AuthRequiredButton
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.click();
                      }
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:opacity-90 cursor-pointer shadow-md hover:shadow-lg transition-all inline-flex items-center"
                  >
                    <FiUpload className="mr-2" />
                    {t('speechToText.browseFiles')}
                  </AuthRequiredButton>
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
                    <span>{t('speechToText.uploading')}</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  {audioFile.name}
                </p>
                <p className="text-gray-500 dark:text-gray-500 animate-pulse">
                  {t('speechToText.uploadWait')}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <FiCheck className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('speechToText.fileSelected')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-1">
                  {audioFile.name}
                </p>
                <p className="text-gray-500 dark:text-gray-500 mb-4">
                  {(audioFile.size / (1024 * 1024)).toFixed(2)} {t('speechToText.mb')} • {t('speechToText.estimatedDuration')}: {formatDuration(duration)}
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
                      {isAudioPlaying ? t('speechToText.pausePreview') : t('speechToText.playPreview')}
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
                    {t('speechToText.cancel')}
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
                className="mt-6 p-6 m-2 bg-white dark:bg-gray-800 rounded-xl shadow-md dark:border dark:border-gray-700"
              >
                <div className="relative">
                  <h3 className="text-xl font-semibold mb-6 dark:text-gray-200 text-gray-800 flex items-center">
                    <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full mr-3"></div>
                    {t('speechToText.transcriptionOptions')}
                  </h3>
                  
                  {/* Guidance Text */}
                  <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-700/50">
                    <div className="flex items-center mb-2">
                      <FiInfo className="text-blue-500 mr-2 flex-shrink-0" />
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Please select the language in which you want the transcription
                      </p>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-300 ml-6">
                      Choose the primary language spoken in your audio file for best results
                    </p>
                  </div>

                  {/* Language Selector and Convert Button in Same Line */}
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                    {/* Language Selector with Animation */}
                    <div className="flex-1 min-w-0">
                      <label className="block text-sm font-medium mb-3 dark:text-gray-300 text-gray-700">
                        <FiGlobe className="inline mr-2 text-blue-500" />
                        {t('speechToText.language')}
                      </label>
                      <div className="relative">
                        {/* Animated Border */}
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-lg opacity-30 animate-pulse"></div>
                        <div className="relative">
                          <select 
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(e.target.value)}
                            className="w-full p-4 border-2 rounded-lg dark:bg-gray-700 dark:border-gray-600 bg-white border-gray-300 text-gray-800 dark:text-gray-200 appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 hover:border-blue-400 dark:hover:border-blue-500 font-medium"
                          >
                            {languages.map(language => (
                              <option key={language.value} value={language.value}>
                                {language.label}
                              </option>
                            ))}
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                            <FiChevronLeft className="transform rotate-90 text-gray-400 w-5 h-5" />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Convert Button */}
                    <div className="w-full sm:w-auto">
                      <AuthRequiredButton
                        onClick={handleUpload}
                        disabled={isUploading}
                        className={`w-full sm:w-auto px-8 py-4 rounded-lg font-semibold shadow-lg flex items-center justify-center min-w-[200px] ${
                          isUploading
                            ? 'bg-gray-300 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white hover:shadow-xl hover:scale-105 animate-gradient-x'
                        } transition-all duration-300`}
                      >
                        {isUploading ? (
                          <>
                            <FiLoader className="animate-spin -ml-1 mr-3 h-5 w-5" />
                            <span>{t('speechToText.uploading')}...</span>
                          </>
                        ) : (
                          <>
                            <FiZap className="mr-3 h-5 w-5" />
                            <span>{t('speechToText.convertToText')}</span>
                          </>
                        )}
                      </AuthRequiredButton>
                    </div>
                  </div>
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
          className="mt-6 sm:mt-10 mx-1 sm:mx-2"
        >
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200">{t('speechToText.recentTranscriptions')}</h2>
            
            <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-2">
              <div className="flex items-center space-x-2">
                <button
                  onClick={refreshFiles}
                  disabled={isRefreshing}
                  className={`p-2 text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`}
                  title={t('speechToText.refresh')}
                >
                  <FiRefreshCw />
                </button>
                
                <div className="relative flex-1 sm:flex-none">
                  <input
                    type="text"
                    placeholder={t('speechToText.searchPlaceholder')}
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
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="flex flex-col items-center">
                <FiLoader className="animate-spin h-8 w-8 text-blue-500 mb-4" />
                <span className="text-gray-600 dark:text-gray-400">{t('speechToText.loadingTranscription')}</span>
              </div>
            </div>
          ) : getFilteredAndSortedFiles().length > 0 ? (
            <>
              <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5' : 'space-y-4'}`}>
                {paginatedFiles.map((file, index) => (
                  <Suspense key={file.audioid} fallback={
                    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-md h-32 animate-pulse m-2"></div>
                  }>
                    <TranscriptionFileItem
                      file={file}
                      index={index}
                      viewMode={viewMode}
                      loadingAudioIds={loadingAudioIds}
                      getDisplayName={getDisplayName}
                      formatDate={formatDate}
                      formatDuration={formatDuration}
                      handleFileClick={handleFileClick}
                      downloadAudio={downloadAudio}
                      openEditModal={openEditModal}
                      setSelectedFile={setSelectedFile}
                      setIsDeleteModalOpen={setIsDeleteModalOpen}
                      languages={languages}
                    />
                  </Suspense>
                ))}
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center mt-6 sm:mt-8 space-x-2 sm:space-x-4">
                  <button
                    onClick={prevPage}
                    disabled={page === 1}
                    className={`flex items-center px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base ${
                      page === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700'
                    }`}
                  >
                    <FiChevronLeft className="mr-1" />
                    <span className="hidden sm:inline">{t('speechToText.previous')}</span>
                    <span className="sm:hidden">Prev</span>
                  </button>
                  
                  <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base px-2">
                    {page}/{totalPages}
                  </span>
                  
                  <button
                    onClick={nextPage}
                    disabled={page === totalPages}
                    className={`flex items-center px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base ${
                      page === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="hidden sm:inline">{t('speechToText.next')}</span>
                    <span className="sm:hidden">Next</span>
                    <FiChevronRight className="ml-1" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="p-10 bg-white dark:bg-gray-800 border border-dashed rounded-xl text-center dark:border-gray-700 shadow-sm">
              <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                <FiFileText className="h-10 w-10 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">{t('speechToText.noTranscriptionsYet')}</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                {t('speechToText.startByUploading')}
              </p>
              <AuthRequiredButton
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.click();
                  }
                }}
                className="mt-6 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg shadow-md hover:shadow-lg transition-all inline-flex items-center"
              >
                <FiUpload className="mr-2" />
                {t('speechToText.browseFiles')}
              </AuthRequiredButton>
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
                <h3 className="text-lg font-medium dark:text-gray-200">{t('speechToText.deleteConfirmation')}</h3>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t('speechToText.deleteConfirmationMessage')}
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedFile(null);
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors"
                >
                  {t('speechToText.cancel')}
                </button>
                <button
                  onClick={() => deleteAudio(selectedFile)}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  {t('speechToText.delete')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Name Modal */}
      <AnimatePresence>
        {isEditModalOpen && selectedFile && (
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
                <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-500 mr-3">
                  <FiEdit3 />
                </div>
                <h3 className="text-lg font-medium dark:text-gray-200">{t('speechToText.editNameModalTitle')}</h3>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('speechToText.editName')}
                </label>
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200"
                  placeholder={t('speechToText.enterNewName')}
                  disabled={isEditingName}
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedFile(null);
                    setEditingName('');
                  }}
                  disabled={isEditingName}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  {t('speechToText.cancel')}
                </button>
                <button
                  onClick={() => editAudioName(selectedFile, editingName)}
                  disabled={isEditingName || !editingName.trim()}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center"
                >
                  {isEditingName ? (
                    <>
                      <FiLoader className="animate-spin mr-2" />
                      {t('speechToText.saving')}
                    </>
                  ) : (
                    t('speechToText.saveChanges')
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Video Processing Modal */}
      <AnimatePresence>
        {showVideoProcessingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
            >
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 mb-4 relative">
                  <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin">
                    <div className="w-4 h-4 bg-blue-500 rounded-full absolute top-0 left-1/2 transform -translate-x-1/2"></div>
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {t('speechToText.processingVideo', 'Processing Video')}
                </h3>
                
                <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                  {originalFile?.name}
                </p>
                
                <div className="w-full mb-4">
                  <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
                      style={{ width: `${videoProcessingProgress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>{t('speechToText.processing', 'Processing...')}</span>
                    <span>{Math.round(videoProcessingProgress)}%</span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  {t('speechToText.pleaseWait', 'Please wait while we process your video file.')}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
          </div>
        </div>
  );
};

export default SpeechToTextPage;
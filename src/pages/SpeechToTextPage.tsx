import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiUpload, FiMic, FiFileText, FiClock, FiCheck, FiLoader, FiX, FiGlobe } from 'react-icons/fi';
import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
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
}

const SpeechToTextPage: React.FC = () => {
  const { userData, isPro } = useUser();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [duration, setDuration] = useState(0);
  const [files, setFiles] = useState<AudioFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showProAlert, setShowProAlert] = useState(false);
  const [freeTranscriptionsLeft, setFreeTranscriptionsLeft] = useState(3);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

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
    { label: 'English', value: 'en' },
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
    }
  }, [user]);

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
    }
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
    
    // Estimate duration based on file size (rough estimate)
    const estimatedDuration = Math.round(file.size / (128 * 1024 / 8));
    // Cap at reasonable values between 30 seconds and 10 minutes
    const cappedDuration = Math.min(Math.max(estimatedDuration, 30), 600);
    setDuration(cappedDuration);
    
    setShowAdvancedOptions(true);
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
      
      // Estimate duration based on file size
      const estimatedDuration = Math.round(file.size / (128 * 1024 / 8));
      const cappedDuration = Math.min(Math.max(estimatedDuration, 30), 600);
      setDuration(cappedDuration);
      
      setShowAdvancedOptions(true);
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

    try {
      // Generate a secure unique ID for the audio file
      const audioID = generateAudioID();
      const audioName = audioFile.name;
      const fileExtension = getFileExtension(audioName);
      
      // Create sanitized file path for Supabase storage
      const sanitizedFileName = `${audioID}.${fileExtension}`;
      const filePath = `users/${user.id}/audioFile/${sanitizedFileName}`;
      
      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, audioFile, {
          cacheControl: '3600',
          upsert: false
        });
        
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
        
      // Save metadata to database
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
      
      // Success - navigate to the processing screen or show success
      await loadFiles(true); // Force refresh the files list
      
      // Start processing
      await handleProcessAudio(audioID);
      
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(`Failed to upload file: ${error.message}. Please try again.`);
    } finally {
      setIsUploading(false);
      setShowAdvancedOptions(false);
      setAudioFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const handleProcessAudio = async (audioid: string) => {
    try {
      setIsUploading(true);
      
      // Request body with uid and audioid
      const requestBody = JSON.stringify({
        uid: user?.id,
        audioid: audioid
      });

      const response = await fetch('https://ddtgdhehxhgarkonvpfq.supabase.co/functions/v1/convertAudio', {
        method: 'POST',
        headers: { 
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: requestBody
      });

      const responseText = await response.text();
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
            audio_url: data.audio_url
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
      setIsUploading(false);
    }
  };

  const handleFileClick = (item: AudioFile) => {
    navigate(`/transcription/${item.audioid}`, {
      state: {
        uid: user?.id,
        audioid: item.audioid
      }
    });
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
    <div className="container mx-auto max-w-6xl p-4 py-8">
      {showProAlert && (
        <ProFeatureAlert 
          featureName="Unlimited Transcriptions"
          onClose={() => setShowProAlert(false)}
        />
      )}
      
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
          className="text-gray-500 dark:text-gray-400"
        >
          Convert your audio files to text with accurate transcription
        </motion.p>
        
        {!isPro && (
          <div className="mt-2 flex items-center text-sm text-yellow-600 dark:text-yellow-400">
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
          </div>
        )}
      </div>

      {/* File Upload Area */}
      <div className="mb-8">
        <div 
          className={`border-2 border-dashed rounded-lg p-8 transition-all ${
            audioFile 
              ? 'border-green-500 bg-green-50 dark:bg-green-900/10' 
              : 'border-gray-300 hover:border-blue-500 dark:border-gray-700 dark:hover:border-blue-500'
          }`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {!audioFile ? (
            <div className="text-center">
              <FiUpload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" />
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
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:opacity-90 cursor-pointer"
                >
                  Browse Files
                </label>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <FiCheck className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                File selected
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-1">
                {audioFile.name}
              </p>
              <p className="text-gray-500 dark:text-gray-500 mb-4">
                {(audioFile.size / (1024 * 1024)).toFixed(2)} MB • Estimated duration: {formatDuration(duration)}
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setAudioFile(null);
                    setShowAdvancedOptions(false);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Advanced Options */}
        {showAdvancedOptions && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
          >
            <h3 className="text-lg font-medium mb-4 dark:text-gray-300">Transcription Options</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">Language</label>
                <select 
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                >
                  {languages.map(language => (
                    <option key={language.value} value={language.value}>
                      {language.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className={`px-6 py-2 rounded-lg font-medium flex items-center ${
                  isUploading
                    ? 'bg-gray-300 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                    : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white hover:opacity-90'
                } transition`}
              >
                {isUploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <FiFileText className="mr-2" />
                    Transcribe Audio
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Recent Transcriptions */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Recent Transcriptions</h2>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : files.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {files.map((file, index) => (
              <motion.div
                key={file.audioid}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 border rounded-lg hover:shadow-md dark:border-gray-700 cursor-pointer transition-all"
                onClick={() => handleFileClick(file)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium dark:text-gray-300 truncate pr-4" title={file.audio_name}>
                      {file.audio_name}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                      <FiClock className="mr-1.5" />
                      <span>{formatDate(file.uploaded_at)}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                      <FiGlobe className="mr-1.5" />
                      <span>{languages.find(l => l.value === file.language)?.label || 'Unknown'}</span>
                      <span className="mx-2">•</span>
                      <span>{formatDuration(file.duration)}</span>
                    </div>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded text-xs">
                    {file.status === 'completed' ? 'Completed' : 'Processing'}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="p-8 border border-dashed rounded-lg text-center dark:border-gray-700">
            <FiFileText className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">No transcriptions yet</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Upload an audio file to get started with your first transcription
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpeechToTextPage; 
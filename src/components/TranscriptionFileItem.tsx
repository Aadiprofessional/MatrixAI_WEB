import React from 'react';
import '../pages/SpeechToTextPage.css';
import { motion } from 'framer-motion';
import { FiClock, FiGlobe, FiLoader, FiDownload, FiEdit3, FiTrash } from 'react-icons/fi';

interface AudioFile {
  audioid: string;
  uid: string;
  audio_url: string;
  file_path: string;
  language: string;
  duration: number;
  status?: string;
  uploaded_at: string;
  transcription?: string;
  words_data?: Array<{
    word: string;
    start: number;
    end: number;
    confidence: number;
    punctuated_word: string;
  }>;
  display_name?: string;
}

interface TranscriptionFileItemProps {
  file: AudioFile;
  index: number;
  viewMode: 'grid' | 'list';
  loadingAudioIds: Set<string>;
  getDisplayName: (file: AudioFile) => string;
  formatDate: (dateString: string) => string;
  formatDuration: (seconds: number) => string;
  handleFileClick: (file: AudioFile) => void;
  downloadAudio: (file: AudioFile) => void;
  openEditModal: (file: AudioFile) => void;
  setSelectedFile: (file: AudioFile) => void;
  setIsDeleteModalOpen: (isOpen: boolean) => void;
  languages: Array<{ value: string; label: string }>;
}

const TranscriptionFileItem: React.FC<TranscriptionFileItemProps> = ({
  file,
  index,
  viewMode,
  loadingAudioIds,
  getDisplayName,
  formatDate,
  formatDuration,
  handleFileClick,
  downloadAudio,
  openEditModal,
  setSelectedFile,
  setIsDeleteModalOpen,
  languages
}) => {
  return (
    <motion.div
      key={file.audioid}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-md hover:shadow-lg border border-transparent border-gradient cursor-pointer transition-all overflow-hidden ${
        viewMode === 'list' ? 'flex items-center mx-1 sm:mx-2 my-1' : 'm-2'
      }`}
    >
      <div
        className={`${viewMode === 'list' ? 'flex-1 flex items-center p-3 sm:p-4' : 'p-5'}`}
        onClick={() => handleFileClick(file)}
      >
        {viewMode === 'list' ? (
          <div className="flex items-center w-full min-w-0">
            {/* Main content - takes most space */}
            <div className="flex-1 min-w-0 mr-3">
              <h3 className="font-medium text-gray-800 dark:text-gray-300 text-base sm:text-lg mb-1 overflow-hidden" title={getDisplayName(file)}>
                 <span className="block truncate max-w-[120px] sm:max-w-[250px] md:max-w-[350px]">
                   {getDisplayName(file)}
                 </span>
               </h3>
              
              {/* Metadata in a single line for desktop, stacked for mobile */}
              <div className="flex flex-col sm:flex-row sm:items-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 space-y-1 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center">
                  <FiClock className="mr-1 flex-shrink-0" size={12} />
                  <span className="truncate">{formatDate(file.uploaded_at)}</span>
                </div>
                
                <div className="flex items-center">
                  <FiGlobe className="mr-1 flex-shrink-0" size={12} />
                  <span className="truncate">{languages.find(l => l.value === file.language)?.label || 'Unknown'}</span>
                  <span className="mx-1 hidden sm:inline">•</span>
                  <span className="ml-1 sm:ml-0">{formatDuration(file.duration)}</span>
                </div>
              </div>
            </div>
            
            {/* Status badge - compact */}
            <div className="flex-shrink-0 mr-2">
              <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                loadingAudioIds.has(file.audioid)
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 flex items-center'
                  : file.status === 'completed'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
              }`}>
                {loadingAudioIds.has(file.audioid) ? (
                  <>
                    <FiLoader className="animate-spin mr-1 h-3 w-3" />
                    <span className="hidden sm:inline">Processing...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <span className="hidden sm:inline">{file.status === 'completed' ? 'Completed' : 'Processing'}</span>
                )}
                <span className="sm:hidden">{file.status === 'completed' ? '✓' : '⏳'}</span>
              </span>
            </div>
          </div>
        ) : (
          <div className={`${viewMode === 'grid' ? 'pr-20' : ''}`}>
            <h3 className="font-medium text-gray-800 dark:text-gray-300 truncate mb-2" title={getDisplayName(file)}>
              {getDisplayName(file)}
            </h3>
            
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-2">
              <FiClock className="mr-1.5" />
              <span>{formatDate(file.uploaded_at)}</span>
            </div>
            
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-2">
              <FiGlobe className="mr-1.5" />
              <span>{languages.find(l => l.value === file.language)?.label || 'Unknown'}</span>
              <span className="mx-2">•</span>
              <span>{formatDuration(file.duration)}</span>
            </div>
            
            <div className="absolute top-4 right-4">
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
        )}
      </div>
      
      {viewMode === 'list' && (
        <div className="flex items-center px-2 sm:px-3 flex-shrink-0">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              downloadAudio(file);
            }}
            className="p-1.5 sm:p-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
            title="Download audio"
          >
            <FiDownload size={14} />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(file);
            }}
            className="p-1.5 sm:p-2 text-gray-500 hover:text-yellow-500 dark:text-gray-400 dark:hover:text-yellow-400 transition-colors ml-0.5 sm:ml-1"
            title="Edit name"
          >
            <FiEdit3 size={14} />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setSelectedFile(file);
              setIsDeleteModalOpen(true);
            }}
            className="p-1.5 sm:p-2 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors ml-0.5 sm:ml-1"
            title="Delete"
          >
            <FiTrash size={14} />
          </button>
        </div>
      )}
      
      {viewMode === 'grid' && (
        <div className="mt-2 pt-3 px-5 pb-4 flex justify-between border-t dark:border-gray-700">
          <div className="flex space-x-3">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                downloadAudio(file);
              }}
              className="p-1.5 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
              title="Download audio"
            >
              <FiDownload size={16} />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                openEditModal(file);
              }}
              className="p-1.5 text-gray-500 hover:text-yellow-500 dark:text-gray-400 dark:hover:text-yellow-400 transition-colors"
              title="Edit name"
            >
              <FiEdit3 size={16} />
            </button>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setSelectedFile(file);
              setIsDeleteModalOpen(true);
            }}
            className="p-1.5 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
            title="Delete"
          >
            <FiTrash size={16} />
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default TranscriptionFileItem;
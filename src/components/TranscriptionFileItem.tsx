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
      className={`bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-xl shadow-md hover:shadow-lg border border-transparent border-gradient cursor-pointer transition-all overflow-hidden m-2 ${
        viewMode === 'list' ? 'flex items-center' : ''
      }`}
    >
      <div
        className={`${viewMode === 'list' ? 'flex-1 flex items-center p-4' : 'p-5'}`}
        onClick={() => handleFileClick(file)}
      >
        <div className={`${viewMode === 'list' ? 'flex items-center w-full' : ''}`}>
          <div className={`${viewMode === 'list' ? 'flex-1' : ''} ${viewMode === 'grid' ? 'pr-20' : ''}`}>
            <h3 className={`font-medium text-gray-800 dark:text-gray-300 truncate ${viewMode === 'list' ? 'text-lg' : 'mb-2'}`} title={getDisplayName(file)}>
              {getDisplayName(file)}
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
            onClick={(e) => {
              e.stopPropagation();
              downloadAudio(file);
            }}
            className="p-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
            title="Download audio"
          >
            <FiDownload />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(file);
            }}
            className="p-2 text-gray-500 hover:text-yellow-500 dark:text-gray-400 dark:hover:text-yellow-400 transition-colors ml-1"
            title="Edit name"
          >
            <FiEdit3 />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
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
import React, { useState, useRef, useContext } from 'react';
import { X, Upload, Image, FileText, AlertCircle, Sparkles, Zap } from 'lucide-react';
import { ThemeContext } from '../context/ThemeContext';

interface FileUploadPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (file: File, type: 'image' | 'document') => void;
}

const FileUploadPopup: React.FC<FileUploadPopupProps> = ({ isOpen, onClose, onFileSelect }) => {
  const { darkMode } = useContext(ThemeContext);
  const [dragActive, setDragActive] = useState(false);
  const [selectedType, setSelectedType] = useState<'image' | 'document' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml'];
  const documentTypes = [
    'application/pdf',
    'text/plain',
    'application/json',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelection = (file: File) => {
    const isImage = imageTypes.includes(file.type);
    const isDocument = documentTypes.includes(file.type);

    if (!isImage && !isDocument) {
      alert('Unsupported file type. Please select an image or supported document.');
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size too large. Please select a file smaller than 10MB.');
      return;
    }

    const fileType = isImage ? 'image' : 'document';
    onFileSelect(file, fileType);
    onClose();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const openFileDialog = (type: 'image' | 'document') => {
    setSelectedType(type);
    if (fileInputRef.current) {
      const acceptTypes = type === 'image' 
        ? imageTypes.join(',')
        : documentTypes.join(',');
      fileInputRef.current.accept = acceptTypes;
      fileInputRef.current.click();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`relative w-full max-w-md mx-auto transform transition-all duration-300 scale-100 ${
        darkMode 
          ? 'bg-gray-900/90 border border-gray-700/50' 
          : 'bg-white/90 border border-gray-200/50'
      } backdrop-blur-xl rounded-2xl shadow-2xl`}>
        {/* AI-style animated background */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
          <div className={`absolute inset-0 ${
            darkMode 
              ? 'bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-cyan-900/20' 
              : 'bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-cyan-50/50'
          }`} />
          <div className="absolute top-0 left-0 w-full h-full">
            <div className={`absolute top-4 right-4 w-2 h-2 rounded-full animate-pulse ${
              darkMode ? 'bg-cyan-400' : 'bg-cyan-500'
            }`} />
            <div className={`absolute top-8 right-8 w-1 h-1 rounded-full animate-ping ${
              darkMode ? 'bg-purple-400' : 'bg-purple-500'
            }`} />
            <div className={`absolute bottom-6 left-6 w-1.5 h-1.5 rounded-full animate-pulse delay-300 ${
              darkMode ? 'bg-blue-400' : 'bg-blue-500'
            }`} />
          </div>
        </div>
        
        {/* Content */}
        <div className="relative p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                darkMode 
                  ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-400/30' 
                  : 'bg-gradient-to-br from-blue-100 to-purple-100 border border-blue-200'
              }`}>
                <Sparkles className={`w-5 h-5 ${
                  darkMode ? 'text-blue-400' : 'text-blue-600'
                }`} />
              </div>
              <h3 className={`text-xl font-bold ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>Attach File</h3>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                darkMode 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800/50' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
              }`}
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6">
            {/* Upload Options */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => openFileDialog('image')}
                className={`group relative flex flex-col items-center p-6 rounded-xl border-2 border-dashed transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                  darkMode 
                    ? 'border-blue-400/30 hover:border-blue-400/60 bg-blue-900/10 hover:bg-blue-900/20' 
                    : 'border-blue-300/50 hover:border-blue-400 bg-blue-50/30 hover:bg-blue-50/60'
                }`}
              >
                <div className={`p-3 rounded-full mb-3 transition-all duration-300 group-hover:scale-110 ${
                  darkMode 
                    ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/30' 
                    : 'bg-gradient-to-br from-blue-100 to-cyan-100 border border-blue-200'
                }`}>
                  <Image size={24} className={`${
                    darkMode ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                </div>
                <span className={`text-sm font-semibold mb-1 ${
                  darkMode ? 'text-white' : 'text-gray-800'
                }`}>Upload Image</span>
                <span className={`text-xs text-center leading-relaxed ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>JPG, PNG, GIF, WebP</span>
                <div className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                  <Zap size={12} className={`${
                    darkMode ? 'text-blue-400' : 'text-blue-500'
                  }`} />
                </div>
              </button>

              <button
                onClick={() => openFileDialog('document')}
                className={`group relative flex flex-col items-center p-6 rounded-xl border-2 border-dashed transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                  darkMode 
                    ? 'border-emerald-400/30 hover:border-emerald-400/60 bg-emerald-900/10 hover:bg-emerald-900/20' 
                    : 'border-emerald-300/50 hover:border-emerald-400 bg-emerald-50/30 hover:bg-emerald-50/60'
                }`}
              >
                <div className={`p-3 rounded-full mb-3 transition-all duration-300 group-hover:scale-110 ${
                  darkMode 
                    ? 'bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-400/30' 
                    : 'bg-gradient-to-br from-emerald-100 to-green-100 border border-emerald-200'
                }`}>
                  <FileText size={24} className={`${
                    darkMode ? 'text-emerald-400' : 'text-emerald-600'
                  }`} />
                </div>
                <span className={`text-sm font-semibold mb-1 ${
                  darkMode ? 'text-white' : 'text-gray-800'
                }`}>Upload Document</span>
                <span className={`text-xs text-center leading-relaxed ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>PDF, TXT, JSON, XLSX, CSV, DOCX</span>
                <div className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                  <Zap size={12} className={`${
                    darkMode ? 'text-emerald-400' : 'text-emerald-500'
                  }`} />
                </div>
              </button>
            </div>

            {/* Drag and Drop Area */}
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                dragActive
                  ? (darkMode 
                      ? 'border-purple-400/60 bg-purple-900/20 scale-105' 
                      : 'border-purple-400 bg-purple-50/60 scale-105')
                  : (darkMode 
                      ? 'border-gray-600/50 hover:border-gray-500/70 bg-gray-800/20 hover:bg-gray-800/30' 
                      : 'border-gray-300/60 hover:border-gray-400/80 bg-gray-50/30 hover:bg-gray-50/50')
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className={`inline-flex p-4 rounded-full mb-4 transition-all duration-300 ${
                dragActive 
                  ? (darkMode 
                      ? 'bg-gradient-to-br from-purple-500/30 to-pink-500/30 border border-purple-400/50 scale-110' 
                      : 'bg-gradient-to-br from-purple-100 to-pink-100 border border-purple-300 scale-110')
                  : (darkMode 
                      ? 'bg-gradient-to-br from-gray-700/50 to-gray-600/50 border border-gray-600/30' 
                      : 'bg-gradient-to-br from-gray-100 to-gray-50 border border-gray-200')
              }`}>
                <Upload size={28} className={`transition-colors duration-300 ${
                  dragActive 
                    ? (darkMode ? 'text-purple-400' : 'text-purple-600')
                    : (darkMode ? 'text-gray-400' : 'text-gray-500')
                }`} />
              </div>
              <p className={`text-base font-medium mb-2 ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>Drag and drop files here</p>
              <p className={`text-sm ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>or click the buttons above</p>
              
              {/* Animated particles for drag active state */}
              {dragActive && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className={`absolute top-4 left-4 w-1 h-1 rounded-full animate-bounce ${
                    darkMode ? 'bg-purple-400' : 'bg-purple-500'
                  }`} style={{ animationDelay: '0ms' }} />
                  <div className={`absolute top-6 right-6 w-1 h-1 rounded-full animate-bounce ${
                    darkMode ? 'bg-pink-400' : 'bg-pink-500'
                  }`} style={{ animationDelay: '200ms' }} />
                  <div className={`absolute bottom-4 left-6 w-1 h-1 rounded-full animate-bounce ${
                    darkMode ? 'bg-blue-400' : 'bg-blue-500'
                  }`} style={{ animationDelay: '400ms' }} />
                </div>
              )}
            </div>

            {/* File Size Info */}
            <div className={`flex items-center justify-center gap-2 text-sm ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <AlertCircle size={16} className={`${
                darkMode ? 'text-amber-400' : 'text-amber-500'
              }`} />
              <span>Maximum file size: 10MB</span>
            </div>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default FileUploadPopup;
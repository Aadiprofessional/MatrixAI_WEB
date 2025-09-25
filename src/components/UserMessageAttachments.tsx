import React, { useState } from 'react';
import { FileText, Download, X, Eye } from 'lucide-react';
import { FiFileText, FiFile, FiGrid, FiImage, FiBarChart, FiPaperclip } from 'react-icons/fi';
import FilePreviewModal from './FilePreviewModal';

interface FileAttachment {
  url: string;
  fileName: string;
  fileType: string;
  originalName?: string;
  size?: number;
}

interface UserMessageAttachmentsProps {
  attachments: FileAttachment[];
  onRemove?: (index: number) => void;
  showRemove?: boolean;
  darkMode?: boolean;
}

const getFileIcon = (fileType: string, fileName: string, darkMode: boolean = false) => {
  const iconClass = `w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`;
  
  // Check both MIME type and file extension
  const isImage = fileType.startsWith('image/') || 
                  fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/);
  const isExcel = fileType.includes('excel') || fileType.includes('spreadsheet') || 
                  fileType.includes('.xlsx') || fileName.toLowerCase().endsWith('.xlsx');
  const isWord = fileType.includes('word') || fileType.includes('document') || 
                 fileType.includes('.docx') || fileType.includes('doc') || 
                 fileName.toLowerCase().match(/\.(doc|docx)$/);
  const isPdf = fileType.includes('pdf') || fileName.toLowerCase().endsWith('.pdf');
  const isCsv = fileType.includes('csv') || fileName.toLowerCase().endsWith('.csv');
  
  if (isImage) {
    return <FiImage className={`${iconClass} text-purple-500`} />;
  } else if (isExcel) {
    return <FiGrid className={`${iconClass} text-green-500`} />;
  } else if (isWord) {
    return <FiFileText className={`${iconClass} text-blue-500`} />;
  } else if (isPdf) {
    return <FiFile className={`${iconClass} text-red-500`} />;
  } else if (isCsv) {
    return <FiBarChart className={`${iconClass} text-orange-500`} />;
  } else {
    return <FiPaperclip className={iconClass} />;
  }
};

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileTypeForPreview = (fileType: string, fileName: string): 'spreadsheet' | 'document' | 'image' | 'pdf' => {
  // Check both MIME type and file extension
  const isImage = fileType.startsWith('image/') || 
                  !!fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/);
  const isPdf = fileType.includes('pdf') || fileName.toLowerCase().endsWith('.pdf');
  const isExcel = fileType.includes('excel') || fileType.includes('spreadsheet') || 
                  fileType.includes('.xlsx') || fileName.toLowerCase().endsWith('.xlsx');
  const isCsv = fileType.includes('csv') || fileName.toLowerCase().endsWith('.csv');
  
  if (isImage) {
    return 'image';
  } else if (isExcel || isCsv) {
    return 'spreadsheet';
  } else if (isPdf) {
    return 'pdf';
  } else {
    return 'document';
  }
};

const isPreviewable = (fileType: string, fileName: string): boolean => {
  // Check both MIME type and file extension
  const isImage = fileType.startsWith('image/') || 
                  !!fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/);
  const isPdf = fileType.includes('pdf') || fileName.toLowerCase().endsWith('.pdf');
  const isDoc = fileType.includes('doc') || fileType.includes('word') || 
                !!fileName.toLowerCase().match(/\.(doc|docx)$/);
  const isExcel = fileType.includes('excel') || fileType.includes('sheet') || 
                  fileType.includes('.xlsx') || fileName.toLowerCase().endsWith('.xlsx');
  const isCsv = fileType.includes('csv') || fileName.toLowerCase().endsWith('.csv');
  
  return isImage || isPdf || isDoc || isExcel || isCsv;
};

export const UserMessageAttachments: React.FC<UserMessageAttachmentsProps> = ({ 
  attachments, 
  onRemove, 
  showRemove = false,
  darkMode = false
}) => {
  const [previewFile, setPreviewFile] = useState<{
    url: string;
    fileName: string;
    fileType: 'spreadsheet' | 'document' | 'image' | 'pdf';
  } | null>(null);

  const handlePreview = (attachment: FileAttachment) => {
    setPreviewFile({
      url: attachment.url,
      fileName: attachment.fileName,
      fileType: getFileTypeForPreview(attachment.fileType, attachment.fileName)
    });
  };

  const handleDownload = (attachment: FileAttachment) => {
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.originalName || attachment.fileName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 space-y-2">
      {attachments.map((attachment, index) => (
        <div 
          key={index} 
          className={`flex items-center justify-between p-3 rounded-lg border ${
            darkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-gray-50 border-gray-200'
          }`}
        >
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {getFileIcon(attachment.fileType, attachment.fileName, darkMode)}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${
                darkMode ? 'text-gray-100' : 'text-gray-900'
              }`}>
                {attachment.originalName || attachment.fileName}
              </p>
              {attachment.size && (
                <p className={`text-xs ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {formatFileSize(attachment.size)}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 ml-3">
            {isPreviewable(attachment.fileType, attachment.fileName) && (
              <button
                onClick={() => handlePreview(attachment)}
                className={`p-1.5 rounded transition-colors ${
                  darkMode
                    ? 'text-gray-400 hover:text-blue-400 hover:bg-gray-700'
                    : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                }`}
                title="Preview file"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            
            <button
              onClick={() => handleDownload(attachment)}
              className={`p-1.5 rounded transition-colors ${
                darkMode
                  ? 'text-gray-400 hover:text-green-400 hover:bg-gray-700'
                  : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
              }`}
              title="Download file"
            >
              <Download className="w-4 h-4" />
            </button>
            
            {showRemove && onRemove && (
              <button
                onClick={() => onRemove(index)}
                className={`p-1.5 rounded transition-colors ${
                  darkMode
                    ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700'
                    : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                }`}
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}
      
      {previewFile && (
        <FilePreviewModal
          isOpen={true}
          onClose={() => setPreviewFile(null)}
          fileUrl={previewFile.url}
          fileName={previewFile.fileName}
          fileType={previewFile.fileType}
        />
      )}
    </div>
  );
};
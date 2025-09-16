import React, { useState } from 'react';
import { FileText, Download, Eye, File } from 'lucide-react';
import { FiFileText, FiFile, FiGrid, FiImage, FiBarChart, FiPaperclip } from 'react-icons/fi';
import FilePreviewModal from './FilePreviewModal';

interface FileAttachment {
  url: string;
  fileName: string;
  fileType: string;
  originalName?: string;
  size?: number;
}

interface BotMessageAttachmentsProps {
  attachments: FileAttachment[];
  darkMode?: boolean;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (fileType: string, darkMode: boolean = false) => {
  const iconClass = `w-5 h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`;
  
  if (fileType.includes('excel') || fileType.includes('spreadsheet') || fileType.includes('.xlsx')) {
    return <FiGrid className={`${iconClass} text-green-500`} />;
  }
  if (fileType.includes('word') || fileType.includes('document') || fileType.includes('.docx')) {
    return <FiFileText className={`${iconClass} text-blue-500`} />;
  }
  if (fileType.includes('pdf')) {
    return <FiFile className={`${iconClass} text-red-500`} />;
  }
  if (fileType.includes('image')) {
    return <FiImage className={`${iconClass} text-purple-500`} />;
  }
  if (fileType.includes('csv')) {
    return <FiBarChart className={`${iconClass} text-orange-500`} />;
  }
  return <FiPaperclip className={iconClass} />;
};

const getFileTypeForPreview = (fileType: string): 'spreadsheet' | 'document' | 'image' | 'pdf' => {
  if (fileType.includes('excel') || fileType.includes('spreadsheet') || fileType.includes('.xlsx') || fileType.includes('csv')) {
    return 'spreadsheet';
  }
  if (fileType.includes('image')) {
    return 'image';
  }
  if (fileType.includes('pdf')) {
    return 'pdf';
  }
  return 'document';
};

const isPreviewable = (fileType: string): boolean => {
  return fileType.startsWith('image/') || 
         fileType.includes('pdf') || 
         fileType.includes('doc') || 
         fileType.includes('word') || 
         fileType.includes('excel') || 
         fileType.includes('sheet') || 
         fileType.includes('csv') ||
         fileType.includes('.xlsx') ||
         fileType.includes('.docx');
};

export const BotMessageAttachments: React.FC<BotMessageAttachmentsProps> = ({ 
  attachments, 
  darkMode = false 
}) => {
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    fileUrl: string;
    fileName: string;
    fileType: 'spreadsheet' | 'document' | 'image' | 'pdf';
  }>({ isOpen: false, fileUrl: '', fileName: '', fileType: 'document' });

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const handlePreview = (attachment: FileAttachment) => {
    setPreviewModal({
      isOpen: true,
      fileUrl: attachment.url,
      fileName: attachment.originalName || attachment.fileName,
      fileType: getFileTypeForPreview(attachment.fileType)
    });
  };

  const handleClosePreview = () => {
    setPreviewModal(prev => ({ ...prev, isOpen: false }));
  };

  const handleDownload = (attachment: FileAttachment) => {
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.originalName || attachment.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="mb-3 flex flex-wrap gap-2">
        {attachments.map((attachment, index) => (
          <div
            key={index}
            className={`flex items-center gap-3 rounded-lg border p-3 text-sm min-w-0 backdrop-blur-sm ${
              darkMode 
                ? 'bg-gray-800/60 border-gray-600/50' 
                : 'bg-gray-50/80 border-gray-200/50'
            }`}
          >
            <div className="flex-shrink-0">{getFileIcon(attachment.fileType, darkMode)}</div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className={`font-medium truncate ${
                darkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>
                {attachment.originalName || attachment.fileName}
              </span>
              {attachment.size && (
                <span className={`text-xs ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {formatFileSize(attachment.size)}
                </span>
              )}
            </div>
            <div className="flex gap-1 flex-shrink-0">
              {isPreviewable(attachment.fileType) && (
                <button
                  onClick={() => handlePreview(attachment)}
                  className={`rounded p-1.5 transition-colors ${
                    darkMode 
                      ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-200' 
                      : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                  }`}
                  title="Preview file"
                >
                  <Eye className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => handleDownload(attachment)}
                className={`rounded p-1.5 transition-colors ${
                  darkMode 
                    ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-200' 
                    : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                }`}
                title="Download file"
              >
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {previewModal.isOpen && (
        <FilePreviewModal
          isOpen={previewModal.isOpen}
          onClose={handleClosePreview}
          fileUrl={previewModal.fileUrl}
          fileName={previewModal.fileName}
          fileType={previewModal.fileType}
        />
      )}
    </>
  );
};

export default BotMessageAttachments;
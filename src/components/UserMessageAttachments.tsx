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
}

const getFileIcon = (fileType: string) => {
  const iconClass = "w-5 h-5";
  
  if (fileType.startsWith('image/')) {
    return <FiImage className={`${iconClass} text-purple-500`} />;
  } else if (fileType.includes('pdf')) {
    return <FiFile className={`${iconClass} text-red-500`} />;
  } else if (fileType.includes('doc') || fileType.includes('word')) {
    return <FiFileText className={`${iconClass} text-blue-500`} />;
  } else if (fileType.includes('excel') || fileType.includes('sheet')) {
    return <FiGrid className={`${iconClass} text-green-500`} />;
  } else if (fileType.includes('csv')) {
    return <FiBarChart className={`${iconClass} text-orange-500`} />;
  } else {
    return <FiPaperclip className={`${iconClass} text-gray-500`} />;
  }
};

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

const getFileTypeForPreview = (fileType: string): 'spreadsheet' | 'document' | 'image' | 'pdf' => {
  if (fileType.startsWith('image/')) {
    return 'image';
  } else if (fileType.includes('excel') || fileType.includes('sheet') || fileType.includes('csv')) {
    return 'spreadsheet';
  } else if (fileType.includes('pdf')) {
    return 'pdf';
  } else {
    return 'document';
  }
};

const isPreviewable = (fileType: string): boolean => {
  return fileType.startsWith('image/') || 
         fileType.includes('pdf') || 
         fileType.includes('doc') || 
         fileType.includes('word') || 
         fileType.includes('excel') || 
         fileType.includes('sheet') || 
         fileType.includes('csv');
};

export const UserMessageAttachments: React.FC<UserMessageAttachmentsProps> = ({ 
  attachments, 
  onRemove, 
  showRemove = false 
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
            className="flex items-center gap-3 rounded-lg bg-blue-700/20 border border-blue-400/30 p-3 text-sm min-w-0 backdrop-blur-sm"
          >
            <span className="text-xl flex-shrink-0">{getFileIcon(attachment.fileType)}</span>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-medium text-white truncate">
                {attachment.originalName || attachment.fileName}
              </span>
              {attachment.size && (
                <span className="text-xs text-blue-200">
                  {formatFileSize(attachment.size)}
                </span>
              )}
            </div>
            <div className="flex gap-1 flex-shrink-0">
              {isPreviewable(attachment.fileType) && (
                <button
                  onClick={() => handlePreview(attachment)}
                  className="rounded p-1.5 text-blue-200 hover:bg-blue-600/50 hover:text-white transition-colors"
                  title="Preview file"
                >
                  <Eye className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => handleDownload(attachment)}
                className="rounded p-1.5 text-blue-200 hover:bg-blue-600/50 hover:text-white transition-colors"
                title="Download file"
              >
                <Download className="h-4 w-4" />
              </button>
              {showRemove && onRemove && (
                <button
                  onClick={() => onRemove(index)}
                  className="rounded p-1.5 text-gray-500 hover:bg-red-100 hover:text-red-700 dark:text-gray-400 dark:hover:bg-red-900 dark:hover:text-red-300 transition-colors"
                  title="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <FilePreviewModal
        isOpen={previewModal.isOpen}
        onClose={handleClosePreview}
        fileUrl={previewModal.fileUrl}
        fileName={previewModal.fileName}
        fileType={previewModal.fileType}
      />
    </>
  );
};
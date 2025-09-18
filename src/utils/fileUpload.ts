import { supabase } from '../supabaseClient';
import { compressImage, CompressionResult, shouldCompressImage } from './imageCompression';

export interface FileUploadResult {
  fileName: string;
  filePath: string;
  publicUrl: string;
  fileType: 'image' | 'document';
  originalName: string;
  size: number;
  compressionStats?: string;
}

export interface FileValidationResult {
  isValid: boolean;
  fileType: 'image' | 'document' | null;
  error?: string;
}

// Supported file types
const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  'image/svg+xml'
];

const SUPPORTED_DOCUMENT_TYPES = [
  'application/pdf',
  'text/plain',
  'application/json',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'text/csv',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword' // .doc
];

// File size limits (in bytes)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB for images

/**
 * Validates a file for upload
 */
export const validateFile = (file: File): FileValidationResult => {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      fileType: null,
      error: `File size too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`
    };
  }

  // Check if it's an image
  if (SUPPORTED_IMAGE_TYPES.includes(file.type)) {
    if (file.size > MAX_IMAGE_SIZE) {
      return {
        isValid: false,
        fileType: 'image',
        error: `Image size too large. Maximum size for images is ${MAX_IMAGE_SIZE / (1024 * 1024)}MB.`
      };
    }
    return {
      isValid: true,
      fileType: 'image'
    };
  }

  // Check if it's a supported document
  if (SUPPORTED_DOCUMENT_TYPES.includes(file.type)) {
    return {
      isValid: true,
      fileType: 'document'
    };
  }

  // Unsupported file type
  return {
    isValid: false,
    fileType: null,
    error: 'Unsupported file type. Please select an image (JPG, PNG, GIF, WebP, BMP, SVG) or document (PDF, TXT, JSON, XLSX, XLS, CSV, DOCX, DOC).'
  };
};

/**
 * Generates a unique file name
 */
const generateUniqueFileName = (originalName: string, userId: string): string => {
  const fileExtension = originalName.split('.').pop()?.toLowerCase() || '';
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  return `${userId}_${randomString}_${timestamp}.${fileExtension}`;
};

/**
 * Uploads a file to Supabase storage with automatic image compression
 */
export const uploadFileToStorage = async (
  file: File, 
  userId: string, 
  fileType: 'image' | 'document'
): Promise<FileUploadResult> => {
  try {
    // Validate file first
    const validation = validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    let fileToUpload = file;
    let compressionStats: string | undefined;

    // Compress image files before upload
    if (fileType === 'image' && file.type.startsWith('image/')) {
      console.log(`Original image size: ${Math.round(file.size / 1024)}KB`);
      
      try {
        // Check if compression is needed
        const needsCompression = await shouldCompressImage(file, 500);
        
        if (needsCompression) {
          console.log('Compressing image...');
          const compressionResult = await compressImage(file, {
            maxWidth: 1920,
            maxHeight: 1080,
            quality: 0.8,
            maxSizeKB: 500,
            outputFormat: 'jpeg'
          });
          
          fileToUpload = compressionResult.compressedFile;
          compressionStats = `Compressed from ${Math.round(file.size / 1024)}KB to ${Math.round(compressionResult.compressedSize / 1024)}KB (${compressionResult.compressionRatio.toFixed(1)}% reduction)`;
          
          console.log(compressionStats);
        } else {
          console.log('Image compression not needed - file already optimized');
        }
      } catch (compressionError) {
        console.warn('Image compression failed, uploading original:', compressionError);
        // Continue with original file if compression fails
      }
    }

    // Generate unique file name
    const fileName = generateUniqueFileName(fileToUpload.name, userId);
    
    // Determine storage path based on file type
    const folderPath = fileType === 'image' ? 'images' : 'documents';
    const filePath = `users/${userId}/${folderPath}/${fileName}`;

    // Upload file to Supabase storage
    const { data, error } = await supabase.storage
      .from('user-uploads')
      .upload(filePath, fileToUpload, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('user-uploads')
      .getPublicUrl(filePath);

    return {
      fileName,
      filePath,
      publicUrl,
      fileType,
      originalName: file.name,
      size: fileToUpload.size,
      compressionStats
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Deletes a file from Supabase storage
 */
export const deleteFileFromStorage = async (filePath: string): Promise<void> => {
  try {
    const { error } = await supabase.storage
      .from('user-uploads')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting file:', error);
      throw new Error(`Delete failed: ${error.message}`);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

/**
 * Gets file type from MIME type
 */
export const getFileTypeFromMime = (mimeType: string): 'image' | 'document' | null => {
  if (SUPPORTED_IMAGE_TYPES.includes(mimeType)) {
    return 'image';
  }
  if (SUPPORTED_DOCUMENT_TYPES.includes(mimeType)) {
    return 'document';
  }
  return null;
};

/**
 * Formats file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Gets file icon based on file type
 */
export const getFileIcon = (mimeType: string): string => {
  if (SUPPORTED_IMAGE_TYPES.includes(mimeType)) {
    return '🖼️';
  }
  
  switch (mimeType) {
    case 'application/pdf':
      return '📄';
    case 'text/plain':
      return '📝';
    case 'application/json':
      return '📋';
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
    case 'application/vnd.ms-excel':
      return '📊';
    case 'text/csv':
      return '📈';
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/msword':
      return '📄';
    default:
      return '📎';
  }
};
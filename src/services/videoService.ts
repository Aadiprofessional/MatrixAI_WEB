// Video Service Interfaces
interface VideoGenerationResponse {
  message: string;
  videoId: string;
  status: string;
  videoUrl?: string;
  taskId?: string;
  error?: string;
}

interface VideoHistoryResponse {
  message: string;
  videos: Array<{
    video_id: string;
    prompt_text: string;
    video_url?: string;
    status: string;
    created_at: string;
    task_id?: string;
    template?: string;
    image_url?: string;
    size?: string;
    error_message?: string;
  }>;
  totalItems?: number;
  currentPage?: number;
  itemsPerPage?: number;
  totalPages?: number;
  pagination?: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

interface VideoRemoveResponse {
  message: string;
}

const API_BASE_URL = 'https://main-matrixai-server-lujmidrakh.cn-hangzhou.fcapp.run';

// Export the videoService object
export const videoService = {
  // Create video with text prompt only
  createVideo: async (uid: string, promptText: string, size: string = '720P'): Promise<VideoGenerationResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/video/createVideo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid,
        promptText,
        size
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || 'Failed to generate video');
    }

    return response.json();
  },

  // Helper function to compress images to under 5MB
  compressImage: async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Maintain aspect ratio while reducing size
          const MAX_WIDTH = 1920;
          const MAX_HEIGHT = 1080;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Start with high quality
          let quality = 0.9;
          let compressedFile: File;
          
          const compressWithQuality = (q: number) => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error('Failed to compress image'));
                  return;
                }
                
                compressedFile = new File([blob], file.name.replace(/\.[^\.]+$/, '.jpg'), {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                
                // If still too large and quality can be reduced further
                if (compressedFile.size > 5 * 1024 * 1024 && q > 0.3) {
                  // Reduce quality and try again
                  compressWithQuality(q - 0.1);
                } else {
                  console.log(`Compressed image to ${(compressedFile.size / (1024 * 1024)).toFixed(2)}MB with quality ${q}`);
                  resolve(compressedFile);
                }
              },
              'image/jpeg',
              q
            );
          };
          
          compressWithQuality(quality);
        };
        img.onerror = () => {
          reject(new Error('Failed to load image for compression'));
        };
      };
      reader.onerror = () => {
        reject(new Error('Failed to read image file'));
      };
    });
  },
  
  // Helper function to convert HEIC/HEIF to JPEG
  convertHeicToJpeg: async (file: File): Promise<File> => {
    try {
      // Check if the file is HEIC/HEIF format based on extension or type
      const isHeic = file.type === 'image/heic' || 
                    file.name.toLowerCase().endsWith('.heic') || 
                    file.name.toLowerCase().endsWith('.heif');
      
      if (!isHeic) {
        console.log('Not a HEIC image, returning original file');
        return file;
      }
      
      console.log('Converting HEIC image to JPEG using heic-to...');
      
      // Dynamically import heic-to
      const { heicTo } = await import('heic-to');
      
      // Convert HEIC to JPEG
      const resultBlob = await heicTo({
        blob: file,
        type: 'image/jpeg',
        quality: 0.8
      });
      
      // Create a new File from the blob
      const convertedFile = new File([resultBlob], file.name.replace(/\.[^\.]+$/, '.jpg'), {
        type: 'image/jpeg',
        lastModified: Date.now()
      });
      
      console.log(`Converted HEIC to JPEG: ${(convertedFile.size / (1024 * 1024)).toFixed(2)}MB`);
      
      // If the converted file is still too large, compress it further
      if (convertedFile.size > 5 * 1024 * 1024) {
        console.log('Converted image is still larger than 5MB, compressing further...');
        return videoService.compressImage(convertedFile);
      }
      
      return convertedFile;
    } catch (error) {
      console.error('Error converting HEIC to JPEG:', error);
      throw new Error('Failed to convert HEIC image. Please try another image format.');
    }
  },
  
  // Create video with image file
  createVideoWithImage: async (uid: string, imageFile: File, template?: string, promptText?: string, size: string = '720P'): Promise<VideoGenerationResponse> => {
    try {
      // Check if image is in HEIC format and convert if needed
      let processedImageFile = imageFile;
      const isHeic = imageFile.type === 'image/heic' || 
                    imageFile.name.toLowerCase().endsWith('.heic') || 
                    imageFile.name.toLowerCase().endsWith('.heif');
      
      if (isHeic) {
        console.log('HEIC format detected, converting to JPEG...');
        // Use the dedicated HEIC to JPEG converter
        processedImageFile = await videoService.convertHeicToJpeg(imageFile);
      }
      
      // Check if file is larger than 5MB and compress if needed
      if (processedImageFile.size > 5 * 1024 * 1024) {
        console.log('Image is larger than 5MB, compressing...');
        processedImageFile = await videoService.compressImage(processedImageFile);
      }
      
      const formData = new FormData();
      formData.append('uid', uid);
      formData.append('image', processedImageFile);
      
      if (template) {
        formData.append('template', template);
      }
      
      if (promptText) {
        formData.append('promptText', promptText);
      }
      
      if (size) {
        formData.append('size', size);
      }
      
      const response = await fetch(`${API_BASE_URL}/api/video/createVideo`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to generate video from image');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error in createVideoWithImage:', error);
      throw error;
    }
  },

  // Create video with image URL
  createVideoWithUrl: async (uid: string, promptText: string, imageUrl: string, negativePrompt?: string, template?: string): Promise<VideoGenerationResponse> => {
    try {
      // For this implementation, we'll use the direct file upload method
      // First, fetch the image from the URL
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error('Failed to fetch image from URL');
      }
      
      const imageBlob = await imageResponse.blob();
      const imageFile = new File([imageBlob], 'image.jpg', { type: 'image/jpeg' });
      
      // Now use the file upload method
      return videoService.createVideoWithImage(uid, imageFile, template, promptText);
    } catch (error) {
      console.error('Error in createVideoWithUrl:', error);
      throw error;
    }
  },

  // Get all videos for a user
  getAllVideos: async (uid: string, page: number = 1, itemsPerPage: number = 10): Promise<VideoHistoryResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/video/getVideoHistory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid,
        page,
        itemsPerPage
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || 'Failed to fetch video history');
    }

    return response.json();
  },

  // Remove a video
  removeVideo: async (uid: string, videoId: string): Promise<VideoRemoveResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/video/removeVideo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid,
        videoId
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || 'Failed to remove video');
    }

    return response.json();
  }
};

// Add default export
export default videoService;
/**
 * Image Compression Utility
 * Compresses images before uploading to storage and sending to n8n
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeKB?: number;
  outputFormat?: 'jpeg' | 'webp' | 'png';
  maintainAspectRatio?: boolean;
}

export interface CompressionResult {
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  dimensions: {
    original: { width: number; height: number };
    compressed: { width: number; height: number };
  };
}

// Default compression settings optimized for web upload and n8n processing
const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
  maxSizeKB: 500, // 500KB max file size
  outputFormat: 'jpeg',
  maintainAspectRatio: true
};

/**
 * Compresses an image file with aggressive optimization
 */
export const compressImage = async (
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> => {
  return new Promise((resolve, reject) => {
    // Merge with default options
    const opts = { ...DEFAULT_OPTIONS, ...options };
    
    // Validate input
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Invalid file: must be an image'));
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        const originalWidth = img.width;
        const originalHeight = img.height;
        
        // Calculate new dimensions while maintaining aspect ratio
        let { width: newWidth, height: newHeight } = calculateDimensions(
          originalWidth,
          originalHeight,
          opts.maxWidth!,
          opts.maxHeight!,
          opts.maintainAspectRatio!
        );

        // Set canvas dimensions
        canvas.width = newWidth;
        canvas.height = newHeight;

        // Configure canvas for high-quality rendering
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // Clear canvas and draw image
          ctx.clearRect(0, 0, newWidth, newHeight);
          ctx.drawImage(img, 0, 0, newWidth, newHeight);
        }

        // Start with the specified quality
        let currentQuality = opts.quality!;
        let attempts = 0;
        const maxAttempts = 10;

        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              const compressedSizeKB = blob.size / 1024;
              
              // If size is acceptable or we've tried enough times, use this result
              if (compressedSizeKB <= opts.maxSizeKB! || attempts >= maxAttempts || currentQuality <= 0.1) {
                const compressedFile = new File([blob], file.name, {
                  type: blob.type,
                  lastModified: Date.now()
                });

                const result: CompressionResult = {
                  compressedFile,
                  originalSize: file.size,
                  compressedSize: blob.size,
                  compressionRatio: ((file.size - blob.size) / file.size) * 100,
                  dimensions: {
                    original: { width: originalWidth, height: originalHeight },
                    compressed: { width: newWidth, height: newHeight }
                  }
                };

                resolve(result);
                return;
              }

              // If still too large, reduce quality and try again
              attempts++;
              currentQuality = Math.max(0.1, currentQuality - 0.1);
              
              // Also reduce dimensions if quality is getting very low
              if (currentQuality <= 0.3 && (newWidth > 800 || newHeight > 600)) {
                const scaleFactor = 0.8;
                newWidth = Math.floor(newWidth * scaleFactor);
                newHeight = Math.floor(newHeight * scaleFactor);
                
                canvas.width = newWidth;
                canvas.height = newHeight;
                
                if (ctx) {
                  ctx.clearRect(0, 0, newWidth, newHeight);
                  ctx.drawImage(img, 0, 0, newWidth, newHeight);
                }
              }

              tryCompress();
            },
            `image/${opts.outputFormat}`,
            currentQuality
          );
        };

        tryCompress();
      } catch (error) {
        reject(new Error(`Compression failed: ${error}`));
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Load the image
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Calculate optimal dimensions while maintaining aspect ratio
 */
const calculateDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number,
  maintainAspectRatio: boolean
): { width: number; height: number } => {
  if (!maintainAspectRatio) {
    return {
      width: Math.min(originalWidth, maxWidth),
      height: Math.min(originalHeight, maxHeight)
    };
  }

  const aspectRatio = originalWidth / originalHeight;
  
  let newWidth = originalWidth;
  let newHeight = originalHeight;

  // Scale down if larger than max dimensions
  if (newWidth > maxWidth) {
    newWidth = maxWidth;
    newHeight = newWidth / aspectRatio;
  }

  if (newHeight > maxHeight) {
    newHeight = maxHeight;
    newWidth = newHeight * aspectRatio;
  }

  return {
    width: Math.floor(newWidth),
    height: Math.floor(newHeight)
  };
};

/**
 * Batch compress multiple images
 */
export const compressImages = async (
  files: File[],
  options: CompressionOptions = {}
): Promise<CompressionResult[]> => {
  const results: CompressionResult[] = [];
  
  for (const file of files) {
    if (file.type.startsWith('image/')) {
      try {
        const result = await compressImage(file, options);
        results.push(result);
      } catch (error) {
        console.error(`Failed to compress ${file.name}:`, error);
        // For failed compressions, return original file
        results.push({
          compressedFile: file,
          originalSize: file.size,
          compressedSize: file.size,
          compressionRatio: 0,
          dimensions: {
            original: { width: 0, height: 0 },
            compressed: { width: 0, height: 0 }
          }
        });
      }
    }
  }
  
  return results;
};

/**
 * Check if a file needs compression based on size and dimensions
 */
export const shouldCompressImage = async (
  file: File,
  maxSizeKB: number = 500
): Promise<boolean> => {
  if (!file.type.startsWith('image/')) {
    return false;
  }

  // Always compress if file is larger than threshold
  if (file.size / 1024 > maxSizeKB) {
    return true;
  }

  // Check dimensions for very large images
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const needsCompression = img.width > 1920 || img.height > 1080;
      resolve(needsCompression);
    };
    img.onerror = () => resolve(false);
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Get compression statistics for display
 */
export const getCompressionStats = (result: CompressionResult): string => {
  const { originalSize, compressedSize, compressionRatio } = result;
  const originalKB = Math.round(originalSize / 1024);
  const compressedKB = Math.round(compressedSize / 1024);
  
  return `Compressed from ${originalKB}KB to ${compressedKB}KB (${compressionRatio.toFixed(1)}% reduction)`;
};
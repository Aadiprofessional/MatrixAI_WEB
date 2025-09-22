// Image Replacement Service
// Handles placeholder image URLs and replaces them with generated images

import { aiImageService } from './aiImageService';

export interface ImagePlaceholder {
  index: number;
  description: string;
  placeholderUrl: string;
  status: 'pending' | 'generating' | 'completed' | 'error';
  actualUrl?: string;
  error?: string;
}

export interface ImageReplacementSession {
  sessionId: string;
  userId: string;
  placeholders: Map<number, ImagePlaceholder>;
  isActive: boolean;
}

class ImageReplacementService {
  private sessions: Map<string, ImageReplacementSession> = new Map();

  /**
   * Initialize a new image replacement session
   */
  initializeSession(sessionId: string, userId: string): void {
    const session: ImageReplacementSession = {
      sessionId,
      userId,
      placeholders: new Map(),
      isActive: true
    };
    
    this.sessions.set(sessionId, session);
    console.log(`🎨 Image replacement session initialized: ${sessionId}`);
  }

  /**
   * Process HTML content to find image placeholders and start generation
   */
  async processHtmlContent(
    sessionId: string, 
    htmlContent: string,
    onImageUpdate: (index: number, actualUrl: string) => void
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.log(`❌ No session found for ${sessionId}`);
      return;
    }

    console.log(`🔍 Processing HTML content for session ${sessionId}`);
    console.log(`📝 HTML content length: ${htmlContent.length}`);
    console.log(`📝 HTML content preview: ${htmlContent.substring(0, 500)}...`);

    // Find all image tags with placeholder URLs
    const imageRegex = /<img[^>]+src="[^"]*placeholder[^"]*ai_generated_(\d+)\.png"[^>]*data-image-index="(\d+)"[^>]*data-image-description="([^"]*)"[^>]*\/?>/g;
    let match;
    let foundImages = 0;

    // Also check for simpler img tags that might be generated
    const simpleImageRegex = /<img[^>]+src="[^"]*placeholder_url_(\d+)"[^>]*>/g;
    let simpleMatch;

    // Check for bare URLs that need to be converted to images
    const bareUrlRegex = /https:\/\/[^\s"<>]+ai_generated_(\d+)\.png/g;
    let bareUrlMatch;

    console.log(`🔍 Searching for image placeholders...`);

    while ((match = imageRegex.exec(htmlContent)) !== null) {
      foundImages++;
      const [fullMatch, urlIndex, dataIndex, description] = match;
      const index = parseInt(dataIndex);
      
      console.log(`🎨 Found image placeholder ${index}: ${description}`);
      
      // Skip if already processing this placeholder
      if (session.placeholders.has(index)) {
        console.log(`⏭️ Skipping image ${index} - already processing`);
        continue;
      }

      const placeholder: ImagePlaceholder = {
        index,
        description: decodeURIComponent(description),
        placeholderUrl: `https://ddtgdhehxhgarkonvpfq.supabase.co/storage/v1/object/public/user-uploads/users/placeholder/ai-generated-images/ai_generated_${index}.png`,
        status: 'pending'
      };

      session.placeholders.set(index, placeholder);
      
      // Start generating the image in background
      this.generateImageForPlaceholder(sessionId, index, onImageUpdate);
    }

    // Check for simple placeholder_url_X format
    while ((simpleMatch = simpleImageRegex.exec(htmlContent)) !== null) {
      foundImages++;
      const [fullMatch, index] = simpleMatch;
      const imageIndex = parseInt(index);
      
      console.log(`🎨 Found simple image placeholder ${imageIndex}`);
      
      // Skip if already processing this placeholder
      if (session.placeholders.has(imageIndex)) {
        console.log(`⏭️ Skipping simple image ${imageIndex} - already processing`);
        continue;
      }

      // Extract description from alt attribute or use default
      const altMatch = fullMatch.match(/alt="([^"]*)"/); 
      const description = altMatch ? altMatch[1] : `Generated image ${imageIndex}`;

      const placeholder: ImagePlaceholder = {
        index: imageIndex,
        description: description,
        placeholderUrl: `placeholder_url_${imageIndex}`,
        status: 'pending'
      };

      session.placeholders.set(imageIndex, placeholder);
      
      // Start generating the image in background
      this.generateImageForPlaceholder(sessionId, imageIndex, onImageUpdate);
    }

    // Check for bare URLs that need to be converted to images
    while ((bareUrlMatch = bareUrlRegex.exec(htmlContent)) !== null) {
      foundImages++;
      const [fullMatch, index] = bareUrlMatch;
      const imageIndex = parseInt(index);
      
      console.log(`🎨 Found bare URL placeholder ${imageIndex}: ${fullMatch}`);
      
      // Skip if already processing this placeholder
      if (session.placeholders.has(imageIndex)) {
        console.log(`⏭️ Skipping image ${imageIndex} - already processing`);
        continue;
      }

      const placeholder: ImagePlaceholder = {
        index: imageIndex,
        description: `Generated image ${imageIndex}`,
        placeholderUrl: fullMatch,
        status: 'pending'
      };

      session.placeholders.set(imageIndex, placeholder);
      
      // Start generating the image in background
      this.generateImageForPlaceholder(sessionId, imageIndex, onImageUpdate);
    }

    console.log(`📊 Total images found: ${foundImages}`);
    if (foundImages === 0) {
      console.log(`❌ No image placeholders found in content`);
      console.log(`🔍 Content sample: ${htmlContent.substring(0, 1000)}`);
    }
  }

  /**
   * Generate image for a specific placeholder
   */
  private async generateImageForPlaceholder(
    sessionId: string, 
    index: number,
    onImageUpdate: (index: number, actualUrl: string) => void
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const placeholder = session.placeholders.get(index);
    if (!placeholder) return;

    try {
      placeholder.status = 'generating';
      console.log(`🎨 Generating image ${index}: ${placeholder.description}`);

      // Generate the image using AI service
      const result = await aiImageService.generateImageFromDescription(
        session.userId,
        placeholder.description,
        50 // Default coin cost
      );

      if (result.success && result.imageUrl) {
        // Clean the URL
        const cleanUrl = this.sanitizeImageUrl(result.imageUrl);
        placeholder.actualUrl = cleanUrl;
        placeholder.status = 'completed';
        
        console.log(`✅ Image ${index} generated successfully: ${cleanUrl}`);
        
        // Notify the UI to update the image
        onImageUpdate(index, cleanUrl);
      } else {
        placeholder.status = 'error';
        placeholder.error = result.error || 'Failed to generate image';
        console.error(`❌ Image ${index} generation failed:`, placeholder.error);
      }
    } catch (error) {
      placeholder.status = 'error';
      placeholder.error = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Image ${index} generation error:`, error);
    }
  }

  /**
   * Get the status of all placeholders in a session
   */
  getSessionStatus(sessionId: string): ImagePlaceholder[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    
    return Array.from(session.placeholders.values());
  }

  /**
   * Replace placeholder URL with actual URL in HTML content
   */
  replaceImageUrl(htmlContent: string, index: number, actualUrl: string): string {
    console.log(`🔄 Replacing image ${index} with URL: ${actualUrl}`);
    console.log(`📝 Original HTML content:`, htmlContent);
    
    // Pattern for complex format with data attributes
    const complexPattern = new RegExp(
      `(<img[^>]+src=")([^"]*placeholder[^"]*ai_generated_${index}\\.png)("[^>]*>)`,
      'g'
    );
    
    // Pattern for simple placeholder_url_X format
    const simplePattern = new RegExp(
      `(<img[^>]+src=")(placeholder_url_${index})("[^>]*>)`,
      'g'
    );
    
    // Pattern for any URL that looks like a placeholder (bare URL)
    const bareUrlPattern = new RegExp(
      `(https://[^\\s"<>]+ai_generated_${index}\\.png)`,
      'g'
    );
    
    // Pattern for URL in img src attribute
    const imgSrcPattern = new RegExp(
      `(<img[^>]+src=")([^"]*ai_generated_${index}\\.png)("[^>]*>)`,
      'g'
    );
    
    // Try complex pattern first
    let result = htmlContent.replace(complexPattern, `$1${actualUrl}$3`);
    
    // If no replacement was made, try simple pattern
    if (result === htmlContent) {
      result = htmlContent.replace(simplePattern, `$1${actualUrl}$3`);
      if (result !== htmlContent) {
        console.log(`🔄 Used simple pattern for image ${index}`);
      }
    } else {
      console.log(`🔄 Used complex pattern for image ${index}`);
    }
    
    // If still no replacement, try img src pattern
    if (result === htmlContent) {
      result = htmlContent.replace(imgSrcPattern, `$1${actualUrl}$3`);
      if (result !== htmlContent) {
        console.log(`🔄 Used img src pattern for image ${index}`);
      }
    }
    
    // If still no replacement, try to replace bare URL and convert to img tag
    if (result === htmlContent) {
      result = htmlContent.replace(bareUrlPattern, `<img src="${actualUrl}" alt="Generated image ${index}" style="max-width: 100%; height: auto;" />`);
      if (result !== htmlContent) {
        console.log(`🔄 Used bare URL pattern and converted to img tag for image ${index}`);
      }
    }
    
    if (result === htmlContent) {
      console.log(`❌ No replacement made for image ${index}`);
      console.log(`🔍 Looking for: ai_generated_${index}.png or placeholder_url_${index}`);
      console.log(`🔍 Available patterns tested:`, {
        complex: complexPattern.source,
        simple: simplePattern.source,
        imgSrc: imgSrcPattern.source,
        bareUrl: bareUrlPattern.source
      });
    } else {
      console.log(`✅ Successfully replaced image ${index}`);
      console.log(`📝 Result HTML:`, result);
    }
    
    return result;
  }

  /**
   * Clean up a session
   */
  cleanupSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.sessions.delete(sessionId);
      console.log(`🧹 Image replacement session cleaned up: ${sessionId}`);
    }
  }

  /**
   * Sanitize image URLs to remove extra characters
   */
  private sanitizeImageUrl(url: string): string {
    if (!url) return url;
    
    // Remove extra characters like ) at the end
    let cleanUrl = url.trim();
    
    // Remove trailing ) or other unwanted characters
    cleanUrl = cleanUrl.replace(/[)\]}>]+$/, '');
    
    // Ensure it's a valid URL format
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      return cleanUrl;
    }
    
    return url; // Return original if we can't clean it properly
  }

  /**
   * Check if all images in a session are completed
   */
  areAllImagesCompleted(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return true;
    
    const placeholders = Array.from(session.placeholders.values());
    return placeholders.length === 0 || placeholders.every(p => p.status === 'completed' || p.status === 'error');
  }
}

export const imageReplacementService = new ImageReplacementService();
export default imageReplacementService;
import { aiImageService } from './aiImageService';
import { ImageRequirement, IntelligentImageAnalysis } from './aiImageService';

export interface StreamingImageState {
  sessionId: string;
  userQuery: string;
  images: Array<{
    id: string;
    description: string;
    position: number;
    status: 'pending' | 'generating' | 'completed' | 'error';
    url?: string;
    coinCost?: number;
    error?: string;
  }>;
  textPosition: number;
  isComplete: boolean;
}

export interface StreamChunk {
  type: 'text' | 'image' | 'image_ready' | 'image_placeholder';
  content: string;
  position?: number;
  imageUrl?: string;
  description?: string;
  imageId?: string;
  imageIndex?: number;
}

export class StreamingImageService {
  private sessions: Map<string, StreamingImageState> = new Map();

  async initializeSession(sessionId: string, userQuery: string): Promise<void> {
    // Pre-analyze the query to determine needed images
    const analysis = await aiImageService.analyzeForImageRequirements(userQuery);
    
    const imageRequirements = analysis.shouldGenerateImages 
      ? analysis.imageRequirements
      : [];

    // Initialize session state
    const sessionState: StreamingImageState = {
      sessionId,
      userQuery,
      images: imageRequirements.map((req, index) => ({
        id: req.id || `img_${sessionId}_${index}`,
        description: req.description,
        position: req.position,
        status: 'pending',
        coinCost: req.coinCost
      })),
      textPosition: 0,
      isComplete: false
    };

    this.sessions.set(sessionId, sessionState);
  }

  async startParallelImageGeneration(sessionId: string, uid: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Start generating all images in parallel
    const imagePromises = session.images.map(async (image) => {
      try {
        image.status = 'generating';
        
        // Generate the image
        const result = await aiImageService.generateImageFromDescription(
          uid,
          image.description,
          image.coinCost || 0
        );

        // Update image state
        image.status = 'completed';
        // Clean the URL to remove any extra characters
        image.url = result.imageUrl ? this.sanitizeImageUrl(result.imageUrl) : undefined;
        image.coinCost = result.coinsDeducted;
      } catch (error) {
        image.status = 'error';
        image.error = error instanceof Error ? error.message : 'Unknown error';
      }
    });

    // Don't await - let them run in parallel
    Promise.all(imagePromises).catch(console.error);
  }

  async processStreamChunk(sessionId: string, chunk: StreamChunk): Promise<StreamChunk> {
    const session = this.sessions.get(sessionId);
    if (!session) return chunk;

    // Update text position
    if (chunk.type === 'text') {
      session.textPosition += chunk.content.length;
    }

    // Check if we need to insert any images at this position
    const imagesToInsert = session.images.filter(img => 
      img.position <= session.textPosition && 
      img.status === 'completed' &&
      !img.url // Not yet inserted
    );

    if (imagesToInsert.length > 0) {
      const image = imagesToInsert[0];
      return {
        type: 'image_ready',
        content: chunk.content,
        position: session.textPosition,
        imageUrl: image.url,
        description: image.description,
        imageId: image.id
      };
    }

    return chunk;
  }

  async waitForImageAtPosition(sessionId: string, position: number): Promise<StreamChunk | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const image = session.images.find(img => img.position === position);
    if (!image) return null;

    // Wait for image to be ready (with timeout)
    const timeout = 30000; // 30 seconds
    const startTime = Date.now();

    while (image.status === 'pending' || image.status === 'generating') {
      if (Date.now() - startTime > timeout) {
        image.status = 'error';
        image.error = 'Generation timeout';
        break;
      }
      
      // Wait 100ms before checking again
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (image.status === 'completed' && image.url) {
      return {
        type: 'image',
        content: '',
        position,
        imageUrl: image.url,
        description: image.description,
        imageId: image.id
      };
    }

    return null;
  }

  async waitForAllImages(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const timeout = 60000; // 60 seconds total
    const startTime = Date.now();

    while (session.images.some(img => img.status === 'pending' || img.status === 'generating')) {
      if (Date.now() - startTime > timeout) {
        // Mark remaining images as timed out
        session.images.forEach(img => {
          if (img.status === 'pending' || img.status === 'generating') {
            img.status = 'error';
            img.error = 'Generation timeout';
          }
        });
        break;
      }
      
      // Wait 500ms before checking again
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    session.isComplete = true;
  }

  getSessionState(sessionId: string): StreamingImageState | undefined {
    return this.sessions.get(sessionId);
  }

  cleanupSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  // Get all pending images for a session
  getPendingImages(sessionId: string): Array<{ id: string; description: string; position: number }> {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    return session.images
      .filter(img => img.status === 'pending' || img.status === 'generating')
      .map(img => ({
        id: img.id,
        description: img.description,
        position: img.position
      }));
  }

  // Get completed images for a session
  getCompletedImages(sessionId: string): Array<{ id: string; url: string; description: string; position: number }> {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    return session.images
      .filter(img => img.status === 'completed' && img.url)
      .map(img => ({
        id: img.id,
        url: img.url!,
        description: img.description,
        position: img.position
      }));
  }

  /**
   * Sanitize image URLs to remove extra characters and ensure proper formatting
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
}

export const streamingImageService = new StreamingImageService();
import { aiImageService, IntelligentImageAnalysis } from './aiImageService';
import { streamingImageService, StreamingImageState, StreamChunk } from './streamingImageService';

export interface DualAgentState {
  sessionId: string;
  backgroundAgent: {
    isActive: boolean;
    imageAnalysis?: IntelligentImageAnalysis;
    imageState?: StreamingImageState;
    completedImages: Map<string, string>; // position -> imageUrl
  };
  mainAgent: {
    isActive: boolean;
    currentPosition: number;
    pendingImagePositions: Set<number>;
  };
  synchronization: {
    imageInsertionQueue: Array<{
      position: number;
      imageUrl: string;
      description: string;
    }>;
  };
}

export class DualAgentService {
  private sessions: Map<string, DualAgentState> = new Map();

  /**
   * Initialize a dual-agent session
   * Background agent: Analyzes and generates images silently
   * Main agent: Streams text response to user
   */
  async initializeDualAgentSession(
    sessionId: string,
    userMessage: string,
    uid: string
  ): Promise<DualAgentState> {
    const state: DualAgentState = {
      sessionId,
      backgroundAgent: {
        isActive: false,
        completedImages: new Map(),
      },
      mainAgent: {
        isActive: false,
        currentPosition: 0,
        pendingImagePositions: new Set(),
      },
      synchronization: {
        imageInsertionQueue: [],
      },
    };

    this.sessions.set(sessionId, state);

    // Start background agent silently (no visible output)
    await this.startBackgroundImageAgent(sessionId, userMessage, uid);

    return state;
  }

  /**
   * Background Agent: Handles image analysis and generation silently
   * This agent works in the background and doesn't produce any visible text
   */
  private async startBackgroundImageAgent(
    sessionId: string,
    userMessage: string,
    uid: string
  ): Promise<void> {
    const state = this.sessions.get(sessionId);
    if (!state) return;

    state.backgroundAgent.isActive = true;

    try {
      // Step 1: Analyze for image requirements (silent)
      const analysis = await aiImageService.analyzeForImageRequirements(userMessage);
      state.backgroundAgent.imageAnalysis = analysis;

      if (analysis.shouldGenerateImages && analysis.imageRequirements?.length > 0) {
        // Step 2: Initialize streaming session (silent)
        await streamingImageService.initializeSession(sessionId, userMessage);
        
        state.backgroundAgent.imageState = streamingImageService.getSessionState(sessionId);

        // Step 3: Start generating all images in parallel (background)
        await this.generateImagesInBackground(sessionId, uid);
      }
    } catch (error) {
      console.error('Background image agent error:', error);
    }

    state.backgroundAgent.isActive = false;
  }

  /**
   * Generate images in background and queue them for insertion
   */
  private async generateImagesInBackground(sessionId: string, uid: string): Promise<void> {
    const state = this.sessions.get(sessionId);
    if (!state?.backgroundAgent.imageState) return;

    try {
      console.log(`🎨 Starting background image generation for session ${sessionId}`);
      
      // Start parallel image generation (no await - runs in background)
      streamingImageService.startParallelImageGeneration(sessionId, uid);
      
      // Monitor for completed images and queue them for insertion
      this.monitorImageCompletion(sessionId);
      
    } catch (error) {
      console.error('Background image generation error:', error);
    }
  }

  /**
   * Monitor image completion and queue them for insertion
   */
  private async monitorImageCompletion(sessionId: string): Promise<void> {
    const state = this.sessions.get(sessionId);
    if (!state) return;

    const checkInterval = setInterval(() => {
      const imageState = streamingImageService.getSessionState(sessionId);
      if (!imageState) {
        clearInterval(checkInterval);
        return;
      }

      // Check for newly completed images
      const completedImages = imageState.images.filter(img => 
        img.status === 'completed' && 
        img.url && 
        !state.backgroundAgent.completedImages.has(img.id)
      );

      for (const image of completedImages) {
        // Smart positioning: Insert images at strategic points in the text
        const basePosition = state.synchronization.imageInsertionQueue.length * 180 + 120;
        const insertionPosition = basePosition + Math.floor(Math.random() * 40);
        
        console.log(`📍 Queueing image for insertion at position ${insertionPosition}`);
        
        state.synchronization.imageInsertionQueue.push({
          position: insertionPosition,
          imageUrl: this.sanitizeImageUrl(image.url!),
          description: image.description,
        });

        // Store completed image
        state.backgroundAgent.completedImages.set(image.id, image.url!);
        
        console.log(`✅ Image queued. Total pending: ${state.synchronization.imageInsertionQueue.length}`);
      }

      // Stop monitoring if all images are complete
      if (imageState.images.every(img => img.status === 'completed' || img.status === 'error')) {
        clearInterval(checkInterval);
        state.backgroundAgent.isActive = false;
        console.log(`🏁 Background image generation completed for session ${sessionId}`);
      }
    }, 1000); // Check every second
  }

  /**
   * Start the main text agent that provides clean responses to users
   */
  async startMainTextAgent(
    sessionId: string,
    userMessage: string,
    onChunk: (chunk: StreamChunk) => void,
    onComplete: () => void,
    sendMessageToAI: (message: string, file: any, onChunk?: (chunk: string) => void) => Promise<string>
  ): Promise<string> {
    const state = this.sessions.get(sessionId);
    if (!state) {
      throw new Error('Session not found');
    }

    state.mainAgent.isActive = true;
    let fullResponse = '';
    let imageIndex = 0;

    try {
      // Enhanced chunk handler that coordinates with background agent
      const enhancedChunkHandler = (chunk: string) => {
        // Update current position based on text length
        state.mainAgent.currentPosition += chunk.length;
        fullResponse += chunk;
        
        // Check if we need to insert image placeholders
        const shouldInsertImage = this.shouldInsertImagePlaceholder(chunk, fullResponse);
        
        // AI will handle image generation directly with img tags
        // No need for loading containers or image placeholders
        
        // Send regular text chunk
        onChunk({
          type: 'text',
          content: chunk,
          position: state.mainAgent.currentPosition,
        });

        // Check if any images are ready to be inserted
        this.checkAndInsertImages(sessionId, onChunk);
      };

      // Generate AI response using existing function with better error handling
      try {
        const response = await sendMessageToAI(userMessage, null, enhancedChunkHandler);
        fullResponse = response || fullResponse;
      } catch (apiError) {
        console.error('API call failed in main text agent:', apiError);
        
        // Provide fallback response
        const fallbackResponse = "I apologize, but I'm experiencing technical difficulties. Please try again in a moment.";
        onChunk({
          type: 'text',
          content: fallbackResponse,
          position: state.mainAgent.currentPosition,
        });
        fullResponse = fallbackResponse;
      }

      // Final check for any remaining images
      await this.checkAndInsertImages(sessionId, onChunk);
      onComplete();

      return fullResponse;

    } catch (error) {
      console.error('Main text agent error:', error);
      
      // Provide error fallback
      const errorResponse = "I encountered an error while processing your request. Please try again.";
      onChunk({
        type: 'text',
        content: errorResponse,
        position: 0,
      });
      
      return errorResponse;
    } finally {
      state.mainAgent.isActive = false;
    }
  }

  /**
   * Determine if an image placeholder should be inserted based on content
   */
  private shouldInsertImagePlaceholder(chunk: string, fullResponse: string): boolean {
    // Insert image placeholder when we encounter certain keywords or patterns
    const imageKeywords = [
      'diagram', 'chart', 'graph', 'illustration', 'image', 'picture',
      'visual', 'drawing', 'sketch', 'plot', 'figure', 'visualization'
    ];
    
    const lowerChunk = chunk.toLowerCase();
    const lowerFullResponse = fullResponse.toLowerCase();
    
    // Check if this chunk contains image-related keywords
    const hasImageKeyword = imageKeywords.some(keyword => 
      lowerChunk.includes(keyword) || lowerFullResponse.includes(keyword)
    );
    
    // Also check for mathematical content that might benefit from visualization
    const hasMathContent = /\b(equation|formula|function|parabola|graph|plot|curve)\b/i.test(fullResponse);
    
    // Insert placeholder if we have image keywords or math content and haven't inserted too many
    const currentImageCount = (fullResponse.match(/data-image-index/g) || []).length;
    
    return (hasImageKeyword || hasMathContent) && currentImageCount < 3;
  }

  /**
   * Check if any images are ready to be inserted at current position
   */
  private async checkAndInsertImages(
    sessionId: string,
    onChunk: (chunk: StreamChunk) => void
  ): Promise<void> {
    const state = this.sessions.get(sessionId);
    if (!state) return;

    // Find images ready to be inserted (at or before current position)
    const readyImages = state.synchronization.imageInsertionQueue.filter(
      (image) => image.position <= state.mainAgent.currentPosition
    );

    // Sort by position to ensure proper order
    readyImages.sort((a, b) => a.position - b.position);

    for (const image of readyImages) {
      console.log(`🖼️ Inserting image at position ${image.position} (current: ${state.mainAgent.currentPosition})`);
      
      // Send image chunk
      onChunk({
        type: 'image_ready',
        content: image.imageUrl,
        description: image.description,
        position: image.position,
      });

      // Remove from queue
      const index = state.synchronization.imageInsertionQueue.indexOf(image);
      if (index > -1) {
        state.synchronization.imageInsertionQueue.splice(index, 1);
      }
    }

    // Log synchronization state for debugging
    if (state.synchronization.imageInsertionQueue.length > 0) {
      console.log(`📊 Sync state - Current position: ${state.mainAgent.currentPosition}, Pending images: ${state.synchronization.imageInsertionQueue.length}`);
    }
  }

  /**
   * Get the current state of a dual-agent session
   */
  getSessionState(sessionId: string): DualAgentState | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Check if background agent has completed image analysis
   */
  isImageAnalysisComplete(sessionId: string): boolean {
    const state = this.sessions.get(sessionId);
    return state ? !state.backgroundAgent.isActive : false;
  }

  /**
   * Get completed images for a session
   */
  getCompletedImages(sessionId: string): Map<string, string> {
    const state = this.sessions.get(sessionId);
    return state ? state.backgroundAgent.completedImages : new Map();
  }

  /**
   * Clean up a dual-agent session
   */
  cleanupSession(sessionId: string): void {
    this.sessions.delete(sessionId);
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

// Export singleton instance
export const dualAgentService = new DualAgentService();
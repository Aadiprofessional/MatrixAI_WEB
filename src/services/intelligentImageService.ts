import { aiImageService, ImageRequirement, IntelligentImageAnalysis } from './aiImageService';

export interface VisualContentDecision {
  shouldGenerate: boolean;
  contentType: 'graph' | 'chart' | 'diagram' | 'svg' | 'plot' | 'visualization' | null;
  reasoning: string;
  description: string;
  imageRequirements: ImageRequirement[];
  totalCoinCost: number;
}

export interface GeneratedVisualContent {
  imageUrl: string;
  imageId: string;
  contentType: string;
  description: string;
  coinCost: number;
  success: boolean;
  error?: string;
  imageRequirements: ImageRequirement[];
}

export interface StreamingImageState {
  imageRequirements: ImageRequirement[];
  currentTextLength: number;
  nextImagePosition: number;
  pendingImages: string[];
  completedImages: Map<string, string>; // imageId -> imageUrl
}

export const intelligentImageService = {
  /**
   * Analyzes user input and AI response to determine if visual content would be beneficial
   * Uses the new AI image generation service for intelligent detection
   */
  analyzeForVisualContent: async (
    userMessage: string, 
    aiResponse: string = '', 
    conversationContext?: string[]
  ): Promise<VisualContentDecision> => {
    try {
      // Use the AI image service for intelligent analysis
      const analysis: IntelligentImageAnalysis = await aiImageService.analyzeForImageRequirements(
        userMessage, 
        aiResponse
      );

      if (!analysis.shouldGenerateImages) {
        return {
          shouldGenerate: false,
          contentType: null,
          reasoning: 'No visual content needed for this conversation',
          description: '',
          imageRequirements: [],
          totalCoinCost: 0
        };
      }

      // Determine the primary content type based on the first image requirement
      let contentType: 'graph' | 'chart' | 'diagram' | 'svg' | 'plot' | 'visualization' | null = 'visualization';
      
      if (analysis.imageRequirements.length > 0) {
        const firstDescription = analysis.imageRequirements[0].description.toLowerCase();
        if (firstDescription.includes('chart')) contentType = 'chart';
        else if (firstDescription.includes('graph')) contentType = 'graph';
        else if (firstDescription.includes('plot')) contentType = 'plot';
        else if (firstDescription.includes('diagram')) contentType = 'diagram';
        else if (firstDescription.includes('svg')) contentType = 'svg';
      }

      return {
        shouldGenerate: true,
        contentType,
        reasoning: `Detected ${analysis.imageRequirements.length} image(s) needed for enhanced explanation`,
        description: analysis.imageRequirements.map(req => req.description).join('; '),
        imageRequirements: analysis.imageRequirements,
        totalCoinCost: analysis.totalCoinCost
      };

    } catch (error) {
      console.error('Error analyzing visual content:', error);
      return {
        shouldGenerate: false,
        contentType: null,
        reasoning: 'Error during analysis',
        description: '',
        imageRequirements: [],
        totalCoinCost: 0
      };
    }
  },

  /**
   * Initialize streaming image generation workflow
   */
  initializeStreamingImages: async (
    userMessage: string,
    userId: string,
    conversationContext?: string[]
  ): Promise<StreamingImageState> => {
    try {
      const analysis = await aiImageService.analyzeForImageRequirements(userMessage);
      
      if (!analysis.shouldGenerateImages) {
        return {
          imageRequirements: [],
          currentTextLength: 0,
          nextImagePosition: -1,
          pendingImages: [],
          completedImages: new Map()
        };
      }

      // Start generating all images in parallel
      const imageRequirements = await aiImageService.generateMultipleImages(userId, analysis.imageRequirements);
      
      // Calculate positions for images in the streaming text
      const positions = aiImageService.calculateImagePositions(1000, imageRequirements.length); // Assume ~1000 chars response
      imageRequirements.forEach((req, index) => {
        req.position = positions[index] || (index + 1) * 200;
      });

      return {
        imageRequirements,
        currentTextLength: 0,
        nextImagePosition: imageRequirements.length > 0 ? imageRequirements[0].position : -1,
        pendingImages: imageRequirements.map(req => req.id),
        completedImages: new Map()
      };

    } catch (error) {
      console.error('Error initializing streaming images:', error);
      return {
        imageRequirements: [],
        currentTextLength: 0,
        nextImagePosition: -1,
        pendingImages: [],
        completedImages: new Map()
      };
    }
  },

  /**
   * Update streaming state as text is being generated
   */
  updateStreamingState: (
    state: StreamingImageState,
    newTextLength: number
  ): {
    state: StreamingImageState;
    shouldShowImage: boolean;
    imageToShow?: ImageRequirement;
  } => {
    const updatedState = { ...state, currentTextLength: newTextLength };
    
    // Check if we've reached the position for the next image
    if (state.nextImagePosition > 0 && newTextLength >= state.nextImagePosition) {
      const nextImageReq = state.imageRequirements.find(req => 
        req.position === state.nextImagePosition && state.pendingImages.includes(req.id)
      );

      if (nextImageReq && aiImageService.isImageReady(state.imageRequirements, nextImageReq.id)) {
        // Image is ready to show
        updatedState.pendingImages = state.pendingImages.filter(id => id !== nextImageReq.id);
        updatedState.completedImages.set(nextImageReq.id, nextImageReq.imageUrl!);
        
        // Find next image position
        const remainingImages = state.imageRequirements.filter(req => 
          updatedState.pendingImages.includes(req.id)
        );
        updatedState.nextImagePosition = remainingImages.length > 0 
          ? Math.min(...remainingImages.map(req => req.position))
          : -1;

        return {
          state: updatedState,
          shouldShowImage: true,
          imageToShow: nextImageReq
        };
      }
    }

    return {
      state: updatedState,
      shouldShowImage: false
    };
  },

  /**
   * Check if all images are ready for immediate display
   */
  areAllImagesReady: (state: StreamingImageState): boolean => {
    return state.imageRequirements.every(req => req.status === 'completed');
  },

  /**
   * Get completed images for display
   */
  getCompletedImages: (state: StreamingImageState): ImageRequirement[] => {
    return state.imageRequirements.filter(req => req.status === 'completed');
  },

  /**
   * Legacy method for backward compatibility - now uses AI generation
   */
  generateIntelligentVisualContent: async (
    userMessage: string,
    aiResponse: string,
    userId: string,
    conversationContext?: string[]
  ): Promise<GeneratedVisualContent> => {
    try {
      const analysis = await aiImageService.analyzeForImageRequirements(userMessage, aiResponse);
      
      if (!analysis.shouldGenerateImages || analysis.imageRequirements.length === 0) {
        throw new Error('No visual content needed');
      }

      // Generate the first image for backward compatibility
      const firstRequirement = analysis.imageRequirements[0];
      const result = await aiImageService.generateImageFromDescription(
        userId,
        firstRequirement.description,
        firstRequirement.coinCost
      );

      if (!result.success || !result.imageUrl) {
        throw new Error(result.error || 'Failed to generate image');
      }

      return {
        imageUrl: result.imageUrl,
        imageId: result.imageId || firstRequirement.id,
        contentType: 'visualization',
        description: firstRequirement.description,
        coinCost: firstRequirement.coinCost,
        success: true,
        imageRequirements: analysis.imageRequirements
      };

    } catch (error) {
      console.error('Error generating visual content:', error);
      return {
        imageUrl: '',
        imageId: '',
        contentType: 'visualization',
        description: '',
        coinCost: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        imageRequirements: []
      };
    }
  }
};

// Helper functions for backward compatibility
export const shouldConsiderVisualContent = (message: string): boolean => {
  const visualKeywords = [
    'chart', 'graph', 'plot', 'diagram', 'visualize', 'show', 'display',
    'create', 'generate', 'draw', 'illustrate', 'represent'
  ];
  
  const lowerMessage = message.toLowerCase();
  return visualKeywords.some(keyword => lowerMessage.includes(keyword));
};

export const extractNumericalData = (text: string): number[] => {
  const numberPattern = /\b\d+(?:\.\d+)?\b/g;
  const matches = text.match(numberPattern);
  return matches ? matches.map(Number) : [];
};

export default intelligentImageService;
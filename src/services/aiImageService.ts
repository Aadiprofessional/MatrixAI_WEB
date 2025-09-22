// AI Image Generation Service
// This service handles intelligent image generation using the AI API

export interface AIImageGenerationRequest {
  uid: string;
  description: string;
  coinCost: number;
}

export interface AIImageGenerationResponse {
  success: boolean;
  message: string;
  imageUrl?: string;
  imageId?: string;
  description?: string;
  coinsDeducted?: number;
  error?: string;
}

export interface ImageRequirement {
  id: string;
  description: string;
  position: number; // Position in text where image should appear
  coinCost: number;
  status: 'pending' | 'generating' | 'completed' | 'error';
  imageUrl?: string;
  imageId?: string;
}

export interface IntelligentImageAnalysis {
  shouldGenerateImages: boolean;
  imageRequirements: ImageRequirement[];
  totalCoinCost: number;
  estimatedPositions: number[]; // Character positions where images should appear
}

class AIImageService {
  private readonly API_BASE_URL = 'https://main-matrixai-server-lujmidrakh.cn-hangzhou.fcapp.run';
  private readonly DEFAULT_COIN_COST = 50;

  /**
   * Analyze user message to determine if images are needed and generate descriptions
   */
  async analyzeForImageRequirements(userMessage: string, aiResponse?: string): Promise<IntelligentImageAnalysis> {
    try {
      // This is where we'll implement intelligent detection
      // For now, let's create a simple detection based on keywords
      const imageKeywords = [
        'chart', 'graph', 'plot', 'diagram', 'visualization', 'image', 'picture',
        'show me', 'create a', 'generate', 'draw', 'illustrate', 'design',
        'bar chart', 'line chart', 'pie chart', 'scatter plot', 'histogram',
        'flowchart', 'tree diagram', 'network diagram', 'architecture'
      ];

      const messageText = (userMessage + ' ' + (aiResponse || '')).toLowerCase();
      const needsImages = imageKeywords.some(keyword => messageText.includes(keyword));

      if (!needsImages) {
        return {
          shouldGenerateImages: false,
          imageRequirements: [],
          totalCoinCost: 0,
          estimatedPositions: []
        };
      }

      // Generate intelligent image descriptions based on the content
      const imageRequirements = await this.generateImageDescriptions(userMessage, aiResponse);

      return {
        shouldGenerateImages: imageRequirements.length > 0,
        imageRequirements,
        totalCoinCost: imageRequirements.length * this.DEFAULT_COIN_COST,
        estimatedPositions: imageRequirements.map(req => req.position)
      };

    } catch (error) {
      console.error('Error analyzing image requirements:', error);
      return {
        shouldGenerateImages: false,
        imageRequirements: [],
        totalCoinCost: 0,
        estimatedPositions: []
      };
    }
  }

  /**
   * Generate detailed image descriptions based on user message and AI response
   */
  private async generateImageDescriptions(userMessage: string, aiResponse?: string): Promise<ImageRequirement[]> {
    const requirements: ImageRequirement[] = [];
    const messageText = userMessage.toLowerCase();
    
    // Advanced pattern matching for mathematical concepts
    if (messageText.includes('parabola')) {
      return this.generateParabolaImages(userMessage);
    }
    
    // Pattern matching for other mathematical concepts
    if (messageText.includes('sine') || messageText.includes('cosine') || messageText.includes('trigonometric')) {
      return this.generateTrigonometricImages(userMessage);
    }
    
    if (messageText.includes('linear') && messageText.includes('equation')) {
      return this.generateLinearEquationImages(userMessage);
    }
    
    // Simple pattern matching for common chart/graph requests
    const chartPatterns = [
      {
        pattern: /bar chart|bar graph/i,
        description: 'Create a professional bar chart with clear labels, grid lines, and appropriate colors'
      },
      {
        pattern: /line chart|line graph/i,
        description: 'Create a clean line chart with smooth curves, data points, and professional styling'
      },
      {
        pattern: /pie chart/i,
        description: 'Create a colorful pie chart with percentage labels and legend'
      },
      {
        pattern: /scatter plot/i,
        description: 'Create a scatter plot with clear data points and trend lines if applicable'
      },
      {
        pattern: /flowchart|flow chart/i,
        description: 'Create a professional flowchart with clear boxes, arrows, and logical flow'
      },
      {
        pattern: /diagram|architecture/i,
        description: 'Create a detailed technical diagram with clear components and connections'
      }
    ];

    const fullText = userMessage + ' ' + (aiResponse || '');
    
    chartPatterns.forEach((pattern, index) => {
      if (pattern.pattern.test(fullText)) {
        requirements.push({
          id: `img_${Date.now()}_${index}`,
          description: `${pattern.description} based on: ${userMessage}`,
          position: Math.floor(Math.random() * 200) + 100, // Rough position estimate
          coinCost: this.DEFAULT_COIN_COST,
          status: 'pending'
        });
      }
    });

    // If no specific patterns matched but keywords suggest images are needed
    if (requirements.length === 0) {
      const generalKeywords = ['create', 'show', 'generate', 'visualize', 'illustrate'];
      if (generalKeywords.some(keyword => fullText.toLowerCase().includes(keyword))) {
        requirements.push({
          id: `img_${Date.now()}_general`,
          description: `Create a detailed visualization or illustration for: ${userMessage}`,
          position: 150,
          coinCost: this.DEFAULT_COIN_COST,
          status: 'pending'
        });
      }
    }

    return requirements;
  }

  /**
   * Generate a single image from description
   */
  async generateImageFromDescription(
    uid: string, 
    description: string, 
    coinCost: number = this.DEFAULT_COIN_COST
  ): Promise<AIImageGenerationResponse> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/ai-image/generateImageFromDescription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid,
          description,
          coinCost
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('Error generating image from description:', error);
      return {
        success: false,
        message: 'Failed to generate image',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate multiple images in parallel
   */
  async generateMultipleImages(
    uid: string, 
    imageRequirements: ImageRequirement[]
  ): Promise<ImageRequirement[]> {
    const promises = imageRequirements.map(async (requirement) => {
      try {
        requirement.status = 'generating';
        const result = await this.generateImageFromDescription(
          uid, 
          requirement.description, 
          requirement.coinCost
        );

        if (result.success && result.imageUrl) {
          requirement.status = 'completed';
          requirement.imageUrl = result.imageUrl;
          requirement.imageId = result.imageId;
        } else {
          requirement.status = 'error';
        }

        return requirement;
      } catch (error) {
        console.error(`Error generating image ${requirement.id}:`, error);
        requirement.status = 'error';
        return requirement;
      }
    });

    return Promise.all(promises);
  }

  /**
   * Check if an image is ready by ID
   */
  isImageReady(imageRequirements: ImageRequirement[], imageId: string): boolean {
    const requirement = imageRequirements.find(req => req.id === imageId);
    return requirement?.status === 'completed' && !!requirement.imageUrl;
  }

  /**
   * Get image URL by ID
   */
  getImageUrl(imageRequirements: ImageRequirement[], imageId: string): string | null {
    const requirement = imageRequirements.find(req => req.id === imageId);
    return requirement?.imageUrl || null;
  }

  /**
   * Generate parabola images based on user request
   */
  private generateParabolaImages(userMessage: string): ImageRequirement[] {
    const requirements: ImageRequirement[] = [];
    
    // Standard parabola examples for educational purposes
    const parabolaTypes = [
      {
        id: 'parabola-basic',
        equation: 'y = x²',
        description: 'Create a clear mathematical graph showing the parabola y = x². Use a coordinate grid with x-axis from -5 to 5 and y-axis from 0 to 25. The parabola should be drawn in blue color, opening upward with vertex at origin (0,0). Include axis labels, grid lines, and the equation y = x² prominently displayed.',
        position: 80
      },
      {
        id: 'parabola-inverted',
        equation: 'y = -x²',
        description: 'Create a mathematical graph showing the inverted parabola y = -x². Use a coordinate grid with x-axis from -5 to 5 and y-axis from -25 to 0. The parabola should be drawn in red color, opening downward with vertex at origin (0,0). Include axis labels, grid lines, and the equation y = -x² prominently displayed.',
        position: 200
      },
      {
        id: 'parabola-shifted',
        equation: 'y = (x-2)² + 1',
        description: 'Create a mathematical graph showing the shifted parabola y = (x-2)² + 1. Use a coordinate grid with x-axis from -2 to 6 and y-axis from 0 to 17. The parabola should be drawn in green color, opening upward with vertex at point (2,1). Include axis labels, grid lines, and the equation y = (x-2)² + 1 prominently displayed.',
        position: 320
      }
    ];

    parabolaTypes.forEach((parabola, index) => {
      requirements.push({
        id: parabola.id,
        description: parabola.description,
        position: parabola.position,
        coinCost: this.DEFAULT_COIN_COST,
        status: 'pending'
      });
    });

    return requirements;
  }

  /**
   * Generate trigonometric function images
   */
  private generateTrigonometricImages(userMessage: string): ImageRequirement[] {
    const requirements: ImageRequirement[] = [];
    
    const trigFunctions = [
      {
        id: 'sine-wave',
        description: 'Create a clear mathematical graph showing the sine function y = sin(x). Use a coordinate grid with x-axis from -2π to 2π and y-axis from -1.5 to 1.5. The sine wave should be drawn in blue color with smooth curves. Include axis labels, grid lines, and the equation y = sin(x) prominently displayed.',
        position: 100
      },
      {
        id: 'cosine-wave',
        description: 'Create a mathematical graph showing the cosine function y = cos(x). Use a coordinate grid with x-axis from -2π to 2π and y-axis from -1.5 to 1.5. The cosine wave should be drawn in red color with smooth curves. Include axis labels, grid lines, and the equation y = cos(x) prominently displayed.',
        position: 250
      }
    ];

    trigFunctions.forEach((func) => {
      requirements.push({
        id: func.id,
        description: func.description,
        position: func.position,
        coinCost: this.DEFAULT_COIN_COST,
        status: 'pending'
      });
    });

    return requirements;
  }

  /**
   * Generate linear equation images
   */
  private generateLinearEquationImages(userMessage: string): ImageRequirement[] {
    const requirements: ImageRequirement[] = [];
    
    const linearEquations = [
      {
        id: 'linear-basic',
        description: 'Create a clear mathematical graph showing a basic linear equation y = 2x + 1. Use a coordinate grid with x-axis from -5 to 5 and y-axis from -9 to 11. The line should be drawn in blue color with clear slope. Include axis labels, grid lines, and the equation y = 2x + 1 prominently displayed.',
        position: 120
      }
    ];

    linearEquations.forEach((equation) => {
      requirements.push({
        id: equation.id,
        description: equation.description,
        position: equation.position,
        coinCost: this.DEFAULT_COIN_COST,
        status: 'pending'
      });
    });

    return requirements;
  }

  /**
   * Estimate where images should appear in streaming text
   */
  calculateImagePositions(textLength: number, imageCount: number): number[] {
    if (imageCount === 0) return [];
    
    const positions: number[] = [];
    const interval = Math.floor(textLength / (imageCount + 1));
    
    for (let i = 1; i <= imageCount; i++) {
      positions.push(interval * i);
    }
    
    return positions;
  }
}

// Export singleton instance
export const aiImageService = new AIImageService();
export default aiImageService;
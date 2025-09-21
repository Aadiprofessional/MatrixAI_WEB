import axios from '../utils/axiosInterceptor';

// Types for the intelligent image generation system
export interface VisualContentDecision {
  shouldGenerate: boolean;
  contentType: 'graph' | 'chart' | 'diagram' | 'svg' | 'plot' | 'visualization' | null;
  reasoning: string;
  pythonCode?: string;
  description?: string;
}

export interface GeneratedVisualContent {
  imageUrl: string;
  imageId: string;
  contentType: string;
  description: string;
  pythonCode: string;
  success: boolean;
  error?: string;
}

export interface PythonExecutionResponse {
  success: boolean;
  imageUrl?: string;
  imageId?: string;
  error?: string;
  output?: string;
}

const API_BASE_URL = process.env.REACT_APP_BACKEND_API_URL;

export const intelligentImageService = {
  /**
   * Analyzes user input and AI response to determine if visual content would be beneficial
   */
  analyzeForVisualContent: async (
    userMessage: string, 
    aiResponse: string, 
    conversationContext?: string[]
  ): Promise<VisualContentDecision> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/intelligent-image/analyze`, {
        userMessage,
        aiResponse,
        conversationContext: conversationContext || []
      });

      return response.data;
    } catch (error) {
      console.error('Error analyzing for visual content:', error);
      return {
        shouldGenerate: false,
        contentType: null,
        reasoning: 'Analysis failed'
      };
    }
  },

  /**
   * Generates Python code for creating visual content based on the analysis
   */
  generatePythonCode: async (
    userMessage: string,
    aiResponse: string,
    contentType: string,
    description: string
  ): Promise<{ pythonCode: string; success: boolean; error?: string }> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/intelligent-image/generate-code`, {
        userMessage,
        aiResponse,
        contentType,
        description
      });

      return {
        pythonCode: response.data.pythonCode,
        success: true
      };
    } catch (error) {
      console.error('Error generating Python code:', error);
      return {
        pythonCode: '',
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate Python code'
      };
    }
  },

  /**
   * Executes Python code in the backend and returns the generated image
   */
  executePythonCode: async (
    pythonCode: string,
    userId: string,
    description: string,
    contentType: string
  ): Promise<PythonExecutionResponse> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/intelligent-image/execute`, {
        pythonCode,
        userId,
        description,
        contentType
      });

      return response.data;
    } catch (error) {
      console.error('Error executing Python code:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute Python code'
      };
    }
  },

  /**
   * Complete workflow: Analyze, generate code, and execute to create visual content
   */
  generateIntelligentVisualContent: async (
    userMessage: string,
    aiResponse: string,
    userId: string,
    conversationContext?: string[]
  ): Promise<GeneratedVisualContent> => {
    try {
      // Step 1: Analyze if visual content is needed
      const decision = await intelligentImageService.analyzeForVisualContent(
        userMessage, 
        aiResponse, 
        conversationContext
      );

      if (!decision.shouldGenerate || !decision.contentType) {
        return {
          imageUrl: '',
          imageId: '',
          contentType: '',
          description: decision.reasoning,
          pythonCode: '',
          success: false,
          error: 'Visual content not needed'
        };
      }

      // Step 2: Generate Python code if not already provided
      let pythonCode = decision.pythonCode || '';
      if (!pythonCode) {
        const codeResult = await intelligentImageService.generatePythonCode(
          userMessage,
          aiResponse,
          decision.contentType,
          decision.description || ''
        );

        if (!codeResult.success) {
          return {
            imageUrl: '',
            imageId: '',
            contentType: decision.contentType,
            description: decision.description || '',
            pythonCode: '',
            success: false,
            error: codeResult.error
          };
        }

        pythonCode = codeResult.pythonCode;
      }

      // Step 3: Execute Python code to generate the image
      const executionResult = await intelligentImageService.executePythonCode(
        pythonCode,
        userId,
        decision.description || '',
        decision.contentType
      );

      return {
        imageUrl: executionResult.imageUrl || '',
        imageId: executionResult.imageId || '',
        contentType: decision.contentType,
        description: decision.description || '',
        pythonCode: pythonCode,
        success: executionResult.success,
        error: executionResult.error
      };

    } catch (error) {
      console.error('Error in intelligent visual content generation:', error);
      return {
        imageUrl: '',
        imageId: '',
        contentType: '',
        description: '',
        pythonCode: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  /**
   * Get the status of a visual content generation task
   */
  getGenerationStatus: async (taskId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: number;
    imageUrl?: string;
    error?: string;
  }> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/intelligent-image/status/${taskId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting generation status:', error);
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Failed to get status'
      };
    }
  },

  /**
   * Save generated visual content to Supabase storage
   */
  saveToSupabase: async (
    imageUrl: string,
    userId: string,
    metadata: {
      contentType: string;
      description: string;
      pythonCode: string;
      userMessage: string;
      aiResponse: string;
    }
  ): Promise<{ success: boolean; supabaseUrl?: string; error?: string }> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/intelligent-image/save-to-supabase`, {
        imageUrl,
        userId,
        metadata
      });

      return response.data;
    } catch (error) {
      console.error('Error saving to Supabase:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save to Supabase'
      };
    }
  }
};

// Helper function to determine if a message might benefit from visual content
export const shouldConsiderVisualContent = (message: string): boolean => {
  const visualKeywords = [
    'graph', 'chart', 'plot', 'diagram', 'visualization', 'visualize',
    'show me', 'draw', 'create', 'generate', 'illustrate', 'display',
    'math', 'equation', 'function', 'data', 'statistics', 'trend',
    'comparison', 'relationship', 'distribution', 'pattern',
    'flowchart', 'timeline', 'process', 'workflow', 'structure',
    'network', 'tree', 'hierarchy', 'map', 'layout'
  ];

  const mathKeywords = [
    'sine', 'cosine', 'tangent', 'logarithm', 'exponential', 'polynomial',
    'derivative', 'integral', 'limit', 'series', 'sequence', 'matrix',
    'vector', 'geometry', 'trigonometry', 'calculus', 'algebra'
  ];

  const dataKeywords = [
    'dataset', 'analysis', 'correlation', 'regression', 'histogram',
    'scatter', 'bar chart', 'pie chart', 'line graph', 'box plot',
    'heatmap', 'distribution', 'frequency', 'probability'
  ];

  const allKeywords = [...visualKeywords, ...mathKeywords, ...dataKeywords];
  const lowerMessage = message.toLowerCase();

  return allKeywords.some(keyword => lowerMessage.includes(keyword));
};

// Helper function to extract numerical data from text
export const extractNumericalData = (text: string): number[] => {
  const numberRegex = /-?\d+\.?\d*/g;
  const matches = text.match(numberRegex);
  return matches ? matches.map(Number).filter(n => !isNaN(n)) : [];
};

export default intelligentImageService;
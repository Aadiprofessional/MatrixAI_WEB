interface VideoCreationResponse {
  message: string;
  videoId: string;
  taskId: string;
  taskStatus: string; // Server returns taskStatus for the initial status
  status?: string; // Keep this for backward compatibility
  requestId?: string;
  coinsDeducted?: number;
  imageUrl?: string; // For image-to-video API
  videoUrl?: string; // For immediate video URL response
  error?: string; // For error responses
}

// VideoStatusResponse interface removed as it's no longer needed - no polling required

interface VideoListResponse {
  message: string;
  videos: Array<{
    video_id: string;
    prompt_text: string;
    size: string;
    task_status: string;
    video_url?: string;
    created_at: string;
  }>;
  totalCount: number;
}

interface EnhancedVideoListResponse {
  message: string;
  uid: string;
  summary: {
    total: number;
    ready: number;
    processing: number;
    failed: number;
    unknown: number;
  };
  videos: Array<{
    videoId: string;
    promptText: string;
    size: string;
    taskId: string;
    taskStatus: string;
    statusDisplay: string;
    isReady: boolean;
    hasVideo: boolean;
    videoUrl?: string;
    createdAt: string;
    ageDisplay: string;
    apiType: string;
    requestId?: string;
    submitTime?: string;
    scheduledTime?: string;
    endTime?: string;
    origPrompt?: string;
    actualPrompt?: string;
  }>;
  totalCount: number;
}

interface VideoRemoveResponse {
  message: string;
}

const API_BASE_URL = 'https://main-matrixai-server-lujmidrakh.cn-hangzhou.fcapp.run';

export const videoService = {
  /**
   * Validates if an image URL is from a supported domain and has a valid format
   */
  validateImageUrl: (imageUrl: string): { isValid: boolean; message?: string } => {
    try {
      // Log the original URL for debugging
      console.log('Original image URL in validateImageUrl:', imageUrl);
      
      // Clean the URL - remove quotes, backticks, and spaces using multiple steps
      let cleanedUrl = imageUrl;
      // First trim any whitespace
      cleanedUrl = cleanedUrl.trim();
      // Then remove all quotes and backticks
      cleanedUrl = cleanedUrl.replace(/["'`]/g, '');
      // No longer removing spaces as they should be properly handled by the API
      
      console.log('Final cleaned URL in validateImageUrl:', cleanedUrl);
      
      // Check if it's a valid URL format
      const url = new URL(cleanedUrl);
      
      // Check if it's from a supported domain
      const supportedDomains = [
        'supabase.co',
        'supabase.in',
        'amazonaws.com',
        'cloudfront.net',
        'imgur.com',
        'ibb.co',
        'postimg.cc'
      ];
      
      const isDomainSupported = supportedDomains.some(domain => url.hostname.includes(domain));
      if (!isDomainSupported) {
        return { 
          isValid: false, 
          message: `Image URL domain not supported. Please use images from supported services like Supabase, AWS, or image hosting sites.` 
        };
      }
      
      // Check if it has a valid image extension
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      const hasValidExtension = validExtensions.some(ext => url.pathname.toLowerCase().endsWith(ext));
      
      if (!hasValidExtension && !url.pathname.includes('object/public')) {
        return { 
          isValid: false, 
          message: `Image URL does not have a valid image extension. Please use .jpg, .jpeg, .png, .gif, or .webp files.` 
        };
      }
      
      return { isValid: true };
    } catch (error) {
      return { 
        isValid: false, 
        message: `Invalid image URL format: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  },
  
  // Create video with image URL
  createVideoWithUrl: async (uid: string, promptText: string, image_url: string, negative_prompt?: string, template?: string): Promise<VideoCreationResponse> => {
    // Log the original image URL for debugging
    console.log('Original image_url:', image_url);
    
    // Clean and validate the image URL - remove quotes, backticks, and extra spaces
    // Apply thorough cleaning in multiple steps
    let cleanedImageUrl = image_url;
    // First trim any whitespace
    cleanedImageUrl = cleanedImageUrl.trim();
    // Then remove all quotes and backticks - ensure we're removing ALL backticks
    cleanedImageUrl = cleanedImageUrl.replace(/["'`]/g, '');
    // Double-check for any remaining backticks (sometimes regex can miss them)
    while (cleanedImageUrl.includes('`')) {
      cleanedImageUrl = cleanedImageUrl.replace('`', '');
    }
    
    console.log('Cleaned image_url:', cleanedImageUrl);
    
    // Validate the image URL
    const validation = videoService.validateImageUrl(cleanedImageUrl);
    if (!validation.isValid) {
      console.error('Image URL validation failed:', validation.message);
      throw new Error(validation.message || 'Invalid image URL');
    }
    
    console.log('Image URL is valid');
    
    // Additional validation for DashScope API requirements
    if (cleanedImageUrl.includes('`')) {
      console.error('WARNING: Image URL still contains backticks after initial cleaning');
      // Force remove ALL backticks using string split and join
      cleanedImageUrl = cleanedImageUrl.split('`').join('');
      console.log('Additional cleaning applied to image URL:', cleanedImageUrl);
    }
    
    // Create request body with required fields based on the selected option
    const requestBody: any = {
      uid,
      image_url: cleanedImageUrl
    };
    
    // Handle the two specific API call options
    if (template) {
      // Option 1: Template-based Generation
      requestBody.template = template.trim();
      // For template-based generation, include empty promptText to satisfy API requirement
    
      // Send image_url, template, empty promptText, negative_prompt, and uid
    } else {
      // Option 2: Text-to-Video with Negative Prompt
      requestBody.promptText = promptText.trim();
      // Always include negative_prompt for Text-to-Video with Negative Prompt option
   
      // Send image_url, prompt, negative_prompt, and uid
    }
    
    console.log('createVideoWithUrl request body:', requestBody);
    
    // Final verification of the image URL before sending to API
    if (requestBody.image_url.includes('`')) {
      console.error('WARNING: Image URL still contains backticks after cleaning');
      // Force remove any remaining backticks
      requestBody.image_url = requestBody.image_url.split('`').join('');
      console.log('Final cleaned image_url:', requestBody.image_url);
    }
    
    try {
      // Add Accept header to match curl command
      // Convert to JSON string and verify no backticks remain
      let requestBodyString = JSON.stringify(requestBody);
      
      // Final safety check - ensure no backticks in the stringified JSON
      if (requestBodyString.includes('`')) {
        console.error('WARNING: Stringified request body still contains backticks');
        // Replace any remaining backticks in the JSON string
        requestBodyString = requestBodyString.replace(/`/g, '');
        console.log('Final cleaned request body string:', requestBodyString);
      }
      
      const response = await fetch(`${API_BASE_URL}/api/video/createVideowithurl`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: requestBodyString,
      });

      // Log the response status and headers
      console.log('createVideoWithUrl response status:', response.status);
      console.log('createVideoWithUrl response status text:', response.statusText);
      
      if (!response.ok) {
        // Try to get the error response body
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        
        // Define an interface for the error data
        interface ErrorData {
          message?: string;
          error?: string;
          details?: string;
        }
        
        let errorData: ErrorData = {};
        try {
          errorData = JSON.parse(errorText) as ErrorData;
          
          // Check for specific DashScope API error about media resource timeout
          if (errorData.error && errorData.error.includes('Download the media resource timed out')) {
            console.error('DashScope media resource timeout detected');
            throw new Error('Image download timeout: The server could not download your image. Please ensure your image is accessible and try again with a smaller image file or a different image.');
          }
          
          // Check for other DashScope API errors
          if (errorData.error && errorData.error.includes('DashScope API error')) {
            const errorMessage = 'AI service error: The video generation AI encountered an issue. ' + 
                              (errorData.error.includes('Bad Request') ? 'Your request format may be incorrect. ' : '') + 
                              'Please try with a different image or prompt.';
            throw new Error(errorMessage);
          }
        } catch (e) {
          if (e instanceof Error && e.message.includes('Image download timeout')) {
            // Re-throw the specific error we just created
            throw e;
          }
          console.error('Failed to parse error response as JSON:', e);
        }
        
        throw new Error(errorData.message || errorData.error || `Failed to create video from image (Status: ${response.status})`);
      }

      const responseData = await response.json();
      console.log('createVideoWithUrl response data:', responseData);
      return responseData;
    } catch (error) {
      console.error('createVideoWithUrl caught error:', error);
      throw error;
    }
  },
  
  // Create video
  createVideo: async (uid: string, promptText: string, size: string = '1280*720'): Promise<VideoCreationResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/video/createVideo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid,
        promptText,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || 'Failed to create video');
    }

    return response.json();
  },

  // getVideoStatus function removed as it's no longer needed - no polling required

  // Get all videos (simple)
  getAllVideos: async (uid: string): Promise<VideoListResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/video/getAllVideos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || 'Failed to get videos');
    }

    return response.json();
  },

  // Get all videos (enhanced with GET endpoint)
  getAllVideosEnhanced: async (uid: string): Promise<EnhancedVideoListResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/video/getAllVideos/${encodeURIComponent(uid)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || 'Failed to get enhanced videos');
    }

    return response.json();
  },

  // Remove video
  removeVideo: async (uid: string, videoId: string): Promise<VideoRemoveResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/video/removeVideo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid,
        videoId
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to remove video');
    }

    return response.json();
  }
};
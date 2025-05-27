interface ImageGenerationResponse {
  images: Array<{
    url: string;
    image_id?: string;
  }>;
}

interface ImageHistoryResponse {
  data: Array<{
    image_id: string;
    image_url: string;
    prompt: string;
    created_at: string;
  }>;
}

interface RemoveImageResponse {
  success: boolean;
  message: string;
}

export const imageService = {
  // Generate images using the same endpoint as React Native app
  generateImage: async (text: string, uid: string, imageCount: number = 1): Promise<ImageGenerationResponse> => {
    const response = await fetch(
      "https://ddtgdhehxhgarkonvpfq.supabase.co/functions/v1/generateImage2",
      { 
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkdGdkaGVoeGhnYXJrb252cGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2Njg4MTIsImV4cCI6MjA1MDI0NDgxMn0.mY8nx-lKrNXjJxHU7eEja3-fTSELQotOP4aZbxvmNPY`,
        },
        body: JSON.stringify({ 
          text: text, 
          uid: uid,
          imageCount: imageCount 
        })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to generate images');
    }

    return response.json();
  },

  // Get image history for a user
  getImageHistory: async (uid: string, page: number = 1, limit: number = 10): Promise<ImageHistoryResponse> => {
    const response = await fetch(
      `https://matrix-server.vercel.app/getGeneratedImage?uid=${uid}&page=${page}&limit=${limit}`,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch image history');
    }

 
    return response.json();
  
  },

  // Remove an image
  removeImage: async (uid: string, imageId: string): Promise<RemoveImageResponse> => {
    const response = await fetch('https://matrix-server.vercel.app/removeImage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        uid: uid,
        image_id: imageId
      })
    });

    if (!response.ok) {
      throw new Error('Failed to remove image');
    }

    return response.json();
  }
}; 
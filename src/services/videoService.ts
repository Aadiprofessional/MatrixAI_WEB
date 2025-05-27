interface VideoGenerationResponse {
  videoId: string;
  taskStatus: string;
}

interface VideoStatusResponse {
  taskStatus: string;
  videoUrl?: string;
}

interface VideoHistoryResponse {
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
    videoUrl: string;
    createdAt: string;
    ageDisplay: string;
    apiType: string;
    requestId: string;
    submitTime: string;
    scheduledTime: string;
    endTime: string;
    origPrompt: string;
    actualPrompt: string;
    imageUrl?: string;
    ratio?: string;
    duration?: string;
    videoStyle?: string;
  }>;
  totalCount: number;
}

interface RemoveVideoResponse {
  success: boolean;
  message: string;
}

export const videoService = {
  // Create/initiate video generation
  createVideo: async (uid: string, promptText: string): Promise<VideoGenerationResponse> => {
    const response = await fetch('https://matrix-server.vercel.app/createVideo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        uid: uid,
        promptText: promptText
      })
    });

    if (!response.ok) {
      throw new Error('Failed to initiate video generation');
    }

    return response.json();
  },

  // Get video status and URL
  getVideo: async (uid: string, videoId: string): Promise<VideoStatusResponse> => {
    const response = await fetch(
      `https://matrix-server.vercel.app/getVideo?uid=${uid}&videoId=${videoId}`,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to check video status');
    }

    return response.json();
  },

  // Get all videos for a user
  getAllVideos: async (uid: string): Promise<VideoHistoryResponse> => {
    const response = await fetch(
      `https://matrix-server.vercel.app/getAllVideos?uid=${uid}`,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch video history');
    }

    return response.json();
  },

  // Remove a video
  removeVideo: async (uid: string, videoId: string): Promise<RemoveVideoResponse> => {
    const response = await fetch('https://matrix-server.vercel.app/removeVideo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        uid: uid,
        videoId: videoId
      })
    });

    if (!response.ok) {
      throw new Error('Failed to remove video');
    }

    return response.json();
  }
}; 
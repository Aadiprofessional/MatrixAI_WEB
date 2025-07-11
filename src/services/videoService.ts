interface VideoCreationResponse {
  message: string;
  videoId: string;
  taskId: string;
  taskStatus: string; // Server returns taskStatus for the initial status
  status?: string; // Keep this for backward compatibility
  requestId?: string;
  coinsDeducted?: number;
}

interface VideoStatusResponse {
  message: string;
  videoId?: string;
  status?: string;
  taskStatus?: string; // Server returns taskStatus for video generation status
  videoUrl?: string;
  error?: string;
  submitTime?: string;
  endTime?: string;
  origPrompt?: string;
  actualPrompt?: string;
}

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
        size
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || 'Failed to create video');
    }

    return response.json();
  },

  // Get video status
  getVideoStatus: async (uid: string, videoId: string): Promise<VideoStatusResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/video/getVideoStatus`, {
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
      throw new Error(errorData.message || errorData.error || 'Failed to get video status');
    }

    return response.json();
  },

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
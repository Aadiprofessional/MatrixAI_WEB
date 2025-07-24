// Content Service Interfaces
interface ContentItem {
  id: string;
  uid: string;
  prompt: string;
  content: string;
  title: string;
  tags: string[];
  content_type: string;
  tone: string;
  language: string;
  created_at: string;
  updated_at: string;
}

interface SaveContentResponse {
  success: boolean;
  message: string;
  id: string;
}

interface GetUserContentResponse {
  success: boolean;
  content: ContentItem[];
  total?: number;
  totalItems?: number;
  currentPage?: number;
  itemsPerPage?: number;
  totalPages?: number;
}

interface GetContentResponse {
  success: boolean;
  content: ContentItem;
}

interface DeleteContentResponse {
  success: boolean;
  message: string;
}

interface ShareContentResponse {
  success: boolean;
  message: string;
  shareId: string;
  shareUrl: string;
}

interface SharedContentResponse {
  success: boolean;
  content: ContentItem;
}

interface DownloadContentResponse {
  success: boolean;
  content: string;
  filename: string;
}

const API_BASE_URL = 'https://main-matrixai-server-lujmidrakh.cn-hangzhou.fcapp.run';

export const contentService = {
  // Save content to the database
  saveContent: async (uid: string, prompt: string, content: string, title: string, tags: string[], content_type: string, tone: string, language: string): Promise<SaveContentResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/content/saveContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid,
        prompt,
        content,
        title,
        tags,
        content_type,
        tone,
        language
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || 'Failed to save content');
    }

    return response.json();
  },

  // Get all content for a user with optional filters and pagination
  getUserContent: async (uid: string, options?: { contentType?: string, searchQuery?: string, page?: number, limit?: number }): Promise<GetUserContentResponse> => {
    let url = `${API_BASE_URL}/api/content/getUserContent?uid=${encodeURIComponent(uid)}`;
    
    if (options?.contentType) {
      url += `&contentType=${encodeURIComponent(options.contentType)}`;
    }
    
    if (options?.searchQuery) {
      url += `&searchQuery=${encodeURIComponent(options.searchQuery)}`;
    }
    
    if (options?.page) {
      url += `&page=${options.page}`;
    }
    
    if (options?.limit) {
      url += `&limit=${options.limit}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || 'Failed to get user content');
    }

    return response.json();
  },

  // Get specific content by ID
  getContent: async (uid: string, contentId: string): Promise<GetContentResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/content/getContent?uid=${encodeURIComponent(uid)}&contentId=${encodeURIComponent(contentId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || 'Failed to get content');
    }

    return response.json();
  },

  // Delete content by ID
  deleteContent: async (uid: string, contentId: string): Promise<DeleteContentResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/content/deleteContent`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid,
        contentId
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || 'Failed to delete content');
    }

    return response.json();
  },

  // Share content by ID
  shareContent: async (uid: string, contentId: string): Promise<ShareContentResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/content/shareContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid,
        contentId
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || 'Failed to share content');
    }

    return response.json();
  },

  // Get shared content by share ID
  getSharedContent: async (shareId: string): Promise<SharedContentResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/content/shared/${encodeURIComponent(shareId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || 'Failed to get shared content');
    }

    return response.json();
  },

  // Download content in specified format
  downloadContent: async (uid: string, contentId: string, format: string): Promise<DownloadContentResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/content/downloadContent/${encodeURIComponent(contentId)}?uid=${encodeURIComponent(uid)}&format=${encodeURIComponent(format)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || 'Failed to download content');
    }

    return response.json();
  }
};
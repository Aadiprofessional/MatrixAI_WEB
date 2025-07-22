interface AudioFile {
  audioid: string;
  audio_url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  duration: number;
  uploaded_at: string;
  transcription?: string;
  words_data?: Array<{
    word: string;
    start: number;
    end: number;
    confidence: number;
    punctuated_word: string;
  }>;
  language?: string;
  error_message?: string;
}

interface AudioUploadResponse {
  success: boolean;
  audioid: string;
  status: string;
  transcription?: string;
  message: string;
  error_message?: string;
  audio_name?: string;
}

interface AudioStatusResponse {
  success: boolean;
  audioid: string;
  status: string;
  error_message?: string;
}

interface AudioFileResponse {
  success: boolean;
  audioid: string;
  status: string;
  audioUrl: string;
  transcription?: string;
  words_data?: Array<{
    word: string;
    start: number;
    end: number;
    confidence: number;
    punctuated_word: string;
  }>;
  language?: string;
  duration?: number;
  uploaded_at: string;
  error_message?: string;
}

interface AudioListResponse {
  success: boolean;
  audioFiles: AudioFile[];
}

interface AudioDataResponse {
  audioData: Array<{
    audioid: string;
    duration: number;
    uploaded_at: string;
    audio_name: string;
    audio_url: string;
    language: string;
  }>;
}

interface AudioRemoveResponse {
  message: string;
}

interface AudioEditResponse {
  message: string;
  updatedAudio: any;
}

interface XmlGraphResponse {
  message: string;
  data: any;
}

const API_BASE_URL = 'https://main-matrixai-server-lujmidrakh.cn-hangzhou.fcapp.run';

export const audioService = {
  // Upload audio URL for transcription
  uploadAudioUrl: async (uid: string, audioUrl: string, language: string = 'en-GB', duration?: number, audio_name?: string): Promise<AudioUploadResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/audio/uploadAudioUrl`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid,
        audioUrl,
        language,
        duration,
        audio_name
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || 'Failed to upload audio URL');
    }

    return response.json();
  },

  // Get audio transcription status and results
  getAudioStatus: async (uid: string, audioid: string): Promise<AudioStatusResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/audio/getAudioStatus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid,
        audioid
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || 'Failed to get audio status');
    }

    return response.json();
  },

  // Get specific audio file details
  getAudioFile: async (uid: string, audioid: string): Promise<AudioFileResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/audio/getAudioFile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid,
        audioid
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || 'Failed to get audio file');
    }

    return response.json();
  },

  // Get all audio files for a user
  getAllAudioFiles: async (uid: string): Promise<AudioListResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/audio/getAllAudioFiles`, {
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
      throw new Error(errorData.message || errorData.error || 'Failed to get audio files');
    }

    return response.json();
  },

  // Get audio by UID (GET endpoint)
  getAudio: async (uid: string): Promise<AudioDataResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/audio/getAudio/${uid}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to get audio data');
    }

    return response.json();
  },

  // Remove audio file
  removeAudio: async (uid: string, audioid: string): Promise<AudioRemoveResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/audio/removeAudio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid,
        audioid
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to remove audio');
    }

    return response.json();
  },

  // Edit audio name
  editAudio: async (uid: string, audioid: string, updatedName: string): Promise<AudioEditResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/audio/editAudio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid,
        audioid,
        updatedName
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to edit audio');
    }

    return response.json();
  },

  // Send XML graph data
  sendXmlGraph: async (uid: string, audioid: string, xmlData: string): Promise<XmlGraphResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/audio/sendXmlGraph`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid,
        audioid,
        xmlData
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to send XML graph data');
    }

    return response.json();
  }
};
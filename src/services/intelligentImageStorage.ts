import { supabase } from '../supabaseClient';

export interface IntelligentImageMetadata {
  user_id: string;
  image_id: string;
  image_url: string;
  content_type: string;
  description: string;
  coin_cost: number;
  user_message: string;
  ai_response: string;
  generation_timestamp: string;
  file_size?: number;
  file_name?: string;
}

export interface StoredIntelligentImage {
  id: string;
  user_id: string;
  image_id: string;
  image_url: string;
  content_type: string;
  description: string;
  coin_cost: number;
  user_message: string;
  ai_response: string;
  created_at: string;
  file_size?: number;
  file_name?: string;
}

export const intelligentImageStorage = {
  /**
   * Save generated image metadata to Supabase
   */
  saveImageMetadata: async (metadata: IntelligentImageMetadata): Promise<{
    success: boolean;
    data?: StoredIntelligentImage;
    error?: string;
  }> => {
    try {
      const { data, error } = await supabase
        .from('intelligent_generated_images')
        .insert([{
          user_id: metadata.user_id,
          image_id: metadata.image_id,
          image_url: metadata.image_url,
          content_type: metadata.content_type,
          description: metadata.description,
          coin_cost: metadata.coin_cost,
          user_message: metadata.user_message,
          ai_response: metadata.ai_response,
          file_size: metadata.file_size,
          file_name: metadata.file_name,
          created_at: metadata.generation_timestamp
        }])
        .select()
        .single();

      if (error) {
        console.error('Error saving image metadata:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data as StoredIntelligentImage
      };
    } catch (error) {
      console.error('Error in saveImageMetadata:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Get all generated images for a user
   */
  getUserGeneratedImages: async (userId: string, limit: number = 50, offset: number = 0): Promise<{
    success: boolean;
    data?: StoredIntelligentImage[];
    error?: string;
  }> => {
    try {
      const { data, error } = await supabase
        .from('intelligent_generated_images')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching user generated images:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data as StoredIntelligentImage[]
      };
    } catch (error) {
      console.error('Error in getUserGeneratedImages:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Get a specific generated image by ID
   */
  getGeneratedImageById: async (imageId: string, userId: string): Promise<{
    success: boolean;
    data?: StoredIntelligentImage;
    error?: string;
  }> => {
    try {
      const { data, error } = await supabase
        .from('intelligent_generated_images')
        .select('*')
        .eq('image_id', imageId)
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching generated image:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data as StoredIntelligentImage
      };
    } catch (error) {
      console.error('Error in getGeneratedImageById:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Delete a generated image record
   */
  deleteGeneratedImage: async (imageId: string, userId: string): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      const { error } = await supabase
        .from('intelligent_generated_images')
        .delete()
        .eq('image_id', imageId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting generated image:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true
      };
    } catch (error) {
      console.error('Error in deleteGeneratedImage:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Upload image file to Supabase storage
   */
  uploadImageToStorage: async (
    imageBlob: Blob,
    fileName: string,
    userId: string
  ): Promise<{
    success: boolean;
    publicUrl?: string;
    error?: string;
  }> => {
    try {
      const filePath = `intelligent-generated/${userId}/${Date.now()}-${fileName}`;

      const { data, error } = await supabase.storage
        .from('generated-images')
        .upload(filePath, imageBlob, {
          contentType: 'image/png',
          upsert: false
        });

      if (error) {
        console.error('Error uploading image to storage:', error);
        return {
          success: false,
          error: error.message
        };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('generated-images')
        .getPublicUrl(filePath);

      return {
        success: true,
        publicUrl: urlData.publicUrl
      };
    } catch (error) {
      console.error('Error in uploadImageToStorage:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Download image from URL and upload to Supabase storage
   */
  downloadAndUploadImage: async (
    imageUrl: string,
    fileName: string,
    userId: string
  ): Promise<{
    success: boolean;
    publicUrl?: string;
    error?: string;
  }> => {
    try {
      // Download the image
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }

      const imageBlob = await response.blob();
      
      // Upload to Supabase storage
      return await intelligentImageStorage.uploadImageToStorage(
        imageBlob,
        fileName,
        userId
      );
    } catch (error) {
      console.error('Error in downloadAndUploadImage:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Search generated images by content type or description
   */
  searchGeneratedImages: async (
    userId: string,
    searchTerm: string,
    contentType?: string
  ): Promise<{
    success: boolean;
    data?: StoredIntelligentImage[];
    error?: string;
  }> => {
    try {
      let query = supabase
        .from('intelligent_generated_images')
        .select('*')
        .eq('user_id', userId);

      if (contentType) {
        query = query.eq('content_type', contentType);
      }

      if (searchTerm) {
        query = query.or(`description.ilike.%${searchTerm}%,user_message.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error searching generated images:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data: data as StoredIntelligentImage[]
      };
    } catch (error) {
      console.error('Error in searchGeneratedImages:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  /**
   * Get statistics about user's generated images
   */
  getGenerationStats: async (userId: string): Promise<{
    success: boolean;
    data?: {
      totalImages: number;
      imagesByType: Record<string, number>;
      recentActivity: number;
    };
    error?: string;
  }> => {
    try {
      // Get total count
      const { count: totalImages, error: countError } = await supabase
        .from('intelligent_generated_images')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (countError) {
        throw countError;
      }

      // Get images by type
      const { data: typeData, error: typeError } = await supabase
        .from('intelligent_generated_images')
        .select('content_type')
        .eq('user_id', userId);

      if (typeError) {
        throw typeError;
      }

      const imagesByType: Record<string, number> = {};
      typeData?.forEach(item => {
        imagesByType[item.content_type] = (imagesByType[item.content_type] || 0) + 1;
      });

      // Get recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count: recentActivity, error: recentError } = await supabase
        .from('intelligent_generated_images')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', sevenDaysAgo.toISOString());

      if (recentError) {
        throw recentError;
      }

      return {
        success: true,
        data: {
          totalImages: totalImages || 0,
          imagesByType,
          recentActivity: recentActivity || 0
        }
      };
    } catch (error) {
      console.error('Error in getGenerationStats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};

export default intelligentImageStorage;
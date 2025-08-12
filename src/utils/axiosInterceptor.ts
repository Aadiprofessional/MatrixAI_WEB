import axios from 'axios';
import { handleAuthError } from './authErrorHandler';

// Create axios interceptor for global authentication error handling
axios.interceptors.response.use(
  (response) => {
    // Return successful responses as-is
    return response;
  },
  (error) => {
    // Handle authentication errors globally
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.message || '';
      
      // Check for authentication errors
      if (status === 401 || status === 403 || 
          message.includes('Auth session missing') ||
          message.includes('authentication') ||
          message.includes('unauthorized')) {
        
        console.log('Axios interceptor caught auth error:', error);
        handleAuthError(error, true);
      }
    }
    
    // Re-throw the error so it can still be handled locally if needed
    return Promise.reject(error);
  }
);

export default axios;
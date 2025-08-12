import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleAuthError as globalHandleAuthError } from '../utils/authErrorHandler';

/**
 * Custom hook for handling authentication errors in React components
 * Provides a convenient way to handle auth errors with automatic navigation
 */
export const useAuthErrorHandler = () => {
  const navigate = useNavigate();

  /**
   * Handle authentication errors with optional custom navigation
   * @param error - The error to handle
   * @param redirectPath - Custom redirect path (defaults to '/login')
   * @param shouldRedirect - Whether to redirect (defaults to true)
   */
  const handleAuthError = useCallback(async (
    error: any, 
    redirectPath: string = '/login', 
    shouldRedirect: boolean = true
  ) => {
    try {
      // Use the global auth error handler
      const wasHandled = await globalHandleAuthError(error, false); // Don't let global handler redirect
      
      // If it was an auth error and we should redirect, navigate to the specified path
      if (wasHandled && shouldRedirect) {
        navigate(redirectPath);
      }
      
      return wasHandled;
    } catch (handlerError) {
      console.error('Error in auth error handler:', handlerError);
      return false;
    }
  }, [navigate]);

  /**
   * Wrapper for API calls that automatically handles auth errors
   * @param apiCall - The API call function to wrap
   * @param redirectPath - Custom redirect path on auth error
   * @returns Promise with the API call result
   */
  const withAuthErrorHandling = useCallback(async <T>(
    apiCall: () => Promise<T>,
    redirectPath: string = '/login'
  ): Promise<T> => {
    try {
      return await apiCall();
    } catch (error) {
      const wasAuthError = await handleAuthError(error, redirectPath);
      
      // If it wasn't an auth error, re-throw the original error
      if (!wasAuthError) {
        throw error;
      }
      
      // For auth errors, throw a more user-friendly error
      throw new Error('Authentication required. Please log in again.');
    }
  }, [handleAuthError]);

  return {
    handleAuthError,
    withAuthErrorHandling
  };
};

export default useAuthErrorHandler;
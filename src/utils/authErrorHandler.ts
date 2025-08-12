import { supabase } from '../supabaseClient';

/**
 * Global authentication error handler
 * Handles 403 errors and session-related issues across the application
 */
export class AuthErrorHandler {
  private static instance: AuthErrorHandler;
  private isHandlingAuthError = false;

  private constructor() {}

  public static getInstance(): AuthErrorHandler {
    if (!AuthErrorHandler.instance) {
      AuthErrorHandler.instance = new AuthErrorHandler();
    }
    return AuthErrorHandler.instance;
  }

  /**
   * Handle authentication errors from API responses
   * @param error - The error object from API calls
   * @param redirectToLogin - Whether to redirect to login page
   * @returns boolean - true if error was handled, false otherwise
   */
  public async handleAuthError(error: any, redirectToLogin: boolean = true): Promise<boolean> {
    // Prevent multiple simultaneous auth error handling
    if (this.isHandlingAuthError) {
      return true;
    }

    // Check if this is an authentication-related error
    if (this.isAuthError(error)) {
      this.isHandlingAuthError = true;
      
      try {
        console.log('Authentication error detected, cleaning up session...');
        
        // Clear local storage
        localStorage.removeItem('matrixai_session');
        localStorage.removeItem('matrixai_user');
        localStorage.removeItem('matrixai_userData');
        localStorage.removeItem('matrixai_userDataTimestamp');
        
        // Try to sign out from Supabase (but don't throw if it fails)
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            await supabase.auth.signOut();
          }
        } catch (signOutError) {
          // Ignore sign out errors since we're already handling an auth error
          console.log('Sign out failed during auth error handling:', signOutError);
        }
        
        // Redirect to login if requested
        if (redirectToLogin && typeof window !== 'undefined') {
          // Use a small delay to ensure cleanup is complete
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        }
        
        return true;
      } finally {
        this.isHandlingAuthError = false;
      }
    }
    
    return false;
  }

  /**
   * Check if an error is authentication-related
   * @param error - The error to check
   * @returns boolean - true if it's an auth error
   */
  private isAuthError(error: any): boolean {
    // Check for 403 status code
    if (error?.response?.status === 403) {
      return true;
    }
    
    // Check for 401 status code
    if (error?.response?.status === 401) {
      return true;
    }
    
    // Check for auth session missing error
    if (error?.message && error.message.includes('Auth session missing')) {
      return true;
    }
    
    // Check for other auth-related error messages
    const authErrorMessages = [
      'unauthorized',
      'authentication failed',
      'invalid token',
      'token expired',
      'session expired',
      'access denied'
    ];
    
    const errorMessage = (error?.message || error?.response?.data?.message || '').toLowerCase();
    return authErrorMessages.some(msg => errorMessage.includes(msg));
  }

  /**
   * Wrap fetch calls with automatic auth error handling
   * @param url - The URL to fetch
   * @param options - Fetch options
   * @returns Promise<Response>
   */
  public async fetchWithAuthHandling(url: string, options: RequestInit = {}): Promise<Response> {
    try {
      const response = await fetch(url, options);
      
      // Check for auth errors in response
      if (response.status === 401 || response.status === 403) {
        await this.handleAuthError({ response });
        throw new Error(`Authentication failed (${response.status})`);
      }
      
      return response;
    } catch (error) {
      // Handle network errors or other fetch errors
      await this.handleAuthError(error);
      throw error;
    }
  }

  /**
   * Check if the current session is valid
   * @returns Promise<boolean>
   */
  public async isSessionValid(): Promise<boolean> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error checking session:', error);
        return false;
      }
      
      return !!session;
    } catch (error) {
      console.error('Error validating session:', error);
      return false;
    }
  }
}

// Export singleton instance
export const authErrorHandler = AuthErrorHandler.getInstance();

// Export utility functions for easy use
export const handleAuthError = (error: any, redirectToLogin: boolean = true) => 
  authErrorHandler.handleAuthError(error, redirectToLogin);

export const fetchWithAuthHandling = (url: string, options: RequestInit = {}) => 
  authErrorHandler.fetchWithAuthHandling(url, options);

export const isSessionValid = () => authErrorHandler.isSessionValid();
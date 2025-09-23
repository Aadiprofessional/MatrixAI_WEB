import { useEffect, useRef } from 'react';
import { globalChartPersistence } from '../services/globalChartPersistence';

/**
 * Hook to handle chart recovery after context changes and re-renders
 * This ensures charts persist through authentication state changes,
 * Supabase real-time subscriptions, and other context updates
 */
export const useChartRecovery = () => {
  const recoveryAttempted = useRef(false);
  const mountTime = useRef(Date.now());

  useEffect(() => {
    // Only attempt recovery once per mount
    if (recoveryAttempted.current) return;
    recoveryAttempted.current = true;

    console.log('🔄 Chart recovery hook mounted, checking for charts to recover...');

    // Small delay to ensure DOM is ready
    const recoveryTimer = setTimeout(() => {
      try {
        // Attempt to recover any charts that might have been lost
        globalChartPersistence.recoverCharts();
        
        // Perform a health check on all charts
        globalChartPersistence.performRecoveryCheck();
        
        console.log('✅ Chart recovery check completed');
      } catch (error) {
        console.error('❌ Error during chart recovery:', error);
      }
    }, 100);

    // Cleanup function
    return () => {
      clearTimeout(recoveryTimer);
    };
  }, []);

  // Monitor for page visibility changes (user switching tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible again, check chart health
        setTimeout(() => {
          globalChartPersistence.performRecoveryCheck();
        }, 200);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Monitor for window focus (similar to visibility but different trigger)
  useEffect(() => {
    const handleFocus = () => {
      // Window regained focus, ensure charts are healthy
      setTimeout(() => {
        globalChartPersistence.performRecoveryCheck();
      }, 100);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Return utility functions for manual recovery
  return {
    forceRecovery: () => {
      console.log('🔧 Manual chart recovery triggered');
      globalChartPersistence.recoverCharts();
      globalChartPersistence.performRecoveryCheck();
    },
    
    forceRecoveryAll: () => {
      console.log('🔧 Manual full chart recovery triggered');
      globalChartPersistence.forceRecoveryAll();
    },
    
    getChartStatus: () => {
      return globalChartPersistence.getRegisteredCharts();
    }
  };
};

/**
 * Hook specifically for chat pages to handle chart recovery
 * This should be used in ChatPage component to ensure charts
 * survive context provider re-renders
 */
export const useChatChartRecovery = () => {
  const recovery = useChartRecovery();
  
  useEffect(() => {
    console.log('💬 Chat chart recovery initialized');
    
    // Log system status
    const status = globalChartPersistence.getStatus();
    console.log('📊 Chart persistence system status:', status);
    
    // Optimized recovery for chat context
    const optimizedRecovery = setInterval(() => {
      globalChartPersistence.performRecoveryCheck();
      
      // Log status every 30 seconds for debugging
      const currentStatus = globalChartPersistence.getStatus();
      if (currentStatus.totalCharts > 0) {
        console.log('📊 Chart status update:', currentStatus);
      }
    }, 10000); // Check every 10 seconds (optimized from 5 seconds)
    
    return () => clearInterval(optimizedRecovery);
  }, []);
  
  return recovery;
};
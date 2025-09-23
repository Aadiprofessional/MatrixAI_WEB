/**
 * Global Chart Persistence System
 * 
 * This system operates completely outside React's render cycle and context system.
 * It provides chart persistence that survives:
 * - Authentication state changes
 * - User context updates
 * - Theme changes
 * - Language changes
 * - Alert state changes
 * - Supabase real-time subscription updates
 * - Any other React context or state changes
 */

interface ChartData {
  type: string;
  data: any;
  options: any;
  canvasId: string;
  messageId: string;
  timestamp: number;
  isActive: boolean;
}

interface ChartInstance {
  chart: any; // Chart.js instance
  data: ChartData;
  canvas: HTMLCanvasElement;
  lastSeen: number;
}

class GlobalChartPersistence {
  private static instance: GlobalChartPersistence;
  private charts: Map<string, ChartInstance> = new Map();
  private chartData: Map<string, ChartData> = new Map();
  private persistenceTimer: NodeJS.Timeout | null = null;
  private recoveryTimer: NodeJS.Timeout | null = null;
  private isRecovering = false;
  private isInitialized = false;
  private domObserver: MutationObserver | null = null;
  private observedNodes = new Set<Element>();
  private lastRecoveryTime = 0;
  private recoveryDebounceTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.initialize();
    this.initializeDOMObserver();
  }

  public static getInstance(): GlobalChartPersistence {
    if (!GlobalChartPersistence.instance) {
      GlobalChartPersistence.instance = new GlobalChartPersistence();
    }
    return GlobalChartPersistence.instance;
  }

  private initialize() {
    if (this.isInitialized) return;
    
    console.log('🔧 GlobalChartPersistence: Initializing...');
    
    // Start persistence monitoring
    this.startPersistenceMonitoring();
    
    // Start recovery system
    this.startRecoverySystem();
    
    // Listen for page visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    // Listen for beforeunload to save state
    window.addEventListener('beforeunload', this.saveState.bind(this));
    
    // Load any previously saved state
    this.loadState();
    
    this.isInitialized = true;
    console.log('✅ GlobalChartPersistence: Initialized successfully');
  }

  /**
   * Register a chart with the persistence system
   */
  public registerChart(chartInstance: any, canvasId: string, messageId: string, chartData: ChartData): void {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
      console.warn(`⚠️ GlobalChartPersistence: Canvas ${canvasId} not found`);
      return;
    }

    const instance: ChartInstance = {
      chart: chartInstance,
      data: chartData,
      canvas,
      lastSeen: Date.now()
    };

    this.charts.set(canvasId, instance);
    this.chartData.set(canvasId, chartData);
    
    // Mark canvas as globally protected
    canvas.setAttribute('data-global-chart-protected', 'true');
    canvas.setAttribute('data-chart-id', canvasId);
    canvas.setAttribute('data-message-id', messageId);
    
    console.log(`📊 GlobalChartPersistence: Registered chart ${canvasId} for message ${messageId}`);
  }

  /**
   * Get chart data for restoration
   */
  public getChartData(canvasId: string): ChartData | null {
    return this.chartData.get(canvasId) || null;
  }

  /**
   * Check if a chart is registered and active
   */
  public isChartRegistered(canvasId: string): boolean {
    return this.charts.has(canvasId) && this.chartData.has(canvasId);
  }

  /**
   * Update chart's last seen timestamp
   */
  public updateChartActivity(canvasId: string): void {
    const instance = this.charts.get(canvasId);
    if (instance) {
      instance.lastSeen = Date.now();
    }
  }

  /**
   * Remove a chart from the persistence system
   */
  public unregisterChart(canvasId: string): void {
    this.charts.delete(canvasId);
    this.chartData.delete(canvasId);
    console.log(`🗑️ GlobalChartPersistence: Unregistered chart ${canvasId}`);
  }

  /**
   * Get all registered chart IDs
   */
  public getAllChartIds(): string[] {
    return Array.from(this.chartData.keys());
  }

  /**
   * Check if a canvas exists in the DOM and is healthy
   */
  private isCanvasHealthy(canvasId: string): boolean {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) return false;
    
    // Check if canvas is still in the DOM
    if (!document.body.contains(canvas)) return false;
    
    // Check if canvas has the protection attributes
    if (!canvas.getAttribute('data-global-chart-protected')) return false;
    
    return true;
  }

  /**
   * Attempt to recover a missing or broken chart
   */
  private async recoverChart(canvasId: string): Promise<boolean> {
    const chartData = this.chartData.get(canvasId);
    if (!chartData) return false;

    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
      console.log(`🔄 GlobalChartPersistence: Canvas ${canvasId} not found, waiting for DOM...`);
      return false;
    }

    try {
      // Use global Chart.js instance (loaded by the application)
      const Chart = (window as any).Chart;
      if (!Chart) {
        console.warn(`🚨 Chart.js not available globally for ${canvasId}`);
        return false;
      }

      // Destroy any existing chart on this canvas
      const existingChart = Chart.getChart(canvas);
      if (existingChart) {
        existingChart.destroy();
      }

      // Create new chart
      const newChart = new Chart(canvas, {
        type: chartData.type as any,
        data: chartData.data,
        options: {
          ...chartData.options,
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            ...chartData.options?.plugins,
            legend: {
              display: true,
              position: 'top' as const,
            },
          },
        },
      });

      // Re-register the recovered chart
      this.registerChart(newChart, canvasId, chartData.messageId, chartData);
      
      console.log(`✅ GlobalChartPersistence: Successfully recovered chart ${canvasId}`);
      return true;
    } catch (error) {
      console.error(`❌ GlobalChartPersistence: Failed to recover chart ${canvasId}:`, error);
      return false;
    }
  }

  /**
   * Start the persistence monitoring system
   */
  private startPersistenceMonitoring(): void {
    if (this.persistenceTimer) {
      clearInterval(this.persistenceTimer);
    }

    this.persistenceTimer = setInterval(() => {
      this.monitorCharts();
    }, 2000); // Check every 2 seconds
  }

  /**
   * Start the recovery system
   */
  private startRecoverySystem(): void {
    if (this.recoveryTimer) {
      clearInterval(this.recoveryTimer);
    }

    this.recoveryTimer = setInterval(() => {
      this.performRecoveryCheckInternal();
    }, 3000); // Recovery check every 3 seconds
  }

  /**
   * Monitor all registered charts for health
   */
  private monitorCharts(): void {
    const now = Date.now();
    const staleThreshold = 30000; // 30 seconds

    for (const [canvasId, instance] of Array.from(this.charts.entries())) {
      // Check if chart is stale
      if (now - instance.lastSeen > staleThreshold) {
        console.log(`⚠️ GlobalChartPersistence: Chart ${canvasId} appears stale`);
        continue;
      }

      // Update activity if canvas is healthy
      if (this.isCanvasHealthy(canvasId)) {
        this.updateChartActivity(canvasId);
      }
    }
  }

  /**
   * Perform recovery check for missing charts
   */
  private async performRecoveryCheckInternal(): Promise<void> {
    for (const canvasId of Array.from(this.chartData.keys())) {
      if (!this.isCanvasHealthy(canvasId)) {
        console.log(`🔄 GlobalChartPersistence: Attempting to recover chart ${canvasId}`);
        await this.recoverChart(canvasId);
      }
    }
  }

  /**
   * Handle page visibility changes
   */
  private handleVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
      console.log('👁️ GlobalChartPersistence: Page became visible, checking charts...');
      setTimeout(() => {
        this.performRecoveryCheckInternal();
      }, 1000);
    }
  }

  /**
   * Save current state to localStorage
   */
  private saveState(): void {
    try {
      const state = {
        chartData: Array.from(this.chartData.entries()),
        timestamp: Date.now()
      };
      localStorage.setItem('matrixai_global_chart_state', JSON.stringify(state));
      console.log('💾 GlobalChartPersistence: State saved to localStorage');
    } catch (error) {
      console.error('❌ GlobalChartPersistence: Failed to save state:', error);
    }
  }

  /**
   * Load state from localStorage
   */
  private loadState(): void {
    try {
      const savedState = localStorage.getItem('matrixai_global_chart_state');
      if (savedState) {
        const state = JSON.parse(savedState);
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        // Only load if state is not too old
        if (now - state.timestamp < maxAge) {
          this.chartData = new Map(state.chartData);
          console.log(`📥 GlobalChartPersistence: Loaded ${this.chartData.size} charts from localStorage`);
        } else {
          console.log('🗑️ GlobalChartPersistence: Saved state too old, ignoring');
        }
      }
    } catch (error) {
      console.error('❌ GlobalChartPersistence: Failed to load state:', error);
    }
  }

  /**
   * Force recovery of all charts
   */
  public async forceRecoveryAll(): Promise<void> {
    console.log('🔄 GlobalChartPersistence: Force recovering all charts...');
    for (const canvasId of Array.from(this.chartData.keys())) {
      await this.recoverChart(canvasId);
    }
  }

  /**
   * Public method to trigger chart recovery
   */
  public recoverCharts(): void {
    console.log('🔄 Starting chart recovery process...');
    
    for (const [chartId, data] of Array.from(this.chartData.entries())) {
      if (data.isActive) {
        this.recoverChart(chartId);
      }
    }
  }

  /**
   * Public method to perform recovery check
   */
  public performRecoveryCheck(): void {
    this.performRecoveryCheckInternal();
  }

  /**
   * Public method to get registered charts info
   */
  public getRegisteredCharts(): Array<{chartId: string, messageId: string, isActive: boolean, timestamp: number}> {
    return Array.from(this.chartData.entries()).map(([chartId, data]) => ({
      chartId,
      messageId: data.messageId,
      isActive: data.isActive,
      timestamp: data.timestamp
    }));
  }

  /**
   * Initialize DOM mutation observer to track chart canvas elements
   */
  private initializeDOMObserver(): void {
    if (typeof window === 'undefined' || !window.MutationObserver) {
      console.warn('MutationObserver not available, DOM tracking disabled');
      return;
    }

    this.domObserver = new MutationObserver((mutations) => {
      let chartsAffected = false;

      mutations.forEach((mutation) => {
        // Check for removed nodes
        mutation.removedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            
            // Check if the removed node is a chart canvas or contains chart canvases
            const canvases = element.tagName === 'CANVAS' 
              ? [element] 
              : Array.from(element.querySelectorAll('canvas'));
            
            canvases.forEach((canvas) => {
              const canvasId = canvas.id;
              if (canvasId && this.chartData.has(canvasId)) {
                console.log(`🔍 DOM Observer: Chart canvas ${canvasId} was removed from DOM`);
                chartsAffected = true;
                
                // Mark chart as needing recovery
                const chartData = this.chartData.get(canvasId);
                if (chartData) {
                  chartData.isActive = false;
                }
              }
            });
          }
        });

        // Check for added nodes to observe new chart containers
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            this.observeChartContainers(element);
          }
        });
      });

      // Trigger recovery if charts were affected (with debouncing)
      if (chartsAffected) {
        console.log('🚨 DOM Observer: Charts affected by DOM changes, scheduling recovery...');
        
        // Clear any existing debounce timer
        if (this.recoveryDebounceTimer) {
          clearTimeout(this.recoveryDebounceTimer);
        }
        
        // Only schedule recovery if enough time has passed since last recovery
        const now = Date.now();
        const timeSinceLastRecovery = now - this.lastRecoveryTime;
        const minRecoveryInterval = 2000; // Minimum 2 seconds between recoveries
        
        if (timeSinceLastRecovery >= minRecoveryInterval) {
          // Immediate recovery if enough time has passed
          this.recoveryDebounceTimer = setTimeout(() => {
            this.lastRecoveryTime = Date.now();
            this.performRecoveryCheckInternal();
          }, 500); // Small delay to let DOM settle
        } else {
          // Debounced recovery if too frequent
          const delay = minRecoveryInterval - timeSinceLastRecovery + 500;
          console.log(`⏳ DOM Observer: Debouncing recovery for ${delay}ms to prevent excessive cycles`);
          this.recoveryDebounceTimer = setTimeout(() => {
            this.lastRecoveryTime = Date.now();
            this.performRecoveryCheckInternal();
          }, delay);
        }
      }
    });

    // Start observing the document body
    this.domObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false
    });

    // Observe existing chart containers
    this.observeChartContainers(document.body);
    
    console.log('🔍 DOM Observer initialized for chart tracking');
  }

  /**
   * Observe chart containers for changes
   */
  private observeChartContainers(element: Element): void {
    // Find all potential chart containers
    const chartContainers = element.querySelectorAll('[class*="chart"], [id*="chart"], .ai-response-content, .markdown-content');
    
    chartContainers.forEach((container) => {
      if (!this.observedNodes.has(container)) {
        this.observedNodes.add(container);
      }
    });
  }

  /**
   * Clean up DOM observer
   */
  private cleanupDOMObserver(): void {
    if (this.domObserver) {
      this.domObserver.disconnect();
      this.domObserver = null;
    }
    this.observedNodes.clear();
  }

  /**
   * Get system status
   */
  public getStatus(): {
    totalCharts: number;
    activeCharts: number;
    isRecovering: boolean;
    domObserverActive: boolean;
    observedNodes: number;
    chartIds: string[];
  } {
    const activeCharts = Array.from(this.chartData.values()).filter(data => data.isActive).length;
    
    return {
      totalCharts: this.chartData.size,
      activeCharts,
      isRecovering: this.isRecovering,
      domObserverActive: !!this.domObserver,
      observedNodes: this.observedNodes.size,
      chartIds: Array.from(this.chartData.keys())
    };
  }

  /**
   * Test function for debugging - can be called from browser console
   */
  public test(): void {
    console.log('🧪 Testing GlobalChartPersistence system...');
    
    const status = this.getStatus();
    console.log('📊 Current status:', status);
    
    console.log('🔍 DOM Observer active:', !!this.domObserver);
    console.log('📈 Registered charts:', this.getRegisteredCharts());
    
    // Test recovery system
    console.log('🔄 Testing recovery system...');
    this.performRecoveryCheck();
    
    console.log('✅ Test completed. Check console for detailed logs.');
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    if (this.persistenceTimer) {
      clearInterval(this.persistenceTimer);
      this.persistenceTimer = null;
    }
    
    if (this.recoveryTimer) {
      clearInterval(this.recoveryTimer);
      this.recoveryTimer = null;
    }
    
    if (this.recoveryDebounceTimer) {
      clearTimeout(this.recoveryDebounceTimer);
      this.recoveryDebounceTimer = null;
    }
    
    this.cleanupDOMObserver();
    
    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    window.removeEventListener('beforeunload', this.saveState.bind(this));
    
    this.saveState();
    console.log('🧹 GlobalChartPersistence: Cleanup completed');
  }
}

// Export singleton instance
export const globalChartPersistence = GlobalChartPersistence.getInstance();

// Export for debugging
(window as any).globalChartPersistence = globalChartPersistence;
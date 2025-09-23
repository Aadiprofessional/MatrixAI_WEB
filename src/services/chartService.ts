// Chart service for AI-driven chart generation using Chart.js
import { globalChartPersistence } from './globalChartPersistence';

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
    tension?: number;
  }[];
}

// AnyChart Gantt data structure
export interface GanttData {
  data: {
    id: string;
    name: string;
    actualStart?: string | Date;
    actualEnd?: string | Date;
    progressValue?: number;
    parent?: string;
  }[];
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'scatter' | 'bubble' | 'polarArea' | 'radar' | 'gantt';
  data: ChartData | GanttData;
  options?: any;
  library?: 'chartjs' | 'anychart'; // Specify which library to use
}

export class ChartService {
  private static instance: ChartService;
  private chartInstances: Map<string, any> = new Map();
  
  // Supported Chart.js types - strictly enforced
  private readonly supportedChartTypes: Set<string> = new Set([
    'line',      // Line Chart – for continuous data, trends over time
    'bar',       // Bar Chart – vertical or horizontal bars for categorical data
    'radar',     // Radar Chart – for comparing values on multiple axes
    'doughnut',  // Doughnut Chart – like a pie chart, but with a hole in the middle
    'pie',       // Pie Chart – circular chart divided into slices
    'polarArea', // Polar Area Chart – similar to pie but segments have different radii
    'bubble',    // Bubble Chart – scatter plot with variable-sized points
    'scatter',   // Scatter Chart – individual data points on x/y coordinates
    'gantt'      // Gantt Chart – project timeline visualization (uses AnyChart)
    // Note: Area, Stacked, and Mixed charts are variations handled through options
  ]);

  static getInstance(): ChartService {
    if (!ChartService.instance) {
      ChartService.instance = new ChartService();
    }
    return ChartService.instance;
  }

  // Generate a unique chart ID
  generateChartId(): string {
    return `chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Validate if chart type is supported
  isChartTypeSupported(type: string): boolean {
    return this.supportedChartTypes.has(type.toLowerCase());
  }

  // Validate chart configuration
  validateChartConfig(config: any): { isValid: boolean; error?: string } {
    if (!config || typeof config !== 'object') {
      return { isValid: false, error: 'Invalid chart configuration' };
    }

    if (!config.type) {
      return { isValid: false, error: 'Chart type is required' };
    }

    if (!this.isChartTypeSupported(config.type)) {
      return { 
        isValid: false, 
        error: `Unsupported chart type: ${config.type}. Supported types: ${Array.from(this.supportedChartTypes).join(', ')}` 
      };
    }

    // Validate data structure based on chart type
    if (config.type === 'gantt') {
      // Gantt charts use AnyChart format
      if (!config.data || !Array.isArray(config.data.data)) {
        return { isValid: false, error: 'Gantt chart data must have a "data" array with task objects' };
      }
      
      // Validate each task has required fields
      for (const task of config.data.data) {
        if (!task.id || !task.name) {
          return { isValid: false, error: 'Each Gantt task must have "id" and "name" properties' };
        }
      }
    } else {
      // Chart.js format validation
      if (!config.data || !config.data.labels || !config.data.datasets) {
        return { isValid: false, error: 'Chart data is incomplete (missing labels or datasets)' };
      }
    }

    return { isValid: true };
  }

  // Create a chart configuration with dark mode support
  createChartConfig(
    type: ChartConfig['type'],
    data: ChartData,
    title?: string,
    isDarkMode: boolean = false
  ): ChartConfig {
    const textColor = isDarkMode ? '#ffffff' : '#000000';
    const gridColor = isDarkMode ? '#444444' : '#e0e0e0';
    const backgroundColor = isDarkMode ? '#1a1a1a' : '#ffffff';

    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: !!title,
          text: title,
          color: textColor,
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        legend: {
          labels: {
            color: textColor
          }
        }
      },
      scales: this.getScalesConfig(type, textColor, gridColor)
    };

    return {
      type,
      data: this.enhanceDataWithColors(data, type, isDarkMode),
      options: baseOptions
    };
  }

  // Enhance data with appropriate colors based on chart type and theme
  private enhanceDataWithColors(data: ChartData, type: string, isDarkMode: boolean): ChartData {
    const colorPalette = isDarkMode 
      ? ['#4FC3F7', '#81C784', '#FFB74D', '#F06292', '#BA68C8', '#64B5F6', '#4DB6AC', '#FFD54F']
      : ['#2196F3', '#4CAF50', '#FF9800', '#E91E63', '#9C27B0', '#03A9F4', '#009688', '#FFC107'];

    const enhancedDatasets = data.datasets.map((dataset, index) => {
      const color = colorPalette[index % colorPalette.length];
      
      return {
        ...dataset,
        backgroundColor: dataset.backgroundColor || (
          type === 'line' ? `${color}20` : 
          type === 'pie' || type === 'doughnut' ? colorPalette.slice(0, data.labels.length) :
          color
        ),
        borderColor: dataset.borderColor || color,
        borderWidth: dataset.borderWidth || (type === 'line' ? 2 : 1),
        fill: dataset.fill !== undefined ? dataset.fill : (type === 'line' ? false : undefined),
        tension: dataset.tension || (type === 'line' ? 0.4 : undefined)
      };
    });

    return {
      ...data,
      datasets: enhancedDatasets
    };
  }

  // Get scales configuration based on chart type
  private getScalesConfig(type: string, textColor: string, gridColor: string) {
    if (['pie', 'doughnut', 'polarArea', 'radar'].includes(type)) {
      return {};
    }

    return {
      x: {
        title: {
          display: true,
          text: 'X Axis',
          color: textColor
        },
        grid: {
          color: gridColor
        },
        ticks: {
          color: textColor
        }
      },
      y: {
        title: {
          display: true,
          text: 'Y Axis',
          color: textColor
        },
        grid: {
          color: gridColor
        },
        ticks: {
          color: textColor
        }
      }
    };
  }

  // Ultra-defensive chart rendering to prevent interference
  renderChart(chartId: string, config: ChartConfig, messageId?: string): Promise<boolean> {
    return new Promise((resolve) => {
      // Determine which library to use
      const isGanttChart = config.type === 'gantt';
      const useAnyChart = isGanttChart || config.library === 'anychart';

      // GLOBAL PERSISTENCE: Check if chart is already registered in global system
      if (globalChartPersistence.isChartRegistered(chartId)) {
        const element = document.getElementById(chartId) as HTMLElement;
        if (element && element.getAttribute('data-global-chart-protected')) {
          console.log(`🛡️ Chart ${chartId} is globally protected, skipping render`);
          globalChartPersistence.updateChartActivity(chartId);
          resolve(true);
          return;
        }
      }

      // ULTRA-DEFENSIVE: Check if chart already exists and is still valid
      if (this.chartInstances.has(chartId)) {
        const existingChart = this.chartInstances.get(chartId);
        const element = document.getElementById(chartId) as HTMLElement;
        
        // If element still exists and chart is attached, absolutely don't re-render
        if (element && existingChart && !existingChart.destroyed) {
          console.log(`Chart ${chartId} already exists and is perfectly valid, absolutely skipping render`);
          resolve(true);
          return;
        }
      }

      setTimeout(() => {
        const element = document.getElementById(chartId) as HTMLElement;
        
        if (useAnyChart) {
          // AnyChart rendering for Gantt charts
          if (element && (window as any).anychart) {
            try {
              // ULTRA-DEFENSIVE: Double-check if chart was created by another process while we waited
              if (this.chartInstances.has(chartId)) {
                const existingChart = this.chartInstances.get(chartId);
                if (existingChart && !existingChart.destroyed) {
                  console.log(`AnyChart ${chartId} was created by another process while waiting, skipping render`);
                  resolve(true);
                  return;
                }
                // Destroy existing chart if needed
                if (existingChart) {
                  try {
                    existingChart.dispose();
                  } catch (e) {
                    console.warn(`Error disposing old AnyChart ${chartId}:`, e);
                  }
                  this.chartInstances.delete(chartId);
                }
              }

              // FINAL CHECK: Only create new chart if absolutely necessary
              if (!this.chartInstances.has(chartId)) {
                const chart = (window as any).anychart.gantt();
                
                // Type guard to ensure we have GanttData
                if ('data' in config.data) {
                  chart.data(config.data.data);
                } else {
                  console.error('Invalid data structure for Gantt chart');
                  return false;
                }
                
                // Apply dark mode styling if needed
                const isDarkMode = document.documentElement.classList.contains('dark');
                if (isDarkMode) {
                  chart.background().fill('#1f2937');
                  chart.timeline().header().background().fill('#374151');
                  chart.dataGrid().header().background().fill('#374151');
                }
                
                chart.container(chartId);
                chart.draw();
                
                this.chartInstances.set(chartId, chart);
                console.log(`AnyChart Gantt ${chartId} created successfully`);
                
                // GLOBAL PERSISTENCE: Register chart with global system
                const chartData = {
                  type: config.type,
                  data: config.data,
                  options: config.options,
                  canvasId: chartId,
                  messageId: messageId || chartId,
                  timestamp: Date.now(),
                  isActive: true
                };
                globalChartPersistence.registerChart(chart, chartId, messageId || chartId, chartData);
                
                // Mark element as protected
                (element as any).__chart_protected__ = true;
                (element as any).__chart_id__ = chartId;
              }
              
              resolve(true);
            } catch (error) {
              console.error('Error rendering AnyChart:', error);
              resolve(false);
            }
          } else {
            console.error('Element or AnyChart library not found for chart:', chartId);
            resolve(false);
          }
        } else {
          // Chart.js rendering for standard charts
          const canvas = element as HTMLCanvasElement;
          if (canvas && (window as any).Chart) {
            try {
              // ULTRA-DEFENSIVE: Double-check if chart was created by another process while we waited
              if (this.chartInstances.has(chartId)) {
                const existingChart = this.chartInstances.get(chartId);
                if (existingChart && existingChart.canvas === canvas && !existingChart.destroyed) {
                  console.log(`Chart ${chartId} was created by another process while waiting, skipping render`);
                  resolve(true);
                  return;
                }
                // Only destroy if canvas changed or chart is destroyed
                if (existingChart && (existingChart.canvas !== canvas || existingChart.destroyed)) {
                  try {
                    existingChart.destroy();
                  } catch (e) {
                    console.warn(`Error destroying old chart ${chartId}:`, e);
                  }
                  this.chartInstances.delete(chartId);
                }
              }

              // Additional check: if canvas already has a chart from another source, warn but don't interfere
              if ((canvas as any).__chartjs_chart__) {
                console.warn(`Canvas ${chartId} already has a Chart.js instance from another source - this might cause conflicts`);
                // Don't return here, let Chart.js handle it
              }

              // FINAL CHECK: Only create new chart if absolutely necessary
              if (!this.chartInstances.has(chartId)) {
                const chart = new (window as any).Chart(canvas, config);
                this.chartInstances.set(chartId, chart);
                console.log(`Chart ${chartId} created successfully with ultra-defensive protection`);
                
                // GLOBAL PERSISTENCE: Register chart with global system
                const chartData = {
                  type: config.type,
                  data: config.data,
                  options: config.options,
                  canvasId: chartId,
                  messageId: messageId || chartId,
                  timestamp: Date.now(),
                  isActive: true
                };
                globalChartPersistence.registerChart(chart, chartId, messageId || chartId, chartData);
                
                // Add extra protection against accidental destruction
                const originalDestroy = chart.destroy.bind(chart);
                chart.destroy = () => {
                  console.warn(`Attempting to destroy chart ${chartId} - this should be rare!`);
                  globalChartPersistence.unregisterChart(chartId);
                  originalDestroy();
                  this.chartInstances.delete(chartId);
                };
                
                // Mark canvas as protected (legacy support)
                (canvas as any).__chart_protected__ = true;
                (canvas as any).__chart_id__ = chartId;
              }
              
              resolve(true);
            } catch (error) {
              console.error('Error rendering chart:', error);
              resolve(false);
            }
          } else {
            console.error('Canvas element or Chart.js not found for chart:', chartId);
            resolve(false);
          }
        }
      }, 100);
    });
  }

  // Check if a chart already exists
  chartExists(chartId: string): boolean {
    return this.chartInstances.has(chartId);
  }

  // Get a chart instance
  getChart(chartId: string): any | null {
    return this.chartInstances.get(chartId) || null;
  }

  // Check if a chart exists and is still valid in the DOM
  chartExistsAndValid(chartId: string): boolean {
    if (!this.chartInstances.has(chartId)) {
      return false;
    }
    
    const chart = this.chartInstances.get(chartId);
    const canvas = document.getElementById(chartId) as HTMLCanvasElement;
    
    // Check if canvas exists, chart is still attached to it, and canvas is protected
    return canvas && chart && chart.canvas === canvas && !chart.destroyed && (canvas as any).__chart_protected__;
  }

  // Destroy a specific chart
  destroyChart(chartId: string): void {
    if (this.chartInstances.has(chartId)) {
      globalChartPersistence.unregisterChart(chartId);
      const chart = this.chartInstances.get(chartId);
      
      // Handle both Chart.js and AnyChart destruction
      if (chart) {
        if (chart.destroy) {
          chart.destroy(); // Chart.js
        } else if (chart.dispose) {
          chart.dispose(); // AnyChart
        } else if (chart.remove) {
          chart.remove(); // AnyChart alternative
        }
      }
      
      this.chartInstances.delete(chartId);
    }
  }

  // Destroy all charts
  destroyAllCharts(): void {
    this.chartInstances.forEach((chart, chartId) => {
      globalChartPersistence.unregisterChart(chartId);
      
      // Handle both Chart.js and AnyChart destruction
      if (chart) {
        if (chart.destroy) {
          chart.destroy(); // Chart.js
        } else if (chart.dispose) {
          chart.dispose(); // AnyChart
        } else if (chart.remove) {
          chart.remove(); // AnyChart alternative
        }
      }
    });
    this.chartInstances.clear();
  }

  // Parse mathematical expressions for line charts
  generateMathChart(
    equation: string,
    xMin: number = -10,
    xMax: number = 10,
    points: number = 100,
    isDarkMode: boolean = false
  ): ChartConfig | null {
    try {
      const labels: string[] = [];
      const data: number[] = [];
      const step = (xMax - xMin) / points;

      for (let i = 0; i <= points; i++) {
        const x = xMin + (i * step);
        labels.push(x.toFixed(2));
        
        try {
          const y = (window as any).math.evaluate(equation, { x });
          if (typeof y === 'number' && isFinite(y)) {
            data.push(y);
          } else {
            data.push(0); // Handle invalid values
          }
        } catch {
          data.push(0); // Handle evaluation errors
        }
      }

      const chartData: ChartData = {
        labels,
        datasets: [{
          label: `y = ${equation}`,
          data,
          fill: false,
          tension: 0.4
        }]
      };

      return this.createChartConfig('line', chartData, `Graph of y = ${equation}`, isDarkMode);
    } catch (error) {
      console.error('Error generating math chart:', error);
      return null;
    }
  }

  // Generate data points from a mathematical function
  generateDataFromFunction(functionExpression: string, xMin: number = -10, xMax: number = 10, steps: number = 100): { x: number; y: number }[] {
    const data: { x: number; y: number }[] = [];
    const stepSize = (xMax - xMin) / steps;
    
    for (let i = 0; i <= steps; i++) {
      const x = xMin + (i * stepSize);
      
      try {
        const y = (window as any).math.evaluate(functionExpression, { x });
        
        // Only add valid data points
        if (typeof y === 'number' && isFinite(y)) {
          data.push({ x, y });
        }
      } catch (error) {
        // Skip invalid points
        continue;
      }
    }
    
    return data;
  }
}

export const chartService = ChartService.getInstance();
// Chart service for AI-driven chart generation using Chart.js
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

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'scatter' | 'bubble' | 'polarArea' | 'radar';
  data: ChartData;
  options?: any;
}

export class ChartService {
  private static instance: ChartService;
  private chartInstances: Map<string, any> = new Map();

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

  // Render chart in DOM
  renderChart(chartId: string, config: ChartConfig): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const canvas = document.getElementById(chartId) as HTMLCanvasElement;
        if (canvas && (window as any).Chart) {
          try {
            // Destroy existing chart if it exists
            if (this.chartInstances.has(chartId)) {
              this.chartInstances.get(chartId).destroy();
            }

            // Create new chart
            const chart = new (window as any).Chart(canvas, config);
            this.chartInstances.set(chartId, chart);
            resolve(true);
          } catch (error) {
            console.error('Error rendering chart:', error);
            resolve(false);
          }
        } else {
          console.error('Canvas element or Chart.js not found');
          resolve(false);
        }
      }, 100);
    });
  }

  // Check if a chart already exists
  chartExists(chartId: string): boolean {
    return this.chartInstances.has(chartId);
  }

  // Destroy a specific chart
  destroyChart(chartId: string): void {
    if (this.chartInstances.has(chartId)) {
      this.chartInstances.get(chartId).destroy();
      this.chartInstances.delete(chartId);
    }
  }

  // Destroy all charts
  destroyAllCharts(): void {
    this.chartInstances.forEach(chart => chart.destroy());
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
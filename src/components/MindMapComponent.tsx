import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import axios from '../utils/axiosInterceptor';
import { XMLParser } from 'fast-xml-parser';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { FiLoader, FiDownload, FiSave, FiRefreshCw } from 'react-icons/fi';
import { userService } from '../services/userService';
import coinIcon from '../assets/coin.png';

interface MindMapNode {
  name: string;
  children?: MindMapNode[];
}

interface MindMapComponentProps {
  transcription: string;
  uid?: string;
  audioid?: string;
  xmlData?: string | null;
  onXmlDataGenerated?: (xmlData: string) => void;
}

const MindMapComponent: React.FC<MindMapComponentProps> = ({ 
  transcription, 
  uid, 
  audioid, 
  xmlData,
  onXmlDataGenerated 
}) => {
  const { theme, getThemeColors } = useTheme();
  const { t } = useTranslation();
  const colors = getThemeColors();
  
  const [graphData, setGraphData] = useState<MindMapNode[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentXmlData, setCurrentXmlData] = useState<string | null>(xmlData || null);
  const webViewRef = useRef<HTMLIFrameElement>(null);

  // No longer using OpenAI client - using XMLHttpRequest instead

  const parseXMLData = (xmlString: string) => {
    const parser = new XMLParser({ 
      ignoreAttributes: false, 
      removeNSPrefix: true, 
      parseTagValue: true 
    });
    
    try {
      const jsonData = parser.parse(xmlString);
      const formattedData = formatGraphData(jsonData);
      if (formattedData) {
        setGraphData(formattedData);
      }
    } catch (err) {
      console.error('Error parsing XML:', err);
    }
  };

  const formatGraphData = (root: any): MindMapNode[] => {
    const formatNode = (node: any, name = 'Root'): MindMapNode | null => {
      const formattedNode: MindMapNode = { name, children: [] };

      if (node['#text'] || node['?xml']) return null;

      if (node.meeting && node.meeting.topic) {
        const topics = Array.isArray(node.meeting.topic) ? node.meeting.topic : [node.meeting.topic];
        topics.forEach((topic: any, index: number) => {
          const topicNode: MindMapNode = { 
            name: topic['@_name'] || `Topic ${index + 1}`, 
            children: [] 
          };
          
          if (topic.description) {
            topicNode.children?.push({ name: topic.description });
          }
          
          if (topic.subtopic) {
            const subtopics = Array.isArray(topic.subtopic) ? topic.subtopic : [topic.subtopic];
            subtopics.forEach((subtopic: any) => {
              const subtopicNode: MindMapNode = { 
                name: subtopic['@_name'], 
                children: [] 
              };
              
              if (subtopic.description) {
                subtopicNode.children?.push({ name: subtopic.description });
              }
              
              if (subtopic.action_items?.item) {
                const items = Array.isArray(subtopic.action_items.item) 
                  ? subtopic.action_items.item 
                  : [subtopic.action_items.item];
                  
                items.forEach((item: string) => {
                  subtopicNode.children?.push({ name: item });
                });
              }
              
              topicNode.children?.push(subtopicNode);
            });
          }
          
          formattedNode.children?.push(topicNode);
        });
        
        return formattedNode;
      }

      Object.entries(node).forEach(([key, value]) => {
        if (typeof value === 'object') {
          const child = formatNode(value as any, key);
          if (child) formattedNode.children?.push(child);
        } else {
          formattedNode.children?.push({ 
            name: key, 
            children: [{ name: String(value) }] 
          });
        }
      });
      
      return formattedNode;
    };

    return root ? [formatNode(root) as MindMapNode] : [];
  };

  const fetchGraphData = async (transcriptionText: string, deductCoins: boolean = false) => {
    if (!transcriptionText) return;
    
    // Deduct coins if requested
    if (deductCoins && uid) {
      try {
        const coinResponse = await userService.subtractCoins(uid, 3, 'mindmap_generation');
        
        if (!coinResponse.success) {
          alert('Failed to deduct coins. Please try again.');
          return;
        }
      } catch (error: any) {
        console.error('Error deducting coins:', error);
        if (error.message && error.message.includes('insufficient')) {
          alert('You don\'t have enough coins. Please purchase more coins to use this feature.');
        } else {
          alert('Failed to deduct coins. Please try again.');
        }
        return;
      }
    }
    
    setLoading(true);
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', true);
      xhr.setRequestHeader('Authorization', `Bearer ${process.env.REACT_APP_ALIYUN_API_KEY}`);
      xhr.setRequestHeader('Content-Type', 'application/json');

      let fullContent = '';
      
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              const content = response.choices[0]?.message?.content;
              if (content) {
                console.log('XML Response from API:', content);
                setCurrentXmlData(content);
                if (onXmlDataGenerated) {
                  onXmlDataGenerated(content);
                }
                sendXmlGraphData(content);
                parseXMLData(content);
              } else {
                console.error('No valid response from API');
              }
            } catch (parseError) {
              console.error('Error parsing response:', parseError);
            }
          } else {
            console.error('API request failed:', xhr.status, xhr.statusText);
          }
          setLoading(false);
        }
      };

      const requestBody = {
        model: "qwen-max",
        messages: [
          {
            role: "user",
            content: `Generate a hierarchical XML structure from this meeting transcript in the same language as the transcript: "${transcriptionText}".
            Create a tree structure with main topics and subtopics.
            Use this format:
            <meeting>
              <topic name="Main Topic 1">
                <subtopic name="Subtopic 1">
                  <description>Detailed description of subtopic</description>
                  <action_items>
                    <item>Action item 1</item>
                    <item>Action item 2</item>
                  </action_items>
                </subtopic>
                <subtopic name="Subtopic 2">
                  <description>Detailed description of subtopic</description>
                </subtopic>
              </topic>
              <topic name="Main Topic 2">
                <description>Overall description of topic</description>
              </topic>
            </meeting>
            Make sure the XML is in the same language as the transcript.`
          }
        ],
        temperature: 0.7,
        max_tokens: 4096
      };

      xhr.send(JSON.stringify(requestBody));
    } catch (error) {
      console.error('Error fetching graph data:', error);
      setLoading(false);
    }
  };

  const sendXmlGraphData = async (xmlDataToSend: string) => {
    if (!xmlDataToSend || !uid || !audioid) {
      console.error('No XML data available to send or missing uid/audioid.');
      return;
    }

    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_API_URL}/api/audio/sendXmlGraph`, {
        uid,
        audioid,
        xmlData: xmlDataToSend,
      });
      console.log('XML Graph Data Sent:', response.data);
    } catch (error) {
      console.error('Error sending XML Graph Data:', error);
    }
  };

  // Helper function to ensure iframe is fully loaded
  const ensureIframeLoaded = (iframe: HTMLIFrameElement): Promise<void> => {
    return new Promise((resolve) => {
      // If iframe is already loaded
      if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
        console.log('Iframe already loaded');
        resolve();
        return;
      }

      console.log('Waiting for iframe to load...');
      // Set up load event handler
      const loadHandler = () => {
        console.log('Iframe load event fired');
        resolve();
      };

      iframe.addEventListener('load', loadHandler);

      // Also set a timeout in case the load event doesn't fire
      setTimeout(() => {
        iframe.removeEventListener('load', loadHandler);
        console.log('Iframe load timeout - proceeding anyway');
        resolve();
      }, 3000);
    });
  };



  // saveMindMap function removed - functionality merged with sendXmlGraphData

  const regenerateMindMap = () => {
    if (transcription) {
      fetchGraphData(transcription, true); // Deduct coins when manually generating
    }
  };

  const generateMindMap = () => {
    if (transcription) {
      fetchGraphData(transcription, true); // Deduct coins when generating
    }
  };

  useEffect(() => {
    if (xmlData) {
      setCurrentXmlData(xmlData);
      parseXMLData(xmlData);
    }
    // Don't automatically generate mind map if xmlData is empty or null
  }, [transcription, xmlData]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <FiLoader className="animate-spin h-10 w-10 text-blue-500 mb-4" />
          <span className="text-gray-600 dark:text-gray-400">{t('mindmap.generating')}</span>
        </div>
      </div>
    );
  }

  if (!graphData) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400 mb-4">{t('mindmap.noData')}</p>
        <div className="relative">
          <button
            onClick={generateMindMap}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center"
          >
            <FiRefreshCw className="mr-2" /> {t('mindmap.generate')} <span className="ml-1 text-xs bg-orange-500/20 px-1.5 py-0.5 rounded-full flex items-center">-3 <img src={coinIcon} alt="coin" className="w-3 h-3 ml-0.5" /></span>
          </button>
        </div>
      </div>
    );
  }

  const chartHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <script src="https://cdn.jsdelivr.net/npm/echarts/dist/echarts.min.js"></script>
      <style>
        body { 
          margin: 0; 
          padding: 0; 
          background: ${theme === 'dark' ? '#1f2937' : '#ffffff'};
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        #chart { 
          width: 100%; 
          height: 100%;
          min-height: 600px;
        }
        .controls {
          position: absolute;
          bottom: 10px;
          right: 10px;
          display: flex;
          gap: 8px;
          z-index: 100;
        }
        .control-btn {
          background: ${theme === 'dark' ? '#374151' : '#f3f4f6'};
          border: 1px solid ${theme === 'dark' ? '#4b5563' : '#d1d5db'};
          color: ${theme === 'dark' ? '#e5e7eb' : '#374151'};
          border-radius: 4px;
          padding: 4px 8px;
          cursor: pointer;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .control-btn:hover {
          background: ${theme === 'dark' ? '#4b5563' : '#e5e7eb'};
        }
      </style>
    </head>
    <body>
      <div id="chart"></div>
      <div class="controls">
        <button class="control-btn" id="zoomIn">+</button>
        <button class="control-btn" id="zoomOut">-</button>
        <button class="control-btn" id="reset">Reset</button>
      </div>
      <script>
        // Function to detect optimal chart size based on complexity
        function detectOptimalChartSize(data) {
          const countNodes = (nodes) => {
            let count = 0;
            if (!nodes) return count;
            count += nodes.length;
            nodes.forEach(node => {
              if (node.children && node.children.length) {
                count += countNodes(node.children);
              }
            });
            return count;
          };
          
          const nodeCount = countNodes(data);
          const depth = (nodes, level = 0) => {
            if (!nodes || !nodes.length) return level;
            let maxDepth = level;
            nodes.forEach(node => {
              if (node.children && node.children.length) {
                const childDepth = depth(node.children, level + 1);
                maxDepth = Math.max(maxDepth, childDepth);
              }
            });
            return maxDepth;
          };
          
          const maxDepth = depth(data);
          
          return {
            repulsion: Math.max(1000, 800 + nodeCount * 10),
            edgeLength: Math.max(300, 200 + (maxDepth * 20)),
            layerSpacing: Math.max(120, 80 + maxDepth * 20),
            nodeSpacing: Math.max(60, 40 + nodeCount)
          };
        }

        const chartDom = document.getElementById('chart');
        const myChart = echarts.init(chartDom);
        const chartColors = ['#5470C6', '#91CC75', '#EE6666', '#FAC858', '#73C0DE', '#3BA272', '#FC8452', '#9A60B4', '#EA7CCC'];
        const themeBackground = '${theme === 'dark' ? '#1f2937' : '#ffffff'}';
        const themeText = '${theme === 'dark' ? '#e5e7eb' : '#111827'}';

        function assignColors(node, index = 0) {
          node.lineStyle = { color: chartColors[index % chartColors.length] };
          if (node.children) {
            node.children.forEach((child, idx) => assignColors(child, idx));
          }
          return node;
        }

        const coloredGraphData = ${JSON.stringify(graphData)}.map((node, idx) => assignColors(node, idx));
        const { repulsion, edgeLength, layerSpacing, nodeSpacing } = detectOptimalChartSize(coloredGraphData);

        // Function to wrap text into multiple lines with truncation
        function wrapText(text, nodeType) {
          // Truncate text if it exceeds 150 characters
          let displayText = text;
          if (text.length > 150) {
            displayText = text.substring(0, 150) + '...';
          }
          
          let maxLineLength = 16; // Reduced for topic and subtopic nodes
          if (nodeType === 'description') {
            maxLineLength = 70; // Reduced for description nodes
          }

          const words = displayText.split(' ');
          const lines = [];
          let currentLine = '';

          words.forEach(word => {
            if ((currentLine + word).length > maxLineLength) {
              lines.push(currentLine.trim());
              currentLine = word + ' ';
            } else {
              currentLine += word + ' ';
            }
          });

          if (currentLine.trim()) {
            lines.push(currentLine.trim());
          }

          return lines.join('\\n');
        }

        const option = {
          backgroundColor: themeBackground,
          tooltip: { 
            trigger: 'item', 
            triggerOn: 'mousemove',
            backgroundColor: '${theme === 'dark' ? '#374151' : '#ffffff'}',
            borderColor: '${theme === 'dark' ? '#6b7280' : '#e5e7eb'}',
            textStyle: {
              color: '${theme === 'dark' ? '#e5e7eb' : '#111827'}'
            },
            formatter: function(params) {
              const fullText = params.data.name;
              if (fullText.length > 150) {
                return '<div style="max-width: 300px; word-wrap: break-word; white-space: normal;">' + fullText + '</div>';
              }
              return fullText;
            }
          },
          series: [{
            type: 'tree',
            data: coloredGraphData,
            top: '5%',
            left: '10%',
            bottom: '5%',
            right: '25%',
            symbolSize: 8,
            orient: 'LR',
            roam: true,
            initialTreeDepth: 3,
            label: {
              position: 'left',
              verticalAlign: 'middle',
              align: 'right',
              fontSize: 9,
              color: themeText,
              formatter: (params) => {
                const nodeType = params.data.nodeType || 'topic';
                return wrapText(params.name, nodeType);
              }
            },
            leaves: {
              label: {
                position: 'right',
                verticalAlign: 'middle',
                align: 'left',
                color: themeText,
                distance: 15,
                formatter: (params) => {
                  const nodeType = params.data.nodeType || 'description';
                  return wrapText(params.name, nodeType);
                }
              }
            },
            emphasis: { 
              focus: 'descendant',
              itemStyle: {
                shadowBlur: 10,
                shadowColor: 'rgba(0, 0, 0, 0.3)'
              }
            },
            expandAndCollapse: true,
            animationDuration: 550,
            animationEasing: 'cubicOut',
            force: {
              repulsion: repulsion,
              gravity: 0.1,
              edgeLength: edgeLength,
              layoutAnimation: true,
            },
            layerSpacing: layerSpacing,
            nodeSpacing: nodeSpacing,
            zoom: 0.8,
            center: ['40%', '50%'],
            lineStyle: {
              width: 2,
              curveness: 0.5
            },
            itemStyle: {
              borderWidth: 2,
              shadowColor: 'rgba(0, 0, 0, 0.3)',
              shadowBlur: 5
            }
          }]
        };
        
        myChart.setOption(option);
        
        // Create the chart and register a resize listener
        window.addEventListener('resize', function() {
          myChart.resize();
        });
        
        // Function to update font size based on zoom level
        function updateFontSize(zoomLevel) {
          const baseFontSize = 9; // Half of original 18px
          const scaledFontSize = Math.min(18, baseFontSize * zoomLevel * 2); // Scale up to original 18px when zoom is 1
          
          myChart.setOption({
            series: [{
              label: {
                fontSize: scaledFontSize
              },
              leaves: {
                label: {
                  fontSize: scaledFontSize
                }
              }
            }]
          });
        }
        
        // Zoom controls
        document.getElementById('zoomIn').addEventListener('click', function() {
          const currentZoom = myChart.getOption().series[0].zoom || 1;
          const newZoom = Math.min(2, currentZoom * 1.3);
          myChart.setOption({
            series: [{
              zoom: newZoom
            }]
          });
          updateFontSize(newZoom);
        });
        
        document.getElementById('zoomOut').addEventListener('click', function() {
          const currentZoom = myChart.getOption().series[0].zoom || 1;
          const newZoom = Math.max(0.5, currentZoom / 1.3);
          myChart.setOption({
            series: [{
              zoom: newZoom
            }]
          });
          updateFontSize(newZoom);
        });
        
        document.getElementById('reset').addEventListener('click', function() {
          myChart.setOption({
            series: [{
              zoom: 1
            }]
          });
          updateFontSize(1);
          myChart.dispatchAction({
            type: 'restore'
          });
        });
        
        // Add message listener for chart capture
        window.addEventListener('message', function(event) {
          if (event.data && event.data.action === 'getChartImage') {
            try {
              const canvas = myChart.getDataURL({
                type: 'png',
                pixelRatio: 2,
                backgroundColor: themeBackground
              });
              window.parent.postMessage({
                type: 'chartImage',
                dataUrl: canvas
              }, '*');
            } catch (error) {
              window.parent.postMessage({
                type: 'chartError',
                error: error.message
              }, '*');
            }
          }
        });
      </script>
    </body>
    </html>
  `;

  const downloadPDF = async () => {
    if (!graphData) {
      alert('No mind map data available. Please generate a mind map first.');
      return;
    }
    
    setIsDownloading(true);
    console.log('Starting visual PDF download process...');
    
    try {
      
      // Get the iframe and access the chart
      const iframe = webViewRef.current;
      if (!iframe || !iframe.contentWindow) {
        throw new Error('Chart iframe not accessible');
      }
      
      // Wait a moment for iframe to be ready
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Execute chart capture in iframe context
      const chartDataUrl = await new Promise<string>((resolve, reject) => {
        try {
          iframe.contentWindow!.postMessage({ action: 'getChartImage' }, '*');
          
          const messageHandler = (event: MessageEvent) => {
            if (event.data && event.data.type === 'chartImage') {
              window.removeEventListener('message', messageHandler);
              resolve(event.data.dataUrl);
            } else if (event.data && event.data.type === 'chartError') {
              window.removeEventListener('message', messageHandler);
              reject(new Error(event.data.error));
            }
          };
          
          window.addEventListener('message', messageHandler);
        } catch (error) {
          reject(error);
        }
      });
      
      console.log('Chart captured, creating PDF...');
      
      // Import jsPDF
      let jsPDF;
      try {
        const jsPDFModule = await import('jspdf');
        jsPDF = jsPDFModule.default;
        console.log('jsPDF imported successfully');
      } catch (importError: any) {
        console.error('Error importing jsPDF:', importError);
        throw new Error(`Failed to import jsPDF: ${importError?.message || 'Unknown error'}`);
      }
      
      // Create PDF document
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // Add title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Mind Map Visualization', 10, 15);
      
      // Add date
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 10, 25);
      
      // Add the chart image
      const imgWidth = 277; // A4 landscape width minus margins
      const imgHeight = 180; // Maintain aspect ratio
      
      pdf.addImage(chartDataUrl, 'PNG', 10, 35, imgWidth, imgHeight);
      
      console.log('PDF created, saving file...');
      
      // Save the PDF
      pdf.save(`mindmap_${audioid || Date.now()}.pdf`);
      
      console.log('PDF downloaded successfully');
      
    } catch (error: any) {
      console.error('Error downloading mind map PDF:', error);
      alert('Failed to generate PDF: ' + (error.message || 'Unknown error'));
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
    >
      <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{t('mindmap.title')}</h2>
        <div className="flex space-x-2">
          <button 
            onClick={regenerateMindMap}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
            title="Regenerate mind map"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
          </button>
          {/* Save button removed - mind map is automatically saved when generated */}
          <button 
            onClick={downloadPDF} /* Changed back to use visual chart capture method */
            disabled={isDownloading}
            className={`p-2 ${
              isDownloading
                ? 'text-gray-400 dark:text-gray-600'
                : 'text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400'
            } transition-colors`}
            title="Download as PDF"
          >
            {isDownloading ? <FiLoader className="animate-spin" /> : <FiDownload />}
          </button>
        </div>
      </div>

      <div className="overflow-auto h-[calc(200vh-300px)] sm:h-[calc(100vh-300px)] lg:h-[calc(100vh-300px)] p-4">
        <div className="p-4 min-h-[500px]">
          <iframe 
            ref={webViewRef}
            src={`data:text/html;charset=utf-8,${encodeURIComponent(chartHtml)}`}
            style={{ width: '100%', height: '600px', border: 'none' }}
            title="Mind Map Visualization"
          />
        </div>
      </div>
    </motion.div>
  );
};

export default MindMapComponent;
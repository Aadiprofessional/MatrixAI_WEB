import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import axios from '../utils/axiosInterceptor';
import { XMLParser } from 'fast-xml-parser';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { FiLoader, FiDownload, FiSave, FiRefreshCw, FiMaximize, FiMinimize } from 'react-icons/fi';
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
  const [isFullscreen, setIsFullscreen] = useState(false);
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
    try {
      // Handle meeting XML structure
      if (root.meeting) {
        const meeting = root.meeting;
        const rootNode: MindMapNode = { 
          name: "会议组织", 
          children: [] 
        };

        // Process topics
        if (meeting.topic) {
          const topics = Array.isArray(meeting.topic) ? meeting.topic : [meeting.topic];
          
          topics.forEach((topic: any) => {
            const topicNode: MindMapNode = { 
              name: topic['@_name'] || topic.name || "主题", 
              children: [] 
            };
            
            // Add topic description if exists
            if (topic.description) {
              const descText = typeof topic.description === 'string' ? topic.description : topic.description['#text'] || '';
              // Keep the full text without artificial truncation
              topicNode.children?.push({ name: descText.trim() });
            }
            
            // Process subtopics
            if (topic.subtopic) {
              const subtopics = Array.isArray(topic.subtopic) ? topic.subtopic : [topic.subtopic];
              
              subtopics.forEach((subtopic: any) => {
                const subtopicNode: MindMapNode = { 
                  name: subtopic['@_name'] || subtopic.name || "子主题", 
                  children: [] 
                };
                
                // Add subtopic description
                if (subtopic.description) {
                  const descText = typeof subtopic.description === 'string' ? subtopic.description : subtopic.description['#text'] || '';
                  // Keep the full text without artificial truncation
                  subtopicNode.children?.push({ name: descText.trim() });
                }
                
                // Process action items
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
            
            rootNode.children?.push(topicNode);
          });
        }
        
        return [rootNode];
      }

      // Fallback for other XML structures
      return formatLegacyData(root);
    } catch (error) {
      console.error('Error formatting graph data:', error);
      return [];
    }
  };

  const formatLegacyData = (root: any): MindMapNode[] => {
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
      xhr.open('POST', 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', true);
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

  // Function to toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

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
        // Global helper functions for node counting and depth calculation
        function countNodes(nodes) {
          let count = 0;
          if (!nodes) return count;
          count += nodes.length;
          nodes.forEach(node => {
            if (node.children && node.children.length) {
              count += countNodes(node.children);
            }
          });
          return count;
        }
        
        function depth(nodes, level = 0) {
          if (!nodes || !nodes.length) return level;
          let maxDepth = level;
          nodes.forEach(node => {
            if (node.children && node.children.length) {
              const childDepth = depth(node.children, level + 1);
              maxDepth = Math.max(maxDepth, childDepth);
            }
          });
          return maxDepth;
        }
        
        // Function to detect optimal chart size based on complexity
        function detectOptimalChartSize(data) {
          const nodeCount = countNodes(data);
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

        // Function to wrap text into multiple lines
        function wrapText(text, nodeTypeOrMaxLength) {
          // Keep the full text without truncation
          let displayText = text;
          
          let maxLineLength = 25; // Default for topic and subtopic nodes
          
          // Handle both nodeType (string) and maxCharsPerLine (number) parameters
          if (typeof nodeTypeOrMaxLength === 'string') {
            // Original nodeType parameter
            if (nodeTypeOrMaxLength === 'description') {
              maxLineLength = 100; // Increased for description nodes to show more complete text
            }
          } else if (typeof nodeTypeOrMaxLength === 'number') {
            // maxCharsPerLine parameter
            maxLineLength = nodeTypeOrMaxLength;
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

          // Return array for measurement, string for display
          // If called with a number (maxCharsPerLine), return array for forEach
          // If called with string (nodeType), return string for display
          return typeof nodeTypeOrMaxLength === 'number' ? lines : lines.join('\\n');
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
          } else if (event.data && event.data.action === 'getChartImageHighRes') {
            try {
               // Calculate optimal dimensions based on actual content structure
               const nodeCount = countNodes(coloredGraphData);
               const maxDepth = depth(coloredGraphData);
               
               // Calculate actual tree dimensions based on real text measurements
               function calculateTreeDimensions(data) {
                 if (!data || !data.length) return { width: 2000, height: 1000 };
                 
                 // Create temporary canvas for accurate text measurement
                 const canvas = document.createElement('canvas');
                 const ctx = canvas.getContext('2d');
                 ctx.font = '14px Arial'; // Match ECharts font
                 
                 let bounds = { minX: 0, maxX: 0, minY: 0, maxY: 0 };
                 
                 // Simulate tree layout and measure actual bounds
                 function measureTreeBounds(nodes, level = 0, parentY = 0, parentX = 0) {
                   if (!nodes || !nodes.length) return;
                   
                   const levelX = level * 350; // Horizontal spacing between levels
                   let currentY = parentY - ((nodes.length - 1) * 100) / 2; // Center children around parent
                   
                   nodes.forEach((node, index) => {
                     // Use improved text measurement with dynamic sizing
                     const isLeaf = level > 1;
                     const maxCharsPerLine = isLeaf ? 30 : 20;
                     const lines = wrapText(node.name, maxCharsPerLine);
                     
                     // Calculate more accurate text dimensions
                     let maxLineWidth = 0;
                     const lineArray = Array.isArray(lines) ? lines : lines.split('\\n');
                     
                     lineArray.forEach(line => {
                       const lineWidth = ctx.measureText(line).width;
                       maxLineWidth = Math.max(maxLineWidth, lineWidth);
                     });
                     
                     // Use dynamic sizing logic consistent with export
                     const charWidth = isLeaf ? 8 : 10;
                     const lineHeight = isLeaf ? 16 : 18;
                     const padding = isLeaf ? 20 : 25;
                     
                     const nodeWidth = Math.max(120, Math.min(400, Math.max(maxLineWidth + padding, maxCharsPerLine * charWidth + padding * 2)));
                     const nodeHeight = Math.max(60, lineArray.length * lineHeight + padding);
                     
                     // Calculate node bounds
                     const nodeLeft = levelX - nodeWidth / 2;
                     const nodeRight = levelX + nodeWidth / 2;
                     const nodeTop = currentY - nodeHeight / 2;
                     const nodeBottom = currentY + nodeHeight / 2;
                     
                     // Update overall bounds
                     bounds.minX = Math.min(bounds.minX, nodeLeft);
                     bounds.maxX = Math.max(bounds.maxX, nodeRight);
                     bounds.minY = Math.min(bounds.minY, nodeTop);
                     bounds.maxY = Math.max(bounds.maxY, nodeBottom);
                     
                     // Process children recursively
                     if (node.children && node.children.length > 0) {
                       measureTreeBounds(node.children, level + 1, currentY, levelX);
                     }
                     
                     currentY += 100; // Vertical spacing between siblings
                   });
                 }
                 
                 // Start measurement from root
                 measureTreeBounds(data, 0, 0, 0);
                 
                 // Calculate final dimensions with generous padding
                 const contentWidth = bounds.maxX - bounds.minX;
                 const contentHeight = bounds.maxY - bounds.minY;
                 
                 // Add substantial padding to ensure no content is cut off
                 const horizontalPadding = Math.max(300, contentWidth * 0.2);
                 const verticalPadding = Math.max(200, contentHeight * 0.2);
                 
                 const finalWidth = Math.max(contentWidth + horizontalPadding * 2, 1500);
                 const finalHeight = Math.max(contentHeight + verticalPadding * 2, 800);
                 
                 return { width: Math.ceil(finalWidth), height: Math.ceil(finalHeight) };
               }
               
               const dimensions = calculateTreeDimensions(coloredGraphData);
               const baseWidth = dimensions.width;
               const baseHeight = dimensions.height;
              
              // Create a temporary larger chart for high-resolution export
              const tempDiv = document.createElement('div');
              tempDiv.style.width = baseWidth + 'px';
              tempDiv.style.height = baseHeight + 'px';
              tempDiv.style.position = 'absolute';
              tempDiv.style.top = '-9999px';
              tempDiv.style.left = '-9999px';
              document.body.appendChild(tempDiv);
              
              const tempChart = echarts.init(tempDiv);
              
              // Calculate dynamic symbol sizes based on text content
              function calculateNodeSize(node, isLeaf = false) {
                const text = node.name || '';
                const maxCharsPerLine = isLeaf ? 30 : 20;
                const lines = wrapText(text, maxCharsPerLine);
                const lineCount = Array.isArray(lines) ? lines.length : lines.split('\\n').length;
                
                // Calculate width based on longest line
                let maxLineLength = 0;
                const lineArray = Array.isArray(lines) ? lines : lines.split('\\n');
                lineArray.forEach(line => {
                  maxLineLength = Math.max(maxLineLength, line.length);
                });
                
                // Dynamic sizing with better proportions
                const charWidth = isLeaf ? 8 : 10;
                const lineHeight = isLeaf ? 16 : 18;
                const padding = isLeaf ? 20 : 25;
                
                const width = Math.max(120, Math.min(400, maxLineLength * charWidth + padding * 2));
                const height = Math.max(60, lineCount * lineHeight + padding);
                
                return [width, height];
              }

              // Calculate average node size for consistent spacing
              function getAverageNodeSize(data) {
                let totalWidth = 0, totalHeight = 0, count = 0;
                
                function traverse(nodes, isLeaf = false) {
                  nodes.forEach(node => {
                    const [width, height] = calculateNodeSize(node, isLeaf);
                    totalWidth += width;
                    totalHeight += height;
                    count++;
                    
                    if (node.children && node.children.length > 0) {
                      traverse(node.children, true);
                    }
                  });
                }
                
                traverse(data);
                return count > 0 ? [totalWidth / count, totalHeight / count] : [160, 80];
              }

              const [avgWidth, avgHeight] = getAverageNodeSize(coloredGraphData);

              // Use the same option but with optimized settings for export
               const exportOption = {
                 ...option,
                 animation: false,
                 series: [{
                   ...option.series[0],
                   // Use percentage-based positioning for dynamic centering
                   top: '8%',      // Dynamic top margin
                   left: '8%',     // Dynamic left margin  
                   bottom: '8%',   // Dynamic bottom margin
                   right: '8%',    // Dynamic right margin
                   zoom: 1,
                   roam: false,     // Disable roaming for export
                   layout: 'none',  // Use absolute positioning
                   symbolSize: function(value, params) {
                     // Dynamic symbol size based on text content
                     return calculateNodeSize(params.data, false);
                   },
                   label: {
                     ...option.series[0].label,
                     fontSize: Math.max(11, Math.min(16, 1200 / nodeCount)),
                     width: function(params) {
                       const [width] = calculateNodeSize(params.data, false);
                       return width - 20; // Leave some padding
                     },
                     overflow: 'breakAll', // Break long words more aggressively
                     lineHeight: 18,
                     padding: [8, 12, 8, 12], // Increased padding around text
                     backgroundColor: 'rgba(255, 255, 255, 0.9)',
                     borderColor: '#ddd',
                     borderWidth: 1,
                     borderRadius: 6
                   },
                   leaves: {
                     ...option.series[0].leaves,
                     symbolSize: function(value, params) {
                       // Dynamic symbol size for leaf nodes
                       return calculateNodeSize(params.data, true);
                     },
                     label: {
                       ...option.series[0].leaves.label,
                       fontSize: Math.max(9, Math.min(14, 1000 / nodeCount)),
                       width: function(params) {
                         const [width] = calculateNodeSize(params.data, true);
                         return width - 16; // Leave some padding
                       },
                       overflow: 'breakAll',
                       lineHeight: 16,
                       padding: [6, 10, 6, 10], // Padding around leaf text
                       backgroundColor: 'rgba(248, 250, 252, 0.95)',
                       borderColor: '#e2e8f0',
                       borderWidth: 1,
                       borderRadius: 4
                     }
                   },
                   lineStyle: {
                     width: 2,
                     curveness: 0.3
                   }
                 }]
               };
              
              tempChart.setOption(exportOption);
              
              // Wait for chart to render then capture
              setTimeout(() => {
                try {
                  const canvas = tempChart.getDataURL({
                    type: 'png',
                    pixelRatio: 3,
                    backgroundColor: themeBackground,
                    excludeComponents: ['toolbox', 'dataZoom']
                  });
                  
                  // Clean up
                  tempChart.dispose();
                  document.body.removeChild(tempDiv);
                  
                  window.parent.postMessage({
                    type: 'chartImageHighRes',
                    dataUrl: canvas
                  }, '*');
                } catch (error) {
                  // Clean up on error
                  tempChart.dispose();
                  document.body.removeChild(tempDiv);
                  
                  window.parent.postMessage({
                    type: 'chartError',
                    error: error.message
                  }, '*');
                }
              }, 500);
              
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

  // Calculate node positions for graph layout with proper tree structure
  const calculateNodePositions = (data: MindMapNode[]) => {
    const positions: { [key: string]: { x: number; y: number; level: number; node: MindMapNode; width: number; height: number } } = {};
    
    // Calculate node dimensions
    const getNodeDimensions = (node: MindMapNode, level: number) => {
      const maxCharsPerLine = Math.max(12, 20 - level * 2);
      const lines = wrapText(node.name, maxCharsPerLine);
      const fontSize = Math.max(14 - level * 1, 10);
      const charWidth = fontSize * 0.6;
      const lineHeight = fontSize * 1.3;
      
      const width = Math.max(
        Math.max(...lines.map(line => line.length)) * charWidth + 30,
        100
      );
      const height = Math.max(lines.length * lineHeight + 16, 40);
      
      return { width, height, lines };
    };
    
    // Calculate subtree dimensions to properly space nodes
    const calculateSubtreeHeight = (nodes: MindMapNode[], level: number): number => {
      if (!nodes || nodes.length === 0) return 0;
      
      let totalHeight = 0;
      nodes.forEach(node => {
        const { height } = getNodeDimensions(node, level);
        totalHeight += height + 30; // Add spacing between nodes
        
        if (node.children && node.children.length > 0) {
          const childHeight = calculateSubtreeHeight(node.children, level + 1);
          totalHeight = Math.max(totalHeight, height + childHeight);
        }
      });
      
      return totalHeight;
    };
    
    // Position nodes in a balanced tree layout
    const positionNodes = (
      nodes: MindMapNode[], 
      level: number = 0, 
      parentX: number = 300, 
      parentY: number = 400, 
      availableHeight: number = 1000,
      startY: number = 50
    ) => {
      if (!nodes || nodes.length === 0) return;
      
      // Increase horizontal spacing significantly for better distribution
      const levelSpacing = level === 0 ? 0 : Math.max(350, 250 + level * 50);
      const currentX = parentX + levelSpacing;
      
      // Calculate total height needed for all nodes at this level
      let totalRequiredHeight = 0;
      const nodeData: Array<{ node: MindMapNode; width: number; height: number; lines: string[] }> = [];
      
      nodes.forEach(node => {
        const dimensions = getNodeDimensions(node, level);
        nodeData.push({ node, ...dimensions });
        totalRequiredHeight += dimensions.height + 60; // Increase vertical spacing
      });
      
      // Ensure minimum spacing between nodes
      const minNodeSpacing = 80;
      const nodeSpacing = Math.max(minNodeSpacing, (availableHeight - totalRequiredHeight) / Math.max(nodes.length - 1, 1));
      
      // Center the group of nodes vertically
      let currentY = startY;
      if (level === 0) {
        currentY = parentY; // Root node stays centered
      } else {
        // For child nodes, distribute them evenly around parent
        const totalHeight = (nodes.length - 1) * nodeSpacing + totalRequiredHeight;
        currentY = parentY - totalHeight / 2;
      }
      
      nodes.forEach((node, index) => {
        const { width, height } = nodeData[index];
        const nodeId = `${level}-${index}`;
        
        // Position current node
        const x = currentX;
        const y = currentY + height / 2;
        
        positions[nodeId] = { x, y, level, node, width, height };
        
        // Position children if they exist
        if (node.children && node.children.length > 0) {
          const childrenHeight = calculateSubtreeHeight(node.children, level + 1);
          
          positionNodes(
            node.children, 
            level + 1, 
            x, 
            y, 
            Math.max(childrenHeight + 200, 400), // Increase available height for children
            y - childrenHeight / 2
          );
        }
        
        currentY += height + nodeSpacing;
      });
    };
    
    // Start positioning from root with better spacing
    positionNodes(data, 0, 100, 400, 1200, 50);
    return positions;
  };

  // Helper function to wrap text
  const wrapText = (text: string, maxCharsPerLine: number): string[] => {
    if (text.length <= maxCharsPerLine) return [text];
    
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    words.forEach(word => {
      if ((currentLine + word).length <= maxCharsPerLine) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });
    
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  // Generate SVG-based graph for PDF
  const generateGraphSVG = (
    data: MindMapNode[], 
    width: number = 1200, 
    height: number = 800, 
    scale: number = 1, 
    offsetX: number = 0, 
    offsetY: number = 0
  ): string => {
    const positions = calculateNodePositions(data);
    const connections: string[] = [];
    const nodes: string[] = [];
    
    // Generate connections first
    const generateConnections = (nodeData: MindMapNode[], parentPos?: { x: number; y: number }, level: number = 0) => {
      nodeData.forEach((node, index) => {
        const nodeId = `${level}-${index}`;
        const currentPos = positions[nodeId];
        
        if (parentPos && currentPos) {
          connections.push(`
            <line x1="${parentPos.x}" y1="${parentPos.y}" 
                  x2="${currentPos.x}" y2="${currentPos.y}" 
                  stroke="#94a3b8" stroke-width="2" opacity="0.7"/>
          `);
        }
        
        if (node.children && node.children.length > 0 && currentPos) {
          generateConnections(node.children, currentPos, level + 1);
        }
      });
    };
    
    generateConnections(data);
    
    // Generate nodes with proper text wrapping
    Object.values(positions).forEach(({ x, y, level, node, width, height }) => {
      const fontSize = Math.max(16 - level * 2, 12);
      const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];
      const color = colors[level % colors.length];
      
      // Wrap text for this node with increased character limits
      const maxCharsPerLine = Math.max(20, 40 - level * 5);
      const lines = wrapText(node.name, maxCharsPerLine);
      const lineHeight = fontSize * 1.4;
      
      // Generate text elements for each line
      const textElements = lines.map((line, lineIndex) => {
        const textY = y - (lines.length - 1) * lineHeight / 2 + lineIndex * lineHeight;
        return `
          <text x="${x}" y="${textY}" 
                text-anchor="middle" 
                font-family="Arial, sans-serif" 
                font-size="${fontSize}" 
                font-weight="${level < 2 ? 'bold' : 'normal'}" 
                fill="white"
                dominant-baseline="middle">
            ${line}
          </text>
        `;
      }).join('');
      
      nodes.push(`
        <g>
          <rect x="${x - width/2}" y="${y - height/2}" 
                width="${width}" height="${height}" 
                fill="${color}" rx="8" opacity="0.9"
                stroke="${color}" stroke-width="1"/>
          ${textElements}
        </g>
      `);
    });
    
    // Calculate transform for centering and scaling
    const padding = 80;
    const translateX = padding - offsetX * scale;
    const translateY = padding + 80 - offsetY * scale; // 80px for header space
    
    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>
            .title { font-family: Arial, sans-serif; font-size: 24px; font-weight: bold; fill: #1f2937; }
            .date { font-family: Arial, sans-serif; font-size: 14px; fill: #6b7280; }
          </style>
        </defs>
        <rect width="100%" height="100%" fill="white"/>
        
        <!-- Header -->
        <text x="${width/2}" y="30" text-anchor="middle" class="title">Mind Map Visualization</text>
        <text x="${width/2}" y="50" text-anchor="middle" class="date">Generated on: ${new Date().toLocaleDateString()}</text>
        
        <!-- Graph content with scaling and positioning -->
        <g transform="translate(${translateX}, ${translateY}) scale(${scale})">
          ${connections.join('')}
          ${nodes.join('')}
        </g>
      </svg>
    `;
  };

  // Generate HTML with SVG graph for PDF
  const generateGraphHTML = (data: MindMapNode[]): string => {
    // Calculate required dimensions based on actual node positions
    const positions = calculateNodePositions(data);
    const positionValues = Object.values(positions);
    
    if (positionValues.length === 0) {
      return generateGraphSVG(data, 1600, 1000);
    }
    
    // Find the bounds of all nodes with extra margin
    const margin = 50;
    const minX = Math.min(...positionValues.map(p => p.x - p.width / 2)) - margin;
    const maxX = Math.max(...positionValues.map(p => p.x + p.width / 2)) + margin;
    const minY = Math.min(...positionValues.map(p => p.y - p.height / 2)) - margin;
    const maxY = Math.max(...positionValues.map(p => p.y + p.height / 2)) + margin;
    
    // Calculate content dimensions
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    
    // Set larger canvas size for better layout
    const maxWidth = 1800;
    const maxHeight = 1200;
    const padding = 100;
    
    // Scale content to fit if necessary, but be more conservative
    const scaleX = contentWidth > 0 ? (maxWidth - padding * 2) / contentWidth : 1;
    const scaleY = contentHeight > 0 ? (maxHeight - padding * 2) / contentHeight : 1;
    const scale = Math.min(scaleX, scaleY, 0.9); // Slightly reduce max scale for better spacing
    
    const finalWidth = Math.max(maxWidth, contentWidth * scale + padding * 2);
    const finalHeight = Math.max(maxHeight, contentHeight * scale + padding * 2);
    
    const svgContent = generateGraphSVG(data, finalWidth, finalHeight, scale, minX, minY);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Mind Map Graph</title>
        <style>
          body {
            margin: 0;
            padding: 20px;
            background: white;
            font-family: Arial, sans-serif;
          }
          .graph-container {
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: flex-start;
          }
          svg {
            max-width: 100%;
            height: auto;
          }
        </style>
      </head>
      <body>
        <div class="graph-container">
          ${svgContent}
        </div>
      </body>
      </html>
    `;
  };

  const downloadPDF = async () => {
    if (!graphData) {
      alert('No mind map data available. Please generate a mind map first.');
      return;
    }
    
    setIsDownloading(true);
    console.log('Starting text-based PDF download process...');
    
    try {
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

      // Use text-based PDF generation as primary method
      createTextBasedPDF(jsPDF);
      
    } catch (error: any) {
      console.error('Error downloading mind map PDF:', error);
      alert('Failed to generate PDF: ' + (error.message || 'Unknown error'));
    } finally {
      setIsDownloading(false);
    }
  };

  // Text-based PDF creation with improved formatting
  const createTextBasedPDF = (jsPDF: any) => {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Add title with better positioning
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(40, 40, 40);
    pdf.text('Mind Map Structure', 25, 25);

    // Add date and subtitle
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 25, 35);
    
    // Add separator line with proper margins
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(200, 200, 200);
    pdf.line(25, 40, 185, 40);

    // Add mind map content as hierarchical text
    let yPosition = 50;
    let pageNumber = 1;
    
    const addPageNumber = () => {
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Page ${pageNumber}`, 175, 280);
      pageNumber++;
    };
    
    addPageNumber();

    const addNodeText = (node: MindMapNode, level: number = 0) => {
      // Calculate indentation and styling based on level
      const indentSize = level * 10; // 10mm per level for better readability
      const xPosition = 25 + indentSize;
      const maxWidth = 175 - indentSize; // Increased width for better text display
      
      // Set font size and style based on hierarchy level
       let fontSize: number;
       let fontStyle: string;
       let textColor: number[];
       
       if (level === 0) {
         fontSize = 14;
         fontStyle = 'bold';
         textColor = [20, 20, 20];
       } else if (level === 1) {
         fontSize = 12;
         fontStyle = 'bold';
         textColor = [40, 40, 40];
       } else if (level === 2) {
         fontSize = 11;
         fontStyle = 'normal';
         textColor = [60, 60, 60];
       } else {
         fontSize = 10;
         fontStyle = 'normal';
         textColor = [80, 80, 80];
       }
      
      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', fontStyle);
      pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
      
      // Create simple text bullet points based on level
      let bullet: string;
      if (level === 0) {
        bullet = '-';
      } else if (level === 1) {
        bullet = '  -';
      } else if (level === 2) {
        bullet = '    *';
      } else {
        bullet = '      +';
      }
      
      // Clean the node name more gently - only remove truly problematic characters
      const cleanName = node.name
        .replace(/[\u2022\u25A0\u25CF\u25E6\u25AA]/g, '') // Remove bullet symbols
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      
      const text = `${bullet} ${cleanName}`;
      
      // Split text with proper width calculation and ensure complete words
      const lines = pdf.splitTextToSize(text, maxWidth);
      
      // Check if we need a new page with better margin calculation
      const lineHeight = fontSize * 0.5; // Better line height calculation
      const requiredHeight = lines.length * lineHeight + 6;
      if (yPosition + requiredHeight > 260) { // More conservative page height
        pdf.addPage();
        yPosition = 30; // Start lower on new page
        addPageNumber();
      }
      
      // Add the text lines with proper spacing
      lines.forEach((line: string, index: number) => {
        pdf.text(line, xPosition, yPosition);
        yPosition += lineHeight;
      });
      
      // Add spacing after the node based on level
      yPosition += level === 0 ? 6 : (level === 1 ? 4 : 3);
      
      // Process children
      if (node.children && node.children.length > 0) {
        node.children.forEach(child => addNodeText(child, level + 1));
        
        // Add extra spacing after a section with children
        if (level <= 1) {
          yPosition += 4;
        }
      }
    };

    // Process all root nodes
    graphData?.forEach((node, index) => {
      if (index > 0) {
        yPosition += 6; // Extra spacing between root sections
      }
      addNodeText(node);
    });

    // Save the PDF
    pdf.save(`mindmap_text_${audioid || Date.now()}.pdf`);
    console.log('Text-based PDF downloaded successfully');
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden ${
        isFullscreen 
          ? 'fixed inset-0 z-50 rounded-none' 
          : ''
      }`}
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
          <button 
            onClick={toggleFullscreen}
            className="p-2 text-gray-500 hover:text-purple-500 dark:text-gray-400 dark:hover:text-purple-400 transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <FiMinimize /> : <FiMaximize />}
          </button>
        </div>
      </div>

      <div className={`overflow-auto p-4 ${
        isFullscreen 
          ? 'h-[calc(100vh-80px)]' 
          : 'h-[calc(200vh-300px)] sm:h-[calc(100vh-300px)] lg:h-[calc(100vh-300px)]'
      }`}>
        <div className="p-4 min-h-[500px]">
          <iframe 
            ref={webViewRef}
            src={`data:text/html;charset=utf-8,${encodeURIComponent(chartHtml)}`}
            style={{ 
              width: '100%', 
              height: isFullscreen ? 'calc(100vh - 160px)' : '600px', 
              border: 'none' 
            }}
            title="Mind Map Visualization"
          />
        </div>
      </div>
    </motion.div>
  );
};

export default MindMapComponent;
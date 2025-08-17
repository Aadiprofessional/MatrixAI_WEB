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
        model: "qwen-plus",
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
        max_tokens: 2048
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

  const downloadPDF = async () => {
    if (!graphData) {
      alert('No mind map data available. Please generate a mind map first.');
      return;
    }
    
    // Check if user ID is available
    if (!uid) {
      alert('Please log in to download the PDF.');
      return;
    }
    
    setIsDownloading(true);
    console.log('Starting visual PDF download process...');
    
    try {
      // Deduct 1 coin for PDF download
      console.log('Deducting coins...');
      const coinResponse = await userService.subtractCoins(uid, 1, 'mindmap_pdf_download');
      
      if (!coinResponse.success) {
        alert('Failed to deduct coins. Please try again.');
        setIsDownloading(false);
        return;
      }
      
      console.log('Coins deducted successfully, importing libraries...');
      
      // Import libraries
      let html2canvas, jsPDF;
      try {
        const html2canvasModule = await import('html2canvas');
        html2canvas = html2canvasModule.default;
        console.log('html2canvas imported successfully');
        
        const jsPDFModule = await import('jspdf');
        jsPDF = jsPDFModule.default;
        console.log('jsPDF imported successfully');
      } catch (importError: any) {
        console.error('Error importing libraries:', importError);
        throw new Error(`Failed to import required libraries: ${importError?.message || 'Unknown error'}`);
      }
      
      console.log('Libraries imported, capturing iframe content...');
      
      // Create canvas for drawing mind map
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 800;
        const ctx = canvas.getContext('2d')!;
        
        // Set background
        ctx.fillStyle = theme === 'dark' ? '#1f2937' : '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Function to draw mind map nodes with boundary checking
        const drawMindMap = (node: any, x: number, y: number, level: number = 0, parentX?: number, parentY?: number) => {
          // Ensure coordinates are within canvas bounds
          const margin = 50;
          const safeX = Math.max(margin, Math.min(canvas.width - margin, x));
          const safeY = Math.max(margin, Math.min(canvas.height - margin, y));
          
          const nodeRadius = Math.max(6, 16 - level * 2);
          const textColor = theme === 'dark' ? '#f9fafb' : '#1f2937';
          const lineColor = theme === 'dark' ? '#6b7280' : '#9ca3af';
          const nodeColor = theme === 'dark' ? '#374151' : '#e5e7eb';
          
          // Draw line to parent if exists
          if (parentX !== undefined && parentY !== undefined) {
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(parentX, parentY);
            ctx.lineTo(safeX, safeY);
            ctx.stroke();
          }
          
          // Draw node circle
          ctx.fillStyle = nodeColor;
          ctx.beginPath();
          ctx.arc(safeX, safeY, nodeRadius, 0, 2 * Math.PI);
          ctx.fill();
          
          // Draw node border
          ctx.strokeStyle = lineColor;
          ctx.lineWidth = 1;
          ctx.stroke();
          
          // Draw text with improved wrapping
          ctx.fillStyle = textColor;
          ctx.font = `${Math.max(10, 12 - level)}px Arial`;
          ctx.textAlign = level === 0 ? 'center' : 'left';
          ctx.textBaseline = 'middle';
          
          const text = node.name || '';
          // Adjust max width based on remaining canvas space
          const remainingWidth = canvas.width - safeX - margin;
          const maxWidth = Math.min(120, remainingWidth - nodeRadius - 20);
          
          const words = text.split(' ');
          let lines = [];
          let currentLine = '';
          
          for (let word of words) {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && currentLine) {
              lines.push(currentLine);
              currentLine = word;
            } else {
              currentLine = testLine;
            }
          }
          if (currentLine) lines.push(currentLine);
          
          // Limit number of lines to prevent overflow
          if (lines.length > 3) {
            lines = lines.slice(0, 2);
            lines.push(lines[1] + '...');
          }
          
          const lineHeight = Math.max(10, 14 - level);
          const startY = safeY - ((lines.length - 1) * lineHeight) / 2;
          
          lines.forEach((line, index) => {
            const textX = level === 0 ? safeX : safeX + nodeRadius + 8;
            const textY = startY + index * lineHeight;
            
            // Ensure text doesn't go beyond canvas bounds
            if (textY >= margin && textY <= canvas.height - margin) {
              ctx.fillText(line, textX, textY);
            }
          });
          
          // Draw children with improved spacing
          if (node.children && node.children.length > 0) {
            const availableHeight = canvas.height - 2 * margin;
            const childSpacing = Math.min(60, availableHeight / Math.max(node.children.length, 1));
            const totalChildrenHeight = (node.children.length - 1) * childSpacing;
            const startChildY = Math.max(margin, safeY - totalChildrenHeight / 2);
            
            node.children.forEach((child: any, index: number) => {
              const childX = Math.min(safeX + 150, canvas.width - margin - 100);
              const childY = Math.min(startChildY + index * childSpacing, canvas.height - margin);
              
              // Only draw child if it's within reasonable bounds
              if (childX < canvas.width - margin && childY < canvas.height - margin) {
                drawMindMap(child, childX, childY, level + 1, safeX, safeY);
              }
            });
          }
        };
        
        // Add debugging
        console.log('GraphData for drawing:', graphData);
        
        // Draw the mind map starting from center-left
        if (graphData && Array.isArray(graphData) && graphData.length > 0 && graphData[0].name) {
          console.log('Drawing mind map with root node:', graphData[0].name);
          // Start from left-center with better positioning
          const rootX = 120; // More space from left edge
          const rootY = canvas.height / 2;
          drawMindMap(graphData[0], rootX, rootY);
        } else {
          console.error('Invalid graphData structure:', graphData);
          // Draw a simple fallback
          ctx.fillStyle = theme === 'dark' ? '#f9fafb' : '#1f2937';
          ctx.font = '16px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Mind Map Data Not Available', canvas.width / 2, canvas.height / 2);
        }
        
        // Add a small delay to ensure drawing is complete
        await new Promise(resolve => setTimeout(resolve, 100));
       
       console.log('Canvas drawing complete, creating PDF...');
       console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
       
       // Debug: Check if canvas has content
       const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
       const hasContent = imageData.data.some((pixel, index) => {
         // Check if any pixel is not the background color
         if (index % 4 === 3) return false; // Skip alpha channel
         const bgColor = theme === 'dark' ? 31 : 255; // #1f2937 vs #ffffff
         return Math.abs(pixel - bgColor) > 10;
       });
       console.log('Canvas has content:', hasContent);
      
      // Create PDF document
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // Calculate dimensions to fit the image properly
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const availableWidth = pdfWidth - (margin * 2);
      const availableHeight = pdfHeight - (margin * 3) - 20; // Extra space for title
      
      // Calculate scaling to fit image while maintaining aspect ratio
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const aspectRatio = imgWidth / imgHeight;
      
      let finalWidth = availableWidth;
      let finalHeight = availableWidth / aspectRatio;
      
      if (finalHeight > availableHeight) {
        finalHeight = availableHeight;
        finalWidth = availableHeight * aspectRatio;
      }
      
      // Center the image
      const xOffset = (pdfWidth - finalWidth) / 2;
      const yOffset = margin + 20; // Space for title
      
      // Add title
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      const title = 'Mind Map Visualization';
      const titleWidth = pdf.getTextWidth(title);
      pdf.text(title, (pdfWidth - titleWidth) / 2, margin + 10);
      
      // Add date
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const dateText = `Generated on: ${new Date().toLocaleDateString()}`;
      const dateWidth = pdf.getTextWidth(dateText);
      pdf.text(dateText, (pdfWidth - dateWidth) / 2, margin + 16);
      
      // Convert canvas to image and add to PDF
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight);
      
      // Add footer
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      const footerText = 'Generated by MatrixAI Mind Map Tool';
      const footerWidth = pdf.getTextWidth(footerText);
      pdf.text(footerText, (pdfWidth - footerWidth) / 2, pdfHeight - 5);
      
      console.log('PDF created, saving file...');
      
      // Save the PDF
      pdf.save(`mindmap_${audioid || Date.now()}.pdf`);
      
      console.log('PDF downloaded successfully');
      
    } catch (error: any) {
      console.error('Error downloading mind map PDF:', error);
      
      // Check if error is due to insufficient coins
      if (error.message && error.message.includes('insufficient')) {
        alert('You don\'t have enough coins. Please purchase more coins to use this feature.');
      } else {
        alert('Failed to generate PDF: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setIsDownloading(false);
    }
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

        // Function to wrap text into multiple lines
        function wrapText(text, nodeType) {
          let maxLineLength = 16; // Reduced for topic and subtopic nodes
          if (nodeType === 'description') {
            maxLineLength = 70; // Reduced for description nodes
          }

          const words = text.split(' ');
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
              fontSize: 18,
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
        
        // Zoom controls
        document.getElementById('zoomIn').addEventListener('click', function() {
          const currentZoom = myChart.getOption().series[0].zoom || 1;
          myChart.setOption({
            series: [{
              zoom: Math.min(2, currentZoom * 1.3)
            }]
          });
        });
        
        document.getElementById('zoomOut').addEventListener('click', function() {
          const currentZoom = myChart.getOption().series[0].zoom || 1;
          myChart.setOption({
            series: [{
              zoom: Math.max(0.5, currentZoom / 1.3)
            }]
          });
        });
        
        document.getElementById('reset').addEventListener('click', function() {
          myChart.setOption({
            series: [{
              zoom: 1
            }]
          });
          myChart.dispatchAction({
            type: 'restore'
          });
        });
      </script>
    </body>
    </html>
  `;

  const downloadPDFDirectly = async () => {
    if (!graphData) {
      alert('No mind map data available. Please generate a mind map first.');
      return;
    }
    
    // Check if user ID is available
    if (!uid) {
      alert('Please log in to download the PDF.');
      return;
    }
    
    setIsDownloading(true);
    console.log('Starting direct PDF download process...');
    
    try {
      // Deduct 1 coin for PDF download
      console.log('Deducting coins...');
      const coinResponse = await userService.subtractCoins(uid, 1, 'mindmap_pdf_download');
      
      if (!coinResponse.success) {
        alert('Failed to deduct coins. Please try again.');
        setIsDownloading(false);
        return;
      }
      
      console.log('Coins deducted successfully, importing libraries...');
      
      // Import libraries
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
      });
      
      // Add title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Mind Map Visualization', 10, 10);
      
      // Add date
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 10, 18);
      
      // Add mind map content as text
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      
      const addNodeToPDF = (node: MindMapNode, level = 0, y = 30) => {
        const indent = level * 10;
        const prefix = level > 0 ? '- ' : '';
        
        // Add the node name
        pdf.setFont('helvetica', level === 0 ? 'bold' : 'normal');
        pdf.text(`${prefix}${node.name}`, 10 + indent, y);
        
        let newY = y + 8;
        
        // Add children recursively
        if (node.children && node.children.length > 0) {
          node.children.forEach(child => {
            // Check if we need a new page
            if (newY > 180) {
              pdf.addPage();
              newY = 30;
            }
            newY = addNodeToPDF(child, level + 1, newY);
          });
        }
        
        return newY;
      };
      
      // Process each top-level node
      let currentY = 30;
      graphData.forEach(node => {
        currentY = addNodeToPDF(node, 0, currentY);
        currentY += 10; // Add extra space between top-level nodes
        
        // Add a new page if needed
        if (currentY > 180) {
          pdf.addPage();
          currentY = 30;
        }
      });
      
      console.log('PDF created, saving file...');
      
      // Save the PDF
      pdf.save(`mindmap_${audioid || Date.now()}.pdf`);
      
      console.log('PDF downloaded successfully');
      
    } catch (error: any) {
      console.error('Error downloading mind map PDF:', error);
      
      // Check if error is due to insufficient coins
      if (error.message && error.message.includes('insufficient')) {
        alert('You don\'t have enough coins. Please purchase more coins to use this feature.');
      } else {
        alert('Failed to generate PDF: ' + (error.message || 'Unknown error'));
      }
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
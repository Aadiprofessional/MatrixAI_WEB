import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import OpenAI from 'openai';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { FiLoader, FiDownload, FiSave, FiRefreshCw } from 'react-icons/fi';

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
  const { t } = useLanguage();
  const colors = getThemeColors();
  
  const [graphData, setGraphData] = useState<MindMapNode[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentXmlData, setCurrentXmlData] = useState<string | null>(xmlData || null);
  const webViewRef = useRef<HTMLIFrameElement>(null);

  // Initialize OpenAI with Deepseek configuration
  const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: 'sk-fed0eb08e6ad4f1aabe2b0c27c643816',
    dangerouslyAllowBrowser: true
  });

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

  const fetchGraphData = async (transcriptionText: string) => {
    if (!transcriptionText) return;
    
    setLoading(true);
    try {
      const response = await openai.chat.completions.create({
        model: "deepseek-chat",
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
      });

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
    } catch (error) {
      console.error('Error fetching graph data:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendXmlGraphData = async (xmlDataToSend: string) => {
    if (!xmlDataToSend || !uid || !audioid) {
      console.error('No XML data available to send or missing uid/audioid.');
      return;
    }

    try {
      const response = await axios.post('https://main-matrixai-server-lujmidrakh.cn-hangzhou.fcapp.run/api/audio/sendXmlGraph', {
        uid,
        audioid,
        xmlData: xmlDataToSend,
      });
      console.log('XML Graph Data Sent:', response.data);
    } catch (error) {
      console.error('Error sending XML Graph Data:', error);
    }
  };

  const downloadPDF = async () => {
    if (!graphData) return;
    
    setIsDownloading(true);
    
    try {
      const response = await axios.post('https://main-matrixai-server-lujmidrakh.cn-hangzhou.fcapp.run/generateMindMapPdf', {
        uid,
        audioid,
        xmlData: currentXmlData || JSON.stringify(graphData)
      }, {
        responseType: 'blob'
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `mindmap_${audioid || Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
    } catch (error) {
      console.error('Error downloading mind map PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const saveMindMap = async () => {
    if (!currentXmlData || !uid || !audioid) return;
    
    try {
      const response = await axios.post('https://main-matrixai-server-lujmidrakh.cn-hangzhou.fcapp.run/api/audio/sendXmlGraph', {
        uid,
        audioid,
        xmlData: currentXmlData,
      });
      
      console.log('Mind map saved successfully:', response.data);
      alert('Mind map saved successfully!');
    } catch (error) {
      console.error('Error saving mind map:', error);
      alert('Failed to save mind map.');
    }
  };

  const regenerateMindMap = () => {
    if (transcription) {
      fetchGraphData(transcription);
    }
  };

  useEffect(() => {
    if (xmlData) {
      setCurrentXmlData(xmlData);
      parseXMLData(xmlData);
    } else if (transcription) {
      fetchGraphData(transcription);
    }
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
        <button
          onClick={regenerateMindMap}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center"
        >
          <FiRefreshCw className="mr-2" /> {t('mindmap.generate')}
        </button>
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

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
    >
      <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Mind Map Visualization</h2>
        <div className="flex space-x-2">
          <button 
            onClick={regenerateMindMap}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
            title="Regenerate mind map"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
          </button>
          <button 
            onClick={saveMindMap}
            className="p-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
            title="Save mind map"
          >
            <FiSave />
          </button>
          <button 
            onClick={downloadPDF}
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

      <div className="overflow-auto h-[calc(100vh-300px)] p-4">
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
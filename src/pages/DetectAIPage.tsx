import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  FiEdit, 
  FiCopy, 
  FiDownload, 
  FiTrash, 
  FiPlus, 
  FiSave,
  FiZap,
  FiShield,
  FiPieChart,
  FiAlertTriangle,
  FiCheckCircle,
  FiFileText,
  FiSliders,
  FiRotateCw,
  FiX
} from 'react-icons/fi';
import { ProFeatureAlert } from '../components';
import { useUser } from '../context/UserContext';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import './ContentWriterPage.css';

const DetectAIPage: React.FC = () => {
  const { userData, isPro } = useUser();
  const [text, setText] = useState('');
  const [detectionResult, setDetectionResult] = useState<{
    isAIGenerated: boolean;
    score: number;
    analysis: string;
    summary: string;
  } | null>(null);
  const [sensitivity, setSensitivity] = useState('balanced');
  const [isProcessing, setIsProcessing] = useState(false);
  const [savedContents, setSavedContents] = useState<{id: string, title: string, content: string, result: any}[]>([]);
  const [editingTitle, setEditingTitle] = useState('');
  const [showTitleEdit, setShowTitleEdit] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProAlert, setShowProAlert] = useState(false);
  const [freeDetectionsLeft, setFreeDetectionsLeft] = useState(1);
  const [history, setHistory] = useState<string[]>([
    'Analyze this content for AI generation',
    'Is this text written by AI or human?',
    'Check if this essay is AI-generated',
    'Detect AI in this product review'
  ]);

  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Sensitivity levels
  const sensitivityOptions = [
    { id: 'low', name: 'Low - Fewer false positives' },
    { id: 'balanced', name: 'Balanced - Default detection' },
    { id: 'high', name: 'High - Stricter detection' },
    { id: 'very-high', name: 'Very High - Maximum sensitivity' },
  ];

  const handleDetectAI = async () => {
    if (!text.trim()) return;
    
    // If user is not pro and has used all free detections, show pro alert
    if (!isPro && freeDetectionsLeft <= 0) {
      setShowProAlert(true);
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Create request payload with all settings
      const userMessageContent = {
        prompt: text,
        action: 'detect-ai',
        sensitivity: sensitivity
      };
      
      // Make API request to Supabase Function
      const response = await axios.post(
        'https://ddtgdhehxhgarkonvpfq.supabase.co/functions/v1/createContent',
        {
          prompt: userMessageContent
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Set the detection result from API response
      const result = response.data.output;
      setDetectionResult({
        isAIGenerated: result.isAIGenerated || false,
        score: result.score || 0.5,
        analysis: result.analysis || "No detailed analysis available.",
        summary: result.summary || "Analysis complete."
      });
      
      // Add to history if not already there
      if (!history.includes(text.substring(0, 50))) {
        setHistory(prev => [text.substring(0, 50), ...prev.slice(0, 3)]);
      }
      
      // Decrease free detections left if user is not pro
      if (!isPro) {
        setFreeDetectionsLeft(prev => prev - 1);
      }
    } catch (error) {
      console.error('Error detecting AI:', error);
      setDetectionResult({
        isAIGenerated: false,
        score: 0,
        analysis: 'Error analyzing text. Please try again later.',
        summary: 'Analysis failed.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getContentTitle = () => {
    let title = 'AI Detection Result';
    
    if (text.length > 30) {
      title = `Analysis: ${text.substring(0, 30)}...`;
    } else if (text.length > 0) {
      title = `Analysis: ${text}`;
    }
    
    return title;
  };

  const handleCopyContent = () => {
    if (!detectionResult) return;
    
    const resultText = `AI Detection Results:
Score: ${Math.round(detectionResult.score * 100)}% likely AI-generated
${detectionResult.summary}

${detectionResult.analysis}`;
    
    navigator.clipboard.writeText(resultText);
    // Could add a toast notification here
  };

  const handleDownloadContent = () => {
    if (!detectionResult) return;
    
    const resultText = `# AI Detection Results

**Score:** ${Math.round(detectionResult.score * 100)}% likely AI-generated
**Summary:** ${detectionResult.summary}

## Detailed Analysis
${detectionResult.analysis}

## Analyzed Text
\`\`\`
${text}
\`\`\`
`;
    
    const element = document.createElement('a');
    const file = new Blob([resultText], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = `${getContentTitle()}.md`.replace(/[^a-z0-9\s-]/gi, '').replace(/\s+/g, '-').toLowerCase();
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSaveContent = () => {
    if (!detectionResult) return;
    
    const title = editingTitle || getContentTitle();
    
    setSavedContents(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        title,
        content: text,
        result: detectionResult
      }
    ]);
    
    setShowTitleEdit(false);
    setEditingTitle('');
  };

  const handleDeleteSaved = (id: string) => {
    setSavedContents(prev => prev.filter(item => item.id !== id));
  };

  const handleLoadSaved = (content: string) => {
    setText(content);
  };

  const renderDetectionResult = () => {
    if (!detectionResult) return null;
    
    const score = Math.round(detectionResult.score * 100);
    
    let statusComponent;
    let scoreClass;
    let scoreColor;
    
    if (score >= 80) {
      statusComponent = (
        <div className="flex items-center text-red-500">
          <FiAlertTriangle className="mr-2" />
          <span className="font-medium">Likely AI-Generated</span>
        </div>
      );
      scoreClass = "text-red-500";
      scoreColor = "#ef4444";
    } else if (score >= 50) {
      statusComponent = (
        <div className="flex items-center text-yellow-500">
          <FiAlertTriangle className="mr-2" />
          <span className="font-medium">Possibly AI-Generated</span>
        </div>
      );
      scoreClass = "text-yellow-500";
      scoreColor = "#eab308";
    } else {
      statusComponent = (
        <div className="flex items-center text-green-500">
          <FiCheckCircle className="mr-2" />
          <span className="font-medium">Likely Human-Written</span>
        </div>
      );
      scoreClass = "text-green-500";
      scoreColor = "#22c55e";
    }
    
    return (
      <div className="mb-8">
        <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl mb-6 border border-indigo-100 dark:border-indigo-800">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="md:w-1/2 mb-4 md:mb-0">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                {statusComponent}
                <h3 className="text-xl font-bold mt-4 mb-2">Analysis Summary</h3>
                <p className="text-gray-700 dark:text-gray-300">{detectionResult.summary}</p>
              </div>
            </div>
            
            <div className="md:w-1/3 flex flex-col items-center justify-center">
              {/* Modern gauge-style circular progress */}
              <div className="relative h-40 w-40">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="45" 
                    fill="none" 
                    stroke="#e5e7eb" 
                    strokeWidth="10" 
                    className="dark:opacity-20"
                  />
                  
                  {/* Progress arc with gradient */}
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="45" 
                    fill="none" 
                    stroke={scoreColor} 
                    strokeWidth="10" 
                    strokeDasharray={`${score * 2.83}, 283`} 
                    strokeDashoffset="0" 
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                    className="drop-shadow-md"
                  />
                  
                  {/* Inner circle with drop shadow effect */}
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="35" 
                    fill="white" 
                    className="dark:fill-gray-800 drop-shadow-sm"
                  />
                  
                  {/* Score text */}
                  <text 
                    x="50" 
                    y="45" 
                    textAnchor="middle" 
                    fontSize="22" 
                    fontWeight="bold" 
                    fill={scoreColor}
                  >
                    {score}%
                  </text>
                  
                  <text 
                    x="50" 
                    y="65" 
                    textAnchor="middle" 
                    fontSize="10" 
                    fill="#6b7280"
                    className="dark:fill-gray-400"
                  >
                    AI PROBABILITY
                  </text>
                </svg>
              </div>
              
              <div className="text-center mt-4">
                <div className="flex justify-center gap-2 mb-2">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    0-49%: Human
                  </span>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                    50-79%: Mixed
                  </span>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                    80-100%: AI
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-xl font-bold mb-3 flex items-center">
            <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 p-1.5 rounded-md mr-2">
              <FiFileText className="w-5 h-5" />
            </span>
            Detailed Analysis
          </h3>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>
              {detectionResult.analysis}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto max-w-6xl p-4 py-8">
      {showProAlert && (
        <ProFeatureAlert 
          featureName="Advanced AI Detection"
          onClose={() => setShowProAlert(false)}
        />
      )}
      
      <div className="mb-8">
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500"
        >
          AI Content Detector
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-500 dark:text-gray-400"
        >
          Analyze content to detect if it was generated by AI or written by a human
        </motion.p>
        
        {/* Added feature badges */}
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gradient-to-r from-purple-400 to-indigo-400 text-white">High Accuracy</span>
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-400 to-blue-400 text-white">Adjustable Sensitivity</span>
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 text-white">Detailed Analysis</span>
        </div>
        
        {!isPro && (
          <div className="mt-4 flex items-center text-sm text-yellow-600 dark:text-yellow-400">
            <FiFileText className="mr-1.5" />
            <span>{freeDetectionsLeft} free detection{freeDetectionsLeft !== 1 ? 's' : ''} left</span>
            {freeDetectionsLeft === 0 && (
              <button 
                onClick={() => setShowProAlert(true)}
                className="ml-2 text-blue-500 hover:text-blue-600 font-medium"
              >
                Upgrade to Pro
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Text Input Form */}
        <div className="lg:col-span-2 order-2 lg:order-1">
          <div className="sticky top-6 space-y-6">
            {/* Text Input */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-medium mb-4 flex items-center">
                <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 p-1.5 rounded-md mr-2">
                  <FiShield className="w-5 h-5" />
                </span>
                Analyze Text
              </h2>
              
              <div className="space-y-4">
                <div className="flex-1">
                  <div className="relative">
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Paste text here to analyze if it was written by AI..."
                      className="w-full p-4 pr-12 border rounded-lg shadow-sm h-36 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      disabled={isProcessing}
                    />
                    <div className="absolute top-2 right-2">
                      <button 
                        onClick={() => setShowSettings(!showSettings)}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        disabled={isProcessing}
                      >
                        <FiSliders />
                      </button>
                    </div>
                  </div>

                  {showSettings && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 p-4 border rounded-lg shadow-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    >
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Detection Sensitivity</label>
                        <div className="grid grid-cols-4 gap-2">
                          {sensitivityOptions.map(option => (
                            <button
                              key={option.id}
                              onClick={() => setSensitivity(option.id)}
                              className={`py-2 px-3 text-xs text-center rounded-lg transition-colors ${
                                sensitivity === option.id
                                  ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-2 border-indigo-400 dark:border-indigo-600'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border-2 border-transparent'
                              }`}
                              disabled={isProcessing}
                            >
                              {option.id === 'low' && 'Low'}
                              {option.id === 'balanced' && 'Normal'}
                              {option.id === 'high' && 'High'}
                              {option.id === 'very-high' && 'Very High'}
                            </button>
                          ))}
                        </div>
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          {sensitivity === 'low' && 'Lower sensitivity reduces false positives but may miss subtle AI patterns.'}
                          {sensitivity === 'balanced' && 'Balanced detection offers a good compromise between accuracy and false positives.'}
                          {sensitivity === 'high' && 'Higher sensitivity catches more AI text but may include some false positives.'}
                          {sensitivity === 'very-high' && 'Maximum sensitivity for detecting even minimal AI influence in text.'}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
                
                <div className="w-full bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3 text-xs text-gray-700 dark:text-gray-300 border border-indigo-100 dark:border-indigo-800/50">
                  <div className="flex items-start">
                    <FiAlertTriangle className="text-indigo-500 dark:text-indigo-400 mt-0.5 mr-2 flex-shrink-0" />
                    <span>For best results, provide at least 100+ words of text. Longer texts yield more accurate detection results.</span>
                  </div>
                </div>
                
                {history.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Recent Inputs:</h3>
                    <div className="flex flex-wrap gap-2">
                      {history.map((item, index) => (
                        <button
                          key={index}
                          className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-800 dark:text-gray-200"
                          onClick={() => setText(item)}
                          disabled={isProcessing}
                        >
                          {item.length > 25 ? item.substring(0, 25) + '...' : item}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <button
                onClick={handleDetectAI}
                disabled={isProcessing || !text.trim()}
                className={`px-4 py-4 min-w-24 rounded-lg font-medium shadow-sm transition-all flex items-center justify-center ${
                  isProcessing || !text.trim()
                    ? 'bg-gray-300 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                    : 'bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 text-white hover:shadow-md'
                }`}
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </>
                ) : (
                  <>
                    Detect AI
                    <FiShield className="ml-2" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Output */}
        <div className="lg:col-span-3 order-1 lg:order-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
            {/* Content Header */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-b border-indigo-100 dark:border-indigo-800/50 p-4 flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 flex items-center justify-center text-white mr-2">
                  <FiPieChart className="w-4 h-4" />
                </div>
                <h2 className="font-medium">{detectionResult ? getContentTitle() : 'AI Detection Results'}</h2>
              </div>
              
              <div className="flex space-x-1">
                {detectionResult && (
                  <>
                    <button
                      onClick={handleCopyContent}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-colors"
                      title="Copy to clipboard"
                    >
                      <FiCopy />
                    </button>
                    <button
                      onClick={handleDownloadContent}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-colors"
                      title="Download as Markdown"
                    >
                      <FiDownload />
                    </button>
                    <button
                      onClick={() => setShowTitleEdit(!showTitleEdit)}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-colors"
                      title="Save content"
                    >
                      <FiSave />
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {/* Save Dialog */}
            {showTitleEdit && (
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-800/50">
                <div className="flex items-center">
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    placeholder="Enter a title for your saved analysis"
                    className="flex-1 p-2 border rounded-md mr-2 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    onClick={handleSaveContent}
                    className="p-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setShowTitleEdit(false)}
                    className="p-2 ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <FiX />
                  </button>
                </div>
              </div>
            )}
            
            {/* Content Area */}
            <div className="p-6">
              {detectionResult ? (
                renderDetectionResult()
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center text-center py-16"
                >
                  <div className="h-20 w-20 rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 bg-opacity-10 flex items-center justify-center mb-4">
                    <FiShield className="h-10 w-10 text-indigo-500 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Detection Results Yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
                    Paste any text to analyze whether it was written by AI or a human. Our advanced detection tool provides detailed analysis.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-xl">
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setText('Analyze this content for AI generation')}
                      className="cursor-pointer p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 text-left border border-purple-200 dark:border-purple-800"
                    >
                      <div className="flex items-center text-purple-500 dark:text-purple-400 mb-1 text-sm font-medium">
                        <FiPlus className="mr-1.5" />
                        <span>General Analysis</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Analyze content for AI generation</p>
                    </motion.div>
                    
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setText('Is this text written by AI or human?')}
                      className="cursor-pointer p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-left border border-indigo-200 dark:border-indigo-800"
                    >
                      <div className="flex items-center text-indigo-500 dark:text-indigo-400 mb-1 text-sm font-medium">
                        <FiPlus className="mr-1.5" />
                        <span>Source Detection</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">AI or human-written text?</p>
                    </motion.div>
                    
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setText('Check if this essay is AI-generated')}
                      className="cursor-pointer p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-left border border-blue-200 dark:border-blue-800"
                    >
                      <div className="flex items-center text-blue-500 dark:text-blue-400 mb-1 text-sm font-medium">
                        <FiPlus className="mr-1.5" />
                        <span>Academic Check</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Check if essay is AI-generated</p>
                    </motion.div>
                    
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setText('Detect AI in this product review')}
                      className="cursor-pointer p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-900/30 text-left border border-teal-200 dark:border-teal-800"
                    >
                      <div className="flex items-center text-teal-500 dark:text-teal-400 mb-1 text-sm font-medium">
                        <FiPlus className="mr-1.5" />
                        <span>Review Check</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Detect AI in product reviews</p>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Saved Content */}
      {savedContents.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200 flex items-center">
            <FiSave className="mr-2" />
            Saved Analyses
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedContents.map((saved) => (
              <motion.div 
                key={saved.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-800 dark:text-gray-200">{saved.title}</h3>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleLoadSaved(saved.content)}
                      className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      title="Load"
                    >
                      <FiEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSaved(saved.id)}
                      className="p-1.5 rounded-md text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      title="Delete"
                    >
                      <FiTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center mt-1 mb-2">
                  {saved.result.score >= 0.8 ? (
                    <div className="py-1 px-2 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium flex items-center">
                      <FiAlertTriangle className="mr-1" /> 
                      <span>{Math.round(saved.result.score * 100)}% AI</span>
                    </div>
                  ) : saved.result.score >= 0.5 ? (
                    <div className="py-1 px-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 text-xs font-medium flex items-center">
                      <FiAlertTriangle className="mr-1" />
                      <span>{Math.round(saved.result.score * 100)}% AI</span>
                    </div>
                  ) : (
                    <div className="py-1 px-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-medium flex items-center">
                      <FiCheckCircle className="mr-1" />
                      <span>{Math.round(saved.result.score * 100)}% AI</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3">
                  {saved.result.summary}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DetectAIPage; 
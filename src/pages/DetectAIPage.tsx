import React, { useState, useRef, useEffect } from 'react';
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
  FiX,
  FiClock,
  FiMessageCircle
} from 'react-icons/fi';
import { ProFeatureAlert } from '../components';
import { useUser } from '../context/UserContext';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import './ContentWriterPage.css';

const DetectAIPage: React.FC = () => {
  const { userData, isPro } = useUser();
  const { t } = useTranslation();
  const { darkMode } = useTheme();
  
  // Add gradient animation style to document head
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes gradient-x {
        0% {
          background-position: 0% 50%;
        }
        50% {
          background-position: 100% 50%;
        }
        100% {
          background-position: 0% 50%;
        }
      }
      .animate-gradient-x {
        background-size: 200% 200%;
        animation: gradient-x 15s ease infinite;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const [text, setText] = useState('');
  const [detectionResult, setDetectionResult] = useState<{
    isAIGenerated: boolean;
    score: number;
    analysis: string;
    summary: string;
    id?: string;
    fake_percentage?: number;
    ai_words?: number;
    text_words?: number;
    sentences?: string[];
    tags?: string[];
    language?: string;
    createdAt?: string;
    other_feedback?: string | null;
  } | null>(null);
  const [sensitivity, setSensitivity] = useState('balanced');
  const [isProcessing, setIsProcessing] = useState(false);
  const [savedContents, setSavedContents] = useState<{id: string, title: string, text: string, is_human: boolean, fake_percentage: number, ai_words: number, text_words: number, sentences: string[], tags: string[], language: string, createdAt: string, other_feedback: string | null}[]>([]);
  const [editingTitle, setEditingTitle] = useState('');
  const [showTitleEdit, setShowTitleEdit] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProAlert, setShowProAlert] = useState(false);
  const [freeDetectionsLeft, setFreeDetectionsLeft] = useState(1);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<string[]>([
    t('detectAI.analyzeContent'),
    t('detectAI.historyItems.isThisAI'),
    t('detectAI.historyItems.checkEssay'),
    t('detectAI.historyItems.detectReview')
  ]);
  
  // Fetch user's detection history
  const fetchUserDetections = async () => {
    if (!userData?.uid) return;
    
    try {
      const response = await axios.get(
        'http://localhost:3002/api/detection/getUserDetections',
        {
          params: {
            uid: userData.uid,
            page: 1,
            itemsPerPage: 10
          }
        }
      );
      
      if (response.data && response.data.detections) {
        setSavedContents(response.data.detections);
      }
    } catch (error) {
      console.error('Error fetching detection history:', error);
    }
  };
  
  // Delete a detection from history
  const deleteDetection = async (detectionId: string) => {
    if (!userData?.uid) return;
    
    try {
      await axios.delete(
        'http://localhost:3002/api/detection/deleteDetection',
        {
          data: {
            uid: userData.uid,
            detectionId
          }
        }
      );
      
      // Remove from local state
      setSavedContents(prev => prev.filter(item => item.id !== detectionId));
    } catch (error) {
      console.error('Error deleting detection:', error);
    }
  };

  // Load history when component mounts
  useEffect(() => {
    if (userData?.uid) {
      fetchUserDetections();
    }
  }, [userData?.uid]);

  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Sensitivity levels
  const sensitivityOptions = [
    { id: 'low', name: t('low') },
    { id: 'balanced', name: t('balanced') },
    { id: 'high', name: t('high') },
    { id: 'very-high', name: t('veryHigh') },
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
      const requestPayload = {
        uid: userData?.uid || '0a147ebe-af99-481b-bcaf-ae70c9aeb8d8', // Use default UID if not available
        text: text,
        title: `Detection: ${text.substring(0, 30)}${text.length > 30 ? '...' : ''}`,
        tags: ['web-app'],
        language: 'en'
      };
      
      // Make API request to the new detection API
      const response = await axios.post(
        'http://localhost:3002/api/detection/createDetection',
        requestPayload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Set the detection result from API response
      if (response.data && response.data.detection) {
        const detection = response.data.detection;
        setDetectionResult({
          id: detection.id,
          isAIGenerated: !detection.is_human,
          score: detection.fake_percentage / 100, // Convert percentage to decimal
          analysis: `## AI Detection Results\n\n**Text Analysis:**\n\nThis text contains ${detection.ai_words} AI-generated words out of ${detection.text_words} total words (${detection.fake_percentage}% AI probability).\n\n**Sentence Breakdown:**\n\n${detection.sentences.map((sentence: string, index: number) => `${index + 1}. ${sentence}`).join('\n\n')}`,
          summary: detection.is_human ? t('detectAI.summary.humanWritten') : t('detectAI.summary.aiGenerated'),
          fake_percentage: detection.fake_percentage,
          ai_words: detection.ai_words,
          text_words: detection.text_words,
          sentences: detection.sentences,
          tags: detection.tags,
          language: detection.language,
          createdAt: detection.createdAt,
          other_feedback: detection.other_feedback
        });
        
        // Show appropriate toast notification based on AI probability
        if (detection.fake_percentage > 80) {
          toast.error(
            <div>
              <div>{t('detectAI.probability.high')}</div>
              <button 
                onClick={() => {
                  // Store the text in localStorage
                  localStorage.setItem('transferToContentWriter', text);
                  // Navigate to Content Writer tab in parent component
                  window.dispatchEvent(new CustomEvent('switchToContentWriter'));
                }}
                className="mt-2 px-3 py-1 bg-blue-500 text-white rounded-md text-sm flex items-center"
              >
                <FiFileText className="mr-1" /> {t('detectAI.useInContentWriter')}
              </button>
            </div>
          );
        } else if (detection.fake_percentage > 40) {
          toast(
            <div>
              <div>{t('detectAI.probability.medium')}</div>
              <button 
                onClick={() => {
                  // Store the text in localStorage
                  localStorage.setItem('transferToContentWriter', text);
                  // Navigate to Content Writer tab in parent component
                  window.dispatchEvent(new CustomEvent('switchToContentWriter'));
                }}
                className="mt-2 px-3 py-1 bg-blue-500 text-white rounded-md text-sm flex items-center"
              >
                <FiFileText className="mr-1" /> {t('detectAI.useInContentWriter')}
              </button>
            </div>,
            {
              icon: <FiAlertTriangle className="text-yellow-500" />,
              style: {
                backgroundColor: '#FFFBEB',
                color: '#92400E'
              }
            }
          );
        } else {
          toast.success(
            <div>
              <div>{t('detectAI.probability.low')}</div>
              <button 
                onClick={() => {
                  // Store the text in localStorage
                  localStorage.setItem('transferToContentWriter', text);
                  // Navigate to Content Writer tab in parent component
                  window.dispatchEvent(new CustomEvent('switchToContentWriter'));
                }}
                className="mt-2 px-3 py-1 bg-blue-500 text-white rounded-md text-sm flex items-center"
              >
                <FiFileText className="mr-1" /> {t('detectAI.useInContentWriter')}
              </button>
            </div>
          );
        }
        
        // Toast notifications are now handled with the custom buttons above
        
        // Refresh history to include the new item
        fetchUserDetections();
      }
      
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
    let title = t('detectAI.result');
    
    if (text.length > 30) {
      title = `${t('detectAI.result')}: ${text.substring(0, 30)}...`;
    } else if (text.length > 0) {
      title = `${t('detectAI.result')}: ${text}`;
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
    
    toast.success(
      <div>
        <div>{t('common.copied') || 'Content copied to clipboard'}</div>
        <button 
          onClick={() => {
            // Store the text in localStorage
            localStorage.setItem('transferToContentWriter', text);
            // Navigate to Content Writer tab in parent component
            window.dispatchEvent(new CustomEvent('switchToContentWriter'));
          }}
          className="mt-2 px-3 py-1 bg-blue-500 text-white rounded-md text-sm flex items-center"
        >
          <FiFileText className="mr-1" /> {t('detectAI.useInContentWriter')}
        </button>
      </div>
    );
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
    
    // No need to manually save as the API already saves the detection
    // Just close the title edit dialog
    setShowTitleEdit(false);
    setEditingTitle('');
  };

  const handleDeleteSaved = (id: string) => {
    deleteDetection(id);
  };

  const handleLoadSaved = (savedItem: any) => {
    setText(savedItem.text);
    
    // Also set the detection result
    setDetectionResult({
      id: savedItem.id,
      isAIGenerated: !savedItem.is_human,
      score: savedItem.fake_percentage / 100, // Convert percentage to decimal
      analysis: `## AI Detection Results\n\n**Text Analysis:**\n\nThis text contains ${savedItem.ai_words} AI-generated words out of ${savedItem.text_words} total words (${savedItem.fake_percentage}% AI probability).\n\n**Sentence Breakdown:**\n\n${savedItem.sentences.map((sentence: string, index: number) => `${index + 1}. ${sentence}`).join('\n\n')}`,
      summary: savedItem.is_human ? t('detectAI.summary.humanWritten') : t('detectAI.summary.aiGenerated'),
      fake_percentage: savedItem.fake_percentage,
       ai_words: savedItem.ai_words,
       text_words: savedItem.text_words,
       sentences: savedItem.sentences,
       tags: savedItem.tags,
       language: savedItem.language,
       createdAt: savedItem.createdAt,
       other_feedback: savedItem.other_feedback
    });
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
                    y="50" 
                    textAnchor="middle" 
                    fontSize="10" 
                    fill="#6b7280"
                    className="dark:fill-gray-400"
                  >
                    {t('detectAI.aiProbability')}
                  </text>
                </svg>
              </div>
              
              <div className="text-center mt-4">
                <div className="flex justify-center gap-2 mb-2">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    {t('detectAI.ranges.human')}
                  </span>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                    {t('detectAI.ranges.mixed')}
                  </span>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                    {t('detectAI.ranges.ai')}
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
            {t('detectAI.detailedAnalysis')}
          </h3>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>
              {detectionResult.analysis}
            </ReactMarkdown>
          </div>
          
          {detectionResult.other_feedback && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-medium mb-3 flex items-center">
                <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 p-1 rounded-md mr-2">
                  <FiMessageCircle className="w-4 h-4" />
                </span>
                {t('detectAI.additionalFeedback')}
              </h4>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>
                  {detectionResult.other_feedback}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
     
      <div className="container mx-auto max-w-6xl flex-1 p-4 md:p-6 relative z-10">
      {showProAlert && (
        <ProFeatureAlert 
          featureName={t('detectAI.title')}
          onClose={() => setShowProAlert(false)}
        />
      )}
      
   

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Text Input Form */}
        <div className="lg:col-span-2 order-2 lg:order-1">
          <div className="sticky top-6 space-y-6">
            {/* Text Input */}
            <div className="glass-effect bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-medium mb-4 flex items-center">
                <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 p-1.5 rounded-md mr-2">
                  <FiShield className="w-5 h-5" />
                </span>
                {t('detectAI.detectAction')}
              </h2>
              
              <div className="space-y-4">
                <div className="flex-1">
                  <div className="relative">
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder={t('detectAI.placeholder')}
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
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t('detectAI.sensitivity')}</label>
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
                              {option.id === 'low' && t('detectAI.sensitivityLevels.low')}
                              {option.id === 'balanced' && t('detectAI.sensitivityLevels.balanced')}
                              {option.id === 'high' && t('detectAI.sensitivityLevels.high')}
                              {option.id === 'very-high' && t('detectAI.sensitivityLevels.veryHigh')}
                            </button>
                          ))}
                        </div>
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          {sensitivity === 'low' && t('detectAI.sensitivityDescriptions.low')}
                          {sensitivity === 'balanced' && t('detectAI.sensitivityDescriptions.balanced')}
                          {sensitivity === 'high' && t('detectAI.sensitivityDescriptions.high')}
                          {sensitivity === 'very-high' && t('detectAI.sensitivityDescriptions.veryHigh')}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
                
                <div className="w-full bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3 text-xs text-gray-700 dark:text-gray-300 border border-indigo-100 dark:border-indigo-800/50">
                  <div className="flex items-start">
                    <FiAlertTriangle className="text-indigo-500 dark:text-indigo-400 mt-0.5 mr-2 flex-shrink-0" />
                    <span>{t('detectAI.bestResultsTip')}</span>
                  </div>
                </div>
                
                {history.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t('humanizeText.recent')}</h3>
                    <div className="flex flex-wrap gap-2">
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mr-1">
                        <FiClock className="mr-1" /> {t('common.showHistory')}:
                      </div>
                      {history.map((item, index) => (
                        <button
                          key={index}
                          className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-all hover:scale-105 text-gray-800 dark:text-gray-200"
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
                    : 'bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 text-white hover:shadow-md animate-gradient-x hover:scale-105'
                }`}
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('detectAI.analyzing')}
                  </>
                ) : (
                  <>
                    {t('detectAI.detectAction')}
                    <FiShield className="ml-2" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Output */}
        <div className="lg:col-span-3 order-1 lg:order-2">
          <div className="glass-effect bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
            {/* Content Header */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-b border-indigo-100 dark:border-indigo-800/50 p-4 flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 flex items-center justify-center text-white mr-2">
                  <FiPieChart className="w-4 h-4" />
                </div>
                <h2 className="font-medium">{detectionResult ? getContentTitle() : t('detectAI.result')}</h2>
              </div>
              
              <div className="flex space-x-1">
                {detectionResult && (
                  <>
                    <button
                      onClick={handleCopyContent}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-all hover:scale-105"
                      title="Copy to clipboard"
                    >
                      <FiCopy />
                    </button>
                    <button
                      onClick={handleDownloadContent}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-all hover:scale-105"
                      title="Download as Markdown"
                    >
                      <FiDownload />
                    </button>
                    <button
                      onClick={() => setShowTitleEdit(!showTitleEdit)}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-all hover:scale-105"
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
                        placeholder={t('detectAI.enterTitlePlaceholder')}
                        className="flex-1 p-2 border rounded-md mr-2 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                  <button
                    onClick={handleSaveContent}
                    className="p-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors"
                  >
                    {t('common.save')}
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
                  <div className="h-24 w-24 rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 bg-opacity-10 flex items-center justify-center mb-4 animate-gradient-x">
                    <FiShield className="h-12 w-12 text-indigo-500 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-3">{t('detectAI.empty')}</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
                    {t('detectAI.emptyDesc')}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-xl">
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setText(t('detectAI.quickPrompts.generalAnalysis'))}
                      className="cursor-pointer p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 text-left border border-purple-200 dark:border-purple-800"
                    >
                      <div className="flex items-center text-purple-500 dark:text-purple-400 mb-1 text-sm font-medium">
                        <FiPlus className="mr-1.5" />
                        <span>{t('detectAI.quickPrompts.generalAnalysisTitle')}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{t('detectAI.quickPrompts.generalAnalysisDesc')}</p>
                    </motion.div>
                    
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setText(t('detectAI.quickPrompts.sourceDetection'))}
                      className="cursor-pointer p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-left border border-indigo-200 dark:border-indigo-800"
                    >
                      <div className="flex items-center text-indigo-500 dark:text-indigo-400 mb-1 text-sm font-medium">
                        <FiPlus className="mr-1.5" />
                        <span>{t('detectAI.quickPrompts.sourceDetectionTitle')}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{t('detectAI.quickPrompts.sourceDetectionDesc')}</p>
                    </motion.div>
                    
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setText(t('detectAI.quickPrompts.academicCheck'))}
                      className="cursor-pointer p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-left border border-blue-200 dark:border-blue-800"
                    >
                      <div className="flex items-center text-blue-500 dark:text-blue-400 mb-1 text-sm font-medium">
                        <FiPlus className="mr-1.5" />
                        <span>{t('detectAI.quickPrompts.academicCheckTitle')}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{t('detectAI.quickPrompts.academicCheckDesc')}</p>
                    </motion.div>
                    
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setText(t('detectAI.quickPrompts.reviewCheck'))}
                      className="cursor-pointer p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-900/30 text-left border border-teal-200 dark:border-teal-800"
                    >
                      <div className="flex items-center text-teal-500 dark:text-teal-400 mb-1 text-sm font-medium">
                        <FiPlus className="mr-1.5" />
                        <span>{t('detectAI.quickPrompts.reviewCheckTitle')}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{t('detectAI.quickPrompts.reviewCheckDesc')}</p>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detection History */}
      <div className="mt-10">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800/40 transition-colors mb-4"
        >
          <FiSave className="mr-2 text-indigo-500 dark:text-indigo-400" />
          {showHistory ? t('common.hideHistory') || 'Hide History' : t('detectAI.history')}
        </button>
        
        {showHistory && (
          <div>
            {savedContents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedContents.map((saved) => (
              <motion.div 
                key={saved.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="glass-effect p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-800 dark:text-gray-200">{saved.title}</h3>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleLoadSaved(saved)}
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
                  {saved.fake_percentage >= 80 ? (
                    <div className="py-1 px-2 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium flex items-center">
                      <FiAlertTriangle className="mr-1" /> 
                      <span>{saved.fake_percentage}% AI</span>
                    </div>
                  ) : saved.fake_percentage >= 50 ? (
                    <div className="py-1 px-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 text-xs font-medium flex items-center">
                      <FiAlertTriangle className="mr-1" />
                      <span>{saved.fake_percentage}% AI</span>
                    </div>
                  ) : (
                    <div className="py-1 px-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-medium flex items-center">
                      <FiCheckCircle className="mr-1" />
                      <span>{saved.fake_percentage}% AI</span>
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {new Date(saved.createdAt).toLocaleDateString()}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3">
                  {saved.text}
                </p>
              </motion.div>
            ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">{t('detectAI.noHistory')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

export default DetectAIPage;
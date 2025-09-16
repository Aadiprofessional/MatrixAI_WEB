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
  FiList,
  FiUser,
  FiMessageSquare,
  FiFileText,
  FiSliders,
  FiRotateCw,
  FiX,
  FiGrid,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import { AuthRequiredButton, ProFeatureAlert } from '../components';
import { useUser } from '../context/UserContext';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import axios from '../utils/axiosInterceptor';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import './ContentWriterPage.css';
import '../styles/CommonStyles.css';
import coinImage from '../assets/coin.png';

// Gradient animation style is now in CommonStyles.css

const HumaniseTextPage: React.FC = () => {
  const { userData, isPro } = useUser();
  const { t } = useTranslation();
  const { darkMode } = useTheme();
  const [text, setText] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [humanisedText, setHumanisedText] = useState('');
  const [tone, setTone] = useState('Standard');
  const [mode, setMode] = useState('Medium');
  const [isProcessing, setIsProcessing] = useState(false);
  const [savedContents, setSavedContents] = useState<{id: string, title: string, content: string}[]>([]);
  const [editingTitle, setEditingTitle] = useState('');
  const [showTitleEdit, setShowTitleEdit] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProAlert, setShowProAlert] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<{id: string, title: string, original_text: string, humanized_text: string, createdAt: string, tone?: string, mode?: string, detector?: string, coinCost?: number}[]>([]);
  const [detector, setDetector] = useState('turnitin');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const itemsPerPage = 6;

  const contentRef = useRef<HTMLTextAreaElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  // StealthGPT Tone options
  const toneOptions = [
    { id: 'Standard', name: 'Standard' },
    { id: 'HighSchool', name: 'High School' },
    { id: 'College', name: 'College' },
    { id: 'PhD', name: 'PhD' },
  ];

  // StealthGPT Mode options (Undetectability levels)
  const modeOptions = [
    { id: 'Low', name: 'Low' },
    { id: 'Medium', name: 'Medium' },
    { id: 'High', name: 'High' },
  ];

  // StealthGPT Detector options
  const detectorOptions = [
    { id: 'turnitin', name: 'Turnitin' },
    { id: 'originality', name: 'Originality.ai' },
    { id: 'gptzero', name: 'GPTZero' },
    { id: 'copyleaks', name: 'CopyLeaks' },
    { id: 'winston', name: 'Winston AI' },
    { id: 'zerogpt', name: 'ZeroGPT' },
    { id: 'sapling', name: 'Sapling.ai' },
    { id: 'writer', name: 'Writer.com' },
  ];

  // Fetch user's humanization history
  const fetchUserHumanizations = async () => {
    if (!userData?.uid) return;
    
    setIsLoadingHistory(true);
    
    try {
      const response = await axios.get(
        'https://main-matrixai-server-lujmidrakh.cn-hangzhou.fcapp.run/api/humanize/getUserHumanizations',
        {
          params: {
            uid: userData.uid,
            page: 1,
            itemsPerPage: 10
          }
        }
      );
      
      if (response.data && response.data.humanizations) {
        // Sort humanizations by creation date (most recent first)
        const sortedHumanizations = response.data.humanizations.sort((a: any, b: any) => {
          const dateA = new Date(a.created_at || a.createdAt || '').getTime();
          const dateB = new Date(b.created_at || b.createdAt || '').getTime();
          return dateB - dateA; // Most recent first
        });
        
        setHistory(sortedHumanizations);
      }
    } catch (error) {
      console.error('Error fetching humanization history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };
  
  // Delete a humanization from history
  const deleteHumanization = async (humanizationId: string) => {
    if (!userData?.uid) return;
    
    try {
      await axios.delete(
        'https://main-matrixai-server-lujmidrakh.cn-hangzhou.fcapp.run/api/humanize/deleteHumanization',
        {
          data: {
            uid: userData.uid,
            humanizationId
          }
        }
      );
      
      // Remove from local state
      setHistory(prev => prev.filter(item => item.id !== humanizationId));
    } catch (error) {
      console.error('Error deleting humanization:', error);
    }
  };

  // Load history when component mounts
  useEffect(() => {
    if (userData?.uid) {
      fetchUserHumanizations();
    }
  }, [userData?.uid]);

  const handleTextChange = (value: string) => {
    const words = value.trim().split(/\s+/).filter(word => word.length > 0);
    const currentWordCount = value.trim() === '' ? 0 : words.length;
    
    if (currentWordCount <= 2000) {
      setText(value);
      setWordCount(currentWordCount);
    } else {
      // Truncate to 2000 words
      const truncatedWords = words.slice(0, 2000);
      const truncatedText = truncatedWords.join(' ');
      setText(truncatedText);
      setWordCount(2000);
    }
  };

  const handleHumaniseText = async () => {
    if (!userData?.uid) return;
    if (!text.trim()) return;
    
    // If user is not pro and has insufficient coins, show charge modal
    if (!isPro && (!userData?.coins || userData.coins < 1)) {
      setShowProAlert(true);
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Create request payload with StealthGPT API format
      const requestPayload = {
        uid: userData?.uid || '0a147ebe-af99-481b-bcaf-ae70c9aeb8d8',
        prompt: text,
        title: `Humanized Text - ${new Date().toLocaleDateString()}`,
        tone: tone,
        mode: mode,
        detector: detector
      };
      
      // Make API request to the new StealthGPT humanization API
      const response = await axios.post(
        'https://main-matrixai-server-lujmidrakh.cn-hangzhou.fcapp.run/api/humanize/createHumanization',
        requestPayload,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Set the humanised text from API response
      if (response.data && response.data.humanization) {
        const humanization = response.data.humanization;
        setHumanisedText(humanization.humanized_text);
        
        // Refresh history to include the new item
        fetchUserHumanizations();
        
        // Show success toast notification with humanization details
        toast.success(
          <div>
            <div className="font-medium">Text Successfully Humanized!</div>
            <div className="text-sm mt-1 space-y-1">
              <div>Tone: {humanization.tone || tone}</div>
              <div>Mode: {humanization.mode || mode}</div>
              <div>Detector: {humanization.detector || detector}</div>
              <div>Cost: {humanization.coinCost || 40} coins</div>
            </div>
            <button 
              onClick={() => {
                localStorage.setItem('transferToContentWriter', humanization.humanized_text);
                window.dispatchEvent(new CustomEvent('switchToContentWriter'));
              }}
              className="mt-2 px-3 py-1 bg-blue-500 text-white rounded-md text-sm flex items-center"
            >
              <FiFileText className="mr-1" /> Use in Content Writer
            </button>
          </div>
        );
      }
      
      // Coin deduction will be handled by the backend
    } catch (error) {
      console.error('Error humanising text:', error);
      setHumanisedText(t('humanizeText.errors.humanizingError'));
      toast.error(t('humanizeText.errors.failedToHumanize'));
    } finally {
      setIsProcessing(false);
    }
  };

  const getContentTitle = () => {
    let title = t('humanizeText.result');
    
    if (text.length > 30) {
      title = `${t('humanizeText.result')}: ${text.substring(0, 30)}...`;
    } else if (text.length > 0) {
      title = `${t('humanizeText.result')}: ${text}`;
    }
    
    return title;
  };

  const handleCopyContent = () => {
    navigator.clipboard.writeText(humanisedText);
    toast.success(
      <div>
        <div className="font-medium">Text Copied to Clipboard!</div>
        <div className="text-sm mt-1">Humanized content is ready to use</div>
        <button 
          onClick={() => {
            localStorage.setItem('transferToContentWriter', humanisedText);
            window.dispatchEvent(new CustomEvent('switchToContentWriter'));
          }}
          className="mt-2 px-3 py-1 bg-blue-500 text-white rounded-md text-sm flex items-center"
        >
          <FiFileText className="mr-1" /> Use in Content Writer
        </button>
      </div>
    );
  };

  const handleDownloadContent = () => {
    const element = document.createElement('a');
    const file = new Blob([humanisedText], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = `${getContentTitle()}.md`.replace(/[^a-z0-9\s-]/gi, '').replace(/\s+/g, '-').toLowerCase();
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSaveContent = () => {
    const title = editingTitle || getContentTitle();
    
    setSavedContents(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        title,
        content: humanisedText
      }
    ]);
    
    setShowTitleEdit(false);
    setEditingTitle('');
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setHumanisedText(e.target.value);
  };

  const handleDeleteSaved = (id: string) => {
    setSavedContents(prev => prev.filter(item => item.id !== id));
  };

  const handleLoadSaved = (content: string) => {
    setHumanisedText(content);
  };

  return (
    <div className="relative overflow-hidden">
     
      <div className="container mx-auto max-w-6xl flex-1 md:p-6 relative z-10">
      {showProAlert && (
        <ProFeatureAlert
          featureName="Text Humanizer"
          onClose={() => setShowProAlert(false)}
        />
      )}
      
   

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-8  sm:px-2 py-2 sm:py-4">
        {/* Text Input Form */}
        <div className="lg:col-span-2 order-1 lg:order-1">
          <div className="sticky top-6 space-y-6">
            {/* Text Input */}
            <div className="rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow glass-effect">
              <h2 className="text-xl font-medium mb-4 flex items-center">
                <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-1.5 rounded-md mr-2">
                  <FiFileText className="w-5 h-5" />
                </span>
                {t('humanizeText.title')}
              </h2>
              
              <div className="space-y-4">
                <div className="flex-1">
                  <div className="relative">
                    <textarea
                      value={text}
                      onChange={(e) => handleTextChange(e.target.value)}
                      onFocus={() => setShowSettings(true)}
                      placeholder={t('humanizeText.placeholder')}
                      className="w-full p-4 pr-12 border rounded-lg shadow-sm h-56 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                    <div className="absolute bottom-2 right-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className={wordCount > 2000 ? 'text-red-500' : ''}>
                        {wordCount}/2000 words
                      </span>
                    </div>
                  </div>
                  {wordCount > 2000 && (
                    <p className="text-red-500 text-xs mt-1">Word limit exceeded. Text has been truncated to 2000 words.</p>
                  )}
                </div>
                
                <AuthRequiredButton
                  onClick={handleHumaniseText}
                  disabled={!text.trim() || isProcessing}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                    !text.trim() || isProcessing
                      ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02] animate-gradient-x'
                  }`}
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center">
                      <FiRotateCw className="w-4 h-4 mr-2 animate-spin" />
                      {t('humanizeText.processing')}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <FiZap className="w-4 h-4 mr-2" />
                      {t('humanizeText.humanizeAction')}
                      <span className="ml-2 flex items-center text-yellow-300">
                        -40
                        <img src={coinImage} alt="coin" className="w-4 h-4 ml-1" />
                      </span>
                    </div>
                  )}
                </AuthRequiredButton>

                   <AuthRequiredButton
                  onClick={() => {
                    setShowHistory(!showHistory);
                    if (!showHistory) {
                      setTimeout(() => {
                        historyRef.current?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }
                  }}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all mt-4 ${
                    darkMode
                      ? 'bg-purple-900/30 text-purple-400 hover:bg-purple-900/50'
                      : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                  }`}
                >
                  <div className="flex items-center justify-center">
                    <FiFileText className="w-4 h-4 mr-2" />
                    {showHistory ? t('common.hideHistory') || 'Hide History' : t('contentWriter.history')}
                  </div>
                </AuthRequiredButton>
                
                {/* Settings panel */}
                {showSettings && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t pt-4 space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Writing Tone</label>
                      <select 
                        value={tone}
                        onChange={(e) => setTone(e.target.value)}
                        className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        disabled={isProcessing}
                      >
                        {toneOptions.map(option => (
                          <option key={option.id} value={option.id}>{option.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Undetectability Mode</label>
                      <select 
                        value={mode}
                        onChange={(e) => setMode(e.target.value)}
                        className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        disabled={isProcessing}
                      >
                        {modeOptions.map(option => (
                          <option key={option.id} value={option.id}>{option.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">AI Detector Target</label>
                      <select 
                        value={detector}
                        onChange={(e) => setDetector(e.target.value)}
                        className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        disabled={isProcessing}
                      >
                        {detectorOptions.map(option => (
                          <option key={option.id} value={option.id}>{option.name}</option>
                        ))}
                      </select>
                    </div>
                  </motion.div>
                )}
                
              
              </div>
            </div>
          </div>
        </div>

        {/* Output Section */}
        <div className="lg:col-span-3 order-2 lg:order-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden glass-effect">
            {/* Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 flex items-center">
                  <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-1.5 rounded-md mr-2">
                    <FiUser className="w-5 h-5" />
                  </span>
                  {t('humanizeText.result')}
                </h3>
                {humanisedText && (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleCopyContent}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-all hover:scale-105 flex items-center text-sm"
                    >
                      <FiCopy className="w-4 h-4 mr-1" />
                      {t('common.copy')}
                    </button>
                    <button
                      onClick={handleDownloadContent}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-all hover:scale-105 flex items-center text-sm"
                    >
                      <FiDownload className="w-4 h-4 mr-1" />
                      {t('common.download')}
                    </button>
                    <button
                      onClick={handleSaveContent}
                      className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-md hover:bg-green-200 dark:hover:bg-green-900/50 transition-all hover:scale-105 flex items-center text-sm"
                    >
                      <FiSave className="w-4 h-4 mr-1" />
                      {t('common.save')}
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6">
              {humanisedText ? (
                <div className={`w-full ${showHistory ? 'min-h-[400px]' : 'min-h-[600px]'}`}>
                  {/* Humanization Details */}
                  <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tone</div>
                      <div className="text-gray-800 dark:text-gray-200 font-medium">{tone}</div>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Mode</div>
                      <div className="text-gray-800 dark:text-gray-200 font-medium">{mode}</div>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Detector</div>
                      <div className="text-gray-800 dark:text-gray-200 font-medium">{detector}</div>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Cost</div>
                      <div className="text-gray-800 dark:text-gray-200 font-medium flex items-center">
                        40 <img src={coinImage} alt="coin" className="w-4 h-4 ml-1" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="prose prose-sm max-w-none dark:prose-invert mb-4 markdown-content">
                    <ReactMarkdown>
                      {humanisedText}
                    </ReactMarkdown>
                  </div>
                  <textarea
                    ref={contentRef}
                    value={humanisedText}
                    onChange={handleContentChange}
                    className={`w-full ${showHistory ? 'min-h-[400px]' : 'min-h-[600px]'} p-0 border-0 focus:ring-0 dark:bg-gray-800 dark:text-gray-200 font-mono text-sm resize-none hidden`}
                    spellCheck="false"
                  />
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center text-center py-16"
                >
                  <div className="h-24 w-24 rounded-full bg-gradient-to-r from-green-500 via-teal-500 to-blue-500 bg-opacity-10 flex items-center justify-center mb-6 animate-gradient-x">
                    <FiUser className="h-12 w-12 text-green-500 dark:text-green-400" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-800 dark:text-gray-100 mb-3">{t('humanizeText.empty')}</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
                    {t('humanizeText.emptyDesc')}
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Saved Content */}
      {savedContents.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-4 flex items-center">
            <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-1.5 rounded-md mr-2">
              <FiSave className="w-5 h-5" />
            </span>
            {t('common.saved')} {t('humanizeText.result')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedContents.map((saved) => (
              <motion.div
                key={saved.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer glass-effect"
                onClick={() => handleLoadSaved(saved.content)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-800 dark:text-gray-100 line-clamp-2">
                    {saved.title}
                  </h4>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSaved(saved.id);
                    }}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <FiTrash className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3">
                  {saved.content}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      )}
      
      {/* History Button and History from API */}
      <div ref={historyRef} className="mt-8">
        {showHistory && (
          <div className="w-full px-4">
            {history.length > 0 ? (
              <div>
                {/* View Mode Toggle */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    {t('humanizeText.history') || 'Humanization History'}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400'
                          : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                      }`}
                    >
                      <FiGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === 'list'
                          ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400'
                          : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                      }`}
                    >
                      <FiList className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Grid View */}
                {viewMode === 'grid' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {history.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="glass-effect p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => {
                          setText(item.original_text);
                          setHumanisedText(item.humanized_text);
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-sm font-medium text-gray-800 dark:text-gray-100 line-clamp-2">
                            {item.title}
                          </h4>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteHumanization(item.id);
                            }}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <FiTrash className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3">
                          {item.humanized_text}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* List View */}
                {viewMode === 'list' && (
                  <div className="space-y-4">
                    {history.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-effect p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => {
                          setText(item.original_text);
                          setHumanisedText(item.humanized_text);
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-medium text-gray-800 dark:text-gray-100">
                                {item.title}
                              </h4>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(item.createdAt).toLocaleDateString()}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteHumanization(item.id);
                                  }}
                                  className="text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  <FiTrash className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                              {item.humanized_text}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {history.length > itemsPerPage && (
                  <div className="glass-effect p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm mt-6">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/70 dark:bg-gray-700/70 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-600 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
                      >
                        <FiChevronLeft className="w-4 h-4 mr-2" />
                        Previous
                      </button>
                      
                      <div className="flex items-center space-x-2">
                        <span className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/70 dark:bg-gray-700/70 rounded-lg border border-gray-300 dark:border-gray-600 backdrop-blur-sm">
                          Page {currentPage} of {Math.ceil(history.length / itemsPerPage)}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(history.length / itemsPerPage)))}
                        disabled={currentPage === Math.ceil(history.length / itemsPerPage)}
                        className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/70 dark:bg-gray-700/70 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-600 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
                      >
                        Next
                        <FiChevronRight className="w-4 h-4 ml-2" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400">{t('humanizeText.noHistory')}</p>
              </div>
            )}
          </div>
        )}
        

        
        {showHistory && isLoadingHistory && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
            <div className="flex items-center justify-center">
              <FiRotateCw className="w-5 h-5 mr-2 animate-spin text-gray-500 dark:text-gray-400" />
              <p className="text-gray-500 dark:text-gray-400">
                {t('common.loading') || 'Loading...'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

export default HumaniseTextPage;
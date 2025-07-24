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
  FiList,
  FiUser,
  FiMessageSquare,
  FiFileText,
  FiSliders,
  FiRotateCw,
  FiX
} from 'react-icons/fi';
import { ProFeatureAlert } from '../components';
import { useUser } from '../context/UserContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import './ContentWriterPage.css';

const HumaniseTextPage: React.FC = () => {
  const { userData, isPro } = useUser();
  const { t } = useLanguage();
  const { darkMode } = useTheme();
  const [text, setText] = useState('');
  const [humanisedText, setHumanisedText] = useState('');
  const [tone, setTone] = useState('casual');
  const [level, setLevel] = useState('medium');
  const [isProcessing, setIsProcessing] = useState(false);
  const [savedContents, setSavedContents] = useState<{id: string, title: string, content: string}[]>([]);
  const [editingTitle, setEditingTitle] = useState('');
  const [showTitleEdit, setShowTitleEdit] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProAlert, setShowProAlert] = useState(false);
  const [freeGenerationsLeft, setFreeGenerationsLeft] = useState(1);
  const [showComparison, setShowComparison] = useState(false);
  const [history, setHistory] = useState<string[]>([
    'Make this academic paper sound more conversational',
    'Humanize this technical documentation',
    'Make this formal email more friendly',
    'Rewrite this AI-generated text to sound more human'
  ]);

  const contentRef = useRef<HTMLTextAreaElement>(null);

  // Tone options
  const toneOptions = [
    { id: 'casual', name: t('common.casual') || 'Casual' },
    { id: 'friendly', name: t('common.friendly') || 'Friendly' },
    { id: 'conversational', name: t('common.conversational') || 'Conversational' },
    { id: 'professional', name: t('common.professional') || 'Professional' },
    { id: 'humorous', name: t('common.humorous') || 'Humorous' },
    { id: 'enthusiastic', name: t('common.enthusiastic') || 'Enthusiastic' },
    { id: 'thoughtful', name: t('common.thoughtful') || 'Thoughtful' },
    { id: 'simple', name: t('common.simple') || 'Simple' },
  ];

  // Humanisation levels
  const levelOptions = [
    { id: 'light', name: t('common.light') || 'Light Changes' },
    { id: 'medium', name: t('common.medium') || 'Medium Changes' },
    { id: 'heavy', name: t('common.heavy') || 'Significant Rewrite' },
    { id: 'creative', name: t('common.creative') || 'Creative Rewrite' },
  ];

  const handleHumaniseText = async () => {
    if (!text.trim()) return;
    
    // If user is not pro and has used all free generations, show pro alert
    if (!isPro && freeGenerationsLeft <= 0) {
      setShowProAlert(true);
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Create request payload with all settings
      const userMessageContent = {
        prompt: text,
        action: 'humanise',
        tone: tone,
        level: level
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
      
      // Set the humanised text from API response
      setHumanisedText(response.data.output.text);
      
      // Add to history if not already there
      if (!history.includes(text)) {
        setHistory(prev => [text, ...prev.slice(0, 3)]);
      }
      
      // Decrease free generations left if user is not pro
      if (!isPro) {
        setFreeGenerationsLeft(prev => prev - 1);
      }
    } catch (error) {
      console.error('Error humanising text:', error);
      setHumanisedText('Error humanising text. Please try again later.');
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
    // Could add a toast notification here
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
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-teal-50 to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 opacity-80"></div>
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] dark:opacity-[0.05]"></div>
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-br from-green-400/20 via-teal-400/20 to-blue-400/20 dark:from-green-900/20 dark:via-teal-900/20 dark:to-blue-900/20 blur-3xl rounded-full transform translate-x-1/3 -translate-y-1/4"></div>
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-green-400/20 via-teal-400/20 to-blue-400/20 dark:from-green-900/20 dark:via-teal-900/20 dark:to-blue-900/20 blur-3xl rounded-full transform -translate-x-1/3 translate-y-1/4"></div>
      <div className="container mx-auto max-w-6xl flex-1 p-0 relative z-10">
      {showProAlert && (
        <ProFeatureAlert 
          featureName={t('humanizeText.title')}
          onClose={() => setShowProAlert(false)}
        />
      )}
      
      <div className="mb-8">
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-green-500 via-teal-500 to-blue-500"
        >
          {t('humanizeText.title')}
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-500 dark:text-gray-400"
        >
          {t('humanizeText.subtitle')}
        </motion.p>
        
        {/* Added cool feature badges */}
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gradient-to-r from-green-400 to-teal-400 text-white">{t('humanizeText.badges.protection')}</span>
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gradient-to-r from-teal-400 to-blue-400 text-white">{t('humanizeText.badges.toneMatching')}</span>
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gradient-to-r from-blue-400 to-indigo-400 text-white">{t('humanizeText.badges.phrasing')}</span>
        </div>
        
        {!isPro && (
          <div className="mt-4 flex items-center text-sm text-yellow-600 dark:text-yellow-400">
            <FiFileText className="mr-1.5" />
            <span>{freeGenerationsLeft} {freeGenerationsLeft === 1 ? t('humanizeText.freeLeft') : t('humanizeText.freeLeftPlural')} left</span>
            {freeGenerationsLeft === 0 && (
              <button 
                onClick={() => setShowProAlert(true)}
                className="ml-2 text-blue-500 hover:text-blue-600 font-medium"
              >
                {t('humanizeText.upgradeText')}
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
                <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-1.5 rounded-md mr-2">
                  <FiFileText className="w-5 h-5" />
                </span>
                {t('humanizeText.humanizeAction')}
              </h2>
              
              <div className="space-y-4">
                <div className="flex-1">
                  <div className="relative">
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder={t('humanizeText.placeholder')}
                      className="w-full p-4 pr-12 border rounded-lg shadow-sm h-36 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                </div>
                
                <button
                  onClick={handleHumaniseText}
                  disabled={!text.trim() || isProcessing}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                    !text.trim() || isProcessing
                      ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
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
                    </div>
                  )}
                </button>
                
                {/* Settings panel */}
                {showSettings && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t pt-4 space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t('humanizeText.tone')}</label>
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
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t('humanizeText.level')}</label>
                      <select 
                        value={level}
                        onChange={(e) => setLevel(e.target.value)}
                        className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        disabled={isProcessing}
                      >
                        {levelOptions.map(option => (
                          <option key={option.id} value={option.id}>{option.name}</option>
                        ))}
                      </select>
                    </div>
                  </motion.div>
                )}
                
                {history.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t('humanizeText.recent')}</h3>
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
          </div>
        </div>

        {/* Output Section */}
        <div className="lg:col-span-3 order-1 lg:order-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                  <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-1.5 rounded-md mr-2">
                    <FiUser className="w-5 h-5" />
                  </span>
                  {t('humanizeText.result')}
                </h3>
                {humanisedText && (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleCopyContent}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center text-sm"
                    >
                      <FiCopy className="w-4 h-4 mr-1" />
                      {t('common.copy')}
                    </button>
                    <button
                      onClick={handleDownloadContent}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center text-sm"
                    >
                      <FiDownload className="w-4 h-4 mr-1" />
                      {t('common.download')}
                    </button>
                    <button
                      onClick={handleSaveContent}
                      className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-md hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors flex items-center text-sm"
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
                <div className="w-full min-h-[600px]">
                  <div className="prose prose-sm max-w-none dark:prose-invert mb-4 markdown-content">
                    <ReactMarkdown>
                      {humanisedText}
                    </ReactMarkdown>
                  </div>
                  <textarea
                    ref={contentRef}
                    value={humanisedText}
                    onChange={handleContentChange}
                    className="w-full min-h-[600px] p-0 border-0 focus:ring-0 dark:bg-gray-800 dark:text-gray-200 font-mono text-sm resize-none hidden"
                    spellCheck="false"
                  />
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center text-center py-16"
                >
                  <div className="h-20 w-20 rounded-full bg-gradient-to-r from-green-500 via-teal-500 to-blue-500 bg-opacity-10 flex items-center justify-center mb-4">
                    <FiUser className="h-10 w-10 text-green-500 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{t('humanizeText.empty')}</h3>
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
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <FiSave className="mr-2" />
            {t('common.saved')} {t('humanizeText.result')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedContents.map((saved) => (
              <motion.div
                key={saved.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleLoadSaved(saved.content)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
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
    </div>
    </div>
  );
};

export default HumaniseTextPage;
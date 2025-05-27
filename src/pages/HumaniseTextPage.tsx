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
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import './ContentWriterPage.css';

const HumaniseTextPage: React.FC = () => {
  const { userData, isPro } = useUser();
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
    { id: 'casual', name: 'Casual' },
    { id: 'friendly', name: 'Friendly' },
    { id: 'conversational', name: 'Conversational' },
    { id: 'professional', name: 'Professional' },
    { id: 'humorous', name: 'Humorous' },
    { id: 'enthusiastic', name: 'Enthusiastic' },
    { id: 'thoughtful', name: 'Thoughtful' },
    { id: 'simple', name: 'Simple' },
  ];

  // Humanisation levels
  const levelOptions = [
    { id: 'light', name: 'Light Changes' },
    { id: 'medium', name: 'Medium Changes' },
    { id: 'heavy', name: 'Significant Rewrite' },
    { id: 'creative', name: 'Creative Rewrite' },
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
    let title = 'Humanised Text';
    
    if (text.length > 30) {
      title = `Humanised: ${text.substring(0, 30)}...`;
    } else if (text.length > 0) {
      title = `Humanised: ${text}`;
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
    <div className="container mx-auto max-w-6xl p-4 py-8">
      {showProAlert && (
        <ProFeatureAlert 
          featureName="Advanced Text Humaniser"
          onClose={() => setShowProAlert(false)}
        />
      )}
      
      <div className="mb-8">
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-green-500 via-teal-500 to-blue-500"
        >
          AI Text Humaniser
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-500 dark:text-gray-400"
        >
          Transform AI-generated content into natural, human-like text
        </motion.p>
        
        {/* Added cool feature badges */}
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gradient-to-r from-green-400 to-teal-400 text-white">AI Detection Protection</span>
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gradient-to-r from-teal-400 to-blue-400 text-white">Tone Matching</span>
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gradient-to-r from-blue-400 to-indigo-400 text-white">Natural Phrasing</span>
        </div>
        
        {!isPro && (
          <div className="mt-4 flex items-center text-sm text-yellow-600 dark:text-yellow-400">
            <FiFileText className="mr-1.5" />
            <span>{freeGenerationsLeft} free humanisation{freeGenerationsLeft !== 1 ? 's' : ''} left</span>
            {freeGenerationsLeft === 0 && (
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
                <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-1.5 rounded-md mr-2">
                  <FiFileText className="w-5 h-5" />
                </span>
                Humanise Text
              </h2>
              
              <div className="space-y-4">
                <div className="flex-1">
                  <div className="relative">
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Paste AI-generated text here to make it sound more human..."
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

                  {showSettings && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 p-4 border rounded-lg shadow-sm bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Tone</label>
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
                          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Humanisation Level</label>
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
                      </div>
                    </motion.div>
                  )}
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
                onClick={handleHumaniseText}
                disabled={isProcessing || !text.trim()}
                className={`px-4 py-4 min-w-24 rounded-lg font-medium shadow-sm transition-all flex items-center justify-center ${
                  isProcessing || !text.trim()
                    ? 'bg-gray-300 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                    : 'bg-gradient-to-r from-green-500 via-teal-500 to-blue-500 text-white hover:shadow-md'
                }`}
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    Humanise Text
                    <FiUser className="ml-2" />
                  </>
                )}
              </button>
            </div>
            
            {/* Text Comparison Toggle - new feature */}
            {humanisedText && (
              <div className="flex justify-center mt-2">
                <button
                  onClick={() => setShowComparison(!showComparison)}
                  className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium flex items-center"
                >
                  {showComparison ? 'Hide Comparison' : 'Show Side-by-Side Comparison'}
                  <FiRotateCw className="ml-1" />
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Output */}
        <div className="lg:col-span-3 order-1 lg:order-2">
          {showComparison && humanisedText ? (
            <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
                <h2 className="font-medium">Before & After Comparison</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-700">
                <div className="p-4">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Original Text</div>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    {text}
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-sm font-medium text-green-500 dark:text-green-400 mb-2">Humanised Text</div>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    {humanisedText}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
            {/* Content Header */}
            <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 via-teal-500 to-blue-500 flex items-center justify-center text-white mr-2">
                  <FiUser className="w-4 h-4" />
                </div>
                <h2 className="font-medium">{humanisedText ? getContentTitle() : 'Humanised Text'}</h2>
              </div>
              
              <div className="flex space-x-1">
                {humanisedText && (
                  <>
                    <button
                      onClick={handleCopyContent}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                      title="Copy to clipboard"
                    >
                      <FiCopy />
                    </button>
                    <button
                      onClick={handleDownloadContent}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                      title="Download as Markdown"
                    >
                      <FiDownload />
                    </button>
                    <button
                      onClick={() => setShowTitleEdit(!showTitleEdit)}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                      title="Save content"
                    >
                      <FiSave />
                    </button>
                    <button
                      onClick={() => {
                        const textarea = contentRef.current;
                        if (textarea) {
                          textarea.classList.toggle('hidden');
                          const markdownPreview = textarea.previousElementSibling;
                          if (markdownPreview) markdownPreview.classList.toggle('hidden');
                        }
                      }}
                      className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                      title="Toggle edit mode"
                    >
                      <FiEdit />
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {/* Save Dialog */}
            {showTitleEdit && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
                <div className="flex items-center">
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    placeholder="Enter a title for your saved content"
                    className="flex-1 p-2 border rounded-md mr-2 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={handleSaveContent}
                    className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
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
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Text Humanised Yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
                    Paste AI-generated text and adjust humanisation settings to transform it into natural, human-like writing.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-xl">
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setText('Make this academic paper sound more conversational')}
                      className="cursor-pointer p-3 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 text-left border border-green-200 dark:border-green-800"
                    >
                      <div className="flex items-center text-green-500 dark:text-green-400 mb-1 text-sm font-medium">
                        <FiPlus className="mr-1.5" />
                        <span>Academic Paper</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Make it sound more conversational</p>
                    </motion.div>
                    
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setText('Humanize this technical documentation')}
                      className="cursor-pointer p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-left border border-blue-200 dark:border-blue-800"
                    >
                      <div className="flex items-center text-blue-500 dark:text-blue-400 mb-1 text-sm font-medium">
                        <FiPlus className="mr-1.5" />
                        <span>Technical Documentation</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Make it easier to understand</p>
                    </motion.div>
                    
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setText('Make this formal email more friendly')}
                      className="cursor-pointer p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-900/30 text-left border border-teal-200 dark:border-teal-800"
                    >
                      <div className="flex items-center text-teal-500 dark:text-teal-400 mb-1 text-sm font-medium">
                        <FiPlus className="mr-1.5" />
                        <span>Formal Email</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Make it more friendly</p>
                    </motion.div>
                    
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setText('Rewrite this AI-generated text to sound more human')}
                      className="cursor-pointer p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 text-left border border-purple-200 dark:border-purple-800"
                    >
                      <div className="flex items-center text-purple-500 dark:text-purple-400 mb-1 text-sm font-medium">
                        <FiPlus className="mr-1.5" />
                        <span>AI-Generated Text</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Make it sound natural and human</p>
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
            Saved Content
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
                <div className="mb-2">
                  <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-0.5 rounded-full dark:bg-green-900/30 dark:text-green-400">
                    Humanised
                  </span>
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
  );
};

export default HumaniseTextPage; 
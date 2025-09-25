import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiFileText, FiZap, FiCopy, FiDownload, FiShare2, FiTrash, FiRotateCw, FiEdit, FiCheck, FiX, FiSave, FiSliders, FiSend, FiPlus, FiChevronLeft, FiChevronRight, FiMail, FiTwitter, FiLinkedin, FiFacebook, FiLink, FiLoader, FiShield, FiUser, FiGrid, FiList } from 'react-icons/fi';
import { ProFeatureAlert, AuthRequiredButton } from '../components';
import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/userService';
import { contentService } from '../services/contentService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import './ContentWriterPage.css';
import coinImage from '../assets/coin.png';

// Import the other page components
import HumaniseTextPage from './HumaniseTextPage';

// Add gradient animation style
const gradientAnimationStyle = document.createElement('style');
gradientAnimationStyle.textContent = `
  @keyframes gradient-x {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  .animate-gradient-x {
    background-size: 200% 200%;
    animation: gradient-x 3s ease infinite;
    background-image: linear-gradient(to right, #059669, #2563eb, #7c3aed);
  }
  .dark .animate-gradient-x {
    background-image: linear-gradient(to right, #ec4899, #eab308, #a855f7);
  }
`;
document.head.appendChild(gradientAnimationStyle);

interface ContentItem {
  id: string;
  uid?: string;
  prompt?: string;
  title: string;
  content: string;
  tags?: string[];
  content_type?: string;
  tone?: string;
  language?: string;
  created_at?: string;
  updated_at?: string;
  createdAt: string; // For backward compatibility
}

interface QuickQuestion {
  id: string;
  text: string;
  description: string;
  category: string;
}

const ContentWriterPage: React.FC = () => {
  const { userData, isPro, refreshUserData } = useUser();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const uid = user?.uid;
  const { showConfirmation } = useAlert();

  // Tab navigation state
  const [activeTab, setActiveTab] = useState('content-writer');
  
  // Dynamic title and subtitle
  const [pageTitle, setPageTitle] = useState(t('content.title'));
  const [pageSubtitle, setPageSubtitle] = useState(t('contentWriter.subtitle'));

  // Update page title and subtitle when tab changes
  useEffect(() => {
    if (activeTab === 'content-writer') {
      setPageTitle(t('contentWriter.title'));
      setPageSubtitle(t('contentWriter.subtitle'));
    } else if (activeTab === 'humanizer') {
      setPageTitle(t('humanizeText.title'));
      setPageSubtitle(t('humanizeText.subtitle'));
    }
  }, [activeTab, t]);
  
  // Listen for custom event to switch to Content Writer tab and use transferred text
  useEffect(() => {
    const handleSwitchToContentWriter = () => {
      // Switch to Content Writer tab
      setActiveTab('content-writer');
      
      // Get transferred text from localStorage
      const transferredText = localStorage.getItem('transferToContentWriter');
      if (transferredText) {
        // Set the transferred text as prompt
        setPrompt(transferredText);
        // Clear localStorage
        localStorage.removeItem('transferToContentWriter');
        // Show toast notification
        toast.success(t('contentWriter.success.textTransferred'));
      }
    };
    
    // Add event listener
    window.addEventListener('switchToContentWriter', handleSwitchToContentWriter);
    
    // Clean up
    return () => {
      window.removeEventListener('switchToContentWriter', handleSwitchToContentWriter);
    };
  }, []);

  // Content generation state
  const [prompt, setPrompt] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [generatedContent, setGeneratedContent] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [tone, setTone] = useState('professional');
  const [contentType, setContentType] = useState('essay');
  const [targetWordCount, setTargetWordCount] = useState(500);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [showPreview, setShowPreview] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [contentTitle, setContentTitle] = useState(t('common.untitled'));

  // UI state
  const [showProAlert, setShowProAlert] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [contentHistory, setContentHistory] = useState<ContentItem[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // Updated to match other pages
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const contentDisplayRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  
  // Fetch content history when component mounts
  // Function to fetch content history from the API
  const fetchContentHistory = useCallback(async () => {
    // Use test user ID if no user is logged in (for testing purposes)
    const userId = user?.uid;
    
    try {
      setIsLoadingHistory(true);
      console.log('Fetching content history for user:', userId, 'page:', currentPage);
      
      const response = await contentService.getUserContent(userId!, {
        page: currentPage,
        limit: itemsPerPage
      });
      console.log('Content history response:', response);
      
      // The API response structure based on our test
      if (response && response.content && Array.isArray(response.content)) {
        // Map API response to ContentItem format and sort by creation date (most recent first)
        const formattedContent = response.content
          .map(item => ({
            ...item,
            createdAt: item.created_at || item.updated_at || new Date().toISOString()
          }))
          .sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateB - dateA; // Most recent first
          });
        
        console.log('Setting content history:', formattedContent);
        setContentHistory(formattedContent);
        
        // Use pagination info from API response
        setTotalItems(response.totalItems || response.total || 0);
        setTotalPages(response.totalPages || 1);
        
        console.log('Content history items:', formattedContent.length);
        console.log('Total items:', response.totalItems || response.total || 0);
        console.log('Current page:', response.currentPage || currentPage);
        console.log('Total pages from API:', response.totalPages);
      } else {
        console.warn('No content array in response');
        setContentHistory([]);
        setTotalItems(0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching content history:', error);
      toast.error(t('contentWriter.errors.failedToLoadHistory'));
      setContentHistory([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      console.log('Setting isLoadingHistory to false');
      setIsLoadingHistory(false);
    }
  }, [user?.id, currentPage, itemsPerPage]);
  
  useEffect(() => {
    // Always fetch content history, even if no user is logged in
    // This will use the test user ID if no user is logged in
    fetchContentHistory();
  }, [currentPage, fetchContentHistory]);
  
  // Check for shared content in URL
  useEffect(() => {
    const checkForSharedContent = async () => {
      // Extract share ID from URL if present
      const urlParams = new URLSearchParams(window.location.search);
      const shareId = urlParams.get('share');
      
      if (shareId) {
        try {
          // Fetch the shared content
          const response = await contentService.getSharedContent(shareId);
          
          if (response.success && response.content) {
            // Set the content in the editor
            setEditedContent(response.content.content);
            setGeneratedContent(response.content.content);
            toast.success(t('contentWriter.success.sharedContentLoaded'));
            
            // Clear the share ID from URL to prevent reloading on refresh
            window.history.replaceState({}, document.title, window.location.pathname);
          } else {
            toast.error(t('contentWriter.errors.failedToLoadSharedContent'));
          }
        } catch (error) {
          console.error('Error loading shared content:', error);
          toast.error(t('contentWriter.errors.errorLoadingSharedContent'));
        }
      }
    };
    
    checkForSharedContent();
  }, []);

  // Quick questions for content creation
  const quickQuestions: QuickQuestion[] = [
    {
      id: 'blog-post',
      text: t('contentWriter.quickQuestions.blogPost'),
      description: t('contentWriter.quickQuestions.blogPostDesc'),
      category: t('contentWriter.categories.blog')
    },
    {
      id: 'product-description',
      text: t('contentWriter.quickQuestions.productDescription'),
      description: t('contentWriter.quickQuestions.productDescriptionDesc'),
      category: t('contentWriter.categories.marketing')
    },
    {
      id: 'email-newsletter',
      text: t('contentWriter.quickQuestions.emailNewsletter'),
      description: t('contentWriter.quickQuestions.emailNewsletterDesc'),
      category: t('contentWriter.categories.email')
    },
    {
      id: 'social-media',
      text: t('contentWriter.quickQuestions.socialMedia'),
      description: t('contentWriter.quickQuestions.socialMediaDesc'),
      category: t('contentWriter.categories.socialMedia')
    },
    {
      id: 'business-proposal',
      text: t('contentWriter.quickQuestions.businessProposal'),
      description: t('contentWriter.quickQuestions.businessProposalDesc'),
      category: t('contentWriter.categories.business')
    },
    {
      id: 'essay-education',
      text: t('contentWriter.quickQuestions.aiEducationEssay'),
      description: t('contentWriter.quickQuestions.aiEducationEssayDesc'),
      category: t('contentWriter.categories.essay')
    },
    {
      id: 'cover-letter',
      text: t('contentWriter.quickQuestions.coverLetter'),
      description: t('contentWriter.quickQuestions.coverLetterDesc'),
      category: t('contentWriter.categories.professional')
    },
    {
      id: 'creative-story',
      text: t('contentWriter.quickQuestions.creativeStory'),
      description: t('contentWriter.quickQuestions.creativeStoryDesc'),
      category: t('contentWriter.categories.creative')
    }
  ];

  // Removed automatic redirect to subscription page
  // Now using ProFeatureAlert modal instead

  // Tone options
  const toneOptions = [
    { id: 'professional', name: t('common.professional') },
    { id: 'casual', name: t('common.casual') },
    { id: 'friendly', name: t('common.friendly') },
    { id: 'formal', name: t('contentWriter.tones.formal') },
    { id: 'creative', name: t('common.creative') },
    { id: 'persuasive', name: t('contentWriter.tones.persuasive') },
  ];

  // Content type options
  const contentTypeOptions = [
    { id: 'essay', name: t('contentWriter.contentTypes.essay') },
    { id: 'article', name: t('contentWriter.contentTypes.article') },
    { id: 'blog', name: t('contentWriter.contentTypes.blog') },
    { id: 'letter', name: t('contentWriter.contentTypes.letter') },
    { id: 'email', name: t('contentWriter.contentTypes.email') },
    { id: 'report', name: t('contentWriter.contentTypes.report') },
    { id: 'story', name: t('contentWriter.contentTypes.story') },
    { id: 'social', name: t('contentWriter.contentTypes.social') },
    { id: 'marketing', name: t('contentWriter.contentTypes.marketing') },
    { id: 'proposal', name: t('contentWriter.contentTypes.proposal') }
  ];

  // Enhanced Code Block Component for markdown rendering
  const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';
    const codeString = String(children).replace(/\n$/, '');
    
    if (!inline && (language || codeString.includes('\n'))) {
      return (
        <div className="relative my-4 rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              {language || 'code'}
            </span>
          </div>
          <SyntaxHighlighter
            style={darkMode ? oneDark : oneLight}
            language={language || 'text'}
            PreTag="div"
            className="!m-0 !bg-transparent"
            {...props}
          >
            {codeString}
          </SyntaxHighlighter>
        </div>
      );
    }
    
    return (
      <code 
        className={`px-1.5 py-0.5 rounded text-sm font-mono ${
          darkMode 
            ? 'bg-gray-800 text-gray-300 border border-gray-700' 
            : 'bg-gray-100 text-gray-800 border border-gray-200'
        }`} 
        {...props}
      >
        {children}
      </code>
    );
  };

  // Markdown components configuration
  const MarkdownComponents = {
    code: CodeBlock,
    pre: ({ children }: any) => <div className="overflow-auto">{children}</div>,
    h1: ({ children }: any) => (
      <h1 className={`text-2xl font-bold mb-4 mt-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        {children}
      </h1>
    ),
    h2: ({ children }: any) => (
      <h2 className={`text-xl font-bold mb-3 mt-5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 className={`text-lg font-semibold mb-2 mt-4 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
        {children}
      </h3>
    ),
    p: ({ children }: any) => (
      <p className={`mb-4 leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        {children}
      </p>
    ),
    ul: ({ children }: any) => (
      <ul className={`mb-4 ml-6 space-y-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        {children}
      </ul>
    ),
    ol: ({ children }: any) => (
      <ol className={`mb-4 ml-6 space-y-1 list-decimal ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        {children}
      </ol>
    ),
    li: ({ children }: any) => (
      <li className="mb-1">{children}</li>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className={`border-l-4 pl-4 py-2 my-4 italic ${
        darkMode 
          ? 'border-blue-400 bg-blue-900/20 text-blue-200' 
          : 'border-blue-500 bg-blue-50 text-blue-800'
      }`}>
        {children}
      </blockquote>
    ),
    strong: ({ children }: any) => (
      <strong className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        {children}
      </strong>
    ),
    em: ({ children }: any) => (
      <em className={`italic ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        {children}
      </em>
    ),
  };

  // Streaming API function similar to ChatPage
  const sendContentRequest = async (promptText: string, onChunk?: (chunk: string) => void): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        // Get the system prompt based on settings
        const systemContent = `You are a professional content writer specialized in creating high-quality ${contentType} content. 

Please create ${contentType} content with the following specifications:
- Tone: ${tone}
- Target word count: approximately ${targetWordCount} words
- Style: Well-structured, engaging, and professional
- Format: Use proper markdown formatting with headers, lists, and emphasis where appropriate

Important formatting instructions:
- Use # for main headings and ## for subheadings
- Use **bold** for emphasis and *italic* for subtle emphasis  
- Use bullet points and numbered lists for better organization
- Use > for important quotes or key insights
- Structure content with clear sections and proper spacing
- Make the content comprehensive and valuable to the reader

Create content that is original, well-researched, and engaging for the target audience.`;

        // Prepare messages array
        const messages = [
          {
            role: "system",
            content: [
              {
                type: "text", 
                text: systemContent
              }
            ]
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Please create content based on this prompt: ${promptText}`
              }
            ]
          }
        ];

        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', true);
        xhr.setRequestHeader('Authorization', `Bearer ${process.env.REACT_APP_ALIYUN_API_KEY}`);
        xhr.setRequestHeader('Content-Type', 'application/json');

        let fullContent = '';
        let processedLength = 0;
        let isFirstChunk = true;

        xhr.onreadystatechange = function() {
          if (xhr.readyState === 3 || xhr.readyState === 4) {
            const responseText = xhr.responseText;
            
            // Only process new content that we haven't seen before
            const newContent = responseText.substring(processedLength);
            if (newContent) {
              processedLength = responseText.length;
              const lines = newContent.split('\n');
              
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6).trim();
                  if (data === '[DONE]') {
                    console.log('✅ Stream marked as DONE');
                    continue;
                  }
                  
                  try {
                    const parsed = JSON.parse(data);
                    const content_chunk = parsed.choices?.[0]?.delta?.content;
                    
                    if (content_chunk) {
                      if (isFirstChunk) {
                        console.log('📝 First content chunk received');
                        isFirstChunk = false;
                      }
                      
                      fullContent += content_chunk;
                      
                      // Call the chunk callback immediately for real-time updates
                      if (onChunk) {
                        onChunk(content_chunk);
                      }
                    }
                  } catch (parseError) {
                    // Skip invalid JSON lines
                    continue;
                  }
                }
              }
            }
            
            // If request is complete
            if (xhr.readyState === 4) {
              if (xhr.status === 200) {
                console.log('✅ Content generation completed successfully');
                console.log('📊 Final content length:', fullContent.length);
                resolve(fullContent.trim() || 'I apologize, but I could not generate content. Please try again.');
              } else {
                console.error('❌ API request failed:', xhr.status, xhr.statusText);
                reject(new Error(`API call failed: ${xhr.status} ${xhr.statusText}`));
              }
            }
          }
        };

        xhr.onerror = function() {
          console.error('💥 XMLHttpRequest error');
          reject(new Error('Failed to generate content. Please try again.'));
        };

        xhr.ontimeout = function() {
          console.error('💥 XMLHttpRequest timeout');
          reject(new Error('Request timed out. Please try again.'));
        };

        xhr.timeout = 60000; // 60 second timeout

        const requestBody = JSON.stringify({
          model: "qwen-max",
          messages: messages,
          stream: true,
          max_tokens: 4096
        });

        console.log('📊 Sending request to streaming API...');
        xhr.send(requestBody);

      } catch (error) {
        console.error('💥 Error in sendContentRequest:', error);
        reject(new Error('Failed to generate content. Please try again.'));
      }
    });
  };

  const handlePromptChange = (value: string) => {
    const words = value.trim().split(/\s+/).filter(word => word.length > 0);
    const currentWordCount = value.trim() === '' ? 0 : words.length;
    
    if (currentWordCount <= 2000) {
      setPrompt(value);
      setWordCount(currentWordCount);
    } else {
      // Truncate to 2000 words
      const truncatedWords = words.slice(0, 2000);
      const truncatedText = truncatedWords.join(' ');
      setPrompt(truncatedText);
      setWordCount(2000);
    }
  };

  const handleGenerateContent = async () => {
    if (!prompt.trim()) {
      toast.error(t('contentWriter.errors.enterPrompt'));
      return;
    }
    
    // AuthRequiredButton handles authentication
    // Check if user is Pro
    if (!isPro) {
      setShowProAlert(true);
      return;
    }
    
    // Check if user has at least 3 coins
    if (userData && (userData.coins || 0) < 3) {
      setShowProAlert(true);
      return;
    }
    
    setIsGenerating(true);
    setIsStreaming(true);
    setError(null);
    setStreamingContent('');
    setGeneratedContent('');
    setEditedContent('');
    
    // Subtract 3 coins before generating content
    try {
      if (user?.uid) {
        await userService.subtractCoins(user.uid, 3, 'content_generation');
        // Refresh user data to update coin count in UI
        refreshUserData();
      }
    } catch (coinError) {
      console.error('Error deducting coins:', coinError);
      toast.error(t('contentWriter.errors.coinDeductionFailed') || 'Failed to deduct coins');
      setIsGenerating(false);
      setIsStreaming(false);
      return;
    }
    
    try {

      // Define chunk handler for real-time updates
      const handleChunk = (chunk: string) => {
        setStreamingContent(prev => {
          const newContent = prev + chunk;
          setEditedContent(newContent);
          return newContent;
        });
        
        // Auto-scroll to bottom as content streams in
        setTimeout(() => {
          if (contentDisplayRef.current) {
            const contentContainer = contentDisplayRef.current.querySelector('[data-content-container="true"]');
            if (contentContainer) {
              contentContainer.scrollTop = contentContainer.scrollHeight;
            }
          }
        }, 50);
      };

      // Get streaming response
      const fullResponse = await sendContentRequest(prompt, handleChunk);
      
      // Finalize the content
      setGeneratedContent(fullResponse);
      setEditedContent(fullResponse);
      setStreamingContent(fullResponse);
      
      // Generate a title from the prompt
      const generatedTitle = prompt.length > 50 ? `${prompt.substring(0, 50)}...` : prompt;
      
      try {
        // Use test user ID if no user is logged in (for testing purposes)
        const userId = user?.uid;
        
        console.log('Saving content for user:', userId);
        // Save content to the database
        const saveResponse = await contentService.saveContent(
          userId!,
          prompt,
          fullResponse,
          generatedTitle,
          [], // tags
          contentType, // content_type
          tone, // tone
          'en' // language
        );
        
        if (saveResponse.success) {
          // Refresh content history
          fetchContentHistory();
          toast.success(t('contentWriter.success.contentGenerated'));
        } else {
          console.error('Failed to save content:', saveResponse);
          toast.error(t('contentWriter.errors.failedToSave'));
          
          // Add to local content history as fallback
          const newContentItem: ContentItem = {
            id: Date.now().toString(),
            title: generatedTitle,
            content: fullResponse,
            createdAt: new Date().toISOString()
          };
          
          setContentHistory(prev => {
            const updated = [newContentItem, ...prev];
            setTotalItems(updated.length);
            return updated;
          });
        }
      } catch (error) {
        console.error('Error saving content:', error);
        toast.error(t('contentWriter.errors.failedToSave'));
        
        // Add to local content history as fallback
        const newContentItem: ContentItem = {
          id: Date.now().toString(),
          title: generatedTitle,
          content: fullResponse,
          createdAt: new Date().toISOString()
        };
        
        setContentHistory(prev => {
          const updated = [newContentItem, ...prev];
          setTotalItems(updated.length);
          return updated;
        });
      }
      
    } catch (error) {
      console.error('Error generating content:', error);
      setError(t('contentWriter.errors.generateError'));
      setGeneratedContent('');
      setEditedContent('');
      setStreamingContent('');
      toast.error(t('contentWriter.errors.failedToGenerate'));
    } finally {
      setIsGenerating(false);
      setIsStreaming(false);
    }
  };

  const handleQuickQuestion = (question: QuickQuestion) => {
    // AuthRequiredButton handles authentication
    setPrompt(question.text);
    // Auto-set content type based on question category
    switch (question.category.toLowerCase()) {
      case 'blog':
        setContentType('blog');
        break;
      case 'marketing':
        setContentType('marketing');
        break;
      case 'email':
        setContentType('email');
        break;
      case 'social media':
        setContentType('social');
        break;
      case 'business':
        setContentType('proposal');
        break;
      case 'essay':
        setContentType('essay');
        break;
      case 'creative':
        setContentType('story');
        break;
      default:
        setContentType('article');
    }
  };

  const handleCopyContent = () => {
    navigator.clipboard.writeText(editedContent);
    toast.success(t('contentWriter.success.contentCopied'));
  };

  const handleDownloadContent = async (format: 'txt' | 'pdf' | 'doc') => {
    if (!editedContent) {
      toast.error(t('contentWriter.errors.noContentToDownload'));
      return;
    }
    
    // Use test user ID if no user is logged in (for testing purposes)
    const userId = user?.uid;
    
    // Check if we have a current content ID (from history)
    const currentContentId = contentHistory.length > 0 ? contentHistory[0].id : null;
    
    // If we have a content ID, try to use the API
    if (currentContentId) {
      try {
        console.log('Downloading content with ID:', currentContentId, 'for user:', userId);
        const response = await contentService.downloadContent(userId!, currentContentId, format);
        
        if (response.success) {
          // Create a blob from the content
          const blob = new Blob([response.content], { type: 'text/plain' });
          saveAs(blob, response.filename);
          toast.success(t('contentWriter.success.contentDownloaded', { format: format.toUpperCase() }));
          return;
        }
      } catch (error) {
        console.error('Error downloading content from API:', error);
        // Fall back to client-side download
      }
    }

    setIsDownloading(true);
    
    try {
      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `content-${timestamp}`;

      if (format === 'txt') {
        // Plain text download with minimal formatting
        let content = editedContent
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\*(.*?)\*/g, '$1')
          .replace(/_{2,}(.*?)_{2,}/g, '$1')
          .replace(/==(.*?)==/g, '$1')
          .replace(/\n- (.*)/g, '• $1')
          .replace(/\n\d+\. (.*)/g, '$1')
          .replace(/#{1,6} (.*)/g, '$1');

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, `${filename}.txt`);

      } else if (format === 'pdf') {
        // PDF download with formatted content
        await generatePDF(editedContent, filename);

      } else if (format === 'doc') {
        // DOCX download with formatted content
        await generateDOCX(editedContent, filename);
      }

      toast.success(t('contentWriter.success.contentDownloaded', { format: format.toUpperCase() }));
    } catch (error) {
      console.error('Download error:', error);
      toast.error(t('contentWriter.errors.failedToDownload', { format: format.toUpperCase() }));
    } finally {
      setIsDownloading(false);
    }
  };

  const generatePDF = async (content: string, filename: string) => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text(t('contentWriter.pdf.title'), margin, yPosition);
    yPosition += 15;

    // Date
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(t('contentWriter.pdf.generatedOn', { date: new Date().toLocaleDateString() }), margin, yPosition);
    yPosition += 20;

    // Process content by lines
    const lines = content.split('\n');
    pdf.setFontSize(12);

    for (const line of lines) {
      if (yPosition > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }

      let processedLine = line;
      let fontSize = 12;
      let fontStyle = 'normal';

      // Handle markdown formatting
      if (line.startsWith('# ')) {
        processedLine = line.replace('# ', '');
        fontSize = 18;
        fontStyle = 'bold';
      } else if (line.startsWith('## ')) {
        processedLine = line.replace('## ', '');
        fontSize = 16;
        fontStyle = 'bold';
      } else if (line.startsWith('### ')) {
        processedLine = line.replace('### ', '');
        fontSize = 14;
        fontStyle = 'bold';
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        processedLine = '• ' + line.replace(/^[*-] /, '');
      }

      // Remove other markdown formatting
      processedLine = processedLine
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`(.*?)`/g, '$1');

      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', fontStyle as any);

      if (processedLine.trim()) {
        const splitText = pdf.splitTextToSize(processedLine, maxWidth);
        for (const textLine of splitText) {
          if (yPosition > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }
          pdf.text(textLine, margin, yPosition);
          yPosition += fontSize * 0.6;
        }
      }
      yPosition += 5;
    }

    pdf.save(`${filename}.pdf`);
  };

  const generateDOCX = async (content: string, filename: string) => {
    const paragraphs: any[] = [];
    const lines = content.split('\n');

    // Add title
    paragraphs.push(
      new Paragraph({
        text: 'Generated Content',
        heading: HeadingLevel.TITLE,
        spacing: { after: 200 }
      })
    );

    // Add date
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Generated on: ${new Date().toLocaleDateString()}`,
            size: 20,
            color: '666666'
          })
        ],
        spacing: { after: 400 }
      })
    );

    // Process content
    for (const line of lines) {
      if (!line.trim()) {
        paragraphs.push(new Paragraph({ text: '' }));
        continue;
      }

      let text = line;
             let heading: typeof HeadingLevel[keyof typeof HeadingLevel] | undefined;
      let isBold = false;

      // Handle markdown formatting
      if (line.startsWith('# ')) {
        text = line.replace('# ', '');
        heading = HeadingLevel.HEADING_1;
      } else if (line.startsWith('## ')) {
        text = line.replace('## ', '');
        heading = HeadingLevel.HEADING_2;
      } else if (line.startsWith('### ')) {
        text = line.replace('### ', '');
        heading = HeadingLevel.HEADING_3;
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        text = '• ' + line.replace(/^[*-] /, '');
      }

      // Remove markdown formatting for plain text
      text = text
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`(.*?)`/g, '$1');

      const paragraph = new Paragraph({
        children: [
          new TextRun({
            text: text,
            bold: isBold,
            size: heading ? 28 : 24
          })
        ],
        heading: heading,
        spacing: { after: 200 }
      });

      paragraphs.push(paragraph);
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children: paragraphs
      }]
    });

    const buffer = await Packer.toBuffer(doc);
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    saveAs(blob, `${filename}.docx`);
  };

  const preprocessContent = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '**$1**')
      .replace(/\*(.*?)\*/g, '*$1*')
      .replace(/_{2,}(.*?)_{2,}/g, '**$1**')
      .replace(/`(.*?)`/g, '`$1`');
  };

  const handleShareContent = async (platform: string) => {
    if (!editedContent) {
      toast.error('No content to share');
      return;
    }
    
    // Use test user ID if no user is logged in (for testing purposes)
    const userId = user?.uid;

    // Check if we have a current content ID (from history)
    const currentContentId = contentHistory.length > 0 ? contentHistory[0].id : null;
    let shareUrl = window.location.href;
    
    // If we have a content ID, try to use the API to get a share link
    if (currentContentId) {
      try {
        console.log('Sharing content with ID:', currentContentId, 'for user:', userId);
        const response = await contentService.shareContent(userId!, currentContentId);
        
        if (response.success && response.shareUrl) {
          shareUrl = response.shareUrl;
          toast.success('Content shared successfully!');
          
          // If platform is 'copy', just copy the share URL and return
          if (platform === 'copy') {
            navigator.clipboard.writeText(shareUrl);
            toast.success('Share link copied to clipboard!');
            setShowShareModal(false);
            return;
          }
        }
      } catch (error) {
        console.error('Error sharing content via API:', error);
        // Fall back to client-side sharing
      }
    }

    const shareText = editedContent
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .substring(0, 500) + (editedContent.length > 500 ? '...' : '');

    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(shareUrl);

    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank');
        break;
      case 'email':
        window.open(`mailto:?subject=Generated Content&body=${encodedText}%0A%0A${encodedUrl}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
        toast.success('Content link copied to clipboard!');
        break;
      default:
        break;
    }
    
    setShowShareModal(false);
  };

  const clearContent = () => {
    // AuthRequiredButton handles authentication
    setPrompt('');
    setGeneratedContent('');
    setEditedContent('');
    setStreamingContent('');
    setError(null);
  };

  // Function to delete content
  const deleteContent = async (contentId: string) => {
    // Use test user ID if no user is logged in (for testing purposes)
    const userId = user?.uid;
    
    // Show confirmation dialog using AlertContext
    showConfirmation('Are you sure you want to delete this content?', async () => {
      try {
        console.log('Deleting content with ID:', contentId, 'for user:', userId);
        // Call the API to delete the content
        const response = await contentService.deleteContent(userId!, contentId);
        
        if (response.success) {
          // Remove the content from the local state
          const updatedHistory = contentHistory.filter(item => item.id !== contentId);
          setContentHistory(updatedHistory);
          setTotalItems(totalItems - 1);
          
          // Adjust current page if needed
          if (updatedHistory.length === 0 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
          }
          
          toast.success('Content deleted successfully');
        } else {
          toast.error('Failed to delete content');
        }
      } catch (error) {
        console.error('Error deleting content:', error);
        toast.error('An error occurred while deleting content');
      }
    });
  };

  // Pagination helper functions
  const getTotalPages = () => totalPages;
  
  const handlePageChange = (page: number) => {
    // Allow page changes regardless of authentication status
    if (page >= 1 && page <= getTotalPages()) {
      setCurrentPage(page);
      // Scroll to the top of the content history section
      const contentHistorySection = document.querySelector('.bg-white.dark\\:bg-gray-800.rounded-lg');
      if (contentHistorySection) {
        contentHistorySection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };
  
  // Ensure current page is valid whenever totalItems changes
  useEffect(() => {
    const maxPage = getTotalPages();
    if (currentPage > maxPage && maxPage > 0) {
      setCurrentPage(maxPage);
    }
  }, [totalItems]);

  // Server-side pagination - no need for client-side slicing
  const getCurrentPageItems = (items: any[]) => {
    // Since we're using server-side pagination, return all items from the current page
    return items || [];
  };

  const getStatusText = () => {
    if (isStreaming) {
      return t('contentWriter.generatingContent');
    }
    return t('contentWriter.readyToGenerate');
  };

  // Remove the Pro status check that blocks the entire page
  // The page should display normally with AuthRequiredButton handling authentication

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced background gradient effect */}
      <div className="absolute inset-0 bg-white dark:bg-black z-0"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/30 via-transparent to-purple-100/30 dark:from-indigo-900/30 dark:via-transparent dark:to-purple-900/30 z-0"></div>
      
      {/* Subtle gradient from bottom to create a fade effect */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-black dark:via-black/80 dark:to-transparent z-0"></div>
      
      {/* Subtle grid lines with animation */}
      <div className="absolute inset-0 opacity-10 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] animate-gridMove"></div>
      
      <div className="flex-1 flex flex-col relative z-10">
          
      <div className="flex-1 p-0">
      <div className="max-w-6xl mx-auto">
      {/* Modals */}
      {showProAlert && (
        <ProFeatureAlert 
          featureName={t('contentWriter')}
          onClose={() => setShowProAlert(false)}
        />
      )}

      {/* Header */}
      <div className="mb-3 sm:mb-4 mt-4 sm:mt-5 mx-4 sm:ml-8">
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-yellow-500 to-purple-500 animate-gradient-x"
        >
          {pageTitle}
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-sm sm:text-base text-gray-500 dark:text-gray-400"
        >
          {pageSubtitle}
        </motion.p>
      </div>
      
      {/* Tab Navigation */}
      <div className="mx-4 sm:mx-8">
        <div className="flex space-x-1 sm:space-x-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <button
            onClick={() => setActiveTab('content-writer')}
            className={`px-3 sm:px-4 py-2 font-medium text-xs sm:text-sm rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'content-writer' 
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500' 
              : 'text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400'}`}
          >
            <div className="flex items-center">
              <FiFileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{t('contentWriter.title')}</span>
              <span className="sm:hidden">Writer</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('humanizer')}
            className={`px-3 sm:px-4 py-2 font-medium text-xs sm:text-sm rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'humanizer' 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-b-2 border-green-500' 
              : 'text-gray-600 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400'}`}
          >
            <div className="flex items-center">
              <FiUser className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{t('humanizeText.title')}</span>
              <span className="sm:hidden">Humanizer</span>
            </div>
          </button>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'content-writer' && (
      <>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-8 px-1 sm:px-2 py-2 sm:py-4">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-2 order-1 lg:order-1">
            <div className="sticky top-2 lg:top-6 space-y-4 lg:space-y-6">
            {/* Content Generation Form */}
            <div className="glass-effect rounded-lg shadow-sm p-3 sm:p-6 m-1 sm:m-2 hover:shadow-md transition-shadow">
              <h2 className="text-lg sm:text-xl font-medium mb-3 sm:mb-4 flex items-center">
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-1 sm:p-1.5 rounded-md mr-2">
                  <FiEdit className="w-4 h-4 sm:w-5 sm:h-5" />
                </span>
                {t('common.create')} Content
              </h2>
              
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t('contentWriter.prompt')}</label>
                  <div className="relative">
                    <textarea
                      value={prompt}
                      onChange={(e) => handlePromptChange(e.target.value)}
                      placeholder={t('contentWriter.promptPlaceholder')}
                      className="w-full p-2 sm:p-3 border rounded-lg shadow-sm h-24 sm:h-32 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                      disabled={isGenerating}
                    />
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

                {/* Quick Questions */}
                <div>
                  <label className="block text-sm font-medium mb-2 sm:mb-3 text-gray-700 dark:text-gray-300 flex items-center">
                    <FiZap className="w-4 h-4 mr-1" />
                    {t('contentWriter.quickPrompts')}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 max-h-48 sm:max-h-60 overflow-y-auto pr-1">
                    {quickQuestions.map((question) => (
                      <motion.div
                        key={question.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`relative overflow-hidden rounded-lg transition-all shadow-sm ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}
                      >
                        <AuthRequiredButton
                          onClick={() => handleQuickQuestion(question)}
                          disabled={isGenerating}
                          className="w-full h-full"
                        >
                          <div className={`absolute inset-0 opacity-10 ${darkMode ? 'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500' : 'bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400'}`}></div>
                          <div className={`relative p-2.5 sm:p-3.5 text-left ${darkMode ? 'bg-gray-800/80' : 'bg-white/90'} h-full`}>
                            <div className="flex items-start">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center mb-1 sm:mb-1.5">
                                  <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium mr-2 ${darkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-600'}`}>
                                    {question.category}
                                  </span>
                                </div>
                                <p className={`text-xs sm:text-sm font-medium line-clamp-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                  {question.text}
                                </p>
                                <p className={`text-xs mt-1 sm:mt-1.5 line-clamp-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {question.description}
                                </p>
                              </div>
                              <div className={`ml-2 sm:ml-3 flex-shrink-0 flex items-center justify-center h-6 w-6 sm:h-8 sm:w-8 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                <FiPlus className={`w-3 h-3 sm:w-4 sm:h-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                              </div>
                            </div>
                          </div>
                        </AuthRequiredButton>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Settings panel */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t('contentWriter.contentType')}</label>
                    <select 
                      value={contentType}
                      onChange={(e) => setContentType(e.target.value)}
                      className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                      disabled={isGenerating}
                    >
                      {contentTypeOptions.map(option => (
                        <option key={option.id} value={option.id}>{option.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t('contentWriter.tone')}</label>
                    <select 
                      value={tone}
                      onChange={(e) => setTone(e.target.value)}
                      className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                      disabled={isGenerating}
                    >
                      {toneOptions.map(option => (
                        <option key={option.id} value={option.id}>{option.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t('contentWriter.wordCount')}</label>
                  <select 
                    value={targetWordCount}
                    onChange={(e) => setTargetWordCount(Number(e.target.value))}
                    className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    disabled={isGenerating}
                  >
                    <option value={250}>{t('contentWriter.wordCounts.250')}</option>
                    <option value={500}>{t('contentWriter.wordCounts.500')}</option>
                    <option value={750}>{t('contentWriter.wordCounts.750')}</option>
                    <option value={1000}>{t('contentWriter.wordCounts.1000')}</option>
                    <option value={1500}>{t('contentWriter.wordCounts.1500')}</option>
                  </select>
                </div>
                
                <div className="w-full bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-xs text-gray-700 dark:text-gray-300 border border-green-100 dark:border-green-800/50">
                  <div className="flex items-start">
                    <FiZap className="text-green-500 dark:text-green-400 mt-0.5 mr-2 flex-shrink-0" />
                    <span><strong>Remind:</strong> AI-generated, for reference only.</span>
                  </div>
                </div>
                
                <AuthRequiredButton
                  onClick={handleGenerateContent}
                  disabled={!prompt.trim() || isGenerating}
                  className={`w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg font-medium transition-all text-sm sm:text-base ${
                    !prompt.trim() || isGenerating
                      ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                  }`}
                >
                  {isGenerating ? (
                    <div className="flex items-center justify-center">
                      <FiRotateCw className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
                      <span className="text-xs sm:text-sm">{getStatusText()}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <FiZap className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      <span>{t('contentWriter.generateContent')}</span>
                      <div className="flex items-center ml-2 text-yellow-300">
                        <span className="text-xs sm:text-sm">-3</span>
                        <img src={coinImage} alt="coin" className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                      </div>
                    </div>
                  )}
                </AuthRequiredButton>

                {/* Streaming indicator */}
                {isGenerating && (
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full animate-pulse"
                      style={{ width: '100%' }}
                    />
                  </div>
                )}

                {/* View History Button */}
                <AuthRequiredButton
                  onClick={() => {
                    setShowHistory(!showHistory);
                    if (!showHistory) {
                      // Auto-scroll to history section when showing history
                      setTimeout(() => {
                        historyRef.current?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }
                  }}
                  className={`w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg font-medium transition-all mt-3 sm:mt-4 text-sm sm:text-base ${
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
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Content Display */}
        <div className="lg:col-span-3 order-2 lg:order-2">
          <div className="glass-effect rounded-lg shadow-sm overflow-hidden m-1 sm:m-2">
            {/* Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-1 sm:p-1.5 rounded-md mr-2">
                    <FiFileText className="w-4 h-4 sm:w-5 sm:h-5" />
                  </span>
                  <span className="hidden sm:inline">{t('contentWriter.generatedContent')}</span>
                  <span className="sm:hidden">{t('contentWriter.content')}</span>
                </h3>
                {editedContent && (
                  <div className="flex space-x-1 sm:space-x-2">
                    <AuthRequiredButton
                      onClick={handleCopyContent}
                      className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center text-xs sm:text-sm"
                    >
                      <FiCopy className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                      <span className="hidden sm:inline">{t('common.copy')}</span>
                    </AuthRequiredButton>
                    
                    <AuthRequiredButton
                      onClick={() => setIsEditing(!isEditing)}
                      className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center text-xs sm:text-sm"
                    >
                      <FiEdit className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                      <span className="hidden sm:inline">{isEditing ? t('common.view') : t('common.edit')}</span>
                    </AuthRequiredButton>
                    
                    {/* Download Dropdown */}
                    <div className="relative group">
                      <AuthRequiredButton
                        disabled={isDownloading}
                        className="px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center text-xs sm:text-sm disabled:opacity-50"
                      >
                        <FiDownload className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                        <span className="hidden sm:inline">{isDownloading ? t('common.downloading') : t('common.download')}</span>
                      </AuthRequiredButton>
                      
                      <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                        <AuthRequiredButton
                          onClick={() => handleDownloadContent('txt')}
                          disabled={isDownloading}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg disabled:opacity-50"
                        >
                          <FiFileText className="w-4 h-4 inline mr-2" />
                          {t('common.formats.text')}
                        </AuthRequiredButton>
                        <AuthRequiredButton
                          onClick={() => handleDownloadContent('pdf')}
                          disabled={isDownloading}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                        >
                          <FiFileText className="w-4 h-4 inline mr-2" />
                          {t('common.formats.pdf')}
                        </AuthRequiredButton>
                        <AuthRequiredButton
                          onClick={() => handleDownloadContent('doc')}
                          disabled={isDownloading}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg disabled:opacity-50"
                        >
                          <FiFileText className="w-4 h-4 inline mr-2" />
                          {t('common.formats.word')}
                        </AuthRequiredButton>
                      </div>
                    </div>

                    <AuthRequiredButton
                      onClick={() => setShowShareModal(true)}
                      className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors flex items-center text-sm"
                    >
                      <FiShare2 className="w-4 h-4 mr-1" />
                      {t('common.share')}
                    </AuthRequiredButton>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 m-2" ref={contentDisplayRef}>
              {editedContent || isStreaming ? (
                <div className={`w-full ${showHistory ? 'h-[400px]' : 'h-[600px]'} overflow-y-auto`} data-content-container="true">
                  {isStreaming ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert mb-4 markdown-content streaming-content">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex, rehypeRaw]}
                        components={MarkdownComponents}
                      >
                        {preprocessContent(streamingContent)}
                      </ReactMarkdown>
                      <span className="typing-cursor animate-pulse ml-1 text-blue-500">▋</span>
                    </div>
                  ) : isEditing ? (
                    <div className="mt-2">
                      <textarea
                        ref={editorRef}
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="w-full min-h-[400px] sm:min-h-[600px] p-2 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-200 font-mono text-xs sm:text-sm resize-none"
                        spellCheck="false"
                        placeholder="Edit your generated content here..."
                      />
                      <div className="mt-3 sm:mt-4 flex justify-end space-x-2">
                        <button
                          onClick={clearContent}
                          className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center text-xs sm:text-sm"
                        >
                          <FiTrash className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                          <span className="hidden sm:inline">{t('common.clear')}</span>
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-2 sm:px-3 py-1 sm:py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center text-xs sm:text-sm"
                        >
                          <FiCheck className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                          <span className="hidden sm:inline">{t('common.done')}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="prose prose-sm max-w-none dark:prose-invert mb-4 markdown-content">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkMath]}
                        rehypePlugins={[rehypeKatex, rehypeRaw]}
                        components={MarkdownComponents}
                      >
                        {preprocessContent(editedContent)}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center text-center py-8 sm:py-16 px-4"
                >
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-opacity-10 flex items-center justify-center mb-3 sm:mb-4">
                    <FiFileText className="h-8 w-8 sm:h-10 sm:w-10 text-blue-500 dark:text-blue-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{t('contentWriter.noContentGenerated')}</h3>
                  <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-md mb-4 sm:mb-6">
                    {t('contentWriter.subtitle')}
                  </p>
                  
                  {/* Featured Quick Questions for Empty State */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-6 sm:mt-8 w-full max-w-2xl">
                    {quickQuestions.slice(0, 4).map((question) => (
                      <motion.div
                        key={question.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`p-3 sm:p-4 text-left rounded-lg border transition-all ${
                          darkMode
                            ? 'border-gray-600 bg-gray-700/30 hover:bg-gray-700/50 hover:border-blue-500'
                            : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-blue-300'
                        } hover:shadow-sm`}
                      >
                        <AuthRequiredButton
                          onClick={() => handleQuickQuestion(question)}
                          className="w-full h-full text-left"
                        >
                          <div className="flex items-center mb-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            darkMode
                              ? 'bg-blue-900/30 text-blue-300'
                              : 'bg-blue-100 text-blue-600'
                          }`}>
                            {question.category}
                          </span>
                        </div>
                        <p className={`text-sm font-medium ${
                          darkMode ? 'text-gray-200' : 'text-gray-800'
                        }`}>
                          {question.text}
                        </p>
                        <p className={`text-xs mt-1 ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {question.description}
                        </p>
                      </AuthRequiredButton>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
                              )}
              </div>
            </div>
          </div>
        </div>

        {/* History Button - Moved outside the grid to span full width */}
        <div className="mt-8 lg:col-span-5 order-3">
        
          
          {/* Content History Section - Conditionally rendered with full page width */}
          {showHistory && (
            <div className="w-full px-4" ref={historyRef}>
              {contentHistory && Array.isArray(contentHistory) && contentHistory.length > 0 ? (
                <div>
                  {/* View Mode Toggle */}
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center">
                      <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 p-1.5 rounded-md mr-2">
                        <FiFileText className="w-5 h-5" />
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {t('contentWriter.history')} ({contentHistory.length})
                      </h3>
                    </div>
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

                  {isLoadingHistory ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/30">
                        <FiLoader className="w-6 h-6 text-blue-500 dark:text-blue-400 animate-spin" />
                      </div>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Loading content history...
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Grid View */}
                      {viewMode === 'grid' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {getCurrentPageItems(contentHistory).map((item, index) => item && item.id ? (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="glass-effect p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                              onClick={() => {
                                setEditedContent(item.content);
                                setGeneratedContent(item.content);
                                toast.success(t('contentWriter.success.contentLoadedFromHistory'));
                              }}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                                  {item.title || t('common.untitled')}
                                </h4>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteContent(item.id);
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
                                {item.content}
                              </p>
                            </motion.div>
                          ) : null)}
                        </div>
                      )}

                      {/* List View */}
                      {viewMode === 'list' && (
                        <div className="space-y-4">
                          {getCurrentPageItems(contentHistory).map((item, index) => item && item.id ? (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="glass-effect p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                              onClick={() => {
                                setEditedContent(item.content);
                                setGeneratedContent(item.content);
                                toast.success(t('contentWriter.success.contentLoadedFromHistory'));
                              }}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                      {item.title || t('common.untitled')}
                                    </h4>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {new Date(item.createdAt).toLocaleDateString()}
                                      </span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteContent(item.id);
                                        }}
                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                      >
                                        <FiTrash className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                                    {item.content}
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          ) : null)}
                        </div>
                      )}

                      {/* Pagination */}
                      {getTotalPages() > 1 && (
                        <div className="glass-effect p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm mt-6">
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage === 1}
                              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/70 dark:bg-gray-700/70 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-600 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
                            >
                              <FiChevronLeft className="w-4 h-4 mr-2" />
                              Previous
                            </button>
                            
                            <div className="flex items-center space-x-2">
                              <span className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/70 dark:bg-gray-700/70 rounded-lg border border-gray-300 dark:border-gray-600 backdrop-blur-sm">
                                Page {currentPage} of {getTotalPages()}
                              </span>
                            </div>
                            
                            <button
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage === getTotalPages()}
                              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/70 dark:bg-gray-700/70 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-white dark:hover:bg-gray-600 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
                            >
                              Next
                              <FiChevronRight className="w-4 h-4 ml-2" />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-gray-500 dark:text-gray-400">{t('contentWriter.noHistory')}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </>
      )}

      {/* Humanizer Tab */}
      {activeTab === 'humanizer' && (
        <div className="px-4 py-4">
          <HumaniseTextPage />
        </div>
      )}



      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {t('contentWriter.shareContent')}
              </h3>
              <AuthRequiredButton
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <FiX className="w-5 h-5" />
              </AuthRequiredButton>
            </div>
            
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
              {t('contentWriter.shareDescription')}
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              <AuthRequiredButton
                onClick={() => handleShareContent('twitter')}
                className="flex items-center justify-center px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <FiTwitter className="w-5 h-5 mr-2" />
                {t('common.twitter')}
              </AuthRequiredButton>
              
              <AuthRequiredButton
                onClick={() => handleShareContent('linkedin')}
                className="flex items-center justify-center px-4 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
              >
                <FiLinkedin className="w-5 h-5 mr-2" />
                {t('common.linkedin')}
              </AuthRequiredButton>
              
              <AuthRequiredButton
                onClick={() => handleShareContent('facebook')}
                className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiFacebook className="w-5 h-5 mr-2" />
                {t('common.facebook')}
              </AuthRequiredButton>
              
              <AuthRequiredButton
                onClick={() => handleShareContent('email')}
                className="flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <FiMail className="w-5 h-5 mr-2" />
                {t('common.email')}
              </AuthRequiredButton>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <AuthRequiredButton
                onClick={() => handleShareContent('copy')}
                className="w-full flex items-center justify-center px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <FiLink className="w-5 h-5 mr-2" />
                {t('common.copyLink')}
              </AuthRequiredButton>
            </div>
          </motion.div>
        </div>
      )}
    </div>
      </div>
    </div>
    </div>
  );
};

export default ContentWriterPage;
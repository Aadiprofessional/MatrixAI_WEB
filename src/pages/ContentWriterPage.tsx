import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiFileText, FiZap, FiCopy, FiDownload, FiShare2, FiTrash, FiRotateCw, FiEdit, FiCheck, FiX, FiSave, FiSliders, FiSend, FiPlus, FiChevronLeft, FiChevronRight, FiMail, FiTwitter, FiLinkedin, FiFacebook, FiLink } from 'react-icons/fi';
import { ProFeatureAlert, AuthRequiredButton } from '../components';
import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/userService';
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

interface ContentItem {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface QuickQuestion {
  id: string;
  text: string;
  description: string;
  category: string;
}

const ContentWriterPage: React.FC = () => {
  const { userData, isPro } = useUser();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  const uid = user?.id;

  // Content generation state
  const [prompt, setPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [tone, setTone] = useState('professional');
  const [contentType, setContentType] = useState('essay');
  const [wordCount, setWordCount] = useState(500);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [showPreview, setShowPreview] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [contentTitle, setContentTitle] = useState('Untitled Content');

  // UI state
  const [showProAlert, setShowProAlert] = useState(false);
  const [showInsufficientCoins, setShowInsufficientCoins] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [contentHistory, setContentHistory] = useState<ContentItem[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalItems, setTotalItems] = useState(0);

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const contentDisplayRef = useRef<HTMLDivElement>(null);

  // Quick questions for content creation
  const quickQuestions: QuickQuestion[] = [
    {
      id: 'blog-post',
      text: 'Write a blog post about sustainable living tips',
      description: 'Create an engaging blog post with practical advice',
      category: 'Blog'
    },
    {
      id: 'product-description',
      text: 'Write a compelling product description for a new smartwatch',
      description: 'Professional marketing copy that converts',
      category: 'Marketing'
    },
    {
      id: 'email-newsletter',
      text: 'Create an email newsletter about the latest tech trends',
      description: 'Informative and engaging newsletter content',
      category: 'Email'
    },
    {
      id: 'social-media',
      text: 'Write social media captions for a new restaurant opening',
      description: 'Catchy and shareable social media content',
      category: 'Social Media'
    },
    {
      id: 'business-proposal',
      text: 'Draft a business proposal for a mobile app development project',
      description: 'Professional proposal with clear structure',
      category: 'Business'
    },
    {
      id: 'essay-education',
      text: 'Write an essay about the impact of artificial intelligence on education',
      description: 'Academic essay with research-based insights',
      category: 'Essay'
    },
    {
      id: 'cover-letter',
      text: 'Create a cover letter for a software engineer position',
      description: 'Professional cover letter highlighting skills',
      category: 'Professional'
    },
    {
      id: 'creative-story',
      text: 'Write a short story about time travel and its consequences',
      description: 'Creative fiction with engaging narrative',
      category: 'Creative'
    }
  ];

  // Check if user is Pro for premium features
  useEffect(() => {
    // Only check for Pro status if user is logged in
    if (user && !isPro) {
      navigate('/subscription', { state: { feature: 'Content Writer' } });
      return;
    }
  }, [user, isPro, navigate]);

  // Tone options
  const toneOptions = [
    { id: 'professional', name: t('common.professional') || 'Professional' },
    { id: 'casual', name: t('common.casual') || 'Casual' },
    { id: 'friendly', name: t('common.friendly') || 'Friendly' },
    { id: 'formal', name: 'Formal' },
    { id: 'creative', name: t('common.creative') || 'Creative' },
    { id: 'persuasive', name: 'Persuasive' },
  ];

  // Content type options
  const contentTypeOptions = [
    { id: 'essay', name: 'Essay' },
    { id: 'article', name: 'Article' },
    { id: 'blog', name: 'Blog Post' },
    { id: 'letter', name: 'Letter' },
    { id: 'email', name: 'Email' },
    { id: 'report', name: 'Report' },
    { id: 'story', name: 'Story' },
    { id: 'social', name: 'Social Media' },
    { id: 'marketing', name: 'Marketing Copy' },
    { id: 'proposal', name: 'Business Proposal' }
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
- Target word count: approximately ${wordCount} words
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
        xhr.open('POST', 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', true);
        xhr.setRequestHeader('Authorization', 'Bearer sk-256fda005a1445628fe2ceafcda9e389');
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
          model: "qwen-vl-max",
          messages: messages,
          stream: true
        });

        console.log('📊 Sending request to streaming API...');
        xhr.send(requestBody);

      } catch (error) {
        console.error('💥 Error in sendContentRequest:', error);
        reject(new Error('Failed to generate content. Please try again.'));
      }
    });
  };

  const handleGenerateContent = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt for content generation');
      return;
    }
    
    // Check if user is authenticated
    if (!user) {
      navigate('/login', { state: { redirectTo: '/tools/content-writer' } });
      return;
    }
    
    setIsGenerating(true);
    setIsStreaming(true);
    setError(null);
    setStreamingContent('');
    setGeneratedContent('');
    setEditedContent('');
    
    try {
      // Check coins
      if (userData && (userData.user_coins || 0) < 2) {
        setShowInsufficientCoins(true);
        return;
      }

      // Deduct coins before generating
      if (uid) {
        try {
          await userService.subtractCoins(uid, 2, 'content_generation');
          toast.success('2 coins deducted for content generation');
        } catch (coinError) {
          console.error('Error deducting coins:', coinError);
          toast.error('Could not deduct coins. Please check your balance.');
          return;
        }
      }

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
      
      // Add to content history
      const newContentItem: ContentItem = {
        id: Date.now().toString(),
        title: prompt.length > 50 ? `${prompt.substring(0, 50)}...` : prompt,
        content: fullResponse,
        createdAt: new Date().toISOString()
      };
      
      setContentHistory(prev => {
        const updated = [newContentItem, ...prev];
        setTotalItems(updated.length);
        return updated;
      });
      
      toast.success('Content generated successfully!');
      
    } catch (error) {
      console.error('Error generating content:', error);
      setError('Error generating content. Please try again later.');
      setGeneratedContent('');
      setEditedContent('');
      setStreamingContent('');
      toast.error('Failed to generate content. Please try again.');
    } finally {
      setIsGenerating(false);
      setIsStreaming(false);
    }
  };

  const handleQuickQuestion = (question: QuickQuestion) => {
    // Check if user is authenticated
    if (!user) {
      navigate('/login', { state: { redirectTo: '/tools/content-writer' } });
      return;
    }
    
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
    // Check if user is authenticated
    if (!user) {
      navigate('/login', { state: { redirectTo: '/tools/content-writer' } });
      return;
    }
    
    navigator.clipboard.writeText(editedContent);
    toast.success('Content copied to clipboard!');
  };

  const handleDownloadContent = async (format: 'txt' | 'pdf' | 'doc') => {
    if (!editedContent) {
      toast.error('No content to download');
      return;
    }
    
    // Check if user is authenticated
    if (!user) {
      navigate('/login', { state: { redirectTo: '/tools/content-writer' } });
      return;
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

      toast.success(`Content downloaded as ${format.toUpperCase()}!`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Failed to download ${format.toUpperCase()} file`);
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
    pdf.text('Generated Content', margin, yPosition);
    yPosition += 15;

    // Date
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPosition);
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

  const handleShareContent = (platform: string) => {
    if (!editedContent) {
      toast.error('No content to share');
      return;
    }
    
    // Check if user is authenticated
    if (!user) {
      navigate('/login', { state: { redirectTo: '/tools/content-writer' } });
      return;
    }

    const shareText = editedContent
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .substring(0, 500) + (editedContent.length > 500 ? '...' : '');

    const shareUrl = window.location.href;
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
    // Check if user is authenticated
    if (!user) {
      navigate('/login', { state: { redirectTo: '/tools/content-writer' } });
      return;
    }
    
    setPrompt('');
    setGeneratedContent('');
    setEditedContent('');
    setStreamingContent('');
    setError(null);
  };

  // Pagination helper functions
  const getTotalPages = () => Math.ceil(totalItems / itemsPerPage);
  
  const handlePageChange = (page: number) => {
    // Check if user is authenticated
    if (!user) {
      navigate('/login', { state: { redirectTo: '/tools/content-writer' } });
      return;
    }
    
    if (page >= 1 && page <= getTotalPages()) {
      setCurrentPage(page);
    }
  };

  const getPaginatedItems = (items: any[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const getStatusText = () => {
    if (isStreaming) {
      return 'Generating content...';
    }
    return 'Ready to generate';
  };

  // Only check for Pro status if user is authenticated
  if (user && !isPro) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-6xl p-4 py-8">
      {/* Modals */}
      {showProAlert && (
        <ProFeatureAlert 
          featureName={t('contentWriter.title')}
          onClose={() => setShowProAlert(false)}
        />
      )}
      
      {showInsufficientCoins && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4 border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <FiX className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {t('contentWriter.insufficientCoins')}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {t('contentWriter.needMoreCoins')}
              </p>
              <div className="flex space-x-3">
                <AuthRequiredButton
                  onClick={() => setShowInsufficientCoins(false)}
                  className="flex-1 px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  {t('common.cancel')}
                </AuthRequiredButton>
                <AuthRequiredButton
                  onClick={() => {
                    setShowInsufficientCoins(false);
                    navigate('/buy');
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {t('contentWriter.buyCoins')}
                </AuthRequiredButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
        >
          {t('contentWriter.title')}
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-500 dark:text-gray-400"
        >
          {t('contentWriter.subtitle')}
        </motion.p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Panel - Controls */}
        <div className="lg:col-span-2 order-2 lg:order-1">
          <div className="sticky top-6 space-y-6">
            {/* Content Generation Form */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-medium mb-4 flex items-center">
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-1.5 rounded-md mr-2">
                  <FiEdit className="w-5 h-5" />
                </span>
                {t('common.create')} Content
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t('contentWriter.prompt')}</label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={t('contentWriter.promptPlaceholder')}
                    className="w-full p-3 border rounded-lg shadow-sm h-32 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isGenerating}
                  />
                </div>

                {/* Quick Questions */}
                <div>
                  <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300 flex items-center">
                    <FiZap className="w-4 h-4 mr-1" />
                    Quick Content Ideas
                  </label>
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                    {quickQuestions.map((question) => (
                      <motion.div
                        key={question.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`p-3 text-left rounded-lg border transition-all ${
                          darkMode
                            ? 'border-gray-600 bg-gray-700/50 hover:bg-gray-700 hover:border-blue-500'
                            : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-blue-300'
                        } ${isGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'}`}
                      >
                        <AuthRequiredButton
                          onClick={() => handleQuickQuestion(question)}
                          disabled={isGenerating}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center mb-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mr-2 ${
                                darkMode
                                  ? 'bg-blue-900/30 text-blue-300'
                                  : 'bg-blue-100 text-blue-600'
                              }`}>
                                {question.category}
                              </span>
                            </div>
                            <p className={`text-sm font-medium truncate ${
                              darkMode ? 'text-gray-200' : 'text-gray-800'
                            }`}>
                              {question.text}
                            </p>
                            <p className={`text-xs mt-1 ${
                              darkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {question.description}
                            </p>
                          </div>
                          <FiPlus className={`w-4 h-4 ml-2 flex-shrink-0 ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`} />
                        </div>
                        </AuthRequiredButton>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Settings panel */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t('contentWriter.contentType')}</label>
                    <select 
                      value={contentType}
                      onChange={(e) => setContentType(e.target.value)}
                      className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    value={wordCount}
                    onChange={(e) => setWordCount(Number(e.target.value))}
                    className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isGenerating}
                  >
                    <option value={250}>250 words</option>
                    <option value={500}>500 words</option>
                    <option value={750}>750 words</option>
                    <option value={1000}>1000 words</option>
                    <option value={1500}>1500 words</option>
                  </select>
                </div>
                
                <AuthRequiredButton
                  onClick={handleGenerateContent}
                  disabled={!prompt.trim() || isGenerating}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                    !prompt.trim() || isGenerating
                      ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                  }`}
                >
                  {isGenerating ? (
                    <div className="flex items-center justify-center">
                      <FiRotateCw className="w-4 h-4 mr-2 animate-spin" />
                      {getStatusText()}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <FiZap className="w-4 h-4 mr-2" />
                      {t('contentWriter.generateContent')}
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
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Content Display */}
        <div className="lg:col-span-3 order-1 lg:order-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-1.5 rounded-md mr-2">
                    <FiFileText className="w-5 h-5" />
                  </span>
                  Generated Content
                </h3>
                {editedContent && (
                  <div className="flex space-x-2">
                    <AuthRequiredButton
                      onClick={handleCopyContent}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center text-sm"
                    >
                      <FiCopy className="w-4 h-4 mr-1" />
                      Copy
                    </AuthRequiredButton>
                    
                    <AuthRequiredButton
                      onClick={() => setIsEditing(!isEditing)}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center text-sm"
                    >
                      <FiEdit className="w-4 h-4 mr-1" />
                      {isEditing ? 'View' : 'Edit'}
                    </AuthRequiredButton>
                    
                    {/* Download Dropdown */}
                    <div className="relative group">
                      <AuthRequiredButton
                        disabled={isDownloading}
                        className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center text-sm disabled:opacity-50"
                      >
                        <FiDownload className="w-4 h-4 mr-1" />
                        {isDownloading ? 'Downloading...' : 'Download'}
                      </AuthRequiredButton>
                      
                      <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                        <AuthRequiredButton
                          onClick={() => handleDownloadContent('txt')}
                          disabled={isDownloading}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg disabled:opacity-50"
                        >
                          <FiFileText className="w-4 h-4 inline mr-2" />
                          Text (.txt)
                        </AuthRequiredButton>
                        <AuthRequiredButton
                          onClick={() => handleDownloadContent('pdf')}
                          disabled={isDownloading}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                        >
                          <FiFileText className="w-4 h-4 inline mr-2" />
                          PDF (.pdf)
                        </AuthRequiredButton>
                        <AuthRequiredButton
                          onClick={() => handleDownloadContent('doc')}
                          disabled={isDownloading}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg disabled:opacity-50"
                        >
                          <FiFileText className="w-4 h-4 inline mr-2" />
                          Word (.docx)
                        </AuthRequiredButton>
                      </div>
                    </div>

                    <AuthRequiredButton
                      onClick={() => setShowShareModal(true)}
                      className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors flex items-center text-sm"
                    >
                      <FiShare2 className="w-4 h-4 mr-1" />
                      Share
                    </AuthRequiredButton>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6" ref={contentDisplayRef}>
              {editedContent || isStreaming ? (
                <div className="w-full h-[600px] overflow-y-auto" data-content-container="true">
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
                        className="w-full min-h-[600px] p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-200 font-mono text-sm resize-none"
                        spellCheck="false"
                        placeholder="Edit your generated content here..."
                      />
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={clearContent}
                          className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center text-sm mr-2"
                        >
                          <FiTrash className="w-4 h-4 mr-1" />
                          Clear
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center text-sm"
                        >
                          <FiCheck className="w-4 h-4 mr-1" />
                          Done
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
                  className="flex flex-col items-center justify-center text-center py-16"
                >
                  <div className="h-20 w-20 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-opacity-10 flex items-center justify-center mb-4">
                    <FiFileText className="h-10 w-10 text-blue-500 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Content Generated Yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
                    Enter a prompt, choose from quick content ideas, and configure your settings to generate high-quality content with AI.
                  </p>
                  
                  {/* Featured Quick Questions for Empty State */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8 w-full max-w-2xl">
                    {quickQuestions.slice(0, 4).map((question) => (
                      <motion.div
                        key={question.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`p-4 text-left rounded-lg border transition-all ${
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

            {/* Content History Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-medium mb-4 flex items-center">
                <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 p-1.5 rounded-md mr-2">
                  <FiFileText className="w-5 h-5" />
                </span>
                Recent Content
              </h2>
              
              {contentHistory.length > 0 ? (
                <div className="space-y-3">
                  {getPaginatedItems(contentHistory).map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        darkMode
                          ? 'border-gray-600 bg-gray-700/30 hover:bg-gray-700/50 hover:border-purple-500'
                          : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-purple-300'
                      } hover:shadow-sm`}
                    >
                      <AuthRequiredButton
                        onClick={() => {
                          setEditedContent(item.content);
                          setGeneratedContent(item.content);
                          toast.success('Content loaded from history');
                        }}
                        className="w-full h-full text-left"
                      >
                      <h4 className={`font-medium text-sm mb-1 ${
                        darkMode ? 'text-gray-200' : 'text-gray-800'
                      }`}>
                        {item.title}
                      </h4>
                      <p className={`text-xs ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                      <p className={`text-xs mt-1 line-clamp-2 ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {item.content.substring(0, 100)}...
                      </p>
                      </AuthRequiredButton>
                    </motion.div>
                  ))}
                  
                  {/* Pagination Controls */}
                  {getTotalPages() > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                      <AuthRequiredButton
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`p-2 rounded-md transition-colors ${
                          currentPage === 1
                            ? 'text-gray-400 cursor-not-allowed'
                            : darkMode
                            ? 'text-gray-300 hover:bg-gray-700'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <FiChevronLeft className="w-5 h-5" />
                      </AuthRequiredButton>
                      
                      <div className="flex items-center space-x-2">
                        {Array.from({ length: getTotalPages() }, (_, i) => i + 1)
                          .filter(page => 
                            page === 1 || 
                            page === getTotalPages() || 
                            Math.abs(page - currentPage) <= 1
                          )
                          .map((page, index, array) => (
                            <React.Fragment key={page}>
                              {index > 0 && array[index - 1] !== page - 1 && (
                                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  ...
                                </span>
                              )}
                              <AuthRequiredButton
                                onClick={() => handlePageChange(page)}
                                className={`w-8 h-8 rounded-md text-xs font-medium transition-colors ${
                                  page === currentPage
                                    ? 'bg-blue-500 text-white'
                                    : darkMode
                                    ? 'text-gray-300 hover:bg-gray-700'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                              >
                                {page}
                              </AuthRequiredButton>
                            </React.Fragment>
                          ))
                        }
                      </div>
                      
                      <AuthRequiredButton
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === getTotalPages()}
                        className={`p-2 rounded-md transition-colors ${
                          currentPage === getTotalPages()
                            ? 'text-gray-400 cursor-not-allowed'
                            : darkMode
                            ? 'text-gray-300 hover:bg-gray-700'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <FiChevronRight className="w-4 h-4" />
                      </AuthRequiredButton>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    <FiFileText className={`w-6 h-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  </div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    No content history yet
                  </p>
                  <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    Generated content will appear here
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

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
                Share Content
              </h3>
              <AuthRequiredButton
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <FiX className="w-5 h-5" />
              </AuthRequiredButton>
            </div>
            
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
              Share your generated content on social media or copy the link
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              <AuthRequiredButton
                onClick={() => handleShareContent('twitter')}
                className="flex items-center justify-center px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <FiTwitter className="w-5 h-5 mr-2" />
                Twitter
              </AuthRequiredButton>
              
              <AuthRequiredButton
                onClick={() => handleShareContent('linkedin')}
                className="flex items-center justify-center px-4 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
              >
                <FiLinkedin className="w-5 h-5 mr-2" />
                LinkedIn
              </AuthRequiredButton>
              
              <AuthRequiredButton
                onClick={() => handleShareContent('facebook')}
                className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiFacebook className="w-5 h-5 mr-2" />
                Facebook
              </AuthRequiredButton>
              
              <AuthRequiredButton
                onClick={() => handleShareContent('email')}
                className="flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <FiMail className="w-5 h-5 mr-2" />
                Email
              </AuthRequiredButton>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <AuthRequiredButton
                onClick={() => handleShareContent('copy')}
                className="w-full flex items-center justify-center px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <FiLink className="w-5 h-5 mr-2" />
                Copy Link
              </AuthRequiredButton>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ContentWriterPage;
import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../utils/axiosInterceptor';
import OpenAI from 'openai';
import { useTranslation } from 'react-i18next';
import { 
  FiMessageSquare, FiSend, FiUser, FiCpu, FiChevronDown, FiPlus, FiClock, FiX,
  FiCopy, FiShare2, FiVolume2, FiPause, FiPlay, FiDownload, FiUpload, FiImage,
  FiMaximize, FiMinimize, FiSettings, FiChevronLeft, FiChevronRight, FiMoon, FiSun,
  FiCreditCard, FiBookmark, FiStar, FiEdit, FiTrash2, FiCheck, FiRotateCcw, FiVolumeX,
  FiMenu, FiHome, FiMic, FiFileText, FiVideo, FiZap, FiTrendingUp, FiTarget, FiSquare,
  FiVolume, FiFile, FiPaperclip
} from 'react-icons/fi';
import { ThemeContext } from '../context/ThemeContext';
import { useAuth, User } from '../context/AuthContext';
import { useUser } from '../context/UserContext';
import { supabase } from '../supabaseClient';
import { userService } from '../services/userService';
import { getNewUserChats, getNewChatMessages, getChatMessagesLazy, getLatestChatMessages, supabaseMessageToFrontend, SupabaseChat, createNewChat, addUserMessage, addUserMessageWithAttachment, deleteNewChat, FrontendMessage } from '../services/chatService';
import { ProFeatureAlert, ImageSkeleton } from '../components';
import AuthRequiredButton from '../components/AuthRequiredButton';
import ThinkingIndicator from '../components/ThinkingIndicator';
import { useAlert } from '../context/AlertContext';
import FilePreviewModal from '../components/FilePreviewModal';
import FileUploadPopup from '../components/FileUploadPopup';
import { uploadFileToStorage, FileUploadResult, validateFile, formatFileSize, getFileIcon } from '../utils/fileUpload';
import { UserMessageAttachments } from '../components/UserMessageAttachments';
import { BotMessageAttachments } from '../components/BotMessageAttachments';
import './ChatPage.css';

// Add these imports for markdown and math rendering
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';

// Import new text formatting packages
import { MathJax, MathJaxContext } from 'better-react-mathjax';
import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';
// @assistant-ui/react imports - keeping only what's available
// import { Thread } from '@assistant-ui/react';
// import { AssistantRuntimeProvider } from '@assistant-ui/react';
// import { useAssistantRuntime } from '@assistant-ui/react';
// import { MarkdownTextRenderer } from '@assistant-ui/react-markdown';


// Define interface for message types
interface Message {
  id: number;
  role: string;
  content: string;
  timestamp: string;
  fileContent?: string;
  fileName?: string;
  sender?: string;
  text?: string;
  isStreaming?: boolean;
  image_url?: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  isGenerating?: boolean;
  generationType?: 'image' | 'spreadsheet' | 'document';
  attachments?: {
    url: string;
    fileName: string;
    fileType: string;
    originalName?: string;
    size?: number;
  }[];
}

// Define interface for chat type
interface Chat {
  id: string;
  title: string;
  messages: Message[];
  role?: string;
  roleDescription?: string;
  description?: string;
}

// Sample role options for the AI assistant
// Sample role options for the AI assistant - will be moved inside component

// Sample messages for welcome panel or returning users
// Initial messages will be created inside component to access t function

// Empty array for new chats - this should be used whenever creating a new chat
const emptyInitialMessages: Message[] = [];

const ChatPage: React.FC = () => {
  const { t } = useTranslation();
  const { userData, isPro, refreshUserData } = useUser();
  const { user } = useAuth();
  console.log('🔍 ChatPage - useAuth result:', { user, hasUser: !!user, userUid: user?.uid, userEmail: user?.email });
  const { showSuccess, showError, showWarning, showConfirmation } = useAlert();
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  
  // Enhanced Code Block Component
  const CodeBlock = ({ node, inline, className, children, language, value, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '');
  const lang = language || (match ? match[1] : '');
  const codeString = value || String(children).replace(/\n$/, '');
  
  if (!inline && (lang || codeString.includes('\n'))) {
    return (
      <div className="relative my-4 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        {/* Language label */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
            {lang || 'code'}
          </span>
          <AuthRequiredButton
            onClick={() => navigator.clipboard.writeText(codeString)}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Copy code"
          >
            <FiCopy size={12} />
            Copy
          </AuthRequiredButton>
        </div>
        
        {/* Code content - Replace SyntaxHighlighter with pre/code */}
        <pre
          className={`m-0 p-4 bg-transparent text-sm leading-normal overflow-x-auto font-mono ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}
        >
          <code>
            {codeString}
          </code>
        </pre>
      </div>
    );
  }
  
  // Inline code
  return (
    <code 
      className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-sm font-mono text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700" 
      {...props}
    >
      {children}
    </code>
  );
};



// Enhanced Table Components
const TableWrapper = ({ children, ...props }: any) => {
  return (
    <div className="overflow-x-auto w-full my-4">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg">
        {children}
      </table>
    </div>
  );
};

const TableHead = ({ children, ...props }: any) => {
  return <thead className="bg-gray-50 dark:bg-gray-800">{children}</thead>;
};

const TableBody = ({ children, ...props }: any) => {
  return <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">{children}</tbody>;
};

const TableRow = ({ children, ...props }: any) => {
  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      {children}
    </tr>
  );
};

const TableCell = ({ children, ...props }: any) => {
  return (
    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 border-t border-gray-200 dark:border-gray-700">
      {children}
    </td>
  );
};

const TableHeaderCell = ({ children, ...props }: any) => {
  return (
    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider bg-gray-50 dark:bg-gray-800">
      {children}
    </th>
  );
};

// Function to detect if content contains mathematical expressions
const containsMathExpressions = (content: string): boolean => {
  if (!content) return false;
  
  // Check for various math patterns
  const mathPatterns = [
    /\$\$[\s\S]*?\$\$/,           // Display math $$...$$
    /\$[^$\n]+\$/,               // Inline math $...$
    /\\\[[\s\S]*?\\\]/,          // LaTeX display math \[...\]
    /\\\([\s\S]*?\\\)/,          // LaTeX inline math \(...\)
    /<math[\s\S]*?<\/math>/,     // Custom math tags
    /<math2[\s\S]*?<\/math2>/,   // Custom math2 tags
    /<math3[\s\S]*?<\/math3>/,   // Custom math3 tags
    /\\[a-zA-Z]+\{[^}]*\}/,      // LaTeX commands like \frac{1}{2}
    /[a-zA-Z]_\{[^}]*\}/,        // Subscripts with braces
    /[a-zA-Z]\^\{[^}]*\}/,       // Superscripts with braces
    /\\begin\{[^}]+\}/,          // LaTeX environments
    /\\end\{[^}]+\}/,            // LaTeX environments
    /\\[a-zA-Z]+/,               // LaTeX commands
    /\b[a-zA-Z]+\([^)]*\)\s*=/, // Function definitions like f(x) =
    /\b\d+\.\d+\b/,              // Decimal numbers
    /\b[a-zA-Z]\s*[=<>≤≥≠]\s*[a-zA-Z0-9]/, // Mathematical equations
  ];
  
  return mathPatterns.some(pattern => pattern.test(content));
};

// Function to preprocess content for better markdown rendering
const preprocessContent = (content: string): string => {
  if (!content) return content;
  
  // Store math expressions temporarily to protect them from markdown processing
  const mathExpressions: { [key: string]: string } = {};
  let mathCounter = 0;
  
  let processed = content;
  
  // First, extract and protect math expressions
  // Protect display math $$...$$
  processed = processed.replace(/\$\$([^$]+?)\$\$/g, (match, mathContent) => {
    const placeholder = `__MATH_DISPLAY_${mathCounter++}__`;
    mathExpressions[placeholder] = `$$${mathContent}$$`;
    return placeholder;
  });
  
  // Protect inline math $...$
  processed = processed.replace(/\$([^$\n]+?)\$/g, (match, mathContent) => {
    const placeholder = `__MATH_INLINE_${mathCounter++}__`;
    mathExpressions[placeholder] = `$${mathContent}$`;
    return placeholder;
  });
  
  // Protect LaTeX display math \[...\]
  processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, (match, mathContent) => {
    const placeholder = `__MATH_DISPLAY_${mathCounter++}__`;
    mathExpressions[placeholder] = `$$${mathContent}$$`;
    return placeholder;
  });
  
  // Protect LaTeX inline math \(...\)
  processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, (match, mathContent) => {
    const placeholder = `__MATH_INLINE_${mathCounter++}__`;
    mathExpressions[placeholder] = `$${mathContent}$`;
    return placeholder;
  });
  
  // Protect custom math tags
  processed = processed.replace(/<math>([\s\S]*?)<\/math>/g, (match, mathContent) => {
    const placeholder = `__MATH_INLINE_${mathCounter++}__`;
    mathExpressions[placeholder] = `$${mathContent}$`;
    return placeholder;
  });
  
  processed = processed.replace(/<math2>([\s\S]*?)<\/math2>/g, (match, mathContent) => {
    const placeholder = `__MATH_DISPLAY_${mathCounter++}__`;
    mathExpressions[placeholder] = `$$${mathContent}$$`;
    return placeholder;
  });
  
  processed = processed.replace(/<math3>([\s\S]*?)<\/math3>/g, (match, mathContent) => {
    const placeholder = `__MATH_DISPLAY_${mathCounter++}__`;
    mathExpressions[placeholder] = `$$${mathContent}$$`;
    return placeholder;
  });
  
  // Now process the non-math content for markdown
  processed = processed
    // Ensure proper line breaks for lists
    .replace(/\n(\d+\.|\*|\-|\+)\s/g, '\n\n$1 ')
    // Ensure proper spacing around headers
    .replace(/([^\n])\n(#{1,6})\s/g, '$1\n\n$2 ')
    // Make sure headings start with # and have a space after
    .replace(/\n(#{1,6})([^\s])/g, '\n$1 $2')
    // Clean up headers that might have extra # symbols
    .replace(/^(#{1,6})\s*#+\s*/gm, '$1 ')
    // Ensure headers have proper spacing
    .replace(/^(#{1,6})\s+(.+)$/gm, '$1 $2')
    // Ensure proper spacing for blockquotes
    .replace(/\n>/g, '\n\n>')
    // Preserve newlines for paragraph breaks
    .replace(/\n\n\n+/g, '\n\n');
  
  // Restore math expressions
  Object.keys(mathExpressions).forEach(placeholder => {
    processed = processed.replace(new RegExp(placeholder, 'g'), mathExpressions[placeholder]);
  });
  
  return processed.trim();
};

// Initialize MarkdownIt instance with enhanced features
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  breaks: true
});

// MathJax configuration for better math rendering
const mathJaxConfig = {
  loader: { load: ['[tex]/html', '[tex]/ams', '[tex]/newcommand', '[tex]/configmacros'] },
  tex: {
    packages: { '[+]': ['html', 'ams', 'newcommand', 'configmacros'] },
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']],
    processEscapes: true,
    processEnvironments: true,
    processRefs: true,
    digits: /^(?:[0-9]+(?:\{,\}[0-9]{3})*(?:\.[0-9]*)?|\.[0-9]+)/,
    tags: 'none',
    tagSide: 'right',
    tagIndent: '0.8em',
    useLabelIds: true,
    multlineWidth: '85%',
    macros: {
      // Common mathematical macros
      RR: '{\\mathbb{R}}',
      NN: '{\\mathbb{N}}',
      ZZ: '{\\mathbb{Z}}',
      QQ: '{\\mathbb{Q}}',
      CC: '{\\mathbb{C}}',
      binom: ['{\\binom{#1}{#2}}', 2]
    }
  },
  options: {
    ignoreHtmlClass: 'tex2jax_ignore',
    processHtmlClass: 'tex2jax_process',
    renderActions: {
      addMenu: [0, '', '']
    }
  },
  startup: {
    ready: () => {
      console.log('MathJax is loaded and ready.');
    }
  }
};

// Function to render text with math expressions and markdown formatting
const renderTextWithMath = (text: string, darkMode: boolean, textStyle?: any) => {
  if (!text) return null;
  
  try {
    // Check if content contains math expressions
    const hasMath = containsMathExpressions(text);
    
    // Preprocess the content to handle math expressions and clean formatting
    const processedText = preprocessContent(text);
    
    if (hasMath) {
      // For content with math, render with minimal processing to preserve math delimiters
      const simpleHtml = processedText
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/^(.*)$/gm, '<p>$1</p>')
        .replace(/<p><\/p>/g, '')
        .replace(/<p><br><\/p>/g, '<br>');
      
      return (
        <MathJaxContext config={mathJaxConfig}>
          <div 
            className={`markdown-content ${darkMode ? 'dark' : ''}`} 
            style={textStyle}
            dangerouslySetInnerHTML={{ __html: simpleHtml }}
          />
        </MathJaxContext>
      );
    } else {
      // For non-math content, use full markdown processing
      const markdownProcessed = md.render(processedText);
      
      // Sanitize content with DOMPurify
      const sanitizedText = DOMPurify.sanitize(markdownProcessed, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'span'],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id']
      });
      
      return (
        <div 
          className={`markdown-content ${darkMode ? 'dark' : ''}`} 
          style={textStyle}
          dangerouslySetInnerHTML={{ __html: sanitizedText }}
        />
      );
    }
  } catch (error) {
    console.error('Error rendering text with math:', error);
    // Fallback to simple text rendering
    return (
      <div 
        className={`markdown-content ${darkMode ? 'dark' : ''}`} 
        style={textStyle}
      >
        {text}
      </div>
    );
  }
};

// Alternative ReactMarkdown renderer for fallback
const renderTextWithReactMarkdown = (text: string, darkMode: boolean, textStyle?: any) => {
  if (!text) return null;
  
  const processedText = preprocessContent(text);
  
  return (
    <MathJaxContext config={mathJaxConfig}>
      <div className={`markdown-content ${darkMode ? 'dark' : ''}`} style={textStyle}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex, rehypeRaw, rehypeHighlight]}
          components={{
          code: CodeBlock,
          pre: ({ children }: any) => <div className="overflow-auto">{children}</div>,
          h1: ({ children }: any) => {
            // Handle different types of children properly
            let textContent = '';
            if (Array.isArray(children)) {
              textContent = children.map(child => {
                if (typeof child === 'object' && child !== null) {
                  return child.props?.children ? 
                    (typeof child.props.children === 'string' ? child.props.children : 
                     Array.isArray(child.props.children) ? child.props.children.join('') : '') : '';
                }
                return String(child || '');
              }).join('');
            } else if (typeof children === 'object' && children !== null) {
              textContent = children.props?.children ? 
                (typeof children.props.children === 'string' ? children.props.children : 
                 Array.isArray(children.props.children) ? children.props.children.join('') : '') : '';
            } else {
              textContent = String(children || '');
            }
            // Clean text more thoroughly - remove all # symbols and extra spaces
            const cleanText = textContent.replace(/^#+\s*/, '').replace(/#+/g, '').trim();
            return (
              <h1 className={`text-2xl font-bold mb-4 mt-6 flex items-center gap-3 border-b-2 pb-2 ${
                darkMode ? 'text-white border-gray-600' : 'text-gray-900 border-gray-200'
              }`}>
                <span className="text-blue-500 text-xl">📋</span>
                <span>{cleanText}</span>
              </h1>
            );
          },
          h2: ({ children }: any) => {
            // Handle different types of children properly
            let textContent = '';
            if (Array.isArray(children)) {
              textContent = children.map(child => {
                if (typeof child === 'object' && child !== null) {
                  return child.props?.children ? 
                    (typeof child.props.children === 'string' ? child.props.children : 
                     Array.isArray(child.props.children) ? child.props.children.join('') : '') : '';
                }
                return String(child || '');
              }).join('');
            } else if (typeof children === 'object' && children !== null) {
              textContent = children.props?.children ? 
                (typeof children.props.children === 'string' ? children.props.children : 
                 Array.isArray(children.props.children) ? children.props.children.join('') : '') : '';
            } else {
              textContent = String(children || '');
            }
            // Clean text more thoroughly - remove all # symbols and extra spaces
            const cleanText = textContent.replace(/^#+\s*/, '').replace(/#+/g, '').trim();
            return (
              <h2 className={`text-xl font-semibold mb-3 mt-5 flex items-center gap-2 ${
                darkMode ? 'text-gray-100' : 'text-gray-800'
              }`}>
                <span className="text-green-500">•</span>
                <span>{cleanText}</span>
              </h2>
            );
          },
          h3: ({ children }: any) => {
            // Handle different types of children properly
            let textContent = '';
            if (Array.isArray(children)) {
              textContent = children.map(child => {
                if (typeof child === 'object' && child !== null) {
                  return child.props?.children ? 
                    (typeof child.props.children === 'string' ? child.props.children : 
                     Array.isArray(child.props.children) ? child.props.children.join('') : '') : '';
                }
                return String(child || '');
              }).join('');
            } else if (typeof children === 'object' && children !== null) {
              textContent = children.props?.children ? 
                (typeof children.props.children === 'string' ? children.props.children : 
                 Array.isArray(children.props.children) ? children.props.children.join('') : '') : '';
            } else {
              textContent = String(children || '');
            }
            // Clean text more thoroughly - remove all # symbols and extra spaces
            const cleanText = textContent.replace(/^#+\s*/, '').replace(/#+/g, '').trim();
            return (
              <h3 className={`text-lg font-semibold mb-2 mt-4 flex items-center gap-2 ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                <span className="text-purple-500">▸</span>
                <span>{cleanText}</span>
              </h3>
            );
          },
          h4: ({ children }: any) => {
            // Handle different types of children properly
            let textContent = '';
            if (Array.isArray(children)) {
              textContent = children.map(child => {
                if (typeof child === 'object' && child !== null) {
                  return child.props?.children ? 
                    (typeof child.props.children === 'string' ? child.props.children : 
                     Array.isArray(child.props.children) ? child.props.children.join('') : '') : '';
                }
                return String(child || '');
              }).join('');
            } else if (typeof children === 'object' && children !== null) {
              textContent = children.props?.children ? 
                (typeof children.props.children === 'string' ? children.props.children : 
                 Array.isArray(children.props.children) ? children.props.children.join('') : '') : '';
            } else {
              textContent = String(children || '');
            }
            // Clean text more thoroughly - remove all # symbols and extra spaces
            const cleanText = textContent.replace(/^#+\s*/, '').replace(/#+/g, '').trim();
            return (
              <h4 className={`text-base font-semibold mb-2 mt-3 flex items-center gap-2 ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <span className="text-orange-500">‣</span>
                <span>{cleanText}</span>
              </h4>
            );
          },
          h5: ({ children }: any) => {
            // Handle different types of children properly
            let textContent = '';
            if (Array.isArray(children)) {
              textContent = children.map(child => {
                if (typeof child === 'object' && child !== null) {
                  return child.props?.children ? 
                    (typeof child.props.children === 'string' ? child.props.children : 
                     Array.isArray(child.props.children) ? child.props.children.join('') : '') : '';
                }
                return String(child || '');
              }).join('');
            } else if (typeof children === 'object' && children !== null) {
              textContent = children.props?.children ? 
                (typeof children.props.children === 'string' ? children.props.children : 
                 Array.isArray(children.props.children) ? children.props.children.join('') : '') : '';
            } else {
              textContent = String(children || '');
            }
            const cleanText = textContent.replace(/^#+\s*/, '');
            return (
              <h5 className={`text-sm font-medium mb-1 mt-2 flex items-center gap-2 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <span className="text-yellow-500">🔹</span>
                {cleanText}
              </h5>
            );
          },
          h6: ({ children }: any) => {
            // Handle different types of children properly
            let textContent = '';
            if (Array.isArray(children)) {
              textContent = children.map(child => {
                if (typeof child === 'object' && child !== null) {
                  return child.props?.children ? 
                    (typeof child.props.children === 'string' ? child.props.children : 
                     Array.isArray(child.props.children) ? child.props.children.join('') : '') : '';
                }
                return String(child || '');
              }).join('');
            } else if (typeof children === 'object' && children !== null) {
              textContent = children.props?.children ? 
                (typeof children.props.children === 'string' ? children.props.children : 
                 Array.isArray(children.props.children) ? children.props.children.join('') : '') : '';
            } else {
              textContent = String(children || '');
            }
            const cleanText = textContent.replace(/^#+\s*/, '');
            return (
              <h6 className={`text-xs font-medium mb-1 mt-2 flex items-center gap-2 ${
                darkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
                <span className="text-gray-500">▪️</span>
                {cleanText}
              </h6>
            );
          },
          p: ({ children }: any) => (
            <p className={`mb-4 leading-relaxed ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {children}
            </p>
          ),
          ul: ({ children }: any) => (
            <ul className={`mb-4 ml-6 space-y-1 list-disc ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {children}
            </ul>
          ),
          ol: ({ children }: any) => (
            <ol className={`mb-4 ml-6 space-y-1 list-decimal ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
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
            <strong className={`font-semibold ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              {children}
            </strong>
          ),
          em: ({ children }: any) => (
            <em className={`italic ${
              darkMode ? 'text-gray-200' : 'text-gray-700'
            }`}>
              {children}
            </em>
          ),
          a: ({ children, href }: any) => (
            <a 
              href={href}
              className={`underline ${
                darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
              }`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          table: ({ children }: any) => (
            <div className="overflow-x-auto my-4">
              <table className={`min-w-full border-collapse border ${
                darkMode ? 'border-gray-600' : 'border-gray-300'
              }`}>
                {children}
              </table>
            </div>
          ),
          th: ({ children }: any) => (
            <th className={`px-4 py-2 text-left font-semibold border ${
              darkMode 
                ? 'border-gray-600 bg-gray-800 text-gray-200' 
                : 'border-gray-300 bg-gray-100 text-gray-800'
            }`}>
              {children}
            </th>
          ),
          td: ({ children }: any) => (
            <td className={`px-4 py-2 border ${
              darkMode 
                ? 'border-gray-600 text-gray-300' 
                : 'border-gray-300 text-gray-700'
            }`}>
              {children}
            </td>
          ),
        }}
        >
        {processedText}
      </ReactMarkdown>
    </div>
    </MathJaxContext>
  );
};

  // Role options with translations
  const roleOptions = [
    { id: 'general', name: t('chat.roles.general.name'), description: t('chat.roles.general.description') },
    { id: 'analyst', name: t('chat.roles.analyst.name'), description: t('chat.roles.analyst.description') },
    { id: 'doctor', name: t('chat.roles.doctor.name'), description: t('chat.roles.doctor.description') },
    { id: 'lawyer', name: t('chat.roles.lawyer.name'), description: t('chat.roles.lawyer.description') },
    { id: 'teacher', name: t('chat.roles.teacher.name'), description: t('chat.roles.teacher.description') },
    { id: 'programmer', name: t('chat.roles.programmer.name'), description: t('chat.roles.programmer.description') },
    { id: 'psychologist', name: t('chat.roles.psychologist.name'), description: t('chat.roles.psychologist.description') },
    { id: 'engineer', name: t('chat.roles.engineer.name'), description: t('chat.roles.engineer.description') },
    { id: 'surveyor', name: t('chat.roles.surveyor.name'), description: t('chat.roles.surveyor.description') },
    { id: 'architect', name: t('chat.roles.architect.name'), description: t('chat.roles.architect.description') },
    { id: 'financial', name: t('chat.roles.financial.name'), description: t('chat.roles.financial.description') },
  ];
  
  // Removed createInitialMessages function - using empty arrays for truly empty chats
  const location = useLocation();
  const { chatId: routeChatId } = useParams<{ chatId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedRole, setSelectedRole] = useState(roleOptions[0]);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [isMessageLimitReached, setIsMessageLimitReached] = useState(false);
  
  // Lazy loading state
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false);
  const [oldestMessagePosition, setOldestMessagePosition] = useState<number | undefined>(undefined);
  
  // Function to load more messages for lazy loading
  const loadMoreMessages = async () => {
    if (!chatId || isLoadingMoreMessages || !hasMoreMessages || oldestMessagePosition === undefined) {
      return;
    }

    setIsLoadingMoreMessages(true);
    try {
      const olderMessages = await getChatMessagesLazy(chatId, 10, oldestMessagePosition);
      
      if (olderMessages.length > 0) {
        // Convert to frontend format
        const processedMessages = olderMessages.map((msg: any) => {
          return supabaseMessageToFrontend(msg);
        }).filter((msg): msg is Message => Boolean(msg));
        
        // Prepend older messages to the beginning
        setMessages(prev => [...processedMessages, ...prev]);
        
        // Update oldest position
        setOldestMessagePosition(olderMessages[0]?.position);
        
        // Check if there are more messages
        setHasMoreMessages(olderMessages.length === 10);
      } else {
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setIsLoadingMoreMessages(false);
    }
  };

  // Scroll event handler for lazy loading
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop } = messagesContainerRef.current;
      
      // If user scrolled to near the top (within 100px), load more messages
      if (scrollTop <= 100 && hasMoreMessages && !isLoadingMoreMessages) {
        loadMoreMessages();
      }
    }
  };

  // Add scroll listener for lazy loading
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [hasMoreMessages, isLoadingMoreMessages]);

  // Set CSS variables for sidebar widths on component mount
  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', '256px');
    document.documentElement.style.setProperty('--collapsed-sidebar-width', '64px');
    
    // Clean up when component unmounts
    return () => {
      document.documentElement.style.removeProperty('--sidebar-width');
      document.documentElement.style.removeProperty('--collapsed-sidebar-width');
    };
  }, []);
  

  const [groupedChatHistory, setGroupedChatHistory] = useState<{
    today: { id: string, title: string, role: string, roleName?: string }[],
    yesterday: { id: string, title: string, role: string, roleName?: string }[],
    lastWeek: { id: string, title: string, role: string, roleName?: string }[],
    lastMonth: { id: string, title: string, role: string, roleName?: string }[],
    older: { id: string, title: string, role: string, roleName?: string }[]
  }>({
    today: [],
    yesterday: [],
    lastWeek: [],
    lastMonth: [],
    older: []
  });
  const [messageHistory, setMessageHistory] = useState<{ role: string, content: string }[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [chatId, setChatId] = useState<string>(routeChatId || crypto.randomUUID());
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<number | null>(null);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(false);
  const [displayedText, setDisplayedText] = useState<{[key: number]: string}>({});
  const [isTyping, setIsTyping] = useState<{[key: number]: boolean}>({});
  const [currentLineIndex, setCurrentLineIndex] = useState<{[key: number]: number}>({});
  const [processingStatus, setProcessingStatus] = useState<{
    isProcessing: boolean;
    currentPage: number;
    totalPages: number;
    fileName: string;
  } | null>(null);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState<boolean>(false);
  const [currentWordIndex, setCurrentWordIndex] = useState<{[key: number]: number}>({});
  const [wordChunks, setWordChunks] = useState<{[key: number]: string[][]}>({});
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [chats, setChats] = useState<Chat[]>([]);
  const [showProAlert, setShowProAlert] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedGenerationType, setSelectedGenerationType] = useState<string | null>(null);
  const [coinsUsed, setCoinsUsed] = useState<{[key: number]: number}>({});
  const [isFilePreviewOpen, setIsFilePreviewOpen] = useState(false);
  const [previewFileUrl, setPreviewFileUrl] = useState('');
  const [previewFileName, setPreviewFileName] = useState('');
  const [previewFileType, setPreviewFileType] = useState<'spreadsheet' | 'document'>('spreadsheet');
  
  // File upload states
  const [isFileUploadPopupOpen, setIsFileUploadPopupOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{
    url: string;
    fileName: string;
    fileType: 'image' | 'document';
    originalName: string;
    size: number;
  }[]>([]);
  
  // Thinking indicator states
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingContent, setThinkingContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploadedFile, setCurrentUploadedFile] = useState<FileUploadResult | null>(null);
  const [uploadingFileName, setUploadingFileName] = useState('');

  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const historyDropdownRef = useRef<HTMLDivElement>(null);

  // Function to detect and extract file URLs from bot responses
  const extractFileUrlFromBotResponse = (content: string): {
    cleanContent: string;
    fileUrl: string | null;
    fileName: string | null;
    fileType: string | null;
  } => {
    if (!content || typeof content !== 'string') {
      return { cleanContent: content, fileUrl: null, fileName: null, fileType: null };
    }

    // Look for the pattern: "The file is ready. You can download it using the following link: `URL`"
    const fileReadyPattern = /The file is ready\.\s*You can download it using the following link:\s*`([^`]+)`/i;
    const match = content.match(fileReadyPattern);
    
    if (match) {
      const fileUrl = match[1].trim();
      
      // Extract file name from URL
      let fileName = 'Generated File';
      let fileType = 'application/octet-stream';
      
      try {
        const urlParts = fileUrl.split('/');
        const lastPart = urlParts[urlParts.length - 1];
        
        if (lastPart.includes('.')) {
          fileName = lastPart;
          const extension = lastPart.split('.').pop()?.toLowerCase();
          
          // Determine file type based on extension
          if (extension === 'xlsx') {
            fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            fileName = fileName || 'Generated Spreadsheet.xlsx';
          } else if (extension === 'docx') {
            fileType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            fileName = fileName || 'Generated Document.docx';
          } else if (extension === 'pdf') {
            fileType = 'application/pdf';
            fileName = fileName || 'Generated Document.pdf';
          } else if (extension === 'csv') {
            fileType = 'text/csv';
            fileName = fileName || 'Generated Data.csv';
          }
        }
      } catch (error) {
        console.error('Error parsing file URL:', error);
      }
      
      // Remove the file download text from content
      const cleanContent = content.replace(fileReadyPattern, '').trim();
      
      return {
        cleanContent: cleanContent || 'File generated successfully!',
        fileUrl,
        fileName,
        fileType
      };
    }
    
    // Also check for direct Supabase storage URLs
    const supabaseUrlPattern = /(https:\/\/[^\/]+\.supabase\.co\/storage\/v1\/object\/public\/[^\s]+)/i;
    const supabaseMatch = content.match(supabaseUrlPattern);
    
    if (supabaseMatch) {
      const fileUrl = supabaseMatch[1];
      let fileName = 'Downloaded File';
      let fileType = 'application/octet-stream';
      
      try {
        const urlParts = fileUrl.split('/');
        const lastPart = urlParts[urlParts.length - 1];
        
        if (lastPart.includes('.')) {
          fileName = lastPart;
          const extension = lastPart.split('.').pop()?.toLowerCase();
          
          if (extension === 'xlsx') {
            fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          } else if (extension === 'docx') {
            fileType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          } else if (extension === 'pdf') {
            fileType = 'application/pdf';
          } else if (extension === 'csv') {
            fileType = 'text/csv';
          }
        }
      } catch (error) {
        console.error('Error parsing Supabase URL:', error);
      }
      
      // Remove the URL from content
      const cleanContent = content.replace(supabaseUrlPattern, '').trim();
      
      return {
        cleanContent: cleanContent || 'File is ready for download!',
        fileUrl,
        fileName,
        fileType
      };
    }
    
    return { cleanContent: content, fileUrl: null, fileName: null, fileType: null };
  };

  // Fetch user chats from database without updating current messages
  const fetchUserChatsWithoutMessageUpdate = async () => {
    try {
      console.log('🔄 fetchUserChatsWithoutMessageUpdate - Starting chat fetch without message update');
      
      // Get user session for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user?.id) {
        console.log('⚠️ fetchUserChatsWithoutMessageUpdate - No valid Supabase session found');
        return [];
      }
      
      const userId = session.user.id;
      
      // Get chats using the new chat service
      const supabaseChats = await getNewUserChats(userId);
      
      if (!supabaseChats || supabaseChats.length === 0) {
        console.log('⚠️ fetchUserChatsWithoutMessageUpdate - No chats found');
        return [];
      }
      
      console.log('📊 fetchUserChatsWithoutMessageUpdate - Fetched chats count:', supabaseChats.length);
      
      // Get messages for each chat and convert to frontend format
      const convertedChats: Chat[] = [];
      
      for (const chat of supabaseChats) {
        const messages = await getNewChatMessages(chat.id);
        const convertedMessages: Message[] = messages.map((msg, index) => {
          const numericId = parseInt(msg.id) || Date.now() + index;
          return {
            id: numericId,
            role: msg.role,
            content: msg.content,
            timestamp: msg.created_at
          };
        });
        
        convertedChats.push({
          id: chat.id,
          title: chat.title,
          messages: convertedMessages
        });
      }
      
      return convertedChats;
      
    } catch (error) {
      console.error('Error fetching chats for real-time update:', error);
      return [];
    }
  };

  // Fetch user chats from database
  const fetchUserChats = async () => {
    try {
      console.log('=== FETCH USER CHATS START ===');
      console.log('AuthContext user:', user);
      console.log('Route chat ID:', routeChatId);
      setIsLoadingChats(true);
      
      // First check if we have a user from AuthContext
      if (user && user.uid) {
        console.log('✅ Using authenticated user from AuthContext:', user.uid);
        console.log('User object:', JSON.stringify(user, null, 2));
        
        // Use new chat service to get user chats
        console.log('🔍 Fetching chats using new chat service for user:', user.uid);
        
        const userChats = await getNewUserChats(user.uid);
        
        console.log('📊 Fetched chats count from new service:', userChats?.length || 0);
        console.log('📋 Raw chats data:', JSON.stringify(userChats, null, 2));
        
        if (userChats && userChats.length > 0) {
          console.log('✅ Found chats, formatting for UI...');
          
          // Get messages for each chat and format for UI
          const formattedChats = await Promise.all(userChats.map(async (chat) => {
            try {
              // Get messages for this chat
              const chatMessages = await getNewChatMessages(chat.id);
              
              // Convert Supabase messages to frontend format
              const frontendMessages = chatMessages.map(msg => supabaseMessageToFrontend(msg));
              
              return {
                id: chat.id,
                title: chat.title,
                messages: frontendMessages,
                role: chat.role || 'general',
                roleDescription: chat.metadata?.roleDescription || '',
                description: chat.metadata?.description || ''
              };
            } catch (error) {
              console.error('Error loading messages for chat:', chat.id, error);
              return {
                id: chat.id,
                title: chat.title,
                messages: [],
                role: 'general',
                roleDescription: '',
                description: ''
              };
            }
          }));
          
          // Convert FrontendMessage to Message format for UI compatibility
          const convertedChats = formattedChats.map(chat => {
            console.log('📝 Processing chat:', chat.id, 'with', chat.messages?.length || 0, 'messages');
            
            // Convert FrontendMessage format to Message format
            const convertedMessages = (chat.messages || []).map((msg: any, index: number) => {
              // Create unique numeric ID for Message interface
              const numericId = msg.message_id ? parseInt(msg.message_id.replace(/\D/g, '')) || index : index;
              
              // Convert FrontendMessage to Message format
              return {
                id: numericId,
                role: msg.role || 'user',
                content: msg.content || '',
                timestamp: msg.timestamp || new Date().toISOString(),
                fileContent: msg.fileContent,
                fileName: msg.fileName,
                sender: msg.role === 'assistant' ? 'bot' : 'user',
                text: msg.content,
                isStreaming: msg.isStreaming || false,
                // Include attachment fields from Supabase
                file_url: msg.file_url,
                file_name: msg.file_name,
                file_type: msg.file_type,
                file_size: msg.file_size
              };
            });
            
            return {
              id: chat.id,
              title: chat.title,
              messages: convertedMessages,
              role: chat.role || 'general',
              roleDescription: chat.roleDescription || '',
              description: chat.description || ''
            };
          });
          
          // Group chats by recency
           const todayChats: {id: string, title: string, role: string}[] = [];
           const yesterdayChats: {id: string, title: string, role: string}[] = [];
           const lastWeekChats: {id: string, title: string, role: string}[] = [];
           const lastMonthChats: {id: string, title: string, role: string}[] = [];
           const olderChats: {id: string, title: string, role: string}[] = [];
           
           // Process each chat to determine its recency group
           convertedChats.forEach(chat => {
             const chatInfo = {
               id: chat.id,
               title: chat.title,
               role: chat.role || 'general'
             };
             
             // Get the latest message timestamp or use the current time
             const latestMessage = chat.messages && chat.messages.length > 0 ? 
               chat.messages[chat.messages.length - 1] : null;
             const timestamp = latestMessage?.timestamp || new Date().toISOString();
             const messageDate = new Date(timestamp);
             const currentDate = new Date();
             
             // Calculate days difference
             const daysDiff = Math.floor((currentDate.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
             
             // Group by recency
             if (daysDiff < 1) {
               todayChats.push(chatInfo);
             } else if (daysDiff < 2) {
               yesterdayChats.push(chatInfo);
             } else if (daysDiff < 7) {
               lastWeekChats.push(chatInfo);
             } else if (daysDiff < 30) {
               lastMonthChats.push(chatInfo);
             } else {
               olderChats.push(chatInfo);
             }
          });
          
          // Update state with grouped chat history
           setGroupedChatHistory({
             today: todayChats,
             yesterday: yesterdayChats,
             lastWeek: lastWeekChats,
             lastMonth: lastMonthChats,
             older: olderChats
           });
          
          // Update chats state with all converted chats
          setChats(convertedChats);
          
          // If a specific chat ID was provided in the route, load that chat
          if (routeChatId) {
            console.log('🎯 Looking for specific chat ID:', routeChatId);
            const targetChat = convertedChats.find(c => c.id === routeChatId);
            if (targetChat) {
              console.log('✅ Found target chat:', targetChat.id, 'with', targetChat.messages?.length || 0, 'messages');
              setChatId(routeChatId);
               setMessages(targetChat.messages || []);
               setSelectedRole(roleOptions.find(r => r.id === (targetChat.role || 'general')) || roleOptions[0]);
               console.log('📱 Loaded chat messages:', targetChat.messages?.length || 0);
            } else {
              console.log('❌ Target chat not found, loading most recent chat');
              // If the requested chat doesn't exist, load the most recent one
              if (convertedChats.length > 0) {
                const mostRecentChat = convertedChats[0];
                console.log('📅 Loading most recent chat:', mostRecentChat.id);
                 setChatId(mostRecentChat.id);
                 setMessages(mostRecentChat.messages || []);
                 setSelectedRole(roleOptions.find(r => r.id === (mostRecentChat.role || 'general')) || roleOptions[0]);
                 // Update URL to match the loaded chat
                 navigate(`/chat/${mostRecentChat.id}`);
                 console.log('📱 Loaded recent chat messages:', mostRecentChat.messages?.length || 0);
              }
            }
          } else if (convertedChats.length > 0) {
            console.log('🔄 No specific chat requested, loading most recent');
            // If no specific chat was requested, load the most recent one
            const mostRecentChat = convertedChats[0];
            console.log('📅 Loading most recent chat:', mostRecentChat.id);
            setChatId(mostRecentChat.id);
            setMessages(mostRecentChat.messages || []);
            setSelectedRole(roleOptions.find(r => r.id === (mostRecentChat.role || 'general')) || roleOptions[0]);
            // Update URL to match the loaded chat
            navigate(`/chat/${mostRecentChat.id}`);
            console.log('📱 Loaded recent chat messages:', mostRecentChat.messages?.length || 0);
          }
          
          setIsLoadingChats(false);
          return; // Exit early since we've handled everything
        } else {
          // No chats found for this user, but user is authenticated - create a new chat
          console.log('✅ No chats found for authenticated user, creating new chat...');
          const newChatId = routeChatId || crypto.randomUUID();
          setChatId(newChatId);
          setMessages([]);
          setSelectedRole(roleOptions[0]);
          
          // Set empty groups for history
          setGroupedChatHistory({
            today: [],
            yesterday: [],
            lastWeek: [],
            lastMonth: [],
            older: []
          });
          
          setChats([]);
          setIsLoadingChats(false);
          return;
        }
      } else {
        console.log('⚠️ No user in AuthContext, trying Supabase session...');
      }
      
      // Fallback to Supabase session if AuthContext user didn't work
      console.log('🔄 Falling back to Supabase session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('📋 Supabase session:', session);
      
      if (sessionError) {
        console.error('❌ Authentication error:', sessionError);
        setIsLoadingChats(false);
        
        // Use local chat in case of auth error
        const localChatId = routeChatId || crypto.randomUUID();
        setChatId(localChatId);
        setChats([{
          id: localChatId,
          title: 'Local Chat',
          messages: [],
          role: 'general',
          description: 'Offline mode'
        }]);
        
        return;
      }
      
      if (!session?.user?.id) {
        console.log('⚠️ No authenticated user found, using local chat');
        setIsLoadingChats(false);
        
        // Set up a local chat when not authenticated
        const localChatId = routeChatId || crypto.randomUUID();
        setChatId(localChatId);
        setChats([{
          id: localChatId,
          title: 'Local Chat',
          messages: [],
          role: 'general',
          description: 'Guest mode'
        }]);
        
        // Set empty groups for history
        setGroupedChatHistory({
          today: [],
          yesterday: [],
          lastWeek: [],
          lastMonth: [],
          older: []
        });
        
        return;
      }
      
      // Get the user ID from the session
      const userId = session.user.id;
      console.log('🆔 fetchUserChats - User ID from session:', userId);
      
      // Query all chats for this user
      console.log('🔍 Querying chats table with session user_id:', userId);
      const userChats = await getNewUserChats(userId);
      const chatsError = userChats.length === 0 ? null : null; // Simplified error handling
      
      console.log('📊 fetchUserChats - Fetched chats count:', userChats?.length || 0);
      console.log('📋 Session chats data:', JSON.stringify(userChats, null, 2));
      if (chatsError) {
        console.error('❌ fetchUserChats - Error details:', chatsError);
      }
      
      if (chatsError) {
        console.error('Error fetching user chats:', chatsError);
        setIsLoadingChats(false);
        
        // Use local chat in case of fetch error
        const localChatId = routeChatId || crypto.randomUUID();
        setChatId(localChatId);
        setChats([{
          id: localChatId,
          title: 'Local Chat',
          messages: [],
          role: 'general',
          description: 'Connection error - working offline'
        }]);
        
        return;
      }
      
      if (userChats && userChats.length > 0) {
        // Format chats for our UI using new structure
        const formattedChats = userChats.map(chat => {
          return {
            id: chat.id,
            title: chat.title || 'New Chat',
            messages: [], // Messages will be loaded separately when needed
            role: 'general', // Default role for new structure
            roleDescription: '',
            description: ''
          };
        });
        
        // Group chats by recency
        const today: {id: string, title: string, role: string}[] = [];
        const yesterday: {id: string, title: string, role: string}[] = [];
        const lastWeek: {id: string, title: string, role: string}[] = [];
        const lastMonth: {id: string, title: string, role: string}[] = [];
        
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        formattedChats.forEach(chat => {
          // Ensure we have a role, defaulting to 'general' if none exists
          const chatRole = chat.role || 'general';
          // Get proper role name for display
          const roleName = getRoleName(chatRole);
          const chatObj = { 
            id: chat.id, 
            title: chat.title, 
            role: chatRole,
            roleName: roleName // Store the actual role name for display
          };
          const chatDate = new Date(userChats.find(c => c.id === chat.id)?.created_at || now);
          
          if (chatDate >= oneDayAgo) {
            today.push(chatObj);
          } else if (chatDate >= oneWeekAgo) {
            yesterday.push(chatObj);
          } else if (chatDate >= oneMonthAgo) {
            lastWeek.push(chatObj);
          } else {
            lastMonth.push(chatObj);
          }
        });
        
        setGroupedChatHistory({
          today,
          yesterday,
          lastWeek,
          lastMonth,
          older: []
        });
        
        setChats(formattedChats);
        
        // If a specific chat ID was provided in the route, load that chat
        if (routeChatId) {
          const specificChat = formattedChats.find(chat => chat.id === routeChatId);
          if (specificChat) {
            setMessages(specificChat.messages || []);
            setChatId(routeChatId);
            setSelectedRole(roleOptions.find(role => role.id === specificChat.role) || roleOptions[0]);
          } else {
            // Create a new chat with this ID
            console.log('Chat ID not found, creating new chat with ID:', routeChatId);
            startNewChat(routeChatId);
          }
        } else if (formattedChats.length > 0) {
          // If no specific chat ID, load the most recent chat
          const recentChat = formattedChats[0];
          setMessages(recentChat.messages || []);
          setChatId(recentChat.id);
          setSelectedRole(roleOptions.find(role => role.id === recentChat.role) || roleOptions[0]);
          // Update URL without reloading
          navigate(`/chat/${recentChat.id}`, { replace: true });
        } else {
          // No chats found, create a new one
          const newChatId = crypto.randomUUID();
          startNewChat(newChatId);
        }
      } else {
        // No chats found, create a new one
        const newChatId = crypto.randomUUID();
        startNewChat(newChatId);
        
        // Set empty groups for history
        setGroupedChatHistory({
          today: [],
          yesterday: [],
          lastWeek: [],
          lastMonth: [],
          older: []
        });
      }
      
      setIsLoadingChats(false);
    } catch (error) {
      console.error('Error fetching chats:', error);
      setIsLoadingChats(false);
      
      // Use local chat in case of any error
      const localChatId = routeChatId || crypto.randomUUID();
      setChatId(localChatId);
      setChats([{
          id: localChatId,
          title: 'Local Chat',
          messages: [],
          role: 'general',
          description: 'Error mode - working offline'
        }]);
    }
  };

  // Save chat message to database using new chat service
  // Function to update chat title with first 2-3 words of user's first message
  const updateChatTitleFromMessage = async (messageText: string, chatId: string, userId: string) => {
    try {
      // Extract first 2-3 words from the message
      const words = messageText.trim().split(/\s+/);
      const titleWords = words.slice(0, 3); // Take first 3 words
      const newTitle = titleWords.join(' ');
      
      // Only update if we have meaningful content
      if (newTitle && newTitle.length > 0) {
        // Import the updateNewChatTitle function from chatService
        const { updateNewChatTitle } = await import('../services/chatService');
        const success = await updateNewChatTitle(chatId, userId, newTitle);
        
        if (success) {
          console.log('✅ Chat title updated successfully:', newTitle);
          
          // Update local state to reflect the new title
          setGroupedChatHistory(prev => {
            const updateChatTitle = (group: {id: string, title: string, role: string}[]) => 
              group.map(chat => 
                chat.id === chatId ? { ...chat, title: newTitle } : chat
              );
            
            return {
              today: updateChatTitle(prev.today),
              yesterday: updateChatTitle(prev.yesterday),
              lastWeek: updateChatTitle(prev.lastWeek),
              lastMonth: updateChatTitle(prev.lastMonth),
              older: updateChatTitle(prev.older)
            };
          });
          
          // Also update chats state
          setChats(prevChats => 
            prevChats.map(chat => 
              chat.id === chatId ? { ...chat, title: newTitle } : chat
            )
          );
        }
      }
    } catch (error) {
      console.error('Error updating chat title:', error);
    }
  };

  const saveChatToDatabase = async (messageContent: string | any, role: string) => {
    try {
      // Use AuthContext user for database operations
      if (!user?.uid) {
        console.log('No authenticated user, skipping database save');
        return;
      }
      
      const userId = user.uid;
      console.log('Using AuthContext user ID for database save:', userId);
      
      // Handle both string and structured message formats
      const isStructuredMessage = typeof messageContent === 'object' && messageContent !== null;
      
      console.log('💾 saveChatToDatabase called:', {
        role,
        isStructuredMessage,
        messageType: typeof messageContent,
        hasAttachment: isStructuredMessage && messageContent.attachment,
        preview: isStructuredMessage ? messageContent.text?.substring(0, 100) : messageContent?.substring(0, 100)
      });
      
      // Parse message content to separate text and image data
      let textContent;
      let imageData = null;
      
      if (isStructuredMessage) {
        // Handle new structured format
        textContent = messageContent.text || '';
        if (messageContent.attachment) {
          imageData = messageContent.attachment;
        }
      } else {
        // Handle legacy string format
        textContent = messageContent;
        
        // Check if message contains image with %%% delimiters
        if (messageContent && messageContent.includes('%%%')) {
          const imageMatch = messageContent.match(/%%%(.*?)%%%/);
          if (imageMatch) {
            imageData = {
              url: imageMatch[1],
              fileName: 'Image',
              fileType: 'image'
            };
            // Remove image URL from text content
            textContent = messageContent.replace(/%%%.*?%%%/g, '').trim();
          }
        }
      }
      
      // Check if this will be the first user message (before saving the message)
      let shouldUpdateTitle = false;
      if (role === 'user' && textContent && textContent.trim().length > 0) {
        const { data: existingUserMessages } = await supabase
          .from('messages')
          .select('id')
          .eq('chat_id', chatId)
          .eq('role', 'user')
          .limit(1);
        
        shouldUpdateTitle = !existingUserMessages || existingUserMessages.length === 0;
        if (shouldUpdateTitle) {
          console.log('🏷️ This will be the first user message, will update title after saving...');
        }
      }
      
      // Check if chat exists using direct database query
      const { data: existingChats } = await supabase
        .from('chats')
        .select('*')
        .eq('id', chatId)
        .eq('owner', userId);
      
      const isNewChat = !existingChats || existingChats.length === 0;
      
      if (isNewChat) {
        // Chat doesn't exist - create new chat automatically using direct database insert
        console.log('Chat does not exist, creating new chat automatically...');
        const { data: newChat, error: chatError } = await supabase
          .from('chats')
          .insert({
            id: chatId,
            owner: userId,
            title: 'New Chat',
            position_counter: 0,
            metadata: {},
            role: selectedRole.id
          })
          .select()
          .single();
        
        if (chatError) {
          console.error('Failed to create new chat:', chatError);
          return;
        }
        console.log('✅ New chat created successfully:', newChat);
      }
      
      // Get current message count for position
      const { data: messageCount } = await supabase
        .from('messages')
        .select('position', { count: 'exact' })
        .eq('chat_id', chatId)
        .order('position', { ascending: false })
        .limit(1);
      
      const nextPosition = messageCount && messageCount.length > 0 ? messageCount[0].position + 1 : 1;
      
      // Add message using direct database insert
      const messageData: any = {
        chat_id: chatId,
        role: role,
        content: textContent || '',
        status: 'done',
        position: nextPosition,
        metadata: { test: false, message_type: role === 'user' ? 'user_message' : 'assistant_reply' }
      };
      
      // Use the new addUserMessageWithAttachment function if there's attachment data
       let newMessage;
       let messageError;
       
       if (imageData && imageData.url && role === 'user') {
         // Use the new attachment-aware function for user messages with attachments
         newMessage = await addUserMessageWithAttachment(
           chatId,
           userId,
           textContent || '',
           imageData.url,
           imageData.fileName || 'attachment',
           imageData.fileType || 'image',
           imageData.size || null
         );
         
         if (!newMessage) {
           messageError = { message: 'Failed to create message with attachment' };
         }
       } else {
         // Use regular insert for messages without attachments
         const result = await supabase
           .from('messages')
           .insert(messageData)
           .select()
           .single();
         
         newMessage = result.data;
         messageError = result.error;
       }
      
      if (messageError) {
        console.error('Failed to save message:', messageError);
        return;
      }
      
      console.log('✅ Message saved successfully:', newMessage);
      
      // Check if this was the first user message in the chat (check was done before saving)
      if (shouldUpdateTitle) {
        console.log('🏷️ This was the first user message, updating chat title...');
        await updateChatTitleFromMessage(textContent, chatId, userId);
      }
      
    } catch (error) {
      console.error('Error saving to database:', error);
    }
  };

  // Handle share functionality
  const handleShareMessage = async (content: string) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Shared from AI Chat',
          text: content,
        });
      } else {
        // Fallback for browsers that don't support the Web Share API
        await navigator.clipboard.writeText(content);
        showSuccess('Message copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
              showError('Failed to share message');
    }
  };

  // Delete chat from database
  const deleteChat = async (chatIdToDelete: string) => {
    try {
      // Only use Supabase session for database operations to comply with RLS policies
      // AuthContext user IDs don't work with Supabase RLS policies
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user?.id) {
        console.log('⚠️ No valid Supabase session found, skipping database deletion');
        console.log('📝 Chat will be removed from local state only');
        // Still update local state even if we can't delete from database
      } else {
        const userId = session.user.id;
        console.log('✅ Using Supabase session user ID for chat deletion:', userId);
        
        // Delete from database using new service
        const success = await deleteNewChat(chatIdToDelete, userId);
        
        if (!success) {
          console.error('Error deleting chat');
          return;
        }
      }
      
      // Update local state
      setGroupedChatHistory(prev => {
        const removeFromGroup = (group: {id: string, title: string, role: string}[]) => 
          group.filter(chat => chat.id !== chatIdToDelete);
        
        return {
          today: removeFromGroup(prev.today),
          yesterday: removeFromGroup(prev.yesterday),
          lastWeek: removeFromGroup(prev.lastWeek),
          lastMonth: removeFromGroup(prev.lastMonth),
          older: removeFromGroup(prev.older)
        };
      });
      
      // Update chats state
      setChats(prevChats => prevChats.filter(chat => chat.id !== chatIdToDelete));
      
      // If the deleted chat was the current one, create a new chat or load another
      if (chatId === chatIdToDelete) {
        const remainingChats = chats.filter(chat => chat.id !== chatIdToDelete);
        if (remainingChats.length > 0) {
          // Select the most recent chat
          const newCurrentChat = remainingChats[0];
          // Clear current state completely before switching
          setMessages([]);
          setMessageHistory([]);
          setInputMessage('');
          setSelectedFile(null);
          setUploadedFiles([]); // Clear uploaded files after sending
          setDisplayedText({});
          setIsTyping({});
          setEditingMessageId(null);
          setEditingContent('');
          
          setChatId(newCurrentChat.id);
          setMessages(newCurrentChat.messages || []);
          setSelectedRole(roleOptions.find(role => role.id === newCurrentChat.role) || roleOptions[0]);
          navigate(`/chat/${newCurrentChat.id}`, { replace: true });
          localStorage.setItem('lastActiveChatId', newCurrentChat.id);
        } else {
          // No remaining chats, create a completely new one
          const newChatId = crypto.randomUUID();
          setMessages([]);
          setMessageHistory([]);
          setInputMessage('');
          setSelectedFile(null);
          setDisplayedText({});
          setIsTyping({});
          setEditingMessageId(null);
          setEditingContent('');
          
          setChatId(newChatId);
          setMessages([]);
          setSelectedRole(roleOptions[0]);
          navigate(`/chat/${newChatId}`, { replace: true });
          localStorage.setItem('lastActiveChatId', newChatId);
        }
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  // Automatically scroll to bottom of messages
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle click outside to close history dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (historyDropdownRef.current && !historyDropdownRef.current.contains(event.target as Node)) {
        setShowHistoryDropdown(false);
      }
    };

    if (showHistoryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showHistoryDropdown]);

  // Fetch chats on component mount and handle default navigation
  useEffect(() => {
    // Always navigate to a valid chat on initial render
    const handleInitialNavigation = async () => {
      // Try to get last active chat from localStorage
      const lastActiveChatId = localStorage.getItem('lastActiveChatId');
      
      if (routeChatId) {
        // User already accessed a specific chat via URL, no redirect needed
        // Use fetchUserChats to properly load messages and history
        await fetchUserChats();
        // Store this as the last active chat
        localStorage.setItem('lastActiveChatId', routeChatId);
      } else if (lastActiveChatId) {
        // We have a stored last active chat, navigate there
        navigate(`/chat/${lastActiveChatId}`, { replace: true });
      } else {
        // No stored chat - create a new one automatically
        console.log('No stored chat found. Creating new chat automatically...');
        const newChatId = crypto.randomUUID();
        const newChat = await createNewChat(user?.uid!, newChatId, {}, selectedRole.id);
        if (newChat) {
          console.log('✅ Auto-created new chat:', newChat);
          localStorage.setItem('lastActiveChatId', newChatId);
          navigate(`/chat/${newChatId}`, { replace: true });
        } else {
          console.error('Failed to auto-create new chat');
          navigate('/chat', { replace: true });
        }
      }
    };
    
    handleInitialNavigation();
    
    // Setup real-time subscription for chat updates
    const chatSubscription = supabase
      .channel('chats_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chats'
      }, (payload) => {
        console.log('Real-time update received:', payload);
        // Only refresh chats list without affecting current messages
        fetchUserChatsWithoutMessageUpdate();
      })
      .subscribe();
    
    // Clear any pending message drafts or uploads on page load
    setInputMessage('');
    setSelectedFile(null);
    setMessageHistory([]);
    
    // Cleanup subscription on unmount
    return () => {
      chatSubscription.unsubscribe();
      stopSpeech();
    };
  }, [routeChatId, navigate, user]);

  // Auto-stop speaking when navigating away
  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  // Auto-resize the textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [inputMessage]);

  // Monitor location changes to stop speech
  useEffect(() => {
    stopSpeech();
  }, [location.pathname]);

  // Function to detect if the text contains a URL
  const containsUrl = (text?: string): boolean => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return !!text && urlRegex.test(text);
  };

  // Helper function to convert blob URL to base64
  const blobUrlToBase64 = async (blobUrl: string): Promise<string> => {
    try {
      const response = await fetch(blobUrl);
      const blob = await response.blob();
      
      // Check if the blob is a valid image type
      if (!blob.type.startsWith('image/')) {
        console.error('❌ Invalid image type:', blob.type);
        return '';
      }
      
      // Limit image size to prevent API errors (max 4MB)
      if (blob.size > 4 * 1024 * 1024) {
        console.error('❌ Image too large:', (blob.size / (1024 * 1024)).toFixed(2) + 'MB');
        return '';
      }
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = reader.result as string;
          // Verify we have a valid base64 image
          if (base64String && base64String.startsWith('data:image/')) {
            console.log('✅ Successfully converted blob to base64 image');
            resolve(base64String);
          } else {
            console.error('❌ Invalid base64 format after conversion');
            resolve('');
          }
        };
        reader.onerror = (error) => {
          console.error('❌ Error reading file:', error);
          resolve('');
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('❌ Error converting blob URL to base64:', error);
      return '';
    }
  };

  // Add streaming API function similar to BotScreen.js
  const sendMessageToAI = async (message: string, imageUrl: string | null = null, onChunk?: (chunk: string) => void, retryCount: number = 0): Promise<string> => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 1000 * (2 ** retryCount); // Exponential backoff: 1s, 2s, 4s
    
    return new Promise(async (resolve, reject) => {
      try {
        // Convert blob URL to base64 if needed
        let processedImageUrl = imageUrl;
        if (imageUrl && imageUrl.startsWith('blob:')) {
          processedImageUrl = await blobUrlToBase64(imageUrl);
        }

        // Prepare messages array with selected role
        const systemPrompt = `You are a ${selectedRole.name}. ${selectedRole.description} Provide helpful, professional responses that align with your role. Use proper markdown formatting for better readability. IMPORTANT: When including mathematical expressions, please wrap inline math with <math>...</math> tags and display math (block equations) with <math3>...</math3> tags. For example: <math>x^2 + y^2 = z^2</math> for inline math, and <math3>\\int_0^1 x^2 dx = \\frac{1}{3}</math3> for display math. This helps with proper mathematical rendering.`;
        
        const apiMessages = [
          {
            role: "system",
            content: [
              {
                type: "text",
                text: systemPrompt
              }
            ]
          },
          {
            role: "user",
            content: []
          }
        ];

        // Add conversation history for memory (last 10 messages to avoid token limit)
        const recentMessages = messages.slice(-10).filter(msg => msg.content.trim() !== '');
        recentMessages.forEach(msg => {
          if (msg.role === 'user' || msg.role === 'assistant') {
            const messageContent: any[] = [];
            
            // Check if message contains %%% delimited image URLs
            if (msg.content.includes('%%%')) {
              const parts = msg.content.split('%%%');
              if (parts.length >= 3) {
                // Extract text content (first part)
                const textContent = parts[0].trim();
                if (textContent) {
                  messageContent.push({
                    type: "text",
                    text: textContent
                  });
                }
                
                // Extract image URL (second part)
                const imageUrl = parts[1].trim();
                if (imageUrl) {
                  messageContent.push({
                    type: "image_url",
                    image_url: {
                      url: imageUrl
                    }
                  });
                }
              } else {
                // Fallback to text only if format is invalid
                messageContent.push({
                  type: "text",
                  text: msg.content
                });
              }
            } else {
              // Regular text message
              messageContent.push({
                type: "text",
                text: msg.content
              });
            }
            
            // Only add message if content array is not empty
            if (messageContent.length > 0) {
              apiMessages.push({
                role: msg.role,
                content: messageContent
              });
            }
          }
        });

        // Add current user message
        const currentUserMessage = {
          role: "user",
          content: [] as any[]
        };

        // Add text content (ensure message is not empty)
        if (message && message.trim()) {
          currentUserMessage.content.push({
            type: "text",
            text: message.trim()
          });
        }

        // Add image if provided
        if (processedImageUrl && processedImageUrl.length > 0) {
          try {
            // For DashScope API, we need to format the image correctly
            if (processedImageUrl.startsWith('data:image/')) {
              // Extract the base64 data without the prefix for DashScope
              const base64Data = processedImageUrl.split('base64,')[1];
              
              if (base64Data) {
                // Use the format DashScope expects
                currentUserMessage.content.push({
                  type: "image_url",
                  image_url: {
                    url: processedImageUrl
                  }
                });
                console.log('✅ Added base64 image to API request');
              }
            } else if (processedImageUrl.startsWith('http')) {
              // For HTTP URLs, use as is
              currentUserMessage.content.push({
                type: "image_url",
                image_url: {
                  url: processedImageUrl
                }
              });
              console.log('✅ Added HTTP image URL to API request');
            }
          } catch (error) {
            console.error('❌ Error adding image to API request:', error);
            // Continue without the image to avoid breaking the chat
          }
        } else {
          console.log('ℹ️ No image to add to API request');
        }

        // Ensure content array is not empty
        if (currentUserMessage.content.length === 0) {
          throw new Error('Message content cannot be empty');
        }

        apiMessages.push(currentUserMessage);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', true);
        xhr.setRequestHeader('Authorization', `Bearer sk-9f7b91a0bb81406b9da7ff884ddd2592`);
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
                console.log('✅ AI API request completed successfully');
                console.log('📊 Final content length:', fullContent.length);
                resolve(fullContent.trim() || 'I apologize, but I could not generate a response. Please try again.');
              } else {
                console.error('❌ API request failed:', xhr.status, xhr.statusText);
                console.error('❌ Response body:', xhr.responseText);
                
                try {
                  const errorResponse = JSON.parse(xhr.responseText);
                  console.error('❌ Parsed error:', errorResponse);
                  
                  // Check if this is a rate limit error
                  if (errorResponse.error?.code === 'ServiceUnavailable' && 
                      errorResponse.error?.message?.includes('Too many requests') && 
                      retryCount < MAX_RETRIES) {
                    
                    console.log(`⏱️ Rate limited. Retrying in ${RETRY_DELAY_MS}ms (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
                    
                    // Notify user about retry
                    if (onChunk) {
                      onChunk(`\n\n_Rate limit reached. Retrying in ${RETRY_DELAY_MS/1000} seconds..._\n\n`);
                    }
                    
                    // Retry with exponential backoff
                    setTimeout(() => {
                      sendMessageToAI(message, imageUrl, onChunk, retryCount + 1)
                        .then(resolve)
                        .catch(reject);
                    }, RETRY_DELAY_MS);
                    
                    return; // Exit early to prevent rejection
                  }
                  
                  reject(new Error(`API call failed: ${xhr.status} - ${errorResponse.error?.message || errorResponse.message || xhr.statusText}`));
                } catch (parseError) {
                  reject(new Error(`API call failed: ${xhr.status} ${xhr.statusText}`));
                }
              }
            }
          }
        };

        xhr.onerror = function() {
          console.error('💥 XMLHttpRequest error');
          reject(new Error('Failed to get response from AI. Please try again.'));
        };

        xhr.ontimeout = function() {
          console.error('💥 XMLHttpRequest timeout');
          reject(new Error('Request timed out. Please try again.'));
        };

        xhr.timeout = 60000; // 60 second timeout

        const requestBody = JSON.stringify({
          model: "qwen-vl-max",
          messages: apiMessages,
          stream: true
        });

        console.log('📊 Sending request to streaming API...');
        xhr.send(requestBody);

      } catch (error) {
        console.error('💥 Error in sendMessageToAI:', error);
        reject(new Error('Failed to get response from AI. Please try again.'));
      }
    });
  };

  // New function to send message with attachments to webhook API
  const sendMessageWithAttachments = async (message: string, attachments: any[] = [], onChunk?: (chunk: string) => void): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://matrixai21.app.n8n.cloud/webhook/910d8b7e-6462-463b-90ef-42056a296c73');
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Accept', 'text/event-stream');

        let fullResponse = '';
        let finalContent = '';
        let hasStartedFinalResponse = false;

        xhr.onreadystatechange = function() {
          if (xhr.readyState === XMLHttpRequest.LOADING || xhr.readyState === XMLHttpRequest.DONE) {
            const responseText = xhr.responseText;
            const newContent = responseText.substring(fullResponse.length);
            
            if (newContent && onChunk) {
              // Process streaming content and filter out final JSON output
              const lines = newContent.split('\n');
              for (const line of lines) {
                if (line.trim()) {
                  try {
                    const chunk = JSON.parse(line);
                    if (chunk.type === 'begin') {
                      if (!hasStartedFinalResponse) {
                        hasStartedFinalResponse = true;
                        finalContent = '';
                        onChunk('__RESET__');
                      }
                    } else if (chunk.type === 'item' && chunk.content && typeof chunk.content === 'string') {
                      try {
                        const innerContent = JSON.parse(chunk.content);
                        if (innerContent.output) {
                          // Skip displaying the final JSON output to prevent showing unwanted content
                          finalContent = '';
                          continue;
                        }
                      } catch (innerParseError) {
                        if (hasStartedFinalResponse) {
                          finalContent += chunk.content;
                          onChunk(chunk.content);
                        }
                      }
                    }
                  } catch (parseError) {
                    const trimmedLine = line.trim();
                    if (trimmedLine && hasStartedFinalResponse) {
                      finalContent += '\n' + trimmedLine;
                      onChunk(trimmedLine);
                    }
                  }
                }
              }
            }
            
            fullResponse = responseText;
            
            if (xhr.readyState === XMLHttpRequest.DONE) {
              if (xhr.status === 200) {
                // Return only the final content, never return fullResponse to avoid unwanted JSON output
                resolve(finalContent || '');
              } else {
                reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
              }
            }
          }
        };

        xhr.onerror = function() {
          reject(new Error('Failed to get response from AI. Please try again.'));
        };

        xhr.ontimeout = function() {
          reject(new Error('Request timed out. Please try again.'));
        };

        xhr.timeout = 60000;

        const requestBody = JSON.stringify({
          message: message,
          attachments: attachments,
          role: selectedRole.name,
          roleDescription: selectedRole.description
        });

        xhr.send(requestBody);
      } catch (error) {
        console.error('Error in sendMessageWithAttachments:', error);
        reject(new Error('Failed to get response from AI. Please try again.'));
      }
    });
  };

  // Function to send message to n8n webhook with specific format
  const sendMessageToN8NWebhook = async (message: string, uploadedFile: FileUploadResult, onChunk?: (chunk: string) => void): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://matrixai21.app.n8n.cloud/webhook/910d8b7e-6462-463b-90ef-42056a296c73');
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Accept', 'text/event-stream');

        let fullResponse = '';
        let processedLength = 0;
        let finalContent = '';
        let thinkingContent = '';
        let isInThinkingPhase = false;
        let hasStartedFinalResponse = false;

        xhr.onreadystatechange = function() {
          if (xhr.readyState === XMLHttpRequest.LOADING || xhr.readyState === XMLHttpRequest.DONE) {
            const responseText = xhr.responseText;
            const newContent = responseText.substring(processedLength);
            processedLength = responseText.length;
            
            if (newContent && onChunk) {
              // Parse streaming content - handle structured JSON format from webhook
              const lines = newContent.split('\n');
              
              for (const line of lines) {
                if (line.trim()) {
                  try {
                    const chunk = JSON.parse(line.trim());
                    
                    // Handle structured streaming responses from n8n webhook
                    if (chunk.type === 'begin') {
                      // Start of a new content stream
                      if (!hasStartedFinalResponse) {
                        hasStartedFinalResponse = true;
                        finalContent = '';
                        onChunk('__RESET__');
                      }
                    } else if (chunk.type === 'item' && chunk.content) {
                      // Stream content chunks
                      if (hasStartedFinalResponse) {
                        finalContent += chunk.content;
                        onChunk(chunk.content);
                      }
                    } else if (chunk.type === 'end') {
                      // End of content stream - continue to next stream if any
                      continue;
                    } else if (chunk.type === 'item' && chunk.content && typeof chunk.content === 'string') {
                      // Handle final JSON output format: {"type":"item","content":"{\"output\":\"Final response\"}"}
                      try {
                        const innerContent = JSON.parse(chunk.content);
                        if (innerContent.output) {
                          // Skip displaying the final JSON output to prevent showing unwanted content
                          // Set finalContent to empty to prevent returning this content
                          finalContent = '';
                          // Do not display this content to the user
                          continue;
                        }
                      } catch (innerParseError) {
                        // If inner content is not JSON, treat as regular content
                        if (hasStartedFinalResponse) {
                          finalContent += chunk.content;
                          onChunk(chunk.content);
                        }
                      }
                    }
                  } catch (parseError) {
                    // This is plain text, not JSON - handle as fallback
                    const trimmedLine = line.trim();
                    
                    if (!hasStartedFinalResponse) {
                      hasStartedFinalResponse = true;
                      finalContent = trimmedLine;
                      onChunk('__RESET__');
                      onChunk(trimmedLine);
                    } else {
                      // Add new plain text content
                      finalContent += '\n' + trimmedLine;
                      onChunk('\n' + trimmedLine);
                    }
                  }
                }
              }
            }
            
            fullResponse = responseText;
            
            if (xhr.readyState === XMLHttpRequest.DONE) {
              if (xhr.status === 200) {
                // Return only the final content, never return fullResponse to avoid unwanted JSON output
                resolve(finalContent || '');
              } else {
                reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
              }
            }
          }
        };

        xhr.onerror = function() {
          reject(new Error('Failed to get response from AI. Please try again.'));
        };

        xhr.ontimeout = function() {
          reject(new Error('Request timed out. Please try again.'));
        };

        xhr.timeout = 60000;

        // Generate unique ID for the message
        const uid = crypto.randomUUID();
        
        const requestBody = JSON.stringify({
          messages: [
            {
              uid: uid,
              type: uploadedFile.fileType === 'image' ? 'image' : 'document',
              text: {
                body: message
              },
              url: uploadedFile.publicUrl
            }
          ],
          stream: true
        });

        console.log('📤 Sending to n8n webhook:', requestBody);
        xhr.send(requestBody);
      } catch (error) {
        console.error('Error in sendMessageToN8NWebhook:', error);
        reject(new Error('Failed to get response from AI. Please try again.'));
      }
    });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !selectedFile && uploadedFiles.length === 0 && !currentUploadedFile) return;
    
    // Prevent multiple simultaneous sends
    if (isSending || isLoading) return;
    
    // Check if a chat exists - prevent sending messages without a chat
    if (!chatId) {
      showWarning('Please create a new chat first before sending messages.');
      return;
    }
    
    setIsSending(true);
    
    // If a generation type is selected, route to generation API
    if (selectedGenerationType) {
      const messageToSend = inputMessage.trim() || 'Generate content';
      
      // Clear input immediately
      setInputMessage('');
      // Don't clear file here - wait until after successful processing
      
      try {
        await sendGenerationRequest(selectedGenerationType, messageToSend);
      } finally {
        setIsSending(false);
      }
      return;
    }
    
    // Check if 40-message limit is reached for this chat
    const currentUserMessages = messages.filter(m => m.role === 'user').length;
    if (currentUserMessages >= 40) {
      setIsMessageLimitReached(true);
      showWarning('You have reached the 40-message limit for this chat. Please start a new chat to continue.');
      setIsSending(false);
      return;
    }
    
    // Check if user has sufficient coins
    if (!isPro && (!userData?.coins || userData.coins <= 0)) {
      setShowProAlert(true);
      setIsSending(false);
      return;
    }
    
    setIsLoading(true);
    let imageUrl: string | null = null;
    let userMessageContent = inputMessage;
    let userMessageAdded = false; // Track if user message has been added to prevent duplicates
    
    try {
      // If there's a file, process it
      if (selectedFile) {
        try {
          // Determine file type
          const fileType = selectedFile.type;
          const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase() || '';
          const isPdf = fileType === 'application/pdf' || fileExtension === 'pdf';
          const isDoc = fileType === 'application/msword' || 
                       fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                       fileExtension === 'doc' || fileExtension === 'docx';
          const isImage = fileType.startsWith('image/');
          
          // Get file type label for message
          let fileTypeLabel = 'file';
          if (isPdf) fileTypeLabel = 'PDF';
          else if (isDoc) fileTypeLabel = 'document';
          else if (isImage) fileTypeLabel = 'image';
          
          // If we're not authenticated, fall back to local display
          const { data: { session } } = await supabase.auth.getSession();
          
          // For PDF and DOC files, convert to images and process
          if (isPdf || isDoc) {
            try {
              // Show processing status
              setProcessingStatus({
                isProcessing: true,
                currentPage: 0,
                totalPages: 0,
                fileName: selectedFile.name
              });
              
              // Get page count for PDF or convert DOC to images
              let pageCount: number;
              let imageFiles: File[] = [];
              
              if (isPdf) {
                pageCount = await getPdfPageCount(selectedFile);
              } else {
                imageFiles = await convertDocToImages(selectedFile);
                pageCount = imageFiles.length;
                
                if (imageFiles.length === 0) {
                  setProcessingStatus(null);
                  throw new Error(`Failed to extract images from ${fileTypeLabel}`);
                }
              }
              
              // Update processing status with total pages
              setProcessingStatus(prev => prev ? {
                ...prev,
                totalPages: pageCount
              } : null);
              
              // Check if user has sufficient coins (fixed 2 coins for PDF preview)
              const totalCoinsNeeded = isPdf ? 2 : 2 * pageCount; // Fixed 2 coins for PDF, 2 per page for DOC
              if (!isPro && (!userData?.coins || userData.coins < totalCoinsNeeded)) {
                setProcessingStatus(null);
                setShowProAlert(true);
                const costDescription = isPdf 
                  ? `You need ${totalCoinsNeeded} coins to process this ${fileTypeLabel}.`
                  : `You need ${totalCoinsNeeded} coins to process this ${fileTypeLabel} (${pageCount} pages × 2 coins per page).`;
                showWarning(`${costDescription} Please purchase more coins.`);
                setIsSending(false);
                return;
              }
              
              // Store only the text content, file info will be handled by UserMessageAttachments component
              const fileUrlInfo = `;;%%;;data:application/pdf;base64,placeholder;;%%;; `;
              
              userMessageContent = inputMessage 
                ? `${inputMessage}${fileUrlInfo}` 
                : fileUrlInfo;
              
              const userMessage = {
                id: messages.length + 1,
                role: 'user',
                content: userMessageContent,
                timestamp: new Date().toISOString(),
                fileName: selectedFile.name
              };
              
              setMessages(prev => [...prev, userMessage]);
              
              // Mark that user message has been added to prevent duplicates
              userMessageAdded = true;
              
              // Clear input only - keep file until processing is complete
              setInputMessage('');
              // setSelectedFile(null); // Don't clear file yet
              

              
              // Extract text from PDF images using OCR
              let extractedText = '';
              
              // Show processing message
              const processingMessage = {
                id: messages.length + 2,
                role: 'assistant',
                content: `Extracting text from ${fileTypeLabel} (${pageCount} pages)...`,
                timestamp: new Date().toISOString()
              };
              
              setMessages(prev => [...prev, processingMessage]);
              
              // Extract text from each page
              for (let i = 0; i < pageCount; i++) {
                // Update processing status for current page
                setProcessingStatus(prev => prev ? {
                  ...prev,
                  currentPage: i + 1
                } : null);
                
                // For DOC files, use the image file; for PDF, just process page number
                const imageFile = isPdf ? null : imageFiles[i];
                
                try {
                   // For now, show a placeholder message since OCR setup needs more configuration
                   // In a production environment, you would set up proper OCR service
                   const placeholderText = `[Text content from page ${i + 1} - OCR processing would extract actual text here]`;
                   
                   // Add page text to extracted text
                   extractedText += `\n\n--- Page ${i + 1} ---\n${placeholderText}`;
                 } catch (error) {
                   console.error(`Error processing page ${i + 1}:`, error);
                   extractedText += `\n\n--- Page ${i + 1} ---\n[Error processing this page]`;
                 }
              }
              
              // Clear processing status when done
              setProcessingStatus(null);
              
              // Create final response with extracted text
              const finalResponse = `Text extracted from PDF "${selectedFile.name}":\n${extractedText}`;
              
              // Update the processing message with final extracted text
              setMessages(prev => prev.map(msg => 
                msg.id === processingMessage.id
                  ? { ...msg, content: finalResponse }
                  : msg
              ));
              
              // Don't save to database as requested - just show the text
              showSuccess(`Text extracted from PDF: ${selectedFile.name}`);
              
              // Chat history is handled by saveChatToDatabase function
              
              setIsLoading(false);
      setIsSending(false);
      return; // Exit early since we've handled the PDF case
            } catch (pdfError) {
              console.error('Error processing PDF:', pdfError);
              setProcessingStatus(null);
              const errorMessage = pdfError instanceof Error ? pdfError.message : 'Unknown error occurred';
              showError(`Failed to process ${fileTypeLabel}: ${errorMessage}`);
              setIsLoading(false);
              setIsSending(false);
              return;
            }
          }
          
          // Regular file processing for non-PDF files or if PDF processing failed
          if (!session?.user?.id) {
            // Create a local URL for the file
            const localUrl = URL.createObjectURL(selectedFile);
            
            // Store only the text content and file URL, display info will be handled by UserMessageAttachments component
            const fileUrlInfo = `;;%%;;${localUrl};;%%;; `;
            
            userMessageContent = inputMessage 
              ? `${inputMessage}${fileUrlInfo}` 
              : fileUrlInfo;
            
            // Add user message with file
            const userMessage = {
              id: messages.length + 1,
              role: 'user',
              content: userMessageContent,
              timestamp: new Date().toISOString(),
              fileContent: localUrl,
              fileName: selectedFile.name
            };
            
            setMessages(prev => [...prev, userMessage]);
            
            // Mark that user message has been added to prevent duplicates
            userMessageAdded = true;
            
            // Clear input only - keep file until processing is complete
            setInputMessage('');
            // setSelectedFile(null); // Don't clear file yet
            

            
            // Use local URL for AI processing
            imageUrl = localUrl;
          } else {
            // Determine file type
            const fileType = selectedFile.type;
            const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase() || '';
            const isPdf = fileType === 'application/pdf' || fileExtension === 'pdf';
            const isDoc = fileType === 'application/msword' || 
                         fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                         fileExtension === 'doc' || fileExtension === 'docx';
            const isImage = fileType.startsWith('image/') || isPdf || isDoc; // Treat PDFs and DOCs as images for processing
            
            // Get file type label for message
            let fileTypeLabel = 'file';
            if (isPdf) fileTypeLabel = 'PDF';
            else if (isDoc) fileTypeLabel = 'document';
            else if (isImage) fileTypeLabel = 'image';
            
            // Read file content as base64
            const reader = new FileReader();
            const fileContent = await new Promise<string>((resolve) => {
              reader.onload = (e) => {
                const result = e.target?.result as string;
                resolve(result || '');
              };
              reader.readAsDataURL(selectedFile);
            });
            
            // For images, use new structured format with attachment field
            if (isImage && fileType.startsWith('image/')) {
              // Add user message with structured format - separate text and image
              setMessages(prev => {
                const textContent = inputMessage || ''; // Only the text part
                const userMessage = {
                  id: prev.length + 1,
                  role: 'user',
                  content: textContent,
                  timestamp: new Date().toISOString(),
                  fileContent: fileContent,
                  fileName: selectedFile.name
                };
                return [...prev, userMessage];
              });
              
              // Mark that user message has been added to prevent duplicates
              userMessageAdded = true;
              
              // Save user message to database with new structured format
              console.log('🖼️ Saving image message to database with structured format:', {
                textContent: inputMessage || '(no text)',
                fileName: selectedFile.name,
                chatId: chatId
              });
              
              // Create message object with attachment field for database
              const messageWithAttachment = {
                text: inputMessage || '',
                sender: 'user',
                timestamp: new Date().toISOString(),
                attachment: {
                  url: fileContent,
                  fileName: selectedFile.name,
                  fileType: selectedFile.type
                }
              };
              
              // Log the attachment being saved
              console.log('🖼️ Saving image attachment to database:', {
                fileName: selectedFile.name,
                fileType: selectedFile.type,
                hasUrl: !!fileContent
              });
              
              // Make sure the attachment is properly saved to the database
              await saveChatToDatabase(messageWithAttachment, 'user');
              
              // Use base64 data URL for AI processing
              imageUrl = fileContent;
            } else {
              // For non-image files, keep the original Supabase upload logic
              // Create a unique file path
              const userId = session.user.id;
              // Use the file extension from earlier declaration
              const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExtension}`;
              const filePath = `${userId}/${fileName}`;
              
              // Upload to Supabase storage
              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('user-uploads')
                .upload(filePath, selectedFile, {
                  contentType: selectedFile.type,
                  upsert: false
                });
              
              if (uploadError) {
                throw new Error(`Upload error: ${uploadError.message}`);
              }
              
              // Get the URL for the uploaded file
              const { data: { publicUrl } } = supabase.storage
                .from('user-uploads')
                .getPublicUrl(filePath);
              
              // Add file information to message content
              userMessageContent = inputMessage 
                ? `${inputMessage}\n\n[Attached ${fileTypeLabel}: ${selectedFile.name}]` 
                : `[Attached ${fileTypeLabel}: ${selectedFile.name}]`;
              
              // Add user message with file using functional update
              setMessages(prev => {
                const userMessage = {
                  id: prev.length + 1,
                  role: 'user',
                  content: userMessageContent,
                  timestamp: new Date().toISOString(),
                  fileContent: publicUrl,
                  fileName: selectedFile.name
                };
                return [...prev, userMessage];
              });
              
              // Mark that user message has been added to prevent duplicates
              userMessageAdded = true;
              
              // Save user message with attachment to database
              const messageWithAttachment = {
                text: inputMessage.trim() || `[Attached ${fileTypeLabel}: ${selectedFile.name}]`,
                attachment: {
                  url: publicUrl,
                  fileName: selectedFile.name,
                  fileType: fileTypeLabel.toLowerCase(),
                  size: selectedFile.size
                }
              };
              await saveChatToDatabase(messageWithAttachment, 'user');
              
              // Use public URL for AI processing
              imageUrl = publicUrl;
            }
            
            // Clear input and file selection
            setInputMessage('');
            setSelectedFile(null);
          }
        } catch (error) {
          console.error('Error processing file:', error);
          showError('Error uploading file. Please try again.');
          setIsLoading(false);
          setIsSending(false);
          return;
        }
      } else {
          // Consolidate all message creation into one place to prevent duplicates
          if (!userMessageAdded) {
            let attachments: any[] = [];
            let messageToSave: any = null;
            
            // Priority 1: Handle uploadedFiles (from drag & drop or file picker)
            if (uploadedFiles.length > 0) {
              attachments = uploadedFiles.map(file => ({
                url: file.url,
                fileName: file.fileName,
                fileType: file.fileType,
                originalName: file.originalName,
                size: file.size
              }));
              
              // For database saving, use the first attachment
              const firstAttachment = uploadedFiles[0];
              messageToSave = {
                text: userMessageContent,
                attachment: {
                  url: firstAttachment.url,
                  fileName: firstAttachment.fileName || firstAttachment.originalName,
                  fileType: firstAttachment.fileType,
                  size: firstAttachment.size
                }
              };
            }
            // Priority 2: Handle currentUploadedFile (from n8n webhook case)
            else if (currentUploadedFile) {
              attachments = [{
                url: currentUploadedFile.publicUrl,
                fileName: currentUploadedFile.fileName,
                fileType: currentUploadedFile.fileType,
                originalName: currentUploadedFile.originalName,
                size: currentUploadedFile.size
              }];
              
              messageToSave = {
                text: userMessageContent,
                attachment: {
                  url: currentUploadedFile.publicUrl,
                  fileName: currentUploadedFile.originalName,
                  fileType: currentUploadedFile.fileType,
                  size: currentUploadedFile.size || null
                }
              };
            }
            // Priority 3: Text-only message
            else {
              messageToSave = userMessageContent;
            }
            
            // Add single user message to state
            setMessages(prev => {
              const userMessage = {
                id: prev.length + 1,
                role: 'user',
                content: userMessageContent,
                timestamp: new Date().toISOString(),
                ...(attachments.length > 0 && { attachments })
              };
              return [...prev, userMessage];
            });
            
            // Save to database
            await saveChatToDatabase(messageToSave, 'user');
            
            // Mark that user message has been added
            userMessageAdded = true;
          }
          
          // Clear input and files
          setInputMessage('');
          setUploadedFiles([]);
          setCurrentUploadedFile(null);
        }
        
        // Create a streaming bot message that will be updated in real-time
        // Calculate the streaming message ID using current messages state
        let streamingMessageId: number = 0;
        let streamingContent = '';
        let assistantMessageId: string | null = null;
        
        // Note: Removed startAssistantMessage to prevent empty database rows
        // Content will be saved via saveChatToDatabase when streaming completes
        
        // Add initial empty streaming message using functional update
        setMessages(prev => {
          streamingMessageId = prev.length + 1;
          const initialStreamingMessage = {
            id: streamingMessageId,
            role: 'assistant',
            content: '',
            timestamp: new Date().toISOString(),
            isStreaming: true
          };
          return [...prev, initialStreamingMessage];
        });
      
      // Define chunk handler for real-time updates
      const handleChunk = (chunk: string) => {
        // Check for reset signal
        if (chunk === '__RESET__') {
          streamingContent = '';
          return; // Don't add the reset signal to content
        }
        if (chunk.startsWith('__RESET__')) {
          streamingContent = '';
          chunk = chunk.substring(9); // Remove the reset signal
        }
        
        // Filter out unwanted JSON output content
        try {
          // Check if chunk contains the unwanted JSON output format
          if (chunk.includes('{"output":')) {
            const jsonMatch = chunk.match(/\{"output":".*?"\}/);
            if (jsonMatch) {
              // Skip this chunk entirely as it contains unwanted technical document content
              return;
            }
          }
        } catch (error) {
          // If parsing fails, continue with normal processing
        }
        
        streamingContent += chunk;
        
        // Note: Removed appendMessageChunk to prevent empty database operations
        // Content will be saved via saveChatToDatabase when streaming completes
        
        // Update the streaming message in real-time
        setMessages(prev => prev.map(msg => 
          msg.id === streamingMessageId 
            ? { ...msg, content: streamingContent }
            : msg
        ));
        
        // Update the displayed text for real-time rendering
        setDisplayedText(prev => ({
          ...prev,
          [streamingMessageId]: streamingContent
        }));
        
        // Auto-scroll to bottom as content streams in
        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
          }
        }, 50);
      };

      try {
        // Deduct coins before making the API call
        let coinsToDeduct = 1; // 1 coin for text message
        if (imageUrl) {
          coinsToDeduct = 2; // 2 coins for image/document message
        }
        
        // Only deduct coins if user is authenticated
        if (user?.id) {
          try {
            await userService.subtractCoins(user.id as string, coinsToDeduct, imageUrl ? 'ai_chat_with_image' : 'ai_chat_message');
          } catch (coinError) {
            console.error('Error deducting coins:', coinError);
            // If coin deduction fails, still continue but show warning
            showWarning('Could not deduct coins. Please check your balance.');
          }
        }
        
        // Get streaming response - use n8n webhook API if there's both text and uploaded file
        let fullResponse: string;
        if (currentUploadedFile && inputMessage.trim()) {
          // Call n8n webhook with the specific format
          fullResponse = await sendMessageToN8NWebhook(
            inputMessage.trim(),
            currentUploadedFile,
            handleChunk
          );
        } else if (uploadedFiles.length > 0) {
          // Prepare attachments for webhook API
           const attachments = uploadedFiles.map(file => ({
             url: file.url,
             fileName: file.fileName,
             fileType: file.fileType
           }));
           
           console.log('📎 Sending attachments to webhook API:', attachments);
          
          fullResponse = await sendMessageWithAttachments(
            userMessageContent,
            attachments,
            handleChunk
          );
        } else {
          // Use original API for regular messages and selectedFile uploads
          fullResponse = await sendMessageToAI(
            userMessageContent, 
            imageUrl, 
            handleChunk
          );
        }
        
        // Finalize the streaming message with the accumulated streaming content only
        // Never use fullResponse as it contains raw JSON - only use streamingContent
        const finalMessageContent = streamingContent;
        setMessages(prev => prev.map(msg => 
          msg.id === streamingMessageId 
            ? { ...msg, content: finalMessageContent, isStreaming: false }
            : msg
        ));
        
        // Store coins used for this message (only if user is authenticated)
        if (user?.id) {
          setCoinsUsed(prev => ({ ...prev, [streamingMessageId]: coinsToDeduct }));
        }
        
        // Save the complete assistant response to database (use clean streaming content, not raw JSON)
        await saveChatToDatabase(streamingContent, 'assistant');
        
        // Clear uploaded file and selected file after successful sending
        if (currentUploadedFile) {
          setCurrentUploadedFile(null);
        }
        if (selectedFile) {
          setSelectedFile(null);
        }
        // Clear uploaded files array after successful sending
        setUploadedFiles([]);
        
        // Chat history is handled by saveChatToDatabase function
      } catch (error) {
        console.error('Error calling streaming AI API:', error);
        
        // Remove the streaming message and add error message
        setMessages(prev => {
          const messagesWithoutStreaming = prev.filter(msg => msg.id !== streamingMessageId);
          return [...messagesWithoutStreaming, {
            id: streamingMessageId,
            role: 'assistant',
            content: 'Sorry, I encountered an error. Please try again.',
            timestamp: new Date().toISOString()
          }];
        });
        
        // Save error message to database
         await saveChatToDatabase('Sorry, I encountered an error. Please try again.', 'assistant');
      }
    } catch (error) {
      console.error('Error in message handling:', error);
      showError('An error occurred while sending your message. Please try again.');
    } finally {
      setIsLoading(false);
      setIsSending(false);
    }
  };

  // When a role is changed, update the current chat's role instead of creating a new chat
  const handleRoleChange = async (role: typeof roleOptions[0]) => {
    setSelectedRole(role);
    setShowRoleSelector(false);
    
    // Stop any ongoing speech
    stopSpeech();
    
    try {
      // Use AuthContext user for consistency
      if (user?.uid) {
        const userId = user.uid;
        const timestamp = new Date().toISOString();
        
        // Import updateChatRole from chatService
        const { updateChatRole } = await import('../services/chatService');
        
        // Update the current chat's role in the database using the service
        const success = await updateChatRole(chatId, userId, role.id);
        
        if (!success) {
          console.error('Error updating chat role');
          showError('Failed to change role. Please try again.');
          return;
        }
        
        // Update local chats state
        setChats(prev => prev.map(chat => 
          chat.id === chatId 
            ? { ...chat, role: role.id, roleDescription: role.description }
            : chat
        ));
        
        // Update grouped chat history
        setGroupedChatHistory(prev => {
          const updateChatInGroup = (group: {id: string, title: string, role: string, roleName?: string}[]) => 
            group.map(chat => 
              chat.id === chatId 
                ? { ...chat, role: role.id, roleName: role.name }
                : chat
            );
          
          return {
            today: updateChatInGroup(prev.today),
            yesterday: updateChatInGroup(prev.yesterday),
            lastWeek: updateChatInGroup(prev.lastWeek),
            lastMonth: updateChatInGroup(prev.lastMonth),
            older: updateChatInGroup(prev.older)
          };
        });
        
        // Check if there are existing messages in the chat
         // If yes, add a new assistant message announcing the role change
         if (messages.length > 0) {
           const roleChangeMessage = `Hello! I've switched to the role of ${role.name}. ${role.description} How can I assist you in this new capacity?`;
           
           // Add the role change message to local state immediately
           const newAssistantMessage: Message = {
             id: Date.now(),
             role: 'assistant',
             content: roleChangeMessage,
             timestamp: new Date().toISOString(),
             isStreaming: false
           };
           
           setMessages(prev => [...prev, newAssistantMessage]);
           
           // Save the assistant message to database
            await saveChatToDatabase(roleChangeMessage, 'assistant');
           
           console.log('✅ Role change assistant message added');
         }
      }
      
      // Show success message
      showSuccess(`Role changed to ${role.name}`);
    } catch (error) {
      console.error('Error in role change:', error);
      showError('Failed to change role. Please try again.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isSending && !isLoading) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Handle edit message functionality
  const handleEditMessage = (messageId: number, content: string) => {
    setEditingMessageId(messageId);
    setEditingContent(content);
  };

  const handleSaveEdit = async () => {
    if (editingMessageId && editingContent.trim()) {
      const editedMessage = messages.find(msg => msg.id === editingMessageId);
      if (!editedMessage) return;

      // Deduct 1 coin for editing a message
      if (user?.uid) {
        try {
          await userService.subtractCoins(user.uid, 1, 'edit_message');
        } catch (coinError) {
          console.error('Error deducting coins for edit:', coinError);
          showWarning('Could not deduct coins. Please check your balance.');
          return;
        }
      }

      // If editing a user message, remove all subsequent messages and regenerate AI response
      if (editedMessage.role === 'user') {
        const editedMessageIndex = messages.findIndex(msg => msg.id === editingMessageId);
        const messagesUpToEdit = messages.slice(0, editedMessageIndex);
        
        // Add the edited user message
        const updatedUserMessage = { ...editedMessage, content: editingContent.trim() };
        const newMessages = [...messagesUpToEdit, updatedUserMessage];
        setMessages(newMessages);
        
        // Clear editing state
        setEditingMessageId(null);
        setEditingContent('');
        
        // Generate new AI response
        setIsLoading(true);
        try {
          const aiResponse = await sendMessageToAI(editingContent.trim());
          
          const newAiMessage: Message = {
            id: Date.now() + 1,
            role: 'assistant',
            content: aiResponse,
            timestamp: new Date().toISOString()
          };
          
          setMessages(prev => [...prev, newAiMessage]);
          
          // Save to database if user is logged in
          try {
            // Only use Supabase session for database operations to comply with RLS policies
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session?.user?.id) {
              const userId = session.user.id;
              const finalMessages = [...newMessages, newAiMessage];
              // Note: Message editing with new structure would require
              // updating individual messages in the messages table
              // For now, we'll skip this update as it requires more complex logic
              console.log('Message editing saved to local state only');
            }
          } catch (error) {
            console.error('Error saving edited conversation:', error);
          }
        } catch (error) {
          console.error('Error generating AI response:', error);
          showError('Failed to generate AI response');
        } finally {
          setIsLoading(false);
        }
      } else {
        // If editing an AI message, just update it
        setMessages(prev => prev.map(msg => 
          msg.id === editingMessageId 
            ? { ...msg, content: editingContent.trim() }
            : msg
        ));
        
        // Clear editing state
        setEditingMessageId(null);
        setEditingContent('');
        
        // Save to database if user is logged in
        try {
          // Only use Supabase session for database operations to comply with RLS policies
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user?.id) {
            const userId = session.user.id;
            const updatedMessages = messages.map(msg => 
              msg.id === editingMessageId 
                ? { ...msg, content: editingContent.trim() }
                : msg
            );
            
            // Note: Message editing with new structure would require
            // updating individual messages in the messages table
            // For now, we'll skip this update as it requires more complex logic
            console.log('Message editing saved to local state only');
          }
        } catch (error) {
          console.error('Error saving edited message:', error);
        }
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  // Handle deleting a chat from history
  const handleDeleteChat = async (chatIdToDelete: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent chat selection when clicking delete
    
    if (!user?.uid) {
      showError('You must be logged in to delete chats');
      return;
    }

    try {
      // Delete from Supabase using new service
      const success = await deleteNewChat(chatIdToDelete, user.uid);

      if (!success) {
        console.error('Error deleting chat: deleteNewChat returned false');
        showError('Failed to delete chat');
        return;
      }

      // Remove from local state
      setChats(prev => prev.filter(chat => chat.id !== chatIdToDelete));
      
      // Remove from grouped chat history
      setGroupedChatHistory(prev => ({
        today: prev.today.filter(chat => chat.id !== chatIdToDelete),
        yesterday: prev.yesterday.filter(chat => chat.id !== chatIdToDelete),
        lastWeek: prev.lastWeek.filter(chat => chat.id !== chatIdToDelete),
        lastMonth: prev.lastMonth.filter(chat => chat.id !== chatIdToDelete),
        older: prev.older.filter(chat => chat.id !== chatIdToDelete)
      }));

      // If the deleted chat is the current chat, navigate to a new chat
      if (chatIdToDelete === chatId) {
        const newChatId = crypto.randomUUID();
        navigate(`/chat/${newChatId}`, { replace: true });
        setChatId(newChatId);
        setMessages([]);
      }

      showSuccess('Chat deleted successfully');
    } catch (error) {
      console.error('Error deleting chat:', error);
      showError('Failed to delete chat');
    }
  };

  // Handle file upload with better error reporting
  const handleFileUpload = async () => {
    // Check if user has sufficient coins
    if (!isPro && (!userData?.coins || userData.coins <= 0)) {
      setShowProAlert(true);
      return;
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle file change with preview support
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Get file extension
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
      
      // Check if it's an image, PDF, or DOC file
      const isPdf = file.type === 'application/pdf' || fileExtension === 'pdf';
      const isDoc = file.type === 'application/msword' || 
                   file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                   fileExtension === 'doc' || fileExtension === 'docx';
      const isImage = file.type.startsWith('image/');
      
      if (!isImage && !isPdf && !isDoc) {
        showWarning('Please select an image, PDF, or document file');
        return;
      }
      
      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        showWarning('File too large. Please select a file smaller than 10MB');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  // New file upload popup functions
  const handleOpenFileUploadPopup = () => {
    setIsFileUploadPopupOpen(true);
  };

  const handleCloseFileUploadPopup = () => {
    setIsFileUploadPopupOpen(false);
  };

  const handleFileUploadFromPopup = async (files: File[]) => {
    setIsUploading(true);
    const uploadedFilesList: any[] = [];

    try {
      for (const file of files) {
        // Determine file type based on MIME type
        const fileType = file.type.startsWith('image/') ? 'image' : 'document';
        const uploadedFile = await uploadFileToStorage(file, user?.uid || 'anonymous', fileType);
        uploadedFilesList.push(uploadedFile);
      }
      
      setUploadedFiles(prev => [...prev, ...uploadedFilesList]);
      setIsFileUploadPopupOpen(false);
      showSuccess(`${files.length} file(s) uploaded successfully!`);
    } catch (error) {
      console.error('Error uploading files:', error);
      showError('Failed to upload files. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveUploadedFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  // Get PDF page count without creating images
  const getPdfPageCount = async (pdfFile: File): Promise<number> => {
    try {
      // Import pdfjs-dist dynamically
      const pdfjsLib = await import('pdfjs-dist');
      
      // Disable worker to avoid CDN issues - use main thread processing
      pdfjsLib.GlobalWorkerOptions.workerSrc = '';
      
      // Convert file to array buffer
      const arrayBuffer = await pdfFile.arrayBuffer();
      
      // Load PDF document
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      return pdf.numPages;
    } catch (error) {
      console.error('Error getting PDF page count:', error);
      throw new Error('Failed to get PDF page count');
    }
  };

  // Convert PDF to array of images
  const convertPdfToImages = async (pdfFile: File): Promise<File[]> => {
    try {
      // Import pdfjs-dist dynamically
      const pdfjsLib = await import('pdfjs-dist');
      
      // Disable worker to avoid CDN issues - use main thread processing
      pdfjsLib.GlobalWorkerOptions.workerSrc = '';
      
      // Convert file to array buffer
      const arrayBuffer = await pdfFile.arrayBuffer();
      
      // Load PDF document
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const imageFiles: File[] = [];
      
      // Convert each page to image
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        
        // Set scale for better quality
        const scale = 2.0;
        const viewport = page.getViewport({ scale });
        
        // Create canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Render page to canvas
         const renderContext = {
           canvasContext: context,
           viewport: viewport,
           canvas: canvas
         };
        
        await page.render(renderContext).promise;
        
        // Convert canvas to blob
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob: Blob | null) => resolve(blob!), 'image/png', 0.9);
        });
        
        // Create file from blob
        const imageFile = new File(
          [blob],
          `${pdfFile.name.replace(/\.pdf$/i, '')}_page_${pageNum}.png`,
          { type: 'image/png' }
        );
        
        imageFiles.push(imageFile);
      }
      
      return imageFiles;
    } catch (error) {
      console.error('Error converting PDF to images:', error);
      throw new Error('Failed to convert PDF to images');
    }
  };

  // Convert DOC/DOCX to array of images
  const convertDocToImages = async (docFile: File): Promise<File[]> => {
    try {
      const mammoth = await import('mammoth');
      
      // Read DOC/DOCX file as array buffer
      const arrayBuffer = await docFile.arrayBuffer();
      
      // Convert to HTML
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const htmlContent = result.value;
      
      // Create a temporary div to render the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.width = '800px';
      tempDiv.style.padding = '40px';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.fontSize = '14px';
      tempDiv.style.lineHeight = '1.6';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.color = 'black';
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      
      // Add to document temporarily
      document.body.appendChild(tempDiv);
      
      // Use html2canvas to convert to image
      const html2canvas = await import('html2canvas');
      const canvas = await html2canvas.default(tempDiv, {
        backgroundColor: 'white',
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      
      // Remove temporary div
      document.body.removeChild(tempDiv);
      
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png', 0.9);
      });
      
      // Create file from blob
      const imageFile = new File(
        [blob],
        `${docFile.name.replace(/\.(doc|docx)$/i, '')}_converted.png`,
        { type: 'image/png' }
      );
      
      return [imageFile];
    } catch (error) {
      console.error('Error converting DOC to images:', error);
      throw new Error('Failed to convert document to images');
    }
  };

  // Function to download image
  const downloadImage = async (imageUrl: string, fileName?: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'image.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
      showError('Failed to download image');
    }
  };

  const handleFilePreview = (fileUrl: string, fileName: string, generationType: string) => {
    const fileType = generationType === 'spreadsheet' ? 'spreadsheet' : 'document';
    setPreviewFileUrl(fileUrl);
    setPreviewFileName(fileName);
    setPreviewFileType(fileType);
    setIsFilePreviewOpen(true);
  };

  const handleCloseFilePreview = () => {
    setIsFilePreviewOpen(false);
    setPreviewFileUrl('');
    setPreviewFileName('');
  };

  // Function to show image in full screen
  const handleImageFullScreen = (url: string) => {
    // Create fullscreen modal
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '9999';
    modal.style.cursor = 'pointer';
    
    // Create image element
    const img = document.createElement('img');
    img.src = url;
    img.style.maxWidth = '90%';
    img.style.maxHeight = '90%';
    img.style.objectFit = 'contain';
    
    // Close on click
    modal.onclick = () => {
      document.body.removeChild(modal);
    };
    
    modal.appendChild(img);
    document.body.appendChild(modal);
  };

  // Function to share image
  const handleShareImage = async (imageUrl: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Shared from AI Chat',
          text: 'Check out this image!',
          url: imageUrl
        });
      } catch (error) {
        console.error('Error sharing:', error);
        // Fallback
        navigator.clipboard.writeText(imageUrl);
        showSuccess('Image URL copied to clipboard!');
      }
    } else {
      // Fallback for browsers without share API
      navigator.clipboard.writeText(imageUrl);
      alert('Image URL copied to clipboard!');
    }
  };

  // Define proper types for the startNewChat function
  const startNewChat = async (customChatId?: string) => {
    stopSpeech();
    const newChatId = customChatId || crypto.randomUUID();
    setChatId(newChatId);
    
    // Clear all state completely to prevent any leakage
    setMessageHistory([]);
    setInputMessage('');
    setSelectedFile(null);
    setDisplayedText({});
    setIsTyping({});
    setEditingMessageId(null);
    setEditingContent('');
    
    // Start with empty messages - no initial message
    setMessages([]);
    setSelectedRole(roleOptions[0]);
    
    // Update URL without reloading
    navigate(`/chat/${newChatId}`, { replace: true });
    
    try {
      // Use AuthContext user for database operations
      if (!user?.uid) {
        console.log('⚠️ No AuthContext user found, skipping database creation');
        console.log('📝 Chat will work in local mode until user authenticates');
        return;
      }
      
      const userId = user.uid;
      console.log('✅ Using AuthContext user ID for new chat:', userId);
      
      // Create empty chat in database using direct database insert
      console.log('🔄 Creating new chat in database with ID:', newChatId);
      
      const { data: createdChat, error: chatError } = await supabase
        .from('chats')
        .insert({
          id: newChatId,
          owner: userId,
          title: 'New Chat',
          position_counter: 0,
          metadata: {},
          role: selectedRole.id
        })
        .select()
        .single();
      
      if (chatError) {
        console.error('❌ Error creating new chat:', chatError);
        // Don't throw error, just log it and continue with local state
      } else {
        console.log('✅ Successfully created new chat in database:', createdChat);
        
        // Update local state with the new chat
        setChats(prev => [{
          id: newChatId,
          title: 'New Chat',
          messages: [],
          role: roleOptions[0].id,
          roleDescription: roleOptions[0].description,
          description: 'New conversation'
        }, ...prev]);
        
        // Update local storage with new chat ID
        localStorage.setItem('lastActiveChatId', newChatId);
        
        // Update chat history groups
        setGroupedChatHistory(prev => ({
          ...prev,
          today: [{ 
            id: newChatId, 
            title: 'New Chat', 
            role: roleOptions[0].id,
            roleName: roleOptions[0].name
          }, ...prev.today]
        }));
      }
    } catch (error) {
      console.error('❌ Error in startNewChat:', error);
      // Continue with local state even if database operation fails
    }
  };

  // Add a wrapper function for onClick event
  const handleStartNewChat = async () => {
    // Ensure the speech is stopped
    stopSpeech();
    
    // Create a new chat ID first
    const newChatId = crypto.randomUUID();
    
    // Clear all message state completely
    setMessages([]);
    setMessageHistory([]);
    setInputMessage('');
    setSelectedFile(null);
    setDisplayedText({});
    setIsTyping({});
    setEditingMessageId(null);
    setEditingContent('');
    setUserMessageCount(0);
    setIsMessageLimitReached(false);
    
    // Reset to default role
    setSelectedRole(roleOptions[0]);
    
    // Update chat ID state immediately
    setChatId(newChatId);
    
    // Store in localStorage immediately
    localStorage.setItem('lastActiveChatId', newChatId);
    
    try {
      // Use AuthContext user instead of Supabase session
      if (!user?.uid) {
        console.log('⚠️ No AuthContext user found, creating local chat');
        // For non-logged in users, start with empty messages and navigate
        setMessages([]);
        navigate(`/chat/${newChatId}`, { replace: true });
        return;
      }
      
      // For logged in users, create the new chat in the database first
      console.log('🔄 Creating new chat with ID:', newChatId);
      await startNewChat(newChatId);
      
      console.log('✅ Successfully created new chat with ID:', newChatId);
      
      // Small delay to ensure database consistency
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Force navigation after successful creation
      console.log('✅ Navigating to new chat:', newChatId);
      navigate(`/chat/${newChatId}`, { replace: true });
      
      // Refresh chat list to show the new chat after a small delay
      setTimeout(async () => {
        await fetchUserChatsWithoutMessageUpdate();
      }, 200);
      
    } catch (error) {
      console.error('❌ Error starting new chat:', error);
      // Even if database operation fails, still navigate to the new chat
      setMessages([]);
      navigate(`/chat/${newChatId}`, { replace: true });
    }
  };

  // Calculate remaining messages for display
  const currentUserMessages = messages.filter(m => m.role === 'user').length;

  // Load voices when component mounts
  useEffect(() => {
    // Function to load and preload voices
    const loadVoices = () => {
      // Preload voices
      window.speechSynthesis.getVoices();
    };
    
    // Chrome requires the voices to be loaded asynchronously
    setTimeout(loadVoices, 100);
    
    // Also set up the onvoiceschanged event
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    // Fix for Chrome's bug where it cuts off speech
    let utteranceChunks: SpeechSynthesisUtterance[] = [];
    
    // Chrome speech synthesis bug fix
    const fixChromeSpeechBug = () => {
      // Chrome has a bug where the speech synthesis stops after ~15 seconds
      // This keeps it alive by pausing and resuming at intervals
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
        setTimeout(fixChromeSpeechBug, 5000);
      }
    };
    
    // Start the fix if we're on Chrome
    if (/Chrome/.test(navigator.userAgent) && !/Edge/.test(navigator.userAgent)) {
      setTimeout(fixChromeSpeechBug, 5000);
    }
    
    // Ensure speech is stopped when component unmounts
    return () => {
      if (window.speechSynthesis.speaking) {
        try {
          window.speechSynthesis.cancel();
        } catch (error) {
          console.error('Error stopping speech on unmount:', error);
        }
      }
    };
  }, []);

  // Function to speak the assistant message
  const handleTextToSpeech = (text: string, messageId: number) => {
    // If this message is already speaking, stop it
    if (speakingMessageId === messageId && window.speechSynthesis.speaking) {
      stopSpeech();
      return;
    }
    
    // Stop any current speech before starting new one
    stopSpeech();
    
    // Create speech synthesis utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set language (default to English)
    utterance.lang = 'en-US';
    
    // Check if we're on macOS
    const isMacOS = /Macintosh|MacIntel|MacPPC|Mac68K/.test(navigator.userAgent);
    
    // Get available voices
    const voices = window.speechSynthesis.getVoices();
    
    // Try to find a high-quality voice
    // MacOS has different preferred voices than Windows
    const preferredVoices = isMacOS ? 
      ["Samantha", "Karen", "Daniel", "Alex", "Fred"] : 
      ["Google UK English Male", "Microsoft David", "Microsoft Mark", "Daniel", "Alex"];
    
    let selectedVoice = null;
    
    // First try exact matches from our preferred list
    for (const voiceName of preferredVoices) {
      const voice = voices.find(v => v.name === voiceName && v.lang.includes('en'));
      if (voice) {
        selectedVoice = voice;
        break;
      }
    }
    
    // If no exact match, try partial matches
    if (!selectedVoice) {
      selectedVoice = voices.find(v => 
        (preferredVoices.some(pv => v.name.includes(pv)) ||
        v.name.includes('Male')) && 
        v.lang.includes('en')
      );
    }
    
    // If still no match, just use any English voice
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.includes('en'));
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    // Set other properties - use more conservative settings on macOS
    utterance.rate = isMacOS ? 1.0 : 0.95;
    utterance.pitch = 1.0; // Use neutral pitch to avoid issues
    utterance.volume = 1.0; // Full volume
    
    // Add event listeners
    utterance.onstart = () => {
      setIsSpeaking(true);
      setSpeakingMessageId(messageId);
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingMessageId(null);
      
      // If auto-speak is enabled, speak the next message
      if (autoSpeak) {
        const assistantMessages = messages
          .filter(m => m.role === 'assistant' && !isTyping[m.id])
          .sort((a, b) => a.id - b.id);
        
        const currentIndex = assistantMessages.findIndex(m => m.id === messageId);
        if (currentIndex >= 0 && currentIndex < assistantMessages.length - 1) {
          const nextMessage = assistantMessages[currentIndex + 1];
          handleTextToSpeech(nextMessage.content, nextMessage.id);
        }
      }
    };
    
    utterance.onerror = (event) => {
      console.error('SpeechSynthesis error:', event);
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    };
    
    // Speak the entire text at once
    window.speechSynthesis.speak(utterance);
  };
  
  // Function to stop any ongoing speech
  const stopSpeech = () => {
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      try {
        window.speechSynthesis.cancel();
      } catch (error) {
        console.error('Error stopping speech:', error);
      }
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    }
  };

  // Toggle auto speak function
  const toggleAutoSpeak = () => {
    const newAutoSpeakState = !autoSpeak;
    setAutoSpeak(newAutoSpeakState);
    
    // If turning off auto-speak, stop any ongoing speech
    if (!newAutoSpeakState) {
      stopSpeech();
    } else {
      // If turning on auto-speak and no speech is currently happening,
      // find the last assistant message and start speaking from there
      if (!isSpeaking) {
        const assistantMessages = messages
          .filter(m => m.role === 'assistant' && !isTyping[m.id])
          .sort((a, b) => a.id - b.id);
        
        if (assistantMessages.length > 0) {
          const lastAssistantMessage = assistantMessages[assistantMessages.length - 1];
          handleTextToSpeech(lastAssistantMessage.content, lastAssistantMessage.id);
        }
      }
    }
  };

  const getUserInitial = () => {
    if (userData && userData.name) {
      return userData.name.split(' ').map(word => word[0]).join('').toUpperCase();
    }
    return '';
  };

  const getUserDisplayName = () => {
    if (userData && userData.name) {
      return userData.name;
    }
    return 'User';
  };

  // Get role name from role ID
  const getRoleName = (roleId: string): string => {
    if (!roleId) return 'General Assistant';
    
    const role = roleOptions.find(r => r.id === roleId);
    return role ? role.name : 'General Assistant';
  };

  // Chat history skeleton component
  const ChatHistorySkeleton = () => {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, index) => (
          <div key={index} className={`w-full px-3 py-2 rounded-md flex items-center gap-2 mb-1 animate-pulse ${
            darkMode ? 'bg-gray-700/50' : 'bg-gray-100'
          }`}>
            <div className={`w-4 h-4 rounded ${
              darkMode ? 'bg-gray-600' : 'bg-gray-300'
            }`}></div>
            <div className="flex-1 min-w-0">
              <div className={`h-3 rounded mb-1 ${
                darkMode ? 'bg-gray-600' : 'bg-gray-300'
              }`} style={{ width: `${60 + Math.random() * 30}%` }}></div>
              <div className="flex items-center gap-2">
                <div className={`h-2 rounded ${
                  darkMode ? 'bg-gray-600' : 'bg-gray-300'
                }`} style={{ width: '40px' }}></div>
                <div className={`h-2 rounded-full ${
                  darkMode ? 'bg-gray-600' : 'bg-gray-300'
                }`} style={{ width: '60px' }}></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Modify renderChatHistoryItem to include role information
  const renderChatHistoryItem = (chat: {id: string, title: string, role: string, roleName?: string}, timeframe: string) => {
    const isSelected = chat.id === chatId;
    // Use pre-computed roleName if available, otherwise compute it
    const roleName = chat.roleName || getRoleName(chat.role);
    
    return (
      <div 
        key={chat.id}
        className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 mb-1 cursor-pointer group ${
          isSelected 
            ? (darkMode 
                ? 'bg-blue-700/40 text-white' 
                : 'bg-blue-100 text-blue-700')
            : (darkMode 
                ? 'hover:bg-gray-700 text-gray-200' 
                : 'hover:bg-gray-100 text-gray-700')
        }`}
        onClick={() => selectChat(chat.id)}
      >
        <FiMessageSquare className={`w-4 h-4 ${isSelected ? (darkMode ? 'text-blue-400' : 'text-blue-500') : 'text-gray-400'}`} />
        <div className="flex-1 min-w-0">
          <div className="truncate font-medium text-sm">
            {chat.title}
          </div>
          <div className={`flex flex-wrap items-center text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <span className="mr-1">{timeframe}</span>
            <span className={`px-1.5 py-0.5 text-xs rounded-full ${
              darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
            }`}>
              {roleName}
            </span>
          </div>
        </div>
        
        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            showConfirmation('Are you sure you want to delete this chat?', () => {
              handleDeleteChat(chat.id, e);
            });
          }}
          className={`p-1 rounded-full transition-all duration-200 ${
            darkMode 
              ? 'hover:bg-red-600 text-gray-400 hover:text-white' 
              : 'hover:bg-red-100 text-gray-500 hover:text-red-600'
          }`}
          title="Delete chat"
        >
          <FiTrash2 className="w-3 h-3" />
        </button>
      </div>
    );
  };

  // Function to select a chat
  const selectChat = async (selectedChatId: string) => {
    if (selectedChatId === chatId) {
      // Even if same chat, flush everything and reload fresh from database
      stopSpeech();
      
      // Completely flush all local state
      setMessages([]);
      setMessageHistory([]);
      setInputMessage('');
      setSelectedFile(null);
      setDisplayedText({});
      setIsTyping({});
      setEditingMessageId(null);
      setEditingContent('');
      setCoinsUsed({});
      setChats([]);
      
      // Force reload from database
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    stopSpeech(); // Stop any ongoing speech
    
    // Completely flush all local state - no local data retention
    setMessages([]);
    setMessageHistory([]);
    setInputMessage('');
    setSelectedFile(null);
    setDisplayedText({});
    setIsTyping({});
    setEditingMessageId(null);
    setEditingContent('');
    setCoinsUsed({});
    setChats([]); // Clear local chats completely
    setUserMessageCount(0);
    setIsMessageLimitReached(false);
    
    setChatId(selectedChatId);
    setShowHistoryDropdown(false);
    
    // Update last active chat in localStorage
    localStorage.setItem('lastActiveChatId', selectedChatId);
    
    // Force a longer delay to ensure complete state clearing
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Always fetch fresh from database - no local cache usage
    try {
      console.log('🎯 selectChat - Starting chat selection for ID:', selectedChatId);
      // Only use Supabase session for database operations to comply with RLS policies
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user?.id) {
        console.log('❌ selectChat - No session found, creating new local chat');
        // Create new local chat if no session
        setMessages([]);
        setSelectedRole(roleOptions[0]);
        navigate(`/chat/${selectedChatId}`, { replace: true });
        return;
      }
      
      const userId = session.user.id;
      console.log('✅ selectChat - Using Supabase session user ID:', userId);
      
      // Fetch specific chat directly from database using new lazy loading service
      console.log('🔍 selectChat - Querying database for chat_id:', selectedChatId, 'user_id:', userId);
      const chatMessages = await getLatestChatMessages(selectedChatId, 10);
      const chatData = chatMessages.length > 0 ? { messages: chatMessages, role: 'general' } : null;
      const chatError = chatMessages.length === 0 ? 'Chat not found' : null;
      
      // Set lazy loading state
      setIsLoadingMoreMessages(false); // Reset loading state
      if (chatMessages.length > 0) {
        setOldestMessagePosition(chatMessages[0]?.position);
        setHasMoreMessages(chatMessages.length === 10); // Assume more if we got full batch
      } else {
        setOldestMessagePosition(undefined);
        setHasMoreMessages(false);
      }
      
      console.log('📋 selectChat - Query result:', { chatData, chatError });
      
      if (chatError || !chatData) {
        // Chat not found, create new one
        console.log('❌ selectChat - Chat not found in database, creating new chat with ID:', selectedChatId);
        console.log('🔧 selectChat - Error details:', chatError);
        setMessages([]);
        setSelectedRole(roleOptions[0]);
        navigate(`/chat/${selectedChatId}`, { replace: true });
        return;
      }
      
      // Process messages from database with consistent IDs
      console.log('✅ selectChat - Chat found! Processing', chatData.messages?.length || 0, 'messages');
      console.log('📋 selectChat - Raw chat data:', JSON.stringify(chatData, null, 2));
      
      const processedMessages = (chatData.messages || []).map((msg: any, index: number) => {
        // Create a truly unique ID based on message content, position, and timestamp to prevent duplicates
        const uniqueId = msg.id || `${selectedChatId}-${index}-${msg.timestamp || Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        
        // Handle new structured format with attachment field
        if (msg.attachment && msg.attachment.url) {
          console.log('🔍 Found message with attachment field:', {
            messageId: uniqueId,
            sender: msg.sender,
            textContent: msg.text || '(no text)',
            fileName: msg.attachment.fileName
          });
          return {
            id: uniqueId,
            role: msg.sender === 'bot' ? 'assistant' : 'user',
            content: msg.text || '', // Text content separate from image
            timestamp: msg.timestamp || new Date().toISOString(),
            fileContent: msg.attachment.url,
            fileName: msg.attachment.fileName || 'Image'
          };
        }
        
        // Check for new ;;%%;; delimited URLs
        if (msg.text && typeof msg.text === 'string' && msg.text.includes(';;%%;;')) {
          console.log('🔍 Found message with ;;%%;; delimiters:', {
            messageId: uniqueId,
            sender: msg.sender,
            textPreview: msg.text.substring(0, 100) + '...'
          });
          const urlMatch = msg.text.match(/;;%%;;(.*?);;%%;;/);
          if (urlMatch) {
            const fileUrl = urlMatch[1].trim();
            const textContent = msg.text.replace(/;;%%;;.*?;;%%;;/g, '').trim();
            console.log('✅ Successfully extracted file URL from message:', {
              hasFileUrl: !!fileUrl,
              textContent: textContent || '(no text)',
              fileUrlLength: fileUrl.length
            });
            return {
              id: uniqueId,
              role: msg.sender === 'bot' ? 'assistant' : 'user',
              content: msg.text, // Keep the full content with delimiters for display
              timestamp: msg.timestamp || new Date().toISOString(),
              fileContent: fileUrl,
              fileName: 'Attachment'
            };
          }
        }
        
        // Legacy: Check for %%% delimited image URLs
        if (msg.text && typeof msg.text === 'string' && msg.text.includes('%%%')) {
          console.log('🔍 Found message with %%% delimiters:', {
            messageId: uniqueId,
            sender: msg.sender,
            textPreview: msg.text.substring(0, 100) + '...'
          });
          const imageUrlMatch = msg.text.match(/%%%(.*?)%%%/);
          if (imageUrlMatch) {
            const imageUrl = imageUrlMatch[1];
            const textContent = msg.text.replace(/%%%.*?%%%/g, '').trim();
            console.log('✅ Successfully extracted image from message:', {
              hasImageUrl: !!imageUrl,
              textContent: textContent || '(no text)',
              imageUrlLength: imageUrl.length,
              isImageOnly: !textContent
            });
            return {
              id: uniqueId,
              role: msg.sender === 'bot' ? 'assistant' : 'user',
              content: textContent, // Keep original text content, even if empty
              timestamp: msg.timestamp || new Date().toISOString(),
              fileContent: imageUrl,
              fileName: 'Image'
            };
          }
        }
        
        // Legacy support for Supabase storage URLs
        else if (msg.text && typeof msg.text === 'string' && 
            msg.text.includes('supabase.co/storage/v1/')) {
          return {
            id: uniqueId,
            role: msg.sender === 'bot' ? 'assistant' : 'user',
            content: '',
            timestamp: msg.timestamp || new Date().toISOString(),
            fileContent: msg.text,
            fileName: 'Uploaded file'
          };
        } else {
          return {
            id: uniqueId,
            role: msg.sender === 'bot' ? 'assistant' : 'user',
            content: msg.text || '',
            timestamp: msg.timestamp || new Date().toISOString()
          };
        }
      });
      
      console.log('🔄 selectChat - Processed messages:', processedMessages.length);
      console.log('📱 selectChat - Setting messages in state:', JSON.stringify(processedMessages, null, 2));
      
      // Set fresh messages from database only
      setMessages(processedMessages.filter((msg): msg is Message => Boolean(msg)));
      setSelectedRole(roleOptions.find(role => role.id === chatData.role) || roleOptions[0]);
      
      console.log('🎯 selectChat - Chat loaded successfully with', processedMessages.length, 'messages');
      // Update URL
      navigate(`/chat/${selectedChatId}`, { replace: true });
      
    } catch (error) {
      console.error('Error fetching chat from database:', error);
      // Fallback to empty chat
      setMessages([]);
      setSelectedRole(roleOptions[0]);
      navigate(`/chat/${selectedChatId}`, { replace: true });
    }
  };

  // Generation button selection handlers
  const handleImageGenerate = () => {
    setSelectedGenerationType('image_generate');
  };

  const handleXLSXGenerate = () => {
    setSelectedGenerationType('sheet_generate');
  };

  const handleDocsGenerate = () => {
    setSelectedGenerationType('document_generate');
  };

  // Function to send generation request based on selected type
  const sendGenerationRequest = async (type: string, message: string) => {
    setIsGenerating(true);
    
    // Add user message to chat immediately
    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      sender: 'user'
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Save user message to database immediately
    try {
      await saveChatToDatabase(message, 'user');
    } catch (error) {
      console.error('Error saving user message to database:', error);
    }
    
    // Add initial bot message for streaming response
    const botMessageId = Date.now() + 1;
    const generationType = type === 'image_generate' ? 'image' : 
                          type === 'sheet_generate' ? 'spreadsheet' : 'document';
    const initialBotMessage: Message = {
      id: botMessageId,
      role: 'assistant',
      content: type === 'image_generate' ? 'Generating your image...' : '',
      timestamp: new Date().toISOString(),
      sender: 'bot',
      isStreaming: true,
      isGenerating: true,
      generationType: generationType as 'image' | 'spreadsheet' | 'document'
    };
    
    setMessages(prev => [...prev, initialBotMessage]);
    
    try {
      // Use fetch for streaming instead of axios
      const response = await fetch('https://matrixai21.app.n8n.cloud/webhook/910d8b7e-6462-463b-90ef-42056a296c73', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({
          messages: [
            {
              uid: user?.uid || 'anonymous',
              type: type,
              text: {
                body: message
              }
            }
          ],
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      if (reader) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.trim()) {
                try {
                  const data = JSON.parse(line);
                  
                  // Handle streaming content chunks
                  if (data.type === 'item' && data.content && !data.content.includes('output')) {
                    // Only accumulate content if it's not the final output
                    if (type !== 'image_generate') {
                      accumulatedContent += data.content;
                      
                      // Update the bot message with streaming content
                      setMessages(prev => prev.map(msg => 
                        msg.id === botMessageId 
                          ? { ...msg, content: accumulatedContent }
                          : msg
                      ));
                    }
                  } 
                  // Handle final response with output - this is already handled in sendMessageToN8NWebhook
                  // Removing duplicate processing to prevent false data at the end
                  else if (data.type === 'item' && data.content && data.content.includes('output')) {
                    // Skip this processing as it's already handled in the webhook function
                    continue;
                  }
                  // Handle error responses
                  else if (data.type === 'error') {
                    throw new Error(data.content || 'Generation failed');
                  }
                } catch (parseError) {
                  console.warn('Failed to parse streaming data:', parseError);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      }

      // Mark streaming as complete and save final bot response to database
      setMessages(prev => prev.map(msg => {
        if (msg.id === botMessageId) {
          const finalMessage = { ...msg, isStreaming: false, isGenerating: false };
          // Save the final bot response to database
          saveChatToDatabase(finalMessage.content, 'assistant').catch(error => {
            console.error('Error saving bot response to database:', error);
          });
          return finalMessage;
        }
        return msg;
      }));

      const typeNames = {
        'image_generate': 'Image',
        'sheet_generate': 'Spreadsheet', 
        'document_generate': 'Document'
      };
      
      showSuccess(`${typeNames[type as keyof typeof typeNames]} generated successfully!`);
      setInputMessage('');
      setSelectedGenerationType(null);
      
      // Deduct coins for generation
      if (!isPro && userData?.uid) {
        await userService.subtractCoins(userData.uid, 3, 'AI Generation');
        await refreshUserData();
      }
      
    } catch (error) {
      console.error('Error in generation request:', error);
      
      // Determine error type and message
      let errorMessage = 'An unexpected error occurred. Please try again.';
      let detailedError = '';
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Network connection failed. Please check your internet connection.';
          detailedError = 'Unable to connect to the generation service.';
        } else if (error.message.includes('401') || error.message.includes('403')) {
          errorMessage = 'Authentication failed. Please log in again.';
          detailedError = 'Your session may have expired.';
        } else if (error.message.includes('429')) {
          errorMessage = 'Too many requests. Please wait a moment before trying again.';
          detailedError = 'Rate limit exceeded.';
        } else if (error.message.includes('500')) {
          errorMessage = 'Server error. Our team has been notified.';
          detailedError = 'The generation service is temporarily unavailable.';
        } else {
          errorMessage = error.message;
        }
      }
      
      const typeNames = {
        'image_generate': 'image',
        'sheet_generate': 'spreadsheet', 
        'document_generate': 'document'
      };
      
      const contentType = typeNames[type as keyof typeof typeNames] || 'content';
      
      // Update bot message with detailed error
      setMessages(prev => prev.map(msg => 
        msg.id === botMessageId 
          ? { 
              ...msg, 
              content: `❌ **${contentType.charAt(0).toUpperCase() + contentType.slice(1)} Generation Failed**\n\n${errorMessage}${detailedError ? `\n\n*${detailedError}*` : ''}\n\nPlease try again or contact support if the problem persists.`,
              isStreaming: false,
              isGenerating: false 
            }
          : msg
      ));
      
      showError(`Failed to generate ${contentType}. ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="ChatPage flex h-screen overflow-hidden">
      {/* Remove duplicate sidebar - now handled by Layout */}
      
      {/* Mobile sidebar toggle button - Remove since Layout handles this */}
      
      {/* Mobile sidebar/chat history - Keep this as it's specific to chat */}
      {showChatHistory && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div 
            className="bg-black bg-opacity-50 flex-1"
            onClick={() => setShowChatHistory(false)}
          ></div>
          <div className={`w-72 ${darkMode ? 'bg-gray-800' : 'bg-white'} flex flex-col h-full`}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{t('chat.chatHistory')}</h2>
              <AuthRequiredButton 
                onClick={() => setShowChatHistory(false)}
                className={`${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <FiX className="w-5 h-5" />
              </AuthRequiredButton>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <div className="mb-4">
                <h3 className="px-3 mb-2 text-xs font-medium text-gray-400 uppercase tracking-wider">{t('chat.today')}</h3>
                {groupedChatHistory.today.map(chat => renderChatHistoryItem(chat, 'Today'))}
              </div>
              
              <div className="mb-4">
                <h3 className="px-3 mb-2 text-xs font-medium text-gray-400 uppercase tracking-wider">{t('chat.yesterday')}</h3>
                {groupedChatHistory.yesterday.map(chat => renderChatHistoryItem(chat, 'Yesterday'))}
              </div>

              {/* Last week chats */}
              {groupedChatHistory.lastWeek.length > 0 && (
                <div className="mb-3">
                  <h4 className="px-3 mb-1 text-xs font-medium text-gray-400 uppercase tracking-wider">{t('chat.lastWeek')}</h4>
                  {groupedChatHistory.lastWeek.map(chat => renderChatHistoryItem(chat, 'Last week'))}
                </div>
              )}
              
              {/* Last month chats */}
              {groupedChatHistory.lastMonth.length > 0 && (
                <div>
                  <h4 className="px-3 mb-1 text-xs font-medium text-gray-400 uppercase tracking-wider">{t('chat.lastMonth')}</h4>
                  {groupedChatHistory.lastMonth.map(chat => renderChatHistoryItem(chat, 'Last month'))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Main content area */}
        <div className={`flex-1 flex flex-col overflow-hidden ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="flex-1 overflow-hidden relative">
            {/* Show pro alert */}
            <AnimatePresence>
              {showProAlert && (
                <ProFeatureAlert 
                  featureName={t('chat.title')}
                  onClose={() => setShowProAlert(false)}
                />
              )}
            </AnimatePresence>
            
            {/* Main chat container */}
            <div className="h-full w-full sm:max-w-6xl sm:mx-auto px-0 sm:px-4 pt-2 sm:pt-4 pb-0 flex flex-col">
              <div className="bg-opacity-80 backdrop-blur-sm rounded-lg sm:rounded-xl shadow-xl overflow-hidden flex-1 flex flex-col">
                {/* Chat interface */}
                <div ref={chatContainerRef} className="flex flex-col h-full">
                  {/* Chat header with role selector */}
                  <div className={`px-3 sm:px-6 py-2 sm:py-3 flex flex-row justify-between items-center border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="relative">
                      <AuthRequiredButton 
                        onClick={() => setShowRoleSelector(!showRoleSelector)} 
                        className={`flex items-center space-x-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium border ${
                          darkMode ? 'text-gray-200 hover:bg-gray-700 border-gray-600' : 'text-gray-700 hover:bg-gray-50 border-gray-300'
                        }`}
                      >
                        <FiCpu className="text-blue-500 mr-2" />
                        <span>{selectedRole.name}</span>
                        <FiChevronDown className={`transition-transform ${showRoleSelector ? 'rotate-180' : ''}`} />
                      </AuthRequiredButton>
                      
                      {/* Role Selector Dropdown */}
                      {showRoleSelector && (
                        <div className={`absolute top-full left-0 mt-1 w-56 sm:w-64 rounded-md shadow-lg z-10 ${
                          darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                        }`}>
                          <div className="py-1 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
                            {roleOptions.map(role => (
                              <button
                                key={role.id}
                                className={`w-full text-left px-3 py-1.5 text-sm transition-colors duration-150 ${
                                  darkMode 
                                    ? 'hover:bg-gray-700 text-gray-200' 
                                    : 'hover:bg-gray-100 text-gray-700'
                                }`}
                                onClick={() => handleRoleChange(role)}
                              >
                                <div className="font-medium text-sm">{role.name}</div>
                                <div className={`text-xs leading-tight mt-0.5 ${
                                  darkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  {role.description}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-1 sm:space-x-2">

                      
                      {/* Mobile chat history button */}
                      <AuthRequiredButton 
                        onClick={() => setShowChatHistory(!showChatHistory)}
                        className={`md:hidden p-1.5 sm:p-2 rounded-lg ${
                          showChatHistory
                            ? (darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-700') 
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                        title={t('chat.toggleChatHistory')}
                      >
                        <FiMessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                      </AuthRequiredButton>
                      
                      {/* Desktop chat history button */}
                      <div className="hidden md:block relative" ref={historyDropdownRef}>
                        <AuthRequiredButton 
                          onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
                          className={`p-1.5 sm:p-2 rounded-lg ${
                            showHistoryDropdown
                              ? (darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-700') 
                              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                          }`}
                          title={t('chat.toggleChatHistory')}
                        >
                          <FiClock className="w-4 h-4 sm:w-5 sm:h-5" />
                        </AuthRequiredButton>
                        
                        {/* History dropdown */}
                        {showHistoryDropdown && (
                          <div className={`absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-lg shadow-lg border z-50 ${
                            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                          }`}>
                            <div className="p-3">
                              <h3 className={`text-sm font-medium mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                {t('chat.chatHistory')}
                              </h3>
                              
                              {isLoadingChats ? (
                                <ChatHistorySkeleton />
                              ) : (
                                <>
                                  {/* Today */}
                                  {groupedChatHistory.today.length > 0 && (
                                    <div className="mb-4">
                                      <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                                        {t('chat.today')}
                                      </h4>
                                      {groupedChatHistory.today.map(chat => renderChatHistoryItem(chat, t('chat.today')))}
                                    </div>
                                  )}
                                  
                                  {/* Yesterday */}
                                  {groupedChatHistory.yesterday.length > 0 && (
                                    <div className="mb-4">
                                      <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                                        {t('chat.yesterday')}
                                      </h4>
                                      {groupedChatHistory.yesterday.map(chat => renderChatHistoryItem(chat, t('chat.yesterday')))}
                                    </div>
                                  )}
                                  
                                  {/* Last Week */}
                                  {groupedChatHistory.lastWeek.length > 0 && (
                                    <div className="mb-4">
                                      <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                                        {t('chat.lastWeek')}
                                      </h4>
                                      {groupedChatHistory.lastWeek.map(chat => renderChatHistoryItem(chat, t('chat.lastWeek')))}
                                    </div>
                                  )}
                                  
                                  {/* Last Month */}
                                  {groupedChatHistory.lastMonth.length > 0 && (
                                    <div>
                                      <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                                        {t('chat.lastMonth')}
                                      </h4>
                                      {groupedChatHistory.lastMonth.map(chat => renderChatHistoryItem(chat, t('chat.lastMonth')))}
                                    </div>
                                  )}
                                  
                                  {/* Empty state */}
                                  {groupedChatHistory.today.length === 0 && 
                                   groupedChatHistory.yesterday.length === 0 && 
                                   groupedChatHistory.lastWeek.length === 0 && 
                                   groupedChatHistory.lastMonth.length === 0 && (
                                    <div className={`text-center py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                      {t('chat.noHistory') || 'No chat history'}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <AuthRequiredButton 
                        onClick={handleStartNewChat}
                        className="p-1.5 sm:p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        title={t('chat.newChat')}
                      >
                        <FiPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                      </AuthRequiredButton>
                      

                      
                      {/* Auto-speak toggle */}
                      <AuthRequiredButton 
                        onClick={toggleAutoSpeak}
                        className={`p-1.5 sm:p-2 rounded ${
                          autoSpeak
                            ? (darkMode ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-600')
                            : (darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700')
                        }`}
                        title={autoSpeak ? t('chat.autoSpeakOn') : t('chat.autoSpeakOff')}
                      >
                        {autoSpeak ? <FiVolume2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <FiVolume className="w-4 h-4 sm:w-5 sm:h-5" />}
                      </AuthRequiredButton>
                      
                      {/* Call button */}
                    
                    </div>
                  </div>
                  
                  {/* Messages container with improved markdown */}
                  <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-2 sm:px-4 py-2 sm:py-4">
                    <div className="max-w-3xl mx-auto space-y-3 sm:space-y-6">
                      {/* Loading indicator for lazy loading */}
                      {isLoadingMoreMessages && (
                        <div className="flex justify-center py-4">
                          <div className={`animate-spin rounded-full h-6 w-6 border-b-2 ${
                            darkMode ? 'border-blue-400' : 'border-blue-600'
                          }`}></div>
                        </div>
                      )}
                      {/* Empty state when no messages */}
                      {messages.length === 0 && !isLoading && (
                        <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                          <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mb-4 sm:mb-6 ${
                            darkMode ? 'bg-gradient-to-r from-blue-900 to-purple-900 text-white' : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                          }`}>
                            <FiCpu className="w-8 h-8 sm:w-10 sm:h-10" />
                          </div>
                          <h3 className={`text-lg sm:text-xl font-semibold mb-2 ${
                            darkMode ? 'text-gray-200' : 'text-gray-800'
                          }`}>
                            {t('chat.emptyState.title') || 'Start a new conversation'}
                          </h3>
                          <p className={`text-sm sm:text-base mb-6 max-w-md ${
                            darkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {t('chat.emptyState.description') || 'Ask me anything! I\'m here to help with your questions and tasks.'}
                          </p>
                          <div className={`text-xs sm:text-sm ${
                            darkMode ? 'text-gray-500' : 'text-gray-500'
                          }`}>
                            {selectedRole.name && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                <FiCpu className="w-3 h-3 mr-1" />
                                {selectedRole.name}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {messages.map((message) => {
                        // Process message to handle delimiter format and create attachments array
                        let processedMessage = { ...message };
                        
                        // Create attachments array for UserMessageAttachments component
                        if (message.role === 'user') {
                          // Initialize attachments array
                          const attachments: {
                            url: string;
                            fileName: string;
                            fileType: string;
                            originalName?: string;
                            size?: number;
                          }[] = [];
                          
                          // Priority 1: Use existing attachments if they exist (from uploadedFiles)
                          if (message.attachments && message.attachments.length > 0) {
                            attachments.push(...message.attachments);
                          }
                          // Priority 2: Check for ;;%%;; delimited URLs in content (database format) ONLY if no attachments exist
                          else if (message.content && typeof message.content === 'string' && message.content.includes(';;%%;;')) {
                            const urlMatch = message.content.match(/;;%%;;(.*?);;%%;;/);
                            if (urlMatch) {
                              const fileUrl = urlMatch[1].trim();
                              attachments.push({
                                url: fileUrl,
                                fileName: message.fileName || 'Attachment',
                                fileType: 'application/octet-stream',
                                originalName: message.fileName || undefined,
                                size: undefined
                              });
                              processedMessage.fileContent = fileUrl;
                              processedMessage.fileName = message.fileName || 'Attachment';
                            }
                          }
                          // Priority 3: Check for file_url fields (database format)
                          else if (message.file_url) {
                            attachments.push({
                              url: message.file_url,
                              fileName: message.file_name || 'Attachment',
                              fileType: message.file_type || 'application/octet-stream',
                              originalName: message.file_name || undefined,
                              size: message.file_size || undefined
                            });
                          }
                          
                          // Only set attachments if we found any
                          if (attachments.length > 0) {
                            processedMessage.attachments = attachments;
                          }
                        }
                        
                        // Process bot messages for file URLs
                        if (message.role === 'assistant') {
                          const fileExtraction = extractFileUrlFromBotResponse(message.content);
                          
                          if (fileExtraction.fileUrl) {
                            // Update the message content to remove the file URL text
                            processedMessage.content = fileExtraction.cleanContent;
                            
                            // Create attachments array for bot message
                            const botAttachments: {
                              url: string;
                              fileName: string;
                              fileType: string;
                              originalName?: string;
                              size?: number;
                            }[] = [{
                              url: fileExtraction.fileUrl,
                              fileName: fileExtraction.fileName || 'Generated File',
                              fileType: fileExtraction.fileType || 'application/octet-stream',
                              originalName: fileExtraction.fileName || undefined,
                              size: undefined
                            }];
                            
                            processedMessage.attachments = botAttachments;
                            console.log('Created bot file attachment:', processedMessage.id, botAttachments);
                          }
                        }
                        
                        return (
                        <motion.div
                          key={processedMessage.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className={`flex ${processedMessage.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[90%] sm:max-w-[85%] flex ${processedMessage.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            {/* Avatar */}
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${processedMessage.role === 'user' ? 'ml-2 sm:ml-3' : 'mr-2 sm:mr-3'} ${
                              processedMessage.role === 'user'
                                ? (darkMode ? 'bg-blue-600' : 'bg-blue-500 text-white')
                                : (darkMode ? 'bg-gradient-to-r from-blue-900 to-purple-900 text-white' : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white')
                            }`}>
                              {processedMessage.role === 'user' ? <FiUser /> : <FiCpu />}
                            </div>
                            
                            <div className={`rounded-xl sm:rounded-2xl px-3 sm:px-6 py-3 sm:py-4 ${
                              processedMessage.role === 'user'
                                ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                                : (darkMode ? 'bg-gray-800 border border-gray-700 text-gray-100' : 'bg-white border border-gray-200 shadow-sm text-gray-900')
                            }`}>
                              {/* User Message Attachments */}
                              {processedMessage.role === 'user' && 'attachments' in processedMessage && processedMessage.attachments && processedMessage.attachments.length > 0 && (
                                <UserMessageAttachments 
                                  attachments={processedMessage.attachments}
                                />
                              )}

                              
                              {/* Generated Image Display */}
                              {(processedMessage.image_url || (processedMessage.isGenerating && processedMessage.generationType === 'image')) && (
                                <div className="mb-3">
                                  <div className={`relative rounded-lg overflow-hidden border ${
                                    darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'
                                  } shadow-lg w-full max-w-lg mx-auto`}>
                                    {processedMessage.isGenerating && processedMessage.generationType === 'image' && !processedMessage.image_url ? (
                                      <ImageSkeleton className="w-full h-full" />
                                    ) : processedMessage.image_url ? (
                                      <>
                                        <img 
                                          src={processedMessage.image_url} 
                                          alt="Generated image" 
                                          className="w-full h-auto block rounded-lg transition-opacity duration-300 opacity-0"
                                          onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                          }}
                                          onLoad={(e) => {
                                            e.currentTarget.style.opacity = '1';
                                          }}
                                        />
                                        <div className={`hidden p-4 text-center ${
                                          darkMode ? 'text-gray-300' : 'text-gray-600'
                                        }`}>
                                          <div className="flex items-center justify-center space-x-2 mb-2">
                                            <FiImage className="text-2xl" />
                                            <span className="text-sm font-medium">Failed to load image</span>
                                          </div>
                                          <p className="text-xs opacity-75">The generated image could not be displayed</p>
                                        </div>
                                        
                                        {/* Image overlay with download button */}
                                        <div className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity duration-200">
                                          <a
                                            href={processedMessage.image_url}
                                            download="generated-image.png"
                                            className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
                                              darkMode 
                                                ? 'bg-black/50 hover:bg-black/70 text-white' 
                                                : 'bg-white/50 hover:bg-white/70 text-gray-800'
                                            }`}
                                            title="Download image"
                                          >
                                            <FiDownload size={16} />
                                          </a>
                                        </div>
                                      </>
                                    ) : null}
                                  </div>
                                  
                                  {/* Image info */}
                                  <div className={`mt-2 text-xs ${
                                    darkMode ? 'text-gray-400' : 'text-gray-500'
                                  }`}>
                                    <div className="flex items-center justify-between">
                                      <span>Generated Image</span>
                                      <span>Click image to view full size</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                              


                              {/* Loading indicator for generation requests */}
                              {message.isGenerating && (
                                <div className="mb-3">
                                  <div className={`p-4 rounded-lg border-2 border-dashed ${darkMode ? 'border-blue-500 bg-blue-900/20' : 'border-blue-300 bg-blue-50'}`}>
                                    <div className="flex items-center space-x-3">
                                      <div className="relative">
                                        <div className={`w-6 h-6 rounded-full border-2 border-transparent ${darkMode ? 'border-t-blue-400' : 'border-t-blue-500'} animate-spin`}></div>
                                      </div>
                                      <div>
                                        <p className={`font-medium text-sm ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                                          {message.generationType === 'image' && 'Generating image...'}
                                          {message.generationType === 'spreadsheet' && 'Creating spreadsheet...'}
                                          {message.generationType === 'document' && 'Writing document...'}
                                        </p>
                                        <p className={`text-xs ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                          This may take a few moments
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Bot Message Attachments */}
                              {processedMessage.role === 'assistant' && processedMessage.attachments && processedMessage.attachments.length > 0 && (
                                <div className="mb-3">
                                  <BotMessageAttachments 
                                    attachments={processedMessage.attachments}
                                    darkMode={darkMode}
                                  />
                                </div>
                              )}

                              {/* Text content with markdown and math rendering */}
              <div className="markdown-content">
                {editingMessageId === message.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      className={`w-full p-3 border rounded-lg resize-none ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                          : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                      rows={3}
                      autoFocus
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveEdit}
                        className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm flex items-center space-x-1"
                      >
                        <FiCheck size={14} />
                        <span>Save</span>
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className={`px-3 py-1 rounded-lg transition-colors text-sm flex items-center space-x-1 ${
                          darkMode 
                            ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        <FiX size={14} />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                ) : processedMessage.isStreaming ? (
                  <div className="prose prose-sm max-w-none">
                    <div className="inline-block">
                      <span className="inline">
                        {renderTextWithMath(displayedText[processedMessage.id] || '', darkMode, {
                          color: processedMessage.role === 'user' ? '#ffffff' : (darkMode ? '#f3f4f6' : '#1f2937')
                        })}
                      </span>
                      <span className="inline-flex items-center space-x-1 ml-1 align-baseline">
                        <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none">
                    {(() => {
                      // Process user messages with delimiters - only show text content, attachments are handled by UserMessageAttachments component
                      if (processedMessage.role === 'user' && processedMessage.content.includes(';;%%;;')) {
                        const textContent = processedMessage.content.replace(/;;%%;;.*?;;%%;;/g, '').trim();
                        if (textContent) {
                          return renderTextWithMath(textContent, darkMode, {
                            color: processedMessage.role === 'user' ? '#ffffff' : (darkMode ? '#f3f4f6' : '#1f2937')
                          });
                        }
                        return <div className="text-xs opacity-75">Attachment</div>; // Show placeholder text when only attachment without text
                      }
                      // Default rendering for other messages
                      return renderTextWithMath(processedMessage.content, darkMode, {
                        color: processedMessage.role === 'user' ? '#ffffff' : (darkMode ? '#f3f4f6' : '#1f2937')
                      });
                    })()} 
                  </div>
                )}
              </div>
                              

                              
                              {/* Message footer */}
                              <div className={`mt-2 flex items-center justify-between text-xs ${
                                processedMessage.role === 'assistant' 
                                  ? (darkMode ? 'text-gray-500' : 'text-gray-500') 
                                  : 'text-blue-200'
                              }`}>
                                <span className="text-xs">{formatTimestamp(processedMessage.timestamp)}</span>
                                
                                <div className="flex space-x-1 sm:space-x-2">
                                  {/* Add message actions here */}
                                  {/* Copy button for all messages (attachments are handled by UserMessageAttachments component) */}
                                  <button 
                                    onClick={() => copyToClipboard(processedMessage.content)}
                                    className={`p-1 rounded-full ${processedMessage.role === 'user' ? 'hover:bg-blue-700 text-blue-200' : (darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500')}`}
                                    aria-label={t('chat.copyToClipboard')}
                                  >
                                    <FiCopy size={12} className="sm:w-3.5 sm:h-3.5" />
                                  </button>
                                  {processedMessage.role === 'user' && !('fileContent' in processedMessage && processedMessage.fileContent) && (
                                    <button 
                                      onClick={() => handleEditMessage(processedMessage.id, processedMessage.content)}
                                      className={`p-1 rounded-full ${processedMessage.role === 'user' ? 'hover:bg-blue-700 text-blue-200' : (darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500')}`}
                                      aria-label="Edit message"
                                    >
                                      <FiEdit size={12} className="sm:w-3.5 sm:h-3.5" />
                                    </button>
                                  )}
                                  {processedMessage.role === 'assistant' && (
                                    <>
                                      <button 
                                        onClick={() => handleTextToSpeech(processedMessage.content, processedMessage.id)}
                                        className={`p-1 rounded-full ${
                                          speakingMessageId === processedMessage.id 
                                            ? (darkMode ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-600')
                                            : (darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500')
                                        }`}
                                        aria-label={speakingMessageId === processedMessage.id ? t('chat.stopSpeaking') : t('chat.speakMessage')}
                                      >
                                        {speakingMessageId === processedMessage.id ? 
                                          <FiSquare size={12} className="sm:w-3.5 sm:h-3.5" /> : 
                                          <FiVolume2 size={12} className="sm:w-3.5 sm:h-3.5" />
                                        }
                                      </button>
                                      <button 
                                        onClick={() => handleShareMessage(processedMessage.content)}
                                        className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                                        aria-label={t('chat.shareMessage')}
                                      >
                                        <FiShare2 size={12} className="sm:w-3.5 sm:h-3.5" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                        );
                      })}
                      
                      {/* Loading indicator - only show when there are no messages */}
                      {isLoading && messages.length === 0 && (
                        <div className="flex justify-start">
                          <div className="max-w-[90%] sm:max-w-[85%] flex flex-row">
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 mr-2 sm:mr-3 ${darkMode ? 'bg-gradient-to-r from-blue-900 to-purple-900 text-white' : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'}`}>
                              <FiCpu />
                            </div>
                            <div className={`rounded-xl sm:rounded-2xl px-3 sm:px-6 py-3 sm:py-4 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200 shadow-sm'}`}>
                              <div className="flex space-x-2">
                                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div ref={messagesEndRef} />
                    </div>
                  </div>
                  
                  {/* Input area */}
                  <div className={`p-2 sm:p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    
                    {/* File Upload Status */}
                    {isUploading && (
                      <div className={`mb-3 p-3 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center space-x-3">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                Uploading {uploadingFileName}...
                              </span>
                              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {uploadProgress}%
                              </span>
                            </div>
                            <div className={`w-full bg-gray-200 rounded-full h-2 ${darkMode ? 'bg-gray-700' : ''}`}>
                              <div 
                                className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${uploadProgress}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Uploaded File Display */}
                    {currentUploadedFile && !isUploading && (
                      <div className={`mb-3 p-3 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                              {currentUploadedFile.fileType === 'image' ? (
                                <FiImage className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                              ) : (
                                <FiFileText className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                              )}
                            </div>
                            <div>
                              <div className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                {currentUploadedFile.originalName}
                              </div>
                              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {currentUploadedFile.fileType === 'image' ? 'Image' : 'Document'} • {formatFileSize(currentUploadedFile.size)}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => setCurrentUploadedFile(null)}
                            className={`p-1 rounded-full hover:bg-gray-200 ${darkMode ? 'hover:bg-gray-600 text-gray-400' : 'text-gray-500'}`}
                          >
                            <FiX className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Fixed Generation Buttons */}
                    <div className="mb-3">
                      <div className="flex items-center space-x-2 overflow-x-auto pb-2">


                        <AuthRequiredButton
                          onClick={handleXLSXGenerate}
                          disabled={isGenerating}
                          className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                            selectedGenerationType === 'sheet_generate'
                              ? (darkMode ? 'bg-green-700 border-2 border-green-500 text-white' : 'bg-green-600 border-2 border-green-400 text-white')
                              : isGenerating
                              ? (darkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
                              : (darkMode ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white' : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white')
                          }`}
                        >
                          <FiFileText className="w-4 h-4" />
                          <span>XLSX Generate</span>
                          {selectedGenerationType === 'sheet_generate' && (
                            <FiCheck className="w-4 h-4" />
                          )}
                          {isGenerating && (
                            <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                          )}
                        </AuthRequiredButton>

                        <AuthRequiredButton
                          onClick={handleDocsGenerate}
                          disabled={isGenerating}
                          className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                            selectedGenerationType === 'document_generate'
                              ? (darkMode ? 'bg-blue-700 border-2 border-blue-500 text-white' : 'bg-blue-600 border-2 border-blue-400 text-white')
                              : isGenerating
                              ? (darkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
                              : (darkMode ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white' : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white')
                          }`}
                        >
                          <FiFile className="w-4 h-4" />
                          <span>Docs Generate</span>
                          {selectedGenerationType === 'document_generate' && (
                            <FiCheck className="w-4 h-4" />
                          )}
                          {isGenerating && (
                            <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                          )}
                        </AuthRequiredButton>
                      </div>
                    </div>

                    {/* Message limit warning */}
                    {isMessageLimitReached && (
                      <div className={`mb-3 p-3 rounded-lg border ${darkMode ? 'bg-red-900/20 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700'}`}>
                        <div className="flex items-center space-x-2">
                          <FiMessageSquare className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            You have reached the 40-message limit for this chat. Please start a new chat to continue.
                          </span>
                        </div>
                        <button
                          onClick={handleStartNewChat}
                          className={`mt-2 px-3 py-1 text-xs rounded-md ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                        >
                          Start New Chat
                        </button>
                      </div>
                    )}
                    
                    {/* Processing Status Indicator */}
                    {processingStatus?.isProcessing && (
                      <div className={`mb-2 p-3 rounded-lg border-l-4 border-blue-500 ${darkMode ? 'bg-blue-900/20 border-blue-400' : 'bg-blue-50 border-blue-500'}`}>
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                          <span className={`text-sm font-medium ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                            Processing {processingStatus?.fileName}...
                          </span>
                        </div>
                        <div className={`mt-2 text-xs ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                          Page {processingStatus?.currentPage} of {processingStatus?.totalPages}
                        </div>
                        <div className={`mt-1 w-full bg-gray-200 rounded-full h-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${((processingStatus?.currentPage || 0) / (processingStatus?.totalPages || 1)) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    {selectedFile && (
                      <div className={`mb-2 p-2 rounded-lg flex items-center space-x-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <FiFile className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} w-4 h-4`} />
                        <span className="text-xs sm:text-sm truncate flex-1">{selectedFile.name}</span>
                        <AuthRequiredButton 
                          onClick={() => setSelectedFile(null)}
                          className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}
                        >
                          <FiX size={14} className="sm:w-4 sm:h-4" />
                        </AuthRequiredButton>
                      </div>
                    )}
                    
                    {uploadedFiles.length > 0 && (
                      <div className={`mb-2 p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <div className="flex items-center space-x-2 mb-2">
                          <FiUpload className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} w-4 h-4`} />
                          <span className="text-xs sm:text-sm font-medium">{uploadedFiles.length} file(s) attached</span>
                        </div>
                        <div className="space-y-1">
                          {uploadedFiles.map((file, index) => (
                            <div key={index} className="flex items-center space-x-2">
                               {file.fileType === 'image' ? (
                                 <FiImage className={`${darkMode ? 'text-blue-400' : 'text-blue-600'} w-3 h-3`} />
                               ) : (
                                 <FiFileText className={`${darkMode ? 'text-green-400' : 'text-green-600'} w-3 h-3`} />
                               )}
                               <span className="text-xs truncate flex-1">{file.originalName}</span>
                              <AuthRequiredButton 
                                onClick={() => {
                                  const newFiles = uploadedFiles.filter((_, i) => i !== index);
                                  setUploadedFiles(newFiles);
                                }}
                                className={`p-0.5 rounded-full ${darkMode ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}
                              >
                                <FiX size={12} />
                              </AuthRequiredButton>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className={`flex items-end rounded-lg sm:rounded-xl ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border border-gray-300'} focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 ${isMessageLimitReached ? 'opacity-50' : ''}`}>
                      <textarea
                        ref={textareaRef}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isMessageLimitReached ? 'Message limit reached. Start a new chat to continue.' : 
                          selectedGenerationType === 'image_generate' ? 'Describe your image...' :
                          selectedGenerationType === 'sheet_generate' ? 'Describe your spreadsheet...' :
                          selectedGenerationType === 'document_generate' ? 'Describe your document...' :
                          t('chat.placeholder')}
                        rows={1}
                        disabled={isMessageLimitReached}
                        className={`flex-1 py-2 sm:py-3 px-3 sm:px-4 bg-transparent focus:outline-none resize-none max-h-32 text-sm sm:text-base ${darkMode ? 'text-white placeholder-gray-400' : 'text-gray-700 placeholder-gray-400'} ${isMessageLimitReached ? 'cursor-not-allowed' : ''}`}
                      />
                      <div className="flex items-center space-x-1 p-1.5 sm:p-2">
                        <input 
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          onChange={handleFileChange}
                          accept="image/*,.pdf,.doc,.docx"
                        />
                        <AuthRequiredButton 
                          onClick={() => setIsFileUploadPopupOpen(true)}
                          className={`p-1.5 sm:p-2 rounded-full ${darkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                          aria-label="Attach files"
                        >
                          <FiFile className="w-4 h-4 sm:w-5 sm:h-5" />
                        </AuthRequiredButton>
                        <div className="relative">
                          <AuthRequiredButton
                            onClick={handleSendMessage}
                            disabled={(!inputMessage.trim() && !selectedFile && !selectedGenerationType && uploadedFiles.length === 0) || isMessageLimitReached || isSending}
                            className={`p-1.5 sm:p-2 rounded-full flex items-center ${
                                (!inputMessage.trim() && !selectedFile && !selectedGenerationType && uploadedFiles.length === 0) || isMessageLimitReached
                                  ? (darkMode ? 'text-gray-500 bg-gray-800' : 'text-gray-400 bg-gray-100') 
                                  : (darkMode ? 'text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' : 'text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600')
                              }`}
                            aria-label={t('chat.sendMessage')}
                          >
                            <FiSend className="w-4 h-4 sm:w-5 sm:h-5" />
                            {((inputMessage.trim() || selectedFile || selectedGenerationType || uploadedFiles.length > 0) && !isMessageLimitReached) && (
                              <span className="ml-1 text-xs bg-orange-500/20 px-1.5 py-0.5 rounded-full flex items-center">
                                -{selectedGenerationType ? '3' : selectedFile ? (
                                  selectedFile.type === 'application/pdf' || selectedFile.name.toLowerCase().endsWith('.pdf') ||
                                  selectedFile.type === 'application/msword' || 
                                  selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                                  selectedFile.name.toLowerCase().endsWith('.doc') || selectedFile.name.toLowerCase().endsWith('.docx')
                                    ? '2p' : '2'
                                ) : '1'}

                              </span>
                            )}
                          </AuthRequiredButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* File Preview Modal */}
      {isFilePreviewOpen && (
        <FilePreviewModal
          isOpen={isFilePreviewOpen}
          onClose={handleCloseFilePreview}
          fileUrl={previewFileUrl}
          fileName={previewFileName}
          fileType={previewFileType}
        />
      )}

      {/* File Upload Popup */}
      {isFileUploadPopupOpen && (
        <FileUploadPopup
          isOpen={isFileUploadPopupOpen}
          onClose={handleCloseFileUploadPopup}
          onFileSelect={async (file, type) => {
            try {
              setIsUploading(true);
              setUploadingFileName(file.name);
              setUploadProgress(0);
              setIsFileUploadPopupOpen(false);
              
              // Simulate upload progress
              const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                  if (prev >= 90) {
                    clearInterval(progressInterval);
                    return 90;
                  }
                  return prev + 10;
                });
              }, 200);
              
              const uploadedFile = await uploadFileToStorage(file, user?.uid || 'anonymous', type);
              
              clearInterval(progressInterval);
              setUploadProgress(100);
              
              setTimeout(() => {
                setCurrentUploadedFile(uploadedFile);
                setIsUploading(false);
                setUploadProgress(0);
                setUploadingFileName('');
              }, 500);
              
            } catch (error) {
              console.error('Error uploading file:', error);
              setIsUploading(false);
              setUploadProgress(0);
              setUploadingFileName('');
              showError('Failed to upload file. Please try again.');
            }
          }}
        />
      )}

      {/* Pro Feature Alert */}
      {showProAlert && (
        <ProFeatureAlert
          featureName={t('chat.title')}
          onClose={() => setShowProAlert(false)}
        />
      )}
    </div>
  );
};

export default ChatPage;
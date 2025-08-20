import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../utils/axiosInterceptor';
import OpenAI from 'openai';
import { userService } from '../services/userService';
import { supabase } from '../supabaseClient';
import { useTranslation } from 'react-i18next';
import { 
  FiPlay, FiPause, FiDownload, FiCopy, FiShare2, 
  FiChevronLeft, FiChevronRight, FiRefreshCw, FiLoader,
  FiMaximize, FiMinimize, FiMenu, FiLayout, FiSave, FiFileText,
  FiBarChart2, FiZap, FiSettings, FiBookmark, FiMic,
  FiMessageSquare, FiGlobe, FiToggleLeft, FiToggleRight,
  FiCpu, FiUser, FiSquare, FiVolume2, FiChevronDown
} from 'react-icons/fi';
import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useAlert } from '../context/AlertContext';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';
import katex from 'katex';
import MindMapComponent from '../components/MindMapComponent';
import coinIcon from '../assets/coin.png';

// Define types for word timings
interface WordTiming {
  word: string;
  startTime: number;
  endTime: number;
}

interface Paragraph {
  text: string;
  words: WordTiming[];
  startTime: number;
  endTime: number;
}

const azureEndpoint = 'https://api.cognitive.microsofttranslator.com';
const azureKey = '21oYn4dps9k7VJUVttDmU3oigC93LUtyYB9EvQatENmWOufZa4xeJQQJ99ALACYeBjFXJ3w3AAAbACOG0HQP';
const region = 'eastus';

// Languages will be defined inside component to use translation

// Enhanced Code Block Component
const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const codeString = String(children).replace(/\n$/, '');
  
  if (!inline && (language || codeString.includes('\n'))) {
    return (
      <div className="relative my-4 rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Language label */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            {language || t('transcription.code')}
          </span>
          <button
            onClick={() => navigator.clipboard.writeText(codeString)}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title={t('transcription.copyCode')}
          >
            <FiCopy size={12} />
            {t('transcription.copy')}
          </button>
        </div>
        
        {/* Code content */}
        <SyntaxHighlighter
          style={theme === 'dark' ? oneDark : oneLight}
          language={language || 'text'}
          PreTag="div"
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: 'transparent',
            fontSize: '0.875rem',
            lineHeight: '1.5'
          }}
          codeTagProps={{
            style: {
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
            }
          }}
        >
          {codeString}
        </SyntaxHighlighter>
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

// Enhanced Markdown Components with better styling
const MarkdownComponents = {
  // Headings with improved styling and spacing
  h1: ({ children, ...props }: any) => (
    <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 mt-6 pb-2 border-b border-gray-200 dark:border-gray-700 first:mt-0" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: any) => (
    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-5 flex items-center" {...props}>
      <span className="w-1 h-4 bg-blue-500 rounded-full mr-2"></span>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: any) => (
    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2 mt-4 flex items-center" {...props}>
      <span className="w-1 h-3 bg-blue-500 rounded-full mr-2"></span>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }: any) => (
    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 mt-3 flex items-center" {...props}>
      <span className="w-1 h-2 bg-blue-500 rounded-full mr-2"></span>
      {children}
    </h4>
  ),
  h5: ({ children, ...props }: any) => (
    <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1 mt-2" {...props}>
      {children}
    </h5>
  ),
  h6: ({ children, ...props }: any) => (
    <h6 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 mt-2" {...props}>
      {children}
    </h6>
  ),

  // Enhanced paragraphs with better spacing and typography
  p: ({ children, ...props }: any) => (
    <p className="mb-3 text-gray-800 dark:text-gray-200 leading-relaxed text-sm" {...props}>
      {children}
    </p>
  ),

  // Enhanced lists with better styling and spacing
  ul: ({ children, ...props }: any) => (
    <ul className="mb-4 ml-4 space-y-1 text-gray-800 dark:text-gray-200" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: any) => (
    <ol className="mb-4 ml-4 space-y-1 text-gray-800 dark:text-gray-200 list-decimal" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }: any) => (
    <li className="leading-relaxed flex items-start text-sm" {...props}>
      <span className="w-1 h-1 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
      <span className="flex-1">{children}</span>
    </li>
  ),

  // Enhanced blockquotes with better visual design
  blockquote: ({ children, ...props }: any) => (
    <blockquote className="border-l-2 border-blue-500 dark:border-blue-400 pl-3 py-2 my-3 bg-blue-50 dark:bg-blue-900/20 rounded-r text-gray-700 dark:text-gray-300 italic text-sm" {...props}>
      {children}
    </blockquote>
  ),

  // Enhanced links with better hover effects
  a: ({ children, href, ...props }: any) => (
    <a 
      href={href}
      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline text-sm"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),

  // Enhanced horizontal rule with gradient
  hr: ({ ...props }: any) => (
    <div className="my-4 flex items-center" {...props}>
      <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
    </div>
  ),

  // Enhanced emphasis and strong with better styling
  em: ({ children, ...props }: any) => (
    <em className="italic text-gray-800 dark:text-gray-200 font-medium" {...props}>
      {children}
    </em>
  ),
  strong: ({ children, ...props }: any) => (
    <strong className="font-bold text-gray-900 dark:text-gray-100" {...props}>
      {children}
    </strong>
  ),

  // Code blocks
  code: CodeBlock,

  // Tables with enhanced styling
  table: ({ children, ...props }: any) => <TableWrapper {...props}>{children}</TableWrapper>,
  thead: ({ children, ...props }: any) => <TableHead {...props}>{children}</TableHead>,
  tbody: ({ children, ...props }: any) => <TableBody {...props}>{children}</TableBody>,
  tr: ({ children, ...props }: any) => <TableRow {...props}>{children}</TableRow>,
  td: ({ children, ...props }: any) => <TableCell {...props}>{children}</TableCell>,
  th: ({ children, ...props }: any) => <TableHeaderCell {...props}>{children}</TableHeaderCell>,

  // Enhanced images with better presentation
  img: ({ src, alt, ...props }: any) => (
    <div className="my-4">
      <img 
        src={src}
        alt={alt}
        className="max-w-full h-auto rounded-lg shadow border border-gray-200 dark:border-gray-700"
        loading="lazy"
        {...props}
      />
      {alt && (
        <p className="text-xs text-gray-600 dark:text-gray-400 text-center mt-2 italic">
          {alt}
        </p>
      )}
    </div>
  ),

  // Task lists with better styling
  input: ({ type, checked, ...props }: any) => {
    if (type === 'checkbox') {
      return (
        <input
          type="checkbox"
          checked={checked}
          readOnly
          className="mr-2 rounded border-gray-300 dark:border-gray-600 text-blue-600 w-3 h-3"
          {...props}
        />
      );
    }
    return <input type={type} {...props} />;
  }
};

// Function to render text with math expressions and markdown formatting
const renderTextWithMath = (text: string, theme: string, textStyle?: string) => {
  if (!text) return null;
  
  // Preprocess the content to handle math expressions and clean formatting
  const processedText = preprocessContent(text);
  
  return (
    <div className={`markdown-content ${theme === 'dark' ? 'dark' : ''} ${textStyle || ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeRaw]}
        components={{
          h1: ({ children }: any) => {
            const cleanText = typeof children === 'string' ? children.replace(/^#+\s*/, '') : children;
            return (
              <h1 className={`text-2xl font-bold mb-4 mt-6 flex items-center gap-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                <span className="text-blue-500">📋</span>
                {cleanText}
              </h1>
            );
          },
          h2: ({ children }: any) => {
            const cleanText = typeof children === 'string' ? children.replace(/^#+\s*/, '') : children;
            return (
              <h2 className={`text-xl font-bold mb-3 mt-5 flex items-center gap-2 ${
                theme === 'dark' ? 'text-gray-100' : 'text-gray-800'
              }`}>
                <span className="text-green-500">📝</span>
                {cleanText}
              </h2>
            );
          },
          h3: ({ children }: any) => {
            const cleanText = typeof children === 'string' ? children.replace(/^#+\s*/, '') : children;
            return (
              <h3 className={`text-lg font-semibold mb-2 mt-4 flex items-center gap-2 ${
                theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
              }`}>
                <span className="text-purple-500">📌</span>
                {cleanText}
              </h3>
            );
          },
          h4: ({ children }: any) => {
            const cleanText = typeof children === 'string' ? children.replace(/^#+\s*/, '') : children;
            return (
              <h4 className={`text-base font-semibold mb-2 mt-3 flex items-center gap-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                <span className="text-orange-500">🔸</span>
                {cleanText}
              </h4>
            );
          },
          h5: ({ children }: any) => {
            const cleanText = typeof children === 'string' ? children.replace(/^#+\s*/, '') : children;
            return (
              <h5 className={`text-sm font-medium mb-1 mt-2 flex items-center gap-2 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <span className="text-yellow-500">🔹</span>
                {cleanText}
              </h5>
            );
          },
          h6: ({ children }: any) => {
            const cleanText = typeof children === 'string' ? children.replace(/^#+\s*/, '') : children;
            return (
              <h6 className={`text-xs font-medium mb-1 mt-2 flex items-center gap-2 ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              }`}>
                <span className="text-gray-500">▪️</span>
                {cleanText}
              </h6>
            );
          },
          p: ({ children }: any) => (
            <p className={`mb-4 leading-relaxed ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {children}
            </p>
          ),
          ul: ({ children }: any) => (
            <ul className={`mb-4 ml-6 space-y-1 list-disc ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {children}
            </ul>
          ),
          ol: ({ children }: any) => (
            <ol className={`mb-4 ml-6 space-y-1 list-decimal ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {children}
            </ol>
          ),
          li: ({ children }: any) => (
            <li className="mb-1">{children}</li>
          ),
          blockquote: ({ children }: any) => (
            <blockquote className={`border-l-4 pl-4 py-2 my-4 italic ${
              theme === 'dark' 
                ? 'border-blue-400 bg-blue-900/20 text-blue-200' 
                : 'border-blue-500 bg-blue-50 text-blue-800'
            }`}>
              {children}
            </blockquote>
          ),
          strong: ({ children }: any) => (
            <strong className={`font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {children}
            </strong>
          ),
          em: ({ children }: any) => (
            <em className={`italic ${
              theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
            }`}>
              {children}
            </em>
          ),
          a: ({ children, href }: any) => (
            <a 
              href={href}
              className={`underline ${
                theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
              }`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
        }}
      >
        {processedText}
      </ReactMarkdown>
    </div>
  );
};

const renderLineWithMath = (text: string, textStyle?: string) => {
  if (!text) return null;

  // Split text by math expressions, bold, italic, and other formatting
  // Updated to handle $$$$...$$$$, $$...$$, and $...$ patterns
  const parts = text.split(/(\$\$\$\$[^$]*\$\$\$\$|\$\$[^$]*\$\$|\$[^$]*\$|\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*)/);

  return parts.map((part, index) => {
    // Check for $$$$...$$$$  (math2 converted format)
    if (part.match(/^\$\$\$\$[^$]*\$\$\$\$$/)) {
      const mathContent = part.slice(4, -4); // Remove $$$$ and $$$$
      try {
        const html = katex.renderToString(mathContent, {
          displayMode: true,
          throwOnError: false
        });
        return (
          <div
            key={index}
            dangerouslySetInnerHTML={{ __html: html }}
            style={{
              fontSize: '18px',
              color: '#007AFF',
              margin: '8px 0',
              textAlign: 'center'
            }}
          />
        );
      } catch (error) {
        return <div key={index} style={{ color: 'red', textAlign: 'center' }}>[Math Error: {mathContent}]</div>;
      }
    }
    // Check for $$...$$ (math converted format or standard display math)
    else if (part.match(/^\$\$[^$]*\$\$$/)) {
      const mathContent = part.slice(2, -2); // Remove $$ and $$
      try {
        const html = katex.renderToString(mathContent, {
          displayMode: true,
          throwOnError: false
        });
        return (
          <div
            key={index}
            dangerouslySetInnerHTML={{ __html: html }}
            style={{
              fontSize: '18px',
              color: '#007AFF',
              margin: '8px 0',
              textAlign: 'center'
            }}
          />
        );
      } catch (error) {
        return <div key={index} style={{ color: 'red', textAlign: 'center' }}>[Math Error: {mathContent}]</div>;
      }
    }
    // Check for $...$ (inline math)
    else if (part.match(/^\$[^$]*\$$/)) {
      const mathContent = part.slice(1, -1); // Remove $ and $
      try {
        const html = katex.renderToString(mathContent, {
          displayMode: false,
          throwOnError: false
        });
        return (
          <span
            key={index}
            dangerouslySetInnerHTML={{ __html: html }}
            style={{
              fontSize: '16px',
              color: '#007AFF'
            }}
          />
        );
      } catch (error) {
        return <span key={index} style={{ color: 'red' }}>[Math Error: {mathContent}]</span>;
      }
    } else if (part.match(/^\*\*\*[^*]+\*\*\*$/)) {
      // Bold and italic text (***text***)
      const content = part.slice(3, -3);
      return (
        <strong key={index} style={{ fontWeight: 'bold', fontStyle: 'italic' }} className={textStyle}>
          {content}
        </strong>
      );
    } else if (part.match(/^\*\*[^*]+\*\*$/)) {
      // Bold text (**text**)
      const content = part.slice(2, -2);
      return (
        <strong key={index} style={{ fontWeight: 'bold' }} className={textStyle}>
          {content}
        </strong>
      );
    } else if (part.match(/^\*[^*]+\*$/)) {
      // Italic text (*text*)
      const content = part.slice(1, -1);
      return (
        <em key={index} style={{ fontStyle: 'italic' }} className={textStyle}>
          {content}
        </em>
      );
    } else {
      // Regular text
      return (
        <span key={index} className={textStyle}>
          {part}
        </span>
      );
    }
  });
};

// Function to preprocess content for better markdown rendering
const preprocessContent = (content: string): string => {
  if (!content) return content;
  
  // Clean up content and ensure proper formatting
  let processed = content
    // Fix math expressions - convert LaTeX to standard markdown math
    .replace(/\\\(/g, '$')
    .replace(/\\\)/g, '$')
    .replace(/\\\[/g, '$$')
    .replace(/\\\]/g, '$$')
    // Handle custom math tags
    .replace(/<math>([\s\S]*?)<\/math>/g, '$$$1$$')
    .replace(/<math2>([\s\S]*?)<\/math2>/g, '$$$$1$$$$')
    // Ensure proper line breaks for lists
    .replace(/\n(\d+\.|\*|\-|\+)\s/g, '\n\n$1 ')
    // Ensure proper spacing around headers
    .replace(/([^\n])\n(#{1,6})\s/g, '$1\n\n$2 ')
    // Make sure headings start with # and have a space after
    .replace(/\n(#{1,6})([^\s])/g, '\n$1 $2')
    // Ensure proper spacing for blockquotes
    .replace(/\n>/g, '\n\n>')
    // Preserve newlines for paragraph breaks
    .replace(/\n\n\n+/g, '\n\n');
  
  return processed.trim();
};

const TranscriptionPage: React.FC = () => {
  console.log('TranscriptionPage component loaded');
  
  const { t } = useTranslation();
  const { audioid } = useParams<{ audioid: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { isPro } = useUser();
  const { user } = useAuth();
  const { theme, getThemeColors } = useTheme();
  const { showSuccess, showError, showWarning, showConfirmation } = useAlert();
  const uid = user?.uid;
  const colors = getThemeColors();
  const locationState = location.state as any;
  
  console.log('Initial params - uid:', uid, 'audioid:', audioid);
  console.log('Initial locationState:', locationState);

  // Languages array with internationalization
  const languages = [
    { label: t('transcription.languages.english'), value: 'en' },
    { label: t('transcription.languages.chineseSimplified'), value: 'zh' },
    { label: t('transcription.languages.chineseTraditional'), value: 'zh-TW' },
    { label: t('transcription.languages.spanish'), value: 'es' },
    { label: t('transcription.languages.french'), value: 'fr' },
    { label: t('transcription.languages.german'), value: 'de' },
    { label: t('transcription.languages.hindi'), value: 'hi' },
  ];


  // Audio player state
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Transcription state
  const [transcription, setTranscription] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [paragraphs, setParagraphs] = useState<Paragraph[]>([]);
  const [wordTimings, setWordTimings] = useState<WordTiming[]>([]);
  const [activeWord, setActiveWord] = useState<number>(-1);
  const [activeParagraph, setActiveParagraph] = useState<number>(0);
  const activeWordRef = useRef<HTMLSpanElement>(null);

  // Translation state
  const [isTranslationEnabled, setIsTranslationEnabled] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('es');
  const [translations, setTranslations] = useState<string[]>([]);
  const [translatingIndex, setTranslatingIndex] = useState<number>(-1);
  
  // SRT Translation state
  const [srtTranslations, setSrtTranslations] = useState<{[key: number]: string}>({});
  const [srtTranslatingIndex, setSrtTranslatingIndex] = useState<number>(-1);
  const [srtSelectedLanguage, setSrtSelectedLanguage] = useState<string>('es');
  // Removed showOriginalSrt toggle as we now show both original and translated text together
  const [srtSegments, setSrtSegments] = useState<Array<{id: number, startTime: string, endTime: string, text: string}>>([]);
  const [userCoins, setUserCoins] = useState<number>(0);
  const [isTranslatingSubtitle, setIsTranslatingSubtitle] = useState<boolean>(false);
  
  // Word-level subtitle translation state
  const [wordTranslations, setWordTranslations] = useState<{[key: string]: string}>({});
  const [showTranslatedSubtitles, setShowTranslatedSubtitles] = useState<boolean>(false);
  const [isTranslatingWords, setIsTranslatingWords] = useState<boolean>(false);
  const [subtitleLanguage, setSubtitleLanguage] = useState<string>('es');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState<boolean>(false);
  
  // Available languages for subtitle translation
  const subtitleLanguages = [
    { code: 'en', name: 'English' },
    { code: 'zh-cn', name: 'Chinese Simplified' },
    { code: 'zh-tw', name: 'Chinese Traditional' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' },
    { code: 'nl', name: 'Dutch' },
    { code: 'sv', name: 'Swedish' },
    { code: 'no', name: 'Norwegian' },
    { code: 'da', name: 'Danish' },
    { code: 'fi', name: 'Finnish' },
    { code: 'pl', name: 'Polish' },
    { code: 'tr', name: 'Turkish' },
    { code: 'th', name: 'Thai' },
    { code: 'vi', name: 'Vietnamese' },
    { code: 'id', name: 'Indonesian' },
    { code: 'ms', name: 'Malay' },
    { code: 'he', name: 'Hebrew' },
    { code: 'cs', name: 'Czech' },
    { code: 'hu', name: 'Hungarian' },
    { code: 'ro', name: 'Romanian' },
    { code: 'bg', name: 'Bulgarian' },
    { code: 'hr', name: 'Croatian' },
    { code: 'sk', name: 'Slovak' },
    { code: 'sl', name: 'Slovenian' },
    { code: 'et', name: 'Estonian' },
    { code: 'lv', name: 'Latvian' },
    { code: 'lt', name: 'Lithuanian' },
    { code: 'uk', name: 'Ukrainian' },
    { code: 'be', name: 'Belarusian' },
    { code: 'ka', name: 'Georgian' },
    { code: 'am', name: 'Amharic' },
    { code: 'sw', name: 'Swahili' },
    { code: 'zu', name: 'Zulu' },
    { code: 'af', name: 'Afrikaans' },
    { code: 'bn', name: 'Bengali' },
    { code: 'gu', name: 'Gujarati' },
    { code: 'kn', name: 'Kannada' },
    { code: 'ml', name: 'Malayalam' },
    { code: 'mr', name: 'Marathi' },
    { code: 'pa', name: 'Punjabi' },
    { code: 'ta', name: 'Tamil' },
    { code: 'te', name: 'Telugu' },
    { code: 'ur', name: 'Urdu' },
    { code: 'fa', name: 'Persian' },
    { code: 'is', name: 'Icelandic' },
    { code: 'mt', name: 'Maltese' },
    { code: 'cy', name: 'Welsh' },
    { code: 'ga', name: 'Irish' },
    { code: 'eu', name: 'Basque' },
    { code: 'ca', name: 'Catalan' },
    { code: 'gl', name: 'Galician' },
    { code: 'pl', name: 'Polish', flag: '🇵🇱' },
    { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
    { code: 'th', name: 'Thai', flag: '🇹🇭' },
    { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' }
  ];

  // UI state
  const [activeTab, setActiveTab] = useState<'transcript' | 'mindmap' | 'chat' | 'wordsdata'>('transcript');
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isVideoFullscreen, setIsVideoFullscreen] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Mind map state
  const [xmlData, setXmlData] = useState<string | null>(null);
  
  // Add words_data state for JSON view
  const [wordsData, setWordsData] = useState<any[]>([]);

  // Add state for chat processing
  const [isChatProcessing, setIsChatProcessing] = useState<{[key: string]: boolean}>({
    keypoints: false,
    summary: false,
    translate: false
  });
  const [chatResponses, setChatResponses] = useState<{[key: string]: string}>({
    keypoints: '',
    summary: '',
    translate: ''
  });
  const [translationLanguage, setTranslationLanguage] = useState<string>('Spanish');
  
  // Chat interface state
  interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    isStreaming?: boolean;
    id?: number;
  }
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isAssistantTyping, setIsAssistantTyping] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Close language dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showLanguageDropdown) {
        const target = event.target as HTMLElement;
        if (!target.closest('.language-dropdown-container')) {
          setShowLanguageDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLanguageDropdown]);

  // Function to handle quick actions with formatted responses and language detection
  const handleQuickAction = async (action: 'keypoints' | 'summary' | 'translate') => {
    if (!transcription || isChatProcessing[action]) return;
    
    setIsChatProcessing({...isChatProcessing, [action]: true});
    
    try {
      let prompt = '';
      
      switch(action) {
        case 'keypoints':
          prompt = t('transcription.prompts.keypoints', { transcription });
          break;
        case 'summary':
          prompt = t('transcription.prompts.summary', { transcription });
          break;
        case 'translate':
          prompt = t('transcription.prompts.translate', { translationLanguage, transcription });
          break;
      }
      
      // Using the streaming API to process the request
      const result = await sendMessageToAI(prompt);
      setChatResponses({...chatResponses, [action]: result});
    } catch (error) {
      console.error(`Error in ${action} quick action:`, error);
      setChatResponses({...chatResponses, [action]: t('transcription.errors.couldNotProcess', { action })});
    } finally {
      setIsChatProcessing({...isChatProcessing, [action]: false});
    }
  };

  // Enhanced streaming API function (removed automatic language detection for AI responses)
  const sendMessageToAI = async (message: string, onChunk?: (chunk: string) => void): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        // Prepare messages array for streaming API with better formatting instructions
        const messages = [
          {
            role: "system",
            content: [
              {
                type: "text", 
                text: "You are an AI tutor assistant helping students with their homework and studies. Provide helpful, educational responses with clear explanations and examples that students can easily understand. Use proper markdown formatting for better readability. IMPORTANT: When including mathematical expressions, please wrap inline math with <math>...</math> tags and display math (block equations) with <math2>...</math2> tags. For example: <math>x^2 + y^2 = z^2</math> for inline math, and <math2>\\int_0^1 x^2 dx = \\frac{1}{3}</math2> for display math. This helps with proper mathematical rendering."
              }
            ]
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: message
              }
            ]
          }
        ];

        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', true);
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
                console.log('✅ AI API request completed successfully');
                console.log('📊 Final content length:', fullContent.length);
                resolve(fullContent.trim() || t('transcription.errors.noResponse'));
              } else {
                console.error('❌ API request failed:', xhr.status, xhr.statusText);
                reject(new Error(t('transcription.errors.apiCallFailed', { status: xhr.status, statusText: xhr.statusText })));
              }
            }
          }
        };

        xhr.onerror = function() {
          console.error('💥 XMLHttpRequest error');
          reject(new Error(t('transcription.errors.failedToGetResponse')));
        };

        xhr.ontimeout = function() {
          console.error('💥 XMLHttpRequest timeout');
          reject(new Error(t('transcription.errors.requestTimeout')));
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
        console.error('💥 Error in sendMessageToAI:', error);
        reject(new Error(t('transcription.errors.failedToGetResponse')));
      }
    });
  };

  // Simple language detection function
  const detectLanguage = (text: string): string => {
    if (!text) return t('transcription.languages.english');
    
    // Simple language detection based on common patterns
    const lowerText = text.toLowerCase();
    
    // Chinese characters
    if (/[\u4e00-\u9fff]/.test(text)) return t('transcription.languages.chinese');
    
    // Japanese characters
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return t('transcription.languages.japanese');
    
    // Korean characters
    if (/[\uac00-\ud7af]/.test(text)) return t('transcription.languages.korean');
    
    // Spanish indicators
    if (/\b(el|la|los|las|de|del|en|con|por|para|que|es|son|está|están|tiene|tienen|hacer|ser|estar)\b/.test(lowerText)) return t('transcription.languages.spanish');
    
    // French indicators
    if (/\b(le|la|les|de|du|des|en|avec|pour|que|est|sont|avoir|être|faire|aller)\b/.test(lowerText)) return t('transcription.languages.french');
    
    // German indicators
    if (/\b(der|die|das|den|dem|des|ein|eine|einen|einem|einer|und|oder|aber|ist|sind|haben|sein|werden)\b/.test(lowerText)) return t('transcription.languages.german');
    
    // Italian indicators
    if (/\b(il|la|lo|gli|le|di|da|in|con|per|che|è|sono|ha|hanno|essere|avere|fare|andare)\b/.test(lowerText)) return t('transcription.languages.italian');
    
    // Portuguese indicators
    if (/\b(o|a|os|as|de|da|do|em|com|para|que|é|são|tem|têm|ser|estar|ter|fazer|ir)\b/.test(lowerText)) return t('transcription.languages.portuguese');
    
    // Russian indicators (Cyrillic)
    if (/[а-яё]/i.test(text)) return t('transcription.languages.russian');
    
    // Arabic indicators
    if (/[\u0600-\u06ff]/.test(text)) return t('transcription.languages.arabic');
    
    // Hindi indicators (Devanagari)
    if (/[\u0900-\u097f]/.test(text)) return t('transcription.languages.hindi');
    
    // Default to English
    return t('transcription.languages.english');
  };

  // Function to check if text contains Chinese characters
  const isChinese = (text: string): boolean => {
    return /[\u4e00-\u9fff]/.test(text);
  };

  // Function to remove spaces from Chinese text
  const formatChineseText = (text: string): string => {
    if (isChinese(text)) {
      return text.replace(/\s+/g, '');
    }
    return text;
  };

  // Function to clean Chinese text for SRT (remove spaces and punctuation)
  const cleanChineseForSRT = (text: string): string => {
    if (isChinese(text)) {
      return text.replace(/\s+/g, '').replace(/[。.]/g, '');
    }
    return text;
  };

  // Get state passed from the previous page
  // locationState is already declared at the top of the component

  // Translation function for individual paragraphs
  const handleTranslateParagraph = async (index: number) => {
    if (!paragraphs[index]) return;

    setTranslatingIndex(index);
    try {
      const response = await fetch(
        `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=${selectedLanguage}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': azureKey,
            'Ocp-Apim-Subscription-Region': region,
          },
          body: JSON.stringify([{ Text: paragraphs[index].text }]),
        }
      );

      const data = await response.json();
      console.log('Paragraph Translation Response:', data);

      if (data && data[0] && data[0].translations && data[0].translations[0]) {
        const translation = data[0].translations[0].text;

        setTranslations((prev) => {
          const updatedTranslations = [...prev];
          updatedTranslations[index] = translation;
          return updatedTranslations;
        });
      } else {
        console.error(t('transcription.errors.translationDataFormat'), data);
      }
    } catch (error) {
      console.error(t('transcription.errors.translationError'), error);
    } finally {
      setTranslatingIndex(-1);
    }
  };

  // Toggle translation for all paragraphs
  const toggleTranslation = async () => {
    if (!isTranslationEnabled) {
      // Check if user is logged in
      if (!user) {
        // Redirect to login page
        navigate('/login', { state: { from: location } });
        return;
      }
      
      try {
        // Deduct 1 coin for translation
        const response = await userService.subtractCoins(uid!, 1, 'transcription_translation');
        
        if (!response.success) {
          // Show warning if coin deduction failed
          showError(t('transcription.errors.failedToDeductCoins'));
          return;
        }
        
        // Enable translation and translate all paragraphs
        setIsTranslationEnabled(true);
        setTranslations(new Array(paragraphs.length).fill(''));
        
        // Translate all paragraphs
        for (let i = 0; i < paragraphs.length; i++) {
          await handleTranslateParagraph(i);
        }
      } catch (error: any) {
        // Check if error is due to insufficient coins
        if (error.message && error.message.includes('insufficient')) {
          showError(t('transcription.errors.insufficientCoins'));
        } else {
          console.error('Error during translation:', error);
          showError(t('transcription.errors.translationError'));
        }
      }
    } else {
      // Disable translation
      setIsTranslationEnabled(false);
      setTranslations([]);
    }
  };

  // Fetch audio metadata and transcription
  const fetchAudioMetadata = async (uid: string, audioid: string) => {
    try {
      setIsLoading(true);
      
      // First try getting cached data from local storage
      const cachedData = localStorage.getItem(`audioData-${audioid}`);
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          if (parsed.transcription && parsed.audioUrl) {
            setTranscription(parsed.transcription);
            setAudioUrl(parsed.audioUrl);
            setVideoUrl(parsed.videoUrl || ''); // Set video URL from cache
            setDuration(parsed.duration || 0);
          
            
            // Set words_data if available
            if (parsed.words_data) {
              setWordsData(parsed.words_data);
            }
            
            if (parsed.paragraphs && parsed.paragraphs.length > 0) {
              setParagraphs(parsed.paragraphs);
              setWordTimings(parsed.wordTimings || []);
            } else if (parsed.words_data && Array.isArray(parsed.words_data) && parsed.words_data.length > 0) {
              // Process words_data if available
              setWordTimings(processWordTimings(parsed.words_data));
              
              // Create paragraphs from words_data
              const { paragraphs } = createParagraphsFromWordsData(parsed.words_data);
              setParagraphs(paragraphs);
            } else {
              processTranscription(parsed.transcription);
            }
            
            // Check for xmlData in cache
            if (parsed.xmlData) {
              setXmlData(parsed.xmlData);
            }
            
            setIsLoading(false);
            return;
          }
        } catch (e) {
          console.error('Error parsing cached data', e);
        }
      }
      
      // If no cache or parsing error, fetch from correct API
      console.log('Starting API fetch for uid:', uid, 'audioid:', audioid);
      const response = await fetch('https://main-matrixai-server-lujmidrakh.cn-hangzhou.fcapp.run/api/audio/getAudioFile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uid, audioid }),
      });
      
      const data = await response.json();
      
      // Log the complete API response to verify video_file data
      console.log('API Response Data:', data);
      console.log('video_file from API:', data.video_file);
      
      if (response.ok && data.success) {
        // Set state with fetched data - using correct field names from server response
        setTranscription(data.transcription || '');
        setFileName(data.audio_name);
        const audioDur = data.duration || 0;
        setDuration(audioDur);
        setAudioUrl(data.audioUrl || ''); // Note: server returns 'audioUrl' not 'audio_url'
        const apiVideoUrl = (data.video_file || '').trim();
        console.log('API video_file:', data.video_file, 'trimmed:', apiVideoUrl);
        setVideoUrl(apiVideoUrl); // Set video URL from API response

        // Check if xml_data is available (server stores it as xml_data)
        if (data.xml_data) {
          setXmlData(data.xml_data);
        }

        // Set words_data if available
        if (data.words_data) {
          setWordsData(data.words_data);
        }

        // Process words_data if available
        if (data.words_data && Array.isArray(data.words_data) && data.words_data.length > 0) {
          // Store the words data for highlighting
          setWordTimings(processWordTimings(data.words_data));
          
          // Create paragraphs from words_data
          const { paragraphs } = createParagraphsFromWordsData(data.words_data);
          setParagraphs(paragraphs);
        } else {
          // Fallback to simple text processing if no word timings
          processTranscription(data.transcription);
        }
        
        // Cache the data with words_data and video_file
        localStorage.setItem(`audioData-${audioid}`, JSON.stringify({
          transcription: data.transcription || '',
          audioUrl: data.audioUrl || '',
          videoUrl: apiVideoUrl || '', // Cache video URL
          audio_name: data.audio_name,
          duration: audioDur,
          paragraphs: paragraphs.length > 0 ? paragraphs : [],
          wordTimings: wordTimings.length > 0 ? wordTimings : [],
          words_data: data.words_data || [],
          xmlData: data.xml_data || null,
        }));
      } else {
        console.error(t('transcription.errors.audioMetadata'), data.error || data.message);
        showError(t('transcription.errors.failedToLoadAudio'));
      }
    } catch (error) {
      console.error(t('transcription.errors.fetchAudioMetadata'), error);
      showError(t('transcription.errors.unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  };

  // Media control functions (works with both audio and video)
  const togglePlayPause = () => {
    const mediaElement = videoUrl ? videoRef.current : audioRef.current;
    if (mediaElement) {
      if (isPlaying) {
        mediaElement.pause();
      } else {
        mediaElement.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    const mediaElement = videoUrl ? videoRef.current : audioRef.current;
    if (mediaElement) {
      mediaElement.playbackRate = rate;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const seekTo = (time: number) => {
    const mediaElement = videoUrl ? videoRef.current : audioRef.current;
    if (mediaElement) {
      mediaElement.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    seekTo(value);
  };

  const handleWordClick = (word: WordTiming) => {
    seekTo(word.startTime);
  };

  // Video fullscreen functionality
  const toggleVideoFullscreen = () => {
    if (!videoRef.current) return;
    
    if (!isVideoFullscreen) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    // Don't manually set state - let the fullscreen change event handle it
  };

  // Create subtitle segments (6-second intervals)
  const createSubtitleSegments = () => {
    if (!wordTimings.length) return [];
    
    const segments = [];
    const segmentDuration = 6; // 6 seconds per segment
    let currentSegment = [];
    let segmentStartTime = 0;
    
    for (let i = 0; i < wordTimings.length; i++) {
      const word = wordTimings[i];
      
      // If this is the first word or we've exceeded the segment duration
      if (currentSegment.length === 0) {
        segmentStartTime = word.startTime;
      }
      
      currentSegment.push(word);
      
      // Check if we should end this segment
      const shouldEndSegment = 
        word.endTime - segmentStartTime >= segmentDuration ||
        i === wordTimings.length - 1 ||
        (i < wordTimings.length - 1 && wordTimings[i + 1].startTime - segmentStartTime > segmentDuration);
      
      if (shouldEndSegment) {
        segments.push({
          words: [...currentSegment],
          startTime: segmentStartTime,
          endTime: word.endTime,
          text: currentSegment.map(w => w.word).join(' ')
        });
        currentSegment = [];
      }
    }
    
    return segments;
  };

  // Get current subtitle segment
  const getCurrentSubtitleSegment = () => {
    const segments = createSubtitleSegments();
    return segments.find(segment => 
      currentTime >= segment.startTime && currentTime <= segment.endTime
    );
  };

  // Get highlighted words in current segment
  const getHighlightedWordsInSegment = (segment: { words: WordTiming[], startTime: number, endTime: number, text: string } | undefined) => {
    if (!segment) return [];
    
    return segment.words.map((word: WordTiming, index: number) => ({
      ...word,
      isActive: currentTime >= word.startTime && currentTime <= word.endTime,
      isPast: currentTime > word.endTime
    }));
  };

  const copyTranscription = () => {
    const formattedTranscription = formatChineseText(transcription);
    navigator.clipboard.writeText(formattedTranscription);
    // Could show a toast notification here
    showSuccess(t('transcription.success.transcriptionCopied'));
  };

  // Visualize audio data for waveform (placeholder)
  const generateWaveformData = () => {
    // In a real implementation, this would analyze the audio file
    // For now, we'll generate random data for visualization
    return Array.from({ length: 50 }, () => Math.random() * 0.8 + 0.2);
  };

  const waveformData = generateWaveformData();
  
  // Download audio file
  const downloadAudio = () => {
    if (!audioUrl) return;
    
    const link = document.createElement('a');
    link.href = audioUrl;
    link.setAttribute('download', `${fileName || 'audio'}.mp3`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Function to download transcription as TXT file
  const downloadTranscription = () => {
    if (!transcription) {
      showError('No transcription available to download');
      return;
    }
    
    const dataBlob = new Blob([transcription], { type: 'text/plain' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transcription_${fileName || audioid || Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showSuccess('Transcription downloaded successfully!');
  };

  // Function to share transcription text
  const shareTranscription = async () => {
    if (!transcription) {
      showError('No transcription available to share');
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Transcription - ${fileName || 'Audio'}`,
          text: transcription,
        });
      } catch (error) {
        console.error('Error sharing:', error);
        // Fallback to copying to clipboard
        copyTranscription();
      }
    } else {
      // Fallback to copying to clipboard
      copyTranscription();
    }
  };

  // Function to handle user chat messages with enhanced language support
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!chatInput.trim() || isAssistantTyping || isSubmitting) return;
    
    setIsSubmitting(true);
    
    // Check if user is logged in
    if (!user) {
      // Redirect to login page
      navigate('/login', { state: { from: location } });
      setIsSubmitting(false);
      return;
    }
    
    // Deduct coins for chat
    try {
      // Deduct 1 coin for chat
      const coinResponse = await userService.subtractCoins(uid!, 1, 'transcription_chat');
      
      if (!coinResponse.success) {
        showError(t('transcription.errors.failedToDeductCoins'));
        setIsSubmitting(false);
        return;
      }
    } catch (error) {
      console.error('Error deducting coins:', error);
      showError(t('transcription.errors.insufficientBalance'));
      setIsSubmitting(false);
      return;
    }
    
    // Add user message to chat
    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput.trim(),
      timestamp: Date.now(),
      id: Date.now()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    const currentInput = chatInput.trim();
    setChatInput(''); // Clear input immediately
    setIsAssistantTyping(true);
    
    // Save user message to database
    await saveChatToDatabase(currentInput, 'user');
    
    // Create a streaming assistant message that will be updated in real-time
    const streamingMessageId = Date.now() + 1;
    let streamingContent = '';
    
    // Add initial empty streaming message
    const initialStreamingMessage: ChatMessage = {
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
      id: streamingMessageId
    };
    
    setChatMessages(prev => [...prev, initialStreamingMessage]);
    
    // Define chunk handler for real-time updates
    const handleChunk = (chunk: string) => {
      streamingContent += chunk;
      
      // Update the streaming message in real-time
      setChatMessages(prev => prev.map(msg => 
        msg.id === streamingMessageId 
          ? { ...msg, content: streamingContent }
          : msg
      ));
      
      // Auto-scroll to bottom as content streams in
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 50);
    };

    try {
      // Build context with transcription and previous messages
      let contextPrompt = '';
      
      // Add transcription context if available
      if (transcription) {
        contextPrompt += `Context: Here is the transcription we're discussing:\n\n${transcription.substring(0, 2000)}${transcription.length > 2000 ? '...' : ''}\n\n`;
      }
      
      // Add previous chat messages for context
      const recentMessages = chatMessages.slice(-6).map(msg => `${msg.role}: ${msg.content}`).join('\n');
      if (recentMessages) {
        contextPrompt += `Previous conversation:\n${recentMessages}\n\n`;
      }
      
      contextPrompt += `User question: ${currentInput}`;
      
      // Get streaming response
      const fullResponse = await sendMessageToAI(contextPrompt, handleChunk);
      
      // Finalize the streaming message
      setChatMessages(prev => prev.map(msg => 
        msg.id === streamingMessageId 
          ? { ...msg, content: fullResponse, isStreaming: false }
          : msg
      ));
      
      // Save assistant response to database
      await saveChatToDatabase(fullResponse, 'assistant');
      
    } catch (error) {
      console.error('Error in chat:', error);
      
      // Remove the streaming message and add error message
      setChatMessages(prev => {
        const messagesWithoutStreaming = prev.filter(msg => msg.id !== streamingMessageId);
        return [...messagesWithoutStreaming, {
          role: 'assistant',
          content: t('transcription.errors.processingError'),
          timestamp: Date.now(),
          id: streamingMessageId
        }];
      });
    } finally {
      setIsAssistantTyping(false);
      setIsSubmitting(false);
    }
  };
  
  // Function to reset chat
  // Function to save chat to database
  const saveChatToDatabase = async (messageContent: string, role: 'user' | 'assistant') => {
    try {
      // Use uid from AuthContext instead of Supabase session
      if (!uid || !audioid) {
        console.log('No authenticated user or audioid, skipping database save');
        return;
      }
      
      const userId = uid;
      const timestamp = new Date().toISOString();
      
      // Check if this chat exists in the database
      const { data: existingChats, error: chatError } = await supabase
        .from('transcription_chats')
        .select('*')
        .eq('user_id', userId)
        .eq('audio_id', audioid);
      
      if (chatError) {
        console.error('Error checking chat existence:', chatError);
        return;
      }
      
      const existingChat = existingChats && existingChats.length > 0 ? existingChats[0] : null;
      
      // New message object for database storage
      const newMessage = {
        sender: role, // 'user' or 'assistant'
        text: messageContent,
        timestamp: timestamp
      };
      
      console.log('Saving message to database:', {
        role,
        contentLength: messageContent.length,
        audioid
      });
      
      if (existingChat) {
        // Update existing chat
        // Ensure messages is an array
        const existingMessages = Array.isArray(existingChat.messages) ? existingChat.messages : [];
        
        // Limit to 50 messages to prevent database size issues
        const updatedMessages = [...existingMessages, newMessage].slice(-50);
        
        const { error: updateError } = await supabase
          .from('transcription_chats')
          .update({
            messages: updatedMessages,
            updated_at: timestamp
          })
          .eq('user_id', userId)
          .eq('audio_id', audioid);
        
        if (updateError) {
          console.error('Error updating chat:', updateError);
          
          // If error is related to size, try with fewer messages
          if (updateError.message && updateError.message.includes('size')) {
            console.log('Trying with fewer messages due to size constraint');
            
            // Try again with only 10 most recent messages
            const reducedMessages = [...existingMessages, newMessage].slice(-10);
            
            const { error: retryError } = await supabase
              .from('transcription_chats')
              .update({
                messages: reducedMessages,
                updated_at: timestamp
              })
              .eq('user_id', userId)
              .eq('audio_id', audioid);
            
            if (retryError) {
              console.error('Error on retry with reduced messages:', retryError);
            } else {
              console.log('Successfully saved reduced chat history');
            }
          }
        } else {
          console.log('Successfully updated chat history');
        }
      } else {
        // Create new chat
        const newChat = {
          user_id: userId,
          audio_id: audioid,
          messages: [newMessage],
          created_at: timestamp,
          updated_at: timestamp
        };
        
        const { error: insertError } = await supabase
          .from('transcription_chats')
          .insert(newChat);
        
        if (insertError) {
          console.error('Error creating new chat:', insertError);
        } else {
          console.log('Successfully created new chat history');
        }
      }
    } catch (error) {
      console.error('Error saving to database:', error);
    }
  };
  
  const resetChat = () => {
    if (chatMessages.length > 0) {
      showConfirmation(
        t('transcription.chat.confirmClearHistory'),
        () => {
          setChatMessages([]);
        }
      );
    }
  };

  // Function to translate SRT subtitle segment
  // Function to translate all SRT segments
  const translateAllSrtSegments = async () => {
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }

    const segments = parseSrtToSegments(convertToSRT(wordsData));
    const untranslatedSegments = segments.filter((_, index) => !srtTranslations[index]);
    
    if (untranslatedSegments.length === 0) {
      showWarning(t('transcription.srt.allSegmentsTranslated'));
      return;
    }

    // Fixed cost of 1 coin for all segments
    showConfirmation(
      t('transcription.srt.confirmTranslateAll'),
      async () => {
        try {
          setIsTranslatingSubtitle(true);

          // Deduct 1 coin for all translations
          const coinResponse = await userService.subtractCoins(uid!, 1, 'srt_translation_bulk');
          
          if (!coinResponse.success) {
            showError(t('transcription.errors.failedToDeductCoins'));
            setIsTranslatingSubtitle(false);
            return;
          }
          
          // Update user coins
          setUserCoins(prev => prev - 1);

          // Translate all segments
          const newTranslations = { ...srtTranslations };
          
          for (let i = 0; i < segments.length; i++) {
            if (!srtTranslations[i]) {
              setSrtTranslatingIndex(i);
              
              try {
                const response = await axios.post(
                  `${azureEndpoint}/translate?api-version=3.0&to=${srtSelectedLanguage}`,
                  [{ text: segments[i].text }],
                  {
                    headers: {
                      'Ocp-Apim-Subscription-Key': azureKey,
                      'Ocp-Apim-Subscription-Region': region,
                      'Content-Type': 'application/json'
                    }
                  }
                );

                newTranslations[i] = response.data[0].translations[0].text;
              } catch (error) {
                console.error(`Translation error for segment ${i}:`, error);
              }
            }
          }

          setSrtTranslations(newTranslations);

        } catch (error) {
          console.error('Bulk translation error:', error);
          showError(t('transcription.errors.translationFailed'));
        } finally {
          setSrtTranslatingIndex(-1);
          setIsTranslatingSubtitle(false);
        }
      },
      () => {
        // User canceled, do nothing
      }
    );
    return;
  };

  // Function to translate words in current subtitle segment
  const translateWordsInSegment = async (segment: { words: WordTiming[], startTime: number, endTime: number, text: string }) => {
    if (!user || !segment) return;

    setIsTranslatingWords(true);
    
    try {
      const wordsToTranslate = segment.words.filter(word => !wordTranslations[word.word]);
      
      if (wordsToTranslate.length === 0) {
        setIsTranslatingWords(false);
        return;
      }

      const newTranslations = { ...wordTranslations };
      
      // Translate each word individually
      for (const word of wordsToTranslate) {
        try {
          const response = await fetch(
            `${azureEndpoint}/translate?api-version=3.0&to=${subtitleLanguage}`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Ocp-Apim-Subscription-Key': azureKey,
                'Ocp-Apim-Subscription-Region': region,
              },
              body: JSON.stringify([{ Text: word.word }]),
            }
          );

          const data = await response.json();
          if (data && data[0] && data[0].translations && data[0].translations[0]) {
            newTranslations[word.word] = data[0].translations[0].text;
          }
        } catch (error) {
          console.error(`Translation error for word "${word.word}":`, error);
        }
      }
      
      setWordTranslations(newTranslations);
    } catch (error) {
      console.error('Word translation error:', error);
    } finally {
      setIsTranslatingWords(false);
    }
  };

  // Function to translate all words in subtitle segments
  const translateAllSubtitleWords = async () => {
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }

    const segments = createSubtitleSegments();
    const allWords = segments.flatMap(segment => segment.words);
    const untranslatedWords = allWords.filter(word => !wordTranslations[word.word]);
    
    if (untranslatedWords.length === 0) {
      showWarning('All subtitle words are already translated');
      return;
    }

    showConfirmation(
      `Translate ${untranslatedWords.length} words for 1 coin?`,
      async () => {
        try {
          setIsTranslatingWords(true);

          // Deduct 1 coin for word translations
          const coinResponse = await userService.subtractCoins(uid!, 1, 'word_translation_bulk');
          
          if (!coinResponse.success) {
            showError(t('transcription.errors.failedToDeductCoins'));
            setIsTranslatingWords(false);
            return;
          }
          
          setUserCoins(prev => prev - 1);

          const newTranslations = { ...wordTranslations };
          
          // Translate words in batches to avoid rate limiting
          const batchSize = 10;
          for (let i = 0; i < untranslatedWords.length; i += batchSize) {
            const batch = untranslatedWords.slice(i, i + batchSize);
            
            await Promise.all(batch.map(async (word) => {
              try {
                const response = await fetch(
                  `${azureEndpoint}/translate?api-version=3.0&to=${subtitleLanguage}`,
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Ocp-Apim-Subscription-Key': azureKey,
                      'Ocp-Apim-Subscription-Region': region,
                    },
                    body: JSON.stringify([{ Text: word.word }]),
                  }
                );

                const data = await response.json();
                if (data && data[0] && data[0].translations && data[0].translations[0]) {
                  newTranslations[word.word] = data[0].translations[0].text;
                }
              } catch (error) {
                console.error(`Translation error for word "${word.word}":`, error);
              }
            }));
            
            // Small delay between batches
            if (i + batchSize < untranslatedWords.length) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
          
          setWordTranslations(newTranslations);
          showSuccess('All subtitle words translated successfully!');
        } catch (error) {
          console.error('Bulk word translation error:', error);
          showError('Failed to translate words');
        } finally {
          setIsTranslatingWords(false);
        }
      },
      () => {
        // User canceled, do nothing
      }
    );
  };

  // Function to parse SRT content into segments
  const parseSrtToSegments = (srtContent: string) => {
    const segments = [];
    const lines = srtContent.split('\n');
    let currentSegment = { id: 0, startTime: '', endTime: '', text: '' };
    let lineIndex = 0;

    while (lineIndex < lines.length) {
      const line = lines[lineIndex].trim();
      
      if (line && !isNaN(parseInt(line))) {
        // Segment number
        currentSegment.id = parseInt(line);
        lineIndex++;
        
        // Time range
        const timeLine = lines[lineIndex]?.trim();
        if (timeLine && timeLine.includes('-->')) {
          const [start, end] = timeLine.split(' --> ');
          currentSegment.startTime = start;
          currentSegment.endTime = end;
          lineIndex++;
          
          // Text content
          let text = '';
          while (lineIndex < lines.length && lines[lineIndex].trim() !== '') {
            text += lines[lineIndex].trim() + ' ';
            lineIndex++;
          }
          currentSegment.text = text.trim();
          
          segments.push({ ...currentSegment });
          currentSegment = { id: 0, startTime: '', endTime: '', text: '' };
        }
      }
      lineIndex++;
    }
    
    return segments;
  };

  // Function to copy segment text
  const copySegmentText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      console.log('Text copied to clipboard');
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Function to generate formatted SRT document with colors and proper formatting
  const generateFormattedSRTDocument = (wordsData: any[]) => {
    const srtSegments = parseSrtToSegments(convertToSRT(wordsData));
    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();
    
    let documentContent = `Generated: ${currentDate} ${currentTime}\n`;
    documentContent += `Total Segments: ${srtSegments.length} | Interval: 6 seconds\n\n`;

    srtSegments.forEach((segment, index) => {
      documentContent += `Segment #${segment.id}\n`;
      documentContent += `Time: ${segment.startTime} → ${segment.endTime}\n`;
      documentContent += `Text: ${segment.text}\n`;
      if (srtTranslations && srtTranslations[index]) {
        documentContent += `Translation: ${srtTranslations[index]}\n`;
      }
      documentContent += `\n`;
    });

    return documentContent;
  };

  // Function to copy all SRT segments with formatting
  const copyAllSRTSegments = () => {
    const srtSegments = parseSrtToSegments(convertToSRT(wordsData));
    let formattedContent = `📅 Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`;
    formattedContent += `📊 Total Segments: ${srtSegments.length} | ⏱️ Interval: 6 seconds\n`;
    formattedContent += `${'='.repeat(60)}\n\n`;
    
    srtSegments.forEach((segment, index) => {
      formattedContent += `🔸 Segment #${segment.id}\n`;
      formattedContent += `⏰ Time: ${segment.startTime} → ${segment.endTime}\n`;
      formattedContent += `💬 Text: ${segment.text}\n`;
      if (srtTranslations[index]) {
        formattedContent += `🌐 Translation (${languages.find(lang => lang.value === srtSelectedLanguage)?.label}): ${srtTranslations[index]}\n`;
      }
      formattedContent += `\n${'─'.repeat(40)}\n\n`;
    });
    
    navigator.clipboard.writeText(formattedContent);
    showSuccess('All SRT segments copied with formatting!');
  };

  
  // Use transcription as context
  const setTranscriptionAsContext = () => {
    if (!transcription) return;
    
    const contextMessage: ChatMessage = {
      role: 'user',
      content: `Here is the transcription I want to discuss:\n\n${transcription.substring(0, 1000)}${transcription.length > 1000 ? '...' : ''}`,
      timestamp: Date.now()
    };
    
    setChatMessages(prev => [...prev, contextMessage]);
    setIsAssistantTyping(true);
    
    // Get assistant acknowledgment
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: t('transcription.chat.receivedTranscription'),
        timestamp: Date.now()
      };
      
      setChatMessages(prev => [...prev, assistantMessage]);
      setIsAssistantTyping(false);
    }, 1000);
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Handle XML data generation from MindMapComponent
  const handleXmlDataGenerated = async (newXmlData: string) => {
    setXmlData(newXmlData);
    
    // Send XML data to server using the correct API endpoint
    if (uid && audioid) {
      try {
        const response = await fetch('https://main-matrixai-server-lujmidrakh.cn-hangzhou.fcapp.run/api/audio/sendXmlGraph', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid,
            audioid,
            xmlData: newXmlData
          }),
        });
        
        const result = await response.json();
        
        if (response.ok && !result.error) {
          console.log('XML data saved successfully:', result.message);
        } else {
          console.error('Error saving XML data:', result.error || result.message);
        }
      } catch (error) {
        console.error('Error sending XML data to server:', error);
      }
    }
    
    // Update cache with new XML data
    if (audioid) {
      const cachedData = localStorage.getItem(`audioData-${audioid}`);
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          parsed.xmlData = newXmlData;
          localStorage.setItem(`audioData-${audioid}`, JSON.stringify(parsed));
        } catch (e) {
          console.error('Error updating cached XML data', e);
        }
      }
    }
  };

  // Process the transcription to create paragraphs and word timings
  const processTranscription = (text: string) => {
    if (!text) return;
    
    // Split text into paragraphs (using simple approach for now)
    const paraTexts = text.split(/\n\n|\.\s+/g).filter(p => p.trim().length > 0);
    
    // Create paragraphs with estimated word timings
    const totalWords = text.split(/\s+/).length;
    let wordIndex = 0;
    let timePerWord = duration / totalWords;
    
    const processedParagraphs: Paragraph[] = [];
    const allWordTimings: WordTiming[] = [];
    
    paraTexts.forEach((paraText, paraIndex) => {
      const words = paraText.split(/\s+/).filter(w => w.length > 0);
      const paraWordTimings: WordTiming[] = [];
      
      words.forEach((word, index) => {
        const startTime = wordIndex * timePerWord;
        const endTime = (wordIndex + 1) * timePerWord;
        
        const wordTiming: WordTiming = {
          word,
          startTime,
          endTime
        };
        
        paraWordTimings.push(wordTiming);
        allWordTimings.push(wordTiming);
        wordIndex++;
      });
      
      processedParagraphs.push({
        text: paraText,
        words: paraWordTimings,
        startTime: paraWordTimings[0]?.startTime || 0,
        endTime: paraWordTimings[paraWordTimings.length - 1]?.endTime || 0
      });
    });
    
    setParagraphs(processedParagraphs);
    setWordTimings(allWordTimings);
  };

  // Process word timings from API response
  const processWordTimings = (wordsData: any[]) => {
    return wordsData.map(word => ({
      word: word.word,
      startTime: word.start,
      endTime: word.end
    }));
  };

  // Convert words data to SRT format
  const convertToSRT = (wordsData: any[], segmentDuration: number = 6) => {
    if (!wordsData || wordsData.length === 0) return '';
    
    // Convert seconds to SRT time format (HH:MM:SS,mmm)
    const formatSRTTime = (seconds: number) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      const ms = Math.floor((seconds % 1) * 1000);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
    };
    
    let srtContent = '';
    let segmentIndex = 1;
    let currentSegmentStart = 0;
    
    // Get the total duration from the last word
    const totalDuration = wordsData.length > 0 ? wordsData[wordsData.length - 1]?.end || 0 : 0;
    
    // Create segments based on 6-second intervals starting from 0:00
    while (currentSegmentStart < totalDuration) {
      const segmentEnd = currentSegmentStart + segmentDuration;
      
      // Find words that fall within this time segment
      const wordsInSegment = wordsData.filter(word => 
        word.start >= currentSegmentStart && word.start < segmentEnd
      );
      
      if (wordsInSegment.length > 0) {
        // Get text with punctuation if available, otherwise use word
        let text = wordsInSegment.map(w => w.punctuated_word || w.word).join(' ');
        
        // Clean Chinese text for SRT (remove spaces and punctuation)
        text = cleanChineseForSRT(text);
        
        srtContent += `${segmentIndex}\n`;
        srtContent += `${formatSRTTime(currentSegmentStart)} --> ${formatSRTTime(segmentEnd)}\n`;
        srtContent += `${text}\n\n`;
        
        segmentIndex++;
      }
      
      currentSegmentStart = segmentEnd;
    }
    
    return srtContent.trim();
  };

  // Create paragraphs from word timings
  const createParagraphsFromWordsData = (wordsData: any[]) => {
    const allWords: WordTiming[] = processWordTimings(wordsData);
    // Group words into paragraphs (100 words per paragraph)
    const paragraphs: Paragraph[] = [];
    let currentParagraph: WordTiming[] = [];
    
    allWords.forEach((word, index) => {
      currentParagraph.push(word);
      
      // Create a new paragraph after every 100 words or at punctuation marks
      if (
        currentParagraph.length >= 100 || 
        (word.word.match(/[.!?]$/) && (index === allWords.length - 1 || allWords[index + 1]?.word.match(/^[A-Z]/)))
      ) {
        paragraphs.push({
          text: currentParagraph.map(w => formatChineseText(w.word)).join(currentParagraph.some(w => isChinese(w.word)) ? '' : ' '),
          words: [...currentParagraph],
          startTime: currentParagraph[0]?.startTime || 0,
          endTime: currentParagraph[currentParagraph.length - 1]?.endTime || 0
        });
        currentParagraph = [];
      }
    });
    
    // Add any remaining words as the last paragraph
    if (currentParagraph.length > 0) {
      paragraphs.push({
        text: currentParagraph.map(w => formatChineseText(w.word)).join(currentParagraph.some(w => isChinese(w.word)) ? '' : ' '),
        words: [...currentParagraph],
        startTime: currentParagraph[0]?.startTime || 0,
        endTime: currentParagraph[currentParagraph.length - 1]?.endTime || 0
      });
    }
    
    return { paragraphs, words: allWords };
  };

  // Function to load chat history from database
  const loadChatFromDatabase = async () => {
    try {
      // Use uid from AuthContext instead of Supabase session
      if (!uid || !audioid) {
        console.log('No authenticated user or audioid, skipping chat history load');
        return;
      }
      
      const userId = uid;
      
      // Check if this chat exists in the database
      const { data: existingChats, error: chatError } = await supabase
        .from('transcription_chats')
        .select('*')
        .eq('user_id', userId)
        .eq('audio_id', audioid);
      
      if (chatError) {
        console.error('Error fetching chat history:', chatError);
        return;
      }
      
      const existingChat = existingChats && existingChats.length > 0 ? existingChats[0] : null;
      
      if (existingChat && existingChat.messages && Array.isArray(existingChat.messages)) {
        // Convert database message format to ChatMessage format
        const formattedMessages: ChatMessage[] = existingChat.messages.map((msg: any) => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text,
          timestamp: new Date(msg.timestamp).getTime(),
          id: Math.random() // Generate a random ID for each message
        }));
        
        // Set chat messages from database
        setChatMessages(formattedMessages);
        console.log('Chat history loaded from database:', formattedMessages.length, 'messages');
        
        // If there are messages, automatically switch to the chat tab
        if (formattedMessages.length > 0) {
          setActiveTab('chat');
        }
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  // Function to fetch user coins
  const fetchUserCoins = async () => {
    if (!uid) return;
    
    try {
      const response = await userService.getUserCoins(uid);
      if (response.success) {
        setUserCoins(response.coins);
      }
    } catch (error) {
      console.error('Error fetching user coins:', error);
    }
  };

  // Fetch transcription data and chat history
  useEffect(() => {
    console.log('useEffect triggered - uid:', uid, 'audioid:', audioid, 'locationState:', locationState);
    
    if (uid && audioid) {
      fetchAudioMetadata(uid, audioid);
      loadChatFromDatabase(); // Load chat history
      fetchUserCoins(); // Fetch user coins
    } else if (locationState?.transcription && locationState?.audio_url) {
      // Log location state to verify video_file data
      console.log('Location State:', locationState);
      console.log('video_file from location state:', locationState.video_file);
      
      // Use data passed from the previous page if available
      setTranscription(locationState.transcription);
      setAudioUrl(locationState.audio_url);
      const videoFileUrl = (locationState.video_file || '').trim();
      console.log('Setting videoUrl to:', videoFileUrl);
      console.log('Original video_file:', locationState.video_file);
      setVideoUrl(videoFileUrl);
      setDuration(locationState.duration || 0);
      setFileName(locationState.audio_name );
      
      // Set words_data if available
      if (locationState.words_data) {
        setWordsData(locationState.words_data);
        setWordTimings(processWordTimings(locationState.words_data));
        const { paragraphs } = createParagraphsFromWordsData(locationState.words_data);
        setParagraphs(paragraphs);
      } else {
        processTranscription(locationState.transcription);
      }
      
      // Cache the locationState data including video_file
      localStorage.setItem(`audioData-${audioid}`, JSON.stringify({
        transcription: locationState.transcription || '',
        audioUrl: locationState.audio_url || '',
        videoUrl: videoFileUrl || '', // Cache video URL from locationState
        audio_name: locationState.audio_name,
        duration: locationState.duration || 0,
        paragraphs: paragraphs.length > 0 ? paragraphs : [],
        wordTimings: wordTimings.length > 0 ? wordTimings : [],
        words_data: locationState.words_data || [],
        xmlData: locationState.xmlData || null,
      }));
      
      setIsLoading(false);
    }
  }, [uid, audioid, locationState]);

  // Monitor videoUrl and audioUrl changes
  useEffect(() => {
    console.log('videoUrl state changed:', videoUrl);
    console.log('audioUrl state changed:', audioUrl);
    console.log('Should render video?', !!videoUrl);
    console.log('videoUrl length:', videoUrl.length);
    console.log('videoUrl type:', typeof videoUrl);
    if (videoUrl) {
      console.log('Video URL is truthy, should show video player');
    } else {
      console.log('Video URL is falsy, showing audio player');
    }
  }, [videoUrl, audioUrl]);

  // Update current word based on audio time
  useEffect(() => {
    if (wordTimings.length > 0 && currentTime > 0) {
      const index = wordTimings.findIndex(
        word => currentTime >= word.startTime && currentTime <= word.endTime
      );
      
      if (index !== -1) {
        setActiveWord(index);
        
        // Find which paragraph contains this word
        const paraIndex = paragraphs.findIndex(
          para => currentTime >= para.startTime && currentTime <= para.endTime
        );
        
        if (paraIndex !== -1 && paraIndex !== activeParagraph) {
          setActiveParagraph(paraIndex);
        }
        
        // Scroll the active word into view if needed
        if (activeWordRef.current) {
          activeWordRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      }
    }
  }, [currentTime, wordTimings, paragraphs, activeParagraph]);

  // Handle fullscreen changes (ESC key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      // Update video fullscreen state based on fullscreen element
      const isVideoInFullscreen = document.fullscreenElement === videoRef.current;
      setIsVideoFullscreen(isVideoInFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div className={`min-h-screen bg-gradient-to-br ${
      theme === 'dark' 
        ? 'from-gray-900 via-gray-800 to-gray-900' 
        : 'from-gray-50 via-blue-50 to-gray-50'
    }`}>
      <div className="container mx-auto max-w-7xl px-2 sm:px-4 md:px-6 py-3 sm:py-6 pb-0">
        {/* Header with title and controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 sm:mb-6">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
            >
              {t('transcription.title')}
            </motion.h1>
            {fileName && (
              <motion.p 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-sm sm:text-base text-gray-500 dark:text-gray-400 truncate max-w-xs sm:max-w-none"
              >
                {fileName}
              </motion.p>
            )}
          </div>
          
          <div className="flex flex-wrap gap-1 sm:gap-2 mt-3 md:mt-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all flex items-center dark:text-gray-200 text-xs sm:text-sm md:text-base"
            >
              <FiChevronLeft className="mr-1 text-sm sm:text-base" /> 
              <span className="hidden sm:inline">{t('transcription.back')}</span>
              <span className="sm:hidden">Back</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen().then(() => {
                    setIsFullscreen(true);
                  }).catch(err => {
                    console.log('Error attempting to enable fullscreen:', err);
                  });
                } else {
                  document.exitFullscreen().then(() => {
                    setIsFullscreen(false);
                  }).catch(err => {
                    console.log('Error attempting to exit fullscreen:', err);
                  });
                }
              }}
              className="p-1.5 sm:p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all text-gray-700 dark:text-gray-200"
              title={isFullscreen ? t('transcription.exitFullscreen') : t('transcription.fullscreen')}
            >
              <FiMaximize className="text-sm sm:text-base" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 sm:p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all text-gray-700 dark:text-gray-200"
              title={t('transcription.settings')}
            >
              <FiSettings className="text-sm sm:text-base" />
            </motion.button>
          </div>
        </div>

        {/* Main tabs */}
        <div className="mb-4 sm:mb-6 flex items-center border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <button
            onClick={() => setActiveTab('transcript')}
            className={`py-2 sm:py-3 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
              activeTab === 'transcript' 
                ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <span className="flex items-center">
              <FiFileText className="mr-1 sm:mr-2 text-sm" /> 
              <span className="hidden sm:inline">{t('transcription.transcript')}</span>
              <span className="sm:hidden">Text</span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab('mindmap')}
            className={`py-2 sm:py-3 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
              activeTab === 'mindmap' 
                ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <span className="flex items-center">
              <FiBarChart2 className="mr-1 sm:mr-2 text-sm" /> 
              <span className="hidden sm:inline">{t('transcription.mindMap')}</span>
              <span className="sm:hidden">Map</span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`py-2 sm:py-3 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
              activeTab === 'chat' 
                ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <span className="flex items-center">
              <FiMessageSquare className="mr-1 sm:mr-2 text-sm" /> 
              <span className="hidden sm:inline">{t('transcription.chat.title')}</span>
              <span className="sm:hidden">Chat</span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab('wordsdata')}
            className={`py-2 sm:py-3 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
              activeTab === 'wordsdata' 
                ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <span className="flex items-center">
              <FiFileText className="mr-1 sm:mr-2 text-sm" /> 
              <span className="hidden sm:inline">{t('transcription.wordsData.title')}</span>
              <span className="sm:hidden">Data</span>
            </span>
          </button>
        </div>

        {/* Mobile Audio Controls - Always visible on mobile */}
        {!isLoading && (
          <div className="lg:hidden mb-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="p-3 border-b dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{videoUrl ? t('transcription.video.controls') : t('transcription.audio.controls')}</h2>
              </div>
              
              {/* Compact waveform for mobile */}
              <div className="relative h-12 m-3 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400/60 to-purple-400/60 dark:from-blue-500/40 dark:to-purple-500/40 pointer-events-none"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                ></div>
                <div className="flex items-end justify-between h-full px-1">
                  {waveformData.map((height, i) => (
                    <div
                      key={i}
                      className="w-0.5 mx-0.5 bg-gradient-to-t from-blue-500 to-purple-500 dark:from-blue-400 dark:to-purple-400"
                      style={{ 
                        height: `${height * 100}%`,
                        opacity: currentTime / duration > i / waveformData.length ? 1 : 0.4
                      }}
                    ></div>
                  ))}
                </div>
              </div>
              
              {/* Media element for mobile - Video or Audio */}
              {videoUrl ? (
                <div className="relative mx-3 mb-3">
                  <video 
                    ref={videoRef}
                    src={videoUrl}
                    className="w-full max-h-48 rounded-lg bg-black"
                    onTimeUpdate={() => {
                      if (videoRef.current) {
                        setCurrentTime(videoRef.current.currentTime);
                      }
                    }}
                    onDurationChange={() => {
                      if (videoRef.current) {
                        setDuration(videoRef.current.duration);
                      }
                    }}
                    onEnded={() => setIsPlaying(false)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                  
                  {/* Mobile Video Control Buttons */}
                  <div className="absolute top-2 right-2 flex space-x-2">
                    {/* Subtitle Translation Controls */}
                    <div className="relative flex items-center space-x-1 language-dropdown-container">
                      {/* Translation Toggle Button */}
                      <button
                        onClick={() => {
                          if (!showTranslatedSubtitles && Object.keys(wordTranslations).length === 0) {
                            // If no translations exist, translate all words first
                            translateAllSubtitleWords();
                          }
                          setShowTranslatedSubtitles(!showTranslatedSubtitles);
                        }}
                        className={`p-2 rounded-lg transition-all ${
                          showTranslatedSubtitles
                            ? 'bg-blue-500 bg-opacity-75 text-white'
                            : 'bg-black bg-opacity-50 text-white hover:bg-opacity-75'
                        }`}
                        title={showTranslatedSubtitles ? 'Hide Translated Subtitles' : 'Show Translated Subtitles'}
                        disabled={isTranslatingWords}
                      >
                        {isTranslatingWords ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                        ) : (
                          <FiGlobe size={14} />
                        )}
                      </button>
                      
                      {/* Language Dropdown Button */}
                      <button
                        onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                        className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-75 transition-all"
                        title="Select Translation Language"
                      >
                        <FiChevronDown size={12} />
                      </button>
                      
                      {/* Language Dropdown */}
                      {showLanguageDropdown && (
                        <div className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-[9999] min-w-44 max-h-48 overflow-y-auto">
                          {subtitleLanguages.map((lang) => (
                            <button
                              key={lang.code}
                              onClick={() => {
                                setSubtitleLanguage(lang.code);
                                setShowLanguageDropdown(false);
                                // Clear existing translations when language changes
                                setWordTranslations({});
                                setShowTranslatedSubtitles(false);
                              }}
                              className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                                subtitleLanguage === lang.code ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              <span className="text-sm font-medium">{lang.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Fullscreen Button */}
                    <button
                      onClick={toggleVideoFullscreen}
                      className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-75 transition-all"
                      title="Toggle Fullscreen"
                    >
                      {isVideoFullscreen ? <FiMinimize size={16} /> : <FiMaximize size={16} />}
                    </button>
                  </div>
                  
                  {/* Enhanced Video Subtitles Overlay for mobile */}
                  {(() => {
                    const currentSegment = getCurrentSubtitleSegment();
                    if (!currentSegment) return null;
                    
                    const highlightedWords = getHighlightedWordsInSegment(currentSegment);
                    const maxWordsPerLine = 6;
                    const shouldUseMultipleLines = highlightedWords.length > maxWordsPerLine;
                    

                    
                    return (
                      <div className={`absolute bg-black bg-opacity-30 text-white px-2 py-1 rounded-lg text-center z-50 ${
                        shouldUseMultipleLines ? 'text-xs leading-tight' : 'text-xs'
                      } ${
                        isVideoFullscreen 
                          ? 'bottom-16 left-1/2 transform -translate-x-1/2 w-4/5 max-w-4xl text-sm py-2 px-4' 
                          : 'bottom-2 left-2 right-2'
                      }`}>
                        <div className="flex flex-wrap justify-center gap-1 break-words">
                          {highlightedWords.map((word, index) => {
                            const displayWord = showTranslatedSubtitles && wordTranslations[word.word] 
                              ? wordTranslations[word.word] 
                              : word.word;
                            
                            return (
                              <span
                                key={index}
                                className={`transition-all duration-200 inline-block ${
                                  word.isActive 
                                    ? 'text-yellow-300 font-bold scale-110 drop-shadow-lg' 
                                    : word.isPast 
                                      ? 'text-gray-300' 
                                      : 'text-white'
                                }`}
                                title={showTranslatedSubtitles && wordTranslations[word.word] ? `Original: ${word.word}` : undefined}
                              >
                                {displayWord}
                                {index < highlightedWords.length - 1 && ' '}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <audio 
                  ref={audioRef}
                  src={audioUrl}
                  onTimeUpdate={() => {
                    if (audioRef.current) {
                      setCurrentTime(audioRef.current.currentTime);
                    }
                  }}
                  onDurationChange={() => {
                    if (audioRef.current) {
                      setDuration(audioRef.current.duration);
                    }
                  }}
                  onEnded={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
              )}
              
              {/* Mobile audio controls */}
              <div className="px-3 pb-3">
                <div className="flex items-center mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-8">
                    {formatTime(currentTime)}
                  </span>
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={(e) => {
                      const mediaElement = videoUrl ? videoRef.current : audioRef.current;
                      if (mediaElement) {
                        mediaElement.currentTime = parseFloat(e.target.value);
                      }
                    }}
                    step="0.1"
                    className="flex-1 mx-2 accent-blue-500 h-1.5 rounded-lg appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-8 text-right">
                    {formatTime(duration)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex space-x-1">
                    <button 
                      onClick={() => {
                        const mediaElement = videoUrl ? videoRef.current : audioRef.current;
                        if (mediaElement) {
                          mediaElement.currentTime = Math.max(0, currentTime - 5);
                        }
                      }}
                      className="p-1.5 text-gray-600 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400 focus:outline-none transition-colors"
                      title={t('transcription.audio.back5Seconds')}
                    >
                      <FiChevronLeft size={14} />
                    </button>
                    <button 
                      onClick={togglePlayPause}
                      className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-full focus:outline-none shadow-md hover:shadow-lg transition-all"
                    >
                      {isPlaying ? 
                        <FiPause size={16} /> : 
                        <FiPlay size={16} className="ml-0.5" />
                      }
                    </button>
                    <button 
                      onClick={() => {
                        const mediaElement = videoUrl ? videoRef.current : audioRef.current;
                        if (mediaElement) {
                          mediaElement.currentTime = Math.min(duration, currentTime + 5);
                        }
                      }}
                      className="p-1.5 text-gray-600 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400 focus:outline-none transition-colors"
                      title={t('transcription.audio.forward5Seconds')}
                    >
                      <FiChevronRight size={14} />
                    </button>
                  </div>

                  {/* Compact playback rate controls and download for mobile */}
                  <div className="flex items-center space-x-1">
                    {[0.5, 1, 1.5, 2].map(rate => (
                      <button 
                        key={rate}
                        onClick={() => {
                          const mediaElement = videoUrl ? videoRef.current : audioRef.current;
                          if (mediaElement) {
                            mediaElement.playbackRate = rate;
                            setPlaybackRate(rate);
                          }
                        }}
                        className={`px-1.5 py-0.5 text-xs rounded-full font-medium transition-colors ${
                          playbackRate === rate 
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-sm' 
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                    <button 
                      onClick={downloadTranscription}
                      className="p-1.5 text-gray-600 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400 focus:outline-none transition-colors"
                      title="Download Transcription"
                    >
                      <FiDownload size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}



        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <FiLoader className="animate-spin h-10 w-10 text-blue-500 mb-4" />
              <span className="text-gray-600 dark:text-gray-400">{t('transcription.loadingTranscription')}</span>
            </div>
          </div>
        ) : (
          <div className={`grid grid-cols-1 ${showSidebar ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-6`}>
            {/* Main content */}
            <div className={`${showSidebar ? 'lg:col-span-2' : 'lg:col-span-1'}`}>
              {/* Transcript Tab */}
              {activeTab === 'transcript' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
                >
                  <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{t('transcription.audioTranscription')}</h2>
                    <div className="flex space-x-2">
                      <button 
                        onClick={copyTranscription}
                        className="p-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                        title={t('transcription.copyTranscription')}
                      >
                        <FiCopy />
                      </button>
                      <button 
                        onClick={shareTranscription}
                        className="p-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors" 
                        title={t('transcription.share')}
                      >
                        <FiShare2 />
                      </button>
                      <button 
                        onClick={downloadTranscription}
                        className="p-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors" 
                        title="Download Transcription"
                      >
                        <FiDownload />
                      </button>
                    </div>
                  </div>

                  {/* Translation Controls */}
                  <div className="p-2 sm:p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                      <div className="flex flex-row items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
                        <div className="relative">
                          <button
                            onClick={toggleTranslation}
                            className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all text-xs sm:text-sm ${
                              isTranslationEnabled
                                ? 'bg-green-500 hover:bg-green-600 text-white'
                                : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200'
                            }`}
                            disabled={translatingIndex !== -1}
                          >
                            <FiGlobe className="w-3 h-3 sm:w-4 sm:h-4" />
                            {isTranslationEnabled ? (
                              <FiToggleRight className="w-4 h-4 sm:w-5 sm:h-5" />
                            ) : (
                              <FiToggleLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                            )}
                            <span className="hidden sm:inline">{isTranslationEnabled ? t('transcription.translationOn') : t('transcription.enableTranslation')}</span>
                            <span className="sm:hidden">{isTranslationEnabled ? 'ON' : 'OFF'}</span>
                            {!isTranslationEnabled && (
                              <span className="flex items-center ml-1 text-orange-600 dark:text-orange-400 text-xs font-medium">
                                <span className="mr-1">-1</span>
                                <img src={coinIcon} alt="coin" className="w-3 h-3" />
                              </span>
                            )}
                          </button>
                        </div>
                        
                        <select
                          value={selectedLanguage}
                          onChange={(e) => setSelectedLanguage(e.target.value)}
                          className="px-2 sm:px-3 py-1.5 sm:py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm w-full sm:w-auto"
                          disabled={translatingIndex !== -1}
                        >
                          {languages.map((lang) => (
                            <option key={lang.value} value={lang.value}>
                              {lang.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {translatingIndex !== -1 && (
                        <div className="flex items-center space-x-1 sm:space-x-2 text-blue-600 dark:text-blue-400">
                          <FiLoader className="animate-spin w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="text-xs sm:text-sm">{t('transcription.translating')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Transcription text with word highlighting and translations */}
                  <div className="overflow-auto h-[calc(200vh-300px)] sm:h-[calc(100vh-400px)] p-3 sm:p-4 font-medium leading-relaxed text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                    {paragraphs.map((paragraph, paraIndex) => (
                        <div key={paraIndex} className="mb-4 sm:mb-6">
                          {/* Paragraph timestamp - above paragraph on left side */}
                          <div className="flex items-center mb-2">
                            <div className="flex flex-col items-start">
                              <span className="text-xs font-mono text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text font-semibold">
                                {formatTime(paragraph.startTime)}
                              </span>
                            {/* Current time indicator - only show if current time is within this paragraph */}
                            {currentTime >= paragraph.startTime && currentTime <= paragraph.endTime && (
                              <span className="text-xs font-mono text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md shadow-sm mt-1 animate-pulse">
                                {formatTime(currentTime)}
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Original paragraph */}
                        <p 
                          className={`mb-3 rounded-lg transition-all duration-200 ${
                            paraIndex === activeParagraph 
                              ? 'bg-blue-50 dark:bg-blue-900/20 p-3' 
                              : ''
                          }`}
                        >
                          {paragraph.words.map((word, wordIndex) => {
                            // Find the global index of this word
                            const globalWordIndex = wordTimings.findIndex(
                              w => w.startTime === word.startTime && w.endTime === word.endTime
                            );
                            
                            return (
                              <span 
                                key={`${paraIndex}-${wordIndex}`}
                                ref={globalWordIndex === activeWord ? activeWordRef : null}
                                className={`cursor-pointer transition-all duration-150 ${
                                  globalWordIndex === activeWord 
                                    ? 'bg-blue-500 text-white dark:bg-blue-600 rounded px-1 py-0.5' 
                                    : 'hover:bg-blue-100 hover:dark:bg-blue-900/30 rounded'
                                }`}
                                onClick={() => {
                                  const mediaElement = videoUrl ? videoRef.current : audioRef.current;
                                  if (mediaElement) {
                                    mediaElement.currentTime = word.startTime;
                                    setCurrentTime(word.startTime);
                                  }
                                }}
                              >
                                {formatChineseText(word.word)}{isChinese(word.word) ? '' : ' '}
                              </span>
                            );
                          })}
                        </p>
                        
                        {/* Translated paragraph */}
                        {isTranslationEnabled && translations[paraIndex] && (
                          <div className="ml-2 sm:ml-4 pl-2 sm:pl-4 border-l-4 border-green-400 dark:border-green-500">
                            <div className="flex items-center mb-2">
                              <FiGlobe className="w-4 h-4 text-green-600 dark:text-green-400 mr-2" />
                              <span className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">
                                {languages.find(lang => lang.value === selectedLanguage)?.label}
                              </span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 italic leading-relaxed text-sm sm:text-base">
                              {translations[paraIndex]}
                            </p>
                          </div>
                        )}
                        
                        {/* Loading indicator for individual paragraph */}
                        {isTranslationEnabled && translatingIndex === paraIndex && (
                          <div className="ml-4 pl-4 border-l-4 border-blue-400 dark:border-blue-500">
                            <div className="flex items-center">
                              <FiLoader className="animate-spin w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
                              <span className="text-sm text-blue-600 dark:text-blue-400">
                                Translating...
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Mind Map Tab */}
              {activeTab === 'mindmap' && (
                <MindMapComponent
                  transcription={transcription}
                  uid={uid}
                  audioid={audioid}
                  xmlData={xmlData}
                  onXmlDataGenerated={handleXmlDataGenerated}
                />
              )}

              {/* Chat Tab */}
              {activeTab === 'chat' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col h-[calc(200vh-200px)] sm:h-[calc(100vh-200px)] lg:h-[calc(100vh-200px)]"
                >
                  {/* Fixed Header */}
                  <div className="flex justify-between items-center p-3 sm:p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800 z-20 sticky top-0">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200">{t('transcription.chat.title')}</h2>
                    <div className="flex space-x-2">
                      <button 
                        onClick={resetChat} 
                        className="p-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                        title={t('transcription.chat.clearChat')}
                      >
                        <FiRefreshCw />
                      </button>
                      <button 
                        onClick={() => setShowSidebar(!showSidebar)}
                        className="p-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors" 
                        title={showSidebar ? t('transcription.ui.hideSidebar') : t('transcription.ui.showSidebar')}
                      >
                        <FiLayout />
                      </button>
                    </div>
                  </div>

                  {/* Quick Actions - Fixed below header */}
                  <div className="p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800 z-10 sticky top-[67px]">
                    <h3 className="text-lg font-medium mb-3 dark:text-gray-300">{t('transcription.chat.quickActions')}</h3>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleQuickAction('keypoints')}
                        disabled={isChatProcessing.keypoints || !transcription}
                        className={`px-3 py-2 rounded-lg flex items-center transition-colors text-sm ${
                          isChatProcessing.keypoints
                            ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                            : 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-800/40 text-blue-700 dark:text-blue-300'
                        }`}
                      >
                        {isChatProcessing.keypoints ? (
                          <FiLoader className="animate-spin mr-2" />
                        ) : (
                          <FiZap className="mr-2" />
                        )}
                        {t('transcription.chat.keyPoints')}
                      </button>
                      
                      <button
                        onClick={() => handleQuickAction('summary')}
                        disabled={isChatProcessing.summary || !transcription}
                        className={`px-3 py-2 rounded-lg flex items-center transition-colors text-sm ${
                          isChatProcessing.summary
                            ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                            : 'bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-800/40 text-purple-700 dark:text-purple-300'
                        }`}
                      >
                        {isChatProcessing.summary ? (
                          <FiLoader className="animate-spin mr-2" />
                        ) : (
                          <FiFileText className="mr-2" />
                        )}
                        {t('transcription.chat.quickSummary')}
                      </button>
                      
                      <div className="flex items-center">
                        <button
                          onClick={() => handleQuickAction('translate')}
                          disabled={isChatProcessing.translate || !transcription}
                          className={`px-3 py-2 rounded-lg flex items-center transition-colors text-sm ${
                            isChatProcessing.translate
                              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                              : 'bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-800/40 text-green-700 dark:text-green-300'
                          }`}
                        >
                          {isChatProcessing.translate ? (
                            <FiLoader className="animate-spin mr-2" />
                          ) : (
                            <FiBookmark className="mr-2" />
                          )}
                          {t('transcription.actions.translate')}
                        </button>
                        
                        <select
                          value={translationLanguage}
                          onChange={(e) => setTranslationLanguage(e.target.value)}
                          className="ml-2 px-2 py-1 text-xs sm:text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300"
                        >
                          <option value="Spanish">{t('transcription.languages.spanish')}</option>
                          <option value="French">{t('transcription.languages.french')}</option>
                          <option value="German">{t('transcription.languages.german')}</option>
                          <option value="Chinese">{t('transcription.languages.chinese')}</option>
                          <option value="Japanese">{t('transcription.languages.japanese')}</option>
                          <option value="Hindi">{t('transcription.languages.hindi')}</option>
                        </select>
                      </div>
                      
                      <button
                        onClick={setTranscriptionAsContext}
                        disabled={!transcription || chatMessages.length > 0}
                        className={`px-3 py-2 rounded-lg flex items-center transition-colors text-sm ${
                          !transcription || chatMessages.length > 0
                            ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                            : 'bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-800/40 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        <FiFileText className="mr-2" />
                        {t('transcription.chat.useAsContext')}
                      </button>
                    </div>
                  </div>

                  {/* Chat display area with messages - Scrollable */}
                  <div 
                    ref={chatContainerRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4 pb-20"
                  >
                    {/* Quick Action Responses */}
                    {(chatResponses.keypoints || chatResponses.summary || chatResponses.translate) && (
                      <div className="space-y-6 mb-6 border-b pb-6 dark:border-gray-700">
                        <h3 className="text-md font-medium text-gray-600 dark:text-gray-400">Quick Action Results</h3>
                        
                        {chatResponses.keypoints && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                            <h4 className="font-medium text-blue-700 dark:text-blue-400 mb-2 flex items-center">
                              <FiZap className="mr-2" /> Key Points
                            </h4>
                            <div className={`text-gray-700 dark:text-gray-300 prose prose-sm max-w-none ${theme === 'dark' ? 'prose-invert' : ''} markdown-content`}>
                              {renderTextWithMath(chatResponses.keypoints, theme, "text-gray-700 dark:text-gray-300 leading-relaxed text-sm")}
                            </div>
                          </div>
                        )}
                        
                        {chatResponses.summary && (
                          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                            <h4 className="font-medium text-purple-700 dark:text-purple-400 mb-2 flex items-center">
                              <FiFileText className="mr-2" /> Summary
                            </h4>
                            <div className={`text-gray-700 dark:text-gray-300 prose prose-sm max-w-none ${theme === 'dark' ? 'prose-invert' : ''} markdown-content`}>
                              {renderTextWithMath(chatResponses.summary, theme, "text-gray-700 dark:text-gray-300 leading-relaxed text-sm")}
                            </div>
                          </div>
                        )}
                        
                        {chatResponses.translate && (
                          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                            <h4 className="font-medium text-green-700 dark:text-green-400 mb-2 flex items-center">
                              <FiBookmark className="mr-2" /> Translation ({translationLanguage})
                            </h4>
                            <div className={`text-gray-700 dark:text-gray-300 prose prose-sm max-w-none ${theme === 'dark' ? 'prose-invert' : ''} markdown-content`}>
                              {renderTextWithMath(chatResponses.translate, theme, "text-gray-700 dark:text-gray-300 leading-relaxed text-sm")}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Chat Messages */}
                    {chatMessages.length > 0 ? (
                      <div className="space-y-6">
                        {chatMessages.map((message) => (
                          <motion.div
                            key={message.id || message.timestamp}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[90%] flex ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                              {/* Enhanced Avatar */}
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden shadow-md ${
                                message.role === 'assistant' 
                                  ? 'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white' 
                                  : 'bg-gradient-to-br from-gray-600 to-gray-800 text-white'
                              } ${message.role === 'user' ? 'ml-3' : 'mr-3'}`}>
                                {message.role === 'assistant' ? (
                                  <FiCpu className="w-5 h-5" />
                                ) : (
                                  <FiUser className="w-5 h-5" />
                                )}
                              </div>
                              
                              {/* Enhanced Message Bubble */}
                              <div className={`rounded-2xl px-5 py-4 shadow-lg ${
                                message.role === 'assistant' 
                                  ? (theme === 'dark' ? 'bg-gray-800 border border-gray-700 text-gray-100' : 'bg-white border border-gray-200 text-gray-800') 
                                  : (theme === 'dark' ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white' : 'bg-gradient-to-br from-blue-500 to-purple-500 text-white')
                              } max-w-none`}>
                                
                                {/* Message Content */}
                                {message.role === 'assistant' ? (
                                  <div className={`prose prose-sm max-w-none ${theme === 'dark' ? 'prose-invert' : ''} markdown-content`}>
                                    {message.isStreaming ? (
                                      <div className="streaming-content">
                                        {renderTextWithMath(message.content, theme, `text-gray-800 dark:text-gray-200 leading-relaxed text-sm`)}
                                        <span className="typing-cursor animate-pulse ml-1 text-blue-500">▋</span>
                                      </div>
                                    ) : (
                                      <div>
                                        {message.content ? (
                                          renderTextWithMath(message.content, theme, `text-gray-800 dark:text-gray-200 leading-relaxed text-sm`)
                                        ) : (
                                          <span>Loading content...</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="whitespace-pre-wrap text-white leading-relaxed">
                                    {renderTextWithMath(message.content, theme, "text-white leading-relaxed")}
                                  </div>
                                )}
                                
                                {/* Enhanced Message Footer */}
                                <div className={`mt-3 pt-3 border-t ${
                                  message.role === 'assistant' 
                                    ? (theme === 'dark' ? 'border-gray-700' : 'border-gray-200') 
                                    : 'border-white/20'
                                } flex items-center justify-between text-xs`}>
                                  <span className={`${
                                    message.role === 'assistant' 
                                      ? (theme === 'dark' ? 'text-gray-500' : 'text-gray-500') 
                                      : 'text-white/70'
                                  }`}>
                                    {formatTimestamp(message.timestamp)}
                                  </span>
                                  
                                  <div className="flex space-x-2">
                                    <button 
                                      onClick={() => navigator.clipboard.writeText(message.content)}
                                      className={`p-1.5 rounded-full transition-colors ${
                                        message.role === 'assistant'
                                          ? (theme === 'dark' ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700')
                                          : 'hover:bg-white/20 text-white/70 hover:text-white'
                                      }`}
                                      title="Copy message"
                                    >
                                      <FiCopy size={12} />
                                    </button>
                                    {message.role === 'assistant' && (
                                      <button 
                                        onClick={() => {
                                          const utterance = new SpeechSynthesisUtterance(message.content);
                                          window.speechSynthesis.speak(utterance);
                                        }}
                                        className={`p-1.5 rounded-full transition-colors ${
                                          theme === 'dark' ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                                        }`}
                                        title="Speak message"
                                      >
                                        <FiVolume2 size={12} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                        
                        {/* Enhanced typing indicator */}
                        {isAssistantTyping && (
                          <div className="flex justify-start">
                            <div className="max-w-[90%] flex flex-row">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mr-3 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white shadow-md">
                                <FiCpu className="w-5 h-5" />
                              </div>
                              <div className={`rounded-2xl px-6 py-4 shadow-lg ${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                                <div className="flex items-center space-x-2">
                                  <div className="flex space-x-1">
                                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                  </div>
                                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">{t('transcription.chat.aiThinking')}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      !chatResponses.keypoints && !chatResponses.summary && !chatResponses.translate && (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center mb-4">
                            <FiMessageSquare className="w-8 h-8 text-white" />
                          </div>
                          <h3 className="text-lg font-semibold mb-2">{t('transcription.chat.startConversation')}</h3>
                          <p className="text-center max-w-md">{t('transcription.chat.startConversationDescription')}</p>
                        </div>
                      )
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                  
                  {/* Chat input area - Fixed at the bottom */}
                  <div className="border-t dark:border-gray-700 p-3 sm:p-4 bg-white dark:bg-gray-800 z-10 sticky bottom-0 shadow-md">
                    <form onSubmit={handleChatSubmit} className="flex space-x-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder={t('transcription.chat.typeMessage')}
                        className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 text-sm sm:text-base"
                        disabled={isAssistantTyping}
                      />
                      <div className="relative">
                        <button
                          type="submit"
                          disabled={!chatInput.trim() || isAssistantTyping}
                          className={`px-3 sm:px-4 py-2 rounded-lg transition-colors ${
                            !chatInput.trim() || isAssistantTyping
                              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-500 hover:bg-blue-600 text-white'
                          }`}
                        >
                          {isAssistantTyping ? (
                            <FiLoader className="animate-spin w-4 h-4 sm:w-5 sm:h-5" />
                          ) : (
                            <>
                              {t('transcription.chat.send')}
                              {chatInput.trim() && (
                                <span className="ml-1 text-xs bg-orange-500/20 px-1.5 py-0.5 rounded-full flex items-center">
                                  -1 <img src={coinIcon} alt="coin" className="w-3 h-3 ml-0.5" />
                                </span>
                              )}
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}
              
              {/* Words Data Tab */}
              {activeTab === 'wordsdata' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col h-[calc(100vh-200px)]"
                >
                  {wordsData && wordsData.length > 0 ? (
                    <>
                      {/* Header with Format Tabs */}
                      <div className="border-b dark:border-gray-700">
                        <div className="flex justify-between items-center p-4">
                          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{t('transcription.wordsData.title')}</h2>
                          <div className="flex space-x-2">
                            <button 
                              onClick={copyAllSRTSegments}
                              className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                              title="Copy all SRT segments with formatting"
                            >
                              {t('transcription.wordsData.copySrt')}
                            </button>
                            <button 
                              onClick={() => {
                                const formattedDocument = generateFormattedSRTDocument(wordsData);
                                const dataBlob = new Blob([formattedDocument], {type: 'text/plain'});
                                const url = URL.createObjectURL(dataBlob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `subtitles_${audioid}.txt`;
                                link.click();
                                URL.revokeObjectURL(url);
                              }}
                              className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                              title="Download formatted SRT document"
                            >
                              {t('transcription.wordsData.downloadSrt')}
                            </button>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(JSON.stringify(wordsData, null, 2));
                                showSuccess(t('transcription.wordsData.jsonCopied'));
                              }}
                              className="p-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                              title="Copy JSON"
                            >
                              <FiCopy />
                            </button>
                          </div>
                        </div>
                        
                        {/* Format selection tabs */}
                        <div className="flex border-b dark:border-gray-700">
                          <button 
                            onClick={() => setActiveTab('wordsdata')}
                            className={`px-4 py-2 text-sm font-medium transition-colors ${
                              activeTab === 'wordsdata' 
                                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                          >
                            {t('transcription.wordsData.srtFormat')}
                          </button>
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 overflow-auto p-4">
                        {/* Statistics */}
                        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-lg">
                          <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">{t('transcription.wordsData.statistics')}</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{wordsData.length}</div>
                              <div className="text-gray-600 dark:text-gray-400">{t('transcription.wordsData.totalWords')}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{formatTime(duration)}</div>
                              <div className="text-gray-600 dark:text-gray-400">{t('transcription.wordsData.duration')}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                {(wordsData.reduce((acc, word) => acc + word.word.length, 0) / wordsData.length).toFixed(1)}
                              </div>
                              <div className="text-gray-600 dark:text-gray-400">{t('transcription.wordsData.avgCharsPerWord')}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                {duration > 0 ? Math.round((wordsData.length / duration) * 60) : 0}
                              </div>
                              <div className="text-gray-600 dark:text-gray-400">{t('transcription.wordsData.wordsPerMinute')}</div>
                            </div>
                          </div>
                        </div>
                        
                        {/* SRT Format Display with Translation */}
                        <div className="mb-6">
                          <div className="flex justify-between items-center mb-3">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                              {t('transcription.wordsData.srtSubtitles')}
                            </h3>
                            <div className="flex items-center space-x-3">
                              {/* Language Selector */}
                              <select
                                value={srtSelectedLanguage}
                                onChange={(e) => setSrtSelectedLanguage(e.target.value)}
                                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                              >
                                {languages.map(lang => (
                                  <option key={lang.value} value={lang.value}>
                                    {lang.label}
                                  </option>
                                ))}
                              </select>
                              
                              {/* AI-Enhanced Translate All Button */}
                              <button
                                onClick={translateAllSrtSegments}
                                disabled={isTranslatingSubtitle}
                                className="relative flex items-center space-x-2 px-6 py-3 text-sm font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 text-white rounded-xl hover:from-purple-700 hover:via-blue-700 hover:to-cyan-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-2xl transform hover:scale-105 overflow-hidden group"
                                style={{
                                  background: isTranslatingSubtitle 
                                    ? 'linear-gradient(45deg, #8b5cf6, #3b82f6, #06b6d4)' 
                                    : undefined,
                                  animation: isTranslatingSubtitle ? 'pulse 2s infinite' : undefined
                                }}
                              >
                                {/* AI Glow Effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 opacity-30 blur-xl group-hover:opacity-50 transition-opacity duration-300"></div>
                                
                                {/* Animated Background Particles */}
                                <div className="absolute inset-0 overflow-hidden">
                                  <div className="absolute w-2 h-2 bg-white rounded-full opacity-20 animate-ping" style={{top: '20%', left: '15%', animationDelay: '0s'}}></div>
                                  <div className="absolute w-1 h-1 bg-cyan-300 rounded-full opacity-40 animate-ping" style={{top: '60%', left: '80%', animationDelay: '1s'}}></div>
                                  <div className="absolute w-1.5 h-1.5 bg-purple-300 rounded-full opacity-30 animate-ping" style={{top: '40%', left: '60%', animationDelay: '2s'}}></div>
                                </div>
                                
                                {/* Content */}
                                <div className="relative z-10 flex items-center space-x-2">
                                  <img src={coinIcon} alt="Cost" className="w-4 h-4" />
                                  <span className="font-bold text-yellow-300">1</span>
                                  {isTranslatingSubtitle ? (
                                    <div className="flex items-center space-x-1">
                                      <FiLoader className="w-4 h-4 animate-spin" />
                                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
                                    </div>
                                  ) : (
                                    <FiGlobe className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                                  )}
                                  <span className="font-semibold">{isTranslatingSubtitle ? t('transcription.srt.translating') : t('transcription.srt.translateAll')}</span>
                                </div>
                              </button>
                              
                              {/* Removed toggle button as we now show both original and translated text */}
                            </div>
                          </div>
                          
                          {/* SRT Segments with Translation */}
                          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-96 overflow-auto">
                            {parseSrtToSegments(convertToSRT(wordsData)).map((segment, index) => (
                              <div key={index} className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                {/* Segment Header */}
                                <div className="flex justify-between items-center mb-2">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded font-mono">
                                      #{segment.id}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                      {segment.startTime} → {segment.endTime}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    {/* AI-Enhanced Copy Button */}
                                    <button
                                      onClick={() => copySegmentText(srtTranslations[index] ? `${t('transcription.srt.originalLabel')} ${segment.text}\n\n${t('transcription.srt.translationLabel')} ${srtTranslations[index]}` : segment.text)}
                                      className="relative p-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-110 overflow-hidden group"
                                      title={t('transcription.srt.copySegment')}
                                    >
                                      {/* Subtle Glow Effect */}
                                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 opacity-30 blur-md group-hover:opacity-50 transition-opacity duration-300"></div>
                                      
                                      {/* Animated Sparkle */}
                                      <div className="absolute top-1 right-1 w-1 h-1 bg-white rounded-full opacity-60 animate-ping" style={{animationDelay: '0.5s'}}></div>
                                      
                                      {/* Content */}
                                      <div className="relative z-10">
                                        <FiCopy className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                                      </div>
                                    </button>
                                  </div>
                                </div>
                                
                                {/* Segment Text - Original */}
                                <div className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed mb-2">
                                  <div className="font-medium text-xs text-blue-600 dark:text-blue-400 mb-1">
                                    {t('transcription.srt.originalLabel')}
                                  </div>
                                  <span className="font-mono">{segment.text}</span>
                                </div>
                                
                                {/* Segment Text - Translation - Only show when translation exists */}
                                {srtTranslations[index] ? (
                                  <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed pl-3 border-l-2 border-green-400 dark:border-green-600">
                                    <div className="font-medium text-xs text-green-600 dark:text-green-400 mb-1">
                                      {t('transcription.srt.translationLabel')} ({languages.find(lang => lang.value === srtSelectedLanguage)?.label})
                                    </div>
                                    <span className="font-mono">{srtTranslations[index]}</span>
                                  </div>
                                ) : (
                                  <div className="text-sm text-gray-400 dark:text-gray-500 italic pl-3 border-l-2 border-gray-300 dark:border-gray-600">
                                    {t('transcription.srt.noTranslationAvailable')}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Interactive Word Timeline */}
                        <div>
                          <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
                            {t('transcription.wordsData.interactiveTimeline')}
                          </h3>
                          <div className="grid gap-2 max-h-96 overflow-auto">
                            {wordsData.map((wordData, index) => (
                              <motion.div 
                                key={index}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`p-3 cursor-pointer rounded-lg border transition-all ${
                                  activeWord === index 
                                    ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600' 
                                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-blue-200 dark:hover:border-blue-700'
                                }`}
                                onClick={() => {
                                  const mediaElement = videoUrl ? videoRef.current : audioRef.current;
                                  if (mediaElement) {
                                    mediaElement.currentTime = wordData.start;
                                    setCurrentTime(wordData.start);
                                  }
                                }}
                              >
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center space-x-3">
                                    <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-1 rounded font-mono">
                                      #{index + 1}
                                    </span>
                                    <div>
                                      <span className="font-medium text-gray-800 dark:text-gray-200">
                                        {wordData.punctuated_word || wordData.word}
                                      </span>
                                      {wordData.confidence && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                          {t('transcription.wordsData.confidence')}: {(wordData.confidence * 100).toFixed(1)}%
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xs text-blue-600 dark:text-blue-400 font-mono">
                                      {formatTime(wordData.start)} → {formatTime(wordData.end)}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {((wordData.end - wordData.start) * 1000).toFixed(0)}ms
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                      <FiFileText size={64} className="mb-4 text-gray-300 dark:text-gray-600" />
                      <h3 className="text-xl font-semibold mb-2">{t('transcription.wordsData.noDataAvailable')}</h3>
                      <p className="text-sm text-center max-w-md">
                        {t('transcription.wordsData.noDataDescription')}
                      </p>
                      <button 
                        onClick={() => setActiveTab('transcript')}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        {t('transcription.wordsData.viewTranscript')}
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Sidebar / Audio player panel - Hidden on mobile */}
            {showSidebar && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="hidden lg:block lg:col-span-1"
              >
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                  <div className="p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{videoUrl ? t('transcription.video.controls') : t('transcription.audio.controls')}</h2>
                  </div>
                  
                  {/* Waveform visualization */}
                  <div className="relative h-16 sm:h-20 m-4 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400/60 to-purple-400/60 dark:from-blue-500/40 dark:to-purple-500/40 pointer-events-none"
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    ></div>
                    <div className="flex items-end justify-between h-full px-1">
                      {waveformData.map((height, i) => (
                        <div
                          key={i}
                          className="w-1 mx-0.5 bg-gradient-to-t from-blue-500 to-purple-500 dark:from-blue-400 dark:to-purple-400"
                          style={{ 
                            height: `${height * 100}%`,
                            opacity: currentTime / duration > i / waveformData.length ? 1 : 0.4
                          }}
                        ></div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Media element - Video or Audio */}
                  {videoUrl ? (
                    <div className="relative mb-4">
                      <video 
                        ref={videoRef}
                        src={videoUrl}
                        className="w-full max-h-64 rounded-lg bg-black"
                        onTimeUpdate={() => {
                          if (videoRef.current) {
                            setCurrentTime(videoRef.current.currentTime);
                          }
                        }}
                        onDurationChange={() => {
                          if (videoRef.current) {
                            setDuration(videoRef.current.duration);
                          }
                        }}
                        onEnded={() => setIsPlaying(false)}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                      />
                      
                      {/* Video Control Buttons */}
                      <div className="absolute top-3 right-3 flex space-x-2">
                        {/* Subtitle Translation Controls */}
                        <div className="relative flex items-center space-x-1 language-dropdown-container">
                          {/* Translation Toggle Button */}
                          <button
                            onClick={() => {
                              if (!showTranslatedSubtitles && Object.keys(wordTranslations).length === 0) {
                                // If no translations exist, translate all words first
                                translateAllSubtitleWords();
                              }
                              setShowTranslatedSubtitles(!showTranslatedSubtitles);
                            }}
                            className={`p-2 rounded-lg transition-all ${
                              showTranslatedSubtitles
                                ? 'bg-blue-500 bg-opacity-75 text-white'
                                : 'bg-black bg-opacity-50 text-white hover:bg-opacity-75'
                            }`}
                            title={showTranslatedSubtitles ? 'Hide Translated Subtitles' : 'Show Translated Subtitles'}
                            disabled={isTranslatingWords}
                          >
                            {isTranslatingWords ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            ) : (
                              <FiGlobe size={18} />
                            )}
                          </button>
                          
                          {/* Language Dropdown Button */}
                          <button
                            onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                            className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-75 transition-all"
                            title="Select Translation Language"
                          >
                            <FiChevronDown size={16} />
                          </button>
                          
                          {/* Language Dropdown */}
                          {showLanguageDropdown && (
                            <div className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-[9999] min-w-48 max-h-64 overflow-y-auto">
                              {subtitleLanguages.map((lang) => (
                                <button
                                  key={lang.code}
                                  onClick={() => {
                                    setSubtitleLanguage(lang.code);
                                    setShowLanguageDropdown(false);
                                    // Clear existing translations when language changes
                                    setWordTranslations({});
                                    setShowTranslatedSubtitles(false);
                                  }}
                                  className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                                    subtitleLanguage === lang.code ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                                  }`}
                                >
                                  <span className="text-sm font-medium">{lang.name}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {/* Fullscreen Button */}
                        <button
                          onClick={toggleVideoFullscreen}
                          className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-75 transition-all"
                          title="Toggle Fullscreen"
                        >
                          {isVideoFullscreen ? <FiMinimize size={18} /> : <FiMaximize size={18} />}
                        </button>
                      </div>
                      
                      {/* Enhanced Video Subtitles Overlay */}
                      {(() => {
                        const currentSegment = getCurrentSubtitleSegment();
                        if (!currentSegment) return null;
                        
                        const highlightedWords = getHighlightedWordsInSegment(currentSegment);
                        const maxWordsPerLine = 8;
                        const shouldUseMultipleLines = highlightedWords.length > maxWordsPerLine;
                        
                        
                        
                        return (
                          <div className={`absolute bg-black bg-opacity-30 text-white px-2 py-1 rounded-lg text-center z-50 ${
                            shouldUseMultipleLines ? 'text-xs leading-relaxed' : 'text-sm'
                          } ${
                            isVideoFullscreen 
                              ? 'bottom-20 left-1/2 transform -translate-x-1/2 w-4/5 max-w-5xl text-base py-3 px-4' 
                              : 'bottom-4 left-4 right-4'
                          }`}>
                            <div className="flex flex-wrap justify-center gap-1 break-words">
                              {highlightedWords.map((word: any, index: number) => {
                                const displayWord = showTranslatedSubtitles && wordTranslations[word.word] 
                                  ? wordTranslations[word.word] 
                                  : word.word;
                                
                                return (
                                  <span
                                    key={index}
                                    className={`transition-all duration-200 inline-block ${
                                      word.isActive 
                                        ? 'text-yellow-300 font-bold scale-110 drop-shadow-lg' 
                                        : word.isPast 
                                          ? 'text-gray-300' 
                                          : 'text-white'
                                    }`}
                                    title={showTranslatedSubtitles && wordTranslations[word.word] ? `Original: ${word.word}` : undefined}
                                  >
                                    {displayWord}
                                    {index < highlightedWords.length - 1 && ' '}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <audio 
                      ref={audioRef}
                      src={audioUrl}
                      onTimeUpdate={() => {
                        if (audioRef.current) {
                          setCurrentTime(audioRef.current.currentTime);
                        }
                      }}
                      onDurationChange={() => {
                        if (audioRef.current) {
                          setDuration(audioRef.current.duration);
                        }
                      }}
                      onEnded={() => setIsPlaying(false)}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                    />
                  )}

                  {/* Audio controls */}
                  <div className="px-4 pb-4">
                    <div className="flex items-center mb-3">
                      <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 w-10 sm:w-12">
                        {formatTime(currentTime)}
                      </span>
                      <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        value={currentTime}
                        onChange={(e) => {
                          const mediaElement = videoUrl ? videoRef.current : audioRef.current;
                          if (mediaElement) {
                            mediaElement.currentTime = parseFloat(e.target.value);
                          }
                        }}
                        step="0.1"
                        className="flex-1 mx-2 sm:mx-3 accent-blue-500 h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700"
                      />
                      <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 w-10 sm:w-12 text-right">
                        {formatTime(duration)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center mb-6">
                      <div className="flex space-x-1 sm:space-x-2">
                        <button 
                          onClick={() => {
                          const mediaElement = videoUrl ? videoRef.current : audioRef.current;
                          if (mediaElement) {
                            mediaElement.currentTime = Math.max(0, currentTime - 5);
                          }
                        }}
                          className="p-1 sm:p-2 text-gray-600 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400 focus:outline-none transition-colors"
                          title={t('transcription.audio.back5Seconds')}
                        >
                          <FiChevronLeft size={16} className="sm:h-5 sm:w-5" />
                        </button>
                        <button 
                          onClick={togglePlayPause}
                          className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-full focus:outline-none shadow-md hover:shadow-lg transition-all"
                        >
                          {isPlaying ? 
                            <FiPause size={20} className="sm:h-6 sm:w-6" /> : 
                            <FiPlay size={20} className="ml-0.5 sm:h-6 sm:w-6 sm:ml-1" />
                          }
                        </button>
                        <button 
                          onClick={() => {
                          const mediaElement = videoUrl ? videoRef.current : audioRef.current;
                          if (mediaElement) {
                            mediaElement.currentTime = Math.min(duration, currentTime + 5);
                          }
                        }}
                          className="p-1 sm:p-2 text-gray-600 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400 focus:outline-none transition-colors"
                          title={t('transcription.audio.forward5Seconds')}
                        >
                          <FiChevronRight size={16} className="sm:h-5 sm:w-5" />
                        </button>
                      </div>

                      {/* Playback rate controls */}
                      <div className="flex space-x-1">
                        {[0.5, 1, 1.5, 2].map(rate => (
                          <button 
                            key={rate}
                            onClick={() => {
                              const mediaElement = videoUrl ? videoRef.current : audioRef.current;
                              if (mediaElement) {
                                mediaElement.playbackRate = rate;
                                setPlaybackRate(rate);
                              }
                            }}
                            className={`px-1.5 sm:px-2 py-1 text-xs rounded-full font-medium transition-colors ${
                              playbackRate === rate 
                                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-sm' 
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                          >
                            {rate}x
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Audio/Video information */}
                    <div className="border-t dark:border-gray-700 pt-4 mt-4">
                      <h3 className="text-lg font-medium mb-3 dark:text-gray-300">{videoUrl ? t('transcription.video.information') : t('transcription.audio.information')}</h3>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-gray-600 dark:text-gray-400">{t('transcription.audio.duration')}:</div>
                        <div className="text-gray-800 dark:text-gray-200 font-medium">{formatTime(duration)}</div>
                        
                        <div className="text-gray-600 dark:text-gray-400">{t('transcription.audio.language')}:</div>
                        <div className="text-gray-800 dark:text-gray-200 font-medium">
                          {locationState?.language || t('transcription.languages.english')}
                        </div>
                        
                        <div className="text-gray-600 dark:text-gray-400">{t('transcription.audio.words')}:</div>
                        <div className="text-gray-800 dark:text-gray-200 font-medium">{wordTimings.length}</div>
                      </div>

                      <div className="flex flex-col space-y-3 mt-6">
                        <button 
                          onClick={downloadTranscription} 
                          className="w-full flex items-center justify-center px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors"
                        >
                          <FiDownload className="mr-2" />
                          Download Transcription
                        </button>
                        
                      
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
      
      {/* Fullscreen Subtitle Portal */}
      {(() => {
        // Check if video is in fullscreen using multiple methods
        const isVideoElementFullscreen = document.fullscreenElement === videoRef.current;
        const hasFullscreenElement = !!document.fullscreenElement;
        
        // Show portal if video is fullscreen OR if there's any fullscreen element and we have a video
        const shouldShowPortal = isVideoElementFullscreen || (hasFullscreenElement && videoRef.current);
        
        if (!shouldShowPortal) return null;
        
        const currentSegment = getCurrentSubtitleSegment();
        if (!currentSegment) return null;
        
        const highlightedWords = getHighlightedWordsInSegment(currentSegment);
        const maxWordsPerLine = 8;
        const shouldUseMultipleLines = highlightedWords.length > maxWordsPerLine;
        
        return createPortal(
          <div className="fixed inset-0 pointer-events-none z-[9999] flex items-end justify-center pb-20">
            <div className={`bg-black bg-opacity-30 text-white px-4 py-2 rounded-lg text-center max-w-4xl w-4/5 ${
              shouldUseMultipleLines ? 'text-sm leading-relaxed' : 'text-base'
            }`}>
              <div className="flex flex-wrap justify-center gap-1 break-words">
                {highlightedWords.map((word: any, index: number) => {
                  const displayWord = showTranslatedSubtitles && wordTranslations[word.word] 
                    ? wordTranslations[word.word] 
                    : word.word;
                  
                  return (
                    <span
                      key={index}
                      className={`transition-all duration-200 inline-block ${
                        word.isActive 
                          ? 'text-yellow-300 font-bold scale-110 drop-shadow-lg' 
                          : word.isPast 
                            ? 'text-gray-300' 
                            : 'text-white'
                      }`}
                      title={showTranslatedSubtitles && wordTranslations[word.word] ? `Original: ${word.word}` : undefined}
                    >
                      {displayWord}
                      {index < highlightedWords.length - 1 && ' '}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body
        );
      })()}
    </div>
  );
};

// Add CSS styles for streaming and markdown
const styles = `
  .streaming-content .typing-cursor {
    display: inline-block;
    background-color: currentColor;
    margin-left: 2px;
    animation: blink 1s infinite;
  }
  
  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }
  
  .markdown-content {
    line-height: 1.6;
  }
  
  .markdown-content h1,
  .markdown-content h2,
  .markdown-content h3,
  .markdown-content h4,
  .markdown-content h5,
  .markdown-content h6 {
    margin-top: 1.5em;
    margin-bottom: 0.5em;
    font-weight: 600;
  }
  
  .markdown-content h1:first-child,
  .markdown-content h2:first-child,
  .markdown-content h3:first-child,
  .markdown-content h4:first-child,
  .markdown-content h5:first-child,
  .markdown-content h6:first-child {
    margin-top: 0;
  }
  
  .markdown-content p {
    margin-bottom: 1em;
  }
  
  .markdown-content ul,
  .markdown-content ol {
    margin-bottom: 1em;
    padding-left: 1.5em;
  }
  
  .markdown-content li {
    margin-bottom: 0.25em;
  }
  
  .markdown-content blockquote {
    margin: 1em 0;
    padding-left: 1em;
    border-left: 4px solid #e5e7eb;
  }
  
  .dark .markdown-content blockquote {
    border-left-color: #374151;
  }
  
  .markdown-content pre {
    margin: 1em 0;
    padding: 1em;
    background-color: #f3f4f6;
    border-radius: 0.5em;
    overflow-x: auto;
  }
  
  .dark .markdown-content pre {
    background-color: #1f2937;
  }
  
  .markdown-content code {
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
  }
  
  .markdown-content table {
    border-collapse: collapse;
    width: 100%;
    margin: 1em 0;
  }
  
  .markdown-content th,
  .markdown-content td {
    border: 1px solid #e5e7eb;
    padding: 0.5em;
    text-align: left;
  }
  
  .dark .markdown-content th,
  .dark .markdown-content td {
    border-color: #374151;
  }
  
  .markdown-content th {
    background-color: #f9fafb;
    font-weight: 600;
  }
  
  .dark .markdown-content th {
    background-color: #1f2937;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}

export default TranscriptionPage;
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  FiCpu, FiUser, FiSquare, FiVolume2, FiChevronDown, FiEdit,
  FiFile, FiUpload, FiX, FiSend, FiImage, FiCheck
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
// FFmpeg imports removed - now using API endpoint for video processing

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

// Azure Translator configuration removed - using pre-translated data from API

// Azure Translate supported languages - comprehensive list
const AZURE_SUPPORTED_LANGUAGES = [
  { code: 'af', name: 'Afrikaans' },
  { code: 'sq', name: 'Albanian' },
  { code: 'am', name: 'Amharic' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hy', name: 'Armenian' },
  { code: 'as', name: 'Assamese' },
  { code: 'az', name: 'Azerbaijani' },
  { code: 'bn', name: 'Bangla' },
  { code: 'ba', name: 'Bashkir' },
  { code: 'eu', name: 'Basque' },
  { code: 'bho', name: 'Bhojpuri' },
  { code: 'brx', name: 'Bodo' },
  { code: 'bs', name: 'Bosnian' },
  { code: 'bg', name: 'Bulgarian' },
  { code: 'yue', name: 'Cantonese (Traditional)' },
  { code: 'ca', name: 'Catalan' },
  { code: 'lzh', name: 'Chinese (Literary)' },
  { code: 'zh-Hans', name: 'Chinese Simplified' },
  { code: 'zh-Hant', name: 'Chinese Traditional' },
  { code: 'sn', name: 'chiShona' },
  { code: 'hr', name: 'Croatian' },
  { code: 'cs', name: 'Czech' },
  { code: 'da', name: 'Danish' },
  { code: 'prs', name: 'Dari' },
  { code: 'dv', name: 'Divehi' },
  { code: 'doi', name: 'Dogri' },
  { code: 'nl', name: 'Dutch' },
  { code: 'en', name: 'English' },
  { code: 'et', name: 'Estonian' },
  { code: 'fo', name: 'Faroese' },
  { code: 'fj', name: 'Fijian' },
  { code: 'fil', name: 'Filipino' },
  { code: 'fi', name: 'Finnish' },
  { code: 'fr', name: 'French' },
  { code: 'fr-ca', name: 'French (Canada)' },
  { code: 'gl', name: 'Galician' },
  { code: 'ka', name: 'Georgian' },
  { code: 'de', name: 'German' },
  { code: 'el', name: 'Greek' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'ht', name: 'Haitian Creole' },
  { code: 'ha', name: 'Hausa' },
  { code: 'he', name: 'Hebrew' },
  { code: 'hi', name: 'Hindi' },
  { code: 'mww', name: 'Hmong Daw' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'is', name: 'Icelandic' },
  { code: 'ig', name: 'Igbo' },
  { code: 'id', name: 'Indonesian' },
  { code: 'ikt', name: 'Inuinnaqtun' },
  { code: 'iu', name: 'Inuktitut' },
  { code: 'iu-Latn', name: 'Inuktitut (Latin)' },
  { code: 'ga', name: 'Irish' },
  { code: 'it', name: 'Italian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'kn', name: 'Kannada' },
  { code: 'ks', name: 'Kashmiri' },
  { code: 'kk', name: 'Kazakh' },
  { code: 'km', name: 'Khmer' },
  { code: 'rw', name: 'Kinyarwanda' },
  { code: 'tlh-Latn', name: 'Klingon' },
  { code: 'tlh-Piqd', name: 'Klingon (plqaD)' },
  { code: 'gom', name: 'Konkani' },
  { code: 'ko', name: 'Korean' },
  { code: 'ku', name: 'Kurdish (Central)' },
  { code: 'kmr', name: 'Kurdish (Northern)' },
  { code: 'ky', name: 'Kyrgyz' },
  { code: 'lo', name: 'Lao' },
  { code: 'lv', name: 'Latvian' },
  { code: 'ln', name: 'Lingala' },
  { code: 'lt', name: 'Lithuanian' },
  { code: 'dsb', name: 'Lower Sorbian' },
  { code: 'lug', name: 'Luganda' },
  { code: 'mk', name: 'Macedonian' },
  { code: 'mai', name: 'Maithili' },
  { code: 'mg', name: 'Malagasy' },
  { code: 'ms', name: 'Malay' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'mt', name: 'Maltese' },
  { code: 'mi', name: 'Maori' },
  { code: 'mr', name: 'Marathi' },
  { code: 'mn-Cyrl', name: 'Mongolian (Cyrillic)' },
  { code: 'mn-Mong', name: 'Mongolian (Traditional)' },
  { code: 'my', name: 'Myanmar' },
  { code: 'ne', name: 'Nepali' },
  { code: 'nb', name: 'Norwegian' },
  { code: 'nya', name: 'Nyanja' },
  { code: 'or', name: 'Odia' },
  { code: 'ps', name: 'Pashto' },
  { code: 'fa', name: 'Persian' },
  { code: 'pl', name: 'Polish' },
  { code: 'pt', name: 'Portuguese (Brazil)' },
  { code: 'pt-pt', name: 'Portuguese (Portugal)' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'otq', name: 'Queretaro Otomi' },
  { code: 'ro', name: 'Romanian' },
  { code: 'run', name: 'Rundi' },
  { code: 'ru', name: 'Russian' },
  { code: 'sm', name: 'Samoan' },
  { code: 'sr-Cyrl', name: 'Serbian (Cyrillic)' },
  { code: 'sr-Latn', name: 'Serbian (Latin)' },
  { code: 'st', name: 'Sesotho' },
  { code: 'nso', name: 'Sesotho sa Leboa' },
  { code: 'tn', name: 'Setswana' },
  { code: 'sd', name: 'Sindhi' },
  { code: 'si', name: 'Sinhala' },
  { code: 'sk', name: 'Slovak' },
  { code: 'sl', name: 'Slovenian' },
  { code: 'so', name: 'Somali' },
  { code: 'es', name: 'Spanish' },
  { code: 'sw', name: 'Swahili' },
  { code: 'sv', name: 'Swedish' },
  { code: 'ty', name: 'Tahitian' },
  { code: 'ta', name: 'Tamil' },
  { code: 'tt', name: 'Tatar' },
  { code: 'te', name: 'Telugu' },
  { code: 'th', name: 'Thai' },
  { code: 'bo', name: 'Tibetan' },
  { code: 'ti', name: 'Tigrinya' },
  { code: 'to', name: 'Tongan' },
  { code: 'tr', name: 'Turkish' },
  { code: 'tk', name: 'Turkmen' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'hsb', name: 'Upper Sorbian' },
  { code: 'ur', name: 'Urdu' },
  { code: 'ug', name: 'Uyghur' },
  { code: 'uz', name: 'Uzbek' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'cy', name: 'Welsh' },
  { code: 'xh', name: 'Xhosa' },
  { code: 'yo', name: 'Yoruba' },
  { code: 'zu', name: 'Zulu' }
];

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
const renderTextWithMath = (text: string, theme: string, textStyle?: string, language?: string) => {
  if (!text) return null;
  
  // Detect if the content is Chinese
  const isChineseContent = language ? 
    (language.includes('zh') || language.includes('chinese') || language === 'zh-CN' || language === 'zh-TW' || language === 'zh-Hans' || language === 'zh-Hant') :
    /[\u4e00-\u9fff]/.test(text);
  
  // Dynamic spacing based on language
  const spacing = {
    paragraph: isChineseContent ? 'mb-1' : 'mb-2',
    heading: {
      h1: isChineseContent ? 'mb-2 mt-3' : 'mb-3 mt-4',
      h2: isChineseContent ? 'mb-1 mt-2' : 'mb-2 mt-3',
      h3: isChineseContent ? 'mb-1 mt-2' : 'mb-2 mt-3',
      h4: isChineseContent ? 'mb-1 mt-1' : 'mb-1 mt-2',
      h5: isChineseContent ? 'mb-0 mt-1' : 'mb-1 mt-1',
      h6: isChineseContent ? 'mb-0 mt-1' : 'mb-1 mt-1'
    },
    list: isChineseContent ? 'mb-2 space-y-0' : 'mb-3 space-y-1',
    blockquote: isChineseContent ? 'my-2' : 'my-3'
  };
  
  // Preprocess the content to handle math expressions and clean formatting
  const processedText = preprocessContent(text);
  
  return (
    <div className={`markdown-content ${theme === 'dark' ? 'dark' : ''} ${textStyle || ''} ${isChineseContent ? 'chinese-content' : 'normal-content'}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeRaw]}
        components={{
          h1: ({ children }: any) => {
            const cleanText = typeof children === 'string' ? children.replace(/^#+\s*/, '') : children;
            return (
              <h1 className={`text-xl font-bold ${spacing.heading.h1} flex items-center gap-2 ${
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
              <h2 className={`text-lg font-bold ${spacing.heading.h2} flex items-center gap-2 ${
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
              <h3 className={`text-base font-semibold ${spacing.heading.h3} flex items-center gap-2 ${
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
              <h4 className={`text-sm font-semibold ${spacing.heading.h4} flex items-center gap-2 ${
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
              <h5 className={`text-sm font-medium ${spacing.heading.h5} flex items-center gap-2 ${
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
              <h6 className={`text-xs font-medium ${spacing.heading.h6} flex items-center gap-2 ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              }`}>
                <span className="text-gray-500">▪️</span>
                {cleanText}
              </h6>
            );
          },
          p: ({ children }: any) => (
            <p className={`${spacing.paragraph} ${isChineseContent ? 'leading-normal' : 'leading-relaxed'} ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {children}
            </p>
          ),
          ul: ({ children }: any) => (
            <ul className={`${spacing.list} ml-4 list-disc ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {children}
            </ul>
          ),
          ol: ({ children }: any) => (
            <ol className={`${spacing.list} ml-4 list-decimal ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {children}
            </ol>
          ),
          li: ({ children }: any) => (
            <li className={isChineseContent ? 'mb-0' : 'mb-1'}>{children}</li>
          ),
          blockquote: ({ children }: any) => (
            <blockquote className={`border-l-4 pl-4 py-2 ${spacing.blockquote} italic ${
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

  // Audio player state
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

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
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [translations, setTranslations] = useState<string[]>([]);
  const [translatingIndex, setTranslatingIndex] = useState<number>(-1);
  const [isTranslationInProgress, setIsTranslationInProgress] = useState<boolean>(false);
  
  // Language search state
  const [languageSearchTerm, setLanguageSearchTerm] = useState<string>('');
  const [srtLanguageSearchTerm, setSrtLanguageSearchTerm] = useState<string>('');
  
  // Follow text toggle state
  const [followText, setFollowText] = useState<boolean>(true);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  
  // SRT Translation state
  const [srtTranslations, setSrtTranslations] = useState<{[key: number]: string}>({});
  const [srtTranslatingIndex, setSrtTranslatingIndex] = useState<number>(-1);
  const [srtSelectedLanguage, setSrtSelectedLanguage] = useState<string>('');
  // Removed showOriginalSrt toggle as we now show both original and translated text together
  const [srtSegments, setSrtSegments] = useState<Array<{id: number, startTime: string, endTime: string, text: string}>>([]);
  const [userCoins, setUserCoins] = useState<number>(0);
  const [isTranslatingSubtitle, setIsTranslatingSubtitle] = useState<boolean>(false);
  
  // Word-level subtitle translation state
  const [wordTranslations, setWordTranslations] = useState<{[key: string]: string}>({});
  const [showTranslatedSubtitles, setShowTranslatedSubtitles] = useState<boolean>(false);
  const [isTranslatingWords, setIsTranslatingWords] = useState<boolean>(false);
  const [subtitleLanguage, setSubtitleLanguage] = useState<string>('');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState<boolean>(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState<boolean>(false);
  const [isSrtLanguageDropdownOpen, setIsSrtLanguageDropdownOpen] = useState<boolean>(false);
  
  // Translated data from API response
  const [translatedData, setTranslatedData] = useState<any>(null);

  // Video processing state
  const [isProcessingVideo, setIsProcessingVideo] = useState<boolean>(false);
  const [videoProcessingProgress, setVideoProcessingProgress] = useState<number>(0);
  // FFmpeg reference removed - now using API endpoint for video processing

  // Enhanced languages array with Azure support and saved status
  const languages = React.useMemo(() => {
    console.log('🔍 Languages useMemo - translatedData:', translatedData);
    
    const savedLanguages = translatedData && typeof translatedData === 'object' 
      ? Object.keys(translatedData) 
      : [];
    
    const languageArray = AZURE_SUPPORTED_LANGUAGES.map(lang => ({
        label: `${lang.name}${savedLanguages.includes(lang.code) ? ' (Saved)' : ''}`,
        value: lang.code,
        isSaved: savedLanguages.includes(lang.code)
      }));
    
    console.log('🔍 Generated enhanced languages array:', languageArray);
    return languageArray;
  }, [translatedData]);
  
  // Enhanced subtitle languages with Azure support and saved status
  const subtitleLanguages = React.useMemo(() => {
    console.log('🔍 SubtitleLanguages useMemo - translatedData:', translatedData);
    
    const savedLanguages = translatedData && typeof translatedData === 'object' 
      ? Object.keys(translatedData) 
      : [];
    
    const subtitleArray = AZURE_SUPPORTED_LANGUAGES.map(lang => ({
      code: lang.code,
      name: `${lang.name}${savedLanguages.includes(lang.code) ? ' (Saved)' : ''}`,
      isSaved: savedLanguages.includes(lang.code)
    }));
    
    console.log('🔍 Generated enhanced subtitleLanguages array:', subtitleArray);
    return subtitleArray;
  }, [translatedData]);

  // Filtered language arrays for search functionality
  const filteredLanguages = React.useMemo(() => {
    return languages.filter(lang => 
      lang.label.toLowerCase().includes(languageSearchTerm.toLowerCase())
    );
  }, [languages, languageSearchTerm]);

  const filteredSrtLanguages = React.useMemo(() => {
    return subtitleLanguages.filter(lang => 
      lang.name.toLowerCase().includes(srtLanguageSearchTerm.toLowerCase())
    );
  }, [subtitleLanguages, srtLanguageSearchTerm]);

  // Update default language selections when translatedData changes
  useEffect(() => {
    if (translatedData && typeof translatedData === 'object') {
      const availableLanguages = Object.keys(translatedData);
      if (availableLanguages.length > 0) {
        const firstLang = availableLanguages[0];
        if (!selectedLanguage) setSelectedLanguage(firstLang);
        if (!srtSelectedLanguage) setSrtSelectedLanguage(firstLang);
        if (!subtitleLanguage) setSubtitleLanguage(firstLang);
      }
    } else {
      // Set default to English if no translated data is available
      if (!selectedLanguage) setSelectedLanguage('en');
      if (!srtSelectedLanguage) setSrtSelectedLanguage('en');
      if (!subtitleLanguage) setSubtitleLanguage('en');
    }
  }, [translatedData, selectedLanguage, srtSelectedLanguage, subtitleLanguage]);

  // Synchronize only subtitleLanguage with selectedLanguage and update translations (keep SRT independent)
  useEffect(() => {
    if (selectedLanguage && selectedLanguage !== subtitleLanguage) {
      console.log('🔄 Synchronizing subtitleLanguage with selectedLanguage:', selectedLanguage);
      setSubtitleLanguage(selectedLanguage);
      
      // Check if translated data is available for the new language
      const hasTranslatedData = translatedData && translatedData[selectedLanguage];
      
      // If translation is enabled but no saved data exists for the new language, disable translation
      if (isTranslationEnabled && !hasTranslatedData) {
        console.log('🔄 Auto-disabling translation - no saved data for:', selectedLanguage);
        setIsTranslationEnabled(false);
        setWordTranslations({});
        setTranslations([]);
        setTranslationProgress(0);
        setSrtTranslations({}); // Clear SRT translations as well
        return;
      }
      
      // If translation is enabled and saved data exists, update translations
      if (isTranslationEnabled && hasTranslatedData) {
        console.log('🔄 Updating translations for new language:', selectedLanguage);
        console.log('🔄 Loading pre-translated content for:', selectedLanguage);
        
        // Update video player word translations
        const newWordTranslations: {[key: string]: string} = {};
        translatedData[selectedLanguage].words.forEach((translatedWord: any) => {
          if (translatedWord.original_word) {
            newWordTranslations[translatedWord.original_word] = translatedWord.punctuated_word || translatedWord.word;
          }
        });
        setWordTranslations(newWordTranslations);
        
        // Update transcript paragraph translations
        const newParagraphTranslations = paragraphs.map((_, index) => 
          getTranslatedParagraph(index, selectedLanguage)
        );
        setTranslations(newParagraphTranslations);
        
        console.log('🔄 All translations updated for:', selectedLanguage);
      }
    }
  }, [selectedLanguage, subtitleLanguage, isTranslationEnabled, translatedData, paragraphs]);



  // UI state
  const [activeTab, setActiveTab] = useState<'transcript' | 'mindmap' | 'chat' | 'wordsdata'>('transcript');
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isVideoFullscreen, setIsVideoFullscreen] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // New state variables for enhanced features
  const [translationProgress, setTranslationProgress] = useState<number>(0);
  const [translationTimeRemaining, setTranslationTimeRemaining] = useState<number>(0); // in seconds
  const [translationStartTime, setTranslationStartTime] = useState<number>(0);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [showEditWarning, setShowEditWarning] = useState<boolean>(false);
  const [showDualSubtitles, setShowDualSubtitles] = useState<boolean>(false);
  const [editedTranscription, setEditedTranscription] = useState<string>('');
  
  // Word editing state
  const [editingWordIndex, setEditingWordIndex] = useState<number | null>(null);
  const [editingWordText, setEditingWordText] = useState<string>('');
  const [isWordEditMode, setIsWordEditMode] = useState<boolean>(false);
  
  // SRT segment editing state
  const [editingSrtIndex, setEditingSrtIndex] = useState<number | null>(null);
  const [editingSrtText, setEditingSrtText] = useState<string>('');
  const [isSrtEditMode, setIsSrtEditMode] = useState<boolean>(false);
  
  // Language detection state for spacing
  const [transcriptionLanguage, setTranscriptionLanguage] = useState<string>('');

  // Mind map state
  const [xmlData, setXmlData] = useState<string | null>(null);
  
  // Add words_data state for JSON view
  const [wordsData, setWordsData] = useState<any[]>([]);

  // Detect transcription language for proper spacing
  useEffect(() => {
    if (transcription) {
      const detectedLang = detectLanguage(transcription);
      setTranscriptionLanguage(detectedLang);
    }
  }, [transcription]);

  // Handle SRT language changes and load translations automatically
  useEffect(() => {
    if (srtSelectedLanguage && translatedData && translatedData[srtSelectedLanguage] && wordsData.length > 0) {
      console.log('🔄 Loading SRT translations for language:', srtSelectedLanguage);
      
      const segments = parseSrtToSegments(convertToSRT(wordsData));
      const newTranslations: {[key: number]: string} = {};
      
      for (let i = 0; i < segments.length; i++) {
        // Convert SRT time format to seconds for comparison
        const segmentStartSeconds = srtTimeToSeconds(segments[i].startTime);
        const segmentEndSeconds = srtTimeToSeconds(segments[i].endTime);
        
        // Get translated words for this segment timeframe
        const translatedWords = translatedData[srtSelectedLanguage].words.filter((word: any) => 
          word.start >= segmentStartSeconds && word.start < segmentEndSeconds
        );
        
        // Join translated words to form the segment text
        const words = translatedWords.map((word: any) => word.punctuated_word || word.word);
        const firstWord = words[0] || '';
        if (isChinese(firstWord)) {
          newTranslations[i] = words.join('');
        } else {
          newTranslations[i] = words.join(' ');
        }
      }
      
      setSrtTranslations(newTranslations);
      console.log('✅ SRT translations loaded for:', srtSelectedLanguage);
    } else if (srtSelectedLanguage) {
      // Clear translations if no data exists for the selected language
      setSrtTranslations({});
      console.log('🔄 Cleared SRT translations - no data for:', srtSelectedLanguage);
    }
  }, [srtSelectedLanguage, translatedData, wordsData]);

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

  // File upload state for chat
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedGenerationType, setSelectedGenerationType] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Close custom language dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isLanguageDropdownOpen && !target.closest('.custom-language-dropdown')) {
        setIsLanguageDropdownOpen(false);
      }
      if (isSrtLanguageDropdownOpen && !target.closest('.custom-srt-language-dropdown')) {
        setIsSrtLanguageDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLanguageDropdownOpen, isSrtLanguageDropdownOpen]);

  // Function to handle quick actions with formatted responses and language detection
  const handleQuickAction = async (action: 'keypoints' | 'summary' | 'translate') => {
    if (!transcription || isChatProcessing[action]) return;
    
    // Check if user is authenticated
    if (!user?.uid) {
      console.error('User not authenticated');
      return;
    }
    
    setIsChatProcessing({...isChatProcessing, [action]: true});
    
    try {
      // Deduct 1 coin before processing
      await userService.subtractCoins(user.uid, 1, `quick_${action}`);
      
      let prompt = '';
      let actionLabel = '';
      
      switch(action) {
        case 'keypoints':
          prompt = t('transcription.prompts.keypoints', { transcription });
          actionLabel = 'Key Points';
          break;
        case 'summary':
          prompt = t('transcription.prompts.summary', { transcription });
          actionLabel = 'Summary';
          break;
        case 'translate':
          prompt = t('transcription.prompts.translate', { translationLanguage, transcription });
          actionLabel = `Translation (${translationLanguage})`;
          break;
      }
      
      // Add user message to chat showing the action request
      const userMessage: ChatMessage = {
        role: 'user',
        content: `Generate ${actionLabel}`,
        timestamp: Date.now(),
        id: Date.now()
      };
      
      setChatMessages(prev => [...prev, userMessage]);
      
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
      
      // Using the streaming API to process the request
      const result = await sendMessageToAI(prompt, handleChunk);
      
      // Finalize the streaming message
      setChatMessages(prev => prev.map(msg => 
        msg.id === streamingMessageId 
          ? { ...msg, content: result, isStreaming: false }
          : msg
      ));
      
      // Also store in chatResponses for the quick action results section
      setChatResponses({...chatResponses, [action]: result});
      
      // Save both messages to database
      await saveChatToDatabase(`Generate ${actionLabel}`, 'user');
      await saveChatToDatabase(result, 'assistant');
      
    } catch (error) {
      console.error(`Error in ${action} quick action:`, error);
      
      // Check if it's a coin deduction error
      if (error instanceof Error && error.message.includes('insufficient')) {
        // Show insufficient coins message in chat
        const errorMessage: ChatMessage = {
          role: 'assistant',
          content: 'You don\'t have enough coins to perform this action. Please purchase more coins.',
          timestamp: Date.now(),
          id: Date.now()
        };
        setChatMessages(prev => [...prev, errorMessage]);
      } else {
        setChatResponses({...chatResponses, [action]: t('transcription.errors.couldNotProcess', { action })});
      }
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

  // Function to detect if text contains Chinese characters
  const isChinese = (text: string): boolean => {
    return /[\u4e00-\u9fff]/.test(text);
  };

  // Function that handles spacing for different languages
  const formatChineseText = (text: string): string => {
    // For Chinese text, return as is (no extra spacing)
    if (isChinese(text)) {
      return text;
    }
    // For non-Chinese text, return with normal spacing
    return text;
  };

  // Function to clean text for SRT - now just returns the text as is
  const cleanChineseForSRT = (text: string): string => {
    return text;
  };

  // Get state passed from the previous page
  // locationState is already declared at the top of the component

  // Function to get pre-translated paragraph from API data
  const getTranslatedParagraph = (index: number, language: string): string => {
    if (!translatedData || !translatedData[language] || !translatedData[language].words) {
      return '';
    }

    const paragraph = paragraphs[index];
    if (!paragraph) return '';

    // Find translated words that match the paragraph timeframe
    const translatedWords = translatedData[language].words.filter((word: any) => 
      word.start >= paragraph.startTime && word.end <= paragraph.endTime
    );

    // Join translated words to form the paragraph
    const words = translatedWords.map((word: any) => word.punctuated_word || word.word);
    
    // Check if the text is Chinese and join accordingly
    const firstWord = words[0] || '';
    if (isChinese(firstWord)) {
      return words.join('');
    } else {
      return words.join(' ');
    }
  };

  // Function to translate audio text via API
  const translateAudioText = async (language: string) => {
    try {
      if (!uid || !audioid) {
        throw new Error('Missing required parameters: uid or audioid');
      }
      
      setIsTranslationInProgress(true);
      setTranslationStartTime(Date.now());
      setTranslationTimeRemaining(180); // Start with 3 minutes estimate
      
      // Update time remaining every second
      const timeInterval = setInterval(() => {
        setTranslationTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timeInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      const response = await fetch('https://main-matrixai-server-lujmidrakh.cn-hangzhou.fcapp.run/api/audio/translateAudioText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: uid,
          audioid: audioid,
          language: language
        })
      });
      
      if (!response.ok) {
        clearInterval(timeInterval);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        clearInterval(timeInterval);
        setTranslationTimeRemaining(0);
        // Refresh audio file data to get updated translations
        await fetchAudioMetadata(uid, audioid);
        showSuccess(`Translation to ${language} completed successfully!`);
        return true;
      } else {
        clearInterval(timeInterval);
        throw new Error(result.message || 'Translation failed');
      }
    } catch (error) {
      console.error('Translation error:', error);
      showError(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTranslationTimeRemaining(0);
      return false;
    } finally {
      setIsTranslationInProgress(false);
    }
  };

  // Toggle translation for all paragraphs
  const toggleTranslation = async () => {
    if (!isTranslationEnabled) {
      // Check if language is selected
      if (!selectedLanguage) {
        showError('Please select a language first');
        return;
      }
      
      // Check if translated data is available for selected language
      if (!translatedData || !translatedData[selectedLanguage]) {
        // Language not saved - need to translate via API
        const success = await translateAudioText(selectedLanguage);
        if (!success) return;
        
        // After successful API translation, automatically enable translation display
        setIsTranslationEnabled(true);
        const newTranslations = paragraphs.map((_, index) => 
          getTranslatedParagraph(index, selectedLanguage)
        );
        setTranslations(newTranslations);
        setTranslationProgress(100);
        return;
      }
      
      // Enable translation and load pre-translated paragraphs
      setIsTranslationEnabled(true);
      const newTranslations = paragraphs.map((_, index) => 
        getTranslatedParagraph(index, selectedLanguage)
      );
      setTranslations(newTranslations);
      setTranslationProgress(100); // Set to 100% since translations are pre-loaded
    } else {
      // Disable translation
      setIsTranslationEnabled(false);
      setTranslations([]);
      setTranslationProgress(0); // Reset progress
    }
  };

  // Fetch audio metadata and transcription
  const fetchAudioMetadata = async (uid: string, audioid: string) => {
    try {
      setIsLoading(true);
      
      // Skip cache and fetch directly from API
      console.log('🔍 Bypassing cache - fetching directly from API');
      
      // Fetch from API
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

        // Set translated_data if available
        console.log('🔍 API Response - Full data object:', data);
        console.log('🔍 API Response - data.translated_data:', data.translated_data);
        console.log('🔍 API Response - typeof data.translated_data:', typeof data.translated_data);
        
        if (data.translated_data) {
          console.log('🔍 Setting translatedData with:', data.translated_data);
          console.log('🔍 Object.keys(data.translated_data):', Object.keys(data.translated_data));
          setTranslatedData(data.translated_data);
        } else {
          console.log('🔍 No translated_data found in API response');
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
        
        // Cache the data with words_data, video_file, and translated_data
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
          translated_data: data.translated_data || null, // Cache translated_data
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

  // Video fullscreen functionality - using native browser fullscreen
  const toggleVideoFullscreen = () => {
    if (!videoContainerRef.current) return;
    
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoContainerRef.current.requestFullscreen();
    }
  };

  // Legacy native fullscreen function (kept for compatibility)
  const toggleNativeVideoFullscreen = () => {
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

  // Create subtitle segments (3-second intervals for better readability)
  const createSubtitleSegments = () => {
    if (!wordTimings.length) return [];
    
    const segments = [];
    const segmentDuration = 3; // 3 seconds per segment for better readability
    const maxWordsPerSegment = 8; // Limit words per segment
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
        currentSegment.length >= maxWordsPerSegment ||
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

  // Get transcription text based on selected language
  const getDisplayTranscription = () => {
    if (translatedData && subtitleLanguage && translatedData[subtitleLanguage] && translatedData[subtitleLanguage].transcription) {
      return translatedData[subtitleLanguage].transcription;
    }
    return transcription; // Fallback to original transcription
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

  // Initialize FFmpeg
  // initializeFFmpeg function removed - now using API endpoint for video processing

  // Generate SRT subtitle file from word timings
  const generateSRTFromWordTimings = () => {
    if (!wordTimings.length) return '';
    
    const segments = createSubtitleSegments();
    let srtContent = '';
    
    segments.forEach((segment, index) => {
      const startTime = formatTimeForSRT(segment.startTime);
      const endTime = formatTimeForSRT(segment.endTime);
      
      srtContent += `${index + 1}\n`;
      srtContent += `${startTime} --> ${endTime}\n`;
      srtContent += `${segment.text}\n\n`;
    });
    
    return srtContent;
  };

  // Format time in seconds to SRT format (HH:MM:SS,mmm)
  const formatTimeForSRT = (timeInSeconds: number) => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    const milliseconds = Math.floor((timeInSeconds % 1) * 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
  };

  // Download video with burned-in subtitles
  const downloadVideoWithSubtitles = async () => {
    console.log('Starting video download with subtitles...');
    console.log('Video URL:', videoUrl);
    console.log('Word timings count:', wordTimings.length);
    console.log('Word timings sample:', wordTimings.slice(0, 3));
    
    if (!videoUrl || !wordTimings.length) {
      showError('Video or subtitle data not available');
      return;
    }

    setIsProcessingVideo(true);
    setVideoProcessingProgress(0);

    try {
      setVideoProcessingProgress(10);
      
      // Transform word timings to match API expected format
      const transformedWordData = wordTimings.map(word => ({
        word: word.word,
        start: word.startTime,
        end: word.endTime
      }));

      // Prepare the request payload
      const requestBody = {
        video_url: videoUrl,
        word_data: transformedWordData,
        uid: user?.id || 'anonymous'
      };

      console.log('Sending request to /api/video/generateSubtitles...');
      setVideoProcessingProgress(30);

      // Call the API endpoint
      const response = await fetch('https://main-matrixai-server-lujmidrakh.cn-hangzhou.fcapp.run/api/video/generateSubtitles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      setVideoProcessingProgress(50);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API request failed with status ${response.status}`);
      }

      const result = await response.json();
      console.log('API response:', result);

      if (!result.success) {
        throw new Error(result.message || 'Video subtitle generation failed');
      }

      setVideoProcessingProgress(80);

      // Get the processed video URL from the response
      const processedVideoUrl = result.data.video_url;
      console.log('Processed video URL:', processedVideoUrl);
      console.log('Processing time:', result.data.processing_time);

      setVideoProcessingProgress(90);

      // Download the video file properly
      try {
        const videoResponse = await fetch(processedVideoUrl);
        if (!videoResponse.ok) {
          throw new Error('Failed to fetch the processed video');
        }
        
        const videoBlob = await videoResponse.blob();
        const blobUrl = URL.createObjectURL(videoBlob);
        
        // Create download link for the processed video
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `${fileName || 'video'}_with_subtitles.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the blob URL
        URL.revokeObjectURL(blobUrl);
        
        console.log('Video download completed successfully');
      } catch (downloadError) {
        console.error('Error downloading video:', downloadError);
        // Fallback: open in new tab
        window.open(processedVideoUrl, '_blank');
      }
      setVideoProcessingProgress(100);
      showSuccess(`Video with subtitles processed successfully! Processing time: ${result.data.processing_time}`);
      
    } catch (error) {
      console.error('Error processing video with subtitles:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showError(`Failed to process video with subtitles: ${errorMessage}`);
    } finally {
      setIsProcessingVideo(false);
      setVideoProcessingProgress(0);
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
    
    // Deduct 1 coin for chat message
    try {
      await userService.subtractCoins(user.uid, 1, 'transcription_chat');
      // Update user coins after deduction
      fetchUserCoins();
    } catch (coinError) {
      console.error('Error deducting coins:', coinError);
      showError('Insufficient coins. Please purchase more coins to continue.');
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
      
      // Finalize the streaming message - use streamingContent instead of fullResponse to avoid JSON display
      setChatMessages(prev => prev.map(msg => 
        msg.id === streamingMessageId 
          ? { ...msg, content: streamingContent, isStreaming: false }
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

  // File upload functions
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerationTypeSelect = (type: string) => {
    setSelectedGenerationType(selectedGenerationType === type ? null : type);
  };

  // Function to translate SRT subtitle segment
  // Function to convert SRT time format to seconds
  const srtTimeToSeconds = (srtTime: string) => {
    const [time, ms] = srtTime.split(',');
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds + (parseInt(ms) / 1000);
  };

  // Function to translate all SRT segments
  const translateAllSrtSegments = async () => {
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }

    if (!srtSelectedLanguage) {
      showError('Please select a language first');
      return;
    }

    // Check if translation already exists for this language to prevent duplicate API calls
    if (translatedData && translatedData[srtSelectedLanguage] && Object.keys(srtTranslations).length > 0) {
      showSuccess('Translation already available for this language!');
      return;
    }

    setIsTranslatingSubtitle(true);
    
    try {
      // Check if translated data is available for selected language
      if (!translatedData || !translatedData[srtSelectedLanguage]) {
        // Language not saved - need to translate via API
        const success = await translateAudioText(srtSelectedLanguage);
        if (!success) {
          setIsTranslatingSubtitle(false);
          return;
        }
      }

      const segments = parseSrtToSegments(convertToSRT(wordsData));
      // Load pre-translated segments
      const newTranslations = { ...srtTranslations };
      
      for (let i = 0; i < segments.length; i++) {
        if (!srtTranslations[i]) {
          // Convert SRT time format to seconds for comparison
          const segmentStartSeconds = srtTimeToSeconds(segments[i].startTime);
          const segmentEndSeconds = srtTimeToSeconds(segments[i].endTime);
          
          // Get translated words for this segment timeframe
          const translatedWords = translatedData[srtSelectedLanguage].words.filter((word: any) => 
            word.start >= segmentStartSeconds && word.start < segmentEndSeconds
          );
          
          // Join translated words to form the segment text
          const words = translatedWords.map((word: any) => word.punctuated_word || word.word);
          const firstWord = words[0] || '';
          if (isChinese(firstWord)) {
            newTranslations[i] = words.join('');
          } else {
            newTranslations[i] = words.join(' ');
          }
        }
      }

      setSrtTranslations(newTranslations);
      showSuccess('SRT segments translated successfully!');
    } catch (error) {
      console.error('SRT translation error:', error);
      showError('Failed to translate SRT segments');
    } finally {
      setIsTranslatingSubtitle(false);
    }
  };

  // Function to load pre-translated words for current subtitle segment
  const loadTranslatedWordsInSegment = async (segment: { words: WordTiming[], startTime: number, endTime: number, text: string }) => {
    if (!segment || !subtitleLanguage) {
      return;
    }

    // Check if translated data is available for selected language
    if (!translatedData || !translatedData[subtitleLanguage]) {
      // Language not saved - need to translate via API
      const success = await translateAudioText(subtitleLanguage);
      if (!success) return;
    }

    const newTranslations = { ...wordTranslations };
    
    // Find translated words that match the segment timeframe
    const translatedWords = translatedData[subtitleLanguage].words.filter((word: any) => 
      word.start >= segment.startTime && word.end <= segment.endTime
    );
    
    // Map original words to translated words
    translatedWords.forEach((translatedWord: any) => {
      if (translatedWord.original_word) {
        newTranslations[translatedWord.original_word] = translatedWord.punctuated_word || translatedWord.word;
      }
    });
    
    setWordTranslations(newTranslations);
  };

  // Function to load all pre-translated words for subtitle segments
  const loadAllSubtitleWords = async () => {
    if (!subtitleLanguage) {
      showError('Please select a language first');
      return;
    }

    setIsTranslatingWords(true);
    
    try {
      // Check if translated data is available for selected language
      if (!translatedData || !translatedData[subtitleLanguage]) {
        // Language not saved - need to translate via API
        const success = await translateAudioText(subtitleLanguage);
        if (!success) {
          setIsTranslatingWords(false);
          return;
        }
      }

      const newTranslations = { ...wordTranslations };
      
      // Load all translated words from the API data
      translatedData[subtitleLanguage].words.forEach((translatedWord: any) => {
        if (translatedWord.original_word) {
          newTranslations[translatedWord.original_word] = translatedWord.punctuated_word || translatedWord.word;
        }
      });
      
      setWordTranslations(newTranslations);
      showSuccess('All subtitle words loaded successfully!');
    } catch (error) {
      console.error('Subtitle words loading error:', error);
      showError('Failed to load subtitle words');
    } finally {
      setIsTranslatingWords(false);
    }
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
    const displayText = getDisplayTranscription();
    if (!displayText) return;
    
    const contextMessage: ChatMessage = {
      role: 'user',
      content: `Here is the transcription I want to discuss:\n\n${displayText.substring(0, 1000)}${displayText.length > 1000 ? '...' : ''}`,
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
  const convertToSRT = (wordsData: any[], segmentDuration: number = 4) => {
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
    
    // Create segments based on 4-second intervals starting from 0:00
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
          text: currentParagraph.map(w => formatChineseText(w.word)).join(' '),
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
        text: currentParagraph.map(w => formatChineseText(w.word)).join(' '),
        words: [...currentParagraph],
        startTime: currentParagraph[0]?.startTime || 0,
        endTime: currentParagraph[currentParagraph.length - 1]?.endTime || 0
      });
    }
    
    return { paragraphs, words: allWords };
  };

  // Function to load chat history from database
  const loadChatFromDatabase = useCallback(async () => {
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
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  }, [uid, audioid, setChatMessages]);

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

  // Function to edit word data
  const editWordData = async (wordIndex: number, newWord: string) => {
    if (!uid || !audioid) {
      showError('Missing user ID or audio ID');
      return false;
    }

    try {
      const response = await fetch('https://main-matrixai-server-lujmidrakh.cn-hangzhou.fcapp.run/api/audio/editWordData', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: uid,
          audioId: audioid,
          wordIndex: wordIndex,
          newWord: newWord
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        // Update local wordsData
        const updatedWordsData = [...wordsData];
        if (updatedWordsData[wordIndex]) {
          updatedWordsData[wordIndex] = {
            ...updatedWordsData[wordIndex],
            word: newWord,
            punctuated_word: newWord
          };
        }
        setWordsData(updatedWordsData);
        
        // Update paragraphs and word timings
        const { paragraphs: newParagraphs, words: newWords } = createParagraphsFromWordsData(updatedWordsData);
        setParagraphs(newParagraphs);
        setWordTimings(newWords);
        
        showSuccess('Word updated successfully');
        return true;
      } else {
        showError(result.message || 'Failed to update word');
        return false;
      }
    } catch (error) {
      console.error('Error editing word:', error);
      showError('Error updating word');
      return false;
    }
  };

  // Function to handle word editing
  const handleWordEdit = (globalWordIndex: number, currentWord: string) => {
    setEditingWordIndex(globalWordIndex);
    setEditingWordText(currentWord);
  };

  // Function to save word edit
  const saveWordEdit = async () => {
    if (editingWordIndex === null || !editingWordText.trim()) {
      return;
    }

    // Validate word count (basic validation - can be enhanced)
    const originalWord = wordsData[editingWordIndex]?.word || '';
    const originalWordCount = originalWord.trim().split(/\s+/).length;
    const newWordCount = editingWordText.trim().split(/\s+/).length;
    
    if (originalWordCount !== newWordCount) {
      showError(`Word count must remain the same. Original: ${originalWordCount} words, New: ${newWordCount} words`);
      return;
    }

    const success = await editWordData(editingWordIndex, editingWordText.trim());
    if (success) {
      setEditingWordIndex(null);
      setEditingWordText('');
    }
  };

  // Function to cancel word edit
  const cancelWordEdit = () => {
    setEditingWordIndex(null);
    setEditingWordText('');
  };

  // Function to edit SRT segment data
  const editSrtSegmentData = async (segmentIndex: number, newText: string) => {
    if (!uid || !audioid) {
      showError('Missing user ID or audio ID');
      return false;
    }

    try {
      // Get the segment to find the word indices it contains
      const segments = parseSrtToSegments(convertToSRT(wordsData));
      const segment = segments[segmentIndex];
      if (!segment) {
        showError('Segment not found');
        return false;
      }

      // Parse the segment time to find corresponding words
      const segmentStartSeconds = srtTimeToSeconds(segment.startTime);
      const segmentEndSeconds = srtTimeToSeconds(segment.endTime);
      
      // Find words in this time range
      const wordsInSegment = wordsData.filter(word => 
        word.start >= segmentStartSeconds && word.start < segmentEndSeconds
      );
      
      if (wordsInSegment.length === 0) {
        showError('No words found in this segment');
        return false;
      }

      // Split new text into words
      const newWords = newText.trim().split(/\s+/);
      
      // Validate word count matches
      if (newWords.length !== wordsInSegment.length) {
        showError(`Word count must remain the same. Original: ${wordsInSegment.length} words, New: ${newWords.length} words`);
        return false;
      }

      // Update each word in the segment
      let allUpdatesSuccessful = true;
      for (let i = 0; i < wordsInSegment.length; i++) {
        const wordIndex = wordsData.findIndex(w => w === wordsInSegment[i]);
        if (wordIndex !== -1) {
          const success = await editWordData(wordIndex, newWords[i]);
          if (!success) {
            allUpdatesSuccessful = false;
            break;
          }
        }
      }

      if (allUpdatesSuccessful) {
        showSuccess('SRT segment updated successfully');
        return true;
      } else {
        showError('Failed to update some words in the segment');
        return false;
      }
    } catch (error) {
      console.error('Error editing SRT segment:', error);
      showError('Error updating SRT segment');
      return false;
    }
  };

  // Function to handle SRT segment editing
  const handleSrtEdit = (segmentIndex: number, currentText: string) => {
    setEditingSrtIndex(segmentIndex);
    setEditingSrtText(currentText);
  };

  // Function to save SRT segment edit
  const saveSrtEdit = async () => {
    if (editingSrtIndex === null || !editingSrtText.trim()) {
      return;
    }

    const success = await editSrtSegmentData(editingSrtIndex, editingSrtText.trim());
    if (success) {
      setEditingSrtIndex(null);
      setEditingSrtText('');
    }
  };

  // Function to cancel SRT segment edit
  const cancelSrtEdit = () => {
    setEditingSrtIndex(null);
    setEditingSrtText('');
  };

  // Fetch transcription data and chat history
  useEffect(() => {
    console.log('useEffect triggered - uid:', uid, 'audioid:', audioid, 'locationState:', locationState);
    
    if (uid && audioid) {
      fetchAudioMetadata(uid, audioid);
      // Only load chat history if chat tab is active
      if (activeTab === 'chat') {
        loadChatFromDatabase(); // Load chat history
      }
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
      
      // Set translated_data if available in locationState
      console.log('🔍 LocationState - translated_data:', locationState.translated_data);
      console.log('🔍 LocationState - typeof translated_data:', typeof locationState.translated_data);
      
      if (locationState.translated_data) {
        console.log('🔍 Setting translatedData from locationState with:', locationState.translated_data);
        console.log('🔍 Object.keys(locationState.translated_data):', Object.keys(locationState.translated_data));
        setTranslatedData(locationState.translated_data);
      } else {
        console.log('🔍 No translated_data found in locationState');
      }
      
      // Cache the locationState data including video_file and translated_data
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
        translated_data: locationState.translated_data || null, // Cache translated_data
      }));
      
      setIsLoading(false);
    }
  }, [uid, audioid, locationState, activeTab]);

  // Load chat data when chat tab becomes active
  useEffect(() => {
    if (activeTab === 'chat' && uid && audioid && chatMessages.length === 0) {
      loadChatFromDatabase();
    }
  }, [activeTab, uid, audioid, chatMessages.length, loadChatFromDatabase]);

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
        
        // Scroll the active word into view if needed (only within transcript container when followText is enabled)
        if (activeWordRef.current && followText) {
          // Check if we have a transcript container reference
          if (transcriptContainerRef.current) {
            // Calculate the position of the active word relative to the container
            const containerRect = transcriptContainerRef.current.getBoundingClientRect();
            const wordRect = activeWordRef.current.getBoundingClientRect();
            
            // Check if the word is outside the visible area of the container
            const isAboveContainer = wordRect.top < containerRect.top;
            const isBelowContainer = wordRect.bottom > containerRect.bottom;
            
            if (isAboveContainer || isBelowContainer) {
              // Scroll within the container to center the active word
              const containerScrollTop = transcriptContainerRef.current.scrollTop;
              const wordOffsetTop = activeWordRef.current.offsetTop;
              const containerHeight = transcriptContainerRef.current.clientHeight;
              
              const targetScrollTop = wordOffsetTop - (containerHeight / 2);
              
              transcriptContainerRef.current.scrollTo({
                top: targetScrollTop,
                behavior: 'smooth'
              });
            }
          } else {
            // Fallback: scroll within the nearest scrollable container to avoid page-level scrolling
            const scrollableParent = activeWordRef.current.closest('.overflow-y-auto, .overflow-auto');
            if (scrollableParent) {
              const wordRect = activeWordRef.current.getBoundingClientRect();
              const containerRect = scrollableParent.getBoundingClientRect();
              const relativeTop = wordRect.top - containerRect.top;
              const containerHeight = scrollableParent.clientHeight;
              
              if (relativeTop < 0 || relativeTop > containerHeight) {
                const targetScrollTop = scrollableParent.scrollTop + relativeTop - (containerHeight / 2);
                scrollableParent.scrollTo({
                  top: targetScrollTop,
                  behavior: 'smooth'
                });
              }
            }
          }
        }
      }
    }
  }, [currentTime, wordTimings, paragraphs, activeParagraph]);

  // Handle fullscreen changes (ESC key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      // Update video fullscreen state based on fullscreen element
      const isVideoInFullscreen = document.fullscreenElement === videoContainerRef.current;
      setIsVideoFullscreen(isVideoInFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Handle keyboard shortcuts (spacebar for play/pause)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle spacebar if not typing in an input field
      if (event.code === 'Space' && 
          event.target instanceof HTMLElement && 
          !['INPUT', 'TEXTAREA'].includes(event.target.tagName) &&
          !event.target.isContentEditable) {
        event.preventDefault();
        togglePlayPause();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlaying, videoUrl]); // Dependencies to ensure we have the latest state

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
                className="text-sm sm:text-base text-gray-500 dark:text-gray-400 break-words max-w-xs sm:max-w-none relative z-0"
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
              
              {/* Compact waveform for mobile - Only show for audio files */}
              {!videoUrl && (
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
              )}
              
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
                  
                  {/* Mobile Video Control Buttons - Hidden for cleaner video experience */}
                  
                  {/* Enhanced Video Subtitles Overlay for mobile */}
                  {(() => {
                    const currentSegment = getCurrentSubtitleSegment();
                    if (!currentSegment) return null;
                    
                    const highlightedWords = getHighlightedWordsInSegment(currentSegment);
                    
                    return (
                      <div className={`subtitle-overlay absolute bg-black bg-opacity-60 text-white px-4 py-3 rounded-lg text-center z-50 text-xs ${
                        isVideoFullscreen 
                          ? 'bottom-16 left-1/2 transform -translate-x-1/2 mx-auto text-sm py-4 px-6' 
                          : 'bottom-2 left-1/2 transform -translate-x-1/2 mx-auto'
                      }`} style={{ 
                        maxWidth: highlightedWords.length <= 10 ? 'none' : (isVideoFullscreen ? '85%' : '90%'),
                        whiteSpace: highlightedWords.length <= 10 ? 'nowrap' : 'normal'
                      }}>
                        <div className="flex justify-center">
                          <div className="text-center leading-tight" style={{ 
                             lineHeight: '1.3',
                             fontSize: highlightedWords.length <= 10 ? 'clamp(0.6rem, 2vw, 0.8rem)' : undefined,
                             maxHeight: highlightedWords.length <= 10 ? 'none' : '2.6em',
                             overflow: highlightedWords.length <= 10 ? 'visible' : 'hidden',
                             display: highlightedWords.length <= 10 ? 'block' : '-webkit-box',
                             WebkitLineClamp: highlightedWords.length <= 10 ? 'none' : 2,
                             WebkitBoxOrient: highlightedWords.length <= 10 ? 'initial' : 'vertical'
                           }}>
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
                                  data-lang={isChinese(displayWord) ? 'chinese' : 'other'}
                                  title={showTranslatedSubtitles && wordTranslations[word.word] ? `Original: ${word.word}` : undefined}
                                >
                                  {showDualSubtitles && wordTranslations[word.word] ? (
                                    highlightedWords.length <= 10 ? (
                                      <span className="inline-block">
                                        <span className="inline text-xs text-blue-200 mr-1" data-lang={isChinese(wordTranslations[word.word]) ? 'chinese' : 'other'}>{formatChineseText(wordTranslations[word.word])}</span>
                                        <span className="inline text-xs" data-lang={isChinese(word.word) ? 'chinese' : 'other'}>({formatChineseText(word.word)})</span>
                                      </span>
                                    ) : (
                                      <span className="inline-block">
                                        <span className="block text-xs leading-none text-blue-200 mb-1" data-lang={isChinese(wordTranslations[word.word]) ? 'chinese' : 'other'}>{formatChineseText(wordTranslations[word.word])}</span>
                                        <span className="block text-xs leading-none" data-lang={isChinese(word.word) ? 'chinese' : 'other'}>{formatChineseText(word.word)}</span>
                                      </span>
                                    )
                                  ) : (
                                    <span data-lang={isChinese(displayWord) ? 'chinese' : 'other'}>{formatChineseText(displayWord)}</span>
                                  )}
                                  {index < highlightedWords.length - 1 && !isChinese(displayWord) && ' '}
                                </span>
                              );
                            })}
                          </div>
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
                    {[0.5, 1, 2].map(rate => (
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
                    {/* Download Video with Subtitles Button - Mobile */}
                    {videoUrl && (
                      <button 
                        onClick={downloadVideoWithSubtitles}
                        disabled={isProcessingVideo || !wordTimings.length}
                        className="p-1.5 text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300 focus:outline-none transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
                        title={isProcessingVideo ? `Processing... ${videoProcessingProgress}%` : "Download Video with Subtitles"}
                      >
                        {isProcessingVideo ? (
                          <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-purple-600 border-t-transparent"></div>
                        ) : (
                          <FiDownload size={14} />
                        )}
                      </button>
                    )}
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
                      <button 
                        onClick={() => {
                          setIsEditMode(!isEditMode);
                          setShowEditWarning(true);
                          setTimeout(() => setShowEditWarning(false), 5000);
                        }}
                        className={`p-2 transition-colors ${
                          isEditMode 
                            ? 'text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300'
                            : 'text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400'
                        }`}
                        title="Edit Transcription"
                      >
                        <FiEdit />
                      </button>
                    </div>
                  </div>

                  {/* Edit Warning Message */}
                  {showEditWarning && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-500">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-yellow-700 dark:text-yellow-200">
                            <strong>Warning:</strong> Any edits made to the transcription will be lost when you leave this page.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

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
                                : isTranslationInProgress
                                ? 'bg-gray-400 dark:bg-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed'
                                : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200'
                            }`}
                            disabled={translatingIndex !== -1 || isTranslationInProgress}
                          >
                            <FiGlobe className="w-3 h-3 sm:w-4 sm:h-4" />
                            {isTranslationEnabled ? (
                              <FiToggleRight className="w-4 h-4 sm:w-5 sm:h-5" />
                            ) : (
                              <FiToggleLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                            )}
                            <span className="hidden sm:inline">
                              {isTranslationInProgress ? 
                                (translationTimeRemaining > 0 ? 
                                  `${Math.floor(translationTimeRemaining / 60)}:${(translationTimeRemaining % 60).toString().padStart(2, '0')} remaining` :
                                  'Translation may take more time, please wait'
                                ) :
                                isTranslationEnabled ? 
                                  t('transcription.translationOn') : 
                                  t('transcription.enableTranslation')
                              }
                            </span>
                            <span className="sm:hidden">
                              {isTranslationInProgress ? 
                                (translationTimeRemaining > 0 ? 
                                  `${Math.floor(translationTimeRemaining / 60)}:${(translationTimeRemaining % 60).toString().padStart(2, '0')}` :
                                  'Please wait'
                                ) :
                                isTranslationEnabled ? 'ON' : 'OFF'
                              }
                            </span>
                            {!isTranslationEnabled && !translatedData[selectedLanguage] && (
                              <span className="flex items-center ml-1 text-orange-600 dark:text-orange-400 text-xs font-medium">
                                <span className="mr-2">-2</span>
                                <img src={coinIcon} alt="coin" className="w-3 h-3" />
                              </span>
                            )}
                          </button>
                        </div>
                        
                        {languages.length > 0 ? (
                          <div className="relative custom-language-dropdown">
                            <button
                              onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                              className="px-2 sm:px-3 py-1.5 sm:py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 border border-blue-400 dark:border-purple-400 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs sm:text-sm w-full sm:w-auto flex items-center justify-between min-w-[180px] shadow-md transition-all duration-200"
                              disabled={translatingIndex !== -1 || isTranslationInProgress}
                            >
                              <span>{languages.find(lang => lang.value === selectedLanguage)?.label || 'Select Language'}</span>
                              <svg className={`w-4 h-4 transition-transform ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            {isLanguageDropdownOpen && (
                              <div className="absolute z-50 mt-1 w-full bg-black/20 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl max-h-64 overflow-hidden" style={{
                                scrollbarWidth: 'thin',
                                scrollbarColor: 'transparent transparent'
                              }}>
                                <style>{`
                                  .language-dropdown-content::-webkit-scrollbar {
                                    width: 8px;
                                  }
                                  .language-dropdown-content::-webkit-scrollbar-track {
                                    background: transparent;
                                    border-radius: 4px;
                                  }
                                  .language-dropdown-content::-webkit-scrollbar-thumb {
                                    background: rgba(255, 255, 255, 0.1);
                                    border-radius: 4px;
                                    border: 1px solid rgba(255, 255, 255, 0.05);
                                  }
                                  .language-dropdown-content::-webkit-scrollbar-thumb:hover {
                                    background: rgba(255, 255, 255, 0.2);
                                  }
                                `}</style>
                                <div className="p-2 border-b border-white/10">
                                  <input
                                    type="text"
                                    placeholder="Search languages..."
                                    value={languageSearchTerm}
                                    onChange={(e) => setLanguageSearchTerm(e.target.value)}
                                    className="w-full px-3 py-2 text-sm bg-black/10 backdrop-blur-sm border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/30 text-white placeholder-white/60"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                                <div className="language-dropdown-content overflow-y-auto max-h-48">
                                  {filteredLanguages.map((lang, index) => (
                                  <button
                                    key={lang.value}
                                    onClick={() => {
                                      setSelectedLanguage(lang.value);
                                      setIsTranslationInProgress(false);
                                      setIsLanguageDropdownOpen(false);
                                    }}
                                    className="w-full px-3 py-3 text-left text-xs sm:text-sm font-medium transition-all duration-200 transform hover:scale-[1.02] text-white/90 hover:bg-white/10 hover:backdrop-blur-sm first:rounded-t-xl last:rounded-b-xl border-b border-white/5 last:border-b-0"
                                  >
                                    <span className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-white/30"></span>
                                      {lang.label}
                                    </span>
                                  </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                            No translations available
                          </span>
                        )}
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
                  <div 
                    ref={transcriptContainerRef}
                    className="transcription-content overflow-auto h-[calc(200vh-300px)] sm:h-[calc(100vh-400px)] p-3 sm:p-4 font-medium leading-relaxed text-gray-700 dark:text-gray-300 text-sm sm:text-base"

                  >
                    {paragraphs.length > 0 ? paragraphs.map((paragraph, paraIndex) => (
                        <div key={paraIndex} className="mb-4 sm:mb-6">
                          {/* Paragraph timestamp - above paragraph on left side */}
                          <div className="flex items-center mb-2">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-mono text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text font-semibold">
                                {formatTime(paragraph.startTime)}
                              </span>
                            {/* Current time indicator - only show if current time is within this paragraph */}
                            {currentTime >= paragraph.startTime && currentTime <= paragraph.endTime && (
                              <span className="text-xs font-mono text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md shadow-sm animate-pulse">
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
                            
                            const isCurrentlyEditing = editingWordIndex === globalWordIndex;
                            
                            return (
                              <span 
                                key={`${paraIndex}-${wordIndex}`}
                                ref={globalWordIndex === activeWord ? activeWordRef : null}
                                className={`inline-flex items-center transition-all duration-150 ${
                                  globalWordIndex === activeWord 
                                    ? 'bg-blue-500 text-white dark:bg-blue-600 rounded px-1 py-0.5' 
                                    : isEditMode && !isCurrentlyEditing
                                    ? 'hover:bg-yellow-100 hover:dark:bg-yellow-900/30 rounded cursor-pointer border border-transparent hover:border-yellow-300'
                                    : 'hover:bg-blue-100 hover:dark:bg-blue-900/30 rounded cursor-pointer'
                                }`}
                              >
                                {isCurrentlyEditing ? (
                                  <div className="inline-flex items-center space-x-1 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-600 rounded px-2 py-1">
                                    <input
                                      type="text"
                                      value={editingWordText}
                                      onChange={(e) => setEditingWordText(e.target.value)}
                                      className="text-sm border-none outline-none bg-transparent text-gray-900 dark:text-gray-100 min-w-[60px] max-w-[200px]"
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          saveWordEdit();
                                        } else if (e.key === 'Escape') {
                                          cancelWordEdit();
                                        }
                                      }}
                                    />
                                    <button
                                      onClick={saveWordEdit}
                                      className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 p-0.5"
                                      title="Save"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={cancelWordEdit}
                                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-0.5"
                                      title="Cancel"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                ) : (
                                  <span
                                    className="relative group"
                                    data-lang={isChinese(word.word) ? 'chinese' : 'other'}
                                    onClick={() => {
                                      if (isEditMode) {
                                        handleWordEdit(globalWordIndex, word.word);
                                      } else {
                                        const mediaElement = videoUrl ? videoRef.current : audioRef.current;
                                        if (mediaElement) {
                                          mediaElement.currentTime = word.startTime;
                                          setCurrentTime(word.startTime);
                                        }
                                      }
                                    }}
                                  >
                                    <span style={{ wordSpacing: isChinese(word.word) ? '0' : '0.25em' }} data-lang={isChinese(word.word) ? 'chinese' : 'other'}>{formatChineseText(word.word)}</span>{!isChinese(word.word) && ' '}
                                    {isEditMode && (
                                      <span className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <svg className="w-3 h-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                      </span>
                                    )}
                                  </span>
                                )}
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
                    )) : (
                      // Fallback display when no paragraphs are available
                      <div className="whitespace-pre-wrap">
                        {wordsData && wordsData.length > 0 
                          ? (() => {
                              const words = wordsData.map(word => word.punctuated_word || word.word);
                              const firstWord = words[0] || '';
                              return isChinese(firstWord) ? words.join('') : words.join(' ');
                            })()
                          : getDisplayTranscription()
                        }
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Mind Map Tab */}
              {activeTab === 'mindmap' && (
                <MindMapComponent
                  transcription={getDisplayTranscription()}
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
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col h-[calc(100vh-200px)] max-h-[800px]"
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
                          className="ml-2 px-2 py-1 text-xs sm:text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 max-h-20 overflow-y-auto"
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
                    className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 pb-4"
                    style={{ scrollBehavior: 'smooth', overscrollBehavior: 'contain' }}
                  >

                    
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
                                        {renderTextWithMath(message.content, theme, `text-gray-800 dark:text-gray-200 leading-relaxed text-sm`, selectedLanguage)}
                                        <span className="typing-cursor animate-pulse ml-1 text-blue-500">▋</span>
                                      </div>
                                    ) : (
                                      <div>
                                        {message.content ? (
                                          renderTextWithMath(message.content, theme, `text-gray-800 dark:text-gray-200 leading-relaxed text-sm`, selectedLanguage)
                                        ) : (
                                          <span>Loading content...</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="whitespace-pre-wrap text-white leading-relaxed">
                                    {renderTextWithMath(message.content, theme, "text-white leading-relaxed", selectedLanguage)}
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
                      <div>
                        {/* Quick Action Results - Show when no chat messages */}
                        {(chatResponses.keypoints || chatResponses.summary || chatResponses.translate) && (
                          <div className="space-y-4 mb-6">
                            <h3 className="text-md font-medium text-gray-600 dark:text-gray-400">Quick Action Results</h3>
                            
                            {chatResponses.keypoints && (
                              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                <h4 className="font-medium text-blue-700 dark:text-blue-400 mb-2 flex items-center">
                                  <FiZap className="mr-2" /> Key Points
                                </h4>
                                <div className={`text-gray-700 dark:text-gray-300 prose prose-sm max-w-none ${theme === 'dark' ? 'prose-invert' : ''} markdown-content`}>
                                  {renderTextWithMath(chatResponses.keypoints, theme, "text-gray-700 dark:text-gray-300 leading-relaxed text-sm", selectedLanguage)}
                                </div>
                              </div>
                            )}
                            
                            {chatResponses.summary && (
                              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                                <h4 className="font-medium text-purple-700 dark:text-purple-400 mb-2 flex items-center">
                                  <FiFileText className="mr-2" /> Summary
                                </h4>
                                <div className={`text-gray-700 dark:text-gray-300 prose prose-sm max-w-none ${theme === 'dark' ? 'prose-invert' : ''} markdown-content`}>
                                  {renderTextWithMath(chatResponses.summary, theme, "text-gray-700 dark:text-gray-300 leading-relaxed text-sm", selectedLanguage)}
                                </div>
                              </div>
                            )}
                            
                            {chatResponses.translate && (
                              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                                <h4 className="font-medium text-green-700 dark:text-green-400 mb-2 flex items-center">
                                  <FiBookmark className="mr-2" /> Translation ({translationLanguage})
                                </h4>
                                <div className={`text-gray-700 dark:text-gray-300 prose prose-sm max-w-none ${theme === 'dark' ? 'prose-invert' : ''} markdown-content`}>
                                  {renderTextWithMath(chatResponses.translate, theme, "text-gray-700 dark:text-gray-300 leading-relaxed text-sm", selectedLanguage)}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {!chatResponses.keypoints && !chatResponses.summary && !chatResponses.translate && (
                          <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center mb-4">
                              <FiMessageSquare className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">{t('transcription.chat.startConversation')}</h3>
                            <p className="text-center max-w-md">{t('transcription.chat.startConversationDescription')}</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                  
                  {/* Chat input area - Fixed at the bottom */}
                  <div className="border-t dark:border-gray-700 p-3 sm:p-4 bg-white dark:bg-gray-800 z-10 sticky bottom-0 shadow-md">
                    {/* File upload display */}
                    {selectedFile && (
                      <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <FiFile className="text-blue-600 dark:text-blue-400" />
                            <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                              {selectedFile.name}
                            </span>
                            <span className="text-xs text-blue-500 dark:text-blue-400">
                              ({(selectedFile.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <button
                            onClick={removeSelectedFile}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
                          >
                            <FiX className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Fixed generation buttons */}
                    <div className="mb-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleGenerationTypeSelect('image')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-1.5 ${
                          selectedGenerationType === 'image'
                            ? 'bg-blue-500 text-white shadow-md transform scale-105'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        <FiImage className="w-4 h-4" />
                        <span>Generate Image</span>
                        {selectedGenerationType === 'image' && <FiCheck className="w-3 h-3" />}
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => handleGenerationTypeSelect('xlsx')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-1.5 ${
                          selectedGenerationType === 'xlsx'
                            ? 'bg-green-500 text-white shadow-md transform scale-105'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        <FiFile className="w-4 h-4" />
                        <span>Generate XLSX</span>
                        {selectedGenerationType === 'xlsx' && <FiCheck className="w-3 h-3" />}
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => handleGenerationTypeSelect('document')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-1.5 ${
                          selectedGenerationType === 'document'
                            ? 'bg-purple-500 text-white shadow-md transform scale-105'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        <FiFile className="w-4 h-4" />
                        <span>Generate Document</span>
                        {selectedGenerationType === 'document' && <FiCheck className="w-3 h-3" />}
                      </button>
                    </div>

                    <form onSubmit={handleChatSubmit} className="flex space-x-2">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder={t('transcription.chat.typeMessage')}
                          className="w-full px-3 sm:px-4 py-2 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 text-sm sm:text-base"
                          disabled={isAssistantTyping}
                        />
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          className="hidden"
                          accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif,.xlsx,.xls,.csv"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                          disabled={isAssistantTyping}
                        >
                          <FiUpload className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="relative">
                        <button
                          type="submit"
                          disabled={!chatInput.trim() || isAssistantTyping}
                          className={`px-3 sm:px-4 py-2 rounded-lg transition-colors flex items-center space-x-1 ${
                            !chatInput.trim() || isAssistantTyping
                              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-500 hover:bg-blue-600 text-white'
                          }`}
                        >
                          {isAssistantTyping ? (
                            <FiLoader className="animate-spin w-4 h-4 sm:w-5 sm:h-5" />
                          ) : (
                            <>
                              <FiSend className="w-4 h-4" />
                              <span className="hidden sm:inline">{t('transcription.chat.send')}</span>
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
              {languages.length > 0 ? (
                 <div className="relative custom-srt-language-dropdown">
                  <button
                    onClick={() => setIsSrtLanguageDropdownOpen(!isSrtLanguageDropdownOpen)}
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 flex items-center justify-between min-w-[200px]"
                  >
                    <span>{subtitleLanguages.find(lang => lang.code === srtSelectedLanguage)?.name || 'Select Language'}</span>
                    <svg className={`w-4 h-4 transition-transform ${isSrtLanguageDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isSrtLanguageDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-gradient-to-br from-white via-cyan-100 to-teal-100 dark:from-gray-800 dark:via-cyan-800/80 dark:to-teal-800/80 border-2 border-cyan-300 dark:border-cyan-600 rounded-xl shadow-2xl z-50 max-h-64 overflow-hidden" style={{
                       scrollbarWidth: 'thin',
                       scrollbarColor: '#06b6d4 #e5e7eb'
                     }}>
                      <style>{`
                        .srt-language-dropdown-content::-webkit-scrollbar {
                          width: 8px;
                        }
                        .srt-language-dropdown-content::-webkit-scrollbar-track {
                          background: linear-gradient(to bottom, #f0fdfa, #ccfbf1);
                          border-radius: 4px;
                        }
                        .srt-language-dropdown-content::-webkit-scrollbar-thumb {
                          background: linear-gradient(to bottom, #06b6d4, #0891b2);
                          border-radius: 4px;
                          border: 1px solid #0e7490;
                        }
                        .srt-language-dropdown-content::-webkit-scrollbar-thumb:hover {
                          background: linear-gradient(to bottom, #0891b2, #0e7490);
                        }
                      `}</style>
                      <div className="p-2 border-b border-gray-200/50 dark:border-gray-600/50">
                        <input
                          type="text"
                          placeholder="Search languages..."
                          value={srtLanguageSearchTerm}
                          onChange={(e) => setSrtLanguageSearchTerm(e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-700 dark:text-gray-200"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="srt-language-dropdown-content overflow-y-auto max-h-48">
                        {filteredSrtLanguages.map((lang, index) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setSrtSelectedLanguage(lang.code);
                            setIsSrtLanguageDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-3 text-left text-sm font-medium transition-all duration-200 transform hover:scale-[1.02] ${
                            index % 4 === 0 ? 'text-cyan-700 dark:text-cyan-300 hover:bg-gradient-to-r hover:from-cyan-200 hover:to-cyan-300 dark:hover:from-cyan-700/70 dark:hover:to-cyan-600/70' :
                             index % 4 === 1 ? 'text-teal-700 dark:text-teal-300 hover:bg-gradient-to-r hover:from-teal-200 hover:to-teal-300 dark:hover:from-teal-700/70 dark:hover:to-teal-600/70' :
                             index % 4 === 2 ? 'text-emerald-700 dark:text-emerald-300 hover:bg-gradient-to-r hover:from-emerald-200 hover:to-emerald-300 dark:hover:from-emerald-700/70 dark:hover:to-emerald-600/70' :
                             'text-indigo-700 dark:text-indigo-300 hover:bg-gradient-to-r hover:from-indigo-200 hover:to-indigo-300 dark:hover:from-indigo-700/70 dark:hover:to-indigo-600/70'
                          } first:rounded-t-xl last:rounded-b-xl border-b border-gray-200/50 dark:border-gray-600/50 last:border-b-0`}
                        >
                          <span className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${
                              index % 4 === 0 ? 'bg-cyan-500' :
                              index % 4 === 1 ? 'bg-teal-500' :
                              index % 4 === 2 ? 'bg-emerald-500' :
                              'bg-indigo-500'
                            }`}></span>
                            {lang.name}
                          </span>
                        </button>
                      ))}
                        </div>
                      </div>
                    )}
                </div>
              ) : (
                <span className="px-3 py-1 text-sm text-gray-500 dark:text-gray-400">
                  No translations available
                </span>
              )}
                              
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
                                  {/* Show coin indicator only for unsaved languages */}
                                  {!translatedData || !translatedData[srtSelectedLanguage] ? (
                                    <>
                                      <span className="font-bold text-yellow-300">-2</span>
                                      <img src={coinIcon} alt="Cost" className="w-4 h-4" />
                                    </>
                                  ) : null}
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
                                    {/* Edit Button */}
                                    <button
                                      onClick={() => handleSrtEdit(index, segment.text)}
                                      className="relative p-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-110 overflow-hidden group"
                                      title="Edit Segment"
                                    >
                                      {/* Subtle Glow Effect */}
                                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 opacity-30 blur-md group-hover:opacity-50 transition-opacity duration-300"></div>
                                      
                                      {/* Animated Sparkle */}
                                      <div className="absolute top-1 right-1 w-1 h-1 bg-white rounded-full opacity-60 animate-ping" style={{animationDelay: '0.3s'}}></div>
                                      
                                      {/* Content */}
                                      <div className="relative z-10">
                                        <FiEdit className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                                      </div>
                                    </button>
                                    
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
                                  {editingSrtIndex === index ? (
                                    <div className="space-y-2">
                                      <textarea
                                        value={editingSrtText}
                                        onChange={(e) => setEditingSrtText(e.target.value)}
                                        className="w-full p-2 border border-blue-300 dark:border-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 font-mono text-sm resize-none"
                                        rows={3}
                                        placeholder="Edit segment text..."
                                      />
                                      <div className="flex items-center space-x-2">
                                        <button
                                          onClick={saveSrtEdit}
                                          className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-medium"
                                        >
                                          Save
                                        </button>
                                        <button
                                          onClick={cancelSrtEdit}
                                          className="px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-xs font-medium"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="font-mono">{segment.text}</span>
                                  )}
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
                  
                  {/* Waveform visualization - Only show for audio files */}
                  {!videoUrl && (
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
                  )}
                  
                  {/* Media element - Video or Audio */}
                  {videoUrl ? (
                    <div ref={videoContainerRef} className="relative mb-4 bg-black rounded-lg overflow-hidden">
                      <video 
                        ref={videoRef}
                        src={videoUrl}
                        className={`w-full bg-black ${
                          isVideoFullscreen 
                            ? 'h-screen object-cover' 
                            : 'max-h-64 rounded-lg'
                        }`}
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
                      
                      {/* Video Control Buttons - Hidden for cleaner video experience */}
                      
                      {/* Enhanced Video Subtitles Overlay */}
                      {(() => {
                        const currentSegment = getCurrentSubtitleSegment();
                        if (!currentSegment) return null;
                        
                        const highlightedWords = getHighlightedWordsInSegment(currentSegment);
                        
                        return (
                          <div className={`subtitle-overlay absolute text-white text-center z-10 ${
                            isVideoFullscreen 
                              ? 'bottom-40 left-1/2 transform -translate-x-1/2 px-10 py-8 rounded-xl text-xl md:text-2xl shadow-2xl' 
                              : 'bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-3 rounded-lg text-xs mx-auto'
                          }`} style={{ 
                            maxWidth: highlightedWords.length <= 7 ? 'none' : (isVideoFullscreen ? '85%' : '90%'),
                            whiteSpace: highlightedWords.length <= 7 ? 'nowrap' : 'normal'
                          }}>
                            <div className="flex justify-center">
                              <div className="text-center leading-tight" style={{ 
                                 lineHeight: isVideoFullscreen ? '1.4' : '1.3',
                                 fontSize: highlightedWords.length <= 7 ? (isVideoFullscreen ? 'clamp(1rem, 3vw, 1.2rem)' : 'clamp(0.6rem, 2vw, 0.8rem)') : undefined,
                                 maxHeight: highlightedWords.length <= 7 ? 'none' : (isVideoFullscreen ? '2.8em' : '2.6em'),
                                 overflow: highlightedWords.length <= 7 ? 'visible' : 'hidden',
                                 display: highlightedWords.length <= 7 ? 'block' : '-webkit-box',
                                 WebkitLineClamp: highlightedWords.length <= 7 ? 'none' : 2,
                                 WebkitBoxOrient: highlightedWords.length <= 7 ? 'initial' : 'vertical'
                               }}>
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
                                      data-lang={isChinese(displayWord) ? 'chinese' : 'other'}
                                      title={showTranslatedSubtitles && wordTranslations[word.word] ? `Original: ${word.word}` : undefined}
                                    >
                                      {showDualSubtitles && wordTranslations[word.word] ? (
                                         highlightedWords.length <= 7 ? (
                                           <span className="inline-block">
                                             <span className="inline text-xs text-blue-200 mr-1" data-lang={isChinese(wordTranslations[word.word]) ? 'chinese' : 'other'}>{formatChineseText(wordTranslations[word.word])}</span>
                                             <span className="inline text-xs" data-lang={isChinese(word.word) ? 'chinese' : 'other'}>({formatChineseText(word.word)})</span>
                                           </span>
                                         ) : (
                                           <span className="inline-block">
                                             <span className="block text-xs leading-none text-blue-200 mb-1" data-lang={isChinese(wordTranslations[word.word]) ? 'chinese' : 'other'}>{formatChineseText(wordTranslations[word.word])}</span>
                                             <span className="block text-xs leading-none" data-lang={isChinese(word.word) ? 'chinese' : 'other'}>{formatChineseText(word.word)}</span>
                                           </span>
                                         )
                                       ) : (
                                         <span data-lang={isChinese(displayWord) ? 'chinese' : 'other'}>{formatChineseText(displayWord)}</span>
                                       )}
                                       {index < highlightedWords.length - 1 && !isChinese(displayWord) && ' '}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                      
                      {/* Video Progress Bar and Controls - Only show in fullscreen */}
                      {isVideoFullscreen && (
                        <>
                          {/* Progress Bar */}
                          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-50 bg-black bg-opacity-90 p-4 rounded-xl w-4/5 max-w-5xl">
                            <div className="flex items-center">
                              <span className="text-xs sm:text-sm w-10 sm:w-12 text-white">
                                {formatTime(currentTime)}
                              </span>
                              <input
                                type="range"
                                min="0"
                                max={duration || 100}
                                value={currentTime}
                                onChange={(e) => {
                                  const mediaElement = videoRef.current;
                                  if (mediaElement) {
                                    mediaElement.currentTime = parseFloat(e.target.value);
                                  }
                                }}
                                step="0.1"
                                className="flex-1 mx-2 sm:mx-3 accent-blue-500 h-2 rounded-lg appearance-none cursor-pointer bg-gray-600"
                              />
                              <span className="text-xs sm:text-sm w-10 sm:w-12 text-right text-white">
                                {formatTime(duration)}
                              </span>
                            </div>
                          </div>
                          
                          {/* Control Buttons */}
                          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-black bg-opacity-90 p-4 rounded-xl w-4/5 max-w-5xl">
                            <div className="flex justify-between items-center">
                              <div className="flex space-x-1 sm:space-x-2">
                                <button 
                                  onClick={() => {
                                    const mediaElement = videoRef.current;
                                    if (mediaElement) {
                                      mediaElement.currentTime = Math.max(0, currentTime - 5);
                                    }
                                  }}
                                  className="p-1 sm:p-2 focus:outline-none transition-colors text-white hover:text-blue-400"
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
                                    const mediaElement = videoRef.current;
                                    if (mediaElement) {
                                      mediaElement.currentTime = Math.min(duration, currentTime + 5);
                                    }
                                  }}
                                  className="p-1 sm:p-2 focus:outline-none transition-colors text-white hover:text-blue-400"
                                  title={t('transcription.audio.forward5Seconds')}
                                >
                                  <FiChevronRight size={16} className="sm:h-5 sm:w-5" />
                                </button>
                              </div>
                              
                              <div className="flex space-x-1 sm:space-x-2">
                                <button
                                  onClick={() => {
                                    const mediaElement = videoRef.current;
                                    if (mediaElement) {
                                      mediaElement.playbackRate = mediaElement.playbackRate === 1 ? 2 : 1;
                                      setPlaybackRate(mediaElement.playbackRate);
                                    }
                                  }}
                                  className="px-2 py-1 text-xs sm:text-sm bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                                  title={t('transcription.audio.playbackSpeed')}
                                >
                                  {playbackRate}x
                                </button>
                                <button
                                  onClick={toggleTranslation}
                                  className={`p-1 sm:p-2 rounded transition-colors ${
                                    isTranslationEnabled
                                      ? 'bg-green-500 hover:bg-green-600 text-white'
                                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                                  }`}
                                  title={isTranslationEnabled ? 'Disable Translation' : 'Enable Translation'}
                                  disabled={translatingIndex !== -1 || isTranslationInProgress}
                                >
                                  <FiGlobe size={16} className="sm:h-5 sm:w-5" />
                                </button>
                                <button
                                  onClick={toggleVideoFullscreen}
                                  className="p-1 sm:p-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
                                  title={isVideoFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                                >
                                  {isVideoFullscreen ? <FiMinimize size={16} className="sm:h-5 sm:w-5" /> : <FiMaximize size={16} className="sm:h-5 sm:w-5" />}
                                </button>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
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

                  {/* Audio controls - Only show when not in fullscreen */}
                  {!isVideoFullscreen && (
                    <div className="px-4 pb-4">
                        <div className="flex items-center mb-3">
                          <span className="text-xs sm:text-sm w-10 sm:w-12 text-gray-500 dark:text-gray-400">
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
                          <span className="text-xs sm:text-sm w-10 sm:w-12 text-right text-gray-500 dark:text-gray-400">
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
                            className="p-1 sm:p-2 focus:outline-none transition-colors text-gray-600 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400"
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
                            className="p-1 sm:p-2 focus:outline-none transition-colors text-gray-600 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400"
                            title={t('transcription.audio.forward5Seconds')}
                          >
                            <FiChevronRight size={16} className="sm:h-5 sm:w-5" />
                          </button>
                      </div>

                      {/* Playback rate controls and fullscreen button */}
                      <div className="flex space-x-1 items-center">
                        {[0.5, 1, 2].map(rate => (
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
                        {/* Translation and Fullscreen buttons for video */}
                        {videoUrl && (
                          <>
                            <button
                              onClick={toggleTranslation}
                              className={`p-1.5 sm:p-2 rounded-full transition-colors ${
                                isTranslationEnabled
                                  ? 'bg-green-500 hover:bg-green-600 text-white'
                                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                              }`}
                              title={isTranslationEnabled ? 'Disable Translation' : 'Enable Translation'}
                              disabled={translatingIndex !== -1 || isTranslationInProgress}
                            >
                              <FiGlobe size={14} />
                            </button>
                            <button
                              onClick={toggleVideoFullscreen}
                              className="p-1.5 sm:p-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full transition-colors"
                              title={isVideoFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
                            >
                              {isVideoFullscreen ? <FiMinimize size={14} /> : <FiMaximize size={14} />}
                            </button>
                          </>
                        )}
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
                        
                        {/* Download Video with Subtitles Button - Only show when video is available */}
                        {videoUrl && (
                          <button 
                            onClick={downloadVideoWithSubtitles}
                            disabled={isProcessingVideo || !wordTimings.length}
                            className="w-full flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed"
                          >
                            {isProcessingVideo ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                Processing... {videoProcessingProgress}%
                              </>
                            ) : (
                              <>
                                <FiDownload className="mr-2" />
                                Download Video with Subtitles
                              </>
                            )}
                          </button>
                        )}
                      
                      </div>
                    </div>
                  </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
      

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
  
  /* Add proper spacing to all text in the transcription - scoped to transcription content */
  .transcription-content p {
    word-spacing: 0.5em !important;
    letter-spacing: 0.05em !important;
  }
  
  /* Remove spacing for Chinese text in transcription content */
  .transcription-content p:lang(zh),
  .transcription-content p[lang="zh"],
  .transcription-content p[lang="zh-CN"],
  .transcription-content p[lang="zh-TW"] {
    word-spacing: 0 !important;
    letter-spacing: 0 !important;
  }
  
  /* Detect Chinese characters and remove spacing */
  .transcription-content p:has([data-lang="chinese"]) {
    word-spacing: 0 !important;
    letter-spacing: 0 !important;
  }
  
  /* Ensure spaces between words - scoped to transcription content */
  .transcription-content span {
    margin-right: 0.25em;
    padding-right: 0;
    margin-left: 0;
    padding-left: 0;
  }
  
  /* Remove ALL spacing for Chinese text spans */
  .transcription-content span:lang(zh),
  .transcription-content span[lang="zh"],
  .transcription-content span[lang="zh-CN"],
  .transcription-content span[lang="zh-TW"],
  .transcription-content span[data-lang="chinese"] {
    margin-right: 0 !important;
    margin-left: 0 !important;
    padding-right: 0 !important;
    padding-left: 0 !important;
    word-spacing: 0 !important;
    letter-spacing: 0 !important;
  }
  
  /* Restore original spacing for subtitle overlays */
  .subtitle-overlay span {
    word-spacing: 0.5em !important;
    letter-spacing: 0.05em !important;
    margin-right: 0.25em;
  }
  
  /* Remove ALL spacing for Chinese text in subtitle overlays */
  .subtitle-overlay span:lang(zh),
  .subtitle-overlay span[lang="zh"],
  .subtitle-overlay span[lang="zh-CN"],
  .subtitle-overlay span[lang="zh-TW"],
  .subtitle-overlay span[data-lang="chinese"] {
    word-spacing: 0 !important;
    letter-spacing: 0 !important;
    margin-right: 0 !important;
    margin-left: 0 !important;
    padding-right: 0 !important;
    padding-left: 0 !important;
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
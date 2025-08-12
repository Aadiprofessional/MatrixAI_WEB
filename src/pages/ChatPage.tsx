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
  FiVolume, FiFile
} from 'react-icons/fi';
import { ThemeContext } from '../context/ThemeContext';
import { useAuth, User } from '../context/AuthContext';
import coinImage from '../assets/coin.png';
import { useUser } from '../context/UserContext';
import { supabase } from '../supabaseClient';
import { userService } from '../services/userService';
import ProFeatureAlert from '../components/ProFeatureAlert';
import ChargeModal from '../components/ChargeModal';
import AuthRequiredButton from '../components/AuthRequiredButton';
import { useAlert } from '../context/AlertContext';
import './ChatPage.css';

// Add these imports for markdown and math rendering
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';


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
  const { userData, isPro } = useUser();
  const { user } = useAuth();
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
    .replace(/<math3>([\s\S]*?)<\/math3>/g, '$$$$1$$$$')
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

// Function to render text with math expressions and markdown formatting
const renderTextWithMath = (text: string, darkMode: boolean, textStyle?: any) => {
  if (!text) return null;
  
  // Preprocess the content to handle math expressions and clean formatting
  const processedText = preprocessContent(text);
  
  return (
    <div className={`markdown-content ${darkMode ? 'dark' : ''}`} style={textStyle}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeRaw]}
        components={{
          code: CodeBlock,
          pre: ({ children }: any) => <div className="overflow-auto">{children}</div>,
          h1: ({ children }: any) => {
            const cleanText = typeof children === 'string' ? children.replace(/^#+\s*/, '') : children;
            return (
              <h1 className={`text-2xl font-bold mb-4 mt-6 flex items-center gap-2 ${
                darkMode ? 'text-white' : 'text-gray-900'
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
                darkMode ? 'text-gray-100' : 'text-gray-800'
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
                darkMode ? 'text-gray-200' : 'text-gray-700'
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
                darkMode ? 'text-gray-300' : 'text-gray-600'
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
                darkMode ? 'text-gray-400' : 'text-gray-500'
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
  const [selectedRole, setSelectedRole] = useState(roleOptions[0]);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [showProAlert, setShowProAlert] = useState(false);
  const [freeMessagesLeft, setFreeMessagesLeft] = useState(5);
  const [freeUploadsLeft, setFreeUploadsLeft] = useState(2);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [isMessageLimitReached, setIsMessageLimitReached] = useState(false);
  
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
  const [chatId, setChatId] = useState<string>(routeChatId || Date.now().toString());
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<number | null>(null);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(false);
  const [displayedText, setDisplayedText] = useState<{[key: number]: string}>({});
  const [isTyping, setIsTyping] = useState<{[key: number]: boolean}>({});
  const [currentLineIndex, setCurrentLineIndex] = useState<{[key: number]: number}>({});
  const [showHistoryDropdown, setShowHistoryDropdown] = useState<boolean>(false);
  const [currentWordIndex, setCurrentWordIndex] = useState<{[key: number]: number}>({});
  const [wordChunks, setWordChunks] = useState<{[key: number]: string[][]}>({});
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [chats, setChats] = useState<Chat[]>([]);
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [coinsUsed, setCoinsUsed] = useState<{[key: number]: number}>({});

  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const historyDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch user chats from database without updating current messages
  const fetchUserChatsWithoutMessageUpdate = async () => {
    try {
      // Get current user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user?.id) {
        console.error('No valid session or user ID found');
        return [];
      }
      
      // Get the user ID from the session
      const userId = session.user.id;
      console.log('Fetching chats for user ID:', userId);
      
      // Query all chats for this user
      const { data: userChats, error: chatsError } = await supabase
        .from('user_chats')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      
      console.log('Fetched chats count:', userChats?.length || 0);
      
      if (chatsError || !userChats || userChats.length === 0) {
        return [];
      }
      
      // Format chats for our UI (without affecting current messages)
      const formattedChats = userChats.map(chat => {
        // Process messages to handle images and format correctly
        const processedMessages = (chat.messages || []).map((msg: any) => {
          // Check if this is an image message
          if (msg.text && typeof msg.text === 'string' && 
              msg.text.includes('supabase.co/storage/v1/')) {
            return {
              id: msg.id || Date.now().toString(),
              role: msg.sender === 'bot' ? 'assistant' : 'user',
              content: '', // Empty content for image messages
              timestamp: msg.timestamp || new Date().toISOString(),
              fileContent: msg.text, // Use the URL as fileContent
              fileName: 'Image'
            };
          }
          
          // Regular text message
          return {
            id: msg.id || Date.now().toString(),
            role: msg.sender === 'bot' ? 'assistant' : 'user',
            content: msg.text || '',
            timestamp: msg.timestamp || new Date().toISOString()
          };
        });
        
        return {
          id: chat.chat_id,
          title: chat.name || 'New Chat',
          messages: processedMessages || [],
          role: chat.role || 'general',
          roleDescription: chat.role_description || '',
          description: chat.description || ''
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
        const chatDate = new Date(userChats.find(c => c.chat_id === chat.id)?.updated_at || now);
        
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
      
      // Only update chats list, don't affect current messages
      setChats(formattedChats);
      
      // Return the formatted chats for immediate use
      return formattedChats;
      
    } catch (error) {
      console.error('Error fetching chats for real-time update:', error);
      return [];
    }
  };

  // Fetch user chats from database
  const fetchUserChats = async () => {
    try {
      setIsLoadingChats(true);
      
      // First check if we have a user from AuthContext
      if (user && user.uid) {
        console.log('Using authenticated user from AuthContext:', user.uid);
        
        // Query all chats for this user using the uid from AuthContext
        const { data: userChats, error: chatsError } = await supabase
          .from('user_chats')
          .select('*')
          .eq('user_id', user.uid)
          .order('updated_at', { ascending: false });
        
        console.log('Fetched chats count from AuthContext user:', userChats?.length || 0);
        
        if (chatsError) {
          console.error('Error fetching user chats:', chatsError);
          setIsLoadingChats(false);
          
          // Use local chat in case of fetch error
          const localChatId = routeChatId || Date.now().toString();
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
          // Format chats for our UI
          const formattedChats = userChats.map(chat => {
            // Process messages to handle images and format correctly
            const processedMessages = (chat.messages || []).map((msg: any) => {
              // Check if this is an image message
              if (msg.text && typeof msg.text === 'string' && 
                  msg.text.includes('supabase.co/storage/v1/')) {
                return {
                  id: msg.id || Date.now().toString(),
                  role: msg.sender === 'bot' ? 'assistant' : 'user',
                  content: '', // Empty content for image messages
                  timestamp: msg.timestamp || new Date().toISOString(),
                  fileContent: msg.text, // Use the URL as fileContent
                  fileName: 'Image'
                };
              }
              
              // Regular text message
              return {
                id: msg.id || Date.now().toString(),
                role: msg.sender === 'bot' ? 'assistant' : 'user',
                content: msg.text || '',
                timestamp: msg.timestamp || new Date().toISOString()
              };
            });
            
            return {
              id: chat.chat_id,
              title: chat.name || 'New Chat',
              messages: processedMessages || [],
              role: chat.role || 'general',
              roleDescription: chat.role_description || '',
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
           formattedChats.forEach(chat => {
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
          
          // Update chats state with all formatted chats
          setChats(formattedChats);
          
          // If a specific chat ID was provided in the route, load that chat
          if (routeChatId) {
            const targetChat = formattedChats.find(c => c.id === routeChatId);
            if (targetChat) {
              setChatId(routeChatId);
               setMessages(targetChat.messages || []);
               setSelectedRole(roleOptions.find(r => r.id === (targetChat.role || 'general')) || roleOptions[0]);
            } else {
              // If the requested chat doesn't exist, load the most recent one
              if (formattedChats.length > 0) {
                const mostRecentChat = formattedChats[0];
                 setChatId(mostRecentChat.id);
                 setMessages(mostRecentChat.messages || []);
                 setSelectedRole(roleOptions.find(r => r.id === (mostRecentChat.role || 'general')) || roleOptions[0]);
                 // Update URL to match the loaded chat
                 navigate(`/chat/${mostRecentChat.id}`);
              }
            }
          } else if (formattedChats.length > 0) {
            // If no specific chat was requested, load the most recent one
            const mostRecentChat = formattedChats[0];
            setChatId(mostRecentChat.id);
            setMessages(mostRecentChat.messages || []);
            setSelectedRole(roleOptions.find(r => r.id === (mostRecentChat.role || 'general')) || roleOptions[0]);
            // Update URL to match the loaded chat
            navigate(`/chat/${mostRecentChat.id}`);
          }
          
          setIsLoadingChats(false);
          return; // Exit early since we've handled everything
        } else {
          // No chats found for this user, try Supabase session as fallback
          console.log('No chats found for AuthContext user, trying Supabase session...');
        }
      } else {
        console.log('No user in AuthContext, trying Supabase session...');
      }
      
      // Fallback to Supabase session if AuthContext user didn't work
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Authentication error:', sessionError);
        setIsLoadingChats(false);
        
        // Use local chat in case of auth error
        const localChatId = routeChatId || Date.now().toString();
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
        console.log('No authenticated user found, using local chat');
        setIsLoadingChats(false);
        
        // Set up a local chat when not authenticated
        const localChatId = routeChatId || Date.now().toString();
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
      console.log('fetchUserChats - User ID from session:', userId);
      
      // Query all chats for this user
      const { data: userChats, error: chatsError } = await supabase
        .from('user_chats')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      
      console.log('fetchUserChats - Fetched chats count:', userChats?.length || 0);
      if (chatsError) {
        console.error('fetchUserChats - Error details:', chatsError);
      }
      
      if (chatsError) {
        console.error('Error fetching user chats:', chatsError);
        setIsLoadingChats(false);
        
        // Use local chat in case of fetch error
        const localChatId = routeChatId || Date.now().toString();
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
        // Format chats for our UI
        const formattedChats = userChats.map(chat => {
          // Process messages to handle images and format correctly
          const processedMessages = (chat.messages || []).map((msg: any) => {
            // Check if this is an image message
            if (msg.text && typeof msg.text === 'string' && 
                msg.text.includes('supabase.co/storage/v1/')) {
              return {
                id: msg.id || Date.now().toString(),
                role: msg.sender === 'bot' ? 'assistant' : 'user',
                content: '', // Empty content for image messages
                timestamp: msg.timestamp || new Date().toISOString(),
                fileContent: msg.text, // Use the URL as fileContent
                fileName: 'Image'
              };
            }
            
            // Regular text message
            return {
              id: msg.id || Date.now().toString(),
              role: msg.sender === 'bot' ? 'assistant' : 'user',
              content: msg.text || '',
              timestamp: msg.timestamp || new Date().toISOString()
            };
          });
          
          return {
            id: chat.chat_id,
            title: chat.name || 'New Chat',
            messages: processedMessages || [],
            role: chat.role || 'general',
            roleDescription: chat.role_description || '',
            description: chat.description || ''
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
          const chatDate = new Date(userChats.find(c => c.chat_id === chat.id)?.updated_at || now);
          
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
          const newChatId = Date.now().toString();
          startNewChat(newChatId);
        }
      } else {
        // No chats found, create a new one
        const newChatId = Date.now().toString();
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
      const localChatId = routeChatId || Date.now().toString();
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

  // Save chat message to database
  const saveChatToDatabase = async (messageContent: string, role: string) => {
    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.id) {
        console.log('No authenticated user, skipping database save');
        return;
      }
      
      const userId = session.user.id;
      const timestamp = new Date().toISOString();
      
      // Check if this chat exists in the database
      const { data: existingChat, error: chatError } = await supabase
        .from('user_chats')
        .select('*')
        .eq('chat_id', chatId)
        .eq('user_id', userId)
        .single();
      
      if (chatError && chatError.code !== 'PGRST116') { // PGRST116 is "not found" error
        console.error('Error checking chat existence:', chatError);
      }
      
      // New message object
      const newMessage = {
        sender: role === 'assistant' ? 'bot' : 'user',
        text: messageContent,
        timestamp: timestamp
      };
      
      if (existingChat) {
        // Update existing chat
        // Limit to 50 messages to prevent database size issues
        const updatedMessages = [...(existingChat.messages || []), newMessage].slice(-50);
        const chatTitle = existingChat.name === 'New Chat' && role === 'user' 
          ? messageContent.substring(0, 20) + (messageContent.length > 20 ? '...' : '')
          : existingChat.name;
        
        const { error: updateError } = await supabase
          .from('user_chats')
          .update({
            messages: updatedMessages,
            name: chatTitle,
            description: role === 'user' ? messageContent.substring(0, 30) + (messageContent.length > 30 ? '...' : '') : existingChat.description,
            updated_at: timestamp
          })
          .eq('chat_id', chatId)
          .eq('user_id', userId);
        
        if (updateError) {
          console.error('Error updating chat:', updateError);
          
          // If error is related to size, try with fewer messages
          if (updateError.message && updateError.message.includes('size')) {
            console.log('Trying with fewer messages due to size constraint');
            
            // Try again with only 10 most recent messages
            const reducedMessages = [...(existingChat.messages || []), newMessage].slice(-10);
            
            const { error: retryError } = await supabase
              .from('user_chats')
              .update({
                messages: reducedMessages,
                name: chatTitle,
                description: role === 'user' ? messageContent.substring(0, 30) + (messageContent.length > 30 ? '...' : '') : existingChat.description,
                updated_at: timestamp
              })
              .eq('chat_id', chatId)
              .eq('user_id', userId);
            
            if (retryError) {
              console.error('Error on retry with reduced messages:', retryError);
            }
          }
        }
      } else {
        // Create new chat
        const newChat = {
          chat_id: chatId,
          user_id: userId,
          name: role === 'user' 
            ? (messageContent.substring(0, 20) + (messageContent.length > 20 ? '...' : ''))
            : 'New Chat',
          description: role === 'user' ? messageContent.substring(0, 30) + (messageContent.length > 30 ? '...' : '') : 'New conversation',
          messages: [newMessage],
          role: selectedRole.id,
          role_description: selectedRole.description,
          created_at: timestamp,
          updated_at: timestamp
        };
        
        const { error: insertError } = await supabase
          .from('user_chats')
          .insert(newChat);
        
        if (insertError) {
          console.error('Error creating new chat:', insertError);
        }
      }
      
      // Update local state
      if (role === 'user' && existingChat?.name === 'New Chat') {
        // Update grouped chat history if this is a new chat
        const chatTitle = messageContent.substring(0, 20) + (messageContent.length > 20 ? '...' : '');
        setGroupedChatHistory(prev => ({
          ...prev,
          today: [{ 
            id: chatId, 
            title: chatTitle, 
            role: selectedRole.id,
            roleName: selectedRole.name
          }, ...prev.today]
        }));
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
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.id) {
        console.error('No authenticated user found');
        return;
      }
      
      // Delete from database
      const { error } = await supabase
        .from('user_chats')
        .delete()
        .eq('chat_id', chatIdToDelete)
        .eq('user_id', session.user.id);
      
      if (error) {
        console.error('Error deleting chat:', error);
        return;
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
          const newChatId = Date.now().toString();
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
        // No stored chat, create a new one
        const newChatId = Date.now().toString();
        navigate(`/chat/${newChatId}`, { replace: true });
        setChatId(newChatId);
      }
    };
    
    handleInitialNavigation();
    
    // Setup real-time subscription for chat updates
    const chatSubscription = supabase
      .channel('user_chats_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_chats'
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
  }, [routeChatId, navigate]);

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

  // Add streaming API function similar to BotScreen.js
  const sendMessageToAI = async (message: string, imageUrl: string | null = null, onChunk?: (chunk: string) => void): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        // Prepare messages array
        const apiMessages = [
          {
            role: "system",
            content: [
              {
                type: "text",
                text: "You are an AI tutor assistant helping students with their homework and studies. Provide helpful, educational responses with clear explanations and examples that students can easily understand. Use proper markdown formatting for better readability. IMPORTANT: When including mathematical expressions, please wrap inline math with <math>...</math> tags and display math (block equations) with <math3>...</math3> tags. For example: <math>x^2 + y^2 = z^2</math> for inline math, and <math3>\\int_0^1 x^2 dx = \\frac{1}{3}</math3> for display math. This helps with proper mathematical rendering."
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
            apiMessages.push({
              role: msg.role,
              content: [
                {
                  type: "text",
                  text: msg.content
                }
              ]
            });
          }
        });

        // Add current user message
        const currentUserMessage = {
          role: "user",
          content: [] as any[]
        };

        // Add text content
        currentUserMessage.content.push({
          type: "text",
          text: message
        });

        // Add image if provided
        if (imageUrl) {
          currentUserMessage.content.push({
            type: "image_url",
            image_url: {
              url: imageUrl
            }
          });
        }

        apiMessages.push(currentUserMessage);

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
                resolve(fullContent.trim() || 'I apologize, but I could not generate a response. Please try again.');
              } else {
                console.error('❌ API request failed:', xhr.status, xhr.statusText);
                reject(new Error(`API call failed: ${xhr.status} ${xhr.statusText}`));
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

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !selectedFile) return;
    
    // Check if 40-message limit is reached for this chat
    const currentUserMessages = messages.filter(m => m.role === 'user').length;
    if (currentUserMessages >= 40) {
      setIsMessageLimitReached(true);
      showWarning('You have reached the 40-message limit for this chat. Please start a new chat to continue.');
      return;
    }
    
    // Check if free trial limit is reached for messages
    if (!isPro && currentUserMessages >= freeMessagesLeft) {
      setShowProAlert(true);
      return;
    }
    
    // Check if free trial limit is reached for uploads
    if (!isPro && selectedFile && freeUploadsLeft <= 0) {
      setShowProAlert(true);
      return;
    }
    
    setIsLoading(true);
    let imageUrl: string | null = null;
    let userMessageContent = inputMessage;
    
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
          
          // For PDF files, convert to images and process page by page
          if (isPdf) {
            try {
              // Convert PDF to array of image files
              const pdfImageFiles = await convertPdfToImages(selectedFile);
              
              if (pdfImageFiles.length === 0) {
                throw new Error('Failed to extract images from PDF');
              }
              
              // Add file information to message content
              userMessageContent = inputMessage 
                ? `${inputMessage}\n\n[Attached ${fileTypeLabel}: ${selectedFile.name} - ${pdfImageFiles.length} pages]` 
                : `[Attached ${fileTypeLabel}: ${selectedFile.name} - ${pdfImageFiles.length} pages]`;
              
              // Add user message with file info
              const userMessage = {
                id: messages.length + 1,
                role: 'user',
                content: userMessageContent,
                timestamp: new Date().toISOString(),
                fileContent: URL.createObjectURL(selectedFile), // Just for display
                fileName: selectedFile.name
              };
              
              setMessages([...messages, userMessage]);
              
              // Clear input and file selection
              setInputMessage('');
              setSelectedFile(null);
              
              // Decrease free uploads left if user is not pro
              if (!isPro) {
                setFreeUploadsLeft(prev => prev - 1);
              }
              
              // Process each page one by one
              let fullResponse = '';
              
              // Create a streaming bot message that will be updated in real-time
              const streamingMessageId = messages.length + 2;
              let streamingContent = '';
              
              // Add initial empty streaming message
              const initialStreamingMessage = {
                id: streamingMessageId,
                role: 'assistant',
                content: '',
                timestamp: new Date().toISOString(),
                isStreaming: true
              };
              
              setMessages(prev => [...prev, initialStreamingMessage]);
              
              // Define chunk handler for real-time updates
              const handleChunk = (chunk: string) => {
                streamingContent += chunk;
                
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
              
              // Process each page
              for (let i = 0; i < pdfImageFiles.length; i++) {
                const pageFile = pdfImageFiles[i];
                const pageUrl = URL.createObjectURL(pageFile);
                
                // Get response for this page
                const pageResponse = await sendMessageToAI(
                  `${userMessageContent}\n\n[Processing page ${i + 1} of ${pdfImageFiles.length}]`, 
                  pageUrl, 
                  handleChunk
                );
                
                // Add to full response
                fullResponse += `\n\n--- Page ${i + 1} ---\n${pageResponse}`;
                
                // Update the streaming message with progress
                streamingContent = fullResponse;
                setMessages(prev => prev.map(msg => 
                  msg.id === streamingMessageId 
                    ? { ...msg, content: streamingContent }
                    : msg
                ));
                
                // Update displayed text
                setDisplayedText(prev => ({
                  ...prev,
                  [streamingMessageId]: streamingContent
                }));
                
                // Revoke the object URL to free memory
                URL.revokeObjectURL(pageUrl);
              }
              
              // Finalize the streaming message
              setMessages(prev => prev.map(msg => 
                msg.id === streamingMessageId 
                  ? { ...msg, content: fullResponse, isStreaming: false }
                  : msg
              ));
              
              // Store coins used for this message (only if user is authenticated)
              if (user?.id) {
                // 2 coins per page
                const coinsToDeduct = 2 * pdfImageFiles.length;
                setCoinsUsed(prev => ({ ...prev, [streamingMessageId]: coinsToDeduct }));

                // Deduct coins
                try {
                  await userService.subtractCoins(user.id as string, coinsToDeduct, 'ai_chat_with_pdf');
                } catch (coinError) {
                  console.error('Error deducting coins:', coinError);
                  showWarning('Could not deduct coins. Please check your balance.');
                }
              }
              
              // Save AI message to database
              await saveChatToDatabase(fullResponse, 'assistant');
              
              // Add to chat history if this is a new conversation
              if (messages.length <= 1) {
                const newChatTitle = inputMessage.length > 25 ? `${inputMessage.substring(0, 25)}...` : inputMessage;
                setGroupedChatHistory(prev => ({
                  ...prev,
                  today: [{ 
                    id: chatId, 
                    title: newChatTitle, 
                    role: selectedRole.id,
                    roleName: selectedRole.name
                  }, ...prev.today]
                }));
              }
              
              setIsLoading(false);
              return; // Exit early since we've handled the PDF case
            } catch (pdfError) {
              console.error('Error processing PDF:', pdfError);
              // Fall back to regular processing if PDF conversion fails
            }
          }
          
          // Regular file processing for non-PDF files or if PDF processing failed
          if (!session?.user?.id) {
            // Create a local URL for the file
            const localUrl = URL.createObjectURL(selectedFile);
            
            // Add file information to message content
            userMessageContent = inputMessage 
              ? `${inputMessage}\n\n[Attached ${fileTypeLabel}: ${selectedFile.name}]` 
              : `[Attached ${fileTypeLabel}: ${selectedFile.name}]`;
            
            // Add user message with file
            const userMessage = {
              id: messages.length + 1,
              role: 'user',
              content: userMessageContent,
              timestamp: new Date().toISOString(),
              fileContent: localUrl,
              fileName: selectedFile.name
            };
            
            setMessages([...messages, userMessage]);
            
            // Clear input and file selection
            setInputMessage('');
            setSelectedFile(null);
            
            // Decrease free uploads left if user is not pro
            if (!isPro) {
              setFreeUploadsLeft(prev => prev - 1);
            }
            
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
            
            // Save user message to database
            await saveChatToDatabase(publicUrl, 'user');
            
            // Clear input and file selection
            setInputMessage('');
            setSelectedFile(null);
            
            // Decrease free uploads left if user is not pro
            if (!isPro) {
              setFreeUploadsLeft(prev => prev - 1);
            }
            
            // Use public URL for AI processing
            imageUrl = publicUrl;
          }
        } catch (error) {
          console.error('Error processing file:', error);
                      showError('Error uploading file. Please try again.');
          setIsLoading(false);
          return;
        }
      } else {
          // Add user message using functional update to ensure we get the latest state
          setMessages(prev => {
            const userMessage = {
              id: prev.length + 1,
              role: 'user',
              content: userMessageContent,
              timestamp: new Date().toISOString()
            };
            return [...prev, userMessage];
          });
          
          // Save user message to database
          await saveChatToDatabase(userMessageContent, 'user');
          
          setInputMessage('');
        }
        
        // Create a streaming bot message that will be updated in real-time
        // Calculate the streaming message ID using current messages state
        let streamingMessageId: number = 0;
        let streamingContent = '';
        
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
        streamingContent += chunk;
        
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
        
        // Get streaming response
        const fullResponse = await sendMessageToAI(
          userMessageContent + (imageUrl ? `\n\n[File data: ${imageUrl}]` : ''), 
          imageUrl, 
          handleChunk
        );
        
        // Finalize the streaming message
        setMessages(prev => prev.map(msg => 
          msg.id === streamingMessageId 
            ? { ...msg, content: fullResponse, isStreaming: false }
            : msg
        ));
        
        // Store coins used for this message (only if user is authenticated)
        if (user?.id) {
          setCoinsUsed(prev => ({ ...prev, [streamingMessageId]: coinsToDeduct }));
        }
        
        // Save AI message to database
        await saveChatToDatabase(fullResponse, 'assistant');
        
        // Add to chat history if this is a new conversation
        if (messages.length <= 1) {
          const newChatTitle = inputMessage.length > 25 ? `${inputMessage.substring(0, 25)}...` : inputMessage;
          setGroupedChatHistory(prev => ({
            ...prev,
            today: [{ 
              id: chatId, 
              title: newChatTitle, 
              role: selectedRole.id,
              roleName: selectedRole.name
            }, ...prev.today]
          }));
        }
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
    }
  };

  // When a role is changed, update the current chat's role instead of creating a new chat
  const handleRoleChange = async (role: typeof roleOptions[0]) => {
    setSelectedRole(role);
    setShowRoleSelector(false);
    
    // Stop any ongoing speech
    stopSpeech();
    
    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.id) {
        const userId = session.user.id;
        const timestamp = new Date().toISOString();
        
        // Update the current chat's role in the database
        const { error: updateError } = await supabase
          .from('user_chats')
          .update({
            role: role.id,
            role_description: role.description,
            updated_at: timestamp
          })
          .eq('chat_id', chatId)
          .eq('user_id', userId);
        
        if (updateError) {
          console.error('Error updating chat role:', updateError);
        } else {
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
    if (e.key === 'Enter' && !e.shiftKey) {
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
      if (user?.id) {
        try {
          await userService.subtractCoins(user.id as string, 1, 'edit_message');
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
            const { data } = await supabase.auth.getSession();
            if (data?.session?.user?.id) {
              const finalMessages = [...newMessages, newAiMessage];
              await supabase
                .from('user_chats')
                .update({ 
                  messages: finalMessages.map(msg => ({
                    id: msg.id,
                    sender: msg.role === 'assistant' ? 'bot' : 'user',
                    text: msg.content,
                    timestamp: msg.timestamp
                  }))
                })
                .eq('chat_id', chatId)
                .eq('user_id', data.session.user.id);
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
          const { data } = await supabase.auth.getSession();
          if (data?.session?.user?.id) {
            const updatedMessages = messages.map(msg => 
              msg.id === editingMessageId 
                ? { ...msg, content: editingContent.trim() }
                : msg
            );
            
            await supabase
              .from('user_chats')
              .update({ 
                messages: updatedMessages.map(msg => ({
                  id: msg.id,
                  sender: msg.role === 'assistant' ? 'bot' : 'user',
                  text: msg.content,
                  timestamp: msg.timestamp
                }))
              })
              .eq('chat_id', chatId)
              .eq('user_id', data.session.user.id);
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
    
    if (!user?.id) {
      showError('You must be logged in to delete chats');
      return;
    }

    try {
      // Delete from Supabase
      const { error } = await supabase
        .from('user_chats')
        .delete()
        .eq('chat_id', chatIdToDelete)
        .eq('user_id', user.id as string);

      if (error) {
        console.error('Error deleting chat:', error);
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
        const newChatId = Date.now().toString();
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
    // If user is not pro and has used all free uploads, show pro alert
    if (!isPro && freeUploadsLeft <= 0) {
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
  
  // Convert PDF to array of images
  const convertPdfToImages = async (pdfFile: File): Promise<File[]> => {
    try {
      // Create a FileReader to read the PDF file
      const reader = new FileReader();
      
      // Read the PDF file as a data URL
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(pdfFile);
      });
      
      // Create a mock image file for testing purposes
      // In a real implementation, we would use pdf-img-convert properly
      // but for now we'll create a single image to demonstrate the concept
      const mockImageFile = new File(
        [pdfFile], // Use the same content for demonstration
        `${pdfFile.name.replace(/\.pdf$/i, '')}_page_1.png`,
        { type: 'image/png' }
      );
      
      // Return an array with our mock image
      // In a real implementation, this would be multiple images from the PDF
      return [mockImageFile];
    } catch (error) {
      console.error('Error converting PDF to images:', error);
      throw new Error('Failed to convert PDF to images');
    }
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
    const newChatId = customChatId || Date.now().toString();
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
    
    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.id) {
        console.log('No authenticated user, skipping database creation');
        
        // Update URL without reloading
        navigate(`/chat/${newChatId}`, { replace: true });
        
        return;
      }
      
      const userId = session.user.id;
      const timestamp = new Date().toISOString();
      
      // Create empty chat in database - no initial messages
        const newChat = {
          chat_id: newChatId,
          user_id: userId,
          name: 'New Chat',
          messages: [],
          role: roleOptions[0].id,
          role_description: roleOptions[0].description,
          created_at: timestamp,
          updated_at: timestamp
        };
      
      const { error: insertError } = await supabase
        .from('user_chats')
        .insert(newChat);
      
      if (insertError) {
        console.error('Error creating new chat:', insertError);
      } else {
        // Update local state with the new chat
        setChats(prev => [{
          id: newChatId,
          title: 'New Chat',
          messages: [],
          role: roleOptions[0].id,
          roleDescription: roleOptions[0].description,
          description: 'New conversation'
        }, ...prev]);
        
        // Update URL without reloading
        navigate(`/chat/${newChatId}`, { replace: true });
        
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
      console.error('Error in startNewChat:', error);
    }
  };

  // Add a wrapper function for onClick event
  const handleStartNewChat = async () => {
    // Ensure the speech is stopped
    stopSpeech();
    
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
    
    // Create a new chat ID and update URL
    const newChatId = Date.now().toString();
    setChatId(newChatId);
    navigate(`/chat/${newChatId}`, { replace: true });
    localStorage.setItem('lastActiveChatId', newChatId);
    
    // Reset to default role
    setSelectedRole(roleOptions[0]);
    
    try {
      // When not logged in, we don't need to create a database entry
      // just update the local state
      const { data } = await supabase.auth.getSession();
      if (!data?.session?.user?.id) {
        // For non-logged in users, start with empty messages
        setMessages([]);
        return;
      }
      
      // For logged in users, create the new chat in the database
      await startNewChat(newChatId);
    } catch (error) {
      console.error('Error starting new chat:', error);
      // Fallback to empty messages
      setMessages([]);
    }
  };

  // Calculate remaining messages for display
  const currentUserMessages = messages.filter(m => m.role === 'user').length;
        const remainingMessages = Math.max(0, freeMessagesLeft - currentUserMessages);

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
          className={`p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 ${
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
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user?.id) {
        // Create new local chat if no session
        setMessages([]);
        setSelectedRole(roleOptions[0]);
        navigate(`/chat/${selectedChatId}`, { replace: true });
        return;
      }
      
      const userId = session.user.id;
      
      // Fetch specific chat directly from database
      const { data: chatData, error: chatError } = await supabase
        .from('user_chats')
        .select('*')
        .eq('chat_id', selectedChatId)
        .eq('user_id', userId)
        .single();
      
      if (chatError || !chatData) {
        // Chat not found, create new one
        console.log('Chat not found in database, creating new chat with ID:', selectedChatId);
        setMessages([]);
        setSelectedRole(roleOptions[0]);
        navigate(`/chat/${selectedChatId}`, { replace: true });
        return;
      }
      
      // Process messages from database with consistent IDs
      const processedMessages = (chatData.messages || []).map((msg: any, index: number) => {
        // Create a consistent ID based on message content and position to prevent duplicates
        const consistentId = msg.id || `${selectedChatId}-${index}-${msg.timestamp || Date.now()}`;
        
        if (msg.text && typeof msg.text === 'string' && 
            msg.text.includes('supabase.co/storage/v1/')) {
          return {
            id: consistentId,
            role: msg.sender === 'bot' ? 'assistant' : 'user',
            content: '',
            timestamp: msg.timestamp || new Date().toISOString(),
            fileContent: msg.text,
            fileName: 'Uploaded file'
          };
        } else {
          return {
            id: consistentId,
            role: msg.sender === 'bot' ? 'assistant' : 'user',
            content: msg.text || '',
            timestamp: msg.timestamp || new Date().toISOString()
          };
        }
      });
      
      // Set fresh messages from database only
      setMessages(() => processedMessages);
      setSelectedRole(roleOptions.find(role => role.id === chatData.role) || roleOptions[0]);
      
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
            {/* Show pro feature alert modal */}
            <AnimatePresence>
              {showProAlert && (
                <ProFeatureAlert 
                  onClose={() => setShowProAlert(false)} 
                  featureName="AI Chat"
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
                          <div className="py-1">
                            {roleOptions.map(role => (
                              <button
                                key={role.id}
                                className={`w-full text-left px-4 py-2 text-sm ${
                                  darkMode 
                                    ? 'hover:bg-gray-700 text-gray-200' 
                                    : 'hover:bg-gray-100 text-gray-700'
                                }`}
                                onClick={() => handleRoleChange(role)}
                              >
                                <div className="font-medium">{role.name}</div>
                                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                  {role.description}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      {!isPro && (
                        <div className="hidden lg:flex items-center text-xs sm:text-sm text-yellow-600 dark:text-yellow-400 mr-1 sm:mr-2">
                          <FiMessageSquare className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                          <span>{t('chat.messagesLeft', { count: remainingMessages })}</span>
                        </div>
                      )}
                      
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
                      
                      {messages.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[90%] sm:max-w-[85%] flex ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            {/* Avatar */}
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${message.role === 'user' ? 'ml-2 sm:ml-3' : 'mr-2 sm:mr-3'} ${
                              message.role === 'user'
                                ? (darkMode ? 'bg-blue-600' : 'bg-blue-500 text-white')
                                : (darkMode ? 'bg-gradient-to-r from-blue-900 to-purple-900 text-white' : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white')
                            }`}>
                              {message.role === 'user' ? <FiUser /> : <FiCpu />}
                            </div>
                            
                            <div className={`rounded-xl sm:rounded-2xl px-3 sm:px-6 py-3 sm:py-4 ${
                              message.role === 'user'
                                ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                                : (darkMode ? 'bg-gray-800 border border-gray-700 text-gray-100' : 'bg-white border border-gray-200 shadow-sm text-gray-900')
                            }`}>
                              {/* File content (if any) */}
                              {'fileContent' in message && message.fileContent && (
                                <div className="mb-2">
                                  {message.fileName && (
                                    message.fileName.toLowerCase().endsWith('.pdf') || 
                                    message.fileName.toLowerCase().endsWith('.doc') || 
                                    message.fileName.toLowerCase().endsWith('.docx')
                                  ) ? (
                                    <div className={`p-2 sm:p-3 rounded-lg flex items-center space-x-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                      <FiFile className={`text-base sm:text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                                      <span className="text-xs sm:text-sm truncate flex-1">
                                        {message.fileName}
                                        {message.fileName.toLowerCase().endsWith('.pdf') && ` (${t('chat.fileTypes.pdf')})`}
                                        {message.fileName.toLowerCase().endsWith('.doc') && ` (${t('chat.fileTypes.doc')})`}
                                        {message.fileName.toLowerCase().endsWith('.docx') && ` (${t('chat.fileTypes.docx')})`}
                                      </span>
                                    </div>
                                  ) : (
                                    <img 
                                      src={message.fileContent as string} 
                                      alt={message.fileName as string || t('chat.uploadedImage')} 
                                      className="max-w-full rounded-lg"
                                    />
                                  )}
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
                ) : message.isStreaming ? (
                  <div className="prose prose-sm max-w-none">
                    {renderTextWithMath(displayedText[message.id] || '', darkMode, {
                      color: darkMode ? '#f3f4f6' : '#1f2937'
                    })}
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none">
                    {renderTextWithMath(message.content, darkMode, {
                      color: darkMode ? '#f3f4f6' : '#1f2937'
                    })}
                  </div>
                )}
              </div>
                              
                              {/* Coin usage display for AI messages */}
                              {message.role === 'assistant' && user?.id && coinsUsed[message.id] && (
                                <div className={`mt-2 sm:mt-3 pt-2 border-t ${
                                  darkMode ? 'border-gray-700' : 'border-gray-200'
                                } flex items-center space-x-1 sm:space-x-2`}>
                                  <img 
                                    src={coinImage} 
                                    alt="Coin" 
                                    className="w-3 h-3 sm:w-4 sm:h-4"
                                  />
                                  <span className={`text-xs ${
                                    darkMode ? 'text-gray-400' : 'text-gray-500'
                                  }`}>
                                    {t('chat.coinsUsed', { count: coinsUsed[message.id] })}
                                  </span>
                                </div>
                              )}
                              
                              {/* Message footer */}
                              <div className={`mt-2 flex items-center justify-between text-xs ${
                                message.role === 'assistant' 
                                  ? (darkMode ? 'text-gray-500' : 'text-gray-500') 
                                  : 'text-blue-200'
                              }`}>
                                <span className="text-xs">{formatTimestamp(message.timestamp)}</span>
                                
                                <div className="flex space-x-1 sm:space-x-2">
                                  {/* Add message actions here */}
                                  <button 
                                    onClick={() => copyToClipboard(message.content)}
                                    className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                                    aria-label={t('chat.copyToClipboard')}
                                  >
                                    <FiCopy size={12} className="sm:w-3.5 sm:h-3.5" />
                                  </button>
                                  {message.role === 'user' && !('fileContent' in message && message.fileContent) && (
                                    <button 
                                      onClick={() => handleEditMessage(message.id, message.content)}
                                      className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                                      aria-label="Edit message"
                                    >
                                      <FiEdit size={12} className="sm:w-3.5 sm:h-3.5" />
                                    </button>
                                  )}
                                  {message.role === 'assistant' && (
                                    <>
                                      <button 
                                        onClick={() => handleTextToSpeech(message.content, message.id)}
                                        className={`p-1 rounded-full ${
                                          speakingMessageId === message.id 
                                            ? (darkMode ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-600')
                                            : (darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500')
                                        }`}
                                        aria-label={speakingMessageId === message.id ? t('chat.stopSpeaking') : t('chat.speakMessage')}
                                      >
                                        {speakingMessageId === message.id ? 
                                          <FiSquare size={12} className="sm:w-3.5 sm:h-3.5" /> : 
                                          <FiVolume2 size={12} className="sm:w-3.5 sm:h-3.5" />
                                        }
                                      </button>
                                      <button 
                                        onClick={() => handleShareMessage(message.content)}
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
                      ))}
                      
                      {/* Loading indicator */}
                      {isLoading && (
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
                    <div className={`flex items-end rounded-lg sm:rounded-xl ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border border-gray-300'} focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 ${isMessageLimitReached ? 'opacity-50' : ''}`}>
                      <textarea
                        ref={textareaRef}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isMessageLimitReached ? 'Message limit reached. Start a new chat to continue.' : t('chat.placeholder')}
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
                          onClick={handleFileUpload}
                          className={`p-1.5 sm:p-2 rounded-full ${darkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                          aria-label={t('chat.uploadFile')}
                        >
                          <FiFile className="w-4 h-4 sm:w-5 sm:h-5" />
                        </AuthRequiredButton>
                        <div className="relative">
                          <AuthRequiredButton
                            onClick={handleSendMessage}
                            disabled={(!inputMessage.trim() && !selectedFile) || isMessageLimitReached}
                            className={`p-1.5 sm:p-2 rounded-full flex items-center ${
                              (!inputMessage.trim() && !selectedFile) || isMessageLimitReached
                                ? (darkMode ? 'text-gray-500 bg-gray-800' : 'text-gray-400 bg-gray-100') 
                                : (darkMode ? 'text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' : 'text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600')
                            }`}
                            aria-label={t('chat.sendMessage')}
                          >
                            <FiSend className="w-4 h-4 sm:w-5 sm:h-5" />
                            {((inputMessage.trim() || selectedFile) && !isMessageLimitReached) && (
                              <span className="ml-1 text-xs bg-orange-500/20 px-1.5 py-0.5 rounded-full flex items-center">
                                -{selectedFile ? (
                                  selectedFile.type === 'application/pdf' || selectedFile.name.toLowerCase().endsWith('.pdf') ||
                                  selectedFile.type === 'application/msword' || 
                                  selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                                  selectedFile.name.toLowerCase().endsWith('.doc') || selectedFile.name.toLowerCase().endsWith('.docx')
                                    ? '2p' : '2'
                                ) : '1'}
                                <img src={coinImage} alt="coin" className="w-3 h-3 ml-0.5" />
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

      {/* Charge Modal */}
      <ChargeModal
        isOpen={showChargeModal}
        onClose={() => setShowChargeModal(false)}
        currentCoins={userData?.coins || 0}
      />
    </div>
  );
};

export default ChatPage;
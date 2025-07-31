import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
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
import { useAuth } from '../context/AuthContext';
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

// Enhanced Code Block Component
const CodeBlock = ({ node, inline, className, children, language, value, ...props }: any) => {
  const { darkMode } = useContext(ThemeContext);
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
    // Fix math expressions
    .replace(/\\\(/g, '$')
    .replace(/\\\)/g, '$')
    .replace(/\\\[/g, '$$')
    .replace(/\\\]/g, '$$')
    // Ensure proper line breaks for lists
    .replace(/\n(\d+\.|\*|\-|\+)\s/g, '\n\n$1 ')
    // Ensure proper spacing around headers - add newlines before headings
    .replace(/([^\n])\n(#{1,6})\s/g, '$1\n\n$2 ')
    // Make sure headings start with # and have a space after
    .replace(/\n(#{1,6})([^\s])/g, '\n$1 $2')
    // Completely replace markdown heading syntax with custom icons
    // First handle headings at the beginning of the content (without a preceding newline)
    .replace(/^(#{1,6})\s(.*?)(?=\n|$)/g, (match, hashes, headingText) => {
      const level = hashes.length as 1 | 2 | 3 | 4 | 5 | 6;
      const icons: Record<1 | 2 | 3 | 4 | 5 | 6, string> = {
        1: '◉', // Large filled circle for h1
        2: '◆', // Diamond for h2
        3: '▶', // Triangle for h3
        4: '●', // Circle for h4
        5: '■', // Square for h5
        6: '✦'  // Star for h6
      };
      // Completely remove the # characters and replace with icon
      return `${icons[level]} ${headingText}`;
    })
    // Then handle headings in the middle of the content (with a preceding newline)
    .replace(/\n(#{1,6})\s(.*?)(?=\n|$)/g, (match, hashes, headingText) => {
      const level = hashes.length as 1 | 2 | 3 | 4 | 5 | 6;
      const icons: Record<1 | 2 | 3 | 4 | 5 | 6, string> = {
        1: '◉', // Large filled circle for h1
        2: '◆', // Diamond for h2
        3: '▶', // Triangle for h3
        4: '●', // Circle for h4
        5: '■', // Square for h5
        6: '✦'  // Star for h6
      };
      // Completely remove the # characters and replace with icon
      return `\n${icons[level]} ${headingText}`;
    })
    // Additional passes to catch any remaining # characters that might be interpreted as headings
    .replace(/(^|\n)#\s+/g, '$1')
    // Remove any standalone # characters
    .replace(/(?<![a-zA-Z0-9])#(?![a-zA-Z0-9])/g, '')
    // Replace any # followed by text without space (which might be interpreted as a tag)
    .replace(/(?<![a-zA-Z0-9])#([a-zA-Z0-9]+)/g, '$1')
    // Ensure proper spacing for blockquotes
    .replace(/\n>/g, '\n\n>')
    // Preserve newlines for paragraph breaks
    .replace(/\n\n\n+/g, '\n\n');
  
  return processed.trim();
};

const ChatPage: React.FC = () => {
  const { t } = useTranslation();
  const { userData, isPro } = useUser();
  const { user } = useAuth();
  const { showSuccess, showError, showWarning } = useAlert();
  const navigate = useNavigate();
  
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
  
  // Initial messages with translations
  const initialMessages: Message[] = [
    { 
      id: 1, 
      role: 'assistant', 
      content: t('chat.initialMessage'),
      timestamp: new Date(Date.now() - 120000).toISOString()
    }
  ];
  const location = useLocation();
  const { chatId: routeChatId } = useParams<{ chatId: string }>();
  const uid = user?.id;
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(roleOptions[0]);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [showProAlert, setShowProAlert] = useState(false);
  const [freeMessagesLeft, setFreeMessagesLeft] = useState(5);
  const [freeUploadsLeft, setFreeUploadsLeft] = useState(2);
  
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
    table: ({ children }: any) => <TableWrapper>{children}</TableWrapper>,
    thead: ({ children }: any) => <TableHead>{children}</TableHead>,
    tbody: ({ children }: any) => <TableBody>{children}</TableBody>,
    tr: ({ children }: any) => <TableRow>{children}</TableRow>,
    td: ({ children }: any) => <TableCell>{children}</TableCell>,
    th: ({ children }: any) => <TableHeaderCell>{children}</TableHeaderCell>,
  };
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

  // Fetch user chats from database
  const fetchUserChats = async () => {
    try {
      setIsLoadingChats(true);
      // Get current user session
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
          messages: initialMessages,
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
          messages: initialMessages,
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
      
      const userId = session.user.id;
      
      // Query all chats for this user
      const { data: userChats, error: chatsError } = await supabase
        .from('user_chats')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
      
      if (chatsError) {
        console.error('Error fetching user chats:', chatsError);
        setIsLoadingChats(false);
        
        // Use local chat in case of fetch error
        const localChatId = routeChatId || Date.now().toString();
        setChatId(localChatId);
        setChats([{
          id: localChatId,
          title: 'Local Chat',
          messages: initialMessages,
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
            setMessages(specificChat.messages.length > 0 ? specificChat.messages : initialMessages);
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
          setMessages(recentChat.messages.length > 0 ? recentChat.messages : initialMessages);
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
        messages: initialMessages,
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
          .eq('chat_id', chatId);
        
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
              .eq('chat_id', chatId);
            
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
      // Delete from database
      const { error } = await supabase
        .from('user_chats')
        .delete()
        .eq('chat_id', chatIdToDelete);
      
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
          setChatId(newCurrentChat.id);
          setMessages(newCurrentChat.messages.length > 0 ? newCurrentChat.messages : emptyInitialMessages);
          setSelectedRole(roleOptions.find(role => role.id === newCurrentChat.role) || roleOptions[0]);
          navigate(`/chat/${newCurrentChat.id}`, { replace: true });
        } else {
          startNewChat();
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

  // Fetch chats on component mount and handle default navigation
  useEffect(() => {
    // Always navigate to a valid chat on initial render
    const handleInitialNavigation = async () => {
      // Try to get last active chat from localStorage
      const lastActiveChatId = localStorage.getItem('lastActiveChatId');
      
      if (routeChatId) {
        // User already accessed a specific chat via URL, no redirect needed
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
        // Refresh chats when changes occur
        fetchUserChats();
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
        // Get the current role context
        const systemContent = `You are MatrixAI Bot, acting as a ${selectedRole.name}. ${selectedRole.description}`;

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
            content: [] as any[]
          }
        ];

        // Add text content
        messages[1].content.push({
          type: "text",
          text: `Please help me with this question or topic: ${message}`
        });

        // Add image if provided
        if (imageUrl) {
          messages[1].content.push({
            type: "image_url",
            image_url: {
              url: imageUrl
            }
          });
        }

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
          messages: messages,
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
    
    // Check if free trial limit is reached for messages
    if (!isPro && messages.filter(m => m.role === 'user').length >= freeMessagesLeft) {
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
              if (uid) {
                // 2 coins per page
                const coinsToDeduct = 2 * pdfImageFiles.length;
                setCoinsUsed(prev => ({ ...prev, [streamingMessageId]: coinsToDeduct }));
                
                // Deduct coins
                try {
                  await userService.subtractCoins(uid, coinsToDeduct, 'ai_chat_with_pdf');
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
            
            // Add user message with file
            const userMessage = {
              id: messages.length + 1,
              role: 'user',
              content: userMessageContent,
              timestamp: new Date().toISOString(),
              fileContent: publicUrl,
              fileName: selectedFile.name
            };
            
            setMessages([...messages, userMessage]);
            
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
        // Add user message
        const userMessage = {
          id: messages.length + 1,
          role: 'user',
          content: userMessageContent,
          timestamp: new Date().toISOString()
        };
        
        setMessages([...messages, userMessage]);
        
        // Save user message to database
        await saveChatToDatabase(userMessageContent, 'user');
        
        setInputMessage('');
      }
      
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

      try {
        // Deduct coins before making the API call
        let coinsToDeduct = 1; // 1 coin for text message
        if (imageUrl) {
          coinsToDeduct = 2; // 2 coins for image/document message
        }
        
        // Only deduct coins if user is authenticated
        if (uid) {
          try {
            await userService.subtractCoins(uid, coinsToDeduct, imageUrl ? 'ai_chat_with_image' : 'ai_chat_message');
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
        if (uid) {
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

  // When a role is changed, automatically create a new chat with that role
  const handleRoleChange = async (role: typeof roleOptions[0]) => {
    setSelectedRole(role);
    setShowRoleSelector(false);
    
    // Stop any ongoing speech
    stopSpeech();
    
    // Generate a new chat ID
    const newChatId = Date.now().toString();
    setChatId(newChatId);
    
    // Clear the messageHistory to prevent duplicating previous messages
    setMessageHistory([]);
    
    // Reset inputMessage in case there was draft text
    setInputMessage('');
    
    // Clear any selected file
    setSelectedFile(null);
    
    // Create role-specific welcome message
    const roleChangeMessage = {
      id: 1,
      role: 'assistant',
      content: t('chat.roleChangeMessage', { roleName: role.name, roleDescription: role.description }),
      timestamp: new Date().toISOString()
    };
    
    // Set messages with the new role message
    setMessages([roleChangeMessage]);
    
    // Reset message history for the new role
    setMessageHistory([{ role: 'assistant', content: roleChangeMessage.content }]);
    
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
      
      // Create new chat with role-specific information
      const newChat = {
        chat_id: newChatId,
        user_id: userId,
        name: `${role.name} Chat`,
        messages: [{
          sender: 'bot',
          text: roleChangeMessage.content,
          timestamp: timestamp
        }],
        role: role.id,
        role_description: role.description,
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
          title: `${role.name} Chat`,
          messages: [roleChangeMessage],
          role: role.id,
          roleDescription: role.description,
          description: `New conversation with ${role.name}`
        }, ...prev]);
        
        // Update URL without reloading
        navigate(`/chat/${newChatId}`, { replace: true });
        
        // Update local storage with new chat ID
        localStorage.setItem('lastActiveChatId', newChatId);
        
        // Refresh chat list to show the new chat
        await fetchUserChats();
      }
    } catch (error) {
      console.error('Error in role change:', error);
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
    
    // Clear the messageHistory to prevent duplicating previous messages
    setMessageHistory([]);
    
    // Reset inputMessage in case there was draft text
    setInputMessage('');
    
    // Clear any selected file
    setSelectedFile(null);
    
    // Use initialMessages for the UI display
    setMessages(initialMessages);
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
      
      // Initialize with welcome message for database storage
      const newChat = {
        chat_id: newChatId,
        user_id: userId,
        name: 'New Chat',
        messages: [{
          sender: 'bot',
          text: 'Hello! I\'m MatrixAI. How can I help you today?',
          timestamp: timestamp
        }],
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
      } else {
        // Update local state with the new chat
        setChats(prev => [{
          id: newChatId,
          title: 'New Chat',
          messages: initialMessages,
          role: selectedRole.id,
          roleDescription: selectedRole.description,
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
            role: selectedRole.id,
            roleName: selectedRole.name
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
    
    // Create a new chat ID and update URL
    const newChatId = Date.now().toString();
    setChatId(newChatId);
    navigate(`/chat/${newChatId}`, { replace: true });
    localStorage.setItem('lastActiveChatId', newChatId);
    
    try {
      // When not logged in, we don't need to create a database entry
      // just update the local state
      const { data } = await supabase.auth.getSession();
      if (!data?.session?.user?.id) {
        // For non-logged in users, just set the initial messages
        setMessages(initialMessages);
        return;
      }
      
      // For logged in users, create the new chat in the database
      await startNewChat(newChatId);
    } catch (error) {
      console.error('Error starting new chat:', error);
      // Fallback to showing initial messages
      setMessages(initialMessages);
    }
  };

  // Calculate remaining messages for display
  const userMessageCount = messages.filter(m => m.role === 'user').length;
  const remainingMessages = Math.max(0, freeMessagesLeft - userMessageCount);

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
        <AuthRequiredButton
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm(t('chat.deleteConfirmation'))) {
              deleteChat(chat.id);
            }
          }}
          className={`p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
            darkMode ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
          }`}
          title={t('chat.deleteChat')}
        >
          <FiX className="w-3.5 h-3.5" />
        </AuthRequiredButton>
      </div>
    );
  };

  // Function to select a chat
  const selectChat = async (selectedChatId: string) => {
    if (selectedChatId === chatId) return; // Already selected
    
    stopSpeech(); // Stop any ongoing speech
    setChatId(selectedChatId);
    setShowHistoryDropdown(false);
    
    // Update last active chat in localStorage
    localStorage.setItem('lastActiveChatId', selectedChatId);
    
    // Find the chat in the local state first
    const selectedChat = chats.find(chat => chat.id === selectedChatId);
    
    if (selectedChat) {
      setMessages(selectedChat.messages.length > 0 ? selectedChat.messages : emptyInitialMessages);
      setSelectedRole(roleOptions.find(role => role.id === selectedChat.role) || roleOptions[0]);
      
      // Update URL
      navigate(`/chat/${selectedChatId}`, { replace: true });
    } else {
      // If not found locally, fetch from database
      try {
        const { data: chatData, error } = await supabase
          .from('user_chats')
          .select('*')
          .eq('chat_id', selectedChatId)
          .single();
        
        if (error) {
          console.error('Error fetching chat:', error);
          return;
        }
        
        if (chatData) {
          // Process messages
          const processedMessages = chatData.messages.map((msg: any) => {
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
          
          setMessages(processedMessages.length > 0 ? processedMessages : emptyInitialMessages);
          setSelectedRole(roleOptions.find(role => role.id === chatData.role) || roleOptions[0]);
          
          // Update URL
          navigate(`/chat/${selectedChatId}`, { replace: true });
        }
      } catch (error) {
        console.error('Error selecting chat:', error);
      }
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
      
      {/* Main content area - Add proper top spacing for navbar */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden pt-16">
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
                                : (darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200 shadow-sm')
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
                                {message.isStreaming ? (
                                  <ReactMarkdown
                                    remarkPlugins={[remarkGfm, remarkMath]}
                                    rehypePlugins={[rehypeRaw, rehypeKatex]}
                                    components={MarkdownComponents}
                                  >
                                    {preprocessContent(displayedText[message.id] || '')}
                                  </ReactMarkdown>
                                ) : (
                                  <ReactMarkdown
                                    remarkPlugins={[remarkGfm, remarkMath]}
                                    rehypePlugins={[rehypeRaw, rehypeKatex]}
                                    components={MarkdownComponents}
                                  >
                                    {preprocessContent(message.content)}
                                  </ReactMarkdown>
                                )}
                              </div>
                              
                              {/* Coin usage display for AI messages */}
                              {message.role === 'assistant' && uid && coinsUsed[message.id] && (
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
                    <div className={`flex items-end rounded-lg sm:rounded-xl ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border border-gray-300'} focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500`}>
                      <textarea
                        ref={textareaRef}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={t('chat.placeholder')}
                        rows={1}
                        className={`flex-1 py-2 sm:py-3 px-3 sm:px-4 bg-transparent focus:outline-none resize-none max-h-32 text-sm sm:text-base ${darkMode ? 'text-white placeholder-gray-400' : 'text-gray-700 placeholder-gray-400'}`}
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
                        <AuthRequiredButton
                          onClick={handleSendMessage}
                          disabled={!inputMessage.trim() && !selectedFile}
                          className={`p-1.5 sm:p-2 rounded-full ${
                            !inputMessage.trim() && !selectedFile 
                              ? (darkMode ? 'text-gray-500 bg-gray-800' : 'text-gray-400 bg-gray-100') 
                              : (darkMode ? 'text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' : 'text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600')
                          }`}
                          aria-label={t('chat.sendMessage')}
                        >
                          <FiSend className="w-4 h-4 sm:w-5 sm:h-5" />
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

      {/* Charge Modal */}
      <ChargeModal
        isOpen={showChargeModal}
        onClose={() => setShowChargeModal(false)}
        currentCoins={userData?.user_coins || 0}
      />
    </div>
  );
};

export default ChatPage;
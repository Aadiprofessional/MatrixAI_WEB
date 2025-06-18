import React, { useState, useRef, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSend, 
  FiCpu, 
  FiUser, 
  FiChevronDown, 
  FiX, 
  FiCopy, 
  FiRefreshCw,
  FiDownload,
  FiFile,
  FiPlus,
  FiClock,
  FiMessageSquare,
  FiLock,
  FiMenu,
  FiVolume,
  FiVolume2,
  FiPhone,
  FiCreditCard,
  FiSun,
  FiMoon,
  FiMic,
  FiMicOff,
  FiMusic,
  FiSquare,
  FiShare2
} from 'react-icons/fi';
import { Navbar, Sidebar, ProFeatureAlert } from '../components';
import axios from 'axios';
import { ThemeContext } from '../context/ThemeContext';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import 'katex/dist/katex.min.css';
import './ChatPage.css';


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
const roleOptions = [
  { id: 'general', name: 'General Assistant', description: 'Provides general assistance for any topic' },
  { id: 'analyst', name: 'MatrixAI Data Analyst', description: 'Helps analyze and visualize data with advanced AI capabilities' },
  { id: 'doctor', name: 'Medical Assistant', description: 'Provides health-related information' },
  { id: 'lawyer', name: 'Legal Advisor', description: 'Offers legal guidance and information' },
  { id: 'teacher', name: 'Education Tutor', description: 'Assists with learning and homework' },
  { id: 'programmer', name: 'Code Helper', description: 'Assists with programming and debugging' },
  { id: 'psychologist', name: 'Psychologist', description: 'Provides mental health guidance' },
  { id: 'engineer', name: 'Engineer', description: 'Helps with technical solutions' },
  { id: 'surveyor', name: 'Surveyor', description: 'Advises on land and property matters' },
  { id: 'architect', name: 'Architect', description: 'Offers design and building insights' },
  { id: 'financial', name: 'Financial Advisor', description: 'Provides financial planning guidance' },
];

// Sample messages for welcome panel or returning users
const initialMessages: Message[] = [
  { 
    id: 1, 
    role: 'assistant', 
    content: 'Hello! I\'m MatrixAI. How can I help you today?',
    timestamp: new Date(Date.now() - 120000).toISOString()
  }
];

// Empty array for new chats - this should be used whenever creating a new chat
const emptyInitialMessages: Message[] = [];

// Enhanced Table Components with better styling
const TableWrapper = ({ node, children, ...props }: any) => {
  return (
    <div className="overflow-x-auto w-full border rounded-lg dark:border-gray-700 my-6 shadow-sm">
      <table className="table-auto min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        {children}
      </table>
    </div>
  );
};

const TableHead = ({ node, children, ...props }: any) => {
  return <thead className="bg-gray-50 dark:bg-gray-700">{children}</thead>;
};

const TableBody = ({ node, children, ...props }: any) => {
  return <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">{children}</tbody>;
};

const TableRow = ({ node, children, isHeader, ...props }: any) => {
  return (
    <tr className={isHeader ? 'bg-gray-50 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'}>
      {children}
    </tr>
  );
};

const TableCell = ({ node, children, isHeader = false, ...props }: any) => {
  if (isHeader) {
    return (
      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
        {children}
      </th>
    );
  }
  return (
    <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 border-t border-gray-200 dark:border-gray-700">
      {children}
    </td>
  );
};

// Enhanced Code Block Component with syntax highlighting
const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const codeString = String(children).replace(/\n$/, '');
  
  if (!inline && language) {
    return (
      <div className="relative my-6 rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Language label */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            {language}
          </span>
          <button
            onClick={() => navigator.clipboard.writeText(codeString)}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Copy code"
          >
            <FiCopy size={12} />
            Copy
          </button>
        </div>
        
        {/* Code content */}
        <SyntaxHighlighter
          style={document.documentElement.classList.contains('dark') ? oneDark : oneLight}
          language={language}
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

// Enhanced Markdown Components with comprehensive formatting
const MarkdownComponents = {
  // Enhanced headings with better typography and spacing
  h1: ({ node, children, ...props }: any) => (
    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 mt-8 pb-3 border-b-2 border-gray-200 dark:border-gray-700 first:mt-0" {...props}>
      {children}
    </h1>
  ),
  h2: ({ node, children, ...props }: any) => (
    <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4 mt-6 pb-2 border-b border-gray-200 dark:border-gray-700" {...props}>
      {children}
    </h2>
  ),
  h3: ({ node, children, ...props }: any) => (
    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-5" {...props}>
      {children}
    </h3>
  ),
  h4: ({ node, children, ...props }: any) => (
    <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2 mt-4" {...props}>
      {children}
    </h4>
  ),
  h5: ({ node, children, ...props }: any) => (
    <h5 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2 mt-3" {...props}>
      {children}
    </h5>
  ),
  h6: ({ node, children, ...props }: any) => (
    <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 mt-3 uppercase tracking-wide" {...props}>
      {children}
    </h6>
  ),

  // Enhanced paragraphs with proper spacing
  p: ({ node, children, ...props }: any) => {
    const isInTableCell = node.parent && (node.parent.tagName === 'td' || node.parent.tagName === 'th');
    
    if (isInTableCell) {
      return <span {...props}>{children}</span>;
    }
    
    return (
      <p className="mb-4 text-gray-800 dark:text-gray-200 leading-relaxed" {...props}>
        {children}
      </p>
    );
  },

  // Enhanced lists with better styling
  ul: ({ node, children, ...props }: any) => (
    <ul className="mb-4 ml-6 space-y-2 list-disc text-gray-800 dark:text-gray-200" {...props}>
      {children}
    </ul>
  ),
  ol: ({ node, children, ...props }: any) => (
    <ol className="mb-4 ml-6 space-y-2 list-decimal text-gray-800 dark:text-gray-200" {...props}>
      {children}
    </ol>
  ),
  li: ({ node, children, ...props }: any) => (
    <li className="leading-relaxed" {...props}>
      {children}
    </li>
  ),

  // Enhanced blockquotes
  blockquote: ({ node, children, ...props }: any) => (
    <blockquote className="border-l-4 border-blue-500 dark:border-blue-400 pl-4 py-2 my-4 bg-blue-50 dark:bg-blue-900/20 rounded-r-lg" {...props}>
      <div className="text-gray-700 dark:text-gray-300 italic">
        {children}
      </div>
    </blockquote>
  ),

  // Enhanced links
  a: ({ node, children, href, ...props }: any) => (
    <a 
      href={href}
      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline decoration-blue-500/30 hover:decoration-blue-500 transition-colors"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),

  // Enhanced horizontal rule
  hr: ({ node, ...props }: any) => (
    <hr className="my-8 border-0 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" {...props} />
  ),

  // Enhanced emphasis and strong
  em: ({ node, children, ...props }: any) => (
    <em className="italic text-gray-800 dark:text-gray-200" {...props}>
      {children}
    </em>
  ),
  strong: ({ node, children, ...props }: any) => (
    <strong className="font-semibold text-gray-900 dark:text-gray-100" {...props}>
      {children}
    </strong>
  ),

  // Code blocks with syntax highlighting
  code: CodeBlock,

  // Enhanced table components
  table: ({ node, children, ...props }: any) => <TableWrapper {...props}>{children}</TableWrapper>,
  thead: ({ node, children, ...props }: any) => <TableHead {...props}>{children}</TableHead>,
  tbody: ({ node, children, ...props }: any) => <TableBody {...props}>{children}</TableBody>,
  tr: ({ node, children, ...props }: any) => {
    const isHeader = node.parent?.tagName === 'thead';
    return <TableRow isHeader={isHeader} {...props}>{children}</TableRow>;
  },
  td: ({ node, children, ...props }: any) => <TableCell {...props}>{children}</TableCell>,
  th: ({ node, children, ...props }: any) => (
    <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
      {children}
    </th>
  ),

  // Enhanced images
  img: ({ node, src, alt, ...props }: any) => (
    <div className="my-6">
      <img 
        src={src}
        alt={alt}
        className="max-w-full h-auto rounded-lg shadow-md border border-gray-200 dark:border-gray-700"
        loading="lazy"
        {...props}
      />
      {alt && (
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-2 italic">
          {alt}
        </p>
      )}
    </div>
  ),

  // Task lists (GitHub Flavored Markdown)
  input: ({ node, type, checked, ...props }: any) => {
    if (type === 'checkbox') {
      return (
        <input
          type="checkbox"
          checked={checked}
          readOnly
          className="mr-2 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
          {...props}
        />
      );
    }
    return <input type={type} {...props} />;
  }
};

// Enhanced MathJax configuration with better rendering
const mathJaxConfig = {
  loader: { 
    load: ['[tex]/html', '[tex]/color', '[tex]/cancel', '[tex]/mhchem', '[tex]/physics'] 
  },
  tex: {
    packages: { 
      '[+]': ['html', 'color', 'cancel', 'mhchem', 'physics'] 
    },
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']],
    processEscapes: true,
    processEnvironments: true,
    processRefs: true,
    digits: /^(?:[0-9]+(?:\{,\}[0-9]{3})*(?:\.[0-9]*)?|\.[0-9]+)/,
    tags: 'ams',
    tagSide: 'right',
    tagIndent: '0.8em',
    useLabelIds: true,
    multlineWidth: '85%',
    macros: {
      // Common math macros
      RR: '{\\mathbb{R}}',
      NN: '{\\mathbb{N}}',
      ZZ: '{\\mathbb{Z}}',
      QQ: '{\\mathbb{Q}}',
      CC: '{\\mathbb{C}}',
      vec: ['\\mathbf{#1}', 1],
      norm: ['\\left\\|#1\\right\\|', 1],
      abs: ['\\left|#1\\right|', 1],
      set: ['\\left\\{#1\\right\\}', 1]
    }
  },
  options: {
    skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
    ignoreHtmlClass: 'no-mathjax',
    renderActions: {
      addMenu: [],
      checkLoading: []
    }
  },
  startup: {
    typeset: false,
    ready: () => {
      console.log('MathJax is loaded and ready.');
    }
  }
};

// Function to preprocess mathematical content for better rendering
const preprocessMathContent = (content: string): string => {
  if (!content) return content;
  
  // Ensure proper spacing around math expressions
  let processed = content
    // Fix inline math spacing
    .replace(/([a-zA-Z0-9])\$([^$]+)\$/g, '$1 $$$2$$ ')
    .replace(/\$([^$]+)\$([a-zA-Z0-9])/g, '$$$1$$ $2')
    // Fix display math spacing
    .replace(/([a-zA-Z0-9])\$\$([^$]+)\$\$/g, '$1\n\n$$$$$2$$$$\n\n')
    .replace(/\$\$([^$]+)\$\$([a-zA-Z0-9])/g, '$$$$$1$$$$\n\n$2')
    // Ensure boxed expressions are properly formatted
    .replace(/\\boxed\{([^}]+)\}/g, '\\boxed{$1}')
    // Fix common fraction formatting
    .replace(/(\d+)\/(\d+)/g, '\\frac{$1}{$2}')
    // Fix square root formatting
    .replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}')
    // Fix power notation
    .replace(/\^(\d+)/g, '^{$1}')
    .replace(/_(\d+)/g, '_{$1}');
  
  return processed;
};

const ChatPage: React.FC = () => {
  const { userData, isPro } = useUser();
  const { user } = useAuth();
  const navigate = useNavigate();
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256); // 256px = 16rem (w-64)
  const [isDesktop, setIsDesktop] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [chats, setChats] = useState<Chat[]>([]);

  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

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
        alert('Message copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      alert('Failed to share message');
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
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
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
          // If we're not authenticated, fall back to local display
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user?.id) {
            // Create a local URL for the file
            const localUrl = URL.createObjectURL(selectedFile);
            
            // Add file information to message content
            userMessageContent = inputMessage 
              ? `${inputMessage}\n\n[Attached image: ${selectedFile.name}]` 
              : `[Attached image: ${selectedFile.name}]`;
            
            // Add user message with image
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
            const fileExtension = selectedFile.name.split('.').pop() || 'jpg';
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
              ? `${inputMessage}\n\n[Attached image: ${selectedFile.name}]` 
              : `[Attached image: ${selectedFile.name}]`;
            
            // Add user message with image
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
          alert('Error uploading file. Please try again.');
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
        
        // Auto-scroll to bottom as content streams in
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
          }
        }, 50);
      };

      try {
        // Get streaming response
        const fullResponse = await sendMessageToAI(
          userMessageContent + (imageUrl ? `\n\n[Image data: ${imageUrl}]` : ''), 
          imageUrl, 
          handleChunk
        );
        
        // Finalize the streaming message
        setMessages(prev => prev.map(msg => 
          msg.id === streamingMessageId 
            ? { ...msg, content: fullResponse, isStreaming: false }
            : msg
        ));
        
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
      alert('An error occurred while sending your message. Please try again.');
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
      content: `Hello! I am now your ${role.name}. ${role.description} How can I help you today?`,
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
      
      // Check if it's an image
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File too large. Please select a file smaller than 10MB');
        return;
      }
      
      setSelectedFile(file);
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
        alert('Image URL copied to clipboard!');
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

  // Handle sidebar collapse state changes
  const handleSidebarToggle = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
    setSidebarWidth(collapsed ? 64 : 256); // 64px = 4rem (w-16), 256px = 16rem (w-64)
  };

  // Check if desktop on initial render and on resize
  useEffect(() => {
    const checkIfDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    
    // Initial check
    checkIfDesktop();
    
    // Add resize listener
    window.addEventListener('resize', checkIfDesktop);
    
    // Get initial sidebar state from the DOM if needed
    const sidebarElement = document.querySelector('aside');
    if (sidebarElement) {
      const isCollapsed = sidebarElement.classList.contains('w-16');
      setSidebarCollapsed(isCollapsed);
      setSidebarWidth(isCollapsed ? 64 : 256);
    }
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkIfDesktop);
    };
  }, []);

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
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm('Are you sure you want to delete this chat?')) {
              deleteChat(chat.id);
            }
          }}
          className={`p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
            darkMode ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-200 text-gray-500'
          }`}
          title="Delete chat"
        >
          <FiX className="w-3.5 h-3.5" />
        </div>
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
                id: msg.id || Date.now(),
                role: msg.sender === 'bot' ? 'assistant' : 'user',
                content: '', // Empty content for image messages
                timestamp: msg.timestamp || new Date().toISOString(),
                fileContent: msg.text, // Use the URL as fileContent
                fileName: 'Image'
              };
            }
            
            // Regular text message
            return {
              id: msg.id || Date.now(),
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
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - always fixed on desktop, hidden on mobile when closed */}
      <div className="md:block hidden">
        <Sidebar onToggle={handleSidebarToggle} activeLink="/chat" />
      </div>

      {/* Mobile sidebar toggle button */}
      <div className="md:hidden fixed top-3 left-3 z-[60]">
        <button 
          onClick={() => setShowChatHistory(!showChatHistory)}
          className={`p-2 rounded-lg ${
            darkMode 
              ? 'bg-gray-800 text-white hover:bg-gray-700' 
              : 'bg-white text-gray-800 hover:bg-gray-100'
          } shadow-md`}
          aria-label="Toggle mobile menu"
        >
          <FiMenu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile sidebar/chat history */}
      {showChatHistory && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div 
            className="bg-black bg-opacity-50 flex-1"
            onClick={() => setShowChatHistory(false)}
          ></div>
          <div className={`w-72 ${darkMode ? 'bg-gray-800' : 'bg-white'} flex flex-col h-full`}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Chat History</h2>
              <button 
                onClick={() => setShowChatHistory(false)}
                className={`${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <div className="mb-4">
                <h3 className="px-3 mb-2 text-xs font-medium text-gray-400 uppercase tracking-wider">Today</h3>
                {groupedChatHistory.today.map(chat => renderChatHistoryItem(chat, 'Today'))}
              </div>
              
              <div className="mb-4">
                <h3 className="px-3 mb-2 text-xs font-medium text-gray-400 uppercase tracking-wider">Yesterday</h3>
                {groupedChatHistory.yesterday.map(chat => renderChatHistoryItem(chat, 'Yesterday'))}
              </div>

              {/* Last week chats */}
              {groupedChatHistory.lastWeek.length > 0 && (
                <div className="mb-3">
                  <h4 className="px-3 mb-1 text-xs font-medium text-gray-400 uppercase tracking-wider">Last Week</h4>
                  {groupedChatHistory.lastWeek.map(chat => renderChatHistoryItem(chat, 'Last week'))}
                </div>
              )}
              
              {/* Last month chats */}
              {groupedChatHistory.lastMonth.length > 0 && (
                <div>
                  <h4 className="px-3 mb-1 text-xs font-medium text-gray-400 uppercase tracking-wider">Last Month</h4>
                  {groupedChatHistory.lastMonth.map(chat => renderChatHistoryItem(chat, 'Last month'))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Main content area with fixed navbar */}
      <div className="flex-1 flex flex-col h-screen transition-all duration-300"
          style={{ marginLeft: isDesktop ? `${sidebarWidth}px` : '0' }}>
        {/* Fixed navbar */}
        <div className={`${
          darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'
        } border-b w-full flex-none h-16 fixed top-0 right-0 z-40 transition-all duration-300`}
        style={{ 
          left: isDesktop ? `${sidebarWidth}px` : '0',
          width: isDesktop ? `calc(100% - ${sidebarWidth}px)` : '100%'
        }}>
          <div className="h-full flex items-center justify-between px-4">
            <div className="flex items-center">
              {/* Brand Logo - Only visible on mobile */}
              <div className="md:hidden flex items-center">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                  AI
                </div>
                {isPro && (
                  <span className="ml-1 text-xs font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 text-transparent bg-clip-text border border-yellow-400 rounded-full px-2 py-0.5">
                    PRO
                  </span>
                )}
              </div>
              
              {/* Page title */}
              <h1 className="text-lg font-semibold ml-4 md:ml-0">AI Chat</h1>
            </div>

            {/* Right Navigation */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* User Coins */}
              {userData && (
                <div className={`hidden sm:flex items-center px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm ${
                  darkMode 
                    ? 'bg-amber-900/30 text-amber-300' 
                    : 'bg-amber-100 text-amber-600'
                }`}>
                  <FiCreditCard className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
                  <span className="font-medium">{userData.user_coins || 0}</span>
                </div>
              )}

              {/* Dark Mode Toggle */}
              <button 
                onClick={toggleDarkMode}
                className={`p-1.5 sm:p-2 rounded-lg ${
                  darkMode 
                    ? 'text-yellow-300 hover:bg-gray-700' 
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
                aria-label="Toggle dark mode"
              >
                {darkMode ? <FiSun className="w-4 h-4 sm:w-5 sm:h-5" /> : <FiMoon className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>

              {/* User Menu */}
              <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center"
                >
                  <span className="sr-only">Open user menu</span>
                  {userData?.dp_url ? (
                    <img 
                      src={userData.dp_url} 
                      alt={userData.name || 'User'} 
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                    />
                  ) : (
                    <div className="relative w-7 h-7 sm:w-8 sm:h-8 overflow-hidden rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
                      <span className="text-white font-medium">{getUserInitial()}</span>
                    </div>
                  )}
                </button>

                {/* User Menu Dropdown */}
                {showUserMenu && (
                  <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg ring-1 focus:outline-none z-50 ${
                    darkMode ? 'bg-gray-800 ring-gray-700' : 'bg-white ring-black ring-opacity-5'
                  }`}>
                    <div className={`py-3 px-4 text-sm border-b ${
                      darkMode ? 'text-gray-200 border-gray-700' : 'text-gray-900 border-gray-200'
                    }`}>
                      <div className="font-medium">{getUserDisplayName()}</div>
                      <div className={`truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {userData?.email}
                      </div>
                      {userData?.user_plan && (
                        <div className={`mt-1 px-2 py-0.5 text-xs rounded-full inline-block ${
                          darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {userData.user_plan} Plan
                        </div>
                      )}
                    </div>
                    <ul className="py-1 text-sm">
                      <li>
                        <Link to="/profile" className={`block py-2 px-4 ${
                          darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                        }`}>Profile</Link>
                      </li>
                      <li>
                        <Link to="/settings" className={`block py-2 px-4 ${
                          darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                        }`}>Settings</Link>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main content area with fixed navbar */}
        <div className={`flex-1 flex flex-col overflow-hidden pt-16 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
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
            <div className="h-full max-w-6xl mx-auto px-4 pt-4 pb-0 flex flex-col">
              <div className="bg-opacity-80 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden flex-1 flex flex-col">
                {/* Chat interface */}
                <div ref={chatContainerRef} className="flex flex-col h-full">
                  {/* Chat header with role selector */}
                  <div className={`px-6 py-3 flex justify-between items-center border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="relative">
                      <button 
                        onClick={() => setShowRoleSelector(!showRoleSelector)} 
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium border ${
                          darkMode ? 'text-gray-200 hover:bg-gray-700 border-gray-600' : 'text-gray-700 hover:bg-gray-50 border-gray-300'
                        }`}
                      >
                        <FiCpu className="text-blue-500 mr-2" />
                        <span>{selectedRole.name}</span>
                        <FiChevronDown className={`transition-transform ${showRoleSelector ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {/* Role Selector Dropdown */}
                      {showRoleSelector && (
                        <div className={`absolute top-full left-0 mt-1 w-64 rounded-md shadow-lg z-10 ${
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
                    
                    <div className="flex items-center space-x-2">
                      {!isPro && (
                        <div className="hidden md:flex items-center text-sm text-yellow-600 dark:text-yellow-400 mr-2">
                          <FiMessageSquare className="mr-1 h-4 w-4" />
                          <span>{remainingMessages} messages left</span>
                        </div>
                      )}
                      <button 
                        onClick={handleStartNewChat}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        title="New Chat"
                      >
                        <FiPlus className="w-5 h-5" />
                      </button>
                      
                      {/* History dropdown button */}
                      <div className="relative">
                        <button 
                          onClick={() => setShowHistoryDropdown(!showHistoryDropdown)}
                          className={`p-2 rounded-full ${
                            showHistoryDropdown
                              ? (darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-700') 
                              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                          }`}
                          title="Chat History"
                        >
                          <FiClock className="w-5 h-5" />
                        </button>
                        
                        {/* History Dropdown */}
                        {showHistoryDropdown && (
                          <div 
                            className={`absolute top-full right-0 mt-2 w-72 rounded-lg shadow-xl z-20 overflow-hidden ${
                              darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                            }`}
                          >
                            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                              <h3 className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Recent Conversations</h3>
                              <button 
                                onClick={() => setShowHistoryDropdown(false)}
                                className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                              >
                                <FiX className="w-4 h-4" />
                              </button>
                            </div>
                            
                            <div className="max-h-96 overflow-y-auto py-2">
                              {/* Today's chats */}
                              {groupedChatHistory.today.length > 0 && (
                                <div className="mb-3">
                                  <h4 className="px-3 mb-1 text-xs font-medium text-gray-400 uppercase tracking-wider">Today</h4>
                                  {groupedChatHistory.today.map(chat => renderChatHistoryItem(chat, 'Today'))}
                                </div>
                              )}
                              
                              {/* Yesterday's chats */}
                              {groupedChatHistory.yesterday.length > 0 && (
                                <div className="mb-3">
                                  <h4 className="px-3 mb-1 text-xs font-medium text-gray-400 uppercase tracking-wider">Yesterday</h4>
                                  {groupedChatHistory.yesterday.map(chat => renderChatHistoryItem(chat, 'Yesterday'))}
                                </div>
                              )}

                              {/* Last week chats */}
                              {groupedChatHistory.lastWeek.length > 0 && (
                                <div className="mb-3">
                                  <h4 className="px-3 mb-1 text-xs font-medium text-gray-400 uppercase tracking-wider">Last Week</h4>
                                  {groupedChatHistory.lastWeek.map(chat => renderChatHistoryItem(chat, 'Last week'))}
                                </div>
                              )}
                              
                              {/* Last month chats */}
                              {groupedChatHistory.lastMonth.length > 0 && (
                                <div>
                                  <h4 className="px-3 mb-1 text-xs font-medium text-gray-400 uppercase tracking-wider">Last Month</h4>
                                  {groupedChatHistory.lastMonth.map(chat => renderChatHistoryItem(chat, 'Last month'))}
                                </div>
                              )}
                            </div>
                            
                            <div className={`p-2 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                              <button 
                                className={`w-full text-center py-2 rounded-md text-sm font-medium ${
                                  darkMode 
                                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                }`}
                              >
                                View All History
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Auto-speak toggle */}
                      <button 
                        onClick={toggleAutoSpeak}
                        className={`p-2 rounded ${autoSpeak
                          ? (darkMode ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-600')
                          : (darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700')
                        }`}
                        title={autoSpeak ? "Auto-speak On" : "Auto-speak Off"}
                      >
                        {autoSpeak ? <FiVolume2 className="w-5 h-5" /> : <FiVolume className="w-5 h-5" />}
                      </button>
                      
                      {/* Call button */}
                    
                    </div>
                  </div>
                  
                  {/* Messages container with improved markdown */}
                  <div className="flex-1 overflow-y-auto px-4 py-4">
                    <div className="max-w-3xl mx-auto space-y-6">
                      {messages.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[85%] flex ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            {/* Avatar */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${
                              message.role === 'assistant' 
                                ? (darkMode ? 'bg-gradient-to-r from-blue-900 to-purple-900 text-white' : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white') 
                                : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')
                            } ${message.role === 'user' ? 'ml-3' : 'mr-3'}`}>
                              {message.role === 'assistant' ? (
                                <FiCpu />
                              ) : (
                                <FiUser />
                              )}
                            </div>
                            
                            <div className={`rounded-2xl px-4 py-3 ${
                              message.role === 'assistant' 
                                ? (darkMode ? 'bg-gray-800 border border-gray-700 text-gray-100' : 'bg-white border border-gray-200 shadow-sm text-gray-800') 
                                : (darkMode ? 'bg-gradient-to-r from-blue-800 to-purple-800 text-white' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white')
                            }`}>
                              {message.role === 'assistant' ? (
                                <div className={`prose prose-sm max-w-none ${darkMode ? 'prose-invert' : ''} markdown-content`}>
                                  {message.isStreaming ? (
                                    <div className="streaming-content">
                                      <ReactMarkdown 
                                        components={MarkdownComponents}
                                        remarkPlugins={[remarkGfm, remarkMath]}
                                        rehypePlugins={[rehypeKatex, rehypeRaw]}
                                      >
                                        {preprocessMathContent(message.content)}
                                      </ReactMarkdown>
                                      <span className="typing-cursor animate-pulse">▋</span>
                                    </div>
                                  ) : (
                                    <div>
                                      {message.content ? (
                                        <ReactMarkdown 
                                          components={MarkdownComponents}
                                          remarkPlugins={[remarkGfm, remarkMath]}
                                          rehypePlugins={[rehypeKatex, rehypeRaw]}
                                          remarkRehypeOptions={{
                                            allowDangerousHtml: true
                                          }}
                                        >
                                          {preprocessMathContent(message.content)}
                                        </ReactMarkdown>
                                      ) : (
                                        <span>Loading content...</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div>
                                  <div className="whitespace-pre-wrap">{message.content}</div>
                                  {/* Display image if it exists */}
                                  {'fileContent' in message && message.fileContent && (
                                    <div className="mt-2">
                                      <img 
                                        src={message.fileContent as string} 
                                        alt={message.fileName as string || "Uploaded image"} 
                                        className="max-w-full rounded-lg mt-2 max-h-64 object-contain"
                                      />
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Message footer */}
                              <div className={`mt-2 flex items-center justify-between text-xs ${
                                message.role === 'assistant' 
                                  ? (darkMode ? 'text-gray-500' : 'text-gray-500') 
                                  : 'text-blue-200'
                              }`}>
                                <span>{formatTimestamp(message.timestamp)}</span>
                                
                                <div className="flex space-x-2">
                                  {/* Add message actions here */}
                                  <button 
                                    onClick={() => copyToClipboard(message.content)}
                                    className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                                    aria-label="Copy to clipboard"
                                  >
                                    <FiCopy size={14} />
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
                                        aria-label={speakingMessageId === message.id ? "Stop speaking" : "Speak message"}
                                      >
                                        {speakingMessageId === message.id ? 
                                          <FiSquare size={14} /> : 
                                          <FiVolume2 size={14} />
                                        }
                                      </button>
                                      <button 
                                        onClick={() => handleShareMessage(message.content)}
                                        className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                                        aria-label="Share message"
                                      >
                                        <FiShare2 size={14} />
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
                          <div className="max-w-[85%] flex flex-row">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mr-3 ${darkMode ? 'bg-gradient-to-r from-blue-900 to-purple-900 text-white' : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'}`}>
                              <FiCpu />
                            </div>
                            <div className={`rounded-2xl px-6 py-4 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200 shadow-sm'}`}>
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
                  <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    {selectedFile && (
                      <div className={`mb-2 p-2 rounded-lg flex items-center space-x-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <FiFile className={darkMode ? 'text-gray-300' : 'text-gray-600'} />
                        <span className="text-sm truncate flex-1">{selectedFile.name}</span>
                        <button 
                          onClick={() => setSelectedFile(null)}
                          className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}
                        >
                          <FiX size={16} />
                        </button>
                      </div>
                    )}
                    <div className={`flex items-end rounded-xl ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border border-gray-300'} focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500`}>
                      <textarea
                        ref={textareaRef}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message..."
                        rows={1}
                        className={`flex-1 py-3 px-4 bg-transparent focus:outline-none resize-none max-h-32 ${darkMode ? 'text-white placeholder-gray-400' : 'text-gray-700 placeholder-gray-400'}`}
                      />
                      <div className="flex items-center space-x-1 p-2">
                        <input 
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          onChange={handleFileChange}
                          accept="image/*"
                        />
                        <button 
                          onClick={handleFileUpload}
                          className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                          aria-label="Upload file"
                        >
                          <FiFile />
                        </button>
                        <button
                          onClick={handleSendMessage}
                          disabled={!inputMessage.trim() && !selectedFile}
                          className={`p-2 rounded-full ${
                            !inputMessage.trim() && !selectedFile 
                              ? (darkMode ? 'text-gray-500 bg-gray-800' : 'text-gray-400 bg-gray-100') 
                              : (darkMode ? 'text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' : 'text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600')
                          }`}
                          aria-label="Send message"
                        >
                          <FiSend />
                        </button>
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
  );
};

export default ChatPage; 
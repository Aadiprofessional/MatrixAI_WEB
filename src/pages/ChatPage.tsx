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
  FiPhone,
  FiCreditCard,
  FiSun,
  FiMoon
} from 'react-icons/fi';
import { Navbar, Sidebar, ProFeatureAlert } from '../components';
import axios from 'axios';
import { ThemeContext } from '../context/ThemeContext';
import ReactMarkdown from 'react-markdown';
import { useUser } from '../context/UserContext';
import './ChatPage.css'; // Import the CSS file for typing animation
import './ContentWriterPage.css'; // Import shared markdown styling
import { Link } from 'react-router-dom';

// Define interface for message types
interface Message {
  id: number;
  role: string;
  content: string;
  timestamp: string;
  fileContent?: string;
  fileName?: string;
}

// Sample role options for the AI assistant
const roleOptions = [
  { id: 'analyst', name: 'Data Analyst', description: 'Helps analyze and visualize data' },
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

// Sample messages for the chat history
const initialMessages: Message[] = [
  { 
    id: 1, 
    role: 'assistant', 
    content: 'Hello! I\'m your Matrix AI assistant. How can I help you today?',
    timestamp: new Date(Date.now() - 120000).toISOString()
  }
];

const ChatPage: React.FC = () => {
  const { userData, isPro } = useUser();
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
    today: { id: string, title: string }[],
    yesterday: { id: string, title: string }[],
    lastWeek: { id: string, title: string }[],
    lastMonth: { id: string, title: string }[]
  }>({
    today: [{ id: '1', title: 'How to design a website' }],
    yesterday: [{ id: '2', title: 'Machine learning basics' }],
    lastWeek: [{ id: '3', title: 'Travel planning advice' }],
    lastMonth: [{ id: '4', title: 'Recipe recommendations' }]
  });
  const [messageHistory, setMessageHistory] = useState<{ role: string, content: string }[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [chatId, setChatId] = useState<string>(Date.now().toString());
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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Automatically scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Auto-resize the textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [inputMessage]);

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
    
    let fileContent = '';
    let userMessageContent = inputMessage;
    
    // If there's a file, process it
    if (selectedFile) {
      // Read file content as base64
      const reader = new FileReader();
      fileContent = await new Promise((resolve) => {
        reader.onload = (e) => {
          const result = e.target?.result as string;
          resolve(result || '');
        };
        reader.readAsDataURL(selectedFile);
      });
      
      // Add file information to message content
      userMessageContent = inputMessage 
        ? `${inputMessage}\n\n[Attached image: ${selectedFile.name}]` 
        : `[Attached image: ${selectedFile.name}]`;
        
      // Decrease free uploads left if user is not pro
      if (!isPro) {
        setFreeUploadsLeft(prev => prev - 1);
      }
    }
    
    // Add user message
    const userMessage = {
      id: messages.length + 1,
      role: 'user',
      content: userMessageContent,
      timestamp: new Date().toISOString(),
      fileContent: fileContent,
      fileName: selectedFile?.name || ''
    };
    
    setMessages([...messages, userMessage]);
    
    // Add to message history for API
    const userMessageForApi = { 
      role: 'user', 
      content: userMessageContent + (fileContent ? `\n\n[Image data: ${fileContent}]` : '')
    };
    const updatedMessageHistory = [...messageHistory, userMessageForApi];
    setMessageHistory(updatedMessageHistory);
    
    setInputMessage('');
    setSelectedFile(null);
    setIsLoading(true);
    
    // System content including role specification
    const systemContent = `You are an advanced AI assistant with expertise in ${selectedRole.name}. ${selectedRole.description}.`;
    
    try {
      // Make API call
      const response = await axios.post(
        'https://ddtgdhehxhgarkonvpfq.supabase.co/functions/v1/createContent',
        {
          prompt: userMessageContent + (fileContent ? `\n\n[Image data: ${fileContent}]` : '')
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Extract AI response
      const aiContent = response.data.output.text;
      
      // Add AI response to messages with empty content initially
      const aiResponse = {
        id: messages.length + 2,
        role: 'assistant',
        content: aiContent,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(prev => ({ ...prev, [aiResponse.id]: true }));
      setDisplayedText(prev => ({ ...prev, [aiResponse.id]: '' }));
      
      // Process the content into chunks of words for a better typing effect
      const contentLines = aiContent.split('\n').filter((line: string) => line.trim() !== '');
      
      // Create chunks of 5-7 words for each line
      const lineChunks: string[][] = [];
      
      contentLines.forEach((line: string) => {
        const words = line.split(' ');
        const chunks: string[] = [];
        
        for (let i = 0; i < words.length; i += 5 + Math.floor(Math.random() * 3)) { // 5-7 words per chunk
          const chunkSize = Math.min(5 + Math.floor(Math.random() * 3), words.length - i);
          chunks.push(words.slice(i, i + chunkSize).join(' '));
        }
        
        lineChunks.push(chunks);
      });
      
      setWordChunks(prev => ({ ...prev, [aiResponse.id]: lineChunks }));
      setCurrentLineIndex(prev => ({ ...prev, [aiResponse.id]: 0 }));
      setCurrentWordIndex(prev => ({ ...prev, [aiResponse.id]: 0 }));
      
      // If no content, skip animation
      if (contentLines.length === 0) {
        setIsTyping(prev => ({ ...prev, [aiResponse.id]: false }));
        return;
      }
      
      // Improved typing effect that shows chunks of words in sequence
      const typeNextChunk = (lineIndex: number, chunkIndex: number) => {
        // If we've reached the end of all lines
        if (lineIndex >= lineChunks.length) {
          setIsTyping(prev => ({ ...prev, [aiResponse.id]: false }));
          
          // Auto speak if enabled
          if (autoSpeak) {
            handleTextToSpeech(aiContent, aiResponse.id);
          }
          return;
        }
        
        // If we've reached the end of the current line's chunks
        if (chunkIndex >= lineChunks[lineIndex].length) {
          // Move to the next line and start with its first chunk
          setTimeout(() => {
            typeNextChunk(lineIndex + 1, 0);
          }, 350 + Math.random() * 250); // Slightly longer pause between lines
          
          setCurrentLineIndex(prev => ({ ...prev, [aiResponse.id]: lineIndex + 1 }));
          setCurrentWordIndex(prev => ({ ...prev, [aiResponse.id]: 0 }));
          return;
        }
        
        // Update displayed text by adding the next chunk
        setDisplayedText(prev => {
          // If we're starting a new line
          if (chunkIndex === 0) {
            // Add a new line if not the first line
            const newLinePrefix = lineIndex > 0 ? prev[aiResponse.id] + '\n' : prev[aiResponse.id];
            return {
              ...prev,
              [aiResponse.id]: newLinePrefix + lineChunks[lineIndex][chunkIndex]
            };
          } else {
            // Continue the current line by adding a space and the next chunk
            return {
              ...prev,
              [aiResponse.id]: prev[aiResponse.id] + ' ' + lineChunks[lineIndex][chunkIndex]
            };
          }
        });
        
        setCurrentWordIndex(prev => ({ ...prev, [aiResponse.id]: chunkIndex + 1 }));
        
        // Schedule typing the next chunk
        setTimeout(() => {
          typeNextChunk(lineIndex, chunkIndex + 1);
        }, 100 + Math.random() * 150); // Variable delay between chunks
      };
      
      // Start typing from the first line's first chunk
      setTimeout(() => {
        typeNextChunk(0, 0);
      }, 300); // Initial delay before starting to type
      
      // Update message history for next API call
      setMessageHistory([...updatedMessageHistory, { role: 'assistant', content: aiContent }]);
      
      // Add to chat history if this is a new conversation
      if (messages.length <= 1) {
        const newChatTitle = inputMessage.length > 25 ? `${inputMessage.substring(0, 25)}...` : inputMessage;
        setGroupedChatHistory(prev => ({
          ...prev,
          today: [{ id: chatId, title: newChatTitle }, ...prev.today]
        }));
      }
    } catch (error) {
      console.error('Error calling AI API:', error);
      // Add error message
      const errorResponse = {
        id: messages.length + 2,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  // When a role is changed, show a message from the assistant
  const handleRoleChange = (role: typeof roleOptions[0]) => {
    setSelectedRole(role);
    setShowRoleSelector(false);
    
    // Add a message to let the user know the role has changed
    const roleChangeMessage = {
      id: messages.length + 1,
      role: 'assistant',
      content: `I am now your ${role.name}. ${role.description}. How can I help you today?`,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, roleChangeMessage]);
    
    // Reset message history for the new role
    setMessageHistory([{ role: 'assistant', content: roleChangeMessage.content }]);
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

  const handleFileUpload = () => {
    // If user is not pro and has used all free uploads, show pro alert
    if (!isPro && freeUploadsLeft <= 0) {
      setShowProAlert(true);
      return;
    }
    
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const startNewChat = () => {
    stopSpeech();
    setMessages(initialMessages);
    setMessageHistory([]);
    setChatId(Date.now().toString());
    setSelectedRole(roleOptions[0]);
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
    // Stop any current speech
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      
      // If we're stopping the current message, reset state and return
      if (speakingMessageId === messageId) {
        setIsSpeaking(false);
        setSpeakingMessageId(null);
        return;
      }
    }
    
    // Create speech synthesis utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set language (default to English)
    utterance.lang = 'en-US';
    
    // Check if we're on macOS
    const isMacOS = /Macintosh|MacIntel|MacPPC|Mac68K/.test(navigator.userAgent);
    
    // Some browsers need time to load voices - we'll use a more reliable approach
    const getVoices = () => {
      return new Promise<SpeechSynthesisVoice[]>((resolve) => {
        let voices = window.speechSynthesis.getVoices();
        
        if (voices.length) {
          resolve(voices);
        } else {
          // Set up a listener for when voices are loaded
          window.speechSynthesis.onvoiceschanged = () => {
            voices = window.speechSynthesis.getVoices();
            resolve(voices);
          };
        }
      });
    };
    
    // Using async function to properly await voices
    const setupVoice = async () => {
      try {
        const voices = await getVoices();
        
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
            console.log(`Found preferred voice: ${voiceName}`);
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
          console.log(`Using voice: ${selectedVoice.name}`);
        } else {
          console.warn("No suitable voice found - using browser default");
        }
        
        // Set other properties - use more conservative settings on macOS
        utterance.rate = isMacOS ? 1.0 : 0.95;
        utterance.pitch = 1.0; // Use neutral pitch to avoid issues
        utterance.volume = 1.0; // Full volume
        
        // Add event listeners
        utterance.onstart = () => {
          console.log("Speech started successfully");
          setIsSpeaking(true);
          setSpeakingMessageId(messageId);
        };
        
        utterance.onend = () => {
          console.log("Speech ended successfully");
          setIsSpeaking(false);
          setSpeakingMessageId(null);
          
          // If auto-speak is enabled, speak the next message
          if (autoSpeak) {
            const assistantMessages = messages
              .filter(m => m.role === 'assistant')
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
          
          // Try with a different approach if we get an error
          speakWithFallback(text);
        };
        
        // If on macOS and text is long, always use chunking
        if ((isMacOS && text.length > 100) || 
            (text.length > 200 && /^((?!chrome|android).)*safari/i.test(navigator.userAgent))) {
          // Split text into sentences and speak them sequentially
          const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [text];
          console.log("Using chunked speech with", sentences.length, "chunks");
          speakSentences(sentences, 0);
        } else {
          // Chrome sometimes has issues with speechSynthesis getting stuck
          console.log("Using standard speech method");
          window.speechSynthesis.speak(utterance);
          
          // Set a watchdog timer to monitor if speech has started within a reasonable time
          setTimeout(() => {
            if (speakingMessageId === messageId && !window.speechSynthesis.speaking) {
              console.log("Speech synthesis appears stuck, trying again...");
              speakWithFallback(text);
            }
          }, 1000);
        }
      } catch (error) {
        console.error('Error setting up voice:', error);
        speakWithFallback(text);
      }
    };
    
    // Function to speak a series of sentences sequentially
    const speakSentences = (sentences: string[], index: number) => {
      if (index >= sentences.length) return;
      
      const sentenceUtterance = new SpeechSynthesisUtterance(sentences[index]);
      sentenceUtterance.lang = 'en-US';
      sentenceUtterance.onend = () => {
        speakSentences(sentences, index + 1);
      };
      window.speechSynthesis.speak(sentenceUtterance);
    };
    
    // Function to try speaking with a simpler fallback configuration
    const speakWithFallback = (text: string) => {
      try {
        // Reset speech synthesis first
        window.speechSynthesis.cancel();
        
        // Try with a simpler configuration
        const fallbackUtterance = new SpeechSynthesisUtterance(text);
        fallbackUtterance.lang = 'en-US';
        fallbackUtterance.rate = 1.0;
        fallbackUtterance.pitch = 1.0;
        
        // Set minimal event handlers
        fallbackUtterance.onend = () => {
          setIsSpeaking(false);
          setSpeakingMessageId(null);
        };
        
        fallbackUtterance.onerror = () => {
          console.error('Fallback speech synthesis also failed');
          setIsSpeaking(false);
          setSpeakingMessageId(null);
        };
        
        // Try speaking without a specific voice
        window.speechSynthesis.speak(fallbackUtterance);
      } catch (err) {
        console.error('Failed completely to use speech synthesis:', err);
        setIsSpeaking(false);
        setSpeakingMessageId(null);
      }
    };
    
    // Start the voice setup process
    setupVoice();
  };
  
  // Function to stop any ongoing speech
  const stopSpeech = () => {
    if (window.speechSynthesis.speaking) {
      try {
        window.speechSynthesis.cancel();
      } catch (error) {
        console.error('Error stopping speech:', error);
      }
      setIsSpeaking(false);
      setSpeakingMessageId(null);
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

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - always fixed on desktop, hidden on mobile when closed */}
      <div className="md:block hidden">
        <Sidebar onToggle={handleSidebarToggle} />
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
                {groupedChatHistory.today.map(chat => (
                  <button 
                    key={chat.id}
                    className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 mb-1 ${
                      darkMode 
                        ? 'hover:bg-gray-700 text-gray-200' 
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <FiMessageSquare className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{chat.title}</span>
                  </button>
                ))}
              </div>
              
              <div className="mb-4">
                <h3 className="px-3 mb-2 text-xs font-medium text-gray-400 uppercase tracking-wider">Yesterday</h3>
                {groupedChatHistory.yesterday.map(chat => (
                  <button 
                    key={chat.id}
                    className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 mb-1 ${
                      darkMode 
                        ? 'hover:bg-gray-700 text-gray-200' 
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <FiMessageSquare className="w-4 h-4 text-gray-400" />
                    <span className="truncate">{chat.title}</span>
                  </button>
                ))}
              </div>
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
        } border-b w-full flex-none h-16 fixed top-0 right-0 z-30 transition-all duration-300`}
        style={{ 
          left: isDesktop ? `${sidebarWidth}px` : '0' 
        }}>
          <div className="max-w-screen-2xl mx-auto w-full h-full flex items-center justify-between px-4">
            <div className="flex items-center flex-grow-0 flex-shrink-0 ml-8 md:ml-0">
              {/* Brand Logo - Only visible on mobile */}
              <div className="md:hidden flex items-center mr-4">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                  AI
                </div>
                {isPro && (
                  <span className="ml-1 text-xs font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 text-transparent bg-clip-text border border-yellow-400 rounded-full px-2 py-0.5">
                    PRO
                  </span>
                )}
              </div>
            </div>

            {/* Right Navigation */}
            <div className="flex items-center space-x-1 sm:space-x-2">
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

        {/* Chat interface - with padding to account for fixed navbar */}
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
                        onClick={startNewChat}
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
                                  {groupedChatHistory.today.map(chat => (
                                    <button 
                                      key={chat.id}
                                      className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:${
                                        darkMode ? 'bg-gray-700' : 'bg-gray-100'
                                      } transition-colors duration-150`}
                                    >
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                        darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-600'
                                      }`}>
                                        <FiMessageSquare className="w-4 h-4" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium truncate ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                          {chat.title}
                                        </p>
                                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                          Today
                                        </p>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                              
                              {/* Yesterday's chats */}
                              {groupedChatHistory.yesterday.length > 0 && (
                                <div className="mb-3">
                                  <h4 className="px-3 mb-1 text-xs font-medium text-gray-400 uppercase tracking-wider">Yesterday</h4>
                                  {groupedChatHistory.yesterday.map(chat => (
                                    <button 
                                      key={chat.id}
                                      className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:${
                                        darkMode ? 'bg-gray-700' : 'bg-gray-100'
                                      } transition-colors duration-150`}
                                    >
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                        darkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-600'
                                      }`}>
                                        <FiMessageSquare className="w-4 h-4" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium truncate ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                          {chat.title}
                                        </p>
                                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                          Yesterday
                                        </p>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                              
                              {/* Last week chats */}
                              {groupedChatHistory.lastWeek.length > 0 && (
                                <div>
                                  <h4 className="px-3 mb-1 text-xs font-medium text-gray-400 uppercase tracking-wider">Last Week</h4>
                                  {groupedChatHistory.lastWeek.map(chat => (
                                    <button 
                                      key={chat.id}
                                      className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:${
                                        darkMode ? 'bg-gray-700' : 'bg-gray-100'
                                      } transition-colors duration-150`}
                                    >
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                        darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-600'
                                      }`}>
                                        <FiMessageSquare className="w-4 h-4" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium truncate ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                          {chat.title}
                                        </p>
                                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                          Last week
                                        </p>
                                      </div>
                                    </button>
                                  ))}
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
                      
                      <button 
                        onClick={() => setAutoSpeak(!autoSpeak)}
                        className={`p-2 rounded ${autoSpeak
                          ? (darkMode ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-600')
                          : (darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700')
                        }`}
                        title={autoSpeak ? "Auto-speak On" : "Auto-speak Off"}
                      >
                        <FiVolume className="w-5 h-5" />
                      </button>
                      
                      {/* Call button */}
                      <Link
                        to="/call" 
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        title="Start Voice Call"
                      >
                        <FiPhone className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>
                  
                  {/* Messages container */}
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
                            {/* Avatar - show user profile pic if available */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${
                              message.role === 'assistant' 
                                ? (darkMode ? 'bg-gradient-to-r from-blue-900 to-purple-900 text-white' : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white') 
                                : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')
                            } ${message.role === 'user' ? 'ml-3' : 'mr-3'}`}>
                              {message.role === 'assistant' ? (
                                <FiCpu />
                              ) : (
                                // @ts-ignore - userData might have profilePicUrl
                                userData && 'profilePicUrl' in userData && userData.profilePicUrl ? (
                                  <img 
                                    // @ts-ignore - userData might have profilePicUrl 
                                    src={userData.profilePicUrl} 
                                    alt="User" 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <FiUser />
                                )
                              )}
                            </div>
                            
                            <div className={`rounded-2xl px-4 py-3 ${
                              message.role === 'assistant' 
                                ? (darkMode ? 'bg-gray-800 border border-gray-700 text-gray-100' : 'bg-white border border-gray-200 shadow-sm text-gray-800') 
                                : (darkMode ? 'bg-gradient-to-r from-blue-800 to-purple-800 text-white' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white')
                            }`}>
                              {message.role === 'assistant' ? (
                                <div className={`prose prose-sm max-w-none ${darkMode ? 'prose-invert' : ''} prose-headings:font-bold prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-pre:p-2 prose-pre:rounded-md markdown-content`}>
                                  {isTyping[message.id] ? (
                                    <div>
                                      {displayedText[message.id]?.split('\n').map((line: string, lineIdx: number) => (
                                        <div key={lineIdx} className="mb-2">
                                          <div className="typing-animation">
                                            {line}
                                            {lineIdx === currentLineIndex[message.id] && (
                                              <span className="typing-cursor"></span>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <ReactMarkdown>
                                      {message.content}
                                    </ReactMarkdown>
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
                              
                              <div className={`mt-2 flex items-center justify-between text-xs ${
                                message.role === 'assistant' 
                                  ? (darkMode ? 'text-gray-500' : 'text-gray-500') 
                                  : 'text-blue-200'
                              }`}>
                                <span>{formatTimestamp(message.timestamp)}</span>
                                
                                {message.role === 'assistant' && (
                                  <div className="flex space-x-2">
                                    <button 
                                      onClick={() => copyToClipboard(message.content)}
                                      className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                                      aria-label="Copy to clipboard"
                                    >
                                      <FiCopy size={14} />
                                    </button>
                                    <button 
                                      onClick={() => handleTextToSpeech(message.content, message.id)}
                                      className={`p-1 rounded-full ${
                                        speakingMessageId === message.id 
                                          ? (darkMode ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-600')
                                          : (darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500')
                                      }`}
                                      aria-label={speakingMessageId === message.id ? "Stop speaking" : "Speak message"}
                                    >
                                      <FiVolume size={14} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                      
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
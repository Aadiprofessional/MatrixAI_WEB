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
  FiMenu
} from 'react-icons/fi';
import { Navbar, Sidebar, ProFeatureAlert } from '../components';
import axios from 'axios';
import { ThemeContext } from '../context/ThemeContext';
import ReactMarkdown from 'react-markdown';
import { useUser } from '../context/UserContext';

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
    content: 'Hello! I\'m your MatrixAI assistant. How can I help you today?',
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
  const { darkMode } = useContext(ThemeContext);
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
        'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
        {
          model: 'deepseek-r1-250120',
          messages: [
            { role: 'system', content: systemContent },
            ...updatedMessageHistory,
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer 95fad12c-0768-4de2-a4c2-83247337ea89`
          }
        }
      );
      
      // Extract AI response
      const aiContent = response.data.choices[0].message.content;
      
      // Add AI response to messages
      const aiResponse = {
        id: messages.length + 2,
        role: 'assistant',
        content: aiContent,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, aiResponse]);
      
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
    setMessages(initialMessages);
    setMessageHistory([]);
    setChatId(Date.now().toString());
  };

  // Calculate remaining messages for display
  const userMessageCount = messages.filter(m => m.role === 'user').length;
  const remainingMessages = Math.max(0, freeMessagesLeft - userMessageCount);

  return (
    <div className={`flex h-screen flex-col ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {showProAlert && (
        <ProFeatureAlert 
          featureName="Unlimited AI Chat"
          onClose={() => setShowProAlert(false)}
        />
      )}
      <div className="flex-1 flex h-full overflow-hidden">
        {/* Chat Sidebar */}
        <aside className={`w-72 border-r ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} flex-shrink-0 hidden md:flex flex-col`}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <button 
              onClick={startNewChat}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white p-2 rounded-md hover:opacity-90 transition-all"
            >
              <FiPlus className="w-4 h-4" />
              New Chat
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
          
          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            {!isPro && (
              <div className="mb-3 p-2 rounded-md bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-200 dark:border-blue-900">
                <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
                  <FiMessageSquare className="w-4 h-4" />
                  <span>Free Trial</span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between mb-1">
                    <span>Messages:</span>
                    <span>{remainingMessages} left</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Image uploads:</span>
                    <span>{freeUploadsLeft} left</span>
                  </div>
                  {(remainingMessages === 0 || freeUploadsLeft === 0) && (
                    <button 
                      onClick={() => setShowProAlert(true)}
                      className="mt-2 w-full text-xs bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-md py-1 px-2"
                    >
                      Upgrade to Pro
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>
        
        {/* Mobile chat history button */}
        <div className="md:hidden fixed bottom-20 left-4 z-30">
          <button 
            onClick={() => setShowChatHistory(!showChatHistory)}
            className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
          >
            <FiMessageSquare className="w-5 h-5" />
          </button>
        </div>
        
        {/* Mobile chat history sidebar */}
        {showChatHistory && (
          <div className="md:hidden fixed inset-0 z-20 flex">
            <div 
              className="bg-black bg-opacity-50 flex-1"
              onClick={() => setShowChatHistory(false)}
            ></div>
            <div className={`w-72 ${darkMode ? 'bg-gray-800' : 'bg-white'} flex flex-col`}>
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h2 className="font-medium">Chat History</h2>
                <button 
                  onClick={() => setShowChatHistory(false)}
                  className="text-gray-500"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                {/* Chat history - same as desktop */}
              </div>
            </div>
          </div>
        )}
        
        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Chat Header */}
          <div className={`px-4 py-3 border-b flex items-center justify-between ${
            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="relative">
              <button 
                onClick={() => setShowRoleSelector(!showRoleSelector)} 
                className="flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium border hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600"
              >
                <FiCpu className="text-blue-500" />
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
            </div>
          </div>
          
          {/* Chat Messages - Scrollable with proper padding for input box */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 md:p-6 pb-32"
          >
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] flex ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === 'assistant' 
                        ? (darkMode ? 'bg-gradient-to-r from-blue-900 to-purple-900 text-white' : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white') 
                        : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700')
                    } ${message.role === 'user' ? 'ml-3' : 'mr-3'}`}>
                      {message.role === 'assistant' ? <FiCpu /> : <FiUser />}
                    </div>
                    
                    <div className={`rounded-2xl px-4 py-3 ${
                      message.role === 'assistant' 
                        ? (darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200 shadow-sm') 
                        : (darkMode ? 'bg-gradient-to-r from-blue-800 to-purple-800 text-white' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white')
                    }`}>
                      {message.role === 'assistant' ? (
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown>
                            {message.content}
                          </ReactMarkdown>
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
                          ? (darkMode ? 'text-gray-500' : 'text-gray-400') 
                          : 'text-blue-200'
                      }`}>
                        <span>{formatTimestamp(message.timestamp)}</span>
                        
                        {message.role === 'assistant' && (
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => copyToClipboard(message.content)}
                              className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                              aria-label="Copy to clipboard"
                            >
                              <FiCopy size={14} />
                            </button>
                            <button 
                              className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                              aria-label="Regenerate response"
                            >
                              <FiRefreshCw size={14} />
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
          
          {/* Input Box - Fixed at bottom but respects layout */}
          <div className={`border-t ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} absolute bottom-0 left-0 right-0 z-10`}>
            <div className="max-w-3xl mx-auto p-4">
              {selectedFile && (
                <div className={`mb-2 p-2 rounded-lg flex items-center space-x-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <FiFile />
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
        </main>
      </div>
    </div>
  );
};

export default ChatPage; 
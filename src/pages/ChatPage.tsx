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
  FiMessageSquare
} from 'react-icons/fi';
import { Navbar, Sidebar } from '../components';
import axios from 'axios';
import { ThemeContext } from '../context/ThemeContext';
import ReactMarkdown from 'react-markdown';

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
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(roleOptions[0]);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const { darkMode } = useContext(ThemeContext);
  const [showChatHistory, setShowChatHistory] = useState(false);
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
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const startNewChat = () => {
    // Create a new chat ID
    const newChatId = Date.now().toString();
    setChatId(newChatId);
    
    // Reset messages and history
    setMessages(initialMessages);
    setMessageHistory([]);
    setSelectedFile(null);
    
    // Add a new empty chat to history
    setGroupedChatHistory(prev => ({
      ...prev,
      today: [{ id: newChatId, title: 'New conversation' }, ...prev.today]
    }));
    
    // Close the chat history panel
    setShowChatHistory(false);
  };

  return (
    <div className={`flex h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Navbar />
        <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col h-full relative">
          {/* Role Selector Header - Sticky */}
          <div className={`sticky top-0 z-30 py-4 px-4 border-b ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
            <div className="max-w-3xl mx-auto flex justify-between items-center">
              <div className="relative">
                <button 
                  onClick={() => setShowRoleSelector(!showRoleSelector)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? 'bg-gradient-to-r from-blue-900 to-purple-900 text-white' : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'}`}>
                    <FiCpu />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">{selectedRole.name}</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{selectedRole.description}</p>
                  </div>
                  <FiChevronDown className={`transform transition-transform ${showRoleSelector ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {showRoleSelector && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`absolute top-full left-0 mt-1 w-64 rounded-lg shadow-lg z-40 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} overflow-hidden`}
                    >
                      <div className={`py-2 px-3 ${darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}`}>
                        <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Select a role</p>
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {roleOptions.map(role => (
                          <button
                            key={role.id}
                            onClick={() => handleRoleChange(role)}
                            className={`w-full text-left px-3 py-3 flex items-start space-x-3 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors ${selectedRole.id === role.id ? (darkMode ? 'bg-gray-700' : 'bg-gray-100') : ''}`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${darkMode ? 'bg-gradient-to-r from-blue-900 to-purple-900 text-white' : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'}`}>
                              <FiCpu />
                            </div>
                            <div>
                              <p className="font-medium">{role.name}</p>
                              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{role.description}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setShowChatHistory(!showChatHistory)}
                  className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'} flex items-center`}
                >
                  <FiClock className="mr-1" />
                  <span>History</span>
                </button>
                
                <button 
                  onClick={startNewChat}
                  className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'} flex items-center`}
                >
                  <FiPlus className="mr-1" />
                  <span>New Chat</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Chat History Dropdown - Fixed below header */}
          <AnimatePresence>
            {showChatHistory && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`border-b overflow-hidden z-20 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
              >
                <div className="max-w-3xl mx-auto p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium">Chat History</h3>
                    <button 
                      onClick={() => setShowChatHistory(false)}
                      className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                    >
                      <FiX />
                    </button>
                  </div>
                  
                  {/* Today */}
                  <div className="mb-4">
                    <h4 className={`text-xs font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Today</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {groupedChatHistory.today.map(chat => (
                        <button
                          key={chat.id}
                          className={`w-full text-left px-3 py-2 rounded-lg flex items-center ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${chat.id === chatId ? (darkMode ? 'bg-gray-700' : 'bg-gray-100') : ''}`}
                        >
                          <FiMessageSquare className="mr-2 flex-shrink-0" />
                          <span className="truncate">{chat.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Yesterday */}
                  <div className="mb-4">
                    <h4 className={`text-xs font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Yesterday</h4>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {groupedChatHistory.yesterday.map(chat => (
                        <button
                          key={chat.id}
                          className={`w-full text-left px-3 py-2 rounded-lg flex items-center ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                        >
                          <FiMessageSquare className="mr-2 flex-shrink-0" />
                          <span className="truncate">{chat.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Last Week */}
                  <div className="mb-4">
                    <h4 className={`text-xs font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Last Week</h4>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {groupedChatHistory.lastWeek.map(chat => (
                        <button
                          key={chat.id}
                          className={`w-full text-left px-3 py-2 rounded-lg flex items-center ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                        >
                          <FiMessageSquare className="mr-2 flex-shrink-0" />
                          <span className="truncate">{chat.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Last Month */}
                  <div>
                    <h4 className={`text-xs font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Last Month</h4>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {groupedChatHistory.lastMonth.map(chat => (
                        <button
                          key={chat.id}
                          className={`w-full text-left px-3 py-2 rounded-lg flex items-center ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                        >
                          <FiMessageSquare className="mr-2 flex-shrink-0" />
                          <span className="truncate">{chat.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
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
        </div>
      </div>
    </div>
  );
};

export default ChatPage; 
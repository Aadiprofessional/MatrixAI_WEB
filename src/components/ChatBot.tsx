import React, { useState, useRef, useEffect } from 'react';
import { FiSend, FiPaperclip, FiImage, FiX, FiPlus, FiCopy, FiShare2 } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import Lottie from 'lottie-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  image?: string;
  timestamp: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  emoji: string;
}

interface ChatProps {
  initialMessages?: Message[];
  onNewChat?: () => void;
  version: 'personal' | 'enterprise';
}

const ChatBot: React.FC<ChatProps> = ({ initialMessages = [], onNewChat, version }) => {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAdditionalButtons, setShowAdditionalButtons] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [expandedMessages, setExpandedMessages] = useState<Record<string, boolean>>({});
  const [currentRole, setCurrentRole] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Available roles
  const roles: Role[] = [
    { id: 'doctor', name: 'Doctor', description: 'Medical advisor providing health guidance', emoji: '🩺' },
    { id: 'teacher', name: 'Teacher', description: 'Educational guide for academic achievement', emoji: '📚' },
    { id: 'lawyer', name: 'Lawyer', description: 'Legal advisor for contracts and disputes', emoji: '⚖️' },
    { id: 'psychologist', name: 'Psychologist', description: 'Mental health support specialist', emoji: '🌱' },
    { id: 'engineer', name: 'Engineer', description: 'Technical problem-solver for infrastructure', emoji: '🔧' },
    { id: 'surveyor', name: 'Surveyor', description: 'Expert in land and property assessment', emoji: '📐' },
    { id: 'architect', name: 'Architect', description: 'Building design expert for urban environments', emoji: '🏤' },
    { id: 'financial', name: 'Financial Advisor', description: 'Wealth management expert for investments', emoji: '📈' },
  ];

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (inputText.trim() || selectedImage) {
      try {
        // Create a new user message
        const userMessage: Message = {
          id: Date.now().toString(),
          text: inputText,
          sender: 'user',
          image: selectedImage || undefined,
          timestamp: new Date().toISOString()
        };

        // Add user message to the chat
        setMessages(prev => [...prev, userMessage]);
        
        // Clear input and image
        setInputText('');
        setSelectedImage(null);
        setImagePreview(null);
        setShowAdditionalButtons(false);
        
        // Show loading state
        setIsLoading(true);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Create bot response
        let botResponse = "I'm MatrixAI, your intelligent assistant. ";
        
        if (selectedImage) {
          botResponse += "I can see the image you've shared. ";
        }
        
        if (inputText.includes('?')) {
          botResponse += `To answer your question: "${inputText}" - `;
        }
        
        if (currentRole) {
          const roleObj = roles.find(r => r.id === currentRole);
          if (roleObj) {
            botResponse += `As a ${roleObj.name}, I would advise that ${getResponseByRole(currentRole, inputText)}`;
          } else {
            botResponse += getDefaultResponse(inputText);
          }
        } else {
          botResponse += getDefaultResponse(inputText);
        }
        
        // Add bot message to the chat
        setMessages(prev => [
          ...prev, 
          {
            id: Date.now().toString(),
            text: botResponse,
            sender: 'bot',
            timestamp: new Date().toISOString()
          }
        ]);
        
        // End loading state
        setIsLoading(false);
      } catch (error) {
        console.error('Error sending message:', error);
        setIsLoading(false);
        
        // Show error message
        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            text: 'Sorry, I encountered an error processing your request. Please try again.',
            sender: 'bot',
            timestamp: new Date().toISOString()
          }
        ]);
      }
    }
  };

  const getResponseByRole = (role: string, query: string): string => {
    // Simplified role-based responses
    switch (role) {
      case 'doctor':
        return 'While I cannot diagnose conditions, I recommend consulting with a healthcare professional for personalized medical advice.';
      case 'teacher':
        return 'The concept you\'re asking about involves several key principles that build upon fundamental knowledge in this area.';
      case 'lawyer':
        return 'Legal matters require careful consideration. While this information is general, you should consult with a licensed attorney for specific advice.';
      case 'psychologist':
        return 'It\'s important to acknowledge your feelings and develop healthy coping mechanisms for managing stress and emotional challenges.';
      case 'engineer':
        return 'The technical solution would likely involve analyzing requirements, designing a system architecture, and implementing with best practices.';
      case 'surveyor':
        return 'Property assessment requires careful measurement and evaluation of multiple factors including location, condition, and market trends.';
      case 'architect':
        return 'The design approach should balance aesthetic considerations with functional requirements, taking into account spatial dynamics and user experience.';
      case 'financial':
        return 'Financial planning should consider your long-term goals, risk tolerance, and diversification across different asset classes.';
      default:
        return getDefaultResponse(query);
    }
  };

  const getDefaultResponse = (query: string): string => {
    if (query.toLowerCase().includes('hello') || query.toLowerCase().includes('hi')) {
      return 'Hello! How can I assist you today?';
    } else if (query.toLowerCase().includes('help')) {
      return 'I can help with information, answer questions, or assist with various tasks. What specifically do you need help with?';
    } else if (query.toLowerCase().includes('time')) {
      return `The current time is ${new Date().toLocaleTimeString()}.`;
    } else if (query.toLowerCase().includes('date')) {
      return `Today's date is ${new Date().toLocaleDateString()}.`;
    } else if (query.toLowerCase().includes('weather')) {
      return 'I don\'t have access to real-time weather data. You might want to check a weather service or app for the current conditions.';
    } else if (query.toLowerCase().includes('thank')) {
      return 'You\'re welcome! Is there anything else I can help you with?';
    } else {
      return 'I understand you\'re interested in this topic. I\'d be happy to provide more information or answer specific questions you might have.';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAttach = () => {
    setShowAdditionalButtons(!showAdditionalButtons);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setSelectedImage(result);
        setImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleMessageExpansion = (messageId: string) => {
    setExpandedMessages(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };

  const handleShareMessage = (text: string) => {
    if (navigator.share) {
      navigator.share({
        text: text
      });
    } else {
      navigator.clipboard.writeText(text);
      // Could add a toast notification here
    }
  };

  const handleRoleSelection = (roleId: string) => {
    setCurrentRole(roleId);
    
    const selectedRole = roles.find(r => r.id === roleId);
    if (selectedRole) {
      const introMessage: Message = {
        id: Date.now().toString(),
        text: `I'll now act as a ${selectedRole.name}. ${selectedRole.description}. How can I help you?`,
        sender: 'bot',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, introMessage]);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentRole('');
    onNewChat?.();
  };

  const renderMessages = () => {
    return messages.map((message) => {
      const isBot = message.sender === 'bot';
      const isExpanded = expandedMessages[message.id];
      const shouldTruncate = message.text && message.text.length > 300;
      const displayText = shouldTruncate && !isExpanded 
        ? `${message.text.substring(0, 300)}...` 
        : message.text;

      return (
        <div 
          key={message.id} 
          className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-4`}
        >
          <div className={`relative max-w-[80%] ${isBot ? 'bg-gray-100' : 'bg-primary-500 text-white'} rounded-lg p-3 shadow`}>
            {message.image && (
              <div className="mb-2">
                <img 
                  src={message.image} 
                  alt="Shared content" 
                  className="rounded-lg max-w-full max-h-64 object-contain"
                />
              </div>
            )}
            
            <div className="whitespace-pre-wrap">{displayText}</div>
            
            {shouldTruncate && (
              <button 
                onClick={() => toggleMessageExpansion(message.id)}
                className={`text-xs underline mt-2 ${isBot ? 'text-primary-600' : 'text-white'}`}
              >
                {isExpanded ? 'View less' : 'View more'}
              </button>
            )}
            
            <div className={`absolute bottom-0 ${isBot ? 'left-0 -translate-x-2' : 'right-0 translate-x-2'} transform rotate-45 w-4 h-4 ${isBot ? 'bg-gray-100' : 'bg-primary-500'}`}></div>
            
            <div className={`flex space-x-2 mt-2 ${isBot ? 'justify-start' : 'justify-end'}`}>
              <button 
                onClick={() => handleCopyText(message.text)}
                className="text-xs opacity-70 hover:opacity-100 transition-opacity"
              >
                <FiCopy className="w-3 h-3" />
              </button>
              <button 
                onClick={() => handleShareMessage(message.text)}
                className="text-xs opacity-70 hover:opacity-100 transition-opacity"
              >
                <FiShare2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <div className={`flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto ${version === 'enterprise' ? 'bg-gray-50' : 'bg-white'} rounded-lg shadow-lg overflow-hidden`}>
      {/* Chat header */}
      <div className={`flex items-center px-4 py-3 border-b ${version === 'enterprise' ? 'bg-primary-700 text-white' : 'bg-primary-500 text-white'}`}>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">Matrix AI {version === 'enterprise' ? t('common.enterprise') || 'Enterprise' : t('common.assistant') || 'Assistant'}</h2>
          <p className="text-sm opacity-80">{currentRole ? `${t('common.role') || 'Role'}: ${roles.find(r => r.id === currentRole)?.emoji} ${roles.find(r => r.id === currentRole)?.name}` : t('common.generalAssistant') || 'General Assistant'}</p>
        </div>
        <button 
          onClick={handleNewChat}
          className={`px-3 py-1 rounded-full text-sm ${version === 'enterprise' ? 'bg-primary-800 hover:bg-primary-900' : 'bg-primary-600 hover:bg-primary-700'} transition-colors`}
        >
          {t('chat.newChat')}
        </button>
      </div>
      
      {/* Messages area */}
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-24 h-24 mb-6 opacity-80">
              <Lottie animationData={require('../assets/ai-animation.json')} loop />
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">{t('chat.welcomeToMatrixAI') || 'Welcome to Matrix AI'}</h3>
            <p className="text-gray-500 text-center mb-8 max-w-md">
              {version === 'enterprise' 
                ? t('chat.enterpriseDescription') || 'Your enterprise-grade AI assistant for advanced data insights and business intelligence.' 
                : t('chat.personalDescription') || 'Your personal AI assistant for everyday tasks and questions.'}
            </p>
            
            {messages.length === 0 && (
              <div className="w-full max-w-md">
                <h4 className="text-sm font-semibold text-gray-500 mb-2">{t('chat.selectSpecializedRole') || 'You can select a specialized role:'}</h4>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {roles.map(role => (
                    <button
                      key={role.id}
                      onClick={() => handleRoleSelection(role.id)}
                      className="flex flex-col items-center justify-center p-3 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
                    >
                      <span className="text-2xl mb-1">{role.emoji}</span>
                      <span className="font-medium text-sm">{role.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {renderMessages()}
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="bg-gray-100 rounded-lg p-4 shadow-sm max-w-[80%]">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      {/* Input area */}
      <div className="border-t border-gray-200 p-4">
        {selectedImage && (
          <div className="mb-3 bg-gray-100 rounded-lg p-2 flex items-center">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <FiImage className="text-primary-600" />
            </div>
            <span className="flex-1 px-3 truncate">Selected image</span>
            <button 
              onClick={handleClearImage}
              className="text-gray-500 hover:text-gray-700"
            >
              <FiX />
            </button>
          </div>
        )}
        
        <div className="flex items-end">
          <div className="flex-1 relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('chat.placeholder')}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={1}
              style={{ 
                minHeight: '2.5rem',
                maxHeight: '6rem',
                height: 'auto'
              }}
            />
          </div>
          
          <div className="flex ml-2">
            <button 
              onClick={handleAttach} 
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100"
            >
              {showAdditionalButtons ? (
                <FiX className="w-5 h-5" />
              ) : (
                <FiPlus className="w-5 h-5" />
              )}
            </button>
            
            <button 
              onClick={handleSendMessage}
              disabled={!inputText.trim() && !selectedImage}
              className={`ml-2 p-2 rounded-full ${(!inputText.trim() && !selectedImage) ? 'bg-gray-300 text-gray-500' : 'bg-primary-500 text-white hover:bg-primary-600'}`}
            >
              <FiSend className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <AnimatePresence>
          {showAdditionalButtons && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-2 overflow-hidden"
            >
              <div className="flex space-x-4 p-2">
                <button 
                  onClick={handleImageClick}
                  className="flex flex-col items-center justify-center p-3 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 w-20"
                >
                  <FiImage className="mb-1 text-primary-500" />
                  <span className="text-xs text-gray-700">Image</span>
                </button>
                
                <button className="flex flex-col items-center justify-center p-3 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 w-20">
                  <FiPaperclip className="mb-1 text-primary-500" />
                  <span className="text-xs text-gray-700">Document</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleImageUpload} 
          accept="image/*" 
          className="hidden" 
        />
      </div>
    </div>
  );
};

export default ChatBot; 
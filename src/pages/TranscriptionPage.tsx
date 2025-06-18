import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import OpenAI from 'openai';
import { 
  FiPlay, FiPause, FiDownload, FiCopy, FiShare2, 
  FiChevronLeft, FiChevronRight, FiRefreshCw, FiLoader,
  FiMaximize, FiMenu, FiLayout, FiSave, FiFileText,
  FiBarChart2, FiZap, FiSettings, FiBookmark, FiMic,
  FiMessageSquare, FiGlobe, FiToggleLeft, FiToggleRight
} from 'react-icons/fi';
import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import MindMapComponent from '../components/MindMapComponent';

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

const languages = [
  { label: 'Chinese (Simplified)', value: 'zh' },
  { label: 'Chinese (Traditional)', value: 'zh-TW' },
  { label: 'Spanish', value: 'es' },
  { label: 'French', value: 'fr' },
  { label: 'German', value: 'de' },
  { label: 'Hindi', value: 'hi' },
];

const TranscriptionPage: React.FC = () => {
  const { audioid } = useParams<{ audioid: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { isPro } = useUser();
  const { user } = useAuth();
  const { theme, getThemeColors } = useTheme();
  const uid = user?.id;
  const colors = getThemeColors();

  // Initialize OpenAI with Deepseek configuration
  const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: 'sk-fed0eb08e6ad4f1aabe2b0c27c643816',
    dangerouslyAllowBrowser: true // Allow running in browser environment
  });

  // Audio player state
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

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

  // UI state
  const [activeTab, setActiveTab] = useState<'transcript' | 'mindmap' | 'chat'>('transcript');
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Mind map state
  const [xmlData, setXmlData] = useState<string | null>(null);

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
  }
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isAssistantTyping, setIsAssistantTyping] = useState<boolean>(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Get state passed from the previous page
  const locationState = location.state as any;

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
        console.error('Translation data is not in the expected format:', data);
      }
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setTranslatingIndex(-1);
    }
  };

  // Toggle translation for all paragraphs
  const toggleTranslation = async () => {
    if (!isTranslationEnabled) {
      // Enable translation and translate all paragraphs
      setIsTranslationEnabled(true);
      setTranslations(new Array(paragraphs.length).fill(''));
      
      // Translate all paragraphs
      for (let i = 0; i < paragraphs.length; i++) {
        await handleTranslateParagraph(i);
      }
    } else {
      // Disable translation
      setIsTranslationEnabled(false);
      setTranslations([]);
    }
  };

  // Fetch transcription data
  useEffect(() => {
    if (uid && audioid) {
      fetchAudioMetadata(uid, audioid);
    } else if (locationState?.transcription && locationState?.audio_url) {
      // Use data passed from the previous page if available
      setTranscription(locationState.transcription);
      setAudioUrl(locationState.audio_url);
      processTranscription(locationState.transcription);
      setIsLoading(false);
    }
  }, [uid, audioid, locationState]);

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

  // Audio time update handler
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
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
          text: currentParagraph.map(w => w.word).join(' '),
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
        text: currentParagraph.map(w => w.word).join(' '),
        words: [...currentParagraph],
        startTime: currentParagraph[0]?.startTime || 0,
        endTime: currentParagraph[currentParagraph.length - 1]?.endTime || 0
      });
    }
    
    return { paragraphs, words: allWords };
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
            setDuration(parsed.duration || 0);
            
            if (parsed.paragraphs && parsed.paragraphs.length > 0) {
              setParagraphs(parsed.paragraphs);
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
      
      // If no cache or parsing error, fetch from API
      const response = await fetch('https://matrix-server.vercel.app/getAudioFile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uid, audioid }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Set state with fetched data
        setTranscription(data.transcription || '');
        setFileName(data.audio_name || 'Untitled');
        const audioDur = data.duration || 0;
        setDuration(audioDur);
        setAudioUrl(data.audio_url || '');

        // Check if xmlData is available
        if (data.xmlData) {
          setXmlData(data.xmlData);
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
        
        // Cache the data
        localStorage.setItem(`audioData-${audioid}`, JSON.stringify({
          transcription: data.transcription || '',
          audioUrl: data.audio_url || '',
          duration: audioDur,
          paragraphs: paragraphs,
          xmlData: data.xmlData || null,
        }));
      } else {
        console.error('Error fetching audio metadata:', data.error);
        alert('Failed to load audio data');
      }
    } catch (error) {
      console.error('Error in fetchAudioMetadata:', error);
      alert('An unexpected error occurred while loading audio data');
    } finally {
      setIsLoading(false);
    }
  };

  // Audio control functions
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
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

  const copyTranscription = () => {
    navigator.clipboard.writeText(transcription);
    // Could show a toast notification here
    alert('Transcription copied to clipboard!');
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

  // Function to handle quick actions with formatted responses
  const handleQuickAction = async (action: 'keypoints' | 'summary' | 'translate') => {
    if (!transcription || isChatProcessing[action]) return;
    
    setIsChatProcessing({...isChatProcessing, [action]: true});
    
    try {
      let prompt = '';
      switch(action) {
        case 'keypoints':
          prompt = `Extract the key points from this transcription. Format the response with a main heading "Key Points", and use bullet points for each key point. Group related points under appropriate subheadings if possible:\n\n${transcription}`;
          break;
        case 'summary':
          prompt = `Provide a concise summary of this transcription. Format with a main heading "Summary", followed by an "Overview" section. Then include sections for "Main Topics", "Key Insights", and "Conclusion" as appropriate:\n\n${transcription}`;
          break;
        case 'translate':
          prompt = `Translate this transcription to ${translationLanguage}. Maintain the structure of the original text as much as possible, using headings, paragraphs and formatting to enhance readability:\n\n${transcription}`;
          break;
      }
      
      // Using the Deepseek API to process the request
      const response = await openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          { 
            role: 'system', 
            content: 'You are a helpful assistant. Format your responses with proper markdown - use headings (# for main headings, ## for subheadings), bullet points, numbered lists, and emphasis where it enhances readability.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000
      });
      
      const result = response.choices[0]?.message?.content || 'No response generated.';
      setChatResponses({...chatResponses, [action]: result});
    } catch (error) {
      console.error(`Error in ${action} quick action:`, error);
      setChatResponses({...chatResponses, [action]: `Error: Could not process ${action} request.`});
    } finally {
      setIsChatProcessing({...isChatProcessing, [action]: false});
    }
  };

  // Function to handle user chat messages
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!chatInput.trim() || isAssistantTyping) return;
    
    // Add user message to chat
    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput.trim(),
      timestamp: Date.now()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput(''); // Clear input
    setIsAssistantTyping(true);
    
    try {
      // Using the Deepseek API for chat
      const response = await openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          { 
            role: 'system', 
            content: 'You are a helpful assistant. The user is discussing a transcription of audio content. Format your responses with proper markdown when appropriate - use headings (# for main headings, ## for subheadings), bullet points, numbered lists, and emphasis where it enhances readability. Well-structured responses with clear headings are preferred.'
          },
          ...chatMessages.map(msg => ({ 
            role: msg.role as 'user' | 'assistant', 
            content: msg.content 
          })),
          { role: 'user', content: chatInput.trim() }
        ],
        max_tokens: 1000
      });
      
      // Get assistant response
      const assistantResponse = response.choices[0]?.message?.content || 'I apologize, but I am unable to provide a response at this time.';
      
      // Add assistant message to chat
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: assistantResponse,
        timestamp: Date.now()
      };
      
      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error in chat:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error while processing your request. Please try again.',
        timestamp: Date.now()
      };
      
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAssistantTyping(false);
    }
  };
  
  // Function to reset chat
  const resetChat = () => {
    if (chatMessages.length > 0 && window.confirm('Are you sure you want to clear the chat history?')) {
      setChatMessages([]);
    }
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
        content: 'I have received the transcription. What would you like to know or discuss about it?',
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
  const handleXmlDataGenerated = (newXmlData: string) => {
    setXmlData(newXmlData);
    
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

  return (
    <div className={`min-h-screen bg-gradient-to-br ${
      theme === 'dark' 
        ? 'from-gray-900 via-gray-800 to-gray-900' 
        : 'from-gray-50 via-blue-50 to-gray-50'
    }`}>
      <div className="container mx-auto max-w-7xl px-4 md:px-6 py-6 pb-0">
        {/* Header with title and controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl md:text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
            >
              Transcription
            </motion.h1>
            {fileName && (
              <motion.p 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-gray-500 dark:text-gray-400"
              >
                {fileName}
              </motion.p>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2 mt-3 md:mt-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className="px-3 md:px-4 py-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all flex items-center dark:text-gray-200 text-sm md:text-base"
            >
              <FiChevronLeft className="mr-1" /> Back
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/speech-to-text')}
              className="px-3 md:px-4 py-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all flex items-center dark:text-gray-200 text-sm md:text-base"
            >
              <FiMic className="mr-1" /> Speech to Text
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all text-gray-700 dark:text-gray-200"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              <FiMaximize />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all text-gray-700 dark:text-gray-200"
              title="Settings"
            >
              <FiSettings />
            </motion.button>
          </div>
        </div>

        {/* Main tabs */}
        <div className="mb-6 flex items-center border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <button
            onClick={() => setActiveTab('transcript')}
            className={`py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'transcript' 
                ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <span className="flex items-center"><FiFileText className="mr-2" /> Transcript</span>
          </button>
          <button
            onClick={() => setActiveTab('mindmap')}
            className={`py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'mindmap' 
                ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <span className="flex items-center"><FiBarChart2 className="mr-2" /> Mind Map</span>
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'chat' 
                ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <span className="flex items-center"><FiMessageSquare className="mr-2" /> Chat</span>
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <FiLoader className="animate-spin h-10 w-10 text-blue-500 mb-4" />
              <span className="text-gray-600 dark:text-gray-400">Loading transcription...</span>
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
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Audio Transcription</h2>
                    <div className="flex space-x-2">
                      <button 
                        onClick={copyTranscription}
                        className="p-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                        title="Copy transcription"
                      >
                        <FiCopy />
                      </button>
                      <button 
                        className="p-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors" 
                        title="Share"
                      >
                        <FiShare2 />
                      </button>
                      <button 
                        onClick={downloadAudio}
                        className="p-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors" 
                        title="Download audio"
                      >
                        <FiDownload />
                      </button>
                    </div>
                  </div>

                  {/* Translation Controls */}
                  <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={toggleTranslation}
                          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                            isTranslationEnabled
                              ? 'bg-green-500 hover:bg-green-600 text-white'
                              : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200'
                          }`}
                          disabled={translatingIndex !== -1}
                        >
                          <FiGlobe className="w-4 h-4" />
                          {isTranslationEnabled ? (
                            <FiToggleRight className="w-5 h-5" />
                          ) : (
                            <FiToggleLeft className="w-5 h-5" />
                          )}
                          <span>{isTranslationEnabled ? 'Translation On' : 'Enable Translation'}</span>
                        </button>
                        
                        <select
                          value={selectedLanguage}
                          onChange={(e) => setSelectedLanguage(e.target.value)}
                          className="px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                          <FiLoader className="animate-spin w-4 h-4" />
                          <span className="text-sm">Translating paragraph {translatingIndex + 1}...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Transcription text with word highlighting and translations */}
                  <div className="overflow-auto h-[calc(100vh-400px)] p-4 font-medium leading-relaxed text-gray-700 dark:text-gray-300">
                    {paragraphs.map((paragraph, paraIndex) => (
                      <div key={paraIndex} className="mb-6">
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
                                onClick={() => handleWordClick(word)}
                              >
                                {word.word}{' '}
                              </span>
                            );
                          })}
                        </p>
                        
                        {/* Translated paragraph */}
                        {isTranslationEnabled && translations[paraIndex] && (
                          <div className="ml-4 pl-4 border-l-4 border-green-400 dark:border-green-500">
                            <div className="flex items-center mb-2">
                              <FiGlobe className="w-4 h-4 text-green-600 dark:text-green-400 mr-2" />
                              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                {languages.find(lang => lang.value === selectedLanguage)?.label}
                              </span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 italic leading-relaxed">
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
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col h-[calc(100vh-200px)]"
                >
                  {/* Fixed Header */}
                  <div className="flex justify-between items-center p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800 z-20 sticky top-0">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Chat Assistant</h2>
                    <div className="flex space-x-2">
                      <button 
                        onClick={resetChat} 
                        className="p-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                        title="Clear chat"
                      >
                        <FiRefreshCw />
                      </button>
                      <button 
                        onClick={() => setShowSidebar(!showSidebar)}
                        className="p-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors" 
                        title={showSidebar ? "Hide sidebar" : "Show sidebar"}
                      >
                        <FiLayout />
                      </button>
                    </div>
                  </div>

                  {/* Quick Actions - Fixed below header */}
                  <div className="p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800 z-10 sticky top-[67px]">
                    <h3 className="text-lg font-medium mb-3 dark:text-gray-300">Quick Actions</h3>
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
                        Key Points
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
                        Quick Summary
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
                          Translate
                        </button>
                        
                        <select
                          value={translationLanguage}
                          onChange={(e) => setTranslationLanguage(e.target.value)}
                          className="ml-2 px-2 py-1 text-xs sm:text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300"
                        >
                          <option value="Spanish">Spanish</option>
                          <option value="French">French</option>
                          <option value="German">German</option>
                          <option value="Chinese">Chinese</option>
                          <option value="Japanese">Japanese</option>
                          <option value="Hindi">Hindi</option>
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
                        Use as Context
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
                            <div className="text-gray-700 dark:text-gray-300 prose prose-sm max-w-none dark:prose-invert">
                              <ReactMarkdown 
                                rehypePlugins={[rehypeRaw]} 
                                remarkPlugins={[remarkGfm]}
                              >
                                {chatResponses.keypoints}
                              </ReactMarkdown>
                            </div>
                          </div>
                        )}
                        
                        {chatResponses.summary && (
                          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                            <h4 className="font-medium text-purple-700 dark:text-purple-400 mb-2 flex items-center">
                              <FiFileText className="mr-2" /> Summary
                            </h4>
                            <div className="text-gray-700 dark:text-gray-300 prose prose-sm max-w-none dark:prose-invert">
                              <ReactMarkdown 
                                rehypePlugins={[rehypeRaw]} 
                                remarkPlugins={[remarkGfm]}
                              >
                                {chatResponses.summary}
                              </ReactMarkdown>
                            </div>
                          </div>
                        )}
                        
                        {chatResponses.translate && (
                          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                            <h4 className="font-medium text-green-700 dark:text-green-400 mb-2 flex items-center">
                              <FiBookmark className="mr-2" /> Translation ({translationLanguage})
                            </h4>
                            <div className="text-gray-700 dark:text-gray-300 prose prose-sm max-w-none dark:prose-invert">
                              <ReactMarkdown 
                                rehypePlugins={[rehypeRaw]} 
                                remarkPlugins={[remarkGfm]}
                              >
                                {chatResponses.translate}
                              </ReactMarkdown>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Chat Messages */}
                    {chatMessages.length > 0 ? (
                      <div className="space-y-4">
                        {chatMessages.map((message, index) => (
                          <div 
                            key={index}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div 
                              className={`max-w-3/4 md:max-w-[70%] rounded-lg px-4 py-3 ${
                                message.role === 'user' 
                                  ? 'bg-blue-500 text-white' 
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                              }`}
                            >
                              <div className="text-sm mb-1">
                                {message.role === 'user' ? 'You' : 'Assistant'} • {formatTimestamp(message.timestamp)}
                              </div>
                              <div className={`${message.role === 'assistant' ? 'prose prose-sm max-w-none dark:prose-invert prose-headings:text-gray-800 dark:prose-headings:text-gray-200 prose-h1:text-lg prose-h2:text-base prose-h3:text-sm prose-p:my-1 prose-li:my-0 prose-ul:my-1 prose-ol:my-1' : 'whitespace-pre-wrap'}`}>
                                {message.role === 'assistant' ? (
                                  <ReactMarkdown 
                                    rehypePlugins={[rehypeRaw]} 
                                    remarkPlugins={[remarkGfm]}
                                  >
                                    {message.content}
                                  </ReactMarkdown>
                                ) : (
                                  message.content
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {isAssistantTyping && (
                          <div className="flex justify-start">
                            <div className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg px-4 py-3">
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-75"></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-150"></div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      !chatResponses.keypoints && !chatResponses.summary && !chatResponses.translate && (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                          <FiMessageSquare className="w-12 h-12 mb-4" />
                          <p>Start chatting or use the quick actions above</p>
                        </div>
                      )
                    )}
                  </div>
                  
                  {/* Chat input area - Fixed at the bottom */}
                  <div className="border-t dark:border-gray-700 p-4 bg-white dark:bg-gray-800 z-10 sticky bottom-0 shadow-md">
                    <form onSubmit={handleChatSubmit} className="flex space-x-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200"
                        disabled={isAssistantTyping}
                      />
                      <button
                        type="submit"
                        disabled={!chatInput.trim() || isAssistantTyping}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          !chatInput.trim() || isAssistantTyping
                            ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                      >
                        {isAssistantTyping ? (
                          <FiLoader className="animate-spin" />
                        ) : (
                          'Send'
                        )}
                      </button>
                    </form>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Sidebar / Audio player panel */}
            {showSidebar && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="lg:col-span-1"
              >
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                  <div className="p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Audio Controls</h2>
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
                  
                  {/* Audio element (hidden) */}
                  <audio 
                    ref={audioRef}
                    src={audioUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onDurationChange={() => audioRef.current && setDuration(audioRef.current.duration)}
                    onEnded={() => setIsPlaying(false)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />

                  {/* Audio controls */}
                  <div className="px-4 pb-4">
                    <div className="flex items-center mb-3">
                      <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 w-10 sm:w-12">
                        {formatTime(currentTime)}
                      </span>
                      <input
                        type="range"
                        min="0"
                        max={duration}
                        value={currentTime}
                        onChange={handleProgressChange}
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
                          onClick={() => seekTo(Math.max(0, currentTime - 5))}
                          className="p-1 sm:p-2 text-gray-600 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400 focus:outline-none transition-colors"
                          title="Back 5 seconds"
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
                          onClick={() => seekTo(Math.min(duration, currentTime + 5))}
                          className="p-1 sm:p-2 text-gray-600 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400 focus:outline-none transition-colors"
                          title="Forward 5 seconds"
                        >
                          <FiChevronRight size={16} className="sm:h-5 sm:w-5" />
                        </button>
                      </div>

                      {/* Playback rate controls */}
                      <div className="flex space-x-1">
                        {[0.5, 1, 1.5, 2].map(rate => (
                          <button 
                            key={rate}
                            onClick={() => handlePlaybackRateChange(rate)}
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

                    {/* Audio information */}
                    <div className="border-t dark:border-gray-700 pt-4 mt-4">
                      <h3 className="text-lg font-medium mb-3 dark:text-gray-300">Audio Information</h3>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-gray-600 dark:text-gray-400">Duration:</div>
                        <div className="text-gray-800 dark:text-gray-200 font-medium">{formatTime(duration)}</div>
                        
                        <div className="text-gray-600 dark:text-gray-400">Language:</div>
                        <div className="text-gray-800 dark:text-gray-200 font-medium">
                          {locationState?.language || 'English'}
                        </div>
                        
                        <div className="text-gray-600 dark:text-gray-400">Words:</div>
                        <div className="text-gray-800 dark:text-gray-200 font-medium">{wordTimings.length}</div>
                      </div>

                      <div className="flex flex-col space-y-3 mt-6">
                        <button 
                          onClick={downloadAudio} 
                          className="w-full flex items-center justify-center px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors"
                        >
                          <FiDownload className="mr-2" />
                          Download Audio
                        </button>
                        
                        <button 
                          onClick={() => {
                            if (window.confirm('Are you sure you want to regenerate the transcription? This may take a moment.')) {
                              // Implementation for regeneration
                              alert('Transcription regeneration initiated');
                            }
                          }}
                          className="w-full flex items-center justify-center px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors"
                        >
                          <FiRefreshCw className="mr-2" />
                          Regenerate Transcription
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
    </div>
  );
};

export default TranscriptionPage; 
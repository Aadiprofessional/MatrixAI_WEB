import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import OpenAI from 'openai';
import { 
  FiPlay, FiPause, FiDownload, FiCopy, FiShare2, 
  FiChevronLeft, FiChevronRight, FiRefreshCw, FiLoader,
  FiMaximize, FiMenu, FiLayout, FiSave, FiFileText,
  FiBarChart2, FiZap, FiSettings, FiBookmark, FiMic
} from 'react-icons/fi';
import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

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

interface MindMapNode {
  name: string;
  children?: MindMapNode[];
}

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

  // UI state
  const [activeTab, setActiveTab] = useState<'transcript' | 'mindmap'>('transcript');
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isGeneratingMindMap, setIsGeneratingMindMap] = useState<boolean>(false);

  // Mind map state
  const [mindMapData, setMindMapData] = useState<MindMapNode[]>([]);
  const [xmlData, setXmlData] = useState<string | null>(null);
  const [isMindMapLoading, setIsMindMapLoading] = useState<boolean>(false);
  const mindMapContainerRef = useRef<HTMLDivElement>(null);

  // Get state passed from the previous page
  const locationState = location.state as any;

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
      // Generate mind map from transcript if none exists
      if (locationState.transcription) {
        generateMindMap(locationState.transcription);
      }
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

  // Generate XML data using server endpoint
  const fetchGraphData = async (transcriptionText: string) => {
    if (!transcriptionText || !uid || !audioid) return;
    
    setIsGeneratingMindMap(true);
    try {
      // Use server endpoint instead of direct OpenAI API call
      const response = await axios.post('https://matrix-server.vercel.app/generateMindMap', {
        transcription: transcriptionText,
        uid: uid,
        audioid: audioid,
        useDeepseek: true // Indicate to use Deepseek model on server
      });
      
      if (response.data && response.data.xmlData) {
        const content = response.data.xmlData;
        console.log('XML Response from API:', content);
        setXmlData(content);
        parseXmlData(content);
        sendXmlGraphData(content);
      } else {
        console.error('No valid response from API');
        // Fallback to client-side generation if API fails
        generateClientSideMindMap(transcriptionText);
      }
    } catch (error) {
      console.error('Error fetching graph data:', error);
      // Fallback to client-side generation
      generateClientSideMindMap(transcriptionText);
    } finally {
      setIsGeneratingMindMap(false);
    }
  };

  // Send XML data to server
  const sendXmlGraphData = async (xmlDataToSend: string) => {
    if (!xmlDataToSend || !uid || !audioid) {
      console.error('No XML data available to send or missing uid/audioid.');
      return;
    }

    try {
      const response = await axios.post('https://matrix-server.vercel.app/sendXmlGraph', {
        uid,
        audioid,
        xmlData: xmlDataToSend,
      });
      console.log('XML Graph Data Sent:', response.data);
      console.log('Sending XML to Database:', xmlDataToSend);
      
      // Refetch audio metadata to ensure we have the latest data
      fetchAudioMetadata(uid, audioid);
    } catch (error) {
      console.error('Error sending XML Graph Data:', error);
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

  // Mind map generation functions
  const generateMindMap = async (text: string) => {
    if (!text || text.trim().length === 0) return;
    
    setIsMindMapLoading(true);
    
    try {
      // First check if we have XML data from audio metadata
      if (xmlData) {
        parseXmlData(xmlData);
        setIsMindMapLoading(false);
        return;
      }
      
      // Try to fetch XML data from the server
      if (uid && audioid) {
        const response = await axios.post('https://matrix-server.vercel.app/getXmlGraph', {
          uid,
          audioid
        });
        
        if (response.data && response.data.xmlData) {
          setXmlData(response.data.xmlData);
          parseXmlData(response.data.xmlData);
          setIsMindMapLoading(false);
          return;
        }
      }
      
      // If we don't have XML data yet, generate it using Deepseek
      await fetchGraphData(text);
    } catch (error) {
      console.error('Error generating mind map:', error);
      // Fallback to client-side generation
      generateClientSideMindMap(text);
    } finally {
      setIsMindMapLoading(false);
    }
  };
  
  const fetchXmlData = async (uid: string, audioid: string) => {
    try {
      const response = await axios.post('https://matrix-server.vercel.app/getXmlGraph', {
        uid,
        audioid
      });
      
      if (response.data && response.data.xmlData) {
        setXmlData(response.data.xmlData);
        parseXmlData(response.data.xmlData);
      }
    } catch (error) {
      console.error('Error fetching XML data:', error);
    }
  };
  
  const parseXmlData = (xmlString: string) => {
    const parser = new XMLParser({ 
      ignoreAttributes: false, 
      removeNSPrefix: true, 
      parseTagValue: true 
    });
    
    try {
      const jsonData = parser.parse(xmlString);
      const formattedData = formatGraphData(jsonData);
      if (formattedData) {
        setMindMapData(formattedData);
      }
    } catch (err) {
      console.error('Error parsing XML:', err);
    }
  };
  
  const formatGraphData = (root: any): MindMapNode[] => {
    const formatNode = (node: any, name = 'Root'): MindMapNode | null => {
      const formattedNode: MindMapNode = { name, children: [] };

      if (node['#text'] || node['?xml']) return null;

      if (node.meeting && node.meeting.topic) {
        const topics = Array.isArray(node.meeting.topic) ? node.meeting.topic : [node.meeting.topic];
        topics.forEach((topic: any, index: number) => {
          const topicNode: MindMapNode = { 
            name: topic['@_name'] || `Topic ${index + 1}`, 
            children: [] 
          };
          
          if (topic.description) {
            topicNode.children?.push({ name: topic.description });
          }
          
          if (topic.subtopic) {
            const subtopics = Array.isArray(topic.subtopic) ? topic.subtopic : [topic.subtopic];
            subtopics.forEach((subtopic: any) => {
              const subtopicNode: MindMapNode = { 
                name: subtopic['@_name'], 
                children: [] 
              };
              
              if (subtopic.description) {
                subtopicNode.children?.push({ name: subtopic.description });
              }
              
              if (subtopic.action_items?.item) {
                const items = Array.isArray(subtopic.action_items.item) 
                  ? subtopic.action_items.item 
                  : [subtopic.action_items.item];
                  
                items.forEach((item: string) => {
                  subtopicNode.children?.push({ name: item });
                });
              }
              
              topicNode.children?.push(subtopicNode);
            });
          }
          
          formattedNode.children?.push(topicNode);
        });
        
        return formattedNode;
      }

      Object.entries(node).forEach(([key, value]) => {
        if (typeof value === 'object') {
          const child = formatNode(value as any, key);
          if (child) formattedNode.children?.push(child);
        } else {
          formattedNode.children?.push({ 
            name: key, 
            children: [{ name: String(value) }] 
          });
        }
      });
      
      return formattedNode;
    };

    return root ? [formatNode(root) as MindMapNode] : [];
  };
  
  // Generate a simple mind map on the client side as fallback
  const generateClientSideMindMap = (text: string) => {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const topics: Record<string, string[]> = {};
    
    // Basic topic extraction (very simplified)
    sentences.forEach(sentence => {
      const words = sentence.trim().split(/\s+/);
      if (words.length > 3) {
        const potentialTopic = words.slice(0, 3).join(' ');
        if (!topics[potentialTopic]) {
          topics[potentialTopic] = [];
        }
        topics[potentialTopic].push(sentence);
      }
    });
    
    // Convert to mind map format
    const mindMapRoot: MindMapNode = {
      name: fileName || 'Transcript',
      children: []
    };
    
    Object.entries(topics).forEach(([topic, relatedSentences], index) => {
      if (index < 10) { // Limit to 10 topics for simplicity
        const topicNode: MindMapNode = {
          name: topic,
          children: []
        };
        
        relatedSentences.slice(0, 3).forEach(sentence => {
          topicNode.children?.push({
            name: sentence.trim()
          });
        });
        
        mindMapRoot.children?.push(topicNode);
      }
    });
    
    setMindMapData([mindMapRoot]);
  };

  // Save mind map as XML
  const saveMindMapXml = async () => {
    if (!xmlData || !uid || !audioid) return;
    
    try {
      const response = await axios.post('https://matrix-server.vercel.app/sendXmlGraph', {
        uid,
        audioid,
        xmlData,
      });
      
      console.log('Mind map saved successfully:', response.data);
      alert('Mind map saved successfully!');
    } catch (error) {
      console.error('Error saving mind map:', error);
      alert('Failed to save mind map.');
    }
  };

  // Download mind map as PDF
  const downloadMindMapPdf = async () => {
    setIsDownloading(true);
    
    try {
      const response = await axios.post('https://matrix-server.vercel.app/generateMindMapPdf', {
        uid,
        audioid,
        xmlData: xmlData || JSON.stringify(mindMapData)
      }, {
        responseType: 'blob'
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `mindmap_${audioid || Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
    } catch (error) {
      console.error('Error downloading mind map PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };
  
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

  return (
    <div className={`min-h-screen bg-gradient-to-br ${
      theme === 'dark' 
        ? 'from-gray-900 via-gray-800 to-gray-900' 
        : 'from-gray-50 via-blue-50 to-gray-50'
    }`}>
      <div className="container mx-auto max-w-7xl p-4 py-6">
        {/* Header with title and controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
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
          
          <div className="flex space-x-2 mt-3 md:mt-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all flex items-center dark:text-gray-200"
            >
              <FiChevronLeft className="mr-1" /> Back
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/speech-to-text')}
              className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all flex items-center dark:text-gray-200"
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
        <div className="mb-6 flex items-center border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('transcript')}
            className={`py-3 px-4 border-b-2 font-medium text-sm ${
              activeTab === 'transcript' 
                ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <span className="flex items-center"><FiFileText className="mr-2" /> Transcript</span>
          </button>
          <button
            onClick={() => setActiveTab('mindmap')}
            className={`py-3 px-4 border-b-2 font-medium text-sm ${
              activeTab === 'mindmap' 
                ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <span className="flex items-center"><FiBarChart2 className="mr-2" /> Mind Map</span>
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

                  {/* Transcription text with word highlighting */}
                  <div className="overflow-auto h-[calc(100vh-300px)] p-4 font-medium leading-relaxed text-gray-700 dark:text-gray-300">
                    {paragraphs.map((paragraph, paraIndex) => (
                      <p 
                        key={paraIndex}
                        className={`mb-4 rounded-lg transition-all duration-200 ${
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
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Mind Map Tab */}
              {activeTab === 'mindmap' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
                >
                  <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Mind Map Visualization</h2>
                    <div className="flex space-x-2">
                      <button 
                        onClick={saveMindMapXml}
                        className="p-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                        title="Save mind map"
                      >
                        <FiSave />
                      </button>
                      <button 
                        onClick={downloadMindMapPdf}
                        disabled={isDownloading}
                        className={`p-2 ${
                          isDownloading
                            ? 'text-gray-400 dark:text-gray-600'
                            : 'text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400'
                        } transition-colors`}
                        title="Download as PDF"
                      >
                        {isDownloading ? <FiLoader className="animate-spin" /> : <FiDownload />}
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

                  {/* Mind Map Visualization */}
                  <div 
                    ref={mindMapContainerRef}
                    className="overflow-auto h-[calc(100vh-300px)] p-4"
                  >
                    {isGeneratingMindMap ? (
                      <div className="flex justify-center items-center h-64">
                        <div className="flex flex-col items-center">
                          <FiLoader className="animate-spin h-10 w-10 text-blue-500 mb-4" />
                          <span className="text-gray-600 dark:text-gray-400">Generating mind map...</span>
                        </div>
                      </div>
                    ) : mindMapData.length > 0 ? (
                      <div className="p-4 min-h-[500px]">
                        <iframe 
                          src={`data:text/html;charset=utf-8,${encodeURIComponent(`
                            <!DOCTYPE html>
                            <html>
                            <head>
                              <meta charset="utf-8">
                              <script src="https://cdn.jsdelivr.net/npm/echarts/dist/echarts.min.js"></script>
                              <style>
                                body { 
                                  margin: 0; 
                                  padding: 0; 
                                  background: ${theme === 'dark' ? '#1f2937' : '#ffffff'};
                                  width: 100%;
                                  height: 100%;
                                  overflow: hidden;
                                }
                                #chart { 
                                  width: 100%; 
                                  height: 100%;
                                  min-height: 600px;
                                }
                              </style>
                            </head>
                            <body>
                              <div id="chart"></div>
                              <script>
                                const chartDom = document.getElementById('chart');
                                const myChart = echarts.init(chartDom);
                                const colors = ['#5470C6', '#91CC75', '#EE6666', '#FAC858', '#73C0DE', '#3BA272', '#FC8452', '#9A60B4', '#EA7CCC'];
                                
                                function assignColors(node, index = 0) {
                                  node.lineStyle = { color: colors[index % colors.length] };
                                  if (node.children) {
                                    node.children.forEach((child, idx) => assignColors(child, idx));
                                  }
                                  return node;
                                }
                                
                                const graphData = ${JSON.stringify(mindMapData)};
                                const coloredGraphData = graphData.map((node, idx) => assignColors(node, idx));
                                
                                // Function to wrap text into multiple lines
                                function wrapText(text, nodeType) {
                                  let maxLineLength = 20; // Default for topic and subtopic nodes
                                  if (nodeType === 'description') {
                                    maxLineLength = 45; // For description nodes
                                  }
                              
                                  const words = text.split(' ');
                                  const lines = [];
                                  let currentLine = '';
                              
                                  words.forEach(word => {
                                    if ((currentLine + word).length > maxLineLength) {
                                      lines.push(currentLine.trim());
                                      currentLine = word + ' ';
                                    } else {
                                      currentLine += word + ' ';
                                    }
                                  });
                              
                                  if (currentLine.trim()) {
                                    lines.push(currentLine.trim());
                                  }
                              
                                  return lines.join('\\n');
                                }
                                
                                const option = {
                                  tooltip: { 
                                    trigger: 'item', 
                                    triggerOn: 'mousemove',
                                    backgroundColor: '${theme === 'dark' ? '#374151' : '#ffffff'}',
                                    borderColor: '${theme === 'dark' ? '#6b7280' : '#e5e7eb'}',
                                    textStyle: {
                                      color: '${theme === 'dark' ? '#e5e7eb' : '#111827'}'
                                    }
                                  },
                                  series: [{
                                    type: 'tree',
                                    data: coloredGraphData,
                                    top: '5%',
                                    left: '10%',
                                    bottom: '5%',
                                    right: '10%',
                                    symbolSize: 12,
                                    orient: 'LR',
                                    roam: true,
                                    initialTreeDepth: -1,
                                    label: {
                                      position: 'left',
                                      verticalAlign: 'middle',
                                      align: 'right',
                                      fontSize: 14,
                                      color: '${theme === 'dark' ? '#e5e7eb' : '#111827'}',
                                      formatter: (params) => {
                                        const nodeType = params.data.nodeType || 'topic';
                                        return wrapText(params.name, nodeType);
                                      }
                                    },
                                    leaves: {
                                      label: {
                                        position: 'right',
                                        verticalAlign: 'middle',
                                        align: 'left',
                                        color: '${theme === 'dark' ? '#d1d5db' : '#374151'}',
                                        formatter: (params) => {
                                          const nodeType = params.data.nodeType || 'description';
                                          return wrapText(params.name, nodeType);
                                        }
                                      }
                                    },
                                    emphasis: { 
                                      focus: 'descendant',
                                      itemStyle: {
                                        shadowBlur: 10,
                                        shadowColor: 'rgba(0, 0, 0, 0.3)'
                                      }
                                    },
                                    expandAndCollapse: true,
                                    animationDuration: 550,
                                    animationEasing: 'cubicOut',
                                    lineStyle: {
                                      width: 2,
                                      curveness: 0.5
                                    },
                                    force: {
                                      repulsion: 500,
                                      gravity: 0.1,
                                      edgeLength: 200,
                                      layoutAnimation: true
                                    },
                                    nodeGap: 60,
                                    itemStyle: {
                                      borderWidth: 2,
                                      shadowColor: 'rgba(0, 0, 0, 0.3)',
                                      shadowBlur: 5
                                    }
                                  }]
                                };
                                
                                myChart.setOption(option);
                                
                                window.addEventListener('resize', function() {
                                  myChart.resize();
                                });
                              </script>
                            </body>
                            </html>
                          `)}`}
                          style={{ width: '100%', height: '600px', border: 'none' }}
                          title="Mind Map Visualization"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-64">
                        <p className="text-gray-500 dark:text-gray-400 mb-4">No mind map data available</p>
                        <button
                          onClick={() => generateMindMap(transcription)}
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center"
                        >
                          <FiZap className="mr-2" /> Generate Mind Map
                        </button>
                      </div>
                    )}
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
                  <div className="relative h-20 m-4 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
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
                      <span className="text-sm text-gray-500 dark:text-gray-400 w-12">
                        {formatTime(currentTime)}
                      </span>
                      <input
                        type="range"
                        min="0"
                        max={duration}
                        value={currentTime}
                        onChange={handleProgressChange}
                        step="0.1"
                        className="flex-1 mx-3 accent-blue-500 h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700"
                      />
                      <span className="text-sm text-gray-500 dark:text-gray-400 w-12 text-right">
                        {formatTime(duration)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center mb-6">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => seekTo(Math.max(0, currentTime - 5))}
                          className="p-2 text-gray-600 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400 focus:outline-none transition-colors"
                          title="Back 5 seconds"
                        >
                          <FiChevronLeft size={20} />
                        </button>
                        <button 
                          onClick={togglePlayPause}
                          className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-full focus:outline-none shadow-md hover:shadow-lg transition-all"
                        >
                          {isPlaying ? <FiPause size={24} /> : <FiPlay size={24} className="ml-1" />}
                        </button>
                        <button 
                          onClick={() => seekTo(Math.min(duration, currentTime + 5))}
                          className="p-2 text-gray-600 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400 focus:outline-none transition-colors"
                          title="Forward 5 seconds"
                        >
                          <FiChevronRight size={20} />
                        </button>
                      </div>

                      {/* Playback rate controls */}
                      <div className="flex space-x-1">
                        {[0.5, 1, 1.5, 2].map(rate => (
                          <button 
                            key={rate}
                            onClick={() => handlePlaybackRateChange(rate)}
                            className={`px-2 py-1 text-xs rounded-full font-medium transition-colors ${
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
                          onClick={() => generateMindMap(transcription)}
                          disabled={isGeneratingMindMap}
                          className="w-full flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-lg shadow-sm hover:shadow-md transition-all"
                        >
                          {isGeneratingMindMap ? (
                            <>
                              <FiLoader className="animate-spin mr-2" />
                              Generating Mind Map...
                            </>
                          ) : (
                            <>
                              <FiBarChart2 className="mr-2" />
                              Regenerate Mind Map
                            </>
                          )}
                        </button>
                        
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
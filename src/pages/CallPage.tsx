import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiMic, FiMicOff, FiArrowLeft, FiPhoneOff, FiLoader, FiRefreshCw, FiVolume2, FiVolumeX, FiMaximize2, FiMinimize2, FiEye, FiEyeOff } from 'react-icons/fi';
import { Link } from 'react-router-dom';
// @ts-ignore
import Lottie from 'react-lottie-player';
import matrixAnimation from '../assets/Animation - 1740689806927.json';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';
import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';

// Initialize markdown parser with proper configuration
const md = new MarkdownIt({
  html: false,
  breaks: true,
  linkify: true,
  typographer: true
});

// Interface for chat messages
interface ChatMessage {
  id: string;
  text: string;
  sender: 'ai' | 'user';
  timestamp: Date;
}

// Declare the browser-specific SpeechRecognition interfaces
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
  emma: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechGrammarList {
  addFromString(string: string, weight?: number): void;
  addFromURI(src: string, weight?: number): void;
  readonly length: number;
  item(index: number): any;
  [index: number]: any;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  grammars: SpeechGrammarList;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: Event) => any) | null;
  onnomatch: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new(): SpeechRecognition;
  prototype: SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

const CallPage: React.FC = () => {
  const { darkMode } = useTheme();
  const [isListening, setIsListening] = useState(false);
  const [processingResponse, setProcessingResponse] = useState(false);
  const [aiMessage, setAiMessage] = useState("Hello! I'm your MatrixAI assistant. How can I help you today?");
  const [speaking, setSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [networkErrorOccurred, setNetworkErrorOccurred] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showTranscript, setShowTranscript] = useState(true);
  const [expandChat, setExpandChat] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  
  const MAX_RETRIES = 3;
  const SILENCE_TIMEOUT = 1000; // 2 seconds of silence before stopping
  
  const animationRef = useRef<any>(null);
  const recognizerRef = useRef<SpeechRecognition | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const finalTranscriptRef = useRef('');
  const lastSpeechTimestampRef = useRef<number>(0);
  const lastTranscriptRef = useRef('');
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const micButtonRef = useRef<HTMLDivElement>(null);
  
  // Format text using markdown
  const formatText = (text: string): string => {
    const formattedHtml = md.render(text);
    return DOMPurify.sanitize(formattedHtml);
  };
  
  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      // Using scrollIntoView with a slight delay to ensure it works after DOM updates
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    }
  };
  
  // Check if speech recognition is supported
  const checkSpeechSupport = () => {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  };
  
  // Simulate button press animation
  const simulateButtonPress = () => {
    if (micButtonRef.current) {
      // Add a pressed class
      micButtonRef.current.classList.add('button-pressed');
      
      // Add visual feedback
      micButtonRef.current.style.transform = 'scale(0.9)';
      micButtonRef.current.style.opacity = '0.8';
      
      // Find the parent button element
      const stopButton = micButtonRef.current.closest('button');
      if (stopButton) {
        console.log("Physically clicking stop button via simulateButtonPress");
        stopButton.click();
      } else {
        // Fallback if button not found
        stopListening();
      }
      
      // Remove after animation completes
      setTimeout(() => {
        if (micButtonRef.current) {
          micButtonRef.current.classList.remove('button-pressed');
          micButtonRef.current.style.transform = '';
          micButtonRef.current.style.opacity = '';
        }
      }, 200);
    }
  };
  
  // Enhanced silence detection that restarts timer on new text
  const setupSilenceDetection = () => {
    // Clear existing timeout if any
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    
    // Get current transcript for comparison
    const currentTranscript = finalTranscriptRef.current.trim();
    lastTranscriptRef.current = currentTranscript;
    
    // Update last speech timestamp
    lastSpeechTimestampRef.current = Date.now();
    
    // Set new timeout
    silenceTimeoutRef.current = setTimeout(() => {
      // Check if transcript has changed in the last 2 seconds
      if (isListening) {
        const newTranscript = finalTranscriptRef.current.trim();
        
        // Only process if we have text and it hasn't changed
        if (newTranscript.length > 0 && newTranscript === lastTranscriptRef.current) {
          console.log(`No new speech detected for ${SILENCE_TIMEOUT}ms, stopping listening`);
          
          // Direct call to simulate button press - only if we're still listening
          if (isListening) {
            simulateButtonPress();
          }
        }
      }
    }, SILENCE_TIMEOUT);
  };
  
  // Clear all timeouts
  const clearAllTimeouts = () => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  };
  
  // Initialize speech recognition
  const initializeSpeechRecognition = () => {
    try {
      setIsInitializing(true);
      setRecognitionError(null);
      
      // Check browser support
      if (!checkSpeechSupport()) {
        setSpeechSupported(false);
        setIsInitializing(false);
        setRecognitionError("Your browser doesn't support speech recognition. Try Chrome or Edge.");
        return false;
      }
      
      // Create speech recognition object
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      // Configure recognition
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;
      
      // Handle results
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        // Reset any error state since we're successfully getting results
        setNetworkErrorOccurred(false);
        setRetryCount(0);
        
        let interimTranscript = '';
        let hadNewFinalResult = false;
        let hadNewInterimResult = false;
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscriptRef.current += ' ' + result[0].transcript;
            hadNewFinalResult = true;
          } else {
            interimTranscript += result[0].transcript;
            hadNewInterimResult = true;
          }
        }
        
        // Update the UI
        const cleanTranscript = finalTranscriptRef.current.trim();
        setTranscript(cleanTranscript);
        setInterimTranscript(interimTranscript.trim());
        
        // If we have any new speech (final or interim), reset the silence timer
        if (hadNewFinalResult || hadNewInterimResult) {
          console.log('Speech detected, resetting silence timer');
          lastSpeechTimestampRef.current = Date.now();
          setupSilenceDetection();
        }
      };
      
      // Handle errors
      recognition.onerror = (event: Event) => {
        console.error('Speech recognition error:', (event as any).error);
        
        // Handle specific error types
        if ((event as any).error === 'network') {
          setNetworkErrorOccurred(true);
          setRecognitionError("Network error. Check your internet connection.");
          
          // If we haven't exceeded max retries, try again
          if (retryCount < MAX_RETRIES) {
            const nextRetryCount = retryCount + 1;
            setRetryCount(nextRetryCount);
            
            console.log(`Network error occurred. Retrying (${nextRetryCount}/${MAX_RETRIES})...`);
            
            // Stop current recognition
            if (recognizerRef.current) {
              try {
                recognizerRef.current.stop();
              } catch (e) {
                console.log('Error stopping recognizer during retry:', e);
              }
            }
            
            // Try again after a delay that increases with each retry
            retryTimeoutRef.current = setTimeout(() => {
              if (isListening) {
                createAndStartNewRecognizer();
              }
            }, 1000 * nextRetryCount); // Increase delay with each retry
            
            return;
          } else {
            setRecognitionError("Couldn't connect to speech recognition service after multiple attempts. Try using text input instead.");
          }
        } else if ((event as any).error === 'no-speech') {
          // No speech is detected, but this isn't a critical error
          // Don't update the error state, just log it
          console.log('No speech detected.');
          return;
        } else if ((event as any).error === 'audio-capture') {
          setRecognitionError("Couldn't access your microphone. Check your browser permissions.");
        } else if ((event as any).error === 'not-allowed' || (event as any).error === 'permission-denied') {
          setRecognitionError("Microphone access denied. Please enable microphone permission in your browser settings.");
        } else if ((event as any).error === 'aborted') {
          // Just log this, it's usually from manual stopping
          console.log('Speech recognition aborted.');
          return;
        } else {
          // For other errors
          setRecognitionError(`Error: ${(event as any).error}. Try refreshing the page.`);
        }
        
        // For serious errors, stop listening 
        setIsListening(false);
      };
      
      // Handle end of recognition
      recognition.onend = () => {
        // If we have a network error, don't restart automatically (let retry logic handle it)
        if (isListening && !networkErrorOccurred) {
          try {
            recognition.start();
            console.log('Recognition restarted after onend event');
          } catch (e) {
            console.error('Error restarting recognition:', e);
            setIsListening(false);
          }
        }
      };
      
      // Handle start of recognition
      recognition.onstart = () => {
        console.log('Recognition started successfully');
      };
      
      recognizerRef.current = recognition;
      setIsInitializing(false);
      setSpeechSupported(true);
      return true;
    } catch (error) {
      console.error('Error initializing speech recognition:', error);
      setRecognitionError('Failed to initialize speech recognition. Please ensure microphone access is allowed.');
      setIsInitializing(false);
      return false;
    }
  };
  
  // Create a new recognizer instance and start it
  const createAndStartNewRecognizer = () => {
    if (recognizerRef.current) {
      try {
        recognizerRef.current.stop();
      } catch (e) {
        console.log('Error stopping existing recognizer:', e);
      }
    }
    
    // Create and configure new recognizer
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const newRecognition = new SpeechRecognition();
      
      newRecognition.continuous = true;
      newRecognition.interimResults = true;
      newRecognition.lang = 'en-US';
      newRecognition.maxAlternatives = 1;
      
      // Set up all event handlers again with proper type checking
      if (recognizerRef.current?.onresult) {
        newRecognition.onresult = recognizerRef.current.onresult;
      }
      
      if (recognizerRef.current?.onerror) {
        newRecognition.onerror = recognizerRef.current.onerror;
      }
      
      if (recognizerRef.current?.onend) {
        newRecognition.onend = recognizerRef.current.onend;
      }
      
      if (recognizerRef.current?.onstart) {
        newRecognition.onstart = recognizerRef.current.onstart;
      }
      
      // Replace the old recognizer with the new one
      recognizerRef.current = newRecognition;
      
      // Start the new recognizer
      newRecognition.start();
      console.log('New recognizer created and started');
    } catch (error) {
      console.error('Error creating new recognizer:', error);
      setIsListening(false);
    }
  };
  
  // Clean up the recognizer
  const stopRecognizer = () => {
    // Clear all timeouts
    clearAllTimeouts();
    
    if (recognizerRef.current) {
      try {
        recognizerRef.current.stop();
      } catch (e) {
        console.error('Error stopping recognizer:', e);
      }
    }
  };
  
  // Start listening
  const startListening = async () => {
    // Reset error states
    setRecognitionError(null);
    setNetworkErrorOccurred(false);
    setRetryCount(0);
    
    // Clear transcript
    setTranscript('');
    setInterimTranscript('');
    finalTranscriptRef.current = '';
    
    // Initialize if needed
    if (!recognizerRef.current) {
      const initialized = initializeSpeechRecognition();
      if (!initialized) {
        return;
      }
    }
    
    // Set listening state and start recognition
    setIsListening(true);
    
    try {
      if (recognizerRef.current) {
        recognizerRef.current.start();
        console.log('Recognition started');
      }
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      
      if ((error as any)?.message?.includes('already started')) {
        // This is a common error when recognition is already running
        // Create a new recognizer and start it
        createAndStartNewRecognizer();
      } else {
        setRecognitionError('Error starting speech recognition. Please try refreshing the page.');
        setIsListening(false);
      }
    }
  };
  
  // Manual retry of speech recognition
  const retryRecognition = () => {
    // Reset error states
    setRecognitionError(null);
    setNetworkErrorOccurred(false);
    setRetryCount(0);
    
    // Create and start a new recognizer
    createAndStartNewRecognizer();
  };
  
  // Stop listening and process speech
  const stopListening = async () => {
    // Set state first to ensure UI updates immediately
    setIsListening(false);
    setInterimTranscript('');
    
    // Clear all timeouts to prevent multiple calls
    clearAllTimeouts();
    
    if (recognizerRef.current) {
      try {
        recognizerRef.current.stop();
        // Process the recognized text after stopping recognition
        processRecognizedText();
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
        // Still try to process the text even if there was an error
        processRecognizedText();
      }
    } else {
      processRecognizedText();
    }
  };
  
  // Process the recognized text
  const processRecognizedText = async () => {
    const cleanTranscript = transcript.trim();
    if (cleanTranscript) {
      // Add user message to chat history
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        text: cleanTranscript,
        sender: 'user',
        timestamp: new Date()
      };
      
      setChatHistory(prev => [...prev, userMessage]);
      
      // Scroll to bottom after user message added
      scrollToBottom();
      
      // Start processing
      setProcessingResponse(true);
      try {
        // Send transcript to API
        const response = await axios.post(
          'https://ddtgdhehxhgarkonvpfq.supabase.co/functions/v1/createContent',
          { prompt: cleanTranscript },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        // Get AI response
        const aiContent = response.data.output.text;
        setAiMessage(aiContent);
        
        // Add AI message to chat history
        const aiMessageObj: ChatMessage = {
          id: `ai-${Date.now()}`,
          text: aiContent,
          sender: 'ai',
          timestamp: new Date()
        };
        
        setChatHistory(prev => [...prev, aiMessageObj]);
        
        // Scroll to bottom again after AI message added
        scrollToBottom();
        
        // Speak the response
        speakText(aiContent);
        
      } catch (error) {
        console.error('Error calling AI API:', error);
        const errorMessage = "I'm sorry, I encountered an error. Please try again.";
        
        setAiMessage(errorMessage);
        
        // Add error message to chat
        const errorMessageObj: ChatMessage = {
          id: `ai-error-${Date.now()}`,
          text: errorMessage,
          sender: 'ai',
          timestamp: new Date()
        };
        
        setChatHistory(prev => [...prev, errorMessageObj]);
        
        // Scroll to bottom after error message
        scrollToBottom();
        
        speakText(errorMessage);
      } finally {
        setProcessingResponse(false);
      }
    }
  };
  
  // Speak text using the Web Speech API
  const speakText = (text: string) => {
    // Don't speak if muted
    if (isMuted) {
      console.log('Audio is muted, not speaking');
      setSpeaking(false);
      // Start listening immediately when muted since we're not speaking
      if (!isListening) {
        startListening();
      }
      return;
    }

    // Stop any existing speech
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Get available voices
    const voices = window.speechSynthesis.getVoices();
    const preferredVoices = [
      "Google UK English Male",
      "Microsoft David",
      "Microsoft Mark", 
      "Daniel",
      "Alex"
    ];
    
    // Find a high-quality voice
    let selectedVoice = null;
    
    // Try exact matches first
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
    
    // If still no match, use any English voice
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.includes('en'));
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    // Set properties for a better voice
    utterance.rate = 0.95;
    utterance.pitch = 0.85;
    utterance.volume = 1.0;
    
    // Event handlers
    utterance.onstart = () => {
      setSpeaking(true);
      if (animationRef.current) {
        animationRef.current.play();
      }
    };
    
    utterance.onend = () => {
      setSpeaking(false);
      // Auto-start listening again after AI finishes speaking
      if (!isListening && !isMuted) {
        startListening();
      }
      if (animationRef.current) {
        animationRef.current.pause();
      }
    };
    
    // Speak
    window.speechSynthesis.speak(utterance);
  };
  
  // End call and return to chat
  const endCall = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    stopRecognizer();
  };
  
  // Toggle mute
  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    // If we're currently speaking and user mutes, stop speaking
    if (newMutedState && speaking && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      // Start listening again since we stopped the speech
      startListening();
      if (animationRef.current) {
        animationRef.current.pause();
      }
    }
    
    console.log(`Audio ${newMutedState ? 'muted' : 'unmuted'}`);
  };
  
  // Toggle transcript visibility
  const toggleTranscript = () => {
    setShowTranscript(!showTranscript);
  };
  
  // Initialize call timer
  useEffect(() => {
    timerIntervalRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);
  
  // Format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Initialize on component load
  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
    
    // Initialize speech recognition
    initializeSpeechRecognition();
    
    // Add initial greeting to chat history
    const initialGreeting: ChatMessage = {
      id: 'ai-initial',
      text: aiMessage,
      sender: 'ai',
      timestamp: new Date()
    };
    
    setChatHistory([initialGreeting]);
    
    // Speak initial greeting when component loads
    setTimeout(() => {
      speakText(aiMessage);
    }, 1000);
    
    // Set an interval to check for silence every 500ms as an additional safeguard
    const silenceCheckInterval = setInterval(() => {
      if (isListening && lastSpeechTimestampRef.current > 0) {
        const now = Date.now();
        const timeSinceLastSpeech = now - lastSpeechTimestampRef.current;
        
        if (timeSinceLastSpeech > SILENCE_TIMEOUT && finalTranscriptRef.current.trim().length > 0) {
          console.log(`Silence detected from interval check: ${timeSinceLastSpeech}ms`);
          if (isListening) {
            simulateButtonPress();
          }
        }
      }
    }, 500);
    
    // Clean up on unmount
    return () => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      stopRecognizer();
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      clearInterval(silenceCheckInterval);
    };
  }, []);
  
  // Effect for scrolling to bottom when chat updates
  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);
  
  // Show error page if speech recognition is not supported
  if (!speechSupported) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${darkMode ? 'bg-gradient-to-b from-gray-900 to-gray-800 text-white' : 'bg-gradient-to-b from-blue-50 to-indigo-100 text-gray-800'}`}>
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Browser Not Supported</h1>
          <p className="mb-6">Your browser doesn't support speech recognition. Please try using Chrome or Edge.</p>
          <Link to="/chat" className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
            Return to Chat
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-gradient-to-b from-gray-900 to-gray-800 text-white' : 'bg-gradient-to-b from-blue-50 to-indigo-100 text-gray-800'} overflow-hidden fixed inset-0`}>
      {/* Stylish call header */}
      <div className={`w-full ${darkMode ? 'bg-gray-800 bg-opacity-90' : 'bg-gradient-to-r from-blue-600 to-indigo-600'} py-4 px-4 flex items-center justify-between shadow-lg z-20 sticky top-0`}>
        <div className="flex items-center space-x-3">
          <Link to="/chat" className="text-white p-2 rounded-full hover:bg-black hover:bg-opacity-20 transition-all duration-200">
            <FiArrowLeft size={22} />
          </Link>
          <div>
            <h1 className="text-white font-semibold text-lg">AI Assistant</h1>
            <p className="text-white text-sm opacity-80">
              {speaking ? 'Speaking...' : 
               isListening ? 'Listening...' : 
               processingResponse ? 'Processing...' : 'Voice call'}
            </p>
          </div>
        </div>
        <div className="text-white text-sm font-medium flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${speaking || isListening || processingResponse ? 'bg-green-500 animate-pulse' : 'bg-white'}`}></div>
          {formatDuration(callDuration)}
        </div>
      </div>
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Large centered animation when chat is minimized */}
        {!expandChat && (
          <div className={`flex-1 w-full flex flex-col items-center justify-center p-6`}>
            <div className="relative w-60 h-60 md:w-80 md:h-80 mb-6">
              <Lottie
                ref={animationRef}
                loop={speaking || processingResponse || isInitializing}
                animationData={matrixAnimation}
                play={speaking || processingResponse || isInitializing}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
            
            <h2 className="text-2xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">AI Assistant</h2>
            <p className={`text-sm ${darkMode ? 'text-blue-300' : 'text-indigo-600'} mb-3`}>
              {speaking 
                ? 'Speaking to you...' 
                : isListening 
                  ? 'Listening to you...' 
                  : processingResponse 
                    ? 'Processing your message...'
                    : 'Ready for conversation'
              }
            </p>
            
            {/* Status indicator */}
            <div className={`mt-1 px-4 py-1.5 rounded-full text-xs font-semibold shadow-md transition-all ${
              speaking 
                ? 'bg-blue-600 text-white' 
                : isListening 
                  ? 'bg-green-600 text-white' 
                  : processingResponse 
                    ? 'bg-yellow-500 text-white' 
                    : networkErrorOccurred
                      ? 'bg-red-500 text-white'
                      : darkMode ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-800'
            }`}>
              {speaking 
                ? 'AI Speaking' 
                : isListening 
                  ? 'Listening...' 
                  : processingResponse 
                    ? 'Processing...'
                    : networkErrorOccurred
                      ? 'Network Error'
                      : 'Ready'
              }
            </div>
          </div>
        )}
        
        {/* Error message if any */}
        {recognitionError && (
          <div className="w-full px-4 mb-4 absolute top-2 left-0 right-0 z-20">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg shadow-md">
              <div className="flex justify-between items-center">
                <p className="text-sm">{recognitionError}</p>
                {networkErrorOccurred && (
                  <button 
                    onClick={retryRecognition}
                    className="flex items-center gap-1 bg-red-200 hover:bg-red-300 text-red-800 px-2 py-1 rounded text-xs font-medium transition-all"
                  >
                    <FiRefreshCw size={12} />
                    Retry
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Conversation area (always visible in expanded mode) */}
        {(expandChat || showTranscript) && (
          <div 
            className={`${expandChat ? 'flex-1' : ''} w-full px-4 overflow-y-auto ${
              darkMode ? 'bg-gray-800 bg-opacity-70' : 'bg-white bg-opacity-60'
            } rounded-t-2xl mx-auto max-w-4xl`}
            style={{ 
              maxHeight: expandChat ? 'calc(100vh - 180px)' : '40vh',
              paddingTop: '1rem',
              paddingBottom: '140px', // Increase bottom padding even more
              overflowX: 'hidden',
              position: 'relative',
              zIndex: 1
            }}
          >
            <div className="flex flex-col space-y-3">
              {chatHistory.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`p-4 rounded-2xl ${message.sender === 'ai' ? 'rounded-tl-none mr-auto' : 'rounded-tr-none ml-auto'} max-w-[85%] ${
                    message.sender === 'ai'
                      ? darkMode 
                        ? 'bg-gray-700 text-white shadow-lg' 
                        : 'bg-white text-gray-800 shadow-md'
                      : darkMode 
                        ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg' 
                        : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md'
                  } relative`}
                >
                  <div 
                    className="text-sm markdown-content"
                    dangerouslySetInnerHTML={{ __html: formatText(message.text) }}
                  />
                  <span className="text-xs opacity-50 float-right mt-1">
                {message.sender === 'ai' ? 'AI' : 'You'}
              </span>
                </motion.div>
              ))}
              
              {/* Current speech indicator */}
              {isListening && interimTranscript && (
                <motion.div
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: 1 }}
                  className={`p-4 rounded-2xl rounded-tr-none ml-auto max-w-[85%] ${
                    darkMode 
                      ? 'bg-indigo-600 bg-opacity-70 text-white shadow-md' 
                      : 'bg-blue-500 bg-opacity-70 text-white shadow-md'
                  } relative`}
                >
                  <p className="text-sm italic">{interimTranscript}</p>
                  <div className="flex space-x-1 mt-1 justify-end items-center">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse delay-100"></span>
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse delay-200"></span>
                  </div>
                </motion.div>
              )}
              
              {/* Reference for auto-scrolling with even more height to ensure proper scrolling */}
              <div ref={messagesEndRef} style={{ height: '180px' }}></div>
            </div>
          </div>
        )}
      
        {/* Call controls - fixed at bottom with higher z-index */}
        <div className={`w-full ${darkMode ? 'bg-gray-900' : 'bg-white'} p-5 shadow-lg fixed bottom-0 left-0 right-0 z-50 backdrop-blur-md ${darkMode ? 'bg-opacity-90' : 'bg-opacity-90'} rounded-t-2xl`}>
          <div className="grid grid-cols-5 gap-3 max-w-lg mx-auto">
            <button
              onClick={toggleMute}
              className={`flex flex-col items-center justify-center space-y-1 ${isMuted ? 'text-red-500' : darkMode ? 'text-white' : 'text-gray-700'}`}
            >
              <div className={`p-3 rounded-full ${
                isMuted 
                  ? 'bg-red-500 text-white' 
                  : darkMode 
                    ? 'bg-gray-800 text-white' 
                    : 'bg-gray-100 text-gray-600'
              } shadow-md transition-all duration-200 hover:scale-110 relative`}>
                {isMuted ? <FiVolumeX size={22} /> : <FiVolume2 size={22} />}
                {isMuted && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white dark:border-gray-900 rounded-full"></span>
                )}
              </div>
              <span className="text-xs font-medium">{isMuted ? 'Unmute' : 'Mute'}</span>
            </button>
            
            <button
              onClick={toggleTranscript}
              className={`flex flex-col items-center justify-center space-y-1 ${darkMode ? 'text-white' : 'text-gray-700'}`}
            >
              <div className={`p-3 rounded-full ${
                darkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'
              } shadow-md transition-all duration-200 hover:scale-110`}>
                {showTranscript ? <FiEyeOff size={22} /> : <FiEye size={22} />}
              </div>
              <span className="text-xs">{showTranscript ? 'Hide Chat' : 'Show Chat'}</span>
            </button>
            
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={isInitializing || speaking || processingResponse}
              className="flex flex-col items-center justify-center space-y-1"
            >
              <div 
                ref={micButtonRef}
                className={`p-4 rounded-full transition-all duration-200 ${
                  isInitializing
                    ? (darkMode ? 'bg-gray-600' : 'bg-gray-300')
                    : isListening
                      ? 'bg-red-500 shadow-md shadow-red-300'
                      : (darkMode ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-green-400 to-blue-500')
                } text-white shadow-lg hover:scale-110 transform-gpu ${(speaking || processingResponse || isInitializing) ? 'opacity-50 cursor-not-allowed' : 'opacity-100 cursor-pointer'}`}
                style={{
                  position: 'relative',
                  zIndex: 40
                }}
              >
                {isInitializing ? (
                  <FiLoader size={26} className="animate-spin" />
                ) : isListening ? (
                  <FiMicOff size={26} />
                ) : (
                  <FiMic size={26} />
                )}
                {isListening && (
                  <span className="absolute w-full h-full rounded-full animate-ping bg-red-400 opacity-20" style={{ left: 0, top: 0 }}></span>
                )}
              </div>
              <span className={`text-xs ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                {isListening ? 'Stop' : 'Talk'}
              </span>
            </button>
            
            <button
              onClick={() => setExpandChat(!expandChat)}
              className={`flex flex-col items-center justify-center space-y-1 ${darkMode ? 'text-white' : 'text-gray-700'}`}
            >
              <div className={`p-3 rounded-full ${
                darkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'
              } shadow-md transition-all duration-200 hover:scale-110`}>
                {expandChat ? <FiMinimize2 size={22} /> : <FiMaximize2 size={22} />}
              </div>
              <span className="text-xs">{expandChat ? 'Minimize' : 'Expand'}</span>
            </button>
            
            <Link
              to="/chat"
              onClick={endCall}
              className="flex flex-col items-center justify-center space-y-1 text-red-500"
            >
              <div className="p-3 rounded-full bg-red-500 text-white shadow-md transition-all duration-200 hover:scale-110">
                <FiPhoneOff size={22} />
              </div>
              <span className="text-xs">End</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallPage;
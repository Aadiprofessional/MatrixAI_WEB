import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiMic, FiMicOff, FiArrowLeft, FiPhoneOff, FiLoader, FiRefreshCw } from 'react-icons/fi';
import { Link } from 'react-router-dom';
// @ts-ignore
import Lottie from 'react-lottie-player';
import matrixAnimation from '../assets/Animation - 1740689806927.json';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';

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
  const [aiMessage, setAiMessage] = useState("Hello! I'm your Matrix AI assistant. How can I help you today?");
  const [speaking, setSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [networkErrorOccurred, setNetworkErrorOccurred] = useState(false);
  
  const MAX_RETRIES = 3;
  const animationRef = useRef<any>(null);
  const recognizerRef = useRef<SpeechRecognition | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const finalTranscriptRef = useRef('');
  
  // Check if speech recognition is supported
  const checkSpeechSupport = () => {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  };
  
  // Function to check if user has been silent for a period of time
  const setupSilenceDetection = () => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    
    const currentLength = finalTranscriptRef.current.length;
    
    silenceTimeoutRef.current = setTimeout(() => {
      if (isListening && finalTranscriptRef.current.length === currentLength && finalTranscriptRef.current.trim().length > 0) {
        stopListening();
      }
    }, 2500);
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
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscriptRef.current += ' ' + result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }
        
        // Update the UI
        setTranscript(finalTranscriptRef.current.trim());
        setInterimTranscript(interimTranscript.trim());
        
        // Setup silence detection
        setupSilenceDetection();
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
    setIsListening(false);
    setInterimTranscript('');
    clearAllTimeouts();
    
    if (recognizerRef.current) {
      try {
        recognizerRef.current.stop();
        processRecognizedText();
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
        processRecognizedText();
      }
    } else {
      processRecognizedText();
    }
  };
  
  // Process the recognized text
  const processRecognizedText = async () => {
    if (transcript.trim()) {
      setProcessingResponse(true);
      try {
        // Send transcript to API
        const response = await axios.post(
          'https://ddtgdhehxhgarkonvpfq.supabase.co/functions/v1/createContent',
          { prompt: transcript },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        // Get AI response
        const aiContent = response.data.output.text;
        setAiMessage(aiContent);
        
        // Speak the response
        speakText(aiContent);
        
      } catch (error) {
        console.error('Error calling AI API:', error);
        setAiMessage("I'm sorry, I encountered an error. Please try again.");
        speakText("I'm sorry, I encountered an error. Please try again.");
      } finally {
        setProcessingResponse(false);
      }
    }
  };
  
  // Speak text using the Web Speech API
  const speakText = (text: string) => {
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
      startListening();
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
  
  // Initialize on component load
  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
    
    // Initialize speech recognition
    initializeSpeechRecognition();
    
    // Speak initial greeting when component loads
    setTimeout(() => {
      speakText(aiMessage);
    }, 1000);
    
    // Clean up on unmount
    return () => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      stopRecognizer();
    };
  }, [aiMessage]);
  
  // Show error page if speech recognition is not supported
  if (!speechSupported) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
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
    <div className={`min-h-screen flex flex-col items-center justify-center ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Navigation buttons */}
      <div className="absolute top-0 left-0 w-full flex justify-between p-4 z-10">
        <Link 
          to="/chat" 
          className={`p-2 rounded-full ${
            darkMode 
              ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          } shadow-lg`}
        >
          <FiArrowLeft size={24} />
        </Link>
        
        <Link 
          to="/chat" 
          className="p-3 rounded-full bg-red-600 text-white hover:bg-red-700 shadow-lg"
          onClick={endCall}
        >
          <FiPhoneOff size={24} />
        </Link>
      </div>
      
      {/* Status indicator */}
      <div className={`absolute top-20 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full z-10 flex items-center gap-2 ${
        speaking 
          ? 'bg-blue-600 text-white' 
          : isListening 
            ? 'bg-green-600 text-white' 
            : processingResponse 
              ? 'bg-yellow-600 text-white' 
              : networkErrorOccurred
                ? 'bg-red-600 text-white'
                : 'bg-gray-600 text-white'
      }`}>
        <div className={`w-3 h-3 rounded-full ${
          speaking || isListening || processingResponse ? 'animate-pulse' : ''
        } ${
          speaking ? 'bg-blue-300' : isListening ? 'bg-green-300' : processingResponse ? 'bg-yellow-300' : networkErrorOccurred ? 'bg-red-300' : 'bg-gray-300'
        }`}></div>
        <span className="text-sm font-medium">
          {speaking 
            ? 'AI Speaking' 
            : isListening 
              ? 'Listening...' 
              : processingResponse 
                ? 'Processing...'
                : networkErrorOccurred
                  ? 'Network Error'
                  : isInitializing
                    ? 'Initializing...'
                    : 'Ready'
          }
        </span>
      </div>
      
      {/* Main content */}
      <div className={`max-w-4xl w-full mx-4 p-8 rounded-2xl shadow-xl ${
        darkMode 
          ? 'bg-gray-800' 
          : 'bg-white'
      }`}>
        <div className="flex flex-col items-center">
          {/* Animated Matrix AI character */}
          <div className="w-64 h-64 mb-6">
            <Lottie
              ref={animationRef}
              loop={speaking || processingResponse || isInitializing}
              animationData={matrixAnimation}
              play={speaking || processingResponse || isInitializing}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
          
          {/* AI and user messages */}
          <div className="w-full max-w-2xl">
            {/* AI message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className={`p-4 rounded-xl mb-6 ${
                darkMode 
                  ? 'bg-gradient-to-r from-blue-900 to-purple-900 text-white' 
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
              } shadow-md`}
            >
              <p className="text-lg">{aiMessage}</p>
            </motion.div>
            
            {/* User transcript */}
            <div className={`p-4 rounded-xl mb-6 min-h-[80px] ${
              darkMode 
                ? 'bg-gray-700 text-gray-100' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {transcript && <p>{transcript}</p>}
              {isListening && interimTranscript && (
                <p className="text-gray-400 italic">{interimTranscript}</p>
              )}
              {!transcript && !interimTranscript && (
                <p className="text-gray-400 text-center">Speak when the microphone is active</p>
              )}
            </div>
            
            {/* Error message if any */}
            {recognitionError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-md mb-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm">{recognitionError}</p>
                  {networkErrorOccurred && (
                    <button 
                      onClick={retryRecognition}
                      className="flex items-center gap-1 bg-red-200 hover:bg-red-300 text-red-800 px-2 py-1 rounded text-xs font-medium"
                    >
                      <FiRefreshCw size={12} />
                      Retry
                    </button>
                  )}
                </div>
                <p className="text-xs mt-1">
                  {networkErrorOccurred 
                    ? "Check your internet connection and try again" 
                    : "Try refreshing the page or checking microphone permissions"}
                </p>
              </div>
            )}
            
            {/* Microphone button */}
            <div className="flex justify-center mt-2">
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={isInitializing || speaking || processingResponse}
                className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 ${
                  isInitializing
                    ? (darkMode ? 'bg-gray-600 text-white' : 'bg-gray-500 text-white')
                    : isListening
                      ? (darkMode ? 'bg-red-600 text-white' : 'bg-red-500 text-white')
                      : (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                } ${(speaking || processingResponse || isInitializing) ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}`}
              >
                {isInitializing ? (
                  <FiLoader size={32} className="animate-spin" />
                ) : isListening ? (
                  <FiMicOff size={32} />
                ) : (
                  <FiMic size={32} />
                )}
                {isListening && (
                  <span className="absolute w-full h-full rounded-full animate-ping bg-red-400 opacity-20"></span>
                )}
              </button>
            </div>
            
            {/* Help text */}
            <p className={`text-center mt-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {isInitializing
                ? "Initializing speech recognition..."
                : isListening 
                  ? "I'm listening... Speak clearly and I'll type what you say"
                  : speaking
                    ? "I'm speaking... Please wait"
                    : processingResponse
                      ? "Processing your request..."
                      : networkErrorOccurred
                        ? "Network error detected. Click 'Retry' to try again"
                        : "Tap the microphone to start speaking"
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallPage; 
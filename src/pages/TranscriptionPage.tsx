import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiPlay, FiPause, FiDownload, FiCopy, FiShare2, 
  FiChevronLeft, FiChevronRight, FiRefreshCw, FiLoader
} from 'react-icons/fi';
import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';

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

const TranscriptionPage: React.FC = () => {
  const { audioid } = useParams<{ audioid: string }>();
  const location = useLocation();
  const { isPro } = useUser();
  const { user } = useAuth();
  const uid = user?.id;

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

  return (
    <div className="container mx-auto max-w-6xl p-4 py-8">
      <div className="mb-6">
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

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <FiLoader className="animate-spin h-10 w-10 text-blue-500" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading transcription...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Left panel with transcription */}
          <div className="md:col-span-3 min-h-[400px] border rounded-lg p-4 dark:bg-gray-800">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-semibold dark:text-gray-200">Audio Transcription</h2>
              <div className="flex space-x-2">
                <button 
                  onClick={copyTranscription}
                  className="p-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400"
                  title="Copy transcription"
                >
                  <FiCopy />
                </button>
                <button className="p-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400" title="Share">
                  <FiShare2 />
                </button>
                <button className="p-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400" title="Download">
                  <FiDownload />
                </button>
              </div>
            </div>

            {/* Transcription text with word highlighting */}
            <div className="overflow-auto h-[calc(100vh-300px)] p-2 font-medium leading-relaxed text-gray-700 dark:text-gray-300">
              {paragraphs.map((paragraph, paraIndex) => (
                <p 
                  key={paraIndex}
                  className={`mb-4 ${
                    paraIndex === activeParagraph ? 'bg-blue-50 dark:bg-blue-900/20 p-2 rounded' : ''
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
                        className={`cursor-pointer ${
                          globalWordIndex === activeWord 
                            ? 'bg-blue-500 text-white dark:bg-blue-600 rounded px-0.5' 
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
          </div>

          {/* Right panel with audio player and waveform */}
          <div className="md:col-span-2 border rounded-lg p-4 dark:bg-gray-800">
            <h2 className="text-xl font-semibold mb-4 dark:text-gray-200">Audio Player</h2>
            
            {/* Waveform visualization */}
            <div className="relative h-20 mb-4 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-blue-500/20 dark:bg-blue-500/30 pointer-events-none"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              ></div>
              <div className="flex items-end justify-between h-full px-1">
                {waveformData.map((height, i) => (
                  <div
                    key={i}
                    className="w-1 mx-0.5 bg-blue-500 dark:bg-blue-400"
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
            <div className="mb-4">
              <div className="flex items-center mb-2">
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
                  className="flex-1 mx-3 accent-blue-500"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400 w-12 text-right">
                  {formatTime(duration)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <button 
                    onClick={() => seekTo(Math.max(0, currentTime - 5))}
                    className="p-2 text-gray-600 hover:text-blue-500 dark:text-gray-300 focus:outline-none"
                    title="Back 5 seconds"
                  >
                    <FiChevronLeft />
                  </button>
                  <button 
                    onClick={togglePlayPause}
                    className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full focus:outline-none"
                  >
                    {isPlaying ? <FiPause /> : <FiPlay />}
                  </button>
                  <button 
                    onClick={() => seekTo(Math.min(duration, currentTime + 5))}
                    className="p-2 text-gray-600 hover:text-blue-500 dark:text-gray-300 focus:outline-none"
                    title="Forward 5 seconds"
                  >
                    <FiChevronRight />
                  </button>
                </div>

                {/* Playback rate controls */}
                <div className="flex space-x-1">
                  {[0.5, 1, 1.5, 2].map(rate => (
                    <button 
                      key={rate}
                      onClick={() => handlePlaybackRateChange(rate)}
                      className={`px-2 py-1 text-xs rounded ${
                        playbackRate === rate 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Additional controls or info */}
            <div className="border-t dark:border-gray-700 pt-4 mt-4">
              <h3 className="text-lg font-medium mb-3 dark:text-gray-300">Audio Information</h3>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-600 dark:text-gray-400">Duration:</div>
                <div className="text-gray-800 dark:text-gray-200">{formatTime(duration)}</div>
                
                <div className="text-gray-600 dark:text-gray-400">Language:</div>
                <div className="text-gray-800 dark:text-gray-200">
                  {locationState?.language || 'English'}
                </div>
                
                <div className="text-gray-600 dark:text-gray-400">Words:</div>
                <div className="text-gray-800 dark:text-gray-200">{wordTimings.length}</div>
              </div>

              <div className="mt-4">
                <button className="flex items-center text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300">
                  <FiRefreshCw className="mr-1.5" />
                  Regenerate Transcription
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TranscriptionPage; 
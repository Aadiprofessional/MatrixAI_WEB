import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FiLayers, 
  FiPlus, 
  FiTrash, 
  FiEdit, 
  FiX, 
  FiArrowUp, 
  FiArrowDown, 
  FiMaximize, 
  FiDownload, 
  FiSliders,
  FiZap,
  FiSave,
  FiImage,
  FiLayout,
  FiList
} from 'react-icons/fi';
import { ProFeatureAlert } from '../components';
import { useUser } from '../context/UserContext';

interface Slide {
  id: string;
  title: string;
  content: string;
  layout: 'title' | 'content' | 'two-column' | 'image-text' | 'bullets';
}

const PresentationCreatorPage: React.FC = () => {
  const { userData, isPro } = useUser();
  const [presentationTitle, setPresentationTitle] = useState('');
  const [slides, setSlides] = useState<Slide[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [numSlides, setNumSlides] = useState(5);
  const [presentationStyle, setPresentationStyle] = useState('professional');
  const [showSettings, setShowSettings] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewSlideIndex, setPreviewSlideIndex] = useState(0);
  const [showProAlert, setShowProAlert] = useState(false);
  const [freeGenerationsLeft, setFreeGenerationsLeft] = useState(1);

  // Style options for presentations
  const styleOptions = [
    { id: 'professional', name: 'Professional' },
    { id: 'creative', name: 'Creative' },
    { id: 'minimalist', name: 'Minimalist' },
    { id: 'academic', name: 'Academic' },
    { id: 'corporate', name: 'Corporate' },
    { id: 'modern', name: 'Modern' },
  ];

  // Layout options for slides
  const layoutOptions = [
    { id: 'title', name: 'Title Slide', icon: <FiLayers /> },
    { id: 'content', name: 'Text Content', icon: <FiEdit /> },
    { id: 'two-column', name: 'Two Columns', icon: <FiLayout /> },
    { id: 'image-text', name: 'Image & Text', icon: <FiImage /> },
    { id: 'bullets', name: 'Bullet Points', icon: <FiList /> },
  ];

  const handleGeneratePresentation = async () => {
    if (!prompt.trim()) return;
    
    // If user is not pro and has used all free generations, show pro alert
    if (!isPro && freeGenerationsLeft <= 0) {
      setShowProAlert(true);
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Generate a title based on the prompt
      const generatedTitle = prompt.length > 40 
        ? `${prompt.substring(0, 40)}...` 
        : prompt;
      
      setPresentationTitle(generatedTitle);
      
      // Generate sample slides
      const generatedSlides: Slide[] = [];
      
      // Title slide
      generatedSlides.push({
        id: Date.now().toString(),
        title: generatedTitle,
        content: 'Subtitle: Overview and Key Insights',
        layout: 'title'
      });
      
      // Generate content slides
      const layouts: Array<'content' | 'two-column' | 'image-text' | 'bullets'> = ['content', 'two-column', 'image-text', 'bullets'];
      
      for (let i = 1; i < numSlides; i++) {
        const layout = layouts[i % layouts.length] as 'content' | 'two-column' | 'image-text' | 'bullets';
        
        let slideTitle = '';
        let slideContent = '';
        
        // Generate content based on slide number and layout
        switch (i) {
          case 1:
            slideTitle = 'Introduction';
            slideContent = 'Overview of the topic and why it matters\n\n• Key points to be covered\n• Scope and limitations\n• Expected outcomes';
            break;
          case 2:
            slideTitle = 'Background & Context';
            slideContent = 'Historical perspective and current state\n\nLeft Column:\n• Historical developments\n• Current landscape\n\nRight Column:\n• Key stakeholders\n• Relevant trends';
            break;
          case 3:
            slideTitle = 'Key Concepts';
            slideContent = 'Important terminology and frameworks\n\n[Image placeholder: Conceptual diagram]\n\nThese concepts form the foundation of understanding the topic and its implications.';
            break;
          case 4:
            slideTitle = 'Analysis & Findings';
            slideContent = '• Finding 1: Key insight related to the main topic\n• Finding 2: Secondary observation with supporting data\n• Finding 3: Pattern or trend identified through analysis\n• Finding 4: Unexpected outcome or result\n• Finding 5: Implications for stakeholders';
            break;
          default:
            slideTitle = `Section ${i}`;
            slideContent = 'Content for this section would include detailed analysis, examples, case studies, or other supporting information relevant to the topic.';
        }
        
        generatedSlides.push({
          id: (Date.now() + i).toString(),
          title: slideTitle,
          content: slideContent,
          layout: layout
        });
      }
      
      setSlides(generatedSlides);
      setSelectedSlideId(generatedSlides[0].id);
      
      // Decrease free generations left if user is not pro
      if (!isPro) {
        setFreeGenerationsLeft(prev => prev - 1);
      }
      
    } catch (error) {
      console.error('Error generating presentation:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const addNewSlide = () => {
    const newSlide: Slide = {
      id: Date.now().toString(),
      title: 'New Slide',
      content: 'Add your content here...',
      layout: 'content'
    };
    
    setSlides([...slides, newSlide]);
    setSelectedSlideId(newSlide.id);
  };

  const deleteSlide = (id: string) => {
    const newSlides = slides.filter(slide => slide.id !== id);
    setSlides(newSlides);
    
    if (selectedSlideId === id) {
      setSelectedSlideId(newSlides.length > 0 ? newSlides[0].id : null);
    }
  };

  const moveSlide = (id: string, direction: 'up' | 'down') => {
    const currentIndex = slides.findIndex(slide => slide.id === id);
    if (currentIndex === -1) return;
    
    if (direction === 'up' && currentIndex > 0) {
      const newSlides = [...slides];
      [newSlides[currentIndex], newSlides[currentIndex - 1]] = [newSlides[currentIndex - 1], newSlides[currentIndex]];
      setSlides(newSlides);
    } else if (direction === 'down' && currentIndex < slides.length - 1) {
      const newSlides = [...slides];
      [newSlides[currentIndex], newSlides[currentIndex + 1]] = [newSlides[currentIndex + 1], newSlides[currentIndex]];
      setSlides(newSlides);
    }
  };

  const updateSlideTitle = (id: string, title: string) => {
    setSlides(slides.map(slide => 
      slide.id === id ? { ...slide, title } : slide
    ));
  };

  const updateSlideContent = (id: string, content: string) => {
    setSlides(slides.map(slide => 
      slide.id === id ? { ...slide, content } : slide
    ));
  };

  const updateSlideLayout = (id: string, layout: 'title' | 'content' | 'two-column' | 'image-text' | 'bullets') => {
    setSlides(slides.map(slide => 
      slide.id === id ? { ...slide, layout } : slide
    ));
  };

  const handleExportPresentation = () => {
    // In a real app, this would generate a PowerPoint or PDF
    alert('In a production app, this would export to PowerPoint or PDF');
  };

  const startFullScreenPreview = () => {
    setShowPreview(true);
    setPreviewSlideIndex(0);
  };

  const selectedSlide = selectedSlideId ? slides.find(slide => slide.id === selectedSlideId) : null;

  return (
    <div className="container mx-auto max-w-6xl p-4 py-8">
      {showProAlert && (
        <ProFeatureAlert 
          featureName="Professional Presentation Creator"
          onClose={() => setShowProAlert(false)}
        />
      )}
      
      <div className="mb-8">
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
        >
          AI Presentation Creator
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-500 dark:text-gray-400"
        >
          Create professional presentations in seconds with AI
        </motion.p>
        
        {!isPro && (
          <div className="mt-2 flex items-center text-sm text-yellow-600 dark:text-yellow-400">
            <FiLayers className="mr-1.5" />
            <span>{freeGenerationsLeft} free generation{freeGenerationsLeft !== 1 ? 's' : ''} left</span>
            {freeGenerationsLeft === 0 && (
              <button 
                onClick={() => setShowProAlert(true)}
                className="ml-2 text-blue-500 hover:text-blue-600 font-medium"
              >
                Upgrade to Pro
              </button>
            )}
          </div>
        )}
      </div>

      {/* Presentation Generation Form - Show only when no slides are created yet */}
      {slides.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-medium mb-4">Create a New Presentation</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">What's your presentation about?</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your presentation topic and purpose..."
                className="w-full p-3 border rounded-lg shadow-sm h-32 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isGenerating}
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium dark:text-gray-300">Presentation Settings</label>
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-sm text-blue-600 dark:text-blue-400 flex items-center"
                >
                  <FiSliders className="mr-1" size={14} />
                  {showSettings ? 'Hide' : 'Show'}
                </button>
              </div>
              
              {showSettings && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3"
                >
                  <div>
                    <label className="block text-xs font-medium mb-1 dark:text-gray-400">Number of Slides</label>
                    <div className="flex items-center">
                      <input
                        type="range"
                        min="3"
                        max="15"
                        value={numSlides}
                        onChange={(e) => setNumSlides(parseInt(e.target.value))}
                        className="flex-1 mr-2"
                        disabled={isGenerating}
                      />
                      <span className="text-sm font-medium w-8 text-center">{numSlides}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium mb-1 dark:text-gray-400">Design Style</label>
                    <select 
                      value={presentationStyle}
                      onChange={(e) => setPresentationStyle(e.target.value)}
                      className="w-full p-2 text-sm border rounded-md dark:bg-gray-600 dark:border-gray-500"
                      disabled={isGenerating}
                    >
                      {styleOptions.map(style => (
                        <option key={style.id} value={style.id}>{style.name}</option>
                      ))}
                    </select>
                  </div>
                </motion.div>
              )}
            </div>
            
            <button
              onClick={handleGeneratePresentation}
              disabled={!prompt.trim() || isGenerating}
              className={`w-full py-3 rounded-lg font-medium flex items-center justify-center ${
                !prompt.trim() || isGenerating
                  ? 'bg-gray-300 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                  : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white hover:opacity-90'
              } transition`}
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Presentation
                </>
              ) : (
                <>
                  <FiZap className="mr-2" />
                  Generate Presentation
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Presentation Editor - Show when slides are created */}
      {slides.length > 0 && (
        <>
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Sidebar - Slide Navigation */}
            <div className="w-full lg:w-64 flex-shrink-0 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Presentation Title */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                {isEditingTitle ? (
                  <div className="flex items-center">
                    <input 
                      type="text"
                      value={presentationTitle}
                      onChange={(e) => setPresentationTitle(e.target.value)}
                      className="flex-1 p-1 text-sm border rounded mr-2 dark:bg-gray-700 dark:border-gray-600"
                      autoFocus
                    />
                    <button
                      onClick={() => setIsEditingTitle(false)}
                      className="p-1 text-green-500 hover:text-green-600"
                    >
                      <FiSave size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-sm truncate">{presentationTitle}</h3>
                    <button 
                      onClick={() => setIsEditingTitle(true)}
                      className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      <FiEdit size={14} />
                    </button>
                  </div>
                )}
              </div>
              
              {/* Slides List */}
              <div className="overflow-y-auto max-h-96">
                {slides.map((slide, index) => (
                  <div 
                    key={slide.id}
                    className={`p-3 border-b border-gray-200 dark:border-gray-700 cursor-pointer flex items-start ${
                      selectedSlideId === slide.id 
                        ? 'bg-blue-50 dark:bg-blue-900/30' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => setSelectedSlideId(slide.id)}
                  >
                    <div className="w-6 flex-shrink-0 text-gray-500">
                      {index + 1}.
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{slide.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{slide.layout}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Slide Actions */}
              <div className="p-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                <button
                  onClick={addNewSlide}
                  className="w-full py-2 rounded-lg font-medium flex items-center justify-center bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800/40"
                >
                  <FiPlus className="mr-1" />
                  Add Slide
                </button>
                
                <div className="flex justify-between">
                  <button
                    onClick={handleExportPresentation}
                    className="flex-1 py-2 rounded-lg font-medium flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 mr-2"
                  >
                    <FiDownload className="mr-1" />
                    Export
                  </button>
                  <button
                    onClick={startFullScreenPreview}
                    className="flex-1 py-2 rounded-lg font-medium flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <FiMaximize className="mr-1" />
                    Preview
                  </button>
                </div>
              </div>
            </div>
            
            {/* Right Content - Slide Editor */}
            {selectedSlide && (
              <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="mb-6 flex justify-between items-center">
                  <h2 className="text-lg font-medium">Edit Slide</h2>
                  
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => moveSlide(selectedSlide.id, 'up')}
                      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      <FiArrowUp />
                    </button>
                    <button 
                      onClick={() => moveSlide(selectedSlide.id, 'down')}
                      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      <FiArrowDown />
                    </button>
                    <button 
                      onClick={() => deleteSlide(selectedSlide.id)}
                      className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800/40"
                    >
                      <FiTrash />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Slide Title</label>
                    <input 
                      type="text"
                      value={selectedSlide.title}
                      onChange={(e) => updateSlideTitle(selectedSlide.id, e.target.value)}
                      className="w-full p-3 border rounded-lg shadow-sm dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Layout</label>
                    <div className="grid grid-cols-5 gap-2">
                      {layoutOptions.map((layout) => (
                        <button
                          key={layout.id}
                          onClick={() => updateSlideLayout(selectedSlide.id, layout.id as any)}
                          className={`p-2 border rounded-lg flex flex-col items-center ${
                            selectedSlide.layout === layout.id
                              ? 'bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-400'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <span className="text-lg mb-1">{layout.icon}</span>
                          <span className="text-xs">{layout.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Content</label>
                    <textarea 
                      value={selectedSlide.content}
                      onChange={(e) => updateSlideContent(selectedSlide.id, e.target.value)}
                      className="w-full p-3 border rounded-lg shadow-sm h-56 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium mb-4">Preview</h3>
                  
                  <div className="aspect-[16/9] bg-gray-100 dark:bg-gray-900 rounded-lg shadow-sm p-8 flex flex-col">
                    {selectedSlide.layout === 'title' && (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <h1 className="text-3xl font-bold mb-4">{selectedSlide.title}</h1>
                        <p className="text-xl text-gray-600 dark:text-gray-400">{selectedSlide.content}</p>
                      </div>
                    )}
                    
                    {selectedSlide.layout === 'content' && (
                      <div className="h-full">
                        <h2 className="text-2xl font-bold mb-4">{selectedSlide.title}</h2>
                        <div className="text-gray-800 dark:text-gray-200 whitespace-pre-line">
                          {selectedSlide.content}
                        </div>
                      </div>
                    )}
                    
                    {selectedSlide.layout === 'two-column' && (
                      <div className="h-full">
                        <h2 className="text-2xl font-bold mb-4">{selectedSlide.title}</h2>
                        <div className="grid grid-cols-2 gap-8 h-[calc(100%-4rem)]">
                          <div className="text-gray-800 dark:text-gray-200 whitespace-pre-line">
                            {selectedSlide.content}
                          </div>
                          <div className="border-l border-gray-300 dark:border-gray-700 pl-8">
                            {/* Right column content would be extracted from content in a real implementation */}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {selectedSlide.layout === 'image-text' && (
                      <div className="h-full">
                        <h2 className="text-2xl font-bold mb-4">{selectedSlide.title}</h2>
                        <div className="grid grid-cols-2 gap-8 h-[calc(100%-4rem)]">
                          <div className="bg-gray-300 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400">
                            <FiImage size={48} />
                          </div>
                          <div className="text-gray-800 dark:text-gray-200 whitespace-pre-line">
                            {selectedSlide.content}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {selectedSlide.layout === 'bullets' && (
                      <div className="h-full">
                        <h2 className="text-2xl font-bold mb-4">{selectedSlide.title}</h2>
                        <ul className="list-disc pl-6 space-y-2 text-gray-800 dark:text-gray-200 whitespace-pre-line">
                          {selectedSlide.content.split('\n').map((line, i) => (
                            line.trim() && <li key={i}>{line}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Full Screen Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="p-4 flex justify-between text-white">
            <h2 className="text-xl font-medium">{presentationTitle}</h2>
            <button
              onClick={() => setShowPreview(false)}
              className="text-white hover:text-gray-300"
            >
              <FiX size={24} />
            </button>
          </div>
          
          <div className="flex-1 flex items-center justify-center p-8">
            {slides[previewSlideIndex] && (
              <div className="bg-white w-full max-w-5xl aspect-[16/9] rounded-lg shadow-lg p-12">
                {/* Slide content would be rendered here similarly to the preview above */}
                <h2 className="text-3xl font-bold mb-6">{slides[previewSlideIndex].title}</h2>
                <div className="text-lg whitespace-pre-line">
                  {slides[previewSlideIndex].content}
                </div>
              </div>
            )}
          </div>
          
          <div className="p-4 flex justify-between text-white">
            <button
              onClick={() => setPreviewSlideIndex(Math.max(0, previewSlideIndex - 1))}
              disabled={previewSlideIndex === 0}
              className={`px-4 py-2 rounded-lg ${
                previewSlideIndex === 0 
                  ? 'text-gray-500 cursor-not-allowed' 
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              Previous
            </button>
            
            <div className="text-center">
              Slide {previewSlideIndex + 1} of {slides.length}
            </div>
            
            <button
              onClick={() => setPreviewSlideIndex(Math.min(slides.length - 1, previewSlideIndex + 1))}
              disabled={previewSlideIndex === slides.length - 1}
              className={`px-4 py-2 rounded-lg ${
                previewSlideIndex === slides.length - 1 
                  ? 'text-gray-500 cursor-not-allowed' 
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PresentationCreatorPage; 
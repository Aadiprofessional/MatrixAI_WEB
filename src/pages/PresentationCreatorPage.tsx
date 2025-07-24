import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
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
  FiList,
  FiGrid,
  FiChevronRight,
  FiBriefcase,
  FiBook,
  FiBarChart,
  FiGlobe,
  FiCpu,
  FiPieChart,
  FiClipboard,
  FiCheckSquare,
  FiTarget,
  FiGift
} from 'react-icons/fi';
import { ProFeatureAlert, AuthRequiredButton } from '../components';
import { useUser } from '../context/UserContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

interface Slide {
  id: string;
  title: string;
  content: string;
  layout: 'title' | 'content' | 'two-column' | 'image-text' | 'bullets';
  backgroundImage?: string;
  backgroundType?: string;
  style?: SlideStyle;
}

interface SlideStyle {
  fontFamily?: string;
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
}

interface Template {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  thumbnail: string;
  slides: Slide[];
  style: SlideStyle;
  backgroundImage?: string;
  backgroundType?: string;
}

interface TemplateCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  subcategories: TemplateSubcategory[];
}

interface TemplateSubcategory {
  id: string;
  name: string;
  templates: Template[];
}

interface TemplateCardProps {
  template: Template;
  isSelected: boolean;
  onSelect: (template: Template) => void;
}

// Template card component - separate component to use hooks properly
const TemplateCard: React.FC<TemplateCardProps> = ({ template, isSelected, onSelect }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isHovering) {
      interval = setInterval(() => {
        setCurrentSlideIndex(prev => 
          prev < template.slides.length - 1 ? prev + 1 : 0
        );
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isHovering, template.slides.length]);
  
  return (
    <div 
      className={`flex-shrink-0 w-64 rounded-lg overflow-hidden shadow-md border ${
        isSelected
          ? 'border-blue-500 dark:border-blue-600 ring-2 ring-blue-300 dark:ring-blue-900'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      } transition-all cursor-pointer hover:shadow-lg`}
      onClick={() => onSelect(template)}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        setCurrentSlideIndex(0);
      }}
    >
      <div className="relative">
        {/* Main slide preview */}
        <div 
          className="aspect-[16/9] relative overflow-hidden"
          style={{
            backgroundColor: template.style.backgroundColor || '#f0f0f0'
          }}
        >
          {/* Background image */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(/templates/${template.category}/${template.id}/slide${currentSlideIndex + 1}.jpg)`,
              opacity: 0.9
            }}
          />
        </div>
        
        {/* Slide number indicator */}
        <div className="absolute bottom-2 right-2 text-xs font-medium px-2 py-1 rounded-full bg-black/40 text-white">
          {currentSlideIndex + 1}/{template.slides.length}
        </div>

        {/* Selected badge */}
        {isSelected && (
          <div className="absolute top-2 right-2">
            <div className="bg-blue-500 text-white rounded-full p-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-3 bg-white dark:bg-gray-800">
        <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
          {template.name}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {template.slides.length} slides • {template.category}
        </p>
      </div>
    </div>
  );
};

const PresentationCreatorPage: React.FC = () => {
  const { userData, isPro } = useUser();
  const { t } = useLanguage();
  const { theme } = useTheme();
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
  
  // New state variables for template selection
  const [showTemplates, setShowTemplates] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);

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
  
  // Template categories with icons
  const templateCategories: TemplateCategory[] = [
    {
      id: 'business',
      name: 'Business',
      icon: <FiBriefcase />,
      subcategories: [
        {
          id: 'marketing',
          name: 'Marketing',
          templates: []
        },
        {
          id: 'sales',
          name: 'Sales',
          templates: []
        },
        {
          id: 'strategy',
          name: 'Strategy',
          templates: []
        },
        {
          id: 'project',
          name: 'Project Management',
          templates: []
        }
      ]
    },
    {
      id: 'education',
      name: 'Education',
      icon: <FiBook />,
      subcategories: [
        {
          id: 'lesson',
          name: 'Lesson Plans',
          templates: []
        },
        {
          id: 'research',
          name: 'Research',
          templates: []
        },
        {
          id: 'thesis',
          name: 'Thesis Defense',
          templates: []
        },
        {
          id: 'student',
          name: 'Student Projects',
          templates: []
        }
      ]
    },
    {
      id: 'data',
      name: 'Data & Analytics',
      icon: <FiBarChart />,
      subcategories: [
        {
          id: 'reports',
          name: 'Data Reports',
          templates: []
        },
        {
          id: 'dashboards',
          name: 'Dashboards',
          templates: []
        },
        {
          id: 'analytics',
          name: 'Analytics',
          templates: []
        }
      ]
    },
    {
      id: 'tech',
      name: 'Technology',
      icon: <FiCpu />,
      subcategories: [
        {
          id: 'product',
          name: 'Product Launch',
          templates: []
        },
        {
          id: 'startup',
          name: 'Startup Pitch',
          templates: []
        },
        {
          id: 'development',
          name: 'Development',
          templates: []
        }
      ]
    },
    {
      id: 'creative',
      name: 'Creative',
      icon: <FiGift />,
      subcategories: [
        {
          id: 'portfolio',
          name: 'Portfolio',
          templates: []
        },
        {
          id: 'storytelling',
          name: 'Storytelling',
          templates: []
        },
        {
          id: 'branding',
          name: 'Branding',
          templates: []
        }
      ]
    }
  ];

  // Use useEffect to populate templates
  useEffect(() => {
    // Template creation function
    const createTemplate = (
      id: string, 
      name: string, 
      category: string, 
      subcategory: string, 
      style: SlideStyle
    ): Template => {
      // Create a base template with 5 slides
      const templateSlides: Slide[] = [
        {
          id: `${id}-slide-1`,
          title: name,
          content: 'Subtitle: ' + name,
          layout: 'title',
          backgroundImage: `/templates/${category}/${id}/slide1.jpg`,
          backgroundType: 'cover',
          style
        },
        {
          id: `${id}-slide-2`,
          title: 'Introduction',
          content: 'Overview and key points',
          layout: 'content',
          backgroundImage: `/templates/${category}/${id}/slide2.jpg`,
          backgroundType: 'bottom',
          style
        },
        {
          id: `${id}-slide-3`,
          title: 'Key Information',
          content: 'Important details and analysis',
          layout: 'two-column',
          backgroundImage: `/templates/${category}/${id}/slide3.jpg`,
          backgroundType: 'right',
          style
        },
        {
          id: `${id}-slide-4`,
          title: 'Visual Data',
          content: 'Image and supporting text',
          layout: 'image-text',
          backgroundImage: `/templates/${category}/${id}/slide4.jpg`,
          backgroundType: 'left',
          style
        },
        {
          id: `${id}-slide-5`,
          title: 'Summary',
          content: '• Point 1\n• Point 2\n• Point 3\n• Point 4\n• Point 5',
          layout: 'bullets',
          backgroundImage: `/templates/${category}/${id}/slide5.jpg`,
          backgroundType: 'bottom',
          style
        }
      ];
      
      // Sample background images for each template
      const backgroundImage = `/templates/${category}/${id}/background.jpg`;
      
      return {
        id,
        name,
        category,
        subcategory,
        thumbnail: `/templates/${category}/${id}/thumbnail.jpg`,
        slides: templateSlides,
        style,
        backgroundImage,
        backgroundType: 'cover'
      };
    };
    
    // Create templates for each category
    const allTemplates = [
      // Business templates
      createTemplate('business-modern', 'Modern Business', 'business', 'marketing', {
        fontFamily: 'Arial',
        primaryColor: '#2563EB',
        secondaryColor: '#9333EA',
        backgroundColor: '#ffffff',
        textColor: '#1E293B'
      }),
      createTemplate('business-pitch', 'Pitch Deck', 'business', 'sales', {
        fontFamily: 'Helvetica',
        primaryColor: '#3B82F6',
        secondaryColor: '#10B981',
        backgroundColor: '#F9FAFB',
        textColor: '#111827'
      }),
      createTemplate('business-plan', 'Business Plan', 'business', 'strategy', {
        fontFamily: 'Montserrat',
        primaryColor: '#0284C7',
        secondaryColor: '#0369A1',
        backgroundColor: '#F8FAFC',
        textColor: '#334155'
      }),
      createTemplate('project-roadmap', 'Project Roadmap', 'business', 'project', {
        fontFamily: 'Roboto',
        primaryColor: '#6366F1',
        secondaryColor: '#8B5CF6',
        backgroundColor: '#ffffff',
        textColor: '#374151'
      }),
      
      // Education templates
      createTemplate('education-lesson', 'Lesson Plan', 'education', 'lesson', {
        fontFamily: 'Georgia',
        primaryColor: '#5B21B6',
        secondaryColor: '#7C3AED',
        backgroundColor: '#F5F3FF',
        textColor: '#1F2937'
      }),
      createTemplate('education-research', 'Research Presentation', 'education', 'research', {
        fontFamily: 'Times New Roman',
        primaryColor: '#4338CA',
        secondaryColor: '#6D28D9',
        backgroundColor: '#ffffff',
        textColor: '#111827'
      }),
      createTemplate('education-thesis', 'Thesis Defense', 'education', 'thesis', {
        fontFamily: 'Palatino',
        primaryColor: '#1E40AF',
        secondaryColor: '#3B82F6',
        backgroundColor: '#F9FAFB',
        textColor: '#1F2937'
      }),
      createTemplate('education-project', 'Student Project', 'education', 'student', {
        fontFamily: 'Calibri',
        primaryColor: '#0EA5E9',
        secondaryColor: '#38BDF8',
        backgroundColor: '#F0F9FF',
        textColor: '#0F172A'
      }),
      
      // Data templates
      createTemplate('data-analysis', 'Data Analysis', 'data', 'reports', {
        fontFamily: 'IBM Plex Sans',
        primaryColor: '#0891B2',
        secondaryColor: '#06B6D4',
        backgroundColor: '#ECFEFF',
        textColor: '#164E63'
      }),
      createTemplate('data-dashboard', 'Dashboard Presentation', 'data', 'dashboards', {
        fontFamily: 'Segoe UI',
        primaryColor: '#059669',
        secondaryColor: '#10B981',
        backgroundColor: '#ffffff',
        textColor: '#065F46'
      }),
      createTemplate('data-insights', 'Insights Report', 'data', 'analytics', {
        fontFamily: 'SF Pro Display',
        primaryColor: '#0D9488',
        secondaryColor: '#14B8A6',
        backgroundColor: '#F0FDFA',
        textColor: '#134E4A'
      }),
      
      // Technology templates
      createTemplate('tech-launch', 'Product Launch', 'tech', 'product', {
        fontFamily: 'Inter',
        primaryColor: '#4F46E5',
        secondaryColor: '#818CF8',
        backgroundColor: '#EEF2FF',
        textColor: '#1E1B4B'
      }),
      createTemplate('tech-startup', 'Startup Pitch', 'tech', 'startup', {
        fontFamily: 'Poppins',
        primaryColor: '#9333EA',
        secondaryColor: '#A855F7',
        backgroundColor: '#ffffff',
        textColor: '#581C87'
      }),
      createTemplate('tech-dev', 'Development Roadmap', 'tech', 'development', {
        fontFamily: 'Source Sans Pro',
        primaryColor: '#2563EB',
        secondaryColor: '#3B82F6',
        backgroundColor: '#EFF6FF',
        textColor: '#1E3A8A'
      }),
      
      // Creative templates
      createTemplate('creative-portfolio', 'Creative Portfolio', 'creative', 'portfolio', {
        fontFamily: 'Playfair Display',
        primaryColor: '#DB2777',
        secondaryColor: '#EC4899',
        backgroundColor: '#FDF2F8',
        textColor: '#831843'
      }),
      createTemplate('creative-story', 'Storytelling', 'creative', 'storytelling', {
        fontFamily: 'Merriweather',
        primaryColor: '#EA580C',
        secondaryColor: '#F97316',
        backgroundColor: '#FFF7ED',
        textColor: '#7C2D12'
      }),
      createTemplate('creative-brand', 'Brand Presentation', 'creative', 'branding', {
        fontFamily: 'Montserrat',
        primaryColor: '#C026D3',
        secondaryColor: '#E879F9',
        backgroundColor: '#ffffff',
        textColor: '#701A75'
      }),
      
      // Add more pre-designed complete templates
      createTemplate('modern-company', 'Modern Company Profile', 'business', 'marketing', {
        fontFamily: 'Roboto',
        primaryColor: '#3730A3',
        secondaryColor: '#4F46E5',
        backgroundColor: '#ffffff',
        textColor: '#1F2937'
      }),
      createTemplate('minimal-pitch', 'Minimal Pitch Deck', 'business', 'sales', {
        fontFamily: 'Inter',
        primaryColor: '#0F172A',
        secondaryColor: '#334155',
        backgroundColor: '#F8FAFC',
        textColor: '#0F172A'
      }),
      createTemplate('tech-product', 'Tech Product Launch', 'tech', 'product', {
        fontFamily: 'SF Pro Display',
        primaryColor: '#7C3AED',
        secondaryColor: '#8B5CF6',
        backgroundColor: '#F5F3FF',
        textColor: '#1F2937'
      }),
      createTemplate('creative-portfolio-2', 'Creative Portfolio 2', 'creative', 'portfolio', {
        fontFamily: 'Montserrat',
        primaryColor: '#BE185D',
        secondaryColor: '#DB2777',
        backgroundColor: '#FFF1F2',
        textColor: '#9D174D'
      }),
      createTemplate('data-visualization', 'Data Visualization', 'data', 'analytics', {
        fontFamily: 'IBM Plex Sans',
        primaryColor: '#1E40AF',
        secondaryColor: '#3B82F6',
        backgroundColor: '#EFF6FF',
        textColor: '#1E3A8A'
      })
    ];
    
    // Distribute templates to their respective subcategories
    const updatedCategories = [...templateCategories];
    
    allTemplates.forEach(template => {
      const categoryIndex = updatedCategories.findIndex(c => c.id === template.category);
      if (categoryIndex !== -1) {
        const subcategoryIndex = updatedCategories[categoryIndex].subcategories.findIndex(
          sc => sc.id === template.subcategory
        );
        
        if (subcategoryIndex !== -1) {
          updatedCategories[categoryIndex].subcategories[subcategoryIndex].templates.push(template);
        }
      }
    });
    
    // Set the initial selected category
    setSelectedCategory('all');
    
  }, []);

  // Generate presentation content using the API
  const generatePresentationContent = async (userPrompt: string) => {
    try {
      setIsGenerating(true);
      
      const response = await axios.post(
        'https://ddtgdhehxhgarkonvpfq.supabase.co/functions/v1/createContent',
        {
          prompt: userPrompt + (fileContent ? `\n\n[Image data: ${fileContent}]` : ''),
          format: 'xml',
          numSlides: numSlides,
          style: presentationStyle,
          template: selectedTemplate ? selectedTemplate.id : null
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Extract AI response
      const aiContent = response.data.output.text;
      
      // Parse the XML content
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(aiContent, "text/xml");
      
      // Process the presentation content
      const title = xmlDoc.getElementsByTagName("title")[0]?.textContent || userPrompt.substring(0, 40);
      const slideElements = xmlDoc.getElementsByTagName("slide");
      
      setPresentationTitle(title);
      
      const generatedSlides: Slide[] = [];
      
      // Create slides based on the XML response
      for (let i = 0; i < slideElements.length; i++) {
        const slideEl = slideElements[i];
        const slideType = slideEl.getAttribute("type") || (i === 0 ? "title" : "content");
        const slideTitle = slideEl.getElementsByTagName("heading")[0]?.textContent || "";
        const slideContent = slideEl.getElementsByTagName("content")[0]?.textContent || "";
        
        generatedSlides.push({
          id: (Date.now() + i).toString(),
          title: slideTitle || (i === 0 ? title : `Slide ${i + 1}`),
          content: slideContent || "",
          layout: slideType as any || "content",
          backgroundImage: selectedTemplate?.slides[i]?.backgroundImage,
          backgroundType: selectedTemplate?.slides[i]?.backgroundType,
          style: selectedTemplate?.style
        });
      }
      
      // If no slides were parsed correctly, create default slides
      if (generatedSlides.length === 0) {
        // Fallback to default slide generation
        generatedSlides.push({
          id: Date.now().toString(),
          title: title,
          content: 'Subtitle: Overview and Key Insights',
          layout: 'title',
          style: selectedTemplate?.style
        });
        
        const layouts: Array<'content' | 'two-column' | 'image-text' | 'bullets'> = ['content', 'two-column', 'image-text', 'bullets'];
        
        for (let i = 1; i < numSlides; i++) {
          const layout = layouts[i % layouts.length] as any;
          
          generatedSlides.push({
            id: (Date.now() + i).toString(),
            title: `Slide ${i + 1}`,
            content: 'Content will be generated here...',
            layout: layout,
            backgroundImage: selectedTemplate?.slides[i]?.backgroundImage,
            backgroundType: selectedTemplate?.slides[i]?.backgroundType,
            style: selectedTemplate?.style
          });
        }
      }
      
      setSlides(generatedSlides);
      setSelectedSlideId(generatedSlides[0].id);
      setShowTemplates(false);
      
      // Decrease free generations left if user is not pro
      if (!isPro) {
        setFreeGenerationsLeft(prev => prev - 1);
      }
      
      return true;
    } catch (error) {
      console.error('Error generating presentation content:', error);
      return false;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyTemplate = () => {
    if (!selectedTemplate) return;
    
    const templateSlides = selectedTemplate.slides.map((slide, index) => ({
      ...slide,
      id: (Date.now() + index).toString()
    }));
    
    setSlides(templateSlides);
    setPresentationTitle(selectedTemplate.name);
    setSelectedSlideId(templateSlides[0].id);
    setShowTemplates(false);
  };
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileContent(content);
    };
    reader.readAsText(file);
  };

  const handleGeneratePresentation = async () => {
    if (!prompt.trim()) return;
    
    // If user is not pro and has used all free generations, show pro alert
    if (!isPro && freeGenerationsLeft <= 0) {
      setShowProAlert(true);
      return;
    }
    
    const success = await generatePresentationContent(prompt);
    
    if (!success) {
      // Fallback to the original generation method
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
          layout: 'title',
          style: selectedTemplate?.style
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
            layout: layout,
            backgroundImage: selectedTemplate?.slides[i]?.backgroundImage,
            backgroundType: selectedTemplate?.slides[i]?.backgroundType,
            style: selectedTemplate?.style
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
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 opacity-80"></div>
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] dark:opacity-[0.05]"></div>
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-br from-blue-400/20 via-indigo-400/20 to-purple-400/20 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 blur-3xl rounded-full transform translate-x-1/3 -translate-y-1/4"></div>
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-blue-400/20 via-indigo-400/20 to-purple-400/20 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 blur-3xl rounded-full transform -translate-x-1/3 translate-y-1/4"></div>
      <div className="container mx-auto max-w-6xl flex-1 p-0 relative z-10">
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
          {t('presentation.title')}
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-500 dark:text-gray-400"
        >
          {t('presentation.subtitle')}
        </motion.p>
        
        {!isPro && (
          <div className="mt-2 flex items-center text-sm text-yellow-600 dark:text-yellow-400">
            <FiLayers className="mr-1.5" />
            <span>{freeGenerationsLeft} {freeGenerationsLeft === 1 ? t('presentation.freeLeft') : t('presentation.freeLeftPlural')} left</span>
            {freeGenerationsLeft === 0 && (
              <button 
                onClick={() => setShowProAlert(true)}
                className="ml-2 text-blue-500 hover:text-blue-600 font-medium"
              >
                                  {t('presentation.upgradeText')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Presentation Generation Form - Show only when no slides are created yet */}
      {slides.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-medium mb-6">{t('chooseTemplateOrCreateOwn')}</h2>
          
          {/* Template Categories */}
          <div className="mb-6">
            <div className="flex overflow-x-auto space-x-3 pb-2 scrollbar-hide">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`flex-shrink-0 px-4 py-2 rounded-lg flex items-center ${
                  selectedCategory === 'all'
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
                }`}
              >
                <span className="mr-2"><FiGrid /></span>
                <span>{t('allTemplates')}</span>
              </button>
              {templateCategories.map(category => (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.id);
                  }}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg flex items-center ${
                    selectedCategory === category.id
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
                  }`}
                >
                  <span className="mr-2">{category.icon}</span>
                  <span>{category.name}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Template Gallery - Grid layout */}
          <div className="mb-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {(selectedCategory === 'all' 
                ? templateCategories.flatMap(cat => cat.subcategories).flatMap(subcat => subcat.templates)
                : templateCategories
                    .find(c => c.id === selectedCategory)
                    ?.subcategories.flatMap(subcategory => subcategory.templates) || []
              ).map((template) => (
                <TemplateCard 
                  key={template.id}
                  template={template}
                  isSelected={selectedTemplate?.id === template.id}
                  onSelect={setSelectedTemplate}
                />
              ))}
            </div>
          </div>
          
          {selectedTemplate ? (
            <div className="space-y-4">
              <div className="flex items-center bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="flex-shrink-0 mr-4">
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-white">
                    <img 
                      src={`/templates/${selectedTemplate.category}/${selectedTemplate.id}/thumbnail.jpg`}
                      alt={selectedTemplate.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-blue-700 dark:text-blue-300">
                    {t('templateSelected')} {selectedTemplate.name}
                  </h3>
                  <p className="text-sm text-blue-600/70 dark:text-blue-400/70">
                    {selectedTemplate.slides.length} {t('slides')} • {selectedTemplate.category}
                  </p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      handleApplyTemplate();
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    {t('useTemplate')}
                  </button>
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:dark:text-gray-300"
                  >
                    <FiX />
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">{t('customizeWithContent')}</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={t('describePresentationTopic')}
                  className="w-full p-3 border rounded-lg shadow-sm h-32 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isGenerating}
                />
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={handleApplyTemplate}
                  className="flex-1 py-3 rounded-lg font-medium flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  <FiLayout className="mr-2" />
                  {t('useTemplateAsIs')}
                </button>
                
                <AuthRequiredButton
                  onClick={handleGeneratePresentation}
                  disabled={!prompt.trim() || isGenerating}
                  className={`flex-1 py-3 rounded-lg font-medium flex items-center justify-center ${
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
                      {t('generatingContent')}
                    </>
                  ) : (
                    <>
                      <FiZap className="mr-2" />
                      {t('generateAIContent')}
                    </>
                  )}
                </AuthRequiredButton>
              </div>
            </div>
          ) : (
            <div className="text-center p-8 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
              <FiLayout className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">{t('selectTemplate')}</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">{t('chooseFromProfessionalTemplates')}</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">{t('or')}</p>
              <button
                onClick={() => {
                  // Create a blank template
                  const blankTemplate: Template = {
                    id: 'blank-template',
                    name: 'Blank Presentation',
                    category: 'custom',
                    thumbnail: '',
                    slides: [
                      {
                        id: 'blank-slide-1',
                        title: 'New Presentation',
                        content: 'Your subtitle here',
                        layout: 'title',
                      }
                    ],
                    style: {
                      fontFamily: 'Arial',
                      primaryColor: '#3B82F6',
                      secondaryColor: '#6366F1',
                      backgroundColor: '#ffffff',
                      textColor: '#111827'
                    }
                  };
                  setSelectedTemplate(blankTemplate);
                }}
                className="mt-4 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {t('startFromScratch')}
              </button>
            </div>
          )}
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
                  {t('addSlide')}
                </button>
                
                <div className="flex justify-between">
                  <button
                    onClick={handleExportPresentation}
                    className="flex-1 py-2 rounded-lg font-medium flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 mr-2"
                  >
                    <FiDownload className="mr-1" />
                    {t('export')}
                  </button>
                  <button
                    onClick={startFullScreenPreview}
                    className="flex-1 py-2 rounded-lg font-medium flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <FiMaximize className="mr-1" />
                    {t('preview')}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Right Content - Slide Editor */}
            {selectedSlide && (
              <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="mb-6 flex justify-between items-center">
                  <h2 className="text-lg font-medium">{t('editSlide')}</h2>
                  
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
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">{t('slideTitle')}</label>
                    <input 
                      type="text"
                      value={selectedSlide.title}
                      onChange={(e) => updateSlideTitle(selectedSlide.id, e.target.value)}
                      className="w-full p-3 border rounded-lg shadow-sm dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">{t('layout')}</label>
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
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">{t('content')}</label>
                    <textarea 
                      value={selectedSlide.content}
                      onChange={(e) => updateSlideContent(selectedSlide.id, e.target.value)}
                      className="w-full p-3 border rounded-lg shadow-sm h-56 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium mb-4">{t('preview')}</h3>
                  
                  <div 
                    className="aspect-[16/9] bg-gray-100 dark:bg-gray-900 rounded-lg shadow-sm p-8 flex flex-col relative overflow-hidden"
                    style={{
                      backgroundColor: selectedSlide.style?.backgroundColor || 'inherit',
                      color: selectedSlide.style?.textColor || 'inherit',
                      fontFamily: selectedSlide.style?.fontFamily || 'inherit'
                    }}
                  >
                    {/* Background image or color */}
                    {selectedSlide.backgroundImage && (
                      <div className="absolute inset-0 bg-cover bg-center opacity-10" 
                        style={{
                          backgroundImage: `url(${selectedSlide.backgroundImage})`,
                          backgroundPosition: selectedSlide.backgroundType === 'cover' ? 'center' : 
                            selectedSlide.backgroundType === 'left' ? 'left center' :
                            selectedSlide.backgroundType === 'right' ? 'right center' : 'center bottom'
                        }}
                      />
                    )}
                    
                    {/* Slide content with styling */}
                    <div className="relative z-10 h-full">
                      {selectedSlide.layout === 'title' && (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                          <h1 
                            className="text-3xl font-bold mb-4"
                            style={{ color: selectedSlide.style?.primaryColor || 'inherit' }}
                          >
                            {selectedSlide.title}
                          </h1>
                          <p 
                            className="text-xl"
                            style={{ color: selectedSlide.style?.secondaryColor || 'inherit' }}
                          >
                            {selectedSlide.content}
                          </p>
                        </div>
                      )}
                      
                      {selectedSlide.layout === 'content' && (
                        <div className="h-full">
                          <h2 
                            className="text-2xl font-bold mb-4"
                            style={{ color: selectedSlide.style?.primaryColor || 'inherit' }}
                          >
                            {selectedSlide.title}
                          </h2>
                          <div className="whitespace-pre-line">
                            {selectedSlide.content}
                          </div>
                        </div>
                      )}
                      
                      {selectedSlide.layout === 'two-column' && (
                        <div className="h-full">
                          <h2 
                            className="text-2xl font-bold mb-4"
                            style={{ color: selectedSlide.style?.primaryColor || 'inherit' }}
                          >
                            {selectedSlide.title}
                          </h2>
                          <div className="grid grid-cols-2 gap-8 h-[calc(100%-4rem)]">
                            <div className="whitespace-pre-line">
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
                          <h2 
                            className="text-2xl font-bold mb-4"
                            style={{ color: selectedSlide.style?.primaryColor || 'inherit' }}
                          >
                            {selectedSlide.title}
                          </h2>
                          <div className="grid grid-cols-2 gap-8 h-[calc(100%-4rem)]">
                            <div 
                              className="bg-gray-300 dark:bg-gray-700 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: selectedSlide.style?.secondaryColor ? `${selectedSlide.style.secondaryColor}20` : 'inherit' }}
                            >
                              <FiImage 
                                size={48} 
                                style={{ color: selectedSlide.style?.secondaryColor || 'inherit' }}
                              />
                            </div>
                            <div className="whitespace-pre-line">
                              {selectedSlide.content}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {selectedSlide.layout === 'bullets' && (
                        <div className="h-full">
                          <h2 
                            className="text-2xl font-bold mb-4"
                            style={{ color: selectedSlide.style?.primaryColor || 'inherit' }}
                          >
                            {selectedSlide.title}
                          </h2>
                          <ul className="list-disc pl-6 space-y-2 whitespace-pre-line">
                            {selectedSlide.content.split('\n').map((line, i) => (
                              line.trim() && <li key={i}>{line}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
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
              <div 
                className="bg-white w-full max-w-5xl aspect-[16/9] rounded-lg shadow-lg p-12 relative overflow-hidden"
                style={{
                  backgroundColor: slides[previewSlideIndex].style?.backgroundColor || 'white',
                  color: slides[previewSlideIndex].style?.textColor || 'inherit',
                  fontFamily: slides[previewSlideIndex].style?.fontFamily || 'inherit'
                }}
              >
                {/* Background image or color */}
                {slides[previewSlideIndex].backgroundImage && (
                  <div className="absolute inset-0 bg-cover bg-center opacity-10" 
                    style={{
                      backgroundImage: `url(${slides[previewSlideIndex].backgroundImage})`,
                      backgroundPosition: slides[previewSlideIndex].backgroundType === 'cover' ? 'center' : 
                        slides[previewSlideIndex].backgroundType === 'left' ? 'left center' :
                        slides[previewSlideIndex].backgroundType === 'right' ? 'right center' : 'center bottom'
                    }}
                  />
                )}
                
                {/* Slide content */}
                <div className="relative z-10">
                  {slides[previewSlideIndex].layout === 'title' ? (
                    <div className="flex flex-col items-center justify-center text-center">
                      <h1 
                        className="text-4xl font-bold mb-6"
                        style={{ color: slides[previewSlideIndex].style?.primaryColor || 'inherit' }}
                      >
                        {slides[previewSlideIndex].title}
                      </h1>
                      <p 
                        className="text-2xl"
                        style={{ color: slides[previewSlideIndex].style?.secondaryColor || 'inherit' }}
                      >
                        {slides[previewSlideIndex].content}
                      </p>
                    </div>
                  ) : (
                    <>
                      <h2 
                        className="text-3xl font-bold mb-6"
                        style={{ color: slides[previewSlideIndex].style?.primaryColor || 'inherit' }}
                      >
                        {slides[previewSlideIndex].title}
                      </h2>
                      <div 
                        className="text-lg whitespace-pre-line"
                      >
                        {slides[previewSlideIndex].content}
                      </div>
                    </>
                  )}
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
              {t('previous')}
            </button>
            
            <div className="text-center">
              {t('slide')} {previewSlideIndex + 1} {t('of')} {slides.length}
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
              {t('next')}
            </button>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default PresentationCreatorPage;
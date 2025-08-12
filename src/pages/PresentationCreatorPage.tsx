import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { FiDownload, FiShare2, FiTrash, FiChevronDown, FiRefreshCw, FiList, FiX, FiClock, FiChevronLeft, FiChevronRight, FiPlay, FiPause } from 'react-icons/fi';
import { ProFeatureAlert, AuthRequiredButton } from '../components';
import { useUser } from '../context/UserContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useAlert } from '../context/AlertContext';
import { useTranslation } from 'react-i18next';
import './PresentationCreatorPage.css';

// Add gradient animation style
const gradientAnimationStyle = document.createElement('style');
gradientAnimationStyle.textContent = `
  @keyframes gradient-x {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  .animate-gradient-x {
    background-size: 200% 200%;
    animation: gradient-x 3s ease infinite;
    background-image: linear-gradient(to right, #ec4899, #eab308, #a855f7);
  }
`;
document.head.appendChild(gradientAnimationStyle);

// Define presentation interfaces
interface PresentationData {
  id: string;
  title: string;
  description: string;
  status: 'processing' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
  structure?: any;
  background_image_url?: string;
  ppt_download_url?: string;
}

interface PresentationHistoryItem {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  completed_at?: string;
  ppt_download_url?: string;
}

const PresentationCreatorPage: React.FC = () => {
  const { userData, isPro } = useUser();
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { showAlert, showSuccess, showError, showInfo, showWarning, showConfirmation } = useAlert();
  const { t } = useTranslation();
  const uid = user?.uid || '';

  // State for presentation generation
  const [description, setDescription] = useState('');
  const [presentations, setPresentations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [pages, setPages] = useState(5);
  const [purpose, setPurpose] = useState('educational');
  const [showProAlert, setShowProAlert] = useState(false);
  const [freeGenerationsLeft, setFreeGenerationsLeft] = useState(3);
  
  // Presentation generation state
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentPresentationId, setCurrentPresentationId] = useState<string | null>(null);
  const [estimatedTime, setEstimatedTime] = useState<string>('');
  const [coinsCost, setCoinsCost] = useState<number>(0);
  
  // Animation controls
  const presentationOpacity = useAnimation();
  const presentationScale = useAnimation();
  
  // Presentation History states
  const [presentationHistory, setPresentationHistory] = useState<PresentationHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [hasMorePresentations, setHasMorePresentations] = useState(true);
  const [presentationsPerPage] = useState(10);
  const [showHistory, setShowHistory] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [allPresentationHistory, setAllPresentationHistory] = useState<PresentationHistoryItem[]>([]);
  
  // PowerPoint viewer state
  const [selectedPresentationUrl, setSelectedPresentationUrl] = useState<string>('');
  const [showPowerPointViewer, setShowPowerPointViewer] = useState(false);

  // Purpose options
  const purposeOptions = [
    { id: 'educational', name: t('presentation.purpose.educational', 'Educational') },
    { id: 'business', name: t('presentation.purpose.business', 'Business') },
    { id: 'marketing', name: t('presentation.purpose.marketing', 'Marketing') },
    { id: 'academic', name: t('presentation.purpose.academic', 'Academic') },
    { id: 'training', name: t('presentation.purpose.training', 'Training') },
    { id: 'pitch', name: t('presentation.purpose.pitch', 'Pitch') },
  ];

  // Fade in animation
  const fadeInPresentation = () => {
    presentationOpacity.start({ 
      opacity: 1, 
      transition: { duration: 0.5 } 
    });
    presentationScale.start({ 
      scale: 1, 
      transition: { duration: 0.5, type: 'spring' } 
    });
  };

  // Clear stored presentations from local storage
  const clearStoredPresentations = async () => {
    localStorage.removeItem("downloadedPresentations");
    return true;
  };

  // Function to create presentation using direct API
  const createPresentation = async () => {
    try {
      // Clear any previously stored presentations when creating new ones
      await clearStoredPresentations();
      
      setLoading(true);
      setShowSkeleton(true);
      setError(null);
      setGenerationStatus('processing');
      setProcessingProgress(0);
      
      // Reset animation values
      presentationOpacity.set({ opacity: 0 });
      presentationScale.set({ scale: 0.95 });
      
      // Start progress animation
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          const newProgress = prev + Math.random() * 10;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 500);
      
      try {
        // Make direct API request to create presentation
        const response = await fetch('http://localhost:3000/api/presentation/createPresentation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid: uid,
            description: description,
            pages: pages,
            purpose: purpose
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Presentation creation response:', result);
        
        if (!result.success) {
          throw new Error(result.message || 'Failed to create presentation');
        }
        
        // Store presentation ID and details
        setCurrentPresentationId(result.presentationId);
        setEstimatedTime(result.estimatedTime || '5-10 minutes');
        setCoinsCost(result.coinsCost || 30);
        
        // Clear progress interval and start polling
        clearInterval(progressInterval);
        setProcessingProgress(95);
        
        // Start polling for presentation status
        pollPresentationStatus(result.presentationId);
        
        // Update free generations if not pro
        if (!isPro) {
          setFreeGenerationsLeft(prev => Math.max(0, prev - 1));
        }
        
      } catch (apiError: any) {
        console.error("Error from API:", apiError);
        clearInterval(progressInterval);
        setLoading(false);
        setShowSkeleton(false);
        setGenerationStatus('failed');
        setError(apiError.message || "Failed to create presentation. Please try again.");
      }
      
    } catch (error: any) {
      console.error("Error creating presentation:", error);
      setLoading(false);
      setShowSkeleton(false);
      setError("Something went wrong. Please try again.");
    }
  };

  // Function to poll presentation status
  const pollPresentationStatus = async (presentationId: string) => {
    const maxAttempts = 60; // Poll for up to 10 minutes (60 * 10 seconds)
    let attempts = 0;
    
    const poll = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/presentation/getPresentationStatus', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            presentationId: presentationId
          })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Presentation status:', result);
        
        if (result.success && result.presentation) {
          const presentation = result.presentation;
          
          if (presentation.status === 'completed') {
            // Presentation is ready
            setProcessingProgress(100);
            setGenerationStatus('completed');
            
            if (presentation.ppt_download_url) {
              setPresentations([presentation.ppt_download_url]);
              
              // Store presentation data for history
              const presentationData = {
                id: presentation.id,
                title: presentation.title || description,
                description: description,
                status: presentation.status,
                created_at: presentation.created_at,
                completed_at: presentation.completed_at,
                ppt_download_url: presentation.ppt_download_url
              };
              
              // Update history
              setPresentationHistory(prev => [presentationData, ...prev]);
              
              // Store in localStorage
              const existingHistory = JSON.parse(localStorage.getItem("presentationHistory") || "[]");
              const updatedHistory = [presentationData, ...existingHistory];
              localStorage.setItem("presentationHistory", JSON.stringify(updatedHistory));
              
              // Animate presentation in
              setTimeout(() => {
                presentationOpacity.start({ opacity: 1 });
                presentationScale.start({ scale: 1 });
              }, 300);
              
              // Start checking for download availability after 30 seconds
               setTimeout(() => {
                 checkAndDownloadPresentation(presentationId);
               }, 30000);
            }
            
            setLoading(false);
            setShowSkeleton(false);
            
            // Refresh presentation history
            fetchPresentationHistory(1);
            
          } else if (presentation.status === 'failed') {
            setGenerationStatus('failed');
            setError('Presentation generation failed. Please try again.');
            setLoading(false);
            setShowSkeleton(false);
          } else {
            // Still processing, continue polling
            attempts++;
            if (attempts < maxAttempts) {
              setTimeout(poll, 10000); // Poll every 10 seconds
            } else {
              setGenerationStatus('failed');
              setError('Presentation generation timed out. Please try again.');
              setLoading(false);
              setShowSkeleton(false);
            }
          }
        } else {
          throw new Error(result.message || 'Failed to get presentation status');
        }
        
      } catch (error: any) {
        console.error('Error polling presentation status:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000); // Retry after 10 seconds
        } else {
          setGenerationStatus('failed');
          setError('Failed to check presentation status. Please try again.');
          setLoading(false);
          setShowSkeleton(false);
        }
      }
    };
    
    // Start polling
    setTimeout(poll, 5000); // First poll after 5 seconds
  };

  // Function to check and download presentation when available
   const checkAndDownloadPresentation = async (presentationId: string) => {
     const maxDownloadAttempts = 30; // 5 minutes with 10-second intervals
     let downloadAttempts = 0;
 
     const checkDownload = async (): Promise<void> => {
       try {
         // Check if download is available using the download endpoint
         const checkResponse = await fetch(`http://localhost:3000/api/presentation/download/${presentationId}`, {
           method: 'HEAD',
           headers: {
             'Authorization': `Bearer ${localStorage.getItem('token')}`,
           },
         });
 
         if (checkResponse.ok) {
           // File is available, proceed with download using the download function
           const response = await fetch(`http://localhost:3000/api/presentation/download/${presentationId}`, {
             headers: {
               'Authorization': `Bearer ${localStorage.getItem('token')}`,
             },
           });
 
           if (response.ok) {
             const blob = await response.blob();
             const url = window.URL.createObjectURL(blob);
             const link = document.createElement('a');
             link.href = url;
             link.download = `presentation_${presentationId}.pptx`;
             document.body.appendChild(link);
             link.click();
             document.body.removeChild(link);
             window.URL.revokeObjectURL(url);
             
             showSuccess(t('presentation.autoDownloadSuccess', 'Presentation downloaded automatically!'));
             return;
           }
         }
 
         downloadAttempts++;
         if (downloadAttempts >= maxDownloadAttempts) {
           showWarning(t('presentation.autoDownloadTimeout', 'Auto-download timed out. Please try manual download.'));
           return;
         }
 
         // Continue checking every 10 seconds
         setTimeout(checkDownload, 10000);
       } catch (error) {
         console.error('Error checking download availability:', error);
         downloadAttempts++;
         if (downloadAttempts >= maxDownloadAttempts) {
           showWarning(t('presentation.autoDownloadFailed', 'Auto-download failed. Please try manual download.'));
           return;
         }
         setTimeout(checkDownload, 10000);
       }
     };
 
     checkDownload();
   };

  // Function to cancel generation
  const cancelGeneration = () => {
    setLoading(false);
    setShowSkeleton(false);
    setProcessingProgress(0);
    setError(null);
    setCurrentPresentationId(null);
  };

  // Function to get status text
  const getStatusText = () => {
    switch (generationStatus) {
      case 'processing':
        return t('presentation.generatingPresentation', 'Generating presentation...');
      case 'completed':
        return t('presentation.presentationGeneratedSuccess', 'Presentation generated successfully!');
      case 'failed':
        return t('presentation.presentationGenerationFailed', 'Presentation generation failed');
      default:
        return t('presentation.initializingGeneration', 'Initializing generation...');
    }
  };
  
  // Add scanning animation style
  useEffect(() => {
    // Add keyframes for scanning animation if not already present
    if (!document.querySelector('#scan-animation')) {
      const style = document.createElement('style');
      style.id = 'scan-animation';
      style.innerHTML = `
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .animate-scan {
          animation: scan 1.5s linear infinite;
        }
      `;
      document.head.appendChild(style);
    }
    
    return () => {
      // Clean up the style element when component unmounts
      const styleElement = document.querySelector('#scan-animation');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);

  // Function to fetch presentation history
  const fetchPresentationHistory = async (page = 1) => {
    if (!uid) return;
    
    setIsLoading(true);
    setHistoryError(null);
    
    try {
      const response = await fetch('http://localhost:3000/api/presentation/getUserPresentations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: uid
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        const newPresentations = result.presentations || [];
        
        if (page === 1) {
          setAllPresentationHistory(newPresentations);
          // Also save to localStorage for offline use
          localStorage.setItem("presentationHistory", JSON.stringify(newPresentations));
        } else {
          const updatedHistory = [...allPresentationHistory, ...newPresentations];
          setAllPresentationHistory(updatedHistory);
          localStorage.setItem("presentationHistory", JSON.stringify(updatedHistory));
        }
        
        // Only update current page presentations if we're on page 1 or this is a refresh
        if (page === 1) {
          updateCurrentPagePresentations(1);
        }
        
        setHistoryPage(page);
        setHasMorePresentations(newPresentations.length >= 100);
      } else {
        throw new Error(result.message || 'Failed to fetch presentations');
      }
      
      setIsLoading(false);
    } catch (err: any) {
      console.error('Error fetching presentation history:', err);
      setHistoryError(err.message || t('presentation.failedToLoadHistory', 'Failed to load presentation history'));
      setIsLoading(false);
    }
  };
  
  // Function to update current page presentations
  const updateCurrentPagePresentations = (page: number) => {
    setCurrentPage(page);
    const startIndex = (page - 1) * presentationsPerPage;
    const endIndex = startIndex + presentationsPerPage;
    const paginatedPresentations = allPresentationHistory.slice(startIndex, endIndex);
    setPresentationHistory(paginatedPresentations);
  };
  
  // Functions for pagination navigation
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      updateCurrentPagePresentations(currentPage + 1);
    }
  };
  
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      updateCurrentPagePresentations(currentPage - 1);
    }
  };

  // Function to handle presentation removal
  const handleRemovePresentation = async (presentationId: string) => {
    if (!uid || !presentationId) return;
    
    showConfirmation(
      t('presentation.confirmRemovePresentation', 'Are you sure you want to remove this presentation?'),
      async () => {
        try {
          setIsLoading(true);
          
          const response = await fetch('http://localhost:3000/api/presentation/deletePresentation', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              presentationId: presentationId,
              uid: uid
            })
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.success) {
              showSuccess(t('presentation.presentationRemovedSuccess', 'Presentation removed successfully'));
            }
          }
          
          // Always update local state
          setPresentationHistory(prev => prev.filter(pres => pres.id !== presentationId));
          setAllPresentationHistory(prev => prev.filter(pres => pres.id !== presentationId));
          
          // Update localStorage history
          const historyJson = localStorage.getItem("presentationHistory");
          if (historyJson) {
            try {
              const historyData = JSON.parse(historyJson);
              const updatedHistory = historyData.filter((pres: any) => pres.id !== presentationId);
              localStorage.setItem("presentationHistory", JSON.stringify(updatedHistory));
            } catch (error) {
              console.error('Error updating localStorage history:', error);
            }
          }
          
        } catch (error) {
          console.error('Error removing presentation:', error);
          showError(t('presentation.failedToRemovePresentation', 'Failed to remove presentation'));
        } finally {
          setIsLoading(false);
        }
      },
      () => {
        // Do nothing when canceled
      },
      {
        confirmText: t('common.yes', 'Yes'),
        cancelText: t('common.no', 'No'),
        type: "warning"
      }
    );
  };

  // Function to generate presentation
  const handleGeneratePresentation = async () => {
    if (!user) {
      return;
    }
    
    if (!description.trim() || !uid) return;
    
    // If user is not pro and has used all free generations, show pro alert
    if (!isPro && freeGenerationsLeft <= 0) {
      setShowProAlert(true);
      return;
    }

    try {
      await createPresentation();
    } catch (error: any) {
      console.error('Error generating presentation:', error);
      setError(error.message || 'Failed to generate presentation');
    }
  };

  // Function to download presentation
  const handleDownload = async (presentationUrl: string, title?: string, presentationId?: string) => {
    try {
      if (presentationId) {
        // Use the download endpoint for presentations with ID
        const response = await fetch(`http://localhost:3000/api/presentation/download/${presentationId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            showError(t('presentation.fileNotFound', 'PPT file not found'));
          } else {
            showError(t('presentation.downloadFailed', 'Failed to download presentation'));
          }
          return;
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `presentation_${presentationId}.pptx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        showSuccess(t('presentation.downloadCompleted', 'Download completed!'));
      } else {
        // Fallback to direct URL download
        const link = document.createElement('a');
        link.href = presentationUrl;
        link.download = `${title || 'presentation'}.pptx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showSuccess(t('presentation.downloadStarted', 'Download started'));
      }
    } catch (error) {
      console.error('Error downloading presentation:', error);
      showError(t('presentation.downloadFailed', 'Failed to download presentation'));
    }
  };

  // Function to open PowerPoint viewer
  const openPowerPointViewer = (url: string) => {
    setSelectedPresentationUrl(url);
    setShowPowerPointViewer(true);
  };

  // Load presentation history on component mount
  useEffect(() => {
    if (uid) {
      fetchPresentationHistory(1);
    }
    
    // Load from localStorage as fallback
    const storedHistory = localStorage.getItem("presentationHistory");
    if (storedHistory) {
      try {
        const historyData = JSON.parse(storedHistory);
        setAllPresentationHistory(historyData);
        updateCurrentPagePresentations(1);
      } catch (error) {
        console.error('Error loading stored presentation history:', error);
      }
    }
  }, [uid]);

  // Update total pages when history changes
  useEffect(() => {
    const newTotalPages = Math.ceil(allPresentationHistory.length / presentationsPerPage);
    setTotalPages(newTotalPages);
    
    // If current page is beyond total pages, reset to page 1
    if (currentPage > newTotalPages && newTotalPages > 0) {
      updateCurrentPagePresentations(1);
    }
  }, [allPresentationHistory, presentationsPerPage, currentPage]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 opacity-80"></div>
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] dark:opacity-[0.05]"></div>
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-br from-blue-400/20 via-indigo-400/20 to-purple-400/20 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 blur-3xl rounded-full transform translate-x-1/3 -translate-y-1/4"></div>
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-blue-400/20 via-indigo-400/20 to-purple-400/20 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 blur-3xl rounded-full transform -translate-x-1/3 translate-y-1/4"></div>
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        {showProAlert && (
          <ProFeatureAlert 
            featureName="Professional Presentation Creator"
            onClose={() => setShowProAlert(false)}
          />
        )}
        
        {/* Header */}
        <div className="mb-8">
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
          >
            {t('presentation.title', 'AI Presentation Creator')}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-500 dark:text-gray-400"
          >
            {t('presentation.subtitle', 'Create professional presentations with AI')}
          </motion.p>
          
          {!isPro && (
            <div className="mt-2 flex items-center text-sm text-yellow-600 dark:text-yellow-400">
              <FiClock className="mr-1.5" />
              <span>{freeGenerationsLeft} {freeGenerationsLeft === 1 ? t('presentation.freeLeft', 'free generation') : t('presentation.freeLeftPlural', 'free generations')} left</span>
              {freeGenerationsLeft === 0 && (
                <button 
                  onClick={() => setShowProAlert(true)}
                  className="ml-2 text-blue-500 hover:text-blue-600 font-medium"
                >
                  {t('presentation.upgradeText', 'Upgrade to Pro')}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Generation Form */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
                {t('presentation.createNew', 'Create New Presentation')}
              </h2>
              
              {/* Description Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('presentation.description', 'Description')}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('presentation.descriptionPlaceholder', 'Describe your presentation topic...')}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 resize-none"
                  rows={4}
                  disabled={loading}
                />
              </div>
              
              {/* Pages Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('presentation.pages', 'Number of Pages')}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={pages}
                    onChange={(e) => setPages(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                    min="1"
                    max="20"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    disabled={loading}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">1-20</span>
                  </div>
                </div>
              </div>
              
              {/* Purpose Dropdown */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('presentation.purpose', 'Purpose')}
                </label>
                <div className="relative">
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 appearance-none"
                    disabled={loading}
                  >
                    {purposeOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <FiChevronDown className="text-gray-400" />
                  </div>
                </div>
              </div>
              
              {/* Generate Button */}
              <AuthRequiredButton
                onClick={handleGeneratePresentation}
                disabled={!description.trim() || loading}
                className={`w-full py-4 px-6 rounded-lg font-medium transition-all duration-200 ${
                  !description.trim() || loading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400'
                    : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white hover:opacity-90 transform hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('presentation.generating', 'Generating...')}
                  </div>
                ) : (
                  t('presentation.generate', 'Generate Presentation')
                )}
              </AuthRequiredButton>
              
              {/* Generation Info */}
              {loading && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      {getStatusText()}
                    </span>
                    <button
                      onClick={cancelGeneration}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mb-2">
                    <div 
                      className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${processingProgress}%` }}
                    ></div>
                  </div>
                  
                  {estimatedTime && (
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      {t('presentation.estimatedTime', 'Estimated time')}: {estimatedTime}
                    </p>
                  )}
                  
                  {coinsCost > 0 && (
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      {t('presentation.coinsCost', 'Cost')}: {coinsCost} {t('presentation.coins', 'coins')}
                    </p>
                  )}
                </div>
              )}
              
              {/* Error Display */}
              {error && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}
            </div>
            
            {/* History Section */}
            <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {t('presentation.history', 'Presentation History')}
                  </h3>
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                  >
                    <FiList size={20} />
                  </button>
                </div>
              </div>
              
              {showHistory && (
                <div className="p-6">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  ) : presentationHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">
                        {t('presentation.noHistory', 'No presentations yet')}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        {presentationHistory.map((presentation) => (
                          <div key={presentation.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                {presentation.title || presentation.description}
                              </h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {new Date(presentation.created_at).toLocaleDateString()}
                              </p>
                              <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                                presentation.status === 'completed' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                  : presentation.status === 'processing'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                              }`}>
                                {presentation.status}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              {presentation.status === 'completed' && presentation.ppt_download_url && (
                                <>
                                  <button
                                    onClick={() => openPowerPointViewer(presentation.ppt_download_url!)}
                                    className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                                    title={t('presentation.view', 'View')}
                                  >
                                    <FiPlay size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDownload(presentation.ppt_download_url!, presentation.title, presentation.id)}
                                    className="p-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
                                    title={t('presentation.download', 'Download')}
                                  >
                                    <FiDownload size={16} />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleRemovePresentation(presentation.id)}
                                className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                                title={t('presentation.remove', 'Remove')}
                              >
                                <FiTrash size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6">
                          <button
                            onClick={goToPreviousPage}
                            disabled={currentPage === 1}
                            className={`flex items-center px-4 py-2 rounded-lg ${
                              currentPage === 1
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200'
                            }`}
                          >
                            <FiChevronLeft className="mr-1" />
                            {t('common.previous', 'Previous')}
                          </button>
                          
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {t('common.pageOf', 'Page {{current}} of {{total}}', { current: currentPage, total: totalPages })}
                          </span>
                          
                          <button
                            onClick={goToNextPage}
                            disabled={currentPage === totalPages}
                            className={`flex items-center px-4 py-2 rounded-lg ${
                              currentPage === totalPages
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200'
                            }`}
                          >
                            {t('common.next', 'Next')}
                            <FiChevronRight className="ml-1" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Right Column - PowerPoint Viewer */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-full">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {t('presentation.viewer', 'PowerPoint Viewer')}
                </h3>
              </div>
              
              <div className="p-6 h-full">
                {selectedPresentationUrl ? (
                  <div className="h-full">
                    <iframe
                      src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(selectedPresentationUrl)}`}
                      className="w-full h-full min-h-[600px] border-0 rounded-lg"
                      title="PowerPoint Viewer"
                    />
                  </div>
                ) : presentations.length > 0 ? (
                  <div className="h-full">
                    <iframe
                      src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(presentations[0])}`}
                      className="w-full h-full min-h-[600px] border-0 rounded-lg"
                      title="PowerPoint Viewer"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full min-h-[600px] text-center">
                    <div>
                      <div className="text-6xl text-gray-300 dark:text-gray-600 mb-4">
                        📊
                      </div>
                      <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        {t('presentation.noPresentation', 'No presentation selected')}
                      </h4>
                      <p className="text-gray-500 dark:text-gray-400">
                        {t('presentation.generateOrSelect', 'Generate a new presentation or select one from history to view it here')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PresentationCreatorPage;
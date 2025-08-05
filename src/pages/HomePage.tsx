import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiInstagram, FiTwitter, FiYoutube, FiGithub, FiLinkedin } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '../context/ThemeContext';
import { 
  HomeNavbar, 
  FeatureSection, 
  UseCasesSection,
  ComparisonSection,
  HeroBanner,
  CallToAction,
  FAQSection,
  AnimatedGridBanner,
  ModelsShowcaseSection,
  CubeComponent
} from '../components';



const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const { darkMode } = useContext(ThemeContext);
  
  // FAQ data
  const faqData = [
    {
      question: t('homePage.faq.features.question'),
      answer: t('homePage.faq.features.answer')
    },
    {
      question: t('homePage.faq.imageToVideo.question'),
      answer: t('homePage.faq.imageToVideo.answer')
    },
    {
      question: t('homePage.faq.speechToText.question'),
      answer: t('homePage.faq.speechToText.answer')
    },
    {
      question: t('homePage.faq.contentGeneration.question'),
      answer: t('homePage.faq.contentGeneration.answer')
    },
    {
      question: t('homePage.faq.aiChat.question'),
      answer: t('homePage.faq.aiChat.answer')
    },
    {
      question: t('homePage.faq.commercial.question'),
      answer: t('homePage.faq.commercial.answer')
    }
  ];

  // Footer categories and social links data removed as they're now directly used in PublicResourceLayout

  return (
    <div className={`min-h-screen overflow-hidden ${darkMode ? 'bg-black' : 'bg-white'}`}>
      {/* Home Navbar */}
      <HomeNavbar />
         <section className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
        {/* Video Background with Dark Overlay */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {/* Video Background */}
          <video 
            className="absolute inset-0 w-full h-full object-cover" 
            autoPlay 
            loop 
            muted 
            playsInline
            src="https://ddtgdhehxhgarkonvpfq.supabase.co/storage/v1/object/public/user-uploads/mainvideo.mp4"
           
            preload="auto"
          ></video>
          
          {/* Overlay */}
          <div className={`absolute inset-0 ${darkMode ? 'bg-black/50' : 'bg-black/30'}`}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl mx-auto"
          >
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6">
              <span className="hidden md:inline">{t('homePage.title', 'Your Complete AI')}<br />{t('homePage.titleSecondLine', 'Creative Suite')}</span>
              <span className="md:hidden">{t('homePage.titleMobile', 'Creative Suite')}</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-6 md:mb-10 max-w-2xl mx-auto">
              <span className="hidden md:inline">{t('homePage.description', 'Trusted by creators. Powered by top AI models. Generate stunning videos from images, create beautiful artwork, transcribe speech to text, write compelling content, and chat with our lightning-fast AI assistant—all in one platform.')}</span>
              <span className="md:hidden">{t('homePage.descriptionMobile', 'Trusted by creators. Generate stunning videos from images, create beautiful artwork, transcribe speech to text, write compelling content, and chat with our lightning-fast AI assistant—all in one platform.')}</span>
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="w-full sm:w-auto"
              >
                <Link to="/signup" className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 md:px-8 md:py-4 rounded-lg font-medium text-base md:text-lg shadow-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors duration-300">
                  <span className="hidden sm:inline">{t('homePage.startCreating', 'Start creating with AI')}</span>
                  <span className="sm:hidden">{t('homePage.startCreatingMobile', 'Get Started')}</span>
                  <FiArrowRight className="ml-2" />
                </Link>
              </motion.div>
            </div>
            <div className="flex items-center justify-center gap-8 text-gray-400 text-sm">
              <div className="flex items-center">
                <span>{t('homePage.userCount', '11M+ users')}</span>
              </div>
              <div className="flex items-center">
                <span>{t('homePage.modelCount', '17 top models')}</span>
              </div>
              <div className="flex items-center">
                <span>{t('homePage.foundedYear', 'Founded in 2022')}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Line separator */}
      <div className={`w-full h-px ${darkMode ? 'bg-white opacity-20' : 'bg-gray-300 opacity-40'}`}></div>
      
      {/* AI Innovation Showcase Section */}
    
      {/* Feature Section */}
      <FeatureSection />
      
      {/* Use Cases Section */}
      <UseCasesSection />
      
      {/* Call To Action - Second image */}
      
      {/* Comparison Section */}
      <ComparisonSection />
      
      <ModelsShowcaseSection />

      
      {/* Hero Banner - First image */}

      
      <HeroBanner 
        title={t('homePage.heroBannerTitle', 'Powerful AI tools for every creative need')}
        description={t('homePage.heroBannerDescription', "Skip the frustration of complicated tools and clunky software. With MatrixAI, you\'ll create stunning videos from images, generate beautiful artwork, transcribe speech to text with high accuracy, write compelling content, and get instant answers from our AI chat—all in one platform. No training, no fiddling, no roadblocks. Our advanced AI takes care of the hard work, delivering professional-quality results every time. Just describe what you want, and watch the magic happen.")}
     
      />
       <CubeComponent />


           <AnimatedGridBanner 
        title={t('homePage.gridBannerTitle', "Don\'t settle for outdated and slow tools.")}
        description={t('homePage.gridBannerDescription', "With MatrixAI, you get the fastest, most advanced AI creative platform. From image-to-video generation to image creation, speech transcription, content writing, and AI chat—all powered by cutting-edge models. Trusted by professionals, available to everyone. Don\'t miss out—get the newest AI models and features before anyone else.")}
        buttonText={t('homePage.startCreating', 'Start creating with AI')}
        buttonLink="/signup"
      />
      
      {/* FAQ Section - Third image */}
      <FAQSection 
        title={t('homePage.faqTitle', 'Frequently Asked Questions')}
        faqs={faqData}
      />
      
      {/* Footer Links component removed as it's now directly used in PublicResourceLayout */}
    </div>
  );
};

export default HomePage;
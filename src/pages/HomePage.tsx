import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiInstagram, FiTwitter, FiYoutube, FiGithub, FiLinkedin } from 'react-icons/fi';
import { 
  HomeNavbar, 
  FeatureSection, 
  UseCasesSection,
  ComparisonSection,
  ModelsShowcaseSection,
  HeroBanner,
  CallToAction,
  FAQSection,
  AnimatedGridBanner
} from '../components';



const HomePage: React.FC = () => {
  // FAQ data
  const faqData = [
    {
      question: "What features does MatrixAI offer?",
      answer: "MatrixAI offers a comprehensive suite of AI tools including image-to-video generation, image generation, speech-to-text transcription, content writing, and a fast AI chat assistant. Our platform integrates the latest AI models to provide you with cutting-edge capabilities for all your creative and productivity needs."
    },
    {
      question: "How does the AI Image to Video feature work?",
      answer: "Our AI analyzes your image and generates a video by predicting motion, adding realistic movement, and maintaining the original style and content. Simply upload your image, add optional prompts for guidance, and our AI will create a high-quality video in seconds."
    },
    {
      question: "How accurate is the Speech to Text feature?",
      answer: "Our Speech to Text feature achieves industry-leading accuracy rates of over 95% for clear audio in supported languages. The system can handle various accents, background noise, and even multiple speakers with our premium tier, making it perfect for transcribing meetings, interviews, and lectures."
    },
    {
      question: "What makes MatrixAI's content generation different?",
      answer: "Our content generation tools use advanced language models trained on diverse writing styles and formats. You can generate blog posts, marketing copy, creative stories, and more with customizable tone, style, and length. The system also provides SEO optimization suggestions and can adapt to your brand voice."
    },
    {
      question: "How fast is the AI chat feature?",
      answer: "Our AI chat feature delivers responses in near real-time, typically within 1-2 seconds, making it one of the fastest AI assistants available. It can handle complex queries, remember context throughout conversations, and provide helpful information on virtually any topic."
    },
    {
      question: "Can I use MatrixAI's features for commercial projects?",
      answer: "Yes, all content generated on our platform can be used for commercial purposes under our standard license. Enterprise users receive additional rights and dedicated support for large-scale commercial applications across all our features."
    }
  ];

  // Footer categories and social links data removed as they're now directly used in PublicResourceLayout

  return (
    <div className="min-h-screen overflow-hidden bg-black">
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
          
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/50"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl mx-auto"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6">
              Your Complete AI<br />Creative Suite
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-10 max-w-2xl mx-auto">
              Trusted by creators. Powered by top AI models. Generate stunning videos from images,
              create beautiful artwork, transcribe speech to text, write compelling content,
              and chat with our lightning-fast AI assistant—all in one platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="w-full sm:w-auto"
              >
                <Link to="/signup" className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-lg font-medium text-lg shadow-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors duration-300">
                  Start creating with AI <FiArrowRight className="ml-2" />
                </Link>
              </motion.div>
            </div>
            <div className="flex items-center justify-center gap-8 text-gray-300 text-sm">
              <div className="flex items-center">
                <span>11M+ users</span>
              </div>
              <div className="flex items-center">
                <span>17 top models</span>
              </div>
              <div className="flex items-center">
                <span>Founded in 2022</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* White line separator */}
      <div className="w-full h-px bg-white opacity-20"></div>
      
      {/* White line separator */}
      <div className="w-full h-px bg-white opacity-20"></div>

      {/* Feature Section */}
      <FeatureSection />
      
      {/* Use Cases Section */}
      <UseCasesSection />
      
      {/* Call To Action - Second image */}
 
      
      {/* Comparison Section */}
      <ComparisonSection />
      
      {/* Models Showcase Section */}
      <ModelsShowcaseSection />
      
      {/* Hero Banner - First image */}

      
      <HeroBanner 
        title="Powerful AI tools for every creative need"
         description="Skip the frustration of complicated tools and clunky software. With MatrixAI, you'll create stunning videos from images, generate beautiful artwork, transcribe speech to text with high accuracy, write compelling content, and get instant answers from our AI chat—all in one platform. No training, no fiddling, no roadblocks. Our advanced AI takes care of the hard work, delivering professional-quality results every time. Just describe what you want, and watch the magic happen."
        backgroundImage="/images/runway-feature.jpg"
      />

           <AnimatedGridBanner 
        title="Don't settle for outdated and slow tools."
        description="With MatrixAI, you get the fastest, most advanced AI creative platform. From image-to-video generation to image creation, speech transcription, content writing, and AI chat—all powered by cutting-edge models. Trusted by professionals, available to everyone. Don't miss out—get the newest AI models and features before anyone else."
        buttonText="Start creating with AI"
        buttonLink="/signup"
      />
      
      {/* FAQ Section - Third image */}
      <FAQSection 
        title="Frequently Asked Questions"
        faqs={faqData}
      />
      
      {/* Footer Links component removed as it's now directly used in PublicResourceLayout */}
    </div>
  );
};

export default HomePage;
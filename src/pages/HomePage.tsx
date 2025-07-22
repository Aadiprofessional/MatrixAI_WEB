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
      question: "How does the AI Image to Video feature work?",
      answer: "Our AI analyzes your image and generates a video by predicting motion, adding realistic movement, and maintaining the original style and content. Simply upload your image, add optional prompts for guidance, and our AI will create a high-quality video in seconds."
    },
    {
      question: "Which images can be converted from image to video with AI?",
      answer: "Almost any type of image can be converted, including photographs, digital art, illustrations, paintings, and sketches. The AI works best with clear, high-resolution images that have distinct subjects and backgrounds."
    },
    {
      question: "How do I get the best results from my Image to Video prompts?",
      answer: "For best results, use clear, descriptive prompts that specify the type of motion you want (e.g., 'gentle camera zoom,' 'character walking,' 'leaves blowing in wind'). Include details about mood, speed, and focus areas to guide the AI more effectively."
    },
    {
      question: "What is the best AI image to video generator?",
      answer: "While there are several options available, our platform integrates all the leading models including Google Veo, Runway Gen-3, Kling, MAGI, and more - giving you access to the best tools without having to choose just one or subscribe to multiple services."
    },
    {
      question: "How fast can I turn an image into a video with AI?",
      answer: "Most videos are generated within 30-60 seconds, depending on the complexity of the image and the selected model. Premium users enjoy faster processing times and priority in the queue."
    },
    {
       question: "Can I use matrixai.asia's Image to Video feature for commercial projects?",
       answer: "Yes, all videos generated on our platform can be used for commercial purposes under our standard license. Enterprise users receive additional rights and dedicated support for large-scale commercial applications."
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
              The Ultimate Image<br />to Video Generator
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-10 max-w-2xl mx-auto">
              Trusted by creators. Powered by top AI models. No editing skills, no
              learning curve, no compromises. Transform photos, art, or graphics
              into cinematic videos—faster than anywhere else.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="w-full sm:w-auto"
              >
                <Link to="/signup" className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-lg font-medium text-lg shadow-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors duration-300">
                  Generate my first video <FiArrowRight className="ml-2" />
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
        title="High-impact Image to Video clips made simple"
         description="Skip the frustration of complicated tools and clunky software. With matrixai.asia, you'll go from image to stunning video in moments—just upload, describe what you want, and click generate. No training, no fiddling, no roadblocks. Our advanced AI takes care of the hard work, delivering ultra-smooth motion and cinematic quality, every single time. Want a specific style or effect? Just say it in your prompt."
        backgroundImage="/images/runway-feature.jpg"
      />

           <AnimatedGridBanner 
        title="Don't settle for outdated and slow tools."
        description="With matrixai.asia, you get the fastest, most advanced Image to Video platform. Trusted by professionals, available to everyone. Don't miss out—get the newest AI models and features before anyone else."
        buttonText="Create my first video"
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
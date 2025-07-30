import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface ComparisonItemProps {
  icon: React.ReactNode;
  text: string;
  isPositive?: boolean;
}

const ComparisonItem: React.FC<ComparisonItemProps> = ({ icon, text, isPositive = true }) => {
  return (
    <div className="flex items-center space-x-3 mb-4">
      <span className={`flex-shrink-0 ${isPositive ? 'text-blue-500' : 'text-gray-500'}`}>
        {icon}
      </span>
      <span className={`text-sm ${isPositive ? 'text-white' : 'text-gray-400'}`}>{text}</span>
    </div>
  );
};

const ComparisonSection: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-4xl font-bold text-white text-center mb-4"
        >
          {t('comparisonSection.title', 'Why wait weeks? Create with AI')}<br />{t('comparisonSection.titleSecondLine', 'in minutes, not days')}
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
          className="text-xl text-gray-300 text-center mb-16 max-w-3xl mx-auto"
        >
          {t('comparisonSection.description', 'Experience the difference between instant AI-powered creativity and old-school production headaches across all your creative needs.')}
        </motion.p>
        
        <div className="md:grid md:grid-cols-2 md:gap-16 relative">
          {/* Left side - AI Video Generator */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="relative rounded-xl overflow-hidden mb-8 md:mb-0"
          >
            {/* Outer layer - white opacity border with glow */}
            <div className="absolute inset-0 border-2 border-white/40 rounded-xl shadow-lg shadow-blue-500/20"></div>
            
            {/* Middle layer - subtle glow effect */}
            <div className="absolute inset-[3px] rounded-lg bg-gradient-to-br from-white/10 to-transparent"></div>
            
            {/* Inner layer - glass effect with backdrop blur */}
            <div className="absolute inset-[6px] backdrop-blur-lg bg-black/30 rounded-lg border border-white/20 shadow-inner shadow-white/10"></div>
            
            {/* Content container with glass morphism */}
            <div className="absolute inset-[6px] bg-gradient-to-br from-white/5 to-transparent opacity-80 rounded-lg"></div>
            
            <div className="relative z-10 p-6">
              <div className="mb-6 overflow-hidden rounded-lg">
                <img 
                  src="/images/ai-generator.svg" 
                  alt="AI Video Generator" 
                  className="w-full h-32 md:h-64 object-cover rounded-lg"
                />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">{t('comparisonSection.matrixAiTitle', 'MatrixAI\'s All-in-One Platform')}</h3>
              
              <ComparisonItem 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>}
                text={t('comparisonSection.chooseAiTool', 'Choose Your AI Tool')}
              />
              <p className="text-sm text-gray-400 ml-8 mb-4">{t('comparisonSection.chooseAiToolDesc', 'Select from video creation, image generation, speech-to-text, content writing, or AI chat—all in one platform with a unified interface.')}</p>
              
              <ComparisonItem 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>}
                text={t('comparisonSection.describeWhatYouWant', 'Describe What You Want')}
              />
              <p className="text-sm text-gray-400 ml-8 mb-4">{t('comparisonSection.describeWhatYouWantDesc', 'Use natural language to explain your vision. Our AI understands context, style preferences, and creative direction across all tools.')}</p>
              
              <ComparisonItem 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>}
                text={t('comparisonSection.getProfessionalResults', 'Get Professional Results Instantly')}
              />
              <p className="text-sm text-gray-400 ml-8 mb-4">{t('comparisonSection.getProfessionalResultsDesc', 'Our AI handles the complex work. Whether it\'s videos, images, transcriptions, content, or chat responses—get high-quality results in minutes, not days.')}</p>
            </div>
          </motion.div>
          
          {/* Mobile VS (below MatrixAI component) */}
          <div className="md:hidden relative flex items-center justify-center my-8">
            {/* Horizontal line */}
            <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
            
            {/* VS in the middle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="relative z-10 px-6 py-3"
            >
              <span className="text-2xl font-semibold text-white">vs</span>
            </motion.div>
          </div>
          
          {/* Desktop VS in the middle with vertical line */}
          <div className="hidden md:flex absolute left-1/2 top-0 bottom-0 -translate-x-1/2 items-center justify-center z-20">
            {/* Vertical line */}
            <div className="absolute h-full w-[1px] bg-gradient-to-b from-transparent via-white/30 to-transparent"></div>
            
            {/* VS in the middle */}
            <span className="text-2xl font-semibold text-white">vs</span>
          </div>
          
          {/* Right side - Traditional Video Production */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="relative rounded-xl overflow-hidden"
          >
            {/* Outer layer - white opacity border with glow */}
            <div className="absolute inset-0 border-2 border-white/40 rounded-xl shadow-lg shadow-blue-500/20"></div>
            
            {/* Middle layer - subtle glow effect */}
            <div className="absolute inset-[3px] rounded-lg bg-gradient-to-br from-white/10 to-transparent"></div>
            
            {/* Inner layer - glass effect with backdrop blur */}
            <div className="absolute inset-[6px] backdrop-blur-lg bg-black/30 rounded-lg border border-white/20 shadow-inner shadow-white/10"></div>
            
            {/* Content container with glass morphism */}
            <div className="absolute inset-[6px] bg-gradient-to-br from-white/5 to-transparent opacity-80 rounded-lg"></div>
            
            <div className="relative z-10 p-6">
              <div className="mb-6 overflow-hidden rounded-lg">
                <img 
                  src="/images/traditional-video.svg" 
                  alt="Traditional Video Production" 
                  className="w-full h-32 md:h-64 object-cover rounded-lg"
                />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">{t('comparisonSection.traditionalTitle', 'Traditional Creative Methods')}</h3>
              
              <div className="space-y-4">
                <ComparisonItem 
                  icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>}
                  text={t('comparisonSection.researchHireSpecialists', 'Research and hire different specialists for each task')}
                  isPositive={false}
                />
                
                <ComparisonItem 
                  icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>}
                  text={t('comparisonSection.payMultipleSubscriptions', 'Pay for multiple subscriptions and services')}
                  isPositive={false}
                />
                
                <ComparisonItem 
                  icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>}
                  text={t('comparisonSection.learnComplexSoftware', 'Learn multiple complex software interfaces')}
                  isPositive={false}
                />
                
                <ComparisonItem 
                  icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>}
                  text={t('comparisonSection.waitDaysWeeks', 'Wait days or weeks for revisions and final delivery')}
                  isPositive={false}
                />
                
                <ComparisonItem 
                  icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>}
                  text={t('comparisonSection.manageInconsistentQuality', 'Manage inconsistent quality across different providers')}
                  isPositive={false}
                />
                
                <ComparisonItem 
                  icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>}
                  text={t('comparisonSection.payPremiumPrices', 'Pay premium prices for each individual service')}
                  isPositive={false}
                />
              </div>
            </div>
          </motion.div>
        </div>
        

      </div>
    </section>
  );
};

export default ComparisonSection;
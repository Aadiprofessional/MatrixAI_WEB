import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiMessageSquare, FiImage, FiVideo, FiFileText, FiLayers, FiPenTool, FiCpu } from 'react-icons/fi';
import { ThemeContext } from '../context/ThemeContext';

const FeatureCard = ({ icon, title, description, delay, color }: { 
  icon: React.ReactNode, 
  title: string, 
  description: string,
  delay: number,
  color: string
}) => {
  const { darkMode } = useContext(ThemeContext);
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      className={`${
        darkMode 
          ? 'bg-gray-800/50 hover:bg-gray-800/80' 
          : 'bg-white/90 hover:bg-white'
      } backdrop-blur-md rounded-xl p-6 transition-all duration-300 border border-opacity-10 ${
        darkMode ? 'border-purple-500/20' : 'border-blue-500/20'
      } hover:shadow-xl`}
    >
      <div className={`w-14 h-14 ${color} rounded-lg flex items-center justify-center mb-5 relative overflow-hidden group-hover:scale-110 transition-transform duration-300`}>
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        {icon}
      </div>
      <h3 className={`text-xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
      <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        {description}
      </p>
    </motion.div>
  );
};

const HomePage: React.FC = () => {
  const { darkMode } = useContext(ThemeContext);
  
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className={`relative py-20 lg:py-32 overflow-hidden ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {/* Animated Background Elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-0 w-full h-2/3 bg-gradient-to-br from-blue-500/20 via-indigo-500/10 to-purple-500/20 blur-3xl opacity-70"></div>
          <div className="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-tr from-purple-500/20 via-pink-500/10 to-blue-500/20 blur-3xl opacity-70"></div>
          <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-pink-500/20 rounded-full mix-blend-multiply blur-3xl animate-pulse" style={{ animationDuration: '8s' }}></div>
          <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full mix-blend-multiply blur-3xl animate-pulse" style={{ animationDuration: '12s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="lg:grid lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="text-center lg:text-left"
              >
                <h1 className="text-4xl tracking-tight font-bold sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl">
                  <span className={`block ${darkMode ? 'text-white' : 'text-gray-900'}`}>Next Generation</span>
                  <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
                    AI Solutions
                  </span>
                </h1>
                <p className={`mt-6 text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto lg:mx-0`}>
                  Transform your ideas into reality with our powerful AI tools. 
                  Generate images, create videos, analyze data, and more - all in one platform.
                </p>
                <div className="mt-10 sm:flex sm:justify-center lg:justify-start gap-4">
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  >
                    <Link to="/signup" className={`inline-flex items-center px-8 py-3 rounded-lg font-medium shadow-lg ${
                      darkMode
                        ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white'
                        : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white'
                    }`}>
                      Get Started Free
                    </Link>
                  </motion.div>
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                  >
                    <Link to="/login" className={`inline-flex items-center px-8 py-3 rounded-lg font-medium ${
                      darkMode
                        ? 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700'
                        : 'bg-white text-gray-800 hover:bg-gray-50 border border-gray-200'
                    }`}>
                      <span>Sign In</span>
                      <FiArrowRight className="ml-2" />
                    </Link>
                  </motion.div>
                </div>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="mt-8 flex justify-center lg:justify-start"
                >
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} flex items-center`}>
                    <span className="inline-block w-4 h-4 rounded-full flex items-center justify-center mr-2 bg-gradient-to-r from-blue-500 to-purple-500"></span>
                    <span>No credit card required</span>
                  </p>
                </motion.div>
              </motion.div>
            </div>
            <div className="mt-12 lg:mt-0 lg:col-span-6">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="relative mx-auto"
              >
                <div className={`relative mx-auto rounded-2xl overflow-hidden shadow-2xl ${
                  darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'
                }`}>
                  {/* Chat UI mockup */}
                  <div className={`px-4 py-3 flex items-center border-b ${
                    darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="w-3 h-3 mr-2 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 mr-2 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    <div className={`mx-auto text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      MatrixAI Assistant
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-start">
                        <div className={`w-8 h-8 rounded-full mr-4 flex-shrink-0 flex items-center justify-center ${
                          darkMode ? 'bg-gray-700' : 'bg-gray-100'
                        }`}>
                          <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>You</span>
                        </div>
                        <div className={`rounded-lg rounded-tl-none px-4 py-2 max-w-md ${
                          darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'
                        }`}>
                          <p>Generate an image of a futuristic city with flying cars and neon lights</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-start flex-row-reverse">
                        <div className="w-8 h-8 rounded-full ml-4 flex-shrink-0 bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                          <span className="text-xs font-bold text-white">AI</span>
                        </div>
                        <div className={`rounded-lg rounded-tr-none px-4 py-2 max-w-md ${
                          darkMode ? 'bg-gray-700/50 text-gray-200' : 'bg-purple-50 text-gray-800'
                        }`}>
                          <p>I've created this image for you:</p>
                          <div className="mt-3 rounded-lg overflow-hidden bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-0.5">
                            <div className="w-full aspect-video rounded bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-pulse flex items-center justify-center">
                              <span className="text-white font-medium text-sm">Futuristic City Image</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center mt-6">
                      <input 
                        type="text" 
                        placeholder="Ask me anything..." 
                        className={`flex-1 py-3 px-4 rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                          darkMode 
                            ? 'bg-gray-700 text-white border-gray-600 focus:ring-purple-500' 
                            : 'bg-white text-gray-900 border border-gray-300 focus:ring-blue-500'
                        }`}
                      />
                      <button className={`ml-2 p-3 rounded-lg ${
                        darkMode
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                          : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                      }`}>
                        <FiArrowRight />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Light effect */}
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-500 rounded-full opacity-20 blur-3xl"></div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500 rounded-full opacity-20 blur-3xl"></div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Tools Section */}
      <section className={`py-20 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className={`text-3xl font-bold md:text-4xl ${darkMode ? 'text-white' : 'text-gray-900'}`}
            >
              AI Tools for <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
                Every Need
              </span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className={`mt-4 text-xl max-w-3xl mx-auto ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
            >
              Unlock the power of artificial intelligence with our comprehensive suite of creative tools
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<FiImage className="text-2xl text-white" />}
              title="Image Generation"
              description="Create stunning, unique images from text descriptions using our advanced AI models."
              delay={0.1}
              color="bg-gradient-to-r from-blue-500 to-indigo-600"
            />
            
            <FeatureCard 
              icon={<FiVideo className="text-2xl text-white" />}
              title="Video Creation"
              description="Transform your images and text into captivating videos with customizable styles."
              delay={0.2}
              color="bg-gradient-to-r from-purple-500 to-pink-600"
            />
            
            <FeatureCard 
              icon={<FiMessageSquare className="text-2xl text-white" />}
              title="Intelligent Chat"
              description="Have natural conversations with our AI assistant to solve problems and get answers."
              delay={0.3}
              color="bg-gradient-to-r from-blue-500 to-cyan-500"
            />
            
            <FeatureCard 
              icon={<FiFileText className="text-2xl text-white" />}
              title="Content Writer"
              description="Generate high-quality articles, blog posts, and copy with our AI content creation tool."
              delay={0.4}
              color="bg-gradient-to-r from-green-500 to-emerald-600"
            />
            
            <FeatureCard 
              icon={<FiPenTool className="text-2xl text-white" />}
              title="Image Editor"
              description="Edit and enhance your images with AI-powered tools for perfect results every time."
              delay={0.5}
              color="bg-gradient-to-r from-orange-500 to-pink-500"
            />
            
            <FeatureCard 
              icon={<FiLayers className="text-2xl text-white" />}
              title="Presentation Creator"
              description="Create professional presentations from simple text prompts with beautiful templates."
              delay={0.6}
              color="bg-gradient-to-r from-purple-600 to-indigo-600"
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className={`py-20 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'} relative overflow-hidden`}>
        {/* Background decorative elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full mix-blend-multiply blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full mix-blend-multiply blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className={`text-3xl font-bold md:text-4xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                How It <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">Works</span>
              </h2>
              <p className={`mt-4 text-xl max-w-3xl mx-auto ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Get started in minutes with our intuitive platform
              </p>
            </motion.div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "01",
                title: "Sign Up",
                description: "Create your account in seconds and get instant access to all our AI tools.",
                delay: 0.1
              },
              {
                step: "02",
                title: "Choose Your Tool",
                description: "Select from our range of AI tools based on what you want to create.",
                delay: 0.2
              },
              {
                step: "03",
                title: "Create & Download",
                description: "Generate your content with simple prompts and download the results.",
                delay: 0.3
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: item.delay }}
                viewport={{ once: true }}
                className={`p-6 rounded-xl relative ${
                  darkMode ? 'bg-gray-700/50' : 'bg-white'
                } backdrop-blur-sm border border-opacity-10 ${
                  darkMode ? 'border-purple-500/20' : 'border-blue-500/20'
                }`}
              >
                <div className="absolute -top-4 -left-4 w-12 h-12 flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
                  <span className="text-white font-bold">{item.step}</span>
                </div>
                <div className="mt-4">
                  <h3 className={`text-xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.title}</h3>
                  <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-16 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className={`rounded-2xl py-10 px-6 md:p-12 text-center ${
              darkMode 
                ? 'bg-gradient-to-r from-blue-900/50 via-purple-900/50 to-pink-900/50 backdrop-blur-lg border border-gray-700/50' 
                : 'bg-gradient-to-r from-blue-50 to-purple-50'
            }`}
          >
            <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Ready to experience the future of AI?
            </h2>
            <p className={`mt-4 text-xl max-w-3xl mx-auto ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Join thousands of creators and professionals using our AI tools today
            </p>
            <div className="mt-8">
              <Link 
                to="/signup" 
                className={`inline-flex items-center px-8 py-3 rounded-lg font-medium shadow-lg ${
                  darkMode
                    ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white'
                    : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white'
                }`}
              >
                Get Started Free
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage; 
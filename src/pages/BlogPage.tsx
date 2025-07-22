import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FiCalendar, 
  FiUser, 
  FiClock, 
  FiTag, 
  FiSearch,
  FiTrendingUp,
  FiBookOpen,
  FiArrowRight,
  FiEye,
  FiHeart,
  FiShare2
} from 'react-icons/fi';



// Helper function to format dates
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const BlogPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Add scroll event listener to create a scrolled effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    document.title = 'Blog - matrixai.asia';
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const categories = ['All', 'AI Technology', 'Tutorials'];

  const featuredPost = {
    id: 1,
    title: 'AI Room Unboxing Videos Went Viral: Here\'s How to Make Them Using Prompt (Inside!)',
    excerpt: 'Want to go viral? Make AI-generated clips where full interiors unpack from a box exactly how to do it with our tool and prompt.',
    content: 'In this comprehensive guide, we explore how to create viral AI room unboxing videos using MatrixAI\'s advanced generation tools...',
    author: 'Agnieszka Ziebinska',
    authorRole: 'Content Creator',
    authorImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=80',
    publishedAt: '2024-06-24',
    readTime: '6 min read',
    category: 'Tutorials',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2832&q=80',
    views: 1250,
    likes: 89,
    featured: true
  };

  const blogPosts = [
    {
      id: 2,
      title: 'MiniMax Halluo 02: The 1080p AI Video Model That Gets Physics Right',
      excerpt: 'Meet the AI video model behind the viral Cat Olympics. Native 1080p, real physics, and amazing motion—MiniMax Halluo 02 sets a new bar for AI video generation.',
      author: 'Agnieszka Ziebinska',
      authorRole: 'Content Creator',
      authorImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=80',
      publishedAt: '2024-06-24',
      readTime: '5 min read',
      category: 'AI Technology',
      image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2672&q=80',
      views: 890,
      likes: 67,
      featured: false
    },
    {
      id: 3,
      title: 'Seedance 1.0 Lite by ByteDance: What You Need to Know',
      excerpt: 'Meet Seedance 1.0 Lite: ByteDance\'s new AI video model that\'s fast, flexible, and budget-friendly. We dig into what makes it different.',
      author: 'Agnieszka Ziebinska',
      authorRole: 'Content Creator',
      authorImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=80',
      publishedAt: '2024-06-15',
      readTime: '4 min read',
      category: 'AI Technology',
      image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2670&q=80',
      views: 1450,
      likes: 102,
      featured: false
    },
    {
      id: 4,
      title: 'Sora vs. Kling vs. Pika: The Ultimate AI Video Model Comparison',
      excerpt: 'We tested OpenAI\'s Sora, Kling, and Pika side by side. See which AI video generator wins for quality, speed, and creative control.',
      author: 'Agnieszka Ziebinska',
      authorRole: 'Content Creator',
      authorImage: 'https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=80',
      publishedAt: '2024-06-10',
      readTime: '7 min read',
      category: 'Tutorials',
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2725&q=80',
      views: 2100,
      likes: 156,
      featured: false
    },
    {
      id: 5,
      title: 'Runway Gen-3: The New AI Video King?',
      excerpt: 'Runway just dropped Gen-3 Alpha with 1080p resolution and 4-second clips. We got early access—here\'s our hands-on review.',
      author: 'Agnieszka Ziebinska',
      authorRole: 'Content Creator',
      authorImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=80',
      publishedAt: '2024-06-05',
      readTime: '5 min read',
      category: 'AI Technology',
      image: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2820&q=80',
      views: 1780,
      likes: 134,
      featured: false
    },
    {
      id: 6,
      title: 'How to Make Seamless Loops in AI-Generated Videos',
      excerpt: 'Create perfect looping videos with AI tools like Runway and Pika. Our step-by-step guide shows exactly how to craft seamless animations.',
      author: 'Agnieszka Ziebinska',
      authorRole: 'Content Creator',
      authorImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=80',
      publishedAt: '2024-06-01',
      readTime: '8 min read',
      category: 'Tutorials',
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2670&q=80',
      views: 1320,
      likes: 95,
      featured: false
    }
  ];

  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // This is a duplicate formatDate function that needs to be removed
  // The original formatDate function is already defined at the top of the component

  return (
    <div className="min-h-screen bg-black text-white">
     
      
      {/* Blog header with logo and title */}
      <div className="relative pt-24 pb-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <h1 className="text-xl font-medium tracking-tight text-white">Blog</h1>
        </div>
      </div>
      
      {/* Search and filter section */}
      <section className={`py-4 backdrop-blur-md bg-black/30 border-b border-gray-700 sticky top-0 z-20 transition-all duration-300 ${isScrolled ? 'shadow-lg' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md w-full">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-black/50 backdrop-blur-sm text-white placeholder-gray-400"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    selectedCategory === category
                      ? 'bg-purple-600/80 text-white backdrop-blur-sm'
                      : 'bg-gray-800/50 text-gray-200 hover:bg-gray-700/70 backdrop-blur-sm'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* Featured post grid */}
      <div className="relative py-8 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-black z-0"></div>
        
        {/* Animated grid background similar to HomePage */}
        <div className="absolute inset-0 z-0 opacity-30">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
              MatrixAI Blog
            </h1>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-300 sm:mt-4">
              Insights, updates, and deep dives into the world of AI technology
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Featured post card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="col-span-1 bg-gradient-to-b from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden hover:shadow-lg hover:shadow-purple-900/10 transition-all duration-300"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={featuredPost.image}
                  alt={featuredPost.title}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-purple-900/50 backdrop-blur-sm text-purple-200 border border-purple-700/50 px-2 py-1 rounded-full text-xs font-medium">
                    {featuredPost.category}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 hover:text-purple-400 transition-colors duration-200">
                  {featuredPost.title}
                </h3>
                
                <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                  {featuredPost.excerpt}
                </p>
                
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <img
                      src={featuredPost.authorImage}
                      alt={featuredPost.author}
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-purple-500/30"
                    />
                    <span className="text-sm text-gray-300">{featuredPost.author}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <FiCalendar className="h-3 w-3" />
                    {formatDate(featuredPost.publishedAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiClock className="h-3 w-3" />
                    {featuredPost.readTime}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Second post card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="col-span-1 bg-gradient-to-b from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden hover:shadow-lg hover:shadow-purple-900/10 transition-all duration-300"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={blogPosts[0].image}
                  alt={blogPosts[0].title}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-purple-900/50 backdrop-blur-sm text-purple-200 border border-purple-700/50 px-2 py-1 rounded-full text-xs font-medium">
                    {blogPosts[0].category}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 hover:text-purple-400 transition-colors duration-200">
                  {blogPosts[0].title}
                </h3>
                
                <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                  {blogPosts[0].excerpt}
                </p>
                
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <img
                      src={blogPosts[0].authorImage}
                      alt={blogPosts[0].author}
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-purple-500/30"
                    />
                    <span className="text-sm text-gray-300">{blogPosts[0].author}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <FiCalendar className="h-3 w-3" />
                    {formatDate(blogPosts[0].publishedAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiClock className="h-3 w-3" />
                    {blogPosts[0].readTime}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Third post card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="col-span-1 bg-gradient-to-b from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden hover:shadow-lg hover:shadow-purple-900/10 transition-all duration-300"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={blogPosts[1].image}
                  alt={blogPosts[1].title}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-purple-900/50 backdrop-blur-sm text-purple-200 border border-purple-700/50 px-2 py-1 rounded-full text-xs font-medium">
                    {blogPosts[1].category}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 hover:text-purple-400 transition-colors duration-200">
                  {blogPosts[1].title}
                </h3>
                
                <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                  {blogPosts[1].excerpt}
                </p>
                
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <img
                      src={blogPosts[1].authorImage}
                      alt={blogPosts[1].author}
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-purple-500/30"
                    />
                    <span className="text-sm text-gray-300">{blogPosts[1].author}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <FiCalendar className="h-3 w-3" />
                    {formatDate(blogPosts[1].publishedAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiClock className="h-3 w-3" />
                    {blogPosts[1].readTime}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* More blog posts section */}
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {blogPosts
            .slice(2, 5) // Display posts 3-6
            .filter(post => selectedCategory === 'All' || post.category === selectedCategory)
            .filter(post => 
              post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map(post => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="col-span-1 bg-gradient-to-b from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden hover:shadow-lg hover:shadow-purple-900/10 transition-all duration-300"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-purple-900/50 backdrop-blur-sm text-purple-200 border border-purple-700/50 px-2 py-1 rounded-full text-xs font-medium">
                      {post.category}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 hover:text-purple-400 transition-colors duration-200">
                    {post.title}
                  </h3>
                  
                  <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                    {post.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={post.authorImage}
                        alt={post.author}
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-purple-500/30"
                      />
                      <span className="text-sm text-gray-300">{post.author}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <FiCalendar className="h-3 w-3" />
                      {formatDate(post.publishedAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiClock className="h-3 w-3" />
                      {post.readTime}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
        </div>
      </div>

      {/* Blog Posts Grid */}
      <section className="py-16 bg-black relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-black z-0"></div>
        
        {/* Animated grid background */}
        <div className="absolute inset-0 z-0 opacity-30">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              Latest Articles
            </h2>
            <p className="text-xl text-gray-300">
              {filteredPosts.length} {filteredPosts.length === 1 ? 'article' : 'articles'} found
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post, index) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="backdrop-blur-md bg-black/30 border border-gray-700 rounded-xl overflow-hidden shadow-md hover:shadow-purple-900/20 hover:border-purple-700/50 transition-all duration-300"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-48 object-cover transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-60"></div>
                  <div className="absolute top-4 left-4">
                    <span className="bg-purple-900/50 backdrop-blur-sm text-purple-200 border border-purple-700/50 px-3 py-1 rounded-full text-sm font-medium">
                      {post.category}
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 hover:text-purple-400 transition-colors duration-200">
                    {post.title}
                  </h3>
                  
                  <p className="text-gray-300 mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  
                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={post.authorImage}
                      alt={post.author}
                      className="w-10 h-10 rounded-full object-cover ring-1 ring-purple-500/30"
                    />
                    <div>
                      <p className="font-medium text-white text-sm">
                        {post.author}
                      </p>
                      <p className="text-xs text-gray-400">
                        {post.authorRole}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                    <span className="flex items-center gap-1">
                      <FiCalendar className="h-4 w-4" />
                      {formatDate(post.publishedAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiClock className="h-4 w-4" />
                      {post.readTime}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <FiEye className="h-4 w-4" />
                        {post.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <FiHeart className="h-4 w-4" />
                        {post.likes}
                      </span>
                    </div>
                    <Link
                      to={`/blog/${post.id}`}
                      className="text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 transition-colors duration-200"
                    >
                      Read More
                      <FiArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>

          {filteredPosts.length === 0 && (
            <div className="text-center py-12 backdrop-blur-md bg-black/30 border border-gray-700 rounded-xl">
              <FiBookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">
                No articles found
              </h3>
              <p className="text-gray-400">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              Stay Updated
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Subscribe to our newsletter for the latest AI insights and updates
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-blue-300 focus:outline-none"
              />
              <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Subscribe
              </button>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
};

export default BlogPage;
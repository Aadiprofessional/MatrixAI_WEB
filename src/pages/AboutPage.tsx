import React from 'react';
import { motion } from 'framer-motion';
import { FiMessageCircle, FiUsers, FiGlobe, FiStar } from 'react-icons/fi';

const AboutPage: React.FC = () => {
  const teamMembers = [
    {
      name: 'Alex Johnson',
      role: 'CEO & Co-founder',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=80',
      bio: 'Former ML researcher with 10+ years experience in AI development. Led AI initiatives at Google before founding our company.'
    },
    {
      name: 'Sarah Chen',
      role: 'CTO & Co-founder',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=80',
      bio: 'PhD in Computer Science specializing in NLP. Previously developed conversational AI systems at Amazon.'
    },
    {
      name: 'Marcus Torres',
      role: 'Head of Product',
      image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=80',
      bio: 'Product leader with experience at Slack and Microsoft. Passionate about creating intuitive user experiences.'
    },
    {
      name: 'Priya Sharma',
      role: 'Lead ML Engineer',
      image: 'https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=80',
      bio: 'Expert in large language models and reinforcement learning. Previously worked on language understanding at DeepMind.'
    }
  ];

  const values = [
    {
      title: "User-Centric Innovation",
      description: "We build AI that enhances human capabilities without replacing the human connection. Our products are designed to solve real problems for real people.",
      icon: <FiUsers className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
    },
    {
      title: "Responsible AI",
      description: "We believe in developing AI systems ethically and responsibly, with transparency in how we train our models and handle data.",
      icon: <FiStar className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
    },
    {
      title: "Open Communication",
      description: "We foster honest and open dialogue, both within our team and with our customers, to build trust and continuously improve.",
      icon: <FiMessageCircle className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
    },
    {
      title: "Global Perspective",
      description: "We're building AI that works for everyone, accounting for diverse languages, cultures, and use cases around the world.",
      icon: <FiGlobe className="h-12 w-12 text-indigo-600 dark:text-indigo-400" />
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero section */}
      <div className="relative bg-indigo-700 dark:bg-indigo-900">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2850&q=80"
            alt="Team collaboration"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-indigo-700 mix-blend-multiply" />
        </div>
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl"
          >
            About Us
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6 text-xl text-indigo-100 max-w-3xl"
          >
            We're on a mission to make AI assistants more helpful, harmless, and honest. 
            Founded in 2021, we're building the next generation of AI tools that augment human capabilities.
          </motion.p>
        </div>
      </div>

      {/* Our story section */}
      <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Our Story</h2>
            <div className="mt-6 space-y-6 text-lg text-gray-500 dark:text-gray-400">
              <p>
                Our journey began when our founders, Alex and Sarah, met at a machine learning conference in 2019. They shared a vision for AI assistants that could be genuinely helpful without being manipulative or intrusive.
              </p>
              <p>
                After experiencing firsthand the limitations of existing AI products, they decided to build something better—a truly intelligent assistant that could understand natural language, learn from feedback, and adapt to users' specific needs.
              </p>
              <p>
                In 2021, they assembled a team of experts in machine learning, product design, and human-computer interaction. Together, they've built an AI platform that's now used by thousands of businesses and individuals worldwide.
              </p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative h-96 rounded-xl overflow-hidden shadow-xl"
          >
            <img
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2850&q=80"
              alt="Our team"
              className="w-full h-full object-cover"
            />
          </motion.div>
        </div>
      </div>

      {/* Values section */}
      <div className="bg-white dark:bg-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-extrabold text-gray-900 dark:text-white"
            >
              Our Values
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-4 max-w-3xl mx-auto text-xl text-gray-500 dark:text-gray-400"
            >
              The principles that guide our work and company culture
            </motion.p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                className="bg-gray-50 dark:bg-gray-700 rounded-xl p-8 text-center"
              >
                <div className="flex justify-center">{value.icon}</div>
                <h3 className="mt-6 text-lg font-medium text-gray-900 dark:text-white">{value.title}</h3>
                <p className="mt-4 text-gray-500 dark:text-gray-400">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Team section */}
      <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-extrabold text-gray-900 dark:text-white"
          >
            Meet Our Team
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 max-w-3xl mx-auto text-xl text-gray-500 dark:text-gray-400"
          >
            A diverse group of experts passionate about building better AI
          </motion.p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {teamMembers.map((member, index) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              className="bg-white dark:bg-gray-800 shadow-md rounded-xl overflow-hidden"
            >
              <div className="h-64 relative">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{member.name}</h3>
                <p className="text-indigo-600 dark:text-indigo-400">{member.role}</p>
                <p className="mt-4 text-gray-500 dark:text-gray-400">{member.bio}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Stats section */}
      <div className="bg-indigo-700 dark:bg-indigo-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-center"
            >
              <div className="text-4xl font-extrabold text-white">30+</div>
              <div className="mt-2 text-indigo-100">Team Members</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center"
            >
              <div className="text-4xl font-extrabold text-white">5000+</div>
              <div className="mt-2 text-indigo-100">Customers</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-center"
            >
              <div className="text-4xl font-extrabold text-white">12M+</div>
              <div className="mt-2 text-indigo-100">AI Conversations</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-center"
            >
              <div className="text-4xl font-extrabold text-white">20+</div>
              <div className="mt-2 text-indigo-100">Countries</div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Investors & Partners */}
      <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Backed By</h2>
          <p className="mt-4 max-w-3xl mx-auto text-xl text-gray-500 dark:text-gray-400">
            Partnering with leading technology investors to build the future of AI
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-4"
        >
          <div className="flex justify-center items-center h-16 px-4 opacity-70 grayscale transition-all hover:opacity-100 hover:grayscale-0">
            <div className="text-xl font-bold text-gray-500 dark:text-gray-400">Sequoia Capital</div>
          </div>
          <div className="flex justify-center items-center h-16 px-4 opacity-70 grayscale transition-all hover:opacity-100 hover:grayscale-0">
            <div className="text-xl font-bold text-gray-500 dark:text-gray-400">Andreessen Horowitz</div>
          </div>
          <div className="flex justify-center items-center h-16 px-4 opacity-70 grayscale transition-all hover:opacity-100 hover:grayscale-0">
            <div className="text-xl font-bold text-gray-500 dark:text-gray-400">Google Ventures</div>
          </div>
          <div className="flex justify-center items-center h-16 px-4 opacity-70 grayscale transition-all hover:opacity-100 hover:grayscale-0">
            <div className="text-xl font-bold text-gray-500 dark:text-gray-400">Y Combinator</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AboutPage; 
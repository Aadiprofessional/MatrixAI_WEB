import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  FiMapPin, 
  FiClock, 
  FiDollarSign, 
  FiUsers, 
  FiTrendingUp, 
  FiHeart,
  FiMail,
  FiExternalLink,
  FiCheckCircle,
  FiCode,
  FiPieChart,
  FiMessageSquare,
  FiGlobe
} from 'react-icons/fi';

const CareersPage: React.FC = () => {
  const { t } = useTranslation();
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');

  const jobOpenings = [
    {
      id: 1,
      title: 'Senior AI Engineer',
      department: 'Engineering',
      location: 'San Francisco, CA',
      type: 'Full-time',
      salary: '$150,000 - $200,000',
      description: 'Join our AI team to build cutting-edge machine learning models and systems.',
      requirements: ['5+ years in ML/AI', 'Python, TensorFlow/PyTorch', 'PhD preferred'],
      posted: '2 days ago'
    },
    {
      id: 2,
      title: 'Product Designer',
      department: 'Design',
      location: 'Remote',
      type: 'Full-time',
      salary: '$120,000 - $160,000',
      description: 'Design intuitive user experiences for our AI-powered products.',
      requirements: ['4+ years UX/UI design', 'Figma, Sketch', 'AI product experience'],
      posted: '1 week ago'
    },
    {
      id: 3,
      title: 'DevOps Engineer',
      department: 'Engineering',
      location: 'London, UK',
      type: 'Full-time',
      salary: '£80,000 - £110,000',
      description: 'Scale our infrastructure to support millions of AI interactions daily.',
      requirements: ['3+ years DevOps', 'AWS/GCP', 'Kubernetes, Docker'],
      posted: '3 days ago'
    },
    {
      id: 4,
      title: 'Marketing Manager',
      department: 'Marketing',
      location: 'New York, NY',
      type: 'Full-time',
      salary: '$90,000 - $130,000',
      description: 'Lead our marketing efforts to grow our AI platform globally.',
      requirements: ['5+ years marketing', 'B2B SaaS experience', 'Growth mindset'],
      posted: '5 days ago'
    },
    {
      id: 5,
      title: 'Customer Success Manager',
      department: 'Customer Success',
      location: 'Remote',
      type: 'Full-time',
      salary: '$80,000 - $110,000',
      description: 'Help our customers succeed with our AI tools and drive retention.',
      requirements: ['3+ years customer success', 'Technical background', 'Excellent communication'],
      posted: '1 week ago'
    },
    {
      id: 6,
      title: 'Data Scientist',
      department: 'Engineering',
      location: 'San Francisco, CA',
      type: 'Full-time',
      salary: '$140,000 - $180,000',
      description: 'Analyze user data to improve our AI models and product features.',
      requirements: ['PhD in related field', 'Python, R, SQL', 'ML model deployment'],
      posted: '4 days ago'
    }
  ];

  const departments = [
    { key: 'All', label: t('careers.departments.all') },
    { key: 'Engineering', label: t('careers.departments.engineering') },
    { key: 'Design', label: t('careers.departments.design') },
    { key: 'Marketing', label: t('careers.departments.marketing') },
    { key: 'Customer Success', label: t('careers.departments.customerSuccess') }
  ];

  const benefits = [
    {
      title: t('careers.benefits.healthWellness.title'),
      description: t('careers.benefits.healthWellness.description'),
      icon: <FiHeart className="h-6 w-6" />
    },
    {
      title: t('careers.benefits.flexibleWork.title'),
      description: t('careers.benefits.flexibleWork.description'),
      icon: <FiGlobe className="h-6 w-6" />
    },
    {
      title: t('careers.benefits.learningBudget.title'),
      description: t('careers.benefits.learningBudget.description'),
      icon: <FiTrendingUp className="h-6 w-6" />
    },
    {
      title: t('careers.benefits.equityPackage.title'),
      description: t('careers.benefits.equityPackage.description'),
      icon: <FiPieChart className="h-6 w-6" />
    },
    {
      title: t('careers.benefits.teamEvents.title'),
      description: t('careers.benefits.teamEvents.description'),
      icon: <FiUsers className="h-6 w-6" />
    },
    {
      title: t('careers.benefits.latestTech.title'),
      description: t('careers.benefits.latestTech.description'),
      icon: <FiCode className="h-6 w-6" />
    }
  ];

  const filteredJobs = selectedDepartment === 'All' 
    ? jobOpenings 
    : jobOpenings.filter(job => job.department === selectedDepartment);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 py-20">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              {t('careers.joinAiRevolution')}
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8">
              {t('careers.helpBuildFuture')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                {t('careers.viewOpenPositions')}
              </button>
              <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-gray-900 transition-colors">
                {t('careers.learnAboutCulture')}
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">{t('careers.stats.teamMembers.number')}</div>
              <div className="text-gray-600 dark:text-gray-400 mt-2">{t('careers.stats.teamMembers.label')}</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">{t('careers.stats.countries.number')}</div>
              <div className="text-gray-600 dark:text-gray-400 mt-2">{t('careers.stats.countries.label')}</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="text-4xl font-bold text-pink-600 dark:text-pink-400">{t('careers.stats.aiInteractions.number')}</div>
              <div className="text-gray-600 dark:text-gray-400 mt-2">{t('careers.stats.aiInteractions.label')}</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="text-4xl font-bold text-green-600 dark:text-green-400">{t('careers.stats.funding.number')}</div>
              <div className="text-gray-600 dark:text-gray-400 mt-2">{t('careers.stats.funding.label')}</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {t('careers.whyWorkWithUs')}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              {t('careers.benefitsDescription')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="text-blue-600 dark:text-blue-400 mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {benefit.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Job Listings Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {t('careers.openPositions')}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              {t('careers.findOpportunity')}
            </p>
          </div>

          {/* Department Filter */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {departments.map((dept) => (
              <button
                key={dept.key}
                onClick={() => setSelectedDepartment(dept.key)}
                className={`px-6 py-2 rounded-full font-medium transition-colors ${
                  selectedDepartment === dept.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {dept.label}
              </button>
            ))}
          </div>

          {/* Job Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredJobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {job.title}
                    </h3>
                    <div className="flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <FiMapPin className="h-4 w-4" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <FiClock className="h-4 w-4" />
                        {job.type}
                      </span>
                      <span className="flex items-center gap-1">
                        <FiDollarSign className="h-4 w-4" />
                        {job.salary}
                      </span>
                    </div>
                  </div>
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm">
                    {job.department}
                  </span>
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {job.description}
                </p>
                
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">{t('careers.keyRequirements')}:</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    {job.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <FiCheckCircle className="h-4 w-4 text-green-500" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {t('careers.posted')} {job.posted}
                  </span>
                  <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                    {t('careers.applyNow')}
                    <FiExternalLink className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {t('careers.dontSeeRole')}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              {t('careers.alwaysLooking')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:info@matrixaiglobal.com"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <FiMail className="h-5 w-5" />
                {t('careers.sendResume')}
              </a>
              <a
                href="mailto:info@matrixaiglobal.com"
                className="border-2 border-blue-600 text-blue-600 dark:text-blue-400 px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                <FiMessageSquare className="h-5 w-5" />
                {t('careers.askQuestions')}
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default CareersPage;
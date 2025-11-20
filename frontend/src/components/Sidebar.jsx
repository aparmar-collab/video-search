import React, { useState } from 'react';
import { Search, UploadCloud, PanelLeft, Grid, User, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.aside
      initial={{ x: -100, opacity: 0 }}
      animate={{ 
        x: 0, 
        opacity: 1,
        width: isExpanded ? '240px' : '80px'
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-screen flex flex-col py-6 bg-white border-r border-blue-100 shadow-sm z-40"
    >
      {/* Toggle Button */}
      <div className="mb-6 px-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center gap-3 p-3 rounded-lg text-blue-600 hover:bg-blue-50 transition-all"
          aria-label={isExpanded ? 'Close sidebar' : 'Open sidebar'}
        >
          <PanelLeft className="w-6 h-6 flex-shrink-0" />
          <AnimatePresence>
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="text-sm font-medium whitespace-nowrap overflow-hidden"
              >
                Close sidebar
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 space-y-2">
        {/* Explore Button */}
        <button
          onClick={() => setActiveTab('explore')}
          className={`w-full flex items-center gap-3 p-3 transition-all ${
            isExpanded ? 'rounded-lg' : 'rounded-full justify-center'
          } ${
            activeTab === 'explore' 
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg' 
              : 'text-blue-600 hover:bg-blue-50'
          }`}
        >
          <Grid className="w-6 h-6 flex-shrink-0" />
          <AnimatePresence>
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="text-sm font-medium whitespace-nowrap overflow-hidden"
              >
                Explore
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Search Button */}
        <button
          onClick={() => setActiveTab('search')}
          className={`w-full flex items-center gap-3 p-3 transition-all ${
            isExpanded ? 'rounded-lg' : 'rounded-full justify-center'
          } ${
            activeTab === 'search' 
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg' 
              : 'text-blue-600 hover:bg-blue-50'
          }`}
        >
          <Search className="w-6 h-6 flex-shrink-0" />
          <AnimatePresence>
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="text-sm font-medium whitespace-nowrap overflow-hidden"
              >
                Search
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Upload Button */}
        <button
          onClick={() => setActiveTab('upload')}
          className={`w-full flex items-center gap-3 p-3 transition-all ${
            isExpanded ? 'rounded-lg' : 'rounded-full justify-center'
          } ${
            activeTab === 'upload' 
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg' 
              : 'text-blue-600 hover:bg-blue-50'
          }`}
        >
          <UploadCloud className="w-6 h-6 flex-shrink-0" />
          <AnimatePresence>
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="text-sm font-medium whitespace-nowrap overflow-hidden"
              >
                Upload
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Marengo 3 Search Button */}
        <button
          onClick={() => setActiveTab('search-3')}
          className={`w-full flex items-center gap-3 p-3 transition-all ${
            isExpanded ? 'rounded-lg' : 'rounded-full justify-center'
          } ${
            activeTab === 'search-3' 
              ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg' 
              : 'text-purple-600 hover:bg-purple-50'
          }`}
        >
          <Sparkles className="w-6 h-6 flex-shrink-0" />
          <AnimatePresence>
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="text-sm font-medium whitespace-nowrap overflow-hidden"
              >
                Marengo 3
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </nav>

      {/* User Profile - Bottom */}
      <div className="px-4 pt-4 border-t border-blue-100">
        <div className={`flex items-center gap-3 p-3 transition-all cursor-pointer ${
          isExpanded ? 'rounded-lg hover:bg-blue-50' : 'rounded-full hover:bg-blue-50 justify-center'
        }`}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
            <User className="w-5 h-5" />
          </div>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">sw1tch28</p>
                <p className="text-xs text-gray-500 whitespace-nowrap">View profile</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;

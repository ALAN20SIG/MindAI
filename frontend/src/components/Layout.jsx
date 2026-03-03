import { NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  MessageCircle, 
  Brain, 
  Settings,
  Moon,
  Sun,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/chat', icon: MessageCircle, label: 'Chat' },
  { path: '/insights', icon: Brain, label: 'Insights' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout({ children }) {
  const { darkMode, toggleDarkMode } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const sidebarWidth = isCollapsed ? 'w-20' : 'w-64';
  const mainMargin = isCollapsed ? 'ml-20' : 'ml-64';

  return (
    <div className={`min-h-screen transition-all-500 ${darkMode ? 'gradient-soft-dark gradient-mesh' : 'gradient-soft gradient-mesh'}`}>
      {/* Sidebar */}
      <motion.aside 
        className={`fixed left-0 top-0 h-full ${sidebarWidth} ${darkMode ? 'bg-slate-900/90 border-slate-700/50' : 'bg-white/90 border-slate-200/50'} border-r shadow-2xl z-50`}
        style={{
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }}
        initial={false}
        animate={{ width: isCollapsed ? 80 : 256 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Collapse Button */}
        {!isMobile && (
          <motion.button
            onClick={toggleSidebar}
            className={`absolute -right-3 top-24 w-7 h-7 rounded-full ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200'} border-2 shadow-lg flex items-center justify-center z-50 hover:shadow-xl transition-all`}
            whileHover={{ scale: 1.15, rotate: isCollapsed ? -10 : 10 }}
            whileTap={{ scale: 0.9 }}
          >
            {isCollapsed ? (
              <ChevronRight className={`w-4 h-4 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`} />
            ) : (
              <ChevronLeft className={`w-4 h-4 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`} />
            )}
          </motion.button>
        )}

        {/* Logo */}
        <div className={`h-24 flex items-center border-b ${darkMode ? 'border-slate-700/50' : 'border-slate-200/50'} ${isCollapsed ? 'justify-center' : 'justify-start px-6'}`}>
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span 
                  className={`text-xl font-bold whitespace-nowrap tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    MindAI
                  </span>
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item, index) => (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <NavLink
                to={item.path}
                className={({ isActive }) => {
                  const baseClasses = 'group flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 ease-out';
                  const collapsedClass = isCollapsed ? 'justify-center' : '';
                  const activeClasses = isActive 
                    ? darkMode 
                      ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-300 border border-blue-500/30 shadow-lg shadow-blue-500/10' 
                      : 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border border-blue-200 shadow-md shadow-blue-500/10'
                    : darkMode
                      ? 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-100'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900';
                  return `${baseClasses} ${collapsedClass} ${activeClasses}`;
                }}
                title={isCollapsed ? item.label : ''}
              >
                {({ isActive }) => (
                  <>
                    <div className={`p-2 rounded-xl transition-all duration-300 ${
                      isActive 
                        ? darkMode ? 'bg-blue-500/20' : 'bg-blue-100'
                        : 'bg-transparent group-hover:bg-slate-200/50 dark:group-hover:bg-slate-700/50'
                    }`}>
                      <item.icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                        isActive ? 'text-blue-500' : ''
                      }`} />
                    </div>
                    <AnimatePresence>
                      {!isCollapsed && (
                        <motion.span 
                          className="font-medium whitespace-nowrap"
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </NavLink>
            </motion.div>
          ))}
        </nav>

        {/* Dark Mode Toggle */}
        <div className={`absolute bottom-6 left-0 right-0 px-4 ${isCollapsed ? 'flex justify-center' : ''}`}>
          <motion.button
            onClick={toggleDarkMode}
            className={`group flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 ${
              isCollapsed ? 'justify-center w-12 px-0' : 'w-full justify-start'
            } ${
              darkMode 
                ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/10' 
                : 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 border border-slate-300 hover:shadow-md'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            title={isCollapsed ? (darkMode ? 'Light Mode' : 'Dark Mode') : ''}
          >
            <div className={`p-2 rounded-xl transition-all duration-300 ${
              darkMode ? 'bg-amber-500/20 group-hover:bg-amber-500/30' : 'bg-white group-hover:bg-slate-50'
            }`}>
              {darkMode ? <Sun className="w-5 h-5 flex-shrink-0 text-amber-500" /> : <Moon className="w-5 h-5 flex-shrink-0 text-slate-600" />}
            </div>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span 
                  className="font-semibold whitespace-nowrap"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {darkMode ? 'Light Mode' : 'Dark Mode'}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <motion.main 
        className={`min-h-screen ${mainMargin} min-w-0`}
        initial={false}
        animate={{ marginLeft: isCollapsed ? 80 : 256 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Content Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`w-full h-screen overflow-hidden flex flex-col ${
            darkMode 
              ? 'bg-slate-900/90' 
              : 'bg-white/90'
          }`}
          style={{
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          }}
        >
          {/* Content Header */}
          <div className={`px-8 py-6 flex-shrink-0 ${
            darkMode ? 'bg-slate-800/50 border-b border-slate-700/50' : 'bg-slate-100/50 border-b border-slate-200/50'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                  darkMode 
                    ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 shadow-blue-500/10' 
                    : 'bg-gradient-to-br from-blue-100 to-purple-100 shadow-blue-500/20'
                }`}>
                  <Sparkles className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <div>
                  <h1 className={`text-2xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      MindAI
                    </span>
                  </h1>
                  <p className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Your Mental Wellness Companion
                  </p>
                </div>
              </div>
              {/* Decorative element */}
              <div className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                darkMode 
                  ? 'bg-slate-800/80 text-slate-300 border border-slate-700' 
                  : 'bg-white/80 text-slate-600 border border-slate-200 shadow-sm'
              }`}>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Online
              </div>
            </div>
          </div>

          {/* Content Body */}
          <div className="flex-1 p-8 overflow-y-auto min-h-0">
            {children}
          </div>
        </motion.div>
      </motion.main>
    </div>
  );
}

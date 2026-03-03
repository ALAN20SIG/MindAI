import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Heart, AlertTriangle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function CrisisModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { darkMode } = useTheme();

  // Listen for crisis detection events
  useEffect(() => {
    const handleCrisis = () => setIsOpen(true);
    window.addEventListener('crisis-detected', handleCrisis);
    return () => window.removeEventListener('crisis-detected', handleCrisis);
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className={`relative max-w-lg w-full rounded-3xl p-8 shadow-2xl ${
              darkMode 
                ? 'bg-gradient-to-br from-rose-900/90 to-slate-900/90 border border-rose-700/50' 
                : 'bg-gradient-to-br from-rose-50 to-white border border-rose-200'
            }`}
          >
            {/* Close button */}
            <button
              onClick={() => setIsOpen(false)}
              className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
                darkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
              }`}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                darkMode ? 'bg-rose-500/20' : 'bg-rose-100'
              }`}>
                <Heart className="w-7 h-7 text-rose-500 animate-pulse" />
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                  We Care About You
                </h2>
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Your wellbeing is important to us
                </p>
              </div>
            </div>

            {/* Message */}
            <div className={`p-4 rounded-2xl mb-6 ${
              darkMode ? 'bg-rose-500/10 border border-rose-500/20' : 'bg-rose-50 border border-rose-100'
            }`}>
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                <p className={`text-sm leading-relaxed ${darkMode ? 'text-rose-200' : 'text-rose-700'}`}>
                  It sounds like you may be going through an extremely difficult time. 
                  Your safety matters. Please reach out to a professional who can help.
                </p>
              </div>
            </div>

            {/* Resources */}
            <div className="space-y-3">
              <h3 className={`text-sm font-semibold uppercase tracking-wider ${
                darkMode ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Immediate Help Resources
              </h3>
              
              {[
                { name: '988 Suicide & Crisis Lifeline', contact: 'Call or text 988', country: 'US' },
                { name: 'Crisis Text Line', contact: 'Text HOME to 741741', country: 'US' },
                { name: 'Emergency Services', contact: 'Call 911', country: 'US' },
              ].map((resource, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-4 p-4 rounded-xl ${
                    darkMode 
                      ? 'bg-slate-800/50 hover:bg-slate-800' 
                      : 'bg-slate-50 hover:bg-slate-100'
                  } transition-colors`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    darkMode ? 'bg-green-500/20' : 'bg-green-100'
                  }`}>
                    <Phone className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                      {resource.name}
                    </h4>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {resource.contact}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {resource.country}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Footer */}
            <p className={`mt-6 text-center text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              You are not alone, and help is available right now. 💙
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

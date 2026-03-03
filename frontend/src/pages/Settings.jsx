import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Moon, 
  Bell, 
  Download, 
  Trash2, 
  Shield, 
  User,
  ChevronRight,
  Check,
  AlertTriangle
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function Settings() {
  const { darkMode, toggleDarkMode } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [dataSharing, setDataSharing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const settingsGroups = [
    {
      title: 'Appearance',
      items: [
        {
          icon: Moon,
          label: 'Dark Mode',
          description: 'Toggle between light and dark theme',
          type: 'toggle',
          value: darkMode,
          onChange: toggleDarkMode,
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          icon: Bell,
          label: 'Push Notifications',
          description: 'Get reminders for mood check-ins',
          type: 'toggle',
          value: notifications,
          onChange: () => setNotifications(!notifications),
        },
      ],
    },
    {
      title: 'Privacy & Data',
      items: [
        {
          icon: Shield,
          label: 'Data Sharing',
          description: 'Allow anonymous data for research',
          type: 'toggle',
          value: dataSharing,
          onChange: () => setDataSharing(!dataSharing),
        },
        {
          icon: Download,
          label: 'Export Data',
          description: 'Download your mood history as CSV',
          type: 'button',
          onClick: () => alert('Exporting data...'),
        },
        {
          icon: Trash2,
          label: 'Delete All Data',
          description: 'Permanently remove all your data',
          type: 'danger',
          onClick: () => setShowDeleteConfirm(true),
        },
      ],
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
          Settings
        </h1>
        <p className={`mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Customize your MindAI experience
        </p>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className={`p-6 rounded-3xl ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} border shadow-lg`}
      >
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
            A
          </div>
          <div className="flex-1">
            <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              Alan
            </h2>
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Member since March 2026
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs px-2 py-1 rounded-full ${
                darkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'
              }`}>
                Active
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
              }`}>
                Pro Plan
              </span>
            </div>
          </div>
          <button className={`p-2 rounded-xl ${darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'} transition-colors`}>
            <User className={`w-5 h-5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
          </button>
        </div>
      </motion.div>

      {/* Settings Groups */}
      <div className="space-y-6">
        {settingsGroups.map((group, groupIndex) => (
          <motion.div
            key={group.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + groupIndex * 0.1 }}
          >
            <h3 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${
              darkMode ? 'text-slate-400' : 'text-slate-500'
            }`}>
              {group.title}
            </h3>
            <div className={`rounded-2xl overflow-hidden ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} border shadow-lg`}>
              {group.items.map((item, itemIndex) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-4 p-4 ${
                    itemIndex !== group.items.length - 1 
                      ? `border-b ${darkMode ? 'border-slate-700' : 'border-slate-100'}` 
                      : ''
                  }`}
                >
                  <div className={`p-3 rounded-xl ${
                    item.type === 'danger' 
                      ? darkMode ? 'bg-rose-500/20' : 'bg-rose-100'
                      : darkMode ? 'bg-slate-700' : 'bg-slate-100'
                  }`}>
                    <item.icon className={`w-5 h-5 ${
                      item.type === 'danger' 
                        ? 'text-rose-500' 
                        : darkMode ? 'text-slate-400' : 'text-slate-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${
                      item.type === 'danger' 
                        ? 'text-rose-500' 
                        : darkMode ? 'text-white' : 'text-slate-800'
                    }`}>
                      {item.label}
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {item.description}
                    </p>
                  </div>
                  
                  {item.type === 'toggle' && (
                    <button
                      onClick={item.onChange}
                      className={`w-14 h-7 rounded-full transition-colors relative ${
                        item.value 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500' 
                          : darkMode ? 'bg-slate-600' : 'bg-slate-300'
                      }`}
                    >
                      <motion.div
                        className="w-5 h-5 rounded-full bg-white shadow-md absolute top-1"
                        animate={{ left: item.value ? '32px' : '4px' }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    </button>
                  )}
                  
                  {(item.type === 'button' || item.type === 'danger') && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={item.onClick}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        item.type === 'danger'
                          ? 'bg-rose-500 text-white hover:bg-rose-600'
                          : darkMode 
                            ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {item.type === 'danger' ? 'Delete' : 'Export'}
                    </motion.button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Privacy Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className={`p-6 rounded-2xl ${darkMode ? 'bg-blue-900/20 border-blue-700/30' : 'bg-blue-50 border-blue-200'} border`}
      >
        <div className="flex items-start gap-3">
          <Shield className={`w-5 h-5 mt-0.5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          <div>
            <h4 className={`font-semibold ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>
              Your Privacy Matters
            </h4>
            <p className={`mt-1 text-sm ${darkMode ? 'text-blue-200' : 'text-blue-700'}`}>
              All your data is stored locally and encrypted. We never share your personal 
              information with third parties without your explicit consent.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className={`max-w-md w-full rounded-3xl p-6 shadow-2xl ${
              darkMode 
                ? 'bg-slate-800 border-slate-700' 
                : 'bg-white border-slate-200'
            } border`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-rose-500" />
              </div>
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                Delete All Data?
              </h3>
            </div>
            <p className={`mb-6 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              This action cannot be undone. All your mood history, chat logs, and 
              personalization data will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                  darkMode 
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('All data deleted');
                  setShowDeleteConfirm(false);
                }}
                className="flex-1 py-3 rounded-xl font-medium bg-rose-500 text-white hover:bg-rose-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Version */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className={`text-center text-sm ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}
      >
        MindAI v1.0.0 • Built with 💙 for mental health
      </motion.p>
    </div>
  );
}

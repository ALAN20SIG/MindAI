import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

const expressions = {
  calm: {
    eyes: 'M 35 45 Q 40 48 45 45',
    mouth: 'M 35 65 Q 40 68 45 65',
    blush: 'opacity-30',
    glow: 'opacity-40',
  },
  happy: {
    eyes: 'M 33 44 Q 40 40 47 44',
    mouth: 'M 32 62 Q 40 72 48 62',
    blush: 'opacity-60',
    glow: 'opacity-70',
  },
  concerned: {
    eyes: 'M 35 46 Q 40 44 45 46',
    mouth: 'M 37 68 Q 40 65 43 68',
    blush: 'opacity-20',
    glow: 'opacity-30',
  },
  encouraging: {
    eyes: 'M 33 43 Q 40 45 47 43',
    mouth: 'M 33 64 Q 40 70 47 64',
    blush: 'opacity-50',
    glow: 'opacity-60',
  },
  listening: {
    eyes: 'M 35 45 Q 40 45 45 45',
    mouth: 'M 38 66 Q 40 67 42 66',
    blush: 'opacity-40',
    glow: 'opacity-50',
  },
};

export default function AICharacter({ 
  expression = 'calm', 
  isListening = false, 
  isSpeaking = false,
  size = 'large'
}) {
  const { darkMode } = useTheme();
  const currentExpression = expressions[expression] || expressions.calm;
  
  const sizeClasses = {
    small: 'w-24 h-24',
    medium: 'w-40 h-40',
    large: 'w-64 h-64',
    xl: 'w-80 h-80',
  };

  return (
    <motion.div 
      className={`relative ${sizeClasses[size]}`}
      animate={{
        scale: isSpeaking ? [1, 1.02, 1] : 1,
      }}
      transition={{
        duration: 0.5,
        repeat: isSpeaking ? Infinity : 0,
      }}
    >
      {/* Outer Glow */}
      <motion.div
        className={`absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 blur-2xl ${currentExpression.glow}`}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Character Container */}
      <motion.div
        className={`relative w-full h-full rounded-full ${darkMode ? 'bg-slate-800' : 'bg-white'} shadow-2xl overflow-hidden`}
        style={{
          background: darkMode 
            ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
            : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        }}
        animate={{
          y: [0, -8, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Inner Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 via-purple-100/50 to-pink-100/50 dark:from-blue-900/30 dark:via-purple-900/30 dark:to-pink-900/30" />

        {/* Face SVG */}
        <svg 
          viewBox="0 0 80 90" 
          className="absolute inset-0 w-full h-full p-4"
          style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}
        >
          {/* Eyes */}
          <motion.path
            d={currentExpression.eyes}
            fill="none"
            stroke={darkMode ? '#e2e8f0' : '#475569'}
            strokeWidth="3"
            strokeLinecap="round"
            animate={isListening ? {
              d: [
                currentExpression.eyes,
                'M 35 46 Q 40 46 45 46',
                currentExpression.eyes,
              ],
            } : {}}
            transition={{
              duration: 2,
              repeat: isListening ? Infinity : 0,
            }}
          />

          {/* Second Eye */}
          <motion.path
            d={currentExpression.eyes}
            fill="none"
            stroke={darkMode ? '#e2e8f0' : '#475569'}
            strokeWidth="3"
            strokeLinecap="round"
            transform="translate(20, 0)"
            animate={isListening ? {
              d: [
                currentExpression.eyes,
                'M 35 46 Q 40 46 45 46',
                currentExpression.eyes,
              ],
            } : {}}
            transition={{
              duration: 2,
              repeat: isListening ? Infinity : 0,
            }}
          />

          {/* Mouth */}
          <motion.path
            d={currentExpression.mouth}
            fill="none"
            stroke={darkMode ? '#e2e8f0' : '#475569'}
            strokeWidth="3"
            strokeLinecap="round"
            animate={isSpeaking ? {
              d: [
                currentExpression.mouth,
                'M 35 65 Q 40 70 45 65',
                currentExpression.mouth,
                'M 35 63 Q 40 68 45 63',
                currentExpression.mouth,
              ],
            } : {}}
            transition={{
              duration: 0.3,
              repeat: isSpeaking ? Infinity : 0,
            }}
          />

          {/* Blush - Left */}
          <ellipse 
            cx="25" 
            cy="55" 
            rx="6" 
            ry="4" 
            fill="#f472b6" 
            className={`${currentExpression.blush} transition-opacity duration-500`}
          />
          
          {/* Blush - Right */}
          <ellipse 
            cx="75" 
            cy="55" 
            rx="6" 
            ry="4" 
            fill="#f472b6" 
            className={`${currentExpression.blush} transition-opacity duration-500`}
          />
        </svg>

        {/* Listening Waveform */}
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-end gap-1"
            >
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-gradient-to-t from-blue-400 to-purple-400 rounded-full"
                  animate={{
                    height: [8, 24, 8],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.1,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Speaking Indicator */}
        <AnimatePresence>
          {isSpeaking && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center"
            >
              <motion.div
                className="w-2 h-2 bg-white rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-gradient-to-br from-blue-300 to-purple-300"
            style={{
              left: `${20 + i * 12}%`,
              top: `${30 + (i % 3) * 15}%`,
            }}
            animate={{
              y: [-10, -30, -10],
              opacity: [0.3, 0.8, 0.3],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

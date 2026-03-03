import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Smile, 
  Meh, 
  Frown, 
  Angry, 
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  Brain,
  Sparkles,
  Zap,
  Loader2
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const emotionEmojis = {
  joy: { icon: Smile, color: 'text-amber-500', bg: 'bg-gradient-to-br from-amber-100 to-amber-200', darkBg: 'bg-gradient-to-br from-amber-500/20 to-amber-600/20', label: 'Happy' },
  neutral: { icon: Meh, color: 'text-slate-500', bg: 'bg-gradient-to-br from-slate-100 to-slate-200', darkBg: 'bg-gradient-to-br from-slate-500/20 to-slate-600/20', label: 'Neutral' },
  sadness: { icon: Frown, color: 'text-blue-500', bg: 'bg-gradient-to-br from-blue-100 to-blue-200', darkBg: 'bg-gradient-to-br from-blue-500/20 to-blue-600/20', label: 'Sad' },
  anger: { icon: Angry, color: 'text-rose-500', bg: 'bg-gradient-to-br from-rose-100 to-rose-200', darkBg: 'bg-gradient-to-br from-rose-500/20 to-rose-600/20', label: 'Angry' },
  fear: { icon: AlertCircle, color: 'text-purple-500', bg: 'bg-gradient-to-br from-purple-100 to-purple-200', darkBg: 'bg-gradient-to-br from-purple-500/20 to-purple-600/20', label: 'Anxious' },
  disgust: { icon: AlertCircle, color: 'text-green-500', bg: 'bg-gradient-to-br from-green-100 to-green-200', darkBg: 'bg-gradient-to-br from-green-500/20 to-green-600/20', label: 'Disgusted' },
  surprise: { icon: Zap, color: 'text-orange-500', bg: 'bg-gradient-to-br from-orange-100 to-orange-200', darkBg: 'bg-gradient-to-br from-orange-500/20 to-orange-600/20', label: 'Surprised' },
};

export default function Dashboard() {
  const { darkMode } = useTheme();
  const [currentMood, setCurrentMood] = useState({ emotion: 'neutral', intensity: 50, trend: 'up' });
  const [greeting, setGreeting] = useState('');
  const [moodData, setMoodData] = useState([]);
  const [metrics, setMetrics] = useState({
    totalInteractions: 0,
    completedInteractions: 0,
    avgReward: null,
    moodImprovementPct: null,
    currentEpsilon: 1.0,
  });
  const [userHistory, setUserHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId] = useState(() => localStorage.getItem('mindai_user_id') || `user_${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    localStorage.setItem('mindai_user_id', userId);
  }, [userId]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Fetch user history and metrics
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch user history
        const historyRes = await fetch(`${API_BASE_URL}/user/${userId}/history?limit=50`);
        if (historyRes.ok) {
          const historyData = await historyRes.json();
          setUserHistory(historyData.interactions || []);
          
          // Process mood data for chart
          if (historyData.interactions && historyData.interactions.length > 0) {
            const processedData = historyData.interactions
              .slice(-7) // Last 7 interactions
              .map((interaction, index) => ({
                date: new Date(interaction.timestamp).toLocaleDateString('en-US', { weekday: 'short' }),
                mood: interaction.old_mood ? Math.round(interaction.old_mood * 100) : 50,
                reward: interaction.reward,
              }));
            setMoodData(processedData);

            // Set current mood from most recent interaction
            const latest = historyData.interactions[historyData.interactions.length - 1];
            if (latest) {
              const recentRewards = historyData.interactions
                .slice(-5)
                .filter(i => i.reward !== null)
                .map(i => i.reward);
              const avgRecentReward = recentRewards.length > 0 
                ? recentRewards.reduce((a, b) => a + b, 0) / recentRewards.length 
                : 0;
              
              setCurrentMood({
                emotion: latest.action_category === 'calm_music' ? 'neutral' : 
                        latest.action_category === 'funny_clip' ? 'joy' : 'neutral',
                intensity: latest.old_mood ? Math.round(latest.old_mood * 100) : 50,
                trend: avgRecentReward >= 0 ? 'up' : 'down',
              });
            }
          }
        }

        // Fetch global metrics
        const metricsRes = await fetch(`${API_BASE_URL}/metrics`);
        if (metricsRes.ok) {
          const metricsData = await metricsRes.json();
          setMetrics({
            totalInteractions: metricsData.total_interactions || 0,
            completedInteractions: metricsData.completed_interactions || 0,
            avgReward: metricsData.avg_reward,
            moodImprovementPct: metricsData.mood_improvement_pct,
            currentEpsilon: metricsData.current_epsilon || 1.0,
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const EmotionIcon = emotionEmojis[currentMood.emotion]?.icon || Meh;
  const TrendIcon = currentMood.trend === 'up' ? TrendingUp : TrendingDown;
  const trendColor = currentMood.trend === 'up' ? 'text-green-500' : 'text-rose-500';
  const trendText = currentMood.trend === 'up' ? 'Improving' : 'Declining';

  // Calculate AI confidence based on epsilon (lower epsilon = higher confidence)
  const aiConfidence = Math.round((1 - metrics.currentEpsilon) * 100);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          <p className={`text-lg ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Loading your dashboard...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div>
          <motion.h1 
            className={`text-4xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {greeting}, <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Alan</span> 👋
          </motion.h1>
          <motion.p 
            className={`mt-2 text-lg ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            How are you feeling today?
          </motion.p>
        </div>
        <motion.div 
          className="flex gap-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          {Object.entries(emotionEmojis).map(([key, { icon: Icon, color, bg, darkBg }]) => (
            <motion.button
              key={key}
              whileHover={{ scale: 1.15, y: -4 }}
              whileTap={{ scale: 0.9 }}
              className={`w-14 h-14 rounded-2xl ${darkMode ? darkBg : bg} flex items-center justify-center transition-all duration-300 shadow-lg ${
                currentMood.emotion === key 
                  ? 'ring-3 ring-blue-400 ring-offset-2 shadow-blue-500/30 scale-110' 
                  : 'opacity-60 hover:opacity-100 hover:shadow-xl'
              }`}
              onClick={() => setCurrentMood({ ...currentMood, emotion: key })}
            >
              <Icon className={`w-7 h-7 ${color}`} />
            </motion.button>
          ))}
        </motion.div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Current Mood Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className={`group p-7 rounded-3xl ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} border shadow-lg`}
        >
          <div className="flex items-center justify-between mb-5">
            <div className={`p-4 rounded-2xl ${darkMode ? emotionEmojis[currentMood.emotion]?.darkBg : emotionEmojis[currentMood.emotion]?.bg} shadow-lg transition-all duration-300 group-hover:scale-110`}>
              <EmotionIcon className={`w-7 h-7 ${emotionEmojis[currentMood.emotion]?.color}`} />
            </div>
            <span className={`text-sm font-semibold px-4 py-1.5 rounded-full ${
              darkMode ? 'bg-slate-700/80 text-slate-300 border border-slate-600' : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}>
              Today
            </span>
          </div>
          <h3 className={`text-base font-medium uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Current Mood
          </h3>
          <p className={`text-4xl font-bold mt-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            {emotionEmojis[currentMood.emotion]?.label}
          </p>
          <div className="mt-5 flex items-center gap-3">
            <div className={`flex-1 h-3 rounded-full overflow-hidden ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
              <motion.div 
                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                initial={{ width: 0 }}
                animate={{ width: `${currentMood.intensity}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <span className={`text-sm font-bold ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              {currentMood.intensity}%
            </span>
          </div>
        </motion.div>

        {/* Trend Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className={`group p-7 rounded-3xl ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} border shadow-lg`}
        >
          <div className="flex items-center justify-between mb-5">
            <div className={`p-4 rounded-2xl ${currentMood.trend === 'up' 
              ? (darkMode ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20' : 'bg-gradient-to-br from-green-100 to-emerald-100')
              : (darkMode ? 'bg-gradient-to-br from-rose-500/20 to-pink-500/20' : 'bg-gradient-to-br from-rose-100 to-pink-100')
            } shadow-lg transition-all duration-300 group-hover:scale-110`}>
              <TrendIcon className={`w-7 h-7 ${trendColor}`} />
            </div>
            <span className={`text-sm font-semibold px-4 py-1.5 rounded-full ${
              darkMode ? 'bg-slate-700/80 text-slate-300 border border-slate-600' : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}>
              7 days
            </span>
          </div>
          <h3 className={`text-base font-medium uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Mood Trend
          </h3>
          <p className={`text-4xl font-bold mt-2 ${trendColor}`}>
            {trendText}
          </p>
          <p className={`mt-3 text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Your mood has been {currentMood.trend === 'up' ? 'improving' : 'declining'} over the past week
          </p>
        </motion.div>

        {/* AI Status Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className={`group p-7 rounded-3xl ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} border shadow-lg`}
        >
          <div className="flex items-center justify-between mb-5">
            <div className={`p-4 rounded-2xl ${darkMode 
              ? 'bg-gradient-to-br from-purple-500/20 to-blue-500/20' 
              : 'bg-gradient-to-br from-purple-100 to-blue-100'
            } shadow-lg transition-all duration-300 group-hover:scale-110`}>
              <Brain className={`w-7 h-7 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-semibold text-green-500">Active</span>
            </div>
          </div>
          <h3 className={`text-base font-medium uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            AI Learning
          </h3>
          <p className={`text-4xl font-bold mt-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            {aiConfidence}%
          </p>
          <p className={`mt-3 text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Confidence in personalization (ε={metrics.currentEpsilon.toFixed(3)})
          </p>
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex justify-between text-sm">
              <span className={darkMode ? 'text-slate-500' : 'text-slate-500'}>Total Interactions</span>
              <span className={`font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                {metrics.totalInteractions}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-2">
              <span className={darkMode ? 'text-slate-500' : 'text-slate-500'}>Completed</span>
              <span className={`font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                {metrics.completedInteractions}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Mood Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-8"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${darkMode ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20' : 'bg-gradient-to-br from-blue-100 to-cyan-100'} shadow-lg`}>
              <Activity className={`w-7 h-7 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div>
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                Mood History
              </h3>
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Your emotional journey over time
              </p>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${darkMode ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span className={`text-sm font-semibold ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
              Powered by ML
            </span>
          </div>
        </div>
        
        <div className="h-72 min-w-0">
          {moodData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={200}>
              <AreaChart data={moodData}>
                <defs>
                  <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
                <XAxis 
                  dataKey="date" 
                  stroke={darkMode ? '#64748b' : '#94a3b8'}
                  tick={{ fill: darkMode ? '#64748b' : '#94a3b8' }}
                />
                <YAxis 
                  stroke={darkMode ? '#64748b' : '#94a3b8'}
                  tick={{ fill: darkMode ? '#64748b' : '#94a3b8' }}
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                    border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  labelStyle={{ color: darkMode ? '#f1f5f9' : '#1e293b' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="mood" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fill="url(#moodGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Activity className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-slate-600' : 'text-slate-300'}`} />
                <p className={`text-sm ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  No mood data yet.<br />Start chatting to track your mood!
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

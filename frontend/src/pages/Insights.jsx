import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  TrendingUp, 
  Zap, 
  Target,
  Award,
  BarChart3,
  Sparkles,
  Lightbulb,
  Loader2
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const categoryColors = {
  motivational_speech: '#fbbf24',
  calm_music: '#60a5fa',
  funny_clip: '#f472b6',
  breathing_exercise: '#2dd4bf',
  inspirational_scene: '#a78bfa',
  workout_suggestion: '#4ade80',
};

const emotionColors = {
  joy: '#fbbf24',
  sadness: '#60a5fa',
  neutral: '#9ca3af',
  fear: '#a78bfa',
  anger: '#f87171',
  disgust: '#4ade80',
  surprise: '#fb923c',
};

export default function Insights() {
  const { darkMode } = useTheme();
  const [metrics, setMetrics] = useState({
    totalInteractions: 0,
    completedInteractions: 0,
    avgReward: null,
    moodImprovementPct: null,
    currentEpsilon: 1.0,
    actionDistribution: {},
  });
  const [userHistory, setUserHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId] = useState(() => localStorage.getItem('mindai_user_id') || `user_${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    localStorage.setItem('mindai_user_id', userId);
  }, [userId]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
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
            actionDistribution: metricsData.action_distribution || {},
          });
        }

        // Fetch user history
        const historyRes = await fetch(`${API_BASE_URL}/user/${userId}/history?limit=100`);
        if (historyRes.ok) {
          const historyData = await historyRes.json();
          setUserHistory(historyData.interactions || []);
        }
      } catch (error) {
        console.error('Error fetching insights data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  // Process data for charts
  const effectivenessData = Object.entries(metrics.actionDistribution).map(([category, count]) => {
    // Calculate average reward for this category from user history
    const categoryInteractions = userHistory.filter(i => i.action_category === category && i.reward !== null);
    const avgReward = categoryInteractions.length > 0
      ? categoryInteractions.reduce((sum, i) => sum + i.reward, 0) / categoryInteractions.length
      : 0;
    
    return {
      category: category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      improvement: Math.round((avgReward + 1) * 50), // Convert -1..1 to 0..100
      count,
    };
  }).filter(d => d.count > 0);

  // Emotion distribution from user history
  const emotionCounts = {};
  userHistory.forEach(interaction => {
    // Map action categories to emotions for visualization
    const emotionMap = {
      motivational_speech: 'joy',
      calm_music: 'neutral',
      funny_clip: 'joy',
      breathing_exercise: 'neutral',
      inspirational_scene: 'joy',
      workout_suggestion: 'joy',
    };
    const emotion = emotionMap[interaction.action_category] || 'neutral';
    emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
  });
  
  const emotionDistribution = Object.entries(emotionCounts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    color: emotionColors[name] || '#9ca3af',
  }));

  // Radar data based on actual metrics
  const radarData = [
    { subject: 'Joy', A: emotionCounts.joy ? Math.min(100, emotionCounts.joy * 10) : 50, fullMark: 100 },
    { subject: 'Calm', A: emotionCounts.neutral ? Math.min(100, emotionCounts.neutral * 10) : 50, fullMark: 100 },
    { subject: 'Energy', A: metrics.actionDistribution.workout_suggestion ? Math.min(100, metrics.actionDistribution.workout_suggestion * 5) : 30, fullMark: 100 },
    { subject: 'Focus', A: metrics.moodImprovementPct || 50, fullMark: 100 },
    { subject: 'Social', A: metrics.completedInteractions > 0 ? Math.min(100, metrics.completedInteractions * 2) : 40, fullMark: 100 },
    { subject: 'Growth', A: Math.round((1 - metrics.currentEpsilon) * 100), fullMark: 100 },
  ];

  // Stats based on real data
  const aiConfidence = Math.round((1 - metrics.currentEpsilon) * 100);
  const stats = [
    { 
      label: 'Total Interactions', 
      value: metrics.totalInteractions.toString(), 
      icon: BarChart3, 
      change: metrics.totalInteractions > 10 ? '+Active' : 'New' 
    },
    { 
      label: 'AI Confidence', 
      value: `${aiConfidence}%`, 
      icon: Brain, 
      change: aiConfidence > 50 ? 'Learning' : 'Exploring' 
    },
    { 
      label: 'Mood Improvement', 
      value: metrics.moodImprovementPct ? `${Math.round(metrics.moodImprovementPct)}%` : 'N/A', 
      icon: TrendingUp, 
      change: metrics.avgReward && metrics.avgReward > 0 ? 'Positive' : 'Building' 
    },
    { 
      label: 'Learning Rate', 
      value: metrics.currentEpsilon.toFixed(2), 
      icon: Zap, 
      change: metrics.currentEpsilon < 0.5 ? 'Refining' : 'Exploring' 
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
          <p className={`text-lg ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Loading insights...
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
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            Personalization Insights
          </h1>
          <p className={`mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            See how AI adapts to your unique needs
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
            RL Agent Active
          </span>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`p-5 rounded-2xl ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} border shadow-lg`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-xl ${darkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                <stat.icon className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                stat.change.startsWith('+') 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {stat.change}
              </span>
            </div>
            <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              {stat.value}
            </p>
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* What Works Best */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`p-6 rounded-3xl ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} border shadow-lg`}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-2xl ${darkMode ? 'bg-green-500/20' : 'bg-green-100'}`}>
              <Target className={`w-6 h-6 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                What Works Best For You
              </h3>
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Content effectiveness based on your feedback
              </p>
            </div>
          </div>

          <div className="h-64 min-w-0">
            {effectivenessData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={250} minHeight={200}>
                <BarChart data={effectivenessData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} horizontal={false} />
                  <XAxis 
                    type="number" 
                    stroke={darkMode ? '#64748b' : '#94a3b8'}
                    tick={{ fill: darkMode ? '#64748b' : '#94a3b8' }}
                    domain={[0, 100]}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="category" 
                    stroke={darkMode ? '#64748b' : '#94a3b8'}
                    tick={{ fill: darkMode ? '#64748b' : '#94a3b8', fontSize: 12 }}
                    width={120}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                      border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
                      borderRadius: '12px',
                    }}
                    formatter={(value) => [`${value}% improvement`, 'Effectiveness']}
                  />
                  <Bar 
                    dataKey="improvement" 
                    fill="url(#effectivenessGradient)" 
                    radius={[0, 8, 8, 0]}
                  />
                  <defs>
                    <linearGradient id="effectivenessGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#22c55e" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Target className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-slate-600' : 'text-slate-300'}`} />
                  <p className={`text-sm ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    No data yet.<br />Interact with the AI to see what works best!
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Emotion Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`p-6 rounded-3xl ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} border shadow-lg`}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-2xl ${darkMode ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
              <Award className={`w-6 h-6 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                Emotion Distribution
              </h3>
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Your emotional patterns over time
              </p>
            </div>
          </div>

          <div className="h-64 flex items-center min-w-0">
            {emotionDistribution.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%" minWidth={250} minHeight={200}>
                  <PieChart>
                    <Pie
                      data={emotionDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {emotionDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                        border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
                        borderRadius: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Legend */}
                <div className="flex flex-col gap-2 ml-4">
                  {emotionDistribution.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        {item.name} ({item.value})
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center w-full h-full">
                <div className="text-center">
                  <Award className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-slate-600' : 'text-slate-300'}`} />
                  <p className={`text-sm ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                    No emotion data yet.<br />Start chatting to track your emotions!
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Wellness Radar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`p-6 rounded-3xl ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} border shadow-lg lg:col-span-2`}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-2xl ${darkMode ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
              <Lightbulb className={`w-6 h-6 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                Wellness Profile
              </h3>
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Multi-dimensional view of your mental wellbeing
              </p>
            </div>
          </div>

          <div className="h-72 min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={250}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke={darkMode ? '#334155' : '#e2e8f0'} />
                <PolarAngleAxis 
                  dataKey="subject" 
                  tick={{ fill: darkMode ? '#94a3b8' : '#64748b', fontSize: 12 }}
                />
                <PolarRadiusAxis 
                  angle={30} 
                  domain={[0, 100]} 
                  tick={{ fill: darkMode ? '#64748b' : '#94a3b8', fontSize: 10 }}
                />
                <Radar
                  name="Current"
                  dataKey="A"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fill="#8b5cf6"
                  fillOpacity={0.3}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                    border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
                    borderRadius: '12px',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* AI Learning Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className={`p-6 rounded-3xl ${darkMode ? 'bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-blue-700/30' : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200'} border`}
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              AI Learning Status
            </h3>
            <p className={`mt-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              {metrics.totalInteractions > 0 ? (
                <>
                  Your personal AI agent has learned from <strong>{metrics.totalInteractions} interactions</strong> and is 
                  continuously improving its recommendations based on your feedback.
                  {metrics.completedInteractions > 0 && (
                    <> {metrics.completedInteractions} interactions have been completed with feedback.</>
                  )}
                </>
              ) : (
                <>Start chatting to help your AI agent learn your preferences and improve recommendations.</>
              )}
            </p>
          </div>
          <div className="text-right hidden md:block">
            <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              {aiConfidence}%
            </p>
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {metrics.currentEpsilon > 0.5 ? 'Exploring' : 'Exploiting'}
            </p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Exploration (Random)</span>
            <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Exploitation (Learned)</span>
          </div>
          <div className={`h-3 rounded-full ${darkMode ? 'bg-slate-700' : 'bg-slate-200'} overflow-hidden`}>
            <motion.div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${aiConfidence}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <p className={`text-xs mt-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
            Epsilon (ε) = {metrics.currentEpsilon.toFixed(4)} — {metrics.currentEpsilon > 0.5 
              ? 'Currently exploring different content types to learn what works best' 
              : 'Using learned preferences to provide personalized recommendations'}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

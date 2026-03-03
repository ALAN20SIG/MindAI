import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Mic, 
  MicOff, 
  Sparkles,
  Smile,
  Frown,
  Angry,
  AlertCircle,
  Meh,
  Zap,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  Play,
  Music,
  Video,
  Heart
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const API_BASE_URL = 'http://localhost:8000/api/v1';

// Enhanced conversational response system with context awareness and NLU patterns

// Intent detection patterns for better NLU
const intentPatterns = {
  greeting: /\b(hi|hello|hey|good morning|good afternoon|good evening|what's up|howdy)\b/i,
  gratitude: /\b(thank|thanks|appreciate|grateful)\b/i,
  farewell: /\b(bye|goodbye|see you|talk later|gtg|gotta go)\b/i,
  help: /\b(help|support|assist|what can you do)\b/i,
  negativeSelf: /\b(hate myself|worthless|failure|stupid|ugly|no one cares|better off dead)\b/i,
  crisis: /\b(kill myself|suicide|end it all|hurt myself|self.?harm|don't want to live)\b/i,
};

// Enhanced conversational response templates with context awareness
const conversationalResponses = {
  joy: {
    acknowledgments: [
      "That's wonderful to hear! I'm so glad you're feeling positive right now. ✨",
      "Your happiness is contagious! Tell me more about what's making you feel this way.",
      "I love hearing that you're doing well! What's been the highlight of your day?",
      "That's amazing! It's important to celebrate these good moments.",
    ],
    followUps: [
      "What's contributing to this good feeling?",
      "How can we keep this positive momentum going?",
      "Is there something specific you'd like to share about your day?",
      "What are you looking forward to next?",
    ],
    deepening: [
      "That sounds really meaningful. How long have you been feeling this way?",
      "I can tell this matters to you. What makes this so special?",
      "It's beautiful that you're experiencing this. How are you celebrating?",
    ],
  },
  sadness: {
    acknowledgments: [
      "I'm really sorry you're feeling this way. It's completely okay to not be okay sometimes. 💙",
      "That sounds really difficult. Thank you for trusting me with how you're feeling.",
      "I hear you, and I want you to know that your feelings are valid. It's okay to feel sad.",
      "It takes courage to share when you're feeling down. I'm here with you.",
    ],
    followUps: [
      "Would you like to talk more about what's weighing on you?",
      "Is there something specific that's been bothering you lately?",
      "What do you think might help you feel a bit better right now?",
      "I'm here to listen. What's on your mind?",
      "How long have you been feeling like this?",
    ],
    deepening: [
      "That sounds really heavy. Do you want to tell me more about what happened?",
      "I can hear the pain in your words. What's the hardest part of this for you?",
      "Sometimes talking about it helps. What's been the biggest challenge lately?",
    ],
  },
  anger: {
    acknowledgments: [
      "I can sense your frustration. It's completely natural to feel angry sometimes. 🌊",
      "That sounds really upsetting. Your anger is valid and understandable.",
      "I hear the frustration in your words. It's okay to feel this way.",
      "Sometimes things just aren't fair, and anger is a natural response.",
    ],
    followUps: [
      "What's been triggering these feelings?",
      "Would it help to talk through what's bothering you?",
      "What would help you feel more at peace right now?",
      "How can I support you through this?",
    ],
    deepening: [
      "That sounds really frustrating. What happened to make you feel this way?",
      "I can tell this really matters to you. What's at the core of this feeling?",
      "Anger often masks other feelings. What else are you experiencing?",
    ],
  },
  fear: {
    acknowledgments: [
      "I can hear the anxiety in your message. It's okay to feel worried sometimes. 🌸",
      "That sounds really unsettling. Your concerns are valid.",
      "Anxiety can be overwhelming. Thank you for sharing this with me.",
      "I understand that you're feeling anxious. Let's work through this together.",
    ],
    followUps: [
      "What's making you feel anxious right now?",
      "Would it help to talk through your worries?",
      "What usually helps you feel calmer?",
      "Is there something specific you're worried about?",
    ],
    deepening: [
      "Anxiety can be really tough. What's the biggest worry on your mind?",
      "I hear you. What does this anxiety feel like for you?",
      "Sometimes naming our fears helps. What are you most afraid of right now?",
    ],
  },
  neutral: {
    acknowledgments: [
      "Thanks for checking in. How are you really doing today? 🤍",
      "I appreciate you sharing. Is there anything on your mind?",
      "Sometimes neutral is okay too. How has your day been?",
      "I'm here to chat whenever you need. What's going on?",
    ],
    followUps: [
      "Is there anything you'd like to talk about?",
      "How can I support you today?",
      "What's been on your mind lately?",
      "Anything interesting happening in your life?",
    ],
    deepening: [
      "Tell me more about your day. What stood out?",
      "Sometimes we feel neutral when we're processing things. What's going on beneath the surface?",
      "I'm curious - what's taking up most of your mental space lately?",
    ],
  },
  disgust: {
    acknowledgments: [
      "That sounds really unpleasant. It's understandable to feel this way. 🤢",
      "I can sense your discomfort. Some things just don't sit right with us.",
      "It's okay to have strong reactions to things. Your feelings are valid.",
    ],
    followUps: [
      "What's been bothering you?",
      "Would you like to talk about what triggered this feeling?",
      "How can I help you process this?",
    ],
    deepening: [
      "That sounds really uncomfortable. What exactly happened?",
      "I can tell this really affected you. What was the worst part?",
    ],
  },
  surprise: {
    acknowledgments: [
      "Wow, that sounds unexpected! How are you processing this? 😮",
      "Life can really throw us curveballs sometimes. How are you handling it?",
      "That sounds like quite a shock! I'm here to help you process it.",
    ],
    followUps: [
      "How are you feeling about this unexpected situation?",
      "What do you think you'll do next?",
      "Is this a good surprise or a challenging one?",
    ],
    deepening: [
      "Unexpected events can be a lot to process. What's your gut reaction?",
      "How is this surprise affecting your plans or feelings?",
    ],
  },
};

// Context-aware response selection
const contextResponses = {
  firstMessage: [
    "Hi there! I'm really glad you reached out. How are you feeling today?",
    "Hello! I'm here to listen. What's on your mind?",
    "Hey! I'm MindAI, and I'm here to support you. How's your day going?",
  ],
  returningUser: [
    "Welcome back! I've been thinking about our last conversation. How have you been since then?",
    "It's good to hear from you again! How are things going?",
    "Hey! I'm glad you're back. Last time we talked about some important things. How are you feeling now?",
  ],
  crisis: [
    "I'm really concerned about what you're sharing. Your life matters, and there are people who want to help. Please reach out to the 988 Suicide & Crisis Lifeline (call or text 988) or go to your nearest emergency room. You're not alone. 🆘",
    "What you're describing sounds really serious, and I want you to be safe. Please contact the 988 Suicide & Crisis Lifeline at 988, or call emergency services. People care about you and want to help. 🆘",
  ],
  negativeSelf: [
    "I hear you being really hard on yourself, and I want you to know that those thoughts aren't the truth. You deserve kindness, especially from yourself. 💙",
    "Those are really painful thoughts. Please remember that you have worth and value, even when it doesn't feel that way. Would you like to talk about what's making you feel this way?",
  ],
  gratitude: [
    "You're so welcome! It means a lot to me that you'd say that. 😊",
    "I'm really glad I could be here for you. Thank you for sharing this moment with me.",
    "That means a lot! I'm here whenever you need to talk.",
  ],
  greeting: [
    "Hey there! How are you doing today?",
    "Hi! I'm here and ready to chat. What's on your mind?",
    "Hello! How can I support you today?",
  ],
  farewell: [
    "Take care! I'm here whenever you need to talk. 💙",
    "Goodbye for now. Remember, you're stronger than you know. See you soon!",
    "Take care of yourself. I'll be here when you come back!",
  ],
};

const generalFollowUps = [
  "How else are you feeling?",
  "Is there anything else on your mind?",
  "What would be most helpful for you right now?",
  "I'm here to listen. What else would you like to share?",
  "Tell me more about that.",
  "What does that feel like for you?",
];

// Enhanced context tracking
const createConversationContext = () => ({
  messageCount: 0,
  lastEmotion: null,
  emotionHistory: [],
  topicsDiscussed: [],
  hasSharedFeelings: false,
  recommendationOffered: false,
  lastRecommendationTime: null,
  conversationDepth: 0,  // 0=superficial, 1=sharing, 2=deepening, 3=vulnerable
  userName: null,
  crisisFlag: false,
});

const emotionConfig = {
  joy: { icon: Smile, color: 'text-amber-500', bg: 'bg-gradient-to-br from-amber-100 to-amber-200', darkBg: 'bg-gradient-to-br from-amber-500/20 to-amber-600/20', label: 'Happy' },
  sadness: { icon: Frown, color: 'text-blue-500', bg: 'bg-gradient-to-br from-blue-100 to-blue-200', darkBg: 'bg-gradient-to-br from-blue-500/20 to-blue-600/20', label: 'Sad' },
  anger: { icon: Angry, color: 'text-rose-500', bg: 'bg-gradient-to-br from-rose-100 to-rose-200', darkBg: 'bg-gradient-to-br from-rose-500/20 to-rose-600/20', label: 'Angry' },
  fear: { icon: AlertCircle, color: 'text-purple-500', bg: 'bg-gradient-to-br from-purple-100 to-purple-200', darkBg: 'bg-gradient-to-br from-purple-500/20 to-purple-600/20', label: 'Anxious' },
  neutral: { icon: Meh, color: 'text-slate-500', bg: 'bg-gradient-to-br from-slate-100 to-slate-200', darkBg: 'bg-gradient-to-br from-slate-500/20 to-slate-600/20', label: 'Neutral' },
  disgust: { icon: AlertCircle, color: 'text-green-500', bg: 'bg-gradient-to-br from-green-100 to-green-200', darkBg: 'bg-gradient-to-br from-green-500/20 to-green-600/20', label: 'Disgusted' },
  surprise: { icon: Zap, color: 'text-orange-500', bg: 'bg-gradient-to-br from-orange-100 to-orange-200', darkBg: 'bg-gradient-to-br from-orange-500/20 to-orange-600/20', label: 'Surprised' },
};

const categoryConfig = {
  motivational_speech: { icon: Zap, label: 'Motivational Speech', color: 'text-amber-500' },
  calm_music: { icon: Music, label: 'Calming Music', color: 'text-blue-500' },
  funny_clip: { icon: Smile, label: 'Funny Clip', color: 'text-pink-500' },
  breathing_exercise: { icon: Heart, label: 'Breathing Exercise', color: 'text-teal-500' },
  inspirational_scene: { icon: Video, label: 'Inspirational Scene', color: 'text-purple-500' },
  workout_suggestion: { icon: Zap, label: 'Workout Suggestion', color: 'text-green-500' },
};

// Extract YouTube video ID from URL
const getYouTubeId = (url) => {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return match ? match[1] : null;
};

export default function Chat() {
  const { darkMode } = useTheme();
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      type: 'ai', 
      text: "Hi there! I'm MindAI, your mental health companion. I'm here to listen, chat, and support you. How are you feeling today?",
      timestamp: new Date(),
      isConversational: true,
    },
  ]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedEmotion, setDetectedEmotion] = useState(null);
  const [currentRecommendation, setCurrentRecommendation] = useState(null);
  const [conversationContext, setConversationContext] = useState(createConversationContext());
  const [userId] = useState(() => localStorage.getItem('mindai_user_id') || `user_${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchRecommendation = async (text) => {
    try {
      const response = await fetch(`${API_BASE_URL}/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, user_id: userId }),
      });
      
      if (!response.ok) throw new Error('Failed to get recommendation');
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching recommendation:', error);
      return null;
    }
  };

  const submitFeedback = async (interactionId, moodScore) => {
    try {
      const response = await fetch(`${API_BASE_URL}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          interaction_id: interactionId, 
          user_id: userId, 
          mood_score: moodScore 
        }),
      });
      
      if (!response.ok) throw new Error('Failed to submit feedback');
      
      return await response.json();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      return null;
    }
  };

  // Detect user intent from message
  const detectIntent = (text) => {
    for (const [intent, pattern] of Object.entries(intentPatterns)) {
      if (pattern.test(text)) {
        return intent;
      }
    }
    return null;
  };

  // Generate conversational response based on emotion and context
  const generateConversationalResponse = (emotionKey, context, userText) => {
    const intent = detectIntent(userText);
    
    // Handle crisis situations immediately
    if (intent === 'crisis' || context.crisisFlag) {
      return contextResponses.crisis[0];
    }
    
    // Handle negative self-talk
    if (intent === 'negativeSelf') {
      return contextResponses.negativeSelf[Math.floor(Math.random() * contextResponses.negativeSelf.length)];
    }
    
    // Handle gratitude
    if (intent === 'gratitude') {
      return contextResponses.gratitude[Math.floor(Math.random() * contextResponses.gratitude.length)];
    }
    
    // Handle greetings
    if (intent === 'greeting' && context.messageCount === 0) {
      return contextResponses.firstMessage[Math.floor(Math.random() * contextResponses.firstMessage.length)];
    }
    
    // Handle farewells
    if (intent === 'farewell') {
      return contextResponses.farewell[Math.floor(Math.random() * contextResponses.farewell.length)];
    }
    
    const responses = conversationalResponses[emotionKey] || conversationalResponses.neutral;
    
    // First message: warm greeting
    if (context.messageCount === 0) {
      return contextResponses.firstMessage[Math.floor(Math.random() * contextResponses.firstMessage.length)];
    }
    
    // Second message: acknowledgment + follow-up
    if (context.messageCount === 1) {
      const acknowledgment = responses.acknowledgments[Math.floor(Math.random() * responses.acknowledgments.length)];
      const followUp = responses.followUps[Math.floor(Math.random() * responses.followUps.length)];
      return `${acknowledgment} ${followUp}`;
    }
    
    // Deepening conversation (3-4 messages)
    if (context.messageCount >= 2 && context.messageCount < 4) {
      if (responses.deepening && Math.random() > 0.3) {
        return responses.deepening[Math.floor(Math.random() * responses.deepening.length)];
      }
      const followUp = responses.followUps[Math.floor(Math.random() * responses.followUps.length)];
      return followUp;
    }
    
    // After building rapport, offer content recommendation
    if (context.messageCount >= 4 && !context.recommendationOffered) {
      const acknowledgment = responses.acknowledgments[Math.floor(Math.random() * responses.acknowledgments.length)];
      return {
        text: `${acknowledgment} I've really appreciated our conversation, and I have something that might resonate with you right now:`,
        offerRecommendation: true,
      };
    }
    
    // Continue conversation with variety
    const responseTypes = [...responses.followUps, ...generalFollowUps];
    return responseTypes[Math.floor(Math.random() * responseTypes.length)];
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: input,
      timestamp: new Date(),
      emotion: null,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsAnalyzing(true);

    // Get real recommendation from API
    const recommendation = await fetchRecommendation(userMessage.text);
    
    if (recommendation) {
      const emotion = recommendation.emotion;
      const emotionKey = emotion.dominant_emotion;
      const confidence = Math.round(emotion.intensity * 100);
      
      setDetectedEmotion({ emotion: emotionKey, confidence });
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, emotion: { emotion: emotionKey, confidence } }
            : msg
        )
      );

      setIsAnalyzing(false);
      
      // Update conversation context
      const newContext = {
        ...conversationContext,
        messageCount: conversationContext.messageCount + 1,
        lastEmotion: emotionKey,
        emotionHistory: [...conversationContext.emotionHistory, emotionKey],
        hasSharedFeelings: true,
        conversationDepth: Math.min(3, conversationContext.conversationDepth + 1),
      };
      setConversationContext(newContext);

      // Generate conversational response with user text for intent detection
      const response = generateConversationalResponse(emotionKey, newContext, userMessage.text);
      
      // Store recommendation for later if we decide to offer it
      setCurrentRecommendation({
        interactionId: recommendation.interaction_id,
        content: recommendation.recommended_content,
        emotion: emotionKey,
      });

      // Add AI response
      if (typeof response === 'object' && response.offerRecommendation) {
        // Offer recommendation after building rapport
        setConversationContext(prev => ({ ...prev, recommendationOffered: true }));
        const content = recommendation.recommended_content;
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          type: 'ai',
          text: response.text,
          recommendation: content,
          timestamp: new Date(),
          isConversational: true,
        }]);
      } else {
        // Just conversational response
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          type: 'ai',
          text: response,
          timestamp: new Date(),
          isConversational: true,
        }]);
      }
    } else {
      setIsAnalyzing(false);
      // Fallback conversational response
      const fallbackResponses = [
        "I'm here to listen. Tell me more about what's on your mind.",
        "Thank you for sharing that with me. How long have you been feeling this way?",
        "I appreciate you opening up. What do you think triggered these feelings?",
        "That sounds meaningful. Would you like to explore this further?",
      ];
      const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'ai',
        text: randomResponse,
        timestamp: new Date(),
        isConversational: true,
      }]);
    }
  };

  const handleFeedback = async (moodScore) => {
    if (!currentRecommendation) return;
    
    const result = await submitFeedback(currentRecommendation.interactionId, moodScore);
    
    if (result) {
      // More conversational feedback responses
      const positiveResponses = [
        "I'm so glad that resonated with you! It means a lot to hear that. What's on your mind now?",
        "That's wonderful to hear! I'm happy I could help. Would you like to keep chatting?",
        "Awesome! It's great knowing that helped. How are you feeling overall now?",
        "That makes me happy to hear! I'm here if you want to talk about anything else.",
      ];
      
      const neutralResponses = [
        "Thanks for letting me know. Everyone responds differently, and that's okay. What would feel helpful right now?",
        "I appreciate your honesty. Would you like to try something else or just talk?",
        "Noted. Sometimes it takes time to find what works. I'm here to listen if you want to share more.",
      ];
      
      const negativeResponses = [
        "I hear you, and I'm sorry that didn't hit the mark. Your feedback helps me learn. Want to talk about what might work better?",
        "Thanks for being honest - that really helps me understand you better. What do you think would be more helpful?",
        "I understand. Let me know what you'd prefer, or we can just chat if that's what you need right now.",
      ];
      
      let responseText;
      if (moodScore >= 4) {
        responseText = positiveResponses[Math.floor(Math.random() * positiveResponses.length)];
      } else if (moodScore === 3) {
        responseText = neutralResponses[Math.floor(Math.random() * neutralResponses.length)];
      } else {
        responseText = negativeResponses[Math.floor(Math.random() * negativeResponses.length)];
      }
      
      setMessages(prev => [...prev, {
        id: Date.now(),
        type: 'ai',
        text: responseText,
        timestamp: new Date(),
        isConversational: true,
      }]);
      setCurrentRecommendation(null);
      setConversationContext(prev => ({ ...prev, recommendationOffered: false }));
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Simulate voice recording
    if (!isRecording) {
      setTimeout(() => {
        setIsRecording(false);
        setInput("I'm feeling a bit overwhelmed today...");
      }, 3000);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            Chat with MindAI
          </h1>
          <p className={`mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            I'm here to listen, chat, and support you
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            AI Online
          </span>
        </div>
      </motion.div>

      {/* Chat Container */}
      <div className={`flex-1 rounded-3xl ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'} border shadow-lg overflow-hidden flex flex-col`}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] ${message.type === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
                  {/* Message Bubble */}
                  <div className={`px-5 py-3 rounded-2xl ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-br-md'
                      : darkMode 
                        ? 'bg-slate-700 text-slate-100 rounded-bl-md' 
                        : 'bg-slate-100 text-slate-800 rounded-bl-md'
                  }`}>
                    <p className="text-sm leading-relaxed">{message.text}</p>
                  </div>

                  {/* Emotion Tag (for user messages) */}
                  {message.type === 'user' && message.emotion && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                        darkMode ? emotionConfig[message.emotion.emotion]?.darkBg : emotionConfig[message.emotion.emotion]?.bg
                      }`}
                    >
                      {(() => {
                        const Icon = emotionConfig[message.emotion.emotion]?.icon;
                        return Icon ? <Icon className={`w-3.5 h-3.5 ${emotionConfig[message.emotion.emotion]?.color}`} /> : null;
                      })()}
                      <span className={emotionConfig[message.emotion.emotion]?.color}>
                        Detected: {emotionConfig[message.emotion.emotion]?.label} ({message.emotion.confidence}%)
                      </span>
                    </motion.div>
                  )}

                  {/* Content Recommendation Card */}
                  {message.type === 'ai' && message.recommendation && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`mt-3 p-4 rounded-2xl border ${
                        darkMode 
                          ? 'bg-slate-800 border-slate-600' 
                          : 'bg-white border-slate-200 shadow-lg'
                      }`}
                    >
                      {/* Category Badge */}
                      <div className="flex items-center gap-2 mb-3">
                        {(() => {
                          const config = categoryConfig[message.recommendation.category];
                          const Icon = config?.icon || Video;
                          return (
                            <>
                              <Icon className={`w-4 h-4 ${config?.color || 'text-blue-500'}`} />
                              <span className={`text-xs font-medium ${config?.color || 'text-blue-500'}`}>
                                {config?.label || message.recommendation.category}
                              </span>
                            </>
                          );
                        })()}
                      </div>

                      {/* Title & Description */}
                      <h3 className={`font-semibold mb-1 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                        {message.recommendation.title}
                      </h3>
                      <p className={`text-sm mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        {message.recommendation.description}
                      </p>

                      {/* YouTube Embed with Play Overlay */}
                      {message.recommendation.url && getYouTubeId(message.recommendation.url) && (
                        <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-3 bg-black group">
                          <iframe
                            src={`https://www.youtube.com/embed/${getYouTubeId(message.recommendation.url)}?autoplay=0&rel=0`}
                            title={message.recommendation.title}
                            className="absolute inset-0 w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 flex-wrap">
                        {message.recommendation.url && (
                          <a
                            href={message.recommendation.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                              darkMode
                                ? 'bg-blue-600 text-white hover:bg-blue-500'
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                            }`}
                          >
                            <Play className="w-4 h-4" />
                            Play on YouTube
                          </a>
                        )}
                        
                        {/* Breathing Exercise Button for text-only content */}
                        {!message.recommendation.url && message.recommendation.category === 'breathing_exercise' && (
                          <button
                            onClick={() => {
                              // Start breathing exercise
                              const breathingSteps = [
                                "Breathe in slowly... (4 seconds)",
                                "Hold... (7 seconds)", 
                                "Breathe out slowly... (8 seconds)",
                                "Repeat..."
                              ];
                              let step = 0;
                              const interval = setInterval(() => {
                                if (step < breathingSteps.length) {
                                  setMessages(prev => [...prev, {
                                    id: Date.now() + step,
                                    type: 'ai',
                                    text: breathingSteps[step],
                                    timestamp: new Date(),
                                    isConversational: true,
                                  }]);
                                  step++;
                                } else {
                                  clearInterval(interval);
                                }
                              }, 2000);
                            }}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                              darkMode
                                ? 'bg-teal-600 text-white hover:bg-teal-500'
                                : 'bg-teal-500 text-white hover:bg-teal-600'
                            }`}
                          >
                            <Heart className="w-4 h-4" />
                            Start Breathing Exercise
                          </button>
                        )}
                      </div>

                      {/* Text-only content indicator */}
                      {!message.recommendation.url && (
                        <div className={`p-3 rounded-xl ${darkMode ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
                          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            This is a guided exercise. Take your time and follow along at your own pace.
                          </p>
                        </div>
                      )}

                      {/* Feedback Section */}
                      {index === messages.length - 1 && currentRecommendation && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700"
                        >
                          <p className={`text-sm mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            Did this help improve your mood?
                          </p>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((score) => (
                              <motion.button
                                key={score}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleFeedback(score)}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-medium transition-all ${
                                  score <= 2
                                    ? 'bg-rose-100 text-rose-600 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-400'
                                    : score === 3
                                    ? 'bg-amber-100 text-amber-600 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400'
                                    : 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                                }`}
                              >
                                {score}
                              </motion.button>
                            ))}
                          </div>
                          <p className={`text-xs mt-2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                            1 = Not helpful, 5 = Very helpful
                          </p>
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {/* AI Thinking Indicator */}
                  {message.type === 'ai' && index === messages.length - 1 && isAnalyzing && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs ${
                        darkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Analyzing emotion...</span>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className={`p-5 border-t ${darkMode ? 'border-slate-700/50 bg-slate-800/30' : 'border-slate-200/50 bg-slate-50/50'}`}>
          <div className="flex items-center gap-3">
            {/* Voice Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleRecording}
              className={`p-3.5 rounded-2xl transition-all duration-300 shadow-lg ${
                isRecording 
                  ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white animate-pulse shadow-rose-500/30' 
                  : darkMode 
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600 shadow-slate-900/20' 
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 shadow-slate-200/50'
              }`}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </motion.button>

            {/* Text Input */}
            <div className="flex-1 relative">
              <input
                type="text"
                id="chat-message-input"
                name="chatMessageInput"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder={isRecording ? "Listening..." : "Type your message..."}
                disabled={isRecording}
                className={`w-full px-6 py-4 rounded-2xl text-base outline-none transition-all duration-300 shadow-inner ${
                  darkMode 
                    ? 'bg-slate-700/80 text-white placeholder-slate-400 focus:bg-slate-700 focus:ring-2 focus:ring-blue-500/50' 
                    : 'bg-white text-slate-800 placeholder-slate-400 border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20'
                }`}
              />
              {isAnalyzing && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                </div>
              )}
            </div>

            {/* Send Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleSend}
              disabled={!input.trim() || isAnalyzing}
              className={`p-4 rounded-2xl transition-all duration-300 shadow-lg ${
                input.trim() && !isAnalyzing
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40'
                  : darkMode 
                    ? 'bg-slate-700 text-slate-500' 
                    : 'bg-slate-200 text-slate-400'
              }`}
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Voice Waveform Animation */}
          <AnimatePresence>
            {isRecording && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-center gap-1 mt-3"
              >
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-rose-500 rounded-full"
                    animate={{
                      height: [10, Math.random() * 40 + 10, 10],
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                      delay: i * 0.05,
                    }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

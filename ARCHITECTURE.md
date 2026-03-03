# MindAI Architecture Documentation

## System Overview

MindAI is a full-stack mental health support application combining modern NLP, reinforcement learning, and responsive web technologies.

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │    Chat     │  │  Dashboard  │  │      Insights       │ │
│  │   (React)   │  │   (React)   │  │      (React)        │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
│         └─────────────────┴────────────────────┘            │
│                         │                                   │
│                    HTTP/WebSocket                           │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────┐
│                        Backend                              │
│                         │                                   │
│  ┌──────────────────────┴──────────────────────────────┐   │
│  │                    FastAPI                          │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │   │
│  │  │   Routes    │  │   Schemas   │  │   Config    │ │   │
│  │  └──────┬──────┘  └─────────────┘  └─────────────┘ │   │
│  └─────────┼───────────────────────────────────────────┘   │
│            │                                                │
│  ┌─────────┴─────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │ Emotion Detector  │  │  DQN Agent  │  │  Content    │   │
│  │  (DistilRoBERTa)  │  │   (PyTorch) │  │Recommender  │   │
│  └─────────┬─────────┘  └──────┬──────┘  └──────┬──────┘   │
│            │                   │                │          │
│  ┌─────────┴───────────────────┴────────────────┴──────┐   │
│  │                    Database (SQLite)                │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │   │
│  │  │    Users    │  │ Interactions│  │   Content   │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Backend Architecture

### 1. Emotion Detection System

**File**: `app/models/emotion_detector.py`

**Components:**
- **Model**: `j-hartmann/emotion-english-distilroberta-base` (fine-tuned for 7 emotions)
- **Caching**: LRU cache for recent detections (1000 entries)
- **Confidence Scoring**: Multi-level confidence based on probability and entropy
- **Mental Health Context**: Boosts sadness/fear detection for early intervention

**Algorithm:**
1. Text normalization and cache key generation
2. Cache lookup (if hit, return cached result)
3. BERT inference for emotion probabilities
4. Mental health context adjustments (boost critical emotions)
5. Confidence level computation (high/medium/low/uncertain)
6. Mental health score calculation (weighted negative emotions)
7. Result caching and return

**Performance:**
- Average inference time: ~45ms
- Cache hit rate: ~30% (typical conversation patterns)

### 2. DQN Agent System

**File**: `app/models/dqn_agent.py`

**Architecture**: Dueling Double DQN with Prioritized Experience Replay

**Components:**
- **Q-Network**: Dueling architecture separating value and advantage streams
- **Target Network**: Soft-updated for stable learning (tau=0.005)
- **Replay Buffer**: Prioritized sampling based on TD error
- **Reward Shaping**: Emotion-content match bonuses and mood improvement incentives

**Algorithm:**
1. **Action Selection** (Epsilon-greedy with emotion-aware exploration):
   - With probability ε: explore (70% chance to pick emotion-appropriate content)
   - Otherwise: exploit (select action with highest Q-value)

2. **Experience Storage**:
   - Store transition with maximum priority
   - Track reward history for performance monitoring

3. **Learning** (when buffer has enough samples):
   - Sample batch with importance sampling weights
   - Compute current Q-values
   - Compute target Q-values using Double DQN (policy selects, target evaluates)
   - Calculate weighted Huber loss
   - Apply gradient clipping (max_norm=10)
   - Update priorities based on TD errors
   - Soft-update target network

4. **Reward Shaping**:
   - Base reward: new_mood - old_mood
   - Mood improvement bonus: +0.2 for >0.3 improvement
   - Emotion-content match bonus: +0.15 for good matches
   - Penalty: -0.1 for mood deterioration

**Hyperparameters:**
- Learning rate: 1e-3 with StepLR decay
- Gamma (discount): 0.99
- Epsilon decay: 0.995
- Batch size: 64
- Target update frequency: 100 steps

### 3. Content Recommendation Engine

**File**: `app/content/recommender.py`

**Components:**
- **Emotion-Content Mapping**: Research-based effectiveness scores
- **Weighted Selection**: Probabilistic selection based on effectiveness
- **Diversity Tracking**: Prevents content repetition

**Algorithm:**
1. Get content items for selected category
2. Calculate weights for each item:
   - Base weight = emotion-content effectiveness score
   - Penalize recently used content (×0.3)
   - Boost multimedia content (×1.1)
3. Weighted random selection
4. Update usage history
5. Return content with effectiveness score

**Emotion-Content Effectiveness Matrix:**
```
          Motivational  Calm    Funny   Breathing  Inspirational  Workout
Sadness      0.85       0.70    0.75      0.65        0.80        0.60
Anger        0.65       0.90    0.70      0.85        0.60        0.80
Fear         0.80       0.85    0.65      0.90        0.75        0.60
Joy          0.75       0.60    0.90      0.50        0.80        0.85
Neutral      0.75       0.75    0.80      0.60        0.70        0.65
```

### 4. Conversational AI System

**File**: `frontend/src/pages/Chat.jsx`

**Components:**
- **Intent Detection**: Pattern matching for greetings, gratitude, crisis, etc.
- **Context Tracking**: messageCount, emotionHistory, conversationDepth
- **Response Generation**: Multi-stage conversation flow

**Conversation Flow:**
```
Message 0: Warm greeting + open-ended question
    ↓
Message 1: Emotion acknowledgment + follow-up question
    ↓
Message 2-3: Deepening questions to build rapport
    ↓
Message 4+: Content recommendation (if appropriate)
    ↓
Ongoing: General follow-ups to maintain conversation
```

**Intent Patterns:**
- Crisis: suicide, self-harm, "better off dead"
- Negative Self: "hate myself", "worthless", "failure"
- Gratitude: "thank", "thanks", "appreciate"
- Greeting: "hi", "hello", "hey"
- Farewell: "bye", "goodbye", "talk later"

### 5. Database Layer

**File**: `app/database/`

**Models:**
- **User**: user_id (primary), created_at
- **Interaction**: id, user_id, state_vector, action_taken, old_mood, new_mood, reward, timestamp
- **Content**: content_id, category, title, description, url

**Optimizations:**
- Raw SQL for aggregation queries (metrics, action distribution)
- Single-query updates for feedback
- Compact JSON serialization (separators=(',', ':'))

## Frontend Architecture

### 1. Component Structure

```
src/
├── components/
│   ├── AICharacter.jsx      # Animated AI avatar
│   ├── CrisisModal.jsx      # Crisis intervention dialog
│   └── Layout.jsx           # App shell with navigation
├── contexts/
│   └── ThemeContext.jsx     # Dark/light mode management
├── pages/
│   ├── Chat.jsx            # Main conversational interface
│   ├── Dashboard.jsx       # Mood tracking and stats
│   ├── Insights.jsx        # Analytics and visualizations
│   └── Settings.jsx        # User preferences
└── App.jsx                 # Route configuration
```

### 2. State Management

**Chat State:**
- `messages`: Array of conversation messages
- `conversationContext`: messageCount, emotionHistory, recommendationOffered
- `currentRecommendation`: Active recommendation for feedback
- `detectedEmotion`: Last detected emotion

**Dashboard State:**
- `moodData`: Time-series mood scores
- `metrics`: System performance metrics
- `userHistory`: Recent interactions

### 3. API Integration

**Base URL**: `http://localhost:8000/api/v1`

**Endpoints:**
- POST `/recommend` - Get recommendation
- POST `/feedback` - Submit feedback
- GET `/user/{id}/history` - Get history
- GET `/metrics` - Get metrics

**Polling:** Dashboard refreshes every 30 seconds

## Data Flow

### Recommendation Flow
```
User Message
    ↓
Emotion Detection (BERT)
    ↓
Crisis Check (if crisis → crisis response)
    ↓
State Builder (emotion probs + history + time)
    ↓
DQN Action Selection
    ↓
Content Retrieval (emotion-aware)
    ↓
Response Generation (conversational)
    ↓
Display to User
```

### Learning Flow
```
User Rates Content (1-5)
    ↓
Calculate Reward (new_mood - old_mood)
    ↓
Shape Reward (+ bonuses for improvement/match)
    ↓
Store Transition (state, action, reward, next_state)
    ↓
Sample Batch from Replay Buffer
    ↓
Compute Loss (Double DQN)
    ↓
Update Network Weights
    ↓
Update Priorities
    ↓
Decay Epsilon
```

## Performance Characteristics

### Backend
- Emotion detection: ~45ms (with caching)
- Full recommendation: ~60ms
- Database queries: <10ms (optimized)
- Model inference: GPU accelerated if available

### Frontend
- Initial load: <2s
- Message response: <100ms (UI) + API time
- Dashboard refresh: <500ms

## Security & Safety

### Crisis Detection
- Keyword-based detection (immediate)
- Emotion threshold monitoring (secondary)
- Automatic 988 Lifeline referral

### Data Privacy
- User IDs are anonymous (random strings)
- No PII stored
- Local storage for session persistence only

### Content Safety
- Curated content library (no user-generated content)
- All content reviewed for appropriateness
- Crisis resources prominently displayed

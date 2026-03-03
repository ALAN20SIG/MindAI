# MindAI API Documentation

## Base URL
```
http://localhost:8000/api/v1
```

## Authentication
No authentication required for local development. User identification is handled via `user_id` parameter in requests.

## Endpoints

### 1. Analyze Emotion
Analyze text to detect emotions using the BERT-based emotion classifier.

**Endpoint:** `POST /analyze`

**Request Body:**
```json
{
  "text": "I'm feeling really happy today!",
  "user_id": "user_abc123"
}
```

**Response:**
```json
{
  "user_id": "user_abc123",
  "emotion": {
    "dominant_emotion": "joy",
    "probabilities": {
      "joy": 0.85,
      "neutral": 0.10,
      "sadness": 0.02,
      "anger": 0.01,
      "fear": 0.01,
      "disgust": 0.005,
      "surprise": 0.005
    },
    "intensity": 0.85,
    "confidence_level": "high",
    "entropy": 0.45,
    "mental_health_score": 0.05,
    "inference_time_ms": 45.2
  },
  "disclaimer": "This system is not a substitute for professional mental health care..."
}
```

### 2. Get Recommendation
Get a personalized content recommendation based on emotion and user history.

**Endpoint:** `POST /recommend`

**Request Body:**
```json
{
  "text": "I've been feeling anxious about my upcoming exam",
  "user_id": "user_abc123"
}
```

**Response:**
```json
{
  "user_id": "user_abc123",
  "interaction_id": 42,
  "emotion": {
    "dominant_emotion": "fear",
    "probabilities": {...},
    "intensity": 0.72
  },
  "recommended_content": {
    "content_id": 15,
    "category": "breathing_exercise",
    "title": "4-7-8 Breathing Technique",
    "description": "Inhale for 4 seconds, hold for 7 seconds, exhale for 8 seconds...",
    "url": null,
    "effectiveness": 0.90
  },
  "agent_info": {
    "epsilon": 0.35,
    "mode": "exploitation",
    "replay_buffer_size": 156,
    "inference_time_ms": 52.4,
    "confidence_level": "high"
  },
  "disclaimer": "This system is not a substitute for professional mental health care..."
}
```

### 3. Submit Feedback
Submit mood feedback after consuming recommended content to improve future recommendations.

**Endpoint:** `POST /feedback`

**Request Body:**
```json
{
  "interaction_id": 42,
  "user_id": "user_abc123",
  "mood_score": 4,
  "feedback_text": "The breathing exercise really helped me calm down"
}
```

**Response:**
```json
{
  "interaction_id": 42,
  "old_mood": 0.72,
  "new_mood": 0.75,
  "reward": 0.03,
  "agent_learned": true,
  "loss": 0.0156,
  "message": "Mood improved!",
  "disclaimer": "This system is not a substitute for professional mental health care..."
}
```

### 4. Get User History
Retrieve interaction history for a specific user.

**Endpoint:** `GET /user/{user_id}/history?limit=50&offset=0`

**Query Parameters:**
- `limit` (optional): Number of interactions to return (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "user_id": "user_abc123",
  "total": 25,
  "interactions": [
    {
      "id": 42,
      "action_taken": 3,
      "action_category": "breathing_exercise",
      "reward": 0.03,
      "old_mood": 0.72,
      "new_mood": 0.75,
      "timestamp": "2024-01-15T10:30:00"
    }
  ],
  "disclaimer": "This system is not a substitute for professional mental health care..."
}
```

### 5. Get System Metrics
Retrieve aggregated system performance metrics.

**Endpoint:** `GET /metrics`

**Response:**
```json
{
  "total_interactions": 156,
  "completed_interactions": 89,
  "avg_reward": 0.045,
  "mood_improvement_pct": 68.5,
  "current_epsilon": 0.35,
  "action_distribution": {
    "motivational_speech": 15,
    "calm_music": 22,
    "funny_clip": 18,
    "breathing_exercise": 12,
    "inspirational_scene": 14,
    "workout_suggestion": 8
  },
  "agent_stats": {
    "avg_reward": 0.045,
    "avg_loss": 0.023,
    "epsilon": 0.35,
    "buffer_size": 156,
    "learn_steps": 42
  },
  "disclaimer": "This system is not a substitute for professional mental health care..."
}
```

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Invalid request body"
}
```

### 404 Not Found
```json
{
  "detail": "Interaction not found"
}
```

### 403 Forbidden
```json
{
  "detail": "Interaction does not belong to this user"
}
```

### 500 Internal Server Error
```json
{
  "detail": "No content available for the selected category"
}
```

## Crisis Response

When the system detects potential crisis language, it returns a crisis response instead of the normal recommendation:

```json
{
  "user_id": "user_abc123",
  "is_crisis": true,
  "severity": "high",
  "message": "I'm really concerned about what you're sharing. Your life matters... Please reach out to the 988 Suicide & Crisis Lifeline (call or text 988)...",
  "disclaimer": "This system is not a substitute for professional mental health care..."
}
```

## Rate Limits

- Emotion analysis: 100 requests/minute
- Recommendations: 60 requests/minute
- Feedback submission: 120 requests/minute

## Data Models

### EmotionDetail
- `dominant_emotion` (string): Primary detected emotion
- `probabilities` (object): Confidence scores for all 7 emotions
- `intensity` (float): Confidence of dominant emotion (0-1)
- `confidence_level` (string): high/medium/low/uncertain
- `entropy` (float): Distribution uncertainty measure
- `mental_health_score` (float): Weighted negative emotion indicator
- `inference_time_ms` (float): Processing time

### ContentItem
- `content_id` (integer): Unique content identifier
- `category` (string): Content category
- `title` (string): Content title
- `description` (string): Content description
- `url` (string|null): YouTube URL or null for text exercises
- `effectiveness` (float): Emotion-content match score

### AgentInfo
- `epsilon` (float): Current exploration rate
- `mode` (string): exploration or exploitation
- `replay_buffer_size` (integer): Number of stored experiences
- `inference_time_ms` (float): Total API response time
- `confidence_level` (string): Emotion detection confidence

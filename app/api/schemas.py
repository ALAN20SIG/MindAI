from pydantic import BaseModel, Field


# ── Request Schemas ──


class AnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=1, description="User message to analyze")
    user_id: str = Field(..., min_length=1, description="Unique user identifier")


class RecommendRequest(BaseModel):
    text: str = Field(..., min_length=1, description="User message describing how they feel")
    user_id: str = Field(..., min_length=1, description="Unique user identifier")


class FeedbackRequest(BaseModel):
    interaction_id: int = Field(..., description="ID of the interaction to provide feedback for")
    user_id: str = Field(..., min_length=1, description="Unique user identifier")
    mood_score: int = Field(..., ge=1, le=5, description="How the user feels now (1=terrible, 5=great)")
    feedback_text: str | None = Field(None, description="Optional text describing current feelings")


# ── Response Schemas ──


class EmotionDetail(BaseModel):
    dominant_emotion: str
    probabilities: dict[str, float]
    intensity: float


class AnalyzeResponse(BaseModel):
    user_id: str
    emotion: EmotionDetail
    crisis: dict | None = None
    disclaimer: str


class ContentItem(BaseModel):
    content_id: int
    category: str
    title: str
    description: str
    url: str | None = None


class RecommendResponse(BaseModel):
    user_id: str
    interaction_id: int
    emotion: EmotionDetail
    recommended_content: ContentItem
    agent_info: dict  # epsilon, exploration/exploitation
    crisis: dict | None = None
    disclaimer: str


class CrisisResponse(BaseModel):
    user_id: str
    is_crisis: bool = True
    severity: str
    message: str
    disclaimer: str


class FeedbackResponse(BaseModel):
    interaction_id: int
    old_mood: float
    new_mood: float
    reward: float
    agent_learned: bool
    loss: float | None = None
    message: str
    disclaimer: str


class InteractionHistoryItem(BaseModel):
    id: int
    action_taken: int
    action_category: str
    reward: float | None
    old_mood: float
    new_mood: float | None
    timestamp: str


class HistoryResponse(BaseModel):
    user_id: str
    total: int
    interactions: list[InteractionHistoryItem]
    disclaimer: str


class MetricsResponse(BaseModel):
    total_interactions: int
    completed_interactions: int  # with feedback
    avg_reward: float | None
    mood_improvement_pct: float | None  # % of interactions with positive reward
    current_epsilon: float
    action_distribution: dict[str, int]  # action_category → count
    disclaimer: str

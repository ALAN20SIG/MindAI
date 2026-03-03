import json
import random
from typing import Dict, List, Optional
from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.config import settings
from app.database import crud


@dataclass
class ContentItem:
    """Structured content item with metadata."""
    content_id: int
    category: str
    title: str
    description: str
    url: Optional[str]
    effectiveness_score: float = 0.0
    usage_count: int = 0


# Emotion-content effectiveness mapping based on psychological research
EMOTION_CONTENT_EFFECTIVENESS = {
    "sadness": {
        "motivational_speech": 0.85,
        "inspirational_scene": 0.80,
        "funny_clip": 0.75,
        "calm_music": 0.70,
        "breathing_exercise": 0.65,
        "workout_suggestion": 0.60,
    },
    "anger": {
        "calm_music": 0.90,
        "breathing_exercise": 0.85,
        "workout_suggestion": 0.80,
        "funny_clip": 0.70,
        "motivational_speech": 0.65,
        "inspirational_scene": 0.60,
    },
    "fear": {
        "breathing_exercise": 0.90,
        "calm_music": 0.85,
        "motivational_speech": 0.80,
        "inspirational_scene": 0.75,
        "funny_clip": 0.65,
        "workout_suggestion": 0.60,
    },
    "joy": {
        "funny_clip": 0.90,
        "workout_suggestion": 0.85,
        "inspirational_scene": 0.80,
        "motivational_speech": 0.75,
        "calm_music": 0.60,
        "breathing_exercise": 0.50,
    },
    "neutral": {
        "funny_clip": 0.80,
        "motivational_speech": 0.75,
        "calm_music": 0.75,
        "inspirational_scene": 0.70,
        "workout_suggestion": 0.65,
        "breathing_exercise": 0.60,
    },
    "disgust": {
        "calm_music": 0.85,
        "breathing_exercise": 0.80,
        "funny_clip": 0.75,
        "motivational_speech": 0.70,
        "inspirational_scene": 0.65,
        "workout_suggestion": 0.60,
    },
    "surprise": {
        "funny_clip": 0.85,
        "inspirational_scene": 0.80,
        "motivational_speech": 0.75,
        "calm_music": 0.70,
        "workout_suggestion": 0.65,
        "breathing_exercise": 0.60,
    },
}

# Content diversity tracking to avoid repetition
_content_usage_history: Dict[str, List[int]] = {}
_MAX_HISTORY_SIZE = 5


def seed_content_db(db: Session):
    """Load content_data.json into the Content table if it's empty (idempotent)."""
    if crud.count_content(db) > 0:
        return

    with open(settings.content_data_path, "r", encoding="utf-8") as f:
        items = json.load(f)

    crud.bulk_insert_content(db, items)


def get_content_effectiveness(emotion: str, category: str) -> float:
    """Get the effectiveness score for emotion-category combination."""
    emotion_map = EMOTION_CONTENT_EFFECTIVENESS.get(emotion, {})
    return emotion_map.get(category, 0.5)  # Default 0.5 for unknown combinations


def select_weighted_content(items: List, emotion: str, category: str) -> Optional:
    """Select content item using weighted random selection based on effectiveness."""
    if not items:
        return None
    
    base_effectiveness = get_content_effectiveness(emotion, category)
    
    # Calculate weights considering usage history (avoid recent repeats)
    weights = []
    category_history = _content_usage_history.get(category, [])
    
    for item in items:
        weight = base_effectiveness
        
        # Penalize recently used content
        if item.content_id in category_history:
            weight *= 0.3  # Significant penalty for recent repeats
        
        # Boost content with URLs (multimedia preferred)
        if item.url:
            weight *= 1.1
        
        weights.append(max(0.1, weight))  # Ensure minimum weight
    
    # Weighted random selection
    total_weight = sum(weights)
    probabilities = [w / total_weight for w in weights]
    
    chosen = random.choices(items, weights=probabilities, k=1)[0]
    
    # Update usage history
    if category not in _content_usage_history:
        _content_usage_history[category] = []
    _content_usage_history[category].append(chosen.content_id)
    if len(_content_usage_history[category]) > _MAX_HISTORY_SIZE:
        _content_usage_history[category].pop(0)
    
    return chosen


def get_recommendation(action_index: int, db: Session, emotion: str = None) -> dict | None:
    """Enhanced recommendation with emotion-aware content selection.

    Args:
        action_index: The category index (0-5)
        db: Database session
        emotion: Detected emotion for better content matching

    Returns dict with keys: content_id, category, title, description, url, effectiveness
    or None if no content found for the category.
    """
    if action_index < 0 or action_index >= len(settings.action_categories):
        return None

    category = settings.action_categories[action_index]
    items = crud.get_content_by_category(db, category)

    if not items:
        return None

    # Use emotion-aware selection if emotion provided
    if emotion:
        chosen = select_weighted_content(items, emotion, category)
    else:
        chosen = random.choice(items)

    if not chosen:
        return None

    effectiveness = get_content_effectiveness(emotion or "neutral", category)
    
    return {
        "content_id": chosen.content_id,
        "category": chosen.category,
        "title": chosen.title,
        "description": chosen.description,
        "url": chosen.url,
        "effectiveness": round(effectiveness, 2),
    }


def get_best_content_for_emotion(emotion: str, db: Session, top_k: int = 3) -> List[dict]:
    """Get top-k most effective content items for a specific emotion.
    
    Useful for providing multiple options to the user.
    """
    if emotion not in EMOTION_CONTENT_EFFECTIVENESS:
        emotion = "neutral"
    
    effectiveness_map = EMOTION_CONTENT_EFFECTIVENESS[emotion]
    
    # Sort categories by effectiveness
    sorted_categories = sorted(
        effectiveness_map.items(), 
        key=lambda x: x[1], 
        reverse=True
    )[:top_k]
    
    results = []
    for category, effectiveness in sorted_categories:
        items = crud.get_content_by_category(db, category)
        if items:
            # Pick best item from this category
            chosen = select_weighted_content(items, emotion, category)
            if chosen:
                results.append({
                    "content_id": chosen.content_id,
                    "category": category,
                    "title": chosen.title,
                    "description": chosen.description,
                    "url": chosen.url,
                    "effectiveness": round(effectiveness, 2),
                })
    
    return results

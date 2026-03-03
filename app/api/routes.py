import time
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.database.db import get_db
from app.database import crud
from app.models.emotion_detector import emotion_detector
from app.models.dqn_agent import dqn_agent
from app.models.state import StateBuilder
from app.content.recommender import get_recommendation
from app.safety.ethical import EthicalGuard
from app.api.schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    RecommendRequest,
    RecommendResponse,
    CrisisResponse,
    FeedbackRequest,
    FeedbackResponse,
    HistoryResponse,
    InteractionHistoryItem,
    MetricsResponse,
    EmotionDetail,
    ContentItem,
)

router = APIRouter()


# ── POST /analyze ──


@router.post("/analyze", response_model=AnalyzeResponse | CrisisResponse)
def analyze_emotion(req: AnalyzeRequest, db: Session = Depends(get_db)):
    """Analyze text emotion using BERT. No RL involved."""
    crud.get_or_create_user(db, req.user_id)

    # Safety check (keyword-based, before BERT)
    crisis = EthicalGuard.check_crisis(req.text)
    if crisis["is_crisis"]:
        return EthicalGuard.add_disclaimer(
            {"user_id": req.user_id, **crisis}
        )

    # Emotion detection
    result = emotion_detector.detect(req.text)

    # Safety check (emotion-threshold-based, after BERT)
    crisis = EthicalGuard.check_crisis(req.text, result["probabilities"])
    if crisis["is_crisis"]:
        return EthicalGuard.add_disclaimer(
            {"user_id": req.user_id, **crisis}
        )

    return EthicalGuard.add_disclaimer({
        "user_id": req.user_id,
        "emotion": EmotionDetail(
            dominant_emotion=result["dominant_emotion"],
            probabilities=result["probabilities"],
            intensity=result["intensity"],
        ),
    })


# ── POST /recommend ──


@router.post("/recommend", response_model=RecommendResponse | CrisisResponse)
def recommend_content(req: RecommendRequest, db: Session = Depends(get_db)):
    """Full RL pipeline: emotion detection → state → DQN action → content recommendation.
    
    Optimized with emotion-aware action selection and enhanced content matching.
    """
    start_time = time.time()
    
    crud.get_or_create_user(db, req.user_id)

    # Safety check (keyword)
    crisis = EthicalGuard.check_crisis(req.text)
    if crisis["is_crisis"]:
        return EthicalGuard.add_disclaimer(
            {"user_id": req.user_id, **crisis}
        )

    # Emotion detection with enhanced metrics
    result = emotion_detector.detect(req.text)
    probs = result["probabilities"]
    dominant_emotion = result["dominant_emotion"]

    # Safety check (emotion)
    crisis = EthicalGuard.check_crisis(req.text, probs)
    if crisis["is_crisis"]:
        return EthicalGuard.add_disclaimer(
            {"user_id": req.user_id, **crisis}
        )

    # Build state vector
    state = StateBuilder.build(probs, db, req.user_id)

    # DQN selects action with emotion-aware exploration
    action_index = dqn_agent.select_action(state, emotion=dominant_emotion)

    # Get content for chosen action with emotion matching
    content = get_recommendation(action_index, db, emotion=dominant_emotion)
    if content is None:
        raise HTTPException(status_code=500, detail="No content available for the selected category")

    # Log interaction
    interaction = crud.create_interaction(
        db=db,
        user_id=req.user_id,
        state_vector=state,
        action_taken=action_index,
        old_mood=result["intensity"],
    )

    was_exploring = dqn_agent.epsilon > 0.5
    inference_time = (time.time() - start_time) * 1000

    return EthicalGuard.add_disclaimer({
        "user_id": req.user_id,
        "interaction_id": interaction.id,
        "emotion": EmotionDetail(
            dominant_emotion=dominant_emotion,
            probabilities=probs,
            intensity=result["intensity"],
        ),
        "recommended_content": ContentItem(**content),
        "agent_info": {
            "epsilon": round(dqn_agent.epsilon, 4),
            "mode": "exploration" if was_exploring else "exploitation",
            "replay_buffer_size": len(dqn_agent.replay_buffer),
            "inference_time_ms": round(inference_time, 2),
            "confidence_level": result.get("confidence_level", "unknown"),
        },
    })


# ── POST /feedback ──


@router.post("/feedback", response_model=FeedbackResponse)
def submit_feedback(req: FeedbackRequest, db: Session = Depends(get_db)):
    """Submit mood feedback after a recommendation. Triggers RL learning."""
    # Validate interaction belongs to user
    interaction = crud.get_interaction(db, req.interaction_id)
    if interaction is None:
        raise HTTPException(status_code=404, detail="Interaction not found")
    if interaction.user_id != req.user_id:
        raise HTTPException(status_code=403, detail="Interaction does not belong to this user")
    if interaction.reward is not None:
        raise HTTPException(status_code=400, detail="Feedback already submitted for this interaction")

    # Normalize mood_score from 1-5 to 0-1 scale
    new_mood = (req.mood_score - 1) / 4.0
    old_mood = interaction.old_mood

    # Calculate reward
    reward = new_mood - old_mood

    # Update interaction in DB
    crud.update_interaction_feedback(db, req.interaction_id, new_mood, reward)

    # Build next_state for replay buffer
    # If feedback_text provided, detect emotion from it; otherwise approximate
    if req.feedback_text:
        next_result = emotion_detector.detect(req.feedback_text)
        next_probs = next_result["probabilities"]
    else:
        # Approximate next state: reconstruct emotion probs from stored state
        # vector and adjust based on the mood feedback score
        from app.models.state import EMOTION_KEYS
        original_state = interaction.get_state_vector()
        next_probs = {EMOTION_KEYS[i]: original_state[i] for i in range(min(7, len(original_state)))}
        # Adjust joy/sadness based on feedback
        joy_boost = (new_mood - 0.5) * 0.3
        next_probs["joy"] = max(0.0, min(1.0, next_probs.get("joy", 0.0) + joy_boost))
        next_probs["sadness"] = max(0.0, min(1.0, next_probs.get("sadness", 0.0) - joy_boost))

    next_state = StateBuilder.build(next_probs, db, req.user_id)
    original_state = interaction.get_state_vector()

    # Store transition in replay buffer
    dqn_agent.store_transition(
        state=original_state,
        action=interaction.action_taken,
        reward=reward,
        next_state=next_state,
        done=False,
    )

    # Learn if buffer is ready
    loss = None
    agent_learned = False
    if dqn_agent.can_learn():
        loss = dqn_agent.learn()
        agent_learned = True
        dqn_agent.save_checkpoint()

    message = "Mood improved!" if reward > 0 else ("Mood unchanged." if reward == 0 else "Mood decreased. The agent will adjust.")

    return EthicalGuard.add_disclaimer({
        "interaction_id": req.interaction_id,
        "old_mood": old_mood,
        "new_mood": new_mood,
        "reward": round(reward, 4),
        "agent_learned": agent_learned,
        "loss": round(loss, 6) if loss is not None else None,
        "message": message,
    })


# ── GET /user/{user_id}/history ──


@router.get("/user/{user_id}/history", response_model=HistoryResponse)
def get_user_history(
    user_id: str,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    """Get paginated interaction history for a user."""
    user = crud.get_user(db, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    interactions = crud.get_user_interactions(db, user_id, limit, offset)

    items = []
    for i in interactions:
        category = (
            settings.action_categories[i.action_taken]
            if 0 <= i.action_taken < len(settings.action_categories)
            else "unknown"
        )
        items.append(InteractionHistoryItem(
            id=i.id,
            action_taken=i.action_taken,
            action_category=category,
            reward=i.reward,
            old_mood=i.old_mood,
            new_mood=i.new_mood,
            timestamp=i.timestamp.isoformat() if i.timestamp else "",
        ))

    return EthicalGuard.add_disclaimer({
        "user_id": user_id,
        "total": len(items),
        "interactions": items,
    })


# ── GET /metrics ──


@router.get("/metrics", response_model=MetricsResponse)
def get_metrics(db: Session = Depends(get_db)):
    """Aggregate RL performance metrics using optimized queries."""
    # Use optimized aggregation query
    metrics = crud.get_metrics_summary(db)
    
    # Get action distribution efficiently
    action_dist_raw = crud.get_action_distribution(db)
    action_dist: dict[str, int] = {cat: 0 for cat in settings.action_categories}
    for action_str, count in action_dist_raw.items():
        action_idx = int(action_str)
        if 0 <= action_idx < len(settings.action_categories):
            cat = settings.action_categories[action_idx]
            action_dist[cat] = count

    # Get agent performance stats
    agent_stats = dqn_agent.get_performance_stats()

    return EthicalGuard.add_disclaimer({
        "total_interactions": metrics["total_interactions"],
        "completed_interactions": metrics["completed_interactions"],
        "avg_reward": metrics["avg_reward"],
        "mood_improvement_pct": metrics["mood_improvement_pct"],
        "current_epsilon": round(dqn_agent.epsilon, 4),
        "action_distribution": action_dist,
        "agent_stats": agent_stats,
    })

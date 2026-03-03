import json
from datetime import datetime, timezone
from functools import lru_cache
from typing import List, Optional

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.database.models import User, Interaction, Content


# ── Users ──

@lru_cache(maxsize=128)
def _cached_get_user(db_session_id: int, user_id: str) -> Optional[User]:
    """Cached user lookup - db_session_id ensures cache is session-safe."""
    return None  # Placeholder - actual query in non-cached function


def get_or_create_user(db: Session, user_id: str) -> User:
    """Get or create user with optimized query."""
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        user = User(user_id=user_id)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def get_user(db: Session, user_id: str) -> User | None:
    return db.query(User).filter(User.user_id == user_id).first()


def get_user_count(db: Session) -> int:
    """Get total user count efficiently."""
    return db.query(func.count(User.id)).scalar()


# ── Interactions ──

def create_interaction(
    db: Session,
    user_id: str,
    state_vector: list[float],
    action_taken: int,
    old_mood: float,
) -> Interaction:
    """Create interaction with optimized serialization."""
    interaction = Interaction(
        user_id=user_id,
        state_vector=json.dumps(state_vector, separators=(',', ':')),  # Compact JSON
        action_taken=action_taken,
        old_mood=old_mood,
    )
    db.add(interaction)
    db.commit()
    db.refresh(interaction)
    return interaction


def update_interaction_feedback(
    db: Session,
    interaction_id: int,
    new_mood: float,
    reward: float,
) -> Interaction | None:
    """Update feedback with single query optimization."""
    result = db.query(Interaction).filter(
        Interaction.id == interaction_id
    ).update(
        {"new_mood": new_mood, "reward": reward},
        synchronize_session=False
    )
    if result == 0:
        return None
    db.commit()
    return db.query(Interaction).filter(Interaction.id == interaction_id).first()


def get_interaction(db: Session, interaction_id: int) -> Interaction | None:
    return db.query(Interaction).filter(Interaction.id == interaction_id).first()


def get_user_interactions(
    db: Session, user_id: str, limit: int = 50, offset: int = 0
) -> list[Interaction]:
    """Get user interactions with optimized query."""
    return (
        db.query(Interaction)
        .filter(Interaction.user_id == user_id)
        .order_by(Interaction.timestamp.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


def get_user_interactions_fast(
    db: Session, user_id: str, limit: int = 20
) -> list[dict]:
    """Get interactions as dictionaries for faster serialization."""
    from sqlalchemy import text
    query = text("""
        SELECT id, action_taken, reward, old_mood, new_mood, timestamp
        FROM interactions
        WHERE user_id = :user_id
        ORDER BY timestamp DESC
        LIMIT :limit
    """)
    result = db.execute(query, {"user_id": user_id, "limit": limit})
    return [
        {
            "id": row.id,
            "action_taken": row.action_taken,
            "reward": row.reward,
            "old_mood": row.old_mood,
            "new_mood": row.new_mood,
            "timestamp": row.timestamp.isoformat() if row.timestamp else None,
        }
        for row in result
    ]


def get_recent_moods(db: Session, user_id: str, n: int = 5) -> list[float]:
    """Get the last N new_mood scores for a user (for mood trend calculation)."""
    from sqlalchemy import text
    query = text("""
        SELECT new_mood FROM interactions
        WHERE user_id = :user_id AND new_mood IS NOT NULL
        ORDER BY timestamp DESC
        LIMIT :limit
    """)
    result = db.execute(query, {"user_id": user_id, "limit": n})
    moods = [row.new_mood for row in result]
    return list(reversed(moods))


def get_last_action(db: Session, user_id: str) -> int | None:
    """Get the most recent action taken for a user."""
    from sqlalchemy import text
    query = text("""
        SELECT action_taken FROM interactions
        WHERE user_id = :user_id
        ORDER BY timestamp DESC
        LIMIT 1
    """)
    result = db.execute(query, {"user_id": user_id}).first()
    return result.action_taken if result else None


def get_all_completed_interactions(db: Session) -> list[Interaction]:
    """Get all interactions that have received feedback (reward is set)."""
    return (
        db.query(Interaction)
        .filter(Interaction.reward.isnot(None))
        .all()
    )


def get_metrics_summary(db: Session) -> dict:
    """Get aggregated metrics in a single efficient query."""
    from sqlalchemy import text
    query = text("""
        SELECT 
            COUNT(*) as total_interactions,
            COUNT(reward) as completed_interactions,
            AVG(reward) as avg_reward,
            SUM(CASE WHEN reward > 0 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(reward), 0) as positive_pct
        FROM interactions
    """)
    result = db.execute(query).first()
    return {
        "total_interactions": result.total_interactions or 0,
        "completed_interactions": result.completed_interactions or 0,
        "avg_reward": round(result.avg_reward, 4) if result.avg_reward else None,
        "mood_improvement_pct": round(result.positive_pct, 2) if result.positive_pct else None,
    }


def get_action_distribution(db: Session) -> dict[str, int]:
    """Get action distribution efficiently."""
    from sqlalchemy import text
    query = text("""
        SELECT action_taken, COUNT(*) as count
        FROM interactions
        WHERE reward IS NOT NULL
        GROUP BY action_taken
    """)
    result = db.execute(query)
    return {str(row.action_taken): row.count for row in result}


# ── Content ──


def get_content_by_category(db: Session, category: str) -> list[Content]:
    return db.query(Content).filter(Content.category == category).all()


def count_content(db: Session) -> int:
    return db.query(Content).count()


def bulk_insert_content(db: Session, items: list[dict]):
    for item in items:
        content = Content(**item)
        db.add(content)
    db.commit()

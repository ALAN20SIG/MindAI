import math
from datetime import datetime, timezone

import numpy as np
from sqlalchemy.orm import Session

from app.config import settings
from app.database import crud

# Canonical emotion order matching BERT model output
EMOTION_KEYS = ["anger", "disgust", "fear", "joy", "neutral", "sadness", "surprise"]


class StateBuilder:
    """Builds a 16-dimensional state vector for the DQN agent.

    Layout:
        [0:7]   - 7 BERT emotion probabilities (anger, disgust, fear, joy, neutral, sadness, surprise)
        [7:9]   - 2 cyclical time features (sin, cos of hour)
        [9:15]  - 6 one-hot encoding of previous action
        [15]    - 1 recent mood trend (slope of last N moods, clamped to [-1, 1])
    """

    @staticmethod
    def build(
        emotion_probs: dict[str, float],
        db: Session,
        user_id: str,
    ) -> list[float]:
        state = []

        # 7 emotion probabilities in canonical order
        for key in EMOTION_KEYS:
            state.append(emotion_probs.get(key, 0.0))

        # Cyclical time encoding (hour of day)
        now = datetime.now(timezone.utc)
        hour = now.hour + now.minute / 60.0
        state.append(math.sin(2 * math.pi * hour / 24.0))
        state.append(math.cos(2 * math.pi * hour / 24.0))

        # One-hot previous action (6 dims)
        last_action = crud.get_last_action(db, user_id)
        action_one_hot = [0.0] * settings.action_dim
        if last_action is not None and 0 <= last_action < settings.action_dim:
            action_one_hot[last_action] = 1.0
        state.extend(action_one_hot)

        # Recent mood trend — linear slope of last N mood scores, normalized to [-1, 1]
        recent_moods = crud.get_recent_moods(db, user_id, n=settings.mood_trend_window)
        if len(recent_moods) >= 2:
            x = np.arange(len(recent_moods), dtype=np.float64)
            y = np.array(recent_moods, dtype=np.float64)
            slope = float(np.polyfit(x, y, 1)[0])
            # Clamp to [-1, 1]
            trend = max(-1.0, min(1.0, slope))
        else:
            trend = 0.0
        state.append(trend)

        return state

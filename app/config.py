import os
import torch
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # --- Application ---
    app_name: str = "Mental Health RL API"
    app_version: str = "1.0.0"
    debug: bool = False

    # --- Database ---
    database_url: str = "sqlite:///./mental_health.db"

    # --- Emotion Detection (BERT) ---
    emotion_model_name: str = "j-hartmann/emotion-english-distilroberta-base"
    emotion_device: str = "cuda" if torch.cuda.is_available() else "cpu"

    # --- DQN Hyperparameters ---
    state_dim: int = 16  # 7 emotion + 2 time + 6 prev_action + 1 mood_trend
    action_dim: int = 6  # 6 content categories
    dqn_hidden_1: int = 128
    dqn_hidden_2: int = 64
    learning_rate: float = 1e-3
    gamma: float = 0.99  # discount factor
    epsilon_start: float = 1.0
    epsilon_end: float = 0.01
    epsilon_decay: float = 0.995
    replay_buffer_size: int = 10_000
    batch_size: int = 64
    target_update_freq: int = 100  # update target network every N learn() calls
    checkpoint_path: str = "dqn_checkpoint.pth"

    # --- Content ---
    content_data_path: str = os.path.join(
        os.path.dirname(__file__), "content", "content_data.json"
    )

    # --- Safety Thresholds ---
    # Note: BERT outputs very high scores (>0.98) even for mild sadness/fear.
    # Keyword detection is the primary crisis detector. These emotion thresholds
    # serve as a secondary signal and are set high to avoid false positives.
    crisis_sadness_threshold: float = 0.97
    crisis_fear_threshold: float = 0.95
    crisis_combined_threshold: float = 1.8  # sadness + fear

    # --- Action Categories ---
    action_categories: list[str] = [
        "motivational_speech",
        "calm_music",
        "funny_clip",
        "breathing_exercise",
        "inspirational_scene",
        "workout_suggestion",
    ]

    # --- Mood Trend ---
    mood_trend_window: int = 5  # number of past interactions for trend

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

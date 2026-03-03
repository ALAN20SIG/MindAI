import warnings
import logging
import time
from functools import lru_cache
from typing import Dict, List, Tuple

from transformers import pipeline
from transformers.utils import logging as transformers_logging

from app.config import settings

# Suppress transformers verbose loading messages
logging.getLogger("transformers.modeling_utils").setLevel(logging.ERROR)
transformers_logging.set_verbosity_error()

logger = logging.getLogger(__name__)


class EmotionDetector:
    """Enhanced emotion detection with confidence scoring, caching, and mental health optimization.

    Uses j-hartmann/emotion-english-distilroberta-base with optimizations for:
    - Inference speed through caching and batching
    - Confidence threshold management for uncertain predictions
    - Mental health context awareness
    """

    _instance = None

    # Confidence thresholds for emotion categories
    CONFIDENCE_THRESHOLDS = {
        "high": 0.75,
        "medium": 0.50,
        "low": 0.30,
    }

    # Mental health relevant emotion mappings for better context understanding
    EMOTION_INTENSITY_MAP = {
        "joy": {"positive": True, "intensity_weight": 1.0},
        "sadness": {"positive": False, "intensity_weight": 1.2},  # Weight higher for mental health
        "anger": {"positive": False, "intensity_weight": 1.1},
        "fear": {"positive": False, "intensity_weight": 1.15},   # Anxiety detection priority
        "disgust": {"positive": False, "intensity_weight": 1.0},
        "surprise": {"positive": None, "intensity_weight": 0.8},
        "neutral": {"positive": None, "intensity_weight": 0.5},
    }

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
            cls._instance._cache = {}
            cls._instance._cache_hits = 0
            cls._instance._cache_misses = 0
        return cls._instance

    def initialize(self):
        if self._initialized:
            return
        
        # Suppress the verbose load report output
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            self._pipe = pipeline(
                "text-classification",
                model=settings.emotion_model_name,
                top_k=None,  # return all labels with scores
                device=settings.emotion_device,
                batch_size=1,  # Optimize for single inference
            )
        self._initialized = True
        logger.info("Emotion detector initialized successfully")

    @property
    def is_ready(self) -> bool:
        return self._initialized

    def _get_cache_key(self, text: str) -> str:
        """Generate cache key from text (normalized)."""
        return text.lower().strip()[:200]  # Limit key length

    def _compute_confidence_level(self, max_prob: float, entropy: float) -> str:
        """Compute confidence level based on probability and distribution entropy."""
        if max_prob >= self.CONFIDENCE_THRESHOLDS["high"] and entropy < 0.5:
            return "high"
        elif max_prob >= self.CONFIDENCE_THRESHOLDS["medium"] and entropy < 1.0:
            return "medium"
        elif max_prob >= self.CONFIDENCE_THRESHOLDS["low"]:
            return "low"
        return "uncertain"

    def _compute_entropy(self, probabilities: Dict[str, float]) -> float:
        """Compute Shannon entropy of probability distribution."""
        import math
        entropy = 0.0
        for p in probabilities.values():
            if p > 0:
                entropy -= p * math.log2(p)
        return entropy

    def _apply_mental_health_context(self, probabilities: Dict[str, float]) -> Dict[str, float]:
        """Adjust probabilities based on mental health context priorities."""
        adjusted = probabilities.copy()
        
        # Boost sadness and fear detection for mental health applications
        # These are critical emotions for early intervention
        if adjusted.get("sadness", 0) > 0.3:
            adjusted["sadness"] = min(1.0, adjusted["sadness"] * 1.1)
        if adjusted.get("fear", 0) > 0.3:
            adjusted["fear"] = min(1.0, adjusted["fear"] * 1.1)
            
        # Renormalize
        total = sum(adjusted.values())
        if total > 0:
            adjusted = {k: v / total for k, v in adjusted.items()}
            
        return adjusted

    def detect(self, text: str, use_cache: bool = True) -> dict:
        """Analyze text with enhanced emotion detection.

        Returns:
            {
                "dominant_emotion": str,
                "probabilities": {"anger": 0.1, "joy": 0.6, ...},
                "intensity": float,
                "confidence_level": str,  # high/medium/low/uncertain
                "entropy": float,         # distribution uncertainty
                "mental_health_score": float,  # weighted negative emotion indicator
                "inference_time_ms": float,
            }
        """
        start_time = time.time()
        
        # Check cache
        cache_key = self._get_cache_key(text)
        if use_cache and cache_key in self._cache:
            self._cache_hits += 1
            result = self._cache[cache_key].copy()
            result["cached"] = True
            return result
        
        self._cache_misses += 0

        # Run inference
        results = self._pipe(text)[0]
        probabilities = {r["label"]: r["score"] for r in results}
        
        # Apply mental health context adjustments
        probabilities = self._apply_mental_health_context(probabilities)
        
        # Compute metrics
        dominant = max(probabilities, key=probabilities.get)
        intensity = probabilities[dominant]
        entropy = self._compute_entropy(probabilities)
        confidence_level = self._compute_confidence_level(intensity, entropy)
        
        # Compute mental health score (weighted negative emotions)
        negative_score = sum(
            probabilities.get(emo, 0) * self.EMOTION_INTENSITY_MAP[emo]["intensity_weight"]
            for emo in ["sadness", "anger", "fear", "disgust"]
        )
        
        inference_time = (time.time() - start_time) * 1000

        result = {
            "dominant_emotion": dominant,
            "probabilities": probabilities,
            "intensity": intensity,
            "confidence_level": confidence_level,
            "entropy": round(entropy, 4),
            "mental_health_score": round(negative_score, 4),
            "inference_time_ms": round(inference_time, 2),
        }

        # Cache result
        if use_cache:
            self._cache[cache_key] = result.copy()
            # Simple LRU: limit cache size
            if len(self._cache) > 1000:
                self._cache.pop(next(iter(self._cache)))

        return result

    def get_cache_stats(self) -> dict:
        """Return cache performance statistics."""
        total = self._cache_hits + self._cache_misses
        hit_rate = self._cache_hits / total if total > 0 else 0
        return {
            "hits": self._cache_hits,
            "misses": self._cache_misses,
            "hit_rate": round(hit_rate, 4),
            "size": len(self._cache),
        }

    def batch_detect(self, texts: List[str]) -> List[dict]:
        """Process multiple texts efficiently."""
        return [self.detect(text) for text in texts]


# Module-level singleton
emotion_detector = EmotionDetector()

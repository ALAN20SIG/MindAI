import re

from app.config import settings

# Crisis phrases indicating immediate danger — must be handled before any RL logic
CRISIS_PHRASES = [
    r"\bsuicid\w*\b",
    r"\bkill\s*(my)?self\b",
    r"\bend\s*(my)?\s*life\b",
    r"\bwant\s*to\s*die\b",
    r"\bhurt\s*(my)?self\b",
    r"\bself[- ]?harm\b",
    r"\bno\s*reason\s*to\s*live\b",
    r"\bbetter\s*off\s*dead\b",
    r"\bcan'?t\s*go\s*on\b",
    r"\bgive\s*up\s*on\s*(life|everything)\b",
]

CRISIS_PATTERN = re.compile("|".join(CRISIS_PHRASES), re.IGNORECASE)

DISCLAIMER = (
    "Disclaimer: This system is not a substitute for professional mental health care. "
    "If you are in crisis, please seek immediate help from a qualified professional."
)

CRISIS_RESPONSE = {
    "is_crisis": True,
    "message": (
        "It sounds like you may be going through an extremely difficult time. "
        "Your safety matters. Please reach out to a professional who can help:\n\n"
        "- **988 Suicide & Crisis Lifeline**: Call or text 988 (US)\n"
        "- **Crisis Text Line**: Text HOME to 741741 (US)\n"
        "- **International Association for Suicide Prevention**: https://www.iasp.info/resources/Crisis_Centres/\n"
        "- **Emergency Services**: Call your local emergency number (911 in US)\n\n"
        "You are not alone, and help is available right now."
    ),
}


class EthicalGuard:
    """Stateless safety layer that intercepts crisis situations and adds disclaimers."""

    @staticmethod
    def check_crisis(text: str, emotion_probs: dict[str, float] | None = None) -> dict:
        """Check if the user's message or emotional state indicates a crisis.

        Returns:
            {"is_crisis": bool, "severity": str, "message": str | None}
        """
        # Keyword-based detection
        if CRISIS_PATTERN.search(text):
            return {
                "is_crisis": True,
                "severity": "critical",
                **CRISIS_RESPONSE,
            }

        # Emotion-threshold detection (if BERT probabilities provided)
        # Note: The BERT model outputs very high confidence (>0.98) even for
        # mild sadness/fear. Single-emotion thresholds produce false positives.
        # We only trigger on extreme COMBINED sadness+fear, indicating both
        # hopelessness and terror simultaneously — a genuine crisis signal.
        if emotion_probs:
            sadness = emotion_probs.get("sadness", 0.0)
            fear = emotion_probs.get("fear", 0.0)

            if (sadness + fear) > settings.crisis_combined_threshold:
                return {
                    "is_crisis": True,
                    "severity": "severe",
                    **CRISIS_RESPONSE,
                }

        return {"is_crisis": False, "severity": "none", "message": None}

    @staticmethod
    def add_disclaimer(response: dict) -> dict:
        """Append the standard mental health disclaimer to any API response."""
        response["disclaimer"] = DISCLAIMER
        return response

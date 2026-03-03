import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database.db import init_db, SessionLocal
from app.models.emotion_detector import emotion_detector
from app.models.dqn_agent import dqn_agent
from app.content.recommender import seed_content_db
from app.api.routes import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: initialize DB, seed content, load BERT model, load DQN checkpoint.
    Shutdown: save DQN checkpoint.
    """
    # Startup
    init_db()

    db = SessionLocal()
    try:
        seed_content_db(db)
    finally:
        db.close()

    emotion_detector.initialize()

    if os.path.exists(settings.checkpoint_path):
        dqn_agent.load_checkpoint()

    yield

    # Shutdown
    dqn_agent.save_checkpoint()


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "Mental Health RL API: BERT emotion detection + DQN reinforcement learning "
        "agent that learns to recommend mood-improving content over time."
    ),
    lifespan=lifespan,
)

# Configure CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1", tags=["Mental Health RL"])


@app.get("/")
def root():
    return {
        "app": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
        "disclaimer": (
            "This system is not a substitute for professional mental health care. "
            "If you are in crisis, please seek immediate help."
        ),
    }

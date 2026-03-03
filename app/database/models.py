import json
from datetime import datetime, timezone

from sqlalchemy import Column, String, Integer, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database.db import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(String, primary_key=True, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    interactions = relationship("Interaction", back_populates="user")


class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False, index=True)
    state_vector = Column(Text, nullable=False)  # JSON-serialized float list
    action_taken = Column(Integer, nullable=False)  # 0-5 action index
    reward = Column(Float, nullable=True)  # set after feedback
    old_mood = Column(Float, nullable=False)  # emotion intensity at recommendation time
    new_mood = Column(Float, nullable=True)  # set after feedback
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="interactions")

    def get_state_vector(self) -> list[float]:
        return json.loads(self.state_vector)

    def set_state_vector(self, vector: list[float]):
        self.state_vector = json.dumps(vector)


class Content(Base):
    __tablename__ = "content"

    content_id = Column(Integer, primary_key=True, autoincrement=True)
    category = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    url = Column(String, nullable=True)

import random
from collections import deque
import logging

import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim

from app.config import settings

logger = logging.getLogger(__name__)


class QNetwork(nn.Module):
    """Enhanced Q-network with dueling architecture for better value estimation."""

    def __init__(self, state_dim: int, action_dim: int):
        super().__init__()
        self.action_dim = action_dim
        
        # Shared feature layers
        self.feature = nn.Sequential(
            nn.Linear(state_dim, settings.dqn_hidden_1),
            nn.ReLU(),
            nn.Linear(settings.dqn_hidden_1, settings.dqn_hidden_2),
            nn.ReLU(),
        )
        
        # Value stream (estimates state value V(s))
        self.value_stream = nn.Sequential(
            nn.Linear(settings.dqn_hidden_2, settings.dqn_hidden_2 // 2),
            nn.ReLU(),
            nn.Linear(settings.dqn_hidden_2 // 2, 1),
        )
        
        # Advantage stream (estimates action advantages A(s,a))
        self.advantage_stream = nn.Sequential(
            nn.Linear(settings.dqn_hidden_2, settings.dqn_hidden_2 // 2),
            nn.ReLU(),
            nn.Linear(settings.dqn_hidden_2 // 2, action_dim),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        features = self.feature(x)
        value = self.value_stream(features)
        advantage = self.advantage_stream(features)
        
        # Dueling Q-value: Q(s,a) = V(s) + A(s,a) - mean(A(s,a'))
        return value + advantage - advantage.mean(dim=1, keepdim=True)


class PrioritizedReplayBuffer:
    """Prioritized experience replay buffer with importance sampling.
    
    Prioritizes transitions with higher TD error for more efficient learning.
    """

    def __init__(self, capacity: int = settings.replay_buffer_size, alpha: float = 0.6):
        self.capacity = capacity
        self.alpha = alpha  # Priority exponent (0 = uniform, 1 = full prioritization)
        self.buffer = []
        self.priorities = np.zeros(capacity, dtype=np.float32)
        self.position = 0
        self.size = 0

    def push(
        self,
        state: list[float],
        action: int,
        reward: float,
        next_state: list[float],
        done: bool = False,
    ):
        """Add transition with maximum priority."""
        max_priority = self.priorities.max() if self.size > 0 else 1.0
        
        if self.size < self.capacity:
            self.buffer.append((state, action, reward, next_state, done))
            self.size += 1
        else:
            self.buffer[self.position] = (state, action, reward, next_state, done)
        
        self.priorities[self.position] = max_priority
        self.position = (self.position + 1) % self.capacity

    def sample(self, batch_size: int, beta: float = 0.4) -> tuple:
        """Sample batch with importance sampling weights."""
        if self.size < batch_size:
            batch_size = self.size
        
        # Compute sampling probabilities
        priorities = self.priorities[:self.size]
        probabilities = priorities ** self.alpha
        probabilities /= probabilities.sum()
        
        # Sample indices
        indices = np.random.choice(self.size, batch_size, p=probabilities, replace=False)
        
        # Compute importance sampling weights
        weights = (self.size * probabilities[indices]) ** (-beta)
        weights /= weights.max()  # Normalize
        
        # Get samples
        samples = [self.buffer[idx] for idx in indices]
        
        return samples, indices, weights

    def update_priorities(self, indices: np.ndarray, td_errors: np.ndarray):
        """Update priorities based on new TD errors."""
        for idx, td_error in zip(indices, td_errors):
            self.priorities[idx] = abs(td_error) + 1e-6  # Small constant for stability

    def __len__(self) -> int:
        return self.size


class DQNAgent:
    """Enhanced DQN agent with dueling networks, prioritized replay, and reward shaping.

    Improvements:
    - Dueling architecture for better value estimation
    - Prioritized experience replay for efficient learning
    - Reward shaping based on emotion transition quality
    - Double DQN to reduce overestimation bias
    """

    # Emotion-based content category effectiveness mapping
    EMOTION_CONTENT_MATCH = {
        "sadness": ["motivational_speech", "inspirational_scene", "funny_clip"],
        "anger": ["calm_music", "breathing_exercise", "workout_suggestion"],
        "fear": ["breathing_exercise", "calm_music", "motivational_speech"],
        "joy": ["funny_clip", "workout_suggestion", "inspirational_scene"],
        "neutral": ["calm_music", "funny_clip", "motivational_speech"],
        "disgust": ["calm_music", "breathing_exercise", "funny_clip"],
        "surprise": ["funny_clip", "inspirational_scene", "motivational_speech"],
    }

    def __init__(self):
        self.state_dim = settings.state_dim
        self.action_dim = settings.action_dim
        self.device = torch.device(settings.emotion_device)

        # Networks
        self.policy_net = QNetwork(self.state_dim, self.action_dim).to(self.device)
        self.target_net = QNetwork(self.state_dim, self.action_dim).to(self.device)
        self.target_net.load_state_dict(self.policy_net.state_dict())
        self.target_net.eval()

        # Optimizer with gradient clipping
        self.optimizer = optim.Adam(
            self.policy_net.parameters(), 
            lr=settings.learning_rate,
            eps=1e-4,  # Prevent division by zero
        )
        self.scheduler = optim.lr_scheduler.StepLR(
            self.optimizer, step_size=100, gamma=0.95
        )
        self.loss_fn = nn.SmoothL1Loss(reduction='none')  # Huber loss for stability

        # Prioritized replay buffer
        self.replay_buffer = PrioritizedReplayBuffer()

        # Exploration parameters
        self.epsilon = settings.epsilon_start
        self.epsilon_decay = settings.epsilon_decay
        self.min_epsilon = settings.epsilon_end
        
        # Learning parameters
        self.learn_step_counter = 0
        self.beta_start = 0.4
        self.beta_frames = 10000
        
        # Performance tracking
        self.reward_history = deque(maxlen=100)
        self.loss_history = deque(maxlen=100)

    def select_action(self, state: list[float], emotion: str = None) -> int:
        """Enhanced epsilon-greedy with emotion-aware exploration.
        
        If emotion is provided, boosts probability of selecting 
        emotion-appropriate content during exploration.
        """
        if random.random() < self.epsilon:
            # Emotion-aware exploration
            if emotion and emotion in self.EMOTION_CONTENT_MATCH:
                preferred_actions = self.EMOTION_CONTENT_MATCH[emotion]
                if random.random() < 0.7:  # 70% chance to pick from preferred
                    preferred_indices = [
                        settings.action_categories.index(cat) 
                        for cat in preferred_actions 
                        if cat in settings.action_categories
                    ]
                    if preferred_indices:
                        return random.choice(preferred_indices)
            return random.randint(0, self.action_dim - 1)

        with torch.no_grad():
            state_t = torch.FloatTensor(state).unsqueeze(0).to(self.device)
            q_values = self.policy_net(state_t)
            return int(q_values.argmax(dim=1).item())

    def shape_reward(self, raw_reward: float, old_mood: float, new_mood: float, 
                     emotion: str, action_category: str) -> float:
        """Shape reward based on mood improvement and emotion-content match.
        
        Rewards:
        - Large positive for significant mood improvement (>0.3)
        - Bonus for matching content to emotion
        - Penalty for mood deterioration
        """
        shaped = raw_reward
        
        # Mood improvement bonus
        mood_delta = new_mood - old_mood
        if mood_delta > 0.3:
            shaped += 0.2  # Significant improvement bonus
        elif mood_delta > 0.1:
            shaped += 0.1  # Moderate improvement
        elif mood_delta < -0.2:
            shaped -= 0.1  # Deterioration penalty
        
        # Emotion-content match bonus
        if emotion in self.EMOTION_CONTENT_MATCH:
            if action_category in self.EMOTION_CONTENT_MATCH[emotion]:
                shaped += 0.15  # Good match bonus
        
        # Clip reward to prevent extreme values
        return np.clip(shaped, -1.5, 1.5)

    def store_transition(
        self,
        state: list[float],
        action: int,
        reward: float,
        next_state: list[float],
        done: bool = False,
    ):
        self.replay_buffer.push(state, action, reward, next_state, done)
        self.reward_history.append(reward)

    def can_learn(self) -> bool:
        return len(self.replay_buffer) >= settings.batch_size

    def get_beta(self) -> float:
        """Anneal beta for importance sampling."""
        return min(1.0, self.beta_start + self.learn_step_counter * (1.0 - self.beta_start) / self.beta_frames)

    def learn(self) -> dict | None:
        """Enhanced learning with prioritized replay and double DQN.

        Returns dict with loss and metrics, or None if buffer is too small.
        """
        if not self.can_learn():
            return None

        beta = self.get_beta()
        batch, indices, weights = self.replay_buffer.sample(settings.batch_size, beta)
        states, actions, rewards, next_states, dones = zip(*batch)

        # Convert to tensors
        states_t = torch.FloatTensor(np.array(states)).to(self.device)
        actions_t = torch.LongTensor(actions).unsqueeze(1).to(self.device)
        rewards_t = torch.FloatTensor(rewards).unsqueeze(1).to(self.device)
        next_states_t = torch.FloatTensor(np.array(next_states)).to(self.device)
        dones_t = torch.FloatTensor(dones).unsqueeze(1).to(self.device)
        weights_t = torch.FloatTensor(weights).unsqueeze(1).to(self.device)

        # Current Q-values
        current_q = self.policy_net(states_t).gather(1, actions_t)

        # Double DQN: use policy net to select action, target net to evaluate
        with torch.no_grad():
            next_actions = self.policy_net(next_states_t).argmax(dim=1, keepdim=True)
            next_q = self.target_net(next_states_t).gather(1, next_actions)
            target_q = rewards_t + settings.gamma * next_q * (1 - dones_t)

        # Compute TD errors for priority updates
        td_errors = (current_q - target_q).detach().cpu().numpy().flatten()
        
        # Weighted loss
        loss = (self.loss_fn(current_q, target_q) * weights_t).mean()

        # Optimize
        self.optimizer.zero_grad()
        loss.backward()
        # Gradient clipping for stability
        torch.nn.utils.clip_grad_norm_(self.policy_net.parameters(), max_norm=10)
        self.optimizer.step()
        self.scheduler.step()

        # Update priorities
        self.replay_buffer.update_priorities(indices, td_errors)

        # Decay epsilon
        self.epsilon = max(self.min_epsilon, self.epsilon * self.epsilon_decay)

        # Update target network periodically
        self.learn_step_counter += 1
        if self.learn_step_counter % settings.target_update_freq == 0:
            self.update_target_network()

        # Track metrics
        self.loss_history.append(loss.item())
        
        return {
            "loss": loss.item(),
            "mean_q": current_q.mean().item(),
            "td_error_mean": abs(td_errors).mean(),
            "epsilon": self.epsilon,
        }

    def update_target_network(self):
        """Soft update target network for smoother learning."""
        tau = 0.005  # Soft update factor
        for param, target_param in zip(self.policy_net.parameters(), self.target_net.parameters()):
            target_param.data.copy_(tau * param.data + (1 - tau) * target_param.data)

    def get_performance_stats(self) -> dict:
        """Return learning performance statistics."""
        return {
            "avg_reward": np.mean(self.reward_history) if self.reward_history else 0,
            "avg_loss": np.mean(self.loss_history) if self.loss_history else 0,
            "epsilon": self.epsilon,
            "buffer_size": len(self.replay_buffer),
            "learn_steps": self.learn_step_counter,
        }

    def save_checkpoint(self, path: str | None = None):
        path = path or settings.checkpoint_path
        torch.save(
            {
                "policy_net": self.policy_net.state_dict(),
                "target_net": self.target_net.state_dict(),
                "optimizer": self.optimizer.state_dict(),
                "epsilon": self.epsilon,
                "learn_step_counter": self.learn_step_counter,
                "buffer_size": len(self.replay_buffer),
            },
            path,
        )

    def load_checkpoint(self, path: str | None = None):
        path = path or settings.checkpoint_path
        try:
            checkpoint = torch.load(path, map_location=self.device, weights_only=True)
            
            # Try to load state dict - handle architecture changes gracefully
            try:
                self.policy_net.load_state_dict(checkpoint["policy_net"])
                self.target_net.load_state_dict(checkpoint["target_net"])
            except RuntimeError as e:
                # Architecture mismatch - start fresh but preserve epsilon/learn_step
                logger.warning(f"Checkpoint architecture mismatch, starting fresh: {e}")
                # Initialize fresh networks
                self.policy_net = QNetwork(self.state_dim, self.action_dim).to(self.device)
                self.target_net = QNetwork(self.state_dim, self.action_dim).to(self.device)
                self.target_net.load_state_dict(self.policy_net.state_dict())
                self.target_net.eval()
                # Reinitialize optimizer
                self.optimizer = optim.Adam(
                    self.policy_net.parameters(), 
                    lr=settings.learning_rate,
                    eps=1e-4,
                )
            
            # Load optimizer state if compatible
            try:
                self.optimizer.load_state_dict(checkpoint["optimizer"])
            except (ValueError, KeyError):
                logger.warning("Optimizer state incompatible, using fresh optimizer")
            
            self.epsilon = checkpoint.get("epsilon", settings.epsilon_start)
            self.learn_step_counter = checkpoint.get("learn_step_counter", 0)
            
        except FileNotFoundError:
            pass  # No checkpoint yet — fresh start
        except Exception as e:
            logger.error(f"Error loading checkpoint: {e}")
            pass  # Start fresh on any error


# Module-level singleton
dqn_agent = DQNAgent()

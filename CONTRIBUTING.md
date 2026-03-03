# Contributing to MindAI

Thank you for your interest in contributing to MindAI! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Prioritize user safety and wellbeing
- Respect user privacy and data protection

## How to Contribute

### Reporting Issues

When reporting bugs or requesting features:

1. **Check existing issues** to avoid duplicates
2. **Use issue templates** when available
3. **Provide details:**
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment (OS, Python version, browser)
   - Screenshots if applicable

### Security Issues

For security vulnerabilities:
- **DO NOT** create a public issue
- Email security concerns to: security@mindai.example.com
- Allow time for response before public disclosure

### Feature Requests

For new features:
1. Describe the use case and benefit
2. Consider mental health impact
3. Discuss implementation approach
4. Be open to feedback

## Development Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- Git

### Backend Setup

```bash
# Clone repository
git clone https://github.com/yourusername/mindai.git
cd mindai

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run tests
pytest

# Start development server
python run.py
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run tests
npm test

# Start development server
npm run dev
```

## Development Guidelines

### Code Style

**Python (Backend):**
- Follow PEP 8
- Use type hints
- Maximum line length: 100 characters
- Use Black formatter: `black app/`

```python
# Good
def analyze_emotion(text: str) -> dict[str, float]:
    """Analyze text and return emotion probabilities."""
    result = emotion_detector.detect(text)
    return result["probabilities"]

# Bad
def analyze_emotion(text):
    result=emotion_detector.detect(text)
    return result['probabilities']
```

**JavaScript/React (Frontend):**
- Use ESLint configuration
- Prefer functional components
- Use hooks for state management
- Maximum line length: 100 characters

```javascript
// Good
const EmotionDisplay = ({ emotion, confidence }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="emotion-card">
      <span>{emotion}</span>
      <span>{confidence}%</span>
    </div>
  );
};

// Bad
function EmotionDisplay(props) {
  var isExpanded = false;
  return <div>{props.emotion}</div>;
}
```

### Testing

**Backend Tests:**
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_emotion_detector.py
```

**Frontend Tests:**
```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

### Commit Messages

Use conventional commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build/tooling changes

Examples:
```
feat(emotion): add confidence threshold filtering

fix(api): handle null emotion in recommendation

docs(readme): update deployment instructions
```

## Pull Request Process

1. **Create a branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes:**
   - Write code
   - Add tests
   - Update documentation

3. **Run checks:**
   ```bash
   # Backend
   black app/
   flake8 app/
   pytest
   
   # Frontend
   npm run lint
   npm test
   ```

4. **Commit changes:**
   ```bash
   git add .
   git commit -m "feat: add your feature"
   ```

5. **Push and create PR:**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **PR Requirements:**
   - Clear description of changes
   - Link to related issues
   - Screenshots for UI changes
   - All tests passing
   - Code review approval

## Specific Contribution Areas

### Emotion Detection Improvements

Areas for contribution:
- Multi-language emotion detection
- Custom fine-tuning on mental health datasets
- Confidence calibration
- Emotion intensity estimation

Guidelines:
- Maintain 7-emotion output format
- Ensure crisis detection accuracy
- Test on diverse text samples
- Document model performance metrics

### Content Library Expansion

Adding new content:
- Verify content appropriateness
- Ensure diverse representation
- Test YouTube links
- Add effectiveness metadata

Content categories:
- Motivational speeches
- Calming music
- Funny clips
- Breathing exercises
- Inspirational scenes
- Workout suggestions

### DQN Agent Enhancements

Potential improvements:
- Alternative RL algorithms (PPO, A3C)
- Multi-objective reward functions
- User clustering for personalization
- Transfer learning between users

Requirements:
- Maintain backward compatibility
- Document hyperparameter changes
- Include performance benchmarks
- Ensure stable learning

### Frontend Improvements

UI/UX contributions:
- Accessibility improvements (WCAG 2.1)
- Mobile responsiveness
- Dark/light mode refinements
- Animation and transitions
- Internationalization (i18n)

Technical improvements:
- Performance optimizations
- State management improvements
- Component library development
- PWA features

### Safety & Ethics

Critical contribution area:
- Crisis detection improvements
- Content moderation
- Privacy enhancements
- Bias detection and mitigation

Requirements:
- Thorough testing
- Expert review for mental health content
- Documentation of safety measures
- Regular security audits

## Documentation

### Code Documentation

**Python Docstrings:**
```python
def process_feedback(
    interaction_id: int,
    mood_score: int,
    feedback_text: str | None = None
) -> dict:
    """Process user feedback and update RL agent.
    
    Args:
        interaction_id: ID of the interaction being rated
        mood_score: User's mood rating (1-5)
        feedback_text: Optional textual feedback
        
    Returns:
        Dictionary containing reward and learning metrics
        
    Raises:
        ValueError: If interaction not found or already rated
    """
```

**JavaScript JSDoc:**
```javascript
/**
 * Display emotion detection result with confidence
 * @param {Object} props
 * @param {string} props.emotion - Detected emotion
 * @param {number} props.confidence - Confidence percentage
 * @param {string} [props.className] - Additional CSS classes
 */
const EmotionDisplay = ({ emotion, confidence, className }) => {
  // Implementation
};
```

### API Documentation

Update API_DOCUMENTATION.md when:
- Adding new endpoints
- Changing request/response formats
- Modifying error responses
- Adding authentication requirements

## Review Process

### Code Review Checklist

**For Reviewers:**
- [ ] Code follows style guidelines
- [ ] Tests included and passing
- [ ] Documentation updated
- [ ] No security vulnerabilities
- [ ] Performance considerations addressed
- [ ] Accessibility requirements met (frontend)
- [ ] Mental health safety reviewed

**For Authors:**
- [ ] Self-review completed
- [ ] Tests added for new functionality
- [ ] Documentation updated
- [ ] CHANGELOG.md updated (if applicable)
- [ ] Breaking changes documented

### Review Timeline

- Initial review: 2-3 business days
- Follow-up reviews: 1-2 business days
- Security reviews: 3-5 business days

## Release Process

### Version Numbering

Follow Semantic Versioning (SemVer):
- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes

### Release Checklist

1. Update version in:
   - `app/config.py`
   - `frontend/package.json`
   - `CHANGELOG.md`

2. Run full test suite
3. Update documentation
4. Create release notes
5. Tag release: `git tag v1.2.3`
6. Push tags: `git push --tags`

## Community

### Communication Channels

- **GitHub Issues:** Bug reports, feature requests
- **GitHub Discussions:** General questions, ideas
- **Discord:** Real-time chat (link TBD)
- **Email:** contact@mindai.example.com

### Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in documentation

## Questions?

If you have questions:
1. Check existing documentation
2. Search closed issues
3. Ask in GitHub Discussions
4. Email maintainers

Thank you for contributing to MindAI!

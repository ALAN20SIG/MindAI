# MindAI Deployment Guide

## Overview

This guide covers deploying MindAI to production environments. The application consists of a FastAPI backend and React frontend that can be deployed together or separately.

## Deployment Options

### Option 1: Local Development (Default)
Best for: Development, testing, personal use

```bash
# Terminal 1 - Backend
cd mental-health
pip install -r requirements.txt
python run.py

# Terminal 2 - Frontend
cd mental-health/frontend
npm install
npm run dev
```

Access at:
- Frontend: http://localhost:5173
- API: http://localhost:8000

### Option 2: Docker Deployment
Best for: Production, consistency, easy scaling

**Dockerfile (Backend):**
```dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY app/ ./app/
COPY run.py .

# Download model (optional - can be done at runtime)
RUN python -c "from transformers import pipeline; pipeline('text-classification', model='j-hartmann/emotion-english-distilroberta-base')"

EXPOSE 8000

CMD ["python", "run.py"]
```

**Dockerfile (Frontend):**
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=sqlite:///data/mental_health.db
    volumes:
      - ./data:/app/data
    restart: unless-stopped

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
```

**Build and Run:**
```bash
docker-compose up --build
```

### Option 3: Cloud Deployment (AWS/GCP/Azure)

#### AWS Deployment

**Using Elastic Beanstalk:**

1. Install EB CLI:
```bash
pip install awsebcli
```

2. Initialize EB application:
```bash
eb init -p python-3.12 mindai-backend
```

3. Create environment:
```bash
eb create mindai-production
```

4. Deploy:
```bash
eb deploy
```

**Using ECS (Containerized):**

1. Push Docker images to ECR:
```bash
aws ecr get-login-password | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com

docker build -t mindai-backend .
docker tag mindai-backend:latest <account>.dkr.ecr.<region>.amazonaws.com/mindai-backend:latest
docker push <account>.dkr.ecr.<region>.amazonaws.com/mindai-backend:latest
```

2. Create ECS cluster and task definition
3. Configure Application Load Balancer
4. Deploy service

#### Google Cloud Platform

**Using Cloud Run:**

1. Build and push to Container Registry:
```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/mindai-backend
```

2. Deploy to Cloud Run:
```bash
gcloud run deploy mindai-backend \
  --image gcr.io/PROJECT_ID/mindai-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

#### Azure Deployment

**Using App Service:**

1. Create App Service:
```bash
az webapp up --name mindai-backend --runtime PYTHON:3.12
```

2. Configure environment variables in Azure Portal
3. Deploy code via GitHub Actions or ZIP deployment

## Environment Configuration

### Required Environment Variables

```bash
# Backend
DATABASE_URL=sqlite:///./mental_health.db
EMOTION_DEVICE=cpu  # or 'cuda' for GPU
EMOTION_MODEL_NAME=j-hartmann/emotion-english-distilroberta-base

# Optional: HuggingFace token for higher rate limits
HF_TOKEN=your_token_here

# Frontend (build-time)
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### Production Environment Variables

```bash
# Backend
DATABASE_URL=postgresql://user:pass@db-host:5432/mindai
SECRET_KEY=your-secret-key-here
CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Frontend
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
```

## Database Migration

### SQLite to PostgreSQL

1. Export SQLite data:
```bash
sqlite3 mental_health.db .dump > backup.sql
```

2. Convert and import to PostgreSQL:
```bash
# Use pgloader or manual conversion
pgloader sqlite:///path/to/mental_health.db postgresql://user:pass@host/dbname
```

3. Update DATABASE_URL environment variable

## SSL/TLS Configuration

### Using Let's Encrypt (Certbot)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Using CloudFlare

1. Point DNS to CloudFlare
2. Enable SSL/TLS in CloudFlare dashboard
3. Set encryption mode to "Full (strict)"

## Monitoring & Logging

### Backend Monitoring

**Using Prometheus + Grafana:**

```python
# Add to requirements.txt
prometheus-client
```

```python
# In main.py
from prometheus_client import Counter, Histogram, generate_latest

request_count = Counter('http_requests_total', 'Total HTTP requests')
request_duration = Histogram('http_request_duration_seconds', 'HTTP request duration')

@app.get("/metrics")
def metrics():
    return generate_latest()
```

### Frontend Monitoring

**Using Sentry:**

```javascript
// In main.jsx
import * as Sentry from '@sentry/react'

Sentry.init({
  dsn: 'your-sentry-dsn',
  environment: 'production'
})
```

## Scaling Considerations

### Horizontal Scaling

**Backend:**
- Use PostgreSQL instead of SQLite for concurrent access
- Deploy multiple API instances behind load balancer
- Use Redis for caching layer

**Frontend:**
- Static files served via CDN (CloudFront, CloudFlare)
- Enable gzip compression
- Implement service worker for offline support

### Vertical Scaling

**GPU Acceleration:**
```bash
# Use CUDA for emotion detection
EMOTION_DEVICE=cuda
```

**Memory Optimization:**
- Reduce batch size for DQN learning
- Limit replay buffer size
- Enable model quantization

## Backup & Recovery

### Database Backup

**Automated Daily Backups:**
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d)
sqlite3 /app/data/mental_health.db ".backup '/backups/backup_$DATE.db'"
aws s3 cp /backups/backup_$DATE.db s3://mindai-backups/
```

**Add to crontab:**
```bash
0 2 * * * /app/backup.sh
```

### Model Checkpoint Backup

```bash
# Backup DQN checkpoints
aws s3 cp dqn_checkpoint.pth s3://mindai-backups/models/
```

## Security Checklist

- [ ] Use HTTPS in production
- [ ] Set strong SECRET_KEY
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set up firewall rules
- [ ] Regular security updates
- [ ] Database encryption at rest
- [ ] Input validation and sanitization
- [ ] Crisis detection active
- [ ] Privacy policy displayed

## Troubleshooting

### Common Issues

**Backend won't start:**
```bash
# Check logs
docker logs mindai-backend

# Verify database permissions
ls -la data/

# Check port availability
netstat -tlnp | grep 8000
```

**Frontend build fails:**
```bash
# Clear npm cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Model loading slow:**
- Pre-download model during Docker build
- Use model caching directory
- Consider model quantization

**Database locked (SQLite):**
- Switch to PostgreSQL for production
- Reduce concurrent connections
- Implement connection pooling

## Health Checks

**Backend Health Endpoint:**
```python
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "emotion_detector": emotion_detector.is_ready,
        "database": check_db_connection(),
        "timestamp": datetime.now().isoformat()
    }
```

**Docker Health Check:**
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:8000/health || exit 1
```

## Cost Estimation

### AWS (Monthly)
- EC2 (t3.medium): ~$30
- RDS (db.t3.micro): ~$15
- S3 (storage): ~$5
- CloudFront: ~$10
- **Total**: ~$60/month

### GCP (Monthly)
- Cloud Run: ~$20 (pay per use)
- Cloud SQL: ~$15
- Cloud Storage: ~$5
- **Total**: ~$40/month

### Azure (Monthly)
- App Service (B1): ~$13
- Azure SQL: ~$15
- Blob Storage: ~$5
- **Total**: ~$33/month

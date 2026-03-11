# 🧠 Matching Service

ML-based matching and recommendation service cho EduMatch platform.

## 📋 Tổng quan

Matching Service là microservice lõi chịu trách nhiệm:
- ✅ Tính điểm tương thích (matching score) giữa applicant và opportunity
- 🎯 Gợi ý cơ hội phù hợp cho applicants (Premium)
- 👥 Gợi ý ứng viên tiềm năng cho opportunities (Premium)

## 🏗️ Kiến trúc

```
┌─────────────────────────────────────────────────────────────┐
│                    MATCHING SERVICE                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   FastAPI    │  │    Celery    │  │   RabbitMQ   │     │
│  │  API Server  │  │   Workers    │  │   Consumer   │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                 │              │
│         └─────────────────┴─────────────────┘              │
│                           │                                │
│                    ┌──────▼──────┐                         │
│                    │  PostgreSQL  │                         │
│                    │  (Features)  │                         │
│                    └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

### Components:

1. **FastAPI Server**: REST API endpoints
   - `POST /api/v1/match/score` - Tính điểm real-time (< 300ms)
   - `GET /api/v1/recommendations/applicant/{id}` - Gợi ý cho applicant (2-5s)
   - `GET /api/v1/recommendations/opportunity/{id}` - Gợi ý cho opportunity (2-5s)

2. **Celery Workers**: Background feature processing
   - Xử lý event `user.profile.updated`
   - Xử lý event `scholarship.created`
   - Xử lý event `scholarship.updated`

3. **RabbitMQ Consumer**: Event listener
   - Lắng nghe events từ RabbitMQ
   - Dispatch tasks đến Celery workers

4. **PostgreSQL**: Feature storage
   - Lưu applicant_features
   - Lưu opportunity_features
   - Cache matching_scores

## 🛠️ Tech Stack

- **Python 3.10+**
- **FastAPI** - Modern async web framework
- **Celery** - Distributed task queue
- **RabbitMQ** - Message broker
- **PostgreSQL** - Relational database
- **SQLAlchemy** - ORM
- **scikit-learn** - ML algorithms (TF-IDF, Cosine Similarity)
- **pandas & numpy** - Data processing

## 📦 Cài đặt

### Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run API server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run Celery worker (terminal 2)
celery -A app.celery_app worker --loglevel=info

# Run RabbitMQ consumer (terminal 3)
python -m app.consumer
```

### Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f matching-service
docker-compose logs -f matching-celery-worker
docker-compose logs -f matching-consumer

# Stop services
docker-compose down
```

## 🔌 API Endpoints

### 1. Calculate Matching Score

**Fast, rule-based scoring (< 300ms)**

```bash
POST /api/v1/match/score
Content-Type: application/json

{
  "applicantId": "uuid-123",
  "opportunityId": "uuid-456"
}
```

Response:
```json
{
  "overallScore": 82.5,
  "breakdown": {
    "gpaMatch": 100.0,
    "skillsMatch": 75.0,
    "researchMatch": 65.0
  }
}
```

### 2. Get Recommendations for Applicant

**Slow, ML-based (2-5s)**

```bash
GET /api/v1/recommendations/applicant/{applicantId}?limit=10&page=1
```

Response:
```json
{
  "metadata": {
    "total": 150,
    "page": 1,
    "limit": 10,
    "totalPages": 15
  },
  "data": [
    {
      "opportunityId": "uuid-opp-789",
      "matchingScore": 95.8
    },
    {
      "opportunityId": "uuid-opp-abc",
      "matchingScore": 92.1
    }
  ]
}
```

### 3. Get Recommendations for Opportunity

**Slow, ML-based (2-5s)**

```bash
GET /api/v1/recommendations/opportunity/{opportunityId}?limit=10&page=1
```

Response:
```json
{
  "metadata": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  },
  "data": [
    {
      "applicantId": "uuid-app-123",
      "matchingScore": 98.2
    },
    {
      "applicantId": "uuid-app-456",
      "matchingScore": 91.5
    }
  ]
}
```

## 📨 Event Processing

Service lắng nghe các events từ RabbitMQ:

### 1. user.profile.updated

```json
{
  "userId": "uuid",
  "gpa": 3.8,
  "major": "Computer Science",
  "university": "MIT",
  "yearOfStudy": 3,
  "skills": ["Python", "Machine Learning", "Data Science"],
  "researchInterests": ["AI", "NLP"]
}
```

### 2. scholarship.created

```json
{
  "opportunityId": "uuid",
  "opportunityType": "scholarship",
  "title": "AI Research Scholarship",
  "description": "...",
  "minGpa": 3.5,
  "requiredSkills": ["Python", "ML"],
  "preferredMajors": ["CS", "AI"],
  "researchAreas": ["Machine Learning", "Deep Learning"]
}
```

### 3. scholarship.updated

Same structure as `scholarship.created`

## 🧮 Matching Algorithms

### Rule-based Scoring (Fast)

Dùng cho API `/match/score`:

```python
Overall Score = 
  GPA Score (30%) + 
  Skills Match (50%) + 
  Research Match (20%)
```

- **GPA Score**: So sánh GPA với requirement
- **Skills Match**: Jaccard similarity + coverage
- **Research Match**: Overlap của research interests

### ML-based Scoring (Slow)

Dùng cho API `/recommendations/*`:

1. **TF-IDF Vectorization**: Convert text → vectors
2. **Cosine Similarity**: Calculate similarity scores
3. **Ranking**: Sort by score descending

## 🔄 Data Flow

### Async Feature Processing:

```
User Service
   │
   │ (1) User updates profile
   │
   ▼
RabbitMQ (event: user.profile.updated)
   │
   │ (2) Consumer receives event
   │
   ▼
Celery Worker
   │
   │ (3) Preprocess features
   │     - Vectorize skills
   │     - Vectorize research interests
   │
   ▼
PostgreSQL (Save applicant_features)
```

### Sync Recommendation:

```
Client
   │
   │ (1) GET /recommendations/applicant/123
   │
   ▼
FastAPI Server
   │
   │ (2) Read features from PostgreSQL
   │
   ▼
Matching Engine
   │
   │ (3) Calculate ML scores (on-the-fly)
   │     - Load vectors
   │     - Calculate cosine similarity
   │     - Rank results
   │
   ▼
Client (Returns Top N recommendations)
```

## 📊 Database Schema

### applicant_features

```sql
CREATE TABLE applicant_features (
  id UUID PRIMARY KEY,
  applicant_id VARCHAR(255) UNIQUE NOT NULL,
  gpa FLOAT,
  major VARCHAR(255),
  university VARCHAR(255),
  year_of_study INT,
  skills TEXT[],
  research_interests TEXT[],
  skills_vector JSONB,
  research_vector JSONB,
  combined_text TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  last_processed_at TIMESTAMP
);
```

### opportunity_features

```sql
CREATE TABLE opportunity_features (
  id UUID PRIMARY KEY,
  opportunity_id VARCHAR(255) UNIQUE NOT NULL,
  opportunity_type VARCHAR(50),
  title VARCHAR(500),
  description TEXT,
  min_gpa FLOAT,
  required_skills TEXT[],
  preferred_majors TEXT[],
  research_areas TEXT[],
  skills_vector JSONB,
  research_vector JSONB,
  combined_text TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  last_processed_at TIMESTAMP
);
```

### matching_scores (cache)

```sql
CREATE TABLE matching_scores (
  id UUID PRIMARY KEY,
  applicant_id VARCHAR(255) NOT NULL,
  opportunity_id VARCHAR(255) NOT NULL,
  overall_score FLOAT NOT NULL,
  gpa_score FLOAT,
  skills_score FLOAT,
  research_score FLOAT,
  calculated_at TIMESTAMP,
  expires_at TIMESTAMP
);
```

## 🧪 Testing

```bash
# Test API endpoints
curl http://localhost:8000/health
curl http://localhost:8000/docs  # Swagger UI

# Test score calculation
curl -X POST http://localhost:8000/api/v1/match/score \
  -H "Content-Type: application/json" \
  -d '{"applicantId":"test-123","opportunityId":"opp-456"}'

# Test recommendations
curl http://localhost:8000/api/v1/recommendations/applicant/test-123?limit=5
```

## 📈 Performance

- **Score API**: < 300ms (rule-based, fast)
- **Recommendation API**: 2-5 seconds (ML-based, acceptable)
- **Worker throughput**: ~100 events/minute
- **Scaling**: Stateless, can scale horizontally

## 🔐 Security

- ⚠️ APIs are **internal only** (no authentication)
- Premium check must be done by caller (User Service)
- Use API Gateway for external access

## 📝 Configuration

Environment variables (`.env`):

```env
DATABASE_URL=postgresql://user:pass@host:5432/db
RABBITMQ_HOST=rabbitmq
CELERY_BROKER_URL=amqp://guest:guest@rabbitmq:5672//
DEBUG=false
TFIDF_MAX_FEATURES=1000
RECOMMENDATION_DEFAULT_LIMIT=10
```

## 🚀 Production Considerations

### Scaling:

```yaml
# Scale API servers
docker-compose up -d --scale matching-service=3

# Scale workers
docker-compose up -d --scale matching-celery-worker=5
```

### Monitoring:

- Use Prometheus + Grafana
- Monitor queue lengths
- Track API latencies
- Alert on worker failures

### Optimization:

- Cache frequent recommendations (Redis)
- Batch vector calculations
- Use GPU for large-scale ML
- Implement approximate nearest neighbors (FAISS)

## 📚 Documentation

- API Docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Technical Spec: `../matchingdoc.txt`

## 🐛 Troubleshooting

### Worker not processing events

```bash
# Check RabbitMQ queues
docker exec rabbitmq rabbitmqctl list_queues

# Check worker logs
docker-compose logs matching-celery-worker
```

### API slow

```bash
# Check database indexes
# Check feature preprocessing status
# Consider caching
```

### Database connection issues

```bash
# Check database health
docker-compose logs matching-db

# Verify connection string
echo $DATABASE_URL
```

## 📞 Support

For issues and questions, check:
- Logs: `docker-compose logs matching-service`
- Health: `curl http://localhost:8000/health`
- Docs: `http://localhost:8000/docs`

---

**Version:** 1.2  
**Last Updated:** 2025-11-02

# API Gateway - Nginx Configuration

## Overview
This is the main entry point for the EduMatch microservices architecture. The Nginx API Gateway routes requests to backend services (Auth, Scholarship, Matching, Notification) and serves the Next.js frontend.

## ✅ **Current Configuration (Updated Nov 2025)**
- **Gateway Port**: `8080` (host) → `80` (container)
- **Frontend**: Next.js running locally or in Docker
- **All API calls**: `http://localhost:8080/api/*` → routed to backend services

## Architecture

```
┌─────────────┐
│   Clients   │
└──────┬──────┘
       │ Port 80
       ▼
┌─────────────────────────────────────┐
│      Nginx API Gateway              │
│  - Routing                          │
│  - Rate Limiting                    │
│  - CORS                             │
│  - Security Headers                 │
│  - WebSocket Support                │
└──────┬──────────────────────────────┘
       │
       ├──► User Service (Java)        :8080
       ├──► Matching Service (Python)  :8000
       ├──► Scholarship Service (Java) :8080
       ├──► Chat Service (Java)        :8080
       └──► Frontend (React)           :3000
```

## Service Routing Table

### User Service (Java Spring Boot)
| Path | Methods | Rate Limit | Description |
|------|---------|------------|-------------|
| `/api/auth/*` | POST | 5 req/min | Login, Register, Logout |
| `/api/users/*` | GET, PUT, DELETE | 100 req/min | User management |
| `/api/profiles/*` | GET, PUT | 100 req/min | Profile management |

### Matching Service (Python FastAPI)
| Path | Methods | Rate Limit | Description |
|------|---------|------------|-------------|
| `/api/v1/match/*` | POST | 20 req/min | ML-based scoring |
| `/api/v1/recommendations/*` | GET | 20 req/min | Get recommendations (60-90s timeout) |

### Scholarship Service (Java Spring Boot)
| Path | Methods | Rate Limit | Description |
|------|---------|------------|-------------|
| `/api/scholarships/*` | GET, POST, PUT, DELETE | 100 req/min | Scholarship CRUD |
| `/api/opportunities/*` | GET, POST | 100 req/min | Opportunity management |
| `/api/applications/*` | GET, POST, PUT | 100 req/min | Application tracking |

### Chat Service (Java Spring Boot)
| Path | Methods | Rate Limit | Description |
|------|---------|------------|-------------|
| `/api/messages/*` | GET, POST, DELETE | 100 req/min | Message operations |
| `/api/conversations/*` | GET, POST | 100 req/min | Conversation management |
| `/api/notifications/*` | GET, PUT | 100 req/min | Notification handling |
| `/api/ws/*` | WebSocket | N/A | Real-time chat (7 days timeout) |

### Frontend
| Path | Methods | Rate Limit | Description |
|------|---------|------------|-------------|
| `/` | GET | N/A | React.js application with hot reload |

### Gateway Health
| Path | Methods | Rate Limit | Description |
|------|---------|------------|-------------|
| `/health` | GET | N/A | Gateway health check |
| `/gateway/status` | GET | N/A | Gateway status details |

## Rate Limiting

The gateway implements three rate limiting zones:

1. **auth_limit**: 5 requests per minute
   - Applied to: `/api/auth/*`
   - Purpose: Prevent brute force attacks on login/register

2. **ml_limit**: 20 requests per minute
   - Applied to: `/api/v1/match/*`, `/api/v1/recommendations/*`
   - Purpose: Limit expensive ML operations

3. **api_limit**: 100 requests per minute
   - Applied to: All other API endpoints
   - Purpose: General API protection

When rate limit is exceeded, returns:
```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again later."
}
```

## Security Features

### CORS Configuration
```nginx
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

### Security Headers
```nginx
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
```

### Request Size Limits
- Maximum body size: 10MB
- Buffer size: 16k

## Timeout Configuration

| Service Type | Timeout | Reason |
|--------------|---------|--------|
| User, Scholarship, Chat | 30s | Standard CRUD operations |
| Matching (ML) | 60-90s | Heavy ML computations |
| WebSocket | 7 days | Persistent connections |

## Load Balancing

Each upstream service has:
- `max_fails`: 3 attempts
- `fail_timeout`: 30 seconds
- Automatic failover to healthy instances

## Error Handling

### Service Unavailable (502, 503, 504)
```json
{
  "error": "Service Unavailable",
  "message": "The requested service is temporarily unavailable. Please try again later."
}
```

### Not Found (404)
```json
{
  "error": "Not Found",
  "message": "The requested resource was not found."
}
```

## Deployment

### Using Docker Compose

1. **Build and start all services:**
```bash
docker-compose up --build
```

2. **Access the gateway:**
- API Gateway: http://localhost
- Frontend: http://localhost (proxied)
- RabbitMQ UI: http://localhost:15672

### Standalone Docker

1. **Build the gateway image:**
```bash
cd nginx-gateway
docker build -t edumatch-gateway .
```

2. **Run the container:**
```bash
docker run -d \
  --name api-gateway \
  -p 80:80 \
  --network edumatch-net \
  edumatch-gateway
```

## Testing

### Health Check
```bash
curl http://localhost/health
```
Expected: `200 OK`

### Authentication (Rate Limited - 5/min)
```bash
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

### Matching Service (Rate Limited - 20/min)
```bash
curl -X POST http://localhost/api/v1/match/score \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "applicant_id": 1,
    "opportunity_id": 1
  }'
```

### WebSocket Chat
```javascript
const ws = new WebSocket('ws://localhost/api/ws/chat?token=<jwt_token>');
ws.onopen = () => console.log('Connected');
ws.onmessage = (event) => console.log('Message:', event.data);
```

### Frontend
```bash
curl http://localhost/
```
Expected: React HTML

## Monitoring

### Check Nginx Logs
```bash
docker exec api-gateway tail -f /var/log/nginx/access.log
docker exec api-gateway tail -f /var/log/nginx/error.log
```

### Gateway Status
```bash
curl http://localhost/gateway/status
```

## Troubleshooting

### 502 Bad Gateway
- **Cause**: Backend service is down or unreachable
- **Solution**: Check backend service health, ensure containers are running
```bash
docker-compose ps
docker logs user-service
docker logs matching-service
```

### 429 Too Many Requests
- **Cause**: Rate limit exceeded
- **Solution**: Wait for rate limit window to reset (1 minute)
- **Temporary**: Adjust rate limits in `nginx.conf`

### Connection Timeout
- **Cause**: Backend service taking too long
- **Solution**: 
  - Check matching service logs (ML operations)
  - Increase timeout in nginx.conf if needed
  ```bash
  docker logs matching-service
  ```

### CORS Errors
- **Cause**: Missing or incorrect CORS headers
- **Solution**: Verify `Access-Control-Allow-Origin` in response
```bash
curl -I http://localhost/api/users
```

## Configuration Files

- `nginx.conf`: Main routing configuration
- `Dockerfile`: Container image definition
- `docker-compose.yml`: Multi-service orchestration (in parent directory)

## Performance Tuning

### Increase Worker Processes
```nginx
worker_processes auto;
worker_connections 1024;
```

### Enable Caching (Optional)
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m;
proxy_cache api_cache;
proxy_cache_valid 200 5m;
```

### Enable Compression
```nginx
gzip on;
gzip_types application/json text/css application/javascript;
gzip_min_length 1000;
```

## Security Considerations

1. **Production**: Replace `*` in CORS with specific domain
2. **HTTPS**: Add SSL/TLS configuration for production
3. **JWT Validation**: Consider adding Nginx JWT module for token validation
4. **IP Whitelisting**: Restrict admin endpoints to specific IPs
5. **DDoS Protection**: Add connection limiting per IP

## Next Steps

- [ ] Add SSL/TLS certificates for HTTPS
- [ ] Implement JWT validation at gateway level
- [ ] Add request/response logging middleware
- [ ] Set up Grafana/Prometheus for monitoring
- [ ] Implement circuit breaker pattern
- [ ] Add API versioning strategy
- [ ] Configure production CORS with specific origins
- [ ] Add rate limiting per user (not just IP)

## References

- Nginx Documentation: https://nginx.org/en/docs/
- Docker Compose: https://docs.docker.com/compose/
- EduMatch Architecture: ../MICROSERVICES_ARCHITECTURE.md

# Hướng dẫn Sử dụng Health Module

## 📋 Mục lục

- [Tổng quan](#tổng-quan)
- [Cài đặt](#cài-đặt)
- [Endpoints](#endpoints)
- [Health Checks](#health-checks)
- [Custom Health Indicators](#custom-health-indicators)
- [Monitoring và Alerting](#monitoring-và-alerting)
- [Troubleshooting](#troubleshooting)

## 🎯 Tổng quan

Health Module sử dụng `@nestjs/terminus` để cung cấp health check endpoints cho application. Module này giúp:

- ✅ Kiểm tra trạng thái database (PostgreSQL)
- ✅ Kiểm tra trạng thái Redis
- ✅ Kiểm tra memory usage
- ✅ Kiểm tra disk storage
- ✅ Cung cấp endpoints riêng cho từng health check

## 📦 Cài đặt

### Dependencies

Module đã được cài đặt với các dependencies sau:

```json
{
  "@nestjs/terminus": "^10.1.1",
  "@nestjs/axios": "^3.0.1"
}
```

### Module Structure

```
src/infrastructure/health/
├── health.module.ts
├── health.controller.ts
└── indicators/
    └── redis.health-indicator.ts
```

## 🌐 Endpoints

### 1. Overall Health Check

**GET** `/api/v1/health`

Kiểm tra tất cả health checks (database, Redis, memory, disk).

**Response:**

```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    },
    "redis": {
      "status": "up",
      "message": "Redis is healthy",
      "connectedClients": 2
    },
    "memory_heap": {
      "status": "up"
    },
    "memory_rss": {
      "status": "up"
    },
    "storage": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "database": {
      "status": "up"
    },
    "redis": {
      "status": "up",
      "message": "Redis is healthy",
      "connectedClients": 2
    },
    "memory_heap": {
      "status": "up"
    },
    "memory_rss": {
      "status": "up"
    },
    "storage": {
      "status": "up"
    }
  }
}
```

**Status Codes:**

- `200` - All checks passed
- `503` - One or more checks failed

### 2. Database Health Check

**GET** `/api/v1/health/db`

Chỉ kiểm tra database connection.

**Response:**

```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "database": {
      "status": "up"
    }
  }
}
```

### 3. Redis Health Check

**GET** `/api/v1/health/redis`

Chỉ kiểm tra Redis connection.

**Response:**

```json
{
  "status": "ok",
  "info": {
    "redis": {
      "status": "up",
      "message": "Redis is healthy",
      "connectedClients": 2
    }
  },
  "error": {},
  "details": {
    "redis": {
      "status": "up",
      "message": "Redis is healthy",
      "connectedClients": 2
    }
  }
}
```

### 4. Memory Health Check

**GET** `/api/v1/health/memory`

Kiểm tra memory usage (heap và RSS).

**Response:**

```json
{
  "status": "ok",
  "info": {
    "memory_heap": {
      "status": "up"
    },
    "memory_rss": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "memory_heap": {
      "status": "up"
    },
    "memory_rss": {
      "status": "up"
    }
  }
}
```

### 5. Disk Health Check

**GET** `/api/v1/health/disk`

Kiểm tra disk storage usage.

**Response:**

```json
{
  "status": "ok",
  "info": {
    "storage": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "storage": {
      "status": "up"
    }
  }
}
```

## 🔍 Health Checks

### Database Health Check

Sử dụng `TypeOrmHealthIndicator` để kiểm tra:

- ✅ Database connection status
- ✅ Database ping response

**Configuration:**

```typescript
() => this.db.pingCheck('database', { connection: this.connection });
```

### Redis Health Check

Sử dụng custom `RedisHealthIndicator` để kiểm tra:

- ✅ Redis connection status
- ✅ Redis ping response
- ✅ Connected clients count

**Implementation:**

```typescript
async isHealthy(key: string): Promise<HealthIndicatorResult> {
  const result = await this.redis.ping();
  if (result === 'PONG') {
    return this.getStatus(key, true, {
      message: 'Redis is healthy',
      status: 'up',
    });
  }
}
```

### Memory Health Check

Sử dụng `MemoryHealthIndicator` để kiểm tra:

- ✅ Heap memory usage (default: 150MB threshold)
- ✅ RSS memory usage (default: 150MB threshold)

**Configuration:**

```typescript
() => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024) // 150MB
() => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024) // 150MB
```

### Disk Health Check

Sử dụng `DiskHealthIndicator` để kiểm tra:

- ✅ Disk storage usage (default: 90% threshold)

**Configuration:**

```typescript
() =>
  this.disk.checkStorage('storage', {
    path: '/',
    thresholdPercent: 0.9, // 90% disk usage
  });
```

## 🛠️ Custom Health Indicators

### Tạo Custom Health Indicator

Ví dụ: Tạo health indicator cho external API:

```typescript
// src/infrastructure/health/indicators/api.health-indicator.ts
import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ApiHealthIndicator extends HealthIndicator {
  constructor(private httpService: HttpService) {
    super();
  }

  async isHealthy(key: string, url: string): Promise<HealthIndicatorResult> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, { timeout: 5000 }),
      );

      if (response.status === 200) {
        return this.getStatus(key, true, {
          message: 'API is healthy',
          status: 'up',
          responseTime: response.headers['x-response-time'],
        });
      }

      throw new Error(`API returned status ${response.status}`);
    } catch (error: any) {
      throw new HealthCheckError(
        'API health check failed',
        this.getStatus(key, false, {
          message: error.message || 'API connection failed',
          status: 'down',
        }),
      );
    }
  }
}
```

### Sử dụng Custom Indicator

```typescript
// health.controller.ts
import { ApiHealthIndicator } from './indicators/api.health-indicator';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private api: ApiHealthIndicator,
  ) {}

  @Get('external-api')
  @HealthCheck()
  checkExternalApi() {
    return this.health.check([
      () =>
        this.api.isHealthy('external-api', 'https://api.example.com/health'),
    ]);
  }
}
```

## 📊 Monitoring và Alerting

### Kubernetes Liveness và Readiness Probes

Sử dụng health endpoints cho Kubernetes:

```yaml
apiVersion: v1
kind: Pod
spec:
  containers:
    - name: app
      livenessProbe:
        httpGet:
          path: /api/v1/health
          port: 3000
        initialDelaySeconds: 30
        periodSeconds: 10
      readinessProbe:
        httpGet:
          path: /api/v1/health
          port: 3000
        initialDelaySeconds: 5
        periodSeconds: 5
```

### Docker Healthcheck

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/api/v1/health || exit 1
```

### Monitoring Tools

#### Prometheus

Có thể tích hợp với Prometheus để scrape metrics:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'nestjs-app'
    metrics_path: '/api/v1/health'
    static_configs:
      - targets: ['localhost:3001']
```

#### Custom Monitoring Script

```bash
#!/bin/bash
# health-check.sh

HEALTH_URL="http://localhost:3001/api/v1/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $RESPONSE -eq 200 ]; then
  echo "✅ Application is healthy"
  exit 0
else
  echo "❌ Application health check failed (Status: $RESPONSE)"
  exit 1
fi
```

## 🐛 Troubleshooting

### Database Health Check Fails

**Nguyên nhân:**

- Database connection không available
- Database credentials sai
- Network issues

**Giải pháp:**

1. Kiểm tra database connection trong `.env`
2. Kiểm tra database service đang chạy
3. Test connection manually:
   ```bash
   psql -h localhost -U postgres -d nestjs_demo
   ```

### Redis Health Check Fails

**Nguyên nhân:**

- Redis service không chạy
- Redis connection configuration sai
- Network issues

**Giải pháp:**

1. Kiểm tra Redis service:
   ```bash
   docker ps | grep redis
   ```
2. Kiểm tra Redis connection:
   ```bash
   redis-cli ping
   ```
3. Kiểm tra Redis config trong `.env`

### Memory Health Check Fails

**Nguyên nhân:**

- Memory usage vượt quá threshold
- Memory leak trong application

**Giải pháp:**

1. Tăng memory threshold trong `health.controller.ts`
2. Kiểm tra memory usage:
   ```bash
   node --max-old-space-size=512 your-app.js
   ```
3. Monitor memory với tools như `node-memwatch`

### Disk Health Check Fails

**Nguyên nhân:**

- Disk usage vượt quá threshold (90%)
- Disk space đầy

**Giải pháp:**

1. Kiểm tra disk usage:
   ```bash
   df -h
   ```
2. Tăng threshold hoặc cleanup disk space
3. Monitor disk usage thường xuyên

## 📖 Ví dụ Sử dụng

### cURL

```bash
# Overall health check
curl http://localhost:3001/api/v1/health

# Database health check
curl http://localhost:3001/api/v1/health/db

# Redis health check
curl http://localhost:3001/api/v1/health/redis

# Memory health check
curl http://localhost:3001/api/v1/health/memory

# Disk health check
curl http://localhost:3001/api/v1/health/disk
```

### JavaScript/TypeScript

```typescript
import axios from 'axios';

// Overall health check
const healthCheck = async () => {
  try {
    const response = await axios.get('http://localhost:3001/api/v1/health');
    console.log('Health Status:', response.data.status);
    console.log('Details:', response.data.details);
  } catch (error) {
    console.error('Health check failed:', error.message);
  }
};
```

### Docker Compose Health Check

```yaml
services:
  app:
    build: .
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3001/api/v1/health']
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

## 🔗 Tài liệu liên quan

- [NestJS Terminus Documentation](https://docs.nestjs.com/recipes/terminus)
- [Terminus GitHub](https://github.com/nestjs/terminus)
- [Health Check Best Practices](https://microservices.io/patterns/observability/health-check-api.html)

import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { SkipThrottle } from '../../common/decorators/skip-throttle.decorator';
import { RedisHealthIndicator } from './indicators/redis.health-indicator';
import { HealthResponseDto } from './dtos/health-response.dto';
import { ApiStandardResponse } from '../../common/decorators/api-response.decorator';

@ApiTags('health')
@Controller('health')
@SkipThrottle() // Skip rate limiting for health checks
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private redis: RedisHealthIndicator,
    @InjectConnection()
    private connection: Connection,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Health check (all services)', description: 'Kiểm tra sức khỏe của tất cả services: database, Redis, memory, disk.' })
  @ApiStandardResponse(HealthResponseDto, 'Health check results', 200)
  check() {
    return this.health.check([
      () => this.db.pingCheck('database', { connection: this.connection }),
      () => this.redis.isHealthy('redis'),
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),
      () =>
        this.disk.checkStorage('storage', {
          path: '/',
          thresholdPercent: 0.9,
        }),
    ]);
  }

  @Get('db')
  @HealthCheck()
  @ApiOperation({ summary: 'Database health check', description: 'Kiểm tra kết nối database.' })
  @ApiStandardResponse(HealthResponseDto, 'Database health check result', 200)
  checkDatabase() {
    return this.health.check([
      () => this.db.pingCheck('database', { connection: this.connection }),
    ]);
  }

  @Get('redis')
  @HealthCheck()
  @ApiOperation({ summary: 'Redis health check', description: 'Kiểm tra kết nối Redis.' })
  @ApiStandardResponse(HealthResponseDto, 'Redis health check result', 200)
  checkRedis() {
    return this.health.check([() => this.redis.isHealthy('redis')]);
  }

  @Get('memory')
  @HealthCheck()
  @ApiOperation({ summary: 'Memory health check', description: 'Kiểm tra memory usage (heap và RSS).' })
  @ApiStandardResponse(HealthResponseDto, 'Memory health check result', 200)
  checkMemory() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),
    ]);
  }

  @Get('disk')
  @HealthCheck()
  @ApiOperation({ summary: 'Disk health check', description: 'Kiểm tra disk storage usage.' })
  @ApiStandardResponse(HealthResponseDto, 'Disk health check result', 200)
  checkDisk() {
    return this.health.check([
      () =>
        this.disk.checkStorage('storage', {
          path: '/',
          thresholdPercent: 0.9,
        }),
    ]);
  }
}

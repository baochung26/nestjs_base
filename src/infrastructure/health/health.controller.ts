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
  @ApiResponse({ status: 200, type: HealthResponseDto, description: 'Health check results' })
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
  @ApiResponse({ status: 200, type: HealthResponseDto, description: 'Database health check result' })
  checkDatabase() {
    return this.health.check([
      () => this.db.pingCheck('database', { connection: this.connection }),
    ]);
  }

  @Get('redis')
  @HealthCheck()
  @ApiOperation({ summary: 'Redis health check', description: 'Kiểm tra kết nối Redis.' })
  @ApiResponse({ status: 200, type: HealthResponseDto, description: 'Redis health check result' })
  checkRedis() {
    return this.health.check([() => this.redis.isHealthy('redis')]);
  }

  @Get('memory')
  @HealthCheck()
  @ApiOperation({ summary: 'Memory health check', description: 'Kiểm tra memory usage (heap và RSS).' })
  @ApiResponse({ status: 200, type: HealthResponseDto, description: 'Memory health check result' })
  checkMemory() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),
    ]);
  }

  @Get('disk')
  @HealthCheck()
  @ApiOperation({ summary: 'Disk health check', description: 'Kiểm tra disk storage usage.' })
  @ApiResponse({ status: 200, type: HealthResponseDto, description: 'Disk health check result' })
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

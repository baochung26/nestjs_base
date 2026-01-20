import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CleanupScheduler } from './tasks/cleanup.scheduler';
import { RetryScheduler } from './tasks/retry.scheduler';
import { SyncScheduler } from './tasks/sync.scheduler';
import { QueueModule } from '../queue/queue.module';
import { CacheModule } from '../cache/cache.module';
import { DatabaseModule } from '../database/database.module';
import { User } from '../../modules/users/entities/user.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    QueueModule,
    CacheModule,
    DatabaseModule,
    TypeOrmModule.forFeature([User]),
  ],
  providers: [CleanupScheduler, RetryScheduler, SyncScheduler],
  exports: [ScheduleModule],
})
export class SchedulerModule {}

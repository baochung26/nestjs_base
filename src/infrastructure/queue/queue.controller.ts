import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { QueueService } from './queue.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../modules/users/entities/user.entity';
import { EmailJobData, NotificationJobData, QueueName } from './queue.types';

@ApiExcludeController()
@Controller('queue')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Get('stats')
  async getStats() {
    return this.queueService.getAllQueuesStats();
  }

  @Get('stats/:queueName')
  async getQueueStats(@Param('queueName') queueName: QueueName) {
    return this.queueService.getQueueStats(queueName);
  }

  @Post('email')
  async addEmailJob(@Body() data: EmailJobData) {
    const job = await this.queueService.addEmailJob(data);
    return {
      message: 'Email job added successfully',
      jobId: job.id,
    };
  }

  @Post('notification')
  async addNotificationJob(@Body() data: NotificationJobData) {
    const job = await this.queueService.addNotificationJob(data);
    return {
      message: 'Notification job added successfully',
      jobId: job.id,
    };
  }

  @Delete('clean/:queueName')
  async cleanQueue(
    @Param('queueName') queueName: QueueName,
    @Body() body: { type?: 'completed' | 'failed'; grace?: number },
  ) {
    const { type = 'completed', grace = 1000 } = body;

    if (type === 'completed') {
      await this.queueService.cleanCompletedJobs(queueName, grace);
    } else {
      await this.queueService.cleanFailedJobs(queueName, grace);
    }

    return {
      message: `Cleaned ${type} jobs from ${queueName} queue`,
    };
  }
}

import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { QueueService } from './queue.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../modules/users/entities/user.entity';

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
  async getQueueStats(@Param('queueName') queueName: string) {
    return this.queueService.getQueueStats(queueName);
  }

  @Post('email')
  async addEmailJob(
    @Body()
    data: {
      to: string;
      subject: string;
      template?: string;
      data?: any;
    },
  ) {
    const job = await this.queueService.addEmailJob(data);
    return {
      message: 'Email job added successfully',
      jobId: job.id,
    };
  }

  @Post('notification')
  async addNotificationJob(
    @Body()
    data: {
      userId: string;
      type: string;
      message: string;
      data?: any;
    },
  ) {
    const job = await this.queueService.addNotificationJob(data);
    return {
      message: 'Notification job added successfully',
      jobId: job.id,
    };
  }

  @Delete('clean/:queueName')
  async cleanQueue(
    @Param('queueName') queueName: string,
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

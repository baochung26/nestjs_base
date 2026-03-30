import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bull';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter.js';
import { ExpressAdapter } from '@bull-board/express';
import { BULL_BOARD_DEFAULT_PATH } from './bull-board/bull-board.constants';

@Injectable()
export class BullBoardService {
  private readonly serverAdapter: ExpressAdapter;

  constructor(
    @InjectQueue('default') private readonly defaultQueue: Queue,
    @InjectQueue('email') private readonly emailQueue: Queue,
    @InjectQueue('notification') private readonly notificationQueue: Queue,
    private readonly configService: ConfigService,
  ) {
    const basePath =
      this.configService.get('bullBoard.path') ?? BULL_BOARD_DEFAULT_PATH;

    this.serverAdapter = new ExpressAdapter();
    this.serverAdapter.setBasePath(basePath);

    createBullBoard({
      queues: [
        new BullAdapter(this.defaultQueue),
        new BullAdapter(this.emailQueue),
        new BullAdapter(this.notificationQueue),
      ],
      serverAdapter: this.serverAdapter,
    });
  }

  getRouter() {
    return this.serverAdapter.getRouter();
  }
}

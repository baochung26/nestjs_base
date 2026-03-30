import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import { BullBoardService } from '../bull-board.service';
import { createBullBoardAuthMiddlewareFromConfig } from './bull-board-auth.middleware';
import { BULL_BOARD_DEFAULT_PATH } from './bull-board.constants';

/**
 * Service đảm nhiệm mount Bull Board UI vào NestJS application
 * Encapsulates toàn bộ logic: auth middleware + Express router
 */
@Injectable()
export class BullBoardSetupService {
  constructor(
    private readonly bullBoardService: BullBoardService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Mount Bull Board UI lên Express app
   * Chỉ mount khi: development mode và bullBoard.enabled = true
   */
  mount(app: INestApplication): boolean {
    const isDevelopment = this.configService.get('app.env') !== 'production';
    const isEnabled = this.configService.get('bullBoard.enabled') ?? true;

    if (!isDevelopment || !isEnabled) {
      return false;
    }

    const path =
      this.configService.get('bullBoard.path') ?? BULL_BOARD_DEFAULT_PATH;
    const expressApp = app.getHttpAdapter().getInstance();

    const authMiddleware = createBullBoardAuthMiddlewareFromConfig(
      this.configService,
    );
    expressApp.use(path, authMiddleware);
    expressApp.use(path, this.bullBoardService.getRouter());

    return true;
  }

  /**
   * Lấy path Bull Board để log
   */
  getPath(): string {
    return this.configService.get('bullBoard.path') ?? BULL_BOARD_DEFAULT_PATH;
  }
}

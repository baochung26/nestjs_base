/**
 * Bull Board module - exports for queue monitoring UI
 */
export { BullBoardSetupService } from './bull-board-setup.service';
export { createBullBoardAuthMiddleware, createBullBoardAuthMiddlewareFromConfig } from './bull-board-auth.middleware';
export type { BullBoardAuthOptions } from './bull-board-auth.middleware';
export { renderBullBoardUnauthorizedHtml } from './bull-board-unauthorized.view';
export { BULL_BOARD_DEFAULT_PATH, BULL_BOARD_KEY_HEADER } from './bull-board.constants';

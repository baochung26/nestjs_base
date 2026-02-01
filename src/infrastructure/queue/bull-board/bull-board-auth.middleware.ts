import { Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'crypto';
import { renderBullBoardUnauthorizedHtml } from './bull-board-unauthorized.view';
import { BULL_BOARD_KEY_HEADER } from './bull-board.constants';

export interface BullBoardAuthOptions {
  secretKey: string;
}

/**
 * So sánh string an toàn với timing (tránh timing attack)
 */
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Tạo Express middleware bảo vệ Bull Board bằng secret key
 * Key có thể truyền qua: ?key=XXX hoặc header X-Bull-Board-Key
 */
export function createBullBoardAuthMiddleware(options: BullBoardAuthOptions) {
  const { secretKey } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!secretKey) {
      next();
      return;
    }

    const key = extractKey(req);

    if (!key || !secureCompare(key, secretKey)) {
      res.status(401).send(
        renderBullBoardUnauthorizedHtml('Invalid or missing key'),
      );
      return;
    }

    next();
  };
}

/**
 * Factory sử dụng ConfigService - dùng trong NestJS context
 */
export function createBullBoardAuthMiddlewareFromConfig(
  configService: { get: (key: string, defaultValue?: string) => string | undefined },
) {
  const secretKey = configService.get('bullBoard.secretKey', '') ?? '';

  return createBullBoardAuthMiddleware({ secretKey });
}

function extractKey(req: Request): string | null {
  const headerKey = req.headers[BULL_BOARD_KEY_HEADER];
  if (typeof headerKey === 'string') {
    return headerKey;
  }

  const queryKey = req.query.key;
  if (typeof queryKey === 'string') {
    return queryKey;
  }

  return null;
}

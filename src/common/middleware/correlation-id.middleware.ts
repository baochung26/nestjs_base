import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Get correlation ID from header or generate new one
    const correlationId =
      req.headers['x-correlation-id'] || uuidv4();

    // Set correlation ID in request
    req.id = correlationId as string;
    req.headers['x-correlation-id'] = correlationId as string;

    // Set correlation ID in response header
    res.setHeader('x-correlation-id', correlationId as string);

    next();
  }
}

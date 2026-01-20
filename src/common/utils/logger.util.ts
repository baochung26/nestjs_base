import { Injectable, Inject } from '@nestjs/common';
import { Logger } from 'nestjs-pino';

/**
 * Helper để inject logger vào services
 * Sử dụng: constructor(@InjectLogger() private readonly logger: Logger) {}
 */
export const InjectLogger = () => Inject(Logger);

/**
 * Base service với logger
 */
@Injectable()
export abstract class BaseService {
  protected logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }
}

import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { ERROR_MESSAGES } from '../constants';

/**
 * Custom ParseIntPipe với error handling tốt hơn
 * Parse string to integer và validate
 */
@Injectable()
export class ParseIntPipe implements PipeTransform<string, number> {
  constructor(
    private readonly min?: number,
    private readonly max?: number,
  ) {}

  transform(value: string, metadata: ArgumentMetadata): number {
    if (value === undefined || value === null || value === '') {
      throw new BadRequestException(
        ERROR_MESSAGES.VALIDATION_FAILED || 'Validation failed',
      );
    }

    const val = parseInt(value, 10);

    if (isNaN(val)) {
      throw new BadRequestException(
        `${metadata.data || 'Value'} must be a number`,
      );
    }

    if (this.min !== undefined && val < this.min) {
      throw new BadRequestException(
        `${metadata.data || 'Value'} must be greater than or equal to ${this.min}`,
      );
    }

    if (this.max !== undefined && val > this.max) {
      throw new BadRequestException(
        `${metadata.data || 'Value'} must be less than or equal to ${this.max}`,
      );
    }

    return val;
  }
}

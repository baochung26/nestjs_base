import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate as uuidValidate } from 'uuid';

/**
 * Custom ParseUUIDPipe để validate UUID format
 */
@Injectable()
export class ParseUUIDPipe implements PipeTransform<string, string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    if (!value) {
      throw new BadRequestException(
        `${metadata.data || 'Parameter'} is required`,
      );
    }

    if (!uuidValidate(value)) {
      throw new BadRequestException(
        `${metadata.data || 'Parameter'} must be a valid UUID`,
      );
    }

    return value;
  }
}

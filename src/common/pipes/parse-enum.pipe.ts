import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';

/**
 * Custom ParseEnumPipe để validate enum values
 */
@Injectable()
export class ParseEnumPipe<T = any> implements PipeTransform<string, T> {
  constructor(
    private readonly enumObject: Record<string, T>,
    private readonly enumName?: string,
  ) {}

  transform(value: string, metadata: ArgumentMetadata): T {
    if (!value) {
      throw new BadRequestException(
        `${metadata.data || 'Parameter'} is required`,
      );
    }

    const enumValues = Object.values(this.enumObject);
    if (!enumValues.includes(value as T)) {
      const validValues = enumValues.join(', ');
      throw new BadRequestException(
        `${metadata.data || 'Parameter'} must be one of: ${validValues}`,
      );
    }

    return value as T;
  }
}

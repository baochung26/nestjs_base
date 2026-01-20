import { plainToInstance } from 'class-transformer';
import {
  ClassConstructor,
  validate,
  ValidationError,
} from 'class-validator';
import { ValidationException } from '../shared/errors/custom-exceptions';

export async function validateDto<T extends object>(
  dto: ClassConstructor<T>,
  plain: any,
): Promise<T> {
  const instance = plainToInstance(dto, plain);
  const errors = await validate(instance);

  if (errors.length > 0) {
    const messages = errors.map((error) =>
      Object.values(error.constraints || {}).join(', '),
    );
    throw new ValidationException(messages);
  }

  return instance;
}

export function createValidationExceptionFactory() {
  return (errors: ValidationError[]) => {
    const messages = errors.map((error) =>
      Object.values(error.constraints || {}).join(', '),
    );
    return new ValidationException(messages);
  };
}

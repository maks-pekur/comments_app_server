import { ClassConstructor, plainToClass } from 'class-transformer';
import { validateSync, ValidationError } from 'class-validator';
import { bad_request } from './errors';

export function validateDTO<T>(
  type: ClassConstructor<T>,
  value: unknown,
  skip_missing_properties = true,
) {
  const errors: ValidationError[] = validateSync(
    plainToClass(type, value) as object,
    {
      skipMissingProperties: skip_missing_properties,
      whitelist: true,
      forbidNonWhitelisted: true,
    },
  );

  if (errors.length > 0) {
    const errorDetails = errors.map((error) => ({
      property: error.property,
      constraints: error.constraints,
    }));

    throw bad_request(`Validation failed: ${JSON.stringify(errorDetails)}`);
  }
}

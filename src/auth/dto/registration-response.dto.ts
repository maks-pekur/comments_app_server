import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class RegistrationResponseDTO {
  @ApiProperty({
    required: true,
    type: String,
    description: 'Status of the registration',
    example: 'success',
  })
  @IsString()
  public readonly status!: string;

  @ApiProperty({
    required: true,
    type: String,
    description: 'Unique identifier of the registered user',
    example: 'f1e4b0c8-d9a2-45cb-b12e-123456789abc',
  })
  @IsUUID('4', { message: 'Invalid UUID format' })
  public readonly id!: string;
}

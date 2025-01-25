import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class RegistrationDTO {
  @ApiProperty({
    required: true,
    description: 'Email address of the user',
  })
  @IsString()
  @Length(4, 32)
  public readonly email!: string;

  @ApiProperty({
    required: true,
    description: 'Username of the user',
  })
  @IsString()
  @Length(4, 32)
  public readonly username!: string;

  @ApiProperty({
    required: true,
    description: 'Password for the user',
  })
  @Length(4, 32)
  public readonly password!: string;
}

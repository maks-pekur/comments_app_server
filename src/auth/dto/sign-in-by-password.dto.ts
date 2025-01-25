import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class SignInByPasswordDTO {
  @ApiProperty({
    description: 'Email',
    example: 'user@example.com',
    required: true,
  })
  @IsEmail()
  public readonly email!: string;

  @ApiProperty({
    description: 'Password',
    example: 'password123',
    required: true,
  })
  @IsString()
  @Length(6, 32)
  public readonly password!: string;
}

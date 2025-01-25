import { ApiProperty } from '@nestjs/swagger';
import { IsJWT } from 'class-validator';

export class SignInByRefreshTokenDTO {
  @ApiProperty({
    description: 'JWT token used for refreshing access',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    required: true,
  })
  @IsJWT()
  public readonly refresh_token!: string;
}

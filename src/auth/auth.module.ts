import { Module } from '@nestjs/common';

import { JwtModule } from '../jwt/jwt.module';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RefreshTokenModule } from './refresh-token/refresh-token.module';

@Module({
  imports: [UserModule, RefreshTokenModule, JwtModule],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [UserModule, RefreshTokenModule],
})
export class AuthModule {}

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Algorithm, sign, SignOptions, verify } from 'jsonwebtoken';
import { v4 } from 'uuid';
import {
  access_token_expired_signature,
  refresh_token_expired_signature,
} from '../utils/errors';

@Injectable()
export class JwtService {
  constructor(private readonly config: ConfigService) {}

  public generate<T extends object>(payload: T, jwtid?: string): string {
    const secretKey = this.config.getOrThrow<string>('JWT_SECRET_KEY');
    const algorithm = this.config.getOrThrow<Algorithm>('JWT_ALGORITHM');
    const expiresInMinutes = this.config.getOrThrow<number>(
      'JWT_ACCESS_TOKEN_LIFETIME_IN_MINUTES',
    );

    const options: SignOptions = {
      jwtid: jwtid ?? v4(),
      expiresIn: expiresInMinutes * 60,
      algorithm,
    };

    return sign(payload, secretKey, options);
  }

  public verify<T>(jwt_token: string, is_access_token = true): T {
    try {
      const secretKey = this.config.getOrThrow<string>('JWT_SECRET_KEY');
      return verify(jwt_token, secretKey) as T;
    } catch (error) {
      if (is_access_token) {
        throw access_token_expired_signature();
      } else {
        throw refresh_token_expired_signature();
      }
    }
  }
}

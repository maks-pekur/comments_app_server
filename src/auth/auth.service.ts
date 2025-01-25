import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import { JwtService } from '../jwt/jwt.service';
import { IJwtPayload, User } from '../user/user.entity';
import { checkPassword, passwordToHash } from '../utils/bcrypt';
import { authorization_failed, bad_request } from '../utils/errors';
import { RefreshToken } from './refresh-token/refresh-token.entity';

export interface IJwtToken {
  iat: number;
  exp: number;
  jti: string;
}

export interface IAccessToken extends IJwtToken {
  current_user: IJwtPayload;
  token_type: 'access';
}

export interface IRefreshToken extends IJwtToken {
  current_user: { id: string };
  token_type: 'refresh';
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly data_source: DataSource,
  ) {}

  public async registration(email: string, username: string, password: string) {
    return this.data_source.transaction(async (entity_manager) => {
      const normalizedEmail = email.trim().toLowerCase();

      const exist_user = await entity_manager
        .getRepository(User)
        .findOne({ where: { email: normalizedEmail } });

      if (exist_user) {
        throw bad_request('User with this email already exists');
      }

      const user_dto = {
        email: normalizedEmail,
        username,
        encrypted_password: passwordToHash(password),
      };

      const inserted_user = await entity_manager
        .getRepository(User)
        .insert(user_dto);

      return {
        user_id: inserted_user.identifiers[0].id,
        message: 'Registration successful',
      };
    });
  }

  public async login(email: string, password: string) {
    return this.data_source.transaction(async (entity_manager) => {
      const user = await entity_manager
        .getRepository(User)
        .findOne({ where: { email: email.trim().toLowerCase() } });

      if (!user || !checkPassword(user.encrypted_password, password)) {
        throw authorization_failed();
      }

      return this.generateJwt(entity_manager, user);
    });
  }

  public async refreshAccessToken(refresh_token: string) {
    return this.data_source.transaction(async (entity_manager) => {
      const { current_user, token_type, jti } = this.jwt.verify<IRefreshToken>(
        refresh_token,
        false,
      );

      if (!token_type || token_type !== 'refresh') {
        throw authorization_failed();
      }

      const deleted_token = await entity_manager
        .getRepository(RefreshToken)
        .delete({ id: jti, user_id: current_user.id });

      if (!deleted_token.affected) {
        throw authorization_failed();
      }

      const user = await entity_manager
        .getRepository(User)
        .findOne({ where: { id: current_user.id } });

      if (!user) {
        throw authorization_failed();
      }

      return this.generateJwt(entity_manager, user);
    });
  }

  public async logout(refresh_token: string) {
    return this.data_source.transaction(async (entity_manager) => {
      const { jti } = this.jwt.verify<IRefreshToken>(refresh_token, false);

      const result = await entity_manager
        .getRepository(RefreshToken)
        .delete({ id: jti });

      if (!result.affected) {
        throw authorization_failed('Failed to logout: token not found');
      }

      return { message: 'Logout successful' };
    });
  }

  private async generateJwt(entity_manager: EntityManager, user: User) {
    const refresh = await entity_manager
      .getRepository(RefreshToken)
      .save({ user_id: user.id });

    const access_token = this.jwt.generate({
      current_user: user.getJwtPayload(),
      token_type: 'access',
    });
    const refresh_token = this.jwt.generate(
      { current_user: user.getJwtPayload(), token_type: 'refresh' },
      refresh.id,
    );

    return {
      access_token,
      refresh_token,
    };
  }
}

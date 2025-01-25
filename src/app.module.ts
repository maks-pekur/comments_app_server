import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ENV_FILE_PATHS, EXPAND_VARIABLES } from './app.env';
import { AuthMiddleware } from './auth/auth.middleware';
import { AuthModule } from './auth/auth.module';
import { JwtModule } from './jwt/jwt.module';
import { RedisModule } from './redis/redis.module';
import { TypeOrmModule } from './typeorm/typeorm.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: EXPAND_VARIABLES,
      envFilePath: ENV_FILE_PATHS,
    }),
    RedisModule,
    JwtModule,
    TypeOrmModule.forRoot(),
    AuthModule,
    UserModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
  public configure(consumer: MiddlewareConsumer): void | MiddlewareConsumer {
    consumer.apply(AuthMiddleware).forRoutes(
      {
        path: 'upload',
        method: RequestMethod.ALL,
      },
      {
        path: 'comments',
        method: RequestMethod.POST,
      },
      {
        path: 'comments',
        method: RequestMethod.PUT,
      },
      {
        path: 'comments',
        method: RequestMethod.DELETE,
      },
    );
  }
}

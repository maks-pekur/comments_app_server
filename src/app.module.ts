import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ENV_FILE_PATHS, EXPAND_VARIABLES } from './app.env';
import { JwtModule } from './jwt/jwt.module';
import { RedisModule } from './redis/redis.module';
import { TypeOrmModule } from './typeorm/typeorm.module';

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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

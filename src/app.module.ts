import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ENV_FILE_PATHS, EXPAND_VARIABLES } from './app.env';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: EXPAND_VARIABLES,
      envFilePath: ENV_FILE_PATHS,
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import helmet from 'helmet';

import { AppModule } from './app.module';

async function bootstrap() {
  const server = express();

  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    bodyParser: true,
  });

  const config = app.get(ConfigService);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  await app
    .listen(parseInt(config.getOrThrow<string>('APP_PORT'), 10))
    .then(() => {
      console.log(
        `${config.getOrThrow<string>('APP_NAME')} listening on http://localhost:${config.getOrThrow<string>('APP_PORT')}`,
      );

      console.log(
        `${config.getOrThrow<string>('APP_NAME')} listening on ws://localhost:${config.getOrThrow<string>('WS_PORT')}${config.getOrThrow<string>('WS_PATH')}`,
      );
    });
}

bootstrap();

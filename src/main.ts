import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { CorsMiddleware } from './cors/cors.middleware';

async function bootstrap() {
  const server = express();

  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    bodyParser: true,
  });

  const config = app.get(ConfigService);
  // const redis = app.get(RedisService);
  // const jwt = app.get(JwtService);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.use(cookieParser());

  app.enableCors(
    CorsMiddleware({
      allowed_origins: JSON.parse(
        config.getOrThrow<string>('CORS_ALLOWED_ORIGINS'),
      ),
      allowed_methods: JSON.parse(
        config.getOrThrow<string>('CORS_ALLOWED_METHODS'),
      ),
      allowed_paths: JSON.parse(
        config.getOrThrow<string>('CORS_ALLOWED_PATHS'),
      ),
      credentials: config.getOrThrow<boolean>('CORS_CREDENTIALS'),
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  const options = new DocumentBuilder()
    .setTitle('CommentsApp')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('swagger', app, document);

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

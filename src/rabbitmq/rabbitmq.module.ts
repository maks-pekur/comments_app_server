import { DiscoveryModule } from '@golevelup/nestjs-discovery';
import {
  MessageHandlerErrorBehavior,
  RabbitMQModule as NestJSRabbitMQ,
  RabbitMQConfig,
} from '@golevelup/nestjs-rabbitmq';
import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { RabbitMQDiscovery } from './rabbitmq.discovery';
import { RabbitMQInitializer } from './rabbitmq.initializer';
import { RabbitMQService } from './rabbitmq.service';

@Global()
@Module({})
export class RabbitMQModule {
  public static forRoot(options: Partial<RabbitMQConfig> = {}): DynamicModule {
    return {
      module: RabbitMQModule,
      global: true,
      imports: [
        DiscoveryModule,
        NestJSRabbitMQ.forRootAsync({
          useFactory: (config: ConfigService) => {
            const RABBITMQ_PREFIX = config.get<string>('RABBITMQ_PREFIX');
            const RABBITMQ_EXCHANGE =
              config.getOrThrow<string>('RABBITMQ_EXCHANGE');
            const RABBITMQ_USERNAME =
              config.getOrThrow<string>('RABBITMQ_USERNAME');
            const RABBITMQ_PASSWORD =
              config.getOrThrow<string>('RABBITMQ_PASSWORD');
            const RABBITMQ_HOST = config.getOrThrow<string>('RABBITMQ_HOST');
            const RABBITMQ_PORT = config.getOrThrow<string>('RABBITMQ_PORT');
            const RABBITMQ_VHOST = config.getOrThrow<string>('RABBITMQ_VHOST');

            const default_options: RabbitMQConfig = {
              exchanges: [
                {
                  name: RABBITMQ_EXCHANGE,
                  type: 'direct',
                  options: { durable: true },
                },
              ],
              uri: `amqp://${RABBITMQ_USERNAME}:${RABBITMQ_PASSWORD}@${RABBITMQ_HOST}:${RABBITMQ_PORT}/${RABBITMQ_VHOST}`,
              prefetchCount: 30,
              defaultSubscribeErrorBehavior: MessageHandlerErrorBehavior.NACK,
              connectionInitOptions: { wait: true, timeout: 10000 },
              ...options,
            };

            default_options.exchanges?.forEach((exchange, idx) => {
              default_options.exchanges![idx] = {
                name: `${RABBITMQ_PREFIX}${exchange.name}`,
                type: exchange.type ?? 'direct',
                options: exchange.options || { durable: true },
              };
            });

            return default_options;
          },
          inject: [ConfigService],
        }),
      ],
      providers: [RabbitMQDiscovery, RabbitMQService, RabbitMQInitializer],
      exports: [RabbitMQService],
    };
  }
}

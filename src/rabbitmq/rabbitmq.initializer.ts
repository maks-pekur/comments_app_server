import { DiscoveryService } from '@golevelup/nestjs-discovery';
import {
  AmqpConnection,
  RABBIT_HANDLER,
  RabbitHandlerConfig,
} from '@golevelup/nestjs-rabbitmq';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RabbitMQInitializer implements OnModuleInit {
  constructor(
    private readonly config: ConfigService,
    private readonly connection: AmqpConnection,
    private readonly discover: DiscoveryService,
  ) {}

  public async onModuleInit() {
    const RABBITMQ_PREFIX = this.config.get<string>('RABBITMQ_PREFIX');
    const RABBITMQ_EXCHANGE =
      this.config.getOrThrow<string>('RABBITMQ_EXCHANGE');

    const rabbit_meta =
      await this.discover.providerMethodsWithMetaAtKey<RabbitHandlerConfig>(
        RABBIT_HANDLER,
      );

    const exchanges = rabbit_meta.reduce<Set<string>>((acc, curr) => {
      if (
        curr.meta.exchange &&
        !curr.meta.exchange.startsWith(`${RABBITMQ_PREFIX}${RABBITMQ_EXCHANGE}`)
      ) {
        acc.add(curr.meta.exchange);
      }
      return acc;
    }, new Set([]));

    await new Promise((resolve) => {
      this.connection.managedChannel.waitForConnect(async () => {
        for (const exchange of exchanges) {
          await this.connection.channel.assertExchange(exchange, 'direct');
        }
        resolve(true);
      });
    });
  }
}

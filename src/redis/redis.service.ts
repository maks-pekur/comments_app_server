import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisKey } from 'ioredis';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { v4 } from 'uuid';

import { RedisClient } from './redis.client';

export interface IRedisSubscribeMessage {
  readonly message: string;
  readonly channel: string;
}

const REDIS_EXPIRE_TIME_IN_SECONDS = 7 * 24 * 60 * 60;

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  public readonly id: string = v4();

  constructor(
    private readonly config: ConfigService,
    private readonly client: RedisClient,
  ) {
    this.handleReconnect();
  }

  public get pub_client() {
    return this.client.pub;
  }

  public get sub_client() {
    return this.client.sub;
  }

  private handleReconnect() {
    this.client.sub.on('reconnecting', () => {
      this.logger.warn('Redis reconnecting...');
    });

    this.client.sub.on('connect', () => {
      this.logger.log('Redis connected.');
    });

    this.client.sub.on('error', (error) => {
      this.logger.error(`Redis connection error: ${error.message}`);
    });
  }

  public fromEvent<T>(event_name: string): Observable<T> {
    const REDIS_KEY = this.config.getOrThrow<string>('REDIS_KEY');
    const key = `${REDIS_KEY}_${event_name}`;

    this.client.subscribe(key);

    return this.client.events$.pipe(
      filter(({ channel }) => channel === key),
      map(({ message }) => JSON.parse(message)),
      filter((message) => message.redis_id !== this.id),
    );
  }

  public async publish(
    event_name: string,
    value: Record<string, unknown>,
  ): Promise<number> {
    try {
      const REDIS_KEY = this.config.getOrThrow<string>('REDIS_KEY');
      const key = `${REDIS_KEY}_${event_name}`;
      const string_value = JSON.stringify({ redis_id: this.id, ...value });

      return await new Promise<number>((resolve, reject) =>
        this.client.publish(key, string_value, (error, reply) => {
          if (error) {
            this.logger.error(`Redis publish error: ${error.message}`);
            return reject(error);
          }
          return resolve(reply!);
        }),
      );
    } catch (error: any) {
      this.logger.error(`Error in publish: ${error.message}`);
      return 0;
    }
  }

  public async get<T>(key: RedisKey): Promise<T | null> {
    try {
      const res = await this.pub_client.get(key);
      if (!res) return null;
      return JSON.parse(res) as T;
    } catch (error: any) {
      this.logger.error(`Redis get error: ${error.message}`);
      return null;
    }
  }

  public async set(
    key: RedisKey,
    value: unknown,
    expire_time_in_seconds: number = REDIS_EXPIRE_TIME_IN_SECONDS,
  ) {
    try {
      return await this.pub_client.set(
        key,
        JSON.stringify(value),
        'EX',
        expire_time_in_seconds,
      );
    } catch (error: any) {
      this.logger.error(`Redis set error: ${error.message}`);
      return null;
    }
  }

  public async del(...keys: RedisKey[]) {
    try {
      return await this.pub_client.del(keys);
    } catch (error: any) {
      this.logger.error(`Redis del error: ${error.message}`);
      return null;
    }
  }

  public async delPattern(pattern: string) {
    try {
      const REDIS_KEY = this.config.getOrThrow<string>('REDIS_KEY');
      const key_pattern = `${REDIS_KEY}${pattern}`;
      const found = await this.pub_client.keys(key_pattern);
      if (found.length > 0) {
        await this.pub_client.del(found);
      }
    } catch (error: any) {
      this.logger.error(`Redis delPattern error: ${error.message}`);
    }
  }

  public async hset(key: RedisKey, field: string, value: unknown) {
    try {
      return this.pub_client.hset(key, field, JSON.stringify(value));
    } catch (error: any) {
      this.logger.error(`Redis hset error: ${error.message}`);
      return null;
    }
  }

  public async hget<T>(key: RedisKey, field: string) {
    try {
      const res = await this.pub_client.hget(key, field);
      if (res) return JSON.parse(res) as T;
      return null;
    } catch (error: any) {
      this.logger.error(`Redis hget error: ${error.message}`);
      return null;
    }
  }

  public async hdel(key: RedisKey, ...fields: string[]) {
    try {
      return this.pub_client.hdel(key, ...fields);
    } catch (error: any) {
      this.logger.error(`Redis hdel error: ${error.message}`);
      return null;
    }
  }
}

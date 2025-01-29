import { Injectable } from '@nestjs/common';
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

const REDIS_EXPIRE_TIME_IN_SECONDS = 7 * 24 * 60 * 60; // 7 days

@Injectable()
export class RedisService {
  public readonly id: string = v4();

  constructor(
    private readonly config: ConfigService,
    private readonly client: RedisClient,
  ) {}

  public get pub_client() {
    return this.client.pub;
  }

  public get sub_client() {
    return this.client.sub;
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
    const REDIS_KEY = this.config.getOrThrow<string>('REDIS_KEY');
    const key = `${REDIS_KEY}_${event_name}`;

    const string_value = JSON.stringify({ redis_id: this.id, ...value });

    return new Promise<number>((resolve, reject) =>
      this.client.publish(key, string_value, (error, reply) => {
        if (error) {
          return reject(error);
        }
        return resolve(reply!);
      }),
    );
  }

  public async exists(key: RedisKey) {
    return !!(await this.pub_client.exists(key));
  }

  public async get<T>(key: RedisKey) {
    const res = await this.pub_client.get(key);
    if (!res) return null;
    return JSON.parse(res) as T;
  }

  public async set(
    key: RedisKey,
    value: unknown,
    expire_time_in_seconds: number = REDIS_EXPIRE_TIME_IN_SECONDS,
  ) {
    return this.pub_client.set(
      key,
      JSON.stringify(value),
      'EX',
      expire_time_in_seconds,
    );
  }

  public async del(...keys: RedisKey[]) {
    return this.pub_client.del(keys);
  }

  public async keys(pattern: string) {
    const REDIS_KEY = this.config.getOrThrow<string>('REDIS_KEY');
    const key_pattern = `${REDIS_KEY}${pattern}`;

    const found = await this.pub_client.keys(key_pattern);
    return found.map((key) => key.substring(REDIS_KEY.length));
  }

  public async hexists(key: RedisKey, field: string) {
    return !!(await this.pub_client.hexists(key, field));
  }

  public async hset(key: RedisKey, field: string, value: unknown) {
    return this.pub_client.hset(key, field, JSON.stringify(value));
  }

  public async hsetall(key: RedisKey, object: object) {
    return this.pub_client.hset(key, object);
  }

  public async hget<T>(key: RedisKey, field: string) {
    const res = await this.pub_client.hget(key, field);
    if (res) return JSON.parse(res) as T;
    return null;
  }

  public async hgetall<T>(key: RedisKey) {
    const raw = await this.pub_client.hgetall(key);
    const parsed: Record<string, T> = {};

    for (const [field, val] of Object.entries(raw)) {
      try {
        parsed[field] = JSON.parse(val) as T;
      } catch {
        (parsed as any)[field] = val;
      }
    }
    return parsed;
  }

  public async hdel(key: RedisKey, ...fields: string[]) {
    return this.pub_client.hdel(key, ...fields);
  }

  public async lpush(key: RedisKey, value: unknown) {
    return this.pub_client.lpush(key, JSON.stringify(value));
  }

  public async rpush(key: RedisKey, value: unknown) {
    return this.pub_client.rpush(key, JSON.stringify(value));
  }

  public async lpop<T>(key: RedisKey, count = 1) {
    const arr = await this.pub_client.lpop(key, count);
    if (!arr) return null;
    if (Array.isArray(arr)) {
      return arr.map((i) => JSON.parse(i)) as T[];
    } else {
      return [JSON.parse(arr) as T];
    }
  }

  public async rpop<T>(key: RedisKey, count = 1) {
    const arr = await this.pub_client.rpop(key, count);
    if (!arr) return null;
    if (Array.isArray(arr)) {
      return arr.map((i) => JSON.parse(i)) as T[];
    } else {
      return [JSON.parse(arr) as T];
    }
  }

  public async llen(key: RedisKey) {
    return this.pub_client.llen(key);
  }

  public async lpos(key: RedisKey, value: string | number) {
    return this.pub_client.lpos(key, value);
  }

  public async lrem(
    key: RedisKey,
    count: number | string,
    element: string | Buffer | number,
  ) {
    return this.pub_client.lrem(key, count, element);
  }

  public async mget<T>(keys: RedisKey[]) {
    const res = await this.pub_client.mget(keys);
    return (res ?? []).map((data) => (data ? (JSON.parse(data) as T) : null));
  }

  public async mset(data: (string | number)[]) {
    return this.pub_client.mset(data);
  }

  public async expire(
    key: RedisKey,
    expire_time_in_seconds: number = REDIS_EXPIRE_TIME_IN_SECONDS,
  ) {
    return this.pub_client.expire(key, expire_time_in_seconds);
  }
}

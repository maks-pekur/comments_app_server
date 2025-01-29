import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  TypeOrmModule as NestJSTypeOrmModule,
  TypeOrmModuleOptions,
} from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';
import { createDatabase } from 'typeorm-extension';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

@Module({})
export class TypeOrmModule {
  public static forRoot(
    options: Partial<PostgresConnectionOptions> = {},
  ): DynamicModule {
    return {
      imports: [
        NestJSTypeOrmModule.forRootAsync({
          useFactory: async (config: ConfigService) => {
            const default_options: TypeOrmModuleOptions = {
              type: 'postgres',
              host: config.getOrThrow<string>('DB_HOST'),
              port: parseInt(config.getOrThrow<string>('DB_PORT'), 10),
              username: config.getOrThrow<string>('DB_USERNAME'),
              password: config.getOrThrow<string>('DB_PASSWORD'),
              database: `${process.env.NODE_ENV || 'development'}_${config.getOrThrow<string>('DB_DATABASE')}`,
              entities: [__dirname + '/../**/*.entity{.ts,.js}'],
              migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
              migrationsRun: false,
              synchronize: false,
              logging: JSON.parse(config.getOrThrow<string>('DB_LOGGING')),
              retryAttempts: 5,
              retryDelay: 3000,
              autoLoadEntities: true,
              ...options,
            };

            try {
              await createDatabase({
                ifNotExist: true,
                options: default_options as DataSourceOptions,
              });
            } catch (error) {
              console.error('Error creating database:', error);
              throw error;
            }

            return default_options;
          },
          inject: [ConfigService],
        }),
      ],
      module: TypeOrmModule,
    };
  }
}

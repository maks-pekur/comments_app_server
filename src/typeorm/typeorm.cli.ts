import * as dotenv from 'dotenv';
import { DotenvExpandOptions, expand } from 'dotenv-expand';
import * as fs from 'fs';
import { DataSource } from 'typeorm';

import { ENV_FILE_PATHS, EXPAND_VARIABLES } from '../app.env';

function loadEnvFile(): Record<string, any> {
  let config: ReturnType<typeof dotenv.parse> = {};

  for (const env_file_path of ENV_FILE_PATHS) {
    if (fs.existsSync(env_file_path)) {
      config = Object.assign(
        dotenv.parse(fs.readFileSync(env_file_path)),
        config,
      );

      if (EXPAND_VARIABLES) {
        const expandOptions: DotenvExpandOptions =
          typeof EXPAND_VARIABLES === 'object' ? EXPAND_VARIABLES : {};
        config = expand({ ...expandOptions, parsed: config }).parsed ?? config;
      }
    }
  }
  return config;
}

const config = loadEnvFile();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: `${process.env.NODE_ENV!}_${config.DB_DATABASE!}`,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
  migrationsRun: false,
  synchronize: false,
  logging: JSON.parse(config.DB_LOGGING!),
});

export default dataSource;

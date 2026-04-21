import { resolve } from 'path';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';

// Loaded when running TypeORM CLI from backend/ (cwd may vary; __dirname is stable).
config({ path: resolve(__dirname, '../../.env') });
config({ path: resolve(__dirname, '../../../.env') });

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [resolve(__dirname, '../entities/**/*.entity.{ts,js}')],
  migrations: [resolve(__dirname, '../migrations/**/*.{ts,js}')],
  synchronize: false,
});

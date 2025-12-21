import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config();

const isDevelopment = process.env.NODE_ENV === "development";
const isTest = process.env.NODE_ENV === "test";

const dataSource = new DataSource({
  type: "postgres",
  port: +process.env.POSTGRES_PORT,
  username: process.env.POSTGRES_USERNAME || "user",
  password: process.env.POSTGRES_PASSWORD || "password",
  database: process.env.POSTGRES_NAME || "dbname",
  host: process.env.POSTGRES_HOST || "localhost",
  entities: [path.resolve(__dirname, "..") + "/**/*.entity{.ts,.js}"],
  //migrations: [process.env.DB_MIGRATIONS],
  migrations: [path.join(__dirname, "./migrations/*.ts")],
  migrationsRun: true,
  synchronize: false,
  // migrationsTableName: 'migrations',
  //   ssl: process.env.DB_SSL === 'true',
  // Reduce connection footprint when using pgBouncer (Session mode limits pool size)
  // These are passed to the underlying 'pg' Pool
  // extra: {
  //   max: +(process.env.DB_POOL_MAX || 5),
  //   idleTimeoutMillis: +(process.env.DB_IDLE_TIMEOUT_MS || 30000),
  //   connectionTimeoutMillis: +(process.env.DB_CONNECTION_TIMEOUT_MS || 5000),
  //   keepAlive: true,
  // },
});

export async function initializeDataSource() {
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }
  return dataSource;
}

export default dataSource;

// TO MIGRATE
// npx ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:generate src/database/migrations/NotUniqueBusinessName -d src/database/data-source.ts

// TO APPLY MIGRATION
// npx ts-node -r tsconfig-paths/register ./node_modules/typeorm/cli.js migration:run -d src/database/data-source.ts

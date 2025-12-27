import { DataSource } from "typeorm";
import * as dotenv from "dotenv";

dotenv.config();

const dataSource = new DataSource({
  type: "postgres",
  port: +process.env.POSTGRES_PORT,
  username: process.env.POSTGRES_USERNAME,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_NAME,
  host: process.env.POSTGRES_HOST,
});

async function run() {
  await dataSource.initialize();
  const queryRunner = dataSource.createQueryRunner();

  const cols = (await queryRunner.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'business_reward'
  `)).map(c => c.column_name);

  console.log("Found columns in business_reward:");
  for (const c of cols.sort()) {
    console.log(`  - ${c}`);
  }

  const s_exists = cols.includes("stamp_required");
  const ss_exists = cols.includes("stamps_required");

  console.log(`stamp_required exists: ${s_exists}`);
  console.log(`stamps_required exists: ${ss_exists}`);

  await dataSource.destroy();
}

run().catch(console.error);

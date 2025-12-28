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

    const attrs = await queryRunner.query(`
    SELECT a.attname
    FROM pg_attribute a
    INNER JOIN pg_class c ON a.attrelid = c.oid
    WHERE c.relname = 'business_reward' AND a.attnum > 0 AND NOT a.attisdropped
  `);

    console.log("Attributes in business_reward:");
    const names = attrs.map(a => a.attname).sort();
    for (const name of names) {
        console.log(`  - ${name}`);
    }

    await dataSource.destroy();
}

run().catch(console.error);

const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

async function runSql() {
    const client = new Client({
        user: process.env.POSTGRES_USERNAME || 'user',
        host: process.env.POSTGRES_HOST || 'localhost',
        database: process.env.POSTGRES_NAME || 'dbname',
        password: process.env.POSTGRES_PASSWORD || 'password',
        port: +process.env.POSTGRES_PORT,
    });

    try {
        await client.connect();

        console.log("Running migration UP logic: dropping start_date and end_date from tier...");
        await client.query(`ALTER TABLE "tier" DROP COLUMN "start_date"`);
        await client.query(`ALTER TABLE "tier" DROP COLUMN "end_date"`);

        // Mark as migrated
        await client.query(`INSERT INTO "migrations" ("timestamp", "name") VALUES ($1, $2)`, [1767142885117, 'RemoveTierDates1767142885117']);

        console.log("Migration successful!");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await client.end();
    }
}

runSql();

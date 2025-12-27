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

    console.log("Attempting to rename column stamp_required to stamps_required in business_reward...");
    try {
        await queryRunner.query(`ALTER TABLE "business_reward" RENAME COLUMN "stamp_required" TO "stamps_required"`);
        console.log("Successfully renamed stamp_required to stamps_required");
    } catch (e) {
        console.error("Failed to rename stamp_required:", e.message);
    }

    console.log("Attempting to rename column point_required to points_required in business_reward...");
    try {
        await queryRunner.query(`ALTER TABLE "business_reward" RENAME COLUMN "point_required" TO "points_required"`);
        console.log("Successfully renamed point_required to points_required");
    } catch (e) {
        console.error("Failed to rename point_required:", e.message);
    }

    console.log("Attempting to rename column max_stamp_required to max_stamps_required in reward...");
    try {
        await queryRunner.query(`ALTER TABLE "reward" RENAME COLUMN "max_stamp_required" TO "max_stamps_required"`);
        console.log("Successfully renamed max_stamp_required to max_stamps_required");
    } catch (e) {
        console.error("Failed to rename max_stamp_required:", e.message);
    }

    await dataSource.destroy();
}

run().catch(console.error);

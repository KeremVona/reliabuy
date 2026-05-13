import { Pool } from "pg";
import dotenv from "dotenv";

// Load the test environment variables explicitly
dotenv.config({ path: ".env.test" });

export const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || "5432", 10),
});

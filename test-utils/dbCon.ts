import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";

// Load the test environment variables explicitly
dotenv.config({ path: path.resolve(__dirname, "../.env.test") });

console.log(
  "Checking DB_PASSWORD dbcon:",
  process.env.DB_PASSWORD ? "✅ Defined" : "❌ Undefined",
);

export const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || "5432", 10),
});

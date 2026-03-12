import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_CONNECTION,
  // For example, 'postgres://user:password@localhost:5432/mydb'
});

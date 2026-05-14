import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

export const pool = new Pool({
  //connectionString: process.env.DATABASE_CONNECTION,
  connectionString: "postgres://postgres:6853@localhost:5432/reliabuy_test",
  // For example, 'postgres://user:password@localhost:5432/mydb'
});

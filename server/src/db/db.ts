import { Pool } from "pg";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // For example, 'postgres://user:password@localhost:5432/mydb'
});

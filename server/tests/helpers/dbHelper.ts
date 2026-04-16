import { pool } from "../../src/db/db";

export const clearDatabase = async () => {
  try {
    // TRUNCATE empties the table. CASCADE ensures any related tables (if you add them later) are also cleared.
    await pool.query("TRUNCATE TABLE users CASCADE");
  } catch (error) {
    console.error("Failed to clear database during testing:", error);
    throw error;
  }
};

export const closeDatabase = async () => {
  await pool.end();
};

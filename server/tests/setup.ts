import { beforeEach, afterAll } from "vitest";
import { clearDatabase, closeDatabase } from "./helpers/dbHelper";

// Runs before EVERY single test (it block)
beforeEach(async () => {
  await clearDatabase();
});

// Runs ONCE after all tests in all files have finished
afterAll(async () => {
  await closeDatabase();
});

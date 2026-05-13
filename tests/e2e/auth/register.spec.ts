import { test, expect } from "@playwright/test";
import bcrypt from "bcrypt"; // Needed to seed a valid user
import { pool } from "../../../test-utils/dbCon";

test.describe("Registration E2E Tests", () => {
  const testEmail = "newuser@example.com";

  // PRECONDITION: Ensure the database is clean
  test.beforeEach(async () => {
    await pool.query("DELETE FROM users WHERE email = $1", [testEmail]);
  });

  test("TC-REG-001: Verify user can register with valid information", async ({
    page,
  }) => {
    // PROCEDURE 1: Navigate to the Registration page
    await page.goto("http://localhost:5173/register");

    // PROCEDURE 2: Enter valid information
    await page.fill('input[name="fullname"]', "John Doe");
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', "SecurePassword123!");
    await page.fill('input[name="confirm_password"]', "SecurePassword123!");
    await page.fill('input[name="city"]', "city1");

    // Set up a listener to catch the API response when we click register
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("http://localhost:5000/api/auth/register") &&
        response.request().method() === "POST",
    );

    // PROCEDURE 3: Click "Register"
    await page.click('button[type="submit"]');

    // Wait for the Express backend to reply
    const apiResponse = await responsePromise;

    // EXPECTED RESULT 1: Server returns a 201 Created status
    expect(apiResponse.status()).toBe(201);

    // EXPECTED RESULT 2: React frontend redirects to the Login page
    await expect(page).toHaveURL("http://localhost:5173/home");

    // EXPECTED RESULT 3: Record inserted into PostgreSQL database
    const dbResult = await pool.query("SELECT * FROM users WHERE email = $1", [
      testEmail,
    ]);
    expect(dbResult.rows.length).toBe(1);
    expect(dbResult.rows[0].email).toBe(testEmail);
  });
});

test.describe("Registration E2E Tests - Errors & Security", () => {
  const existingEmail = "existing@example.com";
  const maliciousEmail = "hacker@example.com";

  // PRECONDITION: Seed the database for TC-REG-002 and clean up for TC-REG-003
  test.beforeEach(async () => {
    // 1. Clean up potential leftover data
    await pool.query("DELETE FROM users WHERE email IN ($1, $2)", [
      existingEmail,
      maliciousEmail,
    ]);

    // 2. Seed the "existing" user for TC-REG-002
    const hashedPassword = await bcrypt.hash("password123", 10);
    await pool.query(
      "INSERT INTO users (fullname, email, password) VALUES ($1, $2, $3)",
      ["Existing User", existingEmail, hashedPassword],
    );
  });

  // TEARDOWN: Clean up after tests run
  test.afterAll(async () => {
    await pool.query("DELETE FROM users WHERE email IN ($1, $2)", [
      existingEmail,
      maliciousEmail,
    ]);
  });

  // ----------------------------------------------------------------------

  test("TC-REG-002: Verify registration fails when using an email that is already registered", async ({
    page,
  }) => {
    // PROCEDURE: Navigate to registration page
    await page.goto("http://localhost:5173/register");

    // PROCEDURE: Enter information with an existing email
    await page.fill('input[name="fullname"]', "Jane Doe");
    await page.fill('input[name="email"]', existingEmail);
    await page.fill('input[name="password"]', "SecurePassword123!");
    await page.fill('input[name="confirm_password"]', "SecurePassword123!");
    await page.fill('input[name="city"]', "city1");

    // Set up a listener for the API response
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("http://localhost:5000/api/auth/register") &&
        response.request().method() === "POST",
    );

    // PROCEDURE: Click Register
    await page.click('button[type="submit"]');
    const apiResponse = await responsePromise;

    // EXPECTED RESULT 1: Express server catches duplicate email and returns 400 or 409
    expect([400, 409]).toContain(apiResponse.status());

    // EXPECTED RESULT 2: The app does not crash, and a user-friendly error is displayed
    const errorMessage = page.locator("text=Email already in use");
    await expect(errorMessage).toBeVisible();

    // Verify the user was NOT added a second time
    const dbResult = await pool.query("SELECT * FROM users WHERE email = $1", [
      existingEmail,
    ]);
    expect(dbResult.rows.length).toBe(1); // Should still only be 1
  });

  // ----------------------------------------------------------------------

  test("TC-REG-003: Verify SQL injection prevention on the registration form", async ({
    page,
  }) => {
    const maliciousPayload = "Robert'); DROP TABLE users;--";

    // PROCEDURE: Navigate to registration page
    await page.goto("http://localhost:5173/register");

    // PROCEDURE: Enter malicious payload into the Full Name field
    await page.fill('input[name="fullname"]', maliciousPayload);
    await page.fill('input[name="email"]', maliciousEmail);
    await page.fill('input[name="password"]', "HackerPassword123!");
    await page.fill('input[name="confirm_password"]', "HackerPassword123!");
    await page.fill('input[name="city"]', "city1");

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("http://localhost:5000/api/auth/register") &&
        response.request().method() === "POST",
    );

    // PROCEDURE: Click Register
    await page.click('button[type="submit"]');
    const apiResponse = await responsePromise;

    // EXPECTED RESULT 1: Server processes it normally (or returns a validation error if you have strict regex, but here we expect success based on the test case)
    expect(apiResponse.status()).toBe(201);

    // EXPECTED RESULT 2: The parameterized query correctly escaped the input.
    // The database is perfectly intact, and the literal string was saved.
    const dbResult = await pool.query("SELECT * FROM users WHERE email = $1", [
      maliciousEmail,
    ]);

    expect(dbResult.rows.length).toBe(1);
    expect(dbResult.rows[0].fullname).toBe(maliciousPayload);

    // Final sanity check to ensure the users table still exists and wasn't dropped!
    const tableCheck = await pool.query("SELECT count(*) FROM users");
    expect(parseInt(tableCheck.rows[0].count, 10)).toBeGreaterThan(0);
  });
});

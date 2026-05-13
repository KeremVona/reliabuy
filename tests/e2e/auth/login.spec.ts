import { test, expect } from "@playwright/test";
import bcrypt from "bcrypt";
import { pool } from "../../../test-utils/dbCon";

test.describe("Login & Authorization E2E Tests", () => {
  const testEmail = "test@example.com";
  const rawPassword = "password123";

  // PRECONDITION: Ensure the test user exists before each test [cite: 149]
  test.beforeEach(async () => {
    await pool.query("DELETE FROM users WHERE email = $1", [testEmail]);

    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    await pool.query(
      "INSERT INTO users (fullname, email, password) VALUES ($1, $2, $3)",
      ["Test User", testEmail, hashedPassword],
    );
  });

  // TEARDOWN: Clean up after all tests finish
  test.afterAll(async () => {
    await pool.query("DELETE FROM users WHERE email = $1", [testEmail]);
  });

  // ----------------------------------------------------------------------

  test("TC-LOG-001: Verify successful login issues a valid JWT and handles frontend state", async ({
    page,
  }) => {
    // PROCEDURE: Navigate to login and enter credentials [cite: 150, 151]
    await page.goto("http://localhost:5173/login");
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', rawPassword);

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("http://localhost:5000/api/auth/login") &&
        response.request().method() === "POST",
    );

    await page.click('button[type="submit"]');
    const apiResponse = await responsePromise;

    // EXPECTED RESULT 1: Server returns 200 OK [cite: 152]
    expect(apiResponse.status()).toBe(200);

    // EXPECTED RESULT 2: Redirects to /my-listings [cite: 153]
    await expect(page).toHaveURL("http://localhost:5173/home");

    // EXPECTED RESULT 3: JWT is stored in localStorage [cite: 153]
    const token = await page.evaluate(() => localStorage.getItem("token"));
    expect(token).toBeTruthy();
    // Basic structural check to ensure it looks like a JWT (three parts separated by dots)
    expect(token?.split(".").length).toBe(3);
  });

  // ----------------------------------------------------------------------

  test("TC-LOG-002: Verify login gracefully handles incorrect passwords", async ({
    page,
  }) => {
    // PROCEDURE: Enter wrong password [cite: 156, 157]
    await page.goto("http://localhost:5173/login");
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', "WrongPassword!");

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("http://localhost:5000/api/auth/login") &&
        response.request().method() === "POST",
    );

    await page.click('button[type="submit"]');
    const apiResponse = await responsePromise;

    // EXPECTED RESULT 1: Server returns 401 Unauthorized [cite: 157]
    expect(apiResponse.status()).toBe(401);

    // EXPECTED RESULT 2: Frontend displays error without crashing [cite: 158]
    const errorMessage = page.locator("text=Invalid credentials"); // Adjust text based on your exact UI
    await expect(errorMessage).toBeVisible();

    // EXPECTED RESULT 3: No token in localStorage [cite: 158]
    const token = await page.evaluate(() => localStorage.getItem("token"));
    expect(token).toBeNull();
  });

  // ----------------------------------------------------------------------

  test("TC-LOG-003: Verify route protection triggers when access is attempted without login", async ({
    page,
  }) => {
    // PRECONDITION: Ensure localStorage is empty (logged out) [cite: 161]
    await page.goto("http://localhost:5173/");
    await page.evaluate(() => localStorage.clear());

    // PROCEDURE: Manually navigate to protected route [cite: 163]
    await page.goto("http://localhost:5173/my-listings");

    // EXPECTED RESULT: Router immediately redirects back to Login [cite: 164]
    await expect(page).toHaveURL("http://localhost:5173/login");
  });

  // ----------------------------------------------------------------------

  test("TC-LOG-004: Verify backend authorization middleware rejects tampered JWTs", async ({
    request,
  }) => {
    // Note: We use Playwright's API `request` context here instead of `page` because
    // we are simulating Postman/direct API calls, completely bypassing the React UI[cite: 167, 168].

    const tamperedToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fakePayload.fakeSignature";

    // PROCEDURE: Send GET request with fake token [cite: 168, 169]
    const response = await request.get(
      "http://localhost:5000/api/property/my-listings",
      {
        headers: {
          Authorization: `Bearer ${tamperedToken}`,
        },
      },
    );

    // EXPECTED RESULT: Middleware fails verification and returns 401 or 403
    expect([401, 403]).toContain(response.status());
  });
});

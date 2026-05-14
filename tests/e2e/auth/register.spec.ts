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

test.describe("Registration E2E Tests - Input Validation & Business Rules", () => {
  // PRECONDITION: Navigate to the registration page before each test
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5173/register");
  });

  // ----------------------------------------------------------------------

  test("TC-REG-004: Verify registration fails with missing mandatory fields", async ({
    page,
  }) => {
    // PROCEDURE: Attempt to submit the form while entirely blank
    await page.click('button[type="submit"]');

    // EXPECTED RESULT 1: The browser should remain on the registration page
    await expect(page).toHaveURL("http://localhost:5173/register");

    // EXPECTED RESULT 2: Check for HTML5 required validation or UI error messages.
    // If your React app uses native HTML5 validation, you can check the validity state:
    const emailInput = page.locator('input[name="email"]');
    const isEmailValid = await emailInput.evaluate((el: HTMLInputElement) =>
      el.checkValidity(),
    );
    expect(isEmailValid).toBe(false);

    // Alternatively, if you display custom inline errors, assert them like this:
    // const requiredError = page.locator("text=Field is required").first();
    // await expect(requiredError).toBeVisible();
  });

  // ----------------------------------------------------------------------

  test("TC-REG-005: Verify registration fails with invalid email formats", async ({
    page,
  }) => {
    const invalidEmails = ["plainaddress", "user@.com", "@domain.com"];

    for (const email of invalidEmails) {
      // PROCEDURE: Fill in valid info but use an invalid email
      await page.fill('input[name="fullname"]', "John Doe");
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', "SecurePassword123!");
      await page.fill('input[name="confirm_password"]', "SecurePassword123!");
      await page.fill('input[name="city"]', "city1");

      // Set up a non-blocking listener for the API response in case it bypasses frontend
      const responsePromise = page
        .waitForResponse(
          (response) =>
            response
              .url()
              .includes("http://localhost:5000/api/auth/register") &&
            response.request().method() === "POST",
          { timeout: 3000 },
        )
        .catch(() => null); // Catch timeout if frontend blocks the request completely

      // PROCEDURE: Click Register
      await page.click('button[type="submit"]');

      const apiResponse = await responsePromise;

      // EXPECTED RESULT: If it hits the backend, it must return a 400 Bad Request
      if (apiResponse) {
        expect(apiResponse.status()).toBe(400);
      }

      // EXPECTED RESULT: Check that we did not redirect to home/login
      await expect(page).toHaveURL("http://localhost:5173/register");

      // Reload the page to clear the form for the next iteration in the loop
      await page.reload();
    }
  });

  // ----------------------------------------------------------------------

  test("TC-REG-006: Verify registration fails when Password and Confirm Password mismatch", async ({
    page,
  }) => {
    // PROCEDURE: Fill form with mismatched passwords
    await page.fill('input[name="fullname"]', "Jane Doe");
    await page.fill('input[name="email"]', "mismatch@example.com");
    await page.fill('input[name="password"]', "SecurePassword123!");
    await page.fill('input[name="confirm_password"]', "DifferentPassword123!");
    await page.fill('input[name="city"]', "city1");

    await page.click('button[type="submit"]');

    // EXPECTED RESULT 1: Form submission is blocked, user stays on register page
    await expect(page).toHaveURL("http://localhost:5173/register");

    // EXPECTED RESULT 2: UI highlights the mismatch (Adjust text based on your actual UI)
    // Example: await expect(page.locator("text=Passwords do not match")).toBeVisible();
  });

  // ----------------------------------------------------------------------

  test("TC-REG-007: Verify password complexity requirements are enforced", async ({
    page,
  }) => {
    // PROCEDURE: Enter a weak password
    await page.fill('input[name="fullname"]', "John Doe");
    await page.fill('input[name="email"]', "weakpass@example.com");
    await page.fill('input[name="password"]', "123");
    await page.fill('input[name="confirm_password"]', "123");
    await page.fill('input[name="city"]', "city1");

    // Set up a listener for the API response
    const responsePromise = page
      .waitForResponse(
        (response) =>
          response.url().includes("http://localhost:5000/api/auth/register") &&
          response.request().method() === "POST",
        { timeout: 3000 },
      )
      .catch(() => null); // Catch timeout in case frontend prevents the submission entirely

    await page.click('button[type="submit"]');
    const apiResponse = await responsePromise;

    // EXPECTED RESULT 1: If backend receives the payload, it should reject with 400 Bad Request
    if (apiResponse) {
      expect(apiResponse.status()).toBe(400);
    }

    // EXPECTED RESULT 2: User remains on the page
    await expect(page).toHaveURL("http://localhost:5173/register");

    // EXPECTED RESULT 3: Frontend informs user of specific rules (Adjust to your UI)
    // Example: await expect(page.locator("text=minimum 8 characters")).toBeVisible();
  });
});

test.describe("Registration E2E Tests - Data Sanitization & Edge Cases", () => {
  // Pre-define emails used in these specific tests
  const spacedEmail = "spaceduser@example.com";
  const caseSensitiveEmail = "casecheck@example.com";
  const longNameEmail = "longname@example.com";

  // PRECONDITION: Clean up the database before the block runs
  test.beforeEach(async () => {
    await pool.query("DELETE FROM users WHERE email IN ($1, $2, $3)", [
      spacedEmail,
      caseSensitiveEmail,
      longNameEmail,
    ]);
  });

  // TEARDOWN: Clean up after the block finishes
  test.afterAll(async () => {
    await pool.query("DELETE FROM users WHERE email IN ($1, $2, $3)", [
      spacedEmail,
      caseSensitiveEmail,
      longNameEmail,
    ]);
  });

  // ----------------------------------------------------------------------

  test("TC-REG-008: Verify successful registration with leading/trailing whitespaces", async ({
    page,
  }) => {
    // Inputs with deliberate padding
    const rawName = "   John Doe   ";
    const expectedName = "John Doe";
    const rawEmail = `   ${spacedEmail}   `;

    // PROCEDURE: Fill form with padded data
    await page.goto("http://localhost:5173/register");
    await page.fill('input[name="fullname"]', rawName);
    await page.fill('input[name="email"]', rawEmail);
    await page.fill('input[name="password"]', "SecurePassword123!");
    await page.fill('input[name="confirm_password"]', "SecurePassword123!");
    await page.fill('input[name="city"]', "city1");

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("http://localhost:5000/api/auth/register") &&
        response.request().method() === "POST",
    );

    await page.click('button[type="submit"]');
    const apiResponse = await responsePromise;

    // EXPECTED RESULT 1: Backend returns 201 Created
    expect(apiResponse.status()).toBe(201);
    await expect(page).toHaveURL("http://localhost:5173/home");

    // EXPECTED RESULT 2: The backend successfully trimmed the whitespace before saving to DB
    const dbResult = await pool.query("SELECT * FROM users WHERE email = $1", [
      spacedEmail,
    ]);
    expect(dbResult.rows.length).toBe(1);
    expect(dbResult.rows[0].fullname).toBe(expectedName);
    expect(dbResult.rows[0].email).toBe(spacedEmail); // Asserting exact match, no spaces
  });

  // ----------------------------------------------------------------------

  test("TC-REG-009: Verify duplicate email check is case-insensitive", async ({
    page,
  }) => {
    // PRECONDITION: Seed the database with a lowercase email
    const hashedPassword = await bcrypt.hash("password123", 10);
    await pool.query(
      "INSERT INTO users (fullname, email, password) VALUES ($1, $2, $3)",
      ["Case Check User", caseSensitiveEmail, hashedPassword],
    );

    // Provide the exact same email but in UPPERCASE
    const uppercaseEmail = caseSensitiveEmail.toUpperCase();

    // PROCEDURE: Attempt to register
    await page.goto("http://localhost:5173/register");
    await page.fill('input[name="fullname"]', "Jane Doe");
    await page.fill('input[name="email"]', uppercaseEmail);
    await page.fill('input[name="password"]', "SecurePassword123!");
    await page.fill('input[name="confirm_password"]', "SecurePassword123!");
    await page.fill('input[name="city"]', "city1");

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("http://localhost:5000/api/auth/register") &&
        response.request().method() === "POST",
    );

    await page.click('button[type="submit"]');
    const apiResponse = await responsePromise;

    // EXPECTED RESULT 1: Backend detects it as a duplicate (case-insensitive) and rejects
    expect([400, 409]).toContain(apiResponse.status());

    // EXPECTED RESULT 2: User is notified and stays on the page
    const errorMessage = page.locator("text=Email already in use");
    await expect(errorMessage).toBeVisible();
  });

  // ----------------------------------------------------------------------

  test("TC-REG-010: Verify handling of maximum field length constraints", async ({
    page,
  }) => {
    // Generate a string that exceeds a typical 255 VARCHAR limit
    const overSizedName = "A".repeat(260);

    await page.goto("http://localhost:5173/register");
    const nameInput = page.locator('input[name="fullname"]');

    // PROCEDURE 1: (Optional but recommended) Verify frontend HTML attribute exists
    const maxLengthAttr = await nameInput.getAttribute("maxLength");
    if (maxLengthAttr) {
      expect(parseInt(maxLengthAttr, 10)).toBeLessThanOrEqual(255);
    }

    // PROCEDURE 2: Bypass frontend validation by stripping the maxLength attribute via DOM manipulation
    await nameInput.evaluate((el: HTMLInputElement) =>
      el.removeAttribute("maxLength"),
    );

    // PROCEDURE 3: Fill the form with the oversized string
    await page.fill('input[name="fullname"]', overSizedName);
    await page.fill('input[name="email"]', longNameEmail);
    await page.fill('input[name="password"]', "SecurePassword123!");
    await page.fill('input[name="confirm_password"]', "SecurePassword123!");
    await page.fill('input[name="city"]', "city1");

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("http://localhost:5000/api/auth/register") &&
        response.request().method() === "POST",
    );

    await page.click('button[type="submit"]');
    const apiResponse = await responsePromise;

    // EXPECTED RESULT 1: Backend catches the length violation and returns a 400 Bad Request
    // It should NOT crash the server (e.g., no 500 Internal Server Error)
    expect(apiResponse.status()).toBe(400);

    // EXPECTED RESULT 2: Verify the user was safely prevented from being inserted into the DB
    const dbResult = await pool.query("SELECT * FROM users WHERE email = $1", [
      longNameEmail,
    ]);
    expect(dbResult.rows.length).toBe(0);
  });
});

test.describe("Registration E2E Tests - Security & Rate Limiting", () => {
  const xssEmail = "xss_test_user@example.com";

  // PRECONDITION: Clean up the DB for the XSS test
  test.beforeEach(async () => {
    await pool.query("DELETE FROM users WHERE email = $1", [xssEmail]);
    // Note: We don't clean up spam emails from TC-REG-012 here because rate
    // limiting might block them before they hit the DB anyway.
  });

  test.afterAll(async () => {
    await pool.query("DELETE FROM users WHERE email = $1", [xssEmail]);
    await pool.query("DELETE FROM users WHERE email LIKE 'spam_%@example.com'");
  });

  // ----------------------------------------------------------------------

  test("TC-REG-011: Verify Cross-Site Scripting (XSS) payload handling in text fields", async ({
    page,
  }) => {
    const xssPayload = "<script>alert('XSS')</script>";
    let alertTriggered = false;

    // PROCEDURE 1: Attach a listener to catch any unexpected browser alerts/dialogs
    // If the XSS is successful, this listener will fire.
    page.on("dialog", async (dialog) => {
      alertTriggered = true;
      await dialog.dismiss();
    });

    // PROCEDURE 2: Fill out the form with the malicious payload
    await page.goto("http://localhost:5173/register");
    await page.fill('input[name="fullname"]', xssPayload);
    await page.fill('input[name="email"]', xssEmail);
    await page.fill('input[name="password"]', "SecurePassword123!");
    await page.fill('input[name="confirm_password"]', "SecurePassword123!");
    await page.fill('input[name="city"]', "city1");

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("http://localhost:5000/api/auth/register") &&
        response.request().method() === "POST",
    );

    await page.click('button[type="submit"]');
    const apiResponse = await responsePromise;

    // EXPECTED RESULT 1: Backend accepts the input and treats it as a standard string (201 Created)
    expect(apiResponse.status()).toBe(201);

    // Wait for the app to redirect to the home/dashboard page
    await expect(page).toHaveURL("http://localhost:5173/home");

    // EXPECTED RESULT 2: The alert box was NEVER triggered during navigation
    expect(alertTriggered).toBe(false);

    // EXPECTED RESULT 3: The React frontend safely escapes the string, rendering it as literal text
    // Depending on where the name is displayed on your /home page, verify it is visible
    const displayedName = page.locator(`text="${xssPayload}"`);
    await expect(displayedName).toBeVisible();

    // EXPECTED RESULT 4: Verify the database stored the literal string exactly as inputted
    const dbResult = await pool.query("SELECT * FROM users WHERE email = $1", [
      xssEmail,
    ]);
    expect(dbResult.rows.length).toBe(1);
    expect(dbResult.rows[0].fullname).toBe(xssPayload);
  });

  // ----------------------------------------------------------------------

  test("TC-REG-012: Verify rate limiting prevents brute-force account creation (Spam/DoS)", async ({
    request, // Using Playwright's APIRequestContext instead of UI for raw speed
  }) => {
    const maxRequests = 15; // Set higher than your expected threshold
    let received429Error = false;
    const statusCodes = [];

    // PROCEDURE: Blast the endpoint with rapid, consecutive POST requests
    for (let i = 0; i < maxRequests; i++) {
      const response = await request.post(
        "http://localhost:5000/api/auth/register",
        {
          data: {
            fullname: `Spam User ${i}`,
            email: `spam_${i}_${Date.now()}@example.com`,
            password: "SecurePassword123!",
            confirm_password: "SecurePassword123!",
            city: "city1",
          },
        },
      );

      const status = response.status();
      statusCodes.push(status);

      // Check if we hit the rate limit block
      if (status === 429) {
        received429Error = true;
        break; // Stop blasting once we confirm rate limiting works
      }
    }

    // Output the sequence of status codes for debugging (e.g., [201, 201, 201, 201, 201, 429])
    console.log(`Rate Limit Test Status Codes: ${statusCodes.join(", ")}`);

    // EXPECTED RESULT: Eventually, the server must respond with 429 Too Many Requests
    expect(received429Error).toBe(true);
  });
});

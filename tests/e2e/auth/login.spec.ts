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
    const errorMessage = page.locator("text=Invalid email or password"); // Adjust text based on your exact UI
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

test.describe("Login & Authorization E2E Tests - Input Validation", () => {
  const testEmail = "test@example.com";
  const rawPassword = "password123";

  // PRECONDITION: Ensure the test user exists before testing backend sanitization
  test.beforeEach(async () => {
    await pool.query("DELETE FROM users WHERE email = $1", [testEmail]);

    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    await pool.query(
      "INSERT INTO users (fullname, email, password) VALUES ($1, $2, $3)",
      ["Test User", testEmail, hashedPassword],
    );
  });

  // TEARDOWN: Clean up after tests run
  test.afterAll(async () => {
    await pool.query("DELETE FROM users WHERE email = $1", [testEmail]);
  });

  // ----------------------------------------------------------------------

  test("TC-LOG-005: Verify login fails with an invalid email format", async ({
    page,
  }) => {
    // PROCEDURE: Navigate to login and enter improperly formatted email
    await page.goto("http://localhost:5173/login");
    await page.fill('input[name="email"]', "not-an-email");
    await page.fill('input[name="password"]', rawPassword);

    // Set up a listener to ensure the API is NOT called
    let apiCalled = false;
    page.on("request", (request) => {
      if (
        request.url().includes("http://localhost:5000/api/auth/login") &&
        request.method() === "POST"
      ) {
        apiCalled = true;
      }
    });

    await page.click('button[type="submit"]');

    // Wait briefly to allow frontend validation to process
    await page.waitForTimeout(500);

    // EXPECTED RESULT 1: API is not called due to frontend validation blocking it
    expect(apiCalled).toBe(false);

    // EXPECTED RESULT 2: Check for HTML5 validation OR custom UI error
    // If using native HTML5 email validation:
    const emailInput = page.locator('input[name="email"]');
    const isEmailValid = await emailInput.evaluate((el: HTMLInputElement) =>
      el.checkValidity(),
    );
    expect(isEmailValid).toBe(false);

    // If using custom React validation (e.g., Zod + React Hook Form), assert the error text:
    // const errorMessage = page.locator("text=Invalid email format");
    // await expect(errorMessage).toBeVisible();
  });

  // ----------------------------------------------------------------------

  test("TC-LOG-006: Verify login fails with empty required fields", async ({
    page,
  }) => {
    // PROCEDURE: Navigate to login and attempt to submit completely empty fields
    await page.goto("http://localhost:5173/login");

    // Set up a listener to ensure the API is NOT called
    let apiCalled = false;
    page.on("request", (request) => {
      if (
        request.url().includes("http://localhost:5000/api/auth/login") &&
        request.method() === "POST"
      ) {
        apiCalled = true;
      }
    });

    // Leave both fields blank and submit
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);

    // EXPECTED RESULT 1: API is not called
    expect(apiCalled).toBe(false);

    // EXPECTED RESULT 2: Verify HTML5 required state OR custom UI validation
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');

    const isEmailValid = await emailInput.evaluate((el: HTMLInputElement) =>
      el.checkValidity(),
    );
    const isPasswordValid = await passwordInput.evaluate(
      (el: HTMLInputElement) => el.checkValidity(),
    );

    expect(isEmailValid).toBe(false);
    expect(isPasswordValid).toBe(false);

    // Optional: Check specific error text if using a form library
    // await expect(page.locator("text=Password is required")).toBeVisible();
  });

  // ----------------------------------------------------------------------

  test("TC-LOG-007: Verify login succeeds with whitespace and varied casing in email", async ({
    page,
  }) => {
    // PROCEDURE: Enter valid email with spaces and caps, plus valid password
    await page.goto("http://localhost:5173/login");

    // Example: "  TEST@EXAMPLE.COM  "
    const messyEmail = `   ${testEmail.toUpperCase()}   `;

    await page.fill('input[name="email"]', messyEmail);
    await page.fill('input[name="password"]', rawPassword);

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("http://localhost:5000/api/auth/login") &&
        response.request().method() === "POST",
    );

    await page.click('button[type="submit"]');
    const apiResponse = await responsePromise;

    // EXPECTED RESULT 1: Backend sanitizes the email (trims/lowercases) and returns 200 OK
    expect(apiResponse.status()).toBe(200);

    // EXPECTED RESULT 2: User successfully logs in and is redirected
    await expect(page).toHaveURL("http://localhost:5173/home");

    // EXPECTED RESULT 3: JWT is issued correctly
    const token = await page.evaluate(() => localStorage.getItem("token"));
    expect(token).toBeTruthy();
  });
});

test.describe("Login & Authorization E2E Tests - Security & Edge Cases", () => {
  const unregisteredEmail = "ghost@example.com";

  // PRECONDITION: Ensure the test email absolutely does NOT exist in the database
  test.beforeEach(async () => {
    await pool.query("DELETE FROM users WHERE email = $1", [unregisteredEmail]);
  });

  // ----------------------------------------------------------------------

  test("TC-LOG-008: Verify login gracefully handles non-existent users without enumerating", async ({
    page,
  }) => {
    // PROCEDURE: Enter an email that is not in the DB, but with a valid password format
    await page.goto("http://localhost:5173/login");
    await page.fill('input[name="email"]', unregisteredEmail);
    await page.fill('input[name="password"]', "ValidFormat123!");

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("http://localhost:5000/api/auth/login") &&
        response.request().method() === "POST",
    );

    await page.click('button[type="submit"]');
    const apiResponse = await responsePromise;

    // EXPECTED RESULT 1: API returns 401 Unauthorized (or 404 depending on your implementation)
    expect([401, 404]).toContain(apiResponse.status());

    // EXPECTED RESULT 2: Generic error is displayed to prevent email enumeration
    const errorMessage = page.locator("text=Invalid email or password");
    await expect(errorMessage).toBeVisible();

    // EXPECTED RESULT 3: No token is stored, user is not redirected
    const token = await page.evaluate(() => localStorage.getItem("token"));
    expect(token).toBeNull();
    await expect(page).toHaveURL("http://localhost:5173/login");
  });

  // ----------------------------------------------------------------------

  test("TC-LOG-009: Verify SQL Injection attempt in login fields is safely handled", async ({
    page,
  }) => {
    // Standard SQL injection payload intended to bypass authentication
    const sqliPayload = "' OR 1=1 --";

    // PROCEDURE: Attempt to inject payload into both fields
    await page.goto("http://localhost:5173/login");
    await page.fill('input[name="email"]', sqliPayload);
    await page.fill('input[name="password"]', sqliPayload);

    // Wait for response, catching potential timeouts if frontend validation fully blocks it
    const responsePromise = page
      .waitForResponse(
        (response) =>
          response.url().includes("http://localhost:5000/api/auth/login") &&
          response.request().method() === "POST",
        { timeout: 3000 },
      )
      .catch(() => null);

    await page.click('button[type="submit"]');
    const apiResponse = await responsePromise;

    // EXPECTED RESULT 1: If it reaches the backend, the API must reject it (400 validation or 401 auth failure)
    // Crucially, it must NOT return 200 OK or 500 Internal Server Error.
    if (apiResponse) {
      expect([400, 401]).toContain(apiResponse.status());
    }

    // EXPECTED RESULT 2: The UI remains intact (no crash) and stays on the login page
    await expect(page).toHaveURL("http://localhost:5173/login");

    // EXPECTED RESULT 3: The injection failed to generate a token
    const token = await page.evaluate(() => localStorage.getItem("token"));
    expect(token).toBeNull();
  });
});

test.describe("Login & Authorization E2E Tests - Session Management & Logout", () => {
  const testEmail = "session_user@example.com";
  const rawPassword = "password123";

  // PRECONDITION: Ensure test user exists for legitimate login steps
  test.beforeEach(async () => {
    await pool.query("DELETE FROM users WHERE email = $1", [testEmail]);

    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    await pool.query(
      "INSERT INTO users (fullname, email, password) VALUES ($1, $2, $3)",
      ["Session User", testEmail, hashedPassword],
    );
  });

  // TEARDOWN: Clean up after tests finish
  test.afterAll(async () => {
    await pool.query("DELETE FROM users WHERE email = $1", [testEmail]);
  });

  // Helper function to handle a standard login
  const performValidLogin = async (page: any) => {
    await page.goto("http://localhost:5173/login");
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', rawPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("http://localhost:5173/home");
  };

  // ----------------------------------------------------------------------

  test("TC-LOG-010: Verify session persistence on page reload", async ({
    page,
  }) => {
    // PROCEDURE 1: Log in successfully
    await performValidLogin(page);

    // EXPECTED RESULT 1: Ensure JWT is set
    let token = await page.evaluate(() => localStorage.getItem("token"));
    expect(token).toBeTruthy();

    // PROCEDURE 2: Perform a full page reload
    await page.reload();

    // EXPECTED RESULT 2: The user remains on the protected route
    await expect(page).toHaveURL("http://localhost:5173/home");

    // EXPECTED RESULT 3: The JWT is still in localStorage
    token = await page.evaluate(() => localStorage.getItem("token"));
    expect(token).toBeTruthy();

    // EXPECTED RESULT 4: The UI still reflects the logged-in state (Adjust selector as needed)
    // Example: await expect(page.locator("text=Logout")).toBeVisible();
  });

  // ----------------------------------------------------------------------

  test("TC-LOG-011: Verify logout functionality clears state and redirects", async ({
    page,
  }) => {
    // PROCEDURE 1: Log in successfully
    await performValidLogin(page);

    // PROCEDURE 2: Click the "Logout" button
    // Note: Adjust this selector based on your exact UI (e.g., a button, a dropdown item)
    // await page.click("#logout");
    await page.locator("#logout").click();

    // EXPECTED RESULT 1: User is immediately redirected to /login (or /)
    await expect(page).toHaveURL("http://localhost:5173/login");

    // EXPECTED RESULT 2: The localStorage token is completely removed
    const token = await page.evaluate(() => localStorage.getItem("token"));
    expect(token).toBeNull();
  });

  // ----------------------------------------------------------------------

  test("TC-LOG-012: Verify frontend handles an expired/invalid JWT gracefully", async ({
    page,
  }) => {
    // Make a structurally valid but artificially expired JWT
    // Header = HS256, Payload = { "exp": 1577836800 } (Jan 1, 2020), Signature = dummy
    const expiredToken =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1Nzc4MzY4MDB9.dummySignature";

    // PROCEDURE 1: Navigate to the app domain to initialize localStorage context
    await page.goto("http://localhost:5173/");

    // PROCEDURE 2: Inject the expired token into localStorage
    await page.evaluate((token) => {
      localStorage.setItem("token", token);
    }, expiredToken);

    // Optional: We can intercept the API call to force a 401 response just in case
    // the backend doesn't handle the dummy signature the way we expect.
    await page.route("**/api/**", (route) => {
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ message: "Token expired or invalid" }),
      });
    });

    // PROCEDURE 3: Attempt to navigate to a protected route
    await page.goto("http://localhost:5173/publish");

    // EXPECTED RESULT 1: The frontend forces a redirect to /login due to the 401 response
    await expect(page).toHaveURL("http://localhost:5173/login");

    // EXPECTED RESULT 2: The frontend clears the invalid token from localStorage
    const clearedToken = await page.evaluate(() =>
      localStorage.getItem("token"),
    );
    expect(clearedToken).toBeNull();
  });
});

test.describe("Login & Authorization E2E Tests - API Middleware Security", () => {
  // Note: We do not need a before/after hook to seed a user here,
  // because the middleware should block these requests before it
  // even attempts to query the database for user details.

  test("TC-LOG-013: Verify backend rejects missing Authorization header", async ({
    request,
  }) => {
    // PROCEDURE: Send a direct GET request to a protected endpoint with NO headers
    const response = await request.get(
      "http://localhost:5000/api/property/my-listings",
    );

    // EXPECTED RESULT 1: The backend middleware intercepts the request and returns 401 Unauthorized
    expect(response.status()).toBe(401);

    // EXPECTED RESULT 2: Verify the JSON payload contains an appropriate error message
    // (Adjust the exact expected text based on how your Express middleware formats errors)
    const responseBody = await response.json();
    expect(responseBody).toHaveProperty("message");
    // Example: expect(responseBody.message).toMatch(/no token provided|unauthorized/i);
  });

  // ----------------------------------------------------------------------

  test("TC-LOG-014: Verify backend rejects improperly formatted Authorization header", async ({
    request,
  }) => {
    // Make a technically valid JWT format, but we will send it without the "Bearer " prefix
    const dummyToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy.signature";

    // PROCEDURE: Send request with an improperly formatted Authorization header
    const response = await request.get(
      "http://localhost:5000/api/property/my-listings",
      {
        headers: {
          // Missing the "Bearer " prefix
          Authorization: dummyToken,
        },
      },
    );

    // EXPECTED RESULT 1: Middleware strictly enforces the "Bearer <token>" format and rejects this
    expect(response.status()).toBe(401);

    // EXPECTED RESULT 2: Verify the error message clarifies the format issue (Optional but recommended)
    const responseBody = await response.json();
    expect(responseBody).toHaveProperty("message");
    // Example: expect(responseBody.message).toMatch(/invalid token format|bearer/i);
  });
});

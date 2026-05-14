# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth/login.spec.ts >> Login & Authorization E2E Tests - Security & Edge Cases >> TC-LOG-008: Verify login gracefully handles non-existent users without enumerating
- Location: tests/e2e/auth/login.spec.ts:281:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Invalid credentials')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=Invalid credentials')

```

```yaml
- heading "Welcome Back" [level=2]
- paragraph: Sign in to manage your real estate portfolio.
- heading "Authentication Failed" [level=3]
- paragraph: Invalid email or password
- text: Email Address
- textbox "Email Address":
  - /placeholder: you@example.com
  - text: ghost@example.com
- text: Password
- textbox "Password":
  - /placeholder: ••••••••
  - text: ValidFormat123!
- button
- button "Sign In"
- paragraph:
  - text: Don't have an account?
  - link "Make one now":
    - /url: /register
```

# Test source

```ts
  203 |       if (
  204 |         request.url().includes("http://localhost:5000/api/auth/login") &&
  205 |         request.method() === "POST"
  206 |       ) {
  207 |         apiCalled = true;
  208 |       }
  209 |     });
  210 | 
  211 |     // Leave both fields blank and submit
  212 |     await page.click('button[type="submit"]');
  213 |     await page.waitForTimeout(500);
  214 | 
  215 |     // EXPECTED RESULT 1: API is not called
  216 |     expect(apiCalled).toBe(false);
  217 | 
  218 |     // EXPECTED RESULT 2: Verify HTML5 required state OR custom UI validation
  219 |     const emailInput = page.locator('input[name="email"]');
  220 |     const passwordInput = page.locator('input[name="password"]');
  221 | 
  222 |     const isEmailValid = await emailInput.evaluate((el: HTMLInputElement) =>
  223 |       el.checkValidity(),
  224 |     );
  225 |     const isPasswordValid = await passwordInput.evaluate(
  226 |       (el: HTMLInputElement) => el.checkValidity(),
  227 |     );
  228 | 
  229 |     expect(isEmailValid).toBe(false);
  230 |     expect(isPasswordValid).toBe(false);
  231 | 
  232 |     // Optional: Check specific error text if using a form library
  233 |     // await expect(page.locator("text=Password is required")).toBeVisible();
  234 |   });
  235 | 
  236 |   // ----------------------------------------------------------------------
  237 | 
  238 |   test("TC-LOG-007: Verify login succeeds with whitespace and varied casing in email", async ({
  239 |     page,
  240 |   }) => {
  241 |     // PROCEDURE: Enter valid email with spaces and caps, plus valid password
  242 |     await page.goto("http://localhost:5173/login");
  243 | 
  244 |     // Example: "  TEST@EXAMPLE.COM  "
  245 |     const messyEmail = `   ${testEmail.toUpperCase()}   `;
  246 | 
  247 |     await page.fill('input[name="email"]', messyEmail);
  248 |     await page.fill('input[name="password"]', rawPassword);
  249 | 
  250 |     const responsePromise = page.waitForResponse(
  251 |       (response) =>
  252 |         response.url().includes("http://localhost:5000/api/auth/login") &&
  253 |         response.request().method() === "POST",
  254 |     );
  255 | 
  256 |     await page.click('button[type="submit"]');
  257 |     const apiResponse = await responsePromise;
  258 | 
  259 |     // EXPECTED RESULT 1: Backend sanitizes the email (trims/lowercases) and returns 200 OK
  260 |     expect(apiResponse.status()).toBe(200);
  261 | 
  262 |     // EXPECTED RESULT 2: User successfully logs in and is redirected
  263 |     await expect(page).toHaveURL("http://localhost:5173/home");
  264 | 
  265 |     // EXPECTED RESULT 3: JWT is issued correctly
  266 |     const token = await page.evaluate(() => localStorage.getItem("token"));
  267 |     expect(token).toBeTruthy();
  268 |   });
  269 | });
  270 | 
  271 | test.describe("Login & Authorization E2E Tests - Security & Edge Cases", () => {
  272 |   const unregisteredEmail = "ghost@example.com";
  273 | 
  274 |   // PRECONDITION: Ensure the test email absolutely does NOT exist in the database
  275 |   test.beforeEach(async () => {
  276 |     await pool.query("DELETE FROM users WHERE email = $1", [unregisteredEmail]);
  277 |   });
  278 | 
  279 |   // ----------------------------------------------------------------------
  280 | 
  281 |   test("TC-LOG-008: Verify login gracefully handles non-existent users without enumerating", async ({
  282 |     page,
  283 |   }) => {
  284 |     // PROCEDURE: Enter an email that is not in the DB, but with a valid password format
  285 |     await page.goto("http://localhost:5173/login");
  286 |     await page.fill('input[name="email"]', unregisteredEmail);
  287 |     await page.fill('input[name="password"]', "ValidFormat123!");
  288 | 
  289 |     const responsePromise = page.waitForResponse(
  290 |       (response) =>
  291 |         response.url().includes("http://localhost:5000/api/auth/login") &&
  292 |         response.request().method() === "POST",
  293 |     );
  294 | 
  295 |     await page.click('button[type="submit"]');
  296 |     const apiResponse = await responsePromise;
  297 | 
  298 |     // EXPECTED RESULT 1: API returns 401 Unauthorized (or 404 depending on your implementation)
  299 |     expect([401, 404]).toContain(apiResponse.status());
  300 | 
  301 |     // EXPECTED RESULT 2: Generic error is displayed to prevent email enumeration
  302 |     const errorMessage = page.locator("text=Invalid credentials");
> 303 |     await expect(errorMessage).toBeVisible();
      |                                ^ Error: expect(locator).toBeVisible() failed
  304 | 
  305 |     // EXPECTED RESULT 3: No token is stored, user is not redirected
  306 |     const token = await page.evaluate(() => localStorage.getItem("token"));
  307 |     expect(token).toBeNull();
  308 |     await expect(page).toHaveURL("http://localhost:5173/login");
  309 |   });
  310 | 
  311 |   // ----------------------------------------------------------------------
  312 | 
  313 |   test("TC-LOG-009: Verify SQL Injection attempt in login fields is safely handled", async ({
  314 |     page,
  315 |   }) => {
  316 |     // Standard SQL injection payload intended to bypass authentication
  317 |     const sqliPayload = "' OR 1=1 --";
  318 | 
  319 |     // PROCEDURE: Attempt to inject payload into both fields
  320 |     await page.goto("http://localhost:5173/login");
  321 |     await page.fill('input[name="email"]', sqliPayload);
  322 |     await page.fill('input[name="password"]', sqliPayload);
  323 | 
  324 |     // Wait for response, catching potential timeouts if frontend validation fully blocks it
  325 |     const responsePromise = page
  326 |       .waitForResponse(
  327 |         (response) =>
  328 |           response.url().includes("http://localhost:5000/api/auth/login") &&
  329 |           response.request().method() === "POST",
  330 |         { timeout: 3000 },
  331 |       )
  332 |       .catch(() => null);
  333 | 
  334 |     await page.click('button[type="submit"]');
  335 |     const apiResponse = await responsePromise;
  336 | 
  337 |     // EXPECTED RESULT 1: If it reaches the backend, the API must reject it (400 validation or 401 auth failure)
  338 |     // Crucially, it must NOT return 200 OK or 500 Internal Server Error.
  339 |     if (apiResponse) {
  340 |       expect([400, 401]).toContain(apiResponse.status());
  341 |     }
  342 | 
  343 |     // EXPECTED RESULT 2: The UI remains intact (no crash) and stays on the login page
  344 |     await expect(page).toHaveURL("http://localhost:5173/login");
  345 | 
  346 |     // EXPECTED RESULT 3: The injection failed to generate a token
  347 |     const token = await page.evaluate(() => localStorage.getItem("token"));
  348 |     expect(token).toBeNull();
  349 |   });
  350 | });
  351 | 
  352 | test.describe("Login & Authorization E2E Tests - Session Management & Logout", () => {
  353 |   const testEmail = "session_user@example.com";
  354 |   const rawPassword = "password123";
  355 | 
  356 |   // PRECONDITION: Ensure test user exists for legitimate login steps
  357 |   test.beforeEach(async () => {
  358 |     await pool.query("DELETE FROM users WHERE email = $1", [testEmail]);
  359 | 
  360 |     const hashedPassword = await bcrypt.hash(rawPassword, 10);
  361 |     await pool.query(
  362 |       "INSERT INTO users (fullname, email, password) VALUES ($1, $2, $3)",
  363 |       ["Session User", testEmail, hashedPassword],
  364 |     );
  365 |   });
  366 | 
  367 |   // TEARDOWN: Clean up after tests finish
  368 |   test.afterAll(async () => {
  369 |     await pool.query("DELETE FROM users WHERE email = $1", [testEmail]);
  370 |   });
  371 | 
  372 |   // Helper function to handle a standard login
  373 |   const performValidLogin = async (page: any) => {
  374 |     await page.goto("http://localhost:5173/login");
  375 |     await page.fill('input[name="email"]', testEmail);
  376 |     await page.fill('input[name="password"]', rawPassword);
  377 |     await page.click('button[type="submit"]');
  378 |     await expect(page).toHaveURL("http://localhost:5173/home");
  379 |   };
  380 | 
  381 |   // ----------------------------------------------------------------------
  382 | 
  383 |   test("TC-LOG-010: Verify session persistence on page reload", async ({
  384 |     page,
  385 |   }) => {
  386 |     // PROCEDURE 1: Log in successfully
  387 |     await performValidLogin(page);
  388 | 
  389 |     // EXPECTED RESULT 1: Ensure JWT is set
  390 |     let token = await page.evaluate(() => localStorage.getItem("token"));
  391 |     expect(token).toBeTruthy();
  392 | 
  393 |     // PROCEDURE 2: Perform a full page reload
  394 |     await page.reload();
  395 | 
  396 |     // EXPECTED RESULT 2: The user remains on the protected route
  397 |     await expect(page).toHaveURL("http://localhost:5173/home");
  398 | 
  399 |     // EXPECTED RESULT 3: The JWT is still in localStorage
  400 |     token = await page.evaluate(() => localStorage.getItem("token"));
  401 |     expect(token).toBeTruthy();
  402 | 
  403 |     // EXPECTED RESULT 4: The UI still reflects the logged-in state (Adjust selector as needed)
```
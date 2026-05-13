import { test, expect } from "@playwright/test";
import bcrypt from "bcrypt";
import path from "path";
import { pool } from "../../../test-utils/dbCon";

test.describe("Make Property Functional Tests", () => {
  const testEmail = "seller@example.com";
  const rawPassword = "password123";
  let userId: number;
  let authToken: string;

  // PRECONDITION: Make user and generate a valid login state
  test.beforeEach(async ({ request }) => {
    // 1. Clean the database
    await pool.query("DELETE FROM users WHERE email = $1", [testEmail]);

    // 2. Insert the test user
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const userResult = await pool.query(
      "INSERT INTO users (fullname, email, password, city) VALUES ($1, $2, $3, $4) RETURNING id",
      ["Test Seller", testEmail, hashedPassword, "citycity"],
    );
    userId = userResult.rows[0].id;

    // 3. Log in via API to get the JWT token for API tests
    const loginResponse = await request.post(
      "http://localhost:5000/api/auth/login",
      {
        data: { email: testEmail, password: rawPassword },
      },
    );
    const loginData = await loginResponse.json();

    expect(loginResponse.status()).toBe(200); // Force the test to fail immediately if login fails!

    authToken = loginData.jwtToken;
  });

  // TEARDOWN: Clean up the database (cascading deletes will handle properties)
  test.afterAll(async () => {
    await pool.query("DELETE FROM users WHERE email = $1", [testEmail]);
  });

  // ----------------------------------------------------------------------

  test("TC-FUNC-MP-001: Verify successful property making with valid data and image uploads", async ({
    page,
  }) => {
    // PROCEDURE 1: Log the user into the UI
    // Ensure you use 'jwtToken' here as seen in your backend logs
    await page.goto("http://localhost:5173/");
    await page.evaluate((token) => {
      localStorage.setItem("token", token);
    }, authToken);

    // PROCEDURE 2: Navigate to Make Listing
    await page.goto("http://localhost:5173/publish");

    // PROCEDURE 3: Fill out the form
    await page.fill('input[name="title"]', "Modern Downtown Loft");
    await page.fill(
      'textarea[name="description"]',
      "Beautiful open-concept loft with city views.",
    );
    await page.fill('input[name="price"]', "250000");
    await page.fill('input[name="address"]', "123 Main St, Istanbul");

    // PROCEDURE 4: Attach dummy images
    const imagePath = path.join(
      __dirname,
      "../../../test-data/images/dummy.jpg",
    );
    await page.setInputFiles('input[type="file"]', [imagePath]);

    // PROCEDURE 5: Submit the form and wait for the API response concurrently
    // Using Promise.all prevents the race condition where the response finishes
    // before Playwright starts waiting for it.
    const [response] = await Promise.all([
      page.waitForResponse(
        (res) =>
          res.url().includes("/api/property") &&
          res.request().method() === "POST",
        { timeout: 10000 },
      ),
      page.click('button[type="submit"]'),
    ]);

    // EXPECTED RESULT 1: Server returns 201 Created
    expect(response.status()).toBe(201);

    // EXPECTED RESULT 2: Redirects
    // Increased timeout to allow for image upload processing and navigation
    await page.waitForURL(/.*my-listings|.*home/, { timeout: 5000 });
    expect(page.url()).toMatch(/.*my-listings|.*home/);

    // EXPECTED RESULT 3 & 4: Database Validation
    const dbResult = await pool.query(
      "SELECT * FROM properties WHERE user_id = $1 ORDER BY id DESC LIMIT 1",
      [userId],
    );
    expect(dbResult.rows.length).toBe(1);

    const propertyId = dbResult.rows[0].id;
    const imageResult = await pool.query(
      "SELECT * FROM property_images WHERE property_id = $1",
      [propertyId],
    );
    expect(imageResult.rows.length).toBeGreaterThan(0);
  });

  // ----------------------------------------------------------------------

  test("TC-FUNC-MP-002: Verify form validation and server response when mandatory fields are omitted", async ({
    request,
  }) => {
    // Note: We use the API context here to explicitly test the backend validation bypass

    // PROCEDURE: Send POST request missing Title and Price
    const response = await request.post("http://localhost:5000/api/property", {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      multipart: {
        description: "Missing title and price",
        address: "Nowhere St",
        // Omitting title, price, and images
      },
    });

    // EXPECTED RESULT: Server rejects the malformed data (400 or 500 depending on your DB constraints)
    expect([400, 500]).toContain(response.status());

    // EXPECTED RESULT: Database remains clean of this bad entry
    const dbResult = await pool.query(
      "SELECT * FROM properties WHERE description = $1",
      ["Missing title and price"],
    );
    expect(dbResult.rows.length).toBe(0);
  });

  // ----------------------------------------------------------------------

  test("TC-FUNC-MP-003: Verify unauthenticated user cannot access creation form or submit", async ({
    page,
    request,
  }) => {
    // PROCEDURE 1 (Frontend): Attempt to navigate without a token
    await page.goto("http://localhost:5173/");
    await page.evaluate(() => localStorage.removeItem("token")); // Ensure clean state
    await page.goto("http://localhost:5173/publish");

    // EXPECTED RESULT 1: React router blocks access and redirects to login
    await expect(page).toHaveURL("http://localhost:5173/login");

    // PROCEDURE 2 (Backend): Send API request without Authorization header
    const response = await request.post("http://localhost:5000/api/property", {
      multipart: {
        title: "Hacker Property",
        description: "Trying to bypass auth",
        price: "100",
        address: "123 Bad St",
      },
    });

    // EXPECTED RESULT 2: Backend middleware intercepts and returns 401 Unauthorized
    expect(response.status()).toBe(401);
  });
});

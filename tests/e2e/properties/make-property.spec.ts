import { test, expect } from "@playwright/test";
import bcrypt from "bcrypt";
import path from "path";
import { pool } from "../../../test-utils/dbCon";
import fs from "fs";

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

  test("TC-FUNC-MP-005: Server rejects upload exceeding limit", async ({
    request,
  }) => {
    const imagePath = path.join(
      __dirname,
      "../../../test-data/images/dummy.jpg",
    );

    // Use a loop to make the multipart object
    const multipartPayload: any = {
      title: "Too Many Images Test",
      description: "Trying to break the server with 11 images.",
      price: "100000",
      address: "123 Overflow St",
    };

    // Playwright handles arrays of files by repeating the key
    // We provide the buffer directly.
    const imageBuffer = fs.readFileSync(imagePath);

    // We manually build the multipart entries
    const response = await request.post("http://localhost:5000/api/property", {
      headers: { Authorization: `Bearer ${authToken}` },
      multipart: {
        ...multipartPayload,
        // Pass an array of objects with 'name', 'mimeType', and 'buffer'
        images: Array(11)
          .fill(0)
          .map(() => ({
            name: "dummy.jpg",
            mimeType: "image/jpeg",
            buffer: imageBuffer,
          })),
      },
    });

    expect(response.status()).toBe(400);
  });

  // ----------------------------------------------------------------------

  test("TC-FUNC-MP-007: AI description generation fails gracefully when no images are provided", async ({
    page,
  }) => {
    // PROCEDURE 1: Log in
    await page.goto("http://localhost:5173/");
    await page.evaluate((token) => {
      localStorage.setItem("token", token);
    }, authToken);

    // PROCEDURE 2: Navigate to Make Listing
    await page.goto("http://localhost:5173/publish");

    // PROCEDURE 3: Click AI generate without uploading files
    // Note: Adjust the locator text if your button says something different!
    const [response] = await Promise.all([
      // We use a wildcard '.*' to catch whatever your AI route is named
      page.waitForResponse(
        (res) =>
          res
            .url()
            .includes(
              "http://localhost:5000/api/property/generate-description",
            ) && res.request().method() === "POST",
        { timeout: 5000 },
      ),
      page.click('button:has-text("Auto-Write with AI")'),
    ]);

    // EXPECTED RESULT: Backend returns 400 with specific error
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("No images provided for scanning.");
  });
});

test.describe("Property Form Boundary Validations (Zod)", () => {
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
  // Base valid payload to use as a starting point
  const validPayload = {
    title: "Perfect Luxury Villa", // 20 chars (Valid)
    description: "This is a beautiful property that meets the minimum length.", // 59 chars (Valid)
    price: 500000, // Positive number (Valid)
    address: "123 Main Street", // 15 chars (Valid)
  };

  test("TC-FUNC-MP-008: Server rejects Title that is too short or too long", async ({
    request,
  }) => {
    // 1. Test Title too short (< 5 chars)
    const shortTitleRes = await request.post(
      "http://localhost:5000/api/property",
      {
        headers: { Authorization: `Bearer ${authToken}` },
        multipart: { ...validPayload, title: "A" }, // Only 1 char
      },
    );
    expect(shortTitleRes.status()).toBe(400);
    const shortBody = await shortTitleRes.json();
    // Assuming your backend returns Zod errors in an array or string
    expect(JSON.stringify(shortBody)).toContain(
      "Title must be at least 5 characters",
    );

    // 2. Test Title too long (> 100 chars)
    const longTitle = "A".repeat(101);
    const longTitleRes = await request.post(
      "http://localhost:5000/api/property",
      {
        headers: { Authorization: `Bearer ${authToken}` },
        multipart: { ...validPayload, title: longTitle },
      },
    );
    expect(longTitleRes.status()).toBe(400);
    const longBody = await longTitleRes.json();
    expect(JSON.stringify(longBody)).toContain(
      "Title cannot exceed 100 characters",
    );
  });

  test("TC-FUNC-MP-009: Server rejects Description and Address below minimum lengths", async ({
    request,
  }) => {
    // 1. Test Description too short (< 20 chars)
    const shortDescRes = await request.post(
      "http://localhost:5000/api/property",
      {
        headers: { Authorization: `Bearer ${authToken}` },
        multipart: { ...validPayload, description: "Too short" }, // 9 chars
      },
    );
    expect(shortDescRes.status()).toBe(400);
    expect(JSON.stringify(await shortDescRes.json())).toContain(
      "Description must be at least 20 characters",
    );

    // 2. Test Address too short (< 5 chars)
    const shortAddrRes = await request.post(
      "http://localhost:5000/api/property",
      {
        headers: { Authorization: `Bearer ${authToken}` },
        multipart: { ...validPayload, address: "123" }, // 3 chars
      },
    );
    expect(shortAddrRes.status()).toBe(400);
    expect(JSON.stringify(await shortAddrRes.json())).toContain(
      "Please provide a complete address",
    );
  });

  test("TC-FUNC-MP-010: Server rejects Price that is zero, negative, or non-numeric", async ({
    request,
  }) => {
    // 1. Test Negative Price
    const negativePriceRes = await request.post(
      "http://localhost:5000/api/property",
      {
        headers: { Authorization: `Bearer ${authToken}` },
        multipart: { ...validPayload, price: "-5000" },
      },
    );
    expect(negativePriceRes.status()).toBe(400);
    expect(JSON.stringify(await negativePriceRes.json())).toContain(
      "Price must be greater than zero",
    );

    // 2. Test Zero Price
    const zeroPriceRes = await request.post(
      "http://localhost:5000/api/property",
      {
        headers: { Authorization: `Bearer ${authToken}` },
        multipart: { ...validPayload, price: "0" },
      },
    );
    expect(zeroPriceRes.status()).toBe(400);
    expect(JSON.stringify(await zeroPriceRes.json())).toContain(
      "Price must be greater than zero",
    );

    // 3. Test completely invalid string (bypasses z.coerce)
    const nanPriceRes = await request.post(
      "http://localhost:5000/api/property",
      {
        headers: { Authorization: `Bearer ${authToken}` },
        multipart: { ...validPayload, price: "Not a number" },
      },
    );
    expect(nanPriceRes.status()).toBe(400);
    expect(JSON.stringify(await nanPriceRes.json())).toContain(
      "Price must be a valid number",
    );
  });
});

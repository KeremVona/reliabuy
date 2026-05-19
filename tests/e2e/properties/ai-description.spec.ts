import { test, expect } from "@playwright/test";
import bcrypt from "bcrypt";
import path from "path";
import { pool } from "../../../test-utils/dbCon";

test.describe("Property Making - AI Integration Tests", () => {
  const testEmail = "ai_tester@example.com";
  const rawPassword = "password123";
  let authToken: string;

  // PRECONDITION: Ensure user exists and get valid JWT
  test.beforeEach(async ({ request }) => {
    await pool.query("DELETE FROM users WHERE email = $1", [testEmail]);

    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    await pool.query(
      "INSERT INTO users (fullname, email, password, city) VALUES ($1, $2, $3, $4)",
      ["AI Tester", testEmail, hashedPassword, "city"],
    );

    const loginResponse = await request.post(
      "http://localhost:5000/api/auth/login",
      {
        data: { email: testEmail, password: rawPassword },
      },
    );
    const loginData = await loginResponse.json();
    authToken = loginData.jwtToken;
  });

  // TEARDOWN: Clean up user
  test.afterAll(async () => {
    await pool.query("DELETE FROM users WHERE email = $1", [testEmail]);
  });

  // ----------------------------------------------------------------------

  test("TC-FUNC-MP-004: Verify AI description generation successfully populates the description field", async ({
    page,
  }) => {
    // PROCEDURE 1: Log in and navigate to the Make Listing page
    await page.goto("http://localhost:5173/");
    await page.evaluate((token) => {
      localStorage.setItem("token", token);
    }, authToken);
    await page.goto("http://localhost:5173/publish");

    // PROCEDURE 2: Attach a valid image file to the Multer input
    const imagePath = path.join(
      __dirname,
      "../../../test-data/images/dummy.jpg",
    );
    await page.setInputFiles('input[type="file"]', imagePath);

    // Set up a listener to intercept and wait for the specific AI backend route.
    // Adjust the URL string if your Express route is named something else (e.g., /api/property/generate-description)
    const aiResponsePromise = page.waitForResponse(
      (response) =>
        response
          .url()
          .includes(
            "http://localhost:5000/api/property/generate-description",
          ) &&
        response.request().method() === "POST" &&
        // Looking for the request that contains the Multer files but doesn't redirect
        response.url().includes("description"),
    );

    // PROCEDURE 3: Click the "Auto-Write with AI" button
    // Using a text selector since we styled it as "✨ Auto-Write with AI"
    const generateBtn = page.locator("button", {
      hasText: "Auto-Write with AI",
    });
    await expect(generateBtn).not.toBeDisabled(); // Ensure it activated after file upload
    await generateBtn.click();

    // Verify UI changes to loading state
    const loadingBtn = page.locator("button", { hasText: "AI is Writing..." });
    await expect(loadingBtn).toBeVisible();

    // PROCEDURE 4: Wait for the backend/Gemini response
    const apiResponse = await aiResponsePromise;
    const responseData = await apiResponse.json();

    // EXPECTED RESULT 1: Backend processes successfully via gemini-2.5-flash
    expect(apiResponse.status()).toBe(200);
    expect(responseData.description).toBeTruthy(); // Verify the payload contains the description text
    expect(responseData.description.length).toBeGreaterThan(50); // Ensure it actually wrote a paragraph

    // EXPECTED RESULT 2: Frontend automatically populates the Description textarea
    const descriptionTextarea = page.locator('textarea[name="description"]');

    // Playwright will automatically wait and check if the textarea's value matches what the API returned
    await expect(descriptionTextarea).toHaveValue(responseData.description);
  });
});

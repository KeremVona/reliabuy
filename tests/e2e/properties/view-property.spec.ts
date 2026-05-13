import { expect, test } from "@playwright/test";
import {
  clearDatabase,
  seedTestProperty,
  seedTestUser,
} from "../../../test-utils/db";

test.describe("Property Viewing & Access Control", () => {
  let seededPropertyId: number;

  test.beforeEach(async () => {
    // 1. Wipe the test DB
    await clearDatabase();
    // 2. Make the user FIRST
    // Assuming you have a seedUser helper
    const user = await seedTestUser(
      "testtest",
      "seller@example.com",
      "superpassword123",
      "citycity",
      false,
    );
    // 2. Seed exactly one property for testing and grab its ID
    seededPropertyId = await seedTestProperty({
      user_id: user.id,
      title: "Public Test Villa",
      description: "A beautiful villa visible to everyone.",
      price: 500000,
      address: "789 Public View St",
    });
  });

  test("TC-FUNC-VIEW-001: Unauthenticated user can view all properties", async ({
    page,
    request,
  }) => {
    // API Check: Ensure the backend doesn't block unauthenticated GET requests
    const apiResponse = await request.get("http://localhost:5000/api/property");
    expect(apiResponse.status()).toBe(200);
    const apiBody = await apiResponse.json();
    expect(apiBody.data.length).toBeGreaterThan(0);
    expect(apiBody.data[0].title).toBe("Public Test Villa");

    // UI Check: Ensure frontend renders without a token
    await page.goto("http://localhost:5173/home");
    await expect(page.locator("text=Public Test Villa")).toBeVisible();
  });

  test("TC-FUNC-VIEW-002: User can view a specific property by ID", async ({
    page,
  }) => {
    await page.goto(`http://localhost:5173/property/${seededPropertyId}`);

    // Verify the property detail page loads the specific seeded data
    await expect(page.locator("text=Public Test Villa")).toBeVisible();
    await expect(page.locator("text=789 Public View St")).toBeVisible();
  });

  test("TC-FUNC-VIEW-003: Controller blocks invalid ID strings (400 Bad Request)", async ({
    request,
  }) => {
    // We test the API directly to verify the isNaN() block works
    const apiResponse = await request.get(
      "http://localhost:5000/api/property/abc",
    );

    expect(apiResponse.status()).toBe(400);
    const apiBody = await apiResponse.json();
    expect(apiBody.error).toBe("Invalid Property ID provided");
  });

  test("TC-FUNC-VIEW-004: Controller returns 404 for non-existent valid IDs", async ({
    request,
  }) => {
    const apiResponse = await request.get(
      "http://localhost:5000/api/property/:999999",
    );

    expect(apiResponse.status()).toBe(404);
    const apiBody = await apiResponse.json();
    expect(apiBody.message).toBe("Property not found");
  });
});

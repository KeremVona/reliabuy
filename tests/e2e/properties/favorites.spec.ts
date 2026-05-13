import { test, expect } from "@playwright/test";
import {
  clearDatabase,
  seedTestUser,
  seedTestProperty,
} from "../../../test-utils/db";

test.describe("Favorites (Save/Unsave Properties)", () => {
  let userToken: string;
  let userId: number;
  let propertyId: number;

  test.beforeEach(async ({ request }) => {
    // 1. Wipe the test database
    await clearDatabase();

    // 2. Seed a test user
    const userData = await seedTestUser(
      "favorite_tester@example.com",
      "password123",
      "fullname",
      "city",
    );
    userId = userData.id;

    // Authenticate the user to get their JWT
    const loginResponse = await request.post(
      "http://localhost:5000/api/auth/login",
      {
        data: { email: "favorite_tester@example.com", password: "password123" },
      },
    );
    const loginJson = await loginResponse.json();
    userToken = loginJson.jwtToken;

    // 3. Seed a generic property (owned by someone else)
    const ownerData = await seedTestUser(
      "owner@example.com",
      "password123",
      "fullname",
      "city",
    );
    propertyId = await seedTestProperty({
      user_id: ownerData.id,
      title: "Beautiful Beach House",
      description: "Perfect for saving to favorites.",
      price: 850000,
      address: "101 Ocean Drive",
    });
  });

  test("TC-FUNC-FAV-001: User can successfully save a property to favorites", async ({
    request,
  }) => {
    // Execute the Save action
    const saveResponse = await request.post(
      `http://localhost:5000/api/property/${propertyId}/favorite`,
      {
        headers: { Authorization: `Bearer ${userToken}` },
      },
    );

    // Verify successful response
    expect(saveResponse.status()).toBe(200);
    const saveBody = await saveResponse.json();
    expect(saveBody.message).toBe("Property saved to favorites");

    // Verify it actually appears in the user's saved list
    const getSavedResponse = await request.get(
      "http://localhost:5000/api/property/saved",
      {
        headers: { Authorization: `Bearer ${userToken}` },
      },
    );
    const getSavedBody = await getSavedResponse.json();
    expect(getSavedBody.data.length).toBe(1);
    expect(getSavedBody.data[0].id).toBe(propertyId);
  });

  test("TC-FUNC-FAV-002: User can successfully remove a property from favorites", async ({
    request,
  }) => {
    // Pre-save the property first
    await request.post(
      `http://localhost:5000/api/property/${propertyId}/favorite`,
      {
        headers: { Authorization: `Bearer ${userToken}` },
      },
    );

    // Execute the Unsave action
    const unsaveResponse = await request.delete(
      `http://localhost:5000/api/property/${propertyId}/favorite`,
      {
        headers: { Authorization: `Bearer ${userToken}` },
      },
    );

    // Verify successful removal response
    expect(unsaveResponse.status()).toBe(200);
    const unsaveBody = await unsaveResponse.json();
    expect(unsaveBody.message).toBe("Property removed from favorites");

    // Verify the saved list is now empty
    const getSavedResponse = await request.get(
      "http://localhost:5000/api/property/saved",
      {
        headers: { Authorization: `Bearer ${userToken}` },
      },
    );
    const getSavedBody = await getSavedResponse.json();
    expect(getSavedBody.data.length).toBe(0);
  });

  test("TC-FUNC-FAV-003: Server rejects unauthenticated save attempts (401 Unauthorized)", async ({
    request,
  }) => {
    // Attempt to save without a token
    const saveResponse = await request.post(
      `http://localhost:5000/api/property/${propertyId}/favorite`,
    );

    // Verify it was blocked by the custom middleware
    expect(saveResponse.status()).toBe(401);
  });

  test("TC-FUNC-FAV-004: Controller rejects invalid ID string formats (400 Bad Request)", async ({
    request,
  }) => {
    // Send request with an invalid ID string ('abc')
    const saveResponse = await request.post(
      "http://localhost:5000/api/property/abc/favorite",
      {
        headers: { Authorization: `Bearer ${userToken}` },
      },
    );

    expect(saveResponse.status()).toBe(400);
    const apiBody = await saveResponse.json();
    expect(apiBody.message).toBe("Invalid property ID");
  });
});

import { test, expect } from "@playwright/test";
import {
  clearDatabase,
  seedTestUser,
  seedTestProperty,
} from "../../../test-utils/db";

//test.describe.configure({ mode: "serial" });

test.describe("Property Updating & Ownership Validation", () => {
  let ownerToken: string;
  let attackerToken: string;
  let ownerId: number;
  let propertyId: number;

  test.beforeEach(async ({ request }) => {
    // 1. Wipe the test DB
    await clearDatabase();

    // 2. Seed the rightful owner
    const ownerData = await seedTestUser(
      "owner@example.com",
      "password123",
      "fullname",
      "city",
    );
    ownerId = ownerData.id;

    // Authenticate the owner to get their JWT
    const ownerLogin = await request.post(
      "http://localhost:5000/api/auth/login",
      {
        data: { email: "owner@example.com", password: "password123" },
      },
    );
    const ownerJson = await ownerLogin.json();
    ownerToken = ownerJson.jwtToken;
    // --- ADD THIS DEBUGGER ---
    // console.log("OWNER TOKEN CAPTURED:", ownerJson);
    expect(ownerToken).toBeDefined();
    // -------------------------

    // 3. Seed an "attacker" (another valid user)
    await seedTestUser(
      "attacker@example.com",
      "password123",
      "fullname",
      "city",
    );
    const attackerLogin = await request.post(
      "http://localhost:5000/api/auth/login",
      {
        data: { email: "attacker@example.com", password: "password123" },
      },
    );
    const attackerJson = await attackerLogin.json();
    attackerToken = attackerJson.jwtToken;

    // 4. Seed exactly one property owned by the rightful owner
    propertyId = await seedTestProperty({
      user_id: ownerId,
      title: "Original Title",
      description: "Original Description",
      price: 500000,
      address: "123 Starter Ave",
    });
  });

  test("TC-FUNC-EDIT-001: Owner can successfully update their own property", async ({
    page,
    request,
  }) => {
    // Inject the owner's token into localStorage so the UI knows we are logged in
    await page.goto("http://localhost:5173");
    await page.evaluate((token) => {
      localStorage.setItem("token", token);
    }, ownerToken);

    // Navigate directly to the edit page for this specific property
    await page.goto(`http://localhost:5173/property/edit/:${propertyId}`);
    // 3. Fill form
    await page.fill('input[name="title"]', "Updated Luxury Villa");
    await page.fill('input[name="price"]', "750000");

    page.on("request", (request) =>
      console.log(">> Fired:", request.method(), request.url()),
    );

    // 4. Submit and Wait for the PUT request
    // We use a regex for the URL to be safe against trailing slashes
    const [response] = await Promise.all([
      page.waitForResponse(
        (res) =>
          res
            .url()
            .includes(`http://localhost:5000/api/property/${propertyId}`) &&
          res.request().method() === "PUT",
      ),
      page.click('button[type="submit"]'),
    ]);

    expect(response.status()).toBe(200);

    // 5. Verify the backend directly
    const apiResponse = await request.get(
      `http://localhost:5000/api/property/${propertyId}`,
    );
    const apiData = await apiResponse.json();

    expect(apiData.data.title).toBe("Updated Luxury Villa");
    expect(Number(apiData.data.price)).toBe(750000);
  });

  test("TC-FUNC-EDIT-002: Server rejects update if user does not own the property (403 Forbidden)", async ({
    request,
  }) => {
    // The "attacker" tries to update the owner's property
    const apiResponse = await request.put(
      `http://localhost:5000/api/property/${propertyId}`,
      {
        headers: {
          Authorization: `Bearer ${attackerToken}`,
        },
        data: {
          title: "Hacked Title",
          description: "Hacked Description",
          price: 1,
          address: "Hacked Address",
        },
      },
    );

    // Check that the custom middleware/controller caught the mismatch
    expect(apiResponse.status()).toBe(403);
    const apiBody = await apiResponse.json();
    expect(apiBody.message).toBe(
      "Unauthorized: You can only edit your own properties.",
    );

    // Verify the database was not modified
    const checkDb = await request.get(
      `http://localhost:5000/api/property/${propertyId}`,
    );
    const checkDbData = await checkDb.json();
    expect(checkDbData.data.title).toBe("Original Title");
  });

  test("TC-FUNC-EDIT-003: Server returns 404 when updating non-existent property", async ({
    request,
  }) => {
    const apiResponse = await request.put(
      "http://localhost:5000/api/property/:99999",
      {
        headers: {
          Authorization: `Bearer ${ownerToken}`,
        },
        data: {
          title: "Ghost Title",
          description: "Ghost Description",
          price: 100,
          address: "Ghost Ave",
        },
      },
    );

    expect(apiResponse.status()).toBe(404);
  });

  test("TC-FUNC-EDIT-004: Server rejects invalid ID string formats (400 Bad Request)", async ({
    request,
  }) => {
    const apiResponse = await request.put(
      "http://localhost:5000/api/property/abc",
      {
        headers: {
          Authorization: `Bearer ${ownerToken}`,
        },
        data: {
          title: "Invalid ID Test",
          description: "Testing Controller",
          price: 100,
          address: "Test Ave",
        },
      },
    );

    expect(apiResponse.status()).toBe(400);
    const apiBody = await apiResponse.json();
    expect(apiBody.error).toBe("Invalid Property ID provided");
  });
});

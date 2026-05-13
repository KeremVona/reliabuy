import { expect, test } from "@playwright/test";
import {
  clearDatabase,
  seedTestProperty,
  seedTestUser,
} from "../../../test-utils/db";

test.describe("User Dashboards (My Listings & Saved Properties)", () => {
  let userAToken: string;
  let userBToken: string;
  let userAId: number;
  let userBId: number;
  let sharedPropertyId: number; // A property published by B, but favorited by A

  test.beforeEach(async ({ request }) => {
    // 1. Wipe the test database
    await clearDatabase();

    // 2. Seed User A
    const userAData = await seedTestUser(
      "userA@example.com",
      "password123",
      "fullname",
      "city",
    );
    userAId = userAData.id;
    const loginA = await request.post("http://localhost:5000/api/auth/login", {
      data: { email: "userA@example.com", password: "password123" },
    });
    userAToken = (await loginA.json()).jwtToken;

    // 3. Seed User B
    const userBData = await seedTestUser(
      "userB@example.com",
      "password123",
      "fullnametwo",
      "city",
    );
    userBId = userBData.id;
    const loginB = await request.post("http://localhost:5000/api/auth/login", {
      data: { email: "userB@example.com", password: "password123" },
    });
    userBToken = (await loginB.json()).jwtToken;

    // 4. Seed Properties
    // User A publishes 2 properties
    await seedTestProperty({
      user_id: userAId,
      title: "User A Villa 1",
      description: "...",
      price: 100,
      address: "...",
    });
    await seedTestProperty({
      user_id: userAId,
      title: "User A Villa 2",
      description: "...",
      price: 200,
      address: "...",
    });

    // User B publishes 1 property
    sharedPropertyId = await seedTestProperty({
      user_id: userBId,
      title: "User B Condo",
      description: "...",
      price: 300,
      address: "...",
    });

    // 5. User A favorites User B's property
    await request.post(
      `http://localhost:5000/api/property/${sharedPropertyId}/favorite`,
      {
        headers: { Authorization: `Bearer ${userAToken}` },
      },
    );
  });

  test("TC-FUNC-MYLIST-001: Authenticated user retrieves only their own published properties", async ({
    request,
  }) => {
    // User A requests their listings
    const response = await request.get(
      "http://localhost:5000/api/property/my-listings",
      {
        headers: { Authorization: `Bearer ${userAToken}` },
      },
    );

    expect(response.status()).toBe(200);
    const responseBody = await response.json();

    // User A should have exactly 2 properties
    expect(responseBody.count).toBe(2);
    expect(responseBody.data.length).toBe(2);

    // Ensure User B's condo did not leak into User A's listings
    const titles = responseBody.data.map((p: any) => p.title);
    expect(titles).toContain("User A Villa 1");
    expect(titles).toContain("User A Villa 2");
    expect(titles).not.toContain("User B Condo");
  });

  test("TC-FUNC-MYLIST-002: Server blocks unauthenticated access to My Listings", async ({
    request,
  }) => {
    const response = await request.get(
      "http://localhost:5000/api/property/my-listings",
    );
    expect(response.status()).toBe(401);
  });

  test("TC-FUNC-MYSAVED-001: Authenticated user retrieves only their favorited properties", async ({
    request,
  }) => {
    // User A requests their saved properties
    const response = await request.get(
      "http://localhost:5000/api/property/saved",
      {
        headers: { Authorization: `Bearer ${userAToken}` },
      },
    );

    expect(response.status()).toBe(200);
    const responseBody = await response.json();

    // User A favorited exactly 1 property (User B's Condo)
    expect(responseBody.count).toBe(1);
    expect(responseBody.data[0].id).toBe(sharedPropertyId);
    expect(responseBody.data[0].title).toBe("User B Condo");
  });

  test("TC-FUNC-MYSAVED-002: Server blocks unauthenticated access to Saved Properties", async ({
    request,
  }) => {
    const response = await request.get(
      "http://localhost:5000/api/property/saved",
    );
    expect(response.status()).toBe(401);
  });
});

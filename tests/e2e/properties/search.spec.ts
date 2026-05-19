import { expect, test } from "@playwright/test";
import {
  clearDatabase,
  seedTestProperty,
  seedTestUser,
} from "../../../test-utils/db";

test.describe("Global Property Search", () => {
  let ownerToken: string;
  let ownerId: number;

  test.beforeEach(async ({ request }) => {
    // 1. Wipe the test database
    await clearDatabase();

    const ownerData = await seedTestUser(
      "owner@example.com",
      "pAssword123",
      "fullname",
      "city",
    );
    ownerId = ownerData.id;

    // Authenticate the owner to get their JWT
    const ownerLogin = await request.post(
      "http://localhost:5000/api/auth/login",
      {
        data: { email: "owner@example.com", password: "pAssword123" },
      },
    );

    console.log("test2", ownerLogin.status());

    console.log("test", await ownerLogin.json());
    ownerToken = (await ownerLogin.json()).jwtToken;
    //const ownerJson = await ownerLogin.json();
    //ownerToken = ownerJson.jwtToken;
    // --- ADD THIS DEBUGGER ---
    // console.log("OWNER TOKEN CAPTURED:", ownerJson);
    expect(ownerToken).toBeDefined();

    // 2. Seed diverse properties for testing
    await seedTestProperty({
      user_id: ownerId,
      title: "Cozy Downtown Loft",
      description: "A great place to live.",
      price: 250000,
      address: "456 Urban Blvd",
    });

    await seedTestProperty({
      title: "Suburban Family Home",
      description: "Spacious backyard.",
      price: 450000,
      address: "123 Cozy Ave",
    });

    await seedTestProperty({
      title: "LUXURY PENTHOUSE",
      description: "Top floor views.",
      price: 1500000,
      address: "1 Highrise Way",
    });
  });

  test("TC-FUNC-SEARCH-001: Search finds partial matches in both Title and Address", async ({
    request,
  }) => {
    const response = await request.get(
      "http://localhost:5000/api/property/search?q=cozy",
    );

    expect(response.status()).toBe(200);
    const body = await response.json();

    // It should find both the "Cozy Downtown Loft" (title match) and "Suburban Family Home" (address match)
    expect(body.data.length).toBe(2);

    const titles = body.data.map((p: any) => p.title);
    expect(titles).toContain("Cozy Downtown Loft");
    expect(titles).toContain("Suburban Family Home");
  });

  test("TC-FUNC-SEARCH-002: Search is case-insensitive (ILIKE)", async ({
    request,
  }) => {
    // Searching lowercase for an uppercase database entry
    const response = await request.get(
      "http://localhost:5000/api/property/search?q=luxury penthouse",
    );

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body.data.length).toBe(1);
    expect(body.data[0].title).toBe("LUXURY PENTHOUSE");
  });

  test("TC-FUNC-SEARCH-003: Search returns empty array for no matches", async ({
    request,
  }) => {
    const response = await request.get(
      "http://localhost:5000/api/property/search?q=Space Station",
    );

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body.data).toEqual([]);
    expect(body.data.length).toBe(0);
  });

  test("TC-FUNC-SEARCH-004: Controller rejects missing search term (400 Bad Request)", async ({
    request,
  }) => {
    const response = await request.get(
      "http://localhost:5000/api/property/search",
    );

    expect(response.status()).toBe(400);
    const body = await response.json();

    expect(body.message).toBe("Search term is required");
  });
});

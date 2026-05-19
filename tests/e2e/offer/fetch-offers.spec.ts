import { expect, test } from "@playwright/test";
import {
  clearDatabase,
  seedTestProperty,
  seedTestUser,
} from "../../../test-utils/db";

test.describe("Fetching Offers", () => {
  let sellerToken: string;
  let buyerToken: string;
  let sellerId: number;
  let buyerId: number;
  let propertyId1: number;
  let propertyId2: number;

  test.beforeEach(async ({ request }) => {
    // 1. Wipe the test database
    await clearDatabase();

    // 2. Seed Seller
    const sellerData = await seedTestUser(
      "seller@example.com",
      "password123",
      "Seller Name",
      "city",
    );
    sellerId = sellerData.id;
    const sellerLogin = await request.post(
      "http://localhost:5000/api/auth/login",
      {
        data: { email: "seller@example.com", password: "password123" },
      },
    );
    sellerToken = (await sellerLogin.json()).jwtToken;

    // 3. Seed Buyer
    const buyerData = await seedTestUser(
      "buyer@example.com",
      "password123",
      "Buyer Name",
      "city",
    );
    buyerId = buyerData.id;
    const buyerLogin = await request.post(
      "http://localhost:5000/api/auth/login",
      {
        data: { email: "buyer@example.com", password: "password123" },
      },
    );
    buyerToken = (await buyerLogin.json()).jwtToken;

    // 4. Seed Properties owned by Seller
    propertyId1 = await seedTestProperty({
      user_id: sellerId,
      title: "Seller House 1",
      price: 500000,
    });
    propertyId2 = await seedTestProperty({
      user_id: sellerId,
      title: "Seller House 2",
      price: 300000,
    });

    // 5. Buyer makes offers via direct API calls
    const off1 = await request.post("http://localhost:5000/api/offer", {
      headers: { Authorization: `Bearer ${buyerToken}` },
      data: { amount: 480000, propertyId: propertyId1 },
    });
    expect(off1.status()).toBe(201);

    const off2 = await request.post("http://localhost:5000/api/offer", {
      headers: { Authorization: `Bearer ${buyerToken}` },
      data: { amount: 290000, propertyId: propertyId2 },
    });
    expect(off2.status()).toBe(201);
  });

  test("TC-FUNC-OFF-001: Authenticated user can fetch offers for a specific property", async ({
    request,
  }) => {
    const response = await request.get(
      `http://localhost:5000/api/offer/property/${propertyId1}`,
      {
        headers: { Authorization: `Bearer ${sellerToken}` },
      },
    );

    expect(response.status()).toBe(200);
    const body = await response.json();

    // Check that we got exactly the 1 offer made on Property 1
    expect(body.length).toBe(1);
    expect(body[0].amount).toBe("480000.00");
    expect(body[0].property_id).toBe(propertyId1);

    // Check that the SQL JOIN successfully grabbed the buyer's name
    expect(body[0].buyer_name).toBe("Buyer Name");
  });

  test("TC-FUNC-OFF-002: Seller can fetch all received offers across their properties", async ({
    request,
  }) => {
    const response = await request.get(
      "http://localhost:5000/api/offer/received",
      {
        headers: { Authorization: `Bearer ${sellerToken}` },
      },
    );

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body.success).toBe(true);

    // The seller should see both offers across the two different properties
    expect(body.data.length).toBe(2);

    // Validate the complex SQL joins (properties AND users)
    const titles = body.data.map((o: any) => o.property_title);
    expect(titles).toContain("Seller House 1");
    expect(titles).toContain("Seller House 2");

    expect(body.data[0].buyer_name).toBe("Buyer Name");
    expect(body.data[0].buyer_email).toBe("buyer@example.com");
  });

  test("TC-FUNC-OFF-003: Server blocks unauthenticated access to offer retrieval", async ({
    request,
  }) => {
    // Attempt property-specific route
    const propResponse = await request.get(
      `http://localhost:5000/api/offer/property/${propertyId1}`,
    );
    expect(propResponse.status()).toBe(401);

    // Attempt received-offers route
    const recResponse = await request.get(
      "http://localhost:5000/api/offer/received",
    );
    expect(recResponse.status()).toBe(401);
  });
});

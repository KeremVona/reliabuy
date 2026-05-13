import { expect, test } from "@playwright/test";
import {
  clearDatabase,
  seedTestProperty,
  seedTestUser,
} from "../../../test-utils/db";

test.describe("Making and Responding to Offers", () => {
  let sellerToken: string;
  let buyerToken: string;
  let attackerToken: string;

  let sellerId: number;
  let propertyId: number;
  let seededOfferId: number; // Used for the response tests

  test.beforeEach(async ({ request }) => {
    // 1. Wipe the test database
    await clearDatabase();

    // 2. Seed Users
    const sellerData = await seedTestUser(
      "seller@example.com",
      "password123",
      "fullname",
      "city",
    );
    sellerId = sellerData.id;
    sellerToken = (
      await (
        await request.post("http://localhost:5000/api/auth/login", {
          data: { email: "seller@example.com", password: "password123" },
        })
      ).json()
    ).jwtToken;

    const buyerData = await seedTestUser(
      "buyer@example.com",
      "password123",
      "fullnametwo",
      "city",
    );
    buyerToken = (
      await (
        await request.post("http://localhost:5000/api/auth/login", {
          data: { email: "buyer@example.com", password: "password123" },
        })
      ).json()
    ).jwtToken;

    const attackerData = await seedTestUser(
      "attacker@example.com",
      "password123",
      "fullnamethree",
      "city",
    );
    attackerToken = (
      await (
        await request.post("http://localhost:5000/api/auth/login", {
          data: { email: "attacker@example.com", password: "password123" },
        })
      ).json()
    ).jwtToken;

    // 3. Seed Property owned by Seller
    propertyId = await seedTestProperty({
      user_id: sellerId,
      title: "Dream Home",
      price: 600000,
    });

    // 4. Pre-seed one offer to test the Accept/Reject logic
    const offerResponse = await request.post(
      "http://localhost:5000/api/offer",
      {
        headers: { Authorization: `Bearer ${buyerToken}` },
        data: { amount: 550000, propertyId: propertyId },
      },
    );
    const offerData = await offerResponse.json();
    seededOfferId = offerData.id;
  });

  test("TC-FUNC-OFF-004: Buyer can successfully submit a new offer", async ({
    request,
  }) => {
    const response = await request.post("http://localhost:5000/api/offer", {
      headers: { Authorization: `Bearer ${buyerToken}` },
      data: { amount: 580000, propertyId: propertyId },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();

    expect(body.amount).toBe("580000.00"); // Or number, depending on pg driver parsing
    expect(body.property_id).toBe(propertyId);
    expect(body.status).toBe("PENDING"); // Assuming your DB defaults to PENDING
  });

  test("TC-FUNC-OFF-005: Server blocks unauthenticated users from making offers", async ({
    request,
  }) => {
    const response = await request.post("http://localhost:5000/api/offer", {
      data: { amount: 500000, propertyId: propertyId },
    });

    expect(response.status()).toBe(401);
  });

  test("TC-FUNC-OFF-006: Rightful Seller can Accept an offer", async ({
    request,
  }) => {
    const response = await request.patch(
      `http://localhost:5000/api/offer/${seededOfferId}/status`,
      {
        headers: { Authorization: `Bearer ${sellerToken}` },
        data: { status: "ACCEPTED" },
      },
    );

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("ACCEPTED");
  });

  test("TC-FUNC-OFF-006: Rightful Seller can Reject an offer", async ({
    request,
  }) => {
    const response = await request.patch(
      `http://localhost:5000/api/offer/${seededOfferId}/status`,
      {
        headers: { Authorization: `Bearer ${sellerToken}` },
        data: { status: "REJECTED" },
      },
    );

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe("REJECTED");
  });

  test("TC-FUNC-OFF-007: Server blocks non-owners from responding to an offer (403 Forbidden)", async ({
    request,
  }) => {
    // The attacker tries to accept the offer made on the Seller's house
    const response = await request.patch(
      `http://localhost:5000/api/offer/${seededOfferId}/status`,
      {
        headers: { Authorization: `Bearer ${attackerToken}` },
        data: { status: "ACCEPTED" },
      },
    );

    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.message).toBe("Unauthorized to respond to this offer");
  });
});

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

  test("TC-FUNC-OFF-008: Server rejects offers with invalid amounts", async ({
    request,
  }) => {
    const invalidAmounts = [-5000, 0, "abc"];

    for (const invalidAmount of invalidAmounts) {
      const response = await request.post("http://localhost:5000/api/offer", {
        headers: { Authorization: `Bearer ${buyerToken}` },
        data: {
          amount: invalidAmount,
          propertyId: propertyId,
        },
      });

      expect(response.status()).toBe(400);

      const body = await response.json();

      // Adjust depending on your backend response structure
      expect(body.message.toLowerCase()).toContain("amount");
    }

    // Verify invalid offers were NOT inserted into DB
    const offersResponse = await request.get(
      `http://localhost:5000/api/offer/property/${propertyId}`,
      {
        headers: { Authorization: `Bearer ${sellerToken}` },
      },
    );

    expect(offersResponse.status()).toBe(200);

    const offers = await offersResponse.json();

    // Only the seeded offer from beforeEach should exist
    expect(offers.length).toBe(1);

    expect(offers[0].amount).toBe("550000.00");
  });

  test("TC-FUNC-OFF-009: Server rejects offers for non-existent properties", async ({
    request,
  }) => {
    const nonExistentPropertyId = 99999999;

    const response = await request.post("http://localhost:5000/api/offer", {
      headers: { Authorization: `Bearer ${buyerToken}` },
      data: {
        amount: 500000,
        propertyId: nonExistentPropertyId,
      },
    });

    // Depending on implementation this may be 400 or 404
    expect([400, 404]).toContain(response.status());

    const body = await response.json();

    // Optional assertion depending on your API
    expect(body.message.toLowerCase()).toMatch(/property|not found|invalid/);

    // Verify no new offer was inserted
    const offersResponse = await request.get(
      `http://localhost:5000/api/offer/property/${propertyId}`,
      {
        headers: { Authorization: `Bearer ${sellerToken}` },
      },
    );

    const offers = await offersResponse.json();

    // Still only the seeded offer
    expect(offers.length).toBe(1);

    expect(offers[0].id).toBe(seededOfferId);
  });

  test("TC-FUNC-OFF-010: Property owner cannot place offer on their own property", async ({
    request,
  }) => {
    const response = await request.post("http://localhost:5000/api/offer", {
      headers: { Authorization: `Bearer ${sellerToken}` },
      data: {
        amount: 590000,
        propertyId: propertyId,
      },
    });

    // Depending on implementation this may be 400 or 403
    expect([400, 403]).toContain(response.status());

    const body = await response.json();

    // Optional message assertion
    expect(body.message.toLowerCase()).toMatch(
      /own property|cannot place|unauthorized/,
    );

    // Verify no extra offer was inserted
    const offersResponse = await request.get(
      `http://localhost:5000/api/offer/property/${propertyId}`,
      {
        headers: { Authorization: `Bearer ${sellerToken}` },
      },
    );

    const offers = await offersResponse.json();

    // Only the seeded buyer offer should exist
    expect(offers.length).toBe(1);

    expect(offers[0].buyer_name).toBe("fullnametwo");
  });

  test("TC-FUNC-OFF-011: Buyer cannot submit multiple pending offers on same property", async ({
    request,
  }) => {
    // beforeEach already seeded one PENDING offer from buyer

    const secondOfferResponse = await request.post(
      "http://localhost:5000/api/offer",
      {
        headers: { Authorization: `Bearer ${buyerToken}` },
        data: {
          amount: 570000,
          propertyId: propertyId,
        },
      },
    );

    // Depending on implementation this may be 400 or 409
    expect([400, 409]).toContain(secondOfferResponse.status());

    const body = await secondOfferResponse.json();

    // Optional message assertion
    expect(body.message.toLowerCase()).toMatch(
      /already have|active offer|pending offer/,
    );

    // Verify duplicate offer was NOT inserted
    const offersResponse = await request.get(
      `http://localhost:5000/api/offer/property/${propertyId}`,
      {
        headers: { Authorization: `Bearer ${sellerToken}` },
      },
    );

    const offers = await offersResponse.json();

    // Still only the original seeded offer
    expect(offers.length).toBe(1);

    expect(offers[0].amount).toBe("550000.00");
  });

  test("TC-FUNC-OFF-012: Fetching offers for property with zero offers returns empty array", async ({
    request,
  }) => {
    // Make a second property with NO offers
    const emptyPropertyId = await seedTestProperty({
      user_id: sellerId,
      title: "Empty Property",
      price: 450000,
    });

    const response = await request.get(
      `http://localhost:5000/api/offer/property/${emptyPropertyId}`,
      {
        headers: { Authorization: `Bearer ${sellerToken}` },
      },
    );

    expect(response.status()).toBe(200);

    const body = await response.json();

    // Should return clean empty state
    expect(Array.isArray(body)).toBe(true);

    expect(body.length).toBe(0);

    expect(body).toEqual([]);
  });

  test("TC-FUNC-OFF-013: Cannot modify finalized offer status", async ({
    request,
  }) => {
    // First ACCEPT the offer
    const acceptResponse = await request.patch(
      `http://localhost:5000/api/offer/${seededOfferId}/status`,
      {
        headers: { Authorization: `Bearer ${sellerToken}` },
        data: {
          status: "ACCEPTED",
        },
      },
    );

    expect(acceptResponse.status()).toBe(200);

    // Attempt to change finalized status
    const secondResponse = await request.patch(
      `http://localhost:5000/api/offer/${seededOfferId}/status`,
      {
        headers: { Authorization: `Bearer ${sellerToken}` },
        data: {
          status: "REJECTED",
        },
      },
    );

    expect(secondResponse.status()).toBe(400);

    const body = await secondResponse.json();

    // Optional message assertion
    expect(body.message.toLowerCase()).toMatch(
      /finalized|already|cannot modify/,
    );

    // Verify status remained ACCEPTED
    const offersResponse = await request.get(
      `http://localhost:5000/api/offer/property/${propertyId}`,
      {
        headers: { Authorization: `Bearer ${sellerToken}` },
      },
    );

    const offers = await offersResponse.json();

    expect(offers[0].status).toBe("ACCEPTED");
  });
});

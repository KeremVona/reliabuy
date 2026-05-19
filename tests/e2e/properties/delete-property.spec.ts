import { test, expect } from "@playwright/test";
import {
  clearDatabase,
  seedTestUser,
  seedTestProperty,
} from "../../../test-utils/db";
import { pool } from "../../../test-utils/dbCon";

test.describe.configure({ mode: "serial" });

test.describe("Property Deletion & Security", () => {
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

    // Authenticate the owner
    const ownerLogin = await request.post(
      "http://localhost:5000/api/auth/login",
      {
        data: { email: "owner@example.com", password: "password123" },
      },
    );
    const ownerJson = await ownerLogin.json();
    ownerToken = ownerJson.jwtToken;

    // 3. Seed an "attacker"
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
      title: "To Be Deleted",
      description: "Will be removed soon",
      price: 150000,
      address: "404 Deletion St",
    });
  });

  test("TC-FUNC-DEL-001: Owner can successfully delete their own property", async ({
    request,
  }) => {
    // Execute the deletion
    const deleteResponse = await request.delete(
      `http://localhost:5000/api/property/${propertyId}`,
      {
        headers: { Authorization: `Bearer ${ownerToken}` },
      },
    );

    // Verify successful response
    expect(deleteResponse.status()).toBe(200);
    const deleteBody = await deleteResponse.json();
    expect(deleteBody.message).toBe("Property deleted successfully");

    // Verify it is actually gone from the database
    const verifyResponse = await request.get(
      `http://localhost:5000/api/property/${propertyId}`,
    );
    expect(verifyResponse.status()).toBe(400);
  });

  test("TC-FUNC-DEL-002: Server rejects deletion if user does not own the property (403 Forbidden)", async ({
    request,
  }) => {
    // The "attacker" tries to delete the owner's property
    const deleteResponse = await request.delete(
      `http://localhost:5000/api/property/${propertyId}`,
      {
        headers: { Authorization: `Bearer ${attackerToken}` },
      },
    );

    // Verify it was blocked
    expect(deleteResponse.status()).toBe(403);
    const apiBody = await deleteResponse.json();
    expect(apiBody.message).toBe(
      "Unauthorized: You can only delete your own properties.",
    );

    // Verify the property still exists in the database
    const verifyResponse = await request.get(
      `http://localhost:5000/api/property/:${propertyId}`,
    );
    expect(verifyResponse.status()).toBe(200);
  });

  test("TC-FUNC-DEL-003: Server returns 404 when deleting a non-existent property", async ({
    request,
  }) => {
    const deleteResponse = await request.delete(
      "http://localhost:5000/api/property/99999",
      {
        headers: { Authorization: `Bearer ${ownerToken}` },
      },
    );

    expect(deleteResponse.status()).toBe(404);
  });

  test("TC-FUNC-DEL-004: Server rejects invalid ID string formats (400 Bad Request)", async ({
    request,
  }) => {
    const deleteResponse = await request.delete(
      "http://localhost:5000/api/property/invalid-id-format",
      {
        headers: { Authorization: `Bearer ${ownerToken}` },
      },
    );

    expect(deleteResponse.status()).toBe(400);
    const apiBody = await deleteResponse.json();
    expect(apiBody.message).toBe("Invalid property ID format");
  });

  test("TC-FUNC-DEL-005: Server blocks unauthenticated users from deleting (401 Unauthorized)", async ({
    request,
  }) => {
    // Notice: We do NOT include the Authorization header here
    const apiResponse = await request.delete(
      `http://localhost:5000/api/property/${propertyId}`,
    );

    expect(apiResponse.status()).toBe(401);

    // Verify the database was untouched
    const propCheck = await pool.query(
      "SELECT * FROM properties WHERE id = $1",
      [propertyId],
    );
    expect(propCheck.rows.length).toBe(1);
  });
});

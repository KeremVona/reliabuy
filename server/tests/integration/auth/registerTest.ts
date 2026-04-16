import request from "supertest";
import { describe, it, expect } from "vitest";
import { app } from "../../../src/index";

describe("POST /api/auth/register", () => {
  const validUser = {
    fullname: "Test User",
    email: "test@example.com",
    password: "securepassword123",
    city: "Istanbul",
    isBuyer: true,
  };

  it("should successfully register a new user and return a JWT token", async () => {
    // 1. Arrange & Act: Send the POST request
    const response = await request(app)
      .post("/api/auth/register")
      .send(validUser);

    // 2. Assert: Check the results
    // Note: Checking for 200 based on your current controller logic.
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("jwtToken");
    expect(typeof response.body.jwtToken).toBe("string");
  });

  it("should return 409 if the email already exists", async () => {
    // 1. Arrange: Create the user once
    await request(app).post("/api/auth/register").send(validUser);

    // 2. Act: Try to create the EXACT same user again
    const response = await request(app)
      .post("/api/auth/register")
      .send(validUser);

    // 3. Assert: Should hit your 23505 pg error code logic
    expect(response.status).toBe(409);
    expect(response.text).toBe("User already exists");
  });

  it("should return 500 if password is missing (current logic)", async () => {
    // 1. Arrange: User missing a password
    const invalidUser = {
      fullname: "Incomplete User",
      email: "incomplete@example.com",
      city: "Istanbul",
      isBuyer: false,
      // password is omitted
    };

    // 2. Act
    const response = await request(app)
      .post("/api/auth/register")
      .send(invalidUser);

    // 3. Assert: The service throws an Error, caught by controller's generic catch
    expect(response.status).toBe(500);
    expect(response.text).toBe("Server error");
  });
});

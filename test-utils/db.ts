import bcrypt from "bcrypt";
import { pool } from "./dbCon";

// 1. Wipes all tables cleanly using CASCADE
export const clearDatabase = async () => {
  const client = await pool.connect();
  try {
    // This order is important: TRUNCATE everything at once
    await client.query(`
      TRUNCATE TABLE users, properties, property_images, favorites, offers 
      RESTART IDENTITY CASCADE;
    `);
  } catch (err) {
    console.error("Failed to clear database:", err);
    throw err;
  } finally {
    client.release();
  }
};

// 2. Seeds a test user and returns their ID
export const seedTestUser = async (
  email: string,
  password: string,
  fullname: string = "Test User",
  city: string,
) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const query = `
   INSERT INTO users (fullname, email, password, city)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (email) DO UPDATE 
    SET fullname = EXCLUDED.fullname, password = EXCLUDED.password
    RETURNING *
  `;
  const result = await pool.query(query, [
    fullname,
    email,
    hashedPassword,
    city,
  ]);
  return result.rows[0];
};

// 3. Seeds a test property and returns its ID
export const seedTestProperty = async (data: any) => {
  // Default values fallback
  const user_id = data.user_id || 1; // Assuming user 1 exists if not provided
  const title = data.title || "Test Property";
  const description = data.description || "Test Description";
  const price = data.price || 100000;
  const address = data.address || "123 Test St";

  const query = `
    INSERT INTO properties (user_id, title, description, price, address)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id;
  `;
  const result = await pool.query(query, [
    user_id,
    title,
    description,
    price,
    address,
  ]);
  // console.log("--result.rows[0].id", result.rows[0].id);
  return result.rows[0].id;
};

// 4. Seeds a test offer
export const seedTestOffer = async (
  buyer_id: number,
  property_id: number,
  amount: number = 500000,
  status: string = "PENDING",
) => {
  const query = `
    INSERT INTO offers (buyer_id, property_id, amount, status)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const result = await pool.query(query, [
    buyer_id,
    property_id,
    amount,
    status,
  ]);
  return result.rows[0];
};

// 5. Seeds a favorite property link
export const seedTestFavorite = async (
  user_id: number,
  property_id: number,
) => {
  const query = `
    INSERT INTO favorites (user_id, property_id)
    VALUES ($1, $2)
    RETURNING *;
  `;
  const result = await pool.query(query, [user_id, property_id]);
  return result.rows[0];
};

// 6. Seeds a property image
export const seedTestPropertyImage = async (
  property_id: number,
  url: string = "/uploads/default-test-image.jpg",
) => {
  const query = `
    INSERT INTO property_images (property_id, url)
    VALUES ($1, $2)
    RETURNING *;
  `;
  const result = await pool.query(query, [property_id, url]);
  return result.rows[0];
};

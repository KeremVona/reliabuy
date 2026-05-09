import { pool } from "../../db/db";
import { Property } from "../../interfaces/IProperty";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";

const genAI = new GoogleGenerativeAI(process.env.API_KEY || "");

// Make: Make a new property
export async function makeProperty(
  propertyData: Property,
): Promise<Property | null> {
  const { user_id, title, description, price, address, images } = propertyData;
  // console.log("user_id make service: ", user_id);

  // 1. Insert the property
  const propertyQuery = `
    INSERT INTO properties (user_id, title, description, price, address)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const propertyResult = await pool.query(propertyQuery, [
    user_id,
    title,
    description,
    price,
    address,
  ]);
  const newProperty = propertyResult.rows[0];

  // 2. If there are images, insert them into property_images
  if (images && images.length > 0 && newProperty) {
    const imageValues = images.map((_, i) => `($1, $${i + 2})`).join(",");
    const imageQuery = `INSERT INTO property_images (property_id, url) VALUES ${imageValues}`;
    await pool.query(imageQuery, [newProperty.id, ...images]);
    newProperty.images = images;
  }

  return newProperty;
}

// READ: Get a single property by ID
export async function getPropertyById(id: number): Promise<Property | null> {
  console.log("DEBUG: Received ID in Service:", id);

  if (Number.isNaN(id)) {
    console.error("CRITICAL: id is NaN in service!");
    throw new Error("Property ID is Not a Number");
  }
  const query = `
    SELECT p.*, 
           COALESCE(json_agg(pi.url) FILTER (WHERE pi.url IS NOT NULL), '[]') as images
    FROM properties p
    LEFT JOIN property_images pi ON p.id = pi.property_id
    WHERE p.id = $1
    GROUP BY p.id;
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

// READ ALL: Get all properties
export async function getAllProperties(): Promise<Property[]> {
  const query = `
    SELECT 
      p.id AS property_id,
      p.title,
      p.description,
      p.price,
      p.address,
      u.id AS publisher_id,
      u.fullname AS publisher_name,
      u.email AS publisher_email,
      (
        SELECT url 
        FROM property_images pi 
        WHERE pi.property_id = p.id 
        ORDER BY pi.id ASC 
        LIMIT 1
      ) AS image_url
    FROM properties p
    JOIN users u ON p.user_id = u.id
    ORDER BY p.id DESC;
  `;
  const result = await pool.query(query);

  return result.rows;
}

// UPDATE: Update an existing property
export async function updateProperty(
  id: number,
  propertyData: Property,
): Promise<Property | null> {
  const { title, description, price, address } = propertyData;
  const query = `
    UPDATE properties 
    SET title = $1, description = $2, price = $3, address = $4 
    WHERE id = $5 
    RETURNING *;
  `;
  const values = [title, description, price, address, id];

  const result = await pool.query(query, values);
  return result.rows[0] || null;
}

// DELETE: Remove a property
export async function deleteProperty(id: number): Promise<boolean> {
  const query = `DELETE FROM properties WHERE id = $1 RETURNING id;`;
  const result = await pool.query(query, [id]);

  // Returns true if a row was actually deleted, false otherwise
  return (result.rowCount ?? 0) > 0;
}

export const searchProperties = async (searchTerm: string) => {
  // We use ILIKE for case-insensitive matching (PostgreSQL)
  // We wrap the term in % % to find matches anywhere in the string
  const query = `
    SELECT * FROM properties 
    WHERE title ILIKE $1 
    OR address ILIKE $1
  `;

  const values = [`%${searchTerm}%`];
  //console.log("values: ", values);

  const result = await pool.query(query, values);
  //console.log("result: ", result);
  return result.rows;
};

export const getUserProperties = async (userId: number) => {
  // We use a parameterized query ($1) to safely pass the userId
  const query = `
    SELECT * FROM properties 
    WHERE user_id = $1
  `;

  const result = await pool.query(query, [userId]);
  return result.rows;
};

// Add to favorites
export const addFavorite = async (userId: number, propertyId: number) => {
  const query = `
    INSERT INTO favorites (user_id, property_id) 
    VALUES ($1, $2) 
    ON CONFLICT DO NOTHING
    RETURNING *;
  `;
  const result = await pool.query(query, [userId, propertyId]);
  return result.rows[0];
};

// Remove from favorites
export const removeFavorite = async (userId: number, propertyId: number) => {
  const query = `
    DELETE FROM favorites 
    WHERE user_id = $1 AND property_id = $2
  `;
  const result = await pool.query(query, [userId, propertyId]);
  return result.rowCount !== null && result.rowCount > 0;
};

// Get all properties saved by a specific user
export const getSavedProperties = async (userId: number) => {
  const query = `
    SELECT p.*, f.made_at as favorited_at
    FROM properties p
    INNER JOIN favorites f ON p.id = f.property_id
    WHERE f.user_id = $1
    ORDER BY f.made_at DESC
  `;
  const result = await pool.query(query, [userId]);

  console.log("----------------");
  console.log(result.rows);
  console.log("----------------");
  return result.rows;
};

export const generatePropertyDescription = async (
  files: Express.Multer.File[],
): Promise<string> => {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const imageParts = files.map((file) => {
    // 2. Safely get the base64 string whether Multer is using memory or disk storage
    const base64Data = file.buffer
      ? file.buffer.toString("base64")
      : fs.readFileSync(file.path).toString("base64");

    return {
      inlineData: {
        data: base64Data,
        mimeType: file.mimetype,
      },
    };
  });

  const prompt = `
    Analyze these images of a real estate property. 
    Write a professional, engaging, and concise property description (around 100-150 words).
    Highlight key features like flooring, lighting, kitchen style, or any unique architectural details visible.
    Do not mention the image quality, focus only on the property features.
  `;

  const result = await model.generateContent([prompt, ...imageParts]);
  const response = await result.response;

  // Optional: If you don't want to keep these temporary AI-scan images on your disk forever,
  // you can delete them after Gemini is done analyzing them:
  /*
  files.forEach(file => {
    if (file.path) fs.unlinkSync(file.path);
  });
  */

  return response.text();
};

// NOTE: Disabled for now

//export const findProperties = async (filters: PropertyFilters) => {
//  let query = "SELECT * FROM properties WHERE 1=1";
//  const values: any[] = [];
//  let placeholderIdx = 1;
//
//  // Partial search (ILIKE is Postgres-specific for case-insensitive)
//  if (filters.title) {
//    query += ` AND title ILIKE $${placeholderIdx++}`;
//    values.push(`%${filters.title}%`);
//  }
//
//  if (filters.city) {
//    query += ` AND city = $${placeholderIdx++}`;
//    values.push(filters.city);
//  }
//
//  if (filters.minPrice !== undefined) {
//    query += ` AND price >= $${placeholderIdx++}`;
//    values.push(filters.minPrice);
//  }
//
//  if (filters.maxPrice !== undefined) {
//    query += ` AND price <= $${placeholderIdx++}`;
//    values.push(filters.maxPrice);
//  }
//
//  const result = await pool.query(query, values);
//  return result.rows;
//};

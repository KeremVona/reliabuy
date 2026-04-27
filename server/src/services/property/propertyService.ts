import { pool } from "../../db/db";
import { Property, PropertyFilters } from "../../interfaces/IProperty";

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
  // console.log("DEBUG: Received ID in Service:", id);

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
      u.email AS publisher_email
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
    OR city ILIKE $1
  `;

  const values = [`%${searchTerm}%`];

  const result = await pool.query(query, values);
  return result.rows;
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

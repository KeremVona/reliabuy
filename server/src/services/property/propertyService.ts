import { pool } from "../../db/db";
import { Property } from "../../interfaces/IProperty";

// Make: Make a new property
export async function makeProperty(
  propertyData: Property,
): Promise<Property | null> {
  const { user_id, title, description, price, address } = propertyData;
  console.log("user_id make service: ", user_id);
  const query = `
    INSERT INTO properties (user_id, title, description, price, address)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const values = [user_id, title, description, price, address];

  const result = await pool.query(query, values);
  return result.rows[0] || null;
}

// READ: Get a single property by ID
export async function getPropertyById(id: number): Promise<Property | null> {
  console.log("DEBUG: Received ID in Service:", id);

  if (Number.isNaN(id)) {
    console.error("CRITICAL: id is NaN in service!");
    throw new Error("Property ID is Not a Number");
  }
  const query = `SELECT * FROM properties WHERE id = $1;`;
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

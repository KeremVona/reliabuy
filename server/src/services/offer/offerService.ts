import { MakeOfferDTO, Offer, OfferStatus } from "../../interfaces/IOffer";
import { pool } from "../../db/db";

/**
 * Makes a new offer record in the database
 */
export const makeOffer = async (data: MakeOfferDTO): Promise<Offer> => {
  const query = `
    INSERT INTO offers (amount, property_id, buyer_id)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const values = [data.amount, data.property_id, data.buyer_id];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

/**
 * Fetches all offers for a specific property, including the buyer's name
 */
export const getOffersByProperty = async (
  propertyId: number,
): Promise<Offer[]> => {
  const query = `
    SELECT 
      o.id, 
      o.amount, 
      o.status, 
      o.property_id, 
      o.buyer_id, 
      o.made_at,
      u.fullname as buyer_name 
    FROM offers o
    JOIN users u ON o.buyer_id = u.id
    WHERE o.property_id = $1
    ORDER BY o.created_at DESC;
  `;
  const { rows } = await pool.query(query, [propertyId]);
  return rows;
};

/**
 * Updates the status (PENDING, ACCEPTED, REJECTED) of an offer
 */
export const updateOfferStatus = async (
  offerId: number,
  status: OfferStatus,
): Promise<Offer> => {
  const query = `
    UPDATE offers 
    SET status = $1 
    WHERE id = $2 
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [status, offerId]);
  return rows[0];
};

/**
 * Retrieves the owner of the property associated with a specific offer.
 * Used for authorization checks in the controller.
 */
export const getOfferOwnership = async (
  offerId: number,
): Promise<{ owner_id: number } | null> => {
  const query = `
    SELECT p.user_id as owner_id 
    FROM offers o
    JOIN properties p ON o.property_id = p.id
    WHERE o.id = $1;
  `;
  const { rows } = await pool.query(query, [offerId]);
  return rows.length > 0 ? rows[0] : null;
};

export const getReceivedOffers = async (sellerId: number) => {
  console.log("sellerId: ", sellerId);

  const query = `
    SELECT 
      o.id AS offer_id,
      o.amount,
      o.status,
      o.made_at,
      p.id AS property_id,
      p.title AS property_title,
      p.price AS asking_price,
      u.fullname AS buyer_name,
      u.email AS buyer_email
    FROM offers o
    JOIN properties p ON o.property_id = p.id
    JOIN users u ON o.buyer_id = u.id
    WHERE p.user_id = $1
    ORDER BY o.made_at DESC;
  `;

  const { rows } = await pool.query(query, [sellerId]);
  console.log("rows: ", rows);

  return rows;
};

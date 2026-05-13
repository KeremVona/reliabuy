import bcrypt from "bcrypt";
import { pool } from "../../db/db";
import { User } from "../../interfaces/IUser";

export type MakeUserDTO = Omit<User, "id">;

export type SafeUser = Omit<User, "password">;

// Database operations
export async function registerUser(
  userData: MakeUserDTO,
): Promise<SafeUser | null> {
  const { fullname, email, password, city, isBuyer } = userData;

  // Validation is now handled by Zod in the controller, but a DB-level sanity check is fine
  if (!password) {
    throw new Error("Password is required for registration.");
  }

  // Cost factor: 12 is the modern recommended minimum
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const query = `
    INSERT INTO users (fullname, email, password, city, "isBuyer")
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, fullname, email, city, "isBuyer";
  `;

  const values = [fullname, email, hashedPassword, city, isBuyer];

  try {
    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error: unknown) {
    // We log the raw database error here for debugging purposes
    console.error("Database error in registerUser:", error);

    // Throw the RAW error so the controller can read error.code === '23505'
    throw error;
  }
}

export async function loginUser(
  email: string,
  passwordAttempt: string,
): Promise<SafeUser | null> {
  const query = `
    SELECT id, fullname, email, password, city, "isBuyer"
    FROM users
    WHERE email = $1;
  `;

  try {
    const result = await pool.query(query, [email]);
    const user = result.rows[0];

    // 1. If no user is found with that email
    if (!user) {
      return null;
    }

    console.log(passwordAttempt);

    // 2. Compare the provided password with the stored hash
    const isPasswordValid = await bcrypt.compare(
      passwordAttempt,
      user.password,
    );

    if (!isPasswordValid) {
      return null;
    }

    // 3. SAFELY remove the password using destructuring
    // This avoids the V8 performance hit of 'delete' and keeps TypeScript happy
    const { password, ...safeUser } = user;

    return safeUser;
  } catch (error: unknown) {
    // Keep internal server/database errors out of the frontend response
    console.error("Database error in loginUser:", error);
    throw error;
  }
}

export async function getUserById(id: string | number): Promise<User | null> {
  const query = `
    SELECT id, fullname, email, city, "isBuyer"
    FROM users
    WHERE id = $1;
  `;

  try {
    const result = await pool.query(query, [id]);

    // Return the user object, or null if no user was found
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    throw error;
  }
}

export async function updateUser(
  id: string | number,
  updateData: Partial<User>,
): Promise<User | null> {
  // Extract keys to determine which columns are being updated
  const keys = Object.keys(updateData);

  // If no fields to update were provided, return early
  if (keys.length === 0) {
    return null;
  }

  // Build the SET clause (e.g., '"fullname" = $2, "city" = $3')
  // We wrap keys in double quotes to handle case-sensitive columns like "isBuyer"
  const setClauses = keys.map((key, index) => `"${key}" = $${index + 2}`);

  // Extract the corresponding values
  const values = keys.map((key) => updateData[key as keyof User]);

  const query = `
    UPDATE users
    SET ${setClauses.join(", ")}
    WHERE id = $1
    RETURNING id, fullname, email, city, "isBuyer";
  `;

  try {
    // Pass the ID as $1, followed by the rest of the dynamic values
    const result = await pool.query(query, [id, ...values]);

    return result.rows[0] || null;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}

export async function deleteUser(
  id: string | number,
): Promise<{ id: number } | null> {
  const query = `
    DELETE FROM users
    WHERE id = $1
    RETURNING id;
  `;

  try {
    const result = await pool.query(query, [id]);

    // Returns the deleted user's ID if successful, or null if not found
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
}

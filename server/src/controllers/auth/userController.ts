import { type Request, type Response } from "express";
import { z } from "zod";
import {
  deleteUser,
  getUserById,
  loginUser,
  registerUser,
  updateUser,
} from "../../services/auth/userService";
import jwtGenerator from "../../utils/jwtGenerator";

interface GetIdRequestBody {
  id: string;
}

interface UserIdParams {
  userId: string;
}

export const registerSchema = z.object({
  fullname: z
    .string()
    .trim() // Removes leading/trailing accidental spaces
    .min(2, "Full name must be at least 2 characters")
    .max(50, "Full name cannot exceed 50 characters"), // Protects DB limits

  email: z
    .string()
    .trim()
    .toLowerCase() // Normalizes email for consistent DB lookups
    .email("Invalid email address"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long") // Critical: Prevents bcrypt DoS attacks
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),

  city: z
    .string()
    .trim()
    .min(2, "City name is too short")
    .max(50, "City name is too long"),

  isBuyer: z.boolean().default(false), // Provides a safe fallback
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const registerHandler = async (
  req: Request<{}, {}, z.infer<typeof registerSchema>>,
  res: Response,
): Promise<Response | void> => {
  try {
    // Validate incoming request body
    const validatedData = registerSchema.parse(req.body);

    const newUser = await registerUser(validatedData);
    // console.log(newUser);

    if (!newUser) {
      // console.log("fail ", newUser);
      return res
        .status(400)
        .json({ error: "Registration failed. Please try again." });
    }
    // console.log("before");
    const jwtToken = jwtGenerator(String(newUser.id), newUser.fullname);
    // console.log("succesful registration ", jwtToken);

    // Standardized success response
    return res.status(201).json({
      message: "User registered successfully",
      jwtToken,
    });
  } catch (err: unknown) {
    // 1. Handle Zod validation errors cleanly (Expected user errors)
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        // Changed 'details' to 'errors' to match your frontend logic!
        errors: err.issues.map((e: z.ZodIssue) => e.message),
      });
    }

    // Now we log actual server/database errors, ignoring normal validation typos
    console.error("Server error - registerHandler:", err);

    // 2. Safely check for Postgres unique constraint violation
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      err.code === "23505"
    ) {
      return res
        .status(409)
        .json({ error: "A user with this email already exists." });
    }

    // 3. Fallback for unexpected errors
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const loginHandler = async (
  req: Request<{}, {}, z.infer<typeof loginSchema>>,
  res: Response,
): Promise<Response | void> => {
  try {
    // Validate incoming request body
    const { email, password } = loginSchema.parse(req.body);

    // console.log(password);
    // console.log(email);

    const user = await loginUser(email, password);
    // console.log("user ", user);

    if (!user) {
      // Consistent JSON error response
      return res.status(401).json({ error: "Invalid email or password" });
    }
    // console.log("SECRET:", process.env.Secret);
    const jwtToken = jwtGenerator(String(user.id), user.fullname);

    if (!jwtToken) {
      return res.status(500).json({
        error: "Failed to generate token",
      });
    }

    // Consistent success response
    // console.log("-------- Succesful login --------", email, password);
    return res.status(200).json({ jwtToken });
  } catch (err: unknown) {
    // Handle Zod validation errors cleanly
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        // 2. Change 'details' to 'errors' to stay consistent with the Register route
        errors: err.issues.map((e: z.ZodIssue) => e.message),
      });
    }

    // 3. Move the console.error down so it only logs actual crashes, not user typos
    console.error("Server error - loginHandler:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const verifyHandler = async (res: Response) => {
  try {
    return res.json(true);
  } catch (err) {
    console.error("Server error - verifyHandler");
    if (err instanceof Error) {
      return res.status(500).send("Server error");
    }
  }
};

export const getUserIdHandler = async (
  req: Request<{}, {}, GetIdRequestBody>,
  res: Response,
) => {
  try {
    const { id } = req.body;

    const user = await getUserById(id);

    if (!user) {
      return res.status(404).json("User not found");
    }

    // Ensure we don't accidentally send back the password hash
    delete user.password;
    return res.json(user);
  } catch (err) {
    console.error("Server error - getUserIdHandler:", err);
    return res.status(500).send("Server error");
  }
};

export const updateUserController = async (
  req: Request<UserIdParams>,
  res: Response,
) => {
  try {
    const userId = req.params.userId;
    const updateData = req.body;

    // Prevent overriding secure fields
    delete updateData.id;
    delete updateData.password;

    const updatedUser = await updateUser(userId, updateData);

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found." });
    }

    delete updatedUser.password;

    return res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return res
      .status(500)
      .json({ error: "An internal server error occurred." });
  }
};

export const deleteUserController = async (
  req: Request<UserIdParams>,
  res: Response,
) => {
  try {
    const userId = req.params.userId;

    const deletedUser = await deleteUser(userId);

    if (!deletedUser) {
      return res.status(404).json({ error: "User not found." });
    }

    return res.status(200).json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res
      .status(500)
      .json({ error: "An internal server error occurred." });
  }
};

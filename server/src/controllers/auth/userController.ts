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

const registerSchema = z.object({
  fullname: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  city: z.string().min(1, "City is required"),
  isBuyer: z.boolean(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
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

    if (!newUser) {
      return res
        .status(400)
        .json({ error: "Registration failed. Please try again." });
    }

    const jwtToken = jwtGenerator(String(newUser.id), newUser.fullname);

    // Standardized success response
    return res.status(201).json({
      message: "User registered successfully",
      jwtToken,
    });
  } catch (err: unknown) {
    console.error("Server error - registerHandler:", err);

    // Handle Zod validation errors cleanly
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        details: err.issues.map((e: z.ZodIssue) => e.message),
      });
    }

    // Safely check for Postgres unique constraint violation
    const dbError = err as { code?: string };
    if (dbError.code === "23505") {
      return res
        .status(409)
        .json({ error: "A user with this email already exists." });
    }

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

    const user = await loginUser(email, password);

    if (!user) {
      // Consistent JSON error response
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const jwtToken = jwtGenerator(String(user.id), user.fullname);

    // Consistent success response
    return res.status(200).json({ jwtToken });
  } catch (err: unknown) {
    console.error("Server error - loginHandler:", err);

    // Handle Zod validation errors cleanly
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        details: err.issues.map((e: z.ZodIssue) => e.message),
      });
    }

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

import { type Request, type Response } from "express";
import {
  registerUser,
  loginUser,
  deleteUser,
  getUserById,
  updateUser,
} from "../../services/auth/userService";
import jwtGenerator from "../../utils/jwtGenerator";

interface RegisterRequestBody {
  fullname: string;
  email: string;
  password: string;
  city: string;
  isBuyer: boolean;
}

interface LoginRequestBody {
  email: string;
  password: string;
}

interface GetIdRequestBody {
  id: string;
}

interface UserIdParams {
  userId: string;
}

export const registerHandler = async (
  req: Request<{}, {}, RegisterRequestBody>,
  res: Response,
) => {
  // Extract all fields matching our PostgreSQL User interface
  const { fullname, email, password, city, isBuyer } = req.body;
  console.log("register req", req.body);

  try {
    // The service handles password hashing and database insertion
    const newUser = await registerUser({
      fullname,
      email,
      password,
      city,
      isBuyer,
    });

    if (!newUser) {
      return res.status(400).json("Registration failed");
    }

    // Pass the user ID (converted to string if your JWT utility expects it) and fullname
    const jwtToken = jwtGenerator(String(newUser.id), newUser.fullname);

    return res.json({ jwtToken });
  } catch (err: any) {
    console.error("Server error - registerHandler:", err);

    // 23505 is the PostgreSQL error code for unique constraint violation
    if (err.code === "23505") {
      return res.status(409).send("User already exists");
    }

    return res.status(500).send("Server error");
  }
};

export const loginHandler = async (
  req: Request<{}, {}, LoginRequestBody>,
  res: Response,
) => {
  const { email, password } = req.body;

  try {
    // The service handles fetching the user AND comparing the bcrypt password
    const user = await loginUser(email, password);

    if (!user) {
      // Return a generic error for both wrong email or wrong password for better security
      return res.status(401).json("Invalid email or password");
    }

    const jwtToken = jwtGenerator(String(user.id), user.fullname);

    return res.json({ jwtToken });
  } catch (err) {
    console.error("Server error - loginHandler:", err);
    return res.status(500).send("Server error");
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

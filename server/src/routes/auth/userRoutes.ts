import express from "express";
import { loginLimiter, registerLimiter } from "../../middleware/rateLimiters";
import {
  getUserIdHandler,
  loginHandler,
  registerHandler,
  verifyHandler,
} from "../../controllers/auth/userController";
import authorize from "../../middleware/authorization";
import validInfo from "../../middleware/validInfo";

const router = express.Router();

router.post("/register", validInfo, registerLimiter, registerHandler);
router.post("/login", validInfo, loginHandler);
router.post("/verify", authorize, verifyHandler);
router.post("/user-id", authorize, getUserIdHandler);

export default router;

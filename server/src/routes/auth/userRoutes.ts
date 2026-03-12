import express from "express";
import {
  registerHandler,
  loginHandler,
  verifyHandler,
  getUserIdHandler,
} from "../../controllers/auth/userController";
import validInfo from "../../middleware/validInfo";
import authorize from "../../middleware/authorization";

const router = express.Router();

router.post("/register", validInfo, registerHandler);
router.post("/login", validInfo, loginHandler);
router.post("/verify", authorize, verifyHandler);
router.post("/user-id", authorize, getUserIdHandler);

export default router;

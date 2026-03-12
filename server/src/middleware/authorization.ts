import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
import { type Request, type Response, type NextFunction } from "express";

dotenv.config({ path: "../../.env", quiet: true });

export default function (req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  const token = authHeader?.split(" ")[1];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send("Unauthorized: No token provided");
  }

  if (!token) {
    return res.status(403).json({ msg: "authorization denied" });
  }

  try {
    const secret = process.env.Secret;

    if (!secret) {
      throw new Error("Secret not in .env");
    }
    const verify = jwt.verify(token, secret) as Express.UserPayload;

    req.user = verify.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: "Token is not valid" });
  }
}

import rateLimit from "express-rate-limit";

export const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 10, // Block after 10 failed attempts
  message: "Too many login attempts, please try again in an hour",
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 10, // Block after 10 failed attempts
  message: "Too many register attempts, please try again in an hour",
});

export const generateApiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 5, // Block after 5 failed attempts
  message: "Too many register attempts, please try again in an hour",
});

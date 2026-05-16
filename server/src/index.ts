import cors from "cors";
import express, { type Express } from "express";
import path from "path";
import userRoutes from "./routes/auth/userRoutes";
import offerRoutes from "./routes/offer/offerRoutes";
import propertyRoutes from "./routes/property/propertyRoutes";
import rateLimit from "express-rate-limit";

export const app: Express = express();

// Serve the 'uploads' folder as a static directory
// This allows you to view images at http://localhost:5000/uploads/filename.jpg
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Define the rate limit rule
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: "Too many requests from this IP, please try again after 15 minutes",
});

// Apply the rate limiting middleware to all requests
app.use(limiter);

const port = 5000;

app.use(express.json());

app.use(cors());

app.use("/api/auth", userRoutes);
app.use("/api/property", propertyRoutes);
app.use("/api/offer", offerRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

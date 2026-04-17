import express, { type Express } from "express";
import cors from "cors";
import userRoutes from "./routes/auth/userRoutes";
import propertyRoutes from "./routes/property/propertyRoutes";
import offerRoutes from "./routes/offer/offerRoutes";
import path from "path";
import multer from "multer";

export const app: Express = express();

// Serve the 'uploads' folder as a static directory
// This allows you to view images at http://localhost:5000/uploads/filename.jpg
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

const port = 5000;

app.use(express.json());

app.use(cors());

app.use("/api/auth", userRoutes);
app.use("/api/property", propertyRoutes);
app.use("/api/offer", offerRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

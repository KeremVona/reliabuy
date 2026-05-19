import { Router } from "express";
import * as propertyController from "../../controllers/property/propertyController";
import authorize from "../../middleware/authorization";
import { upload } from "../../middleware/upload";

const router = Router();

router.post(
  "/generate-description",
  authorize,
  upload.array("images", 10),
  propertyController.getAIDescription,
);
router.get("/search", propertyController.handleSearch);
router.get("/my-listings", authorize, propertyController.getMyProperties);
router.get("/saved", authorize, propertyController.getMySavedProperties);
router.post(
  "/",
  authorize,
  upload.array("images", 10),
  propertyController.makeProperty,
);
router.get("/", propertyController.getAllProperties);
router.get("/:id", propertyController.getProperty);
router.put("/:id", authorize, propertyController.updateProperty);
router.delete("/:id", authorize, propertyController.deleteProperty);

router.post("/:id/favorite", authorize, propertyController.saveProperty);
router.delete("/:id/favorite", authorize, propertyController.unsaveProperty);

export default router;

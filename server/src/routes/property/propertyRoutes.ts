import { Router } from "express";
import * as propertyController from "../../controllers/property/propertyController";
import authorize from "../../middleware/authorization";
import { upload } from "../../middleware/upload";

const router = Router();

router.get("/search", authorize, propertyController.handleSearch);
router.get("/my-listings", authorize, propertyController.getMyProperties);
router.get("/saved", authorize, propertyController.getMySavedProperties);
router.post(
  "/",
  authorize,
  upload.array("images", 10),
  propertyController.makeProperty,
);
router.get("/", authorize, propertyController.getAllProperties);
router.get("/:id", authorize, propertyController.getProperty);
router.put("/:id", authorize, propertyController.updateProperty);
router.delete("/:id", authorize, propertyController.deleteProperty);

export default router;

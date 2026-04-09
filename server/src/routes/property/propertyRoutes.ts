import { Router } from "express";
import * as propertyController from "../../controllers/property/propertyController";

const router = Router();

router.post("/", propertyController.makeProperty);
router.get("/", propertyController.getAllProperties);
router.get("/:id", propertyController.getProperty);
router.put("/:id", propertyController.updateProperty);
router.delete("/:id", propertyController.deleteProperty);

export default router;

import { Router } from "express";
import * as propertyController from "../../controllers/property/propertyController";
import authorize from "../../middleware/authorization";

const router = Router();

router.post("/", authorize, propertyController.makeProperty);
router.get("/", authorize, propertyController.getAllProperties);
router.get("/:id", authorize, propertyController.getProperty);
router.put("/:id", authorize, propertyController.updateProperty);
router.delete("/:id", authorize, propertyController.deleteProperty);

export default router;

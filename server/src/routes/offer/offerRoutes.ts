import express from "express";
import {
  makeOfferHandler,
  getPropertyOffers,
  respondToOffer,
} from "../../controllers/offer/offerController";
import authorize from "../../middleware/authorization";

const router = express.Router();

router.post("/:id", authorize, makeOfferHandler);
router.get("/:id", authorize, getPropertyOffers);
router.post("/:id", authorize, respondToOffer);

export default router;

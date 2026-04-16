import express from "express";
import {
  makeOfferHandler,
  getPropertyOffers,
  respondToOffer,
  getReceivedOffersHandler,
} from "../../controllers/offer/offerController";
import authorize from "../../middleware/authorization";

const router = express.Router();

router.get("/received", authorize, getReceivedOffersHandler);

router.post("/", authorize, makeOfferHandler);

// Matches: GET /api/offer/property/1
router.get("/property/:propertyId", authorize, getPropertyOffers);

// 3. Respond to an offer (Accept/Reject)
// Matches: PATCH /api/offer/1/status
router.patch("/:offerId/status", authorize, respondToOffer);

export default router;

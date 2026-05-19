import { Request, Response } from "express";
import { MakeOfferDTO } from "../../interfaces/IOffer";
import {
  getOfferByBuyerAndProperty,
  getOfferOwnership,
  getOffersByProperty,
  getReceivedOffers,
  makeOffer,
  updateOfferStatus,
} from "../../services/offer/offerService";
import { getPropertyById } from "../../services/property/propertyService";

export const makeOfferHandler = async (
  req: Request<{}, {}, MakeOfferDTO>,
  res: Response,
) => {
  try {
    const { amount, propertyId } = req.body;
    const buyerId = req.user!.id;
    const parsedBuyerId = parseInt(buyerId as string, 10);

    // --- 1. BASIC VALIDATION ---
    // Checking typeof ensures we don't apply regex to numbers or objects
    if (typeof amount !== "number" || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount. Must be a positive number.",
      });
    }

    if (typeof propertyId !== "number" || propertyId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid propertyId.",
      });
    }

    // --- 2. TC-FUNC-OFF-009: Server rejects offers for non-existent properties ---
    const property = await getPropertyById(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found.",
      });
    }

    // --- 3. TC-FUNC-OFF-010: Property owner cannot place offer on their own property ---
    // Note: Schema uses user_id for the property owner
    if (property.user_id === parsedBuyerId) {
      return res.status(403).json({
        success: false,
        message: "You cannot place an offer on your own property.",
      });
    }

    // --- 4. TC-FUNC-OFF-011 & TC-FUNC-OFF-013: Offer collision and status checks ---
    const existingOffer = await getOfferByBuyerAndProperty(
      parsedBuyerId,
      propertyId,
    );

    if (existingOffer) {
      // Prevent multiple pending offers
      if (existingOffer.status === "PENDING") {
        return res.status(409).json({
          success: false,
          message: "You already have a pending offer on this property.",
        });
      }

      // Prevent new offers if the buyer already had an offer accepted
      if (existingOffer.status === "ACCEPTED") {
        return res.status(403).json({
          success: false,
          message:
            "Cannot place a new offer. You already have an accepted offer for this property.",
        });
      }
    }

    // --- 5. SUCCESS: MAKE OFFER ---
    const newOffer = await makeOffer({
      amount,
      propertyId,
      buyer_id: parsedBuyerId,
    });

    res.status(201).json(newOffer);
  } catch (error: any) {
    console.error("Error making offer:", error);
    res.status(500).json({
      message: "Error making offer",
      error: error.message || error,
    });
  }
};

export const getPropertyOffers = async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;
    console.log("id", propertyId);

    if (isNaN(Number(propertyId))) {
      return res.status(400).json({
        message: "Invalid property ID",
      });
    }

    const offers = await getOffersByProperty(Number(propertyId));

    // console.log(offers);
    res.json(offers);
  } catch (error: any) {
    console.error("Error fetching offers ", error.message);
    res.status(500).json({ message: "Error fetching offers" });
  }
};

export const respondToOffer = async (req: Request, res: Response) => {
  try {
    const { offerId } = req.params;
    const { status } = req.body; // 'ACCEPTED' or 'REJECTED'
    const sellerId = req.user!.id;
    const parsedSellerId = parseInt(sellerId as string, 10);

    // Validate status against your offer_status ENUM
    if (!["ACCEPTED", "REJECTED"].includes(status)) {
      return res
        .status(400)
        .json({ message: "Invalid status. Must be ACCEPTED or REJECTED." });
    }

    // 1. Fetch the property's owner ID
    const ownership = await getOfferOwnership(Number(offerId));

    if (!ownership || ownership.owner_id !== parsedSellerId) {
      return res
        .status(403)
        .json({ message: "Unauthorized to respond to this offer" });
    }

    // Prevent changing an offer that is already finalized
    if (ownership.current_status !== "PENDING") {
      return res.status(400).json({
        message: "Bad Request: Cannot modify a finalized offer.",
      });
    }

    // 2. Update the offer
    const updatedOffer = await updateOfferStatus(Number(offerId), status);

    // Return 200 OK so the E2E test knows it succeeded
    res.status(200).json(updatedOffer);
  } catch (error: any) {
    console.error("Error responding to offer:", error);
    res
      .status(500)
      .json({ message: "Error updating offer status", error: error.message });
  }
};

export const getReceivedOffersHandler = async (req: Request, res: Response) => {
  try {
    const sellerId = req.user!.id;
    const parsedSellerId = parseInt(sellerId);

    const offers = await getReceivedOffers(parsedSellerId);

    console.log(offers);

    res.status(200).json({
      success: true,
      data: offers,
    });
  } catch (error) {
    console.error("Error fetching received offers:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

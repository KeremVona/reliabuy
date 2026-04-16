import { Request, Response } from "express";
import {
  getOfferOwnership,
  getOffersByProperty,
  makeOffer,
  updateOfferStatus,
} from "../../services/offer/offerService";

export const makeOfferHandler = async (req: Request, res: Response) => {
  try {
    const { amount, propertyId } = req.body;
    const buyerId = req.user!.id; // Extract from your Auth middleware
    const parsedBuyerId = parseInt(buyerId);

    const newOffer = await makeOffer({
      amount,
      property_id: propertyId,
      buyer_id: parsedBuyerId,
    });

    res.status(201).json(newOffer);
  } catch (error) {
    res.status(500).json({ message: "Error making offer", error });
  }
};

export const getPropertyOffers = async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;
    const offers = await getOffersByProperty(Number(propertyId));
    res.json(offers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching offers" });
  }
};

export const respondToOffer = async (req: Request, res: Response) => {
  try {
    const { offerId } = req.params;
    const { status } = req.body; // 'ACCEPTED' or 'REJECTED'
    const sellerId = req.user!.id;
    const parsedSellerId = parseInt(sellerId);

    // 1. Check if the current user owns the property linked to this offer
    const ownership = await getOfferOwnership(Number(offerId));

    if (!ownership || ownership.owner_id !== parsedSellerId) {
      return res
        .status(403)
        .json({ message: "Unauthorized to respond to this offer" });
    }

    const updatedOffer = await updateOfferStatus(Number(offerId), status);
    res.json(updatedOffer);
  } catch (error) {
    res.status(500).json({ message: "Error updating offer status" });
  }
};

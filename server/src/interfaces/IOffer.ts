export type OfferStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export interface Offer {
  id: number;
  amount: number;
  status: OfferStatus;
  property_id: number;
  buyer_id: number;
  made_at: Date;
}

export interface MakeOfferDTO {
  amount: number;
  propertyId: number;
  buyer_id: number;
}

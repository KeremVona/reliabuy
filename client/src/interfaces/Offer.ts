export interface ReceivedOffer {
  offer_id: number;
  amount: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  made_at: string;
  property_id: number;
  property_title: string;
  asking_price: number;
  buyer_name: string;
  buyer_email: string;
}

export interface Property {
  id?: number;
  user_id: number;
  title: string;
  description: string;
  price: number;
  address: string;
  images?: string[];
}

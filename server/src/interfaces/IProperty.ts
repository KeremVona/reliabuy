export interface Property {
  id?: number;
  user_id: number;
  title: string;
  description: string;
  price: number;
  address: string;
  images?: string[];
}

export interface PropertyGet {
  id?: number;
  user_id: number;
  title: string;
  description: string;
  price: number;
  address: string;
  image_url: string | null;
}

export interface PropertyFilters {
  title?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
}

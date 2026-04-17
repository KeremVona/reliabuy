export interface Property {
  id?: number;
  user_id: number;
  title: string;
  description: string;
  price: number;
  address: string;
}

export interface PropertyData {
  property_id: number;
  title: string;
  description: string;
  price: string | number; // PostgreSQL NUMERIC sometimes returns as a string in JavaScript
  address: string;
  publisher_id: number;
  publisher_name: string;
  publisher_email: string;
}

export interface PropertyFormData {
  title: string;
  description: string;
  price: number | "";
  address: string;
  user_id: number | "";
  images: string[];
}

export interface PropertyDetailData {
  id: number;
  user_id: number;
  title: string;
  description: string;
  price: string | number;
  address: string;
  images: string[];
}

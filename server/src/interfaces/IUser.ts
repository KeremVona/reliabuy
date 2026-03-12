export interface User {
  id?: number;
  fullname: string;
  email: string;
  password?: string; // Optional because we usually don't want to return it to the frontend
  city: string;
  isBuyer: boolean;
}

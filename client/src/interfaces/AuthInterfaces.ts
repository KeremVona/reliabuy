export interface RegisterRequestBody {
  fullname: string;
  email: string;
  password: string;
  city: string;
  isBuyer: boolean;
}

export interface LoginRequestBody {
  email: string;
  password: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  unit: string;
  minOrder: number;
  minOrderUnit: string;
  image: string;
  category: string;
  featured?: boolean;
  inStock?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface User {
  id: string;
  companyName: string;
  email: string;
}

export interface Order {
  id: string;
  userId: string;
  date: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'paid' | 'processing' | 'shipped';
  paymentMethod: 'PIX' | 'CREDIT' | 'DEBIT';
}

export enum SignupStep {
  COMPANY_INFO = 0,
  ADDRESS = 1,
  CONTACTS = 2,
  LEGAL_REP = 3,
  PASSWORD = 4
}

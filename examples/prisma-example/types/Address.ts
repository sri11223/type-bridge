import type { User } from './User';
import type { Order } from './Order';

/** Auto-generated from prisma schema */
export interface Address {
  id: string;
  userId: string;
  user: User;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  orders: Order[];
}
import { Role } from './enums';
import type { Order } from './Order';
import type { Cart } from './Cart';
import type { Review } from './Review';
import type { Address } from './Address';

/** Auto-generated from prisma schema */
export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
  orders: Order[];
  cart?: Cart | null;
  reviews: Review[];
  addresses: Address[];
}
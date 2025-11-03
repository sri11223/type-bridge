import type { User } from './User';
import type { CartItem } from './CartItem';

/** Auto-generated from prisma schema */
export interface Cart {
  id: string;
  userId: string;
  user: User;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}
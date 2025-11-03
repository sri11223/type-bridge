import type { User } from './User';
import type { Product } from './Product';

/** Auto-generated from prisma schema */
export interface Review {
  id: string;
  userId: string;
  user: User;
  productId: string;
  product: Product;
  rating: number;
  comment?: string | null;
  createdAt: string;
}
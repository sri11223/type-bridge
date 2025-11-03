import type { CartItem } from './CartItem';
import type { OrderItem } from './OrderItem';
import type { Review } from './Review';

/** Auto-generated from prisma schema */
export interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  category: string;
  imageUrl?: string | null;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  cartItems: CartItem[];
  orderItems: OrderItem[];
  reviews: Review[];
}
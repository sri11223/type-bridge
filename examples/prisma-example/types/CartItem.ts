import type { Cart } from './Cart';
import type { Product } from './Product';

/** Auto-generated from prisma schema */
export interface CartItem {
  id: string;
  cartId: string;
  cart: Cart;
  productId: string;
  product: Product;
  quantity: number;
}
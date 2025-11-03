import type { Order } from './Order';
import type { Product } from './Product';

/** Auto-generated from prisma schema */
export interface OrderItem {
  id: string;
  orderId: string;
  order: Order;
  productId: string;
  product: Product;
  quantity: number;
  price: number;
}
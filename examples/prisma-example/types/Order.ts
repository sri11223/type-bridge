import { OrderStatus } from './enums';
import type { User } from './User';
import type { OrderItem } from './OrderItem';
import type { Address } from './Address';

/** Auto-generated from prisma schema */
export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  user: User;
  status: OrderStatus;
  total: number;
  items: OrderItem[];
  shippingAddressId?: string | null;
  shippingAddress?: Address | null;
  createdAt: string;
  updatedAt: string;
}
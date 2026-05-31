/**
 * Shared Type Definitions for Issa Kitchen
 */

export type UserRole = 'customer' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface FoodItem {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  image: string;
  preparationTime: number; // in minutes
  isFeatured: boolean;
  isPopular: boolean;
  isAvailable: boolean;
  createdAt: string;
}

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Preparing'
  | 'Ready'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export type PaymentMethod = 'Cash on Delivery' | 'M-Pesa' | 'Card Payments';

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryLocation: string;
  deliveryAddress: string;
  deliveryNotes?: string;
  paymentMethod: PaymentMethod;
  totalAmount: number;
  deliveryFee: number;
  status: OrderStatus;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  foodItemId: string;
  foodItemName: string;
  foodItemImage: string;
  quantity: number;
  price: number;
}

export interface Review {
  id: string;
  customerId: string;
  customerName: string;
  foodItemId: string;
  foodItemName: string;
  rating: number; // 1 to 5
  review: string;
  isApproved: boolean; // Moderation flag
  createdAt: string;
}

export interface CustomerAddress {
  id: string;
  customerId: string;
  location: string;
  address: string;
  notes?: string;
}

// Frontend cart state representation
export interface CartItem {
  foodItem: FoodItem;
  quantity: number;
}

export interface Category {
  id: string; name: string; slug: string; description: string; icon: string;
  isActive: boolean; sortOrder: number; itemCount?: number;
}
export interface Product {
  id: string; name: string; nativeTitle: string; category: string; origin: string; weight: string;
  price: number; originalPrice: number; description: string; ingredients: string[]; shelfLife: string;
  image: string; badge: string; isVeg: boolean; stock: number; lowStockThreshold: number;
  isActive: boolean; isTopSeller: boolean; inStock: boolean; createdAt?: string;
}
export interface Address {
  id: string; label: string; name: string; phone: string; line1: string; landmark: string;
  city: string; state: string; pincode: string; isDefault: boolean;
}
export interface User { id: string; name: string; email: string; picture: string; phone: string; addresses: Address[]; }

export type OrderStatus = 'PLACED' | 'CONFIRMED' | 'PREPARING' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
export interface OrderItem { product: string; name: string; weight: string; image: string; price: number; quantity: number; }
export interface Order {
  id: string; orderNumber: string; customerName: string; customerEmail: string; customerPhone: string;
  address: Omit<Address, 'id' | 'isDefault'>; items: OrderItem[];
  subtotal: number; discount: number; couponCode: string; shippingFee: number; total: number;
  paymentMethod: 'COD' | 'ONLINE'; paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  status: OrderStatus; statusHistory: { status: OrderStatus; note: string; at: string }[];
  tracking: { courier: string; trackingNumber: string; trackingUrl: string; estimatedDelivery: string | null };
  customerNote: string; createdAt: string;
}
export interface Settings {
  storeName: string; tagline: string; announcement: string; isAcceptingOrders: boolean; pausedMessage: string;
  freeShippingThreshold: number; shippingFee: number; codEnabled: boolean; onlinePaymentEnabled: boolean;
  contactPhone: string; contactEmail: string; whatsapp: string; address: string;
  heroImage: string; heroTitle: string; heroSubtitle: string;
}
export interface Coupon {
  id: string; code: string; description: string; type: 'PERCENT' | 'FLAT'; value: number; maxDiscount: number;
  minOrder: number; expiresAt: string | null; usageLimit: number; timesUsed: number; isActive: boolean;
}
export interface Quote {
  lines: { productId: string; name: string; weight: string; image: string; price: number; stock: number; quantity: number }[];
  subtotal: number; discount: number; shippingFee: number; total: number;
  couponCode: string; couponError: string; problems: string[];
}
export interface Page<T> { items: T[]; total: number; page: number; pages: number; }

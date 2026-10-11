import type { OrderStatus } from './types';

export const rupees = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
export const dateTime = (d?: string | null) =>
  d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '';
export const dateOnly = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PLACED: 'Order placed', CONFIRMED: 'Confirmed', PREPARING: 'Being prepared', SHIPPED: 'Shipped',
  OUT_FOR_DELIVERY: 'Out for delivery', DELIVERED: 'Delivered', CANCELLED: 'Cancelled',
};
export const STATUS_HELP: Record<OrderStatus, string> = {
  PLACED: 'We have received your order.',
  CONFIRMED: 'Your order is confirmed.',
  PREPARING: 'Your items are being freshly prepared and packed.',
  SHIPPED: 'Your parcel has been handed to the courier.',
  OUT_FOR_DELIVERY: 'The courier is on the way to your address.',
  DELIVERED: 'Your order has been delivered. Enjoy!',
  CANCELLED: 'This order was cancelled.',
};
export const STATUS_COLOR: Record<OrderStatus, string> = {
  PLACED: 'bg-amber-100 text-amber-800', CONFIRMED: 'bg-sky-100 text-sky-800', PREPARING: 'bg-orange-100 text-orange-800',
  SHIPPED: 'bg-indigo-100 text-indigo-800', OUT_FOR_DELIVERY: 'bg-violet-100 text-violet-800',
  DELIVERED: 'bg-green-100 text-green-800', CANCELLED: 'bg-red-100 text-red-700',
};
export const FLOW: OrderStatus[] = ['PLACED', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

export const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh',
  'Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha',
  'Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir',
  'Ladakh','Lakshadweep','Puducherry',
];

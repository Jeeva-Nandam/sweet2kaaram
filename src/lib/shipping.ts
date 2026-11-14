import { rupees } from './format';

export function freeShippingMessage(subtotal: number, threshold: number | null): string {
  if (threshold === null) return 'Select a delivery state to calculate shipping.';
  if (subtotal >= threshold) return "Congratulations! You've unlocked FREE SHIPPING!";
  return `Add ₹${(threshold - subtotal).toLocaleString('en-IN')} more for FREE SHIPPING!`;
}

export function shippingRateHint(state: string, fee: number | null, threshold: number | null): string {
  if (!state) return 'Select a delivery state to see shipping details.';
  if (fee === null || threshold === null) return `Calculating shipping for ${state}…`;
  const rate = fee === 0 ? 'Free delivery unlocked for this order.' : `Shipping for this order: ${rupees(fee)}.`;
  return `Free delivery starts from ${rupees(threshold)} in ${state}. ${rate}`;
}

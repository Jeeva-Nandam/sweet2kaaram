export function freeShippingMessage(subtotal: number, threshold: number | null): string {
  if (threshold === null) return 'Select a delivery state to calculate shipping.';
  if (subtotal >= threshold) return "Congratulations! You've unlocked FREE SHIPPING!";
  return `Add ₹${(threshold - subtotal).toLocaleString('en-IN')} more for FREE SHIPPING!`;
}

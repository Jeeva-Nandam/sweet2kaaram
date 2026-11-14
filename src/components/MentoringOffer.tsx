import { rupees } from '../lib/format';
import { Icon } from './ui';

const MENTORING_THRESHOLD = 3000;

interface MentoringOfferProps {
  subtotal: number;
  discount: number;
  orderPlaced?: boolean;
}

export default function MentoringOffer({ subtotal, discount, orderPlaced = false }: MentoringOfferProps) {
  const qualifyingSubtotal = Math.max(0, subtotal - discount);
  const remaining = Math.max(0, MENTORING_THRESHOLD - qualifyingSubtotal);
  const progress = Math.min(100, (qualifyingSubtotal / MENTORING_THRESHOLD) * 100);
  const qualified = remaining === 0;

  return (
    <section aria-label="Mentoring offer" className={`rounded-xl border p-4 ${qualified ? 'border-[#d7b16b]/60 bg-[#fff8e9]' : 'border-border-warm bg-surface-container-low'}`}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-sm">
          <Icon name="school" className="text-xl" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-on-surface">
            {qualified
              ? (orderPlaced ? 'Your order qualifies!' : 'Your cart qualifies!')
              : orderPlaced ? 'This order did not reach the offer threshold' : 'Unlock your mentoring offer'}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
            {qualified
              ? 'You qualify for 1-Year Free Career & Personal Empowerment Mentoring with Zero2Billion.'
              : orderPlaced
                ? `Your qualifying item subtotal was ${rupees(qualifyingSubtotal)}. Orders with an item subtotal of ${rupees(MENTORING_THRESHOLD)} or more qualify for 1-Year Free Career & Personal Empowerment Mentoring with Zero2Billion.`
                : `Add ${rupees(remaining)} more in qualifying items to unlock 1-Year Free Career & Personal Empowerment Mentoring with Zero2Billion.`}
          </p>
        </div>
      </div>
      {!qualified && !orderPlaced && (
        <div className="mt-3">
          <div
            role="progressbar"
            aria-label="Progress toward the mentoring offer"
            aria-valuemin={0}
            aria-valuemax={MENTORING_THRESHOLD}
            aria-valuenow={Math.min(qualifyingSubtotal, MENTORING_THRESHOLD)}
            className="h-2 overflow-hidden rounded-full bg-white"
          >
            <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1.5 text-right text-xs font-semibold text-on-surface-variant">
            {rupees(qualifyingSubtotal)} / {rupees(MENTORING_THRESHOLD)}
          </p>
        </div>
      )}
      <p className="mt-2 text-[11px] leading-relaxed text-text-muted">
        Based on item subtotal after discounts; shipping is excluded.
      </p>
    </section>
  );
}

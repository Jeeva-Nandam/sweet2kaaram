import { dateTime, FLOW, STATUS_HELP, STATUS_LABEL } from '../lib/format';
import type { Order, OrderStatus } from '../lib/types';
import { Icon } from './ui';

/** Vertical timeline, used on the customer order page. Steps an admin skipped are shown as done, without a time. */
export default function OrderTimeline({ order }: { order: Order }) {
  const at = (s: OrderStatus) => order.statusHistory.find((h) => h.status === s);
  const cancelled = order.status === 'CANCELLED';
  const reached = Math.max(...order.statusHistory.filter((h) => h.status !== 'CANCELLED').map((h) => FLOW.indexOf(h.status)), 0);

  return (
    <ol className="relative">
      {FLOW.map((s, i) => {
        const done = i <= reached;
        const current = !cancelled && i === reached && s !== 'DELIVERED';
        const last = i === FLOW.length - 1 && !cancelled;
        const entry = at(s);
        return (
          <li key={s} className="flex gap-4 pb-6 last:pb-0 relative">
            {!last && <span className={`absolute left-[15px] top-8 bottom-0 w-0.5 ${done && i < reached ? 'bg-tertiary' : 'bg-border-warm'}`} />}
            <span className={`z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${done ? (cancelled && i === reached ? 'bg-surface-dim text-white' : 'bg-tertiary text-white') : 'bg-white border-2 border-border-warm text-border-warm'} ${current ? 'ring-4 ring-tertiary/20' : ''}`}>
              <Icon name={done ? 'check' : 'circle'} className="text-lg" />
            </span>
            <div className="pt-0.5">
              <div className={`text-sm font-bold ${done ? 'text-on-surface' : 'text-text-muted'}`}>{STATUS_LABEL[s]}</div>
              {(done || current) && <div className="text-xs text-text-muted mt-0.5">{entry ? dateTime(entry.at) : ''}{entry?.note && entry.note !== 'Order placed' ? ` · ${entry.note}` : ''}</div>}
              {current && <div className="text-sm text-on-surface-variant mt-1">{STATUS_HELP[s]}</div>}
            </div>
          </li>
        );
      })}
      {cancelled && (
        <li className="flex gap-4 pt-6 relative">
          <span className="w-8 h-8 rounded-full bg-error text-white flex items-center justify-center shrink-0"><Icon name="close" className="text-lg" /></span>
          <div className="pt-0.5">
            <div className="text-sm font-bold text-error">Cancelled</div>
            <div className="text-xs text-text-muted">{dateTime(at('CANCELLED')?.at)}{at('CANCELLED')?.note ? ` · ${at('CANCELLED')?.note}` : ''}</div>
          </div>
        </li>
      )}
    </ol>
  );
}

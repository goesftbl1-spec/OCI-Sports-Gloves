import { Currency } from '../types';

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  EUR: '€',
  GBP: '£',
  USD: '$'
};

export const CURRENCY_RATES: Record<Currency, number> = {
  EUR: 1.0,
  GBP: 0.86,
  USD: 1.09
};

export function formatPrice(priceInEur: number, currency: Currency): string {
  const rate = CURRENCY_RATES[currency] || 1;
  const converted = priceInEur * rate;
  const symbol = CURRENCY_SYMBOLS[currency] || '€';
  return `${symbol}${converted.toFixed(2)}`;
}

export interface FormattedDateTime {
  dateStr: string; // e.g. "26 September 2026"
  timeStr: string; // e.g. "10:42 PM"
  fullStr: string; // e.g. "26 September 2026 • 10:42 PM"
}

export function formatOrderDateTime(rawDate: string | number | undefined | null): FormattedDateTime {
  if (!rawDate) {
    return { dateStr: 'Date pending', timeStr: '--:--', fullStr: 'Date pending' };
  }

  let d: Date | null = null;
  if (typeof rawDate === 'number') {
    d = new Date(rawDate);
  } else if (typeof rawDate === 'string') {
    const rawClean = rawDate.replace(/\bSept\b/gi, 'Sep').trim();
    const parsed = new Date(rawClean);
    if (!isNaN(parsed.getTime())) {
      d = parsed;
    } else {
      const cleaned = rawClean.replace(/,/g, '');
      const alt = new Date(cleaned);
      if (!isNaN(alt.getTime())) {
        d = alt;
      }
    }
  }

  if (d && !isNaN(d.getTime())) {
    const dateStr = d.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const timeStr = d.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return {
      dateStr,
      timeStr,
      fullStr: `${dateStr} at ${timeStr}`,
    };
  }

  return {
    dateStr: String(rawDate),
    timeStr: '',
    fullStr: String(rawDate),
  };
}

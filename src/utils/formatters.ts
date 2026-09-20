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

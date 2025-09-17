import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// Currency formatting utility
export type Currency = 'PESOS' | 'USD' | 'EUR';

export function formatCurrency(amount: number, currency: Currency = 'PESOS'): string {
    const currencySymbols = {
        PESOS: '$',
        USD: 'USD $',
        EUR: 'EUR €'
    };

    const locales = {
        PESOS: 'es-CL',
        USD: 'en-US',
        EUR: 'de-DE'
    };

    const symbol = currencySymbols[currency];
    const locale = locales[currency];
    const formattedAmount = amount.toLocaleString(locale);

    return `${symbol}${formattedAmount}`;
}

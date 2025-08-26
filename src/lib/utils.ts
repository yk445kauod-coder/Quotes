import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = "EGP") {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    numberingSystem: "arab", // Ensure Arabic-Indic numerals are used
  }).format(amount);
}

/**
 * Formats a number to a string using Hindi (Arabic-Indic) numerals.
 * @param num The number to format.
 * @returns A string representation of the number with Hindi numerals.
 */
export function formatNumberToHindi(num: number): string {
    return new Intl.NumberFormat('ar-EG-u-nu-arab').format(num);
}


// This function is no longer needed as ReactQuill has been removed.
// export function formatHtmlToText(html: string) {
//   if (typeof window === 'undefined') return html; // Return as is on server
//   const doc = new DOMParser().parseFromString(html, 'text/html');
//   return doc.body.textContent || "";
// }

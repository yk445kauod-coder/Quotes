
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
 * Formats a number to a string using Hindi (Arabic-Indic) numerals without grouping separators.
 * @param num The number to format.
 * @returns A string representation of the number with Hindi numerals.
 */
export function formatNumberToHindi(num: number): string {
    if (typeof num !== 'number') return '';
    return new Intl.NumberFormat('ar-EG-u-nu-arab', { useGrouping: false }).format(num);
}

const westernArabicToHindiMap: { [key: string]: string } = {
  '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤',
  '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩'
};

/**
 * Replaces all Western Arabic numerals in a string with their Hindi counterparts.
 * It also ensures there's a space between numbers and adjacent letters/symbols.
 * @param text The input string.
 * @returns The string with Hindi numerals and proper spacing.
 */
export function formatTextWithHindiNumerals(text: string): string {
  if (typeof text !== 'string') return '';
  
  // First, convert all western numerals to hindi numerals
  let processedText = text.replace(/[0-9]/g, (match) => westernArabicToHindiMap[match]);

  // Then, add a space between any sequence of digits and any adjacent non-digit/non-space character.
  // This is a more robust way to handle the spacing issue.
  const hindiNumerals = '٠١٢٣٤٥٦٧٨٩';
  // Add space after a number sequence if it's followed by a non-digit, non-space character
  processedText = processedText.replace(new RegExp(`([${hindiNumerals}]+)([^${hindiNumerals}\\s])`, 'g'), '$1 $2');
  // Add space before a number sequence if it's preceded by a non-digit, non-space character
  processedText = processedText.replace(new RegExp(`([^${hindiNumerals}\\s])([${hindiNumerals}]+)`, 'g'), '$1 $2');

  return processedText;
}


// This function is no longer needed as ReactQuill has been removed.
// export function formatHtmlToText(html: string) {
//   if (typeof window === 'undefined') return html; // Return as is on server
//   const doc = new DOMParser().parseFromString(html, 'text/html');
//   return doc.body.textContent || "";
// }

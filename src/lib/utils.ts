
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
 * Replaces all Western Arabic numerals in a string with their Hindi counterparts
 * and ensures there's a space between numbers and adjacent letters/symbols.
 * This function is designed to handle various cases of stuck numbers and text.
 * @param text The input string.
 * @returns The string with Hindi numerals and proper spacing.
 */
export function formatTextWithHindiNumerals(text: string): string {
  if (typeof text !== 'string') return '';
  
  // Step 1: Convert all western numerals to hindi numerals
  let processedText = text.replace(/[0-9]/g, (match) => westernArabicToHindiMap[match]);

  // Step 2: Add a space between any sequence of digits and any adjacent non-digit/non-space character.
  // This uses lookarounds to insert spaces without consuming the characters, which is more robust.
  const hindiNumerals = '٠١٢٣٤٥٦٧٨٩';
  const nonDigitNonSpace = `[^${hindiNumerals}\\s.,%-)—]`; // Include common punctuation to avoid spacing inside them
  
  // Add space AFTER a number sequence if it's followed by a letter/symbol.
  // Example: "١٤%المجموع" -> "١٤% المجموع"
  processedText = processedText.replace(new RegExp(`([${hindiNumerals}%.,-]+)(?=${nonDigitNonSpace})`, 'g'), '$1 ');
  
  // Add space BEFORE a number sequence if it's preceded by a letter/symbol.
  // Example: "مجموع١٤" -> "مجموع ١٤"
  processedText = processedText.replace(new RegExp(`(${nonDigitNonSpace})(?=[${hindiNumerals}])`, 'g'), '$1 ');

  return processedText;
}


// This function is no longer needed as ReactQuill has been removed.
// export function formatHtmlToText(html: string) {
//   if (typeof window === 'undefined') return html; // Return as is on server
//   const doc = new DOMParser().parseFromString(html, 'text/html');
//   return doc.body.textContent || "";
// }
